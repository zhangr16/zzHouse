import * as THREE from "three";

export function createInteractions({ elements, ui, sceneApi, avatarApi, effects, audio, models, getNetwork }) {
  const {
    avatar, figure, head, leftArm, rightArm, leftLeg, rightLeg, basketball, applySkinToChibi, localChibi
  } = avatarApi;
  const {
    scene, camera, renderer, sun, fillLight, hemisphereLight, groundLevel, surfaceLevel, colliders, statue, burner,
    altarLight, bell, woodenFish, ritualMats, lanternLights, incensePickupPoint,
    incenseCapacity, incenseInsertPositions, incenseTraySticks, releaseFish, pondGroup,
    setTempleArea, areaConfig, skyUniforms, cloudMaterials
  } = sceneApi;
  const {
    prayButton, bellButton, woodfishButton, oracleButton, releaseButton, pickupButton,
    incenseButton, danceButton, musicButton, fortunePanel, zodiacPanel, weatherPanel,
    fortuneClose, virtualJoystick, joystickBase, joystickKnob, skinButton, skinPanel,
    skinGrid, timeIndicator, app
  } = elements;
  const oraclePanel = document.getElementById("oracle-panel");
  const entranceHint = document.getElementById("entrance-hint");
  const notify = ui.showToast;
  let currentSkin = "caixukun";
  try {
    const savedSkin = localStorage.getItem("cloud-worship-skin");
    if (savedSkin && avatarApi.skinConfigs[savedSkin]) currentSkin = savedSkin;
  } catch {}
  const initialSkinConfig = applySkinToChibi(localChibi, currentSkin);
  danceButton.textContent = `${initialSkinConfig.skillIcon} ${initialSkinConfig.skillLabel}`;

  const keys = { forward: false, backward: false, left: false, right: false };
  const state = {
    location: "outside",
    velocity: new THREE.Vector3(),
    heading: Math.PI,
    praying: false,
    prayingOnFortune: false,
    prayTimer: 0,
    dancing: false,
    danceTimer: 0,
    incense: 0,
    hasIncense: false,
    carriedIncense: null,
    incenseRitual: null,
    bellTimer: 0,
    woodfishSession: false,
    woodfishTimer: 0,
    nextWoodfish: 0,
    woodfishMusicStarted: false,
    skillKey: currentSkin,
    walkPhase: 0
  };
  const cameraControl = {
    yaw: 0,
    pitch: .20,
    radius: 7,
    targetYaw: 0,
    targetPitch: .20,
    targetRadius: 7,
    pointers: new Map(),
    dragDistance: 0,
    downTime: 0
  };
  const skillDurations = { caixukun: 9.04, monk: 5.6, layperson: 5.8 };
  const skillCamera = {
    active: false,
    startYaw: 0,
    startPitch: .25,
    startRadius: 7,
    duration: skillDurations.caixukun
  };
  const joystick = { active: false, pointerId: null, x: 0, y: 0 };
  const movementForward = new THREE.Vector3();
  const movementRight = new THREE.Vector3();
  const movementDirection = new THREE.Vector3();
  const PLAYER_COLLISION_RADIUS = .22;
  const resolvedPlayerPosition = { x: 0, z: 0 };

  function updateTempleArea() {
    let nextArea = state.location;
    if (state.location === "outside" && avatar.position.z < areaConfig.interiorZ) nextArea = "inside";
    if (state.location === "inside" && avatar.position.z > areaConfig.exteriorZ) nextArea = "outside";
    if (nextArea === state.location) return;
    state.location = nextArea;
    setTempleArea(nextArea);
    models?.preloadArea(nextArea);
    notify(nextArea === "inside" ? "已进入正殿。" : "已回到庭院。");
  }

  let entranceHintShown = false;
  function updateEntranceHint() {
    if (!entranceHint) return;
    const shouldShow = state.location === "outside" && avatar.position.z > areaConfig.interiorZ;
    if (shouldShow === entranceHintShown) return;
    entranceHintShown = shouldShow;
    entranceHint.classList.toggle("show", shouldShow);
  }

  function resolvePlayerCollisions(positionX, positionZ) {
    let x = positionX;
    let z = positionZ;
    for (let pass = 0; pass < 4; pass++) {
      let adjusted = false;
      for (const collider of colliders) {
        const minimumDistance = collider.radius + PLAYER_COLLISION_RADIUS;
        let offsetX = x - collider.x;
        let offsetZ = z - collider.z;
        const distanceSquared = offsetX * offsetX + offsetZ * offsetZ;
        if (distanceSquared >= minimumDistance * minimumDistance) continue;
        let distance = Math.sqrt(distanceSquared);
        if (distance < .00001) {
          offsetX = 0;
          offsetZ = 1;
          distance = 1;
        }
        const pushDistance = minimumDistance - distance + .001;
        x += offsetX / distance * pushDistance;
        z += offsetZ / distance * pushDistance;
        adjusted = true;
      }
      if (!adjusted) break;
    }
    resolvedPlayerPosition.x = x;
    resolvedPlayerPosition.z = z;
    return resolvedPlayerPosition;
  }

  function sendAction(action) {
    getNetwork()?.sendAction(action);
  }

  function nearAltar() { return Math.hypot(avatar.position.x, avatar.position.z + 2.45) < 1.25; }
  function nearIncenseStand() { return Math.hypot(avatar.position.x - incensePickupPoint.x, avatar.position.z - incensePickupPoint.z) < 1.02; }
  function onRitualMat(kind) { return ritualMats.some(mat => mat.kind === kind && avatar.position.distanceTo(mat.position) < .82); }
  function onFortuneMat() { return onRitualMat("fortune") || onRitualMat("weather"); }
  function nearBell() { return Math.hypot(avatar.position.x + 3.45, avatar.position.z - 8.05) < 1.28; }
  function nearWoodfish() { return Math.hypot(avatar.position.x - 3, avatar.position.z + 4.1) < 1.22; }
  function nearOracleStand() { return Math.hypot(avatar.position.x - 1.45, avatar.position.z - .35) < 1.15; }
  function nearPond() { return Math.hypot(avatar.position.x + 6.2, avatar.position.z - 20.5) < 3.35; }

  function knockBell() {
    if (state.praying || state.incenseRitual || state.dancing || state.woodfishSession) return;
    state.bellTimer = 2.6;
    audio.playBellSound();
    sendAction("bell");
    notify("钟声远送，心意安稳。");
  }

  function startWoodfish() {
    if (state.praying || state.incenseRitual || state.dancing || state.woodfishSession) return;
    state.woodfishSession = true;
    state.woodfishTimer = 0;
    state.nextWoodfish = .08;
    state.woodfishMusicStarted = !audio.ambientAudio.playing;
    if (state.woodfishMusicStarted) audio.toggleMusic();
    sendAction("woodfish");
    notify("木鱼声起，随节奏静心。");
  }

  function stopWoodfish() {
    state.woodfishSession = false;
    state.woodfishTimer = 0;
    state.nextWoodfish = 0;
    woodenFish.mallet.rotation.set(-.4, 0, -.65);
    if (state.woodfishMusicStarted && audio.ambientAudio.playing) audio.toggleMusic();
    state.woodfishMusicStarted = false;
    resetChibiPose();
  }

  function toggleWoodfish() {
    if (state.woodfishSession) stopWoodfish();
    else startWoodfish();
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value + 0x6d2b79f5) >>> 0;
      let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
      mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }

  const zodiacs = [
    { name: "白羊座", glyph: "♈" }, { name: "金牛座", glyph: "♉" }, { name: "双子座", glyph: "♊" },
    { name: "巨蟹座", glyph: "♋" }, { name: "狮子座", glyph: "♌" }, { name: "处女座", glyph: "♍" },
    { name: "天秤座", glyph: "♎" }, { name: "天蝎座", glyph: "♏" }, { name: "射手座", glyph: "♐" },
    { name: "摩羯座", glyph: "♑" }, { name: "水瓶座", glyph: "♒" }, { name: "双鱼座", glyph: "♓" }
  ];

  function getDailyFortune(zodiac) {
    const date = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
    const storageKey = `cloud-worship-fortune-v2-${zodiac}`;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved?.date === date && Number.isFinite(saved.overall)) return saved;
    } catch { localStorage.removeItem(storageKey); }

    let seed = 2166136261;
    for (const character of `cloud-temple-${date}-${zodiac}`) {
      seed ^= character.charCodeAt(0);
      seed = Math.imul(seed, 16777619);
    }
    const random = seededRandom(seed);
    const overall = 48 + Math.floor(random() * 51);
    const score = () => THREE.MathUtils.clamp(overall + Math.floor(random() * 25) - 12, 38, 99);
    const grade = overall >= 88 ? "大吉" : overall >= 76 ? "吉" : overall >= 62 ? "小吉" : overall >= 50 ? "平" : "宜静";
    const summaries = [
      "今天适合安静收束，少争一时之气。",
      "小步推进即可，稳定比冒进更有收获。",
      "机遇正在靠近，主动表达会带来转机。",
      "贵人缘不错，遇事多听一句建议。",
      "节奏偏慢，不必着急，先照顾好自己。"
    ];
    const doItems = ["静坐", "整理", "早睡", "散步", "读书", "还愿", "记账", "喝水", "复盘", "联系旧友"];
    const avoidItems = ["争执", "熬夜", "冲动消费", "过度承诺", "临时改计划", "翻旧账", "久坐不动", "贪凉", "空想", "比较"];
    const pick = items => [items[Math.floor(random() * items.length)], items[Math.floor(random() * items.length)]]
      .filter((item, index, list) => list.indexOf(item) === index).slice(0, 2).join("、") || items[0];
    const fortune = {
      zodiac, date, grade, overall,
      summary: summaries[Math.floor(random() * summaries.length)],
      career: score(), wealth: score(), health: score(), social: score(),
      do: pick(doItems), avoid: pick(avoidItems)
    };
    try { localStorage.setItem(storageKey, JSON.stringify(fortune)); } catch {}
    return fortune;
  }

  function showDailyFortune() {
    const zodiac = state.selectedZodiac || "白羊座";
    const fortune = getDailyFortune(zodiac);
    document.getElementById("fortune-date").textContent = `${fortune.date} · ${fortune.grade}`;
    document.querySelector(".fortune-label").textContent = `${fortune.zodiac} · 今日运势`;
    document.getElementById("fortune-overall").textContent = fortune.overall;
    document.getElementById("fortune-summary").textContent = fortune.summary;
    document.getElementById("fortune-career").textContent = `${fortune.career} 分`;
    document.getElementById("fortune-wealth").textContent = `${fortune.wealth} 分`;
    document.getElementById("fortune-health").textContent = `${fortune.health} 分`;
    document.getElementById("fortune-social").textContent = `${fortune.social} 分`;
    document.getElementById("fortune-do").textContent = fortune.do;
    document.getElementById("fortune-avoid").textContent = fortune.avoid;
    fortunePanel.hidden = false;
  }

  const oracleSticks = [
    { grade: "上上签", poem: "春風得意馬蹄疾，一日看盡長安花。", reading: "運勢正旺，所求皆可成。諸事順遂，貴人相助。", do: "行動", avoid: "猶豫" },
    { grade: "上上签", poem: "花開堪折直須折，莫待無花空折枝。", reading: "時機已至，勇敢向前。心誠則靈，所願必成。", do: "把握", avoid: "遲疑" },
    { grade: "上签", poem: "山重水複疑無路，柳暗花明又一村。", reading: "看似困難，實則轉機在即。堅持前行，豁然開朗。", do: "堅持", avoid: "放棄" },
    { grade: "上签", poem: "長風破浪會有時，直掛雲帆濟滄海。", reading: "志向可期，時來運轉。穩中求進，步步高升。", do: "展望", avoid: "急躁" },
    { grade: "中签", poem: "行到水窮處，坐看雲起時。", reading: "順其自然，不必強求。靜待時機，自有所得。", do: "靜心", avoid: "強求" },
    { grade: "中签", poem: "不識廬山真面目，只緣身在此山中。", reading: "當局者迷，旁觀者清。多聽建議，撥雲見日。", do: "請教", avoid: "固執" },
    { grade: "中签", poem: "隨遇而安天地寬，知足常樂歲月長。", reading: "平淡是福，知足者樂。珍惜眼前，感恩所有。", do: "感恩", avoid: "攀比" },
    { grade: "中签", poem: "千淘萬漉雖辛苦，吹盡狂沙始到金。", reading: "過程雖辛，終有所成。耐心打磨，光芒自現。", do: "耐心", avoid: "氣餒" },
    { grade: "下签", poem: "近水樓台先得月，向陽花木早逢春。", reading: "宜靜不宜動，暫且守成。養精蓄銳，靜候春來。", do: "守成", avoid: "冒進" },
    { grade: "下签", poem: "山雨欲來風滿樓，且將新火試新茶。", reading: "前路多變，宜低調行事。照顧身心，遠離紛爭。", do: "休息", avoid: "爭執" }
  ];

  function drawOracleStick() {
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
    const storageKey = "cloud-worship-oracle-daily";
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved?.date === today) return saved;
    } catch { localStorage.removeItem(storageKey); }
    let seed = 2166136261;
    for (const character of `oracle-${today}`) {
      seed ^= character.charCodeAt(0);
      seed = Math.imul(seed, 16777619);
    }
    const random = seededRandom(seed);
    const weights = [.08, .10, .16, .16, .18, .14, .10, .04, .02, .02];
    let roll = random(), index = 0;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) { index = i; break; }
    }
    const stick = { ...oracleSticks[index], date: today };
    try { localStorage.setItem(storageKey, JSON.stringify(stick)); } catch {}
    return stick;
  }

  function showOracleResult() {
    const stick = drawOracleStick();
    document.getElementById("oracle-grade").textContent = stick.grade;
    document.getElementById("oracle-poem").textContent = stick.poem;
    document.getElementById("oracle-reading").textContent = stick.reading;
    document.getElementById("oracle-do").textContent = stick.do;
    document.getElementById("oracle-avoid").textContent = stick.avoid;
    const icon = document.getElementById("oracle-stick-icon");
    icon.style.animation = "none";
    icon.offsetHeight;
    icon.style.animation = "";
    oraclePanel.hidden = false;
  }

  function openZodiacPanel() {
    const grid = document.getElementById("zodiac-grid");
    if (!grid.childElementCount) {
      zodiacs.forEach(zodiac => {
        const button = document.createElement("button");
        button.type = "button";
        button.innerHTML = `${zodiac.name}<span>${zodiac.glyph}</span>`;
        button.addEventListener("click", () => {
          state.selectedZodiac = zodiac.name;
          zodiacPanel.hidden = true;
          showDailyFortune();
        });
        grid.append(button);
      });
    }
    zodiacPanel.hidden = false;
  }

  const weatherCodes = {
    0: ["晴", "☀️"], 1: ["大致晴", "🌤️"], 2: ["局部多云", "⛅"], 3: ["阴", "☁️"],
    45: ["雾", "🌫️"], 48: ["雾凇", "🌫️"], 51: ["小毛雨", "🌦️"], 53: ["毛雨", "🌦️"], 55: ["大毛雨", "🌧️"],
    61: ["小雨", "🌦️"], 63: ["中雨", "🌧️"], 65: ["大雨", "🌧️"], 71: ["小雪", "🌨️"], 73: ["中雪", "🌨️"], 75: ["大雪", "❄️"],
    80: ["阵雨", "🌦️"], 81: ["较强阵雨", "🌧️"], 82: ["强阵雨", "⛈️"], 95: ["雷阵雨", "⛈️"], 96: ["雷雨伴冰雹", "⛈️"], 99: ["强雷雨伴冰雹", "⛈️"]
  };
  const weatherLocationLabel = document.getElementById("weather-location");
  const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  let weatherRequestId = 0;

  function fallbackWeather() {
    const random = seededRandom(Number(new Date().toLocaleDateString("sv-SE", { timeZone: browserTimeZone }).replaceAll("-", "")));
    const codes = [0, 1, 2, 3, 61, 80];
    return {
      daily: {
        time: [...Array(4)].map((_, index) => {
          const day = new Date();
          day.setDate(day.getDate() + index);
          return day.toLocaleDateString("sv-SE", { timeZone: browserTimeZone });
        }),
        weather_code: codes.map(() => codes[Math.floor(random() * codes.length)]),
        temperature_2m_max: [...Array(4)].map(() => Math.round(14 + random() * 11)),
        temperature_2m_min: [...Array(4)].map(() => Math.round(7 + random() * 7)),
        precipitation_probability_max: [...Array(4)].map(() => Math.round(random() * 82))
      }
    };
  }

  async function fetchJson(url, timeout = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchWeatherSource(url) {
    const data = await fetchJson(url);
    const daily = data?.daily;
    if (!Array.isArray(daily?.time) || daily.time.length < 4) throw new Error("天气数据结构不完整");
    return data;
  }

  function hasCoordinates(latitude, longitude) {
    return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  }

  function getBrowserLocation(timeout = 4500) {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      const fallbackTimer = setTimeout(() => resolve(null), timeout + 400);
      const finish = location => {
        clearTimeout(fallbackTimer);
        resolve(location);
      };
      try {
        navigator.geolocation.getCurrentPosition(
          position => finish({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }),
          () => finish(null),
          { enableHighAccuracy: false, timeout, maximumAge: 10 * 60 * 1000 }
        );
      } catch {
        finish(null);
      }
    });
  }

  async function resolveRegionName(latitude, longitude) {
    try {
      const data = await fetchJson(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`, 4000);
      return data?.city || data?.locality || data?.principalSubdivision || data?.countryName || "";
    } catch {
      return "";
    }
  }

  async function resolveIpLocation() {
    const sources = [
      async () => {
        const data = await fetchJson("https://ipwho.is/", 4000);
        const latitude = Number(data?.latitude);
        const longitude = Number(data?.longitude);
        if (data?.success === false || !hasCoordinates(latitude, longitude)) throw new Error("IP 定位不可用");
        return { latitude, longitude, name: data.city || data.region || data.country || "" };
      },
      async () => {
        const data = await fetchJson("https://ipapi.co/json/", 4000);
        const latitude = Number(data?.latitude);
        const longitude = Number(data?.longitude);
        if (data?.error || !hasCoordinates(latitude, longitude)) throw new Error("IP 定位不可用");
        return { latitude, longitude, name: data.city || data.region || data.country_name || "" };
      }
    ];
    try {
      return await Promise.any(sources.map(source => source()));
    } catch {
      return null;
    }
  }

  function formatWeatherRegion(name) {
    const region = String(name || "").trim();
    if (!region) return "当前位置";
    return /(市|区|县|州|盟|旗)$/.test(region) ? region : `${region}地区`;
  }

  function setWeatherLocation(name) {
    if (weatherLocationLabel) weatherLocationLabel.textContent = `天气毯 · ${formatWeatherRegion(name)}`;
  }

  async function resolveWeatherLocation() {
    const params = new URLSearchParams(location.search);
    const latitudeParam = params.get("lat");
    const longitudeParam = params.get("lon");
    const latitude = Number(latitudeParam);
    const longitude = Number(longitudeParam);
    if (latitudeParam !== null && longitudeParam !== null && hasCoordinates(latitude, longitude)) {
      const name = params.get("region") || await resolveRegionName(latitude, longitude);
      return { latitude, longitude, name };
    }
    const ipLocationPromise = resolveIpLocation();
    const browserLocation = await getBrowserLocation();
    if (browserLocation) {
      const regionName = await resolveRegionName(browserLocation.latitude, browserLocation.longitude);
      if (regionName) return { ...browserLocation, name: regionName };
      const ipLocation = await ipLocationPromise;
      return { ...browserLocation, name: ipLocation?.name || "" };
    }
    return await ipLocationPromise || { latitude: null, longitude: null, name: "" };
  }

  async function showWeather() {
    const requestId = ++weatherRequestId;
    const grid = document.getElementById("weather-grid");
    const note = document.getElementById("weather-note");
    grid.innerHTML = '<div class="weather-loading">正在读取未来三天天气…</div>';
    note.textContent = "正在连接天气服务…";
    if (weatherLocationLabel) weatherLocationLabel.textContent = "天气毯 · 正在定位…";
    weatherPanel.hidden = false;
    const weatherLocation = await resolveWeatherLocation();
    if (requestId !== weatherRequestId) return;
    setWeatherLocation(weatherLocation.name);
    let weather = fallbackWeather();
    let loaded = false;
    if (hasCoordinates(weatherLocation.latitude, weatherLocation.longitude)) {
      const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${weatherLocation.latitude}&longitude=${weatherLocation.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=4`;
      const weatherSources = [
        { url: openMeteoUrl, label: "Open-Meteo" },
        { url: `https://corsproxy.io/?url=${encodeURIComponent(openMeteoUrl)}`, label: "Open-Meteo · 代理" },
        { url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(openMeteoUrl)}`, label: "Open-Meteo · 备用" },
        { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(openMeteoUrl)}`, label: "Open-Meteo · 备用" }
      ];
      for (const source of weatherSources) {
        try {
          weather = await fetchWeatherSource(source.url);
          note.textContent = `实时数据 · ${source.label}`;
          loaded = true;
          break;
        } catch {}
      }
    }
    if (requestId !== weatherRequestId) return;
    if (!loaded) {
      note.textContent = weatherLocation.latitude === null
        ? "无法获取当前位置，已显示估算结果。"
        : `实时接口暂不可用，已显示${formatWeatherRegion(weatherLocation.name)}估算结果。`;
    }
    document.getElementById("weather-date").textContent = "今日 + 未来三天";
    grid.innerHTML = weather.daily.time.slice(0, 4).map((date, index) => {
      const code = weatherCodes[weather.daily.weather_code[index]] || ["天气", "🌤️"];
      const label = index === 0 ? "今天" : index === 1 ? "明天" : index === 2 ? "后天" : "大后天";
      return `<div class="weather-day"><strong>${label}</strong><div class="weather-icon">${code[1]}</div><div class="weather-detail">${code[0]}<br>降水概率 ${weather.daily.precipitation_probability_max?.[index] ?? 0}%</div><div class="weather-temp">${Math.round(weather.daily.temperature_2m_min?.[index] ?? 0)}° / ${Math.round(weather.daily.temperature_2m_max?.[index] ?? 0)}°</div></div>`;
    }).join("");
  }

  function lightIncense() {
    if (state.incense >= incenseCapacity) return notify("香炉已满，静待清香燃尽。");
    if (state.praying || state.incenseRitual || state.dancing) return;
    if (!state.hasIncense) return notify("先到入口取香点，拿取一支香。");
    if (!nearAltar()) return notify("先走到香炉前，再点击上香。");
    const spot = incenseInsertPositions[state.incense], offset = spot.x, depth = spot.z;
    state.heading = Math.PI;
    avatar.rotation.y = Math.PI;
    state.carriedIncense.position.set(.015, .01, .045);
    state.carriedIncense.rotation.set(-.42, 0, offset * .4);
    state.incenseRitual = {
      timer: 0, offset, depth, heldIncense: state.carriedIncense, inserted: false,
      ember: state.carriedIncense.children[1], seed: Math.random() * 9
    };
    incenseButton.disabled = true;
    sendAction("incense");
    notify("清香已上，愿心中安宁。");
  }

  function takeIncense() {
    if (state.praying || state.incenseRitual || state.dancing) return;
    if (state.incense >= incenseCapacity) return notify("香炉已满，静待清香燃尽。");
    if (state.hasIncense) return notify("手中已经有香，先去香炉上香。");
    if (!nearIncenseStand()) return notify("走到入口旁的取香点，即可取香。");
    const heldIncense = new THREE.Group();
    const woodStick = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .44, 8), new THREE.MeshStandardMaterial({ color: "#4a2d1d" }));
    woodStick.position.y = .22;
    const ember = new THREE.Mesh(new THREE.SphereGeometry(.016, 10, 8), new THREE.MeshStandardMaterial({ color: "#ff8135", emissive: "#ff5d10", emissiveIntensity: 5 }));
    ember.position.y = .45;
    heldIncense.add(woodStick, ember);
    heldIncense.position.set(.015, .01, .045);
    heldIncense.rotation.x = -.42;
    rightArm.hand.add(heldIncense);
    incenseTraySticks[state.incense].visible = false;
    state.hasIncense = true;
    state.carriedIncense = heldIncense;
    notify("已取香，走到香炉前上香。");
  }

  function finishIncenseRitual() {
    const ritual = state.incenseRitual;
    rightArm.hand.remove(ritual.heldIncense);
    ritual.heldIncense.rotation.set(0, 0, ritual.offset * .4);
    scene.add(ritual.heldIncense);
    ritual.heldIncense.position.set(ritual.offset, .52, -2.45 + ritual.depth);
    effects.addIncense(ritual.ember, ritual.offset, .97, -2.45 + ritual.depth, ritual.seed);
    state.incense++;
    state.hasIncense = false;
    state.carriedIncense = null;
  }

  function anyRitualPanelOpen() {
    return !fortunePanel.hidden || !zodiacPanel.hidden || !weatherPanel.hidden || !oraclePanel.hidden;
  }

  function contextualButton(button, visible) {
    button.disabled = !visible;
    button.classList.toggle("context-hidden", !visible);
    button.classList.toggle("context-active", visible);
  }

  function updateIncenseControls() {
    const busy = state.praying || state.incenseRitual || state.dancing;
    const pickupVisible = !busy && state.hasIncense === false && state.incense < incenseCapacity && nearIncenseStand();
    const incenseVisible = !busy && state.hasIncense && nearAltar();
    const prayVisible = !busy && !anyRitualPanelOpen() && onFortuneMat();
    const bellVisible = !busy && nearBell();
    const woodfishVisible = !state.praying && !state.incenseRitual && !state.dancing && nearWoodfish();
    const oracleVisible = !busy && oraclePanel.hidden && nearOracleStand();
    const releaseVisible = !busy && nearPond();
    woodfishButton.textContent = state.woodfishSession ? "停止" : "敲木鱼";
    contextualButton(bellButton, bellVisible);
    contextualButton(woodfishButton, woodfishVisible);
    contextualButton(oracleButton, oracleVisible);
    contextualButton(releaseButton, releaseVisible);
    contextualButton(pickupButton, pickupVisible);
    contextualButton(incenseButton, incenseVisible);
    contextualButton(prayButton, prayVisible);
  }

  function pray() {
    if (state.praying || state.incenseRitual || state.dancing || state.woodfishSession || anyRitualPanelOpen()) return;
    state.praying = true;
    state.prayingOnFortune = onRitualMat("fortune") ? "fortune" : onRitualMat("weather") ? "weather" : false;
    state.prayTimer = 0;
    prayButton.disabled = true;
    sendAction("pray");
    if (state.prayingOnFortune === "fortune") notify("跪拜中，请准备选择星座。");
    else if (state.prayingOnFortune === "weather") notify("跪拜中，天气即将显现。");
    const ritualKind = state.prayingOnFortune;
    if (ritualKind === "fortune") { state.prayingOnFortune = false; openZodiacPanel(); }
    else if (ritualKind === "weather") { state.prayingOnFortune = false; showWeather(); }
  }

  function performTrick() {
    if (state.praying || state.incenseRitual || state.dancing || state.hasIncense || state.woodfishSession || anyRitualPanelOpen()) return;
    resetInput();
    state.velocity.set(0, 0, 0);
    cameraControl.pointers.clear();
    skillCamera.active = true;
    skillCamera.startYaw = cameraControl.yaw;
    skillCamera.startPitch = cameraControl.pitch;
    skillCamera.startRadius = cameraControl.radius;
    skillCamera.duration = skillDurations[currentSkin] || skillDurations.caixukun;
    cameraControl.targetYaw = cameraControl.yaw;
    cameraControl.targetPitch = cameraControl.pitch;
    cameraControl.targetRadius = cameraControl.radius;
    state.dancing = true;
    state.danceTimer = 0;
    state.skillKey = currentSkin;
    danceButton.disabled = true;
    const config = avatarApi.skinConfigs[currentSkin] || avatarApi.skinConfigs.caixukun;
    if (currentSkin === "caixukun") {
      basketball.visible = false;
      avatar.add(head);
      head.position.set(.1, .68, .1);
      head.rotation.set(.28, .35, .12);
      head.scale.setScalar(.92);
      audio.playActionAudio(audio.actionAudio.trick);
    } else if (currentSkin === "monk") {
      localChibi.monkAura.visible = true;
      audio.playBellSound();
    } else {
      localChibi.lotusAura.visible = true;
      audio.playBellSound();
    }
    sendAction("dance");
    notify(config.skillNotice);
  }

  function finishSkill() {
    const finishedSkin = state.skillKey;
    state.dancing = false;
    state.danceTimer = 0;
    if (skillCamera.active) {
      cameraControl.yaw = cameraControl.targetYaw = skillCamera.startYaw;
      cameraControl.pitch = cameraControl.targetPitch = skillCamera.startPitch;
      cameraControl.radius = cameraControl.targetRadius = skillCamera.startRadius;
      skillCamera.active = false;
    }
    danceButton.disabled = false;
    localChibi.monkAura.visible = false;
    localChibi.lotusAura.visible = false;
    localChibi.monkAura.scale.setScalar(1);
    localChibi.lotusAura.scale.setScalar(1);
    localChibi.laypersonFan.rotation.z = -.25;
    if (finishedSkin === "caixukun") audio.stopActionAudio();
    resetChibiPose();
    restoreHeadFromHand();
    basketball.visible = currentSkin === "caixukun";
    state.skillKey = currentSkin;
    return finishedSkin;
  }

  function updateMonkSkill() {
    const time = state.danceTimer;
    const calm = Math.sin(time * 2.1);
    figure.position.y = .13 + calm * .028;
    figure.rotation.y = Math.sin(time * 1.7) * .18;
    leftArm.shoulder.rotation.x = -.82 - calm * .05;
    rightArm.shoulder.rotation.x = -.82 + calm * .05;
    leftArm.shoulder.rotation.z = .24;
    rightArm.shoulder.rotation.z = -.24;
    leftLeg.hip.rotation.x = rightLeg.hip.rotation.x = -.08;
    leftLeg.knee.rotation.x = rightLeg.knee.rotation.x = .16;
    head.rotation.x = .10 + Math.sin(time * 1.6) * .035;
    localChibi.monkAura.visible = true;
    localChibi.monkAura.rotation.y = time * 1.4;
    localChibi.monkAura.scale.setScalar(.96 + Math.sin(time * 3.2) * .04);
    if (time >= 5.6) {
      const config = avatarApi.skinConfigs.monk;
      finishSkill();
      notify(config.skillFinish);
    }
  }

  function updateLaypersonSkill() {
    const time = state.danceTimer;
    const sway = Math.sin(time * 2.8);
    figure.position.y = .13 + Math.abs(Math.sin(time * 4.2)) * .04;
    figure.rotation.y = sway * .34;
    leftArm.shoulder.rotation.x = -.56 + sway * .18;
    rightArm.shoulder.rotation.x = -1.12 - sway * .30;
    leftArm.shoulder.rotation.z = .48;
    rightArm.shoulder.rotation.z = -.62;
    leftLeg.hip.rotation.x = -.12;
    rightLeg.hip.rotation.x = .10;
    leftLeg.knee.rotation.x = rightLeg.knee.rotation.x = .18;
    head.rotation.x = .08 + Math.sin(time * 3.4) * .04;
    localChibi.laypersonFan.rotation.z = -.25 + Math.sin(time * 6.2) * .42;
    localChibi.lotusAura.visible = true;
    localChibi.lotusAura.rotation.y = -time * 1.7;
    localChibi.lotusAura.scale.setScalar(.88 + Math.sin(time * 3.8) * .10);
    if (time >= 5.8) {
      const config = avatarApi.skinConfigs.layperson;
      finishSkill();
      notify(config.skillFinish);
    }
  }

  function resetChibiPose() {
    [leftArm.shoulder, rightArm.shoulder].forEach(joint => { joint.rotation.set(0, 0, 0); });
    [leftLeg.hip, rightLeg.hip, leftLeg.knee, rightLeg.knee].forEach(joint => { joint.rotation.set(0, 0, 0); });
    head.rotation.set(0, 0, 0);
    figure.position.set(0, 0, 0);
    figure.rotation.set(0, 0, 0);
  }

  function restoreHeadFromHand() {
    if (head.parent !== figure) {
      head.parent?.remove(head);
      figure.add(head);
    }
    head.position.set(0, 1.13, 0);
    head.rotation.set(0, 0, 0);
    head.scale.setScalar(1);
  }

  function easeInOut(progress) {
    const value = THREE.MathUtils.clamp(progress, 0, 1);
    return value < .5 ? 4 * value * value * value : 1 - (-2 * value + 2) ** 3 / 2;
  }

  function setChibiPose(settle, torsoBow, headBow, handsTogether, breath) {
    const settleEase = easeInOut(settle);
    const sideSway = Math.sin(settle * 2.2) * .028 * (1 - settle);
    leftLeg.hip.rotation.x = (-1.18 * settleEase) + sideSway;
    rightLeg.hip.rotation.x = (-1.30 * settleEase) - sideSway;
    leftLeg.knee.rotation.x = 2.36 * settleEase;
    rightLeg.knee.rotation.x = 2.56 * settleEase;
    figure.position.y = -.252 * settleEase + .008 * Math.sin(settleEase * Math.PI);
    figure.position.z = .048 * easeInOut(torsoBow) + .024 * settleEase;
    figure.rotation.x = .78 * easeInOut(torsoBow) + .05 * settleEase;
    figure.rotation.z = sideSway * .72;
    head.rotation.x = .14 * easeInOut(torsoBow) + .68 * easeInOut(headBow) - .028 * breath;
    const armReach = -(.34 * settleEase + .82 * easeInOut(torsoBow) + .48 * easeInOut(headBow));
    leftArm.shoulder.rotation.x = rightArm.shoulder.rotation.x = armReach;
    const bringTogether = easeInOut(handsTogether) * (.48 + breath * .085);
    leftArm.shoulder.rotation.z = bringTogether;
    rightArm.shoulder.rotation.z = -bringTogether;
  }

  function updateAvatar(delta) {
    const keyX = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    const keyY = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);
    const joystickStrength = joystick.active ? Math.hypot(joystick.x, joystick.y) : 0;
    const joystickX = joystickStrength > .08 ? joystick.x : 0;
    const joystickY = joystickStrength > .08 ? -joystick.y : 0;
    const inputX = THREE.MathUtils.clamp(keyX + joystickX, -1, 1);
    const inputY = THREE.MathUtils.clamp(keyY + joystickY, -1, 1);
    const inputStrength = Math.min(1, Math.hypot(inputX, inputY));
    basketball.visible = currentSkin === "caixukun" && !state.praying && !state.incenseRitual && !state.hasIncense && !state.dancing;
    if (state.dancing) {
      state.velocity.set(0, 0, 0);
      state.danceTimer += delta;
      if (state.skillKey === "monk") { updateMonkSkill(); return; }
      if (state.skillKey === "layperson") { updateLaypersonSkill(); return; }
      const time = state.danceTimer, beat = time * 3.2;
      const intro = THREE.MathUtils.smoothstep(time, .05, .42);
      const outro = 1 - THREE.MathUtils.smoothstep(time, 8.38, 8.98);
      const groove = intro * outro;
      const firstSpin = THREE.MathUtils.smoothstep(time, 2.08, 2.72) * (1 - THREE.MathUtils.smoothstep(time, 2.82, 3.38));
      const secondSpin = THREE.MathUtils.smoothstep(time, 3.62, 4.28) * (1 - THREE.MathUtils.smoothstep(time, 4.38, 4.92));
      const carryHead = THREE.MathUtils.smoothstep(time, .10, .68) * (1 - THREE.MathUtils.smoothstep(time, 4.92, 5.24));
      const dribble = THREE.MathUtils.smoothstep(time, 5.18, 5.52) * (1 - THREE.MathUtils.smoothstep(time, 7.08, 7.38));
      const crossover = THREE.MathUtils.smoothstep(time, 5.24, 5.62) * (1 - THREE.MathUtils.smoothstep(time, 6.88, 7.18));
      const shoulderShake = THREE.MathUtils.smoothstep(time, 7.26, 7.68) * (1 - THREE.MathUtils.smoothstep(time, 8.04, 8.48));
      const headReturn = THREE.MathUtils.smoothstep(time, 8.06, 8.78);
      const finishPose = THREE.MathUtils.smoothstep(time, 8.28, 8.86);
      const pulse = Math.abs(Math.sin(beat));
      const sway = Math.sin(beat * .5) * groove;
      const dribblePhase = time * 6.4;
      const dribbleBounce = Math.abs(Math.sin(dribblePhase));
      const groundImpact = Math.max(0, 1 - dribbleBounce * 2.6);
      figure.position.y = (.035 * pulse + .022 * finishPose) * groove - .05 * groundImpact * dribble;
      figure.position.x = .095 * sway;
      figure.rotation.x = .085 * Math.sin(beat * .5) * groove + .12 * finishPose;
      figure.rotation.z = .17 * sway;
      figure.rotation.y = Math.sin(Math.PI * (firstSpin + secondSpin)) * 1.85;
      leftLeg.hip.rotation.x = (-.18 - .13 * pulse) * groove;
      rightLeg.hip.rotation.x = (-.18 + .13 * pulse) * groove;
      leftLeg.knee.rotation.x = (.24 + .18 * pulse) * groove;
      rightLeg.knee.rotation.x = (.24 - .18 * pulse) * groove;
      leftLeg.knee.rotation.x += .30 * groundImpact * dribble;
      rightLeg.knee.rotation.x += .30 * groundImpact * dribble;
      leftArm.shoulder.rotation.x = -1.48 * carryHead - (.55 + .28 * Math.sin(beat)) * groove - .12 * dribble - 1.32 * finishPose + .72 * dribble * Math.max(0, Math.sin(dribblePhase));
      leftArm.shoulder.rotation.z = (.52 + .16 * Math.sin(beat)) * groove + .08 + .18 * shoulderShake * Math.sin(beat * 3.2) + .36 * carryHead + .18 * dribble;
      rightArm.shoulder.rotation.x = -1.48 * carryHead - (.35 + .34 * Math.cos(beat)) * groove - .85 * dribble * Math.abs(Math.sin(beat * 2)) - 1.16 * finishPose + .72 * dribble * Math.max(0, -Math.sin(dribblePhase));
      rightArm.shoulder.rotation.z = -(.48 + .18 * Math.cos(beat)) * groove - .08 - .22 * shoulderShake * Math.sin(beat * 3.2) - .36 * carryHead - .18 * dribble;
      figure.rotation.x += .07 * shoulderShake * Math.sin(beat * 3.2);
      const crossoverSide = Math.sin(dribblePhase * .5) * crossover;
      const holdY = .66 + Math.sin(time * 2.2) * .035;
      const bounceY = .235 + .62 * dribbleBounce * dribble;
      head.position.x = (.10 + crossoverSide * .21) * (1 - headReturn) - .052 * carryHead * (1 - dribble);
      head.position.z = (.10 + Math.sin(time * 3.1) * .018) * (1 - headReturn) + .035 * carryHead;
      const idleY = .80 * (1 - carryHead) * (1 - dribble);
      const carriedY = holdY * carryHead * (1 - dribble);
      const bouncedY = bounceY * dribble;
      head.position.y = (idleY + carriedY + bouncedY) * (1 - headReturn) + 1.13 * headReturn;
      head.rotation.x += delta * (dribble > .2 ? 10 : 4);
      head.rotation.z += delta * (dribble > .2 ? 7 : 3);
      head.scale.set(.92 * (1 + .17 * groundImpact * dribble), .92 * (1 - .38 * groundImpact * dribble), .92 * (1 + .17 * groundImpact * dribble));
      if (time >= 9.04) {
        basketball.position.set(-.062, -.015, .072);
        finishSkill();
        notify("头弹回来了，炫技完成。");
      }
      return;
    }
    if (state.woodfishSession) {
      state.woodfishTimer += delta;
      if (state.woodfishTimer >= state.nextWoodfish) {
        state.nextWoodfish = state.woodfishTimer + .58;
        audio.playWoodfishSound();
      }
      const strike = Math.max(0, Math.sin(state.woodfishTimer * 10.8));
      woodenFish.mallet.rotation.z = -.65 + .52 * strike;
      woodenFish.mallet.rotation.x = -.4 - .14 * strike;
      leftArm.shoulder.rotation.x = -.36 + .04 * Math.sin(state.woodfishTimer * 2.1);
      leftArm.shoulder.rotation.z = .34;
      rightArm.shoulder.rotation.x = -.74 + .28 * strike;
      rightArm.shoulder.rotation.z = -.38 - .10 * strike;
      figure.position.y = .008 * Math.sin(state.woodfishTimer * 2.4);
      head.rotation.x = .04 + .025 * Math.sin(state.woodfishTimer * 1.8);
      if (state.woodfishTimer >= 18) stopWoodfish();
      return;
    }
    if (state.incenseRitual) {
      const ritual = state.incenseRitual;
      ritual.timer += delta;
      const time = ritual.timer;
      const gather = THREE.MathUtils.smoothstep(time, .12, .82) * (1 - THREE.MathUtils.smoothstep(time, 1.86, 2.16));
      const raise = THREE.MathUtils.smoothstep(time, .96, 1.68) * (1 - THREE.MathUtils.smoothstep(time, 2.52, 2.82));
      const place = THREE.MathUtils.smoothstep(time, 2.68, 3.26) * (1 - THREE.MathUtils.smoothstep(time, 3.56, 3.94));
      const offeringBow = THREE.MathUtils.smoothstep(time, 3.82, 4.54) * (1 - THREE.MathUtils.smoothstep(time, 5.52, 6.08));
      const breath = Math.sin(time * 1.8) * .035;
      leftArm.shoulder.rotation.x = -(.68 * gather + 1.52 * raise + .42 * place + .58 * offeringBow);
      leftArm.shoulder.rotation.z = .18 + .58 * gather + .24 * raise + .34 * place + .38 * offeringBow;
      rightArm.shoulder.rotation.x = -(.68 * gather + 1.68 * raise + 1.18 * place + .58 * offeringBow);
      rightArm.shoulder.rotation.z = -(.18 + .58 * gather + .24 * raise + .16 * place + .38 * offeringBow);
      figure.position.y = -.035 * place - .08 * offeringBow;
      figure.rotation.x = .34 * place + .62 * offeringBow;
      head.rotation.x = .08 * gather + .12 * raise - .18 * place + .52 * offeringBow - .012 * breath;
      if (time >= 2.72 && !ritual.inserted) { ritual.inserted = true; finishIncenseRitual(); }
      if (time >= 6.24) {
        state.incenseRitual = null;
        resetChibiPose();
        notify("清香已上，愿心中安宁。");
      }
      return;
    }
    if (state.praying) {
      state.prayTimer += delta;
      const time = state.prayTimer;
      const settle = THREE.MathUtils.smoothstep(time, .06, .34) * (1 - THREE.MathUtils.smoothstep(time, 1.52, 1.86));
      const torsoBow = THREE.MathUtils.smoothstep(time, .18, .42) * (1 - THREE.MathUtils.smoothstep(time, 1.62, 1.92));
      const firstBow = THREE.MathUtils.smoothstep(time, .42, .68) * (1 - THREE.MathUtils.smoothstep(time, .78, .94));
      const secondBow = THREE.MathUtils.smoothstep(time, .98, 1.24) * (1 - THREE.MathUtils.smoothstep(time, 1.38, 1.54));
      const headBow = Math.max(firstBow > 0 ? firstBow * .94 : 0, secondBow);
      const handsTogether = THREE.MathUtils.smoothstep(time, .72, 1.28) * (1 - THREE.MathUtils.smoothstep(time, 6.18, 6.62));
      const breath = handsTogether > 0 ? Math.sin(time * 1.65) * .5 + .5 : 0;
      setChibiPose(settle, torsoBow, headBow, handsTogether, breath);
      if (time >= 7.44) {
        state.praying = false;
        state.prayTimer = 0;
        prayButton.disabled = false;
        resetChibiPose();
        notify("跪拜已毕，愿平安顺遂。");
      }
      return;
    }

    movementForward.set(-Math.sin(cameraControl.yaw), 0, -Math.cos(cameraControl.yaw));
    movementRight.set(Math.cos(cameraControl.yaw), 0, -Math.sin(cameraControl.yaw));
    movementDirection.copy(movementForward).multiplyScalar(inputY).addScaledVector(movementRight, inputX);
    const speed = movementDirection.lengthSq() ? 2 * Math.max(.28, inputStrength) : 0;
    if (movementDirection.lengthSq()) {
      movementDirection.normalize();
      state.heading = Math.atan2(movementDirection.x, movementDirection.z);
      avatar.rotation.y = state.heading;
    }
    const previousX = avatar.position.x;
    const previousZ = avatar.position.z;
    state.velocity.lerp(movementDirection.multiplyScalar(speed), 1 - Math.exp(-12 * delta));
    const nextX = avatar.position.x + state.velocity.x * delta;
    const nextZ = avatar.position.z + state.velocity.z * delta;
    const outdoor = nextZ > areaConfig.interiorZ;
    const horizontalLimit = outdoor ? areaConfig.exteriorMaxX : areaConfig.interiorMaxX;
    const boundedX = THREE.MathUtils.clamp(nextX, -horizontalLimit, horizontalLimit);
    const boundedZ = THREE.MathUtils.clamp(nextZ, areaConfig.minZ, areaConfig.maxZ);
    const resolved = resolvePlayerCollisions(boundedX, boundedZ);
    const resolvedOutdoor = resolved.z > areaConfig.interiorZ;
    const resolvedLimit = resolvedOutdoor ? areaConfig.exteriorMaxX : areaConfig.interiorMaxX;
    avatar.position.x = THREE.MathUtils.clamp(resolved.x, -resolvedLimit, resolvedLimit);
    avatar.position.z = THREE.MathUtils.clamp(resolved.z, areaConfig.minZ, areaConfig.maxZ);
    avatar.position.y = surfaceLevel ? surfaceLevel(avatar.position.x, avatar.position.z) : groundLevel(avatar.position.z);
    updateTempleArea();
    const movedX = avatar.position.x - previousX;
    const movedZ = avatar.position.z - previousZ;
    const movedDistance = Math.hypot(movedX, movedZ);
    if (movedDistance > .00001) state.walkPhase += movedDistance * 4.5;
    if (delta > 0) state.velocity.set(movedX / delta, 0, movedZ / delta);
    const swing = Math.sin(state.walkPhase) * Math.min(1, state.velocity.length() / 2);
    leftLeg.hip.rotation.x = swing * .62;
    rightLeg.hip.rotation.x = -swing * .62;
    leftLeg.knee.rotation.x = Math.max(0, -swing) * .78;
    rightLeg.knee.rotation.x = Math.max(0, swing) * .78;
    leftArm.shoulder.rotation.x = -swing * .48;
    rightArm.shoulder.rotation.x = swing * .48;
    head.rotation.x = Math.sin(state.walkPhase * .5) * .025;
    figure.position.y = .13 + Math.abs(Math.sin(state.walkPhase)) * .025;
    figure.rotation.x = 0;
  }

  function updateCamera(delta) {
    if (state.dancing && skillCamera.active) {
      const progress = THREE.MathUtils.clamp(state.danceTimer / skillCamera.duration, 0, 1);
      cameraControl.yaw = skillCamera.startYaw + easeInOut(progress) * Math.PI * 2;
      cameraControl.targetYaw = cameraControl.yaw;
    } else {
      cameraControl.yaw += (cameraControl.targetYaw - cameraControl.yaw) * Math.min(1, delta * 7);
    }
    cameraControl.pitch += (cameraControl.targetPitch - cameraControl.pitch) * Math.min(1, delta * 7);
    cameraControl.radius += (cameraControl.targetRadius - cameraControl.radius) * Math.min(1, delta * 7);
    const pitch = THREE.MathUtils.clamp(cameraControl.pitch, .04, .82);
    const radius = THREE.MathUtils.clamp(cameraControl.radius, 2.6, 7);
    const eyeHeight = avatar.position.y + .98;
    camera.position.set(
      avatar.position.x + Math.sin(cameraControl.yaw) * Math.cos(pitch) * radius,
      eyeHeight + Math.sin(pitch) * radius,
      avatar.position.z + Math.cos(cameraControl.yaw) * Math.cos(pitch) * radius
    );
    if (state.location === "inside") {
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -7.85, 7.85);
      camera.position.y = Math.min(camera.position.y, 9.55);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, areaConfig.cameraMinZ ?? -8.15, areaConfig.exteriorZ - .25);
    }
    camera.lookAt(avatar.position.x, avatar.position.y + .74, avatar.position.z);
  }

  const defaultCameraView = { yaw: 0, pitch: .25, radius: 7 };
  function resetCamera() {
    if (state.dancing) return;
    cameraControl.targetYaw = defaultCameraView.yaw;
    cameraControl.targetPitch = defaultCameraView.pitch;
    cameraControl.targetRadius = defaultCameraView.radius;
    notify("已恢复默认视角");
  }

  const keyMap = { KeyW: "forward", ArrowUp: "forward", KeyS: "backward", ArrowDown: "backward", KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right" };
  function isTypingTarget(target) {
    return target instanceof Element && target.matches("input, textarea, [contenteditable='true']");
  }

  function updateJoystick(event) {
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width * .34;
    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    if (distance > radius) {
      dx = dx / distance * radius;
      dy = dy / distance * radius;
    }
    joystick.x = dx / radius;
    joystick.y = dy / radius;
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function resetJoystick() {
    const pointerId = joystick.pointerId;
    joystick.active = false;
    joystick.pointerId = null;
    joystick.x = 0;
    joystick.y = 0;
    joystickKnob.style.transform = "translate(0px, 0px)";
    virtualJoystick.classList.remove("active");
    if (pointerId !== null && joystickBase.hasPointerCapture(pointerId)) joystickBase.releasePointerCapture(pointerId);
  }

  function resetInput() {
    keys.forward = keys.backward = keys.left = keys.right = false;
    resetJoystick();
  }

  const dayNightProfiles = {
    night: { sky: "#10141b", fog: "#11161c", fogNear: 18, fogFar: 78, sunColor: "#4c6a86", sunIntensity: .10, sunX: -5, sunY: 9, sunZ: -6, hemiSky: "#2a3848", hemiGround: "#0a0e14", hemiIntensity: .16, fillIntensity: .035, exposure: .74, lanternBoost: 2.2, altarBoost: 1.5, label: "🌙 夜晚" },
    dawn: { sky: "#e6b489", fog: "#d0a779", fogNear: 21, fogFar: 108, sunColor: "#ffb066", sunIntensity: .70, sunX: -8, sunY: 4, sunZ: 14, hemiSky: "#f0c088", hemiGround: "#3a2018", hemiIntensity: .30, fillIntensity: .10, exposure: .84, lanternBoost: 1.4, altarBoost: 1.1, label: "🌅 晨曦" },
    morning: { sky: "#a8c6ca", fog: "#a4bebe", fogNear: 24, fogFar: 125, sunColor: "#fff1d5", sunIntensity: 1.20, sunX: 7, sunY: 14, sunZ: 18, hemiSky: "#ffe0b4", hemiGround: "#1d1713", hemiIntensity: .38, fillIntensity: .20, exposure: .92, lanternBoost: .5, altarBoost: .8, label: "☀️ 上午" },
    noon: { sky: "#bcd5d8", fog: "#b0c7c5", fogNear: 26, fogFar: 140, sunColor: "#fff8e8", sunIntensity: 1.30, sunX: 3, sunY: 18, sunZ: 10, hemiSky: "#ffe6c2", hemiGround: "#241712", hemiIntensity: .42, fillIntensity: .24, exposure: .95, lanternBoost: .3, altarBoost: .6, label: "🌤️ 正午" },
    afternoon: { sky: "#aec4c8", fog: "#a5babd", fogNear: 24, fogFar: 130, sunColor: "#ffe8c0", sunIntensity: 1.12, sunX: 9, sunY: 12, sunZ: 14, hemiSky: "#ffd8a8", hemiGround: "#20150f", hemiIntensity: .34, fillIntensity: .19, exposure: .90, lanternBoost: .6, altarBoost: .8, label: "☀️ 午后" },
    dusk: { sky: "#c87848", fog: "#ae6639", fogNear: 20, fogFar: 105, sunColor: "#ff8848", sunIntensity: .62, sunX: 10, sunY: 3, sunZ: 6, hemiSky: "#e89058", hemiGround: "#281510", hemiIntensity: .28, fillIntensity: .12, exposure: .82, lanternBoost: 1.8, altarBoost: 1.2, label: "🌆 黄昏" }
  };
  let currentDayNightKey = "";
  const shanghaiHourFormatter = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Shanghai", hour: "numeric", hour12: false });
  const shanghaiClockFormatter = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false });

  function getTimePeriodKey() {
    const hour = Number(shanghaiHourFormatter.format(new Date()));
    if (hour >= 5 && hour < 8) return "dawn";
    if (hour >= 8 && hour < 11) return "morning";
    if (hour >= 11 && hour < 14) return "noon";
    if (hour >= 14 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 20) return "dusk";
    return "night";
  }

  let lastClockText = "";
  function updateTimeIndicator(key = getTimePeriodKey()) {
    if (!timeIndicator) return;
    const profile = dayNightProfiles[key] || dayNightProfiles.morning;
    const labelParts = profile.label.match(/^(\S+)\s+(.*)$/);
    const icon = labelParts?.[1] || "🕯️";
    const period = labelParts?.[2] || profile.label;
    const clock = shanghaiClockFormatter.format(new Date());
    const text = `${icon} ${clock}`;
    if (text !== lastClockText) {
      timeIndicator.textContent = text;
      lastClockText = text;
    }
    timeIndicator.title = `当前时段：${period}`;
    timeIndicator.setAttribute("aria-label", `当前时间 ${clock}，${period}`);
  }

  function applyDayNight(key, instant = false) {
    if (key === currentDayNightKey) return;
    currentDayNightKey = key;
    const profile = dayNightProfiles[key] || dayNightProfiles.morning;
    const targetValues = {
      bg: new THREE.Color(profile.sky), fog: new THREE.Color(profile.fog),
      sunColor: new THREE.Color(profile.sunColor), hemiSky: new THREE.Color(profile.hemiSky), hemiGround: new THREE.Color(profile.hemiGround),
      skyTop: new THREE.Color(profile.sky).multiplyScalar(.86),
      skyHorizon: new THREE.Color(profile.fog).lerp(new THREE.Color("#eef4ef"), .22),
      skyBottom: new THREE.Color(profile.sky).lerp(new THREE.Color(profile.fog), .62),
      cloud: new THREE.Color(profile.fog).lerp(new THREE.Color("#f6fbf8"), .56)
    };
    const startValues = {
      bg: scene.background.clone(), fog: scene.fog.color.clone(),
      sunColor: sun.color.clone(), hemiSky: hemisphereLight.color.clone(), hemiGround: hemisphereLight.groundColor.clone(),
      sunIntensity: sun.intensity, hemiIntensity: hemisphereLight.intensity, fillIntensity: fillLight.intensity, exposure: renderer.toneMappingExposure,
      fogNear: scene.fog.near, fogFar: scene.fog.far,
      skyTop: skyUniforms.topColor.value.clone(), skyHorizon: skyUniforms.horizonColor.value.clone(),
      skyBottom: skyUniforms.bottomColor.value.clone(), cloud: cloudMaterials[0]?.color.clone() || new THREE.Color("#ffffff")
    };
    sun.position.set(profile.sunX, profile.sunY, profile.sunZ);
    skyUniforms.sunDirection.value.set(profile.sunX, profile.sunY, profile.sunZ).normalize();
    let transitionProgress = instant ? 1 : 0;
    let lastTransitionAt = performance.now();
    function transition(now = performance.now()) {
      if (currentDayNightKey !== key) return;
      const delta = Math.min(.05, (now - lastTransitionAt) / 1000);
      lastTransitionAt = now;
      if (!instant) transitionProgress = Math.min(1, transitionProgress + delta * .8);
      const t = easeInOut(transitionProgress);
      scene.background.lerpColors(startValues.bg, targetValues.bg, t);
      scene.fog.color.lerpColors(startValues.fog, targetValues.fog, t);
      scene.fog.near = THREE.MathUtils.lerp(startValues.fogNear, profile.fogNear, t);
      scene.fog.far = THREE.MathUtils.lerp(startValues.fogFar, profile.fogFar, t);
      sun.color.lerpColors(startValues.sunColor, targetValues.sunColor, t);
      sun.intensity = THREE.MathUtils.lerp(startValues.sunIntensity, profile.sunIntensity, t);
      hemisphereLight.color.lerpColors(startValues.hemiSky, targetValues.hemiSky, t);
      hemisphereLight.groundColor.lerpColors(startValues.hemiGround, targetValues.hemiGround, t);
      hemisphereLight.intensity = THREE.MathUtils.lerp(startValues.hemiIntensity, profile.hemiIntensity, t);
      fillLight.intensity = THREE.MathUtils.lerp(startValues.fillIntensity, profile.fillIntensity, t);
      renderer.toneMappingExposure = THREE.MathUtils.lerp(startValues.exposure, profile.exposure, t);
      skyUniforms.topColor.value.lerpColors(startValues.skyTop, targetValues.skyTop, t);
      skyUniforms.horizonColor.value.lerpColors(startValues.skyHorizon, targetValues.skyHorizon, t);
      skyUniforms.bottomColor.value.lerpColors(startValues.skyBottom, targetValues.skyBottom, t);
      skyUniforms.sunColor.value.lerpColors(startValues.sunColor, targetValues.sunColor, t);
      cloudMaterials.forEach(material => material.color.lerpColors(startValues.cloud, targetValues.cloud, t));
      altarLight.intensity = 10 * profile.altarBoost;
      lanternLights.forEach(light => { light.intensity = 2.6 * profile.lanternBoost; });
      if (!instant && transitionProgress < 1) requestAnimationFrame(transition);
    }
    transition();
    updateTimeIndicator(key);
  }

  const objectTooltip = document.createElement("div");
  objectTooltip.className = "object-tooltip";
  objectTooltip.innerHTML = '<div class="object-name"></div><div class="object-desc"></div>';
  app.appendChild(objectTooltip);
  const interactiveObjects = [
    { object: statue, name: "云上禅寺 · 佛像", desc: "慈眉善目的金身佛像，莲台宝相庄严。上前上香可表达敬意。" },
    { object: burner, name: "青铜香炉", desc: "古朴厚重的三足香炉。先取香，再走到炉前上香。" },
    { object: bell.frame, name: "铜钟", desc: "声震十方的青铜大钟。走近敲响，钟声可净心。" },
    { object: woodenFish.fish, name: "木鱼", desc: "诵经时敲击的法器。走近可开始敲木鱼静心。" },
    { object: pondGroup, name: "放生池", desc: "池中锦鲤游弋。走近后点击水面，可放生一尾。", onClick: releaseFish }
  ];
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();

  function isEffectivelyVisible(object) {
    let current = object;
    while (current) {
      if (!current.visible) return false;
      current = current.parent;
    }
    return true;
  }

  function bindEvents() {
    addEventListener("keydown", event => {
      if ((event.metaKey || event.ctrlKey) && ["+", "=", "-", "0"].includes(event.key)) {
        event.preventDefault();
        return;
      }
      if (event.code === "Escape") {
        if (!elements.chatPanel.hidden) {
          ui.setChatPanel(false);
          elements.chatInput.blur();
          return;
        }
        fortunePanel.hidden = true;
        zodiacPanel.hidden = true;
        weatherPanel.hidden = true;
        oraclePanel.hidden = true;
        return;
      }
      if (isTypingTarget(event.target)) return;
      if (keyMap[event.code] && !state.dancing) keys[keyMap[event.code]] = true;
      if (event.code === "KeyJ") pray();
      if (event.code === "KeyK") lightIncense();
      if (event.code === "KeyG") performTrick();
      if (event.code === "KeyR") resetCamera();
    });
    addEventListener("keyup", event => {
      if (keyMap[event.code]) keys[keyMap[event.code]] = false;
    });

    joystickBase.addEventListener("pointerdown", event => {
      if (joystick.active || state.dancing) return;
      event.preventDefault();
      joystick.active = true;
      joystick.pointerId = event.pointerId;
      virtualJoystick.classList.add("active");
      joystickBase.setPointerCapture(event.pointerId);
      updateJoystick(event);
    });
    joystickBase.addEventListener("pointermove", event => {
      if (!joystick.active || joystick.pointerId !== event.pointerId) return;
      event.preventDefault();
      updateJoystick(event);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(type => {
      joystickBase.addEventListener(type, event => {
        if (joystick.pointerId === event.pointerId) resetJoystick();
      });
    });

    const canvas = elements.canvas;
    canvas.addEventListener("pointerdown", event => {
      if (state.dancing) return;
      cameraControl.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      canvas.setPointerCapture(event.pointerId);
      cameraControl.dragDistance = 0;
      cameraControl.downTime = performance.now();
    });
    canvas.addEventListener("pointermove", event => {
      if (state.dancing) return;
      if (!cameraControl.pointers.has(event.pointerId) || cameraControl.pointers.size !== 1) return;
      const previous = cameraControl.pointers.get(event.pointerId);
      cameraControl.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      cameraControl.dragDistance += Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
      cameraControl.targetYaw -= (event.clientX - previous.x) * .0065;
      cameraControl.targetPitch += (event.clientY - previous.y) * .004;
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(type => canvas.addEventListener(type, event => {
      cameraControl.pointers.delete(event.pointerId);
    }));
    ["gesturestart", "gesturechange", "gestureend"].forEach(type => document.addEventListener(type, event => event.preventDefault(), { passive: false }));
    document.addEventListener("wheel", event => { if (event.ctrlKey) event.preventDefault(); }, { passive: false });
    canvas.addEventListener("wheel", event => {
      event.preventDefault();
      if (state.dancing) return;
      const zoomSpeed = event.deltaY > 0 ? .35 : -.35;
      cameraControl.targetRadius = THREE.MathUtils.clamp(cameraControl.targetRadius + zoomSpeed, 2.2, 9);
    }, { passive: false });
    canvas.addEventListener("pointerup", event => {
      if (state.dancing) return;
      if (cameraControl.dragDistance > 6) {
        objectTooltip.classList.remove("show");
        return;
      }
      const rect = canvas.getBoundingClientRect();
      pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);
      const visibleEntries = interactiveObjects.filter(entry => isEffectivelyVisible(entry.object));
      const targets = visibleEntries.map(entry => entry.object);
      const hits = raycaster.intersectObjects(targets, true);
      if (!hits.length) {
        objectTooltip.classList.remove("show");
        return;
      }
      let hitObject = hits[0].object;
      while (hitObject.parent && !targets.includes(hitObject)) hitObject = hitObject.parent;
      const entry = visibleEntries.find(item => item.object === hitObject);
      if (!entry) {
        objectTooltip.classList.remove("show");
        return;
      }
      objectTooltip.querySelector(".object-name").textContent = entry.name;
      objectTooltip.querySelector(".object-desc").textContent = entry.desc;
      objectTooltip.style.left = `${event.clientX + 12}px`;
      objectTooltip.style.top = `${event.clientY + 12}px`;
      objectTooltip.classList.add("show");
      if (entry.onClick) {
        if (nearPond()) entry.onClick();
        else notify("走近放生池，再点击水面放生。");
      }
      clearTimeout(objectTooltip._hideTimer);
      objectTooltip._hideTimer = setTimeout(() => objectTooltip.classList.remove("show"), 4200);
    });

    prayButton.addEventListener("click", pray);
    pickupButton.addEventListener("click", takeIncense);
    incenseButton.addEventListener("click", lightIncense);
    danceButton.addEventListener("click", performTrick);
    oracleButton.addEventListener("click", showOracleResult);
    releaseButton.addEventListener("click", releaseFish);
    bellButton.addEventListener("click", knockBell);
    woodfishButton.addEventListener("click", toggleWoodfish);
    musicButton.addEventListener("click", audio.toggleMusic);
    fortuneClose.addEventListener("click", () => { fortunePanel.hidden = true; });
    document.getElementById("weather-close").addEventListener("click", () => { weatherPanel.hidden = true; });
    document.getElementById("oracle-close").addEventListener("click", () => { oraclePanel.hidden = true; });
    document.getElementById("skin-close").addEventListener("click", () => { skinPanel.hidden = true; });

    Object.entries(avatarApi.skinConfigs).forEach(([key, config]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `<span>${config.icon}</span>${config.label}`;
      if (key === currentSkin) button.classList.add("active");
      button.addEventListener("click", () => {
        if (state.dancing) {
          notify("技能使用中，稍后再换装。");
          return;
        }
        currentSkin = key;
        const selectedConfig = applySkinToChibi(localChibi, key);
        state.skillKey = key;
        danceButton.textContent = `${selectedConfig.skillIcon} ${selectedConfig.skillLabel}`;
        try { localStorage.setItem("cloud-worship-skin", key); } catch {}
        skinGrid.querySelectorAll("button").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        notify(`已切换为「${selectedConfig.label}」· 技能：${selectedConfig.skillLabel}`);
      });
      skinGrid.append(button);
    });
    skinButton.addEventListener("click", () => { skinPanel.hidden = !skinPanel.hidden; });
  }

  applyDayNight(getTimePeriodKey(), true);
  updateTimeIndicator();
  setInterval(() => {
    const key = getTimePeriodKey();
    applyDayNight(key);
    updateTimeIndicator(key);
  }, 1000);
  bindEvents();

  return {
    state,
    keys,
    cameraControl,
    resetInput,
    resetCamera,
    update(delta) {
      if (state.bellTimer > 0) state.bellTimer = Math.max(0, state.bellTimer - delta);
      updateAvatar(delta);
      updateEntranceHint();
      updateCamera(delta);
      updateIncenseControls();
    },
    get position() { return avatar.position; },
    get heading() { return avatar.rotation.y; },
    get velocity() { return state.velocity; },
    isBusy() {
      return state.praying || state.incenseRitual || state.dancing || state.woodfishSession;
    }
  };
}
