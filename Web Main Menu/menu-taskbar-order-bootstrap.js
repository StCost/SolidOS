(function () {
  var STORAGE_KEY = "cm-menu-taskbar-order";
  var payload;
  var raw;
  if (window.__cmTaskbarOrderPayload && window.__cmTaskbarOrderPayload.keys && window.__cmTaskbarOrderPayload.keys.length) {
    return;
  }
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    payload = JSON.parse(raw);
    if (!payload || !payload.keys || !payload.keys.length) return;
    window.__cmTaskbarOrderPayload = payload;
  } catch (error) {
  }
})();
