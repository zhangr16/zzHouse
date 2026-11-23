import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { TextureLoader } from "three";

export function createTempleScene({ canvas, quality, notify }) {
  const windGroups = [];
  const stoneMaterials = [];
  const woodMaterials = [];
const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality.antialias, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .92;
renderer.shadowMap.enabled = quality.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(quality.pixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#aec8d0");
scene.fog = new THREE.Fog("#b7c9c8", 24, 125);
const interiorGroup = new THREE.Group();
interiorGroup.name = "temple-interior";
const exteriorGroup = new THREE.Group();
exteriorGroup.name = "temple-exterior";
const shellGroup = new THREE.Group();
shellGroup.name = "temple-shell";
const vistaGroup = new THREE.Group();
vistaGroup.name = "temple-vista";
scene.add(interiorGroup, exteriorGroup, shellGroup, vistaGroup);
const hallBackZ = -10.6, hallFrontZ = 6.68;
const hallCenterZ = (hallBackZ + hallFrontZ) * .5;
const hallDepth = hallFrontZ - hallBackZ;
const hallFloorDepth = hallDepth + 2.02;
const areaConfig = {
  interiorZ: 6.75,
  exteriorZ: 7.05,
  interiorMaxX: 7.15,
  exteriorMaxX: 12.4,
  minZ: -6.8,
  maxZ: 26.5,
  cameraMinZ: hallBackZ + .35
};
const camera = new THREE.PerspectiveCamera(54, 1, .1, 180);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .05).texture;
scene.environmentIntensity = .30;
const hemisphereLight = new THREE.HemisphereLight("#ffe0b4", "#1d1713", .38);
scene.add(hemisphereLight);

if (!quality.mobile) {
  new RGBELoader().load("https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/textures/equirectangular/royal_esplanade_1k.hdr", texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.environmentIntensity = .38;
  }, undefined, () => notify("在线 HDRI 暂时不可用，已使用基础环境光。"));
}

const sun = new THREE.DirectionalLight("#fff2d7", 1.24);
sun.position.set(7, 14, 18);
sun.castShadow = quality.shadows;
sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
sun.shadow.camera.left = -18; sun.shadow.camera.right = 18;
sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -18;
sun.shadow.bias = -.0005;
sun.shadow.radius = 4;
scene.add(sun);
const fillLight = new THREE.DirectionalLight("#9ec7d2", .20);
fillLight.position.set(-9, 7, 4);
scene.add(fillLight);

function texture(size, painter, repeatX = 1, repeatY = 1) {
  const element = document.createElement("canvas");
  element.width = element.height = size;
  painter(element.getContext("2d"), size);
  const map = new THREE.CanvasTexture(element);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = Math.min(quality.maxAnisotropy, renderer.capabilities.getMaxAnisotropy());
  return map;
}

const stone = texture(512, (ctx, size) => {
  ctx.fillStyle = "#b8ab9d"; ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const c = 138 + Math.random() * 38; ctx.fillStyle = `rgb(${c + 30},${c + 16},${c})`;
    ctx.fillRect(x * size / 4 + 4, y * size / 4 + 4, size / 4 - 8, size / 4 - 8);
  }
}, 8, 6);
const wood = texture(512, (ctx, size) => {
  ctx.fillStyle = "#5d2a1c"; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 55; i++) {
    ctx.globalAlpha = .12 + Math.random() * .22; ctx.strokeStyle = Math.random() > .5 ? "#7d432a" : "#2e1109";
    ctx.lineWidth = 1 + Math.random() * 6; ctx.beginPath(); ctx.moveTo(0, Math.random() * size);
    ctx.bezierCurveTo(size * .3, Math.random() * size, size * .7, Math.random() * size, size, Math.random() * size); ctx.stroke();
  } ctx.globalAlpha = 1;
}, 3, 1);
const wallMap = texture(512, (ctx, size) => {
  ctx.fillStyle = "#8a4536"; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 220; i++) { ctx.globalAlpha = .18; ctx.fillStyle = Math.random() > .5 ? "#a45b45" : "#5d241a"; ctx.beginPath(); ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 20 + 5, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}, 5, 2);
