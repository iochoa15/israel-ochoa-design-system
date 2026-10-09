"""Color loop for the solid-clay pass: render (website lights) -> compare each clay color with the still -> fix -> repeat.
For each palette color: median of the still's pixels of that color vs median of the render's pixels of that color
(the flat render tells which pixel is which color). The material color is scaled by the ratio (in linear light).
Writes work/<name>_albedo.json.

python calibrate.py <work_dir> <previews_dir> <stills_dir> [name-filter]
"""
import sys, os, json
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
from label import lab, rgb_of  # noqa  (label.py only runs its loop when executed directly)

WORK, PREV, STILLS = sys.argv[1:4]
FILTER = sys.argv[4] if len(sys.argv) > 4 else ""
CHROMA = 1.1
MAX_DRIFT = 10.0
MAX_DRIFT_DARKER = 24.0
CFG = json.load(open(os.path.join(os.path.dirname(__file__), "settings.json")))


def h2rgb(h):
    return np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)])


def to_lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, 12.92 * c, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def target(rgb):
    """What the eye reads as a clay area's color: lightness of its well-lit part (60-90th percentile),
    hue and saturation of its lit body (45-85th percentile), so mixed border pixels do not pull it."""
    L = lab(rgb)
    lo, hi = np.percentile(L[:, 0], [60, 90])
    sel = (L[:, 0] >= lo) & (L[:, 0] <= hi)
    lo2, hi2 = np.percentile(L[:, 0], [45, 85])
    sel2 = (L[:, 0] >= lo2) & (L[:, 0] <= hi2)
    return np.array([L[sel, 0].mean(), np.median(L[sel2, 1]), np.median(L[sel2, 2])])


def litlin(rgb):
    """Linear body color of a clay area: mean of its 60-90th lightness percentile (ignores shadows and crevices)."""
    L = lab(rgb)[:, 0]
    lo, hi = np.percentile(L, [60, 90])
    sel = (L >= lo) & (L <= hi)
    return to_lin(rgb[sel]).mean(0)


def in_gamut(L):
    """Lab -> sRGB. A very bright, very saturated color cannot be shown: instead of clipping it (which washes it out),
    darken it a little until it fits, so it keeps its saturation."""
    L = L.copy()
    for _ in range(30):
        fy = (L[0] + 16) / 116; f = np.array([fy + L[1] / 500, fy, fy - L[2] / 200])
        xyz = np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787) * np.array([0.9505, 1.0, 1.089])
        Mi = np.array([[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]])
        if (xyz @ Mi.T).max() <= 1.0:
            break
        L[0] -= 1.0
    return rgb_of(L)


def solid(path, erode=5):
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im.getchannel("A").filter(ImageFilter.MinFilter(erode))) > 250
    return np.asarray(im, np.float32)[..., :3] / 255, a


for f in sorted(os.listdir(WORK)):
    if not f.endswith("_palette.json") or FILTER not in f:
        continue
    name = f[:-len("_palette.json")]
    flat_p = os.path.join(PREV, name + "__flat.png")
    if not os.path.exists(flat_p):
        continue
    pal = json.load(open(os.path.join(WORK, f)))["palette"]
    ap = os.path.join(WORK, name + "_albedo.json")
    alb = json.load(open(ap))["albedo"] if os.path.exists(ap) else pal
    P = np.array([h2rgb(h) for h in pal]); A = np.array([h2rgb(h) for h in alb])
    # still pixels -> palette color (same rule as label.py's seeds)
    sp, sm = solid(os.path.join(STILLS, name + ".png"))
    SL = lab(sp[sm]); PL = lab(P); w = np.array([0.4, 1, 1])
    s_lab = (((SL[:, None] - PL[None]) * w) ** 2).sum(-1).argmin(1)
    s_rgb = sp[sm]
    # render pixels -> palette color via the flat render (exact material colors)
    fp, fm = solid(flat_p, 3)
    rp, rm = solid(os.path.join(PREV, name + "__web.png"), 3)
    m = fm & rm
    d = ((fp[m][:, None] - A[None]) ** 2).sum(-1)
    r_lab = d.argmin(1); ok = d.min(1) < 0.004
    r_rgb = rp[m]
    new, rows = [], []
    for i in range(len(pal)):
        a_s = s_rgb[s_lab == i]; a_r = r_rgb[(r_lab == i) & ok]
        if len(a_s) < 80 or len(a_r) < 80:
            new.append(alb[i]); rows.append((i, len(a_s), len(a_r), None)); continue
        ts, tr = target(a_s), target(a_r)
        ts[1:] *= CHROMA   # flat clay loses the still's rich shadow tones; a little extra color makes up for it
        dlab = ts - tr
        nl = lab(A[i]) + dlab
        off = nl - lab(P[i])                       # never drift too far from the still's own color
        cap = MAX_DRIFT if off[0] > 0 else MAX_DRIFT_DARKER   # lightening is what washes colors out: keep it tight
        if np.linalg.norm(off) > cap:
            nl = lab(P[i]) + off * (cap / np.linalg.norm(off))
        na = in_gamut(nl)
        dE = float(np.linalg.norm(dlab))
        new.append("#" + "".join(f"{int(round(v * 255)):02x}" for v in np.clip(na, 0, 1))); rows.append((i, len(a_s), len(a_r), round(dE, 1)))
    for i, h in CFG.get(name, {}).get("lock", {}).items():   # colors picked by eye win
        new[int(i)] = h
    hist = json.load(open(ap)).get("history", []) if os.path.exists(ap) else []
    hist.append({"albedo": alb, "dE": [r[3] for r in rows]})
    json.dump({"albedo": new, "history": hist}, open(ap, "w"), indent=1)
    print("CAL", name, "dE per color", [r[3] for r in rows], "->", new, flush=True)
