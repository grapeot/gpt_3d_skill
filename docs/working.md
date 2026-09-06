# Working Log and Lessons Learned

## Changelog

### 2026-09-06: Narrow the Viewer Scope
- Removed runtime demo generation, alternate realtime lighting, mode selection and broad camera/quality configuration. The template now does one job: view and walk around a supplied baked-unlit scene.
- Kept useful collision, input, color-pipeline and browser checks; moved synthetic scenery data to test fixtures instead of shipping a runtime demo.
- Recorded P0 priorities, explicit non-goals and a delivery-first time budget in the PRD. General skill knowledge is not a mandate to implement every optional feature.
- Existing acceptance remains green: 9 repository checks, 20 Node tests and 22 browser checks, including the production subpath build and baked-color pixel check.
- Fixed a CI timing failure: asset readiness preceded the first render, so the test sometimes read zero triangles. Positive-view tests now wait for a rendered frame rather than weakening the geometry assertion or adding retries.

### 2026-09-05: Reusable Mobile Walkthrough Template
- Added a standalone vanilla Three.js/Vite template with a configurable scene manifest, explicit procedural demo and real GLB loading. No user scene assets, private endpoints, analytics or native-app framework are included.
- Reused desktop/touch navigation and collision behavior, including pause/reset, Pointer Lock fallback, delayed-grant protection and nonzero-center walk bounds.
- Added generated GLB and embedded PNG fixtures, including a framebuffer assertion for the display-referred sRGB pipeline and a production nested-path loading test.
- Aligned the skill's collider example with the runtime schema. Kept deployable asset files visible to a copied template's Git workflow while retaining the skill repository's asset exclusions.
- Expanded publication hygiene checks to all non-ignored source paths, including new root files and directory symlinks. Replaced the test runner's platform-specific port probe with Node APIs.
- Local acceptance passed: 9 repository checks, 20 Node tests and 22 browser tests; production build passed. Independent privacy and engineering follow-up closed all review findings.
- Template work is isolated from concurrent character-rigging changes and will be merged through its own pull request.

### 2026-09-05: Publication Baseline
- Reviewed all 14 publication candidate files for private data and unintended assets. No blocking privacy findings remained; ignored runtime caches and local artifacts are excluded from the publication set.
- Re-ran all nine offline checks successfully and prepared the documentation-only baseline on `master`. The reusable application template will be introduced through a separate pull request.

### 2026-09-05: Repository Scaffold and Initial Documentation
- Initial draft of human/agent-facing documentation and loose Markdown skills for `gpt_3d_skill`.
- Established repository architecture:
  - Root agent guidelines ([`AGENTS.md`](../AGENTS.md)) specifying virtual environment rules, git restrictions, artifact isolation, and unit test contracts.
  - Public overview ([`README.md`](../README.md)) defining user capabilities, agent installer flow, and root router exposure.
  - Product specifications ([`docs/prd.md`](prd.md)), system design ([`docs/rfc.md`](rfc.md)), and verification strategy ([`docs/test.md`](test.md)).
  - Sole root router ([`skills/skill_gpt_3d.md`](../skills/skill_gpt_3d.md)) exposing focused domain skills:
    - [`skills/blender_modeling.md`](../skills/blender_modeling.md)
    - [`skills/blender_animation.md`](../skills/blender_animation.md)
    - [`skills/web_walkthrough.md`](../skills/web_walkthrough.md)
- Reviewed the draft against observed failures; removed obsolete API snippets, corrected parenting guidance and distinguished frame provenance from image-hash uniqueness.
- Added `.gitignore`, `.env.example`, a minimal CI workflow and nine offline tests. All nine tests passed, including relative links, skill contracts, Python snippet syntax and public-file hygiene.
- Registered only the root skill in the host workspace discovery chain. No commit, remote repository or publication was created.
- Exercised the web skill in a separate task workspace: source-preserving material coordinates, Cycles static baking, per-corner canopy lighting, unlit GLB export, paired image comparisons and browser controls all ran.
- Fed back observed atlas undersampling, projection-state mismatch and PNG/vertex-color conversion issues. The final exercise retained three texture atlases plus baked canopy color data; source models and runtime evidence were not copied into this repository.
- **Status**: Scaffold, nine offline checks and the external baked-workflow exercise are complete. No physical-phone performance or dynamic-lighting certification is claimed.

---

## Lessons Learned

### 1. Blender Procedural Modeling
- **Pack Operator Namespace**: `bpy.ops.wm.pack_all()` does not exist in modern Blender RNA APIs; asset packing must be performed using `bpy.ops.file.pack_all()`.
- **Exit Code Deception**: Blender headless execution scripts running through CLI wrappers can exit with status code 0 despite fatal Python tracebacks. Always inspect logs and output artifacts directly rather than trusting return codes alone.
- **Normal Inversion on Modifiers**: Inverted surface normals cause the Solidify modifier to extrude inward, burying decorative elements (such as raised roof tiles) inside the structural mesh. Explicitly verify consistent outward normals before applying shell modifiers.
- **Curved Roof Hip Terminations**: Flat triangular end-caps on curved hip roofs create jarring geometry discontinuities; curved boundaries require matching curved closures.
- **Canopy Placement and Occlusion**: Tree canopies positioned too close to structural elevations obscure rear architectural features; tree positions must be offset radially outward during camera framing validation.
- **Spatial Bounding Checks**: Square bounding boxes applied to circular or annular terrain generate false positives during camera clipping calculations. Verification must use actual perimeter boundary vertices.
- **Source File Immutability**: Always protect source `.blend` files against accidental overwrite during export or evaluation steps.

