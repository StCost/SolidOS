(function () {
  var EVENT_SAVE = "web-ui-local-storage-save";
  var SAVE_DEBOUNCE_MS = 200;
  var HOOK_RETRY_MS = 100;
  var HOOK_RETRY_MAX = 200;
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

  function installUnityPostMessageGuard() {
    if (!isUnityHost()) return;
    if (window.__cmUnityPostMessageGuardInstalled) return;
    window.__cmUnityPostMessageGuardInstalled = true;
    var originalPostMessage = window.vuplex.postMessage.bind(window.vuplex);
    window.vuplex.postMessage = function (message) {
      if (window.__cmSkipUnityLocalStoragePostMessage === true) return;
      originalPostMessage(message);
    };
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

  function postSaveToUnity(localStorageRaw) {
    if (!isUnityHost() || isRestoring()) return;
    if (!localStorageRaw) {
      localStorageRaw = serializeLocalStorage();
    }
    if (!localStorageRaw) return;

    window.vuplex.postMessage(
      JSON.stringify({
        eventName: EVENT_SAVE,
        localStorageRaw: localStorageRaw
      })
    );
  }

  function flushSaveToUnity() {
    saveTimer = 0;
    postSaveToUnity("");
  }

  function scheduleSaveToUnity() {
    if (!isUnityHost() || isRestoring() || window.__cmSkipUnityLocalStoragePostMessage === true) return;
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(flushSaveToUnity, SAVE_DEBOUNCE_MS);
  }

  function cancelPendingSave() {
    if (saveTimer) {
      window.clearTimeout(saveTimer);
      saveTimer = 0;
    }
  }

  function beginTearDownSkipUnityPostMessage() {
    installUnityPostMessageGuard();
    window.__cmSkipUnityLocalStoragePostMessage = true;
    cancelPendingSave();
    if (window.WebWindowManager && window.WebWindowManager.cancelPendingLayoutSave) {
      window.WebWindowManager.cancelPendingLayoutSave();
    }
    if (window.WebDesktop && window.WebDesktop.cancelPendingIconLayoutSave) {
      window.WebDesktop.cancelPendingIconLayoutSave();
    }
  }

  function tryInstallStorageHooks() {
    if (hooksInstalled || !isUnityHost()) return false;
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
    return true;
  }

  function beginStorageHookInstallRetry() {
    if (tryInstallStorageHooks()) return;
    var attempts = 0;
    var retryTimer = window.setInterval(function () {
      attempts = attempts + 1;
      if (tryInstallStorageHooks() || attempts >= HOOK_RETRY_MAX) {
        window.clearInterval(retryTimer);
      }
    }, HOOK_RETRY_MS);
  }

  beginStorageHookInstallRetry();

  window.WebMenuLocalStorageBridge = {
    flushSave: flushSaveToUnity,
    scheduleSaveToUnity: scheduleSaveToUnity,
    serializeSnapshot: serializeLocalStorage,
    beginTearDownSkipUnityPostMessage: beginTearDownSkipUnityPostMessage
  };
})();
