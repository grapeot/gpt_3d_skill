"""Align an image-model face repaint to its layout render and project it onto the head texture.

Command line (needs numpy, opencv-python-headless):
    python face_paint.py measure input.png paint.png
    python face_paint.py prep input.png paint.png out.png [--mouth "x:dy,x:dy,..."] [--mouth-row 650]

`measure` prints pupil centroids and the darkest (smile) row per column in both images, so you can see whether the
repaint kept the layout. `prep` applies an optional smooth local vertical shift at the mouth (dy = paint row minus
layout row, measured per column), refills the silhouette rim and any background-coloured pixels next to it from
interior skin, and writes the image to project. Dense optical flow is deliberately not offered: it tears features.

In a texture baker (Blender or numpy), call `project(pos, nrm, paint, frame)` with per-texel world positions and
normals to get the repaint colour and a blend weight that fades out where the surface turns away from the camera.
"""
import argparse

import numpy as np


def background_mask(img, tol=12):
    """Pixels of the flat background, found as the colour region connected to the image border (eye whites and
    other grey details inside the head have the same colour, so a plain threshold would eat them)."""
    import cv2
    near = np.abs(img.astype(int) - img[5, 5].astype(int)).sum(2) < tol
    _, lab = cv2.connectedComponents(near.astype(np.uint8))
    border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    return np.isin(lab, list(border))


def measure(inp_path, paint_path):
    import cv2
    inp = cv2.imread(inp_path).astype(float)
    pnt = cv2.resize(cv2.imread(paint_path), inp.shape[1::-1]).astype(float)
    h, w = inp.shape[:2]
    for name, img in (("layout", inp), ("paint", pnt)):
        g = img.sum(2)
        for x0, x1 in ((int(w * 0.37), int(w * 0.49)), (int(w * 0.51), int(w * 0.63))):
            sub = g[int(h * 0.37):int(h * 0.47), x0:x1]
            yy, xx = np.unravel_index(np.argsort(sub.ravel())[:150], sub.shape)
            print(f"{name:6s} pupil  row {h * 0.37 + yy.mean():6.1f}  col {x0 + xx.mean():6.1f}")
    print("col   layout_row  paint_row  dy")
    for x in range(int(w * 0.42), int(w * 0.59), max(1, w // 68)):
        ri = int(h * 0.58) + int(np.argmin(inp[int(h * 0.58):int(h * 0.69), x].sum(1)))
        rp = int(h * 0.58) + int(np.argmin(pnt[int(h * 0.58):int(h * 0.69), x].sum(1)))
        print(f"{x:4d}   {ri:5d}     {rp:5d}   {rp - ri:+d}")


def prep(inp_path, paint_path, out_path, mouth=None, mouth_row=None, rim=14):
    import cv2
    inp = cv2.imread(inp_path)
    h, w = inp.shape[:2]
    pnt = cv2.resize(cv2.imread(paint_path), (w, h), interpolation=cv2.INTER_AREA)
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    if mouth:
        xs = np.array([m[0] for m in mouth], np.float32)
        ds = np.array([m[1] for m in mouth], np.float32)
        d = cv2.GaussianBlur(np.interp(gx[0], xs, ds).astype(np.float32)[None, :], (0, 0), 6)[0]
        wy = np.exp(-((gy - (mouth_row or h * 0.635)) / (h * 0.0215)) ** 2).astype(np.float32)
        pnt = cv2.remap(pnt, gx, gy + d[None, :] * wy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    head = (~background_mask(inp)).astype(np.uint8)
    k = 2 * rim + 1
    inner = cv2.erode(head, np.ones((k, k), np.uint8))
    band = cv2.erode(head, np.ones((6 * rim + 1, 6 * rim + 1), np.uint8)) == 0
    bgp = np.abs(pnt.astype(int) - pnt[5, 5].astype(int)).sum(2) < 18
    hole = ((head > 0) & ((inner == 0) | (bgp & band))).astype(np.uint8) * 255
    out = cv2.inpaint(pnt, hole, 15, cv2.INPAINT_TELEA)
    cv2.imwrite(out_path, out)
    cv2.imwrite(out_path.rsplit(".", 1)[0] + "_overlay.png", cv2.addWeighted(out, 0.5, inp, 0.5, 0))


def project(pos, nrm, paint, frame, fade=(-0.25, -0.60)):
    """pos, nrm: (..., 3) world position / normal per texel. paint: (H, W, 3) floats, row 0 = TOP of the image.
    frame: dict(cx, cz, size) of the orthographic front camera (looking +Y). Returns (rgb, weight)."""
    ph, pw = paint.shape[:2]
    cx = (pos[..., 0] - frame["cx"]) / frame["size"] * pw + pw / 2 - 0.5
    cy = (frame["cz"] - pos[..., 2]) / frame["size"] * ph + ph / 2 - 0.5
    inside = (cx > 1) & (cx < pw - 2) & (cy > 1) & (cy < ph - 2)
    x0 = np.clip(np.floor(cx).astype(int), 0, pw - 2)
    y0 = np.clip(np.floor(cy).astype(int), 0, ph - 2)
    fx = np.clip(cx - x0, 0, 1)[..., None]
    fy = np.clip(cy - y0, 0, 1)[..., None]
    rgb = (paint[y0, x0] * (1 - fx) * (1 - fy) + paint[y0, x0 + 1] * fx * (1 - fy) +
           paint[y0 + 1, x0] * (1 - fx) * fy + paint[y0 + 1, x0 + 1] * fx * fy)
    t = np.clip((nrm[..., 1] - fade[0]) / (fade[1] - fade[0]), 0, 1)  # 1 where the surface faces the camera (-Y)
    weight = t * t * (3 - 2 * t) * inside
    return rgb, weight


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["measure", "prep"])
    ap.add_argument("layout")
    ap.add_argument("paint")
    ap.add_argument("out", nargs="?")
    ap.add_argument("--mouth", default="", help='per-column dy, e.g. "475:-5,490:-10,520:-11,550:-5"')
    ap.add_argument("--mouth-row", type=float, default=None)
    a = ap.parse_args()
    if a.cmd == "measure":
        measure(a.layout, a.paint)
    else:
        m = [tuple(float(v) for v in s.split(":")) for s in a.mouth.split(",") if s] or None
        prep(a.layout, a.paint, a.out, mouth=m, mouth_row=a.mouth_row)
