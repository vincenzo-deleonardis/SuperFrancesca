import * as THREE from 'three';
import { buildFrancesca, updateFrancescaAnimation } from '../models/francesca.js';
import { generateShadowTexture } from '../textures/generator.js';

export const MOVE_SPEED = 8;
export const JUMP_FORCE = 12;
export const GRAVITY = 28;
export const PLAYER_HALF_W = 0.35;
export const PLAYER_H = 2.0;

const COYOTE_TIME = 0.12;
const JUMP_BUFFER = 0.10;
const JUMP_CUT_MULT = 0.45;
const DASH_SPEED = 22;
const DASH_DURATION = 0.15;
const DASH_COOLDOWN = 2.0;

const DUST_POOL_SIZE = 40;

export class Player {
  constructor(scene, groundY) {
    this.scene = scene;
    this.groundY = groundY;

    this.mesh = buildFrancesca();
    this.mesh.position.set(-5, groundY, 0);
    scene.add(this.mesh);

    const shadowTex = generateShadowTexture();
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.2),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.4, depthWrite: false })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.set(-5, groundY + 0.01, 0);
    scene.add(this.shadow);

    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.dir = 1;
    this.walkFrame = 0;
    this.speedBoost = 0;
    this.slideVx = 0;
    this.onIce = false;
    this.onSticky = false;
    this.lastPlatType = '';
    this.invincible = 0;
    this.starInvincible = 0;
    this.rainbowTimer = 0;

    // coyote time / jump buffer
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.wasOnGround = true;
    this.jumpHeld = false;
    this.jumpReleased = false;
    this.justLanded = false;
    this.justJumped = false;

    // dash
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashDir = 1;
    this.isDashing = false;
    this.justDashed = false;

    // double jump
    this.hasDoubleJump = false;
    this.doubleJumpUsed = false;
    this.doubleJumpTimer = 0;

    // shield
    this.hasShield = false;
    this.shieldMesh = null;

    // magnet
    this.magnetTimer = 0;

    // moving platform offset tracking
    this.ridingPlatform = null;
    this.lastPlatX = 0;

    this._initDustParticles();
    this.dustCooldown = 0;
  }

  _initDustParticles() {
    this.dustPool = [];
    const geo = new THREE.SphereGeometry(0.04, 5, 4);
    for (let i = 0; i < DUST_POOL_SIZE; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xc8b89a, transparent: true, opacity: 0 });
      const m = new THREE.Mesh(geo, mat);
      m.visible = false;
      this.scene.add(m);
      this.dustPool.push({ mesh: m, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1 });
    }
  }

  spawnDust(x, y, z, count, spread) {
    let spawned = 0;
    for (const p of this.dustPool) {
      if (p.life > 0) continue;
      p.mesh.visible = true;
      p.mesh.position.set(x, y, z);
      p.mesh.material.opacity = 0.6;
      p.mesh.scale.setScalar(0.5 + Math.random() * 0.8);
      p.vx = (Math.random() - 0.5) * spread;
      p.vy = Math.random() * 1.5 + 0.5;
      p.vz = (Math.random() - 0.5) * spread * 0.4;
      p.life = 0.3 + Math.random() * 0.3;
      p.maxLife = p.life;
      if (++spawned >= count) break;
    }
  }

  updateDust(dt) {
    for (const p of this.dustPool) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 3 * dt;
      p.mesh.material.opacity = Math.max(0, (p.life / p.maxLife) * 0.6);
      p.mesh.scale.setScalar(0.5 + (1 - p.life / p.maxLife) * 0.5);
      if (p.life <= 0) p.mesh.visible = false;
    }
  }

  reset(x, y) {
    this.mesh.position.set(x, y, 0);
    this.vx = 0; this.vy = 0; this.onGround = false; this.dir = 1;
    this.walkFrame = 0; this.speedBoost = 0; this.slideVx = 0;
    this.onIce = false; this.onSticky = false; this.lastPlatType = '';
    this.invincible = 0; this.starInvincible = 0; this.rainbowTimer = 0;
    this.coyoteTimer = 0; this.jumpBufferTimer = 0;
    this.wasOnGround = true; this.jumpHeld = false;
    this.jumpReleased = false; this.justLanded = false;
    this.dashTimer = 0; this.dashCooldown = 0; this.isDashing = false;
    this.hasDoubleJump = false; this.doubleJumpUsed = false; this.doubleJumpTimer = 0;
    this.hasShield = false; this.magnetTimer = 0;
    this.ridingPlatform = null;
    if (this.shieldMesh) { this.scene.remove(this.shieldMesh); this.shieldMesh = null; }
  }

  respawn(x, y) {
    this.mesh.position.set(x, y + 1, 0);
    this.vx = 0; this.vy = 0; this.invincible = 2.0;
    this.speedBoost = 0; this.slideVx = 0;
    this.coyoteTimer = 0; this.jumpBufferTimer = 0;
    this.dashTimer = 0; this.isDashing = false;
  }

  tryDash() {
    if (this.dashCooldown > 0 || this.isDashing) return false;
    this.isDashing = true;
    this.dashTimer = DASH_DURATION;
    this.dashCooldown = DASH_COOLDOWN;
    this.dashDir = this.dir;
    this.justDashed = true;
    return true;
  }

  getDashCooldownProgress() {
    if (this.dashCooldown <= 0) return 1;
    return 1 - this.dashCooldown / DASH_COOLDOWN;
  }

  absorbHit() {
    if (this.hasShield) {
      this.hasShield = false;
      if (this.shieldMesh) { this.scene.remove(this.shieldMesh); this.shieldMesh = null; }
      return true;
    }
    return false;
  }

  update(dt, t, keys, platforms) {
    this.justLanded = false;
    this.justJumped = false;
    this.justDashed = false;

    // ── coyote time tracking ──
    if (this.wasOnGround && !this.onGround) {
      this.coyoteTimer = COYOTE_TIME;
    }
    if (this.coyoteTimer > 0) this.coyoteTimer -= dt;

    // ── jump buffer ──
    if (keys.jump && !this.jumpHeld) {
      this.jumpBufferTimer = JUMP_BUFFER;
    }
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;

    // ── variable jump height ──
    if (this.jumpReleased && this.vy > 2) {
      this.vy *= JUMP_CUT_MULT;
      this.jumpReleased = false;
    }
    if (!keys.jump && this.jumpHeld && this.vy > 0) {
      this.jumpReleased = true;
    }
    this.jumpHeld = keys.jump;

    // ── dash cooldown ──
    if (this.dashCooldown > 0) this.dashCooldown -= dt;

    // ── dash active ──
    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    // ── powerup timers ──
    if (this.doubleJumpTimer > 0) {
      this.doubleJumpTimer -= dt;
      this.hasDoubleJump = true;
      if (this.doubleJumpTimer <= 0) { this.hasDoubleJump = false; this.doubleJumpUsed = false; }
    }
    if (this.magnetTimer > 0) this.magnetTimer -= dt;

    // ── invincibility timers ──
    if (this.starInvincible > 0) {
      this.starInvincible -= dt;
      this.rainbowTimer += dt * 8;
      const hue = this.rainbowTimer % 1;
      this.mesh.traverse(c => {
        if (c.isMesh && c.material && c.material.emissive) c.material.emissive.setHSL(hue, 1, 0.3);
      });
      this.mesh.visible = true;
      if (this.starInvincible <= 0) {
        this.mesh.traverse(c => {
          if (c.isMesh && c.material && c.material.emissive) c.material.emissive.set(0x000000);
        });
      }
    }

    if (this.invincible > 0) {
      this.invincible -= dt;
      this.mesh.visible = Math.floor(t * 10) % 2 === 0;
    } else if (this.starInvincible <= 0) {
      this.mesh.visible = true;
    }

    if (this.speedBoost > 0) this.speedBoost -= dt;

    // ── movement ──
    if (this.isDashing) {
      this.vx = this.dashDir * DASH_SPEED;
      this.vy = 0;
    } else {
      const baseSpeed = this.speedBoost > 0 ? MOVE_SPEED * 2 : MOVE_SPEED;
      const effectiveSpeed = this.onSticky ? baseSpeed * 0.35 : baseSpeed;

      if (this.onIce && this.onGround) {
        if (keys.left) this.slideVx -= 18 * dt;
        else if (keys.right) this.slideVx += 18 * dt;
        this.slideVx *= (1 - 0.8 * dt);
        this.slideVx = Math.max(-effectiveSpeed * 1.2, Math.min(effectiveSpeed * 1.2, this.slideVx));
        this.vx = this.slideVx;
        if (Math.abs(this.vx) > 0.3) this.dir = this.vx > 0 ? 1 : -1;
      } else {
        if (keys.left) { this.vx = -effectiveSpeed; this.dir = -1; }
        else if (keys.right) { this.vx = effectiveSpeed; this.dir = 1; }
        else { this.vx = 0; }
        this.slideVx = this.vx;
      }

      // ── jump (with coyote time, jump buffer, double jump) ──
      const canJump = this.onGround || this.coyoteTimer > 0;
      const wantsJump = keys.jump || this.jumpBufferTimer > 0;
      if (wantsJump && canJump) {
        this.vy = JUMP_FORCE;
        this.onGround = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.jumpReleased = false;
        this.justJumped = true;
        this.doubleJumpUsed = false;
        const anim = this.mesh.userData.anim;
        if (anim) anim.landSquash = 0.1;
      } else if (wantsJump && !canJump && this.hasDoubleJump && !this.doubleJumpUsed) {
        this.vy = JUMP_FORCE * 0.85;
        this.doubleJumpUsed = true;
        this.jumpBufferTimer = 0;
        this.justJumped = true;
      }

      this.vy -= GRAVITY * dt;
    }

    this.mesh.position.x += this.vx * dt;
    this.mesh.position.y += this.vy * dt;

    // ── moving platform carry ──
    if (this.ridingPlatform && !this.ridingPlatform.dead && !this.ridingPlatform.falling) {
      const platDx = this.ridingPlatform.x - this.lastPlatX;
      if (Math.abs(platDx) > 0.0001) {
        this.mesh.position.x += platDx;
      }
    }

    // ── collision ──
    this.wasOnGround = this.onGround;
    this.onGround = false;
    this.onIce = false;
    this.onSticky = false;
    this.ridingPlatform = null;
    const px = this.mesh.position.x;

    if (this.mesh.position.y <= this.groundY) {
      this.mesh.position.y = this.groundY;
      this.vy = 0;
      this.onGround = true;
    }

    let landedOnPlat = null;
    for (const plat of platforms) {
      if (plat.dead || plat.falling) continue;
      const platTop = plat.y + plat.h / 2;
      const platBot = plat.y - plat.h / 2;
      const platL = plat.x - plat.w / 2;
      const platR = plat.x + plat.w / 2;
      const feetY = this.mesh.position.y;
      const headY = feetY + PLAYER_H;
      const pL = px - PLAYER_HALF_W, pR = px + PLAYER_HALF_W;

      if (!(pR > platL && pL < platR)) continue;

      if (this.vy <= 0 && feetY <= platTop && feetY > platTop - 1.2 && headY > platTop) {
        const wasAir = !this.wasOnGround && this.vy < -0.5;
        this.mesh.position.y = platTop;
        this.onGround = true;

        if (wasAir) {
          this.justLanded = true;
          this.spawnDust(this.mesh.position.x, platTop, 0, 5, 2);
          this.doubleJumpUsed = false;
        }

        landedOnPlat = plat;
        this.ridingPlatform = plat;
        this.lastPlatX = plat.x;

        if (plat.type === 'trampoline') {
          this.vy = JUMP_FORCE * 2.5;
          this.onGround = false;
          plat.squish = 0.7;
        } else if (plat.type === 'fragile') {
          this.vy = 0;
          if (wasAir) plat.squish = 0.3;
        } else {
          this.vy = 0;
          if (wasAir) plat.squish = 0.3;
        }

        if (plat.type === 'speed' && this.speedBoost <= 0) this.speedBoost = 3;
        if (plat.type === 'ice') {
          this.onIce = true;
          if (wasAir && this.lastPlatType !== 'ice' && !this.slideVx) this.slideVx = this.dir * 2;
        }
        if (plat.type === 'sticky') this.onSticky = true;
        this.lastPlatType = plat.type;
        break;
      }

      // head bump
      if (this.vy > 0 && headY >= platBot && headY < platBot + 1 && feetY < platBot) {
        this.vy = 0;
        this.mesh.position.y = platBot - PLAYER_H;
      }
    }
    if (!this.onGround) { this.lastPlatType = ''; this.ridingPlatform = null; }

    // ── dust while walking ──
    this.dustCooldown -= dt;
    const isWalking = Math.abs(this.vx) > 0.5 && this.onGround;
    if (isWalking && this.dustCooldown <= 0) {
      this.spawnDust(this.mesh.position.x, this.mesh.position.y, 0, 1, 0.8);
      this.dustCooldown = 0.15;
    }
    if (this.isDashing) {
      this.spawnDust(this.mesh.position.x, this.mesh.position.y + 0.5, 0, 2, 1.5);
    }

    this.updateDust(dt);

    // ── shield visual ──
    if (this.shieldMesh) {
      this.shieldMesh.position.copy(this.mesh.position);
      this.shieldMesh.material.opacity = 0.12 + Math.sin(t * 4) * 0.05;
    }

    // ── shadow ──
    let shadowY = this.groundY;
    for (const plat of platforms) {
      if (plat.dead || plat.falling) continue;
      const pt = plat.y + plat.h / 2;
      if (px > plat.x - plat.w / 2 && px < plat.x + plat.w / 2 && pt < this.mesh.position.y + 0.1)
        shadowY = Math.max(shadowY, pt);
    }
    const hAbove = this.mesh.position.y - shadowY;
    const sScale = Math.max(0.2, 1 - hAbove * 0.1);
    this.shadow.position.set(this.mesh.position.x, shadowY + 0.02, 0);
    this.shadow.scale.setScalar(sScale);
    this.shadow.material.opacity = 0.4 * sScale;

    // ── animation ──
    updateFrancescaAnimation(this.mesh, {
      walking: isWalking,
      onGround: this.onGround,
      vy: this.vy,
      vx: this.vx,
      dir: this.dir,
      justLanded: this.justLanded
    }, dt, t);

    return landedOnPlat;
  }
}
