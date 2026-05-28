(function () {
  var LOCALIZATION_BASE = "../Localization/";
  var LANGUAGES_MANIFEST_PATH = "../Localization/languages.json";
  var DEFAULT_LANGUAGE_CODE = "english";
  var SETTINGS_STORAGE_KEY = "web-settings-preview";
  var LANGUAGE_SETTINGS_KEY = "language";
  var FALLBACK_LANGUAGE_CODES = [
    "arabic",
    "bulgarian",
    "czech",
    "danish",
    "dutch",
    "english",
    "finnish",
    "french",
    "german",
    "greek",
    "hungarian",
    "indonesian",
    "italian",
    "japanese",
    "korean",
    "norwegian",
    "polish",
    "portuguese-brazil",
    "portuguese-portugal",
    "romanian",
    "russian",
    "simplified-chinese",
    "spanish-latin-america",
    "spanish-spain",
    "swedish",
    "thai",
    "traditional-chinese",
    "turkish",
    "ukrainian",
    "vietnamese"
  ];

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function canFetchLocales() {
    var protocol = window.location.protocol;
    return protocol === "http:" || protocol === "https:";
  }

  function warnIfFileProtocol() {
    if (canFetchLocales()) return;
    if (window.__cmLocaleFileProtocolWarningShown) return;
    window.__cmLocaleFileProtocolWarningShown = true;
    console.warn(
      "[WebLocale] Localization JSON requires http:// or https://. Run serve-local.ps1 and open the menu from localhost."
    );
  }

  function getStoredLanguageCode() {
    try {
      var raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return "";
      var parsed = JSON.parse(raw);
      if (parsed && parsed[LANGUAGE_SETTINGS_KEY]) return parsed[LANGUAGE_SETTINGS_KEY];
    } catch (error) {
      return "";
    }
    return "";
  }

  function fetchJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) {
        throw new Error("locale fetch failed");
      }
      return response.json();
    });
  }

  function fetchLanguageJson(languageCode) {
    return fetchJson(LOCALIZATION_BASE + languageCode + ".json");
  }

  function applyLocaleMap(map, notifySettings) {
    if (window.WebLocale) {
      window.WebLocale.applyAll(map, notifySettings !== false);
      return;
    }
    window.__webPendingLocale = map;
  }

  function applyLanguageOptions(options) {
    if (!options || !options.length) return;
    window.__cmLanguageOptions = options;
    if (window.WebSettings && window.WebSettings.setLanguageOptions) {
      window.WebSettings.setLanguageOptions(options);
    }
  }

  function loadLanguage(languageCode, notifySettings) {
    if (!canFetchLocales()) {
      warnIfFileProtocol();
      return Promise.resolve();
    }

    var code = languageCode || DEFAULT_LANGUAGE_CODE;

    return fetchLanguageJson(code)
      .catch(function () {
        if (code === DEFAULT_LANGUAGE_CODE) {
          throw new Error("default locale missing");
        }
        return fetchLanguageJson(DEFAULT_LANGUAGE_CODE);
      })
      .then(function (map) {
        applyLocaleMap(map, notifySettings);
        window.dispatchEvent(
          new CustomEvent("web-locale-loaded", { detail: { languageCode: code } })
        );
      })
      .catch(function () {
        applyLocaleMap({}, notifySettings);
      });
  }

  function getLanguagesManifest() {
    return fetchJson(LANGUAGES_MANIFEST_PATH).catch(function () {
      return { languages: FALLBACK_LANGUAGE_CODES.slice() };
    });
  }

  function getLanguageLabel(languageCode) {
    return fetchLanguageJson(languageCode)
      .then(function (map) {
        var label = languageCode;
        if (map && map["language-name"]) label = map["language-name"];
        return { code: languageCode, label: label };
      })
      .catch(function () {
        return { code: languageCode, label: languageCode };
      });
  }

  function buildLanguageOptionsFromCodes(codes) {
    var pendingRequests = [];
    var index;

    for (index = 0; index < codes.length; index++) {
      pendingRequests.push(getLanguageLabel(codes[index]));
    }

    return Promise.all(pendingRequests).then(function (entries) {
      entries.sort(function (left, right) {
        if (left.code === DEFAULT_LANGUAGE_CODE) return -1;
        if (right.code === DEFAULT_LANGUAGE_CODE) return 1;
        return left.label.localeCompare(right.label);
      });
      applyLanguageOptions(entries);
      return entries;
    });
  }

  function loadLanguageOptions() {
    if (!canFetchLocales()) {
      warnIfFileProtocol();
      return Promise.resolve([]);
    }

    return getLanguagesManifest()
      .then(function (manifest) {
        var codes = manifest && manifest.languages ? manifest.languages : FALLBACK_LANGUAGE_CODES;
        if (!codes.length) codes = FALLBACK_LANGUAGE_CODES;
        return buildLanguageOptionsFromCodes(codes);
      })
      .catch(function () {
        return buildLanguageOptionsFromCodes(FALLBACK_LANGUAGE_CODES);
      });
  }

  function flushPendingLanguageOptions() {
    if (!window.__cmLanguageOptions || !window.__cmLanguageOptions.length) {
      return loadLanguageOptions();
    }
    applyLanguageOptions(window.__cmLanguageOptions);
    return Promise.resolve(window.__cmLanguageOptions);
  }

  function initStandaloneLocale() {
    if (isUnityHost()) return;
    // Web mode should lazy-load locale JSON. We only fetch languages + strings when Settings is opened.
    // Until then, the menu uses built-in text content (English) already present in the DOM.
  }

  window.WebLocaleLoader = {
    isUnityHost: isUnityHost,
    canFetchLocales: canFetchLocales,
    loadLanguage: loadLanguage,
    loadLanguageOptions: loadLanguageOptions,
    flushPendingLanguageOptions: flushPendingLanguageOptions
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStandaloneLocale);
  } else {
    initStandaloneLocale();
  }

  var standaloneLocaleLoaded = false;
  function ensureStandaloneLocaleLoaded() {
    if (standaloneLocaleLoaded) return;
    standaloneLocaleLoaded = true;

    if (isUnityHost()) return;
    if (!canFetchLocales()) {
      warnIfFileProtocol();
      return;
    }

    var languageCode = getStoredLanguageCode() || DEFAULT_LANGUAGE_CODE;
    loadLanguage(languageCode, true);
    loadLanguageOptions();
  }

  window.addEventListener("web-settings-open", function () {
    ensureStandaloneLocaleLoaded();
  });

  window.addEventListener("web-settings-language-changed", function (event) {
    if (isUnityHost()) return;
    var detail = event.detail;
    if (!detail || !detail.languageCode) return;
    loadLanguage(detail.languageCode, true);
  });
})();
