(function () {
  var EVENT_LOCALE = "cm-game-locale";
  var EVENT_LOCALE_REQUEST = "cm-game-locale-request";
  var gameFrame = null;

  function setGameFrame(frame) {
    gameFrame = frame || null;
  }

  function getLocaleStrings() {
    if (!window.WebLocale || !window.WebLocale.getStrings) {
      return null;
    }
    return window.WebLocale.getStrings();
  }

  function sendLocaleToWindow(targetWindow) {
    var strings;
    if (!targetWindow) {
      return false;
    }
    strings = getLocaleStrings();
    if (!strings) {
      return false;
    }
    try {
      targetWindow.postMessage(
        {
          eventName: EVENT_LOCALE,
          strings: strings
        },
        "*"
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  function sendLocaleToGameFrame(frame) {
    var contentWindow;
    if (!frame) {
      return false;
    }
    try {
      contentWindow = frame.contentWindow;
    } catch (error) {
      return false;
    }
    return sendLocaleToWindow(contentWindow);
  }

  function onLocaleRequestMessage(event) {
    if (!event || !event.data || event.data.eventName !== EVENT_LOCALE_REQUEST) {
      return;
    }
    if (!gameFrame) {
      return;
    }
    try {
      if (event.source !== gameFrame.contentWindow) {
        return;
      }
    } catch (error) {
      return;
    }
    sendLocaleToWindow(event.source);
  }

  function onHostLocaleApplied() {
    sendLocaleToGameFrame(gameFrame);
  }

  function bindGameFrameLocale(frame) {
    if (!frame) {
      return;
    }
    if (frame.getAttribute("data-locale-bridge-bound") === "1") {
      return;
    }
    frame.setAttribute("data-locale-bridge-bound", "1");
    frame.addEventListener("load", function () {
      sendLocaleToGameFrame(frame);
    });
  }

  window.addEventListener("message", onLocaleRequestMessage);
  window.addEventListener("web-locale-applied", onHostLocaleApplied);

  window.WebGameFrameLocaleHost = {
    setGameFrame: setGameFrame,
    bindGameFrameLocale: bindGameFrameLocale,
    sendLocaleToGameFrame: sendLocaleToGameFrame
  };
})();
