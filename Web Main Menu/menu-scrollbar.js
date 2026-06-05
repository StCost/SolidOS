(function () {
  var scrollbarThumbMinSize = 24;
  var verticalScrollbarInstances = [];
  var horizontalScrollbarInstances = [];
  var scrollViewScanScheduled = false;
  var SCROLL_VIEW_CLASS = "menu-v-scroll-view";
  var boundFlag = "__cmMenuScrollbarBound";

  if (window[boundFlag]) {
    return;
  }
  window[boundFlag] = true;

  function canListScroll(listElement) {
    return listElement.scrollHeight > listElement.clientHeight + 1;
  }

  function canHorizontalScroll(viewElement) {
    return viewElement.scrollWidth > viewElement.clientWidth + 1;
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
    var clampedOffset = thumbOffset;

    if (thumbTravel <= 0 || scrollRange <= 0) {
      listElement.scrollTop = 0;
      return;
    }
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
    event.preventDefault();
    instance.listElement.scrollTop += event.deltaY;
    updateThumbLayout(instance);
  }

  function attachVerticalScrollbarBehavior(instance) {
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

    listElement.addEventListener(
      "wheel",
      function (event) {
        onVerticalScrollbarWheel(instance, event);
      },
      { passive: false }
    );

    updateThumbLayout(instance);
  }

  function isWrappedVerticalScrollView(element) {
    var parentElement = element.parentElement;
    if (!parentElement || !parentElement.classList) {
      return false;
    }
    if (parentElement.classList.contains("menu-v-scroll")) {
      return true;
    }
    if (parentElement.classList.contains("worlds-list-scroll")) {
      return true;
    }
    return false;
  }

  function wrapVerticalScrollView(scrollElement, useLegacyWorldsListLayout) {
    var wrapperElement;
    var trackElement;
    var thumbElement;
    var instance;

    if (!scrollElement || isWrappedVerticalScrollView(scrollElement)) {
      return;
    }

    wrapperElement = document.createElement("div");
    trackElement = document.createElement("div");
    thumbElement = document.createElement("div");
    trackElement.setAttribute("aria-hidden", "true");
    thumbElement.className = useLegacyWorldsListLayout ? "worlds-list-scrollbar-thumb" : "menu-v-scrollbar-thumb";
    trackElement.className = useLegacyWorldsListLayout ? "worlds-list-scrollbar" : "menu-v-scrollbar";
    wrapperElement.className = useLegacyWorldsListLayout ? "worlds-list-scroll" : "menu-v-scroll";
    trackElement.appendChild(thumbElement);

    scrollElement.parentNode.insertBefore(wrapperElement, scrollElement);
    wrapperElement.appendChild(scrollElement);
    wrapperElement.appendChild(trackElement);

    instance = {
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

    attachVerticalScrollbarBehavior(instance);
    verticalScrollbarInstances.push(instance);
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
    var clampedOffset = thumbOffset;

    if (thumbTravel <= 0 || scrollRange <= 0) {
      viewElement.scrollLeft = 0;
      return;
    }
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

    updateHorizontalThumbLayout(instance);
  }

  function wrapHorizontalScrollView(viewElement) {
    var wrapperElement;
    var trackElement;
    var thumbElement;
    var instance;

    if (!viewElement || viewElement.closest(".menu-h-scroll")) {
      return;
    }

    wrapperElement = document.createElement("div");
    wrapperElement.className = "menu-h-scroll";

    trackElement = document.createElement("div");
    trackElement.className = "menu-h-scrollbar";
    trackElement.setAttribute("aria-hidden", "true");

    thumbElement = document.createElement("div");
    thumbElement.className = "menu-h-scrollbar-thumb";
    trackElement.appendChild(thumbElement);

    viewElement.parentNode.insertBefore(wrapperElement, viewElement);
    wrapperElement.appendChild(viewElement);
    wrapperElement.appendChild(trackElement);

    instance = {
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

  function initVerticalScrollViews(rootElement) {
    var root = rootElement || document;
    var nodes = root.getElementsByClassName(SCROLL_VIEW_CLASS);
    var index;
    for (index = 0; index < nodes.length; index += 1) {
      wrapVerticalScrollView(nodes[index], false);
    }
  }

  function initHorizontalScrollViews(rootElement) {
    horizontalScrollbarInstances = [];
    var searchRoot = rootElement || document;
    var viewElements = searchRoot.getElementsByClassName("menu-h-scroll-view");
    var index;
    for (index = 0; index < viewElements.length; index += 1) {
      wrapHorizontalScrollView(viewElements[index]);
    }
  }

  function scheduleScrollViewScan() {
    if (scrollViewScanScheduled) {
      return;
    }
    scrollViewScanScheduled = true;
    window.requestAnimationFrame(function () {
      scrollViewScanScheduled = false;
      initVerticalScrollViews(document);
      initHorizontalScrollViews(document);
      refreshAllScrollbars();
    });
  }

  function refreshAllVerticalScrollbars() {
    var index;
    for (index = 0; index < verticalScrollbarInstances.length; index += 1) {
      updateThumbLayout(verticalScrollbarInstances[index]);
    }
  }

  function refreshAllHorizontalScrollbars() {
    var index;
    for (index = 0; index < horizontalScrollbarInstances.length; index += 1) {
      updateHorizontalThumbLayout(horizontalScrollbarInstances[index]);
    }
  }

  function refreshAllScrollbars() {
    refreshAllVerticalScrollbars();
    refreshAllHorizontalScrollbars();
  }

  function refreshScrollElement(scrollElement) {
    if (!scrollElement) return;
    var index;
    for (index = 0; index < verticalScrollbarInstances.length; index += 1) {
      if (verticalScrollbarInstances[index].listElement === scrollElement) {
        updateThumbLayout(verticalScrollbarInstances[index]);
        return;
      }
    }
  }

  function isScrollThumbElement(element) {
    if (!element || !element.classList) {
      return false;
    }
    if (element.classList.contains("menu-v-scrollbar-thumb")) {
      return true;
    }
    if (element.classList.contains("worlds-list-scrollbar-thumb")) {
      return true;
    }
    if (element.classList.contains("menu-h-scrollbar-thumb")) {
      return true;
    }
    return false;
  }

  function getScrollCursorToken(clientX, clientY) {
    var element = document.elementFromPoint(clientX, clientY);
    if (!element || !element.closest) {
      return null;
    }
    if (element.closest(".menu-h-scrollbar-thumb")) {
      return "scroll-h";
    }
    if (element.closest(".menu-v-scrollbar-thumb") || element.closest(".worlds-list-scrollbar-thumb")) {
      return "scroll";
    }
    return null;
  }

  function isOverScrollbar(clientX, clientY) {
    return getScrollCursorToken(clientX, clientY) != null;
  }

  function findVerticalScrollContainer(element) {
    var node = element;
    var wrapper;
    var view;
    if (isScrollThumbElement(element)) {
      wrapper = element.closest(".menu-v-scroll") || element.closest(".worlds-list-scroll");
      if (wrapper) {
        view = wrapper.querySelector("." + SCROLL_VIEW_CLASS) || wrapper.querySelector(".worlds-list");
        if (view && canListScroll(view)) {
          return view;
        }
      }
    }
    while (node) {
      if (node.classList && node.classList.contains(SCROLL_VIEW_CLASS) && canListScroll(node)) {
        return node;
      }
      if (node === document.body || node === document.documentElement) {
        break;
      }
      node = node.parentElement;
    }
    return null;
  }

  function scrollVerticalContainer(container, directionY, stepSize) {
    var beforeScrollTop;
    var step = stepSize || 56;
    if (!container || directionY === 0) {
      return false;
    }
    beforeScrollTop = container.scrollTop;
    container.scrollTop = beforeScrollTop + directionY * step;
    if (container.scrollTop !== beforeScrollTop) {
      refreshAllScrollbars();
      return true;
    }
    return false;
  }

  function scrollFromActiveElement(directionY, stepSize) {
    var activeElement = document.activeElement;
    var container;
    if (!activeElement) {
      return false;
    }
    container = findVerticalScrollContainer(activeElement);
    if (!container) {
      return false;
    }
    return scrollVerticalContainer(container, directionY, stepSize);
  }

  window.addEventListener("resize", refreshAllScrollbars);

  window.WebScrollbarCursor = {
    isOverScrollbar: isOverScrollbar,
    getScrollCursorToken: getScrollCursorToken,
    refreshAllScrollbars: refreshAllScrollbars,
    refreshScrollElement: refreshScrollElement,
    initVerticalScrollViews: initVerticalScrollViews,
    initHorizontalScrollViews: initHorizontalScrollViews,
    scheduleScrollViewScan: scheduleScrollViewScan,
    findVerticalScrollContainer: findVerticalScrollContainer,
    scrollVerticalContainer: scrollVerticalContainer,
    scrollFromActiveElement: scrollFromActiveElement,
    isScrollThumbElement: isScrollThumbElement
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initVerticalScrollViews(document);
      initHorizontalScrollViews(document);
    });
  } else {
    initVerticalScrollViews(document);
    initHorizontalScrollViews(document);
  }
})();
