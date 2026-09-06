# Character Rigging and Motion Capture (`character_rigging_mocap`)

Type: Workflow. Updated: 2026-09-05. Rig, browser and fixture checks are exercised in external task workspaces; live-device and user acceptance remain separate claims.

## Goal

Create a reference-faithful character that performs approved poses and, when requested, follows local camera motion. Deliver editable rig sources, a correctly deforming runtime asset, explicit failure handling, and evidence that supports the actual acceptance claim.

The target character's motion model takes precedence over the human capture skeleton. Use Blender or procedural authoring as appropriate; a browser-authored character does not require installing Blender. Preserve the master scene or generator-plus-rig configuration and export derivatives.

## Boundaries

- **Task Workspace Isolation**: Generators, references, capture fixtures, models, renders, checkpoints and applications belong in external task workspaces, never in this skill repository.
- **Motion Model Before Bone Count**: Establish intended visible articulation before adding joints. A stylized flipper may be one shoulder-driven appendage, not a two-link human arm. This is an appearance and control decision, not a claim about biological anatomy.
- **Privacy and Authorization**: Local capture is opt-in and video-only unless additional capture is requested. Do not open a personal camera, record, upload frames or publish assets as an automatic test. A camera-free demo should remain available when the character is loaded.
- **Reference Authority**: Separate official art, third-party mirrors of game assets, third-party drawings and unverified scans. Open the images; do not trust search captions or reviewer summaries alone. Redistribution requires permission or a suitable license.
- **Dynamic Asset Preservation**: Do not blindly apply static-scene joining or evaluated export operations that discard skinning. Pose-dependent self-shadow bakes are not valid for arbitrary deformation; surface-color textures can still be useful.
- **Honest Tracking Scope**: Monocular landmarks are estimates, not a depth sensor or verified room-space trajectory. Do not infer full-body, finger, facial, fast-turn or occlusion-proof capability from a body-pose API.

## Acceptance Criteria

1. **Approved Motion Model**: Record intended freedoms, silhouette constraints and source landmarks deliberately ignored. Key poses demonstrate the chosen whole-flap, soft-appendage or articulated behavior before live mapping is accepted.
2. **Bind and Skin Integrity**: The rest mesh, bone axes, inverse binds and runtime conventions agree. Exported weights are finite, nonnegative and normalized, with valid indices and influence counts supported by the chosen runtime. Reload and compare rest recovery and actual posed vertices.
3. **Intended Attachment Integrity**: Where continuous skin is required, the body and appendage form a real connected surface with a nonzero attachment section and suitable blended weights. A single object name or merged buffer does not prove connectivity. Eyes, rigid accessories and deliberately modular joints may remain separate.
4. **Deforming Render Chain**: Surfaces, normals, outlines and shadow passes follow the same deformation after reload. Multi-angle and intermediate-pose checks show no unintended detachment, severe pinching or obvious intersection in the required motion range.
5. **Runtime Failure Semantics**: Character loading and detector initialization have distinct outcomes. Tracking failure leaves presets usable only if the character loaded; character failure disables dependent controls and offers model-only retry without starting a camera.
6. **Capture Lifecycle**: Capture through result consumption has bounded in-flight work. Late streams, frames and replies cannot reactivate a stopped session. Stop releases acquired tracks and workers; unavailable cancellation APIs are handled by disposing of late results.
7. **Clean Delivery and Claim Scope**: A clean source tree produces complete runtime assets under the intended static base path, or fails explicitly. Document checks, rig tests, mock capture, real detector fixtures, live-device tests and user approval are reported separately.

## Resources

