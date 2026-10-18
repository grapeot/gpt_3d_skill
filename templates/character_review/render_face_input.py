"""Flat-lit front orthographic render of the head only: the layout input for an image-model face repaint and the
frame the repaint is projected back through.

    blender -b scene.blend -P render_face_input.py -- out.png --keep head,eye_L,eye_R --cz 1.655 --size 0.32

The camera looks along +Y (the character faces -Y). Keep the same --cx/--cz/--size/--res for projection.
Lighting comes from the camera so the input carries no strong terminator for the repaint to copy.
"""
import argparse
import sys

import bpy
from mathutils import Vector

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--keep", default="head,eye_L,eye_R", help="mesh names to render (comma list)")
ap.add_argument("--cx", type=float, default=0.0)
ap.add_argument("--cz", type=float, required=True)
ap.add_argument("--size", type=float, default=0.32, help="ortho frame edge in metres")
ap.add_argument("--res", type=int, default=1024)
ap.add_argument("--camera", default="Cam")
ap.add_argument("--light", default=None, help="sun object to re-aim at the face (optional)")
a = ap.parse_args(sys.argv[sys.argv.index("--") + 1:])
keep = set(a.keep.split(","))
for ob in bpy.data.objects:
    if ob.type == "MESH":
        ob.hide_render = ob.name not in keep
sc = bpy.context.scene
for ob in bpy.data.objects:
    if ob.type == "LIGHT" and (a.light is None or ob.name == a.light):
        ob.rotation_euler = Vector((0, 1, -0.15)).to_track_quat("-Z", "Y").to_euler()
cam = bpy.data.objects.get(a.camera) or bpy.data.objects.new(a.camera, bpy.data.cameras.new(a.camera))
if cam.name not in sc.collection.all_objects:
    sc.collection.objects.link(cam)
sc.camera = cam
cam.data.type = "ORTHO"
cam.data.ortho_scale = a.size
cam.location = Vector((a.cx, -2.0, a.cz))
cam.rotation_euler = Vector((0, 1, 0)).to_track_quat("-Z", "Y").to_euler()
sc.render.resolution_x = sc.render.resolution_y = a.res
sc.render.resolution_percentage = 100
sc.render.film_transparent = False
if sc.world and sc.world.node_tree and sc.world.node_tree.nodes.get("Background"):
    bgn = sc.world.node_tree.nodes["Background"]
    bgn.inputs["Color"].default_value = (0.8, 0.8, 0.8, 1)
    bgn.inputs["Strength"].default_value = 1.0
sc.render.filepath = a.out
bpy.ops.render.render(write_still=True)
