(function () {
  var STORAGE_KEY = "cm-menu-icon-layouts";
  var STYLE_ELEMENT_ID = "cm-desktop-icon-layout-bootstrap";
  var HTML_BOOTSTRAP_CLASS = "menu-icon-layout-bootstrap";

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function escapeIconId(iconId) {
    return iconId.split("\\").join("\\\\").split('"').join("\\\"");
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

  window.__cmIconLayoutsPayload = payload;

  var cssRules = [];
  var index = 0;
  for (index = 0; index < layouts.length; index++) {
    var entry = layouts[index];
    if (!entry || !entry.iconId) continue;
    var iconSelector = escapeIconId(entry.iconId);
    cssRules.push(
      "html." +
        HTML_BOOTSTRAP_CLASS +
        ' .os-desktop-icon[data-desktop-icon="' +
        iconSelector +
        '"]{left:' +
        Math.round(entry.left) +
        "px!important;top:" +
        Math.round(entry.top) +
        "px!important;}"
    );
  }

  if (!cssRules.length) return;

  document.documentElement.classList.add(HTML_BOOTSTRAP_CLASS);

  var styleElement = document.createElement("style");
  styleElement.id = STYLE_ELEMENT_ID;
  styleElement.textContent = cssRules.join("");
  document.head.appendChild(styleElement);
})();
