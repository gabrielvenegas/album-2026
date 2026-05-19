#!/usr/bin/env python3
"""Sincroniza a ordem de players.ts com os nomes impressos nas figurinhas.

O script lê os nomes no rodapé dos PNGs em public/stickers/<time>/, compara com
os 18 nomes atuais daquele time em players.ts e reordena a lista quando a
correspondência por OCR for confiável. Casos com OCR fraco ficam no relatório.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import re
import unicodedata
from pathlib import Path

import numpy as np
import pytesseract
from PIL import Image, ImageOps
from rapidfuzz import fuzz
from scipy.optimize import linear_sum_assignment

ROOT = Path(__file__).resolve().parents[1]
PLAYERS_TS = ROOT / "src" / "data" / "players.ts"
PUBLIC_STICKERS = ROOT / "public" / "stickers"
REPORT = ROOT / "scripts" / "sync-roster-from-sticker-ocr-report.json"

PLAYER_SLOTS = list(range(2, 13)) + list(range(14, 21))


def strip_accents(value: str) -> str:
    return "".join(
        c
        for c in unicodedata.normalize("NFD", value)
        if unicodedata.category(c) != "Mn"
    )


def normalize(value: str) -> str:
    value = strip_accents(value.upper())
    value = re.sub(r"[^A-Z '\-]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def parse_rosters(text: str) -> dict[str, list[str]]:
    rosters: dict[str, list[str]] = {}
    for match in re.finditer(r"^  ([A-Z0-9]+): \[", text, re.MULTILINE):
        start = match.end()
        depth = 1
        end = start
        while end < len(text) and depth:
            if text[end] == "[":
                depth += 1
            elif text[end] == "]":
                depth -= 1
            end += 1
        body = text[start : end - 1]
        names = re.findall(r'^\s+"([^"]+)",', body, re.MULTILINE)
        rosters[match.group(1)] = names
    return rosters


def render_roster_block(code: str, names: list[str]) -> str:
    lines = [f"  {code}: ["]
    lines.extend(f'    "{name}",' for name in names)
    lines.append("  ],")
    return "\n".join(lines)


def replace_roster_block(text: str, code: str, names: list[str]) -> str:
    pattern = re.compile(rf"^  {re.escape(code)}: \[\n(?:^    .+\n)*^  \],", re.MULTILINE)
    return pattern.sub(render_roster_block(code, names), text)


def ocr_name_text(path: Path) -> str:
    img = Image.open(path)
    w, h = img.size
    best = ""
    for pct in (0.38, 0.42, 0.46, 0.50):
        crop = img.crop((0, int(h * pct), w, h))
        scale = min(4, 1600 / max(crop.width, crop.height))
        crop = crop.resize(
            (int(crop.width * scale), int(crop.height * scale)),
            Image.Resampling.LANCZOS,
        )
        gray = ImageOps.autocontrast(crop.convert("L"))
        text = pytesseract.image_to_string(gray, lang="eng", config="--oem 3 --psm 6")
        if len(normalize(text)) > len(normalize(best)):
            best = text
    return best


def score_name(ocr_text: str, name: str) -> int:
    target = normalize(name)
    lines = [normalize(line) for line in ocr_text.splitlines()]
    lines = [line for line in lines if len(line) >= 3 and not re.search(r"\d", line)]
    candidates = lines or [normalize(ocr_text)]
    return max(
        max(fuzz.token_sort_ratio(target, candidate), fuzz.partial_ratio(target, candidate))
        for candidate in candidates
    )


def sync_team(folder: Path, roster: list[str], min_score: int) -> tuple[list[str], dict]:
    result = {
        "team": folder.name.upper(),
        "ok": False,
        "mean": 0.0,
        "min": 0,
        "changes": [],
        "ocr": {},
    }
    if len(roster) != 18:
        result["error"] = f"elenco tem {len(roster)} nomes, esperado 18"
        return roster, result

    ocr_texts: list[str] = []
    for slot in PLAYER_SLOTS:
        path = folder / f"{slot:02d}.png"
        if not path.exists():
            result["error"] = f"faltando {path.name}"
            return roster, result
        text = ocr_name_text(path)
        ocr_texts.append(text)
        result["ocr"][str(slot)] = text

    scores = np.zeros((18, 18), dtype=np.float64)
    for name_idx, name in enumerate(roster):
        for slot_idx, text in enumerate(ocr_texts):
            scores[name_idx, slot_idx] = score_name(text, name)

    row_ind, col_ind = linear_sum_assignment(100.0 - scores)
    assigned_scores = [int(scores[row, col]) for row, col in zip(row_ind, col_ind)]
    result["mean"] = float(np.mean(assigned_scores))
    result["min"] = int(min(assigned_scores))

    if result["min"] < min_score:
        result["error"] = f"confiança mínima baixa ({result['min']} < {min_score})"
        return roster, result

    by_slot: dict[int, str] = {}
    for row, col in zip(row_ind, col_ind):
        by_slot[PLAYER_SLOTS[int(col)]] = roster[int(row)]

    new_roster = [by_slot[slot] for slot in PLAYER_SLOTS]
    result["changes"] = [
        {
            "slot": slot,
            "from": old,
            "to": new,
        }
        for slot, old, new in zip(PLAYER_SLOTS, roster, new_roster)
        if old != new
    ]
    result["ok"] = True
    return new_roster, result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("teams", nargs="*", help="Códigos: mex bih fra...")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--jobs", type=int, default=4)
    parser.add_argument("--min-score", type=int, default=58)
    args = parser.parse_args()

    text = PLAYERS_TS.read_text(encoding="utf-8")
    rosters = parse_rosters(text)
    wanted = {team.upper() for team in args.teams}
    teams = sorted(wanted or {path.name.upper() for path in PUBLIC_STICKERS.iterdir() if path.is_dir()})

    jobs: list[tuple[str, Path, list[str]]] = []
    for code in teams:
        folder = PUBLIC_STICKERS / code.lower()
        if not folder.exists() or code not in rosters:
            continue
        jobs.append((code, folder, rosters[code]))

    report = []
    synced: dict[str, list[str]] = {}

    def run_job(job: tuple[str, Path, list[str]]) -> tuple[str, list[str], dict]:
        code, folder, roster = job
        new_roster, item = sync_team(folder, roster, args.min_score)
        return code, new_roster, item

    with ThreadPoolExecutor(max_workers=max(1, args.jobs)) as executor:
        futures = [executor.submit(run_job, job) for job in jobs]
        for future in as_completed(futures):
            try:
                code, new_roster, item = future.result()
            except Exception as exc:  # mantém a varredura dos outros times
                item = {"ok": False, "error": str(exc)}
                report.append(item)
                print(f"  pendente: {exc}")
                continue
            print(f"Verificando {code}...")
            report.append(item)
            if item.get("ok") and item["changes"]:
                print(f"  {len(item['changes'])} posições ajustadas")
                synced[code] = new_roster
            elif item.get("ok"):
                print("  já estava alinhado")
            else:
                print(f"  pendente: {item.get('error')}")

    next_text = text
    for code in sorted(synced):
        next_text = replace_roster_block(next_text, code, synced[code])

    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    if not args.dry_run and next_text != text:
        PLAYERS_TS.write_text(next_text, encoding="utf-8")
    print(f"Relatório: {REPORT}")


if __name__ == "__main__":
    main()
