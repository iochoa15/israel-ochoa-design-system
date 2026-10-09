"""07_tripo_clean: Israel's Tripo models, kept as they are (shape + painted texture), only cleaned up for hand editing.

For every Tripo .glb:
  1. import; keep its parts (Lego bricks, bottle cap, skull pieces...)
  2. stitch the paint seams shut (Tripo splits the skin wherever the texture is cut) -> no cracks when sculpting
  3. close the small holes left over; new faces take their paint from the edge around them
  4. drop dust (tiny loose pieces) and stray needle triangles, fix inside-out faces, smooth shading
  5. turn it like the still (work/alignment.json) and scale to a 1 x 1 box; no width changes, no recolor
  6. one shared clay finish: Tripo's painted color kept untouched, normal map softened, no metal, matte
     (the unused Tripo maps stay in the .blend, so they can be plugged back in)
  7. save <name>.blend for hand editing (with the still as a see-through reference in front view) + export <name>.glb

Blender --background --factory-startup --python clean_tripo.py -- <in_dir> <out_dir> <alignment.json> <stills_dir> [name-filter]
"""
import bpy, bmesh, os, sys, json, math
from mathutils import Matrix, Vector
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import common as C

argv = sys.argv[sys.argv.index("--") + 1:]
IN, OUT, ALIGN, STILLS = argv[:4]
FILTER = argv[4] if len(argv) > 4 else ""
WELD = 1e-4            # stitch distance (object is ~1 unit)
HOLE_SIDES = 64        # close holes up to this many edges ...
HOLE_PERIMETER = 0.06  # ... and this long around (object ~1 unit); bigger openings are left for a human to judge
DUST = 0.0005          # loose pieces smaller than this share of the part's faces are removed
ROUGHNESS, NORMAL_STRENGTH = 0.7, 0.6
os.makedirs(os.path.join(OUT, "blend"), exist_ok=True)
align = json.load(open(ALIGN))
report_path = os.path.join(OUT, "report.json")
report = json.load(open(report_path)) if os.path.exists(report_path) else {}


def islands(bm):
    seen, out = set(), []
    for f0 in bm.faces:
        if f0 in seen:
            continue
        stack, isl = [f0], []
        seen.add(f0)
        while stack:
            f = stack.pop(); isl.append(f)
            for e in f.edges:
                for g in e.link_faces:
                    if g not in seen:
                        seen.add(g); stack.append(g)
        out.append(isl)
    return out


def boundary_loops(bm):
    left, out = {e for e in bm.edges if e.is_boundary}, []
    while left:
        e0 = left.pop(); grp, stack = [e0], [e0]
        while stack:
            e = stack.pop()
            for v in e.verts:
                for x in v.link_edges:
                    if x in left:
                        left.discard(x); grp.append(x); stack.append(x)
        out.append(grp)
    return out


def keep_tripo_shading(o, ref):
    """Copy Tripo's smooth-shading directions back onto the stitched skin (they hide the joints between pieces)."""
    if not ref.data.has_custom_normals:
        return
    m = o.modifiers.new("Tripo shading", "DATA_TRANSFER"); m.object = ref
    m.use_loop_data = True; m.data_types_loops = {"CUSTOM_NORMAL"}; m.loop_mapping = "POLYINTERP_NEAREST"
    C.apply_mods(o)


def clean_mesh(o, stats):
    me = o.data
    bm = bmesh.new(); bm.from_mesh(me)
    uv = bm.loops.layers.uv.active
    b0 = sum(1 for e in bm.edges if e.is_boundary)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=WELD)
    # stray needles: very long thin triangles (export glitches)
    needles = [f for f in bm.faces if len(f.verts) == 3 and (lambda e: e > 0.05 and f.calc_area() < 0.01 * e * e)(max(x.calc_length() for x in f.edges))]
    bmesh.ops.delete(bm, geom=needles, context="FACES")
    # dust
    isl = islands(bm)
    n = len(bm.faces)
    dust = [f for i in isl if len(i) < max(4, DUST * n) for f in i] if len(isl) > 1 else []
    bmesh.ops.delete(bm, geom=dust, context="FACES")
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    bmesh.ops.dissolve_degenerate(bm, dist=WELD * 0.1, edges=bm.edges)
    b1 = sum(1 for e in bm.edges if e.is_boundary)
    # holes: only small gaps (seam leftovers) are closed; bigger openings (a nose, a pocket) are left as Tripo made them
    loops = boundary_loops(bm)
    small = [l for l in loops if sum(e.calc_length() for e in l) < HOLE_PERIMETER and len(l) <= HOLE_SIDES]
    new = []
    for l in small:
        new += bmesh.ops.holes_fill(bm, edges=l, sides=HOLE_SIDES)["faces"]
    if new:
        tri = bmesh.ops.triangulate(bm, faces=new)["faces"]
        tri_set = set(tri)
        # face the same way as the skin around it (Tripo's own facing is never changed)
        for _ in range(3):
            for f in tri:
                for l in f.loops:
                    other = [x for x in l.edge.link_loops if x.face not in tri_set]
                    if other:
                        if other[0].vert is l.vert:
                            f.normal_flip()
                        break
        if uv:
            for f in tri:
                for l in f.loops:
                    src = [x for x in l.vert.link_loops if x.face not in tri_set]
                    if src:
                        l[uv].uv = src[0][uv].uv
        for f in tri:
            nb = [g.material_index for e in f.edges for g in e.link_faces if g is not f]
            if nb:
                f.material_index = max(set(nb), key=nb.count)
    b2 = sum(1 for e in bm.edges if e.is_boundary)
    bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    for k, v in (("open_edges_before", b0), ("open_edges_after_stitch", b1), ("open_edges_left", b2),
                 ("needles_removed", len(needles)), ("dust_faces_removed", len(dust)), ("holes_filled", len(new))):
        stats[k] = stats.get(k, 0) + v


