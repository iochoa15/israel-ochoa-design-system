"""Sample points on each model's surface (for matching its outline to the still). Writes <name>.npy (N x 3, Blender Z-up)."""
import bpy, os, sys, numpy as np
argv = sys.argv[sys.argv.index("--") + 1:]
IN, OUT = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(0)
for f in sorted(os.listdir(IN)):
    if not f.endswith(".glb"):
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(IN, f))
    dg = bpy.context.evaluated_depsgraph_get()
    allv = []
    imgcache = {}
    def base_pixels(mat):
        # the image wired into Base Color (Tripo: one per material)
        if not mat or not mat.use_nodes:
            return None
        for n in mat.node_tree.nodes:
            if n.type == "BSDF_PRINCIPLED":
                for l in n.inputs["Base Color"].links:
                    img = getattr(l.from_node, "image", None)
                    if img:
                        if img.name not in imgcache:
                            w, h = img.size
                            px = np.zeros(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px)
                            imgcache[img.name] = px.reshape(h, w, 4)
                        return imgcache[img.name]
                c = n.inputs["Base Color"].default_value
                return np.array(c, dtype=np.float32).reshape(1, 1, 4)
        return None
    for o in [o for o in bpy.data.objects if o.type == "MESH"]:
        me = o.data
        me.calc_loop_triangles()
        n = len(me.loop_triangles)
        tri = np.zeros(n * 3, dtype=np.int32); me.loop_triangles.foreach_get("vertices", tri)
        loops = np.zeros(n * 3, dtype=np.int32); me.loop_triangles.foreach_get("loops", loops)
        mi = np.zeros(n, dtype=np.int32); me.loop_triangles.foreach_get("material_index", mi)
        uv = np.zeros(len(me.loops) * 2, dtype=np.float32)
        if me.uv_layers:
            me.uv_layers[0].data.foreach_get("uv", uv)
        uvt = uv.reshape(-1, 2)[loops.reshape(-1, 3)]
        co = np.zeros(len(me.vertices) * 3, dtype=np.float32); me.vertices.foreach_get("co", co)
        co = co.reshape(-1, 3)
        M = np.array(o.matrix_world)
        co = co @ M[:3, :3].T + M[:3, 3]
        t = co[tri.reshape(-1, 3)]
        area = np.linalg.norm(np.cross(t[:, 1] - t[:, 0], t[:, 2] - t[:, 0]), axis=1) / 2
        pix = [base_pixels(me.materials[i] if i < len(me.materials) else None) for i in range(max(1, len(me.materials)))]
        allv.append((t, area, uvt, mi, pix))
    T = np.concatenate([a[0] for a in allv]); A = np.concatenate([a[1] for a in allv])
    UV = np.concatenate([a[2] for a in allv])
    owner = np.concatenate([np.full(len(a[0]), i) for i, a in enumerate(allv)])
    MI = np.concatenate([a[3] for a in allv])
    k = 250000
    idx = rng.choice(len(T), size=k, p=A / A.sum())
    u, v = rng.random(k), rng.random(k)
    flip = u + v > 1; u[flip], v[flip] = 1 - u[flip], 1 - v[flip]
    P = T[idx, 0] + (T[idx, 1] - T[idx, 0]) * u[:, None] + (T[idx, 2] - T[idx, 0]) * v[:, None]
    uvp = UV[idx, 0] + (UV[idx, 1] - UV[idx, 0]) * u[:, None] + (UV[idx, 2] - UV[idx, 0]) * v[:, None]
    C = np.full((k, 3), 0.8, dtype=np.float32)
    for oi, a in enumerate(allv):
        for m, px in enumerate(a[4]):
            if px is None:
                continue
            sel = (owner[idx] == oi) & (MI[idx] == m)
            h, w = px.shape[:2]
            x = np.clip((uvp[sel, 0] % 1.0) * (w - 1), 0, w - 1).astype(int)
            y = np.clip((uvp[sel, 1] % 1.0) * (h - 1), 0, h - 1).astype(int)  # Blender pixels start at the bottom row
            C[sel] = px[y, x, :3]
    base = os.path.join(OUT, os.path.splitext(f)[0])
    np.save(base + ".npy", P.astype(np.float32))
    np.save(base + "_rgb.npy", C)  # linear color
    print("SAMPLED", f, len(T))
