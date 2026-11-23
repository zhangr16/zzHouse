export function createAudioSystem({ musicButton, notify }) {
  const actionAudio = {
    trick: new Audio("assets/jitaimei.m4a"),
    pray: new Audio("assets/niganma.mp3")
  };
  Object.values(actionAudio).forEach(audio => {
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = .42;
  });

  const ambientAudio = { context: null, master: null, playing: false, timer: 0 };

  function ensureContext() {
    if (!ambientAudio.context) ambientAudio.context = new (window.AudioContext || window.webkitAudioContext)();
    ambientAudio.context.resume();
    return ambientAudio.context;
  }

  function playBellSound() {
    const context = ensureContext(), now = context.currentTime;
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    const echo = context.createDelay(.65), echoGain = context.createGain(), echoFilter = context.createBiquadFilter();
    compressor.threshold.value = -8;
    compressor.knee.value = 16;
    compressor.ratio.value = 8;
    compressor.attack.value = .003;
    compressor.release.value = .55;
    echo.delayTime.value = .24;
    echoGain.gain.value = .18;
    echoFilter.type = "lowpass";
    echoFilter.frequency.value = 1700;
    master.gain.setValueAtTime(.0001, now);
    master.gain.exponentialRampToValueAtTime(.86, now + .012);
    master.gain.exponentialRampToValueAtTime(.48, now + .72);
    master.gain.exponentialRampToValueAtTime(.00035, now + 10.4);
    master.connect(compressor);
    master.connect(echo);
    echo.connect(echoFilter);
    echoFilter.connect(echoGain);
    echoGain.connect(compressor);
    compressor.connect(context.destination);
    [[138.6, .86, 10.2], [277.2, .36, 8.6], [415.8, .15, 7.4], [634.0, .070, 6.4], [846.0, .035, 5.4], [1093.0, .018, 4.2]].forEach(([frequency, gain, decay], index) => {
      const oscillator = context.createOscillator(), oscillatorGain = context.createGain();
      oscillator.type = index < 2 ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * .965, now + decay);
      oscillatorGain.gain.setValueAtTime(gain, now);
      oscillatorGain.gain.exponentialRampToValueAtTime(gain * .12, now + decay * .62);
      oscillatorGain.gain.exponentialRampToValueAtTime(.0001, now + decay);
      oscillator.connect(oscillatorGain);
      oscillatorGain.connect(master);
      oscillator.start(now);
      oscillator.stop(now + decay + .1);
    });
  }

  function playWoodfishSound() {
    const context = ensureContext(), now = context.currentTime;
    const hit = context.createGain();
    hit.gain.setValueAtTime(.24, now);
    hit.gain.exponentialRampToValueAtTime(.0004, now + .22);
    hit.connect(context.destination);
    const oscillator = context.createOscillator(), second = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(340, now);
    oscillator.frequency.exponentialRampToValueAtTime(168, now + .17);
    second.type = "triangle";
    second.frequency.setValueAtTime(680, now);
    second.frequency.exponentialRampToValueAtTime(320, now + .13);
    const secondGain = context.createGain();
    secondGain.gain.setValueAtTime(.18, now);
    secondGain.gain.exponentialRampToValueAtTime(.0002, now + .18);
    oscillator.connect(hit);
    second.connect(secondGain);
    secondGain.connect(hit);
    oscillator.start(now);
    second.start(now);
    oscillator.stop(now + .22);
    second.stop(now + .20);
  }

  function stopActionAudio() {
    Object.values(actionAudio).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  function playActionAudio(audio) {
    stopActionAudio();
    audio.currentTime = 0;
    audio.play().catch(() => notify("音频加载失败或浏览器暂时阻止了播放。"));
  }

  function playAmbientNote(context, master) {
    const notes = [293.66, 329.63, 392, 440, 523.25, 587.33];
    const frequency = notes[Math.floor(Math.random() * notes.length)];
    const now = context.currentTime + .04, duration = 2.6 + Math.random() * 1.8;
    const gain = context.createGain(), filter = context.createBiquadFilter();
    const first = context.createOscillator(), second = context.createOscillator();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.062 + Math.random() * .022, now + .16);
    gain.gain.exponentialRampToValueAtTime(.0008, now + duration);
    filter.type = "lowpass";
    filter.frequency.value = 2100;
    filter.Q.value = .4;
    first.type = "triangle";
    first.frequency.value = frequency;
    second.type = "sine";
    second.frequency.value = frequency * 2.005;
    const overtoneGain = context.createGain();
    overtoneGain.gain.value = .18;
    first.connect(gain);
    second.connect(overtoneGain);
    overtoneGain.connect(gain);
    gain.connect(filter);
    filter.connect(master);
    first.start(now);
    second.start(now);
    first.stop(now + duration);
    second.stop(now + duration);
    ambientAudio.timer = setTimeout(() => {
      if (ambientAudio.playing) playAmbientNote(context, master);
    }, 1100 + Math.random() * 2400);
  }

  function toggleMusic() {
    if (!ambientAudio.context) ambientAudio.context = new (window.AudioContext || window.webkitAudioContext)();
    const context = ambientAudio.context;
    if (ambientAudio.playing) {
      ambientAudio.playing = false;
      clearTimeout(ambientAudio.timer);
      context.suspend();
      musicButton.classList.remove("playing");
      musicButton.textContent = "🎵 音乐";
      return;
    }
    context.resume();
    if (!ambientAudio.master) {
      const master = context.createGain();
      master.gain.value = .78;
      master.connect(context.destination);
      ambientAudio.master = master;
      const droneGain = context.createGain();
      droneGain.gain.value = .05;
      droneGain.connect(master);
      [73.42, 110, 146.83].forEach((frequency, index) => {
        const oscillator = context.createOscillator(), oscillatorGain = context.createGain();
        oscillator.type = index === 2 ? "sine" : "triangle";
        oscillator.frequency.value = frequency;
        oscillatorGain.gain.value = index === 0 ? .8 : index === 1 ? .35 : .16;
        oscillator.connect(oscillatorGain);
        oscillatorGain.connect(droneGain);
        oscillator.start();
      });
      const noiseBuffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
      const channel = noiseBuffer.getChannelData(0);
      let lastValue = 0;
      for (let index = 0; index < channel.length; index++) {
        const white = Math.random() * 2 - 1;
        lastValue = (lastValue + .028 * white) / 1.028;
        channel[index] = lastValue * 3.4;
      }
      const wind = context.createBufferSource();
      wind.buffer = noiseBuffer;
      wind.loop = true;
      const windFilter = context.createBiquadFilter();
      windFilter.type = "bandpass";
      windFilter.frequency.value = 580;
      windFilter.Q.value = .6;
      const windGain = context.createGain();
      windGain.gain.value = .038;
      wind.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(master);
      wind.start();
    }
    ambientAudio.playing = true;
    context.resume();
    playAmbientNote(context, ambientAudio.master);
    musicButton.classList.add("playing");
    musicButton.textContent = "🎵 播放中";
  }

  return {
    actionAudio,
    ambientAudio,
    playBellSound,
    playWoodfishSound,
    playActionAudio,
    stopActionAudio,
    toggleMusic
  };
}
