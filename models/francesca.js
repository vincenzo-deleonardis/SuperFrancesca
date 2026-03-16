import * as THREE from 'three';

export const OUTFITS = {
  default:   { name: 'Francesca',   dress: 0xf472b6, shoe: 0xe879a0, hair: 0x2d1b0e, skin: null, locked: false },
  princess:  { name: 'Principessa', dress: 0xffd700, shoe: 0xdaa520, hair: 0x2d1b0e, skin: null, locked: false, acc: 'crown' },
  ninja:     { name: 'Ninja',       dress: 0x1a1a2e, shoe: 0x111122, hair: 0x1a1a1a, skin: null, locked: false, acc: 'bandana' },
  panda:     { name: 'Panda',       dress: 0xf0f0f0, shoe: 0x222222, hair: 0x111111, skin: 0xf0f0f0, locked: false, acc: 'pandaEars' },
  rainbow:   { name: 'Arcobaleno',  dress: 0xff6688, shoe: 0x66aaff, hair: 0x2d1b0e, skin: null, locked: false, animated: true },
  dolce:     { name: 'Dolce',       dress: 0xfbbf24, shoe: 0x8B5E3C, hair: 0xf472b6, skin: null, locked: true, acc: 'donutHat' },
};

function sp(r, mat, ws, hs) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, ws || 24, hs || 16), mat);
  m.castShadow = true;
  return m;
}

