import * as THREE from 'three';
import { Player, JUMP_FORCE, PLAYER_H, PLAYER_HALF_W } from './player.js';
import { Level, GROUND_Y, CTYPE } from './level.js';
import { UI } from './ui.js';
import { AudioManager } from './audio.js';
import { setupPostProcessing } from './postfx.js';
import { OUTFITS, applyOutfit, updateRainbowOutfit } from '../models/francesca.js';
import { buildShieldBubble } from '../models/powerups.js';

const MAX_LEVEL = 5;

// ── renderer ──
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.setClearColor(0x87CEEB, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
renderer.domElement.style.cssText = 'position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;display:block!important;';
renderer.setSize(window.innerWidth, window.innerHeight, false);

// ── scene ──
const scene = new THREE.Scene();

// ── camera ──
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 4, 14);
camera.lookAt(0, 1.5, 0);
const CAM_OFFSET = { x: 0, y: 10, z: 16 };
const CAM_LOOK_OFFSET = { x: 0, y: 1.5, z: 0 };

// screen shake state
const camShake = { intensity: 0, decay: 8 };

// ── lights ──
const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x4abe4a, 0.75);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
dirLight.position.set(8, 18, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -22; dirLight.shadow.camera.right = 22;
dirLight.shadow.camera.top = 22; dirLight.shadow.camera.bottom = -22;
dirLight.shadow.camera.near = 0.5; dirLight.shadow.camera.far = 60;
dirLight.shadow.bias = -0.001;
dirLight.shadow.normalBias = 0.02;
dirLight.shadow.radius = 2;
scene.add(dirLight); scene.add(dirLight.target);

const fillLight = new THREE.DirectionalLight(0xe0c0ff, 0.4);
fillLight.position.set(-6, 10, -8);
scene.add(fillLight);

const bounceLight = new THREE.PointLight(0x8cd48c, 0.5, 20, 2);
bounceLight.position.set(0, GROUND_Y + 0.5, 2);
scene.add(bounceLight);

// rim/back light for 3D depth separation
const rimLight = new THREE.DirectionalLight(0xaaddff, 0.6);
rimLight.position.set(-4, 8, -10);
scene.add(rimLight);

// ── post-processing ──
const composer = setupPostProcessing(renderer, scene, camera, isMobile);

// ── subsystems ──
const ui = new UI();
const audio = new AudioManager();
const level = new Level(scene, isMobile);
const player = new Player(scene, GROUND_Y);

// ── 3D particle system ──
const PARTICLE_POOL = isMobile ? 40 : 120;
const particleGeo = new THREE.SphereGeometry(0.06, 6, 4);
const particlePool = [];
for (let i = 0; i < PARTICLE_POOL; i++) {
  const m = new THREE.Mesh(particleGeo,
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
  m.visible = false;
  scene.add(m);
  particlePool.push({ mesh: m, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1 });
}

function spawnParticles3D(x, y, z, color, count, spread, type) {
  spread = spread || 4;
  let spawned = 0;
  for (const p of particlePool) {
    if (p.life > 0) continue;
    p.mesh.visible = true;
    p.mesh.position.set(x, y, z);
    p.mesh.material.color.set(color);
    p.mesh.material.opacity = 1;

    if (type === 'landing') {
      // semicircular puff: horizontal outward, slight upward arc
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
      p.mesh.scale.setScalar(1.0 + Math.random() * 1.5);
      p.vx = Math.cos(angle) * (2 + Math.random() * 2);
      p.vy = 1.5 + Math.random() * 1.5;
      p.vz = (Math.random() - 0.5) * 1.5;
      p.life = 0.35 + Math.random() * 0.2;
      p.maxLife = p.life;
    } else if (type === 'wind') {
      p.mesh.scale.setScalar(0.3 + Math.random() * 0.4);
      p.vx = -(2 + Math.random() * 3);
      p.vy = (Math.random() - 0.5) * 0.5;
      p.vz = (Math.random() - 0.5) * 0.3;
      p.life = 0.25 + Math.random() * 0.15;
      p.maxLife = p.life;
    } else {
      p.mesh.scale.setScalar(0.6 + Math.random() * 1.2);
      p.vx = (Math.random() - 0.5) * spread;
      p.vy = Math.random() * spread * 0.8 + 2;
      p.vz = (Math.random() - 0.5) * spread * 0.5;
      p.life = 0.8 + Math.random() * 0.5;
      p.maxLife = p.life;
    }
    if (++spawned >= count) break;
  }
}

function updateParticles3D(dt) {
  for (const p of particlePool) {
    if (p.life <= 0) continue;
    p.life -= dt;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    p.vy -= 9 * dt;
    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
    if (p.life <= 0) p.mesh.visible = false;
  }
}

// ── after-image trail for dash ──
const TRAIL_POOL = isMobile ? 4 : 8;
const trailPool = [];
for (let i = 0; i < TRAIL_POOL; i++) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.8, 0.4),
    new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0 })
  );
  m.visible = false;
  scene.add(m);
  trailPool.push({ mesh: m, life: 0 });
}
let trailCooldown = 0;
let windTrailCd = 0;

