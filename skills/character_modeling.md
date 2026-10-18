# Character Modeling from Reference Sheets (`character_modeling`)

Type: Workflow. Updated: 2026-10-17. Observed runtime: Blender 5.1.2 EEVEE, one stylised adult character built from a turnaround sheet and a detail sheet; other styles and body types are untested.

## Goal

Turn character design sheets (a front/side/back turnaround, optionally a detail sheet of face, hands, garments and props) into a static, toon-shaded 3D character that reads like the sheets at matched views. Deliver an editable generator, a GLB, and the offline comparison HTML.

The quality bar is the side-by-side comparison, not the model in isolation. A character that looks plausible on its own can still read as wrong next to its sheet. Measure the gap, close the largest one, and repeat.

## Boundaries

- **Task Workspace Isolation**: Sheets, generators, base meshes, repaints, renders and exports live in the task workspace, never in this repository. The [review template](../templates/character_review/README.md) is copied out and configured there.
- **Static Pose Scope**: This workflow ends at a posed, unrigged character. Skinning, articulation and live capture belong to [`character_rigging_mocap.md`](character_rigging_mocap.md). Reuse its motion-model guidance if a rig is requested later.
- **Reference Authority and Rights**: The supplied sheets are the only source of truth for identity, proportions, colours and garment structure. Things the sheets do not show (soles, palms, the back of a cap, hidden pockets) are inferences. Record them as inferences in the source manifest. Third-party base meshes need a licence that permits the use (Blender Studio's Human Base Meshes are CC0). Record the licence and the source URL.
- **Generated Imagery Is Texture, Not Geometry**: An image model may repaint a texture from a render of the model, with the sheet as its identity and style reference. It must not invent a different identity, and its output is projected onto existing geometry rather than used to reshape it. Keep the prompt, the inputs, the chosen variant and the rejected variants as provenance.
- **Faces Are Not Primitives**: Do not build a believable face from a deformed sphere with features painted on a planar projection. In the one exercised run the user called that result comical. Start from a licensed base head and reshape it.
- **Disjoint Parallel Ownership**: When parts are delegated to parallel agents, each agent owns one generator file and its own output prefixes, material names and texture names. Cross-part contracts (neck radius inside the collar, shoulder root, hem heights) are negotiated through the integrator. Agents never edit each other's files.

## Acceptance Criteria

Scope checks to the changed part, following the router's [iteration and handoff policy](skill_gpt_3d.md#iteration-and-model-handoff). For each requested delivery:

1. **Matched Views Exist**: Every turnaround panel and every detail panel has a render at the sheet's own scale and framing, paired with its reference crop.
2. **Measured Silhouette**: Width per image row is compared with the reference for front, side and back. Limb centre lines, stance width and crotch height are fitted numerically. The remaining differences are listed by height and explained (for example, ground shadow in the sheet), not just eyeballed.
3. **Multi-Angle Head Review**: The face, hair and headwear are checked close up from the front, the sheet's 3/4, a full side, from below and from behind, after every head change. Attached parts are aligned by their visible front surface.
4. **Clean Toon Read**: There are no cast-shadow smears from collars or brims, no outline rings where an inner surface pokes past a neck or cuff, no hard terminator cutting across a painted face, and no stray vertices. Check per-object evaluated bounds.
5. **Export Integrity**: The GLB has no external buffers or images. All colour comes from the base colour or base texture that survives export. Size fits the sharing budget. The offline HTML passes a `file://` smoke test, and the web viewer's shading matches the renders: no tinted shadows, and a soft ramp on painted faces.
6. **Provenance**: The manifest lists the sheets, base meshes with their licences, generated textures with prompt, inputs and model, and the visible-versus-inferred features.

## Resources

- **Authoring**: Blender Python, structured as a shared core (mesh helpers, toon materials, palette) plus one module per part (head, upper body, arms and hands, lower body) and an assembler. Use [`blender_modeling.md`](blender_modeling.md) for general generator practice.
- **Review tooling**: [`templates/character_review/`](../templates/character_review/README.md). It contains a config-driven matched-view renderer, a reference/render pairing script, a silhouette and limb-run measurer, a flat front head render for repainting, and face-repaint alignment and projection helpers.
- **Base meshes**: Blender Studio Human Base Meshes (CC0), https://www.blender.org/download/demo-files/ (asset bundles). The realistic animation head (with eyeballs and ears) and the realistic hand were exercised.
- **Image model**: Any image-editing model that accepts a layout image plus a reference image. GPT Image 2.5 kept the layout well enough for projection; one Gemini variant kept an outline around the face and was rejected.
- **Handoff**: [Shareable HTML delivery](references/shareable-html.md) for the offline comparison file; [`web_walkthrough.md`](web_walkthrough.md) only if the character is placed in a walkable scene.

## Output Specification

Preserve the task's layout; these are roles, not mandatory names:

- `core` plus part generator modules and an assembler with a `--parts` switch; a master `.blend` regenerated from them.
- A review config (sheet scale, ground line, panel crops, detail cameras) and per-iteration comparison images and silhouette tables.
- Face repaint inputs, the chosen repaint, the aligned projection source, and the measured alignment offsets.
- A GLB exported from a copy within the web budget, the offline comparison HTML, and a source manifest with licences and inferences.
- A short review note: closed gaps, rejected approaches and remaining differences.

## High-Value Guidance

### 1. Measure the Sheets First, Then Fix the Skeleton

Find the sheet's scale from two landmarks: the top of the head or headwear, and the ground line. A naive bounding-box scan picks up titles and labels; mask them out. Render orthographic panels at that scale so a render and its crop overlay pixel for pixel. Then measure width per row and list the separate horizontal runs (torso, arms, legs) per row. Fit arm abduction, forearm angle, wrist position, stance width, crotch height, torso depth and head height numerically before any detail work. In the exercised run this replaced guesses with concrete corrections: arms 25°/31° became 19°/24°, the ankles moved from ±0.17 m to ±0.23 m, the crotch went from 0.80 m to 0.85 m, and the chest became 6 cm deeper in side view.

### 2. Split by Part and Delegate Against the Same Yardstick

Refactor the generator into part modules first. Prove the refactor is a no-op with a pixel-diff of the same renders. Then give each part owner the same brief: the sheets, the review tooling, the house style, unique name prefixes, a minimum iteration count, and multi-angle checks every iteration. Each owner reports cross-part requests instead of acting on them. The integrator relays contracts (for example, "the neck must stay inside radius 0.05 m through the collar") and fixes interface seams that fall between owners, such as a torso top ring that is wider than the neck.

### 3. Faces: Base Mesh, Then a Projected Repaint

Reshape a licensed base head deterministically:

- remap feature heights (eyes, nose base, lip seam, chin) to the sheet;
- scale the eye region for the style;
- widen or square the jaw to match the sheet;
- replace the face normals with those of a heavily smoothed copy, so the two-tone shading forms clean large shapes instead of sculpt wrinkles;
- thin the inner-face outlines with a vertex-weight group.

Procedurally painted features can be good enough for eyes and brows. Skin, stubble, nose and mouth texture read better from a repaint:

1. Render the head alone, flat-lit from the camera, through an orthographic front frame.
2. Ask the image model to repaint that render as the sheet's character in the sheet's style. Require identical framing and feature positions, no outline, no headwear, and even frontal light. Generate several variants in parallel.
3. Overlay each variant on the input. Measure pupil centroids and the smile row per column. In the exercised run the pupils agreed within about 1.5 mm and the smile sat about 3 mm high at its centre.
4. Correct only with a small, smooth local warp (here, a vertical shift at the mouth). Refill the silhouette rim from interior skin.
5. Project through the same frame into the face texture. Blend by surface orientation, so sides, ears and the scalp keep their procedural painting.
6. Lower the toon contrast and widen the terminator on the face material. The painting already carries soft shading, and the viewer needs a softer ramp for the face too.

### 4. Hands, Garments and Toon Rendering

- **Hands**: Pose a base-mesh hand with procedural joint rotations, then build gloves as offset shells with real thickness.
- **Garments**: Model pockets, flaps, bindings, buckles, collars and cuffs as geometry wherever they change the silhouette or deserve an outline. Paint stitching, mesh weave, fold lines and fine lugs in textures.
- **Lighting**: Turn off cast shadows for the toon look. The terminator alone gives the two tones and avoids false shadows from collars and brims. It also matches a web viewer that renders without shadows.
- **Web viewer**: Use a warm neutral ambient. A purple ambient tints shaded skin pink.

### 5. Export Within a Web Budget

Export from a copy. Lower subdivision on meshes above a face budget and write textures as JPEG; keep the master untouched. In the exercised run this took the GLB from 40 MB and 1.1 M triangles to 16 MB and 0.7 M triangles with no visible loss at viewer distance.

## Observed Pitfalls

These come from one external production; each was observed, not hypothesised.

- **Comical procedural face**: A sphere head with planar-painted features was rejected outright by the user. A base mesh plus repaint fixed it.
- **Wrong sheet scale from a bounding box**: The title text inflated the measured head top, and every later comparison was mis-scaled. Mask labels out and confirm the landmarks visually.
- **Hair that reads wrong**: Side tufts that flare horizontally read as wings. Many thin strands read as dreadlocks in side view. Short tufts tucked flat under a cap read as a bowl. Check the hair silhouette in the front view and the strand grouping in the side view.
- **Square brim invisible from the front**: A flat brim seen at eye level vanishes. It needs downward curvature across its width to read as an arch.
- **Collar shadow and neck ring**: The EEVEE shadow from a collar smeared across the jaw. Separately, a torso top ring wider than the neck drew an outline ring at the collar. Disable cast shadows, and tuck torso tops inside the neck.
- **Grey eye whites treated as background**: Masks built by colour threshold ate the eyes. Use the background region connected to the image border.
- **Dense optical flow tears features**: Flow registration between a render and its repaint dragged the nose and mouth into each other's lines. Use measured offsets and small local warps.
- **Stray vertex from a boolean or path**: One intermediate vest build had a vertex 12 m away, which showed as a bar across the turnaround. Print the evaluated bounds of every object.
- **Pink shadows in the web viewer**: The viewer's purple ambient tinted shaded skin, so it no longer matched the Blender renders.
- **Heavy export**: Base meshes, booleans and subdivision pushed the GLB to 40 MB before the export budget was applied.
