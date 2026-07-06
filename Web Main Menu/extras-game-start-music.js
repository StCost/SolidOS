(function () {
  var DEFAULT_START_MUSIC_FILE = "ui-extras-game-start-music.wav";
  var DEFAULT_GAMEPLAY_MUSIC_FILE = "ui-extras-game-music.wav";

  var startMusicPath = "";
  var gameplayMusicPath = "";
  var gameOverMusicPath = "";

  var startMusicAudio = null;
  var gameplayMusicAudio = null;
  var gameOverMusicAudio = null;
  var startMusicStarted = false;
  var gameplayMusicStarted = false;
  var gameOverMusicStarted = false;
  var startMusicActive = false;
  var gameplayMusicActive = false;
  var gameOverMusicActive = false;
  var usesStartScreenMusic = false;
  var waitingForStartMusicBeforeGameplay = false;
  var GAMEPLAY_OVERLAP_SECONDS = 0.12;

  function getMusicVolumeFromSettings() {
    if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.getMusicOutputVolume) {
      return window.WebMenuAudioVolume.getMusicOutputVolume();
    }
    return 0.5;
  }

  function resetStartMusicAudio() {
    if (startMusicAudio) {
      startMusicAudio.removeEventListener("ended", onStartMusicEnded);
      startMusicAudio.removeEventListener("timeupdate", onStartMusicTimeUpdate);
      startMusicAudio.pause();
      startMusicAudio = null;
    }
    startMusicStarted = false;
    waitingForStartMusicBeforeGameplay = false;
  }

  function resetGameplayMusicAudio() {
    if (gameplayMusicAudio) {
      gameplayMusicAudio.pause();
      gameplayMusicAudio = null;
    }
    gameplayMusicStarted = false;
  }

  function resetGameOverMusicAudio() {
    if (gameOverMusicAudio) {
      gameOverMusicAudio.pause();
      gameOverMusicAudio = null;
    }
    gameOverMusicStarted = false;
  }

  function getStandaloneAudioPath(pathOrFileName) {
    if (window.WebExtrasGameUiAudioPaths && window.WebExtrasGameUiAudioPaths.getUiSoundPath) {
      return window.WebExtrasGameUiAudioPaths.getUiSoundPath(pathOrFileName);
    }
    return pathOrFileName;
  }

  function getDefaultStartMusicPath() {
    if (window.WebMenuAudioPaths && window.WebMenuAudioPaths.getMenuAudioPath) {
      return window.WebMenuAudioPaths.getMenuAudioPath(DEFAULT_START_MUSIC_FILE);
    }
    return getStandaloneAudioPath(DEFAULT_START_MUSIC_FILE);
  }

  function getDefaultGameplayMusicPath() {
    if (window.WebMenuAudioPaths && window.WebMenuAudioPaths.getMenuAudioPath) {
      return window.WebMenuAudioPaths.getMenuAudioPath(DEFAULT_GAMEPLAY_MUSIC_FILE);
    }
    return getStandaloneAudioPath(DEFAULT_GAMEPLAY_MUSIC_FILE);
  }

  function normalizeMusicPath(pathOrFileName, defaultFileName) {
    if (!pathOrFileName) {
      if (defaultFileName === DEFAULT_START_MUSIC_FILE) {
        return getDefaultStartMusicPath();
      }
      return getDefaultGameplayMusicPath();
    }
    if (window.WebMenuAudioPaths && window.WebMenuAudioPaths.getMenuAudioPath) {
      return window.WebMenuAudioPaths.getMenuAudioPath(pathOrFileName);
    }
    return getStandaloneAudioPath(pathOrFileName);
  }

  function normalizeGameOverMusicPath(pathOrFileName) {
    if (!pathOrFileName) {
      return "";
    }
    if (window.WebMenuAudioPaths && window.WebMenuAudioPaths.getMenuAudioPath) {
      return window.WebMenuAudioPaths.getMenuAudioPath(pathOrFileName);
    }
    return getStandaloneAudioPath(pathOrFileName);
  }

  function setMusicPaths(nextStartMusicPath, nextGameplayMusicPath, nextGameOverMusicPath) {
    var startPath = normalizeMusicPath(nextStartMusicPath, DEFAULT_START_MUSIC_FILE);
    var gameplayPath = normalizeMusicPath(nextGameplayMusicPath, DEFAULT_GAMEPLAY_MUSIC_FILE);
    var gameOverPath = normalizeGameOverMusicPath(nextGameOverMusicPath);
    if (startPath !== startMusicPath) {
      startMusicPath = startPath;
      resetStartMusicAudio();
    }
    if (gameplayPath !== gameplayMusicPath) {
      gameplayMusicPath = gameplayPath;
      resetGameplayMusicAudio();
    }
    if (gameOverPath !== gameOverMusicPath) {
      gameOverMusicPath = gameOverPath;
      resetGameOverMusicAudio();
    }
  }

  function resetMusicPaths() {
    setMusicPaths("", "", "");
  }

  function preloadGameplayMusic() {
    if (window.WebUiSeamlessLoopAudio && window.WebUiSeamlessLoopAudio.resumeContext) {
      window.WebUiSeamlessLoopAudio.resumeContext();
    }
    ensureGameplayMusicAudio();
  }

  function clearStartMusicTransitionListeners() {
    if (!startMusicAudio) {
      return;
    }
    startMusicAudio.removeEventListener("timeupdate", onStartMusicTimeUpdate);
  }

  function onStartMusicTimeUpdate() {
    var audio;
    var remaining;
    if (!waitingForStartMusicBeforeGameplay || !startMusicAudio) {
      return;
    }
    audio = startMusicAudio;
    if (!isFinite(audio.duration) || audio.duration <= 0) {
      return;
    }
    remaining = audio.duration - audio.currentTime;
    if (remaining > GAMEPLAY_OVERLAP_SECONDS) {
      return;
    }
    clearStartMusicTransitionListeners();
    finishTransitionToGameplayMusic();
  }

  function checkStartMusicNearEnd() {
    onStartMusicTimeUpdate();
  }

  function finishTransitionToGameplayMusic() {
    if (!waitingForStartMusicBeforeGameplay) {
      return;
    }
    waitingForStartMusicBeforeGameplay = false;
    clearStartMusicTransitionListeners();
    stopGameOverMusicOnly();
    pauseMenuMusic();
    gameplayMusicActive = true;
    var audio = ensureGameplayMusicAudio();
    applyGameplayMusicVolume();
    if (!gameplayMusicStarted) {
      gameplayMusicStarted = true;
      playAudioElement(audio, onGameplayMusicPlayFailed);
    } else if (audio.paused) {
      playAudioElement(audio, onResumeMusicPlayFailed);
    }
    stopStartMusicOnly();
  }

  function onStartMusicEnded() {
    startMusicActive = false;
    finishTransitionToGameplayMusic();
  }

  function isStartMusicStillPlaying() {
    if (!startMusicAudio || !startMusicStarted) {
      return false;
    }
    if (startMusicAudio.ended) {
      return false;
    }
    return !startMusicAudio.paused;
  }

  function ensureStartMusicAudio() {
    if (!startMusicPath) {
      startMusicPath = getDefaultStartMusicPath();
    }
    if (startMusicAudio) return startMusicAudio;
    startMusicAudio = new Audio(startMusicPath);
    startMusicAudio.loop = true;
    startMusicAudio.preload = "auto";
    startMusicAudio.volume = 0;
    startMusicAudio.addEventListener("ended", onStartMusicEnded);
    return startMusicAudio;
  }

  function ensureGameplayMusicAudio() {
    if (!gameplayMusicPath) {
      gameplayMusicPath = getDefaultGameplayMusicPath();
    }
    if (gameplayMusicAudio) return gameplayMusicAudio;
    if (window.WebUiSeamlessLoopAudio && window.WebUiSeamlessLoopAudio.create) {
      gameplayMusicAudio = window.WebUiSeamlessLoopAudio.create(gameplayMusicPath);
    } else {
      gameplayMusicAudio = new Audio(gameplayMusicPath);
      gameplayMusicAudio.loop = true;
    }
    gameplayMusicAudio.preload = "auto";
    gameplayMusicAudio.volume = 0;
    return gameplayMusicAudio;
  }

  function ensureGameOverMusicAudio() {
    if (!gameOverMusicPath) {
      return null;
    }
    if (gameOverMusicAudio) return gameOverMusicAudio;
    if (window.WebUiSeamlessLoopAudio && window.WebUiSeamlessLoopAudio.create) {
      gameOverMusicAudio = window.WebUiSeamlessLoopAudio.create(gameOverMusicPath);
    } else {
      gameOverMusicAudio = new Audio(gameOverMusicPath);
      gameOverMusicAudio.loop = true;
    }
    gameOverMusicAudio.preload = "auto";
    gameOverMusicAudio.volume = 0;
    return gameOverMusicAudio;
  }

  function applyStartMusicVolume() {
    if (!startMusicAudio) return;
    startMusicAudio.volume = getMusicVolumeFromSettings();
  }

  function applyGameplayMusicVolume() {
    if (!gameplayMusicAudio) return;
    gameplayMusicAudio.volume = getMusicVolumeFromSettings();
  }

  function applyGameOverMusicVolume() {
    if (!gameOverMusicAudio) return;
    gameOverMusicAudio.volume = getMusicVolumeFromSettings();
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

  function onGameOverMusicPlayFailed() {
    gameOverMusicStarted = false;
    gameOverMusicActive = false;
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
    startMusicAudio.loop = true;
    startMusicAudio.pause();
    startMusicAudio.currentTime = 0;
  }

  function stopGameplayMusicOnly() {
    gameplayMusicActive = false;
    if (!gameplayMusicAudio) return;
    gameplayMusicAudio.pause();
    gameplayMusicAudio.currentTime = 0;
  }

  function stopGameOverMusicOnly() {
    gameOverMusicActive = false;
    if (!gameOverMusicAudio) return;
    gameOverMusicAudio.pause();
    gameOverMusicAudio.currentTime = 0;
  }

  function startStartMusic() {
    stopGameplayMusicOnly();
    stopGameOverMusicOnly();
    pauseMenuMusic();
    waitingForStartMusicBeforeGameplay = false;
    startMusicActive = true;
    var audio = ensureStartMusicAudio();
    audio.loop = true;
    applyStartMusicVolume();
    preloadGameplayMusic();
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
    stopGameOverMusicOnly();
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

  function startGameOverMusic() {
    if (!gameOverMusicPath) {
      return;
    }
    stopStartMusicOnly();
    stopGameplayMusicOnly();
    pauseMenuMusic();
    gameOverMusicActive = true;
    var audio = ensureGameOverMusicAudio();
    if (!audio) {
      return;
    }
    applyGameOverMusicVolume();
    if (!gameOverMusicStarted) {
      gameOverMusicStarted = true;
      playAudioElement(audio, onGameOverMusicPlayFailed);
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

  function transitionFromStartMusicToGameplay() {
    if (!isStartMusicStillPlaying()) {
      stopStartMusicOnly();
      startGameplayMusic();
      return;
    }
    waitingForStartMusicBeforeGameplay = true;
    startMusicAudio.loop = false;
    preloadGameplayMusic();
    startMusicAudio.addEventListener("timeupdate", onStartMusicTimeUpdate);
    checkStartMusicNearEnd();
  }

  function stop() {
    stopGameOverMusicOnly();
    if (usesStartScreenMusic) {
      transitionFromStartMusicToGameplay();
      return;
    }
    stopStartMusicOnly();
    resumeMenuMusic();
  }

  function forceStop() {
    usesStartScreenMusic = false;
    waitingForStartMusicBeforeGameplay = false;
    clearStartMusicTransitionListeners();
    stopStartMusicOnly();
    stopGameplayMusicOnly();
    stopGameOverMusicOnly();
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
    if (gameOverMusicActive) {
      applyGameOverMusicVolume();
    }
  }

  window.WebExtrasGameStartMusic = {
    setMusicPaths: setMusicPaths,
    setUsesStartScreenMusic: setUsesStartScreenMusic,
    start: start,
    stop: stop,
    startGameOver: startGameOverMusic,
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
