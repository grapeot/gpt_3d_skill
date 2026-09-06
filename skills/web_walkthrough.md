# WebGL Architectural Walkthrough (`web_walkthrough`)

Type: Workflow. Updated: 2026-09-05. Target: static browser scenes with an explicitly chosen fidelity and performance budget.

## Goal
Deliver an interactive, real-time 3D architectural walkthrough in the browser using Three.js and Vite. Faithfully preserve Blender's approved visual lighting, procedural material detail, and contact shadows via static baking before optimization, supported by pre-batch collision geometry and robust dual desktop/mobile controls.

## Boundaries
- **Task Workspace Boundary**: All web application source code, Vite build bundles, baked textures, exported GLB assets, and paired test renders belong strictly in external task workspaces outside this skill repository.
- **Network Serving Authority**: Serve static build directories only. Bind to localhost/127.0.0.1 by default. Binding to LAN interfaces or generating external URLs requires explicit user authorization. Check chosen port availability before binding; never kill unrelated processes.
- **Emulation vs Physical Certification**: Browser touch emulation validates input logic and layout responsiveness, but does not constitute physical-device certification. Same-LAN URL accessibility does not equal public Internet deployment.
- **Source Model Immutability**: The master `.blend` scene remains intact. Geometry union, UV unwrapping for texture atlases, coordinate evaluation, and baking must be executed on temporary export copies or non-destructive dependency graphs.
- **Optimization Precedence**: Visual parity with the approved Blender scene takes precedence over premature geometry decimation. Optimizations must preserve the established aesthetic baseline.

## Acceptance Criteria
- **Paired-Camera Visual Parity**: Save before-export, unbaked-browser and baked-browser frames from equivalent camera poses, projection and viewport. Confirm material variation and contact shadows survive, record image error metrics and their limitations, and inspect the result. A nonempty atlas is not proof of fidelity.
- **Asset Loading Integrity**: Exported GLB and collider metadata load without console errors or texture decode warnings. Missing assets must fail visibly; silent fallback to fake placeholder scenes is prohibited.
- **Dual Input Reliability**:
  - Desktop: Pointer Lock API controls camera look with WASD movement; if pointer lock is rejected or unavailable, provide immediate click-drag look fallback.
  - Mobile: Touch joysticks and touch swipe look function reliably over standard HTTP without requiring pointer lock.
- **Velocity and State Reset**: Pressing `Escape` or triggering a window `blur` event immediately zeroes player translation velocity and clears active key buffers.
- **Collision Boundary Enforcement**: Player movement is constrained by pre-batch obstacle colliders and outer radius limits without clipping through walls or terrain edges.
- **Coordinate Conversion Integrity**: Blender Z-up coordinates convert cleanly to WebGL Y-up coordinates: `(x, y, z) -> (x, z, -y)`.

## Resources
- **Reusable Template**: [`templates/mobile_walkthrough`](../templates/mobile_walkthrough/README.md) includes configurable GLB loading, touch/desktop controls, collisions, baked/realtime lighting and tests. Copy it into the task workspace rather than rebuilding those components.
- **Node.js, Vite & Three.js**: Minimal static web walkthrough application framework without heavy UI runtime dependencies.
- **Blender CLI & Cycles Baking**: Headless geometry evaluation, UV atlas generation, and diffuse light baking.
- **Playwright / Browser Automation**: Headless validation of canvas rendering, pointer-lock fallback, and touch emulation.
- **Primary References**:
  - Cycles Baking Guide: `https://docs.blender.org/manual/en/latest/render/cycles/baking.html`
  - glTF 2.0 Export Manual: `https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html`
  - Three.js Color Management Guide: `https://threejs.org/manual/en/color-management.html`

## Output Specification
Task workspaces should contain the following deliverable roles. Names below are examples; preserve an existing task layout and report its actual paths.
- `public/scene.json`: The template's scene configuration. Coordinates are glTF/Three.js Y-up; asset paths resolve relative to this file and support nested deployment paths.
- `export_baked_glb.py`: Blender script performing UV atlas packing, light baking, coordinate conversion, and GLB export.
- `colliders.json`: Pre-batch bounding boxes and collision hulls extracted from individual architectural elements.
- `app/`: Minimal Vite + Three.js application source (`index.html`, `main.js`, `controls.js`, `style.css`).
- `dist/`: Production static build directory ready for local serving.
- `paired_validation/`: Validation evidence:
  - `blender_reference.png`: Render from Blender Cycles under defined camera parameters.
  - `webgl_capture.png`: Viewport capture from identical virtual camera in Three.js.
  - `fidelity_notes.md`: Reviewer notes documenting visual parity, residual differences, and metrics.

