(function () {
  var DEFAULT_ARCADE_OUTPUT_VOLUME = 0.5;

  function getMenuAudioVolumeBridge() {
    if (window.parent && window.parent !== window && window.parent.WebMenuAudioVolume) {
      return window.parent.WebMenuAudioVolume;
    }
    if (window.WebMenuAudioVolume) {
      return window.WebMenuAudioVolume;
    }
    return null;
  }

  function getArcadeGamesOutputVolume() {
    var bridge = getMenuAudioVolumeBridge();
    if (bridge && bridge.getArcadeGamesOutputVolume) {
      return bridge.getArcadeGamesOutputVolume();
    }
    return DEFAULT_ARCADE_OUTPUT_VOLUME;
  }

  function scalePeakGain(peakGain) {
    return peakGain * getArcadeGamesOutputVolume();
  }

  function bindArcadeVolumeChangeListener(callback) {
    var bridge = getMenuAudioVolumeBridge();
    var targetWindow;
    if (!bridge || !bridge.EVENT_AUDIO_VOLUME_CHANGED || typeof callback !== "function") {
      return;
    }
    targetWindow = window.parent && window.parent !== window ? window.parent : window;
    targetWindow.addEventListener(bridge.EVENT_AUDIO_VOLUME_CHANGED, callback);
  }

  window.WebExtrasGameAudioVolume = {
    getArcadeGamesOutputVolume: getArcadeGamesOutputVolume,
    scalePeakGain: scalePeakGain,
    bindArcadeVolumeChangeListener: bindArcadeVolumeChangeListener
  };
})();
