import { overlapsCollider } from './movement.js';

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function finiteNumber(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(`${label} must be a finite number`);
  }
  return value;
}

function finitePositive(value, label) {
  const n = finiteNumber(value, label);
  if (n <= 0) fail(`${label} must be greater than 0`);
  return n;
}

function vecN(value, length, label) {
  if (!Array.isArray(value) || value.length !== length) {
    fail(`${label} must be an array of ${length} numbers`);
  }
  return value.map((item, index) => finiteNumber(item, `${label}[${index}]`));
}

function unitChannel(value, label) {
  const n = finiteNumber(value, label);
  if (n < 0 || n > 1) fail(`${label} must be between 0 and 1`);
  return n;
}

export function assertRelativeAssetPath(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    fail(`${label} must be a non-empty relative path`);
  }
  const trimmed = value.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('\\')) {
    fail(`${label} must be relative to scene.json, not a site-root path`);
  }
  if (trimmed.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    fail(`${label} must be relative to scene.json, not a remote URL`);
  }
  return trimmed;
}

export function resolveAssetUrl(assetPath, sceneUrl) {
  const relative = assertRelativeAssetPath(assetPath, 'asset path');
  const base = typeof sceneUrl === 'string' ? sceneUrl : String(sceneUrl);
  return new URL(relative, base).href;
}

export function sceneJsonUrl(baseUrl, originHref) {
  const origin = typeof originHref === 'string' ? originHref : String(originHref);
  const base = new URL(baseUrl || '/', origin);
  return new URL('scene.json', base);
}

export function validateColliders(raw) {
  if (!Array.isArray(raw)) fail('colliders must be an array');
  return raw.map((item, index) => {
    if (!isObject(item)) fail(`colliders[${index}] must be an object`);
    if (typeof item.id !== 'string' || !item.id.trim()) {
      fail(`colliders[${index}].id must be a non-empty string`);
    }
    if (item.type === 'aabb') {
      const minX = finiteNumber(item.minX, `colliders[${index}].minX`);
      const maxX = finiteNumber(item.maxX, `colliders[${index}].maxX`);
      const minZ = finiteNumber(item.minZ, `colliders[${index}].minZ`);
      const maxZ = finiteNumber(item.maxZ, `colliders[${index}].maxZ`);
      if (minX > maxX || minZ > maxZ) {
        fail(`colliders[${index}] AABB dimensions are inverted`);
      }
      return { id: item.id.trim(), type: 'aabb', minX, maxX, minZ, maxZ };
    }
    if (item.type === 'cylinder') {
      return {
        id: item.id.trim(),
        type: 'cylinder',
        x: finiteNumber(item.x, `colliders[${index}].x`),
        z: finiteNumber(item.z, `colliders[${index}].z`),
        radius: finitePositive(item.radius, `colliders[${index}].radius`),
      };
    }
    fail(`colliders[${index}].type must be "aabb" or "cylinder"`);
    return null;
  });
}

export function assertSpawnValid(player, colliders) {
  const [x, , z] = player.spawn;
  const [cx, cz] = player.bounds.center;
  const dist = Math.hypot(x - cx, z - cz);
  const maxR = player.bounds.radius - player.radius;
  if (dist > maxR + 1e-8) {
    fail('Spawn is outside the walk bounds');
  }
  for (const collider of colliders) {
    if (overlapsCollider(x, z, collider, player.radius)) {
      fail(`Spawn overlaps collider ${collider.id}`);
    }
  }
}

export function validateConfig(raw) {
  if (!isObject(raw)) fail('scene.json must be an object');
  if (raw.schemaVersion !== 1) fail('schemaVersion must be 1');
  if (typeof raw.title !== 'string' || !raw.title.trim()) fail('title must be a non-empty string');
  if (typeof raw.subtitle !== 'string' || !raw.subtitle.trim()) fail('subtitle must be a non-empty string');
  if (!isObject(raw.scene)) fail('scene must be an object');
  if (raw.scene.mode !== 'demo' && raw.scene.mode !== 'model') {
    fail('scene.mode must be "demo" or "model"');
  }
  if (raw.scene.lighting !== 'realtime' && raw.scene.lighting !== 'baked') {
    fail('scene.lighting must be "realtime" or "baked"');
  }
  const backgroundSrgb = vecN(raw.scene.backgroundSrgb, 3, 'scene.backgroundSrgb').map((n, i) => (
    unitChannel(n, `scene.backgroundSrgb[${i}]`)
  ));
  let modelUrl = null;
  let collidersUrl = null;
  if (raw.scene.mode === 'model') {
    modelUrl = assertRelativeAssetPath(raw.scene.modelUrl, 'scene.modelUrl');
    collidersUrl = assertRelativeAssetPath(raw.scene.collidersUrl, 'scene.collidersUrl');
  }

  if (!isObject(raw.player)) fail('player must be an object');
  const spawn = vecN(raw.player.spawn, 3, 'player.spawn');
  const yaw = finiteNumber(raw.player.yaw, 'player.yaw');
  const pitch = finiteNumber(raw.player.pitch, 'player.pitch');
  const speed = finitePositive(raw.player.speed, 'player.speed');
  const radius = finitePositive(raw.player.radius, 'player.radius');
  if (!isObject(raw.player.bounds)) fail('player.bounds must be an object');
  const center = vecN(raw.player.bounds.center, 2, 'player.bounds.center');
  const boundsRadius = finitePositive(raw.player.bounds.radius, 'player.bounds.radius');
  if (boundsRadius <= radius) fail('player.bounds.radius must be greater than player.radius');

  if (!isObject(raw.camera)) fail('camera must be an object');
  const fov = finitePositive(raw.camera.fov, 'camera.fov');
  if (fov >= 180) fail('camera.fov must be less than 180');
  const near = finitePositive(raw.camera.near, 'camera.near');
  const far = finitePositive(raw.camera.far, 'camera.far');
  if (far <= near) fail('camera.far must be greater than camera.near');

  if (!isObject(raw.overview)) fail('overview must be an object');
  const target = vecN(raw.overview.target, 3, 'overview.target');
  const position = vecN(raw.overview.position, 3, 'overview.position');
  const minDistance = finitePositive(raw.overview.minDistance, 'overview.minDistance');
  const maxDistance = finitePositive(raw.overview.maxDistance, 'overview.maxDistance');
  if (maxDistance < minDistance) fail('overview.maxDistance must be >= overview.minDistance');

  if (!isObject(raw.quality)) fail('quality must be an object');
  const maxPixelRatio = finitePositive(raw.quality.maxPixelRatio, 'quality.maxPixelRatio');

  return {
    schemaVersion: 1,
    title: raw.title.trim(),
    subtitle: raw.subtitle.trim(),
    scene: {
      mode: raw.scene.mode,
      modelUrl,
      collidersUrl,
      lighting: raw.scene.lighting,
      backgroundSrgb,
    },
    player: {
      spawn,
      yaw,
      pitch,
      speed,
      radius,
      bounds: { center, radius: boundsRadius },
    },
    camera: { fov, near, far },
    overview: { target, position, minDistance, maxDistance },
    quality: { maxPixelRatio },
  };
}
