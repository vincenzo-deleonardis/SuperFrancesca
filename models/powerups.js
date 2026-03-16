import * as THREE from 'three';

export function buildMagnet(px, py, pz) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3, metalness: 0.4, emissive: 0xf472b6, emissiveIntensity: 0.2 });

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.15, 0, 0), new THREE.Vector3(-0.15, 0.2, 0),
    new THREE.Vector3(0, 0.35, 0),
    new THREE.Vector3(0.15, 0.2, 0), new THREE.Vector3(0.15, 0, 0)
  ]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.06, 8, false), mat);
  tube.castShadow = true;
  group.add(tube);

  const tipMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.5 });
  const tipL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.08, 8), tipMat);
  tipL.position.set(-0.15, -0.02, 0);
  group.add(tipL);
  const tipR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.08, 8), tipMat);
  tipR.position.set(0.15, -0.02, 0);
  group.add(tipR);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.12 })
  );
  glow.position.y = 0.15;
  group.add(glow);

  group.position.set(px, py, pz);
  return { mesh: group, collected: false, type: 'magnet' };
}

export function buildFeather(px, py, pz) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.4, emissive: 0x7dd3fc, emissiveIntensity: 0.15 });

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.5, 6), mat);
  shaft.castShadow = true;
  group.add(shaft);

  const vane = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.5, transparent: true, opacity: 0.85 })
  );
  vane.scale.set(0.6, 1.2, 0.15);
  vane.position.set(0.06, 0.05, 0);
  group.add(vane);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.1 })
  );
  group.add(glow);

  group.rotation.z = 0.3;
  group.position.set(px, py, pz);
  return { mesh: group, collected: false, type: 'feather' };
}

export function buildShieldPickup(px, py, pz) {
  const group = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x60a5fa, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.5,
    clearcoat: 1.0, clearcoatRoughness: 0.0, emissive: 0x60a5fa, emissiveIntensity: 0.15
  });
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.25, 20, 16), mat);
  bubble.castShadow = true;
  group.add(bubble);

  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x60a5fa, emissiveIntensity: 0.5, roughness: 0.1 })
  );
  group.add(inner);

  group.position.set(px, py, pz);
  return { mesh: group, collected: false, type: 'shield' };
}

export function buildShieldBubble() {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x60a5fa, roughness: 0.0, metalness: 0.0, transparent: true, opacity: 0.2,
    clearcoat: 1.0, clearcoatRoughness: 0.0
  });
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 16), mat);
  bubble.position.y = 1.0;
  return bubble;
}
