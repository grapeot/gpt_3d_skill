import { expect, test } from '@playwright/test';
import { getState, waitReady } from './helpers.mjs';

test('default demo renders a generated sample scene', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await expect(page.locator('#subtitle')).toHaveText('Generated sample scene');
  await expect(page.locator('#title')).toHaveText('3D Walkthrough');
  const state = await getState(page);
  expect(state.sceneMode).toBe('demo');
  expect(state.lighting).toBe('realtime');
  expect(state.ready).toBe(true);
  expect(state.drawCalls).toBeGreaterThan(0);
  expect(state.triangles).toBeGreaterThan(0);
  expect(state.colliderCount).toBeGreaterThan(0);
  const pixel = await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => {
    const canvas = document.querySelector('#view');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const sample = new Uint8Array(4);
    gl.readPixels(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, sample);
    resolve([...sample]);
  })));
  expect(pixel[3]).toBeGreaterThan(0);
  expect(pixel.slice(0, 3).some((channel) => channel > 8)).toBe(true);
  await page.screenshot({ path: 'test-results/demo.png' });
});
