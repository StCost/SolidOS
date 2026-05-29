(function () {
  var PAGE_EXTRAS = "extras";
  var EVENT_OPEN_EXTERNAL_URL = "web-open-external-url";

  var VIEW_ART = "art";
  var VIEW_GAMES = "games";
  var VIEW_GAME = "game";
  var VIEW_LINKS = "links";

  var currentView = VIEW_GAMES;
  var pendingExternalUrl = "";
  var pendingExternalLabel = "";
  var artViewerOpen = false;
  var activeArtCard = null;
  var activeArtIsBackground = false;
  var activeArtId = "";
  var activeGameId = "";
  var backgroundApplyTimer = 0;
  var ART_MODAL_OPEN_MS_DEFAULT = 340;
  var STORAGE_KEY_SKIP_EXTERNAL_LINK_CONFIRM = "cm-skip-external-link-confirm";
  var STORAGE_VALUE_TRUE = "1";

  var contentRoot = document.getElementById("extrasContent");
  var viewArt = document.getElementById("extrasViewArt");
  var viewGames = document.getElementById("extrasViewGames");
  var viewGame = document.getElementById("extrasViewGame");
  var viewLinks = document.getElementById("extrasViewLinks");
  var gamesListRoot = document.getElementById("extrasGamesList");
  var artGridRoot = document.getElementById("extrasArtGrid");
  var linksListRoot = document.getElementById("extrasLinksList");
  var gameFrame = document.getElementById("extrasGameFrame");
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
  var artViewerTitle = document.getElementById("extrasArtViewerTitle");

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

  function isExtrasPageVisible() {
    var pageExtras = document.getElementById("pageExtras");
    return !!pageExtras && !pageExtras.hidden;
  }

  function getManifest() {
    if (window.WebExtrasManifest) return window.WebExtrasManifest;
    return { games: [], art: [] };
  }

  function notifyRouteChanged() {
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

  function isBackgroundArtItem(artId, title) {
    if (artId && artId.indexOf("background") === 0) return true;
    if (!title) return false;
    return title.toLowerCase().indexOf("background") !== -1;
  }

  function getMenuBackgroundPathForArt(artId, artSrc) {
    if (artId && artId.indexOf("background") === 0) {
      return "backgrounds/" + artId + ".png";
    }
    return artSrc;
  }

  function getArtModalOpenMs() {
    if (!artViewer) return ART_MODAL_OPEN_MS_DEFAULT;
    var styles = window.getComputedStyle(artViewer);
    var openMs = parseFloat(styles.getPropertyValue("--extras-art-modal-open-ms"));
    if (!openMs || openMs < 1) return ART_MODAL_OPEN_MS_DEFAULT;
    return openMs;
  }

  function cancelPendingBackgroundApply() {
    if (!backgroundApplyTimer) return;
    window.clearTimeout(backgroundApplyTimer);
    backgroundApplyTimer = 0;
  }

  function applyArtAsMenuBackgroundNow(artId, artSrc, title) {
    if (!isBackgroundArtItem(artId, title)) return false;
    if (!window.WebMenuBackground || !window.WebMenuBackground.setBackground) return false;
    var path = getMenuBackgroundPathForArt(artId, artSrc);
    return window.WebMenuBackground.setBackground(path);
  }

  function scheduleArtAsMenuBackground(artId, artSrc, title) {
    cancelPendingBackgroundApply();
    if (!isBackgroundArtItem(artId, title)) return false;
    backgroundApplyTimer = window.setTimeout(function () {
      backgroundApplyTimer = 0;
      applyArtAsMenuBackgroundNow(artId, artSrc, title);
    }, getArtModalOpenMs());
    return true;
  }

  function getLinks() {
    if (window.WebExtrasLinks) return window.WebExtrasLinks;
    return [];
  }

  function setContentPrompt(pathSegment, commandText) {
    if (contentPromptPath) contentPromptPath.textContent = pathSegment;
    if (contentPromptCommand) contentPromptCommand.textContent = commandText;
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

  function playExtrasContentBodyOpen() {
    if (!areTerminalAnimationsEnabled()) return;
    var contentWindow = document.querySelector(
      '.extras-content-window[data-wm-preset="extras-content"]'
    );
    if (!contentWindow || !window.WebWindowManager) return;
    if (!window.WebWindowManager.playWindowBodyOpen) return;
    window.WebWindowManager.playWindowBodyOpen(contentWindow);
  }

  function showView(viewId, playContentOpen) {
    var viewChanged = currentView !== viewId;
    if (viewId !== VIEW_ART && artViewerOpen) {
      cancelPendingBackgroundApply();
      closeArtViewer();
    }
    if (viewId !== VIEW_GAME) activeGameId = "";
    currentView = viewId;
    if (viewArt) viewArt.hidden = viewId !== VIEW_ART;
    if (viewGames) viewGames.hidden = viewId !== VIEW_GAMES;
    if (viewGame) viewGame.hidden = viewId !== VIEW_GAME;
    if (viewLinks) viewLinks.hidden = viewId !== VIEW_LINKS;

    setNavTabActive(getTabForView(viewId));

    if (viewId === VIEW_ART) {
      setContentPrompt("C:\\CM\\extras\\art&gt;", "dir");
    } else if (viewId === VIEW_GAMES) {
      setContentPrompt("C:\\CM\\extras\\games&gt;", "dir");
    } else if (viewId === VIEW_GAME) {
      setContentPrompt("C:\\CM\\extras\\games&gt;", "run");
    } else if (viewId === VIEW_LINKS) {
      setContentPrompt("C:\\CM\\extras\\links&gt;", "type links.lst");
    }

    refreshScrollbars();
    if (playContentOpen !== false && viewChanged) {
      playExtrasContentBodyOpen();
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
      var title = game.title || game.titleFallback || game.id;
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

  function openGame(gameId) {
    var game = findGameById(gameId);
    if (!game || !gameFrame) return;
    activeGameId = gameId;
    gameFrame.src = game.path;
    showView(VIEW_GAME);
  }

  function closeGame() {
    activeGameId = "";
    if (gameFrame) gameFrame.src = "about:blank";
    showView(VIEW_GAMES);
  }

  function openArtById(artId) {
    var item = findArtItemById(artId);
    if (!item) return false;
    renderArt();
    showView(VIEW_ART, false);
    var title = getLocalized(item.titleKey, item.titleFallback || item.id);
    var card = null;
    if (artGridRoot) {
      card = artGridRoot.querySelector('.extras-art-card[data-art-id="' + artId + '"]');
    }
    openArtViewer(item.path, title, card, item.id);
    return true;
  }

  function renderGames() {
    if (gamesListRoot) gamesListRoot.innerHTML = buildGameListHtml();
  }

  function renderArt() {
    if (!artGridRoot) return;
    var manifest = getManifest();
    var artItems = manifest.art || [];
    var html = "";
    var index;
    for (index = 0; index < artItems.length; index++) {
      var item = artItems[index];
      var title = getLocalized(item.titleKey, item.titleFallback || item.id);
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
    artGridRoot.innerHTML = html;
  }

  function renderLinks() {
    if (!linksListRoot) return;
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
    linksListRoot.innerHTML = html;
  }

  function showTab(tabId) {
    if (tabId === VIEW_ART) {
      if (currentView === VIEW_ART) {
        playExtrasContentBodyOpen();
        return;
      }
      renderArt();
      showView(VIEW_ART);
      return;
    }
    if (tabId === VIEW_GAMES) {
      if (currentView === VIEW_GAME) {
        closeGame();
        return;
      }
      if (currentView === VIEW_GAMES) {
        playExtrasContentBodyOpen();
        return;
      }
      renderGames();
      showView(VIEW_GAMES);
      return;
    }
    if (tabId === VIEW_LINKS) {
      if (currentView === VIEW_LINKS) {
        playExtrasContentBodyOpen();
        return;
      }
      renderLinks();
      showView(VIEW_LINKS);
    }
  }

  function renderExtras() {
    if (!isExtrasPageVisible()) return;
    renderArt();
    renderGames();
    renderLinks();
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
    artViewerOpen = false;
    artViewer.classList.remove("is-open");
    artViewer.setAttribute("aria-hidden", "true");
    setActiveArtCard(null);
    activeArtIsBackground = false;
    activeArtId = "";
    notifyRouteChanged();
  }

  function openArtViewer(src, title, card, artId) {
    if (!artViewer || !artViewerImage || !src) return;
    activeArtId = artId || "";
    activeArtIsBackground = isBackgroundArtItem(activeArtId, title);
    artViewerImage.src = src;
    artViewerImage.alt = title || "";
    if (artViewerTitle) {
      artViewerTitle.textContent =
        title || getLocalized("web.extras.art.viewer-title", "art_viewer.exe");
    }
    artViewer.setAttribute("aria-hidden", "false");
    artViewer.classList.remove("is-open");
    void artViewer.offsetWidth;
    artViewer.classList.add("is-open");
    artViewerOpen = true;
    setActiveArtCard(card);
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
      scheduleArtAsMenuBackground(artId, src, title);
    }
  }

  function onArtViewerClick(event) {
    if (!artViewerOpen) return;
    var target = event.target;
    if (target !== artViewer && target !== artViewerImage) return;
    event.stopPropagation();
    if (target === artViewerImage && activeArtIsBackground) {
      var artSrc = activeArtCard ? activeArtCard.getAttribute("data-art-src") : "";
      scheduleArtAsMenuBackground(activeArtId, artSrc, artViewerImage.alt);
    }
    closeArtViewer();
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
    if (!target || !target.closest) return;
    var gamePicker = target.closest(".extras-game-picker");
    if (!gamePicker) return;
    event.stopPropagation();
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
    cancelPendingBackgroundApply();
    closeArtViewer();
    if (gameFrame) gameFrame.src = "about:blank";
    renderExtras();
    showTab(VIEW_GAMES);
  }

  if (extrasNav) extrasNav.addEventListener("click", onExtrasNavClick);
  if (artGridRoot) artGridRoot.addEventListener("click", onArtGridClick);
  if (artViewer) {
    artViewer.addEventListener("click", onArtViewerClick);
  }

  var btnArtViewerClose = document.getElementById("extrasArtViewerClose");
  if (btnArtViewerClose) btnArtViewerClose.addEventListener("click", closeArtViewer);

  if (gamesListRoot) gamesListRoot.addEventListener("click", onGamesListClick);
  if (linksListRoot) linksListRoot.addEventListener("click", onLinksListClick);

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

  window.WebExtras = {
    renderExtras: renderExtras,
    getRouteSegments: getRouteSegments,
    applyRoute: applyExtrasRoute,
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
