import * as THREE from "three";
import { createTempleNetwork } from "./net.js?v=20261123hallfix";
import { detectQuality } from "./quality.js?v=20261123hallfix";
import { createTempleScene } from "./scene.js?v=20261123hallfix";
import { createAvatarSystem } from "./avatar.js?v=20261123hallfix";
import { createEffects } from "./effects.js?v=20261123hallfix";
import { createAudioSystem } from "./audio.js?v=20261123hallfix";
import { createUI } from "./ui.js?v=20261123hallfix";
import { createInteractions } from "./interactions.js?v=20261123hallfix";
import { createModelSystem } from "./models.js?v=20261123hallfix";

const quality = detectQuality();
const ui = createUI();
const sceneApi = createTempleScene({
  canvas: ui.elements.canvas,
  quality,
  notify: ui.showToast
});
const models = createModelSystem({
  quality,
  notify: ui.showToast,
  exteriorGroup: sceneApi.exteriorGroup,
  interiorGroup: sceneApi.interiorGroup,
  groundLevel: sceneApi.groundLevel,
  colliders: sceneApi.colliders,
  fallbacks: sceneApi.glbFallbacks
});
let network = null;
const avatarApi = createAvatarSystem({
  scene: sceneApi.scene,
  groundLevel: sceneApi.groundLevel,
  quality,
  getPlayerId: () => network?.playerId
});
const audio = createAudioSystem({
  musicButton: ui.elements.musicButton,
  notify: ui.showToast
});
const effects = createEffects({
  renderer: sceneApi.renderer,
  scene: sceneApi.scene,
  camera: sceneApi.camera,
  quality,
  flames: sceneApi.flames,
  bell: sceneApi.bell,
  windGroups: sceneApi.windGroups,
  koi: sceneApi.koi,
  groundLevel: sceneApi.groundLevel,
  interiorGroup: sceneApi.interiorGroup,
  exteriorGroup: sceneApi.exteriorGroup,
  notify: ui.showToast
});
const interactions = createInteractions({
  elements: ui.elements,
  ui,
  sceneApi,
  avatarApi,
  effects,
  audio,
  models,
  getNetwork: () => network
});

function saveLocalValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function connectToLobby() {
  const nickname = `香客${Math.floor(1000 + Math.random() * 9000)}`;
  const roomId = "lobby";
  saveLocalValue("cloud-worship-nickname", nickname);
  saveLocalValue("cloud-worship-room", roomId);
  if (!network?.configured) return;
  network.connect({
    nickname,
    roomId,
    x: interactions.position.x,
    z: interactions.position.z,
    heading: interactions.heading
  });
}

network = createTempleNetwork({
  onStatus: status => {
    ui.setNetworkStatus(status);
    if (status.state === "offline") avatarApi.clearRemotePlayers();
  },
  onWelcome: message => {
    ui.setNetworkStatus({ state: "connected", message: `房间 ${message.roomId}` });
    avatarApi.syncRemotePlayers(message.players || []);
    ui.renderChatHistory(message.messages || []);
  },
  onSnapshot: players => avatarApi.syncRemotePlayers(players),
  onPlayerJoin: player => {
    if (player.id === network.playerId) return;
    avatarApi.applyRemoteState(player);
  },
  onPlayerLeave: playerId => avatarApi.removeRemotePlayer(playerId),
  onAction: avatarApi.setRemoteAction,
  onChat: message => ui.appendChatMessage(message)
});

ui.bindChat(() => network, interactions.resetInput);
if (network.configured) connectToLobby();

addEventListener("resize", () => effects.resize());
effects.resize();

const clock = new THREE.Clock();
let lastNetworkMove = 0;
let firstFrame = true;

function animate() {
  requestAnimationFrame(animate);
  if (document.hidden) return;
  const delta = Math.min(clock.getDelta(), .05);
  const elapsed = clock.elapsedTime;
  interactions.update(delta);
  avatarApi.updateRemotePlayers(delta);
  effects.update(delta, elapsed, interactions.state.bellTimer);
  sceneApi.updatePond(delta, elapsed);
  ui.update(delta);

  const now = performance.now();
  if (now - lastNetworkMove >= 100) {
    lastNetworkMove = now;
    const moving = interactions.velocity.length() > .06 && !interactions.isBusy();
    network?.sendMove({
      x: interactions.position.x,
      z: interactions.position.z,
      heading: interactions.heading,
      animation: moving ? "walk" : "idle"
    });
  }
  effects.render();

  if (firstFrame) {
    firstFrame = false;
    requestAnimationFrame(() => {
      ui.elements.overlay.classList.add("hidden");
      sceneApi.schedulePbrWarmup();
      models.preloadArea(sceneApi.getTempleArea());
      ui.showToast("先沿石径进入大殿，再取香、上香。");
    });
  }
}

animate();
