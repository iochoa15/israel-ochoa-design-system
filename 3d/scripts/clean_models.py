"""
Clean Tripo exports for the website, in Blender (run headless).

For every .glb in the input folder:
  1. import, join into one object, remove junk geometry
  2. lower the polygon count (keeps the texture), optionally bake the lost detail into a normal map
  3. give it the shared clay finish (matte, no metal) while keeping Tripo's colors
  4. center it and scale it so its front view fills the same square as every other object
     (Tripo keeps your reference image's angle as the "front", which is what the website shows)
  5. export a small .glb (WebP textures + compressed mesh) and render previews with the website's lights
Then renders one contact sheet with every object side by side (to check they match in size).

Usage:
  Blender --background --factory-startup --python clean_models.py -- <in_dir> <out_dir> [--tris 40000] [--bake] [--tex 1024]
"""

import bpy
import bmesh
import json
import math
import os
import sys
from mathutils import Vector

# ---------- settings ----------
argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
if len(argv) < 2:
    raise SystemExit("usage: ... -- <in_dir> <out_dir> [--tris N] [--bake] [--tex N]")
IN_DIR, OUT_DIR = os.path.abspath(argv[0]), os.path.abspath(argv[1])


def opt(name, default):
    return type(default)(argv[argv.index(name) + 1]) if name in argv else default


TARGET_TRIS = opt("--tris", 40000)  # 8k showed streaks at intro size; 40k holds up big
TEX_SIZE = opt("--tex", 1024)
BAKE = "--bake" in argv
BOX = 1.0  # every object's front view fits a BOX x BOX square
MAX_DEPTH = 1.6  # ...unless it is very deep front-to-back, then shrink so depth <= MAX_DEPTH
CLAY_ROUGHNESS = 0.72

os.makedirs(os.path.join(OUT_DIR, "previews"), exist_ok=True)


# ---------- helpers ----------
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def tri_count(obj):
    return sum(len(p.vertices) - 2 for p in obj.data.polygons)


def import_glb(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    if not meshes:
        raise RuntimeError("no mesh found")
    # Apply parent transforms so joining keeps everything where it was.
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    for o in new:  # drop empties/cameras/lights that came with the file
        if o != obj and o.name in bpy.data.objects:
            bpy.data.objects.remove(o, do_unlink=True)
    return obj


def clean_geometry(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    loose = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose, context="VERTS")
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()


def decimate(obj, target):
    tris = tri_count(obj)
    if tris <= target:
        return False
    mod = obj.modifiers.new("Decimate", "DECIMATE")
    mod.decimate_type = "COLLAPSE"
    mod.ratio = target / tris
    mod.use_collapse_triangulate = True
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return True


def principled(mat):
    if not mat or not mat.use_nodes:
        return None
    return next((n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)


def bake_normals(high, low, size):
    """Paint the detail the high-poly model had onto the lighter one as a normal map."""
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 1
    img = bpy.data.images.new(low.name + "_normal", size, size, alpha=False, float_buffer=False)
    img.colorspace_settings.name = "Non-Color"
    nodes_added = []
    for mat in low.data.materials:
        if not mat or not mat.use_nodes:
            continue
        tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = img
        mat.node_tree.nodes.active = tex
        nodes_added.append((mat, tex))
    bpy.ops.object.select_all(action="DESELECT")
    high.select_set(True)
    low.select_set(True)
    bpy.context.view_layer.objects.active = low
    bpy.ops.object.bake(type="NORMAL", use_selected_to_active=True, cage_extrusion=0.02, margin=8)
    # Wire the baked map into each material.
    for mat, tex in nodes_added:
        bsdf = principled(mat)
        if not bsdf:
            continue
        nm = mat.node_tree.nodes.new("ShaderNodeNormalMap")
        mat.node_tree.links.new(tex.outputs["Color"], nm.inputs["Color"])
        mat.node_tree.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    return img


def clay_finish(obj):
    """Keep Tripo's colors, but make every object the same matte, non-metal clay."""
    for mat in obj.data.materials:
        bsdf = principled(mat)
        if not bsdf:
            continue
        for name, value in (("Metallic", 0.0), ("Roughness", CLAY_ROUGHNESS)):
            sock = bsdf.inputs[name]
            for link in list(sock.links):
                mat.node_tree.links.remove(link)
            sock.default_value = value
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = 0.0
        if "Specular IOR Level" in bsdf.inputs:
            bsdf.inputs["Specular IOR Level"].default_value = 0.35


def shrink_textures(obj, size):
    seen = set()
    for mat in obj.data.materials:
        if not mat or not mat.use_nodes:
            continue
        for n in mat.node_tree.nodes:
            img = getattr(n, "image", None)
            if img and img.name not in seen and max(img.size) > size:
                seen.add(img.name)
                img.scale(size, size)


def normalize(obj):
    """Center on the origin; scale so the front view (width x height) fits BOX."""
    bpy.context.view_layer.objects.active = obj
    corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    lo = Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners)))
    hi = Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))
    size = hi - lo
    obj.location -= (lo + hi) / 2
    # Blender is Z-up: front view = X (width) and Z (height); Y is depth.
    k = min(BOX / max(size.x, size.z), MAX_DEPTH / max(size.y, 1e-6))
    obj.scale *= k
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return {"width": round(size.x * k, 3), "height": round(size.z * k, 3), "depth": round(size.y * k, 3)}


