"""Render a character at views matched to its reference sheets.

    blender -b scene.blend -P matched_views.py -- review_config.json previews/iter3 [view,view,...]

Turnaround panels use an orthographic camera at the sheet's own scale (px_per_m) with the ground on the sheet's
ground line, so a render and a reference crop of the same panel size overlay pixel for pixel. Detail panels use the
camera listed in the config. A view's optional "solo" list keeps only meshes whose names start with those prefixes.
"""
import json
import math
import sys

import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
cfg = json.load(open(args[0]))
prefix = args[1]
only = set(args[2].split(",")) if len(args) > 2 else None
sc = bpy.context.scene
cam_name = cfg.get("camera", {}).get("name", "Cam")
cam = bpy.data.objects.get(cam_name)
if cam is None:
    cam = bpy.data.objects.new(cam_name, bpy.data.cameras.new(cam_name))
    sc.collection.objects.link(cam)
sc.camera = cam


def direction(az, el=0.0):
    """az from the front (-Y) toward +X (the character's left), degrees."""
    a, e = math.radians(az), math.radians(el)
    return Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))


def shoot(name, target, az, el, dist, res, ortho=None, lens=70, solo=None):
    if only and name not in only:
        return
    for ob in bpy.data.objects:
        if ob.type == "MESH":
            ob.hide_render = bool(solo) and not any(ob.name.startswith(s) for s in solo)
    cam.data.type = "ORTHO" if ortho else "PERSP"
    if ortho:
        cam.data.ortho_scale = ortho
    else:
        cam.data.lens = lens
    tgt = Vector(target)
    cam.location = tgt + direction(az, el) * dist
    cam.rotation_euler = (tgt - cam.location).to_track_quat("-Z", "Y").to_euler()
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.filepath = f"{prefix}_{name}.png"
    bpy.ops.render.render(write_still=True)


t = cfg["turnaround"]
pw, ph = t["panel_size"]
span = max(pw, ph) / t["px_per_m"]
z_top = t["ground_y"] / t["px_per_m"]
centre = Vector((0.0, 0.0, z_top - (ph / t["px_per_m"]) / 2))
for p in t["panels"]:
    shoot(p["name"], centre, p["az"], 0.0, 8.0, (pw, ph), ortho=span, solo=p.get("solo"))
for d in cfg.get("details", []):
    for r in d["renders"]:
        shoot(r["name"], r["target"], r["az"], r.get("el", 0.0), r["dist"], tuple(r["res"]),
              ortho=r.get("ortho"), lens=r.get("lens", 70), solo=r.get("solo"))
