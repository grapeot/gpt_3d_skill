# Shareable HTML model delivery

Use this workflow for the router's default model handoff or when the user requests a single HTML file that a friend can download and open in a desktop browser. Respect a requested alternative format and reference-photo exclusions. Keep generated files and reusable project-specific packagers in the external task workspace.

## Comparison and interaction

- On a wide screen, show the supplied reference photo(s) beside the model. Label them `输入 · 原始照片` and `输出 · 3D 模型`, adapting the language to the task. For multiple input photos, use a compact selector or thumbnails and preserve access to each.
- Clicking a photo opens its full composition in a larger view, with a visible close button and Escape support. On a narrow screen, use a small reference thumbnail or collapsible panel without obscuring the model, title, or controls.
- Use the actual supplied images, with orientation corrected and optional display-size compression. Keep the originals intact in the task workspace. Do not replace the input photo with a generated illustration or a model render. Record any resized display copies accurately in the source manifest.
- Provide drag-to-orbit, zoom, front/back, reset, and optional auto-rotation. Derive camera framing and near/far limits from the current model bounds; do not reuse another project's fixed coordinates. Resize the renderer and camera to the actual canvas container, especially when a photo panel changes its width.
- Reuse the approved viewer's materials, lighting, and camera presentation where available. Keep a brief visible note about inferred surfaces when the model reconstructs a single photo. If no reference image exists, use a model-only layout.

## Offline packaging approach

Keep editable viewer sources and a reproducible build command in the task workspace. Preserve an existing project structure rather than requiring a particular folder layout. Use the following approach or another that meets the same standalone-file contract:

1. Export a GLB with its textures and buffers embedded. Inspect its JSON chunk for external buffer/image URIs. Include any required decoder code and WASM bytes locally, or choose an export that does not require external Draco/KTX2/Meshopt decoders. Preserve the authoritative source model.
2. Bundle Three.js, its controls/loaders, and the viewer entry point into an inline classic script, for example with esbuild using `bundle: true`, `format: 'iife'`, `platform: 'browser'`, `write: false`, and `legalComments: 'inline'`. Remove runtime import maps and external module tags from the share artifact. Dependencies installed for building are not recipient requirements.
3. Embed GLB bytes as base64 in a non-executable script element, for example `<script type="application/octet-stream" id="embedded-model">…</script>`. Decode them to an ArrayBuffer and use `GLTFLoader.parse`, rather than fetching a neighboring `.glb` file:

   ```js
   const element = document.querySelector('#embedded-model');
   const binary = atob(element.textContent.trim());
   const bytes = new Uint8Array(binary.length);
   for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
   element.remove();
   loader.parse(bytes.buffer, '', onModelLoaded, onModelError);
   ```

4. Embed every reference image as a data URL and inline CSS and any other runtime assets. Share the thumbnail's image data with the expanded view rather than repeating the same large base64 payload unnecessarily. Avoid external fonts and environment-map requests. If the viewer uses an environment map, embed it or generate the environment in the browser.
5. Escape `</script` inside generated JavaScript before inserting it into HTML, and use replacement callbacks when injecting generated bundles or base64 strings. This prevents script termination and replacement-token corruption.
6. Keep any model-download button functional by generating a Blob URL from the embedded bytes. Remove download links for files that are not included. Handle viewer initialization and model errors visibly instead of leaving a permanent loading message. Preserve required third-party license notices in the bundle.

Local module imports and `fetch('./model.glb')` can fail under `file://`; a viewer that only works over localhost is not the required share artifact. If retaining a separate development `viewer/index.html`, make direct local opening route to the generated share file or show a clear link to it. The share file itself must contain everything it needs.

## Verify proportionally to the change

Fast iteration is the default. Preserve the offline and input/output contract without turning every revision into a full browser test suite.

- Every build: check the GLB structure and absence of external textures/buffers or unavailable decoders, embedded source photos, bundled runtime, and the hashes/identity of the current assets. Fail visibly if required input photos or model assets are missing.
- First share viewer or changes to loading/bundling: do one targeted smoke pass on the final standalone HTML, preferably opened from an isolated folder using `file://`. Check that the actual input photo and model render and that no runtime errors or unintended external resources occur. Do not imply `file://` or offline mode was tested when only localhost was available.
- Layout, photo, or interaction changes: inspect one relevant screenshot and exercise only the affected behavior (for example photo enlargement/close). Check a narrow layout only when its rules changed or a clipping concern exists. Avoid repeatedly testing unrelated controls or camera angles.
- Geometry/material-only revisions with the same verified viewer: rebuild, verify current embedded assets, and rely on the model preview already reviewed. Skip another browser pass unless a concrete concern justifies it.
- A full isolated/offline, desktop/mobile, all-controls regression is optional for explicit final-release QA, viewer infrastructure replacement, or a demonstrated regression. It is not a gate for every rapid iteration.

Save concise evidence and state what was actually checked. Fix missing resources and loading failures before handoff; do not keep testing after the relevant checks pass.

## Handoff

Link the actual absolute path to `<project>-share.html`, report its approximate size, and explain that the recipient downloads it and opens it in a desktop browser. If relevant, explain that chat-app file previews may not execute HTML and that a hosted link is more suitable for phone-only viewing. Generate the local file automatically; publish or send it only when the user requests that action. Reuse this local artifact as a static website entry point if hosting is later requested.
