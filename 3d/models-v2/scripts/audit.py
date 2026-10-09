"""Audit Tripo GLBs: triangle count, parts, materials, textures, size. Renders a front view of each.
Blender --background --factory-startup --python audit.py -- <in_dir> <out_dir>"""
import bpy, os, sys, json, math
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:]
IN, OUT = argv[0], argv[1]
only = argv[2] if len(argv) > 2 else None
os.makedirs(OUT, exist_ok=True)
report = []

def look(cam_loc, size):
    cam = bpy.data.cameras.new("C"); cam.type = "ORTHO"; cam.ortho_scale = size * 1.15
    o = bpy.data.objects.new("C", cam); bpy.context.scene.collection.objects.link(o)
    o.location = cam_loc
    o.rotation_euler = (-Vector(cam_loc)).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = o

for f in sorted(os.listdir(IN)):
    if not f.endswith(".glb") or (only and only not in f):
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(IN, f))
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes)
    imgs = [(i.name, list(i.size)) for i in bpy.data.images]
    mats = [m.name for m in bpy.data.materials]
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    size = hi - lo; mid = (lo + hi) / 2
    for o in meshes:
        o.location -= mid
    report.append({"file": f, "meshes": len(meshes), "tris": tris, "materials": mats, "images": imgs,
                   "size_xyz": [round(v, 3) for v in size]})
    # render front (-Y looking +Y) with flat-ish studio light
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x = sc.render.resolution_y = 512
    sc.render.film_transparent = True
    sc.view_settings.view_transform = "Standard"
    w = bpy.data.worlds.new("W"); w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (1, 1, 1, 1)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
    sc.world = w
    L = bpy.data.lights.new("K", "SUN"); L.energy = 2.5
    lo_ = bpy.data.objects.new("K", L); sc.collection.objects.link(lo_)
    lo_.rotation_euler = (math.radians(50), 0, math.radians(30))
    m = max(size.x, size.z)
    name = os.path.splitext(f)[0]
    for suf, loc in (("front", (0, -5, 0)), ("side", (5, 0, 0)), ("angle", (3, -3.5, 2))):
        look(Vector(loc) * max(size) , max(m, size.y if suf=="side" else m) if suf != "angle" else max(size) * 1.25)
        sc.render.filepath = os.path.join(OUT, f"{name}__{suf}.png")
        bpy.ops.render.render(write_still=True)
json.dump(report, open(os.path.join(OUT, "audit.json" if not only else f"audit_{only}.json"), "w"), indent=1)
print("AUDIT_DONE")
