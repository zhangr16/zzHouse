import * as THREE from "three";

const MODEL_LIBRARY = {
  lantern: {
    url: new URL("../models/lantern.glb?v=20261123zones", import.meta.url).href,
    targetHeight: 3.25,
    tiers: ["high", "balanced"],
    delay: 700,
    placements: [
      { x: -5.0, z: 7.55, rotation: .18, collider: .34 },
      { x: 5.0, z: 7.55, rotation: -.18, collider: .34 }
    ]
  },
  pottedPlant: {
    url: new URL("../models/potted-plant.glb?v=20261123zones", import.meta.url).href,
    targetHeight: 1.55,
    tiers: ["high"],
    delay: 4200,
    placements: [
      { x: -4.9, z: 9.7, rotation: .35, collider: .30 },
      { x: 4.9, z: 9.7, rotation: -.35, collider: .30 }
    ]
  },
  glassVase: {
    url: new URL("../models/glass-vase-flowers.glb?v=20261123zones", import.meta.url).href,
    targetHeight: .60,
    tiers: ["high", "balanced"],
    delay: 250,
    placements: [
      { x: 2.55, y: 1.93, z: -7.05, rotation: .12 }
    ],
    hideOnLoad: ["glassVessel"]
  }
};

const AREA_MODELS = {
  outside: ["lantern", "pottedPlant"],
  inside: ["glassVase"]
};

function normalizeModel(source, targetHeight) {
  source.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(source);
  const size = bounds.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y <= .0001) return source;
  source.scale.multiplyScalar(targetHeight / size.y);
  source.updateMatrixWorld(true);
  bounds.setFromObject(source);
  const center = bounds.getCenter(new THREE.Vector3());
  source.position.x -= center.x;
  source.position.z -= center.z;
  source.position.y -= bounds.min.y;
  source.updateMatrixWorld(true);
  return source;
}

function prepareClone(source, { quality, maxAnisotropy }) {
  const clone = source.clone(true);
  const lights = [];
  clone.traverse(item => {
    if (item.isLight) {
      lights.push(item);
      return;
    }
    if (!item.isMesh) return;
    item.castShadow = quality.shadows;
    item.receiveShadow = true;
    const materials = Array.isArray(item.material) ? item.material : [item.material];
    materials.forEach(material => {
      if (!material) return;
      material.envMapIntensity = .65;
      ["map", "normalMap", "roughnessMap"].forEach(key => {
        if (material[key]) material[key].anisotropy = maxAnisotropy;
      });
    });
  });
  lights.forEach(light => light.parent?.remove(light));
  return clone;
}

export function createModelSystem({ quality, notify, exteriorGroup, interiorGroup, groundLevel, colliders, fallbacks = {} }) {
  const loaded = new Set();
  const loading = new Set();
  const warned = new Set();
  const maxAnisotropy = quality.maxAnisotropy;
  let loaderPromise = null;

  function addPlacements(template, asset) {
    asset.placements.forEach(placement => {
      const model = prepareClone(template, { quality, maxAnisotropy });
      const anchor = new THREE.Group();
      anchor.position.set(placement.x, placement.y ?? groundLevel(placement.z), placement.z);
      anchor.rotation.y = placement.rotation || 0;
      anchor.add(model);
      (placement.z < 6.75 ? interiorGroup : exteriorGroup).add(anchor);
      if (placement.collider) colliders.push({ x: placement.x, z: placement.z, radius: placement.collider });
    });
    asset.hideOnLoad?.forEach(key => {
      (fallbacks[key] || []).forEach(item => { if (item) item.visible = false; });
    });
  }

  async function loadAsset(key) {
    const asset = MODEL_LIBRARY[key];
    if (!asset || loaded.has(key) || loading.has(key) || !asset.tiers.includes(quality.tier)) return;
    loading.add(key);
    try {
      const { GLTFLoader } = await (loaderPromise ||= import("three/addons/loaders/GLTFLoader.js"));
      const gltf = await new Promise((resolve, reject) => {
        new GLTFLoader().load(asset.url, resolve, undefined, reject);
      });
      const template = normalizeModel(gltf.scene, asset.targetHeight);
      addPlacements(template, asset);
      loaded.add(key);
      loading.delete(key);
    } catch {
      loading.delete(key);
      if (warned.has(key)) return;
      warned.add(key);
      notify("部分 GLB 园林装饰未加载，已继续使用内置模型。");
    }
  }

  function preloadArea(area) {
    (AREA_MODELS[area] || []).forEach(key => {
      const asset = MODEL_LIBRARY[key];
      if (!asset) return;
      setTimeout(() => loadAsset(key), asset.delay || 0);
    });
  }

  return { preloadArea, loadAsset, loaded };
}
