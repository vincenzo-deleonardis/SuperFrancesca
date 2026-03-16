import * as THREE from 'three';
import { buildCushion, CTYPE } from '../models/cushion.js';
import { buildDonut, buildStar, buildCrystal } from '../models/collectibles.js';
import { buildGhost } from '../models/enemies.js';
import { buildMagnet, buildFeather, buildShieldPickup } from '../models/powerups.js';
import { Boss } from '../models/boss.js';
import { generateGroundTexture, generateFabricTexture, generateEnvMap, generateGroundNormalMap, generateFabricNormalMap } from '../textures/generator.js';

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
  { top: new THREE.Color(0x2a60b0), mid: new THREE.Color(0x4a90d9), horizon: new THREE.Color(0xc0dfff), bot: new THREE.Color(0xd4f1ff), fog: 0xb8e0f7, density: 0.010, sunPos: [0.7, 0.75], sunColor: new THREE.Color(0xfff5d0), sunIntensity: 0.5 },
  { top: new THREE.Color(0x552200), mid: new THREE.Color(0xff6b35), horizon: new THREE.Color(0xffaa55), bot: new THREE.Color(0xffd89b), fog: 0xffe0b0, density: 0.014, sunPos: [0.5, 0.35], sunColor: new THREE.Color(0xffcc44), sunIntensity: 0.8 },
  { top: new THREE.Color(0x050515), mid: new THREE.Color(0x0a0a2e), horizon: new THREE.Color(0x151535), bot: new THREE.Color(0x1a1a4e), fog: 0x151540, density: 0.018, sunPos: [0.3, 0.15], sunColor: new THREE.Color(0x8888cc), sunIntensity: 0.15 },
  { top: new THREE.Color(0xdd70a0), mid: new THREE.Color(0xffa0c8), horizon: new THREE.Color(0xffe0cc), bot: new THREE.Color(0xffeedd), fog: 0xffd6e8, density: 0.008, sunPos: [0.6, 0.65], sunColor: new THREE.Color(0xfff0e0), sunIntensity: 0.4 },
  { top: new THREE.Color(0x3080dd), mid: new THREE.Color(0x60b0ff), horizon: new THREE.Color(0xd0e8ff), bot: new THREE.Color(0xffffff), fog: 0xd0e8ff, density: 0.006, sunPos: [0.8, 0.8], sunColor: new THREE.Color(0xffffee), sunIntensity: 0.6 },
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
    this.skyTransition = {
      active: false, timer: 0, duration: 2.0,
      fromTop: new THREE.Color(), fromBot: new THREE.Color(),
      fromMid: new THREE.Color(), fromHorizon: new THREE.Color(),
      toTop: new THREE.Color(), toBot: new THREE.Color(),
      toMid: new THREE.Color(), toHorizon: new THREE.Color(),
      toSunPos: [0.7, 0.75], toSunColor: new THREE.Color(), toSunIntensity: 0.5
    };
    this.nightStars = [];
    this.clouds = [];
    this.grassClusters = [];
    this.grassInstanced = null;
    this.flowersGroup = [];
    this.treesGroup = [];
    this.bgLayers = { near: [], mid: [], far: [] };
    this.dustMotes = [];
    this.zDepthObjects = [];
    this.godRays = [];
    this.fogPlane = null;
    this.leaves = [];
    this.fireflies = [];
    this.groundNormal = generateGroundNormalMap();
    this.fabricNormal = generateFabricNormalMap();

    this._buildEnvironment();
  }

  _buildEnvironment() {
    const scene = this.scene;

    // ── multi-band sky shader with sun glow ──
    this.skyMat = new THREE.ShaderMaterial({
      depthWrite: false,
      uniforms: {
        uTopColor: { value: new THREE.Color(0x2a60b0) },
        uMidColor: { value: new THREE.Color(0x4a90d9) },
        uHorizonColor: { value: new THREE.Color(0xc0dfff) },
        uBottomColor: { value: new THREE.Color(0xd4f1ff) },
        uSunPos: { value: new THREE.Vector2(0.7, 0.75) },
        uSunColor: { value: new THREE.Color(0xfff5d0) },
        uSunIntensity: { value: 0.5 },
        uMobile: { value: this.isMobile ? 1.0 : 0.0 }
      },
      vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.9999,1.0);}`,
      fragmentShader: /* glsl */`
        uniform vec3 uTopColor, uMidColor, uHorizonColor, uBottomColor;
        uniform vec2 uSunPos;
        uniform vec3 uSunColor;
        uniform float uSunIntensity, uMobile;
        varying vec2 vUv;
        void main(){
          float y = vUv.y;
          vec3 col;
          if(y < 0.3) col = mix(uBottomColor, uHorizonColor, y / 0.3);
          else if(y < 0.6) col = mix(uHorizonColor, uMidColor, (y - 0.3) / 0.3);
          else col = mix(uMidColor, uTopColor, (y - 0.6) / 0.4);
          if(uMobile < 0.5){
            float sd = length(vUv - uSunPos);
            float glow = exp(-sd * 8.0) * uSunIntensity;
            col += uSunColor * glow;
          }
          gl_FragColor = vec4(col, 1.0);
        }`
    });
    const skyMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.skyMat);
    skyMesh.frustumCulled = false;
    scene.add(skyMesh);

    scene.fog = new THREE.FogExp2(0xb8e0f7, 0.010);
    scene.environment = this.envMap;

    // ── ground with normal map ──
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 40, 80, 16),
      new THREE.MeshStandardMaterial({
        color: 0x4abe4a, roughness: 0.85, map: this.groundTex,
        normalMap: this.groundNormal, normalScale: new THREE.Vector2(0.8, 0.8)
      })
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

    // ── Z-depth decorative objects ──
    this._buildZDepthObjects();

    // ── height fog plane ──
    const fogGeo = new THREE.PlaneGeometry(200, 6, 1, 10);
    const fogPos = fogGeo.attributes.position;
    const fogColors = new Float32Array(fogPos.count * 3);
    for (let i = 0; i < fogPos.count; i++) {
      const vy = fogPos.getY(i);
      const alpha = Math.max(0, 1 - (vy + 3) / 6);
      fogColors[i * 3] = fogColors[i * 3 + 1] = fogColors[i * 3 + 2] = alpha;
    }
    fogGeo.setAttribute('color', new THREE.BufferAttribute(fogColors, 3));
    this.fogPlane = new THREE.Mesh(fogGeo, new THREE.MeshBasicMaterial({
      color: 0xb8e0f7, transparent: true, opacity: 0.3, vertexColors: true, depthWrite: false
    }));
    this.fogPlane.rotation.x = -Math.PI / 2;
    this.fogPlane.position.y = GROUND_Y + 0.05;
    scene.add(this.fogPlane);

    // ── god rays (billboard planes) ──
    const rayCount = this.isMobile ? 3 : 5;
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xfff8e0, transparent: true, opacity: 0.08,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    for (let i = 0; i < rayCount; i++) {
      const ray = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 12), rayMat.clone());
      ray.position.set(-5 + i * 8, 5, -3 - i * 2);
      ray.rotation.set(0.3, 0.2 + i * 0.15, 0.4 + i * 0.1);
      ray.visible = false;
      scene.add(ray);
      this.godRays.push({ mesh: ray, baseX: ray.position.x, phase: i * 1.2 });
    }

    // ── wind-animated grass (InstancedMesh) ──
    this._buildWindGrass();

    // ── falling leaves ──
    const leafCount = this.isMobile ? 5 : 15;
    const leafGeo = new THREE.PlaneGeometry(0.12, 0.08);
    const leafColors = [0xc87030, 0xd09040, 0xb86020, 0xcc9944, 0xa05520];
    for (let i = 0; i < leafCount; i++) {
      const lmat = new THREE.MeshBasicMaterial({
        color: leafColors[i % leafColors.length],
        side: THREE.DoubleSide, transparent: true, opacity: 0.8
      });
      const leaf = new THREE.Mesh(leafGeo, lmat);
      leaf.position.set(
        (Math.random() - 0.5) * 40,
        5 + Math.random() * 10,
        (Math.random() - 0.5) * 6
      );
      leaf.visible = false;
      scene.add(leaf);
      this.leaves.push({
        mesh: leaf, seed: Math.random() * 100,
        fallSpeed: 0.8 + Math.random() * 0.6,
        spinSpeed: 1 + Math.random() * 3,
        swayAmp: 0.2 + Math.random() * 0.3
      });
    }

    // ── fireflies (night level) ──
    const ffCount = this.isMobile ? 6 : 20;
    const ffGeo = new THREE.SphereGeometry(0.04, 6, 4);
    for (let i = 0; i < ffCount; i++) {
      const ffMat = new THREE.MeshBasicMaterial({
        color: 0xeeff44, transparent: true, opacity: 0
      });
      const ff = new THREE.Mesh(ffGeo, ffMat);
      ff.position.set(
        (Math.random() - 0.5) * 50,
        GROUND_Y + 0.5 + Math.random() * 4,
        (Math.random() - 0.5) * 8
      );
      ff.visible = false;
      scene.add(ff);
      const data = { mesh: ff, phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 0.8, basePos: ff.position.clone() };
      if (!this.isMobile) {
        const pl = new THREE.PointLight(0xeeff44, 0, 3, 2);
        pl.position.copy(ff.position);
        scene.add(pl);
        data.light = pl;
      }
      this.fireflies.push(data);
    }
  }

  _buildZDepthObjects() {
    const scene = this.scene;
    const stdMat = (c, r) => new THREE.MeshStandardMaterial({ color: c, roughness: r || 0.8 });

    // foreground (Z = +2 to +4): semi-transparent bushes and rocks
    const fgDefs = this.isMobile ? [
      { x: 2, z: 2.5, type: 'bush' }, { x: 18, z: 3, type: 'rock' },
      { x: 35, z: 2.2, type: 'bush' },
    ] : [
      { x: -3, z: 2.5, type: 'bush' }, { x: 5, z: 3.5, type: 'rock' },
      { x: 14, z: 2.2, type: 'bush' }, { x: 22, z: 3, type: 'rock' },
      { x: 32, z: 2.8, type: 'bush' }, { x: 40, z: 3.2, type: 'rock' },
    ];
    for (const d of fgDefs) {
      let m;
      if (d.type === 'bush') {
        m = new THREE.Mesh(
          new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 10, 8),
          new THREE.MeshStandardMaterial({ color: 0x3a9a3a, roughness: 0.85, transparent: true, opacity: 0.5 })
        );
        m.scale.set(1 + Math.random() * 0.5, 0.6, 0.8);
      } else {
        m = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.25 + Math.random() * 0.15, 0),
          new THREE.MeshStandardMaterial({ color: 0x888880, roughness: 0.9, transparent: true, opacity: 0.5 })
        );
      }
      m.position.set(d.x, GROUND_Y + 0.2, d.z);
      m.castShadow = true;
      scene.add(m);
      this.zDepthObjects.push(m);
    }

    // midground (Z = -2 to -4): fences, lampposts, benches
    const mgDefs = this.isMobile ? [
      { x: 0, z: -2.5, type: 'fence' }, { x: 15, z: -3, type: 'lamp' },
      { x: 30, z: -2, type: 'bench' },
    ] : [
      { x: -5, z: -2.5, type: 'fence' }, { x: 3, z: -3, type: 'lamp' },
      { x: 10, z: -2, type: 'bench' }, { x: 20, z: -3.5, type: 'fence' },
      { x: 28, z: -2.5, type: 'lamp' }, { x: 38, z: -3, type: 'bench' },
      { x: 45, z: -2.5, type: 'fence' },
    ];
    for (const d of mgDefs) {
      const g = new THREE.Group();
      if (d.type === 'fence') {
        for (let i = 0; i < 5; i++) {
          const post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), stdMat(0x8B5E3C)
          );
          post.position.set(i * 0.4 - 0.8, 0.4, 0);
          post.castShadow = true;
          g.add(post);
        }
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(2, 0.06, 0.06), stdMat(0x8B5E3C)
        );
        rail.position.y = 0.65;
        g.add(rail);
      } else if (d.type === 'lamp') {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.045, 2, 8), stdMat(0x555555, 0.4)
        );
        pole.position.y = 1;
        pole.castShadow = true;
        g.add(pole);
        const lamp = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 8, 6),
          new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffcc, emissiveIntensity: 0.3, roughness: 0.3 })
        );
        lamp.position.y = 2.1;
        g.add(lamp);
      } else {
        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.08, 0.4), stdMat(0x8B5E3C)
        );
        seat.position.y = 0.4;
        seat.castShadow = true;
        g.add(seat);
        for (const bx of [-0.5, 0.5]) {
          const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), stdMat(0x555555, 0.4)
          );
          leg.position.set(bx, 0.2, 0);
          g.add(leg);
        }
      }
      g.position.set(d.x, GROUND_Y, d.z);
      scene.add(g);
      this.zDepthObjects.push(g);
    }

    // background desaturated structures (Z = -8 to -15)
    const bgStructDefs = this.isMobile ? [
      { x: 5, z: -10, type: 'windmill' },
      { x: 35, z: -12, type: 'house' },
    ] : [
      { x: -8, z: -10, type: 'house' }, { x: 10, z: -12, type: 'windmill' },
      { x: 25, z: -11, type: 'house' }, { x: 40, z: -14, type: 'windmill' },
      { x: 55, z: -10, type: 'house' },
    ];
    const desatMat = (c) => {
      const col = new THREE.Color(c);
      const hsl = {}; col.getHSL(hsl);
      col.setHSL(hsl.h, hsl.s * 0.4, hsl.l * 0.8 + 0.15);
      return new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 });
    };
    for (const d of bgStructDefs) {
      const g = new THREE.Group();
      if (d.type === 'house') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.2), desatMat(0xeedd99));
        body.position.y = 0.6;
        g.add(body);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.8, 4), desatMat(0xcc5533));
        roof.position.y = 1.6;
        roof.rotation.y = Math.PI / 4;
        g.add(roof);
      } else {
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.5, 8), desatMat(0xccbbaa));
        tower.position.y = 1.25;
        g.add(tower);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 8), desatMat(0x885533));
        cap.position.y = 2.8;
        g.add(cap);
      }
      g.position.set(d.x, GROUND_Y, d.z);
      g.scale.setScalar(0.8 + Math.random() * 0.4);
      scene.add(g);
      this.zDepthObjects.push(g);
    }
  }

  _buildWindGrass() {
    const bladeCount = this.isMobile ? 100 : 350;
    const bladeGeo = new THREE.PlaneGeometry(0.04, 0.3);
    bladeGeo.translate(0, 0.15, 0);

    const bladeMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0x3da83d) },
        uColor2: { value: new THREE.Color(0x55d055) }
      },
      vertexShader: /* glsl */`
        uniform float uTime;
        varying float vHeight;
        void main(){
          vHeight = position.y / 0.3;
          vec3 pos = position;
          float worldX = (instanceMatrix * vec4(pos, 1.0)).x;
          float wind = sin(worldX * 2.0 + uTime * 1.5) * 0.12 + sin(worldX * 0.7 + uTime * 0.8) * 0.06;
          pos.x += wind * vHeight * vHeight;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor1, uColor2;
        varying float vHeight;
        void main(){
          vec3 col = mix(uColor1, uColor2, vHeight);
          gl_FragColor = vec4(col, 1.0);
        }`,
      side: THREE.DoubleSide
    });

    const instMesh = new THREE.InstancedMesh(bladeGeo, bladeMat, bladeCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < bladeCount; i++) {
      dummy.position.set(
        -10 + Math.random() * 60,
        GROUND_Y,
        (Math.random() - 0.5) * 6
      );
      dummy.rotation.set(0, Math.random() * Math.PI, (Math.random() - 0.5) * 0.2);
      dummy.scale.set(0.7 + Math.random() * 0.6, 0.6 + Math.random() * 0.8, 1);
      dummy.updateMatrix();
      instMesh.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(instMesh);
    this.grassInstanced = { mesh: instMesh, mat: bladeMat };
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
      const p = buildCushion(def.x, def.y, 0, PW, PH, PD, def.t, this.fabricTex, this.fabricNormal);
      if (def.t === 'fragile') { p.jumpsLeft = 3; p.shaking = false; }
      this.scene.add(p.mesh);
      this.platforms.push(p);
    }

    // moving platforms
    if (data.moving) {
      for (const def of data.moving) {
        const p = buildCushion(def.x, def.y, 0, PW, PH, PD, 'moving', this.fabricTex, this.fabricNormal);
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
      const secretPlat = buildCushion(data.secret.x, data.secret.y, 0, PW * 0.8, PH, PD, 'normal', this.fabricTex, this.fabricNormal);
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
    this.skyTransition.fromMid.copy(this.skyMat.uniforms.uMidColor.value);
    this.skyTransition.fromHorizon.copy(this.skyMat.uniforms.uHorizonColor.value);
    this.skyTransition.toTop.copy(theme.top);
    this.skyTransition.toBot.copy(theme.bot);
    this.skyTransition.toMid.copy(theme.mid);
    this.skyTransition.toHorizon.copy(theme.horizon);
    this.skyTransition.toSunPos = theme.sunPos;
    this.skyTransition.toSunColor.copy(theme.sunColor);
    this.skyTransition.toSunIntensity = theme.sunIntensity;
    this.scene.fog.color.set(theme.fog);
    this.scene.fog.density = theme.density;
    if (this.fogPlane) this.fogPlane.material.color.set(theme.fog);
    this.nightStars.forEach(s => { s.visible = (n === 3); });

    // god rays visible only in daylight levels
    const isDayLevel = (n !== 3);
    for (const r of this.godRays) r.mesh.visible = isDayLevel;

    // leaves visible in levels 1, 2, 4
    const showLeaves = [1, 2, 4].includes(n);
    for (const l of this.leaves) l.mesh.visible = showLeaves;

    // fireflies only in night level (3)
    for (const ff of this.fireflies) {
      ff.mesh.visible = (n === 3);
      if (ff.light) ff.light.intensity = 0;
    }
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
    // ── sky transition (4-band + sun) ──
    if (this.skyTransition.active) {
      this.skyTransition.timer += dt;
      const p = Math.min(this.skyTransition.timer / this.skyTransition.duration, 1);
      this.skyMat.uniforms.uTopColor.value.lerpColors(this.skyTransition.fromTop, this.skyTransition.toTop, p);
      this.skyMat.uniforms.uBottomColor.value.lerpColors(this.skyTransition.fromBot, this.skyTransition.toBot, p);
      this.skyMat.uniforms.uMidColor.value.lerpColors(this.skyTransition.fromMid, this.skyTransition.toMid, p);
      this.skyMat.uniforms.uHorizonColor.value.lerpColors(this.skyTransition.fromHorizon, this.skyTransition.toHorizon, p);
      const sp = this.skyTransition.toSunPos;
      this.skyMat.uniforms.uSunPos.value.set(
        this.skyMat.uniforms.uSunPos.value.x + (sp[0] - this.skyMat.uniforms.uSunPos.value.x) * p,
        this.skyMat.uniforms.uSunPos.value.y + (sp[1] - this.skyMat.uniforms.uSunPos.value.y) * p
      );
      this.skyMat.uniforms.uSunColor.value.lerp(this.skyTransition.toSunColor, p);
      this.skyMat.uniforms.uSunIntensity.value += (this.skyTransition.toSunIntensity - this.skyMat.uniforms.uSunIntensity.value) * p;
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

    // ── wind grass ──
    if (this.grassInstanced) {
      this.grassInstanced.mat.uniforms.uTime.value = t;
    }

    // ── god rays ──
    for (const r of this.godRays) {
      if (!r.mesh.visible) continue;
      r.mesh.position.x = r.baseX + camX * 0.1;
      r.mesh.material.opacity = 0.05 + 0.04 * Math.sin(t * 0.5 + r.phase);
      r.mesh.rotation.z += dt * 0.02;
    }

    // ── fog plane follows camera ──
    if (this.fogPlane) {
      this.fogPlane.position.x = camX;
    }

    // ── falling leaves ──
    for (const l of this.leaves) {
      if (!l.mesh.visible) continue;
      l.mesh.position.y -= l.fallSpeed * dt;
      l.mesh.position.x += Math.sin(t * 2 + l.seed) * l.swayAmp * dt;
      l.mesh.rotation.z += l.spinSpeed * dt;
      l.mesh.rotation.x += l.spinSpeed * 0.3 * dt;
      if (l.mesh.position.y < GROUND_Y - 1) {
        l.mesh.position.y = 10 + Math.random() * 5;
        l.mesh.position.x = camX + (Math.random() - 0.5) * 25;
      }
    }

    // ── fireflies ──
    for (const ff of this.fireflies) {
      if (!ff.mesh.visible) continue;
      const pulse = 0.3 + 0.7 * Math.abs(Math.sin(t * ff.speed + ff.phase));
      ff.mesh.material.opacity = pulse;
      ff.mesh.position.x = ff.basePos.x + Math.sin(t * 0.3 + ff.phase) * 2;
      ff.mesh.position.y = ff.basePos.y + Math.sin(t * 0.5 + ff.phase * 2) * 0.8;
      ff.mesh.position.z = ff.basePos.z + Math.sin(t * 0.4 + ff.phase * 3) * 1;
      if (ff.light) {
        ff.light.intensity = pulse * 0.15;
        ff.light.position.copy(ff.mesh.position);
      }
    }
  }
}