function spawnTrailGhost(px, py) {
  for (const t of trailPool) {
    if (t.life > 0) continue;
    t.mesh.visible = true;
    t.mesh.position.set(px, py + 0.9, 0);
    t.mesh.material.opacity = 0.35;
    t.life = 0.2;
    break;
  }
}

function updateTrail(dt) {
  for (const t of trailPool) {
    if (t.life <= 0) continue;
    t.life -= dt;
    t.mesh.material.opacity = Math.max(0, t.life / 0.2 * 0.35);
    if (t.life <= 0) t.mesh.visible = false;
  }
}

// ── rainbow trail for star invincibility ──
const RAINBOW_POOL = isMobile ? 6 : 12;
const rainbowPool = [];
for (let i = 0; i < RAINBOW_POOL; i++) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 6, 4),
    new THREE.MeshBasicMaterial({ color: 0xffee00, transparent: true, opacity: 0 })
  );
  m.visible = false;
  scene.add(m);
  rainbowPool.push({ mesh: m, life: 0 });
}
let rainbowCd = 0;

function spawnRainbow(px, py, t) {
  for (const r of rainbowPool) {
    if (r.life > 0) continue;
    r.mesh.visible = true;
    r.mesh.position.set(px, py + 0.5 + Math.random() * 1.0, (Math.random() - 0.5) * 0.5);
    r.mesh.material.color.setHSL((t * 2 + Math.random()) % 1, 1, 0.5);
    r.mesh.material.opacity = 0.6;
    r.life = 0.4;
    break;
  }
}

function updateRainbow(dt) {
  for (const r of rainbowPool) {
    if (r.life <= 0) continue;
    r.life -= dt;
    r.mesh.material.opacity = Math.max(0, r.life / 0.4 * 0.6);
    r.mesh.position.y += dt * 1.5;
    r.mesh.scale.setScalar(1 - (1 - r.life / 0.4) * 0.5);
    if (r.life <= 0) r.mesh.visible = false;
  }
}

// ── game state ──
let gameState = 'title';
let currentLevel = 1;
let lives = 3;
let score = 0;
let stateTimer = 0;
let levelTimer = 0;
let isPaused = false;
let prevGameState = 'playing';
let audioStarted = false;

// stats for recap
let levelStats = { donutsCollected: 0, donutsTotal: 0, ghostsKilled: 0, crystalFound: false, bonus: 0 };

// outfit state
let currentOutfit = 'default';
let unlockedOutfits = new Set(['default', 'princess', 'ninja', 'panda', 'rainbow']);
let totalCrystals = 0;
try {
  currentOutfit = localStorage.getItem('sf_outfit') || 'default';
  totalCrystals = parseInt(localStorage.getItem('sf_crystals') || '0') || 0;
  if (totalCrystals >= 5) unlockedOutfits.add('dolce');
} catch (e) { /* noop */ }

