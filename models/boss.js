import * as THREE from 'three';

export function buildBossGhost(px, py, pz) {
  const group = new THREE.Group();

  const bodyGeo = new THREE.SphereGeometry(1.0, 32, 24);
  bodyGeo.scale(1, 1.3, 0.85);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xb8a0e8, transparent: true, opacity: 0.55,
    roughness: 0.08, emissive: 0x6a3aae, emissiveIntensity: 0.3,
    envMapIntensity: 2.0, clearcoat: 0.4, clearcoatRoughness: 0.05
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  group.add(body);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.8, 12), bodyMat.clone());
  tail.position.y = -1.2;
  tail.rotation.x = Math.PI;
  group.add(tail);

  // wavy bottom
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const wave = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), bodyMat.clone());
    wave.position.set(Math.cos(a) * 0.55, -1.5, Math.sin(a) * 0.45);
    wave.scale.y = 0.7;
    group.add(wave);
  }

  // crown
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.7, emissive: 0xffd700, emissiveIntensity: 0.2 });
  const crownBand = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.2, 16, 1, true), crownMat);
  crownBand.position.y = 1.1;
  group.add(crownBand);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const point = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), crownMat);
    point.position.set(Math.cos(a) * 0.52, 1.35, Math.sin(a) * 0.52);
    group.add(point);
  }
  const gemMat = new THREE.MeshStandardMaterial({ color: 0xff0044, emissive: 0xff0044, emissiveIntensity: 0.8, roughness: 0.1 });
  const gem = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), gemMat);
  gem.position.set(0, 1.25, 0.55);
  group.add(gem);

  // eyes
  const eMat = new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.15, emissive: 0xff0044, emissiveIntensity: 0.4 });
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), eMat);
  eL.position.set(-0.3, 0.25, 0.8);
  group.add(eL);
  const eR = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), eMat);
  eR.position.set(0.3, 0.25, 0.8);
  group.add(eR);

  const sMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0xff4444, emissiveIntensity: 0.8, roughness: 0.05 });
  const sL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), sMat);
  sL.position.set(-0.25, 0.3, 0.92);
  group.add(sL);
  const sR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), sMat);
  sR.position.set(0.35, 0.3, 0.92);
  group.add(sR);

  // mouth
  const mouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x2d0a4e, roughness: 0.3 })
  );
  mouth.scale.set(1.2, 0.6, 0.5);
  mouth.position.set(0, -0.2, 0.85);
  group.add(mouth);

  group.position.set(px, py, pz);
  group.userData.bodyMat = bodyMat;

  return group;
}

export class Boss {
  constructor(scene, px, py) {
    this.scene = scene;
    this.mesh = buildBossGhost(px, py, 0);
    this.scene.add(this.mesh);

    this.hp = 3;
    this.maxHp = 3;
    this.alive = true;
    this.phase = 1;
    this.stateTimer = 0;
    this.state = 'idle';
    this.baseX = px;
    this.baseY = py;
    this.dir = 1;
    this.speed = 3;
    this.invulnerable = 0;
    this.flashTimer = 0;
    this.patrolRange = 6;
    this.chargeTarget = 0;
    this.miniGhostCooldown = 0;
  }

  hit() {
    if (this.invulnerable > 0) return false;
    this.hp--;
    this.invulnerable = 1.5;
    this.flashTimer = 1.5;
    if (this.hp <= 2) this.phase = 2;
    if (this.hp <= 1) this.phase = 3;
    if (this.hp <= 0) {
      this.alive = false;
      this.mesh.visible = false;
      return true; // dead
    }
    this.state = 'stunned';
    this.stateTimer = 1.0;
    return false;
  }

  update(dt, t, playerX) {
    if (!this.alive) return null;

    if (this.invulnerable > 0) {
      this.invulnerable -= dt;
      this.flashTimer -= dt;
      this.mesh.visible = Math.floor(t * 12) % 2 === 0;
    } else {
      this.mesh.visible = true;
    }

    // bobbing
    this.mesh.position.y = this.baseY + Math.sin(t * 2) * 0.3;
    this.mesh.rotation.y = Math.sin(t * 0.8) * 0.1;

    let spawnMiniGhost = null;

    if (this.state === 'stunned') {
      this.stateTimer -= dt;
      this.mesh.position.y += Math.sin(t * 15) * 0.1;
      if (this.stateTimer <= 0) {
        this.state = 'patrol';
        this.stateTimer = 3 + Math.random() * 2;
      }
      return null;
    }

    if (this.state === 'idle') {
      this.state = 'patrol';
      this.stateTimer = 3;
    }

    if (this.state === 'patrol') {
      this.mesh.position.x += this.speed * this.dir * dt;
      if (this.mesh.position.x > this.baseX + this.patrolRange) { this.dir = -1; }
      if (this.mesh.position.x < this.baseX - this.patrolRange) { this.dir = 1; }

      this.stateTimer -= dt;

      // spawn mini ghosts in phase 1+
      this.miniGhostCooldown -= dt;
      if (this.miniGhostCooldown <= 0 && this.phase >= 1) {
        this.miniGhostCooldown = this.phase >= 3 ? 1.5 : 2.5;
        spawnMiniGhost = { x: this.mesh.position.x, y: this.mesh.position.y - 1.5 };
      }

      if (this.stateTimer <= 0) {
        if (this.phase >= 2) {
          this.state = 'charge';
          this.chargeTarget = playerX;
          this.stateTimer = 1.5;
          this.speed = 10;
        } else {
          this.stateTimer = 3 + Math.random() * 2;
        }
      }
    }

    if (this.state === 'charge') {
      const chDir = this.chargeTarget > this.mesh.position.x ? 1 : -1;
      this.mesh.position.x += this.speed * chDir * dt;
      this.stateTimer -= dt;

      if (this.stateTimer <= 0 || Math.abs(this.mesh.position.x - this.chargeTarget) < 0.5) {
        this.state = this.phase >= 3 ? 'shockwave' : 'patrol';
        this.speed = 3 + this.phase;
        this.stateTimer = this.state === 'shockwave' ? 1.0 : 3;
      }
    }

    if (this.state === 'shockwave') {
      this.mesh.position.x += (this.baseX - this.mesh.position.x) * 3 * dt;
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'patrol';
        this.stateTimer = 2;
      }
    }

    return spawnMiniGhost;
  }

  getHitbox() {
    return {
      x: this.mesh.position.x,
      y: this.mesh.position.y,
      w: 1.8,
      h: 2.6
    };
  }

  remove() {
    this.scene.remove(this.mesh);
  }
}
