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
  if (typeof raw.title !== 'string' || !raw.title.trim()) fail('title must be a non-empty string');
  if (!isObject(raw.scene)) fail('scene must be an object');
  const backgroundSrgb = vecN(raw.scene.backgroundSrgb, 3, 'scene.backgroundSrgb').map((n, i) => (
    unitChannel(n, `scene.backgroundSrgb[${i}]`)
  ));
  const modelUrl = assertRelativeAssetPath(raw.scene.modelUrl, 'scene.modelUrl');
  const collidersUrl = assertRelativeAssetPath(raw.scene.collidersUrl, 'scene.collidersUrl');

  if (!isObject(raw.player)) fail('player must be an object');
  const spawn = vecN(raw.player.spawn, 3, 'player.spawn');
  const radius = 0.35;
  if (!isObject(raw.player.bounds)) fail('player.bounds must be an object');
  const center = vecN(raw.player.bounds.center, 2, 'player.bounds.center');
  const boundsRadius = finitePositive(raw.player.bounds.radius, 'player.bounds.radius');
  if (boundsRadius <= radius) fail('player.bounds.radius must be greater than player.radius');

  if (!isObject(raw.overview)) fail('overview must be an object');
  const target = vecN(raw.overview.target, 3, 'overview.target');
  const position = vecN(raw.overview.position, 3, 'overview.position');

  return {
    title: raw.title.trim(),
    scene: {
      modelUrl,
      collidersUrl,
      backgroundSrgb,
    },
    player: {
      spawn,
      yaw: Math.atan2(spawn[0] - target[0], spawn[2] - target[2]),
      pitch: 0,
      speed: 3,
      radius,
      bounds: { center, radius: boundsRadius },
    },
    camera: { fov: 65, near: 0.05, far: Math.max(200, boundsRadius * 5) },
    overview: { target, position, minDistance: 4, maxDistance: Math.max(30, boundsRadius * 8) },
  };
}
