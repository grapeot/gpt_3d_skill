"""Measure the model's turnaround silhouette against the reference sheet.

    python silhouette.py review_config.json previews/iter3 [--step 40] [--runs t_front]

Prints, per panel and per image row, the reference and model extents in pixels and the width difference, and writes
<prefix>_sil.jpg (model filled grey, reference outline red). With --runs PANEL it instead lists every separate
horizontal run (torso, arms, legs) per row in metres from the panel centre: centre and width for reference and
model, which is how limb angles, stance width and crotch height are fitted numerically.
The reference mask is "differs from the sampled background"; keep the background sample on plain paper and list
titles, labels or watermarks in turnaround.mask_out (sheet pixel boxes) so they do not count as body.
"""
import argparse
import json

import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("config")
ap.add_argument("prefix")
ap.add_argument("--step", type=int, default=40)
ap.add_argument("--runs", default=None)
a = ap.parse_args()
cfg = json.load(open(a.config))
t = cfg["turnaround"]
pw, ph = t["panel_size"]
px = t["px_per_m"]
sheet = np.asarray(Image.open(t["sheet"]).convert("RGB")).astype(float)
bx, by, bw, bh = cfg["background"]["sample"]
bg = np.median(sheet[by:by + bh, bx:bx + bw].reshape(-1, 3), axis=0)
thr = cfg["background"].get("threshold", 55)
sheet_mask = np.abs(sheet - bg).sum(2) > thr
for x, y, w, h in t.get("mask_out", []):
    sheet_mask[y:y + h, x:x + w] = False
sheet_mask[min(t["ground_y"] + 22, sheet_mask.shape[0]):] = False  # drop labels / cast shadow below the ground line


def masks(p):
    rm = sheet_mask[:ph, p["crop_x"]:p["crop_x"] + pw].copy()
    mm = np.asarray(Image.open(f"{a.prefix}_{p['name']}.png").convert("RGBA"))[..., 3] > 128
    return rm, mm


def runs(row):
    xs = np.where(row)[0]
    if not len(xs):
        return []
    br = np.where(np.diff(xs) > 2)[0]
    st, en = np.r_[xs[0], xs[br + 1]], np.r_[xs[br], xs[-1]]
    return [(s, e) for s, e in zip(st, en) if e - s > 3]


if a.runs:
    p = next(p for p in t["panels"] if p["name"] == a.runs)
    rm, mm = masks(p)
    fmt = lambda rr: " ".join(f"({((s + e) / 2 - pw / 2) / px:+.3f},{(e - s) / px:.3f})" for s, e in rr)
    print("  y      z  | reference runs (centre_m, width_m)            | model runs")
    for y in range(0, t["ground_y"], a.step // 2 or 1):
        print(f"{y:4d} {(t['ground_y'] - y) / px:5.2f} | {fmt(runs(rm[y])):46s} | {fmt(runs(mm[y]))}")
else:
    tiles = []
    print("panel      y   ref[l r w]        model[l r w]     dW(px)")
    for p in t["panels"]:
        rm, mm = masks(p)
        out = np.full((ph, pw, 3), 235, np.uint8)
        out[mm] = (150, 150, 155)
        edge = (rm ^ np.roll(rm, 1, 0)) | (rm ^ np.roll(rm, 1, 1))
        out[edge] = (220, 30, 30)
        tiles.append(out)
        for y in range(a.step, t["ground_y"] + 1, a.step):
            ext = lambda row: (row.min(), row.max(), row.max() - row.min()) if len(row) else (0, 0, 0)
            r, m = ext(np.where(rm[y])[0]), ext(np.where(mm[y])[0])
            print(f"{p['name']:9s}{y:5d}  {r[0]:4d} {r[1]:4d} {r[2]:4d}    {m[0]:4d} {m[1]:4d} {m[2]:4d}   {m[2] - r[2]:+4d}")
    Image.fromarray(np.concatenate(tiles, 1)).save(f"{a.prefix}_sil.jpg", quality=88)
