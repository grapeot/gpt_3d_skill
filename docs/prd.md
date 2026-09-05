# Product Requirements Document (PRD)

## Project Overview
`gpt_3d_skill` provides a structured, agent-executable capability pack for procedural 3D modeling, cinematic architectural animation, and interactive WebGL walkthroughs. It bridges the gap between procedural 3D authoring in Blender and real-time interactive presentation in the browser.

## User Outcome
A user or coding agent can:
1. Procedurally generate clean, editable, and stylistically consistent 3D architectural scenes in Blender from reference material.
2. Animate and render multi-stage architectural showcases (such as orbit sweeps, exploded views, structural assemblies, and staged prop entries) into verified high-definition video.
3. Export and deploy an interactive web-based first-person walkthrough that faithfully reproduces Blender's visual lighting, materials, and contact shadows without relying on heavy frontend frameworks.

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

## Artistic Style and Task Boundaries

### Preserving Approved Visual Style
- An approved visual style—defined by material palette, procedural texturing, and lighting contrast—must be strictly maintained across all downstream stages.
- Web export must not compromise visual fidelity by falling back to flat vertex colors or rudimentary dynamic lighting; baking is utilized specifically to retain Blender's visual nuance.

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
| **Modeling** | Visual Review | Multi-angle renders validate front, side, and rear elevations against references. |
| **Animation** | Render Completeness | Every intended index is present, valid and associated with the same scene version; intentional holds are allowed. |
| **Animation** | Stream Verification | `ffprobe` and `ffmpeg` decode video stream with zero errors, confirming exact duration, resolution, and FPS. |
| **Animation** | Transform Correctness | Smooth animation without transform doubling, foundation burial, or accidental frustum clipping. |
| **Web Walkthrough** | Visual Fidelity | Paired-camera render comparison demonstrates diffuse lighting and contact shadow parity with Blender reference. |
| **Web Walkthrough** | Navigation & Control | Desktop pointer lock with drag/WASD fallback, responsive mobile touch controls, and immediate motion halt on Escape. |
| **Web Walkthrough** | Collision Integrity | Player constrained by scene boundaries and obstacle colliders derived prior to mesh batching. |
