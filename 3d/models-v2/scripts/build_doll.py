"""Stack 6D - Doll: clay matryoshka (big + small), built from scratch (no Tripo model exists).
Parts: "big doll", "small doll" (separate, so the small one can hop on hover).
Blender --background --factory-startup --python build_doll.py -- <out_dir>"""
import bpy, bmesh, sys, os, math
from mathutils import Vector, Matrix, noise
sys.path.insert(0, os.path.dirname(__file__))
import common as C
import clay_decals as D

OUT = sys.argv[sys.argv.index("--") + 1]
NAME = "Stack 6D - Doll"
C.reset()
M = {k: C.clay(k, v) for k, v in {
    "base green": "#2E4537", "body red": "#E0492F", "shawl yellow": "#E3D67C", "scarf blue": "#5266C6",
    "face cream": "#F2EDB8", "hair red": "#D8452E", "dot white": "#F6F3EA", "ink": "#1E1B1A",
    "lip red": "#D8302D", "cheek pink": "#F2A8A0", "flower blue": "#6C7FDB", "eye white": "#FBFAF5",
    "small scarf": "#D9452F", "small base": "#4A5FC0"}.items()}

# profile of a matryoshka (z, radius), height 1
PROFILE = [(0, 0), (0, 0.29), (0.008, 0.325), (0.035, 0.352), (0.1, 0.378), (0.22, 0.39), (0.34, 0.382), (0.45, 0.352),
           (0.54, 0.318), (0.6, 0.302), (0.66, 0.3), (0.73, 0.297), (0.8, 0.282), (0.87, 0.245), (0.93, 0.185),
           (0.97, 0.115), (0.993, 0.045), (1.0, 0)]


def catmull(pts, n):
    out = []
    P = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = (Vector(p) for p in P[i - 1:i + 3])
        for s in range(n):
            t = s / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(Vector(pts[-1]))
    return out


HEM = 0.535  # where the scarf ends (bottom row of dots)


def region(z, th, small):
    a = abs(th)
    if z < 0.105:
        return "base green"
    if z < HEM:
        if not small and z > 0.2 and a > 66:
            return "shawl yellow"
        return "body red"
    return "small scarf" if small else "scarf blue"


def body(name, small=False):
    prof = catmull(PROFILE, 9)
    segs = 72 if small else 128
    bm = bmesh.new()
    rings = []
    for z, r in [(p.x, p.y) for p in prof]:
        ring = []
        for j in range(segs):
            th = 2 * math.pi * j / segs
            x, y = math.sin(th) * r, -math.cos(th) * r
            q = Vector((x, y, z))
            # hand-made feel: a slow wobble plus fine thumb-press bumps
            wob = (noise.noise(q * 9) * 0.004 + noise.noise(q * 34) * 0.0018) if r > 0.01 else 0
            ring.append(bm.verts.new((x * (1 + wob), y * (1 + wob), z)))
        rings.append(ring)
    lay = []
    for i in range(len(rings) - 1):
        for j in range(segs):
            f = bm.faces.new((rings[i][j], rings[i][(j + 1) % segs], rings[i + 1][(j + 1) % segs], rings[i + 1][j]))
            zc = (rings[i][j].co.z + rings[i + 1][j].co.z) / 2
            th = math.degrees(2 * math.pi * (j + 0.5) / segs)
            th = th - 360 if th > 180 else th
            lay.append((f, region(zc, th, small)))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    names = list(dict.fromkeys(r for _, r in lay))
    for f, r in lay:
        if f.is_valid:
            f.material_index = names.index(r)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    for r in names:
        o.data.materials.append(M[r])
    C.smooth(o)
    return o


def petal(phi):
    return 1.0


def flower(S, theta, z, size, petal_mat, center_mat, tag):
    parts = []
    for k in range(6):
        a = k * 60
        # petal centers on a small circle around the flower center, converted to (theta, z) offsets
        du, dv = math.cos(math.radians(a)) * size * 0.62, math.sin(math.radians(a)) * size * 0.62
        loc, n = S.hit_radial(theta, z)
        r_here = math.hypot(loc.x, loc.y)
        parts.append(D.pad(S, f"{tag} petal", petal_mat, theta + math.degrees(du / r_here), z + dv, size * 0.42, size * 0.34,
                           thick=0.008, rot=a, layer=0.0))
    parts.append(D.pad(S, f"{tag} center", center_mat, theta, z, size * 0.22, size * 0.22, thick=0.008, layer=0.006))
    return parts


