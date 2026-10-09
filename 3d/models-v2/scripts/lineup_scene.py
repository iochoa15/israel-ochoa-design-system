"""Build a Blender scene with every finished model in a row (lit like the website), saved as 05_compare/all_models.blend.
Blender --background --factory-startup --python lineup_scene.py -- <models-v2 dir>"""
import bpy, sys, os, glob, math
from mathutils import Vector
sys.path.insert(0, os.path.dirname(__file__))
import common as C
args = sys.argv[sys.argv.index("--") + 1:]
base = args[0]
# optional: which model folder to line up and where to save (default: 03_final + 04_from_scratch -> 05_compare/all_models)
SRC = args[1].split(",") if len(args) > 1 else ["03_final", "04_from_scratch"]
OUT = args[2] if len(args) > 2 else os.path.join("05_compare", "all_models")
C.reset()
files = [f for d in SRC for f in sorted(glob.glob(os.path.join(base, d, "*.glb")))]
cols = 6
for i, f in enumerate(files):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=f)
    roots = [o for o in bpy.data.objects if o not in before and o.parent is None]
    for r in roots:
        r.location = ((i % cols) * 1.5, 0, -(i // cols) * 1.5)
    txt = bpy.data.curves.new(os.path.basename(f)[:-4], "FONT"); txt.body = os.path.basename(f)[:-4].replace("Stack ", "")
    txt.size = 0.09; txt.align_x = "CENTER"
    t = bpy.data.objects.new("label", txt); bpy.context.scene.collection.objects.link(t)
    t.location = ((i % cols) * 1.5, 0, -(i // cols) * 1.5 - 0.62); t.rotation_euler = (math.radians(90), 0, 0)
C.lights_and_render((1920, 1280))
cd = bpy.data.cameras.new("Front"); cd.type = "ORTHO"; cd.ortho_scale = cols * 1.5 + 0.4
cam = bpy.data.objects.new("Front", cd); bpy.context.scene.collection.objects.link(cam)
cam.location = ((cols - 1) * 0.75, -12, -((len(files) - 1) // cols) * 0.75); cam.rotation_euler = (math.radians(90), 0, 0)
bpy.context.scene.camera = cam
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(base, OUT + ".blend"))
bpy.context.scene.render.filepath = os.path.join(base, OUT + "_lineup.png")
bpy.ops.render.render(write_still=True)
print("LINEUP", len(files))
