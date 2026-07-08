(function () {
  var EVENT_MARKER_SAVE = "web-map-marker-save";
  var EVENT_MARKER_DELETE = "web-map-marker-delete";
  var EVENT_MARKER_CANCEL = "web-map-marker-cancel";
  var EVENT_POINTER_CAPTURE = "web-map-ui-capture";

  var MARKER_ICON_IDS = [
    "pin",
    "flag",
    "star",
    "circle",
    "diamond",
    "triangle",
    "home",
    "exclaim",
    "skull"
  ];

  var ICON_PATHS = {
    pin: '<path fill-rule="evenodd" clip-rule="evenodd" d="M12 1.5C7.9 1.5 4.5 4.9 4.5 9c0 5.6 7.5 13.5 7.5 13.5S19.5 14.6 19.5 9c0-4.1-3.4-7.5-7.5-7.5zm0 4.8A2.7 2.7 0 1 0 12 11.7 2.7 2.7 0 0 0 12 6.3z"/>',
    flag: '<path d="M6 2a1.4 1.4 0 0 1 1.4 1.4V22H4.6V3.4A1.4 1.4 0 0 1 6 2z"/><path d="M7.4 3.6h11.2c.7 0 1 .8.5 1.3l-2.6 2.9 2.6 2.9c.5.5.2 1.3-.5 1.3H7.4z"/>',
    star: '<path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.9 6.1 20.8l1.2-6.6L2.5 9.6l6.6-.9z"/>',
    circle: '<circle cx="12" cy="12" r="8.5"/>',
    diamond: '<path d="M12 2l10 10-10 10L2 12z"/>',
    triangle: '<path d="M12 2.5l9.5 18.5H2.5z"/>',
    home: '<path d="M12 2.5L2 11h2.6v10.5h5.1v-6.3h4.6v6.3h5.1V11H22z"/>',
    exclaim: '<path d="M10.4 3.2h3.2l-.55 10.4h-2.1z"/><circle cx="12" cy="18.6" r="1.9"/>',
    skull: '<path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C7 2 3.5 5.4 3.5 9.9c0 2.6 1.2 4.6 3 5.9v2.3c0 .8.6 1.4 1.4 1.4h.6v1.1c0 .5.4.9.9.9s.9-.4.9-.9v-1.1h3.4v1.1c0 .5.4.9.9.9s.9-.4.9-.9v-1.1h.6c.8 0 1.4-.6 1.4-1.4v-2.3c1.8-1.3 3-3.3 3-5.9C20.5 5.4 17 2 12 2zM8.6 8.4a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zm6.8 0a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8z"/>'
  };

  var rootElement = null;
  var frameElement = null;
  var blipElement = null;
  var pinsElement = null;
  var panelElement = null;
  var panelIconsElement = null;
  var panelColorsElement = null;
  var panelInputElement = null;
  var panelPinnedElement = null;
  var panelSaveButton = null;
  var panelDeleteButton = null;
  var panelCancelButton = null;
  var coordsElement = null;

  var domReady = false;
  var mapOpen = false;
  var panelOpen = false;
  var selectedIconId = 0;
  var selectedColorId = 0;
  var selectedPinned = false;
  var panelColors = [];
  var pinElements = [];
  var pinSignatures = [];
  var hoveredMarkIndex = -1;
  var pointerCaptureActive = false;
  var lastCoordsText = "";
  var lastCoordsVisible = false;

  function isUnityHost() {
    return !!(window.vuplex && window.vuplex.postMessage);
  }

  function postToUnity(payload) {
    if (!isUnityHost()) return;
    window.vuplex.postMessage(JSON.stringify(payload));
  }

  function createDiv(className, parent) {
    var element = document.createElement("div");
    element.className = className;
    if (parent) parent.appendChild(element);
    return element;
  }

  function localeText(key, fallback) {
    if (window.WebLocale && window.WebLocale.get) return window.WebLocale.get(key, fallback);
    return fallback;
  }

  function buildIconMarkup(iconId, color) {
    var iconName = MARKER_ICON_IDS[iconId];
    if (!iconName) iconName = MARKER_ICON_IDS[0];
    var inner = ICON_PATHS[iconName] || ICON_PATHS.pin;
    return '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="' + (color || "#ff8040") +
      '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  }

  function getSelectedColorCss() {
    if (panelColors && panelColors[selectedColorId]) return panelColors[selectedColorId];
    return "#ff8040";
  }

  function setPointerCapture(active) {
    if (pointerCaptureActive === active) return;
    pointerCaptureActive = active;
    postToUnity({ eventName: EVENT_POINTER_CAPTURE, active: active });
  }

  function buildDom() {
    if (domReady) return true;

    var host = document.getElementById("device") || document.body;
    if (!host) return false;

    rootElement = document.createElement("main");
    rootElement.className = "game-map";
    rootElement.id = "gameMapRoot";
    rootElement.hidden = true;
    rootElement.setAttribute("aria-hidden", "true");

    frameElement = createDiv("game-map-frame", rootElement);
    createDiv("game-map-frame-edge", frameElement);

    blipElement = createDiv("game-map-blip", rootElement);
    blipElement.id = "gameMapBlip";
    var blipImg = document.createElement("img");
    blipImg.className = "game-map-blip-img";
    blipImg.src = "map/map-blip.svg";
    blipImg.alt = "";
    blipImg.draggable = false;
    blipElement.appendChild(blipImg);

    pinsElement = createDiv("game-map-pins", rootElement);
    pinsElement.id = "gameMapPins";

    coordsElement = createDiv("game-map-coords", rootElement);
    coordsElement.hidden = true;

    panelElement = createDiv("game-map-panel os-window os-window--focused", rootElement);
    panelElement.id = "gameMapPanel";
    panelElement.hidden = true;

    panelInputElement = document.createElement("input");
    panelInputElement.type = "text";
    panelInputElement.className = "game-map-panel-input";
    panelInputElement.maxLength = 64;
    panelInputElement.autocomplete = "off";
    panelInputElement.spellcheck = false;
    panelInputElement.setAttribute("data-locale-placeholder", "web.map.marker.label");
    panelInputElement.placeholder = localeText("web.map.marker.label", "Marker label...");
    panelElement.appendChild(panelInputElement);

    var pinnedRow = createDiv("game-map-panel-pinned", panelElement);
    var pinnedLabel = createDiv("game-map-panel-pinned-label", pinnedRow);
    pinnedLabel.setAttribute("data-locale-key", "web.generic.pinned");
    pinnedLabel.textContent = localeText("web.generic.pinned", "Pinned");
    panelPinnedElement = document.createElement("button");
    panelPinnedElement.type = "button";
    panelPinnedElement.className = "game-map-panel-switch";
    panelPinnedElement.setAttribute("role", "switch");
    panelPinnedElement.setAttribute("aria-checked", "false");
    var switchTrack = createDiv("settings-switch-track", panelPinnedElement);
    createDiv("settings-switch-thumb", switchTrack);
    pinnedRow.appendChild(panelPinnedElement);

    panelIconsElement = createDiv("game-map-panel-icons", panelElement);
    panelColorsElement = createDiv("game-map-panel-colors", panelElement);

    var actions = createDiv("game-map-panel-actions", panelElement);

    panelDeleteButton = document.createElement("button");
    panelDeleteButton.type = "button";
    panelDeleteButton.className = "game-map-panel-button game-map-panel-button--danger";
    panelDeleteButton.setAttribute("data-locale-key", "web.generic.delete");
    panelDeleteButton.textContent = localeText("web.generic.delete", "Delete");
    actions.appendChild(panelDeleteButton);

    panelSaveButton = document.createElement("button");
    panelSaveButton.type = "button";
    panelSaveButton.className = "game-map-panel-button game-map-panel-button--primary";
    panelSaveButton.setAttribute("data-locale-key", "web.generic.save");
    panelSaveButton.textContent = localeText("web.generic.save", "Save");
    actions.appendChild(panelSaveButton);

    panelSaveButton.addEventListener("click", onPanelSave);
    panelDeleteButton.addEventListener("click", onPanelDelete);
    panelPinnedElement.addEventListener("click", onPinnedToggle);
    panelInputElement.addEventListener("keydown", onPanelInputKeyDown);
    panelInputElement.addEventListener("focus", onPanelInputFocus);
    panelInputElement.addEventListener("blur", onPanelInputBlur);

    panelElement.addEventListener("pointerenter", onPanelPointerEnter);
    panelElement.addEventListener("pointerleave", onPanelPointerLeave);

    document.addEventListener("pointerdown", onDocumentPointerDown, true);

    host.appendChild(rootElement);
    domReady = true;
    return true;
  }

  function onDocumentPointerDown(event) {
    if (!panelOpen || !panelElement) return;
    if (panelElement.contains(event.target)) return;
    onPanelCancel();
  }

  function onPinnedToggle() {
    selectedPinned = !selectedPinned;
    updatePinnedSwitchUi();
  }

  function updatePinnedSwitchUi() {
    if (!panelPinnedElement) return;
    panelPinnedElement.classList.toggle("is-on", selectedPinned);
    panelPinnedElement.setAttribute("aria-checked", selectedPinned ? "true" : "false");
  }

  function onPanelPointerEnter() {
    setPointerCapture(true);
  }

  function onPanelPointerLeave() {
    if (panelOpen) return;
    setPointerCapture(false);
  }

  function onPanelInputFocus() {
    setPointerCapture(true);
  }

  function onPanelInputBlur() {
  }

  function setDeviceMapOpenClass(open) {
    var device = document.getElementById("device");
    if (!device) return;
    device.classList.toggle("map-open", open);
  }

  function setOpen(open) {
    if (!buildDom()) return;
    mapOpen = !!open;
    rootElement.hidden = !mapOpen;
    rootElement.setAttribute("aria-hidden", mapOpen ? "false" : "true");
    setDeviceMapOpenClass(mapOpen);
    if (!mapOpen) {
      hidePanel();
      setPointerCapture(false);
    }
  }

  function applyPercentPosition(element, normalizedX, normalizedY) {
    element.style.left = (normalizedX * 100) + "%";
    element.style.top = (normalizedY * 100) + "%";
  }

  function applyViewportRect(viewport) {
    if (!viewport || !frameElement) return;
    frameElement.style.left = (viewport.x * 100) + "%";
    frameElement.style.top = (viewport.y * 100) + "%";
    frameElement.style.width = (viewport.w * 100) + "%";
    frameElement.style.height = (viewport.h * 100) + "%";
  }

  function applyPlayer(player) {
    if (!blipElement) return;
    if (!player || player.vis !== true) {
      blipElement.style.display = "none";
      return;
    }
    blipElement.style.display = "block";
    applyPercentPosition(blipElement, player.x, player.y);
    blipElement.style.transform = "translate(-50%, -50%) rotate(" + player.a + "deg)";
    if (player.e === 1 || player.e === true) {
      blipElement.classList.add("is-edge-clamped");
    } else {
      blipElement.classList.remove("is-edge-clamped");
    }
  }

  function applyMarkPositions(marks) {
    var index = 0;
    var seen = {};
    if (marks) {
      for (index = 0; index < marks.length; index += 1) {
        var mark = marks[index];
        if (!mark) continue;
        var pin = pinElements[mark.i];
        if (!pin) continue;
        seen[mark.i] = true;
        pin.style.display = "block";
        applyPercentPosition(pin, mark.x, mark.y);
        if (mark.e === 1 || mark.e === true) {
          pin.classList.add("is-edge-clamped");
        } else {
          pin.classList.remove("is-edge-clamped");
        }
      }
    }
    for (index = 0; index < pinElements.length; index += 1) {
      if (pinElements[index] && !seen[index]) {
        pinElements[index].style.display = "none";
      }
    }
  }

  function applyCursorCoords(cursor) {
    if (!coordsElement) return;
    var visible = !!(cursor && cursor.vis === true);
    if (visible !== lastCoordsVisible) {
      coordsElement.hidden = !visible;
      lastCoordsVisible = visible;
    }
    if (!visible) return;

    var text = "X " + cursor.x + "   Z " + cursor.z;
    if (text !== lastCoordsText) {
      coordsElement.textContent = text;
      lastCoordsText = text;
    }

    var pixelX = cursor.sx * window.innerWidth;
    var pixelY = cursor.sy * window.innerHeight;
    coordsElement.style.left = (pixelX + 16) + "px";
    coordsElement.style.top = (pixelY + 20) + "px";
  }

  function applyState(state) {
    if (!domReady || !state) return;
    applyViewportRect(state.v);
    applyPlayer(state.p);
    applyMarkPositions(state.m);
    applyCursorCoords(state.c);
    applyHover(state.h);
  }

  function applyHover(index) {
    if (typeof index !== "number") index = -1;
    if (index === hoveredMarkIndex) return;
    if (hoveredMarkIndex >= 0 && pinElements[hoveredMarkIndex]) {
      pinElements[hoveredMarkIndex].classList.remove("is-hovered");
    }
    hoveredMarkIndex = index;
    if (hoveredMarkIndex >= 0 && pinElements[hoveredMarkIndex]) {
      pinElements[hoveredMarkIndex].classList.add("is-hovered");
    }
  }

  function createPinIconElement(iconId, color) {
    var icon = createDiv("game-map-pin-icon");
    icon.innerHTML = buildIconMarkup(iconId, color || "#ff8040");
    return icon;
  }

  function applyMarks(marks) {
    if (!buildDom()) return;
    if (!marks) marks = [];
    var seen = {};
    var index = 0;
    for (index = 0; index < marks.length; index += 1) {
      var mark = marks[index];
      if (!mark) continue;
      var markIndex = mark.i;
      seen[markIndex] = true;
      var signature = mark.icon + "|" + (mark.color || "") + "|" + (mark.label || "");
      var pin = pinElements[markIndex];
      if (!pin) {
        pin = createDiv("game-map-pin", pinsElement);
        pin.style.display = "none";
        pinElements[markIndex] = pin;
      }
      if (pinSignatures[markIndex] !== signature) {
        pin.innerHTML = "";
        if (mark.label) {
          var label = createDiv("game-map-pin-label", pin);
          label.textContent = mark.label;
          label.style.color = mark.color || "#ff8040";
        }
        pin.appendChild(createPinIconElement(mark.icon, mark.color));
        pinSignatures[markIndex] = signature;
      }
    }
    for (index = 0; index < pinElements.length; index += 1) {
      if (pinElements[index] && !seen[index]) {
        if (pinElements[index].parentNode) {
          pinElements[index].parentNode.removeChild(pinElements[index]);
        }
        pinElements[index] = null;
        pinSignatures[index] = null;
        if (hoveredMarkIndex === index) hoveredMarkIndex = -1;
      }
    }
  }

  function buildIconButtons() {
    panelIconsElement.innerHTML = "";
    var index = 0;
    for (index = 0; index < MARKER_ICON_IDS.length; index += 1) {
      var iconButton = document.createElement("button");
      iconButton.type = "button";
      iconButton.className = "game-map-shape-button";
      iconButton.setAttribute("data-icon-id", String(index));
      var iconPreview = createDiv("game-map-shape-preview");
      iconPreview.setAttribute("data-icon-id", String(index));
      iconPreview.innerHTML = buildIconMarkup(index, getSelectedColorCss());
      iconButton.appendChild(iconPreview);
      iconButton.addEventListener("click", onIconButtonClick);
      panelIconsElement.appendChild(iconButton);
    }
  }

  function tintIconPreviews() {
    if (!panelIconsElement) return;
    var color = getSelectedColorCss();
    var previews = panelIconsElement.querySelectorAll(".game-map-shape-preview");
    var index = 0;
    for (index = 0; index < previews.length; index += 1) {
      var iconId = parseInt(previews[index].getAttribute("data-icon-id"), 10);
      if (isNaN(iconId)) iconId = 0;
      previews[index].innerHTML = buildIconMarkup(iconId, color);
    }
  }

  function buildColorButtons(colors) {
    panelColorsElement.innerHTML = "";
    panelColors = colors || [];
    if (!colors) return;
    var index = 0;
    for (index = 0; index < colors.length; index += 1) {
      var colorButton = document.createElement("button");
      colorButton.type = "button";
      colorButton.className = "game-map-color-button";
      colorButton.style.background = colors[index];
      colorButton.setAttribute("data-color-id", String(index));
      colorButton.addEventListener("click", onColorButtonClick);
      panelColorsElement.appendChild(colorButton);
    }
  }

  function highlightSelectedIcon() {
    if (!panelIconsElement) return;
    var buttons = panelIconsElement.children;
    var index = 0;
    for (index = 0; index < buttons.length; index += 1) {
      buttons[index].classList.toggle("is-selected", index === selectedIconId);
    }
  }

  function highlightSelectedColor() {
    if (!panelColorsElement) return;
    var buttons = panelColorsElement.children;
    var index = 0;
    for (index = 0; index < buttons.length; index += 1) {
      buttons[index].classList.toggle("is-selected", index === selectedColorId);
    }
  }

  function onIconButtonClick(event) {
    if (!event || !event.currentTarget) return;
    var value = event.currentTarget.getAttribute("data-icon-id");
    var iconId = parseInt(value, 10);
    if (isNaN(iconId)) return;
    selectedIconId = iconId;
    highlightSelectedIcon();
  }

  function onColorButtonClick(event) {
    if (!event || !event.currentTarget) return;
    var value = event.currentTarget.getAttribute("data-color-id");
    var colorId = parseInt(value, 10);
    if (isNaN(colorId)) return;
    selectedColorId = colorId;
    highlightSelectedColor();
    tintIconPreviews();
  }

  function clampPanelIntoView() {
    if (!panelElement) return;
    var margin = 12;
    var rect = panelElement.getBoundingClientRect();
    var left = rect.left;
    var top = rect.top;
    var maxLeft = window.innerWidth - rect.width - margin;
    var maxTop = window.innerHeight - rect.height - margin;
    if (left > maxLeft) left = maxLeft;
    if (left < margin) left = margin;
    if (top > maxTop) top = maxTop;
    if (top < margin) top = margin;
    panelElement.style.left = left + "px";
    panelElement.style.top = top + "px";
  }

  function openPanel(payload) {
    if (!buildDom() || !payload) return;
    selectedIconId = typeof payload.iconId === "number" ? payload.iconId : 0;
    selectedColorId = typeof payload.colorId === "number" ? payload.colorId : 0;
    selectedPinned = payload.pinned === true;
    buildColorButtons(payload.colors);
    buildIconButtons();
    highlightSelectedIcon();
    highlightSelectedColor();
    updatePinnedSwitchUi();
    panelInputElement.value = payload.label || "";
    panelDeleteButton.hidden = payload.canDelete !== true;
    panelElement.style.transform = "none";
    panelElement.style.left = (payload.x * window.innerWidth) + "px";
    panelElement.style.top = (payload.y * window.innerHeight) + "px";
    panelElement.hidden = false;
    panelOpen = true;
    clampPanelIntoView();
    setPointerCapture(true);
    window.setTimeout(focusPanelInput, 0);
  }

  function focusPanelInput() {
    if (!panelOpen || !panelInputElement) return;
    panelInputElement.focus();
    var length = panelInputElement.value.length;
    panelInputElement.setSelectionRange(length, length);
  }

  function hidePanel() {
    panelOpen = false;
    if (panelElement) panelElement.hidden = true;
    if (panelInputElement) panelInputElement.blur();
    setPointerCapture(false);
  }

  function closePanel() {
    hidePanel();
  }

  function onPanelSave() {
    if (!panelOpen) return;
    postToUnity({
      eventName: EVENT_MARKER_SAVE,
      iconId: selectedIconId,
      colorId: selectedColorId,
      label: panelInputElement.value || "",
      pinned: selectedPinned === true
    });
    if (!isUnityHost()) hidePanel();
  }

  function onPanelDelete() {
    if (!panelOpen) return;
    postToUnity({ eventName: EVENT_MARKER_DELETE, iconId: selectedIconId, colorId: selectedColorId, label: "" });
    if (!isUnityHost()) hidePanel();
  }

  function onPanelCancel() {
    if (!panelOpen) return;
    postToUnity({ eventName: EVENT_MARKER_CANCEL, iconId: selectedIconId, colorId: selectedColorId, label: "" });
    if (!isUnityHost()) hidePanel();
  }

  function onPanelInputKeyDown(event) {
    if (!event) return;
    if (event.key === "Enter") {
      event.preventDefault();
      onPanelSave();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onPanelCancel();
    }
  }

  window.WebGameMap = {
    setOpen: setOpen,
    applyState: applyState,
    applyMarks: applyMarks,
    openPanel: openPanel,
    closePanel: closePanel
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildDom);
  } else {
    buildDom();
  }
})();
