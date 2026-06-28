(function () {
  var SETTINGS_STORAGE_KEY = "web-settings-preview";
  var KEY_MASTER = "masterVolume";
  var KEY_MUSIC = "musicVolume";
  var EVENT_AUDIO_VOLUME_CHANGED = "web-audio-volume-changed";
  var DEFAULT_MASTER = 0.5;
  var DEFAULT_MUSIC = 1;

  if (window.WebMenuAudioVolume) {
    return;
  }

  function clamp01(value) {
    if (value < 0) {
      return 0;
    }
    if (value > 1) {
      return 1;
    }
    return value;
  }

  function readSettingsObject() {
    try {
      var raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function getSettingValue(settings, key, defaultValue) {
    if (!settings) {
      return defaultValue;
    }
    if (settings[key] == null) {
      return defaultValue;
    }
    var value = Number(settings[key]);
    if (isNaN(value)) {
      return defaultValue;
    }
    return clamp01(value);
  }

  function getMusicOutputVolume() {
    var settings = readSettingsObject();
    var master = getSettingValue(settings, KEY_MASTER, DEFAULT_MASTER);
    var music = getSettingValue(settings, KEY_MUSIC, DEFAULT_MUSIC);
    return clamp01(master * music);
  }

  window.WebMenuAudioVolume = {
    KEY_MASTER: KEY_MASTER,
    KEY_MUSIC: KEY_MUSIC,
    EVENT_AUDIO_VOLUME_CHANGED: EVENT_AUDIO_VOLUME_CHANGED,
    getMusicOutputVolume: getMusicOutputVolume
  };
})();
