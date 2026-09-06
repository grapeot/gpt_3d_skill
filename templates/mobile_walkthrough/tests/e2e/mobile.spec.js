import { expect } from '@playwright/test';
import { test, dispatchPointer, getState, waitReady } from './helpers.mjs';

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

async function joystickNudge(page, pointerId, nx, ny) {
  return page.evaluate(({ pointerId, nx, ny }) => {
    const el = document.querySelector('#joystick');
    const r = el.getBoundingClientRect();
    const clientX = r.left + r.width / 2 + nx * r.width * 0.3;
    const clientY = r.top + r.height / 2 + ny * r.height * 0.3;
    const opts = { pointerId, pointerType: 'touch', clientX, clientY, bubbles: true, cancelable: true, view: window };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new PointerEvent('pointermove', opts));
    return { clientX, clientY };
  }, { pointerId, nx, ny });
}

test('mobile joystick walks, look drag turns, and reset restores spawn', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await expect(page.locator('#joystick')).not.toHaveClass(/hidden/);
  const start = await getState(page);
  const forward = await joystickNudge(page, 21, 0, -0.8);
  await page.waitForFunction(() => window.__walkthrough.getState().joy.active === true);
  await page.waitForFunction((z) => window.__walkthrough.getState().position[2] < z - 0.08, start.position[2]);
  await dispatchPointer(page, '#joystick', 'pointerup', 21, forward.clientX, forward.clientY);
  const walked = await getState(page);
  expect(walked.joy.active).toBe(false);

  const view = await page.locator('#view').boundingBox();
  const lookX = view.x + view.width * 0.7;
  const lookY = view.y + view.height * 0.4;
  await dispatchPointer(page, '#view', 'pointerdown', 22, lookX, lookY);
  await dispatchPointer(page, '#view', 'pointermove', 22, lookX + 70, lookY);
  const looked = await getState(page);
  expect(Math.abs(looked.yaw - walked.yaw)).toBeGreaterThan(0.05);
  await dispatchPointer(page, '#view', 'pointerup', 22, lookX + 70, lookY);

  await page.locator('#btn-reset').click();
  const reset = await getState(page);
  expect(reset.position[0]).toBeCloseTo(0, 5);
  expect(reset.position[2]).toBeCloseTo(5, 5);
  expect(reset.yaw).toBeCloseTo(0, 5);
});

test('multi-touch move and look, then cancel clears input', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  const start = await getState(page);
  const forward = await joystickNudge(page, 31, 0, -0.8);
  const view = await page.locator('#view').boundingBox();
  const lookX = view.x + view.width * 0.72;
  const lookY = view.y + view.height * 0.35;
  await dispatchPointer(page, '#view', 'pointerdown', 32, lookX, lookY);
  await dispatchPointer(page, '#view', 'pointermove', 32, lookX + 60, lookY);
  await page.waitForFunction((z) => window.__walkthrough.getState().position[2] < z - 0.08, start.position[2]);
  const mid = await getState(page);
  expect(mid.joy.active).toBe(true);
  expect(Math.abs(mid.yaw - start.yaw)).toBeGreaterThan(0.04);
  await dispatchPointer(page, '#joystick', 'pointercancel', 31, forward.x, forward.y);
  await dispatchPointer(page, '#view', 'pointercancel', 32, lookX + 60, lookY);
  const cleared = await getState(page);
  expect(cleared.joy.active).toBe(false);
  expect(cleared.lookPointer).toBeNull();
  await page.waitForTimeout(160);
  const later = await getState(page);
  expect(Math.abs(later.position[2] - cleared.position[2])).toBeLessThan(0.001);
});

test('landscape still shows walk controls', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await waitReady(page);
  await expect(page.locator('#joystick')).not.toHaveClass(/hidden/);
  await expect(page.locator('#btn-walk')).toBeVisible();
  expect((await getState(page)).ready).toBe(true);
});
