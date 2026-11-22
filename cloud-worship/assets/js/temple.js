import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { TextureLoader } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSRPass } from "three/addons/postprocessing/SSRPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { createTempleNetwork } from "./net.js";

const canvas = document.getElementById("temple-canvas");
const overlay = document.getElementById("loading-overlay");
const toast = document.getElementById("toast");
const prayButton = document.getElementById("pray-button");
const bellButton = document.getElementById("bell-button");
const woodfishButton = document.getElementById("woodfish-button");
const pickupButton = document.getElementById("pickup-button");
const incenseButton = document.getElementById("incense-button");
const danceButton = document.getElementById("dance-button");
const musicButton = document.getElementById("music-button");
const fortunePanel = document.getElementById("fortune-panel");
const zodiacPanel = document.getElementById("zodiac-panel");
const weatherPanel = document.getElementById("weather-panel");
const fortuneClose = document.getElementById("fortune-close");
const nicknameInput = document.getElementById("nickname-input");
const roomInput = document.getElementById("room-input");
const joinRoomButton = document.getElementById("join-room-button");
const networkStatus = document.getElementById("network-status");
const onlineCount = document.getElementById("online-count");
const windGroups = [];
let network = null;
const actionAudio = {
  trick: new Audio("assets/jitaimei.m4a"),
  pray: new Audio("assets/niganma.mp3")
};
Object.values(actionAudio).forEach(audio => {
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = .42;
});

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .88;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));

const scene = new THREE.Scene();
scene.background = new THREE.Color("#a9c5cf");
scene.fog = new THREE.Fog("#adc3c8", 18, 50);
const camera = new THREE.PerspectiveCamera(54, 1, .1, 80);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .05).texture;
scene.environmentIntensity = .24;
scene.add(new THREE.HemisphereLight("#ffd9ae", "#241110", .32));

new RGBELoader().load("https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/textures/equirectangular/royal_esplanade_1k.hdr", texture => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  scene.environmentIntensity = .38;
}, undefined, () => showToast("在线 HDRI 暂时不可用，已使用基础环境光。"));

const sun = new THREE.DirectionalLight("#fff0cf", 1.18);
sun.position.set(7, 14, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -18; sun.shadow.camera.right = 18;
sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -18;
sun.shadow.bias = -.0005;
sun.shadow.radius = 5;
scene.add(sun);

function texture(size, painter, repeatX = 1, repeatY = 1) {
  const element = document.createElement("canvas");
  element.width = element.height = size;
  painter(element.getContext("2d"), size);
  const map = new THREE.CanvasTexture(element);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
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

const skyCanvas = document.createElement("canvas");
skyCanvas.width = 128; skyCanvas.height = 256;
const skyContext = skyCanvas.getContext("2d");
const skyGradient = skyContext.createLinearGradient(0, 0, 0, 256);
skyGradient.addColorStop(0, "#5d89a7"); skyGradient.addColorStop(.5, "#b3ccd2"); skyGradient.addColorStop(1, "#e8dbc2");
skyContext.fillStyle = skyGradient; skyContext.fillRect(0, 0, 128, 256);
skyContext.globalAlpha = .16; skyContext.fillStyle = "#fff";
for (let index = 0; index < 26; index++) { skyContext.beginPath(); skyContext.ellipse(Math.random() * 128, 40 + Math.random() * 90, 18 + Math.random() * 30, 7 + Math.random() * 10, 0, 0, 7); skyContext.fill(); }
const skyTexture = new THREE.CanvasTexture(skyCanvas); skyTexture.colorSpace = THREE.SRGBColorSpace;
const sky = new THREE.Mesh(new THREE.SphereGeometry(68, 36, 24), new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide, fog: false }));
scene.add(sky);

const textureLoader = new TextureLoader();
const stoneMaterials = [];
const woodMaterials = [];
function loadPbrTexture(path, repeatX, repeatY, colorTexture = false) {
  return new Promise((resolve, reject) => {
    textureLoader.load(path, texture => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.colorSpace = colorTexture ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
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

Promise.all([
  loadPbrTexture("https://threejs.org/examples/textures/brick_diffuse.jpg", 8, 6, true),
  loadPbrTexture("https://threejs.org/examples/textures/brick_bump.jpg", 8, 6),
  loadPbrTexture("https://threejs.org/examples/textures/brick_roughness.jpg", 8, 6)
]).then(async ([diffuse, bump, roughness]) => {
  const normal = await bumpTextureToNormal(bump, 3.2);
  floorMaterial.map = diffuse; floorMaterial.normalMap = normal; floorMaterial.roughnessMap = roughness;
  floorMaterial.bumpMap = null; floorMaterial.normalScale.set(1.05, 1.05);
  floorMaterial.roughness = 1; floorMaterial.clearcoat = .08; floorMaterial.needsUpdate = true;
  stoneMaterials.forEach(material => {
    material.map = diffuse.clone(); material.normalMap = normal.clone(); material.roughnessMap = roughness.clone();
    material.bumpMap = null; material.normalScale.set(.75, .75); material.needsUpdate = true;
  });
}).catch(() => showToast("照片级石材质加载失败，已使用内置纹理。"));
Promise.all([
  loadPbrTexture("https://threejs.org/examples/textures/hardwood2_diffuse.jpg", 3, 1, true),
  loadPbrTexture("https://threejs.org/examples/textures/hardwood2_bump.jpg", 3, 1),
  loadPbrTexture("https://threejs.org/examples/textures/hardwood2_roughness.jpg", 3, 1)
]).then(async ([diffuse, bump, roughness]) => {
  const normal = await bumpTextureToNormal(bump, 2.2);
  woodMaterials.forEach(material => {
    material.map = diffuse; material.normalMap = normal; material.roughnessMap = roughness;
    material.bumpMap = null; material.normalScale.set(.68, .68);
    material.roughness = 1; material.clearcoat = .18; material.needsUpdate = true;
  });
}).catch(() => showToast("照片级木材质加载失败，已使用内置纹理。"));

function groundLevel(positionZ) {
  return positionZ <= 6.9 ? 0 : positionZ <= 10.2 ? THREE.MathUtils.lerp(0, -.42, THREE.MathUtils.smoothstep(positionZ, 6.9, 10.2)) : -.42;
}

const carpetMaterial = new THREE.MeshPhysicalMaterial({ map: carpetMap, bumpMap: fabricBump, bumpScale: .18, roughness: .66, metalness: .02, sheen: .68, sheenColor: new THREE.Color("#ffbb74"), sheenRoughness: .48 });
const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 11), carpetMaterial);
const floorMaterial = new THREE.MeshPhysicalMaterial({ map: stone, bumpMap: stoneBump, bumpScale: .16, roughness: .3, metalness: .04, clearcoat: .16, clearcoatRoughness: .34, envMapIntensity: .8 });
stoneMaterials.push(floorMaterial);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(15, 14), floorMaterial);
floor.rotation.x = -Math.PI / 2; floor.position.z = -.5; floor.receiveShadow = true;
carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, .012, .4); carpet.receiveShadow = true;
const wallMaterial = new THREE.MeshPhysicalMaterial({ map: wallMap, bumpMap: fabricBump.clone(), bumpScale: .08, roughness: .72, sheen: .18, sheenColor: new THREE.Color("#c78955"), envMapIntensity: .55 });
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(15, 9), wallMaterial); backWall.position.set(0, 4.5, -7); backWall.receiveShadow = true;
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), wallMaterial.clone()); leftWall.rotation.y = Math.PI / 2; leftWall.position.set(-6.5, 4.5, -.5); leftWall.receiveShadow = true;
const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), wallMaterial.clone()); rightWall.rotation.y = -Math.PI / 2; rightWall.position.set(6.5, 4.5, -.5); rightWall.receiveShadow = true;
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
const roofSurface = new THREE.Mesh(hippedRoofGeometry(8.4, 7.4, 2.1, .85, 7.10, 8.85), roofTileMaterial);
const eaveFascia = new THREE.Mesh(new THREE.BoxGeometry(17.2, .30, 15.2), roofFrameMaterial); eaveFascia.position.y = 7.08;
const eaveLining = new THREE.Mesh(new THREE.BoxGeometry(16.5, .12, 14.5), new THREE.MeshStandardMaterial({ color: "#53351f", roughness: .78 })); eaveLining.position.y = 7.32;
const ridgeCap = new THREE.Mesh(new THREE.BoxGeometry(4.7, .34, 1.8), new THREE.MeshPhysicalMaterial({ color: "#252a32", map: roofTile, normalMap: roofTileNormal, roughness: .34, metalness: .05, clearcoat: .14 }));
ridgeCap.position.y = 9.03;
const roofCollar = new THREE.Mesh(new THREE.BoxGeometry(11.2, .32, 8.8), roofFrameMaterial); roofCollar.position.y = 8.72;
[-2.45, 2.45].forEach(positionX => {
  const ridgeEnd = new THREE.Mesh(new THREE.ConeGeometry(.28, .52, 18), new THREE.MeshPhysicalMaterial({ color: "#c99a45", roughness: .18, metalness: .92, envMapIntensity: 1.1 }));
  ridgeEnd.position.set(positionX, 9.45, 0); ridgeEnd.castShadow = true; roof.add(ridgeEnd);
});
roof.add(roofSurface, eaveFascia, eaveLining, ridgeCap, roofCollar);
roof.position.set(0, 0, -.5);
roof.traverse(item => { if (item.isMesh) { item.castShadow = item.receiveShadow = true; } });
scene.add(floor, carpet, roof);

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
[-5.25, -2.25, 2.25, 5.25].forEach(positionX => shojiWindow(positionX, 4.05, -6.93, 0));
[-4.45, -.45, 3.45].forEach(positionZ => {
  shojiWindow(-6.44, 4.05, positionZ, Math.PI / 2);
  shojiWindow(6.44, 4.05, positionZ, -Math.PI / 2);
});
const wallBeams = new THREE.Group();
[5.95, 3.55, 1.15].forEach(height => {
  const backBeam = new THREE.Mesh(new THREE.BoxGeometry(15.1, .18, .22), wallFrameMaterial); backBeam.position.set(0, height, -6.92);
  wallBeams.add(backBeam);
  [-6.45, 6.45].forEach(positionX => {
    const sideBeam = new THREE.Mesh(new THREE.BoxGeometry(.22, .18, 14.1), wallFrameMaterial);
    sideBeam.position.set(positionX, height, -.5); wallBeams.add(sideBeam);
  });
});
for (let positionX = -6.75; positionX <= 6.75; positionX += 1.35) {
  const stud = new THREE.Mesh(new THREE.BoxGeometry(.12, 9.0, .18), wallFrameMaterial); stud.position.set(positionX, 4.5, -6.90); wallBeams.add(stud);
}
for (let positionZ = -7.15; positionZ <= 6.15; positionZ += 1.35) {
  [-6.42, 6.42].forEach(positionX => {
    const stud = new THREE.Mesh(new THREE.BoxGeometry(.18, 9.0, .12), wallFrameMaterial); stud.position.set(positionX, 4.5, positionZ); wallBeams.add(stud);
  });
}
[7.05, 6.35].forEach(height => {
  for (let index = 0; index < 7; index++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(13.1, .20, .24), wallFrameMaterial);
    beam.position.set(0, height, -6.0 + index * 2.0); wallBeams.add(beam);
  }
});
wallBeams.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
scene.add(shojiGroup, wallBeams);

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
hangingLantern(-3.45, 6.12, -1.6, 1, true);
hangingLantern(3.45, 6.12, -1.6, 1, true);
hangingLantern(-2.30, 6.20, 3.0, .82, false);
hangingLantern(2.30, 6.20, 3.0, .82, false);

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
  banner.position.set(positionX, 6.05, positionZ); banner.rotation.y = rotationY;
  banner.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  hangingDecor.add(banner);
  windGroups.push({ object: banner, kind: "banner", seed: Math.abs(positionX * .41 + positionZ * .57), amplitude: .038 });
}
hangingBanner(-3.55, -4.30, "禪", Math.PI / 14);
hangingBanner(3.55, -4.30, "願", -Math.PI / 14);
hangingBanner(-1.85, 5.65, "安", 0, 2.15, .62);
hangingBanner(1.85, 5.65, "靜", 0, 2.15, .62);
hangingDecor.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
scene.add(hangingDecor);

const petalSprite = texture(64, (context, size) => {
  const gradient = context.createRadialGradient(size * .5, size * .5, 2, size * .5, size * .5, size * .5);
  gradient.addColorStop(0, "rgba(255, 214, 230, 1)");
  gradient.addColorStop(.46, "rgba(255, 178, 210, .92)");
  gradient.addColorStop(1, "rgba(255, 178, 210, 0)");
  context.fillStyle = gradient; context.beginPath(); context.ellipse(size * .5, size * .5, size * .48, size * .36, .5, 0, 7); context.fill();
});
const petalCount = 280, petalPositions = new Float32Array(petalCount * 3).fill(-100);
const petalGeometry = new THREE.BufferGeometry();
petalGeometry.setAttribute("position", new THREE.BufferAttribute(petalPositions, 3));
const petalPoints = new THREE.Points(petalGeometry, new THREE.PointsMaterial({
  map: petalSprite, color: "#ffd5e4", size: .13, transparent: true, opacity: .88,
  alphaTest: .04, depthWrite: false, blending: THREE.NormalBlending, sizeAttenuation: true
}));
petalPoints.frustumCulled = false; scene.add(petalPoints);
const petalParticles = [];
const petalSources = [
  [-5.0, 7.3], [5.1, 7.2], [-8.8, 15.8], [8.6, 15.2],
  [-6.1, 15.9], [6.7, 16.4], [-4.9, 12.6], [4.6, 14.1]
];
for (let index = 0; index < petalCount; index++) {
  const sourceIndex = index % petalSources.length, source = petalSources[sourceIndex];
  const particle = {
    x: source[0] + (Math.random() - .5) * 2.2,
    y: 2.0 + Math.random() * 1.9,
    z: source[1] + (Math.random() - .5) * 2.2,
    age: Math.random() * 9, life: 7.5 + Math.random() * 5,
    seed: Math.random() * 9, sourceIndex
  };
  petalParticles.push(particle);
  petalPositions[index * 3] = particle.x; petalPositions[index * 3 + 1] = particle.y; petalPositions[index * 3 + 2] = particle.z;
}

