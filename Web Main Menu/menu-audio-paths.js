(function () {
  var PATH_MARKER_WEB_MAIN_MENU = "Web Main Menu";
  var PATH_MARKER_WEB_MAIN_MENU_ENCODED = "Web%20Main%20Menu";
  var PARENT_SEGMENT = "..";
  var AUDIO_FOLDER = "audio";
  var cachedMenuAudioPrefix = "";
  var cachedGameAudioPrefix = "";

  function isLocalWebMainMenuLayout() {
    var path = window.location.pathname || "";
    return (
      path.indexOf(PATH_MARKER_WEB_MAIN_MENU) !== -1 ||
      path.indexOf(PATH_MARKER_WEB_MAIN_MENU_ENCODED) !== -1
    );
  }

  function getMenuAudioPrefix() {
    if (cachedMenuAudioPrefix) {
      return cachedMenuAudioPrefix;
    }
    if (isLocalWebMainMenuLayout()) {
      cachedMenuAudioPrefix = PARENT_SEGMENT + "/" + AUDIO_FOLDER + "/";
    } else {
      cachedMenuAudioPrefix = AUDIO_FOLDER + "/";
    }
    return cachedMenuAudioPrefix;
  }

  function getGameAudioPrefix() {
    if (cachedGameAudioPrefix) {
      return cachedGameAudioPrefix;
    }
    if (isLocalWebMainMenuLayout()) {
      cachedGameAudioPrefix =
        PARENT_SEGMENT +
        "/" +
        PARENT_SEGMENT +
        "/" +
        PARENT_SEGMENT +
        "/" +
        PARENT_SEGMENT +
        "/" +
        AUDIO_FOLDER +
        "/";
    } else {
      cachedGameAudioPrefix =
        PARENT_SEGMENT + "/" + PARENT_SEGMENT + "/" + PARENT_SEGMENT + "/" + AUDIO_FOLDER + "/";
    }
    return cachedGameAudioPrefix;
  }

  function getFileNameFromAudioPath(pathOrFileName) {
    var normalized = pathOrFileName || "";
    var slashIndex = normalized.lastIndexOf("/");
    if (slashIndex === -1) {
      return normalized;
    }
    return normalized.slice(slashIndex + 1);
  }

  function getMenuAudioPath(pathOrFileName) {
    var fileName = getFileNameFromAudioPath(pathOrFileName);
    if (!fileName) {
      return getMenuAudioPrefix();
    }
    return getMenuAudioPrefix() + fileName;
  }

  function getGameAudioPath(pathOrFileName) {
    var fileName = getFileNameFromAudioPath(pathOrFileName);
    if (!fileName) {
      return getGameAudioPrefix();
    }
    return getGameAudioPrefix() + fileName;
  }

  window.WebMenuAudioPaths = {
    getMenuAudioPath: getMenuAudioPath,
    getGameAudioPath: getGameAudioPath
  };
})();
