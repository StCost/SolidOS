(function () {
  var pendingState = null;
  var textElement = null;
  var fillElement = null;
  var percentElement = null;
  var barElement = null;
  var rootElement = null;
  var BACKGROUND_TRANSPARENT_CLASS = "loading-background-transparent";
  var LOADING_STEP_COUNT = 4;

  function clampProgress(progress) {
    if (progress < 0) return 0;
    if (progress > 1) return 1;
    return progress;
  }

  function bindRoot() {
    if (rootElement) return;
    rootElement = document.getElementById("loadingRoot");
  }

  function setBackgroundTransparentTransition(enabled) {
    bindRoot();
    if (!rootElement) return;
    if (enabled) rootElement.classList.add(BACKGROUND_TRANSPARENT_CLASS);
    else rootElement.classList.remove(BACKGROUND_TRANSPARENT_CLASS);
  }

  function applyState(payload) {
    if (!payload) return;
    pendingState = payload;

    if (!textElement) {
      bindElements();
    }

    if (payload.text != null && textElement) {
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

  function bindElements() {
    bindRoot();
    textElement = document.getElementById("loadingText");
    fillElement = document.getElementById("loadingBarFill");
    percentElement = document.getElementById("loadingPercent");
    barElement = document.querySelector(".loading-bar");
    if (pendingState) applyState(pendingState);
  }

  function applyBootStep(stepIndex) {
    var clampedIndex = stepIndex;
    if (clampedIndex < 0) {
      clampedIndex = 0;
    }
    if (clampedIndex >= LOADING_STEP_COUNT) {
      clampedIndex = LOADING_STEP_COUNT - 1;
    }
    applyState({
      progress: (clampedIndex + 1) / LOADING_STEP_COUNT
    });
  }

  window.WebLoading = {
    applyState: applyState,
    applyBootStep: applyBootStep,
    setBackgroundTransparentTransition: setBackgroundTransparentTransition
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindElements);
  } else {
    bindElements();
  }
})();
