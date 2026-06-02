(function () {
  var PAGE_EXTRAS = "extras";
  var EVENT_OPEN_EXTERNAL_URL = "web-open-external-url";

  var VIEW_ART = "art";
  var VIEW_GAMES = "games";
  var VIEW_GAME = "game";
  var VIEW_LINKS = "links";

  var LOCALE_KEY_NAV_GAMES = "web.extras.nav.games";
  var LOCALE_KEY_NAV_ART = "web.extras.nav.art";
  var LOCALE_KEY_NAV_LINKS = "web.extras.nav.links";
  var LOCALE_KEY_GAME_LINK_ON_DESKTOP = "web.extras.game.link-on-desktop";
  var GAME_LINK_ON_DESKTOP_FALLBACK = "Link on Desktop";
  var NAV_GAMES_FALLBACK = "Games";
  var NAV_ART_FALLBACK = "Art";
  var NAV_LINKS_FALLBACK = "Links";

  var currentView = VIEW_GAMES;
  var activeExtrasWindow = null;
  var pendingExternalUrl = "";
  var pendingExternalLabel = "";
  var artViewerOpen = false;
  var activeArtCard = null;
  var activeArtId = "";
  var activeArtSrc = "";
  var activeGameId = "";
  var pendingExtrasRouteTab = "";
  var STORAGE_KEY_SKIP_EXTERNAL_LINK_CONFIRM = "cm-skip-external-link-confirm";
  var STORAGE_KEY_GAME_DESKTOP_LINKS = "cm-menu-game-desktop-links";
  var STORAGE_KEY_ICON_LAYOUTS = "cm-menu-icon-layouts";
  var GAME_DESKTOP_ICON_ID_PREFIX = "game-";
  var STORAGE_VALUE_TRUE = "1";
  var gameDesktopLinkSwitchRefreshTimer = 0;
  var gameDesktopLinkSwitchIgnoreRefreshUntil = 0;
  var GAME_DESKTOP_LINK_SWITCH_HANDLED_FLAG = "extrasGameDesktopLinkHandled";
  var IFRAME_EMBED_RESET_STYLE_ID = "cm-iframe-embed-reset";
  var IFRAME_GAME_CURSOR_SCRIPT_ID = "cm-iframe-game-cursor";
  var IFRAME_GAME_CURSOR_PATH = "Extras/games/iframe-game-cursor.js";
  var IFRAME_CONTEXT_BLOCK_SCRIPT_ID = "cm-iframe-context-block";
  var IFRAME_CONTEXT_BLOCK_PATH = "menu-block-context-menu.js";
  var EVENT_GAME_CURSOR = "cm-game-cursor";
  var IFRAME_EMBED_RESET_INLINE =
    "html,body{-webkit-tap-highlight-color:transparent;tap-highlight-color:transparent}" +
    "*,*::before,*::after{-webkit-tap-highlight-color:transparent;tap-highlight-color:transparent}" +
    "*:focus,*:focus-visible,*:active{outline:none}" +
    "html{touch-action:manipulation}" +
    "html,body,cursor:url('../../../cursor-pointer.svg') 2.1 0,pointer}";

  var contentRoot = document.getElementById("extrasContent");
  var viewArt = document.getElementById("extrasViewArt");
  var viewGames = document.getElementById("extrasViewGames");
  var viewGame = document.getElementById("extrasViewGame");
  var viewLinks = document.getElementById("extrasViewLinks");
  var gamesListRoot = document.getElementById("extrasGamesList");
  var artGridRoot = document.getElementById("extrasArtGrid");
  var linksListRoot = document.getElementById("extrasLinksList");
  var gameFrame = document.getElementById("extrasGameFrame");
  var gameKeyboardFocus = document.getElementById("extrasGameKeyboardFocus");
  var contentPromptPath = document.getElementById("extrasContentPromptPath");
  var contentPromptCommand = document.getElementById("extrasContentPromptCommand");
  var extrasNav = document.getElementById("extrasNav");
  var navTabButtons = extrasNav
    ? extrasNav.querySelectorAll(".extras-nav-tab[data-extras-tab]")
    : [];
  var linkOverlay = document.getElementById("extrasLinkOverlay");
  var linkOverlayUrl = document.getElementById("extrasLinkOverlayUrl");
  var linkOverlayText = document.getElementById("extrasLinkOverlayText");
  var artViewer = document.getElementById("extrasArtViewer");
  var artViewerImage = document.getElementById("extrasArtViewerImage");
  var artViewerImageBox = document.getElementById("extrasArtViewerImageBox");
  var artViewerTitle = document.getElementById("extrasArtViewerTitle");
  var btnExtrasGameDesktopLinkSwitch = document.getElementById("btnExtrasGameDesktopLinkSwitch");

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
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function hasOpenExtrasWindows(presetName) {
    var windows = document.querySelectorAll(
      '.os-window[data-wm-preset="' + presetName + '"]'
    );
    return windows.length > 0;
  }

  function isExtrasPageVisible() {
    if (window.WebMenu && window.WebMenu.isPageVisible) {
      if (window.WebMenu.isPageVisible(PAGE_EXTRAS)) return true;
    }
    if (hasOpenExtrasWindows("extras-games")) return true;
    if (hasOpenExtrasWindows("extras-art")) return true;
    if (hasOpenExtrasWindows("extras-links")) return true;
    return false;
  }

  function setActiveExtrasWindow(windowElement, skipLinkSwitchUpdate) {
    activeExtrasWindow = windowElement || null;
    if (windowElement) {
      viewGames = windowElement.querySelector("#extrasViewGames");
      viewGame = windowElement.querySelector("#extrasViewGame");
      if (viewGame) {
        btnExtrasGameDesktopLinkSwitch = viewGame.querySelector("#btnExtrasGameDesktopLinkSwitch");
        if (!btnExtrasGameDesktopLinkSwitch) {
          btnExtrasGameDesktopLinkSwitch = viewGame.querySelector(".extras-game-desktop-link-option");
        }
      }
      gamesListRoot = windowElement.querySelector(".extras-list");
      gameFrame = windowElement.querySelector(".extras-game-frame");
      gameKeyboardFocus = windowElement.querySelector(".extras-game-keyboard-focus");
      bindIframeEmbedReset(gameFrame);
      if (window.WebGameFrameLocaleHost && window.WebGameFrameLocaleHost.setGameFrame) {
        window.WebGameFrameLocaleHost.setGameFrame(gameFrame);
      }
      if (window.WebGameFrameInputHost && window.WebGameFrameInputHost.setGameFrame) {
        window.WebGameFrameInputHost.setGameFrame(gameFrame);
      }
    }
    if (!skipLinkSwitchUpdate && currentView === VIEW_GAME && activeGameId) {
      updateGameDesktopLinkSwitch(VIEW_GAME);
    }
  }

  function getActiveExtrasWindowForPreset(presetName) {
    if (activeExtrasWindow) {
      if (activeExtrasWindow.getAttribute("data-wm-preset") === presetName) {
        return activeExtrasWindow;
      }
    }
    return document.querySelector('.os-window[data-wm-preset="' + presetName + '"]');
  }

  function getManifest() {
    if (window.WebExtrasManifest) return window.WebExtrasManifest;
    return { games: [], art: [] };
  }

  function setExtrasNavTabLabel(tabId, localeKey, fallback, count) {
    if (!extrasNav) return;
    var tabButton = extrasNav.querySelector(
      '.extras-nav-tab[data-extras-tab="' + tabId + '"]'
    );
    if (!tabButton) return;
    var titleElement = tabButton.querySelector(".extras-nav-tab-title");
    var countElement = tabButton.querySelector(".extras-nav-tab-count");
    if (!titleElement || !countElement) return;
    var label = getLocalized(localeKey, fallback);
    titleElement.textContent = label;
    countElement.textContent = "(" + count + ")";
    tabButton.setAttribute("aria-label", label + " (" + count + ")");
  }

  function updateExtrasNavTabLabels() {
    var manifest = getManifest();
    var games = manifest.games || [];
    var artItems = manifest.art || [];
    var links = getLinks();
    setExtrasNavTabLabel(VIEW_GAMES, LOCALE_KEY_NAV_GAMES, NAV_GAMES_FALLBACK, games.length);
    setExtrasNavTabLabel(VIEW_ART, LOCALE_KEY_NAV_ART, NAV_ART_FALLBACK, artItems.length);
    setExtrasNavTabLabel(VIEW_LINKS, LOCALE_KEY_NAV_LINKS, NAV_LINKS_FALLBACK, links.length);
  }

  function notifyRouteChanged() {
    if (window.WebMenuRoute && window.WebMenuRoute.isWebMode && !window.WebMenuRoute.isWebMode()) {
      return;
    }
    window.dispatchEvent(new CustomEvent("web-extras-route-changed"));
  }

  function normalizeExtrasRouteSection(section) {
    if (!section) return "";
    var value = section.toLowerCase();
    if (value === "arts") return VIEW_ART;
    if (value === "art") return VIEW_ART;
    if (value === "games" || value === "game") return VIEW_GAMES;
    if (value === "links" || value === "link") return VIEW_LINKS;
    return "";
  }

  function findArtItemById(artId) {
    if (!artId) return null;
    var manifest = getManifest();
    var artItems = manifest.art || [];
    var index;
    for (index = 0; index < artItems.length; index++) {
      if (artItems[index].id === artId) return artItems[index];
    }
    return null;
  }

  function getFileNameWithoutExtensionFromPath(path) {
    if (!path) return "";
    var fileName = path;
    var slashIndex = fileName.lastIndexOf("/");
    if (slashIndex >= 0) {
      fileName = fileName.substring(slashIndex + 1);
    }
    var dotIndex = fileName.lastIndexOf(".");
    if (dotIndex > 0) {
      fileName = fileName.substring(0, dotIndex);
    }
    return fileName;
  }

  function getArtDisplayLabel(item) {
    if (!item) return "";
    if (item.id) return item.id;
    return getFileNameWithoutExtensionFromPath(item.path);
  }

  function pathsReferToSameArtMenuBackground(artPath, savedPath) {
    if (!artPath || !savedPath) return false;
    if (artPath === savedPath) return true;
    return getFileNameWithoutExtensionFromPath(artPath) === getFileNameWithoutExtensionFromPath(savedPath);
  }

  function getBackgroundSelectionState() {
    if (window.WebMenuBackground && window.WebMenuBackground.getSelectionState) {
      return window.WebMenuBackground.getSelectionState();
    }
    return { random: false, path: "" };
  }

  function setArtBackgroundSwitchVisual(buttonElement, switchVisual, isOn, isDisabled) {
    if (!buttonElement || !switchVisual) return;
    if (isOn) {
      buttonElement.setAttribute("aria-pressed", "true");
      switchVisual.classList.add("is-on");
    } else {
      buttonElement.setAttribute("aria-pressed", "false");
      switchVisual.classList.remove("is-on");
    }
    if (isDisabled) {
      buttonElement.disabled = true;
      buttonElement.setAttribute("aria-disabled", "true");
      return;
    }
    buttonElement.disabled = false;
    buttonElement.removeAttribute("aria-disabled");
  }

  function updateArtBackgroundSwitchState() {
    var useBackgroundButton = document.getElementById("extrasArtUseBackgroundSwitch");
    var randomBackgroundButton = document.getElementById("extrasArtRandomBackgroundSwitch");
    if (!useBackgroundButton || !randomBackgroundButton) return;

    var useBackgroundVisual = useBackgroundButton.querySelector(".settings-switch");
    var randomBackgroundVisual = randomBackgroundButton.querySelector(".settings-switch");
    var selectionState = getBackgroundSelectionState();
    var useBackgroundActive = false;
    var randomBackgroundActive = false;

    if (selectionState.random) {
      randomBackgroundActive = true;
    } else if (activeArtSrc && pathsReferToSameArtMenuBackground(activeArtSrc, selectionState.path)) {
      useBackgroundActive = true;
    }

    setArtBackgroundSwitchVisual(useBackgroundButton, useBackgroundVisual, useBackgroundActive, false);
    setArtBackgroundSwitchVisual(
      randomBackgroundButton,
      randomBackgroundVisual,
      randomBackgroundActive,
      randomBackgroundActive
    );
    updateArtRandomDisableHelp(randomBackgroundButton.disabled);
  }

  var LOCALE_KEY_HELP_TITLE = "settings.web.help.title";
  var LOCALE_KEY_ART_RANDOM_DISABLE_HINT = "web.extras.art.random-disable-hint";
  var ART_RANDOM_DISABLE_HINT_FALLBACK =
    "To disable random background — set any art as background";
  var HELP_TITLE_FALLBACK = "Help";
  var artRandomDisableHelpBound = false;

  function getArtRandomDisableHelpText() {
    return getLocalized(LOCALE_KEY_ART_RANDOM_DISABLE_HINT, ART_RANDOM_DISABLE_HINT_FALLBACK);
  }

  function bindArtRandomDisableHelp() {
    if (artRandomDisableHelpBound) return;
    var helpButton = document.getElementById("extrasArtRandomDisableHelp");
    if (!helpButton || !window.WebMenuHelpTooltip) return;
    window.WebMenuHelpTooltip.bindHelpButton(
      helpButton,
      getArtRandomDisableHelpText(),
      getLocalized(LOCALE_KEY_HELP_TITLE, HELP_TITLE_FALLBACK)
    );
    artRandomDisableHelpBound = true;
    updateArtRandomDisableHelp(false);
  }

  function updateArtRandomDisableHelp(showHelp) {
    var helpButton = document.getElementById("extrasArtRandomDisableHelp");
    if (!helpButton) return;
    if (showHelp) {
      if (window.WebMenuHelpTooltip) {
        window.WebMenuHelpTooltip.setHelpButtonText(helpButton, getArtRandomDisableHelpText());
      } else {
        helpButton.setAttribute("data-help-text", getArtRandomDisableHelpText());
      }
      helpButton.hidden = false;
      helpButton.classList.add("is-visible");
      return;
    }
    helpButton.hidden = true;
    helpButton.classList.remove("is-visible");
    helpButton.setAttribute("data-help-text", "");
    if (window.WebMenuHelpTooltip) {
      window.WebMenuHelpTooltip.hide();
    }
  }

  function getLinks() {
    if (window.WebExtrasLinks) return window.WebExtrasLinks;
    return [];
  }

  function refreshScrollbars() {
    if (window.WebScrollbarCursor) {
      if (window.WebScrollbarCursor.scheduleScrollViewScan) {
        window.WebScrollbarCursor.scheduleScrollViewScan();
        return;
      }
      if (window.WebScrollbarCursor.initVerticalScrollViews) {
        window.WebScrollbarCursor.initVerticalScrollViews(document);
      }
      window.WebScrollbarCursor.refreshAllScrollbars();
    }
  }

  function getTabForView(viewId) {
    if (viewId === VIEW_GAME) return VIEW_GAMES;
    return viewId;
  }

  function setNavTabActive(tabId) {
    var index;
    for (index = 0; index < navTabButtons.length; index++) {
      var button = navTabButtons[index];
      var isActive = button.getAttribute("data-extras-tab") === tabId;
      if (isActive) {
        button.classList.add("is-active");
      } else {
        button.classList.remove("is-active");
      }
    }
  }

  function areTerminalAnimationsEnabled() {
    var device = document.getElementById("device");
    if (!device) return true;
    return !device.classList.contains("terminal-animations-off");
  }

  function getExtrasWindowPresetForView(viewId) {
    if (viewId === VIEW_ART) return "extras-art";
    if (viewId === VIEW_LINKS) return "extras-links";
    return "extras-games";
  }

  function playExtrasContentBodyOpen(windowElement) {
    if (!areTerminalAnimationsEnabled()) return;
    if (!windowElement || !window.WebWindowManager) return;
    if (!window.WebWindowManager.playWindowBodyOpen) return;
    window.WebWindowManager.playWindowBodyOpen(windowElement);
  }

  function showView(viewId, playContentOpen) {
    var viewChanged = currentView !== viewId;
    if (viewId !== VIEW_ART && artViewerOpen) {
      closeArtViewer();
    }
    if (viewId !== VIEW_GAME) activeGameId = "";
    currentView = viewId;

    if (viewId === VIEW_GAMES || viewId === VIEW_GAME) {
      if (viewGames) viewGames.hidden = viewId === VIEW_GAME;
      if (viewGame) viewGame.hidden = viewId !== VIEW_GAME;
    }

    updateGameDesktopLinkSwitch(viewId);

    setNavTabActive(getTabForView(viewId));

    refreshScrollbars();
    if (playContentOpen !== false && viewChanged && activeExtrasWindow) {
      playExtrasContentBodyOpen(activeExtrasWindow);
    }
    notifyRouteChanged();
  }

  function buildDifficultyStarsHtml(difficulty) {
    var starsHtml = "";
    var starIndex;
    var filledCount = difficulty;
    if (!filledCount || filledCount < 0) {
      filledCount = 0;
    }
    if (filledCount > 5) {
      filledCount = 5;
    }
    for (starIndex = 1; starIndex <= 5; starIndex += 1) {
      var starClass = "extras-game-star";
      var starSymbol = "\u2606";
      if (starIndex <= filledCount) {
        starClass += " is-filled";
        starSymbol = "\u2605";
      }
      starsHtml += '<span class="' + starClass + '" aria-hidden="true">' + starSymbol + "</span>";
    }
    return starsHtml;
  }

  function buildGameListHtml() {
    var manifest = getManifest();
    var games = manifest.games || [];
    var html = "";
    var index;
    for (index = 0; index < games.length; index++) {
      var game = games[index];
      var title = getLocalized(game.titleKey, game.title || game.titleFallback || game.id);
      var imageSrc = game.image || "";
      var difficulty = game.difficulty || 0;
      html +=
        '<li><button type="button" class="extras-game-card extras-game-picker" data-game-id="' +
        escapeHtml(game.id) +
        '">';
      if (imageSrc) {
        html +=
          '<img class="extras-game-card-image" src="' +
          escapeHtml(imageSrc) +
          '" alt="" loading="lazy" />';
      } else {
        html += '<span class="extras-game-card-image extras-game-card-image--empty" aria-hidden="true"></span>';
      }
      html +=
        '<div class="extras-game-card-body"><span class="extras-game-card-title terminal-text">' +
        escapeHtml(title) +
        '</span><span class="extras-game-card-stars">' +
        buildDifficultyStarsHtml(difficulty) +
        "</span></div></button></li>";
    }
    if (!html) {
      html =
        '<li class="extras-hub-text">' +
        escapeHtml(getLocalized("web.extras.games.empty", "No games found.")) +
        "</li>";
    }
    return html;
  }

  function findGameById(gameId) {
    var manifest = getManifest();
    var games = manifest.games || [];
    var index;
    for (index = 0; index < games.length; index++) {
      if (games[index].id === gameId) return games[index];
    }
    return null;
  }

  function isBlankGameFrameSrc(frameSrc) {
    if (!frameSrc) return true;
    if (frameSrc === "about:blank") return true;
    return false;
  }

  function getIframeGameCursorScriptUrl(frame) {
    var doc;
    try {
      doc = frame.contentDocument;
    } catch (error) {
      doc = null;
    }
    if (doc && doc.location && doc.location.href && !isBlankGameFrameSrc(doc.location.href)) {
      try {
        return new URL("../iframe-game-cursor.js", doc.location.href).href;
      } catch (error) {}
    }
    try {
      return new URL(IFRAME_GAME_CURSOR_PATH, window.location.href).href;
    } catch (error) {
      return IFRAME_GAME_CURSOR_PATH;
    }
  }

  function getIframeContextBlockScriptUrl() {
    try {
      return new URL(IFRAME_CONTEXT_BLOCK_PATH, window.location.href).href;
    } catch (error) {
      return IFRAME_CONTEXT_BLOCK_PATH;
    }
  }

  function shouldInjectGameCursorScript(frame) {
    var frameSrc = frame.getAttribute("src") || "";
    if (isBlankGameFrameSrc(frameSrc)) return false;
    return frameSrc.indexOf("Extras/games/") !== -1 || frameSrc.indexOf("extras/games/") !== -1;
  }

  function injectIframeEmbedResetIntoFrame(frame) {
    var doc;
    try {
      doc = frame.contentDocument;
    } catch (error) {
      return;
    }
    if (!doc || !doc.head) return;

    if (!doc.getElementById(IFRAME_EMBED_RESET_STYLE_ID)) {
      var style = doc.createElement("style");
      style.id = IFRAME_EMBED_RESET_STYLE_ID;
      style.textContent = IFRAME_EMBED_RESET_INLINE;
      doc.head.insertBefore(style, doc.head.firstChild);
    }

    if (!shouldInjectGameCursorScript(frame)) return;

    if (!doc.getElementById(IFRAME_CONTEXT_BLOCK_SCRIPT_ID)) {
      if (!doc.querySelector('script[src*="menu-block-context-menu.js"]')) {
        var contextBlockScript = doc.createElement("script");
        contextBlockScript.id = IFRAME_CONTEXT_BLOCK_SCRIPT_ID;
        contextBlockScript.src = getIframeContextBlockScriptUrl();
        doc.head.appendChild(contextBlockScript);
      }
    }

    if (doc.getElementById(IFRAME_GAME_CURSOR_SCRIPT_ID)) return;
    if (doc.querySelector('script[src*="iframe-game-cursor.js"]')) return;

    var cursorScript = doc.createElement("script");
    cursorScript.id = IFRAME_GAME_CURSOR_SCRIPT_ID;
    cursorScript.src = getIframeGameCursorScriptUrl(frame);
    doc.head.appendChild(cursorScript);
  }

  function onGameFrameCursorMessage(event) {
    if (!event || !event.data || event.data.eventName !== EVENT_GAME_CURSOR) {
      return;
    }
    if (!gameFrame) {
      return;
    }
    try {
      if (event.source !== gameFrame.contentWindow) {
        return;
      }
    } catch (error) {
      return;
    }
    if (window.WebMenuCursorBridge && window.WebMenuCursorBridge.setTokenFromGameFrame) {
      window.WebMenuCursorBridge.setTokenFromGameFrame(event.data.token);
    }
  }

  function bindIframeEmbedReset(frame) {
    if (!frame) return;
    if (frame.getAttribute("data-embed-reset-bound") === "1") return;
    frame.setAttribute("data-embed-reset-bound", "1");
    frame.addEventListener("load", function () {
      injectIframeEmbedResetIntoFrame(frame);
    });
  }

  function getGameInputMode(gameId) {
    var game = findGameById(gameId);
    if (game && game.inputMode === "movement") {
      return "movement";
    }
    if (gameId === "trouble-drivers" || gameId === "sector-vector") {
      return "movement";
    }
    return "cursor";
  }

  function setGameInputProfile(gameId) {
    var inputMode = getGameInputMode(gameId);
    if (window.WebGameFrameInputHost) {
      window.WebGameFrameInputHost.setInputMode(inputMode);
    }
    window.dispatchEvent(
      new CustomEvent("web-extras-game-profile", {
        detail: { gameId: gameId, inputMode: inputMode, name: gameId }
      })
    );
  }

  function syncFrameGameInputMode() {
    if (window.WebGameFrameInputHost && window.WebGameFrameInputHost.syncFrameInputMode) {
      window.WebGameFrameInputHost.syncFrameInputMode();
    }
  }

  function setGameInputForwarding(enabled) {
    if (window.WebGameFrameInputHost) {
      window.WebGameFrameInputHost.setForwardingEnabled(enabled);
    }
    window.dispatchEvent(
      new CustomEvent("web-extras-game-input", { detail: { active: enabled } })
    );
  }

  function focusGameKeyboardTarget() {
    if (gameKeyboardFocus && gameKeyboardFocus.focus) {
      try {
        gameKeyboardFocus.focus({ preventScroll: true });
      } catch (error) {
        gameKeyboardFocus.focus();
      }
      return;
    }
    if (window.WebGameFrameInputHost && window.WebGameFrameInputHost.focusGameFrame) {
      window.WebGameFrameInputHost.focusGameFrame();
    }
  }

  function getOpenExtrasGamesWindow() {
    var windowElement = null;
    if (activeExtrasWindow && activeExtrasWindow.getAttribute("data-wm-preset") === "extras-games") {
      if (!activeExtrasWindow.classList.contains("os-window--closed")) {
        return activeExtrasWindow;
      }
    }
    windowElement = document.querySelector(
      '#desktopSurface .os-window[data-wm-preset="extras-games"]:not(.os-window--closed)'
    );
    if (windowElement) {
      return windowElement;
    }
    return getActiveExtrasWindowForPreset("extras-games");
  }

  function getGameDesktopLinkSwitchElements() {
    var switchButton = null;
    var switchVisual;
    var gamesWindow;
    var gameView = viewGame;
    gamesWindow = getOpenExtrasGamesWindow();
    if (gamesWindow) {
      setActiveExtrasWindow(gamesWindow, true);
      gameView = gamesWindow.querySelector("#extrasViewGame");
    } else if (activeExtrasWindow) {
      gameView = activeExtrasWindow.querySelector("#extrasViewGame");
    }
    if (!gameView) {
      gameView = document.getElementById("extrasViewGame");
    }
    if (gameView) {
      switchButton = gameView.querySelector("#btnExtrasGameDesktopLinkSwitch");
      if (!switchButton) {
        switchButton = gameView.querySelector(".extras-game-desktop-link-option");
      }
    }
    if (!switchButton) {
      switchButton = document.getElementById("btnExtrasGameDesktopLinkSwitch");
    }
    if (!switchButton) return null;
    switchVisual = switchButton.querySelector(".settings-switch");
    if (!switchVisual) return null;
    btnExtrasGameDesktopLinkSwitch = switchButton;
    return { button: switchButton, visual: switchVisual };
  }

  function readGameDesktopLinksPayloadFromStorage() {
    var raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY_GAME_DESKTOP_LINKS);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (storageError) {
      return null;
    }
  }

  function writeGameDesktopLinksPayloadToStorage(gameIds) {
    var payload;
    var index;
    var uniqueIds;
    if (!gameIds || !gameIds.length) {
      try {
        window.localStorage.setItem(
          STORAGE_KEY_GAME_DESKTOP_LINKS,
          JSON.stringify({ gameIds: [] })
        );
      } catch (storageError) {
      }
      return;
    }
    uniqueIds = [];
    for (index = 0; index < gameIds.length; index++) {
      if (gameIds[index] && uniqueIds.indexOf(gameIds[index]) === -1) {
        uniqueIds.push(gameIds[index]);
      }
    }
    payload = { gameIds: uniqueIds };
    try {
      window.localStorage.setItem(STORAGE_KEY_GAME_DESKTOP_LINKS, JSON.stringify(payload));
    } catch (storageError) {
    }
  }

  function setGameDesktopLinkEnabledInStorage(gameId, enabled) {
    var payload;
    var gameIds;
    var index;
    var nextIds;
    if (!gameId) return;
    payload = readGameDesktopLinksPayloadFromStorage();
    gameIds = payload && payload.gameIds ? payload.gameIds : [];
    nextIds = [];
    for (index = 0; index < gameIds.length; index++) {
      if (gameIds[index] && gameIds[index] !== gameId) {
        nextIds.push(gameIds[index]);
      }
    }
    if (enabled) {
      nextIds.push(gameId);
    }
    writeGameDesktopLinksPayloadToStorage(nextIds);
  }

  function isGameDesktopLinkEnabledInStorage(gameId) {
    var payload;
    var gameIds;
    var index;
    if (!gameId) return false;
    payload = readGameDesktopLinksPayloadFromStorage();
    if (!payload) return false;
    gameIds = payload.gameIds ? payload.gameIds : [];
    for (index = 0; index < gameIds.length; index++) {
      if (gameIds[index] === gameId) return true;
    }
    return false;
  }

  function isGameDesktopIconLayoutInStorage(gameId) {
    var payload;
    var layouts;
    var index;
    var entry;
    var iconId;
    if (!gameId) return false;
    iconId = GAME_DESKTOP_ICON_ID_PREFIX + gameId;
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY_ICON_LAYOUTS);
      if (!raw) return false;
      payload = JSON.parse(raw);
      layouts = payload && payload.layouts ? payload.layouts : [];
      for (index = 0; index < layouts.length; index++) {
        entry = layouts[index];
        if (entry && entry.iconId === iconId) return true;
      }
    } catch (storageError) {
      return false;
    }
    return false;
  }

  function setGameDesktopLinkSwitchVisual(switchButton, switchVisual, isOn) {
    if (!switchButton) return;
    if (!switchVisual) {
      switchVisual = switchButton.querySelector(".settings-switch");
    }
    if (!switchVisual) return;
    switchButton.classList.toggle("extras-game-desktop-link-option--linked", isOn);
    switchButton.classList.toggle("is-on", isOn);
    switchVisual.classList.toggle("is-on", isOn);
    if (isOn) {
      switchButton.setAttribute("aria-pressed", "true");
      switchVisual.setAttribute("aria-checked", "true");
    } else {
      switchButton.setAttribute("aria-pressed", "false");
      switchVisual.setAttribute("aria-checked", "false");
    }
  }

  function forEachGameDesktopLinkSwitch(callback) {
    var windows;
    var windowIndex;
    var gamesWindow;
    var gameView;
    var switchButton;
    var switchVisual;
    if (!callback) return;
    windows = document.querySelectorAll('.os-window[data-wm-preset="extras-games"]');
    for (windowIndex = 0; windowIndex < windows.length; windowIndex++) {
      gamesWindow = windows[windowIndex];
      if (!gamesWindow || gamesWindow.classList.contains("os-window--closed")) continue;
      gameView = gamesWindow.querySelector("#extrasViewGame");
      if (!gameView || gameView.hidden) continue;
      switchButton = gameView.querySelector(".extras-game-desktop-link-option");
      if (!switchButton) continue;
      switchVisual = switchButton.querySelector(".settings-switch");
      if (!switchVisual) continue;
      callback(switchButton, switchVisual);
    }
  }

  function hasActiveGameDesktopLink() {
    if (!activeGameId) return false;
    if (!window.WebDesktop) {
      if (isGameDesktopLinkEnabledInStorage(activeGameId)) return true;
      if (!readGameDesktopLinksPayloadFromStorage() && isGameDesktopIconLayoutInStorage(activeGameId)) {
        return true;
      }
      return false;
    }
    if (window.WebDesktop.hasGameDesktopIcon && window.WebDesktop.hasGameDesktopIcon(activeGameId)) {
      return true;
    }
    if (
      window.WebDesktop.isGameDesktopLinkEnabled &&
      window.WebDesktop.isGameDesktopLinkEnabled(activeGameId)
    ) {
      return true;
    }
    if (isGameDesktopLinkEnabledInStorage(activeGameId)) return true;
    return false;
  }

  function scheduleRefreshGameDesktopLinkSwitchState() {
    var delays;
    var delayIndex;
    refreshGameDesktopLinkSwitchState();
    if (currentView !== VIEW_GAME || !activeGameId) return;
    if (gameDesktopLinkSwitchRefreshTimer) {
      window.clearTimeout(gameDesktopLinkSwitchRefreshTimer);
      gameDesktopLinkSwitchRefreshTimer = 0;
    }
    delays = [50, 150, 350, 700, 1200];
    delayIndex = 0;
    function runDelayedRefresh() {
      if (currentView !== VIEW_GAME || !activeGameId) {
        gameDesktopLinkSwitchRefreshTimer = 0;
        return;
      }
      refreshGameDesktopLinkSwitchState();
      delayIndex = delayIndex + 1;
      if (delayIndex >= delays.length) {
        gameDesktopLinkSwitchRefreshTimer = 0;
        return;
      }
      gameDesktopLinkSwitchRefreshTimer = window.setTimeout(runDelayedRefresh, delays[delayIndex]);
    }
    gameDesktopLinkSwitchRefreshTimer = window.setTimeout(runDelayedRefresh, delays[0]);
  }

  function refreshGameDesktopLinkSwitchState() {
    if (currentView !== VIEW_GAME || !activeGameId) return;
    if (Date.now() < gameDesktopLinkSwitchIgnoreRefreshUntil) return;
    updateGameDesktopLinkSwitch(VIEW_GAME);
  }

  function updateGameDesktopLinkSwitch(viewId) {
    var isLinked;
    var linkLabel;
    if (viewId !== VIEW_GAME || !activeGameId) return;
    isLinked = hasActiveGameDesktopLink();
    linkLabel = getLocalized(LOCALE_KEY_GAME_LINK_ON_DESKTOP, GAME_LINK_ON_DESKTOP_FALLBACK);
    forEachGameDesktopLinkSwitch(function (switchButton, switchVisual) {
      setGameDesktopLinkSwitchVisual(switchButton, switchVisual, isLinked);
      switchButton.setAttribute("aria-label", linkLabel);
    });
  }

  function setActiveGameDesktopLink(enabled) {
    var game;
    if (!activeGameId) return;
    game = findGameById(activeGameId);
    if (!game) return;
    if (window.WebDesktop && window.WebDesktop.setGameDesktopLinkEnabled) {
      window.WebDesktop.setGameDesktopLinkEnabled(activeGameId, enabled);
    } else {
      setGameDesktopLinkEnabledInStorage(activeGameId, enabled);
    }
    if (enabled) {
      if (window.WebDesktop && window.WebDesktop.createGameDesktopIcon) {
        window.WebDesktop.createGameDesktopIcon(game);
      }
      return;
    }
    if (window.WebDesktop && window.WebDesktop.removeGameDesktopIcon) {
      window.WebDesktop.removeGameDesktopIcon(activeGameId);
    } else {
      setGameDesktopLinkEnabledInStorage(activeGameId, false);
    }
  }

  function onGameDesktopLinkSwitchClick(event) {
    var switchButton;
    var gamesWindow;
    var nextLinked;
    var isOn;
    if (event && event[GAME_DESKTOP_LINK_SWITCH_HANDLED_FLAG]) {
      return;
    }
    if (!event || !event.target || !event.target.closest) return;
    switchButton = event.target.closest(".extras-game-desktop-link-option");
    if (!switchButton) return;
    if (event) {
      event[GAME_DESKTOP_LINK_SWITCH_HANDLED_FLAG] = true;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
    gamesWindow = switchButton.closest('.os-window[data-wm-preset="extras-games"]');
    if (gamesWindow) {
      setActiveExtrasWindow(gamesWindow, true);
    }
    if (!activeGameId) return;
    nextLinked = !hasActiveGameDesktopLink();
    setActiveGameDesktopLink(nextLinked);
    isOn = nextLinked;
    gameDesktopLinkSwitchIgnoreRefreshUntil = Date.now() + 500;
    forEachGameDesktopLinkSwitch(function (button, visual) {
      setGameDesktopLinkSwitchVisual(button, visual, isOn);
    });
  }

  function onGameFrameLoaded() {
    focusGameKeyboardTarget();
    syncFrameGameInputMode();
    if (window.WebMenuGameRecords && window.WebMenuGameRecords.installIframeRecordsBridge) {
      window.WebMenuGameRecords.installIframeRecordsBridge(gameFrame, activeGameId);
    }
  }

  function openGame(gameId) {
    var game;
    var gamesWindow;
    gamesWindow = getOpenExtrasGamesWindow();
    if (!gamesWindow) {
      gamesWindow = getActiveExtrasWindowForPreset("extras-games");
    }
    if (gamesWindow) {
      setActiveExtrasWindow(gamesWindow);
    }
    game = findGameById(gameId);
    if (!game || !gameFrame) return;
    activeGameId = gameId;
    if (window.WebDesktop && window.WebDesktop.ensureGameDesktopLinkIcon) {
      window.WebDesktop.ensureGameDesktopLinkIcon(gameId);
    }
    setGameInputProfile(gameId);
    setGameInputForwarding(true);
    gameFrame.addEventListener("load", onGameFrameLoaded, { once: true });
    gameFrame.src = game.path;
    showView(VIEW_GAME);
    scheduleRefreshGameDesktopLinkSwitchState();
    focusGameKeyboardTarget();
  }

  function closeGame() {
    activeGameId = "";
    setGameInputForwarding(false);
    if (window.WebGameFrameInputHost) {
      window.WebGameFrameInputHost.setInputMode("cursor");
    }
    if (gameFrame) gameFrame.src = "about:blank";
    showView(VIEW_GAMES);
  }

  function openArtById(artId) {
    var item = findArtItemById(artId);
    if (!item) return false;
    renderArt();
    showView(VIEW_ART, false);
    var title = getArtDisplayLabel(item);
    var card = null;
    if (artGridRoot) {
      card = artGridRoot.querySelector('.extras-art-card[data-art-id="' + artId + '"]');
    }
    openArtViewer(item.path, title, card, item.id);
    return true;
  }

  function renderGamesInWindow(windowElement) {
    var listRoot = null;
    if (windowElement) {
      listRoot = windowElement.querySelector(".extras-list");
    } else if (gamesListRoot) {
      listRoot = gamesListRoot;
    }
    if (listRoot) listRoot.innerHTML = buildGameListHtml();
  }

  function renderGames() {
    var windows = document.querySelectorAll('.os-window[data-wm-preset="extras-games"]');
    var index = 0;
    if (windows.length) {
      for (index = 0; index < windows.length; index++) {
        renderGamesInWindow(windows[index]);
      }
      return;
    }
    renderGamesInWindow(null);
  }

  function renderArtInWindow(windowElement) {
    var gridRoot = null;
    if (windowElement) {
      gridRoot = windowElement.querySelector(".extras-art-grid");
    } else if (artGridRoot) {
      gridRoot = artGridRoot;
    }
    if (!gridRoot) return;
    var manifest = getManifest();
    var artItems = manifest.art || [];
    var html = "";
    var index;
    for (index = 0; index < artItems.length; index++) {
      var item = artItems[index];
      var title = getArtDisplayLabel(item);
      html +=
        '<button type="button" class="extras-art-card" data-art-id="' +
        escapeHtml(item.id) +
        '" data-art-src="' +
        escapeHtml(item.path) +
        '" data-art-title="' +
        escapeHtml(title) +
        '"><img class="extras-art-card-image" src="' +
        escapeHtml(item.path) +
        '" alt="' +
        escapeHtml(title) +
        '" loading="lazy" /><span class="extras-art-caption">' +
        escapeHtml(title) +
        "</span></button>";
    }
    if (!html) {
      html =
        '<p class="extras-hub-text">' +
        escapeHtml(getLocalized("web.extras.art.empty", "No art found.")) +
        "</p>";
    }
    gridRoot.innerHTML = html;
  }

  function renderArt() {
    var windows = document.querySelectorAll('.os-window[data-wm-preset="extras-art"]');
    var index = 0;
    if (windows.length) {
      for (index = 0; index < windows.length; index++) {
        renderArtInWindow(windows[index]);
      }
      return;
    }
    renderArtInWindow(null);
  }

  function renderLinksInWindow(windowElement) {
    var listRoot = null;
    if (windowElement) {
      listRoot = windowElement.querySelector(".extras-links-list");
    } else if (linksListRoot) {
      listRoot = linksListRoot;
    }
    if (!listRoot) return;
    var links = getLinks();
    var html = "";
    var index;
    for (index = 0; index < links.length; index++) {
      var link = links[index];
      var label = getLocalized(link.labelKey, link.labelFallback || link.title);
      html +=
        '<button type="button" class="extras-link-row" data-extras-href="' +
        escapeHtml(link.href) +
        '" data-extras-label="' +
        escapeHtml(label) +
        '"><img class="extras-link-icon" src="' +
        escapeHtml(link.iconUrl) +
        '" alt="" width="20" height="20" /><span class="extras-link-label terminal-text">' +
        escapeHtml(label) +
        "</span></button>";
    }
    listRoot.innerHTML = html;
  }

  function renderLinks() {
    var windows = document.querySelectorAll('.os-window[data-wm-preset="extras-links"]');
    var index = 0;
    if (windows.length) {
      for (index = 0; index < windows.length; index++) {
        renderLinksInWindow(windows[index]);
      }
      return;
    }
    renderLinksInWindow(null);
  }

  function showTab(tabId) {
    if (tabId === VIEW_ART) {
      renderArt();
      showView(VIEW_ART);
      playExtrasContentBodyOpen();
      return;
    }
    if (tabId === VIEW_GAMES) {
      if (currentView === VIEW_GAME) {
        closeGame();
        return;
      }
      renderGames();
      showView(VIEW_GAMES);
      playExtrasContentBodyOpen();
      return;
    }
    if (tabId === VIEW_LINKS) {
      renderLinks();
      showView(VIEW_LINKS);
      playExtrasContentBodyOpen();
    }
  }

  function openGamesPanel(windowElement) {
    if (!windowElement) {
      windowElement = getActiveExtrasWindowForPreset("extras-games");
    }
    if (!windowElement) return;
    setActiveExtrasWindow(windowElement);
    renderGamesInWindow(windowElement);
    if (pendingExtrasRouteTab) {
      applyTabForRoute("extras-games", pendingExtrasRouteTab);
      pendingExtrasRouteTab = "";
      refreshScrollbars();
      return;
    }
    if (currentView === VIEW_GAME && activeGameId) {
      refreshScrollbars();
      return;
    }
    showView(VIEW_GAMES);
    refreshScrollbars();
  }

  function openArtPanel(windowElement) {
    if (!windowElement) {
      windowElement = getActiveExtrasWindowForPreset("extras-art");
    }
    if (!windowElement) return;
    artGridRoot = windowElement.querySelector(".extras-art-grid");
    renderArtInWindow(windowElement);
    refreshScrollbars();
  }

  function openLinksPanel(windowElement) {
    if (!windowElement) {
      windowElement = getActiveExtrasWindowForPreset("extras-links");
    }
    if (!windowElement) return;
    linksListRoot = windowElement.querySelector(".extras-links-list");
    renderLinksInWindow(windowElement);
    refreshScrollbars();
  }

  function renderExtras() {
    if (!isExtrasPageVisible()) return;
    renderArt();
    renderGames();
    renderLinks();
    updateExtrasNavTabLabels();
    if (artViewerOpen) {
      updateArtBackgroundSwitchState();
    }
    if (currentView === VIEW_GAME) {
      showView(VIEW_GAME, false);
    } else if (currentView) {
      showView(currentView, false);
    }
    refreshScrollbars();
  }

  function getSkipExternalLinkConfirm() {
    try {
      return window.localStorage.getItem(STORAGE_KEY_SKIP_EXTERNAL_LINK_CONFIRM) === STORAGE_VALUE_TRUE;
    } catch (storageError) {
      return false;
    }
  }

  function setSkipExternalLinkConfirm() {
    try {
      window.localStorage.setItem(STORAGE_KEY_SKIP_EXTERNAL_LINK_CONFIRM, STORAGE_VALUE_TRUE);
    } catch (storageError) {
    }
  }

  function openExternalUrl(url) {
    if (!url) return;
    if (window.vuplex && window.vuplex.postMessage && window.WebMenu) {
      window.WebMenu.dispatchMenuEvent(EVENT_OPEN_EXTERNAL_URL, { url: url });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function setActiveArtCard(card) {
    if (activeArtCard) activeArtCard.classList.remove("is-active");
    activeArtCard = card || null;
    if (activeArtCard) activeArtCard.classList.add("is-active");
  }

  function closeArtViewer() {
    if (!artViewer || !artViewerOpen) return;
    if (window.WebMenuHelpTooltip) {
      window.WebMenuHelpTooltip.hide();
    }
    updateArtRandomDisableHelp(false);
    artViewerOpen = false;
    artViewer.classList.remove("is-open");
    artViewer.setAttribute("aria-hidden", "true");
    setActiveArtCard(null);
    activeArtId = "";
    activeArtSrc = "";
    notifyRouteChanged();
  }

  function openArtViewer(src, title, card, artId) {
    if (!artViewer || !artViewerImage || !src) return;
    activeArtId = artId || "";
    activeArtSrc = src;
    artViewerImage.src = src;
    artViewerImage.alt = title || "";
    if (artViewerTitle) {
      artViewerTitle.textContent =
        title || getLocalized("web.extras.nav.art", "Art");
    }
    artViewer.setAttribute("aria-hidden", "false");
    artViewer.classList.remove("is-open");
    void artViewer.offsetWidth;
    artViewer.classList.add("is-open");
    artViewerOpen = true;
    setActiveArtCard(card);
    updateArtBackgroundSwitchState();
    notifyRouteChanged();
  }

  function onArtGridClick(event) {
    if (artViewerOpen) return;
    var target = event.target;
    if (!target || !target.closest) return;
    var card = target.closest(".extras-art-card");
    if (!card) return;
    event.stopPropagation();
    var src = card.getAttribute("data-art-src");
    var title = card.getAttribute("data-art-title");
    var artId = card.getAttribute("data-art-id");
    if (src) {
      openArtViewer(src, title, card, artId);
    }
  }

  function onArtViewerClick(event) {
    if (!artViewerOpen) return;
    var target = event.target;
    if (target !== artViewer) return;
    event.stopPropagation();
    closeArtViewer();
  }

  function onArtViewerImageBoxClick(event) {
    if (!artViewerOpen) return;
    event.stopPropagation();
    closeArtViewer();
  }

  function onArtUseBackgroundSwitchClick(event) {
    if (event) event.stopPropagation();
    if (!activeArtSrc || !window.WebMenuBackground) return;
    var selectionState = getBackgroundSelectionState();
    var isActive =
      !selectionState.random &&
      pathsReferToSameArtMenuBackground(activeArtSrc, selectionState.path);
    if (isActive) {
      if (!window.WebMenuBackground.setRandomBackground) return;
      window.WebMenuBackground.setRandomBackground();
      updateArtBackgroundSwitchState();
      return;
    }
    if (!window.WebMenuBackground.setBackground) return;
    window.WebMenuBackground.setBackground(activeArtSrc);
    updateArtBackgroundSwitchState();
  }

  function onArtRandomBackgroundSwitchClick(event) {
    if (event) event.stopPropagation();
    var randomBackgroundButton = document.getElementById("extrasArtRandomBackgroundSwitch");
    if (randomBackgroundButton && randomBackgroundButton.disabled) return;
    if (!window.WebMenuBackground || !window.WebMenuBackground.setRandomBackground) return;
    var selectionState = getBackgroundSelectionState();
    if (selectionState.random) return;
    window.WebMenuBackground.setRandomBackground();
    updateArtBackgroundSwitchState();
  }

  function closeLinkOverlay() {
    if (!linkOverlay) return;
    linkOverlay.classList.remove("is-open");
    linkOverlay.setAttribute("aria-hidden", "true");
    pendingExternalUrl = "";
    pendingExternalLabel = "";
    if (window.WebWindowManager && window.WebWindowManager.relayoutOverlayWindow) {
      window.WebWindowManager.relayoutOverlayWindow();
    }
  }

  function requestExternalUrl(url, label) {
    if (!url) return;
    if (getSkipExternalLinkConfirm()) {
      openExternalUrl(url);
      return;
    }
    openLinkOverlay(url, label);
  }

  function openLinkOverlay(url, label) {
    if (!linkOverlay || !url) return;
    pendingExternalUrl = url;
    pendingExternalLabel = label || url;
    if (linkOverlayUrl) linkOverlayUrl.textContent = url;
    if (linkOverlayText) {
      linkOverlayText.textContent = getLocalized(
        "web.extras.link.confirm-message",
        "Open this link in your browser?"
      );
    }
    linkOverlay.classList.add("is-open");
    linkOverlay.setAttribute("aria-hidden", "false");
    if (window.WebWindowManager && window.WebWindowManager.relayoutOverlayWindow) {
      window.WebWindowManager.relayoutOverlayWindow();
    }
  }

  function onGamesListClick(event) {
    var target = event.target;
    var gamesWindow;
    if (!target || !target.closest) return;
    var gamePicker = target.closest(".extras-game-picker");
    if (!gamePicker) return;
    event.stopPropagation();
    gamesWindow = event.target.closest('.os-window[data-wm-preset="extras-games"]');
    if (gamesWindow) {
      setActiveExtrasWindow(gamesWindow);
    }
    var gameId = gamePicker.getAttribute("data-game-id");
    if (gameId) openGame(gameId);
  }

  function onLinksListClick(event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var linkRow = target.closest(".extras-link-row");
    if (!linkRow) return;
    event.stopPropagation();
    var href = linkRow.getAttribute("data-extras-href");
    var label = linkRow.getAttribute("data-extras-label");
    if (href) requestExternalUrl(href, label);
  }

  function onExtrasNavClick(event) {
    var target = event.target;
    if (!target || !target.closest) return;

    var backButton = target.closest("#btnExtrasBackMenu");
    if (backButton) {
      event.stopPropagation();
      onExtrasBackMenuClick();
      return;
    }

    var tabButton = target.closest(".extras-nav-tab[data-extras-tab]");
    if (!tabButton) return;
    event.stopPropagation();
    var tabId = tabButton.getAttribute("data-extras-tab");
    if (tabId) showTab(tabId);
  }

  function onExtrasBackMenuClick() {
    setGameInputForwarding(false);
    if (gameFrame) gameFrame.src = "about:blank";
    if (window.WebMenu && window.WebMenu.goToIndexPage) {
      window.WebMenu.goToIndexPage();
    }
  }

  function onLinkOverlayConfirm() {
    var url = pendingExternalUrl;
    closeLinkOverlay();
    openExternalUrl(url);
  }

  function onLinkOverlayConfirmNoAsk() {
    var url = pendingExternalUrl;
    setSkipExternalLinkConfirm();
    closeLinkOverlay();
    openExternalUrl(url);
  }

  function onPageChanged(event) {
    var detail = event.detail;
    if (!detail || detail.pageId !== PAGE_EXTRAS) return;
    if (window.WebMenuRoute && window.WebMenuRoute.isApplyingRoute && window.WebMenuRoute.isApplyingRoute()) {
      return;
    }
    currentView = "";
    closeArtViewer();
    setGameInputForwarding(false);
    if (gameFrame) gameFrame.src = "about:blank";
    renderExtras();
    showTab(VIEW_GAMES);
  }

  if (extrasNav) extrasNav.addEventListener("click", onExtrasNavClick);
  if (artGridRoot) artGridRoot.addEventListener("click", onArtGridClick);
  if (artViewer) {
    artViewer.addEventListener("click", onArtViewerClick);
  }
  if (artViewerImageBox) {
    artViewerImageBox.addEventListener("click", onArtViewerImageBoxClick);
  }

  var btnArtViewerClose = document.getElementById("extrasArtViewerClose");
  if (btnArtViewerClose) btnArtViewerClose.addEventListener("click", closeArtViewer);

  var btnArtViewerChromeClose = document.getElementById("extrasArtViewerChromeClose");
  if (btnArtViewerChromeClose) btnArtViewerChromeClose.addEventListener("click", closeArtViewer);

  var btnArtUseBackgroundSwitch = document.getElementById("extrasArtUseBackgroundSwitch");
  if (btnArtUseBackgroundSwitch) {
    btnArtUseBackgroundSwitch.addEventListener("click", onArtUseBackgroundSwitchClick);
  }

  var btnArtRandomBackgroundSwitch = document.getElementById("extrasArtRandomBackgroundSwitch");
  if (btnArtRandomBackgroundSwitch) {
    btnArtRandomBackgroundSwitch.addEventListener("click", onArtRandomBackgroundSwitchClick);
  }

  bindArtRandomDisableHelp();
  window.addEventListener("message", onGameFrameCursorMessage);
  if (window.WebGameFrameLocaleHost) {
    window.WebGameFrameLocaleHost.setGameFrame(gameFrame);
    window.WebGameFrameLocaleHost.bindGameFrameLocale(gameFrame);
  }
  if (window.WebGameFrameInputHost) {
    window.WebGameFrameInputHost.setGameFrame(gameFrame);
  }
  if (gameFrame) {
    gameFrame.addEventListener("pointerdown", focusGameKeyboardTarget);
  }
  if (gameKeyboardFocus) {
    gameKeyboardFocus.addEventListener("blur", function () {
      if (currentView !== VIEW_GAME) {
        return;
      }
      focusGameKeyboardTarget();
    });
  }

  var desktopWorkspace = document.getElementById("desktopWorkspace");
  if (desktopWorkspace) {
    desktopWorkspace.addEventListener("click", function (event) {
      var gamesWindow = event.target.closest('.os-window[data-wm-preset="extras-games"]');
      if (gamesWindow) {
        setActiveExtrasWindow(gamesWindow);
        if (event.target.closest(".extras-game-picker")) {
          onGamesListClick(event);
          return;
        }
        if (event.target.closest(".extras-game-back")) {
          closeGame();
          return;
        }
        if (event.target.closest(".extras-game-desktop-link-option")) {
          onGameDesktopLinkSwitchClick(event);
          return;
        }
      }
      var linksWindow = event.target.closest('.os-window[data-wm-preset="extras-links"]');
      if (linksWindow) {
        linksListRoot = linksWindow.querySelector(".extras-links-list");
        onLinksListClick(event);
      }
      var artWindow = event.target.closest('.os-window[data-wm-preset="extras-art"]');
      if (artWindow) {
        artGridRoot = artWindow.querySelector(".extras-art-grid");
        onArtGridClick(event);
      }
    });
  }

  var btnExtrasGameBack = document.getElementById("btnExtrasGameBack");
  if (btnExtrasGameBack) btnExtrasGameBack.addEventListener("click", closeGame);

  var btnLinkOverlayConfirm = document.getElementById("extrasLinkOverlayConfirm");
  if (btnLinkOverlayConfirm) btnLinkOverlayConfirm.addEventListener("click", onLinkOverlayConfirm);

  var btnLinkOverlayCancel = document.getElementById("extrasLinkOverlayCancel");
  if (btnLinkOverlayCancel) btnLinkOverlayCancel.addEventListener("click", closeLinkOverlay);

  var btnLinkOverlayConfirmNoAsk = document.getElementById("extrasLinkOverlayConfirmNoAsk");
  if (btnLinkOverlayConfirmNoAsk) btnLinkOverlayConfirmNoAsk.addEventListener("click", onLinkOverlayConfirmNoAsk);

  if (linkOverlay) {
    linkOverlay.addEventListener("click", function (event) {
      if (event.target === linkOverlay) closeLinkOverlay();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (artViewerOpen) {
      closeArtViewer();
      event.stopPropagation();
      return;
    }
    if (!linkOverlay || !linkOverlay.classList.contains("is-open")) return;
    closeLinkOverlay();
    event.stopPropagation();
  });

  window.addEventListener("web-locale-applied", renderExtras);
  window.addEventListener("web-page-changed", onPageChanged);
  window.addEventListener("web-desktop-icons-ready", scheduleRefreshGameDesktopLinkSwitchState);
  window.addEventListener("web-desktop-game-icons-restored", scheduleRefreshGameDesktopLinkSwitchState);
  window.addEventListener("web-menu-boot-modules-ready", scheduleRefreshGameDesktopLinkSwitchState);

  updateExtrasNavTabLabels();

  function getRouteSegments() {
    if (!isExtrasPageVisible()) return null;
    var segments = ["extras"];
    if (currentView === VIEW_LINKS) {
      segments.push("links");
      return segments;
    }
    if (currentView === VIEW_GAMES || currentView === VIEW_GAME) {
      segments.push("games");
      if (currentView === VIEW_GAME && activeGameId) {
        segments.push(activeGameId);
      }
      return segments;
    }
    segments.push("art");
    if (artViewerOpen && activeArtId) {
      segments.push(activeArtId);
    }
    return segments;
  }

  function applyExtrasRoute(routeParts) {
    if (!routeParts || !routeParts.length) {
      showTab(VIEW_GAMES);
      return;
    }
    var section = normalizeExtrasRouteSection(routeParts[0]);
    var itemId = routeParts.length > 1 ? routeParts[1] : "";
    if (section === VIEW_GAMES) {
      if (itemId) {
        renderGames();
        openGame(itemId);
      } else {
        showTab(VIEW_GAMES);
      }
      return;
    }
    if (section === VIEW_LINKS) {
      showTab(VIEW_LINKS);
      return;
    }
    if (section === VIEW_ART) {
      if (itemId) {
        openArtById(itemId);
      } else {
        showTab(VIEW_ART);
      }
      return;
    }
    showTab(VIEW_GAMES);
  }

  function getTabForRoute(windowPreset) {
    if (windowPreset === "extras-games") {
      if (currentView === VIEW_GAME && activeGameId) {
        return activeGameId;
      }
      if (currentView === VIEW_LINKS) {
        return VIEW_LINKS;
      }
      return VIEW_GAMES;
    }
    if (windowPreset === "extras-art") {
      if (artViewerOpen && activeArtId) {
        return activeArtId;
      }
      return VIEW_ART;
    }
    return "";
  }

  function ensureExtrasGamesWindowReady() {
    var windowElement = getActiveExtrasWindowForPreset("extras-games");
    if (!windowElement) {
      windowElement = document.querySelector(
        '#desktopSurface .os-window[data-wm-preset="extras-games"]:not(.os-window--closed)'
      );
    }
    if (!windowElement) return null;
    setActiveExtrasWindow(windowElement);
    renderGamesInWindow(windowElement);
    return windowElement;
  }

  function prepareRouteTab(windowPreset, tabValue) {
    if (!tabValue) return;
    if (windowPreset === "extras-games") {
      pendingExtrasRouteTab = tabValue;
    }
  }

  function applyPendingRouteTab(windowPreset) {
    if (!pendingExtrasRouteTab || windowPreset !== "extras-games") return false;
    var tabValue = pendingExtrasRouteTab;
    pendingExtrasRouteTab = "";
    applyTabForRoute(windowPreset, tabValue);
    return true;
  }

  function applyTabForRoute(windowPreset, tabValue) {
    if (!tabValue) return;
    if (windowPreset === "extras-games") {
      if (!ensureExtrasGamesWindowReady()) {
        pendingExtrasRouteTab = tabValue;
        return;
      }
      var gamesSection = normalizeExtrasRouteSection(tabValue);
      if (gamesSection) {
        applyExtrasRoute([gamesSection]);
        return;
      }
      if (findGameById(tabValue)) {
        renderGames();
        openGame(tabValue);
      }
      return;
    }
    if (windowPreset === "extras-art") {
      var artSection = normalizeExtrasRouteSection(tabValue);
      if (artSection === VIEW_ART) {
        showTab(VIEW_ART);
        return;
      }
      if (openArtById(tabValue)) {
        return;
      }
      showTab(VIEW_ART);
    }
  }

  window.WebExtras = {
    renderExtras: renderExtras,
    openGame: openGame,
    openGamesPanel: openGamesPanel,
    openArtPanel: openArtPanel,
    openLinksPanel: openLinksPanel,
    showGamesView: openGamesPanel,
    showArtView: openArtPanel,
    showLinksView: openLinksPanel,
    getRouteSegments: getRouteSegments,
    applyRoute: applyExtrasRoute,
    getTabForRoute: getTabForRoute,
    applyTabForRoute: applyTabForRoute,
    prepareRouteTab: prepareRouteTab,
    applyPendingRouteTab: applyPendingRouteTab,
    refreshGameDesktopLinkSwitch: scheduleRefreshGameDesktopLinkSwitchState,
    handleEscape: function () {
      if (!isExtrasPageVisible()) return false;
      if (artViewerOpen) {
        closeArtViewer();
        return true;
      }
      if (linkOverlay && linkOverlay.classList.contains("is-open")) {
        closeLinkOverlay();
        return true;
      }
      if (currentView === VIEW_GAME) {
        closeGame();
        return true;
      }
      return false;
    }
  };
})();
