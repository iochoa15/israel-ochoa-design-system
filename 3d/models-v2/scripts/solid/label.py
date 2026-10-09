"""Stage B of the solid-clay pass (runs in normal Python with numpy, scipy, scikit-learn, Pillow).
1. Palette: the few flat clay colors of the still illustration (k-means, then near-duplicates merged).
2. Every point of the soft skin gets the palette color closest to what the AI painted there
   (after nudging the AI colors toward the still, so baked-in light and shadow do not count as paint).
3. Clean-up so colors are solid areas: neighbors vote (removes speckles, highlights painted as white, rough borders),
   then any leftover islands smaller than a small dot are absorbed by the color around them.
Writes work/<name>_labels.npz (face colors) + work/<name>_palette.json + work/<name>_labels.png (front check).

python label.py <work_dir> <stills_dir> <settings.json> [name-filter]
"""
import sys, os, json
import numpy as np
from PIL import Image, ImageFilter
from scipy import sparse
from scipy.sparse.csgraph import connected_components
from sklearn.cluster import KMeans

D = dict(k=7, wL=0.3, merge=13.0, min_share=0.004, sigma=9.0, steps=45, keep=0.04, min_island=0.0004, transfer=0.6)


def lab(rgb):
    c = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.9505, 1.0, 1.089])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def rgb_of(L):
    fy = (L[..., 0] + 16) / 116; fx = fy + L[..., 1] / 500; fz = fy - L[..., 2] / 200
    f = np.stack([fx, fy, fz], -1)
    xyz = np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787) * np.array([0.9505, 1.0, 1.089])
    Mi = np.array([[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]])
    c = np.clip(xyz @ Mi.T, 0, 1)
    return np.where(c <= 0.0031308, 12.92 * c, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def lit(L):
    """Body color of a clay area: the well-lit part (60-90th lightness percentile), not its shadows or crevices."""
    lo, hi = np.percentile(L[:, 0], [60, 90])
    sel = (L[:, 0] >= lo) & (L[:, 0] <= hi)
    return L[sel].mean(0) if sel.sum() > 10 else np.median(L, 0)


def hexs(rgb):
    return "#" + "".join(f"{int(round(v * 255)):02x}" for v in np.clip(rgb, 0, 1))


def still_pixels(path):
    im = Image.open(path).convert("RGBA")
    a = im.getchannel("A").filter(ImageFilter.MinFilter(7))
    px = np.asarray(im, np.float32)[..., :3] / 255
    m = np.asarray(a) > 250
    return px[m], np.asarray(im)


def palette(still_lab, c):
    w = np.array([c["wL"], 1, 1])
    rng = np.random.default_rng(0)
    X = still_lab[rng.choice(len(still_lab), min(80000, len(still_lab)), replace=False)]
    km = KMeans(c["k"], n_init=6, random_state=0).fit(X * w)
    lab_ = km.labels_
    groups = [[i] for i in range(c["k"])]
    cent = [X[lab_ == i] for i in range(c["k"])]
    # merge near-duplicates (the same clay seen lit and in shadow)
    while True:
        meds = [np.median(g, 0) for g in cent]
        best = None
        for i in range(len(cent)):
            for j in range(i + 1, len(cent)):
                d = np.linalg.norm((meds[i] - meds[j]) * w)
                if d < c["merge"] and (best is None or d < best[0]):
                    best = (d, i, j)
        if not best:
            break
        _, i, j = best
        cent[i] = np.concatenate([cent[i], cent[j]]); cent.pop(j)
    share = np.array([len(g) for g in cent]) / len(X)
    keep = share >= c["min_share"]
    cols = [np.median(g, 0) for g, k in zip(cent, keep) if k]
    order = np.argsort([-len(g) for g, k in zip(cent, keep) if k])
    return [cols[i] for i in order], sorted(share[keep], reverse=True)


def main():
  WORK, STILLS, CFG = sys.argv[1:4]
  FILTER = sys.argv[4] if len(sys.argv) > 4 else ""
  cfg_all = json.load(open(CFG)) if os.path.exists(CFG) else {}
  for f in sorted(os.listdir(WORK)):
      if not f.endswith(".npz") or f.endswith("_labels.npz") or FILTER not in f:
          continue
      name = f[:-4]
      c = {**D, **cfg_all.get(name, {})}
      z = np.load(os.path.join(WORK, f))
      P, T, rgb = z["P"], z["T"], z["rgb"]
      sp, still_img = still_pixels(os.path.join(STILLS, name + ".png"))
      still_lab = lab(sp)
      if "seeds" in c:
          # rough clay colors named by hand; each one is then set to the still's own color for that area
          seeds = np.array([lab(np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)])) for h in c["seeds"]])
          wS = np.array([0.4, 1, 1])
          near = (((still_lab[:, None] - seeds[None]) * wS) ** 2).sum(-1).argmin(1)
          pal = [lit(still_lab[near == i]) if (near == i).sum() > 50 else seeds[i] for i in range(len(seeds))]
      else:
          pal, _ = palette(still_lab, c)
      pal = np.array(pal)
      w = np.array([c["wL"], 1, 1])
      # AI paint -> nudged toward the still's overall color statistics
      V = lab(np.clip(rgb, 0, 1))
      mu_v, sd_v = V.mean(0), V.std(0) + 1e-6
      mu_s, sd_s = still_lab.mean(0), still_lab.std(0) + 1e-6
      Vt = (V - mu_v) / sd_v * sd_s + mu_s
      V = V + c["transfer"] * (Vt - V)
      if c.get("unshade"):
          # remove light and shadow painted into the AI texture: keep only local lightness changes (stars, stripes)
          n = len(P)
          I0 = np.concatenate([T[:, 0], T[:, 1], T[:, 2], T[:, 1], T[:, 2], T[:, 0]])
          J0 = np.concatenate([T[:, 1], T[:, 2], T[:, 0], T[:, 0], T[:, 1], T[:, 2]])
          A0 = sparse.csr_matrix((np.ones(len(I0), np.float32), (I0, J0)), shape=(n, n)); A0.data[:] = 1
          W0 = sparse.diags(1 / np.maximum(A0.sum(1).A1, 1)) @ A0
          base = V[:, 0].copy()
          for _ in range(int(c["unshade"])):
              base = W0 @ base
          V[:, 0] = V[:, 0] - base + np.median(V[:, 0])
      d2 = (((V[:, None, :] - pal[None]) * w) ** 2).sum(-1)
      for pi, allowed in c.get("parts", {}).items():   # a piece may only take its own colors (cap = red only...)
          on_part = np.zeros(len(P), bool); on_part[T[z["part"] == int(pi)].ravel()] = True
          ban = np.ones(len(pal), bool); ban[allowed] = False
          d2[np.ix_(on_part, ban)] = 1e9
      def inside_any(shapes):
          m = np.zeros(len(P), bool)
          for sh in shapes:
              if isinstance(sh, dict):          # {"sphere": [x, y, z, r]}
                  cx, cy, cz, r = sh["sphere"]
                  m |= ((P - np.array([cx, cy, cz])) ** 2).sum(1) <= r * r
              else:                             # [[x0, x1], [y0, y1], [z0, z1]]
                  (x0, x1), (y0, y1), (z0, z1) = sh
                  m |= (P[:, 0] >= x0) & (P[:, 0] <= x1) & (P[:, 1] >= y0) & (P[:, 1] <= y1) & (P[:, 2] >= z0) & (P[:, 2] <= z1)
          return m
      for ci, shapes in c.get("zones", {}).items():    # a color may only appear inside these shapes (pencil tip...)
          d2[~inside_any(shapes), int(ci)] = 1e9
      for ci, shapes in c.get("deny", {}).items():     # ...or never inside them
          d2[inside_any(shapes), int(ci)] = 1e9
      for i, b in c.get("bias", {}).items():  # optional per-color nudge (positive = claims more area)
          d2[:, int(i)] -= float(b)
      p0 = np.exp(-(d2 - d2.min(1, keepdims=True)) / (2 * c["sigma"] ** 2))
      p0 /= p0.sum(1, keepdims=True)
      # neighbor vote over the skin
      n = len(P)
      I = np.concatenate([T[:, 0], T[:, 1], T[:, 2], T[:, 1], T[:, 2], T[:, 0]])
      J = np.concatenate([T[:, 1], T[:, 2], T[:, 0], T[:, 0], T[:, 1], T[:, 2]])
      A = sparse.csr_matrix((np.ones(len(I), np.float32), (I, J)), shape=(n, n))
      A.data[:] = 1
      Wn = sparse.diags(1 / np.maximum(A.sum(1).A1, 1)) @ A
      p = p0.copy()
      for _ in range(c["steps"]):
          p = (1 - c["keep"]) * (Wn @ p) + c["keep"] * p0
      face_p = p[T].mean(1)
      lab_f = face_p.argmax(1)
      # islands smaller than a dot are absorbed by the surrounding color
      tri = P[T]
      area = np.linalg.norm(np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]), axis=1) / 2
      e = np.sort(np.concatenate([T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]]), 1)
      fid = np.tile(np.arange(len(T)), 3)
      key = e[:, 0].astype(np.int64) * n + e[:, 1]
      o = np.argsort(key, kind="stable"); ks = key[o]
      same = ks[1:] == ks[:-1]
      fa, fb = fid[o][:-1][same], fid[o][1:][same]
      nf = len(T)
      for _ in range(6):
          ok = lab_f[fa] == lab_f[fb]
          G = sparse.csr_matrix((np.ones(ok.sum()), (fa[ok], fb[ok])), shape=(nf, nf))
          ncomp, comp = connected_components(G, directed=False)
          carea = np.bincount(comp, area, ncomp)
          small = carea[comp] < c["min_island"]
          if not small.any():
              break
          # vote of neighbors that are not in a small island
          cross = small[fa] != small[fb]
          src = np.where(small[fa], fa, fb)[cross]; nb = np.where(small[fa], fb, fa)[cross]
          K = len(pal)
          votes = np.zeros((ncomp, K)); np.add.at(votes, (comp[src], lab_f[nb]), 1)
          has = votes.sum(1) > 0
          newc = votes.argmax(1)
          upd = small & has[comp]
          lab_f[upd] = newc[comp[upd]]
          if not upd.any():
              break
      # smooth per-color field on the points: the export cuts color borders where two fields are equal,
      # which gives clean curved borders whatever the final triangle size
      K = len(pal)
      inc = sparse.csr_matrix((np.ones(3 * nf, np.float32), (T.ravel(), np.repeat(np.arange(nf), 3))), shape=(n, nf))
      onehot = np.zeros((nf, K), np.float32); onehot[np.arange(nf), lab_f] = 1
      vp = sparse.diags(1 / np.maximum(inc.sum(1).A1, 1)) @ (inc @ onehot)
      for _ in range(c.get("border_soften", 4)):
          vp = Wn @ vp
      used = np.bincount(lab_f, area, len(pal)) / area.sum()
      pal_rgb = rgb_of(pal)
      np.savez_compressed(os.path.join(WORK, name + "_labels.npz"), labels=lab_f.astype(np.int16), vp=vp.astype(np.float16))
      json.dump({"palette": [hexs(x) for x in pal_rgb], "area_share": [round(float(u), 4) for u in used]},
                open(os.path.join(WORK, name + "_palette.json"), "w"), indent=1)
      # front check: color points by label (camera looks from -Y)
      S = 420
      cen = tri.mean(1)
      lo, hi = P.min(0), P.max(0)
      sc = (S - 20) / max(hi[0] - lo[0], hi[2] - lo[2])
      xs = ((cen[:, 0] - (lo[0] + hi[0]) / 2) * sc + S / 2).astype(int)
      ys = (S / 2 - (cen[:, 2] - (lo[2] + hi[2]) / 2) * sc).astype(int)
      order = np.argsort(-cen[:, 1])           # far first, near last
      img = np.full((S, S, 3), 245, np.uint8)
      colors = (pal_rgb * 255).astype(np.uint8)
      for dx in (0, 1):
          for dy in (0, 1):
              xx = np.clip(xs[order] + dx, 0, S - 1); yy = np.clip(ys[order] + dy, 0, S - 1)
              img[yy, xx] = colors[lab_f[order]]
      still = Image.open(os.path.join(STILLS, name + ".png")).convert("RGBA"); still.thumbnail((S, S))
      bg = Image.new("RGBA", (S, S), (245, 245, 245, 255)); bg.alpha_composite(still, ((S - still.width) // 2, (S - still.height) // 2))
      sw = Image.new("RGB", (S * 2, S + 40), (245, 245, 245))
      sw.paste(bg.convert("RGB"), (0, 0)); sw.paste(Image.fromarray(img), (S, 0))
      for i, col in enumerate(colors):
          sw.paste(Image.new("RGB", (36, 30), tuple(int(v) for v in col)), (6 + i * 42, S + 5))
      sw.save(os.path.join(WORK, name + "_labels.png"))
      print("LABELED", name, "palette", [hexs(x) for x in pal_rgb], "share", [round(float(u), 3) for u in used], flush=True)


if __name__ == "__main__":
    main()
