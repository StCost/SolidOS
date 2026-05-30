(function () {
  var strings = {};
  var EVENT_LOCALE = "cm-game-locale";
  var EVENT_LOCALE_REQUEST = "cm-game-locale-request";
  var boundFlag = "__cmIframeGameLocaleBound";

  if (window[boundFlag]) {
    return;
  }
  window[boundFlag] = true;

  function get(key, fallback) {
    if (Object.prototype.hasOwnProperty.call(strings, key)) {
      var value = strings[key];
      if (value != null && value !== "") {
        return value;
      }
    }
    if (fallback != null) {
      return fallback;
    }
    return key || "";
  }

  function applyStrings(map) {
    strings = map || {};
    window.dispatchEvent(new CustomEvent("web-locale-applied"));
  }

  function onMessage(event) {
    if (!event || !event.data || event.data.eventName !== EVENT_LOCALE) {
      return;
    }
    if (!event.data.strings) {
      return;
    }
    applyStrings(event.data.strings);
  }

  function requestLocaleFromHost() {
    if (!window.parent || window.parent === window) {
      return;
    }
    try {
      window.parent.postMessage(
        {
          eventName: EVENT_LOCALE_REQUEST
        },
        "*"
      );
    } catch (error) {
    }
  }

  window.addEventListener("message", onMessage);

  window.WebLocale = {
    get: get
  };

  requestLocaleFromHost();
})();
