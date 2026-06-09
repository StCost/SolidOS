(function () {
  var STORAGE_KEY = "cm-menu-window-layouts";
  var STYLE_ELEMENT_ID = "cm-wm-layout-bootstrap";
  var HTML_BOOTSTRAP_CLASS = "menu-wm-layout-bootstrap";

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function escapePresetSelector(presetName) {
    return presetName.split("\\").join("\\\\").split('"').join("\\\"");
  }

  function isSavedLayoutOpen(entry) {
    if (!entry) return false;
    if (entry.open === false || entry.open === 0) return false;
    if (entry.open === true || entry.open === 1) return true;
    return true;
  }

  function shouldPresetBeOpenByDefault(presetName) {
    if (presetName === "menu-splash") return true;
    return false;
  }

  function getPersistedEntryForPreset(presetName) {
    var index = 0;
    for (index = 0; index < persistedLayouts.length; index++) {
      if (persistedLayouts[index] && persistedLayouts[index].preset === presetName) {
        return persistedLayouts[index];
      }
    }
    return null;
  }

  function shouldPresetBeOpen(presetName) {
    var persistedEntry = getPersistedEntryForPreset(presetName);
    if (persistedEntry && persistedEntry.open !== undefined) {
      return isSavedLayoutOpen(persistedEntry);
    }
    return shouldPresetBeOpenByDefault(presetName);
  }

  function buildOpenStateCssRule(presetName, shouldOpen) {
    var presetSelector = escapePresetSelector(presetName);
    if (!shouldOpen) {
      return (
        "html." +
        HTML_BOOTSTRAP_CLASS +
        ' .os-window[data-wm-preset="' +
        presetSelector +
        '"]{visibility:hidden!important;pointer-events:none!important;opacity:0!important;}'
      );
    }
    return (
      "html." +
      HTML_BOOTSTRAP_CLASS +
      ' .os-window[data-wm-preset="' +
      presetSelector +
      '"].os-window--closed{visibility:visible!important;pointer-events:auto!important;opacity:1!important;}'
    );
  }

  function readLayoutsPayload() {
    if (window.__cmWmLayoutsPayload) {
      return window.__cmWmLayoutsPayload;
    }
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  var payload = readLayoutsPayload();
  var persistedLayouts = payload && payload.layouts ? payload.layouts : [];
  if (!window.WebMenuLayoutCoords) return;

  if (payload) {
    window.__cmWmLayoutsPayload = payload;
  }

  var defaultWindowLayouts = {
    "menu-splash": {
      anchor: "center",
      centerOffsetX: -475,
      centerOffsetY: -210,
      width: 950,
      height: 420
    },
    "connect-col-0": {
      anchor: "center",
      centerOffsetX: -210,
      centerOffsetY: -260,
      width: 420,
      height: 520
    },
    "connect-col-1": {
      anchor: "center",
      centerOffsetX: -210,
      centerOffsetY: -260,
      width: 420,
      height: 520
    },
    "connect-col-2": {
      anchor: "center",
      centerOffsetX: -210,
      centerOffsetY: -240,
      width: 420,
      height: 480
    },
    "settings-content": {
      anchor: "center",
      centerOffsetX: -460,
      centerOffsetY: -320,
      width: 920,
      height: 640
    },
    "extras-games": {
      anchor: "center",
      centerOffsetX: -360,
      centerOffsetY: -310,
      width: 720,
      height: 620
    },
    "extras-art": {
      anchor: "center",
      centerOffsetX: -280,
      centerOffsetY: -280,
      width: 560,
      height: 560
    },
    "extras-links": {
      anchor: "center",
      centerOffsetX: -260,
      centerOffsetY: -210,
      width: 520,
      height: 420
    },
    "credits-content": {
      anchor: "center",
      centerOffsetX: -320,
      centerOffsetY: -260,
      width: 640,
      height: 520
    }
  };

  var mergedLayouts = [];
  var presetName;
  var mergedEntry;
  var overlayEntry;
  var overlayIndex;
  for (presetName in defaultWindowLayouts) {
    if (!Object.prototype.hasOwnProperty.call(defaultWindowLayouts, presetName)) {
      continue;
    }
    mergedEntry = defaultWindowLayouts[presetName];
    for (overlayIndex = 0; overlayIndex < persistedLayouts.length; overlayIndex++) {
      overlayEntry = persistedLayouts[overlayIndex];
      if (!overlayEntry || overlayEntry.preset !== presetName) continue;
      if (overlayEntry.centerOffsetX !== undefined) {
        mergedEntry.centerOffsetX = overlayEntry.centerOffsetX;
      }
      if (overlayEntry.centerOffsetY !== undefined) {
        mergedEntry.centerOffsetY = overlayEntry.centerOffsetY;
      }
      if (overlayEntry.width !== undefined) mergedEntry.width = overlayEntry.width;
      if (overlayEntry.height !== undefined) mergedEntry.height = overlayEntry.height;
      break;
    }
    mergedLayouts.push({
      preset: presetName,
      anchor: mergedEntry.anchor,
      centerOffsetX: mergedEntry.centerOffsetX,
      centerOffsetY: mergedEntry.centerOffsetY,
      width: mergedEntry.width,
      height: mergedEntry.height
    });
  }

  for (overlayIndex = 0; overlayIndex < persistedLayouts.length; overlayIndex++) {
    overlayEntry = persistedLayouts[overlayIndex];
    if (!overlayEntry || !overlayEntry.preset) continue;
    if (defaultWindowLayouts[overlayEntry.preset]) continue;
    mergedLayouts.push(overlayEntry);
  }

  if (!mergedLayouts.length) return;

  var cssRules = [];
  var index = 0;
  for (index = 0; index < mergedLayouts.length; index++) {
    var entry = mergedLayouts[index];
    var presetSelector;
    var width;
    var height;
    var sizeCss = "";
    if (!entry || !entry.preset) continue;
    if (!window.WebMenuLayoutCoords.isCenterLayoutEntry(entry)) continue;
    presetSelector = escapePresetSelector(entry.preset);
    if (entry.width !== undefined) {
      width = Math.round(entry.width);
      sizeCss += "width:" + width + "px;";
    }
    if (entry.height !== undefined) {
      height = Math.round(entry.height);
      sizeCss += "height:" + height + "px;";
    }
    cssRules.push(
      "html." +
        HTML_BOOTSTRAP_CLASS +
        ' .os-window[data-wm-preset="' +
        presetSelector +
        '"]{' +
        window.WebMenuLayoutCoords.buildCenterCssPosition(entry) +
        sizeCss +
        "bottom:auto;right:auto;transform:none;margin:0;}"
    );
  }

  for (presetName in defaultWindowLayouts) {
    if (!Object.prototype.hasOwnProperty.call(defaultWindowLayouts, presetName)) {
      continue;
    }
    cssRules.push(buildOpenStateCssRule(presetName, shouldPresetBeOpen(presetName)));
  }

  if (!cssRules.length) return;

  document.documentElement.classList.add(HTML_BOOTSTRAP_CLASS);

  var styleElement = document.createElement("style");
  styleElement.id = STYLE_ELEMENT_ID;
  styleElement.textContent = cssRules.join("");
  document.head.appendChild(styleElement);
})();
