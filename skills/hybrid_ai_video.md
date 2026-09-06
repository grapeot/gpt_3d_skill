# Hybrid AI Video (`hybrid_ai_video`)

Type: Workflow. Updated: 2026-09-06. Use for scripted character films combining authored 3D start frames, generated motion, and editorial sound. Runtime outputs belong in external task workspaces.

## Goal

Deliver short animated films through a hybrid pipeline combining 3D authored scenes with generative image-to-video (I2V) models. Authoring exact spatial layouts, character identity, materials, lighting, and instructional cross-sections belongs in 3D (such as Blender). Generative video supplies continuous organic acting, complex soft-body deformation, and motion nuance across pixels rather than geometric measurement truth. Editorial post-production owns shot selection, trimming, tempo, factual narration, sound design, and master assembly.

This skill establishes operational boundaries, API and budget safeguards, and distinct verification layers. A completed encode is not an artistic acceptance verdict; report unresolved visual, listening, or factual checks rather than claiming a publication-ready film.

## Boundaries

- Operational Scope: Workflow guidance, not an automated framework or executable client library. Use available tools and author task-specific orchestration only in the external task workspace.
- Script and Beat Authority: Maintain a script and storyboard beat structure throughout. Existing narration serves as a rough pacing guide; test load-bearing interactions (shaping, contact, pressing, not mere blinking) before locking narration or buying a generation batch. Validate footage, then finalize narration, edit, and audio mix.
- Spatial and Geometric Authority: 3D scenes are authoritative for authored geometry, not generated pixels. Generative video cannot prove clay volume conservation. Retain Blender animation for exact mechanical trajectories or quantitative geometry; complex character acting may favor I2V when manual animation cost outweighs its loss of control.
- Execution Environment: Keep task outputs, source media, prompts, and private resume state outside this skill repository. Preserve original scenes and earlier edits; modify working copies.
- Permissions and Authorizations: Spending approval, cloud upload, and publication are distinct boundaries requiring explicit user authorization. Active API access or catalog availability is not authorization to incur costs. Confirm the approved spending limit and billing route, including retries, TTS, reviews, and reserve. Use only source inputs the user has permission to upload and process.
- Managed Credentials: Use a user-authorized managed credential provider. Never extract tokens from developer sessions, harvest browser cookies, search authstores, or race multiple processes to refresh rotating tokens. Pause near expiry and let the credential owner handle refresh.
- State Serialization and Idempotency: Persist exclusive local attempt state and budget reservations before non-idempotent POST calls. Use a single ledger writer or serialized reservations. Ambiguous submissions must block automatic resubmission. Never issue a new POST to resume a known task.
- Network and Media Security: Download media only from approved HTTPS hosts, validating redirects too. Send no Bearer credentials on any CDN download, including the first request. Use signed URLs in memory; never retain them in logs, manifests, or repository files.
- Cost and Billing Distinctions: Raw provider usage ticks, public catalog estimates, and verified account debits are different evidence. A working token does not mean free generation or rule out extra credits and auto-topup charges.

## Core Philosophy and Division of Labor

A hybrid production divides responsibilities across three disciplines:

| Production Domain | Responsibility | Limit |
| :--- | :--- | :--- |
| **3D Authored Scene (Blender)** | Geometry, facial identity, materials, lighting, camera framing, and instructionally necessary cutaways. | Controls the input render, not every later generated frame. |
| **Generative I2V Engine** | Continuous acting, organic deformation, and motion complexity across short spans. | Not geometric measurement truth or persistent world state across shots. |
| **Editorial & Post-Production** | Sequence pacing, selective trimming, factual narration alignment, and unified sound. | Cannot substitute narration for a missing visual action. |

In the clay-film case, the user accepted the original static character but found the hand-authored Blender animation simple and PPT-like. The earlier animation did contain deformation, brush passes, and lid travel; it was not literally a slideshow. That feedback concerned this execution's acting, not Blender's overall animation capability.