def clay_finish(mat):
    if not mat or not mat.use_nodes:
        return
    nt = mat.node_tree
    b = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if not b:
        return
    for name in ("Metallic", "Roughness"):
        for l in list(b.inputs[name].links):
            nt.links.remove(l)          # the image node stays in the material, just unplugged
    b.inputs["Metallic"].default_value = 0.0
    b.inputs["Roughness"].default_value = ROUGHNESS
    if "Specular IOR Level" in b.inputs:
        b.inputs["Specular IOR Level"].default_value = 0.35
    for l in b.inputs["Normal"].links:
        if l.from_node.type == "NORMAL_MAP":
            l.from_node.inputs["Strength"].default_value = NORMAL_STRENGTH


def reference_and_views(name, size):
    """Still as a see-through image in front of the model (front view, numpad 1), website-like lights, front camera."""
    sc = bpy.context.scene
    still = os.path.join(STILLS, name + ".png")
    if os.path.exists(still):
        img = bpy.data.images.load(os.path.abspath(still)); img.pack()
        e = bpy.data.objects.new("Still (reference)", None); sc.collection.objects.link(e)
        e.empty_display_type = "IMAGE"; e.data = img
        e.empty_display_size = 1.25
        e.empty_image_side = "FRONT"; e.use_empty_image_alpha = True; e.color[3] = 0.5
        e.empty_image_depth = "FRONT"; e.show_empty_image_perspective = False
        e.location = (0, -2, 0); e.rotation_euler = (math.radians(90), 0, 0)
        e.hide_set(True)      # turn on in the outliner (eye icon) to trace over it
    C.lights_and_render((1080, 1080))
    cd = bpy.data.cameras.new("Front"); cd.type = "ORTHO"; cd.ortho_scale = max(size["width"], size["height"]) * 1.12
    cam = bpy.data.objects.new("Front camera", cd); sc.collection.objects.link(cam)
    cam.location = (0, -5, 0); cam.rotation_euler = (math.radians(90), 0, 0)
    sc.camera = cam
    for a in getattr(bpy.context.screen, "areas", []) if bpy.context.screen else []:
        pass


for f in sorted(os.listdir(IN)):
    if not f.endswith(".glb") or FILTER not in f:
        continue
    name = f[:-4]
    print(f"\n=== {name} ===", flush=True)
    C.reset(); C._mats.clear()
    bpy.ops.import_scene.gltf(filepath=os.path.join(IN, f))
    parts = [o for o in bpy.data.objects if o.type == "MESH"]
    C.select(parts); bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    for o in list(bpy.data.objects):
        if o.type != "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    C.select(parts); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    tris_in = sum(len(p.vertices) - 2 for o in parts for p in o.data.polygons)
    lo, hi = C.bounds(parts)
    R = Matrix(align[name]["matrix"]).to_4x4() if name in align else Matrix.Identity(4)
    C.transform_all(parts, R @ Matrix.Translation(-(lo + hi) / 2))
    size = C.normalize(parts)
    stats = {}
    for i, o in enumerate(parts):
        o.name = f"{name.split(' - ')[-1]} part {i + 1}" if len(parts) > 1 else name.split(" - ")[-1]
        ref = o.copy(); ref.data = o.data.copy(); bpy.context.scene.collection.objects.link(ref)
        clean_mesh(o, stats)
        keep_tripo_shading(o, ref)
        bpy.data.objects.remove(ref, do_unlink=True)
        o.data.name = o.name
    for m in bpy.data.materials:
        clay_finish(m)
    root = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(root)
    for o in parts:
        o.parent = root
    # glb for the website / comparison (only the plugged-in maps are exported)
    out = os.path.join(OUT, name + ".glb")
    C.select(parts + [root], active=root)
    bpy.ops.export_scene.gltf(filepath=out, use_selection=True, export_format="GLB", export_yup=True, export_apply=True,
                              export_image_format="WEBP", export_image_quality=90,
                              export_meshopt_compression_enable=True, export_meshopt_extension="EXT_meshopt_compression",
                              export_materials="EXPORT", export_animations=False, export_cameras=False, export_lights=False)
    reference_and_views(name, size)
    for img in bpy.data.images:
        if not img.packed_file and img.source == "FILE":
            img.pack()
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "blend", name + ".blend"), compress=True)
    tris_out = sum(len(p.vertices) - 2 for o in parts for p in o.data.polygons)
    report[name] = {"parts": len(parts), "triangles_in": tris_in, "triangles_out": tris_out, "size": size,
                    "mb_glb": round(os.path.getsize(out) / 1e6, 2), **stats}
    json.dump(report, open(report_path, "w"), indent=1)
    print("CLEANED", name, report[name], flush=True)
