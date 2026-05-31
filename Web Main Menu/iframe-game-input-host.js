(function () {
  var EVENT_KEY = "cm-game-key";
  var INPUT_MODE_MOVEMENT = "movement";
  var INPUT_MODE_CURSOR = "cursor";
  var gameFrame = null;
  var forwardingEnabled = false;
  var inputMode = INPUT_MODE_CURSOR;
  var webNavigateRepeatTimer = 0;
  var webNavigateHeld = false;
  var webNavigateDirectionX = 0;
  var webNavigateDirectionY = 0;
  var webActionHeld = false;
  var webActionRepeatTimer = 0;

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

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

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
    if (!forwardingEnabled) {
      webNavigateHeld = false;
      webNavigateRepeatTimer = 0;
      webActionHeld = false;
      webActionRepeatTimer = 0;
    }
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
        injectPointerActionPress();
        webActionHeld = true;
        webActionRepeatTimer = 0;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      direction = getDirectionFromKeyEvent(event);
      if (direction) {
        if (isUnityHost()) {
          return;
        }
        injectNavigate(direction.x, direction.y);
        webNavigateHeld = true;
        webNavigateDirectionX = direction.x;
        webNavigateDirectionY = direction.y;
        webNavigateRepeatTimer = 0;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    if (isUnityHost() && isMovementKeyEvent(event)) {
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
        webNavigateHeld = false;
        webNavigateRepeatTimer = 0;
        if (isUnityHost()) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (isActionKeyEvent(event)) {
        injectPointerActionRelease();
        webActionHeld = false;
        webActionRepeatTimer = 0;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    if (isUnityHost() && isMovementKeyEvent(event)) {
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

  function injectKey(type, code, key) {
    var payload;
    if (!shouldForwardKeys() || inputMode !== INPUT_MODE_MOVEMENT) {
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
    dispatchKeyOnWindow(getFrameWindow(), type, payload);
  }

  function injectNavigate(dirX, dirY) {
    if (shouldForwardKeys() && inputMode === INPUT_MODE_CURSOR && isGameFrameLoaded()) {
      callFrameInput("navigate", dirX, dirY);
      return;
    }
    if (window.WebMenuFocusInput && window.WebMenuFocusInput.navigate) {
      window.WebMenuFocusInput.navigate(dirX, dirY);
    }
  }

  function injectPointerActionPress() {
    if (shouldForwardKeys() && inputMode === INPUT_MODE_CURSOR && isGameFrameLoaded()) {
      callFrameInput("actionPress");
      return;
    }
    if (window.WebMenuFocusInput && window.WebMenuFocusInput.actionPress) {
      window.WebMenuFocusInput.actionPress();
    }
  }

  function injectPointerActionRelease() {
    if (shouldForwardKeys() && inputMode === INPUT_MODE_CURSOR && isGameFrameLoaded()) {
      callFrameInput("actionRelease");
      return;
    }
    if (window.WebMenuFocusInput && window.WebMenuFocusInput.actionRelease) {
      window.WebMenuFocusInput.actionRelease();
    }
  }

  function injectPointerActionRepeat() {
    if (shouldForwardKeys() && inputMode === INPUT_MODE_CURSOR && isGameFrameLoaded()) {
      callFrameInput("actionRepeat");
      return;
    }
    if (window.WebMenuFocusInput && window.WebMenuFocusInput.actionRepeat) {
      window.WebMenuFocusInput.actionRepeat();
    }
  }

  function injectPointerClick() {
    if (!shouldForwardKeys() || inputMode !== INPUT_MODE_CURSOR) {
      return;
    }
    callFrameInput("pointerClick");
  }

  function injectPointerDown() {
    if (!shouldForwardKeys() || inputMode !== INPUT_MODE_CURSOR) {
      return;
    }
    callFrameInput("pointerDown");
  }

  function injectPointerUp() {
    if (!shouldForwardKeys() || inputMode !== INPUT_MODE_CURSOR) {
      return;
    }
    callFrameInput("pointerUp");
  }

  function tickWebActionRepeat(deltaSeconds) {
    if (isUnityHost() || !webActionHeld || inputMode !== INPUT_MODE_CURSOR) {
      return;
    }
    webActionRepeatTimer += deltaSeconds;
    if (webActionRepeatTimer < 0.12) {
      return;
    }
    webActionRepeatTimer = 0;
    injectPointerActionRepeat();
  }

  function tickWebNavigateRepeat(deltaSeconds) {
    if (isUnityHost() || !webNavigateHeld || inputMode !== INPUT_MODE_CURSOR) {
      return;
    }
    webNavigateRepeatTimer += deltaSeconds;
    if (webNavigateRepeatTimer < 0.32) {
      return;
    }
    webNavigateRepeatTimer = 0;
    injectNavigate(webNavigateDirectionX, webNavigateDirectionY);
  }

  var lastWebNavigateTick = 0;
  function onWebNavigateFrame(timestamp) {
    var deltaSeconds;
    if (!lastWebNavigateTick) {
      lastWebNavigateTick = timestamp;
    }
    deltaSeconds = (timestamp - lastWebNavigateTick) / 1000;
    if (deltaSeconds > 0.1) {
      deltaSeconds = 0.1;
    }
    lastWebNavigateTick = timestamp;
    tickWebNavigateRepeat(deltaSeconds);
    tickWebActionRepeat(deltaSeconds);
    window.requestAnimationFrame(onWebNavigateFrame);
  }

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp, true);
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("keyup", onKeyUp, true);
  window.requestAnimationFrame(onWebNavigateFrame);

  window.WebGameFrameInputHost = {
    setGameFrame: setGameFrame,
    setForwardingEnabled: setForwardingEnabled,
    setInputMode: setInputMode,
    syncFrameInputMode: syncFrameInputMode,
    focusGameFrame: focusGameFrame,
    injectKey: injectKey,
    injectNavigate: injectNavigate,
    injectPointerClick: injectPointerClick,
    injectPointerDown: injectPointerDown,
    injectPointerUp: injectPointerUp,
    injectPointerActionPress: injectPointerActionPress,
    injectPointerActionRelease: injectPointerActionRelease,
    injectPointerActionRepeat: injectPointerActionRepeat
  };
})();