let bestScore = 0;
try { bestScore = parseInt(localStorage.getItem('superfrancesca_best') || '0') || 0; } catch (e) { /* noop */ }

function saveBest() {
  if (score > bestScore) {
    bestScore = score;
    try { localStorage.setItem('superfrancesca_best', bestScore); } catch (e) { /* noop */ }
    return true;
  }
  return false;
}

function saveOutfit() {
  try { localStorage.setItem('sf_outfit', currentOutfit); } catch (e) { /* noop */ }
}

function saveCrystals() {
  try { localStorage.setItem('sf_crystals', totalCrystals); } catch (e) { /* noop */ }
}

function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* noop */ }
}

function shakeCamera(intensity) {
  camShake.intensity = Math.max(camShake.intensity, intensity);
}

// ── input ──
const keys = { left: false, right: false, jump: false, dash: false };

window.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') keys.jump = true;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    if (!keys.dash && gameState === 'playing') {
      keys.dash = true;
      if (player.tryDash()) { audio.playDash(); }
    }
  }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'Space' || e.code === 'ArrowUp') handleAction();
});

window.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') keys.jump = false;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.dash = false;
});

function handleAction() {
  if (!audioStarted) {
    audio.init();
    audio.playBGM();
    audioStarted = true;
  }
  if (gameState === 'title') startGame();
  else if (gameState === 'paused') togglePause();
  else if (gameState === 'gameover' || gameState === 'win') startGame();
  else if (gameState === 'recap') advanceFromRecap();
}

function showOutfitScreen() {
  gameState = 'outfit';
  ui.showOutfitScreen(OUTFITS, currentOutfit, unlockedOutfits, id => {
    currentOutfit = id;
    applyOutfit(player.mesh, id);
    saveOutfit();
  }, () => {
    gameState = 'title';
    ui.showTitle(showOutfitScreen);
  });
}

// ── overlay / touch ──
const overlay = document.getElementById('overlay');
overlay.addEventListener('touchstart', e => { e.preventDefault(); handleAction(); }, { passive: false });
overlay.addEventListener('click', () => handleAction());

// ── touch controls ──
const touchDiv = document.createElement('div');
touchDiv.id = 'touch-controls';
touchDiv.innerHTML = `
  <div class="tc-left">
    <button id="btn-left" aria-label="Sinistra">◀</button>
    <button id="btn-right" aria-label="Destra">▶</button>
  </div>
  <div class="tc-right">
    <button id="btn-jump" aria-label="Salta">SALTA</button>
    <button id="btn-dash" aria-label="Scatto">DASH</button>
  </div>`;
document.body.appendChild(touchDiv);

function bindTouch(id, key) {
  const btn = document.getElementById(id);
  if (!btn) return;
  let pressed = false;
  function setPressed(val) {
    pressed = val;
    keys[key] = val;
    btn.classList.toggle('pressed', val);
  }
  btn.addEventListener('touchstart', e => {
    e.preventDefault(); e.stopPropagation();
    setPressed(true);
    if (key === 'jump') handleAction();
    if (key === 'dash' && gameState === 'playing') {
      if (player.tryDash()) audio.playDash();
    }
  }, { passive: false });
  btn.addEventListener('touchend', e => { e.preventDefault(); setPressed(false); }, { passive: false });
  btn.addEventListener('touchcancel', e => { e.preventDefault(); setPressed(false); }, { passive: false });
  btn.addEventListener('mousedown', e => {
    e.preventDefault(); setPressed(true);
    if (key === 'jump') handleAction();
    if (key === 'dash' && gameState === 'playing') {
      if (player.tryDash()) audio.playDash();
    }
  });
  btn.addEventListener('mouseup', () => setPressed(false));
  btn.addEventListener('mouseleave', () => { if (pressed) setPressed(false); });
}
bindTouch('btn-left', 'left');
bindTouch('btn-right', 'right');
bindTouch('btn-jump', 'jump');
bindTouch('btn-dash', 'dash');

