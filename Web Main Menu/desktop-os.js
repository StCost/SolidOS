var WebDesktop = (function () {
  var ICON_LAYOUTS_STORAGE_KEY = "cm-menu-icon-layouts";
  var GAME_DESKTOP_LINKS_STORAGE_KEY = "cm-menu-game-desktop-links";
  var DESKTOP_ICON_VISIBILITY_STORAGE_KEY = "cm-menu-desktop-icon-visibility";
  var DESKTOP_ICON_DEFAULT_VISIBLE = {
    worlds: true,
    steam: true,
    settings: true,
    quit: true,
    disconnect: true
  };
  var TASKBAR_ORDER_STORAGE_KEY = "cm-menu-taskbar-order";
  var TASKBAR_APP_ICON_PIXEL_SIZE = 16;
  var TASKBAR_DRAG_START_THRESHOLD_PX = 8;
  var START_MENU_ICON_PIXEL_SIZE = 20;
  var START_MENU_COLUMN_NAME_LABEL = "Name";
  var START_MENU_COLUMN_LINK_LABEL = "Link";
  var START_MENU_GAMES_ICON_ID = "games";
  var START_MENU_OPEN_REVEAL_MS = 320;
  var START_MENU_GAME_ICON_PREFIX = "game-";
  var START_MENU_SUBMENU_CHILDREN = {
    worlds: ["steam", "servers"],
    settings: ["games", "art", "credits", "links", "changelog", "title"],
    quit: ["disconnect"]
  };
  var START_MENU_NESTED_ONLY_ICON_IDS = {
    steam: true,
    servers: true,
    art: true,
    credits: true,
    links: true,
    changelog: true,
    title: true,
    disconnect: true,
    games: true
  };
  var ICON_LAYOUT_BOOTSTRAP_CLASS = "menu-icon-layout-bootstrap";
  var ICON_LAYOUT_BOOTSTRAP_STYLE_ID = "cm-desktop-icon-layout-bootstrap";
  var ICON_DRAG_SOUND_STEP_PX = 300;
  var ICON_DRAG_START_THRESHOLD_PX = 8;
  var ICON_CLICK_SUPPRESS_MS = 400;
  var BASE_ICON_GRID_CELL_WIDTH = 88;
  var BASE_ICON_GRID_CELL_HEIGHT = 104;
  var BASE_ICON_MIN_FOOTPRINT = 88;
  var BASE_ICON_IMAGE_PIXEL_SIZE = 52;
  var DESKTOP_ICON_SCALE_MIN_PERCENT = 50;
  var DESKTOP_ICON_SCALE_MAX_PERCENT = 300;
  var DESKTOP_ICON_SCALE_DEFAULT_PERCENT = 100;
  var ICON_GRID_CELL_WIDTH = BASE_ICON_GRID_CELL_WIDTH;
  var ICON_GRID_CELL_HEIGHT = BASE_ICON_GRID_CELL_HEIGHT;
  var ICON_MIN_FOOTPRINT = BASE_ICON_MIN_FOOTPRINT;
  var desktopIconScalePercent = DESKTOP_ICON_SCALE_DEFAULT_PERCENT;
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
    changelog: "changelog-content",
    title: WINDOW_PRESET_TITLE
  };

  var APP_WINDOW_PRESETS = [
    "connect-col-0",
    "connect-col-1",
    "connect-col-2",
    "settings-content",
    "extras-games",
    "extras-game",
    "extras-art",
    "extras-links",
    "credits-content",
    "changelog-content"
  ];

  var ICON_ACTION_DISCONNECT = "disconnect";
  var ICON_ACTION_QUIT = "quit";

  var DEFAULT_ICON_LAYOUTS = {
    servers: { centerOffsetX: -135, centerOffsetY: 245 },
    worlds: { centerOffsetX: -45, centerOffsetY: 245 },
    steam: { centerOffsetX: 46, centerOffsetY: 245 },
    title: { centerOffsetX: -500, centerOffsetY: 365 },
    credits: { centerOffsetX: -410, centerOffsetY: 365 },
    changelog: { centerOffsetX: -500, centerOffsetY: 255 },
    links: { centerOffsetX: -315, centerOffsetY: 365 },
    settings: { centerOffsetX: -135, centerOffsetY: 365 },
    quit: { centerOffsetX: -45, centerOffsetY: 365 },
    disconnect: { centerOffsetX: 46, centerOffsetY: 365 },
    games: { centerOffsetX: 230, centerOffsetY: 365 },
    art: { centerOffsetX: 320, centerOffsetY: 365 }
  };

  var PORTRAIT_DEFAULT_ICON_LAYOUTS = {
    servers: { centerOffsetX: -155, centerOffsetY: -265 },
    worlds: { centerOffsetX: -45, centerOffsetY: -265 },
    steam: { centerOffsetX: 70, centerOffsetY: -265 },
    settings: { centerOffsetX: -45, centerOffsetY: -155 },
    games: { centerOffsetX: 70, centerOffsetY: -45 },
    links: { centerOffsetX: -155, centerOffsetY: 65 },
    changelog: { centerOffsetX: -45, centerOffsetY: -45 },
    credits: { centerOffsetX: 70, centerOffsetY: 65 },
    art: { centerOffsetX: -45, centerOffsetY: 65 },
    disconnect: { centerOffsetX: -155, centerOffsetY: 180 },
    quit: { centerOffsetX: -45, centerOffsetY: 180 },
    title: { centerOffsetX: 70, centerOffsetY: 180 }
  };

  var ICON_LAYOUT_RESOLVE_ORDER = [
    "servers",
    "worlds",
    "steam",
    "settings",
    "games",
    "links",
    "changelog",
    "credits",
    "art",
    "disconnect",
    "quit",
    "title"
  ];

  var menuLayoutPhoneVertical = false;

  var savedIconLayoutTable = {};
  var gameDesktopLinkIds = {};
  var desktopIconVisibilityTable = {};
  var startMenuOpen = false;
  var startMenuDocumentPointerBound = false;
  var startSubmenuHideTimer = 0;
  var activeStartSubmenuIconId = "";
  var startMenuOpenAnimationTimer = 0;
  var iconLayoutSaveTimer = 0;
  var activeIconDrag = null;
  var pendingIconPress = null;
  var suppressIconActivationIconId = "";
  var suppressIconActivationIconIds = {};
  var suppressIconClickTimer = 0;
  var iconPointerGestureId = 0;
  var selectedIconIds = {};
  var activeMarqueeSelect = null;
  var desktopMarqueeBox = null;
  var taskbarOrderKeys = [];
  var activeTaskbarDrag = null;
  var pendingTaskbarPress = null;
  var suppressTaskbarClickKey = "";
  var suppressTaskbarClickTimer = 0;

  var DESKTOP_MARQUEE_MIN_SIZE_PX = 4;
  function clampDesktopIconScalePercent(percent) {
    var value = Math.round(Number(percent));
    if (isNaN(value)) {
      value = DESKTOP_ICON_SCALE_DEFAULT_PERCENT;
    }
    if (value < DESKTOP_ICON_SCALE_MIN_PERCENT) {
      value = DESKTOP_ICON_SCALE_MIN_PERCENT;
    }
    if (value > DESKTOP_ICON_SCALE_MAX_PERCENT) {
      value = DESKTOP_ICON_SCALE_MAX_PERCENT;
    }
    return value;
  }

  function updateIconGridMetricsFromScale() {
    var scale = desktopIconScalePercent / 100;
    ICON_GRID_CELL_WIDTH = Math.round(BASE_ICON_GRID_CELL_WIDTH * scale);
    ICON_GRID_CELL_HEIGHT = Math.round(BASE_ICON_GRID_CELL_HEIGHT * scale);
    ICON_MIN_FOOTPRINT = Math.round(BASE_ICON_MIN_FOOTPRINT * scale);
    cachedIconGridLayout = null;
  }

  function getDesktopIconImagePixelSize() {
    return Math.round(BASE_ICON_IMAGE_PIXEL_SIZE * desktopIconScalePercent / 100);
  }

  function setDesktopIconScaleCssVariable(percent) {
    var iconsRoot = document.getElementById("desktopIcons");
    if (!iconsRoot) {
      return;
    }
    iconsRoot.style.setProperty("--desktop-icon-scale", String(percent / 100));
  }

  function updateDesktopIconImageSizes() {
    var pixelSize = getDesktopIconImagePixelSize();
    var iconsRoot = desktopIconsRoot || document.getElementById("desktopIcons");
    if (!iconsRoot) {
      return;
    }
    var images = iconsRoot.querySelectorAll(".os-app-icon");
    var index = 0;
    for (index = 0; index < images.length; index++) {
      images[index].width = pixelSize;
      images[index].height = pixelSize;
    }
  }

  function setDesktopIconScalePercent(percent) {
    desktopIconScalePercent = clampDesktopIconScalePercent(percent);
    updateIconGridMetricsFromScale();
    setDesktopIconScaleCssVariable(desktopIconScalePercent);
    updateDesktopIconImageSizes();
  }

  function getDesktopIconScalePercent() {
    return desktopIconScalePercent;
  }

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
    if (iconId === "worlds" || iconId === "servers" || iconId === "steam") {
      return !isGameMode();
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

  function releaseDesktopPointerInteractionState() {
    endMarqueeSelect();
    if (activeIconDrag) {
      endIconDrag();
    }
    pendingIconPress = null;
  }

  function syncScreenEffectsState() {
    if (window.WebMenuScreenEffects && window.WebMenuScreenEffects.sync) {
      window.WebMenuScreenEffects.sync();
    }
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
    if (presetName === "extras-games" || presetName === "extras-art" || presetName === "extras-links") {
      if (window.WebExtras && window.WebExtras.bindToWindow) {
        window.WebExtras.bindToWindow(windowElement);
      }
      return;
    }
    if (presetName === "extras-game") {
      if (window.WebExtras && window.WebExtras.onGamePlayWindowOpen) {
        window.WebExtras.onGamePlayWindowOpen(windowElement);
      }
      return;
    }
    if (presetName === "credits-content") {
      if (window.WebCredits && window.WebCredits.bindToWindow) {
        window.WebCredits.bindToWindow(windowElement);
      }
      return;
    }
    if (presetName === "changelog-content") {
      if (window.WebChangelog && window.WebChangelog.bindToWindow) {
        window.WebChangelog.bindToWindow(windowElement);
      }
    }
  }

  function showWindowElement(windowElement, playOpenAnimation) {
    if (!windowElement) return null;
    var presetName = windowElement.getAttribute("data-wm-preset");

    function finishShowWindowElement() {
      var windowManager = getWindowManager();
      if (windowManager && windowManager.prepareWindowForOpen) {
        windowManager.prepareWindowForOpen(windowElement);
      }
      windowElement.classList.remove("os-window--closed");

      if (!windowManager) {
        runWindowOpenHooks(windowElement, presetName);
        syncScreenEffectsState();
        return windowElement;
      }

      if (windowManager.setSavedWindowOpen) {
        windowManager.setSavedWindowOpen(windowElement, true);
      }

      if (windowManager.clearSavedWindowMinimizedState) {
        windowManager.clearSavedWindowMinimizedState(windowElement);
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
      if (windowManager.clampManagedWindowToContainer) {
        windowManager.clampManagedWindowToContainer(windowElement);
      }

      if (playOpenAnimation !== false && windowManager.playWindowOpen) {
        windowManager.playWindowOpen(windowElement, 0);
      }

      runWindowOpenHooks(windowElement, presetName);

      if (window.WebMenuScrollbar && window.WebMenuScrollbar.refresh) {
        window.WebMenuScrollbar.refresh();
      }

      if (windowManager.focusWindow) {
        windowManager.focusWindow(windowElement);
      }
      if (windowManager.setWindowKeyboardFocus) {
        windowManager.setWindowKeyboardFocus(windowElement);
      }

      if (windowManager.scheduleWindowLayoutsSave) {
        windowManager.scheduleWindowLayoutsSave();
      }

      releaseDesktopPointerInteractionState();
      if (windowManager.releaseWindowPointerInteractionState) {
        windowManager.releaseWindowPointerInteractionState();
      }

      updateDesktopTabOrder();
      syncScreenEffectsState();
      if (window.WebMenuScreenEffects && window.WebMenuScreenEffects.ensureBootHidden) {
        window.WebMenuScreenEffects.ensureBootHidden();
      }
      window.dispatchEvent(
        new CustomEvent("web-desktop-window-opened", {
          detail: { preset: presetName || "" }
        })
      );
      return windowElement;
    }

    return finishShowWindowElement();
  }

  function openWindowElement(windowElement, playOpenAnimation) {
    return showWindowElement(windowElement, playOpenAnimation);
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

  function hideWindowElementVisualOnly(windowElement) {
    if (!windowElement) return;
    var windowManager = getWindowManager();
    if (windowManager && windowManager.closeWindowVisualOnly) {
      windowManager.closeWindowVisualOnly(windowElement);
      return;
    }
    windowElement.classList.add("os-window--closed");
    windowElement.wmClosedVisualOnly = true;
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
    if (windowManager && windowManager.clampManagedWindowToContainer) {
      windowManager.clampManagedWindowToContainer(windowElement);
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

  function closeWindowVisualOnly(presetName) {
    hideWindowElementVisualOnly(getWindowByPreset(presetName));
  }

  function closeAllAppWindows() {
    var index = 0;
    for (index = 0; index < APP_WINDOW_PRESETS.length; index++) {
      closeWindow(APP_WINDOW_PRESETS[index]);
    }
  }

  function closeAllAppWindowsVisualOnly() {
    var index = 0;
    for (index = 0; index < APP_WINDOW_PRESETS.length; index++) {
      closeWindowVisualOnly(APP_WINDOW_PRESETS[index]);
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

  function isMenuLayoutPhoneVertical() {
    return menuLayoutPhoneVertical;
  }

  function updateMenuLayoutPhoneMode() {
    var coords = getLayoutCoords();
    var nextPhone = false;
    if (coords && coords.isMenuLayoutPhoneVertical) {
      nextPhone = coords.isMenuLayoutPhoneVertical();
    } else {
      nextPhone = window.innerHeight > window.innerWidth;
    }
    menuLayoutPhoneVertical = nextPhone;
    if (coords && coords.updateMenuLayoutPhoneMode) {
      coords.updateMenuLayoutPhoneMode();
    } else if (document.documentElement) {
      document.documentElement.classList.toggle("menu-layout-phone-vertical", nextPhone);
    }
  }

  function getActiveDefaultIconLayoutsTable() {
    if (menuLayoutPhoneVertical) {
      return PORTRAIT_DEFAULT_ICON_LAYOUTS;
    }
    return DEFAULT_ICON_LAYOUTS;
  }

  function shouldSkipPersistedIconLayoutOnPhone(iconId) {
    if (!menuLayoutPhoneVertical) return false;
    if (iconId.indexOf("game-") === 0) return false;
    return Object.prototype.hasOwnProperty.call(PORTRAIT_DEFAULT_ICON_LAYOUTS, iconId);
  }

  function shouldOpenTitleWindowFromSaved() {
    var windowManager = getWindowManager();
    if (windowManager && windowManager.shouldDesktopWindowBeOpen) {
      return windowManager.shouldDesktopWindowBeOpen(WINDOW_PRESET_TITLE);
    }
    if (isGameMode()) {
      return false;
    }
    if (isMenuLayoutPhoneVertical()) {
      return false;
    }
    return true;
  }

  function showDesktopHome() {
    if (isGameMode()) {
      if (shouldOpenTitleWindowFromSaved()) {
        openWindow(WINDOW_PRESET_TITLE, false);
      } else {
        closeWindowVisualOnly(WINDOW_PRESET_TITLE);
      }
      return;
    }
    closeAllAppWindowsVisualOnly();
    if (shouldOpenTitleWindowFromSaved()) {
      openWindow(WINDOW_PRESET_TITLE, false);
      return;
    }
    closeWindowVisualOnly(WINDOW_PRESET_TITLE);
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
    return openWindow("extras-links", true);
  }

  function openCreditsDesktop() {
    return openWindow("credits-content", true);
  }

  function openChangelogDesktop() {
    return openWindow("changelog-content", true);
  }

  function openExtrasDesktop() {
    openGamesDesktop();
  }

  function onIconActivated(iconElement) {
    var iconId = iconElement.getAttribute("data-desktop-icon");
    if (!iconId) return;
    if (!isDesktopIconActionEnabled(iconElement)) return;
    activateDesktopIconAction(iconId);
  }

  function activateDesktopIconAction(iconId) {
    var presetName;
    if (!iconId) return;
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
      openDesktopWindow(WINDOW_PRESET_TITLE, true);
      return;
    }
    if (iconId.indexOf("game-") === 0) {
      openGameFromDesktopIcon(iconId.substring(5));
      return;
    }
    presetName = getPresetForIconId(iconId);
    if (presetName) {
      openDesktopWindow(presetName, true);
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

  function shiftAllSavedIconCenterOffsetY(deltaY) {
    var iconId;
    var layout;
    var coords;
    if (!deltaY) return;
    coords = getLayoutCoords();
    if (!coords) return;
    for (iconId in savedIconLayoutTable) {
      if (!Object.prototype.hasOwnProperty.call(savedIconLayoutTable, iconId)) continue;
      layout = savedIconLayoutTable[iconId];
      if (!coords.isCenterLayoutEntry(layout)) continue;
      setSavedIconLayout(iconId, {
        anchor: coords.ANCHOR_CENTER,
        centerOffsetX: layout.centerOffsetX || 0,
        centerOffsetY: Math.round((layout.centerOffsetY || 0) + deltaY)
      });
    }
  }

  function getDesktopIconsBottomOverflowFromLayoutTable() {
    var coords;
    var layoutRoot;
    var iconId;
    var layout;
    var absolutePosition;
    var placementHeight;
    var iconHeight;
    var maxBottom;
    if (menuLayoutPhoneVertical) return 0;
    coords = getLayoutCoords();
    layoutRoot = getIconLayoutRoot();
    if (!coords || !layoutRoot) return 0;
    placementHeight = layoutRoot.clientHeight;
    if (placementHeight < 1) return 0;
    iconHeight = ICON_GRID_CELL_HEIGHT;
    maxBottom = 0;
    for (iconId in savedIconLayoutTable) {
      if (!Object.prototype.hasOwnProperty.call(savedIconLayoutTable, iconId)) continue;
      layout = savedIconLayoutTable[iconId];
      if (!coords.isCenterLayoutEntry(layout)) continue;
      absolutePosition = coords.resolveAbsolutePosition(layout, layoutRoot);
      if (absolutePosition.top + iconHeight > maxBottom) {
        maxBottom = absolutePosition.top + iconHeight;
      }
    }
    if (maxBottom <= placementHeight + 1) return 0;
    return Math.ceil(maxBottom - placementHeight);
  }

  function measureDesktopIconsBottomOverflow() {
    var layoutRoot;
    var layoutRect;
    var icons;
    var index;
    var iconElement;
    var iconRect;
    var maxOverflow;
    var overflow;
    if (menuLayoutPhoneVertical || !desktopIconsRoot) return 0;
    layoutRoot = getIconLayoutRoot();
    if (!layoutRoot) return 0;
    layoutRect = layoutRoot.getBoundingClientRect();
    if (layoutRect.height < 1) return 0;
    icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    maxOverflow = 0;
    for (index = 0; index < icons.length; index++) {
      iconElement = icons[index];
      if (iconElement.hidden) continue;
      iconRect = iconElement.getBoundingClientRect();
      overflow = iconRect.bottom - layoutRect.bottom;
      if (overflow > maxOverflow) maxOverflow = overflow;
    }
    if (maxOverflow <= 1) return 0;
    return Math.ceil(maxOverflow);
  }

  function fitDesktopIconLayoutsToViewport() {
    var overflow;
    if (menuLayoutPhoneVertical) return;
    overflow = measureDesktopIconsBottomOverflow();
    if (overflow < 1) return;
    shiftAllSavedIconCenterOffsetY(-overflow);
  }

  function populateDefaultIconLayoutTable() {
    var iconId;
    var defaultTable = getActiveDefaultIconLayoutsTable();
    var bottomOverflow;
    savedIconLayoutTable = {};
    for (iconId in defaultTable) {
      if (!Object.prototype.hasOwnProperty.call(defaultTable, iconId)) continue;
      setSavedIconLayout(iconId, getDefaultIconLayoutEntry(iconId));
    }
    if (!menuLayoutPhoneVertical) {
      bottomOverflow = getDesktopIconsBottomOverflowFromLayoutTable();
      if (bottomOverflow > 0) {
        shiftAllSavedIconCenterOffsetY(-bottomOverflow);
      }
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
      if (shouldSkipPersistedIconLayoutOnPhone(iconId)) continue;
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
    if (!savedLayout) return;

    layoutRoot = getIconLayoutRoot();
    if (!layoutRoot) return;

    coords = getLayoutCoords();
    if (!coords) return;
    if (coords.isCenterLayoutEntry(savedLayout)) {
      applyIconCenterOffsetPosition(iconElement, savedLayout);
      return;
    }

    absolutePosition = coords.resolveAbsolutePosition(savedLayout, layoutRoot);
    applyIconPosition(iconElement, absolutePosition.left, absolutePosition.top);
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
    syncTaskbarApps();
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

  function applyAllSavedIconLayoutsAndResolve() {
    applyAllSavedIconLayouts();
    if (menuLayoutPhoneVertical) return;
    fitDesktopIconLayoutsToViewport();
    applyAllSavedIconLayouts();
    resolveAllDesktopIconLayouts();
  }

  function getOrderedDesktopIconsForLayoutResolve() {
    var orderLookup = {};
    var orderedEntries = [];
    var remainingIcons = [];
    var sortedIcons = [];
    var icons;
    var index;
    var compareIndex;
    var iconElement;
    var iconId;
    var orderIndex;
    var tempEntry;
    if (!desktopIconsRoot) return sortedIcons;
    for (index = 0; index < ICON_LAYOUT_RESOLVE_ORDER.length; index++) {
      orderLookup[ICON_LAYOUT_RESOLVE_ORDER[index]] = index;
    }
    icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    for (index = 0; index < icons.length; index++) {
      iconElement = icons[index];
      if (iconElement.hidden) continue;
      iconId = iconElement.getAttribute("data-desktop-icon");
      if (!iconId) continue;
      if (Object.prototype.hasOwnProperty.call(orderLookup, iconId)) {
        orderIndex = orderLookup[iconId];
        orderedEntries.push({ orderIndex: orderIndex, iconElement: iconElement });
      } else {
        remainingIcons.push(iconElement);
      }
    }
    for (index = 0; index < orderedEntries.length; index++) {
      for (compareIndex = index + 1; compareIndex < orderedEntries.length; compareIndex++) {
        if (orderedEntries[compareIndex].orderIndex < orderedEntries[index].orderIndex) {
          tempEntry = orderedEntries[index];
          orderedEntries[index] = orderedEntries[compareIndex];
          orderedEntries[compareIndex] = tempEntry;
        }
      }
    }
    for (index = 0; index < orderedEntries.length; index++) {
      sortedIcons.push(orderedEntries[index].iconElement);
    }
    for (index = 0; index < remainingIcons.length; index++) {
      sortedIcons.push(remainingIcons[index]);
    }
    return sortedIcons;
  }

  function buildPlacedIconsExcludeElement(excludeIconElement) {
    var placedIcons = [];
    var icons;
    var index;
    if (!desktopIconsRoot) return placedIcons;
    icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    for (index = 0; index < icons.length; index++) {
      if (icons[index] === excludeIconElement) continue;
      if (icons[index].hidden) continue;
      placedIcons.push(icons[index]);
    }
    return placedIcons;
  }

  function isIconLayoutPositionWithinBounds(iconElement, left, top) {
    var layoutRoot = getIconLayoutRoot();
    var layoutRect;
    var metrics;
    var maxLeft;
    var maxTop;
    if (!layoutRoot) return true;
    layoutRect = layoutRoot.getBoundingClientRect();
    metrics = getIconMetrics(iconElement);
    maxLeft = Math.max(0, layoutRect.width - metrics.width);
    maxTop = Math.max(0, layoutRect.height - metrics.height);
    if (left < 0 || top < 0) return false;
    if (left > maxLeft + 1 || top > maxTop + 1) return false;
    return true;
  }

  function resolveIconLayoutFitAndCollision(iconElement, placedIcons) {
    var iconId;
    var savedLayout;
    var coords;
    var layoutPosition;
    var clampedPosition;
    var freePosition;
    var needsCollisionResolve;
    if (!iconElement || iconElement.hidden) return;
    iconId = iconElement.getAttribute("data-desktop-icon");
    savedLayout = savedIconLayoutTable[iconId];
    coords = getLayoutCoords();
    if (savedLayout && coords && coords.isCenterLayoutEntry(savedLayout)) {
      placedIcons.push(iconElement);
      return;
    }
    layoutPosition = getIconLayoutPosition(iconElement);
    if (!isIconLayoutPositionWithinBounds(iconElement, layoutPosition.left, layoutPosition.top)) {
      clampedPosition = clampIconPosition(iconElement, layoutPosition.left, layoutPosition.top);
      freePosition = findClosestFreeIconPosition(
        iconElement,
        clampedPosition.left,
        clampedPosition.top,
        placedIcons
      );
      applyIconPosition(iconElement, freePosition.left, freePosition.top);
      syncIconLayoutFromElement(iconElement);
      placedIcons.push(iconElement);
      return;
    }
    needsCollisionResolve = isIconDropPositionTooClose(
      layoutPosition.left,
      layoutPosition.top,
      iconElement,
      getIconMinimumSeparation(iconElement),
      placedIcons
    );
    if (needsCollisionResolve) {
      freePosition = findClosestFreeIconPosition(
        iconElement,
        layoutPosition.left,
        layoutPosition.top,
        placedIcons
      );
      if (
        freePosition.left !== layoutPosition.left ||
        freePosition.top !== layoutPosition.top
      ) {
        applyIconPosition(iconElement, freePosition.left, freePosition.top);
        syncIconLayoutFromElement(iconElement);
      }
    }
    placedIcons.push(iconElement);
  }

  function resolveAllDesktopIconLayouts() {
    var icons = getOrderedDesktopIconsForLayoutResolve();
    var placedIcons = [];
    var index = 0;
    for (index = 0; index < icons.length; index++) {
      resolveIconLayoutFitAndCollision(icons[index], placedIcons);
    }
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
    var defaultTable = getActiveDefaultIconLayoutsTable();
    if (!iconId) return null;
    if (!Object.prototype.hasOwnProperty.call(defaultTable, iconId)) return null;
    layout = defaultTable[iconId];
    return {
      anchor: "center",
      centerOffsetX: layout.centerOffsetX || 0,
      centerOffsetY: layout.centerOffsetY || 0
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
    var defaultTable = getActiveDefaultIconLayoutsTable();
    for (iconId in defaultTable) {
      if (!Object.prototype.hasOwnProperty.call(defaultTable, iconId)) continue;
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

  function cancelPendingIconLayoutSave() {
    if (iconLayoutSaveTimer) {
      window.clearTimeout(iconLayoutSaveTimer);
      iconLayoutSaveTimer = 0;
    }
  }

  function postIconLayoutsSave() {
    var payload = buildIconLayoutsPayload();
    var payloadJson = "";
    try {
      payloadJson = JSON.stringify(payload);
    } catch (error) {
      payloadJson = "";
    }

    // Always keep local storage in sync, even in Unity host mode.
    // This makes desktop-icon-layouts-bootstrap.js able to place icons correctly on first paint.
    window.__cmIconLayoutsPayload = payload;
    writeIconLayoutsToStorage(payload);
    if (window.WebMenuLocalStorageBridge && window.WebMenuLocalStorageBridge.scheduleSaveToUnity) {
      window.WebMenuLocalStorageBridge.scheduleSaveToUnity();
    }
  }

  function scheduleIconLayoutsSave() {
    if (iconLayoutSaveTimer) window.clearTimeout(iconLayoutSaveTimer);
    iconLayoutSaveTimer = window.setTimeout(function () {
      iconLayoutSaveTimer = 0;
      postIconLayoutsSave();
    }, 120);
  }

  function persistIconLayoutsNow() {
    if (iconLayoutSaveTimer) {
      window.clearTimeout(iconLayoutSaveTimer);
      iconLayoutSaveTimer = 0;
    }
    postIconLayoutsSave();
  }

  function loadPersistedIconLayouts() {
    populateDefaultIconLayoutTable();
    mergePersistedIconLayoutPayload(getPersistedIconLayoutsPayload());
    applyAllSavedIconLayoutsAndResolve();
  }

  function getIconLayoutRoot() {
    if (!desktopIconsRoot) {
      desktopIconsRoot = document.getElementById("desktopIcons");
    }
    return desktopIconsRoot || desktopSurface;
  }

  function getIconMetrics(iconElement) {
    var width = ICON_GRID_CELL_WIDTH;
    var height = ICON_GRID_CELL_HEIGHT;
    if (!iconElement) {
      return {
        width: width,
        height: height
      };
    }
    if (iconElement.offsetWidth > 0) {
      width = iconElement.offsetWidth;
    }
    if (iconElement.offsetHeight > 0) {
      height = iconElement.offsetHeight;
    }
    return {
      width: width,
      height: height
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
      Math.floor((width - ICON_MIN_FOOTPRINT) / ICON_GRID_CELL_WIDTH) + 1
    );
    rowCount = Math.max(
      1,
      Math.floor((height - ICON_MIN_FOOTPRINT) / ICON_GRID_CELL_HEIGHT) + 1
    );
    while (
      columnCount > 1 &&
      (columnCount - 1) * ICON_GRID_CELL_WIDTH + ICON_MIN_FOOTPRINT > width
    ) {
      columnCount = columnCount - 1;
    }
    while (
      rowCount > 1 &&
      (rowCount - 1) * ICON_GRID_CELL_HEIGHT + ICON_MIN_FOOTPRINT > height
    ) {
      rowCount = rowCount - 1;
    }
    if (columnCount > 1) {
      columnStep = (width - ICON_MIN_FOOTPRINT) / (columnCount - 1);
    } else {
      columnStep = 0;
    }
    if (rowCount > 1) {
      rowStep = (height - ICON_MIN_FOOTPRINT) / (rowCount - 1);
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

  function resolveIconDropPosition(iconElement, left, top, clientX, clientY, excludeIcons) {
    var excludeTarget = excludeIcons || iconElement;
    return findClosestFreeIconPosition(iconElement, left, top, excludeTarget);
  }

  function getIconMinimumSeparation(iconElement) {
    var metrics = getIconMetrics(iconElement);
    var minSide = metrics.width;
    if (metrics.height < minSide) {
      minSide = metrics.height;
    }
    if (minSide < ICON_MIN_FOOTPRINT) {
      return ICON_MIN_FOOTPRINT * 0.5;
    }
    return minSide * 0.5;
  }

  function getIconCenterFromLayoutPosition(left, top, iconElement) {
    var metrics = getIconMetrics(iconElement);
    return {
      left: left + metrics.width * 0.5,
      top: top + metrics.height * 0.5
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
      if (distanceSquared <= minSeparationSquared) {
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
    var placementSize = getDesktopPlacementSize();
    var metrics = getIconMetrics(iconElement);
    var maxLeft = Math.max(0, placementSize.width - metrics.width);
    var maxTop = Math.max(0, placementSize.height - metrics.height);
    if (left < 0) left = 0;
    if (top < 0) top = 0;
    if (left > maxLeft) left = maxLeft;
    if (top > maxTop) top = maxTop;
    return { left: left, top: top };
  }

  function applyIconPosition(iconElement, left, top) {
    var clamped = clampIconPosition(iconElement, left, top);
    left = clamped.left;
    top = clamped.top;
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

    function beginMarqueeSelectAt(clientX, clientY, pointerId) {
      var windowManager;
      var point;
      if (activeMarqueeSelect || activeIconDrag || pendingIconPress) return;
      if (!desktopMarqueeBox) return;
      windowManager = getWindowManager();
      if (windowManager && windowManager.clearDesktopWindowFocus) {
        windowManager.clearDesktopWindowFocus();
      }
      point = clientPointToLayoutPoint(clientX, clientY);
      activeMarqueeSelect = {
        pointerId: pointerId,
        startX: point.left,
        startY: point.top,
        currentX: point.left,
        currentY: point.top,
        boxElement: desktopMarqueeBox,
        layerElement: desktopSurface,
        moved: false
      };
      if (pointerId != null) {
        try {
          desktopSurface.setPointerCapture(pointerId);
        } catch (error) { }
      }
    }

    function onMarqueePointerDown(event) {
      if (event.button != null && event.button !== 0) return;
      if (event.isPrimary === false) return;
      if (!shouldBeginDesktopMarqueeFromTarget(event.target)) return;
      beginMarqueeSelectAt(event.clientX, event.clientY, event.pointerId);
      event.preventDefault();
    }

    function onMarqueeMouseDown(event) {
      if (event.button != null && event.button !== 0) return;
      if (!shouldBeginDesktopMarqueeFromTarget(event.target)) return;
      beginMarqueeSelectAt(event.clientX, event.clientY, null);
      event.preventDefault();
    }

    desktopSurface.addEventListener("pointerdown", onMarqueePointerDown);
    desktopSurface.addEventListener("mousedown", onMarqueeMouseDown);
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

  function activateDesktopIconFromTap(iconElement) {
    if (shouldSuppressIconActivation(iconElement)) return;
    onIconActivated(iconElement);
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

    applyIconPosition(primaryIconElement, resolvedDropPosition.left, resolvedDropPosition.top);
    syncIconLayoutFromElement(primaryIconElement);
    placedGroupIcons.push(primaryIconElement);

    for (index = 0; index < drag.iconElements.length; index++) {
      iconElement = drag.iconElements[index];
      if (iconElement === primaryIconElement) continue;
      startPosition = getDragStartPositionForIcon(drag, iconElement);
      occupancyExcludeIcons = getUnplacedGroupDragExcludeIcons(drag.iconElements, placedGroupIcons);
      resolvedDropPosition = resolveIconDropPosition(
        iconElement,
        startPosition.left + deltaLeft,
        startPosition.top + deltaTop,
        null,
        null,
        occupancyExcludeIcons
      );
      applyIconPosition(iconElement, resolvedDropPosition.left, resolvedDropPosition.top);
      syncIconLayoutFromElement(iconElement);
      placedGroupIcons.push(iconElement);
    }
    scheduleIconLayoutsSave();
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

    pendingIconPress = null;
  }

  function onDocumentMouseUp(event) {
    if (event.button != null && event.button !== 0) return;
    if (window.PointerEvent) return;
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
      if (event.button != null && event.button !== 0) return;
      if (shouldSuppressIconActivation(iconElement)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      selectSingleIcon(iconElement);
      activateDesktopIconFromTap(iconElement);
      event.preventDefault();
      event.stopPropagation();
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

  function updateConnectWindowsGameModeVisibility() {
    var connectPresets = ["connect-col-0", "connect-col-1", "connect-col-2"];
    var windowManager = getWindowManager();
    var index;
    var presetName;
    var windowElement;
    if (isGameMode()) {
      for (index = 0; index < connectPresets.length; index++) {
        presetName = connectPresets[index];
        windowElement = getWindowByPreset(presetName);
        if (windowElement && isWindowVisible(windowElement)) {
          closeWindowVisualOnly(presetName);
        }
      }
      return;
    }
    if (!windowManager || !windowManager.shouldDesktopWindowBeOpen) return;
    for (index = 0; index < connectPresets.length; index++) {
      presetName = connectPresets[index];
      windowElement = getWindowByPreset(presetName);
      if (!windowElement) continue;
      if (windowManager.shouldDesktopWindowBeOpen(presetName)) {
        if (!isWindowVisible(windowElement)) {
          if (windowManager.prepareWindowForOpen) {
            windowManager.prepareWindowForOpen(windowElement);
          }
          windowElement.classList.remove("os-window--closed");
          if (windowManager.ensureWindowStructure) {
            windowManager.ensureWindowStructure(windowElement);
          }
          if (windowManager.syncWindowLayout) {
            windowManager.syncWindowLayout(windowElement);
          }
          if (windowManager.clampManagedWindowToContainer) {
            windowManager.clampManagedWindowToContainer(windowElement);
          }
          runWindowOpenHooks(windowElement, presetName);
          syncScreenEffectsState();
        }
      } else if (isWindowVisible(windowElement)) {
        closeWindowVisualOnly(presetName);
      }
    }
  }

  function updateActionIconsState() {
    if (!desktopIconsRoot) return;
    var disconnectIcon = desktopIconsRoot.querySelector(
      '.os-desktop-icon[data-desktop-icon="' + ICON_ACTION_DISCONNECT + '"]'
    );
    var connectIconIds = ["worlds", "servers", "steam"];
    var connectEnabled = !isGameMode();
    var index;
    var iconElement;
    if (disconnectIcon) {
      applyDesktopIconVisibilityToElement(disconnectIcon);
      if (!disconnectIcon.hidden) {
        disconnectIcon.removeAttribute("hidden");
        disconnectIcon.setAttribute("aria-hidden", "false");
        if (isGameMode()) {
          disconnectIcon.classList.remove(ICON_DISABLED_CLASS);
          disconnectIcon.removeAttribute("aria-disabled");
        } else {
          disconnectIcon.classList.add(ICON_DISABLED_CLASS);
          disconnectIcon.setAttribute("aria-disabled", "true");
        }
      }
    }
    for (index = 0; index < connectIconIds.length; index++) {
      iconElement = desktopIconsRoot.querySelector(
        '.os-desktop-icon[data-desktop-icon="' + connectIconIds[index] + '"]'
      );
      if (!iconElement) continue;
      applyDesktopIconVisibilityToElement(iconElement);
      if (iconElement.hidden) continue;
      iconElement.removeAttribute("hidden");
      iconElement.setAttribute("aria-hidden", "false");
      if (connectEnabled) {
        iconElement.classList.remove(ICON_DISABLED_CLASS);
        iconElement.removeAttribute("aria-disabled");
      } else {
        iconElement.classList.add(ICON_DISABLED_CLASS);
        iconElement.setAttribute("aria-disabled", "true");
      }
    }
    updateConnectWindowsGameModeVisibility();
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

    cancelPendingIconLayoutSave();

    updateMenuLayoutPhoneMode();

    if (window.WebDesktopAppIcons && window.WebDesktopAppIcons.mountDesktopIcons) {
      window.WebDesktopAppIcons.mountDesktopIcons();
    }

    initDesktopMarqueeLayer();

    loadGameDesktopLinksFromStorage();
    populateDefaultIconLayoutTable();
    mergePersistedIconLayoutPayload(getPersistedIconLayoutsPayload());
    clearIconLayoutBootstrap();
    syncGameDesktopLinkIdsFromIconLayoutTable();

    var icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    var index = 0;
    for (index = 0; index < icons.length; index++) {
      bindDesktopIcon(icons[index]);
    }

    applyAllSavedIconLayoutsAndResolve();
    restoreEnabledGameDesktopIcons();
    updateActionIconsState();

    if (!isUnityHost()) {
      window.__cmIconLayoutsPayload = buildIconLayoutsPayload();
    }

    document.addEventListener("pointermove", onIconPointerMove);
    document.addEventListener("mousemove", onIconPointerMove);
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
    var wasPhone = menuLayoutPhoneVertical;
    updateMenuLayoutPhoneMode();
    if (wasPhone !== menuLayoutPhoneVertical) {
      populateDefaultIconLayoutTable();
      if (!isUnityHost()) {
        mergePersistedIconLayoutPayload(readIconLayoutsFromStorage());
      }
    } else {
      clearIconGridLayoutCache();
    }
    applyAllSavedIconLayoutsAndResolve();
  }

  function getRouteWindowPresetFromLocation() {
    if (isUnityHost()) {
      return "";
    }
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
      return;
    }
    if (routePreset && windowManager && windowManager.isDesktopWindowPreset(routePreset)) {
      if (menuLayoutPhoneVertical) {
        hideWindowElementVisualOnly(getWindowByPreset(WINDOW_PRESET_TITLE));
      } else if (shouldOpenTitleWindowFromSaved()) {
        openWindow(WINDOW_PRESET_TITLE, false);
      }
      return;
    }
    closeAllAppWindowsVisualOnly();
    if (menuLayoutPhoneVertical) {
      hideWindowElementVisualOnly(getWindowByPreset(WINDOW_PRESET_TITLE));
      return;
    }
    openWindow(WINDOW_PRESET_TITLE, false);
  }

  function onDesktopWindowsRestored() {
    function runDesktopWindowOpenHooks() {
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

    runDesktopWindowOpenHooks();
  }

  function isWindowOpen(presetName) {
    return isWindowVisible(getWindowByPreset(presetName));
  }

  function isDesktopIconVisibleOnDesktop(iconId) {
    if (!iconId) return true;
    if (Object.prototype.hasOwnProperty.call(desktopIconVisibilityTable, iconId)) {
      return desktopIconVisibilityTable[iconId] !== false;
    }
    if (Object.prototype.hasOwnProperty.call(DESKTOP_ICON_DEFAULT_VISIBLE, iconId)) {
      return DESKTOP_ICON_DEFAULT_VISIBLE[iconId] === true;
    }
    if (iconId.indexOf(START_MENU_GAME_ICON_PREFIX) === 0) {
      return true;
    }
    return false;
  }

  function writeDesktopIconVisibilityToStorage() {
    try {
      localStorage.setItem(
        DESKTOP_ICON_VISIBILITY_STORAGE_KEY,
        JSON.stringify(desktopIconVisibilityTable)
      );
    } catch (error) {
    }
  }

  function loadDesktopIconVisibilityFromStorage() {
    var payload;
    var iconId;
    try {
      var raw = localStorage.getItem(DESKTOP_ICON_VISIBILITY_STORAGE_KEY);
      if (!raw) return;
      payload = JSON.parse(raw);
      if (!payload || typeof payload !== "object") return;
      for (iconId in payload) {
        if (!Object.prototype.hasOwnProperty.call(payload, iconId)) continue;
        desktopIconVisibilityTable[iconId] = payload[iconId] !== false;
      }
    } catch (error) {
    }
  }

  function setDesktopIconVisibleOnDesktop(iconId, visible) {
    if (!iconId) return;
    desktopIconVisibilityTable[iconId] = visible === true;
    writeDesktopIconVisibilityToStorage();
    applyDesktopIconVisibilityToElement(
      desktopIconsRoot
        ? desktopIconsRoot.querySelector('.os-desktop-icon[data-desktop-icon="' + iconId + '"]')
        : null
    );
    updateActionIconsState();
    updateDesktopTabOrder();
  }

  function applyDesktopIconVisibilityToElement(iconElement) {
    if (!iconElement) return;
    var iconId = iconElement.getAttribute("data-desktop-icon");
    if (!iconId) return;
    if (!isDesktopIconVisibleOnDesktop(iconId)) {
      iconElement.hidden = true;
      iconElement.setAttribute("hidden", "");
      iconElement.setAttribute("aria-hidden", "true");
      return;
    }
    iconElement.hidden = false;
    iconElement.removeAttribute("hidden");
    iconElement.setAttribute("aria-hidden", "false");
  }

  function applyAllDesktopIconVisibility() {
    var icons;
    var index;
    if (!desktopIconsRoot) return;
    icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    for (index = 0; index < icons.length; index++) {
      applyDesktopIconVisibilityToElement(icons[index]);
    }
  }

  function getTaskbarWindowKey(windowElement) {
    var presetName;
    var gameId;
    if (!windowElement) return "";
    presetName = windowElement.getAttribute("data-wm-preset") || "";
    if (!presetName) return "";
    if (presetName === "extras-game") {
      gameId = windowElement.getAttribute("data-extras-game-id") || "";
      if (gameId) {
        return presetName + ":" + gameId;
      }
    }
    return presetName;
  }

  function getTaskbarTitleLabelFromElement(titleElement, textElement) {
    var localeKey;
    var fallbackText;
    if (textElement) {
      localeKey = textElement.getAttribute("data-locale-key");
      fallbackText = textElement.textContent || "";
      if (localeKey && window.WebLocale && window.WebLocale.get) {
        return window.WebLocale.get(localeKey, fallbackText);
      }
      if (fallbackText) {
        return fallbackText;
      }
    }
    if (!titleElement) return "";
    localeKey = titleElement.getAttribute("data-locale-key");
    fallbackText = titleElement.textContent || "";
    if (localeKey && window.WebLocale && window.WebLocale.get) {
      return window.WebLocale.get(localeKey, fallbackText);
    }
    if (fallbackText) {
      return fallbackText;
    }
    return "";
  }

  function getTaskbarWindowLabel(windowElement) {
    var titleElement;
    var textElement;
    if (!windowElement) return "";
    titleElement = windowElement.querySelector(".os-window-title");
    if (!titleElement) return "";
    textElement = titleElement.querySelector(".os-window-title-text");
    return getTaskbarTitleLabelFromElement(titleElement, textElement);
  }

  function getGameById(gameId) {
    if (!gameId || !window.WebExtrasManifest || !window.WebExtrasManifest.games) return null;
    var games = window.WebExtrasManifest.games;
    var index = 0;
    for (index = 0; index < games.length; index++) {
      if (games[index] && games[index].id === gameId) {
        return games[index];
      }
    }
    return null;
  }

  function getTaskbarWindowIconSrc(windowElement) {
    var presetName;
    var iconId;
    var gameId;
    var game;
    var gameIconElement;
    var gameIconImage;
    if (!windowElement) return "";
    presetName = windowElement.getAttribute("data-wm-preset") || "";
    if (presetName === "extras-game") {
      gameId = windowElement.getAttribute("data-extras-game-id") || "";
      if (gameId) {
        gameIconElement = findGameDesktopIcon(gameId);
        if (gameIconElement) {
          gameIconImage = gameIconElement.querySelector(".os-app-icon");
          if (gameIconImage && gameIconImage.getAttribute("src")) {
            return gameIconImage.getAttribute("src");
          }
        }
        game = getGameById(gameId);
        if (game && getGameDesktopIconImagePath(game)) {
          return getGameDesktopIconImagePath(game);
        }
      }
    }
    if (window.WebDesktopAppIcons) {
      if (window.WebDesktopAppIcons.getIconIdForPreset) {
        iconId = window.WebDesktopAppIcons.getIconIdForPreset(presetName);
      }
      if (iconId && window.WebDesktopAppIcons.getDesktopIconSrc) {
        return window.WebDesktopAppIcons.getDesktopIconSrc(iconId);
      }
    }
    return "";
  }

  function createTaskbarAppIconImage(iconSrc) {
    var imageElement = document.createElement("img");
    imageElement.className = "os-taskbar-app-icon";
    imageElement.src = iconSrc;
    imageElement.alt = "";
    imageElement.draggable = false;
    imageElement.width = TASKBAR_APP_ICON_PIXEL_SIZE;
    imageElement.height = TASKBAR_APP_ICON_PIXEL_SIZE;
    return imageElement;
  }

  function getFocusedDesktopWindowElement() {
    if (!desktopSurface) return null;
    return desktopSurface.querySelector(".os-window.os-window--focused[data-wm-preset]");
  }

  function isDesktopTaskbarWindowCandidate(windowElement) {
    if (!windowElement || !desktopSurface) return false;
    if (!desktopSurface.contains(windowElement)) return false;
    if (!windowElement.classList.contains("os-window--managed")) return false;
    if (windowElement.classList.contains("os-window--closed")) return false;
    if (!windowElement.getAttribute("data-wm-preset")) return false;
    return true;
  }

  function compareTaskbarWindowOrder(firstWindowElement, secondWindowElement) {
    var firstKey = getTaskbarWindowKey(firstWindowElement);
    var secondKey = getTaskbarWindowKey(secondWindowElement);
    var firstIndex = getTaskbarKeyOrderIndex(firstKey);
    var secondIndex = getTaskbarKeyOrderIndex(secondKey);
    if (firstIndex !== secondIndex) {
      return firstIndex - secondIndex;
    }
    return getWindowDefaultTaskbarOrder(firstWindowElement) - getWindowDefaultTaskbarOrder(secondWindowElement);
  }

  function getWindowDefaultTaskbarOrder(windowElement) {
    var order = parseInt(windowElement.getAttribute("data-wm-order"), 10);
    if (isNaN(order)) return 0;
    return order;
  }

  function readTaskbarOrderFromStorage() {
    var payload;
    var raw;
    if (window.__cmTaskbarOrderPayload && window.__cmTaskbarOrderPayload.keys && window.__cmTaskbarOrderPayload.keys.length) {
      taskbarOrderKeys = window.__cmTaskbarOrderPayload.keys.slice();
      return;
    }
    try {
      raw = localStorage.getItem(TASKBAR_ORDER_STORAGE_KEY);
      if (!raw) return;
      payload = JSON.parse(raw);
      if (!payload || !payload.keys || !payload.keys.length) return;
      taskbarOrderKeys = payload.keys.slice();
      window.__cmTaskbarOrderPayload = { keys: taskbarOrderKeys.slice() };
    } catch (error) {
    }
  }

  function writeTaskbarOrderToStorage() {
    var payload;
    try {
      payload = { keys: taskbarOrderKeys.slice() };
      localStorage.setItem(TASKBAR_ORDER_STORAGE_KEY, JSON.stringify(payload));
      window.__cmTaskbarOrderPayload = payload;
    } catch (error) {
    }
    if (window.WebMenuLocalStorageBridge && window.WebMenuLocalStorageBridge.scheduleSaveToUnity) {
      window.WebMenuLocalStorageBridge.scheduleSaveToUnity();
    }
  }

  function getTaskbarKeyOrderIndex(taskbarKey) {
    var index;
    if (!taskbarKey) return Number.MAX_SAFE_INTEGER;
    for (index = 0; index < taskbarOrderKeys.length; index++) {
      if (taskbarOrderKeys[index] === taskbarKey) {
        return index;
      }
    }
    return Number.MAX_SAFE_INTEGER;
  }

  function ensureTaskbarOrderKeysLoaded() {
    if (taskbarOrderKeys.length) return;
    readTaskbarOrderFromStorage();
  }

  function sortOpenWindowsByTaskbarOrder(openWindows) {
    var openKeyToWindow = {};
    var sortedWindows = [];
    var trailingWindows = [];
    var index;
    var taskbarKey;
    var windowElement;
    var trailingIndex;
    for (index = 0; index < openWindows.length; index++) {
      windowElement = openWindows[index];
      taskbarKey = getTaskbarWindowKey(windowElement);
      if (!taskbarKey) continue;
      openKeyToWindow[taskbarKey] = windowElement;
    }
    for (index = 0; index < taskbarOrderKeys.length; index++) {
      taskbarKey = taskbarOrderKeys[index];
      if (!openKeyToWindow[taskbarKey]) continue;
      sortedWindows.push(openKeyToWindow[taskbarKey]);
      delete openKeyToWindow[taskbarKey];
    }
    for (taskbarKey in openKeyToWindow) {
      if (!Object.prototype.hasOwnProperty.call(openKeyToWindow, taskbarKey)) continue;
      trailingWindows.push(openKeyToWindow[taskbarKey]);
    }
    trailingWindows.sort(compareTaskbarWindowOrder);
    for (trailingIndex = 0; trailingIndex < trailingWindows.length; trailingIndex++) {
      sortedWindows.push(trailingWindows[trailingIndex]);
    }
    return sortedWindows;
  }

  function reorderTaskbarDomFromOpenWindows(taskbarAppsElement, openWindows) {
    var fragment;
    var index;
    var taskbarKey;
    var buttonElement;
    if (!taskbarAppsElement || !openWindows) return;
    fragment = document.createDocumentFragment();
    for (index = 0; index < openWindows.length; index++) {
      taskbarKey = getTaskbarWindowKey(openWindows[index]);
      if (!taskbarKey) continue;
      buttonElement = taskbarAppsElement.querySelector(
        '.os-taskbar-app[data-taskbar-key="' + taskbarKey + '"]'
      );
      if (buttonElement) {
        fragment.appendChild(buttonElement);
      }
    }
    taskbarAppsElement.appendChild(fragment);
  }

  function syncTaskbarOrderKeysWithOpenWindows(openWindows) {
    var openKeyTable = {};
    var newWindowEntries = [];
    var index;
    var windowElement;
    var taskbarKey;
    var taskbarKeyName;
    var orderChanged = false;
    var previousLength;
    for (index = 0; index < openWindows.length; index++) {
      windowElement = openWindows[index];
      taskbarKey = getTaskbarWindowKey(windowElement);
      if (!taskbarKey) continue;
      openKeyTable[taskbarKey] = windowElement;
    }
    previousLength = taskbarOrderKeys.length;
    for (taskbarKeyName in openKeyTable) {
      if (!Object.prototype.hasOwnProperty.call(openKeyTable, taskbarKeyName)) continue;
      if (getTaskbarKeyOrderIndex(taskbarKeyName) !== Number.MAX_SAFE_INTEGER) continue;
      newWindowEntries.push({
        key: taskbarKeyName,
        windowElement: openKeyTable[taskbarKeyName]
      });
    }
    newWindowEntries.sort(function (entryA, entryB) {
      return (
        getWindowDefaultTaskbarOrder(entryA.windowElement) -
        getWindowDefaultTaskbarOrder(entryB.windowElement)
      );
    });
    for (index = 0; index < newWindowEntries.length; index++) {
      taskbarOrderKeys.push(newWindowEntries[index].key);
      orderChanged = true;
    }
    if (orderChanged && taskbarOrderKeys.length !== previousLength) {
      writeTaskbarOrderToStorage();
    }
  }

  function flushTaskbarOrderSave() {
    writeTaskbarOrderToStorage();
  }

  function mergeTaskbarOrderKeysFromDom(taskbarAppsElement) {
    var domKeys;
    var domKeySet = {};
    var nextKeys = [];
    var oldKeys;
    var oldIndex;
    var domIndex;
    var taskbarKey;
    domKeys = getTaskbarOrderKeysFromDom(taskbarAppsElement);
    for (domIndex = 0; domIndex < domKeys.length; domIndex++) {
      domKeySet[domKeys[domIndex]] = true;
    }
    oldKeys = taskbarOrderKeys.slice();
    domIndex = 0;
    for (oldIndex = 0; oldIndex < oldKeys.length; oldIndex++) {
      taskbarKey = oldKeys[oldIndex];
      if (!domKeySet[taskbarKey]) {
        nextKeys.push(taskbarKey);
        continue;
      }
      if (domIndex < domKeys.length) {
        nextKeys.push(domKeys[domIndex]);
        domIndex = domIndex + 1;
      }
    }
    while (domIndex < domKeys.length) {
      nextKeys.push(domKeys[domIndex]);
      domIndex = domIndex + 1;
    }
    taskbarOrderKeys = nextKeys;
  }

  function getTaskbarAppsElement() {
    return document.getElementById("osTaskbarApps");
  }

  function getTaskbarOrderKeysFromDom(taskbarAppsElement) {
    var buttonElements;
    var keys = [];
    var index;
    var taskbarKey;
    if (!taskbarAppsElement) return keys;
    buttonElements = taskbarAppsElement.querySelectorAll(".os-taskbar-app");
    for (index = 0; index < buttonElements.length; index++) {
      taskbarKey = buttonElements[index].getAttribute("data-taskbar-key") || "";
      if (taskbarKey) {
        keys.push(taskbarKey);
      }
    }
    return keys;
  }

  function getTaskbarDropCompareEdgeX(drag, dragLeft, dragRight) {
    if (!drag) return dragLeft;
    if (drag.pendingClientX > drag.startX) {
      return dragRight;
    }
    if (drag.pendingClientX < drag.startX) {
      return dragLeft;
    }
    return dragLeft + (dragRight - dragLeft) * 0.5;
  }

  function getTaskbarDropIndexFromDragEdges(taskbarAppsElement, slotElement, compareEdgeX) {
    var childElements;
    var index;
    var childElement;
    var rect;
    var centerX;
    var dropIndex;
    if (!taskbarAppsElement) return 0;
    childElements = taskbarAppsElement.children;
    dropIndex = 0;
    for (index = 0; index < childElements.length; index++) {
      childElement = childElements[index];
      if (childElement === slotElement) continue;
      rect = childElement.getBoundingClientRect();
      centerX = rect.left + rect.width * 0.5;
      if (compareEdgeX < centerX) {
        return dropIndex;
      }
      dropIndex = dropIndex + 1;
    }
    return dropIndex;
  }

  function getTaskbarDropIndexForActiveDrag(taskbarAppsElement, drag) {
    var buttonRect;
    var compareEdgeX;
    if (!taskbarAppsElement || !drag || !drag.buttonElement || !drag.placeholderElement) return 0;
    buttonRect = drag.buttonElement.getBoundingClientRect();
    compareEdgeX = getTaskbarDropCompareEdgeX(drag, buttonRect.left, buttonRect.right);
    return getTaskbarDropIndexFromDragEdges(taskbarAppsElement, drag.placeholderElement, compareEdgeX);
  }

  function moveTaskbarSlotToDropIndex(taskbarAppsElement, slotElement, dropIndex) {
    var childElements;
    var index;
    var childElement;
    var referenceElement;
    var currentDropIndex;
    if (!taskbarAppsElement || !slotElement) return;
    referenceElement = null;
    currentDropIndex = 0;
    childElements = taskbarAppsElement.children;
    for (index = 0; index < childElements.length; index++) {
      childElement = childElements[index];
      if (childElement === slotElement) continue;
      if (currentDropIndex === dropIndex) {
        referenceElement = childElement;
        break;
      }
      currentDropIndex = currentDropIndex + 1;
    }
    if (referenceElement) {
      if (slotElement.nextSibling !== referenceElement) {
        taskbarAppsElement.insertBefore(slotElement, referenceElement);
      }
      return;
    }
    if (taskbarAppsElement.lastElementChild !== slotElement) {
      taskbarAppsElement.appendChild(slotElement);
    }
  }

  function clearTaskbarDragButtonStyles(buttonElement) {
    if (!buttonElement) return;
    buttonElement.style.position = "";
    buttonElement.style.top = "";
    buttonElement.style.left = "";
    buttonElement.style.width = "";
    buttonElement.style.height = "";
    buttonElement.style.margin = "";
    buttonElement.style.zIndex = "";
    buttonElement.style.boxShadow = "";
    buttonElement.style.pointerEvents = "";
  }

  function updateTaskbarDragButtonPosition(drag, clientX) {
    if (!drag || !drag.buttonElement) return;
    drag.buttonElement.style.left = Math.round(clientX - drag.grabOffsetX) + "px";
  }

  function applyTaskbarDragPointerUpdate() {
    var drag;
    var taskbarAppsElement;
    var dropIndex;
    drag = activeTaskbarDrag;
    if (!drag) return;
    drag.rafId = 0;
    updateTaskbarDragButtonPosition(drag, drag.pendingClientX);
    taskbarAppsElement = getTaskbarAppsElement();
    if (!taskbarAppsElement || !drag.placeholderElement) return;
    dropIndex = getTaskbarDropIndexForActiveDrag(taskbarAppsElement, drag);
    if (dropIndex !== drag.lastDropIndex) {
      moveTaskbarSlotToDropIndex(taskbarAppsElement, drag.placeholderElement, dropIndex);
      drag.lastDropIndex = dropIndex;
      drag.orderChanged = true;
    }
  }

  function scheduleTaskbarDragPointerUpdate(clientX) {
    if (!activeTaskbarDrag) return;
    activeTaskbarDrag.pendingClientX = clientX;
    if (activeTaskbarDrag.rafId) return;
    activeTaskbarDrag.rafId = window.requestAnimationFrame(applyTaskbarDragPointerUpdate);
  }

  function cancelTaskbarDragPointerUpdate() {
    if (!activeTaskbarDrag || !activeTaskbarDrag.rafId) return;
    window.cancelAnimationFrame(activeTaskbarDrag.rafId);
    activeTaskbarDrag.rafId = 0;
  }

  function clearSuppressTaskbarClick() {
    suppressTaskbarClickKey = "";
    if (suppressTaskbarClickTimer) {
      window.clearTimeout(suppressTaskbarClickTimer);
      suppressTaskbarClickTimer = 0;
    }
  }

  function endTaskbarDrag(wasDragging) {
    var drag;
    var taskbarAppsElement;
    if (!activeTaskbarDrag) {
      pendingTaskbarPress = null;
      return;
    }
    drag = activeTaskbarDrag;
    cancelTaskbarDragPointerUpdate();
    if (drag.buttonElement) {
      drag.buttonElement.classList.remove("os-taskbar-app--dragging");
      try {
        drag.buttonElement.releasePointerCapture(drag.pointerId);
      } catch (error) {
      }
    }
    taskbarAppsElement = getTaskbarAppsElement();
    if (taskbarAppsElement && drag.placeholderElement && drag.placeholderElement.parentNode) {
      taskbarAppsElement.insertBefore(drag.buttonElement, drag.placeholderElement);
      drag.placeholderElement.parentNode.removeChild(drag.placeholderElement);
    }
    if (drag.buttonElement) {
      clearTaskbarDragButtonStyles(drag.buttonElement);
    }
    if (taskbarAppsElement) {
      taskbarAppsElement.removeAttribute("data-taskbar-drag");
      if (wasDragging) {
        clearSuppressTaskbarClick();
        suppressTaskbarClickKey = drag.taskbarKey;
        suppressTaskbarClickTimer = window.setTimeout(clearSuppressTaskbarClick, ICON_CLICK_SUPPRESS_MS);
      }
      if (wasDragging || drag.orderChanged) {
        mergeTaskbarOrderKeysFromDom(taskbarAppsElement);
        writeTaskbarOrderToStorage();
      }
    }
    activeTaskbarDrag = null;
    pendingTaskbarPress = null;
  }

  function beginTaskbarDrag(buttonElement, clientX, clientY, pointerId) {
    var taskbarAppsElement;
    var taskbarKey;
    var rect;
    var placeholderElement;
    if (!buttonElement) return;
    taskbarKey = buttonElement.getAttribute("data-taskbar-key") || "";
    taskbarAppsElement = getTaskbarAppsElement();
    if (!taskbarAppsElement) return;
    rect = buttonElement.getBoundingClientRect();
    placeholderElement = document.createElement("div");
    placeholderElement.className = "os-taskbar-app-placeholder";
    placeholderElement.style.width = Math.round(rect.width) + "px";
    placeholderElement.style.minWidth = Math.round(rect.width) + "px";
    placeholderElement.setAttribute("aria-hidden", "true");
    taskbarAppsElement.insertBefore(placeholderElement, buttonElement);
    buttonElement.classList.add("os-taskbar-app--dragging");
    buttonElement.style.position = "fixed";
    buttonElement.style.top = Math.round(rect.top) + "px";
    buttonElement.style.left = Math.round(rect.left) + "px";
    buttonElement.style.width = Math.round(rect.width) + "px";
    buttonElement.style.height = Math.round(rect.height) + "px";
    buttonElement.style.margin = "0";
    buttonElement.style.zIndex = "30";
    activeTaskbarDrag = {
      buttonElement: buttonElement,
      placeholderElement: placeholderElement,
      taskbarKey: taskbarKey,
      pointerId: pointerId,
      startX: clientX,
      startY: clientY,
      grabOffsetX: clientX - rect.left,
      pendingClientX: clientX,
      lastDropIndex: 0,
      orderChanged: false,
      rafId: 0
    };
    if (taskbarAppsElement) {
      taskbarAppsElement.setAttribute("data-taskbar-drag", "");
    }
    updateTaskbarDragButtonPosition(activeTaskbarDrag, clientX);
    activeTaskbarDrag.lastDropIndex = getTaskbarDropIndexForActiveDrag(taskbarAppsElement, activeTaskbarDrag);
    try {
      buttonElement.setPointerCapture(pointerId);
    } catch (error) {
    }
  }

  function tryStartTaskbarDragFromPendingPress(clientX, clientY, pointerId) {
    var press;
    var startThresholdSquared;
    var moveDistanceSquared;
    if (!pendingTaskbarPress) return false;
    if (
      pointerId != null &&
      pendingTaskbarPress.pointerId != null &&
      pointerId !== pendingTaskbarPress.pointerId
    ) {
      return false;
    }
    press = pendingTaskbarPress;
    startThresholdSquared = TASKBAR_DRAG_START_THRESHOLD_PX * TASKBAR_DRAG_START_THRESHOLD_PX;
    moveDistanceSquared = getPointerMoveDistanceSquared(clientX, clientY, press.startX, press.startY);
    if (moveDistanceSquared < startThresholdSquared) return false;
    pendingTaskbarPress = null;
    beginTaskbarDrag(press.buttonElement, clientX, clientY, press.pointerId);
    return true;
  }

  function onTaskbarAppPointerDown(event) {
    var buttonElement;
    if (!event || event.button !== 0) return;
    if (event.isPrimary === false) return;
    if (activeTaskbarDrag) return;
    buttonElement = event.target.closest(".os-taskbar-app");
    if (!buttonElement) return;
    pendingTaskbarPress = {
      buttonElement: buttonElement,
      startX: event.clientX,
      startY: event.clientY,
      pointerId: event.pointerId
    };
  }

  function onTaskbarDragPointerMove(event) {
    if (pendingTaskbarPress) {
      if (pendingTaskbarPress.pointerId != null) {
        if (event.pointerId != null && event.pointerId !== pendingTaskbarPress.pointerId) return;
      }
      if (tryStartTaskbarDragFromPendingPress(event.clientX, event.clientY, event.pointerId)) {
        scheduleTaskbarDragPointerUpdate(event.clientX);
      }
      return;
    }
    if (!activeTaskbarDrag) return;
    if (activeTaskbarDrag.pointerId != null) {
      if (event.pointerId != null && event.pointerId !== activeTaskbarDrag.pointerId) return;
    }
    scheduleTaskbarDragPointerUpdate(event.clientX);
  }

  function onTaskbarDragPointerUp(event) {
    var wasDragging = false;
    if (pendingTaskbarPress) {
      if (pendingTaskbarPress.pointerId != null) {
        if (event.pointerId != null && event.pointerId !== pendingTaskbarPress.pointerId) return;
      }
      pendingTaskbarPress = null;
      return;
    }
    if (!activeTaskbarDrag) return;
    if (activeTaskbarDrag.pointerId != null) {
      if (event.pointerId != null && event.pointerId !== activeTaskbarDrag.pointerId) return;
    }
    if (activeTaskbarDrag.rafId) {
      cancelTaskbarDragPointerUpdate();
      applyTaskbarDragPointerUpdate();
    } else if (activeTaskbarDrag.pendingClientX != null) {
      applyTaskbarDragPointerUpdate();
    }
    wasDragging = true;
    endTaskbarDrag(wasDragging);
  }

  function bindTaskbarDrag() {
    var taskbarAppsElement;
    if (document.documentElement.wmTaskbarDragBound) return;
    taskbarAppsElement = getTaskbarAppsElement();
    if (!taskbarAppsElement) return;
    taskbarAppsElement.addEventListener("pointerdown", onTaskbarAppPointerDown);
    document.addEventListener("pointermove", onTaskbarDragPointerMove);
    document.addEventListener("pointerup", onTaskbarDragPointerUp);
    document.addEventListener("pointercancel", onTaskbarDragPointerUp);
    document.documentElement.wmTaskbarDragBound = true;
  }

  function onTaskbarAppClick(event) {
    var buttonElement;
    var taskbarKey;
    var windowElement;
    var windowManager;
    var focusedWindow;
    if (!event || event.button !== 0) return;
    buttonElement = event.currentTarget;
    taskbarKey = buttonElement.getAttribute("data-taskbar-key") || "";
    if (taskbarKey && taskbarKey === suppressTaskbarClickKey) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!taskbarKey || !desktopSurface) return;
    windowElement = desktopSurface.querySelector(
      '.os-window[data-taskbar-key="' + taskbarKey + '"]'
    );
    if (!windowElement) return;
    event.preventDefault();
    event.stopPropagation();
    windowManager = getWindowManager();
    if (!windowManager) return;
    if (windowElement.classList.contains("os-window--minimized")) {
      if (windowManager.restoreWindow) {
        windowManager.restoreWindow(windowElement);
      }
      syncTaskbarApps();
      return;
    }
    focusedWindow = getFocusedDesktopWindowElement();
    if (focusedWindow === windowElement) {
      if (windowManager.minimizeWindow) {
        windowManager.minimizeWindow(windowElement);
      }
      syncTaskbarApps();
      return;
    }
    if (windowManager.focusWindow) {
      windowManager.focusWindow(windowElement);
    }
    if (windowManager.setWindowKeyboardFocus) {
      windowManager.setWindowKeyboardFocus(windowElement);
    }
    syncTaskbarApps();
  }

  function syncTaskbarApps() {
    var taskbarAppsElement;
    var windows;
    var openWindows = [];
    var existingButtons = {};
    var existingButtonElements;
    var buttonIndex;
    var focusedWindow;
    var index;
    var windowElement;
    var taskbarKey;
    var buttonElement;
    var iconSrc;
    var labelText;
    var labelElement;
    var skipDomReorder;
    taskbarAppsElement = document.getElementById("osTaskbarApps");
    if (!taskbarAppsElement || !desktopSurface) return;
    skipDomReorder = !!activeTaskbarDrag;
    ensureTaskbarOrderKeysLoaded();
    windows = desktopSurface.querySelectorAll(".os-window[data-wm-preset]");
    for (index = 0; index < windows.length; index++) {
      windowElement = windows[index];
      if (!isDesktopTaskbarWindowCandidate(windowElement)) continue;
      taskbarKey = getTaskbarWindowKey(windowElement);
      if (!taskbarKey) continue;
      windowElement.setAttribute("data-taskbar-key", taskbarKey);
      openWindows.push(windowElement);
    }
    if (!skipDomReorder) {
      syncTaskbarOrderKeysWithOpenWindows(openWindows);
      openWindows = sortOpenWindowsByTaskbarOrder(openWindows);
    }
    existingButtonElements = taskbarAppsElement.querySelectorAll(".os-taskbar-app");
    for (buttonIndex = 0; buttonIndex < existingButtonElements.length; buttonIndex++) {
      buttonElement = existingButtonElements[buttonIndex];
      existingButtons[buttonElement.getAttribute("data-taskbar-key") || ""] = buttonElement;
    }
    if (skipDomReorder && activeTaskbarDrag && activeTaskbarDrag.taskbarKey) {
      delete existingButtons[activeTaskbarDrag.taskbarKey];
    }
    focusedWindow = getFocusedDesktopWindowElement();
    for (index = 0; index < openWindows.length; index++) {
      windowElement = openWindows[index];
      taskbarKey = getTaskbarWindowKey(windowElement);
      iconSrc = getTaskbarWindowIconSrc(windowElement);
      labelText = getTaskbarWindowLabel(windowElement);
      if (existingButtons[taskbarKey]) {
        buttonElement = existingButtons[taskbarKey];
        delete existingButtons[taskbarKey];
      } else {
        buttonElement = document.createElement("button");
        buttonElement.type = "button";
        buttonElement.className = "os-taskbar-app";
        buttonElement.setAttribute("data-taskbar-key", taskbarKey);
        buttonElement.addEventListener("click", onTaskbarAppClick);
        taskbarAppsElement.appendChild(buttonElement);
      }
      buttonElement.classList.toggle(
        "os-taskbar-app--active",
        focusedWindow === windowElement && !windowElement.classList.contains("os-window--minimized")
      );
      buttonElement.classList.toggle(
        "os-taskbar-app--minimized",
        windowElement.classList.contains("os-window--minimized")
      );
      if (iconSrc) {
        if (!buttonElement.firstChild || !buttonElement.firstChild.classList.contains("os-taskbar-app-icon")) {
          buttonElement.textContent = "";
          buttonElement.appendChild(createTaskbarAppIconImage(iconSrc));
          labelElement = document.createElement("span");
          labelElement.className = "os-taskbar-app-label";
          buttonElement.appendChild(labelElement);
        } else if (buttonElement.firstChild.getAttribute("src") !== iconSrc) {
          buttonElement.firstChild.setAttribute("src", iconSrc);
        }
        labelElement = buttonElement.querySelector(".os-taskbar-app-label");
        if (labelElement) {
          labelElement.textContent = labelText;
        }
      } else {
        buttonElement.textContent = labelText;
      }
      buttonElement.setAttribute("aria-label", labelText);
    }
    if (!skipDomReorder) {
      reorderTaskbarDomFromOpenWindows(taskbarAppsElement, openWindows);
    }
    for (taskbarKey in existingButtons) {
      if (!Object.prototype.hasOwnProperty.call(existingButtons, taskbarKey)) continue;
      buttonElement = existingButtons[taskbarKey];
      if (buttonElement && buttonElement.parentNode) {
        buttonElement.parentNode.removeChild(buttonElement);
      }
    }
    updateDesktopWindowsToggleState();
  }

  function getStartMenuIconSrc(iconElement) {
    var iconImage;
    var iconId;
    var game;
    if (!iconElement) return "";
    iconImage = iconElement.querySelector(".os-app-icon");
    if (iconImage && iconImage.getAttribute("src")) {
      return iconImage.getAttribute("src");
    }
    iconId = iconElement.getAttribute("data-desktop-icon") || "";
    if (iconId.indexOf("game-") === 0) {
      game = getGameById(iconId.slice(5));
      if (game && getGameDesktopIconImagePath(game)) {
        return getGameDesktopIconImagePath(game);
      }
      return "";
    }
    if (window.WebDesktopAppIcons && window.WebDesktopAppIcons.getDesktopIconSrc) {
      return window.WebDesktopAppIcons.getDesktopIconSrc(iconId);
    }
    return "";
  }

  function getStartMenuIconLabel(iconElement) {
    var labelElement;
    if (!iconElement) return "";
    labelElement = iconElement.querySelector(".os-desktop-icon-label");
    if (labelElement && labelElement.textContent) {
      return labelElement.textContent;
    }
    return "";
  }

  function hasStartMenuSubmenu(iconId) {
    if (!iconId) return false;
    if (START_MENU_SUBMENU_CHILDREN[iconId]) return true;
    return false;
  }

  function hasStartMenuNestedSubmenu(iconId) {
    if (!iconId) return false;
    if (iconId === START_MENU_GAMES_ICON_ID) return true;
    return false;
  }

  function getStartMenuSubmenuChildIconIds(iconId) {
    if (!iconId || iconId === START_MENU_GAMES_ICON_ID) return null;
    if (!START_MENU_SUBMENU_CHILDREN[iconId]) return null;
    return START_MENU_SUBMENU_CHILDREN[iconId];
  }

  function getDesktopIconElement(iconId) {
    if (!desktopIconsRoot || !iconId) return null;
    return desktopIconsRoot.querySelector('.os-desktop-icon[data-desktop-icon="' + iconId + '"]');
  }

  function appendStartMenuSubmenuArrow(itemElement) {
    var arrowElement;
    if (!itemElement) return;
    arrowElement = document.createElement("span");
    arrowElement.className = "os-start-menu-item-arrow terminal-text--dim";
    arrowElement.setAttribute("aria-hidden", "true");
    arrowElement.textContent = "\u25B6";
    itemElement.appendChild(arrowElement);
  }

  function appendStartMenuSubmenuArrowPlaceholder(itemElement) {
    var arrowElement;
    if (!itemElement) return;
    arrowElement = document.createElement("span");
    arrowElement.className = "os-start-menu-item-arrow os-start-menu-item-arrow--placeholder";
    arrowElement.setAttribute("aria-hidden", "true");
    itemElement.appendChild(arrowElement);
  }

  function createStartMenuColumnHeader(isSubmenu) {
    var headerElement;
    var nameLabelElement;
    var linkLabelElement;
    var linkCellElement;
    var arrowSpacerElement;
    headerElement = document.createElement("div");
    headerElement.className = "os-start-menu-column-header";
    if (isSubmenu) {
      headerElement.className += " os-start-menu-column-header--submenu";
    } else {
      headerElement.className += " os-start-menu-column-header--main";
    }
    headerElement.setAttribute("role", "presentation");
    headerElement.appendChild(document.createElement("span"));
    nameLabelElement = document.createElement("span");
    nameLabelElement.className = "os-start-menu-column-header-name";
    nameLabelElement.textContent = START_MENU_COLUMN_NAME_LABEL;
    headerElement.appendChild(nameLabelElement);
    if (!isSubmenu) {
      arrowSpacerElement = document.createElement("span");
      arrowSpacerElement.className = "os-start-menu-column-header-arrow";
      arrowSpacerElement.setAttribute("aria-hidden", "true");
      headerElement.appendChild(arrowSpacerElement);
    }
    linkLabelElement = document.createElement("span");
    linkLabelElement.className = "os-start-menu-column-header-link-label";
    linkLabelElement.textContent = START_MENU_COLUMN_LINK_LABEL;
    linkCellElement = document.createElement("div");
    linkCellElement.className = "os-start-menu-item-desktop os-start-menu-column-header-link";
    linkCellElement.appendChild(linkLabelElement);
    headerElement.appendChild(linkCellElement);
    return headerElement;
  }

  function getStartMenuBodyShell() {
    var startMenuElement = document.getElementById("osStartMenu");
    if (!startMenuElement) return null;
    return startMenuElement.querySelector(".os-start-menu-body-shell");
  }

  function ensureStartMenuOpenReveal() {
    var bodyShellElement;
    var revealElement;
    bodyShellElement = getStartMenuBodyShell();
    if (!bodyShellElement) return;
    revealElement = bodyShellElement.querySelector(".os-start-menu-open-reveal");
    if (revealElement) return;
    revealElement = document.createElement("div");
    revealElement.className = "os-start-menu-open-reveal";
    revealElement.setAttribute("aria-hidden", "true");
    bodyShellElement.appendChild(revealElement);
  }

  function ensureStartSubmenuOpenReveal(submenuElement) {
    var revealElement;
    if (!submenuElement) return;
    revealElement = submenuElement.querySelector(".os-start-menu-open-reveal");
    if (revealElement) return;
    revealElement = document.createElement("div");
    revealElement.className = "os-start-menu-open-reveal";
    revealElement.setAttribute("aria-hidden", "true");
    submenuElement.appendChild(revealElement);
  }

  function ensureStartMenuColumnHeader() {
    var bodyShellElement;
    var scrollClipElement;
    var headerElement;
    bodyShellElement = getStartMenuBodyShell();
    if (!bodyShellElement) return;
    headerElement = bodyShellElement.querySelector(".os-start-menu-column-header--main");
    if (headerElement) return;
    scrollClipElement = bodyShellElement.querySelector(".os-start-menu-scroll-clip");
    headerElement = createStartMenuColumnHeader(false);
    if (scrollClipElement) {
      bodyShellElement.insertBefore(headerElement, scrollClipElement);
    } else {
      bodyShellElement.appendChild(headerElement);
    }
  }

  function setGameDesktopLinkFromStartMenu(gameId, enabled) {
    var game;
    if (!gameId) return;
    if (enabled) {
      game = getGameRecordById(gameId);
      if (!game) return;
      if (findGameDesktopIcon(gameId)) {
        setGameDesktopLinkEnabledState(gameId, true);
        persistGameDesktopLinksNow();
      } else {
        createGameDesktopIcon(game);
      }
    } else {
      removeGameDesktopIcon(gameId);
    }
  }

  function createGameDesktopLinkSwitch(gameId, isOn) {
    var switchButton;
    var trackElement;
    var thumbElement;
    switchButton = document.createElement("button");
    switchButton.type = "button";
    switchButton.className = "settings-switch";
    if (isOn) {
      switchButton.className += " is-on";
    }
    switchButton.setAttribute("role", "switch");
    switchButton.setAttribute("aria-checked", isOn ? "true" : "false");
    switchButton.setAttribute("data-game-id", gameId);
    trackElement = document.createElement("span");
    trackElement.className = "settings-switch-track";
    trackElement.setAttribute("aria-hidden", "true");
    thumbElement = document.createElement("span");
    thumbElement.className = "settings-switch-thumb";
    trackElement.appendChild(thumbElement);
    switchButton.appendChild(trackElement);
    switchButton.addEventListener("click", onStartMenuGameDesktopToggleClick);
    switchButton.addEventListener("pointerdown", onStartMenuDesktopTogglePointerDown);
    return switchButton;
  }

  function setStartMenuDesktopVisibilitySwitchState(iconId, isOn) {
    var startMenuElement;
    var flyoutsRoot;
    var switches;
    var index;
    var switchButton;
    var switchIconId;
    if (!iconId) return;
    startMenuElement = document.getElementById("osStartMenu");
    flyoutsRoot = getStartMenuFlyoutsRoot();
    if (startMenuElement) {
      switches = startMenuElement.querySelectorAll(".settings-switch[data-desktop-icon]");
      for (index = 0; index < switches.length; index++) {
        switchButton = switches[index];
        switchIconId = switchButton.getAttribute("data-desktop-icon") || "";
        if (switchIconId !== iconId) continue;
        switchButton.classList.toggle("is-on", isOn);
        switchButton.setAttribute("aria-checked", isOn ? "true" : "false");
      }
    }
    if (flyoutsRoot) {
      switches = flyoutsRoot.querySelectorAll(".settings-switch[data-desktop-icon]");
      for (index = 0; index < switches.length; index++) {
        switchButton = switches[index];
        switchIconId = switchButton.getAttribute("data-desktop-icon") || "";
        if (switchIconId !== iconId) continue;
        switchButton.classList.toggle("is-on", isOn);
        switchButton.setAttribute("aria-checked", isOn ? "true" : "false");
      }
    }
  }

  function setStartMenuGameDesktopLinkSwitchState(gameId, isOn) {
    var startMenuElement;
    var flyoutsRoot;
    var switches;
    var index;
    var switchButton;
    var switchGameId;
    if (!gameId) return;
    startMenuElement = document.getElementById("osStartMenu");
    flyoutsRoot = getStartMenuFlyoutsRoot();
    if (startMenuElement) {
      switches = startMenuElement.querySelectorAll(".settings-switch[data-game-id]");
      for (index = 0; index < switches.length; index++) {
        switchButton = switches[index];
        switchGameId = switchButton.getAttribute("data-game-id") || "";
        if (switchGameId !== gameId) continue;
        switchButton.classList.toggle("is-on", isOn);
        switchButton.setAttribute("aria-checked", isOn ? "true" : "false");
      }
    }
    if (flyoutsRoot) {
      switches = flyoutsRoot.querySelectorAll(".settings-switch[data-game-id]");
      for (index = 0; index < switches.length; index++) {
        switchButton = switches[index];
        switchGameId = switchButton.getAttribute("data-game-id") || "";
        if (switchGameId !== gameId) continue;
        switchButton.classList.toggle("is-on", isOn);
        switchButton.setAttribute("aria-checked", isOn ? "true" : "false");
      }
    }
  }

  function onStartMenuGameDesktopToggleClick(event) {
    var switchButton;
    var gameId;
    var nextEnabled;
    if (!event || !event.currentTarget) return;
    event.preventDefault();
    event.stopPropagation();
    switchButton = event.currentTarget;
    gameId = switchButton.getAttribute("data-game-id") || "";
    if (!gameId) return;
    nextEnabled = !switchButton.classList.contains("is-on");
    setStartMenuGameDesktopLinkSwitchState(gameId, nextEnabled);
    setGameDesktopLinkFromStartMenu(gameId, nextEnabled);
  }

  function createDesktopVisibilitySwitch(iconId, isOn) {
    var switchButton;
    var trackElement;
    var thumbElement;
    switchButton = document.createElement("button");
    switchButton.type = "button";
    switchButton.className = "settings-switch";
    if (isOn) {
      switchButton.className += " is-on";
    }
    switchButton.setAttribute("role", "switch");
    switchButton.setAttribute("aria-checked", isOn ? "true" : "false");
    switchButton.setAttribute("data-desktop-icon", iconId);
    trackElement = document.createElement("span");
    trackElement.className = "settings-switch-track";
    trackElement.setAttribute("aria-hidden", "true");
    thumbElement = document.createElement("span");
    thumbElement.className = "settings-switch-thumb";
    trackElement.appendChild(thumbElement);
    switchButton.appendChild(trackElement);
    switchButton.addEventListener("click", onStartMenuDesktopToggleClick);
    switchButton.addEventListener("pointerdown", onStartMenuDesktopTogglePointerDown);
    return switchButton;
  }

  function onStartMenuDesktopTogglePointerDown(event) {
    if (!event) return;
    event.stopPropagation();
  }

  function onStartMenuDesktopToggleClick(event) {
    var switchButton;
    var iconId;
    var nextVisible;
    if (!event || !event.currentTarget) return;
    event.preventDefault();
    event.stopPropagation();
    switchButton = event.currentTarget;
    iconId = switchButton.getAttribute("data-desktop-icon") || "";
    if (!iconId) return;
    nextVisible = !switchButton.classList.contains("is-on");
    setStartMenuDesktopVisibilitySwitchState(iconId, nextVisible);
    setDesktopIconVisibleOnDesktop(iconId, nextVisible);
  }

  function onStartMenuItemActivate(event) {
    var itemElement;
    var iconId;
    if (!event || event.button !== 0) return;
    if (event.target && event.target.closest(".os-start-menu-item-desktop")) return;
    if (event.target && event.target.closest(".settings-switch")) return;
    itemElement = event.currentTarget;
    iconId = itemElement.getAttribute("data-desktop-icon") || "";
    if (!iconId) return;
    event.preventDefault();
    event.stopPropagation();
    closeStartMenu();
    activateDesktopIconById(iconId);
  }

  function activateDesktopIconById(iconId) {
    activateDesktopIconAction(iconId);
  }

  function getStartMenuIconOrderIndex(iconId) {
    var index = 0;
    if (!iconId) return ICON_LAYOUT_RESOLVE_ORDER.length;
    for (index = 0; index < ICON_LAYOUT_RESOLVE_ORDER.length; index++) {
      if (ICON_LAYOUT_RESOLVE_ORDER[index] === iconId) {
        return index;
      }
    }
    return ICON_LAYOUT_RESOLVE_ORDER.length;
  }

  function compareStartMenuIconOrderById(firstIconId, secondIconId) {
    var firstIndex = getStartMenuIconOrderIndex(firstIconId);
    var secondIndex = getStartMenuIconOrderIndex(secondIconId);
    if (firstIndex !== secondIndex) {
      return firstIndex - secondIndex;
    }
    if (firstIconId < secondIconId) {
      return -1;
    }
    if (firstIconId > secondIconId) {
      return 1;
    }
    return 0;
  }

  function positionStartSubmenu(hostElement, submenuElement) {
    var hostRect;
    if (!hostElement || !submenuElement) return;
    hostRect = hostElement.getBoundingClientRect();
    submenuElement.style.left = Math.round(hostRect.right) + "px";
    submenuElement.style.bottom = Math.round(window.innerHeight - hostRect.bottom) + "px";
    submenuElement.style.top = "auto";
  }

  function closeAllStartSubmenus() {
    closeStartSubmenusExcept(null);
  }

  function closeStartSubmenusExcept(keepSubmenuElements) {
    var flyoutsRoot = getStartMenuFlyoutsRoot();
    var submenus;
    var index;
    var submenuElement;
    var keepIndex;
    var shouldKeep;
    if (!flyoutsRoot) return;
    submenus = flyoutsRoot.querySelectorAll(".os-start-menu-submenu.is-open");
    for (index = 0; index < submenus.length; index++) {
      submenuElement = submenus[index];
      shouldKeep = false;
      if (keepSubmenuElements) {
        for (keepIndex = 0; keepIndex < keepSubmenuElements.length; keepIndex++) {
          if (keepSubmenuElements[keepIndex] === submenuElement) {
            shouldKeep = true;
            break;
          }
        }
      }
      if (!shouldKeep) {
        submenuElement.classList.remove("is-open");
        submenuElement.classList.remove("os-start-menu-submenu--opening");
        clearStartMenuSubmenuOpenAnimationTimer(submenuElement);
      }
    }
  }

  function bindStartSubmenuHover(hostElement, submenuElement, hostIconId, parentSubmenuElement) {
    function showStartSubmenu() {
      var wasOpen = submenuElement.classList.contains("is-open");
      if (startSubmenuHideTimer) {
        window.clearTimeout(startSubmenuHideTimer);
        startSubmenuHideTimer = 0;
      }
      if (wasOpen) {
        return;
      }
      activeStartSubmenuIconId = hostIconId || "";
      if (parentSubmenuElement) {
        closeStartSubmenusExcept([parentSubmenuElement, submenuElement]);
      } else {
        closeAllStartSubmenus();
      }
      positionStartSubmenu(hostElement, submenuElement);
      submenuElement.classList.add("is-open");
      playStartSubmenuOpenAnimation(submenuElement);
    }

    function hideStartSubmenu() {
      if (startSubmenuHideTimer) {
        window.clearTimeout(startSubmenuHideTimer);
      }
      startSubmenuHideTimer = window.setTimeout(function () {
        submenuElement.classList.remove("is-open");
        submenuElement.classList.remove("os-start-menu-submenu--opening");
        clearStartMenuSubmenuOpenAnimationTimer(submenuElement);
        if (activeStartSubmenuIconId === hostIconId) {
          activeStartSubmenuIconId = parentSubmenuElement
            ? parentSubmenuElement.getAttribute("data-start-submenu-icon") || ""
            : "";
        }
        startSubmenuHideTimer = 0;
      }, 180);
    }

    hostElement.addEventListener("mouseenter", showStartSubmenu);
    hostElement.addEventListener("mouseleave", hideStartSubmenu);
    submenuElement.addEventListener("mouseenter", showStartSubmenu);
    submenuElement.addEventListener("mouseleave", hideStartSubmenu);
  }

  function reopenActiveStartSubmenu() {
    var hostItem;
    var hostElement;
    var flyoutsRoot;
    var submenuElement;
    var parentSubmenuElement;
    var parentIconId;
    if (!activeStartSubmenuIconId) return;
    hostItem = document.querySelector(
      '.os-start-menu-submenu-host > .os-start-menu-item[data-desktop-icon="' +
        activeStartSubmenuIconId +
        '"]'
    );
    if (!hostItem) {
      hostItem = document.querySelector(
        '.os-start-menu-submenu-host--nested > .os-start-menu-submenu-item[data-desktop-icon="' +
          activeStartSubmenuIconId +
          '"]'
      );
    }
    if (!hostItem) return;
    hostElement = hostItem.parentNode;
    flyoutsRoot = getStartMenuFlyoutsRoot();
    if (!flyoutsRoot) return;
    submenuElement = flyoutsRoot.querySelector(
      '[data-start-submenu-icon="' + activeStartSubmenuIconId + '"]'
    );
    if (!submenuElement) return;
    parentSubmenuElement = null;
    if (submenuElement.getAttribute("data-start-submenu-nested") === "true") {
      parentIconId = "settings";
      parentSubmenuElement = flyoutsRoot.querySelector(
        '[data-start-submenu-icon="' + parentIconId + '"]'
      );
    }
    if (parentSubmenuElement) {
      closeStartSubmenusExcept([parentSubmenuElement, submenuElement]);
    } else {
      closeAllStartSubmenus();
    }
    positionStartSubmenu(hostElement, submenuElement);
    submenuElement.classList.add("is-open");
  }

  function onStartMenuListPointerOver(event) {
    if (!event || !event.target) return;
    if (event.target.closest(".os-start-menu-submenu-host")) return;
    if (event.target.closest("#osStartMenuFlyouts")) return;
    closeAllStartSubmenus();
  }

  function bindStartMenuFlyoutInteraction() {
    var flyoutsRoot = getStartMenuFlyoutsRoot();
    if (!flyoutsRoot || flyoutsRoot.startMenuFlyoutInteractionBound) return;
    flyoutsRoot.addEventListener("pointerdown", onStartMenuFlyoutPointerDown);
    flyoutsRoot.startMenuFlyoutInteractionBound = true;
  }

  function onStartMenuFlyoutPointerDown(event) {
    if (!event) return;
    if (startSubmenuHideTimer) {
      window.clearTimeout(startSubmenuHideTimer);
      startSubmenuHideTimer = 0;
    }
    if (event.target && event.target.closest(".settings-switch")) {
      event.stopPropagation();
    }
  }
  function bindStartMenuSubmenuExclusivity() {
    var startMenuListElement = document.getElementById("osStartMenuList");
    if (!startMenuListElement || startMenuListElement.startMenuSubmenuExclusivityBound) return;
    startMenuListElement.addEventListener("mouseover", onStartMenuListPointerOver);
    startMenuListElement.startMenuSubmenuExclusivityBound = true;
  }

  function getStartMenuFlyoutsRoot() {
    return document.getElementById("osStartMenuFlyouts");
  }

  function clearStartMenuFlyouts() {
    var flyoutsRoot = getStartMenuFlyoutsRoot();
    if (!flyoutsRoot) return;
    flyoutsRoot.textContent = "";
  }

  function shouldSkipStartMenuIconId(iconId) {
    if (!iconId) return true;
    if (iconId.indexOf(START_MENU_GAME_ICON_PREFIX) === 0) return true;
    if (START_MENU_NESTED_ONLY_ICON_IDS[iconId]) return true;
    return false;
  }

  function getAllManifestGames() {
    if (!window.WebExtrasManifest || !window.WebExtrasManifest.games) return [];
    return window.WebExtrasManifest.games;
  }

  function createStartMenuItemIcon(iconSrc) {
    var iconImage;
    if (!iconSrc) return null;
    iconImage = document.createElement("img");
    iconImage.className = "os-start-menu-item-icon";
    iconImage.src = iconSrc;
    iconImage.alt = "";
    iconImage.draggable = false;
    iconImage.width = START_MENU_ICON_PIXEL_SIZE;
    iconImage.height = START_MENU_ICON_PIXEL_SIZE;
    return iconImage;
  }

  function appendStartMenuItemParts(itemElement, iconSrc, labelText) {
    var iconImage;
    var labelElement;
    if (iconSrc) {
      iconImage = createStartMenuItemIcon(iconSrc);
      if (iconImage) {
        itemElement.appendChild(iconImage);
      } else {
        itemElement.appendChild(document.createElement("span"));
      }
    } else {
      itemElement.appendChild(document.createElement("span"));
    }
    labelElement = document.createElement("span");
    labelElement.className = "os-start-menu-item-label terminal-text";
    labelElement.textContent = labelText;
    itemElement.appendChild(labelElement);
  }

  function onStartMenuGameItemActivate(event) {
    var itemElement;
    var gameId;
    if (!event || event.button !== 0) return;
    if (event.target && event.target.closest(".os-start-menu-item-desktop")) return;
    if (event.target && event.target.closest(".settings-switch")) return;
    itemElement = event.currentTarget;
    gameId = itemElement.getAttribute("data-game-id") || "";
    if (!gameId) return;
    event.preventDefault();
    event.stopPropagation();
    closeStartMenu();
    if (window.WebExtras && window.WebExtras.openGame) {
      window.WebExtras.openGame(gameId);
    }
  }

  function onStartMenuSubmenuIconActivate(event) {
    var itemElement;
    var iconId;
    if (!event || event.button !== 0) return;
    if (event.target && event.target.closest(".os-start-menu-item-desktop")) return;
    if (event.target && event.target.closest(".settings-switch")) return;
    itemElement = event.currentTarget;
    iconId = itemElement.getAttribute("data-desktop-icon") || "";
    if (!iconId) return;
    event.preventDefault();
    event.stopPropagation();
    closeStartMenu();
    activateDesktopIconById(iconId);
  }

  function appendStartMenuSubmenuIconItem(submenuListElement, iconId, parentSubmenuElement) {
    if (!submenuListElement || !iconId) return;
    if (hasStartMenuNestedSubmenu(iconId)) {
      appendStartMenuSubmenuGamesNestedHost(submenuListElement, parentSubmenuElement);
      return;
    }
    appendStartMenuSubmenuIconRow(submenuListElement, iconId);
  }

  function appendStartMenuSubmenuIconRow(submenuListElement, iconId) {
    var iconElement;
    var iconSrc;
    var itemElement;
    var isVisibleOnDesktop;
    var desktopToggleElement;
    var switchButton;
    if (!submenuListElement || !iconId) return;
    iconElement = getDesktopIconElement(iconId);
    iconSrc = iconElement ? getStartMenuIconSrc(iconElement) : "";
    if (!iconSrc && window.WebDesktopAppIcons && window.WebDesktopAppIcons.getDesktopIconSrc) {
      iconSrc = window.WebDesktopAppIcons.getDesktopIconSrc(iconId);
    }
    itemElement = document.createElement("button");
    itemElement.type = "button";
    itemElement.className = "os-start-menu-submenu-item os-start-menu-submenu-item--with-toggle";
    itemElement.setAttribute("role", "menuitem");
    itemElement.setAttribute("data-desktop-icon", iconId);
    itemElement.addEventListener("click", onStartMenuSubmenuIconActivate);
    appendStartMenuItemParts(
      itemElement,
      iconSrc,
      iconElement ? getStartMenuIconLabel(iconElement) : iconId
    );
    isVisibleOnDesktop = isDesktopIconVisibleOnDesktop(iconId);
    desktopToggleElement = document.createElement("div");
    desktopToggleElement.className = "os-start-menu-item-desktop";
    switchButton = createDesktopVisibilitySwitch(iconId, isVisibleOnDesktop);
    desktopToggleElement.appendChild(switchButton);
    itemElement.appendChild(desktopToggleElement);
    submenuListElement.appendChild(itemElement);
  }

  function appendStartMenuSubmenuGamesNestedHost(submenuListElement, parentSubmenuElement) {
    var iconElement;
    var iconSrc;
    var itemElement;
    var nestedHostElement;
    var flyoutsRoot;
    var gamesSubmenuElement;
    var isVisibleOnDesktop;
    var desktopToggleElement;
    var switchButton;
    if (!submenuListElement) return;
    iconElement = getDesktopIconElement(START_MENU_GAMES_ICON_ID);
    iconSrc = iconElement ? getStartMenuIconSrc(iconElement) : "";
    if (!iconSrc && window.WebDesktopAppIcons && window.WebDesktopAppIcons.getDesktopIconSrc) {
      iconSrc = window.WebDesktopAppIcons.getDesktopIconSrc(START_MENU_GAMES_ICON_ID);
    }
    itemElement = document.createElement("button");
    itemElement.type = "button";
    itemElement.className =
      "os-start-menu-submenu-item os-start-menu-submenu-item--with-toggle os-start-menu-submenu-item--has-submenu";
    itemElement.setAttribute("role", "menuitem");
    itemElement.setAttribute("data-desktop-icon", START_MENU_GAMES_ICON_ID);
    itemElement.addEventListener("click", onStartMenuSubmenuIconActivate);
    appendStartMenuItemParts(
      itemElement,
      iconSrc,
      iconElement ? getStartMenuIconLabel(iconElement) : START_MENU_GAMES_ICON_ID
    );
    appendStartMenuSubmenuArrow(itemElement);
    isVisibleOnDesktop = isDesktopIconVisibleOnDesktop(START_MENU_GAMES_ICON_ID);
    desktopToggleElement = document.createElement("div");
    desktopToggleElement.className = "os-start-menu-item-desktop";
    switchButton = createDesktopVisibilitySwitch(START_MENU_GAMES_ICON_ID, isVisibleOnDesktop);
    desktopToggleElement.appendChild(switchButton);
    itemElement.appendChild(desktopToggleElement);
    nestedHostElement = document.createElement("div");
    nestedHostElement.className = "os-start-menu-submenu-host os-start-menu-submenu-host--nested";
    nestedHostElement.appendChild(itemElement);
    submenuListElement.appendChild(nestedHostElement);
    flyoutsRoot = getStartMenuFlyoutsRoot();
    if (!flyoutsRoot) return;
    gamesSubmenuElement = buildGamesListStartSubmenu();
    gamesSubmenuElement.setAttribute("data-start-submenu-icon", START_MENU_GAMES_ICON_ID);
    gamesSubmenuElement.setAttribute("data-start-submenu-nested", "true");
    flyoutsRoot.appendChild(gamesSubmenuElement);
    bindStartSubmenuHover(
      nestedHostElement,
      gamesSubmenuElement,
      START_MENU_GAMES_ICON_ID,
      parentSubmenuElement
    );
  }

  function buildIconListStartSubmenu(childIconIds, parentIconId) {
    var submenuElement;
    var scrollClipElement;
    var scrollViewElement;
    var submenuListElement;
    var index;
    var childIconId;
    submenuElement = document.createElement("div");
    submenuElement.className = "os-start-menu-submenu";
    submenuElement.setAttribute("role", "menu");
    submenuElement.appendChild(createStartMenuColumnHeader(true));
    scrollClipElement = document.createElement("div");
    scrollClipElement.className = "menu-v-scroll-clip os-start-menu-submenu-scroll-clip";
    scrollViewElement = document.createElement("div");
    scrollViewElement.className = "menu-v-scroll-view os-start-menu-submenu-scroll";
    submenuListElement = document.createElement("div");
    submenuListElement.className = "os-start-menu-submenu-list";
    submenuListElement.setAttribute("role", "none");
    if (parentIconId) {
      appendStartMenuSubmenuIconItem(submenuListElement, parentIconId, submenuElement);
    }
    if (childIconIds) {
      for (index = 0; index < childIconIds.length; index++) {
        childIconId = childIconIds[index];
        appendStartMenuSubmenuIconItem(submenuListElement, childIconId, submenuElement);
      }
    }
    scrollViewElement.appendChild(submenuListElement);
    scrollClipElement.appendChild(scrollViewElement);
    submenuElement.appendChild(scrollClipElement);
    ensureStartSubmenuOpenReveal(submenuElement);
    return submenuElement;
  }

  function buildGamesListStartSubmenu() {
    var submenuElement;
    var scrollClipElement;
    var scrollViewElement;
    var submenuListElement;
    var games;
    var index;
    var game;
    var gameItemElement;
    var gameIconSrc;
    var gameLabel;
    var desktopToggleElement;
    var switchButton;
    submenuElement = document.createElement("div");
    submenuElement.className = "os-start-menu-submenu";
    submenuElement.setAttribute("role", "menu");
    submenuElement.appendChild(createStartMenuColumnHeader(true));
    scrollClipElement = document.createElement("div");
    scrollClipElement.className = "menu-v-scroll-clip os-start-menu-submenu-scroll-clip";
    scrollViewElement = document.createElement("div");
    scrollViewElement.className = "menu-v-scroll-view os-start-menu-games-scroll";
    submenuListElement = document.createElement("div");
    submenuListElement.className = "os-start-menu-submenu-list";
    submenuListElement.setAttribute("role", "none");
    games = getAllManifestGames();
    for (index = 0; index < games.length; index++) {
      game = games[index];
      if (!game || !game.id) continue;
      gameIconSrc = getGameDesktopIconImagePath(game);
      gameLabel = game.title || game.id;
      gameItemElement = document.createElement("button");
      gameItemElement.type = "button";
      gameItemElement.className = "os-start-menu-submenu-item os-start-menu-submenu-item--with-toggle";
      gameItemElement.setAttribute("role", "menuitem");
      gameItemElement.setAttribute("data-game-id", game.id);
      gameItemElement.addEventListener("click", onStartMenuGameItemActivate);
      appendStartMenuItemParts(gameItemElement, gameIconSrc, gameLabel);
      desktopToggleElement = document.createElement("div");
      desktopToggleElement.className = "os-start-menu-item-desktop";
      switchButton = createGameDesktopLinkSwitch(game.id, isGameDesktopLinkEnabled(game.id));
      desktopToggleElement.appendChild(switchButton);
      gameItemElement.appendChild(desktopToggleElement);
      submenuListElement.appendChild(gameItemElement);
    }
    scrollViewElement.appendChild(submenuListElement);
    scrollClipElement.appendChild(scrollViewElement);
    submenuElement.appendChild(scrollClipElement);
    ensureStartSubmenuOpenReveal(submenuElement);
    return submenuElement;
  }

  function appendStartMenuListItem(startMenuListElement, iconElement, iconId) {
    var iconSrc;
    var itemElement;
    var isVisibleOnDesktop;
    var desktopToggleElement;
    var switchButton;
    var submenuHostElement;
    var flyoutsRoot;
    var submenuElement;
    if (!startMenuListElement || !iconElement || !iconId) return;
    iconSrc = getStartMenuIconSrc(iconElement);
    itemElement = document.createElement("button");
    itemElement.type = "button";
    itemElement.className = "os-start-menu-item";
    if (hasStartMenuSubmenu(iconId)) {
      itemElement.className += " os-start-menu-item--has-submenu";
    }
    itemElement.setAttribute("role", "menuitem");
    itemElement.setAttribute("data-desktop-icon", iconId);
    itemElement.addEventListener("click", onStartMenuItemActivate);
    appendStartMenuItemParts(itemElement, iconSrc, getStartMenuIconLabel(iconElement));
    if (hasStartMenuSubmenu(iconId)) {
      appendStartMenuSubmenuArrow(itemElement);
    } else {
      appendStartMenuSubmenuArrowPlaceholder(itemElement);
    }
    isVisibleOnDesktop = isDesktopIconVisibleOnDesktop(iconId);
    desktopToggleElement = document.createElement("div");
    desktopToggleElement.className = "os-start-menu-item-desktop";
    switchButton = createDesktopVisibilitySwitch(iconId, isVisibleOnDesktop);
    desktopToggleElement.appendChild(switchButton);
    itemElement.appendChild(desktopToggleElement);
    if (hasStartMenuSubmenu(iconId)) {
      submenuHostElement = document.createElement("div");
      submenuHostElement.className = "os-start-menu-submenu-host";
      submenuHostElement.appendChild(itemElement);
      startMenuListElement.appendChild(submenuHostElement);
      flyoutsRoot = getStartMenuFlyoutsRoot();
      if (flyoutsRoot) {
        submenuElement = buildIconListStartSubmenu(getStartMenuSubmenuChildIconIds(iconId), iconId);
        submenuElement.setAttribute("data-start-submenu-icon", iconId);
        flyoutsRoot.appendChild(submenuElement);
        bindStartSubmenuHover(submenuHostElement, submenuElement, iconId, null);
      }
      return;
    }
    startMenuListElement.appendChild(itemElement);
  }

  function bindStartMenuScrollWheel() {
    var scrollViewElement;
    if (document.documentElement.startMenuScrollWheelBound) return;
    scrollViewElement = document.getElementById("osStartMenuScroll");
    if (!scrollViewElement) return;
    scrollViewElement.addEventListener(
      "wheel",
      function (event) {
        if (!startMenuOpen || !event) return;
        if (event.deltaY === 0 && event.deltaX === 0) return;
        if (scrollViewElement.scrollHeight <= scrollViewElement.clientHeight + 1) return;
        scrollViewElement.scrollTop += event.deltaY;
        scrollViewElement.scrollLeft += event.deltaX;
        event.preventDefault();
      },
      { passive: false }
    );
    document.documentElement.startMenuScrollWheelBound = true;
  }

  function areStartMenuAnimationsEnabled() {
    var device = document.getElementById("device");
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return false;
    }
    if (!device) return true;
    return !device.classList.contains("terminal-animations-off");
  }

  function clearStartMenuOpenAnimationTimer() {
    if (startMenuOpenAnimationTimer) {
      window.clearTimeout(startMenuOpenAnimationTimer);
      startMenuOpenAnimationTimer = 0;
    }
  }

  function clearStartMenuSubmenuOpenAnimationTimer(submenuElement) {
    if (!submenuElement || !submenuElement.wmStartSubmenuOpenAnimationTimer) return;
    window.clearTimeout(submenuElement.wmStartSubmenuOpenAnimationTimer);
    submenuElement.wmStartSubmenuOpenAnimationTimer = 0;
  }

  function playStartMenuOpenAnimation() {
    var startMenuElement;
    if (!areStartMenuAnimationsEnabled()) return;
    startMenuElement = document.getElementById("osStartMenu");
    if (!startMenuElement) return;
    ensureStartMenuOpenReveal();
    clearStartMenuOpenAnimationTimer();
    startMenuElement.classList.remove("os-start-menu--opening");
    void startMenuElement.offsetHeight;
    startMenuElement.classList.add("os-start-menu--opening");
    startMenuOpenAnimationTimer = window.setTimeout(function () {
      startMenuElement.classList.remove("os-start-menu--opening");
      startMenuOpenAnimationTimer = 0;
    }, START_MENU_OPEN_REVEAL_MS + 40);
  }

  function playStartSubmenuOpenAnimation(submenuElement) {
    if (!areStartMenuAnimationsEnabled()) return;
    if (!submenuElement) return;
    ensureStartSubmenuOpenReveal(submenuElement);
    clearStartMenuSubmenuOpenAnimationTimer(submenuElement);
    submenuElement.classList.remove("os-start-menu-submenu--opening");
    void submenuElement.offsetHeight;
    submenuElement.classList.add("os-start-menu-submenu--opening");
    submenuElement.wmStartSubmenuOpenAnimationTimer = window.setTimeout(function () {
      submenuElement.classList.remove("os-start-menu-submenu--opening");
      submenuElement.wmStartSubmenuOpenAnimationTimer = 0;
    }, START_MENU_OPEN_REVEAL_MS + 40);
  }

  function compareStartMenuIconOrder(firstIconElement, secondIconElement) {
    var firstIconId = firstIconElement.getAttribute("data-desktop-icon") || "";
    var secondIconId = secondIconElement.getAttribute("data-desktop-icon") || "";
    return compareStartMenuIconOrderById(firstIconId, secondIconId);
  }

  function buildStartMenu() {
    var startMenuListElement;
    var icons;
    var sortedIcons = [];
    var index;
    var iconElement;
    var iconId;
    startMenuListElement = document.getElementById("osStartMenuList");
    if (!startMenuListElement || !desktopIconsRoot) return;
    startMenuListElement.textContent = "";
    clearStartMenuFlyouts();
    ensureStartMenuColumnHeader();
    icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    for (index = 0; index < icons.length; index++) {
      sortedIcons.push(icons[index]);
    }
    sortedIcons.sort(compareStartMenuIconOrder);
    for (index = 0; index < sortedIcons.length; index++) {
      iconElement = sortedIcons[index];
      iconId = iconElement.getAttribute("data-desktop-icon") || "";
      if (shouldSkipStartMenuIconId(iconId)) continue;
      appendStartMenuListItem(startMenuListElement, iconElement, iconId);
    }
    bindStartMenuScrollWheel();
    bindStartMenuSubmenuExclusivity();
    bindStartMenuFlyoutInteraction();
    if (activeStartSubmenuIconId) {
      reopenActiveStartSubmenu();
    }
    if (window.WebMenuScrollbar && window.WebMenuScrollbar.refresh) {
      window.WebMenuScrollbar.refresh();
    }
  }

  function setStartMenuOpenState(open) {
    var statusNodeButton;
    var startMenuElement;
    startMenuOpen = open === true;
    statusNodeButton = document.getElementById("osStatusNode");
    startMenuElement = document.getElementById("osStartMenu");
    if (statusNodeButton) {
      statusNodeButton.setAttribute("aria-expanded", startMenuOpen ? "true" : "false");
      statusNodeButton.classList.toggle("os-statusbar-node-button--open", startMenuOpen);
    }
    if (!startMenuElement) return;
    if (startMenuOpen) {
      buildStartMenu();
      startMenuElement.removeAttribute("hidden");
      playStartMenuOpenAnimation();
    } else {
      clearStartMenuOpenAnimationTimer();
      startMenuElement.classList.remove("os-start-menu--opening");
      startMenuElement.setAttribute("hidden", "");
    }
  }

  function closeStartMenu() {
    if (!startMenuOpen) return;
    activeStartSubmenuIconId = "";
    clearStartMenuFlyouts();
    setStartMenuOpenState(false);
  }

  function toggleStartMenu() {
    setStartMenuOpenState(!startMenuOpen);
  }

  function onDocumentPointerDownForStartMenu(event) {
    var target;
    if (!startMenuOpen || !event || !event.target) return;
    target = event.target;
    if (target.closest("#osStartMenu") || target.closest("#osStatusNode")) return;
    closeStartMenu();
  }

  function bindStartMenuDismiss() {
    if (startMenuDocumentPointerBound) return;
    document.addEventListener("pointerdown", onDocumentPointerDownForStartMenu, true);
    startMenuDocumentPointerBound = true;
  }

  function onStatusNodeClick(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    toggleStartMenu();
  }

  function onStatusNodeKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleStartMenu();
  }

  function bindStatusNodeButton() {
    var statusNodeButton = document.getElementById("osStatusNode");
    if (!statusNodeButton || statusNodeButton.wmStatusNodeBound) return;
    statusNodeButton.addEventListener("click", onStatusNodeClick);
    statusNodeButton.addEventListener("keydown", onStatusNodeKeyDown);
    statusNodeButton.wmStatusNodeBound = true;
  }

  function clearDesktopWindowsTogglePointerHover() {
    var toggleButton = document.getElementById("desktopWindowsToggle");
    if (!toggleButton) return;
    toggleButton.classList.remove("is-pointer-hover");
  }

  function updateDesktopWindowsToggleState() {
    var toggleButton = document.getElementById("desktopWindowsToggle");
    var windowManager;
    var restoreAll;
    if (!toggleButton) return;
    windowManager = getWindowManager();
    if (!windowManager || !windowManager.areAllVisibleDesktopWindowsMinimized) return;
    restoreAll = windowManager.areAllVisibleDesktopWindowsMinimized();
    if (restoreAll) {
      toggleButton.setAttribute("data-wm-windows-toggle", "restore");
      toggleButton.setAttribute("data-locale-aria-label", "web.status.windows-restore-all");
    } else {
      toggleButton.removeAttribute("data-wm-windows-toggle");
      toggleButton.setAttribute("data-locale-aria-label", "web.status.windows-minimize-all");
    }
    if (window.WebLocale && window.WebLocale.applyElement) {
      window.WebLocale.applyElement(toggleButton);
    }
  }

  function onDesktopWindowsToggleClick(event) {
    var windowManager;
    if (!event || event.button !== 0) return;
    event.preventDefault();
    clearDesktopWindowsTogglePointerHover();
    windowManager = getWindowManager();
    if (!windowManager || !windowManager.toggleMinimizeAllDesktopWindows) return;
    windowManager.toggleMinimizeAllDesktopWindows();
    updateDesktopWindowsToggleState();
    syncTaskbarApps();
  }

  function onDesktopWindowsTogglePointerEnter(event) {
    if (!event || !event.currentTarget) return;
    event.currentTarget.classList.add("is-pointer-hover");
  }

  function onDesktopWindowsTogglePointerLeave(event) {
    if (!event || !event.currentTarget) return;
    event.currentTarget.classList.remove("is-pointer-hover");
  }

  function bindDesktopWindowsToggle() {
    var toggleButton = document.getElementById("desktopWindowsToggle");
    if (!toggleButton || toggleButton.wmDesktopWindowsToggleBound) return;
    toggleButton.addEventListener("click", onDesktopWindowsToggleClick);
    toggleButton.addEventListener("pointerenter", onDesktopWindowsTogglePointerEnter);
    toggleButton.addEventListener("pointerleave", onDesktopWindowsTogglePointerLeave);
    toggleButton.addEventListener("blur", clearDesktopWindowsTogglePointerHover);
    toggleButton.wmDesktopWindowsToggleBound = true;
    updateDesktopWindowsToggleState();
  }

  function bindTaskbar() {
    bindStatusNodeButton();
    bindStartMenuDismiss();
    bindStartMenuScrollWheel();
    readTaskbarOrderFromStorage();
    bindTaskbarDrag();
    bindDesktopWindowsToggle();
    syncTaskbarApps();
    window.addEventListener("web-desktop-window-focused", syncTaskbarApps);
    window.addEventListener("web-desktop-window-closed", syncTaskbarApps);
    window.addEventListener("web-desktop-window-opened", syncTaskbarApps);
    window.addEventListener("web-wm-layout-settled", syncTaskbarApps);
    window.addEventListener("web-desktop-windows-restored", syncTaskbarApps);
    window.addEventListener("web-desktop-game-icons-restored", onDesktopGameIconsRestoredForTaskbar);
    window.addEventListener("web-locale-applied", onTaskbarLocaleApplied);
  }

  function onDesktopGameIconsRestoredForTaskbar() {
    syncTaskbarApps();
  }

  function onTaskbarLocaleApplied() {
    syncTaskbarApps();
    updateDesktopWindowsToggleState();
  }

  function getGameDesktopIconId(gameId) {
    return "game-" + gameId;
  }

  function getGameDesktopIconImagePath(game) {
    if (!game) return "";
    if (game.desktopIcon) return game.desktopIcon;
    if (game.id) {
      return "Extras/games/" + game.id + "/" + game.id + "-desktop-icon.png";
    }
    return "";
  }

  function buildGameDesktopLinksPayload() {
    var gameIds = [];
    var gameId;
    for (gameId in gameDesktopLinkIds) {
      if (!Object.prototype.hasOwnProperty.call(gameDesktopLinkIds, gameId)) continue;
      if (!gameDesktopLinkIds[gameId]) continue;
      gameIds.push(gameId);
    }
    return { gameIds: gameIds };
  }

  function writeGameDesktopLinksToStorage(payload) {
    try {
      localStorage.setItem(GAME_DESKTOP_LINKS_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
    }
  }

  function readGameDesktopLinksFromStorage() {
    try {
      var raw = localStorage.getItem(GAME_DESKTOP_LINKS_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function hasGameDesktopLinksStorage() {
    try {
      return localStorage.getItem(GAME_DESKTOP_LINKS_STORAGE_KEY) !== null;
    } catch (error) {
      return false;
    }
  }

  function loadGameDesktopLinksFromStorage() {
    var payload = readGameDesktopLinksFromStorage();
    var gameIds = payload && payload.gameIds ? payload.gameIds : [];
    var index = 0;
    for (index = 0; index < gameIds.length; index++) {
      if (gameIds[index]) {
        gameDesktopLinkIds[gameIds[index]] = true;
      }
    }
  }

  function postGameDesktopLinksSave() {
    var payload = buildGameDesktopLinksPayload();
    writeGameDesktopLinksToStorage(payload);
  }

  function persistGameDesktopLinksNow() {
    postGameDesktopLinksSave();
  }

  function syncGameDesktopLinkIdsFromIconLayoutTable() {
    var iconId;
    var gameId;
    if (hasGameDesktopLinksStorage()) return;
    for (iconId in savedIconLayoutTable) {
      if (!Object.prototype.hasOwnProperty.call(savedIconLayoutTable, iconId)) continue;
      if (iconId.indexOf("game-") !== 0) continue;
      gameId = iconId.substring(5);
      if (gameId) {
        gameDesktopLinkIds[gameId] = true;
      }
    }
  }

  function setGameDesktopLinkEnabledState(gameId, enabled) {
    if (!gameId) return;
    if (enabled) {
      gameDesktopLinkIds[gameId] = true;
    } else if (gameDesktopLinkIds[gameId]) {
      delete gameDesktopLinkIds[gameId];
    }
    persistGameDesktopLinksNow();
  }

  function isGameDesktopLinkEnabled(gameId) {
    if (!gameId) return false;
    return !!gameDesktopLinkIds[gameId];
  }

  function restoreEnabledGameDesktopIcons() {
    var gameId;
    var game;
    var iconElement;
    var restoredCount = 0;
    if (!desktopIconsRoot) return;
    for (gameId in gameDesktopLinkIds) {
      if (!Object.prototype.hasOwnProperty.call(gameDesktopLinkIds, gameId)) continue;
      if (!gameDesktopLinkIds[gameId]) continue;
      if (findGameDesktopIcon(gameId)) continue;
      game = getGameRecordById(gameId);
      if (!game) continue;
      iconElement = createGameDesktopIcon(game);
      if (iconElement) {
        restoredCount = restoredCount + 1;
      }
    }
    if (restoredCount > 0) {
      updateDesktopTabOrder();
      persistIconLayoutsNow();
    }
    for (gameId in gameDesktopLinkIds) {
      if (!Object.prototype.hasOwnProperty.call(gameDesktopLinkIds, gameId)) continue;
      if (gameDesktopLinkIds[gameId]) {
        dispatchGameDesktopIconsRestored();
        break;
      }
    }
  }

  function ensureGameDesktopLinkIcon(gameId) {
    var game;
    if (!gameId || !isGameDesktopLinkEnabled(gameId)) return;
    if (findGameDesktopIcon(gameId)) return;
    game = getGameRecordById(gameId);
    if (!game) return;
    createGameDesktopIcon(game);
  }

  function findGameDesktopIcon(gameId) {
    if (!desktopIconsRoot || !gameId) return null;
    return desktopIconsRoot.querySelector(
      '.os-desktop-icon[data-desktop-icon="' + getGameDesktopIconId(gameId) + '"]'
    );
  }

  function getGamesReferenceCenterLayout() {
    var gamesIcon;
    var layout;
    var coords;
    var layoutRoot;
    var position;
    if (!desktopIconsRoot) {
      desktopIconsRoot = document.getElementById("desktopIcons");
    }
    gamesIcon = desktopIconsRoot
      ? desktopIconsRoot.querySelector('.os-desktop-icon[data-desktop-icon="games"]')
      : null;
    layout = savedIconLayoutTable.games;
    if (gamesIcon) {
      coords = getLayoutCoords();
      layoutRoot = getIconLayoutRoot();
      if (coords && layoutRoot) {
        if (!gamesIcon.classList.contains("os-desktop-icon--center-anchor")) {
          applySavedIconLayout(gamesIcon);
        }
        position = getIconLayoutPosition(gamesIcon);
        layout = coords.absoluteToCenterOffset(position.left, position.top, layoutRoot);
      }
    }
    if (!layout) {
      layout = getDefaultIconLayoutEntry("games");
    }
    if (!layout) {
      return { anchor: "center", centerOffsetX: 230, centerOffsetY: 365 };
    }
    return layout;
  }

  function countGameDesktopIcons(excludeIconElement) {
    var icons;
    var index;
    var count = 0;
    if (!desktopIconsRoot) return 0;
    icons = desktopIconsRoot.querySelectorAll(".os-desktop-icon--game-shortcut[data-desktop-icon]");
    for (index = 0; index < icons.length; index++) {
      if (icons[index] === excludeIconElement) continue;
      if (icons[index].hidden) continue;
      count = count + 1;
    }
    return count;
  }

  function getGameShortcutTargetPosition(excludeIconElement) {
    var gamesLayout = getGamesReferenceCenterLayout();
    var existingGameIconCount = countGameDesktopIcons(excludeIconElement);
    var centerOffsetX = (gamesLayout.centerOffsetX || 0) + ICON_GRID_CELL_WIDTH + existingGameIconCount * ICON_GRID_CELL_WIDTH;
    var centerOffsetY = (gamesLayout.centerOffsetY || 0) - ICON_GRID_CELL_HEIGHT;
    var coords = getLayoutCoords();
    var layoutRoot = getIconLayoutRoot();
    if (!coords || !layoutRoot) {
      return { left: 0, top: 0 };
    }
    return coords.resolveAbsolutePosition(
      {
        anchor: "center",
        centerOffsetX: centerOffsetX,
        centerOffsetY: centerOffsetY
      },
      layoutRoot
    );
  }

  function getGameDesktopIconPreferredPosition(preferredLayout, excludeIconElement) {
    var coords;
    var layoutRoot;
    if (!preferredLayout) {
      return getGameShortcutTargetPosition(excludeIconElement);
    }
    coords = getLayoutCoords();
    layoutRoot = getIconLayoutRoot();
    if (!coords || !layoutRoot) {
      return getGameShortcutTargetPosition(excludeIconElement);
    }
    if (coords.isCenterLayoutEntry(preferredLayout)) {
      return coords.resolveAbsolutePosition(preferredLayout, layoutRoot);
    }
    if (preferredLayout.left !== undefined) {
      return {
        left: preferredLayout.left,
        top: preferredLayout.top || 0
      };
    }
    return getGameShortcutTargetPosition(excludeIconElement);
  }

  function placeGameDesktopIconWithFreeSpace(iconElement, preferredLayout) {
    var targetPosition = getGameDesktopIconPreferredPosition(preferredLayout, iconElement);
    var excludeIcons = buildPlacedIconsExcludeElement(iconElement);
    var resolvedPosition = resolveIconDropPosition(
      iconElement,
      targetPosition.left,
      targetPosition.top,
      null,
      null,
      excludeIcons
    );
    applyIconPosition(iconElement, resolvedPosition.left, resolvedPosition.top);
    syncIconLayoutFromElement(iconElement);
  }

  function getGameRecordById(gameId) {
    var manifest;
    var games;
    var index;
    if (!gameId) return null;
    manifest = window.WebExtrasManifest;
    if (!manifest || !manifest.games) return null;
    games = manifest.games;
    for (index = 0; index < games.length; index++) {
      if (games[index].id === gameId) {
        return games[index];
      }
    }
    return null;
  }

  function dispatchGameDesktopIconsRestored() {
    window.dispatchEvent(new CustomEvent("web-desktop-game-icons-restored"));
  }

  function createGameDesktopIcon(game) {
    var gameId;
    var iconId;
    var iconElement;
    var labelElement;
    var glyphElement;
    var imageElement;
    if (!desktopIconsRoot || !game || !game.id) return null;
    gameId = game.id;
    iconId = getGameDesktopIconId(gameId);
    if (findGameDesktopIcon(gameId)) {
      setGameDesktopLinkEnabledState(gameId, true);
      return findGameDesktopIcon(gameId);
    }
    iconElement = document.createElement("button");
    iconElement.type = "button";
    iconElement.className = "os-desktop-icon os-desktop-icon--game-shortcut";
    iconElement.setAttribute("data-desktop-icon", iconId);
    iconElement.setAttribute("data-game-id", gameId);
    if (game.path) {
      iconElement.setAttribute("data-game-path", game.path);
    }
    glyphElement = document.createElement("span");
    glyphElement.className = "os-desktop-icon-glyph";
    if (getGameDesktopIconImagePath(game)) {
      imageElement = document.createElement("img");
      imageElement.className = "os-app-icon os-app-icon--game-shortcut";
      imageElement.src = getGameDesktopIconImagePath(game);
      imageElement.alt = "";
      imageElement.draggable = false;
      imageElement.width = getDesktopIconImagePixelSize();
      imageElement.height = getDesktopIconImagePixelSize();
      glyphElement.appendChild(imageElement);
    } else if (window.WebDesktopAppIcons && window.WebDesktopAppIcons.ensureDesktopIconGlyph) {
      iconElement.setAttribute("data-desktop-icon", "games");
      window.WebDesktopAppIcons.ensureDesktopIconGlyph(iconElement);
      iconElement.setAttribute("data-desktop-icon", iconId);
    }
    labelElement = document.createElement("span");
    labelElement.className = "os-desktop-icon-label terminal-text";
    labelElement.textContent = game.title || game.titleFallback || gameId;
    iconElement.appendChild(glyphElement);
    iconElement.appendChild(labelElement);
    desktopIconsRoot.appendChild(iconElement);
    bindDesktopIcon(iconElement);
    if (savedIconLayoutTable[iconId]) {
      applySavedIconLayout(iconElement);
    } else {
      placeGameDesktopIconWithFreeSpace(iconElement, null);
    }
    setGameDesktopLinkEnabledState(gameId, true);
    scheduleIconLayoutsSave();
    dispatchGameDesktopIconsRestored();
    return iconElement;
  }

  function removeGameDesktopIcon(gameId) {
    var iconElement;
    if (!gameId) return false;
    iconElement = findGameDesktopIcon(gameId);
    if (iconElement) {
      syncIconLayoutFromElement(iconElement);
      if (iconElement.parentNode) {
        iconElement.parentNode.removeChild(iconElement);
      }
    }
    setGameDesktopLinkEnabledState(gameId, false);
    persistIconLayoutsNow();
    dispatchGameDesktopIconsRestored();
    return true;
  }

  function openGameFromDesktopIcon(gameId) {
    if (!gameId || !window.WebExtras) return false;
    openGamesDesktop();
    if (window.WebExtras.openGame) {
      window.WebExtras.openGame(gameId);
      return true;
    }
    return false;
  }

  function resetAllStartMenuDesktopVisibilitySwitches() {
    var startMenuElement = document.getElementById("osStartMenu");
    var flyoutsRoot = getStartMenuFlyoutsRoot();
    var containers = [startMenuElement, flyoutsRoot];
    var containerIndex;
    var switches;
    var switchIndex;
    var switchButton;

    for (containerIndex = 0; containerIndex < containers.length; containerIndex++) {
      if (!containers[containerIndex]) continue;
      switches = containers[containerIndex].querySelectorAll(".settings-switch[data-desktop-icon]");
      for (switchIndex = 0; switchIndex < switches.length; switchIndex++) {
        switchButton = switches[switchIndex];
        switchButton.classList.add("is-on");
        switchButton.setAttribute("aria-checked", "true");
      }
    }
  }

  function resetAllDesktopLinks() {
    var gameIdsToClear = [];
    var gameId;
    var iconElement;
    var iconId;
    var icons;
    var index;
    var layoutIconId;

    cancelPendingIconLayoutSave();

    for (gameId in gameDesktopLinkIds) {
      if (!Object.prototype.hasOwnProperty.call(gameDesktopLinkIds, gameId)) continue;
      gameIdsToClear.push(gameId);
    }

    if (desktopIconsRoot) {
      icons = desktopIconsRoot.querySelectorAll('.os-desktop-icon[data-desktop-icon^="game-"]');
      for (index = icons.length - 1; index >= 0; index--) {
        iconElement = icons[index];
        iconId = iconElement.getAttribute("data-desktop-icon") || "";
        if (iconId.indexOf("game-") === 0) {
          gameId = iconId.substring(5);
          if (gameId && gameIdsToClear.indexOf(gameId) === -1) {
            gameIdsToClear.push(gameId);
          }
        }
        if (iconElement.parentNode) {
          iconElement.parentNode.removeChild(iconElement);
        }
      }
    }

    gameDesktopLinkIds = {};

    for (index = 0; index < gameIdsToClear.length; index++) {
      gameId = gameIdsToClear[index];
      layoutIconId = getGameDesktopIconId(gameId);
      if (Object.prototype.hasOwnProperty.call(savedIconLayoutTable, layoutIconId)) {
        delete savedIconLayoutTable[layoutIconId];
      }
      setStartMenuGameDesktopLinkSwitchState(gameId, false);
    }

    try {
      localStorage.removeItem(GAME_DESKTOP_LINKS_STORAGE_KEY);
    } catch (error) {
    }

    desktopIconVisibilityTable = {};
    try {
      localStorage.removeItem(DESKTOP_ICON_VISIBILITY_STORAGE_KEY);
    } catch (error) {
    }

    applyAllDesktopIconVisibility();
    resetAllStartMenuDesktopVisibilitySwitches();
    updateActionIconsState();
    updateDesktopTabOrder();
    persistIconLayoutsNow();
    dispatchGameDesktopIconsRestored();
  }

  function onLocalStorageRestoredFromUnity() {
    window.__cmIconLayoutsPayload = null;
    window.__cmTaskbarOrderPayload = null;
    desktopIconVisibilityTable = {};
    loadDesktopIconVisibilityFromStorage();
    applyAllDesktopIconVisibility();
    populateDefaultIconLayoutTable();
    mergePersistedIconLayoutPayload(getPersistedIconLayoutsPayload());
    applyAllSavedIconLayoutsAndResolve();
    restoreEnabledGameDesktopIcons();
    readTaskbarOrderFromStorage();
    syncTaskbarApps();
    updateActionIconsState();
    updateDesktopTabOrder();
  }

  function initOnReady() {
    if (window.WebSettings && window.WebSettings.getDesktopIconScalePercent) {
      setDesktopIconScalePercent(window.WebSettings.getDesktopIconScalePercent());
    } else {
      setDesktopIconScalePercent(DESKTOP_ICON_SCALE_DEFAULT_PERCENT);
    }
    initDesktopIcons();
    loadDesktopIconVisibilityFromStorage();
    applyAllDesktopIconVisibility();
    updateActionIconsState();
    bindTaskbar();
    window.addEventListener("web-desktop-windows-restored", onDesktopWindowsRestored);
    initDefaultWindows();
    if (window.WebWindowManager && window.WebWindowManager.cancelPendingLayoutSave) {
      window.WebWindowManager.cancelPendingLayoutSave();
    }
    cancelPendingIconLayoutSave();
    window.__cmMenuBootDesktopReady = true;
    window.dispatchEvent(new CustomEvent("web-desktop-icons-ready"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOnReady);
  } else {
    initOnReady();
  }

  return {
    openWindow: openWindow,
    runWindowOpenHooks: function (windowElement) {
      var presetName = "";
      if (!windowElement) return;
      presetName = windowElement.getAttribute("data-wm-preset") || "";
      if (!presetName) return;
      runWindowOpenHooks(windowElement, presetName);
    },
    openWindowElement: openWindowElement,
    toggleWindow: toggleWindow,
    closeWindow: closeWindow,
    showDesktopHome: showDesktopHome,
    openStartDesktop: openStartDesktop,
    openSettingsDesktop: openSettingsDesktop,
    openExtrasDesktop: openExtrasDesktop,
    openCreditsDesktop: openCreditsDesktop,
    openChangelogDesktop: openChangelogDesktop,
    openGamesDesktop: openGamesDesktop,
    openArtDesktop: openArtDesktop,
    openLinksDesktop: openLinksDesktop,
    createGameDesktopIcon: createGameDesktopIcon,
    removeGameDesktopIcon: removeGameDesktopIcon,
    findGameDesktopIcon: findGameDesktopIcon,
    hasGameDesktopIcon: function (gameId) {
      return !!findGameDesktopIcon(gameId);
    },
    isWindowOpen: isWindowOpen,
    getWindowByPreset: getWindowByPreset,
    applyIconLayouts: function (payload) {
      if (payload) {
        window.__cmIconLayoutsPayload = payload;
      }
      populateSavedIconLayoutTable(payload);
      syncGameDesktopLinkIdsFromIconLayoutTable();
      applyAllSavedIconLayoutsAndResolve();
      restoreEnabledGameDesktopIcons();
      persistGameDesktopLinksNow();
      clearIconLayoutBootstrap();
      dispatchGameDesktopIconsRestored();
    },
    applyGameDesktopLinks: function (payload) {
      var gameIds = payload && payload.gameIds ? payload.gameIds : [];
      var index = 0;
      for (index = 0; index < gameIds.length; index++) {
        if (gameIds[index]) {
          gameDesktopLinkIds[gameIds[index]] = true;
        }
      }
      syncGameDesktopLinkIdsFromIconLayoutTable();
      restoreEnabledGameDesktopIcons();
      writeGameDesktopLinksToStorage(buildGameDesktopLinksPayload());
      dispatchGameDesktopIconsRestored();
    },
    isGameDesktopLinkEnabled: isGameDesktopLinkEnabled,
    setGameDesktopLinkEnabled: setGameDesktopLinkEnabledState,
    ensureGameDesktopLinkIcon: ensureGameDesktopLinkIcon,
    flushIconLayoutsSave: function () {
      cancelPendingIconLayoutSave();
      postIconLayoutsSave();
    },
    flushTaskbarOrderSave: flushTaskbarOrderSave,
    cancelPendingIconLayoutSave: cancelPendingIconLayoutSave,
    logIconLayoutDiffFromDefaults: logIconLayoutsDiffFromDefaults,
    buildIconLayoutDiffFromDefaultsPayload: buildIconLayoutsDiffFromDefaultsPayload,
    hasOpenAppWindows: hasOpenAppWindows,
    updateDesktopTabOrder: updateDesktopTabOrder,
    syncTaskbarApps: syncTaskbarApps,
    clearDesktopWindowsTogglePointerHover: clearDesktopWindowsTogglePointerHover,
    updateDesktopWindowsToggleState: updateDesktopWindowsToggleState,
    isMenuLayoutPhoneVertical: isMenuLayoutPhoneVertical,
    updateMenuLayoutPhoneMode: updateMenuLayoutPhoneMode,
    getDesktopIconScalePercent: getDesktopIconScalePercent,
    setDesktopIconScalePercent: setDesktopIconScalePercent,
    getDesktopIconImagePixelSize: getDesktopIconImagePixelSize,
    releaseDesktopPointerInteractionState: releaseDesktopPointerInteractionState,
    resetAllDesktopLinks: resetAllDesktopLinks,
    onLocalStorageRestoredFromUnity: onLocalStorageRestoredFromUnity
  };
})();

window.WebDesktop = WebDesktop;