## High-Value Guidance and Required Bake Workflow

### 1. Visual Fidelity Preservation Through Baking
- Standard glTF exports cannot translate Blender's procedural shader graphs (such as procedural wood grains, stone noise, or color ramps), resulting in flat, drab vertex colors and primitive dynamic lighting.
- When preserving an approved Blender-lit scene matters more than dynamic relighting, bake procedural surface details, direct and indirect diffuse illumination, and ambient occlusion contact shadows into texture atlases or vertex data.

### 2. Texture Atlas and UV Margin Management
- Generate non-overlapping UV coordinates for baking using non-destructive UV packing operations.
- Ensure sufficient texel padding (island margin) between UV islands to prevent dark seam bleeding during mipmap filtering in WebGL.
- Verify texel density consistency across architectural surfaces to prevent blurred textures adjacent to sharp geometry.
- Inspect the rendered baked model in a viewport, rather than merely checking that an image file was generated.

### 3. Coordinate Preservation During Mesh Union
- Joining multiple architectural meshes prior to baking can destroy object-relative `Generated` texture coordinates used by procedural shaders.
- Preserve original coordinates before joining by capturing them into custom mesh attributes and routing procedural nodes to those attributes. `Generated` coordinates are normalized to the original local bounding box; storing raw vertex positions is not equivalent. Handle zero-extent axes and preserve the attribute through evaluated meshes and joins.

### 4. Color Management and Shading Model Selection
Decide explicitly between two color management strategies:
- **Strategy A: Scene-Linear Lightmaps with Runtime Tone Mapping**:
  - Bake diffuse lightmaps in scene-linear space.
  - Three.js applies AgX or ACES tone mapping at runtime.
- **Strategy B: Display-Referred Unlit Textures (`KHR_materials_unlit`)**:
  - Bake combined diffuse color and lighting directly through Blender's color management view transform.
  - Render with unlit materials in Three.js with runtime tone mapping disabled.
  - **Critical Rule**: Never apply lighting calculations or view transforms twice.

### 5. View-Dependent and Specular Limits
- Static baking captures camera-independent diffuse illumination. View-dependent effects (specular highlights, mirror reflections) cannot be fully baked statically.
- Treat specular properties explicitly using roughness/metalness maps, environment reflection probes, or subtle real-time directional highlights.

### 6. Pre-Batch Collider Separation Architecture
- Batching geometries sharing the same material minimizes draw calls in Three.js.
- However, merging meshes into single draw calls destroys individual mesh bounding boxes needed for spatial collision checks.
- Extract individual obstacle bounding boxes and collision primitives to `colliders.json` *before* visual batching:
```python
# Extract pre-batch collision metadata
import json
from mathutils import Vector

colliders = []
for obj in obstacle_objects:
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    colliders.append({
        "id": obj.name, "type": "aabb",
        "minX": min(p.x for p in points), "maxX": max(p.x for p in points),
        "minZ": -max(p.y for p in points), "maxZ": -min(p.y for p in points),
    })
with open("colliders.json", "w") as fp:
    json.dump(colliders, fp, indent=2)
```

The template consumes these Y-up horizontal coordinates directly. A [schema example](../templates/mobile_walkthrough/public/colliders.example.json) includes both an AABB and a cylinder; its format is covered by the template tests. An empty array is valid for an obstacle-free scene.

### 7. Dual Desktop Navigation and Pointer Lock Fallback
Handle unavailable APIs, synchronous exceptions, rejected promises and `pointerlockerror`. After an explicit user action, offer drag-look plus WASD when locking fails. Escape, blur, visibility changes and mode switches must disable movement and clear keys, joystick and active pointers. Test the fallback with Pointer Lock deliberately disabled; merely listening for lock changes does not implement a fallback.

### 8. Mobile Touch Controls Over Local HTTP
Support simultaneous movement and look with distinct pointer IDs. Keep UI buttons out of camera gestures, clamp pitch, handle pointer/touch cancellation and orientation changes, and expose touch controls without requiring Pointer Lock or a secure context.

