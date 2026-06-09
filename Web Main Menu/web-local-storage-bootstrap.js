(function () {
  function applyLocalStorageSnapshot(raw) {
    if (!raw) return;
    window.__cmWebLocalStorageRestoring = true;
    try {
      var entries = JSON.parse(raw);
      var key;
      for (key in entries) {
        if (!Object.prototype.hasOwnProperty.call(entries, key)) continue;
        localStorage.setItem(key, entries[key]);
      }
    } catch (error) {
    }
    window.__cmWebLocalStorageRestoring = false;
  }

  if (window.__cmWebLocalStorageRaw) {
    applyLocalStorageSnapshot(window.__cmWebLocalStorageRaw);
  }

  window.WebMenuLocalStorage = {
    applySnapshot: applyLocalStorageSnapshot
  };
})();
