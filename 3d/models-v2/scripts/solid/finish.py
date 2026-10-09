"""Stage C of the solid-clay pass: paint the soft skin with its flat clay colors, lighten it, export the .glb.
  - every face gets its palette color (from label.py) as a plain material: no textures at all
  - lowered to ~TARGET triangles first, then every triangle on a color border is cut along it (clean curved borders)
  - smooth shading, one shared clay finish
Colors: work/<name>_albedo.json (from calibrate.py) if present, else the still's colors as a first guess.

Blender --background --factory-startup --python finish.py -- <work_dir> <out_dir> [name-filter]
"""
import bpy, bmesh, os, sys, json
import numpy as np
from mathutils import kdtree
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import common as C

argv = sys.argv[sys.argv.index("--") + 1:]
WORK, OUT = argv[0], argv[1]
FILTER = argv[2] if len(argv) > 2 else ""
TARGET = 110000
ROUGH, SPEC = 0.62, 0.3
cfg_path = os.path.join(os.path.dirname(__file__), "settings.json")
cfg = json.load(open(cfg_path)) if os.path.exists(cfg_path) else {}
os.makedirs(OUT, exist_ok=True)
rep_path = os.path.join(OUT, "report.json")
report = json.load(open(rep_path)) if os.path.exists(rep_path) else {}


def split_on_borders(V, F, pv):
    """Each point has a strength per color (pv). A border runs where two colors are equally strong; triangles that
    straddle a border are cut along it, so borders are smooth lines instead of a zigzag of whole triangles."""
    lab = pv.argmax(1)
    newV, edge_pt = [V], {}
    nv = [len(V)]

    def cross(u, w):
        key = (u, w) if u < w else (w, u)
        if key in edge_pt:
            return edge_pt[key]
        a, b = key
        A, B = lab[a], lab[b]
        fa, fb = pv[a, A] - pv[a, B], pv[b, A] - pv[b, B]
        t = min(0.95, max(0.05, fa / (fa - fb + 1e-9)))
        newV.append((V[a] + t * (V[b] - V[a]))[None])
        edge_pt[key] = nv[0]; nv[0] += 1
        return edge_pt[key]

    la, lb, lc = lab[F[:, 0]], lab[F[:, 1]], lab[F[:, 2]]
    same = (la == lb) & (lb == lc)
    outF, outM = [F[same]], [la[same]]
    extraF, extraM = [], []
    for a, b, c in F[~same]:
        A, B, Cc = lab[a], lab[b], lab[c]
        if A != B and B != Cc and A != Cc:
            mab, mbc, mca = cross(a, b), cross(b, c), cross(c, a)
            g = nv[0]; newV.append(((newV_at(newV, mab) + newV_at(newV, mbc) + newV_at(newV, mca)) / 3)[None]); nv[0] += 1
            extraF += [(a, mab, g), (a, g, mca), (b, mbc, g), (b, g, mab), (c, mca, g), (c, g, mbc)]
            extraM += [A, A, B, B, Cc, Cc]
            continue
        if A == B:
            x, y, odd = a, b, c
        elif B == Cc:
            x, y, odd = b, c, a
        else:
            x, y, odd = c, a, b
        m1, m2 = cross(y, odd), cross(odd, x)
        X, Y = lab[x], lab[odd]
        extraF += [(x, y, m1), (x, m1, m2), (m2, m1, odd)]
        extraM += [X, X, Y]
    Vall = np.concatenate(newV)
    Fall = np.concatenate(outF + [np.array(extraF, np.int64).reshape(-1, 3)])
    Mall = np.concatenate(outM + [np.array(extraM, np.int64)])
    return Vall, Fall, Mall


def newV_at(chunks, idx):
    # chunks: [V (n x 3), then one 1 x 3 row per added point]
    n0 = len(chunks[0])
    return chunks[0][idx] if idx < n0 else chunks[1 + idx - n0][0]


def lin(h):
    s = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in s]


