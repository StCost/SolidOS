(function () {
  var scrollbarThumbMinSize = 24;
  var scrollbarInstances = [];
  var SCROLL_VIEW_CLASS = "iframe-game-scroll-view";
  var boundFlag = "__cmIframeGameScrollbarBound";

  if (window[boundFlag]) {
    return;
  }
  window[boundFlag] = true;

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

    if (window.ResizeObserver) {
      instance.resizeObserver = new ResizeObserver(function () {
        updateThumbLayout(instance);
      });
      instance.resizeObserver.observe(listElement);
    }

    updateThumbLayout(instance);
  }

  function isWrappedVerticalScrollView(element) {
    var parentElement = element.parentElement;
    return !!(parentElement && parentElement.classList && parentElement.classList.contains("menu-v-scroll"));
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
      resizeObserver: null
    };

    attachVerticalScrollbarBehavior(instance);
    scrollbarInstances.push(instance);
  }

  function initScrollViews(rootElement) {
    var root = rootElement || document;
    var nodes = root.querySelectorAll("." + SCROLL_VIEW_CLASS);
    var index;
    for (index = 0; index < nodes.length; index += 1) {
      wrapVerticalScrollView(nodes[index]);
    }
  }

  function refreshAllScrollbars() {
    var index;
    for (index = 0; index < scrollbarInstances.length; index += 1) {
      updateThumbLayout(scrollbarInstances[index]);
    }
  }

  window.WebIframeGameScrollbar = {
    initScrollViews: initScrollViews,
    refreshAllScrollbars: refreshAllScrollbars
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initScrollViews(document);
    });
  } else {
    initScrollViews(document);
  }
})();
