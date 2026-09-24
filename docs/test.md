# Test and Verification Strategy

## Overview
Verification in `gpt_3d_skill` is divided into two distinct operational categories:
1. **In-Repository Offline Tests**: Automated document integrity, link validation, and repository hygiene tests.
2. **External Workspace Execution Checks**: Opt-in runtime validations covering Blender headless execution, video decode streams, browser interactions, and visual fidelity comparisons.

## In-Repository Offline Tests

Template source is included in privacy and relative-link checks. Dependencies, browser reports and generated fixtures are excluded from publication. The standalone template has Node unit tests and Playwright acceptance tests, including an actual generated GLB and a production build under a nested URL path; no Blender installation is needed for those tests.

The simplified runtime has no generated demo or renderer switch. Tests retain their synthetic GLB/PNG and collider fixtures and inject them only during verification, including navigation, color, failure and nested-path checks.

### Test Execution
Automated repository tests are run via standard Python unit testing:
```bash
python -m unittest discover -s tests -v
```

### Test Scope and Invariants
- **Link Integrity**: All relative Markdown links between documents and skills resolve to valid target files and anchors.
- **Skill Contract Validation**: Each focused skill includes a goal, boundaries, acceptance criteria, resources and output specification. Do not enforce arbitrary minimum lengths that encourage filler.
- **Repository Hygiene**:
  - Zero hardcoded local absolute paths or filesystem roots.
  - Zero private usernames, internal IP addresses, personal emails, or credential secrets.
  - Zero bundled binary assets, render outputs, or `.blend` files in the repository.
- **Router Integrity**: Validates that [`skills/skill_gpt_3d.md`](../skills/skill_gpt_3d.md) is the sole root router and correctly links to all domain skills.
- *Note*: These tests verify documentation structure and repository health. They do not certify 3D visual rendering or runtime performance.

## External Workspace Execution Checks

All execution checks occur in task-specific workspaces external to this repository.

### Change-Based Verification

Use the router's [iteration and handoff policy](../skills/skill_gpt_3d.md#iteration-and-model-handoff) to select relevant checks. For an ordinary appearance iteration, review one useful preview and rebuild the standalone comparison; add geometry checks or angles for changed or suspect surfaces. A viewer-only or source-photo-only change does not require Blender execution. Full requested animation, rig, printing or walkthrough acceptance is not replaced by a model-preview smoke test.

For [standalone HTML delivery](../skills/references/shareable-html.md), each build checks embedded model/reference identity and missing external resources. Test the first viewer or loading/bundling changes with a targeted `file://` smoke pass; inspect only affected layout or controls for later UI changes. Geometry/material-only revisions using the same verified viewer need another browser pass only when a concrete concern appears. State whether offline/file opening was actually exercised; localhost alone cannot certify that behavior.

### 1. Blender Modeling Acceptance
- **Headless Execution**: Execute generation scripts using `blender -b -P <script.py>`.
- **Log Inspection**: Inspect standard output and error logs directly for Python tracebacks. Do not rely solely on process exit codes, as Blender execution wrappers may exit with status 0 despite unhandled exceptions.
- **Asset Integrity**: Open generated `.blend` headlessly and verify all textures and resources are packed (`bpy.ops.file.pack_all()`).
- **Surface Normals & Modifiers**: Inspect intended face orientation and shell thickness/offset together; verify that surface details are not accidentally buried. Open sheets can be intentional.
- **Render Review**: Start with a relevant low-cost view. Generate front, side, rear and top isometric views when changed or suspect geometry needs elevation/clearance review, or when the requested production deliverable requires the full set.

### 2. Blender Animation and Video Acceptance
- **Frame Sequence Completeness**: Verify that the rendered PNG sequence contains every sequential index with no skipped frames or 0-byte files.
- **Stream Decode Validation**:
  ```bash
  ffmpeg -v error -i output.mp4 -f null -
  ```
  Returns code 0 with zero errors, confirming stream decode integrity.
- **Metadata Verification**: Run `ffprobe` to verify container duration, exact frame rate, dimensions, and pixel format.
- **Frame Provenance Check**: Verify intended frame indices and whether frames were rendered or interpolated; inspect actual motion segments. Identical frames during intentional holds are valid.
- **Spatial Verification**: Inspect intermediate keyframes for ground clipping (e.g., subterranean explosion offsets) or parent transform doubling.

### 3. Web Walkthrough Acceptance
- **Asset Loading**: Confirm GLB models load without console errors, 404s, or texture decoding warnings. Ensure missing asset handling fails loudly rather than falling back silently to fake placeholder scenes.
- **Input Controls**:
  - Desktop: Test pointer lock acquisition and verify that WASD/drag-look fallback functions when pointer lock is denied.
  - Mobile: Test touch joystick translation and swipe look controls under mobile emulation without requiring pointer lock.
  - Reset & Pause: Verify that pressing `Escape` or triggering window `blur` immediately zeroes player velocity.
- **Collision Boundaries**: Confirm player movement is constrained by pre-batch obstacle colliders and outer radius limits.
- **Network Serving**: Verify static preview servers bind to local interfaces only with user authorization. Note that mobile emulation does not substitute for physical device testing, and same-LAN URLs do not provide public access.

### 4. Paired-Camera Fidelity Comparison
- **Blender Reference Capture**: Render a high-resolution reference image in Blender Cycles using explicit camera transforms, lens FOV, and film color management.
- **WebGL Frame Capture**: In the web viewer, set the virtual camera to the identical transform, projection parameters, and matched color space. Capture the canvas buffer.
- **Visual Match Review**: Compare before/after frames side-by-side:
  - Confirm procedural material grain and diffuse coloration survive baking.
  - Confirm contact shadows and ambient occlusion are preserved.
  - Document any residual specular or reflection discrepancies.

## Baked Workflow Status
An external static-courtyard exercise completed source-preserving preparation, a mixed texture/vertex-light bake, three paired camera views, GLB extension checks and browser interaction checks. Image error improved over the earlier unbaked viewer and visual review found no blocking defects. Physical-phone performance and dynamic relighting were not tested. These results are not a substitute for running acceptance checks on the next task.

## Character Rigging and Capture Acceptance

The character-focused skill is [`character_rigging_mocap.md`](../skills/character_rigging_mocap.md). Repository tests check its document contract and routing, not GLB assets or camera operation; all execution evidence remains outside this repository.

- Verify the approved motion abstraction before bone count or IK choices. Rejected articulation is not repaired merely by passing numeric tests.
- Reload the rigged asset and check weights, inverse-bind recovery, actual vertex deformation and intended attachment connectivity. Inspect fixed and intermediate poses from several views, including the entire render chain.
- Test synthetic coordinate/mirror/confidence cases and mock cancellation/late-result cleanup independently.
- Exercise a real detector with a provenance-checked positive fixture through the controller, mapper and reloaded mesh. An empty-frame smoke alone does not test this nonempty path.
- Build from clean source under the intended static base and verify required model/WASM/Worker resources without ignored workstation caches.
- Keep authorized live-camera behavior, named-device performance and user approval separate from fixture or structural checks.
- For a declared whole-flap motion model, test that ignored elbow landmarks cannot alter output/calibration while shoulder/wrist inputs remain fixed, and that the intended rigid region retains shape under shoulder sweeps. This is not a universal rigid-limb requirement for soft characters.
- Check representative joint-limit combinations as well as named presets. State which sampled vertices, fields and angles were examined rather than calling finite tests a complete collision proof.
