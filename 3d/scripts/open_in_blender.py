"""Open a cleaned model in the Blender window, lit like the website, ready to orbit.
   open -a Blender --args --python open_in_blender.py -- <model.glb>"""
import bpy, sys, math
from mathutils import Vector
path = sys.argv[sys.argv.index("--") + 1]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()
bpy.ops.import_scene.gltf(filepath=path)
world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
bpy.context.scene.world = world
world.color = (0.93, 0.92, 0.9)
for name, energy, color, d in (("Key", 3.2, (1, 1, 1), (2.5, 3, 4)), ("Rim", 1.4, (0.87, 0.9, 1.0), (-3, 1, -2.5))):
    light = bpy.data.lights.new(name, "SUN"); light.energy = energy; light.color = color
    o = bpy.data.objects.new(name, light); bpy.context.scene.collection.objects.link(o)
    v = Vector((d[0], -d[2], d[1])); o.rotation_euler = (-v).to_track_quat("-Z", "Y").to_euler()

def frame_view():
    for area in bpy.context.window.screen.areas:
        if area.type == "VIEW_3D":
            space = area.spaces.active
            space.shading.type = "MATERIAL"
            space.overlay.show_floor = False
            space.overlay.show_axis_x = space.overlay.show_axis_y = False
            region = next(r for r in area.regions if r.type == "WINDOW")
            with bpy.context.temp_override(area=area, region=region):
                bpy.ops.view3d.view_axis(type="FRONT")
                bpy.ops.view3d.view_all()
    return None
bpy.app.timers.register(frame_view, first_interval=0.5)
