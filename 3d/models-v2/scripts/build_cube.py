"""Stack 6B - Cube: a clay Rubik's cube, built from scratch (no Tripo model exists).
Two parts so the website can animate it: "top layer" (twisted, can spin on hover) and "base".
Built upright and untwisted-facing; the view turn is found later by align_to_still.py.
Blender --background --factory-startup --python build_cube.py -- <out_dir>"""
import bpy, bmesh, sys, os, math, random
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(__file__))
import common as C

OUT = sys.argv[sys.argv.index("--") + 1]
NAME = "Stack 6B - Cube"
C.reset()
S = 1 / 3                 # cubie pitch
BODY = C.clay("cube body", "#2A1B15", 0.55)
COLORS = {"W": "#F3EFE6", "Y": "#F4C431", "R": "#E3472F", "O": "#F2802C", "B": "#2E90DA", "G": "#2FA65A"}
MATS = {k: C.clay(f"sticker {k}", v, 0.5) for k, v in COLORS.items()}
TWIST = -24               # degrees, top layer
random.seed(7)


def rounded_box(sx, sy, sz, r_corner, r_edge, seg_corner=6, seg_edge=3, corner_axis=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz))
    if corner_axis is not None:
        ax = {"x": 0, "y": 1, "z": 2}[corner_axis]
        edges = [e for e in bm.edges if abs((e.verts[0].co - e.verts[1].co)[ax]) > 1e-6]
        bmesh.ops.bevel(bm, geom=edges, offset=r_corner, segments=seg_corner, affect="EDGES", profile=0.5, clamp_overlap=True)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=r_edge, segments=seg_edge, affect="EDGES", profile=0.5, clamp_overlap=True)
    return bm


def mesh_from(bm, name, mat):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(mat); C.smooth(o)
    return o


# 48 moving stickers: each color 8 times, shuffled (a believable scramble); centers stay put
pool = [k for k in COLORS for _ in range(8)]
random.shuffle(pool)
CENTERS = {(0, 0, 1): "W", (0, 0, -1): "Y", (0, -1, 0): "R", (0, 1, 0): "O", (1, 0, 0): "B", (-1, 0, 0): "G"}

top, base = [], []
for i in (-1, 0, 1):
    for j in (-1, 0, 1):
        for k in (-1, 0, 1):
            if (i, j, k) == (0, 0, 0):
                continue
            group = top if k == 1 else base
            cub = mesh_from(rounded_box(S * 0.97, S * 0.97, S * 0.97, 0, S * 0.16, seg_edge=3), "cubie", BODY)
            cub.location = (i * S, j * S, k * S)
            group.append(cub)
            for n, (a, b, c) in ((Vector((1, 0, 0)), (i, j, k)), (Vector((-1, 0, 0)), (i, j, k)), (Vector((0, 1, 0)), (i, j, k)),
                                 (Vector((0, -1, 0)), (i, j, k)), (Vector((0, 0, 1)), (i, j, k)), (Vector((0, 0, -1)), (i, j, k))):
                pos = Vector((i, j, k))
                if pos.dot(n) != 1:
                    continue  # not an outer face
                face_center = (i == 0 or n.x != 0) and (j == 0 or n.y != 0) and (k == 0 or n.z != 0)
                col = CENTERS[tuple(int(v) for v in n)] if face_center else pool.pop()
                ax = "x" if n.x else "y" if n.y else "z"
                dims = [S * 0.8, S * 0.8, S * 0.8]; dims["xyz".index(ax)] = 0.03
                st = mesh_from(rounded_box(*dims, S * 0.15, 0.012, seg_corner=4, seg_edge=2, corner_axis=ax), "sticker", MATS[col])
                st.location = pos * S + n * (S * 0.485 + 0.006)
                group.append(st)

# merge into two parts (top layer / base); join keeps each material
def join(objs, name):
    C.select(objs); bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active; o.name = name
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return o

top_o, base_o = join(top, "top layer"), join(base, "base")
# twist the top layer around the vertical axis
C.transform_all([top_o], Matrix.Rotation(math.radians(TWIST), 4, "Z"))
# a touch of clay: soften with a light random wobble on every vertex
for o in (top_o, base_o):
    rnd = random.Random(3)
    for v in o.data.vertices:
        v.co += Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1))) * 0.0015
size = C.normalize([top_o, base_o])
C.finish([top_o, base_o], NAME, OUT, size)
