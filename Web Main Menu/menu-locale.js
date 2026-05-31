(function () {
  var strings = {};

  function isGameMode() {
    if (window.WebMenuMode === "game") return true;
    var device = document.getElementById("device");
    return !!device && device.classList.contains("menu-mode--game");
  }

  function resolveLocaleKey(key) {
    if (key === "menu.start" && isGameMode()) return "menu.pause";
    return key;
  }

  function get(key, fallback) {
    var resolvedKey = resolveLocaleKey(key);
    if (resolvedKey && Object.prototype.hasOwnProperty.call(strings, resolvedKey)) {
      var value = strings[resolvedKey];
      if (value != null && value !== "") return value;
    }
    if (fallback != null) return fallback;
    return resolvedKey || "";
  }

  function applyDom() {
    var elements = document.querySelectorAll("[data-locale-key]");
    var index;
    for (index = 0; index < elements.length; index++) {
      var element = elements[index];
      var key = element.getAttribute("data-locale-key");
      if (!key) continue;
      element.textContent = get(key, element.textContent);
    }

    var placeholderElements = document.querySelectorAll("[data-locale-placeholder]");
    for (index = 0; index < placeholderElements.length; index++) {
      var placeholderElement = placeholderElements[index];
      var placeholderKey = placeholderElement.getAttribute("data-locale-placeholder");
      if (!placeholderKey) continue;
      placeholderElement.setAttribute(
        "placeholder",
        get(placeholderKey, placeholderElement.getAttribute("placeholder"))
      );
    }

    var ariaElements = document.querySelectorAll("[data-locale-aria-label]");
    for (index = 0; index < ariaElements.length; index++) {
      var ariaElement = ariaElements[index];
      var ariaKey = ariaElement.getAttribute("data-locale-aria-label");
      if (!ariaKey) continue;
      ariaElement.setAttribute("aria-label", get(ariaKey, ariaElement.getAttribute("aria-label")));
    }

    var emptyLabelElements = document.querySelectorAll("[data-locale-empty-label]");
    for (index = 0; index < emptyLabelElements.length; index++) {
      var emptyLabelElement = emptyLabelElements[index];
      var emptyLabelKey = emptyLabelElement.getAttribute("data-locale-empty-label");
      if (!emptyLabelKey) continue;
      emptyLabelElement.setAttribute(
        "data-empty-label",
        get(emptyLabelKey, emptyLabelElement.getAttribute("data-empty-label"))
      );
    }
  }

  function applyAll(map, notifySettings) {
    strings = map || {};
    applyDom();
    document.documentElement.classList.add("locale-ready");
    if (notifySettings !== false && window.WebSettings && window.WebSettings.onLocaleUpdated) {
      window.WebSettings.onLocaleUpdated();
    }
    window.dispatchEvent(new CustomEvent("web-locale-applied"));
  }

  function flushPendingLocale() {
    if (!window.__webPendingLocale) return;
    applyAll(window.__webPendingLocale);
    window.__webPendingLocale = null;
  }

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

  window.WebLocale = {
    get: get,
    getStrings: getStrings,
    resolveLocaleKey: resolveLocaleKey,
    applyAll: applyAll,
    applyDom: applyDom
  };

  flushPendingLocale();
})();
