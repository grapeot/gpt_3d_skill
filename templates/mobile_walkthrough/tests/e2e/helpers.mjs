import { test as base } from '@playwright/test';
import { buildBoxGlb, modelScene } from './glb.mjs';
import { TEST_COLLIDERS } from '../colliders.mjs';

export const test = base.extend({
  page: async ({ page }, use) => {
    await fulfillJson(page, '**/scene.json', modelScene);
    await fulfillGlb(page, '**/assets/scene.glb', buildBoxGlb());
    await fulfillJson(page, '**/assets/colliders.json', TEST_COLLIDERS);
    await use(page);
  },
});

export async function waitReady(page) {
  await page.waitForFunction(() => {
    const state = window.__walkthrough?.getState();
    return state?.ready === true && state.drawCalls > 0 && state.triangles > 0;
  });
}

export async function waitError(page) {
  await page.waitForFunction(() => {
    const status = document.querySelector('#status');
    return status && !status.classList.contains('hidden') && status.dataset.state === 'error';
  });
}

export function getState(page) {
  return page.evaluate(() => window.__walkthrough.getState());
}

export async function mockPointerLock(page, mode) {
  await page.addInitScript((lockMode) => {
    const proto = HTMLElement.prototype;
    if (lockMode === 'missing') {
      proto.requestPointerLock = undefined;
    } else if (lockMode === 'throw') {
      proto.requestPointerLock = function requestPointerLock() {
        throw new Error('pointer lock denied');
      };
    } else if (lockMode === 'reject') {
      proto.requestPointerLock = function requestPointerLock() {
        return Promise.reject(new Error('pointer lock denied'));
      };
    } else if (lockMode === 'error') {
      proto.requestPointerLock = function requestPointerLock() {
        queueMicrotask(() => document.dispatchEvent(new Event('pointerlockerror')));
      };
    }
  }, mode);
}

export async function fulfillJson(page, match, body) {
  await page.route(match, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  });
}

export async function fulfillGlb(page, match, bytes) {
  await page.route(match, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'model/gltf-binary',
      body: Buffer.from(bytes),
    });
  });
}

export async function dispatchPointer(page, selector, type, pointerId, clientX, clientY) {
  await page.evaluate(({ selector, type, pointerId, clientX, clientY }) => {
    const el = document.querySelector(selector);
    el.dispatchEvent(new PointerEvent(type, {
      pointerId,
      pointerType: 'touch',
      clientX,
      clientY,
      bubbles: true,
      cancelable: true,
      view: window,
    }));
  }, { selector, type, pointerId, clientX, clientY });
}
