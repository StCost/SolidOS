(function () {

  var EVENT_CURSOR_SET = "web-cursor-set";

  var isUnityHost = typeof window.vuplex !== "undefined" && window.vuplex.postMessage;

  var unityCursorEnabled = false;

  var lastToken = "";



  function postCursorToken(token) {

    if (!isUnityHost || !unityCursorEnabled) {

      return;

    }

    if (!token) {

      token = "default";

    }

    if (token === lastToken) {

      return;

    }

    lastToken = token;

    window.vuplex.postMessage(

      JSON.stringify({

        eventName: EVENT_CURSOR_SET,

        token: token

      })

    );

  }



  function postCursorReset() {

    if (!isUnityHost) {

      return;

    }

    if (lastToken === "") {

      return;

    }

    lastToken = "";

    window.vuplex.postMessage(

      JSON.stringify({

        eventName: EVENT_CURSOR_SET,

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



  function getHitTargetAtPoint(clientX, clientY) {

    return document.elementFromPoint(clientX, clientY);

  }



  function getTextInputCursorToken(element) {

    if (!element || element.tagName !== "INPUT") {

      return null;

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



  function isChatTextInputElement(element) {

    if (!element) {

      return false;

    }

    if (element.id === "chatInput") {

      return true;

    }

    if (element.classList && element.classList.contains("game-hud-chat-input")) {

      return true;

    }

    return false;

  }



  function getTokenForTarget(target, clientX, clientY) {

    if (window.WebScrollbarCursor) {

      var scrollCursorToken = window.WebScrollbarCursor.getScrollCursorToken(clientX, clientY);

      if (scrollCursorToken) {

        return scrollCursorToken;

      }

    }



    if (!target) {

      return "default";

    }



    var element = target;

    while (element && element !== document.documentElement) {

      if (element.classList) {

        if (element.classList.contains("os-window-control")) {

          if (element.disabled) {

            return "default";

          }

          return "pointer";

        }

        if (element.classList.contains("menu-v-scrollbar-thumb") || element.classList.contains("worlds-list-scrollbar-thumb")) {

          return "scroll";

        }

        if (element.classList.contains("menu-h-scrollbar-thumb")) {

          return "scroll-h";

        }

        if (element.classList.contains("game-hud-panel")) {

          return "default";

        }

        if (element.classList.contains("game-hud-chat-line") || element.classList.contains("game-hud-chat-log") || element.classList.contains("game-hud-chat-log-inner")) {

          return "default";

        }

      }

      if (isChatTextInputElement(element)) {

        var inputToken = getTextInputCursorToken(element);

        if (inputToken) {

          return inputToken;

        }

      }

      element = element.parentElement;

    }



    return "default";

  }



  function getTokenAtPoint(clientX, clientY) {

    var pointTarget = getHitTargetAtPoint(clientX, clientY);

    return getTokenForTarget(pointTarget, clientX, clientY);

  }



  function updateFromPoint(clientX, clientY) {

    if (!unityCursorEnabled) {

      return;

    }

    postCursorToken(getTokenAtPoint(clientX, clientY));

  }



  function onPointerMove(event) {

    if (!unityCursorEnabled) {

      return;

    }

    updateFromPoint(event.clientX, event.clientY);

  }



  window.WebGameHudCursorBridge = {

    setUnityCursorEnabled: setUnityCursorEnabled,

    getTokenAtPoint: getTokenAtPoint,

    updateFromPoint: updateFromPoint

  };



  if (isUnityHost) {

    document.addEventListener("pointermove", onPointerMove, true);

  }

})();


