import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { copy } from './copy.js';
import {
  assertSpawnValid,
  resolveAssetUrl,
  sceneJsonUrl,
  validateColliders,
  validateConfig,
} from './config.js';
import {
  LOOK_SENSITIVITY,
  clampDelta,
  clampPitch,
  resolveWalk,
  wishFromAxes,
} from './movement.js';

const canvas = document.querySelector('#view');
const titleEl = document.querySelector('#title');
const statusEl = document.querySelector('#status');
const statusTextEl = document.querySelector('#status-text');
const barEl = document.querySelector('#bar');
const hintEl = document.querySelector('#hint');
const btnWalk = document.querySelector('#btn-walk');
const btnOverview = document.querySelector('#btn-overview');
const btnReset = document.querySelector('#btn-reset');
const joystickEl = document.querySelector('#joystick');
const knobEl = document.querySelector('#joy-knob');

titleEl.textContent = copy.title;
btnWalk.textContent = copy.enter;
btnOverview.textContent = copy.overview;
btnReset.textContent = copy.reset;

const keys = { forward: false, back: false, left: false, right: false };
const joy = { x: 0, y: 0, active: false, id: null };
let config = null;
let extraColliders = [];
let mode = 'walk';
let locked = false;
let desktopActive = false;
let fallbackLook = false;
let ready = false;
let lastError = null;
let yaw = 0;
let pitch = 0;
let lookPointer = null;
let lastLookX = 0;
let lastLookY = 0;

const walkPos = new THREE.Vector3(0, 1.6, 0);

function isCoarse() {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

function setStatus(state, text, progress) {
  statusEl.dataset.state = state;
  statusTextEl.textContent = text;
  statusEl.classList.toggle('hidden', false);
  if (typeof progress === 'number') {
    barEl.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
  }
  if (state === 'error') {
    lastError = text;
    barEl.style.transform = 'scaleX(0)';
  }
}

function hideStatus() {
  statusEl.classList.add('hidden');
}

function syncHint() {
  if (mode === 'overview') {
    hintEl.textContent = '';
    return;
  }
  if (isCoarse()) {
    hintEl.textContent = copy.mobile_hint;
    return;
  }
  if (!desktopActive) {
    hintEl.textContent = copy.paused_hint;
    return;
  }
  hintEl.textContent = fallbackLook && !locked ? copy.fallback_hint : copy.desktop_hint;
}

function syncChrome() {
  btnWalk.classList.toggle('active', mode === 'walk');
  btnOverview.classList.toggle('active', mode === 'overview');
  joystickEl.classList.toggle('hidden', !(mode === 'walk' && isCoarse()));
  syncHint();
}

function resetJoystick() {
  joy.x = 0;
  joy.y = 0;
  joy.active = false;
  joy.id = null;
  knobEl.style.transform = 'translate(-50%, -50%)';
}

function clearMotion() {
  keys.forward = false;
  keys.back = false;
  keys.left = false;
  keys.right = false;
  resetJoystick();
  lookPointer = null;
}

function pauseDesktop() {
  desktopActive = false;
  locked = false;
  if (document.pointerLockElement) document.exitPointerLock();
  clearMotion();
  syncHint();
}

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);

const scene = new THREE.Scene();
const walkCam = new THREE.PerspectiveCamera(65, 1, 0.08, 80);
walkCam.rotation.order = 'YXZ';
const overviewCam = new THREE.PerspectiveCamera(48, 1, 0.1, 200);

const controls = new OrbitControls(overviewCam, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minPolarAngle = 0.22;
controls.maxPolarAngle = 1.32;
controls.enabled = false;
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_ROTATE,
};

function applyWalkPose() {
  walkCam.position.copy(walkPos);
  walkCam.rotation.set(pitch, yaw, 0);
}

function frameOverview() {
  if (!config) return;
  const scale = Math.max(1, 1.1 / (window.innerWidth / Math.max(window.innerHeight, 1)));
  const [tx, ty, tz] = config.overview.target;
  const [px, py, pz] = config.overview.position;
  overviewCam.position.set(tx + (px - tx) * scale, ty + (py - ty) * scale, tz + (pz - tz) * scale);
  controls.target.set(tx, ty, tz);
  controls.update();
}

function applyConfigCameras() {
  walkCam.fov = config.camera.fov;
  walkCam.near = config.camera.near;
  walkCam.far = config.camera.far;
  overviewCam.near = config.camera.near;
  overviewCam.far = Math.max(config.camera.far * 2, config.overview.maxDistance * 4);
  controls.minDistance = config.overview.minDistance;
  controls.maxDistance = config.overview.maxDistance;
  walkPos.set(config.player.spawn[0], config.player.spawn[1], config.player.spawn[2]);
  yaw = config.player.yaw;
  pitch = clampPitch(config.player.pitch);
  applyWalkPose();
  frameOverview();
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / Math.max(h, 1);
  walkCam.aspect = aspect;
  overviewCam.aspect = aspect;
  walkCam.updateProjectionMatrix();
  overviewCam.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  if (mode === 'overview') frameOverview();
}

