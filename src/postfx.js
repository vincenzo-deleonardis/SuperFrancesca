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
    vignetteSize: { value: 0.85 }
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
    varying vec2 vUv;

    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 col = tex.rgb;

      // brightness & contrast
      col = (col - 0.5) * contrast + 0.5 + brightness;

      // saturation
      float grey = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(grey), col, saturation);

      // vignette
      vec2 uv = vUv * 2.0 - 1.0;
      float vig = 1.0 - smoothstep(vignetteSize, vignetteSize + 0.4, length(uv));
      col *= mix(1.0, vig, vignetteAmount);

      gl_FragColor = vec4(col, tex.a);
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

    return composer;
  } catch (e) {
    console.warn('Post-processing setup failed:', e);
    return null;
  }
}
