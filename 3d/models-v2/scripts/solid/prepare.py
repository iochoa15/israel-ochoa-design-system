"""Stage A of the solid-clay pass. For every Tripo model:
  turn it like the still, scale to a 1 x 1 box, rebuild the surface as one clean closed skin (voxel remesh: no holes,
  no jagged bits), soften it like hand-rolled clay, and read the AI's painted color under every new point.
Writes work/<name>.blend (soft mesh, triangles) and work/<name>.npz (points, triangles, part ids, sampled colors).

Blender --background --factory-startup --python prepare.py -- <in_dir> <work_dir> <alignment.json> <proportions.json> [name-filter]
"""
import bpy, bmesh, os, sys, json
import numpy as np
from mathutils import Matrix
from mathutils.bvhtree import BVHTree
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import common as C

argv = sys.argv[sys.argv.index("--") + 1:]
IN, WORK, ALIGN, SHAPE = argv[:4]
FILTER = argv[4] if len(argv) > 4 else ""
VOXEL = 1 / 330          # skin resolution (object is 1 unit wide or tall)
SOFTEN = {"default": (0.5, 10)}   # smooth modifier (factor, repeats)
MERGE_PARTS = 20
os.makedirs(WORK, exist_ok=True)
align = json.load(open(ALIGN)); shape = json.load(open(SHAPE))
cfg_path = os.path.join(os.path.dirname(__file__), "settings.json")
cfg = json.load(open(cfg_path)) if os.path.exists(cfg_path) else {}


def drop_slivers(bm, max_edge=9.0):
    """Delete long needle triangles (AI-export glitches that would turn into thin flying sheets)."""
    bad = []
    for f in bm.faces:
        e = max(x.calc_length() for x in f.edges)
        if e > max_edge or (e > 0.08 and f.calc_area() < 0.02 * e * e):
            bad.append(f)
    if bad:
        bmesh.ops.delete(bm, geom=bad, context="FACES")
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    return len(bad)


def image_pixels(mat, cache):
    if not mat or not mat.use_nodes:
        return None
    for n in mat.node_tree.nodes:
        if n.type == "BSDF_PRINCIPLED":
            for l in n.inputs["Base Color"].links:
                img = getattr(l.from_node, "image", None)
                if img:
                    if img.name not in cache:
                        w, h = img.size
                        px = np.zeros(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px)
                        cache[img.name] = px.reshape(h, w, 4)[..., :3]
                    return cache[img.name]
            return np.array(n.inputs["Base Color"].default_value[:3], dtype=np.float32).reshape(1, 1, 3)
    return None


def source_sampler(objs):
    """One BVH over all original parts; returns f(points) -> painted color (sRGB 0..1)."""
    V, T, UV, IMG = [], [], [], []
    cache, off, img_list = {}, 0, []
    for o in objs:
        me = o.data; me.calc_loop_triangles()
        n = len(me.loop_triangles)
        tri = np.zeros(n * 3, np.int32); me.loop_triangles.foreach_get("vertices", tri)
        loops = np.zeros(n * 3, np.int32); me.loop_triangles.foreach_get("loops", loops)
        mi = np.zeros(n, np.int32); me.loop_triangles.foreach_get("material_index", mi)
        uv = np.zeros(len(me.loops) * 2, np.float32)
        if me.uv_layers:
            me.uv_layers[0].data.foreach_get("uv", uv)
        co = np.zeros(len(me.vertices) * 3, np.float32); me.vertices.foreach_get("co", co)
        V.append(co.reshape(-1, 3)); T.append(tri.reshape(-1, 3) + off); off += len(me.vertices)
        UV.append(uv.reshape(-1, 2)[loops.reshape(-1, 3)])
        ids = []
        for m in range(max(1, len(me.materials))):
            px = image_pixels(me.materials[m] if m < len(me.materials) else None, cache)
            img_list.append(px); ids.append(len(img_list) - 1)
        IMG.append(np.array(ids)[np.clip(mi, 0, len(ids) - 1)])
    V = np.concatenate(V); T = np.concatenate(T); UV = np.concatenate(UV); IMG = np.concatenate(IMG)
    bvh = BVHTree.FromPolygons(V.tolist(), T.tolist(), all_triangles=True)

    def sample(P):
        idx = np.zeros(len(P), np.int64); loc = np.zeros((len(P), 3))
        for i, p in enumerate(P):
            hit = bvh.find_nearest(p)
            if hit[0] is not None:
                loc[i] = hit[0]; idx[i] = hit[2]
        a, b, c = V[T[idx, 0]], V[T[idx, 1]], V[T[idx, 2]]
        v0, v1, v2 = b - a, c - a, loc - a
        d00 = (v0 * v0).sum(1); d01 = (v0 * v1).sum(1); d11 = (v1 * v1).sum(1)
        d20 = (v2 * v0).sum(1); d21 = (v2 * v1).sum(1)
        den = np.where(np.abs(d00 * d11 - d01 * d01) < 1e-20, 1e-20, d00 * d11 - d01 * d01)
        w1 = (d11 * d20 - d01 * d21) / den; w2 = (d00 * d21 - d01 * d20) / den; w0 = 1 - w1 - w2
        uv = UV[idx, 0] * w0[:, None] + UV[idx, 1] * w1[:, None] + UV[idx, 2] * w2[:, None]
        col = np.full((len(P), 3), 0.8, np.float32)
        for k, px in enumerate(img_list):
            sel = IMG[idx] == k
            if px is None or not sel.any():
                continue
            h, w = px.shape[:2]
            x = np.clip((uv[sel, 0] % 1.0) * (w - 1), 0, w - 1).astype(int)
            y = np.clip((uv[sel, 1] % 1.0) * (h - 1), 0, h - 1).astype(int)
            col[sel] = px[y, x]
        return col
    return sample


