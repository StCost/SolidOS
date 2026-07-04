(function () {
  var WINDOW_QUERY_KEY = "window";
  var TAB_QUERY_KEY = "tab";
  var LEGACY_ROUTE_QUERY_KEYS = ["route", "p"];
  var ROUTE_WINDOW_EXTRAS_GAMES = "extras-games";
  var ROUTE_WINDOW_EXTRAS_GAME = "extras-game";
  var applyingRoute = false;
  var routeBootComplete = false;
  var initialRouteWindow = "";
  var initialRouteTab = "";

  function isWebMode() {
    return typeof window.vuplex === "undefined" || !window.vuplex.postMessage;
  }

  function getWindowManager() {
    return window.WebWindowManager || null;
  }

  function trimSlashes(path) {
    if (!path) return "";
    return path.replace(/^\/+|\/+$/g, "");
  }

  function readRouteFromLocation() {
    if (!isWebMode()) {
      return { window: "", tab: "" };
    }

    var windowPreset = "";
    var tabValue = "";
    if (window.location.search) {
      var params = new URLSearchParams(window.location.search);
      windowPreset = params.get(WINDOW_QUERY_KEY) || "";
      tabValue = params.get(TAB_QUERY_KEY) || "";
      if (windowPreset) {
        windowPreset = windowPreset.trim();
      }
      if (tabValue) {
        tabValue = tabValue.trim();
      }
    }
    if (!windowPreset) {
      var hash = window.location.hash || "";
      if (hash.indexOf("#") === 0) {
        hash = hash.slice(1);
      }
      if (hash.indexOf("/") === 0) {
        hash = hash.slice(1);
      }
      hash = trimSlashes(hash);
      if (hash && hash.indexOf("/") < 0) {
        windowPreset = hash.trim();
      }
    }
    return { window: windowPreset, tab: tabValue };
  }

  function captureInitialRouteFromLocation() {
    var route = readRouteFromLocation();
    initialRouteWindow = route.window;
    initialRouteTab = route.tab;
  }

  function isValidDesktopWindowPreset(presetName) {
    if (!presetName) return false;
    var windowManager = getWindowManager();
    if (windowManager && windowManager.isDesktopWindowPreset) {
      return windowManager.isDesktopWindowPreset(presetName);
    }
    return !!document.querySelector(
      '#desktopSurface .os-window[data-wm-preset="' + presetName + '"]'
    );
  }

  function windowSupportsTabParam(presetName) {
    if (presetName === "settings-content") return true;
    if (presetName === ROUTE_WINDOW_EXTRAS_GAMES) return true;
    if (presetName === ROUTE_WINDOW_EXTRAS_GAME) return true;
    if (presetName === "extras-art") return true;
    return false;
  }

  function normalizeRouteWindowPreset(presetName) {
    if (presetName === ROUTE_WINDOW_EXTRAS_GAME) {
      return ROUTE_WINDOW_EXTRAS_GAMES;
    }
    return presetName || "";
  }

  function parseWindowPresetFromLocation() {
    return readRouteFromLocation().window;
  }

  function parseTabFromLocation() {
    return readRouteFromLocation().tab;
  }

  function buildLocationUrl(windowPreset, tabValue) {
    var url = new URL(window.location.href);
    var index;
    if (windowPreset) {
      url.searchParams.set(WINDOW_QUERY_KEY, windowPreset);
    } else {
      url.searchParams.delete(WINDOW_QUERY_KEY);
    }
    if (tabValue && windowPreset && windowSupportsTabParam(windowPreset)) {
      url.searchParams.set(TAB_QUERY_KEY, tabValue);
    } else {
      url.searchParams.delete(TAB_QUERY_KEY);
    }
    for (index = 0; index < LEGACY_ROUTE_QUERY_KEYS.length; index++) {
      url.searchParams.delete(LEGACY_ROUTE_QUERY_KEYS[index]);
    }
    if (url.hash) {
      url.hash = "";
    }
    return url.pathname + url.search;
  }

  function setLocationRoute(windowPreset, tabValue, useReplace) {
    if (!isWebMode()) return;
    var nextUrl = buildLocationUrl(windowPreset, tabValue);
    var currentUrl = window.location.pathname + window.location.search + window.location.hash;
    if (currentUrl === nextUrl) {
      return;
    }
    if (useReplace) {
      window.history.replaceState(null, "", nextUrl);
    } else {
      window.history.pushState(null, "", nextUrl);
    }
  }

  function getFocusedDesktopWindowElement() {
    return document.querySelector(
      "#desktopSurface .os-window.os-window--focused[data-wm-preset]"
    );
  }

  function getFocusedWindowPreset() {
    var windowManager = getWindowManager();
    if (windowManager && windowManager.getFocusedDesktopWindowPreset) {
      return windowManager.getFocusedDesktopWindowPreset();
    }
    var focused = getFocusedDesktopWindowElement();
    if (!focused) return "";
    return focused.getAttribute("data-wm-preset") || "";
  }

  function getRouteWindowPresetForUrl() {
    var focused = getFocusedDesktopWindowElement();
    var presetName;
    if (!focused) return "";
    if (focused.classList.contains("os-window--minimized")) {
      return "";
    }
    presetName = focused.getAttribute("data-wm-preset") || "";
    return normalizeRouteWindowPreset(presetName);
  }

  function setGameUrlLink(gameId, enabled, useReplace) {
    if (!isWebMode() || !gameId) return;
    if (enabled) {
      setLocationRoute(ROUTE_WINDOW_EXTRAS_GAMES, gameId, useReplace === true);
      return;
    }
    if (readRouteFromLocation().tab === gameId) {
      setLocationRoute(ROUTE_WINDOW_EXTRAS_GAMES, "", true);
    }
  }

  function getTabForFocusedWindow(windowPreset) {
    if (!windowPreset || !windowSupportsTabParam(windowPreset)) {
      return "";
    }
    if (windowPreset === "settings-content") {
      if (window.WebSettings && window.WebSettings.getActiveTabId) {
        return window.WebSettings.getActiveTabId() || "";
      }
      return "";
    }
    if (window.WebExtras && window.WebExtras.getTabForRoute) {
      return window.WebExtras.getTabForRoute(windowPreset) || "";
    }
    return "";
  }

  function applyTabForWindow(windowPreset, tabValue) {
    if (!tabValue || !windowPreset) return;
    if (windowPreset === "settings-content") {
      if (window.WebSettings && window.WebSettings.setActiveTab) {
        window.WebSettings.setActiveTab(tabValue);
      }
      return;
    }
    if (window.WebExtras && window.WebExtras.applyTabForRoute) {
      window.WebExtras.applyTabForRoute(windowPreset, tabValue);
    }
  }

  function applyWindowPresetFromRoute(presetName, tabValue) {
    if (!isWebMode()) {
      return false;
    }
    if (!presetName || !isValidDesktopWindowPreset(presetName)) {
      return false;
    }
    var windowManager = getWindowManager();
    if (!windowManager || !windowManager.openDesktopWindowFromRoute) {
      return false;
    }
    if (tabValue && window.WebExtras && window.WebExtras.prepareRouteTab) {
      window.WebExtras.prepareRouteTab(presetName, tabValue);
    }
    if (windowManager.setRouteBootDesktopVisibility) {
      windowManager.setRouteBootDesktopVisibility(presetName);
    }
    if (!windowManager.openDesktopWindowFromRoute(presetName)) {
      return false;
    }
    if (window.WebDesktop && window.WebDesktop.openWindow) {
      window.WebDesktop.openWindow(presetName, false);
    }
    if (tabValue && presetName === ROUTE_WINDOW_EXTRAS_GAME) {
      applyTabForWindow(presetName, tabValue);
    } else if (tabValue && presetName !== ROUTE_WINDOW_EXTRAS_GAMES) {
      applyTabForWindow(presetName, tabValue);
    }
    if (tabValue && presetName === ROUTE_WINDOW_EXTRAS_GAMES && window.WebExtras && window.WebExtras.applyPendingRouteTab) {
      window.WebExtras.applyPendingRouteTab(presetName);
    }
    if (tabValue && window.WebExtras && window.WebExtras.focusActiveGamePlayWindow) {
      window.WebExtras.focusActiveGamePlayWindow();
    }
    return true;
  }

  function syncRouteFromFocusedWindow(useReplace) {
    if (!isWebMode() || applyingRoute || !routeBootComplete) return;
    var windowPreset = getRouteWindowPresetForUrl();
    var tabValue = getTabForFocusedWindow(windowPreset);
    setLocationRoute(windowPreset, tabValue, useReplace === true);
  }

  function bootRouteFromLocation() {
    if (!isWebMode()) return;
    var presetName = initialRouteWindow || parseWindowPresetFromLocation();
    var tabValue = initialRouteTab || parseTabFromLocation();
    if (!presetName) {
      routeBootComplete = true;
      syncRouteFromFocusedWindow(true);
      return;
    }
    if (!isValidDesktopWindowPreset(presetName)) {
      routeBootComplete = true;
      setLocationRoute("", "", true);
      return;
    }
    applyingRoute = true;
    applyWindowPresetFromRoute(presetName, tabValue);
    applyingRoute = false;
    routeBootComplete = true;
    setLocationRoute(presetName, getRouteTabForUrl(presetName, tabValue), true);
  }

  function getRouteTabForUrl(windowPreset, requestedTab) {
    var syncedTab = getTabForFocusedWindow(windowPreset);
    if (syncedTab) {
      return syncedTab;
    }
    return requestedTab || "";
  }

  function onLocationRouteChange() {
    if (!isWebMode() || applyingRoute) return;
    var route = readRouteFromLocation();
    var presetName = route.window;
    var tabValue = route.tab;
    applyingRoute = true;
    if (presetName && isValidDesktopWindowPreset(presetName)) {
      applyWindowPresetFromRoute(presetName, tabValue);
      setLocationRoute(presetName, getRouteTabForUrl(presetName, tabValue), true);
    } else {
      setLocationRoute("", "", true);
    }
    applyingRoute = false;
    routeBootComplete = true;
    if (!presetName) {
      syncRouteFromFocusedWindow(true);
    }
  }

  function isApplyingRoute() {
    return applyingRoute;
  }

  if (isWebMode()) {
    captureInitialRouteFromLocation();
  }

  window.WebMenuRoute = {
    isWebMode: isWebMode,
    isApplyingRoute: isApplyingRoute,
    parseWindowPresetFromLocation: parseWindowPresetFromLocation,
    parseTabFromLocation: parseTabFromLocation,
    getInitialWindowPreset: function () {
      if (!isWebMode()) {
        return "";
      }
      return initialRouteWindow;
    },
    getInitialTab: function () {
      if (!isWebMode()) {
        return "";
      }
      return initialRouteTab;
    },
    applyWindowPresetFromRoute: applyWindowPresetFromRoute,
    syncFromFocusedWindow: syncRouteFromFocusedWindow,
    setGameUrlLink: setGameUrlLink
  };

  window.addEventListener("popstate", onLocationRouteChange);
  window.addEventListener("web-desktop-window-focused", function () {
    syncRouteFromFocusedWindow(false);
  });
  window.addEventListener("web-settings-tab-changed", function () {
    syncRouteFromFocusedWindow(false);
  });
  window.addEventListener("web-extras-route-changed", function () {
    if (applyingRoute) return;
    syncRouteFromFocusedWindow(false);
  });
  window.addEventListener("web-desktop-windows-restored", bootRouteFromLocation);
  window.addEventListener("web-desktop-icons-ready", function () {
    if (window.WebExtras && window.WebExtras.refreshGameDesktopLinkSwitch) {
      window.WebExtras.refreshGameDesktopLinkSwitch();
    }
  });
  window.addEventListener("web-desktop-game-icons-restored", function () {
    if (window.WebExtras && window.WebExtras.refreshGameDesktopLinkSwitch) {
      window.WebExtras.refreshGameDesktopLinkSwitch();
    }
  });
})();
