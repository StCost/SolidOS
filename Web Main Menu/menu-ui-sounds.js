(function () {
  var AUDIO_HOVER_FILE = "ui-hover.wav";
  var AUDIO_CLICK_FILE = "ui-click.wav";
  var AUDIO_TERMINAL_OPEN_FILE = "ui-terminal.wav";
  var AUDIO_MOVE_FILE = "ui-move.wav";

  function getUiSoundPath(fileName) {
    if (window.WebMenuAudioPaths && window.WebMenuAudioPaths.getMenuAudioPath) {
      return window.WebMenuAudioPaths.getMenuAudioPath(fileName);
    }
    return "../audio/" + fileName;
  }

  var PAGE_MENU = "menu";
  var PAGE_START = "start";
  var PAGE_SETTINGS = "settings";
  var PAGE_CREDITS = "credits";
  var PAGE_EXTRAS = "extras";

  var hoverAudio = new Audio(getUiSoundPath(AUDIO_HOVER_FILE));
  var clickAudio = new Audio(getUiSoundPath(AUDIO_CLICK_FILE));
  var terminalOpenAudio = new Audio(getUiSoundPath(AUDIO_TERMINAL_OPEN_FILE));
  var moveAudio = new Audio(getUiSoundPath(AUDIO_MOVE_FILE));
  var lastHoverKey = "";
  var audioUnlocked = false;
  var skippedInitialPageChange = false;

  hoverAudio.preload = "auto";
  clickAudio.preload = "auto";
  terminalOpenAudio.preload = "auto";
  moveAudio.preload = "auto";

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
    terminalOpenAudio.volume = volume;
    moveAudio.volume = volume;
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
      }).catch(function () { });
    }
  }

  function playSound(audioElement) {
    if (!audioElement) return;
    if (!audioUnlocked) return;
    applyInterfaceVolume();
    audioElement.currentTime = 0;
    var playPromise = audioElement.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () { });
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
          element.classList.contains("settings-step") ||
          element.classList.contains("extras-link-row") ||
          element.classList.contains("extras-game-picker") ||
          element.classList.contains("extras-nav-tab") ||
          element.classList.contains("extras-game-back")
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

  function shouldPlayTerminalOpenForPage(pageId) {
    return (
      pageId === PAGE_MENU ||
      pageId === PAGE_START ||
      pageId === PAGE_SETTINGS ||
      pageId === PAGE_CREDITS ||
      pageId === PAGE_EXTRAS
    );
  }

  function onWindowDragStart() {
    unlockAudio();
  }

  function onWindowDragMoveStep() {
    playSound(moveAudio);
  }

  function onPageChanged(event) {
    if (!skippedInitialPageChange) {
      skippedInitialPageChange = true;
      return;
    }

    if (!event || !event.detail) return;
    var pageId = event.detail.pageId;
    if (!shouldPlayTerminalOpenForPage(pageId)) return;

    unlockAudio();
    playSound(terminalOpenAudio);
  }

  document.addEventListener("pointermove", onPointerMove, true);
  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("pointerleave", onPointerLeave, true);
  document.addEventListener("keydown", unlockAudio, true);
  window.addEventListener("web-page-changed", onPageChanged);
  window.addEventListener("web-wm-drag-start", onWindowDragStart);
  window.addEventListener("web-wm-drag-step", onWindowDragMoveStep);

  if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.EVENT_AUDIO_VOLUME_CHANGED) {
    window.addEventListener(
      window.WebMenuAudioVolume.EVENT_AUDIO_VOLUME_CHANGED,
      applyInterfaceVolume
    );
  }
})();
