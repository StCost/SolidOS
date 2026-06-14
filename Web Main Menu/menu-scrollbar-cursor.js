(function () {
  var TOKEN_SCROLL = "scroll";
  var TOKEN_SCROLL_H = "scroll-h";
  var SCROLL_VIEW_SELECTOR =
    ".menu-v-scroll-view, .menu-h-scroll-view, .term-splash-scroll, .settings-scroll, .extras-scroll, .credits-scroll, .worlds-list, .game-hud-chat-log, .settings-tabs";
  var DEFAULT_SCROLLBAR_SIZE = 8;
  var SCROLLBAR_THUMB_MIN_SIZE = 24;
  var SCROLLBAR_HIT_SLOP = 4;
  var cachedScrollbarSize = 0;

  function getScrollbarSizePixels() {
    if (cachedScrollbarSize > 0) {
      return cachedScrollbarSize;
    }
    var rootStyle = window.getComputedStyle(document.documentElement);
    var sizeValue = rootStyle.getPropertyValue("--scrollbar-size");
    var parsed = parseFloat(sizeValue);
    if (isNaN(parsed) || parsed <= 0) {
      cachedScrollbarSize = DEFAULT_SCROLLBAR_SIZE;
    } else {
      cachedScrollbarSize = parsed;
    }
    return cachedScrollbarSize;
  }

  function canScrollVertically(element) {
    return element.scrollHeight > element.clientHeight + 1;
  }

  function canScrollHorizontally(element) {
    return element.scrollWidth > element.clientWidth + 1;
  }

  function hasVerticalScrollbarTrack(element) {
    var style = window.getComputedStyle(element);
    var overflowY = style.overflowY;
    if (overflowY !== "scroll" && overflowY !== "auto") {
      return false;
    }
    return canScrollVertically(element);
  }

  function hasHorizontalScrollbarTrack(element) {
    var style = window.getComputedStyle(element);
    var overflowX = style.overflowX;
    if (overflowX !== "scroll" && overflowX !== "auto") {
      return false;
    }
    return canScrollHorizontally(element);
  }

  function isScrollViewVisible(scrollView) {
    if (!scrollView || !scrollView.isConnected) {
      return false;
    }
    var style = window.getComputedStyle(scrollView);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    var bounds = scrollView.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) {
      return false;
    }
    return true;
  }

  function isToolbarSettingsTabs(scrollView) {
    return scrollView.classList && scrollView.classList.contains("settings-tabs--toolbar");
  }

  function getVerticalScrollbarWidth(scrollView) {
    var overlayBar = getVisibleOverlayBarForScrollView(scrollView);
    if (overlayBar) {
      return getScrollbarSizePixels();
    }
    if (!canScrollVertically(scrollView)) {
      return 0;
    }
    var measuredLayout = scrollView.offsetWidth - scrollView.clientWidth;
    var measuredVisual = scrollView.getBoundingClientRect().width - scrollView.clientWidth;
    var measured = measuredLayout;
    if (measuredVisual > measured) {
      measured = measuredVisual;
    }
    var configuredWidth = getScrollbarSizePixels();
    if (measured > 0) {
      if (measured < configuredWidth) {
        return configuredWidth;
      }
      return measured;
    }
    if (hasVerticalScrollbarTrack(scrollView)) {
      return configuredWidth;
    }
    return 0;
  }

  function getHorizontalScrollbarHeight(scrollView) {
    if (!canScrollHorizontally(scrollView)) {
      return 0;
    }
    var measuredLayout = scrollView.offsetHeight - scrollView.clientHeight;
    var measuredVisual = scrollView.getBoundingClientRect().height - scrollView.clientHeight;
    var measured = measuredLayout;
    if (measuredVisual > measured) {
      measured = measuredVisual;
    }
    var configuredHeight = getScrollbarSizePixels();
    if (measured > 0) {
      if (measured < configuredHeight) {
        return configuredHeight;
      }
      return measured;
    }
    if (hasHorizontalScrollbarTrack(scrollView)) {
      return configuredHeight;
    }
    return 0;
  }

  function getVisibleOverlayBarForScrollView(scrollView) {
    var clip = scrollView.parentElement;
    if (!clip || !clip.classList || !clip.classList.contains("menu-v-scroll-clip")) {
      return null;
    }
    var bar = clip.querySelector(".menu-v-scroll-bar");
    if (!bar || bar.classList.contains("menu-v-scroll-bar--idle")) {
      return null;
    }
    return bar;
  }

  function getVerticalScrollbarThumbBounds(scrollView) {
    var overlayBar = getVisibleOverlayBarForScrollView(scrollView);
    var scrollHeight = scrollView.scrollHeight;
    var clientHeight = scrollView.clientHeight;
    if (scrollHeight <= clientHeight + 1) {
      return null;
    }
    var trackHeight = clientHeight;
    var thumbHeight = (clientHeight / scrollHeight) * clientHeight;
    if (thumbHeight < SCROLLBAR_THUMB_MIN_SIZE) {
      thumbHeight = SCROLLBAR_THUMB_MIN_SIZE;
    }
    if (thumbHeight > trackHeight) {
      thumbHeight = trackHeight;
    }
    var scrollRange = scrollHeight - clientHeight;
    var thumbTravel = trackHeight - thumbHeight;
    var thumbTop = 0;
    if (scrollRange > 0 && thumbTravel > 0) {
      thumbTop = (scrollView.scrollTop / scrollRange) * thumbTravel;
    }
    if (overlayBar) {
      var barBounds = overlayBar.getBoundingClientRect();
      var barTop = barBounds.top + overlayBar.clientTop;
      return {
        left: barBounds.left,
        right: barBounds.right,
        top: barTop + thumbTop,
        bottom: barTop + thumbTop + thumbHeight
      };
    }
    var scrollbarWidth = getVerticalScrollbarWidth(scrollView);
    if (scrollbarWidth <= 0) {
      return null;
    }
    var bounds = scrollView.getBoundingClientRect();
    var clientTop = bounds.top + scrollView.clientTop;
    return {
      left: bounds.right - scrollbarWidth,
      right: bounds.right,
      top: clientTop + thumbTop,
      bottom: clientTop + thumbTop + thumbHeight
    };
  }

  function isPointOnVerticalScrollbarThumb(scrollView, clientX, clientY) {
    var thumbBounds = getVerticalScrollbarThumbBounds(scrollView);
    if (!thumbBounds) {
      return false;
    }
    if (clientX < thumbBounds.left - SCROLLBAR_HIT_SLOP || clientX > thumbBounds.right + SCROLLBAR_HIT_SLOP) {
      return false;
    }
    return clientY >= thumbBounds.top - SCROLLBAR_HIT_SLOP && clientY <= thumbBounds.bottom + SCROLLBAR_HIT_SLOP;
  }

  function isPointInVerticalScrollbarTrack(scrollView, clientX, clientY) {
    var overlayBar = getVisibleOverlayBarForScrollView(scrollView);
    if (overlayBar) {
      var barBounds = overlayBar.getBoundingClientRect();
      if (clientX < barBounds.left || clientX > barBounds.right) {
        return false;
      }
      if (clientY < barBounds.top || clientY > barBounds.bottom) {
        return false;
      }
      return true;
    }
    var scrollbarWidth = getVerticalScrollbarWidth(scrollView);
    if (scrollbarWidth <= 0) {
      return false;
    }
    var bounds = scrollView.getBoundingClientRect();
    var hitWidth = scrollbarWidth + SCROLLBAR_HIT_SLOP;
    var distanceFromRight = bounds.right - clientX;
    if (distanceFromRight < 0 || distanceFromRight > hitWidth) {
      return false;
    }
    if (clientY < bounds.top || clientY > bounds.bottom) {
      return false;
    }
    var horizontalScrollbarHeight = getHorizontalScrollbarHeight(scrollView);
    if (horizontalScrollbarHeight > 0 && clientY > bounds.bottom - horizontalScrollbarHeight) {
      return false;
    }
    return true;
  }

  function isPointInHorizontalScrollbarZone(scrollView, clientX, clientY) {
    var scrollbarHeight = getHorizontalScrollbarHeight(scrollView);
    if (scrollbarHeight <= 0) {
      return false;
    }
    var bounds = scrollView.getBoundingClientRect();
    var hitHeight = scrollbarHeight + SCROLLBAR_HIT_SLOP;
    var distanceFromBottom = bounds.bottom - clientY;
    if (distanceFromBottom < 0 || distanceFromBottom > hitHeight) {
      return false;
    }
    if (clientX < bounds.left || clientX > bounds.right) {
      return false;
    }
    return true;
  }

  function isPointInVerticalScrollbarZone(scrollView, clientX, clientY) {
    if (isPointOnVerticalScrollbarThumb(scrollView, clientX, clientY)) {
      return true;
    }
    return isPointInVerticalScrollbarTrack(scrollView, clientX, clientY);
  }

  function isActiveOverlayScrollbarElement(element) {
    if (!element || !element.classList) {
      return false;
    }
    var bar = element.closest(".menu-v-scroll-bar, .menu-h-scroll-bar");
    if (!bar) {
      return true;
    }
    return !bar.classList.contains("menu-v-scroll-bar--idle");
  }

  function getOverlayScrollbarTokenAtPoint(clientX, clientY) {
    var target = document.elementFromPoint(clientX, clientY);
    while (target && target !== document.documentElement) {
      if (target.classList && isActiveOverlayScrollbarElement(target)) {
        if (target.classList.contains("menu-v-scroll-bar-thumb")) {
          return TOKEN_SCROLL;
        }
        if (target.classList.contains("menu-v-scroll-bar-track")) {
          return TOKEN_SCROLL;
        }
        if (target.classList.contains("menu-h-scroll-bar-thumb")) {
          return TOKEN_SCROLL_H;
        }
      }
      target = target.parentElement;
    }
    return null;
  }

  function getScrollCursorToken(clientX, clientY) {
    var overlayToken = getOverlayScrollbarTokenAtPoint(clientX, clientY);
    if (overlayToken) {
      return overlayToken;
    }
    var nodes = document.querySelectorAll(SCROLL_VIEW_SELECTOR);
    var index;
    for (index = 0; index < nodes.length; index += 1) {
      var horizontalScrollView = nodes[index];
      if (isToolbarSettingsTabs(horizontalScrollView)) {
        continue;
      }
      if (!isScrollViewVisible(horizontalScrollView)) {
        continue;
      }
      if (isPointInHorizontalScrollbarZone(horizontalScrollView, clientX, clientY)) {
        return TOKEN_SCROLL_H;
      }
    }
    for (index = 0; index < nodes.length; index += 1) {
      var verticalScrollView = nodes[index];
      if (isToolbarSettingsTabs(verticalScrollView)) {
        continue;
      }
      if (!isScrollViewVisible(verticalScrollView)) {
        continue;
      }
      if (isPointInVerticalScrollbarZone(verticalScrollView, clientX, clientY)) {
        return TOKEN_SCROLL;
      }
    }
    return null;
  }

  window.WebScrollbarCursor = {
    getScrollCursorToken: getScrollCursorToken
  };
})();