### 2. Blender Animation and Video Pipeline
- **Transform Doubling on Dynamic Parenting**: Inverting a parent matrix using `parent.inverse @ old_world` while preserving the existing `matrix_basis` doubles child transformations. Fix: synchronize the parent's world matrix prior to inversion, preserve the child's world matrix, and verify every child matrix individually against its initial state.
- **Subterranean Explosion Artifacts**: Negative explosion vectors displace lower foundations below opaque ground geometry. Restrict explosion offsets to positive vertical and radial vectors.
- **Internal Wall Representation**: Solid monolithic blocks appear as opaque, unreadable cubes when exploded. Model thin architectural wall shells so interior layouts remain readable during exploded-view animation.
- **Frustum Evaluation Across Keyframes**: Inspecting camera framing solely at start and end keyframes misses clipping during intermediate orbital paths. Always inspect camera frustums across mid-path frames after dependency graph updates.
- **Static Previews vs Motion**: Contact-sheet JPEG galleries cannot substitute for video playback review; continuous motion dynamics (such as falling or easing speeds) must be validated in rendered video streams.
- **Staged Prop Entry**: The user rejected scaling trees into existence. Full-size vertical entry from above frame with cubic deceleration and staggered timing made the descent visible; no overshoot was required.
- **Stream Verification**: Decoded streams must be verified via `ffprobe` and `ffmpeg` decode checks to confirm that 60fps renders contain unique rendered frames rather than duplicated or interpolated frames.

### 3. WebGL and Three.js Export
- **Procedural Loss in Standard glTF**: Exporting procedural node shaders directly to glTF flattens complex materials to drab vertex colors with primitive dynamic lighting, resulting in unacceptable visual degradation compared to Blender.
- **Collision Breakdown from Batching**: Combining meshes by material to minimize draw calls merges disparate geometries into a single mesh, destroying individual bounding boxes needed for spatial collision. Solution: extract pre-batch collision hulls to a separate JSON manifest prior to geometry batching.
- **Silent Placeholder Fallback**: Viewer fallbacks that silently display generic placeholder geometries mask asset loading failures. Missing assets must fail loudly or be unmistakably flagged.
- **Pointer Lock Fragility**: Relying exclusively on the Pointer Lock API breaks navigation when pointer lock is denied or unsupported. Always provide fallback desktop navigation (click-drag look + WASD movement).
- **Mobile Touch Over Local HTTP**: Mobile touch controls must operate reliably over standard HTTP connections without triggering desktop pointer-lock requests.
- **Input Reset on Escape**: The browser test still allowed movement after Escape until pointer-lock and movement-active states were explicitly reset, in addition to clearing keys.

### 4. Static Baking Exercise
- **Baking as Fidelity Decision**: Static baking of procedural diffuse colors, ambient occlusion, and direct/indirect lighting into texture atlases is required to match Blender Cycles visual quality in WebGL.
- **Non-Destructive Coordinate Preservation**: Joining meshes for baking can corrupt object-relative `Generated` coordinate spaces used by procedural shaders unless bake-safe coordinate attributes are generated first.
- **Atlas Sampling and Padding**: Inadequate island padding causes dark border bleeding at UV seams; UV unwraps must allocate adequate texel margins and verify sampling density.
- **Color Pipeline Discipline**: Explicitly choose between scene-linear baked lightmaps with runtime tone mapping versus display-referred unlit textures (`KHR_materials_unlit`) without tone mapping. Never double-apply lighting or tone transforms.
- **View-Dependent Limitations**: Baking cannot capture camera-dependent specular highlights or dynamic reflections. These limitations must be documented and handled via separate material properties or reflection probes.
- **Atlas Occupancy**: Thousands of fragmented UV islands can spend most texture area on margins. Measure face area/width in texels; correcting occupancy reduced dark undersampling artifacts without increasing atlas resolution.
- **Representation Choice**: Per-corner light baking worked for constant-color low-poly canopy surfaces, while procedural timber remained on texture atlases after a vertex-bake trial turned trunks black.
- **Color Buffers**: Inspect whether image-buffer floats contain encoded or scene-linear values before assigning them to vertex colors; the exercised PNG reader exposed encoded sRGB values.
- **Projection Matching**: Perspective-to-orthographic camera reuse retained sensor-fit state and initially invalidated the overview comparison. Matching evaluated projection, not just location and an apparent scale value, fixed the comparison.
- **Status**: Static baked appearance passed the external paired-view and control checks. Fine filtering/specular differences remain, and physical phone performance is not certified.