for f in sorted(os.listdir(WORK)):
    if not f.endswith(".blend") or FILTER not in f:
        continue
    name = f[:-6]
    lab_path = os.path.join(WORK, name + "_labels.npz")
    if not os.path.exists(lab_path):
        continue
    bpy.ops.wm.open_mainfile(filepath=os.path.join(WORK, f))
    labels = np.load(lab_path)["labels"].astype(np.int32)
    pal = json.load(open(os.path.join(WORK, name + "_palette.json")))["palette"]
    alb_path = os.path.join(WORK, name + "_albedo.json")
    albedo = json.load(open(alb_path))["albedo"] if os.path.exists(alb_path) else pal
    names = cfg.get(name, {}).get("names", [f"color {i + 1}" for i in range(len(pal))])
    mats = []
    for i, h in enumerate(albedo):
        m = bpy.data.materials.new(f"{name} · {names[i] if i < len(names) else i + 1}")
        m.use_nodes = True
        b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        b.inputs["Base Color"].default_value = (*lin(h), 1)
        b.inputs["Roughness"].default_value = ROUGH
        b.inputs["Metallic"].default_value = 0.0
        if "Specular IOR Level" in b.inputs:
            b.inputs["Specular IOR Level"].default_value = SPEC
        m.diffuse_color = (*lin(h), 1)
        mats.append(m)
    parts = sorted([o for o in bpy.data.objects if o.type == "MESH"], key=lambda o: int(o.name.split()[-1]))
    z = np.load(os.path.join(WORK, name + ".npz"))
    vp = np.load(lab_path)["vp"].astype(np.float32)
    Phi, Thi, part_f = z["P"], z["T"], z["part"]
    vpart = np.zeros(len(Phi), np.int32); vpart[Thi.ravel()] = np.repeat(part_f, 3)
    t_in = sum(len(o.data.polygons) for o in parts)
    ratio = min(1.0, TARGET / t_in)
    for pi, o in enumerate(parts):
        # 1) lighter shape (colors are not involved yet)
        d = o.modifiers.new("Lighter", "DECIMATE"); d.ratio = ratio; d.use_collapse_triangulate = True
        o.modifiers.new("Tri", "TRIANGULATE")
        C.apply_mods(o)
        me = o.data
        V = np.zeros(len(me.vertices) * 3); me.vertices.foreach_get("co", V); V = V.reshape(-1, 3)
        F = np.zeros(len(me.polygons) * 3, np.int64); me.polygons.foreach_get("vertices", F); F = F.reshape(-1, 3)
        # 2) color fields from the detailed skin, read at each new point (3 nearest detailed points)
        sel = np.where(vpart == pi)[0]
        kd = kdtree.KDTree(len(sel))
        for j, i in enumerate(sel):
            kd.insert(Phi[i], j)
        kd.balance()
        pv = np.zeros((len(V), vp.shape[1]), np.float32)
        for i, co in enumerate(V):
            acc, wsum = 0, 0.0
            for _, j, dist in kd.find_n(co, 3):
                w = 1.0 / (dist + 1e-5); acc = acc + w * vp[sel[j]]; wsum += w
            pv[i] = acc / wsum
        # 3) cut every triangle along the color borders
        V2, F2, M2 = split_on_borders(V, F, pv)
        me.clear_geometry()
        me.from_pydata(V2.tolist(), [], F2.tolist())
        for m in mats:
            me.materials.append(m)
        me.polygons.foreach_set("material_index", M2.astype(np.int32))
        me.update()
        C.smooth(o)
        used = set(np.unique(M2).tolist())
        for i in reversed(range(len(me.materials))):
            if i not in used:
                o.active_material_index = i; C.select([o]); bpy.ops.object.material_slot_remove()
    size = C.normalize(parts)
    multi = len(parts) > 1
    for i, o in enumerate(parts):
        o.name = f"{name} · part {i + 1}" if multi else f"{name} · mesh"
    root = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(root)
    for o in parts:
        o.parent = root
    out = os.path.join(OUT, name + ".glb")
    C.select(parts + [root], active=root)
    bpy.ops.export_scene.gltf(filepath=out, use_selection=True, export_format="GLB", export_yup=True, export_apply=True,
                              export_meshopt_compression_enable=True, export_meshopt_extension="EXT_meshopt_compression",
                              export_materials="EXPORT", export_animations=False, export_cameras=False, export_lights=False)
    tris = sum(len(o.data.polygons) for o in parts)
    report[name] = {"parts": len(parts), "triangles": tris, "colors": albedo, "size": size, "mb": round(os.path.getsize(out) / 1e6, 2)}
    json.dump(report, open(rep_path, "w"), indent=1)
    print("FINISHED", name, report[name], flush=True)
