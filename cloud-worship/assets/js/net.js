const HEARTBEAT_INTERVAL = 15000;
const HEARTBEAT_TIMEOUT = 42000;

function resolveEndpoint() {
  const params = new URLSearchParams(location.search);
  let explicit = (params.get("ws") || window.CLOUD_TEMPLE_WS || "").trim();
  if (explicit.startsWith("https://")) explicit = `wss://${explicit.slice(8)}`;
  else if (explicit.startsWith("http://")) explicit = `ws://${explicit.slice(7)}`;
  else if (explicit.startsWith("/")) explicit = `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}${explicit}`;
  if (explicit) return explicit;
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "ws://127.0.0.1:3000/ws";
  }
  return "";
}

export function createTempleNetwork(handlers = {}) {
  const endpoint = resolveEndpoint();
  let socket = null;
  let playerId = null;
  let roomId = "lobby";
  let nickname = "香客";
  let reconnectTimer = 0;
  let heartbeatTimer = 0;
  let reconnectAttempts = 0;
  let manualClose = false;
  let switching = false;
  let lastPongAt = 0;
  let lastPosition = null;

  function notify(state, message, extra = {}) {
    handlers.onStatus?.({ state, message, ...extra });
  }

  function clearReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = 0;
  }

  function clearHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = 0;
  }

  function send(payload) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  function startHeartbeat() {
    clearHeartbeat();
    lastPongAt = Date.now();
    heartbeatTimer = setInterval(() => {
      if (Date.now() - lastPongAt > HEARTBEAT_TIMEOUT) {
        socket?.close();
        return;
      }
      send({ type: "ping", at: Date.now() });
    }, HEARTBEAT_INTERVAL);
  }

  function handleMessage(event) {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (!message || typeof message !== "object") return;

    if (message.type === "welcome") {
      playerId = message.playerId;
      reconnectAttempts = 0;
      notify("connected", `已加入房间 ${message.roomId}`, {
        roomId: message.roomId,
        online: message.players?.length || 1
      });
      handlers.onWelcome?.(message);
      return;
    }

    if (message.type === "snapshot") {
      handlers.onSnapshot?.(message.players || [], message.serverTime);
      return;
    }

    if (message.type === "player_join") {
      handlers.onPlayerJoin?.(message.player);
      return;
    }

    if (message.type === "player_leave") {
      handlers.onPlayerLeave?.(message.playerId);
      return;
    }

    if (message.type === "action") {
      handlers.onAction?.(message);
      return;
    }

    if (message.type === "chat") {
      handlers.onChat?.(message);
      return;
    }

    if (message.type === "pong") {
      lastPongAt = Date.now();
      return;
    }

    if (message.type === "error") {
      notify("error", message.message || "联机服务返回错误");
      if (message.code === "room_full") {
        manualClose = true;
        socket?.close();
      }
    }
  }

  function scheduleReconnect() {
    if (manualClose || switching || !endpoint) return;
    clearReconnect();
    const delay = Math.min(10000, 1000 * 2 ** Math.min(reconnectAttempts, 3));
    reconnectAttempts += 1;
    notify("reconnecting", `${Math.round(delay / 1000)} 秒后重连…`);
    reconnectTimer = setTimeout(openSocket, delay);
  }

  function cleanupSocket() {
    clearHeartbeat();
    socket = null;
    playerId = null;
  }

  function openSocket() {
    if (!endpoint) {
      notify("offline", "单机模式 · 配置实时服务后可多人");
      return false;
    }

    clearReconnect();
    clearHeartbeat();
    switching = false;
    manualClose = false;
    notify("connecting", "正在连接多人服务…");
    let currentSocket;
    try {
      currentSocket = new WebSocket(endpoint);
      socket = currentSocket;
    } catch {
      scheduleReconnect();
      return false;
    }

    currentSocket.addEventListener("open", () => {
      if (socket !== currentSocket) return;
      lastPongAt = Date.now();
      startHeartbeat();
      send({
        type: "join",
        roomId,
        nickname,
        x: lastPosition?.x,
        z: lastPosition?.z,
        heading: lastPosition?.heading
      });
    });

    currentSocket.addEventListener("message", event => {
      if (socket === currentSocket) handleMessage(event);
    });

    currentSocket.addEventListener("close", () => {
      if (socket !== currentSocket) return;
      cleanupSocket();
      if (switching) return;
      if (manualClose) {
        notify("offline", "已离开多人房间");
      } else {
        scheduleReconnect();
      }
    });

    currentSocket.addEventListener("error", () => {
      if (socket === currentSocket && !manualClose && !switching) notify("error", "多人服务连接失败");
    });

    return true;
  }

  function connect(options = {}) {
    roomId = String(options.roomId || roomId || "lobby").trim() || "lobby";
    nickname = String(options.nickname || nickname || "香客").trim().slice(0, 16) || "香客";
    if ([options.x, options.z, options.heading].every(Number.isFinite)) {
      lastPosition = { x: Number(options.x), z: Number(options.z), heading: Number(options.heading) };
    }
    manualClose = false;
    reconnectAttempts = 0;
    if (!endpoint) {
      notify("offline", "单机模式 · 配置实时服务后可多人");
      return false;
    }
    if (socket) {
      switching = true;
      manualClose = true;
      socket.close(1000, "switch room");
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        switching = false;
        manualClose = false;
        openSocket();
      }, 80);
      return true;
    }
    return openSocket();
  }

  function disconnect() {
    manualClose = true;
    switching = false;
    clearReconnect();
    clearHeartbeat();
    if (socket) socket.close(1000, "leave room");
    cleanupSocket();
    notify("offline", "已离开多人房间");
  }

  function sendMove(payload) {
    const x = Number(payload.x) || 0;
    const z = Number(payload.z) || 0;
    const heading = Number(payload.heading) || 0;
    lastPosition = { x, z, heading };
    return send({
      type: "move",
      x,
      z,
      heading,
      animation: payload.animation === "walk" ? "walk" : "idle"
    });
  }

  function sendAction(action) {
    return send({ type: "action", action: String(action || "") });
  }

  function sendChat(text) {
    const message = String(text || "").replace(/\s+/g, " ").trim().slice(0, 80);
    if (!message) return false;
    return send({ type: "chat", text: message });
  }

  notify(endpoint ? "idle" : "offline", endpoint ? "可加入多人房间" : "单机模式 · 配置实时服务后可多人");

  return {
    endpoint,
    get configured() { return Boolean(endpoint); },
    get connected() { return socket?.readyState === WebSocket.OPEN; },
    get playerId() { return playerId; },
    connect,
    disconnect,
    sendMove,
    sendAction,
    sendChat
  };
}
