# Working Log and Lessons Learned

## Changelog

### 2026-09-24: Fast Model Iteration and Offline Comparison Handoffs
- Adapted local model-delivery guidance to the existing vendor-agnostic router: reuse working outputs, begin with a relevant preview, and select validation by changed stage instead of repeating full production checks for every small edit.
- Added a focused standalone-HTML reference covering embedded GLB/runtime/source photos, local-file loading, expandable photo comparison, current-asset checks and visible failures. Completed model handoffs include this local file unless the user selects another format; external publication still requires authorization.
- Aligned modeling and verification guidance with this iteration scope while retaining required animation, rigging and architectural-walkthrough checks. The mobile walkthrough runtime and its baked-unlit scope are unchanged.
- This contribution contains documentation and document-integrity coverage only. Runtime artifacts and source photos remain in external workspaces. No new Blender, browser or physical-device certification is claimed for this PR.
- Validation: all 10 repository unit tests passed, including recursive skill-example parsing, relative links and public-file hygiene; `git diff --check` passed.

### 2026-09-05: Character Rigging Skill Publication Preparation
- Added the reviewed character-rigging skill and extended the existing sole router; no runtime app, model, media or fixture entered this repository.
- Transferred observed rig/export, attachment, local-capture, clean-build and review lessons from an external character project. The new contract starts with target motion-model choice, not a human skeleton template.
- Preserved the static architectural bake path while separating deforming characters and allowing editable generator-plus-rig sources. Existing mobile template behavior and viewer scope remain unchanged.
- Prepared the integration in an isolated worktree. Retained the concurrently merged hybrid-video skill and updated shared discovery to include all five focused skills. Publication is not claimed by this entry.

### 2026-09-05: Shoulder-Flap Follow-Up After the Documentation Gate
- The external application now uses five bones with one shoulder actuator per wing and no elbow/Bend control. The source elbow points are deliberately ignored by mapping and calibration; this does not claim estimator immunity to real human elbow motion.
- Reload, weight validity, one connected closed yellow surface, finite shoulder sections and actual multi-angle pose checks ran. The intended mid/distal region preserves vertex-pair distances across 26 poses/sweep samples; the root remains softly weighted.
- Candidate testing exposed head intrusion during combined tilt, then waist-side weight spill, then further intrusion at the declared upper rotation limit. An authored depth correction, a more local weight envelope and a tighter operational angle limit addressed these sampled cases without relaxing collision thresholds. The final head check covers 67 discrete cases, not a continuous collision proof.
- A fresh-source install/build, default tests and a real CPU detector positive-fixture-to-mesh browser path passed. No runtime assets or reports were copied into this skill repository. Personal-camera behavior, phones/Safari, physical latency and user aesthetic approval remain unverified.
- Old articulated helpers explicitly reject the new rig contract, and old snapshots are preserved. This was migration hygiene added before allowing those tools to run, not a claim that a NaN failure was observed.

### 2026-09-06: Hybrid AI Video Skill
- Added [hybrid 3D and image-to-video documentation](../skills/hybrid_ai_video.md), a root routing branch, and a README capability pointer. Exact mechanical trajectories remain under `blender_animation.md`.
- Documented source-frame affordances, editorial/audio ownership, managed credentials, pre-POST reservations, cost attribution, and separate technical, visual, temporal, and listening acceptance. No runtime frameworks, scripts, templates, or media assets were added.
- Reviewed the Antigravity rough draft against external production records; removed unsupported failure causes and quality claims. The 69.5-second case retains explicit final-listening and cooling-narration audit limitations.
- Updated the focused-skill enumeration and passed all nine offline documentation checks plus `git diff --check`. No video generation, media reprocessing, account operations, or new audiovisual certification was performed for this documentation change.

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

### Model Iteration and File Sharing
- **Localhost is not a standalone file:** ES module imports and neighboring GLB fetches can leave a double-clicked HTML viewer unable to load. Bundle the runtime and parse embedded model bytes for an offline handoff.
- **Keep input and output together:** A comparison needs the actual supplied reference photos, with exclusions respected and access to their full composition. A generated render cannot stand in for the input.
- **Validate the changed stage:** Rebuilding a reference-photo panel does not require rerendering an unchanged model. Asset identity checks keep the share file current without making repeated full browser or geometry audits a handoff gate.

### Hybrid Character Films
- **Start-Frame Motion Affordance:** A nearly seated kiln lid produced weak motion. A visible gap in the revised Blender input and a focused descent prompt improved the generated action; more prompt detail alone was not the fix.
- **Prompt Simplification and Trimming:** Brush ferrule separation required regeneration. The retry then needed trimming at 4.5 seconds before a late invented handle appeared. Retaining a complete usable action can avoid another paid attempt.
- **Auditory Verification Limits:** A review returned HTTP success and accounted audio tokens while denying listening capability. Earlier reviews also confused musical accents with foley. Check cue records and retain unreviewed status; technical checks and contact sheets do not replace final audiovisual review.

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

### 5. Character Rigging and Local Capture
- **Motion-Model Mismatch**: An articulated two-link flipper passed structural tests yet the user preferred an earlier whole-appendage silhouette. Human elbow landmarks do not require a visible target elbow. The subsequent shoulder-only implementation has external runtime evidence, but user approval remains separate.
- **Attachment Evidence**: A moving skeleton did not prevent pointed, separate flipper roots from looking detached. A genuinely connected surface and blended shoulder weights were needed; object-level merging was insufficient.
- **Reach vs Gesture**: Lowering a near-limit hand target increased bend but changed head-holding into cheek-holding. Pose-only and regenerated-asset comparisons separated parameter effects from bind/shape limitations.
- **Stale Rig Constraints**: A diagnostic helper kept an old elbow limit after the asset/controller changed. Shared definitions and revisioned, non-overwriting output restored a meaningful comparison.
- **Clean Build and Failure Semantics**: Ignored detector assets caused a successful but incomplete clean build; a separate character-load failure falsely claimed presets remained usable. Fixed resource verification and distinct loading states addressed both.
- **Evidence Levels**: Real empty inference plus isolated mapper tests left a nonempty integration gap. A public positive fixture closed that path but did not certify live-camera behavior. A reviewer seam claim was withdrawn after primary image and topology evidence contradicted it.
- **Single-Bone Weight Spill**: Removing the elbow did not prevent unintended shoulder influence from dragging the waist. A localized envelope and lower-body weight guard were checked against actual renders; intended root blending was retained.
- **Range Checks Beyond Presets**: Safe named poses missed head intersections at the allowed shoulder limit combined with head roll. Limits were tightened and sampled jointly, without changing the inside/outside threshold or claiming all-angle collision safety.
- **Shape vs Actuator Count**: Actual rigid-region weights and invariant internal vertex-pair distances supported whole-flap behavior. The mere absence of an elbow node would not have supplied that evidence.
