import * as THREE from "three";

const avatarShadowCanvas = document.createElement("canvas");
avatarShadowCanvas.width = avatarShadowCanvas.height = 96;
const avatarShadowContext = avatarShadowCanvas.getContext("2d");
const avatarShadowGradient = avatarShadowContext.createRadialGradient(48, 48, 3, 48, 48, 46);
avatarShadowGradient.addColorStop(0, "rgba(12, 9, 7, .62)");
avatarShadowGradient.addColorStop(.55, "rgba(12, 9, 7, .28)");
avatarShadowGradient.addColorStop(1, "rgba(12, 9, 7, 0)");
avatarShadowContext.fillStyle = avatarShadowGradient;
avatarShadowContext.fillRect(0, 0, 96, 96);
const avatarShadowTexture = new THREE.CanvasTexture(avatarShadowCanvas);
const avatarShadowGeometry = new THREE.PlaneGeometry(1.05, 1.05);
const avatarShadowMaterial = new THREE.MeshBasicMaterial({ map: avatarShadowTexture, transparent: true, depthWrite: false, opacity: .55 });

function createAvatarShadow() {
  const shadow = new THREE.Mesh(avatarShadowGeometry, avatarShadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .022;
  shadow.renderOrder = 1;
  return shadow;
}

export const skinConfigs = {
  caixukun: {
    label: "蔡徐坤",
    icon: "🏀",
    skillLabel: "炫技",
    skillIcon: "🏀",
    skillNotice: "小鸡炫技登场！",
    skillFinish: "头弹回来了，炫技完成。",
    outfit: "caixukun",
    skin: "#ffd02b",
    cloth: "#171a20",
    trousers: "#82878d",
    trim: "#f4f6f4",
    hair: "#e6e9ec",
    bead: "#8a4a20",
    beak: "#f79a2b",
    hairVisible: true,
    basketballVisible: true,
    beadsVisible: false
  },
  monk: {
    label: "僧袍",
    icon: "🧘",
    skillLabel: "梵音",
    skillIcon: "🔔",
    skillNotice: "梵音静心，佛光护体。",
    skillFinish: "梵音已止，心神澄明。",
    outfit: "monk",
    skin: "#e8b88a",
    cloth: "#b85524",
    trousers: "#8e3d1d",
    trim: "#d9a64e",
    hair: "#e8b88a",
    bead: "#7a4b2a",
    beak: "#c98a6a",
    hairVisible: false,
    basketballVisible: false,
    beadsVisible: true
  },
  layperson: {
    label: "居士服",
    icon: "🪷",
    skillLabel: "莲华",
    skillIcon: "🪭",
    skillNotice: "莲华拂袖，福慧双修。",
    skillFinish: "莲华散去，余香犹在。",
    outfit: "layperson",
    skin: "#e8b88a",
    cloth: "#456b67",
    trousers: "#385751",
    trim: "#d8c28a",
    hair: "#34241b",
    bead: "#9b7044",
    beak: "#c98a6a",
    hairVisible: true,
    basketballVisible: false,
    beadsVisible: false
  }
};

function createMaterials() {
  return {
    skin: new THREE.MeshPhysicalMaterial({ color: "#ffd02b", roughness: .48, clearcoat: .14 }),
    cloth: new THREE.MeshPhysicalMaterial({ color: "#171a20", roughness: .46, sheen: .16, sheenColor: new THREE.Color("#68707c"), sheenRoughness: .56 }),
    trousers: new THREE.MeshPhysicalMaterial({ color: "#82878d", roughness: .60, sheen: .08, sheenColor: new THREE.Color("#d9dddf"), sheenRoughness: .72 }),
    trim: new THREE.MeshPhysicalMaterial({ color: "#f4f6f4", roughness: .34, metalness: .02, clearcoat: .12 }),
    hair: new THREE.MeshPhysicalMaterial({ color: "#e6e9ec", roughness: .34, clearcoat: .28, clearcoatRoughness: .46, envMapIntensity: .62 }),
    eye: new THREE.MeshPhysicalMaterial({ color: "#222222", roughness: .08, clearcoat: 1 }),
    whiteEye: new THREE.MeshStandardMaterial({ color: "#fffaf4", roughness: .2 }),
    iris: new THREE.MeshPhysicalMaterial({ color: "#4a3a2a", roughness: .14, clearcoat: .8 }),
    cheek: new THREE.MeshStandardMaterial({ color: "#e74c3c", roughness: .82, transparent: true, opacity: .9 }),
    mouth: new THREE.MeshStandardMaterial({ color: "#c46a5a", roughness: .52 }),
    beak: new THREE.MeshPhysicalMaterial({ color: "#f79a2b", roughness: .38, clearcoat: .22 }),
    bead: new THREE.MeshStandardMaterial({ color: "#8a4a20", roughness: .42 }),
    monkDot: new THREE.MeshStandardMaterial({ color: "#8c6148", roughness: .78 }),
    fanPaper: new THREE.MeshPhysicalMaterial({ color: "#f7e7c5", roughness: .62, transparent: true, opacity: .96, side: THREE.DoubleSide }),
    aura: new THREE.MeshBasicMaterial({ color: "#ffd479", transparent: true, opacity: .86, depthWrite: false }),
    auraSoft: new THREE.MeshBasicMaterial({ color: "#ffcb7a", transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide }),
    lotus: new THREE.MeshBasicMaterial({ color: "#ff9ec4", transparent: true, opacity: .82, depthWrite: false, side: THREE.DoubleSide }),
    lotusSoft: new THREE.MeshBasicMaterial({ color: "#ffd4e5", transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide })
  };
}

export function createChibiAvatar(initialSkin = "caixukun") {
  const avatar = new THREE.Group();
  const figure = new THREE.Group();
  const materials = createMaterials();
  const outfits = {
    caixukun: new THREE.Group(),
    monk: new THREE.Group(),
    layperson: new THREE.Group()
  };

  const bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(.150, .19, 10, 20), materials.cloth); bodyMesh.position.y = .71;
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.095, .032, 12, 28), materials.cloth); collar.rotation.x = Math.PI / 2; collar.position.y = .835;
  const pelvisMesh = new THREE.Mesh(new THREE.CapsuleGeometry(.142, .08, 10, 20), materials.trousers); pelvisMesh.position.y = .52;
  const belt = new THREE.Mesh(new THREE.BoxGeometry(.30, .055, .28), materials.trim); belt.position.y = .605;
  const suspenders = new THREE.Group();
  [-.11, .11].forEach(side => [-.10, .10].forEach(depth => {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(.036, .235, .05), materials.trim);
    strap.position.set(side, .715, depth * 1.28); suspenders.add(strap);
  }));
  outfits.caixukun.add(bodyMesh, pelvisMesh, collar, belt, suspenders);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.052, .06, .07, 12), materials.skin); neck.position.y = .84;
  const head = new THREE.Group(); head.position.y = 1.13;
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(.265, 38, 32), materials.skin); headMesh.scale.set(.96, 1, .94);
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(.274, 34, 28), materials.hair); hairBack.scale.set(.96, .98, 1); hairBack.position.set(0, .012, -.028); hairBack.name = "hairBack";
  const hairTop = new THREE.Mesh(new THREE.SphereGeometry(.268, 34, 28, 0, Math.PI * 2, 0, Math.PI * .47), materials.hair); hairTop.scale.set(.97, .98, .97); hairTop.position.y = .008; hairTop.name = "hairTop";
  const fringe = new THREE.Mesh(new THREE.TorusGeometry(.185, .038, 10, 32, Math.PI * 1.3), materials.hair); fringe.rotation.x = Math.PI / 2; fringe.position.set(0, .11, .055); fringe.name = "fringe";
  [-.088, .088].forEach(side => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(.074, 24, 20), materials.whiteEye); eyeWhite.position.set(side, .025, .202); eyeWhite.scale.set(1, 1.08, .78);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.038, 20, 18), materials.eye); pupil.position.set(side, .018, .262); pupil.scale.set(1, 1.05, .62);
    const highlight = new THREE.Mesh(new THREE.SphereGeometry(.013, 12, 10), materials.whiteEye); highlight.position.set(side + .016, .058, .283);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(.038, 20, 18), materials.iris); iris.position.set(side, .018, .258); iris.scale.set(1, 1.05, .62);
    const eyebrow = new THREE.Mesh(new THREE.TorusGeometry(.052, .011, 6, 18, Math.PI * .6), materials.hair); eyebrow.rotation.z = Math.PI * .7; eyebrow.rotation.y = side * .28; eyebrow.position.set(side, .115, .218);
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(.049, 22), materials.cheek);
    cheek.position.set(side * 1.85, -.055, .178); cheek.rotation.y = side * .68;
    const ear = new THREE.Mesh(new THREE.SphereGeometry(.042, 12, 10), materials.skin); ear.position.set(side * .252, 0, .01); ear.scale.set(.5, 1, .72);
    head.add(eyeWhite, pupil, iris, highlight, eyebrow, cheek, ear);
  });
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(.038, .008, 6, 16, Math.PI * .7), materials.mouth);
  mouth.rotation.x = Math.PI / 2; mouth.rotation.z = Math.PI * .65; mouth.position.set(0, -.11, .238);
  const beak = new THREE.Mesh(new THREE.SphereGeometry(.076, 24, 20), materials.beak);
  beak.scale.set(1.16, .58, .78); beak.position.set(0, -.088, .238); beak.name = "beak";
  head.add(mouth, beak, headMesh, hairBack, hairTop, fringe);

  const hairBun = new THREE.Mesh(new THREE.SphereGeometry(.115, 18, 14), materials.hair);
  hairBun.position.set(0, .30, -.025); hairBun.scale.set(1.1, .82, 1);
  const hairPin = new THREE.Mesh(new THREE.CylinderGeometry(.010, .012, .19, 8), materials.trim);
  hairPin.rotation.z = Math.PI / 2; hairPin.position.set(.13, .31, -.02);
  head.add(hairBun, hairPin);

  const monkDots = new THREE.Group();
  [[-.075, .22, .05], [-.028, .245, .06], [.022, .245, .06], [.070, .22, .05], [-.10, .18, .03], [.095, .18, .03]].forEach(([x, y, z]) => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(.017, 8, 6), materials.monkDot);
    dot.position.set(x, y, z); monkDots.add(dot);
  });
  head.add(monkDots);

  const monkRobe = new THREE.Mesh(new THREE.CylinderGeometry(.20, .36, .68, 18, 1, true), materials.cloth); monkRobe.position.y = .60;
  const monkSkirt = new THREE.Mesh(new THREE.CylinderGeometry(.25, .42, .32, 18, 1, true), materials.trousers); monkSkirt.position.y = .39;
  const monkSash = new THREE.Mesh(new THREE.BoxGeometry(.36, .065, .30), materials.trim); monkSash.position.y = .72;
  const monkDrape = new THREE.Mesh(new THREE.BoxGeometry(.16, .38, .035), materials.trim); monkDrape.position.set(-.17, .77, .15); monkDrape.rotation.z = -.32;
  const monkBeads = new THREE.Group();
  for (let index = 0; index < 16; index++) {
    const angle = index / 16 * Math.PI * 2;
    const bead = new THREE.Mesh(new THREE.SphereGeometry(.024, 10, 8), materials.bead);
    bead.position.set(Math.cos(angle) * .14, Math.sin(angle) * .045, Math.sin(angle) * .105);
    monkBeads.add(bead);
  }
  monkBeads.position.set(0, .82, .03);
  const monkStaff = new THREE.Group();
  const staffShaft = new THREE.Mesh(new THREE.CylinderGeometry(.018, .022, 1.28, 8), materials.trim); staffShaft.position.y = .62;
  const staffRing = new THREE.Mesh(new THREE.TorusGeometry(.085, .012, 8, 24), materials.trim); staffRing.rotation.x = Math.PI / 2; staffRing.position.y = 1.29;
  monkStaff.add(staffShaft, staffRing); monkStaff.position.set(.34, 0, -.06); monkStaff.rotation.z = -.26;
  outfits.monk.add(monkRobe, monkSkirt, monkSash, monkDrape, monkBeads, monkStaff);

  const layRobe = new THREE.Mesh(new THREE.CylinderGeometry(.20, .34, .64, 18, 1, true), materials.cloth); layRobe.position.y = .60;
  const laySkirt = new THREE.Mesh(new THREE.CylinderGeometry(.25, .40, .30, 18, 1, true), materials.trousers); laySkirt.position.y = .39;
  const laySash = new THREE.Mesh(new THREE.BoxGeometry(.37, .06, .30), materials.trim); laySash.position.y = .70;
  const collarLeft = new THREE.Mesh(new THREE.BoxGeometry(.23, .028, .022), materials.trim); collarLeft.position.set(-.075, .79, .175); collarLeft.rotation.z = -.56;
  const collarRight = collarLeft.clone(); collarRight.position.x = .075; collarRight.rotation.z = .56;
  outfits.layperson.add(layRobe, laySkirt, laySash, collarLeft, collarRight);

  function chibiArm(side) {
    const shoulder = new THREE.Group(); shoulder.position.set(.205 * side, .80, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(.068, .10, 8, 14), materials.cloth); sleeve.position.y = -.09;
    const sleeveRim = new THREE.Mesh(new THREE.CylinderGeometry(.10, .115, .15, 12, 1, true), materials.cloth); sleeveRim.position.y = -.13; sleeveRim.visible = false;
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(.044, .13, 8, 12), materials.skin); forearm.position.y = -.21;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.055, 18, 14), materials.skin); hand.position.y = -.31;
    shoulder.add(sleeve, sleeveRim, forearm, hand);
    return { shoulder, hand, sleeveRim };
  }

  const leftArm = chibiArm(-1), rightArm = chibiArm(1);
  const basketball = new THREE.Group();
  const basketballBody = new THREE.Mesh(new THREE.SphereGeometry(.115, 30, 24), new THREE.MeshPhysicalMaterial({ color: "#d17030", roughness: .58, clearcoat: .06, envMapIntensity: .45 }));
  const basketballSeam = new THREE.Mesh(new THREE.TorusGeometry(.114, .006, 8, 36), new THREE.MeshStandardMaterial({ color: "#2c2015", roughness: .62 }));
  basketballSeam.rotation.x = Math.PI / 2;
  basketball.add(basketballBody, basketballSeam);
  basketball.position.set(-.062, -.015, .072); basketball.rotation.set(.28, .35, .12);
  leftArm.hand.add(basketball);

  const laypersonFan = new THREE.Group();
  const fanPaper = new THREE.Mesh(new THREE.CircleGeometry(.22, 18, Math.PI * .10, Math.PI * 1.4), materials.fanPaper);
  const fanRib = new THREE.Mesh(new THREE.BoxGeometry(.012, .32, .012), materials.trim); fanRib.position.y = .02;
  const fanHandle = new THREE.Mesh(new THREE.CylinderGeometry(.012, .014, .18, 8), materials.trim); fanHandle.position.y = -.19;
  laypersonFan.add(fanPaper, fanRib, fanHandle);
  laypersonFan.position.set(0, -.28, .08); laypersonFan.rotation.z = -.25;
  rightArm.hand.add(laypersonFan);

  function chibiLeg(side) {
    const hip = new THREE.Group(); hip.position.set(.095 * side, .44, 0);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(.064, .14, 8, 14), materials.trousers); thigh.position.y = -.13;
    const knee = new THREE.Group(); knee.position.y = -.27;
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(.052, .13, 8, 12), materials.trousers); shin.position.y = -.12;
    const foot = new THREE.Mesh(new THREE.CapsuleGeometry(.05, .10, 8, 12), new THREE.MeshStandardMaterial({ color: "#20242a", roughness: .48 }));
    foot.rotation.x = Math.PI / 2; foot.position.set(0, -.25, .025);
    knee.add(shin, foot); hip.add(thigh, knee);
    return { hip, knee };
  }

  const leftLeg = chibiLeg(-1), rightLeg = chibiLeg(1);
  const beads = monkBeads;

  const monkAura = new THREE.Group();
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.34, .018, 8, 48), materials.aura);
  halo.position.set(0, 1.18, -.19);
  const haloDisc = new THREE.Mesh(new THREE.CircleGeometry(.31, 32), materials.auraSoft);
  haloDisc.position.set(0, 1.18, -.20);
  monkAura.add(halo, haloDisc); monkAura.visible = false;

  const lotusAura = new THREE.Group();
  const lotusRing = new THREE.Mesh(new THREE.TorusGeometry(.34, .012, 8, 48), materials.lotusSoft);
  lotusRing.rotation.x = Math.PI / 2; lotusRing.position.y = .055;
  lotusAura.add(lotusRing);
  for (let index = 0; index < 10; index++) {
    const angle = index / 10 * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 6), materials.lotus);
    petal.scale.set(.65, 1.5, .38);
    petal.position.set(Math.cos(angle) * .30, .075, Math.sin(angle) * .30);
    petal.rotation.set(Math.PI * .42, -angle, 0);
    lotusAura.add(petal);
  }
  lotusAura.visible = false;

  figure.add(outfits.caixukun, outfits.monk, outfits.layperson, neck, head, leftArm.shoulder, rightArm.shoulder, leftLeg.hip, rightLeg.hip, monkAura, lotusAura);
  figure.traverse(item => { if (item.isMesh) item.castShadow = item.receiveShadow = true; });
  avatar.add(createAvatarShadow(), figure);

  const chibi = {
    avatar, figure, head, leftArm, rightArm, leftLeg, rightLeg, basketball,
    beads, outfits, materials, beak, hairBack, hairTop, fringe, hairBun, hairPin,
    monkDots, monkStaff, monkBeads, laypersonFan, monkAura, lotusAura,
    sleeveRims: [leftArm.sleeveRim, rightArm.sleeveRim]
  };
  applySkinToChibi(chibi, initialSkin);
  return chibi;
}

