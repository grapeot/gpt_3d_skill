# Blender Compositing Plate (`blender_compositing_plate`)

Type: Workflow. Updated: 2026-09-26. Observed runtime: Blender 5.1 Cycles on macOS/Metal, driven headlessly by a coding agent, with a separate Python frame renderer compositing on top. Statements marked *untested* were not exercised in that run.

## Goal

Render a Blender layer (a "plate") that another renderer composites with, frame-accurately. Blender supplies what it does well: physically shaded surfaces, anisotropic sheen, reflections and folds. The other renderer, typically a code-driven procedural frame generator, owns the timeline, typography, particles and final composite. The two layers must agree on world coordinates, camera, timing, deformation and lighting closely enough that elements drawn by one visibly sit on surfaces rendered by the other.

Choose this workflow when exact timing or geometry must stay synchronized with music or with a procedural layer. Use [`blender_animation.md`](blender_animation.md) for a film rendered entirely in Blender, and [`hybrid_ai_video.md`](hybrid_ai_video.md) when the shot needs generated character acting rather than exact geometry.

## Boundaries

- **Task Workspace Isolation**: Plate scripts, camera files, shared deformation modules, frames and verification reports belong in external task workspaces, never in this skill repository.
- **One Timing Authority**: The compositing renderer's timeline exports every per-frame quantity Blender needs. Blender reads that file; it never re-derives easing, cue times or animated scalars.
- **One Geometry Authority**: Any deformation both layers depend on lives in one shared module imported by both renderers. A second implementation, even a careful port, is a synchronization bug waiting for a parameter change.
- **Plate Contents Only**: The plate contains only Blender-owned elements on the agreed background. Text, particles and highlights owned by the other layer are not baked in.
- **Simulation Is Not the Default**: Reserve cloth or soft-body simulation for motion that needs collisions or self-contact. Analytic deformation covers ordinary flag, drape and wave motion (see Guidance 6).
- **Agent Process Scope**: When a coding agent drives Blender, confine it to one task directory and forbid it from touching other processes (see Guidance 9).

## Acceptance Criteria

