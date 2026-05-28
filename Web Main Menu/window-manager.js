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
    "modal-center": { minWidth: MIN_WIDTH, minHeight: 0 }
  };

  var activeDrag = null;
  var activeResize = null;
  var zIndexCounter = 10;
  var reducedMotion = false;
  var mainMenuCanvasShown = false;
  var savedLayoutTable = {};
  var layoutSaveTimer = 0;
  var LAYOUTS_STORAGE_KEY = "cm-menu-window-layouts";
  var LAYOUT_BOOTSTRAP_CLASS = "menu-wm-layout-bootstrap";
  var LAYOUT_BOOTSTRAP_STYLE_ID = "cm-wm-layout-bootstrap";

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

  function setSavedLayout(presetName, layout) {
    if (!presetName || !layout) return;
    savedLayoutTable[presetName] = {
      left: layout.left,
      top: layout.top,
      width: layout.width,
      height: layout.height
    };
  }

  function populateSavedLayoutTable(payload) {
    var layouts = payload && payload.layouts ? payload.layouts : [];
    var index = 0;
    savedLayoutTable = {};
    for (index = 0; index < layouts.length; index++) {
      var entry = layouts[index];
      if (!entry || !entry.preset) continue;
      setSavedLayout(entry.preset, entry);
    }
  }

  function applySavedLayouts(payload) {
    populateSavedLayoutTable(payload);
    applyAllSavedLayoutsInDocument();
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
    var savedLayout = savedLayoutTable[presetName];
    if (!savedLayout) return;

    var containerElement = getLayoutContainer(windowElement);
    if (!containerElement) return;

    var minSize = getWindowMinSize(windowElement, presetName);
    windowElement.wmState = {
      left: savedLayout.left,
      top: savedLayout.top,
      width: Math.max(savedLayout.width, minSize.minWidth),
      height: Math.max(savedLayout.height, minSize.minHeight),
      minWidth: minSize.minWidth,
      minHeight: minSize.minHeight
    };
    applyWindowRect(windowElement);
    windowElement.wmHasInlineLayout = true;
  }

  function syncSavedLayoutFromWindow(windowElement) {
    var presetName = windowElement.getAttribute("data-wm-preset");
    if (!presetName || !windowElement.wmState) return;
    setSavedLayout(presetName, {
      left: windowElement.wmState.left,
      top: windowElement.wmState.top,
      width: windowElement.wmState.width,
      height: windowElement.wmState.height
    });
  }

  function mergeInlineLayoutsIntoSavedTable() {
    var windows = document.querySelectorAll(".os-window[data-wm-preset]");
    var index = 0;
    for (index = 0; index < windows.length; index++) {
      var windowElement = windows[index];
      if (!windowElement.wmHasInlineLayout || !windowElement.wmState) continue;
      syncSavedLayoutFromWindow(windowElement);
    }
  }

  function buildLayoutsPayloadFromSavedTable() {
    var layouts = [];
    var presetName;
    for (presetName in savedLayoutTable) {
      if (!Object.prototype.hasOwnProperty.call(savedLayoutTable, presetName)) continue;
      var layout = savedLayoutTable[presetName];
      layouts.push({
        preset: presetName,
        left: layout.left,
        top: layout.top,
        width: layout.width,
        height: layout.height
      });
    }
    return { layouts: layouts };
  }

  function collectWindowLayoutsPayload() {
    mergeInlineLayoutsIntoSavedTable();
    return buildLayoutsPayloadFromSavedTable();
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
    var payload = getPersistedLayoutsPayload();
    if (!payload) return;
    applySavedLayouts(payload);
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

  function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function focusWindow(windowElement) {
    zIndexCounter = zIndexCounter + 1;
    windowElement.style.zIndex = String(zIndexCounter);
    var managed = document.querySelectorAll(".os-window--managed.os-window--focused");
    var index = 0;
    for (index = 0; index < managed.length; index++) {
      managed[index].classList.remove("os-window--focused");
    }
    windowElement.classList.add("os-window--focused");
  }

  function getBounds(containerElement) {
    return {
      left: 0,
      top: 0,
      width: containerElement.clientWidth,
      height: containerElement.clientHeight
    };
  }

  function setBodyMaxVar(windowElement) {
    var bodyShell = windowElement.querySelector(".os-window-body-shell");
    if (!bodyShell) return;
    var chrome = windowElement.querySelector(".os-window-chrome");
    var chromeHeight = chrome ? chrome.offsetHeight : 0;
    var windowHeight = windowElement.clientHeight;
    var bodyMax = windowHeight - chromeHeight;
    if (bodyMax < 0) bodyMax = 0;
    windowElement.style.setProperty("--wm-body-max", String(bodyMax) + "px");
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

    if (savedLayoutTable[presetName]) {
      applySavedLayoutToWindow(windowElement);
      return;
    }

    if (!windowElement.wmHasInlineLayout) {
      clearWindowInlineGeometry(windowElement);
      applySavedLayoutToWindow(windowElement);
      if (windowElement.wmHasInlineLayout) {
        setBodyMaxVar(windowElement);
        return;
      }
    }

    syncWindowStateFromLayout(windowElement, containerElement, presetName);
    setBodyMaxVar(windowElement);
  }

  function bindDrag(windowElement) {
    var chrome = windowElement.querySelector(".os-window-chrome--drag");
    if (!chrome) return;

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
        pointerId: pointerId
      };
      setBodyDragCursor();
    }

    chrome.addEventListener("mousedown", function (event) {
      if (event.button !== 0) return;
      beginDrag(event.clientX, event.clientY, null);
      event.preventDefault();
    });

    chrome.addEventListener("pointerdown", function (event) {
      if (event.button != null && event.button !== 0) return;
      if (event.isPrimary === false) return;
      beginDrag(event.clientX, event.clientY, event.pointerId);
      try {
        chrome.setPointerCapture(event.pointerId);
      } catch (error) {}
      event.preventDefault();
    });
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
        syncSavedLayoutFromWindow(finishedWindow);
      }
      flushWindowLayoutsSave();
    }
    activeDrag = null;
    activeResize = null;
  }

  function ensureWindowStructure(windowElement) {
    if (windowElement.wmStructureReady) return;

    wrapWindowBody(windowElement);
    addResizeHandles(windowElement);
    windowElement.classList.add("os-window--managed");
    bindDrag(windowElement);
    bindResize(windowElement);
    windowElement.wmStructureReady = true;
  }

  function refreshWorkspaceScrollbars(workspaceElement) {
    if (!workspaceElement || !window.WebScrollbarCursor) {
      return;
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
        window.WebScrollbarCursor.refreshAllScrollbars();
      }
      return;
    }

    windowElement.classList.remove("os-window--open-done");
    windowElement.classList.add("os-window--opening");
    setBodyMaxVar(windowElement);

    window.setTimeout(function () {
      windowElement.classList.add("os-window--open-done");
    }, delayMs + CHROME_OPEN_MS + BODY_OPEN_MS + 40);

    window.setTimeout(function () {
      windowElement.classList.remove("os-window--opening");
      windowElement.classList.remove("os-window--open-done");
      setBodyMaxVar(windowElement);
      dispatchWorkspaceLayoutSettled(windowElement);
      if (window.WebScrollbarCursor) {
        window.WebScrollbarCursor.refreshAllScrollbars();
      }
    }, openDoneMs);
  }

  function playBodyOpenAnimation(windowElement, delayMs) {
    if (delayMs == null) delayMs = 0;
    var openDoneMs = delayMs + BODY_OPEN_MS + OPEN_DONE_BUFFER_MS;

    ensureWindowStructure(windowElement);
    if (!windowElement.wmState) {
      syncWindowLayout(windowElement);
    }

    if (reducedMotion) {
      windowElement.classList.remove("os-window--opening-body-only");
      windowElement.classList.remove("os-window--open-done");
      setBodyMaxVar(windowElement);
      dispatchWorkspaceLayoutSettled(windowElement);
      if (window.WebScrollbarCursor) {
        window.WebScrollbarCursor.refreshAllScrollbars();
      }
      return;
    }

    windowElement.classList.remove("os-window--opening");
    windowElement.classList.remove("os-window--opening-body-only");
    windowElement.classList.remove("os-window--open-done");
    windowElement.classList.add("os-window--opening-body-only");
    setBodyMaxVar(windowElement);

    window.setTimeout(function () {
      windowElement.classList.add("os-window--open-done");
    }, delayMs + BODY_OPEN_MS + 40);

    window.setTimeout(function () {
      windowElement.classList.remove("os-window--opening-body-only");
      windowElement.classList.remove("os-window--open-done");
      setBodyMaxVar(windowElement);
      dispatchWorkspaceLayoutSettled(windowElement);
      if (window.WebScrollbarCursor) {
        window.WebScrollbarCursor.refreshAllScrollbars();
      }
    }, openDoneMs);
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
    var pageStart = document.getElementById("pageStart");
    var pageSettings = document.getElementById("pageSettings");
    var pageCredits = document.getElementById("pageCredits");
    var pageMenu = document.getElementById("pageMenu");
    if (pageStart && !pageStart.hidden) {
      var startWorkspace = pageStart.querySelector(".os-workspace--wm");
      if (startWorkspace) {
        syncWorkspaceWindows(startWorkspace);
        refreshWorkspaceScrollbars(startWorkspace);
      }
      return;
    }
    if (pageCredits && !pageCredits.hidden) {
      var creditsWorkspace = pageCredits.querySelector(".os-workspace--wm");
      if (creditsWorkspace) {
        syncWorkspaceWindows(creditsWorkspace);
        refreshWorkspaceScrollbars(creditsWorkspace);
      }
      return;
    }
    if (pageSettings && !pageSettings.hidden) {
      var settingsWorkspace = pageSettings.querySelector(".os-workspace--wm");
      if (settingsWorkspace) {
        syncWorkspaceWindows(settingsWorkspace);
        refreshWorkspaceScrollbars(settingsWorkspace);
      }
      return;
    }
    if (pageMenu && !pageMenu.hidden) {
      var menuWorkspace = pageMenu.querySelector(".os-workspace--wm");
      if (menuWorkspace) {
        syncWorkspaceWindows(menuWorkspace);
        refreshWorkspaceScrollbars(menuWorkspace);
      }
    }
  }

  function initOverlayWindow() {
    var overlayWindow = document.querySelector(".term-overlay .os-window[data-wm-preset]");
    if (!overlayWindow) return;
    ensureWindowStructure(overlayWindow);
    syncWindowLayout(overlayWindow);
  }

  function syncOverlayWindow() {
    var overlayWindow = document.querySelector(".term-overlay .os-window[data-wm-preset]");
    var overlay = document.querySelector(".term-overlay");
    if (!overlayWindow || !overlay || !overlay.classList.contains("is-open")) return;
    syncWindowLayout(overlayWindow);
  }

  function initAll() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reducedMotion = true;
    }

    var workspaces = document.querySelectorAll(".os-workspace--wm");
    var index = 0;
    for (index = 0; index < workspaces.length; index++) {
      initWorkspace(workspaces[index]);
    }
    initOverlayWindow();

    document.addEventListener("mousemove", onPointerMove);
    document.addEventListener("mouseup", onPointerUp);
    document.addEventListener("pointermove", onPointerMove, { passive: false });
    document.addEventListener("pointerup", onPointerUp, { passive: false });
    document.addEventListener("pointercancel", onPointerUp, { passive: false });
    window.addEventListener("resize", syncActivePageWindows);
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
      clearLayoutBootstrap();
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
    playWindowOpen: playOpenAnimation,
    playWindowBodyOpen: playBodyOpenAnimation,
    applySavedLayouts: function (payload) {
      applySavedLayouts(payload);
      clearLayoutBootstrap();
    }
  };
})();