function applySkinToChibi(chibi, skinKey) {
  const config = skinConfigs[skinKey] || skinConfigs.caixukun;
  chibi.currentSkin = skinKey in skinConfigs ? skinKey : "caixukun";
  const materials = chibi.materials;
  materials.skin.color.set(config.skin);
  materials.cloth.color.set(config.cloth);
  materials.trousers.color.set(config.trousers);
  materials.trim.color.set(config.trim);
  materials.hair.color.set(config.hair);
  materials.bead.color.set(config.bead);
  materials.beak.color.set(config.beak);
  chibi.outfits.caixukun.visible = config.outfit === "caixukun";
  chibi.outfits.monk.visible = config.outfit === "monk";
  chibi.outfits.layperson.visible = config.outfit === "layperson";
  [chibi.hairBack, chibi.hairTop, chibi.fringe].forEach(item => { item.visible = config.hairVisible; });
  chibi.hairBun.visible = config.outfit === "layperson";
  chibi.hairPin.visible = config.outfit === "layperson";
  chibi.monkDots.visible = config.outfit === "monk";
  chibi.monkStaff.visible = config.outfit === "monk";
  chibi.monkBeads.visible = config.beadsVisible;
  chibi.laypersonFan.visible = config.outfit === "layperson";
  chibi.beak.visible = config.outfit === "caixukun";
  chibi.basketball.visible = config.basketballVisible;
  chibi.sleeveRims.forEach(item => { item.visible = config.outfit !== "caixukun"; });
  chibi.monkAura.visible = false;
  chibi.lotusAura.visible = false;
  return config;
}

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