export function buildFrancesca() {
  const group = new THREE.Group();

  // ── materials ──
  const skin = new THREE.MeshStandardMaterial({ color: 0xfcd5b4, roughness: 0.7, emissive: 0xfcd5b4, emissiveIntensity: 0.04, envMapIntensity: 0.3 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x2d1b0e, roughness: 0.85, metalness: 0.12, envMapIntensity: 0.5 });
  const dress = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5, envMapIntensity: 0.4 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0xe879a0, roughness: 0.22, metalness: 0.15, envMapIntensity: 0.8 });
  const eyeW = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, envMapIntensity: 1.2 });
  const eyeP = new THREE.MeshStandardMaterial({ color: 0x1a0e05, roughness: 0.1, envMapIntensity: 0.6 });
  const mouthM = new THREE.MeshStandardMaterial({ color: 0xc0506e, roughness: 0.45 });
  const blushM = new THREE.MeshStandardMaterial({ color: 0xffaaaa, roughness: 0.8, transparent: true, opacity: 0.35 });

  // ── bone hierarchy ──
  const rootBone = new THREE.Bone(); rootBone.name = 'root';
  rootBone.position.set(0, 0, 0);

  const hipBone = new THREE.Bone(); hipBone.name = 'hip';
  hipBone.position.set(0, 0.5, 0);
  rootBone.add(hipBone);

  const spineBone = new THREE.Bone(); spineBone.name = 'spine';
  spineBone.position.set(0, 0.4, 0);
  hipBone.add(spineBone);

  const neckBone = new THREE.Bone(); neckBone.name = 'neck';
  neckBone.position.set(0, 0.5, 0);
  spineBone.add(neckBone);

  const headBone = new THREE.Bone(); headBone.name = 'head';
  headBone.position.set(0, 0.3, 0);
  neckBone.add(headBone);

  const hairBone = new THREE.Bone(); hairBone.name = 'hair';
  hairBone.position.set(0, 0, -0.15);
  headBone.add(hairBone);

  const armLBone = new THREE.Bone(); armLBone.name = 'armL';
  armLBone.position.set(-0.42, 0.35, 0);
  spineBone.add(armLBone);

  const armRBone = new THREE.Bone(); armRBone.name = 'armR';
  armRBone.position.set(0.42, 0.35, 0);
  spineBone.add(armRBone);

  const legLBone = new THREE.Bone(); legLBone.name = 'legL';
  legLBone.position.set(-0.15, 0, 0);
  hipBone.add(legLBone);

  const legRBone = new THREE.Bone(); legRBone.name = 'legR';
  legRBone.position.set(0.15, 0, 0);
  hipBone.add(legRBone);

  group.add(rootBone);

  // ── body meshes attached to bones ──
  // Torso (capsule-ish shape)
  const torsoGeo = new THREE.CapsuleGeometry(0.28, 0.35, 8, 16);
  const torso = new THREE.Mesh(torsoGeo, dress);
  torso.castShadow = true;
  torso.scale.set(1.1, 1, 1.0);
  spineBone.add(torso);

  // Skirt
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.55, 0.5, 12), dress);
  skirt.position.y = 0.05;
  skirt.castShadow = true;
  hipBone.add(skirt);

  // Left leg (capsule)
  const legGeo = new THREE.CapsuleGeometry(0.08, 0.25, 6, 10);
  const legL = new THREE.Mesh(legGeo, skin);
  legL.castShadow = true;
  legL.position.y = -0.2;
  legLBone.add(legL);

  const shoeL = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 8),
    shoe
  );
  shoeL.scale.set(1, 0.5, 1.3);
  shoeL.position.set(0, -0.38, 0.03);
  shoeL.castShadow = true;
  legLBone.add(shoeL);

  // Right leg
  const legR = new THREE.Mesh(legGeo, skin);
  legR.castShadow = true;
  legR.position.y = -0.2;
  legRBone.add(legR);

  const shoeR = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 8),
    shoe
  );
  shoeR.scale.set(1, 0.5, 1.3);
  shoeR.position.set(0, -0.38, 0.03);
  shoeR.castShadow = true;
  legRBone.add(shoeR);

  // Head
  const head = sp(0.38, skin);
  head.scale.set(1, 1.05, 0.95);
  headBone.add(head);

  // Hair back
  const hb = sp(0.42, hair);
  hb.position.set(0, 0.03, -0.08);
  hb.scale.set(1.05, 1.1, 1);
  headBone.add(hb);

  const ht = sp(0.35, hair);
  ht.position.set(0, 0.23, -0.02);
  ht.scale.set(1.15, 0.6, 1.05);
  headBone.add(ht);

  const bangs = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 12, 8),
    hair
  );
  bangs.position.set(0, 0.15, 0.18);
  bangs.scale.set(1.1, 0.35, 0.5);
  bangs.castShadow = true;
  headBone.add(bangs);

  // Hair strands (on hairBone for physics)
  const strandGeo = new THREE.CapsuleGeometry(0.08, 0.45, 6, 10);
  const strandL = new THREE.Mesh(strandGeo, hair);
  strandL.position.set(-0.25, -0.3, 0);
  strandL.rotation.z = 0.1;
  strandL.castShadow = true;
  hairBone.add(strandL);

  const strandR = new THREE.Mesh(strandGeo, hair);
  strandR.position.set(0.25, -0.3, 0);
  strandR.rotation.z = -0.1;
  strandR.castShadow = true;
  hairBone.add(strandR);

  // Back drape (longer hair)
  const drape = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.16, 0.6, 8, 12),
    hair
  );
  drape.position.set(0, -0.5, -0.05);
  drape.castShadow = true;
  hairBone.add(drape);

  // Eyes
  const eL = sp(0.06, eyeW, 12, 8); eL.position.set(-0.12, 0.04, 0.33); headBone.add(eL);
  const pL = sp(0.04, eyeP, 12, 8); pL.position.set(-0.12, 0.04, 0.37); headBone.add(pL);
  const eR = sp(0.06, eyeW, 12, 8); eR.position.set(0.12, 0.04, 0.33); headBone.add(eR);
  const pR = sp(0.04, eyeP, 12, 8); pR.position.set(0.12, 0.04, 0.37); headBone.add(pR);

  // Blush
  const bL = sp(0.07, blushM, 10, 6); bL.position.set(-0.25, -0.06, 0.26); bL.scale.set(1, 0.6, 0.6); headBone.add(bL);
  const bR = sp(0.07, blushM, 10, 6); bR.position.set(0.25, -0.06, 0.26); bR.scale.set(1, 0.6, 0.6); headBone.add(bR);

  // Mouth
  const mouth = sp(0.05, mouthM, 10, 8);
  mouth.scale.set(1.2, 0.5, 0.5);
  mouth.position.set(0, -0.1, 0.35);
  headBone.add(mouth);

  // Arms (capsule)
  const armGeo = new THREE.CapsuleGeometry(0.065, 0.3, 6, 10);
  const armLMesh = new THREE.Mesh(armGeo, skin);
  armLMesh.castShadow = true;
  armLMesh.position.y = -0.15;
  armLBone.add(armLMesh);

  const armRMesh = new THREE.Mesh(armGeo, skin);
  armRMesh.castShadow = true;
  armRMesh.position.y = -0.15;
  armRBone.add(armRMesh);

  // accessory attachment point
  const accGroup = new THREE.Group();
  accGroup.name = 'accessories';
  headBone.add(accGroup);

  group.traverse(c => { if (c.isMesh) c.castShadow = true; });

  // store refs for outfit system
  group.userData.mats = { skin, hair, dress, shoe, blushM };
  group.userData.headBone = headBone;
  group.userData.accGroup = accGroup;
  group.userData.currentOutfit = 'default';

  // ── animation state ──
  const anim = {
    bones: { root: rootBone, hip: hipBone, spine: spineBone, neck: neckBone, head: headBone, hair: hairBone, armL: armLBone, armR: armRBone, legL: legLBone, legR: legRBone },
    skirt,
    walkFrame: 0,
    hairVelocity: 0,
    hairAngle: 0,
    landSquash: 0,
    wasInAir: false,
    breathPhase: 0
  };
  group.userData.anim = anim;

  return group;
}

