(() => {
  "use strict";

  const SAVE_KEY = "food-fun-party-v1";
  const TRUTHS = [
    "上次啪啪啪啥时候？",
    "内裤什么颜色？",
    "有什么性癖？",
    "最近一次让你心动到慌乱的瞬间是什么？",
    "在场谁最不符合你的理想型，但你却觉得很有魅力？",
    "你最近一次暧昧聊天停在了哪一句？",
    "你会因为对方哪个小动作瞬间破防？",
    "如果只能私下选一个人喝午夜第一杯，你会选谁？",
    "你最近做过哪件不想被长辈知道的心动小事？",
    "你觉得自己最容易在哪种夜晚动心？",
    "如果今晚必须给一个人发匿名情书，你会选谁？",
    "你最近一次偷看某人动态是在想什么？",
    "用三句话描述你理想中的暧昧夜晚，只说氛围。",
    "在场谁最像会突然出现在你梦里的人？",
    "你上一次心跳失控，是因为一句话还是一个眼神？",
    "你最容易原谅心动对象的哪句坏话？",
    "如果今晚只能选一个人聊到天亮，你会选谁？"
  ];
  const DARES = [
    "选一人进行 8 秒深情对视。",
    "用最温柔的语气给右边的人念一句情话。",
    "把最近想对某个人说却没说出口的话，换成第三人称讲出来。",
    "选一人合唱一句情歌副歌。",
    "用偶像剧方式牵着左边的人说一句晚安台词。",
    "向全场公布你最近一次偷看某人社交动态的时间。",
    "经对方同意，凑近耳边说一句只有 TA 能听的话。",
    "选一人和你配合完成三秒慢动作靠近。",
    "用低音把一句土味情话说得像电影告白。",
    "给全场每个人发一个只属于 TA 的浪漫称号。",
    "选一人一起演 10 秒机场告别的名场面。",
    "用歌声把刚才的心跳感受唱出来。",
    "选一人交换手机壁纸展示 5 秒，不展示聊天内容。",
    "把你的理想约会画面现场导演成 15 秒小剧场。",
    "让左边的人给你出一句告白台词，你必须深情念完。",
    "选一人一起摆一张电影海报级别的合影姿势。"
  ];
  const FINGER_COMMANDS = [
    { text: "抓手指", color: "amber" },
    { text: "举左手", color: "cyan" },
    { text: "摸鼻子", color: "rose" },
    { text: "站起来", color: "green" },
    { text: "指天", color: "violet" }
  ];

  const els = {
    playerForm: document.getElementById("player-form"),
    playerName: document.getElementById("player-name"),
    playerList: document.getElementById("player-list"),
    playerCount: document.getElementById("player-count"),
    playerTip: document.getElementById("player-tip"),
    resetRoom: document.getElementById("reset-room"),
    tabs: [...document.querySelectorAll(".game-tab")],
    panels: [...document.querySelectorAll(".game-panel")],
    finger: {
      start: document.getElementById("finger-start"),
      command: document.getElementById("finger-command"),
      commandCard: document.getElementById("finger-command-card")
    },
    dice: {
      count: document.getElementById("dice-count"),
      roll: document.getElementById("dice-roll"),
      reset: document.getElementById("dice-reset"),
      table: document.getElementById("dice-table"),
      total: document.getElementById("dice-total")
    },
    truth: {
      player: document.getElementById("truth-player"),
      type: document.getElementById("truth-type"),
      text: document.getElementById("truth-text"),
      truthButton: document.getElementById("truth-button"),
      dareButton: document.getElementById("dare-button")
    },
    bomb: {
      form: document.getElementById("bomb-form"),
      guess: document.getElementById("bomb-guess"),
      newGame: document.getElementById("bomb-new"),
      low: document.getElementById("bomb-low"),
      high: document.getElementById("bomb-high"),
      player: document.getElementById("bomb-player"),
      message: document.getElementById("bomb-message")
    },
    wheel: {
      start: document.getElementById("wheel-start"),
      wheel: document.getElementById("wheel"),
      result: document.getElementById("wheel-result"),
      message: document.getElementById("wheel-message")
    }
  };

  let save = loadSave();
  let fingerTimer = null;
  let diceTimer = null;
  let wheelSpinning = false;
  let currentRotation = 0;

  function loadSave() {
    const fallback = { players: [] };
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      return { ...fallback, ...parsed };
    } catch {
      return fallback;
    }
  }

  function persist() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }

  function uniquePlayers() {
    return [...new Set(save.players.map(name => name.trim()).filter(Boolean))];
  }

  function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function randomPlayer() {
    const players = uniquePlayers();
    return players.length ? randomItem(players) : "";
  }

  function setDisabled(disabled) {
    els.finger.start.disabled = disabled;
    els.truth.truthButton.disabled = disabled;
    els.truth.dareButton.disabled = disabled;
    els.bomb.newGame.disabled = disabled;
    els.wheel.start.disabled = disabled;
    els.dice.roll.disabled = false;
  }

  function renderPlayers() {
    const players = uniquePlayers();
    save.players = players;
    persist();
    els.playerCount.textContent = players.length;
    els.playerList.innerHTML = "";
    els.playerTip.textContent = players.length < 2
      ? "至少添加 2 名玩家后开始游戏。"
      : `已准备 ${players.length} 名玩家，可以开始任意游戏。`;

    for (const name of players) {
      const chip = document.createElement("span");
      chip.className = "player-chip";
      chip.innerHTML = `<strong></strong><button type="button" aria-label="删除玩家">×</button>`;
      chip.querySelector("strong").textContent = name;
      chip.querySelector("button").addEventListener("click", () => {
        if (wheelSpinning) return;
        save.players = uniquePlayers().filter(item => item !== name);
        resetBombIfNeeded();
        renderPlayers();
        renderWheel();
      });
      els.playerList.append(chip);
    }

    setDisabled(players.length < 2);
    renderDice();
    renderWheel();
    if (players.length < 2) {
      els.bomb.player.textContent = "—";
      els.wheel.result.textContent = "—";
      els.wheel.message.textContent = "至少 2 名玩家才能旋转。";
    }
  }

  function showGame(name) {
    els.tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.game === name));
    els.panels.forEach(panel => panel.classList.toggle("active", panel.id === `game-${name}`));
  }

  function startFinger() {
    const players = uniquePlayers();
    if (players.length < 2 || fingerTimer) return;

    els.finger.start.disabled = true;
    els.finger.command.textContent = "3";
    els.finger.commandCard.dataset.color = "";
    let countdown = 3;

    fingerTimer = setInterval(() => {
      countdown -= 1;
      if (countdown > 0) {
        els.finger.command.textContent = countdown;
        return;
      }

      clearInterval(fingerTimer);
      fingerTimer = null;
      const command = randomItem(FINGER_COMMANDS);
      els.finger.command.textContent = command.text;
      els.finger.commandCard.dataset.color = command.color;
      els.finger.start.disabled = false;
    }, 700);
  }

  function diceFace(value) {
    const positions = {
      1: [5],
      2: [1, 9],
      3: [1, 5, 9],
      4: [1, 3, 7, 9],
      5: [1, 3, 5, 7, 9],
      6: [1, 3, 4, 6, 7, 9]
    };
    return Array.from({ length: 9 }, (_, index) => {
      const cell = document.createElement("span");
      if (positions[value].includes(index + 1)) cell.className = "pip";
      return cell;
    });
  }

  function renderDice(values = []) {
    const count = Number(els.dice.count.value);
    els.dice.table.innerHTML = "";
    for (let index = 0; index < count; index += 1) {
      const value = values[index] || 1;
      const dice = document.createElement("div");
      dice.className = "dice";
      dice.append(...diceFace(value));
      els.dice.table.append(dice);
    }
    els.dice.total.textContent = values.length ? values.reduce((sum, value) => sum + value, 0) : 0;
  }

  function rollDice() {
    if (diceTimer) return;
    const count = Number(els.dice.count.value);
    const diceElements = els.dice.table.querySelectorAll(".dice");
    diceElements.forEach(dice => dice.classList.add("rolling"));
    els.dice.roll.disabled = true;
    let elapsed = 0;

    diceTimer = setInterval(() => {
      elapsed += 90;
      const values = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 6));
      els.dice.table.innerHTML = "";
      values.forEach(value => {
        const dice = document.createElement("div");
        dice.className = "dice rolling";
        dice.append(...diceFace(value));
        els.dice.table.append(dice);
      });

      if (elapsed >= 1000) {
        clearInterval(diceTimer);
        diceTimer = null;
        renderDice(values);
        els.dice.roll.disabled = false;
      }
    }, 90);
  }

  function showTruth(type) {
    const players = uniquePlayers();
    if (players.length < 2) return;
    const prompts = type === "truth" ? TRUTHS : DARES;
    els.truth.player.textContent = randomPlayer();
    els.truth.type.textContent = type === "truth" ? "心动真心话" : "心动大冒险";
    els.truth.text.textContent = randomItem(prompts);
  }

  function resetBombIfNeeded() {
    if (save.bomb?.active) {
      save.bomb.active = false;
      persist();
    }
    els.bomb.low.textContent = "1";
    els.bomb.high.textContent = "100";
    els.bomb.player.textContent = "—";
    els.bomb.message.textContent = "点击「新一局」开始。";
    els.bomb.message.className = "player-tip";
  }

  function startBomb() {
    const players = uniquePlayers();
    if (players.length < 2) return;
    save.bomb = {
      answer: 1 + Math.floor(Math.random() * 100),
      low: 1,
      high: 100,
      turn: Math.floor(Math.random() * players.length),
      active: true
    };
    persist();
    els.bomb.low.textContent = "1";
    els.bomb.high.textContent = "100";
    els.bomb.player.textContent = players[save.bomb.turn];
    els.bomb.message.textContent = "炸弹已放好，轮流猜数。";
    els.bomb.message.className = "player-tip";
    els.bomb.guess.focus();
  }

  function nextBombPlayer() {
    const players = uniquePlayers();
    save.bomb.turn = (save.bomb.turn + 1) % players.length;
    els.bomb.player.textContent = players[save.bomb.turn];
    persist();
  }

  function guessBomb(event) {
    event.preventDefault();
    const players = uniquePlayers();
    if (!save.bomb?.active || players.length < 2) return;

    const value = Number(els.bomb.guess.value);
    if (!Number.isInteger(value) || value < save.bomb.low || value > save.bomb.high) {
      els.bomb.message.textContent = `请输入 ${save.bomb.low} 到 ${save.bomb.high} 之间的数字。`;
      els.bomb.message.className = "player-tip";
      return;
    }

    if (value === save.bomb.answer) {
      const caught = players[save.bomb.turn];
      els.bomb.message.textContent = `${caught} 踩中炸弹 ${save.bomb.answer}！`;
      els.bomb.message.className = "player-tip hit";
      save.bomb.active = false;
      persist();
      return;
    }

    if (value < save.bomb.answer) {
      save.bomb.low = value + 1;
      els.bomb.low.textContent = save.bomb.low;
      els.bomb.message.textContent = "安全，范围缩小了。";
      els.bomb.message.className = "player-tip safe";
    } else {
      save.bomb.high = value - 1;
      els.bomb.high.textContent = save.bomb.high;
      els.bomb.message.textContent = "安全，范围缩小了。";
      els.bomb.message.className = "player-tip safe";
    }

    persist();
    els.bomb.guess.value = "";
    nextBombPlayer();
  }

  function colorAt(index, total) {
    const hue = (index * (300 / total) + 40) % 360;
    return `hsl(${hue} 76% 63%)`;
  }

  function renderWheel() {
    const players = uniquePlayers();
    els.wheel.wheel.innerHTML = "";
    if (players.length < 2) {
      els.wheel.wheel.style.background = "var(--panel-strong)";
      return;
    }

    const segment = 360 / players.length;
    const colors = players.map((_, index) => colorAt(index, players.length));
    els.wheel.wheel.style.background = `conic-gradient(${players.map((name, index) => {
      const start = index * segment;
      const end = (index + 1) * segment;
      return `${colors[index]} ${start}deg ${end}deg`;
    }).join(", ")})`;

    players.forEach((name, index) => {
      const label = document.createElement("span");
      label.className = "wheel-label";
      label.textContent = name;
      label.style.transform = `rotate(${index * segment + segment / 2}deg)`;
      els.wheel.wheel.append(label);
    });
  }

  function spinWheel() {
    const players = uniquePlayers();
    if (players.length < 2 || wheelSpinning) return;

    wheelSpinning = true;
    els.wheel.start.disabled = true;
    els.wheel.result.textContent = "转动中...";
    const segment = 360 / players.length;
    const targetIndex = Math.floor(Math.random() * players.length);
    const targetAngle = 1800 + (360 - targetIndex * segment - segment / 2);
    currentRotation += targetAngle;
    els.wheel.wheel.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
      wheelSpinning = false;
      els.wheel.start.disabled = false;
      els.wheel.result.textContent = players[targetIndex];
      els.wheel.message.textContent = "转盘选中了下一位。";
    }, 5300);
  }

  function resetRoom() {
    if (fingerTimer) {
      clearInterval(fingerTimer);
      fingerTimer = null;
    }
    if (diceTimer) {
      clearInterval(diceTimer);
      diceTimer = null;
    }
    save = { players: [] };
    persist();
    els.finger.command.textContent = "等待开始";
    els.finger.commandCard.dataset.color = "";
    renderDice();
    resetBombIfNeeded();
    renderPlayers();
    els.truth.player.textContent = "—";
    els.truth.type.textContent = "等待开始";
    els.truth.text.textContent = "选择真心话或大冒险。";
  }

  els.playerForm.addEventListener("submit", event => {
    event.preventDefault();
    const name = els.playerName.value.trim();
    if (!name) return;
    save.players = [...uniquePlayers(), name].slice(0, 24);
    els.playerName.value = "";
    renderPlayers();
  });

  els.resetRoom.addEventListener("click", resetRoom);
  els.tabs.forEach(tab => tab.addEventListener("click", () => showGame(tab.dataset.game)));
  els.finger.start.addEventListener("click", startFinger);
  els.dice.count.addEventListener("change", renderDice);
  els.dice.roll.addEventListener("click", rollDice);
  els.dice.reset.addEventListener("click", () => renderDice());
  els.truth.truthButton.addEventListener("click", () => showTruth("truth"));
  els.truth.dareButton.addEventListener("click", () => showTruth("dare"));
  els.bomb.form.addEventListener("submit", guessBomb);
  els.bomb.newGame.addEventListener("click", startBomb);
  els.wheel.start.addEventListener("click", spinWheel);

  renderPlayers();
  renderDice();
  renderWheel();
})();