const dustSprite = texture(64, (context, size) => {
  const gradient = context.createRadialGradient(size * .5, size * .5, 1, size * .5, size * .5, size * .5);
  gradient.addColorStop(0, "rgba(255, 243, 205, 1)"); gradient.addColorStop(1, "rgba(255, 243, 205, 0)");
  context.fillStyle = gradient; context.fillRect(0, 0, size, size);
});
const dustCount = 180, dustPositions = new Float32Array(dustCount * 3);
const dustGeometry = new THREE.BufferGeometry();
for (let index = 0; index < dustCount; index++) {
  dustPositions[index * 3] = -5.1 + Math.random() * 10.2;
  dustPositions[index * 3 + 1] = .25 + Math.random() * 4.4;
  dustPositions[index * 3 + 2] = -6.5 + Math.random() * 11.6;
}
dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
const dustPoints = new THREE.Points(dustGeometry, new THREE.PointsMaterial({
  map: dustSprite, color: "#fff2c7", size: .048, transparent: true, opacity: .48,
  depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
}));
dustPoints.frustumCulled = false; scene.add(dustPoints);

const gardenMaterial = new THREE.MeshPhysicalMaterial({ color: "#c9c3b2", roughness: .8, sheen: .12, sheenColor: new THREE.Color("#d8d2bd") });
const garden = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), gardenMaterial);
garden.rotation.x = -Math.PI / 2; garden.position.set(0, -.415, 10.2); garden.receiveShadow = true;
const gardenRake = texture(512, (ctx, size) => {
  ctx.fillStyle = "#d2ccb9"; ctx.fillRect(0, 0, size, size);
  for (let y = 12; y < size; y += 24) { ctx.strokeStyle = "rgba(120, 110, 95, .30)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(8, y); ctx.quadraticCurveTo(size / 2, y + Math.random() * 10 - 5, size - 8, y); ctx.stroke(); }
}, 4, 2);
garden.material.map = gardenRake; garden.material.sheen = .2;
const mossMaterial = new THREE.MeshPhysicalMaterial({ color: "#5e7a45", roughness: .74, sheen: .42, sheenColor: new THREE.Color("#8cc066"), sheenRoughness: .6 });
[-7.2, -4.7, 5.8, 8.9].forEach((positionX, index) => {
  const patch = new THREE.Mesh(new THREE.CircleGeometry(.75 + index * .12, 22), mossMaterial);
  patch.rotation.x = -Math.PI / 2; patch.position.set(positionX, -.405, 10 + index * 1.3 + (index % 2) * 1.6); patch.receiveShadow = true; scene.add(patch);
});
[[-3.8, 11.4], [3.9, 11.8], [-7.8, 14.8], [7.1, 15.4]].forEach(([positionX, positionZ]) => {
  const rockMaterial = new THREE.MeshPhysicalMaterial({ color: "#7f7d75", roughness: .58, clearcoat: .08, clearcoatRoughness: .7 });
  stoneMaterials.push(rockMaterial);
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.35 + Math.random() * .28, 1), rockMaterial);
  rock.position.set(positionX, groundLevel(positionZ) + .16, positionZ);
  rock.rotation.set(Math.random() * 2, Math.random() * 6, Math.random() * 2); rock.castShadow = rock.receiveShadow = true; scene.add(rock);
});
for (let index = 0; index < 5; index++) {
  const step = new THREE.Mesh(new THREE.BoxGeometry(3.6, .13, .58), new THREE.MeshPhysicalMaterial({ map: stone, bumpMap: stoneBump, bumpScale: .1, roughness: .5, clearcoat: .06 }));
  stoneMaterials.push(step.material);
  step.position.set(0, groundLevel(7.42 + index * .6) + .065 - index * .004, 7.42 + index * .6);
  step.castShadow = step.receiveShadow = true; scene.add(step);
}
const stonePath = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 5), new THREE.MeshPhysicalMaterial({ map: stone, bumpMap: stoneBump, bumpScale: .09, roughness: .48, clearcoat: .08 }));
stoneMaterials.push(stonePath.material);
stonePath.rotation.x = -Math.PI / 2; stonePath.position.set(0, -.405, 13.2); stonePath.receiveShadow = true; scene.add(stonePath, garden);

const colliders = [];
function addCollider(positionX, positionZ, radius) { colliders.push({ x: positionX, z: positionZ, radius }); }
function mapleTree(positionX, positionZ, scale = 1, palette = ["#b7452c", "#d65f31"]) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.11, .18, 2.6, 12), new THREE.MeshStandardMaterial({ color: "#56403a", roughness: .82 }));
  trunk.position.y = 1.3;
  const leaves = new THREE.Group();
  [[-.55, 2.45, -.16, 1], [.48, 2.7, .12, .92], [.05, 3.15, .08, 1.08], [.32, 2.2, -.28, .7]].forEach(([leafX, leafY, leafZ, leafScale]) => {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(.84 * leafScale, 2), new THREE.MeshStandardMaterial({ color: leafX < 0 ? palette[0] : palette[1], roughness: .78 }));
    crown.position.set(leafX, leafY, leafZ); leaves.add(crown);
  });
  tree.add(trunk, leaves); tree.scale.setScalar(scale); tree.position.set(positionX, groundLevel(positionZ), positionZ);
  tree.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; }); scene.add(tree); addCollider(positionX, positionZ, .48 * scale);
  windGroups.push({ object: leaves, kind: "tree", seed: positionX * .42 + positionZ * .29, amplitude: .030 });
}
function pineTree(positionX, positionZ, scale = 1) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.1, .16, 1.9, 10), new THREE.MeshStandardMaterial({ color: "#4d3c35", roughness: .85 }));
  trunk.position.y = .95;
  const foliageMaterial = new THREE.MeshStandardMaterial({ color: "#325c44", roughness: .8 });
  const crown = new THREE.Group();
  [1.1, 1.8, 2.5].forEach((height, level) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.08 - level * .22, 1.25, 14), foliageMaterial);
    cone.position.y = height; cone.rotation.y = level * .4; crown.add(cone);
  });
  crown.position.y = 1.8; crown.children.forEach(child => { child.position.y -= 1.8; });
  tree.add(trunk, crown); tree.scale.setScalar(scale); tree.position.set(positionX, groundLevel(positionZ), positionZ);
  tree.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; }); scene.add(tree); addCollider(positionX, positionZ, .45 * scale);
  windGroups.push({ object: crown, kind: "tree", seed: positionX * .35 + positionZ * .44, amplitude: .020 });
}
function stoneLantern(positionX, positionZ) {
  const lantern = new THREE.Group(), granite = new THREE.MeshStandardMaterial({ color: "#8c8c85", roughness: .82 });
  stoneMaterials.push(granite);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.32, .38, .22, 14), granite); base.position.y = .11;
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, .65, 12), granite); pillar.position.y = .52;
  const lightBox = new THREE.Mesh(new THREE.BoxGeometry(.42, .35, .42), granite); lightBox.position.y = 1;
  const glow = new THREE.Mesh(new THREE.BoxGeometry(.22, .18, .22), new THREE.MeshStandardMaterial({ color: "#ffdf9b", emissive: "#ffb453", emissiveIntensity: 1.4 })); glow.position.y = 1;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(.44, .3, 4), granite); cap.position.y = 1.3; cap.rotation.y = Math.PI / 4;
  lantern.add(base, pillar, lightBox, glow, cap); lantern.position.set(positionX, groundLevel(positionZ), positionZ);
  lantern.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; }); scene.add(lantern); addCollider(positionX, positionZ, .42);
}

const bambooStemMaterial = new THREE.MeshStandardMaterial({ color: "#5f8a45", roughness: .62 });
const bambooLeafMaterial = new THREE.MeshStandardMaterial({ color: "#7ba95b", roughness: .72 });
function bambooClump(positionX, positionZ, scale = 1) {
  const clump = new THREE.Group();
  for (let index = 0; index < 6; index++) {
    const angle = index / 6 * Math.PI * 2 + Math.random();
    const stemHeight = 2.15 + Math.random() * .75;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .038, stemHeight, 8), bambooStemMaterial);
    stem.position.set(Math.cos(angle) * .12, stemHeight * .5, Math.sin(angle) * .12);
    stem.rotation.z = Math.cos(angle) * .07; stem.rotation.x = Math.sin(angle) * .07;
    clump.add(stem);
    for (let leafIndex = 0; leafIndex < 5; leafIndex++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(.045, .38, 6), bambooLeafMaterial);
      const leafAngle = angle + leafIndex * 1.2 + Math.random() * .6;
      leaf.position.set(Math.cos(leafAngle) * .14, stemHeight * (.42 + leafIndex * .13), Math.sin(leafAngle) * .14);
      leaf.rotation.set(Math.PI / 2, leafAngle, .48); leaf.scale.set(1, 1, .35); clump.add(leaf);
    }
  }
  clump.scale.setScalar(scale); clump.position.set(positionX, groundLevel(positionZ), positionZ);
  clump.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  scene.add(clump); addCollider(positionX, positionZ, .36 * scale);
  windGroups.push({ object: clump, kind: "tree", seed: positionX * .51 + positionZ * .23, amplitude: .016 });
}
function shrub(positionX, positionZ, scale = 1, flowering = false) {
  const shrubGroup = new THREE.Group();
  const leafMaterial = new THREE.MeshStandardMaterial({ color: flowering ? "#3c734d" : "#456f41", roughness: .8 });
  [[-.18, .22, .06, 1], [.17, .28, -.08, .88], [.02, .38, .10, 1.05], [-.06, .18, -.14, .70]].forEach(([x, y, z, partScale]) => {
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(.24 * partScale, 2), leafMaterial);
    ball.position.set(x, y, z); shrubGroup.add(ball);
  });
  if (flowering) for (let index = 0; index < 12; index++) {
    const flower = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 8), new THREE.MeshStandardMaterial({ color: "#ffd7e2", roughness: .68 }));
    flower.position.set((Math.random() - .5) * .45, .14 + Math.random() * .35, (Math.random() - .5) * .42); shrubGroup.add(flower);
  }
  shrubGroup.scale.setScalar(scale); shrubGroup.position.set(positionX, groundLevel(positionZ), positionZ);
  shrubGroup.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  scene.add(shrubGroup); addCollider(positionX, positionZ, .38 * scale);
}
function stoneBasin(positionX, positionZ) {
  const basin = new THREE.Group(), granite = new THREE.MeshStandardMaterial({ color: "#84847d", roughness: .76 });
  stoneMaterials.push(granite);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(.18, .24, .36, 16), granite); pedestal.position.y = .18;
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.35, .28, .20, 24, 1, true), granite); bowl.material.side = THREE.DoubleSide; bowl.position.y = .48;
  const water = new THREE.Mesh(new THREE.CircleGeometry(.31, 24), new THREE.MeshPhysicalMaterial({ color: "#6fbab8", transparent: true, opacity: .76, roughness: .08, metalness: .06 }));
  water.rotation.x = -Math.PI / 2; water.position.y = .56;
  basin.add(pedestal, bowl, water); basin.position.set(positionX, groundLevel(positionZ), positionZ);
  basin.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  scene.add(basin); addCollider(positionX, positionZ, .42);
}
function gardenFence() {
  const fence = new THREE.Group(), woodMaterial = new THREE.MeshStandardMaterial({ color: "#6c4a34", roughness: .78 });
  woodMaterials.push(woodMaterial);
  for (let index = 0; index <= 7; index++) {
    const z = 4.4 + index * 1.8;
    [-10.5, 10.5].forEach(x => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(.13, .84, .13), woodMaterial);
      post.position.set(x, groundLevel(z) + .42, z); fence.add(post);
    });
  }
  [-10.5, 10.5].forEach(x => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(.08, .09, 12.8), woodMaterial);
    rail.position.set(x, groundLevel(10.3) + .64, 10.3); fence.add(rail);
    const lowerRail = rail.clone(); lowerRail.position.y = groundLevel(10.3) + .32; fence.add(lowerRail);
  });
  for (let index = 0; index <= 10; index++) {
    const x = -10.5 + index * 2.1;
    const post = new THREE.Mesh(new THREE.BoxGeometry(.13, .84, .13), woodMaterial);
    post.position.set(x, groundLevel(17) + .42, 17); fence.add(post);
  }
  const backRail = new THREE.Mesh(new THREE.BoxGeometry(21.2, .09, .08), woodMaterial);
  backRail.position.set(0, groundLevel(17) + .64, 17); fence.add(backRail);
  const backLowerRail = backRail.clone(); backLowerRail.position.y = groundLevel(17) + .32; fence.add(backLowerRail);
  fence.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  scene.add(fence);
}
[[-7.5, 9.6, 1.05], [7.8, 10.6, .92], [-10.2, 13.8, 1.12], [10.4, 15.3, .95]].forEach(([x, z, scale]) => mapleTree(x, z, scale));
[[-9.1, 10.4, .9], [9.2, 13.6, 1.04], [-6.4, 15.4, .88], [6.8, 16.1, .96]].forEach(([x, z, scale]) => pineTree(x, z, scale));
[[-3.2, 10.8], [3.3, 10.8], [-7.2, 14.5], [7.4, 14.5]].forEach(([x, z]) => stoneLantern(x, z));
[[-5.0, 7.3, .92, ["#f0b6c8", "#ffdce6"]], [5.1, 7.2, .98, ["#f4a9c4", "#ffd9e4"]], [-8.8, 15.8, .88, ["#f6becd", "#ffe4ec"]], [8.6, 15.2, .94, ["#f2aec6", "#ffdce6"]]].forEach(([x, z, scale, palette]) => mapleTree(x, z, scale, palette));
[[-9.8, 5.1, 1.08], [-10.2, 7.6, .95], [9.7, 5.2, 1.02], [10.3, 8.5, .92], [-6.1, 15.9, .88], [6.7, 16.4, .96]].forEach(([x, z, scale]) => bambooClump(x, z, scale));
[[-8.3, 7.2], [-6.8, 9.8], [-4.9, 12.6], [5.4, 8.1], [7.6, 12.4], [9.4, 15.9], [4.6, 14.1]].forEach(([x, z]) => shrub(x, z, .95 + Math.random() * .25, Math.random() > .6));
stoneBasin(-4.8, 14.8); stoneBasin(6.4, 15.2);
[[-5.4, 7.7], [-6.2, 9.3], [-5.7, 11.0], [-4.6, 12.4], [-3.9, 13.8], [5.6, 7.6], [6.4, 9.2], [5.9, 10.9], [4.8, 12.3], [4.1, 13.8]].forEach(([positionX, positionZ], index) => {
  const steppingStone = new THREE.Mesh(new THREE.CylinderGeometry(.38 + (index % 3) * .04, .44 + (index % 3) * .04, .10, 16), new THREE.MeshPhysicalMaterial({ map: stone.clone(), bumpMap: stoneBump.clone(), bumpScale: .07, roughness: .62, clearcoat: .04 }));
  stoneMaterials.push(steppingStone.material);
  steppingStone.position.set(positionX, groundLevel(positionZ) + .05, positionZ);
  steppingStone.rotation.y = index * .7; steppingStone.castShadow = steppingStone.receiveShadow = true; scene.add(steppingStone);
});
gardenFence();