def dress(o, small=False):
    S = D.Surface([o])
    p = []
    # face, with the hair peeking out on top (proportions measured off the still: the face is ~2/3 of the head width)
    p.append(D.pad(S, "hair", M["hair red"], 0, 0.80, 0.255, 0.165, thick=0.008))
    p.append(D.pad(S, "face", M["face cream"], 0, 0.752, 0.235, 0.185, thick=0.012, layer=0.004))
    if not small:
        for side in (-1, 1):
            th = side * 21
            p.append(D.pad(S, "eye", M["eye white"], th, 0.805, 0.046, 0.026, thick=0.004, layer=0.014))
            p.append(D.pad(S, "pupil", M["ink"], th + side * 2.5, 0.803, 0.016, 0.019, thick=0.004, layer=0.017))
            # upper lid and brow: thin rolled lines
            p.append(D.line(S, "lid", M["ink"], [(th - 10, 0.807), (th - 4, 0.828), (th + 4, 0.83), (th + 10, 0.81)], 0.0038, 0.016))
            p.append(D.line(S, "brow", M["ink"], [(th - 9, 0.852), (th, 0.87), (th + 9, 0.86)], 0.0032, 0.015))
            p.append(D.pad(S, "cheek", M["cheek pink"], side * 30, 0.715, 0.046, 0.046, thick=0.005, layer=0.012))
        p.append(D.pad(S, "nose", M["face cream"], 0, 0.76, 0.017, 0.036, thick=0.01, layer=0.016))
        p.append(D.line(S, "nose", M["ink"], [(-1.8, 0.795), (-2.4, 0.765), (-1.2, 0.742), (1.8, 0.744)], 0.0026, 0.027))
        heart = lambda phi: 1.0 - 0.18 * math.cos(2 * phi) * (math.sin(phi) > 0)
        p.append(D.pad(S, "lips", M["lip red"], 0, 0.695, 0.04, 0.022, thick=0.006, layer=0.014, shape=heart))
    else:
        for side in (-1, 1):
            p.append(D.pad(S, "eye", M["ink"], side * 15, 0.78, 0.018, 0.018, thick=0.006, layer=0.014))
            p.append(D.pad(S, "cheek", M["cheek pink"], side * 22, 0.71, 0.04, 0.04, thick=0.005, layer=0.012))
        p.append(D.pad(S, "lips", M["lip red"], 0, 0.69, 0.03, 0.018, thick=0.006, layer=0.014))
    # white dots: along the scarf hem, and around the face
    for th in range(-165, 180, 21 if not small else 30):
        p.append(D.pad(S, "dot", M["dot white"], th, HEM + 0.025, 0.021 if not small else 0.04, 0.021 if not small else 0.04, thick=0.008, segs=24, rings=4))
    if not small:
        for th, z in [(-40, 0.6), (40, 0.6), (-42, 0.7), (42, 0.7), (-40, 0.8), (40, 0.8), (-33, 0.89), (33, 0.89), (-18, 0.955), (18, 0.955),
                      (0, 0.982), (-68, 0.64), (68, 0.64), (-66, 0.76), (66, 0.76), (-56, 0.87), (56, 0.87),
                      (-100, 0.68), (100, 0.68), (-95, 0.82), (95, 0.82), (-135, 0.72), (135, 0.72), (180, 0.7), (-160, 0.86), (160, 0.86)]:
            p.append(D.pad(S, "dot", M["dot white"], th, z, 0.019, 0.019, thick=0.008, segs=24, rings=4))
    # flowers on the apron
    for th in (-30, 30):
        p += flower(S, th * (1.1 if not small else 1), 0.3, 0.155 if not small else 0.17, M["flower blue"], M["dot white"], "flower")
    return [x for x in p if x]


def join(objs, name):
    C.select(objs); bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active; o.name = name
    return o


big = body("big body")
big = join([big] + dress(big), "big doll")
small = body("small body", small=True)
small = join([small] + dress(small, small=True), "small doll")
# small doll: a third of the size, in front and to the right
C.transform_all([small], Matrix.Translation((0.42, -0.2, 0)) @ Matrix.Scale(0.36, 4))
size = C.normalize([big, small])
C.finish([big, small], NAME, OUT, size)
