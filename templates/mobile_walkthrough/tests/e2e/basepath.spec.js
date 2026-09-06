import { expect, test } from '@playwright/test';
import { getState, waitReady } from './helpers.mjs';
import { buildBoxGlb, modelScene } from './glb.mjs';
import { fulfillGlb, fulfillJson } from './helpers.mjs';

test('production build works under nested BASE_PATH', async ({ page }) => {
  const urls = [];
  page.on('request', (request) => urls.push(request.url()));
  await page.goto('./');
  await waitReady(page);
  const state = await getState(page);
  expect(state.ready).toBe(true);
  expect(state.sceneMode).toBe('demo');
  await expect(page.locator('#subtitle')).toHaveText('Generated sample scene');
  expect(urls.some((url) => url.includes('/example/viewer/scene.json'))).toBe(true);
  expect(urls.some((url) => /\/example\/viewer\/assets\/.+\.js/.test(url))).toBe(true);
  expect(urls.some((url) => /\/example\/viewer\/assets\/.+\.css/.test(url))).toBe(true);
  expect(urls.some((url) => /http:\/\/127\.0\.0\.1:5196\/scene\.json(?:\?|$)/.test(url))).toBe(false);
  expect(urls.some((url) => /http:\/\/127\.0\.0\.1:5196\/assets\//.test(url))).toBe(false);
});

test('nested build resolves real model and colliders beside its scene manifest', async ({ page }) => {
  await fulfillJson(page, '**/example/viewer/scene.json', modelScene);
  await fulfillGlb(page, '**/example/viewer/assets/scene.glb', buildBoxGlb({ unlit: true }));
  await fulfillJson(page, '**/example/viewer/assets/colliders.json', []);
  await page.goto('./');
  await waitReady(page);
  expect((await getState(page)).sceneMode).toBe('model');
  expect((await getState(page)).triangles).toBeGreaterThan(0);
});
