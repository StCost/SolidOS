(function () {
  var MESSAGE_START_SCREEN_READY = "web-extras-game-start-screen-ready";
  var MESSAGE_GAMEPLAY_STARTED = "web-extras-game-gameplay-started";
  var MESSAGE_GAME_OVER = "web-extras-game-over";

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

  function notifyGameOver() {
    postMessageToParent(MESSAGE_GAME_OVER);
  }

  window.WebExtrasGameStartMusicNotify = {
    notifyStartScreenReady: notifyStartScreenReady,
    notifyGameplayStarted: notifyGameplayStarted,
    notifyGameOver: notifyGameOver
  };
})();
