(function () {
  var CREDIT_ROW_KEYS = [
    "credits.stcost",
    "credits.sttaya"
  ];

  var CREDIT_STACK_KEYS = [
    "credits.rest",
    "credits.tech"
  ];

  var PAGE_CREDITS = "credits";
  var CREDITS_CONTENT_ID = "creditsContent";
  var CREDITS_PLACEHOLDER_WEB = "Credits preview is unavailable in web mode.";
  var CREDITS_LOADING_FALLBACK = "Loading credits...";

  function isGameMode() {
    if (window.WebMenuMode === "game") return true;
    var device = document.getElementById("device");
    return !!device && device.classList.contains("menu-mode--game");
  }

  function isCreditsPageVisible() {
    if (window.WebMenu && window.WebMenu.isPageVisible) {
      if (window.WebMenu.isPageVisible(PAGE_CREDITS)) return true;
    }
    var creditsWindows = document.querySelectorAll('.os-window[data-wm-preset="credits-content"]');
    if (creditsWindows.length > 0) return true;
    return false;
  }

  function getLocalized(key, fallback) {
    if (window.WebLocale) {
      return window.WebLocale.get(key, fallback);
    }
    if (fallback != null) return fallback;
    return key || "";
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function stripRichTextTags(text) {
    if (!text) return "";
    var plainText = text;
    plainText = plainText.replace(/<color=[^>]*>/gi, "");
    plainText = plainText.replace(/<\/color>/gi, "");
    return plainText;
  }

  function formatCreditsBlock(text) {
    var plainText = stripRichTextTags(text);
    var lines = plainText.split("\n");
    var html = "";
    var index;
    for (index = 0; index < lines.length; index++) {
      var line = lines[index];
      if (line === "") continue;
      var lineClass = index === 0 ? "credits-line credits-line--title" : "credits-line";
      html += '<div class="' + lineClass + '">' + escapeHtml(line) + "</div>";
    }

    return html;
  }

  function hasCreditStrings() {
    var index;
    var allKeys = CREDIT_ROW_KEYS.concat(CREDIT_STACK_KEYS);
    for (index = 0; index < allKeys.length; index++) {
      var blockText = getLocalized(allKeys[index], "");
      if (blockText) return true;
    }
    return false;
  }

  function setMessage(contentRoot, message) {
    contentRoot.innerHTML =
      '<div class="credits-block credits-block--message">' + escapeHtml(message) + "</div>";
  }

  function buildCreditsBlockHtml(key) {
    var blockText = getLocalized(key, "");
    if (!blockText) return "";
    return '<div class="credits-block">' + formatCreditsBlock(blockText) + "</div>";
  }

  function renderIntoWindow(windowElement) {
    if (!windowElement) {
      renderCredits();
      return;
    }
    var contentRoot = windowElement.querySelector("#" + CREDITS_CONTENT_ID);
    if (!contentRoot) {
      contentRoot = windowElement.querySelector('[id^="creditsContent"]');
    }
    if (!contentRoot) return;
    renderCreditsIntoRoot(contentRoot);
  }

  function renderCreditsIntoRoot(contentRoot) {
    if (!contentRoot) return;

    if (!hasCreditStrings()) {
      if (isGameMode()) {
        setMessage(contentRoot, getLocalized("web.credits.loading", CREDITS_LOADING_FALLBACK));
      } else {
        setMessage(contentRoot, getLocalized("web.credits.placeholder", CREDITS_PLACEHOLDER_WEB));
      }
      return;
    }

    var html = "";
    var rowHtml = "";
    var index;

    for (index = 0; index < CREDIT_ROW_KEYS.length; index++) {
      rowHtml += buildCreditsBlockHtml(CREDIT_ROW_KEYS[index]);
    }

    if (rowHtml) {
      html += '<div class="credits-row">' + rowHtml + "</div>";
    }

    var stackHtml = "";
    for (index = 0; index < CREDIT_STACK_KEYS.length; index++) {
      stackHtml += buildCreditsBlockHtml(CREDIT_STACK_KEYS[index]);
    }

    if (stackHtml) {
      html += '<div class="credits-stack">' + stackHtml + "</div>";
    }

    contentRoot.innerHTML = html;
  }

  function renderCredits() {
    var openWindows = document.querySelectorAll(
      '.os-window[data-wm-preset="credits-content"]'
    );
    var index = 0;
    if (openWindows.length) {
      for (index = 0; index < openWindows.length; index++) {
        renderIntoWindow(openWindows[index]);
      }
      return;
    }
    var contentRoot = document.getElementById(CREDITS_CONTENT_ID);
    if (!contentRoot) return;
    if (!isCreditsPageVisible()) return;
    renderCreditsIntoRoot(contentRoot);
  }

  function onPageChanged(event) {
    var detail = event.detail;
    if (!detail || detail.pageId !== PAGE_CREDITS) return;
    renderCredits();
  }

  window.addEventListener("web-locale-applied", renderCredits);
  window.addEventListener("web-page-changed", onPageChanged);

  window.WebCredits = {
    renderCredits: renderCredits,
    renderIntoWindow: renderIntoWindow
  };
})();