const torii = new THREE.Group(), toriiWood = new THREE.MeshPhysicalMaterial({ color: "#d43f31", roughness: .32, metalness: .04, clearcoat: .22, clearcoatRoughness: .32 });
woodMaterials.push(toriiWood);
[-2.1, 2.1].forEach(positionX => {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, 4.6, 18), toriiWood); post.position.set(positionX, 2.3, 0); torii.add(post);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.25, .045, 10, 24), toriiWood); ring.rotation.x = Math.PI / 2; ring.position.set(positionX, .18, 0); torii.add(ring);
  addCollider(positionX, 13.6, .32);
});
const topBeam = new THREE.Mesh(new THREE.BoxGeometry(6.4, .3, .52), toriiWood); topBeam.position.set(0, 4.62, 0); topBeam.rotation.z = .025;
const secondBeam = new THREE.Mesh(new THREE.BoxGeometry(5.5, .22, .36), toriiWood); secondBeam.position.y = 3.88;
torii.add(topBeam, secondBeam); torii.position.set(0, groundLevel(13.6), 13.6);
torii.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; }); scene.add(torii);

const pond = new THREE.Mesh(new THREE.CircleGeometry(1.55, 40), new THREE.MeshPhysicalMaterial({ color: "#3a6b6a", roughness: .035, metalness: .1, transmission: .38, thickness: .65, ior: 1.32, transparent: true, opacity: .9, envMapIntensity: 1.6 }));
pond.rotation.x = -Math.PI / 2; pond.position.set(-7.8, -.385, 12.2); pond.receiveShadow = true;
const pondRim = new THREE.Mesh(new THREE.TorusGeometry(1.55, .1, 10, 48), new THREE.MeshPhysicalMaterial({ color: "#767570", roughness: .52, clearcoat: .08, clearcoatRoughness: .6 }));
pondRim.rotation.x = Math.PI / 2; pondRim.position.set(-7.8, -.36, 12.2);
scene.add(pond, pondRim);
const pondBed = new THREE.Mesh(new THREE.CircleGeometry(1.48, 36), new THREE.MeshStandardMaterial({ color: "#48565c", roughness: .88 }));
pondBed.rotation.x = -Math.PI / 2; pondBed.position.set(-7.8, -.418, 12.2);
scene.add(pondBed);
[[.30, .12], [-.42, .28], [.12, -.35]].forEach(([offsetX, offsetZ]) => {
  const pebble = new THREE.Mesh(new THREE.SphereGeometry(.08 + Math.random() * .04, 10, 8), new THREE.MeshStandardMaterial({ color: "#7c7d77", roughness: .84 }));
  pebble.position.set(-7.8 + offsetX, -.408, 12.2 + offsetZ); pebble.castShadow = pebble.receiveShadow = true; scene.add(pebble);
});
const koi = [];
["#e8703c", "#f4d35e", "#eae6df", "#d75a44"].forEach((color, index) => {
  const fish = new THREE.Group(), fishMaterial = new THREE.MeshStandardMaterial({ color, roughness: .42 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(.11, 16, 14), fishMaterial); body.scale.set(2.1, .72, .88);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(.055, .16, 10), fishMaterial); tail.position.x = -.24; tail.rotation.z = Math.PI / 2;
  fish.add(body, tail); fish.position.set(-7.8 + Math.cos(index * 1.6) * .85, -.418, 12.2 + Math.sin(index * 1.6) * .78);
  fish.traverse(item => { if (item.isMesh) item.castShadow = false; });
  koi.push({ fish, seed: index * 1.55 }); scene.add(fish);
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: "#d8f3f0", transmission: .94, thickness: .28, roughness: .04, ior: 1.42,
  clearcoat: 1, clearcoatRoughness: .04, transparent: true, opacity: .96
});
const glassVessel = new THREE.Mesh(new THREE.CylinderGeometry(.17, .12, .21, 36), glassMaterial);
glassVessel.position.set(2.55, 2.04, -5.75); glassVessel.castShadow = true;
const water = new THREE.Mesh(new THREE.CircleGeometry(.13, 28), new THREE.MeshPhysicalMaterial({ color: "#78c4c0", transparent: true, opacity: .74, roughness: .05, metalness: .08 }));
water.rotation.x = -Math.PI / 2; water.position.set(2.55, 2.135, -5.75);
scene.add(glassVessel, water);

const columnGeometry = new THREE.CylinderGeometry(.42, .47, 7.2, 22);
const columnMaterial = new THREE.MeshPhysicalMaterial({ color: "#8d2b21", map: wood, bumpMap: woodBump, bumpScale: .12, roughness: .3, metalness: .06, clearcoat: .24, clearcoatRoughness: .3, envMapIntensity: .9 });
woodMaterials.push(columnMaterial);
[-4.9, -1, 2.4, 5.4].forEach(z => [-5.6, 5.6].forEach(x => {
  const column = new THREE.Mesh(columnGeometry, columnMaterial); column.position.set(x, 3.6, z); column.castShadow = column.receiveShadow = true;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.58, .66, .36, 20), new THREE.MeshPhysicalMaterial({ color: "#4d443c", bumpMap: stoneBump.clone(), bumpScale: .06, roughness: .42, clearcoat: .1, clearcoatRoughness: .55 }));
  base.position.set(x, .18, z); base.receiveShadow = true; scene.add(column, base);
}));

const platform = new THREE.Mesh(new THREE.BoxGeometry(7.2, .8, 3.8), new THREE.MeshPhysicalMaterial({ map: stone.clone(), bumpMap: stoneBump.clone(), bumpScale: .1, roughness: .42, clearcoat: .12, clearcoatRoughness: .45, envMapIntensity: .8 }));
stoneMaterials.push(platform.material);
platform.position.set(0, .4, -5.0); platform.receiveShadow = platform.castShadow = true;
const altarMaterial = new THREE.MeshPhysicalMaterial({ map: wood, bumpMap: woodBump.clone(), bumpScale: .11, roughness: .28, metalness: .08, clearcoat: .28, clearcoatRoughness: .26 });
const altar = new THREE.Mesh(new THREE.BoxGeometry(3.8, .24, .66), altarMaterial);
woodMaterials.push(altar.material);
altar.position.set(0, 1.805, -5.55); altar.castShadow = true;
const altarLegs = new THREE.Group();
[[-1.62, -.20], [1.62, -.20], [-1.62, .20], [1.62, .20]].forEach(([x, z]) => {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(.18, .89, .18), altarMaterial);
  leg.position.set(x, 1.243, -5.55 + z); leg.castShadow = true; altarLegs.add(leg);
});
const altarApron = new THREE.Mesh(new THREE.BoxGeometry(3.20, .20, .42), altarMaterial);
altarApron.position.set(0, 1.585, -5.55); altarApron.castShadow = true; altarLegs.add(altarApron);
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
statue.scale.setScalar(.72);
statue.position.set(0, 1.925, -5.55); statue.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
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
burner.position.set(0, 0, -2.45); burner.traverse(item => { if (item.isMesh) item.castShadow = true; });
const ash = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .08, 30), new THREE.MeshStandardMaterial({ color: "#c9c2b3", roughness: .95 }));
ash.position.set(0, .525, -2.45);
const altarLight = new THREE.PointLight("#ffc880", 10, 13, 1.9); altarLight.position.set(0, 3.4, -5.3); altarLight.castShadow = true;
scene.add(platform, altar, altarLegs, statue, burner, ash, altarLight);

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
  incenseStand.position.set(incensePickupPoint.x, groundLevel(incensePickupPoint.z), incensePickupPoint.z);
  incenseStand.traverse(item => { if (item.isMesh) item.castShadow = true; });
  scene.add(incenseStand);
  addCollider(incensePickupPoint.x, incensePickupPoint.z, .30);
}
addCollider(0, -5.2, 1.9); addCollider(-2.4, -5.5, 1.05); addCollider(2.4, -5.5, 1.05);

const shrineBackdrop = new THREE.Group();
const carvedWoodMaterial = new THREE.MeshPhysicalMaterial({ color: "#562e18", map: wood, bumpMap: woodBump, bumpScale: .14, roughness: .38, clearcoat: .22, clearcoatRoughness: .24, envMapIntensity: .8 });
const brocadeMaterial = new THREE.MeshPhysicalMaterial({ color: "#772018", roughness: .58, sheen: .68, sheenColor: new THREE.Color("#ffca80"), sheenRoughness: .38, bumpMap: fabricBump, bumpScale: .16, envMapIntensity: .62 });
const goldTrimMaterial = new THREE.MeshPhysicalMaterial({ color: "#c69749", roughness: .16, metalness: .96, clearcoat: .28, envMapIntensity: 1.2 });
const mandorla = new THREE.Mesh(new THREE.TorusGeometry(1.42, .062, 16, 96), goldTrimMaterial); mandorla.position.set(0, 3.62, -6.60);
const mandorlaInner = new THREE.Mesh(new THREE.CircleGeometry(1.36, 64), new THREE.MeshPhysicalMaterial({ color: "#ffd9a0", emissive: "#ffbd67", emissiveIntensity: .48, roughness: .28, metalness: .12, transparent: true, opacity: .25 }));
mandorlaInner.position.set(0, 3.62, -6.61);
const mandorlaRays = new THREE.Group();
for (let index = 0; index < 24; index++) {
  const angle = index / 24 * Math.PI * 2;
  const ray = new THREE.Mesh(new THREE.BoxGeometry(.016, .16 + (index % 4) * .05, .006), goldTrimMaterial);
  ray.position.set(Math.cos(angle) * 1.56, 3.62 + Math.sin(angle) * 1.56, -6.60);
  ray.rotation.z = angle - Math.PI / 2; mandorlaRays.add(ray);
}
[-2.62, 2.62].forEach(positionX => {
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.095, .115, 4.55, 18), carvedWoodMaterial); pillar.position.set(positionX, 3.10, -6.68);
  const capital = new THREE.Mesh(new THREE.CylinderGeometry(.19, .14, .18, 18), goldTrimMaterial); capital.position.set(positionX, 5.30, -6.68);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(.16, .21, .18, 18), goldTrimMaterial); plinth.position.set(positionX, .88, -6.68);
  shrineBackdrop.add(pillar, capital, plinth);
  for (let index = 0; index < 5; index++) {
    const curtain = new THREE.Mesh(new THREE.CapsuleGeometry(.075 + Math.random() * .02, .88 + Math.random() * .24, 6, 12), brocadeMaterial);
    curtain.position.set(positionX + (index - 2) * .11, 4.72, -6.59); curtain.rotation.z = (Math.random() - .5) * .08;
    shrineBackdrop.add(curtain);
  }
});
const canopyTop = new THREE.Mesh(new THREE.BoxGeometry(6.0, .22, 1.0), carvedWoodMaterial); canopyTop.position.set(0, 5.48, -6.58);
const canopyValance = new THREE.Mesh(new THREE.BoxGeometry(5.7, .24, .74), brocadeMaterial); canopyValance.position.set(0, 5.30, -6.52);
[[-2.75, -6.20], [0, -6.34], [2.75, -6.20]].forEach(([positionX, positionZ], index) => {
  const canopyFinial = new THREE.Mesh(new THREE.SphereGeometry(.10, 16, 14), goldTrimMaterial); canopyFinial.position.set(positionX, 5.68, positionZ);
  canopyFinial.scale.y = index === 1 ? 1.25 : 1; shrineBackdrop.add(canopyFinial);
});
shrineBackdrop.add(mandorla, mandorlaInner, mandorlaRays, canopyTop, canopyValance);
shrineBackdrop.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
scene.add(shrineBackdrop);

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
  table.position.set(positionX, .8, -4.10); table.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  scene.add(table); addCollider(positionX, -4.10, .68);
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
  stand.position.set(3, .8, -4.10); stand.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  scene.add(stand); addCollider(3, -4.10, .68);
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
  bell.frame.position.set(-3.45, groundLevel(8.05), 8.05);
  bell.frame.traverse(item => { if (item.isMesh) { item.castShadow = true; item.receiveShadow = true; } });
  scene.add(bell.frame); addCollider(-3.45, 8.05, .72);
}

const flames = [];
function candle(x) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.13, .15, .7, 20), new THREE.MeshStandardMaterial({ color: "#e8d2b0", roughness: .55 })); body.position.y = .35;
  const flame = new THREE.Mesh(new THREE.ConeGeometry(.055, .19, 14), new THREE.MeshStandardMaterial({ color: "#ffbf60", emissive: "#ff9d22", emissiveIntensity: 4 })); flame.position.y = .82;
  const light = new THREE.PointLight("#ffa244", 3, 4.5, 2); light.position.y = .84;
  group.add(body, flame, light); group.position.set(x, 1.925, -5.7); group.traverse(item => { if (item.isMesh) item.castShadow = true; });
  flames.push({ flame, light, seed: Math.random() * 10 }); scene.add(group);
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
  scene.add(mat, rim);
});

