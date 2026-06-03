(function () {

  var BOOT_TEXT_KEYS = ["loading0", "loading1", "loading2", "loading3"];

  var BOOT_STEP_COUNT = BOOT_TEXT_KEYS.length;

  var DISMISS_TRANSITION_MS = 480;

  var FAKE_CONNECT_STEP_MS = 900;

  var EVENT_BOOT_CONTENT_READY = "web-menu-boot-content-ready";

  var UNITY_EVENT_BOOT_CONTENT_READY = "web-menu-boot-ready";

  var LINKS_PRESET = "extras-links";



  var pendingState = null;

  var rootElement = null;

  var deviceElement = null;

  var loadingPanelElement = null;

  var textElement = null;

  var titleElement = null;

  var fillElement = null;

  var percentElement = null;

  var barElement = null;

  var dismissed = false;

  var welcomeOnlyMode = true;

  var unityControlledLoading = false;

  var localeReady = false;

  var modulesReady = false;

  var desktopReady = false;

  var contentReady = false;



  function isUnityHost() {

    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;

  }



  function getBootText(stepIndex) {

    var key = BOOT_TEXT_KEYS[stepIndex];

    if (window.WebLocale && window.WebLocale.get) {

      return window.WebLocale.get(key, "");

    }

    return "";

  }



  function getProgressForStep(stepIndex) {

    return (stepIndex + 1) / BOOT_STEP_COUNT;

  }



  function clampProgress(progress) {

    if (progress < 0) return 0;

    if (progress > 1) return 1;

    return progress;

  }



  function readLocaleReadyFromDom() {

    return document.documentElement.classList.contains("locale-ready");

  }



  function readModulesReadyFromDom() {

    if (window.__cmMenuBootModulesReady) {

      return true;

    }

    if (!document.getElementById("device")) {

      return false;

    }

    if (!document.getElementById("pageMenu")) {

      return false;

    }

    if (!document.getElementById("desktopWorkspace")) {

      return false;

    }

    return false;

  }



  function readDesktopReadyFromDom() {

    if (window.__cmMenuBootDesktopReady) {

      return true;

    }

    var desktopIconsRoot = document.getElementById("desktopIcons");

    if (!desktopIconsRoot) {

      return false;

    }

    return !!desktopIconsRoot.querySelector(".os-desktop-icon[data-desktop-icon]");

  }



  function isContentReady() {

    return localeReady && modulesReady && desktopReady;

  }



  function syncReadinessFromDom() {

    if (!localeReady && readLocaleReadyFromDom()) {

      markLocaleReady();

    }

    if (!modulesReady && readModulesReadyFromDom()) {

      markModulesReady();

    }

    if (!desktopReady && readDesktopReadyFromDom()) {

      markDesktopReady();

    }

  }



  function bindBootElements() {

    loadingPanelElement = document.getElementById("menuWelcomeLoadingPanel");

  }



  function bindLoadingElements() {

    textElement = document.getElementById("menuWelcomeLoadingText");

    titleElement = document.getElementById("menuWelcomeLoadingTitle");

    fillElement = document.getElementById("menuWelcomeBarFill");

    percentElement = document.getElementById("menuWelcomePercent");

    barElement = document.getElementById("menuWelcomeBar");

  }



  function bindElements() {

    rootElement = document.getElementById("menuWelcomeBoot");

    deviceElement = document.getElementById("device");

    bindBootElements();

    bindLoadingElements();

    if (!welcomeOnlyMode && pendingState) {

      applyState(pendingState);

    }

  }



  function setWelcomeOnlyMode(enabled) {

    welcomeOnlyMode = enabled;

    if (!rootElement) {

      rootElement = document.getElementById("menuWelcomeBoot");

    }

    if (!rootElement) return;

    if (enabled) {

      rootElement.classList.remove("menu-welcome-boot--loading-mode");

      if (loadingPanelElement) {

        loadingPanelElement.hidden = true;

      }

      return;

    }

    rootElement.classList.add("menu-welcome-boot--loading-mode");

    if (loadingPanelElement) {

      loadingPanelElement.hidden = false;

    }

    bindLoadingElements();

    if (pendingState) {

      applyState(pendingState);

    }

  }



  function setDeviceBootPending(pending) {

    if (!deviceElement) {

      deviceElement = document.getElementById("device");

    }

    if (!deviceElement) return;

    if (pending) {

      deviceElement.classList.add("menu-boot-pending");

    } else {

      deviceElement.classList.remove("menu-boot-pending");

    }

  }



  function applyState(payload) {

    if (!payload) return;

    pendingState = payload;

    if (welcomeOnlyMode) return;

    if (!textElement) {

      bindLoadingElements();

    }

    if (!textElement) return;

    if (payload.header != null) {
      if (!titleElement) {
        bindLoadingElements();
      }
      if (titleElement) {
        titleElement.textContent = payload.header;
      }
    }

    if (payload.text != null) {

      textElement.textContent = payload.text;

    }



    if (payload.progress != null) {

      var progress = clampProgress(payload.progress);

      var percent = Math.round(progress * 100);

      if (fillElement) {

        fillElement.style.width = String(percent) + "%";

      }

      if (percentElement) {

        percentElement.textContent = String(percent) + "%";

      }

      if (barElement) {

        barElement.setAttribute("aria-valuenow", String(percent));

      }

    }

  }



  function applyBootStep(stepIndex) {

    if (welcomeOnlyMode) return;

    var clampedIndex = stepIndex;

    if (clampedIndex < 0) {

      clampedIndex = 0;

    }

    if (clampedIndex >= BOOT_STEP_COUNT) {

      clampedIndex = BOOT_STEP_COUNT - 1;

    }

    applyState({

      text: getBootText(clampedIndex),

      progress: getProgressForStep(clampedIndex)

    });

  }



  function setBackgroundTransparentTransition(enabled) {

    if (!rootElement) return;

    if (enabled) {

      rootElement.classList.add("loading-background-transparent");

    } else {

      rootElement.classList.remove("loading-background-transparent");

    }

  }



  function markLocaleReady() {

    if (localeReady) return;

    localeReady = true;

    tryFinishBoot();

  }



  function markModulesReady() {

    if (modulesReady) return;

    modulesReady = true;

    tryFinishBoot();

  }



  function markDesktopReady() {

    if (desktopReady) return;

    desktopReady = true;

    tryFinishBoot();

  }



  function notifyBootContentReady() {

    if (contentReady) return;

    contentReady = true;

    window.dispatchEvent(new CustomEvent(EVENT_BOOT_CONTENT_READY));

    if (isUnityHost()) {

      window.vuplex.postMessage(

        JSON.stringify({ eventName: UNITY_EVENT_BOOT_CONTENT_READY })

      );

    }

  }



  function tryFinishBoot() {

    syncReadinessFromDom();

    if (dismissed) return;

    if (unityControlledLoading) return;

    if (!isContentReady()) return;

    notifyBootContentReady();

    dismiss();

  }



  function showForLoading() {

    bindElements();

    unityControlledLoading = true;

    dismissed = false;

    setWelcomeOnlyMode(false);

    bindLoadingElements();

    if (pendingState) {

      applyState(pendingState);

    }

    if (rootElement) {

      rootElement.hidden = false;

      rootElement.classList.remove("menu-boot-dismissed");

    }

    setDeviceBootPending(true);

  }



  function show() {

    bindElements();

    dismissed = false;

    setWelcomeOnlyMode(false);

    if (rootElement) {

      rootElement.hidden = false;

      rootElement.classList.remove("menu-boot-dismissed");

    }

    setDeviceBootPending(true);

    syncReadinessFromDom();

    if (isContentReady()) {

      tryFinishBoot();

    }

  }



  function dismiss() {

    if (dismissed) {

      setDeviceBootPending(false);

      return;

    }

    dismissed = true;

    unityControlledLoading = false;

    setDeviceBootPending(false);

    if (rootElement) {

      rootElement.classList.add("menu-boot-dismissed");

      window.setTimeout(function () {

        if (rootElement) {

          rootElement.hidden = true;

        }

        setWelcomeOnlyMode(true);

        window.dispatchEvent(new CustomEvent("web-menu-boot-dismissed"));

      }, DISMISS_TRANSITION_MS);

      return;

    }

    setWelcomeOnlyMode(true);

    window.dispatchEvent(new CustomEvent("web-menu-boot-dismissed"));

  }



  function requestUnityDismiss() {
    if (unityControlledLoading) return;
    dismiss();
  }



  function openLinksAfterFakeConnect() {
    if (window.WebWindowManager && window.WebWindowManager.removeSavedLayout) {
      window.WebWindowManager.removeSavedLayout(LINKS_PRESET);
    }
    if (window.WebDesktop && window.WebDesktop.openLinksDesktop) {
      window.WebDesktop.openLinksDesktop();
    }
    var linksWindow = null;
    if (window.WebDesktop && window.WebDesktop.getWindowByPreset) {
      linksWindow = window.WebDesktop.getWindowByPreset(LINKS_PRESET);
    }
    if (linksWindow && window.WebWindowManager) {
      if (window.WebWindowManager.syncWindowLayout) {
        window.WebWindowManager.syncWindowLayout(linksWindow);
      }
      if (window.WebWindowManager.focusWindow) {
        window.WebWindowManager.focusWindow(linksWindow);
      }
    }
    if (window.WebExtras && window.WebExtras.openLinksPanel) {
      window.WebExtras.openLinksPanel(linksWindow);
    }
  }



  function runFakeConnectLoading(onComplete, destinationHeader) {

    bindElements();

    unityControlledLoading = true;

    dismissed = false;

    setWelcomeOnlyMode(false);

    bindLoadingElements();

    if (destinationHeader) {
      applyState({ header: destinationHeader });
    }

    if (rootElement) {

      rootElement.hidden = false;

      rootElement.classList.remove("menu-boot-dismissed");

    }

    setDeviceBootPending(true);



    var stepIndex = 0;

    applyBootStep(stepIndex);



    function advanceStep() {

      if (stepIndex >= BOOT_STEP_COUNT - 1) {

        window.setTimeout(function () {

          unityControlledLoading = false;

          dismiss();

          openLinksAfterFakeConnect();

          if (onComplete) {

            onComplete();

          }

        }, FAKE_CONNECT_STEP_MS);

        return;

      }

      stepIndex = stepIndex + 1;

      applyBootStep(stepIndex);

      window.setTimeout(advanceStep, FAKE_CONNECT_STEP_MS);

    }



    window.setTimeout(advanceStep, FAKE_CONNECT_STEP_MS);

  }



  function watchLocaleReady() {

    if (readLocaleReadyFromDom()) {

      markLocaleReady();

      return;

    }

    var observer = new MutationObserver(function () {

      if (!readLocaleReadyFromDom()) {

        return;

      }

      observer.disconnect();

      markLocaleReady();

    });

    observer.observe(document.documentElement, {

      attributes: true,

      attributeFilter: ["class"]

    });

  }



  function initBootTracking() {

    bindElements();

    setWelcomeOnlyMode(true);

    setDeviceBootPending(true);

    watchLocaleReady();



    window.addEventListener("web-menu-boot-modules-ready", markModulesReady);

    window.addEventListener("web-desktop-icons-ready", markDesktopReady);

    window.addEventListener("web-menu-boot-dismiss", requestUnityDismiss);



    syncReadinessFromDom();

    window.setTimeout(syncReadinessFromDom, 0);

  }



  window.WebMenuBoot = {

    applyState: applyState,

    applyBootStep: applyBootStep,

    setBackgroundTransparentTransition: setBackgroundTransparentTransition,

    show: show,

    showForLoading: showForLoading,

    dismiss: dismiss,

    requestUnityDismiss: requestUnityDismiss,

    runFakeConnectLoading: runFakeConnectLoading,

    openLinksAfterFakeConnect: openLinksAfterFakeConnect,

    isContentReady: isContentReady,

    syncReadinessFromDom: syncReadinessFromDom

  };



  window.WebLoading = window.WebMenuBoot;



  if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", initBootTracking);

  } else {

    initBootTracking();

  }

})();