function requestWalk() {
  if (!ready || isCoarse() || mode !== 'walk') return;
  desktopActive = true;
  const fallback = () => {
    fallbackLook = true;
    syncHint();
  };
  if (!canvas.requestPointerLock) {
    fallback();
    return;
  }
  try {
    const result = canvas.requestPointerLock();
    if (result && typeof result.catch === 'function') result.catch(fallback);
  } catch {
    fallback();
  }
}

function setMode(next) {
  if (!ready) return;
  if (next === mode) {
    if (next === 'walk' && !locked) requestWalk();
    syncChrome();
    return;
  }
  mode = next;
  if (mode === 'overview') {
    pauseDesktop();
    controls.enabled = true;
    frameOverview();
  } else {
    controls.enabled = false;
    applyWalkPose();
    requestWalk();
  }
  syncChrome();
}

function resetView() {
  if (!config) return;
  if (mode === 'walk') {
    walkPos.set(config.player.spawn[0], config.player.spawn[1], config.player.spawn[2]);
    yaw = config.player.yaw;
    pitch = clampPitch(config.player.pitch);
    clearMotion();
    applyWalkPose();
    return;
  }
  frameOverview();
}

function setKey(code, down) {
  if (code === 'KeyW' || code === 'ArrowUp') keys.forward = down;
  else if (code === 'KeyS' || code === 'ArrowDown') keys.back = down;
  else if (code === 'KeyA' || code === 'ArrowLeft') keys.left = down;
  else if (code === 'KeyD' || code === 'ArrowRight') keys.right = down;
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape') {
    pauseDesktop();
    return;
  }
  if (event.code.startsWith('Arrow')) event.preventDefault();
  setKey(event.code, true);
});
window.addEventListener('keyup', (event) => {
  setKey(event.code, false);
});
window.addEventListener('blur', () => {
  pauseDesktop();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseDesktop();
});
document.addEventListener('pointerlockerror', () => {
  fallbackLook = true;
  syncHint();
});
document.addEventListener('pointerlockchange', () => {
  const nowLocked = document.pointerLockElement === canvas;
  if (nowLocked && (!desktopActive || mode !== 'walk' || document.hidden)) {
    locked = false;
    document.exitPointerLock();
    clearMotion();
    syncHint();
    return;
  }
  if (locked && !nowLocked) {
    desktopActive = false;
    clearMotion();
  }
  locked = nowLocked;
  syncHint();
});
document.addEventListener('mousemove', (event) => {
  if (!locked || mode !== 'walk' || !desktopActive) return;
  yaw -= event.movementX * LOOK_SENSITIVITY;
  pitch = clampPitch(pitch - event.movementY * LOOK_SENSITIVITY);
});

canvas.addEventListener('click', () => {
  if (mode === 'walk' && !isCoarse() && !locked) requestWalk();
});

for (const button of [btnWalk, btnOverview, btnReset]) {
  button.addEventListener('pointerdown', (event) => event.stopPropagation());
}
btnWalk.addEventListener('click', (event) => {
  event.stopPropagation();
  setMode('walk');
});
btnOverview.addEventListener('click', (event) => {
  event.stopPropagation();
  setMode('overview');
});
btnReset.addEventListener('click', (event) => {
  event.stopPropagation();
  resetView();
});

function joyFromEvent(event) {
  const rect = joystickEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = event.clientX - cx;
  let dy = event.clientY - cy;
  const max = rect.width * 0.36;
  const len = Math.hypot(dx, dy);
  if (len > max) {
    dx *= max / len;
    dy *= max / len;
  }
  knobEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  const nx = dx / max;
  const ny = dy / max;
  const mag = Math.hypot(nx, ny);
  if (mag < 0.12) {
    joy.x = 0;
    joy.y = 0;
    return;
  }
  joy.x = nx;
  joy.y = ny;
}

function capturePointer(el, pointerId) {
  try {
    el.setPointerCapture(pointerId);
  } catch {
    /* untrusted or unsupported capture */
  }
}

joystickEl.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  event.stopPropagation();
  joy.active = true;
  joy.id = event.pointerId;
  capturePointer(joystickEl, event.pointerId);
  joyFromEvent(event);
});
joystickEl.addEventListener('pointermove', (event) => {
  if (!joy.active || event.pointerId !== joy.id) return;
  event.preventDefault();
  joyFromEvent(event);
});
function endJoy(event) {
  if (event.pointerId !== joy.id) return;
  resetJoystick();
}
joystickEl.addEventListener('pointerup', endJoy);
joystickEl.addEventListener('pointercancel', endJoy);
joystickEl.addEventListener('lostpointercapture', endJoy);

