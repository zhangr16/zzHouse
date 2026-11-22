import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { Water } from "three/addons/objects/Water.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const host = document.getElementById("pond-scene");
const canvas = document.getElementById("scene-canvas");
const status = document.getElementById("scene-status");

const configs = {
  pond: {
    fogColor: "#ffd6a3", fogDensity: 0.00135, exposure: 0.56,
    turbidity: 7.2, rayleigh: 2.2, mieCoefficient: 0.008, mieDirectionalG: 0.83,
    sunElevation: 7.5, sunAzimuth: 178, sunColor: "#ffca7d", sunIntensity: 2.7,
    hemiSky: "#ffd9ac", hemiGround: "#20442f", hemiIntensity: 0.72,
    cameraHeight: 2.6,
    waterColor: "#0d5d58", distortionScale: 0.78, waterSize: 2.8, flowSpeed: 0.42,
    landLow: "#5c7448", landHigh: "#71875c", peakStart: 58, treeCount: 480,
    treeColor: "#20523a", treeScale: [1.8, 3.4], cityLights: false, stars: false, moon: false,
    bloom: { strength: 0.28, radius: 0.72, threshold: 0.76 }, cloudTint: "#fff4d8", cloudCount: 34, cloudOpacity: 0.48,
    birdColor: "#3a4a54", birdCount: 12
  },
  stream: {
    fogColor: "#ffe1cb", fogDensity: 0.0038, exposure: 0.5,
    turbidity: 5.2, rayleigh: 2.8, mieCoefficient: 0.0055, mieDirectionalG: 0.85,
    sunElevation: 3.5, sunAzimuth: -112, sunColor: "#ff9d66", sunIntensity: 2.5,
    hemiSky: "#ffe7cf", hemiGround: "#27443d", hemiIntensity: 0.62,
    cameraHeight: 1.95,
    waterColor: "#1d7167", distortionScale: 1.7, waterSize: 2.2, flowSpeed: 1,
    landLow: "#547464", landHigh: "#d8e6ee", peakStart: 58, treeCount: 760,
    treeColor: "#154233", treeScale: [2.2, 4.2], cityLights: false, stars: false, moon: false,
    bloom: { strength: 0.2, radius: 0.66, threshold: 0.8 }, cloudTint: "#ffeccd", cloudCount: 44, cloudOpacity: 0.54,
    birdColor: "#395158", birdCount: 18,
    grade: { warmth: 0.14, vignette: 0.27, grain: 0.03, saturation: 1.08, contrast: 1.04 }
  },
  sea: {
    fogColor: "#112541", fogDensity: 0.00095, exposure: 0.3,
    turbidity: 0.9, rayleigh: 1.0, mieCoefficient: 0.0045, mieDirectionalG: 0.8,
    sunElevation: -7, sunAzimuth: 205, sunColor: "#8fb0ff", sunIntensity: 0.55,
    hemiSky: "#2c4a72", hemiGround: "#04121d", hemiIntensity: 0.24,
    cameraHeight: 3,
    waterColor: "#062c3a", distortionScale: 4.4, waterSize: 1.7, flowSpeed: 0.78,
    landLow: "#202f3d", landHigh: "#48586a", peakStart: 78, treeCount: 90,
    treeColor: "#132832", treeScale: [2.4, 4.6], cityLights: true, stars: 3600, moon: true,
    bloom: { strength: 0.5, radius: 0.82, threshold: 0.54 }, cloudTint: "#54718f", cloudCount: 24, cloudOpacity: 0.34,
    birdColor: "#2d3d4c", birdCount: 8,
    grade: { warmth: -0.08, vignette: 0.38, grain: 0.05, saturation: 0.94, contrast: 1.1 }
  },
  dawnLake: {
    fogColor: "#ffe9c8", fogDensity: 0.0034, exposure: 0.58,
    turbidity: 8.5, rayleigh: 2.6, mieCoefficient: 0.009, mieDirectionalG: 0.86,
    sunElevation: 2.2, sunAzimuth: 148, sunColor: "#ffb268", sunIntensity: 2.4,
    hemiSky: "#ffe3bb", hemiGround: "#31473a", hemiIntensity: 0.58,
    cameraHeight: 2.35,
    waterColor: "#1a6d68", distortionScale: 0.86, waterSize: 2.6, flowSpeed: 0.35,
    landLow: "#4a6444", landHigh: "#8a9072", peakStart: 52, treeCount: 680,
    treeColor: "#1d5238", treeScale: [2, 4], cityLights: false, stars: false, moon: false,
    bloom: { strength: 0.34, radius: 0.76, threshold: 0.7 }, cloudTint: "#ffd9ad", cloudCount: 42, cloudOpacity: 0.6,
    birdColor: "#33424c", birdCount: 16,
    grade: { warmth: 0.2, vignette: 0.32, grain: 0.035, saturation: 1.1, contrast: 1.03 }
  },
  tropicalLagoon: {
    fogColor: "#d6f6ff", fogDensity: 0.0007, exposure: 0.82,
    turbidity: 3.2, rayleigh: 1.5, mieCoefficient: 0.0042, mieDirectionalG: 0.82,
    sunElevation: 46, sunAzimuth: 164, sunColor: "#fff4cf", sunIntensity: 3.1,
    hemiSky: "#d8f7ff", hemiGround: "#2f745c", hemiIntensity: 0.82,
    cameraHeight: 1.75,
    waterColor: "#0b96ac", distortionScale: 0.48, waterSize: 3.5, flowSpeed: 0.16,
    landLow: "#78b06a", landHigh: "#d9bd8a", peakStart: 40, treeCount: 160,
    treeColor: "#167d5c", treeScale: [1.5, 3.6], cityLights: false, stars: false, moon: false,
    bloom: { strength: 0.22, radius: 0.62, threshold: 0.84 }, cloudTint: "#ffffff", cloudCount: 30, cloudOpacity: 0.42,
    birdColor: "#2e4d55", birdCount: 14,
    grade: { warmth: 0.04, vignette: 0.2, grain: 0.018, saturation: 1.16, contrast: 1.02 }
  },
  arcticLake: {
    fogColor: "#b9d3ee", fogDensity: 0.0028, exposure: 0.54,
    turbidity: 3.8, rayleigh: 1.2, mieCoefficient: 0.006, mieDirectionalG: 0.79,
    sunElevation: 9, sunAzimuth: -70, sunColor: "#ffd5de", sunIntensity: 1.6,
    hemiSky: "#d5e8ff", hemiGround: "#718ea8", hemiIntensity: 0.58,
    cameraHeight: 2.5,
    waterColor: "#0e5373", distortionScale: 1.05, waterSize: 1.7, flowSpeed: 0.18,
    landLow: "#d8e7f6", landHigh: "#f5fbff", peakStart: 38, treeCount: 0,
    treeColor: "#29554c", treeScale: [2, 4], cityLights: false, stars: false, moon: false,
    bloom: { strength: 0.36, radius: 0.7, threshold: 0.68 }, cloudTint: "#ffffff", cloudCount: 30, cloudOpacity: 0.44,
    birdColor: "#41546a", birdCount: 10,
    grade: { warmth: -0.12, vignette: 0.31, grain: 0.04, saturation: 0.95, contrast: 1.07 }
  },
  mangroveForest: {
    fogColor: "#ffd2a3", fogDensity: 0.0048, exposure: 0.6,
    turbidity: 8.2, rayleigh: 2.7, mieCoefficient: 0.009, mieDirectionalG: 0.85,
    sunElevation: 3.2, sunAzimuth: -142, sunColor: "#ffb26b", sunIntensity: 2.5,
    hemiSky: "#ffe2bd", hemiGround: "#25472c", hemiIntensity: 0.66,
    cameraHeight: 1.65,
    waterColor: "#177058", distortionScale: 0.92, waterSize: 2.4, flowSpeed: 0.46,
    landLow: "#566d3f", landHigh: "#7d8c52", peakStart: 48, treeCount: 420,
    treeColor: "#1d5234", treeScale: [2.4, 5], cityLights: false, stars: false, moon: false,
    bloom: { strength: 0.32, radius: 0.74, threshold: 0.7 }, cloudTint: "#ffe7c4", cloudCount: 40, cloudOpacity: 0.55,
    birdColor: "#324a4c", birdCount: 20,
    grade: { warmth: 0.16, vignette: 0.34, grain: 0.04, saturation: 1.07, contrast: 1.05 }
  },
  glowCave: {
    fogColor: "#4b63ac", fogDensity: 0.0062, exposure: 0.5,
    turbidity: 4.8, rayleigh: 1.6, mieCoefficient: 0.0075, mieDirectionalG: 0.76,
    sunElevation: -12, sunAzimuth: 118, sunColor: "#9fb6ff", sunIntensity: 0.85,
    hemiSky: "#7f8ed8", hemiGround: "#101b31", hemiIntensity: 0.36,
    cameraHeight: 1.5,
    waterColor: "#123a74", distortionScale: 0.62, waterSize: 3.4, flowSpeed: 0.24,
    landLow: "#1a224c", landHigh: "#5a64a8", peakStart: 46, treeCount: 0,
    treeColor: "#24407c", treeScale: [2.8, 5.4], cityLights: true, stars: 4200, moon: true,
    bloom: { strength: 0.58, radius: 0.86, threshold: 0.48 }, cloudTint: "#8b9bff", cloudCount: 18, cloudOpacity: 0.28,
    birdColor: "#57658e", birdCount: 6,
    grade: { warmth: -0.06, vignette: 0.42, grain: 0.06, saturation: 1.2, contrast: 1.09 }
  }
};