const entranceGroup = new THREE.Group(), floorTrimGroup = new THREE.Group();
const entranceWoodMaterial = new THREE.MeshPhysicalMaterial({ color: "#5e321c", map: wood, bumpMap: woodBump, bumpScale: .11, roughness: .35, clearcoat: .2, clearcoatRoughness: .22, envMapIntensity: .78 });
const entranceStoneMaterial = new THREE.MeshPhysicalMaterial({ color: "#7b7468", map: stone.clone(), bumpMap: stoneBump.clone(), bumpScale: .10, roughness: .52, clearcoat: .10, envMapIntensity: .72 });
stoneMaterials.push(entranceStoneMaterial);
const threshold = new THREE.Mesh(new THREE.BoxGeometry(5.0, .14, .68), entranceStoneMaterial);
threshold.position.set(0, .07, 6.78); threshold.receiveShadow = true; entranceGroup.add(threshold);
[-2.32, 2.32].forEach(positionX => {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.17, .20, 4.5, 20), entranceWoodMaterial);
  post.position.set(positionX, 2.25, 6.70); entranceGroup.add(post);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.28, .34, .26, 20), entranceStoneMaterial);
  base.position.set(positionX, .14, 6.70); entranceGroup.add(base);
  const capital = new THREE.Mesh(new THREE.CylinderGeometry(.24, .19, .20, 20), entranceWoodMaterial);
  capital.position.set(positionX, 4.55, 6.70); entranceGroup.add(capital);
  const lanternBody = new THREE.Mesh(new THREE.SphereGeometry(.19, 22, 18), new THREE.MeshStandardMaterial({ color: "#c23b2d", roughness: .44, emissive: "#ff9245", emissiveIntensity: .54 }));
  lanternBody.position.set(positionX, 3.85, 6.70); lanternBody.scale.y = 1.18;
  const lanternCap = new THREE.Mesh(new THREE.CylinderGeometry(.10, .14, .08, 18), goldTrimMaterial); lanternCap.position.set(positionX, 4.08, 6.70);
  const lanternLight = new THREE.PointLight("#ffb46a", 2.2, 4.0, 2); lanternLight.position.set(positionX, 3.85, 6.85);
  entranceGroup.add(lanternBody, lanternCap, lanternLight);
  addCollider(positionX, 6.70, .38);
});
const doorLintel = new THREE.Mesh(new THREE.BoxGeometry(5.45, .42, .40), entranceWoodMaterial);
doorLintel.position.set(0, 4.76, 6.70); entranceGroup.add(doorLintel);
const plaqueCanvas = document.createElement("canvas"); plaqueCanvas.width = 512; plaqueCanvas.height = 128;
const plaqueContext = plaqueCanvas.getContext("2d");
plaqueContext.fillStyle = "#1c120c"; plaqueContext.fillRect(0, 0, 512, 128);
plaqueContext.strokeStyle = "#d6ab58"; plaqueContext.lineWidth = 8; plaqueContext.strokeRect(12, 12, 488, 104);
plaqueContext.fillStyle = "#ffd98d"; plaqueContext.font = "bold 74px serif"; plaqueContext.textAlign = "center"; plaqueContext.textBaseline = "middle";
plaqueContext.fillText("大雄宝殿", 256, 68);
const plaqueTexture = new THREE.CanvasTexture(plaqueCanvas); plaqueTexture.colorSpace = THREE.SRGBColorSpace; plaqueTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
const plaque = new THREE.Mesh(new THREE.PlaneGeometry(3.1, .78), new THREE.MeshStandardMaterial({ map: plaqueTexture, roughness: .48 }));
plaque.position.set(0, 4.76, 6.48); entranceGroup.add(plaque);
[[-2.95, 1], [2.95, -1]].forEach(([positionX, side]) => {
  const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(.70, 3.4, .12), entranceWoodMaterial);
  sidePanel.position.set(positionX, 1.92, 6.76); entranceGroup.add(sidePanel);
  for (let index = 1; index < 5; index++) {
    const lattice = new THREE.Mesh(new THREE.BoxGeometry(.06, 3.1, .05), goldTrimMaterial);
    lattice.position.set(positionX + side * .06, 1.92, 6.81 - index * .012); lattice.rotation.z = index % 2 ? .18 : -.18;
    entranceGroup.add(lattice);
  }
});
[-6.35, 6.35].forEach(positionZ => {
  const roomEdge = new THREE.Mesh(new THREE.BoxGeometry(13.7, .10, .28), entranceWoodMaterial);
  roomEdge.position.set(0, .045, positionZ); floorTrimGroup.add(roomEdge);
});
[-5.15, 5.15].forEach(positionX => {
  const roomEdge = new THREE.Mesh(new THREE.BoxGeometry(.28, .10, 13.0), entranceWoodMaterial);
  roomEdge.position.set(positionX, .045, -.5); floorTrimGroup.add(roomEdge);
});
[[-2.45, .4], [2.45, .4]].forEach(([positionX, positionZ]) => {
  const brassLine = new THREE.Mesh(new THREE.BoxGeometry(.05, .015, 11.2), goldTrimMaterial);
  brassLine.position.set(positionX, .022, positionZ); floorTrimGroup.add(brassLine);
});
[[-2.75, 5.3], [2.75, 5.3]].forEach(([positionX, positionZ]) => {
  const brassCrossLine = new THREE.Mesh(new THREE.BoxGeometry(5.8, .015, .05), goldTrimMaterial);
  brassCrossLine.position.set(positionX, .022, positionZ); floorTrimGroup.add(brassCrossLine);
});
entranceGroup.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
floorTrimGroup.traverse(item => { if (item.isMesh) item.receiveShadow = true; });
scene.add(entranceGroup, floorTrimGroup);

const entranceCanopy = new THREE.Group();
const canopyFrame = new THREE.Mesh(new THREE.BoxGeometry(5.9, .22, 1.85), entranceWoodMaterial);
canopyFrame.position.set(0, 4.98, 7.48); canopyFrame.rotation.x = -.12;
const canopyDeck = new THREE.Mesh(new THREE.BoxGeometry(5.55, .11, 1.55), new THREE.MeshPhysicalMaterial({ map: roofTile, normalMap: roofTileNormal, normalScale: new THREE.Vector2(.55, .55), roughness: .37, metalness: .04, clearcoat: .12, side: THREE.DoubleSide }));
canopyDeck.position.set(0, 5.13, 7.48); canopyDeck.rotation.x = -.12;
const entranceCanopyValance = new THREE.Mesh(new THREE.BoxGeometry(5.5, .22, .28), brocadeMaterial);
entranceCanopyValance.position.set(0, 4.86, 8.32); entranceCanopyValance.rotation.x = -.12;
[-2.55, 2.55].forEach(positionX => {
  const brace = new THREE.Mesh(new THREE.BoxGeometry(.14, .78, .14), entranceWoodMaterial);
  brace.position.set(positionX, 5.24, 7.02); brace.rotation.x = .42; entranceCanopy.add(brace);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 14), goldTrimMaterial);
  finial.position.set(positionX, 5.39, 8.18); entranceCanopy.add(finial);
});
entranceCanopy.add(canopyFrame, canopyDeck, entranceCanopyValance);
entranceCanopy.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
scene.add(entranceCanopy);
[7.10, 10.30].forEach((positionZ, index) => {
  const landing = new THREE.Mesh(new THREE.BoxGeometry(3.9 + index * .3, .13, .82), entranceStoneMaterial);
  landing.position.set(0, groundLevel(positionZ) + .065, positionZ);
  landing.castShadow = landing.receiveShadow = true; scene.add(landing);
});

const skin = new THREE.MeshPhysicalMaterial({ color: "#ffd02b", roughness: .48, clearcoat: .14 });
const cloth = new THREE.MeshPhysicalMaterial({ color: "#171a20", roughness: .46, sheen: .16, sheenColor: new THREE.Color("#68707c"), sheenRoughness: .56 });
const trousers = new THREE.MeshPhysicalMaterial({ color: "#82878d", roughness: .60, sheen: .08, sheenColor: new THREE.Color("#d9dddf"), sheenRoughness: .72 });
const trim = new THREE.MeshPhysicalMaterial({ color: "#f4f6f4", roughness: .34, metalness: .02, clearcoat: .12 });
const hairMaterial = new THREE.MeshPhysicalMaterial({ color: "#e6e9ec", roughness: .34, clearcoat: .28, clearcoatRoughness: .46, envMapIntensity: .62 });
const eyeMaterial = new THREE.MeshPhysicalMaterial({ color: "#222222", roughness: .08, clearcoat: 1 });
const whiteEyeMaterial = new THREE.MeshStandardMaterial({ color: "#fffaf4", roughness: .2 });

function createChibiAvatar() {
  const avatar = new THREE.Group();
  const figure = new THREE.Group();

  const bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(.150, .19, 10, 20), cloth); bodyMesh.position.y = .71;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.095, .032, 12, 28), cloth); collar.rotation.x = Math.PI / 2; collar.position.y = .835;
  const pelvisMesh = new THREE.Mesh(new THREE.CapsuleGeometry(.142, .08, 10, 20), trousers); pelvisMesh.position.y = .52;
  const belt = new THREE.Mesh(new THREE.BoxGeometry(.30, .055, .28), trim); belt.position.y = .605;
  const suspenders = new THREE.Group();
  [-.11, .11].forEach(side => [-.10, .10].forEach(depth => {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(.036, .235, .05), trim);
    strap.position.set(side, .715, depth * 1.28); suspenders.add(strap);
  }));
  figure.add(bodyMesh, pelvisMesh, collar, belt, suspenders);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.052, .06, .07, 12), skin); neck.position.y = .84;
  const head = new THREE.Group(); head.position.y = 1.13;
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(.265, 38, 32), skin); headMesh.scale.set(.96, 1, .94);
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(.274, 34, 28), hairMaterial); hairBack.scale.set(.96, .98, 1); hairBack.position.set(0, .012, -.028);
  const hairTop = new THREE.Mesh(new THREE.SphereGeometry(.268, 34, 28, 0, Math.PI * 2, 0, Math.PI * .47), hairMaterial); hairTop.scale.set(.97, .98, .97); hairTop.position.y = .008;
  const fringe = new THREE.Mesh(new THREE.TorusGeometry(.185, .038, 10, 32, Math.PI * 1.3), hairMaterial); fringe.rotation.x = Math.PI / 2; fringe.position.set(0, .11, .055);
  [-.088, .088].forEach(side => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(.074, 24, 20), whiteEyeMaterial); eyeWhite.position.set(side, .025, .202); eyeWhite.scale.set(1, 1.08, .78);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.038, 20, 18), eyeMaterial); pupil.position.set(side, .018, .262); pupil.scale.set(1, 1.05, .62);
    const highlight = new THREE.Mesh(new THREE.SphereGeometry(.013, 12, 10), whiteEyeMaterial); highlight.position.set(side + .016, .058, .283);
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(.049, 22), new THREE.MeshStandardMaterial({ color: "#e74c3c", roughness: .82, transparent: true, opacity: .9 }));
    cheek.position.set(side * 1.85, -.055, .178); cheek.rotation.y = side * .68;
    head.add(eyeWhite, pupil, highlight, cheek);
  });
  const beak = new THREE.Mesh(new THREE.SphereGeometry(.076, 24, 20), new THREE.MeshPhysicalMaterial({ color: "#f79a2b", roughness: .38, clearcoat: .22 }));
  beak.scale.set(1.16, .58, .78); beak.position.set(0, -.088, .238); head.add(beak);
  head.add(headMesh, hairBack, hairTop, fringe);

  function chibiArm(side) {
    const shoulder = new THREE.Group(); shoulder.position.set(.205 * side, .80, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(.068, .10, 8, 14), cloth); sleeve.position.y = -.09;
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(.044, .13, 8, 12), skin); forearm.position.y = -.21;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.055, 18, 14), skin); hand.position.y = -.31;
    shoulder.add(sleeve, forearm, hand);
    return { shoulder, hand };
  }

  const leftArm = chibiArm(-1), rightArm = chibiArm(1);
  const basketball = new THREE.Group();
  const basketballBody = new THREE.Mesh(new THREE.SphereGeometry(.115, 30, 24), new THREE.MeshPhysicalMaterial({ color: "#d17030", roughness: .58, clearcoat: .06, envMapIntensity: .45 }));
  const basketballSeam = new THREE.Mesh(new THREE.TorusGeometry(.114, .006, 8, 36), new THREE.MeshStandardMaterial({ color: "#2c2015", roughness: .62 }));
  basketballSeam.rotation.x = Math.PI / 2;
  basketball.add(basketballBody, basketballSeam);
  basketball.position.set(-.062, -.015, .072); basketball.rotation.set(.28, .35, .12);
  leftArm.hand.add(basketball);

  function chibiLeg(side) {
    const hip = new THREE.Group(); hip.position.set(.095 * side, .44, 0);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(.064, .14, 8, 14), trousers); thigh.position.y = -.13;
    const knee = new THREE.Group(); knee.position.y = -.27;
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(.052, .13, 8, 12), trousers); shin.position.y = -.12;
    const foot = new THREE.Mesh(new THREE.CapsuleGeometry(.05, .10, 8, 12), new THREE.MeshStandardMaterial({ color: "#20242a", roughness: .48 }));
    foot.rotation.x = Math.PI / 2; foot.position.set(0, -.25, .025);
    knee.add(shin, foot); hip.add(thigh, knee);
    return { hip, knee };
  }

  const leftLeg = chibiLeg(-1), rightLeg = chibiLeg(1);
  figure.add(neck, head, leftArm.shoulder, rightArm.shoulder, leftLeg.hip, rightLeg.hip);
  figure.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  avatar.add(figure);
  return { avatar, figure, head, leftArm, rightArm, leftLeg, rightLeg, basketball };
}

const localChibi = createChibiAvatar();
const { avatar, figure, head, leftArm, rightArm, leftLeg, rightLeg, basketball } = localChibi;
avatar.position.set(0, 0, 3);
scene.add(avatar);

const remotePlayers = new Map();

function createNameSprite(name) {
  const canvasElement = document.createElement("canvas");
  const context = canvasElement.getContext("2d");
  const fontSize = 38;
  context.font = `600 ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  const textWidth = Math.ceil(context.measureText(name).width);
  canvasElement.width = Math.min(320, Math.max(96, textWidth + 34));
  canvasElement.height = 56;
  context.font = `600 ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(16, 8, 8, .76)";
  context.fillRect(0, 0, canvasElement.width, canvasElement.height);
  context.strokeStyle = "rgba(255, 207, 118, .42)";
  context.lineWidth = 2;
  context.strokeRect(1, 1, canvasElement.width - 2, canvasElement.height - 2);
  context.fillStyle = "#fff3df";
  context.fillText(name, canvasElement.width / 2, canvasElement.height / 2 + 1, canvasElement.width - 24);
  const texture = new THREE.CanvasTexture(canvasElement);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(canvasElement.width * .004, canvasElement.height * .004, 1);
  sprite.position.set(0, 1.62, 0);
  sprite.renderOrder = 2;
  return sprite;
}

function createRemotePlayer(player) {
  const chibi = createChibiAvatar();
  chibi.basketball.visible = false;
  chibi.avatar.position.set(player.x, groundLevel(player.z), player.z);
  chibi.avatar.rotation.y = player.heading;
  const nameSprite = createNameSprite(player.nickname || "香客");
  chibi.avatar.add(nameSprite);
  scene.add(chibi.avatar);
  const remote = {
    id: player.id,
    nickname: player.nickname || "香客",
    chibi,
    nameSprite,
    targetX: player.x,
    targetZ: player.z,
    targetHeading: player.heading,
    walkPhase: Math.random() * Math.PI * 2,
    animation: player.animation || "idle",
    actionUntil: 0
  };
  remotePlayers.set(remote.id, remote);
  return remote;
}

