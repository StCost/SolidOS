(function () {
  var eventNames = [
    "web-exit",
    "web-start",
    "web-select-world",
    "web-select-server",
    "web-select-steam",
    "web-page-changed",
    "web-window-layout-save",
    "web-start-lists-save"
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
      listsJson: detail.listsJson || ""
    };

    window.vuplex.postMessage(JSON.stringify(payload));
  }

  var index = 0;
  for (index = 0; index < eventNames.length; index++) {
    window.addEventListener(eventNames[index], postToUnity);
  }
})();
