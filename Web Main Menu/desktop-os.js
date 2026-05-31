var WebDesktop = (function () {
  var ICON_LAYOUTS_STORAGE_KEY = "cm-menu-icon-layouts";
  var ICON_LAYOUT_BOOTSTRAP_CLASS = "menu-icon-layout-bootstrap";
  var ICON_LAYOUT_BOOTSTRAP_STYLE_ID = "cm-desktop-icon-layout-bootstrap";
  var ICON_DRAG_SOUND_STEP_PX = 300;
  var ICON_DRAG_START_THRESHOLD_PX = 8;
  var ICON_CLICK_SUPPRESS_MS = 400;
  var ICON_GRID_CELL_WIDTH = 88;
  var ICON_GRID_CELL_HEIGHT = 104;
  var ICON_GRID_SNAP_FOOTPRINT = 88;
  var ICON_GRID_POINTER_EDGE_INSET = 12;
  var cachedIconGridLayout = null;

  var WINDOW_PRESET_TITLE = "menu-splash";

  var ICON_TO_PRESET = {
    worlds: "connect-col-0",
    servers: "connect-col-1",
    steam: "connect-col-2",
    settings: "settings-content",
    games: "extras-games",
    art: "extras-art",
    links: "extras-links",
    credits: "credits-content",
    title: WINDOW_PRESET_TITLE
  };

  var APP_WINDOW_PRESETS = [
    "connect-col-0",
    "connect-col-1",
    "connect-col-2",
    "settings-content",
    "extras-games",
    "extras-art",
    "extras-links",
    "credits-content"
  ];

  var ICON_ACTION_DISCONNECT = "disconnect";
  var ICON_ACTION_QUIT = "quit";

  var DEFAULT_ICON_LAYOUTS = {
    servers: { centerOffsetX: -135, centerOffsetY: 245 },
    worlds: { centerOffsetX: -45, centerOffsetY: 245 },
    steam: { centerOffsetX: 46, centerOffsetY: 245 },
    title: { centerOffsetX: -500, centerOffsetY: 365 },
    credits: { centerOffsetX: -410, centerOffsetY: 365 },
    links: { centerOffsetX: -315, centerOffsetY: 365 },
    settings: { centerOffsetX: -135, centerOffsetY: 365 },
    quit: { centerOffsetX: -45, centerOffsetY: 365 },
    disconnect: { centerOffsetX: 46, centerOffsetY: 365 },
    games: { centerOffsetX: 230, centerOffsetY: 365 },
    art: { centerOffsetX: 320, centerOffsetY: 365 }
  };

  var savedIconLayoutTable = {};
  var iconLayoutSaveTimer = 0;
  var activeIconDrag = null;
  var pendingIconPress = null;
  var suppressIconActivationIconId = "";
  var suppressIconActivationIconIds = {};
  var suppressIconClickTimer = 0;
  var iconPointerGestureId = 0;
  var iconActivatedGestureId = -1;
  var selectedIconIds = {};
  var activeMarqueeSelect = null;
  var desktopMarqueeBox = null;

  var DESKTOP_MARQUEE_MIN_SIZE_PX = 4;
  var ICON_SELECTED_CLASS = "os-desktop-icon--selected";
  var ICON_DISABLED_CLASS = "os-desktop-icon--disabled";

  var desktopSurface = null;
  var desktopIconsRoot = null;
  var desktopWorkspace = null;

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function postQuitToUnity() {
    if (!isUnityHost()) return;
    window.vuplex.postMessage(JSON.stringify({ eventName: "web-quit" }));
  }

  function closeWebBrowserTab() {
    if (isUnityHost()) return;
    var closed = false;
    try {
      window.open("", "_self");
      closed = window.close();
    } catch (error) {
    }
    if (closed) return;
    try {
      if (window.top && window.top !== window) {
        window.top.open("", "_self");
        closed = window.top.close();
      }
    } catch (error) {
    }
    if (closed) return;
    try {
      if (window.opener) {
        window.opener.focus();
        closed = window.close();
      }
    } catch (error) {
    }
    if (closed) return;
    try {
      window.location.replace("about:blank");
    } catch (error) {
    }
  }

  function getIconIdFromElement(iconElement) {
    if (!iconElement) return "";
    return iconElement.getAttribute("data-desktop-icon") || "";
  }

  function isGameMode() {
    if (window.WebMenuMode === "game") return true;
    var device = document.getElementById("device");
    return !!device && device.classList.contains("menu-mode--game");
  }

  function isDesktopIconActionEnabled(iconElement) {
    var iconId;
    if (!iconElement) return false;
    iconId = iconElement.getAttribute("data-desktop-icon");
    if (iconId === ICON_ACTION_DISCONNECT) {
      return isGameMode();
    }
    return true;
  }

  function getWindowManager() {
    return window.WebWindowManager;
  }

  function getPresetForIconId(iconId) {
    if (!iconId) return "";
    if (Object.prototype.hasOwnProperty.call(ICON_TO_PRESET, iconId)) {
      return ICON_TO_PRESET[iconId];
    }
    return "";
  }

  function getWindowByPreset(presetName) {
    if (!desktopSurface) {
      desktopSurface = document.getElementById("desktopSurface");
    }
    if (!desktopSurface || !presetName) return null;
    return desktopSurface.querySelector('.os-window[data-wm-preset="' + presetName + '"]');
  }

  function isWindowVisible(windowElement) {
    if (!windowElement) return false;
    return !windowElement.classList.contains("os-window--closed");
  }

  function runWindowOpenHooks(windowElement, presetName) {
    if (presetName === "connect-col-0" || presetName === "connect-col-1" || presetName === "connect-col-2") {
      if (window.WebStartMenu && window.WebStartMenu.renderAllLists) {
        window.WebStartMenu.renderAllLists();
      }
      window.dispatchEvent(new CustomEvent("web-start-page-open"));
      return;
    }
    if (presetName === "settings-content") {
      if (window.WebSettings && window.WebSettings.bindToWindow) {
        window.WebSettings.bindToWindow(windowElement);
      }
      if (window.WebSettingsBridge) {
        window.WebSettingsBridge.open();
      }
      window.dispatchEvent(new CustomEvent("web-settings-open"));
      return;
    }
    if (presetName === "extras-games") {
      if (window.WebExtras && window.WebExtras.openGamesPanel) {
        window.WebExtras.openGamesPanel(windowElement);
      }
      return;
    }
    if (presetName === "extras-art") {
      if (window.WebExtras && window.WebExtras.openArtPanel) {
        window.WebExtras.openArtPanel(windowElement);
      }
      return;
    }
    if (presetName === "extras-links") {
      if (window.WebExtras && window.WebExtras.openLinksPanel) {
        window.WebExtras.openLinksPanel(windowElement);
      }
      return;
    }
    if (presetName === "credits-content") {
      if (window.WebCredits && window.WebCredits.renderIntoWindow) {
        window.WebCredits.renderIntoWindow(windowElement);
      }
    }
  }

  function showWindowElement(windowElement, playOpenAnimation) {
    if (!windowElement) return null;
    var presetName = windowElement.getAttribute("data-wm-preset");
    windowElement.classList.remove("os-window--closed");
    windowElement.style.visibility = "visible";

    var windowManager = getWindowManager();
    if (!windowManager) {
      runWindowOpenHooks(windowElement, presetName);
      return windowElement;
    }

    if (windowManager.setSavedWindowOpen) {
      windowManager.setSavedWindowOpen(windowElement, true);
    }

    if (windowElement.classList.contains("os-window--minimized") && windowManager.restoreWindow) {
      windowManager.restoreWindow(windowElement);
    }

    if (windowManager.ensureWindowStructure) {
      windowManager.ensureWindowStructure(windowElement);
    }
    if (windowManager.syncWindowLayout) {
      windowManager.syncWindowLayout(windowElement);
    }
    if (windowManager.relayoutActivePage) {
      windowManager.relayoutActivePage();
    }

    if (playOpenAnimation !== false && windowManager.playWindowOpen) {
      windowManager.playWindowOpen(windowElement, 0);
    }

    runWindowOpenHooks(windowElement, presetName);

    if (windowManager.focusWindow) {
      windowManager.focusWindow(windowElement);
    }
    if (windowManager.setWindowKeyboardFocus) {
      windowManager.setWindowKeyboardFocus(windowElement);
    }

    if (windowManager.scheduleWindowLayoutsSave) {
      windowManager.scheduleWindowLayoutsSave();
    }

    updateDesktopTabOrder();

    return windowElement;
  }

  function hideWindowElement(windowElement) {
    if (!windowElement) return;
    var windowManager = getWindowManager();
    if (windowManager && windowManager.closeWindow) {
      windowManager.closeWindow(windowElement);
      return;
    }
    windowElement.classList.add("os-window--closed");
    if (windowManager && windowManager.scheduleWindowLayoutsSave) {
      windowManager.scheduleWindowLayoutsSave();
    }
  }

  function openWindow(presetName, playOpenAnimation) {
    return showWindowElement(getWindowByPreset(presetName), playOpenAnimation);
  }

  function openDesktopWindow(presetName, playOpenAnimation) {
    var windowElement = getWindowByPreset(presetName);
    if (!windowElement) return null;

    if (!isWindowVisible(windowElement)) {
      return showWindowElement(windowElement, playOpenAnimation);
    }

    var windowManager = getWindowManager();
    if (windowElement.classList.contains("os-window--minimized") && windowManager && windowManager.restoreWindow) {
      windowManager.restoreWindow(windowElement);
    }
    if (windowManager && windowManager.ensureWindowStructure) {
      windowManager.ensureWindowStructure(windowElement);
    }
    if (windowManager && windowManager.syncWindowLayout) {
      windowManager.syncWindowLayout(windowElement);
    }
    if (windowManager && windowManager.relayoutActivePage) {
      windowManager.relayoutActivePage();
    }
    runWindowOpenHooks(windowElement, presetName);
    if (windowManager && windowManager.focusWindow) {
      windowManager.focusWindow(windowElement);
    }
    if (windowManager && windowManager.setWindowKeyboardFocus) {
      windowManager.setWindowKeyboardFocus(windowElement);
    }
    if (windowManager && windowManager.scheduleWindowLayoutsSave) {
      windowManager.scheduleWindowLayoutsSave();
    }
    return windowElement;
  }

  function toggleWindow(presetName, playOpenAnimation) {
    var windowElement = getWindowByPreset(presetName);
    if (!windowElement) return null;
    if (!isWindowVisible(windowElement)) {
      return showWindowElement(windowElement, playOpenAnimation);
    }
    if (windowElement.classList.contains("os-window--minimized")) {
      return openDesktopWindow(presetName, playOpenAnimation);
    }
    hideWindowElement(windowElement);
    return windowElement;
  }

  function closeWindow(presetName) {
    hideWindowElement(getWindowByPreset(presetName));
  }

  function closeAllAppWindows() {
    var index = 0;
    for (index = 0; index < APP_WINDOW_PRESETS.length; index++) {
      closeWindow(APP_WINDOW_PRESETS[index]);
    }
  }

  function hasOpenAppWindows() {
    var index = 0;
    for (index = 0; index < APP_WINDOW_PRESETS.length; index++) {
      var windowElement = getWindowByPreset(APP_WINDOW_PRESETS[index]);
      if (isWindowVisible(windowElement)) return true;
    }
    return false;
  }

  function showDesktopHome() {
    closeAllAppWindows();
    openWindow(WINDOW_PRESET_TITLE, false);
  }

  function openWorldsDesktop() {
    openWindow("connect-col-0", true);
  }

  function openServersDesktop() {
    openWindow("connect-col-1", true);
  }

  function openSteamDesktop() {
    openWindow("connect-col-2", true);
  }

  function openStartDesktop() {
    openWindow("connect-col-0", true);
    openWindow("connect-col-1", false);
    openWindow("connect-col-2", false);
  }

  function openSettingsDesktop() {
    openWindow("settings-content", true);
  }

  function openGamesDesktop() {
    openWindow("extras-games", true);
  }

  function openArtDesktop() {
    openWindow("extras-art", true);
  }

  function openLinksDesktop() {
    openWindow("extras-links", true);
  }

  function openCreditsDesktop() {
    openWindow("credits-content", true);
  }

  function openExtrasDesktop() {
    openGamesDesktop();
  }

  function onIconActivated(iconElement) {
    var iconId = iconElement.getAttribute("data-desktop-icon");
    if (!iconId) return;
    if (!isDesktopIconActionEnabled(iconElement)) return;

    if (iconId === ICON_ACTION_DISCONNECT) {
      if (window.WebMenu) {
        window.WebMenu.dispatchMenuEvent("web-exit-to-menu");
      }
      return;
    }

    if (iconId === ICON_ACTION_QUIT) {
      if (isUnityHost()) {
        postQuitToUnity();
      } else {
        closeWebBrowserTab();
      }
      return;
    }

    if (iconId === "title") {
      toggleWindow(WINDOW_PRESET_TITLE, true);
      return;
    }

    var presetName = getPresetForIconId(iconId);
    if (presetName) {
      toggleWindow(presetName, true);
    }
  }

  function getLayoutCoords() {
    return window.WebMenuLayoutCoords;
  }

  function setSavedIconLayout(iconId, layout) {
    var layoutRoot;
    var coords;
    var storedLayout;
    if (!iconId || !layout) return;
    layoutRoot = getIconLayoutRoot();
    coords = getLayoutCoords();
    if (!coords || !layoutRoot) return;
    storedLayout = coords.normalizeIconStoredLayout(layout, layoutRoot);
    if (!storedLayout) return;
    savedIconLayoutTable[iconId] = storedLayout;
  }

  function populateDefaultIconLayoutTable() {
    var iconId;
    savedIconLayoutTable = {};
    for (iconId in DEFAULT_ICON_LAYOUTS) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULT_ICON_LAYOUTS, iconId)) continue;
      setSavedIconLayout(iconId, getDefaultIconLayoutEntry(iconId));
    }
  }

  function mergePersistedIconLayoutPayload(payload) {
    var layouts = payload && payload.layouts ? payload.layouts : [];
    var coords = getLayoutCoords();
    var index = 0;
    if (!coords) return;
    for (index = 0; index < layouts.length; index++) {
      var entry = layouts[index];
      var iconId;
      if (!entry || !entry.iconId) continue;
      if (!coords.isCenterLayoutEntry(entry)) continue;
      iconId = entry.iconId;
      if (iconId === "about") {
        iconId = "credits";
      }
      setSavedIconLayout(iconId, entry);
    }
  }

  function populateSavedIconLayoutTable(payload) {
    populateDefaultIconLayoutTable();
    mergePersistedIconLayoutPayload(payload);
  }

  function readIconLayoutsFromStorage() {
    try {
      var raw = localStorage.getItem(ICON_LAYOUTS_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function writeIconLayoutsToStorage(payload) {
    try {
      localStorage.setItem(ICON_LAYOUTS_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
    }
  }

  function getPersistedIconLayoutsPayload() {
    if (window.__cmIconLayoutsPayload) {
      return window.__cmIconLayoutsPayload;
    }
    return readIconLayoutsFromStorage();
  }

  function clearIconLayoutBootstrap() {
    document.documentElement.classList.remove(ICON_LAYOUT_BOOTSTRAP_CLASS);
    var styleElement = document.getElementById(ICON_LAYOUT_BOOTSTRAP_STYLE_ID);
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
    if (window.__cmIconLayoutsPayload) {
      window.__cmIconLayoutsPayload = null;
    }
  }

  function applyIconCenterOffsetPosition(iconElement, layoutEntry) {
    var offsetX;
    var offsetY;
    if (!iconElement || !layoutEntry) return false;
    offsetX = Math.round(layoutEntry.centerOffsetX || 0);
    offsetY = Math.round(layoutEntry.centerOffsetY || 0);
    iconElement.style.left = "calc(50% + " + offsetX + "px)";
    iconElement.style.top = "calc(50% + " + offsetY + "px)";
    iconElement.style.right = "auto";
    iconElement.style.bottom = "auto";
    iconElement.style.transform = "";
    iconElement.classList.add("os-desktop-icon--placed");
    iconElement.classList.add("os-desktop-icon--center-anchor");
    return true;
  }

  function applySavedIconLayout(iconElement) {
    var iconId = iconElement.getAttribute("data-desktop-icon");
    var savedLayout = savedIconLayoutTable[iconId];
    var layoutRoot;
    var coords;
    var absolutePosition;
    if (!savedLayout || !desktopSurface) return;

    coords = getLayoutCoords();
    if (!coords) return;
    if (coords.isCenterLayoutEntry(savedLayout)) {
      applyIconCenterOffsetPosition(iconElement, savedLayout);
      return;
    }

    layoutRoot = getIconLayoutRoot();
    if (!layoutRoot) return;
    absolutePosition = coords.resolveAbsolutePosition(savedLayout, layoutRoot);
    applyIconPosition(iconElement, absolutePosition.left, absolutePosition.top, false);
  }

  function getDesktopTabSortRoot() {
    if (!desktopWorkspace) {
      desktopWorkspace = document.getElementById("desktopWorkspace");
    }
    return desktopWorkspace || desktopSurface;
  }

  function getDesktopTabSortRowColumn(element) {
    var layoutRoot = getDesktopTabSortRoot();
    var layoutRect;
    var elementRect;
    var left;
    var top;
    var column;
    var row;
    var gridCell;
    if (!layoutRoot || !element) {
      return { column: 0, row: 0 };
    }
    layoutRect = layoutRoot.getBoundingClientRect();
    elementRect = element.getBoundingClientRect();
    left = elementRect.left - layoutRect.left;
    top = elementRect.top - layoutRect.top;
    gridCell = getIconGridCellFromLayoutPoint(left, top);
    column = gridCell.column;
    row = gridCell.row;
    if (column < 0) {
      column = 0;
    }
    if (row < 0) {
      row = 0;
    }
    return {
      column: column,
      row: row
    };
  }

  function compareDesktopTabOrder(elementA, elementB) {
    var sortKeyA = getDesktopTabSortRowColumn(elementA);
    var sortKeyB = getDesktopTabSortRowColumn(elementB);
    if (sortKeyA.row !== sortKeyB.row) {
      return sortKeyA.row - sortKeyB.row;
    }
    return sortKeyA.column - sortKeyB.column;
  }

  function isDesktopWindowTabEligible(windowElement) {
    if (!windowElement || !desktopSurface) return false;
    if (!desktopSurface.contains(windowElement)) return false;
    if (!windowElement.classList.contains("os-window--managed")) return false;
    if (windowElement.classList.contains("os-window--closed")) return false;
    return true;
  }

  function getDesktopWindowTabStop(windowElement) {
    var controlsElement;
    if (!windowElement) return null;
    controlsElement = windowElement.querySelector(".os-window-controls");
    if (!controlsElement) return null;
    return controlsElement.querySelector(".os-window-control");
  }

  function clearDesktopWindowTabStops() {
    var windows;
    var index;
    var windowElement;
    var controlElements;
    var controlIndex;
    if (!desktopSurface) return;
    windows = desktopSurface.querySelectorAll(".os-window[data-wm-preset]");
    for (index = 0; index < windows.length; index++) {
      windowElement = windows[index];
      controlElements = windowElement.querySelectorAll(".os-window-control");
      for (controlIndex = 0; controlIndex < controlElements.length; controlIndex++) {
        controlElements[controlIndex].tabIndex = -1;
      }
    }
  }

  function updateDesktopTabOrder() {
    var icons;
    var windows;
    var tabStopEntries = [];
    var sortedIcons = [];
    var index;
    var tabIndex;
    var iconElement;
    var windowElement;
    var tabStopElement;
    if (!desktopIconsRoot) return;
    clearDesktopWindowTabStops();
    icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    for (index = 0; index < icons.length; index++) {
      iconElement = icons[index];
      if (iconElement.hidden) {
        iconElement.tabIndex = -1;
        continue;
      }
      tabStopEntries.push({
        sortElement: iconElement,
        tabStopElement: iconElement,
        isIcon: true
      });
    }
    if (desktopSurface) {
      windows = desktopSurface.querySelectorAll(".os-window[data-wm-preset]");
      for (index = 0; index < windows.length; index++) {
        windowElement = windows[index];
        if (!isDesktopWindowTabEligible(windowElement)) continue;
        tabStopElement = getDesktopWindowTabStop(windowElement);
        if (!tabStopElement) continue;
        tabStopEntries.push({
          sortElement: windowElement,
          tabStopElement: tabStopElement,
          isIcon: false
        });
      }
    }
    tabStopEntries.sort(function (entryA, entryB) {
      return compareDesktopTabOrder(entryA.sortElement, entryB.sortElement);
    });
    tabIndex = 1;
    for (index = 0; index < tabStopEntries.length; index++) {
      tabStopEntries[index].tabStopElement.tabIndex = tabIndex;
      tabIndex = tabIndex + 1;
      if (tabStopEntries[index].isIcon) {
        sortedIcons.push(tabStopEntries[index].sortElement);
      }
    }
    for (index = 0; index < sortedIcons.length; index++) {
      desktopIconsRoot.appendChild(sortedIcons[index]);
    }
  }

  function applyAllSavedIconLayouts() {
    if (!desktopIconsRoot) return;
    var icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    var index = 0;
    for (index = 0; index < icons.length; index++) {
      applySavedIconLayout(icons[index]);
    }
    updateDesktopTabOrder();
  }

  function syncIconLayoutFromElement(iconElement) {
    if (!desktopSurface) return;
    var iconId = iconElement.getAttribute("data-desktop-icon");
    if (!iconId) return;
    var layoutPosition = getIconLayoutPosition(iconElement);
    setSavedIconLayout(iconId, {
      left: layoutPosition.left,
      top: layoutPosition.top
    });
  }

  function buildIconLayoutsPayload() {
    var layouts = [];
    var iconId;
    var layout;
    var coords;
    var payloadEntry;
    coords = getLayoutCoords();
    if (!coords) return { layouts: layouts };
    for (iconId in savedIconLayoutTable) {
      if (!Object.prototype.hasOwnProperty.call(savedIconLayoutTable, iconId)) continue;
      layout = savedIconLayoutTable[iconId];
      payloadEntry = coords.exportIconPayloadEntry(layout);
      if (!payloadEntry) continue;
      payloadEntry.iconId = iconId;
      layouts.push(payloadEntry);
    }
    return { layouts: layouts };
  }

  function clearIconElementLayoutStyle(iconElement) {
    if (!iconElement) return;
    iconElement.style.left = "";
    iconElement.style.top = "";
    iconElement.style.right = "";
    iconElement.style.bottom = "";
    iconElement.style.transform = "";
    iconElement.classList.remove("os-desktop-icon--placed");
    iconElement.classList.remove("os-desktop-icon--center-anchor");
  }

  function getDefaultIconLayoutEntry(iconId) {
    var layout;
    if (!iconId) return null;
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_ICON_LAYOUTS, iconId)) return null;
    layout = DEFAULT_ICON_LAYOUTS[iconId];
    return {
      anchor: "center",
      centerOffsetX: layout.centerOffsetX,
      centerOffsetY: layout.centerOffsetY
    };
  }

  function applyDefaultIconLayout(iconElement, iconId) {
    var coords;
    var defaultLayout;
    if (!iconElement || !iconId) return false;
    defaultLayout = getDefaultIconLayoutEntry(iconId);
    if (!defaultLayout) return false;
    coords = getLayoutCoords();
    if (!coords) return false;
    if (coords.isCenterLayoutEntry(defaultLayout)) {
      return applyIconCenterOffsetPosition(iconElement, defaultLayout);
    }
    return false;
  }

  function captureAllDefaultIconLayouts() {
    var defaultsTable = {};
    var iconId;
    for (iconId in DEFAULT_ICON_LAYOUTS) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULT_ICON_LAYOUTS, iconId)) continue;
      defaultsTable[iconId] = getDefaultIconLayoutEntry(iconId);
    }
    return defaultsTable;
  }

  function getCurrentDesktopIconLayout(iconElement) {
    var iconId;
    var layoutPosition;
    var layoutRoot;
    var coords;
    if (!iconElement || iconElement.hidden) return null;
    iconId = getIconIdFromElement(iconElement);
    if (!iconId) return null;
    layoutPosition = getIconLayoutPosition(iconElement);
    layoutRoot = getIconLayoutRoot();
    coords = getLayoutCoords();
    if (!coords || !layoutRoot) return null;
    var centerOffsets = coords.absoluteToCenterOffset(
      layoutPosition.left,
      layoutPosition.top,
      layoutRoot
    );
    return {
      iconId: iconId,
      anchor: coords.ANCHOR_CENTER,
      centerOffsetX: centerOffsets.centerOffsetX,
      centerOffsetY: centerOffsets.centerOffsetY
    };
  }

  function buildIconLayoutDiffEntry(currentEntry, defaultEntry) {
    var diffEntry = { iconId: currentEntry.iconId };
    var hasChange = false;
    var coords = getLayoutCoords();
    if (!coords) return null;

    diffEntry.anchor = coords.ANCHOR_CENTER;
    if (
      coords.isCenterOffsetDifferent(
        coords.roundNiceOffset(currentEntry.centerOffsetX),
        coords.roundNiceOffset(defaultEntry.centerOffsetX)
      )
    ) {
      diffEntry.centerOffsetX = coords.roundNiceOffset(currentEntry.centerOffsetX);
      hasChange = true;
    }
    if (
      coords.isCenterOffsetDifferent(
        coords.roundNiceOffset(currentEntry.centerOffsetY),
        coords.roundNiceOffset(defaultEntry.centerOffsetY)
      )
    ) {
      diffEntry.centerOffsetY = coords.roundNiceOffset(currentEntry.centerOffsetY);
      hasChange = true;
    }
    if (!hasChange) return null;
    return diffEntry;
  }

  function buildIconLayoutsDiffFromDefaultsPayload() {
    var defaultsTable = captureAllDefaultIconLayouts();
    var layouts = [];
    var icons;
    var index;
    var iconElement;
    var iconId;
    var defaultEntry;
    var currentEntry;
    var diffEntry;

    if (!desktopIconsRoot) return { layouts: layouts };

    icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    for (index = 0; index < icons.length; index++) {
      iconElement = icons[index];
      iconId = getIconIdFromElement(iconElement);
      if (!iconId) continue;
      defaultEntry = defaultsTable[iconId];
      if (!defaultEntry) continue;
      currentEntry = getCurrentDesktopIconLayout(iconElement);
      if (!currentEntry) continue;
      diffEntry = buildIconLayoutDiffEntry(currentEntry, defaultEntry);
      if (diffEntry) layouts.push(diffEntry);
    }

    return { layouts: layouts };
  }

  function logIconLayoutsDiffFromDefaults() {
    var payload = buildIconLayoutsDiffFromDefaultsPayload();
    console.log(
      "[cm-menu-icon-layouts] Paste this JSON (rounded center offsets; only changed from default grid):"
    );
    console.log(JSON.stringify(payload, null, 2));
    return payload;
  }

  function postIconLayoutsSave() {
    var payload = buildIconLayoutsPayload();
    if (!isUnityHost()) {
      writeIconLayoutsToStorage(payload);
      return;
    }
    window.vuplex.postMessage(
      JSON.stringify({
        eventName: "web-icon-layout-save",
        layoutsJson: JSON.stringify(payload)
      })
    );
  }

  function scheduleIconLayoutsSave() {
    if (iconLayoutSaveTimer) window.clearTimeout(iconLayoutSaveTimer);
    iconLayoutSaveTimer = window.setTimeout(function () {
      iconLayoutSaveTimer = 0;
      postIconLayoutsSave();
    }, 120);
  }

  function loadPersistedIconLayouts() {
    populateDefaultIconLayoutTable();
    mergePersistedIconLayoutPayload(getPersistedIconLayoutsPayload());
    applyAllSavedIconLayouts();
  }

  function isIconSnapToGridEnabled() {
    if (window.WebSettings && window.WebSettings.isMenuIconSnapToGridEnabled) {
      return window.WebSettings.isMenuIconSnapToGridEnabled();
    }
    return true;
  }

  function getIconLayoutRoot() {
    if (!desktopIconsRoot) {
      desktopIconsRoot = document.getElementById("desktopIcons");
    }
    return desktopIconsRoot || desktopSurface;
  }

  function getIconMetrics(iconElement) {
    if (!iconElement) {
      return {
        width: ICON_GRID_CELL_WIDTH,
        height: ICON_GRID_CELL_HEIGHT
      };
    }
    return {
      width: iconElement.offsetWidth,
      height: iconElement.offsetHeight
    };
  }

  function getDesktopPlacementSize() {
    var sizeRoot = desktopSurface || getIconLayoutRoot();
    var layoutRect;
    var width;
    var height;
    if (!sizeRoot) {
      return { width: 0, height: 0 };
    }
    layoutRect = sizeRoot.getBoundingClientRect();
    width = Math.ceil(layoutRect.width);
    height = Math.ceil(layoutRect.height);
    if (width < 1) width = sizeRoot.clientWidth;
    if (height < 1) height = sizeRoot.clientHeight;
    if (width < 1) width = 0;
    if (height < 1) height = 0;
    return {
      width: width,
      height: height
    };
  }

  function clearIconGridLayoutCache() {
    cachedIconGridLayout = null;
  }

  function getIconGridLayout() {
    var placementSize;
    var width;
    var height;
    var columnCount;
    var rowCount;
    var columnStep;
    var rowStep;
    var maxColumn;
    var maxRow;
    if (cachedIconGridLayout) {
      return cachedIconGridLayout;
    }
    placementSize = getDesktopPlacementSize();
    width = placementSize.width;
    height = placementSize.height;
    columnCount = Math.max(
      1,
      Math.floor((width - ICON_GRID_SNAP_FOOTPRINT) / ICON_GRID_CELL_WIDTH) + 1
    );
    rowCount = Math.max(
      1,
      Math.floor((height - ICON_GRID_SNAP_FOOTPRINT) / ICON_GRID_CELL_HEIGHT) + 1
    );
    while (
      columnCount > 1 &&
      (columnCount - 1) * ICON_GRID_CELL_WIDTH + ICON_GRID_SNAP_FOOTPRINT > width
    ) {
      columnCount = columnCount - 1;
    }
    while (
      rowCount > 1 &&
      (rowCount - 1) * ICON_GRID_CELL_HEIGHT + ICON_GRID_SNAP_FOOTPRINT > height
    ) {
      rowCount = rowCount - 1;
    }
    if (columnCount > 1) {
      columnStep = (width - ICON_GRID_SNAP_FOOTPRINT) / (columnCount - 1);
    } else {
      columnStep = 0;
    }
    if (rowCount > 1) {
      rowStep = (height - ICON_GRID_SNAP_FOOTPRINT) / (rowCount - 1);
    } else {
      rowStep = 0;
    }
    maxColumn = columnCount - 1;
    maxRow = rowCount - 1;
    if (maxColumn < 0) maxColumn = 0;
    if (maxRow < 0) maxRow = 0;
    cachedIconGridLayout = {
      startLeft: 0,
      startTop: 0,
      columnStep: columnStep,
      rowStep: rowStep,
      maxColumn: maxColumn,
      maxRow: maxRow
    };
    return cachedIconGridLayout;
  }

  function getIconGridBounds() {
    var layout = getIconGridLayout();
    return { maxColumn: layout.maxColumn, maxRow: layout.maxRow };
  }

  function getIconGridMaxAnchorPosition() {
    var bounds = getIconGridBounds();
    return getIconGridPosition(bounds.maxColumn, bounds.maxRow);
  }

  function getIconGridCellFromLayoutPoint(left, top) {
    var layout = getIconGridLayout();
    var column = 0;
    var row = 0;
    if (layout.columnStep > 0) {
      column = Math.floor(
        (left - layout.startLeft + layout.columnStep * 0.5) / layout.columnStep
      );
    }
    if (layout.rowStep > 0) {
      row = Math.floor((top - layout.startTop + layout.rowStep * 0.5) / layout.rowStep);
    }
    return clampIconGridCell(column, row);
  }

  function getIconGridCellFromDropLayout(left, top, clientX, clientY, iconElement) {
    var bounds = getIconGridBounds();
    var maxGridAnchor = getIconGridMaxAnchorPosition();
    var cell = getIconGridCellFromLayoutPoint(left, top);
    var layoutRoot;
    var layoutRect;
    var pointerLeft;
    var pointerTop;
    if (left >= maxGridAnchor.left) {
      cell.column = bounds.maxColumn;
    }
    if (top >= maxGridAnchor.top) {
      cell.row = bounds.maxRow;
    }
    if (clientX == null || clientY == null) {
      return clampIconGridCell(cell.column, cell.row);
    }
    layoutRoot = getIconLayoutRoot();
    if (!layoutRoot) {
      return clampIconGridCell(cell.column, cell.row);
    }
    layoutRect = layoutRoot.getBoundingClientRect();
    pointerLeft = clientX - layoutRect.left;
    pointerTop = clientY - layoutRect.top;
    if (pointerLeft >= maxGridAnchor.left) {
      cell.column = bounds.maxColumn;
    }
    if (pointerTop >= maxGridAnchor.top) {
      cell.row = bounds.maxRow;
    }
    return clampIconGridCell(cell.column, cell.row);
  }

  function snapIconPosition(left, top, iconElement) {
    var cell = getIconGridCellFromLayoutPoint(left, top);
    return getIconGridPosition(cell.column, cell.row);
  }

  function getIconGridCell(left, top) {
    return getIconGridCellFromLayoutPoint(left, top);
  }

  function getIconGridCellFromPointer(left, top, iconElement) {
    return getIconGridCellFromLayoutPoint(left, top);
  }

  function clampIconGridCell(column, row) {
    var bounds = getIconGridBounds();
    if (column < 0) column = 0;
    if (row < 0) row = 0;
    if (column > bounds.maxColumn) column = bounds.maxColumn;
    if (row > bounds.maxRow) row = bounds.maxRow;
    return { column: column, row: row };
  }

  function getIconGridPosition(column, row) {
    var layout = getIconGridLayout();
    return {
      left: Math.round(layout.startLeft + column * layout.columnStep),
      top: Math.round(layout.startTop + row * layout.rowStep)
    };
  }

  function getIconOccupiedCellKey(column, row) {
    return String(column) + "," + String(row);
  }

  function getIconLayoutPosition(iconElement) {
    var left = parseFloat(iconElement.style.left);
    var top = parseFloat(iconElement.style.top);
    if (!isNaN(left) && !isNaN(top) && iconElement.classList.contains("os-desktop-icon--placed")) {
      return { left: left, top: top };
    }
    if (!desktopSurface) return { left: 0, top: 0 };
    var layoutRoot = getIconLayoutRoot();
    var layoutRect = layoutRoot.getBoundingClientRect();
    var iconRect = iconElement.getBoundingClientRect();
    return {
      left: iconRect.left - layoutRect.left,
      top: iconRect.top - layoutRect.top
    };
  }

  function isIconGridCellWithinBounds(column, row) {
    var bounds = getIconGridBounds();
    if (column < 0 || row < 0) return false;
    if (column > bounds.maxColumn) return false;
    if (row > bounds.maxRow) return false;
    return true;
  }

  function getOccupiedGridCell(iconElement) {
    var layoutPosition = getIconLayoutPosition(iconElement);
    var cell = getIconGridCellFromLayoutPoint(layoutPosition.left, layoutPosition.top);
    if (!isIconGridCellWithinBounds(cell.column, cell.row)) return null;
    return { column: cell.column, row: cell.row };
  }

  function buildIconExcludeLookup(excludeIcons) {
    var lookup = {};
    var index;
    var iconId;
    if (!excludeIcons) return lookup;
    if (excludeIcons.length !== undefined) {
      for (index = 0; index < excludeIcons.length; index++) {
        iconId = getIconIdFromElement(excludeIcons[index]);
        if (iconId) lookup[iconId] = true;
      }
      return lookup;
    }
    iconId = getIconIdFromElement(excludeIcons);
    if (iconId) lookup[iconId] = true;
    return lookup;
  }

  function isIconExcludedFromOccupancy(iconElement, excludeLookup) {
    if (!excludeLookup) return false;
    return !!excludeLookup[getIconIdFromElement(iconElement)];
  }

  function getUnplacedGroupDragExcludeIcons(groupIconElements, placedIconElements) {
    var excludeIcons = [];
    var placedLookup = buildIconExcludeLookup(placedIconElements);
    var index;
    var iconElement;
    if (!groupIconElements || !groupIconElements.length) return excludeIcons;
    for (index = 0; index < groupIconElements.length; index++) {
      iconElement = groupIconElements[index];
      if (isIconExcludedFromOccupancy(iconElement, placedLookup)) continue;
      excludeIcons.push(iconElement);
    }
    return excludeIcons;
  }

  function resolveGroupDragSecondaryDropPosition(
    iconElement,
    startLeft,
    startTop,
    gridDeltaColumn,
    gridDeltaRow,
    pixelDeltaLeft,
    pixelDeltaTop,
    occupancyExcludeIcons
  ) {
    var targetLeft;
    var targetTop;
    var targetCell;
    if (isIconSnapToGridEnabled()) {
      targetCell = getIconGridCellFromLayoutPoint(startLeft, startTop);
      targetCell = clampIconGridCell(
        targetCell.column + gridDeltaColumn,
        targetCell.row + gridDeltaRow
      );
      return findClosestFreeGridSlot(targetCell.column, targetCell.row, occupancyExcludeIcons);
    }
    targetLeft = startLeft + pixelDeltaLeft;
    targetTop = startTop + pixelDeltaTop;
    return findClosestFreeIconPosition(iconElement, targetLeft, targetTop, occupancyExcludeIcons);
  }

  function buildOccupiedIconCells(excludeIcons) {
    var occupied = {};
    var excludeLookup = buildIconExcludeLookup(excludeIcons);
    var icons;
    var index;
    if (!desktopIconsRoot) return occupied;
    icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    for (index = 0; index < icons.length; index++) {
      var iconElement = icons[index];
      var cell;
      var cellKey;
      if (isIconExcludedFromOccupancy(iconElement, excludeLookup)) continue;
      if (iconElement.hidden) continue;
      cell = getOccupiedGridCell(iconElement);
      if (!cell) continue;
      cellKey = getIconOccupiedCellKey(cell.column, cell.row);
      occupied[cellKey] = true;
    }
    return occupied;
  }

  function findClosestFreeGridSlot(targetColumn, targetRow, excludeIcons) {
    var occupied = buildOccupiedIconCells(excludeIcons);
    var targetKey = getIconOccupiedCellKey(targetColumn, targetRow);
    var bounds = getIconGridBounds();
    var maxSearchRadius = bounds.maxColumn + bounds.maxRow + 8;
    var radius;
    if (!occupied[targetKey] && isIconGridCellWithinBounds(targetColumn, targetRow)) {
      return getIconGridPosition(targetColumn, targetRow);
    }
    for (radius = 1; radius <= maxSearchRadius; radius++) {
      var bestColumn = -1;
      var bestRow = -1;
      var bestDistanceSquared = -1;
      var deltaColumn;
      for (deltaColumn = -radius; deltaColumn <= radius; deltaColumn++) {
        var deltaRow;
        for (deltaRow = -radius; deltaRow <= radius; deltaRow++) {
          var column;
          var row;
          var cellKey;
          var distanceSquared;
          if (Math.abs(deltaColumn) !== radius && Math.abs(deltaRow) !== radius) {
            continue;
          }
          column = targetColumn + deltaColumn;
          row = targetRow + deltaRow;
          if (!isIconGridCellWithinBounds(column, row)) continue;
          cellKey = getIconOccupiedCellKey(column, row);
          if (occupied[cellKey]) continue;
          distanceSquared = deltaColumn * deltaColumn + deltaRow * deltaRow;
          if (bestDistanceSquared < 0 || distanceSquared < bestDistanceSquared) {
            bestDistanceSquared = distanceSquared;
            bestColumn = column;
            bestRow = row;
            continue;
          }
          if (distanceSquared === bestDistanceSquared) {
            if (row > bestRow || (row === bestRow && column > bestColumn)) {
              bestColumn = column;
              bestRow = row;
            }
          }
        }
      }
      if (bestDistanceSquared >= 0) {
        return getIconGridPosition(bestColumn, bestRow);
      }
    }
    var fallbackCell = clampIconGridCell(targetColumn, targetRow);
    return getIconGridPosition(fallbackCell.column, fallbackCell.row);
  }

  function resolveIconDropPosition(iconElement, left, top, clientX, clientY, excludeIcons) {
    var excludeTarget = excludeIcons || iconElement;
    if (isIconSnapToGridEnabled()) {
      var cell = getIconGridCellFromDropLayout(left, top, clientX, clientY, iconElement);
      return findClosestFreeGridSlot(cell.column, cell.row, excludeTarget);
    }
    return findClosestFreeIconPosition(iconElement, left, top, excludeTarget);
  }

  function getIconMinimumSeparation(iconElement) {
    var iconRect = iconElement.getBoundingClientRect();
    return iconRect.width * 0.5;
  }

  function getIconCenterFromLayoutPosition(left, top, iconElement) {
    var iconRect = iconElement.getBoundingClientRect();
    return {
      left: left + iconRect.width * 0.5,
      top: top + iconRect.height * 0.5
    };
  }

  function isIconDropPositionTooClose(left, top, iconElement, minSeparation, excludeIcons) {
    var icons;
    var index;
    var dropCenter;
    var minSeparationSquared;
    var excludeLookup;
    if (!desktopIconsRoot) return false;
    dropCenter = getIconCenterFromLayoutPosition(left, top, iconElement);
    minSeparationSquared = minSeparation * minSeparation;
    excludeLookup = buildIconExcludeLookup(excludeIcons || iconElement);
    icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    for (index = 0; index < icons.length; index++) {
      var otherIconElement = icons[index];
      var otherLayoutPosition;
      var otherCenter;
      var deltaX;
      var deltaY;
      var distanceSquared;
      if (isIconExcludedFromOccupancy(otherIconElement, excludeLookup)) continue;
      if (otherIconElement.hidden) continue;
      otherLayoutPosition = getIconLayoutPosition(otherIconElement);
      otherCenter = getIconCenterFromLayoutPosition(
        otherLayoutPosition.left,
        otherLayoutPosition.top,
        otherIconElement
      );
      deltaX = dropCenter.left - otherCenter.left;
      deltaY = dropCenter.top - otherCenter.top;
      distanceSquared = deltaX * deltaX + deltaY * deltaY;
      if (distanceSquared < minSeparationSquared) {
        return true;
      }
    }
    return false;
  }

  function findClosestFreeIconPosition(iconElement, targetLeft, targetTop, excludeIcons) {
    var minSeparation = getIconMinimumSeparation(iconElement);
    var targetPosition = clampIconPosition(iconElement, targetLeft, targetTop);
    var step = minSeparation;
    var maxSearchRadius = 32;
    var radius;
    var excludeTarget = excludeIcons || iconElement;
    if (
      !isIconDropPositionTooClose(
        targetPosition.left,
        targetPosition.top,
        iconElement,
        minSeparation,
        excludeTarget
      )
    ) {
      return targetPosition;
    }
    for (radius = 1; radius <= maxSearchRadius; radius++) {
      var bestLeft = -1;
      var bestTop = -1;
      var bestDistanceSquared = -1;
      var deltaStepX;
      for (deltaStepX = -radius; deltaStepX <= radius; deltaStepX++) {
        var deltaStepY;
        for (deltaStepY = -radius; deltaStepY <= radius; deltaStepY++) {
          var candidateLeft;
          var candidateTop;
          var candidatePosition;
          var deltaX;
          var deltaY;
          var distanceSquared;
          if (Math.abs(deltaStepX) !== radius && Math.abs(deltaStepY) !== radius) {
            continue;
          }
          candidateLeft = targetPosition.left + deltaStepX * step;
          candidateTop = targetPosition.top + deltaStepY * step;
          candidatePosition = clampIconPosition(iconElement, candidateLeft, candidateTop);
          if (
            isIconDropPositionTooClose(
              candidatePosition.left,
              candidatePosition.top,
              iconElement,
              minSeparation,
              excludeTarget
            )
          ) {
            continue;
          }
          deltaX = candidatePosition.left - targetPosition.left;
          deltaY = candidatePosition.top - targetPosition.top;
          distanceSquared = deltaX * deltaX + deltaY * deltaY;
          if (bestDistanceSquared < 0 || distanceSquared < bestDistanceSquared) {
            bestDistanceSquared = distanceSquared;
            bestLeft = candidatePosition.left;
            bestTop = candidatePosition.top;
            continue;
          }
          if (distanceSquared === bestDistanceSquared) {
            if (candidatePosition.top < bestTop) {
              bestLeft = candidatePosition.left;
              bestTop = candidatePosition.top;
              continue;
            }
            if (candidatePosition.top === bestTop && candidatePosition.left < bestLeft) {
              bestLeft = candidatePosition.left;
              bestTop = candidatePosition.top;
            }
          }
        }
      }
      if (bestDistanceSquared >= 0) {
        return { left: bestLeft, top: bestTop };
      }
    }
    return targetPosition;
  }

  function clampIconPosition(iconElement, left, top) {
    var layoutRoot = getIconLayoutRoot();
    if (!layoutRoot) return { left: left, top: top };
    var maxLeft;
    var maxTop;
    if (isIconSnapToGridEnabled()) {
      var gridMaxPosition = getIconGridMaxAnchorPosition();
      maxLeft = gridMaxPosition.left;
      maxTop = gridMaxPosition.top;
    } else {
      var placementSize = getDesktopPlacementSize();
      var metrics = getIconMetrics(iconElement);
      maxLeft = Math.max(0, placementSize.width - metrics.width);
      maxTop = Math.max(0, placementSize.height - metrics.height);
    }
    if (left < 0) left = 0;
    if (top < 0) top = 0;
    if (left > maxLeft) left = maxLeft;
    if (top > maxTop) top = maxTop;
    return { left: left, top: top };
  }

  function applyIconPosition(iconElement, left, top, snapToGrid) {
    if (snapToGrid && isIconSnapToGridEnabled()) {
      var snapped = snapIconPosition(left, top, iconElement);
      left = snapped.left;
      top = snapped.top;
    } else {
      var clamped = clampIconPosition(iconElement, left, top);
      left = clamped.left;
      top = clamped.top;
    }
    iconElement.classList.remove("os-desktop-icon--center-anchor");
    iconElement.style.right = "auto";
    iconElement.style.bottom = "auto";
    iconElement.style.transform = "";
    iconElement.style.left = String(Math.round(left)) + "px";
    iconElement.style.top = String(Math.round(top)) + "px";
    iconElement.classList.add("os-desktop-icon--placed");
  }

  function getPointerMoveDistanceSquared(clientX, clientY, startX, startY) {
    var deltaX = clientX - startX;
    var deltaY = clientY - startY;
    return deltaX * deltaX + deltaY * deltaY;
  }

  function getGhostPositionFromPointer(clientX, clientY, grabOffsetX, grabOffsetY) {
    var layoutRoot = getIconLayoutRoot();
    if (!layoutRoot) return { left: 0, top: 0 };
    var layoutRect = layoutRoot.getBoundingClientRect();
    return {
      left: clientX - layoutRect.left - grabOffsetX,
      top: clientY - layoutRect.top - grabOffsetY
    };
  }

  function createIconDragGhost(iconElement) {
    var ghostElement = document.createElement("div");
    ghostElement.className = "os-desktop-icon-drag-ghost";
    ghostElement.setAttribute("aria-hidden", "true");

    var sourceGlyph = iconElement.querySelector(".os-desktop-icon-glyph");
    var sourceLabel = iconElement.querySelector(".os-desktop-icon-label");
    if (sourceGlyph) {
      ghostElement.appendChild(sourceGlyph.cloneNode(true));
    }
    if (sourceLabel) {
      ghostElement.appendChild(sourceLabel.cloneNode(true));
    }
    return ghostElement;
  }

  function removeIconDragGhosts(drag) {
    if (!drag || !drag.ghostEntries) return;
    var index;
    for (index = 0; index < drag.ghostEntries.length; index++) {
      var entry = drag.ghostEntries[index];
      if (entry.ghostElement && entry.ghostElement.parentNode) {
        entry.ghostElement.parentNode.removeChild(entry.ghostElement);
      }
      entry.iconElement.classList.remove("os-desktop-icon--drag-source");
    }
    drag.ghostEntries = [];
  }

  function getDragStartPositionForIcon(drag, iconElement) {
    var index;
    for (index = 0; index < drag.startPositions.length; index++) {
      if (drag.startPositions[index].iconElement === iconElement) {
        return drag.startPositions[index];
      }
    }
    return { left: 0, top: 0 };
  }

  function ensureIconDragGhosts(drag, clientX, clientY) {
    if (!drag || !desktopIconsRoot) return;
    if (drag.ghostEntries.length) return;
    var index;
    document.body.setAttribute("data-icon-drag", "");
    if (window.WebMenuCursorBridge && window.WebMenuCursorBridge.updateFromPoint) {
      window.WebMenuCursorBridge.updateFromPoint(clientX, clientY);
    }
    for (index = 0; index < drag.iconElements.length; index++) {
      var iconElement = drag.iconElements[index];
      var ghostElement = createIconDragGhost(iconElement);
      var startPosition = getDragStartPositionForIcon(drag, iconElement);
      desktopIconsRoot.appendChild(ghostElement);
      ghostElement.style.left = String(Math.round(startPosition.left)) + "px";
      ghostElement.style.top = String(Math.round(startPosition.top)) + "px";
      drag.ghostEntries.push({
        iconElement: iconElement,
        ghostElement: ghostElement
      });
      iconElement.classList.add("os-desktop-icon--drag-source");
    }
    drag.lastClientX = clientX;
    drag.lastClientY = clientY;
    var ghostPosition = updateIconDragGhostPositions(drag, clientX, clientY);
    if (ghostPosition) {
      drag.lastGhostLeft = ghostPosition.left;
      drag.lastGhostTop = ghostPosition.top;
    }
  }

  function updateIconDragGhostPositions(drag, clientX, clientY) {
    if (!drag || !drag.ghostEntries.length) return;
    var ghostPosition = getGhostPositionFromPointer(clientX, clientY, drag.grabOffsetX, drag.grabOffsetY);
    var clampedPrimary = clampIconPosition(drag.primaryIconElement, ghostPosition.left, ghostPosition.top);
    var deltaLeft = clampedPrimary.left - drag.startPrimaryLeft;
    var deltaTop = clampedPrimary.top - drag.startPrimaryTop;
    var index;
    for (index = 0; index < drag.ghostEntries.length; index++) {
      var entry = drag.ghostEntries[index];
      var startPosition = getDragStartPositionForIcon(drag, entry.iconElement);
      var left = startPosition.left + deltaLeft;
      var top = startPosition.top + deltaTop;
      var clamped = clampIconPosition(entry.iconElement, left, top);
      entry.ghostElement.style.left = String(Math.round(clamped.left)) + "px";
      entry.ghostElement.style.top = String(Math.round(clamped.top)) + "px";
    }
    return clampedPrimary;
  }

  function cancelIconDrag() {
    if (!activeIconDrag) return;
    var drag = activeIconDrag;
    removeIconDragGhosts(drag);
    document.body.removeAttribute("data-icon-drag");
    activeIconDrag = null;
    window.dispatchEvent(new CustomEvent("web-wm-drag-end"));
  }

  function getSelectedIconElements() {
    var icons;
    var result = [];
    var index;
    var iconElement;
    var iconId;
    if (!desktopIconsRoot) return result;
    icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    for (index = 0; index < icons.length; index++) {
      iconElement = icons[index];
      if (iconElement.hidden) continue;
      iconId = getIconIdFromElement(iconElement);
      if (!iconId || !selectedIconIds[iconId]) continue;
      result.push(iconElement);
    }
    return result;
  }

  function isIconSelected(iconElement) {
    var iconId = getIconIdFromElement(iconElement);
    if (!iconId) return false;
    return !!selectedIconIds[iconId];
  }

  function setIconSelected(iconElement, selected) {
    var iconId = getIconIdFromElement(iconElement);
    if (!iconId) return;
    if (selected) {
      selectedIconIds[iconId] = true;
      iconElement.classList.add(ICON_SELECTED_CLASS);
      return;
    }
    delete selectedIconIds[iconId];
    iconElement.classList.remove(ICON_SELECTED_CLASS);
  }

  function selectSingleIcon(iconElement) {
    clearIconSelection();
    setIconSelected(iconElement, true);
  }

  function clearIconSelection() {
    var icons;
    var index;
    if (!desktopIconsRoot) {
      selectedIconIds = {};
      return;
    }
    icons = desktopIconsRoot.querySelectorAll("." + ICON_SELECTED_CLASS);
    for (index = 0; index < icons.length; index++) {
      icons[index].classList.remove(ICON_SELECTED_CLASS);
    }
    selectedIconIds = {};
  }

  function getSelectableDesktopIcons() {
    var icons;
    var result = [];
    var index;
    if (!desktopIconsRoot) return result;
    icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    for (index = 0; index < icons.length; index++) {
      if (icons[index].hidden) continue;
      result.push(icons[index]);
    }
    return result;
  }

  function getIconBoundsInLayout(iconElement) {
    var layoutPosition = getIconLayoutPosition(iconElement);
    var metrics = getIconMetrics(iconElement);
    return {
      left: layoutPosition.left,
      top: layoutPosition.top,
      right: layoutPosition.left + metrics.width,
      bottom: layoutPosition.top + metrics.height
    };
  }

  function layoutRectsIntersect(rectA, rectB) {
    if (rectA.right <= rectB.left) return false;
    if (rectA.left >= rectB.right) return false;
    if (rectA.bottom <= rectB.top) return false;
    if (rectA.top >= rectB.bottom) return false;
    return true;
  }

  function clientPointToLayoutPoint(clientX, clientY) {
    var layoutRoot = getIconLayoutRoot();
    if (!layoutRoot) return { left: 0, top: 0 };
    var layoutRect = layoutRoot.getBoundingClientRect();
    return {
      left: clientX - layoutRect.left,
      top: clientY - layoutRect.top
    };
  }

  function getMarqueeRect(marquee) {
    var left = Math.min(marquee.startX, marquee.currentX);
    var top = Math.min(marquee.startY, marquee.currentY);
    var right = Math.max(marquee.startX, marquee.currentX);
    var bottom = Math.max(marquee.startY, marquee.currentY);
    return {
      left: left,
      top: top,
      right: right,
      bottom: bottom
    };
  }

  function updateMarqueeBox(marquee) {
    var rect = getMarqueeRect(marquee);
    marquee.boxElement.hidden = false;
    marquee.boxElement.style.left = String(Math.round(rect.left)) + "px";
    marquee.boxElement.style.top = String(Math.round(rect.top)) + "px";
    marquee.boxElement.style.width = String(Math.round(rect.right - rect.left)) + "px";
    marquee.boxElement.style.height = String(Math.round(rect.bottom - rect.top)) + "px";
  }

  function selectIconsInMarquee(marquee) {
    var marqueeRect = getMarqueeRect(marquee);
    var icons = getSelectableDesktopIcons();
    var index;
    clearIconSelection();
    for (index = 0; index < icons.length; index++) {
      var iconElement = icons[index];
      var iconBounds = getIconBoundsInLayout(iconElement);
      var iconRect = {
        left: iconBounds.left,
        top: iconBounds.top,
        right: iconBounds.right,
        bottom: iconBounds.bottom
      };
      if (layoutRectsIntersect(marqueeRect, iconRect)) {
        setIconSelected(iconElement, true);
      }
    }
  }

  function onMarqueePointerMove(event) {
    if (!activeMarqueeSelect) return;
    if (activeMarqueeSelect.pointerId != null) {
      if (event.pointerId != null && event.pointerId !== activeMarqueeSelect.pointerId) return;
    }
    var point = clientPointToLayoutPoint(event.clientX, event.clientY);
    activeMarqueeSelect.currentX = point.left;
    activeMarqueeSelect.currentY = point.top;
    var width = Math.abs(activeMarqueeSelect.currentX - activeMarqueeSelect.startX);
    var height = Math.abs(activeMarqueeSelect.currentY - activeMarqueeSelect.startY);
    if (width < DESKTOP_MARQUEE_MIN_SIZE_PX && height < DESKTOP_MARQUEE_MIN_SIZE_PX) return;
    activeMarqueeSelect.moved = true;
    updateMarqueeBox(activeMarqueeSelect);
    selectIconsInMarquee(activeMarqueeSelect);
  }

  function endMarqueeSelect() {
    if (!activeMarqueeSelect) return;
    var marquee = activeMarqueeSelect;
    if (marquee.moved) {
      selectIconsInMarquee(marquee);
    } else {
      clearIconSelection();
    }
    marquee.boxElement.hidden = true;
    if (marquee.layerElement && marquee.pointerId != null) {
      try {
        marquee.layerElement.releasePointerCapture(marquee.pointerId);
      } catch (error) { }
    }
    activeMarqueeSelect = null;
  }

  function shouldBeginDesktopMarqueeFromTarget(target) {
    if (!target || !desktopSurface) return false;
    if (!desktopSurface.contains(target)) return false;
    if (target.closest(".os-window")) return false;
    if (target.closest(".os-desktop-icon")) return false;
    if (target.closest(".os-statusbar")) return false;
    return true;
  }

  function bindDesktopMarqueeSelect() {
    if (!desktopSurface || desktopSurface.wmDesktopMarqueeBound) return;
    desktopSurface.wmDesktopMarqueeBound = true;

    function onMarqueePointerDown(event) {
      var windowManager;
      if (event.button != null && event.button !== 0) return;
      if (event.isPrimary === false) return;
      if (activeIconDrag || pendingIconPress) return;
      if (!shouldBeginDesktopMarqueeFromTarget(event.target)) return;
      windowManager = getWindowManager();
      if (windowManager && windowManager.clearDesktopWindowFocus) {
        windowManager.clearDesktopWindowFocus();
      }
      if (!desktopMarqueeBox) return;
      var point = clientPointToLayoutPoint(event.clientX, event.clientY);
      activeMarqueeSelect = {
        pointerId: event.pointerId,
        startX: point.left,
        startY: point.top,
        currentX: point.left,
        currentY: point.top,
        boxElement: desktopMarqueeBox,
        layerElement: desktopSurface,
        moved: false
      };
      try {
        desktopSurface.setPointerCapture(event.pointerId);
      } catch (error) { }
      event.preventDefault();
    }

    desktopSurface.addEventListener("pointerdown", onMarqueePointerDown);
  }

  function initDesktopMarqueeLayer() {
    var legacyMarqueeLayer;
    if (!desktopIconsRoot || !desktopSurface) return;
    legacyMarqueeLayer = document.getElementById("desktopMarqueeLayer");
    if (legacyMarqueeLayer && legacyMarqueeLayer.parentNode) {
      legacyMarqueeLayer.parentNode.removeChild(legacyMarqueeLayer);
    }
    if (desktopMarqueeBox) return;
    desktopMarqueeBox = document.createElement("div");
    desktopMarqueeBox.className = "os-desktop-marquee-box";
    desktopMarqueeBox.hidden = true;
    desktopIconsRoot.appendChild(desktopMarqueeBox);
    bindDesktopMarqueeSelect();
  }

  function getIconElementsFromDragIconIds(iconIds) {
    var result = [];
    var index;
    var iconId;
    var iconElement;
    if (!iconIds || !iconIds.length || !desktopIconsRoot) {
      return result;
    }
    for (index = 0; index < iconIds.length; index++) {
      iconId = iconIds[index];
      if (!iconId) continue;
      iconElement = desktopIconsRoot.querySelector(
        '.os-desktop-icon[data-desktop-icon="' + iconId + '"]'
      );
      if (!iconElement || iconElement.hidden) continue;
      result.push(iconElement);
    }
    return result;
  }

  function getIconsToDragFromPress(iconElement, dragIconIds) {
    var selectedIcons;
    if (dragIconIds && dragIconIds.length > 1) {
      selectedIcons = getIconElementsFromDragIconIds(dragIconIds);
      if (selectedIcons.length > 1) {
        return selectedIcons;
      }
    }
    selectedIcons = getSelectedIconElements();
    if (selectedIcons.length > 1 && isIconSelected(iconElement)) {
      return selectedIcons;
    }
    clearIconSelection();
    setIconSelected(iconElement, true);
    return [iconElement];
  }

  function buildDragStartPositions(iconElements) {
    var positions = [];
    var index;
    for (index = 0; index < iconElements.length; index++) {
      var iconElement = iconElements[index];
      var layoutPosition = getIconLayoutPosition(iconElement);
      positions.push({
        iconElement: iconElement,
        left: layoutPosition.left,
        top: layoutPosition.top
      });
    }
    return positions;
  }

  function beginIconDrag(iconElement, clientX, clientY, pointerId, gestureId, dragIconIds) {
    if (!desktopSurface) return;
    var iconElements = getIconsToDragFromPress(iconElement, dragIconIds);
    var startPositions = buildDragStartPositions(iconElements);
    var layoutRoot = getIconLayoutRoot();
    var layoutRect = layoutRoot.getBoundingClientRect();
    var iconRect = iconElement.getBoundingClientRect();
    var anchorLeft = iconRect.left - layoutRect.left;
    var anchorTop = iconRect.top - layoutRect.top;
    var grabOffsetX = clientX - iconRect.left;
    var grabOffsetY = clientY - iconRect.top;
    var primaryStart = getDragStartPositionForIcon(
      { startPositions: startPositions },
      iconElement
    );

    activeIconDrag = {
      iconElements: iconElements,
      primaryIconElement: iconElement,
      startPositions: startPositions,
      startPrimaryLeft: primaryStart.left,
      startPrimaryTop: primaryStart.top,
      ghostEntries: [],
      grabOffsetX: grabOffsetX,
      grabOffsetY: grabOffsetY,
      pointerId: pointerId,
      gestureId: gestureId,
      anchorLeft: anchorLeft,
      anchorTop: anchorTop,
      moveSoundRemainder: 0,
      lastGhostLeft: anchorLeft,
      lastGhostTop: anchorTop,
      lastClientX: clientX,
      lastClientY: clientY
    };
  }

  function tryStartIconDragFromPendingPress(clientX, clientY, pointerId) {
    if (!pendingIconPress || !desktopSurface) return false;
    if (
      pointerId != null &&
      pendingIconPress.pointerId != null &&
      pointerId !== pendingIconPress.pointerId
    ) {
      return false;
    }

    var press = pendingIconPress;
    var startThresholdSquared = ICON_DRAG_START_THRESHOLD_PX * ICON_DRAG_START_THRESHOLD_PX;
    var moveDistanceSquared = getPointerMoveDistanceSquared(clientX, clientY, press.startX, press.startY);
    if (moveDistanceSquared < startThresholdSquared) return false;

    pendingIconPress = null;
    beginIconDrag(
      press.iconElement,
      clientX,
      clientY,
      press.pointerId,
      press.gestureId,
      press.dragIconIds
    );
    ensureIconDragGhosts(activeIconDrag, clientX, clientY);
    if (!activeIconDrag || !activeIconDrag.ghostEntries.length) {
      cancelIconDrag();
      return false;
    }

    window.dispatchEvent(new CustomEvent("web-wm-drag-start"));
    try {
      press.iconElement.setPointerCapture(press.pointerId);
    } catch (error) { }
    return true;
  }

  function onIconPointerMove(event) {
    if (activeMarqueeSelect) {
      onMarqueePointerMove(event);
      return;
    }

    if (pendingIconPress) {
      if (pendingIconPress.pointerId != null) {
        if (event.pointerId != null && event.pointerId !== pendingIconPress.pointerId) return;
      }
      tryStartIconDragFromPendingPress(event.clientX, event.clientY, event.pointerId);
    }

    if (!activeIconDrag) return;
    if (activeIconDrag.pointerId != null) {
      if (event.pointerId != null && event.pointerId !== activeIconDrag.pointerId) return;
    }

    var drag = activeIconDrag;
    var ghostPosition = updateIconDragGhostPositions(drag, event.clientX, event.clientY);
    if (!ghostPosition) return;

    var stepDeltaX = ghostPosition.left - drag.lastGhostLeft;
    var stepDeltaY = ghostPosition.top - drag.lastGhostTop;
    var stepDistance = Math.sqrt(stepDeltaX * stepDeltaX + stepDeltaY * stepDeltaY);
    drag.moveSoundRemainder = drag.moveSoundRemainder + stepDistance;
    while (drag.moveSoundRemainder >= ICON_DRAG_SOUND_STEP_PX) {
      drag.moveSoundRemainder = drag.moveSoundRemainder - ICON_DRAG_SOUND_STEP_PX;
      window.dispatchEvent(new CustomEvent("web-wm-drag-step"));
    }
    drag.lastGhostLeft = ghostPosition.left;
    drag.lastGhostTop = ghostPosition.top;
    drag.lastClientX = event.clientX;
    drag.lastClientY = event.clientY;
  }

  function clearSuppressIconActivation() {
    suppressIconActivationIconId = "";
    suppressIconActivationIconIds = {};
    if (suppressIconClickTimer) {
      window.clearTimeout(suppressIconClickTimer);
      suppressIconClickTimer = 0;
    }
  }

  function setSuppressIconClickAfterDrag(iconElements) {
    var index;
    var iconId;
    if (!iconElements) return;
    suppressIconActivationIconId = "";
    suppressIconActivationIconIds = {};
    if (iconElements.length === undefined) {
      iconElements = [iconElements];
    }
    for (index = 0; index < iconElements.length; index++) {
      iconId = getIconIdFromElement(iconElements[index]);
      if (iconId) suppressIconActivationIconIds[iconId] = true;
    }
    if (suppressIconClickTimer) {
      window.clearTimeout(suppressIconClickTimer);
    }
    suppressIconClickTimer = window.setTimeout(function () {
      suppressIconClickTimer = 0;
      clearSuppressIconActivation();
    }, ICON_CLICK_SUPPRESS_MS);
  }

  function finishIconPressClick(press) {
    if (!press || !press.iconElement) return;
    selectSingleIcon(press.iconElement);
    activateDesktopIconFromTap(press.iconElement, press.gestureId);
  }

  function endIconDrag() {
    if (!activeIconDrag) return;
    var drag = activeIconDrag;
    var excludeIcons = drag.iconElements;
    var primaryIconElement = drag.primaryIconElement;
    var primaryStart = getDragStartPositionForIcon(drag, primaryIconElement);
    var placedGroupIcons = [];
    var occupancyExcludeIcons;
    var index;
    var iconElement;
    var startPosition;
    var resolvedDropPosition;
    var deltaLeft;
    var deltaTop;
    var primaryStartCell;
    var primaryDropCell;
    var gridDeltaColumn = 0;
    var gridDeltaRow = 0;
    var isGroupDrag = drag.iconElements.length > 1;

    removeIconDragGhosts(drag);
    document.body.removeAttribute("data-icon-drag");
    activeIconDrag = null;
    window.dispatchEvent(new CustomEvent("web-wm-drag-end"));

    occupancyExcludeIcons = getUnplacedGroupDragExcludeIcons(drag.iconElements, placedGroupIcons);
    resolvedDropPosition = resolveIconDropPosition(
      primaryIconElement,
      drag.lastGhostLeft,
      drag.lastGhostTop,
      drag.lastClientX,
      drag.lastClientY,
      occupancyExcludeIcons
    );
    deltaLeft = resolvedDropPosition.left - primaryStart.left;
    deltaTop = resolvedDropPosition.top - primaryStart.top;
    if (isGroupDrag && isIconSnapToGridEnabled()) {
      primaryStartCell = getIconGridCellFromLayoutPoint(primaryStart.left, primaryStart.top);
      primaryDropCell = getIconGridCellFromLayoutPoint(
        resolvedDropPosition.left,
        resolvedDropPosition.top
      );
      gridDeltaColumn = primaryDropCell.column - primaryStartCell.column;
      gridDeltaRow = primaryDropCell.row - primaryStartCell.row;
    }

    applyIconPosition(primaryIconElement, resolvedDropPosition.left, resolvedDropPosition.top, false);
    syncIconLayoutFromElement(primaryIconElement);
    placedGroupIcons.push(primaryIconElement);

    for (index = 0; index < drag.iconElements.length; index++) {
      iconElement = drag.iconElements[index];
      if (iconElement === primaryIconElement) continue;
      startPosition = getDragStartPositionForIcon(drag, iconElement);
      occupancyExcludeIcons = getUnplacedGroupDragExcludeIcons(drag.iconElements, placedGroupIcons);
      if (isGroupDrag) {
        resolvedDropPosition = resolveGroupDragSecondaryDropPosition(
          iconElement,
          startPosition.left,
          startPosition.top,
          gridDeltaColumn,
          gridDeltaRow,
          deltaLeft,
          deltaTop,
          occupancyExcludeIcons
        );
      } else {
        resolvedDropPosition = resolveIconDropPosition(
          iconElement,
          startPosition.left + deltaLeft,
          startPosition.top + deltaTop,
          null,
          null,
          occupancyExcludeIcons
        );
      }
      applyIconPosition(iconElement, resolvedDropPosition.left, resolvedDropPosition.top, false);
      syncIconLayoutFromElement(iconElement);
      placedGroupIcons.push(iconElement);
    }
    scheduleIconLayoutsSave();
    applyAllSavedIconLayouts();
    updateDesktopTabOrder();
    setSuppressIconClickAfterDrag(drag.iconElements);
  }

  function onDocumentPointerUp(event) {
    if (activeMarqueeSelect) {
      endMarqueeSelect();
      return;
    }

    if (activeIconDrag) {
      endIconDrag();
      return;
    }

    if (!pendingIconPress) return;
    if (
      event &&
      pendingIconPress.pointerId != null &&
      event.pointerId != null &&
      event.pointerId !== pendingIconPress.pointerId
    ) {
      pendingIconPress = null;
      return;
    }

    var press = pendingIconPress;
    pendingIconPress = null;
    finishIconPressClick(press);
  }

  function onDocumentMouseUp(event) {
    if (event.button != null && event.button !== 0) return;
    onDocumentPointerUp(event);
  }

  function shouldSuppressIconActivation(iconElement) {
    var iconId = iconElement.getAttribute("data-desktop-icon");
    if (iconId && suppressIconActivationIconIds[iconId]) {
      clearSuppressIconActivation();
      return true;
    }
    if (!suppressIconActivationIconId) return false;
    if (!iconId || iconId !== suppressIconActivationIconId) return false;
    clearSuppressIconActivation();
    return true;
  }

  function activateDesktopIconFromTap(iconElement, gestureId) {
    if (shouldSuppressIconActivation(iconElement)) return;
    if (gestureId != null) {
      iconActivatedGestureId = gestureId;
    }
    onIconActivated(iconElement);
  }

  function bindDesktopIcon(iconElement) {
    function onPointerDown(event) {
      if (event.button != null && event.button !== 0) return;
      if (event.isPrimary === false) return;
      var selectedIcons;
      var dragIconIds = null;
      var index;
      iconPointerGestureId = iconPointerGestureId + 1;
      if (isIconSelected(iconElement)) {
        selectedIcons = getSelectedIconElements();
        if (selectedIcons.length > 1) {
          dragIconIds = [];
          for (index = 0; index < selectedIcons.length; index++) {
            dragIconIds.push(getIconIdFromElement(selectedIcons[index]));
          }
        }
      }
      pendingIconPress = {
        iconElement: iconElement,
        startX: event.clientX,
        startY: event.clientY,
        pointerId: event.pointerId,
        gestureId: iconPointerGestureId,
        dragIconIds: dragIconIds
      };
    }

    function onIconClick(event) {
      if (iconActivatedGestureId === iconPointerGestureId) {
        iconActivatedGestureId = -1;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (shouldSuppressIconActivation(iconElement)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (pendingIconPress && pendingIconPress.iconElement === iconElement) {
        var press = pendingIconPress;
        pendingIconPress = null;
        event.preventDefault();
        event.stopPropagation();
        finishIconPressClick(press);
        return;
      }
      selectSingleIcon(iconElement);
      onIconActivated(iconElement);
    }

    function onIconFocus() {
      if (activeIconDrag || activeMarqueeSelect) return;
      if (pendingIconPress && pendingIconPress.iconElement === iconElement) return;
      selectSingleIcon(iconElement);
    }

    iconElement.addEventListener("pointerdown", onPointerDown);
    iconElement.addEventListener("click", onIconClick);
    iconElement.addEventListener("focus", onIconFocus);
  }

  function layoutDefaultIcons() {
    var icons;
    var index;
    var iconElement;
    var iconId;
    if (!desktopIconsRoot || !desktopSurface) return;

    icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    for (index = 0; index < icons.length; index++) {
      iconElement = icons[index];
      if (iconElement.hidden) continue;
      iconId = iconElement.getAttribute("data-desktop-icon");
      if (iconId && savedIconLayoutTable[iconId]) continue;
      applyDefaultIconLayout(iconElement, iconId);
    }
  }

  function updateActionIconsState() {
    if (!desktopIconsRoot) return;
    var disconnectIcon = desktopIconsRoot.querySelector(
      '.os-desktop-icon[data-desktop-icon="' + ICON_ACTION_DISCONNECT + '"]'
    );
    if (!disconnectIcon) return;
    var disconnectEnabled = isGameMode();
    disconnectIcon.hidden = false;
    disconnectIcon.removeAttribute("hidden");
    disconnectIcon.setAttribute("aria-hidden", "false");
    if (disconnectEnabled) {
      disconnectIcon.classList.remove(ICON_DISABLED_CLASS);
      disconnectIcon.removeAttribute("aria-disabled");
    } else {
      disconnectIcon.classList.add(ICON_DISABLED_CLASS);
      disconnectIcon.setAttribute("aria-disabled", "true");
    }
    updateDesktopTabOrder();
  }

  function onDesktopWindowTabStopFocus(event) {
    var target;
    var windowElement;
    var windowManager;
    if (!event || !event.target) return;
    target = event.target;
    if (!target.classList || !target.classList.contains("os-window-control")) return;
    if (!desktopSurface) return;
    windowElement = target.closest(".os-window");
    if (!windowElement || !desktopSurface.contains(windowElement)) return;
    windowManager = getWindowManager();
    if (windowManager && windowManager.focusWindow) {
      windowManager.focusWindow(windowElement);
    }
  }

  function initDesktopIcons() {
    desktopSurface = document.getElementById("desktopSurface");
    desktopIconsRoot = document.getElementById("desktopIcons");
    desktopWorkspace = document.getElementById("desktopWorkspace");
    if (!desktopSurface || !desktopIconsRoot) return;

    if (window.WebDesktopAppIcons && window.WebDesktopAppIcons.mountDesktopIcons) {
      window.WebDesktopAppIcons.mountDesktopIcons();
    }

    initDesktopMarqueeLayer();

    populateDefaultIconLayoutTable();
    if (!isUnityHost()) {
      mergePersistedIconLayoutPayload(readIconLayoutsFromStorage());
      clearIconLayoutBootstrap();
    }

    var icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    var index = 0;
    for (index = 0; index < icons.length; index++) {
      bindDesktopIcon(icons[index]);
    }

    applyAllSavedIconLayouts();
    updateActionIconsState();

    document.addEventListener("pointermove", onIconPointerMove);
    document.addEventListener("pointerup", onDocumentPointerUp);
    document.addEventListener("pointercancel", onDocumentPointerUp);
    document.addEventListener("mouseup", onDocumentMouseUp);

    window.addEventListener("web-menu-mode-changed", updateActionIconsState);
    window.addEventListener("web-page-changed", updateActionIconsState);
    window.addEventListener("resize", onDesktopIconsResize);
    window.addEventListener("web-wm-drag-end", updateDesktopTabOrder);
    if (desktopSurface && !desktopSurface.wmDesktopTabFocusBound) {
      desktopSurface.addEventListener("focusin", onDesktopWindowTabStopFocus);
      desktopSurface.wmDesktopTabFocusBound = true;
    }
  }

  function onDesktopIconsResize() {
    clearIconGridLayoutCache();
    applyAllSavedIconLayouts();
    updateDesktopTabOrder();
  }

  function getRouteWindowPresetFromLocation() {
    if (window.WebMenuRoute && window.WebMenuRoute.getInitialWindowPreset) {
      var initialPreset = window.WebMenuRoute.getInitialWindowPreset();
      if (initialPreset) {
        return initialPreset;
      }
    }
    if (!window.WebMenuRoute || !window.WebMenuRoute.parseWindowPresetFromLocation) {
      return "";
    }
    return window.WebMenuRoute.parseWindowPresetFromLocation();
  }

  function initDefaultWindows() {
    var windowManager = getWindowManager();
    var routePreset = getRouteWindowPresetFromLocation();
    if (
      windowManager &&
      windowManager.hasPersistedWindowLayouts &&
      windowManager.hasPersistedWindowLayouts()
    ) {
      if (routePreset && windowManager.setRouteBootDesktopVisibility) {
        windowManager.setRouteBootDesktopVisibility(routePreset);
      }
      if (windowManager.applyDesktopWindowVisibility) {
        windowManager.applyDesktopWindowVisibility();
      }
      if (windowManager.applySavedWindowStackOrder) {
        windowManager.applySavedWindowStackOrder(true);
      }
      window.dispatchEvent(new CustomEvent("web-desktop-windows-restored"));
      return;
    }
    closeAllAppWindows();
    if (routePreset && windowManager && windowManager.isDesktopWindowPreset(routePreset)) {
      window.dispatchEvent(new CustomEvent("web-desktop-windows-restored"));
      return;
    }
    openWindow(WINDOW_PRESET_TITLE, false);
    window.dispatchEvent(new CustomEvent("web-desktop-windows-restored"));
  }

  function onDesktopWindowsRestored() {
    var index = 0;
    for (index = 0; index < APP_WINDOW_PRESETS.length; index++) {
      var presetName = APP_WINDOW_PRESETS[index];
      var windowElement = getWindowByPreset(presetName);
      if (isWindowVisible(windowElement)) {
        runWindowOpenHooks(windowElement, presetName);
      }
    }
    var titleWindow = getWindowByPreset(WINDOW_PRESET_TITLE);
    if (isWindowVisible(titleWindow)) {
      runWindowOpenHooks(titleWindow, WINDOW_PRESET_TITLE);
    }
    updateDesktopTabOrder();
  }

  function isWindowOpen(presetName) {
    return isWindowVisible(getWindowByPreset(presetName));
  }

  function updateDesktopWindowsToggleLabel() {
    var toggleButton = document.getElementById("desktopWindowsToggle");
    if (!toggleButton) return;
    var windowManager = getWindowManager();
    var allMinimized = false;
    if (windowManager && windowManager.areAllVisibleDesktopWindowsMinimized) {
      allMinimized = windowManager.areAllVisibleDesktopWindowsMinimized();
    }
    var labelKey = allMinimized
      ? "web.status.windows-restore-all"
      : "web.status.windows-minimize-all";
    var fallback = allMinimized ? "Restore all windows" : "Minimize all windows";
    if (window.WebLocale) {
      toggleButton.setAttribute("aria-label", window.WebLocale.get(labelKey, fallback));
      toggleButton.setAttribute("title", window.WebLocale.get(labelKey, fallback));
    } else {
      toggleButton.setAttribute("aria-label", fallback);
      toggleButton.setAttribute("title", fallback);
    }
    if (allMinimized) {
      toggleButton.setAttribute("data-wm-windows-toggle", "restore");
    } else {
      toggleButton.setAttribute("data-wm-windows-toggle", "minimize");
    }
  }

  function onDesktopWindowsToggleClick() {
    var windowManager = getWindowManager();
    if (!windowManager || !windowManager.toggleMinimizeAllDesktopWindows) return;
    windowManager.toggleMinimizeAllDesktopWindows();
    updateDesktopWindowsToggleLabel();
  }

  function triggerStatusNodeEffect(buttonElement, clientX, clientY) {
    var rect;
    var originX;
    var originY;
    if (!buttonElement) return;
    if (!window.WebMenuTitleFx || !window.WebMenuTitleFx.playTitleClick) return;
    originX = clientX;
    originY = clientY;
    if (!originX && !originY) {
      rect = buttonElement.getBoundingClientRect();
      originX = rect.left + rect.width * 0.5;
      originY = rect.top + rect.height * 0.5;
    }
    window.WebMenuTitleFx.playTitleClick(originX, originY, true);
  }

  function onStatusNodeClick(event) {
    if (event.button !== 0) return;
    triggerStatusNodeEffect(event.currentTarget, event.clientX, event.clientY);
  }

  function onStatusNodeKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    triggerStatusNodeEffect(event.currentTarget, 0, 0);
  }

  function bindStatusNodeButton() {
    var statusNodeButton = document.getElementById("osStatusNode");
    if (!statusNodeButton || statusNodeButton.wmStatusNodeBound) return;
    statusNodeButton.addEventListener("pointerdown", onStatusNodeClick);
    statusNodeButton.addEventListener("keydown", onStatusNodeKeyDown);
    statusNodeButton.wmStatusNodeBound = true;
  }

  function bindDesktopWindowsToggle() {
    var toggleButton = document.getElementById("desktopWindowsToggle");
    if (!toggleButton || toggleButton.wmToggleBound) return;
    toggleButton.addEventListener("click", onDesktopWindowsToggleClick);
    toggleButton.wmToggleBound = true;
    updateDesktopWindowsToggleLabel();
    window.addEventListener("web-desktop-windows-restored", updateDesktopWindowsToggleLabel);
    window.addEventListener("web-wm-layout-settled", updateDesktopWindowsToggleLabel);
  }

  function initOnReady() {
    initDesktopIcons();
    bindStatusNodeButton();
    bindDesktopWindowsToggle();
    window.addEventListener("web-desktop-windows-restored", onDesktopWindowsRestored);
    initDefaultWindows();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOnReady);
  } else {
    initOnReady();
  }

  return {
    openWindow: openWindow,
    toggleWindow: toggleWindow,
    closeWindow: closeWindow,
    showDesktopHome: showDesktopHome,
    openStartDesktop: openStartDesktop,
    openSettingsDesktop: openSettingsDesktop,
    openExtrasDesktop: openExtrasDesktop,
    openCreditsDesktop: openCreditsDesktop,
    openGamesDesktop: openGamesDesktop,
    openArtDesktop: openArtDesktop,
    openLinksDesktop: openLinksDesktop,
    isWindowOpen: isWindowOpen,
    getWindowByPreset: getWindowByPreset,
    applyIconLayouts: function (payload) {
      populateSavedIconLayoutTable(payload);
      applyAllSavedIconLayouts();
      clearIconLayoutBootstrap();
    },
    flushIconLayoutsSave: function () {
      if (iconLayoutSaveTimer) {
        window.clearTimeout(iconLayoutSaveTimer);
        iconLayoutSaveTimer = 0;
      }
      postIconLayoutsSave();
    },
    logIconLayoutDiffFromDefaults: logIconLayoutsDiffFromDefaults,
    buildIconLayoutDiffFromDefaultsPayload: buildIconLayoutsDiffFromDefaultsPayload,
    hasOpenAppWindows: hasOpenAppWindows,
    updateDesktopTabOrder: updateDesktopTabOrder
  };
})();
