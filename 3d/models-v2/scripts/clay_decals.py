"""Clay "stickers": small pads and thin rolled lines pressed onto a surface (faces, dots, flowers, letters...).
Each pad hugs the surface it is pressed onto: flat top, rounded edge, slightly sunk at the rim so there is no gap."""
import bpy, bmesh, math
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree


class Surface:
    def __init__(self, objs):
        dg = bpy.context.evaluated_depsgraph_get()
        bm = bmesh.new()
        for o in objs:
            tmp = bmesh.new(); tmp.from_mesh(o.data); tmp.transform(o.matrix_world)
            me = bpy.data.meshes.new("tmp"); tmp.to_mesh(me); tmp.free()
            bm.from_mesh(me); bpy.data.meshes.remove(me)
        self.bvh = BVHTree.FromBMesh(bm)
        bm.free()

    def hit_radial(self, theta_deg, z, axis_xy=(0.0, 0.0)):
        """Point on the surface at angle theta (0 = front, facing -Y; positive = to the viewer's right) and height z."""
        t = math.radians(theta_deg)
        d = Vector((math.sin(t), -math.cos(t), 0))
        origin = Vector((axis_xy[0], axis_xy[1], z)) + d * 5
        loc, nor, _, _ = self.bvh.ray_cast(origin, -d)
        return loc, nor

    def project(self, p, nor):
        loc, n, _, _ = self.bvh.ray_cast(p + nor * 0.3, -nor, 0.6)
        if loc is None:
            loc, n, _, _ = self.bvh.find_nearest(p)
        return loc, n


def _frame(n):
    up = Vector((0, 0, 1))
    t = up.cross(n)
    if t.length < 1e-4:
        t = Vector((1, 0, 0))
    t.normalize()  # points to the viewer's right when looking at the surface
    t = -t
    b = n.cross(t).normalized()
    return t, b


def pad(surface, name, mat, theta, z, rx, rz, thick=0.01, rot=0.0, layer=0.0, axis_xy=(0, 0), rings=6, segs=36, shape=None):
    """Ellipse pad centered at (theta, z). rx/rz = half width/height along the surface. rot in degrees.
    shape(phi) -> radius multiplier for non-ellipse outlines (petals, hearts)."""
    c, n = surface.hit_radial(theta, z, axis_xy)
    if c is None:
        return None
    t, b = _frame(n)
    r = math.radians(rot)
    bm = bmesh.new()
    rows = []
    center = None
    for i in range(rings + 1):
        rho = i / rings
        if i == 0:
            center = bm.verts.new(_place(surface, c, n, t, b, 0, 0, 0, thick, layer))
            continue
        ring = []
        for j in range(segs):
            phi = 2 * math.pi * j / segs
            k = shape(phi) if shape else 1.0
            u, v = math.cos(phi) * rx * rho * k, math.sin(phi) * rz * rho * k
            u, v = u * math.cos(r) - v * math.sin(r), u * math.sin(r) + v * math.cos(r)
            ring.append(bm.verts.new(_place(surface, c, n, t, b, u, v, rho, thick, layer)))
        rows.append(ring)
    for j in range(segs):
        bm.faces.new((center, rows[0][j], rows[0][(j + 1) % segs]))
    for i in range(len(rows) - 1):
        for j in range(segs):
            a, b2 = rows[i][j], rows[i][(j + 1) % segs]
            c2, d = rows[i + 1][(j + 1) % segs], rows[i + 1][j]
            bm.faces.new((a, d, c2, b2))
    # close the underside so the pad is a solid piece
    rim = rows[-1]
    bottom = bm.faces.new(list(reversed(rim)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(mat)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def _place(surface, c, n, t, b, u, v, rho, thick, layer):
    p = c + t * u + b * v
    loc, nn = surface.project(p, n)
    h = thick * max(0.0, 1 - rho ** 6) ** (1 / 3) + layer - 0.003 * rho ** 4
    return loc + nn * h


def line(surface, name, mat, pts_theta_z, radius=0.004, layer=0.004, axis_xy=(0, 0)):
    """A thin rolled clay line through (theta, z) points, pressed onto the surface."""
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"
    cu.bevel_depth = radius; cu.bevel_resolution = 3; cu.use_fill_caps = True
    sp = cu.splines.new("NURBS"); sp.points.add(len(pts_theta_z) - 1)
    sp.use_endpoint_u = True; sp.order_u = min(4, len(pts_theta_z))
    for i, (th, z) in enumerate(pts_theta_z):
        loc, n = surface.hit_radial(th, z, axis_xy)
        p = loc + n * (layer + radius * 0.4)
        sp.points[i].co = (p.x, p.y, p.z, 1)
    sp.resolution_u = 10
    o = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(mat)
    bpy.ops.object.select_all(action="DESELECT"); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.view_layer.objects.active
    for p in o.data.polygons:
        p.use_smooth = True
    return o