canvas.addEventListener('pointerdown', (event) => {
  if (mode !== 'walk' || (!isCoarse() && !fallbackLook)) return;
  if (!isCoarse()) desktopActive = true;
  if (event.target.closest('.dock, .joystick, .brand, button')) return;
  lookPointer = event.pointerId;
  lastLookX = event.clientX;
  lastLookY = event.clientY;
  capturePointer(canvas, event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (event.pointerId !== lookPointer || mode !== 'walk') return;
  const dx = event.clientX - lastLookX;
  const dy = event.clientY - lastLookY;
  lastLookX = event.clientX;
  lastLookY = event.clientY;
  yaw -= dx * LOOK_SENSITIVITY * 1.55;
  pitch = clampPitch(pitch - dy * LOOK_SENSITIVITY * 1.55);
});
function endLook(event) {
  if (event.pointerId === lookPointer) lookPointer = null;
}
canvas.addEventListener('pointerup', endLook);
canvas.addEventListener('pointercancel', (event) => {
  endLook(event);
  resetJoystick();
});
canvas.addEventListener('lostpointercapture', endLook);
window.addEventListener('touchcancel', () => {
  resetJoystick();
  lookPointer = null;
  clearMotion();
});

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => {
  resize();
  syncChrome();
});
window.matchMedia('(pointer: coarse)').addEventListener('change', syncChrome);

function canWalk() {
  if (!ready || mode !== 'walk' || document.hidden) return false;
  if (isCoarse()) return true;
  if (!desktopActive) return false;
  return locked || fallbackLook;
}

function walkAxes() {
  if (isCoarse() && (joy.x !== 0 || joy.y !== 0)) {
    return { forward: -joy.y, strafe: joy.x };
  }
  return {
    forward: (keys.forward ? 1 : 0) - (keys.back ? 1 : 0),
    strafe: (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
  };
}

function assertBakedUnlit(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const mat of materials) {
      if (!mat) continue;
      if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
        throw new Error('Baked lighting requires KHR_materials_unlit. This model uses lit PBR materials.');
      }
      mat.toneMapped = false;
    }
  });
}

async function readBuffer(response, onProgress) {
  const total = Number(response.headers.get('content-length')) || 0;
  const reader = response.body && response.body.getReader();
  if (!reader) return response.arrayBuffer();
  const chunks = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (total) onProgress(received / total);
  }
  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer.buffer;
}

async function loadModel(sceneUrl) {
  const modelHref = resolveAssetUrl(config.scene.modelUrl, sceneUrl);
  const collidersHref = resolveAssetUrl(config.scene.collidersUrl, sceneUrl);
  const modelResponse = await fetch(modelHref, { cache: 'no-cache' });
  if (!modelResponse.ok) throw new Error(`Could not load model (${modelResponse.status})`);
  const buffer = await readBuffer(modelResponse, (progress) => {
    setStatus('loading', copy.loading, 0.1 + progress * 0.7);
  });
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(buffer, new URL('.', modelHref).href);
  assertBakedUnlit(gltf.scene);
  const colliderResponse = await fetch(collidersHref, { cache: 'no-cache' });
  if (!colliderResponse.ok) throw new Error(`Could not load colliders (${colliderResponse.status})`);
  extraColliders = validateColliders(await colliderResponse.json());
  assertSpawnValid(config.player, extraColliders);
  scene.add(gltf.scene);
}

async function boot() {
  setStatus('loading', copy.loading, 0.04);
  const sceneUrl = sceneJsonUrl(import.meta.env.BASE_URL, window.location.href);
  const response = await fetch(sceneUrl, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Could not load scene.json (${response.status})`);
  config = validateConfig(await response.json());
  titleEl.textContent = config.title;
  document.title = config.title;
  const [r, g, b] = config.scene.backgroundSrgb;
  scene.background = new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
  applyConfigCameras();
  resize();
  await loadModel(sceneUrl);
  ready = true;
  lastError = null;
  document.body.dataset.ready = 'true';
  hideStatus();
  syncChrome();
}

const clock = new THREE.Clock();

function tick() {
  const dt = clampDelta(clock.getDelta());
  if (canWalk() && config) {
    const axes = walkAxes();
    const wish = wishFromAxes(axes.forward, axes.strafe, yaw);
    const next = resolveWalk(
      walkPos,
      wish.x,
      wish.z,
      config.player.speed * dt,
      extraColliders,
      config.player.radius,
      config.player.bounds,
    );
    walkPos.x = next.x;
    walkPos.z = next.z;
    applyWalkPose();
  } else if (mode === 'walk') {
    applyWalkPose();
  }
  if (mode === 'overview') controls.update();
  renderer.render(scene, mode === 'overview' ? overviewCam : walkCam);
  requestAnimationFrame(tick);
}

window.__walkthrough = {
  getState() {
    return {
      ready,
      mode,
      locked,
      fallbackLook,
      desktopActive,
      sceneMode: config ? 'model' : null,
      lighting: 'baked',
      position: [walkPos.x, walkPos.y, walkPos.z],
      yaw,
      pitch,
      colliderCount: extraColliders.length,
      keys: { ...keys },
      joy: { x: joy.x, y: joy.y, active: joy.active, id: joy.id },
      lookPointer,
      error: lastError,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    };
  },
};

syncChrome();
boot().catch((error) => {
  console.warn(error);
  ready = false;
  document.body.dataset.ready = 'false';
  setStatus('error', error?.message || copy.error);
});
tick();