- **Authoring**: Blender armatures/weights or task-local procedural geometry and rig generators. Use [`blender_modeling.md`](blender_modeling.md) for relevant source-authoring practices.
- **Runtime**: Three.js `SkinnedMesh`, `Skeleton`, glTF/GLB skin export and reload, or equivalent engine capabilities. Inspect installed APIs rather than assuming identical version behavior.
- **Capture**: `getUserMedia`, transferable image frames and Web Workers. MediaPipe Tasks Vision PoseLandmarker is an exercised example, not a required backend.
- **Verification**: A headless browser, deterministic pose replay, geometry inspection and actual multi-angle renders. Use [`blender_animation.md`](blender_animation.md) for requested video delivery and continuous-playback checks.
- **Static Environments**: [`web_walkthrough.md`](web_walkthrough.md) can supply surroundings and hosting guidance; its static baking/batching assumptions do not replace the character branch.
- **Primary References**: [Three.js SkinnedMesh](https://threejs.org/docs/pages/SkinnedMesh.html), [MediaPipe Web guide](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js), [camera API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [Vite static deployment](https://vite.dev/guide/static-deploy).

## Output Specification

Preserve the task's existing layout. Names below are illustrative roles, not mandatory folders:

- Editable source scene or generator, plus motion-model and rig configuration.
- Rigged runtime asset and, if requested, a minimal local browser application.
- Reference/source manifest, approved pose definitions, camera settings, asset/config revisions and before/after renders.
- Rig/geometry assertions, synthetic replays, authorized fixture provenance, lifecycle tests and clean-build evidence.
- A concise review record distinguishing fixes, rejected candidates, unverified claims and remaining limitations.

Illustrative checkpoint, not an execution result from this repository:

```json
{
  "motion_model": "shoulder_flap",
  "source_revision": "example-r2",
  "pose": "raise",
  "view": "side",
  "observed": "attachment pinches during the shoulder sweep",
  "change": "broaden junction weights without adding an elbow actuator",
  "other_views_checked": ["front", "rear"],
  "evidence_level": "synthetic_pose_replay",
  "remaining": ["authorized live capture and user approval pending"]
}
```

## High-Value Guidance

### Target Character Motion Model First

Choose the motion abstraction from references and user direction, not from the available detector output. Human shoulder/elbow/wrist landmarks do not mandate visible shoulder/elbow/wrist joints on a cartoon. A whole flipper can use shoulder-to-wrist direction while deliberately ignoring elbow bend as an independent actuator. A soft appendage can distribute deformation; an articulated limb can use joint angles or IK.

Helper bones are acceptable only when they preserve the intended visible behavior. If a user rejects bent tubes or fists in favor of a whole shoulder-driven flap, reduce unwanted articulation rather than adding more joints to fit the same wrong abstraction. First verify a small pose set with capture disconnected.

For a whole-appendage contract, bone count alone is insufficient. Check the weights and shape behavior of the intended rigid region, for example by comparing internal vertex-pair distances through a sweep while allowing the defined shoulder transition to flex. Test source-joint independence separately: hold shoulder/wrist inputs fixed while varying, deleting or corrupting elbow landmarks. This proves mapper invariance, not that a vision estimator's shoulder/wrist estimates cannot change during real elbow motion.

### Rigging, Rest Binds and Topology

A static action-pose mesh is not automatically a usable neutral asset. Select an appropriate bind pose and validate recovery; A/T poses are common options, not mathematical requirements. Changing the asset's authored proportions is allowed when justified, but regenerate compatible binds and keep limb lengths fixed during ordinary retargeting.

For continuous skin, smooth unions and vertex welding are possible techniques, not mandatory implementations. Verify the actual index graph and attachment area where relevant, then inspect poses. Welding, connected-component counts and Euler characteristics do not certify attractive deformation or absence of self-intersection.

Avoid abrupt weight ownership at a geometric boundary. Inspect mixed shoulder/torso and distal weights, section collapse, edge changes and head-side drag. Rest-pose choice can reduce the maximum rotation away from the bind state. Preserve rigid face attachments where soft weights would distort identity.

Generator, controller, limits, diagnostic tools and asset metadata need one consistent rig definition. When cloning or exporting skins, preserve skeleton references and inverse binds; inspect the consumer's reloaded mesh rather than only the in-memory authoring object.

When the motion architecture changes, identify the model and bind configuration in asset metadata and reject mismatched assets visibly. Replace obsolete motion-specific tests while keeping unrelated lifecycle/resource tests. Preserve historical snapshots, but make incompatible old diagnostic tools refuse current assets rather than returning meaningless results.

### Contact and Pose Diagnosis

Use IK only when the chosen motion model needs it. A high target near maximum reach can straighten an articulated limb; lowering it may make the solver happier while changing the gesture from holding the head to holding the cheeks. Compare pose-only changes with regenerated asset changes before deciding which layer is responsible.

Where contact matters, check the actual posed distal surface in the target's coordinate frame, not just a wrist center outside an approximate ellipsoid. Distinguish true distal vertices from blended head/shoulder vertices. Record the tested poses and sampling domain; vertex and section checks are not exhaustive collision detection. Recheck other gestures and combined head/torso poses.

### Reference and Temporal Review

Fix comparison projection, view, pose and lighting after calibration. Use uniform scale and translation for paired images; do not stretch references to fit or normalize head/arm comparisons by unrelated lifted feet and shadows. Label pose and style conflicts between drawings instead of silently creating different anatomy per camera.

Render, read, identify specific differences, make a bounded change, and rerender the target plus regression views. Save revisions without overwriting prior evidence. When continuous motion matters, inspect replay or video as well as contact sheets. Round counts and numeric tests are budgets/evidence, not user acceptance.

### Local Capture, Coordinates and Confidence

For MediaPipe's Web PoseLandmarker example, use `VIDEO` for video frames and explicitly select the supported pose count and outputs. Image coordinates are normalized ratios; correct aspect ratio before distances and angles. World coordinates are hip-relative monocular estimates, even when expressed in meters.

Keep detector anatomical labels, preview mirroring, screen-side behavior and parent-local bone rotations separate and tested. Calibrate coordinate frames; user calibration and asset bind pose are different concepts. Do not copy Euler angles across Blender Z-up, Three.js Y-up or detector coordinates without conversion.

Validate finite values and confidence per relevant channel, guard zero-length vectors, and respect timestamp order. Use time-based smoothing, continuous valid calibration and hysteresis for intent switches. Brief loss can hold a stable value before returning safely to idle; one occluded arm must not invalidate the other. Re-entry should not apply stale filter history as a sudden jump.

### Worker and Session Lifecycle

Synchronous inference can block rendering. A Worker can help, but frame transfer, CPU/GPU delegates and browser compatibility require measurement. An exercised MediaPipe package needed a prebundled classic Worker for `importScripts` in both Vite dev and production; do not universalize that version-specific requirement. Ordinary Workers do not imply multi-threaded WASM or SharedArrayBuffer availability.

Keep at most one frame in flight across acquisition, transfer, inference and consumption. Prefer fresh work over a queue of old frames, and release transferables on success, error and cancellation. Session generations prevent late permission streams, initialization and replies from reviving a stopped capture session.

An outstanding browser permission prompt or synchronous inference may not be interruptible. Invalidate the session first, stop acquired tracks/workers, and close or discard late results. Hiding the preview is not stopping capture. Use either a verified fallback or a visible failure, not two concurrent detectors.

### Clean Static Hosting and Export Fidelity

Resolve models, Worker scripts, WASM and application assets through the intended non-root base. A standard clean build must acquire and verify fixed dependencies or fail, rather than succeeding because ignored assets happen to exist locally. Treat checksums as read-only trust input; do not rewrite a manifest to bless new download bytes.

Local inference does not mean zero networking: engine/model downloads and normal static requests still occur. Audit the exercised request paths for frame/landmark uploads. Keep consent, recording, publication and redistribution decisions explicit.

Preserve skins during export. Static surface-color bakes may be usable, but deformation-dependent lighting and self-shadows need appropriate runtime handling. Native toon/NPR shaders and outlines may require reconstruction in the consumer. Portable bones and base colors do not prove identical viewport appearance.

### Verification Methodology and Evidence Tiers

Report these as separate evidence levels rather than one pass/fail claim:

1. Documentation integrity checks in this repository.
2. External rig data, inverse-bind recovery, topology and posed-vertex checks.
3. Synthetic landmark replay for mapping, confidence and temporal edge cases.
4. Mock permission/capture tests for cancellation and cleanup.
5. Real detector empty-frame smoke tests for loading and API execution.
6. A provenance-checked positive fixture through the real detector, controller, mapper and reloaded mesh, with actual vertex displacement.
7. Authorized live-person and named-device tests for tracking behavior, latency and performance.
8. User approval of motion style and reference fidelity.

An empty detector smoke plus mapper unit tests leaves an interface gap. A positive static fixture closes more of that gap, but does not certify live motion, occlusion recovery, phones, physical latency or user taste. State exactly which cases ran.

## Observed Pitfalls

- **Humanoid Joint Bias**: A mechanically valid two-link flipper produced bent-tube and fist silhouettes that the user rejected. The target motion abstraction had to be reconsidered despite passing rig tests.
- **Bone Nodes Without a Usable Bind**: A static hands-on-head model lacked weights and a usable neutral authoring setup. Naming it neutral did not make it a deforming asset.
- **Pointed Detached Roots**: Independent leaf-shaped limbs touched the torso only visually. A genuinely continuous surface and blended attachment weights fixed the disconnection; merging object buffers alone would not.
- **Reach Optimization Changed the Gesture**: Moving a near-limit target down and outward enabled more bend but produced cheek-holding, not the intended high pose. The visual goal could not be replaced with a solver score.
- **Stale Diagnostic Limits**: A helper retained an old elbow limit while runtime and asset definitions changed. It rejected current valid candidates; sharing limits and recording asset hashes corrected the diagnosis.
- **Positive-Fixture Gap**: Real empty-frame inference and synthetic mapper tests both passed before a real positive fixture exercised the complete nonempty detector-to-vertex path.
- **Hidden Build State**: A clean build succeeded without ignored detector assets that happened to exist on the developer machine. Standard build preparation, fixed hashes and a clean-source browser test exposed and corrected the failure.
- **False Preset Availability**: Character GLB failure reused the detector-failure message claiming presets still worked. Separate model loading state and model-only retry were required.
- **Unverified Review Diagnosis**: A claimed neck seam was withdrawn after mesh inventory and fixed-view comparisons disproved the assumed topology. Reviewer agreement is not a substitute for reading primary evidence.
- **Weight Spill After Removing Elbows**: A single-shoulder candidate passed head clearance yet dragged the waist during wing sweeps. Its weight envelope extended into unintended lower-body vertices. Restricting that envelope, asserting that the protected lower body had no shoulder influence, and rechecking multi-angle poses corrected the drag; intended shoulder blending remained.
- **Preset Clearance Missed Range Intersections**: Named poses passed, but maximum shoulder rotation combined with head roll put distal vertices inside the head field. Sampling the declared limits and representative intermediate combinations exposed this. Tightening the actual rotation limit preserved the clearance threshold; finite sampling still did not prove continuous collision freedom.

## Evidence Status

After the initial documentation gate, the external character was rebuilt as a five-bone shoulder-flap rig with no elbow actuator. The exercised checks covered rest recovery, normalized weights, connected skin, rigid-region shape preservation across 26 pose/sweep samples, 67 sampled head-clearance cases, and unchanged output/calibration under altered elbow inputs. Clean builds and a real CPU detector positive fixture again drove actual vertices on the reloaded asset. These results describe the exercised implementation, not a universal bone-count prescription. Live personal-camera behavior, physical-device performance, continuous collision safety and user aesthetic approval remain unverified; official-art fidelity is not claimed as complete.
