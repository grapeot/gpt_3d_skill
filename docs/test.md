# Test and Verification Strategy

## Overview
Verification in `gpt_3d_skill` is divided into two distinct operational categories:
1. **In-Repository Offline Tests**: Automated document integrity, link validation, and repository hygiene tests.
2. **External Workspace Execution Checks**: Opt-in runtime validations covering Blender headless execution, video decode streams, browser interactions, and visual fidelity comparisons.

## In-Repository Offline Tests

Template source is included in privacy and relative-link checks. Dependencies, browser reports and generated fixtures are excluded from publication. The standalone template has Node unit tests and Playwright acceptance tests, including an actual generated GLB and a production build under a nested URL path; no Blender installation is needed for those tests.

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

### 1. Blender Modeling Acceptance
- **Headless Execution**: Execute generation scripts using `blender -b -P <script.py>`.
- **Log Inspection**: Inspect standard output and error logs directly for Python tracebacks. Do not rely solely on process exit codes, as Blender execution wrappers may exit with status 0 despite unhandled exceptions.
- **Asset Integrity**: Open generated `.blend` headlessly and verify all textures and resources are packed (`bpy.ops.file.pack_all()`).
- **Surface Normals & Modifiers**: Inspect intended face orientation and shell thickness/offset together; verify that surface details are not accidentally buried. Open sheets can be intentional.
- **Multi-Angle Render Review**: Generate front, side, rear, and top isometric camera renders to verify elevation details and canopy clearance.

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
