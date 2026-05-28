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
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  if (isUnityHost()) return;

  var payload = readLayoutsPayload();
  var layouts = payload && payload.layouts ? payload.layouts : [];
  if (!layouts.length) return;

  window.__cmWmLayoutsPayload = payload;

  var cssRules = [];
  var index = 0;
  for (index = 0; index < layouts.length; index++) {
    var entry = layouts[index];
    if (!entry || !entry.preset) continue;

    var presetSelector = escapePresetSelector(entry.preset);
    cssRules.push(
      "html." +
        HTML_BOOTSTRAP_CLASS +
        ' .os-window[data-wm-preset="' +
        presetSelector +
        '"]{left:' +
        Math.round(entry.left) +
        "px!important;top:" +
        Math.round(entry.top) +
        "px!important;width:" +
        Math.round(entry.width) +
        "px!important;height:" +
        Math.round(entry.height) +
        "px!important;bottom:auto!important;right:auto!important;transform:none!important;margin:0!important;}"
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
