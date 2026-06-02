(function () {
  var EVENT_LOCALE = "cm-game-locale";
  var EVENT_LOCALE_REQUEST = "cm-game-locale-request";
  var strings = {};

  function get(key, fallback) {
    if (key && Object.prototype.hasOwnProperty.call(strings, key)) {
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

  function format(key, fallback) {
    var text = get(key, fallback);
    var argIndex;
    for (argIndex = 2; argIndex < arguments.length; argIndex++) {
      text = text.split("{" + String(argIndex - 2) + "}").join(String(arguments[argIndex]));
    }
    return text;
  }

  function applyDom() {
    var elements = document.querySelectorAll("[data-locale-key]");
    var index;
    for (index = 0; index < elements.length; index++) {
      var element = elements[index];
      var key = element.getAttribute("data-locale-key");
      if (!key) {
        continue;
      }
      element.textContent = get(key, element.textContent);
    }

    var ariaElements = document.querySelectorAll("[data-locale-aria-label]");
    for (index = 0; index < ariaElements.length; index++) {
      var ariaElement = ariaElements[index];
      var ariaKey = ariaElement.getAttribute("data-locale-aria-label");
      if (!ariaKey) {
        continue;
      }
      ariaElement.setAttribute("aria-label", get(ariaKey, ariaElement.getAttribute("aria-label")));
    }
  }

  function applyAll(map) {
    strings = map || {};
    applyDom();
    document.documentElement.classList.add("locale-ready");
    window.dispatchEvent(new CustomEvent("web-locale-applied"));
  }

  function onLocaleMessage(event) {
    if (!event || !event.data || event.data.eventName !== EVENT_LOCALE) {
      return;
    }
    applyAll(event.data.strings);
  }

  function requestLocaleFromParent() {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ eventName: EVENT_LOCALE_REQUEST }, "*");
      }
    } catch (error) {
    }
  }

  window.WebGameLocale = {
    get: get,
    format: format,
    applyAll: applyAll,
    applyDom: applyDom
  };

  window.addEventListener("message", onLocaleMessage);
  requestLocaleFromParent();
})();
