(function () {
  var STORAGE_KEY = "web-settings-preview";
  var WEB_PREVIEW_HELP_SAMPLE_KEY = "settings.web.help.preview-sample";
  var DEFAULT_LANGUAGE_CODE = "english";
  var SETTINGS_SUCCESS_TOAST_MS = 2200;
  var SETTINGS_SUCCESS_TOAST_GAP_PX = 12;
  var SETTINGS_SUCCESS_TOAST_VIEWPORT_PADDING_PX = 12;
  var LOCALE_KEY_RESET_DEFAULTS_DONE = "settings.web.reset-defaults-done";
  var LOCALE_KEY_RESET_LAYOUTS_DONE = "settings.web.reset-window-layouts-done";
  var LOCAL_ONLY_SETTING_KEYS = {
    desktopIconScalePercent: true
  };

  function isGameMode() {
    if (window.WebMenuMode === "game") return true;
    var device = document.getElementById("device");
    return !!device && device.classList.contains("menu-mode--game");
  }

  var INPUT_MODE_OPTIONS = [
    { value: "0", labelKey: "settings.input-mode-hybrid" },
    { value: "1", labelKey: "settings.input-mode-hold" },
    { value: "2", labelKey: "settings.input-mode-toggle" }
  ];

  var YES_NO_OPTIONS = [
    { value: "true", labelKey: "yes" },
    { value: "false", labelKey: "no" }
  ];

  var INVENTORY_SCROLL_OPTIONS = [
    { value: "true", labelKey: "settings.inventory-scroll-clamp" },
    { value: "false", labelKey: "settings.inventory-scroll-loop" }
  ];

  var ENTITY_DISTANCE_OPTIONS = [
    2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000
  ];

  var AA_OPTIONS = [
    { value: "settings.graphics.aa-none", labelKey: "settings.graphics.aa-none" },
    { value: "settings.graphics.aa-fxaa", labelKey: "settings.graphics.aa-fxaa" },
    { value: "settings.graphics.aa-smaa", labelKey: "settings.graphics.aa-smaa" },
    { value: "settings.graphics.aa-taa", labelKey: "settings.graphics.aa-taa" }
  ];

  var TABS = [
    { id: "interface", labelKey: "settings.title.interface" },
    { id: "gameplay", labelKey: "settings.title.gameplay" },
    { id: "audio", labelKey: "settings.title.audio" },
    { id: "graphics", labelKey: "settings.title.graphics" },
    { id: "controls", labelKey: "settings.title.controls" }
  ];

  var DEFAULT_STATE = {
    autoSelectPickup: true,
    inventoryScrollClamp: false,
    optimisticTerrainOps: true,
    thirdPersonView: false,
    thirdPersonViewInSeat: false,
    sprintInputMode: 0,
    crouchInputMode: 0,
    screenShakeIntensityPercent: 100,
    entityDistance: 2000,
    lookSensitivityPercent: 100,
    language: "english",
    useCustomCursor: true,
    terminalAnimationsEnabled: true,
    menuBackgroundAnimationEnabled: true,
    menuMusicEnabled: true,
    masterVolume: 0.5,
    musicVolume: 1,
    arcadeGamesVolume: 1,
    vehicleVolume: 1,
    weatherVolume: 1,
    weaponVolume: 1,
    interfaceVolume: 1,
    objectsVolume: 1,
    entityVolume: 1,
    ambientVolume: 1,
    graphicsDecals: true,
    graphicsBloom: true,
    graphicsColorGrading: true,
    graphicsShadows: true,
    graphicsAmbientOcclusion: true,
    graphicsFog: true,
    graphicsVolumetricFog: true,
    graphicsTerrainDetails: true,
    graphicsTerrainGrass: true,
    graphicsAntialiasingKey: "settings.graphics.aa-taa",
    graphicsLodBiasPercent: 100,
    graphicsFieldOfView: 60,
    graphicsFpsCapFps: 60,
    graphicsWebPixelDensityPercent: 100,
    desktopIconScalePercent: 100,
    showFpsCounter: false,
    languageOptions: []
  };

  var state = copyState(DEFAULT_STATE);
  var activeTabId = "interface";
  var settingsHostStateReady = false;
  var contentRoot;
  var tabsRoot;
  var settingsResetFooterElement;
  var successToastEl;
  var successToastTimer = 0;

  function copyState(source) {
    var target = {};
    var key;
    for (key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
      target[key] = source[key];
    }
    return target;
  }

  function getLocalized(key, fallback) {
    if (window.WebLocale && window.WebLocale.resolveLocaleKey) {
      key = window.WebLocale.resolveLocaleKey(key);
    }
    if (window.WebLocale) {
      return window.WebLocale.get(key, fallback);
    }
    if (fallback != null) return fallback;
    return key || "";
  }

  function getSettingsContentWindowElement() {
    return document.querySelector(".settings-content-window[data-wm-preset=\"settings-content\"]");
  }

  function isSettingsWindowVisible() {
    var windowElement = getSettingsContentWindowElement();
    return !!windowElement && !windowElement.classList.contains("os-window--closed");
  }

  function ensureSettingsScrollBound() {
    if (!contentRoot) return;
    if (contentRoot.getAttribute("data-settings-scroll-bound")) return;
    contentRoot.setAttribute("data-settings-scroll-bound", "1");
    contentRoot.addEventListener("scroll", onSettingsContentScroll, true);
  }

  function ensureSettingsUiRoots() {
    if (contentRoot && tabsRoot) return true;
    var windowElement = getSettingsContentWindowElement();
    if (!windowElement) return false;
    contentRoot = windowElement.querySelector(".settings-scroll");
    tabsRoot = windowElement.querySelector(".settings-tabs");
    if (!contentRoot || !tabsRoot) return false;
    ensureSettingsScrollBound();
    return true;
  }

  function cancelSliderLayoutWork() {
    if (sliderLayoutRefreshFrame) {
      window.cancelAnimationFrame(sliderLayoutRefreshFrame);
      sliderLayoutRefreshFrame = 0;
    }
    if (sliderLayoutRefreshTimer) {
      window.clearTimeout(sliderLayoutRefreshTimer);
      sliderLayoutRefreshTimer = 0;
    }
  }

  function releaseSettingsScrollBound() {
    if (!contentRoot) return;
    if (!contentRoot.getAttribute("data-settings-scroll-bound")) return;
    contentRoot.removeEventListener("scroll", onSettingsContentScroll, true);
    contentRoot.removeAttribute("data-settings-scroll-bound");
  }

  function releaseSettingsContent() {
    cancelSliderLayoutWork();
    if (window.WebMenuHelpTooltip) {
      window.WebMenuHelpTooltip.hide();
    }
    settingsResetFooterElement = null;
    releaseSettingsScrollBound();
    if (tabsRoot) {
      tabsRoot.textContent = "";
    }
    if (contentRoot) {
      contentRoot.textContent = "";
      contentRoot.classList.add("is-empty");
    }
  }

  function setSettingsLoadingVisible(visible) {
    if (!contentRoot) return;
    if (visible) {
      contentRoot.classList.add("is-empty");
      updateEmptyLoadingLabel();
      return;
    }
    contentRoot.classList.remove("is-empty");
  }

  function updateEmptyLoadingLabel() {
    if (!contentRoot) return;
    contentRoot.setAttribute(
      "data-empty-label",
      getLocalized("web.settings.loading", "Loading config…")
    );
  }

  function onLocaleUpdated() {
    updateEmptyLoadingLabel();
    renderAll();
    updateNavLabels();
    if (window.WebMenuHelpTooltip) {
      window.WebMenuHelpTooltip.hide();
    }
  }

  function getFieldLabel(field) {
    return getLocalized(field.labelKey, field.label || field.key);
  }

  function isUnityMenuHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function getFieldHelpKey(field) {
    if (field.helpKey) return field.helpKey;
    if (!field.labelKey || field.labelKey.indexOf("settings.") !== 0) return "";
    return "settings.help." + field.labelKey.substring("settings.".length);
  }

  function getFieldHelpText(field) {
    var helpKey = getFieldHelpKey(field);
    if (!helpKey) return "";
    var text = getLocalized(helpKey, "");
    if (text && text !== helpKey) return text;
    if (!isUnityMenuHost()) {
      return getLocalized(
        WEB_PREVIEW_HELP_SAMPLE_KEY,
        "Example help text for web preview. In the game, localized descriptions appear here."
      );
    }
    return "";
  }

  function getOptionLabel(option) {
    if (option.labelKey) return getLocalized(option.labelKey, option.label || option.value);
    return option.label || option.value;
  }

  function getSteppedOptionIndex(options, storedValue) {
    var index = 0;
    for (index = 0; index < options.length; index++) {
      if (options[index].value === storedValue) return index;
    }
    return 0;
  }

  function getSteppedOptionByIndex(options, index) {
    if (index < 0) return options[0];
    if (index >= options.length) return options[options.length - 1];
    return options[index];
  }

  function entityDistanceOptions() {
    var options = [];
    var index;
    for (index = 0; index < ENTITY_DISTANCE_OPTIONS.length; index++) {
      var meters = ENTITY_DISTANCE_OPTIONS[index];
      options.push({ value: String(meters), label: meters + "m" });
    }
    return options;
  }

  function getLanguageOptions() {
    var source = state.languageOptions;
    if ((!source || !source.length) && window.__cmLanguageOptions && window.__cmLanguageOptions.length) {
      source = window.__cmLanguageOptions;
      state.languageOptions = source;
    }
    if (!source || !source.length) {
      if (!isUnityMenuHost() && window.WebLocaleLoader && window.WebLocaleLoader.loadLanguageOptions) {
        window.WebLocaleLoader.loadLanguageOptions();
      }
      return [{ value: state.language || "english", label: state.language || "english" }];
    }
    var options = [];
    var index;
    for (index = 0; index < source.length; index++) {
      var entry = source[index];
      options.push({ value: entry.code, label: entry.label || entry.code });
    }
    return options;
  }

  function getFieldsForTab(tabId) {
    if (tabId === "gameplay") {
      return [
        { type: "slider", key: "screenShakeIntensityPercent", labelKey: "settings.screen-shake", min: 0, max: 100, step: 1, format: percentFormat },
        { type: "toggle", key: "autoSelectPickup", labelKey: "settings.item-auto-select" },
        { type: "choice", key: "inventoryScrollClamp", labelKey: "settings.inventory-scroll", options: INVENTORY_SCROLL_OPTIONS, format: boolChoiceFormat },
        { type: "toggle", key: "optimisticTerrainOps", labelKey: "settings.optimistic-network-terrain-operations" },
        { type: "toggle", key: "thirdPersonView", labelKey: "settings.third-person-view-walking" },
        { type: "toggle", key: "thirdPersonViewInSeat", labelKey: "settings.third-person-view-seat" },
        { type: "choice", key: "sprintInputMode", labelKey: "settings.sprint-mode", options: INPUT_MODE_OPTIONS, format: intChoiceFormat },
        { type: "choice", key: "crouchInputMode", labelKey: "settings.crouch-mode", options: INPUT_MODE_OPTIONS, format: intChoiceFormat },
        { type: "choice", key: "entityDistance", labelKey: "settings.simulation-distance", options: entityDistanceOptions(), format: intChoiceFormat }
      ];
    }

    if (tabId === "audio") {
      return [
        { type: "slider", key: "masterVolume", labelKey: "settings.master-volume", min: 0, max: 100, step: 1, format: volumeFormat, parse: volumeParse },
        { type: "toggle", key: "menuMusicEnabled", labelKey: "settings.menu-music-enabled" },
        { type: "slider", key: "musicVolume", labelKey: "settings.music-volume", min: 0, max: 100, step: 1, format: volumeFormat, parse: volumeParse },
        { type: "slider", key: "arcadeGamesVolume", labelKey: "settings.arcade-games-volume", min: 0, max: 100, step: 1, format: volumeFormat, parse: volumeParse },
        { type: "slider", key: "vehicleVolume", labelKey: "settings.vehicle-volume", min: 0, max: 100, step: 1, format: volumeFormat, parse: volumeParse },
        { type: "slider", key: "weatherVolume", labelKey: "settings.weather-volume", min: 0, max: 100, step: 1, format: volumeFormat, parse: volumeParse },
        { type: "slider", key: "weaponVolume", labelKey: "settings.weapon-volume", min: 0, max: 100, step: 1, format: volumeFormat, parse: volumeParse },
        { type: "slider", key: "interfaceVolume", labelKey: "settings.interface-volume", min: 0, max: 100, step: 1, format: volumeFormat, parse: volumeParse },
        { type: "slider", key: "objectsVolume", labelKey: "settings.object-volume", min: 0, max: 100, step: 1, format: volumeFormat, parse: volumeParse },
        { type: "slider", key: "entityVolume", labelKey: "settings.creature-volume", min: 0, max: 100, step: 1, format: volumeFormat, parse: volumeParse },
        { type: "slider", key: "ambientVolume", labelKey: "settings.ambient-volume", min: 0, max: 100, step: 1, format: volumeFormat, parse: volumeParse }
      ];
    }

    if (tabId === "interface") {
      return [
        { type: "choice", key: "language", labelKey: "settings.language", options: getLanguageOptions, format: stringChoiceFormat },
        { type: "toggle", key: "useCustomCursor", labelKey: "settings.custom-cursor" },
        { type: "toggle", key: "terminalAnimationsEnabled", labelKey: "settings.terminal-animations" },
        { type: "toggle", key: "menuBackgroundAnimationEnabled", labelKey: "settings.menu-background-animation" },
        {
          type: "slider",
          key: "desktopIconScalePercent",
          labelKey: "settings.web.desktop-icon-scale",
          min: 50,
          max: 300,
          step: 5,
          format: percentFormat
        },
        {
          type: "action",
          actionId: "reset-window-layouts",
          labelKey: "settings.web.window-layout",
          buttonLabelKey: "settings.web.reset-window-layouts"
        }
      ];
    }

    if (tabId === "graphics") {
      return [
        {
          type: "slider",
          key: "graphicsLodBiasPercent",
          labelKey: "settings.graphics.lod-bias",
          min: 20,
          max: 200,
          step: 1,
          format: percentFormat,
          wirePost: function (value) {
            return String(value) + "%";
          }
        },
        { type: "slider", key: "graphicsFieldOfView", labelKey: "settings.graphics.field-of-view", min: 20, max: 140, step: 1, format: intFormat },
        { type: "slider", key: "graphicsFpsCapFps", labelKey: "settings.graphics.fps-cap", min: 0, max: 480, step: 1, format: fpsCapFormat },
        {
          type: "slider",
          key: "graphicsWebPixelDensityPercent",
          labelKey: "settings.graphics.web-pixel-density",
          min: 50,
          max: 300,
          step: 5,
          format: percentFormat
        },
        { type: "toggle", key: "showFpsCounter", labelKey: "settings.graphics.fps-counter" },
        { type: "toggle", key: "graphicsDecals", labelKey: "settings.graphics.decals" },
        { type: "toggle", key: "graphicsBloom", labelKey: "settings.graphics.bloom" },
        { type: "toggle", key: "graphicsColorGrading", labelKey: "settings.graphics.color-grading" },
        { type: "choice", key: "graphicsAntialiasingKey", labelKey: "settings.graphics.antialiasing", options: AA_OPTIONS, format: stringChoiceFormat },
        { type: "toggle", key: "graphicsShadows", labelKey: "settings.graphics.shadows" },
        { type: "toggle", key: "graphicsAmbientOcclusion", labelKey: "settings.graphics.ambient-occlusion" },
        { type: "toggle", key: "graphicsFog", labelKey: "settings.graphics.fog" },
        { type: "toggle", key: "graphicsVolumetricFog", labelKey: "settings.graphics.volumetric-fog" },
        { type: "toggle", key: "graphicsTerrainDetails", labelKey: "settings.graphics.terrain-details" },
        { type: "toggle", key: "graphicsTerrainGrass", labelKey: "settings.graphics.terrain-grass" }
      ];
    }

    return [];
  }

  function boolChoiceFormat(value) {
    return value ? "true" : "false";
  }

  function intChoiceFormat(value) {
    return String(value);
  }

  function stringChoiceFormat(value) {
    return value == null ? "" : String(value);
  }

  function percentFormat(value) {
    return String(value) + "%";
  }

  function parseLodBiasPercent(value) {
    var number = typeof value === "number" ? value : parseSliderTypedNumber(value);
    if (number == null) {
      number = 100;
    }
    return clampSliderTypedNumber({ min: 20, max: 200, step: 1 }, number);
  }

  function getSliderPostValue(field, wireValue) {
    if (field.wirePost) {
      return field.wirePost(Number(wireValue));
    }
    if (field.parse) {
      return field.parse(wireValue);
    }
    return wireValue;
  }

  function intFormat(value) {
    return String(value);
  }

  function fpsCapFormat(value) {
    if (value <= 0) return "0";
    return String(value);
  }

  function volumeFormat(value) {
    return Math.round(value * 100) + "%";
  }

  function volumeParse(sliderValue) {
    var percent = Number(sliderValue);
    if (isNaN(percent)) percent = 0;
    return (percent / 100).toFixed(4);
  }

  function volumeSliderValue(value) {
    return Math.round(value * 100);
  }

  function getSliderEndpointLabel(field, isMax) {
    if (field.steppedOptions) {
      var optionIndex = isMax ? field.steppedOptions.length - 1 : 0;
      return field.steppedOptions[optionIndex].label;
    }
    var endpointValue = isMax ? field.max : field.min;
    if (field.parse) {
      return String(endpointValue) + "%";
    }
    if (field.format === fpsCapFormat) {
      return fpsCapFormat(Number(endpointValue));
    }
    if (field.format) {
      return field.format(Number(endpointValue));
    }
    return String(endpointValue);
  }

  function getSliderThumbOffsetPx(slider, ratio) {
    var trackWidth = slider.offsetWidth;
    if (trackWidth <= 0) return -1;
    return ratio * (trackWidth - sliderThumbWidthPx) + sliderThumbWidthPx * 0.5;
  }

  function resolveOptions(field) {
    if (typeof field.options === "function") return field.options();
    return field.options;
  }

  function findOptionIndex(options, wireValue) {
    var index;
    for (index = 0; index < options.length; index++) {
      if (options[index].value === wireValue) return index;
    }
    return 0;
  }

  function getActiveOptionLabel(options, wireValue) {
    var index = findOptionIndex(options, wireValue);
    if (index < 0 || index >= options.length) {
      return wireValue == null ? "" : String(wireValue);
    }
    return getOptionLabel(options[index]);
  }

  function cycleChoice(field, direction) {
    var options = resolveOptions(field);
    var wireValue = field.format(state[field.key]);
    var index = findOptionIndex(options, wireValue);
    index += direction;
    if (index < 0) index = options.length - 1;
    if (index >= options.length) index = 0;
    setFieldValue(field, options[index].value, true);
  }

  function setFieldValue(field, wireValue, refreshChoiceRow) {
    if (field.type === "toggle") {
      state[field.key] = wireValue === true || wireValue === "true";
      postChange(field.key, state[field.key] ? "true" : "false");
      if (field.key === "terminalAnimationsEnabled") {
        applyTerminalAnimations(getTerminalAnimationsEnabled(state.terminalAnimationsEnabled));
      }
      if (refreshChoiceRow) refreshToggleRowUi(field);
      if (field.key === "menuBackgroundAnimationEnabled") {
        applyMenuBackgroundAnimation(state.menuBackgroundAnimationEnabled !== false);
      }
      if (field.key === "menuMusicEnabled") {
        applyMenuMusicEnabled(state.menuMusicEnabled !== false);
      }
      if (field.key === "useCustomCursor") {
        applyCustomCursorMode(state.useCustomCursor);
      }
      return;
    }

    if (field.parse) {
      state[field.key] = parseFloat(field.parse(wireValue));
      postChange(field.key, field.parse(wireValue));
      return;
    }

    if (field.format === boolChoiceFormat) {
      state[field.key] = wireValue === "true";
      postChange(field.key, wireValue);
      if (refreshChoiceRow) {
        refreshChoiceRowUi(field);
      }
      return;
    }

    if (field.format === intChoiceFormat || field.format === intFormat || field.format === percentFormat || field.format === fpsCapFormat) {
      state[field.key] = parseInt(wireValue, 10);
      postChange(field.key, getSliderPostValue(field, wireValue));
      if (refreshChoiceRow) {
        refreshChoiceRowUi(field);
      }
      return;
    }

    state[field.key] = wireValue;
    postChange(field.key, wireValue);
    if (field.key === "language") {
      if (refreshChoiceRow) refreshChoiceRowUi(field);
      notifyLanguageChanged();
      return;
    }
    if (refreshChoiceRow) {
      refreshChoiceRowUi(field);
    }
  }

  function notifyLanguageChanged() {
    window.dispatchEvent(
      new CustomEvent("web-settings-language-changed", { detail: { languageCode: state.language } })
    );
  }

  function applyMenuLanguage(languageCode) {
    var code = languageCode || DEFAULT_LANGUAGE_CODE;
    state.language = code;
    if (isUnityHost()) {
      notifyLanguageChanged();
      return;
    }
    if (window.WebLocaleLoader && window.WebLocaleLoader.loadLanguage) {
      window.WebLocaleLoader.loadLanguage(code, true);
      return;
    }
    notifyLanguageChanged();
  }

  function hideSettingsSuccessToast() {
    if (!successToastEl) {
      successToastEl = document.getElementById("settingsSuccessToast");
    }
    if (!successToastEl) {
      return;
    }
    successToastEl.classList.remove("is-visible");
    successToastEl.classList.remove("is-below-cursor");
    successToastEl.hidden = true;
    successToastEl.style.left = "";
    successToastEl.style.top = "";
    successToastTimer = 0;
  }

  function clampSettingsSuccessToastPosition(anchorX, anchorY) {
    var padding = SETTINGS_SUCCESS_TOAST_VIEWPORT_PADDING_PX;
    var rect = successToastEl.getBoundingClientRect();
    var shiftX = 0;
    var shiftY = 0;

    if (rect.left < padding) {
      shiftX = padding - rect.left;
    } else if (rect.right > window.innerWidth - padding) {
      shiftX = window.innerWidth - padding - rect.right;
    }

    if (rect.top < padding) {
      successToastEl.classList.add("is-below-cursor");
      successToastEl.style.left = anchorX + shiftX + "px";
      successToastEl.style.top = anchorY + "px";
      rect = successToastEl.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - padding) {
        shiftY = window.innerHeight - padding - rect.bottom;
      }
      if (shiftY !== 0) {
        successToastEl.style.top = anchorY + shiftY + "px";
      }
      return;
    }

    if (rect.bottom > window.innerHeight - padding) {
      shiftY = window.innerHeight - padding - rect.bottom;
    }

    if (shiftX !== 0) {
      successToastEl.style.left = anchorX + shiftX + "px";
    }
    if (shiftY !== 0) {
      successToastEl.style.top = anchorY + shiftY + "px";
    }
  }

  function showSettingsSuccessToast(messageKey, fallback, clientX, clientY) {
    if (!successToastEl) {
      successToastEl = document.getElementById("settingsSuccessToast");
    }
    if (!successToastEl) {
      return;
    }
    if (successToastTimer) {
      window.clearTimeout(successToastTimer);
      successToastTimer = 0;
    }
    if (clientX == null || isNaN(clientX)) {
      clientX = window.innerWidth * 0.5;
    }
    if (clientY == null || isNaN(clientY)) {
      clientY = window.innerHeight * 0.5;
    }
    successToastEl.classList.remove("is-below-cursor");
    successToastEl.textContent = getLocalized(messageKey, fallback);
    successToastEl.style.left = clientX + "px";
    successToastEl.style.top = clientY + "px";
    successToastEl.hidden = false;
    successToastEl.classList.add("is-visible");
    clampSettingsSuccessToastPosition(clientX, clientY);
    successToastTimer = window.setTimeout(hideSettingsSuccessToast, SETTINGS_SUCCESS_TOAST_MS);
  }

  function isLocalOnlySettingKey(key) {
    return !!LOCAL_ONLY_SETTING_KEYS[key];
  }

  function postChange(key, value) {
    if (isLocalOnlySettingKey(key)) {
      saveLocalPreview();
      return;
    }
    if (isUnityHost() && window.WebSettingsBridge) {
      window.WebSettingsBridge.set(key, value);
    } else {
      saveLocalPreview();
    }
    if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.isAudioVolumeKey(key)) {
      pushAudioVolumeStateToMenu();
    }
  }

  function saveLocalPreview() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
    }
  }

  function getPreservedLanguageOptions() {
    if (window.__cmLanguageOptions && window.__cmLanguageOptions.length) {
      return window.__cmLanguageOptions;
    }
    if (state.languageOptions && state.languageOptions.length) {
      return state.languageOptions;
    }
    return null;
  }

  function loadLocalOnlySettingsFromStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        state.desktopIconScalePercent = DEFAULT_STATE.desktopIconScalePercent;
        applyDesktopIconScale(state.desktopIconScalePercent);
        return;
      }
      var parsed = JSON.parse(raw);
      if (parsed && Object.prototype.hasOwnProperty.call(parsed, "desktopIconScalePercent")) {
        state.desktopIconScalePercent = parsed.desktopIconScalePercent;
      } else {
        state.desktopIconScalePercent = DEFAULT_STATE.desktopIconScalePercent;
      }
      applyDesktopIconScale(state.desktopIconScalePercent);
    } catch (error) {
      state.desktopIconScalePercent = DEFAULT_STATE.desktopIconScalePercent;
      applyDesktopIconScale(state.desktopIconScalePercent);
    }
  }

  function resetLocalOnlySettings() {
    state.desktopIconScalePercent = DEFAULT_STATE.desktopIconScalePercent;
    applyDesktopIconScale(state.desktopIconScalePercent);
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = {};
      if (raw) {
        parsed = JSON.parse(raw);
      }
      parsed.desktopIconScalePercent = DEFAULT_STATE.desktopIconScalePercent;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (error) {
    }
    if (window.WebMenuLocalStorageBridge && window.WebMenuLocalStorageBridge.flushSave) {
      window.WebMenuLocalStorageBridge.flushSave();
    }
  }

  function loadLocalPreview() {
    var preservedLanguageOptions = getPreservedLanguageOptions();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        state = copyState(DEFAULT_STATE);
      } else {
        state = copyState(DEFAULT_STATE);
        var parsed = JSON.parse(raw);
        var key;
        for (key in parsed) {
          if (Object.prototype.hasOwnProperty.call(parsed, key)) state[key] = parsed[key];
        }
      }
    } catch (error) {
      state = copyState(DEFAULT_STATE);
    }
    if (preservedLanguageOptions && preservedLanguageOptions.length) {
      state.languageOptions = preservedLanguageOptions;
    }
    if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.clearRuntimeVolumes) {
      window.WebMenuAudioVolume.clearRuntimeVolumes();
    }
    settingsHostStateReady = true;
    applyTerminalAnimations(getTerminalAnimationsEnabled(state.terminalAnimationsEnabled));
    applyDesktopIconScale(state.desktopIconScalePercent);
    renderAll();
    pushAudioVolumeStateToMenu();
  }

  function resetLocalPreview() {
    var preservedLanguageOptions = getPreservedLanguageOptions();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
    }
    state = copyState(DEFAULT_STATE);
    if (preservedLanguageOptions && preservedLanguageOptions.length) {
      state.languageOptions = preservedLanguageOptions;
    }
    if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.clearRuntimeVolumes) {
      window.WebMenuAudioVolume.clearRuntimeVolumes();
    }
    applyMenuLanguage(DEFAULT_LANGUAGE_CODE);
    applyTerminalAnimations(getTerminalAnimationsEnabled(state.terminalAnimationsEnabled));
    applyMenuBackgroundAnimation(state.menuBackgroundAnimationEnabled !== false);
    applyMenuMusicEnabled(state.menuMusicEnabled !== false);
    applyDesktopIconScale(state.desktopIconScalePercent);
    renderAll();
    pushAudioVolumeStateToMenu();
  }

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function pushAudioVolumeStateToMenu() {
    if (!window.WebMenuAudioVolume) return;
    if (window.WebMenuAudioVolume.setVolumesFromSettingsState) {
      window.WebMenuAudioVolume.setVolumesFromSettingsState(state);
    }
    syncWebAudioVolumes();
  }

  function syncWebAudioVolumes() {
    if (!window.WebMenuAudioVolume) return;
    window.WebMenuAudioVolume.notifyAudioVolumeChanged();
  }

  function onAudioVolumeSliderInput(field) {
    if (!window.WebMenuAudioVolume || !window.WebMenuAudioVolume.isAudioVolumeKey(field.key)) return;
    if (!isUnityHost()) {
      saveLocalPreview();
    }
    pushAudioVolumeStateToMenu();
  }

  function applyLocalChange(key, value) {
    var fields = [];
    var tabIndex;
    for (tabIndex = 0; tabIndex < TABS.length; tabIndex++) {
      var tabFields = getFieldsForTab(TABS[tabIndex].id);
      var fieldIndex;
      for (fieldIndex = 0; fieldIndex < tabFields.length; fieldIndex++) fields.push(tabFields[fieldIndex]);
    }

    var changedField = null;
    var index;
    for (index = 0; index < fields.length; index++) {
      if (fields[index].key !== key) continue;
      changedField = fields[index];
      setFieldValueLocal(changedField, value);
      break;
    }
    saveLocalPreview();
    if (key === "terminalAnimationsEnabled") {
      applyTerminalAnimations(getTerminalAnimationsEnabled(state.terminalAnimationsEnabled));
    }
    if (key === "menuBackgroundAnimationEnabled") {
      applyMenuBackgroundAnimation(state.menuBackgroundAnimationEnabled !== false);
    }
    if (key === "menuMusicEnabled") {
      applyMenuMusicEnabled(state.menuMusicEnabled !== false);
    }
    if (key === "useCustomCursor") {
      applyCustomCursorMode(state.useCustomCursor);
    }
    if (key === "desktopIconScalePercent") {
      applyDesktopIconScale(state.desktopIconScalePercent);
    }
    if (key === "language") {
      notifyLanguageChanged();
    }
    if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.isAudioVolumeKey(key)) {
      pushAudioVolumeStateToMenu();
    }

    if (changedField && changedField.type === "toggle") {
      refreshToggleRowUi(changedField);
      updateNavLabels();
      return;
    }

    if (changedField && changedField.type === "choice") {
      refreshChoiceRowUi(changedField);
      updateNavLabels();
      return;
    }

    renderAll();
  }

  function setLanguageOptions(options) {
    if (!options || !options.length) return;
    window.__cmLanguageOptions = options;
    state.languageOptions = options;
    renderAll();
  }

  function setFieldValueLocal(field, wireValue) {
    if (field.parse) {
      state[field.key] = parseFloat(wireValue);
      return;
    }
    if (field.type === "toggle" || field.format === boolChoiceFormat) {
      state[field.key] = wireValue === "true";
      return;
    }
    if (field.steppedOptions) {
      state[field.key] = wireValue;
      return;
    }
    if (field.format === intChoiceFormat) {
      state[field.key] = parseInt(wireValue, 10);
      return;
    }
    state[field.key] = wireValue;
  }

  function refreshChoiceRowUi(field) {
    if (!contentRoot) return;
    var row = contentRoot.querySelector('.settings-row--choice[data-setting-key="' + field.key + '"]');
    if (!row) return;

    var options = resolveOptions(field);
    var wireValue = field.format(state[field.key]);

    var optionButtons = row.querySelectorAll(".settings-option-btn");
    var optionIndex;
    var activeButton = null;
    for (optionIndex = 0; optionIndex < optionButtons.length; optionIndex++) {
      if (optionIndex >= options.length) break;
      if (options[optionIndex].value === wireValue) {
        optionButtons[optionIndex].classList.add("is-active");
        activeButton = optionButtons[optionIndex];
      } else {
        optionButtons[optionIndex].classList.remove("is-active");
      }
    }

  }

  function onSettingsResetClicked(event) {
    if (window.WebSettingsBridge) {
      resetLocalOnlySettings();
      window.WebSettingsBridge.reset();
      showSettingsSuccessToast(
        LOCALE_KEY_RESET_DEFAULTS_DONE,
        "Defaults restored.",
        event.clientX,
        event.clientY
      );
      return;
    }
    resetLocalPreview();
    showSettingsSuccessToast(
      LOCALE_KEY_RESET_DEFAULTS_DONE,
      "Defaults restored.",
      event.clientX,
      event.clientY
    );
  }

  function appendSettingsResetFooter() {
    if (!contentRoot) return;
    if (settingsResetFooterElement && contentRoot.contains(settingsResetFooterElement)) {
      return;
    }
    var existingFooter = contentRoot.querySelector(".settings-tab-reset-footer");
    if (existingFooter) {
      settingsResetFooterElement = existingFooter;
      return;
    }
    var footer = document.createElement("div");
    footer.className = "settings-tab-reset-footer";
    var resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "term-row settings-tab-reset-btn";
    resetButton.id = "btnSettingsReset";

    var prefix = document.createElement("span");
    prefix.className = "term-row-prefix terminal-text--dim";
    prefix.textContent = "[!]";

    var label = document.createElement("span");
    label.className = "term-row-label terminal-text";
    label.textContent = getLocalized("settings.web.reset-defaults", "Reset defaults");

    resetButton.appendChild(prefix);
    resetButton.appendChild(label);
    resetButton.addEventListener("click", onSettingsResetClicked);
    footer.appendChild(resetButton);
    contentRoot.appendChild(footer);
    settingsResetFooterElement = footer;
  }

  function updateSettingsTabButtonsInPlace(existingTabs) {
    var index;
    for (index = 0; index < TABS.length; index++) {
      var tab = TABS[index];
      var button = existingTabs[index];
      var label = button.querySelector(".term-row-label");
      if (label) {
        label.textContent = getLocalized(tab.labelKey, tab.label || tab.id);
      }
      if (tab.id === activeTabId) {
        button.classList.add("is-active");
      } else {
        button.classList.remove("is-active");
      }
    }
  }

  function renderTabs() {
    if (!tabsRoot) return;
    var index;
    var existingTabs = tabsRoot.querySelectorAll(".settings-tab");
    if (existingTabs.length === TABS.length) {
      var canUpdateInPlace = true;
      for (index = 0; index < TABS.length; index++) {
        if (existingTabs[index].getAttribute("data-tab-id") !== TABS[index].id) {
          canUpdateInPlace = false;
          break;
        }
      }
      if (canUpdateInPlace) {
        updateSettingsTabButtonsInPlace(existingTabs);
        return;
      }
    }
    tabsRoot.textContent = "";
    tabsRoot.className = "settings-tabs settings-tabs--toolbar";
    for (index = 0; index < TABS.length; index++) {
      var tab = TABS[index];
      var button = document.createElement("button");
      button.type = "button";
      button.className = "term-row settings-tab";
      if (tab.id === activeTabId) button.className += " is-active";

      var label = document.createElement("span");
      label.className = "term-row-label terminal-text";
      label.textContent = getLocalized(tab.labelKey, tab.label || tab.id);

      button.appendChild(label);
      button.setAttribute("data-tab-id", tab.id);
      button.addEventListener("click", onTabClicked);
      tabsRoot.appendChild(button);
    }
  }

  function playSettingsContentBodyOpen() {
    var contentWindow = document.querySelector(".settings-content-window[data-wm-preset=\"settings-content\"]");
    if (!contentWindow || !window.WebWindowManager) return;
    if (!window.WebWindowManager.playWindowBodyOpen) return;
    window.WebWindowManager.playWindowBodyOpen(contentWindow);
  }

  function onTabClicked(event) {
    var tabId = event.currentTarget.getAttribute("data-tab-id");
    if (!tabId) return;
    if (tabId === activeTabId) {
      playSettingsContentBodyOpen();
      return;
    }
    activeTabId = tabId;
    renderAll();
    if (tabId === "controls" && window.WebSettingsControls) {
      window.WebSettingsControls.openControlsTab();
    }
    playSettingsContentBodyOpen();
    window.dispatchEvent(
      new CustomEvent("web-settings-tab-changed", { detail: { tabId: tabId } })
    );
  }

  function setActiveTab(tabId) {
    if (!tabId) return false;
    var index;
    var found = false;
    for (index = 0; index < TABS.length; index++) {
      if (TABS[index].id === tabId) {
        found = true;
        break;
      }
    }
    if (!found) return false;
    if (tabId === activeTabId) return true;
    activeTabId = tabId;
    renderAll();
    if (tabId === "controls" && window.WebSettingsControls) {
      window.WebSettingsControls.openControlsTab();
    }
    window.dispatchEvent(
      new CustomEvent("web-settings-tab-changed", { detail: { tabId: tabId } })
    );
    return true;
  }

  function renderControlsOnly() {
    if (!contentRoot || activeTabId !== "controls") return;
    if (window.WebMenuHelpTooltip) {
      window.WebMenuHelpTooltip.hide();
    }
    if (window.WebSettingsControls) {
      window.WebSettingsControls.renderControlsInto(contentRoot);
    }
    appendSettingsResetFooter();
  }

  function updateActiveSettingsTabs() {
    if (!tabsRoot) return;
    var existingTabs = tabsRoot.querySelectorAll(".settings-tab");
    if (existingTabs.length === TABS.length) {
      updateSettingsTabButtonsInPlace(existingTabs);
      return;
    }
    renderTabs();
  }

  function renderFields() {
    if (!contentRoot) return;
    if (window.WebMenuHelpTooltip) {
      window.WebMenuHelpTooltip.hide();
    }
    cancelSliderLayoutWork();
    settingsResetFooterElement = null;
    contentRoot.textContent = "";
    contentRoot.classList.remove("is-empty");

    if (activeTabId === "controls") {
      renderControlsOnly();
      return;
    }

    var fields = getFieldsForTab(activeTabId);
    var index;
    for (index = 0; index < fields.length; index += 1) {
      var field = fields[index];
      if (field.type === "toggle") {
        contentRoot.appendChild(buildToggleRow(field));
      } else if (field.type === "choice") {
        contentRoot.appendChild(buildChoiceRow(field));
      } else if (field.type === "slider") {
        contentRoot.appendChild(buildSliderRow(field));
      } else if (field.type === "action") {
        contentRoot.appendChild(buildActionRow(field));
      }
    }

    if (!fields.length) {
      contentRoot.classList.add("is-empty");
    }
    appendSettingsResetFooter();
    refreshAllSliderValuePositions();
    scheduleSliderValueLayoutRefresh();
  }

  function appendFieldLabel(labelBox, field) {
    var labelSpan = document.createElement("span");
    labelSpan.className = "settings-label";

    var textSpan = document.createElement("span");
    textSpan.className = "settings-label-text term-row-label terminal-text";
    textSpan.textContent = getFieldLabel(field);
    labelSpan.appendChild(textSpan);

    var helpText = getFieldHelpText(field);
    if (helpText) {
      var helpButton = document.createElement("button");
      helpButton.type = "button";
      helpButton.className = "settings-help-btn";
      helpButton.textContent = "?";
      helpButton.setAttribute("aria-label", getLocalized("settings.web.help.title", "Help"));
      if (window.WebMenuHelpTooltip) {
        window.WebMenuHelpTooltip.bindHelpButton(
          helpButton,
          helpText,
          getLocalized("settings.web.help.title", "Help")
        );
      }
      labelSpan.appendChild(helpButton);
    }

    labelBox.appendChild(labelSpan);
  }

  function refreshToggleRowUi(field) {
    if (!contentRoot) return;
    var row = contentRoot.querySelector('.settings-row--toggle[data-setting-key="' + field.key + '"]');
    if (!row) return;
    var switchButton = row.querySelector(".settings-switch");
    if (!switchButton) return;
    var isOn = state[field.key] === true;
    switchButton.classList.toggle("is-on", isOn);
    switchButton.setAttribute("aria-checked", isOn ? "true" : "false");
  }

  function onSettingsAction(actionId, event) {
    if (actionId === "reset-window-layouts") {
      if (window.WebWindowManager && window.WebWindowManager.resetAllLayouts) {
        window.WebWindowManager.resetAllLayouts();
      }
      showSettingsSuccessToast(
        LOCALE_KEY_RESET_LAYOUTS_DONE,
        "Window positions reset.",
        event.clientX,
        event.clientY
      );
    }
  }

  function buildActionRow(field) {
    var row = document.createElement("div");
    row.className = "settings-row settings-row--action";
    row.setAttribute("data-setting-action", field.actionId);

    var line = document.createElement("div");
    line.className = "settings-field-line";

    var labelBox = document.createElement("div");
    labelBox.className = "settings-field-label-box";
    appendFieldLabel(labelBox, field);

    var controlBox = document.createElement("div");
    controlBox.className = "settings-field-control-box settings-field-control-box--action";

    var actionButton = document.createElement("button");
    actionButton.type = "button";
    actionButton.className = "term-row settings-action-btn";
    var buttonLabelKey = field.buttonLabelKey || field.labelKey;
    if (field.actionId === "reset-window-layouts") {
      var actionPrefix = document.createElement("span");
      actionPrefix.className = "term-row-prefix terminal-text--dim";
      actionPrefix.textContent = "[!]";
      actionButton.appendChild(actionPrefix);
    }
    var buttonLabel = document.createElement("span");
    buttonLabel.className = "term-row-label terminal-text";
    buttonLabel.setAttribute("data-locale-key", buttonLabelKey);
    buttonLabel.textContent = getLocalized(buttonLabelKey, buttonLabelKey);
    actionButton.appendChild(buttonLabel);
    actionButton.addEventListener("click", function (event) {
      onSettingsAction(field.actionId, event);
    });

    controlBox.appendChild(actionButton);
    line.appendChild(labelBox);
    line.appendChild(controlBox);
    row.appendChild(line);
    return row;
  }

  function buildToggleRow(field) {
    var row = document.createElement("div");
    row.className = "settings-row settings-row--toggle";
    row.setAttribute("data-setting-key", field.key);

    var line = document.createElement("div");
    line.className = "settings-field-line";

    var labelBox = document.createElement("div");
    labelBox.className = "settings-field-label-box";
    appendFieldLabel(labelBox, field);

    var controlBox = document.createElement("div");
    controlBox.className = "settings-field-control-box settings-field-control-box--toggle";

    var isOn = state[field.key] === true;
    var switchButton = document.createElement("button");
    switchButton.type = "button";
    switchButton.className = "settings-switch";
    if (isOn) switchButton.className += " is-on";
    switchButton.setAttribute("role", "switch");
    switchButton.setAttribute("aria-checked", isOn ? "true" : "false");

    var track = document.createElement("span");
    track.className = "settings-switch-track";
    track.setAttribute("aria-hidden", "true");
    var thumb = document.createElement("span");
    thumb.className = "settings-switch-thumb";
    track.appendChild(thumb);
    switchButton.appendChild(track);

    switchButton.addEventListener("click", function () {
      setFieldValue(field, !state[field.key], true);
    });

    controlBox.appendChild(switchButton);
    line.appendChild(labelBox);
    line.appendChild(controlBox);
    row.appendChild(line);
    return row;
  }

  function onSettingsContentScroll() {
    if (window.WebMenuHelpTooltip) {
      window.WebMenuHelpTooltip.hide();
    }
  }

  function buildStepButton(glyph, ariaLabel, className, onClick) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", ariaLabel);

    var text = document.createElement("span");
    text.className = "settings-step-label";
    text.textContent = glyph;
    button.appendChild(text);
    button.addEventListener("click", onClick);
    return button;
  }

  function buildChoiceRow(field) {
    var row = document.createElement("div");
    row.className = "settings-row settings-row--choice";
    row.setAttribute("data-setting-key", field.key);

    var options = resolveOptions(field);
    var wireValue = field.format(state[field.key]);

    var line = document.createElement("div");
    line.className = "settings-field-line";

    var labelBox = document.createElement("div");
    labelBox.className = "settings-field-label-box";

    appendFieldLabel(labelBox, field);

    var controlBox = document.createElement("div");
    controlBox.className = "settings-field-control-box settings-field-control-box--choice";

    var picker = document.createElement("div");
    picker.className = "settings-choice-picker";

    var prevButton = buildStepButton(
      "<",
      getLocalized("settings.web.step.previous", "Previous"),
      "settings-step settings-step--prev",
      function () {
        cycleChoice(field, -1);
      }
    );

    var optionsStrip = document.createElement("div");
    optionsStrip.className = "settings-choice-options";

    var optionIndex;
    for (optionIndex = 0; optionIndex < options.length; optionIndex++) {
      var option = options[optionIndex];
      var optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "settings-option-btn";
      if (option.value === wireValue) optionButton.className += " is-active";
      optionButton.textContent = getOptionLabel(option);
      optionButton.setAttribute("data-option-value", option.value);
      optionButton.addEventListener("click", function (event) {
        setFieldValue(field, event.currentTarget.getAttribute("data-option-value"), true);
      });
      optionsStrip.appendChild(optionButton);
    }

    var nextButton = buildStepButton(
      ">",
      getLocalized("settings.web.step.next", "Next"),
      "settings-step settings-step--next",
      function () {
        cycleChoice(field, 1);
      }
    );

    picker.appendChild(prevButton);
    picker.appendChild(optionsStrip);
    picker.appendChild(nextButton);
    controlBox.appendChild(picker);
    line.appendChild(labelBox);
    line.appendChild(controlBox);
    row.appendChild(line);
    return row;
  }

  var sliderThumbWidthPx = 12;
  var sliderThumbHeightPx = 18;
  var sliderResizeTimer = 0;
  var sliderLayoutRefreshFrame = 0;
  var sliderLayoutRefreshTimer = 0;
  var sliderLayoutObserver = null;

  function getSliderThumbRatio(slider) {
    var min = Number(slider.min);
    var max = Number(slider.max);
    var value = Number(slider.value);
    if (max <= min) return 0;
    var ratio = (value - min) / (max - min);
    if (ratio < 0) return 0;
    if (ratio > 1) return 1;
    return ratio;
  }

  function updateSliderFillVisual(slider) {
    if (!slider) return;
    var track = slider.parentElement;
    if (!track || !track.classList.contains("settings-slider-track")) return;
    track.style.setProperty("--settings-slider-fill", String(getSliderThumbRatio(slider)));
  }

  function updateSliderTrackLayout(slider, valueSpan, minSpan, maxSpan) {
    if (!slider) return;
    var trackWidth = slider.offsetWidth;
    if (trackWidth <= 0) {
      scheduleSliderValueLayoutRefresh();
      return;
    }
    updateSliderFillVisual(slider);
    var minOffsetPx = getSliderThumbOffsetPx(slider, 0);
    var maxOffsetPx = getSliderThumbOffsetPx(slider, 1);
    if (minSpan && minOffsetPx >= 0) {
      minSpan.style.left = minOffsetPx + "px";
    }
    if (maxSpan && maxOffsetPx >= 0) {
      maxSpan.style.left = maxOffsetPx + "px";
    }
    if (!valueSpan) return;
    var ratio = getSliderThumbRatio(slider);
    var valueOffsetPx = getSliderThumbOffsetPx(slider, ratio);
    if (valueOffsetPx >= 0) {
      valueSpan.style.left = valueOffsetPx + "px";
    }
  }

  function onSliderLayoutRefreshPass() {
    sliderLayoutRefreshFrame = 0;
    refreshAllSliderValuePositions();
  }

  function onSliderLayoutRefreshFrame() {
    sliderLayoutRefreshFrame = window.requestAnimationFrame(onSliderLayoutRefreshPass);
  }

  function onSliderLayoutDelayedRefresh() {
    sliderLayoutRefreshTimer = 0;
    refreshAllSliderValuePositions();
  }

  function scheduleSliderValueLayoutRefresh() {
    if (sliderLayoutRefreshFrame) {
      window.cancelAnimationFrame(sliderLayoutRefreshFrame);
    }
    sliderLayoutRefreshFrame = window.requestAnimationFrame(onSliderLayoutRefreshFrame);

    if (sliderLayoutRefreshTimer) {
      window.clearTimeout(sliderLayoutRefreshTimer);
    }
    sliderLayoutRefreshTimer = window.setTimeout(onSliderLayoutDelayedRefresh, 750);
  }

  function onSettingsContentResize() {
    scheduleSliderValueLayoutRefresh();
  }

  function ensureSliderLayoutObserver() {
    if (!contentRoot || sliderLayoutObserver) return;
    if (typeof ResizeObserver === "undefined") return;
    sliderLayoutObserver = new ResizeObserver(onSettingsContentResize);
    sliderLayoutObserver.observe(contentRoot);
  }

  function onWorkspaceLayoutSettled(event) {
    var workspaceElement = event.detail && event.detail.workspaceElement;
    if (!workspaceElement || !workspaceElement.classList) return;
    if (!workspaceElement.classList.contains("os-workspace--settings")) return;
    if (sliderLayoutRefreshFrame) {
      window.cancelAnimationFrame(sliderLayoutRefreshFrame);
      sliderLayoutRefreshFrame = 0;
    }
    sliderLayoutRefreshFrame = window.requestAnimationFrame(function () {
      sliderLayoutRefreshFrame = window.requestAnimationFrame(function () {
        sliderLayoutRefreshFrame = 0;
        refreshAllSliderValuePositions();
      });
    });
  }

  function onSettingsMenuOpen() {
    ensureSettingsUiRoots();
    if (!isUnityMenuHost() && window.WebLocaleLoader && window.WebLocaleLoader.flushPendingLanguageOptions) {
      window.WebLocaleLoader.flushPendingLanguageOptions();
    }
    if (!contentRoot) return;
    renderAll();
    if (activeTabId === "controls" && window.WebSettingsControls) {
      window.WebSettingsControls.openControlsTab();
    }
    scheduleSliderValueLayoutRefresh();
  }

  function refreshAllSliderValuePositions() {
    if (!contentRoot) return;
    var sliders = contentRoot.querySelectorAll(".settings-slider");
    var index;
    for (index = 0; index < sliders.length; index++) {
      var slider = sliders[index];
      var track = slider.parentElement;
      if (!track) continue;
      var valueSpan = track.querySelector(".settings-slider-value");
      var minSpan = track.querySelector(".settings-slider-min");
      var maxSpan = track.querySelector(".settings-slider-max");
      updateSliderTrackLayout(slider, valueSpan, minSpan, maxSpan);
    }
  }

  function getTerminalAnimationsEnabled(value) {
    if (value === false) return false;
    if (value === "false") return false;
    return true;
  }

  function applyTerminalAnimations(enabled) {
    var html = document.documentElement;
    var device = document.getElementById("device");
    if (enabled) {
      if (html) html.classList.remove("terminal-animations-off");
      if (device) device.classList.remove("terminal-animations-off");
      return;
    }
    if (html) html.classList.add("terminal-animations-off");
    if (device) device.classList.add("terminal-animations-off");
  }

  function applyMenuBackgroundAnimation(enabled) {
    var device = document.getElementById("device");
    if (!device) return;
    if (enabled) device.classList.remove("menu-background-animation-off");
    else device.classList.add("menu-background-animation-off");
  }

  function applyMenuMusicEnabled(enabled) {
    if (window.WebMenuMusic && window.WebMenuMusic.sync) {
      window.WebMenuMusic.sync();
    }
  }

  function isMenuMusicEnabled() {
    return state.menuMusicEnabled !== false;
  }

  function applyCustomCursorMode(enabled) {
    var screen = document.querySelector(".menu-screen");
    if (!screen) return;
    var useCustomCursor = enabled !== false;
    var useUnityCursor = useCustomCursor && isUnityMenuHost();
    if (useUnityCursor) screen.classList.add("menu-screen--unity-cursor");
    else screen.classList.remove("menu-screen--unity-cursor");
    if (useCustomCursor) screen.classList.remove("menu-screen--system-cursor");
    else screen.classList.add("menu-screen--system-cursor");
    if (window.WebMenuCursorBridge) {
      window.WebMenuCursorBridge.setUnityCursorEnabled(useUnityCursor);
    }
  }

  function getDesktopIconScalePercent() {
    var percent = Number(state.desktopIconScalePercent);
    if (isNaN(percent)) return 100;
    if (percent < 50) return 50;
    if (percent > 300) return 300;
    return Math.round(percent);
  }

  function applyDesktopIconScale(percent) {
    if (window.WebDesktop && window.WebDesktop.setDesktopIconScalePercent) {
      window.WebDesktop.setDesktopIconScalePercent(percent);
    }
  }

  function onDesktopIconScaleSliderInput(field) {
    if (!field || field.key !== "desktopIconScalePercent") return;
    applyDesktopIconScale(state.desktopIconScalePercent);
    saveLocalPreview();
  }

  function sliderValueIsTypedInput(field) {
    return !field.steppedOptions;
  }

  function getSliderValueDisplayText(field, wireValue) {
    if (field.steppedOptions) {
      var steppedIndex = parseInt(wireValue, 10);
      var steppedOption = getSteppedOptionByIndex(field.steppedOptions, steppedIndex);
      return steppedOption.label;
    }
    if (field.parse) {
      return volumeFormat(parseFloat(field.parse(wireValue)));
    }
    return field.format(Number(wireValue));
  }

  function parseSliderTypedNumber(rawText) {
    var text = String(rawText).trim();
    if (!text) return null;
    if (text.charAt(text.length - 1) === "%") {
      text = text.substring(0, text.length - 1).trim();
    }
    if (!text) return null;
    var number = Number(text);
    if (isNaN(number)) return null;
    return number;
  }

  function clampSliderTypedNumber(field, number) {
    var min = Number(field.min);
    var max = Number(field.max);
    if (number < min) number = min;
    if (number > max) number = max;
    var step = Number(field.step);
    if (step > 0) {
      number = Math.round(number / step) * step;
      if (number < min) number = min;
      if (number > max) number = max;
    }
    return number;
  }

  function setSliderValueDisplay(valueDisplay, field, wireValue) {
    if (!valueDisplay) return;
    var displayText = getSliderValueDisplayText(field, wireValue);
    if (valueDisplay.tagName === "INPUT") {
      if (document.activeElement === valueDisplay) return;
      valueDisplay.value = displayText;
      return;
    }
    valueDisplay.textContent = displayText;
  }

  function commitSliderValueInput(field, slider, valueInput) {
    var typedNumber = parseSliderTypedNumber(valueInput.value);
    if (typedNumber == null) {
      setSliderValueDisplay(valueInput, field, slider.value);
      return;
    }
    var clampedNumber = clampSliderTypedNumber(field, typedNumber);
    var wireValue = String(Math.round(clampedNumber));
    slider.value = wireValue;
    updateSliderDisplay(field, slider, valueInput);
    postChange(field.key, getSliderPostValue(field, wireValue));
    onAudioVolumeSliderInput(field);
    onDesktopIconScaleSliderInput(field);
    if (!isUnityHost()) {
      saveLocalPreview();
    }
  }

  function stepSliderByDirection(field, slider, valueDisplay, direction) {
    var min = Number(slider.min);
    var max = Number(slider.max);
    var step = Number(slider.step);
    var current = Number(slider.value);
    var next;
    if (field.steppedOptions) {
      next = current + direction;
    } else {
      next = current + direction * step;
    }
    if (next < min) {
      next = min;
    }
    if (next > max) {
      next = max;
    }
    if (next === current) {
      return;
    }
    slider.value = String(next);
    var wireValue = updateSliderDisplay(field, slider, valueDisplay);
    postChange(field.key, getSliderPostValue(field, wireValue));
    onAudioVolumeSliderInput(field);
    onDesktopIconScaleSliderInput(field);
    if (!isUnityHost()) {
      saveLocalPreview();
    }
  }

  function onSettingsSliderWheel(field, slider, valueDisplay, event) {
    if (event.deltaY === 0) {
      return;
    }
    if (document.activeElement !== slider) {
      return;
    }
    var direction = event.deltaY < 0 ? 1 : -1;
    stepSliderByDirection(field, slider, valueDisplay, direction);
    event.preventDefault();
    event.stopPropagation();
  }

  function refreshSliderRowUi(field) {
    if (!contentRoot) return;
    var row = contentRoot.querySelector('.settings-row--slider[data-setting-key="' + field.key + '"]');
    if (!row) return;
    var slider = row.querySelector(".settings-slider");
    var valueDisplay = row.querySelector(".settings-slider-value");
    if (!slider || !valueDisplay) return;
    updateSliderDisplay(field, slider, valueDisplay);
  }

  function updateSliderDisplay(field, slider, valueDisplay) {
    var track = slider.parentElement;
    var minSpan = track ? track.querySelector(".settings-slider-min") : null;
    var maxSpan = track ? track.querySelector(".settings-slider-max") : null;
    var wireValue = slider.value;
    if (field.steppedOptions) {
      var steppedIndex = parseInt(wireValue, 10);
      var steppedOption = getSteppedOptionByIndex(field.steppedOptions, steppedIndex);
      state[field.key] = steppedOption.value;
      setSliderValueDisplay(valueDisplay, field, wireValue);
      updateSliderTrackLayout(slider, valueDisplay, minSpan, maxSpan);
      return steppedOption.value;
    }
    if (field.parse) {
      state[field.key] = parseFloat(field.parse(wireValue));
      setSliderValueDisplay(valueDisplay, field, wireValue);
      updateSliderTrackLayout(slider, valueDisplay, minSpan, maxSpan);
      return wireValue;
    }
    state[field.key] = parseInt(wireValue, 10);
    setSliderValueDisplay(valueDisplay, field, wireValue);
    updateSliderTrackLayout(slider, valueDisplay, minSpan, maxSpan);
    return wireValue;
  }

  function buildSliderRow(field) {
    var row = document.createElement("div");
    row.className = "settings-row settings-row--slider";
    row.setAttribute("data-setting-key", field.key);

    var line = document.createElement("div");
    line.className = "settings-field-line";

    var labelBox = document.createElement("div");
    labelBox.className = "settings-field-label-box";

    appendFieldLabel(labelBox, field);

    var controlBox = document.createElement("div");
    controlBox.className = "settings-field-control-box settings-field-control-box--slider";

    var sliderTrack = document.createElement("div");
    sliderTrack.className = "settings-slider-track";

    var minSpan = document.createElement("span");
    minSpan.className = "settings-slider-min";
    minSpan.textContent = getSliderEndpointLabel(field, false);

    var maxSpan = document.createElement("span");
    maxSpan.className = "settings-slider-max";
    maxSpan.textContent = getSliderEndpointLabel(field, true);

    var valueDisplay;
    if (sliderValueIsTypedInput(field)) {
      valueDisplay = document.createElement("input");
      valueDisplay.type = "text";
      valueDisplay.className = "settings-value settings-slider-value settings-slider-value-input";
      valueDisplay.setAttribute("inputmode", "decimal");
      valueDisplay.setAttribute("autocomplete", "off");
      valueDisplay.setAttribute("spellcheck", "false");
      valueDisplay.setAttribute("aria-label", getFieldLabel(field));
    } else {
      valueDisplay = document.createElement("span");
      valueDisplay.className = "settings-value settings-slider-value";
    }

    var slider = document.createElement("input");
    slider.type = "range";
    slider.className = "settings-slider";
    slider.min = String(field.min);
    slider.max = String(field.max);
    slider.step = String(field.step);

    if (field.steppedOptions) {
      var steppedIndex = getSteppedOptionIndex(field.steppedOptions, state[field.key]);
      var steppedOption = getSteppedOptionByIndex(field.steppedOptions, steppedIndex);
      slider.value = String(steppedIndex);
      valueDisplay.textContent = steppedOption.label;
    } else if (field.parse) {
      slider.value = String(volumeSliderValue(state[field.key]));
      valueDisplay.value = volumeFormat(state[field.key]);
    } else {
      var sliderStateValue = state[field.key];
      if (field.key === "graphicsLodBiasPercent") {
        sliderStateValue = parseLodBiasPercent(sliderStateValue);
        state[field.key] = sliderStateValue;
      }
      slider.value = String(sliderStateValue);
      valueDisplay.value = field.format(sliderStateValue);
    }

    slider.addEventListener("input", function () {
      updateSliderDisplay(field, slider, valueDisplay);
      onAudioVolumeSliderInput(field);
      onDesktopIconScaleSliderInput(field);
    });

    slider.addEventListener("change", function () {
      var wireValue = updateSliderDisplay(field, slider, valueDisplay);
      postChange(field.key, getSliderPostValue(field, wireValue));
    });

    sliderTrack.addEventListener("wheel", function (event) {
      onSettingsSliderWheel(field, slider, valueDisplay, event);
    }, { passive: false });

    if (valueDisplay.tagName === "INPUT") {
      valueDisplay.addEventListener("pointerdown", function (event) {
        event.stopPropagation();
      });
      valueDisplay.addEventListener("click", function (event) {
        event.stopPropagation();
        valueDisplay.select();
      });
      valueDisplay.addEventListener("focus", function () {
        sliderTrack.classList.add("settings-slider-track--value-editing");
        valueDisplay.select();
      });
      valueDisplay.addEventListener("blur", function () {
        sliderTrack.classList.remove("settings-slider-track--value-editing");
        commitSliderValueInput(field, slider, valueDisplay);
      });
      valueDisplay.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          valueDisplay.blur();
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setSliderValueDisplay(valueDisplay, field, slider.value);
          valueDisplay.blur();
        }
      });
    }

    sliderTrack.appendChild(slider);
    sliderTrack.appendChild(minSpan);
    sliderTrack.appendChild(maxSpan);
    sliderTrack.appendChild(valueDisplay);
    controlBox.appendChild(sliderTrack);
    line.appendChild(labelBox);
    line.appendChild(controlBox);
    row.appendChild(line);
    updateSliderTrackLayout(slider, valueDisplay, minSpan, maxSpan);
    return row;
  }

  function renderAll() {
    renderTabs();
    renderFields();
  }

  function applyState(payload) {
    if (!payload) return;
    settingsHostStateReady = true;
    ensureSettingsUiRoots();
    var previousLanguage = state.language;
    var key;
    for (key in payload) {
      if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
      if (key === "languageOptions" && payload.languageOptions) {
        state.languageOptions = payload.languageOptions;
        continue;
      }
      if (key === "controlsSection" || key === "controlsRows" || key === "controlsListeningRowId") continue;
      if (key === "graphicsLodBiasPercent") {
        state[key] = parseLodBiasPercent(payload[key]);
        continue;
      }
      if (key === "terminalAnimationsEnabled") {
        state[key] = getTerminalAnimationsEnabled(payload[key]);
        continue;
      }
      state[key] = payload[key];
    }
    if (window.WebSettingsControls) {
      window.WebSettingsControls.applyControlsState(payload);
      if (payload.controlsListeningRowId) {
        window.WebSettingsControls.setListeningRowId(payload.controlsListeningRowId);
      } else {
        window.WebSettingsControls.setListeningRowId("");
      }
      if (
        activeTabId === "controls" &&
        (!payload.controlsRows || !payload.controlsRows.length) &&
        isUnityMenuHost()
      ) {
        window.WebSettingsControls.openControlsTab();
      }
    }
    if (Object.prototype.hasOwnProperty.call(payload, "terminalAnimationsEnabled")) {
      applyTerminalAnimations(getTerminalAnimationsEnabled(payload.terminalAnimationsEnabled));
    }
    if (Object.prototype.hasOwnProperty.call(payload, "menuBackgroundAnimationEnabled")) {
      applyMenuBackgroundAnimation(payload.menuBackgroundAnimationEnabled !== false);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "menuMusicEnabled")) {
      applyMenuMusicEnabled(payload.menuMusicEnabled !== false);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "useCustomCursor")) {
      applyCustomCursorMode(payload.useCustomCursor);
    }
    if (
      Object.prototype.hasOwnProperty.call(payload, "masterVolume") ||
      Object.prototype.hasOwnProperty.call(payload, "musicVolume") ||
      Object.prototype.hasOwnProperty.call(payload, "interfaceVolume") ||
      Object.prototype.hasOwnProperty.call(payload, "arcadeGamesVolume")
    ) {
      pushAudioVolumeStateToMenu();
    }
    if (Object.prototype.hasOwnProperty.call(payload, "language") && state.language !== previousLanguage) {
      applyMenuLanguage(state.language);
    }
    setSettingsLoadingVisible(false);
    renderAll();
    updateNavLabels();
  }

  function updateNavLabels() {
    var resetButtons = document.querySelectorAll(".settings-tab-reset-btn .term-row-label");
    var resetIndex;
    var resetLabelText = getLocalized("settings.web.reset-defaults", "Reset defaults");
    for (resetIndex = 0; resetIndex < resetButtons.length; resetIndex++) {
      resetButtons[resetIndex].textContent = resetLabelText;
    }
    var layoutResetLabels = document.querySelectorAll(
      '.settings-row--action[data-setting-action="reset-window-layouts"] .settings-action-btn .term-row-label'
    );
    var layoutResetLabelText = getLocalized("settings.web.reset-window-layouts", "Reset positions");
    for (resetIndex = 0; resetIndex < layoutResetLabels.length; resetIndex++) {
      layoutResetLabels[resetIndex].textContent = layoutResetLabelText;
    }
    updateComposeLabels();
  }

  function updateComposeLabels() {
    var labelElements = document.querySelectorAll(".worlds-compose-label[data-locale-key]");
    var index;
    for (index = 0; index < labelElements.length; index++) {
      var element = labelElements[index];
      var key = element.getAttribute("data-locale-key");
      if (!key) continue;
      element.textContent = getLocalized(key, element.textContent);
    }
    var addButtons = document.querySelectorAll("#btnAddWorld .term-row-label, #btnAddServer .term-row-label");
    for (index = 0; index < addButtons.length; index++) {
      var addButtonLabel = addButtons[index];
      var addButtonKey = addButtonLabel.getAttribute("data-locale-key");
      if (!addButtonKey) continue;
      addButtonLabel.textContent = getLocalized(addButtonKey, addButtonLabel.textContent);
    }
    var nameInputs = document.querySelectorAll('[data-locale-placeholder="web.connect.placeholder.name"]');
    for (index = 0; index < nameInputs.length; index++) {
      nameInputs[index].setAttribute(
        "placeholder",
        getLocalized("web.connect.placeholder.name", nameInputs[index].getAttribute("placeholder"))
      );
    }
    var seedInputs = document.querySelectorAll('[data-locale-placeholder="web.connect.placeholder.seed"]');
    for (index = 0; index < seedInputs.length; index++) {
      seedInputs[index].setAttribute(
        "placeholder",
        getLocalized("web.connect.placeholder.seed", seedInputs[index].getAttribute("placeholder"))
      );
    }
    var ipInputs = document.querySelectorAll('[data-locale-placeholder="web.connect.placeholder.ip"]');
    for (index = 0; index < ipInputs.length; index++) {
      ipInputs[index].setAttribute(
        "placeholder",
        getLocalized("web.connect.placeholder.ip", ipInputs[index].getAttribute("placeholder"))
      );
    }
  }

  function onDesktopWindowsRestored() {
    if (!isSettingsWindowVisible()) return;
    if (!ensureSettingsUiRoots()) return;
    if (isUnityMenuHost() && !settingsHostStateReady && window.WebSettingsBridge) {
      window.WebSettingsBridge.open();
    }
  }

  function onSettingsWindowClosed(event) {
    var detail = event && event.detail;
    if (!detail || detail.preset !== "settings-content") return;
    activeTabId = "interface";
    releaseSettingsContent();
  }

  function bindToWindow(windowElement) {
    if (!windowElement) return;
    contentRoot = windowElement.querySelector(".settings-scroll");
    tabsRoot = windowElement.querySelector(".settings-tabs");
    if (!contentRoot || !tabsRoot) return;

    ensureSettingsScrollBound();
    if (isUnityMenuHost() && !settingsHostStateReady) {
      setSettingsLoadingVisible(true);
    } else {
      setSettingsLoadingVisible(false);
    }
    renderAll();
  }

  function onWindowResizeForSliders() {
    if (sliderResizeTimer) window.clearTimeout(sliderResizeTimer);
    sliderResizeTimer = window.setTimeout(refreshAllSliderValuePositions, 100);
  }


  function init() {
    if (window.WebMenuHelpTooltip) {
      window.WebMenuHelpTooltip.init();
    }
    updateEmptyLoadingLabel();
    updateNavLabels();
    applyTerminalAnimations(getTerminalAnimationsEnabled(state.terminalAnimationsEnabled));
    if (!isUnityMenuHost()) {
      loadLocalPreview();
      applyTerminalAnimations(getTerminalAnimationsEnabled(state.terminalAnimationsEnabled));
      applyMenuBackgroundAnimation(state.menuBackgroundAnimationEnabled !== false);
      applyMenuMusicEnabled(state.menuMusicEnabled !== false);
      applyCustomCursorMode(state.useCustomCursor !== false);
      if (window.WebLocaleLoader && window.WebLocaleLoader.flushPendingLanguageOptions) {
        window.WebLocaleLoader.flushPendingLanguageOptions();
      }
    } else {
      loadLocalOnlySettingsFromStorage();
    }

    window.addEventListener("web-settings-open", onSettingsMenuOpen);
    window.addEventListener("web-desktop-windows-restored", onDesktopWindowsRestored);
    window.addEventListener("web-desktop-window-closed", onSettingsWindowClosed);
    ensureSliderLayoutObserver();

    window.addEventListener("resize", onWindowResizeForSliders);
    window.addEventListener("web-wm-layout-settled", onWorkspaceLayoutSettled);
    if (isSettingsWindowVisible()) {
      if (isUnityMenuHost() && !settingsHostStateReady && window.WebSettingsBridge) {
        window.WebSettingsBridge.open();
      }
    }
  }

  window.WebSettings = {
    applyState: applyState,
    applyTerminalAnimations: applyTerminalAnimations,
    applyMenuBackgroundAnimation: applyMenuBackgroundAnimation,
    applyMenuMusicEnabled: applyMenuMusicEnabled,
    isMenuMusicEnabled: isMenuMusicEnabled,
    applyCustomCursorMode: applyCustomCursorMode,
    getDesktopIconScalePercent: getDesktopIconScalePercent,
    applyDesktopIconScale: applyDesktopIconScale,
    loadLocalOnlySettingsFromStorage: loadLocalOnlySettingsFromStorage,
    onLocaleUpdated: onLocaleUpdated,
    loadLocalPreview: loadLocalPreview,
    resetLocalPreview: resetLocalPreview,
    applyLocalChange: applyLocalChange,
    setLanguageOptions: setLanguageOptions,
    getLocalized: getLocalized,
    getActiveTabId: function () {
      return activeTabId;
    },
    setActiveTab: setActiveTab,
    bindToWindow: bindToWindow,
    percentFormat: percentFormat,
    buildSliderRowForField: buildSliderRow,
    renderControlsOnly: renderControlsOnly,
    refreshAllSliderValuePositions: refreshAllSliderValuePositions,
    scheduleSliderValueLayoutRefresh: scheduleSliderValueLayoutRefresh,
    refreshOnOpen: onSettingsMenuOpen,
    releaseContent: releaseSettingsContent
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