Generative I2V can reduce the manual cost of complex acting, but the starting frame must make the intended motion possible. The pipeline is neither absolute audio-first nor video-first across all phases: retain the script while testing visual feasibility, then lock timing against usable footage.

## Shot Planning and Motion Affordances

- Single Core Action: One meaningful action per 5-10-second shot is a practical starting heuristic, not a fixed timing contract. Split distinct physical steps when they compete for attention.
- Start Frame Affordance: Render the action's opening pose, not its busiest middle or already-completed state. Leave visible travel gaps, room for motion, readable contact points, and sufficient source material for the intended transformation. Do not try to repair an unviable start pose with more adjectives.
- Temporal Dynamics in Prompts: Specify what changes, in which direction, over what interval, and how it settles. Avoid merely restating static attributes already visible in the image.
- Identity Preservation: Constraints on freckles, eyes, color, and motifs express intent, not guarantees. Inspect whether features stay attached to the same apparent surface regions, including during rotation and occlusion.
- Rotation and Hidden Surfaces: Establish whether the object rotates or only its support does. A face attached to a rotating object must disappear behind the silhouette and return on the same surface; its back must not acquire another face. Author a faceless rear reference when that surface matters. Use extra frame conditioning only if the selected endpoint supports it; otherwise split the action at a controlled orientation or change the motion rather than assuming a reference in the prompt becomes an input frame.
- Chaining Verification: For necessary continuity, use an inspected, accepted last frame as the next input. Record its parent clip and exact timestamp. An endpoint from a rejected whole clip needs its own acceptance; do not inherit the clip's flaws blindly.
- Re-anchoring: When chained shots accumulate identity, material, or geometry drift, return to an authored 3D render rather than propagating the drift.
- Selective Trimming vs. Regeneration: Trimming head or tail anomalies is valid only if the retained span preserves the promised action and leaves breathing room for narration. Missing core actions require revising the input or prompt, regenerating, or explicitly changing the beat.

## Worked Generation Prompt

This production prompt was used after changing the Blender input to expose a larger raised-lid gap. A saggar is the refractory protective container around the bowl; its educational cutaway keeps the contents visible.

```text
Cutaway view into the miniature electric kiln. The SMALL INNER semicircular
refractory saggar lid is visibly raised above the bowl, with a large open
vertical gap. Starting immediately, move ONLY this smaller inner lid straight
downward across the gap over 3 seconds until it rests on the matching rear
semicircular saggar wall. The big OUTER kiln roof and every brick must remain
completely still. Keep the absent front half absent: the bowl and its two eyes
remain visible through the existing cutaway. From 3 to 6 seconds the lid stays
at rest and the bowl gives a small relieved blink. Preserve all ceramic
geometry, freckles and face identity. Fixed camera, no new objects, no camera
zoom replacing the lid action, no smoke, no glowing face, no detached pieces,
no closing a solid wall in front of the bowl, no speech or music.
```

### Prompt Mechanics and Observed Limits

- **Start-Frame Setup:** The earlier input had a seated or nearly seated lid and produced weak motion. The revised 3D render provided a visible open vertical gap; the second candidate showed descent in chronological frame inspection.
- **Segmented Timing:** Allocates the opening interval to descent and the remainder to rest and a small expression, distinguishing the moving inner lid from the stationary outer kiln.
- **Negative Constraints:** Requests no camera movement replacing the action, added objects, or occlusion of the cutaway. Each constraint still needs visual verification.
- **Observed Limits:** The cutaway is a visual teaching convention, not a verified engineering schematic. Frame inspection supported visible travel, not exact mechanical tolerances or full-speed motion certification.

## Audio Editorial and Sound Design