const shoreCenterZ = -430;
const shoreRadius = 335;

const CinematicShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    warmth: { value: 0.1 },
    vignette: { value: 0.28 },
    grain: { value: 0.035 },
    saturation: { value: 1.08 },
    contrast: { value: 1.04 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float warmth;
    uniform float vignette;
    uniform float grain;
    uniform float saturation;
    uniform float contrast;
    varying vec2 vUv;

    float randomNoise(vec2 point) {
      return fract(sin(dot(point + time, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 sampled = texture2D(tDiffuse, vUv);
      vec3 color = sampled.rgb;
      vec3 warmColor = color * vec3(1.07, 1.01, 0.95);
      vec3 coolColor = color * vec3(0.96, 1.0, 1.08);
      color = mix(mix(color, warmColor, max(warmth, 0.0)), coolColor, max(-warmth, 0.0));
      color = mix(vec3(dot(color, vec3(0.2126, 0.7152, 0.0722))), color, saturation);
      color = clamp((color - 0.5) * contrast + 0.5, 0.0, 1.0);
      float distanceToCenter = distance(vUv, vec2(0.5));
      color *= smoothstep(0.94, 0.26, distanceToCenter * vignette * 2.35);
      color += (randomNoise(vUv * 780.0) - 0.5) * grain;
      gl_FragColor = vec4(clamp(color, 0.0, 1.0), sampled.a);
    }
  `
};

function hashNoise(x, z) {
  return Math.sin(x * 0.0078 + z * 0.0031) * 0.36
    + Math.sin(x * 0.0222 - z * 0.0117) * 0.2
    + Math.sin(z * 0.0165 + x * 0.0043) * 0.28
    + Math.sin((x + z) * 0.0391) * 0.08;
}

function createWaveNormals() {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x / size) * Math.PI * 2;
      const v = (y / size) * Math.PI * 2;
      let dx = 0.18 * Math.cos(u * 3) * Math.sin(v * 2)
        + 0.09 * Math.cos(u * 8 + v * 3)
        + 0.045 * Math.cos(u * 13 - v * 7);
      let dy = 0.16 * Math.cos(v * 4) * Math.sin(u * 3)
        + 0.08 * Math.cos(v * 10 - u * 4)
        + 0.05 * Math.cos(v * 16 + u * 9);
      dx += Math.sin(u * 5.0 + v * 11.0) * 0.025;
      dy += Math.sin(v * 7.0 - u * 13.0) * 0.025;
      const length = Math.hypot(dx, dy, 1);
      const index = (y * size + x) * 4;
      data[index] = Math.round((-dx / length * 0.5 + 0.5) * 255);
      data[index + 1] = Math.round((-dy / length * 0.5 + 0.5) * 255);
      data[index + 2] = Math.round((1 / length * 0.5 + 0.5) * 255);
      data[index + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

function createGlowTexture() {
  const canvasElement = document.createElement("canvas");
  canvasElement.width = 128;
  canvasElement.height = 128;
  const context = canvasElement.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,252,226,.95)");
  gradient.addColorStop(0.24, "rgba(238,244,255,.48)");
  gradient.addColorStop(1, "rgba(210,226,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvasElement);
}

function createCloudTexture() {
  const size = 256;
  const cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = size;
  cloudCanvas.height = size / 2;
  const context = cloudCanvas.getContext("2d");
  for (let index = 0; index < 54; index += 1) {
    const x = 24 + Math.random() * (size - 48);
    const y = size / 4 + (Math.random() - 0.5) * size / 3.6;
    const radius = 13 + Math.random() * 38;
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(255,255,255,.7)");
    gradient.addColorStop(0.52, "rgba(236,245,255,.18)");
    gradient.addColorStop(1, "rgba(230,240,255,0)");
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const texture = new THREE.CanvasTexture(cloudCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildCloudLayer(scene, config) {
  const group = new THREE.Group();
  const material = new THREE.SpriteMaterial({
    map: createCloudTexture(), transparent: true, opacity: config.cloudOpacity,
    depthWrite: false, fog: false
  });
  material.color = new THREE.Color(config.cloudTint);
  for (let index = 0; index < config.cloudCount; index += 1) {
    const cloud = new THREE.Sprite(material);
    cloud.position.set(
      (Math.random() - 0.5) * 3600,
      185 + Math.random() * 360,
      -750 - Math.random() * 1800
    );
    cloud.scale.set(320 + Math.random() * 760, 95 + Math.random() * 170, 1);
    group.add(cloud);
  }
  scene.add(group);
  return group;
}

function buildShoreGlow(scene, config) {
  const shoreGlow = new THREE.Mesh(
    new THREE.RingGeometry(shoreRadius - 16, shoreRadius + 18, 240, 1),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.hemiSky).lerp(new THREE.Color("#ffffff"), 0.34),
      transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide
    })
  );
  shoreGlow.rotation.x = -Math.PI / 2;
  shoreGlow.position.set(0, 0.4, shoreCenterZ);
  scene.add(shoreGlow);
}

function buildAirMotes(scene, config) {
  const count = config.moon ? 0 : 220;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 430;
    positions[index * 3 + 1] = 0.2 + Math.random() * 11;
    positions[index * 3 + 2] = -25 - Math.random() * 280;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: config.cityLights ? "#9fc4ff" : "#fff0bd",
    size: 2, sizeAttenuation: false, transparent: true, opacity: 0.3,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  });
  const motes = new THREE.Points(geometry, material);
  scene.add(motes);
  return motes;
}

function buildBirdLayer(scene, config) {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color: config.birdColor || "#384a56", side: THREE.DoubleSide, transparent: true, opacity: 0.88
  });
  const bodyGeometry = new THREE.SphereGeometry(1, 8, 6);
  const wingGeometry = new THREE.PlaneGeometry(8.5, 2.2);
  const birds = [];
  for (let index = 0; index < (config.birdCount || 0); index += 1) {
    const bird = new THREE.Group();
    const body = new THREE.Mesh(bodyGeometry, material);
    body.scale.set(0.6, 0.5, 1.5);
    const leftWing = new THREE.Mesh(wingGeometry, material);
    leftWing.position.x = -4;
    const rightWing = new THREE.Mesh(wingGeometry, material);
    rightWing.position.x = 4;
    bird.add(body, leftWing, rightWing);
    const orbit = {
      mesh: bird,
      leftWing,
      rightWing,
      angle: Math.random() * Math.PI * 2,
      radius: 360 + Math.random() * 620,
      altitude: 185 + Math.random() * 260,
      speed: 0.028 + Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2,
      flapSpeed: 7 + Math.random() * 5,
      verticalSwing: 10 + Math.random() * 22
    };
    birds.push(orbit);
    group.add(bird);
  }
  scene.add(group);
  return { group, birds };
}

function updateBirdLayer(delta, clock, birdLayer) {
  if (!birdLayer) return;
  for (const item of birdLayer.birds) {
    item.angle += item.speed * delta;
    const x = Math.cos(item.angle) * item.radius;
    const z = Math.sin(item.angle) * item.radius + shoreCenterZ;
    const y = item.altitude + Math.sin(clock.elapsedTime * 0.42 + item.phase) * item.verticalSwing;
    item.mesh.position.set(x, y, z);
    item.mesh.rotation.y = -item.angle + Math.PI / 2;
    const flap = Math.sin(clock.elapsedTime * item.flapSpeed + item.phase) * 0.78;
    item.leftWing.rotation.z = flap;
    item.rightWing.rotation.z = -flap;
  }
}

function shoreHeight(x, z, config) {
  const radius = Math.hypot(x, z) - shoreRadius;
  const distanceMask = THREE.MathUtils.smoothstep(radius, 0, 235);
  const sideMask = Math.pow(Math.abs(x) / 1700, 1.28);
  const noise = hashNoise(x + shoreCenterZ, z - shoreCenterZ) * 0.5 + 0.5;
  return distanceMask * (4 + noise * 32 + sideMask * 95);
}

function buildTerrain(scene, config) {
    const geometry = new THREE.RingGeometry(shoreRadius, 2100, 280, 46);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const colors = [];
  const low = new THREE.Color(config.landLow);
  const high = new THREE.Color(config.landHigh);
  const color = new THREE.Color();
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const z = position.getZ(index);
    const height = shoreHeight(x, z, config);
    position.setY(index, height);
    const blend = Math.min(1, Math.max(0, (height - config.peakStart) / 90));
    color.copy(low).lerp(high, blend * 0.92 + hashNoise(z, x) * 0.06);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: config.cityLights ? 0.86 : 0.94,
    metalness: 0
  });
  const terrain = new THREE.Mesh(geometry, material);
  terrain.position.set(0, -3, shoreCenterZ);
  scene.add(terrain);
}

function buildTrees(scene, config) {
  const count = config.treeCount;
  if (!count) return;
  const tree = new THREE.InstancedMesh(
    new THREE.ConeGeometry(2.1, 7, 5),
    new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, flatShading: true }),
    count
  );
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const color = new THREE.Color(config.treeColor);
  for (let index = 0; index < count; index += 1) {
    const angle = (0.25 + Math.random() * 1.5) * Math.PI;
    const radius = shoreRadius + 20 + Math.pow(Math.random(), 0.8) * 900;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const scaleValue = config.treeScale[0] + Math.random() * (config.treeScale[1] - config.treeScale[0]);
    position.set(x, shoreHeight(x, z, config) + scaleValue * 1.6, z + shoreCenterZ);
    scale.set(0.9 + Math.random() * 0.8, scaleValue, 0.9 + Math.random() * 0.8);
    matrix.compose(position, quaternion, scale);
    tree.setMatrixAt(index, matrix);
    color.setHSL(color.getHSL({}).h, color.getHSL({}).s, 0.08 + Math.random() * 0.1);
    tree.setColorAt(index, color);
  }
  tree.instanceMatrix.needsUpdate = true;
  if (tree.instanceColor) tree.instanceColor.needsUpdate = true;
  scene.add(tree);
}

function buildCityLights(scene, config) {
  if (!config.cityLights) return;
  const count = 640;
  const lights = new THREE.InstancedMesh(
    new THREE.BoxGeometry(2, 1, 2),
    new THREE.MeshStandardMaterial({ color: "#202a3a", emissive: "#ffd489", emissiveIntensity: 1.35, flatShading: true }),
    count
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  for (let index = 0; index < count; index += 1) {
    const angle = Math.PI + (Math.random() - 0.5) * 1.5;
    const radius = shoreRadius + 32 + Math.random() * 480;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const height = 4 + Math.random() ** 1.7 * 34;
    position.set(x, shoreHeight(x, z, config) + height / 2, z + shoreCenterZ);
    scale.set(2.5 + Math.random() * 4, height, 2.5 + Math.random() * 4);
    matrix.compose(position, quaternion, scale);
    lights.setMatrixAt(index, matrix);
  }
  lights.instanceMatrix.needsUpdate = true;
  scene.add(lights);
}

function propMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.78,
    metalness: options.metalness ?? 0,
    emissive: options.emissive ?? "#000000",
    emissiveIntensity: options.emissiveIntensity ?? 1,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    flatShading: options.flatShading ?? true
  });
}

function addProp(group, geometry, material, transform = {}) {
  const mesh = material instanceof THREE.PointsMaterial
    ? new THREE.Points(geometry, material)
    : new THREE.Mesh(geometry, material);
  mesh.position.set(transform.x ?? 0, transform.y ?? 0, transform.z ?? 0);
  if (transform.scale) mesh.scale.set(transform.scale[0], transform.scale[1], transform.scale[2]);
  if (transform.rotation) mesh.rotation.set(transform.rotation[0], transform.rotation[1], transform.rotation[2]);
  group.add(mesh);
  return mesh;
}

function buildLocationProps(scene, locationId, config) {
  const group = new THREE.Group();
  const random = (min, max) => min + Math.random() * (max - min);
  const waterSpot = () => {
    const angle = random(-.9, .9);
    const radius = random(65, 300);
    return [Math.sin(angle) * radius, Math.cos(angle) * radius + shoreCenterZ];
  };

  if (locationId === "pond") {
    const lilyGeometry = new THREE.CircleGeometry(random(3.5, 7), 14);
    const lilyMaterial = propMaterial("#2f7d4a", { roughness: 0.65 });
    for (let index = 0; index < 42; index += 1) {
      const [x, z] = waterSpot(180, -55, -250);
      addProp(group, lilyGeometry, index % 5 ? lilyMaterial : propMaterial("#5f9f5b", { roughness: 0.7 }), {
        x, y: 0.32, z, rotation: [-Math.PI / 2, 0, random(0, Math.PI * 2)], scale: [random(.65, 1.5), 1, random(.65, 1.5)]
      });
    }
    for (let index = 0; index < 34; index += 1) {
      const [x, z] = waterSpot(235, -40, -260);
      addProp(group, new THREE.CylinderGeometry(.22, .32, 12, 5), propMaterial("#3d6d38"), { x, y: 6, z });
      addProp(group, new THREE.CylinderGeometry(.95, .65, 3.5, 6), propMaterial("#a56036"), { x, y: 13.5, z });
    }
    addProp(group, new THREE.BoxGeometry(42, 1, 92), propMaterial("#7b502d", { roughness: .9 }), { x: 86, y: 2, z: -55 });
    for (let index = 0; index < 5; index += 1) addProp(group, new THREE.CylinderGeometry(.8, 1, 9, 6), propMaterial("#5d3a20"), { x: 70 + index * 8, y: -1, z: -90 + index * 18 });
  }

  if (locationId === "stream") {
    for (let index = 0; index < 48; index += 1) {
      const [x, z] = waterSpot(190, -35, -280);
      addProp(group, new THREE.IcosahedronGeometry(random(3, 10), 0), propMaterial(index % 4 ? "#5d6a70" : "#d9e7ee", { roughness: .94 }), {
        x, y: random(.5, 3), z, rotation: [random(0, 3), random(0, 3), random(0, 3)], scale: [1, random(.45, .9), random(.8, 1.4)]
      });
    }
    for (let index = 0; index < 36; index += 1) {
      const [x, z] = waterSpot(150, -45, -270);
      addProp(group, new THREE.BoxGeometry(random(6, 18), .4, random(2, 5)), propMaterial("#ffffff", { transparent: true, opacity: .38, roughness: .4 }), {
        x, y: .75, z, rotation: [0, random(-.35, .35), 0]
      });
    }
    addProp(group, new THREE.CylinderGeometry(1.6, 2, 22, 6), propMaterial("#4d3322"), { x: -82, y: 8, z: -95, rotation: [0, .4, 1.32] });
  }

  if (locationId === "sea") {
    addProp(group, new THREE.CylinderGeometry(12, 16, 96, 18), propMaterial("#e8e4d8"), { x: -245, y: 42, z: -360 });
    addProp(group, new THREE.CylinderGeometry(15, 15, 16, 18), propMaterial("#d4494a"), { x: -245, y: 96, z: -360 });
    addProp(group, new THREE.SphereGeometry(7, 18, 12), propMaterial("#fff6bd", { emissive: "#ffd98a", emissiveIntensity: 5 }), { x: -245, y: 110, z: -360 });
    addProp(group, new THREE.SphereGeometry(24, 20, 16), propMaterial("#fff1b8", { emissive: "#ffe9a0", emissiveIntensity: 1.1, transparent: true, opacity: .22 }), { x: -245, y: 110, z: -360 });
    for (let index = 0; index < 9; index += 1) addProp(group, new THREE.BoxGeometry(11, 1.4, 28), propMaterial("#39485a"), { x: 170 + index * 5, y: 4, z: -45 - index * 21 });
    for (let index = 0; index < 10; index += 1) {
      const [x, z] = waterSpot(260, -55, -330);
      addProp(group, new THREE.SphereGeometry(random(1.8, 3.5), 10, 8), propMaterial(index % 3 ? "#e05252" : "#ffe066", { emissive: "#ff9c62", emissiveIntensity: 1.6 }), { x, y: 1, z });
    }
  }

  if (locationId === "dawnLake") {
    for (let index = 0; index < 10; index += 1) {
      const [x, z] = waterSpot(240, -60, -300);
      addProp(group, new THREE.PlaneGeometry(random(80, 210), random(18, 44)), propMaterial("#ffe3bd", { transparent: true, opacity: random(.14, .3), roughness: 1 }), {
        x, y: random(1.5, 9), z, rotation: [-Math.PI / 2, random(-.2, .2), 0]
      });
    }
    for (let index = 0; index < 28; index += 1) {
      const [x, z] = waterSpot(250, -45, -300);
      addProp(group, new THREE.CylinderGeometry(.15, .28, 9, 4), propMaterial("#84572d"), { x, y: 4, z, rotation: [random(-.16, .16), 0, random(-.16, .16)] });
    }
    addProp(group, new THREE.BoxGeometry(8, 2.2, 28), propMaterial("#67432a"), { x: 75, y: 1.2, z: -110, rotation: [0, .28, 0] });
    addProp(group, new THREE.BoxGeometry(2, 6, 7), propMaterial("#5a3a24"), { x: 62, y: 2, z: -112, rotation: [0, .72, 0] });
    addProp(group, new THREE.BoxGeometry(2, 6, 7), propMaterial("#5a3a24"), { x: 88, y: 2, z: -108, rotation: [0, -.35, 0] });
  }

  if (locationId === "tropicalLagoon") {
    for (let index = 0; index < 6; index += 1) {
      const [x, z] = waterSpot(300, -90, -360);
      addProp(group, new THREE.CylinderGeometry(1.1, 2, random(24, 36), 8), propMaterial("#9c7550"), { x, y: 12, z, rotation: [random(-.13, .13), 0, random(-.13, .13)] });
      for (let leaf = 0; leaf < 7; leaf += 1) {
        addProp(group, new THREE.ConeGeometry(2, random(15, 24), 4), propMaterial("#25a173"), {
          x: x + random(-7, 7), y: random(23, 31), z: z + random(-7, 7),
          rotation: [random(-1, 1), random(0, 6), random(-1, 1)], scale: [1, 1, .25]
        });
      }
    }
    const coralColors = ["#ff6f80", "#ffb45e", "#7ee3d5", "#b57bff"];
    for (let index = 0; index < 38; index += 1) {
      const [x, z] = waterSpot(230, -35, -290);
      const geometry = index % 3 === 0 ? new THREE.TorusGeometry(random(2, 6), random(.7, 1.6), 6, 12) : new THREE.ConeGeometry(random(1.8, 4.5), random(4, 11), 5);
      addProp(group, geometry, propMaterial(coralColors[index % coralColors.length], { emissive: coralColors[index % coralColors.length], emissiveIntensity: .28, roughness: .55 }), {
        x, y: random(.5, 3), z, rotation: [random(-.25, .25), random(0, 6), index % 3 === 0 ? Math.PI / 2 : 0]
      });
    }
    addProp(group, new THREE.CircleGeometry(110, 42), propMaterial("#f3e3ba", { roughness: .95 }), { x: -180, y: .18, z: -235, rotation: [-Math.PI / 2, 0, 0] });
  }

  if (locationId === "arcticLake") {
    const floeGeometry = new THREE.CylinderGeometry(1, 1, 1, 7);
    for (let index = 0; index < 54; index += 1) {
      const [x, z] = waterSpot(300, -45, -380);
      const width = random(8, 30);
      addProp(group, floeGeometry, propMaterial("#eaf5ff", { roughness: .3, metalness: .04 }), {
        x, y: random(.15, .55), z, scale: [width, random(1.2, 3), width * random(.65, 1)], rotation: [0, random(0, 6), 0]
      });
    }
    for (let index = 0; index < 9; index += 1) {
      const [x, z] = waterSpot(360, -130, -430);
      addProp(group, new THREE.DodecahedronGeometry(random(22, 52), 0), propMaterial(index % 3 ? "#dcefff" : "#f8fdff", { roughness: .42 }), {
        x, y: random(5, 18), z, rotation: [random(0, 3), random(0, 3), random(0, 3)], scale: [1, random(.75, 1.6), random(.8, 1.3)]
      });
    }
    addProp(group, new THREE.BoxGeometry(180, 80, 420), propMaterial("#f4fcff", { roughness: .48 }), { x: 0, y: 24, z: -640, scale: [1, 1, 1] });
  }

  if (locationId === "mangroveForest") {
    for (let index = 0; index < 16; index += 1) {
      const [x, z] = waterSpot(290, -70, -400);
      const height = random(35, 65);
      for (let root = 0; root < 6; root += 1) {
        addProp(group, new THREE.CylinderGeometry(.65, 1.2, random(13, 24), 5), propMaterial("#5a3d27"), {
          x: x + random(-9, 9), y: random(5, 10), z: z + random(-9, 9),
          rotation: [random(-.4, .4), random(0, 6), random(-.4, .4)]
        });
      }
      addProp(group, new THREE.CylinderGeometry(1.5, 2.2, height, 7), propMaterial("#4b331f"), { x, y: height / 2 + 4, z });
      addProp(group, new THREE.SphereGeometry(height * .28, 8, 6), propMaterial(index % 3 ? "#1f613d" : "#256e42", { flatShading: true }), { x, y: height + 8, z, scale: [1.35, .78, 1.35] });
    }
    for (let index = 0; index < 34; index += 1) {
      const [x, z] = waterSpot(250, -30, -250);
      addProp(group, new THREE.CircleGeometry(random(.7, 1.6), 5), propMaterial(index % 4 ? "#3f8148" : "#c2763b"), { x, y: .28, z, rotation: [-Math.PI / 2, 0, random(0, 6)] });
    }
  }

  if (locationId === "glowCave") {
    const crystalColors = ["#75f6ff", "#9a8bff", "#61ffc6", "#f69fff"];
    for (let index = 0; index < 78; index += 1) {
      const [x, z] = waterSpot(270, -25, -430);
      const color = crystalColors[index % crystalColors.length];
      const height = random(4, 24);
      addProp(group, new THREE.ConeGeometry(random(.8, 3.4), height, 5), propMaterial(color, {
        emissive: color, emissiveIntensity: random(1.5, 4), roughness: .12, metalness: .12
      }), { x, y: height / 2 - random(1, 2), z, rotation: [random(-.35, .35), random(0, 6), random(-.35, .35)] });
    }
    for (let index = 0; index < 26; index += 1) {
      const [x, z] = waterSpot(360, -150, -500);
      addProp(group, new THREE.ConeGeometry(random(6, 20), random(35, 90), 6), propMaterial("#2a3566", { roughness: .88 }), {
        x, y: random(28, 55), z, rotation: [Math.PI, random(0, 6), random(-.22, .22)]
      });
    }
    addProp(group, new THREE.TorusGeometry(105, 28, 8, 42), propMaterial("#243059", { roughness: .85 }), { x: 0, y: 48, z: -505, rotation: [0, 0, 0] });
    const glowCount = 420;
    const glowPositions = new Float32Array(glowCount * 3);
    for (let index = 0; index < glowCount; index += 1) {
      glowPositions[index * 3] = random(-430, 430);
      glowPositions[index * 3 + 1] = random(1, 120);
      glowPositions[index * 3 + 2] = random(-490, -10);
    }
    const glowGeometry = new THREE.BufferGeometry();
    glowGeometry.setAttribute("position", new THREE.BufferAttribute(glowPositions, 3));
    addProp(group, glowGeometry, new THREE.PointsMaterial({
      color: "#8deaff", size: 2.5, transparent: true, opacity: .55,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
  }

  scene.add(group);
}

function buildStars(scene, config) {
  const starCount = config.stars || 2600;
  const positions = [];
  for (let index = 0; index < starCount; index += 1) {
    const direction = new THREE.Vector3().randomDirection();
    if (direction.y < 0.07) direction.y = Math.abs(direction.y) + 0.07;
    positions.push(direction.x * 3600, direction.y * 3600, direction.z * 3600);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: "#eaf2ff", size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0.78, fog: false
  });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  return stars;
}

function buildMoon(scene, config) {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(48, 48, 24),
    new THREE.MeshBasicMaterial({ color: "#fffbe9", fog: false })
  );
  const moonPosition = new THREE.Vector3(-460, 340, -1600);
  moon.position.copy(moonPosition);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: createGlowTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  }));
  glow.scale.setScalar(560);
  glow.position.copy(moonPosition);
  const moonLayer = new THREE.Group();
  moonLayer.add(moon, glow);
  scene.add(moonLayer);
  return moonLayer;
}

class FishingScene3D {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(58, host.clientWidth / host.clientHeight, 0.2, 12000);
    this.camera.position.set(0, 2.1, 25);
    this.camera.lookAt(0, 2, -500);
    this.moveTarget = new THREE.Vector3(0, 0, 25);
    this.moveVelocity = new THREE.Vector3();
    this.moveInput = new THREE.Vector2();
    this.moveKeys = new Set();
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(new THREE.Scene(), this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(host.clientWidth, host.clientHeight), 0.28, 0.72, 0.76
    );
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.gradePass = new ShaderPass(CinematicShader);
    this.composer.addPass(this.gradePass);
    this.composer.addPass(new OutputPass());
    this.waveNormals = createWaveNormals();
    this.activeId = "";
    this.loadingId = "";
    this.scene = null;
    this.water = null;
    this.sky = null;
    this.sunlight = null;
    this.hemisphere = null;
    this.moonlight = null;
    this.weatherParticles = null;
    this.weatherState = null;
    this.dayTime = null;
    this.cloudLayer = null;
    this.airMotes = null;
    this.birdLayer = null;
    this.starLayer = null;
    this.moonLayer = null;
    this.clock = new THREE.Clock();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.renderer.setAnimationLoop(() => this.update());
    this.bindMovement();
    this.setLocation(host.dataset.location || "pond");
  }

  bindMovement() {
    const updateInput = () => {
      this.moveInput.set(
        (this.moveKeys.has("KeyD") ? 1 : 0) - (this.moveKeys.has("KeyA") ? 1 : 0),
        (this.moveKeys.has("KeyS") ? 1 : 0) - (this.moveKeys.has("KeyW") ? 1 : 0)
      );
      if (this.moveInput.lengthSq() > 1) this.moveInput.normalize();
    };
    window.addEventListener("keydown", (event) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (!["KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) return;
      event.preventDefault();
      this.moveKeys.add(event.code);
      updateInput();
    });
    window.addEventListener("keyup", (event) => {
      if (!this.moveKeys.has(event.code)) return;
      this.moveKeys.delete(event.code);
      updateInput();
    });
    window.addEventListener("blur", () => {
      this.moveKeys.clear();
      this.moveInput.set(0, 0);
    });

    let dragPointerId = null;
    let dragStartX = 0;
    let dragStartY = 0;
    const dragDeadzone = 8;
    const dragRange = 56;
    const updateDragInput = (clientX, clientY) => {
      const rawX = (clientX - dragStartX) / dragRange;
      const rawY = (clientY - dragStartY) / dragRange;
      const length = Math.hypot(rawX, rawY);
      if (length < dragDeadzone / dragRange) {
        this.moveInput.set(0, 0);
        return;
      }
      const scale = Math.min(length, 1) / length;
      this.moveInput.set(rawX * scale, rawY * scale);
    };
    host.addEventListener("pointerdown", (event) => {
      if (dragPointerId !== null) return;
      const target = event.target;
      if (target instanceof Element && target.closest("button, .rod-control, .scene-location-selector, .catch-reveal, .aim-game")) return;
      dragPointerId = event.pointerId;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      host.setPointerCapture(event.pointerId);
    });
    host.addEventListener("pointermove", (event) => {
      if (event.pointerId !== dragPointerId) return;
      updateDragInput(event.clientX, event.clientY);
    });
    const releaseDrag = (event) => {
      if (event.pointerId !== dragPointerId) return;
      dragPointerId = null;
      this.moveInput.set(0, 0);
    };
    host.addEventListener("pointerup", releaseDrag);
    host.addEventListener("pointercancel", releaseDrag);
  }

  resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
  }

  update() {
    if (!this.scene || !this.water) return;
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const config = configs[this.activeId];
    this.water.material.uniforms.time.value += delta * config.flowSpeed;
    const desiredVelocity = new THREE.Vector3(this.moveInput.x, 0, this.moveInput.y)
      .normalize()
      .multiplyScalar(this.moveInput.lengthSq() > 0 ? 8.5 : 0);
    this.moveVelocity.lerp(desiredVelocity, 1 - Math.exp(-9 * delta));
    this.moveTarget.addScaledVector(this.moveVelocity, delta);
    this.moveTarget.x = THREE.MathUtils.clamp(this.moveTarget.x, -20, 20);
    this.moveTarget.z = THREE.MathUtils.clamp(this.moveTarget.z, 12, 48);
    this.camera.position.set(
      this.moveTarget.x + Math.sin(this.clock.elapsedTime * 0.06) * 0.3,
      (config.cameraHeight ?? 2.35)
        + Math.sin(this.clock.elapsedTime * 0.23) * 0.045,
      this.moveTarget.z
    );
    if (this.weatherParticles) {
      const positions = this.weatherParticles.geometry.attributes.position;
      const speed = this.weatherState?.kind === "snow" ? 42 : 155;
      for (let index = 0; index < positions.count; index += 1) {
        const y = positions.getY(index) - speed * delta;
        positions.setY(index, y < -4 ? 220 + Math.random() * 140 : y);
        if (this.weatherState?.kind === "snow") positions.setX(index, positions.getX(index) + Math.sin((this.clock.elapsedTime + index) * 1.2) * delta * 6);
      }
      positions.needsUpdate = true;
    }
    if (this.cloudLayer) {
      this.cloudLayer.children.forEach((cloud, index) => {
        cloud.position.x += delta * (4.5 + (index % 5) * 1.4);
        if (cloud.position.x > 2100) cloud.position.x = -2100;
      });
    }
    if (this.airMotes) this.airMotes.rotation.y += delta * 0.012;
    updateBirdLayer(delta, this.clock, this.birdLayer);
    if (this.gradePass) this.gradePass.uniforms.time.value = this.clock.elapsedTime;
    this.composer.render(delta);
  }

  disposeScene() {
    if (!this.scene) return;
    this.scene.traverse((child) => {
      child.geometry?.dispose?.();
      const material = child.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose?.());
      else material?.dispose?.();
    });
    this.scene.environment?.dispose?.();
    this.scene.clear();
    this.scene = null;
    this.water = null;
    this.sky = null;
    this.sunlight = null;
    this.weatherParticles = null;
    this.cloudLayer = null;
    this.airMotes = null;
    this.birdLayer = null;
    this.renderer.renderLists.dispose();
  }

  setWeather(weatherState) {
    this.weatherState = weatherState;
    if (this.scene) this.applyWeather(weatherState);
  }

  setTime(timeOfDay) {
    this.dayTime = Math.max(0, Math.min(1, Number(timeOfDay) || 0));
    if (this.scene) this.applyWeather(this.weatherState);
  }

  buildWeatherParticles(kind) {
    const count = kind === "storm" ? 3200 : kind === "rain" ? 2400 : 1600;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 650;
      positions[index * 3 + 1] = Math.random() * 380;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 650 + 30;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: kind === "snow" ? "#ffffff" : "#bcdcff",
      size: kind === "snow" ? 4.5 : 2.1,
      transparent: true,
      opacity: kind === "storm" ? 0.52 : 0.4,
      fog: false
    });
    this.weatherParticles = new THREE.Points(geometry, material);
    this.scene.add(this.weatherParticles);
  }

  applyWeather(weatherState) {
    if (!this.scene) return;
    const config = configs[this.activeId];
    if (!config) return;
    const weather = weatherState || {
      kind: "clear", isDay: this.dayTime === null || (this.dayTime > 0.25 && this.dayTime < 0.78), cloudCover: 20
    };
    const overcast = weather.kind === "cloud" || weather.kind === "fog"
      || weather.kind === "rain" || weather.kind === "snow" || weather.kind === "storm";
    const rainy = weather.kind === "rain" || weather.kind === "storm";
    const snowy = weather.kind === "snow";

    if (this.sky) {
      const skyUniforms = this.sky.material.uniforms;
      skyUniforms.turbidity.value = config.turbidity + (overcast ? 5.5 : 0) + (rainy ? 2.5 : 0);
      skyUniforms.rayleigh.value = Math.max(0.12, config.rayleigh * (overcast ? 0.36 : 1));
      skyUniforms.mieCoefficient.value = config.mieCoefficient + (overcast ? 0.016 : 0);
    }
    if (this.sunlight) {
      this.sunlight.intensity = config.sunIntensity * (weather.kind === "storm" ? 0.14 : overcast ? 0.32 : 0.8);
    }
    this.renderer.toneMappingExposure = config.exposure * (weather.kind === "storm" ? 0.48 : overcast ? 0.7 : 0.88);
    if (this.bloomPass) {
      this.bloomPass.strength = config.bloom.strength
        * (weather.kind === "storm" ? 0.25 : overcast ? 0.52 : 1);
    }
    if (this.gradePass) {
      const grade = config.grade ?? { warmth: 0, vignette: 0.28, grain: 0.035, saturation: 1.06, contrast: 1.04 };
      this.gradePass.uniforms.warmth.value = grade.warmth
        + (weather.kind === "storm" ? -0.05 : rainy || snowy ? -0.04 : overcast ? -0.02 : 0);
      this.gradePass.uniforms.vignette.value = grade.vignette * (overcast ? 1.1 : 1);
      this.gradePass.uniforms.grain.value = grade.grain
        * (weather.kind === "storm" ? 1.25 : rainy || snowy ? 1.1 : 1);
      this.gradePass.uniforms.saturation.value = grade.saturation * (weather.kind === "storm" ? 0.88 : overcast ? 0.95 : 1);
      this.gradePass.uniforms.contrast.value = grade.contrast * (weather.kind === "storm" ? 1.05 : overcast ? 1.02 : 1);
    }

    if (this.weatherParticles) {
      this.scene.remove(this.weatherParticles);
      this.weatherParticles.geometry.dispose();
      this.weatherParticles.material.dispose();
      this.weatherParticles = null;
    }
    if (rainy || snowy) this.buildWeatherParticles(rainy ? "rain" : "snow");
    this.applyTime(weather, overcast);
  }

  applyTime(weather, overcast) {
    const config = configs[this.activeId];
    if (!this.sky || !this.sunlight) return;
    const hour = this.dayTime === null
      ? (weather.isDay ? 12 : 22)
      : this.dayTime * 24;
    const dayRatio = THREE.MathUtils.clamp((hour - 5) / 14, 0, 1);
    const arc = dayRatio * Math.PI;
    const elevation = Math.sin(arc) * 58 - 9;
    const azimuth = 95 + dayRatio * 165;
    const isNight = elevation <= 0;
    const sunPosition = new THREE.Vector3().setFromSphericalCoords(
      1,
      THREE.MathUtils.degToRad(90 - elevation),
      THREE.MathUtils.degToRad(azimuth)
    );
    const skyUniforms = this.sky.material.uniforms;
    skyUniforms.sunPosition.value.copy(sunPosition);
    skyUniforms.rayleigh.value = isNight
      ? 0.12
      : THREE.MathUtils.lerp(3.2, config.rayleigh, Math.min(1, Math.abs(Math.sin(arc)) * 1.6));
    skyUniforms.mieCoefficient.value = config.mieCoefficient * (isNight ? 0.28 : 1);

    const horizonPower = Math.max(0, 1 - Math.abs(elevation) / 18);
    const sunColor = new THREE.Color(isNight ? "#9db8ff" : "#fff6dc");
    sunColor.lerp(new THREE.Color("#ff9d66"), horizonPower * 0.82);
    this.sunlight.color.copy(sunColor);
    this.sunlight.position.copy(sunPosition).multiplyScalar(1000);
    this.sunlight.intensity *= isNight ? 0.1 : THREE.MathUtils.lerp(0.35, 1, Math.min(1, elevation / 38));
    if (this.moonlight) this.moonlight.intensity = isNight ? 0.56 : 0;

    const fogColor = new THREE.Color(config.fogColor);
    if (isNight) fogColor.lerp(new THREE.Color("#0b1728"), 0.82);
    else fogColor.lerp(new THREE.Color("#ffb072"), horizonPower * 0.55);
    if (overcast) fogColor.lerp(new THREE.Color(weather.isDay && !isNight ? "#b7bfca" : "#16202c"), 0.52);
    this.scene.fog.color.copy(fogColor);
    this.renderer.toneMappingExposure *= isNight ? 0.44 : THREE.MathUtils.lerp(0.72, 1, Math.min(1, elevation / 34));

    if (this.hemisphere) {
      this.hemisphere.intensity = config.hemiIntensity * (isNight ? 0.34 : overcast ? 0.58 : 0.94);
    }
    if (this.water) {
      this.water.material.uniforms.sunDirection.value.copy(sunPosition);
      this.water.material.uniforms.sunColor.value.copy(sunColor);
    }
    if (this.starLayer) {
      this.starLayer.visible = isNight;
      this.starLayer.material.opacity = Math.min(0.85, Math.max(0.12, -elevation / 20));
    }
    if (this.moonLayer) {
      this.moonLayer.visible = true;
      this.moonLayer.position.set(-sunPosition.x * 1400, Math.abs(sunPosition.y) * 1400 + 180, -sunPosition.z * 1400);
      this.moonLayer.children.forEach((child) => child.visible = isNight);
    }
    if (this.cloudLayer) {
      this.cloudLayer.children.forEach((cloud) => {
        cloud.material.color.set(isNight ? "#45566b" : overcast ? "#b8bfc8" : config.cloudTint);
      });
    }
  }

  buildScene(config) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(config.fogColor, config.fogDensity);
    this.scene = scene;

    const sky = new Sky();
    sky.scale.setScalar(9000);
    const skyUniforms = sky.material.uniforms;
    skyUniforms.turbidity.value = config.turbidity;
    skyUniforms.rayleigh.value = config.rayleigh;
    skyUniforms.mieCoefficient.value = config.mieCoefficient;
    skyUniforms.mieDirectionalG.value = config.mieDirectionalG;
    const sunPosition = new THREE.Vector3().setFromSphericalCoords(
      1,
      THREE.MathUtils.degToRad(90 - config.sunElevation),
      THREE.MathUtils.degToRad(config.sunAzimuth)
    );
    skyUniforms.sunPosition.value.copy(sunPosition);
    scene.add(sky);
    this.sky = sky;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    scene.environment = pmrem.fromScene(sky).texture;
    pmrem.dispose();

    const hemisphere = new THREE.HemisphereLight(config.hemiSky, config.hemiGround, config.hemiIntensity);
    scene.add(hemisphere);
    this.hemisphere = hemisphere;
    const sunlight = new THREE.DirectionalLight(config.sunColor, config.sunIntensity);
    sunlight.position.copy(sunPosition).multiplyScalar(1000);
    scene.add(sunlight);
    this.sunlight = sunlight;
    const moonlight = new THREE.DirectionalLight("#d3e4ff", config.moon ? 0.72 : 0);
    moonlight.position.set(-460, 340, -1600);
    scene.add(moonlight);
    this.moonlight = moonlight;

    const water = new Water(
      new THREE.PlaneGeometry(3600, 1900),
      {
        textureWidth: 1024,
        textureHeight: 1024,
        waterNormals: this.waveNormals,
        sunDirection: sunPosition.clone(),
        sunColor: config.sunColor,
        waterColor: config.waterColor,
        distortionScale: config.distortionScale,
        fog: true,
        alpha: 1
      }
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0, -220);
    water.material.uniforms.size.value = config.waterSize;
    scene.add(water);
    this.water = water;

    buildTerrain(scene, config);
    buildTrees(scene, config);
    buildCityLights(scene, config);
    this.starLayer = buildStars(scene, config);
    this.moonLayer = buildMoon(scene, config);
    this.cloudLayer = buildCloudLayer(scene, config);
    buildShoreGlow(scene, config);
    this.airMotes = buildAirMotes(scene, config);
    this.birdLayer = buildBirdLayer(scene, config);
    buildLocationProps(scene, this.activeId, config);
    this.renderPass.scene = scene;
    this.bloomPass.strength = config.bloom.strength;
    this.bloomPass.radius = config.bloom.radius;
    this.bloomPass.threshold = config.bloom.threshold;
    if (config.grade) {
      Object.entries(config.grade).forEach(([key, value]) => {
        this.gradePass.uniforms[key].value = value;
      });
    }
    this.renderer.toneMappingExposure = config.exposure;
    this.applyWeather(this.weatherState);
  }

  async setLocation(locationId) {
    const config = configs[locationId];
    if (!config || this.loadingId === locationId || this.activeId === locationId) return;
    this.loadingId = locationId;
    host.classList.remove("webgl-ready");
    status.textContent = "正在加载真实水面…";
    status.classList.remove("hidden");
    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      this.disposeScene();
      this.activeId = locationId;
      this.moveTarget.set(0, 0, 25);
      this.moveVelocity.set(0, 0, 0);
      this.buildScene(config);
      host.classList.add("webgl-ready");
      status.classList.add("hidden");
    } catch (error) {
      console.error("Three.js scene failed to load:", error);
      status.textContent = "在线 3D 水面加载失败，已使用本地风景。";
    } finally {
      this.loadingId = "";
    }
  }
}

try {
  window.CloudFishingScene = new FishingScene3D();
} catch (error) {
  console.error("WebGL is unavailable:", error);
  host.classList.remove("webgl-ready");
  status.textContent = "当前浏览器不支持 WebGL，已使用本地风景。";
  status.classList.remove("hidden");
}
