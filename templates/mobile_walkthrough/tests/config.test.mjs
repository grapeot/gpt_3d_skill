import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  assertSpawnValid,
  validateColliders,
  validateConfig,
} from '../src/config.js';
import { TEST_COLLIDERS } from './colliders.mjs';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));

function validConfig(overrides = {}) {
  return {
    title: '3D Walkthrough',
    scene: {
      modelUrl: './assets/scene.glb',
      collidersUrl: './assets/colliders.json',
      backgroundSrgb: [0.78, 0.82, 0.84],
      ...overrides.scene,
    },
    player: {
      spawn: [0, 1.6, 5],
      bounds: { center: [0, 0], radius: 8 },
      ...overrides.player,
    },
    overview: {
      target: [0, 0.4, 0],
      position: [8, 7, 11],
      ...overrides.overview,
    },
  };
}

test('default public/scene.json identifies the required asset files', () => {
  const raw = JSON.parse(readFileSync(join(root, 'public/scene.json'), 'utf8'));
  const config = validateConfig(raw);
  assert.equal(config.scene.modelUrl, './assets/scene.glb');
  assertSpawnValid(config.player, TEST_COLLIDERS);
});

test('requires relative asset paths', () => {
  const config = validateConfig(validConfig({
    scene: {
      backgroundSrgb: [0.5, 0.5, 0.5],
      modelUrl: './assets/scene.glb',
      collidersUrl: './assets/colliders.json',
    },
  }));
  assert.equal(config.scene.modelUrl, './assets/scene.glb');
  assert.equal(config.scene.collidersUrl, './assets/colliders.json');
});

test('rejects site-root model paths', () => {
  assert.throws(() => validateConfig(validConfig({
    scene: {
      backgroundSrgb: [0.5, 0.5, 0.5],
      modelUrl: '/model.glb',
      collidersUrl: './colliders.json',
    },
  })), /relative/);
});

test('rejects non-finite and inverted values', () => {
  assert.throws(() => validateConfig(validConfig({ player: { spawn: [0, 1.6, Infinity] } })), /finite/);
  assert.throws(() => validateConfig(validConfig({ player: { bounds: { center: [0,0], radius: -2 } } })), /greater/);
  assert.throws(() => validateConfig(validConfig({ scene: { backgroundSrgb: [0, 0, 2] } })), /between 0 and 1/);
  assert.throws(() => validateConfig({ ...validConfig(), title: '' }), /title/);
});

test('empty collider array is valid', () => {
  const colliders = validateColliders([]);
  assert.deepEqual(colliders, []);
  const config = validateConfig(validConfig());
  assertSpawnValid(config.player, colliders);
});

test('the documented collider example matches the runtime contract', () => {
  const example = JSON.parse(readFileSync(join(root, 'public/colliders.example.json'), 'utf8'));
  assert.deepEqual(validateColliders(example), example);
});

test('collider schema checks finite dimensions and radius', () => {
  const colliders = validateColliders([
    { id: 'wall', type: 'aabb', minX: -1, maxX: 1, minZ: -2, maxZ: 2 },
    { id: 'post', type: 'cylinder', x: 3, z: -1, radius: 0.4 },
  ]);
  assert.equal(colliders.length, 2);
  assert.throws(() => validateColliders([{ id: 'bad', type: 'aabb', minX: 2, maxX: 1, minZ: 0, maxZ: 1 }]), /inverted/);
  assert.throws(() => validateColliders([{ id: 'bad', type: 'cylinder', x: 0, z: 0, radius: 0 }]), /greater than 0/);
  assert.throws(() => validateColliders([{ id: 'bad', type: 'mesh' }]), /aabb.+cylinder/);
});

test('spawn must stay inside bounds and outside colliders', () => {
  const config = validateConfig(validConfig({
    player: { spawn: [0, 1.6, 0], bounds: { center: [0, 0], radius: 8 } },
  }));
  assert.throws(() => assertSpawnValid(config.player, TEST_COLLIDERS), /overlaps collider plinth/);
  const outside = validateConfig(validConfig({
    player: { spawn: [0, 1.6, 20], bounds: { center: [0, 0], radius: 8 } },
  }));
  assert.throws(() => assertSpawnValid(outside.player, []), /outside the walk bounds/);
});
