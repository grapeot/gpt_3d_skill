export const PITCH_MIN = -1.12;
export const PITCH_MAX = 1.12;
export const LOOK_SENSITIVITY = 0.00215;
export const MAX_DT = 0.05;

export function clampDelta(dt, max = MAX_DT) {
  if (!Number.isFinite(dt) || dt < 0) return 0;
  return dt > max ? max : dt;
}

export function clampPitch(pitch, min = PITCH_MIN, max = PITCH_MAX) {
  if (pitch < min) return min;
  if (pitch > max) return max;
  return pitch;
}

export function lookVector(yaw) {
  return {
    x: -Math.sin(yaw),
    z: -Math.cos(yaw),
  };
}

export function rightVector(yaw) {
  return {
    x: Math.cos(yaw),
    z: -Math.sin(yaw),
  };
}

export function wishFromAxes(forward, strafe, yaw) {
  const mag = Math.hypot(forward, strafe);
  if (mag < 1e-8) return { x: 0, z: 0 };
  const scale = mag > 1 ? 1 / mag : 1;
  const f = forward * scale;
  const s = strafe * scale;
  const look = lookVector(yaw);
  const right = rightVector(yaw);
  return {
    x: look.x * f + right.x * s,
    z: look.z * f + right.z * s,
  };
}

export function wishDirection(input, yaw) {
  const forward = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
  const strafe = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  return wishFromAxes(forward, strafe, yaw);
}

function clamp(v, lo, hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

export function separateAabb(x, z, radius, aabb) {
  const closestX = clamp(x, aabb.minX, aabb.maxX);
  const closestZ = clamp(z, aabb.minZ, aabb.maxZ);
  let dx = x - closestX;
  let dz = z - closestZ;
  const d2 = dx * dx + dz * dz;
  if (d2 > radius * radius) return { x, z };

  if (d2 < 1e-12) {
    const left = x - aabb.minX;
    const right = aabb.maxX - x;
    const down = z - aabb.minZ;
    const up = aabb.maxZ - z;
    const nearest = Math.min(left, right, down, up);
    if (nearest === left) return { x: aabb.minX - radius, z };
    if (nearest === right) return { x: aabb.maxX + radius, z };
    if (nearest === down) return { x, z: aabb.minZ - radius };
    return { x, z: aabb.maxZ + radius };
  }

  const d = Math.sqrt(d2);
  const push = radius / d;
  return { x: closestX + dx * push, z: closestZ + dz * push };
}

export function separateCylinder(x, z, radius, cyl) {
  const dx = x - cyl.x;
  const dz = z - cyl.z;
  const minDist = radius + cyl.radius;
  const d2 = dx * dx + dz * dz;
  if (d2 >= minDist * minDist && d2 > 0) return { x, z };
  if (d2 < 1e-12) return { x: cyl.x + minDist, z: cyl.z };
  const d = Math.sqrt(d2);
  const push = minDist / d;
  return { x: cyl.x + dx * push, z: cyl.z + dz * push };
}

export function separateFromColliders(x, z, colliders, radius) {
  let px = x;
  let pz = z;
  for (let pass = 0; pass < 3; pass += 1) {
    for (const collider of colliders) {
      if (collider.type === 'aabb') {
        const next = separateAabb(px, pz, radius, collider);
        px = next.x;
        pz = next.z;
      } else if (collider.type === 'cylinder') {
        const next = separateCylinder(px, pz, radius, collider);
        px = next.x;
        pz = next.z;
      }
    }
  }
  return { x: px, z: pz };
}

export function clampToBounds(x, z, playerRadius, bounds) {
  const [cx, cz] = bounds.center;
  const maxR = bounds.radius - playerRadius;
  const dx = x - cx;
  const dz = z - cz;
  const dist = Math.hypot(dx, dz);
  if (dist > maxR && dist > 0) {
    const s = maxR / dist;
    return { x: cx + dx * s, z: cz + dz * s };
  }
  return { x, z };
}

export function overlapsCollider(x, z, collider, radius) {
  if (collider.type === 'aabb') {
    const cx = clamp(x, collider.minX, collider.maxX);
    const cz = clamp(z, collider.minZ, collider.maxZ);
    const dx = x - cx;
    const dz = z - cz;
    return dx * dx + dz * dz < radius * radius - 1e-8;
  }
  if (collider.type === 'cylinder') {
    const minDist = radius + collider.radius;
    const dx = x - collider.x;
    const dz = z - collider.z;
    return dx * dx + dz * dz < minDist * minDist - 1e-8;
  }
  return false;
}

export function resolveWalk(pos, wishX, wishZ, distance, colliders, playerRadius, bounds) {
  if (distance === 0 || (wishX === 0 && wishZ === 0)) {
    return clampToBounds(pos.x, pos.z, playerRadius, bounds);
  }

  const maxStep = Math.max(playerRadius * 0.45, 0.08);
  const steps = Math.max(1, Math.ceil(Math.abs(distance) / maxStep));
  const step = distance / steps;
  let x = pos.x;
  let z = pos.z;

  for (let i = 0; i < steps; i += 1) {
    const afterX = separateFromColliders(x + wishX * step, z, colliders, playerRadius);
    x = afterX.x;
    z = afterX.z;
    const afterZ = separateFromColliders(x, z + wishZ * step, colliders, playerRadius);
    x = afterZ.x;
    z = afterZ.z;
  }

  return clampToBounds(x, z, playerRadius, bounds);
}