const carpetMap = texture(512, (ctx, size) => {
  ctx.fillStyle = "#7d1a17"; ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#e0b264"; ctx.lineWidth = 10; ctx.strokeRect(18, 18, size - 36, size - 36);
  ctx.strokeStyle = "#e7d0a2"; ctx.lineWidth = 3; ctx.strokeRect(36, 36, size - 72, size - 72);
});
const stoneBump = texture(512, (ctx, size) => {
  ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    ctx.fillStyle = Math.random() > .5 ? "#9b9b9b" : "#656565";
    ctx.fillRect(x * size / 4 + 3, y * size / 4 + 3, size / 4 - 6, size / 4 - 6);
  }
}, 8, 6);
const woodBump = texture(512, (ctx, size) => {
  ctx.fillStyle = "#7d7d7d"; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 70; i++) { ctx.strokeStyle = Math.random() > .5 ? "#a8a8a8" : "#575757"; ctx.lineWidth = 1 + Math.random() * 5; ctx.beginPath(); ctx.moveTo(0, Math.random() * size); ctx.bezierCurveTo(size * .3, Math.random() * size, size * .7, Math.random() * size, size, Math.random() * size); ctx.stroke(); }
}, 3, 1);
const fabricBump = texture(512, (ctx, size) => {
  ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 4) for (let x = 0; x < size; x += 4) { ctx.fillStyle = (x + y) % 8 ? "#8d8d8d" : "#717171"; ctx.fillRect(x, y, 4, 4); }
}, 5, 5);
[stoneBump, woodBump, fabricBump].forEach(item => item.colorSpace = THREE.NoColorSpace);
const roofTile = texture(512, (ctx, size) => {
  ctx.fillStyle = "#31353d"; ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 36) for (let x = 0; x < size; x += 54) {
    const gradient = ctx.createLinearGradient(x, y, x + 52, y + 34);
    gradient.addColorStop(0, "#5b6270"); gradient.addColorStop(.58, "#3a404a"); gradient.addColorStop(1, "#20242c");
    ctx.fillStyle = gradient; ctx.beginPath();
    ctx.ellipse(x + 26, y + 18, 24, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(14,16,20,.72)"; ctx.lineWidth = 2.4; ctx.stroke();
  }
  for (let index = 0; index < 180; index++) { ctx.globalAlpha = .05; ctx.fillStyle = index % 2 ? "#0f1116" : "#788394"; ctx.beginPath(); ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 3 + .5, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}, 8, 7);
const roofTileNormal = texture(512, (ctx, size) => {
  ctx.fillStyle = "#8080ff"; ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 36) for (let x = 0; x < size; x += 54) {
    const gradient = ctx.createLinearGradient(x, y, x, y + 34);
    gradient.addColorStop(0, "#b4b4ff"); gradient.addColorStop(.45, "#8080ff"); gradient.addColorStop(1, "#4a4aff");
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.ellipse(x + 26, y + 18, 24, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#30306f"; ctx.lineWidth = 3; ctx.stroke();
  }
}, 8, 7);
roofTileNormal.colorSpace = THREE.NoColorSpace;

const skyUniforms = {
  topColor: { value: new THREE.Color("#6f9ab8") },
  horizonColor: { value: new THREE.Color("#d6ddd9") },
  bottomColor: { value: new THREE.Color("#b7c9c8") },
  sunColor: { value: new THREE.Color("#fff1d5") },
  sunDirection: { value: new THREE.Vector3(7, 14, 18).normalize() }
};
const skyMaterial = new THREE.ShaderMaterial({
  uniforms: skyUniforms,
  side: THREE.BackSide,
  depthWrite: false,
  fog: false,
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 horizonColor;
    uniform vec3 bottomColor;
    uniform vec3 sunColor;
    uniform vec3 sunDirection;
    varying vec3 vWorldPosition;
    void main() {
      vec3 direction = normalize(vWorldPosition - cameraPosition);
      vec3 color = mix(bottomColor, horizonColor, smoothstep(-0.28, 0.08, direction.y));
      color = mix(color, topColor, smoothstep(0.02, 0.72, direction.y));
      float glow = pow(max(dot(direction, normalize(sunDirection)), 0.0), 24.0);
      color += sunColor * glow * 0.38;
      gl_FragColor = vec4(color, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(112, 48, 32), skyMaterial);
sky.renderOrder = -1000;
scene.add(sky);

const textureLoader = new TextureLoader();
function loadPbrTexture(path, repeatX, repeatY, colorTexture = false) {
  return new Promise((resolve, reject) => {
    textureLoader.load(path, texture => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.colorSpace = colorTexture ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.anisotropy = Math.min(quality.maxAnisotropy, renderer.capabilities.getMaxAnisotropy());
      resolve(texture);
    }, undefined, reject);
  });
}
function bumpTextureToNormal(bumpTexture, strength = 2.6) {
  return new Promise(resolve => {
    const source = bumpTexture.image, normalCanvas = document.createElement("canvas");
    normalCanvas.width = source.width; normalCanvas.height = source.height;
    const context = normalCanvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(source, 0, 0);
    const imageData = context.getImageData(0, 0, source.width, source.height);
    const sourcePixels = imageData.data, normalPixels = context.createImageData(source.width, source.height);
    const heightAt = (x, y) => {
      const wrappedX = (x + source.width) % source.width, wrappedY = (y + source.height) % source.height;
      return sourcePixels[(wrappedY * source.width + wrappedX) * 4] / 255;
    };
    for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
      const left = heightAt(x - 1, y), right = heightAt(x + 1, y);
      const top = heightAt(x, y - 1), bottom = heightAt(x, y + 1);
      const slopeX = (left - right) * strength, slopeY = (bottom - top) * strength;
      const inverseLength = 1 / Math.hypot(slopeX, slopeY, 1);
      const index = (y * source.width + x) * 4;
      normalPixels.data[index] = (slopeX * inverseLength * .5 + .5) * 255;
      normalPixels.data[index + 1] = (slopeY * inverseLength * .5 + .5) * 255;
      normalPixels.data[index + 2] = inverseLength * 255;
      normalPixels.data[index + 3] = 255;
    }
    context.putImageData(normalPixels, 0, 0);
    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.copy(bumpTexture.repeat);
    normalMap.colorSpace = THREE.NoColorSpace;
    normalMap.anisotropy = bumpTexture.anisotropy;
    resolve(normalMap);
  });
}

let pbrLoading = false;
let pbrLoaded = false;
async function hydratePbrTextures() {
  if (!quality.pbr || pbrLoading || pbrLoaded) return;
  pbrLoading = true;
  try {
    const [stoneDiffuse, stoneBumpTexture, stoneRoughness] = await Promise.all([
      loadPbrTexture("https://threejs.org/examples/textures/brick_diffuse.jpg", 8, 6, true),
      loadPbrTexture("https://threejs.org/examples/textures/brick_bump.jpg", 8, 6),
      loadPbrTexture("https://threejs.org/examples/textures/brick_roughness.jpg", 8, 6)
    ]);
    const [woodDiffuse, woodBumpTexture, woodRoughness] = await Promise.all([
      loadPbrTexture("https://threejs.org/examples/textures/hardwood2_diffuse.jpg", 3, 1, true),
      loadPbrTexture("https://threejs.org/examples/textures/hardwood2_bump.jpg", 3, 1),
      loadPbrTexture("https://threejs.org/examples/textures/hardwood2_roughness.jpg", 3, 1)
    ]);
    const [stoneNormal, woodNormal] = await Promise.all([
      bumpTextureToNormal(stoneBumpTexture, 3.2),
      bumpTextureToNormal(woodBumpTexture, 2.2)
    ]);
    stoneMaterials.forEach(material => {
      material.map = stoneDiffuse;
      material.normalMap = stoneNormal;
      material.roughnessMap = stoneRoughness;
      material.bumpMap = null;
      material.normalScale.set(material === floorMaterial ? 1.05 : .75, material === floorMaterial ? 1.05 : .75);
      material.roughness = 1;
      if (material === floorMaterial) material.clearcoat = .08;
      material.needsUpdate = true;
    });
    woodMaterials.forEach(material => {
      material.map = woodDiffuse;
      material.normalMap = woodNormal;
      material.roughnessMap = woodRoughness;
      material.bumpMap = null;
      material.normalScale.set(.68, .68);
      material.roughness = 1;
      material.clearcoat = .18;
      material.needsUpdate = true;
    });
    pbrLoaded = true;
  } catch {
    notify("照片级材质暂时不可用，继续使用内置纹理。");
  } finally {
    pbrLoading = false;
  }
}

function schedulePbrWarmup() {
  if (!quality.pbr || pbrLoading || pbrLoaded) return;
  const run = () => hydratePbrTextures();
  if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 1600);
}

function groundLevel(positionZ) {
  if (positionZ <= 6.9) return 0;
  if (positionZ <= 10.2) return THREE.MathUtils.lerp(0, -.42, THREE.MathUtils.smoothstep(positionZ, 6.9, 10.2));
  if (positionZ <= 17) return -.42;
  return THREE.MathUtils.lerp(-.42, 3.2, THREE.MathUtils.smoothstep(positionZ, 17, 27));
}

const releasePondLayout = { x: -6.2, z: 20.5, radius: 2.2, terraceRadius: 4.4, blendRadius: 8.2 };
releasePondLayout.terraceY = groundLevel(releasePondLayout.z) - .16;

function surfaceLevel(positionX, positionZ) {
  const base = groundLevel(positionZ);
  const distance = Math.hypot(positionX - releasePondLayout.x, positionZ - releasePondLayout.z);
  if (distance >= releasePondLayout.blendRadius) return base;
  const weight = 1 - THREE.MathUtils.smoothstep(distance, releasePondLayout.terraceRadius, releasePondLayout.blendRadius);
  return THREE.MathUtils.lerp(base, releasePondLayout.terraceY, weight);
}

const contactShadowEntries = [];
const landscapeStoneMaterial = new THREE.MeshStandardMaterial({ color: "#8f8d82", roughness: .88, flatShading: true });
const landscapeStoneDarkMaterial = new THREE.MeshStandardMaterial({ color: "#6e6d65", roughness: .92, flatShading: true });
const treeTrunkMaterial = new THREE.MeshStandardMaterial({ color: "#5a4332", roughness: .94, flatShading: true });
const treeBranchMaterial = new THREE.MeshStandardMaterial({ color: "#684b36", roughness: .92, flatShading: true });
const foliageClusterMaterial = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: .86, flatShading: true });
const bambooLeafMaterial = new THREE.MeshStandardMaterial({ color: "#6f9b54", roughness: .82, flatShading: true });
const shrubLeafMaterials = {
  green: new THREE.MeshStandardMaterial({ color: "#416b46", roughness: .88, flatShading: true }),
  flowering: new THREE.MeshStandardMaterial({ color: "#3d6849", roughness: .88, flatShading: true }),
  flower: new THREE.MeshStandardMaterial({ color: "#ffd9e2", roughness: .78, flatShading: true })
};
const treeClusterGeometryHigh = new THREE.IcosahedronGeometry(1, 1);
const treeClusterGeometryLow = new THREE.IcosahedronGeometry(1, 0);
const treeBranchGeometry = new THREE.CylinderGeometry(.66, 1, 1, 7, 1, false);
const leafCardGeometry = new THREE.PlaneGeometry(1, 1);
const leafCardMap = texture(128, (ctx, size) => {
  ctx.clearRect(0, 0, size, size);
  for (let index = 0; index < 7; index++) {
    const angle = index / 7 * Math.PI * 2 + .35;
    const radius = size * (.15 + (index % 2) * .055);
    ctx.save();
    ctx.translate(size * .5 + Math.cos(angle) * radius, size * .5 + Math.sin(angle) * radius);
    ctx.rotate(angle + Math.PI * .5);
    ctx.fillStyle = index % 2 ? "#f2f2df" : "#d8dcc9";
    ctx.beginPath();
    ctx.ellipse(0, 0, size * .14, size * .065, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
});
const leafCardMaterial = new THREE.MeshStandardMaterial({
  map: leafCardMap, color: "#ffffff", roughness: .90, metalness: 0,
  alphaTest: .28, side: THREE.DoubleSide, depthWrite: true
});
const contactShadowMap = texture(128, (ctx, size) => {
  const gradient = ctx.createRadialGradient(size * .5, size * .5, size * .04, size * .5, size * .5, size * .5);
  gradient.addColorStop(0, "rgba(18, 15, 12, .72)");
  gradient.addColorStop(.46, "rgba(18, 15, 12, .34)");
  gradient.addColorStop(1, "rgba(18, 15, 12, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
});
const contactShadowGeometry = new THREE.PlaneGeometry(2, 2);
const contactShadowMaterial = new THREE.MeshBasicMaterial({
  map: contactShadowMap, transparent: true, opacity: .34, depthWrite: false, color: "#ffffff"
});
const treeInstanceDummy = new THREE.Object3D();
const treeUpVector = new THREE.Vector3(0, 1, 0);
const treeColor = new THREE.Color();

function addContactShadow(positionX, positionZ, radius, zone = positionZ < 6.75 ? "interior" : "exterior") {
  contactShadowEntries.push({ x: positionX, z: positionZ, radius, zone });
}

function seededTreeRandom(seed) {
  let value = Math.abs(Math.floor(seed * 1000)) >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function buildContactShadows() {
  if (!contactShadowEntries.length) return;
  ["interior", "exterior"].forEach(zone => {
    const entries = contactShadowEntries.filter(entry => entry.zone === zone);
    if (!entries.length) return;
    const shadows = new THREE.InstancedMesh(contactShadowGeometry, contactShadowMaterial, entries.length);
    entries.forEach((entry, index) => {
      treeInstanceDummy.position.set(entry.x, surfaceLevel(entry.x, entry.z) + .016, entry.z);
      treeInstanceDummy.rotation.set(-Math.PI / 2, 0, 0);
      treeInstanceDummy.scale.set(entry.radius, entry.radius, 1);
      treeInstanceDummy.updateMatrix();
      shadows.setMatrixAt(index, treeInstanceDummy.matrix);
    });
    shadows.instanceMatrix.needsUpdate = true;
    shadows.computeBoundingSphere();
    shadows.frustumCulled = false;
    shadows.renderOrder = 1;
    (zone === "interior" ? interiorGroup : exteriorGroup).add(shadows);
  });
}

const carpetMaterial = new THREE.MeshPhysicalMaterial({ map: carpetMap, bumpMap: fabricBump, bumpScale: .18, roughness: .66, metalness: .02, sheen: .68, sheenColor: new THREE.Color("#ffbb74"), sheenRoughness: .48 });
const carpet = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 14.4), carpetMaterial);
const floorMaterial = new THREE.MeshPhysicalMaterial({ map: stone, bumpMap: stoneBump, bumpScale: .16, roughness: .3, metalness: .04, clearcoat: .16, clearcoatRoughness: .34, envMapIntensity: .8 });
stoneMaterials.push(floorMaterial);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, hallFloorDepth), floorMaterial);
floor.rotation.x = -Math.PI / 2; floor.position.z = hallCenterZ; floor.receiveShadow = true;
carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, .012, -.1); carpet.receiveShadow = true;
const wallMaterial = new THREE.MeshPhysicalMaterial({ map: wallMap, bumpMap: fabricBump.clone(), bumpScale: .08, roughness: .72, sheen: .18, sheenColor: new THREE.Color("#c78955"), envMapIntensity: .55 });
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10.1), wallMaterial); backWall.position.set(0, 5.05, hallBackZ); backWall.receiveShadow = true;
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(hallDepth + .52, 10.1), wallMaterial.clone()); leftWall.rotation.y = Math.PI / 2; leftWall.position.set(-8.5, 5.05, hallCenterZ); leftWall.receiveShadow = true;
const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(hallDepth + .52, 10.1), wallMaterial.clone()); rightWall.rotation.y = -Math.PI / 2; rightWall.position.set(8.5, 5.05, hallCenterZ); rightWall.receiveShadow = true;
const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(5.65, 10.1, .28), wallMaterial.clone());
frontWallLeft.position.set(-5.675, 5.05, 6.68); frontWallLeft.castShadow = true; frontWallLeft.receiveShadow = true;
const frontWallRight = frontWallLeft.clone();
frontWallRight.position.x = 5.675;
const frontWallHeader = new THREE.Mesh(new THREE.BoxGeometry(5.7, 4.30, .28), wallMaterial.clone());
frontWallHeader.position.set(0, 7.95, 6.68); frontWallHeader.castShadow = true; frontWallHeader.receiveShadow = true;
const roof = new THREE.Group();
const roofTileMaterial = new THREE.MeshPhysicalMaterial({ map: roofTile, normalMap: roofTileNormal, normalScale: new THREE.Vector2(.72, .72), roughness: .36, metalness: .04, clearcoat: .12, clearcoatRoughness: .32, envMapIntensity: .82, side: THREE.DoubleSide });
const roofFrameMaterial = new THREE.MeshPhysicalMaterial({ color: "#2f1710", map: wood, bumpMap: woodBump, bumpScale: .08, roughness: .52, clearcoat: .1, envMapIntensity: .6 });
woodMaterials.push(roofFrameMaterial);
function appendRoofQuad(positions, uvs, points) {
  const base = positions.length / 3;
  points.forEach(point => positions.push(point.x, point.y, point.z));
  uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
  const indices = [base, base + 1, base + 2, base, base + 2, base + 3];
  return indices;
}
function hippedRoofGeometry(widthHalf, depthHalf, ridgeWidthHalf, ridgeDepthHalf, eaveY, ridgeY) {
  const positions = [], uvs = [], indices = [];
  const front = [
    new THREE.Vector3(-ridgeWidthHalf, ridgeY, ridgeDepthHalf), new THREE.Vector3(ridgeWidthHalf, ridgeY, ridgeDepthHalf),
    new THREE.Vector3(widthHalf, eaveY, depthHalf), new THREE.Vector3(-widthHalf, eaveY, depthHalf)
  ];
  const back = [
    new THREE.Vector3(ridgeWidthHalf, ridgeY, -ridgeDepthHalf), new THREE.Vector3(-ridgeWidthHalf, ridgeY, -ridgeDepthHalf),
    new THREE.Vector3(-widthHalf, eaveY, -depthHalf), new THREE.Vector3(widthHalf, eaveY, -depthHalf)
  ];
  const left = [
    new THREE.Vector3(-ridgeWidthHalf, ridgeY, -ridgeDepthHalf), new THREE.Vector3(-ridgeWidthHalf, ridgeY, ridgeDepthHalf),
    new THREE.Vector3(-widthHalf, eaveY, depthHalf), new THREE.Vector3(-widthHalf, eaveY, -depthHalf)
  ];
  const right = [
    new THREE.Vector3(ridgeWidthHalf, ridgeY, ridgeDepthHalf), new THREE.Vector3(ridgeWidthHalf, ridgeY, -ridgeDepthHalf),
    new THREE.Vector3(widthHalf, eaveY, -depthHalf), new THREE.Vector3(widthHalf, eaveY, depthHalf)
  ];
  [front, back, left, right].forEach(points => indices.push(...appendRoofQuad(positions, uvs, points)));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
const roofSurface = new THREE.Mesh(hippedRoofGeometry(9.9, 10.0, 2.4, .9, 10.15, 12.15), roofTileMaterial);
const eaveFascia = new THREE.Mesh(new THREE.BoxGeometry(20.2, .34, 20.4), roofFrameMaterial); eaveFascia.position.y = 10.13;
const eaveLining = new THREE.Mesh(new THREE.BoxGeometry(19.5, .14, 19.7), new THREE.MeshStandardMaterial({ color: "#53351f", roughness: .78 })); eaveLining.position.y = 10.40;
const ridgeCap = new THREE.Mesh(new THREE.BoxGeometry(5.5, .38, 2.3), new THREE.MeshPhysicalMaterial({ color: "#252a32", map: roofTile, normalMap: roofTileNormal, roughness: .34, metalness: .05, clearcoat: .14 }));
ridgeCap.position.y = 12.43;
const roofCollar = new THREE.Mesh(new THREE.BoxGeometry(13.3, .36, 10.5), roofFrameMaterial); roofCollar.position.y = 12.01;
[-2.85, 2.85].forEach(positionX => {
  const ridgeEnd = new THREE.Mesh(new THREE.ConeGeometry(.28, .52, 18), new THREE.MeshPhysicalMaterial({ color: "#c99a45", roughness: .18, metalness: .92, envMapIntensity: 1.1 }));
  ridgeEnd.position.set(positionX, 12.85, 0); ridgeEnd.castShadow = true; roof.add(ridgeEnd);
});
roof.add(roofSurface, eaveFascia, eaveLining, ridgeCap, roofCollar);
roof.position.set(0, 0, hallCenterZ);
roof.traverse(item => { if (item.isMesh) { item.castShadow = item.receiveShadow = true; } });
interiorGroup.add(carpet);
shellGroup.add(floor, backWall, leftWall, rightWall, frontWallLeft, frontWallRight, frontWallHeader, roof);

const wallFrameMaterial = new THREE.MeshPhysicalMaterial({ color: "#42291d", map: wood, bumpMap: woodBump, bumpScale: .09, roughness: .44, clearcoat: .16, clearcoatRoughness: .28, envMapIntensity: .65 });
const paperMaterial = new THREE.MeshPhysicalMaterial({ color: "#fff6df", emissive: "#ffd9a2", emissiveIntensity: .12, roughness: .72, transparent: true, opacity: .74, side: THREE.DoubleSide, sheen: .35, sheenColor: new THREE.Color("#ffd9a2") });
const shojiGroup = new THREE.Group();
function shojiWindow(positionX, positionY, positionZ, rotationY, width = 1.68, height = 1.52) {
  const frame = new THREE.Group();
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(width - .10, height - .10), paperMaterial);
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(width + .08, .10, .13), wallFrameMaterial); topBeam.position.y = height * .5;
  const bottomBeam = topBeam.clone(); bottomBeam.position.y = -height * .5;
  const leftBeam = new THREE.Mesh(new THREE.BoxGeometry(.10, height + .08, .13), wallFrameMaterial); leftBeam.position.x = -width * .5;
  const rightBeam = leftBeam.clone(); rightBeam.position.x = width * .5;
  frame.add(paper, topBeam, bottomBeam, leftBeam, rightBeam);
  for (let index = 1; index < 5; index++) {
    const vertical = new THREE.Mesh(new THREE.BoxGeometry(.032, height - .12, .045), wallFrameMaterial);
    vertical.position.x = -width * .5 + width * index / 5; frame.add(vertical);
  }
  for (let index = 1; index < 4; index++) {
    const horizontal = new THREE.Mesh(new THREE.BoxGeometry(width - .12, .032, .045), wallFrameMaterial);
    horizontal.position.y = -height * .5 + height * index / 4; frame.add(horizontal);
  }
  frame.position.set(positionX, positionY, positionZ); frame.rotation.y = rotationY;
  frame.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  shojiGroup.add(frame);
}
[-6.75, -3.35, 3.35, 6.75].forEach(positionX => shojiWindow(positionX, 6.15, hallBackZ + .07, 0));
[-9.55, -6.25, -1.25, 3.75].forEach(positionZ => {
  shojiWindow(-8.44, 6.15, positionZ, Math.PI / 2);
  shojiWindow(8.44, 6.15, positionZ, -Math.PI / 2);
});
const wallBeams = new THREE.Group();
[8.55, 5.20, 1.85].forEach(height => {
  const backBeam = new THREE.Mesh(new THREE.BoxGeometry(18.1, .20, .24), wallFrameMaterial); backBeam.position.set(0, height, hallBackZ + .08);
  wallBeams.add(backBeam);
  [-8.45, 8.45].forEach(positionX => {
    const sideBeam = new THREE.Mesh(new THREE.BoxGeometry(.24, .20, hallDepth + .52), wallFrameMaterial);
    sideBeam.position.set(positionX, height, hallCenterZ); wallBeams.add(sideBeam);
  });
});
for (let positionX = -8.1; positionX <= 8.1; positionX += 1.5) {
  const stud = new THREE.Mesh(new THREE.BoxGeometry(.13, 10.1, .20), wallFrameMaterial); stud.position.set(positionX, 5.05, hallBackZ + .10); wallBeams.add(stud);
}
for (let positionZ = hallBackZ - .15; positionZ <= 6.25; positionZ += 1.5) {
  [-8.38, 8.38].forEach(positionX => {
    const stud = new THREE.Mesh(new THREE.BoxGeometry(.20, 10.1, .13), wallFrameMaterial); stud.position.set(positionX, 5.05, positionZ); wallBeams.add(stud);
  });
}
[9.92, 9.12].forEach(height => {
  for (let index = 0; index < 9; index++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(15.7, .22, .26), wallFrameMaterial);
    beam.position.set(0, height, -9.25 + index * 1.9); wallBeams.add(beam);
  }
});
wallBeams.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
shellGroup.add(shojiGroup, wallBeams);

const hangingDecor = new THREE.Group();
const pendantWoodMaterial = new THREE.MeshPhysicalMaterial({ color: "#44291c", map: wood, bumpMap: woodBump, bumpScale: .08, roughness: .38, clearcoat: .18 });
const pendantBrassMaterial = new THREE.MeshPhysicalMaterial({ color: "#c49447", roughness: .17, metalness: .95, clearcoat: .22, envMapIntensity: 1.1 });
const lanternFabricMaterial = new THREE.MeshPhysicalMaterial({ color: "#b6382c", roughness: .44, sheen: .58, sheenColor: new THREE.Color("#ffb267"), sheenRoughness: .42, transparent: true, opacity: .96, emissive: "#ff8a35", emissiveIntensity: .22 });
function hangingLantern(positionX, positionY, positionZ, scale = 1, withLight = true) {
  const lantern = new THREE.Group();
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .82, 8), pendantBrassMaterial); chain.position.y = .41;
  const hook = new THREE.Mesh(new THREE.TorusGeometry(.045, .012, 8, 24), pendantBrassMaterial); hook.position.y = .86;
  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(.13, .18, .10, 20), pendantWoodMaterial); topCap.position.y = -.04;
  const body = new THREE.Mesh(new THREE.SphereGeometry(.30, 28, 22), lanternFabricMaterial); body.position.y = -.38; body.scale.set(1, 1.08, 1);
  const bottomCap = new THREE.Mesh(new THREE.CylinderGeometry(.17, .11, .09, 20), pendantWoodMaterial); bottomCap.position.y = -.72;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.11, .018, 8, 28), pendantBrassMaterial); ring.rotation.x = Math.PI / 2; ring.position.y = -.79;
  const tassel = new THREE.Mesh(new THREE.CapsuleGeometry(.034, .22, 6, 12), new THREE.MeshStandardMaterial({ color: "#e2bb63", roughness: .60 })); tassel.position.y = -.97;
  lantern.add(chain, hook, topCap, body, bottomCap, ring, tassel);
  if (withLight) {
    const light = new THREE.PointLight("#ffc171", 2.6, 7.5, 2); light.position.y = -.38; lantern.add(light);
  }
  lantern.scale.setScalar(scale); lantern.position.set(positionX, positionY, positionZ);
  lantern.traverse(item => { if (item.isMesh) item.castShadow = true; });
  hangingDecor.add(lantern);
  windGroups.push({ object: lantern, kind: "lantern", seed: Math.abs(positionX * .73 + positionZ * .31), amplitude: .022 });
}
hangingLantern(-4.0, 8.72, -2.2, 1.08, true);
hangingLantern(4.0, 8.72, -2.2, 1.08, true);
hangingLantern(-2.55, 8.80, 3.1, .88, false);
hangingLantern(2.55, 8.80, 3.1, .88, false);

