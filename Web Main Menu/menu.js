(function () {
  var menu = WebMenu;
  var pageStart = document.getElementById("pageStart");
  var pageSettings = document.getElementById("pageSettings");
  var pageCredits = document.getElementById("pageCredits");

  function isGameMode() {
    if (window.WebMenuMode === "game") return true;
    var device = document.getElementById("device");
    return !!device && device.classList.contains("menu-mode--game");
  }

  function openSettingsFromUnity() {
    if (window.WebSettingsBridge) {
      WebSettingsBridge.open();
    } else {
      window.dispatchEvent(new CustomEvent("web-settings-open"));
    }
  }

  document.getElementById("btnStart").addEventListener("click", function () {
    if (isGameMode()) {
      menu.dispatchMenuEvent("web-start", {});
      return;
    }

    menu.goToStartPage();
  });

  document.getElementById("btnSettings").addEventListener("click", function () {
    menu.goToSettingsPage();
    openSettingsFromUnity();
  });

  document.getElementById("btnCredit").addEventListener("click", function () {
    menu.goToCreditsPage();
  });

  document.getElementById("btnCreditsBack").addEventListener("click", function () {
    menu.goToIndexPage();
  });

  document.getElementById("btnSettingsClose").addEventListener("click", function () {
    menu.goToIndexPage();
  });

  document.getElementById("btnExit").addEventListener("click", function () {
    menu.dispatchMenuEvent("web-exit");
    if (!isGameMode() && window.close) {
      window.close();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (isGameMode()) return;

    if (pageSettings && !pageSettings.hidden) {
      menu.goToIndexPage();
      return;
    }

    if (pageCredits && !pageCredits.hidden) {
      menu.goToIndexPage();
      return;
    }

    if (pageStart && !pageStart.hidden) {
      menu.goToIndexPage();
    }
  });
})();