function removeRemotePlayer(playerId) {
  const remote = remotePlayers.get(playerId);
  if (!remote) return;
  remotePlayers.delete(playerId);
  scene.remove(remote.chibi.avatar);
  remote.chibi.avatar.traverse(item => {
    if (item.isMesh) item.geometry?.dispose();
  });
  remote.nameSprite.material.map?.dispose();
  remote.nameSprite.material.dispose();
}

function applyRemoteState(player) {
  if (!player?.id || player.id === network?.playerId) return;
  const remote = remotePlayers.get(player.id) || createRemotePlayer(player);
  remote.nickname = player.nickname || remote.nickname;
  remote.targetX = Number(player.x) || 0;
  remote.targetZ = Number(player.z) || 0;
  remote.targetHeading = Number(player.heading) || 0;
  if (performance.now() >= remote.actionUntil) {
    remote.animation = player.animation || "idle";
  }
}

function syncRemotePlayers(players) {
  const activeIds = new Set();
  players.forEach(player => {
    if (player.id === network?.playerId) return;
    activeIds.add(player.id);
    applyRemoteState(player);
  });
  [...remotePlayers.keys()].forEach(playerId => {
    if (!activeIds.has(playerId)) removeRemotePlayer(playerId);
  });
}

function setRemoteAction(message) {
  const remote = remotePlayers.get(message.playerId);
  if (!remote) return;
  remote.animation = message.animation || "idle";
  remote.actionUntil = performance.now() + Math.max(0, Number(message.duration) || 0);
}

function updateRemotePlayers(delta) {
  const now = performance.now();
  remotePlayers.forEach(remote => {
    if (remote.actionUntil && now >= remote.actionUntil) {
      remote.animation = "idle";
      remote.actionUntil = 0;
    }

    const avatarObject = remote.chibi.avatar;
    const dx = remote.targetX - avatarObject.position.x;
    const dz = remote.targetZ - avatarObject.position.z;
    const distance = Math.hypot(dx, dz);
    const smoothing = 1 - Math.exp(-10 * delta);
    avatarObject.position.x += dx * smoothing;
    avatarObject.position.z += dz * smoothing;
    avatarObject.position.y = groundLevel(avatarObject.position.z);

    const angleDelta = Math.atan2(
      Math.sin(remote.targetHeading - avatarObject.rotation.y),
      Math.cos(remote.targetHeading - avatarObject.rotation.y)
    );
    avatarObject.rotation.y += angleDelta * smoothing;

    const moving = distance > .03 || remote.animation === "walk";
    if (moving) remote.walkPhase += delta * 9;
    const swing = moving ? Math.sin(remote.walkPhase) * .62 : 0;
    const chibi = remote.chibi;
    chibi.figure.position.set(0, .13 + Math.abs(Math.sin(remote.walkPhase)) * .025, 0);
    chibi.figure.rotation.set(0, 0, 0);
    chibi.head.rotation.set(0, 0, 0);
    chibi.leftLeg.hip.rotation.x = swing;
    chibi.rightLeg.hip.rotation.x = -swing;
    chibi.leftLeg.knee.rotation.x = Math.max(0, -swing) * .78;
    chibi.rightLeg.knee.rotation.x = Math.max(0, swing) * .78;
    chibi.leftArm.shoulder.rotation.set(-swing * .48, 0, 0);
    chibi.rightArm.shoulder.rotation.set(swing * .48, 0, 0);

    if (remote.animation === "pray") {
      chibi.figure.position.y = -.15;
      chibi.figure.rotation.x = .55;
      chibi.head.rotation.x = .35;
      chibi.leftArm.shoulder.rotation.x = chibi.rightArm.shoulder.rotation.x = -.9;
      chibi.leftArm.shoulder.rotation.z = .3;
      chibi.rightArm.shoulder.rotation.z = -.3;
      chibi.leftLeg.hip.rotation.x = chibi.rightLeg.hip.rotation.x = -1;
      chibi.leftLeg.knee.rotation.x = chibi.rightLeg.knee.rotation.x = 2;
    } else if (remote.animation === "dance") {
      const beat = now * .006;
      chibi.figure.position.y = .13 + Math.abs(Math.sin(beat)) * .06;
      chibi.figure.rotation.z = Math.sin(beat * .5) * .12;
      chibi.leftArm.shoulder.rotation.x = -1.2 + Math.sin(beat) * .35;
      chibi.rightArm.shoulder.rotation.x = -1.2 - Math.sin(beat) * .35;
      chibi.leftArm.shoulder.rotation.z = .55;
      chibi.rightArm.shoulder.rotation.z = -.55;
    } else if (remote.animation === "bell") {
      chibi.rightArm.shoulder.rotation.x = -1.35 + Math.sin(now * .012) * .5;
      chibi.rightArm.shoulder.rotation.z = -.35;
    } else if (remote.animation === "woodfish") {
      chibi.rightArm.shoulder.rotation.x = -.8 + Math.sin(now * .018) * .3;
      chibi.rightArm.shoulder.rotation.z = -.3;
    } else if (remote.animation === "incense") {
      chibi.figure.rotation.x = .12;
      chibi.leftArm.shoulder.rotation.x = chibi.rightArm.shoulder.rotation.x = -1.1;
      chibi.leftArm.shoulder.rotation.z = .25;
      chibi.rightArm.shoulder.rotation.z = -.25;
      chibi.head.rotation.x = .12;
    }
  });
}

const composer = new EffectComposer(renderer);
const supportsSSR = matchMedia("(min-width: 1024px)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches;
const scenePass = supportsSSR ? new SSRPass({ renderer, scene, camera, width: innerWidth, height: innerHeight, groundReflector: null }) : new RenderPass(scene, camera);
if (supportsSSR) {
  scenePass.opacity = .24;
  scenePass.maxDistance = .82;
  scenePass.thickness = .028;
  scenePass.fresnel = true;
  scenePass.blur = true;
}
composer.addPass(scenePass);
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .3, .72, .8));
composer.addPass(new OutputPass());

const keys = { forward: false, backward: false, left: false, right: false };
const state = { location: "temple", velocity: new THREE.Vector3(), heading: Math.PI, praying: false, prayingOnFortune: false, prayTimer: 0, dancing: false, danceTimer: 0, incense: 0, hasIncense: false, carriedIncense: null, incenseRitual: null, bellTimer: 0, woodfishSession: false, woodfishTimer: 0, nextWoodfish: 0, woodfishMusicStarted: false, moveTarget: null, walkPhase: 0, clock: new THREE.Clock(), toastTimer: 0 };
const cameraControl = { yaw: 0, pitch: .25, radius: 7, targetYaw: 0, targetPitch: .25, targetRadius: 7, pointers: new Map(), lastDistance: 0, dragDistance: 0, downTime: 0 };
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(70, 50), new THREE.MeshBasicMaterial({ visible: false }));
groundPlane.rotation.x = -Math.PI / 2; groundPlane.position.set(0, 0, 4); scene.add(groundPlane);
const moveMarker = new THREE.Group();
const moveMarkerRing = new THREE.Mesh(new THREE.RingGeometry(.13, .21, 36), new THREE.MeshBasicMaterial({ color: "#ffd479", transparent: true, opacity: .78, side: THREE.DoubleSide }));
const moveMarkerDot = new THREE.Mesh(new THREE.CircleGeometry(.055, 24), new THREE.MeshBasicMaterial({ color: "#fff3cd", transparent: true, opacity: .82 }));
moveMarkerRing.rotation.x = moveMarkerDot.rotation.x = -Math.PI / 2;
moveMarker.add(moveMarkerRing, moveMarkerDot); moveMarker.visible = false; scene.add(moveMarker);
const smokePositions = new Float32Array(360 * 3).fill(-50);
const smokeGeometry = new THREE.BufferGeometry();
smokeGeometry.setAttribute("position", new THREE.BufferAttribute(smokePositions, 3));
const smoke = new THREE.Points(smokeGeometry, new THREE.PointsMaterial({ size: .16, transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending }));
smoke.frustumCulled = false; scene.add(smoke);
const smokeParticles = [], sticks = [];

function showToast(message) { toast.textContent = message; toast.classList.add("show"); state.toastTimer = 2.2; }
function nearAltar() { return Math.hypot(avatar.position.x, avatar.position.z + 2.45) < 1.25; }
function nearIncenseStand() { return Math.hypot(avatar.position.x - incensePickupPoint.x, avatar.position.z - incensePickupPoint.z) < 1.02; }
function onRitualMat(kind) { return ritualMats.some(mat => mat.kind === kind && avatar.position.distanceTo(mat.position) < .82); }
function onFortuneMat() { return onRitualMat("fortune") || onRitualMat("weather"); }
function nearBell() { return Math.hypot(avatar.position.x + 3.45, avatar.position.z - 8.05) < 1.28; }
function nearWoodfish() { return Math.hypot(avatar.position.x - 3, avatar.position.z + 4.10) < 1.22; }
function ensureRitualAudio() {
  if (!ambientAudio.context) ambientAudio.context = new (window.AudioContext || window.webkitAudioContext)();
  ambientAudio.context.resume();
  return ambientAudio.context;
}

function playBellSound() {
  const context = ensureRitualAudio(), now = context.currentTime;
  const master = context.createGain(); master.gain.setValueAtTime(.42, now); master.gain.exponentialRampToValueAtTime(.0005, now + 5.5); master.connect(context.destination);
  [[138.6, .90], [277.2, .38], [415.8, .16], [634.0, .07]].forEach(([frequency, gain], index) => {
    const oscillator = context.createOscillator(), oscillatorGain = context.createGain();
    oscillator.type = index === 0 ? "sine" : "triangle"; oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * .94, now + 5.1);
    oscillatorGain.gain.setValueAtTime(gain, now); oscillatorGain.gain.exponentialRampToValueAtTime(.0002, now + 5.2);
    oscillator.connect(oscillatorGain); oscillatorGain.connect(master); oscillator.start(now); oscillator.stop(now + 5.3);
  });
}

function playWoodfishSound() {
  const context = ensureRitualAudio(), now = context.currentTime;
  const hit = context.createGain(); hit.gain.setValueAtTime(.24, now); hit.gain.exponentialRampToValueAtTime(.0004, now + .22); hit.connect(context.destination);
  const oscillator = context.createOscillator(), second = context.createOscillator();
  oscillator.type = "sine"; oscillator.frequency.setValueAtTime(340, now); oscillator.frequency.exponentialRampToValueAtTime(168, now + .17);
  second.type = "triangle"; second.frequency.setValueAtTime(680, now); second.frequency.exponentialRampToValueAtTime(320, now + .13);
  const secondGain = context.createGain(); secondGain.gain.setValueAtTime(.18, now); secondGain.gain.exponentialRampToValueAtTime(.0002, now + .18);
  oscillator.connect(hit); second.connect(secondGain); secondGain.connect(hit);
  oscillator.start(now); second.start(now); oscillator.stop(now + .22); second.stop(now + .20);
}

function knockBell() {
  if (state.praying || state.incenseRitual || state.dancing || state.woodfishSession) return;
  state.bellTimer = 2.6; playBellSound(); network?.sendAction("bell"); showToast("钟声远送，心意安稳。");
}

function startWoodfish() {
  if (state.praying || state.incenseRitual || state.dancing || state.woodfishSession) return;
  state.woodfishSession = true; state.woodfishTimer = 0; state.nextWoodfish = .08; state.woodfishMusicStarted = !ambientAudio.playing;
  if (state.woodfishMusicStarted) toggleMusic();
  network?.sendAction("woodfish");
  showToast("木鱼声起，随节奏静心。");
}

function stopWoodfish() {
  state.woodfishSession = false; state.woodfishTimer = 0; state.nextWoodfish = 0;
  woodenFish.mallet.rotation.set(-.4, 0, -.65);
  if (state.woodfishMusicStarted && ambientAudio.playing) toggleMusic();
  state.woodfishMusicStarted = false; resetChibiPose();
}

function toggleWoodfish() {
  if (state.woodfishSession) { stopWoodfish(); return; }
  startWoodfish();
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

const zodiacs = [
  { name: "白羊座", glyph: "♈" }, { name: "金牛座", glyph: "♉" }, { name: "双子座", glyph: "♊" },
  { name: "巨蟹座", glyph: "♋" }, { name: "狮子座", glyph: "♌" }, { name: "处女座", glyph: "♍" },
  { name: "天秤座", glyph: "♎" }, { name: "天蝎座", glyph: "♏" }, { name: "射手座", glyph: "♐" },
  { name: "摩羯座", glyph: "♑" }, { name: "水瓶座", glyph: "♒" }, { name: "双鱼座", glyph: "♓" }
];

function getDailyFortune(zodiac) {
  const date = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
  const storageKey = `cloud-worship-fortune-v2-${zodiac}`;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (saved?.date === date && Number.isFinite(saved.overall)) return saved;
  } catch { localStorage.removeItem(storageKey); }

  let seed = 2166136261;
  for (const character of `cloud-temple-${date}-${zodiac}`) { seed ^= character.charCodeAt(0); seed = Math.imul(seed, 16777619); }
  const random = seededRandom(seed);
  const overall = 48 + Math.floor(random() * 51);
  const score = () => THREE.MathUtils.clamp(overall + Math.floor(random() * 25) - 12, 38, 99);
  const grade = overall >= 88 ? "大吉" : overall >= 76 ? "吉" : overall >= 62 ? "小吉" : overall >= 50 ? "平" : "宜静";
  const summaries = [
    "今天适合安静收束，少争一时之气。",
    "小步推进即可，稳定比冒进更有收获。",
    "机遇正在靠近，主动表达会带来转机。",
    "贵人缘不错，遇事多听一句建议。",
    "节奏偏慢，不必着急，先照顾好自己。"
  ];
  const doItems = ["静坐", "整理", "早睡", "散步", "读书", "还愿", "记账", "喝水", "复盘", "联系旧友"];
  const avoidItems = ["争执", "熬夜", "冲动消费", "过度承诺", "临时改计划", "翻旧账", "久坐不动", "贪凉", "空想", "比较"];
  const pick = items => [items[Math.floor(random() * items.length)], items[Math.floor(random() * items.length)]].filter((item, index, list) => list.indexOf(item) === index).slice(0, 2).join("、") || items[0];
  const fortune = {
    zodiac,
    date, grade, overall, summary: summaries[Math.floor(random() * summaries.length)],
    career: score(), wealth: score(), health: score(), social: score(),
    do: pick(doItems), avoid: pick(avoidItems)
  };
  try { localStorage.setItem(storageKey, JSON.stringify(fortune)); } catch {}
  return fortune;
}

