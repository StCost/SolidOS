(function () {
  var EventSettingsOpen = "web-settings-open";
  var EventSettingsSet = "web-settings-set";
  var EventSettingsReset = "web-settings-reset";
  var EventSettingsControlsSection = "web-settings-controls-section";
  var EventSettingsControlsRebind = "web-settings-controls-rebind";
  var EventSettingsControlsResetBindings = "web-settings-controls-reset-bindings";

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
    },
    setControlsSection: function (section) {
      if (window.vuplex && window.vuplex.postMessage) {
        postSettings(EventSettingsControlsSection, { value: section || "" });
      }
    },
    startControlsRebind: function (rowId) {
      if (window.vuplex && window.vuplex.postMessage) {
        postSettings(EventSettingsControlsRebind, { value: rowId || "" });
      }
    },
    resetControlsBindings: function () {
      if (window.vuplex && window.vuplex.postMessage) {
        postSettings(EventSettingsControlsResetBindings, {});
      }
    }
  };

  window.addEventListener(EventSettingsOpen, function () {
    postSettings(EventSettingsOpen, {});
  });
})();
