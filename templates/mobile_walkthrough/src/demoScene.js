export const DEMO_COLLIDERS = [
  { id: 'plinth', type: 'aabb', minX: -0.8, maxX: 0.8, minZ: -0.8, maxZ: 0.8 },
  { id: 'block_a', type: 'aabb', minX: -2.4, maxX: -1.2, minZ: -1.8, maxZ: -1.4 },
  { id: 'block_b', type: 'aabb', minX: 2.1, maxX: 2.7, minZ: -0.9, maxZ: -0.3 },
  { id: 'post_left', type: 'cylinder', x: -2.2, z: 2.4, radius: 0.22 },
  { id: 'post_right', type: 'cylinder', x: 2.2, z: 2.4, radius: 0.22 },
];

function material(THREE, { lighting, color, roughness = 0.86 }) {
  if (lighting === 'baked') {
    return new THREE.MeshBasicMaterial({ color });
  }
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.04 });
}

function addBox(THREE, group, { lighting, id, x, y, z, w, h, d, color }) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material(THREE, { lighting, color }),
  );
  mesh.position.set(x, y, z);
  mesh.name = id;
  mesh.castShadow = lighting === 'realtime';
  mesh.receiveShadow = lighting === 'realtime';
  group.add(mesh);
}

function addCylinder(THREE, group, { lighting, id, x, y, z, radius, height, color }) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 16),
    material(THREE, { lighting, color }),
  );
  mesh.position.set(x, y, z);
  mesh.name = id;
  mesh.castShadow = lighting === 'realtime';
  mesh.receiveShadow = lighting === 'realtime';
  group.add(mesh);
}

export function createDemoWorld(THREE, { lighting = 'realtime' } = {}) {
  const group = new THREE.Group();
  group.name = 'demo-world';

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(8, 48),
    material(THREE, { lighting, color: 0x8d9398, roughness: 0.94 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.name = 'ground';
  ground.receiveShadow = lighting === 'realtime';
  group.add(ground);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(7.55, 8, 48),
    material(THREE, { lighting, color: 0x6f7478, roughness: 0.9 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  ring.name = 'courtyard-ring';
  group.add(ring);

  addBox(THREE, group, {
    lighting,
    id: 'plinth',
    x: 0,
    y: 0.35,
    z: 0,
    w: 1.6,
    h: 0.7,
    d: 1.6,
    color: 0xc4bdb3,
  });
  addBox(THREE, group, {
    lighting,
    id: 'exhibit',
    x: 0,
    y: 0.95,
    z: 0,
    w: 0.55,
    h: 0.5,
    d: 0.55,
    color: 0xd2c4a8,
  });
  addBox(THREE, group, {
    lighting,
    id: 'block_a',
    x: -1.8,
    y: 0.4,
    z: -1.6,
    w: 1.2,
    h: 0.8,
    d: 0.4,
    color: 0x9aa3a8,
  });
  addBox(THREE, group, {
    lighting,
    id: 'block_b',
    x: 2.4,
    y: 0.55,
    z: -0.6,
    w: 0.6,
    h: 1.1,
    d: 0.6,
    color: 0xa8b0b5,
  });
  addCylinder(THREE, group, {
    lighting,
    id: 'post_left',
    x: -2.2,
    y: 0.8,
    z: 2.4,
    radius: 0.22,
    height: 1.6,
    color: 0xb7aea4,
  });
  addCylinder(THREE, group, {
    lighting,
    id: 'post_right',
    x: 2.2,
    y: 0.8,
    z: 2.4,
    radius: 0.22,
    height: 1.6,
    color: 0xb7aea4,
  });

  return { group, colliders: DEMO_COLLIDERS.map((item) => ({ ...item })) };
}
