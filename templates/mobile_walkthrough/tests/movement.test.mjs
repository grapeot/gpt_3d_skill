import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  clampDelta,
  clampPitch,
  clampToBounds,
  lookVector,
  resolveWalk,
  wishDirection,
  wishFromAxes,
} from '../src/movement.js';

const bounds = { center: [0, 0], radius: 8 };
const radius = 0.35;

test('yaw 0 faces web -z and walks forward along -z', () => {
  const look = lookVector(0);
  assert.ok(Math.abs(look.x) < 1e-12);
  assert.equal(look.z, -1);
  const wish = wishDirection({ forward: true, back: false, left: false, right: false }, 0);
  assert.ok(Math.abs(wish.x) < 1e-12);
  assert.ok(Math.abs(wish.z + 1) < 1e-12);
});

test('strafe right at yaw 0 is +x and backpedal is +z', () => {
  const right = wishDirection({ forward: false, back: false, left: false, right: true }, 0);
  assert.ok(right.x > 0.99);
  assert.ok(Math.abs(right.z) < 1e-12);
  const back = wishDirection({ forward: false, back: true, left: false, right: false }, 0);
  assert.ok(back.z > 0.99);
});

test('diagonal input is normalized and analog magnitudes below 1 are kept', () => {
  const diag = wishFromAxes(1, 1, 0);
  assert.ok(Math.abs(Math.hypot(diag.x, diag.z) - 1) < 1e-12);
  const half = wishFromAxes(0.5, 0, 0);
  assert.ok(Math.abs(half.z + 0.5) < 1e-12);
  const long = wishFromAxes(3, 4, 0);
  assert.ok(Math.abs(Math.hypot(long.x, long.z) - 1) < 1e-12);
});

test('AABB blocks a large step instead of tunneling', () => {
  const wall = [{ id: 'wall', type: 'aabb', minX: -0.05, maxX: 0.05, minZ: -2, maxZ: 2 }];
  const next = resolveWalk({ x: -2, z: 0 }, 1, 0, 10, wall, radius, bounds);
  assert.ok(next.x <= -0.05 - radius + 1e-6);
  assert.ok(next.x < 0);
});

test('cylinder blocks and a gap stays walkable', () => {
  const posts = [
    { id: 'left', type: 'cylinder', x: -1.2, z: 0, radius: 0.25 },
    { id: 'right', type: 'cylinder', x: 1.2, z: 0, radius: 0.25 },
  ];
  const blocked = resolveWalk({ x: -1.2, z: 2 }, 0, -1, 4, posts, radius, bounds);
  assert.ok(blocked.z > 0.25);
  const through = resolveWalk({ x: 0, z: 2 }, 0, -1, 4, posts, radius, bounds);
  assert.ok(through.z < 0);
  assert.ok(Math.abs(through.x) < 0.2);
});

test('bounds use a non-zero center', () => {
  const shifted = { center: [10, 4], radius: 3 };
  const next = resolveWalk({ x: 10, z: 4 }, 0, 1, 20, [], radius, shifted);
  const dist = Math.hypot(next.x - 10, next.z - 4);
  assert.ok(dist <= 3 - radius + 1e-9);
  const edge = clampToBounds(10, 20, radius, shifted);
  assert.ok(Math.abs(Math.hypot(edge.x - 10, edge.z - 4) - (3 - radius)) < 1e-9);
});

test('zero input does not move and delta is clamped', () => {
  const next = resolveWalk({ x: 1.25, z: 4.5 }, 0, 0, 4, [], radius, bounds);
  assert.deepEqual(next, { x: 1.25, z: 4.5 });
  assert.equal(clampDelta(0.2), 0.05);
  assert.equal(clampDelta(0.01), 0.01);
});

test('pitch is clamped', () => {
  assert.equal(clampPitch(2), 1.12);
  assert.equal(clampPitch(-3), -1.12);
  assert.equal(clampPitch(0.2), 0.2);
});
