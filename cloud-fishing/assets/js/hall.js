(() => {
  "use strict";

  const SAVE_KEY = "cloud-fishing-save-v1";
  const locations = [
    { id: "stream", name: "清晨溪流", emoji: "🌄", desc: "晨雾雪山与清澈溪流，常见溪流鱼和山泉特产。", unlockCost: 0 },
    { id: "sea", name: "深夜海堤", emoji: "🌉", desc: "星空月光海面，隐藏大型海洋渔获。", unlockCost: 0 },
    { id: "dawnLake", name: "晨雾湖心", emoji: "🌅", desc: "金色晨雾中的宽阔湖面，掠食鱼正在巡游。", unlockCost: 0 },
    { id: "tropicalLagoon", name: "热带珊瑚潟湖", emoji: "🏝️", desc: "透明浅海和珊瑚礁，藏有艳色礁鱼与巨型鱼。", unlockCost: 0 },
    { id: "arcticLake", name: "极北冰湖", emoji: "🏔️", desc: "雪原山影与冷冽冰水，栖息着古老耐寒鱼群。", unlockCost: 0 },
    { id: "mangroveForest", name: "红树林水道", emoji: "🌿", desc: "日落红树气根与泥滩水道，掠食鱼正在巡游。", unlockCost: 0 },
    { id: "glowCave", name: "荧光洞窟湖", emoji: "💠", desc: "蓝紫荧光地下湖，透明与发光鱼群清晰可见。", unlockCost: 0 }
  ];
  const totalFish = 51;

  const els = {
    date: document.getElementById("hall-date"),
    time: document.getElementById("hall-time"),
    coins: document.getElementById("hall-coins"),
    catches: document.getElementById("hall-catches"),
    earned: document.getElementById("summary-earned"),
    catchesSummary: document.getElementById("summary-catches"),
    collection: document.getElementById("summary-collection"),
    locations: document.getElementById("hall-locations")
  };

  function loadSave() {
    const fallback = {
      coins: 0,
      activeLocationId: "stream",
      bag: [],
      caughtCounts: {},
      totalCatches: 0,
      totalEarned: 0,
  };
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      const save = { ...fallback, ...parsed };
      if (save.activeLocationId === "pond") save.activeLocationId = "stream";
      return save;
    } catch {
      return fallback;
    }
  }

  function persist(save) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }

  function isUnlocked(save, location) {
    return location.unlockCost === 0 || save.caughtCounts[`unlock:${location.id}`] === 1;
  }

  function selectLocation(save, location) {
    save.activeLocationId = location.id;
    persist(save);
    window.location.href = "fishing.html";
  }

  function render(save) {
    els.coins.textContent = save.coins.toLocaleString();
    els.catches.textContent = save.totalCatches.toLocaleString();
    els.catchesSummary.textContent = save.totalCatches.toLocaleString();
    els.earned.textContent = save.totalEarned.toLocaleString();
    const found = Object.keys(save.caughtCounts).filter((key) => !key.startsWith("unlock:")).length;
    els.collection.textContent = `${Math.min(found, totalFish)}/${totalFish}`;

    els.locations.innerHTML = "";
    for (const location of locations) {
      const unlocked = isUnlocked(save, location);
      const card = document.createElement("article");
      card.className = `hall-location${location.id === save.activeLocationId ? " active" : ""}${unlocked ? "" : " locked"}`;
      card.innerHTML = `
        <div class="hall-location-top">
          <span class="location-emoji">${location.emoji}</span>
          <strong>${location.name}</strong>
        </div>
        <p>${location.desc}</p>
        <small>${unlocked ? (location.id === save.activeLocationId ? "当前选中" : "已解锁") : `解锁需 ${location.unlockCost} 金币`}</small>
        <button class="shop-button" type="button" ${!unlocked && save.coins < location.unlockCost ? "disabled" : ""}>
          ${unlocked ? "选择钓场" : "立即解锁"}
        </button>
      `;
      card.querySelector("button").addEventListener("click", () => selectLocation(save, location));
      els.locations.append(card);
    }
  }

  function renderClock() {
    const now = new Date();
    els.date.textContent = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit", weekday: "short"
    }).format(now);
    els.time.textContent = new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
    }).format(now);
  }

  const save = loadSave();
  render(save);
  renderClock();
  setInterval(renderClock, 1000);
})();
