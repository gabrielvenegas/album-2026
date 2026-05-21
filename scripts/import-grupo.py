#!/usr/bin/env python3
"""Recorta figurinhas de PDFs Grupo A–L (grid 4x4) e salva em public/stickers/."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DESKTOP = Path("/Users/marllondiniz/Desktop")
PUBLIC = ROOT / "public" / "stickers"

WHITE_THRESHOLD = 248
GRID_ROWS = 4
GRID_COLS = 4
CELL_INSET = 0.045
CONTENT_PAD = 3
RENDER_SCALE = 3

_GRID_SLOTS = [1, 13, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16]

# Mescla por cima do mapa sequencial (ex.: dois slots trocados na folha).
SLOT_OVERRIDES: dict[str, dict[tuple[int, int, int], int]] = {
    "ger": {
        (1, 0, 2): 17,
        (5, 0, 0): 2,
    },
    "cuw": {
        (2, 1, 3): 17,
        (2, 2, 1): 7,
        (2, 2, 3): 12,
        (2, 3, 0): 11,
        (2, 3, 3): 9,
        (5, 1, 0): 16,
    },
    "civ": {
        (3, 3, 3): 20,
        (5, 2, 0): 16,
        (5, 2, 3): 17,
    },
    "ecu": {
        (4, 2, 2): 12,
        (4, 2, 3): 10,
        (4, 3, 0): 14,
        (4, 3, 1): 11,
    },
    "ned": {
        (1, 1, 0): 7,
        (1, 1, 2): 4,
        (1, 1, 3): 8,
        (1, 2, 0): 6,
        (1, 2, 2): 19,
        (1, 3, 0): 10,
        (5, 0, 2): 12,
    },
    "jpn": {
        (2, 0, 2): 8,
        (2, 2, 0): 15,
        (2, 2, 1): 2,
        (2, 2, 2): 14,
        (2, 3, 1): 9,
        (2, 3, 2): 10,
    },
    "egy": {
        (2, 2, 0): 16,
        (2, 2, 2): 8,
        (2, 3, 2): 10,
        (2, 3, 3): 19,
        (5, 1, 0): 15,
        (5, 1, 2): 17,
    },
    "esp": {
        (1, 0, 3): 11,
        (1, 2, 3): 3,
    },
    "cpv": {
        (2, 0, 3): 6,
        (2, 1, 2): 9,
        (2, 2, 1): 12,
        (2, 3, 0): 3,
    },
    "ksa": {
        (3, 1, 1): 16,
        (3, 2, 2): 20,
        (3, 2, 3): 10,
        (3, 3, 0): 11,
        (3, 3, 1): 17,
        (3, 3, 3): 14,
        (5, 2, 0): 12,
        (5, 2, 3): 5,
    },
    "fra": {
        (1, 0, 2): 12,
        (1, 0, 3): 20,
        (1, 2, 1): 17,
        (1, 2, 3): 2,
        (1, 3, 0): 11,
        (5, 0, 0): 9,
        (5, 0, 3): 3,
    },
    "sen": {
        (2, 2, 1): 11,
        (2, 2, 3): 9,
    },
    "nor": {
        (4, 1, 3): 9,
        (4, 2, 1): 7,
        (4, 2, 2): 12,
        (4, 3, 0): 14,
        (4, 3, 1): 16,
        (4, 3, 3): 10,
    },
    "alg": {
        (2, 1, 3): 12,
        (2, 2, 1): 20,
        (2, 3, 0): 9,
        (5, 1, 3): 7,
    },
    "cod": {
        (2, 0, 3): 19,
        (2, 1, 0): 15,
        (2, 2, 1): 4,
        (2, 2, 2): 18,
        (2, 3, 0): 17,
        (2, 3, 2): 3,
        (5, 1, 0): 12,
        (5, 1, 1): 10,
        (5, 1, 2): 9,
    },
    "uzb": {
        (3, 0, 3): 17,
        (3, 1, 1): 18,
        (3, 1, 3): 3,
        (3, 3, 0): 5,
        (5, 2, 0): 12,
        (5, 2, 1): 7,
    },
    "gha": {
        (3, 1, 1): 17,
        (5, 2, 0): 5,
    },
}

# Times por grupo (ordem das páginas 1–4 no PDF; pág. 5 = linha 0–3 com slots 17–20)
GROUP_TEAMS: dict[str, list[str]] = {
    "A": ["mex", "rsa", "kor", "cze"],
    "B": ["can", "bih", "qat", "sui"],
    "C": ["bra", "mar", "hai", "sco"],
    "D": ["usa", "par", "aus", "tur"],
    "E": ["ger", "cuw", "civ", "ecu"],
    "F": ["ned", "jpn", "swe", "tun"],
    "G": ["bel", "egy", "irn", "nzl"],
    "H": ["esp", "cpv", "ksa", "uru"],
    "I": ["fra", "sen", "irq", "nor"],
    "J": ["arg", "alg", "aut", "jor"],
    "K": ["por", "cod", "uzb", "col"],
    "L": ["eng", "cro", "gha", "pan"],
}


def _sequential_grid(
    page: int, page5: int, page5_row: int
) -> dict[tuple[int, int, int], int]:
    mapping: dict[tuple[int, int, int], int] = {}
    for i, slot in enumerate(_GRID_SLOTS):
        row, col = divmod(i, GRID_COLS)
        mapping[(page, row, col)] = slot
    for col, slot in enumerate((17, 18, 19, 20)):
        mapping[(page5, page5_row, col)] = slot
    return mapping


def slots_for_group(letter: str) -> dict[str, dict[tuple[int, int, int], int]]:
    teams = GROUP_TEAMS[letter.upper()]
    result: dict[str, dict[tuple[int, int, int], int]] = {}
    for i, folder in enumerate(teams):
        base = _sequential_grid(i + 1, 5, i)
        extra = SLOT_OVERRIDES.get(folder)
        if extra:
            merged = {**base, **extra}
            result[folder] = merged
        else:
            result[folder] = base
    return result


def pixel_is_white(pixel: tuple[int, ...], threshold: int = WHITE_THRESHOLD) -> bool:
    return all(c >= threshold for c in pixel[:3])


def row_fill_ratio(img: Image.Image, y: int, threshold: int = WHITE_THRESHOLD) -> float:
    px = img.load()
    w = img.width
    white = sum(1 for x in range(w) if pixel_is_white(px[x, y], threshold))
    return white / w


def col_fill_ratio(img: Image.Image, x: int, threshold: int = WHITE_THRESHOLD) -> float:
    px = img.load()
    h = img.height
    white = sum(1 for y in range(h) if pixel_is_white(px[x, y], threshold))
    return white / h


def find_grid_bbox(img: Image.Image, min_content: float = 0.9) -> tuple[int, int, int, int]:
    w, h = img.size
    top = 0
    for y in range(h):
        if row_fill_ratio(img, y) < min_content:
            top = y
            break

    bottom = h - 1
    for y in range(h - 1, -1, -1):
        if row_fill_ratio(img, y) < min_content:
            bottom = y
            break

    left = 0
    for x in range(w):
        if col_fill_ratio(img, x) < min_content:
            left = x
            break

    right = w - 1
    for x in range(w - 1, -1, -1):
        if col_fill_ratio(img, x) < min_content:
            right = x
            break

    return left, top, right + 1, bottom + 1


def trim_white_borders(img: Image.Image, threshold: int = WHITE_THRESHOLD) -> Image.Image:
    px = img.load()
    w, h = img.size
    min_x, min_y = w, h
    max_x, max_y = 0, 0
    found = False

    for y in range(h):
        for x in range(w):
            if not pixel_is_white(px[x, y], threshold):
                found = True
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if not found:
        return img

    min_x = max(0, min_x - CONTENT_PAD)
    min_y = max(0, min_y - CONTENT_PAD)
    max_x = min(w, max_x + CONTENT_PAD + 1)
    max_y = min(h, max_y + CONTENT_PAD + 1)
    return img.crop((min_x, min_y, max_x, max_y))


def extract_cell(grid: Image.Image, row: int, col: int) -> Image.Image:
    w, h = grid.size
    cw = w / GRID_COLS
    ch = h / GRID_ROWS
    x0 = int(col * cw + cw * CELL_INSET)
    y0 = int(row * ch + ch * CELL_INSET)
    x1 = int((col + 1) * cw - cw * CELL_INSET)
    y1 = int((row + 1) * ch - ch * CELL_INSET)
    cell = grid.crop((x0, y0, x1, y1))
    return trim_white_borders(cell)


def page_to_grid(page_img: Image.Image) -> Image.Image:
    bbox = find_grid_bbox(page_img)
    return page_img.crop(bbox)


def import_group(letter: str) -> dict[str, dict[int, str]]:
    letter = letter.upper()
    if letter not in GROUP_TEAMS:
        raise SystemExit(f"Grupo desconhecido: {letter}")

    pdf = DESKTOP / f"GRUPO {letter}.pdf"
    if not pdf.exists():
        raise SystemExit(f"PDF não encontrado: {pdf}")

    slots = slots_for_group(letter)
    doc = fitz.open(pdf)
    pages: dict[int, Image.Image] = {}
    for i in range(doc.page_count):
        pix = doc[i].get_pixmap(matrix=fitz.Matrix(RENDER_SCALE, RENDER_SCALE))
        pages[i + 1] = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    doc.close()

    image_maps: dict[str, dict[int, str]] = {k: {} for k in slots}
    grids: dict[int, Image.Image] = {}

    page_nums = {page for mapping in slots.values() for (page, _, _) in mapping}
    for page_num in page_nums:
        grids[page_num] = page_to_grid(pages[page_num])

    for folder, mapping in slots.items():
        out_dir = PUBLIC / folder
        out_dir.mkdir(parents=True, exist_ok=True)
        for (page, row, col), slot in mapping.items():
            cell = extract_cell(grids[page], row, col)
            name = f"{slot:02d}.png"
            cell.save(out_dir / name, "PNG", optimize=True)
            image_maps[folder][slot] = f"/stickers/{folder}/{name}"

    manifest = ROOT / "src" / "data" / f"grupo-{letter.lower()}-images.json"
    manifest.write_text(json.dumps(image_maps, indent=2), encoding="utf-8")
    return image_maps


def main() -> None:
    letters = [a.upper() for a in sys.argv[1:]] if len(sys.argv) > 1 else list(GROUP_TEAMS)
    for letter in letters:
        maps = import_group(letter)
        for code, imgs in maps.items():
            print(f"Grupo {letter} {code.upper()}: {len(imgs)} figurinhas")


if __name__ == "__main__":
    main()
