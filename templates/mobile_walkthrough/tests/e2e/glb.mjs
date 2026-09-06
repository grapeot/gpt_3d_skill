import { deflateSync } from 'node:zlib';

function solidPng(color) {
  function chunk(type, data) {
    const payload = Buffer.concat([Buffer.from(type), data]);
    let crc = 0xffffffff;
    for (const byte of payload) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([length, payload, checksum]);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.from([0, ...color]))), chunk('IEND', Buffer.alloc(0)),
  ]);
}

function padTo4(bytes, padByte) {
  const extra = (4 - (bytes.length % 4)) % 4;
  if (!extra) return bytes;
  const out = new Uint8Array(bytes.length + extra);
  out.set(bytes);
  out.fill(padByte, bytes.length);
  return out;
}

function u32(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return bytes;
}

function concat(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function buildBoxGlb({ unlit = true, color = [0.75, 0.62, 0.48, 1], textureColor = null } = {}) {
  const positions = new Float32Array([
    -0.5, 0, -0.5,
    0.5, 0, -0.5,
    0.5, 1, -0.5,
    -0.5, 1, -0.5,
    -0.5, 0, 0.5,
    0.5, 0, 0.5,
    0.5, 1, 0.5,
    -0.5, 1, 0.5,
  ]);
  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3,
    1, 5, 6, 1, 6, 2,
    5, 4, 7, 5, 7, 6,
    4, 0, 3, 4, 3, 7,
    3, 2, 6, 3, 6, 7,
    4, 5, 1, 4, 1, 0,
  ]);
  for (let i = 0; i < indices.length; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  const uv = new Float32Array([0,0, 1,0, 1,1, 0,1, 0,0, 1,0, 1,1, 0,1]);
  const png = textureColor ? solidPng(textureColor) : null;
  const bin = concat([new Uint8Array(positions.buffer), new Uint8Array(indices.buffer),
    ...(png ? [new Uint8Array(uv.buffer), png] : [])]);
  const material = {
    pbrMetallicRoughness: {
      baseColorFactor: textureColor ? [1,1,1,1] : color,
      metallicFactor: unlit ? 0 : 0.1,
      roughnessFactor: unlit ? 1 : 0.4,
    },
  };
  if (unlit) material.extensions = { KHR_materials_unlit: {} };
  const doc = {
    asset: { version: '2.0', generator: 'mobile-walkthrough-template-test' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
    materials: [material],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 8,
        type: 'VEC3',
        min: [-0.5, 0, -0.5],
        max: [0.5, 1, 0.5],
      },
      {
        bufferView: 1,
        componentType: 5123,
        count: 36,
        type: 'SCALAR',
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positions.byteLength, target: 34962 },
      { buffer: 0, byteOffset: positions.byteLength, byteLength: indices.byteLength, target: 34963 },
    ],
    buffers: [{ byteLength: bin.byteLength }],
  };
  if (unlit) {
    doc.extensionsUsed = ['KHR_materials_unlit'];
    doc.extensionsRequired = ['KHR_materials_unlit'];
  }
  if (png) {
    doc.meshes[0].primitives[0].attributes.TEXCOORD_0 = 2;
    doc.accessors.push({ bufferView: 2, componentType: 5126, count: 8, type: 'VEC2' });
    doc.bufferViews.push(
      { buffer: 0, byteOffset: positions.byteLength + indices.byteLength, byteLength: uv.byteLength, target: 34962 },
      { buffer: 0, byteOffset: positions.byteLength + indices.byteLength + uv.byteLength, byteLength: png.length },
    );
    doc.images = [{ bufferView: 3, mimeType: 'image/png' }];
    doc.samplers = [{ magFilter: 9728, minFilter: 9728 }];
    doc.textures = [{ source: 0, sampler: 0 }];
    material.pbrMetallicRoughness.baseColorTexture = { index: 0 };
  }
  const json = padTo4(new TextEncoder().encode(JSON.stringify(doc)), 0x20);
  const binary = padTo4(bin, 0);
  const jsonChunk = concat([u32(json.length), u32(0x4e4f534a), json]);
  const binChunk = concat([u32(binary.length), u32(0x004e4942), binary]);
  const body = concat([jsonChunk, binChunk]);
  const header = concat([u32(0x46546c67), u32(2), u32(12 + body.length)]);
  return concat([header, body]);
}

export const modelScene = {
  schemaVersion: 1,
  title: '3D Walkthrough',
  subtitle: 'Model fixture',
  scene: {
    mode: 'model',
    modelUrl: './assets/scene.glb',
    collidersUrl: './assets/colliders.json',
    lighting: 'baked',
    backgroundSrgb: [0.7, 0.72, 0.74],
  },
  player: {
    spawn: [0, 1.6, 3],
    yaw: 0,
    pitch: 0,
    speed: 3,
    radius: 0.35,
    bounds: { center: [0, 0], radius: 8 },
  },
  camera: { fov: 65, near: 0.08, far: 80 },
  overview: {
    target: [0, 0.4, 0],
    position: [8, 7, 11],
    minDistance: 4,
    maxDistance: 24,
  },
  quality: { maxPixelRatio: 2 },
};
