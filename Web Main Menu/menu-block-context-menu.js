(function () {
  var boundFlag = "__cmMenuContextMenuBlocked";
  if (window[boundFlag]) {
    return;
  }
  window[boundFlag] = true;

  function isRightMouseButtonEvent(event) {
    if (!event) return false;
    if (event.button === 2) return true;
    if (event.which === 3) return true;
    return false;
  }

  function blockContextMenuEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  function blockRightMouseButtonEvent(event) {
    if (!isRightMouseButtonEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  document.addEventListener("contextmenu", blockContextMenuEvent, true);
  window.addEventListener("contextmenu", blockContextMenuEvent, true);
  document.addEventListener("mousedown", blockRightMouseButtonEvent, true);
  document.addEventListener("mouseup", blockRightMouseButtonEvent, true);
  document.addEventListener("pointerdown", blockRightMouseButtonEvent, true);
  document.addEventListener("pointerup", blockRightMouseButtonEvent, true);
  document.addEventListener("auxclick", blockRightMouseButtonEvent, true);
})();
