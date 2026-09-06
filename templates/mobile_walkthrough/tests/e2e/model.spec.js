import { expect, test } from '@playwright/test';
import { buildBoxGlb, modelScene } from './glb.mjs';
import { fulfillGlb, fulfillJson, getState, waitError, waitReady } from './helpers.mjs';

test('model mode loads a generated GLB through GLTFLoader', async ({ page }) => {
  const glb = buildBoxGlb({ unlit: true });
  await fulfillJson(page, '**/scene.json', modelScene);
  await fulfillGlb(page, '**/assets/scene.glb', glb);
  await fulfillJson(page, '**/assets/colliders.json', []);
  await page.goto('/');
  await waitReady(page);
  const state = await getState(page);
  expect(state.sceneMode).toBe('model');
  expect(state.lighting).toBe('baked');
  expect(state.ready).toBe(true);
  expect(state.triangles).toBeGreaterThan(0);
  expect(state.error).toBeNull();
});

test('baked lighting accepts unlit materials', async ({ page }) => {
  await fulfillJson(page, '**/scene.json', modelScene);
  await fulfillGlb(page, '**/assets/scene.glb', buildBoxGlb({ unlit: true }));
  await fulfillJson(page, '**/assets/colliders.json', []);
  await page.goto('/');
  await waitReady(page);
  expect((await getState(page)).lighting).toBe('baked');
});

test('baked sRGB texture survives the complete color pipeline', async ({ page }) => {
  const config = structuredClone(modelScene);
  config.player.spawn = [0, 0.5, 3];
  const expected = [64, 128, 192, 255];
  await fulfillJson(page, '**/scene.json', config);
  await fulfillGlb(page, '**/assets/scene.glb', buildBoxGlb({ unlit: true, textureColor: expected }));
  await fulfillJson(page, '**/assets/colliders.json', []);
  await page.goto('/');
  await waitReady(page);
  const pixel = await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => {
    const canvas = document.querySelector('#view');
    const gl = canvas.getContext('webgl2');
    const sample = new Uint8Array(4);
    gl.readPixels(Math.floor(canvas.width/2), Math.floor(canvas.height/2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, sample);
    resolve([...sample]);
  })));
  for (let channel = 0; channel < 4; channel++) expect(Math.abs(pixel[channel] - expected[channel])).toBeLessThanOrEqual(2);
  await expect(page.locator('#note')).toHaveCount(0);
});

test('baked lighting errors on lit PBR materials', async ({ page }) => {
  await fulfillJson(page, '**/scene.json', modelScene);
  await fulfillGlb(page, '**/assets/scene.glb', buildBoxGlb({ unlit: false }));
  await fulfillJson(page, '**/assets/colliders.json', []);
  await page.goto('/');
  await waitError(page);
  const state = await getState(page);
  expect(state.ready).toBe(false);
  expect(state.error).toMatch(/KHR_materials_unlit/);
  await expect(page.locator('#status-text')).toContainText('KHR_materials_unlit');
});

test('model load failure does not fall back to demo', async ({ page }) => {
  await fulfillJson(page, '**/scene.json', modelScene);
  await page.route('**/assets/scene.glb', async (route) => {
    await route.fulfill({ status: 404, body: 'missing' });
  });
  await fulfillJson(page, '**/assets/colliders.json', []);
  await page.goto('/');
  await waitError(page);
  const state = await getState(page);
  expect(state.ready).toBe(false);
  expect(state.sceneMode).toBe('model');
  await expect(page.locator('#status-text')).toContainText('Could not load model');
});

test('invalid configuration shows an error', async ({ page }) => {
  await fulfillJson(page, '**/scene.json', { ...modelScene, title: '' });
  await page.goto('/');
  await waitError(page);
  await expect(page.locator('#status-text')).toContainText('title');
  expect((await getState(page)).ready).toBe(false);
});
