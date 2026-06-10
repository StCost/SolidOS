var WebDesktopAppIcons = (function () {
  var DESKTOP_ICONS_BASE = "desktop-app-icons/";

  var PRESET_TO_ICON = {
    "menu-splash": "title",
    "connect-col-0": "worlds",
    "connect-col-1": "servers",
    "connect-col-2": "steam",
    "settings-content": "settings",
    "extras-games": "games",
    "extras-art": "art",
    "extras-links": "links",
    "credits-content": "credits",
    "modal-center": "links"
  };

  function getDesktopIconSrc(iconId) {
    if (!iconId) return "";
    return DESKTOP_ICONS_BASE + iconId + ".svg";
  }

  function createAppIconImage(iconSrc, className, pixelSize) {
    var imageElement = document.createElement("img");
    imageElement.className = className;
    imageElement.src = iconSrc;
    imageElement.alt = "";
    imageElement.draggable = false;
    imageElement.width = pixelSize;
    imageElement.height = pixelSize;
    return imageElement;
  }

  function ensureDesktopIconGlyph(iconElement) {
    var iconId = iconElement.getAttribute("data-desktop-icon");
    var glyphElement = iconElement.querySelector(".os-desktop-icon-glyph");
    if (!glyphElement || !iconId) return;

    if (glyphElement.querySelector(".os-app-icon")) return;

    var legacyInner = glyphElement.querySelector(".os-desktop-icon-glyph-inner");
    if (legacyInner && legacyInner.parentNode) {
      legacyInner.parentNode.removeChild(legacyInner);
    }

    var iconSrc = getDesktopIconSrc(iconId);
    if (!iconSrc) return;

    var pixelSize = 52;
    if (window.WebDesktop && window.WebDesktop.getDesktopIconImagePixelSize) {
      pixelSize = window.WebDesktop.getDesktopIconImagePixelSize();
    }
    glyphElement.appendChild(createAppIconImage(iconSrc, "os-app-icon", pixelSize));
  }

  function mountDesktopIcons() {
    var iconElements = document.querySelectorAll(".os-desktop-icon[data-desktop-icon]");
    var index = 0;
    for (index = 0; index < iconElements.length; index++) {
      ensureDesktopIconGlyph(iconElements[index]);
    }
  }

  function getIconIdForWindow(windowElement) {
    if (!windowElement) return "";
    var presetName = windowElement.getAttribute("data-wm-preset");
    if (presetName && Object.prototype.hasOwnProperty.call(PRESET_TO_ICON, presetName)) {
      return PRESET_TO_ICON[presetName];
    }
    var iconId = windowElement.getAttribute("data-wm-icon");
    if (iconId) return iconId;
    return "";
  }

  function insertWindowTitleIcon(titleElement, iconElement) {
    var textElement = titleElement.querySelector(".os-window-title-text");
    if (textElement) {
      titleElement.insertBefore(iconElement, textElement);
      return;
    }

    var firstChild = titleElement.firstChild;
    if (firstChild) {
      titleElement.insertBefore(iconElement, firstChild);
      return;
    }
    titleElement.appendChild(iconElement);
  }

  function ensureWindowTitleIcon(titleElement, iconId) {
    if (!titleElement || !iconId) return;

    var iconSrc = getDesktopIconSrc(iconId);
    if (!iconSrc) return;

    setWindowTitleIconSrc(titleElement, iconSrc);
  }

  function setWindowTitleIconSrc(titleElement, iconSrc) {
    if (!titleElement || !iconSrc) return;

    wrapWindowTitleText(titleElement);

    var existingIcon = titleElement.querySelector(".os-window-title-icon");
    if (existingIcon) {
      existingIcon.src = iconSrc;
      return;
    }

    insertWindowTitleIcon(titleElement, createAppIconImage(iconSrc, "os-window-title-icon", 16));
  }

  function ensureWindowTitleStructure(titleElement) {
    if (!titleElement) return;
    wrapWindowTitleText(titleElement);
  }

  function wrapWindowTitleText(titleElement) {
    if (!titleElement || titleElement.querySelector(".os-window-title-text")) return;

    var localeKey = titleElement.getAttribute("data-locale-key");
    var textContent = titleElement.textContent;
    titleElement.textContent = "";

    var textSpan = document.createElement("span");
    textSpan.className = "os-window-title-text";
    if (localeKey) {
      textSpan.setAttribute("data-locale-key", localeKey);
      titleElement.removeAttribute("data-locale-key");
    }
    textSpan.textContent = textContent;
    titleElement.appendChild(textSpan);
  }

  function mountWindowTitleIcons() {
    var windowElements = document.querySelectorAll(".os-window[data-wm-preset], .os-window.extras-art-window");
    var index = 0;
    for (index = 0; index < windowElements.length; index++) {
      var windowElement = windowElements[index];
      var presetName = windowElement.getAttribute("data-wm-preset");
      if (presetName === "extras-games") {
        continue;
      }
      var iconId = getIconIdForWindow(windowElement);
      if (!iconId && windowElement.classList.contains("extras-art-window")) {
        iconId = "art";
      }
      if (!iconId) continue;

      var titleElement = windowElement.querySelector(".os-window-title");
      if (!titleElement) continue;

      wrapWindowTitleText(titleElement);
      ensureWindowTitleIcon(titleElement, iconId);
    }
  }

  function init() {
    mountDesktopIcons();
    mountWindowTitleIcons();
    window.addEventListener("web-locale-applied", mountWindowTitleIcons);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    getDesktopIconSrc: getDesktopIconSrc,
    getIconIdForPreset: function (presetName) {
      if (!presetName) return "";
      if (Object.prototype.hasOwnProperty.call(PRESET_TO_ICON, presetName)) {
        return PRESET_TO_ICON[presetName];
      }
      return "";
    },
    ensureWindowTitleStructure: ensureWindowTitleStructure,
    setWindowTitleIconSrc: setWindowTitleIconSrc,
    mountDesktopIcons: mountDesktopIcons,
    mountWindowTitleIcons: mountWindowTitleIcons
  };
})();
