"""Refine Tripo models so they look like the still illustrations, and are light enough for the website.

For every .glb:
  1. import; keep meaningful parts (bricks, bottle cap...) as separate pieces under one root
  2. turn it so its front view matches the still (angles from work/alignment.json, found by align_to_still.py)
  3. heavy models (~1M triangles): lower to ~40k and bake the lost detail into a normal map
  4. models made of many tiny parts (the skull: 58 parts, 174 images): merge into one piece with one texture set
  5. one shared clay finish: matte, no metal (keeps Tripo's colors)
  6. center + scale so the front view fits a 1 x 1 square, export .glb (WebP textures, compressed mesh)
  7. render a front preview (website lights) and a 3/4 view

Blender --background --factory-startup --python refine.py -- <in_dir> <out_dir> <alignment.json> [name-filter]
"""
import bpy, bmesh, os, sys, json, math
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--") + 1:]
IN, OUT, ALIGN = argv[0], argv[1], argv[2]
FILTER = argv[3] if len(argv) > 3 and not argv[3].startswith("--") else ""
# one or more color corrections (from color_match.py), applied in order: --color a.json,b.json
# width fixes so the outline has the still's proportions (proportions.py): --shape proportions.json
SHAPE = json.load(open(argv[argv.index("--shape") + 1])) if "--shape" in argv else {}
COLORS = [json.load(open(p)) for p in argv[argv.index("--color") + 1].split(",")] if "--color" in argv else []
TARGET_TRIS = 40000
HEAVY = 80000          # above this, decimate + bake
MERGE_PARTS = 20       # more parts than this -> merge into one texture set
BASE_TEX, NORMAL_TEX, ATLAS_TEX = 2048, 1024, 2048
ROUGHNESS = 0.7
BOX, MAX_DEPTH = 1.0, 1.6
os.makedirs(os.path.join(OUT, "previews"), exist_ok=True)
align = json.load(open(ALIGN))
report_path = os.path.join(OUT, "report.json")
report = json.load(open(report_path)) if os.path.exists(report_path) else {}


def tris(objs):
    return sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs)


def select(objs, active=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]


