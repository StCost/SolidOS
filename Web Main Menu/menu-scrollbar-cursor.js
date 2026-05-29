(function () {
  var scrollbarThumbMinSize = 24;
  var scrollbarInstances = [];
  var horizontalScrollbarInstances = [];

  function canListScroll(listElement) {
    return listElement.scrollHeight > listElement.clientHeight + 1;
  }

  function updateThumbLayout(instance) {
    var listElement = instance.listElement;
    var trackElement = instance.trackElement;
    var thumbElement = instance.thumbElement;

    if (!canListScroll(listElement)) {
      trackElement.classList.add("is-hidden");
      return;
    }

    trackElement.classList.remove("is-hidden");

    var trackHeight = trackElement.clientHeight;
    var scrollRange = listElement.scrollHeight - listElement.clientHeight;
    var thumbHeight = Math.max(
      scrollbarThumbMinSize,
      Math.floor((listElement.clientHeight / listElement.scrollHeight) * trackHeight)
    );
    var thumbTravel = Math.max(0, trackHeight - thumbHeight);
    var thumbOffset = scrollRange > 0 ? (listElement.scrollTop / scrollRange) * thumbTravel : 0;

    instance.thumbOffset = thumbOffset;
    thumbElement.style.height = thumbHeight + "px";
    thumbElement.style.transform = "translateY(" + thumbOffset + "px)";
  }

  function setListScrollFromThumbOffset(instance, thumbOffset) {
    var listElement = instance.listElement;
    var trackElement = instance.trackElement;
    var thumbElement = instance.thumbElement;
    var trackHeight = trackElement.clientHeight;
    var thumbHeight = thumbElement.offsetHeight;
    var thumbTravel = Math.max(0, trackHeight - thumbHeight);
    var scrollRange = listElement.scrollHeight - listElement.clientHeight;

    if (thumbTravel <= 0 || scrollRange <= 0) {
      listElement.scrollTop = 0;
      return;
    }

    var clampedOffset = thumbOffset;
    if (clampedOffset < 0) {
      clampedOffset = 0;
    }
    if (clampedOffset > thumbTravel) {
      clampedOffset = thumbTravel;
    }

    listElement.scrollTop = (clampedOffset / thumbTravel) * scrollRange;
  }

  function onListScroll(instance) {
    updateThumbLayout(instance);
  }

  function onThumbPointerDown(instance, event) {
    event.preventDefault();
    event.stopPropagation();

    instance.thumbElement.classList.add("is-dragging");
    instance.dragPointerId = event.pointerId;
    instance.dragStartPointerY = event.clientY;
    instance.dragStartThumbOffset = instance.thumbOffset;

    if (instance.thumbElement.setPointerCapture) {
      instance.thumbElement.setPointerCapture(event.pointerId);
    }
  }

  function onThumbPointerMove(instance, event) {
    if (instance.dragPointerId !== event.pointerId) {
      return;
    }

    var deltaY = event.clientY - instance.dragStartPointerY;
    setListScrollFromThumbOffset(instance, instance.dragStartThumbOffset + deltaY);
    updateThumbLayout(instance);
  }

  function onThumbPointerUp(instance, event) {
    if (instance.dragPointerId !== event.pointerId) {
      return;
    }

    instance.dragPointerId = null;
    instance.thumbElement.classList.remove("is-dragging");

    if (instance.thumbElement.releasePointerCapture) {
      try {
        instance.thumbElement.releasePointerCapture(event.pointerId);
      } catch (ignoredError) {
      }
    }
  }

  function onTrackPointerDown(instance, event) {
    if (event.target === instance.thumbElement) {
      return;
    }

    event.preventDefault();

    var trackBounds = instance.trackElement.getBoundingClientRect();
    var thumbHeight = instance.thumbElement.offsetHeight;
    var targetOffset = event.clientY - trackBounds.top - thumbHeight * 0.5;
    setListScrollFromThumbOffset(instance, targetOffset);
    updateThumbLayout(instance);
  }

  function onVerticalScrollbarWheel(instance, event) {
    if (event.deltaY === 0) {
      return;
    }
    if (instance.trackElement.classList.contains("is-hidden")) {
      return;
    }
    instance.listElement.scrollTop += event.deltaY / 5;
    updateThumbLayout(instance);
    event.preventDefault();
    event.stopPropagation();
  }

  function attachScrollbarBehavior(instance) {
    var listElement = instance.listElement;
    var trackElement = instance.trackElement;
    var thumbElement = instance.thumbElement;

    listElement.addEventListener("scroll", function () {
      onListScroll(instance);
    });

    thumbElement.addEventListener("pointerdown", function (event) {
      onThumbPointerDown(instance, event);
    });

    thumbElement.addEventListener("pointermove", function (event) {
      onThumbPointerMove(instance, event);
    });

    thumbElement.addEventListener("pointerup", function (event) {
      onThumbPointerUp(instance, event);
    });

    thumbElement.addEventListener("pointercancel", function (event) {
      onThumbPointerUp(instance, event);
    });

    trackElement.addEventListener("pointerdown", function (event) {
      onTrackPointerDown(instance, event);
    });

    trackElement.addEventListener("wheel", function (event) {
      onVerticalScrollbarWheel(instance, event);
    }, { passive: false });

    if (typeof ResizeObserver !== "undefined") {
      instance.resizeObserver = new ResizeObserver(function () {
        updateThumbLayout(instance);
      });
      instance.resizeObserver.observe(listElement);
      instance.resizeObserver.observe(trackElement);
    }

    if (typeof MutationObserver !== "undefined") {
      instance.mutationObserver = new MutationObserver(function () {
        updateThumbLayout(instance);
      });
      instance.mutationObserver.observe(listElement, { childList: true, subtree: true });
    }

    updateThumbLayout(instance);
  }

  var SCROLL_VIEW_CLASS = "menu-v-scroll-view";
  var HORIZONTAL_SCROLL_VIEW_CLASS = "menu-h-scroll-view";
  var scrollViewScanTimer = 0;

  function getMenuScreenRoot(rootElement) {
    if (rootElement && rootElement.classList && rootElement.classList.contains("menu-screen")) {
      return rootElement;
    }
    if (rootElement && rootElement.closest) {
      var closestMenuScreen = rootElement.closest(".menu-screen");
      if (closestMenuScreen) {
        return closestMenuScreen;
      }
    }
    return document.querySelector(".menu-screen");
  }

  function getElementDepth(element) {
    var depth = 0;
    var node = element;
    while (node) {
      depth += 1;
      node = node.parentElement;
    }
    return depth;
  }

  function isVerticalScrollTrackElement(element) {
    if (!element || !element.classList) {
      return false;
    }
    if (element.classList.contains("menu-v-scrollbar") || element.classList.contains("menu-v-scrollbar-thumb")) {
      return true;
    }
    if (element.classList.contains("menu-h-scrollbar") || element.classList.contains("menu-h-scrollbar-thumb")) {
      return true;
    }
    return false;
  }

  function isWrappedVerticalScrollView(element) {
    var parentElement = element.parentElement;
    return !!(parentElement && parentElement.classList && parentElement.classList.contains("menu-v-scroll"));
  }

  function isWrappedHorizontalScrollView(element) {
    var parentElement = element.parentElement;
    return !!(parentElement && parentElement.classList && parentElement.classList.contains("menu-h-scroll"));
  }

  function isVerticalScrollElement(element) {
    var tagName;
    var computedStyle;
    var overflowY;
    if (!element || element.nodeType !== 1) {
      return false;
    }
    if (isVerticalScrollTrackElement(element)) {
      return false;
    }
    if (isWrappedVerticalScrollView(element)) {
      return false;
    }
    tagName = element.tagName;
    if (tagName === "HTML" || tagName === "BODY") {
      return false;
    }
    computedStyle = window.getComputedStyle(element);
    overflowY = computedStyle.overflowY;
    if (overflowY !== "auto" && overflowY !== "scroll") {
      return false;
    }
    return true;
  }

  function isHorizontalScrollElement(element) {
    var tagName;
    var computedStyle;
    var overflowX;
    if (!element || element.nodeType !== 1) {
      return false;
    }
    if (isVerticalScrollTrackElement(element)) {
      return false;
    }
    if (isWrappedHorizontalScrollView(element)) {
      return false;
    }
    tagName = element.tagName;
    if (tagName === "HTML" || tagName === "BODY") {
      return false;
    }
    computedStyle = window.getComputedStyle(element);
    overflowX = computedStyle.overflowX;
    if (overflowX !== "auto" && overflowX !== "scroll") {
      return false;
    }
    return true;
  }

  function collectVerticalScrollElements(rootElement) {
    var menuScreen = getMenuScreenRoot(rootElement);
    var nodes;
    var results = [];
    var index;
    var node;
    if (!menuScreen) {
      return results;
    }
    nodes = menuScreen.getElementsByTagName("*");
    for (index = 0; index < nodes.length; index += 1) {
      node = nodes[index];
      if (isVerticalScrollElement(node)) {
        results.push(node);
      }
    }
    results.sort(function (left, right) {
      return getElementDepth(right) - getElementDepth(left);
    });
    return results;
  }

  function collectHorizontalScrollElements(rootElement) {
    var menuScreen = getMenuScreenRoot(rootElement);
    var nodes;
    var results = [];
    var index;
    var node;
    if (!menuScreen) {
      return results;
    }
    nodes = menuScreen.getElementsByTagName("*");
    for (index = 0; index < nodes.length; index += 1) {
      node = nodes[index];
      if (isHorizontalScrollElement(node)) {
        results.push(node);
      }
    }
    results.sort(function (left, right) {
      return getElementDepth(right) - getElementDepth(left);
    });
    return results;
  }

  function wrapVerticalScrollView(scrollElement) {
    if (!scrollElement || isWrappedVerticalScrollView(scrollElement)) {
      return;
    }

    var wrapperElement = document.createElement("div");
    wrapperElement.className = "menu-v-scroll";

    var trackElement = document.createElement("div");
    trackElement.className = "menu-v-scrollbar";
    trackElement.setAttribute("aria-hidden", "true");

    var thumbElement = document.createElement("div");
    thumbElement.className = "menu-v-scrollbar-thumb";
    trackElement.appendChild(thumbElement);

    scrollElement.parentNode.insertBefore(wrapperElement, scrollElement);
    wrapperElement.appendChild(scrollElement);
    wrapperElement.appendChild(trackElement);
    scrollElement.classList.add(SCROLL_VIEW_CLASS);

    var instance = {
      listElement: scrollElement,
      trackElement: trackElement,
      thumbElement: thumbElement,
      dragPointerId: null,
      dragStartPointerY: 0,
      dragStartThumbOffset: 0,
      thumbOffset: 0,
      resizeObserver: null,
      mutationObserver: null
    };

    attachScrollbarBehavior(instance);
    scrollbarInstances.push(instance);
  }

  function shouldWrapScrollElement(scrollElement) {
    return isVerticalScrollElement(scrollElement);
  }

  function shouldWrapHorizontalScrollElement(scrollElement) {
    return isHorizontalScrollElement(scrollElement);
  }

  function scheduleScrollViewScan() {
    if (scrollViewScanTimer) {
      window.clearTimeout(scrollViewScanTimer);
    }
    scrollViewScanTimer = window.setTimeout(function () {
      scrollViewScanTimer = 0;
      initVerticalScrollViews(document);
      refreshAllScrollbars();
    }, 0);
  }

  function observeScrollViewChanges() {
    var menuScreen = document.querySelector(".menu-screen");
    if (!menuScreen || typeof MutationObserver === "undefined") {
      return;
    }
    var observer = new MutationObserver(function () {
      scheduleScrollViewScan();
    });
    observer.observe(menuScreen, { childList: true, subtree: true });
  }

  function initVerticalScrollViews(rootElement) {
    var scrollElements = collectVerticalScrollElements(rootElement);
    var index;
    for (index = 0; index < scrollElements.length; index += 1) {
      var scrollElement = scrollElements[index];
      if (!shouldWrapScrollElement(scrollElement)) {
        continue;
      }
      wrapVerticalScrollView(scrollElement);
    }
  }

  function initScrollViews(rootElement) {
    initVerticalScrollViews(rootElement);
    initHorizontalScrollViews(rootElement);
  }

  function canHorizontalScroll(viewElement) {
    return viewElement.scrollWidth > viewElement.clientWidth + 1;
  }

  function updateHorizontalThumbLayout(instance) {
    var viewElement = instance.viewElement;
    var trackElement = instance.trackElement;
    var thumbElement = instance.thumbElement;

    if (!canHorizontalScroll(viewElement)) {
      trackElement.classList.add("is-hidden");
      return;
    }

    trackElement.classList.remove("is-hidden");

    var trackWidth = trackElement.clientWidth;
    var scrollRange = viewElement.scrollWidth - viewElement.clientWidth;
    var thumbWidth = Math.max(
      scrollbarThumbMinSize,
      Math.floor((viewElement.clientWidth / viewElement.scrollWidth) * trackWidth)
    );
    var thumbTravel = Math.max(0, trackWidth - thumbWidth);
    var thumbOffset = scrollRange > 0 ? (viewElement.scrollLeft / scrollRange) * thumbTravel : 0;

    instance.thumbOffset = thumbOffset;
    thumbElement.style.width = thumbWidth + "px";
    thumbElement.style.height = "";
    thumbElement.style.transform = "translateX(" + thumbOffset + "px)";
  }

  function setHorizontalScrollFromThumbOffset(instance, thumbOffset) {
    var viewElement = instance.viewElement;
    var trackElement = instance.trackElement;
    var thumbElement = instance.thumbElement;
    var trackWidth = trackElement.clientWidth;
    var thumbWidth = thumbElement.offsetWidth;
    var thumbTravel = Math.max(0, trackWidth - thumbWidth);
    var scrollRange = viewElement.scrollWidth - viewElement.clientWidth;

    if (thumbTravel <= 0 || scrollRange <= 0) {
      viewElement.scrollLeft = 0;
      return;
    }

    var clampedOffset = thumbOffset;
    if (clampedOffset < 0) {
      clampedOffset = 0;
    }
    if (clampedOffset > thumbTravel) {
      clampedOffset = thumbTravel;
    }

    viewElement.scrollLeft = (clampedOffset / thumbTravel) * scrollRange;
  }

  function onHorizontalThumbPointerDown(instance, event) {
    event.preventDefault();
    event.stopPropagation();

    instance.thumbElement.classList.add("is-dragging");
    instance.dragPointerId = event.pointerId;
    instance.dragStartPointerX = event.clientX;
    instance.dragStartThumbOffset = instance.thumbOffset;

    if (instance.thumbElement.setPointerCapture) {
      instance.thumbElement.setPointerCapture(event.pointerId);
    }
  }

  function onHorizontalThumbPointerMove(instance, event) {
    if (instance.dragPointerId !== event.pointerId) {
      return;
    }

    var deltaX = event.clientX - instance.dragStartPointerX;
    setHorizontalScrollFromThumbOffset(instance, instance.dragStartThumbOffset + deltaX);
    updateHorizontalThumbLayout(instance);
  }

  function onHorizontalThumbPointerUp(instance, event) {
    if (instance.dragPointerId !== event.pointerId) {
      return;
    }

    instance.dragPointerId = null;
    instance.thumbElement.classList.remove("is-dragging");

    if (instance.thumbElement.releasePointerCapture) {
      try {
        instance.thumbElement.releasePointerCapture(event.pointerId);
      } catch (ignoredError) {
      }
    }
  }

  function onHorizontalTrackPointerDown(instance, event) {
    if (event.target === instance.thumbElement) {
      return;
    }

    event.preventDefault();

    var trackBounds = instance.trackElement.getBoundingClientRect();
    var thumbWidth = instance.thumbElement.offsetWidth;
    var targetOffset = event.clientX - trackBounds.left - thumbWidth * 0.5;
    setHorizontalScrollFromThumbOffset(instance, targetOffset);
    updateHorizontalThumbLayout(instance);
  }

  function onHorizontalScrollbarWheel(instance, event) {
    var delta = event.deltaX;
    if (delta === 0) {
      delta = event.deltaY;
    }
    if (delta === 0) {
      return;
    }
    if (instance.trackElement.classList.contains("is-hidden")) {
      return;
    }
    instance.viewElement.scrollLeft += delta;
    updateHorizontalThumbLayout(instance);
    event.preventDefault();
    event.stopPropagation();
  }

  function attachHorizontalScrollbarBehavior(instance) {
    var viewElement = instance.viewElement;
    var trackElement = instance.trackElement;
    var thumbElement = instance.thumbElement;

    viewElement.addEventListener("scroll", function () {
      updateHorizontalThumbLayout(instance);
    });

    thumbElement.addEventListener("pointerdown", function (event) {
      onHorizontalThumbPointerDown(instance, event);
    });

    thumbElement.addEventListener("pointermove", function (event) {
      onHorizontalThumbPointerMove(instance, event);
    });

    thumbElement.addEventListener("pointerup", function (event) {
      onHorizontalThumbPointerUp(instance, event);
    });

    thumbElement.addEventListener("pointercancel", function (event) {
      onHorizontalThumbPointerUp(instance, event);
    });

    trackElement.addEventListener("pointerdown", function (event) {
      onHorizontalTrackPointerDown(instance, event);
    });

    trackElement.addEventListener("wheel", function (event) {
      onHorizontalScrollbarWheel(instance, event);
    }, { passive: false });

    if (typeof ResizeObserver !== "undefined") {
      instance.resizeObserver = new ResizeObserver(function () {
        updateHorizontalThumbLayout(instance);
      });
      instance.resizeObserver.observe(viewElement);
      instance.resizeObserver.observe(trackElement);
    }

    if (typeof MutationObserver !== "undefined") {
      instance.mutationObserver = new MutationObserver(function () {
        updateHorizontalThumbLayout(instance);
      });
      instance.mutationObserver.observe(viewElement, { childList: true, subtree: true });
    }

    updateHorizontalThumbLayout(instance);
  }

  function wrapHorizontalScrollView(viewElement) {
    if (!viewElement || isWrappedHorizontalScrollView(viewElement)) {
      return;
    }

    var wrapperElement = document.createElement("div");
    wrapperElement.className = "menu-h-scroll";

    var trackElement = document.createElement("div");
    trackElement.className = "menu-h-scrollbar";
    trackElement.setAttribute("aria-hidden", "true");

    var thumbElement = document.createElement("div");
    thumbElement.className = "menu-h-scrollbar-thumb";
    trackElement.appendChild(thumbElement);

    viewElement.parentNode.insertBefore(wrapperElement, viewElement);
    wrapperElement.appendChild(viewElement);
    wrapperElement.appendChild(trackElement);
    viewElement.classList.add(HORIZONTAL_SCROLL_VIEW_CLASS);

    var instance = {
      viewElement: viewElement,
      trackElement: trackElement,
      thumbElement: thumbElement,
      dragPointerId: null,
      dragStartPointerX: 0,
      dragStartThumbOffset: 0,
      thumbOffset: 0,
      resizeObserver: null,
      mutationObserver: null
    };

    attachHorizontalScrollbarBehavior(instance);
    horizontalScrollbarInstances.push(instance);
  }

  function initHorizontalScrollViews(rootElement) {
    horizontalScrollbarInstances = [];
    var viewElements = collectHorizontalScrollElements(rootElement);
    var index = 0;
    for (index = 0; index < viewElements.length; index += 1) {
      var viewElement = viewElements[index];
      if (!shouldWrapHorizontalScrollElement(viewElement)) {
        continue;
      }
      wrapHorizontalScrollView(viewElement);
    }
  }

  function refreshAllHorizontalScrollbars() {
    var index = 0;
    for (index = 0; index < horizontalScrollbarInstances.length; index++) {
      updateHorizontalThumbLayout(horizontalScrollbarInstances[index]);
    }
  }

  function getScrollCursorToken(clientX, clientY) {
    var element = document.elementFromPoint(clientX, clientY);
    var horizontalTrack;
    var verticalTrack;
    if (!element || !element.closest) {
      return null;
    }
    horizontalTrack = element.closest(".menu-h-scrollbar");
    if (horizontalTrack != null && !horizontalTrack.classList.contains("is-hidden")) {
      return "scroll-h";
    }
    verticalTrack = element.closest(".menu-v-scrollbar");
    if (verticalTrack != null && !verticalTrack.classList.contains("is-hidden")) {
      return "scroll";
    }
    return null;
  }

  function isOverScrollbar(clientX, clientY) {
    return getScrollCursorToken(clientX, clientY) != null;
  }

  function refreshAllScrollbars() {
    var index = 0;
    for (index = 0; index < scrollbarInstances.length; index++) {
      updateThumbLayout(scrollbarInstances[index]);
    }
    refreshAllHorizontalScrollbars();
  }

  window.addEventListener("resize", refreshAllScrollbars);

  function onDomReady() {
    initScrollViews(document);
    observeScrollViewChanges();
  }

  window.addEventListener("web-page-changed", scheduleScrollViewScan);
  window.addEventListener("web-locale-applied", refreshAllScrollbars);

  window.WebScrollbarCursor = {
    isOverScrollbar: isOverScrollbar,
    getScrollCursorToken: getScrollCursorToken,
    refreshAllScrollbars: refreshAllScrollbars,
    initVerticalScrollViews: initVerticalScrollViews,
    initHorizontalScrollViews: initHorizontalScrollViews,
    initScrollViews: initScrollViews,
    scheduleScrollViewScan: scheduleScrollViewScan
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onDomReady);
  } else {
    onDomReady();
  }
})();
