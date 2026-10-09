"""Editable .blend for a model that has no Tripo file (Cube, Doll): same setup as clean_tripo.py
(front camera, website-like lights, the still as a hidden see-through reference).
Blender -b --factory-startup --python make_editable.py -- <model.glb> <still.png> <out.blend>"""
import bpy, sys, os, math
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import common as C
glb, still, out = sys.argv[sys.argv.index("--") + 1:][:3]
C.reset()
bpy.ops.import_scene.gltf(filepath=glb)
objs = [o for o in bpy.data.objects if o.type == "MESH"]
lo, hi = C.bounds(objs)
size = {"width": hi.x - lo.x, "height": hi.z - lo.z}
sc = bpy.context.scene
if os.path.exists(still):
    img = bpy.data.images.load(os.path.abspath(still)); img.pack()
    e = bpy.data.objects.new("Still (reference)", None); sc.collection.objects.link(e)
    e.empty_display_type = "IMAGE"; e.data = img; e.empty_display_size = 1.25
    e.empty_image_side = "FRONT"; e.use_empty_image_alpha = True; e.color[3] = 0.5
    e.location = (0, -2, 0); e.rotation_euler = (math.radians(90), 0, 0)
    e.hide_set(True)
C.lights_and_render((1080, 1080))
cd = bpy.data.cameras.new("Front"); cd.type = "ORTHO"; cd.ortho_scale = max(size.values()) * 1.12
cam = bpy.data.objects.new("Front camera", cd); sc.collection.objects.link(cam)
cam.location = (0, -5, 0); cam.rotation_euler = (math.radians(90), 0, 0); sc.camera = cam
for i in bpy.data.images:
    if not i.packed_file and i.source == "FILE":
        i.pack()
bpy.ops.wm.save_as_mainfile(filepath=out, compress=True)
print("EDITABLE", out)
