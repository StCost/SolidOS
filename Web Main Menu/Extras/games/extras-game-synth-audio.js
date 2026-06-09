(function () {
  var audioContext = null;
  var lastPlayTimes = {};
  var gameStartSecondBlipTimer = 0;
  var escortSpawnSecondBlipTimer = 0;
  var winSecondBlipTimer = 0;
  var recordSecondBlipTimer = 0;

  var INTERVAL_KEY_GUNFIRE = "gunfire";
  var INTERVAL_KEY_LASER = "laser";
  var INTERVAL_KEY_HEAL = "heal";
  var INTERVAL_KEY_DEATH = "death";
  var INTERVAL_KEY_CLICK = "click";
  var INTERVAL_KEY_BOUNCE = "bounce";
  var INTERVAL_KEY_WARNING = "warning";
  var INTERVAL_KEY_MOVE = "move";
  var INTERVAL_KEY_TYPE = "type";
  var INTERVAL_KEY_CARD = "card";

  var INTERVAL_GUNFIRE = 0.045;
  var INTERVAL_LASER = 0.07;
  var INTERVAL_HEAL = 0.07;
  var INTERVAL_DEATH = 0.06;
  var INTERVAL_CLICK = 0.03;
  var INTERVAL_BOUNCE = 0.05;
  var INTERVAL_WARNING = 0.35;
  var INTERVAL_MOVE = 0.12;
  var INTERVAL_TYPE = 0.04;
  var INTERVAL_CARD = 0.06;

  var TEAM_FRIENDLY = "friendly";

  function ensureContext() {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      return audioContext;
    } catch (error) {
      return null;
    }
  }

  function scheduleGainEnvelope(gainNode, peakGain, startTime, attackSeconds, releaseSeconds) {
    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + attackSeconds);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + releaseSeconds);
  }

  function playOscillatorBurst(waveType, startFrequency, endFrequency, peakGain, duration) {
    var context;
    var now;
    var oscillator;
    var gainNode;
    var endFreq;
    context = ensureContext();
    if (!context) {
      return;
    }
    now = context.currentTime;
    oscillator = context.createOscillator();
    gainNode = context.createGain();
    oscillator.type = waveType;
    endFreq = endFrequency;
    if (endFreq < 1) {
      endFreq = 1;
    }
    oscillator.frequency.setValueAtTime(startFrequency, now);
    if (Math.abs(endFreq - startFrequency) > 0.5) {
      oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }
    scheduleGainEnvelope(gainNode, peakGain, now, 0.008, duration);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  function playNoiseBurst(peakGain, duration) {
    var context;
    var now;
    var noiseBuffer;
    var noiseData;
    var sampleIndex;
    var noiseSource;
    var noiseGain;
    context = ensureContext();
    if (!context) {
      return;
    }
    now = context.currentTime;
    noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
    noiseData = noiseBuffer.getChannelData(0);
    for (sampleIndex = 0; sampleIndex < noiseData.length; sampleIndex += 1) {
      noiseData[sampleIndex] = (Math.random() * 2 - 1) * 0.35;
    }
    noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseGain = context.createGain();
    scheduleGainEnvelope(noiseGain, peakGain, now, 0.004, duration);
    noiseSource.connect(noiseGain);
    noiseGain.connect(context.destination);
    noiseSource.start(now);
  }

  function getRateLimitTime(gameTime) {
    if (typeof gameTime === "number" && !isNaN(gameTime)) {
      return gameTime;
    }
    return Date.now() * 0.001;
  }

  function canPlayInterval(key, gameTime, intervalSeconds) {
    var timeValue = getRateLimitTime(gameTime);
    var lastTime = lastPlayTimes[key];
    if (lastTime == null) {
      return true;
    }
    return timeValue - lastTime >= intervalSeconds;
  }

  function markPlayedInterval(key, gameTime) {
    lastPlayTimes[key] = getRateLimitTime(gameTime);
  }

  function playGameStartSecondBlip() {
    playOscillatorBurst("sine", 660, 880, 0.05, 0.1);
  }

  function playGameStart() {
    ensureContext();
    playOscillatorBurst("sine", 440, 660, 0.06, 0.12);
    if (gameStartSecondBlipTimer) {
      window.clearTimeout(gameStartSecondBlipTimer);
    }
    gameStartSecondBlipTimer = window.setTimeout(function () {
      gameStartSecondBlipTimer = 0;
      playGameStartSecondBlip();
    }, 80);
  }

  function playGunfire(team, gameTime) {
    var peakGain;
    var startFrequency;
    if (!canPlayInterval(INTERVAL_KEY_GUNFIRE, gameTime, INTERVAL_GUNFIRE)) {
      return;
    }
    markPlayedInterval(INTERVAL_KEY_GUNFIRE, gameTime);
    peakGain = 0.05;
    startFrequency = 720;
    if (team === TEAM_FRIENDLY) {
      peakGain = 0.06;
      startFrequency = 880;
    }
    playOscillatorBurst("square", startFrequency, 220, peakGain, 0.08);
  }

  function playLaserBurst(team, gameTime) {
    var peakGain;
    if (!canPlayInterval(INTERVAL_KEY_LASER, gameTime, INTERVAL_LASER)) {
      return;
    }
    markPlayedInterval(INTERVAL_KEY_LASER, gameTime);
    peakGain = 0.05;
    if (team === TEAM_FRIENDLY) {
      peakGain = 0.062;
    }
    playOscillatorBurst("sawtooth", 640, 420, peakGain, 0.1);
  }

  function playHealBurst(gameTime) {
    if (!canPlayInterval(INTERVAL_KEY_HEAL, gameTime, INTERVAL_HEAL)) {
      return;
    }
    markPlayedInterval(INTERVAL_KEY_HEAL, gameTime);
    playOscillatorBurst("sine", 520, 780, 0.028, 0.05);
  }

  function playImpact() {
    playOscillatorBurst("triangle", 180, 90, 0.09, 0.12);
    playNoiseBurst(0.05, 0.08);
  }

  function playExplosion(isLarge) {
    var peakGain;
    var noiseGain;
    var noiseDuration;
    peakGain = 0.11;
    noiseGain = 0.08;
    noiseDuration = 0.16;
    if (isLarge) {
      peakGain = 0.14;
      noiseGain = 0.1;
      noiseDuration = 0.22;
    }
    playOscillatorBurst("sawtooth", 120, 40, peakGain, 0.28);
    playNoiseBurst(noiseGain, noiseDuration);
  }

  function playCollect() {
    playOscillatorBurst("sine", 520, 980, 0.07, 0.14);
  }

  function playEscortSpawnSecondBlip() {
    playOscillatorBurst("sine", 660, 880, 0.06, 0.14);
  }

  function playEscortSpawn() {
    playOscillatorBurst("sine", 280, 520, 0.08, 0.16);
    if (escortSpawnSecondBlipTimer) {
      window.clearTimeout(escortSpawnSecondBlipTimer);
    }
    escortSpawnSecondBlipTimer = window.setTimeout(function () {
      escortSpawnSecondBlipTimer = 0;
      playEscortSpawnSecondBlip();
    }, 70);
  }

  function playUnitDeath(isTruck, gameTime) {
    if (!isTruck && !canPlayInterval(INTERVAL_KEY_DEATH, gameTime, INTERVAL_DEATH)) {
      return;
    }
    markPlayedInterval(INTERVAL_KEY_DEATH, gameTime);
    if (isTruck) {
      playOscillatorBurst("sawtooth", 220, 45, 0.16, 0.55);
      playNoiseBurst(0.08, 0.35);
      return;
    }
    playOscillatorBurst("square", 160, 70, 0.07, 0.2);
  }

  function playFail() {
    playOscillatorBurst("sawtooth", 200, 40, 0.14, 0.55);
    playNoiseBurst(0.06, 0.3);
  }

  function playWinSecondBlip() {
    playOscillatorBurst("sine", 880, 1100, 0.05, 0.12);
  }

  function playWin() {
    playOscillatorBurst("sine", 520, 780, 0.07, 0.14);
    if (winSecondBlipTimer) {
      window.clearTimeout(winSecondBlipTimer);
    }
    winSecondBlipTimer = window.setTimeout(function () {
      winSecondBlipTimer = 0;
      playWinSecondBlip();
    }, 90);
  }

  function playRecordSecondBlip() {
    playOscillatorBurst("sine", 880, 1200, 0.06, 0.16);
  }

  function playRecord() {
    playOscillatorBurst("sine", 660, 980, 0.07, 0.14);
    if (recordSecondBlipTimer) {
      window.clearTimeout(recordSecondBlipTimer);
    }
    recordSecondBlipTimer = window.setTimeout(function () {
      recordSecondBlipTimer = 0;
      playRecordSecondBlip();
    }, 80);
  }

  function playAlarm() {
    var context;
    var now;
    var oscillator;
    var gainNode;
    context = ensureContext();
    if (!context) {
      return;
    }
    now = context.currentTime;
    oscillator = context.createOscillator();
    gainNode = context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.value = 90 + Math.random() * 40;
    gainNode.gain.value = 0.08;
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    oscillator.stop(now + 0.36);
  }

  function playWarningBeep(gameTime) {
    if (!canPlayInterval(INTERVAL_KEY_WARNING, gameTime, INTERVAL_WARNING)) {
      return;
    }
    markPlayedInterval(INTERVAL_KEY_WARNING, gameTime);
    playOscillatorBurst("square", 440, 320, 0.05, 0.1);
  }

  function playCameraSwitch() {
    playOscillatorBurst("square", 180, 90, 0.04, 0.06);
    playNoiseBurst(0.025, 0.04);
  }

  function playReportCorrect() {
    playOscillatorBurst("sine", 520, 780, 0.06, 0.12);
  }

  function playReportWrong() {
    playOscillatorBurst("sawtooth", 140, 70, 0.07, 0.18);
    playNoiseBurst(0.04, 0.08);
  }

  function playJumpscare() {
    var context;
    var now;
    var oscillator;
    var gainNode;
    var noiseBuffer;
    var noiseSource;
    var noiseGain;
    var noiseData;
    var sampleIndex;
    context = ensureContext();
    if (!context) {
      return;
    }
    now = context.currentTime;
    oscillator = context.createOscillator();
    gainNode = context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(220, now);
    oscillator.frequency.exponentialRampToValueAtTime(55, now + 0.45);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.52);
    noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.2), context.sampleRate);
    noiseData = noiseBuffer.getChannelData(0);
    for (sampleIndex = 0; sampleIndex < noiseData.length; sampleIndex += 1) {
      noiseData[sampleIndex] = (Math.random() * 2 - 1) * 0.35;
    }
    noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    noiseSource.connect(noiseGain);
    noiseGain.connect(context.destination);
    noiseSource.start(now);
  }

  function playPowerOutHum() {
    playOscillatorBurst("sawtooth", 55, 35, 0.06, 0.4);
    playNoiseBurst(0.03, 0.25);
  }

  function getSliceTonePitch(comboLevel) {
    var steps = comboLevel - 1;
    if (steps < 0) {
      steps = 0;
    }
    if (steps > 10) {
      steps = 10;
    }
    return 320 + steps * 42;
  }

  function playSlice(comboLevel) {
    var pitch = getSliceTonePitch(comboLevel);
    playOscillatorBurst("sine", pitch, pitch + 80, 0.05, 0.07);
  }

  function playBomb() {
    playOscillatorBurst("sawtooth", 90, 40, 0.12, 0.35);
    playNoiseBurst(0.08, 0.22);
  }

  function playMiss() {
    playOscillatorBurst("triangle", 180, 120, 0.04, 0.1);
  }

  function playClick(pitch, gameTime) {
    var frequency;
    if (!canPlayInterval(INTERVAL_KEY_CLICK, gameTime, INTERVAL_CLICK)) {
      return;
    }
    markPlayedInterval(INTERVAL_KEY_CLICK, gameTime);
    frequency = 440;
    if (typeof pitch === "number" && !isNaN(pitch)) {
      frequency = pitch;
    }
    playOscillatorBurst("square", frequency, frequency * 0.7, 0.035, 0.05);
  }

  function playBonusPop() {
    playOscillatorBurst("sine", 660, 1100, 0.06, 0.12);
  }

  function playBounce(speed, gameTime) {
    var peakGain;
    var startFrequency;
    if (!canPlayInterval(INTERVAL_KEY_BOUNCE, gameTime, INTERVAL_BOUNCE)) {
      return;
    }
    markPlayedInterval(INTERVAL_KEY_BOUNCE, gameTime);
    peakGain = 0.03;
    startFrequency = 220;
    if (typeof speed === "number" && !isNaN(speed)) {
      peakGain = 0.03 + Math.min(speed * 0.002, 0.05);
      startFrequency = 180 + Math.min(speed * 2, 320);
    }
    playOscillatorBurst("triangle", startFrequency, startFrequency * 0.6, peakGain, 0.05);
  }

  function playLandPerfect() {
    playOscillatorBurst("sine", 520, 880, 0.07, 0.14);
    playOscillatorBurst("sine", 880, 1100, 0.04, 0.1);
  }

  function playLandGood() {
    playOscillatorBurst("sine", 380, 520, 0.05, 0.1);
  }

  function playCrash() {
    playOscillatorBurst("sawtooth", 180, 35, 0.14, 0.45);
    playNoiseBurst(0.09, 0.35);
  }

  function playJump() {
    playOscillatorBurst("sine", 280, 520, 0.04, 0.07);
  }

  function playLandThud() {
    playOscillatorBurst("triangle", 120, 60, 0.05, 0.08);
    playNoiseBurst(0.03, 0.05);
  }

  function playWaveAnnounce() {
    playOscillatorBurst("square", 220, 440, 0.07, 0.16);
    window.setTimeout(function () {
      playOscillatorBurst("sine", 440, 660, 0.06, 0.12);
    }, 120);
  }

  function playBuildPlace() {
    playOscillatorBurst("sine", 320, 520, 0.05, 0.1);
  }

  function playSell() {
    playOscillatorBurst("sine", 520, 280, 0.05, 0.1);
  }

  function playRocketFire() {
    playOscillatorBurst("sawtooth", 180, 60, 0.07, 0.18);
    playNoiseBurst(0.04, 0.1);
  }

  function playTerminalBlip() {
    playOscillatorBurst("square", 640, 480, 0.035, 0.05);
  }

  function playError() {
    playOscillatorBurst("sawtooth", 180, 90, 0.06, 0.14);
  }

  function playSuccess() {
    playOscillatorBurst("sine", 440, 780, 0.06, 0.12);
    window.setTimeout(function () {
      playOscillatorBurst("sine", 660, 980, 0.05, 0.1);
    }, 70);
  }

  function playMoveTick(gameTime) {
    if (!canPlayInterval(INTERVAL_KEY_MOVE, gameTime, INTERVAL_MOVE)) {
      return;
    }
    markPlayedInterval(INTERVAL_KEY_MOVE, gameTime);
    playOscillatorBurst("triangle", 200, 140, 0.025, 0.04);
  }

  function playCollapse(radius) {
    var peakGain;
    var duration;
    peakGain = 0.1;
    duration = 0.28;
    if (typeof radius === "number" && !isNaN(radius)) {
      peakGain = 0.08 + Math.min(radius * 0.004, 0.08);
      duration = 0.2 + Math.min(radius * 0.008, 0.2);
    }
    playOscillatorBurst("sawtooth", 80, 30, peakGain, duration);
    playNoiseBurst(peakGain * 0.7, duration * 0.7);
  }

  function playWarp() {
    playOscillatorBurst("sawtooth", 520, 80, 0.08, 0.35);
    playNoiseBurst(0.05, 0.2);
  }

  function playShuffle() {
    playNoiseBurst(0.04, 0.12);
    window.setTimeout(function () {
      playNoiseBurst(0.03, 0.1);
    }, 60);
  }

  function playCardSnap(gameTime) {
    if (!canPlayInterval(INTERVAL_KEY_CARD, gameTime, INTERVAL_CARD)) {
      return;
    }
    markPlayedInterval(INTERVAL_KEY_CARD, gameTime);
    playOscillatorBurst("triangle", 240, 120, 0.04, 0.06);
    playNoiseBurst(0.02, 0.04);
  }

  function playKeyType(gameTime) {
    if (!canPlayInterval(INTERVAL_KEY_TYPE, gameTime, INTERVAL_TYPE)) {
      return;
    }
    markPlayedInterval(INTERVAL_KEY_TYPE, gameTime);
    playOscillatorBurst("square", 420 + Math.random() * 40, 300, 0.02, 0.03);
  }

  function playUiHover() {
    playOscillatorBurst("sine", 520, 620, 0.02, 0.04);
  }

  function playUiClick() {
    playOscillatorBurst("square", 620, 420, 0.035, 0.05);
  }

  window.WebExtrasGameSynthAudio = {
    ensureContext: ensureContext,
    playOscillatorBurst: playOscillatorBurst,
    playNoiseBurst: playNoiseBurst,
    playGameStart: playGameStart,
    playGunfire: playGunfire,
    playLaserBurst: playLaserBurst,
    playHealBurst: playHealBurst,
    playImpact: playImpact,
    playExplosion: playExplosion,
    playCollect: playCollect,
    playEscortSpawn: playEscortSpawn,
    playUnitDeath: playUnitDeath,
    playFail: playFail,
    playWin: playWin,
    playRecord: playRecord,
    playAlarm: playAlarm,
    playWarningBeep: playWarningBeep,
    playCameraSwitch: playCameraSwitch,
    playReportCorrect: playReportCorrect,
    playReportWrong: playReportWrong,
    playJumpscare: playJumpscare,
    playPowerOutHum: playPowerOutHum,
    playSlice: playSlice,
    playBomb: playBomb,
    playMiss: playMiss,
    playClick: playClick,
    playBonusPop: playBonusPop,
    playBounce: playBounce,
    playLandPerfect: playLandPerfect,
    playLandGood: playLandGood,
    playCrash: playCrash,
    playJump: playJump,
    playLandThud: playLandThud,
    playWaveAnnounce: playWaveAnnounce,
    playBuildPlace: playBuildPlace,
    playSell: playSell,
    playRocketFire: playRocketFire,
    playTerminalBlip: playTerminalBlip,
    playError: playError,
    playSuccess: playSuccess,
    playMoveTick: playMoveTick,
    playCollapse: playCollapse,
    playWarp: playWarp,
    playShuffle: playShuffle,
    playCardSnap: playCardSnap,
    playKeyType: playKeyType,
    playUiHover: playUiHover,
    playUiClick: playUiClick,
    TEAM_FRIENDLY: TEAM_FRIENDLY
  };
})();
