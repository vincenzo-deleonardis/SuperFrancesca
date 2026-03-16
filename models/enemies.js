import * as THREE from 'three';

export function buildGhost(px, py, pz, platIdx, spd) {
  const group = new THREE.Group();

  const bodyGeo = new THREE.SphereGeometry(0.4, 24, 16);
  bodyGeo.scale(1, 1.3, 0.85);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8d0ff, transparent: true, opacity: 0.6,
    roughness: 0.1, metalness: 0.0,
    emissive: 0x4a3a8e, emissiveIntensity: 0.2,
    envMapIntensity: 1.5, clearcoat: 0.3, clearcoatRoughness: 0.1
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  const tailGeo = new THREE.ConeGeometry(0.32, 0.35, 8);
  const tail = new THREE.Mesh(tailGeo, bodyMat.clone());
  tail.position.y = -0.5;
  tail.rotation.x = Math.PI;
  group.add(tail);

  const wavyParts = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const wave = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      bodyMat.clone()
    );
    wave.position.set(Math.cos(a) * 0.22, -0.65, Math.sin(a) * 0.18);
    wave.scale.y = 0.7;
    group.add(wave);
    wavyParts.push(wave);
  }

  const eMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.2, envMapIntensity: 0.8 });
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), eMat);
  eL.position.set(-0.13, 0.12, 0.33);
  group.add(eL);
  const eR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), eMat);
  eR.position.set(0.13, 0.12, 0.33);
  group.add(eR);

  const sMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.05
  });
  const sL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), sMat);
  sL.position.set(-0.1, 0.15, 0.37);
  group.add(sL);
  const sR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), sMat);
  sR.position.set(0.16, 0.15, 0.37);
  group.add(sR);

  const mouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.3 })
  );
  mouth.scale.set(1, 0.7, 0.5);
  mouth.position.set(0, -0.06, 0.34);
  group.add(mouth);

  group.position.set(px, py, pz);
  group.userData.wavyParts = wavyParts;
  return { mesh: group, alive: true, platIdx, speed: spd, dir: 1 };
}
