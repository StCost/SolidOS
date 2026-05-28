(function () {
  var EventSettingsOpen = "web-settings-open";
  var EventSettingsSet = "web-settings-set";
  var EventSettingsReset = "web-settings-reset";

  function postSettings(eventName, detail) {
    if (!detail) detail = {};

    if (window.vuplex && window.vuplex.postMessage) {
      window.vuplex.postMessage(
        JSON.stringify({
          eventName: eventName,
          key: detail.key || "",
          value: detail.value == null ? "" : String(detail.value)
        })
      );
      return;
    }

    if (!window.WebSettings || !window.WebSettings.applyLocalChange) return;
    if (eventName === EventSettingsOpen) {
      window.WebSettings.loadLocalPreview();
      return;
    }
    if (eventName === EventSettingsReset) {
      window.WebSettings.resetLocalPreview();
      return;
    }
    if (eventName === EventSettingsSet) {
      window.WebSettings.applyLocalChange(detail.key, detail.value);
    }
  }

  window.WebSettingsBridge = {
    open: function () {
      postSettings(EventSettingsOpen, {});
    },
    set: function (key, value) {
      postSettings(EventSettingsSet, { key: key, value: value });
    },
    reset: function () {
      postSettings(EventSettingsReset, {});
    }
  };

  window.addEventListener(EventSettingsOpen, function () {
    postSettings(EventSettingsOpen, {});
  });
})();
