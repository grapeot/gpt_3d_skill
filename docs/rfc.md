# RFC: Architecture and Design of gpt_3d_skill

## Context and Goals
3D content authoring with AI coding agents often suffers from fragmented toolchains, broken transform hierarchies, loss of procedural material fidelity upon web export, and unmanaged artifact clutter. `gpt_3d_skill` establishes a standardized, vendor-agnostic architecture for authoring, animating, and presenting 3D architectural scenes.

## Architectural Design

### 1. Loose Markdown Skill Pack
- **Rationale**: Rather than distributing a heavy runtime framework or rigid Python library, capabilities are authored as loose, modular Markdown instructions.
- **Agent Integration**: Coding agents (such as Codex, Claude Code, Cursor, OpenCode) can parse Markdown instructions dynamically, adapting procedural scripts to the host environment without requiring custom binary extensions or heavy dependency installations.
- **Modularity**: Individual skills can be updated, extended, or referenced independently while sharing core conventions.

### 2. Root Router Architecture
- **Global Exposure**: Exactly one skill is exposed globally at the root: [`skills/skill_gpt_3d.md`](../skills/skill_gpt_3d.md).
- **Context Efficiency**: Agent orchestrators register the root router in their workspace index (`AGENTS.md`, `CLAUDE.md`, or routing files). The router evaluates the user's objective and delegates execution to focused domain skills:
  - Modeling queries -> [`skills/blender_modeling.md`](../skills/blender_modeling.md)
  - Animation/video queries -> [`skills/blender_animation.md`](../skills/blender_animation.md)
  - Real-time web viewer queries -> [`skills/web_walkthrough.md`](../skills/web_walkthrough.md)
  - Character rigging and local capture queries -> [`skills/character_rigging_mocap.md`](../skills/character_rigging_mocap.md)
- **Domain Skills Stay Local**: Specialized skills remain local to this repository and are invoked selectively, preventing context window saturation.

### 3. Artifact Boundary and Workspace Isolation
To maintain repository hygiene and prevent unintentional bloat:
- **Skill Repository**: Documentation, focused skills, reusable template source and tests. No user assets or private deployment settings are included.
- **Task Workspaces**: External directories where all task-specific assets reside:
  - Generator scripts and source `.blend` files.
  - Multi-angle render frames, rendered PNG sequences, and encoded MP4 videos.
  - Exported GLB models, baked texture atlases, and collider JSON files.
  - Vite / Three.js web application files and build artifacts.
- **Source Immutability**: Preserve the master `.blend` scene or generator-plus-rig definition as the editable source. Export preparation (mesh joining, UV generation, baking, decimation) uses non-destructive evaluation graphs or temporary export copies.

### 4. Geometry and Collision Pipeline: Pre-Batch Collider Separation
- **The Problem**: Real-time rendering efficiency in Three.js requires batching meshes sharing identical materials into unified geometries to reduce draw calls. However, batching combines disparate objects into a single mesh, destroying individual bounding boxes required for spatial collision detection.
- **The Design**:
  1. Geometry is evaluated in Blender prior to batching.
  2. Simplified collision hulls and bounding primitives are extracted from structural elements (walls, barriers, boundaries).
  3. Collision metadata is serialized to a separate lightweight JSON manifest (`colliders.json`).
  4. Visual geometry is batched by material and exported to GLB.
  5. The Three.js runtime loads the visual GLB for rendering and uses the pre-batch JSON colliders for player collision resolution.

### 5. Visual Fidelity and the Static Baking Decision
- **Explicit Fidelity Decision**: Standard glTF/GLB export cannot translate Blender Cycles procedural node networks (e.g., procedural wood grain, stone noise, ambient occlusion shading). Exporting raw materials results in flat, desaturated approximations with primitive dynamic lighting.
- **Baking Approach**:
  - High-fidelity static appearance is achieved by baking procedural color, ambient occlusion, and direct/indirect diffuse illumination into texture atlases or vertex data.
  - Textures are packed with non-overlapping UVs and sufficient island padding to avoid seam bleeding.
  - Coordinate attributes: Original object-relative Generated coordinates are preserved or cached prior to mesh union.
- **Color Management and Shading Model**:
  - The pipeline explicitly chooses between two color workflows:
    - *Workflow A (Linear Lightmaps)*: Scene-linear baked lightmaps evaluated with Three.js runtime tone mapping.
    - *Workflow B (Unlit Display-Referred)*: Display-referred baked textures using `KHR_materials_unlit` with runtime tone mapping disabled.
  - Prevents dual-lighting or double-transform visual corruption.
- **Specular and View-Dependent Limits**: Static baking captures camera-independent diffuse illumination. View-dependent specular reflections cannot be fully baked statically; they require explicit material handling (e.g., environment reflection probes or roughness maps).
- **Status Notice**: The static display-referred route was exercised in an external task workspace. Architecture/ground used texture atlases and constant-color canopies used per-corner baked lighting. This is not an automatic GLB export promise or a guarantee for dynamic scenes.

### 6. Tooling and Runtime CLI Philosophy
- **Reusable Template**: `templates/mobile_walkthrough` has one baked-unlit GLB path. The manifest contains only assets, background, spawn/bounds and overview pose. Runtime world/demo generation, realtime lighting modes and generic camera/quality tuning are excluded. Generated geometry belongs to test fixtures only; navigation uses fixed defaults.
- **Experimental Scripting**: Pipeline automation scripts remain in task-specific workspaces during early iteration.
- **Future CLI Evaluation**: A shared, generic CLI may be introduced only if cross-project automation patterns prove genuinely reusable and explicit user authorization is granted.

### 7. Dynamic Character Branch

Character tasks establish intended articulation before selecting a skeleton. Procedural rig sources are first-class alongside Blender scenes. The exported asset retains skinning, and the consumer reconstructs any required deformation-aware shader, normal, outline and shadow behavior.

Do not blindly apply the static architectural merge/evaluate/bake branch to moving characters. It may discard required skin data or encode pose-dependent shadows; surface-color bakes are not prohibited. Static surroundings can still use the existing walkthrough workflow.

Capture, inference and rendering have distinct lifecycles. A failed detector can leave a loaded character's demo usable; a failed character cannot. Verification distinguishes offline rig data, synthetic/mock tests, real positive fixtures, authorized live capture and user-approved motion style. These are external execution contracts, not new runtime components in this repository.
