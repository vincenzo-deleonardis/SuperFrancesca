import * as THREE from 'three';

export const OUTFITS = {
  default:   { name: 'Francesca',   dress: 0xf472b6, shoe: 0xe879a0, hair: 0x2d1b0e, skin: null, locked: false },
  princess:  { name: 'Principessa', dress: 0xffd700, shoe: 0xdaa520, hair: 0x2d1b0e, skin: null, locked: false, acc: 'crown' },
  ninja:     { name: 'Ninja',       dress: 0x1a1a2e, shoe: 0x111122, hair: 0x1a1a1a, skin: null, locked: false, acc: 'bandana' },
  panda:     { name: 'Panda',       dress: 0xf0f0f0, shoe: 0x222222, hair: 0x111111, skin: 0xf0f0f0, locked: false, acc: 'pandaEars' },
  rainbow:   { name: 'Arcobaleno',  dress: 0xff6688, shoe: 0x66aaff, hair: 0x2d1b0e, skin: null, locked: false, animated: true },
  dolce:     { name: 'Dolce',       dress: 0xfbbf24, shoe: 0x8B5E3C, hair: 0xf472b6, skin: null, locked: true, acc: 'donutHat' },
};

function _sp(r, mat, ws, hs) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, ws || 24, hs || 16), mat);
  m.castShadow = true;
  return m;
}

function _generateIrisTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const cx = 32, cy = 32, r = 30;
  ctx.fillStyle = '#6b4226';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3d2010';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  grad.addColorStop(0, '#8b5a2b');
  grad.addColorStop(0.5, '#6b4226');
  grad.addColorStop(0.85, '#4a2a10');
  grad.addColorStop(1, '#2a1808');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(90,50,20,0.4)';
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.25, cy + Math.sin(a) * r * 0.25);
    ctx.lineTo(cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function _buildEye(skin, side) {
  const g = new THREE.Group();
  const sx = side === 'L' ? -1 : 1;

  const sclera = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 20, 16),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.15, sheen: 0.3,
      sheenColor: new THREE.Color(0xeeeeff), sheenRoughness: 0.3
    })
  );
  sclera.scale.set(1.05, 1.15, 0.85);
  g.add(sclera);

  const irisTex = _generateIrisTexture();
  const iris = new THREE.Mesh(
    new THREE.CircleGeometry(0.048, 24),
    new THREE.MeshStandardMaterial({ map: irisTex, roughness: 0.3, side: THREE.FrontSide })
  );
  iris.position.z = 0.065;
  g.add(iris);
  g.userData.iris = iris;

  const pupil = new THREE.Mesh(
    new THREE.CircleGeometry(0.022, 16),
    new THREE.MeshBasicMaterial({ color: 0x050505 })
  );
  pupil.position.z = 0.068;
  g.add(pupil);

  const hlBig = new THREE.Mesh(
    new THREE.CircleGeometry(0.016, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  hlBig.position.set(sx * 0.018, 0.022, 0.072);
  g.add(hlBig);

  const hlSmall = new THREE.Mesh(
    new THREE.CircleGeometry(0.008, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  hlSmall.position.set(-sx * 0.015, -0.012, 0.071);
  g.add(hlSmall);

  const cornea = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 20, 16),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transparent: true, opacity: 0.18,
      roughness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.05,
      ior: 1.4, side: THREE.FrontSide
    })
  );
  cornea.scale.set(1.0, 1.1, 0.6);
  g.add(cornea);

  const lashCurve = (offsetAngle, len) => {
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const a = -0.3 + t * 0.6 + offsetAngle;
      pts.push(new THREE.Vector3(
        Math.sin(a) * (0.08 + t * len * 0.4),
        Math.cos(a) * 0.085 + t * 0.02,
        0.03 - t * 0.01
      ));
    }
    return new THREE.CatmullRomCurve3(pts);
  };

  const lashMat = new THREE.MeshBasicMaterial({ color: 0x1a1008 });
  const lashOffsets = [0.08, 0.16, 0.24, 0.32];
  for (let i = 0; i < 4; i++) {
    const curve = lashCurve(sx * lashOffsets[i], 0.02 + i * 0.008);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 8, 0.005, 4, false), lashMat
    );
    g.add(tube);
  }

  const upperLid = new THREE.Mesh(
    new THREE.SphereGeometry(0.088, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    skin.clone()
  );
  upperLid.scale.set(1.05, 0.15, 0.65);
  upperLid.position.set(0, 0.04, 0.01);
  g.add(upperLid);
  g.userData.upperLid = upperLid;

  const lowerLid = new THREE.Mesh(
    new THREE.SphereGeometry(0.082, 12, 6, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
    skin.clone()
  );
  lowerLid.scale.set(1.0, 0.12, 0.6);
  lowerLid.position.set(0, -0.06, 0.01);
  g.add(lowerLid);

  return g;
}

function _buildBrow(hairMat, side) {
  const sx = side === 'L' ? -1 : 1;
  const pts = [
    new THREE.Vector3(sx * -0.03, 0, 0),
    new THREE.Vector3(sx * 0.0, 0.008, 0.005),
    new THREE.Vector3(sx * 0.03, 0.004, 0.003),
    new THREE.Vector3(sx * 0.05, -0.003, 0)
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 10, 0.012, 6, false),
    hairMat
  );
  return mesh;
}