function showDailyFortune() {
  const zodiac = state.selectedZodiac || "白羊座";
  const fortune = getDailyFortune(zodiac);
  document.getElementById("fortune-date").textContent = `${fortune.date} · ${fortune.grade}`;
  document.querySelector(".fortune-label").textContent = `${fortune.zodiac} · 今日运势`;
  document.getElementById("fortune-overall").textContent = fortune.overall;
  document.getElementById("fortune-summary").textContent = fortune.summary;
  document.getElementById("fortune-career").textContent = `${fortune.career} 分`;
  document.getElementById("fortune-wealth").textContent = `${fortune.wealth} 分`;
  document.getElementById("fortune-health").textContent = `${fortune.health} 分`;
  document.getElementById("fortune-social").textContent = `${fortune.social} 分`;
  document.getElementById("fortune-do").textContent = fortune.do;
  document.getElementById("fortune-avoid").textContent = fortune.avoid;
  fortunePanel.hidden = false;
}

function openZodiacPanel() {
  const grid = document.getElementById("zodiac-grid");
  if (!grid.childElementCount) {
    zodiacs.forEach(zodiac => {
      const button = document.createElement("button");
      button.type = "button"; button.innerHTML = `${zodiac.name}<span>${zodiac.glyph}</span>`;
      button.addEventListener("click", () => {
        state.selectedZodiac = zodiac.name; zodiacPanel.hidden = true; showDailyFortune();
      });
      grid.append(button);
    });
  }
  zodiacPanel.hidden = false;
}

const weatherCodes = {
  0: ["晴", "☀️"], 1: ["大致晴", "🌤️"], 2: ["局部多云", "⛅"], 3: ["阴", "☁️"],
  45: ["雾", "🌫️"], 48: ["雾凇", "🌫️"], 51: ["小毛雨", "🌦️"], 53: ["毛雨", "🌦️"], 55: ["大毛雨", "🌧️"],
  61: ["小雨", "🌦️"], 63: ["中雨", "🌧️"], 65: ["大雨", "🌧️"], 71: ["小雪", "🌨️"], 73: ["中雪", "🌨️"], 75: ["大雪", "❄️"],
  80: ["阵雨", "🌦️"], 81: ["较强阵雨", "🌧️"], 82: ["强阵雨", "⛈️"], 95: ["雷阵雨", "⛈️"], 96: ["雷雨伴冰雹", "⛈️"], 99: ["强雷雨伴冰雹", "⛈️"]
};

