import * as THREE from 'three';

export function generateGroundTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4abe4a';
  ctx.fillRect(0, 0, 256, 256);
  const greens = ['#3da83d', '#45c045', '#55d055', '#389838', '#4fc84f', '#35a035'];
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    ctx.fillStyle = greens[(Math.random() * greens.length) | 0];
    ctx.fillRect(x, y, 1, 2 + Math.random() * 5);
  }
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    ctx.fillStyle = 'rgba(120,80,40,0.12)';
    ctx.beginPath(); ctx.arc(x, y, 2 + Math.random() * 3, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    ctx.fillStyle = 'rgba(255,255,180,0.08)';
    ctx.beginPath(); ctx.arc(x, y, 1 + Math.random() * 1.5, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(40, 8);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function generateFabricTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 64; i += 4) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 64); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(64, i); ctx.stroke();
  }
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.03})`;
    ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function generateShadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(0,0,0,0.35)');
  grd.addColorStop(0.5, 'rgba(0,0,0,0.15)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function _heightToNormal(heightCanvas, strength) {
  const w = heightCanvas.width, h = heightCanvas.height;
  const ctx = heightCanvas.getContext('2d');
  const src = ctx.getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const octx = out.getContext('2d');
  const dst = octx.createImageData(w, h);
  const s = strength || 2.0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      const dX = (src[i - 4] - src[i + 4]) / 255;
      const dY = (src[i - w * 4] - src[i + w * 4]) / 255;
      dst.data[i]     = (dX * s * 0.5 + 0.5) * 255;
      dst.data[i + 1] = (dY * s * 0.5 + 0.5) * 255;
      dst.data[i + 2] = 255;
      dst.data[i + 3] = 255;
    }
  }
  octx.putImageData(dst, 0, 0);
  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function generateGroundNormalMap() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    const v = 100 + Math.random() * 50;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, y, 1, 2 + Math.random() * 6);
  }
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    ctx.fillStyle = `rgb(${140 + Math.random() * 30 | 0},${140 + Math.random() * 30 | 0},${140 + Math.random() * 30 | 0})`;
    ctx.beginPath(); ctx.arc(x, y, 2 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
  }
  const tex = _heightToNormal(c, 2.0);
  tex.repeat.set(40, 8);
  return tex;
}

export function generateFabricNormalMap() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#999999';
  ctx.lineWidth = 1;
  for (let i = 0; i < 128; i += 4) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke();
  }
  for (let i = 0; i < 40; i++) {
    const v = 115 + Math.random() * 25 | 0;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  const tex = _heightToNormal(c, 1.5);
  tex.repeat.set(2, 2);
  return tex;
}

export function generateEnvMap() {
  const size = 64;
  const colors = [
    [[0x4a, 0x90, 0xd9], [0xd4, 0xf1, 0xff]],
    [[0x5a, 0xa0, 0xe0], [0xc0, 0xe8, 0xf8]],
    [[0x87, 0xCE, 0xEB], [0x87, 0xCE, 0xEB]],
    [[0x3a, 0x8a, 0x3a], [0x4a, 0xbe, 0x4a]],
    [[0x60, 0xb0, 0xe0], [0xd4, 0xf1, 0xff]],
    [[0x50, 0x98, 0xd0], [0xc8, 0xe8, 0xf4]],
  ];
  const faces = [];
  for (let f = 0; f < 6; f++) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const grd = ctx.createLinearGradient(0, 0, 0, size);
    const [t, b] = colors[f];
    grd.addColorStop(0, `rgb(${t[0]},${t[1]},${t[2]})`);
    grd.addColorStop(1, `rgb(${b[0]},${b[1]},${b[2]})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    faces.push(c);
  }
  const cubeTexture = new THREE.CubeTexture(faces);
  cubeTexture.colorSpace = THREE.SRGBColorSpace;
  cubeTexture.needsUpdate = true;
  return cubeTexture;
}
