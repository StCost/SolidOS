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
  var layouts = payload && payload.layouts ? payload.layouts : [];
  if (!layouts.length || !window.WebMenuLayoutCoords) return;

  window.__cmWmLayoutsPayload = payload;

  var cssRules = [];
  var index = 0;
  for (index = 0; index < layouts.length; index++) {
    var entry = layouts[index];
    var presetSelector;
    var width;
    var height;
    if (!entry || !entry.preset) continue;
    if (!window.WebMenuLayoutCoords.isCenterLayoutEntry(entry)) continue;
    if (entry.width === undefined || entry.height === undefined) continue;
    presetSelector = escapePresetSelector(entry.preset);
    width = Math.round(entry.width);
    height = Math.round(entry.height);
    cssRules.push(
      "html." +
        HTML_BOOTSTRAP_CLASS +
        ' .os-window[data-wm-preset="' +
        presetSelector +
        '"]{' +
        window.WebMenuLayoutCoords.buildCenterCssPosition(entry) +
        "width:" +
        width +
        "px;height:" +
        height +
        "px;bottom:auto;right:auto;transform:none;margin:0;}"
    );
  }

  if (!cssRules.length) return;

  cssRules.push(
    "html." + HTML_BOOTSTRAP_CLASS + " .os-window[data-wm-preset]{visibility:hidden}"
  );

  document.documentElement.classList.add(HTML_BOOTSTRAP_CLASS);

  var styleElement = document.createElement("style");
  styleElement.id = STYLE_ELEMENT_ID;
  styleElement.textContent = cssRules.join("");
  document.head.appendChild(styleElement);
})();
