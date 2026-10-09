"""Render each Tripo model with its geometry only (plain grey, no textures, no normal map), turned like the still."""
import bpy, os, sys, json, math
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import common as C
argv = sys.argv[sys.argv.index("--") + 1:]
IN, OUT, ALIGN = argv[0], argv[1], argv[2]
FILTER = argv[3] if len(argv) > 3 else ""
os.makedirs(OUT, exist_ok=True)
align = json.load(open(ALIGN))
for f in sorted(os.listdir(IN)):
    if not f.endswith(".glb") or FILTER not in f:
        continue
    name = f[:-4]
    C.reset(); C._mats.clear()
    bpy.ops.import_scene.gltf(filepath=os.path.join(IN, f))
    ms = [o for o in bpy.data.objects if o.type == "MESH"]
    C.select(ms); bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    for o in list(bpy.data.objects):
        if o.type != "MESH": bpy.data.objects.remove(o, do_unlink=True)
    lo, hi = C.bounds(ms)
    R = Matrix(align[name]["matrix"]).to_4x4() if name in align else Matrix.Identity(4)
    C.transform_all(ms, R @ Matrix.Translation(-(lo + hi) / 2))
    size = C.normalize(ms)
    grey = C.clay("grey", "#cfcac2")
    for o in ms:
        o.data.materials.clear(); o.data.materials.append(grey); C.smooth(o)
    C.lights_and_render((560, 560))
    C.shoot(os.path.join(OUT, name + "__geo.png"), (0, -5, 0), max(size["width"], size["height"]) * 1.08)