def import_parts(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    select(meshes)
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for o in list(bpy.data.objects):
        if o.type != "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    for o in meshes:
        bm = bmesh.new(); bm.from_mesh(o.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
        bm.to_mesh(o.data); bm.free()
    return meshes


def bounds(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


def transform_all(objs, M):
    for o in objs:
        o.matrix_world = M @ o.matrix_world
    select(objs)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def principled(mat):
    if not mat or not mat.use_nodes:
        return None
    return next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)


def cycles_bake_setup():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        sc.cycles.device = "GPU"
    except Exception:
        sc.cycles.device = "CPU"
    sc.cycles.samples = 1
    sc.render.bake.use_selected_to_active = True
    sc.render.bake.cage_extrusion = 0.01
    sc.render.bake.max_ray_distance = 0.03
    sc.render.bake.margin = 8


def bake_into(low, high, img, kind):
    """kind: NORMAL or DIFFUSE (color only). Writes into img through a temporary node in every material of low."""
    added = []
    for mat in low.data.materials:
        t = mat.node_tree.nodes.new("ShaderNodeTexImage"); t.image = img
        mat.node_tree.nodes.active = t; added.append((mat, t))
    select([high, low], active=low)
    sc = bpy.context.scene
    if kind == "DIFFUSE":
        sc.render.bake.use_pass_direct = False
        sc.render.bake.use_pass_indirect = False
        sc.render.bake.use_pass_color = True
    bpy.ops.object.bake(type=kind)
    for mat, t in added:
        mat.node_tree.nodes.remove(t)


def decimate_and_bake(obj, name):
    high = obj.copy(); high.data = obj.data.copy(); high.name = name + "_high"
    bpy.context.scene.collection.objects.link(high)
    m = obj.modifiers.new("Decimate", "DECIMATE")
    m.ratio = TARGET_TRIS / tris([obj]); m.use_collapse_triangulate = True
    select([obj]); bpy.ops.object.modifier_apply(modifier=m.name)
    cycles_bake_setup()
    img = bpy.data.images.new(name + "_normal", NORMAL_TEX * 2, NORMAL_TEX * 2, alpha=False)
    img.colorspace_settings.name = "Non-Color"
    # the bake needs a plain material (Tripo's normal map on the low copy would be counted twice)
    bake_into(obj, high, img, "NORMAL")
    img.scale(NORMAL_TEX, NORMAL_TEX)
    for mat in obj.data.materials:
        b = principled(mat)
        if not b:
            continue
        nt = mat.node_tree
        old = [l.from_node for l in b.inputs["Normal"].links]
        for n in old:
            for l in list(n.inputs["Color"].links):
                nt.nodes.remove(l.from_node)
            nt.nodes.remove(n)
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = img
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nt.links.new(t.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    bpy.data.objects.remove(high, do_unlink=True)


def merge_to_atlas(parts, name):
    select(parts); bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active; obj.name = name
    high = obj.copy(); high.data = obj.data.copy(); high.name = name + "_high"
    bpy.context.scene.collection.objects.link(high)
    # new single UV layout on the low copy
    me = obj.data
    while len(me.uv_layers) > 1:
        me.uv_layers.remove(me.uv_layers[-1])
    select([obj]); bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004)
    bpy.ops.object.mode_set(mode="OBJECT")
    cycles_bake_setup()
    col = bpy.data.images.new(name + "_basecolor", ATLAS_TEX, ATLAS_TEX, alpha=False)
    nor = bpy.data.images.new(name + "_normal", ATLAS_TEX, ATLAS_TEX, alpha=False); nor.colorspace_settings.name = "Non-Color"
    bake_into(obj, high, col, "DIFFUSE")
    bake_into(obj, high, nor, "NORMAL")
    nor.scale(NORMAL_TEX, NORMAL_TEX)
    mat = bpy.data.materials.new(name + "_clay"); mat.use_nodes = True
    nt = mat.node_tree; b = principled(mat)
    tc = nt.nodes.new("ShaderNodeTexImage"); tc.image = col
    tn = nt.nodes.new("ShaderNodeTexImage"); tn.image = nor
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(tc.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(tn.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    me.materials.clear(); me.materials.append(mat)
    bpy.data.objects.remove(high, do_unlink=True)
    return [obj]


def clay_finish(objs):
    for o in objs:
        for mat in o.data.materials:
            b = principled(mat)
            if not b:
                continue
            for k, v in (("Metallic", 0.0), ("Roughness", ROUGHNESS)):
                for l in list(b.inputs[k].links):
                    mat.node_tree.links.remove(l)
                b.inputs[k].default_value = v
            if "Specular IOR Level" in b.inputs:
                b.inputs["Specular IOR Level"].default_value = 0.35
            if "Emission Strength" in b.inputs:
                b.inputs["Emission Strength"].default_value = 0.0
            # drop the now unused roughness/metal image
            for n in list(mat.node_tree.nodes):
                if n.type in ("TEX_IMAGE", "SEPARATE_COLOR") and not any(s.links for s in n.outputs):
                    mat.node_tree.nodes.remove(n)


def _lab(rgb):
    import numpy as np
    c = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.9505, 1.0, 1.089])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def _rgb(L):
    import numpy as np
    fy = (L[..., 0] + 16) / 116; fx = fy + L[..., 1] / 500; fz = fy - L[..., 2] / 200
    f = np.stack([fx, fy, fz], -1)
    xyz = np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787) * np.array([0.9505, 1.0, 1.089])
    Mi = np.array([[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]])
    c = np.clip(xyz @ Mi.T, 0, 1)
    return np.where(c <= 0.0031308, 12.92 * c, 1.055 * np.power(c, 1 / 2.4) - 0.055)


def color_correct(objs, k):
    """Nudge the color textures toward the still (lightness, saturation, small tint), computed by color_match.py."""
    import numpy as np
    done = set()
    for o in objs:
        for mat in o.data.materials:
            b = principled(mat)
            if not b:
                continue
            for l in b.inputs["Base Color"].links:
                img = getattr(l.from_node, "image", None)
                if not img or img.name in done:
                    continue
                done.add(img.name)
                w, h = img.size
                px = np.zeros(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px)
                px = px.reshape(-1, 4)
                L = _lab(np.clip(px[:, :3], 0, 1))
                L[:, 0] = L[:, 0] * k["L_scale"] + k["L_shift"]
                L[:, 1:] = L[:, 1:] * k["chroma_scale"] + np.array(k["ab_shift"])
                px[:, :3] = _rgb(L)
                img.pixels.foreach_set(px.ravel())
                img.update()


def shrink_textures(objs):
    for img in bpy.data.images:
        if img.size[0] == 0:
            continue
        cap = NORMAL_TEX if img.colorspace_settings.name == "Non-Color" else BASE_TEX
        if max(img.size) > cap:
            img.scale(cap, cap)


def normalize(objs):
    lo, hi = bounds(objs)
    size = hi - lo
    k = min(BOX / max(size.x, size.z), MAX_DEPTH / max(size.y, 1e-6))
    transform_all(objs, Matrix.Scale(k, 4) @ Matrix.Translation(-(lo + hi) / 2))
    return {"width": round(size.x * k, 3), "height": round(size.z * k, 3), "depth": round(size.y * k, 3)}


def lights_and_render(res):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.film_transparent = True
    sc.view_settings.view_transform = "AgX"
    try:
        sc.view_settings.look = "AgX - Base Contrast"
    except TypeError:
        pass
    w = bpy.data.worlds.new("Studio"); w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.93, 0.92, 0.9, 1); bg.inputs["Strength"].default_value = 0.9
    sc.world = w
    for nm, e, c, d in (("Key", 3.2, (1, 1, 1), (2.5, 3, 4)), ("Rim", 1.4, (0.87, 0.9, 1.0), (-3, 1, -2.5))):
        L = bpy.data.lights.new(nm, "SUN"); L.energy = e; L.color = c; L.angle = math.radians(12)
        o = bpy.data.objects.new(nm, L); sc.collection.objects.link(o)
        v = Vector((d[0], -d[2], d[1])); o.rotation_euler = (-v).to_track_quat("-Z", "Y").to_euler()


