(function () {
  var PATH_MARKER_WEB_MAIN_MENU = "Web Main Menu";
  var PATH_MARKER_WEB_MAIN_MENU_ENCODED = "Web%20Main%20Menu";
  var PARENT_SEGMENT = "..";
  var AUDIO_FOLDER = "audio";
  var cachedGameAudioPrefix = "";

  function isLocalWebMainMenuLayout() {
    var path = window.location.pathname || "";
    return (
      path.indexOf(PATH_MARKER_WEB_MAIN_MENU) !== -1 ||
      path.indexOf(PATH_MARKER_WEB_MAIN_MENU_ENCODED) !== -1
    );
  }

  function getGameAudioPrefixFromLayout() {
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

  function getUiSoundPath(pathOrFileName) {
    var parentWindow = window.parent;
    if (
      parentWindow &&
      parentWindow !== window &&
      parentWindow.WebMenuAudioPaths &&
      parentWindow.WebMenuAudioPaths.getGameAudioPath
    ) {
      return parentWindow.WebMenuAudioPaths.getGameAudioPath(pathOrFileName);
    }
    if (window.WebMenuAudioPaths && window.WebMenuAudioPaths.getGameAudioPath) {
      return window.WebMenuAudioPaths.getGameAudioPath(pathOrFileName);
    }
    var fileName = getFileNameFromAudioPath(pathOrFileName);
    return getGameAudioPrefixFromLayout() + fileName;
  }

  window.WebExtrasGameUiAudioPaths = {
    getUiSoundPath: getUiSoundPath
  };
})();
