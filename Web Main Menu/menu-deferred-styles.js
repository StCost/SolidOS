(function () {
  var PRESET_STYLE_PATHS = {
    "menu-splash": ["menu-title-fx.css"],
    "settings-content": ["settings-menu.css"],
    "credits-content": ["credits-menu.css"],
    "extras-games": ["extras-menu.css"],
    "extras-art": ["extras-menu.css"],
    "extras-links": ["extras-menu.css"],
    "extras-game": ["extras-menu.css"],
    "web-fake-connect-demo": ["menu-web-fake-connect-demo.css"]
  };

  var LAYER_STYLE_PATHS = {
    hud: ["menu-game-hud.css"],
    hints: ["menu-new-player-hints.css"]
  };

  var loadedStylePaths = {};
  var loadingStyleCallbacks = {};

  function getExistingStylesheet(href) {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    var index;
    for (index = 0; index < links.length; index += 1) {
      if (links[index].href && links[index].href.indexOf(href) !== -1) {
        return links[index];
      }
    }
    return null;
  }

  function runAfterStylesApplied(onReady) {
    if (!onReady) return;
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(onReady);
      });
      return;
    }
    window.setTimeout(onReady, 0);
  }

  function runStylesheetCallbacks(href) {
    var callbacks = loadingStyleCallbacks[href];
    var index;
    if (!callbacks || !callbacks.length) return;
    delete loadingStyleCallbacks[href];
    for (index = 0; index < callbacks.length; index += 1) {
      callbacks[index]();
    }
  }

  function ensureStylesheet(href, onReady) {
    var loadSettled = false;
    function markStylesheetReady() {
      if (loadSettled) return;
      loadSettled = true;
      loadedStylePaths[href] = true;
      runAfterStylesApplied(function () {
        runStylesheetCallbacks(href);
      });
    }
    if (loadedStylePaths[href]) {
      if (onReady) runAfterStylesApplied(onReady);
      return;
    }
    if (getExistingStylesheet(href)) {
      loadedStylePaths[href] = true;
      if (onReady) runAfterStylesApplied(onReady);
      return;
    }
    if (onReady) {
      if (!loadingStyleCallbacks[href]) {
        loadingStyleCallbacks[href] = [];
      }
      loadingStyleCallbacks[href].push(onReady);
      if (loadingStyleCallbacks[href].length > 1) {
        return;
      }
    }
    var linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = href;
    linkElement.onload = markStylesheetReady;
    linkElement.onerror = markStylesheetReady;
    document.head.appendChild(linkElement);
    window.setTimeout(markStylesheetReady, 3000);
  }

  function ensureStylesheets(paths, onReady) {
    var pendingCount = 0;
    var index;
    var path;
    if (!paths || !paths.length) {
      if (onReady) runAfterStylesApplied(onReady);
      return;
    }
    function onPathReady() {
      pendingCount -= 1;
      if (pendingCount <= 0 && onReady) {
        runAfterStylesApplied(onReady);
      }
    }
    for (index = 0; index < paths.length; index += 1) {
      path = paths[index];
      if (loadedStylePaths[path] || getExistingStylesheet(path)) {
        loadedStylePaths[path] = true;
        continue;
      }
      pendingCount += 1;
      ensureStylesheet(path, onPathReady);
    }
    if (pendingCount <= 0 && onReady) {
      runAfterStylesApplied(onReady);
    }
  }

  function getPresetStylePaths(presetName) {
    if (!presetName) return [];
    if (!PRESET_STYLE_PATHS[presetName]) return [];
    return PRESET_STYLE_PATHS[presetName];
  }

  function ensureForPreset(presetName, onReady) {
    ensureStylesheets(getPresetStylePaths(presetName), onReady);
  }

  function ensureForPresets(presetNames, onReady) {
    var paths = [];
    var seenPaths = {};
    var index;
    var presetIndex;
    var presetName;
    var presetPaths;
    var pathIndex;
    var path;
    if (!presetNames || !presetNames.length) {
      if (onReady) onReady();
      return;
    }
    for (presetIndex = 0; presetIndex < presetNames.length; presetIndex += 1) {
      presetName = presetNames[presetIndex];
      presetPaths = getPresetStylePaths(presetName);
      for (pathIndex = 0; pathIndex < presetPaths.length; pathIndex += 1) {
        path = presetPaths[pathIndex];
        if (seenPaths[path]) continue;
        seenPaths[path] = true;
        paths.push(path);
      }
    }
    ensureStylesheets(paths, onReady);
  }

  function getVisibleDesktopWindowPresets() {
    var desktopSurface = document.getElementById("desktopSurface");
    var windows;
    var presets = [];
    var index;
    var windowElement;
    var presetName;
    if (!desktopSurface) return presets;
    windows = desktopSurface.querySelectorAll(".os-window[data-wm-preset]");
    for (index = 0; index < windows.length; index += 1) {
      windowElement = windows[index];
      if (windowElement.classList.contains("os-window--closed")) continue;
      presetName = windowElement.getAttribute("data-wm-preset") || "";
      if (!presetName) continue;
      presets.push(presetName);
    }
    return presets;
  }

  function preloadVisibleDesktopWindowStyles(onReady) {
    ensureForPresets(getVisibleDesktopWindowPresets(), onReady);
  }

  function ensureForLayer(layerName, onReady) {
    if (!layerName || !LAYER_STYLE_PATHS[layerName]) {
      if (onReady) runAfterStylesApplied(onReady);
      return;
    }
    ensureStylesheets(LAYER_STYLE_PATHS[layerName], onReady);
  }

  window.WebMenuDeferredStyles = {
    ensureForPreset: ensureForPreset,
    ensureForPresets: ensureForPresets,
    preloadVisibleDesktopWindowStyles: preloadVisibleDesktopWindowStyles,
    ensureForLayer: ensureForLayer
  };

  function initBootStyles() {
    var splashWindow = document.querySelector('#desktopSurface .os-window[data-wm-preset="menu-splash"]');
    if (!splashWindow) return;
    if (splashWindow.classList.contains("os-window--closed")) return;
    ensureForPreset("menu-splash");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBootStyles);
  } else {
    initBootStyles();
  }
})();
