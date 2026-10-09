"""One Blender scene with every version side by side, one row per object:
  1 Still (image) | 2 Tripo original | 3 First pass (03_final) | 4 Solid clay (06) | 5 Tripo cleaned (07)
Each column is its own collection, so a whole version can be hidden with one click.
The Tripo originals are only turned and scaled like the others (nothing else changed) so the rows line up.

Blender --background --factory-startup --python compare_scene.py -- <models-v2 dir> <tripo dir> <stills dir> <alignment.json> <out.blend>
"""
import bpy, os, sys, json, math, glob
from mathutils import Matrix
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import common as C

base, TRIPO, STILLS, ALIGN, OUT = sys.argv[sys.argv.index("--") + 1:][:5]
align = json.load(open(ALIGN))
GAP_X, GAP_Z = 1.6, 1.5
COLS = [("1 Still", None), ("2 Tripo original", TRIPO), ("3 First pass", "03_final"),
        ("4 Solid clay", "06_solid_clay"), ("5 Tripo cleaned", "07_tripo_clean")]
names = sorted(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(STILLS, "*.png")))
names += [n for n in ("Stack 6D - Doll",) if n not in names]

C.reset()
sc = bpy.context.scene
colls = {}
for title, _ in COLS:
    c = bpy.data.collections.new(title); sc.collection.children.link(c); colls[title] = c


def text(body, loc, size=0.1, coll=None):
    cu = bpy.data.curves.new(body, "FONT"); cu.body = body; cu.size = size; cu.align_x = "CENTER"
    t = bpy.data.objects.new(body, cu); (coll or sc.collection).objects.link(t)
    t.location = loc; t.rotation_euler = (math.radians(90), 0, 0)
    return t


def move_to(objs, coll):
    for o in objs:
        for c in list(o.users_collection):
            c.objects.unlink(o)
        coll.objects.link(o)


def import_glb(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before]


labels = bpy.data.collections.new("Labels"); sc.collection.children.link(labels)
for j, (title, _) in enumerate(COLS):
    text(title, (j * GAP_X, 0, 0.85), 0.13, labels)
for i, name in enumerate(names):
    z = -i * GAP_Z
    text(name.replace("Stack ", ""), (-1.25, 0, z), 0.1, labels)
    for j, (title, src) in enumerate(COLS):
        x = j * GAP_X
        if src is None:
            p = os.path.join(STILLS, name + ".png")
            if not os.path.exists(p):
                p = os.path.join(TRIPO, name + ".png")    # the Doll's still lives next to the Tripo files
            if os.path.exists(p):
                img = bpy.data.images.load(os.path.abspath(p)); img.pack()
                e = bpy.data.objects.new(name + " still", None); colls[title].objects.link(e)
                e.empty_display_type = "IMAGE"; e.data = img; e.empty_display_size = 1.15
                e.location = (x, 0.6, z); e.rotation_euler = (math.radians(90), 0, 0)
            continue
        if src == TRIPO:
            p = os.path.join(TRIPO, name + ".glb")
            if not os.path.exists(p):
                text("no Tripo file", (x, 0, z), 0.08, colls[title]); continue
            new = import_glb(p)
            meshes = [o for o in new if o.type == "MESH"]
            C.select(meshes); bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
            for o in new:
                if o.type != "MESH":
                    bpy.data.objects.remove(o, do_unlink=True)
            C.select(meshes); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
            lo, hi = C.bounds(meshes)
            R = Matrix(align[name]["matrix"]).to_4x4() if name in align else Matrix.Identity(4)
            C.transform_all(meshes, R @ Matrix.Translation(-(lo + hi) / 2))
            C.normalize(meshes)
            root = bpy.data.objects.new(name + " (Tripo original)", None); sc.collection.objects.link(root)
            for o in meshes:
                o.parent = root
            new = meshes + [root]
        else:
            p = os.path.join(base, src, name + ".glb")
            if not os.path.exists(p):
                p = os.path.join(base, "04_from_scratch", name + ".glb")   # Cube + Doll: built in Blender
            if not os.path.exists(p):
                continue
            new = import_glb(p)
        for o in new:
            if o.parent is None:
                o.location = (x, 0, z)
        move_to(new, colls[title])
    print("ROW", name, flush=True)

C.lights_and_render((1600, 1600))
cd = bpy.data.cameras.new("Overview"); cd.type = "ORTHO"; cd.ortho_scale = len(names) * GAP_Z + 1
cam = bpy.data.objects.new("Overview", cd); sc.collection.objects.link(cam)
cam.location = ((len(COLS) - 1) * GAP_X / 2, -12, -(len(names) - 1) * GAP_Z / 2); cam.rotation_euler = (math.radians(90), 0, 0)
sc.camera = cam
bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
print("SAVED", OUT, flush=True)
