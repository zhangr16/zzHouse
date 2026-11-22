const http = require("node:http");
const crypto = require("node:crypto");
const { WebSocketServer, WebSocket } = require("ws");

const requestedPort = Number(process.env.PORT || 3000);
const PORT = Number.isFinite(requestedPort) ? requestedPort : 3000;
const requestedMaxPlayers = Number(process.env.MAX_PLAYERS || 10);
const MAX_PLAYERS = Number.isFinite(requestedMaxPlayers)
  ? Math.max(2, Math.min(20, Math.floor(requestedMaxPlayers)))
  : 10;
const SNAPSHOT_INTERVAL = 100;
const PLAYER_TIMEOUT = 45000;
const ACTION_DURATIONS = {
  pray: 7600,
  dance: 9200,
  bell: 1400,
  woodfish: 2200,
  incense: 6400
};
const BOUNDS = { minX: -12, maxX: 12, minZ: -3.3, maxZ: 15.3 };
const rooms = new Map();

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeAngle(value) {
  return Math.atan2(Math.sin(value), Math.cos(value));
}

function sanitizeText(value, maxLength) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

function normalizeRoomId(value) {
  return sanitizeText(value, 24).replace(/[^\p{L}\p{N}_-]/gu, "") || "lobby";
}

function send(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function broadcast(room, payload, exceptPlayerId = null) {
  const data = JSON.stringify(payload);
  for (const player of room.players.values()) {
    if (player.id !== exceptPlayerId && player.socket.readyState === WebSocket.OPEN) {
      player.socket.send(data);
    }
  }
}

function publicPlayer(player) {
  const actionActive = player.actionUntil > Date.now();
  return {
    id: player.id,
    nickname: player.nickname,
    x: Math.round(player.x * 1000) / 1000,
    z: Math.round(player.z * 1000) / 1000,
    heading: Math.round(player.heading * 1000) / 1000,
    animation: actionActive ? player.actionAnimation : player.animation
  };
}

function getRoom(roomId) {
  let room = rooms.get(roomId);
  if (!room) {
    room = { id: roomId, players: new Map(), createdAt: Date.now() };
    rooms.set(roomId, room);
  }
  return room;
}

function getPlayerBySocket(socket) {
  if (!socket.roomId || !socket.playerId) return null;
  return rooms.get(socket.roomId)?.players.get(socket.playerId) || null;
}

function removePlayer(player) {
  const room = rooms.get(player.roomId);
  if (!room || !room.players.delete(player.id)) return;
  broadcast(room, { type: "player_leave", playerId: player.id });
  if (!room.players.size) rooms.delete(room.id);
}

function handleJoin(socket, message) {
  if (socket.playerId) return;
  const roomId = normalizeRoomId(message.roomId);
  const nickname = sanitizeText(message.nickname, 16) || "香客";
  const room = getRoom(roomId);

  if (room.players.size >= MAX_PLAYERS) {
    send(socket, { type: "error", code: "room_full", message: "房间已满" });
    socket.close(4003, "room full");
    return;
  }

  const spawnX = Number(message.x);
  const spawnZ = Number(message.z);
  const spawnHeading = Number(message.heading);
  const hasSpawn = [spawnX, spawnZ, spawnHeading].every(Number.isFinite);

  const player = {
    id: crypto.randomUUID(),
    roomId,
    socket,
    nickname,
    x: hasSpawn ? clamp(spawnX, BOUNDS.minX, BOUNDS.maxX) : 0,
    z: hasSpawn ? clamp(spawnZ, BOUNDS.minZ, BOUNDS.maxZ) : 3,
    heading: hasSpawn ? normalizeAngle(spawnHeading) : Math.PI,
    animation: "idle",
    actionAnimation: null,
    actionUntil: 0,
    lastSeen: Date.now(),
    lastMoveAt: Date.now()
  };

  room.players.set(player.id, player);
  socket.roomId = roomId;
  socket.playerId = player.id;

  send(socket, {
    type: "welcome",
    playerId: player.id,
    roomId,
    serverTime: Date.now(),
    players: [...room.players.values()].map(publicPlayer)
  });
  broadcast(room, { type: "player_join", player: publicPlayer(player) }, player.id);
}

function handleMove(player, message) {
  const x = Number(message.x);
  const z = Number(message.z);
  const heading = Number(message.heading);
  if (![x, z, heading].every(Number.isFinite)) return;

  const now = Date.now();
  const elapsed = clamp((now - player.lastMoveAt) / 1000, 0.03, 1);
  const nextX = clamp(x, BOUNDS.minX, BOUNDS.maxX);
  const nextZ = clamp(z, BOUNDS.minZ, BOUNDS.maxZ);
  const maxDistance = 2.2 + elapsed * 3.5;
  if (Math.hypot(nextX - player.x, nextZ - player.z) > maxDistance) return;

  player.x = nextX;
  player.z = nextZ;
  player.heading = normalizeAngle(heading);
  player.animation = message.animation === "walk" ? "walk" : "idle";
  player.lastSeen = now;
  player.lastMoveAt = now;
}

function handleAction(player, message) {
  const action = String(message.action || "");
  const duration = ACTION_DURATIONS[action];
  if (!duration) return;

  const room = rooms.get(player.roomId);
  if (!room) return;

  player.actionAnimation = action;
  player.actionUntil = Date.now() + duration;
  player.lastSeen = Date.now();
  broadcast(room, {
    type: "action",
    playerId: player.id,
    animation: action,
    duration
  }, player.id);
}

const server = http.createServer((request, response) => {
  if (request.url === "/healthz") {
    response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    response.end("ok");
    return;
  }
  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("not found");
});

const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 16 * 1024 });
wss.on("connection", socket => {
  socket.isAlive = true;
  socket.on("pong", () => {
    socket.isAlive = true;
    const player = getPlayerBySocket(socket);
    if (player) player.lastSeen = Date.now();
  });

  socket.on("message", raw => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!message || typeof message !== "object") return;

    const player = getPlayerBySocket(socket);
    if (!player && message.type !== "join") {
      send(socket, { type: "error", code: "join_required", message: "请先加入房间" });
      return;
    }

    if (message.type === "join") handleJoin(socket, message);
    else if (message.type === "move" && player) handleMove(player, message);
    else if (message.type === "action" && player) handleAction(player, message);
    else if (message.type === "ping" && player) {
      player.lastSeen = Date.now();
      send(socket, { type: "pong", serverTime: Date.now() });
    }
  });

  socket.on("close", () => {
    const player = getPlayerBySocket(socket);
    if (player) removePlayer(player);
  });
  socket.on("error", () => {});
});

const snapshotTimer = setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (!room.players.size) continue;
    broadcast(room, {
      type: "snapshot",
      serverTime: now,
      players: [...room.players.values()].map(publicPlayer)
    });
  }
}, SNAPSHOT_INTERVAL);

const heartbeatTimer = setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    for (const player of [...room.players.values()]) {
      if (now - player.lastSeen > PLAYER_TIMEOUT) {
        player.socket.terminate();
        removePlayer(player);
      } else if (player.socket.readyState === WebSocket.OPEN) {
        player.socket.ping();
      }
    }
  }
}, 15000);

function shutdown() {
  clearInterval(snapshotTimer);
  clearInterval(heartbeatTimer);
  for (const room of rooms.values()) {
    for (const player of room.players.values()) player.socket.close(1001, "server shutdown");
  }
  wss.close(() => server.close(() => process.exit(0)));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.listen(PORT, () => {
  console.log(`temple-realtime listening on ${PORT}, max players per room: ${MAX_PLAYERS}`);
});
