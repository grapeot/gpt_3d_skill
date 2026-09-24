# Blender Procedural Modeling (`blender_modeling`)

Type: Workflow. Updated: 2026-09-05. Observed runtime: Blender 5.1.2; inspect local APIs before assuming cross-version compatibility.

## Goal
Generate clean, editable, procedurally constructed 3D architectural scenes, environments, and terrain in Blender via Python automation. Ensure structured semantic hierarchies, procedural PBR materials, consistent outward-facing normals, deterministic regeneration, and self-contained asset packaging.

## Boundaries
- **Task Workspace Isolation**: All generation scripts, reference images, source manifests, and generated `.blend` files reside strictly in external task workspaces outside this skill repository.
- **Reference Restraint**: Distinguish clearly between directly visible reference features and inferred dimensions or hidden rear elevations. Never assert historical or dimensional fidelity for stylized or fictional subjects.
- **Copyright and Asset Rights**: Keep original reference imagery local to the private task workspace whenever redistribution rights are unknown or proprietary.
- **Style Preservation**: An approved visual style (color palette, material roughness, edge beveling, proportion) must remain strictly consistent through any subsequent modeling refinements.
- **Source Protection**: Generator scripts must never unintentionally overwrite existing master `.blend` files; use versioned output filenames or explicit target paths.
- **Visual Review Prerequisite**: Procedural geometry generation does not replace visual review. Start ordinary appearance iterations with one useful preview; add front, side, rear or top views to resolve changed geometry, occlusion or framing concerns. Review the views required by a requested production or animation handoff before downstream use.

## Acceptance Criteria
Scope validation to the changed stage using the router's [iteration and handoff policy](skill_gpt_3d.md#iteration-and-model-handoff). The checks below describe relevant modeling and final-delivery guarantees, not a command to repeat every operation for an unchanged model or a viewer-only edit.

- **Deterministic Headless Execution**: Script runs headlessly without interactive prompts:
  ```bash
  blender -b -P generate_scene.py -- --output scene_model.blend
  ```
- **Execution Log Inspection**: Standard output and error logs contain zero Python tracebacks or unhandled exceptions. Verify logs directly:
  ```bash
   rg -n -i "traceback|error|exception" logs/generation.log
  ```
- **Asset Self-Containment**: Canonical `.blend` reloads cleanly headlessly, with all external textures and packed resources verified via `bpy.ops.file.pack_all()`.
- **Structural Organization**: Outliner contains logical collections (e.g., `Foundation`, `Structure`, `Roof`, `Props`, `Foliage`) and descriptively named objects.
- **Normal and Modifier Integrity**: Face winding and Solidify thickness/offset agree with the intended surface. No raised details are unintentionally buried. Thin sheets may intentionally be open or double-sided.
- **Watertight Terminations**: Curved architectural boundaries (such as curved roof hips or eaves) terminate with matching curved geometry rather than flat gaps or triangles.
- **Visual Verification**: A relevant preview confirms the current appearance. Additional front, side, rear and top isometric views confirm changed or suspect geometry, material appearance and obstacle clearance; use the full set when the requested production deliverable requires it.

## Resources
- **Blender Python (`bpy`)**: Headless scene generation, modifier application, and RNA API introspection (Blender 5.1.2 or current LTS).
- **Python Virtual Environment**: uv-managed virtual environment (`.venv`) for helper scripts and image manipulation.
- **Blender API Manual**: Cycles procedural nodes, modifiers, and scene management:
  `https://docs.blender.org/manual/en/latest/`
- **Cycles Baking Documentation**: Material texture mapping and evaluation:
  `https://docs.blender.org/manual/en/latest/render/cycles/baking.html`

## Output Specification
Task workspaces must produce the following structured deliverables:
- `generate_scene.py`: Deterministic Python generation script accepting CLI arguments for target paths and seeds.
- `scene_model.blend`: Master Blender scene with packed textures and intact modifier stacks.
- `sources_manifest.json`: Metadata linking modeled components to references (noting visible vs. inferred aspects).
- `previews/`: Relevant preview renders; include additional views as required by the change or delivery scope. Conventional names are:
  - `previews/front_elevation.png`: Front perspective/orthographic view.
  - `previews/side_elevation.png`: Side perspective/orthographic view.
  - `previews/rear_elevation.png`: Rear perspective/orthographic view verifying canopy clearance.
  - `previews/isometric_overview.png`: High-angle overview validating terrain and roof caps.
- `logs/generation.log`: Complete stdout and stderr captured during headless script execution.
- `<project>-share.html`: The current model and supplied source photos in an offline, single-file comparison viewer, following [Shareable HTML delivery](references/shareable-html.md), unless the user specifies another handoff.

## High-Value Guidance

