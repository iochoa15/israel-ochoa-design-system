"""Compare each model's front outline proportions (width / height) with its still.
python proportions.py <stills_dir> <renders_dir> <out.json>  -> per model: still ratio, model ratio, suggested width scale"""
import sys, os, glob, json, numpy as np
from PIL import Image
STILLS, RENDERS, OUT = sys.argv[1:4]
res = {}
def ratio(p):
    a = np.array(Image.open(p).convert("RGBA"))[:, :, 3] > 128
    ys, xs = np.nonzero(a)
    return (xs.max() - xs.min() + 1) / (ys.max() - ys.min() + 1)
for s in sorted(glob.glob(os.path.join(STILLS, "*.png"))):
    n = os.path.splitext(os.path.basename(s))[0]
    r = os.path.join(RENDERS, n + "__web.png")
    if not os.path.exists(r):
        continue
    a, b = ratio(s), ratio(r)
    k = a / b
    res[n] = {"still": round(a, 3), "model": round(b, 3), "width_scale": round(k, 3), "apply": bool(abs(k - 1) > 0.06 and "Lego" not in n)}  # lego: squashing bricks bends the studs
    print(f"{n:30} still {a:.2f} model {b:.2f}  -> width x{k:.2f} {'APPLY' if abs(k-1) > 0.06 else ''}")
json.dump(res, open(OUT, "w"), indent=1)
