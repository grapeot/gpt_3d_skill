import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertRelativeAssetPath,
  resolveAssetUrl,
  sceneJsonUrl,
} from '../src/config.js';

test('resolves model and collider paths from scene.json', () => {
  const scene = 'http://127.0.0.1:5196/scene.json';
  assert.equal(
    resolveAssetUrl('./assets/scene.glb', scene),
    'http://127.0.0.1:5196/assets/scene.glb',
  );
  assert.equal(
    resolveAssetUrl('colliders.json', scene),
    'http://127.0.0.1:5196/colliders.json',
  );
});

test('keeps nested BASE_PATH when resolving relative assets', () => {
  const scene = 'http://127.0.0.1:5196/example/viewer/scene.json';
  assert.equal(
    resolveAssetUrl('./assets/scene.glb', scene),
    'http://127.0.0.1:5196/example/viewer/assets/scene.glb',
  );
  assert.equal(
    resolveAssetUrl('../shared/colliders.json', scene),
    'http://127.0.0.1:5196/example/shared/colliders.json',
  );
});

test('sceneJsonUrl uses Vite BASE_PATH rather than the page filename', () => {
  const url = sceneJsonUrl('/example/viewer/', 'http://127.0.0.1:5196/example/viewer/index.html');
  assert.equal(url.href, 'http://127.0.0.1:5196/example/viewer/scene.json');
  const root = sceneJsonUrl('/', 'http://127.0.0.1:5196/index.html');
  assert.equal(root.href, 'http://127.0.0.1:5196/scene.json');
});

test('rejects root and remote asset paths', () => {
  assert.throws(() => assertRelativeAssetPath('/model.glb', 'scene.modelUrl'), /site-root/);
  assert.throws(() => assertRelativeAssetPath('https://cdn.example.com/model.glb', 'scene.modelUrl'), /remote/);
  assert.throws(() => resolveAssetUrl('/model.glb', 'http://127.0.0.1:5196/example/viewer/scene.json'), /site-root/);
});
