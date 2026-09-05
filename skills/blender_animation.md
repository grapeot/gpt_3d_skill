# Blender Cinematic Animation (`blender_animation`)

Type: Workflow. Updated: 2026-09-05. Observed runtime: Blender 5.1.2 and FFmpeg; task frame rate and duration remain user-defined.

## Goal
Choreograph, keyframe, and render multi-stage architectural animations and cinematic breakdowns in Blender, producing frame-accurate image sequences and verified, decoded video deliverables using FFmpeg.

## Boundaries
- **Task Workspace Boundary**: All rendered PNG sequences, intermediate blend files, encoded MP4 videos, and verification logs belong strictly in external task workspaces outside this skill repository.
- **Render Sequence First**: Always render animation frames to individual PNG image files before video encoding. Never render directly to video formats in Blender to preserve resumability across interruptions.
- **Authorization Boundary**: Delivery channels, email recipients, CC lists, and external publishing destinations require explicit user authorization. Do not hardcode delivery policies into public skills.
- **Storyboard Adaptability**: Example choreographies (such as orbit sweeps or exploded views) illustrate sequencing; user updates and specifications supersede any default timeline assumptions.
- **Cost Benchmarking**: Benchmark render times on a short sequence of sample frames before committing to full high-resolution rendering. Never promise arbitrary 4K renders without prior benchmarking.

## Acceptance Criteria
- **Render Sequence Completeness**: Enumerate the exact expected indices, open every frame and verify dimensions; a file count alone cannot detect gaps, duplicate names from different versions, or corrupt images.
- **Stream Decode Verification**: Video encoded with FFmpeg decodes cleanly without bitstream errors:
  ```bash
  ffmpeg -v error -i output.mp4 -f null -
  ```
- **Stream Specification Integrity**: `ffprobe` confirms expected dimensions, frame rate, duration, and color space matching project specifications:
  ```bash
  ffprobe -v error -show_entries stream=width,height,r_frame_rate,nb_frames output.mp4
  ```
- **Frame Provenance**: Report whether frames were individually rendered or interpolated. Inspect motion segments in a real video; identical frames during an intentional hold are valid, and differing noise hashes do not prove motion.
- **Rest Pose Validation**: Geometry returns precisely to original rest coordinates and transforms at the conclusion of assembly stages.
- **Frustum Clearance**: Camera maintains intentional framing throughout motion paths, with zero unintended clipping through geometry or ground planes.

## Resources
- **Blender CLI (`bpy`)**: Headless rendering and keyframe animation scripting:
  ```bash
  blender -b scene.blend -s 1 -e 240 -a
  ```
- **FFmpeg & ffprobe**: Video encoding, stream inspection, and stream decode verification.
- **Python Virtual Environment**: uv-managed virtual environment (`.venv`) for animation orchestration and validation scripts.

## Output Specification
Task workspaces should contain the following structured deliverables:
- `animate_scene.py`: Script defining keyframes, constraints, and camera motion paths.
- `frames/`: Directory containing sequentially numbered PNG files (`frame_0001.png` .. `frame_NNNN.png`).
- `output.mp4`: Final encoded H.264/HEVC MP4 video file.
- `render_benchmark.json`: Measured render time per frame and estimated batch cost.
- `verification.log`: Output from `ffmpeg` stream decode check and `ffprobe` stream metadata inspection.

## High-Value Guidance

### 1. Multi-Stage Storyboard Example
An illustrative architectural showcase may be staged in modular phases:
1. *Initial Orbit*: 90-degree rotational camera sweep establishing spatial context.
2. *Exploded View*: Staggered outward and upward translation of structural components.
3. *Mid-Explosion Orbit*: 180-degree sweep revealing interior layout and joinery.
4. *Assembly Sequence*: Coordinated reverse translation restoring structural integrity.
5. *Foundation Elevation*: 90-degree orbit while raising the base structure.
6. *Staged Prop Entry*: Staggered arrival of environmental elements (e.g., foliage, lanterns) descending from above frame during an additional 180-degree orbit.
7. *Hero Showcase*: Final 180-degree beauty orbit highlighting finished scene.

