"""Comparison sheet, one row per object, all rendered with the website's lights:
   Still | Tripo original | First pass (03) | Solid clay (06) | Tripo cleaned (07) | Tripo cleaned 3/4
python compare_sheet.py <models-v2 dir> <stills dir> <out.png>"""
import sys, os, glob
from PIL import Image, ImageDraw, ImageFont

base, stills, out = sys.argv[1:4]
CELL, LABEL_W, HEAD = 300, 170, 46
BG = (245, 244, 241)
COLS = [("Still (target)", lambda n: os.path.join(stills, n + ".png")),
        ("Tripo original", lambda n: os.path.join(base, "01_audit", n + "__web.png")),
        ("First pass (03)", lambda n: os.path.join(base, "03_final/previews", n + "__web.png")),
        ("Solid clay (06)", lambda n: os.path.join(base, "06_solid_clay/previews", n + "__web.png")),
        ("Tripo cleaned (07)", lambda n: os.path.join(base, "07_tripo_clean/previews", n + "__web.png")),
        ("Tripo cleaned, 3/4", lambda n: os.path.join(base, "07_tripo_clean/previews", n + "__web34.png"))]
SCRATCH = lambda n, s: os.path.join(base, "04_from_scratch/previews", n + s)
names = sorted(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(stills, "*.png")))
if "Stack 6D - Doll" not in names:
    names.append("Stack 6D - Doll")
try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
    small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
except OSError:
    font = small = ImageFont.load_default()

sheet = Image.new("RGB", (LABEL_W + CELL * len(COLS), HEAD + CELL * len(names)), BG)
d = ImageDraw.Draw(sheet)
for j, (t, _) in enumerate(COLS):
    d.text((LABEL_W + j * CELL + 12, 14), t, fill=(20, 20, 20), font=font)
for i, n in enumerate(names):
    y = HEAD + i * CELL
    d.line([(0, y), (sheet.width, y)], fill=(222, 220, 214))
    d.text((12, y + CELL // 2 - 10), n.replace("Stack ", ""), fill=(20, 20, 20), font=font)
    for j, (t, f) in enumerate(COLS):
        p = f(n)
        if not os.path.exists(p) and j >= 2:
            p = SCRATCH(n, "__web34.png" if j == 5 else "__web.png")     # Cube + Doll: built in Blender
        if not os.path.exists(p) and j == 0:
            p = os.path.join(os.path.dirname(stills), "GBL Models", n + ".png")
        x = LABEL_W + j * CELL
        if not os.path.exists(p):
            d.text((x + 70, y + CELL // 2 - 8), "no Tripo file", fill=(130, 128, 122), font=small); continue
        im = Image.open(p).convert("RGBA"); im.thumbnail((CELL - 16, CELL - 16))
        bg = Image.new("RGBA", im.size, BG + (255,)); bg.alpha_composite(im)
        sheet.paste(bg.convert("RGB"), (x + (CELL - im.width) // 2, y + (CELL - im.height) // 2))
sheet.save(out, optimize=True)
print("SHEET", out, sheet.size)