const bannerMaterialCache = {};
function hangingBanner(positionX, positionZ, glyph, rotationY = 0, height = 2.75, width = .78) {
  const canvasElement = document.createElement("canvas"); canvasElement.width = 256; canvasElement.height = 896;
  const context = canvasElement.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 0, 896);
  gradient.addColorStop(0, "#7d211a"); gradient.addColorStop(.65, "#8f261d"); gradient.addColorStop(1, "#551110");
  context.fillStyle = gradient; context.fillRect(0, 0, 256, 896);
  context.strokeStyle = "#e8c375"; context.lineWidth = 16; context.strokeRect(20, 20, 216, 856);
  context.fillStyle = "#ffdca2"; context.font = "bold 210px serif"; context.textAlign = "center"; context.textBaseline = "middle";
  context.fillText(glyph, 128, 330);
  context.font = "bold 100px serif"; context.fillText("雲上禪寺", 128, 650);
  const textureKey = `${glyph}-${height}-${width}`;
  if (!bannerMaterialCache[textureKey]) {
    const bannerTexture = new THREE.CanvasTexture(canvasElement);
    bannerTexture.colorSpace = THREE.SRGBColorSpace; bannerTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    bannerMaterialCache[textureKey] = new THREE.MeshPhysicalMaterial({ map: bannerTexture, roughness: .62, sheen: .48, sheenColor: new THREE.Color("#ffd7a3"), sheenRoughness: .40, side: THREE.DoubleSide, envMapIntensity: .55 });
  }
  const banner = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.024, .024, width + .24, 12), pendantBrassMaterial); rod.rotation.z = Math.PI / 2; rod.position.y = .08;
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(width, height), bannerMaterialCache[textureKey]); cloth.position.y = -height * .5;
  const bottomBar = new THREE.Mesh(new THREE.CylinderGeometry(.020, .020, width + .10, 10), pendantBrassMaterial); bottomBar.rotation.z = Math.PI / 2; bottomBar.position.y = -height - .04;
  for (let index = -1; index <= 1; index++) {
    const tassel = new THREE.Mesh(new THREE.CapsuleGeometry(.024, .14, 6, 10), new THREE.MeshStandardMaterial({ color: "#edc76e", roughness: .62 }));
    tassel.position.set(index * width * .36, -height - .18, 0); banner.add(tassel);
  }
  banner.add(rod, cloth, bottomBar);
  banner.position.set(positionX, 8.18, positionZ); banner.rotation.y = rotationY;
  banner.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  hangingDecor.add(banner);
  windGroups.push({ object: banner, kind: "banner", seed: Math.abs(positionX * .41 + positionZ * .57), amplitude: .038 });
}
hangingBanner(-4.05, -4.70, "禪", Math.PI / 14, 3.0, .82);
hangingBanner(4.05, -4.70, "願", -Math.PI / 14, 3.0, .82);
hangingBanner(-2.05, 5.55, "安", 0, 2.3, .66);
hangingBanner(2.05, 5.55, "靜", 0, 2.3, .66);
hangingDecor.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
interiorGroup.add(hangingDecor);

const gardenMaterial = new THREE.MeshPhysicalMaterial({ color: "#aeb7ac", roughness: .88, sheen: .06, sheenColor: new THREE.Color("#d4ddd2") });
const garden = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), gardenMaterial);
garden.rotation.x = -Math.PI / 2; garden.position.set(0, -.415, 10.2); garden.receiveShadow = true;
const gardenSurface = texture(512, (ctx, size) => {
  ctx.fillStyle = "#b5bdb1"; ctx.fillRect(0, 0, size, size);
  for (let index = 0; index < 150; index++) {
    ctx.fillStyle = index % 3 ? "rgba(84, 98, 80, .07)" : "rgba(218, 224, 212, .06)";
    ctx.beginPath(); ctx.arc(Math.random() * size, Math.random() * size, 3 + Math.random() * 9, 0, Math.PI * 2); ctx.fill();
  }
  for (let line = 0; line <= size; line += 96) {
    ctx.strokeStyle = "rgba(74, 84, 72, .20)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(line, 0); ctx.lineTo(line, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, line); ctx.lineTo(size, line); ctx.stroke();
  }
}, 4, 2);
garden.material.map = gardenSurface; garden.material.sheen = .1;
const mossMaterial = new THREE.MeshPhysicalMaterial({ color: "#5e7a45", roughness: .74, sheen: .42, sheenColor: new THREE.Color("#8cc066"), sheenRoughness: .6 });
[-7.2, -4.7, 5.8, 8.9].forEach((positionX, index) => {
  const patch = new THREE.Mesh(new THREE.CircleGeometry(.75 + index * .12, 22), mossMaterial);
  patch.rotation.x = -Math.PI / 2; patch.position.set(positionX, -.405, 10 + index * 1.3 + (index % 2) * 1.6); patch.receiveShadow = true; vistaGroup.add(patch);
});
[[-3.8, 11.4], [3.9, 11.8], [-7.8, 14.8], [7.1, 15.4]].forEach(([positionX, positionZ]) => {
  const rockMaterial = new THREE.MeshPhysicalMaterial({ color: "#7f7d75", roughness: .58, clearcoat: .08, clearcoatRoughness: .7 });
  stoneMaterials.push(rockMaterial);
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.35 + Math.random() * .28, 1), rockMaterial);
  rock.position.set(positionX, surfaceLevel(positionX, positionZ) + .16, positionZ);
  rock.rotation.set(Math.random() * 2, Math.random() * 6, Math.random() * 2); rock.castShadow = rock.receiveShadow = true; vistaGroup.add(rock);
  addContactShadow(positionX, positionZ, .48);
});
for (let index = 0; index < 5; index++) {
  const step = new THREE.Mesh(new THREE.BoxGeometry(3.6, .13, .58), new THREE.MeshPhysicalMaterial({ map: stone, bumpMap: stoneBump, bumpScale: .1, roughness: .5, clearcoat: .06 }));
  stoneMaterials.push(step.material);
  step.position.set(0, surfaceLevel(0, 7.42 + index * .6) + .065 - index * .004, 7.42 + index * .6);
  step.castShadow = step.receiveShadow = true; vistaGroup.add(step);
}
const stonePath = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 5), new THREE.MeshPhysicalMaterial({ map: stone, bumpMap: stoneBump, bumpScale: .09, roughness: .48, clearcoat: .08 }));
stoneMaterials.push(stonePath.material);
stonePath.rotation.x = -Math.PI / 2; stonePath.position.set(0, -.405, 13.2); stonePath.receiveShadow = true; vistaGroup.add(stonePath, garden);

const colliders = [];
function addCollider(positionX, positionZ, radius) { colliders.push({ x: positionX, z: positionZ, radius }); }
const mapleTrunkGeometry = new THREE.CylinderGeometry(.09, .19, 2.75, 8, 2);
const pineTrunkGeometry = new THREE.CylinderGeometry(.08, .16, 2.05, 7, 2);
const pineConeGeometry = new THREE.ConeGeometry(1, 1, 7, 1);
const pineConeGeometryLow = new THREE.ConeGeometry(1, 1, 5, 1);
const bambooStemGeometry = new THREE.CylinderGeometry(.028, .038, 1, 6);
const bambooLeafGeometry = new THREE.ConeGeometry(.045, .38, 5);
const shrubFlowerGeometry = new THREE.SphereGeometry(.035, 6, 4);
const bambooStemMaterial = new THREE.MeshStandardMaterial({ color: "#5f8a45", roughness: .72, flatShading: true });
const lanternGlowMaterial = new THREE.MeshStandardMaterial({ color: "#ffe2a1", emissive: "#ffaf4f", emissiveIntensity: 1.55, roughness: .48 });
const treeBranchDirection = new THREE.Vector3();
const mapleHighClusters = [
  [-.72, 2.36, .14, .58], [-.32, 2.64, -.32, .55], [.18, 2.80, .04, .62], [.66, 2.42, .22, .55],
  [-.15, 3.04, .14, .58], [.42, 2.14, -.22, .48], [-.44, 2.18, .36, .50], [.04, 2.50, .54, .47],
  [-.88, 2.14, -.18, .42], [.90, 2.10, -.04, .42], [-.14, 1.98, -.54, .40], [.54, 2.68, .46, .46],
  [0, 3.32, 0, .52], [-.58, 3.00, -.12, .45], [.36, 3.02, -.24, .43], [-.24, 2.64, .60, .41]
];
const mapleLowClusters = [
  [-.62, 2.42, .08, .72], [.38, 2.62, .06, .70], [-.10, 2.92, -.16, .61],
  [.08, 3.18, .10, .52], [.72, 2.18, -.12, .52], [-.72, 2.22, .18, .48], [0, 2.40, .46, .48]
];
const mapleBranches = [
  [-.02, 1.18, .02, -.72, 2.36, .14, .078], [0, 1.52, 0, .62, 2.55, .16, .070],
  [.01, 1.78, 0, .10, 3.08, -.04, .058], [0, 1.56, 0, -.42, 2.66, -.36, .054],
  [0, 1.42, 0, .52, 2.16, -.30, .050], [0, 1.90, 0, -.58, 2.88, .18, .046]
];
const pineHighClusters = [
  [0, .82, 0, .82, .54], [.20, 1.02, -.06, .72, .50], [-.16, 1.22, .08, .66, .47],
  [.12, 1.44, .06, .59, .44], [-.12, 1.66, -.08, .52, .40], [.10, 1.88, .05, .45, .37],
  [-.06, 2.08, -.04, .37, .34], [.05, 2.28, .02, .29, .30], [0, 2.47, 0, .20, .26]
];
const pineLowClusters = [
  [0, .90, 0, .82, .56], [.20, 1.25, -.05, .69, .50], [-.13, 1.58, .05, .57, .44],
  [.08, 1.90, .02, .46, .39], [-.04, 2.20, 0, .33, .33], [0, 2.46, 0, .20, .27]
];
const pineBranches = [
  [0, .62, 0, -.28, 1.06, .08, .045], [0, .84, 0, .30, 1.28, -.08, .042],
  [0, 1.10, 0, -.20, 1.58, .04, .036], [0, 1.36, 0, .16, 1.84, -.04, .030]
];

