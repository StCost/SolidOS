var WebWindowManager = (function () {
  var MIN_WIDTH = 200;
  var MIN_HEIGHT = 0;
  var CHROME_OPEN_MS = 300;
  var BODY_OPEN_MS = 320;
  var OPEN_DONE_BUFFER_MS = 180;
  var STAGGER_MS = 90;

  var RESIZE_EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

  var presetTable = {
    "menu-splash": { minWidth: MIN_WIDTH, minHeight: 0 },
    "menu-actions": { minWidth: MIN_WIDTH, minHeight: 0 },
    "connect-col-0": { minWidth: MIN_WIDTH, minHeight: 0 },
    "connect-col-1": { minWidth: MIN_WIDTH, minHeight: 0 },
    "connect-col-2": { minWidth: MIN_WIDTH, minHeight: 0 },
    "connect-nav": { minWidth: MIN_WIDTH, minHeight: 0 },
    "settings-tabs": { minWidth: MIN_WIDTH, minHeight: 0 },
    "settings-content": { minWidth: MIN_WIDTH, minHeight: 0 },
    "settings-nav": { minWidth: MIN_WIDTH, minHeight: 0 },
    "credits-content": { minWidth: MIN_WIDTH, minHeight: 0 },
    "credits-nav": { minWidth: MIN_WIDTH, minHeight: 0 },
    "extras-content": { minWidth: MIN_WIDTH, minHeight: 0 },
    "extras-nav": { minWidth: MIN_WIDTH, minHeight: 0 },
    "extras-games": { minWidth: MIN_WIDTH, minHeight: 0 },
    "extras-art": { minWidth: MIN_WIDTH, minHeight: 0 },
    "extras-links": { minWidth: MIN_WIDTH, minHeight: 0 },
    "modal-center": { minWidth: MIN_WIDTH, minHeight: 0 }
  };

  var MINIMIZE_BOTTOM_INSET_PX = 8;
  var MINIMIZE_GAP_PX = 8;
  var MIN_BODY_RENDER_HEIGHT_PX = 12;
  var WINDOW_CONTROLS_BIND_VERSION = 2;

  var activeDrag = null;
  var activeResize = null;
  var zIndexCounter = 10;
  var reducedMotion = false;
  var mainMenuCanvasShown = false;
  var savedLayoutTable = {};
  var layoutSaveTimer = 0;
  var LAYOUTS_STORAGE_KEY = "cm-menu-window-layouts";
  var DEFAULT_DESKTOP_WINDOW_LAYOUTS = {
    "menu-splash": {
      anchor: "center",
      centerOffsetX: -475,
      centerOffsetY: -210,
      width: 950,
      height: 420,
      open: true
    },
    "connect-col-0": {
      anchor: "center",
      centerOffsetX: -210,
      centerOffsetY: -260,
      width: 420,
      height: 520,
      open: false
    },
    "connect-col-1": {
      anchor: "center",
      centerOffsetX: -210,
      centerOffsetY: -260,
      width: 420,
      height: 520,
      open: false
    },
    "connect-col-2": {
      anchor: "center",
      centerOffsetX: -210,
      centerOffsetY: -240,
      width: 420,
      height: 480,
      open: false
    },
    "settings-content": {
      anchor: "center",
      centerOffsetX: -460,
      centerOffsetY: -320,
      width: 920,
      height: 640,
      open: false
    },
    "extras-games": {
      anchor: "center",
      centerOffsetX: -360,
      centerOffsetY: -310,
      width: 720,
      height: 620,
      open: false
    },
    "extras-art": {
      anchor: "center",
      centerOffsetX: -280,
      centerOffsetY: -280,
      width: 560,
      height: 560,
      open: false
    },
    "extras-links": {
      anchor: "center",
      centerOffsetX: -260,
      centerOffsetY: -210,
      width: 520,
      height: 420,
      open: false
    },
    "credits-content": {
      anchor: "center",
      centerOffsetX: -320,
      centerOffsetY: -260,
      width: 640,
      height: 520,
      open: false
    }
  };
  var LAYOUT_BOOTSTRAP_CLASS = "menu-wm-layout-bootstrap";
  var LAYOUT_BOOTSTRAP_STYLE_ID = "cm-wm-layout-bootstrap";
  var LAYOUT_COMPARE_TOLERANCE_PX = 1;
  var DRAG_MOVE_SOUND_STEP_PX = 300;
  var WINDOW_KEYBOARD_FOCUS_SELECTOR =
    "button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), .term-row:not([disabled]), .settings-tab, .settings-option-btn, .settings-step, .worlds-entry, .calc-key, [role='button']:not([aria-disabled='true']), [tabindex]:not([tabindex='-1'])";

  function getPreset(name) {
    return presetTable[name];
  }

  function copyPreset(preset) {
    return {
      minWidth: preset.minWidth || MIN_WIDTH,
      minHeight: preset.minHeight || MIN_HEIGHT
    };
  }

  function getWindowChromeHeight(windowElement) {
    var chrome = windowElement.querySelector(".os-window-chrome");
    if (!chrome) return 28;
    return chrome.offsetHeight;
  }

  function getWindowTitleBlockHeight(windowElement) {
    var titleBlock = windowElement.querySelector(".term-header");
    if (!titleBlock) return 0;
    return titleBlock.offsetHeight;
  }

  function getWindowMinSize(windowElement, presetName) {
    var preset = getPreset(presetName);
    if (!preset) {
      return { minWidth: MIN_WIDTH, minHeight: MIN_HEIGHT };
    }

    var minSize = copyPreset(preset);
    var chromeHeight = getWindowChromeHeight(windowElement);
    if (chromeHeight + 2 > minSize.minHeight) {
      minSize.minHeight = chromeHeight + 2;
    }

    return minSize;
  }

  function getLayoutKey(windowElement) {
    if (!windowElement) return "";
    return windowElement.getAttribute("data-wm-preset") || "";
  }

  function isSavedLayoutOpen(entry) {
    if (!entry) return false;
    if (entry.open === false || entry.open === 0) return false;
    if (entry.open === true || entry.open === 1) return true;
    return true;
  }

  function getLayoutCoords() {
    return window.WebMenuLayoutCoords;
  }

  function mergeLayoutWithDesktopDefault(presetName, layout) {
    var defaultLayout = DEFAULT_DESKTOP_WINDOW_LAYOUTS[presetName];
    var merged = {};
    if (defaultLayout) {
      merged.anchor = defaultLayout.anchor;
      merged.centerOffsetX = defaultLayout.centerOffsetX;
      merged.centerOffsetY = defaultLayout.centerOffsetY;
      merged.width = defaultLayout.width;
      merged.height = defaultLayout.height;
      if (defaultLayout.open !== undefined) {
        merged.open = defaultLayout.open;
      }
    }
    if (!layout) {
      return merged;
    }
    if (layout.open !== undefined) {
      merged.open = layout.open;
    }
    if (layout.anchor !== undefined) {
      merged.anchor = layout.anchor;
    }
    if (layout.centerOffsetX !== undefined) {
      merged.centerOffsetX = layout.centerOffsetX;
    }
    if (layout.centerOffsetY !== undefined) {
      merged.centerOffsetY = layout.centerOffsetY;
    }
    if (layout.width !== undefined) {
      merged.width = layout.width;
    }
    if (layout.height !== undefined) {
      merged.height = layout.height;
    }
    if (layout.minimized === true) {
      merged.minimized = true;
    }
    if (layout.maximized === true) {
      merged.maximized = true;
    }
    if (layout.zIndex !== undefined) {
      merged.zIndex = layout.zIndex;
    }
    return merged;
  }

  function setSavedLayout(layoutKey, layout, containerElement) {
    if (!layoutKey || !layout) return;
    var coords = getLayoutCoords();
    var previous = savedLayoutTable[layoutKey];
    var storedLayout;
    var mergedLayout = mergeLayoutWithDesktopDefault(layoutKey, layout);
    var open = mergedLayout.open;
    if (open === undefined && previous) {
      open = previous.open;
    }
    if (open === undefined) {
      open = true;
    }
    var minimized = mergedLayout.minimized === true;
    var maximized = mergedLayout.maximized === true;
    if (mergedLayout.minimized === undefined && previous) {
      minimized = previous.minimized === true;
    }
    if (mergedLayout.maximized === undefined && previous) {
      maximized = previous.maximized === true;
    }
    if (minimized) {
      maximized = false;
    }
    if (!coords || !containerElement) return;
    storedLayout = coords.normalizeWindowStoredLayout(mergedLayout, containerElement);
    if (!storedLayout) return;
    savedLayoutTable[layoutKey] = storedLayout;
    savedLayoutTable[layoutKey].open = open;
    savedLayoutTable[layoutKey].minimized = minimized;
    savedLayoutTable[layoutKey].maximized = maximized;
    if (mergedLayout.zIndex !== undefined) {
      savedLayoutTable[layoutKey].zIndex = mergedLayout.zIndex;
    } else if (previous && previous.zIndex !== undefined) {
      savedLayoutTable[layoutKey].zIndex = previous.zIndex;
    }
  }

  function removeSavedLayout(layoutKey) {
    if (!layoutKey) return;
    if (!Object.prototype.hasOwnProperty.call(savedLayoutTable, layoutKey)) return;
    delete savedLayoutTable[layoutKey];
  }

  function getDefaultWindowLayoutContainer(presetName) {
    var desktopSurface = document.getElementById("desktopSurface");
    var windowElement;
    if (!desktopSurface || !presetName) return null;
    windowElement = desktopSurface.querySelector(
      '.os-window[data-wm-preset="' + presetName + '"]'
    );
    if (!windowElement) return desktopSurface;
    return getLayoutContainer(windowElement) || desktopSurface;
  }

  function populateDefaultWindowLayoutTable() {
    var presetName;
    var layout;
    var containerElement;
    savedLayoutTable = {};
    for (presetName in DEFAULT_DESKTOP_WINDOW_LAYOUTS) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULT_DESKTOP_WINDOW_LAYOUTS, presetName)) {
        continue;
      }
      layout = DEFAULT_DESKTOP_WINDOW_LAYOUTS[presetName];
      containerElement = getDefaultWindowLayoutContainer(presetName);
      if (!layout || !containerElement) continue;
      setSavedLayout(presetName, layout, containerElement);
    }
  }

  function mergePersistedWindowLayoutPayload(payload) {
    var layouts = payload && payload.layouts ? payload.layouts : [];
    var desktopSurface = document.getElementById("desktopSurface");
    var index = 0;
    for (index = 0; index < layouts.length; index++) {
      var entry = layouts[index];
      var layoutKey;
      var windowElement;
      var containerElement;
      if (!entry) continue;
      layoutKey = entry.preset;
      if (!layoutKey) continue;
      if (layoutKey === "about-content") {
        layoutKey = "credits-content";
      }
      if (!getLayoutCoords() || !getLayoutCoords().isCenterLayoutEntry(entry)) continue;
      containerElement = desktopSurface;
      if (desktopSurface) {
        windowElement = desktopSurface.querySelector(
          '.os-window[data-wm-preset="' + layoutKey + '"]'
        );
        if (windowElement) {
          containerElement = getLayoutContainer(windowElement) || desktopSurface;
        }
      }
      setSavedLayout(layoutKey, entry, containerElement);
    }
  }

  function populateSavedLayoutTable(payload) {
    populateDefaultWindowLayoutTable();
    mergePersistedWindowLayoutPayload(payload);
  }

  function applySavedLayouts(payload) {
    populateSavedLayoutTable(payload);
    applyAllSavedLayoutsInDocument();
    applyDesktopWindowVisibilityFromSaved();
    applySavedWindowStackOrder();
    applySavedChromeStatesFromSaved();
    clearLayoutBootstrap();
    window.dispatchEvent(new CustomEvent("web-desktop-windows-restored"));
  }

  function applySavedChromeStatesFromSaved() {
    var windows = document.querySelectorAll("#desktopSurface .os-window[data-wm-preset]");
    var index = 0;
    for (index = 0; index < windows.length; index++) {
      applySavedChromeStateToWindow(windows[index]);
    }
    layoutMinimizedWindowsInContainer(document.getElementById("desktopWorkspace"), null);
  }

  function applySavedChromeStateToWindow(windowElement) {
    var layoutKey = getLayoutKey(windowElement);
    var savedLayout = savedLayoutTable[layoutKey];
    if (!savedLayout) return;
    if (windowElement.classList.contains("os-window--closed")) return;

    ensureWindowStructure(windowElement);
    if (!windowElement.wmState) return;

    var shouldMinimize = savedLayout.minimized === true;
    var shouldMaximize = savedLayout.maximized === true;

    clearWindowChromeStates(windowElement);

    if (shouldMinimize) {
      prepareWindowDragStart(windowElement);
      windowElement.wmBeforeMinimizeState = captureWindowRestoreState(windowElement);
      windowElement.wmMinimizedUserAdjusted = false;
      windowElement.classList.add("os-window--minimized");
      setMinimizedWindowRect(windowElement);
      updateWindowControlChrome(windowElement);
      return;
    }

    if (shouldMaximize) {
      prepareWindowDragStart(windowElement);
      windowElement.wmBeforeMaximizeState = captureWindowRestoreState(windowElement);
      windowElement.classList.add("os-window--maximized");
      setMaximizedWindowRect(windowElement);
      updateWindowControlChrome(windowElement);
    }
  }

  function applyAllSavedLayoutsInDocument() {
    var windows = document.querySelectorAll(".os-window[data-wm-preset]");
    var index = 0;
    for (index = 0; index < windows.length; index++) {
      applySavedLayoutToWindow(windows[index]);
    }
  }

  function clearLayoutBootstrap() {
    document.documentElement.classList.remove(LAYOUT_BOOTSTRAP_CLASS);
    var styleElement = document.getElementById(LAYOUT_BOOTSTRAP_STYLE_ID);
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
    if (window.__cmWmLayoutsPayload) {
      window.__cmWmLayoutsPayload = null;
    }
  }

  function applySavedLayoutToWindow(windowElement) {
    var presetName = windowElement.getAttribute("data-wm-preset");
    var layoutKey = getLayoutKey(windowElement);
    var savedLayout = savedLayoutTable[layoutKey];
    var mergedLayout;
    if (!savedLayout) return;

    var containerElement = getLayoutContainer(windowElement);
    if (!containerElement) return;

    var minSize = getWindowMinSize(windowElement, presetName);
    var coords = getLayoutCoords();
    var resolvedRect;
    if (!coords) return;
    mergedLayout = mergeLayoutWithDesktopDefault(presetName, savedLayout);
    resolvedRect = coords.resolveWindowRect(mergedLayout, containerElement);
    windowElement.wmState = {
      left: resolvedRect.left,
      top: resolvedRect.top,
      width: Math.max(
        resolvedRect.width || mergedLayout.width || minSize.minWidth,
        minSize.minWidth
      ),
      height: Math.max(
        resolvedRect.height || mergedLayout.height || minSize.minHeight,
        minSize.minHeight
      ),
      minWidth: minSize.minWidth,
      minHeight: minSize.minHeight
    };
    applyWindowRect(windowElement);
    windowElement.wmHasInlineLayout = true;
  }

  function setSavedWindowOpen(windowElement, isOpen) {
    var layoutKey = getLayoutKey(windowElement);
    var previous;
    var containerElement;
    var mergedLayout;
    if (!layoutKey) return;
    previous = savedLayoutTable[layoutKey];
    if (!previous) {
      if (!isOpen) return;
      containerElement = getDefaultWindowLayoutContainer(layoutKey);
      if (containerElement && DEFAULT_DESKTOP_WINDOW_LAYOUTS[layoutKey]) {
        mergedLayout = mergeLayoutWithDesktopDefault(layoutKey, { open: true });
        setSavedLayout(layoutKey, mergedLayout, containerElement);
        return;
      }
      savedLayoutTable[layoutKey] = { open: true };
      return;
    }
    if (
      isOpen &&
      (previous.width === undefined || previous.height === undefined) &&
      DEFAULT_DESKTOP_WINDOW_LAYOUTS[layoutKey]
    ) {
      containerElement = getLayoutContainer(windowElement) || getDefaultWindowLayoutContainer(layoutKey);
      if (containerElement) {
        mergedLayout = mergeLayoutWithDesktopDefault(layoutKey, previous);
        mergedLayout.open = true;
        setSavedLayout(layoutKey, mergedLayout, containerElement);
        return;
      }
    }
    previous.open = isOpen;
  }

  function applySavedOpenStateToWindow(windowElement) {
    var presetName = windowElement.getAttribute("data-wm-preset");
    var layoutKey = getLayoutKey(windowElement);
    var savedLayout = savedLayoutTable[layoutKey];
    var shouldOpen = isSavedLayoutOpen(savedLayout);
    if (!savedLayout && presetName !== "menu-splash") {
      shouldOpen = false;
    }
    if (!savedLayout && presetName === "menu-splash") {
      shouldOpen = true;
    }
    if (shouldOpen) {
      windowElement.classList.remove("os-window--closed");
    } else {
      windowElement.classList.add("os-window--closed");
    }
  }

  function applyDesktopWindowVisibilityFromSaved() {
    var desktopSurface = document.getElementById("desktopSurface");
    if (!desktopSurface) return;
    var windows = desktopSurface.querySelectorAll(".os-window[data-wm-preset]");
    var index = 0;
    for (index = 0; index < windows.length; index++) {
      applySavedOpenStateToWindow(windows[index]);
    }
    syncDesktopTabOrder();
  }

  function getWindowDefaultStackOrder(windowElement) {
    var order = parseInt(windowElement.getAttribute("data-wm-order"), 10);
    if (isNaN(order)) return 0;
    return order;
  }

  function getWindowSavedZIndex(windowElement) {
    var layoutKey = getLayoutKey(windowElement);
    var savedLayout = savedLayoutTable[layoutKey];
    if (savedLayout && savedLayout.zIndex !== undefined && savedLayout.zIndex > 0) {
      return savedLayout.zIndex;
    }
    return getWindowDefaultStackOrder(windowElement);
  }

  function getWindowInlineZIndex(windowElement) {
    var inlineZIndex = parseInt(windowElement.style.zIndex, 10);
    if (isNaN(inlineZIndex) || inlineZIndex <= 0) return 0;
    return inlineZIndex;
  }

  function syncSavedLayoutZIndex(windowElement) {
    var layoutKey = getLayoutKey(windowElement);
    if (!layoutKey) return;
    var inlineZIndex = getWindowInlineZIndex(windowElement);
    if (inlineZIndex <= 0) return;
    var previous = savedLayoutTable[layoutKey];
    if (!previous) {
      savedLayoutTable[layoutKey] = {
        open: !windowElement.classList.contains("os-window--closed"),
        zIndex: inlineZIndex
      };
      return;
    }
    previous.zIndex = inlineZIndex;
  }

  function applySavedWindowStackOrder() {
    var desktopSurface = document.getElementById("desktopSurface");
    if (!desktopSurface) return null;

    var windows = desktopSurface.querySelectorAll(".os-window[data-wm-preset]");
    var visibleWindows = [];
    var index = 0;
    var maxZIndex = zIndexCounter;
    var topWindowElement = null;

    for (index = 0; index < windows.length; index++) {
      var windowElement = windows[index];
      var savedZIndex = getWindowSavedZIndex(windowElement);
      windowElement.style.zIndex = String(savedZIndex);
      if (savedZIndex > maxZIndex) {
        maxZIndex = savedZIndex;
      }
      if (windowElement.classList.contains("os-window--closed")) {
        continue;
      }
      visibleWindows.push({
        element: windowElement,
        zIndex: savedZIndex
      });
    }

    if (maxZIndex > zIndexCounter) {
      zIndexCounter = maxZIndex;
    }

    if (!visibleWindows.length) {
      return null;
    }

    visibleWindows.sort(function (first, second) {
      return first.zIndex - second.zIndex;
    });

    topWindowElement = visibleWindows[visibleWindows.length - 1].element;
    var managed = document.querySelectorAll(".os-window--managed.os-window--focused");
    for (index = 0; index < managed.length; index++) {
      managed[index].classList.remove("os-window--focused");
    }
    topWindowElement.classList.add("os-window--focused");
    return topWindowElement;
  }

  function syncSavedLayoutFromWindow(windowElement) {
    var layoutKey = getLayoutKey(windowElement);
    if (!layoutKey) return;
    var previous = savedLayoutTable[layoutKey];
    var isMinimized = windowElement.classList.contains("os-window--minimized");
    var isMaximized = windowElement.classList.contains("os-window--maximized");
    var entry = {
      open: !windowElement.classList.contains("os-window--closed"),
      minimized: isMinimized,
      maximized: isMaximized && !isMinimized
    };
    if (previous) {
      entry.width = previous.width;
      entry.height = previous.height;
      if (previous.zIndex !== undefined) {
        entry.zIndex = previous.zIndex;
      }
      entry.anchor = previous.anchor;
      entry.centerOffsetX = previous.centerOffsetX;
      entry.centerOffsetY = previous.centerOffsetY;
    }
    var inlineZIndex = getWindowInlineZIndex(windowElement);
    if (inlineZIndex > 0) {
      entry.zIndex = inlineZIndex;
    }
    var restoreState = null;
    if (isMinimized && windowElement.wmBeforeMinimizeState) {
      restoreState = windowElement.wmBeforeMinimizeState;
    } else if (isMaximized && windowElement.wmBeforeMaximizeState) {
      restoreState = windowElement.wmBeforeMaximizeState;
    } else if (windowElement.wmState && !isMinimized) {
      restoreState = {
        left: windowElement.wmState.left,
        top: windowElement.wmState.top,
        width: windowElement.wmState.width,
        height: windowElement.wmState.height
      };
    }
    if (restoreState) {
      entry.left = restoreState.left;
      entry.top = restoreState.top;
      entry.width = restoreState.width;
      entry.height = restoreState.height;
    }
    if (entry.width === undefined || entry.height === undefined) {
      return;
    }
    var containerElement = getLayoutContainer(windowElement);
    if (!containerElement) return;
    setSavedLayout(layoutKey, entry, containerElement);
  }

  function mergeInlineLayoutsIntoSavedTable() {
    var windows = document.querySelectorAll("#desktopSurface .os-window[data-wm-preset]");
    var index = 0;
    for (index = 0; index < windows.length; index++) {
      syncSavedLayoutFromWindow(windows[index]);
    }
  }

  function pruneSavedLayoutsToOpenWindows() {
    var liveKeys = {};
    var windows = document.querySelectorAll("#desktopSurface .os-window[data-wm-preset]");
    var index = 0;
    for (index = 0; index < windows.length; index++) {
      var layoutKey = getLayoutKey(windows[index]);
      if (layoutKey) liveKeys[layoutKey] = true;
    }
    var layoutKey;
    for (layoutKey in savedLayoutTable) {
      if (!Object.prototype.hasOwnProperty.call(savedLayoutTable, layoutKey)) continue;
      if (!liveKeys[layoutKey]) removeSavedLayout(layoutKey);
    }
  }

  function buildLayoutsPayloadFromSavedTable() {
    var layouts = [];
    var presetName;
    var coords = getLayoutCoords();
    var payloadEntry;
    if (!coords) return { layouts: layouts };
    for (presetName in savedLayoutTable) {
      if (!Object.prototype.hasOwnProperty.call(savedLayoutTable, presetName)) continue;
      var layout = savedLayoutTable[presetName];
      payloadEntry = coords.exportWindowPayloadEntry(layout, presetName);
      if (!payloadEntry) continue;
      payloadEntry.open = isSavedLayoutOpen(layout);
      layouts.push(payloadEntry);
    }
    return { layouts: layouts };
  }

  function collectWindowLayoutsPayload() {
    mergeInlineLayoutsIntoSavedTable();
    pruneSavedLayoutsToOpenWindows();
    return buildLayoutsPayloadFromSavedTable();
  }

  function getInitialDesktopOpenDefault(presetName) {
    if (presetName === "menu-splash") return true;
    return false;
  }

  function isLayoutNumberDifferent(valueA, valueB) {
    if (valueA === undefined && valueB === undefined) return false;
    if (valueA === undefined || valueB === undefined) return true;
    return Math.abs(valueA - valueB) > LAYOUT_COMPARE_TOLERANCE_PX;
  }

  function captureDefaultDesktopWindowLayout(windowElement) {
    var presetName = windowElement.getAttribute("data-wm-preset");
    var layoutKey = getLayoutKey(windowElement);
    var containerElement = getLayoutContainer(windowElement);
    var savedBackup;
    var probeBackup;
    var geometry;
    if (!presetName || !layoutKey || !containerElement) return null;
    if (!windowElement.closest("#desktopSurface")) return null;

    savedBackup = savedLayoutTable[layoutKey];
    probeBackup = {
      savedLayout: savedBackup,
      wmState: windowElement.wmState,
      wmHasInlineLayout: windowElement.wmHasInlineLayout,
      wasClosed: windowElement.classList.contains("os-window--closed"),
      wasMinimized: windowElement.classList.contains("os-window--minimized"),
      wasMaximized: windowElement.classList.contains("os-window--maximized")
    };

    delete savedLayoutTable[layoutKey];
    ensureWindowStructure(windowElement);
    clearWindowChromeStates(windowElement);
    clearWindowInlineGeometry(windowElement);
    windowElement.wmHasInlineLayout = false;
    windowElement.wmState = null;
    windowElement.classList.remove("os-window--closed");

    syncWindowLayout(windowElement);
    if (!windowElement.wmState) {
      syncWindowStateFromLayout(windowElement, containerElement, presetName);
    }

    geometry = null;
    if (windowElement.wmState) {
      geometry = {
        left: Math.round(windowElement.wmState.left),
        top: Math.round(windowElement.wmState.top),
        width: Math.round(windowElement.wmState.width),
        height: Math.round(windowElement.wmState.height)
      };
      if (getLayoutCoords()) {
        geometry = getLayoutCoords().absoluteToCenterOffset(
          geometry.left,
          geometry.top,
          containerElement
        );
        geometry.width = Math.round(windowElement.wmState.width);
        geometry.height = Math.round(windowElement.wmState.height);
      }
    }

    if (probeBackup.savedLayout) {
      savedLayoutTable[layoutKey] = probeBackup.savedLayout;
      applySavedLayoutToWindow(windowElement);
      applySavedChromeStateToWindow(windowElement);
    } else {
      delete savedLayoutTable[layoutKey];
      clearWindowInlineGeometry(windowElement);
      windowElement.wmHasInlineLayout = false;
      windowElement.wmState = probeBackup.wmState;
      if (probeBackup.wmHasInlineLayout && probeBackup.wmState) {
        applyWindowRect(windowElement);
        windowElement.wmHasInlineLayout = true;
      }
    }

    if (probeBackup.wasClosed) {
      windowElement.classList.add("os-window--closed");
    }
    if (probeBackup.wasMinimized) {
      windowElement.classList.add("os-window--minimized");
      setMinimizedWindowRect(windowElement);
    }
    if (probeBackup.wasMaximized) {
      windowElement.classList.add("os-window--maximized");
      setMaximizedWindowRect(windowElement);
    }
    updateWindowControlChrome(windowElement);

    if (!geometry || !getLayoutCoords()) return null;
    return {
      open: getInitialDesktopOpenDefault(presetName),
      minimized: false,
      maximized: false,
      anchor: geometry.anchor,
      centerOffsetX: geometry.centerOffsetX,
      centerOffsetY: geometry.centerOffsetY,
      width: geometry.width,
      height: geometry.height
    };
  }

  function getCurrentDesktopWindowLayout(windowElement) {
    var presetName = windowElement.getAttribute("data-wm-preset");
    var layoutKey = getLayoutKey(windowElement);
    var savedLayout;
    var entry;
    var restoreState;
    if (!presetName || !layoutKey) return null;

    syncSavedLayoutFromWindow(windowElement);
    savedLayout = savedLayoutTable[layoutKey];
    entry = {
      preset: presetName,
      open: !windowElement.classList.contains("os-window--closed")
    };

    if (savedLayout && savedLayout.open !== undefined) {
      entry.open = isSavedLayoutOpen(savedLayout);
    }

    if (windowElement.classList.contains("os-window--minimized")) {
      entry.minimized = true;
    }
    if (windowElement.classList.contains("os-window--maximized")) {
      entry.maximized = true;
    }
    if (savedLayout && savedLayout.zIndex !== undefined && savedLayout.zIndex > 0) {
      entry.zIndex = savedLayout.zIndex;
    }

    restoreState = captureWindowRestoreState(windowElement);
    if (restoreState) {
      var containerElement = getLayoutContainer(windowElement);
      var coords = getLayoutCoords();
      entry.width = Math.round(restoreState.width);
      entry.height = Math.round(restoreState.height);
      if (!coords || !containerElement) return null;
      var centerOffsets = coords.absoluteToCenterOffset(
        restoreState.left,
        restoreState.top,
        containerElement
      );
      entry.anchor = centerOffsets.anchor;
      entry.centerOffsetX = centerOffsets.centerOffsetX;
      entry.centerOffsetY = centerOffsets.centerOffsetY;
    } else if (savedLayout) {
      entry.anchor = savedLayout.anchor;
      entry.centerOffsetX = savedLayout.centerOffsetX;
      entry.centerOffsetY = savedLayout.centerOffsetY;
      if (savedLayout.width !== undefined) entry.width = Math.round(savedLayout.width);
      if (savedLayout.height !== undefined) entry.height = Math.round(savedLayout.height);
    }

    return entry;
  }

  function buildLayoutDiffEntry(currentEntry, defaultEntry) {
    var diffEntry = { preset: currentEntry.preset };
    var hasChange = false;
    var coords = getLayoutCoords();
    if (!coords) return null;

    if (currentEntry.open !== defaultEntry.open) {
      diffEntry.open = currentEntry.open;
      hasChange = true;
    }
    if (currentEntry.minimized === true && defaultEntry.minimized !== true) {
      diffEntry.minimized = true;
      hasChange = true;
    }
    if (currentEntry.maximized === true && defaultEntry.maximized !== true) {
      diffEntry.maximized = true;
      hasChange = true;
    }
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
    if (
      isLayoutNumberDifferent(
        coords.roundNiceSize(currentEntry.width),
        coords.roundNiceSize(defaultEntry.width)
      )
    ) {
      diffEntry.width = coords.roundNiceSize(currentEntry.width);
      hasChange = true;
    }
    if (
      isLayoutNumberDifferent(
        coords.roundNiceSize(currentEntry.height),
        coords.roundNiceSize(defaultEntry.height)
      )
    ) {
      diffEntry.height = coords.roundNiceSize(currentEntry.height);
      hasChange = true;
    }

    if (!hasChange) return null;
    return diffEntry;
  }

  function buildWindowLayoutsDiffFromDefaultsPayload() {
    var windows = document.querySelectorAll("#desktopSurface .os-window[data-wm-preset]");
    var layouts = [];
    var defaultsTable = {};
    var index;
    var windowElement;
    var presetName;
    var defaultEntry;
    var currentEntry;
    var diffEntry;

    for (index = 0; index < windows.length; index++) {
      windowElement = windows[index];
      presetName = windowElement.getAttribute("data-wm-preset");
      if (!presetName || defaultsTable[presetName]) continue;
      defaultEntry = captureDefaultDesktopWindowLayout(windowElement);
      if (defaultEntry) defaultsTable[presetName] = defaultEntry;
    }

    for (index = 0; index < windows.length; index++) {
      windowElement = windows[index];
      presetName = windowElement.getAttribute("data-wm-preset");
      if (!presetName) continue;
      defaultEntry = defaultsTable[presetName];
      if (!defaultEntry) continue;
      currentEntry = getCurrentDesktopWindowLayout(windowElement);
      if (!currentEntry) continue;
      diffEntry = buildLayoutDiffEntry(currentEntry, defaultEntry);
      if (diffEntry) layouts.push(diffEntry);
    }

    return { layouts: layouts };
  }

  function logWindowLayoutsDiffFromDefaults() {
    var payload = buildWindowLayoutsDiffFromDefaultsPayload();
    console.log(
      "[cm-menu-window-layouts] Paste this JSON (rounded center offsets; geometry only, no zIndex):"
    );
    console.log(JSON.stringify(payload, null, 2));
    return payload;
  }

  function flushWindowLayoutsSave() {
    if (layoutSaveTimer) {
      window.clearTimeout(layoutSaveTimer);
      layoutSaveTimer = 0;
    }
    postWindowLayoutsSave();
  }

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function readLayoutsFromStorage() {
    try {
      var raw = localStorage.getItem(LAYOUTS_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function writeLayoutsToStorage(payload) {
    try {
      localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
    }
  }

  function getPersistedLayoutsPayload() {
    if (window.__cmWmLayoutsPayload) {
      return window.__cmWmLayoutsPayload;
    }
    return readLayoutsFromStorage();
  }

  function loadPersistedLayouts() {
    populateDefaultWindowLayoutTable();
    mergePersistedWindowLayoutPayload(getPersistedLayoutsPayload());
    applyAllSavedLayoutsInDocument();
    applyDesktopWindowVisibilityFromSaved();
    applySavedWindowStackOrder();
    applySavedChromeStatesFromSaved();
  }

  function postWindowLayoutsReset() {
    if (!isUnityHost()) return;
    window.vuplex.postMessage(
      JSON.stringify({
        eventName: "web-window-layout-reset"
      })
    );
  }

  function resetAllWindowLayouts() {
    if (layoutSaveTimer) {
      window.clearTimeout(layoutSaveTimer);
      layoutSaveTimer = 0;
    }

    savedLayoutTable = {};
    clearLayoutBootstrap();

    try {
      localStorage.removeItem(LAYOUTS_STORAGE_KEY);
    } catch (error) {
    }

    var windows = document.querySelectorAll(".os-window[data-wm-preset]");
    var index;
    for (index = 0; index < windows.length; index++) {
      var windowElement = windows[index];
      clearWindowInlineGeometry(windowElement);
      windowElement.wmHasInlineLayout = false;
      windowElement.wmState = null;
      setBodyMaxVar(windowElement);
    }

    var workspaces = document.querySelectorAll(".os-workspace--wm");
    for (index = 0; index < workspaces.length; index++) {
      syncWorkspaceWindows(workspaces[index]);
    }
    syncOverlayWindow();
    syncActivePageWindows();

    postWindowLayoutsReset();
    writeLayoutsToStorage({ layouts: [] });

    window.dispatchEvent(new CustomEvent("web-wm-layouts-reset"));
  }

  function postWindowLayoutsSave() {
    var payload = collectWindowLayoutsPayload();
    if (!isUnityHost()) {
      writeLayoutsToStorage(payload);
      return;
    }
    window.vuplex.postMessage(
      JSON.stringify({
        eventName: "web-window-layout-save",
        layoutsJson: JSON.stringify(payload)
      })
    );
  }

  function scheduleWindowLayoutsSave() {
    if (layoutSaveTimer) window.clearTimeout(layoutSaveTimer);
    layoutSaveTimer = window.setTimeout(function () {
      layoutSaveTimer = 0;
      postWindowLayoutsSave();
    }, 120);
  }

  function setBodyDragCursor() {
    document.body.setAttribute("data-wm-drag", "");
  }

  function setBodyResizeCursor(edge) {
    document.body.setAttribute("data-wm-resize", edge);
  }

  function clearBodyInteractionCursor() {
    document.body.removeAttribute("data-wm-drag");
    document.body.removeAttribute("data-wm-resize");
  }

  function dispatchWindowDragStart() {
    window.dispatchEvent(new CustomEvent("web-wm-drag-start"));
  }

  function dispatchWindowDragEnd() {
    window.dispatchEvent(new CustomEvent("web-wm-drag-end"));
  }

  function syncDesktopTabOrder() {
    if (window.WebDesktop && window.WebDesktop.updateDesktopTabOrder) {
      window.WebDesktop.updateDesktopTabOrder();
    }
  }

  function dispatchWindowDragMoveStep() {
    window.dispatchEvent(new CustomEvent("web-wm-drag-step"));
  }

  function accumulateWindowDragMoveSound(drag, previousLeft, previousTop, nextLeft, nextTop) {
    var deltaLeft = nextLeft - previousLeft;
    var deltaTop = nextTop - previousTop;
    if (deltaLeft === 0 && deltaTop === 0) {
      return;
    }

    var stepDistance = Math.sqrt(deltaLeft * deltaLeft + deltaTop * deltaTop);
    drag.moveSoundRemainder = drag.moveSoundRemainder + stepDistance;
    while (drag.moveSoundRemainder >= DRAG_MOVE_SOUND_STEP_PX) {
      drag.moveSoundRemainder = drag.moveSoundRemainder - DRAG_MOVE_SOUND_STEP_PX;
      dispatchWindowDragMoveStep();
    }
  }

  function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function isWindowKeyboardFocusTarget(node) {
    if (!node) return false;
    if (node.disabled) return false;
    if (node.getAttribute && node.getAttribute("aria-hidden") === "true") return false;
    if (node.hidden) return false;
    if (node.offsetWidth === 0 && node.offsetHeight === 0) return false;
    return true;
  }

  function setWindowKeyboardFocus(windowElement) {
    var nodes;
    var index;
    var node;
    if (!windowElement) return;
    nodes = windowElement.querySelectorAll(WINDOW_KEYBOARD_FOCUS_SELECTOR);
    for (index = 0; index < nodes.length; index++) {
      node = nodes[index];
      if (!isWindowKeyboardFocusTarget(node)) continue;
      if (!node.focus) continue;
      try {
        node.focus({ preventScroll: true });
      } catch (error) {
        node.focus();
      }
      return;
    }
  }

  function focusWindow(windowElement) {
    if (!windowElement) return;
    zIndexCounter = zIndexCounter + 1;
    windowElement.style.zIndex = String(zIndexCounter);
    var managed = document.querySelectorAll(".os-window--managed.os-window--focused");
    var index = 0;
    for (index = 0; index < managed.length; index++) {
      managed[index].classList.remove("os-window--focused");
    }
    windowElement.classList.add("os-window--focused");
    syncSavedLayoutZIndex(windowElement);
    scheduleWindowLayoutsSave();
  }

  function shouldSkipWindowFocusEvent(event) {
    if (!event) return true;
    if (event.button != null && event.button !== 0) return true;
    if (event.isPrimary === false) return true;
    return false;
  }

  function bindWindowFocus(windowElement) {
    if (windowElement.wmFocusBound) return;

    function onWindowActivate(event) {
      if (shouldSkipWindowFocusEvent(event)) return;
      if (windowElement.classList.contains("os-window--closed")) return;
      focusWindow(windowElement);
    }

    windowElement.addEventListener("pointerdown", onWindowActivate, true);
    windowElement.addEventListener("mousedown", onWindowActivate, true);
    windowElement.wmFocusBound = true;
  }

  function getBounds(containerElement) {
    return {
      left: 0,
      top: 0,
      width: containerElement.clientWidth,
      height: containerElement.clientHeight
    };
  }

  function setChromeHeightVar(windowElement) {
    var chromeHeight = getWindowChromeHeight(windowElement);
    windowElement.style.setProperty("--wm-chrome-height", String(chromeHeight) + "px");
  }

  function setBodyMaxVar(windowElement) {
    var bodyShell = windowElement.querySelector(".os-window-body-shell");
    if (!bodyShell) return;
    var chromeHeight = getWindowChromeHeight(windowElement);
    setChromeHeightVar(windowElement);
    var windowHeight = windowElement.clientHeight;
    var bodyMax = windowHeight - chromeHeight;
    if (bodyMax < 0) bodyMax = 0;
    windowElement.style.setProperty("--wm-body-max", String(bodyMax) + "px");
    updateWindowBodyRenderState(windowElement);
  }

  function updateWindowBodyRenderState(windowElement) {
    if (!windowElement) return;
    var chromeHeight = getWindowChromeHeight(windowElement);
    var bodySpace = windowElement.clientHeight - chromeHeight;
    if (bodySpace < MIN_BODY_RENDER_HEIGHT_PX) {
      windowElement.classList.add("os-window--body-suppressed");
    } else {
      windowElement.classList.remove("os-window--body-suppressed");
    }
  }

  function getMinimizedWindowSize(windowElement, presetName) {
    var minSize = getWindowMinSize(windowElement, presetName);
    var chromeHeight = getWindowChromeHeight(windowElement);
    return {
      width: minSize.minWidth,
      height: chromeHeight
    };
  }

  function isMinimizedWindowLayoutCandidate(windowElement, containerElement) {
    if (!windowElement || !containerElement) return false;
    if (!containerElement.contains(windowElement)) return false;
    if (windowElement.classList.contains("os-window--closed")) return false;
    if (!windowElement.classList.contains("os-window--minimized")) return false;
    if (!windowElement.wmState) return false;
    return true;
  }

  function getMinimizedWindowsInContainer(containerElement) {
    var windows = containerElement.querySelectorAll(".os-window[data-wm-preset]");
    var result = [];
    var index;
    for (index = 0; index < windows.length; index++) {
      if (isMinimizedWindowLayoutCandidate(windows[index], containerElement)) {
        result.push(windows[index]);
      }
    }
    return result;
  }

  function compareMinimizedWindowLayoutOrder(firstWindowElement, secondWindowElement) {
    var firstTop = firstWindowElement.wmState.top;
    var secondTop = secondWindowElement.wmState.top;
    var firstLeft = firstWindowElement.wmState.left;
    var secondLeft = secondWindowElement.wmState.left;
    if (firstTop !== secondTop) {
      return secondTop - firstTop;
    }
    return firstLeft - secondLeft;
  }

  function buildMinimizedWindowLayoutOrder(minimizedWindows, appendedWindowElement) {
    var orderedWindows = [];
    var others = [];
    var index;
    for (index = 0; index < minimizedWindows.length; index++) {
      if (minimizedWindows[index] === appendedWindowElement) continue;
      others.push(minimizedWindows[index]);
    }
    others.sort(compareMinimizedWindowLayoutOrder);
    for (index = 0; index < others.length; index++) {
      orderedWindows.push(others[index]);
    }
    if (appendedWindowElement) {
      orderedWindows.push(appendedWindowElement);
    }
    return orderedWindows;
  }

  function applyMinimizedWindowRectState(windowElement, left, top, width, height) {
    windowElement.wmState.left = left;
    windowElement.wmState.top = top;
    windowElement.wmState.width = width;
    windowElement.wmState.height = height;
    windowElement.wmState.minWidth = width;
    windowElement.wmState.minHeight = height;
    applyWindowRect(windowElement);
    windowElement.wmMinimizedLayoutWidth = width;
    windowElement.wmMinimizedLayoutHeight = height;
    setBodyMaxVar(windowElement);
  }

  function layoutMinimizedWindowsInContainer(containerElement, appendedWindowElement) {
    var bounds;
    var inset;
    var gap;
    var minimizedWindows;
    var orderedWindows;
    var cursorX;
    var rowBottom;
    var rowMaxHeight;
    var index;
    var windowElement;
    var presetName;
    var minimizedSize;
    var width;
    var height;
    var left;
    var top;
    if (!containerElement) return;
    bounds = getBounds(containerElement);
    if (bounds.width < 1 || bounds.height < 1) return;
    inset = MINIMIZE_BOTTOM_INSET_PX;
    gap = MINIMIZE_GAP_PX;
    minimizedWindows = getMinimizedWindowsInContainer(containerElement);
    if (!minimizedWindows.length) return;
    orderedWindows = buildMinimizedWindowLayoutOrder(minimizedWindows, appendedWindowElement);
    cursorX = inset;
    rowBottom = bounds.height - inset;
    rowMaxHeight = 0;
    for (index = 0; index < orderedWindows.length; index++) {
      windowElement = orderedWindows[index];
      presetName = windowElement.getAttribute("data-wm-preset");
      minimizedSize = getMinimizedWindowSize(windowElement, presetName);
      width = minimizedSize.width;
      height = minimizedSize.height;
      if (cursorX > inset && cursorX + width > bounds.width - inset) {
        rowBottom = rowBottom - rowMaxHeight - gap;
        cursorX = inset;
        rowMaxHeight = 0;
      }
      left = cursorX;
      top = rowBottom - height;
      if (top < inset) {
        top = inset;
      }
      if (left + width > bounds.width - inset) {
        left = bounds.width - inset - width;
      }
      if (left < inset) {
        left = inset;
      }
      applyMinimizedWindowRectState(windowElement, left, top, width, height);
      cursorX = cursorX + width + gap;
      if (height > rowMaxHeight) {
        rowMaxHeight = height;
      }
    }
  }

  function markOpenAnimationDone(windowElement) {
    if (!windowElement || !windowElement.classList) return;
    if (
      !windowElement.classList.contains("os-window--opening") &&
      !windowElement.classList.contains("os-window--opening-body-only")
    ) {
      return;
    }
    setBodyMaxVar(windowElement);
    windowElement.classList.add("os-window--open-done");
  }

  function finishOpenAnimation(windowElement) {
    if (!windowElement || !windowElement.classList) return;
    setBodyMaxVar(windowElement);
    windowElement.classList.remove("os-window--opening");
    windowElement.classList.remove("os-window--opening-body-only");
    windowElement.classList.remove("os-window--open-done");
    setBodyMaxVar(windowElement);
    dispatchWorkspaceLayoutSettled(windowElement);
    if (window.WebScrollbarCursor) {
      window.WebScrollbarCursor.scheduleScrollViewScan();
    }
  }

  function wrapWindowBody(windowElement) {
    if (windowElement.querySelector(".os-window-body-shell")) return;

    var body = windowElement.querySelector(".os-window-body--terminal");
    var chrome = windowElement.querySelector(".os-window-chrome");
    if (!body || !chrome) return;

    var shell = document.createElement("div");
    shell.className = "os-window-body-shell";
    body.parentNode.insertBefore(shell, body);
    shell.appendChild(body);

    chrome.classList.add("os-window-chrome--drag");
    var titleElement = chrome.querySelector(".os-window-title");
    if (titleElement) {
      titleElement.classList.remove("os-window-title--drag");
    }
    setChromeHeightVar(windowElement);
  }

  function isWindowChromeControlTarget(target) {
    if (!target || !target.closest) return false;
    return !!target.closest(".os-window-controls, .os-window-control");
  }

  function getWindowDragHandle(windowElement) {
    return windowElement.querySelector(".os-window-chrome--drag");
  }

  function addResizeHandles(windowElement) {
    var index = 0;
    for (index = 0; index < RESIZE_EDGES.length; index++) {
      var edge = RESIZE_EDGES[index];
      var handle = document.createElement("div");
      handle.className = "os-wm-resize os-wm-resize--" + edge;
      handle.setAttribute("data-wm-edge", edge);
      windowElement.appendChild(handle);
    }
  }

  function getLayoutContainer(windowElement) {
    var overlay = windowElement.closest(".term-overlay");
    if (overlay) return overlay;
    return windowElement.closest(".os-workspace--wm");
  }

  function isWorkspaceVisible(workspaceElement) {
    if (!workspaceElement) return false;
    var page = workspaceElement.closest(".menu-page");
    if (page && page.hidden) return false;
    return workspaceElement.offsetWidth > 0 && workspaceElement.offsetHeight > 0;
  }

  function clearWindowInlineGeometry(windowElement) {
    windowElement.style.left = "";
    windowElement.style.top = "";
    windowElement.style.width = "";
    windowElement.style.height = "";
    windowElement.style.bottom = "";
    windowElement.style.right = "";
    windowElement.style.marginLeft = "";
    windowElement.style.marginTop = "";
    windowElement.style.transform = "";
  }

  function syncWindowStateFromLayout(windowElement, containerElement, presetName) {
    var containerRect = containerElement.getBoundingClientRect();
    var rect = windowElement.getBoundingClientRect();
    var left = rect.left - containerRect.left;
    var top = rect.top - containerRect.top;
    var minSize = getWindowMinSize(windowElement, presetName);

    windowElement.wmState = {
      left: left,
      top: top,
      width: rect.width,
      height: rect.height,
      minWidth: minSize.minWidth,
      minHeight: minSize.minHeight
    };
  }

  function centerManagedWindow(windowElement, containerElement, presetName) {
    var minSize = getWindowMinSize(windowElement, presetName);
    var bounds = getBounds(containerElement);
    var inset = getWorkspaceInset(containerElement);
    var rect = windowElement.getBoundingClientRect();
    var windowWidth = rect.width;
    var windowHeight = rect.height;

    if (windowWidth < minSize.minWidth) {
      windowWidth = minSize.minWidth;
    }
    if (windowHeight < minSize.minHeight) {
      windowHeight = minSize.minHeight;
    }

    var maxWidth = Math.max(minSize.minWidth, bounds.width - inset * 2);
    var maxHeight = Math.max(minSize.minHeight, bounds.height - inset * 2);
    if (windowWidth > maxWidth) {
      windowWidth = maxWidth;
    }
    if (windowHeight > maxHeight) {
      windowHeight = maxHeight;
    }

    windowElement.wmState = {
      left: Math.max(inset, Math.round((bounds.width - windowWidth) * 0.5)),
      top: Math.max(inset, Math.round((bounds.height - windowHeight) * 0.5)),
      width: windowWidth,
      height: windowHeight,
      minWidth: minSize.minWidth,
      minHeight: minSize.minHeight
    };
    applyWindowRect(windowElement);
  }

  function applyWindowRect(windowElement) {
    windowElement.style.left = String(Math.round(windowElement.wmState.left)) + "px";
    windowElement.style.top = String(Math.round(windowElement.wmState.top)) + "px";
    windowElement.style.width = String(Math.round(windowElement.wmState.width)) + "px";
    windowElement.style.height = String(Math.round(windowElement.wmState.height)) + "px";
    windowElement.style.bottom = "";
    windowElement.style.right = "";
    windowElement.style.marginLeft = "";
    windowElement.style.marginTop = "";
    windowElement.style.transform = "none";
    windowElement.wmHasInlineLayout = true;
    setBodyMaxVar(windowElement);
  }

  function prepareWindowDragStart(windowElement) {
    var presetName = windowElement.getAttribute("data-wm-preset");
    if (!getPreset(presetName)) return;

    var containerElement = getLayoutContainer(windowElement);
    if (!containerElement) return;

    syncWindowStateFromLayout(windowElement, containerElement, presetName);

    if (!windowElement.wmHasInlineLayout) {
      applyWindowRect(windowElement);
    }
  }

  function hasSavedLayouts() {
    var presetName;
    for (presetName in savedLayoutTable) {
      if (Object.prototype.hasOwnProperty.call(savedLayoutTable, presetName)) {
        return true;
      }
    }
    return false;
  }

  function syncWindowLayout(windowElement) {
    var presetName = windowElement.getAttribute("data-wm-preset");
    if (!getPreset(presetName)) return;

    var containerElement = getLayoutContainer(windowElement);
    if (!containerElement) return;

    if (containerElement.clientWidth < 1 || containerElement.clientHeight < 1) return;

    var layoutKey = getLayoutKey(windowElement);
    if (savedLayoutTable[layoutKey]) {
      applySavedLayoutToWindow(windowElement);
      applySavedChromeStateToWindow(windowElement);
      return;
    }

    if (!windowElement.wmHasInlineLayout) {
      clearWindowInlineGeometry(windowElement);
      applySavedLayoutToWindow(windowElement);
      if (windowElement.wmHasInlineLayout) {
        setBodyMaxVar(windowElement);
        return;
      }
      centerManagedWindow(windowElement, containerElement, presetName);
      setBodyMaxVar(windowElement);
      return;
    }

    syncWindowStateFromLayout(windowElement, containerElement, presetName);
    setBodyMaxVar(windowElement);
  }

  function isWindowDragHandleTarget(target) {
    if (!target || !target.closest) return false;
    if (isWindowChromeControlTarget(target)) return false;
    return !!target.closest(".os-window-title--drag, .os-window-chrome--drag");
  }

  function bindDrag(windowElement) {
    if (windowElement.wmDragBound) return;

    function beginDrag(clientX, clientY, pointerId) {
      var container = getLayoutContainer(windowElement);
      if (!container) return;

      prepareWindowDragStart(windowElement);

      focusWindow(windowElement);
      activeDrag = {
        windowElement: windowElement,
        container: container,
        startX: clientX,
        startY: clientY,
        startLeft: windowElement.wmState.left,
        startTop: windowElement.wmState.top,
        pointerId: pointerId,
        moveSoundRemainder: 0
      };
      setBodyDragCursor();
      dispatchWindowDragStart();
    }

    function onDragMouseDown(event) {
      if (event.button !== 0) return;
      if (!isWindowDragHandleTarget(event.target)) return;
      beginDrag(event.clientX, event.clientY, null);
      event.preventDefault();
    }

    function onDragPointerDown(event) {
      if (event.button != null && event.button !== 0) return;
      if (event.isPrimary === false) return;
      if (!isWindowDragHandleTarget(event.target)) return;
      beginDrag(event.clientX, event.clientY, event.pointerId);
      var dragHandle = getWindowDragHandle(windowElement);
      if (dragHandle) {
        try {
          dragHandle.setPointerCapture(event.pointerId);
        } catch (error) {}
      }
      event.preventDefault();
    }

    windowElement.addEventListener("mousedown", onDragMouseDown);
    windowElement.addEventListener("pointerdown", onDragPointerDown);
    windowElement.wmDragBound = true;
  }

  function bindResize(windowElement) {
    var handles = windowElement.querySelectorAll(".os-wm-resize");
    var index = 0;
    for (index = 0; index < handles.length; index++) {
      function beginResize(handleElement, clientX, clientY, pointerId) {
        var container = getLayoutContainer(windowElement);
        if (!container) return;
        var edge = handleElement.getAttribute("data-wm-edge");

        if (!windowElement.wmState) {
          syncWindowLayout(windowElement);
        }

        focusWindow(windowElement);
        activeResize = {
          windowElement: windowElement,
          container: container,
          edge: edge,
          startX: clientX,
          startY: clientY,
          startLeft: windowElement.wmState.left,
          startTop: windowElement.wmState.top,
          startWidth: windowElement.wmState.width,
          startHeight: windowElement.wmState.height,
          pointerId: pointerId
        };
        setBodyResizeCursor(edge);
      }

      handles[index].addEventListener("mousedown", function (event) {
        if (event.button !== 0) return;
        beginResize(event.currentTarget, event.clientX, event.clientY, null);
        event.preventDefault();
        event.stopPropagation();
      });

      handles[index].addEventListener("pointerdown", function (event) {
        if (event.button != null && event.button !== 0) return;
        if (event.isPrimary === false) return;
        beginResize(event.currentTarget, event.clientX, event.clientY, event.pointerId);
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch (error) {}
        event.preventDefault();
        event.stopPropagation();
      });
    }
  }

  function onPointerMove(event) {
    if (activeDrag && activeDrag.pointerId != null) {
      if (event.pointerId != null && event.pointerId !== activeDrag.pointerId) return;
    }
    if (activeResize && activeResize.pointerId != null) {
      if (event.pointerId != null && event.pointerId !== activeResize.pointerId) return;
    }

    if (activeDrag) {
      var drag = activeDrag;
      var bounds = getBounds(drag.container);
      var deltaX = event.clientX - drag.startX;
      var deltaY = event.clientY - drag.startY;
      var nextLeft = drag.startLeft + deltaX;
      var nextTop = drag.startTop + deltaY;

      nextLeft = clamp(nextLeft, 0, Math.max(0, bounds.width - drag.windowElement.wmState.width));
      nextTop = clamp(nextTop, 0, Math.max(0, bounds.height - drag.windowElement.wmState.height));

      var previousLeft = drag.windowElement.wmState.left;
      var previousTop = drag.windowElement.wmState.top;
      accumulateWindowDragMoveSound(drag, previousLeft, previousTop, nextLeft, nextTop);

      drag.windowElement.wmState.left = nextLeft;
      drag.windowElement.wmState.top = nextTop;
      applyWindowRect(drag.windowElement);
      return;
    }

    if (activeResize) {
      setBodyResizeCursor(activeResize.edge);
      var resize = activeResize;
      var bounds = getBounds(resize.container);
      var deltaX = event.clientX - resize.startX;
      var deltaY = event.clientY - resize.startY;
      var edge = resize.edge;
      var left = resize.startLeft;
      var top = resize.startTop;
      var width = resize.startWidth;
      var height = resize.startHeight;
      var minWidth = resize.windowElement.wmState.minWidth;
      var minHeight = resize.windowElement.wmState.minHeight;

      if (edge.indexOf("e") !== -1) {
        width = resize.startWidth + deltaX;
      }
      if (edge.indexOf("w") !== -1) {
        width = resize.startWidth - deltaX;
        left = resize.startLeft + deltaX;
      }
      if (edge.indexOf("s") !== -1) {
        height = resize.startHeight + deltaY;
      }
      if (edge.indexOf("n") !== -1) {
        height = resize.startHeight - deltaY;
        top = resize.startTop + deltaY;
      }

      if (width < minWidth) {
        if (edge.indexOf("w") !== -1) left = resize.startLeft + resize.startWidth - minWidth;
        width = minWidth;
      }
      if (height < minHeight) {
        if (edge.indexOf("n") !== -1) top = resize.startTop + resize.startHeight - minHeight;
        height = minHeight;
      }

      if (left < 0) {
        width = width + left;
        left = 0;
      }
      if (top < 0) {
        height = height + top;
        top = 0;
      }
      if (left + width > bounds.width) width = bounds.width - left;
      if (top + height > bounds.height) height = bounds.height - top;

      resize.windowElement.wmState.left = left;
      resize.windowElement.wmState.top = top;
      resize.windowElement.wmState.width = width;
      resize.windowElement.wmState.height = height;
      applyWindowRect(resize.windowElement);
    }
  }

  function onPointerUp() {
    var finishedWindow = null;
    var wasDragging = !!activeDrag;
    if (activeDrag) {
      activeDrag.windowElement.wmHasInlineLayout = true;
      finishedWindow = activeDrag.windowElement;
    }
    if (activeResize) {
      activeResize.windowElement.wmHasInlineLayout = true;
      finishedWindow = activeResize.windowElement;
    }
    if (activeResize || activeDrag) {
      clearBodyInteractionCursor();
      if (finishedWindow) {
        if (finishedWindow.classList.contains("os-window--minimized")) {
          applyMinimizedUserAdjustToRestoreState(finishedWindow);
          layoutMinimizedWindowsInContainer(getLayoutContainer(finishedWindow), null);
        } else {
          syncSavedLayoutFromWindow(finishedWindow);
        }
      }
      flushWindowLayoutsSave();
    }
    if (wasDragging) {
      dispatchWindowDragEnd();
    }
    activeDrag = null;
    activeResize = null;
  }

  function getWorkspaceInset(containerElement) {
    var styles = window.getComputedStyle(containerElement);
    var insetValue = styles.getPropertyValue("--wm-inset");
    var inset = parseFloat(insetValue);
    if (!inset || inset < 0) inset = 16;
    return inset;
  }

  function captureWindowRestoreState(windowElement) {
    if (!windowElement.wmState) return null;
    return {
      left: windowElement.wmState.left,
      top: windowElement.wmState.top,
      width: windowElement.wmState.width,
      height: windowElement.wmState.height
    };
  }

  function applyRestoreState(windowElement, restoreState) {
    if (!restoreState || !windowElement.wmState) return;
    windowElement.wmState.left = restoreState.left;
    windowElement.wmState.top = restoreState.top;
    windowElement.wmState.width = restoreState.width;
    windowElement.wmState.height = restoreState.height;
    applyWindowRect(windowElement);
  }

  function clearWindowChromeStates(windowElement) {
    windowElement.classList.remove("os-window--maximized");
    windowElement.classList.remove("os-window--minimized");
    windowElement.wmBeforeMaximizeState = null;
    windowElement.wmBeforeMinimizeState = null;
    windowElement.wmMinimizedUserAdjusted = false;
    windowElement.wmMinimizedLayoutWidth = 0;
    windowElement.wmMinimizedLayoutHeight = 0;
    updateWindowControlChrome(windowElement);
  }

  function applyMinimizedUserAdjustToRestoreState(windowElement) {
    var beforeState = windowElement.wmBeforeMinimizeState;
    if (!beforeState || !windowElement.wmState) return;
    beforeState.left = windowElement.wmState.left;
    beforeState.top = windowElement.wmState.top;
    if (
      windowElement.wmMinimizedLayoutWidth &&
      windowElement.wmState.width !== windowElement.wmMinimizedLayoutWidth
    ) {
      beforeState.width = windowElement.wmState.width;
    }
    if (
      windowElement.wmMinimizedLayoutHeight &&
      windowElement.wmState.height !== windowElement.wmMinimizedLayoutHeight
    ) {
      beforeState.height = windowElement.wmState.height;
    }
    windowElement.wmMinimizedLayoutWidth = windowElement.wmState.width;
    windowElement.wmMinimizedLayoutHeight = windowElement.wmState.height;
    windowElement.wmMinimizedUserAdjusted = true;
  }

  function setWindowMinSizeFromPreset(windowElement) {
    var presetName = windowElement.getAttribute("data-wm-preset");
    var minSize = getWindowMinSize(windowElement, presetName);
    if (!windowElement.wmState) return;
    windowElement.wmState.minWidth = minSize.minWidth;
    windowElement.wmState.minHeight = minSize.minHeight;
  }

  function updateWindowControlChrome(windowElement) {
    var maximizeButton = windowElement.querySelector('[data-wm-action="maximize"]');
    if (maximizeButton) {
      if (windowElement.classList.contains("os-window--maximized")) {
        maximizeButton.setAttribute("data-wm-state", "restored");
        maximizeButton.setAttribute("aria-label", "Restore window size");
      } else {
        maximizeButton.removeAttribute("data-wm-state");
        maximizeButton.setAttribute("aria-label", "Maximize window");
      }
    }

    var minimizeButton = windowElement.querySelector('[data-wm-action="minimize"]');
    if (minimizeButton) {
      if (windowElement.classList.contains("os-window--minimized")) {
        minimizeButton.setAttribute("data-wm-state", "restored");
        minimizeButton.setAttribute("aria-label", "Restore window");
      } else {
        minimizeButton.removeAttribute("data-wm-state");
        minimizeButton.setAttribute("aria-label", "Minimize window");
      }
    }
  }

  function ensureWindowControlGlyph(buttonElement) {
    if (!buttonElement || buttonElement.querySelector(".os-window-control-glyph")) return;
    var glyphElement = document.createElement("span");
    glyphElement.className = "os-window-control-glyph";
    glyphElement.setAttribute("aria-hidden", "true");
    buttonElement.appendChild(glyphElement);
  }

  function closeManagedWindow(windowElement) {
    var containerElement = getLayoutContainer(windowElement);
    clearWindowChromeStates(windowElement);
    windowElement.classList.add("os-window--closed");
    syncSavedLayoutFromWindow(windowElement);
    scheduleWindowLayoutsSave();
    syncActivePageWindows();
    if (containerElement) {
      layoutMinimizedWindowsInContainer(containerElement, null);
    }
    syncDesktopTabOrder();
  }

  function restoreFromMinimized(windowElement) {
    if (!windowElement.wmBeforeMinimizeState) return false;
    var restoreState = windowElement.wmBeforeMinimizeState;
    windowElement.classList.remove("os-window--minimized");
    if (!windowElement.wmState) {
      prepareWindowDragStart(windowElement);
    }
    windowElement.wmState.left = restoreState.left;
    windowElement.wmState.top = restoreState.top;
    windowElement.wmState.width = restoreState.width;
    windowElement.wmState.height = restoreState.height;
    setWindowMinSizeFromPreset(windowElement);
    windowElement.wmHasInlineLayout = true;
    applyWindowRect(windowElement);
    windowElement.wmBeforeMinimizeState = null;
    windowElement.wmMinimizedUserAdjusted = false;
    windowElement.wmMinimizedLayoutWidth = 0;
    windowElement.wmMinimizedLayoutHeight = 0;
    setBodyMaxVar(windowElement);
    updateWindowControlChrome(windowElement);
    focusWindow(windowElement);
    syncSavedLayoutFromWindow(windowElement);
    scheduleWindowLayoutsSave();
    layoutMinimizedWindowsInContainer(getLayoutContainer(windowElement), null);
    syncDesktopTabOrder();
    return true;
  }

  function restoreFromMaximized(windowElement) {
    if (!windowElement.wmBeforeMaximizeState) return false;
    prepareWindowDragStart(windowElement);
    applyRestoreState(windowElement, windowElement.wmBeforeMaximizeState);
    windowElement.wmBeforeMaximizeState = null;
    windowElement.classList.remove("os-window--maximized");
    updateWindowControlChrome(windowElement);
    focusWindow(windowElement);
    syncSavedLayoutFromWindow(windowElement);
    scheduleWindowLayoutsSave();
    syncDesktopTabOrder();
    return true;
  }

  function setMinimizedWindowRect(windowElement) {
    var containerElement = getLayoutContainer(windowElement);
    if (!containerElement || !windowElement.wmState) return;
    layoutMinimizedWindowsInContainer(containerElement, windowElement);
  }

  function setMaximizedWindowRect(windowElement) {
    var containerElement = getLayoutContainer(windowElement);
    if (!containerElement || !windowElement.wmState) return;

    var bounds = getBounds(containerElement);
    var inset = getWorkspaceInset(containerElement);
    var left = inset;
    var top = inset;
    var width = Math.max(windowElement.wmState.minWidth, bounds.width - inset * 2);
    var height = Math.max(windowElement.wmState.minHeight, bounds.height - inset * 2);

    windowElement.wmState.left = left;
    windowElement.wmState.top = top;
    windowElement.wmState.width = width;
    windowElement.wmState.height = height;
    applyWindowRect(windowElement);
    setBodyMaxVar(windowElement);
  }

  function maximizeManagedWindow(windowElement) {
    var containerElement = getLayoutContainer(windowElement);
    if (!containerElement) return;

    if (windowElement.classList.contains("os-window--closed")) {
      windowElement.classList.remove("os-window--closed");
    }

    prepareWindowDragStart(windowElement);

    if (windowElement.classList.contains("os-window--minimized")) {
      restoreFromMinimized(windowElement);
      prepareWindowDragStart(windowElement);
    }

    if (windowElement.classList.contains("os-window--maximized")) {
      restoreFromMaximized(windowElement);
      return;
    }

    windowElement.wmBeforeMaximizeState = captureWindowRestoreState(windowElement);

    setMaximizedWindowRect(windowElement);
    windowElement.classList.add("os-window--maximized");
    updateWindowControlChrome(windowElement);
    focusWindow(windowElement);
    syncSavedLayoutFromWindow(windowElement);
    scheduleWindowLayoutsSave();
    syncDesktopTabOrder();
  }

  function minimizeManagedWindow(windowElement) {
    if (windowElement.classList.contains("os-window--minimized")) {
      restoreFromMinimized(windowElement);
      return;
    }

    var containerElement = getLayoutContainer(windowElement);
    if (!containerElement) return;

    if (windowElement.classList.contains("os-window--closed")) {
      windowElement.classList.remove("os-window--closed");
    }

    prepareWindowDragStart(windowElement);

    if (windowElement.classList.contains("os-window--maximized")) {
      restoreFromMaximized(windowElement);
      prepareWindowDragStart(windowElement);
    }

    windowElement.wmBeforeMinimizeState = captureWindowRestoreState(windowElement);
    windowElement.wmMinimizedUserAdjusted = false;
    windowElement.classList.add("os-window--minimized");
    setMinimizedWindowRect(windowElement);
    updateWindowControlChrome(windowElement);
    focusWindow(windowElement);
    syncSavedLayoutFromWindow(windowElement);
    scheduleWindowLayoutsSave();
    syncDesktopTabOrder();
  }

  function restoreManagedWindow(windowElement) {
    if (windowElement.classList.contains("os-window--minimized")) {
      restoreFromMinimized(windowElement);
      return;
    }
    if (windowElement.classList.contains("os-window--maximized")) {
      restoreFromMaximized(windowElement);
    }
  }

  function isDesktopWindowElement(windowElement) {
    if (!windowElement) return false;
    var desktopSurface = document.getElementById("desktopSurface");
    if (!desktopSurface) return false;
    return desktopSurface.contains(windowElement);
  }

  function isDesktopWindowCandidate(windowElement) {
    if (!windowElement || !isDesktopWindowElement(windowElement)) return false;
    if (windowElement.classList.contains("os-window--closed")) return false;
    var presetName = windowElement.getAttribute("data-wm-preset");
    if (!presetName) return false;
    return true;
  }

  function areAllVisibleDesktopWindowsMinimized() {
    var desktopSurface = document.getElementById("desktopSurface");
    if (!desktopSurface) return false;
    var windows = desktopSurface.querySelectorAll(".os-window[data-wm-preset]");
    var index = 0;
    var hasVisible = false;
    for (index = 0; index < windows.length; index++) {
      var windowElement = windows[index];
      if (!isDesktopWindowCandidate(windowElement)) continue;
      hasVisible = true;
      if (!windowElement.classList.contains("os-window--minimized")) {
        return false;
      }
    }
    return hasVisible;
  }

  function toggleMinimizeAllDesktopWindows() {
    var desktopSurface = document.getElementById("desktopSurface");
    if (!desktopSurface) return false;

    var windows = desktopSurface.querySelectorAll(".os-window[data-wm-preset]");
    var index = 0;
    var restoreAll = areAllVisibleDesktopWindowsMinimized();

    for (index = 0; index < windows.length; index++) {
      var windowElement = windows[index];
      if (!isDesktopWindowCandidate(windowElement)) continue;
      ensureWindowStructure(windowElement);
      if (restoreAll) {
        if (windowElement.classList.contains("os-window--minimized")) {
          restoreManagedWindow(windowElement);
        }
        continue;
      }
      if (!windowElement.classList.contains("os-window--minimized")) {
        minimizeManagedWindow(windowElement);
      }
    }

    scheduleWindowLayoutsSave();
    if (windows.length > 0) {
      dispatchWorkspaceLayoutSettled(windows[0]);
    }
    layoutMinimizedWindowsInContainer(desktopSurface, null);
    return !restoreAll;
  }

  function bindWindowControlButton(buttonElement, windowElement, actionName) {
    if (!buttonElement) return;

    var pointerDownOnButton = false;

    function runControlAction(event) {
      if (buttonElement.wmControlActionLock) return;
      buttonElement.wmControlActionLock = true;
      window.setTimeout(function () {
        buttonElement.wmControlActionLock = false;
      }, 120);

      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      if (actionName === "close") {
        closeManagedWindow(windowElement);
        return;
      }
      if (actionName === "maximize") {
        maximizeManagedWindow(windowElement);
        return;
      }
      if (actionName === "minimize") {
        minimizeManagedWindow(windowElement);
      }
    }

    buttonElement.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
      pointerDownOnButton = true;
    });
    buttonElement.addEventListener("mousedown", function (event) {
      event.stopPropagation();
      pointerDownOnButton = true;
    });
    buttonElement.addEventListener("pointerup", function (event) {
      if (!pointerDownOnButton) return;
      pointerDownOnButton = false;
      if (event.button != null && event.button !== 0) return;
      runControlAction(event);
    });
    buttonElement.addEventListener("pointercancel", function () {
      pointerDownOnButton = false;
    });
    buttonElement.addEventListener("click", function (event) {
      if (pointerDownOnButton) {
        pointerDownOnButton = false;
        runControlAction(event);
        return;
      }
      runControlAction(event);
    });
  }

  function bindWindowControls(windowElement) {
    if (windowElement.wmControlsReady) return;
    var controls = windowElement.querySelector(".os-window-controls");
    if (!controls) return;

    var closeButton = controls.querySelector('[data-wm-action="close"]');
    var maximizeButton = controls.querySelector('[data-wm-action="maximize"]');
    var minimizeButton = controls.querySelector('[data-wm-action="minimize"]');

    ensureWindowControlGlyph(closeButton);
    ensureWindowControlGlyph(maximizeButton);
    ensureWindowControlGlyph(minimizeButton);

    controls.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
    });
    controls.addEventListener("mousedown", function (event) {
      event.stopPropagation();
    });

    bindWindowControlButton(closeButton, windowElement, "close");
    bindWindowControlButton(maximizeButton, windowElement, "maximize");
    bindWindowControlButton(minimizeButton, windowElement, "minimize");

    updateWindowControlChrome(windowElement);
    windowElement.wmControlsReady = true;
  }

  function ensureWindowChromeDrag(windowElement) {
    var chrome = windowElement.querySelector(".os-window-chrome");
    if (!chrome) return;
    var titleElement = chrome.querySelector(".os-window-title");
    if (!chrome.classList.contains("os-window-chrome--drag")) {
      chrome.classList.add("os-window-chrome--drag");
      windowElement.wmDragBound = false;
    }
    if (titleElement && titleElement.classList.contains("os-window-title--drag")) {
      titleElement.classList.remove("os-window-title--drag");
      windowElement.wmDragBound = false;
    }
    setChromeHeightVar(windowElement);
  }

  function ensureWindowStructure(windowElement) {
    if (!windowElement.querySelector(".os-window-body-shell")) {
      wrapWindowBody(windowElement);
      addResizeHandles(windowElement);
      windowElement.classList.add("os-window--managed");
    }

    ensureWindowChromeDrag(windowElement);

    if (!windowElement.wmDragBound) {
      bindDrag(windowElement);
      bindResize(windowElement);
      windowElement.wmDragBound = true;
    }

    bindWindowFocus(windowElement);

    if (windowElement.wmControlsBindVersion !== WINDOW_CONTROLS_BIND_VERSION) {
      windowElement.wmControlsReady = false;
      windowElement.wmDragBound = false;
      windowElement.wmFocusBound = false;
      windowElement.wmControlsBindVersion = WINDOW_CONTROLS_BIND_VERSION;
    }

    if (!windowElement.wmControlsReady) {
      bindWindowControls(windowElement);
    }

    windowElement.wmStructureReady = true;
  }

  function refreshWorkspaceScrollbars(workspaceElement) {
    if (!workspaceElement || !window.WebScrollbarCursor) {
      return;
    }
    if (window.WebScrollbarCursor.initScrollViews) {
      window.WebScrollbarCursor.initScrollViews(workspaceElement);
    }
    window.WebScrollbarCursor.refreshAllScrollbars();
  }

  function syncWorkspaceWindows(workspaceElement) {
    if (!isWorkspaceVisible(workspaceElement)) return;

    var windows = getWorkspaceWindows(workspaceElement);
    var index = 0;
    for (index = 0; index < windows.length; index++) {
      ensureWindowStructure(windows[index]);
      syncWindowLayout(windows[index]);
    }
    layoutMinimizedWindowsInContainer(workspaceElement, null);
  }

  function dispatchWorkspaceLayoutSettled(windowElement) {
    var workspaceElement = windowElement.closest(".os-workspace--wm");
    if (!workspaceElement) return;
    window.dispatchEvent(
      new CustomEvent("web-wm-layout-settled", {
        detail: { workspaceElement: workspaceElement }
      })
    );
  }

  function clearOpenAnimationTimers(windowElement) {
    if (!windowElement) return;
    if (windowElement.wmOpenAnimationTimers && windowElement.wmOpenAnimationTimers.length) {
      var index = 0;
      for (index = 0; index < windowElement.wmOpenAnimationTimers.length; index++) {
        window.clearTimeout(windowElement.wmOpenAnimationTimers[index]);
      }
    }
    windowElement.wmOpenAnimationTimers = [];
  }

  function trackOpenAnimationTimer(windowElement, timerId) {
    if (!windowElement) return;
    if (!windowElement.wmOpenAnimationTimers) windowElement.wmOpenAnimationTimers = [];
    windowElement.wmOpenAnimationTimers.push(timerId);
  }

  function playOpenAnimation(windowElement, delayMs) {
    var openDoneMs = delayMs + CHROME_OPEN_MS + BODY_OPEN_MS + OPEN_DONE_BUFFER_MS;

    if (!windowElement.wmState) {
      syncWindowLayout(windowElement);
    }

    if (reducedMotion) {
      windowElement.classList.remove("os-window--opening");
      setBodyMaxVar(windowElement);
      dispatchWorkspaceLayoutSettled(windowElement);
      if (window.WebScrollbarCursor) {
        window.WebScrollbarCursor.scheduleScrollViewScan();
      }
      return;
    }

    clearOpenAnimationTimers(windowElement);
    windowElement.classList.remove("os-window--open-done");
    windowElement.classList.remove("os-window--opening");
    void windowElement.offsetHeight;
    windowElement.classList.add("os-window--opening");
    setBodyMaxVar(windowElement);

    trackOpenAnimationTimer(
      windowElement,
      window.setTimeout(function () {
        markOpenAnimationDone(windowElement);
      }, delayMs + CHROME_OPEN_MS + BODY_OPEN_MS + 40)
    );

    trackOpenAnimationTimer(
      windowElement,
      window.setTimeout(function () {
        finishOpenAnimation(windowElement);
      }, openDoneMs)
    );
  }

  function playBodyOpenAnimation(windowElement, delayMs) {
    if (delayMs == null) delayMs = 0;
    var openDoneMs = delayMs + BODY_OPEN_MS + OPEN_DONE_BUFFER_MS;

    ensureWindowStructure(windowElement);
    if (!windowElement.wmState) {
      syncWindowLayout(windowElement);
    }

    if (reducedMotion) {
      clearOpenAnimationTimers(windowElement);
      windowElement.classList.remove("os-window--opening-body-only");
      windowElement.classList.remove("os-window--open-done");
      setBodyMaxVar(windowElement);
      dispatchWorkspaceLayoutSettled(windowElement);
      if (window.WebScrollbarCursor) {
        window.WebScrollbarCursor.scheduleScrollViewScan();
      }
      return;
    }

    clearOpenAnimationTimers(windowElement);
    windowElement.classList.remove("os-window--opening");
    windowElement.classList.remove("os-window--opening-body-only");
    windowElement.classList.remove("os-window--open-done");
    void windowElement.offsetHeight;
    windowElement.classList.add("os-window--opening-body-only");
    setBodyMaxVar(windowElement);

    trackOpenAnimationTimer(
      windowElement,
      window.setTimeout(function () {
        markOpenAnimationDone(windowElement);
      }, delayMs + BODY_OPEN_MS + 40)
    );

    trackOpenAnimationTimer(
      windowElement,
      window.setTimeout(function () {
        finishOpenAnimation(windowElement);
      }, openDoneMs)
    );
  }

  function getWorkspaceWindows(workspaceElement) {
    var windows = workspaceElement.querySelectorAll(".os-window[data-wm-preset]");
    var list = [];
    var index = 0;
    for (index = 0; index < windows.length; index++) {
      list.push(windows[index]);
    }
    list.sort(function (first, second) {
      var firstOrder = parseInt(first.getAttribute("data-wm-order"), 10);
      var secondOrder = parseInt(second.getAttribute("data-wm-order"), 10);
      if (isNaN(firstOrder)) firstOrder = 0;
      if (isNaN(secondOrder)) secondOrder = 0;
      return firstOrder - secondOrder;
    });
    return list;
  }

  function initWorkspace(workspaceElement) {
    if (workspaceElement.wmWorkspaceInitialized) return;

    var windows = getWorkspaceWindows(workspaceElement);
    var index = 0;
    for (index = 0; index < windows.length; index++) {
      ensureWindowStructure(windows[index]);
    }

    workspaceElement.wmWorkspaceInitialized = true;
  }

  function playWorkspaceOpenAnimations(workspaceElement) {
    var windows = getWorkspaceWindows(workspaceElement);
    var index = 0;
    for (index = 0; index < windows.length; index++) {
      playOpenAnimation(windows[index], index * STAGGER_MS);
    }
  }

  function activateWorkspace(workspaceElement) {
    if (!workspaceElement) return;
    initWorkspace(workspaceElement);
    if (hasSavedLayouts()) {
      applyAllSavedLayoutsInDocument();
    }
    syncWorkspaceWindows(workspaceElement);
    playWorkspaceOpenAnimations(workspaceElement);
  }

  function syncActivePageWindows() {
    var pageMenu = document.getElementById("pageMenu");
    if (!pageMenu || pageMenu.hidden) return;
    var menuWorkspace = pageMenu.querySelector(".os-workspace--wm");
    if (!menuWorkspace) return;
    syncWorkspaceWindows(menuWorkspace);
    refreshWorkspaceScrollbars(menuWorkspace);
  }

  function initOverlayWindow() {
    var overlayWindows = document.querySelectorAll(".term-overlay .os-window[data-wm-preset]");
    var index = 0;
    for (index = 0; index < overlayWindows.length; index++) {
      ensureWindowStructure(overlayWindows[index]);
    }
  }

  function centerOverlayWindow(windowElement, containerElement) {
    var presetName = windowElement.getAttribute("data-wm-preset");
    var minSize = getWindowMinSize(windowElement, presetName);
    var bounds = getBounds(containerElement);
    var rect = windowElement.getBoundingClientRect();
    var windowWidth = rect.width;
    var windowHeight = rect.height;

    if (windowWidth < minSize.minWidth) {
      windowWidth = minSize.minWidth;
    }
    if (windowHeight < minSize.minHeight) {
      windowHeight = minSize.minHeight;
    }

    windowElement.wmState = {
      left: Math.max(0, Math.round((bounds.width - windowWidth) * 0.5)),
      top: Math.max(0, Math.round((bounds.height - windowHeight) * 0.5)),
      width: windowWidth,
      height: windowHeight,
      minWidth: minSize.minWidth,
      minHeight: minSize.minHeight
    };
    applyWindowRect(windowElement);
  }

  function syncOverlayWindow() {
    var overlay = document.querySelector(".term-overlay.is-open");
    if (!overlay) return;

    var overlayWindow = overlay.querySelector(".os-window[data-wm-preset]");
    if (!overlayWindow) return;

    ensureWindowStructure(overlayWindow);

    var presetName = overlayWindow.getAttribute("data-wm-preset");
    if (savedLayoutTable[presetName]) {
      applySavedLayoutToWindow(overlayWindow);
      return;
    }

    if (overlayWindow.wmHasInlineLayout && overlayWindow.wmState) {
      applyWindowRect(overlayWindow);
      setBodyMaxVar(overlayWindow);
      return;
    }

    centerOverlayWindow(overlayWindow, overlay);
  }

  function initAllWindowControls() {
    var windows = document.querySelectorAll(".os-window[data-wm-preset]");
    var index = 0;
    for (index = 0; index < windows.length; index++) {
      ensureWindowStructure(windows[index]);
    }
    initOverlayWindow();
  }

  function initAll() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reducedMotion = true;
    }

    initAllWindowControls();

    var managedWindows = document.querySelectorAll(".os-window[data-wm-preset]");
    var windowIndex = 0;
    for (windowIndex = 0; windowIndex < managedWindows.length; windowIndex++) {
      updateWindowBodyRenderState(managedWindows[windowIndex]);
    }

    var workspaces = document.querySelectorAll(".os-workspace--wm");
    var index = 0;
    for (index = 0; index < workspaces.length; index++) {
      initWorkspace(workspaces[index]);
    }

    document.addEventListener("mousemove", onPointerMove);
    document.addEventListener("mouseup", onPointerUp);
    document.addEventListener("pointermove", onPointerMove, { passive: false });
    document.addEventListener("pointerup", onPointerUp, { passive: false });
    document.addEventListener("pointercancel", onPointerUp, { passive: false });
    window.addEventListener("resize", syncActivePageWindows);
    window.addEventListener("resize", syncDesktopSavedLayoutsOnResize);
  }

  function syncDesktopSavedLayoutsOnResize() {
    var desktopSurface = document.getElementById("desktopSurface");
    var windows;
    var index;
    var windowElement;
    var layoutKey;
    if (!desktopSurface) return;
    windows = desktopSurface.querySelectorAll(".os-window[data-wm-preset]");
    for (index = 0; index < windows.length; index++) {
      windowElement = windows[index];
      layoutKey = getLayoutKey(windowElement);
      if (!layoutKey || !savedLayoutTable[layoutKey]) continue;
      if (windowElement.classList.contains("os-window--closed")) continue;
      applySavedLayoutToWindow(windowElement);
      applySavedChromeStateToWindow(windowElement);
    }
    layoutMinimizedWindowsInContainer(desktopSurface, null);
  }

  function activatePage(pageElement) {
    if (!pageElement) return;
    var workspace = pageElement.querySelector(".os-workspace--wm");
    if (workspace) activateWorkspace(workspace);
  }

  function shouldDeferMainMenuOpenAnimations() {
    var device = document.getElementById("device");
    if (!device) return false;
    if (device.classList.contains("menu-mode--game")) return false;
    return true;
  }

  function beginMainMenuScreenAnimations() {
    var device = document.getElementById("device");
    if (!device) return;
    device.classList.remove("menu-defer-animations");
    device.classList.add("menu-animations-start");
  }

  function onMainMenuCanvasShown() {
    mainMenuCanvasShown = true;
    beginMainMenuScreenAnimations();
    var pageMenuElement = document.getElementById("pageMenu");
    if (pageMenuElement && !pageMenuElement.hidden) activatePage(pageMenuElement);
  }

  function initOnReady() {
    var pageMenuElement = document.getElementById("pageMenu");
    var device = document.getElementById("device");
    if (device && shouldDeferMainMenuOpenAnimations()) {
      device.classList.add("menu-defer-animations");
    }
    if (!isUnityHost()) {
      loadPersistedLayouts();
    }
    initAll();
    if (!isUnityHost() && hasSavedLayouts()) {
      applyAllSavedLayoutsInDocument();
      applyDesktopWindowVisibilityFromSaved();
      applySavedWindowStackOrder();
      applySavedChromeStatesFromSaved();
      clearLayoutBootstrap();
      window.dispatchEvent(new CustomEvent("web-desktop-windows-restored"));
    }
    if (shouldDeferMainMenuOpenAnimations()) {
      if (mainMenuCanvasShown) {
        onMainMenuCanvasShown();
      } else if (!isUnityHost()) {
        beginMainMenuScreenAnimations();
        if (pageMenuElement && !pageMenuElement.hidden) activatePage(pageMenuElement);
      }
    } else if (pageMenuElement && !pageMenuElement.hidden) {
      activatePage(pageMenuElement);
    }
  }

  window.addEventListener("web-menu-canvas-shown", onMainMenuCanvasShown);
  window.addEventListener("web-page-changed", function () {
    syncActivePageWindows();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOnReady);
  } else {
    initOnReady();
  }

  return {
    initAll: initAll,
    activatePage: activatePage,
    activateWorkspace: activateWorkspace,
    relayoutWorkspace: syncWorkspaceWindows,
    relayoutActivePage: syncActivePageWindows,
    flushLayoutsSave: flushWindowLayoutsSave,
    relayoutOverlayWindow: syncOverlayWindow,
    focusWindow: focusWindow,
    setWindowKeyboardFocus: setWindowKeyboardFocus,
    closeWindow: closeManagedWindow,
    maximizeWindow: maximizeManagedWindow,
    minimizeWindow: minimizeManagedWindow,
    restoreWindow: restoreManagedWindow,
    playWindowOpen: playOpenAnimation,
    playWindowBodyOpen: playBodyOpenAnimation,
    syncWindowLayout: syncWindowLayout,
    setSavedWindowOpen: setSavedWindowOpen,
    ensureWindowStructure: ensureWindowStructure,
    applyWindowRect: applyWindowRect,
    removeSavedLayout: removeSavedLayout,
    applySavedLayouts: applySavedLayouts,
    applyDesktopWindowVisibility: applyDesktopWindowVisibilityFromSaved,
    applySavedWindowStackOrder: applySavedWindowStackOrder,
    toggleMinimizeAllDesktopWindows: toggleMinimizeAllDesktopWindows,
    areAllVisibleDesktopWindowsMinimized: areAllVisibleDesktopWindowsMinimized,
    scheduleWindowLayoutsSave: scheduleWindowLayoutsSave,
    hasSavedLayouts: hasSavedLayouts,
    resetAllLayouts: resetAllWindowLayouts,
    logLayoutDiffFromDefaults: logWindowLayoutsDiffFromDefaults,
    buildLayoutDiffFromDefaultsPayload: buildWindowLayoutsDiffFromDefaultsPayload
  };
})();
