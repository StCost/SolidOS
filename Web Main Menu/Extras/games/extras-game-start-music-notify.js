(function () {
  var MESSAGE_START_SCREEN_READY = "web-extras-game-start-screen-ready";
  var MESSAGE_GAMEPLAY_STARTED = "web-extras-game-gameplay-started";
  var MESSAGE_GAME_OVER = "web-extras-game-over";

  var SCRIPT_UI_AUDIO_PATHS = "../extras-game-ui-audio-paths.js";
  var SCRIPT_STANDALONE_AUDIO_VOLUME = "../extras-game-standalone-audio-volume.js";
  var SCRIPT_EXTRAS_MANIFEST = "../../../extras-manifest.js";
  var SCRIPT_SEAMLESS_LOOP_AUDIO = "../../../web-ui-seamless-loop-audio.js";
  var SCRIPT_START_MUSIC = "../../../extras-game-start-music.js";

  var standaloneBootstrapStarted = false;
  var standaloneBootstrapReady = false;
  var pendingStandaloneActions = [];

  function hasParentMusicController() {
    if (!window.parent || window.parent === window) {
      return false;
    }
    try {
      return !!window.parent.WebExtrasGameStartMusic;
    } catch (error) {
      return false;
    }
  }

  function getStandaloneGameIdFromPath() {
    var path = window.location.pathname || "";
    var href = window.location.href || "";
    var decodedHref = href;
    try {
      decodedHref = decodeURIComponent(href);
    } catch (decodeError) {
      decodedHref = href;
    }
    var source = decodedHref.indexOf("games/") !== -1 ? decodedHref : path;
    var match = source.match(/(?:^|[\/\\])games[\/\\]([^\/\\]+)/i);
    if (match && match[1]) {
      return match[1];
    }
    return "";
  }

  function findManifestGameById(gameId) {
    var manifest;
    var games;
    var index;
    if (!gameId || !window.WebExtrasManifest) {
      return null;
    }
    manifest = window.WebExtrasManifest;
    games = manifest.games || [];
    for (index = 0; index < games.length; index++) {
      if (games[index].id === gameId) {
        return games[index];
      }
    }
    return null;
  }

  function applyStandaloneGameMusicPaths(controller) {
    var gameId;
    var game;
    if (!controller || !controller.setMusicPaths) {
      return;
    }
    gameId = getStandaloneGameIdFromPath();
    game = findManifestGameById(gameId);
    if (!game) {
      return;
    }
    controller.setMusicPaths(
      game.startMusicPath || "",
      game.gameplayMusicPath || "",
      game.gameOverMusicPath || ""
    );
  }

  function getLocalMusicController() {
    if (window.WebExtrasGameStartMusic) {
      return window.WebExtrasGameStartMusic;
    }
    return null;
  }

  function loadScript(scriptSrc, onComplete, onError) {
    var scriptElement = document.createElement("script");
    scriptElement.src = scriptSrc;
    scriptElement.onload = function () {
      if (onComplete) {
        onComplete();
      }
    };
    scriptElement.onerror = function () {
      if (onError) {
        onError();
        return;
      }
      flushPendingStandaloneActions();
    };
    document.head.appendChild(scriptElement);
  }

  function flushPendingStandaloneActions() {
    var index;
    for (index = 0; index < pendingStandaloneActions.length; index++) {
      pendingStandaloneActions[index]();
    }
    pendingStandaloneActions.length = 0;
  }

  function ensureStandaloneMusic(onReady) {
    if (hasParentMusicController()) {
      if (onReady) {
        onReady();
      }
      return;
    }

    if (standaloneBootstrapReady && getLocalMusicController()) {
      if (onReady) {
        onReady();
      }
      return;
    }

    if (onReady) {
      pendingStandaloneActions.push(onReady);
    }

    if (standaloneBootstrapStarted) {
      return;
    }
    standaloneBootstrapStarted = true;

    function loadStartMusicScript() {
      if (getLocalMusicController()) {
        standaloneBootstrapReady = true;
        flushPendingStandaloneActions();
        return;
      }
      loadScript(SCRIPT_START_MUSIC, function () {
        standaloneBootstrapReady = true;
        flushPendingStandaloneActions();
      });
    }

    function loadSeamlessLoopAudioScript() {
      if (window.WebUiSeamlessLoopAudio && window.WebUiSeamlessLoopAudio.create) {
        loadStartMusicScript();
        return;
      }
      loadScript(SCRIPT_SEAMLESS_LOOP_AUDIO, loadStartMusicScript, function () {
        loadStartMusicScript();
      });
    }

    function loadExtrasManifestScript() {
      if (window.WebExtrasManifest) {
        loadSeamlessLoopAudioScript();
        return;
      }
      loadScript(SCRIPT_EXTRAS_MANIFEST, loadSeamlessLoopAudioScript);
    }

    function loadStandaloneAudioVolumeScript() {
      if (window.WebMenuAudioVolume) {
        loadExtrasManifestScript();
        return;
      }
      loadScript(SCRIPT_STANDALONE_AUDIO_VOLUME, loadExtrasManifestScript);
    }

    function loadUiAudioPathsScript() {
      if (window.WebExtrasGameUiAudioPaths) {
        loadStandaloneAudioVolumeScript();
        return;
      }
      loadScript(SCRIPT_UI_AUDIO_PATHS, loadStandaloneAudioVolumeScript);
    }

    loadUiAudioPathsScript();
  }

  function runWithMusicController(action) {
    if (hasParentMusicController()) {
      return;
    }
    ensureStandaloneMusic(function () {
      var controller = getLocalMusicController();
      if (!controller) {
        return;
      }
      action(controller);
    });
  }

  function postMessageToParent(messageType) {
    if (!window.parent || window.parent === window) {
      return;
    }
    window.parent.postMessage({ type: messageType }, "*");
  }

  function notifyStartScreenReady() {
    postMessageToParent(MESSAGE_START_SCREEN_READY);
    ensureStandaloneMusic(null);
  }

  function notifyGameplayStarted() {
    postMessageToParent(MESSAGE_GAMEPLAY_STARTED);
    runWithMusicController(function (controller) {
      applyStandaloneGameMusicPaths(controller);
      if (controller.setUsesStartScreenMusic) {
        controller.setUsesStartScreenMusic();
      }
      if (controller.stop) {
        controller.stop();
      }
    });
  }

  function notifyGameOver() {
    postMessageToParent(MESSAGE_GAME_OVER);
    runWithMusicController(function (controller) {
      applyStandaloneGameMusicPaths(controller);
      if (controller.startGameOver) {
        controller.startGameOver();
      }
    });
  }

  window.WebExtrasGameStartMusicNotify = {
    notifyStartScreenReady: notifyStartScreenReady,
    notifyGameplayStarted: notifyGameplayStarted,
    notifyGameOver: notifyGameOver
  };
})();
