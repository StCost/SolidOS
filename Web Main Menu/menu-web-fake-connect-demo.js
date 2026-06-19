(function () {
  var HUD_PAUSE_MS = 1600;
  var LAYER_MENU = "menu";
  var LAYER_HUD = "hud";

  var DEMO_PRESET = "web-fake-connect-demo";
  var DEMO_CLOSE_EVENT = "web-wm-no-save-close";
  var DEMO_WINDOW_WIDTH_FALLBACK_PX = 704;
  var DEMO_WINDOW_HEIGHT_FALLBACK_PX = 600;
  var DEMO_WINDOW_INSET_PX = 24;
  var DEMO_HOTBAR_SLOT_COUNT = 12;
  var DEMO_HOTBAR_ICON_PATH_PREFIX = "hotbar-demo-icons/";
  var DEMO_HOTBAR_ICON_RG = DEMO_HOTBAR_ICON_PATH_PREFIX + "rg.png";
  var DEMO_HOTBAR_ICON_AM = DEMO_HOTBAR_ICON_PATH_PREFIX + "am.png";
  var DEMO_HOTBAR_ICON_SC = DEMO_HOTBAR_ICON_PATH_PREFIX + "sc.png";
  var DEMO_HOTBAR_ICON_MED = DEMO_HOTBAR_ICON_PATH_PREFIX + "med.png";
  var DEMO_HOTBAR_ICON_TK = DEMO_HOTBAR_ICON_PATH_PREFIX + "tk.png";
  var DEMO_HOTBAR_ICON_GR = DEMO_HOTBAR_ICON_PATH_PREFIX + "gr.png";
  var DEMO_HOTBAR_ICON_BT = DEMO_HOTBAR_ICON_PATH_PREFIX + "bt.png";
  var DEMO_HEALTH = 63;
  var DEMO_MAX_HEALTH = 100;

  var demoHostElement = null;
  var demoWorkspaceElement = null;
  var demoPanelElement = null;
  var demoLinksElement = null;
  var demoBindingsReady = false;
  var demoWindowReady = false;
  var demoVisible = false;

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function isWebMode() {
    return !isUnityHost();
  }

  function getRandomDemoStackCount() {
    return Math.floor(Math.random() * 999) + 1;
  }

  function buildEmptyDemoSlots() {
    var slots = [];
    var index = 0;
    for (index = 0; index < DEMO_HOTBAR_SLOT_COUNT; index += 1) {
      slots.push({ hasItem: false, stack: 0, maxStack: 0, iconDataUrl: "" });
    }
    return slots;
  }

  function applyDemoInventoryPreview() {
    if (!window.WebGameHud || !window.WebGameHud.applyInventoryState) return;
    var slots = buildEmptyDemoSlots();
    slots[0] = {
      hasItem: true,
      stack: 1,
      maxStack: 1,
      iconDataUrl: DEMO_HOTBAR_ICON_RG
    };
    slots[1] = {
      hasItem: true,
      stack: getRandomDemoStackCount(),
      maxStack: 999,
      iconDataUrl: DEMO_HOTBAR_ICON_AM
    };
    slots[2] = {
      hasItem: true,
      stack: getRandomDemoStackCount(),
      maxStack: 999,
      iconDataUrl: DEMO_HOTBAR_ICON_SC
    };
    slots[3] = {
      hasItem: true,
      stack: 1,
      maxStack: 1,
      iconDataUrl: DEMO_HOTBAR_ICON_MED
    };
    slots[4] = {
      hasItem: true,
      stack: 1,
      maxStack: 1,
      iconDataUrl: DEMO_HOTBAR_ICON_TK
    };
    slots[5] = {
      hasItem: true,
      stack: 1,
      maxStack: 1,
      iconDataUrl: DEMO_HOTBAR_ICON_GR
    };
    slots[7] = {
      hasItem: true,
      stack: 1,
      maxStack: 1,
      iconDataUrl: DEMO_HOTBAR_ICON_BT
    };
    window.WebGameHud.applyInventoryState({
      selectedIndex: 2,
      lastSelectedIndex: 0,
      slots: slots
    });
  }

  function applyDemoHealthPreview() {
    if (!window.WebGameHud || !window.WebGameHud.applyHealthState) return;
    window.WebGameHud.applyHealthState({
      health: DEMO_HEALTH,
      maxHealth: DEMO_MAX_HEALTH
    });
  }

  function clearDemoInventoryPreview() {
    if (!window.WebGameHud || !window.WebGameHud.applyInventoryState) return;
    window.WebGameHud.applyInventoryState({
      selectedIndex: -1,
      lastSelectedIndex: -1,
      slots: buildEmptyDemoSlots()
    });
  }

  function clearDemoHealthPreview() {
    if (!window.WebGameHud || !window.WebGameHud.applyHealthState) return;
    window.WebGameHud.applyHealthState({
      health: DEMO_MAX_HEALTH,
      maxHealth: DEMO_MAX_HEALTH
    });
  }

  function bindDemoElements() {
    if (demoHostElement) return;
    demoHostElement = document.getElementById("webFakeConnectDemoHost");
    demoWorkspaceElement = document.getElementById("webFakeConnectDemoWorkspace");
    demoPanelElement = document.getElementById("webFakeConnectDemoPanel");
    demoLinksElement = document.getElementById("webFakeConnectDemoLinks");
  }

  function getDemoWorkspaceBounds() {
    if (!demoWorkspaceElement) return { width: 0, height: 0 };
    var rect = demoWorkspaceElement.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

  function parseCssLengthPx(valueText, fallbackPx) {
    if (!valueText) {
      return fallbackPx;
    }
    var parsed = parseFloat(valueText);
    if (!parsed || parsed <= 0) {
      return fallbackPx;
    }
    return parsed;
  }

  function getDemoWindowDefaultSizePx() {
    bindDemoElements();
    if (!demoPanelElement) {
      return {
        width: DEMO_WINDOW_WIDTH_FALLBACK_PX,
        height: DEMO_WINDOW_HEIGHT_FALLBACK_PX
      };
    }
    var styles = window.getComputedStyle(demoPanelElement);
    return {
      width: parseCssLengthPx(
        styles.getPropertyValue("--web-fake-connect-demo-width"),
        DEMO_WINDOW_WIDTH_FALLBACK_PX
      ),
      height: parseCssLengthPx(
        styles.getPropertyValue("--web-fake-connect-demo-height"),
        DEMO_WINDOW_HEIGHT_FALLBACK_PX
      )
    };
  }

  function setDemoWindowGeometry() {
    var bounds = getDemoWorkspaceBounds();
    var defaultSize = getDemoWindowDefaultSizePx();
    var windowWidth = defaultSize.width;
    var windowHeight = defaultSize.height;
    var maxWidth = bounds.width - DEMO_WINDOW_INSET_PX * 2;
    var maxHeight = bounds.height - DEMO_WINDOW_INSET_PX * 2;

    if (maxWidth > 0 && windowWidth > maxWidth) {
      windowWidth = maxWidth;
    }
    if (maxHeight > 0 && windowHeight > maxHeight) {
      windowHeight = maxHeight;
    }
    if (windowWidth < 280) {
      windowWidth = 280;
    }
    if (windowHeight < 240) {
      windowHeight = 240;
    }

    demoPanelElement.wmState = {
      left: Math.max(DEMO_WINDOW_INSET_PX, Math.round((bounds.width - windowWidth) * 0.5)),
      top: Math.max(DEMO_WINDOW_INSET_PX, Math.round((bounds.height - windowHeight) * 0.5)),
      width: windowWidth,
      height: windowHeight,
      minWidth: 200,
      minHeight: 200
    };

    if (window.WebWindowManager.applyWindowRect) {
      window.WebWindowManager.applyWindowRect(demoPanelElement);
    }
  }

  function prepareDemoWindowLayout() {
    bindDemoElements();
    if (!demoPanelElement || !demoWorkspaceElement) return;
    if (!window.WebWindowManager) return;

    if (window.WebWindowManager.removeSavedLayout) {
      window.WebWindowManager.removeSavedLayout(DEMO_PRESET);
    }

    if (window.WebWindowManager.ensureWindowStructure) {
      window.WebWindowManager.ensureWindowStructure(demoPanelElement);
    }

    demoPanelElement.wmHasInlineLayout = false;
    demoPanelElement.wmState = null;

    setDemoWindowGeometry();

    if (window.WebWindowManager.clampManagedWindowToContainer) {
      window.WebWindowManager.clampManagedWindowToContainer(demoPanelElement);
    }

    if (window.WebWindowManager.focusWindow) {
      window.WebWindowManager.focusWindow(demoPanelElement);
    }

    demoWindowReady = true;
  }

  function bindDemoEvents() {
    if (demoBindingsReady) return;
    bindDemoElements();
    if (!demoHostElement) return;

    var backButton = document.getElementById("btnWebFakeConnectBack");
    if (backButton) {
      backButton.addEventListener("click", function (event) {
        event.preventDefault();
        exitToMainMenu();
      });
    }

    demoHostElement.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var linkRow = target.closest(".extras-link-row");
      if (!linkRow) return;
      event.stopPropagation();
      var href = linkRow.getAttribute("data-extras-href");
      var label = linkRow.getAttribute("data-extras-label");
      if (!href) return;
      if (window.WebExtras && window.WebExtras.requestLinkOpen) {
        window.WebExtras.requestLinkOpen(href, label);
      }
    });

    demoBindingsReady = true;
  }

  function setWebFakeConnectHudMode(enabled) {
    var deviceElement = document.getElementById("device");
    if (enabled) {
      if (deviceElement) {
        deviceElement.classList.add("menu-mode--web-fake-connect");
      }
    } else {
      if (deviceElement) {
        deviceElement.classList.remove("menu-mode--web-fake-connect");
      }
    }
  }

  function setHudLayerActive(active) {
    if (window.WebGameHud && window.WebGameHud.setGameplayHudLayerActive) {
      window.WebGameHud.setGameplayHudLayerActive(active === true);
    }
  }

  function setMenuLayer(layerName) {
    if (!window.WebMenuLayers || !window.WebMenuLayers.setActiveLayer) return;
    window.WebMenuLayers.setActiveLayer(layerName);
  }

  function populateDemoLinks() {
    bindDemoElements();
    if (!demoLinksElement) return;
    if (window.WebExtras && window.WebExtras.renderLinksInto) {
      window.WebExtras.renderLinksInto(demoLinksElement);
    }
  }

  function showDemoTerminal() {
    bindDemoElements();
    bindDemoEvents();
    if (!demoHostElement) return;
    function finishShowDemoTerminal() {
      demoHostElement.hidden = false;
      demoHostElement.classList.add("is-open");
      populateDemoLinks();
      if (window.WebLocale && window.WebLocale.applyDom) {
        window.WebLocale.applyDom();
      }
      prepareDemoWindowLayout();
      document.documentElement.classList.add("web-fake-connect-demo-open");
      demoVisible = true;
    }
    finishShowDemoTerminal();
  }

  function hideDemoTerminal() {
    bindDemoElements();
    if (!demoHostElement) return;
    demoHostElement.classList.remove("is-open");
    demoHostElement.hidden = true;
    document.documentElement.classList.remove("web-fake-connect-demo-open");
    demoVisible = false;
    demoWindowReady = false;
    if (demoPanelElement) {
      demoPanelElement.wmHasInlineLayout = false;
      demoPanelElement.wmState = null;
    }
  }

  function onDemoWindowCloseRequest(event) {
    if (!event || !event.detail) return;
    if (event.detail.preset !== DEMO_PRESET) return;
    exitToMainMenu();
  }

  function onLoadingComplete() {
    if (!isWebMode()) return;

    document.documentElement.classList.add("web-fake-connect-active");
    setWebFakeConnectHudMode(true);
    setMenuLayer(LAYER_HUD);
    setHudLayerActive(true);
    applyDemoInventoryPreview();
    applyDemoHealthPreview();

    window.setTimeout(function () {
      showDemoTerminal();
    }, HUD_PAUSE_MS);
  }

  function exitToMainMenu() {
    if (!isWebMode()) return;

    hideDemoTerminal();
    clearDemoInventoryPreview();
    clearDemoHealthPreview();
    document.documentElement.classList.remove("web-fake-connect-active");
    setHudLayerActive(false);
    setWebFakeConnectHudMode(false);
    setMenuLayer(LAYER_MENU);

    if (window.WebMenu && window.WebMenu.goToIndexPage) {
      window.WebMenu.goToIndexPage();
    }
  }

  window.WebFakeConnectDemo = {
    onLoadingComplete: onLoadingComplete,
    exitToMainMenu: exitToMainMenu,
    isDemoVisible: function () {
      return demoVisible;
    }
  };

  window.addEventListener(DEMO_CLOSE_EVENT, onDemoWindowCloseRequest);

  window.addEventListener("web-locale-applied", function () {
    if (!demoVisible) return;
    if (window.WebLocale && window.WebLocale.applyDom) {
      window.WebLocale.applyDom();
    }
    populateDemoLinks();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindDemoEvents);
  } else {
    bindDemoEvents();
  }
})();
