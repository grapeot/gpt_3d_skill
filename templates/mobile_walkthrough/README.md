# Minimal Baked 3D Web Viewer

A baked-unlit Three.js + Vite viewer for mobile touch and desktop browsers. No runtime demo, alternate renderer, native wrapper, CDN or analytics.

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

Supply `public/assets/scene.glb` and `public/assets/colliders.json`, then edit `public/scene.json`. Missing assets show an error; there is no bundled demo fallback.

## Configuration (`public/scene.json`)
Only asset paths, background, spawn/walk bounds and overview pose are configured. Navigation uses fixed defaults; the initial heading faces `overview.target`.
```json
{
  "title": "3D Walkthrough",
  "scene": {
    "modelUrl": "./assets/scene.glb",
    "collidersUrl": "./assets/colliders.json",
    "backgroundSrgb": [0.9, 0.9, 0.95]
  },
  "player": {
    "spawn": [0, 1.6, 0],
    "bounds": { "center": [0, 0], "radius": 25.0 }
  },
  "overview": {
    "target": [0, 0, 0],
    "position": [0, 20, 30]
  }
}
```

### Conventions & Specs
- **Coordinates**: glTF / Three.js standard Y-up in meters. Walk-bound centers are horizontal `[x, z]` pairs.
- **Asset paths**: `modelUrl` and `collidersUrl` resolve relative to `scene.json`, including nested `BASE_PATH` deployments. Site-root paths such as `/model.glb` are rejected.
- **Assets**: Both model and collider paths are required. Models must use `KHR_materials_unlit` display-referred sRGB appearance. No runtime lights or tone mapping are added; lit PBR input is rejected.
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
