(function () {
  var pendingState = null;
  var textElement = null;
  var fillElement = null;
  var percentElement = null;
  var barElement = null;

  function clampProgress(progress) {
    if (progress < 0) return 0;
    if (progress > 1) return 1;
    return progress;
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
    textElement = document.getElementById("loadingText");
    fillElement = document.getElementById("loadingBarFill");
    percentElement = document.getElementById("loadingPercent");
    barElement = document.querySelector(".loading-bar");
    if (pendingState) applyState(pendingState);
  }

  window.WebLoading = {
    applyState: applyState
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindElements);
  } else {
    bindElements();
  }
})();
