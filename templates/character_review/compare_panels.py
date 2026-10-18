"""Pair reference crops with matched renders (reference left, model right).

    python compare_panels.py review_config.json previews/iter3

Writes <prefix>_cmp_turn.jpg (front/side/back interleaved with their reference panels) and one
<prefix>_cmp_<detail>.jpg per detail panel. Missing renders are skipped with a message.
"""
import json
import os
import sys

from PIL import Image

cfg = json.load(open(sys.argv[1]))
prefix = sys.argv[2]
BG = (230, 229, 225)


def flat(path):
    im = Image.open(path).convert("RGBA")
    bg = Image.new("RGBA", im.size, BG + (255,))
    return Image.alpha_composite(bg, im).convert("RGB")


def row(images, height, gap=8):
    ims = [im.resize((max(1, round(im.width * height / im.height)), height), Image.LANCZOS) for im in images]
    out = Image.new("RGB", (sum(i.width for i in ims) + gap * (len(ims) - 1), height), BG)
    x = 0
    for im in ims:
        out.paste(im, (x, 0))
        x += im.width + gap
    return out


t = cfg["turnaround"]
sheet = Image.open(t["sheet"]).convert("RGB")
pw, ph = t["panel_size"]
tiles = []
for p in t["panels"]:
    path = f"{prefix}_{p['name']}.png"
    if not os.path.exists(path):
        print("skip", path)
        continue
    tiles += [sheet.crop((p["crop_x"], 0, p["crop_x"] + pw, ph)), flat(path)]
if tiles:
    row(tiles, ph, gap=0).save(f"{prefix}_cmp_turn.jpg", quality=90)
for d in cfg.get("details", []):
    x, y, w, h = d["crop"]
    ref = Image.open(d["sheet"]).convert("RGB").crop((x, y, x + w, y + h))
    renders = [flat(f"{prefix}_{r['name']}.png") for r in d["renders"] if os.path.exists(f"{prefix}_{r['name']}.png")]
    if renders:
        row([ref] + renders, 600).save(f"{prefix}_cmp_{d['name']}.jpg", quality=90)
print("wrote", prefix + "_cmp_*.jpg")