function _buildHand(skinMat) {
  const g = new THREE.Group();
  const palm = _sp(0.05, skinMat, 8, 6);
  palm.scale.set(1, 0.7, 0.8);
  g.add(palm);

  const fingerGeo = new THREE.CapsuleGeometry(0.014, 0.055, 4, 6);
  const offsets = [
    { x: -0.025, z: 0.035, ry: 0.15 },
    { x: -0.008, z: 0.04, ry: 0.05 },
    { x: 0.01, z: 0.038, ry: -0.05 },
    { x: 0.025, z: 0.03, ry: -0.15 },
  ];
  for (const o of offsets) {
    const f = new THREE.Mesh(fingerGeo, skinMat);
    f.position.set(o.x, 0, o.z);
    f.rotation.x = -Math.PI / 2;
    f.rotation.y = o.ry;
    g.add(f);
  }
  const thumb = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.016, 0.04, 4, 6), skinMat
  );
  thumb.position.set(-0.04, 0, 0.01);
  thumb.rotation.set(-Math.PI / 3, 0, 0.3);
  g.add(thumb);

  return g;
}

function _buildBow(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    color, roughness: 0.5, sheen: 0.4,
    sheenColor: new THREE.Color(color).offsetHSL(0, 0, 0.2),
    sheenRoughness: 0.5
  });

  const lobeGeo = new THREE.SphereGeometry(0.06, 8, 6);
  const lobeL = new THREE.Mesh(lobeGeo, mat);
  lobeL.scale.set(1.5, 0.8, 0.5);
  lobeL.position.set(-0.06, 0, 0);
  lobeL.rotation.z = 0.3;
  g.add(lobeL);

  const lobeR = new THREE.Mesh(lobeGeo, mat);
  lobeR.scale.set(1.5, 0.8, 0.5);
  lobeR.position.set(0.06, 0, 0);
  lobeR.rotation.z = -0.3;
  g.add(lobeR);

  const knot = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 6, 5), mat
  );
  g.add(knot);

  return g;
}

function _buildScallopedSkirt(topR, botR, height, segments, dress) {
  const geo = new THREE.CylinderGeometry(topR, botR, height, segments);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vy = pos.getY(i);
    if (vy < -height / 2 + 0.01) {
      const vx = pos.getX(i), vz = pos.getZ(i);
      const angle = Math.atan2(vz, vx);
      const scallop = Math.sin(angle * 6) * 0.03;
      pos.setY(i, vy + scallop);
    }
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, dress);
  mesh.castShadow = true;
  return mesh;
}

