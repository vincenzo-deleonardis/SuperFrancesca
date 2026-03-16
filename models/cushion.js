import * as THREE from 'three';

export const CTYPE = {
  normal:     { color: 0xf9a8d4, emissive: 0x000000, label: '',              labelColor: '#fff' },
  trampoline: { color: 0xfde047, emissive: 0x332800, label: 'SUPER SALTO!',  labelColor: '#fde047' },
  speed:      { color: 0xfb923c, emissive: 0x331000, label: 'VELOCITÀ!',     labelColor: '#fb923c' },
  ice:        { color: 0xbae6fd, emissive: 0x001833, label: 'SCIVOLOSO!',    labelColor: '#7dd3fc' },
  sticky:     { color: 0xa78bfa, emissive: 0x1a0040, label: 'APPICCICOSO!',  labelColor: '#a78bfa' },
  bonus:      { color: 0x4ade80, emissive: 0x003310, label: 'BONUS x3!',     labelColor: '#4ade80' },
  fragile:    { color: 0xe74c3c, emissive: 0x330000, label: 'FRAGILE!',      labelColor: '#e74c3c' },
  moving:     { color: 0x38bdf8, emissive: 0x002244, label: '',              labelColor: '#38bdf8' }
};

function buildStitch(length) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(length * 0.25, 0.02, 0),
    new THREE.Vector3(length * 0.5, 0, 0),
    new THREE.Vector3(length * 0.75, 0.02, 0),
    new THREE.Vector3(length, 0, 0)
  ]);
  const geo = new THREE.TubeGeometry(curve, 20, 0.012, 4, false);
  return new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.1, opacity: 0.6, transparent: true })
  );
}

function buildSpring(radius, height, turns) {
  const points = [];
  const steps = turns * 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      t * height,
      Math.sin(angle) * radius
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, steps * 2, 0.025, 6, false);
  return new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.8 })
  );
}

export function buildCushion(px, py, pz, w, h, d, type, fabricTex, fabricNormal) {
  const ct = CTYPE[type] || CTYPE.normal;
  const group = new THREE.Group();

  const geo = new THREE.BoxGeometry(w, h, d, 8, 4, 8);
  const pos = geo.attributes.position;
  const hw = w / 2, hh = h / 2, hd = d / 2, bevel = 0.2;
  for (let i = 0; i < pos.count; i++) {
    let vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
    const dx = Math.max(0, Math.abs(vx) - (hw - bevel));
    const dy = Math.max(0, Math.abs(vy) - (hh - bevel));
    const dz = Math.max(0, Math.abs(vz) - (hd - bevel));
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist > 0 && bevel / dist < 1) {
      const f = bevel / dist;
      pos.setXYZ(i,
        Math.sign(vx) * Math.min(Math.abs(vx), hw - bevel + dx * f),
        Math.sign(vy) * Math.min(Math.abs(vy), hh - bevel + dy * f),
        Math.sign(vz) * Math.min(Math.abs(vz), hd - bevel + dz * f)
      );
    }
    // pillow puffiness: inflate top surface slightly
    if (vy > 0) {
      const nx = vx / hw, nz = vz / hd;
      const puff = (1 - nx * nx) * (1 - nz * nz) * 0.08;
      pos.setY(i, pos.getY(i) + puff);
    }
  }
  geo.computeVertexNormals();

  const matOpts = {
    color: ct.color, roughness: 0.7, metalness: 0.0,
    emissive: ct.emissive, emissiveIntensity: 0.25,
    envMapIntensity: 0.2
  };
  if (fabricTex) matOpts.map = fabricTex;
  if (fabricNormal) {
    matOpts.normalMap = fabricNormal;
    matOpts.normalScale = new THREE.Vector2(0.6, 0.6);
  }
  const cushion = new THREE.Mesh(geo, new THREE.MeshStandardMaterial(matOpts));
  cushion.castShadow = true;
  cushion.receiveShadow = true;
  group.add(cushion);

  const hl = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.8, 0.02, d * 0.5),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.3 })
  );
  hl.position.y = h / 2 + 0.01;
  group.add(hl);

  // stitching lines along top edges
  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.6, metalness: 0.1, transparent: true, opacity: 0.5
  });
  const stitchPositions = [
    { x: 0, y: h / 2 + 0.01, z: d / 2 - 0.08, rotY: 0, len: w * 0.85 },
    { x: 0, y: h / 2 + 0.01, z: -d / 2 + 0.08, rotY: 0, len: w * 0.85 },
    { x: w / 2 - 0.08, y: h / 2 + 0.01, z: 0, rotY: Math.PI / 2, len: d * 0.85 },
    { x: -w / 2 + 0.08, y: h / 2 + 0.01, z: 0, rotY: Math.PI / 2, len: d * 0.85 },
  ];
  for (const sp of stitchPositions) {
    const stitch = buildStitch(sp.len);
    stitch.position.set(sp.x - sp.len / 2 * Math.cos(sp.rotY), sp.y, sp.z - sp.len / 2 * Math.sin(sp.rotY));
    stitch.rotation.y = sp.rotY;
    group.add(stitch);
  }

  // decorative seam lines (small cylinders)
  const sm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
  for (let i = 0; i < 6; i++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.015, 0.015), sm);
    st.position.set(-w * 0.35 + i * w * 0.14, h / 2 + 0.015, d * 0.35);
    group.add(st);
  }

  if (type === 'trampoline') {
    const spring = buildSpring(0.12, 0.4, 4);
    spring.position.set(0, -h / 2 - 0.4, 0);
    group.add(spring);

    const springBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.2, 0.05, 12),
      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.7 })
    );
    springBase.position.set(0, -h / 2 - 0.42, 0);
    group.add(springBase);
  }

  if (type !== 'normal') {
    const ic = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 8),
      new THREE.MeshStandardMaterial({
        color: ct.color, emissive: ct.color, emissiveIntensity: 0.5,
        roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.85
      })
    );
    ic.position.y = h / 2 + 0.35;
    ic.userData.isIcon = true;
    group.add(ic);
  }

  group.position.set(px, py, pz);
  return { mesh: group, x: px, y: py, z: pz, w, h, d, type, squish: 0, landed: false };
}
