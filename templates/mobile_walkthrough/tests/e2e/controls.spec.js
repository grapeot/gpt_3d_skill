import { expect, test } from '@playwright/test';
import { getState, mockPointerLock, waitReady } from './helpers.mjs';

async function waitMoved(page, axis, compare, start) {
  await page.waitForFunction(
    ({ axis, compare, start }) => {
      const value = window.__walkthrough.getState().position[axis];
      return compare === 'less' ? value < start - 0.08 : value > start + 0.08;
    },
    { axis, compare, start },
  );
}

test.describe('pointer lock fallback', () => {
  for (const mode of ['missing', 'throw', 'reject', 'error']) {
    test(`WASD works when pointer lock ${mode}`, async ({ page }) => {
      await mockPointerLock(page, mode);
      await page.goto('/');
      await waitReady(page);
      await page.locator('#view').click();
      await page.waitForFunction(() => {
        const state = window.__walkthrough.getState();
        return state.desktopActive && state.fallbackLook;
      });
      const before = await getState(page);
      expect(before.fallbackLook).toBe(true);
      expect(before.desktopActive).toBe(true);
      await page.keyboard.down('w');
      await waitMoved(page, 2, 'less', before.position[2]);
      await page.keyboard.up('w');
    });
  }
});

test('arrow keys move and Esc stops walking while a key is held', async ({ page }) => {
  await mockPointerLock(page, 'missing');
  await page.goto('/');
  await waitReady(page);
  await page.locator('#view').click();
  await page.waitForFunction(() => window.__walkthrough.getState().desktopActive);
  const start = await getState(page);
  await page.keyboard.down('ArrowRight');
  await waitMoved(page, 0, 'greater', start.position[0]);
  await page.keyboard.press('Escape');
  const paused = await getState(page);
  expect(paused.desktopActive).toBe(false);
  expect(paused.keys.right).toBe(false);
  await page.waitForTimeout(180);
  const later = await getState(page);
  expect(Math.abs(later.position[0] - paused.position[0])).toBeLessThan(0.001);
  expect(Math.abs(later.position[2] - paused.position[2])).toBeLessThan(0.001);
});

test('blur pauses movement even if a walk key is held', async ({ page }) => {
  await mockPointerLock(page, 'missing');
  await page.goto('/');
  await waitReady(page);
  await page.locator('#view').click();
  await page.waitForFunction(() => window.__walkthrough.getState().desktopActive);
  const start = await getState(page);
  await page.keyboard.down('w');
  await waitMoved(page, 2, 'less', start.position[2]);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const paused = await getState(page);
  expect(paused.desktopActive).toBe(false);
  expect(paused.keys.forward).toBe(false);
  await page.waitForTimeout(180);
  const later = await getState(page);
  expect(Math.abs(later.position[2] - paused.position[2])).toBeLessThan(0.001);
});

test('a delayed pointer lock grant cannot undo Escape', async ({ page }) => {
  await page.addInitScript(() => {
    let element = null;
    Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: () => element });
    HTMLCanvasElement.prototype.requestPointerLock = () => new Promise(() => {});
    document.exitPointerLock = () => { element = null; document.dispatchEvent(new Event('pointerlockchange')); };
    window.grantDelayedTestLock = () => {
      element = document.querySelector('#view');
      document.dispatchEvent(new Event('pointerlockchange'));
    };
  });
  await page.goto('/');
  await waitReady(page);
  await page.locator('#btn-walk').click();
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.grantDelayedTestLock());
  const state = await getState(page);
  expect(state.locked).toBe(false);
  expect(state.desktopActive).toBe(false);
});

test('drag look works in fallback and reset returns to spawn', async ({ page }) => {
  await mockPointerLock(page, 'missing');
  await page.goto('/');
  await waitReady(page);
  await page.locator('#view').click();
  await page.waitForFunction(() => window.__walkthrough.getState().desktopActive);
  const before = await getState(page);
  const box = await page.locator('#view').boundingBox();
  const x = box.x + box.width * 0.6;
  const y = box.y + box.height * 0.4;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 80, y);
  await page.mouse.up();
  const looked = await getState(page);
  expect(Math.abs(looked.yaw - before.yaw)).toBeGreaterThan(0.05);
  await page.keyboard.down('w');
  await waitMoved(page, 2, 'less', looked.position[2]);
  await page.keyboard.up('w');
  await page.locator('#btn-reset').click();
  const reset = await getState(page);
  expect(reset.position[0]).toBeCloseTo(0, 5);
  expect(reset.position[2]).toBeCloseTo(5, 5);
  expect(reset.yaw).toBeCloseTo(0, 5);
});

test('overview can be entered and returned to walk', async ({ page }) => {
  await page.goto('/');
  await waitReady(page);
  await page.locator('#btn-overview').click();
  expect((await getState(page)).mode).toBe('overview');
  await page.locator('#btn-walk').click();
  expect((await getState(page)).mode).toBe('walk');
});

test('capsule buttons are not treated as look gestures', async ({ page }) => {
  await mockPointerLock(page, 'missing');
  await page.goto('/');
  await waitReady(page);
  await page.locator('#view').click();
  const before = await getState(page);
  const box = await page.locator('#btn-overview').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2);
  await page.mouse.up();
  const afterDrag = await getState(page);
  expect(Math.abs(afterDrag.yaw - before.yaw)).toBeLessThan(0.001);
  await page.locator('#btn-overview').click();
  expect((await getState(page)).mode).toBe('overview');
});