for f in sorted(os.listdir(IN)):
    if not f.endswith(".glb") or FILTER not in f:
        continue
    name = f[:-4]
    print(f"\n=== {name} ===", flush=True)
    C.reset(); C._mats.clear()
    bpy.ops.import_scene.gltf(filepath=os.path.join(IN, f))
    parts = [o for o in bpy.data.objects if o.type == "MESH"]
    C.select(parts); bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    for o in list(bpy.data.objects):
        if o.type != "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    C.select(parts); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    lo, hi = C.bounds(parts)
    R = Matrix(align[name]["matrix"]).to_4x4() if name in align else Matrix.Identity(4)
    C.transform_all(parts, R @ Matrix.Translation(-(lo + hi) / 2))
    sh = shape.get(name)
    if sh and sh.get("apply"):
        k = sh["width_scale"]; C.transform_all(parts, Matrix.Diagonal((k, k, 1, 1)))
    C.normalize(parts)
    sample = source_sampler(parts)

    mc = cfg.get(name, {})
    # skins: one per meaningful part (Lego bricks, bottle cap...), or one for everything when the parts are tiny pieces
    if len(parts) > MERGE_PARTS or mc.get("join"):
        C.select(parts); bpy.ops.object.join(); skins_src = [bpy.context.view_layer.objects.active]
    else:
        skins_src = parts
    skins = []
    for i, o in enumerate(skins_src):
        s = o.copy(); s.data = o.data.copy(); bpy.context.scene.collection.objects.link(s)
        s.name = f"part {i + 1}"
        s.data.materials.clear()
        # the AI file is split along its texture seams: stitch it shut so it is one closed skin
        bm = bmesh.new(); bm.from_mesh(s.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=mc.get("weld", 2e-4))
        drop_slivers(bm, mc.get("max_edge", 9.0))
        bmesh.ops.holes_fill(bm, edges=bm.edges, sides=mc.get("fill", 64))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(s.data); bm.free()
        if mc.get("subsurf"):
            # low-polygon source: round off its flat facets before rebuilding
            ss = s.modifiers.new("Round", "SUBSURF"); ss.levels = mc["subsurf"]; ss.render_levels = mc["subsurf"]
            C.apply_mods(s)
        r = s.modifiers.new("Skin", "REMESH"); r.mode = "VOXEL"; r.voxel_size = mc.get("voxel", VOXEL); r.adaptivity = 0
        fac, rep = mc.get("soften", SOFTEN["default"])
        if rep:
            sm = s.modifiers.new("Soften", "SMOOTH"); sm.factor = fac; sm.iterations = rep
        C.apply_mods(s)
        if len(s.data.polygons) < 5000:
            # open shell the rebuild cannot close: give it a thin wall first, then rebuild
            print("  thin-wall rebuild for", s.name, flush=True)
            s.data = o.data.copy(); s.data.materials.clear()
            bm = bmesh.new(); bm.from_mesh(s.data)
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=mc.get("weld", 2e-4))
            drop_slivers(bm, mc.get("max_edge", 9.0))
            bm.to_mesh(s.data); bm.free()
            v = mc.get("voxel", VOXEL)
            so = s.modifiers.new("Wall", "SOLIDIFY"); so.thickness = v * 4; so.offset = -1; so.use_even_offset = False; so.thickness_clamp = 1.0
            r = s.modifiers.new("Skin", "REMESH"); r.mode = "VOXEL"; r.voxel_size = v; r.adaptivity = 0
            if rep:
                sm = s.modifiers.new("Soften", "SMOOTH"); sm.factor = fac; sm.iterations = rep
            C.apply_mods(s)
        if len(s.data.polygons) < 5000:
            print("  octree fallback for", s.name, flush=True)
            s.data = o.data.copy(); s.data.materials.clear()
            r = s.modifiers.new("Skin", "REMESH"); r.mode = "SMOOTH"; r.octree_depth = mc.get("octree", 8)
            r.use_remove_disconnected = True; r.threshold = 0.5
            if rep:
                sm = s.modifiers.new("Soften", "SMOOTH"); sm.factor = fac; sm.iterations = rep
            C.apply_mods(s)
        s.modifiers.new("Tri", "TRIANGULATE"); C.apply_mods(s)
        if len(s.data.polygons) < 50:          # a sliver that vanished in the remesh
            bpy.data.objects.remove(s, do_unlink=True); continue
        skins.append(s)
    for o in skins_src:
        bpy.data.objects.remove(o, do_unlink=True)
    for o in list(bpy.data.objects):
        if o not in skins:
            bpy.data.objects.remove(o, do_unlink=True)
    P, T, PART = [], [], []
    off = 0
    for pi, s in enumerate(skins):
        me = s.data
        co = np.zeros(len(me.vertices) * 3, np.float32); me.vertices.foreach_get("co", co)
        tri = np.zeros(len(me.polygons) * 3, np.int32); me.polygons.foreach_get("vertices", tri)
        P.append(co.reshape(-1, 3)); T.append(tri.reshape(-1, 3) + off); PART.append(np.full(len(me.polygons), pi)); off += len(me.vertices)
        C.smooth(s)
    P = np.concatenate(P); T = np.concatenate(T); PART = np.concatenate(PART)
    col = sample(P)
    np.savez_compressed(os.path.join(WORK, name + ".npz"), P=P, T=T, part=PART, rgb=col)
    for b in list(bpy.data.images):
        bpy.data.images.remove(b)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(WORK, name + ".blend"), compress=True)
    print("PREPARED", name, "parts", len(skins), "verts", len(P), "tris", len(T), flush=True)
