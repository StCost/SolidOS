(function () {
  var strings = {};
  var EVENT_LOCALE = "cm-game-locale";
  var EVENT_LOCALE_REQUEST = "cm-game-locale-request";
  var LOCALIZATION_BASE = "../../../../Localization/";
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
      loadStandaloneLocaleFromUrl();
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

  function getUrlLanguageCode() {
    try {
      var params = new URLSearchParams(window.location.search);
      var value = params.get("lang") || params.get("language") || params.get("locale");
      if (!value) {
        return "";
      }
      return value.trim().toLowerCase();
    } catch (error) {
      return "";
    }
  }

  function loadStandaloneLocaleFromUrl() {
    var languageCode;
    var fallbackCode;
    if (!window.fetch) {
      return;
    }
    languageCode = getUrlLanguageCode();
    if (!languageCode) {
      return;
    }
    fallbackCode = "english";
    fetch(LOCALIZATION_BASE + languageCode + ".json")
      .catch(function () {
        if (languageCode === fallbackCode) {
          throw new Error("default locale missing");
        }
        return fetch(LOCALIZATION_BASE + fallbackCode + ".json");
      })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("locale fetch failed");
        }
        return response.json();
      })
      .then(function (map) {
        applyStrings(map);
      })
      .catch(function () {
      });
  }

  window.addEventListener("message", onMessage);

  function getStrings() {
    var copy = {};
    var key;
    for (key in strings) {
      if (Object.prototype.hasOwnProperty.call(strings, key)) {
        copy[key] = strings[key];
      }
    }
    return copy;
  }

  function applyAll(map) {
    applyStrings(map);
  }

  function flushPendingLocale() {
    if (!window.__webPendingLocale) {
      return;
    }
    applyAll(window.__webPendingLocale);
    window.__webPendingLocale = null;
  }

  window.WebLocale = {
    get: get,
    getStrings: getStrings,
    applyAll: applyAll
  };

  requestLocaleFromHost();
  flushPendingLocale();
})();
