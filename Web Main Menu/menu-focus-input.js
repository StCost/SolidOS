(function () {
  var POINTER_ID = 4242;
  var CURSOR_STEP = 28;
  var NAVIGATE_MIN_DOT = 0.05;
  var boundFlag = "__cmMenuFocusInputBound";
  var cursorX = 0;
  var cursorY = 0;
  var cursorReady = false;
  var pointerDownActive = false;

  if (window[boundFlag]) {
    return;
  }
  window[boundFlag] = true;

  function ensureCursorPosition() {
    var width = window.innerWidth || document.documentElement.clientWidth || 0;
    var height = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!cursorReady) {
      cursorX = width * 0.5;
      cursorY = height * 0.5;
      cursorReady = true;
    }
    if (cursorX < 0) {
      cursorX = 0;
    }
    if (cursorY < 0) {
      cursorY = 0;
    }
    if (cursorX > width) {
      cursorX = width;
    }
    if (cursorY > height) {
      cursorY = height;
    }
  }

  function isFocusableElement(element) {
    var tagName;
    var tabIndex;
    if (!element || element === document.body || element === document.documentElement) {
      return false;
    }
    if (element.disabled) {
      return false;
    }
    if (element.getAttribute && element.getAttribute("aria-hidden") === "true") {
      return false;
    }
    if (window.WebScrollbarCursor && window.WebScrollbarCursor.isScrollThumbElement) {
      if (window.WebScrollbarCursor.isScrollThumbElement(element)) {
        return true;
      }
    }
    tagName = element.tagName;
    if (tagName === "BUTTON" || tagName === "A" || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
      return true;
    }
    if (element.classList) {
      if (
        element.classList.contains("term-row") ||
        element.classList.contains("term-title") ||
        element.classList.contains("os-window-control") ||
        element.classList.contains("settings-tab") ||
        element.classList.contains("settings-option-btn") ||
        element.classList.contains("settings-step") ||
        element.classList.contains("worlds-entry") ||
        element.classList.contains("calc-key") ||
        element.classList.contains("click-tap")
      ) {
        return true;
      }
    }
    if (element.getAttribute && element.getAttribute("role") === "button") {
      return true;
    }
    tabIndex = element.getAttribute ? element.getAttribute("tabindex") : null;
    if (tabIndex !== null && tabIndex !== "-1") {
      return true;
    }
    if (tagName === "CANVAS") {
      return true;
    }
    return false;
  }

  function collectFocusableElements() {
    var nodes = document.querySelectorAll(
      "button, a[href], input, textarea, select, canvas, .term-row, .term-title, .os-window-control, .settings-tab, .settings-option-btn, .settings-step, .worlds-entry, .calc-key, .click-tap, .menu-v-scrollbar-thumb, .worlds-list-scrollbar-thumb, [role='button'], [tabindex]"
    );
    var results = [];
    var index;
    for (index = 0; index < nodes.length; index += 1) {
      if (isFocusableElement(nodes[index])) {
        results.push(nodes[index]);
      }
    }
    return results;
  }

  function getElementCenter(element) {
    var rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.5,
      element: element
    };
  }

  function getNavigationOrigin() {
    var active = document.activeElement;
    if (active && isFocusableElement(active)) {
      return getElementCenter(active);
    }
    ensureCursorPosition();
    return { x: cursorX, y: cursorY, element: null };
  }

  function normalizeDirection(dirX, dirY) {
    var length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length < 0.001) {
      return { x: 0, y: 0 };
    }
    return { x: dirX / length, y: dirY / length };
  }

  function focusElement(element) {
    if (!element) {
      return;
    }
    if (element.focus) {
      try {
        element.focus({ preventScroll: true });
      } catch (error) {
        element.focus();
      }
    }
  }

  function setCursorToCenter(element) {
    var center;
    if (!element) {
      return;
    }
    center = getElementCenter(element);
    cursorX = center.x;
    cursorY = center.y;
    cursorReady = true;
  }

  function getTargetAtCursor() {
    ensureCursorPosition();
    return document.elementFromPoint(cursorX, cursorY) || document.body;
  }

  function moveVirtualCursor(deltaX, deltaY) {
    ensureCursorPosition();
    cursorX += deltaX;
    cursorY += deltaY;
    ensureCursorPosition();
  }

  function navigate(dirX, dirY) {
    var direction;
    var origin;
    var focusables;
    var index;
    var bestElement;
    var bestDistance;
    var target;
    var offsetX;
    var offsetY;
    var dot;
    var distance;
    var scrollContainer;
    direction = normalizeDirection(dirX, dirY);
    if (direction.x === 0 && direction.y === 0) {
      return false;
    }
    origin = getNavigationOrigin();
    focusables = collectFocusableElements();
    bestElement = null;
    bestDistance = Infinity;
    for (index = 0; index < focusables.length; index += 1) {
      target = focusables[index];
      if (target === origin.element) {
        continue;
      }
      offsetX = getElementCenter(target).x - origin.x;
      offsetY = getElementCenter(target).y - origin.y;
      dot = offsetX * direction.x + offsetY * direction.y;
      if (dot <= NAVIGATE_MIN_DOT) {
        continue;
      }
      distance = offsetX * offsetX + offsetY * offsetY;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestElement = target;
      }
    }
    if (bestElement) {
      focusElement(bestElement);
      setCursorToCenter(bestElement);
      return true;
    }
    if (direction.y !== 0 && window.WebScrollbarCursor) {
      if (window.WebScrollbarCursor.scrollFromActiveElement(direction.y, CURSOR_STEP * 2)) {
        return true;
      }
      scrollContainer = window.WebScrollbarCursor.findVerticalScrollContainer(getTargetAtCursor());
      if (scrollContainer && window.WebScrollbarCursor.scrollVerticalContainer(scrollContainer, direction.y, CURSOR_STEP * 2)) {
        return true;
      }
    }
    moveVirtualCursor(direction.x * CURSOR_STEP, direction.y * CURSOR_STEP);
    return false;
  }

  function buildPointerInit(clientX, clientY) {
    return {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: clientX,
      clientY: clientY,
      pointerId: POINTER_ID,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: pointerDownActive ? 1 : 0
    };
  }

  function buildMouseInit(clientX, clientY) {
    return {
      bubbles: true,
      cancelable: true,
      clientX: clientX,
      clientY: clientY,
      button: 0,
      buttons: pointerDownActive ? 1 : 0
    };
  }

  function isDragTarget(element) {
    if (!element) {
      return false;
    }
    if (element.tagName === "CANVAS") {
      return true;
    }
    if (window.WebScrollbarCursor && window.WebScrollbarCursor.isScrollThumbElement) {
      if (window.WebScrollbarCursor.isScrollThumbElement(element)) {
        return true;
      }
    }
    return false;
  }

  function dispatchPointerClickAt(clientX, clientY) {
    var target;
    var pointerInit;
    var mouseInit;
    ensureCursorPosition();
    target = document.elementFromPoint(clientX, clientY) || document.body;
    pointerInit = buildPointerInit(clientX, clientY);
    pointerInit.buttons = 1;
    target.dispatchEvent(new PointerEvent("pointerdown", pointerInit));
    pointerInit.buttons = 0;
    target.dispatchEvent(new PointerEvent("pointerup", pointerInit));
    mouseInit = buildMouseInit(clientX, clientY);
    target.dispatchEvent(new MouseEvent("click", mouseInit));
    if (typeof target.click === "function") {
      target.click();
    }
  }

  function dispatchPointerDownAt(clientX, clientY) {
    var target;
    var pointerInit;
    if (pointerDownActive) {
      return;
    }
    target = document.elementFromPoint(clientX, clientY) || document.body;
    pointerInit = buildPointerInit(clientX, clientY);
    pointerInit.buttons = 1;
    target.dispatchEvent(new PointerEvent("pointerdown", pointerInit));
    pointerDownActive = true;
  }

  function dispatchPointerUpAt(clientX, clientY) {
    var target;
    var pointerInit;
    var mouseInit;
    if (!pointerDownActive) {
      return;
    }
    target = document.elementFromPoint(clientX, clientY) || document.body;
    pointerInit = buildPointerInit(clientX, clientY);
    pointerInit.buttons = 0;
    target.dispatchEvent(new PointerEvent("pointerup", pointerInit));
    mouseInit = buildMouseInit(clientX, clientY);
    target.dispatchEvent(new MouseEvent("click", mouseInit));
    pointerDownActive = false;
  }

  function actionPress() {
    var target;
    ensureCursorPosition();
    target = getTargetAtCursor();
    if (isDragTarget(target)) {
      dispatchPointerDownAt(cursorX, cursorY);
      return;
    }
    dispatchPointerClickAt(cursorX, cursorY);
  }

  function actionRelease() {
    ensureCursorPosition();
    if (!pointerDownActive) {
      return;
    }
    dispatchPointerUpAt(cursorX, cursorY);
  }

  function actionRepeat() {
    ensureCursorPosition();
    if (pointerDownActive) {
      return;
    }
    dispatchPointerClickAt(cursorX, cursorY);
  }

  window.WebMenuFocusInput = {
    navigate: navigate,
    actionPress: actionPress,
    actionRelease: actionRelease,
    actionRepeat: actionRepeat
  };
})();
