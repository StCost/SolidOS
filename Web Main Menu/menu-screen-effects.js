(function () {
  var CLASS_EFFECTS_PAUSED = "menu-screen-effects-paused";
  var CLASS_DEFER_ANIMATIONS = "menu-defer-animations";
  var CLASS_BOOT_PENDING = "menu-boot-pending";
  var CLASS_LAYER_MENU = "menu-web-layer-menu";
  var CLASS_LAYER_LOADING = "menu-web-layer-loading";

  var deviceElement = null;
  var welcomeBootElement = null;

  function bindElements() {
    if (!deviceElement) {
      deviceElement = document.getElementById("device");
    }
    if (!welcomeBootElement) {
      welcomeBootElement = document.getElementById("menuWelcomeBoot");
    }
  }

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function isMenuLayerActive() {
    var htmlElement = document.documentElement;
    if (!htmlElement) return false;
    if (htmlElement.classList.contains(CLASS_LAYER_MENU)) return true;
    if (htmlElement.classList.contains(CLASS_LAYER_LOADING)) return true;
    if (!isUnityHost() && !htmlElement.classList.contains("menu-web-layer-hud")) {
      return true;
    }
    return false;
  }

  function hasOpenDesktopWindow() {
    var desktopSurface = document.getElementById("desktopSurface");
    var windows;
    var index;
    if (!desktopSurface) return false;
    windows = desktopSurface.querySelectorAll(".os-window[data-wm-preset]");
    for (index = 0; index < windows.length; index += 1) {
      if (!windows[index].classList.contains("os-window--closed")) {
        return true;
      }
    }
    return false;
  }

  function shouldPauseScreenEffects() {
    bindElements();
    if (deviceElement && deviceElement.classList.contains(CLASS_DEFER_ANIMATIONS)) {
      return true;
    }
    if (deviceElement && deviceElement.classList.contains(CLASS_BOOT_PENDING)) {
      return true;
    }
    if (deviceElement && deviceElement.hidden) {
      return true;
    }
    if (!isMenuLayerActive()) {
      return true;
    }
    if (!hasOpenDesktopWindow()) {
      return true;
    }
    return false;
  }

  function setScreenEffectsPaused(screenElement, paused) {
    if (!screenElement) return;
    if (paused) {
      screenElement.classList.add(CLASS_EFFECTS_PAUSED);
      return;
    }
    screenElement.classList.remove(CLASS_EFFECTS_PAUSED);
  }

  function syncScreenEffectsAnimationState() {
    var paused = shouldPauseScreenEffects();
    bindElements();
    setScreenEffectsPaused(deviceElement, paused);
    if (welcomeBootElement && !welcomeBootElement.hidden) {
      setScreenEffectsPaused(welcomeBootElement, paused);
      return;
    }
    setScreenEffectsPaused(welcomeBootElement, true);
  }

  function initScreenEffectsSync() {
    bindElements();
    syncScreenEffectsAnimationState();
    window.addEventListener("web-desktop-window-closed", syncScreenEffectsAnimationState);
    window.addEventListener("web-menu-boot-dismissed", syncScreenEffectsAnimationState);
    window.addEventListener("web-menu-canvas-shown", syncScreenEffectsAnimationState);
    window.addEventListener("resize", syncScreenEffectsAnimationState);
  }

  window.WebMenuScreenEffects = {
    sync: syncScreenEffectsAnimationState
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScreenEffectsSync);
  } else {
    initScreenEffectsSync();
  }
})();
