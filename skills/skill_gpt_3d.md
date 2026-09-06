# 3D Pipeline Root Router (`skill_gpt_3d`)

## Goal
Serve as the sole entry point and router for the `gpt_3d_skill` collection. Evaluate procedural modeling, cinematic animation, real-time walkthroughs, and character rigging/motion-capture objectives, then route to the appropriate specialized capability while enforcing shared contracts.

## Shared Workspace and Authorization Contract

### 1. Artifact Boundaries
- All runtime task deliverables—including generator scripts, master `.blend` files, render frame sequences, encoded video files, exported GLB models, and web application builds—must be stored in external task workspaces.
- No task output files belong inside this skill repository.

### 2. Source Model Preservation
- The master `.blend` scene or procedural generator-plus-rig configuration represents the authoritative, editable source of truth.
- Geometry merging, UV unwrapping for atlases, texture baking, and polygon decimation must be executed on temporary export copies or non-destructive evaluation graphs.

### 3. User Authorization
- Binding servers to LAN/public interfaces, sending messages, publishing assets and changing remote state require explicit authorization. Read-only reference research follows the host workspace's tool policy.
- Default to local-only interfaces and static asset serving unless authorized.

### 4. Tooling and Environment
- Python tasks utilize a root `uv`-managed virtual environment (`.venv`).
- Activate the virtual environment prior to execution; install packages using `uv pip install`.

## Task Routing Matrix

Evaluate incoming user tasks and route to the appropriate focused domain skill:

| User Objective | Target Skill | Primary Deliverables |
|---|---|---|
| Procedural geometry creation, architectural modeling, materials, scene hierarchy, geometry and normal checks. | [`blender_modeling.md`](blender_modeling.md) | Canonical `.blend` scene, generator script, multi-angle render previews. |
| Camera choreography, orbit sweeps, exploded views, component assembly, staged prop entry, frame sequence rendering, video encoding. | [`blender_animation.md`](blender_animation.md) | Rendered PNG frame sequence, verified MP4 video file, decode validation log. |
| Blender starting frames, AI-generated character acting, editorial mix and QA; keep exact mechanical trajectories in `blender_animation.md`. | [`hybrid_ai_video.md`](hybrid_ai_video.md) | Edited film, source references, shot prompts and trims, audio stems, timeline, attempt ledger, and QA manifest. |
| WebGL presentation, glTF/GLB export, static texture baking, Three.js first-person navigation, pre-batch collision. | [`web_walkthrough.md`](web_walkthrough.md) | Baked GLB asset, `colliders.json`, static Vite/Three.js walkthrough app. |
| Character articulation, skinning, pose retargeting, local webcam motion capture and deforming browser avatars. | [`character_rigging_mocap.md`](character_rigging_mocap.md) | Editable rig source, rigged asset, optional local-capture app, pose/reference and lifecycle evidence. |

### Dynamic Character Branch
For a deforming character asset or live browser avatar, establish the target motion model and execute [`character_rigging_mocap.md`](character_rigging_mocap.md). Do not assume that measured human joints must become visible character joints. Preserve skins and editable rig sources; do not blindly apply the static merge/bake path below to the character. Surface-color bakes can remain useful, but pose-dependent self-shadow bakes are not valid under arbitrary deformation. Static surroundings may use [`web_walkthrough.md`](web_walkthrough.md), and requested cinematic/video delivery may use [`blender_animation.md`](blender_animation.md). Generated image-to-video acting without an editable rig belongs in [`hybrid_ai_video.md`](hybrid_ai_video.md).

### End-to-End Pipeline Execution
When a user requests a complete static architectural pipeline (from concept to interactive web viewer):
1. **Model First**: Execute [`blender_modeling.md`](blender_modeling.md) to generate the scene and validate visual materials.
2. **Animate (If Requested)**: Execute [`blender_animation.md`](blender_animation.md) to render cinematic video showcases.
3. **Export and Bake**: Execute [`web_walkthrough.md`](web_walkthrough.md) to bake static lighting/materials into GLB, extract colliders, and configure the interactive web viewer.

## Resources
- **Mobile Viewer Template**: [`templates/mobile_walkthrough`](../templates/mobile_walkthrough/README.md). Copy its tested application shell into a task workspace; keep scene-specific assets outside this repository.
- **Blender CLI / Python**: Headless automation and RNA/operator introspection.
- **FFmpeg & ffprobe**: Video stream encoding and container decode validation.
- **Node.js, Vite & Three.js**: Minimal static web walkthrough runtime.
- **Playwright / Browser Automation**: Headless validation of web canvas and controls.
- **Primary References**:
  - Cycles Baking: `https://docs.blender.org/manual/en/latest/render/cycles/baking.html`
  - glTF 2.0 Export: `https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html`
  - Three.js Color Management: `https://threejs.org/manual/en/color-management.html`
