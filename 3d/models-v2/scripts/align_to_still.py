"""Find the turn (yaw, pitch, roll) that makes each model look most like its still illustration,
judging both the outline and the colors (so a label or a face ends up facing forward).
Camera looks from -Y toward +Y (Blender front view): screen x = X, screen y = Z.
Run with any Python that has numpy + Pillow:  python align_to_still.py <points_dir> <stills_dir> <out.json> [name-filter]"""
import sys, os, json, glob, numpy as np
from PIL import Image, ImageFilter

G = 72
PTS, STILLS, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
FILTER = sys.argv[4] if len(sys.argv) > 4 else ""
PRIOR = 0.001  # small preference for staying close to Tripo's own front (per degree)
W_COLOR = 0.5
# hand limits where the outline alone fools the search (taco: tipping it over hides the filling)
MAX_PITCH = {"Taco": 20}

def srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, 12.92 * c, 1.055 * np.power(c, 1 / 2.4) - 0.055)

def lab(rgb):  # sRGB 0..1 -> CIE Lab
    c = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.9505, 1.0, 1.089])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)

def place(img_rgba):
    """crop to the object, fit into a G x G box, centered. returns (mask, rgb)"""
    a = np.array(img_rgba)
    ys, xs = np.nonzero(a[:, :, 3] > 128)
    crop = Image.fromarray(a[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
    s = (G - 2) / max(crop.size)
    crop = crop.resize((max(1, round(crop.size[0] * s)), max(1, round(crop.size[1] * s))), Image.LANCZOS)
    out = Image.new("RGBA", (G, G), (0, 0, 0, 0))
    out.paste(crop, ((G - crop.size[0]) // 2, (G - crop.size[1]) // 2))
    o = np.array(out).astype(np.float32) / 255
    return o[:, :, 3] > 0.5, o[:, :, :3]

def rot(yaw, pitch, roll):
    y, p, r = np.radians([yaw, pitch, roll])
    Rz = np.array([[np.cos(y), -np.sin(y), 0], [np.sin(y), np.cos(y), 0], [0, 0, 1]])
    Rx = np.array([[1, 0, 0], [0, np.cos(p), -np.sin(p)], [0, np.sin(p), np.cos(p)]])
    Ry = np.array([[np.cos(r), 0, np.sin(r)], [0, 1, 0], [-np.sin(r), 0, np.cos(r)]])
    return Ry @ Rx @ Rz

def render(P, C, R):
    Q = P @ R.T
    x, d, z = Q[:, 0], Q[:, 1], Q[:, 2]
    w, h = x.max() - x.min(), z.max() - z.min()
    s = (G - 2) / max(w, h)
    cx, cz = (x.max() + x.min()) / 2, (z.max() + z.min()) / 2
    px = np.clip(((x - cx) * s + G / 2).astype(int), 0, G - 1)
    py = np.clip(((cz - z) * s + G / 2).astype(int), 0, G - 1)
    order = np.argsort(-d)  # far first, near last (near wins)
    img = np.zeros((G, G, 3), np.float32); m = np.zeros((G, G), bool)
    img[py[order], px[order]] = C[order]
    m[py, px] = True
    d2 = m.copy(); d2[1:] |= m[:-1]; d2[:-1] |= m[1:]; d2[:, 1:] |= m[:, :-1]; d2[:, :-1] |= m[:, 1:]
    e = d2.copy(); e[1:] &= d2[:-1]; e[:-1] &= d2[1:]; e[:, 1:] &= d2[:, :-1]; e[:, :-1] &= d2[:, 1:]
    return e, img, m

def blur(img, mask):
    k = np.ones(3) / 3
    num = img * mask[..., None]; den = mask.astype(np.float32)
    for ax in (0, 1):
        num = np.apply_along_axis(lambda v: np.convolve(v, k, "same"), ax, num) if False else (np.roll(num, 1, ax) + num + np.roll(num, -1, ax)) / 3
        den = (np.roll(den, 1, ax) + den + np.roll(den, -1, ax)) / 3
    return num / np.maximum(den[..., None], 1e-6)

def evaluate(P, C, ypr, Tm, Tlab):
    m, img, hit = render(P, C, rot(*ypr))
    inter = m & Tm
    iou = inter.sum() / max(1, (m | Tm).sum())
    both = inter & hit
    L = lab(blur(img, hit))
    dE = np.linalg.norm(L[both] - Tlab[both], axis=1).mean() if both.any() else 100
    col = max(0.0, 1 - dE / 60)
    return (1 - W_COLOR) * iou + W_COLOR * col, iou, col

res = json.load(open(OUT)) if os.path.exists(OUT) else {}
os.makedirs(os.path.join(os.path.dirname(OUT), "align_checks"), exist_ok=True)
for f in sorted(glob.glob(os.path.join(PTS, "*.npy"))):
    if f.endswith("_rgb.npy"):
        continue
    name = os.path.splitext(os.path.basename(f))[0]
    still = os.path.join(STILLS, name + ".png")
    if FILTER not in name or not os.path.exists(still):
        continue
    if "note" in res.get(name, {}):
        print(name, "kept the hand-picked angle:", res[name]["note"]); continue
    P = np.load(f); C = srgb(np.load(f[:-4] + "_rgb.npy"))
    sel = np.random.default_rng(1).choice(len(P), 120000, replace=False)
    P, C = P[sel], C[sel]
    P -= (P.max(0) + P.min(0)) / 2
    Tm, Trgb = place(Image.open(still).convert("RGBA"))
    Tlab = lab(blur(Trgb, Tm))
    lim = next((v for k, v in MAX_PITCH.items() if k in name), 90)
    sc = lambda ypr: (evaluate(P, C, ypr, Tm, Tlab)[0] - PRIOR * sum(abs(v) for v in ypr)) if abs(ypr[1]) <= lim else -1
    base = evaluate(P, C, (0, 0, 0), Tm, Tlab)
    best = (sc((0, 0, 0)), (0, 0, 0))
    for yw in range(-90, 91, 10):
        for pt in range(-60, 61, 10):
            for rl in (-20, -10, 0, 10, 20):
                s = sc((yw, pt, rl))
                if s > best[0]:
                    best = (s, (yw, pt, rl))
    for step in (5, 2.5, 1):
        improved = True
        while improved:
            improved = False
            b = best[1]
            for dy in (-step, 0, step):
                for dp in (-step, 0, step):
                    for dr in (-step, 0, step):
                        c = (b[0] + dy, b[1] + dp, b[2] + dr)
                        s = sc(c)
                        if s > best[0] + 1e-6:
                            best = (s, c); improved = True
    ypr = best[1]
    after = evaluate(P, C, ypr, Tm, Tlab)
    res[name] = {"yaw": ypr[0], "pitch": ypr[1], "roll": ypr[2],
                 "before": {"outline": round(base[1], 3), "color": round(base[2], 3)},
                 "after": {"outline": round(after[1], 3), "color": round(after[2], 3)},
                 "matrix": rot(*ypr).round(6).tolist()}
    def pic(img, m):
        a = np.dstack([np.clip(img, 0, 1), m.astype(np.float32)])
        return Image.fromarray((a * 255).astype(np.uint8)).resize((216, 216), Image.NEAREST)
    sheet = Image.new("RGBA", (216 * 3 + 16, 216), (235, 233, 228, 255))
    _, i0, h0 = render(P, C, rot(0, 0, 0)); _, i1, h1 = render(P, C, rot(*ypr))
    for i, (img, m) in enumerate(((Trgb, Tm), (i0, h0), (i1, h1))):
        p = pic(img, m); sheet.alpha_composite(p, (i * 224, 0))
    sheet.save(os.path.join(os.path.dirname(OUT), "align_checks", name + ".png"))
    print(f"{name:30} outline {base[1]:.3f}->{after[1]:.3f}  color {base[2]:.3f}->{after[2]:.3f}  yaw {ypr[0]:6.1f} pitch {ypr[1]:6.1f} roll {ypr[2]:6.1f}", flush=True)
    json.dump(res, open(OUT, "w"), indent=1)
