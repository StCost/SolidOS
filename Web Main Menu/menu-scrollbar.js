(function () {
  var ATTR_OVERLAY_BOUND = "data-menu-overlay-bar";
  var CLASS_OVERLAY_BAR = "menu-v-scroll-bar";
  var CLASS_OVERLAY_TRACK = "menu-v-scroll-bar-track";
  var CLASS_OVERLAY_THUMB = "menu-v-scroll-bar-thumb";
  var CLASS_OVERLAY_IDLE = "menu-v-scroll-bar--idle";
  var CLASS_SCROLL_OVERLAY = "menu-v-scroll-view--overlay-bar";
  var THUMB_MIN_HEIGHT = 24;
  var CLIP_SELECTOR = ".menu-v-scroll-clip";
  var pendingUpdateFrame = 0;
  var boundScrollViews = [];

  function isToolbarSettingsTabs(element) {
    return element.classList && element.classList.contains("settings-tabs--toolbar");
  }

  function isScrollChild(element) {
    if (!element || !element.classList) {
      return false;
    }
    if (element.classList.contains("menu-v-scroll-bar")) {
      return false;
    }
    if (isToolbarSettingsTabs(element)) {
      return false;
    }
    if (
      element.classList.contains("menu-v-scroll-view") ||
      element.classList.contains("settings-scroll") ||
      element.classList.contains("extras-scroll") ||
      element.classList.contains("credits-scroll") ||
      element.classList.contains("worlds-list") ||
      element.classList.contains("game-hud-chat-log") ||
      element.classList.contains("settings-tabs")
    ) {
      return true;
    }
    return false;
  }

  function getScrollChildFromClip(clip) {
    var children = clip.children;
    var index;
    for (index = 0; index < children.length; index += 1) {
      if (isScrollChild(children[index])) {
        return children[index];
      }
    }
    return null;
  }

  function getThumbMetrics(scrollView) {
    var clientHeight = scrollView.clientHeight;
    var scrollHeight = scrollView.scrollHeight;
    if (scrollHeight <= clientHeight + 1) {
      return null;
    }
    var trackHeight = clientHeight;
    var thumbHeight = (clientHeight / scrollHeight) * clientHeight;
    if (thumbHeight < THUMB_MIN_HEIGHT) {
      thumbHeight = THUMB_MIN_HEIGHT;
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
    return {
      thumbHeight: thumbHeight,
      thumbTop: thumbTop,
      thumbTravel: thumbTravel,
      scrollRange: scrollRange
    };
  }

  function updateOverlayBar(scrollView) {
    var bar = scrollView.__menuOverlayBar;
    if (!bar) {
      return;
    }
    var thumb = scrollView.__menuOverlayThumb;
    var metrics = getThumbMetrics(scrollView);
    if (!metrics) {
      bar.classList.add(CLASS_OVERLAY_IDLE);
      thumb.style.height = "0";
      thumb.style.transform = "translate3d(0,0,0)";
      scrollView.__menuOverlayThumbTravel = 0;
      scrollView.__menuOverlayScrollRange = 0;
      return;
    }
    bar.classList.remove(CLASS_OVERLAY_IDLE);
    thumb.style.height = metrics.thumbHeight + "px";
    thumb.style.transform = "translate3d(0," + metrics.thumbTop + "px,0)";
    scrollView.__menuOverlayThumbTravel = metrics.thumbTravel;
    scrollView.__menuOverlayScrollRange = metrics.scrollRange;
  }

  function scheduleOverlayUpdate(scrollView) {
    if (!scrollView || !scrollView.__menuOverlayBar) {
      return;
    }
    if (scrollView.__menuOverlayUpdateQueued) {
      return;
    }
    scrollView.__menuOverlayUpdateQueued = true;
    if (pendingUpdateFrame) {
      return;
    }
    pendingUpdateFrame = window.requestAnimationFrame(function () {
      pendingUpdateFrame = 0;
      var index;
      for (index = 0; index < boundScrollViews.length; index += 1) {
        boundScrollViews[index].__menuOverlayUpdateQueued = false;
        updateOverlayBar(boundScrollViews[index]);
      }
    });
  }

  function onScrollViewScroll(event) {
    scheduleOverlayUpdate(event.currentTarget);
  }

  function onThumbPointerDown(event) {
    var thumb = event.currentTarget;
    var scrollView = thumb.__menuScrollView;
    if (!scrollView) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    var startClientY = event.clientY;
    var startScrollTop = scrollView.scrollTop;
    var thumbTravel = scrollView.__menuOverlayThumbTravel || 0;
    var scrollRange = scrollView.__menuOverlayScrollRange || 0;

    function onPointerMove(moveEvent) {
      var deltaY = moveEvent.clientY - startClientY;
      var nextScrollTop = startScrollTop;
      if (thumbTravel > 0 && scrollRange > 0) {
        nextScrollTop = startScrollTop + (deltaY / thumbTravel) * scrollRange;
      }
      if (nextScrollTop < 0) {
        nextScrollTop = 0;
      } else if (nextScrollTop > scrollRange) {
        nextScrollTop = scrollRange;
      }
      scrollView.scrollTop = nextScrollTop;
    }

    function onPointerUp() {
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onPointerUp, true);
    }

    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerUp, true);
  }

  function bindResizeObserver(scrollView) {
    if (!window.ResizeObserver) {
      return;
    }
    var resizeObserver = new ResizeObserver(function () {
      scheduleOverlayUpdate(scrollView);
    });
    resizeObserver.observe(scrollView);
    scrollView.__menuOverlayResizeObserver = resizeObserver;
  }

  function bindMutationObserver(scrollView) {
    if (!window.MutationObserver) {
      return;
    }
    var mutationObserver = new MutationObserver(function () {
      scheduleOverlayUpdate(scrollView);
    });
    mutationObserver.observe(scrollView, {
      childList: true,
      subtree: true,
      characterData: true
    });
    scrollView.__menuOverlayMutationObserver = mutationObserver;
  }

  function bindOverlayBar(scrollView, clip) {
    if (!scrollView || scrollView.getAttribute(ATTR_OVERLAY_BOUND) === "true") {
      return;
    }
    scrollView.setAttribute(ATTR_OVERLAY_BOUND, "true");
    scrollView.classList.add(CLASS_SCROLL_OVERLAY);

    var bar = document.createElement("div");
    bar.className = CLASS_OVERLAY_BAR;
    bar.classList.add(CLASS_OVERLAY_IDLE);
    bar.setAttribute("aria-hidden", "true");

    var track = document.createElement("div");
    track.className = CLASS_OVERLAY_TRACK;

    var thumb = document.createElement("div");
    thumb.className = CLASS_OVERLAY_THUMB;
    thumb.__menuScrollView = scrollView;

    track.appendChild(thumb);
    bar.appendChild(track);
    clip.appendChild(bar);

    scrollView.__menuOverlayBar = bar;
    scrollView.__menuOverlayTrack = track;
    scrollView.__menuOverlayThumb = thumb;

    thumb.addEventListener("pointerdown", onThumbPointerDown, true);
    scrollView.addEventListener("scroll", onScrollViewScroll, { passive: true });

    bindResizeObserver(scrollView);
    bindMutationObserver(scrollView);
    boundScrollViews.push(scrollView);
    scheduleOverlayUpdate(scrollView);
  }

  function scanClip(clip) {
    var scrollView = getScrollChildFromClip(clip);
    if (!scrollView) {
      return;
    }
    bindOverlayBar(scrollView, clip);
  }

  function scanAllClips(root) {
    var scope = root || document;
    var clips = scope.querySelectorAll(CLIP_SELECTOR);
    var index;
    for (index = 0; index < clips.length; index += 1) {
      scanClip(clips[index]);
    }
  }

  function onDocumentMutated(mutations) {
    var index;
    var mutation;
    for (index = 0; index < mutations.length; index += 1) {
      mutation = mutations[index];
      if (mutation.type !== "childList") {
        continue;
      }
      scanAllClips(document);
      return;
    }
  }

  function bindDocumentObserver() {
    if (!window.MutationObserver) {
      return;
    }
    var documentObserver = new MutationObserver(onDocumentMutated);
    documentObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  window.WebMenuScrollbar = {
    refresh: function () {
      scanAllClips(document);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      scanAllClips(document);
      bindDocumentObserver();
    });
  } else {
    scanAllClips(document);
    bindDocumentObserver();
  }
})();
