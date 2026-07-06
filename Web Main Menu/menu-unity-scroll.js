(function () {
  var SCROLL_VIEW_SELECTOR =
    ".menu-v-scroll-view, .os-start-menu-scroll, .os-start-menu-games-scroll, .settings-scroll, .extras-scroll, .credits-scroll, .changelog-list, .changelog-detail, .worlds-list, .game-hud-chat-log, .settings-tabs:not(.settings-tabs--toolbar), .menu-h-scroll-view, .term-splash-scroll";
  var WINDOW_SELECTOR = ".os-window--managed:not(.os-window--closed):not(.os-window--minimized)";

  function getOpenStartMenuScrollAtPoint(x, y) {
    var startMenuElement;
    var scrollViews;
    var index;
    var scrollView;
    var rect;
    startMenuElement = document.getElementById("osStartMenu");
    if (!startMenuElement || startMenuElement.hidden) {
      return null;
    }
    scrollViews = startMenuElement.querySelectorAll("#osStartMenuScroll, .os-start-menu-games-scroll");
    for (index = 0; index < scrollViews.length; index += 1) {
      scrollView = scrollViews[index];
      rect = scrollView.getBoundingClientRect();
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        continue;
      }
      return scrollView;
    }
    return null;
  }

  function scrollStartMenuAtPoint(x, y, deltaX, deltaY) {
    var scrollView;
    scrollView = getOpenStartMenuScrollAtPoint(x, y);
    if (!scrollView) {
      return false;
    }
    if (deltaY && canScrollVertically(scrollView)) {
      scrollView.scrollTop += deltaY;
    }
    if (deltaX && canScrollHorizontally(scrollView)) {
      scrollView.scrollLeft += deltaX;
    }
    return true;
  }

  function isScrollView(element) {
    if (!element || !element.classList) {
      return false;
    }
    if (element.classList.contains("settings-tabs--toolbar")) {
      return false;
    }
    if (element.classList.contains("menu-v-scroll-bar")) {
      return false;
    }
    if (element.matches && element.matches(SCROLL_VIEW_SELECTOR)) {
      return true;
    }
    return false;
  }

  function canScrollVertically(element) {
    return element.scrollHeight > element.clientHeight + 1;
  }

  function canScrollHorizontally(element) {
    return element.scrollWidth > element.clientWidth + 1;
  }

  function isWindowVisible(windowElement) {
    if (!windowElement || !windowElement.classList) {
      return false;
    }
    if (windowElement.classList.contains("os-window--closed")) {
      return false;
    }
    if (windowElement.classList.contains("os-window--minimized")) {
      return false;
    }
    var style = window.getComputedStyle(windowElement);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    var bounds = windowElement.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) {
      return false;
    }
    return true;
  }

  function getTopWindowAtPoint(x, y) {
    var target = document.elementFromPoint(x, y);
    while (target && target !== document.documentElement) {
      if (target.matches && target.matches(WINDOW_SELECTOR) && isWindowVisible(target)) {
        return target;
      }
      if (
        target.classList &&
        target.classList.contains("os-window--managed") &&
        isWindowVisible(target)
      ) {
        return target;
      }
      target = target.parentElement;
    }
    return null;
  }

  function getPrimaryScrollView(windowElement) {
    var views = windowElement.querySelectorAll(SCROLL_VIEW_SELECTOR);
    var index;
    for (index = 0; index < views.length; index += 1) {
      var view = views[index];
      if (isScrollView(view) && canScrollVertically(view)) {
        return view;
      }
    }
    for (index = 0; index < views.length; index += 1) {
      if (isScrollView(views[index])) {
        return views[index];
      }
    }
    return null;
  }

  function findScrollViewInWindow(windowElement, x, y) {
    var target = document.elementFromPoint(x, y);
    while (target && target !== document.documentElement) {
      if (!windowElement.contains(target)) {
        break;
      }
      if (isScrollView(target)) {
        return target;
      }
      target = target.parentElement;
    }
    return getPrimaryScrollView(windowElement);
  }

  function scrollAtPoint(x, y, deltaX, deltaY) {
    if (!deltaX && !deltaY) {
      return;
    }
    if (scrollStartMenuAtPoint(x, y, deltaX, deltaY)) {
      return;
    }
    var windowElement = getTopWindowAtPoint(x, y);
    if (!windowElement) {
      return;
    }
    var scrollView = findScrollViewInWindow(windowElement, x, y);
    if (!scrollView) {
      return;
    }
    if (deltaY && canScrollVertically(scrollView)) {
      scrollView.scrollTop += deltaY;
    }
    if (deltaX && canScrollHorizontally(scrollView)) {
      scrollView.scrollLeft += deltaX;
    }
  }

  window.WebMenuUnityScroll = {
    scrollAtPoint: scrollAtPoint
  };
})();