// ── pause ──
const pauseBtn = document.getElementById('pause-btn');
pauseBtn.addEventListener('click', togglePause);
pauseBtn.addEventListener('touchend', e => { e.preventDefault(); togglePause(); }, { passive: false });

function togglePause() {
  if (gameState === 'playing') {
    prevGameState = gameState;
    gameState = 'paused';
    isPaused = true;
    ui.setPauseIcon(false);
    ui.showPause();
  } else if (gameState === 'paused') {
    gameState = prevGameState;
    isPaused = false;
    ui.setPauseIcon(true);
    ui.hideOverlay();
  }
}

// ── start / lose ──
function startGame() {
  lives = 3; score = 0; currentLevel = 1;
  totalCrystals = parseInt(localStorage.getItem('sf_crystals') || '0') || 0;
  ui.hideOverlay();
  level.load(1);
  const plat0 = level.platforms[0];
  player.reset(plat0.x, plat0.y + plat0.h / 2);
  applyOutfit(player.mesh, currentOutfit);
  camera.position.set(
    player.mesh.position.x + CAM_OFFSET.x,
    player.mesh.position.y + CAM_OFFSET.y,
    player.mesh.position.z + CAM_OFFSET.z
  );
  gameState = 'playing';
  isPaused = false;
  ui.showPauseBtn();
  ui.setPauseIcon(true);
  ui.updateHUD(lives, score, currentLevel, bestScore);
  ui.hideBossHP();
  levelTimer = 0;
  resetLevelStats();
}

function resetLevelStats() {
  levelStats = { donutsCollected: 0, donutsTotal: level.donuts.length, ghostsKilled: 0, crystalFound: false, bonus: 0 };
}

function loseLife() {
  if (player.absorbHit()) {
    audio.playShield();
    shakeCamera(0.15);
    spawnParticles3D(player.mesh.position.x, player.mesh.position.y + 1, 0, 0x60a5fa, 10, 4);
    ui.showPopup('SCUDO!', '#60a5fa');
    return;
  }
  lives--;
  vibrate(200);
  audio.playLifeLost();
  shakeCamera(0.3);
  ui.updateHUD(lives, score, currentLevel, bestScore);
  if (lives <= 0) {
    gameState = 'gameover';
    const isNew = saveBest();
    ui.hidePauseBtn();
    ui.hideBossHP();
    ui.showGameOver(score, bestScore, isNew);
  } else {
    const plat0 = level.platforms[0];
    player.respawn(plat0.x, plat0.y + plat0.h / 2);
  }
}

function advanceFromRecap() {
  currentLevel++;
  level.load(currentLevel);
  const plat0 = level.platforms[0];
  player.reset(plat0.x, plat0.y + plat0.h / 2);
  applyOutfit(player.mesh, currentOutfit);
  camera.position.set(
    player.mesh.position.x + CAM_OFFSET.x,
    player.mesh.position.y + CAM_OFFSET.y,
    player.mesh.position.z + CAM_OFFSET.z
  );
  gameState = 'playing';
  levelTimer = 0;
  resetLevelStats();
  ui.hideOverlay();
  ui.updateHUD(lives, score, currentLevel, bestScore);
  if (level.boss) ui.showBossHP(level.boss.hp, level.boss.maxHp);
}

// ── resize ──
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  if (composer) composer.setSize(w, h);
}
window.addEventListener('resize', onResize);

