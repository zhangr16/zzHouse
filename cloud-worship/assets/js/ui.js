export function createUI({ onChatOpen } = {}) {
  const elements = {
    app: document.getElementById("temple-app"),
    canvas: document.getElementById("temple-canvas"),
    overlay: document.getElementById("loading-overlay"),
    toast: document.getElementById("toast"),
    prayButton: document.getElementById("pray-button"),
    bellButton: document.getElementById("bell-button"),
    woodfishButton: document.getElementById("woodfish-button"),
    oracleButton: document.getElementById("oracle-button"),
    releaseButton: document.getElementById("release-button"),
    pickupButton: document.getElementById("pickup-button"),
    incenseButton: document.getElementById("incense-button"),
    danceButton: document.getElementById("dance-button"),
    musicButton: document.getElementById("music-button"),
    fortunePanel: document.getElementById("fortune-panel"),
    zodiacPanel: document.getElementById("zodiac-panel"),
    weatherPanel: document.getElementById("weather-panel"),
    fortuneClose: document.getElementById("fortune-close"),
    chatToggle: document.getElementById("chat-toggle"),
    chatPanel: document.getElementById("chat-panel"),
    chatMessages: document.getElementById("chat-messages"),
    chatForm: document.getElementById("chat-form"),
    chatInput: document.getElementById("chat-input"),
    chatClose: document.getElementById("chat-close"),
    chatUnread: document.getElementById("chat-unread"),
    joystickBase: document.getElementById("joystick-base"),
    joystickKnob: document.getElementById("joystick-knob"),
    virtualJoystick: document.getElementById("virtual-joystick"),
    skinButton: document.getElementById("skin-button"),
    skinPanel: document.getElementById("skin-panel"),
    skinGrid: document.getElementById("skin-grid"),
    timeIndicator: document.getElementById("time-indicator")
  };

  let toastTimer = 0;
  let unreadChatCount = 0;
  let getNetwork = () => null;
  let chatOpenHandler = onChatOpen;
  const chatHistory = [];

  function showToast(message) {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    toastTimer = 2.2;
  }

  function update(delta) {
    if (toastTimer > 0) {
      toastTimer -= delta;
      if (toastTimer <= 0) elements.toast?.classList.remove("show");
    }
  }

  function setNetworkStatus({ state, message }) {
    if (state === "error" || state === "reconnecting") {
      elements.chatToggle?.classList.add("network-offline");
    } else {
      elements.chatToggle?.classList.toggle("network-offline", state === "offline");
    }
    elements.chatToggle?.setAttribute("aria-label", message || "房间聊天");
  }

  function formatChatTime(value) {
    const date = new Date(Number(value) || Date.now());
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  function updateChatUnread() {
    if (!elements.chatUnread) return;
    elements.chatUnread.hidden = unreadChatCount === 0;
    elements.chatUnread.textContent = unreadChatCount > 99 ? "99+" : String(unreadChatCount);
  }

  function scrollChatToBottom() {
    if (elements.chatMessages) elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  }

  function appendChatMessage(message, options = {}) {
    const text = String(message?.text || "").replace(/\s+/g, " ").trim().slice(0, 80);
    if (!text || !elements.chatMessages) return;
    elements.chatMessages.querySelector(".chat-empty")?.remove();
    const item = document.createElement("div");
    item.className = "chat-message";
    if (message.playerId === getNetwork()?.playerId) item.classList.add("self");
    const head = document.createElement("div");
    head.className = "chat-message-head";
    const author = document.createElement("strong");
    author.textContent = message.nickname || "香客";
    const time = document.createElement("time");
    time.textContent = formatChatTime(message.at);
    const body = document.createElement("p");
    body.textContent = text;
    head.append(author, time);
    item.append(head, body);
    elements.chatMessages.append(item);
    chatHistory.push({ ...message, text });
    while (chatHistory.length > 50) {
      chatHistory.shift();
      elements.chatMessages.firstElementChild?.remove();
    }
    if (!options.silent && elements.chatPanel.hidden) {
      unreadChatCount += 1;
      updateChatUnread();
    }
    if (!elements.chatPanel.hidden || options.forceScroll) scrollChatToBottom();
  }

  function renderChatHistory(messages) {
    if (!elements.chatMessages) return;
    chatHistory.length = 0;
    elements.chatMessages.replaceChildren();
    const entries = Array.isArray(messages) ? messages.slice(-50) : [];
    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "chat-empty";
      empty.textContent = "还没有人说话，先打个招呼吧。";
      elements.chatMessages.append(empty);
    } else {
      entries.forEach(message => appendChatMessage(message, { silent: true }));
    }
    unreadChatCount = 0;
    updateChatUnread();
    requestAnimationFrame(scrollChatToBottom);
  }

  function setChatPanel(open) {
    if (!elements.chatPanel || !elements.chatToggle) return;
    elements.chatPanel.hidden = !open;
    elements.chatToggle.setAttribute("aria-expanded", String(open));
    elements.app?.classList.toggle("chat-open", open);
    if (open) {
      chatOpenHandler?.();
      unreadChatCount = 0;
      updateChatUnread();
      requestAnimationFrame(() => {
        scrollChatToBottom();
        elements.chatInput?.focus({ preventScroll: true });
      });
    } else {
      elements.chatInput?.blur();
    }
  }

  function sendChatFromUI() {
    const text = elements.chatInput?.value.replace(/\s+/g, " ").trim() || "";
    if (!text) return;
    const network = getNetwork();
    if (!network?.connected) {
      showToast("当前为单机模式，联机后即可聊天。");
      return;
    }
    if (!network.sendChat(text)) {
      showToast("消息发送失败，请检查联机状态。");
      return;
    }
    elements.chatInput.value = "";
  }

  function bindChat(networkGetter, openHandler = chatOpenHandler) {
    getNetwork = networkGetter;
    chatOpenHandler = openHandler;
    elements.chatToggle?.addEventListener("click", () => setChatPanel(elements.chatPanel.hidden));
    elements.chatClose?.addEventListener("click", () => setChatPanel(false));
    elements.chatForm?.addEventListener("submit", event => {
      event.preventDefault();
      sendChatFromUI();
    });
    elements.chatInput?.addEventListener("focus", () => chatOpenHandler?.());
    renderChatHistory([]);
  }

  return {
    elements,
    showToast,
    update,
    setNetworkStatus,
    appendChatMessage,
    renderChatHistory,
    setChatPanel,
    bindChat
  };
}
