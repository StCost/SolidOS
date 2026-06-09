(function () {
  var STORAGE_BEST_NIGHT = "factoryNightBestNight";
  var STORAGE_BEST_CORRECT_REPORTS = "factoryNightBestCorrectReports";
  var HOUR_DISPLAY_START = 12;
  var HOUR_WIN = 6;
  var NIGHT_MAX = 5;
  var POWER_START = 100;
  var POWER_DISPLAY_MAX = 99;
  var TICK_MS = 100;
  var HOUR_REAL_SECONDS = 45;
  var POWER_REPORT_GAIN = 22;
  var POWER_OUT_DRAIN_MULT = 0.08;
  var POWER_DRAIN_USAGE_MULT = 2.65;
  var FIXED_POWER_USAGE = 1;
  var MONSTER_VIEW_DRAIN_DELAY_MS = 1000;
  var MONSTER_VIEW_DRAIN_MULT = 2.35;
  var NIGHT_POWER_DRAIN_MULT_PER_NIGHT = 1.5;
  var REPORTED_FLASH_MS = 1100;
  var ALL_CAMERAS_REFRESH_MS = 9000;
  var CAM_CHANGE_FADE_MS = 1000;
  var POWER_OUT_SCARE_MIN_MS = 5000;
  var POWER_OUT_SCARE_MAX_MS = 12000;
  var POWER_OUT_SCREAMER_FLASH_MS = 520;
  var CAM_MAP_MARGIN_X = 8;
  var CAM_MAP_MARGIN_Y = 12;
  var CAM_MAP_SPAN_X = 84;
  var CAM_MAP_SPAN_Y = 76;
  var CAM_MAP_NODE_HALF_W = 6;
  var CAM_MAP_NODE_HALF_H = 5;
  var CAM_MAP_NODE_GAP = 3;
  var CAM_MAP_PLACE_TRIES = 80;

  var ROOM_NAME_KEYS = [
    "web.game.factory-night.room.01",
    "web.game.factory-night.room.02",
    "web.game.factory-night.room.03",
    "web.game.factory-night.room.04",
    "web.game.factory-night.room.05",
    "web.game.factory-night.room.06"
  ];

  var ROOM_NAME_FALLBACKS = [
    "CAM-01 LOADING BAY",
    "CAM-02 CONVEYOR LINE",
    "CAM-03 FURNACE PIT",
    "CAM-04 PARTS STORAGE",
    "CAM-05 WELD STATION",
    "CAM-06 BREAK ROOM"
  ];

  var ROOM_COUNT = ROOM_NAME_FALLBACKS.length;

  var CAM_GRAPH_EDGES = [
    [0, 1],
    [1, 2],
    [3, 4],
    [4, 5],
    [0, 3],
    [1, 4],
    [2, 5],
    [1, 3],
    [2, 4]
  ];

  var ASSETS_BASE = "assets/";
  var SAFE_FOLDER = "safe/";
  var MONSTER_FOLDER = "monster/";
  var IMAGE_MANIFEST_URL = ASSETS_BASE + "image-manifest.json";
  var CAM_NUMBERS = ["01", "02", "03", "04", "05", "06"];

  var imageManifest = { safe: [], monster: [] };
  var imageCatalog = [];
  var IMAGE_IS_MONSTER = {};
  var cameraAmbientPaths = [];
  var screamerPaths = [];
  var imageIsMonster = {};

  var gameRoot;
  var cameraFeedImg;
  var cameraViewportEl;
  var cameraNoSignalEl;
  var cameraReportedEl;
  var reportButtonEl;
  var camMapNodesEl;
  var camMapEdgesEl;
  var hourValueEl;
  var nightValueEl;
  var powerFillEl;
  var powerPercentEl;
  var powerHudEl;
  var monitorRoomNameEl;
  var monitorBlockEl;
  var startOverlayEl;
  var winOverlayEl;
  var gameOverOverlayEl;
  var powerOutOverlayEl;
  var fullscreenScreamerEl;
  var jumpscareFaceEl;
  var bestNightLineEl;
  var bestCorrectReportsLineEl;
  var correctReportsValueEl;

  var state;
  var tickTimer;
  var camSwitchFadeTimer;
  var powerOutScareTimer;
  var powerOutScreamerTimer;
  var bestNight;
  var bestCorrectReports;
  var preloadedImages = {};
  function getSynth() {
    return window.WebExtrasGameSynthAudio;
  }
  var menuPreviewRoomIndex = 0;
  var feedAssignRefreshActive = false;
  var feedAssignPreviousPaths = [];
  var cameraMotionRafHandle = 0;
  var cameraMotionStartMs = 0;
  var cameraMotionCornerDurationMs = 1700;
  var cameraMotionCornerHoldMs = 220;
  var cameraMotionZoom = 1.06;

  function registerImageMeta(path, isMonster) {
    imageIsMonster[path] = isMonster;
  }

  function getImageFileName(path) {
    var slashIndex = path.lastIndexOf("/");
    if (slashIndex >= 0) {
      return path.slice(slashIndex + 1);
    }
    return path;
  }

  function getAssetPath(folder, fileName) {
    return ASSETS_BASE + folder + fileName;
  }

  function registerCatalogEntry(folder, fileName, isMonster) {
    var path = getAssetPath(folder, fileName);
    IMAGE_IS_MONSTER[fileName] = isMonster;
    registerImageMeta(path, isMonster);
    imageCatalog.push({
      fileName: fileName,
      folder: folder,
      isMonster: isMonster
    });
    if (isMonster) {
      if (fileName.indexOf("screamer-") === 0 || fileName === "jumpscare.jpg") {
        screamerPaths.push(path);
      }
    } else if (fileName.indexOf("cam") === 0) {
      cameraAmbientPaths.push(path);
    }
  }

  function getGameText(key, fallback) {
    if (window.WebGameLocale && window.WebGameLocale.get) {
      return window.WebGameLocale.get(key, fallback);
    }
    return fallback;
  }

  function formatGameText(key, fallback) {
    var argIndex;
    var text = getGameText(key, fallback);
    for (argIndex = 2; argIndex < arguments.length; argIndex++) {
      text = text.split("{" + String(argIndex - 2) + "}").join(String(arguments[argIndex]));
    }
    return text;
  }

  function getRoomName(roomIndex) {
    if (roomIndex < 0 || roomIndex >= ROOM_NAME_KEYS.length) {
      return ROOM_NAME_FALLBACKS[0];
    }
    return getGameText(ROOM_NAME_KEYS[roomIndex], ROOM_NAME_FALLBACKS[roomIndex]);
  }

  function updateStartButtonLabel(nightNumber) {
    var startButton = document.getElementById("startButton");
    if (startButton) {
      startButton.textContent = formatGameText(
        "web.game.factory-night.start-night",
        "START NIGHT {0}",
        nightNumber
      );
    }
  }

  function updateBestNightLine() {
    if (bestNightLineEl) {
      bestNightLineEl.textContent = formatGameText(
        "web.game.factory-night.best-night",
        "Best night reached: {0}",
        bestNight
      );
    }
  }

  function updateBestCorrectReportsLine() {
    if (bestCorrectReportsLineEl) {
      bestCorrectReportsLineEl.textContent = formatGameText(
        "web.game.factory-night.best-correct",
        "Best correct reports: {0}",
        bestCorrectReports
      );
    }
  }

  function applyGameLocale() {
    if (window.WebGameLocale && window.WebGameLocale.applyDom) {
      window.WebGameLocale.applyDom();
    }
    document.title = getGameText("web.game.factory-night.title", "Factory Night");
    updateStartButtonLabel(state ? state.night : 1);
    updateBestNightLine();
    updateBestCorrectReportsLine();
    if (state && monitorRoomNameEl) {
      if (state.playing) {
        monitorRoomNameEl.textContent = getRoomName(state.cameraIndex);
      } else {
        monitorRoomNameEl.textContent = getRoomName(menuPreviewRoomIndex);
      }
    }
  }

  function onGameLocaleApplied() {
    applyGameLocale();
  }

  function buildImageRegistry() {
    var index;
    var fileName;
    IMAGE_IS_MONSTER = {};
    cameraAmbientPaths = [];
    screamerPaths = [];
    imageIsMonster = {};
    imageCatalog = [];
    if (!imageManifest) {
      imageManifest = { safe: [], monster: [] };
    }
    if (!imageManifest.safe) {
      imageManifest.safe = [];
    }
    if (!imageManifest.monster) {
      imageManifest.monster = [];
    }
    for (index = 0; index < imageManifest.safe.length; index++) {
      fileName = imageManifest.safe[index];
      registerCatalogEntry(SAFE_FOLDER, fileName, false);
    }
    for (index = 0; index < imageManifest.monster.length; index++) {
      fileName = imageManifest.monster[index];
      registerCatalogEntry(MONSTER_FOLDER, fileName, true);
    }
  }

  function buildImageMetaRegistry() {
    buildImageRegistry();
  }

  function isSuccessfulXhr(request) {
    if (!request) {
      return false;
    }
    if (request.status === 0) {
      return !!request.responseText;
    }
    return request.status >= 200 && request.status < 300;
  }

  function setCameraFeedImageSrc(path) {
    var nextSrc;
    if (!cameraFeedImg || !path) {
      return;
    }
    state.camFeedVersion = state.camFeedVersion + 1;
    nextSrc = path + "#v=" + String(state.camFeedVersion);
    if (cameraFeedImg.getAttribute("src") === nextSrc) {
      state.camFeedVersion = state.camFeedVersion + 1;
      nextSrc = path + "#v=" + String(state.camFeedVersion);
    }
    cameraFeedImg.src = nextSrc;
  }

  function loadImageManifest(done) {
    var request = new XMLHttpRequest();
    request.open("GET", IMAGE_MANIFEST_URL, true);
    request.onload = function () {
      if (isSuccessfulXhr(request)) {
        try {
          imageManifest = JSON.parse(request.responseText);
        } catch (error) {
          imageManifest = { safe: [], monster: [] };
        }
      } else {
        imageManifest = { safe: [], monster: [] };
      }
      buildImageMetaRegistry();
      done();
    };
    request.onerror = function () {
      imageManifest = { safe: [], monster: [] };
      buildImageMetaRegistry();
      done();
    };
    request.send();
  }

  function loadBestNight() {
    var raw = 0;
    try {
      raw = parseInt(window.localStorage.getItem(STORAGE_BEST_NIGHT) || "0", 10);
    } catch (error) {
      raw = 0;
    }
    if (isNaN(raw) || raw < 0) {
      raw = 0;
    }
    return raw;
  }

  function saveBestNight(value) {
    try {
      window.localStorage.setItem(STORAGE_BEST_NIGHT, String(value));
    } catch (error) {
    }
  }

  function loadBestCorrectReports() {
    var raw = 0;
    try {
      raw = parseInt(window.localStorage.getItem(STORAGE_BEST_CORRECT_REPORTS) || "0", 10);
    } catch (error) {
      raw = 0;
    }
    if (isNaN(raw) || raw < 0) {
      raw = 0;
    }
    return raw;
  }

  function saveBestCorrectReports(value) {
    try {
      window.localStorage.setItem(STORAGE_BEST_CORRECT_REPORTS, String(value));
    } catch (error) {
    }
  }

  function trySaveBestCorrectReports(count) {
    if (count > bestCorrectReports) {
      bestCorrectReports = count;
      saveBestCorrectReports(bestCorrectReports);
      updateBestCorrectReportsLine();
    }
  }

  function createInitialState() {
    return {
      playing: false,
      night: 1,
      hour: 0,
      hourAccumulator: 0,
      power: POWER_START,
      usage: FIXED_POWER_USAGE,
      cameraIndex: 0,
      powerOut: false,
      gameOver: false,
      won: false,
      camNodePositions: [],
      aggression: 0.6,
      cameraFeedPaths: [],
      usedPathsByRoom: [],
      camFeedVersion: 0,
      camCycleStartMs: 0,
      camFeedsPending: false,
      nightSeed: 0,
      nightRngState: 1,
      currentFeedPath: "",
      currentFeedIsMonster: false,
      correctReports: 0,
      monsterViewStartMs: 0
    };
  }

  function buildNightSeed(nightNumber) {
    var seed;
    seed = (nightNumber * 10007) + ((Date.now() / 1) | 0);
    seed = (seed ^ ((Math.random() * 2147483646) | 0)) | 0;
    if (typeof performance !== "undefined" && performance.now) {
      seed = (seed ^ ((performance.now() * 1000) | 0)) | 0;
    }
    if (seed <= 0) {
      seed = 1;
    }
    return seed;
  }

  function pickRandomInt(maxExclusive) {
    if (maxExclusive <= 0) {
      return 0;
    }
    return Math.floor(Math.random() * maxExclusive);
  }

  function clamp01(value) {
    if (value <= 0) {
      return 0;
    }
    if (value >= 1) {
      return 1;
    }
    return value;
  }

  function lerpNumber(a, b, t) {
    return a + (b - a) * t;
  }

  function applyCameraMotionCss(panX, panY, zoom) {
    if (!cameraViewportEl) {
      return;
    }
    cameraViewportEl.style.setProperty("--camera-pan-x", String(Math.round(panX)) + "px");
    cameraViewportEl.style.setProperty("--camera-pan-y", String(Math.round(panY)) + "px");
    cameraViewportEl.style.setProperty("--camera-zoom", String(zoom));
  }

  function applyStaticRotationCss(rotationDeg) {
    if (!cameraViewportEl) {
      return;
    }
    cameraViewportEl.style.setProperty("--static-rot", String(rotationDeg) + "deg");
  }

  function getCameraCornerScanPan(nowMs) {
    var cornerDurationMs = cameraMotionCornerDurationMs;
    var holdMs = cameraMotionCornerHoldMs;
    if (holdMs < 0) {
      holdMs = 0;
    }
    if (holdMs > cornerDurationMs) {
      holdMs = cornerDurationMs;
    }
    var moveMs = cornerDurationMs - holdMs;
    var stepMs = cornerDurationMs;
    var cycleMs = stepMs * 4;
    var t = nowMs - cameraMotionStartMs;
    if (t < 0) {
      t = 0;
    }
    var within = t % cycleMs;
    var segmentIndex = Math.floor(within / stepMs);
    var segmentT = clamp01((within - segmentIndex * stepMs) / stepMs);

    var corners = [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 }
    ];
    var from = corners[segmentIndex % corners.length];
    var to = corners[(segmentIndex + 1) % corners.length];

    return {
      x: (segmentT <= (holdMs / stepMs) || moveMs <= 0) ? from.x : lerpNumber(from.x, to.x, clamp01((segmentT * stepMs - holdMs) / moveMs)),
      y: (segmentT <= (holdMs / stepMs) || moveMs <= 0) ? from.y : lerpNumber(from.y, to.y, clamp01((segmentT * stepMs - holdMs) / moveMs))
    };
  }

  function updateCameraMotionFrame() {
    if (!cameraViewportEl) {
      cameraMotionRafHandle = 0;
      return;
    }

    var nowMs = Date.now();

    applyStaticRotationCss(pickRandomInt(4) * 90);

    var zoom = cameraMotionZoom;
    var viewportWidth = cameraViewportEl.clientWidth || 0;
    var viewportHeight = cameraViewportEl.clientHeight || 0;
    var maxPanX = Math.max(0, Math.floor(((viewportWidth * zoom) - viewportWidth) * 0.5));
    var maxPanY = Math.max(0, Math.floor(((viewportHeight * zoom) - viewportHeight) * 0.5));
    var usablePanX = Math.floor(maxPanX * 0.92);
    var usablePanY = Math.floor(maxPanY * 0.92);

    var scan = getCameraCornerScanPan(nowMs);
    applyCameraMotionCss(scan.x * usablePanX, scan.y * usablePanY, zoom);

    cameraMotionRafHandle = window.requestAnimationFrame(updateCameraMotionFrame);
  }

  function ensureCameraMotionLoop() {
    if (cameraMotionRafHandle) {
      return;
    }
    cameraMotionStartMs = Date.now();
    cameraMotionRafHandle = window.requestAnimationFrame(updateCameraMotionFrame);
  }

  function setNightSeed(seed) {
    var value = seed | 0;
    if (value <= 0) {
      value = 1;
    }
    state.nightSeed = value;
    state.nightRngState = value;
  }

  function nextNightRandom() {
    var value = state.nightRngState;
    value = (value * 16807) % 2147483647;
    state.nightRngState = value;
    return (value - 1) / 2147483646;
  }

  function nextNightRandomInt(maxExclusive) {
    if (maxExclusive <= 0) {
      return 0;
    }
    return Math.floor(nextNightRandom() * maxExclusive);
  }

  function pickMenuPreviewRoom() {
    menuPreviewRoomIndex = pickRandomInt(CAM_NUMBERS.length);
  }

  function pickCamMapRandom() {
    return Math.random();
  }

  function shuffleCamPlaceOrder(count) {
    var order = [];
    var index;
    var swapIndex;
    var temp;
    for (index = 0; index < count; index++) {
      order.push(index);
    }
    for (index = count - 1; index > 0; index--) {
      swapIndex = Math.floor(pickCamMapRandom() * (index + 1));
      temp = order[index];
      order[index] = order[swapIndex];
      order[swapIndex] = temp;
    }
    return order;
  }

  function getCamMapNodeRect(centerX, centerY) {
    return {
      left: centerX - CAM_MAP_NODE_HALF_W,
      top: centerY - CAM_MAP_NODE_HALF_H,
      right: centerX + CAM_MAP_NODE_HALF_W,
      bottom: centerY + CAM_MAP_NODE_HALF_H
    };
  }

  function camMapRectsOverlap(rectA, rectB) {
    return (
      rectA.left < rectB.right + CAM_MAP_NODE_GAP &&
      rectA.right > rectB.left - CAM_MAP_NODE_GAP &&
      rectA.top < rectB.bottom + CAM_MAP_NODE_GAP &&
      rectA.bottom > rectB.top - CAM_MAP_NODE_GAP
    );
  }

  function getNightDifficulty() {
    return (0.55 + state.night * 0.18) * (0.7 + state.aggression * 0.5);
  }

  function getNightPowerDrainMult() {
    if (!state || !state.playing) {
      return 1;
    }
    var nightIndex = (state.night | 0) - 1;
    if (nightIndex <= 0) {
      return 1;
    }
    return Math.pow(NIGHT_POWER_DRAIN_MULT_PER_NIGHT, nightIndex);
  }

  function getHourDisplay() {
    var display = HOUR_DISPLAY_START + state.hour;
    if (display > 12) {
      display = display - 12;
    }
    return display;
  }

  function getCamNumber(roomIndex) {
    if (roomIndex < 0 || roomIndex >= CAM_NUMBERS.length) {
      return CAM_NUMBERS[0];
    }
    return CAM_NUMBERS[roomIndex];
  }

  function getCamCleanPath(roomIndex) {
    var cleanName;
    var paths;
    var index;
    cleanName = "cam" + getCamNumber(roomIndex) + "-clean.jpg";
    if (imageManifest.safe.indexOf(cleanName) >= 0) {
      return getAssetPath(SAFE_FOLDER, cleanName);
    }
    paths = getPathsForRoom(roomIndex);
    for (index = 0; index < paths.length; index++) {
      if (!getFeedIsMonster(paths[index])) {
        return paths[index];
      }
    }
    return getAssetPath(SAFE_FOLDER, cleanName);
  }

  function getCamPrefixForRoom(roomIndex) {
    return "cam" + getCamNumber(roomIndex) + "-";
  }

  function getPathsForRoom(roomIndex) {
    var camPrefix = getCamPrefixForRoom(roomIndex);
    var paths = [];
    var index;
    var entry;
    for (index = 0; index < imageCatalog.length; index++) {
      entry = imageCatalog[index];
      if (entry.fileName.indexOf(camPrefix) === 0) {
        paths.push(getAssetPath(entry.folder, entry.fileName));
      }
    }
    return paths;
  }

  function getMonsterPathsForRoom(roomIndex) {
    var camPrefix = getCamPrefixForRoom(roomIndex);
    var paths = [];
    var index;
    var entry;
    for (index = 0; index < imageCatalog.length; index++) {
      entry = imageCatalog[index];
      if (entry.isMonster && entry.fileName.indexOf(camPrefix) === 0) {
        paths.push(getAssetPath(entry.folder, entry.fileName));
      }
    }
    return paths;
  }

  function preloadImage(path) {
    if (preloadedImages[path]) {
      return;
    }
    preloadedImages[path] = true;
    var image = new Image();
    image.src = path;
  }

  function preloadAllAssets() {
    var index;
    var entry;
    for (index = 0; index < imageCatalog.length; index++) {
      entry = imageCatalog[index];
      preloadImage(getAssetPath(entry.folder, entry.fileName));
    }
  }

  function rollNightIntensity() {
    state.aggression = 0.2 + nextNightRandom() * 0.75;
  }

  function getRandomScreamerPath() {
    var index;
    if (screamerPaths.length === 0) {
      return getAssetPath(MONSTER_FOLDER, "jumpscare.jpg");
    }
    index = Math.floor(Math.random() * screamerPaths.length);
    return screamerPaths[index];
  }

  function showFullscreenScreamer(screamerPath) {
    if (!fullscreenScreamerEl) {
      return;
    }
    fullscreenScreamerEl.style.backgroundImage = "url(\"" + screamerPath + "\")";
    fullscreenScreamerEl.classList.remove("is-hidden");
    fullscreenScreamerEl.classList.add("is-visible");
  }

  function hideFullscreenScreamer() {
    if (!fullscreenScreamerEl) {
      return;
    }
    fullscreenScreamerEl.classList.remove("is-visible");
    fullscreenScreamerEl.classList.add("is-hidden");
    fullscreenScreamerEl.style.backgroundImage = "";
  }

  function getFeedIsMonster(path) {
    var fileName = getImageFileName(path);
    if (Object.prototype.hasOwnProperty.call(IMAGE_IS_MONSTER, fileName)) {
      return IMAGE_IS_MONSTER[fileName] === true;
    }
    if (Object.prototype.hasOwnProperty.call(imageIsMonster, path)) {
      return imageIsMonster[path] === true;
    }
    return false;
  }

  function getCurrentFeedMeta() {
    return {
      path: state.currentFeedPath,
      isMonster: state.currentFeedIsMonster
    };
  }

  function layoutCamMap() {
    var index;
    var orderIndex;
    var placeOrder;
    var edgeIndex;
    var edge;
    var nodeA;
    var nodeB;
    var line;
    var button;
    var positions = [];
    var usedRects = [];
    var tries;
    var centerX;
    var centerY;
    var rect;
    var overlaps;
    var checkIndex;
    if (!camMapNodesEl || !camMapEdgesEl) {
      return;
    }
    camMapNodesEl.innerHTML = "";
    camMapEdgesEl.innerHTML = "";
    for (index = 0; index < ROOM_COUNT; index++) {
      positions.push(null);
    }
    placeOrder = shuffleCamPlaceOrder(ROOM_COUNT);
    for (orderIndex = 0; orderIndex < ROOM_COUNT; orderIndex++) {
      index = placeOrder[orderIndex];
      tries = 0;
      while (tries < CAM_MAP_PLACE_TRIES) {
        centerX = CAM_MAP_MARGIN_X + pickCamMapRandom() * CAM_MAP_SPAN_X;
        centerY = CAM_MAP_MARGIN_Y + pickCamMapRandom() * CAM_MAP_SPAN_Y;
        rect = getCamMapNodeRect(centerX, centerY);
        overlaps = false;
        for (checkIndex = 0; checkIndex < usedRects.length; checkIndex++) {
          if (camMapRectsOverlap(rect, usedRects[checkIndex])) {
            overlaps = true;
            break;
          }
        }
        if (!overlaps) {
          usedRects.push(rect);
          positions[index] = { x: centerX, y: centerY };
          break;
        }
        tries = tries + 1;
      }
      if (!positions[index]) {
        centerX = CAM_MAP_MARGIN_X + pickCamMapRandom() * CAM_MAP_SPAN_X;
        centerY = CAM_MAP_MARGIN_Y + pickCamMapRandom() * CAM_MAP_SPAN_Y;
        positions[index] = { x: centerX, y: centerY };
      }
    }
    state.camNodePositions = positions;
    for (edgeIndex = 0; edgeIndex < CAM_GRAPH_EDGES.length; edgeIndex++) {
      edge = CAM_GRAPH_EDGES[edgeIndex];
      nodeA = positions[edge[0]];
      nodeB = positions[edge[1]];
      if (!nodeA || !nodeB) {
        continue;
      }
      line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(nodeA.x));
      line.setAttribute("y1", String(nodeA.y));
      line.setAttribute("x2", String(nodeB.x));
      line.setAttribute("y2", String(nodeB.y));
      camMapEdgesEl.appendChild(line);
    }
    for (index = 0; index < ROOM_COUNT; index++) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "cam-map-node";
      if (index === state.cameraIndex) {
        button.classList.add("is-active");
      }
      button.textContent = CAM_NUMBERS[index];
      button.setAttribute("data-cam", String(index));
      button.style.left = positions[index].x + "%";
      button.style.top = positions[index].y + "%";
      camMapNodesEl.appendChild(button);
    }
  }

  function setActiveCamNode(index) {
    var nodes;
    var nodeIndex;
    if (!camMapNodesEl) {
      return;
    }
    nodes = camMapNodesEl.querySelectorAll(".cam-map-node");
    for (nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
      if (parseInt(nodes[nodeIndex].getAttribute("data-cam"), 10) === index) {
        nodes[nodeIndex].classList.add("is-active");
      } else {
        nodes[nodeIndex].classList.remove("is-active");
      }
    }
  }

  function countUsage() {
    state.usage = FIXED_POWER_USAGE;
  }

  function updateHud() {
    if (hourValueEl) {
      hourValueEl.textContent = String(getHourDisplay());
    }
    if (nightValueEl) {
      nightValueEl.textContent = String(state.night);
    }
    if (powerFillEl) {
      powerFillEl.style.width = String(Math.max(0, state.power)) + "%";
    }
    if (powerPercentEl) {
      var powerDisplay = Math.max(0, Math.floor(state.power));
      if (powerDisplay > POWER_DISPLAY_MAX) {
        powerDisplay = POWER_DISPLAY_MAX;
      }
      powerPercentEl.textContent = String(powerDisplay) + "%";
    }
    if (powerHudEl) {
      if (state.power <= 25) {
        powerHudEl.classList.add("is-low");
      } else {
        powerHudEl.classList.remove("is-low");
      }
    }
    if (correctReportsValueEl) {
      if (state.playing && !state.gameOver) {
        correctReportsValueEl.textContent = String(state.correctReports);
      } else {
        correctReportsValueEl.textContent = "0";
      }
    }
    countUsage();
  }

  function applyFeedPath(path) {
    if (!cameraFeedImg || !path) {
      return;
    }
    preloadImage(path);
    state.currentFeedPath = path;
    state.currentFeedIsMonster = getFeedIsMonster(path);
    if (state.currentFeedIsMonster) {
      state.monsterViewStartMs = Date.now();
    } else {
      state.monsterViewStartMs = 0;
    }
    setCameraFeedImageSrc(path);
    if (state.playing && !state.gameOver && !state.powerOut) {
      markPathUsedForRoom(state.cameraIndex, path);
    }
  }

  function resetUsedPathsForAllRooms() {
    var roomIndex;
    state.usedPathsByRoom = [];
    for (roomIndex = 0; roomIndex < CAM_NUMBERS.length; roomIndex++) {
      state.usedPathsByRoom[roomIndex] = [];
    }
  }

  function getRoomUsedPaths(roomIndex) {
    if (!state.usedPathsByRoom) {
      state.usedPathsByRoom = [];
    }
    if (!state.usedPathsByRoom[roomIndex]) {
      state.usedPathsByRoom[roomIndex] = [];
    }
    return state.usedPathsByRoom[roomIndex];
  }

  function isPathInRoomUsedList(roomIndex, path) {
    var usedPaths;
    var index;
    usedPaths = getRoomUsedPaths(roomIndex);
    for (index = 0; index < usedPaths.length; index++) {
      if (usedPaths[index] === path) {
        return true;
      }
    }
    return false;
  }

  function markPathUsedForRoom(roomIndex, path) {
    var usedPaths;
    var index;
    if (!path) {
      return;
    }
    if (isPathInRoomUsedList(roomIndex, path)) {
      return;
    }
    usedPaths = getRoomUsedPaths(roomIndex);
    usedPaths.push(path);
  }

  function isPathInExcludeList(path, excludeList) {
    var index;
    if (!path || !excludeList) {
      return false;
    }
    for (index = 0; index < excludeList.length; index++) {
      if (excludeList[index] === path) {
        return true;
      }
    }
    return false;
  }

  function getAssignExcludeForRoom(roomIndex, extraExclude) {
    var list = [];
    var path;
    var index;
    if (feedAssignRefreshActive && feedAssignPreviousPaths[roomIndex]) {
      list.push(feedAssignPreviousPaths[roomIndex]);
    }
    if (roomIndex === state.cameraIndex && state.currentFeedPath) {
      path = state.currentFeedPath;
      if (!isPathInExcludeList(path, list)) {
        list.push(path);
      }
    }
    if (extraExclude) {
      for (index = 0; index < extraExclude.length; index++) {
        path = extraExclude[index];
        if (path && !isPathInExcludeList(path, list)) {
          list.push(path);
        }
      }
    }
    return list;
  }

  function isPathBlockedForRoomPick(roomIndex, path, extraExclude) {
    if (!path) {
      return true;
    }
    if (isPathInRoomUsedList(roomIndex, path)) {
      return true;
    }
    if (isPathInExcludeList(path, getAssignExcludeForRoom(roomIndex, extraExclude))) {
      return true;
    }
    return false;
  }

  function pickFromPoolForRoom(roomIndex, candidatePaths, extraExclude) {
    var available;
    var index;
    var path;
    var pickIndex;
    var excludeList;
    if (!candidatePaths || candidatePaths.length === 0) {
      path = getCamCleanPath(roomIndex);
      markPathUsedForRoom(roomIndex, path);
      return path;
    }
    available = [];
    for (index = 0; index < candidatePaths.length; index++) {
      path = candidatePaths[index];
      if (!isPathBlockedForRoomPick(roomIndex, path, extraExclude)) {
        available.push(path);
      }
    }
    if (available.length === 0) {
      state.usedPathsByRoom[roomIndex] = [];
      excludeList = getAssignExcludeForRoom(roomIndex, extraExclude);
      for (index = 0; index < candidatePaths.length; index++) {
        path = candidatePaths[index];
        if (!isPathInExcludeList(path, excludeList)) {
          available.push(path);
        }
      }
    }
    if (available.length === 0) {
      excludeList = getAssignExcludeForRoom(roomIndex, extraExclude);
      for (index = 0; index < candidatePaths.length; index++) {
        path = candidatePaths[index];
        if (feedAssignRefreshActive && feedAssignPreviousPaths[roomIndex] === path) {
          continue;
        }
        if (roomIndex === state.cameraIndex && state.currentFeedPath === path) {
          continue;
        }
        available.push(path);
      }
    }
    if (available.length === 0) {
      available = candidatePaths.slice();
    }
    pickIndex = pickRandomInt(available.length);
    path = available[pickIndex];
    markPathUsedForRoom(roomIndex, path);
    return path;
  }

  function pickRandomFeedPathForRoom(roomIndex, extraExclude) {
    return pickFromPoolForRoom(roomIndex, getPathsForRoom(roomIndex), extraExclude);
  }

  function pickRandomSafeFeedPathForRoom(roomIndex, extraExclude) {
    var paths = getPathsForRoom(roomIndex);
    var safePaths = [];
    var index;
    var path;
    for (index = 0; index < paths.length; index++) {
      path = paths[index];
      if (!getFeedIsMonster(path)) {
        safePaths.push(path);
      }
    }
    if (safePaths.length > 0) {
      return pickFromPoolForRoom(roomIndex, safePaths, extraExclude);
    }
    path = getCamCleanPath(roomIndex);
    markPathUsedForRoom(roomIndex, path);
    return path;
  }

  function assignAllCameraFeedPaths() {
    var roomIndex;
    feedAssignPreviousPaths = [];
    feedAssignRefreshActive = false;
    if (state.cameraFeedPaths && state.cameraFeedPaths.length > 0) {
      feedAssignRefreshActive = true;
      for (roomIndex = 0; roomIndex < CAM_NUMBERS.length; roomIndex++) {
        feedAssignPreviousPaths[roomIndex] = state.cameraFeedPaths[roomIndex] || "";
      }
    }
    state.cameraFeedPaths = [];
    for (roomIndex = 0; roomIndex < CAM_NUMBERS.length; roomIndex++) {
      state.cameraFeedPaths[roomIndex] = pickRandomFeedPathForRoom(roomIndex);
    }
    ensureAtLeastOneMonsterOnCameraFeed();
    ensureCurrentCameraFeedSafe();
    feedAssignRefreshActive = false;
    feedAssignPreviousPaths = [];
  }

  function forceRefreshAllCameraFeeds() {
    if (!state.playing || state.gameOver || state.powerOut) {
      return;
    }
    state.camFeedsPending = false;
    assignAllCameraFeedPaths();
    playCameraSwitchFade(getStoredCameraFeedPath(state.cameraIndex));
    resetCamCycleTimer();
  }

  function ensureAtLeastOneMonsterOnCameraFeed() {
    var roomIndex;
    var candidateRooms = [];
    var targetRoom;
    var monsterPaths;
    for (roomIndex = 0; roomIndex < CAM_NUMBERS.length; roomIndex++) {
      if (roomIndex === state.cameraIndex) {
        continue;
      }
      if (getFeedIsMonster(state.cameraFeedPaths[roomIndex])) {
        return;
      }
    }
    for (roomIndex = 0; roomIndex < CAM_NUMBERS.length; roomIndex++) {
      if (roomIndex === state.cameraIndex) {
        continue;
      }
      if (getMonsterPathsForRoom(roomIndex).length > 0) {
        candidateRooms.push(roomIndex);
      }
    }
    if (candidateRooms.length === 0) {
      return;
    }
    targetRoom = candidateRooms[pickRandomInt(candidateRooms.length)];
    monsterPaths = getMonsterPathsForRoom(targetRoom);
    state.cameraFeedPaths[targetRoom] = pickFromPoolForRoom(
      targetRoom,
      monsterPaths,
      [state.cameraFeedPaths[targetRoom]]
    );
  }

  function ensureCurrentCameraFeedSafe() {
    var roomIndex = state.cameraIndex;
    var assignedPath = state.cameraFeedPaths[roomIndex];
    var extraExclude = [];
    if (assignedPath) {
      extraExclude.push(assignedPath);
    }
    if (getFeedIsMonster(assignedPath)) {
      state.cameraFeedPaths[roomIndex] = pickRandomSafeFeedPathForRoom(roomIndex, extraExclude);
      return;
    }
    if (feedAssignRefreshActive) {
      state.cameraFeedPaths[roomIndex] = pickRandomSafeFeedPathForRoom(roomIndex, extraExclude);
    }
  }

  function initAllCameraFeeds() {
    assignAllCameraFeedPaths();
  }

  function applyAllCameraFeedReload() {
    forceRefreshAllCameraFeeds();
  }

  function getStoredCameraFeedPath(roomIndex) {
    if (state.cameraFeedPaths && roomIndex >= 0 && roomIndex < state.cameraFeedPaths.length) {
      var stored = state.cameraFeedPaths[roomIndex];
      if (stored) {
        return stored;
      }
    }
    return getCamCleanPath(roomIndex);
  }

  function resetCamCycleTimer() {
    state.camCycleStartMs = Date.now();
  }

  function isCamCooldownReady() {
    if (!state.playing || state.gameOver || state.powerOut) {
      return false;
    }
    return Date.now() - state.camCycleStartMs >= ALL_CAMERAS_REFRESH_MS;
  }

  function updateCamFeedCooldown() {
    if (!state.playing || state.gameOver || state.powerOut) {
      state.camFeedsPending = false;
      return;
    }
    if (isCamCooldownReady()) {
      state.camFeedsPending = true;
    }
  }

  function playCameraSwitchFade(path) {
    if (getSynth()) {
      getSynth().playCameraSwitch();
    }
    if (!cameraFeedImg || !path) {
      return;
    }
    if (!cameraViewportEl || state.powerOut) {
      applyFeedPath(path);
      return;
    }
    if (camSwitchFadeTimer) {
      window.clearTimeout(camSwitchFadeTimer);
      camSwitchFadeTimer = 0;
    }
    preloadImage(path);
    state.currentFeedPath = path;
    state.currentFeedIsMonster = getFeedIsMonster(path);
    if (state.currentFeedIsMonster) {
      state.monsterViewStartMs = Date.now();
    } else {
      state.monsterViewStartMs = 0;
    }
    setCameraFeedImageSrc(path);
    cameraViewportEl.classList.remove("is-cam-switch");
    void cameraViewportEl.offsetWidth;
    cameraViewportEl.classList.add("is-cam-switch");
    camSwitchFadeTimer = window.setTimeout(function () {
      camSwitchFadeTimer = 0;
      if (cameraViewportEl) {
        cameraViewportEl.classList.remove("is-cam-switch");
      }
    }, CAM_CHANGE_FADE_MS);
  }

  function applyReportPowerGain() {
    state.power = state.power + POWER_REPORT_GAIN;
    if (state.power > POWER_START) {
      state.power = POWER_START;
    }
    if (state.powerOut && state.power > 8) {
      state.powerOut = false;
      cancelPowerOutScare();
      if (powerOutOverlayEl) {
        powerOutOverlayEl.classList.add("is-hidden");
      }
    }
  }

  function applyCameraFeedInstant() {
    if (!cameraFeedImg) {
      return;
    }
    if (!state.playing) {
      var idlePath = getCamCleanPath(menuPreviewRoomIndex);
      state.currentFeedPath = idlePath;
      state.currentFeedIsMonster = false;
      state.monsterViewStartMs = 0;
      setCameraFeedImageSrc(idlePath);
      return;
    }
    if (state.powerOut) {
      if (cameraNoSignalEl) {
        cameraNoSignalEl.classList.remove("is-hidden");
      }
      return;
    }
    if (cameraNoSignalEl) {
      cameraNoSignalEl.classList.add("is-hidden");
    }
    var feedPath = getStoredCameraFeedPath(state.cameraIndex);
    applyFeedPath(feedPath);
  }

  function setCamera(index) {
    var previousIndex;
    if (!state.playing) {
      return;
    }
    if (index < 0 || index >= ROOM_COUNT) {
      return;
    }
    previousIndex = state.cameraIndex;
    if (index === previousIndex) {
      return;
    }
    state.cameraIndex = index;
    if (monitorRoomNameEl) {
      monitorRoomNameEl.textContent = getRoomName(index);
    }
    setActiveCamNode(index);
    if (state.camFeedsPending) {
      state.camFeedsPending = false;
      applyAllCameraFeedReload();
      resetCamCycleTimer();
      return;
    }
    playCameraSwitchFade(getStoredCameraFeedPath(index));
  }

  function setMonitorVisual() {
    if (gameRoot) {
      if (state.powerOut) {
        gameRoot.classList.add("is-power-out");
      } else {
        gameRoot.classList.remove("is-power-out");
      }
    }
    if (reportButtonEl) {
      reportButtonEl.disabled = !state.playing || state.gameOver || state.powerOut;
    }
  }

  function showReportedEffect(showReportedText, isMonster) {
    if (cameraViewportEl) {
      cameraViewportEl.classList.add("is-reported");
    }
    if (showReportedText && cameraReportedEl) {
      cameraReportedEl.classList.remove("is-hidden");
    }
    if (getSynth()) {
      if (isMonster) {
        getSynth().playReportCorrect();
      } else {
        getSynth().playReportWrong();
      }
    }
    window.setTimeout(function () {
      if (cameraViewportEl) {
        cameraViewportEl.classList.remove("is-reported");
      }
      if (cameraReportedEl) {
        cameraReportedEl.classList.add("is-hidden");
      }
    }, REPORTED_FLASH_MS);
  }

  function onReportClick() {
    var isMonster;
    if (!state.playing || state.gameOver || state.powerOut) {
      return;
    }
    isMonster = state.currentFeedIsMonster;
    if (isMonster) {
      applyReportPowerGain();
      state.correctReports = state.correctReports + 1;
      trySaveBestCorrectReports(state.correctReports);
    }
    forceRefreshAllCameraFeeds();
    showReportedEffect(isMonster, isMonster);
    updateHud();
    setMonitorVisual();
  }

  function drainPower(deltaSeconds) {
    var mult = 1;
    var drain;
    var nowMs;
    var monsterVisibleMs;
    if (state.powerOut) {
      mult = POWER_OUT_DRAIN_MULT;
    } else if (state.power < 30) {
      mult = 0.55 + state.power / 60;
    }
    mult = mult * getNightPowerDrainMult();
    if (state.currentFeedIsMonster && state.monsterViewStartMs > 0) {
      nowMs = Date.now();
      monsterVisibleMs = nowMs - state.monsterViewStartMs;
      if (monsterVisibleMs >= MONSTER_VIEW_DRAIN_DELAY_MS) {
        mult = mult * MONSTER_VIEW_DRAIN_MULT;
      }
    }
    drain = state.usage * POWER_DRAIN_USAGE_MULT * deltaSeconds * getNightDifficulty() * mult;
    state.power = state.power - drain;
    if (state.power <= 0) {
      state.power = 0;
      triggerPowerOut();
    }
  }

  function cancelPowerOutScare() {
    if (powerOutScareTimer) {
      window.clearTimeout(powerOutScareTimer);
      powerOutScareTimer = 0;
    }
    if (powerOutScreamerTimer) {
      window.clearTimeout(powerOutScreamerTimer);
      powerOutScreamerTimer = 0;
    }
    if (gameRoot) {
      gameRoot.classList.remove("is-power-out-screamer");
    }
  }

  function getPowerOutScareDelayMs() {
    return POWER_OUT_SCARE_MIN_MS + Math.floor(
      Math.random() * (POWER_OUT_SCARE_MAX_MS - POWER_OUT_SCARE_MIN_MS + 1)
    );
  }

  function triggerPowerOutScreamer() {
    var screamerPath;
    if (!state.playing || state.gameOver || !state.powerOut) {
      return;
    }
    powerOutScareTimer = 0;
    screamerPath = getRandomScreamerPath();
    preloadImage(screamerPath);
    showFullscreenScreamer(screamerPath);
    if (gameRoot) {
      gameRoot.classList.add("is-power-out-screamer");
    }
    if (getSynth()) {
      getSynth().playJumpscare();
    }
    powerOutScreamerTimer = window.setTimeout(function () {
      powerOutScreamerTimer = 0;
      hideFullscreenScreamer();
      if (gameRoot) {
        gameRoot.classList.remove("is-power-out-screamer");
      }
      if (powerOutOverlayEl) {
        powerOutOverlayEl.classList.add("is-hidden");
      }
      loseGame(screamerPath);
    }, POWER_OUT_SCREAMER_FLASH_MS);
  }

  function schedulePowerOutScare() {
    cancelPowerOutScare();
    powerOutScareTimer = window.setTimeout(triggerPowerOutScreamer, getPowerOutScareDelayMs());
  }

  function triggerPowerOut() {
    if (state.powerOut) {
      return;
    }
    state.powerOut = true;
    if (powerOutOverlayEl) {
      powerOutOverlayEl.classList.remove("is-hidden");
    }
    setMonitorVisual();
    updateHud();
    schedulePowerOutScare();
    if (getSynth()) {
      getSynth().playPowerOutHum();
    }
  }

  function advanceHour() {
    state.hour = state.hour + 1;
    if (state.hour >= HOUR_WIN) {
      winNight();
    }
    updateHud();
  }

  function winNight() {
    state.playing = false;
    state.won = true;
    stopTimers();
    if (state.night >= bestNight) {
      bestNight = state.night;
      saveBestNight(bestNight);
      updateBestNightLine();
    }
    if (winOverlayEl) {
      winOverlayEl.classList.remove("is-hidden");
    }
    if (getSynth()) {
      getSynth().playWin();
    }
  }

  function loseGame(screamerPath) {
    var facePath;
    if (state.gameOver) {
      return;
    }
    cancelPowerOutScare();
    hideFullscreenScreamer();
    state.gameOver = true;
    state.playing = false;
    stopTimers();
    facePath = screamerPath || getRandomScreamerPath();
    preloadImage(facePath);
    if (jumpscareFaceEl) {
      jumpscareFaceEl.style.backgroundImage = "url(\"" + facePath + "\")";
    }
    if (gameRoot) {
      gameRoot.classList.add("is-jumpscare");
    }
    if (gameOverOverlayEl) {
      gameOverOverlayEl.classList.remove("is-hidden");
    }
    if (getSynth()) {
      getSynth().playJumpscare();
    }
  }

  function stopTimers() {
    if (tickTimer) {
      window.clearInterval(tickTimer);
      tickTimer = 0;
    }
    if (camSwitchFadeTimer) {
      window.clearTimeout(camSwitchFadeTimer);
      camSwitchFadeTimer = 0;
    }
    if (cameraViewportEl) {
      cameraViewportEl.classList.remove("is-cam-switch");
    }
    cancelPowerOutScare();
  }

  function gameTick() {
    if (!state.playing || state.gameOver) {
      return;
    }
    var deltaSeconds = TICK_MS / 1000;
    state.hourAccumulator = state.hourAccumulator + deltaSeconds;
    if (state.hourAccumulator >= HOUR_REAL_SECONDS) {
      state.hourAccumulator = 0;
      advanceHour();
    }
    drainPower(deltaSeconds);
    updateCamFeedCooldown();
    updateHud();
  }

  function startNight(nightNumber, keepCorrectReports) {
    var savedCorrectReports = 0;
    if (keepCorrectReports && state) {
      savedCorrectReports = state.correctReports;
    }
    stopTimers();
    state = createInitialState();
    state.correctReports = savedCorrectReports;
    state.night = nightNumber;
    state.playing = true;
    setNightSeed(buildNightSeed(nightNumber));
    state.cameraIndex = pickRandomInt(ROOM_COUNT);
    rollNightIntensity();
    resetUsedPathsForAllRooms();
    initAllCameraFeeds();
    layoutCamMap();
    resetCamCycleTimer();
    if (gameRoot) {
      gameRoot.classList.add("is-playing");
      gameRoot.classList.remove("is-jumpscare");
      gameRoot.classList.remove("is-power-out");
    }
    if (winOverlayEl) {
      winOverlayEl.classList.add("is-hidden");
    }
    if (gameOverOverlayEl) {
      gameOverOverlayEl.classList.add("is-hidden");
    }
    if (powerOutOverlayEl) {
      powerOutOverlayEl.classList.add("is-hidden");
    }
    if (monitorRoomNameEl) {
      monitorRoomNameEl.textContent = getRoomName(state.cameraIndex);
    }
    setActiveCamNode(state.cameraIndex);
    setMonitorVisual();
    updateHud();
    tickTimer = window.setInterval(gameTick, TICK_MS);
    state.camFeedsPending = false;
    applyFeedPath(getStoredCameraFeedPath(state.cameraIndex));
  }

  function onCamMapClick(event) {
    var target = event.target;
    var cam;
    if (!target || !target.getAttribute) {
      return;
    }
    cam = target.getAttribute("data-cam");
    if (cam == null) {
      return;
    }
    setCamera(parseInt(cam, 10));
  }

  function bindUi() {
    if (camMapNodesEl) {
      camMapNodesEl.addEventListener("click", onCamMapClick);
    }
    if (reportButtonEl) {
      reportButtonEl.addEventListener("click", onReportClick);
    }
    var startButton = document.getElementById("startButton");
    if (startButton) {
      startButton.addEventListener("click", function () {
        startNight(1, false);
      });
    }
    var nextNightButton = document.getElementById("nextNightButton");
    if (nextNightButton) {
      nextNightButton.addEventListener("click", function () {
        var next = state.night + 1;
        if (next > NIGHT_MAX) {
          showStartMenu();
          return;
        }
        startNight(next, true);
      });
    }
    var winMenuButton = document.getElementById("winMenuButton");
    if (winMenuButton) {
      winMenuButton.addEventListener("click", function () {
        showStartMenu();
      });
    }
    var retryButton = document.getElementById("retryButton");
    if (retryButton) {
      retryButton.addEventListener("click", function () {
        startNight(state.night, false);
      });
    }
  }

  function showStartMenu() {
    stopTimers();
    state = createInitialState();
    if (gameRoot) {
      gameRoot.classList.remove("is-playing");
      gameRoot.classList.remove("is-jumpscare");
      gameRoot.classList.remove("is-power-out");
      gameRoot.classList.remove("is-power-out-screamer");
    }
    hideFullscreenScreamer();
    pickMenuPreviewRoom();
    if (camMapNodesEl) {
      camMapNodesEl.innerHTML = "";
    }
    if (camMapEdgesEl) {
      camMapEdgesEl.innerHTML = "";
    }
    if (startOverlayEl) {
      startOverlayEl.style.display = "";
    }
    if (winOverlayEl) {
      winOverlayEl.classList.add("is-hidden");
    }
    if (gameOverOverlayEl) {
      gameOverOverlayEl.classList.add("is-hidden");
    }
    var startButton = document.getElementById("startButton");
    if (startButton) {
      updateStartButtonLabel(1);
    }
    updateBestNightLine();
    updateBestCorrectReportsLine();
    applyGameLocale();
    applyCameraFeedInstant();
  }

  function init() {
    gameRoot = document.getElementById("gameRoot");
    cameraFeedImg = document.getElementById("cameraFeedImg");
    cameraViewportEl = document.getElementById("cameraViewport");
    cameraNoSignalEl = document.getElementById("cameraNoSignal");
    cameraReportedEl = document.getElementById("cameraReported");
    reportButtonEl = document.getElementById("reportButton");
    camMapNodesEl = document.getElementById("camMapNodes");
    camMapEdgesEl = document.getElementById("camMapEdges");
    hourValueEl = document.getElementById("hourValue");
    nightValueEl = document.getElementById("nightValue");
    powerFillEl = document.getElementById("powerFill");
    powerPercentEl = document.getElementById("powerPercent");
    powerHudEl = document.getElementById("powerHud");
    monitorRoomNameEl = document.getElementById("monitorRoomName");
    monitorBlockEl = document.getElementById("monitorBlock");
    startOverlayEl = document.getElementById("startOverlay");
    winOverlayEl = document.getElementById("winOverlay");
    gameOverOverlayEl = document.getElementById("gameOverOverlay");
    powerOutOverlayEl = document.getElementById("powerOutOverlay");
    fullscreenScreamerEl = document.getElementById("fullscreenScreamer");
    jumpscareFaceEl = document.getElementById("jumpscareFace");
    bestNightLineEl = document.getElementById("bestNightLine");
    bestCorrectReportsLineEl = document.getElementById("bestCorrectReportsLine");
    correctReportsValueEl = document.getElementById("correctReportsValue");

    window.addEventListener("web-locale-applied", onGameLocaleApplied);

    loadImageManifest(function () {
      bestNight = loadBestNight();
      bestCorrectReports = loadBestCorrectReports();
      preloadAllAssets();
      state = createInitialState();
      pickMenuPreviewRoom();
      bindUi();
      setMonitorVisual();
      updateHud();
      updateBestNightLine();
      updateBestCorrectReportsLine();
      applyGameLocale();
      ensureCameraMotionLoop();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
