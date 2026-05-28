(function () {
  var HASH_PREFIX = "#/";
  var ROUTE_QUERY_KEYS = ["route", "p"];
  var applyingRoute = false;

  function isWebMode() {
    return typeof window.vuplex === "undefined" || !window.vuplex.postMessage;
  }

  function trimSlashes(path) {
    if (!path) return "";
    return path.replace(/^\/+|\/+$/g, "");
  }

  function normalizeRouteSegment(segment) {
    if (!segment) return "";
    var value = decodeURIComponent(segment).toLowerCase();
    if (value === "arts") return "art";
    if (value === "game") return "games";
    if (value === "links" || value === "link") return "links";
    return value;
  }

  function parseRouteFromLocation() {
    var path = "";
    var hash = window.location.hash || "";
    if (hash.indexOf("#") === 0) {
      hash = hash.slice(1);
    }
    if (hash.indexOf("/") === 0) {
      hash = hash.slice(1);
    }
    path = trimSlashes(hash);

    if (!path && window.location.search) {
      var index;
      var params = new URLSearchParams(window.location.search);
      for (index = 0; index < ROUTE_QUERY_KEYS.length; index++) {
        var queryPath = params.get(ROUTE_QUERY_KEYS[index]);
        if (queryPath) {
          path = trimSlashes(queryPath);
          break;
        }
      }
    }

    if (!path) return [];
    var rawSegments = path.split("/");
    var segments = [];
    var segmentIndex;
    for (segmentIndex = 0; segmentIndex < rawSegments.length; segmentIndex++) {
      var part = rawSegments[segmentIndex];
      if (!part) continue;
      segments.push(part);
    }
    return segments;
  }

  function buildHashFromSegments(segments) {
    if (!segments || !segments.length) return "";
    var index;
    var encoded = "";
    for (index = 0; index < segments.length; index++) {
      if (index > 0) encoded += "/";
      encoded += encodeURIComponent(segments[index]);
    }
    return HASH_PREFIX + encoded;
  }

  function setLocationRoute(segments, useReplace) {
    if (!isWebMode()) return;
    var nextHash = buildHashFromSegments(segments);
    var base = window.location.pathname + window.location.search;
    var nextUrl = base + nextHash;
    if (window.location.pathname + window.location.search + window.location.hash === nextUrl) {
      return;
    }
    if (useReplace) {
      window.history.replaceState(null, "", nextUrl);
    } else {
      window.history.pushState(null, "", nextUrl);
    }
  }

  function openSettingsForRoute(tabId) {
    if (!window.WebMenu) return;
    window.WebMenu.goToSettingsPage();
    if (window.WebSettingsBridge) {
      window.WebSettingsBridge.open();
    }
    window.dispatchEvent(new CustomEvent("web-settings-open"));
    if (tabId && window.WebSettings && window.WebSettings.setActiveTab) {
      window.WebSettings.setActiveTab(tabId);
    }
  }

  function applyRouteSegments(segments) {
    if (!window.WebMenu || !segments) return;
    if (!segments.length) {
      window.WebMenu.goToIndexPage();
      return;
    }

    var page = normalizeRouteSegment(segments[0]);
    if (page === "start") {
      window.WebMenu.goToStartPage();
      return;
    }
    if (page === "settings") {
      var settingsTab = "";
      if (segments.length > 1) {
        settingsTab = segments[1];
      }
      openSettingsForRoute(settingsTab);
      return;
    }
    if (page === "extras") {
      window.WebMenu.goToExtrasPage();
      if (window.WebExtras && window.WebExtras.applyRoute) {
        window.WebExtras.applyRoute(segments.slice(1));
      }
      return;
    }
    if (page === "credits") {
      window.WebMenu.goToCreditsPage();
      return;
    }

    window.WebMenu.goToIndexPage();
  }

  function getRouteSegmentsFromUi() {
    if (!window.WebMenu) return [];
    var pageId = window.WebMenu.getCurrentPageId();
    if (pageId === window.WebMenu.PAGE_START) {
      return ["start"];
    }
    if (pageId === window.WebMenu.PAGE_SETTINGS) {
      var settingsSegments = ["settings"];
      if (window.WebSettings && window.WebSettings.getActiveTabId) {
        var tabId = window.WebSettings.getActiveTabId();
        if (tabId) settingsSegments.push(tabId);
      }
      return settingsSegments;
    }
    if (pageId === window.WebMenu.PAGE_EXTRAS) {
      if (window.WebExtras && window.WebExtras.getRouteSegments) {
        return window.WebExtras.getRouteSegments();
      }
      return ["extras"];
    }
    if (pageId === window.WebMenu.PAGE_CREDITS) {
      return ["credits"];
    }
    return [];
  }

  function syncRouteFromUi(useReplace) {
    if (!isWebMode() || applyingRoute) return;
    setLocationRoute(getRouteSegmentsFromUi(), useReplace === true);
  }

  function bootRouteFromLocation() {
    if (!isWebMode()) return;
    var segments = parseRouteFromLocation();
    applyingRoute = true;
    if (segments.length) {
      applyRouteSegments(segments);
    }
    applyingRoute = false;
    syncRouteFromUi(true);
  }

  function onHashChange() {
    if (!isWebMode() || applyingRoute) return;
    applyingRoute = true;
    applyRouteSegments(parseRouteFromLocation());
    applyingRoute = false;
  }

  function isApplyingRoute() {
    return applyingRoute;
  }

  window.WebMenuRoute = {
    isWebMode: isWebMode,
    isApplyingRoute: isApplyingRoute,
    parseRouteFromLocation: parseRouteFromLocation,
    applyRouteSegments: applyRouteSegments,
    syncFromUi: syncRouteFromUi
  };

  window.addEventListener("hashchange", onHashChange);
  window.addEventListener("web-page-changed", function () {
    syncRouteFromUi(false);
  });
  window.addEventListener("web-settings-tab-changed", function () {
    syncRouteFromUi(false);
  });
  window.addEventListener("web-extras-route-changed", function () {
    syncRouteFromUi(false);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootRouteFromLocation);
  } else {
    bootRouteFromLocation();
  }
})();