def website_lights():
    """Same rig as Clay3D.tsx: soft sky fill, key from top right, cool rim from behind."""
    world = bpy.data.worlds.new("Studio")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = (0.93, 0.92, 0.9, 1)
    bg.inputs["Strength"].default_value = 0.9
    bpy.context.scene.world = world

    def sun(name, energy, color, direction):
        light = bpy.data.lights.new(name, "SUN")
        light.energy = energy
        light.color = color
        light.angle = math.radians(12)
        o = bpy.data.objects.new(name, light)
        bpy.context.scene.collection.objects.link(o)
        # glTF/three.js uses Y-up; Blender uses Z-up. (x, y, z)three -> (x, -z, y)blender
        d = Vector((direction[0], -direction[2], direction[1]))
        o.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()

    sun("Key", 3.2, (1, 1, 1), (2.5, 3, 4))
    sun("Rim", 1.4, (0.87, 0.9, 1.0), (-3, 1, -2.5))


def setup_render(res):
    scene = bpy.context.scene
    for engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    scene.render.resolution_x = res[0]
    scene.render.resolution_y = res[1]
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Base Contrast"
    except TypeError:
        pass


def camera(location, target, ortho_scale=None):
    cam_data = bpy.data.cameras.new("Cam")
    if ortho_scale:
        cam_data.type = "ORTHO"
        cam_data.ortho_scale = ortho_scale
    else:
        cam_data.lens = 70
    cam = bpy.data.objects.new("Cam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = location
    cam.rotation_euler = (Vector(target) - Vector(location)).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    return cam


def render_previews(obj, folder, name):
    """Front (what the website shows at rest) and a 3/4 angle (to check the back and sides)."""
    setup_render((768, 768))
    website_lights()
    for suffix, loc in (("front", (0, -4.2, 0)), ("angle", (2.4, -2.9, 1.7))):
        camera(loc, (0, 0, 0))
        bpy.context.scene.render.filepath = os.path.join(folder, f"{name}_{suffix}.png")
        bpy.ops.render.render(write_still=True)


def export_glb(obj, path):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        use_selection=True,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_image_format="WEBP",
        export_image_quality=88,
        export_meshopt_compression_enable=True,
        export_meshopt_extension="EXT_meshopt_compression",
        export_materials="EXPORT",
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )


# ---------- main ----------
report = []
files = sorted(f for f in os.listdir(IN_DIR) if f.lower().endswith(".glb"))
if not files:
    raise SystemExit(f"no .glb files in {IN_DIR}")

for fname in files:
    name = os.path.splitext(fname)[0]
    src = os.path.join(IN_DIR, fname)
    print(f"\n=== {name} ===")
    reset_scene()
    obj = import_glb(src)
    obj.name = name
    tris_in = tri_count(obj)
    clean_geometry(obj)

    high = None
    if BAKE and tris_in > TARGET_TRIS:
        high = obj.copy()
        high.data = obj.data.copy()
        high.name = name + "_high"
        bpy.context.scene.collection.objects.link(high)
    reduced = decimate(obj, TARGET_TRIS)
    if high and reduced:
        bake_normals(high, obj, TEX_SIZE)
        bpy.data.objects.remove(high, do_unlink=True)

    clay_finish(obj)
    shrink_textures(obj, TEX_SIZE)
    proportions = normalize(obj)

    out_glb = os.path.join(OUT_DIR, name + ".glb")
    export_glb(obj, out_glb)
    render_previews(obj, os.path.join(OUT_DIR, "previews"), name)

    report.append(
        {
            "name": name,
            "triangles_in": tris_in,
            "triangles_out": tri_count(obj),
            "normal_map_baked": bool(high and reduced),
            "size": proportions,
            "mb_in": round(os.path.getsize(src) / 1e6, 2),
            "mb_out": round(os.path.getsize(out_glb) / 1e6, 2),
        }
    )

# ---------- contact sheet: every object in a row, same box, same lights ----------
reset_scene()
gap = BOX * 1.35
for i, fname in enumerate(files):
    name = os.path.splitext(fname)[0]
    bpy.ops.import_scene.gltf(filepath=os.path.join(OUT_DIR, name + ".glb"))
    for o in bpy.context.selected_objects:
        if o.parent is None:
            o.location.x += i * gap
    # thin square behind each object = the shared box, so size differences are easy to see
    bpy.ops.mesh.primitive_plane_add(size=BOX, location=(i * gap, 2.5, 0), rotation=(math.radians(90), 0, 0))
    card = bpy.context.active_object
    mat = bpy.data.materials.new("Card")
    mat.diffuse_color = (0.85, 0.84, 0.82, 1)
    if principled(mat) is None:
        mat.use_nodes = True
    principled(mat).inputs["Base Color"].default_value = (0.85, 0.84, 0.82, 1)
    card.data.materials.append(mat)
n = len(files)
setup_render((max(800, 420 * n), 520))
website_lights()
mid = (n - 1) * gap / 2
camera((mid, -6, 1.2), (mid, 0, 0), ortho_scale=max(n * gap, 2.2))
bpy.context.scene.render.filepath = os.path.join(OUT_DIR, "previews", "_all_side_by_side.png")
bpy.ops.render.render(write_still=True)

with open(os.path.join(OUT_DIR, "report.json"), "w") as f:
    json.dump(report, f, indent=2)
print("\nREPORT", json.dumps(report, indent=2))
