#!/usr/bin/env python3
"""
Reorganiza figurinhas por jogador: lê o nome na imagem (OCR), cruza com players.ts
e grava cada PNG no slot correto (2–12 e 14–20). Escudo (01) e foto (13) não mudam.

Requisitos: tesseract no PATH, Pillow, rapidfuzz, scipy, pytesseract.
  .venv-pdf/bin/pip install pytesseract Pillow rapidfuzz scipy

Uso:
  .venv-pdf/bin/python3 scripts/reorder-stickers-by-roster-ocr.py
  .venv-pdf/bin/python3 scripts/reorder-stickers-by-roster-ocr.py fra arg eng   # só estes
  # Grupo A/B (mex, rsa, kor, cze, can, bih, qat, sui) são ignorados por padrão.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
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

PLAYER_SLOTS = list(range(2, 13)) + list(range(14, 21))  # 18 slots

# Importação por PDF com mapa de células — não passar OCR em massa.
# Grupo A: import-grupo-a.py | Grupo B: import-grupo-b.py
SKIP_OCR_FOLDERS = frozenset(
    {
        "mex",
        "rsa",
        "kor",
        "cze",
        "can",
        "bih",
        "qat",
        "sui",
    }
)


def strip_accents(s: str) -> str:
    return "".join(
        c
        for c in unicodedata.normalize("NFD", s)
        if unicodedata.category(c) != "Mn"
    )


def parse_rosters(ts_path: Path) -> dict[str, list[str]]:
    text = ts_path.read_text(encoding="utf-8")
    rosters: dict[str, list[str]] = {}
    for m in re.finditer(r"^\s*([A-Z0-9]+):\s*\[", text, re.MULTILINE):
        start = m.end()
        depth = 1
        i = start
        while i < len(text) and depth:
            if text[i] == "[":
                depth += 1
            elif text[i] == "]":
                depth -= 1
            i += 1
        body = text[start : i - 1]
        names = re.findall(r'"([^"]+)"', body)
        if names:
            rosters[m.group(1)] = names
    return rosters


def ocr_bottom_name_block(img: Image.Image) -> str:
    w, h = img.size
    for pct in (0.40, 0.42, 0.45, 0.48, 0.50):
        crop = img.crop((0, int(h * pct), w, h))
        nh = max(1, crop.height)
        nw = max(1, crop.width)
        scale = min(3, 1200 / max(nw, nh))
        crop = crop.resize((int(nw * scale), int(nh * scale)), Image.Resampling.LANCZOS)
        gray = ImageOps.autocontrast(crop.convert("L"))
        cfg = r"--oem 3 --psm 6"
        text = pytesseract.image_to_string(gray, lang="eng", config=cfg)
        if len(strip_accents(text.strip())) > 8:
            return text
    gray = ImageOps.autocontrast(img.convert("L"))
    return pytesseract.image_to_string(gray, lang="eng", config=r"--oem 3 --psm 11")


def best_score_for_player(ocr_text: str, player_name: str) -> int:
    o = strip_accents(ocr_text.upper())
    lines = [ln.strip() for ln in o.splitlines() if len(ln.strip()) > 2]
    if not lines:
        return 0
    p = strip_accents(player_name.upper())
    best = 0
    for line in lines:
        best = max(best, fuzz.token_sort_ratio(p, line))
        best = max(best, fuzz.partial_ratio(p, line))
    best = max(best, fuzz.token_sort_ratio(p, o))
    return int(best)


def roster_index_to_slot(idx: int) -> int:
    if idx < 11:
        return idx + 2  # 0..10 -> 2..12
    return idx + 3  # 11..17 -> 14..20


def process_team(
    folder: Path,
    roster: list[str],
    dry_run: bool,
    min_mean_score: float,
) -> dict:
    out: dict = {"folder": folder.name, "ok": False, "mean": 0.0, "moves": []}
    if len(roster) != 18:
        out["error"] = f"elenco com {len(roster)} jogadores, esperado 18"
        return out

    ocr_texts: list[str] = []
    images: list[Image.Image] = []
    for slot in PLAYER_SLOTS:
        p = folder / f"{slot:02d}.png"
        if not p.exists():
            out["error"] = f"falta {p.name}"
            return out
        im = Image.open(p).copy()
        images.append(im)
        ocr_texts.append(ocr_bottom_name_block(im))

    scores = np.zeros((18, 18), dtype=np.float64)
    for i in range(18):
        for j in range(18):
            scores[i, j] = best_score_for_player(ocr_texts[j], roster[i])

    cost = 100.0 - scores
    ri, ci = linear_sum_assignment(cost)
    assigned = [scores[ri[k], ci[k]] for k in range(18)]
    mean_assigned = float(np.mean(assigned))
    out["mean"] = mean_assigned

    if mean_assigned < min_mean_score:
        out["skip"] = (
            f"média de confiança {mean_assigned:.1f} < {min_mean_score} — ignorando time"
        )
        return out

    moves = []
    for k in range(18):
        i = int(ri[k])
        j = int(ci[k])
        target_slot = roster_index_to_slot(i)
        source_slot = PLAYER_SLOTS[j]
        if source_slot != target_slot:
            moves.append(f"{source_slot:02d}.png -> slot {target_slot} ({roster[i]})")
        out["moves"] = moves

    if dry_run:
        out["ok"] = True
        out["dry_run"] = True
        return out

    tmp_paths: dict[int, Path] = {}
    for k in range(18):
        i = int(ri[k])
        j = int(ci[k])
        target_slot = roster_index_to_slot(i)
        tmp = folder / f"._tmp_{target_slot}.png"
        images[j].save(tmp, "PNG", optimize=True)
        tmp_paths[target_slot] = tmp

    for slot in PLAYER_SLOTS:
        tmp = tmp_paths[slot]
        dest = folder / f"{slot:02d}.png"
        tmp.replace(dest)

    out["ok"] = True
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "teams",
        nargs="*",
        help="Pastas em public/stickers (ex: fra eng). Vazio = todas.",
    )
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--min-mean",
        type=float,
        default=52.0,
        help="Se a média dos scores da atribuição ótima for menor, não grava.",
    )
    ap.add_argument(
        "--force",
        action="store_true",
        help="Permite OCR mesmo nas pastas do Grupo A/B (PDF mapeado)",
    )
    args = ap.parse_args()

    rosters = parse_rosters(PLAYERS_TS)
    dirs = sorted(PUBLIC_STICKERS.iterdir())
    folders = [d for d in dirs if d.is_dir()]

    if args.teams:
        want = {t.lower() for t in args.teams}
        folders = [f for f in folders if f.name.lower() in want]

    report: list[dict] = []
    for folder in folders:
        code = folder.name.upper()
        low = folder.name.lower()
        if low in SKIP_OCR_FOLDERS and not args.force:
            print(
                f"  [skip] {folder.name}: mapeamento pela folha (import-grupo-a); use --force p/ OCR",
                flush=True,
            )
            report.append(
                {
                    "folder": folder.name,
                    "ok": True,
                    "skip": "SKIP_OCR_FOLDERS (Grupo A)",
                },
            )
            continue
        if code not in rosters:
            print(f"  [skip] {folder.name}: sem elenco em players.ts", file=sys.stderr)
            continue
        print(f"Processando {folder.name} …", flush=True)
        r = process_team(
            folder,
            rosters[code],
            dry_run=args.dry_run,
            min_mean_score=args.min_mean,
        )
        report.append(r)
        if r.get("error"):
            print(f"  ERRO: {r['error']}", file=sys.stderr)
        elif r.get("skip"):
            print(f"  {r['skip']}")
        elif r.get("dry_run"):
            print(f"  dry-run ok, média={r['mean']:.1f}, trocas={len(r.get('moves', []))}")
        else:
            print(f"  ok, média={r['mean']:.1f}, {len(r.get('moves', []))} arquivos renomeados/alinhados")

    rep_path = ROOT / "scripts" / "ocr-reorder-report.json"
    rep_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Relatório: {rep_path}")


if __name__ == "__main__":
    main()
