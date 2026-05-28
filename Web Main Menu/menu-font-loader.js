(function () {
  var HTML_LOADING_CLASS = "cm-fonts-loading";
  var HTML_READY_CLASS = "cm-fonts-ready";
  var FONT_FAMILY_MAIN = "IBM3270";
  var LOAD_TIMEOUT_MS = 4000;

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function markReady() {
    document.documentElement.classList.remove(HTML_LOADING_CLASS);
    document.documentElement.classList.add(HTML_READY_CLASS);
  }

  function ensureLoadingClass() {
    document.documentElement.classList.add(HTML_LOADING_CLASS);
    document.documentElement.classList.remove(HTML_READY_CLASS);
  }

  if (isUnityHost()) {
    return;
  }

  if (!document.fonts || !document.fonts.load) {
    return;
  }

  ensureLoadingClass();

  var timeoutId = window.setTimeout(function () {
    markReady();
  }, LOAD_TIMEOUT_MS);

  document.fonts
    .load('16px "' + FONT_FAMILY_MAIN + '"')
    .then(function () {
      return document.fonts.ready;
    })
    .then(function () {
      window.clearTimeout(timeoutId);
      markReady();
    })
    .catch(function () {
      window.clearTimeout(timeoutId);
      markReady();
    });
})();

