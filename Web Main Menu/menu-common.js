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

  var pauseInputHandling = false;

  var pageMenu = document.getElementById("pageMenu");
  var pageStart = document.getElementById("pageStart");
  var pageSettings = document.getElementById("pageSettings");
  var pageCredits = document.getElementById("pageCredits");
  var statusModule = document.getElementById("osStatusModule");

  var STATUS_KEY_MENU = "web.status.shell";
  var STATUS_KEY_START = "web.status.conn-mgr";
  var STATUS_KEY_SETTINGS = "web.status.config";
  var STATUS_KEY_CREDITS = "web.status.credits";
  var STATUS_FALLBACK_MENU = "SHELL 2.4";
  var STATUS_FALLBACK_START = "conn_mgr.exe";
  var STATUS_FALLBACK_SETTINGS = "config.sys";
  var STATUS_FALLBACK_CREDITS = "credits.exe";

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

  function setStatusModule(localeKey, fallback) {
    if (!statusModule) return;
    statusModule.textContent = getLocaleText(localeKey, fallback);
  }

  function getPageElement(pageId) {
    if (pageId === PAGE_START) return pageStart;
    if (pageId === PAGE_SETTINGS) return pageSettings;
    if (pageId === PAGE_CREDITS) return pageCredits;
    return pageMenu;
  }

  function getCurrentPageId() {
    if (pageCredits && !pageCredits.hidden) return PAGE_CREDITS;
    if (pageSettings && !pageSettings.hidden) return PAGE_SETTINGS;
    if (pageStart && !pageStart.hidden) return PAGE_START;
    return PAGE_MENU;
  }

  function showPage(pageId) {
    if (!pageMenu || !pageStart || !pageSettings || !pageCredits) return;

    pageMenu.hidden = pageId !== PAGE_MENU;
    pageStart.hidden = pageId !== PAGE_START;
    pageSettings.hidden = pageId !== PAGE_SETTINGS;
    pageCredits.hidden = pageId !== PAGE_CREDITS;

    if (pageId === PAGE_MENU) setStatusModule(STATUS_KEY_MENU, STATUS_FALLBACK_MENU);
    else if (pageId === PAGE_START) setStatusModule(STATUS_KEY_START, STATUS_FALLBACK_START);
    else if (pageId === PAGE_SETTINGS) setStatusModule(STATUS_KEY_SETTINGS, STATUS_FALLBACK_SETTINGS);
    else if (pageId === PAGE_CREDITS) setStatusModule(STATUS_KEY_CREDITS, STATUS_FALLBACK_CREDITS);

    if (window.WebLocale) {
      window.WebLocale.applyDom();
    }

    if (window.WebWindowManager) {
      WebWindowManager.activatePage(getPageElement(pageId));
    }

    dispatchMenuEvent("web-page-changed", { pageId: pageId });
  }

  function goToIndexPage() {
    showPage(PAGE_MENU);
  }

  function goToStartPage() {
    showPage(PAGE_START);
  }

  function goToSettingsPage() {
    showPage(PAGE_SETTINGS);
  }

  function goToCreditsPage() {
    showPage(PAGE_CREDITS);
    if (window.WebCredits && window.WebCredits.renderCredits) {
      window.WebCredits.renderCredits();
    }
  }

  function isPageVisible(pageId) {
    var pageElement = getPageElement(pageId);
    if (!pageElement) return false;
    return !pageElement.hidden;
  }

  function isIndexPageVisible() {
    return isPageVisible(PAGE_MENU);
  }

  function handleGamePauseInput() {
    if (pauseInputHandling) return;
    pauseInputHandling = true;

    var currentPageId = getCurrentPageId();
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

  window.addEventListener("web-locale-applied", function () {
    if (pageMenu && !pageMenu.hidden) {
      setStatusModule(STATUS_KEY_MENU, STATUS_FALLBACK_MENU);
    } else if (pageStart && !pageStart.hidden) {
      setStatusModule(STATUS_KEY_START, STATUS_FALLBACK_START);
    } else if (pageSettings && !pageSettings.hidden) {
      setStatusModule(STATUS_KEY_SETTINGS, STATUS_FALLBACK_SETTINGS);
    } else if (pageCredits && !pageCredits.hidden) {
      setStatusModule(STATUS_KEY_CREDITS, STATUS_FALLBACK_CREDITS);
    }
  });

  showPage(PAGE_MENU);

  return {
    PAGE_MENU: PAGE_MENU,
    PAGE_START: PAGE_START,
    PAGE_SETTINGS: PAGE_SETTINGS,
    PAGE_CREDITS: PAGE_CREDITS,
    dispatchMenuEvent: dispatchMenuEvent,
    trimValue: trimValue,
    goToIndexPage: goToIndexPage,
    goToStartPage: goToStartPage,
    goToSettingsPage: goToSettingsPage,
    goToCreditsPage: goToCreditsPage,
    isPageVisible: isPageVisible,
    isIndexPageVisible: isIndexPageVisible,
    getCurrentPageId: getCurrentPageId,
    handleGamePauseInput: handleGamePauseInput
  };
})();
