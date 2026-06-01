(function () {
  var MESSAGE_START_SCREEN_READY = "web-extras-game-start-screen-ready";
  var MESSAGE_GAMEPLAY_STARTED = "web-extras-game-gameplay-started";

  function postMessageToParent(messageType) {
    if (!window.parent || window.parent === window) return;
    window.parent.postMessage({ type: messageType }, "*");
  }

  function notifyStartScreenReady() {
    postMessageToParent(MESSAGE_START_SCREEN_READY);
  }

  function notifyGameplayStarted() {
    postMessageToParent(MESSAGE_GAMEPLAY_STARTED);
  }

  window.WebExtrasGameStartMusicNotify = {
    notifyStartScreenReady: notifyStartScreenReady,
    notifyGameplayStarted: notifyGameplayStarted
  };
})();