### 9. Paired Validation Comparison Protocol
Perform rigorous visual comparison between Blender Cycles and Three.js:
1. Export explicit camera pose, projection, sensor/lens or orthographic scale, aspect ratio and view transform from Blender.
2. Configure the corresponding Three.js camera after the Z-up/Y-up conversion; do not copy Euler angles blindly or confuse horizontal and vertical field of view.
3. Match color management settings: if using Display-Referred baking, set renderer output color space to sRGB with no tone mapping.
4. Render Blender reference image at identical resolution as WebGL canvas viewport.
5. Save both images to `paired_validation/` and record visual fidelity notes.

### 10. Performance Budgeting
- Base optimization decisions on measured budgets: texture atlas resolution, texture decode memory, draw calls, and total triangles.
- Avoid blind polygon decimation that degrades visual silhouettes before baseline visual parity is established.
- Measure actual UV face area and the distribution of face widths in texels. Thousands of islands with large fixed margins can leave almost all atlas space unused; a nominal 4K atlas may still undersample tiny surfaces.
- Match bake dilation in pixels to the packed island gap. Recovering usable atlas area can improve fidelity without a larger texture. Judge this with paired renders, not the fraction of nonblack pixels, because legitimate occlusion can bake black.

## Observed Pitfalls
These pitfalls reflect empirical failures observed during actual walkthrough deployments:
- **Procedural Material Loss in Standard GLB**:
  - *Symptom*: Exporting procedural Blender materials directly to GLB strips textures, leaving drab vertex colors and crude dynamic lights.
  - *Fix*: Bake procedural colors and Cycles diffuse lighting into texture atlases before GLB export.
- **Collision Breakdown from Material Batching**:
  - *Symptom*: Collision detection fails or treats entire architectural complexes as one massive bounding box after material batching.
  - *Fix*: Extract pre-batch collision hulls from source objects before merging; resolve collisions against `colliders.json`.
- **Silent Placeholder Fallback**:
  - *Symptom*: Missing GLB models silently trigger fallback to generic placeholder scenes, hiding asset loading failures.
  - *Fix*: Remove silent fallbacks; display prominent, unambiguous error overlays when asset loading fails.
- **Pointer Lock Denial Deadlock**:
  - *Symptom*: Desktop browsers rejecting or denying pointer lock leave the user unable to rotate camera or navigate.
  - *Fix*: Implement seamless click-drag mouse look with WASD movement as an automatic fallback when pointer lock is unavailable.
- **Incomplete Pause State**: An Escape test still allowed subsequent WASD movement while pointer-lock state remained active. Explicitly release the lock, deactivate movement and clear input state, then test that a held movement key cannot move the paused camera.
- **Margin-Dominated Atlas Packing**: One fragmented architecture atlas used only about 4% of its area for actual faces. Many decorative faces were smaller than one texel. Reducing its normalized island gap while matching the bake margin recovered usable sampling area and reduced dark specks; increasing padding alone did not help.
- **Foliage Atlas Seams**: Tiny foliage islands produced dark chart boundaries. Per-corner baked lighting removed the atlas dependency for constant-color low-poly canopies. A procedural-wood vertex-bake trial produced black trunks, so trunks and branches stayed in the material texture atlas. Choose the representation by the material and observed result, not one rule for every mesh.
- **Encoded PNG Pixel Buffers**: In the exercised Blender version, reading an 8-bit PNG through `Image.pixels` returned encoded sRGB values. Those values needed explicit sRGB decoding before storage as glTF vertex colors. Do not assume every floating-point image buffer is scene-linear.
- **Projection State Leakage**: A perspective comparison set `sensor_fit` to vertical; switching the same Blender camera to orthographic without resetting that state changed the meaning of its scale. Export evaluated projection bounds or explicitly align sensor fit, aspect ratio and horizontal/vertical extents.
- **Source Coordinate Drift Check**: Before baking, a render of the joined export copy was compared with the source. Normalized object-relative coordinate attributes preserved the procedural materials; raw local vertex positions would not represent `Generated` coordinates.
- **Unlit Export Verification**: The exercised exporter recognized a color socket linked to material Surface as unlit. Inspect each exported material for `KHR_materials_unlit` and its intended texture or color attribute. Do not infer unlit behavior merely from a shader node's name.

## Status of Baked Workflow
The workflow was exercised on a static courtyard outside this repository: source-preserving preparation, texture and per-corner light baking, three matched-camera comparisons, final GLB checks, desktop controls, Pointer Lock fallback and touch emulation all ran. The final viewer used display-referred unlit appearance, not dynamic relighting. Fine texture filtering and view-dependent highlight differences remain; the exercise does not certify all scenes or physical phones. Runtime models, images, reports and scripts remain in the task workspace.