export function updateFrancescaAnimation(group, state, dt, t) {
  const anim = group.userData.anim;
  if (!anim) return;

  const { bones } = anim;
  const { walking, onGround, vy, vx, dir } = state;

  // ── idle breathing ──
  anim.breathPhase += dt * 2;
  const breath = Math.sin(anim.breathPhase) * 0.012;
  bones.spine.position.y = 0.4 + breath;

  // ── walk animation ──
  if (walking) {
    anim.walkFrame += dt * 10;
    const swing = Math.sin(anim.walkFrame) * 0.5;
    bones.legL.rotation.x = swing;
    bones.legR.rotation.x = -swing;
    bones.armL.rotation.x = -swing * 0.6;
    bones.armR.rotation.x = swing * 0.6;
    bones.spine.rotation.z = Math.sin(anim.walkFrame * 0.5) * 0.02;
  } else if (onGround) {
    bones.legL.rotation.x *= 0.85;
    bones.legR.rotation.x *= 0.85;
    bones.armL.rotation.x *= 0.85;
    bones.armR.rotation.x *= 0.85;
    bones.spine.rotation.z *= 0.9;
    anim.walkFrame = 0;
  }

  // ── jump squash & stretch ──
  if (!onGround && vy > 2) {
    // stretching upward
    const stretch = Math.min(vy * 0.01, 0.12);
    bones.root.scale.y = 1 + stretch;
    bones.root.scale.x = 1 - stretch * 0.4;
    bones.root.scale.z = 1 - stretch * 0.4;
    // tuck legs
    bones.legL.rotation.x = 0.4;
    bones.legR.rotation.x = 0.4;
    bones.armL.rotation.x = -0.6;
    bones.armR.rotation.x = -0.6;
    bones.armL.rotation.z = -0.3;
    bones.armR.rotation.z = 0.3;
  } else if (!onGround && vy < -2) {
    // falling
    const fall = Math.min(-vy * 0.005, 0.06);
    bones.root.scale.y = 1 - fall;
    bones.root.scale.x = 1 + fall * 0.3;
    bones.root.scale.z = 1 + fall * 0.3;
    bones.legL.rotation.x = -0.15;
    bones.legR.rotation.x = -0.15;
    bones.armL.rotation.x = -0.8;
    bones.armR.rotation.x = -0.8;
    bones.armL.rotation.z = -0.5;
    bones.armR.rotation.z = 0.5;
  }

  // landing squash
  if (onGround && anim.wasInAir) {
    anim.landSquash = 0.25;
  }
  if (anim.landSquash > 0.001) {
    anim.landSquash *= Math.pow(0.05, dt);
    bones.root.scale.y = 1 - anim.landSquash;
    bones.root.scale.x = 1 + anim.landSquash * 0.5;
    bones.root.scale.z = 1 + anim.landSquash * 0.5;
  } else if (onGround && !walking) {
    bones.root.scale.x += (1 - bones.root.scale.x) * 8 * dt;
    bones.root.scale.y += (1 - bones.root.scale.y) * 8 * dt;
    bones.root.scale.z += (1 - bones.root.scale.z) * 8 * dt;
  }
  anim.wasInAir = !onGround;

  // ── hair physics (spring simulation) ──
  const targetHairAngle = -(vx || 0) * 0.03 + Math.sin(t * 3) * 0.03;
  const hairSpring = 8, hairDamping = 4;
  const hairAccel = (targetHairAngle - anim.hairAngle) * hairSpring - anim.hairVelocity * hairDamping;
  anim.hairVelocity += hairAccel * dt;
  anim.hairAngle += anim.hairVelocity * dt;
  bones.hair.rotation.x = anim.hairAngle;
  bones.hair.rotation.z = Math.sin(t * 2.5) * 0.02;

  // ── skirt sway ──
  if (anim.skirt) {
    anim.skirt.rotation.z = Math.sin(anim.walkFrame * 0.5) * (walking ? 0.06 : 0.02);
  }

  // ── face direction ──
  group.rotation.y = dir > 0 ? 0 : Math.PI;
}