### 1. Procedural Hierarchy and Modifiers
- Maintain procedural modifiers (Array, Mirror, Bevel, Solidify) unapplied in the master `.blend` scene to allow non-destructive adjustments.
- Organize components into modular collections. Use separate parent empties for structural clusters to facilitate downstream animation.
- Assign clear, semantic names to all objects (e.g., `roof_tile_main`, `column_exterior_corner`) instead of default numeric identifiers.

### 2. Procedural Material Layering
- Construct procedural PBR shader graphs using standard Principled BSDF nodes coupled with procedural textures:
  - Wood: Noise texture stretched along primary grain vector with subtle roughness variation.
  - Stone / Plaster: Noise or Voronoi networks for restrained surface variation; inspect node availability in the installed Blender version.
  - Ceramic Tiles: Color ramps driving slight hue shifts across individual tile elements.
  - Vegetation: Translucent foliage shading with vertex color gradients.
- Avoid hardcoded absolute image texture paths; use relative paths or pack textures directly into the `.blend` file.

### 3. Reference Management and Visual Review
- When modeling from 2D references, treat unseen rear structures as inferred hypotheses rather than historical or canonical truth.
- Verify camera framing and horizon alignment across all test renders to ensure natural perspective.
- Record visual assumptions, structural inferences, and reference citations in `sources_manifest.json`.

### 4. Geometry and Watertight Boundaries
- Ensure roof ridges, hip tiles, and eaves form closed profiles.
- Avoid non-manifold geometry or zero-area polygons that cause artifacts during baking or modifier evaluation.
- When generating curved hip profiles, sweep matching cross-sections rather than terminating abruptly with flat polygons.

### 5. Automated Validation
Inspect mesh polygon normals and evaluated modifier output. Negative Solidify thickness is not inherently wrong; acceptance depends on the intended shell direction and visible result. Update the view layer before reading evaluated transforms. Do not assume removed methods such as `Mesh.calc_normals()` exist in current Blender.

### 6. Multi-Angle Camera Setup
Derive camera positions from the actual scene bounds rather than universal coordinates. Aim Blender cameras with `(target - camera.location).to_track_quat('-Z', 'Y')`; check the evaluated geometry at each view, then inspect the saved render.

## Observed Pitfalls
These pitfalls reflect empirical failures observed during actual modeling runs:
- **Pack Operator Namespace Error**:
  - *Symptom*: Calling `bpy.ops.wm.pack_all()` throws an `AttributeError` stating the operator does not exist.
  - *Fix*: Use `bpy.ops.file.pack_all()` to pack external textures and dependencies into the `.blend` file.
- **Inverted Roof Normals and Solidify Inversion**:
  - *Symptom*: When applying a Solidify modifier to extruded roof planes, raised tile details and trim are buried inside the roof volume.
  - *Fix*: Verify polygon normal orientations using `mesh.polygons[...].normal` or calculate normals consistently outward before adding modifiers.
- **Curved Hip Discontinuities**:
  - *Symptom*: Capping curved roof hip boundaries with flat triangular geometry leaves visible gaps, light leaks, and sharp seams.
  - *Fix*: Terminate curved boundaries using curved profile sweeps matching the hip contour.
- **Tree Canopy Occlusion of Rear Elevations**:
  - *Symptom*: Foliage placed close to the central structure obscures rear architectural features during camera framing checks.
  - *Fix*: Offset tree canopies radially outward from structural perimeters and confirm visibility in rear preview renders.
- **Annular Terrain Bounding Box False Clipping**:
  - *Symptom*: Calculating camera frustum clearance against axis-aligned square bounding boxes for circular or annular terrain reports false camera clipping errors.
  - *Fix*: Check camera intersection against actual perimeter vertices of the circular mesh rather than the bounding box.
- **Blender Wrapper False Exit Status**:
  - *Symptom*: CLI execution wrappers around Blender can return exit code 0 even when Python scripts fail with fatal tracebacks.
  - *Fix*: Inspect stderr and generation log files directly for unhandled exceptions rather than relying on process exit codes.

## General Constraints and Future Risks
- **Universal Dimensions Fallacy**: Avoid hardcoding dimensions from a single reference as universal constants; parameterize scale, column spacing, and heights in generator scripts.
- **Modifier Stack Depth**: Excessively deep unapplied modifier stacks on dense meshes can drastically degrade viewport performance and memory during batch evaluation.
- **Geometry Density vs Baking**: Avoid excessively micro-modeled geometry for details that are better handled by normal maps or static texture baking in downstream web pipelines.
- **Dependency Graph Stale Caches**: Always call `depsgraph.update()` when dynamically inspecting evaluated mesh vertices or derived dimensions in Python scripts.
