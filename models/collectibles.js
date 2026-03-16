import * as THREE from 'three';

const SPRINKLE_COLORS = [0x60a5fa, 0x34d399, 0xfde68a, 0xfb7185, 0xc084fc, 0xffffff];

export function buildDonut(px, py, pz, isBonus) {
  const group = new THREE.Group();

  const dough = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.11, 18, 32),
    new THREE.MeshStandardMaterial({
      color: 0xfbbf24, roughness: 0.6, metalness: 0.0, envMapIntensity: 0.3
    })
  );
  dough.castShadow = true;
  group.add(dough);

  const icingColor = isBonus ? 0x4ade80 : 0xf472b6;
  const icing = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.12, 18, 32),
    new THREE.MeshStandardMaterial({
      color: icingColor, roughness: 0.2, metalness: 0.05,
      envMapIntensity: 0.7, emissive: icingColor, emissiveIntensity: 0.1
    })
  );
  icing.position.y = 0.015;
  group.add(icing);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const sp = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.06, 0.02),
      new THREE.MeshStandardMaterial({ color: SPRINKLE_COLORS[i % 6] })
    );
    sp.position.set(Math.cos(a) * 0.28, 0.12, Math.sin(a) * 0.28);
    sp.rotation.set(Math.random(), Math.random(), a);
    group.add(sp);
  }

  group.rotation.x = -Math.PI * 0.15;
  group.position.set(px, py, pz);
  return { mesh: group, collected: false, isBonus };
}

export function buildStar(px, py, pz) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffee00, emissive: 0xffaa00, emissiveIntensity: 1.0,
    roughness: 0.15, metalness: 0.4, envMapIntensity: 1.5
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat);
  core.castShadow = true;
  group.add(core);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 6), mat);
    spike.position.set(Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0);
    spike.rotation.z = a + Math.PI / 2;
    group.add(spike);
  }

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 12, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffee00, transparent: true, opacity: 0.15
    })
  );
  group.add(glow);

  group.position.set(px, py, pz);
  return { mesh: group, collected: false };
}

export function buildCrystal(px, py, pz) {
  const group = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xa78bfa, roughness: 0.05, metalness: 0.3,
    transparent: true, opacity: 0.75, clearcoat: 1.0,
    emissive: 0x7c3aed, emissiveIntensity: 0.5, envMapIntensity: 2.0
  });

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), mat);
  core.scale.y = 1.4;
  core.castShadow = true;
  group.add(core);

  const inner = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.15, 0),
    new THREE.MeshBasicMaterial({ color: 0xddd6fe, transparent: true, opacity: 0.4 })
  );
  inner.scale.y = 1.4;
  group.add(inner);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.1 })
  );
  group.add(glow);

  // sparkle particles around crystal
  const sparkGeo = new THREE.SphereGeometry(0.03, 4, 3);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xddd6fe, transparent: true, opacity: 0.6 });
  const sparkles = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(sparkGeo, sparkMat.clone());
    s.position.set((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.5);
    group.add(s);
    sparkles.push(s);
  }
  group.userData.sparkles = sparkles;

  group.position.set(px, py, pz);
  return { mesh: group, collected: false, type: 'crystal' };
}
