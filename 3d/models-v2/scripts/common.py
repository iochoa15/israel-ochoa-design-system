"""Shared helpers for the from-scratch builders: clay materials, website lights, preview renders, export."""
import bpy, math, os
from mathutils import Vector, Matrix

ROUGHNESS = 0.7


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def hex_rgb(h):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, 1.0)


_mats = {}


def clay(name, hex_color, rough=ROUGHNESS):
    key = (name, hex_color)
    if key in _mats and _mats[key].name in bpy.data.materials:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = hex_rgb(hex_color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = 0.0
    if "Specular IOR Level" in b.inputs:
        b.inputs["Specular IOR Level"].default_value = 0.35
    m.diffuse_color = hex_rgb(hex_color)
    _mats[key] = m
    return m


def select(objs, active=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]


def apply_mods(o):
    select([o])
    for m in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)


def smooth(o):
    for p in o.data.polygons:
        p.use_smooth = True


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


def normalize(objs, box=1.0, max_depth=1.6):
    lo, hi = bounds(objs)
    size = hi - lo
    k = min(box / max(size.x, size.z), max_depth / max(size.y, 1e-6))
    transform_all(objs, Matrix.Scale(k, 4) @ Matrix.Translation(-(lo + hi) / 2))
    return {"width": round(size.x * k, 3), "height": round(size.z * k, 3), "depth": round(size.y * k, 3)}


def view_turn(yaw, pitch, roll=0):
    """Same convention as align_to_still.py: Ry(roll) @ Rx(pitch) @ Rz(yaw)."""
    return Matrix.Rotation(math.radians(roll), 4, "Y") @ Matrix.Rotation(math.radians(pitch), 4, "X") @ Matrix.Rotation(math.radians(yaw), 4, "Z")


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


def finish(objs, name, out_dir, size=None):
    """Root empty + export .glb + front and 3/4 previews."""
    root = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(root)
    for o in objs:
        o.parent = root
    os.makedirs(os.path.join(out_dir, "previews"), exist_ok=True)
    out = os.path.join(out_dir, name + ".glb")
    select(objs + [root], active=root)
    bpy.ops.export_scene.gltf(filepath=out, use_selection=True, export_format="GLB", export_yup=True, export_apply=True,
                              export_image_format="WEBP", export_image_quality=88,
                              export_meshopt_compression_enable=True, export_meshopt_extension="EXT_meshopt_compression",
                              export_materials="EXPORT", export_animations=False, export_cameras=False, export_lights=False)
    lights_and_render((640, 640))
    size = size or {"width": 1, "height": 1, "depth": 1}
    shoot(os.path.join(out_dir, "previews", name + "__front.png"), (0, -5, 0), max(size["width"], size["height"]) * 1.08)
    shoot(os.path.join(out_dir, "previews", name + "__angle.png"), (3.2, -3.6, 2.0), max(size.values()) * 1.35)
    tri = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in objs if o.type == "MESH")
    print("BUILT", name, "tris", tri, "mb", round(os.path.getsize(out) / 1e6, 2), size, flush=True)
    return out