function fallbackWeather() {
  const random = seededRandom(Number(new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" }).replaceAll("-", "")));
  const codes = [0, 1, 2, 3, 61, 80];
  return { daily: { time: [...Array(4)].map((_, index) => { const day = new Date(); day.setDate(day.getDate() + index); return day.toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" }); }), weather_code: codes.map(() => codes[Math.floor(random() * codes.length)]), temperature_2m_max: [...Array(4)].map(() => Math.round(14 + random() * 11)), temperature_2m_min: [...Array(4)].map(() => Math.round(7 + random() * 7)), precipitation_probability_max: [...Array(4)].map(() => Math.round(random() * 82)) } };
}

async function fetchWeatherSource(url, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const daily = data?.daily;
    if (!Array.isArray(daily?.time) || daily.time.length < 4) throw new Error("天气数据结构不完整");
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function showWeather() {
  const grid = document.getElementById("weather-grid");
  const note = document.getElementById("weather-note");
  grid.innerHTML = `<div class="weather-loading">正在读取未来三天天气…</div>`;
  note.textContent = "正在连接天气服务…";
  weatherPanel.hidden = false;
  const openMeteoUrl = "https://api.open-meteo.com/v1/forecast?latitude=30.2741&longitude=120.1551&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FShanghai&forecast_days=4";
  const weatherSources = [
    { url: openMeteoUrl, label: "Open-Meteo" },
    { url: `https://corsproxy.io/?url=${encodeURIComponent(openMeteoUrl)}`, label: "Open-Meteo · 代理" },
    { url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(openMeteoUrl)}`, label: "Open-Meteo · 备用" },
    { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(openMeteoUrl)}`, label: "Open-Meteo · 备用" }
  ];
  let weather = fallbackWeather();
  let loaded = false;
  for (const source of weatherSources) {
    try {
      weather = await fetchWeatherSource(source.url);
      note.textContent = `实时数据 · ${source.label}`;
      loaded = true;
      break;
    } catch {}
  }
  if (!loaded) note.textContent = "实时接口暂不可用，已显示杭州地区估算结果。";
  document.getElementById("weather-date").textContent = "今日 + 未来三天";
  grid.innerHTML = weather.daily.time.slice(0, 4).map((date, index) => {
    const code = weatherCodes[weather.daily.weather_code[index]] || ["天气", "🌤️"];
    const day = new Date(`${date}T00:00:00`);
    const label = index === 0 ? "今天" : index === 1 ? "明天" : index === 2 ? "后天" : "大后天";
    return `<div class="weather-day"><strong>${label}</strong><div class="weather-icon">${code[1]}</div><div class="weather-detail">${code[0]}<br>降水概率 ${weather.daily.precipitation_probability_max?.[index] ?? 0}%</div><div class="weather-temp">${Math.round(weather.daily.temperature_2m_min?.[index] ?? 0)}° / ${Math.round(weather.daily.temperature_2m_max?.[index] ?? 0)}°</div></div>`;
  }).join("");
}

function lightIncense() {
  if (state.incense >= incenseCapacity) return showToast("香炉已满，静待清香燃尽。");
  if (state.praying || state.incenseRitual || state.dancing) return;
  if (!state.hasIncense) return showToast("先到入口取香点，拿取一支香。");
  if (!nearAltar()) return showToast("先走到香炉前，再点击上香。");
  const spot = incenseInsertPositions[state.incense], offset = spot.x, depth = spot.z;
  state.heading = Math.PI; avatar.rotation.y = Math.PI;
  state.carriedIncense.position.set(.015, .01, .045);
  state.carriedIncense.rotation.set(-.42, 0, offset * .4);
  state.incenseRitual = { timer: 0, offset, depth, heldIncense: state.carriedIncense, inserted: false, ember: state.carriedIncense.children[1], seed: Math.random() * 9 };
  incenseButton.disabled = true;
  network?.sendAction("incense");
  showToast("清香已上，愿心中安宁。");
}

function takeIncense() {
  if (state.praying || state.incenseRitual || state.dancing) return;
  if (state.incense >= incenseCapacity) return showToast("香炉已满，静待清香燃尽。");
  if (state.hasIncense) return showToast("手中已经有香，先去香炉上香。");
  if (!nearIncenseStand()) return showToast("走到入口旁的取香点，即可取香。");
  const heldIncense = new THREE.Group();
  const woodStick = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .44, 8), new THREE.MeshStandardMaterial({ color: "#4a2d1d" }));
  woodStick.position.y = .22;
  const ember = new THREE.Mesh(new THREE.SphereGeometry(.016, 10, 8), new THREE.MeshStandardMaterial({ color: "#ff8135", emissive: "#ff5d10", emissiveIntensity: 5 }));
  ember.position.y = .45;
  heldIncense.add(woodStick, ember);
  heldIncense.position.set(.015, .01, .045); heldIncense.rotation.x = -.42;
  rightArm.hand.add(heldIncense);
  incenseTraySticks[state.incense].visible = false;
  state.hasIncense = true; state.carriedIncense = heldIncense;
  showToast("已取香，走到香炉前上香。");
}

function finishIncenseRitual() {
  const ritual = state.incenseRitual;
  rightArm.hand.remove(ritual.heldIncense);
  ritual.heldIncense.rotation.set(0, 0, ritual.offset * .4);
  scene.add(ritual.heldIncense);
  ritual.heldIncense.position.set(ritual.offset, .52, -2.45 + ritual.depth);
  sticks.push({ ember: ritual.ember, tip: new THREE.Vector3(ritual.offset, .97, -2.45 + ritual.depth), seed: ritual.seed });
  state.incense++;
  state.hasIncense = false; state.carriedIncense = null;
}

function updateIncenseControls() {
  const busy = state.praying || state.incenseRitual || state.dancing;
  const pickupVisible = !busy && state.hasIncense === false && state.incense < incenseCapacity && nearIncenseStand();
  const incenseVisible = !busy && state.hasIncense && nearAltar();
  const prayVisible = !busy && fortunePanel.hidden && onFortuneMat();
  const bellVisible = !busy && nearBell();
  const woodfishVisible = !state.praying && !state.incenseRitual && !state.dancing && nearWoodfish();
  woodfishButton.textContent = state.woodfishSession ? "停止" : "敲木鱼";
  contextualButton(bellButton, bellVisible);
  contextualButton(woodfishButton, woodfishVisible);
  contextualButton(pickupButton, pickupVisible);
  contextualButton(incenseButton, incenseVisible);
  contextualButton(prayButton, prayVisible);
}

function contextualButton(button, visible) {
  button.disabled = !visible;
  button.classList.toggle("context-hidden", !visible);
  button.classList.toggle("context-active", visible);
}

function pray() {
  if (state.praying || state.incenseRitual || state.dancing || state.woodfishSession || !fortunePanel.hidden || !zodiacPanel.hidden || !weatherPanel.hidden) return;
  state.praying = true;
  state.prayingOnFortune = onRitualMat("fortune") ? "fortune" : onRitualMat("weather") ? "weather" : false;
  state.prayTimer = 0; prayButton.disabled = true;
  playActionAudio(actionAudio.pray);
  network?.sendAction("pray");
  if (state.prayingOnFortune === "fortune") showToast("跪拜中，请准备选择星座。");
  else if (state.prayingOnFortune === "weather") showToast("跪拜中，天气即将显现。");
  const ritualKind = state.prayingOnFortune;
  if (ritualKind === "fortune") { state.prayingOnFortune = false; openZodiacPanel(); }
  else if (ritualKind === "weather") { state.prayingOnFortune = false; showWeather(); }
}

function stopActionAudio() {
  Object.values(actionAudio).forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}
function playActionAudio(audio) {
  stopActionAudio();
  audio.currentTime = 0;
  audio.play().catch(() => showToast("音频加载失败或浏览器暂时阻止了播放。"));
}
function performTrick() {
  if (state.praying || state.incenseRitual || state.dancing || state.hasIncense || state.woodfishSession || !fortunePanel.hidden || !zodiacPanel.hidden || !weatherPanel.hidden) return;
  basketball.visible = false;
  avatar.add(head);
  head.position.set(.10, .68, .10);
  head.rotation.set(.28, .35, .12);
  head.scale.setScalar(.92);
  state.dancing = true; state.danceTimer = 0; danceButton.disabled = true;
  playActionAudio(actionAudio.trick);
  network?.sendAction("dance");
  showToast("小鸡炫技登场！");
}

function resetChibiPose() {
  [leftArm.shoulder, rightArm.shoulder].forEach(joint => { joint.rotation.set(0, 0, 0); });
  [leftLeg.hip, rightLeg.hip, leftLeg.knee, rightLeg.knee].forEach(joint => { joint.rotation.set(0, 0, 0); });
  head.rotation.set(0, 0, 0); figure.position.set(0, 0, 0); figure.rotation.set(0, 0, 0);
}

function restoreHeadFromHand() {
  if (head.parent !== figure) {
    head.parent?.remove(head);
    figure.add(head);
  }
  head.position.set(0, 1.13, 0);
  head.rotation.set(0, 0, 0);
  head.scale.setScalar(1);
}

function easeInOut(progress) {
  const value = THREE.MathUtils.clamp(progress, 0, 1);
  return value < .5 ? 4 * value * value * value : 1 - (-2 * value + 2) ** 3 / 2;
}

function setChibiPose(settle, torsoBow, headBow, handsTogether, breath) {
  const settleEase = easeInOut(settle);
  const sideSway = Math.sin(settle * 2.2) * .028 * (1 - settle);
  leftLeg.hip.rotation.x = (-1.18 * settleEase) + sideSway;
  rightLeg.hip.rotation.x = (-1.30 * settleEase) - sideSway;
  leftLeg.knee.rotation.x = 2.36 * settleEase;
  rightLeg.knee.rotation.x = 2.56 * settleEase;
  figure.position.y = -.252 * settleEase + .008 * Math.sin(settleEase * Math.PI);
  figure.position.z = .048 * easeInOut(torsoBow) + .024 * settleEase;
  figure.rotation.x = .78 * easeInOut(torsoBow) + .05 * settleEase;
  figure.rotation.z = sideSway * .72;
  head.rotation.x = .14 * easeInOut(torsoBow) + .68 * easeInOut(headBow) - .028 * breath;
  const armReach = -(.34 * settleEase + .82 * easeInOut(torsoBow) + .48 * easeInOut(headBow));
  leftArm.shoulder.rotation.x = rightArm.shoulder.rotation.x = armReach;
  const bringTogether = easeInOut(handsTogether) * (.48 + breath * .085);
  leftArm.shoulder.rotation.z = bringTogether;
  rightArm.shoulder.rotation.z = -bringTogether;
}

function updateAvatar(delta) {
  const inputX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const inputY = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);
  if ((inputX || inputY) && state.moveTarget) { state.moveTarget = null; moveMarker.visible = false; }
  basketball.visible = !state.praying && !state.incenseRitual && !state.hasIncense && !state.dancing;
  if (state.dancing) {
    state.danceTimer += delta; const time = state.danceTimer, beat = time * 3.2;
    const intro = THREE.MathUtils.smoothstep(time, .05, .42);
    const outro = 1 - THREE.MathUtils.smoothstep(time, 8.38, 8.98);
    const groove = intro * outro;
    const firstSpin = THREE.MathUtils.smoothstep(time, 2.08, 2.72) * (1 - THREE.MathUtils.smoothstep(time, 2.82, 3.38));
    const secondSpin = THREE.MathUtils.smoothstep(time, 3.62, 4.28) * (1 - THREE.MathUtils.smoothstep(time, 4.38, 4.92));
    const carryHead = THREE.MathUtils.smoothstep(time, .10, .68) * (1 - THREE.MathUtils.smoothstep(time, 4.92, 5.24));
    const dribble = THREE.MathUtils.smoothstep(time, 5.18, 5.52) * (1 - THREE.MathUtils.smoothstep(time, 7.08, 7.38));
    const crossover = THREE.MathUtils.smoothstep(time, 5.24, 5.62) * (1 - THREE.MathUtils.smoothstep(time, 6.88, 7.18));
    const shoulderShake = THREE.MathUtils.smoothstep(time, 7.26, 7.68) * (1 - THREE.MathUtils.smoothstep(time, 8.04, 8.48));
    const headReturn = THREE.MathUtils.smoothstep(time, 8.06, 8.78);
    const finishPose = THREE.MathUtils.smoothstep(time, 8.28, 8.86);
    const pulse = Math.abs(Math.sin(beat));
    const sway = Math.sin(beat * .5) * groove;
    const dribblePhase = time * 6.4;
    const dribbleBounce = Math.abs(Math.sin(dribblePhase));
    const groundImpact = Math.max(0, 1 - dribbleBounce * 2.6);
    figure.position.y = (.035 * pulse + .022 * finishPose) * groove - .05 * groundImpact * dribble;
    figure.position.x = .095 * sway;
    figure.rotation.x = .085 * Math.sin(beat * .5) * groove + .12 * finishPose;
    figure.rotation.z = .17 * sway;
    figure.rotation.y = Math.sin(Math.PI * (firstSpin + secondSpin)) * 1.85;
    leftLeg.hip.rotation.x = (-.18 - .13 * pulse) * groove;
    rightLeg.hip.rotation.x = (-.18 + .13 * pulse) * groove;
    leftLeg.knee.rotation.x = (.24 + .18 * pulse) * groove;
    rightLeg.knee.rotation.x = (.24 - .18 * pulse) * groove;
    leftLeg.knee.rotation.x += .30 * groundImpact * dribble;
    rightLeg.knee.rotation.x += .30 * groundImpact * dribble;
    leftArm.shoulder.rotation.x = -1.48 * carryHead - (.55 + .28 * Math.sin(beat)) * groove - .12 * dribble - 1.32 * finishPose + .72 * dribble * Math.max(0, Math.sin(dribblePhase));
    leftArm.shoulder.rotation.z = (.52 + .16 * Math.sin(beat)) * groove + .08 + .18 * shoulderShake * Math.sin(beat * 3.2) + .36 * carryHead + .18 * dribble;
    rightArm.shoulder.rotation.x = -1.48 * carryHead - (.35 + .34 * Math.cos(beat)) * groove - .85 * dribble * Math.abs(Math.sin(beat * 2)) - 1.16 * finishPose + .72 * dribble * Math.max(0, -Math.sin(dribblePhase));
    rightArm.shoulder.rotation.z = -(.48 + .18 * Math.cos(beat)) * groove - .08 - .22 * shoulderShake * Math.sin(beat * 3.2) - .36 * carryHead - .18 * dribble;
    figure.rotation.x += .07 * shoulderShake * Math.sin(beat * 3.2);
    const crossoverSide = Math.sin(dribblePhase * .5) * crossover;
    const holdY = .66 + Math.sin(time * 2.2) * .035;
    const bounceY = .235 + .62 * dribbleBounce * dribble;
    head.position.x = (.10 + crossoverSide * .21) * (1 - headReturn) - .052 * carryHead * (1 - dribble);
    head.position.z = (.10 + Math.sin(time * 3.1) * .018) * (1 - headReturn) + .035 * carryHead;
    const idleY = .80 * (1 - carryHead) * (1 - dribble);
    const carriedY = holdY * carryHead * (1 - dribble);
    const bouncedY = bounceY * dribble;
    head.position.y = (idleY + carriedY + bouncedY) * (1 - headReturn) + 1.13 * headReturn;
    head.rotation.x += delta * (dribble > .2 ? 10 : 4);
    head.rotation.z += delta * (dribble > .2 ? 7 : 3);
    head.scale.set(.92 * (1 + .17 * groundImpact * dribble), .92 * (1 - .38 * groundImpact * dribble), .92 * (1 + .17 * groundImpact * dribble));
    if (time >= 9.04) {
      state.dancing = false; state.danceTimer = 0; danceButton.disabled = false;
      stopActionAudio();
      resetChibiPose(); basketball.position.set(-.062, -.015, .072);
      restoreHeadFromHand(); basketball.visible = true;
      showToast("头弹回来了，炫技完成。");
    }
    return;
  }
  if (state.woodfishSession) {
    state.woodfishTimer += delta;
    if (state.woodfishTimer >= state.nextWoodfish) {
      state.nextWoodfish = state.woodfishTimer + .58;
      playWoodfishSound();
    }
    const strike = Math.max(0, Math.sin(state.woodfishTimer * 10.8));
    woodenFish.mallet.rotation.z = -.65 + .52 * strike;
    woodenFish.mallet.rotation.x = -.4 - .14 * strike;
    leftArm.shoulder.rotation.x = -.36 + .04 * Math.sin(state.woodfishTimer * 2.1);
    leftArm.shoulder.rotation.z = .34;
    rightArm.shoulder.rotation.x = -.74 + .28 * strike;
    rightArm.shoulder.rotation.z = -.38 - .10 * strike;
    figure.position.y = .008 * Math.sin(state.woodfishTimer * 2.4);
    head.rotation.x = .04 + .025 * Math.sin(state.woodfishTimer * 1.8);
    if (state.woodfishTimer >= 18) stopWoodfish();
    return;
  }
  if (state.incenseRitual) {
    const ritual = state.incenseRitual; ritual.timer += delta;
    const time = ritual.timer;
    const gather = THREE.MathUtils.smoothstep(time, .12, .82) * (1 - THREE.MathUtils.smoothstep(time, 1.86, 2.16));
    const raise = THREE.MathUtils.smoothstep(time, .96, 1.68) * (1 - THREE.MathUtils.smoothstep(time, 2.52, 2.82));
    const place = THREE.MathUtils.smoothstep(time, 2.68, 3.26) * (1 - THREE.MathUtils.smoothstep(time, 3.56, 3.94));
    const offeringBow = THREE.MathUtils.smoothstep(time, 3.82, 4.54) * (1 - THREE.MathUtils.smoothstep(time, 5.52, 6.08));
    const breath = Math.sin(time * 1.8) * .035;
    leftArm.shoulder.rotation.x = -(.68 * gather + 1.52 * raise + .42 * place + .58 * offeringBow);
    leftArm.shoulder.rotation.z = .18 + .58 * gather + .24 * raise + .34 * place + .38 * offeringBow;
    rightArm.shoulder.rotation.x = -(.68 * gather + 1.68 * raise + 1.18 * place + .58 * offeringBow);
    rightArm.shoulder.rotation.z = -(.18 + .58 * gather + .24 * raise + .16 * place + .38 * offeringBow);
    figure.position.y = -.035 * place - .08 * offeringBow;
    figure.rotation.x = .34 * place + .62 * offeringBow;
    head.rotation.x = .08 * gather + .12 * raise - .18 * place + .52 * offeringBow - .012 * breath;
    if (time >= 2.72 && !ritual.inserted) { ritual.inserted = true; finishIncenseRitual(); }
    if (time >= 6.24) { state.incenseRitual = null; resetChibiPose(); showToast("清香已上，愿心中安宁。"); }
    return;
  }
  if (state.praying) {
    state.prayTimer += delta; const time = state.prayTimer;
    const settle = THREE.MathUtils.smoothstep(time, .06, .34) * (1 - THREE.MathUtils.smoothstep(time, 1.52, 1.86));
    const torsoBow = THREE.MathUtils.smoothstep(time, .18, .42) * (1 - THREE.MathUtils.smoothstep(time, 1.62, 1.92));
    const firstBow = THREE.MathUtils.smoothstep(time, .42, .68) * (1 - THREE.MathUtils.smoothstep(time, .78, .94));
    const secondBow = THREE.MathUtils.smoothstep(time, .98, 1.24) * (1 - THREE.MathUtils.smoothstep(time, 1.38, 1.54));
    const headBow = Math.max(firstBow > 0 ? firstBow * .94 : 0, secondBow);
    const handsTogether = THREE.MathUtils.smoothstep(time, .72, 1.28) * (1 - THREE.MathUtils.smoothstep(time, 6.18, 6.62));
    const breath = handsTogether > 0 ? Math.sin(time * 1.65) * .5 + .5 : 0;
    setChibiPose(settle, torsoBow, headBow, handsTogether, breath);
    if (time >= 7.44) {
      state.praying = false; state.prayTimer = 0; prayButton.disabled = false;
      stopActionAudio();
      resetChibiPose();
      showToast("跪拜已毕，愿平安顺遂。");
    }
    return;
  }

  const forward = new THREE.Vector3(-Math.sin(cameraControl.yaw), 0, -Math.cos(cameraControl.yaw));
  const right = new THREE.Vector3(Math.cos(cameraControl.yaw), 0, -Math.sin(cameraControl.yaw));
  let direction;
  if (state.moveTarget && !inputX && !inputY) {
    const targetX = state.moveTarget.x - avatar.position.x, targetZ = state.moveTarget.z - avatar.position.z;
    const targetDistance = Math.hypot(targetX, targetZ);
    if (targetDistance < .18) {
      state.moveTarget = null; moveMarker.visible = false;
    } else {
      direction = new THREE.Vector3(targetX / targetDistance, 0, targetZ / targetDistance);
      state.heading = Math.atan2(direction.x, direction.z); avatar.rotation.y = state.heading;
      state.walkPhase += delta * 9;
    }
  }
  if (!direction) direction = forward.multiplyScalar(inputY).add(right.multiplyScalar(inputX));
  const speed = direction.lengthSq() ? 2 : 0;
  if (direction.lengthSq()) { direction.normalize(); state.heading = Math.atan2(direction.x, direction.z); avatar.rotation.y = state.heading; state.walkPhase += delta * 9; }
  state.velocity.lerp(direction.multiplyScalar(speed), 1 - Math.exp(-12 * delta));
  const nextX = avatar.position.x + state.velocity.x * delta, nextZ = avatar.position.z + state.velocity.z * delta;
  const blocked = colliders.some(({ x, z, radius }) => (nextX - x) ** 2 + (nextZ - z) ** 2 < (radius + .22) ** 2);
  if (!blocked) { avatar.position.x = nextX; avatar.position.z = nextZ; }
  else {
    state.velocity.multiplyScalar(.08);
    if (state.moveTarget) { state.moveTarget = null; moveMarker.visible = false; }
  }
  const outdoor = avatar.position.z > 7.5;
  avatar.position.x = THREE.MathUtils.clamp(avatar.position.x, outdoor ? -9.7 : -5.3, outdoor ? 9.7 : 5.3);
  avatar.position.z = THREE.MathUtils.clamp(avatar.position.z, -3.3, 15.3);
  avatar.position.y = groundLevel(avatar.position.z);
  const swing = Math.sin(state.walkPhase) * Math.min(1, state.velocity.length() / 2);
  leftLeg.hip.rotation.x = swing * .62; rightLeg.hip.rotation.x = -swing * .62;
  leftLeg.knee.rotation.x = Math.max(0, -swing) * .78; rightLeg.knee.rotation.x = Math.max(0, swing) * .78;
  leftArm.shoulder.rotation.x = -swing * .48; rightArm.shoulder.rotation.x = swing * .48;
  head.rotation.x = Math.sin(state.walkPhase * .5) * .025;
  figure.position.y = .13 + Math.abs(Math.sin(state.walkPhase)) * .025; figure.rotation.x = 0;
}

function updateCamera(delta) {
  cameraControl.yaw += (cameraControl.targetYaw - cameraControl.yaw) * Math.min(1, delta * 7);
  cameraControl.pitch += (cameraControl.targetPitch - cameraControl.pitch) * Math.min(1, delta * 7);
  cameraControl.radius += (cameraControl.targetRadius - cameraControl.radius) * Math.min(1, delta * 7);
  const pitch = THREE.MathUtils.clamp(cameraControl.pitch, .04, .82), radius = THREE.MathUtils.clamp(cameraControl.radius, 2.6, 7);
  const eyeHeight = avatar.position.y + .98;
  camera.position.set(avatar.position.x + Math.sin(cameraControl.yaw) * Math.cos(pitch) * radius, eyeHeight + Math.sin(pitch) * radius, avatar.position.z + Math.cos(cameraControl.yaw) * Math.cos(pitch) * radius);
  camera.lookAt(avatar.position.x, avatar.position.y + .74, avatar.position.z);
}

function updateEffects(delta, elapsed) {
  flames.forEach(({ flame, light, seed }) => { const scale = 1 + Math.sin(elapsed * 11 + seed) * .08; flame.scale.setScalar(scale); if (light) light.intensity = 3 * scale; });
  if (state.bellTimer > 0) {
    state.bellTimer -= delta;
    const ringTime = 2.6 - state.bellTimer;
    bell.body.rotation.z = Math.sin(ringTime * 12) * .20 * Math.exp(-ringTime * 1.05);
    bell.body.rotation.x = Math.sin(ringTime * 9.4 + .6) * .05 * Math.exp(-ringTime * 1.15);
  } else { bell.body.rotation.set(0, 0, 0); }
  windGroups.forEach(({ object, kind, seed, amplitude }) => {
    const breeze = Math.sin(elapsed * .72 + seed * 2.1) + Math.sin(elapsed * 1.23 + seed) * .48;
    const flutter = Math.sin(elapsed * 2.4 + seed * 3.7) * .35;
    if (kind === "tree") {
      object.rotation.z = breeze * amplitude;
      object.rotation.x = flutter * amplitude * .54;
    } else if (kind === "lantern") {
      object.rotation.z = breeze * amplitude;
      object.rotation.x = flutter * amplitude * .72;
    } else if (kind === "banner") {
      object.rotation.z = breeze * amplitude;
      object.rotation.x = .015 + flutter * amplitude * .30;
    }
  });
  for (let index = 0; index < petalParticles.length; index++) {
    const particle = petalParticles[index], source = petalSources[particle.sourceIndex];
    particle.age += delta;
    if (particle.age >= particle.life || particle.y < groundLevel(particle.z) + .015) {
      particle.age = 0; particle.life = 7.5 + Math.random() * 5;
      particle.x = source[0] + (Math.random() - .5) * 2.2;
      particle.y = 2.0 + Math.random() * 1.9;
      particle.z = source[1] + (Math.random() - .5) * 2.2;
      particle.seed = Math.random() * 9;
    }
    particle.x += Math.sin(elapsed * .82 + particle.seed) * delta * .48;
    particle.y -= delta * (.22 + (particle.seed % .4));
    particle.z += Math.cos(elapsed * .63 + particle.seed * 1.7) * delta * .36;
    petalPositions[index * 3] = particle.x;
    petalPositions[index * 3 + 1] = particle.y;
    petalPositions[index * 3 + 2] = particle.z;
  }
  petalGeometry.attributes.position.needsUpdate = true;
  petalGeometry.setDrawRange(0, petalParticles.length);
  for (let index = 0; index < dustCount; index++) {
    const seed = index * .137;
    dustPositions[index * 3] += Math.sin(elapsed * .28 + seed) * delta * .055;
    dustPositions[index * 3 + 1] += Math.sin(elapsed * .44 + seed * 2.3) * delta * .035;
    dustPositions[index * 3 + 2] += Math.cos(elapsed * .23 + seed * 1.8) * delta * .045;
  }
  dustGeometry.attributes.position.needsUpdate = true;
  koi.forEach(({ fish, seed }, index) => {
    const angle = elapsed * .24 + seed, radius = .68 + (index % 3) * .20;
    fish.position.x = -7.8 + Math.cos(angle) * radius;
    fish.position.z = 12.2 + Math.sin(angle) * (radius * .84);
    fish.rotation.y = -Math.atan2(Math.cos(angle), -Math.sin(angle));
    fish.rotation.z = .08 * Math.sin(elapsed * 3.6 + seed);
  });
  sticks.forEach(({ ember, tip, seed }) => {
    ember.material.emissiveIntensity = 4.5 + Math.sin(elapsed * 9 + seed) * 1.3;
    if (smokeParticles.length < 350 && Math.random() < delta * 24) smokeParticles.push({ position: tip.clone(), age: 0, life: 1.8 + Math.random() * 1.2, seed: Math.random() * 8 });
  });
  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    const particle = smokeParticles[i]; particle.age += delta;
    if (particle.age >= particle.life) { smokeParticles.splice(i, 1); continue; }
    particle.position.x += Math.sin(elapsed * 1.6 + particle.seed) * delta * .1;
    particle.position.y += delta * (.25 + particle.seed * .04);
    particle.position.z += Math.cos(elapsed * 1.2 + particle.seed) * delta * .08;
    smokePositions[i * 3] = particle.position.x; smokePositions[i * 3 + 1] = particle.position.y; smokePositions[i * 3 + 2] = particle.position.z;
  }
  smokeGeometry.attributes.position.needsUpdate = true;
  smokeGeometry.setDrawRange(0, smokeParticles.length);
}

function resize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false); composer.setSize(innerWidth, innerHeight);
}