- Narration & Script Timing: Generate per-beat TTS to keep revisions local. Use concrete, child-friendly language and a warm adult storyteller voice rather than baby talk. Verify teaching claims: no invented drying durations, proof of total air removal, or hot vessels taken out to cool rapidly in air. Shorten text rather than stretching weak footage or unnaturally rushing speech.
- Harmonic Score: Maintain a coherent motif, harmony, and energy arc instead of unrelated musical fragments. The case used an original 78 BPM C-Am-F-G score resolving to C, with mallets, plucked strings, piano harmonics, and three energy sections; this is an example, not a required recipe. Duck under speech with smooth attack and release.
- Foley & Cue Ledger: Align foley to the selected visual contact points after trims. Reviewers mistook musical accents near 15s and 30s for foley; the cue ledger showed no separate foley there. The score accent was softened instead of claiming a nonexistent effect had been moved.
- Native Audio Stripping: Inspect generated sound independently. In the case, audio reviewers reported incidental voices and mismatched music/effects, so all source tracks were discarded for one unified mix. Strip source audio when it conflicts; a prompt saying "no speech or music" is not a guarantee of silence.
- Temporal Truth: Narration and images must agree about whether an action is happening or already completed. The case still has an audit risk: cooling instructions play over an already-cooled bowl outside the kiln. Show cooling inside followed by a time skip, or use completed-state narration. These are proposed corrections, not fixes made to the source film.

## Generation API and Budget Safety

### Request Specification

The following xAI request shape was exercised in September 2026. Recheck current official model IDs, resolution options, limits, and pricing before authorized execution; these endpoints are not a generic contract for every provider.

Submit to `POST https://api.x.ai/v1/videos/generations` with a Bearer credential supplied in memory by the authorized provider and `Content-Type: application/json`. Illustrative body, not a ready-to-run request:

```json
{
  "model": "grok-imagine-video-1.5",
  "prompt": "Use the full reviewed shot prompt here.",
  "image": {"url": "data:image/jpeg;base64,<approved_base64_jpeg>"},
  "duration": 6,
  "resolution": "1080p",
  "aspect_ratio": "16:9"
}
```

`image.url` can carry the approved JPEG as a data URI without public image hosting; a local filesystem path is not a usable URL. Save the returned `request_id` immediately in private resume state, then poll `GET https://api.x.ai/v1/videos/{id}`. A model catalog response alone does not prove generation permission; even a small paid capability probe needs authorization.

### Polling Lifecycle and Status Handling

| Response / State | Required Operational Action |
| :--- | :--- |
| Observed HTTP `202`, status `pending` | Poll the same task with bounded waits and a deadline, honoring provider retry guidance. |
| Observed HTTP `200`, status `done`, `video.url` | Download via approved HTTPS without Bearer; verify the actual stream and record a local asset reference. |
| `failed`, `expired`, or missing expected completion fields | Preserve state and sanitized error details; do not label the job successful or silently create a replacement. |
| Near-expiry guard or HTTP `401` | Pause and return credential recovery to the owner. Resume stored IDs when authorized credentials are available. |
| HTTP `403`, `429`, or quota rejection | Stop this run and report the category; no alternate key, identity, or model bypass. |
| Ambiguous POST timeout or missing task ID | Retain the attempt and budget reservation; block automatic resubmission pending owner/provider reconciliation. |
| Poll deadline or interrupted worker with a stored ID | Resume GET polling, not POST submission. |

Persist both attempt state and a conservative budget reservation before POST. Use exclusive attempt creation and one ledger writer or serialized reservations; separate workers must not race to spend the same reserve. Keep HTTP status and sanitized provider error categories, but redact credentials and signed URLs from diagnostic bodies.

### Credential & Billing Architecture

