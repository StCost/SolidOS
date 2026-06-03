(function () {
  var INPUT_MODE_MOVEMENT = "movement";
  var INPUT_MODE_CURSOR = "cursor";
  var gameFrame = null;
  var forwardingEnabled = false;
  var inputMode = INPUT_MODE_CURSOR;

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

  function isMovementKeyEvent(event) {
    var code = event.code || "";
    var key = event.key || "";
    if (code === "KeyW" || code === "KeyA" || code === "KeyS" || code === "KeyD") {
      return true;
    }
    if (code === "ArrowUp" || code === "ArrowDown" || code === "ArrowLeft" || code === "ArrowRight") {
      return true;
    }
    if (Object.prototype.hasOwnProperty.call(KEY_TO_CODE, key)) {
      return true;
    }
    return false;
  }

  function isActionKeyEvent(event) {
    var code = event.code || "";
    var key = event.key || "";
    if (code === "Space" || code === "Enter" || key === " " || key === "Enter") {
      return true;
    }
    return false;
  }

  function setGameFrame(frame) {
    gameFrame = frame || null;
  }

  function setForwardingEnabled(enabled) {
    forwardingEnabled = !!enabled;
  }

  function setInputMode(mode) {
    if (mode === INPUT_MODE_MOVEMENT) {
      inputMode = INPUT_MODE_MOVEMENT;
      return;
    }
    inputMode = INPUT_MODE_CURSOR;
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

  function getFrameWindow() {
    if (!gameFrame) {
      return null;
    }
    try {
      return gameFrame.contentWindow;
    } catch (error) {
      return null;
    }
  }

  function callFrameInput(methodName, arg1, arg2) {
    var frameWindow = getFrameWindow();
    var api;
    if (!frameWindow || !frameWindow.WebGameInput) {
      return;
    }
    api = frameWindow.WebGameInput;
    if (!api[methodName]) {
      return;
    }
    if (arg2 !== undefined) {
      api[methodName](arg1, arg2);
      return;
    }
    if (arg1 !== undefined) {
      api[methodName](arg1);
      return;
    }
    api[methodName]();
  }

  function syncFrameInputMode() {
    callFrameInput("setInputMode", inputMode);
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

  function getDirectionFromKeyEvent(event) {
    var code = event.code || "";
    var key = event.key || "";
    if (code === "KeyW" || code === "ArrowUp" || key === "w" || key === "W") {
      return { x: 0, y: -1 };
    }
    if (code === "KeyS" || code === "ArrowDown" || key === "s" || key === "S") {
      return { x: 0, y: 1 };
    }
    if (code === "KeyA" || code === "ArrowLeft" || key === "a" || key === "A") {
      return { x: -1, y: 0 };
    }
    if (code === "KeyD" || code === "ArrowRight" || key === "d" || key === "D") {
      return { x: 1, y: 0 };
    }
    return null;
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
    contentWindow = getFrameWindow();
    if (contentWindow) {
      dispatchKeyOnWindow(contentWindow, type, payload);
    }
  }

  function onKeyDown(event) {
    var direction;
    if (!shouldForwardKeys()) {
      return;
    }
    if (event.key === "Escape") {
      return;
    }
    if (inputMode === INPUT_MODE_CURSOR) {
      if (isActionKeyEvent(event)) {
        callFrameInput("actionPress");
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      direction = getDirectionFromKeyEvent(event);
      if (direction) {
        callFrameInput("navigate", direction.x, direction.y);
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    if (inputMode === INPUT_MODE_MOVEMENT && !isMovementKeyEvent(event) && !isActionKeyEvent(event)) {
      return;
    }
    sendKeyToFrame(event, "keydown");
    event.preventDefault();
    event.stopPropagation();
  }

  function onKeyUp(event) {
    var direction;
    if (!shouldForwardKeys()) {
      return;
    }
    if (event.key === "Escape") {
      return;
    }
    if (inputMode === INPUT_MODE_CURSOR) {
      direction = getDirectionFromKeyEvent(event);
      if (direction) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (isActionKeyEvent(event)) {
        callFrameInput("actionRelease");
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    if (inputMode === INPUT_MODE_MOVEMENT && !isMovementKeyEvent(event) && !isActionKeyEvent(event)) {
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

  window.WebGameFrameInputHost = {
    setGameFrame: setGameFrame,
    setForwardingEnabled: setForwardingEnabled,
    setInputMode: setInputMode,
    syncFrameInputMode: syncFrameInputMode,
    focusGameFrame: focusGameFrame
  };
})();
