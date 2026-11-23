import * as THREE from "three";

function textureFromCanvas(size, painter) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  painter(canvas.getContext("2d"), size);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

function createSmokePool(capacity, positions) {
  const active = [];
  const free = Array.from({ length: capacity }, (_, index) => ({
    index,
    position: new THREE.Vector3(),
    age: 0,
    life: 0,
    seed: 0
  }));
  return {
    active,
    spawn(tip, seed) {
      if (!free.length) return null;
      const particle = free.pop();
      particle.position.copy(tip);
      particle.age = 0;
      particle.life = 1.8 + Math.random() * 1.2;
      particle.seed = seed;
      active.push(particle);
      return particle;
    },
    update(delta, elapsed) {
      for (let index = active.length - 1; index >= 0; index--) {
        const particle = active[index];
        particle.age += delta;
        if (particle.age >= particle.life) {
          const last = active.pop();
          if (index < active.length) active[index] = last;
          free.push(particle);
          continue;
        }
        particle.position.x += Math.sin(elapsed * 1.6 + particle.seed) * delta * .1;
        particle.position.y += delta * (.25 + particle.seed * .04);
        particle.position.z += Math.cos(elapsed * 1.2 + particle.seed) * delta * .08;
        const offset = index * 3;
        positions[offset] = particle.position.x;
        positions[offset + 1] = particle.position.y;
        positions[offset + 2] = particle.position.z;
      }
    }
  };
}

