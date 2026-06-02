(function () {
  var clockElements = document.getElementsByClassName("os-clock");
  if (clockElements.length === 0) return;

  function padTimePart(value) {
    if (value < 10) return "0" + String(value);
    return String(value);
  }

  function setClockText() {
    var now = new Date();
    var hours = padTimePart(now.getHours());
    var minutes = padTimePart(now.getMinutes());
    var seconds = padTimePart(now.getSeconds());
    var clockText = hours + ":" + minutes + ":" + seconds;
    var index = 0;
    for (index = 0; index < clockElements.length; index++) {
      clockElements[index].textContent = clockText;
    }
  }

  setClockText();
  window.setInterval(setClockText, 1000);
})();

var WebMenu = (function () {
  var PAGE_MENU = "menu";
  var PAGE_START = "start";
  var PAGE_SETTINGS = "settings";
  var PAGE_CREDITS = "credits";
  var PAGE_EXTRAS = "extras";

  var pauseInputHandling = false;

  var pageMenu = document.getElementById("pageMenu");
  var currentLogicalPageId = PAGE_MENU;

  function getLocaleText(key, fallback) {
    if (window.WebLocale) {
      return window.WebLocale.get(key, fallback);
    }
    return fallback;
  }

  function dispatchMenuEvent(eventName, detail) {
    var payload = detail;
    if (!payload) payload = {};
    window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
  }

  function trimValue(value) {
    if (!value) return "";
    return value.replace(/^\s+|\s+$/g, "");
  }

  function getCurrentPageId() {
    return currentLogicalPageId;
  }

  function showPage(pageId) {
    if (!pageMenu) return;

    pageMenu.hidden = false;
    currentLogicalPageId = pageId;

    if (window.WebLocale) {
      window.WebLocale.applyDom();
    }

    if (window.WebWindowManager && pageId === PAGE_MENU) {
      WebWindowManager.activatePage(pageMenu);
    }

    dispatchMenuEvent("web-page-changed", { pageId: pageId });
  }

  function goToIndexPage() {
    showPage(PAGE_MENU);
    if (window.WebDesktop && window.WebDesktop.showDesktopHome) {
      window.WebDesktop.showDesktopHome();
    }
  }

  function goToStartPage() {
    showPage(PAGE_START);
    if (window.WebDesktop && window.WebDesktop.openStartDesktop) {
      window.WebDesktop.openStartDesktop();
    }
  }

  function goToSettingsPage() {
    showPage(PAGE_SETTINGS);
    if (window.WebDesktop && window.WebDesktop.openSettingsDesktop) {
      window.WebDesktop.openSettingsDesktop();
    }
  }

  function goToCreditsPage() {
    showPage(PAGE_CREDITS);
    if (window.WebDesktop && window.WebDesktop.openCreditsDesktop) {
      window.WebDesktop.openCreditsDesktop();
    }
  }

  function goToExtrasPage() {
    showPage(PAGE_EXTRAS);
    if (window.WebDesktop && window.WebDesktop.openExtrasDesktop) {
      window.WebDesktop.openExtrasDesktop();
    }
    if (window.WebExtras && window.WebExtras.renderExtras) {
      window.WebExtras.renderExtras();
    }
  }

  function isPageVisible(pageId) {
    return currentLogicalPageId === pageId;
  }

  function isIndexPageVisible() {
    return isPageVisible(PAGE_MENU);
  }

  function handleGamePauseInput() {
    if (pauseInputHandling) return;
    pauseInputHandling = true;

    var currentPageId = getCurrentPageId();
    if (currentPageId === PAGE_EXTRAS) {
      if (window.WebExtras && window.WebExtras.handleEscape()) {
        pauseInputHandling = false;
        return;
      }
      goToIndexPage();
      pauseInputHandling = false;
      return;
    }

    if (
      currentPageId === PAGE_SETTINGS ||
      currentPageId === PAGE_START ||
      currentPageId === PAGE_CREDITS
    ) {
      goToIndexPage();
      pauseInputHandling = false;
      return;
    }

    if (currentPageId === PAGE_MENU) {
      dispatchMenuEvent("web-start", {});
    }

    pauseInputHandling = false;
  }

  showPage(PAGE_MENU);

  return {
    PAGE_MENU: PAGE_MENU,
    PAGE_START: PAGE_START,
    PAGE_SETTINGS: PAGE_SETTINGS,
    PAGE_CREDITS: PAGE_CREDITS,
    PAGE_EXTRAS: PAGE_EXTRAS,
    dispatchMenuEvent: dispatchMenuEvent,
    trimValue: trimValue,
    goToIndexPage: goToIndexPage,
    goToStartPage: goToStartPage,
    goToSettingsPage: goToSettingsPage,
    goToCreditsPage: goToCreditsPage,
    goToExtrasPage: goToExtrasPage,
    isPageVisible: isPageVisible,
    isIndexPageVisible: isIndexPageVisible,
    getCurrentPageId: getCurrentPageId,
    handleGamePauseInput: handleGamePauseInput
  };
})();

function flushMenuDesktopLayoutsBeforeLeave() {
  if (window.WebWindowManager && window.WebWindowManager.flushLayoutsSave) {
    window.WebWindowManager.flushLayoutsSave();
  }
  if (window.WebDesktop && window.WebDesktop.flushIconLayoutsSave) {
    window.WebDesktop.flushIconLayoutsSave();
  }
}

window.addEventListener("beforeunload", flushMenuDesktopLayoutsBeforeLeave);
window.addEventListener("pagehide", flushMenuDesktopLayoutsBeforeLeave);
