(function () {
  var DEFAULT_START_MUSIC_FILE = "ui-extras-game-start-music.wav";
  var DEFAULT_GAMEPLAY_MUSIC_FILE = "ui-extras-game-music.wav";
  var PARENT_SEGMENT = "..";
  var AUDIO_FOLDER = "audio";

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

  function resetGameOverMusicAudio() {
    if (gameOverMusicAudio) {
      gameOverMusicAudio.pause();
      gameOverMusicAudio = null;
    }
    gameOverMusicStarted = false;
  }

  function getDefaultStartMusicPath() {
    if (window.WebMenuAudioPaths && window.WebMenuAudioPaths.getMenuAudioPath) {
      return window.WebMenuAudioPaths.getMenuAudioPath(DEFAULT_START_MUSIC_FILE);
    }
    return PARENT_SEGMENT + "/" + AUDIO_FOLDER + "/" + DEFAULT_START_MUSIC_FILE;
  }

  function getDefaultGameplayMusicPath() {
    if (window.WebMenuAudioPaths && window.WebMenuAudioPaths.getMenuAudioPath) {
      return window.WebMenuAudioPaths.getMenuAudioPath(DEFAULT_GAMEPLAY_MUSIC_FILE);
    }
    return PARENT_SEGMENT + "/" + AUDIO_FOLDER + "/" + DEFAULT_GAMEPLAY_MUSIC_FILE;
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
    return pathOrFileName;
  }

  function normalizeGameOverMusicPath(pathOrFileName) {
    if (!pathOrFileName) {
      return "";
    }
    if (window.WebMenuAudioPaths && window.WebMenuAudioPaths.getMenuAudioPath) {
      return window.WebMenuAudioPaths.getMenuAudioPath(pathOrFileName);
    }
    return pathOrFileName;
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

  function ensureStartMusicAudio() {
    if (!startMusicPath) {
      startMusicPath = getDefaultStartMusicPath();
    }
    if (startMusicAudio) return startMusicAudio;
    if (window.WebUiSeamlessLoopAudio && window.WebUiSeamlessLoopAudio.create) {
      startMusicAudio = window.WebUiSeamlessLoopAudio.create(startMusicPath);
    } else {
      startMusicAudio = new Audio(startMusicPath);
      startMusicAudio.loop = true;
    }
    startMusicAudio.preload = "auto";
    startMusicAudio.volume = 0;
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

  function stop() {
    stopStartMusicOnly();
    stopGameOverMusicOnly();
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