- Distinct Authorization Paths: Official developer examples use a team API key and its billing account. Owner-managed subscription OAuth completed all 13 video jobs in the case, but this is observed access, not a stable official third-party OAuth integration contract or guarantee of future model access.
- Owner-Controlled Refresh: Use the host credential provider's documented interface, not its private storage implementation. In the run, a near-expiry guard paused two submitted jobs; a later external credential update allowed polling to continue using stored IDs. The updater's identity was not established. Multiple generation processes must not compete for token rotation.
- Accounting vs. Account Debit: The 13 video jobs had a dated public-catalog estimate of $22.13. Reported `cost_in_usd_ticks` summed to 221300000000 once per unique job, numerically consistent at 1e10 ticks/USD. Neither figure establishes subscriber allowance debit, extra-credit use, auto-topup, or actual cash billing.
- Current Budget: Obtain an approved spending envelope for the chosen route; do not treat a previous agent's working ceiling as a user-specified budget. Track video attempts, TTS, and paid reviews separately, including failed or ambiguous requests. Repeated polls must not multiply a job's reported usage.

## Review Methodology and Verification Layers

Verifying hybrid films requires distinct evidence, not one generic PASS:

| Layer | Verification Technique | Scope and Limitations |
| :--- | :--- | :--- |
| **Technical Stream Probe** | `ffprobe` and full `ffmpeg` decode. | Dimensions, fps, frame count, duration, codecs, and decode integrity; exclude attached cover art. |
| **Visual Triage** | Chronological contact sheets, such as 4 fps. | Useful for spotting drift and missing actions; not sufficient evidence of fluid motion or sync. |
| **Full-Speed Audiovisual Playback** | Continuous playback at the actual timeline rate with sound. | Inspect action direction, contact, identity, velocity, transitions, and voice-to-action synchronization. |
| **Acoustic & Semantic QA** | Final encoded loudness/peak measurement, listening, and narrative audit. | Metering does not prove intelligibility; model responses do not prove they heard the input. |

Record the actual review method, coverage, reviewer, and artifact version. A model's timestamped findings are advisory: check against the clip and cue ledger. If available tools cannot play or analyze the final audiovisual artifact, mark those acceptance items blocked or unreviewed and hand them off explicitly.

## Acceptance Criteria

- **Editorial & Temporal Integrity:** The edit fulfills script beats with visible complete actions. Face, motifs, prop identity, and contact remain acceptable throughout chosen spans. Review full-speed transitions and factual timing; a correct isolated frame is not sufficient temporal truth.
- **Stream Geometry & Encoding:** `ffprobe` confirms actual dimensions, fps, duration, frame count, codecs, and project delivery specifications. Inspect before cropping or resizing; record every transformation and any upscaling/interpolation. Never label an upscale as native HD or blindly apply one run's crop to a different source.
- **Decode Verification:** `ffmpeg -v error -i master_film.mp4 -f null -` reports zero full-stream decode errors. This proves data integrity, not aesthetic quality or natural movement.
- **Audio & Final Mix:** Measure the final encoded mix against task-defined loudness and true-peak targets; verify intelligibility, balance, and contact timing through actual listening and audiovisual review of that version. HTTP success and audio token counts are not a listening pass.
- **Traceable Delivery:** Supply the artifacts below, with explicit technical results, visual/temporal coverage, final listening status, and unresolved factual or artistic concerns. A locally completed edit may be handed off with limitations; it must not be self-certified as fully accepted while required checks remain open.

## Output Specification

Production deliverables reside strictly within the external task workspace. Names below are illustrative, not a framework to create in this repository:

| Asset | Minimum Content |
| :--- | :--- |
| Edited `.mp4` | Final assembled film in the agreed dimensions, fps, codecs, and audio targets. |
| Source assets / scene references | Editable scene or stable scene reference, rendered start frames, input derivations, candidate clips, and local hashes for provenance. |
| Shot prompts and chosen trims | Exact submitted prompt, model/options, input reference, attempt reference, selected in/out times, decision and defect rationale. |
| Audio stems and cue ledger | Separate narration, score, and foley; TTS text/timing, score provenance, and action-aligned effect times. |
| Timeline | Source clip spans mapped to master start/end times and audio placement; explicit frame rate and total runtime. |
| Attempt ledger | Pre-POST reservations, attempt status, requested versus measured properties, estimate basis/date, and provider usage counted once per job. |
| QA manifest | Artifact version/hash, technical checks, review methods and coverage, timestamped defects, final listening status, factual/sync audit, and limitations. |

