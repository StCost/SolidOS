(function () {
  var HIGH_SCORE_STORAGE_KEY = "cm-orbit-hop-high-score";
  var GAME_TITLE = "Orbit Hop";
  var LOCALE_KEY_HINT = "web.game.orbit-hop.hint";
  var LOCALE_KEY_GAME_OVER = "web.game.game-over";
  var LOCALE_KEY_BEST_LABEL = "web.game.best-label";
  var DISTANCE_SUFFIX = "km";

  var PHASE_START = "start";
  var PHASE_PLAYING = "playing";
  var PHASE_GAME_OVER = "gameover";

  var SATELLITE_STATE_ORBITING = "orbiting";
  var SATELLITE_STATE_FLYING = "flying";
  var SATELLITE_STATE_CAPTURING = "capturing";

  var TWO_PI = Math.PI * 2;

  var SATELLITE_RADIUS = 5;
  var ORBIT_ANGULAR_SPEED = 2.1;
  var LAUNCH_SPEED_MULTIPLIER = 1.55;
  var METERS_PER_WORLD_UNIT = 2.4;
  var PLANET_Y_SPACING_MIN = 180;
  var PLANET_Y_SPACING_MAX = 320;
  var PLANET_X_MARGIN = 72;
  var PLANET_RADIUS_MIN = 16;
  var PLANET_RADIUS_MAX = 42;
  var ORBIT_GAP_MIN = 20;
  var ORBIT_GAP_MAX = 36;
  var FIRST_PLANET_SCREEN_RATIO = 0.3;
  var PLANET_SPAWN_DURATION = 0.55;
  var NEXT_PLANET_HINT_PULSE_SPEED = 3.1;
  var CAMERA_SATELLITE_Y_RATIO = 0.38;
  var CAMERA_PREVIEW_Y_RATIO = 0.28;
  var CAMERA_SMOOTH = 6.5;
  var INITIAL_ORBIT_ANGLE = 0;
  var FLY_OFFSCREEN_MARGIN = 80;
  var STAR_COUNT = 140;
  var TRAIL_MAX = 28;
  var LAUNCH_COOLDOWN = 0.12;
  var LAUNCH_GUIDE_DASH = 4;
  var LAUNCH_GUIDE_GAP = 6;
  var TRAJECTORY_STEP_COUNT = 14;
  var TRAJECTORY_STEP_COUNT_HOLD = 32;
  var TRAJECTORY_PREDICT_COUNT = 72;
  var TRAJECTORY_STEP_TIME = 0.045;
  var TRAJECTORY_COLOR_GREY = "rgba(150,158,172,0.42)";
  var TRAJECTORY_COLOR_BLUE = "rgba(100,190,255,0.52)";
  var TRAJECTORY_COLOR_RED = "rgba(255,90,72,0.58)";
  var PLANET_DRIFT_AMPLITUDE_MIN = 6;
  var PLANET_DRIFT_AMPLITUDE_MAX = 16;
  var PLANET_DRIFT_SPEED_MIN = 0.22;
  var PLANET_DRIFT_SPEED_MAX = 0.48;
  var PLANET_GRAVITY_STRENGTH = 580;
  var PLANET_GRAVITY_LINEAR = 240;
  var PLANET_GRAVITY_RANGE_MIN = 420;
  var PLANET_GRAVITY_ORBIT_RANGE_FACTOR = 5.2;
  var PLANET_GRAVITY_OUTER_RANGE_FACTOR = 2.15;
  var PLANET_GRAVITY_OUTER_PULL_FACTOR = 0.55;
  var ATTACH_RIPPLE_COUNT = 3;
  var ATTACH_SPARK_COUNT = 10;
  var ATTACH_EFFECT_LIFE = 0.55;
  var ORBIT_CAPTURE_TOLERANCE = 14;
  var CAPTURE_DURATION = 0.42;
  var CAPTURE_PULL_STRENGTH = 11;
  var METEOROID_RADIUS_MIN = 8;
  var METEOROID_RADIUS_MAX = 15;
  var METEOROIDS_PER_SECTOR_MIN = 2;
  var METEOROIDS_PER_SECTOR_MAX = 5;
  var PLANET_SPIN_SPEED_MIN = 0.45;
  var PLANET_SPIN_SPEED_MAX = 1.15;
  var PLANET_RING_SPIN_SPEED_MIN = 0.3;
  var PLANET_RING_SPIN_SPEED_MAX = 0.75;
  var PLANET_RING_CHANCE = 0.5;
  var PLANET_RING_RADIUS_FACTOR = 1.58;
  var PLANET_RING_INNER_FACTOR = 0.9;

  var PLANET_PALETTES = [
    { core: "#3d7ec8", rim: "#8ec8ff", glow: "#1a4080", ring: "rgba(120,200,255,0.22)" },
    { core: "#9a4ec8", rim: "#d8a0ff", glow: "#4a2080", ring: "rgba(200,140,255,0.2)" },
    { core: "#c85a48", rim: "#ffb090", glow: "#802818", ring: "rgba(255,160,120,0.2)" },
    { core: "#48a878", rim: "#90ffd0", glow: "#186040", ring: "rgba(120,255,180,0.18)" },
    { core: "#c8a038", rim: "#ffe890", glow: "#806018", ring: "rgba(255,220,120,0.2)" },
    { core: "#5888c0", rim: "#a0d0ff", glow: "#284870", ring: "rgba(140,190,255,0.2)" }
  ];

  var canvas = document.getElementById("gameCanvas");
  var context = canvas.getContext("2d");
  var gameRoot = document.getElementById("gameRoot");
  var hudPlaying = document.getElementById("hudPlaying");
  var hudDistance = document.getElementById("hudDistance");
  var hudBest = document.getElementById("hudBest");
  var gameScreen = document.getElementById("gameScreen");
  var screenTitle = document.getElementById("screenTitle");
  var controlHint = document.getElementById("controlHint");
  var screenScore = document.getElementById("screenScore");

  var viewWidth = 0;
  var viewHeight = 0;
  var devicePixelRatioScale = 1;

  var phase = PHASE_START;
  var planets = [];
  var meteoroids = [];
  var stars = [];
  var trail = [];
  var trajectoryPoints = [];
  var attachEffects = [];
  var gameTimeSeconds = 0;
  var nextPlanetIndex = 0;
  var nextMeteoroidSectorIndex = 0;
  var highestGeneratedY = 0;
  var startWorldY = 0;
  var peakWorldY = 0;
  var cameraY = 0;
  var cameraTargetY = 0;
  var distanceMeters = 0;
  var highScoreMeters = 0;
  var isNewRecord = false;
  var launchCooldownTimer = 0;
  var detachedFromPlanetIndex = -1;
  var pointerDownActive = false;
  var skipNextLaunchFromRelease = false;

  var satellite = {
    worldX: 0,
    worldY: 0,
    velocityX: 0,
    velocityY: 0,
    state: SATELLITE_STATE_ORBITING,
    planetIndex: 0,
    orbitAngle: 0,
    orbitDirection: 1,
    capturePlanetIndex: -1,
    captureStartWorldX: 0,
    captureStartWorldY: 0,
    captureStartAngle: 0,
    captureOrbitDirection: 1,
    captureProgress: 0
  };

  function getSynth() {
    return window.WebExtrasGameSynthAudio;
  }

  function getLocale(key, fallback) {
    if (window.WebLocale && window.WebLocale.get) {
      return window.WebLocale.get(key, fallback);
    }
    return fallback;
  }

  function formatDistance(meters) {
    if (meters >= 1000) {
      return Math.floor(meters / 100) / 10 + " " + DISTANCE_SUFFIX;
    }
    return Math.floor(meters) + " " + DISTANCE_SUFFIX;
  }

  function loadHighScore() {
    var stored;
    try {
      stored = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
      if (stored != null && stored !== "") {
        highScoreMeters = parseInt(stored, 10) || 0;
      }
    } catch (error) {
      highScoreMeters = 0;
    }
    updateBestHud();
  }

  function saveHighScore() {
    try {
      window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(highScoreMeters));
    } catch (error) {
    }
  }

  function updateBestHud() {
    var bestLabel = getLocale(LOCALE_KEY_BEST_LABEL, "best");
    hudBest.textContent = bestLabel + " " + formatDistance(highScoreMeters);
    if (isNewRecord && phase === PHASE_PLAYING) {
      hudBest.classList.add("is-record");
    } else {
      hudBest.classList.remove("is-record");
    }
  }

  function updateDistanceHud() {
    hudDistance.textContent = formatDistance(distanceMeters);
  }

  function seededRandom(seed) {
    var value = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function getPlanetPalette(index) {
    return PLANET_PALETTES[index % PLANET_PALETTES.length];
  }

  function clampWorldX(worldX) {
    var playableWidth = Math.max(viewWidth, 320);
    var minX = PLANET_X_MARGIN;
    var maxX = playableWidth - PLANET_X_MARGIN;
    if (worldX < minX) {
      return minX;
    }
    if (worldX > maxX) {
      return maxX;
    }
    return worldX;
  }

  function getRandomPlanetWorldX(randomValue) {
    var playableWidth = Math.max(viewWidth, 320);
    var minX = PLANET_X_MARGIN;
    var maxX = playableWidth - PLANET_X_MARGIN;
    return minX + randomValue * (maxX - minX);
  }

  function createPlanet(worldY, index) {
    var randomA = seededRandom(index * 17.3 + 2.1);
    var randomB = seededRandom(index * 31.7 + 8.4);
    var randomC = seededRandom(index * 53.1 + 1.9);
    var worldX = clampWorldX(getRandomPlanetWorldX(randomA));
    var radius = PLANET_RADIUS_MIN + randomB * (PLANET_RADIUS_MAX - PLANET_RADIUS_MIN);
    var orbitRadius = radius + ORBIT_GAP_MIN + randomC * (ORBIT_GAP_MAX - ORBIT_GAP_MIN);
    return {
      anchorWorldX: worldX,
      worldY: worldY,
      radius: radius,
      orbitRadius: orbitRadius,
      palette: getPlanetPalette(index),
      spinSpeed: PLANET_SPIN_SPEED_MIN + seededRandom(index * 11.3) * (PLANET_SPIN_SPEED_MAX - PLANET_SPIN_SPEED_MIN),
      spinDirection: seededRandom(index * 13.9) > 0.5 ? 1 : -1,
      spinAngle: seededRandom(index * 7.7) * TWO_PI,
      hasRing: seededRandom(index * 19.1) > PLANET_RING_CHANCE,
      ringAngle: seededRandom(index * 21.7) * TWO_PI,
      ringSpinSpeed: (PLANET_RING_SPIN_SPEED_MIN + seededRandom(index * 27.3) * (PLANET_RING_SPIN_SPEED_MAX - PLANET_RING_SPIN_SPEED_MIN)) * (seededRandom(index * 31.1) > 0.5 ? 1 : -1),
      ringTilt: 0.32 + seededRandom(index * 23.5) * 0.42,
      driftAmplitude: PLANET_DRIFT_AMPLITUDE_MIN + seededRandom(index * 37.1) * (PLANET_DRIFT_AMPLITUDE_MAX - PLANET_DRIFT_AMPLITUDE_MIN),
      driftSpeed: PLANET_DRIFT_SPEED_MIN + seededRandom(index * 43.7) * (PLANET_DRIFT_SPEED_MAX - PLANET_DRIFT_SPEED_MIN),
      driftPhase: seededRandom(index * 51.3) * TWO_PI,
      terrainSpots: buildPlanetTerrainSpots(index),
      spawnProgress: 0
    };
  }

  function buildPlanetTerrainSpots(index) {
    var spotCount;
    var spots;
    var spotIndex;
    spotCount = 6 + Math.floor(seededRandom(index * 29.3) * 9);
    spots = [];
    for (spotIndex = 0; spotIndex < spotCount; spotIndex += 1) {
      spots.push({
        angle: seededRandom(index * 3.7 + spotIndex * 11.1) * TWO_PI,
        distance: seededRandom(index * 5.9 + spotIndex * 7.3) * 0.72,
        size: 0.1 + seededRandom(index * 13.1 + spotIndex * 2.7) * 0.22,
        shade: seededRandom(index * 17.9 + spotIndex * 4.1)
      });
    }
    return spots;
  }

  function getPlanetWorldX(planet) {
    return planet.anchorWorldX + Math.sin(gameTimeSeconds * planet.driftSpeed + planet.driftPhase) * planet.driftAmplitude;
  }

  function getPlanetSpawnScale(planet) {
    if (!planet || planet.spawnProgress >= 1) {
      return 1;
    }
    if (planet.spawnProgress <= 0) {
      return 0;
    }
    return getCaptureEase(planet.spawnProgress);
  }

  function getNextPlanetSpacing(index) {
    var random = seededRandom(index * 41.2 + 3.7);
    return PLANET_Y_SPACING_MIN + random * (PLANET_Y_SPACING_MAX - PLANET_Y_SPACING_MIN);
  }

  function getFirstPlanetWorldY() {
    return Math.floor(Math.max(viewHeight, 400) * FIRST_PLANET_SCREEN_RATIO);
  }

  function createMeteoroid(sectorMinY, sectorMaxY, seed) {
    var playableWidth = Math.max(viewWidth, 320);
    var sectorHeight = sectorMaxY - sectorMinY;
    if (sectorHeight < 24) {
      sectorHeight = 24;
    }
    return {
      worldX: PLANET_X_MARGIN + seededRandom(seed * 2.3) * (playableWidth - PLANET_X_MARGIN * 2),
      worldY: sectorMinY + seededRandom(seed * 5.1) * sectorHeight,
      radius: METEOROID_RADIUS_MIN + seededRandom(seed * 8.7) * (METEOROID_RADIUS_MAX - METEOROID_RADIUS_MIN),
      rotation: seededRandom(seed * 11.9) * TWO_PI,
      spin: (seededRandom(seed * 13.3) - 0.5) * 2.8,
      jaggedSeed: seed * 19.7
    };
  }

  function spawnMeteoroidsInSector(sectorMinY, sectorMaxY, sectorIndex) {
    var countRange;
    var count;
    var index;
    var meteoroid;
    countRange = METEOROIDS_PER_SECTOR_MAX - METEOROIDS_PER_SECTOR_MIN;
    count = METEOROIDS_PER_SECTOR_MIN + Math.floor(seededRandom(sectorIndex * 67.1 + 4.2) * (countRange + 1));
    for (index = 0; index < count; index += 1) {
      meteoroid = createMeteoroid(sectorMinY, sectorMaxY, sectorIndex * 17 + index + 1);
      meteoroids.push(meteoroid);
    }
  }

  function spawnFirstPlanet() {
    var planet;
    highestGeneratedY = getFirstPlanetWorldY();
    planet = createPlanet(highestGeneratedY, 0);
    planet.spawnProgress = 1;
    planets.push(planet);
    nextPlanetIndex = 1;
  }

  function getNextPlanetSlotPreview() {
    var previousPlanet;
    var previousWorldY;
    var worldY;
    if (planets.length === 0) {
      return null;
    }
    if (getPlanet(planets.length)) {
      return null;
    }
    previousPlanet = planets[planets.length - 1];
    previousWorldY = previousPlanet.worldY;
    worldY = previousWorldY + getNextPlanetSpacing(nextPlanetIndex);
    return createPlanet(worldY, nextPlanetIndex);
  }

  function spawnNextPlanet() {
    var previousPlanet;
    var previousWorldY;
    var planet;
    var attachedPlanet;
    var previewPlanet;
    if (planets.length === 0) {
      return;
    }
    if (planets.length >= 2) {
      attachedPlanet = getPlanet(satellite.planetIndex);
      if (attachedPlanet && planets[planets.length - 1].worldY > attachedPlanet.worldY) {
        return;
      }
    }
    previewPlanet = getNextPlanetSlotPreview();
    if (previewPlanet) {
      highestGeneratedY = previewPlanet.worldY;
      previousPlanet = planets[planets.length - 1];
      previousWorldY = previousPlanet.worldY;
      spawnMeteoroidsInSector(previousWorldY + 40, highestGeneratedY - 24, nextMeteoroidSectorIndex);
      nextMeteoroidSectorIndex += 1;
      planet = previewPlanet;
      planet.spawnProgress = 0;
      planets.push(planet);
      nextPlanetIndex += 1;
      return;
    }
    previousPlanet = planets[planets.length - 1];
    previousWorldY = previousPlanet.worldY;
    highestGeneratedY = previousWorldY + getNextPlanetSpacing(nextPlanetIndex);
    spawnMeteoroidsInSector(previousWorldY + 40, highestGeneratedY - 24, nextMeteoroidSectorIndex);
    nextMeteoroidSectorIndex += 1;
    planet = createPlanet(highestGeneratedY, nextPlanetIndex);
    planet.spawnProgress = 0;
    planets.push(planet);
    nextPlanetIndex += 1;
  }

  function onPlanetAttached(planetIndex) {
    detachedFromPlanetIndex = -1;
    if (planetIndex === planets.length - 1) {
      spawnNextPlanet();
    }
  }

  function updatePlanetSpawns(deltaTime) {
    var index;
    var planet;
    for (index = 0; index < planets.length; index += 1) {
      planet = planets[index];
      if (planet.spawnProgress >= 1) {
        continue;
      }
      planet.spawnProgress += deltaTime / PLANET_SPAWN_DURATION;
      if (planet.spawnProgress > 1) {
        planet.spawnProgress = 1;
      }
    }
  }

  function updatePlanetSpins(deltaTime) {
    var index;
    var planet;
    for (index = 0; index < planets.length; index += 1) {
      planet = planets[index];
      planet.spinAngle += planet.spinSpeed * planet.spinDirection * deltaTime;
      if (planet.hasRing) {
        planet.ringAngle += planet.ringSpinSpeed * deltaTime;
      }
    }
  }

  function buildStars() {
    var index;
    var star;
    stars.length = 0;
    for (index = 0; index < STAR_COUNT; index += 1) {
      star = {
        offsetX: seededRandom(index * 3.1) * 2000 - 1000,
        offsetY: seededRandom(index * 5.7) * 6000,
        size: 0.6 + seededRandom(index * 9.3) * 2.2,
        brightness: 0.25 + seededRandom(index * 13.1) * 0.75,
        parallax: 0.15 + seededRandom(index * 17.9) * 0.65,
        twinkleSpeed: 0.5 + seededRandom(index * 21.3) * 2.5,
        twinklePhase: seededRandom(index * 29.7) * TWO_PI
      };
      stars.push(star);
    }
  }

  function worldToScreen(worldX, worldY) {
    var screenX = worldX;
    var screenY = viewHeight - (worldY - cameraY);
    return { x: screenX, y: screenY };
  }

  function getPlanet(index) {
    if (index < 0 || index >= planets.length) {
      return null;
    }
    return planets[index];
  }

  function setSatelliteOrbitPosition(planet) {
    var planetWorldX = getPlanetWorldX(planet);
    satellite.worldX = planetWorldX + Math.cos(satellite.orbitAngle) * planet.orbitRadius;
    satellite.worldY = planet.worldY + Math.sin(satellite.orbitAngle) * planet.orbitRadius;
  }

  function getOrbitTangent(orbitAngle, orbitDirection) {
    return {
      x: -Math.sin(orbitAngle) * orbitDirection,
      y: Math.cos(orbitAngle) * orbitDirection
    };
  }

  function getScreenHeadingFromWorldDirection(worldDirectionX, worldDirectionY) {
    return Math.atan2(-worldDirectionY, worldDirectionX);
  }

  function getSatelliteHeadingRadians() {
    var tangent;
    if (satellite.state === SATELLITE_STATE_ORBITING) {
      tangent = getOrbitTangent(satellite.orbitAngle, satellite.orbitDirection);
      return getScreenHeadingFromWorldDirection(tangent.x, tangent.y);
    }
    return getScreenHeadingFromWorldDirection(satellite.velocityX, satellite.velocityY);
  }

  function getCaptureEase(progress) {
    var inverted = 1 - progress;
    return 1 - inverted * inverted * inverted;
  }

  function getDistanceToPlanet(planet) {
    var deltaX = satellite.worldX - getPlanetWorldX(planet);
    var deltaY = satellite.worldY - planet.worldY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  function getDistanceToPlanetAt(worldX, worldY, planet) {
    var deltaX = worldX - getPlanetWorldX(planet);
    var deltaY = worldY - planet.worldY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  function getDistanceBetween(worldAX, worldAY, worldBX, worldBY) {
    var deltaX = worldBX - worldAX;
    var deltaY = worldBY - worldAY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  function getPlanetGravityAcceleration(worldX, worldY, ignorePlanetIndex) {
    var index;
    var planet;
    var deltaX;
    var deltaY;
    var distance;
    var distanceSquared;
    var gravityRange;
    var strength;
    var accelerationX = 0;
    var accelerationY = 0;
    for (index = 0; index < planets.length; index += 1) {
      if (index === ignorePlanetIndex && ignorePlanetIndex >= 0) {
        continue;
      }
      planet = planets[index];
      deltaX = getPlanetWorldX(planet) - worldX;
      deltaY = planet.worldY - worldY;
      distanceSquared = deltaX * deltaX + deltaY * deltaY;
      if (distanceSquared < planet.radius * planet.radius) {
        continue;
      }
      gravityRange = Math.max(PLANET_GRAVITY_RANGE_MIN, planet.orbitRadius * PLANET_GRAVITY_ORBIT_RANGE_FACTOR);
      distance = Math.sqrt(distanceSquared);
      if (distanceSquared <= gravityRange * gravityRange) {
        strength = PLANET_GRAVITY_STRENGTH * planet.radius / distanceSquared;
        strength += PLANET_GRAVITY_LINEAR * planet.radius / distance;
        accelerationX += (deltaX / distance) * strength;
        accelerationY += (deltaY / distance) * strength;
      } else if (distanceSquared <= gravityRange * gravityRange * PLANET_GRAVITY_OUTER_RANGE_FACTOR * PLANET_GRAVITY_OUTER_RANGE_FACTOR) {
        strength = PLANET_GRAVITY_STRENGTH * planet.radius * PLANET_GRAVITY_OUTER_PULL_FACTOR / distanceSquared;
        strength += PLANET_GRAVITY_LINEAR * planet.radius * PLANET_GRAVITY_OUTER_PULL_FACTOR / distance;
        accelerationX += (deltaX / distance) * strength;
        accelerationY += (deltaY / distance) * strength;
      }
    }
    return {
      x: accelerationX,
      y: accelerationY
    };
  }

  function applyPlanetGravityToVelocity(worldX, worldY, velocityX, velocityY, deltaTime, ignorePlanetIndex) {
    var acceleration;
    acceleration = getPlanetGravityAcceleration(worldX, worldY, ignorePlanetIndex);
    velocityX += acceleration.x * deltaTime;
    velocityY += acceleration.y * deltaTime;
    return {
      x: velocityX,
      y: velocityY
    };
  }

  function getLaunchTangent() {
    return getOrbitTangent(satellite.orbitAngle, satellite.orbitDirection);
  }

  function getOrbitDirectionFromVelocity(velocityX, velocityY, orbitAngle) {
    var tangent = getOrbitTangent(orbitAngle, 1);
    var dot = velocityX * tangent.x + velocityY * tangent.y;
    if (dot >= 0) {
      return 1;
    }
    return -1;
  }

  function beginCapture(planetIndex) {
    var planet;
    var deltaX;
    var deltaY;
    planet = getPlanet(planetIndex);
    if (!planet) {
      return;
    }
    deltaX = satellite.worldX - getPlanetWorldX(planet);
    deltaY = satellite.worldY - planet.worldY;
    satellite.capturePlanetIndex = planetIndex;
    satellite.captureStartWorldX = satellite.worldX;
    satellite.captureStartWorldY = satellite.worldY;
    satellite.captureStartAngle = Math.atan2(deltaY, deltaX);
    satellite.captureOrbitDirection = getOrbitDirectionFromVelocity(
      satellite.velocityX,
      satellite.velocityY,
      satellite.captureStartAngle
    );
    satellite.captureProgress = 0;
    satellite.state = SATELLITE_STATE_CAPTURING;
    spawnAttachContactEffect(planet);
  }

  function spawnAttachContactEffect(planet) {
    var attachWorldX;
    var attachWorldY;
    attachWorldX = getPlanetWorldX(planet) + Math.cos(satellite.captureStartAngle) * planet.orbitRadius;
    attachWorldY = planet.worldY + Math.sin(satellite.captureStartAngle) * planet.orbitRadius;
    spawnAttachRipple(attachWorldX, attachWorldY, planet.orbitRadius * 0.45, planet.palette.rim);
  }

  function spawnAttachRipple(worldX, worldY, startRadius, colorHex) {
    var rippleIndex;
    for (rippleIndex = 0; rippleIndex < ATTACH_RIPPLE_COUNT; rippleIndex += 1) {
      attachEffects.push({
        kind: "ripple",
        worldX: worldX,
        worldY: worldY,
        radius: startRadius + rippleIndex * 4,
        maxRadius: startRadius + 38 + rippleIndex * 16,
        life: 1,
        maxLife: ATTACH_EFFECT_LIFE + rippleIndex * 0.08,
        colorHex: colorHex,
        delay: rippleIndex * 0.06
      });
    }
  }

  function spawnAttachBurstEffect(planet) {
    var attachWorldX;
    var attachWorldY;
    var sparkIndex;
    var angle;
    var speed;
    attachWorldX = getPlanetWorldX(planet) + Math.cos(satellite.orbitAngle) * planet.orbitRadius;
    attachWorldY = planet.worldY + Math.sin(satellite.orbitAngle) * planet.orbitRadius;
    spawnAttachRipple(attachWorldX, attachWorldY, planet.radius * 0.7, planet.palette.rim);
    spawnAttachRipple(attachWorldX, attachWorldY, planet.orbitRadius * 0.55, planet.palette.core);
    for (sparkIndex = 0; sparkIndex < ATTACH_SPARK_COUNT; sparkIndex += 1) {
      angle = (sparkIndex / ATTACH_SPARK_COUNT) * TWO_PI + seededRandom(sparkIndex * 3.7 + planet.worldY) * 0.5;
      speed = 70 + seededRandom(sparkIndex * 5.1 + attachWorldX) * 110;
      attachEffects.push({
        kind: "spark",
        worldX: attachWorldX,
        worldY: attachWorldY,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.35 + seededRandom(sparkIndex * 2.3) * 0.25,
        colorHex: planet.palette.rim
      });
    }
    attachEffects.push({
      kind: "flash",
      worldX: attachWorldX,
      worldY: attachWorldY,
      radius: planet.orbitRadius * 0.9,
      life: 1,
      maxLife: 0.22,
      colorHex: planet.palette.rim
    });
  }

  function updateAttachEffects(deltaTime) {
    var index;
    var effect;
    for (index = attachEffects.length - 1; index >= 0; index -= 1) {
      effect = attachEffects[index];
      if (effect.delay > 0) {
        effect.delay -= deltaTime;
        continue;
      }
      effect.life -= deltaTime / effect.maxLife;
      if (effect.kind === "spark") {
        effect.worldX += effect.velocityX * deltaTime;
        effect.worldY += effect.velocityY * deltaTime;
        effect.velocityX *= 1 - deltaTime * 2.8;
        effect.velocityY *= 1 - deltaTime * 2.8;
      }
      if (effect.kind === "ripple") {
        effect.radius += (effect.maxRadius - effect.radius) * deltaTime * 2.4;
      }
      if (effect.life <= 0) {
        attachEffects.splice(index, 1);
      }
    }
  }

  function drawAttachEffects() {
    var index;
    var effect;
    var screen;
    var alpha;
    var progress;
    for (index = 0; index < attachEffects.length; index += 1) {
      effect = attachEffects[index];
      if (effect.delay > 0) {
        continue;
      }
      screen = worldToScreen(effect.worldX, effect.worldY);
      progress = 1 - effect.life;
      alpha = effect.life;
      if (alpha < 0) {
        alpha = 0;
      }
      context.save();
      if (effect.kind === "ripple") {
        context.strokeStyle = effect.colorHex;
        context.globalAlpha = alpha * 0.55;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(screen.x, screen.y, effect.radius, 0, TWO_PI);
        context.stroke();
      } else if (effect.kind === "spark") {
        context.strokeStyle = effect.colorHex;
        context.globalAlpha = alpha * 0.75;
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(screen.x, screen.y);
        context.lineTo(
          screen.x - effect.velocityX * 0.028,
          screen.y + effect.velocityY * 0.028
        );
        context.stroke();
      } else if (effect.kind === "flash") {
        context.fillStyle = effect.colorHex;
        context.globalAlpha = alpha * 0.28;
        context.beginPath();
        context.arc(screen.x, screen.y, effect.radius * (0.5 + progress * 0.7), 0, TWO_PI);
        context.fill();
      }
      context.restore();
    }
  }

  function finishCapture() {
    var planet;
    planet = getPlanet(satellite.capturePlanetIndex);
    if (!planet) {
      satellite.state = SATELLITE_STATE_FLYING;
      return;
    }
    satellite.planetIndex = satellite.capturePlanetIndex;
    satellite.orbitAngle = satellite.captureStartAngle;
    satellite.orbitDirection = satellite.captureOrbitDirection;
    satellite.state = SATELLITE_STATE_ORBITING;
    satellite.velocityX = 0;
    satellite.velocityY = 0;
    setSatelliteOrbitPosition(planet);
    satellite.capturePlanetIndex = -1;
    satellite.captureProgress = 0;
    launchCooldownTimer = LAUNCH_COOLDOWN;
    trail.length = 0;
    spawnAttachBurstEffect(planet);
    onPlanetAttached(satellite.planetIndex);
    playCaptureSound();
  }

  function updateCapturing(deltaTime) {
    var planet;
    var easedProgress;
    var targetWorldX;
    var targetWorldY;
    var pullBlend;
    var tangent;
    var orbitSpeed;
    var targetVelocityX;
    var targetVelocityY;
    var velocityBlend;
    var deltaX;
    var deltaY;
    var distanceToOrbit;
    planet = getPlanet(satellite.capturePlanetIndex);
    if (!planet) {
      satellite.state = SATELLITE_STATE_FLYING;
      return;
    }
    satellite.captureProgress += deltaTime / CAPTURE_DURATION;
    if (satellite.captureProgress > 1) {
      satellite.captureProgress = 1;
    }
    easedProgress = getCaptureEase(satellite.captureProgress);
    targetWorldX = getPlanetWorldX(planet) + Math.cos(satellite.captureStartAngle) * planet.orbitRadius;
    targetWorldY = planet.worldY + Math.sin(satellite.captureStartAngle) * planet.orbitRadius;
    satellite.worldX = satellite.captureStartWorldX + (targetWorldX - satellite.captureStartWorldX) * easedProgress;
    satellite.worldY = satellite.captureStartWorldY + (targetWorldY - satellite.captureStartWorldY) * easedProgress;
    pullBlend = 1 - Math.exp(-CAPTURE_PULL_STRENGTH * deltaTime);
    deltaX = targetWorldX - satellite.worldX;
    deltaY = targetWorldY - satellite.worldY;
    satellite.worldX += deltaX * pullBlend;
    satellite.worldY += deltaY * pullBlend;
    tangent = getOrbitTangent(satellite.captureStartAngle, satellite.captureOrbitDirection);
    orbitSpeed = ORBIT_ANGULAR_SPEED * planet.orbitRadius;
    targetVelocityX = tangent.x * orbitSpeed;
    targetVelocityY = tangent.y * orbitSpeed;
    velocityBlend = 1 - Math.exp(-CAPTURE_PULL_STRENGTH * 0.7 * deltaTime);
    satellite.velocityX += (targetVelocityX - satellite.velocityX) * velocityBlend;
    satellite.velocityY += (targetVelocityY - satellite.velocityY) * velocityBlend;
    deltaX = satellite.worldX - getPlanetWorldX(planet);
    deltaY = satellite.worldY - planet.worldY;
    distanceToOrbit = Math.abs(Math.sqrt(deltaX * deltaX + deltaY * deltaY) - planet.orbitRadius);
    if (checkMeteoroidCollision()) {
      triggerGameOver();
      return;
    }
    if (satellite.captureProgress >= 1 || distanceToOrbit < 1.5) {
      finishCapture();
    }
  }

  function checkMeteoroidCollision() {
    var index;
    var meteoroid;
    var distance;
    for (index = 0; index < meteoroids.length; index += 1) {
      meteoroid = meteoroids[index];
      distance = getDistanceBetween(
        satellite.worldX,
        satellite.worldY,
        meteoroid.worldX,
        meteoroid.worldY
      );
      if (distance <= meteoroid.radius + SATELLITE_RADIUS) {
        return true;
      }
    }
    return false;
  }

  function detachSatellite() {
    var planet;
    var tangent;
    var speed;
    if (phase !== PHASE_PLAYING) {
      return;
    }
    if (satellite.state !== SATELLITE_STATE_ORBITING) {
      return;
    }
    if (launchCooldownTimer > 0) {
      return;
    }
    planet = getPlanet(satellite.planetIndex);
    if (!planet) {
      return;
    }
    tangent = getLaunchTangent();
    speed = ORBIT_ANGULAR_SPEED * planet.orbitRadius * LAUNCH_SPEED_MULTIPLIER;
    detachedFromPlanetIndex = satellite.planetIndex;
    satellite.velocityX = tangent.x * speed;
    satellite.velocityY = tangent.y * speed;
    satellite.state = SATELLITE_STATE_FLYING;
    launchCooldownTimer = LAUNCH_COOLDOWN;
    playLaunchSound();
  }

  function playLaunchSound() {
    var synth = getSynth();
    if (synth && synth.playJump) {
      synth.playJump();
      return;
    }
    if (synth && synth.playClick) {
      synth.playClick();
    }
  }

  function playCaptureSound() {
    var synth = getSynth();
    if (synth && synth.playLandGood) {
      synth.playLandGood();
      return;
    }
    if (synth && synth.playClick) {
      synth.playClick();
    }
  }

  function playGameOverSound() {
    var synth = getSynth();
    if (synth && synth.playCrash) {
      synth.playCrash();
    }
  }

  function updatePeakAltitude() {
    if (satellite.worldY > peakWorldY) {
      peakWorldY = satellite.worldY;
    }
  }

  function updateDistanceScore() {
    updatePeakAltitude();
    distanceMeters = Math.floor(Math.max(0, peakWorldY - startWorldY) * METERS_PER_WORLD_UNIT);
    if (distanceMeters > highScoreMeters) {
      if (phase === PHASE_PLAYING && distanceMeters > 0) {
        isNewRecord = true;
      }
      highScoreMeters = distanceMeters;
      saveHighScore();
    }
    updateDistanceHud();
    updateBestHud();
  }

  function getCameraTargetY() {
    var targetY = satellite.worldY - viewHeight * CAMERA_SATELLITE_Y_RATIO;
    if (targetY < 0) {
      return 0;
    }
    return targetY;
  }

  function getPreviewCameraY() {
    var planet = getPlanet(0);
    var targetY;
    if (!planet) {
      return 0;
    }
    targetY = planet.worldY - viewHeight * CAMERA_PREVIEW_Y_RATIO;
    if (targetY < 0) {
      return 0;
    }
    return targetY;
  }

  function updateCamera(deltaTime) {
    var blend;
    var targetY;
    updatePeakAltitude();
    targetY = getCameraTargetY();
    if (targetY > cameraTargetY) {
      cameraTargetY = targetY;
    }
    if (cameraTargetY <= cameraY) {
      return;
    }
    blend = 1 - Math.exp(-CAMERA_SMOOTH * deltaTime);
    cameraY += (cameraTargetY - cameraY) * blend;
    if (cameraY > cameraTargetY) {
      cameraY = cameraTargetY;
    }
  }

  function updatePreviewCamera() {
    cameraY = getPreviewCameraY();
    cameraTargetY = cameraY;
  }

  function updateOrbiting(deltaTime) {
    var planet;
    planet = getPlanet(satellite.planetIndex);
    if (!planet) {
      return;
    }
    satellite.orbitAngle += ORBIT_ANGULAR_SPEED * satellite.orbitDirection * deltaTime;
    setSatelliteOrbitPosition(planet);
  }

  function findCapturingPlanet() {
    var index;
    var planet;
    var distance;
    var orbitDistanceError;
    var bestIndex;
    var bestOrbitDistanceError;
    var speed;
    var captureTolerance;
    bestIndex = -1;
    bestOrbitDistanceError = Infinity;
    speed = Math.sqrt(satellite.velocityX * satellite.velocityX + satellite.velocityY * satellite.velocityY);
    captureTolerance = ORBIT_CAPTURE_TOLERANCE + speed * 0.03;
    for (index = planets.length - 1; index >= 0; index -= 1) {
      if (index === detachedFromPlanetIndex) {
        continue;
      }
      planet = planets[index];
      if (planet.spawnProgress < 1) {
        continue;
      }
      distance = getDistanceToPlanet(planet);
      if (distance > planet.orbitRadius + captureTolerance) {
        continue;
      }
      if (distance < planet.radius - SATELLITE_RADIUS) {
        continue;
      }
      orbitDistanceError = Math.abs(distance - planet.orbitRadius);
      if (orbitDistanceError < bestOrbitDistanceError) {
        bestOrbitDistanceError = orbitDistanceError;
        bestIndex = index;
      }
    }
    return bestIndex;
  }

  function isSatelliteOffScreen() {
    var screen = worldToScreen(satellite.worldX, satellite.worldY);
    if (screen.x < -FLY_OFFSCREEN_MARGIN) {
      return true;
    }
    if (screen.x > viewWidth + FLY_OFFSCREEN_MARGIN) {
      return true;
    }
    if (screen.y < -FLY_OFFSCREEN_MARGIN) {
      return true;
    }
    if (screen.y > viewHeight + FLY_OFFSCREEN_MARGIN) {
      return true;
    }
    return false;
  }

  function isAnyPlanetOnScreen() {
    var index;
    var planet;
    var screen;
    var spawnScale;
    var visibleRadius;
    var screenMargin = 48;
    for (index = 0; index < planets.length; index += 1) {
      planet = planets[index];
      spawnScale = getPlanetSpawnScale(planet);
      if (spawnScale <= 0.02) {
        continue;
      }
      screen = worldToScreen(getPlanetWorldX(planet), planet.worldY);
      visibleRadius = planet.orbitRadius * spawnScale + screenMargin;
      if (screen.x < -visibleRadius) {
        continue;
      }
      if (screen.x > viewWidth + visibleRadius) {
        continue;
      }
      if (screen.y < -visibleRadius) {
        continue;
      }
      if (screen.y > viewHeight + visibleRadius) {
        continue;
      }
      return true;
    }
    return false;
  }

  function hasFlewBeyondAllPlanets() {
    if (satellite.state !== SATELLITE_STATE_FLYING) {
      return false;
    }
    return !isAnyPlanetOnScreen();
  }

  function updateFlying(deltaTime) {
    var capturingIndex;
    var velocity;
    velocity = applyPlanetGravityToVelocity(
      satellite.worldX,
      satellite.worldY,
      satellite.velocityX,
      satellite.velocityY,
      deltaTime,
      -1
    );
    satellite.velocityX = velocity.x;
    satellite.velocityY = velocity.y;
    satellite.worldX += satellite.velocityX * deltaTime;
    satellite.worldY += satellite.velocityY * deltaTime;
    if (checkMeteoroidCollision()) {
      triggerGameOver();
      return;
    }
    capturingIndex = findCapturingPlanet();
    if (capturingIndex >= 0) {
      beginCapture(capturingIndex);
      return;
    }
    if (isSatelliteOffScreen() || hasFlewBeyondAllPlanets()) {
      triggerGameOver();
    }
  }

  function pushTrailPoint() {
    var point;
    if (satellite.state !== SATELLITE_STATE_FLYING) {
      return;
    }
    point = { x: satellite.worldX, y: satellite.worldY };
    trail.push(point);
    if (trail.length > TRAIL_MAX) {
      trail.shift();
    }
  }

  function getTrajectoryDrawStepCount() {
    if (pointerDownActive && satellite.state === SATELLITE_STATE_ORBITING) {
      return TRAJECTORY_STEP_COUNT_HOLD;
    }
    return TRAJECTORY_STEP_COUNT;
  }

  function wouldCapturePlanetAt(worldX, worldY, speed, ignorePlanetIndex) {
    var index;
    var planet;
    var distance;
    var orbitDistanceError;
    var captureTolerance;
    captureTolerance = ORBIT_CAPTURE_TOLERANCE + speed * 0.03;
    for (index = planets.length - 1; index >= 0; index -= 1) {
      if (index === ignorePlanetIndex) {
        continue;
      }
      if (index === detachedFromPlanetIndex) {
        continue;
      }
      planet = planets[index];
      if (planet.spawnProgress < 1) {
        continue;
      }
      distance = getDistanceToPlanetAt(worldX, worldY, planet);
      if (distance > planet.orbitRadius + captureTolerance) {
        continue;
      }
      if (distance < planet.radius - SATELLITE_RADIUS) {
        continue;
      }
      orbitDistanceError = Math.abs(distance - planet.orbitRadius);
      if (orbitDistanceError <= captureTolerance) {
        return true;
      }
    }
    return false;
  }

  function wouldHitMeteoroidAt(worldX, worldY) {
    var index;
    var meteoroid;
    var distance;
    for (index = 0; index < meteoroids.length; index += 1) {
      meteoroid = meteoroids[index];
      distance = getDistanceBetween(worldX, worldY, meteoroid.worldX, meteoroid.worldY);
      if (distance <= meteoroid.radius + SATELLITE_RADIUS) {
        return true;
      }
    }
    return false;
  }

  function detectTrajectoryHits(points, ignorePlanetIndex) {
    var stepIndex;
    var point;
    var speed;
    var meteoroidStep;
    var planetStep;
    meteoroidStep = -1;
    planetStep = -1;
    for (stepIndex = 1; stepIndex < points.length; stepIndex += 1) {
      point = points[stepIndex];
      if (meteoroidStep < 0 && wouldHitMeteoroidAt(point.x, point.y)) {
        meteoroidStep = stepIndex;
      }
      speed = getDistanceBetween(points[stepIndex - 1].x, points[stepIndex - 1].y, point.x, point.y) / TRAJECTORY_STEP_TIME;
      if (planetStep < 0 && wouldCapturePlanetAt(point.x, point.y, speed, ignorePlanetIndex)) {
        planetStep = stepIndex;
      }
      if (meteoroidStep >= 0 && planetStep >= 0) {
        break;
      }
    }
    return {
      meteoroidStep: meteoroidStep,
      planetStep: planetStep
    };
  }

  function getTrajectorySegmentColor(stepIndex, meteoroidStep, planetStep) {
    if (meteoroidStep >= 0 && stepIndex >= meteoroidStep) {
      return TRAJECTORY_COLOR_RED;
    }
    if (planetStep >= 0) {
      return TRAJECTORY_COLOR_BLUE;
    }
    return TRAJECTORY_COLOR_GREY;
  }

  function simulateFullTrajectoryPoints() {
    var planet;
    var tangent;
    var speed;
    var worldX;
    var worldY;
    var velocityX;
    var velocityY;
    var stepIndex;
    var velocity;
    var points;
    points = [];
    if (satellite.state !== SATELLITE_STATE_ORBITING) {
      return points;
    }
    planet = getPlanet(satellite.planetIndex);
    if (!planet) {
      return points;
    }
    tangent = getLaunchTangent();
    speed = ORBIT_ANGULAR_SPEED * planet.orbitRadius * LAUNCH_SPEED_MULTIPLIER;
    worldX = satellite.worldX;
    worldY = satellite.worldY;
    velocityX = tangent.x * speed;
    velocityY = tangent.y * speed;
    points.push({ x: worldX, y: worldY });
    for (stepIndex = 0; stepIndex < TRAJECTORY_PREDICT_COUNT; stepIndex += 1) {
      velocity = applyPlanetGravityToVelocity(
        worldX,
        worldY,
        velocityX,
        velocityY,
        TRAJECTORY_STEP_TIME,
        -1
      );
      velocityX = velocity.x;
      velocityY = velocity.y;
      worldX += velocityX * TRAJECTORY_STEP_TIME;
      worldY += velocityY * TRAJECTORY_STEP_TIME;
      points.push({ x: worldX, y: worldY });
    }
    return points;
  }

  function buildLaunchTrajectoryPoints() {
    var fullPoints;
    var drawStepCount;
    var index;
    fullPoints = simulateFullTrajectoryPoints();
    trajectoryPoints.length = 0;
    drawStepCount = getTrajectoryDrawStepCount();
    for (index = 0; index < fullPoints.length && index <= drawStepCount; index += 1) {
      trajectoryPoints.push(fullPoints[index]);
    }
  }

  function initWorld() {
    var firstPlanet;
    planets.length = 0;
    meteoroids.length = 0;
    trail.length = 0;
    attachEffects.length = 0;
    trajectoryPoints.length = 0;
    nextPlanetIndex = 0;
    nextMeteoroidSectorIndex = 0;
    highestGeneratedY = 0;
    launchCooldownTimer = 0;
    detachedFromPlanetIndex = -1;
    spawnFirstPlanet();
    firstPlanet = planets[0];
    if (!firstPlanet) {
      return;
    }
    startWorldY = firstPlanet.worldY;
    satellite.planetIndex = 0;
    satellite.orbitAngle = INITIAL_ORBIT_ANGLE;
    satellite.orbitDirection = 1;
    satellite.state = SATELLITE_STATE_ORBITING;
    satellite.velocityX = 0;
    satellite.velocityY = 0;
    satellite.capturePlanetIndex = -1;
    satellite.captureProgress = 0;
    setSatelliteOrbitPosition(firstPlanet);
    peakWorldY = satellite.worldY;
    cameraY = getCameraTargetY();
    cameraTargetY = cameraY;
  }

  function resetRun() {
    isNewRecord = false;
    distanceMeters = 0;
    peakWorldY = 0;
    initWorld();
    updateDistanceHud();
    updateBestHud();
  }

  function beginPlaying() {
    resizeCanvas();
    phase = PHASE_PLAYING;
    gameScreen.classList.add("hidden");
    hudPlaying.classList.remove("hidden");
    skipNextLaunchFromRelease = true;
    resetRun();
    onPlanetAttached(0);
    if (window.WebExtrasGameStartMusicNotify) {
      window.WebExtrasGameStartMusicNotify.notifyGameplayStarted();
    }
  }

  function showStartScreen() {
    phase = PHASE_START;
    resizeCanvas();
    initWorld();
    updatePreviewCamera();
    screenTitle.textContent = GAME_TITLE;
    controlHint.textContent = getLocale(
      LOCALE_KEY_HINT,
      "Tap or release to launch from orbit. Hop between planets and climb through the stars."
    );
    screenScore.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    gameScreen.classList.remove("is-record");
    hudPlaying.classList.add("hidden");
    if (window.WebExtrasGameStartMusicNotify) {
      window.WebExtrasGameStartMusicNotify.notifyStartScreenReady();
    }
  }

  function triggerGameOver() {
    if (phase !== PHASE_PLAYING) {
      return;
    }
    phase = PHASE_GAME_OVER;
    pointerDownActive = false;
    skipNextLaunchFromRelease = false;
    updateDistanceScore();
    playGameOverSound();
    screenTitle.textContent = getLocale(LOCALE_KEY_GAME_OVER, "Game Over");
    controlHint.textContent = getLocale(
      LOCALE_KEY_HINT,
      "Tap or release to launch from orbit. Hop between planets and climb through the stars."
    );
    screenScore.textContent = formatDistance(distanceMeters);
    screenScore.classList.remove("hidden");
    if (isNewRecord) {
      gameScreen.classList.add("is-record");
    } else {
      gameScreen.classList.remove("is-record");
    }
    gameScreen.classList.remove("hidden");
    hudPlaying.classList.add("hidden");
    if (window.WebExtrasGameStartMusicNotify) {
      window.WebExtrasGameStartMusicNotify.notifyGameOver();
    }
  }

  function onLaunchInput() {
    if (phase === PHASE_START || phase === PHASE_GAME_OVER) {
      beginPlaying();
      return;
    }
    detachSatellite();
  }

  function onPointerDown(event) {
    if (event && event.button != null && event.button !== 0) {
      return;
    }
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    pointerDownActive = true;
    if (phase === PHASE_START || phase === PHASE_GAME_OVER) {
      skipNextLaunchFromRelease = true;
      beginPlaying();
      return;
    }
  }

  function onPointerUp(event) {
    if (event && event.button != null && event.button !== 0) {
      return;
    }
    if (!pointerDownActive) {
      return;
    }
    pointerDownActive = false;
    if (skipNextLaunchFromRelease) {
      skipNextLaunchFromRelease = false;
      return;
    }
    if (phase === PHASE_PLAYING && satellite.state === SATELLITE_STATE_ORBITING) {
      detachSatellite();
    }
  }

  function onKeyDown(event) {
    if (!event) {
      return;
    }
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      onLaunchInput();
    }
  }

  function resizeCanvas() {
    var rect;
    rect = canvas.getBoundingClientRect();
    viewWidth = rect.width;
    viewHeight = rect.height;
    devicePixelRatioScale = window.devicePixelRatio || 1;
    if (devicePixelRatioScale > 2) {
      devicePixelRatioScale = 2;
    }
    canvas.width = Math.floor(viewWidth * devicePixelRatioScale);
    canvas.height = Math.floor(viewHeight * devicePixelRatioScale);
    context.setTransform(devicePixelRatioScale, 0, 0, devicePixelRatioScale, 0, 0);
    if (phase === PHASE_START) {
      initWorld();
      updatePreviewCamera();
    }
  }

  function drawBackground() {
    var gradient;
    gradient = context.createLinearGradient(0, 0, 0, viewHeight);
    gradient.addColorStop(0, "#040818");
    gradient.addColorStop(0.45, "#060c1c");
    gradient.addColorStop(1, "#02040a");
    context.fillStyle = gradient;
    context.fillRect(0, 0, viewWidth, viewHeight);
  }

  function drawStars(timeSeconds) {
    var index;
    var star;
    var screenX;
    var screenY;
    var twinkle;
    var alpha;
    for (index = 0; index < stars.length; index += 1) {
      star = stars[index];
      screenX = star.offsetX + viewWidth * 0.5;
      screenY = viewHeight - (star.offsetY - cameraY * star.parallax);
      if (screenY < -4 || screenY > viewHeight + 4) {
        continue;
      }
      twinkle = 0.55 + 0.45 * Math.sin(timeSeconds * star.twinkleSpeed + star.twinklePhase);
      alpha = star.brightness * twinkle;
      context.fillStyle = "rgba(220,235,255," + alpha.toFixed(3) + ")";
      context.beginPath();
      context.arc(screenX, screenY, star.size, 0, TWO_PI);
      context.fill();
    }
  }

  function drawPlanetTerrain(planet, screenX, screenY, radius) {
    var spotIndex;
    var spot;
    var spotX;
    var spotY;
    var spotRadius;
    var spotAlpha;
    if (!planet.terrainSpots || planet.terrainSpots.length === 0) {
      return;
    }
    context.save();
    context.beginPath();
    context.arc(screenX, screenY, radius, 0, TWO_PI);
    context.clip();
    for (spotIndex = 0; spotIndex < planet.terrainSpots.length; spotIndex += 1) {
      spot = planet.terrainSpots[spotIndex];
      spotX = screenX + Math.cos(spot.angle + planet.spinAngle) * spot.distance * radius;
      spotY = screenY + Math.sin(spot.angle + planet.spinAngle) * spot.distance * radius;
      spotRadius = spot.size * radius;
      spotAlpha = 0.12 + spot.shade * 0.28;
      if (spot.shade > 0.55) {
        context.fillStyle = "rgba(255,255,255," + (spotAlpha * 0.45).toFixed(3) + ")";
      } else {
        context.fillStyle = "rgba(0,0,0," + spotAlpha.toFixed(3) + ")";
      }
      context.beginPath();
      context.arc(spotX, spotY, spotRadius, 0, TWO_PI);
      context.fill();
    }
    context.restore();
  }

  function isNextPlanetHintOnScreen(previewPlanet) {
    var screen;
    var visibleRadius;
    screen = worldToScreen(previewPlanet.anchorWorldX, previewPlanet.worldY);
    visibleRadius = previewPlanet.orbitRadius + 56;
    if (screen.x < -visibleRadius) {
      return false;
    }
    if (screen.x > viewWidth + visibleRadius) {
      return false;
    }
    if (screen.y < -visibleRadius) {
      return false;
    }
    if (screen.y > viewHeight + visibleRadius) {
      return false;
    }
    return true;
  }

  function drawNextPlanetHint(previewPlanet, timeSeconds) {
    var screen;
    var pulse;
    var orbitRadius;
    var coreRadius;
    var ringAlpha;
    var coreAlpha;
    var crossAlpha;
    var armLength;
    if (!previewPlanet) {
      return;
    }
    if (!isNextPlanetHintOnScreen(previewPlanet)) {
      return;
    }
    screen = worldToScreen(previewPlanet.anchorWorldX, previewPlanet.worldY);
    pulse = 0.5 + 0.5 * Math.sin(timeSeconds * NEXT_PLANET_HINT_PULSE_SPEED + previewPlanet.driftPhase);
    orbitRadius = previewPlanet.orbitRadius * (0.58 + pulse * 0.1);
    coreRadius = previewPlanet.radius * (0.28 + pulse * 0.08);
    ringAlpha = 0.12 + pulse * 0.14;
    coreAlpha = 0.1 + pulse * 0.12;
    crossAlpha = 0.16 + pulse * 0.18;
    armLength = coreRadius * (1.2 + pulse * 0.35);
    context.save();
    context.strokeStyle = "rgba(120,195,255," + ringAlpha.toFixed(3) + ")";
    context.lineWidth = 1;
    context.setLineDash([5, 7]);
    context.beginPath();
    context.arc(screen.x, screen.y, orbitRadius, 0, TWO_PI);
    context.stroke();
    context.setLineDash([2, 6]);
    context.beginPath();
    context.arc(screen.x, screen.y, orbitRadius * 0.72, 0, TWO_PI);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "rgba(140,210,255," + coreAlpha.toFixed(3) + ")";
    context.beginPath();
    context.arc(screen.x, screen.y, coreRadius, 0, TWO_PI);
    context.fill();
    context.strokeStyle = "rgba(170,225,255," + crossAlpha.toFixed(3) + ")";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(screen.x - armLength, screen.y);
    context.lineTo(screen.x + armLength, screen.y);
    context.moveTo(screen.x, screen.y - armLength);
    context.lineTo(screen.x, screen.y + armLength);
    context.stroke();
    context.beginPath();
    context.arc(screen.x, screen.y, 2.2 + pulse * 1.2, 0, TWO_PI);
    context.fillStyle = "rgba(210,240,255," + (crossAlpha + 0.1).toFixed(3) + ")";
    context.fill();
    context.restore();
  }

  function drawPlanetSpawnBurst(planet, timeSeconds) {
    var screen;
    var spawnScale;
    var burstRadius;
    var burstAlpha;
    if (planet.spawnProgress >= 1 || planet.spawnProgress <= 0.02) {
      return;
    }
    screen = worldToScreen(getPlanetWorldX(planet), planet.worldY);
    spawnScale = getPlanetSpawnScale(planet);
    burstRadius = planet.orbitRadius * spawnScale * 1.15;
    burstAlpha = (1 - planet.spawnProgress) * 0.35;
    context.save();
    context.strokeStyle = "rgba(140,220,255," + burstAlpha.toFixed(3) + ")";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(screen.x, screen.y, burstRadius, 0, TWO_PI);
    context.stroke();
    context.restore();
  }

  function drawPlanetRingHalf(planet, isFrontHalf) {
    var screen;
    var spawnScale;
    var planetRadius;
    var ringRadius;
    var innerRadius;
    var ringLineWidth;
    var startAngle;
    var endAngle;
    var bodyAlpha;
    if (!planet.hasRing) {
      return;
    }
    screen = worldToScreen(getPlanetWorldX(planet), planet.worldY);
    spawnScale = getPlanetSpawnScale(planet);
    planetRadius = planet.radius * spawnScale;
    if (spawnScale <= 0.02) {
      return;
    }
    ringRadius = planetRadius * PLANET_RING_RADIUS_FACTOR;
    innerRadius = ringRadius * PLANET_RING_INNER_FACTOR;
    ringLineWidth = Math.max(2, planetRadius * 0.1);
    if (isFrontHalf) {
      startAngle = 0;
      endAngle = Math.PI;
    } else {
      startAngle = Math.PI;
      endAngle = TWO_PI;
    }
    bodyAlpha = 0.3 + spawnScale * 0.7;
    context.save();
    context.translate(screen.x, screen.y);
    context.rotate(planet.ringAngle);
    context.globalAlpha = bodyAlpha * 0.9;
    context.lineCap = "round";
    context.strokeStyle = planet.palette.rim;
    context.lineWidth = ringLineWidth;
    context.beginPath();
    context.ellipse(0, 0, ringRadius, ringRadius * planet.ringTilt, 0, startAngle, endAngle);
    context.stroke();
    context.globalAlpha = bodyAlpha * 0.45;
    context.lineWidth = Math.max(1, ringLineWidth * 0.55);
    context.beginPath();
    context.ellipse(0, 0, innerRadius, innerRadius * planet.ringTilt, 0, startAngle, endAngle);
    context.stroke();
    context.restore();
  }

  function drawOrbitRing(planet) {
    var screen = worldToScreen(getPlanetWorldX(planet), planet.worldY);
    var spawnScale = getPlanetSpawnScale(planet);
    var radius = planet.orbitRadius * spawnScale;
    if (spawnScale <= 0.02) {
      return;
    }
    context.save();
    context.globalAlpha = 0.25 + spawnScale * 0.75;
    context.strokeStyle = planet.palette.ring;
    context.lineWidth = 1;
    context.setLineDash([5, 9]);
    context.beginPath();
    context.arc(screen.x, screen.y, radius, 0, TWO_PI);
    context.stroke();
    context.setLineDash([]);
    context.restore();
  }

  function drawPlanetBody(planet) {
    var screen = worldToScreen(getPlanetWorldX(planet), planet.worldY);
    var spawnScale = getPlanetSpawnScale(planet);
    var radius = planet.radius * spawnScale;
    var gradient;
    var atmosphereGradient;
    if (spawnScale <= 0.02) {
      return;
    }

    context.save();
    context.globalAlpha = 0.3 + spawnScale * 0.7;
    context.shadowColor = planet.palette.glow;
    context.shadowBlur = radius * 0.9;

    atmosphereGradient = context.createRadialGradient(
      screen.x,
      screen.y,
      radius * 0.82,
      screen.x,
      screen.y,
      radius * 1.18
    );
    atmosphereGradient.addColorStop(0, "rgba(0,0,0,0)");
    atmosphereGradient.addColorStop(1, "rgba(120,180,255,0.12)");
    context.fillStyle = atmosphereGradient;
    context.beginPath();
    context.arc(screen.x, screen.y, radius * 1.18, 0, TWO_PI);
    context.fill();

    gradient = context.createRadialGradient(
      screen.x - radius * 0.32,
      screen.y - radius * 0.36,
      radius * 0.06,
      screen.x + radius * 0.08,
      screen.y + radius * 0.06,
      radius
    );
    gradient.addColorStop(0, planet.palette.rim);
    gradient.addColorStop(0.45, planet.palette.core);
    gradient.addColorStop(0.82, planet.palette.glow);
    gradient.addColorStop(1, "#0a1020");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(screen.x, screen.y, radius, 0, TWO_PI);
    context.fill();

    drawPlanetTerrain(planet, screen.x, screen.y, radius);

    context.shadowBlur = 0;
    context.strokeStyle = "rgba(255,255,255,0.1)";
    context.lineWidth = 1;
    context.beginPath();
    context.arc(screen.x, screen.y, radius, planet.spinAngle, planet.spinAngle + 1.4);
    context.stroke();
    context.beginPath();
    context.arc(screen.x, screen.y, radius * 0.92, planet.spinAngle + 0.8, planet.spinAngle + 2.1);
    context.stroke();

    context.restore();
  }

  function drawTrail() {
    var index;
    var point;
    var screen;
    var alpha;
    if (trail.length < 2) {
      return;
    }
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    for (index = 1; index < trail.length; index += 1) {
      alpha = index / trail.length;
      context.strokeStyle = "rgba(120,220,255," + (alpha * 0.55).toFixed(3) + ")";
      context.lineWidth = 1 + alpha * 2;
      context.beginPath();
      screen = worldToScreen(trail[index - 1].x, trail[index - 1].y);
      context.moveTo(screen.x, screen.y);
      screen = worldToScreen(trail[index].x, trail[index].y);
      context.lineTo(screen.x, screen.y);
      context.stroke();
    }
    context.restore();
  }

  function drawMeteoroid(meteoroid, timeSeconds) {
    var screen = worldToScreen(meteoroid.worldX, meteoroid.worldY);
    var radius = meteoroid.radius;
    var pointIndex;
    var angle;
    var pointRadius;
    var pointX;
    var pointY;
    var pulse;
    var pulseAlpha;
    meteoroid.rotation += meteoroid.spin * 0.016;
    pulse = 0.72 + 0.28 * Math.sin(timeSeconds * 5.5 + meteoroid.jaggedSeed);
    pulseAlpha = 0.18 + pulse * 0.22;
    context.save();
    context.strokeStyle = "rgba(255,70,55," + pulseAlpha.toFixed(3) + ")";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(screen.x, screen.y, radius * (1.15 + pulse * 0.2), 0, TWO_PI);
    context.stroke();
    context.translate(screen.x, screen.y);
    context.rotate(meteoroid.rotation);
    context.shadowColor = "rgba(255,80,60,0.65)";
    context.shadowBlur = radius * (1.6 + pulse * 0.5);
    context.fillStyle = "#7a5850";
    context.strokeStyle = "rgba(255,120,90,0.55)";
    context.lineWidth = 1.5;
    context.beginPath();
    for (pointIndex = 0; pointIndex < 7; pointIndex += 1) {
      angle = (pointIndex / 7) * TWO_PI;
      pointRadius = radius * (0.72 + seededRandom(meteoroid.jaggedSeed + pointIndex * 1.7) * 0.42);
      pointX = Math.cos(angle) * pointRadius;
      pointY = Math.sin(angle) * pointRadius;
      if (pointIndex === 0) {
        context.moveTo(pointX, pointY);
      } else {
        context.lineTo(pointX, pointY);
      }
    }
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  function drawMeteoroids(timeSeconds) {
    var index;
    var meteoroid;
    var minY = cameraY - viewHeight;
    var maxY = cameraY + viewHeight * 2;
    for (index = 0; index < meteoroids.length; index += 1) {
      meteoroid = meteoroids[index];
      if (meteoroid.worldY < minY - 80) {
        continue;
      }
      if (meteoroid.worldY > maxY + 80) {
        continue;
      }
      drawMeteoroid(meteoroid, timeSeconds);
    }
  }

  function drawLaunchGuide() {
    var index;
    var screen;
    var fullPoints;
    var hits;
    var drawCount;
    if (satellite.state !== SATELLITE_STATE_ORBITING) {
      return;
    }
    if (phase !== PHASE_START && phase !== PHASE_PLAYING) {
      return;
    }
    fullPoints = simulateFullTrajectoryPoints();
    if (fullPoints.length < 2) {
      return;
    }
    hits = detectTrajectoryHits(fullPoints, satellite.planetIndex);
    drawCount = getTrajectoryDrawStepCount();
    trajectoryPoints.length = 0;
    for (index = 0; index < fullPoints.length && index <= drawCount; index += 1) {
      trajectoryPoints.push(fullPoints[index]);
    }
    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.setLineDash([LAUNCH_GUIDE_DASH, LAUNCH_GUIDE_GAP]);
    context.lineWidth = 1;
    for (index = 1; index < trajectoryPoints.length; index += 1) {
      context.strokeStyle = getTrajectorySegmentColor(index, hits.meteoroidStep, hits.planetStep);
      context.beginPath();
      screen = worldToScreen(trajectoryPoints[index - 1].x, trajectoryPoints[index - 1].y);
      context.moveTo(screen.x, screen.y);
      screen = worldToScreen(trajectoryPoints[index].x, trajectoryPoints[index].y);
      context.lineTo(screen.x, screen.y);
      context.stroke();
    }
    context.setLineDash([]);
    context.restore();
  }

  function drawSatellite(timeSeconds) {
    var screen = worldToScreen(satellite.worldX, satellite.worldY);
    var size = SATELLITE_RADIUS;
    var wing = size * 2.4;
    var heading = getSatelliteHeadingRadians();

    context.save();
    context.translate(screen.x, screen.y);
    context.rotate(heading);

    context.shadowColor = "#80d8ff";
    context.shadowBlur = 12;

    context.fillStyle = "#c8ecff";
    context.beginPath();
    context.moveTo(size * 1.6, 0);
    context.lineTo(-size * 0.8, size * 0.7);
    context.lineTo(-size * 0.4, 0);
    context.lineTo(-size * 0.8, -size * 0.7);
    context.closePath();
    context.fill();

    context.fillStyle = "rgba(100,180,255,0.85)";
    context.fillRect(-wing * 0.5, -size * 0.22, wing, size * 0.44);

    context.fillStyle = "#ff9040";
    context.beginPath();
    context.arc(-size * 0.55, 0, size * 0.22, 0, TWO_PI);
    context.fill();

    context.restore();
  }

  function drawPlanets(timeSeconds) {
    var index;
    var planet;
    var screenY;
    var minY = cameraY - viewHeight;
    var maxY = cameraY + viewHeight * 2;
    for (index = 0; index < planets.length; index += 1) {
      planet = planets[index];
      if (planet.worldY < minY - 120) {
        continue;
      }
      if (planet.worldY > maxY + 120) {
        continue;
      }
      screenY = worldToScreen(getPlanetWorldX(planet), planet.worldY).y;
      if (screenY < -planet.orbitRadius - 40) {
        continue;
      }
      if (screenY > viewHeight + planet.orbitRadius + 40) {
        continue;
      }
      drawPlanetSpawnBurst(planet, timeSeconds);
      drawOrbitRing(planet);
      drawPlanetRingHalf(planet, false);
      drawPlanetBody(planet);
      drawPlanetRingHalf(planet, true);
    }
  }

  function render(timeSeconds) {
    var nextPlanetPreview;
    drawBackground();
    drawStars(timeSeconds);
    nextPlanetPreview = getNextPlanetSlotPreview();
    if (nextPlanetPreview) {
      drawNextPlanetHint(nextPlanetPreview, timeSeconds);
    }
    drawPlanets(timeSeconds);
    drawMeteoroids(timeSeconds);
    drawTrail();
    drawLaunchGuide();
    drawAttachEffects();
    drawSatellite(timeSeconds);
  }

  var lastFrameTime = 0;

  function gameLoop(timestamp) {
    var deltaTime;
    if (!lastFrameTime) {
      lastFrameTime = timestamp;
    }
    deltaTime = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;
    if (deltaTime > 0.05) {
      deltaTime = 0.05;
    }

    updatePlanetSpawns(deltaTime);
    updatePlanetSpins(deltaTime);
    updateAttachEffects(deltaTime);
    if (phase === PHASE_START) {
      updateOrbiting(deltaTime);
      updatePreviewCamera();
    } else if (phase === PHASE_PLAYING) {
      if (launchCooldownTimer > 0) {
        launchCooldownTimer -= deltaTime;
        if (launchCooldownTimer < 0) {
          launchCooldownTimer = 0;
        }
      }
      if (satellite.state === SATELLITE_STATE_ORBITING) {
        updateOrbiting(deltaTime);
      } else if (satellite.state === SATELLITE_STATE_CAPTURING) {
        updateCapturing(deltaTime);
      } else {
        updateFlying(deltaTime);
        pushTrailPoint();
      }
      updateCamera(deltaTime);
      updateDistanceScore();
    }

    gameTimeSeconds = timestamp / 1000;
    render(gameTimeSeconds);
    window.requestAnimationFrame(gameLoop);
  }

  function applyLocale() {
    updateBestHud();
    if (phase === PHASE_START) {
      controlHint.textContent = getLocale(
        LOCALE_KEY_HINT,
        "Tap or release to launch from orbit. Hop between planets and climb through the stars."
      );
    }
  }

  function bindEvents() {
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("web-locale-applied", applyLocale);
    gameRoot.addEventListener("pointerdown", onPointerDown);
    gameRoot.addEventListener("pointerup", onPointerUp);
    gameRoot.addEventListener("pointercancel", onPointerUp);
    gameRoot.addEventListener("keydown", onKeyDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", function () {
      pointerDownActive = false;
    });
  }

  function init() {
    loadHighScore();
    buildStars();
    bindEvents();
    resizeCanvas();
    showStartScreen();
    gameRoot.focus();
    window.requestAnimationFrame(gameLoop);
    window.setTimeout(function () {
      resizeCanvas();
      if (phase === PHASE_START) {
        updatePreviewCamera();
      }
    }, 0);
  }

  init();
})();
