(function () {
  var STORAGE_KEY = "cm-notepad-pages";
  var LOCALE_KEY_BRAND = "web.game.notepad.brand";
  var LOCALE_KEY_TITLE = "web.game.notepad.title";
  var LOCALE_KEY_PLACEHOLDER = "web.game.notepad.placeholder";

  var LINE_HEIGHT_PX = 24;
  var SAVE_DEBOUNCE_MS = 350;
  var RESIZE_SETTLE_MS = 80;

  var scrollViewport = document.getElementById("notepadScroll");
  var notepadSheet = document.getElementById("notepadSheet");
  var bodyInput = document.getElementById("bodyInput");
  var notepadBrand = document.getElementById("notepadBrand");
  var notepadTitle = document.getElementById("notepadTitle");
  var notepadShell = document.getElementById("notepadShell");

  var saveTimer = 0;
  var resizeTimer = 0;

  function getSynth() {
    return window.WebExtrasGameSynthAudio;
  }

  function getLocalized(key, fallback) {
    if (window.WebLocale && window.WebLocale.get) {
      return window.WebLocale.get(key, fallback);
    }
    return fallback;
  }

  function applyLocaleLabels() {
    if (notepadBrand) {
      notepadBrand.textContent = getLocalized(LOCALE_KEY_BRAND, "INDUSTRIAL FIELD LOG");
    }
    if (notepadTitle) {
      notepadTitle.textContent = getLocalized(LOCALE_KEY_TITLE, "NOTEPAD");
    }
    if (bodyInput) {
      bodyInput.placeholder = getLocalized(LOCALE_KEY_PLACEHOLDER, "Record field notes...");
    }
  }

  function loadStoredBody() {
    try {
      var rawValue = localStorage.getItem(STORAGE_KEY);
      if (!rawValue) {
        return "";
      }
      var parsedValue = JSON.parse(rawValue);
      if (!parsedValue) {
        return "";
      }
      if (parsedValue.body != null) {
        return parsedValue.body;
      }
      if (parsedValue.pages && parsedValue.pages.length) {
        return parsedValue.pages.join("\n");
      }
    } catch (error) {
    }
    return "";
  }

  function saveNow() {
    if (!bodyInput) {
      return;
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          body: bodyInput.value
        })
      );
    } catch (error) {
    }
  }

  function scheduleSave() {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(function () {
      saveTimer = 0;
      saveNow();
      if (getSynth()) {
        getSynth().playUiClick();
      }
    }, SAVE_DEBOUNCE_MS);
  }

  function getMinimumSheetHeight() {
    if (!scrollViewport) {
      return LINE_HEIGHT_PX * 28;
    }
    var viewportHeight = scrollViewport.clientHeight;
    var paddingOffset = 24;
    if (viewportHeight > paddingOffset) {
      return viewportHeight - paddingOffset;
    }
    return LINE_HEIGHT_PX * 28;
  }

  function syncSheetHeight() {
    if (!bodyInput || !notepadSheet) {
      return;
    }

    bodyInput.style.height = "0";

    var contentHeight = bodyInput.scrollHeight;
    var sheetHeight = Math.max(contentHeight, getMinimumSheetHeight());
    var heightValue = sheetHeight + "px";

    bodyInput.style.height = heightValue;
    notepadSheet.style.minHeight = heightValue;
  }

  function scheduleSyncSheetHeight() {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(function () {
      resizeTimer = 0;
      syncSheetHeight();
    }, RESIZE_SETTLE_MS);
  }

  function onInput() {
    syncSheetHeight();
    scheduleSave();
  }

  function isPrintableKey(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return false;
    }
    if (event.key && event.key.length === 1) {
      return true;
    }
    return false;
  }

  function onKeyDown(event) {
    if (!isPrintableKey(event)) {
      return;
    }
    if (getSynth()) {
      getSynth().playKeyType();
    }
  }

  function setLayoutVariables() {
    if (!notepadShell) {
      return;
    }
    notepadShell.style.setProperty("--notepad-line-height", LINE_HEIGHT_PX + "px");
  }

  function init() {
    if (!bodyInput) {
      return;
    }

    setLayoutVariables();
    bodyInput.value = loadStoredBody();
    applyLocaleLabels();
    syncSheetHeight();

    bodyInput.addEventListener("input", onInput);
    bodyInput.addEventListener("keydown", onKeyDown);

    window.addEventListener("resize", scheduleSyncSheetHeight);
    window.addEventListener("web-locale-applied", function () {
      applyLocaleLabels();
      syncSheetHeight();
    });
    window.addEventListener("beforeunload", saveNow);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