function createBranchMesh(branches) {
  const mesh = new THREE.InstancedMesh(treeBranchGeometry, treeBranchMaterial, branches.length);
  branches.forEach(([startX, startY, startZ, endX, endY, endZ, radius], index) => {
    treeBranchDirection.set(endX - startX, endY - startY, endZ - startZ);
    const length = treeBranchDirection.length();
    treeInstanceDummy.position.set((startX + endX) * .5, (startY + endY) * .5, (startZ + endZ) * .5);
    treeInstanceDummy.quaternion.setFromUnitVectors(treeUpVector, treeBranchDirection.normalize());
    treeInstanceDummy.scale.set(radius, length, radius);
    treeInstanceDummy.updateMatrix();
    mesh.setMatrixAt(index, treeInstanceDummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.castShadow = quality.shadows;
  mesh.receiveShadow = true;
  return mesh;
}

function createFoliageClusterMesh(entries, geometry, palette, random) {
  const mesh = new THREE.InstancedMesh(geometry, foliageClusterMaterial, entries.length);
  entries.forEach(([positionX, positionY, positionZ, size], index) => {
    treeInstanceDummy.position.set(positionX + (random() - .5) * .10, positionY + (random() - .5) * .08, positionZ + (random() - .5) * .10);
    treeInstanceDummy.rotation.set((random() - .5) * .55, random() * Math.PI * 2, (random() - .5) * .40);
    treeInstanceDummy.scale.set(size * (.88 + random() * .24), size * (.76 + random() * .30), size * (.88 + random() * .24));
    treeInstanceDummy.updateMatrix();
    mesh.setMatrixAt(index, treeInstanceDummy.matrix);
    treeColor.set(palette[index % palette.length]).offsetHSL((random() - .5) * .012, (random() - .5) * .08, (random() - .5) * .08);
    mesh.setColorAt(index, treeColor);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.castShadow = quality.shadows;
  mesh.receiveShadow = true;
  return mesh;
}

function createMapleLeafCards(entries, palette, random) {
  const cardCount = quality.leafCardCount;
  const mesh = new THREE.InstancedMesh(leafCardGeometry, leafCardMaterial, cardCount);
  for (let index = 0; index < cardCount; index++) {
    const [positionX, positionY, positionZ, size] = entries[index % entries.length];
    treeInstanceDummy.position.set(
      positionX + (random() - .5) * size * 1.55,
      positionY + (random() - .5) * size * 1.15,
      positionZ + (random() - .5) * size * 1.55
    );
    treeInstanceDummy.rotation.set(random() * Math.PI, random() * Math.PI * 2, random() * Math.PI);
    treeInstanceDummy.scale.setScalar(size * (.36 + random() * .24));
    treeInstanceDummy.updateMatrix();
    mesh.setMatrixAt(index, treeInstanceDummy.matrix);
    treeColor.set(palette[index % palette.length]).offsetHSL((random() - .5) * .015, (random() - .5) * .10, (random() - .5) * .10);
    mesh.setColorAt(index, treeColor);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.receiveShadow = true;
  mesh.userData.noShadow = true;
  return mesh;
}

function createMapleLevel(low, palette, seed) {
  const random = seededTreeRandom(seed);
  const level = new THREE.Group();
  const canopy = new THREE.Group();
  if (!low) level.add(createBranchMesh(mapleBranches));
  canopy.add(createFoliageClusterMesh(low ? mapleLowClusters : mapleHighClusters, low ? treeClusterGeometryLow : treeClusterGeometryHigh, palette, random));
  if (!low && quality.leafCardCount > 0) canopy.add(createMapleLeafCards(mapleHighClusters, palette, random));
  level.add(canopy);
  return { level, canopy };
}

function createPineLevel(low, seed) {
  const random = seededTreeRandom(seed);
  const level = new THREE.Group();
  const canopy = new THREE.Group();
  if (!low) level.add(createBranchMesh(pineBranches));
  const entries = low ? pineLowClusters : pineHighClusters;
  const mesh = new THREE.InstancedMesh(low ? pineConeGeometryLow : pineConeGeometry, foliageClusterMaterial, entries.length);
  const pinePalette = ["#2d4937", "#355940", "#3f6548", "#294233"];
  entries.forEach(([positionX, positionY, positionZ, radius, height], index) => {
    treeInstanceDummy.position.set(positionX + (random() - .5) * .08, positionY, positionZ + (random() - .5) * .08);
    treeInstanceDummy.rotation.set((random() - .5) * .10, random() * Math.PI * 2, (random() - .5) * .10);
    treeInstanceDummy.scale.set(radius, height, radius);
    treeInstanceDummy.updateMatrix();
    mesh.setMatrixAt(index, treeInstanceDummy.matrix);
    treeColor.set(pinePalette[index % pinePalette.length]).offsetHSL((random() - .5) * .015, (random() - .5) * .06, (random() - .5) * .05);
    mesh.setColorAt(index, treeColor);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.castShadow = quality.shadows;
  mesh.receiveShadow = true;
  canopy.add(mesh);
  level.add(canopy);
  return { level, canopy };
}

function setTreeShadows(tree) {
  tree.traverse(item => {
    if (!item.isMesh) return;
    item.castShadow = item.userData.noShadow ? false : quality.shadows;
    item.receiveShadow = true;
  });
}

function mapleTree(positionX, positionZ, scale = 1, palette = ["#b7452c", "#d65f31"]) {
  const tree = new THREE.Group();
  const seed = positionX * 37 + positionZ * 19 + scale * 11;
  const trunk = new THREE.Mesh(mapleTrunkGeometry, treeTrunkMaterial);
  trunk.position.y = 1.37;
  trunk.rotation.z = (Math.sin(seed) * .018);
  const high = quality.mobile ? null : createMapleLevel(false, palette, seed + 1);
  const low = createMapleLevel(true, palette, seed + 1);
  const lod = new THREE.LOD();
  if (high) lod.addLevel(high.level, 0);
  lod.addLevel(low.level, quality.mobile ? 0 : 13 * quality.lodBias);
  tree.add(trunk, lod); tree.scale.setScalar(scale); tree.position.set(positionX, surfaceLevel(positionX, positionZ), positionZ);
  tree.rotation.y = seededTreeRandom(seed + 7)() * Math.PI * 2;
  setTreeShadows(tree); exteriorGroup.add(tree); addCollider(positionX, positionZ, .30 * scale); addContactShadow(positionX, positionZ, .82 * scale);
  const windSeed = positionX * .42 + positionZ * .29;
  if (high) windGroups.push({ object: high.canopy, kind: "tree", seed: windSeed, amplitude: .024 });
  windGroups.push({ object: low.canopy, kind: "tree", seed: windSeed, amplitude: .024 });
}
function pineTree(positionX, positionZ, scale = 1) {
  const tree = new THREE.Group();
  const seed = positionX * 29 + positionZ * 17 + scale * 13;
  const trunk = new THREE.Mesh(pineTrunkGeometry, treeTrunkMaterial);
  trunk.position.y = 1.02;
  trunk.rotation.z = Math.sin(seed) * .016;
  const high = quality.mobile ? null : createPineLevel(false, seed + 1);
  const low = createPineLevel(true, seed + 1);
  const lod = new THREE.LOD();
  if (high) lod.addLevel(high.level, 0);
  lod.addLevel(low.level, quality.mobile ? 0 : 15 * quality.lodBias);
  tree.add(trunk, lod); tree.scale.setScalar(scale); tree.position.set(positionX, surfaceLevel(positionX, positionZ), positionZ);
  tree.rotation.y = seededTreeRandom(seed + 7)() * Math.PI * 2;
  setTreeShadows(tree); exteriorGroup.add(tree); addCollider(positionX, positionZ, .28 * scale); addContactShadow(positionX, positionZ, .76 * scale);
  const windSeed = positionX * .35 + positionZ * .44;
  if (high) windGroups.push({ object: high.canopy, kind: "tree", seed: windSeed, amplitude: .016 });
  windGroups.push({ object: low.canopy, kind: "tree", seed: windSeed, amplitude: .016 });
}
function stoneLantern(positionX, positionZ) {
  const buildLantern = detail => {
    const lantern = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.31, .40, .16, detail), landscapeStoneDarkMaterial); base.position.y = .08;
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(.23, .30, .11, detail), landscapeStoneMaterial); plinth.position.y = .21;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.10, .14, .58, detail), landscapeStoneMaterial); pillar.position.y = .53;
    const collar = new THREE.Mesh(new THREE.BoxGeometry(.38, .08, .38), landscapeStoneDarkMaterial); collar.position.y = .85;
    const lightBox = new THREE.Mesh(new THREE.BoxGeometry(.44, .36, .44), landscapeStoneMaterial); lightBox.position.y = 1.05;
    const glow = new THREE.Mesh(new THREE.BoxGeometry(.22, .20, .22), lanternGlowMaterial); glow.position.y = 1.05;
    const roofBase = new THREE.Mesh(new THREE.BoxGeometry(.62, .06, .62), landscapeStoneDarkMaterial); roofBase.position.y = 1.25;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(.50, .26, 4), landscapeStoneMaterial); cap.position.y = 1.40; cap.rotation.y = Math.PI / 4;
    const finial = new THREE.Mesh(new THREE.SphereGeometry(.065, 8, 6), landscapeStoneDarkMaterial); finial.position.y = 1.57;
    lantern.add(base, plinth, pillar, collar, lightBox, glow, roofBase, cap, finial);
    lantern.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
    return lantern;
  };
  const lod = new THREE.LOD();
  if (!quality.mobile) lod.addLevel(buildLantern(10), 0);
  lod.addLevel(buildLantern(6), quality.mobile ? 0 : 18 * quality.lodBias);
  lod.position.set(positionX, surfaceLevel(positionX, positionZ), positionZ);
  exteriorGroup.add(lod); addCollider(positionX, positionZ, .42); addContactShadow(positionX, positionZ, .48);
}

function bambooClump(positionX, positionZ, scale = 1) {
  const clump = new THREE.Group();
  const random = seededTreeRandom(positionX * 23 + positionZ * 41 + scale * 9);
  const stemCount = 7;
  const leafCount = stemCount * 6;
  const stems = new THREE.InstancedMesh(bambooStemGeometry, bambooStemMaterial, stemCount);
  const leaves = new THREE.InstancedMesh(bambooLeafGeometry, bambooLeafMaterial, leafCount);
  let leafCursor = 0;
  for (let index = 0; index < stemCount; index++) {
    const angle = index / stemCount * Math.PI * 2 + random() * .8;
    const stemHeight = 2.10 + random() * .82;
    treeInstanceDummy.position.set(Math.cos(angle) * (.10 + random() * .06), stemHeight * .5, Math.sin(angle) * (.10 + random() * .06));
    treeInstanceDummy.rotation.set(Math.sin(angle) * .07, angle, Math.cos(angle) * .07);
    treeInstanceDummy.scale.set(1, stemHeight, 1);
    treeInstanceDummy.updateMatrix();
    stems.setMatrixAt(index, treeInstanceDummy.matrix);
    for (let leafIndex = 0; leafIndex < 6; leafIndex++) {
      const leafAngle = angle + leafIndex * 1.2 + Math.random() * .6;
      treeInstanceDummy.position.set(Math.cos(leafAngle) * (.14 + random() * .15), stemHeight * (.38 + leafIndex * .105), Math.sin(leafAngle) * (.14 + random() * .15));
      treeInstanceDummy.rotation.set(Math.PI / 2, leafAngle, .48);
      treeInstanceDummy.scale.set(.92 + random() * .35, .9 + random() * .3, .30);
      treeInstanceDummy.updateMatrix();
      leaves.setMatrixAt(leafCursor++, treeInstanceDummy.matrix);
    }
  }
  stems.instanceMatrix.needsUpdate = true;
  leaves.instanceMatrix.needsUpdate = true;
  stems.computeBoundingSphere();
  leaves.computeBoundingSphere();
  clump.add(stems, leaves);
  clump.scale.setScalar(scale); clump.position.set(positionX, surfaceLevel(positionX, positionZ), positionZ);
  clump.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  exteriorGroup.add(clump); addCollider(positionX, positionZ, .36 * scale); addContactShadow(positionX, positionZ, .50 * scale);
  windGroups.push({ object: clump, kind: "tree", seed: positionX * .51 + positionZ * .23, amplitude: .016 });
}
function shrub(positionX, positionZ, scale = 1, flowering = false) {
  const shrubGroup = new THREE.Group();
  const random = seededTreeRandom(positionX * 31 + positionZ * 13 + scale * 5);
  const leafMaterial = flowering ? shrubLeafMaterials.flowering : shrubLeafMaterials.green;
  const clusters = [[-.22, .21, .05, .27], [.18, .25, -.08, .24], [-.04, .34, .12, .25], [.10, .42, -.05, .22], [-.17, .41, -.07, .20], [.22, .35, .11, .18], [-.02, .51, .01, .17]];
  const leaves = new THREE.InstancedMesh(treeClusterGeometryHigh, leafMaterial, clusters.length);
  clusters.forEach(([x, y, z, size], index) => {
    treeInstanceDummy.position.set(x, y, z);
    treeInstanceDummy.rotation.set(random() * .4, random() * Math.PI * 2, random() * .4);
    treeInstanceDummy.scale.set(size, size * (.78 + random() * .26), size);
    treeInstanceDummy.updateMatrix();
    leaves.setMatrixAt(index, treeInstanceDummy.matrix);
  });
  leaves.instanceMatrix.needsUpdate = true;
  leaves.computeBoundingSphere();
  shrubGroup.add(leaves);
  if (flowering) {
    const flowerCount = 18;
    const flowers = new THREE.InstancedMesh(shrubFlowerGeometry, shrubLeafMaterials.flower, flowerCount);
    for (let index = 0; index < flowerCount; index++) {
      treeInstanceDummy.position.set((random() - .5) * .55, .18 + random() * .38, (random() - .5) * .52);
      treeInstanceDummy.rotation.set(random() * Math.PI, random() * Math.PI * 2, random() * Math.PI);
      treeInstanceDummy.scale.setScalar(.72 + random() * .65);
      treeInstanceDummy.updateMatrix();
      flowers.setMatrixAt(index, treeInstanceDummy.matrix);
    }
    flowers.instanceMatrix.needsUpdate = true;
    flowers.computeBoundingSphere();
    shrubGroup.add(flowers);
  }
  shrubGroup.scale.setScalar(scale); shrubGroup.position.set(positionX, surfaceLevel(positionX, positionZ), positionZ);
  shrubGroup.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  exteriorGroup.add(shrubGroup); addCollider(positionX, positionZ, .38 * scale); addContactShadow(positionX, positionZ, .42 * scale);
}
function stoneBasin(positionX, positionZ) {
  const basin = new THREE.Group(), granite = new THREE.MeshStandardMaterial({ color: "#84847d", roughness: .76 });
  stoneMaterials.push(granite);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(.18, .24, .36, 16), granite); pedestal.position.y = .18;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.35, .28, .20, 24, 1, true), granite); bowl.material.side = THREE.DoubleSide; bowl.position.y = .48;
  const water = new THREE.Mesh(new THREE.CircleGeometry(.31, 24), new THREE.MeshPhysicalMaterial({ color: "#6fbab8", transparent: true, opacity: .76, roughness: .08, metalness: .06 }));
  water.rotation.x = -Math.PI / 2; water.position.y = .56;
  basin.add(pedestal, bowl, water); basin.position.set(positionX, surfaceLevel(positionX, positionZ), positionZ);
  basin.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  exteriorGroup.add(basin); addCollider(positionX, positionZ, .42); addContactShadow(positionX, positionZ, .45);
}
function gardenFence() {
  const fence = new THREE.Group(), woodMaterial = new THREE.MeshStandardMaterial({ color: "#6c4a34", roughness: .78 });
  woodMaterials.push(woodMaterial);
  const halfWidth = 13, frontZ = 6.95, backZ = 17.8, gateHalfWidth = 2.6, postHeight = 1.02;
  const postKeys = new Set();
  const addPost = (x, z) => {
    const key = `${x.toFixed(2)},${z.toFixed(2)}`;
    if (postKeys.has(key)) return;
    postKeys.add(key);
    const post = new THREE.Mesh(new THREE.BoxGeometry(.14, postHeight, .14), woodMaterial);
    post.position.set(x, surfaceLevel(x, z) + postHeight * .5, z); fence.add(post);
  };
  const addRail = (x1, z1, x2, z2, offset) => {
    const dx = x2 - x1, dz = z2 - z1, length = Math.hypot(dx, dz);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(.08, .09, length), woodMaterial);
    rail.position.set((x1 + x2) * .5, (surfaceLevel(x1, z1) + surfaceLevel(x2, z2)) * .5 + offset, (z1 + z2) * .5);
    rail.rotation.y = Math.atan2(dx, dz); fence.add(rail);
  };
  const addRun = (x1, z1, x2, z2) => {
    const dx = x2 - x1, dz = z2 - z1, length = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.round(length / 1.75));
    for (let index = 0; index <= steps; index++) {
      const t = index / steps;
      addPost(x1 + dx * t, z1 + dz * t);
    }
    for (let index = 0; index < steps; index++) {
      const start = index / steps, end = (index + 1) / steps;
      addRail(x1 + dx * start, z1 + dz * start, x1 + dx * end, z1 + dz * end, .34);
      addRail(x1 + dx * start, z1 + dz * start, x1 + dx * end, z1 + dz * end, .78);
    }
  };
  addRun(-halfWidth, frontZ, -halfWidth, backZ);
  addRun(halfWidth, frontZ, halfWidth, backZ);
  addRun(-halfWidth, backZ, -gateHalfWidth, backZ);
  addRun(gateHalfWidth, backZ, halfWidth, backZ);
  addRun(-8.5, frontZ, -halfWidth, frontZ);
  addRun(8.5, frontZ, halfWidth, frontZ);
  for (let x = -halfWidth; x < -gateHalfWidth; x += .85) addCollider(x, backZ, .45);
  for (let x = gateHalfWidth; x < halfWidth; x += .85) addCollider(x, backZ, .45);
  for (let x = 8.5; x < halfWidth; x += .85) {
    addCollider(x, frontZ, .45);
    addCollider(-x, frontZ, .45);
  }
  fence.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  vistaGroup.add(fence);
}
gardenFence();

const mountainGroup = new THREE.Group();
const cloudGroup = new THREE.Group();
const cloudBanks = [];
const cloudMaterials = [];

