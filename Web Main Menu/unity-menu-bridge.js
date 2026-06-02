(function () {
  var eventNames = [
    "web-exit-to-menu",
    "web-quit",
    "web-start",
    "web-select-world",
    "web-select-server",
    "web-select-steam",
    "web-page-changed",
    "web-window-layout-save",
    "web-window-layout-reset",
    "web-start-lists-save",
    "web-open-external-url",
    "web-extras-game-record-save"
  ];

  function postToUnity(event) {
    if (!window.vuplex || !window.vuplex.postMessage) return;

    var detail = event.detail;
    if (!detail) detail = {};

    var payload = {
      eventName: event.type,
      pageId: detail.pageId || detail.kind || "",
      kind: detail.pageId || detail.kind || "",
      name: detail.name || "",
      seed: detail.seed || "",
      ip: detail.ip || "",
      layoutsJson: detail.layoutsJson || "",
      listsJson: detail.listsJson || "",
      url: detail.url || "",
      active: detail.active === true,
      inputMode: detail.inputMode || "",
      gameId: detail.gameId || "",
      recordsJson: detail.recordsJson || ""
    };

    window.vuplex.postMessage(JSON.stringify(payload));
  }

  var index = 0;
  for (index = 0; index < eventNames.length; index++) {
    window.addEventListener(eventNames[index], postToUnity);
  }
})();