Keep real provider task IDs in private resume state, separate from shareable summaries. Never include credentials, signed URLs, private machine paths, account identifiers, or source media in public skill documentation. A task manifest is not automatically safe to publish.

## Observed Pitfalls

These observations describe one production, not guaranteed model behavior or established internal failure causes.

| Observed Defect | Mitigation / Remaining Limit |
| :--- | :--- |
| Lid was already seated or nearly seated and barely moved. | Re-rendered the start with an open gap and revised the prompt; chronological review showed descent. |
| Brush ferrule/handle split and bristles clipped. | Rejected the first attempt. A simpler continuous-contact prompt produced a usable retry, then a new late cup-handle/loop artifact required trimming to 0-4.5s. |
| Apricot floated upward before falling; another shot turned the wheel late. | Retained fruit descent at 2-7s and rim settling at 0-4s, preserving the needed actions and cut continuity rather than buying more attempts. |
| The viewer subsequently reported a second face during rotation after sampled review had accepted the clip. | Reopen temporal identity acceptance. Inspect the full turn, author explicit faceless rear geometry, and test compatible conditioning or split shots. The proposed correction was not verified at this skill revision. |
| Requested 1080p returned 1920x1088. | Cropped four rows top and bottom, then trimmed exact edit lengths. Cause was not established. |
| Cooling narration accompanied an already-cooled bowl outside. | Outstanding temporal audit risk, not a repaired source-film defect; revise the image sequence or narration's completed state. |
| Audio reviewer called music accents foley. | Checked actual cue records and softened the score accent rather than moving nonexistent foley. |
| Third audio review denied listening capability despite successful HTTP and 1390 input audio tokens. | No final listening PASS. Usage accounting can occur without useful analysis; actual cash attribution remains separate. |

### Case Evidence and Technical Auditing

- **Production Reference (September 2026):** A local 69.5-second clay-to-porcelain film used 11 selected shots from 13 generation jobs. Final output had 1668 frames at 24 fps, zero full-decode errors, and measured -16.04 LUFS / -1.43 dBTP. These are measured case values, not universal targets or proof of high artistic quality.
- **Observed Stream Discrepancies:** All 13 requested 1080p sources were 1920x1088 at 24 fps, approximately the requested duration plus one frame. A separate 1-second 480p probe returned 736x400, 24 fps, 25 frames, and 1.041667 seconds. Probe each future source rather than generalizing these observations across providers or resolutions.
- **Review Coverage:** Chronological 4 fps visual sheets were triage, not human full-speed playback. Two earlier actual-audio model analyses were advisory; the third denied capability after final minor softening. No human listening occurred, and final listening was not passed.
- **Residual Limits:** A small clay rim nub and approximate cutaway-lid geometry remained; quantitative volume conservation was unverified. The cooling narration/visual-state mismatch remains a quality audit risk. Frame truth, decode integrity, and token usage each leave different questions unanswered.

## Resources

- [Blender Modeling](blender_modeling.md): Author geometry, character identity, start poses, and cutaways.
- [Blender Animation](blender_animation.md): Exact camera paths, mechanical trajectories, and rendered motion.
- [3D Root Router](skill_gpt_3d.md): Shared workspace and authorization contracts.
- Blender, FFmpeg, and ffprobe: Scene authoring, stream inspection, trimming, mixing, and metering. Use the host's available audiovisual review tools and disclose their capability limits.
- Host credential-provider documentation: Approved credential access and owner-controlled refresh; no private OAuth implementation is bundled here.
- xAI I2V guide: https://docs.x.ai/developers/model-capabilities/video/image-to-video
- xAI REST video reference: https://docs.x.ai/developers/rest-api-reference/inference/videos
- Current pricing: https://docs.x.ai/developers/pricing
- Developer billing: https://docs.x.ai/console/billing
- Subscription terms and usage: https://docs.x.ai/grok/faq
