(function () {
  var MUSIC_PATH = "../audio/menu-music.mp3";
  var FADE_STEP_MS = 50;
  var FADE_DURATION_MS = 10000;
  var FADE_DURATION_PAUSE_MS = 1500;

  var musicAudio = null;
  var fadeTimerId = 0;
  var fadeTargetVolume = 0;
  var fadeStartVolume = 0;
  var fadeStartTime = 0;
  var musicStarted = false;
  var audioUnlocked = false;

  function isGameMode() {
    if (window.WebMenuMode === "game") return true;
    var device = document.getElementById("device");
    return !!device && device.classList.contains("menu-mode--game");
  }

  function isMenuMusicEnabled() {
    if (window.WebSettings && window.WebSettings.isMenuMusicEnabled) {
      return window.WebSettings.isMenuMusicEnabled();
    }
    return true;
  }

  function getMusicVolumeFromSettings() {
    if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.getMusicOutputVolume) {
      return window.WebMenuAudioVolume.getMusicOutputVolume();
    }
    return 0.5;
  }

  function ensureMusicAudio() {
    if (musicAudio) return musicAudio;
    musicAudio = new Audio(MUSIC_PATH);
    musicAudio.loop = true;
    musicAudio.preload = "auto";
    musicAudio.volume = 0;
    return musicAudio;
  }

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    syncMenuMusic();
  }

  function clearFadeTimer() {
    if (!fadeTimerId) return;
    window.clearInterval(fadeTimerId);
    fadeTimerId = 0;
  }

  function setMusicVolumeImmediate(volume) {
    if (!musicAudio) return;
    if (volume < 0) volume = 0;
    if (volume > 1) volume = 1;
    musicAudio.volume = volume;
  }

  function fadeMusicTo(targetVolume, fadeDurationMs) {
    if (!musicAudio) return;

    clearFadeTimer();
    fadeTargetVolume = targetVolume;
    if (targetVolume < 0) fadeTargetVolume = 0;
    if (targetVolume > 1) fadeTargetVolume = 1;

    fadeStartVolume = musicAudio.volume;
    fadeStartTime = Date.now();

    var durationMs = fadeDurationMs;
    if (!durationMs || durationMs < 1) durationMs = FADE_DURATION_MS;

    if (Math.abs(fadeStartVolume - fadeTargetVolume) < 0.001) {
      setMusicVolumeImmediate(fadeTargetVolume);
      if (fadeTargetVolume <= 0 && musicAudio) {
        musicAudio.pause();
      }
      return;
    }

    fadeTimerId = window.setInterval(function () {
      var elapsed = Date.now() - fadeStartTime;
      var progress = elapsed / durationMs;
      if (progress >= 1) progress = 1;

      var nextVolume = fadeStartVolume + (fadeTargetVolume - fadeStartVolume) * progress;
      setMusicVolumeImmediate(nextVolume);

      if (progress < 1) return;

      clearFadeTimer();
      if (fadeTargetVolume <= 0 && musicAudio) {
        musicAudio.pause();
      }
    }, FADE_STEP_MS);
  }

  function isExtrasGameGameplayMusicActive() {
    if (window.WebExtrasGameStartMusic && window.WebExtrasGameStartMusic.isGameplayMusicActive) {
      return window.WebExtrasGameStartMusic.isGameplayMusicActive();
    }
    return false;
  }

  function startMenuMusic() {
    if (isGameMode()) return;
    if (isExtrasGameGameplayMusicActive()) return;
    if (!audioUnlocked) return;

    var audio = ensureMusicAudio();
    if (!musicStarted) {
      musicStarted = true;
      var playPromise = audio.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {
          musicStarted = false;
        });
      }
    } else if (audio.paused) {
      var resumePromise = audio.play();
      if (resumePromise && resumePromise.catch) {
        resumePromise.catch(function () { });
      }
    }

    setMusicVolumeImmediate(getMusicVolumeFromSettings());
  }

  function stopMenuMusic() {
    if (!musicAudio) return;
    fadeMusicTo(0);
  }

  function pauseMenuMusicTemporarily() {
    if (!musicAudio) return;
    fadeMusicTo(0, FADE_DURATION_PAUSE_MS);
  }

  function syncMenuMusic() {
    if (isGameMode()) {
      stopMenuMusic();
      return;
    }
    if (isExtrasGameGameplayMusicActive()) {
      return;
    }
    if (!isMenuMusicEnabled()) {
      stopMenuMusic();
      return;
    }
    startMenuMusic();
  }

  function watchMenuMode() {
    var device = document.getElementById("device");
    if (!device || !window.MutationObserver) return;

    var observer = new MutationObserver(function () {
      syncMenuMusic();
    });

    observer.observe(device, { attributes: true, attributeFilter: ["class"] });
  }

  function onAudioVolumeChanged() {
    if (isGameMode()) return;
    if (!musicAudio || musicAudio.paused) {
      if (audioUnlocked) {
        syncMenuMusic();
      }
      return;
    }
    setMusicVolumeImmediate(getMusicVolumeFromSettings());
  }

  function onUserGesture() {
    unlockAudio();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      watchMenuMode();
    });
  } else {
    watchMenuMode();
  }

  document.addEventListener("pointerdown", onUserGesture, true);
  document.addEventListener("keydown", onUserGesture, true);
  if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.EVENT_AUDIO_VOLUME_CHANGED) {
    window.addEventListener(
      window.WebMenuAudioVolume.EVENT_AUDIO_VOLUME_CHANGED,
      onAudioVolumeChanged
    );
  }

  window.WebMenuMusic = {
    pauseTemporarily: pauseMenuMusicTemporarily,
    resumeIfAllowed: syncMenuMusic,
    sync: syncMenuMusic
  };
})();
