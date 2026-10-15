"""Logo gallery: turn logo PNGs on a white background into three web versions, all on the same canvas.

  color/  the original colors, white background removed (on a white card it looks exactly like the original)
  white/  one-color white knockout (white parts inside a shape become see-through, like a real knockout)
  black/  the same knockout in black

Every logo is trimmed, then sized onto one 800x500 canvas so they look equally big: wide wordmarks
get more width, square marks less, inside the same safe area.

python process_logos.py <folder with PNGs> <out folder>
"""
import os, sys, re, json
import numpy as np
from PIL import Image, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
CW, CH = 800, 500                 # canvas
MAX_W, MAX_H = 0.84 * CW, 0.62 * CH
AREA = 0.25 * CW * CH             # target box area (width x height) for the logo
MAX_UP = 1.6                      # never enlarge more than this (sources are raster)
# Logos with dark details on a colored shape lose them in a flat knockout. These get a "tonal" knockout:
# still one color, but darker parts are more solid, so the inner text and drawing stay readable.
TONAL = {"catholic-diocese-of-brooklyn", "food-pizza", "catholic-app-website", "catholic-school", "church",
         "healthy-lifestyle", "automovil", "mma-academy"}


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def slug(name):
    s = re.sub(r"^\s*logotype design\s*", "", name[:-4], flags=re.I)
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def brand_color(rgb, a, need=3.0):
    """The logo's main color, darkened if needed so a white logo on it stays readable (contrast >= need:1)."""
    px = rgb[a > 0.6]
    if len(px) == 0:
        return "#1B1A18"
    mx, mn = px.max(1), px.min(1)
    colorful = px[(mx - mn) > 0.18]
    pool = colorful if len(colorful) > 0.03 * len(px) else px
    q = np.round(pool * 7) / 7                               # group similar colors
    vals, counts = np.unique(q, axis=0, return_counts=True)
    c = pool[np.all(q == vals[counts.argmax()], axis=1)].mean(0)
    if (c.max() - c.min()) < 0.18:                           # black / gray logo: warm near-black card
        return "#1B1A18"
    lin = lambda v: np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)
    for _ in range(40):
        L = (lin(c) * [0.2126, 0.7152, 0.0722]).sum()
        if 1.05 / (L + 0.05) >= need:
            break
        c = c * 0.94
    return "#%02X%02X%02X" % tuple(int(round(v * 255)) for v in c)


def process(path, tonal):
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.float32) / 255
    ink = 1 - rgb.min(2)                                   # how far from white each pixel is (0 = white)
    # color version: un-mix the white so the edges stay smooth and composite back exactly on white
    a = np.clip((ink - 0.015) / 0.985, 0, 1)
    fg = np.where(a[..., None] > 1e-4, 1 - (1 - rgb) / np.maximum(a[..., None], 1e-4), 0)
    color = np.dstack([np.clip(fg, 0, 1), a])
    # knockout: anything clearly not white becomes solid; pale areas are normalized to their neighborhood
    local = np.asarray(Image.fromarray((ink * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))).astype(np.float32) / 255
    rel = np.where(local > 0.06, ink / np.maximum(local, 1e-4), 0)
    k = np.clip(np.maximum(smoothstep(0.03, 0.5, ink), rel), 0, 1)
    k[ink < 0.015] = 0
    if tonal:
        lum = (rgb * [0.299, 0.587, 0.114]).sum(2)
        k = k * np.clip(0.14 + 0.86 * (1 - lum) ** 1.3, 0, 1)
    return color, k, brand_color(rgb, a, 4.5 if tonal else 3.0)  # tonal logos need a deeper card


def place(rgba, box, s):
    """Crop to box, scale by s (premultiplied so edges don't get dark halos) and center on the canvas."""
    x0, y0, x1, y1 = box
    im = Image.fromarray((rgba[y0:y1, x0:x1] * 255 + 0.5).astype(np.uint8), "RGBA").convert("RGBa")
    w, h = max(1, round((x1 - x0) * s)), max(1, round((y1 - y0) * s))
    im = im.resize((w, h), Image.LANCZOS).convert("RGBA")
    canvas = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    canvas.paste(im, ((CW - w) // 2, (CH - h) // 2))
    return canvas


os.makedirs(OUT, exist_ok=True)
for d in ("color", "white", "black"):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)
seen, report = {}, {}
for f in sorted(os.listdir(SRC)):
    if not f.lower().endswith(".png"):
        continue
    name = slug(f)
    while name in seen.values() or name in report:          # two files can share a name (e.g. a leading space)
        name += "-b"
    key = hash(np.asarray(Image.open(os.path.join(SRC, f)).convert("RGB")).tobytes())
    if key in seen:                                         # exact duplicate file: skip it
        report[name] = {"duplicate_of": seen[key]}
        continue
    seen[key] = name
    color, k, card = process(os.path.join(SRC, f), name in TONAL)
    ys, xs = np.where(color[..., 3] > 0.02)
    pad = 2
    box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(color.shape[1], xs.max() + 1 + pad), min(color.shape[0], ys.max() + 1 + pad))
    w, h = box[2] - box[0], box[3] - box[1]
    s = min((AREA / (w * h)) ** 0.5, MAX_W / w, MAX_H / h, MAX_UP)
    place(color, box, s).save(os.path.join(OUT, "color", name + ".png"), optimize=True)
    ones = np.ones_like(k)
    place(np.dstack([ones, ones, ones, k]), box, s).save(os.path.join(OUT, "white", name + ".png"), optimize=True)
    place(np.dstack([0 * ones, 0 * ones, 0 * ones, k]), box, s).save(os.path.join(OUT, "black", name + ".png"), optimize=True)
    report[name] = {"source": f, "trim": [int(w), int(h)], "scale": round(float(s), 3), "card": card, "tonal": name in TONAL}
    print(name, w, h, round(float(s), 2), flush=True)
json.dump(report, open(os.path.join(OUT, "report.json"), "w"), indent=1)
