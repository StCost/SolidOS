(function () {
  var isUnityHost = typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  var eventCursorSet = "web-cursor-set";
  var lastToken = "";
  var unityCursorEnabled = false;
  var hasLastPointerClient = false;
  var lastPointerClientX = 0;
  var lastPointerClientY = 0;

  function rememberPointerClient(clientX, clientY) {
    hasLastPointerClient = true;
    lastPointerClientX = clientX;
    lastPointerClientY = clientY;
  }

  function postCursorToken(token) {
    if (!isUnityHost || !unityCursorEnabled) {
      return;
    }
    if (token === lastToken) {
      return;
    }
    lastToken = token;
    window.vuplex.postMessage(
      JSON.stringify({
        eventName: eventCursorSet,
        token: token
      })
    );
  }

  function postCursorReset() {
    if (!isUnityHost) {
      return;
    }
    lastToken = "";
    window.vuplex.postMessage(
      JSON.stringify({
        eventName: eventCursorSet,
        token: ""
      })
    );
  }

  function setUnityCursorEnabled(enabled) {
    unityCursorEnabled = enabled === true;
    if (!unityCursorEnabled) {
      postCursorReset();
      return;
    }
    lastToken = "";
  }

  function getResizeTokenFromElement(element) {
    while (element && element !== document.documentElement) {
      if (!element.classList || !element.classList.contains("os-wm-resize")) {
        element = element.parentElement;
        continue;
      }
      if (element.classList.contains("os-wm-resize--n") || element.classList.contains("os-wm-resize--s")) {
        return "resize-ns";
      }
      if (element.classList.contains("os-wm-resize--e") || element.classList.contains("os-wm-resize--w")) {
        return "resize-ew";
      }
      if (element.classList.contains("os-wm-resize--ne") || element.classList.contains("os-wm-resize--sw")) {
        return "resize-nesw";
      }
      if (element.classList.contains("os-wm-resize--nw") || element.classList.contains("os-wm-resize--se")) {
        return "resize-nwse";
      }
      element = element.parentElement;
    }
    return null;
  }

  function getSettingsSliderCursorToken(element) {
    if (!element || !element.classList || !element.classList.contains("settings-slider")) {
      return null;
    }
    if (element.disabled) {
      return "forbidden";
    }
    return "scroll-h";
  }

  function getTextInputCursorToken(element) {
    if (!element || element.tagName !== "INPUT") {
      return null;
    }
    if (element.classList && element.classList.contains("settings-slider")) {
      return null;
    }
    if (element.classList && element.classList.contains("settings-slider-value-input")) {
      if (element.disabled) {
        return "forbidden";
      }
      return "text";
    }
    var inputType = element.getAttribute("type");
    if (!inputType) {
      inputType = "text";
    }
    if (inputType !== "text" && inputType !== "number" && inputType !== "search") {
      return null;
    }
    if (element.disabled) {
      return "forbidden";
    }
    return "text";
  }

  function getInteractiveTokenFromElement(element) {
    while (element && element !== document.documentElement) {
      var tagName = element.tagName;
      if (tagName === "INPUT") {
        if (element.classList && element.classList.contains("settings-slider")) {
          if (element.disabled) {
            return "forbidden";
          }
          return "scroll-h";
        }
        var textInputToken = getTextInputCursorToken(element);
        if (textInputToken) {
          return textInputToken;
        }
        if (element.disabled) {
          return "forbidden";
        }
        return "pointer";
      }
      if (tagName === "TEXTAREA") {
        if (element.disabled) {
          return "forbidden";
        }
        return "text";
      }
      if (tagName === "BUTTON" || tagName === "A") {
        if (element.classList && element.classList.contains("os-desktop-icon--disabled")) {
          return "forbidden";
        }
        if (element.disabled) {
          return "forbidden";
        }
        return "pointer";
      }
      if (element.getAttribute && element.getAttribute("role") === "button") {
        if (element.getAttribute("aria-disabled") === "true") {
          return "forbidden";
        }
        return "pointer";
      }
      if (element.classList) {
        if (element.classList.contains("os-window-control")) {
          if (element.disabled) {
            return "forbidden";
          }
          return "pointer";
        }
        if (
          element.classList.contains("term-title") ||
          element.classList.contains("term-row") ||
          element.classList.contains("settings-tab") ||
          element.classList.contains("settings-option-btn") ||
          element.classList.contains("settings-step")
        ) {
          if (element.disabled) {
            return "forbidden";
          }
          return "pointer";
        }
        if (element.classList.contains("worlds-entry")) {
          return "pointer";
        }
        if (element.classList.contains("extras-art-viewer-image-box")) {
          return "pointer";
        }
        if (element.classList.contains("os-statusbar-node-button")) {
          return "pointer";
        }
        if (element.classList.contains("os-taskbar-app")) {
          return "pointer";
        }
        if (element.classList.contains("os-start-menu-item")) {
          return "pointer";
        }
        if (element.classList.contains("settings-switch")) {
          return "pointer";
        }
        if (element.classList.contains("os-start-menu-submenu-item")) {
          return "pointer";
        }
        if (element.classList.contains("game-hud-slot")) {
          return "pointer";
        }
        if (
          element.classList.contains("game-map-panel-button") ||
          element.classList.contains("game-map-shape-button") ||
          element.classList.contains("game-map-color-button") ||
          element.classList.contains("game-map-panel-switch")
        ) {
          if (element.disabled) {
            return "forbidden";
          }
          return "pointer";
        }
        if (element.classList.contains("game-map-panel-input")) {
          if (element.disabled) {
            return "forbidden";
          }
          return "text";
        }
      }
      element = element.parentElement;
    }
    return null;
  }

  function getHitTargetAtPoint(clientX, clientY) {
    var pointTarget = document.elementFromPoint(clientX, clientY);
    if (pointTarget) {
      return pointTarget;
    }
    return document.documentElement;
  }

  function getWindowChromeDragToken(pointTarget) {
    if (pointTarget && pointTarget.closest) {
      if (pointTarget.closest(".os-window-controls, .os-window-control")) {
        return null;
      }
    }

    var element = pointTarget;
    while (element && element !== document.documentElement) {
      if (element.classList) {
        if (
          element.classList.contains("os-window-chrome--drag") ||
          element.classList.contains("os-window-title--drag")
        ) {
          return "drag";
        }
      }
      element = element.parentElement;
    }
    return null;
  }

  function isActiveOverlayScrollbarElement(element) {
    if (!element || !element.closest) {
      return false;
    }
    var bar = element.closest(".menu-v-scroll-bar, .menu-h-scroll-bar");
    if (!bar) {
      return true;
    }
    return !bar.classList.contains("menu-v-scroll-bar--idle");
  }

  function getOverlayScrollbarCursorToken(element) {
    while (element && element !== document.documentElement) {
      if (!element.classList) {
        element = element.parentElement;
        continue;
      }
      if (!isActiveOverlayScrollbarElement(element)) {
        element = element.parentElement;
        continue;
      }
      if (element.classList.contains("menu-v-scroll-bar-thumb")) {
        return "scroll";
      }
      if (element.classList.contains("menu-v-scroll-bar-track")) {
        return "scroll";
      }
      if (element.classList.contains("menu-h-scroll-bar-thumb")) {
        return "scroll-h";
      }
      element = element.parentElement;
    }
    return null;
  }

  function getResizeTokenFromEdge(edge) {
    if (edge === "n" || edge === "s") {
      return "resize-ns";
    }
    if (edge === "e" || edge === "w") {
      return "resize-ew";
    }
    if (edge === "ne" || edge === "sw") {
      return "resize-nesw";
    }
    if (edge === "nw" || edge === "se") {
      return "resize-nwse";
    }
    return "default";
  }

  function getActiveInteractionCursorToken() {
    var body = document.body;
    if (!body) {
      return null;
    }
    if (body.hasAttribute("data-wm-drag") || body.hasAttribute("data-icon-drag")) {
      return "drag";
    }
    if (body.hasAttribute("data-wm-resize")) {
      return getResizeTokenFromEdge(body.getAttribute("data-wm-resize"));
    }
    return null;
  }

  function getTokenForTarget(target, clientX, clientY) {
    var activeToken = getActiveInteractionCursorToken();
    if (activeToken) {
      return activeToken;
    }

    var pointTarget = getHitTargetAtPoint(clientX, clientY);
    if (!pointTarget) {
      pointTarget = target;
    }

    var windowChromeDragToken = getWindowChromeDragToken(pointTarget);
    if (windowChromeDragToken) {
      return windowChromeDragToken;
    }

    var overlayScrollbarToken = getOverlayScrollbarCursorToken(pointTarget);
    if (overlayScrollbarToken) {
      return overlayScrollbarToken;
    }

    if (window.WebScrollbarCursor) {
      var scrollCursorToken = window.WebScrollbarCursor.getScrollCursorToken(clientX, clientY);
      if (scrollCursorToken) {
        return scrollCursorToken;
      }
    }

    var settingsSliderToken = getSettingsSliderCursorToken(pointTarget);
    if (settingsSliderToken) {
      return settingsSliderToken;
    }

    var resizeToken = getResizeTokenFromElement(pointTarget);
    if (resizeToken) {
      return resizeToken;
    }

    var interactiveToken = getInteractiveTokenFromElement(pointTarget);
    if (interactiveToken) {
      return interactiveToken;
    }

    if (pointTarget && pointTarget.classList && pointTarget.classList.contains("game-hud-panel")) {
      return "default";
    }

    if (
      pointTarget &&
      pointTarget.classList &&
      (pointTarget.classList.contains("game-hud-chat-line") ||
        pointTarget.classList.contains("game-hud-chat-log") ||
        pointTarget.classList.contains("game-hud-chat-log-inner"))
    ) {
      return "default";
    }

    return "default";
  }

  function getTokenAtPoint(clientX, clientY) {
    return getTokenForTarget(getHitTargetAtPoint(clientX, clientY), clientX, clientY);
  }

  function updateFromPoint(clientX, clientY) {
    if (!unityCursorEnabled) {
      return;
    }
    postCursorToken(getTokenAtPoint(clientX, clientY));
  }

  function setTokenFromGameFrame(token) {
    if (!unityCursorEnabled) {
      return;
    }
    postCursorToken(token || "default");
  }

  function onPointerMove(event) {
    rememberPointerClient(event.clientX, event.clientY);
    if (!unityCursorEnabled) {
      return;
    }
    updateFromPoint(event.clientX, event.clientY);
  }

  function syncUnityCursorEnabledFromDom() {
    var screen = document.querySelector(".menu-screen");
    if (!screen) {
      return;
    }
    setUnityCursorEnabled(screen.classList.contains("menu-screen--unity-cursor"));
    if (unityCursorEnabled && hasLastPointerClient) {
      updateFromPoint(lastPointerClientX, lastPointerClientY);
    }
  }

  window.WebMenuCursorBridge = {
    setUnityCursorEnabled: setUnityCursorEnabled,
    syncFromDom: syncUnityCursorEnabledFromDom,
    getTokenAtPoint: getTokenAtPoint,
    updateFromPoint: updateFromPoint,
    setTokenFromGameFrame: setTokenFromGameFrame
  };

  if (isUnityHost) {
    document.addEventListener("pointermove", onPointerMove, true);
    syncUnityCursorEnabledFromDom();
  }
})();
