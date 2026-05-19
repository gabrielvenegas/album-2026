#!/usr/bin/env python3
"""Recorta figurinhas do PDF Grupo A (grid 4x4) e salva em public/stickers/."""
from __future__ import annotations

import json
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PDF = Path("/Users/marllondiniz/Desktop/GRUPO A.pdf")
PUBLIC = ROOT / "public" / "stickers"

WHITE_THRESHOLD = 248
GRID_ROWS = 4
GRID_COLS = 4
# Recuo dentro de cada célula para cortar linha pontilhada entre figurinhas
CELL_INSET = 0.045
# Pixels extras após remover branco da figurinha
CONTENT_PAD = 3
RENDER_SCALE = 3

SLOTS: dict[str, dict[tuple[int, int, int], int]] = {
    "mex": {
        (1, 0, 0): 1,
        (1, 0, 1): 13,
        (1, 0, 2): 2,
        (1, 0, 3): 6,
        (1, 1, 0): 3,
        (1, 1, 1): 5,
        (1, 1, 2): 7,
        (1, 1, 3): 4,
        (1, 2, 0): 11,
        (1, 2, 1): 8,
        (1, 2, 2): 10,
        (1, 2, 3): 14,
        (1, 3, 0): 9,
        (1, 3, 1): 12,
        (1, 3, 2): 17,
        (1, 3, 3): 16,
        (5, 0, 0): 15,
        (5, 0, 1): 18,
        (5, 0, 2): 20,
        (5, 0, 3): 19,
    },
    "rsa": {
        (2, 0, 0): 1,
        (2, 0, 1): 13,
        (2, 0, 2): 3,
        (2, 0, 3): 2,
        (2, 1, 0): 4,
        (2, 1, 1): 5,
        (2, 1, 2): 6,
        (2, 1, 3): 7,
        (2, 2, 0): 8,
        (2, 2, 1): 9,
        (2, 2, 2): 10,
        (2, 2, 3): 11,
        (2, 3, 0): 12,
        (2, 3, 1): 14,
        (2, 3, 2): 15,
        (2, 3, 3): 16,
        (5, 1, 0): 17,
        (5, 1, 1): 18,
        (5, 1, 2): 19,
        (5, 1, 3): 20,
    },
    "kor": {
        (3, 0, 0): 1,
        (3, 0, 1): 13,
        (3, 0, 2): 2,
        (3, 0, 3): 3,
        (3, 1, 0): 4,
        (3, 1, 1): 5,
        (3, 1, 2): 6,
        (3, 1, 3): 7,
        (3, 2, 0): 8,
        (3, 2, 1): 9,
        (3, 2, 2): 10,
        (3, 2, 3): 11,
        (3, 3, 0): 12,
        (3, 3, 1): 14,
        (3, 3, 2): 15,
        (3, 3, 3): 16,
        (5, 2, 0): 17,
        (5, 2, 1): 18,
        (5, 2, 2): 19,
        (5, 2, 3): 20,
    },
    "cze": {
        (4, 0, 0): 1,
        (4, 0, 1): 13,
        (4, 0, 2): 2,
        (4, 0, 3): 3,
        (4, 1, 0): 4,
        (4, 1, 1): 5,
        (4, 1, 2): 6,
        (4, 1, 3): 7,
        (4, 2, 0): 8,
        (4, 2, 1): 9,
        (4, 2, 2): 10,
        (4, 2, 3): 11,
        (4, 3, 0): 12,
        (4, 3, 1): 14,
        (4, 3, 2): 15,
        (4, 3, 3): 16,
        (5, 3, 0): 17,
        (5, 3, 1): 18,
        (5, 3, 2): 19,
        (5, 3, 3): 20,
    },
}


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
    """Remove margens brancas e marca d'água; retorna bbox da grade 4x4."""
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
    """Recorte justo ao conteúdo colorido da figurinha."""
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


def main() -> None:
    doc = fitz.open(PDF)
    pages: dict[int, Image.Image] = {}
    for i in range(doc.page_count):
        pix = doc[i].get_pixmap(matrix=fitz.Matrix(RENDER_SCALE, RENDER_SCALE))
        pages[i + 1] = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    doc.close()

    image_maps: dict[str, dict[int, str]] = {k: {} for k in SLOTS}
    grids: dict[int, Image.Image] = {}

    page_nums = {page for mapping in SLOTS.values() for (page, _, _) in mapping}
    for page_num in page_nums:
        grids[page_num] = page_to_grid(pages[page_num])

    for folder, mapping in SLOTS.items():
        out_dir = PUBLIC / folder
        out_dir.mkdir(parents=True, exist_ok=True)
        for (page, row, col), slot in mapping.items():
            cell = extract_cell(grids[page], row, col)
            name = f"{slot:02d}.png"
            cell.save(out_dir / name, "PNG", optimize=True)
            image_maps[folder][slot] = f"/stickers/{folder}/{name}"

    manifest = ROOT / "src" / "data" / "grupo-a-images.json"
    manifest.write_text(json.dumps(image_maps, indent=2), encoding="utf-8")
    for code, imgs in image_maps.items():
        print(f"{code.upper()}: {len(imgs)} figurinhas")


if __name__ == "__main__":
    main()
