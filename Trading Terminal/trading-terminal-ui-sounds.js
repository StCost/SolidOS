(function () {
  var AUDIO_HOVER_FILE = "ui-hover.wav";
  var AUDIO_CLICK_FILE = "ui-click.wav";
  var AUDIO_FOLDER = "../audio/";
  var DEFAULT_INTERFACE_VOLUME = 0.5;

  var hoverAudio = new Audio(AUDIO_FOLDER + AUDIO_HOVER_FILE);
  var clickAudio = new Audio(AUDIO_FOLDER + AUDIO_CLICK_FILE);
  var lastHoverKey = "";
  var audioUnlocked = false;

  hoverAudio.preload = "auto";
  clickAudio.preload = "auto";

  function getInterfaceVolume() {
    if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.getInterfaceOutputVolume) {
      return window.WebMenuAudioVolume.getInterfaceOutputVolume();
    }
    return DEFAULT_INTERFACE_VOLUME;
  }

  function applyInterfaceVolume() {
    var volume = getInterfaceVolume();
    hoverAudio.volume = volume;
    clickAudio.volume = volume;
  }

  function unlockAudio() {
    if (audioUnlocked) {
      return;
    }
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
    if (!audioElement || !audioUnlocked) {
      return;
    }
    applyInterfaceVolume();
    audioElement.currentTime = 0;
    var playPromise = audioElement.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {});
    }
  }

  function getSoundTargetElement(element) {
    while (element && element !== document.documentElement) {
      if (element.classList) {
        if (
          element.classList.contains("trade-contract-row") ||
          element.classList.contains("trade-item-row") ||
          element.classList.contains("trade-sort-header") ||
          element.classList.contains("trade-lock-button") ||
          element.classList.contains("trade-qty-button") ||
          element.classList.contains("trade-transit-step-button") ||
          element.classList.contains("term-button")
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
      } else if (element.parentElement) {
        var siblings = element.parentElement.children;
        var siblingIndex = 0;
        var index;
        for (index = 0; index < siblings.length; index++) {
          if (siblings[index] === element) {
            siblingIndex = index;
            break;
          }
        }
        part = part + "[" + siblingIndex + "]";
      }
      parts.push(part);
      element = element.parentElement;
    }
    return parts.join("/");
  }

  function getHoverKeyAtPoint(clientX, clientY, cursorMode) {
    if (cursorMode !== "pointer") {
      return "";
    }
    var target = document.elementFromPoint(clientX, clientY);
    if (!target) {
      return "";
    }
    var soundTarget = getSoundTargetElement(target);
    if (soundTarget) {
      return cursorMode + "|" + getElementPath(soundTarget);
    }
    return cursorMode + "|" + getElementPath(target);
  }

  window.TradingTerminalUiSounds = {
    unlock: unlockAudio,
    playHoverAtPoint: function (clientX, clientY, cursorMode) {
      var hoverKey = getHoverKeyAtPoint(clientX, clientY, cursorMode);
      if (hoverKey === lastHoverKey) {
        return;
      }
      lastHoverKey = hoverKey;
      if (hoverKey !== "") {
        playSound(hoverAudio);
      }
    },
    playClick: function () {
      unlockAudio();
      playSound(clickAudio);
    },
    resetHover: function () {
      lastHoverKey = "";
    }
  };

  document.addEventListener("keydown", unlockAudio, true);
  if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.EVENT_AUDIO_VOLUME_CHANGED) {
    window.addEventListener(
      window.WebMenuAudioVolume.EVENT_AUDIO_VOLUME_CHANGED,
      applyInterfaceVolume
    );
  }
})();
