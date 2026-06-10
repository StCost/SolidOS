(function () {
  var EVENT_SAVE = "web-ui-local-storage-save";
  var SAVE_DEBOUNCE_MS = 200;
  var saveTimer = 0;
  var hooksInstalled = false;
  var nativeSetItem = Storage.prototype.setItem;
  var nativeRemoveItem = Storage.prototype.removeItem;
  var nativeClear = Storage.prototype.clear;

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function isRestoring() {
    return window.__cmWebLocalStorageRestoring === true;
  }

  function serializeLocalStorage() {
    var snapshot = {};
    var index = 0;
    var key;
    try {
      for (index = 0; index < localStorage.length; index++) {
        key = localStorage.key(index);
        if (!key) continue;
        snapshot[key] = localStorage.getItem(key);
      }
    } catch (error) {
      return "";
    }
    return JSON.stringify(snapshot);
  }

  function flushSaveToUnity() {
    saveTimer = 0;
    if (!isUnityHost() || isRestoring()) return;
    window.dispatchEvent(
      new CustomEvent(EVENT_SAVE, {
        detail: { localStorageRaw: serializeLocalStorage() }
      })
    );
  }

  function scheduleSaveToUnity() {
    if (!isUnityHost() || isRestoring()) return;
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(flushSaveToUnity, SAVE_DEBOUNCE_MS);
  }

  function installStorageHooks() {
    if (hooksInstalled || !isUnityHost()) return;
    hooksInstalled = true;
    Storage.prototype.setItem = function (key, value) {
      nativeSetItem.call(this, key, value);
      scheduleSaveToUnity();
    };
    Storage.prototype.removeItem = function (key) {
      nativeRemoveItem.call(this, key);
      scheduleSaveToUnity();
    };
    Storage.prototype.clear = function () {
      nativeClear.call(this);
      scheduleSaveToUnity();
    };
  }

  installStorageHooks();

  window.WebMenuLocalStorageBridge = {
    flushSave: flushSaveToUnity
  };
})();