def shoot(path, loc, ortho):
    cd = bpy.data.cameras.new("Cam"); cd.type = "ORTHO"; cd.ortho_scale = ortho
    cam = bpy.data.objects.new("Cam", cd); bpy.context.scene.collection.objects.link(cam)
    cam.location = loc
    cam.rotation_euler = (-Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


for f in sorted(os.listdir(IN)):
    if not f.endswith(".glb") or FILTER not in f:
        continue
    name = os.path.splitext(f)[0]
    src = os.path.join(IN, f)
    print(f"\n=== {name} ===", flush=True)
    parts = import_parts(src)
    t_in, n_parts = tris(parts), len(parts)
    # 1) turn to match the still (angles were found on the centered model)
    lo, hi = bounds(parts)
    a = align.get(name)
    R = Matrix(a["matrix"]).to_4x4() if a else Matrix.Identity(4)
    transform_all(parts, R @ Matrix.Translation(-(lo + hi) / 2))
    sh = SHAPE.get(name)
    if sh and sh.get("apply"):
        k = sh["width_scale"]  # narrower/wider seen from the front; depth follows so round things stay round
        transform_all(parts, Matrix.Diagonal((k, k, 1, 1)))
    # 2) heavy -> lighter + baked detail
    baked = merged = False
    if n_parts > MERGE_PARTS:
        parts = merge_to_atlas(parts, name); merged = True
    elif t_in > HEAVY and "--keep-mesh" not in argv:
        if n_parts > 1:
            select(parts); bpy.ops.object.join(); parts = [bpy.context.view_layer.objects.active]
        decimate_and_bake(parts[0], name); baked = True
    clay_finish(parts)
    shrink_textures(parts)
    for C_ in COLORS:
        if name in C_ and C_[name].get("apply", True):
            color_correct(parts, C_[name])
    size = normalize(parts)
    # 3) one root so the website can move the whole thing; parts keep their names
    root = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(root)
    for i, o in enumerate(parts):
        o.name = f"{name} · part {i + 1}" if len(parts) > 1 else f"{name} · mesh"
        o.parent = root
    out = os.path.join(OUT, name + ".glb")
    select(parts + [root], active=root)
    bpy.ops.export_scene.gltf(filepath=out, use_selection=True, export_format="GLB", export_yup=True, export_apply=True,
                              export_image_format="WEBP", export_image_quality=88,
                              export_meshopt_compression_enable=True, export_meshopt_extension="EXT_meshopt_compression",
                              export_materials="EXPORT", export_animations=False, export_cameras=False, export_lights=False)
    lights_and_render((640, 640))
    ortho = max(size["width"], size["height"]) * 1.08
    shoot(os.path.join(OUT, "previews", name + "__front.png"), (0, -5, 0), ortho)
    shoot(os.path.join(OUT, "previews", name + "__angle.png"), (3.2, -3.6, 2.0), max(size.values()) * 1.35)
    report[name] = {"parts_in": n_parts, "parts_out": len(parts), "triangles_in": t_in, "triangles_out": tris(parts),
                    "decimated_and_baked": baked, "merged_into_one_texture": merged,
                    "turn": {k: a[k] for k in ("yaw", "pitch", "roll")} if a else None, "size": size,
                    "mb_in": round(os.path.getsize(src) / 1e6, 2), "mb_out": round(os.path.getsize(out) / 1e6, 2)}
    json.dump(report, open(report_path, "w"), indent=1)
    print("DONE", name, report[name], flush=True)