export function createEffects({ renderer, scene, camera, quality, flames, bell, windGroups, koi, groundLevel, interiorGroup, exteriorGroup, notify }) {
  const petalSprite = textureFromCanvas(64, (context, size) => {
    const gradient = context.createRadialGradient(size * .5, size * .5, 2, size * .5, size * .5, size * .5);
    gradient.addColorStop(0, "rgba(255, 214, 230, 1)");
    gradient.addColorStop(.46, "rgba(255, 178, 210, .92)");
    gradient.addColorStop(1, "rgba(255, 178, 210, 0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(size * .5, size * .5, size * .48, size * .36, .5, 0, 7);
    context.fill();
  });
  const petalCount = quality.petalCount;
  const petalPositions = new Float32Array(petalCount * 3).fill(-100);
  const petalGeometry = new THREE.BufferGeometry();
  petalGeometry.setAttribute("position", new THREE.BufferAttribute(petalPositions, 3));
  const petalPoints = new THREE.Points(petalGeometry, new THREE.PointsMaterial({
    map: petalSprite, color: "#ffd5e4", size: .13, transparent: true, opacity: .88,
    alphaTest: .04, depthWrite: false, blending: THREE.NormalBlending, sizeAttenuation: true
  }));
  petalPoints.frustumCulled = false;
  exteriorGroup.add(petalPoints);
  const petalParticles = [];
  const petalSources = [
    [-6.3, 8.2], [6.3, 8.2], [-8.8, 15.8], [8.6, 15.2],
    [-6.1, 15.9], [6.7, 16.4], [-4.9, 12.6], [4.6, 14.1]
  ];
  for (let index = 0; index < petalCount; index++) {
    const sourceIndex = index % petalSources.length, source = petalSources[sourceIndex];
    const particle = {
      x: source[0] + (Math.random() - .5) * 2.2,
      y: 2.0 + Math.random() * 1.9,
      z: source[1] + (Math.random() - .5) * 2.2,
      age: Math.random() * 9,
      life: 7.5 + Math.random() * 5,
      seed: Math.random() * 9,
      sourceIndex
    };
    petalParticles.push(particle);
    petalPositions[index * 3] = particle.x;
    petalPositions[index * 3 + 1] = particle.y;
    petalPositions[index * 3 + 2] = particle.z;
  }

  const dustSprite = textureFromCanvas(64, (context, size) => {
    const gradient = context.createRadialGradient(size * .5, size * .5, 1, size * .5, size * .5, size * .5);
    gradient.addColorStop(0, "rgba(255, 243, 205, 1)");
    gradient.addColorStop(1, "rgba(255, 243, 205, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });
  const dustCount = quality.dustCount;
  const dustPositions = new Float32Array(dustCount * 3);
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
  dustPoints.frustumCulled = false;
  interiorGroup.add(dustPoints);

  const smokeCapacity = quality.smokeCapacity;
  const smokePositions = new Float32Array(smokeCapacity * 3).fill(-50);
  const smokeGeometry = new THREE.BufferGeometry();
  smokeGeometry.setAttribute("position", new THREE.BufferAttribute(smokePositions, 3));
  const smoke = new THREE.Points(smokeGeometry, new THREE.PointsMaterial({
    size: .16, transparent: true, opacity: .3, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  smoke.frustumCulled = false;
  interiorGroup.add(smoke);
  const smokePool = createSmokePool(smokeCapacity, smokePositions);

  const incenseRecords = Array.from({ length: 30 }, () => ({
    ember: null,
    tip: new THREE.Vector3(),
    seed: 0,
    active: false
  }));
  let incenseCursor = 0;
  function addIncense(ember, x, y, z, seed) {
    if (!ember) return null;
    const record = incenseRecords[incenseCursor] || incenseRecords[incenseRecords.length - 1];
    incenseCursor = (incenseCursor + 1) % incenseRecords.length;
    record.ember = ember;
    record.tip.set(x, y, z);
    record.seed = seed;
    record.active = true;
    return record;
  }

  let composer = null;
  let renderFrame = () => renderer.render(scene, camera);
  let postProcessingReady = false;

  async function initPostProcessing() {
    if (!quality.postProcessing || postProcessingReady) return;
    postProcessingReady = true;
    try {
      const [{ EffectComposer }, { RenderPass }, { OutputPass }] = await Promise.all([
        import("three/addons/postprocessing/EffectComposer.js"),
        import("three/addons/postprocessing/RenderPass.js"),
        import("three/addons/postprocessing/OutputPass.js")
      ]);
      composer = new EffectComposer(renderer);
      let scenePass;
      if (quality.ssr) {
        const { SSRPass } = await import("three/addons/postprocessing/SSRPass.js");
        scenePass = new SSRPass({ renderer, scene, camera, width: innerWidth, height: innerHeight, groundReflector: null });
        scenePass.opacity = .24;
        scenePass.maxDistance = .82;
        scenePass.thickness = .028;
        scenePass.fresnel = true;
        scenePass.blur = true;
      } else {
        scenePass = new RenderPass(scene, camera);
      }
      composer.addPass(scenePass);
      if (quality.bloom) {
        const { UnrealBloomPass } = await import("three/addons/postprocessing/UnrealBloomPass.js");
        composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .22, .68, .82));
      }
      composer.addPass(new OutputPass());
      composer.setSize(innerWidth, innerHeight);
      renderFrame = () => composer.render();
    } catch {
      notify("后处理不可用，已切换为轻量渲染。");
      composer = null;
      renderFrame = () => renderer.render(scene, camera);
    }
  }

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    composer?.setSize(innerWidth, innerHeight);
  }

  function update(delta, elapsed, bellTimer = 0) {
    const interiorActive = interiorGroup.visible;
    const exteriorActive = exteriorGroup.visible;
    if (interiorActive) flames.forEach(({ flame, light, seed }) => {
      const scale = 1 + Math.sin(elapsed * 11 + seed) * .08;
      flame.scale.setScalar(scale);
      if (light) light.intensity = 3 * scale;
    });
    if (bell?.body) {
      if (bellTimer > 0) {
        const ringTime = 2.6 - bellTimer;
        bell.body.rotation.z = Math.sin(ringTime * 12) * .20 * Math.exp(-ringTime * 1.05);
        bell.body.rotation.x = Math.sin(ringTime * 9.4 + .6) * .05 * Math.exp(-ringTime * 1.15);
      } else {
        bell.body.rotation.set(0, 0, 0);
      }
    }
    windGroups.forEach(({ object, kind, seed, amplitude }) => {
      const breeze = Math.sin(elapsed * .72 + seed * 2.1) + Math.sin(elapsed * 1.23 + seed) * .48;
      const flutter = Math.sin(elapsed * 2.4 + seed * 3.7) * .35;
      if (kind === "tree" || kind === "lantern") {
        object.rotation.z = breeze * amplitude;
        object.rotation.x = flutter * amplitude * (kind === "lantern" ? .72 : .54);
      } else if (kind === "banner") {
        object.rotation.z = breeze * amplitude;
        object.rotation.x = .015 + flutter * amplitude * .30;
      }
    });
    if (exteriorActive) {
      for (let index = 0; index < petalParticles.length; index++) {
        const particle = petalParticles[index], source = petalSources[particle.sourceIndex];
        particle.age += delta;
        if (particle.age >= particle.life || particle.y < groundLevel(particle.z) + .015) {
          particle.age = 0;
          particle.life = 7.5 + Math.random() * 5;
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
      koi.forEach(({ fish, seed }, index) => {
        const angle = elapsed * .24 + seed, radius = .68 + (index % 3) * .20;
        fish.position.x = -7.8 + Math.cos(angle) * radius;
        fish.position.z = 12.2 + Math.sin(angle) * (radius * .84);
        fish.rotation.y = -Math.atan2(Math.cos(angle), -Math.sin(angle));
        fish.rotation.z = .08 * Math.sin(elapsed * 3.6 + seed);
      });
    }
    if (interiorActive) {
      for (let index = 0; index < dustCount; index++) {
        const seed = index * .137;
        dustPositions[index * 3] += Math.sin(elapsed * .28 + seed) * delta * .055;
        dustPositions[index * 3 + 1] += Math.sin(elapsed * .44 + seed * 2.3) * delta * .035;
        dustPositions[index * 3 + 2] += Math.cos(elapsed * .23 + seed * 1.8) * delta * .045;
      }
      dustGeometry.attributes.position.needsUpdate = true;
      incenseRecords.forEach(record => {
        if (!record.active || !record.ember) return;
        record.ember.material.emissiveIntensity = 4.5 + Math.sin(elapsed * 9 + record.seed) * 1.3;
        if (smokePool.active.length < smokeCapacity && Math.random() < delta * 18) {
          smokePool.spawn(record.tip, Math.random() * 8);
        }
      });
      smokePool.update(delta, elapsed);
      smokeGeometry.attributes.position.needsUpdate = true;
      smokeGeometry.setDrawRange(0, smokePool.active.length);
    }
  }

  initPostProcessing();

  return {
    smokePool,
    incenseRecords,
    addIncense,
    update,
    resize,
    render: () => renderFrame(),
    get usesPostProcessing() { return Boolean(composer); }
  };
}
