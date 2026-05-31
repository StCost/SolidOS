(function () {
  var menu = WebMenu;

  function isGameMode() {
    if (window.WebMenuMode === "game") return true;
    var device = document.getElementById("device");
    return !!device && device.classList.contains("menu-mode--game");
  }

  function openSettingsFromUnity() {
    if (window.WebSettingsBridge) {
      WebSettingsBridge.open();
      if (window.WebSettings && window.WebSettings.refreshOnOpen) {
        window.WebSettings.refreshOnOpen();
      }
    } else {
      window.dispatchEvent(new CustomEvent("web-settings-open"));
    }
  }

  var creditButton = document.getElementById("btnCredit");
  if (creditButton) {
    creditButton.addEventListener("click", function () {
      menu.goToCreditsPage();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (isGameMode()) return;

    if (window.WebExtras && window.WebExtras.handleEscape && window.WebExtras.handleEscape()) {
      return;
    }

    if (menu.getCurrentPageId() !== menu.PAGE_MENU) {
      menu.goToIndexPage();
      return;
    }
  });

  window.addEventListener("web-settings-open", function () {
    openSettingsFromUnity();
  });
})();
