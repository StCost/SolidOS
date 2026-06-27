(function () {
  function getAssetBase() {
    if (window.vuplex) return "";
    var protocol = window.location.protocol || "";
    if (protocol !== "http:" && protocol !== "https:") return "";
    var path = window.location.pathname || "/";
    if (path.endsWith("/")) return path;
    var tail = path.slice(path.lastIndexOf("/") + 1);
    if (tail.indexOf(".") >= 0) return path.slice(0, path.lastIndexOf("/") + 1);
    return path + "/";
  }

  window.TradingTerminalAssetBase = getAssetBase();

  function loadStylesheet(href) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src, onload) {
    var script = document.createElement("script");
    script.src = src;
    script.onload = onload;
    script.onerror = onload;
    document.head.appendChild(script);
  }

  var base = window.TradingTerminalAssetBase;
  loadStylesheet(base + "trading-terminal.css");

  var scriptQueue = [
    base + "../Web Main Menu/menu-locale.js",
    base + "../Web Main Menu/menu-locale-loader.js",
    base + "trading-terminal-ui-sounds.js",
    base + "trading-terminal-mock.js",
    base + "trading-terminal.js"
  ];

  function loadScriptAtIndex(index) {
    if (index >= scriptQueue.length) return;
    loadScript(scriptQueue[index], function () {
      loadScriptAtIndex(index + 1);
    });
  }

  loadScriptAtIndex(0);
})();