function createMountainRing({ innerRadius, outerRadius, baseY, height, baseColor, peakColor, seed, segments = 128 }) {
  const random = seededTreeRandom(seed);
  const phaseA = random() * Math.PI * 2, phaseB = random() * Math.PI * 2;
  const phaseC = random() * Math.PI * 2, phaseD = random() * Math.PI * 2;
  const colors = [new THREE.Color(baseColor), new THREE.Color(peakColor), new THREE.Color(peakColor).multiplyScalar(.90)];
  const positions = [], vertexColors = [], indices = [];
  for (let index = 0; index <= segments; index++) {
    const angle = index / segments * Math.PI * 2;
    const wave = Math.sin(angle * 3 + phaseA) * .34 + Math.sin(angle * 7 + phaseB) * .24
      + Math.sin(angle * 13 + phaseC) * .13 + Math.sin(angle * 23 + phaseD) * .07;
    const ridge = THREE.MathUtils.clamp(.58 + wave * .58, .34, 1.08);
    const peakY = baseY + height * ridge;
    const rings = [[innerRadius, baseY], [outerRadius, peakY], [outerRadius + 4, peakY - 1.4]];
    rings.forEach(([radius, y], ringIndex) => {
      positions.push(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      const color = colors[ringIndex];
      vertexColors.push(color.r, color.g, color.b);
    });
  }
  for (let index = 0; index < segments; index++) {
    const a = index * 3, b = a + 1, c = a + 2;
    const d = (index + 1) * 3, e = d + 1, f = d + 2;
    indices.push(a, b, d, b, e, d, b, c, e, c, f, e);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(vertexColors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 1, metalness: 0, flatShading: true, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = quality.shadows;
  return mesh;
}

const mountainSegments = quality.mobile ? 84 : 128;
mountainGroup.add(
  createMountainRing({ innerRadius: 38, outerRadius: 50, baseY: -4.5, height: 12, baseColor: "#2f493f", peakColor: "#667f6d", seed: 17, segments: mountainSegments }),
  createMountainRing({ innerRadius: 55, outerRadius: 69, baseY: -5.5, height: 18, baseColor: "#40595d", peakColor: "#71868a", seed: 31, segments: mountainSegments }),
  createMountainRing({ innerRadius: 76, outerRadius: 93, baseY: -7, height: 25, baseColor: "#5e7480", peakColor: "#9fadb2", seed: 47, segments: mountainSegments })
);

{
  const terrainGeometry = new THREE.PlaneGeometry(54, 28, 30, 56);
  terrainGeometry.rotateX(-Math.PI / 2);
  const terrainPositions = terrainGeometry.attributes.position;
  for (let index = 0; index < terrainPositions.count; index++) {
    const worldX = terrainPositions.getX(index);
    const worldZ = 30 + terrainPositions.getZ(index);
    terrainPositions.setY(index, surfaceLevel(worldX, worldZ));
  }
  terrainGeometry.computeVertexNormals();
  const terrainMaterial = new THREE.MeshStandardMaterial({ color: "#647a70", roughness: .96, side: THREE.DoubleSide });
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.position.set(0, 0, 30);
  terrain.receiveShadow = quality.shadows;
  mountainGroup.add(terrain);
}

const cloudTexture = texture(256, (ctx, size) => {
  ctx.clearRect(0, 0, size, size);
  for (let index = 0; index < 36; index++) {
    const x = size * (.18 + Math.random() * .64), y = size * (.38 + Math.random() * .28);
    const radius = size * (.07 + Math.random() * .12);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255,255,255,${.18 + Math.random() * .18})`);
    gradient.addColorStop(.55, "rgba(255,255,255,.10)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  }
});
const cloudLowMaterial = new THREE.SpriteMaterial({ map: cloudTexture, color: "#edf3f0", transparent: true, opacity: .46, depthWrite: false, alphaTest: .01 });
const cloudHighMaterial = new THREE.SpriteMaterial({ map: cloudTexture, color: "#f7fbf8", transparent: true, opacity: .58, depthWrite: false, alphaTest: .01 });
const mountainRiverMaterial = new THREE.MeshStandardMaterial({ map: cloudTexture, color: "#4a91c8", emissive: "#163d57", emissiveIntensity: .16, transparent: true, opacity: .46, roughness: .24, metalness: .08, depthWrite: false, side: THREE.DoubleSide });
cloudMaterials.push(cloudLowMaterial, cloudHighMaterial);

const cloudRandom = seededTreeRandom(8031);
const cloudCount = quality.mobile ? 12 : 22;
const inSpawnCloudGap = (x, z) => z > 22 && Math.abs(x) < 10;
for (let index = 0; index < cloudCount; index++) {
  const high = index % 3 === 0;
  const angle = cloudRandom() * Math.PI * 2;
  const radius = high ? 46 + cloudRandom() * 20 : 27 + cloudRandom() * 17;
  const y = high ? 8 + cloudRandom() * 10 : 1.5 + cloudRandom() * 5.5;
  const size = high ? 16 + cloudRandom() * 18 : 7 + cloudRandom() * 10;
  const sprite = new THREE.Sprite(high ? cloudHighMaterial : cloudLowMaterial);
  const baseX = Math.cos(angle) * radius, baseZ = Math.sin(angle) * radius;
  if (inSpawnCloudGap(baseX, baseZ)) continue;
  sprite.position.set(baseX, y, baseZ);
  sprite.scale.set(size, size * .52, 1);
  cloudGroup.add(sprite);
  cloudBanks.push({ object: sprite, baseX, baseY: y, baseZ, seed: cloudRandom() * 12, drift: high ? 3.2 : 2.1, speed: .012 + cloudRandom() * .018 });
}

for (let index = 0; index < (quality.mobile ? 4 : 7); index++) {
  const angle = cloudRandom() * Math.PI * 2;
  const radius = 29 + cloudRandom() * 12;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(18 + cloudRandom() * 12, 11 + cloudRandom() * 8), mountainRiverMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.rotation.z = cloudRandom() * Math.PI;
  const baseX = Math.cos(angle) * radius, baseZ = Math.sin(angle) * radius;
  const y = 2.6 + cloudRandom() * 2.4;
  if (inSpawnCloudGap(baseX, baseZ)) continue;
  plane.position.set(baseX, y, baseZ);
  cloudGroup.add(plane);
  cloudBanks.push({ object: plane, baseX, baseY: y, baseZ, seed: cloudRandom() * 12, drift: 1.4, speed: .008 + cloudRandom() * .012 });
}

vistaGroup.add(mountainGroup, cloudGroup);

const trailGroup = new THREE.Group();
{
  const trailStone = new THREE.MeshPhysicalMaterial({ map: stone.clone(), bumpMap: stoneBump.clone(), bumpScale: .08, roughness: .56 });
  stoneMaterials.push(trailStone);
  for (let index = 0; index < 14; index++) {
    const z = 17.4 + index * .72;
    const offset = Math.sin(index * .48) * .68;
    const step = new THREE.Mesh(new THREE.CylinderGeometry(.36 + (index % 2) * .05, .42 + (index % 2) * .05, .12, 14), trailStone);
    step.position.set(offset, surfaceLevel(offset, z) + .06, z);
    step.rotation.y = Math.random() * .3;
    step.castShadow = step.receiveShadow = true;
    trailGroup.add(step);
  }
  [[-3.2, 18.5], [3.4, 19.8], [-2.8, 21.5], [2.6, 23.2]].forEach(([x, z]) => {
    const boulderMaterial = new THREE.MeshPhysicalMaterial({ color: "#6e6e66", roughness: .64 });
    stoneMaterials.push(boulderMaterial);
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(.45 + Math.random() * .3, 1), boulderMaterial);
    boulder.position.set(x, surfaceLevel(x, z) + .3, z);
    boulder.rotation.set(Math.random() * 2, Math.random() * 6, Math.random() * 2);
    boulder.castShadow = boulder.receiveShadow = true;
    trailGroup.add(boulder); addCollider(x, z, .62); addContactShadow(x, z, .70);
  });
  [[-3.8, 18.8], [3.8, 20.5], [-3.6, 22.5], [3.6, 24.5]].forEach(([x, z]) => {
    stoneLantern(x, z);
  });
}
exteriorGroup.add(trailGroup);

[[-5.5, 19.5, .95], [5.2, 20.8, .88], [-4.8, 23.5, 1.02], [4.8, 25.2, .94], [-5.8, 25.8, .90], [5.8, 27.2, .96]].forEach(([x, z, scale]) => pineTree(x, z, scale));
[[-6.2, 21.8, .85], [6.2, 22.8, .92]].forEach(([x, z, scale]) => mapleTree(x, z, scale));
[[-4.2, 20.2], [4.4, 21.5], [-4.5, 24.5], [4.2, 26.5]].forEach(([x, z]) => bambooClump(x, z, .9 + Math.random() * .3));
[[-3.5, 19.5], [3.8, 22.0], [-3.8, 25.0], [3.2, 26.0]].forEach(([x, z]) => shrub(x, z, .9 + Math.random() * .3, Math.random() > .5));

const pondGroup = new THREE.Group();
const pondFish = [];
{
  const pondX = releasePondLayout.x, pondZ = releasePondLayout.z, pondRadius = releasePondLayout.radius;
  const terraceMaterial = new THREE.MeshPhysicalMaterial({ map: stone.clone(), bumpMap: stoneBump.clone(), bumpScale: .08, color: "#778477", roughness: .72, clearcoat: .04, envMapIntensity: .55 });
  stoneMaterials.push(terraceMaterial);
  const terrace = new THREE.Mesh(new THREE.RingGeometry(2.45, releasePondLayout.terraceRadius + .05, 64, 1), terraceMaterial);
  terrace.rotation.x = -Math.PI / 2; terrace.position.set(pondX, releasePondLayout.terraceY + .015, pondZ); terrace.receiveShadow = true;
  const terraceCurb = new THREE.Mesh(new THREE.TorusGeometry(releasePondLayout.terraceRadius, .16, 10, 60), terraceMaterial);
  terraceCurb.rotation.x = Math.PI / 2; terraceCurb.position.set(pondX, releasePondLayout.terraceY + .12, pondZ);
  terraceCurb.castShadow = terraceCurb.receiveShadow = true;
  exteriorGroup.add(terrace, terraceCurb);
  const pondBaseY = groundLevel(pondZ);
  const bedMaterial = new THREE.MeshStandardMaterial({ color: "#5c6444", roughness: .88 });
  const bed = new THREE.Mesh(new THREE.CircleGeometry(pondRadius + .4, 40), bedMaterial);
  bed.rotation.x = -Math.PI / 2; bed.position.set(pondX, pondBaseY - .12, pondZ); bed.receiveShadow = true;
  const waterGeometry = new THREE.CircleGeometry(pondRadius, 40);
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: "#5ab4a8", transparent: true, opacity: .78, roughness: .06, metalness: .12,
    clearcoat: .4, clearcoatRoughness: .1, envMapIntensity: .9, side: THREE.DoubleSide
  });
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI / 2; water.position.set(pondX, pondBaseY + .06, pondZ);
  const rimMaterial = new THREE.MeshPhysicalMaterial({ map: stone.clone(), bumpMap: stoneBump.clone(), bumpScale: .1, roughness: .58 });
  stoneMaterials.push(rimMaterial);
  for (let index = 0; index < 16; index++) {
    const angle = index / 16 * Math.PI * 2 + Math.random() * .2;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.18 + Math.random() * .14, 1), rimMaterial);
    rock.position.set(pondX + Math.cos(angle) * (pondRadius + .18), pondBaseY + .12, pondZ + Math.sin(angle) * (pondRadius + .18));
    rock.rotation.set(Math.random() * 2, Math.random() * 6, Math.random() * 2);
    rock.castShadow = rock.receiveShadow = true; pondGroup.add(rock);
  }
  const lilyMaterial = new THREE.MeshStandardMaterial({ color: "#4a8a4f", roughness: .72, side: THREE.DoubleSide });
  for (let index = 0; index < 5; index++) {
    const angle = index / 5 * Math.PI * 2 + 1.1;
    const lily = new THREE.Mesh(new THREE.CircleGeometry(.14 + Math.random() * .08, 20), lilyMaterial);
    lily.rotation.x = -Math.PI / 2; lily.rotation.z = Math.random() * 6;
    lily.position.set(pondX + Math.cos(angle) * pondRadius * .5, pondBaseY + .08, pondZ + Math.sin(angle) * pondRadius * .5);
    pondGroup.add(lily);
  }
  const fishColors = ["#e86a3a", "#e8b53a", "#d8d8d8", "#e86868"];
  for (let index = 0; index < 6; index++) {
    const fish = new THREE.Group();
    const color = fishColors[index % fishColors.length];
    const body = new THREE.Mesh(new THREE.ConeGeometry(.05, .18, 8), new THREE.MeshStandardMaterial({ color, roughness: .42, metalness: .18 }));
    body.rotation.x = Math.PI / 2;
    const tail = new THREE.Mesh(new THREE.ConeGeometry(.04, .10, 6), new THREE.MeshStandardMaterial({ color, roughness: .48 }));
    tail.rotation.x = -Math.PI / 2; tail.position.y = -.14;
    fish.add(body, tail);
    const orbitRadius = .5 + Math.random() * 1.2;
    const orbitSpeed = .4 + Math.random() * .5;
    const orbitOffset = index / 6 * Math.PI * 2;
    fish.position.set(pondX + Math.cos(orbitOffset) * orbitRadius, pondBaseY + .06, pondZ + Math.sin(orbitOffset) * orbitRadius);
    fish.userData = { orbitRadius, orbitSpeed, orbitOffset, released: false, releaseTimer: 0 };
    pondFish.push(fish); pondGroup.add(fish);
  }
  pondGroup.add(bed, water);
  pondGroup.userData = { centerX: pondX, centerZ: pondZ, radius: pondRadius };
  exteriorGroup.add(pondGroup);
  addCollider(pondX, pondZ, pondRadius + .3);
}

const rippleParticles = [];
const rippleSprite = texture(64, (ctx, size) => {
  const gradient = ctx.createRadialGradient(size * .5, size * .5, 4, size * .5, size * .5, size * .5);
  gradient.addColorStop(0, "rgba(255,255,255,.8)"); gradient.addColorStop(.5, "rgba(200,240,230,.3)"); gradient.addColorStop(1, "rgba(200,240,230,0)");
  ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(size * .5, size * .5, size * .3, 0, 7); ctx.stroke();
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
});
function spawnRipple(x, y, z, count = 14) {
  for (let index = 0; index < count; index++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: rippleSprite, color: "#dffaf2", transparent: true, opacity: .72, depthWrite: false }));
    sprite.position.set(x + (Math.random() - .5) * .4, y, z + (Math.random() - .5) * .4);
    sprite.scale.setScalar(.14);
    rippleParticles.push({ sprite, age: 0, life: 1.2 + Math.random() * .8, drift: { x: (Math.random() - .5) * .3, y: .12 + Math.random() * .1, z: (Math.random() - .5) * .3 } });
    exteriorGroup.add(sprite);
  }
}

function updatePond(delta, elapsed) {
  cloudBanks.forEach(cloud => {
    const phase = elapsed * cloud.speed + cloud.seed;
    cloud.object.position.x = cloud.baseX + Math.sin(phase) * cloud.drift;
    cloud.object.position.z = cloud.baseZ + Math.cos(phase * .73) * cloud.drift * .36;
    cloud.object.position.y = cloud.baseY + Math.sin(phase * .61) * .16;
  });
  if (!exteriorGroup.visible) return;
  const pondX = pondGroup.userData.centerX;
  const pondZ = pondGroup.userData.centerZ;
  pondFish.forEach(fish => {
    const data = fish.userData;
    if (data.released) {
      data.releaseTimer += delta;
      const speed = 1.5 + data.releaseTimer;
      const angle = data.orbitOffset + data.releaseTimer * speed * .8;
      const radius = data.orbitRadius + data.releaseTimer * .8;
      fish.position.set(pondX + Math.cos(angle) * radius, fish.position.y, pondZ + Math.sin(angle) * radius);
      fish.rotation.y = -angle - Math.PI / 2;
      fish.visible = data.releaseTimer < 4;
      return;
    }
    const angle = data.orbitOffset + elapsed * data.orbitSpeed;
    fish.position.x = pondX + Math.cos(angle) * data.orbitRadius;
    fish.position.z = pondZ + Math.sin(angle) * data.orbitRadius;
    fish.rotation.y = -angle - Math.PI / 2;
  });
  for (let index = rippleParticles.length - 1; index >= 0; index--) {
    const particle = rippleParticles[index];
    particle.age += delta;
    if (particle.age >= particle.life) { particle.sprite.parent?.remove(particle.sprite); particle.sprite.material.dispose(); rippleParticles.splice(index, 1); continue; }
    const progress = particle.age / particle.life;
    particle.sprite.scale.setScalar(.14 + progress * .42);
    particle.sprite.material.opacity = .72 * (1 - progress);
    particle.sprite.position.x += particle.drift.x * delta;
    particle.sprite.position.y += particle.drift.y * delta;
    particle.sprite.position.z += particle.drift.z * delta;
  }
}

function releaseFish() {
  const available = pondFish.filter(fish => !fish.userData.released);
  if (!available.length) return notify("池中锦鲤已全部放生。");
  const fish = available[Math.floor(Math.random() * available.length)];
  fish.userData.released = true;
  fish.userData.releaseTimer = 0;
  spawnRipple(fish.position.x, fish.position.y + .04, fish.position.z, 18);
  notify("心生慈悲，放生一尾。功德无量。");
}
[[-7.5, 9.6, 1.05], [7.8, 10.6, .92], [-10.2, 13.8, 1.12], [10.4, 15.3, .95]].forEach(([x, z, scale]) => mapleTree(x, z, scale));
[[-9.1, 10.4, .9], [9.2, 13.6, 1.04], [-6.4, 15.4, .88], [6.8, 16.1, .96]].forEach(([x, z, scale]) => pineTree(x, z, scale));
[[-3.2, 10.8], [3.3, 10.8], [-7.2, 14.5], [7.4, 14.5]].forEach(([x, z]) => stoneLantern(x, z));
[[-6.3, 8.2, .92, ["#f0b6c8", "#ffdce6"]], [6.3, 8.2, .98, ["#f4a9c4", "#ffd9e4"]], [-8.8, 15.8, .88, ["#f6becd", "#ffe4ec"]], [8.6, 15.2, .94, ["#f2aec6", "#ffdce6"]]].forEach(([x, z, scale, palette]) => mapleTree(x, z, scale, palette));
[[-9.8, 5.1, 1.08], [-10.6, 9.6, .95], [9.7, 5.2, 1.02], [10.8, 9.8, .92], [-6.1, 15.9, .88], [6.7, 16.4, .96]].forEach(([x, z, scale]) => bambooClump(x, z, scale));
[[-8.3, 7.2], [-6.8, 9.8], [-4.9, 12.6], [5.4, 8.1], [7.6, 12.4], [9.4, 15.9], [4.6, 14.1]].forEach(([x, z]) => shrub(x, z, .95 + Math.random() * .25, Math.random() > .6));
stoneBasin(-4.8, 14.8); stoneBasin(6.4, 15.2);
[[-5.4, 7.7], [-6.2, 9.3], [-5.7, 11.0], [-4.6, 12.4], [-3.9, 13.8], [5.6, 7.6], [6.4, 9.2], [5.9, 10.9], [4.8, 12.3], [4.1, 13.8]].forEach(([positionX, positionZ], index) => {
  const steppingStone = new THREE.Mesh(new THREE.CylinderGeometry(.38 + (index % 3) * .04, .44 + (index % 3) * .04, .10, 16), new THREE.MeshPhysicalMaterial({ map: stone.clone(), bumpMap: stoneBump.clone(), bumpScale: .07, roughness: .62, clearcoat: .04 }));
  stoneMaterials.push(steppingStone.material);
  steppingStone.position.set(positionX, surfaceLevel(positionX, positionZ) + .05, positionZ);
  steppingStone.rotation.y = index * .7; steppingStone.castShadow = steppingStone.receiveShadow = true; exteriorGroup.add(steppingStone);
});

const pond = new THREE.Mesh(new THREE.CircleGeometry(1.55, 40), new THREE.MeshPhysicalMaterial({ color: "#3a6b6a", roughness: .035, metalness: .1, transmission: .38, thickness: .65, ior: 1.32, transparent: true, opacity: .9, envMapIntensity: 1.6 }));
pond.rotation.x = -Math.PI / 2; pond.position.set(-7.8, -.385, 12.2); pond.receiveShadow = true;
const pondRim = new THREE.Mesh(new THREE.TorusGeometry(1.55, .1, 10, 48), new THREE.MeshPhysicalMaterial({ color: "#767570", roughness: .52, clearcoat: .08, clearcoatRoughness: .6 }));
pondRim.rotation.x = Math.PI / 2; pondRim.position.set(-7.8, -.36, 12.2);
exteriorGroup.add(pond, pondRim);
const pondBed = new THREE.Mesh(new THREE.CircleGeometry(1.48, 36), new THREE.MeshStandardMaterial({ color: "#48565c", roughness: .88 }));
pondBed.rotation.x = -Math.PI / 2; pondBed.position.set(-7.8, -.418, 12.2);
exteriorGroup.add(pondBed);
[[.30, .12], [-.42, .28], [.12, -.35]].forEach(([offsetX, offsetZ]) => {
  const pebble = new THREE.Mesh(new THREE.SphereGeometry(.08 + Math.random() * .04, 10, 8), new THREE.MeshStandardMaterial({ color: "#7c7d77", roughness: .84 }));
  pebble.position.set(-7.8 + offsetX, -.408, 12.2 + offsetZ); pebble.castShadow = pebble.receiveShadow = true; exteriorGroup.add(pebble);
});
const koi = [];
["#e8703c", "#f4d35e", "#eae6df", "#d75a44"].forEach((color, index) => {
  const fish = new THREE.Group(), fishMaterial = new THREE.MeshStandardMaterial({ color, roughness: .42 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(.11, 16, 14), fishMaterial); body.scale.set(2.1, .72, .88);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.055, .16, 10), fishMaterial); tail.position.x = -.24; tail.rotation.z = Math.PI / 2;
  fish.add(body, tail); fish.position.set(-7.8 + Math.cos(index * 1.6) * .85, -.418, 12.2 + Math.sin(index * 1.6) * .78);
  fish.traverse(item => { if (item.isMesh) item.castShadow = false; });
  koi.push({ fish, seed: index * 1.55 }); exteriorGroup.add(fish);
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: "#d8f3f0", transmission: .94, thickness: .28, roughness: .04, ior: 1.42,
  clearcoat: 1, clearcoatRoughness: .04, transparent: true, opacity: .96
});
const glassVessel = new THREE.Mesh(new THREE.CylinderGeometry(.17, .12, .21, 36), glassMaterial);
glassVessel.position.set(2.55, 2.04, -7.05); glassVessel.castShadow = true;
const water = new THREE.Mesh(new THREE.CircleGeometry(.13, 28), new THREE.MeshPhysicalMaterial({ color: "#78c4c0", transparent: true, opacity: .74, roughness: .05, metalness: .08 }));
water.rotation.x = -Math.PI / 2; water.position.set(2.55, 2.135, -7.05);
interiorGroup.add(glassVessel, water);

const columnGeometry = new THREE.CylinderGeometry(.46, .52, 8.8, 22);
const columnMaterial = new THREE.MeshPhysicalMaterial({ color: "#8d2b21", map: wood, bumpMap: woodBump, bumpScale: .12, roughness: .3, metalness: .06, clearcoat: .24, clearcoatRoughness: .3, envMapIntensity: .9 });
woodMaterials.push(columnMaterial);
[-9.7, -6.1, -1.9, 2.3, 5.65].forEach(z => [-7.15, 7.15].forEach(x => {
  const column = new THREE.Mesh(columnGeometry, columnMaterial); column.position.set(x, 4.4, z); column.castShadow = column.receiveShadow = true;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.65, .74, .40, 20), new THREE.MeshPhysicalMaterial({ color: "#4d443c", bumpMap: stoneBump.clone(), bumpScale: .06, roughness: .42, clearcoat: .1, clearcoatRoughness: .55 }));
  base.position.set(x, .20, z); base.receiveShadow = true; shellGroup.add(column, base);
}));

const platform = new THREE.Mesh(new THREE.BoxGeometry(8.4, .8, 3.8), new THREE.MeshPhysicalMaterial({ map: stone.clone(), bumpMap: stoneBump.clone(), bumpScale: .1, roughness: .42, clearcoat: .12, clearcoatRoughness: .45, envMapIntensity: .8 }));
stoneMaterials.push(platform.material);
platform.position.set(0, .4, -6.55); platform.receiveShadow = platform.castShadow = true;
const altarMaterial = new THREE.MeshPhysicalMaterial({ map: wood, bumpMap: woodBump.clone(), bumpScale: .11, roughness: .28, metalness: .08, clearcoat: .28, clearcoatRoughness: .26 });
const altar = new THREE.Mesh(new THREE.BoxGeometry(3.8, .24, .66), altarMaterial);
woodMaterials.push(altar.material);
altar.position.set(0, 1.805, -7.05); altar.castShadow = true;
const altarLegs = new THREE.Group();
[[-1.62, -.20], [1.62, -.20], [-1.62, .20], [1.62, .20]].forEach(([x, z]) => {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(.18, .89, .18), altarMaterial);
  leg.position.set(x, 1.243, -7.05 + z); leg.castShadow = true; altarLegs.add(leg);
});
const altarApron = new THREE.Mesh(new THREE.BoxGeometry(3.20, .20, .42), altarMaterial);
altarApron.position.set(0, 1.585, -7.05); altarApron.castShadow = true; altarLegs.add(altarApron);
const gold = new THREE.MeshPhysicalMaterial({ color: "#d9a34b", roughness: .21, metalness: .96, clearcoat: .34, clearcoatRoughness: .16, envMapIntensity: 1.35, emissive: "#381c00", emissiveIntensity: .1 });
const goldDark = new THREE.MeshPhysicalMaterial({ color: "#a67435", roughness: .3, metalness: .94, clearcoat: .16, envMapIntensity: .85 });
const statue = new THREE.Group();
const seat = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.5, .42, 36), gold); seat.position.y = .21;
const lotus = new THREE.Group();
for (let index = 0; index < 24; index++) {
  const angle = index / 24 * Math.PI * 2;
  const petal = new THREE.Mesh(new THREE.SphereGeometry(.19, 14, 12), index % 2 ? goldDark : gold);
  petal.scale.set(.62, 1.35, .28); petal.position.set(Math.cos(angle) * 1.31, .04, Math.sin(angle) * 1.31);
  petal.rotation.set(.22, -angle + Math.PI / 2, 0); lotus.add(petal);
}
const waist = new THREE.Mesh(new THREE.SphereGeometry(.63, 32, 24), gold); waist.scale.set(1, .8, .92); waist.position.y = .78;
const statueBody = new THREE.Mesh(new THREE.CapsuleGeometry(.58, .52, 18, 36), gold); statueBody.scale.set(1.17, 1, .9); statueBody.position.y = 1.36;
const shoulderDrape = new THREE.Mesh(new THREE.SphereGeometry(.66, 28, 22, 0, Math.PI * 2, 0, Math.PI * .52), gold); shoulderDrape.scale.set(1.24, .9, .95); shoulderDrape.position.y = 1.51;
const statueHead = new THREE.Mesh(new THREE.SphereGeometry(.42, 38, 32), gold); statueHead.scale.set(.94, 1.04, .96); statueHead.position.y = 2.22;
const face = new THREE.Mesh(new THREE.SphereGeometry(.355, 32, 28), gold); face.scale.set(.9, 1, .95); face.position.set(0, -.015, .10);
const hairCap = new THREE.Mesh(new THREE.SphereGeometry(.425, 32, 26, 0, Math.PI * 2, 0, Math.PI * .46), goldDark); hairCap.scale.set(.96, 1, 1); hairCap.position.y = .018;
const usnisa = new THREE.Mesh(new THREE.SphereGeometry(.115, 22, 18), goldDark); usnisa.scale.set(1, .78, 1); usnisa.position.y = .42;
const hairCurlRings = new THREE.Group();
[.16, .26, .35].forEach(height => {
  const curlRing = new THREE.Mesh(new THREE.TorusGeometry(.39 - height * .18, .022, 8, 48), goldDark);
  curlRing.rotation.x = Math.PI / 2; curlRing.position.y = height + .10; hairCurlRings.add(curlRing);
});
const urna = new THREE.Mesh(new THREE.SphereGeometry(.034, 16, 14), new THREE.MeshPhysicalMaterial({ color: "#fff3cf", emissive: "#ffd27a", emissiveIntensity: 1.35, roughness: .1, metalness: .2 }));
urna.position.set(0, .10, .46);
[-.16, .16].forEach(side => {
  const ear = new THREE.Mesh(new THREE.CapsuleGeometry(.052, .15, 8, 14), gold); ear.position.set(side * .40, -.04, .015); ear.rotation.z = side * .07;
  statue.add(ear);
});
[-.11, .11].forEach(side => {
  const eye = new THREE.Mesh(new THREE.CapsuleGeometry(.025, .055, 6, 12), goldDark); eye.rotation.x = Math.PI / 2; eye.rotation.z = side * .1; eye.position.set(side, -.02, .455);
  statue.add(eye);
});
const nose = new THREE.Mesh(new THREE.CapsuleGeometry(.024, .055, 6, 12), gold); nose.position.set(0, -.075, .495); nose.rotation.x = .55;
const statueMouth = new THREE.Mesh(new THREE.TorusGeometry(.052, .008, 8, 24, Math.PI), goldDark); statueMouth.rotation.x = Math.PI / 2; statueMouth.position.set(0, -.155, .465);
const halo = new THREE.Mesh(new THREE.TorusGeometry(.78, .042, 16, 90), new THREE.MeshPhysicalMaterial({ color: "#ffc871", roughness: .14, metalness: 1, clearcoat: .22, emissive: "#8a4b00", emissiveIntensity: .68 }));
halo.position.set(0, 2.34, -.24);
const auraRays = new THREE.Group();
for (let index = 0; index < 18; index++) {
  const angle = index / 18 * Math.PI * 2;
  const ray = new THREE.Mesh(new THREE.BoxGeometry(.022, .16 + (index % 3) * .05, .008), new THREE.MeshStandardMaterial({ color: "#ffd587", emissive: "#ffbe5c", emissiveIntensity: .8, roughness: .3, metalness: .8 }));
  ray.position.set(Math.cos(angle) * .95, 2.34 + Math.sin(angle) * .95, -.23);
  ray.rotation.z = angle - Math.PI / 2; auraRays.add(ray);
}
const robeFront = new THREE.Mesh(new THREE.CylinderGeometry(.50, 1.13, .86, 36, 1, true), gold); robeFront.position.set(0, .80, .12);
const robeBand = new THREE.Mesh(new THREE.TorusGeometry(.58, .038, 12, 48), goldDark); robeBand.rotation.x = Math.PI / 2; robeBand.position.set(0, 1.66, .04);
[-.29, .29].forEach(side => {
  const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(.105, .24, 10, 18), gold); upperArm.position.set(side * .62, 1.28, .04); upperArm.rotation.z = side * .32;
  statue.add(upperArm);
});
const leftForearm = new THREE.Mesh(new THREE.CapsuleGeometry(.092, .26, 12, 22), gold); leftForearm.position.set(-.36, 1.06, .17); leftForearm.rotation.z = .58; leftForearm.rotation.x = .16;
const rightForearm = new THREE.Mesh(new THREE.CapsuleGeometry(.092, .26, 12, 22), gold); rightForearm.position.set(.36, 1.06, .17); rightForearm.rotation.z = -.58; rightForearm.rotation.x = .16;
const leftHand = new THREE.Mesh(new THREE.CapsuleGeometry(.105, .12, 12, 22), gold); leftHand.rotation.x = Math.PI / 2; leftHand.position.set(-.10, .95, .27);
const rightHand = new THREE.Mesh(new THREE.CapsuleGeometry(.105, .12, 12, 22), gold); rightHand.rotation.x = Math.PI / 2; rightHand.position.set(.10, .95, .27);
const mudraBowl = new THREE.Mesh(new THREE.CylinderGeometry(.11, .085, .10, 28, 1, true), goldDark); mudraBowl.material.side = THREE.DoubleSide; mudraBowl.position.set(0, .99, .28);
const bowlWater = new THREE.Mesh(new THREE.CircleGeometry(.10, 28), new THREE.MeshPhysicalMaterial({ color: "#7fd4d8", transparent: true, opacity: .72, roughness: .08, metalness: .05 }));
bowlWater.rotation.x = -Math.PI / 2; bowlWater.position.set(0, 1.035, .28);
const lap = new THREE.Mesh(new THREE.TorusGeometry(.60, .11, 14, 54, Math.PI), gold); lap.rotation.set(Math.PI / 2, 0, 0); lap.position.set(0, .83, .16);
const robeFolds = new THREE.Group();
[-.44, -.25, .25, .44].forEach(foldX => {
  const fold = new THREE.Mesh(new THREE.TorusGeometry(.09, .024, 8, 28, Math.PI), goldDark);
  fold.position.set(foldX, .88, .33); fold.rotation.set(Math.PI / 2, 0, 0); robeFolds.add(fold);
});
statue.add(seat, lotus, waist, statueBody, shoulderDrape, statueHead, face, hairCap, hairCurlRings, usnisa, urna, halo, auraRays, robeFront, robeBand, robeFolds, leftForearm, rightForearm, leftHand, rightHand, mudraBowl, bowlWater, lap, nose, statueMouth);
statue.scale.setScalar(.82);
statue.position.set(0, 2.03, -7.05); statue.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; }); addContactShadow(0, -7.05, 2.0);
const burner = new THREE.Group();
const bronzeMaterial = new THREE.MeshPhysicalMaterial({ color: "#6e5a3e", roughness: .19, metalness: .94, clearcoat: .24, clearcoatRoughness: .18, envMapIntensity: 1.35, emissive: "#201504", emissiveIntensity: .06 });
const bronzeDarkMaterial = new THREE.MeshPhysicalMaterial({ color: "#4d3f2c", roughness: .26, metalness: .90, clearcoat: .16, envMapIntensity: .90 });
const burnerProfile = [
  new THREE.Vector2(.02, 0), new THREE.Vector2(.20, .02), new THREE.Vector2(.38, .08),
  new THREE.Vector2(.45, .21), new THREE.Vector2(.46, .35), new THREE.Vector2(.43, .50),
  new THREE.Vector2(.44, .56), new THREE.Vector2(.46, .58)
].map(point => point.clone());
const burnerBody = new THREE.Mesh(new THREE.LatheGeometry(burnerProfile, 54), bronzeMaterial); burnerBody.material.side = THREE.DoubleSide;
const burnerRim = new THREE.Mesh(new THREE.TorusGeometry(.435, .045, 12, 58), bronzeMaterial); burnerRim.rotation.x = Math.PI / 2; burnerRim.position.y = .575;
const burnerBand = new THREE.Mesh(new THREE.TorusGeometry(.425, .030, 12, 54), bronzeDarkMaterial); burnerBand.rotation.x = Math.PI / 2; burnerBand.position.y = .28;
for (let index = 0; index < 3; index++) {
  const angle = index / 3 * Math.PI * 2 + Math.PI / 6;
  const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .20, 8, 16), bronzeDarkMaterial);
  leg.position.set(Math.cos(angle) * .35, .09, Math.sin(angle) * .35); leg.rotation.set(Math.sin(angle) * .38, 0, -Math.cos(angle) * .38);
  const hoof = new THREE.Mesh(new THREE.SphereGeometry(.072, 16, 14), bronzeDarkMaterial);
  hoof.position.set(Math.cos(angle) * .43, .025, Math.sin(angle) * .43); hoof.scale.y = .78;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.085, .021, 10, 30, Math.PI), bronzeMaterial);
  handle.position.set(Math.cos(angle + Math.PI) * .40, .64, Math.sin(angle + Math.PI) * .40);
  handle.rotation.y = -angle + Math.PI; burner.add(leg, hoof, handle);
}
const burnerBase = new THREE.Mesh(new THREE.CylinderGeometry(.66, .70, .08, 36), new THREE.MeshPhysicalMaterial({ color: "#4b453d", map: stone.clone(), bumpMap: stoneBump.clone(), roughness: .58, clearcoat: .08 }));
burnerBase.position.y = .04; burnerBase.receiveShadow = true;
burner.add(burnerBase, burnerBody, burnerRim, burnerBand);
burner.position.set(0, 0, -2.45); burner.traverse(item => { if (item.isMesh) item.castShadow = true; }); addContactShadow(0, -2.45, .88);
const ash = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .08, 30), new THREE.MeshStandardMaterial({ color: "#c9c2b3", roughness: .95 }));
ash.position.set(0, .525, -2.45);
const altarLight = new THREE.PointLight("#ffc880", 10, 14, 1.9); altarLight.position.set(0, 4.1, -6.8); altarLight.castShadow = true;
interiorGroup.add(platform, altar, altarLegs, statue, burner, ash, altarLight);

const incensePickupPoint = { x: 1.42, z: 6.18 };
const incenseCapacity = 30;
const incenseInsertPositions = Array.from({ length: incenseCapacity }, (_, index) => ({
  x: ((index % 6) - 2.5) * .10,
  z: (Math.floor(index / 6) - 2) * .075
}));
const incenseTraySticks = [];
{
  const incenseStand = new THREE.Group();
  const standWood = new THREE.MeshPhysicalMaterial({ map: wood, bumpMap: woodBump.clone(), bumpScale: .09, roughness: .38, metalness: .04, clearcoat: .18, clearcoatRoughness: .35 });
  const standPost = new THREE.Mesh(new THREE.CylinderGeometry(.055, .065, .72, 18), standWood);
  standPost.position.y = .36;
  const standTop = new THREE.Mesh(new THREE.CylinderGeometry(.27, .29, .085, 28), standWood);
  standTop.position.y = .765; standTop.receiveShadow = true;
  const standTray = new THREE.Mesh(new THREE.CylinderGeometry(.20, .17, .065, 28), bronzeDarkMaterial);
  standTray.position.y = .835; standTray.receiveShadow = true;
  const standLabel = new THREE.Mesh(new THREE.BoxGeometry(.19, .11, .02), new THREE.MeshStandardMaterial({ color: "#fff2cd", roughness: .68 }));
  standLabel.position.set(0, .965, -.20);
  incenseStand.add(standPost, standTop, standTray, standLabel);
  Array.from({ length: incenseCapacity }, (_, index) => {
    const x = ((index % 6) - 2.5) * .048, z = (Math.floor(index / 6) - 2) * .042;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(.007, .007, .36, 8), new THREE.MeshStandardMaterial({ color: "#553522", roughness: .68 }));
    stick.position.set(x, 1.035, z); stick.rotation.z = x * .7;
    incenseStand.add(stick); incenseTraySticks.push(stick);
  });
  incenseStand.position.set(incensePickupPoint.x, surfaceLevel(incensePickupPoint.x, incensePickupPoint.z), incensePickupPoint.z);
  incenseStand.traverse(item => { if (item.isMesh) item.castShadow = true; });
  interiorGroup.add(incenseStand);
  addCollider(incensePickupPoint.x, incensePickupPoint.z, .30);
}
addCollider(0, -6.55, 2.0); addCollider(-2.5, -6.9, 1.05); addCollider(2.5, -6.9, 1.05);

const shrineBackdrop = new THREE.Group();
const carvedWoodMaterial = new THREE.MeshPhysicalMaterial({ color: "#562e18", map: wood, bumpMap: woodBump, bumpScale: .14, roughness: .38, clearcoat: .22, clearcoatRoughness: .24, envMapIntensity: .8 });
const brocadeMaterial = new THREE.MeshPhysicalMaterial({ color: "#772018", roughness: .58, sheen: .68, sheenColor: new THREE.Color("#ffca80"), sheenRoughness: .38, bumpMap: fabricBump, bumpScale: .16, envMapIntensity: .62 });
const goldTrimMaterial = new THREE.MeshPhysicalMaterial({ color: "#c69749", roughness: .16, metalness: .96, clearcoat: .28, envMapIntensity: 1.2 });
const mandorla = new THREE.Mesh(new THREE.TorusGeometry(1.62, .068, 16, 96), goldTrimMaterial); mandorla.position.set(0, 4.30, -8.08);
const mandorlaInner = new THREE.Mesh(new THREE.CircleGeometry(1.36, 64), new THREE.MeshPhysicalMaterial({ color: "#ffd9a0", emissive: "#ffbd67", emissiveIntensity: .48, roughness: .28, metalness: .12, transparent: true, opacity: .25 }));
mandorlaInner.scale.setScalar(1.14); mandorlaInner.position.set(0, 4.30, -8.09);
const mandorlaRays = new THREE.Group();
for (let index = 0; index < 24; index++) {
  const angle = index / 24 * Math.PI * 2;
  const ray = new THREE.Mesh(new THREE.BoxGeometry(.018, .18 + (index % 4) * .055, .006), goldTrimMaterial);
  ray.position.set(Math.cos(angle) * 1.78, 4.30 + Math.sin(angle) * 1.78, -8.08);
  ray.rotation.z = angle - Math.PI / 2; mandorlaRays.add(ray);
}
[-2.95, 2.95].forEach(positionX => {
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.105, .125, 5.55, 18), carvedWoodMaterial); pillar.position.set(positionX, 3.72, -8.16);
  const capital = new THREE.Mesh(new THREE.CylinderGeometry(.21, .15, .19, 18), goldTrimMaterial); capital.position.set(positionX, 6.51, -8.16);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(.17, .23, .20, 18), goldTrimMaterial); plinth.position.set(positionX, .98, -8.16);
  shrineBackdrop.add(pillar, capital, plinth);
  for (let index = 0; index < 5; index++) {
    const curtain = new THREE.Mesh(new THREE.CapsuleGeometry(.08 + Math.random() * .02, .98 + Math.random() * .26, 6, 12), brocadeMaterial);
    curtain.position.set(positionX + (index - 2) * .12, 5.82, -8.07); curtain.rotation.z = (Math.random() - .5) * .08;
    shrineBackdrop.add(curtain);
  }
});
const canopyTop = new THREE.Mesh(new THREE.BoxGeometry(6.8, .24, 1.0), carvedWoodMaterial); canopyTop.position.set(0, 6.72, -8.06);
const canopyValance = new THREE.Mesh(new THREE.BoxGeometry(6.5, .26, .74), brocadeMaterial); canopyValance.position.set(0, 6.50, -8.00);
[[-3.10, -7.68], [0, -7.82], [3.10, -7.68]].forEach(([positionX, positionZ], index) => {
  const canopyFinial = new THREE.Mesh(new THREE.SphereGeometry(.11, 16, 14), goldTrimMaterial); canopyFinial.position.set(positionX, 6.94, positionZ);
  canopyFinial.scale.y = index === 1 ? 1.25 : 1; shrineBackdrop.add(canopyFinial);
});
shrineBackdrop.add(mandorla, mandorlaInner, mandorlaRays, canopyTop, canopyValance);
shrineBackdrop.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
interiorGroup.add(shrineBackdrop);

function offeringTable(positionX) {
  const table = new THREE.Group(), tableWood = new THREE.MeshPhysicalMaterial({ color: "#5c2f1b", map: wood, bumpMap: woodBump, bumpScale: .10, roughness: .32, clearcoat: .24, envMapIntensity: .8 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.18, .10, .64), tableWood); top.position.y = .52;
  const apron = new THREE.Mesh(new THREE.BoxGeometry(1.02, .12, .50), carvedWoodMaterial); apron.position.y = .43;
  [[-.48, -.22], [.48, -.22], [-.48, .22], [.48, .22]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, .48, 12), tableWood); leg.position.set(x, .24, z); table.add(leg);
  });
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(1.10, .035, .56), brocadeMaterial); cloth.position.y = .575;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(.16, .13, .035, 26), goldTrimMaterial); plate.position.y = .615;
  const fruitGroup = new THREE.Group();
  [[-.07, .0, "#e87548"], [.07, .0, "#d9b33f"], [0, .06, "#bd5a2c"]].forEach(([x, z, color]) => {
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(.052, 16, 14), new THREE.MeshStandardMaterial({ color, roughness: .52 }));
    fruit.position.set(x, .02, z); fruitGroup.add(fruit);
  });
  fruitGroup.position.y = .64; table.add(top, apron, cloth, plate, fruitGroup);
  table.position.set(positionX, 0, -4.10); table.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  interiorGroup.add(table); addCollider(positionX, -4.10, .68); addContactShadow(positionX, -4.10, .70, "interior");
}
offeringTable(-3.0);

const woodenFish = { mallet: new THREE.Group(), fish: new THREE.Group() };
{
  const stand = new THREE.Group(), standWood = new THREE.MeshPhysicalMaterial({ color: "#5c2f1b", map: wood, bumpMap: woodBump, bumpScale: .10, roughness: .34, clearcoat: .24, envMapIntensity: .8 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.12, .10, .62), standWood); top.position.y = .52;
  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(.36, .40, .10, 30), new THREE.MeshPhysicalMaterial({ color: "#8a2620", roughness: .70, sheen: .55, sheenColor: new THREE.Color("#ffcb80") }));
  cushion.position.y = .60;
  [[-.44, -.18], [.44, -.18], [-.44, .18], [.44, .18]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, .48, 12), standWood);
    leg.position.set(x, .24, z); stand.add(leg);
  });
  const fishBody = new THREE.Mesh(new THREE.SphereGeometry(.26, 36, 26), new THREE.MeshPhysicalMaterial({ color: "#7d4524", map: wood, bumpMap: woodBump.clone(), bumpScale: .14, roughness: .40, clearcoat: .32, clearcoatRoughness: .26, envMapIntensity: .75 }));
  fishBody.scale.set(1.18, .78, .96);
  const fishSlot = new THREE.Mesh(new THREE.BoxGeometry(.28, .045, .09), new THREE.MeshStandardMaterial({ color: "#2d150a", roughness: .92 }));
  fishSlot.position.set(0, .10, 0); fishSlot.rotation.z = .08;
  const fishEyeMaterial = new THREE.MeshStandardMaterial({ color: "#2b1710", roughness: .34 });
  [-.16, .16].forEach(x => { const eye = new THREE.Mesh(new THREE.SphereGeometry(.028, 14, 12), fishEyeMaterial); eye.position.set(x, .03, .22); woodenFish.fish.add(eye); });
  woodenFish.fish.add(fishBody, fishSlot); woodenFish.fish.position.y = .77;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.022, .026, .42, 12), standWood); handle.position.y = .21;
  const striker = new THREE.Mesh(new THREE.SphereGeometry(.055, 18, 14), new THREE.MeshPhysicalMaterial({ color: "#4d2c17", roughness: .54, clearcoat: .16 }));
  striker.position.y = -.20;
  woodenFish.mallet.add(handle, striker); woodenFish.mallet.position.set(.34, 1.08, .18); woodenFish.mallet.rotation.set(-.4, 0, -.65);
  stand.add(top, cushion, woodenFish.fish, woodenFish.mallet);
  stand.position.set(3, 0, -4.10); stand.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  interiorGroup.add(stand); addCollider(3, -4.10, .68); addContactShadow(3, -4.10, .70);
}

const bell = { body: new THREE.Group(), frame: new THREE.Group() };
{
  const bellWood = new THREE.MeshPhysicalMaterial({ color: "#4e2c18", map: wood, bumpMap: woodBump.clone(), bumpScale: .12, roughness: .40, clearcoat: .20, envMapIntensity: .75 });
  const bronze = new THREE.MeshPhysicalMaterial({ color: "#7d6037", metalness: .90, roughness: .27, clearcoat: .16, clearcoatRoughness: .24, envMapIntensity: 1.15 });
  const stoneBase = new THREE.Mesh(new THREE.BoxGeometry(1.50, .30, 1.50), new THREE.MeshPhysicalMaterial({ map: stone.clone(), bumpMap: stoneBump.clone(), bumpScale: .12, roughness: .58, envMapIntensity: .60 }));
  stoneBase.position.y = .15;
  [[-.55, -.55], [.55, -.55], [-.55, .55], [.55, .55]].forEach(([x, z]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.10, .12, 2.35, 18), bellWood);
    post.position.set(x, 1.48, z); bell.frame.add(post);
  });
  const crossBeam = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, 1.45, 18), bellWood);
  crossBeam.rotation.z = Math.PI / 2; crossBeam.position.y = 2.60; bell.frame.add(crossBeam);
  const bellGeometry = new THREE.LatheGeometry([
    new THREE.Vector2(.005, .80), new THREE.Vector2(.22, .78), new THREE.Vector2(.46, .58),
    new THREE.Vector2(.57, .24), new THREE.Vector2(.59, -.02), new THREE.Vector2(.55, -.05), new THREE.Vector2(.44, -.02)
  ], 58);
  const bellBody = new THREE.Mesh(bellGeometry, bronze);
  const bellRim = new THREE.Mesh(new THREE.TorusGeometry(.56, .042, 14, 58), bronze); bellRim.rotation.x = Math.PI / 2; bellRim.position.y = -.02;
  const bellTop = new THREE.Mesh(new THREE.TorusGeometry(.08, .038, 12, 28), goldTrimMaterial); bellTop.rotation.x = Math.PI / 2; bellTop.position.y = .79;
  bell.body.add(bellBody, bellRim, bellTop); bell.body.position.y = 2.52;
  const strikingLog = new THREE.Mesh(new THREE.CylinderGeometry(.10, .12, .95, 18), bellWood);
  strikingLog.position.set(.16, 1.32, 0); strikingLog.rotation.z = -.12;
  const bellLight = new THREE.PointLight("#ffd286", 2, 5.5, 1.8); bellLight.position.set(0, 1.35, .55);
  bell.frame.add(strikingLog, bellLight); bell.frame.add(stoneBase);
  bell.frame.position.set(-3.45, surfaceLevel(-3.45, 8.05), 8.05);
  bell.frame.traverse(item => { if (item.isMesh) { item.castShadow = true; item.receiveShadow = true; } });
  exteriorGroup.add(bell.frame); addCollider(-3.45, 8.05, .72); addContactShadow(-3.45, 8.05, .92, "exterior");
}

const flames = [];
function candle(x) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.13, .15, .7, 20), new THREE.MeshStandardMaterial({ color: "#e8d2b0", roughness: .55 })); body.position.y = .35;
  const flame = new THREE.Mesh(new THREE.ConeGeometry(.055, .19, 14), new THREE.MeshStandardMaterial({ color: "#ffbf60", emissive: "#ff9d22", emissiveIntensity: 4 })); flame.position.y = .82;
  const light = new THREE.PointLight("#ffa244", 3, 4.5, 2); light.position.y = .84;
  group.add(body, flame, light); group.position.set(x, 2.03, -7.2); group.traverse(item => { if (item.isMesh) item.castShadow = true; });
  flames.push({ flame, light, seed: Math.random() * 10 }); interiorGroup.add(group);
}
candle(-1.7); candle(1.7);

const fortuneMap = texture(256, (ctx, size) => {
  const center = size / 2, gradient = ctx.createRadialGradient(center, center, 12, center, center, center);
  gradient.addColorStop(0, "#ffb44e"); gradient.addColorStop(.72, "#f39231"); gradient.addColorStop(1, "#c96318");
  ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(center, center, center - 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#ffe6a6"; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(center, center, center - 18, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(center, center, center - 36, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#7a2c05"; ctx.font = "bold 76px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("運", center, center + 4);
});
const fortuneMaterial = new THREE.MeshPhysicalMaterial({
  map: fortuneMap, bumpMap: fabricBump.clone(), bumpScale: .14, roughness: .58, metalness: .02,
  sheen: .82, sheenColor: new THREE.Color("#ffd592"), sheenRoughness: .38, envMapIntensity: .68
});
const weatherMap = texture(256, (ctx, size) => {
  const center = size / 2, gradient = ctx.createRadialGradient(center, center, 12, center, center, center);
  gradient.addColorStop(0, "#9fe08a"); gradient.addColorStop(.70, "#4e9a68"); gradient.addColorStop(1, "#26644a");
  ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(center, center, center - 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#dfffc9"; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(center, center, center - 18, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(center, center, center - 36, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#123a27"; ctx.font = "bold 76px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("氣", center, center + 4);
});
const weatherMaterial = new THREE.MeshPhysicalMaterial({
  map: weatherMap, bumpMap: fabricBump.clone(), bumpScale: .14, roughness: .58, metalness: .02,
  sheen: .78, sheenColor: new THREE.Color("#dcffc8"), sheenRoughness: .40, envMapIntensity: .68
});
const ritualMats = [];
[
  { x: -3.35, kind: "fortune", material: fortuneMaterial, rimColor: "#ffd383" },
  { x: 3.35, kind: "weather", material: weatherMaterial, rimColor: "#a6eb90" }
].forEach(({ x, kind, material, rimColor }) => {
  const mat = new THREE.Mesh(new THREE.CircleGeometry(.78, 54), material);
  mat.rotation.x = -Math.PI / 2; mat.position.set(x, .022, .35); mat.receiveShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.78, .042, 10, 60), new THREE.MeshPhysicalMaterial({ color: rimColor, roughness: .36, sheen: .65, sheenColor: new THREE.Color("#fff1cd") }));
  rim.rotation.x = Math.PI / 2; rim.position.set(x, .028, .35); rim.castShadow = rim.receiveShadow = true;
  ritualMats.push({ mesh: mat, kind, position: mat.position });
  interiorGroup.add(mat, rim);
});

const oracleStand = new THREE.Group();
{
  const standWood = new THREE.MeshPhysicalMaterial({ color: "#4a2818", map: wood, bumpMap: woodBump.clone(), bumpScale: .10, roughness: .36, clearcoat: .22, envMapIntensity: .78 });
  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(.28, .30, .07, 28), standWood); tableTop.position.y = .72;
  const tablePost = new THREE.Mesh(new THREE.CylinderGeometry(.06, .075, .72, 16), standWood); tablePost.position.y = .36;
  const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(.20, .24, .07, 24), standWood); tableBase.position.y = .035;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.095, .105, .30, 22, 1, true), new THREE.MeshPhysicalMaterial({ color: "#8a6a3c", map: wood, bumpMap: woodBump.clone(), bumpScale: .12, roughness: .42, clearcoat: .18, side: THREE.DoubleSide }));
  tube.position.y = .90;
  const tubeRim = new THREE.Mesh(new THREE.TorusGeometry(.10, .014, 8, 30), new THREE.MeshPhysicalMaterial({ color: "#b89050", roughness: .28, metalness: .55 }));
  tubeRim.rotation.x = Math.PI / 2; tubeRim.position.y = 1.05;
  for (let index = 0; index < 8; index++) {
    const angle = index / 8 * Math.PI * 2 + Math.random() * .3;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(.007, .008, .34, 6), new THREE.MeshStandardMaterial({ color: "#d9c49a", roughness: .62 }));
    stick.position.set(Math.cos(angle) * .04, 1.06, Math.sin(angle) * .04);
    stick.rotation.z = (Math.random() - .5) * .12; stick.rotation.x = (Math.random() - .5) * .1;
    oracleStand.add(stick);
  }
  oracleStand.add(tableTop, tablePost, tableBase, tube, tubeRim);
  oracleStand.position.set(1.45, surfaceLevel(1.45, .35), .35);
  oracleStand.traverse(item => { if (item.isMesh) item.castShadow = true; });
  interiorGroup.add(oracleStand); addCollider(1.45, .35, .38); addContactShadow(1.45, .35, .38);
}

const entranceGroup = new THREE.Group(), floorTrimGroup = new THREE.Group();
const entranceWoodMaterial = new THREE.MeshPhysicalMaterial({ color: "#5e321c", map: wood, bumpMap: woodBump, bumpScale: .11, roughness: .35, clearcoat: .2, clearcoatRoughness: .22, envMapIntensity: .78 });
const entranceStoneMaterial = new THREE.MeshPhysicalMaterial({ color: "#7b7468", map: stone.clone(), bumpMap: stoneBump.clone(), bumpScale: .10, roughness: .52, clearcoat: .10, envMapIntensity: .72 });
stoneMaterials.push(entranceStoneMaterial);
const threshold = new THREE.Mesh(new THREE.BoxGeometry(5.8, .14, .72), entranceStoneMaterial);
threshold.position.set(0, .07, 6.78); threshold.receiveShadow = true; entranceGroup.add(threshold);
[-2.75, 2.75].forEach(positionX => {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.19, .22, 5.4, 20), entranceWoodMaterial);
  post.position.set(positionX, 2.70, 6.70); entranceGroup.add(post);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.31, .37, .28, 20), entranceStoneMaterial);
  base.position.set(positionX, .14, 6.70); entranceGroup.add(base);
  const capital = new THREE.Mesh(new THREE.CylinderGeometry(.27, .21, .22, 20), entranceWoodMaterial);
  capital.position.set(positionX, 5.45, 6.70); entranceGroup.add(capital);
  const lanternBody = new THREE.Mesh(new THREE.SphereGeometry(.21, 22, 18), new THREE.MeshStandardMaterial({ color: "#c23b2d", roughness: .44, emissive: "#ff9245", emissiveIntensity: .54 }));
  lanternBody.position.set(positionX, 4.65, 6.70); lanternBody.scale.y = 1.18;
  const lanternCap = new THREE.Mesh(new THREE.CylinderGeometry(.11, .15, .08, 18), goldTrimMaterial); lanternCap.position.set(positionX, 4.90, 6.70);
  const lanternLight = new THREE.PointLight("#ffb46a", 2.2, 4.2, 2); lanternLight.position.set(positionX, 4.65, 6.85);
  entranceGroup.add(lanternBody, lanternCap, lanternLight);
  addCollider(positionX, 6.70, .38);
  addContactShadow(positionX, 6.70, .46, "exterior");
});
const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(6.3, .44, .42), entranceWoodMaterial);
doorLintel.position.set(0, 5.56, 6.70); entranceGroup.add(doorLintel);
const plaqueCanvas = document.createElement("canvas"); plaqueCanvas.width = 512; plaqueCanvas.height = 128;
const plaqueContext = plaqueCanvas.getContext("2d");
plaqueContext.fillStyle = "#1c120c"; plaqueContext.fillRect(0, 0, 512, 128);
plaqueContext.strokeStyle = "#d6ab58"; plaqueContext.lineWidth = 8; plaqueContext.strokeRect(12, 12, 488, 104);
plaqueContext.fillStyle = "#ffd98d"; plaqueContext.font = "bold 74px serif"; plaqueContext.textAlign = "center"; plaqueContext.textBaseline = "middle";
plaqueContext.fillText("云上禅寺", 256, 68);
const plaqueTexture = new THREE.CanvasTexture(plaqueCanvas); plaqueTexture.colorSpace = THREE.SRGBColorSpace; plaqueTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
const plaque = new THREE.Mesh(new THREE.PlaneGeometry(3.8, .92), new THREE.MeshStandardMaterial({ map: plaqueTexture, roughness: .48 }));
plaque.position.set(0, 5.56, 6.94); entranceGroup.add(plaque);
const doorwayTexture = texture(512, (ctx, size) => {
  const backdrop = ctx.createLinearGradient(0, 0, 0, size);
  backdrop.addColorStop(0, "#1c0e09");
  backdrop.addColorStop(.5, "#120906");
  backdrop.addColorStop(1, "#070403");
  ctx.fillStyle = backdrop; ctx.fillRect(0, 0, size, size);

  const innerGlow = ctx.createRadialGradient(size * .5, size * .56, size * .02, size * .5, size * .56, size * .5);
  innerGlow.addColorStop(0, "rgba(255,178,96,.34)");
  innerGlow.addColorStop(.45, "rgba(198,104,48,.14)");
  innerGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = innerGlow; ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(size * .5, size * .92);
  ctx.scale(1, .32);
  const floorGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, size * .34);
  floorGlow.addColorStop(0, "rgba(255,162,80,.30)");
  floorGlow.addColorStop(1, "rgba(255,120,50,0)");
  ctx.fillStyle = floorGlow;
  ctx.beginPath(); ctx.arc(0, 0, size * .34, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  const recess = ctx.createLinearGradient(0, size * .16, 0, size * .82);
  recess.addColorStop(0, "rgba(255,196,120,.02)");
  recess.addColorStop(.55, "rgba(255,176,94,.10)");
  recess.addColorStop(1, "rgba(255,140,64,.02)");
  ctx.fillStyle = recess; ctx.fillRect(size * .30, size * .14, size * .40, size * .68);

  function doorLeaf(side) {
    const inner = side < 0 ? size * .30 : size * .70;
    const outer = side < 0 ? 0 : size;
    const leafGradient = ctx.createLinearGradient(outer, 0, inner, 0);
    leafGradient.addColorStop(0, "#160806");
    leafGradient.addColorStop(.55, "#2a1009");
    leafGradient.addColorStop(1, "#4d1c10");
    ctx.save();
    ctx.fillStyle = leafGradient;
    ctx.beginPath();
    ctx.moveTo(outer, 0);
    ctx.lineTo(inner, size * .035);
    ctx.lineTo(inner, size * .965);
    ctx.lineTo(outer, size);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = .18;
    ctx.strokeStyle = "#c7814d";
    ctx.lineWidth = 1.2;
    for (let index = 1; index <= 3; index++) {
      const x = outer + (inner - outer) * index / 4;
      ctx.beginPath(); ctx.moveTo(x, size * .03); ctx.lineTo(x, size * .97); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(235,178,102,.30)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(inner, size * .035); ctx.lineTo(inner, size * .965); ctx.stroke();

    const columns = side < 0 ? [.06, .14, .22] : [.78, .86, .94];
    [.14, .30, .46, .62, .78].forEach(row => {
      columns.forEach(column => {
        ctx.fillStyle = "rgba(214,154,72,.44)";
        ctx.beginPath(); ctx.arc(size * column, size * row, size * .012, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,226,170,.18)";
        ctx.beginPath(); ctx.arc(size * column - size * .004, size * row - size * .004, size * .005, 0, Math.PI * 2); ctx.fill();
      });
    });

    ctx.strokeStyle = "rgba(238,188,104,.42)";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(inner + side * size * .035, size * .52, size * .028, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  doorLeaf(-1);
  doorLeaf(1);

  ctx.globalAlpha = .08;
  ctx.strokeStyle = "#ffd7a0";
  ctx.lineWidth = 2;
  for (let index = 1; index <= 4; index++) {
    const x = size * .30 + size * .40 * index / 5;
    ctx.beginPath(); ctx.moveTo(x, size * .12); ctx.lineTo(x, size * .84); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const vignette = ctx.createRadialGradient(size * .5, size * .48, size * .18, size * .5, size * .48, size * .72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.54)");
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, size, size);
});
const doorwayInterior = new THREE.Mesh(
  new THREE.PlaneGeometry(6.6, 6.4),
  new THREE.MeshBasicMaterial({ map: doorwayTexture, side: THREE.DoubleSide, fog: false, toneMapped: false })
);
doorwayInterior.position.set(0, 2.9, 6.47);
exteriorGroup.add(doorwayInterior);
[[-3.48, 1], [3.48, -1]].forEach(([positionX, side]) => {
  const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(.96, 4.8, .14), entranceWoodMaterial);
  sidePanel.position.set(positionX, 2.40, 6.76); entranceGroup.add(sidePanel);
  addCollider(positionX, 6.76, .42);
  addContactShadow(positionX, 6.76, .50, "exterior");
  for (let index = 1; index < 5; index++) {
    const lattice = new THREE.Mesh(new THREE.BoxGeometry(.07, 4.4, .05), goldTrimMaterial);
    lattice.position.set(positionX + side * .07, 2.40, 6.84 - index * .012); lattice.rotation.z = index % 2 ? .18 : -.18;
    entranceGroup.add(lattice);
  }
});
[hallBackZ + .55, 6.10].forEach(positionZ => {
  const roomEdge = new THREE.Mesh(new THREE.BoxGeometry(16.9, .10, .28), entranceWoodMaterial);
  roomEdge.position.set(0, .045, positionZ); floorTrimGroup.add(roomEdge);
});
[-7.55, 7.55].forEach(positionX => {
  const roomEdge = new THREE.Mesh(new THREE.BoxGeometry(.28, .10, hallDepth + .1), entranceWoodMaterial);
  roomEdge.position.set(positionX, .045, hallCenterZ); floorTrimGroup.add(roomEdge);
});
[[-2.75, -.1], [2.75, -.1]].forEach(([positionX, positionZ]) => {
  const brassLine = new THREE.Mesh(new THREE.BoxGeometry(.05, .015, 14.4), goldTrimMaterial);
  brassLine.position.set(positionX, .022, positionZ); floorTrimGroup.add(brassLine);
});
[[-3.0, 5.75], [3.0, 5.75]].forEach(([positionX, positionZ]) => {
  const brassCrossLine = new THREE.Mesh(new THREE.BoxGeometry(6.0, .015, .05), goldTrimMaterial);
  brassCrossLine.position.set(positionX, .022, positionZ); floorTrimGroup.add(brassCrossLine);
});
entranceGroup.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
floorTrimGroup.traverse(item => { if (item.isMesh) item.receiveShadow = true; });
shellGroup.add(entranceGroup, floorTrimGroup);
[-7.9, -7.1, -6.3, -5.5, -4.7, -3.95, 3.95, 4.7, 5.5, 6.3, 7.1, 7.9].forEach(positionX => addCollider(positionX, 6.68, .54));

const entranceCanopy = new THREE.Group();
const canopyFrame = new THREE.Mesh(new THREE.BoxGeometry(7.5, .24, 2.15), entranceWoodMaterial);
canopyFrame.position.set(0, 6.12, 7.55); canopyFrame.rotation.x = -.12;
const canopyDeck = new THREE.Mesh(new THREE.BoxGeometry(7.15, .12, 1.85), new THREE.MeshPhysicalMaterial({ map: roofTile, normalMap: roofTileNormal, normalScale: new THREE.Vector2(.55, .55), roughness: .37, metalness: .04, clearcoat: .12, side: THREE.DoubleSide }));
canopyDeck.position.set(0, 6.28, 7.55); canopyDeck.rotation.x = -.12;
const entranceCanopyValance = new THREE.Mesh(new THREE.BoxGeometry(7.1, .24, .30), brocadeMaterial);
entranceCanopyValance.position.set(0, 5.99, 8.46); entranceCanopyValance.rotation.x = -.12;
[-3.25, 3.25].forEach(positionX => {
  const brace = new THREE.Mesh(new THREE.BoxGeometry(.15, .88, .15), entranceWoodMaterial);
  brace.position.set(positionX, 6.38, 7.08); brace.rotation.x = .42; entranceCanopy.add(brace);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(.08, 16, 14), goldTrimMaterial);
  finial.position.set(positionX, 6.55, 8.32); entranceCanopy.add(finial);
});
entranceCanopy.add(canopyFrame, canopyDeck, entranceCanopyValance);
entranceCanopy.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
shellGroup.add(entranceCanopy);
[7.10, 10.30].forEach((positionZ, index) => {
  const landing = new THREE.Mesh(new THREE.BoxGeometry(5.5 + index * .4, .13, .86), entranceStoneMaterial);
  landing.position.set(0, surfaceLevel(0, positionZ) + .065, positionZ);
  landing.castShadow = landing.receiveShadow = true; vistaGroup.add(landing);
});

let templeArea = "outside";
function setTempleArea(area) {
  templeArea = area === "inside" ? "inside" : "outside";
  interiorGroup.visible = templeArea === "inside";
  exteriorGroup.visible = templeArea === "outside";
  return templeArea;
}
setTempleArea("outside");
buildContactShadows();
const lanternLights = [];
scene.traverse(item => { if (item.isPointLight && item.parent?.parent === hangingDecor) lanternLights.push(item); });
return {
  renderer, scene, camera, sun, fillLight, hemisphereLight, groundLevel, surfaceLevel, colliders, windGroups,
  interiorGroup, exteriorGroup, shellGroup, vistaGroup, setTempleArea, getTempleArea: () => templeArea, areaConfig,
  stoneMaterials, woodMaterials, floorMaterial, carpetMaterial, wallMaterial,
  skyUniforms, cloudMaterials,
  statue, burner, altar, altarLight, bell, woodenFish, flames, koi, ritualMats,
  hangingDecor, lanternLights, incensePickupPoint, incenseCapacity, incenseInsertPositions,
  incenseTraySticks, pondFish, pondGroup, releaseFish, updatePond,
  glbFallbacks: { glassVessel: [glassVessel, water] },
  hydratePbrTextures, schedulePbrWarmup
};
}
