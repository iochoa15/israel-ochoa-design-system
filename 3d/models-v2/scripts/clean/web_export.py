"""08_web: light copies of the 07 editables for the website, without visible quality loss.
The editables in 07_tripo_clean/blend are only read, never saved.

What gets lighter (all invisible at the size the objects show on the site, ~150-400px wide):
  1. triangles: only the very heavy models (Pizza, Eva, Sailor Moon, ~1M) are reduced, to ~150k. The paint
     layout is kept, so the texture sits exactly where it was. Everything else keeps every triangle.
  2. paint images: Tripo saves 4096px images even for a tiny part (the skull has 58 parts with 174 images).
     Each image is resized to what its part needs: 2048px for a whole object, smaller for small pieces.
     Bump (normal) maps get half of that.
  3. files: WebP images + compressed geometry (meshopt), same as before.

Blender -b --factory-startup --python web_export.py -- <07 blend dir> <out dir> [name-filter]
"""
import bpy, bmesh, os, sys, json, math

argv = sys.argv[sys.argv.index("--") + 1:]
IN, OUT = argv[0], argv[1]
FILTER = argv[2] if len(argv) > 2 else ""
HEAVY, TARGET = 300_000, 150_000      # above HEAVY triangles, reduce to ~TARGET
MAX_COLOR, MIN_COLOR = 2048, 256
os.makedirs(OUT, exist_ok=True)
report_path = os.path.join(OUT, "report.json")
report = json.load(open(report_path)) if os.path.exists(report_path) else {}


def tris(objs):
    return sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs)


def area(o):
    return sum(p.area for p in o.data.polygons) or 1e-9


def pow2(n):
    return 2 ** max(0, math.ceil(math.log2(max(1, n))))


def images_of(mat):
    """(image, role) pairs plugged into this material: 'color' for base color, 'normal' for the bump map."""
    out = []
    if not mat or not mat.use_nodes:
        return out
    for n in mat.node_tree.nodes:
        if n.type != "TEX_IMAGE" or not n.image:
            continue
        linked = [l for o in n.outputs for l in o.links]
        if not linked:
            continue
        role = "normal" if any(l.to_node.type == "NORMAL_MAP" for l in linked) else "color"
        out.append((n.image, role))
    return out


for f in sorted(os.listdir(IN)):
    if not f.endswith(".blend") or FILTER not in f:
        continue
    name = f[:-6]
    bpy.ops.wm.open_mainfile(filepath=os.path.join(IN, f))
    roots = [o for o in bpy.data.objects if o.type == "EMPTY" and o.name.startswith("Stack")]
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    t_in = tris(meshes)
    mb_in = sum((i.packed_file.size if i.packed_file else 0) for i in bpy.data.images) / 1e6

    # 1. triangles (heavy models only)
    if t_in > HEAVY:
        ratio = TARGET / t_in
        for o in meshes:
            bpy.context.view_layer.objects.active = o
            d = o.modifiers.new("Web", "DECIMATE"); d.ratio = ratio; d.use_collapse_triangulate = True
            bpy.ops.object.modifier_apply(modifier=d.name)

    # 2. paint images sized to the part that uses them
    total = sum(area(o) for o in meshes)
    share = {}
    for o in meshes:
        for m in o.data.materials:
            for img, role in images_of(m):
                key = (img.name, role)
                share[key] = share.get(key, 0) + area(o) / total
    sizes = {}
    for (img_name, role), s in share.items():
        img = bpy.data.images[img_name]
        w, h = img.size
        if not w:
            continue
        cap = MAX_COLOR if role == "color" else MAX_COLOR // 2
        target = min(cap, max(MIN_COLOR, pow2(cap * math.sqrt(min(1.0, s)))), w)
        if target < w:
            img.scale(target, max(1, round(h * target / w)))
        sizes[img_name] = f"{w}->{img.size[0]}"

    # 3. export only the object (no reference image, camera or lights)
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes + roots:
        o.select_set(True)
    bpy.context.view_layer.objects.active = roots[0] if roots else meshes[0]
    out = os.path.join(OUT, name + ".glb")
    bpy.ops.export_scene.gltf(filepath=out, use_selection=True, export_format="GLB", export_yup=True, export_apply=True,
                              export_image_format="WEBP", export_image_quality=85,
                              export_meshopt_compression_enable=True, export_meshopt_extension="EXT_meshopt_compression",
                              export_materials="EXPORT", export_animations=False, export_cameras=False, export_lights=False)
    report[name] = {"triangles_in": t_in, "triangles_out": tris(meshes), "images": len(sizes),
                    "image_sizes": sizes, "mb_glb": round(os.path.getsize(out) / 1e6, 2)}
    json.dump(report, open(report_path, "w"), indent=1)
    print("WEB", name, t_in, "->", tris(meshes), "tris,", report[name]["mb_glb"], "MB", flush=True)
