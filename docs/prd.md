# Product Requirements Document (PRD)

## Project Overview
`gpt_3d_skill` provides a structured, agent-executable capability pack for procedural 3D modeling, cinematic architectural animation, and interactive WebGL walkthroughs. It bridges the gap between procedural 3D authoring in Blender and real-time interactive presentation in the browser.

## User Outcome

### Viewer Priorities and Non-Goals
- **P0**: Load user-supplied baked unlit GLB models, preserve sRGB appearance, and support touch/keyboard walking, basic collision, reset/overview and relative asset paths.
- **Safeguards**: Retain existing correctness and privacy tests. Tests protect the narrow product; they do not justify adding new runtime capabilities.
- **Do Not Build by Default**: Runtime demo/world generators, alternate realtime/PBR renderers, native wrappers, physics/game engines, default analytics, broad camera/quality tuning or infrastructure without an observed need.
- **Delivery First**: For small reuse or publishing requests, target an initial usable result around ten minutes. If scope grows, report completed versus pending work and confirm priorities before optional work delays delivery.
- **Knowledge Is Not a Roadmap**: General techniques may remain in focused skills; do not turn every documented option into a default template feature. Scene-specific features stay in their task workspaces.

### Skill Outcomes
A user or coding agent can:
1. Procedurally generate clean, editable, and stylistically consistent 3D architectural scenes in Blender from reference material.
2. Animate and render multi-stage architectural showcases (such as orbit sweeps, exploded views, structural assemblies, and staged prop entries) into verified high-definition video.
3. Export and deploy an interactive web-based first-person walkthrough that faithfully reproduces Blender's visual lighting, materials, and contact shadows without relying on heavy frontend frameworks.
4. Author a character rig that respects its approved motion model, export a deforming asset, and optionally drive it with local browser capture while preserving consent and verifiable acceptance boundaries.
5. Receive a self-contained, offline model-comparison HTML by default after model creation or revision, with supplied input photos, an interactive output and no recipient-side server or dependencies. User-requested alternative formats and photo exclusions take precedence. This handoff workflow is separate from the first-person walkthrough template's scope.

Ordinary visual iterations reuse existing outputs and use checks proportional to the change. A useful preview and verified current comparison artifact should reach the user before optional renders, archives or hosting; explicit production requirements retain their relevant acceptance checks.

## Core Skills

### 1. Blender Procedural Modeling (`skills/blender_modeling.md`)
- **Focus**: Procedural generation of architectural structures, terrain, and environmental props in Blender via Python scripting.
- **Capabilities**:
  - Deterministic geometry creation with editable modifiers and clean hierarchies.
  - Procedural PBR materials (wood, stone, plaster, ceramic, vegetation).
  - Multi-angle test framing and rendering (front, side, rear, isometric) to validate geometry and materials prior to animation or export.
  - Self-contained packaging of external resources into canonical `.blend` files.

### 2. Blender Cinematic Animation (`skills/blender_animation.md`)
- **Focus**: Choreographed multi-stage architectural animations and high-fidelity video production.
- **Capabilities**:
  - Staged storyboards combining camera orbit sweeps, exploded structural views, component assembly, and staged prop arrival.
  - Accurate transform mathematics preserving world-space matrices and parent hierarchies without transform doubling.
  - Resumable frame sequence rendering (PNG) to avoid lost progress.
  - Automated video encoding and stream integrity verification using FFmpeg and ffprobe.

### 3. Web Walkthrough (`skills/web_walkthrough.md`)
- **Focus**: Real-time interactive 3D architectural exploration in the browser using Three.js and Vite.
- **Capabilities**:
  - High-fidelity visual preservation of Blender's static diffuse lighting, procedural colors, and contact shadows using texture baking.
  - Clean glTF/GLB export with evaluated coordinates and pre-batch collision metadata.
  - Responsive first-person navigation supporting desktop pointer lock, click-drag fallback, and mobile touch joysticks.
  - Robust state handling for window blur, Escape pausing, and collision boundary enforcement.

