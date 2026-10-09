"""Measure how far each model's website render is from its still, in color, and work out a gentle correction
(lightness + saturation/hue shift, in Lab) for its textures. Run with Python + numpy + Pillow:
  python color_match.py <stills_dir> <renders_dir> <out.json> [--apply-previous <old.json>]
Writes per model: dE (average color difference, lower = closer) and the correction to apply."""
import sys, os, json, glob, numpy as np
from PIL import Image

STILLS, RENDERS, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
G = 160


def lab(rgb):
    c = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.9505, 1.0, 1.089])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def place(path):
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    ys, xs = np.nonzero(a[:, :, 3] > 128)
    crop = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    s = (G - 2) / max(crop.size)
    crop = crop.resize((max(1, round(crop.size[0] * s)), max(1, round(crop.size[1] * s))), Image.LANCZOS)
    out = Image.new("RGBA", (G, G)); out.paste(crop, ((G - crop.size[0]) // 2, (G - crop.size[1]) // 2))
    o = np.array(out.resize((G // 4, G // 4), Image.BOX)).astype(np.float32) / 255  # blur away texture noise
    return o[:, :, 3] > 0.9, lab(o[:, :, :3])


res = {}
for still in sorted(glob.glob(os.path.join(STILLS, "*.png"))):
    name = os.path.splitext(os.path.basename(still))[0]
    rp = os.path.join(RENDERS, name + "__web.png")
    if not os.path.exists(rp):
        continue
    ms, Ls = place(still); mr, Lr = place(rp)
    m = ms & mr
    S, R = Ls[m], Lr[m]
    dE = float(np.linalg.norm(S - R, axis=1).mean())
    mu_s, mu_r = S.mean(0), R.mean(0)
    sd_s, sd_r = S.std(0) + 1e-3, R.std(0) + 1e-3
    # gentle, clamped correction: lightness scale/shift, and a chroma scale + small a/b shift
    Lk = float(np.clip(sd_s[0] / sd_r[0], 0.85, 1.2))
    Ld = float(np.clip(mu_s[0] - mu_r[0] * Lk, -14, 14))
    chroma_s = np.linalg.norm(S[:, 1:], axis=1).mean(); chroma_r = np.linalg.norm(R[:, 1:], axis=1).mean()
    Ck = float(np.clip(chroma_s / max(chroma_r, 1e-3), 0.7, 1.3))
    ab = np.clip(mu_s[1:] - mu_r[1:] * Ck, -8, 8).tolist()
    res[name] = {"dE": round(dE, 2), "L_scale": round(Lk, 3), "L_shift": round(Ld, 2), "chroma_scale": round(Ck, 3),
                 "ab_shift": [round(v, 2) for v in ab]}
    print(f"{name:30} dE {dE:5.1f}   L x{Lk:.2f} {Ld:+.1f}   chroma x{Ck:.2f}  ab {ab[0]:+.1f} {ab[1]:+.1f}")
json.dump(res, open(OUT, "w"), indent=1)
print("mean dE", round(np.mean([v["dE"] for v in res.values()]), 2))