const defaultCameraView = { yaw: 0, pitch: .25, radius: 7 };
const closeCameraView = { yaw: 0, pitch: .30, radius: 5 };
function resetCamera() {
  const atDefaultView = Math.abs(cameraControl.targetYaw - defaultCameraView.yaw) < .01
    && Math.abs(cameraControl.targetPitch - defaultCameraView.pitch) < .01
    && Math.abs(cameraControl.targetRadius - defaultCameraView.radius) < .01;
  const view = atDefaultView ? closeCameraView : defaultCameraView;
  cameraControl.targetYaw = view.yaw;
  cameraControl.targetPitch = view.pitch;
  cameraControl.targetRadius = view.radius;
  showToast(atDefaultView ? "已切换到近景视角" : "已回到默认视角");
}

const ambientAudio = { context: null, master: null, playing: false, timer: 0 };
function playAmbientNote(context, master) {
  const notes = [293.66, 329.63, 392, 440, 523.25, 587.33];
  const frequency = notes[Math.floor(Math.random() * notes.length)];
  const now = context.currentTime + .04, duration = 2.6 + Math.random() * 1.8;
  const gain = context.createGain(), filter = context.createBiquadFilter(), first = context.createOscillator(), second = context.createOscillator();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(.062 + Math.random() * .022, now + .16);
  gain.gain.exponentialRampToValueAtTime(.0008, now + duration);
  filter.type = "lowpass"; filter.frequency.value = 2100; filter.Q.value = .4;
  first.type = "triangle"; first.frequency.value = frequency;
  second.type = "sine"; second.frequency.value = frequency * 2.005;
  const overtoneGain = context.createGain(); overtoneGain.gain.value = .18;
  first.connect(gain); second.connect(overtoneGain); overtoneGain.connect(gain); gain.connect(filter); filter.connect(master);
  first.start(now); second.start(now); first.stop(now + duration); second.stop(now + duration);
  ambientAudio.timer = setTimeout(() => { if (ambientAudio.playing) playAmbientNote(context, master); }, 1100 + Math.random() * 2400);
}

function toggleMusic() {
  if (!ambientAudio.context) ambientAudio.context = new (window.AudioContext || window.webkitAudioContext)();
  const context = ambientAudio.context;
  if (ambientAudio.playing) {
    ambientAudio.playing = false; clearTimeout(ambientAudio.timer);
    context.suspend(); musicButton.classList.remove("playing"); musicButton.textContent = "🎵 音乐";
    return;
  }
  context.resume();
  if (!ambientAudio.master) {
    const master = context.createGain(); master.gain.value = .78; master.connect(context.destination); ambientAudio.master = master;
    const droneGain = context.createGain(); droneGain.gain.value = .05; droneGain.connect(master);
    [73.42, 110, 146.83].forEach((frequency, index) => {
      const oscillator = context.createOscillator(), oscillatorGain = context.createGain();
      oscillator.type = index === 2 ? "sine" : "triangle"; oscillator.frequency.value = frequency;
      oscillatorGain.gain.value = index === 0 ? .8 : index === 1 ? .35 : .16;
      oscillator.connect(oscillatorGain); oscillatorGain.connect(droneGain); oscillator.start();
    });
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate), channel = noiseBuffer.getChannelData(0);
    let lastValue = 0;
    for (let index = 0; index < channel.length; index++) { const white = Math.random() * 2 - 1; lastValue = (lastValue + .028 * white) / 1.028; channel[index] = lastValue * 3.4; }
    const wind = context.createBufferSource(); wind.buffer = noiseBuffer; wind.loop = true;
    const windFilter = context.createBiquadFilter(); windFilter.type = "bandpass"; windFilter.frequency.value = 580; windFilter.Q.value = .6;
    const windGain = context.createGain(); windGain.gain.value = .038;
    wind.connect(windFilter); windFilter.connect(windGain); windGain.connect(master); wind.start();
  }
  ambientAudio.playing = true; context.resume(); playAmbientNote(context, ambientAudio.master);
  musicButton.classList.add("playing"); musicButton.textContent = "🎵 播放中";
}

const keyMap = { KeyW: "forward", ArrowUp: "forward", KeyS: "backward", ArrowDown: "backward", KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right" };
addEventListener("keydown", event => { if (keyMap[event.code]) keys[keyMap[event.code]] = true; if (event.code === "KeyJ") pray(); if (event.code === "KeyK") lightIncense(); if (event.code === "KeyG") performTrick(); if (event.code === "Escape") fortunePanel.hidden = true; });
addEventListener("keyup", event => { if (keyMap[event.code]) keys[keyMap[event.code]] = false; });
document.querySelectorAll(".pad-button").forEach(button => {
  const direction = button.dataset.direction;
  button.addEventListener("pointerdown", event => { event.preventDefault(); keys[direction] = true; button.setPointerCapture(event.pointerId); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(type => button.addEventListener(type, () => keys[direction] = false));
});
canvas.addEventListener("pointerdown", event => {
  cameraControl.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); canvas.setPointerCapture(event.pointerId);
  cameraControl.dragDistance = 0; cameraControl.downTime = performance.now();
  if (cameraControl.pointers.size === 2) { const [a, b] = [...cameraControl.pointers.values()]; cameraControl.lastDistance = Math.hypot(a.x - b.x, a.y - b.y); }
});
canvas.addEventListener("pointermove", event => {
  if (!cameraControl.pointers.has(event.pointerId)) return;
  const previous = cameraControl.pointers.get(event.pointerId); cameraControl.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  cameraControl.dragDistance += Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
  if (cameraControl.pointers.size === 1) { cameraControl.targetYaw -= (event.clientX - previous.x) * .0065; cameraControl.targetPitch += (event.clientY - previous.y) * .004; }
  else if (cameraControl.pointers.size === 2) {
    const [a, b] = [...cameraControl.pointers.values()]; const distance = Math.hypot(a.x - b.x, a.y - b.y);
    if (cameraControl.lastDistance) cameraControl.targetRadius = THREE.MathUtils.clamp(cameraControl.targetRadius - (distance - cameraControl.lastDistance) * .02, 2.6, 7);
    cameraControl.lastDistance = distance;
  }
});
function moveToPoint(clientX, clientY) {
  if (state.praying || state.incenseRitual || state.dancing || state.woodfishSession) return;
  const rect = canvas.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  ), camera);
  const [hit] = raycaster.intersectObject(groundPlane);
  if (!hit) return;
  const outdoor = hit.point.z > 7.5;
  const target = hit.point.clone();
  target.x = THREE.MathUtils.clamp(target.x, outdoor ? -9.7 : -5.3, outdoor ? 9.7 : 5.3);
  target.z = THREE.MathUtils.clamp(target.z, -3.3, 15.3);
  state.moveTarget = { x: target.x, z: target.z };
  moveMarker.position.set(target.x, groundLevel(target.z) + .025, target.z);
  moveMarker.visible = true;
}
["pointerup", "pointercancel"].forEach(type => canvas.addEventListener(type, event => {
  const activePointers = cameraControl.pointers.size;
  if (type === "pointerup" && activePointers === 1 && cameraControl.dragDistance < 12 && performance.now() - cameraControl.downTime < 650) moveToPoint(event.clientX, event.clientY);
  cameraControl.pointers.delete(event.pointerId); cameraControl.lastDistance = 0;
}));
canvas.addEventListener("wheel", event => { event.preventDefault(); cameraControl.targetRadius = THREE.MathUtils.clamp(cameraControl.targetRadius + event.deltaY * .004, 2.6, 7); }, { passive: false });
canvas.addEventListener("contextmenu", event => event.preventDefault());
prayButton.addEventListener("click", pray); pickupButton.addEventListener("click", takeIncense); incenseButton.addEventListener("click", lightIncense); danceButton.addEventListener("click", performTrick); bellButton.addEventListener("click", knockBell); woodfishButton.addEventListener("click", toggleWoodfish); musicButton.addEventListener("click", toggleMusic);
fortuneClose.addEventListener("click", () => fortunePanel.hidden = true);
document.getElementById("weather-close").addEventListener("click", () => weatherPanel.hidden = true);
document.getElementById("view-reset").addEventListener("click", resetCamera);
function setNetworkStatus({ state, message, online }) {
  if (networkStatus) {
    networkStatus.textContent = message;
    networkStatus.classList.toggle("connected", state === "connected");
    networkStatus.classList.toggle("error", state === "error" || state === "reconnecting");
  }
  if (Number.isFinite(online)) onlineCount.textContent = `${online} 人`;
  if (state === "offline") {
    [...remotePlayers.keys()].forEach(removeRemotePlayer);
    onlineCount.textContent = "1 人";
  }
}

function saveLocalValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function joinRoomFromUI() {
  const savedNickname = nicknameInput.value.trim();
  const nickname = savedNickname || `香客${Math.floor(1000 + Math.random() * 9000)}`;
  const roomId = roomInput.value.trim() || "lobby";
  nicknameInput.value = nickname;
  roomInput.value = roomId;
  saveLocalValue("cloud-worship-nickname", nickname);
  saveLocalValue("cloud-worship-room", roomId);

  if (!network?.configured) {
    setNetworkStatus({ state: "offline", message: "单机模式 · 未配置 CloudBase WebSocket" });
    showToast("当前未配置实时服务，仍可单机游览。");
    return;
  }
  network.connect({
    nickname,
    roomId,
    x: avatar.position.x,
    z: avatar.position.z,
    heading: avatar.rotation.y
  });
}

network = createTempleNetwork({
  onStatus: setNetworkStatus,
  onWelcome: message => {
    setNetworkStatus({
      state: "connected",
      message: `房间 ${message.roomId} · ${message.players?.length || 1} 人`,
      online: message.players?.length || 1
    });
    syncRemotePlayers(message.players || []);
  },
  onSnapshot: players => {
    syncRemotePlayers(players);
    onlineCount.textContent = `${players.length} 人`;
  },
  onPlayerJoin: player => {
    if (player.id === network.playerId) return;
    applyRemoteState(player);
    onlineCount.textContent = `${remotePlayers.size + 1} 人`;
    showToast(`${player.nickname} 进入了禅寺`);
  },
  onPlayerLeave: playerId => {
    removeRemotePlayer(playerId);
    onlineCount.textContent = `${remotePlayers.size + 1} 人`;
  },
  onAction: setRemoteAction
});

joinRoomButton.addEventListener("click", joinRoomFromUI);
[nicknameInput, roomInput].forEach(input => {
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") joinRoomFromUI();
  });
});

const initialParams = new URLSearchParams(location.search);
let savedNickname = "";
let savedRoom = "";
try {
  savedNickname = localStorage.getItem("cloud-worship-nickname") || "";
  savedRoom = localStorage.getItem("cloud-worship-room") || "";
} catch {}
const initialNickname = savedNickname || `香客${Math.floor(1000 + Math.random() * 9000)}`;
const initialRoom = initialParams.get("room") || savedRoom || "lobby";
nicknameInput.value = initialNickname;
roomInput.value = initialRoom;
if (network.configured) {
  joinRoomFromUI();
} else {
  setNetworkStatus({ state: "offline", message: "单机模式 · 配置 CloudBase WebSocket 后可多人" });
}

addEventListener("resize", resize);

resize();
let lastToast = -8;
let lastNetworkMove = 0;
(function animate() {
  const delta = Math.min(state.clock.getDelta(), .05), elapsed = state.clock.elapsedTime;
  updateAvatar(delta);
  updateRemotePlayers(delta);
  updateCamera(delta);
  updateEffects(delta, elapsed);
  updateIncenseControls();

  const now = performance.now();
  if (now - lastNetworkMove >= 100) {
    lastNetworkMove = now;
    const moving = state.velocity.length() > .06 && !state.praying && !state.incenseRitual && !state.dancing && !state.woodfishSession;
    network?.sendMove({ x: avatar.position.x, z: avatar.position.z, heading: avatar.rotation.y, animation: moving ? "walk" : "idle" });
  }

  danceButton.disabled = state.dancing;
  if (state.toastTimer > 0) { state.toastTimer -= delta; if (state.toastTimer <= 0) toast.classList.remove("show"); }
  if (nearAltar() && elapsed - lastToast > 8) { lastToast = elapsed; }
  composer.render(); requestAnimationFrame(animate);
})();
resize();
setTimeout(() => { overlay.classList.add("hidden"); showToast("先到入口取香点取香，再到香炉前上香。"); }, 500);
