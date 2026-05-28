(function () {
  var AUDIO_HOVER_PATH = "../audio/ui-hover.wav";
  var AUDIO_CLICK_PATH = "../audio/ui-click.wav";

  var hoverAudio = new Audio(AUDIO_HOVER_PATH);
  var clickAudio = new Audio(AUDIO_CLICK_PATH);
  var lastHoverKey = "";
  var audioUnlocked = false;

  hoverAudio.preload = "auto";
  clickAudio.preload = "auto";

  function getInterfaceVolume() {
    if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.getInterfaceOutputVolume) {
      return window.WebMenuAudioVolume.getInterfaceOutputVolume();
    }
    return 0.5;
  }

  function applyInterfaceVolume() {
    var volume = getInterfaceVolume();
    hoverAudio.volume = volume;
    clickAudio.volume = volume;
  }

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    applyInterfaceVolume();
    var hoverPromise = hoverAudio.play();
    if (hoverPromise && hoverPromise.then) {
      hoverPromise.then(function () {
        hoverAudio.pause();
        hoverAudio.currentTime = 0;
      }).catch(function () {});
    }
  }

  function playSound(audioElement) {
    if (!audioElement) return;
    if (!audioUnlocked) return;
    applyInterfaceVolume();
    audioElement.currentTime = 0;
    var playPromise = audioElement.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {});
    }
  }

  function getSoundTokenAtPoint(clientX, clientY) {
    if (window.WebMenuCursorBridge && window.WebMenuCursorBridge.getTokenAtPoint) {
      return window.WebMenuCursorBridge.getTokenAtPoint(clientX, clientY);
    }
    return "default";
  }

  function isHoverSoundToken(token) {
    return token === "pointer" || token === "scroll-h";
  }

  function getSoundTargetElement(element) {
    while (element && element !== document.documentElement) {
      if (element.classList) {
        if (
          element.classList.contains("worlds-entry") ||
          element.classList.contains("term-row") ||
          element.classList.contains("settings-tab") ||
          element.classList.contains("settings-option-btn") ||
          element.classList.contains("settings-step")
        ) {
          return element;
        }
      }

      var tagName = element.tagName;
      if (tagName === "BUTTON" || tagName === "A") {
        return element;
      }

      element = element.parentElement;
    }

    return null;
  }

  function getElementPath(element) {
    var parts = [];
    while (element && element !== document.documentElement) {
      var part = element.tagName;
      if (element.id) {
        part = part + "#" + element.id;
      }
      parts.push(part);
      element = element.parentElement;
    }
    return parts.join("/");
  }

  function getHoverKeyAtPoint(clientX, clientY) {
    var token = getSoundTokenAtPoint(clientX, clientY);
    if (!isHoverSoundToken(token)) {
      return "";
    }

    var target = document.elementFromPoint(clientX, clientY);
    if (!target) {
      return token;
    }

    var soundTarget = getSoundTargetElement(target);
    if (soundTarget) {
      return token + "|" + getElementPath(soundTarget);
    }

    return token + "|" + getElementPath(target);
  }

  function onPointerMove(event) {
    var hoverKey = getHoverKeyAtPoint(event.clientX, event.clientY);
    if (hoverKey === lastHoverKey) {
      return;
    }

    if (hoverKey !== "") {
      playSound(hoverAudio);
    }

    lastHoverKey = hoverKey;
  }

  function onPointerDown(event) {
    unlockAudio();
    if (!isHoverSoundToken(getSoundTokenAtPoint(event.clientX, event.clientY))) {
      return;
    }

    playSound(clickAudio);
  }

  function onPointerLeave() {
    lastHoverKey = "";
  }

  document.addEventListener("pointermove", onPointerMove, true);
  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("pointerleave", onPointerLeave, true);
  document.addEventListener("keydown", unlockAudio, true);

  if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.EVENT_AUDIO_VOLUME_CHANGED) {
    window.addEventListener(
      window.WebMenuAudioVolume.EVENT_AUDIO_VOLUME_CHANGED,
      applyInterfaceVolume
    );
  }
})();
