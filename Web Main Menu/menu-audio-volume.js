(function () {
  var SETTINGS_STORAGE_KEY = "web-settings-preview";
  var KEY_MASTER = "masterVolume";
  var KEY_MUSIC = "musicVolume";
  var KEY_INTERFACE = "interfaceVolume";
  var DEFAULT_MASTER = 0.5;
  var DEFAULT_MUSIC = 1;
  var DEFAULT_INTERFACE = 1;
  var EVENT_AUDIO_VOLUME_CHANGED = "web-audio-volume-changed";
  var runtimeMasterVolume = null;
  var runtimeMusicVolume = null;
  var runtimeInterfaceVolume = null;

  function clamp01(value) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  function readSettingsObject() {
    try {
      var raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function getSettingValue(settings, key, defaultValue) {
    if (!settings) return defaultValue;
    if (settings[key] == null) return defaultValue;
    var value = Number(settings[key]);
    if (isNaN(value)) return defaultValue;
    return clamp01(value);
  }

  function getRuntimeOrStoredVolume(key, defaultValue) {
    if (key === KEY_MASTER && runtimeMasterVolume != null) return runtimeMasterVolume;
    if (key === KEY_MUSIC && runtimeMusicVolume != null) return runtimeMusicVolume;
    if (key === KEY_INTERFACE && runtimeInterfaceVolume != null) return runtimeInterfaceVolume;
    var settings = readSettingsObject();
    return getSettingValue(settings, key, defaultValue);
  }

  function setVolumesFromSettingsState(settingsState) {
    if (!settingsState) return;
    if (settingsState[KEY_MASTER] != null) {
      runtimeMasterVolume = getSettingValue(settingsState, KEY_MASTER, DEFAULT_MASTER);
    }
    if (settingsState[KEY_MUSIC] != null) {
      runtimeMusicVolume = getSettingValue(settingsState, KEY_MUSIC, DEFAULT_MUSIC);
    }
    if (settingsState[KEY_INTERFACE] != null) {
      runtimeInterfaceVolume = getSettingValue(settingsState, KEY_INTERFACE, DEFAULT_INTERFACE);
    }
  }

  function clearRuntimeVolumes() {
    runtimeMasterVolume = null;
    runtimeMusicVolume = null;
    runtimeInterfaceVolume = null;
  }

  function getMusicOutputVolume() {
    var master = getRuntimeOrStoredVolume(KEY_MASTER, DEFAULT_MASTER);
    var music = getRuntimeOrStoredVolume(KEY_MUSIC, DEFAULT_MUSIC);
    return clamp01(master * music);
  }

  function getInterfaceOutputVolume() {
    var master = getRuntimeOrStoredVolume(KEY_MASTER, DEFAULT_MASTER);
    var interfaceVolume = getRuntimeOrStoredVolume(KEY_INTERFACE, DEFAULT_INTERFACE);
    return clamp01(master * interfaceVolume);
  }

  function isAudioVolumeKey(key) {
    return key === KEY_MASTER || key === KEY_MUSIC || key === KEY_INTERFACE;
  }

  function notifyAudioVolumeChanged() {
    window.dispatchEvent(new CustomEvent(EVENT_AUDIO_VOLUME_CHANGED, { detail: {} }));
  }

  window.WebMenuAudioVolume = {
    KEY_MASTER: KEY_MASTER,
    KEY_MUSIC: KEY_MUSIC,
    KEY_INTERFACE: KEY_INTERFACE,
    EVENT_AUDIO_VOLUME_CHANGED: EVENT_AUDIO_VOLUME_CHANGED,
    getMusicOutputVolume: getMusicOutputVolume,
    getInterfaceOutputVolume: getInterfaceOutputVolume,
    isAudioVolumeKey: isAudioVolumeKey,
    setVolumesFromSettingsState: setVolumesFromSettingsState,
    clearRuntimeVolumes: clearRuntimeVolumes,
    notifyAudioVolumeChanged: notifyAudioVolumeChanged
  };
})();