export function buildFrancesca() {
  const group = new THREE.Group();

  // ── F4: Pixar materials ──
  const skin = new THREE.MeshPhysicalMaterial({
    color: 0xfde0c4, roughness: 0.5, clearcoat: 0.1, clearcoatRoughness: 0.5,
    sheen: 0.6, sheenColor: new THREE.Color(0xffddbb), sheenRoughness: 0.5,
    emissive: 0xfcd5b4, emissiveIntensity: 0.1
  });
  const hair = new THREE.MeshPhysicalMaterial({
    color: 0x2d1b0e, roughness: 0.45, metalness: 0.05,
    sheen: 1.0, sheenColor: new THREE.Color(0x553322), sheenRoughness: 0.3
  });
  const dress = new THREE.MeshPhysicalMaterial({
    color: 0xf472b6, roughness: 0.65,
    sheen: 0.5, sheenColor: new THREE.Color(0xffb0d0), sheenRoughness: 0.6
  });
  const shoe = new THREE.MeshPhysicalMaterial({
    color: 0xe879a0, roughness: 0.15, metalness: 0.1,
    clearcoat: 0.8, clearcoatRoughness: 0.1
  });
  const collar = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.6, sheen: 0.3,
    sheenColor: new THREE.Color(0xfff0f0), sheenRoughness: 0.5
  });
  const lipColor = new THREE.MeshPhysicalMaterial({
    color: 0xd4737a, roughness: 0.4, sheen: 0.5,
    sheenColor: new THREE.Color(0xffaaaa), sheenRoughness: 0.3
  });
  const blushM = new THREE.MeshStandardMaterial({
    color: 0xffaaaa, roughness: 0.8, transparent: true, opacity: 0.35
  });
  const soleColor = new THREE.MeshStandardMaterial({
    color: 0x8a4a5a, roughness: 0.7
  });

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

  const hairBone2 = new THREE.Bone(); hairBone2.name = 'hair2';
  hairBone2.position.set(0, 0, -0.08);
  headBone.add(hairBone2);

  const browLBone = new THREE.Bone(); browLBone.name = 'browL';
  browLBone.position.set(-0.12, 0.16, 0.3);
  headBone.add(browLBone);

  const browRBone = new THREE.Bone(); browRBone.name = 'browR';
  browRBone.position.set(0.12, 0.16, 0.3);
  headBone.add(browRBone);

  const mouthBone = new THREE.Bone(); mouthBone.name = 'mouth';
  mouthBone.position.set(0, -0.1, 0.34);
  headBone.add(mouthBone);

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

  // ── F3: body ──
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.28, 0.35, 8, 16), dress
  );
  torso.castShadow = true;
  torso.scale.set(1.1, 1, 1.0);
  spineBone.add(torso);

  // puff sleeves
  const sleeveGeo = new THREE.SphereGeometry(0.12, 10, 8);
  const sleevePuffL = new THREE.Mesh(sleeveGeo, dress);
  sleevePuffL.scale.set(1, 0.7, 0.8);
  sleevePuffL.position.set(0, 0.05, 0);
  armLBone.add(sleevePuffL);

  const sleevePuffR = new THREE.Mesh(sleeveGeo, dress);
  sleevePuffR.scale.set(1, 0.7, 0.8);
  sleevePuffR.position.set(0, 0.05, 0);
  armRBone.add(sleevePuffR);

  // collar
  const collarMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.03, 8, 20, Math.PI),
    collar
  );
  collarMesh.rotation.x = -Math.PI / 2;
  collarMesh.rotation.z = Math.PI;
  collarMesh.position.set(0, 0.42, 0.05);
  spineBone.add(collarMesh);

  // skirt layers
  const skirtOuter = _buildScallopedSkirt(0.25, 0.55, 0.5, 14, dress);
  skirtOuter.position.y = 0.05;
  hipBone.add(skirtOuter);

  const skirtInner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.48, 0.42, 12),
    dress
  );
  skirtInner.position.y = 0.08;
  skirtInner.castShadow = true;
  hipBone.add(skirtInner);

  // waist bow
  const waistBow = _buildBow(0xd4608a);
  waistBow.position.set(0, 0.28, 0.2);
  waistBow.scale.setScalar(0.7);
  hipBone.add(waistBow);

  // legs
  const legGeo = new THREE.CapsuleGeometry(0.08, 0.25, 6, 10);
  const legL = new THREE.Mesh(legGeo, skin);
  legL.castShadow = true;
  legL.position.y = -0.2;
  legLBone.add(legL);

  const legR = new THREE.Mesh(legGeo, skin);
  legR.castShadow = true;
  legR.position.y = -0.2;
  legRBone.add(legR);

  // shoes with sole and strap
  const buildShoe = (bone) => {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.08, 0.1, 8, 10), shoe
    );
    body.scale.set(1.1, 0.6, 1.3);
    body.position.set(0, -0.37, 0.03);
    body.castShadow = true;
    bone.add(body);

    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.03, 0.24), soleColor
    );
    sole.position.set(0, -0.42, 0.03);
    sole.castShadow = true;
    bone.add(sole);

    const strap = new THREE.Mesh(
      new THREE.TorusGeometry(0.085, 0.01, 6, 16, Math.PI),
      shoe
    );
    strap.rotation.x = Math.PI;
    strap.rotation.z = Math.PI;
    strap.position.set(0, -0.32, 0.03);
    bone.add(strap);
  };
  buildShoe(legLBone);
  buildShoe(legRBone);

  // arms
  const armGeo = new THREE.CapsuleGeometry(0.06, 0.3, 6, 10);
  const armLMesh = new THREE.Mesh(armGeo, skin);
  armLMesh.castShadow = true;
  armLMesh.position.y = -0.18;
  armLBone.add(armLMesh);

  const armRMesh = new THREE.Mesh(armGeo, skin);
  armRMesh.castShadow = true;
  armRMesh.position.y = -0.18;
  armRBone.add(armRMesh);

  // hands
  const handL = _buildHand(skin);
  handL.position.set(0, -0.38, 0);
  handL.scale.setScalar(0.9);
  armLBone.add(handL);

  const handR = _buildHand(skin);
  handR.position.set(0, -0.38, 0);
  handR.scale.set(-0.9, 0.9, 0.9);
  armRBone.add(handR);

  // ── F1: head and face ──
  const head = _sp(0.38, skin);
  head.scale.set(1, 1.05, 0.95);
  head.receiveShadow = false;
  headBone.add(head);

  // ears
  const earGeo = new THREE.SphereGeometry(0.065, 8, 6);
  const earL = new THREE.Mesh(earGeo, skin);
  earL.scale.set(0.5, 0.8, 0.4);
  earL.position.set(-0.35, 0.0, 0.0);
  headBone.add(earL);

  const earR = new THREE.Mesh(earGeo, skin);
  earR.scale.set(0.5, 0.8, 0.4);
  earR.position.set(0.35, 0.0, 0.0);
  headBone.add(earR);

  // nose
  const nose = _sp(0.04, skin, 10, 8);
  nose.scale.set(0.8, 0.7, 0.6);
  nose.position.set(0, -0.02, 0.36);
  headBone.add(nose);

  // eyes
  const eyeL = _buildEye(skin, 'L');
  eyeL.position.set(-0.12, 0.04, 0.28);
  headBone.add(eyeL);

  const eyeR = _buildEye(skin, 'R');
  eyeR.position.set(0.12, 0.04, 0.28);
  headBone.add(eyeR);

  // eyebrows
  const browL = _buildBrow(hair, 'L');
  browLBone.add(browL);

  const browR = _buildBrow(hair, 'R');
  browRBone.add(browR);

  // mouth
  const upperLip = new THREE.Mesh(
    new THREE.TorusGeometry(0.04, 0.012, 8, 16, Math.PI),
    lipColor
  );
  upperLip.rotation.x = Math.PI;
  upperLip.position.set(0, 0.008, 0);
  mouthBone.add(upperLip);

  const lowerLip = _sp(0.035, lipColor, 10, 8);
  lowerLip.scale.set(1.1, 0.45, 0.5);
  lowerLip.position.set(0, -0.012, 0.005);
  mouthBone.add(lowerLip);

  // blush
  const bL = _sp(0.07, blushM, 10, 6);
  bL.position.set(-0.25, -0.06, 0.26);
  bL.scale.set(1, 0.6, 0.6);
  headBone.add(bL);
  const bR = _sp(0.07, blushM, 10, 6);
  bR.position.set(0.25, -0.06, 0.26);
  bR.scale.set(1, 0.6, 0.6);
  headBone.add(bR);

  // ── F2: volumetric hair ──
  // main cap - no shadow casting to avoid darkening the face
  const hairCap = _sp(0.44, hair, 24, 16);
  hairCap.position.set(0, 0.03, -0.06);
  hairCap.scale.set(1.05, 1.1, 1.0);
  hairCap.castShadow = false;
  hairCap.userData.noShadowCast = true;
  headBone.add(hairCap);

  // top volume
  const hairTop = _sp(0.37, hair);
  hairTop.position.set(0, 0.23, -0.02);
  hairTop.scale.set(1.15, 0.6, 1.05);
  hairTop.castShadow = false;
  hairTop.userData.noShadowCast = true;
  headBone.add(hairTop);

  // defined bangs (5 strands across forehead) - no shadow to keep face bright
  const bangGeo = new THREE.CapsuleGeometry(0.04, 0.12, 6, 8);
  const bangPositions = [
    { x: -0.14, y: 0.18, z: 0.22, rz: 0.2, sy: 1.0 },
    { x: -0.06, y: 0.2, z: 0.25, rz: 0.08, sy: 1.1 },
    { x: 0.02, y: 0.2, z: 0.26, rz: -0.02, sy: 1.15 },
    { x: 0.1, y: 0.19, z: 0.24, rz: -0.1, sy: 1.05 },
    { x: 0.17, y: 0.16, z: 0.2, rz: -0.25, sy: 0.9 },
  ];
  for (const b of bangPositions) {
    const bang = new THREE.Mesh(bangGeo, hair);
    bang.position.set(b.x, b.y, b.z);
    bang.rotation.z = b.rz;
    bang.scale.set(1, b.sy, 0.7);
    bang.castShadow = false;
    bang.userData.noShadowCast = true;
    headBone.add(bang);
  }

  // side strands (on hairBone2 for secondary spring physics)
  const sideGeo = new THREE.CapsuleGeometry(0.06, 0.5, 6, 10);
  const sideL1 = new THREE.Mesh(sideGeo, hair);
  sideL1.position.set(-0.25, -0.25, 0.05);
  sideL1.rotation.z = 0.1;
  sideL1.castShadow = true;
  hairBone2.add(sideL1);

  const sideL2 = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.045, 0.4, 6, 8), hair
  );
  sideL2.position.set(-0.2, -0.2, 0.1);
  sideL2.rotation.z = 0.15;
  sideL2.castShadow = true;
  hairBone2.add(sideL2);

  const sideR1 = new THREE.Mesh(sideGeo, hair);
  sideR1.position.set(0.25, -0.25, 0.05);
  sideR1.rotation.z = -0.1;
  sideR1.castShadow = true;
  hairBone2.add(sideR1);

  const sideR2 = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.045, 0.4, 6, 8), hair
  );
  sideR2.position.set(0.2, -0.2, 0.1);
  sideR2.rotation.z = -0.15;
  sideR2.castShadow = true;
  hairBone2.add(sideR2);

  // back drape (3 overlapping capsules)
  const drapeGeo1 = new THREE.CapsuleGeometry(0.14, 0.55, 8, 12);
  const drape1 = new THREE.Mesh(drapeGeo1, hair);
  drape1.position.set(0, -0.45, -0.02);
  drape1.castShadow = true;
  hairBone.add(drape1);

  const drape2 = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.11, 0.5, 6, 10), hair
  );
  drape2.position.set(-0.08, -0.5, -0.05);
  drape2.rotation.z = 0.05;
  drape2.castShadow = true;
  hairBone.add(drape2);

  const drape3 = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.11, 0.5, 6, 10), hair
  );
  drape3.position.set(0.08, -0.5, -0.05);
  drape3.rotation.z = -0.05;
  drape3.castShadow = true;
  hairBone.add(drape3);

  // hair bow on right side
  const hairBowGroup = _buildBow(0xf472b6);
  hairBowGroup.position.set(0.3, 0.15, -0.05);
  hairBowGroup.rotation.z = -0.3;
  hairBowGroup.scale.setScalar(0.8);
  headBone.add(hairBowGroup);

  // accessory attachment point
  const accGroup = new THREE.Group();
  accGroup.name = 'accessories';
  headBone.add(accGroup);

  group.traverse(c => {
    if (c.isMesh && !c.userData.noShadowCast) c.castShadow = true;
  });

  // store refs for outfit system
  group.userData.mats = {
    skin, hair, dress, shoe, blushM,
    lipColor, collar, soleColor
  };
  group.userData.headBone = headBone;
  group.userData.accGroup = accGroup;
  group.userData.currentOutfit = 'default';
  group.userData.sleevePuffs = [sleevePuffL, sleevePuffR];
  group.userData.collarMesh = collarMesh;
  group.userData.waistBow = waistBow;
  group.userData.hairBow = hairBowGroup;

  // ── F5: animation state ──
  const anim = {
    bones: {
      root: rootBone, hip: hipBone, spine: spineBone, neck: neckBone,
      head: headBone, hair: hairBone, hair2: hairBone2,
      browL: browLBone, browR: browRBone, mouth: mouthBone,
      armL: armLBone, armR: armRBone, legL: legLBone, legR: legRBone
    },
    skirt: skirtOuter,
    walkFrame: 0,
    hairVelocity: 0,
    hairAngle: 0,
    hair2Velocity: 0,
    hair2Angle: 0,
    landSquash: 0,
    wasInAir: false,
    breathPhase: 0,
    blinkTimer: 3 + Math.random() * 2,
    blinking: 0,
    upperLidL: eyeL.userData.upperLid,
    upperLidR: eyeR.userData.upperLid,
    mouthGroup: mouthBone,
    expression: 'idle'
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
    const stretch = Math.min(vy * 0.01, 0.12);
    bones.root.scale.y = 1 + stretch;
    bones.root.scale.x = 1 - stretch * 0.4;
    bones.root.scale.z = 1 - stretch * 0.4;
    bones.legL.rotation.x = 0.4;
    bones.legR.rotation.x = 0.4;
    bones.armL.rotation.x = -0.6;
    bones.armR.rotation.x = -0.6;
    bones.armL.rotation.z = -0.3;
    bones.armR.rotation.z = 0.3;
  } else if (!onGround && vy < -2) {
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

  // ── hair physics (primary - back drape) ──
  const targetHairAngle = -(vx || 0) * 0.03 + Math.sin(t * 3) * 0.03;
  const hairSpring = 8, hairDamping = 4;
  const hairAccel = (targetHairAngle - anim.hairAngle) * hairSpring - anim.hairVelocity * hairDamping;
  anim.hairVelocity += hairAccel * dt;
  anim.hairAngle += anim.hairVelocity * dt;
  bones.hair.rotation.x = anim.hairAngle;
  bones.hair.rotation.z = Math.sin(t * 2.5) * 0.02;

  // ── secondary hair physics (side strands - lighter, more sway) ──
  const target2 = -(vx || 0) * 0.04 + Math.sin(t * 3.5) * 0.04;
  const s2 = 6, d2 = 3;
  const acc2 = (target2 - anim.hair2Angle) * s2 - anim.hair2Velocity * d2;
  anim.hair2Velocity += acc2 * dt;
  anim.hair2Angle += anim.hair2Velocity * dt;
  bones.hair2.rotation.x = anim.hair2Angle * 0.7;
  bones.hair2.rotation.z = Math.sin(t * 3) * 0.04;

  // ── skirt sway ──
  if (anim.skirt) {
    anim.skirt.rotation.z = Math.sin(anim.walkFrame * 0.5) * (walking ? 0.06 : 0.02);
  }

  // ── F5: blink ──
  anim.blinkTimer -= dt;
  if (anim.blinkTimer <= 0) {
    anim.blinkTimer = 3 + Math.random() * 4;
    anim.blinking = 0.12;
  }
  if (anim.blinking > 0) {
    anim.blinking -= dt;
    const p = 1 - Math.abs((anim.blinking / 0.12) - 0.5) * 2;
    const lidScale = 0.15 + p * 0.85;
    if (anim.upperLidL) anim.upperLidL.scale.y = lidScale;
    if (anim.upperLidR) anim.upperLidR.scale.y = lidScale;
  } else {
    if (anim.upperLidL) anim.upperLidL.scale.y += (0.15 - anim.upperLidL.scale.y) * 10 * dt;
    if (anim.upperLidR) anim.upperLidR.scale.y += (0.15 - anim.upperLidR.scale.y) * 10 * dt;
  }

  // ── F5: expressive eyebrows ──
  let browTarget = 0;
  if (!onGround && vy > 2) browTarget = 0.15;
  else if (!onGround && vy < -2) browTarget = -0.1;
  else browTarget = Math.sin(t * 0.8) * 0.02;
  bones.browL.rotation.z += (browTarget - bones.browL.rotation.z) * 5 * dt;
  bones.browR.rotation.z += (-browTarget - bones.browR.rotation.z) * 5 * dt;

  // ── F5: mouth expressions ──
  let mouthSX = 1.0, mouthSY = 1.0;
  if (!onGround && vy > 2) {
    mouthSX = 0.8; mouthSY = 1.4;
  } else if (!onGround && vy < -2) {
    mouthSX = 0.9; mouthSY = 1.2;
  } else if (walking) {
    mouthSX = 1.1; mouthSY = 0.9;
  }
  if (state.collected) {
    mouthSX = 1.3; mouthSY = 0.85;
  }
  bones.mouth.scale.x += (mouthSX - bones.mouth.scale.x) * 6 * dt;
  bones.mouth.scale.y += (mouthSY - bones.mouth.scale.y) * 6 * dt;

  // ── F5: head tilt ──
  const headTilt = (vx || 0) * 0.02;
  bones.head.rotation.z += (headTilt - bones.head.rotation.z) * 4 * dt;

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

  // update sheen for dress
  const dressColor = new THREE.Color(outfit.dress);
  mats.dress.sheenColor.copy(dressColor).offsetHSL(0, -0.1, 0.25);

  // sleeve puffs & collar visibility based on outfit
  const puffs = group.userData.sleevePuffs;
  const collarMesh = group.userData.collarMesh;
  const waistBow = group.userData.waistBow;
  const hairBow = group.userData.hairBow;

  if (puffs) {
    for (const p of puffs) {
      p.visible = outfitId !== 'ninja';
      p.material = mats.dress;
    }
  }
  if (collarMesh) {
    collarMesh.visible = outfitId !== 'ninja';
    if (outfitId === 'princess') mats.collar.color.set(0xffd700);
    else if (outfitId === 'dolce') mats.collar.color.set(0xfbbf24);
    else mats.collar.color.set(0xffffff);
  }
  if (waistBow) {
    waistBow.visible = outfitId !== 'ninja';
  }
  if (hairBow) {
    hairBow.visible = outfitId !== 'ninja' && outfitId !== 'panda';
    if (outfitId === 'princess') {
      hairBow.traverse(c => { if (c.isMesh) c.material.color.set(0xffd700); });
    } else if (outfitId === 'dolce') {
      hairBow.traverse(c => { if (c.isMesh) c.material.color.set(0xfbbf24); });
    } else {
      hairBow.traverse(c => { if (c.isMesh) c.material.color.set(outfit.dress); });
    }
  }

  // sole color
  if (outfitId === 'ninja') mats.soleColor.color.set(0x080808);
  else if (outfitId === 'princess') mats.soleColor.color.set(0x8a6a20);
  else mats.soleColor.color.set(0x8a4a5a);

  // clear old accessories
  while (accGroup.children.length) accGroup.remove(accGroup.children[0]);

  const accMat = (c, opts) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, ...opts });

  if (outfit.acc === 'crown') {
    const crown = new THREE.Group();
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.24, 0.1, 16, 1, true),
      accMat(0xffd700, { metalness: 0.6, emissive: 0xffd700, emissiveIntensity: 0.15 })
    );
    band.position.y = 0.35;
    crown.add(band);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const point = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.12, 4),
        accMat(0xffd700, { metalness: 0.6 })
      );
      point.position.set(Math.cos(a) * 0.21, 0.44, Math.sin(a) * 0.21);
      crown.add(point);
    }
    const gem = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 6),
      accMat(0xff0044, { emissive: 0xff0044, emissiveIntensity: 0.5 })
    );
    gem.position.set(0, 0.43, 0.2);
    crown.add(gem);
    accGroup.add(crown);
  }

  if (outfit.acc === 'bandana') {
    const bandana = new THREE.Mesh(
      new THREE.CylinderGeometry(0.39, 0.38, 0.08, 16), accMat(0xcc2222)
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
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.08, 12, 20), accMat(0xfbbf24)
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.4;
    donut.add(ring);
    const icing = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.085, 12, 20),
      accMat(0xf472b6, { emissive: 0xf472b6, emissiveIntensity: 0.1 })
    );
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
  mats.dress.sheenColor.setHSL((hue + 0.1) % 1, 0.6, 0.75);
  mats.shoe.color.setHSL((hue + 0.3) % 1, 0.8, 0.5);
  mats.hair.color.setHSL((hue + 0.5) % 1, 0.5, 0.25);
  mats.hair.sheenColor.setHSL((hue + 0.55) % 1, 0.6, 0.4);
}
