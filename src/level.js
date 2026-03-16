import * as THREE from 'three';
import { buildCushion, CTYPE } from '../models/cushion.js';
import { buildDonut, buildStar, buildCrystal } from '../models/collectibles.js';
import { buildGhost } from '../models/enemies.js';
import { buildMagnet, buildFeather, buildShieldPickup } from '../models/powerups.js';
import { Boss } from '../models/boss.js';
import { generateGroundTexture, generateFabricTexture, generateEnvMap } from '../textures/generator.js';

function hash(n) { return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(t) { return t * t * (3 - 2 * t); }
function noise1D(x) {
  const i = Math.floor(x);
  const f = smoothstep(x - i);
  return lerp(hash(i), hash(i + 1), f);
}

export { CTYPE };

export const GROUND_Y = -2;

const SKY_THEMES = [
  { top: new THREE.Color(0x4a90d9), bot: new THREE.Color(0xd4f1ff), fog: 0xb8e0f7, density: 0.010 },
  { top: new THREE.Color(0xff6b35), bot: new THREE.Color(0xffd89b), fog: 0xffe0b0, density: 0.014 },
  { top: new THREE.Color(0x0a0a2e), bot: new THREE.Color(0x1a1a4e), fog: 0x151540, density: 0.018 },
  { top: new THREE.Color(0xffa0c8), bot: new THREE.Color(0xffeedd), fog: 0xffd6e8, density: 0.008 },
  { top: new THREE.Color(0x60b0ff), bot: new THREE.Color(0xffffff), fog: 0xd0e8ff, density: 0.006 },
];

const LEVEL_DATA = {
  1: {
    plats: [
      { x: -5, y: -1.2, t: 'normal' }, { x: -2, y: -0.3, t: 'normal' },
      { x: 1.2, y: 0.5, t: 'trampoline' }, { x: 4.5, y: 0.0, t: 'fragile' },
      { x: 7.5, y: 1.0, t: 'speed' }, { x: 10.5, y: 0.3, t: 'ice' },
      { x: 13.5, y: 1.5, t: 'normal' }, { x: 16.5, y: 2.5, t: 'sticky' },
      { x: 19.5, y: 1.2, t: 'bonus' }, { x: 22.5, y: 2.2, t: 'trampoline' },
      { x: 25.5, y: 3.2, t: 'fragile' }, { x: 28.5, y: 2.5, t: 'normal' },
    ],
    donuts: [{ pi: 0 }, { pi: 2 }, { pi: 4 }, { pi: 6 }, { pi: 8 }, { pi: 9 }, { pi: 10 }, { pi: 11 }],
    ghosts: [{ pi: 4, spd: 1.2 }, { pi: 10, spd: 1.0 }],
    stars: [7],
    secret: { x: 30, y: 5.0 },
    powerups: [{ pi: 3, type: 'shield' }],
    moving: []
  },
  2: {
    plats: [
      { x: -5, y: -1.2, t: 'normal' }, { x: -1.5, y: 0.0, t: 'ice' },
      { x: 2, y: 0.8, t: 'fragile' }, { x: 5, y: 1.5, t: 'trampoline' },
      { x: 8, y: 0.5, t: 'speed' }, { x: 11, y: 1.8, t: 'normal' },
      { x: 14, y: 2.8, t: 'sticky' }, { x: 17, y: 1.5, t: 'bonus' },
      { x: 20, y: 2.5, t: 'fragile' }, { x: 23, y: 3.5, t: 'trampoline' },
      { x: 26, y: 2.0, t: 'normal' }, { x: 29, y: 3.0, t: 'speed' },
      { x: 32, y: 4.0, t: 'normal' }, { x: 35, y: 3.2, t: 'normal' },
    ],
    donuts: [
      { pi: 0 }, { pi: 1 }, { pi: 3 }, { pi: 4 }, { pi: 6 }, { pi: 7 },
      { pi: 9 }, { pi: 10 }, { pi: 12 }, { pi: 13 },
    ],
    ghosts: [{ pi: 2, spd: 1.3 }, { pi: 5, spd: 1.4 }, { pi: 10, spd: 1.2 }, { pi: 12, spd: 1.5 }],
    stars: [6, 11],
    secret: { x: 37, y: 5.5 },
    powerups: [{ pi: 5, type: 'magnet' }],
    moving: []
  },
  3: {
    plats: [
      { x: -5, y: -1.2, t: 'normal' }, { x: -1, y: 0.2, t: 'speed' },
      { x: 2.5, y: 1.2, t: 'fragile' }, { x: 5.5, y: 0.5, t: 'trampoline' },
      { x: 8.5, y: 2.0, t: 'sticky' }, { x: 11.5, y: 1.0, t: 'fragile' },
      { x: 14.5, y: 2.5, t: 'trampoline' }, { x: 17.5, y: 3.5, t: 'ice' },
      { x: 20.5, y: 2.0, t: 'bonus' }, { x: 23.5, y: 3.0, t: 'normal' },
      { x: 26.5, y: 4.0, t: 'speed' }, { x: 29.5, y: 3.0, t: 'sticky' },
      { x: 32.5, y: 4.5, t: 'trampoline' }, { x: 35.5, y: 3.5, t: 'normal' },
      { x: 38.5, y: 4.8, t: 'bonus' },
    ],
    donuts: [
      { pi: 0 }, { pi: 1 }, { pi: 2 }, { pi: 4 }, { pi: 5 }, { pi: 6 },
      { pi: 7 }, { pi: 8 }, { pi: 10 }, { pi: 11 }, { pi: 13 }, { pi: 14 },
    ],
    ghosts: [
      { pi: 2, spd: 1.5 }, { pi: 5, spd: 1.6 }, { pi: 7, spd: 1.4 },
      { pi: 9, spd: 1.5 }, { pi: 11, spd: 1.7 }, { pi: 13, spd: 1.3 },
    ],
    stars: [4, 10],
    secret: { x: 41, y: 6.0 },
    powerups: [{ pi: 1, type: 'feather' }],
    moving: []
  },
  4: {
    plats: [
      { x: -5, y: -1.2, t: 'normal' }, { x: -1, y: 0.0, t: 'speed' },
      { x: 3, y: 1.0, t: 'normal' }, { x: 6.5, y: 0.2, t: 'trampoline' },
      { x: 10, y: 1.5, t: 'ice' }, { x: 13.5, y: 2.5, t: 'fragile' },
      { x: 17, y: 1.8, t: 'sticky' }, { x: 20.5, y: 3.0, t: 'bonus' },
      { x: 24, y: 2.0, t: 'trampoline' }, { x: 27.5, y: 3.5, t: 'normal' },
      { x: 31, y: 2.5, t: 'fragile' }, { x: 34.5, y: 4.0, t: 'speed' },
      { x: 38, y: 3.0, t: 'normal' }, { x: 41.5, y: 4.5, t: 'trampoline' },
      { x: 45, y: 3.5, t: 'bonus' }, { x: 48.5, y: 5.0, t: 'normal' },
    ],
    donuts: [
      { pi: 0 }, { pi: 1 }, { pi: 2 }, { pi: 3 }, { pi: 5 }, { pi: 6 },
      { pi: 7 }, { pi: 8 }, { pi: 10 }, { pi: 11 }, { pi: 12 }, { pi: 14 }, { pi: 15 },
    ],
    ghosts: [
      { pi: 3, spd: 1.5 }, { pi: 5, spd: 1.6 }, { pi: 8, spd: 1.8 },
      { pi: 10, spd: 1.5 }, { pi: 12, spd: 1.7 }, { pi: 14, spd: 1.4 },
    ],
    stars: [7, 13],
    secret: { x: 51, y: 6.5 },
    powerups: [{ pi: 2, type: 'shield' }, { pi: 9, type: 'magnet' }],
    moving: [
      { x: 15, y: 1.0, axis: 'x', range: 3, speed: 1.5 },
      { x: 36, y: 3.5, axis: 'y', range: 2, speed: 1.0 },
    ]
  },
  5: {
    plats: [
      { x: -5, y: -1.2, t: 'normal' }, { x: -1, y: 0.5, t: 'speed' },
      { x: 3, y: 1.5, t: 'fragile' }, { x: 7, y: 0.8, t: 'trampoline' },
      { x: 11, y: 2.5, t: 'ice' }, { x: 15, y: 1.5, t: 'sticky' },
      { x: 19, y: 3.0, t: 'normal' }, { x: 23, y: 2.0, t: 'trampoline' },
      { x: 27, y: 4.0, t: 'bonus' }, { x: 31, y: 3.0, t: 'fragile' },
      { x: 35, y: 4.5, t: 'speed' }, { x: 39, y: 3.5, t: 'normal' },
      { x: 43, y: 5.0, t: 'trampoline' }, { x: 47, y: 4.0, t: 'normal' },
      { x: 51, y: 5.5, t: 'normal' }, { x: 55, y: 4.5, t: 'normal' },
    ],
    donuts: [
      { pi: 0 }, { pi: 1 }, { pi: 2 }, { pi: 3 }, { pi: 4 }, { pi: 6 },
      { pi: 7 }, { pi: 8 }, { pi: 9 }, { pi: 10 }, { pi: 11 }, { pi: 13 }, { pi: 14 },
    ],
    ghosts: [
      { pi: 2, spd: 1.7 }, { pi: 4, spd: 1.8 }, { pi: 6, spd: 1.5 },
      { pi: 9, spd: 2.0 }, { pi: 11, spd: 1.8 }, { pi: 13, spd: 1.6 },
    ],
    stars: [6, 12],
    secret: { x: 58, y: 7.0 },
    powerups: [{ pi: 1, type: 'feather' }, { pi: 8, type: 'shield' }],
    moving: [
      { x: 21, y: 2.5, axis: 'x', range: 3, speed: 2.0 },
      { x: 33, y: 4.0, axis: 'y', range: 2.5, speed: 1.2 },
      { x: 49, y: 5.0, axis: 'x', range: 4, speed: 1.8 },
    ],
    boss: { x: 55, y: 3.0 }
  }
};

const PW = 2.8, PH = 0.5, PD = 2.0;

export class Level {
  constructor(scene, isMobile) {
    this.scene = scene;
    this.isMobile = !!isMobile;
    this.platforms = [];
    this.donuts = [];
    this.ghosts = [];
    this.stars = [];
    this.crystals = [];
    this.powerups = [];
    this.boss = null;
    this.miniGhosts = [];
    this.envObjects = [];
    this.fabricTex = generateFabricTexture();
    this.groundTex = generateGroundTexture();
    this.envMap = generateEnvMap();

    this.skyMat = null;
    this.skyTransition = { active: false, timer: 0, duration: 2.0, fromTop: new THREE.Color(), fromBot: new THREE.Color(), toTop: new THREE.Color(), toBot: new THREE.Color() };
    this.nightStars = [];
    this.clouds = [];
    this.grassClusters = [];
    this.flowersGroup = [];
    this.treesGroup = [];
    this.bgLayers = { near: [], mid: [], far: [] };
    this.dustMotes = [];

    this._buildEnvironment();
  }

  _buildEnvironment() {
    const scene = this.scene;

    this.skyMat = new THREE.ShaderMaterial({
      depthWrite: false,
      uniforms: {
        uTopColor: { value: new THREE.Color(0x4a90d9) },
        uBottomColor: { value: new THREE.Color(0xd4f1ff) }
      },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.9999,1.0);}`,
      fragmentShader: `uniform vec3 uTopColor;uniform vec3 uBottomColor;varying vec2 vUv;void main(){gl_FragColor=vec4(mix(uBottomColor,uTopColor,vUv.y),1.0);}`
    });
    const skyMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.skyMat);
    skyMesh.frustumCulled = false;
    scene.add(skyMesh);

    scene.fog = new THREE.FogExp2(0xb8e0f7, 0.010);
    scene.environment = this.envMap;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 40, 80, 16),
      new THREE.MeshStandardMaterial({ color: 0x4abe4a, roughness: 0.85, map: this.groundTex })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = GROUND_Y;
    ground.receiveShadow = true;
    const gPos = ground.geometry.attributes.position;
    for (let i = 0; i < gPos.count; i++) {
      const gx = gPos.getX(i), gz = gPos.getY(i);
      const n = noise1D(gx * 0.15) * noise1D(gz * 0.3 + 42) * 0.5;
      gPos.setZ(i, gPos.getZ(i) + n);
    }
    ground.geometry.computeVertexNormals();
    scene.add(ground);
    this.envObjects.push(ground);

    const hillMat = new THREE.MeshStandardMaterial({ color: 0x3a9a3a, roughness: 0.9 });
    const hillDefs = [
      { x: -8, z: -4, sx: 3, sy: 1.2, sz: 2.5 }, { x: 5, z: 4, sx: 2.5, sy: 1, sz: 2 },
      { x: 15, z: -5, sx: 4, sy: 1.5, sz: 3 }, { x: 25, z: 3.5, sx: 3, sy: 1.1, sz: 2.5 },
      { x: 35, z: -4.5, sx: 3.5, sy: 1.3, sz: 2.8 }, { x: 0, z: 5, sx: 2, sy: 0.8, sz: 2 },
      { x: 20, z: -3.5, sx: 2.5, sy: 0.9, sz: 2 }, { x: 40, z: 4, sx: 3, sy: 1, sz: 2.5 },
    ];
    for (const h of hillDefs) {
      const hm = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), hillMat);
      hm.scale.set(h.sx, h.sy, h.sz);
      hm.position.set(h.x, GROUND_Y + h.sy * 0.15, h.z);
      hm.receiveShadow = true;
      scene.add(hm);
      this.envObjects.push(hm);
    }

    const grassGeo = new THREE.ConeGeometry(0.04, 0.28, 4);
    const grassGreens = [0x3da83d, 0x45c045, 0x2d8a2d, 0x55d055, 0x38a038];
    const grassMats = grassGreens.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
    const grassCount = this.isMobile ? 15 : 45;
    for (let i = 0; i < grassCount; i++) {
      const g = new THREE.Group();
      const count = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < count; j++) {
        const blade = new THREE.Mesh(grassGeo, grassMats[(Math.random() * grassMats.length) | 0]);
        blade.position.set((Math.random() - 0.5) * 0.3, 0.12 + Math.random() * 0.06, (Math.random() - 0.5) * 0.3);
        blade.rotation.z = (Math.random() - 0.5) * 0.3;
        blade.scale.y = 0.8 + Math.random() * 0.6;
        g.add(blade);
      }
      g.position.set(-8 + Math.random() * 50, GROUND_Y, (Math.random() - 0.5) * 5);
      scene.add(g);
      this.grassClusters.push(g);
    }

    const treeDefs = [
      [-6, GROUND_Y, -6, 1.2], [8, GROUND_Y, -7, 1.5], [18, GROUND_Y, -5.5, 1.0],
      [30, GROUND_Y, -6.5, 1.4], [42, GROUND_Y, -5, 1.1], [12, GROUND_Y, 6, 0.9]
    ];
    for (const [x, y, z, s] of treeDefs) {
      const t = this._buildTree(x, y, z, s);
      scene.add(t);
      this.treesGroup.push(t);
    }

    const petalColors = [0xf472b6, 0xffffff, 0xfde047, 0x7dd3fc, 0xfb923c, 0xc084fc];
    const flowerCount = this.isMobile ? 6 : 14;
    for (let i = 0; i < flowerCount; i++) {
      const fx = -6 + Math.random() * 48;
      const fz = (Math.random() - 0.5) * 4;
      const f = this._buildFlower(fx, GROUND_Y, fz, petalColors);
      scene.add(f);
      this.flowersGroup.push(f);
    }

    const addBgHill = (layer, x, z, radius, sy, color) => {
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.95, envMapIntensity: 0.1 });
      const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 10), mat);
      m.scale.y = sy;
      m.position.set(x, GROUND_Y + radius * sy * 0.2, z);
      scene.add(m);
      layer.push({ mesh: m, baseX: x });
    };
    addBgHill(this.bgLayers.near, -10, -12, 4, 0.5, 0x4daa4d);
    addBgHill(this.bgLayers.near, 8, -13, 5, 0.45, 0x3d9a3d);
    addBgHill(this.bgLayers.near, 22, -11, 3.5, 0.55, 0x55bb55);
    addBgHill(this.bgLayers.near, 36, -12, 4.5, 0.5, 0x48a848);
    addBgHill(this.bgLayers.near, 50, -13, 4, 0.48, 0x42a242);
    addBgHill(this.bgLayers.mid, -5, -22, 7, 0.4, 0x6dbe8d);
    addBgHill(this.bgLayers.mid, 15, -20, 8, 0.45, 0x7dce9d);
    addBgHill(this.bgLayers.mid, 35, -21, 6.5, 0.42, 0x6db88d);
    addBgHill(this.bgLayers.mid, 55, -23, 7.5, 0.4, 0x75c095);
    addBgHill(this.bgLayers.far, 0, -32, 12, 0.35, 0xa8d8ea);
    addBgHill(this.bgLayers.far, 30, -35, 14, 0.3, 0xb0e0f0);
    addBgHill(this.bgLayers.far, 60, -33, 11, 0.32, 0xa0d0e5);

    const cloudDefs = [
      [-12, 10, -15, 1.0], [8, 12, -18, 1.2], [20, 9, -12, 0.8], [-18, 11, -10, 1.1],
      [0, 13, -20, 0.9], [30, 10, -16, 0.7], [-25, 12, -14, 1.3], [15, 14, -22, 0.6]
    ];
    for (const [x, y, z, s] of cloudDefs) {
      const c = this._buildCloud(x, y, z, s);
      scene.add(c);
      this.clouds.push(c);
    }

    const nightStarCount = this.isMobile ? 20 : 50;
    for (let i = 0; i < nightStarCount; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.05 + Math.random() * 0.08, 6, 4),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
      );
      s.position.set((Math.random() - 0.5) * 120, 8 + Math.random() * 20, -18 - Math.random() * 10);
      s.visible = false;
      scene.add(s);
      this.nightStars.push(s);
    }

    const dustGeo = new THREE.SphereGeometry(0.03, 4, 3);
    const dustCount = this.isMobile ? 6 : 15;
    for (let i = 0; i < dustCount; i++) {
      const dm = new THREE.Mesh(dustGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
      dm.position.set((Math.random() - 0.5) * 30, Math.random() * 8 + GROUND_Y, (Math.random() - 0.5) * 10);
      dm.visible = false;
      scene.add(dm);
      this.dustMotes.push({ mesh: dm, phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.5, baseY: dm.position.y });
    }
  }

  _buildTree(x, y, z, sc) {
    const g = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B5E3C, roughness: 0.85 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.5, 8), trunkMat);
    trunk.position.y = 0.75; trunk.castShadow = true; g.add(trunk);
    const leafMats = [
      new THREE.MeshStandardMaterial({ color: 0x3a9a3a, roughness: 0.8, envMapIntensity: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x5dbe5d, roughness: 0.8, envMapIntensity: 0.3 }),
    ];
    const puffs = [[0, 2.0, 0, 0.7], [0.3, 2.3, 0.15, 0.5], [-0.25, 2.35, -0.1, 0.45]];
    for (const [ox, oy, oz, r] of puffs) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), leafMats[(Math.random() * 2) | 0]);
      leaf.position.set(ox, oy, oz);
      leaf.scale.y = 0.75;
      leaf.castShadow = true;
      g.add(leaf);
    }
    g.position.set(x, y, z);
    g.scale.setScalar(sc || 1);
    return g;
  }

  _buildFlower(x, y, z, petalColors) {
    const g = new THREE.Group();
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3a8a3a, roughness: 0.8 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.4, 6), stemMat);
    stem.position.y = 0.2; g.add(stem);
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.4, emissive: 0xfbbf24, emissiveIntensity: 0.15 })
    );
    center.position.y = 0.42; g.add(center);
    const pc = petalColors[(Math.random() * petalColors.length) | 0];
    const pm = new THREE.MeshStandardMaterial({ color: pc, roughness: 0.5 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), pm);
      petal.position.set(Math.cos(a) * 0.09, 0.42, Math.sin(a) * 0.09);
      petal.scale.set(1, 0.6, 1);
      g.add(petal);
    }
    g.position.set(x, y, z);
    return g;
  }

  _buildCloud(x, y, z, scale) {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.95, transparent: true, opacity: 0.88, envMapIntensity: 0.2
    });
    const puffs = [
      [0, 0, 0, 1.4], [1.2, 0.1, 0.15, 1.1], [-1.0, 0.08, -0.1, 0.95],
      [0.5, 0.2, 0.3, 0.8], [-0.4, 0.18, -0.25, 0.7], [1.8, -0.05, 0, 0.6]
    ];
    for (const [ox, oy, oz, s] of puffs) {
      const sp = new THREE.Mesh(new THREE.SphereGeometry(s, 14, 10), m);
      sp.position.set(ox, oy, oz);
      sp.scale.y = 0.45;
      g.add(sp);
    }
    g.position.set(x, y, z);
    g.scale.setScalar(scale || 1);
    return g;
  }

  clear() {
    for (const p of this.platforms) this.scene.remove(p.mesh);
    for (const d of this.donuts) this.scene.remove(d.mesh);
    for (const g of this.ghosts) this.scene.remove(g.mesh);
    for (const s of this.stars) this.scene.remove(s.mesh);
    for (const c of this.crystals) this.scene.remove(c.mesh);
    for (const p of this.powerups) this.scene.remove(p.mesh);
    for (const mg of this.miniGhosts) this.scene.remove(mg.mesh);
    if (this.boss) { this.boss.remove(); this.boss = null; }
    this.platforms = []; this.donuts = []; this.ghosts = []; this.stars = [];
    this.crystals = []; this.powerups = []; this.miniGhosts = [];
  }

  load(n) {
    this.clear();
    const data = LEVEL_DATA[n] || LEVEL_DATA[1];

    for (const def of data.plats) {
      const p = buildCushion(def.x, def.y, 0, PW, PH, PD, def.t, this.fabricTex);
      if (def.t === 'fragile') { p.jumpsLeft = 3; p.shaking = false; }
      this.scene.add(p.mesh);
      this.platforms.push(p);
    }

    // moving platforms
    if (data.moving) {
      for (const def of data.moving) {
        const p = buildCushion(def.x, def.y, 0, PW, PH, PD, 'moving', this.fabricTex);
        p.movAxis = def.axis;
        p.movRange = def.range;
        p.movSpeed = def.speed;
        p.movBaseX = def.x;
        p.movBaseY = def.y;
        p.movPhase = 0;
        this.scene.add(p.mesh);
        this.platforms.push(p);
      }
    }

    for (const def of data.donuts) {
      const plat = this.platforms[def.pi];
      const isBonus = plat.type === 'bonus';
      const d = buildDonut(plat.x, plat.y + plat.h / 2 + 0.6, 0, isBonus);
      this.scene.add(d.mesh);
      this.donuts.push(d);
    }

    for (const def of data.ghosts) {
      const plat = this.platforms[def.pi];
      const g = buildGhost(plat.x, plat.y + plat.h / 2 + 0.55, 0, def.pi, def.spd);
      this.scene.add(g.mesh);
      this.ghosts.push(g);
    }

    for (const si of data.stars) {
      const plat = this.platforms[si];
      const s = buildStar(plat.x + 0.5, plat.y + plat.h / 2 + 0.9, 0);
      this.scene.add(s.mesh);
      this.stars.push(s);
    }

    // secret crystal
    if (data.secret) {
      const secretPlat = buildCushion(data.secret.x, data.secret.y, 0, PW * 0.8, PH, PD, 'normal', this.fabricTex);
      this.scene.add(secretPlat.mesh);
      this.platforms.push(secretPlat);
      const crystal = buildCrystal(data.secret.x, data.secret.y + PH / 2 + 0.6, 0);
      this.scene.add(crystal.mesh);
      this.crystals.push(crystal);
    }

    // powerups
    if (data.powerups) {
      for (const def of data.powerups) {
        const plat = this.platforms[def.pi];
        let pu;
        if (def.type === 'magnet') pu = buildMagnet(plat.x, plat.y + plat.h / 2 + 0.7, 0);
        else if (def.type === 'feather') pu = buildFeather(plat.x, plat.y + plat.h / 2 + 0.7, 0);
        else if (def.type === 'shield') pu = buildShieldPickup(plat.x, plat.y + plat.h / 2 + 0.7, 0);
        if (pu) {
          this.scene.add(pu.mesh);
          this.powerups.push(pu);
        }
      }
    }

    // boss for level 5
    if (data.boss) {
      this.boss = new Boss(this.scene, data.boss.x, data.boss.y);
    }

    // sky transition
    const theme = SKY_THEMES[n - 1] || SKY_THEMES[0];
    this.skyTransition.active = true;
    this.skyTransition.timer = 0;
    this.skyTransition.fromTop.copy(this.skyMat.uniforms.uTopColor.value);
    this.skyTransition.fromBot.copy(this.skyMat.uniforms.uBottomColor.value);
    this.skyTransition.toTop.copy(theme.top);
    this.skyTransition.toBot.copy(theme.bot);
    this.scene.fog.color.set(theme.fog);
    this.scene.fog.density = theme.density;
    this.nightStars.forEach(s => { s.visible = (n === 3); });
  }

  spawnMiniGhost(x, y) {
    const g = buildGhost(x, y, 0, -1, 0);
    g.isMini = true;
    g.vy = -3;
    g.vx = (Math.random() - 0.5) * 2;
    g.life = 4;
    this.scene.add(g.mesh);
    g.mesh.scale.setScalar(0.5);
    this.miniGhosts.push(g);
  }

  update(dt, t, camX) {
    // ── sky transition ──
    if (this.skyTransition.active) {
      this.skyTransition.timer += dt;
      const p = Math.min(this.skyTransition.timer / this.skyTransition.duration, 1);
      this.skyMat.uniforms.uTopColor.value.lerpColors(this.skyTransition.fromTop, this.skyTransition.toTop, p);
      this.skyMat.uniforms.uBottomColor.value.lerpColors(this.skyTransition.fromBot, this.skyTransition.toBot, p);
      if (p >= 1) this.skyTransition.active = false;
    }

    for (let i = 0; i < this.clouds.length; i++) {
      this.clouds[i].position.x += (0.002 + i * 0.0005) * (i % 2 === 0 ? 1 : -1);
      this.clouds[i].position.y += Math.sin(t * 0.2 + i * 1.3) * 0.0015;
      if (this.clouds[i].position.x > 35) this.clouds[i].position.x = -35;
      if (this.clouds[i].position.x < -35) this.clouds[i].position.x = 35;
    }

    for (let i = 0; i < this.nightStars.length; i++) {
      if (!this.nightStars[i].visible) continue;
      this.nightStars[i].material.opacity = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i * 0.7));
    }

    for (let i = 0; i < this.grassClusters.length; i++) {
      this.grassClusters[i].rotation.z = Math.sin(t * 2 + this.grassClusters[i].position.x * 0.5 + i * 0.3) * 0.08;
    }

    for (let i = 0; i < this.flowersGroup.length; i++) {
      this.flowersGroup[i].rotation.y = Math.sin(t * 1.2 + i * 1.7) * 0.15;
      this.flowersGroup[i].rotation.z = Math.sin(t * 0.8 + i * 2.1) * 0.05;
    }

    for (const h of this.bgLayers.near) h.mesh.position.x = h.baseX + camX * 0.3;
    for (const h of this.bgLayers.mid) h.mesh.position.x = h.baseX + camX * 0.15;
    for (const h of this.bgLayers.far) h.mesh.position.x = h.baseX + camX * 0.05;

    // ── platforms (including moving) ──
    for (const p of this.platforms) {
      // moving platform logic
      if (p.type === 'moving' && p.movAxis) {
        p.movPhase += dt * p.movSpeed;
        const offset = Math.sin(p.movPhase) * p.movRange;
        if (p.movAxis === 'x') {
          p.x = p.movBaseX + offset;
          p.mesh.position.x = p.x;
        } else {
          p.y = p.movBaseY + offset;
          p.mesh.position.y = p.y;
        }
      }

      p.squish *= 0.85;
      if (Math.abs(p.squish) < 0.001) p.squish = 0;
      p.mesh.children[0].scale.y = 1 - p.squish * 0.5;
      p.mesh.children[0].scale.x = 1 + p.squish * 0.12;
      p.mesh.children[0].scale.z = 1 + p.squish * 0.12;
      p.mesh.traverse(c => {
        if (c.userData && c.userData.isIcon) {
          c.position.y = p.h / 2 + 0.35 + Math.sin(t * 3 + p.x) * 0.12;
          c.rotation.y = t * 2;
        }
      });
      if (p.falling) {
        p.mesh.position.y -= dt * 6;
        p.mesh.rotation.z += dt * 2;
        if (p.mesh.position.y < GROUND_Y - 5) { this.scene.remove(p.mesh); p.falling = false; p.dead = true; }
      }
      if (p.shaking && !p.falling) {
        p.mesh.position.x = p.x + Math.sin(t * 25) * 0.06;
      }
    }

    for (const d of this.donuts) {
      if (!d.collected) {
        d.mesh.rotation.y = t * 2 + d.mesh.position.x;
        d.mesh.position.y += Math.sin(t * 3 + d.mesh.position.x * 2) * 0.003;
      }
    }

    for (const g of this.ghosts) {
      if (!g.alive) continue;
      const plat = this.platforms[g.platIdx];
      if (!plat || plat.dead) continue;
      g.mesh.position.x += g.speed * g.dir * dt;
      const halfW = plat.w / 2 - 0.4;
      if (g.mesh.position.x > plat.x + halfW) { g.mesh.position.x = plat.x + halfW; g.dir = -1; }
      if (g.mesh.position.x < plat.x - halfW) { g.mesh.position.x = plat.x - halfW; g.dir = 1; }
      g.mesh.position.y = plat.y + plat.h / 2 + 0.55 + Math.sin(t * 4 + g.mesh.position.x) * 0.15;
      g.mesh.rotation.y = g.dir > 0 ? 0 : Math.PI;

      const wavy = g.mesh.userData.wavyParts;
      if (wavy) {
        for (let w = 0; w < wavy.length; w++) {
          wavy[w].position.y = -0.65 + Math.sin(t * 6 + w * 1.5) * 0.06;
        }
      }
    }

    // ── mini ghosts from boss ──
    for (let i = this.miniGhosts.length - 1; i >= 0; i--) {
      const mg = this.miniGhosts[i];
      if (!mg.alive) { this.scene.remove(mg.mesh); this.miniGhosts.splice(i, 1); continue; }
      mg.life -= dt;
      mg.mesh.position.x += (mg.vx || 0) * dt;
      mg.mesh.position.y += (mg.vy || 0) * dt;
      mg.vy -= 5 * dt;
      if (mg.life <= 0 || mg.mesh.position.y < GROUND_Y - 3) {
        mg.alive = false;
        this.scene.remove(mg.mesh);
        this.miniGhosts.splice(i, 1);
      }
    }

    // ── crystals ──
    for (const c of this.crystals) {
      if (c.collected) continue;
      c.mesh.rotation.y = t * 2;
      c.mesh.position.y += Math.sin(t * 3) * 0.003;
      if (c.mesh.userData.sparkles) {
        for (const s of c.mesh.userData.sparkles) {
          s.material.opacity = 0.3 + 0.4 * Math.abs(Math.sin(t * 5 + s.position.x * 10));
          s.position.y += Math.sin(t * 4 + s.position.x * 8) * 0.002;
        }
      }
    }

    // ── powerups ──
    for (const p of this.powerups) {
      if (p.collected) continue;
      p.mesh.rotation.y = t * 2.5;
      p.mesh.position.y += Math.sin(t * 3.5 + p.mesh.position.x) * 0.003;
    }

    // ── dust motes ──
    for (const dm of this.dustMotes) {
      dm.mesh.visible = true;
      dm.mesh.position.x = camX + Math.sin(t * dm.speed + dm.phase) * 8;
      dm.mesh.position.y = dm.baseY + Math.sin(t * 0.5 + dm.phase * 2) * 1.5;
      dm.mesh.position.z = Math.sin(t * 0.3 + dm.phase * 3) * 3;
      const fadeDist = Math.abs(dm.mesh.position.x - camX);
      dm.mesh.material.opacity = Math.max(0, 0.25 - fadeDist * 0.02) * (0.5 + 0.5 * Math.sin(t * 2 + dm.phase));
    }

    for (const s of this.stars) {
      if (s.collected) continue;
      s.mesh.rotation.y = t * 3;
      s.mesh.position.y += Math.sin(t * 4 + s.mesh.position.x) * 0.003;
    }
  }
}
