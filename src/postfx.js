import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const ColorGradingShader = {
  uniforms: {
    tDiffuse: { value: null },
    brightness: { value: 0.02 },
    contrast: { value: 1.08 },
    saturation: { value: 1.12 },
    vignetteAmount: { value: 0.25 },
    vignetteSize: { value: 0.85 },
    uTime: { value: 0 },
    uChromatic: { value: 0.003 },
    uGrain: { value: 0.025 }
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float brightness;
    uniform float contrast;
    uniform float saturation;
    uniform float vignetteAmount;
    uniform float vignetteSize;
    uniform float uTime;
    uniform float uChromatic;
    uniform float uGrain;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;

      // chromatic aberration at screen edges
      float dist = length(uv - 0.5);
      float aberration = dist * dist * uChromatic;
      float r = texture2D(tDiffuse, uv + vec2(aberration, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(aberration, 0.0)).b;
      vec3 col = vec3(r, g, b);

      // brightness & contrast
      col = (col - 0.5) * contrast + 0.5 + brightness;

      // saturation
      float grey = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(grey), col, saturation);

      // vignette
      vec2 vigUv = vUv * 2.0 - 1.0;
      float vig = 1.0 - smoothstep(vignetteSize, vignetteSize + 0.4, length(vigUv));
      col *= mix(1.0, vig, vignetteAmount);

      // film grain
      float grain = (rand(uv * uTime * 0.01 + uTime) - 0.5) * uGrain;
      col += grain;

      gl_FragColor = vec4(col, 1.0);
    }
  `
};

export function setupPostProcessing(renderer, scene, camera, isMobile) {
  const canBloom = !(isMobile && window.devicePixelRatio < 1.5 && Math.min(window.innerWidth, window.innerHeight) < 400);
  if (!canBloom) return null;

  try {
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.35, 0.4, 0.88
    );
    composer.addPass(bloomPass);

    const colorGrading = new ShaderPass(ColorGradingShader);
    composer.addPass(colorGrading);
    composer._colorGradingPass = colorGrading;

    // async-load SSAO and Bokeh for desktop only (non-blocking)
    if (!isMobile) {
      _loadDesktopPasses(composer, scene, camera);
    }

    return composer;
  } catch (e) {
    console.warn('Post-processing setup failed:', e);
    return null;
  }
}

async function _loadDesktopPasses(composer, scene, camera) {
  try {
    const { SSAOPass } = await import('three/addons/postprocessing/SSAOPass.js');
    const ssao = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
    ssao.kernelRadius = 0.4;
    ssao.minDistance = 0.001;
    ssao.maxDistance = 0.12;
    ssao.output = SSAOPass.OUTPUT.Default;
    composer.insertPass(ssao, 1);
  } catch (e) { /* SSAOPass not available in this build */ }

  try {
    const { BokehPass } = await import('three/addons/postprocessing/BokehPass.js');
    const bokeh = new BokehPass(scene, camera, {
      focus: 16, aperture: 0.002, maxblur: 0.005
    });
    const cgIdx = composer.passes.findIndex(p => p === composer._colorGradingPass);
    if (cgIdx >= 0) composer.insertPass(bokeh, cgIdx);
    else composer.addPass(bokeh);
  } catch (e) { /* BokehPass not available */ }
}
