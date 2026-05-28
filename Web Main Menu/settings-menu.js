(function () {
  var STORAGE_KEY = "web-settings-preview";
  var WEB_PREVIEW_HELP_SAMPLE_KEY = "settings.web.help.preview-sample";

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

  var LOD_BIAS_OPTIONS = [
    { value: "50%", label: "50%" },
    { value: "75%", label: "75%" },
    { value: "100%", label: "100%" },
    { value: "125%", label: "125%" },
    { value: "150%", label: "150%" },
    { value: "200%", label: "200%" }
  ];

  var TABS = [
    { id: "interface", labelKey: "settings.title.interface" },
    { id: "gameplay", labelKey: "settings.title.gameplay" },
    { id: "audio", labelKey: "settings.title.audio" },
    { id: "graphics", labelKey: "settings.title.graphics" }
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
    masterVolume: 0.5,
    musicVolume: 1,
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
    graphicsLodBiasPercent: "100%",
    graphicsFieldOfView: 60,
    graphicsFpsCapFps: 60,
    languageOptions: []
  };

  var state = copyState(DEFAULT_STATE);
  var localeStrings = {};
  var activeTabId = "interface";
  var contentRoot;
  var tabsRoot;
  var helpTooltip;

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
    if (key && Object.prototype.hasOwnProperty.call(localeStrings, key)) {
      var localeValue = localeStrings[key];
      if (localeValue != null && localeValue !== "") return localeValue;
    }
    if (window.WebLocale) {
      return window.WebLocale.get(key, fallback);
    }
    if (fallback != null) return fallback;
    return key || "";
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
    hideHelpTooltip();
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
        { type: "slider", key: "lookSensitivityPercent", labelKey: "settings.controls.look-sensitivity", min: 25, max: 200, step: 1, format: percentFormat },
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
        { type: "slider", key: "musicVolume", labelKey: "settings.music-volume", min: 0, max: 100, step: 1, format: volumeFormat, parse: volumeParse },
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
        { type: "toggle", key: "terminalAnimationsEnabled", labelKey: "settings.terminal-animations" }
      ];
    }

    if (tabId === "graphics") {
      return [
        {
          type: "slider",
          key: "graphicsLodBiasPercent",
          labelKey: "settings.graphics.lod-bias",
          min: 0,
          max: LOD_BIAS_OPTIONS.length - 1,
          step: 1,
          steppedOptions: LOD_BIAS_OPTIONS
        },
        { type: "slider", key: "graphicsFieldOfView", labelKey: "settings.graphics.field-of-view", min: 20, max: 140, step: 1, format: intFormat },
        { type: "slider", key: "graphicsFpsCapFps", labelKey: "settings.graphics.fps-cap", min: 0, max: 480, step: 1, format: fpsCapFormat },
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
    return ratio * (trackWidth - sliderThumbSizePx) + sliderThumbSizePx * 0.5;
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
      if (refreshChoiceRow) refreshToggleRowUi(field);
      if (field.key === "terminalAnimationsEnabled") {
        applyTerminalAnimations(state.terminalAnimationsEnabled !== false);
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
      if (refreshChoiceRow) refreshChoiceRowUi(field);
      return;
    }

    if (field.format === intChoiceFormat || field.format === intFormat || field.format === percentFormat || field.format === fpsCapFormat) {
      state[field.key] = parseInt(wireValue, 10);
      postChange(field.key, wireValue);
      if (refreshChoiceRow) refreshChoiceRowUi(field);
      return;
    }

    state[field.key] = wireValue;
    postChange(field.key, wireValue);
    if (refreshChoiceRow) refreshChoiceRowUi(field);
    if (field.key === "language") {
      notifyLanguageChanged();
    }
  }

  function notifyLanguageChanged() {
    window.dispatchEvent(
      new CustomEvent("web-settings-language-changed", { detail: { languageCode: state.language } })
    );
  }

  function postChange(key, value) {
    if (isUnityHost() && window.WebSettingsBridge) {
      window.WebSettingsBridge.set(key, value);
      return;
    }
    saveLocalPreview();
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
    renderAll();
    syncWebAudioVolumes();
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
    renderAll();
    syncWebAudioVolumes();
  }

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function syncWebAudioVolumes() {
    if (!window.WebMenuAudioVolume) return;
    window.WebMenuAudioVolume.notifyAudioVolumeChanged();
  }

  function onAudioVolumeSliderInput(field) {
    if (isUnityHost()) return;
    if (!window.WebMenuAudioVolume || !window.WebMenuAudioVolume.isAudioVolumeKey(field.key)) return;
    saveLocalPreview();
    syncWebAudioVolumes();
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
      applyTerminalAnimations(state.terminalAnimationsEnabled !== false);
    }
    if (key === "useCustomCursor") {
      applyCustomCursorMode(state.useCustomCursor);
    }
    if (key === "language") {
      notifyLanguageChanged();
    }
    if (window.WebMenuAudioVolume && window.WebMenuAudioVolume.isAudioVolumeKey(key)) {
      syncWebAudioVolumes();
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

  function renderTabs() {
    if (!tabsRoot) return;
    tabsRoot.textContent = "";
    var index;
    for (index = 0; index < TABS.length; index++) {
      var tab = TABS[index];
      var button = document.createElement("button");
      button.type = "button";
      button.className = "term-row settings-tab";
      if (tab.id === activeTabId) button.className += " is-active";

      var prefix = document.createElement("span");
      prefix.className = "term-row-prefix terminal-text--dim";
      prefix.textContent = tab.id === activeTabId ? ">>" : "[ ]";

      var label = document.createElement("span");
      label.className = "term-row-label terminal-text";
      label.textContent = getLocalized(tab.labelKey, tab.label || tab.id);

      button.appendChild(prefix);
      button.appendChild(label);
      button.setAttribute("data-tab-id", tab.id);
      button.addEventListener("click", onTabClicked);
      tabsRoot.appendChild(button);
    }
  }

  function playSettingsContentBodyOpen() {
    if (state.terminalAnimationsEnabled === false) return;
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
    playSettingsContentBodyOpen();
  }

  function renderFields() {
    if (!contentRoot) return;
    hideHelpTooltip();
    contentRoot.textContent = "";
    contentRoot.classList.remove("is-empty");

    var fields = getFieldsForTab(activeTabId);
    var index;
    for (index = 0; index < fields.length; index++) {
      var field = fields[index];
      if (field.type === "toggle") contentRoot.appendChild(buildToggleRow(field));
      else if (field.type === "choice") contentRoot.appendChild(buildChoiceRow(field));
      else if (field.type === "slider") contentRoot.appendChild(buildSliderRow(field));
    }

    if (!fields.length) contentRoot.classList.add("is-empty");
    refreshAllSliderValuePositions();
    scheduleSliderValueLayoutRefresh();
    if (window.WebScrollbarCursor) {
      window.WebScrollbarCursor.refreshAllScrollbars();
    }
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
      helpButton.setAttribute("data-help-text", helpText);
      helpButton.addEventListener("pointerenter", onHelpButtonPointerEnter);
      helpButton.addEventListener("pointerleave", onHelpButtonPointerLeave);
      helpButton.addEventListener("focus", onHelpButtonPointerEnter);
      helpButton.addEventListener("blur", onHelpButtonPointerLeave);
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

  function onHelpButtonPointerEnter(event) {
    var anchor = event.currentTarget;
    var text = anchor.getAttribute("data-help-text");
    if (!text) return;
    showHelpTooltip(anchor, text);
  }

  function onHelpButtonPointerLeave(event) {
    var related = event.relatedTarget;
    if (related && helpTooltip && helpTooltip.contains(related)) return;
    hideHelpTooltip();
  }

  function showHelpTooltip(anchor, text) {
    if (!helpTooltip || !anchor) return;
    helpTooltip.textContent = text;
    helpTooltip.hidden = false;
    helpTooltip.classList.add("is-visible");
    positionHelpTooltip(anchor);
  }

  function hideHelpTooltip() {
    if (!helpTooltip) return;
    helpTooltip.hidden = true;
    helpTooltip.classList.remove("is-visible");
    helpTooltip.classList.remove("settings-help-tooltip--left");
    helpTooltip.classList.remove("settings-help-tooltip--right");
  }

  function onSettingsContentScroll() {
    hideHelpTooltip();
  }

  function positionHelpTooltip(anchor) {
    if (!helpTooltip || !anchor) return;
    var gap = 10;
    var viewportPadding = 12;
    var anchorRect = anchor.getBoundingClientRect();
    var tooltipRect = helpTooltip.getBoundingClientRect();
    var placeOnLeft = false;
    var left = anchorRect.right + gap;
    if (left + tooltipRect.width > window.innerWidth - viewportPadding) {
      left = anchorRect.left - gap - tooltipRect.width;
      placeOnLeft = true;
    }
    if (left < viewportPadding) left = viewportPadding;

    var top = anchorRect.top + anchorRect.height * 0.5 - tooltipRect.height * 0.5;
    if (top < viewportPadding) top = viewportPadding;
    if (top + tooltipRect.height > window.innerHeight - viewportPadding) {
      top = window.innerHeight - viewportPadding - tooltipRect.height;
    }

    helpTooltip.style.left = left + "px";
    helpTooltip.style.top = top + "px";
    helpTooltip.classList.toggle("settings-help-tooltip--left", placeOnLeft);
    helpTooltip.classList.toggle("settings-help-tooltip--right", !placeOnLeft);
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

  var sliderThumbSizePx = 14;
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

  function updateSliderTrackLayout(slider, valueSpan, minSpan, maxSpan) {
    if (!slider) return;
    var trackWidth = slider.offsetWidth;
    if (trackWidth <= 0) {
      scheduleSliderValueLayoutRefresh();
      return;
    }
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
    if (!isUnityMenuHost() && window.WebLocaleLoader && window.WebLocaleLoader.flushPendingLanguageOptions) {
      window.WebLocaleLoader.flushPendingLanguageOptions();
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

  function applyTerminalAnimations(enabled) {
    var screen = document.querySelector(".menu-screen");
    if (!screen) return;
    if (enabled) screen.classList.remove("terminal-animations-off");
    else screen.classList.add("terminal-animations-off");
  }

  function applyCustomCursorMode(enabled) {
    var screen = document.querySelector(".menu-screen");
    if (!screen) return;
    var useUnityCursor = enabled !== false && isUnityMenuHost();
    if (useUnityCursor) screen.classList.add("menu-screen--unity-cursor");
    else screen.classList.remove("menu-screen--unity-cursor");
    if (window.WebMenuCursorBridge) {
      window.WebMenuCursorBridge.setUnityCursorEnabled(useUnityCursor);
    }
  }

  function updateSliderDisplay(field, slider, valueSpan) {
    var track = slider.parentElement;
    var minSpan = track ? track.querySelector(".settings-slider-min") : null;
    var maxSpan = track ? track.querySelector(".settings-slider-max") : null;
    var wireValue = slider.value;
    if (field.steppedOptions) {
      var steppedIndex = parseInt(wireValue, 10);
      var steppedOption = getSteppedOptionByIndex(field.steppedOptions, steppedIndex);
      state[field.key] = steppedOption.value;
      valueSpan.textContent = steppedOption.label;
      updateSliderTrackLayout(slider, valueSpan, minSpan, maxSpan);
      return steppedOption.value;
    }
    if (field.parse) {
      state[field.key] = parseFloat(field.parse(wireValue));
      valueSpan.textContent = wireValue + "%";
      updateSliderTrackLayout(slider, valueSpan, minSpan, maxSpan);
      return wireValue;
    }
    state[field.key] = parseInt(wireValue, 10);
    valueSpan.textContent = field.format(Number(wireValue));
    updateSliderTrackLayout(slider, valueSpan, minSpan, maxSpan);
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

    var valueSpan = document.createElement("span");
    valueSpan.className = "settings-value settings-slider-value";

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
      valueSpan.textContent = steppedOption.label;
    } else if (field.parse) {
      slider.value = String(volumeSliderValue(state[field.key]));
      valueSpan.textContent = volumeFormat(state[field.key]);
    } else {
      slider.value = String(state[field.key]);
      valueSpan.textContent = field.format(state[field.key]);
    }

    slider.addEventListener("input", function () {
      updateSliderDisplay(field, slider, valueSpan);
      onAudioVolumeSliderInput(field);
    });

    slider.addEventListener("change", function () {
      var wireValue = updateSliderDisplay(field, slider, valueSpan);
      postChange(field.key, field.parse ? field.parse(wireValue) : wireValue);
    });

    sliderTrack.appendChild(slider);
    sliderTrack.appendChild(minSpan);
    sliderTrack.appendChild(maxSpan);
    sliderTrack.appendChild(valueSpan);
    controlBox.appendChild(sliderTrack);
    line.appendChild(labelBox);
    line.appendChild(controlBox);
    row.appendChild(line);
    updateSliderTrackLayout(slider, valueSpan, minSpan, maxSpan);
    return row;
  }

  function updateHeading() {
    var heading = document.getElementById("settingsHeading");
    if (!heading) return;
    var index;
    for (index = 0; index < TABS.length; index++) {
      if (TABS[index].id === activeTabId) {
        heading.textContent = getLocalized(TABS[index].labelKey, TABS[index].label || TABS[index].id);
        return;
      }
    }
    heading.textContent = getLocalized("menu.settings", "Settings");
  }

  function renderAll() {
    renderTabs();
    updateHeading();
    renderFields();
  }

  function applyLocaleStringEntries(entries) {
    if (!entries || !entries.length) return;
    var index;
    for (index = 0; index < entries.length; index++) {
      var entry = entries[index];
      if (!entry || !entry.key) continue;
      localeStrings[entry.key] = entry.value;
    }
  }

  function applyState(payload) {
    if (!payload) return;
    if (payload.localeStrings) {
      applyLocaleStringEntries(payload.localeStrings);
    }
    var key;
    for (key in payload) {
      if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
      if (key === "languageOptions" && payload.languageOptions) {
        state.languageOptions = payload.languageOptions;
        continue;
      }
      if (key === "localeStrings") continue;
      state[key] = payload[key];
    }
    if (Object.prototype.hasOwnProperty.call(payload, "terminalAnimationsEnabled")) {
      applyTerminalAnimations(payload.terminalAnimationsEnabled !== false);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "useCustomCursor")) {
      applyCustomCursorMode(payload.useCustomCursor);
    }
    if (
      Object.prototype.hasOwnProperty.call(payload, "masterVolume") ||
      Object.prototype.hasOwnProperty.call(payload, "musicVolume") ||
      Object.prototype.hasOwnProperty.call(payload, "interfaceVolume")
    ) {
      syncWebAudioVolumes();
    }
    renderAll();
    updateNavLabels();
  }

  function updateNavLabels() {
    var resetButton = document.getElementById("btnSettingsReset");
    if (resetButton) {
      var resetLabel = resetButton.querySelector(".term-row-label");
      if (resetLabel) resetLabel.textContent = getLocalized("settings.web.reset-defaults", "Reset defaults");
    }
    var closeButton = document.getElementById("btnSettingsClose");
    if (closeButton) {
      var closeLabel = closeButton.querySelector(".term-row-label");
      if (closeLabel) closeLabel.textContent = getLocalized("menu.back", "Back");
    }
    var exitButton = document.getElementById("btnExit");
    if (exitButton) {
      var exitLabel = exitButton.querySelector(".term-row-label");
      if (exitLabel) exitLabel.textContent = getLocalized("web.menu.exit", "Exit");
    }
    var startButton = document.getElementById("btnStart");
    if (startButton) {
      var startLabel = startButton.querySelector(".term-row-label");
      if (startLabel) startLabel.textContent = getLocalized("menu.start", "Start");
    }
    var settingsButton = document.getElementById("btnSettings");
    if (settingsButton) {
      var settingsLabel = settingsButton.querySelector(".term-row-label");
      if (settingsLabel) settingsLabel.textContent = getLocalized("menu.settings", "Settings");
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
      addButtons[index].textContent = getLocalized("web.connect.compose.add", "Add");
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

  function init() {
    contentRoot = document.getElementById("settingsContent");
    tabsRoot = document.getElementById("settingsTabs");
    var resetButton = document.getElementById("btnSettingsReset");

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        if (window.WebSettingsBridge) {
          window.WebSettingsBridge.reset();
          return;
        }
        resetLocalPreview();
      });
    }

    helpTooltip = document.getElementById("settingsHelpTooltip");

    if (contentRoot) {
      contentRoot.addEventListener("scroll", onSettingsContentScroll, true);
      contentRoot.classList.add("is-empty");
    }
    updateEmptyLoadingLabel();
    renderTabs();
    updateNavLabels();
    if (!isUnityMenuHost()) {
      loadLocalPreview();
      applyTerminalAnimations(state.terminalAnimationsEnabled !== false);
      applyCustomCursorMode(state.useCustomCursor !== false);
      if (window.WebLocaleLoader && window.WebLocaleLoader.flushPendingLanguageOptions) {
        window.WebLocaleLoader.flushPendingLanguageOptions();
      }
    }

    ensureSliderLayoutObserver();

    window.addEventListener("resize", onWindowResizeForSliders);
    window.addEventListener("web-settings-open", onSettingsMenuOpen);
    window.addEventListener("web-wm-layout-settled", onWorkspaceLayoutSettled);
  }

  function onWindowResizeForSliders() {
    if (sliderResizeTimer) window.clearTimeout(sliderResizeTimer);
    sliderResizeTimer = window.setTimeout(refreshAllSliderValuePositions, 100);
  }

  window.WebSettings = {
    applyState: applyState,
    applyTerminalAnimations: applyTerminalAnimations,
    applyCustomCursorMode: applyCustomCursorMode,
    onLocaleUpdated: onLocaleUpdated,
    loadLocalPreview: loadLocalPreview,
    resetLocalPreview: resetLocalPreview,
    applyLocalChange: applyLocalChange,
    setLanguageOptions: setLanguageOptions
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
