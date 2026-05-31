(function () {
  var EVENT_KEY = "cm-game-key";
  var gameFrame = null;
  var forwardingEnabled = false;

  var KEY_TO_CODE = {
    w: "KeyW",
    W: "KeyW",
    a: "KeyA",
    A: "KeyA",
    s: "KeyS",
    S: "KeyS",
    d: "KeyD",
    D: "KeyD",
    ArrowUp: "ArrowUp",
    ArrowDown: "ArrowDown",
    ArrowLeft: "ArrowLeft",
    ArrowRight: "ArrowRight"
  };

  function setGameFrame(frame) {
    gameFrame = frame || null;
  }

  function setForwardingEnabled(enabled) {
    forwardingEnabled = !!enabled;
  }

  function isGameFrameLoaded() {
    var src;
    if (!gameFrame) {
      return false;
    }
    src = gameFrame.src || "";
    if (!src || src === "about:blank") {
      return false;
    }
    return true;
  }

  function shouldForwardKeys() {
    return forwardingEnabled && isGameFrameLoaded();
  }

  function getCodeFromKey(key) {
    if (!key) {
      return "";
    }
    if (Object.prototype.hasOwnProperty.call(KEY_TO_CODE, key)) {
      return KEY_TO_CODE[key];
    }
    if (key.length === 1) {
      var upper = key.toUpperCase();
      if (upper >= "A" && upper <= "Z") {
        return "Key" + upper;
      }
    }
    return "";
  }

  function getKeyPayload(event) {
    var code = event.code || "";
    var key = event.key || "";
    if (!code) {
      code = getCodeFromKey(key);
    }
    if (!key && code.indexOf("Key") === 0 && code.length === 4) {
      key = code.charAt(3).toLowerCase();
    }
    return {
      code: code,
      key: key,
      repeat: !!event.repeat
    };
  }

  function dispatchKeyOnWindow(targetWindow, type, payload) {
    var eventInit;
    var keyEvent;
    var gameRoot;
    if (!targetWindow) {
      return;
    }
    eventInit = {
      code: payload.code,
      key: payload.key,
      repeat: payload.repeat,
      bubbles: true,
      cancelable: true
    };
    keyEvent = new KeyboardEvent(type, eventInit);
    targetWindow.dispatchEvent(keyEvent);
    if (targetWindow.document) {
      targetWindow.document.dispatchEvent(keyEvent);
      gameRoot = targetWindow.document.getElementById("gameRoot");
      if (gameRoot) {
        gameRoot.dispatchEvent(keyEvent);
      }
    }
  }

  function sendKeyToFrame(event, type) {
    var contentWindow;
    var payload;
    if (!gameFrame) {
      return;
    }
    payload = getKeyPayload(event);
    if (!payload.code && !payload.key) {
      return;
    }
    try {
      contentWindow = gameFrame.contentWindow;
    } catch (error) {
      contentWindow = null;
    }
    if (contentWindow) {
      dispatchKeyOnWindow(contentWindow, type, payload);
    }
  }

  function onKeyDown(event) {
    if (!shouldForwardKeys()) {
      return;
    }
    if (event.key === "Escape") {
      return;
    }
    sendKeyToFrame(event, "keydown");
    event.preventDefault();
    event.stopPropagation();
  }

  function onKeyUp(event) {
    if (!shouldForwardKeys()) {
      return;
    }
    if (event.key === "Escape") {
      return;
    }
    sendKeyToFrame(event, "keyup");
    event.preventDefault();
    event.stopPropagation();
  }

  function focusGameFrame() {
    if (!gameFrame || !gameFrame.focus) {
      return;
    }
    try {
      gameFrame.focus({ preventScroll: true });
    } catch (error) {
      gameFrame.focus();
    }
  }

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("keyup", onKeyUp, true);

  function injectKey(type, code, key) {
    var payload;
    if (!shouldForwardKeys()) {
      return;
    }
    payload = {
      code: code || "",
      key: key || "",
      repeat: false
    };
    if (!payload.code) {
      payload.code = getCodeFromKey(payload.key);
    }
    if (!payload.code && !payload.key) {
      return;
    }
    try {
      dispatchKeyOnWindow(gameFrame.contentWindow, type, payload);
    } catch (error) {
    }
  }

  window.WebGameFrameInputHost = {
    setGameFrame: setGameFrame,
    setForwardingEnabled: setForwardingEnabled,
    focusGameFrame: focusGameFrame,
    injectKey: injectKey
  };
})();
