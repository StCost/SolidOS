(function () {

  var EVENT_CURSOR = "cm-game-cursor";

  var boundFlag = "__cmIframeGameCursorBound";

  var lastToken = "";



  if (window[boundFlag]) {

    return;

  }

  window[boundFlag] = true;



  function canPostToParent() {

    if (!window.parent || window.parent === window) {

      return false;

    }

    return true;

  }



  function getScrollCursorToken(clientX, clientY) {
    return null;
  }



  function getDefaultGameCursorToken() {

    return "pointer";

  }



  function postCursorToken(token) {

    var nextToken = token || getDefaultGameCursorToken();

    if (nextToken === lastToken) {

      return;

    }

    lastToken = nextToken;

    try {

      window.parent.postMessage(

        {

          eventName: EVENT_CURSOR,

          token: nextToken

        },

        "*"

      );

    } catch (error) {

    }

  }



  function onPointerMove(event) {

    var token;

    if (!canPostToParent()) {

      return;

    }

    token = getScrollCursorToken(event.clientX, event.clientY);

    if (!token) {

      token = getDefaultGameCursorToken();

    }

    postCursorToken(token);

  }



  function onPointerLeave() {

    lastToken = "";

  }



  document.addEventListener("pointermove", onPointerMove, true);

  document.addEventListener("pointerleave", onPointerLeave, true);

})();