export function applyOutfit(group, outfitId) {
  const outfit = OUTFITS[outfitId] || OUTFITS.default;
  const { mats, accGroup } = group.userData;
  if (!mats) return;

  mats.dress.color.set(outfit.dress);
  mats.shoe.color.set(outfit.shoe);
  mats.hair.color.set(outfit.hair);
  if (outfit.skin) mats.skin.color.set(outfit.skin);
  else mats.skin.color.set(0xfcd5b4);

  // clear old accessories
  while (accGroup.children.length) accGroup.remove(accGroup.children[0]);

  const accMat = (c, opts) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, ...opts });

  if (outfit.acc === 'crown') {
    const crown = new THREE.Group();
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.1, 16, 1, true), accMat(0xffd700, { metalness: 0.6, emissive: 0xffd700, emissiveIntensity: 0.15 }));
    band.position.y = 0.35;
    crown.add(band);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const point = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), accMat(0xffd700, { metalness: 0.6 }));
      point.position.set(Math.cos(a) * 0.21, 0.44, Math.sin(a) * 0.21);
      crown.add(point);
    }
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), accMat(0xff0044, { emissive: 0xff0044, emissiveIntensity: 0.5 }));
    gem.position.set(0, 0.43, 0.2);
    crown.add(gem);
    accGroup.add(crown);
  }

  if (outfit.acc === 'bandana') {
    const bandana = new THREE.Mesh(
      new THREE.CylinderGeometry(0.39, 0.38, 0.08, 16),
      accMat(0xcc2222)
    );
    bandana.position.set(0, 0.18, 0);
    accGroup.add(bandana);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.35), accMat(0xcc2222));
    tail.position.set(0, 0.18, -0.45);
    tail.rotation.x = 0.2;
    accGroup.add(tail);
    const tail2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.3), accMat(0xcc2222));
    tail2.position.set(0.08, 0.17, -0.4);
    tail2.rotation.x = 0.3;
    tail2.rotation.y = 0.2;
    accGroup.add(tail2);
  }

  if (outfit.acc === 'pandaEars') {
    const earMat = accMat(0x111111);
    const earL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), earMat);
    earL.position.set(-0.28, 0.32, -0.05);
    earL.scale.y = 0.8;
    accGroup.add(earL);
    const earR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), earMat);
    earR.position.set(0.28, 0.32, -0.05);
    earR.scale.y = 0.8;
    accGroup.add(earR);
    const patchMat = accMat(0x111111, { transparent: true, opacity: 0.7 });
    const patchL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), patchMat);
    patchL.position.set(-0.14, 0.04, 0.28);
    patchL.scale.set(1.2, 1.4, 0.5);
    accGroup.add(patchL);
    const patchR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), patchMat);
    patchR.position.set(0.14, 0.04, 0.28);
    patchR.scale.set(1.2, 1.4, 0.5);
    accGroup.add(patchR);
    mats.blushM.opacity = 0;
  }

  if (outfit.acc === 'donutHat') {
    const donut = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.08, 12, 20), accMat(0xfbbf24));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.4;
    donut.add(ring);
    const icing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.085, 12, 20), accMat(0xf472b6, { emissive: 0xf472b6, emissiveIntensity: 0.1 }));
    icing.rotation.x = Math.PI / 2;
    icing.position.y = 0.42;
    donut.add(icing);
    accGroup.add(donut);
  }

  if (outfitId !== 'panda') mats.blushM.opacity = 0.35;
  group.userData.currentOutfit = outfitId;
}

export function updateRainbowOutfit(group, t) {
  if (group.userData.currentOutfit !== 'rainbow') return;
  const { mats } = group.userData;
  if (!mats) return;
  const hue = (t * 0.3) % 1;
  mats.dress.color.setHSL(hue, 0.8, 0.6);
  mats.shoe.color.setHSL((hue + 0.3) % 1, 0.8, 0.5);
}
