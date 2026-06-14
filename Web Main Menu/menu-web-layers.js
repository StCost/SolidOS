(function () {
  var LAYER_LOADING = "loading";
  var LAYER_MENU = "menu";
  var LAYER_HUD = "hud";

  var activeLayer = "";

  function isUnityHost() {
    return !!(window.vuplex && window.vuplex.postMessage);
  }

  function setHtmlLayerClass(layer) {
    var html = document.documentElement;
    if (!html) return;
    html.classList.remove(
      "menu-web-layer-loading",
      "menu-web-layer-menu",
      "menu-web-layer-hud"
    );
    if (layer) {
      html.classList.add("menu-web-layer-" + layer);
    }
  }

  function showBootLoadingPanel() {
    if (window.WebMenuBoot && window.WebMenuBoot.showForLoading) {
      window.WebMenuBoot.showForLoading();
      return;
    }
    if (window.WebMenuBoot && window.WebMenuBoot.show) {
      window.WebMenuBoot.show();
    }
  }

  function setActiveLayer(layer) {
    if (layer !== LAYER_LOADING && layer !== LAYER_MENU && layer !== LAYER_HUD) {
      return;
    }
    if (activeLayer === layer) {
      return;
    }

    activeLayer = layer;
    setHtmlLayerClass(layer);

    if (window.WebMenuScreenEffects && window.WebMenuScreenEffects.sync) {
      window.WebMenuScreenEffects.sync();
    }

    if (layer === LAYER_LOADING) {
      var bootRoot = document.getElementById("menuWelcomeBoot");
      if (bootRoot) {
        bootRoot.classList.remove("menu-web-layer-boot-hidden");
      }
      showBootLoadingPanel();
      return;
    }

    var bootRootHidden = document.getElementById("menuWelcomeBoot");
    if (bootRootHidden) {
      bootRootHidden.classList.add("menu-web-layer-boot-hidden");
    }

    if (layer === LAYER_MENU) {
      if (window.WebGameHud && window.WebGameHud.setGameplayHudLayerActive) {
        window.WebGameHud.setGameplayHudLayerActive(false);
      }
      return;
    }

    if (layer === LAYER_HUD) {
      if (window.WebGameHud && window.WebGameHud.setGameplayHudLayerActive) {
        window.WebGameHud.setGameplayHudLayerActive(true);
      }
    }
  }

  window.WebMenuLayers = {
    LAYER_LOADING: LAYER_LOADING,
    LAYER_MENU: LAYER_MENU,
    LAYER_HUD: LAYER_HUD,
    setActiveLayer: setActiveLayer,
    getActiveLayer: function () {
      return activeLayer;
    }
  };

  function setUnityHostClass() {
    var html = document.documentElement;
    if (!html) {
      return;
    }
    if (isUnityHost()) {
      html.classList.add("menu-unity-host");
      return;
    }
    html.classList.remove("menu-unity-host");
    html.classList.remove("menu-unity-custom-cursor");
  }

  setUnityHostClass();

  if (isUnityHost()) {
    return;
  }

  setActiveLayer(LAYER_MENU);
})();
