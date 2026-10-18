# Character Review Template

Tools for the [character modeling workflow](../../skills/character_modeling.md). They compare a generated character against its design sheets at matched views, measure the silhouette, and prepare an image-model face repaint for projection. Copy this folder into the task workspace; nothing here contains a model or reference sheet.

| File | Runs in | Purpose |
|---|---|---|
| `review_config.example.json` | — | Sheet scale, ground line, panel crops, detail-panel cameras |
| `matched_views.py` | Blender | Renders turnaround panels orthographically at the sheet's scale, plus detail cameras |
| `compare_panels.py` | Python + Pillow | Pairs each reference crop with its render (reference left) |
| `silhouette.py` | Python + NumPy + Pillow | Width per row vs the reference, overlay image, or per-row runs in metres (`--runs`) |
| `render_face_input.py` | Blender | Flat-lit orthographic front render of the head only, the layout input for a repaint |
| `face_paint.py` | Python + NumPy + OpenCV | `measure` alignment, `prep` (local mouth shift, rim refill), and `project()` for a texture baker |

## Configure Once Per Sheet

1. Open the turnaround and note two rows: the top of the head (or headwear) and the ground line under the soles. Divide their pixel distance by the character's intended height in metres to get `px_per_m`. Set `ground_y` to the ground row.
2. Choose a `panel_size` that holds one view, and the `crop_x` of each panel so that the figure sits in the centre of its crop. A render of that size and the crop then overlay pixel for pixel.
3. Put a `background.sample` box on plain paper. Add every title, label or watermark that overlaps the figures to `mask_out`.
4. For each detail panel (face, hands, garment, footwear), give the sheet crop and one or more cameras: target, azimuth from the front (positive toward the character's left), elevation, distance, and either `lens` or `ortho`. Use `solo` name prefixes to isolate a part, for example a glove seen from the palm side.

The coordinate convention is metres, +Z up, with the character facing −Y. Adjust targets if your generator differs.

## Iterate

```bash
blender -b out/iter3.blend -P matched_views.py -- review_config.json previews/iter3
python compare_panels.py review_config.json previews/iter3
python silhouette.py review_config.json previews/iter3            # width table + previews/iter3_sil.jpg
python silhouette.py review_config.json previews/iter3 --runs t_front --step 60   # limbs, stance, crotch
```

Add your own close-up cameras for parts the sheets show at an angle: the head from the side and below, cuffs, pockets at 45°, footwear from below.

## Face Repaint and Projection

```bash
blender -b out/iter3.blend -P render_face_input.py -- facepaint/input.png --keep head,eye_L,eye_R --cz 1.655 --size 0.32
# repaint facepaint/input.png with an image model, using the sheet's face crop as the identity/style reference
python face_paint.py measure facepaint/input.png facepaint/paint.png
python face_paint.py prep facepaint/input.png facepaint/paint.png facepaint/face_paint.png --mouth "475:-5,505:-10,535:-10,550:-5"
```

In the texture baker, sample the prepared image with `face_paint.project(pos, nrm, paint, dict(cx=0.0, cz=1.655, size=0.32))`. Use the same frame as the input render, then blend the returned colour by the returned weight. Keep procedural painting where the weight is low (sides, ears, scalp). Lower the toon contrast on the face material afterwards, because the repaint already carries soft shading.
