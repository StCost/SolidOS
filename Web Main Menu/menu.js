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

  var titleTechList = document.getElementById("titleTechList");
  if (titleTechList) {
    titleTechList.addEventListener("click", function (event) {
      var target = event.target;
      var techLink;
      var href;
      var label;
      if (!target || !target.closest) return;
      techLink = target.closest(".term-tech-link");
      if (!techLink || !titleTechList.contains(techLink)) return;
      event.stopPropagation();
      href = techLink.getAttribute("data-tech-href");
      label = techLink.getAttribute("data-tech-label");
      if (!href) return;
      if (window.WebExtras && window.WebExtras.requestLinkOpen) {
        window.WebExtras.requestLinkOpen(href, label || href);
        return;
      }
      window.open(href, "_blank", "noopener,noreferrer");
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
    if (window.WebSettingsBridge) {
      window.WebSettingsBridge.open();
    }
  });
})();
