# Vanilla Three.js Mobile Walkthrough Template

A minimal, dependency-light vanilla Three.js + Vite walkthrough template for mobile touch and desktop browsers (no React, no native app wrapper, no external CDN, no analytics, no bundled user models).

## Setup & Workflow
Copy this template directory into a dedicated external task workspace.
- **Node**: Node 22+
- **Install**: `npm ci`
- **Dev**: `npm run dev` (binds to loopback by default; expose to LAN only with authorization)
- **Unit Tests**: `npm test`
- **E2E Tests**:
  ```bash
  npx playwright install chromium
  npm run test:e2e
  ```
- **Build**: `npm run build`
- **Subpath Build**: `BASE_PATH=/example/viewer/ npm run build` (serve `dist/` at the matching subpath)

The default `public/scene.json` starts in `demo` mode and builds a small generated courtyard in code. The UI subtitle is **Generated sample scene**.

## Configuration (`public/scene.json`)
Edit `public/scene.json` to customize scene, player, camera, and controls:
```json
{
  "schemaVersion": 1,
  "title": "3D Walkthrough",
  "subtitle": "Generated sample scene",
  "scene": {
    "mode": "model",
    "modelUrl": "./assets/scene.glb",
    "collidersUrl": "./assets/colliders.json",
    "lighting": "baked",
    "backgroundSrgb": [0.9, 0.9, 0.95]
  },
  "player": {
    "spawn": [0, 1.6, 0],
    "yaw": 0,
    "pitch": 0,
    "speed": 3.0,
    "radius": 0.35,
    "bounds": { "center": [0, 0], "radius": 25.0 }
  },
  "camera": { "fov": 75, "near": 0.1, "far": 1000 },
  "overview": {
    "target": [0, 0, 0],
    "position": [0, 20, 30],
    "minDistance": 5,
    "maxDistance": 80
  },
  "quality": { "maxPixelRatio": 2 }
}
```

### Conventions & Specs
- **Coordinates**: glTF / Three.js standard Y-up (meters). Yaw and pitch in radians. Camera FOV in vertical degrees.
- **Asset paths**: `modelUrl` and `collidersUrl` resolve relative to `scene.json`, including nested `BASE_PATH` deployments. Site-root paths such as `/model.glb` are rejected.
- **Scene Modes**:
  - `demo`: Generates procedural floor and geometry directly in code (not a placeholder file masquerading as a model).
  - `model`: Requires both `modelUrl` and `collidersUrl`. No implicit fallback to demo scene if asset loading fails; errors are surfaced directly.
- **Lighting**:
  - `baked`: Expects `KHR_materials_unlit` display-referred sRGB glTF assets. Configures renderer with `NoToneMapping` and does not add runtime lights. A lit PBR model in baked mode shows an error instead of a black frame.
  - `realtime`: PBR lighting with directional and ambient illumination.
- **Colliders**: JSON array containing 2D horizontal collision shapes against player radius:
  - AABB: `{"type": "aabb", "id": "wall_1", "minX": -5, "maxX": -4.8, "minZ": -10, "maxZ": 10}`
  - Cylinder: `{"type": "cylinder", "id": "col_1", "x": 2, "z": 3, "radius": 0.4}`
  - An empty array `[]` represents a valid open scene without obstacles.
- **Spawn**: Must be a finite point inside `player.bounds` and outside every collider.

Read-only E2E state is exposed as `window.__walkthrough.getState()`.

## Controls & Limits
- **Controls**: Desktop pointer-lock look + WASD / arrow-key walk (with fallback drag-to-look when pointer-lock is unavailable, throws, or rejects), mobile virtual joystick (walk) + right-side touch drag (look), pause on Esc or window blur / visibility change, Reset view button (to spawn), Overview orbit camera toggle. Overview framing scales for portrait and can return to walk.
- **Limits**: Flat-ground walkthrough only. No stairs, jump mechanics, navmesh pathfinding, heavy physics engines, or native shell wrappers.

## Test Coverage
- `npm test`: configuration schema validation, relative URL / `BASE_PATH` resolution, facing and diagonal movement, non-zero bound centers, AABB / cylinder separation, and large-step substeps.
- `npm run test:e2e`: Playwright coverage for generated GLB loading, embedded sRGB texture pixels, failed model/config errors, pointer-lock fallback and delayed-grant handling, mobile gestures, and a production nested-path build. Fixtures are generated in code, not downloaded user assets.
