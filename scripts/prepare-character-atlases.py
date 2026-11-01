"""Normalize generated transparent atlases into padded 4x4 WebP game sheets.
Usage: python scripts/prepare-character-atlases.py sewer.png depths.png tower.png silver.png
Only packing/resizing is performed; all character art comes from image generation.
"""
from pathlib import Path
import sys
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent.parent
sources = sys.argv[1:]
weapons = bool(sources and sources[0] == '--weapons')
if weapons: sources = sources[1:]
names = ['weapons-a', 'weapons-b'] if weapons else ['sewer-cast', 'depths-cast', 'tower-cast', 'silver-cast']
assert len(sources) == len(names), 'Provide two weapon atlases with --weapons, or four character atlases'
for name, source in zip(names, sources):
    image = Image.open(source).convert('RGBA')
    pixels = np.array(image)
    pixels[pixels[:, :, 3] <= 32] = 0
    image = Image.fromarray(pixels)
    alpha = np.asarray(image.getchannel('A'))
    h, w = alpha.shape
    assert alpha.min() == 0 and alpha.max() > 200, 'Transparent sprites required'
    rows = [0]
    for i in range(1, 4):
        lo, hi = int(h*(i/4-.05)), int(h*(i/4+.05))
        rows.append(lo+int((alpha[lo:hi] > 64).sum(axis=1).argmin()))
    rows.append(h)
    atlas = Image.new('RGBA', (768, 768))
    for row in range(4):
        cuts = [0]
        for col in range(1, 4):
            lo, hi = int(w*(col/4-.04)), int(w*(col/4+.04))
            cuts.append(lo+int((alpha[rows[row]:rows[row+1], lo:hi] > 64).sum(axis=0).argmin()))
        cuts.append(w)
        cells = []
        for col in range(4):
            cell = image.crop((cuts[col], rows[row], cuts[col+1], rows[row+1]))
            mask = cell.getchannel('A').point(lambda a: 255 if a > 32 else 0)
            box = mask.getbbox()
            assert box, (name, row, col)
            cells.append(cell.crop(box))
        scale = min(164/max(c.width for c in cells), 164/max(c.height for c in cells))
        for col, cell in enumerate(cells):
            if weapons: scale = min(164/cell.width, 164/cell.height)
            cell = cell.resize((max(1, round(cell.width*scale)), max(1, round(cell.height*scale))), Image.Resampling.NEAREST)
            atlas.alpha_composite(cell, (col*192+(192-cell.width)//2, row*192+176-cell.height))
    target = root/'docs/assets'/f'{name}.webp'
    atlas.save(target, 'WEBP', lossless=True)
    print(name, target.stat().st_size)