// ── game loop ──
let prevTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - prevTime) / 1000, 0.05);
  prevTime = now;
  const t = now * 0.001;

  ui.tickPopup();
  updateParticles3D(dt);
  updateTrail(dt);
  updateRainbow(dt);
  level.update(dt, t, camera.position.x);

  // ── level clear transition ──
  if (gameState === 'levelclear') {
    stateTimer -= dt;
    if (stateTimer <= 0) {
      if (currentLevel >= MAX_LEVEL) {
        gameState = 'win';
        const isNew = saveBest();
        ui.hidePauseBtn();
        ui.hideBossHP();
        ui.showWin(score, bestScore, isNew);
        audio.playLevelComplete();
      } else {
        gameState = 'recap';
        ui.showRecap({
          level: currentLevel,
          donutsCollected: levelStats.donutsCollected,
          donutsTotal: levelStats.donutsTotal,
          ghostsKilled: levelStats.ghostsKilled,
          time: Math.floor(levelTimer),
          bonus: levelStats.bonus,
          crystalFound: levelStats.crystalFound
        });
      }
    }
  }

  if (gameState !== 'playing') {
    if (gameState !== 'paused') renderScene(dt, t);
    else { if (composer) composer.render(); else renderer.render(scene, camera); }
    return;
  }

  levelTimer += dt;
  ui.updateStarTimer(player.starInvincible);
  ui.updateDashCooldown(player.getDashCooldownProgress());

  // rainbow outfit
  updateRainbowOutfit(player.mesh, t);

  // ── player update ──
  const landedPlat = player.update(dt, t, keys, level.platforms);

  // ── dash trail ──
  if (player.isDashing) {
    trailCooldown -= dt;
    if (trailCooldown <= 0) {
      spawnTrailGhost(player.mesh.position.x, player.mesh.position.y);
      trailCooldown = 0.03;
    }
  }

  // ── rainbow trail during star invincibility ──
  if (player.starInvincible > 0) {
    rainbowCd -= dt;
    if (rainbowCd <= 0) {
      spawnRainbow(player.mesh.position.x, player.mesh.position.y, t);
      rainbowCd = 0.05;
    }
  }

  // wind trail while running fast
  if (player.onGround && Math.abs(player.vx) > 3) {
    windTrailCd -= dt;
    if (windTrailCd <= 0) {
      const wdir = player.vx > 0 ? -1 : 1;
      spawnParticles3D(
        player.mesh.position.x + wdir * 0.3, player.mesh.position.y + 0.5, 0,
        0xffffff, 1, 1, 'wind'
      );
      windTrailCd = 0.06;
    }
  }

  // landing puff
  if (player.justLanded) {
    const puffCount = isMobile ? 4 : 8;
    spawnParticles3D(
      player.mesh.position.x, player.mesh.position.y + 0.1, 0,
      0xc8b090, puffCount, 3, 'landing'
    );
  }

  // platform-specific feedback on landing
  if (landedPlat && player.justLanded) {
    const ct = CTYPE[landedPlat.type];
    if (landedPlat.type === 'trampoline') {
      if (ct.label) ui.showPopup(ct.label, ct.labelColor);
      audio.playTrampoline();
    }
    if (landedPlat.type === 'fragile' && landedPlat.jumpsLeft !== undefined) {
      landedPlat.jumpsLeft--;
      if (landedPlat.jumpsLeft <= 1) { landedPlat.shaking = true; ui.showPopup('FRAGILE!', '#e74c3c'); }
      if (landedPlat.jumpsLeft <= 0 && !landedPlat.falling) {
        landedPlat.falling = true; landedPlat.shaking = false;
        landedPlat.mesh.position.x = landedPlat.x;
      }
    }
    if (landedPlat.type === 'speed' && ct.label) ui.showPopup(ct.label, ct.labelColor);
    if (landedPlat.type === 'ice' && ct.label) ui.showPopup(ct.label, ct.labelColor);
    if (landedPlat.type === 'sticky' && ct.label) ui.showPopup(ct.label, ct.labelColor);
    if (landedPlat.type === 'bonus' && ct.label) ui.showPopup(ct.label, ct.labelColor);

    shakeCamera(0.08);
  }

  if (player.justJumped) {
    audio.playJump();
  }

  // ── fall death ──
  if (player.mesh.position.y < GROUND_Y - 5) {
    loseLife();
  }

  // ── magnet attraction ──
  if (player.magnetTimer > 0) {
    const magnetRange = 4;
    for (const d of level.donuts) {
      if (d.collected) continue;
      const dx = player.mesh.position.x - d.mesh.position.x;
      const dy = (player.mesh.position.y + 1) - d.mesh.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < magnetRange && dist > 0.1) {
        const pull = 6 * dt / dist;
        d.mesh.position.x += dx * pull;
        d.mesh.position.y += dy * pull;
      }
    }
  }

  // ── donut collection ──
  let allCollected = true;
  for (const d of level.donuts) {
    if (d.collected) continue;
    allCollected = false;
    const dx = player.mesh.position.x - d.mesh.position.x;
    const dy = (player.mesh.position.y + 1) - d.mesh.position.y;
    const dz = player.mesh.position.z - d.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 1.0) {
      d.collected = true;
      d.mesh.visible = false;
      const pts = d.isBonus ? 30 : 10;
      score += pts;
      levelStats.donutsCollected++;
      ui.updateHUD(lives, score, currentLevel, bestScore);
      vibrate(50);
      audio.playDonut();
      spawnParticles3D(d.mesh.position.x, d.mesh.position.y, d.mesh.position.z,
        d.isBonus ? 0x4ade80 : 0xfbbf24, 12, 5);
      spawnParticles3D(d.mesh.position.x, d.mesh.position.y, d.mesh.position.z,
        0xffffff, 6, 3);
      ui.showPopup('+' + pts, d.isBonus ? '#4ade80' : '#fbbf24');
    }
  }

  // level clear: all donuts collected AND boss dead (if exists)
  const bossCleared = !level.boss || !level.boss.alive;
  if (allCollected && level.donuts.length > 0 && bossCleared) {
    gameState = 'levelclear';
    stateTimer = 2.0;
    let bonus = 0;
    if (levelTimer < 30) bonus = 100;
    else if (levelTimer < 60) bonus = 50;
    else if (levelTimer < 90) bonus = 20;
    levelStats.bonus = bonus;
    if (bonus > 0) { score += bonus; ui.updateHUD(lives, score, currentLevel, bestScore); ui.showPopup('VELOCE! +' + bonus, '#fde68a'); }
    else { ui.showLevelComplete(currentLevel); }
    audio.playLevelComplete();
    spawnParticles3D(player.mesh.position.x, player.mesh.position.y + 1, 0, 0xf472b6, 20, 6);
    vibrate([50, 30, 50, 30, 50]);
  }

  // ── star pickup ──
  for (const s of level.stars) {
    if (s.collected) continue;
    const dx = player.mesh.position.x - s.mesh.position.x;
    const dy = (player.mesh.position.y + 1) - s.mesh.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1.0) {
      s.collected = true;
      s.mesh.visible = false;
      player.starInvincible = 5.0;
      player.invincible = 0;
      audio.playStar();
      ui.flash(0.15);
      spawnParticles3D(s.mesh.position.x, s.mesh.position.y, 0, 0xffee00, 16, 6);
      ui.showPopup('⭐ INVINCIBILE!', '#ffee00');
      vibrate([50, 30, 50]);
      ui.updateStarTimer(player.starInvincible);
    }
  }

  // ── crystal pickup ──
  for (const c of level.crystals) {
    if (c.collected) continue;
    const dx = player.mesh.position.x - c.mesh.position.x;
    const dy = (player.mesh.position.y + 1) - c.mesh.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1.0) {
      c.collected = true;
      c.mesh.visible = false;
      score += 100;
      totalCrystals++;
      levelStats.crystalFound = true;
      saveCrystals();
      if (totalCrystals >= 5 && !unlockedOutfits.has('dolce')) {
        unlockedOutfits.add('dolce');
        ui.showPopup('🍩 OUTFIT DOLCE SBLOCCATO!', '#fbbf24');
      } else {
        ui.showPopup('💎 CRISTALLO! +100', '#a78bfa');
      }
      audio.playCrystal();
      ui.flash(0.1);
      shakeCamera(0.15);
      spawnParticles3D(c.mesh.position.x, c.mesh.position.y, 0, 0xa78bfa, 16, 5);
      ui.updateHUD(lives, score, currentLevel, bestScore);
      vibrate([50, 30, 50]);
    }
  }

  // ── powerup pickup ──
  for (const pu of level.powerups) {
    if (pu.collected) continue;
    const dx = player.mesh.position.x - pu.mesh.position.x;
    const dy = (player.mesh.position.y + 1) - pu.mesh.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1.0) {
      pu.collected = true;
      pu.mesh.visible = false;
      audio.playPowerup();
      vibrate(50);
      spawnParticles3D(pu.mesh.position.x, pu.mesh.position.y, 0, 0xffffff, 10, 4);
      if (pu.type === 'magnet') {
        player.magnetTimer = 8;
        ui.showPopup('🧲 CALAMITA! 8s', '#f472b6');
      } else if (pu.type === 'feather') {
        player.doubleJumpTimer = 15;
        player.hasDoubleJump = true;
        player.doubleJumpUsed = false;
        ui.showPopup('🪶 DOPPIO SALTO! 15s', '#7dd3fc');
      } else if (pu.type === 'shield') {
        player.hasShield = true;
        if (!player.shieldMesh) {
          player.shieldMesh = buildShieldBubble();
          scene.add(player.shieldMesh);
        }
        ui.showPopup('🛡 SCUDO!', '#60a5fa');
      }
    }
  }

  // ── ghost collision ──
  const allGhosts = [...level.ghosts, ...level.miniGhosts];
  for (const g of allGhosts) {
    if (!g.alive) continue;
    const gx = g.mesh.position.x, gy = g.mesh.position.y;
    const dx = player.mesh.position.x - gx;
    const dy = (player.mesh.position.y + 1) - gy;
    const dz = player.mesh.position.z - g.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 0.9) {
      if (player.vy < -1 && player.mesh.position.y > gy - 0.3) {
        g.alive = false;
        g.mesh.visible = false;
        player.vy = JUMP_FORCE * 0.5;
        score += 50;
        levelStats.ghostsKilled++;
        ui.updateHUD(lives, score, currentLevel, bestScore);
        audio.playEnemyKill();
        spawnParticles3D(gx, gy, 0, 0xc4b5fd, 10, 4);
        ui.showPopup('+50', '#c4b5fd');
      } else if (player.isDashing && player.hasShield) {
        g.alive = false; g.mesh.visible = false;
        score += 50;
        levelStats.ghostsKilled++;
        ui.updateHUD(lives, score, currentLevel, bestScore);
        audio.playEnemyKill();
        spawnParticles3D(gx, gy, 0, 0x60a5fa, 10, 4);
      } else if (player.invincible <= 0 && player.starInvincible <= 0) {
        loseLife();
        break;
      } else if (player.starInvincible > 0) {
        g.alive = false; g.mesh.visible = false;
        score += 50;
        levelStats.ghostsKilled++;
        ui.updateHUD(lives, score, currentLevel, bestScore);
        audio.playEnemyKill();
        spawnParticles3D(gx, gy, 0, 0xffee00, 10, 4);
        ui.showPopup('+50 ⭐', '#ffee00');
      }
    }
  }

  // ── boss logic ──
  if (level.boss && level.boss.alive) {
    const miniSpawn = level.boss.update(dt, t, player.mesh.position.x);
    if (miniSpawn) {
      level.spawnMiniGhost(miniSpawn.x, miniSpawn.y);
    }

    ui.showBossHP(level.boss.hp, level.boss.maxHp);

    // player stomps boss
    const bh = level.boss.getHitbox();
    const bpx = player.mesh.position.x, bpy = player.mesh.position.y;
    const bdx = bpx - bh.x, bdy = (bpy + 1) - bh.y;
    const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
    if (bdist < bh.w) {
      if (player.vy < -1 && bpy > bh.y - 0.5) {
        const dead = level.boss.hit();
        player.vy = JUMP_FORCE * 0.7;
        audio.playBossHit();
        shakeCamera(0.5);
        ui.flash(0.1);
        spawnParticles3D(bh.x, bh.y, 0, 0xa855f7, 15, 6);
        if (dead) {
          audio.playBossDeath();
          shakeCamera(1.0);
          ui.flash(0.3);
          ui.hideBossHP();
          score += 200;
          ui.updateHUD(lives, score, currentLevel, bestScore);
          ui.showPopup('👑 BOSS SCONFITTO! +200', '#ffd700');
          spawnParticles3D(bh.x, bh.y, 0, 0xffd700, 25, 8);
        }
      } else if (player.invincible <= 0 && player.starInvincible <= 0 && level.boss.invulnerable <= 0) {
        loseLife();
      }
    }

    // shockwave
    if (level.boss.state === 'shockwave' && level.boss.stateTimer > 0.5) {
      const sdist = Math.abs(player.mesh.position.x - level.boss.mesh.position.x);
      if (sdist < 8 && player.onGround) {
        player.vy = JUMP_FORCE * 0.3;
        player.onGround = false;
        shakeCamera(0.2);
      }
    }
  }

  renderScene(dt, t);
}