- **Camera Agreement on Every Frame**: For each rendered frame, known world points projected through Blender's evaluated camera match the shared pixel formula. The exercised threshold was 0.001 px; record the per-frame error in a report rather than checking only the first frame.
- **Exact Darkness Where Light Is Zero**: Frames or regions whose lighting formula evaluates to zero decode as exactly black, not merely dark.
- **Headroom**: Peak encoded value stays below the agreed ceiling (about 0.9 in the exercised run) so the other layer's highlights dominate after compositing.
- **Sequence Integrity**: Every expected index decodes with the agreed dimensions, bit depth and channel count. Follow the completeness and versioning rules in [`blender_animation.md`](blender_animation.md#2-resumable-rendering-and-versioning).
- **Geometry Coverage**: The deforming surface overscans every camera view with a positive margin, and no projected face folds over (for example, positive corner cross products for every quad). Check the full range, not only test frames.
- **Visual Review**: Test frames covering the key states were opened and iterated on before the full range; the final frame of the full render was opened too. Numeric checks do not replace looking.

## Resources

- **Blender Python (`bpy`) and Cycles**: Headless plate rendering; `bpy_extras.object_utils.world_to_camera_view` for projection checks.
- **NumPy**: Vectorized evaluation of the shared deformation and surface frame on every vertex.
- **Image decoding for verification**: Any reader that preserves 16-bit PNG values, such as OpenCV (`cv2.IMREAD_UNCHANGED`).
- **Code-driven procedural layer**: The public [procedural-video-frames skill](https://github.com/grapeot/opus-video-audio-skill/tree/master/skills/procedural-video-frames) in [opus-video-audio-skill](https://github.com/grapeot/opus-video-audio-skill) covers timeline-driven frame rendering and music sync on the other side of this contract.
- **Related skills**: [`blender_animation.md`](blender_animation.md) for render benchmarking, resumable sequences and FFmpeg encoding; the projection-state pitfall in [`web_walkthrough.md`](web_walkthrough.md#observed-pitfalls) for sensor-fit leakage; [`hybrid_ai_video.md`](hybrid_ai_video.md) for generated acting.

## Output Specification

Task workspaces should contain these roles. Names are illustrative; preserve an existing layout and report actual paths.

- `camera.json`: Per-frame camera and animated scalars, exported by the compositing renderer's timeline.
- `field.py` (shared module): Pure deformation functions imported by both renderers.
- `render_plate.py`: Headless plate script accepting a frame list or half-open range and an output directory:
  ```bash
  blender -b -P render_plate.py -- --frames 300,360,430 --out test_v1
  blender -b -P render_plate.py -- --frames 270:450 --out plate_v1
  ```
- `plate_vN/fNNNN.png`: Opaque 16-bit RGB frames, one directory per plate version.
- `render_report.json`: Per-frame camera projection checks, overscan margins and render time.
- `verify_plate.py` and `verification.json`: Independent decode of every expected frame with dimensions, bit depth, zero-light blackness, peak value, maximum camera error and timing.
- A short handoff note stating the coordinate mapping, pixel formula, colour contract and how to re-run each step.

## High-Value Guidance

### 1. One World Coordinate System

Define world units once and state how both renderers map them. A portrait film might use flag coordinates `(u, v)` with `v` pointing down the image, height `h` out of the surface, and a Blender mapping `(u, v, h) -> (u, -v, h)` with the camera above looking down `-Z`. Write the pixel formula the compositing layer uses, for example `x = (u - cu) / width * W + W/2` and `y = (v - cv) / width * W + H/2`, and make Blender satisfy that formula rather than the reverse.

Reflecting an axis flips face winding. Build faces so their normals point toward the camera after the reflection, and check one rendered frame for inverted shading.

### 2. Per-Frame Camera File

The timeline owner writes one entry per frame. Blender loads it and applies the entries verbatim:

```json
{"frame": 430, "cu": 8.1, "cv": 11.4, "width": 14.0, "rot_deg": 0.0,
 "light": 1.0, "sigma": 5.5}
```

Include every animated scalar that shades the plate (reveal amplitude, falloff width, wind strength). Use half-open frame ranges consistently in both renderers.

### 3. Orthographic Camera Matching

For a portrait frame, set `sensor_fit` to `VERTICAL` and `ortho_scale = width * H / W`, where `width` is the horizontal world extent. Place the camera above the centre. Assert agreement on every frame:

```python
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

W, H = 1080, 1920

def set_camera(scene, camera, entry, probes=((5, 5), (12, 4))):
    camera.data.type = 'ORTHO'
    camera.data.sensor_fit = 'VERTICAL'
    camera.data.ortho_scale = entry['width'] * H / W
    camera.location = (entry['cu'], -entry['cv'], 30)
    camera.rotation_euler = (0, 0, 0)
    bpy.context.view_layer.update()
    errors = []
    for u, v in probes:
        p = world_to_camera_view(scene, camera, Vector((u, -v, 0)))
        actual = (p.x * W, (1 - p.y) * H)
        expected = ((u - entry['cu']) / entry['width'] * W + W / 2,
                    (v - entry['cv']) / entry['width'] * W + H / 2)
        error = max(abs(a - b) for a, b in zip(actual, expected))
        assert error < 1e-3, (entry['frame'], actual, expected)
        errors.append(error)
    return errors
```

`world_to_camera_view` returns normalized coordinates with `y` up, hence `1 - p.y`. Orthographic XY alignment does not depend on surface height, so probes at height zero suffice for a straight-down camera; see Guidance 6 when height must move pixels. Landscape framing (`HORIZONTAL`, `ortho_scale = width`) and a nonzero `rot_deg` follow the same pattern but are *untested*; the exercised script asserted zero rotation.

### 4. Lighting as a Shared Formula

When a reveal, spotlight or fade must match across layers, express it as a formula of world position and per-frame scalars, such as an elliptical Gaussian `exp(-d^2 / (2 sigma^2)) * amplitude`. Implement it in Blender as a world-position shader multiplier: compute the mask from Geometry Position and use it as the factor of a Mix Shader between black emission and the full BSDF. Multiplying the entire closure, reflections included, makes zero amplitude exactly black; attenuating only lamp energy or base colour leaves specular and indirect light behind. Drive the per-frame scalars through Value nodes updated from the camera file. Set the world background strength to zero and add no extra vignette the other layer does not share.

### 5. Colour and Headroom Contract

Write 16-bit RGB PNG with the Standard view transform, look None, exposure 0 and gamma 1, so the encoding is plain sRGB. The compositor decodes with inverse sRGB, composites in linear light and re-encodes once. Keep the plate's peak below roughly 0.9 encoded so the other layer's highlights remain the brightest elements. A fixed Cycles seed with animated seed disabled was used together with denoising; *untested* whether an animated seed would read better or worse on a moving surface.

### 6. Deterministic Analytic Deformation

For cloth, flags and drapes in a plate, default to a pure function of material coordinates and time: `height(u, v, t)` and in-plane `displacement(u, v, t)`. Put it in one shared module imported by both Blender and the compositing renderer, so elements laid on the cloth ride it exactly.

- Evaluate every vertex from its rest material coordinates on every frame, never incrementally from the previous frame's positions. Any frame then renders independently, with no simulation cache, and test frames can be re-rendered at random.
- Keep UVs bound to rest coordinates so woven textures and bump detail follow the cloth.
- Resolve the shortest wavelength with dozens of vertices and enlarge the mesh until the overscan check passes on every camera view.
- Let one travelling wave dominate. Superposing two crossing wave systems of similar strength produced an interference pattern that read as latex rather than fabric.
- A straight-down orthographic camera cannot show height: waves only change shading. If the motion must read as displacement, add a height-dependent screen offset (a parallel-oblique mapping such as `world_of(u, v, t) = (u + dx, v + dy + k * height)`) inside the shared module, so both layers apply the same shift. A perspective camera is the alternative but is *untested* here and breaks the linear pixel formula.
- After any such mapping, check that projected faces never fold over across the full frame range.

### 7. True-Surface Shading Under Sheared Geometry

Once vertex positions are sheared or displaced for alignment, their geometric normals describe the mapped surface, not the physical one. Shade with the true surface: compute tangents from the unsheared positions `(u + dx, v + dy, h)`, take their cross product in the source frame before reflecting axes, and assign the result as custom split normals. UV-derived tangents inherit the shear too, so supply a matching tangent attribute to anisotropic materials.

```python
import numpy as np

def assign_true_frame(mesh, normal, tangent_u):
    """normal, tangent_u: (N, 3) unit vectors per vertex, already in Blender axes."""
    mesh.polygons.foreach_set('use_smooth', np.ones(len(mesh.polygons), dtype=bool))
    mesh.normals_split_custom_set_from_vertices(normal.tolist())
    attr = mesh.attributes.get('TrueTangent') or mesh.attributes.new(
        name='TrueTangent', type='FLOAT_VECTOR', domain='POINT')
    attr.data.foreach_set('vector', tangent_u.astype(np.float32).ravel())
    mesh.update()
```

Connect an Attribute node reading `TrueTangent` to the Principled BSDF `Tangent` input. Update both on every frame after moving vertices.

### 8. Test Frames, Then the Full Range

Pick test frames that cover the key states: zero light, mid-reveal, peak motion and the last frame. Render them, open them, fix what looks wrong and repeat before committing to the full range. Keep each iteration in its own directory. Benchmark per-frame cost from warm test frames; on Metal the first-ever kernel compilation took about two minutes and should not be mistaken for a hang or used as the per-frame estimate.

### 9. Driving Blender Through a Coding Agent

- Blender segfaulted on startup inside the agent's workspace-write sandbox and ran normally unsandboxed. Verify `blender -b --python-expr "import bpy"` in the agent's actual execution environment first; if the sandbox breaks Blender, run the agent unsandboxed, name the one directory it may write, and forbid touching other directories or processes in the prompt.
- Pass the user's chosen model explicitly (for Codex CLI, `codex exec -m <model>`) rather than relying on a default.
- The agent inherits host workspace rules. State that it must not call other agents and must write its own handoff notes; one run refused to write notes until told this.
- Once the agent's script works and is parameterized, re-render parameter changes yourself. Re-dispatching the agent for a colour or amplitude tweak costs far more than a direct render.

## Observed Pitfalls

- **Sandboxed Blender Crash**:
  - *Symptom*: Blender segfaulted on startup when launched from a coding agent's workspace-write sandbox.
  - *Fix*: Ran the agent unsandboxed with a single-directory scope and a no-other-processes rule; Blender then worked headlessly.
- **Metal Kernel Compilation Mistaken for Slowness**:
  - *Symptom*: The first test frame took about two minutes.
  - *Fix*: Subsequent frames took about 2.5 s each. Benchmark only warm frames.
- **Latex-Like Waves**:
  - *Symptom*: Two superposed crossing wave systems looked like stretched rubber, not silk.
  - *Fix*: One dominant travelling wave with weaker secondary variation.
- **Invisible Height**:
  - *Symptom*: Under a top-down orthographic camera, animated height changes only shading, so wave motion that must read as movement does not.
  - *Fix*: A shared parallel-oblique mapping moved pixels with height in both layers.
- **Sheared Shading**:
  - *Symptom*: After the oblique mapping, geometric normals and UV-derived tangents described the sheared surface.
  - *Fix*: Custom split normals and a tangent attribute computed from the true surface.
- **Early Look Problems Found Only by Opening Frames**:
  - *Symptom*: The first test frames had a large pale reflection and overly parallel folds, defects no numeric check was designed to catch.
  - *Fix*: Opened the frames, reduced and warmed the specular contribution, varied fold direction and spacing, and re-reviewed.
- **Agent Refused to Write Notes**:
  - *Symptom*: A delegated agent inherited host rules and declined to write its own handoff.
  - *Fix*: The prompt stated explicitly that it writes its own notes and calls no other agents.

## Evidence Status

Exercised once on a 180-frame, 1080x1920 portrait plate of a satin flag composited under a code-driven gold layer. All frames decoded as 16-bit RGB; every zero-light frame was exactly black; peak encoded value was about 0.61; maximum camera projection error was about 0.0001 px against the 0.001 px assertion. Cycles on Metal used adaptive sampling with 48 maximum samples and denoising, averaging about 2.5-2.9 s per frame after a roughly two-minute first compile. The analytic deformation, oblique mapping and true-surface normals ran through the full range with no folded projected faces and positive overscan. Landscape framing, camera rotation, perspective cameras, transparent (alpha) plates, true cloth simulation and other GPUs or operating systems are *untested*. Final artistic acceptance of the composite is a separate judgement from these checks.