export function createAvatarSystem({ scene, groundLevel, getPlayerId }) {
  const localChibi = createChibiAvatar();
  const { avatar, figure, head, leftArm, rightArm, leftLeg, rightLeg, basketball } = localChibi;
  avatar.position.set(0, groundLevel(25.9), 25.9);
  avatar.rotation.y = Math.PI;
  scene.add(avatar);

  const remotePlayers = new Map();
  function isRemoteVisible(positionZ) {
    return (positionZ < 6.75) === (avatar.position.z < 6.75);
  }

  function createRemotePlayer(player) {
    const chibi = createChibiAvatar();
    chibi.basketball.visible = false;
    chibi.avatar.position.set(player.x, groundLevel(player.z), player.z);
    chibi.avatar.rotation.y = player.heading;
    chibi.avatar.visible = isRemoteVisible(player.z);
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
    if (!player?.id || player.id === getPlayerId?.()) return;
    const remote = remotePlayers.get(player.id) || createRemotePlayer(player);
    remote.nickname = player.nickname || remote.nickname;
    remote.targetX = Number(player.x) || 0;
    remote.targetZ = Number(player.z) || 0;
    remote.targetHeading = Number(player.heading) || 0;
    remote.chibi.avatar.visible = isRemoteVisible(remote.targetZ);
    if (performance.now() >= remote.actionUntil) remote.animation = player.animation || "idle";
  }

  function syncRemotePlayers(players) {
    const activeIds = new Set();
    players.forEach(player => {
      if (player.id === getPlayerId?.()) return;
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
      avatarObject.visible = isRemoteVisible(remote.targetZ);
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

  return {
    skinConfigs,
    localChibi,
    avatar,
    figure,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    basketball,
    remotePlayers,
    applySkinToChibi,
    applyRemoteState,
    syncRemotePlayers,
    setRemoteAction,
    updateRemotePlayers,
    removeRemotePlayer,
    clearRemotePlayers: () => [...remotePlayers.keys()].forEach(removeRemotePlayer)
  };
}