function renderScene(dt, t) {
  // camera follow with separate Y smoothing for weight
  const targetX = player.mesh.position.x + CAM_OFFSET.x;
  const targetY = player.mesh.position.y + CAM_OFFSET.y;
  const targetZ = player.mesh.position.z + CAM_OFFSET.z;
  camera.position.x += (targetX - camera.position.x) * 0.1;
  camera.position.y += (targetY - camera.position.y) * 0.04;
  camera.position.z += (targetZ - camera.position.z) * 0.1;

  // screen shake
  if (camShake.intensity > 0.001) {
    camera.position.x += (Math.random() - 0.5) * camShake.intensity * 2;
    camera.position.y += (Math.random() - 0.5) * camShake.intensity * 2;
    camShake.intensity *= Math.pow(0.01, dt);
  }

  camera.lookAt(
    player.mesh.position.x + CAM_LOOK_OFFSET.x,
    player.mesh.position.y + CAM_LOOK_OFFSET.y,
    CAM_LOOK_OFFSET.z
  );

  // dynamic camera lean/tilt for 3D depth perception
  const moveDir = player.vx || 0;
  const targetLeanY = moveDir * 0.015;
  camera.rotation.y += (targetLeanY - camera.rotation.y) * 0.05;

  const vertDir = player.vy || 0;
  const targetTiltX = -vertDir * 0.008;
  camera.rotation.x += (targetTiltX - camera.rotation.x) * 0.03;

  // lights follow player
  dirLight.position.x = player.mesh.position.x + 8;
  dirLight.target.position.x = player.mesh.position.x;
  dirLight.target.updateMatrixWorld();
  bounceLight.position.x = player.mesh.position.x;
  rimLight.position.x = player.mesh.position.x - 4;

  // update color grading time for film grain
  if (composer && composer._colorGradingPass) {
    composer._colorGradingPass.uniforms.uTime.value = t;
  }

  if (composer) composer.render();
  else renderer.render(scene, camera);
}

// ── start ──
applyOutfit(player.mesh, currentOutfit);
ui.showTitle(showOutfitScreen);
ui.updateHUD(lives, score, currentLevel, bestScore);
animate();