### 2. Resumable Rendering and Versioning
- Whenever scene geometry, lighting, or animation curves change, increment the output directory prefix (e.g., `frames_v2/`).
- Never mix newly rendered frames with older iterations in the same folder.
- When resuming an interrupted render, check the highest consecutive frame index rendered and resume from `index + 1`.

### 3. Transform Parenting Mathematics
When dynamically parenting objects to control rigs or empties during animation:
- Synchronize the parent's world matrix prior to computing inverse transformations.
- Preserve the child object's world matrix:
  ```python
   # Preserve the source pose while changing the hierarchy.
   world = child_obj.matrix_world.copy()
   bpy.context.view_layer.update()
   child_obj.parent = parent_obj
   child_obj.matrix_parent_inverse = parent_obj.matrix_world.inverted()
   child_obj.matrix_world = world
   bpy.context.view_layer.update()
  ```
- Verify every child against its source world matrix rather than inspecting only parent empty positions.

### 4. Continuous Motion Verification
- Contact-sheet JPEG galleries cannot substitute for video playback. Static sheets obscure velocity issues, awkward easing, and temporal jitter.
- Review rendered MP4 videos in continuous playback to evaluate motion fluidity.

### 5. Standard Video Encoding Pipeline
Convert the verified PNG sequence to high-quality MP4 using standard parameters:
```bash
ffmpeg -y -framerate 60 -i frames/frame_%04d.png \
  -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p \
  -movflags +faststart output.mp4
```

### 6. Motion Validation
Frame hashes can flag accidental duplicate files but cannot certify animation. Check authored trajectories, frame index coverage and continuous video. For a falling object, verify that it is visibly above its destination during the clip, descends over a measurable interval, and reaches its source rest transform. Do not treat a contact sheet as that evidence.

## Observed Pitfalls
These pitfalls reflect empirical failures observed during actual animation runs:
- **Transform Doubling from Matrix Basis**:
  - *Symptom*: Applying `parent.inverse @ old_world` while preserving the existing `matrix_basis` doubles child transforms upon parenting.
  - *Fix*: Preserve the child's world matrix, synchronize the parent's matrix world before inversion, and verify child world matrices.
- **Negative Explosion Subterranean Clipping**:
  - *Symptom*: Applying negative Z offsets during exploded-view animations buries foundation stones beneath opaque ground planes.
  - *Fix*: Constrain explosion vectors to positive vertical displacements and outward radial vectors.
- **Monolithic Wall Obscuration**:
  - *Symptom*: Solid monolithic wall blocks appear as unreadable cubes when exploded, hiding interior architectural features.
  - *Fix*: Model thin wall shells so structural partitions remain readable when separated.
- **Intermediate Keyframe Frustum Clipping**:
  - *Symptom*: Checking camera framing solely at start and end keyframes misses geometry clipping during intermediate orbital curves.
  - *Fix*: Sample camera frustum clearance across intermediate frames after updating the dependency graph (`depsgraph.update()`).
- **Unnatural Object Emergence**:
  - *Symptom*: Scaling objects into existence from scale 0 looks artificial and breaks architectural weight.
  - *Fix*: Position objects above the frame and animate them visibly descending into place with cubic deceleration and staggered arrival times.
- **Offscreen Entry vs Frustum Clipping**:
  - *Symptom*: Intentional offscreen entry flagged incorrectly as accidental frustum clipping.
  - *Fix*: Distinguish objects animated into frame from structural objects that inadvertently breach the camera frustum boundary.

## General Constraints and Future Risks
- **No Universal Frame Rates or Durations**: Adapt duration and frame rate (e.g., 24, 30, or 60 fps) to task needs rather than assuming 60fps is a universal mandate.
- **Render Resources**: Measure memory use and frame time; retain resumable frame outputs if the renderer needs to be restarted.
- **Motion Blur Dependencies**: If motion blur is enabled, ensure intermediate vertex velocity vectors evaluate cleanly across modifier stacks.
