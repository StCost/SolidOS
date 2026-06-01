(function () {
  var DEFAULT_START_MUSIC_PATH = "../audio/ui-extras-game-start-music.wav";
  var DEFAULT_GAMEPLAY_MUSIC_PATH = "../audio/ui-extras-game-music.wav";

  var startMusicPath = DEFAULT_START_MUSIC_PATH;
  var gameplayMusicPath = DEFAULT_GAMEPLAY_MUSIC_PATH;

  var startMusicAudio = null;
  var gameplayMusicAudio = null;
  var startMusicStarted = false;
  var gameplayMusicStarted = false;
  var startMusicActive = false;
  var gameplayMusicActive = false;
  var usesStartScreenMusic = false;

  function getMusicVolumeFromSettings() {
    if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.getMusicOutputVolume) {
      return window.WebMenuAudioVolume.getMusicOutputVolume();
    }
    return 0.5;
  }

  function resetStartMusicAudio() {
    if (startMusicAudio) {
      startMusicAudio.pause();
      startMusicAudio = null;
    }
    startMusicStarted = false;
  }

  function resetGameplayMusicAudio() {
    if (gameplayMusicAudio) {
      gameplayMusicAudio.pause();
      gameplayMusicAudio = null;
    }
    gameplayMusicStarted = false;
  }

  function setMusicPaths(nextStartMusicPath, nextGameplayMusicPath) {
    var startPath = nextStartMusicPath || DEFAULT_START_MUSIC_PATH;
    var gameplayPath = nextGameplayMusicPath || DEFAULT_GAMEPLAY_MUSIC_PATH;
    if (startPath !== startMusicPath) {
      startMusicPath = startPath;
      resetStartMusicAudio();
    }
    if (gameplayPath !== gameplayMusicPath) {
      gameplayMusicPath = gameplayPath;
      resetGameplayMusicAudio();
    }
  }

  function resetMusicPaths() {
    setMusicPaths(DEFAULT_START_MUSIC_PATH, DEFAULT_GAMEPLAY_MUSIC_PATH);
  }

  function ensureStartMusicAudio() {
    if (startMusicAudio) return startMusicAudio;
    startMusicAudio = new Audio(startMusicPath);
    startMusicAudio.loop = true;
    startMusicAudio.preload = "auto";
    startMusicAudio.volume = 0;
    return startMusicAudio;
  }

  function ensureGameplayMusicAudio() {
    if (gameplayMusicAudio) return gameplayMusicAudio;
    gameplayMusicAudio = new Audio(gameplayMusicPath);
    gameplayMusicAudio.loop = true;
    gameplayMusicAudio.preload = "auto";
    gameplayMusicAudio.volume = 0;
    return gameplayMusicAudio;
  }

  function applyStartMusicVolume() {
    if (!startMusicAudio) return;
    startMusicAudio.volume = getMusicVolumeFromSettings();
  }

  function applyGameplayMusicVolume() {
    if (!gameplayMusicAudio) return;
    gameplayMusicAudio.volume = getMusicVolumeFromSettings();
  }

  function pauseMenuMusic() {
    if (window.WebMenuMusic && window.WebMenuMusic.pauseTemporarily) {
      window.WebMenuMusic.pauseTemporarily();
    }
  }

  function resumeMenuMusic() {
    if (window.WebMenuMusic && window.WebMenuMusic.resumeIfAllowed) {
      window.WebMenuMusic.resumeIfAllowed();
    }
  }

  function onStartMusicPlayFailed() {
    startMusicStarted = false;
    startMusicActive = false;
  }

  function onGameplayMusicPlayFailed() {
    gameplayMusicStarted = false;
    gameplayMusicActive = false;
  }

  function onResumeMusicPlayFailed() {
  }

  function playAudioElement(audioElement, onFail) {
    if (!audioElement) return;
    var playPromise = audioElement.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(onFail);
    }
  }

  function stopStartMusicOnly() {
    startMusicActive = false;
    if (!startMusicAudio) return;
    startMusicAudio.pause();
    startMusicAudio.currentTime = 0;
  }

  function stopGameplayMusicOnly() {
    gameplayMusicActive = false;
    if (!gameplayMusicAudio) return;
    gameplayMusicAudio.pause();
    gameplayMusicAudio.currentTime = 0;
  }

  function startStartMusic() {
    stopGameplayMusicOnly();
    pauseMenuMusic();
    startMusicActive = true;
    var audio = ensureStartMusicAudio();
    applyStartMusicVolume();
    if (!startMusicStarted) {
      startMusicStarted = true;
      playAudioElement(audio, onStartMusicPlayFailed);
      return;
    }
    if (audio.paused) {
      playAudioElement(audio, onResumeMusicPlayFailed);
    }
  }

  function startGameplayMusic() {
    stopStartMusicOnly();
    pauseMenuMusic();
    gameplayMusicActive = true;
    var audio = ensureGameplayMusicAudio();
    applyGameplayMusicVolume();
    if (!gameplayMusicStarted) {
      gameplayMusicStarted = true;
      playAudioElement(audio, onGameplayMusicPlayFailed);
      return;
    }
    if (audio.paused) {
      playAudioElement(audio, onResumeMusicPlayFailed);
    }
  }

  function setUsesStartScreenMusic() {
    usesStartScreenMusic = true;
  }

  function start() {
    startStartMusic();
  }

  function stop() {
    stopStartMusicOnly();
    if (usesStartScreenMusic) {
      startGameplayMusic();
      return;
    }
    resumeMenuMusic();
  }

  function forceStop() {
    usesStartScreenMusic = false;
    stopStartMusicOnly();
    stopGameplayMusicOnly();
    resetMusicPaths();
    resumeMenuMusic();
  }

  function isGameplayMusicActive() {
    return gameplayMusicActive;
  }

  function onAudioVolumeChanged() {
    if (startMusicActive) {
      applyStartMusicVolume();
    }
    if (gameplayMusicActive) {
      applyGameplayMusicVolume();
    }
  }

  window.WebExtrasGameStartMusic = {
    setMusicPaths: setMusicPaths,
    setUsesStartScreenMusic: setUsesStartScreenMusic,
    start: start,
    stop: stop,
    forceStop: forceStop,
    isGameplayMusicActive: isGameplayMusicActive
  };

  if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.EVENT_AUDIO_VOLUME_CHANGED) {
    window.addEventListener(
      window.WebMenuAudioVolume.EVENT_AUDIO_VOLUME_CHANGED,
      onAudioVolumeChanged
    );
  }
})();
