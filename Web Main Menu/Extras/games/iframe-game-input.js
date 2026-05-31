(function () {
  var EVENT_KEY = "cm-game-key";
  var boundFlag = "__cmIframeGameInputBound";

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

  if (window[boundFlag]) {
    return;
  }
  window[boundFlag] = true;

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

  function dispatchForwardedKey(payload) {
    var code;
    var key;
    var eventInit;
    var event;
    if (!payload || !payload.type) {
      return;
    }
    code = payload.code || "";
    key = payload.key || "";
    if (!code) {
      code = getCodeFromKey(key);
    }
    if (!key && code.indexOf("Key") === 0 && code.length === 4) {
      key = code.charAt(3).toLowerCase();
    }
    if (!code && !key) {
      return;
    }
    eventInit = {
      code: code,
      key: key,
      repeat: !!payload.repeat,
      bubbles: true,
      cancelable: true
    };
    event = new KeyboardEvent(payload.type, eventInit);
    window.dispatchEvent(event);
    document.dispatchEvent(event);
  }

  function onMessage(event) {
    if (!event || !event.data || event.data.eventName !== EVENT_KEY) {
      return;
    }
    dispatchForwardedKey(event.data);
  }

  window.addEventListener("message", onMessage);
})();
