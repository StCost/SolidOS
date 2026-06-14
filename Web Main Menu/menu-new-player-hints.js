(function () {
  var STORAGE_KEY = "cm-menu-new-player-hints-dismissed";
  var HOST_CLASS = "new-player-hint-host";
  var DOT_CLASS = "new-player-hint-dot";
  var CREATE_HINT_CLASS = "new-player-hint-create-active";
  var DESKTOP_ICON_HINT_IDS = ["worlds", "settings"];
  var LANGUAGE_HINT_ID = "language";
  var WORLD_NAME_HINT_ID = "world-name";
  var WORLD_SEED_HINT_ID = "world-seed";
  var WORLD_CREATE_HINT_ID = "world-create";
  var WORLD_FORM_ID = "formNewWorld";
  var WORLD_NAME_SELECTOR = "#" + WORLD_FORM_ID + " .worlds-compose-field--name";
  var WORLD_SEED_SELECTOR = "#" + WORLD_FORM_ID + " .worlds-compose-field--meta";
  var WORLD_CREATE_SELECTOR = "#btnAddWorld";
  var LANGUAGE_ROW_SELECTOR = '.settings-row[data-setting-key="language"]';

  var desktopIconsRoot = null;
  var settingsContentRoot = null;
  var worldFormRoot = null;
  var initialized = false;

  function readDismissedMap() {
    var raw;
    var parsed;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return {};
      return parsed;
    } catch (error) {
      return {};
    }
  }

  function writeDismissedMap(dismissedMap) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedMap));
    } catch (error) {
    }
  }

  function isHintDismissed(hintId) {
    var dismissedMap = readDismissedMap();
    return dismissedMap[hintId] === true;
  }

  function createHintDotElement() {
    var dotElement = document.createElement("span");
    dotElement.className = DOT_CLASS;
    dotElement.setAttribute("aria-hidden", "true");
    return dotElement;
  }

  function removeHintDotFromHost(hostElement) {
    var dotElement;
    if (!hostElement) return;
    dotElement = hostElement.querySelector("." + DOT_CLASS);
    if (dotElement && dotElement.parentNode) {
      dotElement.parentNode.removeChild(dotElement);
    }
    hostElement.classList.remove(HOST_CLASS);
  }

  function removeHintFromSelector(selector) {
    var hostElement = document.querySelector(selector);
    removeHintDotFromHost(hostElement);
  }

  function dismissHint(hintId) {
    var dismissedMap;
    if (!hintId || isHintDismissed(hintId)) return;
    dismissedMap = readDismissedMap();
    dismissedMap[hintId] = true;
    writeDismissedMap(dismissedMap);
    if (hintId === LANGUAGE_HINT_ID) {
      removeLanguageHint();
      return;
    }
    if (hintId === WORLD_NAME_HINT_ID) {
      removeHintFromSelector(WORLD_NAME_SELECTOR);
      return;
    }
    if (hintId === WORLD_SEED_HINT_ID) {
      removeHintFromSelector(WORLD_SEED_SELECTOR);
      return;
    }
    if (hintId === WORLD_CREATE_HINT_ID) {
      syncWorldCreateHint();
      return;
    }
    removeDesktopIconHint(hintId);
  }

  function syncHintOnHost(hintId, hostElement) {
    if (!hostElement) return;
    if (isHintDismissed(hintId)) {
      removeHintDotFromHost(hostElement);
      return;
    }
    if (hostElement.querySelector("." + DOT_CLASS)) return;
    hostElement.classList.add(HOST_CLASS);
    hostElement.appendChild(createHintDotElement());
  }

  function getDesktopIconElement(iconId) {
    if (!desktopIconsRoot || !iconId) return null;
    return desktopIconsRoot.querySelector('.os-desktop-icon[data-desktop-icon="' + iconId + '"]');
  }

  function removeDesktopIconHint(iconId) {
    var iconElement = getDesktopIconElement(iconId);
    var glyphElement;
    if (!iconElement) return;
    glyphElement = iconElement.querySelector(".os-desktop-icon-glyph");
    removeHintDotFromHost(glyphElement);
  }

  function syncDesktopIconHint(iconId) {
    var iconElement;
    var glyphElement;
    if (isHintDismissed(iconId)) {
      removeDesktopIconHint(iconId);
      return;
    }
    iconElement = getDesktopIconElement(iconId);
    if (!iconElement || iconElement.hidden) return;
    glyphElement = iconElement.querySelector(".os-desktop-icon-glyph");
    syncHintOnHost(iconId, glyphElement);
  }

  function syncDesktopIconHints() {
    var index;
    for (index = 0; index < DESKTOP_ICON_HINT_IDS.length; index++) {
      syncDesktopIconHint(DESKTOP_ICON_HINT_IDS[index]);
    }
  }

  function getLanguageRow() {
    if (!settingsContentRoot) return null;
    return settingsContentRoot.querySelector(LANGUAGE_ROW_SELECTOR);
  }

  function removeLanguageHint() {
    removeHintDotFromHost(getLanguageRow());
  }

  function syncLanguageHint() {
    syncHintOnHost(LANGUAGE_HINT_ID, getLanguageRow());
  }

  function syncWorldNameHint() {
    syncHintOnHost(WORLD_NAME_HINT_ID, document.querySelector(WORLD_NAME_SELECTOR));
  }

  function syncWorldSeedHint() {
    syncHintOnHost(WORLD_SEED_HINT_ID, document.querySelector(WORLD_SEED_SELECTOR));
  }

  function syncWorldCreateHint() {
    var createButton = document.querySelector(WORLD_CREATE_SELECTOR);
    if (!createButton) return;
    removeHintDotFromHost(createButton);
    if (isHintDismissed(WORLD_CREATE_HINT_ID)) {
      createButton.classList.remove(CREATE_HINT_CLASS);
      return;
    }
    createButton.classList.add(CREATE_HINT_CLASS);
  }

  function syncWorldTerminalHints() {
    syncWorldNameHint();
    syncWorldSeedHint();
    syncWorldCreateHint();
  }

  function scheduleLanguageHintSync() {
    window.requestAnimationFrame(syncLanguageHint);
  }

  function scheduleWorldTerminalHintSync() {
    window.requestAnimationFrame(syncWorldTerminalHints);
  }

  function onDesktopIconsClick(event) {
    var iconElement;
    var iconId;
    if (!event || !event.target) return;
    iconElement = event.target.closest(".os-desktop-icon[data-desktop-icon]");
    if (!iconElement) return;
    iconId = iconElement.getAttribute("data-desktop-icon");
    if (!iconId) return;
    if (iconId === "worlds" || iconId === "settings") {
      window.requestAnimationFrame(function () {
        dismissHint(iconId);
      });
    }
  }

  function onSettingsContentClick(event) {
    var languageRow;
    if (!event || !event.target) return;
    languageRow = event.target.closest(LANGUAGE_ROW_SELECTOR);
    if (!languageRow) return;
    dismissHint(LANGUAGE_HINT_ID);
  }

  function onSettingsWindowClosed(event) {
    var detail = event && event.detail;
    if (!detail || detail.preset !== "settings-content") return;
    dismissHint(LANGUAGE_HINT_ID);
  }

  function onWorldFormFocusIn(event) {
    var inputElement;
    if (!event || !event.target) return;
    inputElement = event.target;
    if (!inputElement.classList || !inputElement.classList.contains("worlds-compose-input")) return;
    if (inputElement.name === "name") {
      dismissHint(WORLD_NAME_HINT_ID);
      return;
    }
    if (inputElement.name === "seed") {
      dismissHint(WORLD_SEED_HINT_ID);
    }
  }

  function onWorldFormClick(event) {
    if (!event || !event.target) return;
    if (event.target.closest(WORLD_CREATE_SELECTOR)) {
      dismissHint(WORLD_CREATE_HINT_ID);
    }
  }

  function ensureRoots() {
    if (!desktopIconsRoot) {
      desktopIconsRoot = document.getElementById("desktopIcons");
    }
    if (!settingsContentRoot) {
      settingsContentRoot = document.getElementById("settingsContent");
    }
    if (!worldFormRoot) {
      worldFormRoot = document.getElementById(WORLD_FORM_ID);
    }
  }

  function bindListeners() {
    ensureRoots();
    if (desktopIconsRoot) {
      desktopIconsRoot.addEventListener("click", onDesktopIconsClick, true);
    }
    if (settingsContentRoot) {
      settingsContentRoot.addEventListener("click", onSettingsContentClick);
    }
    if (worldFormRoot) {
      worldFormRoot.addEventListener("focusin", onWorldFormFocusIn);
      worldFormRoot.addEventListener("click", onWorldFormClick);
    }
    window.addEventListener("web-desktop-icons-ready", syncDesktopIconHints);
    window.addEventListener("web-settings-open", scheduleLanguageHintSync);
    window.addEventListener("web-settings-tab-changed", scheduleLanguageHintSync);
    window.addEventListener("web-desktop-window-closed", onSettingsWindowClosed);
    window.addEventListener("web-start-page-open", scheduleWorldTerminalHintSync);
  }

  function init() {
    if (initialized) return;
    initialized = true;
    if (window.WebMenuDeferredStyles && window.WebMenuDeferredStyles.ensureForLayer) {
      window.WebMenuDeferredStyles.ensureForLayer("hints");
    }
    ensureRoots();
    bindListeners();
    syncDesktopIconHints();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.WebNewPlayerHints = {
    dismissHint: dismissHint,
    syncDesktopIconHints: syncDesktopIconHints,
    syncLanguageHint: syncLanguageHint,
    syncWorldTerminalHints: syncWorldTerminalHints
  };
})();