### Blender Compositing Plate (`skills/blender_compositing_plate.md`)
- **Focus**: Blender layers that another renderer composites with, frame-accurately.
- **Capabilities**: One shared world coordinate system and per-frame camera file, per-frame projection assertions, lighting shared as a formula, a fixed colour/headroom contract, and deterministic analytic deformation imported by both renderers.
- **Acceptance**: Every frame decodes with the agreed format, camera error stays sub-pixel, zero-light frames are exactly black and the peak leaves headroom; test frames are opened before the full range.

### Character Rigging and Motion Capture (`skills/character_rigging_mocap.md`)
- **Focus**: Reference-faithful articulation, rest binding, skin export/reload and optional local browser retargeting.
- **Capabilities**: Explicit target motion-model selection, continuous skin where required, shared rig definitions, camera-free presets, capture cancellation/cleanup, and clean non-root static delivery.
- **Acceptance**: Actual reloaded vertex deformation and multi-view poses; local capture tested separately through mock, positive-fixture and authorized live-device evidence. A passing test does not replace user approval of the character's movement.

## Artistic Style and Task Boundaries

### Preserving Approved Visual Style
- An approved visual style—defined by material palette, procedural texturing, and lighting contrast—must be strictly maintained across all downstream stages.
- Static architectural export uses baking where needed to retain approved Blender appearance. Moving characters preserve skins and explicitly chosen runtime shading; they must not inherit pose-dependent static lightmaps as a universal fidelity rule.

### Task and Workspace Boundaries
- **Source Preservation**: Master `.blend` files remain clean, unbaked, and fully editable. Baking, joining, and decimation operations must be performed on derivative export copies or non-destructive dependency graphs.
- **Artifact Boundaries**: All generated artifacts (`.blend` files, render sequences, encoded video files, exported GLB assets, and web build distributions) must remain outside this skill repository in dedicated task workspaces.
- **Authority Boundaries**: Binding public or LAN interfaces, sending messages, publishing assets and changing remote state require explicit user authorization; read-only reference research follows workspace policy.

## Success Criteria

| Phase | Metric | Target / Acceptance Criteria |
|---|---|---|
| **Modeling** | Script Execution | Headless Blender execution succeeds with zero Python tracebacks in logs. |
| **Modeling** | Asset Packaging | Canonical `.blend` file is readable and all external assets are packed. |
| **Modeling** | Geometry & Normals | Consistent outward normals; zero Solidify modifier inversion; clean hip/eave closures. |
| **Modeling** | Visual Review | A relevant preview validates the current appearance; additional angles resolve changed or suspect geometry and requested production requirements. |
| **Model Handoff** | Offline Comparison | Single HTML embeds the current model, runtime and supplied references; standalone loading is verified when the viewer or packaging changes. |
| **Animation** | Render Completeness | Every intended index is present, valid and associated with the same scene version; intentional holds are allowed. |
| **Animation** | Stream Verification | `ffprobe` and `ffmpeg` decode video stream with zero errors, confirming exact duration, resolution, and FPS. |
| **Animation** | Transform Correctness | Smooth animation without transform doubling, foundation burial, or accidental frustum clipping. |
| **Web Walkthrough** | Visual Fidelity | Paired-camera render comparison demonstrates diffuse lighting and contact shadow parity with Blender reference. |
| **Web Walkthrough** | Navigation & Control | Desktop pointer lock with drag/WASD fallback, responsive mobile touch controls, and immediate motion halt on Escape. |
| **Web Walkthrough** | Collision Integrity | Player constrained by scene boundaries and obstacle colliders derived prior to mesh batching. |
| **Character Rigging** | Motion and Bind Integrity | Approved visible freedoms, compatible rest/inverse binds, valid weights and actual posed deformation after reload. |
| **Motion Capture** | Runtime and Evidence | Correct coordinate/mirror mapping, bounded in-flight work, cleanup on cancellation, complete clean-build assets, and separate fixture/live/user-acceptance claims. |
