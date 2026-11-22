(() => {
  "use strict";

  const SAVE_KEY = "cloud-fishing-save-v1";
  const RARITY_LABELS = {
    common: "普通",
    rare: "稀有",
    epic: "史诗",
    legendary: "传说"
  };

  const fish = {
    crucian: { id: "crucian", name: "鲫鱼", emoji: "🐟", rarity: "common", minWeight: 0.2, maxWeight: 0.8, price: 12 },
    grassCarp: { id: "grassCarp", name: "草鱼", emoji: "🐠", rarity: "common", minWeight: 0.8, maxWeight: 2.4, price: 18 },
    blackCarp: { id: "blackCarp", name: "青鱼", emoji: "🐡", rarity: "rare", minWeight: 2, maxWeight: 5, price: 48 },
    koi: { id: "koi", name: "锦鲤", emoji: "🎀", rarity: "epic", minWeight: 1.2, maxWeight: 3.5, price: 160 },
    goldfish: { id: "goldfish", name: "金鱼", emoji: "🐠", rarity: "common", minWeight: 0.1, maxWeight: 0.4, price: 22 },
    pondTurtle: { id: "pondTurtle", name: "古池龟", emoji: "🐢", rarity: "epic", minWeight: 3, maxWeight: 7, price: 260 },
    catfish: { id: "catfish", name: "胡子鲶", emoji: "🐟", rarity: "rare", minWeight: 2.2, maxWeight: 6.8, price: 58 },
    minnow: { id: "minnow", name: "溪鱼", emoji: "🐟", rarity: "common", minWeight: 0.1, maxWeight: 0.5, price: 16 },
    rainbowTrout: { id: "rainbowTrout", name: "虹鳟", emoji: "🌈", rarity: "rare", minWeight: 0.8, maxWeight: 2.2, price: 72 },
    mountainSnail: { id: "mountainSnail", name: "山泉螺", emoji: "🐌", rarity: "common", minWeight: 0.05, maxWeight: 0.2, price: 20 },
    silverSalmon: { id: "silverSalmon", name: "银鲑", emoji: "🐠", rarity: "epic", minWeight: 2.5, maxWeight: 6.5, price: 240 },
    brookChar: { id: "brookChar", name: "红点鲑", emoji: "🐟", rarity: "common", minWeight: 0.4, maxWeight: 1.5, price: 34 },
    crayfish: { id: "crayfish", name: "溪红螯虾", emoji: "🦞", rarity: "rare", minWeight: 0.2, maxWeight: 0.9, price: 88 },
    goldenDorado: { id: "goldenDorado", name: "黄金河虎", emoji: "🐠", rarity: "epic", minWeight: 4, maxWeight: 11, price: 380 },
    sardine: { id: "sardine", name: "沙丁鱼", emoji: "🐟", rarity: "common", minWeight: 0.1, maxWeight: 0.4, price: 24 },
    squid: { id: "squid", name: "小鱿鱼", emoji: "🦑", rarity: "rare", minWeight: 0.3, maxWeight: 1.2, price: 95 },
    bluefin: { id: "bluefin", name: "蓝鳍金枪鱼", emoji: "🐡", rarity: "legendary", minWeight: 12, maxWeight: 42, price: 900 },
    moonJelly: { id: "moonJelly", name: "月光水母", emoji: "🪼", rarity: "epic", minWeight: 0.6, maxWeight: 1.8, price: 320 },
    hammerhead: { id: "hammerhead", name: "锤头鲨", emoji: "🦈", rarity: "legendary", minWeight: 18, maxWeight: 65, price: 1450 },
    kingCrab: { id: "kingCrab", name: "帝王蟹", emoji: "🦀", rarity: "rare", minWeight: 1.5, maxWeight: 5.5, price: 130 },
    oceanSunfish: { id: "oceanSunfish", name: "翻车鱼", emoji: "🐡", rarity: "epic", minWeight: 16, maxWeight: 48, price: 520 },
    lakePerch: { id: "lakePerch", name: "湖鲈", emoji: "🐟", rarity: "common", minWeight: 0.3, maxWeight: 1.8, price: 28 },
    mirrorCarp: { id: "mirrorCarp", name: "镜鲤", emoji: "🐠", rarity: "common", minWeight: 1, maxWeight: 3.2, price: 34 },
    lakeTrout: { id: "lakeTrout", name: "湖鳟", emoji: "🐠", rarity: "rare", minWeight: 1.8, maxWeight: 6.5, price: 88 },
    northernPike: { id: "northernPike", name: "白斑狗鱼", emoji: "🐡", rarity: "epic", minWeight: 4, maxWeight: 12, price: 360 },
    dawnArowana: { id: "dawnArowana", name: "晨雾金龙鱼", emoji: "🐠", rarity: "legendary", minWeight: 7, maxWeight: 18, price: 1050 },
    blueTang: { id: "blueTang", name: "蓝刺尾鱼", emoji: "🐠", rarity: "common", minWeight: 0.2, maxWeight: 0.8, price: 30 },
    yellowTang: { id: "yellowTang", name: "黄高鳍刺尾鱼", emoji: "🐠", rarity: "common", minWeight: 0.25, maxWeight: 0.9, price: 36 },
    coralGrouper: { id: "coralGrouper", name: "珊瑚石斑", emoji: "🐟", rarity: "rare", minWeight: 1.5, maxWeight: 4.8, price: 90 },
    napoleonWrasse: { id: "napoleonWrasse", name: "拿破仑鱼", emoji: "🐡", rarity: "epic", minWeight: 8, maxWeight: 22, price: 480 },
    goldenMahseer: { id: "goldenMahseer", name: "黄金马希鱼", emoji: "🐠", rarity: "legendary", minWeight: 10, maxWeight: 28, price: 1200 },
    polarCod: { id: "polarCod", name: "极地鳕", emoji: "🐟", rarity: "common", minWeight: 0.2, maxWeight: 0.8, price: 28 },
    arcticChar: { id: "arcticChar", name: "北极红点鲑", emoji: "🐠", rarity: "common", minWeight: 0.8, maxWeight: 3, price: 38 },
    glacierGrayling: { id: "glacierGrayling", name: "冰川茴鱼", emoji: "🐟", rarity: "rare", minWeight: 1, maxWeight: 3.2, price: 86 },
    polarCatfish: { id: "polarCatfish", name: "极北巨鲶", emoji: "🐡", rarity: "epic", minWeight: 8, maxWeight: 26, price: 520 },
    iceJewelSalmon: { id: "iceJewelSalmon", name: "冰晶哲罗鲑", emoji: "🐠", rarity: "legendary", minWeight: 8, maxWeight: 24, price: 1280 },
    archerfish: { id: "archerfish", name: "射水鱼", emoji: "🐠", rarity: "common", minWeight: 0.2, maxWeight: 0.9, price: 34 },
    mangroveSnapper: { id: "mangroveSnapper", name: "红树笛鲷", emoji: "🐟", rarity: "common", minWeight: 0.8, maxWeight: 3, price: 48 },
    mudCrab: { id: "mudCrab", name: "泥蟹", emoji: "🦀", rarity: "rare", minWeight: 0.6, maxWeight: 2.8, price: 105 },
    giantSnakehead: { id: "giantSnakehead", name: "线鳢", emoji: "🐡", rarity: "epic", minWeight: 3.5, maxWeight: 12, price: 420 },
    sunsetTarpon: { id: "sunsetTarpon", name: "日影大海鲢", emoji: "🐠", rarity: "legendary", minWeight: 9, maxWeight: 26, price: 1240 },
    caveGlassfish: { id: "caveGlassfish", name: "洞窟玻璃鱼", emoji: "🐠", rarity: "common", minWeight: 0.1, maxWeight: 0.5, price: 30 },
    blindCaveLoach: { id: "blindCaveLoach", name: "盲洞鳅", emoji: "🐟", rarity: "rare", minWeight: 0.3, maxWeight: 1.4, price: 92 },
    lanternBass: { id: "lanternBass", name: "提灯鲈", emoji: "🐠", rarity: "epic", minWeight: 2, maxWeight: 7, price: 365 },
    glowAnglerfish: { id: "glowAnglerfish", name: "荧光鮟鱇", emoji: "🐡", rarity: "legendary", minWeight: 5, maxWeight: 18, price: 1160 },
    crystalCatfish: { id: "crystalCatfish", name: "晶体鲶", emoji: "🐟", rarity: "rare", minWeight: 2.5, maxWeight: 9, price: 180 }
  };

  const weatherFish = {
    sunnyCrucian: {
      id: "sunnyCrucian", name: "晴光金鲫", emoji: "🐠", rarity: "rare",
      minWeight: 0.4, maxWeight: 1.2, price: 130, weatherKind: "clear", habitat: "特殊水域"
    },
    fogPhantomPerch: {
      id: "fogPhantomPerch", name: "雾影幻鲈", emoji: "🐟", rarity: "epic",
      minWeight: 1.2, maxWeight: 3.6, price: 340, weatherKind: "fog", habitat: "特殊水域"
    },
    rainSilverCarp: {
      id: "rainSilverCarp", name: "雨帘银鲤", emoji: "🐠", rarity: "epic",
      minWeight: 1.8, maxWeight: 5.2, price: 390, weatherKind: "rain", habitat: "特殊水域"
    },
    snowCrystalWhitefish: {
      id: "snowCrystalWhitefish", name: "雪晶白鲑", emoji: "🐟", rarity: "epic",
      minWeight: 1.4, maxWeight: 4.4, price: 365, weatherKind: "snow", habitat: "特殊水域"
    },
    thunderStormEel: {
      id: "thunderStormEel", name: "雷暴电鳗", emoji: "🐍", rarity: "legendary",
      minWeight: 4.5, maxWeight: 14, price: 1180, weatherKind: "storm", habitat: "特殊水域"
    }
  };

  const allFish = { ...fish, ...weatherFish };
  const specialFishByWeather = {
    clear: "sunnyCrucian",
    fog: "fogPhantomPerch",
    rain: "rainSilverCarp",
    snow: "snowCrystalWhitefish",
    storm: "thunderStormEel"
  };

  const battleProfiles = {
    steady: {
      id: "steady", label: "稳劲", hint: "稳定收线即可",
      struggle: [0.55, 1.1], calm: [0.6, 1.15], tension: 0.9, pull: 1, drain: 0.9
    },
    runner: {
      id: "runner", label: "突进", hint: "它松劲时很短，抓住机会收线",
      struggle: [0.8, 1.7], calm: [0.32, 0.7], tension: 0.76, pull: 0.98, drain: 1.35
    },
    deep: {
      id: "deep", label: "深潜", hint: "张力涨得快，别长时间硬拉",
      struggle: [0.65, 1.3], calm: [0.75, 1.35], tension: 1.2, pull: 0.82, drain: 0.95
    },
    burst: {
      id: "burst", label: "爆发", hint: "挣扎又快又猛，及时松手泄力",
      struggle: [0.28, 0.65], calm: [0.75, 1.45], tension: 1.44, pull: 0.9, drain: 1.85
    },
    slippery: {
      id: "slippery", label: "滑窜", hint: "收线很慢，脱钩速度很快",
      struggle: [0.45, 0.95], calm: [0.4, 0.9], tension: 0.9, pull: 0.76, drain: 1.7
    }
  };

  const locations = [
    {
      id: "stream", name: "清晨溪流", emoji: "🌄", desc: "水清流急，常见溪流鱼，偶尔能遇到山泉特产。",
      unlockCost: 0, table: [["minnow", 25], ["brookChar", 20], ["mountainSnail", 17], ["rainbowTrout", 15], ["crucian", 14], ["grassCarp", 10], ["crayfish", 11], ["silverSalmon", 8], ["goldenDorado", 4]]
    },
    {
      id: "sea", name: "深夜海堤", emoji: "🌉", desc: "海风与灯光下，藏着一整片未知的海域。",
      unlockCost: 0, table: [["sardine", 25], ["kingCrab", 20], ["squid", 17], ["moonJelly", 14], ["oceanSunfish", 12], ["bluefin", 8], ["hammerhead", 4]]
    },
    {
      id: "dawnLake", name: "晨雾湖心", emoji: "🌅", desc: "湖面被薄雾与金色晨光覆盖，掠食鱼正在浅水巡游。",
      unlockCost: 0, table: [["lakePerch", 26], ["mirrorCarp", 24], ["goldfish", 16], ["lakeTrout", 20], ["blackCarp", 9], ["northernPike", 12], ["koi", 7], ["pondTurtle", 4], ["dawnArowana", 5]]
    },
    {
      id: "tropicalLagoon", name: "热带珊瑚潟湖", emoji: "🏝️", desc: "透蓝浅海与珊瑚礁相接，色彩艳丽的大型鱼藏在礁石后。",
      unlockCost: 0, table: [["blueTang", 26], ["yellowTang", 24], ["coralGrouper", 21], ["napoleonWrasse", 13], ["goldenMahseer", 5]]
    },
    {
      id: "arcticLake", name: "极北冰湖", emoji: "🏔️", desc: "雪原山影与冷冽冰水，深处栖息着古老耐寒鱼群。",
      unlockCost: 0, table: [["polarCod", 26], ["arcticChar", 24], ["glacierGrayling", 21], ["polarCatfish", 13], ["iceJewelSalmon", 5]]
    },
    {
      id: "mangroveForest", name: "红树林水道", emoji: "🌿", desc: "日落金光穿过气根，泥滩与水道里藏着凶猛掠食者。",
      unlockCost: 0, table: [["archerfish", 25], ["mangroveSnapper", 24], ["mudCrab", 20], ["catfish", 11], ["giantSnakehead", 14], ["sunsetTarpon", 6]]
    },
    {
      id: "glowCave", name: "荧光洞窟湖", emoji: "💠", desc: "蓝紫荧光洒进地下湖，透明鱼群在矿物水色中游动。",
      unlockCost: 0, table: [["caveGlassfish", 26], ["blindCaveLoach", 23], ["crystalCatfish", 18], ["lanternBass", 16], ["glowAnglerfish", 6]]
    }
  ];

  const defaultSave = {
    coins: 0,
    activeLocationId: "stream",
    bag: [],
    caughtCounts: {},
    totalCatches: 0,
    totalEarned: 0,
    rodId: "handline",
    baitId: "bread",
    accessories: [],
    log: [],
  };

  const rods = {
    handline: { id: "handline", name: "旧手线", emoji: "🧵", cost: 0, biteSpeed: 1, reelPower: 1, lineStrength: 1, desc: "基础装备，成功几率较低。" },
    bamboo: { id: "bamboo", name: "竹节竿", emoji: "🎍", cost: 650, biteSpeed: 1.08, reelPower: 1.08, lineStrength: 1.12, desc: "咬钩更快，收线更稳。" },
    carbon: { id: "carbon", name: "碳素竿", emoji: "🎣", cost: 2600, biteSpeed: 1.18, reelPower: 1.16, lineStrength: 1.24, desc: "显著提高中鱼与上岸成功率。" },
    master: { id: "master", name: "大师竞技竿", emoji: "🏆", cost: 8200, biteSpeed: 1.3, reelPower: 1.24, lineStrength: 1.38, desc: "高端装备，稀有鱼也更容易拉起。" }
  };
  const baits = {
    bread: { id: "bread", name: "干面饵", emoji: "🍞", cost: 0, biteSpeed: 1, rareBias: 1, hookPower: 1, desc: "新手专用，效果普通。" },
    worm: { id: "worm", name: "红蚯蚓", emoji: "🪱", cost: 180, biteSpeed: 1.18, rareBias: 1.16, hookPower: 1.06, desc: "更快吸引鱼群，稀有鱼出现率上升。" },
    lure: { id: "lure", name: "荧光拟饵", emoji: "🪤", cost: 750, biteSpeed: 1.35, rareBias: 1.34, hookPower: 1.11, desc: "针对大型掠食鱼，成功率高。" },
    legend: { id: "legend", name: "秘境香饵", emoji: "🧪", cost: 2600, biteSpeed: 1.52, rareBias: 1.55, hookPower: 1.17, desc: "大幅提高稀有鱼和传说鱼概率。" }
  };
  const accessories = {
    glove: { id: "glove", name: "防滑钓鱼手套", emoji: "🧤", cost: 360, hookPower: 1.1, desc: "起竿更稳，降低脱钩概率。" },
    alarm: { id: "alarm", name: "咬钩报警器", emoji: "🔔", cost: 520, biteSpeed: 1.22, desc: "更快吸引鱼群试探鱼饵。" },
    spray: { id: "spray", name: "聚鱼诱食喷雾", emoji: "🧴", cost: 980, rareBias: 1.28, desc: "扩大诱鱼范围，稀有鱼更容易出现。" },
    net: { id: "net", name: "宽口抄网", emoji: "🥅", cost: 1350, reelPower: 1.14, desc: "收线效率显著提升。" },
    line: { id: "line", name: "钛金加强鱼线", emoji: "🧷", cost: 1900, lineStrength: 1.18, desc: "鱼线耐力提升，断线概率降低。" },
    sonar: { id: "sonar", name: "便携探鱼器", emoji: "📡", cost: 2600, biteSpeed: 1.1, rareBias: 1.12, desc: "定位鱼群，兼顾速度与稀有度。" }
  };

  const defaultPosition = { latitude: 26.6477, longitude: 106.6302, label: "贵阳（默认坐标）" };
  const ambientLocationProfiles = {
    stream: { water: [900, 0.19], wind: [260, 0.11], special: [3200, 0.012], event: "stream" },
    sea: { water: [180, 0.2], wind: [360, 0.16], special: [900, 0.008], event: "sea" },
    dawnLake: { water: [300, 0.1], wind: [150, 0.06], special: [2800, 0.006], event: "dawn" },
    tropicalLagoon: { water: [760, 0.13], wind: [190, 0.09], special: [4200, 0.008], event: "tropical" },
    arcticLake: { water: [220, 0.08], wind: [480, 0.14], special: [1200, 0.012], event: "arctic" },
    mangroveForest: { water: [260, 0.12], wind: [120, 0.07], special: [1600, 0.014], event: "mangrove" },
    glowCave: { water: [140, 0.07], wind: [90, 0.03], special: [520, 0.016], event: "cave" }
  };
  const ambientAudio = {
    started: false, muted: false, context: null, master: null, layers: {}, birdTimer: null, location: "stream",
    supportsAudio: Boolean(window.AudioContext || window.webkitAudioContext),
    ensureContext() {
      if (!this.supportsAudio || this.context) return this.context;
      const Context = window.AudioContext || window.webkitAudioContext;
      this.context = new Context();
      this.master = this.context.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.context.destination);
      return this.context;
    },
    noiseBuffer() {
      const context = this.context;
      const length = context.sampleRate * 2;
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let index = 0; index < length; index += 1) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.022 * white) / 1.022;
        data[index] = last * 3.4;
      }
      return buffer;
    },
    createLayer(name, filterType, frequency, gain, q = 0.8) {
      const context = this.context;
      const source = context.createBufferSource();
      source.buffer = this.noiseBuffer();
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = frequency;
      filter.Q.value = q;
      const output = context.createGain();
      output.gain.value = gain;
      source.connect(filter).connect(output).connect(this.master);
      source.start();
      this.layers[name] = { source, filter, output };
    },
    start() {
      if (!this.supportsAudio) return;
      this.ensureContext();
      this.context.resume();
      if (this.started) {
        this.setMuted(false);
        return;
      }
      this.started = true;
      this.setMuted(false);
      this.createLayer("water", "lowpass", 420, 0.16, 0.6);
      this.createLayer("wind", "lowpass", 180, 0.1, 0.4);
      this.createLayer("rain", "bandpass", 1450, 0, 0.8);
      this.createLayer("special", "bandpass", 1600, 0.008, 1.2);
      this.setLocation(this.location);
      if (this.weather) this.setWeather(this.weather);
      this.scheduleBird();
    },
    scheduleBird(delay = 4200 + Math.random() * 9200) {
      clearTimeout(this.birdTimer);
      this.birdTimer = setTimeout(() => {
        if (this.started && !this.muted) this.playLocationEvent();
        this.scheduleBird();
      }, delay);
    },
    playLocationEvent() {
      const profile = ambientLocationProfiles[this.location];
      const kind = this.weather?.kind || "clear";
      const isDay = this.weather?.isDay !== false;
      if (profile?.event === "sea") return this.playGull();
      if (profile?.event === "arctic") return Math.random() < .58 ? this.playIceCrack() : this.playWindWhistle();
      if (profile?.event === "mangrove") return Math.random() < (isDay ? .62 : .46) ? this.playInsect() : this.playFrog();
      if (profile?.event === "cave") return Math.random() < .68 ? this.playDrip() : this.playCaveShimmer();
      if (profile?.event === "stream") return isDay && Math.random() < .72 ? this.playInsect() : this.playBird(1900, 0.14);
      if (profile?.event === "tropical" && isDay) return this.playBird(2300, 0.2, .028);
      if (["clear", "cloud", "fog"].includes(kind) && isDay) this.playBird();
    },
    playBird(base = 1750 + Math.random() * 900, duration = 0.24, volume = 0.024) {
      const context = this.context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(base, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.35), context.currentTime + 0.08);
      oscillator.frequency.exponentialRampToValueAtTime(base * 0.82, context.currentTime + 0.18);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(volume, context.currentTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.connect(gain).connect(this.master);
      oscillator.start();
      oscillator.stop(context.currentTime + duration + 0.02);
    },
    playGull() {
      const context = this.context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(1450 + Math.random() * 220, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(780, context.currentTime + 0.46);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.022, context.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
      oscillator.connect(gain).connect(this.master);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.52);
    },
    playInsect() {
      const context = this.context;
      const oscillator = context.createOscillator();
      const tremolo = context.createGain();
      const gain = context.createGain();
      oscillator.type = "sawtooth";
      oscillator.frequency.value = 440 + Math.random() * 260;
      tremolo.frequency.value = 18 + Math.random() * 12;
      tremolo.gain.value = 0.008;
      gain.gain.value = 0.01;
      oscillator.connect(tremolo).connect(gain).connect(this.master);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.28 + Math.random() * 0.22);
    },
    playFrog() {
      const context = this.context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(210 + Math.random() * 70, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(145, context.currentTime + 0.12);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.014, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
      oscillator.connect(gain).connect(this.master);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    },
    playIceCrack() {
      const context = this.context;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = this.noiseBuffer();
      filter.type = "highpass";
      filter.frequency.value = 1100 + Math.random() * 600;
      gain.gain.setValueAtTime(0.016, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.38);
      source.connect(filter).connect(gain).connect(this.master);
      source.start();
      source.stop(context.currentTime + 0.4);
    },
    playWindWhistle() {
      const context = this.context;
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(780 + Math.random() * 180, context.currentTime);
      oscillator.frequency.linearRampToValueAtTime(620 + Math.random() * 90, context.currentTime + 1.1);
      filter.type = "bandpass";
      filter.frequency.value = 880;
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.008, context.currentTime + 0.22);
      gain.gain.linearRampToValueAtTime(0, context.currentTime + 1.15);
      oscillator.connect(filter).connect(gain).connect(this.master);
      oscillator.start();
      oscillator.stop(context.currentTime + 1.17);
    },
    playDrip() {
      const context = this.context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1250 + Math.random() * 350, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(420, context.currentTime + 0.1);
      gain.gain.setValueAtTime(0.018, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
      oscillator.connect(gain).connect(this.master);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.18);
    },
    playCaveShimmer() {
      const context = this.context;
      [528, 792, 1060].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * 0.08;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.006, start + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.72);
        oscillator.connect(gain).connect(this.master);
        oscillator.start(start);
        oscillator.stop(start + 0.74);
      });
    },
    setLocation(locationId) {
      this.location = locationId in ambientLocationProfiles ? locationId : "stream";
      if (this.started && this.weather) this.setWeather(this.weather);
    },
    setWeather(weather) {
      this.weather = weather;
      if (!this.started || !this.context) return;
      const kind = weather.kind;
      const profile = ambientLocationProfiles[this.location] ?? ambientLocationProfiles.stream;
      let [waterFrequency, waterGain] = profile.water;
      let [windFrequency, windGain] = profile.wind;
      const [specialFrequency, specialGain] = profile.special;
      if (kind === "storm") { waterFrequency *= 0.68; waterGain += 0.07; windFrequency *= 1.35; windGain += 0.08; }
      else if (kind === "rain") { waterGain += 0.03; windGain += 0.04; }
      else if (kind === "snow") { waterFrequency *= 0.72; waterGain -= 0.02; }
      else if (kind === "fog") { waterFrequency *= 0.85; waterGain -= 0.02; windGain -= 0.02; }
      this.layers.water.filter.frequency.setTargetAtTime(Math.max(90, waterFrequency), this.context.currentTime, 0.4);
      this.layers.water.output.gain.setTargetAtTime(Math.max(0, waterGain), this.context.currentTime, 0.5);
      this.layers.wind.filter.frequency.setTargetAtTime(Math.max(70, windFrequency), this.context.currentTime, 0.4);
      this.layers.wind.output.gain.setTargetAtTime(Math.max(0, windGain), this.context.currentTime, 0.5);
      this.layers.special.filter.frequency.setTargetAtTime(specialFrequency, this.context.currentTime, 0.5);
      this.layers.special.output.gain.setTargetAtTime(specialGain, this.context.currentTime, 0.5);
      this.layers.rain.output.gain.setTargetAtTime(kind === "storm" ? 0.13 : kind === "rain" ? 0.08 : 0, this.context.currentTime, 0.5);
      this.scheduleBird(kind === "storm" ? 9000 + Math.random() * 6000 : 3600 + Math.random() * 7800);
    },
    setMuted(muted) {
      this.muted = muted;
      if (this.master && this.context) this.master.gain.setTargetAtTime(muted ? 0 : 0.42, this.context.currentTime, 0.25);
    },
    toggle() {
      if (!this.started) this.start();
      else this.setMuted(!this.muted);
      return this.muted;
    }
  };
  const weatherCodes = [
    { codes: [0], label: "晴", dayIcon: "☀️", nightIcon: "🌙", kind: "clear", biteSpeed: 1, rareBias: 1, hookPower: 1 },
    { codes: [1], label: "大致晴朗", dayIcon: "🌤️", nightIcon: "🌙", kind: "clear", biteSpeed: 1.01, rareBias: 1, hookPower: 1 },
    { codes: [2], label: "多云", dayIcon: "⛅", nightIcon: "☁️", kind: "cloud", biteSpeed: 1.04, rareBias: 1.03, hookPower: 1 },
    { codes: [3], label: "阴天", dayIcon: "☁️", nightIcon: "☁️", kind: "cloud", biteSpeed: 1.06, rareBias: 1.04, hookPower: 1.01 },
    { codes: [45, 48], label: "雾", dayIcon: "🌫️", nightIcon: "🌫️", kind: "fog", biteSpeed: 0.95, rareBias: 1.06, hookPower: 1.02 },
    { codes: [51, 53, 55], label: "毛毛雨", dayIcon: "🌦️", nightIcon: "🌧️", kind: "rain", biteSpeed: 1.08, rareBias: 1.08, hookPower: 1.03 },
    { codes: [56, 57], label: "冻雨毛毛", dayIcon: "🌧️❄️", nightIcon: "🌧️❄️", kind: "snow", biteSpeed: 0.9, rareBias: 1.05, hookPower: 1 },
    { codes: [61], label: "小雨", dayIcon: "🌦️", nightIcon: "🌧️", kind: "rain", biteSpeed: 1.1, rareBias: 1.09, hookPower: 1.02 },
    { codes: [63, 65], label: "中到大雨", dayIcon: "🌧️", nightIcon: "🌧️", kind: "rain", biteSpeed: 1.12, rareBias: 1.11, hookPower: 1 },
    { codes: [66, 67], label: "冻雨", dayIcon: "🌧️❄️", nightIcon: "🌧️❄️", kind: "snow", biteSpeed: 0.88, rareBias: 1.05, hookPower: 1 },
    { codes: [71, 73, 75, 77], label: "降雪", dayIcon: "🌨️", nightIcon: "🌨️", kind: "snow", biteSpeed: 0.9, rareBias: 1.05, hookPower: 1 },
    { codes: [80, 81, 82], label: "阵雨", dayIcon: "🌦️", nightIcon: "🌧️", kind: "rain", biteSpeed: 1.09, rareBias: 1.08, hookPower: 1.01 },
    { codes: [85, 86], label: "阵雪", dayIcon: "🌨️", nightIcon: "🌨️", kind: "snow", biteSpeed: 0.9, rareBias: 1.05, hookPower: 1 },
    { codes: [95], label: "雷阵雨", dayIcon: "⛈️", nightIcon: "⛈️", kind: "storm", biteSpeed: 0.78, rareBias: 1.2, hookPower: 1.05 },
    { codes: [96, 99], label: "雷雨伴冰雹", dayIcon: "⛈️", nightIcon: "⛈️", kind: "storm", biteSpeed: 0.76, rareBias: 1.2, hookPower: 1.05 }
  ];

  const els = {
    coins: document.getElementById("coin-count"),
    catches: document.getElementById("catch-count"),
    tabs: [...document.querySelectorAll(".tab")],
    views: [...document.querySelectorAll(".view")],
    scene: document.getElementById("pond-scene"),
    sceneStatus: document.getElementById("scene-status"),
    selector: document.getElementById("scene-location-selector"),
    name: document.getElementById("location-name"),
    desc: document.getElementById("location-desc"),
    equipmentStatus: document.getElementById("equipment-status"),
    status: document.getElementById("fishing-status"),
    action: document.getElementById("fishing-action"),
    rodControl: document.getElementById("rod-control"),
    progressLabel: document.getElementById("progress-label") ?? { textContent: "", style: {} },
    progressRing: document.getElementById("progress-ring"),
    tensionRing: document.getElementById("tension-ring"),
    sellAll: document.getElementById("sell-all"),
    sellAllBag: document.getElementById("sell-all-bag"),
    reset: document.getElementById("reset-save"),
    line: document.getElementById("fishing-line"),
    bobber: document.getElementById("bobber"),
    rod: document.querySelector(".rod-view"),
    reveal: document.getElementById("catch-reveal"),
    revealFish: document.getElementById("reveal-fish"),
    revealName: document.getElementById("reveal-name"),
    revealDetails: document.getElementById("reveal-details"),
    confetti: document.getElementById("confetti"),
    ripple: document.getElementById("ripple"),
    log: document.getElementById("catch-log"),
    bag: document.getElementById("bag-list"),
    shop: document.getElementById("shop-view"),
    rodShop: document.getElementById("rod-shop"),
    baitShop: document.getElementById("bait-shop"),
    accessoryShop: document.getElementById("accessory-shop"),
    aquariumTank: document.getElementById("aquarium-tank"),
    aquariumList: document.getElementById("aquarium-list"),
    aquariumProgress: document.getElementById("aquarium-progress"),
    dateText: document.getElementById("date-text"),
    timeText: document.getElementById("time-text"),
    weatherRefresh: document.getElementById("weather-refresh"),
    weatherOverlay: document.getElementById("weather-overlay"),
    weatherAddress: document.getElementById("weather-address"),
    weatherCurrentIcon: document.getElementById("weather-current-icon"),
    weatherCurrentText: document.getElementById("weather-current-text"),
    weatherCurrentDetail: document.getElementById("weather-current-detail"),
    weatherTomorrowIcon: document.getElementById("weather-tomorrow-icon"),
    weatherTomorrowText: document.getElementById("weather-tomorrow-text"),
    weatherTomorrowDetail: document.getElementById("weather-tomorrow-detail"),
    weatherEffect: document.getElementById("weather-effect"),
    ambientToggle: document.getElementById("ambient-toggle"),
    aimGame: document.getElementById("aim-game"),
    aimCursor: document.getElementById("aim-cursor"),
    aimText: document.getElementById("aim-text"),
    savePhoto: document.getElementById("save-catch-photo"),
    shareCatch: document.getElementById("share-catch")
  };

  let save = loadSave();
  if (save.activeLocationId === "pond") {
    save.activeLocationId = "stream";
    persist();
  }
  let phase = "idle";
  let biteTimer = null;
  let battleFrame = null;
  let battle = null;
  let holding = false;
  let revealTimer = null;
  let aimFrame = null;
  let castQuality = 0;
  let lastCatch = null;
  let weatherState = null;
  let weatherLoading = false;

  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return structuredClone(defaultSave);
      const parsed = JSON.parse(raw);
      return { ...structuredClone(defaultSave), ...parsed };
    } catch {
      return structuredClone(defaultSave);
    }
  }

  function persist() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }

  function getLocation(locationId = save.activeLocationId) {
    return locations.find((item) => item.id === locationId) ?? locations[0];
  }

  function isUnlocked(location) {
    return location.unlockCost === 0 || save.caughtCounts[`unlock:${location.id}`] === 1;
  }

  function unlockLocation(location) {
    save.activeLocationId = location.id;
    persist();
    render();
  }

  function getRod(rodId = save.rodId) {
    return rods[rodId] ?? rods.handline;
  }

  function getBait(baitId = save.baitId) {
    return baits[baitId] ?? baits.bread;
  }

  function isOwned(type, item) {
    if (item.cost === 0) return true;
    if (type === "accessory") return save.accessories.includes(item.id);
    const ownedId = type === "rod" ? save.rodId : save.baitId;
    const items = type === "rod" ? rods : baits;
    return (items[ownedId]?.cost || 0) >= item.cost;
  }

  function buyEquipment(type, item) {
    if (isOwned(type, item) || save.coins < item.cost) return;
    save.coins -= item.cost;
    if (type === "rod") save.rodId = item.id;
    else if (type === "bait") save.baitId = item.id;
    else save.accessories.push(item.id);
    persist();
    render();
  }

  function fishImage(detail) {
    if (detail.image) return detail.image;
    const code = Array.from(detail.emoji)
      .map((part) => part.codePointAt(0).toString(16))
      .join("-");
    return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${code}.svg`;
  }

  function fishVisual(detail, extraClass = "") {
    return `
      <img class="fish-image ${extraClass}" src="${fishImage(detail)}" alt="${detail.name}" loading="eager" decoding="async"
        onerror="this.replaceWith(document.createTextNode('${detail.emoji}'))">
    `;
  }

  function findWeather(code) {
    return weatherCodes.find((item) => item.codes.includes(code)) ?? {
      label: "未知天气", dayIcon: "🌡️", nightIcon: "🌡️", kind: "cloud",
      biteSpeed: 1, rareBias: 1, hookPower: 1
    };
  }

  function weatherSummary(code, isDay = true) {
    const item = findWeather(code);
    return { ...item, icon: isDay ? item.dayIcon : item.nightIcon };
  }

  function syncSceneTime() {
    const now = new Date();
    const timeValue = (now.getHours() + now.getMinutes() / 60) / 24;
    const hour = now.getHours();
    const timePhase = hour >= 5 && hour < 8 ? "dawn" : hour >= 8 && hour < 17 ? "day" : hour >= 17 && hour < 20 ? "dusk" : "night";
    els.scene.dataset.time = timePhase;
    window.CloudFishingScene?.setTime(timeValue);
  }

  function renderWeather() {
    if (!weatherState) {
      els.weatherEffect.textContent = "天气加成：等待数据";
      return;
    }
    const current = weatherSummary(weatherState.current.weather_code, weatherState.current.is_day);
    const dailyCode = weatherState.daily.weather_code[1];
    const tomorrow = weatherSummary(dailyCode, true);
    const currentWeather = weatherState.current;
    const tomorrowWeather = weatherState.daily;
    const tomorrowDate = weatherState.daily.time[1].slice(5).replace("-", "月") + "日";

    els.weatherAddress.textContent = weatherState.address;
    els.weatherCurrentIcon.textContent = current.icon;
    els.weatherCurrentText.textContent = `${current.label} · ${Math.round(currentWeather.temperature_2m)}°C`;
    els.weatherCurrentDetail.textContent = [
      `体感 ${Math.round(currentWeather.apparent_temperature)}°C`,
      `湿度 ${currentWeather.relative_humidity_2m}%`,
      `风 ${Math.round(currentWeather.wind_speed_10m)} km/h`,
      `云量 ${currentWeather.cloud_cover}%`
    ].join(" · ");

    els.weatherTomorrowIcon.textContent = tomorrow.icon;
    els.weatherTomorrowText.textContent = `${tomorrow.label} · ${Math.round(tomorrowWeather.temperature_2m_min[1])}~${Math.round(tomorrowWeather.temperature_2m_max[1])}°C`;
    els.weatherTomorrowDetail.textContent = `${tomorrowDate} · 降水概率 ${tomorrowWeather.precipitation_probability_max[1]}% · 风 ${Math.round(tomorrowWeather.wind_speed_10m_max[1])} km/h`;

    const effectText = `咬饵 ×${current.biteSpeed.toFixed(2)} · 稀有鱼 ×${current.rareBias.toFixed(2)} · 成功 ×${current.hookPower.toFixed(2)}`;
    els.weatherEffect.textContent = `天气加成：${effectText}`;
    els.weatherOverlay.className = `weather-overlay ${current.kind}`;
    els.scene.dataset.weather = current.kind;
    els.weatherOverlay.innerHTML = "";
    if (current.kind === "rain" || current.kind === "storm") {
      for (let index = 0; index < 75; index += 1) {
        const drop = document.createElement("i");
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDelay = `${(Math.random() * 1.4).toFixed(2)}s`;
        drop.style.animationDuration = `${(0.7 + Math.random() * 0.5).toFixed(2)}s`;
        els.weatherOverlay.append(drop);
      }
    }
    if (current.kind === "snow") {
      for (let index = 0; index < 60; index += 1) {
        const flake = document.createElement("i");
        flake.style.left = `${Math.random() * 100}%`;
        flake.style.animationDelay = `${(Math.random() * 4).toFixed(2)}s`;
        flake.style.animationDuration = `${(4 + Math.random() * 3).toFixed(2)}s`;
        els.weatherOverlay.append(flake);
      }
    }
    const environment = {
      kind: current.kind,
      isDay: Boolean(weatherState.current.is_day),
      cloudCover: weatherState.current.cloud_cover ?? 50
    };
    window.CloudFishingScene?.setWeather(environment);
    ambientAudio.setWeather(environment);
    syncSceneTime();
  }

  function reverseGeocode(latitude, longitude, signal) {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`;
    return fetch(url, { signal }).then((response) => {
      if (!response.ok) throw new Error(`reverse geocode failed: ${response.status}`);
      return response.json();
    }).then((data) => {
      const parts = [data.principalSubdivision, data.city || data.locality, data.localityInfo?.administrative?.slice(-1)?.[0]?.name]
        .filter((item, index, list) => item && list.indexOf(item) === index);
      return parts.slice(0, 3).join(" · ") || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
    });
  }

  function fetchForecast(latitude, longitude, signal) {
    const params = new URLSearchParams({
      latitude: latitude,
      longitude: longitude,
      current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
      timezone: "auto",
      forecast_days: "2"
    });
    return fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal }).then((response) => {
      if (!response.ok) throw new Error(`forecast failed: ${response.status}`);
      return response.json();
    });
  }

  function getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: ""
        }),
        reject,
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
      );
    });
  }

  async function loadWeather() {
    if (weatherLoading) return;
    weatherLoading = true;
    els.weatherRefresh.disabled = true;
    els.weatherAddress.textContent = "正在定位当前地址…";
    els.weatherCurrentText.textContent = "等待定位";
    const controller = new AbortController();
    let timeout;
    try {
      let position;
      try {
        position = await getPosition();
      } catch {
        position = { ...defaultPosition };
        els.weatherAddress.textContent = "定位未授权，使用默认坐标";
      }
      timeout = setTimeout(() => controller.abort(), 9000);

      const [address, forecast] = await Promise.all([
        reverseGeocode(position.latitude, position.longitude, controller.signal)
          .catch(() => (position.label ? position.label : `${position.latitude.toFixed(3)}, ${position.longitude.toFixed(3)}`)),
        fetchForecast(position.latitude, position.longitude, controller.signal)
      ]);

      weatherState = { address, current: forecast.current, daily: forecast.daily };
      renderWeather();
    } catch (error) {
      console.error("Weather loading failed:", error);
      weatherState = {
        address: "天气服务连接失败",
        current: { weather_code: 2, is_day: 1, temperature_2m: 0, apparent_temperature: 0, relative_humidity_2m: 0, wind_speed_10m: 0, cloud_cover: 60 },
        daily: { time: [new Date().toISOString().slice(0, 10), new Date().toISOString().slice(0, 10)], weather_code: [2, 2], temperature_2m_max: [0, 0], temperature_2m_min: [0, 0], precipitation_probability_max: [0, 0], wind_speed_10m_max: [0, 0] }
      };
      renderWeather();
    } finally {
      clearTimeout(timeout);
      weatherLoading = false;
      els.weatherRefresh.disabled = false;
    }
  }

  function startClock() {
    const render = () => {
      const now = new Date();
      els.dateText.textContent = new Intl.DateTimeFormat("zh-CN", {
        year: "numeric", month: "2-digit", day: "2-digit", weekday: "short"
      }).format(now);
      els.timeText.textContent = new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
      }).format(now);
    };
    render();
    setInterval(render, 1000);
  }

  function pickFish(location) {
    const bait = getBait();
    const weather = weatherSummary(weatherState?.current.weather_code ?? 2, weatherState?.current.is_day ?? true);
    const { modifiers } = gear();
    const qualityBias = 0.72 + castQuality * 0.0065;
    const rarityBias = {
      common: 1,
      rare: bait.rareBias * modifiers.rareBias * weather.rareBias * qualityBias,
      epic: bait.rareBias * modifiers.rareBias * weather.rareBias * qualityBias * 1.1,
      legendary: bait.rareBias * modifiers.rareBias * weather.rareBias * qualityBias * 1.25
    };
    const weightedTable = location.table.map(([fishId, weight]) => [fishId, weight * rarityBias[fish[fishId].rarity]]);
    const totalWeight = weightedTable.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * totalWeight;
    for (const [fishId, weight] of weightedTable) {
      roll -= weight;
      if (roll <= 0) return fish[fishId];
    }
    const fallback = fish[weightedTable.at(-1)[0]];
    const specialId = specialFishByWeather[weather.kind];
    const specialChance = Math.min(0.16, 0.05 * bait.rareBias * modifiers.rareBias * qualityBias);
    if (specialId && Math.random() < specialChance) return weatherFish[specialId];
    return fallback;
  }

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resetBattleDisplay() {
    els.progressLabel.textContent = "钓鱼进度";
    els.progressRing.style.strokeDashoffset = "100";
    els.tensionRing.style.strokeDashoffset = "100";
    els.tensionRing.classList.remove("danger");
    els.rodControl.classList.remove("waiting", "biting");
    els.rodControl.classList.remove("aiming");
  }

  function showRingProgress(element, value) {
    element.style.strokeDashoffset = `${Math.max(0, Math.min(100, 100 - value))}`;
  }

  function showWaitProgress(delay) {
    els.progressLabel.textContent = "咬饵进度";
    els.progressRing.style.transitionDuration = "0.08s";
    els.progressRing.style.transitionTimingFunction = "linear";
    els.progressRing.style.strokeDashoffset = "100";
    requestAnimationFrame(() => {
      els.progressRing.style.transitionDuration = `${delay}ms`;
      els.progressRing.style.transitionTimingFunction = "linear";
      showRingProgress(els.progressRing, 100);
    });
    els.tensionRing.style.transitionDuration = "0.08s";
    els.tensionRing.style.strokeDashoffset = "100";
  }

  function fishStrength(caught, weight) {
    const rarityPower = { common: 1.04, rare: 1.45, epic: 1.8, legendary: 2.25 }[caught.rarity] || 1;
    const weightPower = 0.8 + (weight / caught.maxWeight) * 0.6;
    return Math.min(1.7, rarityPower * weightPower * 0.64);
  }

  function chooseBattleProfile(detail, weather) {
    const rarityBonus = {
      common: 0,
      rare: { runner: 4, slippery: 4 },
      epic: { runner: 6, deep: 5, burst: 6 },
      legendary: { burst: 14, deep: 8, slippery: 6 }
    }[detail.rarity] || {};
    const weatherBonus = {
      clear: { steady: 12 },
      cloud: { steady: 5 },
      rain: { runner: 10 },
      fog: { slippery: 10 },
      snow: { deep: 12 },
      storm: { burst: 14, deep: 6 }
    }[weather.kind] || {};
    const options = [
      ["steady", 28],
      ["runner", 20],
      ["deep", 20],
      ["burst", 12],
      ["slippery", 18]
    ].map(([id, weight]) => [id, weight + (rarityBonus[id] || 0) + (weatherBonus[id] || 0)]);
    const total = options.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;
    for (const [id, weight] of options) {
      roll -= weight;
      if (roll <= 0) return battleProfiles[id];
    }
    return battleProfiles.steady;
  }

  function gear() {
    const accessoryMultiplier = (key) => save.accessories.reduce(
      (value, id) => value * (accessories[id]?.[key] ?? 1), 1
    );
    return {
      rod: getRod(),
      bait: getBait(),
      modifiers: {
        biteSpeed: accessoryMultiplier("biteSpeed"),
        rareBias: accessoryMultiplier("rareBias"),
        hookPower: accessoryMultiplier("hookPower"),
        reelPower: accessoryMultiplier("reelPower"),
        lineStrength: accessoryMultiplier("lineStrength")
      }
    };
  }

  function finishBattle(success, reason = "") {
    if (!battle) return;
    cancelAnimationFrame(battleFrame);
    const caught = battle.detail;
    if (success) {
      save.bag.push({ fishId: caught.id, weight: battle.weight, value: battle.value, caughtAt: Date.now() });
      save.totalCatches += 1;
      save.caughtCounts[caught.id] = (save.caughtCounts[caught.id] || 0) + 1;
      save.log.unshift({
        fishId: caught.id,
        name: caught.name,
        emoji: caught.emoji,
        weight: battle.weight,
        value: battle.value,
        rarity: caught.rarity,
        time: Date.now()
      });
      save.log = save.log.slice(0, 30);
      els.status.textContent = `成功钓到 ${caught.name}（${battle.weight}kg，+${battle.value}金币）`;
      recordCatch(caught, battle.weight, battle.value);
      revealCatch(caught, battle.weight, battle.value);
    } else {
      els.status.textContent = reason || "鱼脱钩了";
    }

    battle = null;
    holding = false;
    phase = "idle";
    els.rod.classList.remove("pulling", "holding", "struggling", "waiting");
    if (!success) hideCatchReveal();
    resetBattleDisplay();
    els.bobber.classList.remove("visible", "bite");
    els.line.classList.remove("cast", "pulling");
    els.rod.classList.remove("pulling");
    els.ripple.classList.remove("show");
    persist();
    updateAction();
    render();
  }

  function updateBattle(delta) {
    if (!battle) return;
    battle.elapsed += delta;
    battle.struggleTimer -= delta;
    if (battle.struggleTimer <= 0) {
      battle.struggling = !battle.struggling;
      battle.struggleTimer = battle.struggling
        ? randomBetween(...battle.profile.struggle)
        : randomBetween(...battle.profile.calm);
    }

    const strength = battle.strength;
    const profile = battle.profile;
    const { rod, bait, modifiers } = gear();
    if (holding) {
      battle.tension += (14 + strength * 9 * (battle.struggling ? 1.32 : 0.48)) * profile.tension * delta / (rod.lineStrength * modifiers.lineStrength);
      const weather = weatherSummary(weatherState?.current.weather_code ?? 2, weatherState?.current.is_day ?? true);
      const pullingPower = (17.1 - strength * (battle.struggling ? 4 : 1.1)) * profile.pull * battle.hookAdvantage * rod.reelPower * modifiers.reelPower * bait.hookPower * modifiers.hookPower * weather.hookPower;
      battle.progress += pullingPower * delta;
    } else {
      battle.tension -= 44 * delta;
      battle.progress -= strength * (battle.struggling ? 1.8 : 0.34) * profile.drain * delta;
    }

    battle.tension = Math.max(0, Math.min(100, battle.tension));
    battle.progress = Math.max(0, Math.min(100, battle.progress));
    showRingProgress(els.progressRing, battle.progress);
    showRingProgress(els.tensionRing, battle.tension);
    els.tensionRing.classList.toggle("danger", battle.tension > 72);
    els.rod.classList.toggle("holding", holding);
    els.rod.classList.toggle("struggling", battle.struggling);
    els.status.textContent = battle.tension > 78
      ? "张力危险！立刻松手泄力。"
      : battle.struggling
        ? `${profile.label}状态！松手泄力，防止断线。`
        : holding ? `正在收线 · ${profile.label}` : `按住收线 · ${profile.hint}`;

    if (battle.tension >= 100) {
      finishBattle(false, "力度过大，鱼线断了！");
      return;
    }
    if (battle.progress <= 0) {
      finishBattle(false, "鱼挣脱鱼钩跑掉了。");
      return;
    }
    if (battle.progress >= 100) {
      finishBattle(true);
      return;
    }
    if (battle.elapsed >= battle.timeLimit) {
      finishBattle(false, "僵持太久，鱼吐钩逃走了。");
      return;
    }

    battleFrame = requestAnimationFrame((time) => {
      if (!battle) return;
      updateBattle(Math.min(0.05, (time - battle.lastTime) / 1000));
      battle.lastTime = time;
    });
  }

  function hookFish() {
    clearTimeout(biteTimer);
    const location = getLocation();
    const detail = pickFish(location);
    const weather = weatherSummary(weatherState?.current.weather_code ?? 2, weatherState?.current.is_day ?? true);
    const profile = chooseBattleProfile(detail, weather);
    const weight = Number(randomBetween(detail.minWeight, detail.maxWeight).toFixed(2));
    const value = Math.max(1, Math.round(detail.price * (0.82 + weight / detail.maxWeight * 0.5)));
    battle = {
      detail,
      weight,
      value,
      strength: fishStrength(detail, weight),
      hookAdvantage: 0.68 + castQuality * 0.005,
      profile,
      progress: 18,
      tension: 14,
      struggling: false,
      struggleTimer: randomBetween(...profile.calm),
      elapsed: 0,
      timeLimit: randomBetween(11, 15),
      lastTime: performance.now()
    };
    phase = "reeling";
    holding = false;
    resetBattleDisplay();
    els.progressLabel.textContent = `收线 · ${profile.label}`;
    els.progressRing.style.transitionDuration = "0.08s";
    els.progressRing.style.transitionTimingFunction = "linear";
    showRingProgress(els.progressRing, battle.progress);
    els.tensionRing.style.transitionDuration = "0.08s";
    showRingProgress(els.tensionRing, battle.tension);
    els.bobber.classList.remove("bite");
    els.rod.classList.remove("waiting");
    els.line.classList.add("pulling");
    els.rod.classList.add("pulling");
    els.status.textContent = `成功起竿！这条鱼是「${profile.label}」类型，${profile.hint}。`;
    updateAction();
    showRingProgress(els.progressRing, battle.progress);
    showRingProgress(els.tensionRing, battle.tension);
    battleFrame = requestAnimationFrame((time) => {
      if (!battle) return;
      battle.lastTime = time;
      updateBattle(0);
    });
  }

  function startBiteWindow() {
    phase = "biting";
    els.bobber.classList.add("bite");
    els.status.textContent = "浮标沉下去了！立刻点击起竿！";
    updateAction();
    const biteWindow = randomBetween(1500, 2500);
    showRingProgress(els.progressRing, 100);
    biteTimer = setTimeout(() => {
      if (phase !== "biting") return;
      phase = "idle";
      els.bobber.classList.remove("visible", "bite");
      els.line.classList.remove("cast");
      els.rod.classList.remove("pulling");
      els.ripple.classList.remove("show");
      resetBattleDisplay();
      els.status.textContent = "太慢了，鱼吃完饵就走了。";
      updateAction();
    }, biteWindow);
  }

  function castRod(accuracy = castQuality) {
    phase = "waiting";
    const { rod, bait, modifiers } = gear();
    const weather = weatherSummary(weatherState?.current.weather_code ?? 2, weatherState?.current.is_day ?? true);
    const delay = Math.max(1600, randomBetween(2600, 8200) / (rod.biteSpeed * modifiers.biteSpeed * bait.biteSpeed * weather.biteSpeed));
    clearTimeout(biteTimer);
    biteTimer = setTimeout(() => {
      if (phase === "waiting") startBiteWindow();
    }, delay);

    els.action.textContent = "等待咬钩…";
    els.rod.classList.add("waiting");
    els.progressLabel.textContent = "咬饵进度";
    els.bobber.classList.add("visible");
    els.line.classList.add("cast");
    els.ripple.classList.add("show");
    showWaitProgress(delay);
    const grade = accuracy >= 85 ? "完美抛点" : accuracy >= 65 ? "良好抛点" : accuracy >= 35 ? "普通抛点" : "偏远抛点";
    els.status.textContent = `鱼饵入水（${grade}），盯住浮标，等待时间更随机了。`;
  }

  function updateAction() {
    const labels = {
      idle: "抛竿",
      aiming: "锁定抛点",
      waiting: "等待",
      biting: "起竿！",
      reeling: holding ? "收线" : "收线"
    };
    els.action.textContent = labels[phase];
    els.action.classList.toggle("danger-action", phase === "biting");
    els.action.classList.toggle("holding", holding);
    els.action.classList.toggle("waiting", phase === "waiting");
    els.rodControl.classList.toggle("waiting", phase === "waiting");
    els.rodControl.classList.toggle("biting", phase === "biting");
    els.rodControl.classList.toggle("aiming", phase === "aiming");
  }

  function stopFishing(silent = false) {
    clearTimeout(biteTimer);
    const previousPhase = phase;
    if (battle) {
      finishBattle(false, "已主动收竿。");
      return;
    }
    cancelAnimationFrame(aimFrame);
    els.aimGame.classList.add("hidden");
    phase = "idle";
    holding = false;
    hideCatchReveal();
    resetBattleDisplay();
    els.bobber.classList.remove("visible", "bite");
    els.line.classList.remove("cast", "pulling");
    els.rod.classList.remove("pulling");
    els.rod.classList.remove("holding", "struggling", "waiting");
    els.ripple.classList.remove("show");
    els.status.textContent = silent ? "已收竿" : "已收竿";
    updateAction();
  }

  function handlePressStart(event) {
    event.preventDefault();
    if (phase === "idle") {
      beginAiming();
      return;
    }
    if (phase === "aiming") {
      resolveAiming();
      return;
    }
    if (phase === "waiting") {
      return;
    }
    if (phase === "biting") {
      hookFish();
      return;
    }
    if (phase === "reeling") {
      holding = true;
      updateAction();
    }
  }

  function handlePressEnd() {
    if (holding) {
      holding = false;
      updateAction();
    }
  }

  function revealCatch(caught, weight, value) {
    clearTimeout(revealTimer);
    els.revealFish.innerHTML = fishVisual(caught);
    els.revealName.textContent = caught.name;
    els.revealDetails.textContent = `${weight}kg · +${value} 金币 · ${lastCatch?.accuracyLabel || "普通抛点"}`;
    els.confetti.innerHTML = "";
    for (let index = 0; index < 24; index += 1) {
      const piece = document.createElement("i");
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.animationDelay = `${(Math.random() * 0.35).toFixed(2)}s`;
      piece.style.animationDuration = `${(1 + Math.random() * 0.7).toFixed(2)}s`;
      piece.style.background = ["#ffd166", "#4dd6ba", "#7fbaff", "#ff7b9c", "#fff"][index % 5];
      els.confetti.append(piece);
    }
    els.reveal.classList.remove("show");
    requestAnimationFrame(() => els.reveal.classList.add("show"));
    revealTimer = setTimeout(() => hideCatchReveal(), 9000);
  }

  function recordCatch(caught, weight, value) {
    const location = getLocation();
    const weather = weatherSummary(weatherState?.current.weather_code ?? 2, weatherState?.current.is_day ?? true);
    lastCatch = {
      detail: caught, weight, value, locationName: location.name,
      weatherLabel: weather.label, weatherIcon: weather.icon,
      accuracy: castQuality,
      accuracyLabel: castQuality >= 85 ? "完美抛点" : castQuality >= 65 ? "良好抛点" : castQuality >= 35 ? "普通抛点" : "偏远抛点",
      time: new Date()
    };
  }

  function beginAiming() {
    ambientAudio.start();
    phase = "aiming";
    els.aimGame.classList.remove("hidden");
    els.aimText.textContent = "再次点击，在绿区锁定抛点";
    updateAction();
    const startTime = performance.now();
    const move = (time) => {
      if (phase !== "aiming") return;
      const position = (Math.sin((time - startTime) * 0.0021) + 1) / 2 * 100;
      els.aimCursor.style.left = `${position}%`;
      aimFrame = requestAnimationFrame(move);
    };
    aimFrame = requestAnimationFrame(move);
  }

  function resolveAiming() {
    if (phase !== "aiming") return;
    cancelAnimationFrame(aimFrame);
    const position = Number.parseFloat(els.aimCursor.style.left || "0");
    castQuality = Math.max(0, Math.round(100 - Math.abs(position - 50) * 2));
    const grade = castQuality >= 85 ? "完美" : castQuality >= 65 ? "良好" : castQuality >= 35 ? "普通" : "偏远";
    els.aimText.textContent = `${grade}抛点 ${castQuality}%`;
    els.aimGame.classList.add("hidden");
    phase = "idle";
    updateAction();
    castRod(castQuality);
  }

  function catchPhotoCanvas() {
    if (!lastCatch) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const context = canvas.getContext("2d");
    const background = context.createLinearGradient(0, 0, 0, canvas.height);
    background.addColorStop(0, "#04556a");
    background.addColorStop(.52, "#033748");
    background.addColorStop(1, "#011924");
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(240, -120);
    context.rotate(.36);
    for (let index = 0; index < 7; index += 1) {
      context.fillStyle = `rgba(175,255,245,${0.03 + index * 0.012})`;
      context.fillRect(index * 105, 0, 42, canvas.height * 1.6);
    }
    context.restore();
    context.textAlign = "center";
    context.font = "210px serif";
    context.fillText(lastCatch.detail.emoji, canvas.width / 2, 460);
    context.fillStyle = "rgba(255,255,255,.96)";
    context.font = "700 56px PingFang SC, Microsoft YaHei, sans-serif";
    context.fillText(lastCatch.detail.name, canvas.width / 2, 590);
    context.font = "26px PingFang SC, Microsoft YaHei, sans-serif";
    context.fillStyle = "rgba(224,247,252,.82)";
    context.fillText(`${lastCatch.weight}kg · +${lastCatch.value}金币 · ${lastCatch.accuracyLabel}`, canvas.width / 2, 638);
    context.fillText(`${lastCatch.locationName} · ${lastCatch.weatherLabel} · ${lastCatch.time.toLocaleString("zh-CN")}`, canvas.width / 2, 676);
    context.textAlign = "right";
    context.fillStyle = "rgba(255,255,255,.58)";
    context.font = "700 24px PingFang SC, sans-serif";
    context.fillText("云钓鱼 · 渔获纪念", canvas.width - 38, canvas.height - 32);
    context.strokeStyle = "rgba(255,255,255,.18)";
    context.lineWidth = 5;
    context.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
    return canvas;
  }

  function downloadCatchPhoto() {
    const canvas = catchPhotoCanvas();
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `cloud-fishing-${lastCatch.detail.id}-${Date.now()}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }, "image/png", 0.94);
  }

  async function shareCatchPhoto() {
    const canvas = catchPhotoCanvas();
    if (!canvas) return;
    const itemText = `${lastCatch.detail.name} ${lastCatch.weight}kg · ${lastCatch.accuracyLabel} · ${lastCatch.locationName}`;
    try {
      const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("照片生成失败")), "image/png", 0.94));
      const file = new File([blob], "cloud-fishing-catch.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "云钓鱼渔获", text: itemText });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "云钓鱼渔获", text: itemText });
        return;
      }
      downloadCatchPhoto();
    } catch (error) {
      if (error?.name !== "AbortError") downloadCatchPhoto();
    }
  }

  function sellAll() {
    if (!save.bag.length) return;
    const earned = save.bag.reduce((sum, item) => sum + item.value, 0);
    save.coins += earned;
    save.totalEarned += earned;
    save.bag = [];
    persist();
    render();
  }

  function hideCatchReveal() {
    clearTimeout(revealTimer);
    revealTimer = null;
    els.reveal.classList.remove("show");
  }

  function bagGroups() {
    return Object.values(save.bag.reduce((groups, item) => {
      const key = `${item.fishId}-${item.value}`;
      if (!groups[key]) {
        const detail = fish[item.fishId];
        groups[key] = { detail, count: 0, weight: 0, value: 0 };
      }
      groups[key].count += 1;
      groups[key].weight += item.weight;
      groups[key].value += item.value;
      return groups;
    }, {})).sort((a, b) => b.value - a.value);
  }

  function stablePercent(text, min, max, salt = "") {
    let hash = 0;
    const source = `${text}-${salt}`;
    for (let index = 0; index < source.length; index += 1) {
      hash = (hash * 33 + source.charCodeAt(index)) % 100003;
    }
    return min + (hash / 100003) * (max - min);
  }

  function aquariumGroups() {
    return [
      ...locations.map((location) => ({
        id: location.id,
        name: location.name,
        emoji: location.emoji,
        items: location.table.map(([fishId]) => fish[fishId])
      })),
      {
        id: "weather",
        name: "特殊天气水域",
        emoji: "🌦️",
        items: Object.values(weatherFish)
      }
    ];
  }

  function render() {
    els.coins.textContent = save.coins.toLocaleString();
    els.catches.textContent = save.totalCatches.toLocaleString();
    renderLocations();
    renderFishing();
    renderBag();
    renderShop();
    renderAquarium();
    renderWeather();
  }

  function renderLocations() {
    if (!els.selector) return;
    els.selector.innerHTML = "";
    for (const location of locations) {
      const unlocked = isUnlocked(location);
      const button = document.createElement("button");
      button.className = `location-button${location.id === save.activeLocationId ? " active" : ""}${unlocked ? "" : " locked"}`;
      button.innerHTML = `
        <span class="location-emoji">${location.emoji}</span>
        <span>
          <span class="location-title">${location.name}</span>
          <span class="location-sub">${unlocked ? "已解锁" : `解锁需 ${location.unlockCost} 金币`}</span>
        </span>
      `;
      button.addEventListener("click", () => {
        if (unlocked) {
          stopFishing(true);
          save.activeLocationId = location.id;
          persist();
          render();
        } else {
          unlockLocation(location);
        }
      });
      els.selector.append(button);
    }
  }

  function renderFishing() {
    const location = getLocation();
    els.scene.dataset.location = location.id;
    window.CloudFishingScene?.setLocation(location.id);
    ambientAudio.setLocation(location.id);
    els.name.textContent = location.name;
    els.desc.textContent = location.desc;
    const { rod, bait } = gear();
    els.equipmentStatus.innerHTML = `
      <span>竿：${rod.emoji} ${rod.name}</span>
      <span>饵：${bait.emoji} ${bait.name}</span>
    `;
    if (phase !== "reeling") updateAction();
    els.sellAll.disabled = !save.bag.length;
    els.log.innerHTML = save.log.length ? save.log.map((item) => `
      <div class="catch-item">
        <span>${fishVisual(fish[item.fishId] || item)}</span>
        <span>${item.name} · ${item.weight}kg</span>
        <small>+${item.value} 金币 · ${RARITY_LABELS[item.rarity]}</small>
      </div>
    `).join("") : '<p class="empty">还没有钓到鱼。</p>';
  }

  function renderBag() {
    const groups = bagGroups();
    els.sellAllBag.disabled = !groups.length;
    els.bag.innerHTML = groups.length ? groups.map((group) => `
      <article class="item-card">
        <div class="item-head">
          <span class="item-emoji">${fishVisual(group.detail)}</span>
          <span class="rarity ${group.detail.rarity}">${RARITY_LABELS[group.detail.rarity]}</span>
        </div>
        <h4>${group.detail.name} ×${group.count}</h4>
        <p>总重 ${group.weight.toFixed(2)} kg<br>总价值 ${group.value} 金币</p>
      </article>
    `).join("") : '<p class="empty">背包是空的，先去钓几条鱼吧。</p>';
  }

  function renderAquarium() {
    const groups = aquariumGroups();
    const owned = Object.values(allFish).filter((item) => save.caughtCounts[item.id] > 0);
    els.aquariumProgress.textContent = `${owned.length}/${Object.keys(allFish).length} 种已入箱`;
    els.aquariumTank.innerHTML = owned.map((item) => `
      <img class="fish-image aquarium-fish" src="${fishImage(item)}" alt="${item.name}" loading="lazy"
        style="top:${stablePercent(item.id, 16, 74).toFixed(1)}%;left:${stablePercent(item.id, 4, 78, "x").toFixed(1)}%;
          --swim-duration:${(9 + stablePercent(item.id, 0, 10)).toFixed(1)}s;
          --swim-delay:${(-stablePercent(item.id, 0, 9, "delay")).toFixed(1)}s"
        onerror="this.replaceWith(document.createTextNode('${item.emoji}'))">
    `).join("");
    els.aquariumList.innerHTML = groups.map((group) => {
      const groupOwned = group.items.filter((item) => save.caughtCounts[item.id] > 0).length;
      const cards = group.items.map((item) => {
        const count = save.caughtCounts[item.id] || 0;
        return `
          <article class="item-card${count ? "" : " locked-card"}">
            <div class="item-head">
              <span class="item-emoji">${count ? fishVisual(item) : "❓"}</span>
              <span class="rarity ${item.rarity}">${RARITY_LABELS[item.rarity]}</span>
            </div>
            <h4>${count ? item.name : "未入箱"}</h4>
            <p>${count
              ? `已捕获 ${count} 次${item.weatherKind ? "<br>天气限定品种" : ""}`
              : item.weatherKind ? "对应天气时探索" : "前往对应钓场探索"}</p>
          </article>
        `;
      }).join("");
      return `
        <div class="aquarium-group">
          <div class="section-head aquarium-group-head">
            <h3>${group.emoji} ${group.name}</h3>
            <span>${groupOwned}/${group.items.length}</span>
          </div>
          <div class="item-grid">${cards}</div>
        </div>
      `;
    }).join("");
  }

  function renderShop() {
    els.rodShop.innerHTML = Object.values(rods).map((item) => renderShopItem("rod", item)).join("");
    els.baitShop.innerHTML = Object.values(baits).map((item) => renderShopItem("bait", item)).join("");
    els.accessoryShop.innerHTML = Object.values(accessories).map((item) => renderShopItem("accessory", item)).join("");
  }

  function renderShopItem(type, item) {
    const owned = isOwned(type, item);
    return `
      <article class="item-card shop-card${owned ? "" : " locked-card"}">
        <div class="item-head">
          <span class="item-emoji">${item.emoji}</span>
          <span class="rarity ${owned ? "common" : "rare"}">${owned ? "已拥有" : `${item.cost} 金币`}</span>
        </div>
        <h4>${item.name}</h4>
        <p>${item.desc}<br><small>${equipmentStats(item)}</small></p>
        <button class="shop-button" data-type="${type}" data-id="${item.id}" ${owned || save.coins < item.cost ? "disabled" : ""}>
          ${owned ? (type === "accessory" ? "已激活" : "当前装备") : "购买"}
        </button>
      </article>
    `;
  }

  function equipmentStats(item) {
    const labels = {
      biteSpeed: "咬饵",
      rareBias: "稀有鱼",
      hookPower: "成功",
      reelPower: "收线",
      lineStrength: "鱼线"
    };
    return Object.entries(labels)
      .filter(([key]) => item[key] && item[key] !== 1)
      .map(([key, label]) => `${label} ×${item[key].toFixed(2)}`)
      .join(" · ") || "基础效果";
  }

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      els.tabs.forEach((item) => item.classList.toggle("active", item === tab));
      els.views.forEach((view) => view.classList.toggle("active", view.id === `${tab.dataset.view}-view`));
    });
  });

  els.action.addEventListener("pointerdown", handlePressStart);
  els.action.addEventListener("pointerup", handlePressEnd);
  els.action.addEventListener("pointerleave", handlePressEnd);
  els.action.addEventListener("pointercancel", handlePressEnd);
  window.addEventListener("keydown", (event) => {
    if (event.code !== "Space" || event.repeat) return;
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    if (activeTag === "input" || activeTag === "textarea") return;
    if (activeTag === "button" && document.activeElement !== els.action) return;
    handlePressStart(event);
  });
  window.addEventListener("keyup", (event) => {
    if (event.code === "Space") handlePressEnd();
  });
  els.sellAll.addEventListener("click", sellAll);
  els.sellAllBag.addEventListener("click", sellAll);
  els.weatherRefresh.addEventListener("click", loadWeather);
  els.reveal.addEventListener("click", (event) => {
    if (event.target.closest(".reveal-actions")) return;
    hideCatchReveal();
  });
  els.savePhoto.addEventListener("click", downloadCatchPhoto);
  els.shareCatch.addEventListener("click", shareCatchPhoto);
  els.ambientToggle.addEventListener("click", () => {
    const muted = ambientAudio.toggle();
    els.ambientToggle.textContent = muted ? "🔇 环境音" : "🔊 环境音";
  });
  els.shop.addEventListener("click", (event) => {
    const button = event.target.closest(".shop-button");
    if (!button || button.disabled) return;
    const type = button.dataset.type;
    const item = { rod: rods, bait: baits, accessory: accessories }[type][button.dataset.id];
    buyEquipment(type, item);
  });
  els.reset.addEventListener("click", () => {
    if (!confirm("确定要重置所有钓鱼记录吗？")) return;
    stopFishing(true);
    hideCatchReveal();
    save = structuredClone(defaultSave);
    persist();
    render();
  });

  ["pointerdown", "keydown"].forEach((eventType) => {
    document.addEventListener(eventType, () => ambientAudio.start(), { once: true });
  });

  render();
  const requestedView = location.hash.replace("#", "");
  const normalizedView = requestedView === "collection" ? "aquarium" : requestedView;
  if (["bag", "shop", "aquarium"].includes(normalizedView)) {
    const tab = els.tabs.find((item) => item.dataset.view === normalizedView);
    if (tab) tab.click();
  }
  startClock();
  setInterval(syncSceneTime, 60000);
  loadWeather();
})();
