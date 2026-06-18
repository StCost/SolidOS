(function () {
  var HIGH_SCORE_STORAGE_KEY = "cm-cargo-convoy-high-score";
  var GAME_TITLE = "Cargo Convoy";
  var LOCALE_KEY_HINT = "web.game.cargo-convoy.hint";
  var LOCALE_KEY_GAME_OVER = "web.game.game-over";
  var LOCALE_KEY_BEST_LABEL = "web.game.best-label";
  var LOCALE_KEY_DISTANCE = "web.game.cargo-convoy.distance-label";
  var LOCALE_KEY_SCORE = "web.game.cargo-convoy.score-label";

  var PHASE_START = "start";
  var PHASE_PLAYING = "playing";
  var PHASE_GAME_OVER = "gameover";

  var UNIT_TRUCK = "truck";
  var UNIT_BOSS_TRUCK = "boss_truck";
  var UNIT_ESCORT = "escort";
  var UNIT_ENEMY = "enemy";

  var COMBAT_MODE_ATTACK = "attack";
  var COMBAT_MODE_DEFENSE = "defense";
  var COMBAT_MODE_ATTACK_COLOR = "#e85848";
  var COMBAT_MODE_DEFENSE_COLOR = "#5aa0f0";
  var ESCORT_DEFENSE_DAMAGE_TAKEN_FACTOR = 0.75;
  var ESCORT_ATTACK_DAMAGE_DEALT_FACTOR = 1.25;
  var UNIT_STAR_KILLS_PER_STAR = 1;
  var UNIT_STAR_KILL_COUNT_TRUCK = 3;
  var UNIT_STAR_HEAL_MAX_HEALTH_FACTOR = 10;
  var UNIT_STAR_DAMAGE_TAKEN_REDUCTION = 0.01;
  var UNIT_STAR_DAMAGE_DEALT_BONUS = 0.01;
  var UNIT_STAR_HEAL_BONUS = 0.01;
  var UNIT_STAR_RANGE_BONUS = 0.01;
  var UNIT_STAR_CRYSTAL_DROP_BONUS = 0.01;
  var UNIT_STAR_DISPLAY_MAX_ICONS = 20;

  var NPC_PATH_UPDATE_INTERVAL = 0.55;

  var TWO_PI = Math.PI * 2;

  var SCROLL_SPEED_BASE = 118;
  var SCROLL_SPEED_GROWTH = 0.006;
  var SCROLL_SPEED_MAX = 240;

  var TRUCK_LENGTH = 148;
  var TRUCK_WIDTH = 34;
  var FRIENDLY_TRUCK_CAPSULE_RADIUS_FACTOR = 0.52;
  var TRUCK_HEALTH = 240;
  var TRUCK_MOVE_SPEED = 92;

  var CAR_LENGTH = 30;
  var CAR_WIDTH = 18;
  var CAR_RADIUS = 14;
  var CAR_HEALTH = 40;
  var CAR_MOVE_SPEED = 168;
  var ENEMY_MOVE_SPEED = 142;
  var UNIT_MOVE_SPEED_LEFT_FACTOR = 1.14;
  var UNIT_MOVE_SPEED_RIGHT_FACTOR = 0.92;

  var UNIT_FACE_ANGLE = 0;

  var TURRET_FIRE_RANGE = 320;
  var TURRET_FIRE_COOLDOWN = 0.55;
  var TRUCK_TURRET_WOBBLE = 0.35;
  var TURRET_TURN_SPEED = 2.4;
  var TURRET_TARGET_AIM_ROTATION_COST = 58;
  var TURRET_TARGET_FORWARD_ROTATION_EXTRA_COST = 42;
  var PROJECTILE_SPEED = 540;
  var PROJECTILE_DAMAGE = 12;
  var PROJECTILE_RADIUS = 3;

  var TURRET_TYPE_BALLISTIC = "ballistic";
  var TURRET_TYPE_LASER = "laser";
  var TURRET_TYPE_HEAL = "heal";
  var LASER_TURRET_SPAWN_CHANCE = 0.1;
  var HEAL_TURRET_SPAWN_CHANCE = 0.04;
  var LASER_TURRET_FIRE_RANGE = 380;
  var LASER_TURRET_DPS = 30;
  var HEAL_TURRET_FIRE_RANGE = 380;
  var HEAL_TURRET_HPS = 30;
  var LASER_BEAM_LIFE = 0.06;
  var TURRET_COLOR_BLUE = "#4a90e8";
  var TURRET_COLOR_BLUE_DARK = "#2a5a98";
  var TURRET_COLOR_LASER = "#ffd830";
  var TURRET_COLOR_LASER_DARK = "#c8a010";
  var TURRET_COLOR_HEAL = "#48e878";
  var TURRET_COLOR_HEAL_DARK = "#28a848";

  var CRYSTAL_PICKUP_RADIUS = 42;
  var CRYSTAL_HOVER_RADIUS = 52;
  var CRYSTAL_AUTO_COLLECT_LAY_TIME = 10;
  var CRYSTAL_SPAWN_SCREEN_EDGE_MARGIN = 20;
  var TERRAIN_CELL_WIDTH = 640;
  var TERRAIN_CELL_HEIGHT = 320;
  var TERRAIN_CELL_X_MARGIN = 1;
  var TERRAIN_CELL_Y_MARGIN = 1;
  var TERRAIN_CELL_DESPAWN_MARGIN = 640;
  var TERRAIN_ROCK_COUNT_MIN = 2;
  var TERRAIN_ROCK_COUNT_MAX = 5;
  var TERRAIN_BUSH_COUNT_MIN = 2;
  var TERRAIN_BUSH_COUNT_MAX = 6;
  var TERRAIN_DEBRIS_COUNT_MIN = 5;
  var TERRAIN_DEBRIS_COUNT_MAX = 10;
  var CRYSTAL_RARITY_COUNT = 5;
  var CRYSTAL_RARITY_COLORS = [
    [48, 198, 82],
    [72, 140, 255],
    [180, 90, 255],
    [255, 160, 64],
    [255, 72, 72]
  ];
  var CRYSTAL_RARITY_WEIGHTS = [0.42, 0.28, 0.17, 0.09, 0.04];
  var CRYSTAL_RARITY_SIZE = [0.85, 1.0, 1.2, 1.45, 1.75];
  var CRYSTAL_RARITY_VALUE = [1, 1, 2, 3, 5];
  var CRYSTAL_RARITY_GLOW = [0.35, 0.5, 0.7, 0.9, 1.15];

  var ENEMY_CRYSTAL_DROP_BASE = 15;
  var ENEMY_CRYSTAL_DROP_SPREAD = 10;
  var ESCORT_SPAWN_COST_BASE = 15;
  var ECONOMY_KM_STEP = 1000;
  var ECONOMY_SCALE_PER_KM = 0.26;

  var ENEMY_TRUCK_SPAWN_CHANCE_BASE = 0.01;
  var ENEMY_TRUCK_SPAWN_CHANCE_SCALE_PER_KM = 0.018;
  var ENEMY_TRUCK_SPAWN_CHANCE_MAX = 0.3;
  var SELECTED_ESCORT_FIRE_RANGE_FACTOR = 2;
  var SELECTED_UNIT_TURRET_TURN_SPEED_FACTOR = 2;
  var TRUCK_MINE_EVADE_DETECT_RANGE = 480;
  var TRUCK_PATH_FORWARD_RANGE = 480;
  var TRUCK_PATH_HALF_WIDTH_PADDING = 28;
  var TRUCK_FOLLOW_ESCORT_SEPARATION_SCREEN_X_FACTOR = 0.3;
  var TRUCK_FOLLOW_ESCORT_SEPARATION_SCREEN_Y_FACTOR = 0.3;
  var BOSS_TRUCK_HEALTH = 480;
  var BOSS_TRUCK_MOVE_SPEED = 78;
  var BOSS_CRYSTAL_DROP_BASE = 50;
  var BOSS_CRYSTAL_DROP_SPREAD = 15;

  var UNIT_ON_SCREEN_MARGIN = 48;
  var UNIT_DESPAWN_SCREEN_MARGIN = 96;

  var ENEMY_SPAWN_INTERVAL_MIN = 4.5;
  var ENEMY_SPAWN_INTERVAL_MAX = 9;
  var ENEMY_MAX_COUNT = 12;
  var ENEMY_SPAWN_DISTANCE_KM_STEP = 3000;
  var ENEMY_SPAWN_DIRECTION_COUNT = 8;
  var ENEMY_SPAWN_WARNING_DURATION = 1.85;
  var ENEMY_SPAWN_HAZARD_RADIUS = 48;
  var ENEMY_SPAWN_WAVE_CLUSTER_RADIUS = 88;
  var ENEMY_SPAWN_SCREEN_EDGE_MARGIN = 12;
  var SPAWN_WARNING_EDGE_MARGIN = 28;
  var SPAWN_WARNING_EDGE_BRIGHTNESS_RANGE = 0.12;

  var MINEFIELD_SPAWN_INTERVAL_MIN = 14;
  var MINEFIELD_SPAWN_INTERVAL_MAX = 24;
  var MINEFIELD_SPAWN_INTERVAL_SCALE_PER_KM = 0.14;
  var MINEFIELD_SPAWN_INTERVAL_SCALE_MAX = 3.2;
  var MINEFIELD_SPAWN_INTERVAL_MIN_FLOOR = 8;
  var MINEFIELD_WARNING_DURATION = 4;
  var MINEFIELD_SPAWN_EXTRA_MARGIN = 320;
  var MINEFIELD_DROP_SCREEN_INSET_FACTOR = 0.1;
  var MINEFIELD_DROP_FALL_HEIGHT = 168;
  var MINEFIELD_DROP_FALL_DURATION = 0.9;
  var MINEFIELD_VERTICAL_SPREAD = 0.42;
  var MINEFIELD_CLUSTER_RADIUS = 130;
  var MINEFIELD_COUNT_MIN = 20;
  var MINEFIELD_COUNT_MAX = 36;
  var MINE_TRIGGER_RADIUS = 12;
  var MINE_DRAW_RADIUS = 8;
  var MINE_DAMAGE = 32;

  var ROCKET_STRIKE_SPAWN_INTERVAL_MIN = 16;
  var ROCKET_STRIKE_SPAWN_INTERVAL_MAX = 26;
  var ROCKET_STRIKE_SPAWN_INTERVAL_SCALE_PER_KM = 0.14;
  var ROCKET_STRIKE_SPAWN_INTERVAL_SCALE_MAX = 3.2;
  var ROCKET_STRIKE_SPAWN_INTERVAL_MIN_FLOOR = 8;
  var ROCKET_STRIKE_WARNING_DURATION = 4;
  var ROCKET_STRIKE_SCREEN_OFFSET_X_FACTOR = 0.16;
  var ROCKET_STRIKE_SCREEN_OFFSET_Y_FACTOR = 0.22;
  var ROCKET_STRIKE_RADIUS = 130;
  var ROCKET_STRIKE_DAMAGE = 38;
  var ROCKET_STRIKE_FALL_FROM_TOP = 96;

  var CRYSTAL_UNIT_COLLECT_PADDING = 8;
  var COLLECT_FLY_SPEED = 520;
  var COLLECT_FLY_ARRIVE_DISTANCE = 14;

  var DUST_VEL_X_MIN = 72;
  var DUST_VEL_X_MAX = 118;

  var FLOOR_TILE_SIZE = 128;
  var FLOOR_CHUNK_WIDTH = 640;

  var DUST_PARTICLE_MAX = 140;
  var WHEEL_DUST_MIN_SPEED = 40;
  var WHEEL_DUST_SPEED_DIVISOR = 120;
  var WHEEL_DUST_SPAWN_SKIP = 2;

  var UNIT_SWAY_TRUCK = 2.8;
  var UNIT_SWAY_CAR_MIN = 4.5;
  var UNIT_SWAY_CAR_MAX = 8;
  var UNIT_SWAY_ENEMY_MIN = 1.8;
  var UNIT_SWAY_ENEMY_MAX = 3.2;
  var UNIT_SWAY_CATCH_UP = 0.12;
  var UNIT_SWAY_ENEMY_TILT = 0.028;
  var UNIT_SWAY_FRIENDLY_TILT = 0.05;

  var UNIT_COLLISION_PADDING = 4;
  var UNIT_FOLLOW_STANDOFF_PADDING = 6;
  var COMBAT_FOLLOW_RANGE_FACTOR = 0.5;
  var UNIT_SEPARATION_SMOOTH = 0.38;
  var UNIT_SEPARATION_PASS_COUNT = 4;
  var UNIT_SEPARATION_MAX_PER_STEP = 12;
  var UNIT_MOVE_OVERLAP_EPSILON = 0.05;
  var UNIT_MOVE_PUSH_SMOOTH = 0.72;
  var UNIT_PUSH_MAX_PER_FRAME = 26;
  var UNIT_PUSH_TRANSFER_STRENGTH = 0.82;
  var UNIT_PUSH_RADIAL_STRENGTH = 0.42;
  var SELECTED_UNIT_PUSH_STRENGTH_FACTOR = 1.35;
  var TRUCK_PUSH_STRENGTH_FACTOR = 3.2;
  var TRUCK_PUSH_MAX_PER_FRAME = 52;
  var UNIT_DEFLECTION_PUSH_STRENGTH = 0.88;
  var UNIT_DEFLECTION_PUSH_MIN = 6;
  var UNIT_MOVE_PUSH_ATTEMPTS = 2;

  var KEYBOARD_WORLD_MARGIN_Y_FACTOR = 0.44;
  var KEYBOARD_WORLD_MARGIN_X_FACTOR = 0.44;
  var KEYBOARD_DIAGONAL_SCALE = 0.70710678;
  var KEYBOARD_DRIVE_LOOKAHEAD_CAR = 18;
  var KEYBOARD_DRIVE_LOOKAHEAD_TRUCK = 24;

  var CAMERA_FOLLOW_SMOOTH_SPEED_X = 4.2;
  var CAMERA_FOLLOW_SMOOTH_SPEED_Y = 3.2;
  var CAMERA_FOLLOW_LAG_SECONDS = 0.16;
  var CAMERA_VELOCITY_SMOOTH_SPEED = 11;
  var CAMERA_TRUCK_SCREEN_MARGIN_X_FACTOR = 0.12;
  var CAMERA_TRUCK_SCREEN_MARGIN_Y_FACTOR = 0.14;

  var TRUCK_AUTO_EVADE_LOOKAHEAD = 88;
  var TRUCK_AUTO_EVADE_WORLD_MARGIN_Y_FACTOR = 0.38;

  var ESCORT_DEFENSE_SPAWN_CHANCE = 0.75;
  var ESCORT_SPAWN_RADIUS_MIN = 120;
  var ESCORT_SPAWN_RADIUS_MAX = 280;
  var ESCORT_SPAWN_ATTEMPTS = 24;

  var TRAJECTORY_FRIENDLY_LINE = "rgba(100, 170, 255, 0.22)";
  var TRAJECTORY_FRIENDLY_DEST = "rgba(100, 170, 255, 0.32)";
  var TRAJECTORY_ENEMY_LINE = "rgba(255, 140, 90, 0.22)";
  var TRAJECTORY_ENEMY_DEST = "rgba(255, 140, 90, 0.32)";
  var TRAJECTORY_SELECTED_LINE = "rgba(100, 170, 255, 0.45)";
  var TRAJECTORY_SELECTED_DEST = "rgba(100, 170, 255, 0.65)";

  var canvas = document.getElementById("gameCanvas");
  var context = canvas.getContext("2d");
  var gameRoot = document.getElementById("gameRoot");
  var selectionRing = document.getElementById("selectionRing");
  var truckDamageVignette = document.getElementById("truckDamageVignette");
  var hudTop = document.getElementById("hudTop");
  var hudDistance = document.getElementById("hudDistance");
  var hudBest = document.getElementById("hudBest");
  var gameScreen = document.getElementById("gameScreen");
  var screenTitle = document.getElementById("screenTitle");
  var gameOverScore = document.getElementById("gameOverScore");
  var controlHint = document.getElementById("controlHint");

  var width = 0;
  var height = 0;
  var devicePixelRatioScale = 1;

  var gamePhase = PHASE_START;
  var distanceTraveled = 0;
  var crystalCount = 0;
  var highScore = 0;
  var scrollSpeed = SCROLL_SPEED_BASE;

  var cameraX = 0;
  var cameraY = 0;
  var scrollCameraX = 0;
  var truckCameraPreviousX = 0;
  var truckCameraPreviousY = 0;
  var truckCameraVelocityX = 0;
  var truckCameraVelocityY = 0;
  var truckPositionAfterScrollX = 0;
  var truckPositionAfterScrollY = 0;
  var mouseScreenX = 0;
  var mouseScreenY = 0;
  var mouseWorldX = 0;
  var mouseWorldY = 0;

  var selectedUnitId = -1;
  var keysDown = {
    w: false,
    a: false,
    s: false,
    d: false
  };
  var nextUnitId = 1;
  var nextProjectileId = 1;

  var truckUnit = null;
  var units = [];
  var cachedFriendlyUnits = [];
  var cachedEnemyUnits = [];
  var projectiles = [];
  var crystals = [];
  var debrisItems = [];
  var terrainCells = [];
  var terrainSpawnedCellKeys = {};
  var visualEffects = [];
  var dustParticles = [];
  var pendingSpawnWarnings = [];
  var pendingSpawnWaveAnchor = null;
  var mines = [];
  var pendingMinefieldWarning = null;
  var pendingRocketStrikeWarning = null;

  var gameTime = 0;
  var simulationFrameIndex = 0;
  var enemySpawnTimer = 2.5;
  var minefieldSpawnTimer = 11;
  var rocketStrikeSpawnTimer = 17;
  var enemyPathUpdateTimer = 0;
  var selectionRingRotateAngle = 0;

  function getSynth() {
    return window.WebExtrasGameSynthAudio;
  }

  var CRYSTAL_AUDIO_COUNT = 3;
  var CRYSTAL_AUDIO_FILES = [
    "ui-deep-collapse-crystal-01.wav",
    "ui-deep-collapse-crystal-02.wav",
    "ui-deep-collapse-crystal-03.wav"
  ];
  var CRYSTAL_AUDIO_PATHS = [
    "../../../../audio/ui-deep-collapse-crystal-01.wav",
    "../../../../audio/ui-deep-collapse-crystal-02.wav",
    "../../../../audio/ui-deep-collapse-crystal-03.wav"
  ];
  var crystalAudioElements = null;
  var pendingCrystalCollectSoundCount = 0;

  function getArcadeGamesOutputVolume() {
    if (window.WebExtrasGameAudioVolume && window.WebExtrasGameAudioVolume.getArcadeGamesOutputVolume) {
      return window.WebExtrasGameAudioVolume.getArcadeGamesOutputVolume();
    }
    return 0.5;
  }

  function getCrystalSoundPath(soundIndex) {
    if (window.WebExtrasGameUiAudioPaths && window.WebExtrasGameUiAudioPaths.getUiSoundPath) {
      return window.WebExtrasGameUiAudioPaths.getUiSoundPath(CRYSTAL_AUDIO_FILES[soundIndex]);
    }
    return CRYSTAL_AUDIO_PATHS[soundIndex];
  }

  function ensureCrystalAudio() {
    var soundIndex;
    var audioElement;
    if (crystalAudioElements) {
      return true;
    }
    crystalAudioElements = [];
    for (soundIndex = 0; soundIndex < CRYSTAL_AUDIO_COUNT; soundIndex += 1) {
      audioElement = new Audio(getCrystalSoundPath(soundIndex));
      audioElement.preload = "auto";
      crystalAudioElements.push(audioElement);
    }
    return true;
  }

  function getCrystalSoundVolume() {
    return getArcadeGamesOutputVolume();
  }

  function playCrystalSoundAtIndex(soundIndex, soundVolume) {
    var audio;
    var playPromise;
    if (!ensureCrystalAudio()) {
      return;
    }
    audio = crystalAudioElements[soundIndex].cloneNode();
    audio.volume = soundVolume;
    playPromise = audio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {});
    }
  }

  function playCrystalCollectSounds(collectCount) {
    var soundIndex;
    var randomIndex;
    var playIndex;
    var soundVolume;
    if (!collectCount || collectCount < 1) {
      return;
    }
    if (!ensureCrystalAudio()) {
      return;
    }
    if (collectCount >= CRYSTAL_AUDIO_COUNT) {
      soundVolume = getCrystalSoundVolume();
      for (soundIndex = 0; soundIndex < CRYSTAL_AUDIO_COUNT; soundIndex += 1) {
        playCrystalSoundAtIndex(soundIndex, soundVolume);
      }
      return;
    }
    soundVolume = getCrystalSoundVolume();
    for (playIndex = 0; playIndex < collectCount; playIndex += 1) {
      randomIndex = Math.floor(Math.random() * CRYSTAL_AUDIO_COUNT);
      playCrystalSoundAtIndex(randomIndex, soundVolume);
    }
  }

  function queueCrystalCollectSound() {
    pendingCrystalCollectSoundCount += 1;
  }

  function flushCrystalCollectSounds() {
    var collectCount;
    if (pendingCrystalCollectSoundCount < 1) {
      return;
    }
    collectCount = pendingCrystalCollectSoundCount;
    pendingCrystalCollectSoundCount = 0;
    playCrystalCollectSounds(collectCount);
  }

  function getLocaleApi() {
    if (window.WebLocale) {
      return window.WebLocale;
    }
    return null;
  }

  function getLocalized(key, fallback) {
    var api = getLocaleApi();
    if (api) {
      return api.get(key, fallback);
    }
    return fallback;
  }

  function getGameTitle() {
    return GAME_TITLE;
  }

  function focusGameRoot() {
    if (gameRoot && gameRoot.focus) {
      try {
        gameRoot.focus({ preventScroll: true });
      } catch (error) {
        gameRoot.focus();
      }
    }
  }

  function setGameInputMovementMode() {
    if (window.WebGameInput && window.WebGameInput.setInputMode) {
      window.WebGameInput.setInputMode("movement");
    }
  }

  function resetMovementKeys() {
    keysDown.w = false;
    keysDown.a = false;
    keysDown.s = false;
    keysDown.d = false;
  }

  function isMovementKeyCode(code) {
    return code === "KeyW" || code === "KeyA" || code === "KeyS" || code === "KeyD" ||
      code === "ArrowUp" || code === "ArrowDown" || code === "ArrowLeft" || code === "ArrowRight";
  }

  function setKeyFromCode(code, isDown) {
    if (code === "KeyW" || code === "ArrowUp") {
      keysDown.w = isDown;
    } else if (code === "KeyS" || code === "ArrowDown") {
      keysDown.s = isDown;
    } else if (code === "KeyA" || code === "ArrowLeft") {
      keysDown.a = isDown;
    } else if (code === "KeyD" || code === "ArrowRight") {
      keysDown.d = isDown;
    }
  }

  function isSelectedUnitKeyboardDriving() {
    if (!isPlaying() || selectedUnitId < 0) {
      return false;
    }
    return keysDown.w || keysDown.a || keysDown.s || keysDown.d;
  }

  function updateSelectedUnitKeyboardMove(deltaSeconds) {
    var unit;
    var moveX;
    var moveY;
    var moveLen;
    var dirX;
    var dirY;
    var leadDistance;
    var clampedDestination;
    if (!isSelectedUnitKeyboardDriving()) {
      return;
    }
    unit = getUnitById(selectedUnitId);
    if (!unit || unit.dead || unit.team !== "friendly") {
      return;
    }
    moveX = 0;
    moveY = 0;
    if (keysDown.w) {
      moveY -= 1;
    }
    if (keysDown.s) {
      moveY += 1;
    }
    if (keysDown.a) {
      moveX -= 1;
    }
    if (keysDown.d) {
      moveX += 1;
    }
    if (moveX !== 0 && moveY !== 0) {
      moveX *= KEYBOARD_DIAGONAL_SCALE;
      moveY *= KEYBOARD_DIAGONAL_SCALE;
    }
    moveLen = Math.sqrt(moveX * moveX + moveY * moveY);
    if (moveLen < 0.001) {
      return;
    }
    dirX = moveX / moveLen;
    dirY = moveY / moveLen;
    leadDistance = isUnitTruckKind(unit) ? KEYBOARD_DRIVE_LOOKAHEAD_TRUCK : KEYBOARD_DRIVE_LOOKAHEAD_CAR;
    if (isUnitTruckKind(unit)) {
      unit.hasTruckScreenDestination = false;
    }
    unit.destinationX = unit.x + dirX * leadDistance;
    unit.destinationY = unit.y + dirY * leadDistance;
    clampedDestination = clampFriendlyUnitMoveDestination(unit, unit.destinationX, unit.destinationY);
    unit.destinationX = clampedDestination.x;
    unit.destinationY = clampedDestination.y;
  }

  function setWorldDestinationForUnit(unit, screenX, screenY) {
    var worldPos;
    var clampedDestination;
    if (!unit) {
      return;
    }
    worldPos = screenToWorld(screenX, screenY);
    unit.hasTruckScreenDestination = false;
    clampedDestination = clampFriendlyUnitMoveDestination(unit, worldPos.x, worldPos.y);
    unit.destinationX = clampedDestination.x;
    unit.destinationY = clampedDestination.y;
  }

  function updateSelectedEscortHoldPosition() {
    var unit;
    var arriveDist;
    var distSq;
    unit = getSelectedEscortUnit();
    if (!unit || isSelectedUnitKeyboardDriving()) {
      return;
    }
    arriveDist = 5;
    distSq = distanceSquared(unit.x, unit.y, unit.destinationX, unit.destinationY);
    if (distSq > arriveDist * arriveDist) {
      return;
    }
    unit.hasTruckScreenDestination = false;
    unit.destinationX = unit.x;
    unit.destinationY = unit.y;
  }

  function setTruckPositionAfterScroll() {
    if (!truckUnit || truckUnit.dead) {
      truckPositionAfterScrollX = 0;
      truckPositionAfterScrollY = 0;
      return;
    }
    truckPositionAfterScrollX = truckUnit.x;
    truckPositionAfterScrollY = truckUnit.y;
  }

  function applyTruckMovementOffsetToSelectedEscort() {
    var truckDeltaX;
    var truckDeltaY;
    var unit;
    if (!truckUnit || truckUnit.dead) {
      return;
    }
    unit = getSelectedEscortUnit();
    if (!unit) {
      return;
    }
    if (shouldTruckFollowSelectedEscortNow()) {
      return;
    }
    truckDeltaX = truckUnit.x - truckPositionAfterScrollX;
    truckDeltaY = truckUnit.y - truckPositionAfterScrollY;
    if (truckDeltaX === 0 && truckDeltaY === 0) {
      return;
    }
    unit.x += truckDeltaX;
    unit.y += truckDeltaY;
    unit.destinationX += truckDeltaX;
    unit.destinationY += truckDeltaY;
  }

  function onKeyDown(event) {
    if (!isMovementKeyCode(event.code)) {
      return;
    }
    event.preventDefault();
    if (!isPlaying()) {
      return;
    }
    if (getSynth()) {
      getSynth().ensureContext();
    }
    setKeyFromCode(event.code, true);
  }

  function onKeyUp(event) {
    if (!isMovementKeyCode(event.code)) {
      return;
    }
    event.preventDefault();
    setKeyFromCode(event.code, false);
  }

  function onWindowBlur() {
    resetMovementKeys();
  }

  function isPlaying() {
    return gamePhase === PHASE_PLAYING;
  }

  function isStart() {
    return gamePhase === PHASE_START;
  }

  function isGameOver() {
    return gamePhase === PHASE_GAME_OVER;
  }

  function clamp(value, minValue, maxValue) {
    if (value < minValue) {
      return minValue;
    }
    if (value > maxValue) {
      return maxValue;
    }
    return value;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function normalizeAngle(angle) {
    var result = angle % TWO_PI;
    if (result < 0) {
      result += TWO_PI;
    }
    return result;
  }

  function angleDifference(fromAngle, toAngle) {
    var delta = normalizeAngle(toAngle - fromAngle);
    if (delta > Math.PI) {
      delta -= TWO_PI;
    }
    return delta;
  }

  function randomRange(minValue, maxValue) {
    return minValue + Math.random() * (maxValue - minValue);
  }

  function randomSign() {
    return Math.random() < 0.5 ? -1 : 1;
  }

  function distanceSquared(xA, yA, xB, yB) {
    var deltaX = xB - xA;
    var deltaY = yB - yA;
    return deltaX * deltaX + deltaY * deltaY;
  }

  function getRunDistance() {
    return Math.floor(distanceTraveled);
  }

  function isUnitTruckKind(unit) {
    return unit.kind === UNIT_TRUCK || unit.kind === UNIT_BOSS_TRUCK;
  }

  function isUnitCarKind(unit) {
    if (!unit || unit.dead || isUnitTruckKind(unit)) {
      return false;
    }
    return unit.kind === UNIT_ESCORT || unit.kind === UNIT_ENEMY;
  }

  function shouldSkipUnitPairCarCollision(unit, other) {
    return isUnitCarKind(unit) && isUnitCarKind(other);
  }

  function isSelectedFriendlyCar() {
    var unit = getUnitById(selectedUnitId);
    if (!unit || unit.dead || unit.team !== "friendly") {
      return false;
    }
    return unit.kind !== UNIT_TRUCK;
  }

  function getSelectedEscortUnit() {
    var unit;
    if (selectedUnitId < 0) {
      return null;
    }
    unit = getUnitById(selectedUnitId);
    if (!unit || unit.dead || unit.team !== "friendly" || unit.kind !== UNIT_ESCORT) {
      return null;
    }
    return unit;
  }

  function getCameraFollowUnit() {
    var unit;
    if (selectedUnitId >= 0) {
      unit = getUnitById(selectedUnitId);
      if (unit && !unit.dead && unit.team === "friendly") {
        return unit;
      }
    }
    if (truckUnit && !truckUnit.dead) {
      return truckUnit;
    }
    return null;
  }

  function isTruckSelected() {
    return truckUnit && !truckUnit.dead && selectedUnitId === truckUnit.id;
  }

  function getEnemySpawnVerticalCenterY() {
    if (isSelectedFriendlyCar()) {
      return cameraY;
    }
    if (truckUnit && !truckUnit.dead) {
      return truckUnit.y;
    }
    return cameraY;
  }

  function getTruckPathHalfWidth() {
    if (!truckUnit || truckUnit.dead) {
      return TRUCK_WIDTH * 0.55 + TRUCK_PATH_HALF_WIDTH_PADDING;
    }
    return getUnitCollisionRadius(truckUnit) + TRUCK_PATH_HALF_WIDTH_PADDING;
  }

  function getFriendlyDefenseTeamWorldYBounds() {
    var escort;
    var escortCount = 0;
    var escortIndex;
    var maxY = 0;
    var minY = 0;
    for (escortIndex = 0; escortIndex < units.length; escortIndex += 1) {
      escort = units[escortIndex];
      if (escort.dead || escort.team !== "friendly" || escort.kind !== UNIT_ESCORT) {
        continue;
      }
      if (escort.combatMode !== COMBAT_MODE_DEFENSE) {
        continue;
      }
      if (escortCount === 0) {
        minY = escort.y;
        maxY = escort.y;
      } else {
        if (escort.y < minY) {
          minY = escort.y;
        }
        if (escort.y > maxY) {
          maxY = escort.y;
        }
      }
      escortCount += 1;
    }
    return {
      minY: minY,
      maxY: maxY,
      count: escortCount
    };
  }

  function getTruckPathCorridorYBounds() {
    var teamBounds;
    var maxY;
    var minY;
    if (!truckUnit || truckUnit.dead) {
      return null;
    }
    minY = truckUnit.y;
    maxY = truckUnit.y;
    teamBounds = getFriendlyDefenseTeamWorldYBounds();
    if (teamBounds.count > 0) {
      if (teamBounds.minY < minY) {
        minY = teamBounds.minY;
      }
      if (teamBounds.maxY > maxY) {
        maxY = teamBounds.maxY;
      }
    }
    return {
      minY: minY,
      maxY: maxY
    };
  }

  function isHazardOnTruckPath(hazardX, hazardY, hazardRadius) {
    var corridor;
    var deltaX;
    var hazardMaxY;
    var hazardMinY;
    var pathHalfWidth;
    if (!truckUnit || truckUnit.dead) {
      return false;
    }
    pathHalfWidth = getTruckPathHalfWidth();
    deltaX = hazardX - truckUnit.x;
    if (deltaX < -pathHalfWidth - hazardRadius) {
      return false;
    }
    if (deltaX > TRUCK_PATH_FORWARD_RANGE + hazardRadius) {
      return false;
    }
    corridor = getTruckPathCorridorYBounds();
    if (!corridor) {
      return false;
    }
    hazardMinY = hazardY - hazardRadius;
    hazardMaxY = hazardY + hazardRadius;
    if (hazardMaxY < corridor.minY - pathHalfWidth) {
      return false;
    }
    if (hazardMinY > corridor.maxY + pathHalfWidth) {
      return false;
    }
    return true;
  }

  function getAverageOnScreenMineHazardWorldY() {
    var mineIndex;
    var mine;
    var sumY;
    var count;
    if (!truckUnit || truckUnit.dead) {
      return null;
    }
    sumY = 0;
    count = 0;
    for (mineIndex = 0; mineIndex < mines.length; mineIndex += 1) {
      mine = mines[mineIndex];
      if (!mine.active || mine.falling) {
        continue;
      }
      if (!isHazardOnTruckPath(mine.x, mine.y, MINE_TRIGGER_RADIUS)) {
        continue;
      }
      if (!isWorldPositionOnScreen(mine.x, mine.y)) {
        continue;
      }
      sumY += mine.y;
      count += 1;
    }
    if (count === 0) {
      return null;
    }
    return sumY / count;
  }

  function trySetNearestTruckHazardWorldY(hazardX, hazardY, hazardRadius, bestDistSqRef) {
    var distSq;
    if (!isHazardOnTruckPath(hazardX, hazardY, hazardRadius)) {
      return bestDistSqRef;
    }
    distSq = distanceSquared(truckUnit.x, truckUnit.y, hazardX, hazardY);
    if (distSq < bestDistSqRef.value) {
      bestDistSqRef.value = distSq;
      bestDistSqRef.hazardY = hazardY;
    }
    return bestDistSqRef;
  }

  function getActiveTruckHazardWorldY() {
    var bestDistSqRef;
    var impactPos;
    var mineAverageY;
    var mineSpawnPos;
    var mineWarningActive;
    var rocketActive;
    var spawnIndex;
    var spawnPos;
    var spawnWarning;
    var spawnWarningActive;
    if (!truckUnit || truckUnit.dead) {
      return null;
    }
    bestDistSqRef = {
      value: 999999999,
      hazardY: null
    };
    rocketActive = pendingRocketStrikeWarning
      && rocketStrikeSpawnTimer > 0
      && rocketStrikeSpawnTimer <= ROCKET_STRIKE_WARNING_DURATION;
    mineWarningActive = pendingMinefieldWarning && !pendingMinefieldWarning.dropStarted;
    spawnWarningActive = enemySpawnTimer > 0 && enemySpawnTimer <= ENEMY_SPAWN_WARNING_DURATION;
    if (rocketActive) {
      impactPos = getRocketStrikeImpactWorldPosition();
      trySetNearestTruckHazardWorldY(impactPos.x, impactPos.y, ROCKET_STRIKE_RADIUS, bestDistSqRef);
    }
    if (mineWarningActive) {
      mineSpawnPos = getMinefieldSpawnWorldPosition();
      trySetNearestTruckHazardWorldY(
        mineSpawnPos.x,
        pendingMinefieldWarning.worldCenterY,
        MINEFIELD_CLUSTER_RADIUS,
        bestDistSqRef
      );
    }
    if (spawnWarningActive) {
      for (spawnIndex = 0; spawnIndex < pendingSpawnWarnings.length; spawnIndex += 1) {
        spawnWarning = pendingSpawnWarnings[spawnIndex];
        spawnPos = getPendingWarningWorldPosition(spawnWarning);
        trySetNearestTruckHazardWorldY(spawnPos.x, spawnPos.y, ENEMY_SPAWN_HAZARD_RADIUS, bestDistSqRef);
      }
    }
    mineAverageY = getAverageOnScreenMineHazardWorldY();
    if (mineAverageY != null) {
      trySetNearestTruckHazardWorldY(truckUnit.x, mineAverageY, MINE_TRIGGER_RADIUS, bestDistSqRef);
    }
    return bestDistSqRef.hazardY;
  }

  function getTruckEvadeSteerDirection(hazardY, teamBounds) {
    var steerDirection;
    var targetY;
    var teamCenterY;
    if (truckUnit.y > hazardY) {
      steerDirection = 1;
    } else if (truckUnit.y < hazardY) {
      steerDirection = -1;
    } else {
      steerDirection = truckUnit.y >= cameraY ? 1 : -1;
    }
    if (teamBounds.count <= 0) {
      return steerDirection;
    }
    teamCenterY = (teamBounds.minY + teamBounds.maxY) * 0.5;
    if (hazardY >= teamBounds.minY && hazardY <= teamBounds.maxY) {
      if (teamCenterY >= hazardY) {
        steerDirection = 1;
      } else {
        steerDirection = -1;
      }
      return steerDirection;
    }
    targetY = truckUnit.y + steerDirection * TRUCK_AUTO_EVADE_LOOKAHEAD;
    if (targetY < teamBounds.minY) {
      steerDirection = 1;
    } else if (targetY > teamBounds.maxY) {
      steerDirection = -1;
    }
    return steerDirection;
  }

  function setTruckHoldLaneDestination() {
    if (!truckUnit || truckUnit.dead) {
      return;
    }
    truckUnit.hasTruckScreenDestination = false;
    truckUnit.destinationX = truckUnit.x;
    truckUnit.destinationY = truckUnit.y;
  }

  function restoreEscortGuardFollow(unit) {
    if (!unit || unit.dead || unit.kind !== UNIT_ESCORT) {
      return;
    }
    setTruckScreenDestinationFromWorld(unit, unit.x, unit.y);
  }

  function beginEscortPlayerControl(unit) {
    if (!unit || unit.dead || unit.kind !== UNIT_ESCORT) {
      return;
    }
    unit.hasTruckScreenDestination = false;
    unit.destinationX = unit.x;
    unit.destinationY = unit.y;
  }

  function shouldTruckFollowSelectedEscort(escort) {
    var absDeltaX;
    var absDeltaY;
    var separationX;
    var separationY;
    if (!escort || !truckUnit || truckUnit.dead) {
      return false;
    }
    if (width <= 0 || height <= 0) {
      return false;
    }
    absDeltaX = Math.abs(escort.x - truckUnit.x);
    absDeltaY = Math.abs(escort.y - truckUnit.y);
    separationX = width * TRUCK_FOLLOW_ESCORT_SEPARATION_SCREEN_X_FACTOR;
    separationY = height * TRUCK_FOLLOW_ESCORT_SEPARATION_SCREEN_Y_FACTOR;
    if (absDeltaX >= separationX) {
      return true;
    }
    if (absDeltaY >= separationY) {
      return true;
    }
    return false;
  }

  function shouldTruckFollowSelectedEscortNow() {
    var escort;
    if (!truckUnit || truckUnit.dead || !isPlaying() || isTruckSelected()) {
      return false;
    }
    escort = getSelectedEscortUnit();
    if (!escort) {
      return false;
    }
    return shouldTruckFollowSelectedEscort(escort);
  }

  function updateTruckFollowSelectedEscort() {
    var escort;
    if (!shouldTruckFollowSelectedEscortNow()) {
      return false;
    }
    escort = getSelectedEscortUnit();
    truckUnit.destinationX = escort.x;
    truckUnit.destinationY = escort.y;
    return true;
  }

  function updateTruckAutoEvade(deltaSeconds) {
    var hazardY;
    var steerDirection;
    var teamBounds;
    var worldMarginY;
    if (!truckUnit || truckUnit.dead || !isPlaying()) {
      return;
    }
    if (isTruckSelected()) {
      return;
    }
    hazardY = getActiveTruckHazardWorldY();
    if (hazardY != null) {
      teamBounds = getFriendlyDefenseTeamWorldYBounds();
      steerDirection = getTruckEvadeSteerDirection(hazardY, teamBounds);
      truckUnit.destinationX = truckUnit.x;
      truckUnit.destinationY = truckUnit.y + steerDirection * TRUCK_AUTO_EVADE_LOOKAHEAD;
      worldMarginY = height * TRUCK_AUTO_EVADE_WORLD_MARGIN_Y_FACTOR;
      truckUnit.destinationY = clamp(truckUnit.destinationY, cameraY - worldMarginY, cameraY + worldMarginY);
      if (teamBounds.count > 0) {
        if (truckUnit.destinationY < teamBounds.minY) {
          truckUnit.destinationY = teamBounds.minY;
        } else if (truckUnit.destinationY > teamBounds.maxY) {
          truckUnit.destinationY = teamBounds.maxY;
        }
      }
      return;
    }
    if (updateTruckFollowSelectedEscort()) {
      return;
    }
    if (shouldTruckApplyPlayerMoveDestination()) {
      applyTruckScreenDestinationToUnit(truckUnit);
      return;
    }
    setTruckHoldLaneDestination();
  }

  function resetTruckCameraFollowState() {
    var followUnit;
    followUnit = getCameraFollowUnit();
    if (!followUnit) {
      truckCameraPreviousX = cameraX;
      truckCameraPreviousY = cameraY;
      truckCameraVelocityX = 0;
      truckCameraVelocityY = 0;
      return;
    }
    truckCameraPreviousX = followUnit.x;
    truckCameraPreviousY = followUnit.y;
    truckCameraVelocityX = scrollSpeed;
    truckCameraVelocityY = 0;
  }

  function updateTruckCameraVelocity(deltaSeconds) {
    var followUnit;
    var instantVelocityX;
    var instantVelocityY;
    var velocitySmoothFactor;
    followUnit = getCameraFollowUnit();
    if (!followUnit || deltaSeconds <= 0) {
      return;
    }
    instantVelocityX = (followUnit.x - truckCameraPreviousX) / deltaSeconds;
    instantVelocityY = (followUnit.y - truckCameraPreviousY) / deltaSeconds;
    truckCameraPreviousX = followUnit.x;
    truckCameraPreviousY = followUnit.y;
    velocitySmoothFactor = getCameraFollowSmoothFactor(CAMERA_VELOCITY_SMOOTH_SPEED, deltaSeconds);
    truckCameraVelocityX += (instantVelocityX - truckCameraVelocityX) * velocitySmoothFactor;
    truckCameraVelocityY += (instantVelocityY - truckCameraVelocityY) * velocitySmoothFactor;
  }

  function getCameraTargetPosition() {
    var followUnit;
    followUnit = getCameraFollowUnit();
    if (!followUnit) {
      return { x: cameraX, y: cameraY };
    }
    return {
      x: followUnit.x - truckCameraVelocityX * CAMERA_FOLLOW_LAG_SECONDS,
      y: followUnit.y - truckCameraVelocityY * CAMERA_FOLLOW_LAG_SECONDS
    };
  }

  function getSelectedEscortWorldMoveBounds() {
    var escort;
    var marginX;
    var marginY;
    var maxSpanX;
    var maxSpanY;
    var unitRadius;
    var minX;
    var maxX;
    var minY;
    var maxY;
    var screenMinX;
    var screenMaxX;
    var screenMinY;
    var screenMaxY;
    escort = getSelectedEscortUnit();
    if (!escort || !truckUnit || truckUnit.dead) {
      return null;
    }
    marginX = width * CAMERA_TRUCK_SCREEN_MARGIN_X_FACTOR;
    marginY = height * CAMERA_TRUCK_SCREEN_MARGIN_Y_FACTOR;
    unitRadius = getUnitCollisionRadius(escort);
    maxSpanX = width - marginX * 2 - unitRadius * 2;
    maxSpanY = height - marginY * 2 - unitRadius * 2;
    if (maxSpanX < 0) {
      maxSpanX = 0;
    }
    if (maxSpanY < 0) {
      maxSpanY = 0;
    }
    minX = truckUnit.x - maxSpanX;
    maxX = truckUnit.x + maxSpanX;
    minY = truckUnit.y - maxSpanY;
    maxY = truckUnit.y + maxSpanY;
    screenMinX = cameraX - width * 0.5 + marginX + unitRadius;
    screenMaxX = cameraX + width * 0.5 - marginX - unitRadius;
    screenMinY = cameraY - height * 0.5 + marginY + unitRadius;
    screenMaxY = cameraY + height * 0.5 - marginY - unitRadius;
    if (minX < screenMinX) {
      minX = screenMinX;
    }
    if (maxX > screenMaxX) {
      maxX = screenMaxX;
    }
    if (minY < screenMinY) {
      minY = screenMinY;
    }
    if (maxY > screenMaxY) {
      maxY = screenMaxY;
    }
    if (minX > maxX) {
      minX = (minX + maxX) * 0.5;
      maxX = minX;
    }
    if (minY > maxY) {
      minY = (minY + maxY) * 0.5;
      maxY = minY;
    }
    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
  }

  function clampFriendlyUnitMoveDestination(unit, destX, destY) {
    var bounds;
    var worldMarginY;
    var worldMarginX;
    if (unit && unit.kind === UNIT_ESCORT && unit.id === selectedUnitId) {
      bounds = getSelectedEscortWorldMoveBounds();
      if (bounds) {
        return {
          x: clamp(destX, bounds.minX, bounds.maxX),
          y: clamp(destY, bounds.minY, bounds.maxY)
        };
      }
    }
    worldMarginY = height * KEYBOARD_WORLD_MARGIN_Y_FACTOR;
    worldMarginX = width * KEYBOARD_WORLD_MARGIN_X_FACTOR;
    return {
      x: clamp(destX, cameraX - worldMarginX, cameraX + worldMarginX),
      y: clamp(destY, cameraY - worldMarginY, cameraY + worldMarginY)
    };
  }

  function clampSelectedEscortWorldPosition(unit) {
    var bounds;
    if (!unit || unit.kind !== UNIT_ESCORT || unit.id !== selectedUnitId) {
      return;
    }
    bounds = getSelectedEscortWorldMoveBounds();
    if (!bounds) {
      return;
    }
    unit.x = clamp(unit.x, bounds.minX, bounds.maxX);
    unit.y = clamp(unit.y, bounds.minY, bounds.maxY);
    unit.destinationX = clamp(unit.destinationX, bounds.minX, bounds.maxX);
    unit.destinationY = clamp(unit.destinationY, bounds.minY, bounds.maxY);
  }

  function clampCameraTargetToKeepTruckOnScreen(targetX, targetY) {
    var escort;
    var followUnit;
    var marginX;
    var marginY;
    var minCameraX;
    var maxCameraX;
    var minCameraY;
    var maxCameraY;
    escort = getSelectedEscortUnit();
    if (escort && truckUnit && !truckUnit.dead) {
      marginX = width * CAMERA_TRUCK_SCREEN_MARGIN_X_FACTOR;
      marginY = height * CAMERA_TRUCK_SCREEN_MARGIN_Y_FACTOR;
      minCameraX = truckUnit.x - width * 0.5 + marginX;
      if (escort.x - width * 0.5 + marginX > minCameraX) {
        minCameraX = escort.x - width * 0.5 + marginX;
      }
      maxCameraX = truckUnit.x + width * 0.5 - marginX;
      if (escort.x + width * 0.5 - marginX < maxCameraX) {
        maxCameraX = escort.x + width * 0.5 - marginX;
      }
      minCameraY = truckUnit.y - height * 0.5 + marginY;
      if (escort.y - height * 0.5 + marginY > minCameraY) {
        minCameraY = escort.y - height * 0.5 + marginY;
      }
      maxCameraY = truckUnit.y + height * 0.5 - marginY;
      if (escort.y + height * 0.5 - marginY < maxCameraY) {
        maxCameraY = escort.y + height * 0.5 - marginY;
      }
      if (minCameraX > maxCameraX) {
        targetX = (minCameraX + maxCameraX) * 0.5;
      } else {
        targetX = clamp(targetX, minCameraX, maxCameraX);
      }
      if (minCameraY > maxCameraY) {
        targetY = (minCameraY + maxCameraY) * 0.5;
      } else {
        targetY = clamp(targetY, minCameraY, maxCameraY);
      }
      return { x: targetX, y: targetY };
    }
    followUnit = getCameraFollowUnit();
    if (!followUnit) {
      return { x: targetX, y: targetY };
    }
    marginX = width * CAMERA_TRUCK_SCREEN_MARGIN_X_FACTOR;
    marginY = height * CAMERA_TRUCK_SCREEN_MARGIN_Y_FACTOR;
    minCameraX = followUnit.x - width * 0.5 + marginX;
    maxCameraX = followUnit.x + width * 0.5 - marginX;
    minCameraY = followUnit.y - height * 0.5 + marginY;
    maxCameraY = followUnit.y + height * 0.5 - marginY;
    if (minCameraX > maxCameraX) {
      targetX = followUnit.x;
    } else {
      targetX = clamp(targetX, minCameraX, maxCameraX);
    }
    if (minCameraY > maxCameraY) {
      targetY = followUnit.y;
    } else {
      targetY = clamp(targetY, minCameraY, maxCameraY);
    }
    return { x: targetX, y: targetY };
  }

  function getDistanceEconomyScale() {
    return 1 + (distanceTraveled / ECONOMY_KM_STEP) * ECONOMY_SCALE_PER_KM;
  }

  function getEscortSpawnCost() {
    return Math.floor(ESCORT_SPAWN_COST_BASE * getDistanceEconomyScale());
  }

  function getEnemyTruckSpawnChance() {
    var chance;
    chance = ENEMY_TRUCK_SPAWN_CHANCE_BASE
      + (distanceTraveled / ECONOMY_KM_STEP) * ENEMY_TRUCK_SPAWN_CHANCE_SCALE_PER_KM;
    if (chance > ENEMY_TRUCK_SPAWN_CHANCE_MAX) {
      return ENEMY_TRUCK_SPAWN_CHANCE_MAX;
    }
    return chance;
  }

  function getScaledHazardSpawnInterval(intervalMin, intervalMax, scalePerKm, scaleMax, intervalMinFloor) {
    var scale;
    var scaledMin;
    var scaledMax;
    scale = 1 + (distanceTraveled / ECONOMY_KM_STEP) * scalePerKm;
    if (scale > scaleMax) {
      scale = scaleMax;
    }
    scaledMin = intervalMin / scale;
    scaledMax = intervalMax / scale;
    if (scaledMin < intervalMinFloor) {
      scaledMin = intervalMinFloor;
    }
    if (scaledMax < scaledMin + 2) {
      scaledMax = scaledMin + 2;
    }
    return randomRange(scaledMin, scaledMax);
  }

  function getMinefieldSpawnInterval() {
    return getScaledHazardSpawnInterval(
      MINEFIELD_SPAWN_INTERVAL_MIN,
      MINEFIELD_SPAWN_INTERVAL_MAX,
      MINEFIELD_SPAWN_INTERVAL_SCALE_PER_KM,
      MINEFIELD_SPAWN_INTERVAL_SCALE_MAX,
      MINEFIELD_SPAWN_INTERVAL_MIN_FLOOR
    );
  }

  function getRocketStrikeSpawnInterval() {
    return getScaledHazardSpawnInterval(
      ROCKET_STRIKE_SPAWN_INTERVAL_MIN,
      ROCKET_STRIKE_SPAWN_INTERVAL_MAX,
      ROCKET_STRIKE_SPAWN_INTERVAL_SCALE_PER_KM,
      ROCKET_STRIKE_SPAWN_INTERVAL_SCALE_MAX,
      ROCKET_STRIKE_SPAWN_INTERVAL_MIN_FLOOR
    );
  }

  function getUnitStarCrystalDropFactor(unit) {
    if (!isUnitStarProgressUnit(unit) || unit.starCount <= 0) {
      return 1;
    }
    return 1 + UNIT_STAR_CRYSTAL_DROP_BONUS * unit.starCount;
  }

  function getScaledCrystalDropCount(baseDrop, spread, unit) {
    var dropCount;
    var spreadRoll;
    spreadRoll = Math.floor(Math.random() * (spread * 2 + 1)) - spread;
    dropCount = baseDrop + spreadRoll;
    dropCount = Math.floor(dropCount * getUnitStarCrystalDropFactor(unit));
    if (dropCount < 1) {
      dropCount = 1;
    }
    return dropCount;
  }

  function getBossCrystalDropCount(unit) {
    return getScaledCrystalDropCount(BOSS_CRYSTAL_DROP_BASE, BOSS_CRYSTAL_DROP_SPREAD, unit);
  }

  function getEnemyCrystalDropCount(unit) {
    return getScaledCrystalDropCount(ENEMY_CRYSTAL_DROP_BASE, ENEMY_CRYSTAL_DROP_SPREAD, unit);
  }

  function createTurret(localX, localY, wobbleAmount, turretType) {
    var resolvedType = turretType;
    var initialFireCooldown;
    if (!resolvedType) {
      resolvedType = TURRET_TYPE_BALLISTIC;
    }
    if (resolvedType === TURRET_TYPE_LASER || resolvedType === TURRET_TYPE_HEAL) {
      initialFireCooldown = 0;
    } else {
      initialFireCooldown = randomRange(0, TURRET_FIRE_COOLDOWN);
    }
    return {
      localX: localX,
      localY: localY,
      type: resolvedType,
      angle: Math.random() * TWO_PI,
      wobbleSpeed: randomRange(0.25, 0.65) * randomSign(),
      wobbleAmount: wobbleAmount,
      fireCooldown: initialFireCooldown
    };
  }

  function rollCarTurretType() {
    if (Math.random() < LASER_TURRET_SPAWN_CHANCE) {
      return TURRET_TYPE_LASER;
    }
    if (Math.random() < HEAL_TURRET_SPAWN_CHANCE) {
      return TURRET_TYPE_HEAL;
    }
    return TURRET_TYPE_BALLISTIC;
  }

  function unitHasHealTurret(unit) {
    var turretIndex;
    var turret;
    for (turretIndex = 0; turretIndex < unit.turrets.length; turretIndex += 1) {
      turret = unit.turrets[turretIndex];
      if (turret.type === TURRET_TYPE_HEAL) {
        return true;
      }
    }
    return false;
  }

  function setEscortCombatModeFromTurrets(unit) {
    if (!unit || unit.kind !== UNIT_ESCORT) {
      return;
    }
    if (unitHasHealTurret(unit)) {
      unit.combatMode = COMBAT_MODE_DEFENSE;
    }
  }

  function isBeamTurretType(turret) {
    return turret.type === TURRET_TYPE_LASER || turret.type === TURRET_TYPE_HEAL;
  }

  function getDrawCarTurretBarrelLength(turret) {
    if (isBeamTurretType(turret)) {
      return 16;
    }
    return 14;
  }

  function getDrawTruckTurretBarrelLength(turret) {
    if (isBeamTurretType(turret)) {
      return 20;
    }
    return 18;
  }

  function createCarTurret() {
    return createTurret(0, 0, 0.12, rollCarTurretType());
  }

  function createTruckUnit(worldX, worldY) {
    var unit = {
      id: nextUnitId,
      kind: UNIT_TRUCK,
      team: "friendly",
      x: worldX,
      y: worldY,
      angle: UNIT_FACE_ANGLE,
      health: TRUCK_HEALTH,
      maxHealth: TRUCK_HEALTH,
      destinationX: worldX,
      destinationY: worldY,
      moveSpeed: TRUCK_MOVE_SPEED,
      length: TRUCK_LENGTH,
      width: TRUCK_WIDTH,
      radius: TRUCK_WIDTH * 0.55,
      turrets: [
        createTurret(TRUCK_LENGTH * 0.22, 0, TRUCK_TURRET_WOBBLE, rollCarTurretType()),
        createTurret(-TRUCK_LENGTH * 0.14, 0, TRUCK_TURRET_WOBBLE, rollCarTurretType()),
        createTurret(-TRUCK_LENGTH * 0.32, 0, TRUCK_TURRET_WOBBLE, rollCarTurretType())
      ],
      swayPhase: Math.random() * TWO_PI,
      swaySpeed: randomRange(0.9, 1.4),
      swayAmount: UNIT_SWAY_TRUCK,
      hitFlash: 0,
      dead: false,
      isWreck: false,
      wreckFireTime: 0,
      lastAttackerUnitId: -1
    };
    initUnitStarProgressFields(unit);
    initTruckScreenDestinationFields(unit);
    nextUnitId += 1;
    return unit;
  }

  function createBossTruckUnit(worldX, worldY) {
    var unit = {
      id: nextUnitId,
      kind: UNIT_BOSS_TRUCK,
      team: "enemy",
      x: worldX,
      y: worldY,
      angle: UNIT_FACE_ANGLE,
      health: BOSS_TRUCK_HEALTH,
      maxHealth: BOSS_TRUCK_HEALTH,
      destinationX: worldX,
      destinationY: worldY,
      moveSpeed: BOSS_TRUCK_MOVE_SPEED,
      length: TRUCK_LENGTH,
      width: TRUCK_WIDTH,
      radius: TRUCK_WIDTH * 0.55,
      turrets: [
        createTurret(TRUCK_LENGTH * 0.22, 0, TRUCK_TURRET_WOBBLE, rollCarTurretType()),
        createTurret(-TRUCK_LENGTH * 0.14, 0, TRUCK_TURRET_WOBBLE, rollCarTurretType()),
        createTurret(-TRUCK_LENGTH * 0.32, 0, TRUCK_TURRET_WOBBLE, rollCarTurretType())
      ],
      chaseTargetId: -1,
      swayPhase: Math.random() * TWO_PI,
      swaySpeed: randomRange(0.9, 1.4),
      swayAmount: UNIT_SWAY_TRUCK,
      hitFlash: 0,
      dead: false,
      isWreck: false,
      wreckFireTime: 0,
      lastAttackerUnitId: -1,
      spawnBonusStars: 0,
      killCount: 0,
      totalHealDone: 0,
      starCount: 0
    };
    nextUnitId += 1;
    return unit;
  }

  function createCarUnit(kind, worldX, worldY, team, turretType) {
    var moveSpeed = CAR_MOVE_SPEED;
    var carTurret;
    if (kind === UNIT_ENEMY) {
      moveSpeed = ENEMY_MOVE_SPEED;
    }
    if (turretType) {
      carTurret = createTurret(0, 0, 0.12, turretType);
    } else {
      carTurret = createCarTurret();
    }
    var unit = {
      id: nextUnitId,
      kind: kind,
      team: team,
      x: worldX,
      y: worldY,
      angle: UNIT_FACE_ANGLE,
      health: CAR_HEALTH,
      maxHealth: CAR_HEALTH,
      destinationX: worldX,
      destinationY: worldY,
      moveSpeed: moveSpeed,
      length: CAR_LENGTH,
      width: CAR_WIDTH,
      radius: CAR_RADIUS,
      turrets: [carTurret],
      chaseTargetId: -1,
      swayPhase: Math.random() * TWO_PI,
      swaySpeed: randomRange(1.2, 2.1),
      swayAmount: kind === UNIT_ENEMY
        ? randomRange(UNIT_SWAY_ENEMY_MIN, UNIT_SWAY_ENEMY_MAX)
        : randomRange(UNIT_SWAY_CAR_MIN, UNIT_SWAY_CAR_MAX),
      hitFlash: 0,
      dead: false,
      isWreck: false,
      wreckFireTime: 0,
      lastAttackerUnitId: -1,
      spawnBonusStars: 0,
      killCount: 0,
      totalHealDone: 0,
      starCount: 0
    };
    if (kind === UNIT_ESCORT) {
      initTruckScreenDestinationFields(unit);
      unit.combatMode = rollEscortCombatMode();
      setEscortCombatModeFromTurrets(unit);
    }
    nextUnitId += 1;
    return unit;
  }

  function rollEscortCombatMode() {
    if (Math.random() < ESCORT_DEFENSE_SPAWN_CHANCE) {
      return COMBAT_MODE_DEFENSE;
    }
    return COMBAT_MODE_ATTACK;
  }

  function getEscortCombatModeDamageTakenFactor(unit) {
    if (!unit || unit.dead || unit.kind !== UNIT_ESCORT) {
      return 1;
    }
    if (unit.combatMode === COMBAT_MODE_DEFENSE) {
      return ESCORT_DEFENSE_DAMAGE_TAKEN_FACTOR;
    }
    return 1;
  }

  function getEscortCombatModeDamageDealtFactor(unit) {
    if (!unit || unit.dead || unit.kind !== UNIT_ESCORT) {
      return 1;
    }
    if (unit.combatMode === COMBAT_MODE_ATTACK) {
      return ESCORT_ATTACK_DAMAGE_DEALT_FACTOR;
    }
    return 1;
  }

  function initUnitStarProgressFields(unit) {
    unit.spawnBonusStars = 0;
    unit.killCount = 0;
    unit.totalHealDone = 0;
    unit.starCount = 0;
  }

  function isUnitStarProgressUnit(unit) {
    if (!unit || unit.dead) {
      return false;
    }
    if (isUnitTruckKind(unit)) {
      return true;
    }
    if (unit.kind === UNIT_ESCORT || unit.kind === UNIT_ENEMY || unit.kind === UNIT_BOSS_TRUCK) {
      return true;
    }
    return false;
  }

  function isFriendlyStarUnit(unit) {
    if (!unit || unit.dead || unit.team !== "friendly") {
      return false;
    }
    if (isUnitTruckKind(unit)) {
      return true;
    }
    if (unit.kind === UNIT_ESCORT) {
      return true;
    }
    return false;
  }

  function isUnitStarBonusEligible(unit) {
    if (!isUnitStarProgressUnit(unit) || unit.starCount <= 0) {
      return false;
    }
    return true;
  }

  function shouldDrawUnitStarBadge(unit) {
    if (!isUnitStarProgressUnit(unit) || unit.isWreck || unit.starCount <= 0) {
      return false;
    }
    return true;
  }

  function getUnitStarDamageTakenFactor(unit) {
    var reduction;
    if (!isUnitStarBonusEligible(unit)) {
      return 1;
    }
    reduction = UNIT_STAR_DAMAGE_TAKEN_REDUCTION * unit.starCount;
    if (reduction > 0.99) {
      reduction = 0.99;
    }
    return 1 - reduction;
  }

  function getUnitStarDamageDealtFactor(unit) {
    if (!isUnitStarBonusEligible(unit)) {
      return 1;
    }
    return 1 + UNIT_STAR_DAMAGE_DEALT_BONUS * unit.starCount;
  }

  function getUnitStarHealFactor(unit) {
    if (!isUnitStarBonusEligible(unit) || !unitHasHealTurret(unit)) {
      return 1;
    }
    return 1 + UNIT_STAR_HEAL_BONUS * unit.starCount;
  }

  function getUnitStarRangeFactor(unit) {
    if (!isUnitStarBonusEligible(unit)) {
      return 1;
    }
    return 1 + UNIT_STAR_RANGE_BONUS * unit.starCount;
  }

  function getUnitDamageTakenFactor(unit) {
    var factor = 1;
    if (!unit) {
      return 1;
    }
    factor *= getEscortCombatModeDamageTakenFactor(unit);
    factor *= getUnitStarDamageTakenFactor(unit);
    return factor;
  }

  function getUnitDamageDealtFactor(unit) {
    var factor = 1;
    if (!unit) {
      return 1;
    }
    factor *= getEscortCombatModeDamageDealtFactor(unit);
    factor *= getUnitStarDamageDealtFactor(unit);
    return factor;
  }

  function getUnitEarnedStarCount(unit) {
    var killStars;
    var healStars;
    killStars = Math.floor(unit.killCount / UNIT_STAR_KILLS_PER_STAR);
    healStars = Math.floor(unit.totalHealDone / (unit.maxHealth * UNIT_STAR_HEAL_MAX_HEALTH_FACTOR));
    return unit.spawnBonusStars + killStars + healStars;
  }

  function tryAwardUnitStarFromProgress(unit) {
    var nextStarCount;
    if (!isUnitStarProgressUnit(unit)) {
      return;
    }
    nextStarCount = getUnitEarnedStarCount(unit);
    if (nextStarCount > unit.starCount) {
      unit.starCount = nextStarCount;
      spawnUnitStarReveal(unit);
    }
  }

  function recordUnitKill(killerUnit, killCredit) {
    if (!isUnitStarProgressUnit(killerUnit)) {
      return;
    }
    if (killCredit == null) {
      killCredit = UNIT_STAR_KILLS_PER_STAR;
    }
    killerUnit.killCount += killCredit;
    tryAwardUnitStarFromProgress(killerUnit);
  }

  function recordUnitHealDone(healerUnit, healAmount) {
    if (!isUnitStarProgressUnit(healerUnit) || healAmount <= 0) {
      return;
    }
    healerUnit.totalHealDone += healAmount;
    tryAwardUnitStarFromProgress(healerUnit);
  }

  function recordUnitKillFromVictim(victim, attackerUnit) {
    if (!victim || victim.dead) {
      return;
    }
    if (!attackerUnit || attackerUnit.dead) {
      attackerUnit = getUnitById(victim.lastAttackerUnitId);
    }
    if (!attackerUnit || attackerUnit.dead) {
      return;
    }
    if (attackerUnit.team === victim.team) {
      return;
    }
    if (!isUnitStarProgressUnit(attackerUnit)) {
      return;
    }
    if (isUnitTruckKind(victim)) {
      recordUnitKill(attackerUnit, UNIT_STAR_KILL_COUNT_TRUCK);
      return;
    }
    recordUnitKill(attackerUnit, UNIT_STAR_KILLS_PER_STAR);
  }

  function spawnUnitStarReveal(unit) {
    visualEffects.push({
      kind: "unitStar",
      x: unit.x,
      y: unit.y - 18,
      life: 0.85,
      maxLife: 0.85,
      riseSpeed: 34
    });
  }

  function sortStarValuesAscending(starValues) {
    var index;
    var swapIndex;
    var temp;
    for (index = 1; index < starValues.length; index += 1) {
      swapIndex = index;
      while (swapIndex > 0 && starValues[swapIndex - 1] > starValues[swapIndex]) {
        temp = starValues[swapIndex - 1];
        starValues[swapIndex - 1] = starValues[swapIndex];
        starValues[swapIndex] = temp;
        swapIndex -= 1;
      }
    }
  }

  function getFriendlyTeamMedianStarCount() {
    var index;
    var middleIndex;
    var starValues = [];
    var unit;
    var unitCount;
    for (index = 0; index < units.length; index += 1) {
      unit = units[index];
      if (unit.dead || unit.team !== "friendly") {
        continue;
      }
      if (!isFriendlyStarUnit(unit)) {
        continue;
      }
      starValues.push(unit.starCount);
    }
    unitCount = starValues.length;
    if (unitCount <= 0) {
      return 0;
    }
    sortStarValuesAscending(starValues);
    middleIndex = Math.floor(unitCount / 2);
    if (unitCount % 2 === 1) {
      return starValues[middleIndex];
    }
    return (starValues[middleIndex - 1] + starValues[middleIndex]) / 2;
  }

  function rollEnemySpawnStarCount() {
    var maxStars;
    var medianStars;
    medianStars = getFriendlyTeamMedianStarCount();
    maxStars = Math.floor(medianStars);
    if (maxStars <= 0) {
      return 0;
    }
    return Math.floor(Math.random() * (maxStars + 1));
  }

  function setUnitSpawnBonusStars(unit, starCount) {
    if (!unit) {
      return;
    }
    if (starCount < 0) {
      starCount = 0;
    }
    unit.spawnBonusStars = starCount;
    tryAwardUnitStarFromProgress(unit);
  }

  function toggleEscortCombatMode(unit) {
    if (!unit || unit.kind !== UNIT_ESCORT) {
      return;
    }
    if (unit.combatMode === COMBAT_MODE_ATTACK) {
      unit.combatMode = COMBAT_MODE_DEFENSE;
    } else {
      unit.combatMode = COMBAT_MODE_ATTACK;
    }
    spawnCombatModeReveal(unit.x, unit.y, unit.combatMode);
    updateSelectionRing();
  }

  function spawnEscortModeReveal(unit) {
    if (!unit) {
      return;
    }
    spawnCombatModeReveal(unit.x, unit.y, unit.combatMode);
  }

  function spawnCombatModeReveal(worldX, worldY, combatMode) {
    var index;
    var particleCount = 12;
    visualEffects.push({
      kind: "modeSymbol",
      x: worldX,
      y: worldY - 18,
      combatMode: combatMode,
      life: 0.9,
      maxLife: 0.9,
      riseSpeed: 38,
      size: 14
    });
    for (index = 0; index < particleCount; index += 1) {
      visualEffects.push({
        kind: "modeParticle",
        x: worldX + randomRange(-14, 14),
        y: worldY + randomRange(-10, 10),
        combatMode: combatMode,
        velX: randomRange(-24, 24),
        velY: randomRange(-72, -34),
        life: randomRange(0.38, 0.72),
        maxLife: 0.72,
        size: randomRange(2, 5)
      });
    }
  }

  function getTruckScreenPosition() {
    if (!truckUnit || truckUnit.dead) {
      return null;
    }
    return worldToScreen(truckUnit.x, truckUnit.y);
  }

  function initTruckScreenDestinationFields(unit) {
    unit.hasTruckScreenDestination = false;
    unit.destinationScreenOffsetX = 0;
    unit.destinationScreenOffsetY = 0;
  }

  function getWorldPositionFromTruckScreenOffset(unit) {
    var truckScreen;
    var destScreenX;
    var destScreenY;
    if (!unit || !unit.hasTruckScreenDestination || !truckUnit || truckUnit.dead) {
      return null;
    }
    truckScreen = getTruckScreenPosition();
    if (!truckScreen) {
      return null;
    }
    destScreenX = truckScreen.x + unit.destinationScreenOffsetX;
    destScreenY = truckScreen.y + unit.destinationScreenOffsetY;
    return screenToWorld(destScreenX, destScreenY);
  }

  function applyTruckScreenDestinationToUnit(unit) {
    var worldDestination = getWorldPositionFromTruckScreenOffset(unit);
    if (!worldDestination) {
      return;
    }
    unit.destinationX = worldDestination.x;
    unit.destinationY = worldDestination.y;
  }

  function hasOnScreenEnemyForEscort(unit) {
    return findClosestOnScreenEnemyFrom(unit.x, unit.y) != null;
  }

  function shouldEscortFollowTruckGuardSlot(unit) {
    if (!unit || unit.dead || unit.kind !== UNIT_ESCORT) {
      return false;
    }
    if (unit.combatMode === COMBAT_MODE_DEFENSE) {
      return unit.hasTruckScreenDestination;
    }
    if (unit.combatMode === COMBAT_MODE_ATTACK) {
      return !hasOnScreenEnemyForEscort(unit);
    }
    return false;
  }

  function ensureEscortTruckGuardOffset(unit) {
    if (!unit.hasTruckScreenDestination) {
      setEscortGuardOffset(unit, unit.x, unit.y);
    }
  }

  function applyTruckGuardDestinationToUnit(unit) {
    ensureEscortTruckGuardOffset(unit);
    applyTruckScreenDestinationToUnit(unit);
  }

  function setTruckScreenDestinationForUnit(unit, screenX, screenY) {
    var truckScreen;
    if (!unit || !truckUnit || truckUnit.dead) {
      return;
    }
    truckScreen = getTruckScreenPosition();
    if (!truckScreen) {
      return;
    }
    unit.destinationScreenOffsetX = screenX - truckScreen.x;
    unit.destinationScreenOffsetY = screenY - truckScreen.y;
    unit.hasTruckScreenDestination = true;
    applyTruckScreenDestinationToUnit(unit);
  }

  function setTruckScreenDestinationFromWorld(unit, worldX, worldY) {
    var truckScreen;
    var destinationScreen;
    if (!unit || !truckUnit || truckUnit.dead) {
      return;
    }
    truckScreen = getTruckScreenPosition();
    if (!truckScreen) {
      return;
    }
    destinationScreen = worldToScreen(worldX, worldY);
    unit.destinationScreenOffsetX = destinationScreen.x - truckScreen.x;
    unit.destinationScreenOffsetY = destinationScreen.y - truckScreen.y;
    unit.hasTruckScreenDestination = true;
    applyTruckScreenDestinationToUnit(unit);
  }

  function shouldTruckApplyPlayerMoveDestination() {
    if (!truckUnit || truckUnit.dead || !truckUnit.hasTruckScreenDestination) {
      return false;
    }
    if (isTruckSelected()) {
      return true;
    }
    if (getActiveTruckHazardWorldY() != null) {
      return false;
    }
    if (shouldTruckFollowSelectedEscortNow()) {
      return false;
    }
    return true;
  }

  function updateTruckScreenRelativeDestinations() {
    var index;
    var unit;
    if (!truckUnit || truckUnit.dead) {
      return;
    }
    for (index = 0; index < units.length; index += 1) {
      unit = units[index];
      if (unit.dead || unit.team !== "friendly") {
        continue;
      }
      if (unit.id === selectedUnitId && unit.kind === UNIT_ESCORT) {
        continue;
      }
      if (!unit.hasTruckScreenDestination) {
        continue;
      }
      if (unit === truckUnit) {
        if (shouldTruckApplyPlayerMoveDestination()) {
          applyTruckScreenDestinationToUnit(unit);
        }
        continue;
      }
      if (shouldEscortFollowTruckGuardSlot(unit)) {
        applyTruckGuardDestinationToUnit(unit);
      }
    }
  }

  function setEscortGuardOffset(unit, worldX, worldY) {
    setTruckScreenDestinationFromWorld(unit, worldX, worldY);
  }

  function getEscortGuardWorldPosition(unit) {
    return getWorldPositionFromTruckScreenOffset(unit);
  }

  function getUnitFollowStandoffDistance(follower, target) {
    return getUnitCollisionRadius(follower) + getUnitCollisionRadius(target) + UNIT_COLLISION_PADDING + UNIT_FOLLOW_STANDOFF_PADDING;
  }

  function getUnitMaxCombatTurretFireRange(unit) {
    var maxRange = TURRET_FIRE_RANGE;
    var range;
    var turret;
    var turretIndex;
    if (!unit || !unit.turrets) {
      return TURRET_FIRE_RANGE;
    }
    for (turretIndex = 0; turretIndex < unit.turrets.length; turretIndex += 1) {
      turret = unit.turrets[turretIndex];
      if (turret.type === TURRET_TYPE_HEAL) {
        continue;
      }
      range = getUnitTurretFireRange(unit, turret);
      if (range > maxRange) {
        maxRange = range;
      }
    }
    return maxRange;
  }

  function getUnitCombatFollowStandoffDistance(follower) {
    return getUnitMaxCombatTurretFireRange(follower) * COMBAT_FOLLOW_RANGE_FACTOR;
  }

  function getFollowDestinationNearTarget(follower, target) {
    var combatStandoff;
    var deltaX = follower.x - target.x;
    var deltaY = follower.y - target.y;
    var distSq = deltaX * deltaX + deltaY * deltaY;
    var standoff = getUnitFollowStandoffDistance(follower, target);
    var dist;
    var dirX;
    var dirY;
    combatStandoff = getUnitCombatFollowStandoffDistance(follower);
    if (combatStandoff > standoff) {
      standoff = combatStandoff;
    }
    if (distSq < 0.001) {
      dirX = 1;
      dirY = 0;
    } else {
      dist = Math.sqrt(distSq);
      dirX = deltaX / dist;
      dirY = deltaY / dist;
    }
    return {
      x: target.x + dirX * standoff,
      y: target.y + dirY * standoff
    };
  }

  function pickCrystalRarity() {
    var roll = Math.random();
    var accumulated = 0;
    var index;
    for (index = 0; index < CRYSTAL_RARITY_COUNT; index += 1) {
      accumulated += CRYSTAL_RARITY_WEIGHTS[index];
      if (roll <= accumulated) {
        return index;
      }
    }
    return 0;
  }

  function getCrystalColorRgb(rarity) {
    var clamped = rarity;
    if (clamped < 0) {
      clamped = 0;
    }
    if (clamped >= CRYSTAL_RARITY_COUNT) {
      clamped = CRYSTAL_RARITY_COUNT - 1;
    }
    return CRYSTAL_RARITY_COLORS[clamped];
  }

  function clampCrystalScreenPositionToVisibleEdges(screenX, screenY) {
    var margin;
    var clampedX;
    var clampedY;
    if (width <= 0 || height <= 0) {
      return { x: screenX, y: screenY };
    }
    margin = CRYSTAL_SPAWN_SCREEN_EDGE_MARGIN;
    clampedX = screenX;
    clampedY = screenY;
    if (screenX < margin) {
      clampedX = margin;
    } else if (screenX > width - margin) {
      clampedX = width - margin;
    }
    if (screenY < margin) {
      clampedY = margin;
    } else if (screenY > height - margin) {
      clampedY = height - margin;
    }
    return { x: clampedX, y: clampedY };
  }

  function createCrystalAtScreen(screenX, screenY, angle, dist, forceRarity) {
    var rarity = forceRarity != null ? forceRarity : pickCrystalRarity();
    var rgb = getCrystalColorRgb(rarity);
    var spawnScreenX = screenX + Math.cos(angle) * dist;
    var spawnScreenY = screenY + Math.sin(angle) * dist;
    var clampedScreen = clampCrystalScreenPositionToVisibleEdges(spawnScreenX, spawnScreenY);
    return {
      screenX: clampedScreen.x,
      screenY: clampedScreen.y,
      value: CRYSTAL_RARITY_VALUE[rarity],
      pulse: Math.random() * TWO_PI,
      spin: randomRange(0.4, 1.1) * randomSign(),
      bob: Math.random() * TWO_PI,
      size: randomRange(5, 9) * CRYSTAL_RARITY_SIZE[rarity],
      rarity: rarity,
      red: rgb[0],
      green: rgb[1],
      blue: rgb[2],
      layAge: 0
    };
  }

  function getTerrainCellXFromWorld(worldX) {
    return Math.floor(worldX / TERRAIN_CELL_WIDTH);
  }

  function getTerrainCellYFromWorld(worldY) {
    return Math.floor(worldY / TERRAIN_CELL_HEIGHT);
  }

  function getTerrainCellKey(cellX, cellY) {
    return cellX + ":" + cellY;
  }

  function createDebrisAt(worldX, worldY) {
    return {
      x: worldX,
      y: worldY,
      kind: Math.floor(Math.random() * 4),
      size: randomRange(8, 28),
      rotation: randomRange(0, TWO_PI)
    };
  }

  function populateTerrainCell(cell) {
    var debrisCount;
    var rockCount;
    var bushCount;
    var index;
    var worldMinX;
    var worldMaxX;
    var worldMinY;
    var worldMaxY;
    worldMinX = cell.cellX * TERRAIN_CELL_WIDTH;
    worldMaxX = worldMinX + TERRAIN_CELL_WIDTH;
    worldMinY = cell.cellY * TERRAIN_CELL_HEIGHT;
    worldMaxY = worldMinY + TERRAIN_CELL_HEIGHT;
    debrisCount = TERRAIN_DEBRIS_COUNT_MIN + Math.floor(Math.random() * (TERRAIN_DEBRIS_COUNT_MAX - TERRAIN_DEBRIS_COUNT_MIN + 1));
    rockCount = TERRAIN_ROCK_COUNT_MIN + Math.floor(Math.random() * (TERRAIN_ROCK_COUNT_MAX - TERRAIN_ROCK_COUNT_MIN + 1));
    bushCount = TERRAIN_BUSH_COUNT_MIN + Math.floor(Math.random() * (TERRAIN_BUSH_COUNT_MAX - TERRAIN_BUSH_COUNT_MIN + 1));
    for (index = 0; index < debrisCount; index += 1) {
      cell.debris.push(createDebrisAt(
        randomRange(worldMinX, worldMaxX),
        randomRange(worldMinY, worldMaxY)
      ));
    }
    for (index = 0; index < rockCount; index += 1) {
      cell.obstacles.push(createRockObstacle(
        randomRange(worldMinX, worldMaxX),
        randomRange(worldMinY, worldMaxY)
      ));
    }
    for (index = 0; index < bushCount; index += 1) {
      cell.obstacles.push(createBushObstacle(
        randomRange(worldMinX, worldMaxX),
        randomRange(worldMinY, worldMaxY)
      ));
    }
  }

  function spawnTerrainCell(cellX, cellY) {
    var cellKey;
    var cell;
    cellKey = getTerrainCellKey(cellX, cellY);
    if (terrainSpawnedCellKeys[cellKey]) {
      return;
    }
    cell = {
      cellX: cellX,
      cellY: cellY,
      debris: [],
      obstacles: []
    };
    populateTerrainCell(cell);
    terrainSpawnedCellKeys[cellKey] = true;
    terrainCells.push(cell);
  }

  function syncTerrainDecorations() {
    var minCellX;
    var maxCellX;
    var minCellY;
    var maxCellY;
    var cellX;
    var cellY;
    var cellIndex;
    var cell;
    var despawnWorldX;
    var despawnWorldYMin;
    var despawnWorldYMax;
    var cellMinY;
    var cellMaxY;
    var viewMinWorldX;
    var viewMaxWorldX;
    var viewMinWorldY;
    var viewMaxWorldY;
    viewMinWorldX = cameraX - width * 0.5 - TERRAIN_CELL_WIDTH;
    viewMaxWorldX = cameraX + width * 0.5 + TERRAIN_CELL_WIDTH;
    viewMinWorldY = cameraY - height * 0.5 - TERRAIN_CELL_HEIGHT;
    viewMaxWorldY = cameraY + height * 0.5 + TERRAIN_CELL_HEIGHT;
    minCellX = getTerrainCellXFromWorld(viewMinWorldX) - TERRAIN_CELL_X_MARGIN;
    maxCellX = getTerrainCellXFromWorld(viewMaxWorldX) + TERRAIN_CELL_X_MARGIN;
    minCellY = getTerrainCellYFromWorld(viewMinWorldY) - TERRAIN_CELL_Y_MARGIN;
    maxCellY = getTerrainCellYFromWorld(viewMaxWorldY) + TERRAIN_CELL_Y_MARGIN;
    for (cellY = minCellY; cellY <= maxCellY; cellY += 1) {
      for (cellX = minCellX; cellX <= maxCellX; cellX += 1) {
        spawnTerrainCell(cellX, cellY);
      }
    }
    despawnWorldX = cameraX - width * 0.5 - TERRAIN_CELL_DESPAWN_MARGIN;
    despawnWorldYMin = cameraY - height * 0.5 - TERRAIN_CELL_DESPAWN_MARGIN;
    despawnWorldYMax = cameraY + height * 0.5 + TERRAIN_CELL_DESPAWN_MARGIN;
    for (cellIndex = terrainCells.length - 1; cellIndex >= 0; cellIndex -= 1) {
      cell = terrainCells[cellIndex];
      cellMaxY = cell.cellY * TERRAIN_CELL_HEIGHT + TERRAIN_CELL_HEIGHT;
      cellMinY = cell.cellY * TERRAIN_CELL_HEIGHT;
      if (cell.cellX * TERRAIN_CELL_WIDTH + TERRAIN_CELL_WIDTH < despawnWorldX
        || cellMaxY < despawnWorldYMin
        || cellMinY > despawnWorldYMax) {
        delete terrainSpawnedCellKeys[getTerrainCellKey(cell.cellX, cell.cellY)];
        terrainCells.splice(cellIndex, 1);
      }
    }
  }

  function createRockObstacle(worldX, worldY) {
    var vertexCount;
    var vertexIndex;
    var angle;
    var dist;
    var size;
    var vertices;
    size = randomRange(14, 40);
    vertexCount = 5 + Math.floor(Math.random() * 3);
    vertices = [];
    for (vertexIndex = 0; vertexIndex < vertexCount; vertexIndex += 1) {
      angle = (vertexIndex / vertexCount) * TWO_PI + randomRange(-0.25, 0.25);
      dist = size * randomRange(0.5, 1);
      vertices.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * randomRange(0.65, 1)
      });
    }
    return {
      kind: "rock",
      x: worldX,
      y: worldY,
      size: size,
      rotation: randomRange(0, TWO_PI),
      vertices: vertices,
      radius: size * 0.82,
      active: true
    };
  }

  function createBushObstacle(worldX, worldY) {
    var size;
    size = randomRange(16, 34);
    return {
      kind: "bush",
      x: worldX,
      y: worldY,
      size: size,
      radius: size * 0.68,
      active: true
    };
  }

  function initWorld() {
    units.length = 0;
    cachedFriendlyUnits.length = 0;
    cachedEnemyUnits.length = 0;
    projectiles.length = 0;
    crystals.length = 0;
    terrainCells.length = 0;
    terrainSpawnedCellKeys = {};
    visualEffects.length = 0;
    dustParticles.length = 0;
    pendingSpawnWarnings.length = 0;
    pendingSpawnWaveAnchor = null;
    mines.length = 0;
    pendingMinefieldWarning = null;
    pendingRocketStrikeWarning = null;
    gameTime = 0;
    simulationFrameIndex = 0;
    distanceTraveled = 0;
    crystalCount = 0;
    pendingCrystalCollectSoundCount = 0;
    scrollSpeed = SCROLL_SPEED_BASE;
    enemySpawnTimer = 2.5;
    minefieldSpawnTimer = 11;
    rocketStrikeSpawnTimer = 17;
    cameraX = 0;
    cameraY = 0;
    scrollCameraX = 0;
    enemyPathUpdateTimer = 0;

    truckUnit = createTruckUnit(0, 0);
    units.push(truckUnit);
    selectedUnitId = truckUnit.id;
    cameraX = truckUnit.x;
    cameraY = truckUnit.y;
    resetTruckCameraFollowState();

    var escortSpawnPos = getEscortSpawnPositionBehindTruck();
    var escortDestination = getRandomEscortDestinationAroundTruck();
    var escort = createCarUnit(UNIT_ESCORT, escortSpawnPos.x, escortSpawnPos.y, "friendly");
    escort.destinationX = escortDestination.x;
    escort.destinationY = escortDestination.y;
    setEscortGuardOffset(escort, escortDestination.x, escortDestination.y);
    units.push(escort);
    spawnEscortModeReveal(escort);

    syncTerrainDecorations();
  }

  function loadHighScore() {
    try {
      var stored = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
      if (stored) {
        highScore = parseInt(stored, 10) || 0;
      }
    } catch (error) {
      highScore = 0;
    }
    syncBestHud(false);
  }

  function saveHighScoreIfNeeded() {
    var runDistance = getRunDistance();
    if (runDistance <= highScore) {
      return false;
    }
    highScore = runDistance;
    try {
      window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(highScore));
    } catch (error) {
    }
    return true;
  }

  function syncBestHud(isRecord) {
    var bestLabel = getLocalized(LOCALE_KEY_BEST_LABEL, "best");
    hudBest.textContent = bestLabel + " " + highScore;
    if (isRecord) {
      hudBest.classList.add("is-record");
    } else {
      hudBest.classList.remove("is-record");
    }
  }

  function syncPlayingHud() {
    hudDistance.textContent = String(getRunDistance());
  }

  function tryAutoSpawnEscorts() {
    var spawnCost;
    if (!isPlaying() || !truckUnit || truckUnit.dead) {
      return;
    }
    spawnCost = getEscortSpawnCost();
    while (crystalCount >= spawnCost) {
      spawnEscortBehindTruck();
      spawnCost = getEscortSpawnCost();
    }
  }

  function syncGameOverScore() {
    var scoreLabel = getLocalized(LOCALE_KEY_SCORE, "SCORE");
    gameOverScore.textContent = scoreLabel + " " + String(getRunDistance());
  }

  function showStartScreen() {
    gamePhase = PHASE_START;
    gameScreen.classList.remove("hidden");
    gameScreen.classList.remove("is-record");
    screenTitle.textContent = getGameTitle();
    gameOverScore.classList.add("hidden");
    controlHint.textContent = getLocalized(
      LOCALE_KEY_HINT,
      "Escort the hauler across the wasteland. Select vehicles, click to reposition, collect crystals, reinforce the convoy."
    );
    controlHint.classList.remove("hidden");
    hudTop.classList.add("hidden");
    selectionRing.classList.remove("is-visible");
    resetMovementKeys();
    updateTruckDamageVignette();
    if (window.WebExtrasGameStartMusicNotify && window.WebExtrasGameStartMusicNotify.notifyStartScreenReady) {
      window.WebExtrasGameStartMusicNotify.notifyStartScreenReady();
    }
  }

  function showGameOverScreen(isRecord) {
    gamePhase = PHASE_GAME_OVER;
    gameScreen.classList.remove("hidden");
    screenTitle.textContent = getLocalized(LOCALE_KEY_GAME_OVER, "Game Over");
    syncGameOverScore();
    gameOverScore.classList.remove("hidden");
    controlHint.classList.add("hidden");
    hudTop.classList.add("hidden");
    selectionRing.classList.remove("is-visible");
    resetMovementKeys();
    if (isRecord) {
      gameScreen.classList.add("is-record");
      syncBestHud(true);
    } else {
      gameScreen.classList.remove("is-record");
    }
    updateTruckDamageVignette();
    if (window.WebExtrasGameStartMusicNotify && window.WebExtrasGameStartMusicNotify.notifyGameOver) {
      window.WebExtrasGameStartMusicNotify.notifyGameOver();
    }
    if (getSynth()) {
      if (isRecord) {
        getSynth().playRecord();
      } else {
        getSynth().playFail();
      }
    }
  }

  function startPlaying() {
    gamePhase = PHASE_PLAYING;
    initWorld();
    gameScreen.classList.add("hidden");
    hudTop.classList.remove("hidden");
    syncPlayingHud();
    focusGameRoot();
    setGameInputMovementMode();
    if (getSynth()) {
      getSynth().ensureContext();
    }
    ensureCrystalAudio();
    if (getSynth()) {
      getSynth().playGameStart();
    }
    if (window.WebExtrasGameStartMusicNotify && window.WebExtrasGameStartMusicNotify.notifyGameplayStarted) {
      window.WebExtrasGameStartMusicNotify.notifyGameplayStarted();
    }
  }

  function getSharedConvoySwaySource() {
    if (truckUnit && !truckUnit.dead) {
      return truckUnit;
    }
    return null;
  }

  function getUnitDrawOffset(unit) {
    var lateralError = unit.destinationY - unit.y;
    var catchUpDrift = clamp(lateralError * UNIT_SWAY_CATCH_UP, -unit.swayAmount * 1.15, unit.swayAmount * 1.15);
    var swaySource = unit;
    var convoySource = getSharedConvoySwaySource();
    if (unit.team === "friendly" && convoySource && unit.id !== convoySource.id) {
      swaySource = convoySource;
      catchUpDrift = catchUpDrift * 0.55 + clamp((convoySource.destinationY - convoySource.y) * UNIT_SWAY_CATCH_UP, -unit.swayAmount, unit.swayAmount) * 0.45;
    }
    var laneSway = Math.sin(gameTime * swaySource.swaySpeed + swaySource.swayPhase) * unit.swayAmount;
    var struggleSway = Math.sin(gameTime * swaySource.swaySpeed * 1.65 + swaySource.swayPhase * 1.9) * unit.swayAmount * 0.42;
    var forwardBob = Math.sin(gameTime * swaySource.swaySpeed * 0.85 + swaySource.swayPhase * 0.5) * 1.4;
    if (unit.team === "enemy") {
      laneSway *= 0.55;
      struggleSway *= 0.45;
      forwardBob *= 0.5;
    }
    return {
      x: forwardBob,
      y: catchUpDrift + laneSway + struggleSway
    };
  }

  function getUnitDrawTilt(unit) {
    var lateralError = unit.destinationY - unit.y;
    var tiltScale = unit.team === "enemy" ? UNIT_SWAY_ENEMY_TILT : UNIT_SWAY_FRIENDLY_TILT;
    var errorTilt = clamp(lateralError * 0.004, -tiltScale, tiltScale);
    var swaySource = unit;
    var convoySource = getSharedConvoySwaySource();
    if (unit.team === "friendly" && convoySource && unit.id !== convoySource.id) {
      swaySource = convoySource;
    }
    var swayTilt = Math.sin(gameTime * swaySource.swaySpeed * 1.2 + swaySource.swayPhase) * tiltScale;
    if (unit.team === "enemy") {
      swayTilt *= 0.5;
    }
    return errorTilt + swayTilt;
  }

  function getUnitDrawWorldPosition(unit) {
    var offset = getUnitDrawOffset(unit);
    return {
      x: unit.x + offset.x,
      y: unit.y + offset.y
    };
  }

  function spawnDustAtWheel(unit, localX, localY) {
    var dust;
    if (dustParticles.length >= DUST_PARTICLE_MAX) {
      dustParticles.shift();
    }
    dust = {
      x: unit.x + localX + randomRange(-3, 3),
      y: unit.y + localY + randomRange(-3, 3),
      velX: randomRange(-10, 10) - randomRange(DUST_VEL_X_MIN, DUST_VEL_X_MAX),
      velY: randomRange(-8, 8),
      life: randomRange(0.45, 1.0),
      maxLife: 1.0,
      size: randomRange(6, 14),
      alpha: randomRange(0.32, 0.62)
    };
    dustParticles.push(dust);
  }

  function spawnExhaustSmoke(unit) {
    var smoke;
    if (dustParticles.length >= DUST_PARTICLE_MAX) {
      dustParticles.shift();
    }
    smoke = {
      x: unit.x - unit.length * 0.42 + randomRange(-4, 4),
      y: unit.y + randomRange(-5, 5),
      velX: randomRange(-24, -12),
      velY: randomRange(-20, -6),
      life: randomRange(0.55, 1.1),
      maxLife: 1.1,
      size: randomRange(5, 10),
      alpha: randomRange(0.22, 0.38),
      dark: true
    };
    dustParticles.push(smoke);
  }

  function spawnUnitWheelDust(unit) {
    var spawnPassCount;
    var spawnIndex;
    if (scrollSpeed < WHEEL_DUST_MIN_SPEED) {
      return;
    }
    spawnPassCount = Math.floor(scrollSpeed / WHEEL_DUST_SPEED_DIVISOR);
    if (spawnPassCount < 1) {
      spawnPassCount = 1;
    }
    for (spawnIndex = 0; spawnIndex < spawnPassCount; spawnIndex += 1) {
      if ((spawnIndex + simulationFrameIndex) % WHEEL_DUST_SPAWN_SKIP !== 0) {
        continue;
      }
      if (isUnitTruckKind(unit)) {
        var truckWheels = getTruckWheelOffsets(unit);
        var wheelIndex;
        for (wheelIndex = 0; wheelIndex < truckWheels.length; wheelIndex += 1) {
          spawnDustAtWheel(unit, truckWheels[wheelIndex].x, truckWheels[wheelIndex].y);
        }
        if (simulationFrameIndex % 5 === 0) {
          spawnExhaustSmoke(unit);
        }
      } else {
        var carWheels = getCarWheelOffsets(unit);
        var carWheelIndex;
        for (carWheelIndex = 0; carWheelIndex < carWheels.length; carWheelIndex += 1) {
          spawnDustAtWheel(unit, carWheels[carWheelIndex].x, carWheels[carWheelIndex].y);
        }
      }
    }
  }

  function updateDustParticles(deltaSeconds) {
    var index;
    var dust;
    for (index = dustParticles.length - 1; index >= 0; index -= 1) {
      dust = dustParticles[index];
      dust.life -= deltaSeconds;
      dust.velX *= 0.97;
      dust.velY *= 0.96;
      dust.x += dust.velX * deltaSeconds;
      dust.y += dust.velY * deltaSeconds;
      dust.size += (dust.dark ? 14 : 18) * deltaSeconds;
      dust.alpha -= (dust.dark ? 0.55 : 0.7) * deltaSeconds;
      if (dust.life <= 0 || dust.alpha <= 0) {
        dustParticles.splice(index, 1);
      }
    }
  }

  function drawDustParticles() {
    var index;
    var dust;
    var screenPos;
    for (index = 0; index < dustParticles.length; index += 1) {
      dust = dustParticles[index];
      screenPos = worldToScreen(dust.x, dust.y);
      if (dust.dark) {
        context.fillStyle = "rgba(72, 58, 46, " + dust.alpha + ")";
      } else {
        context.fillStyle = "rgba(190, 160, 120, " + dust.alpha + ")";
      }
      context.beginPath();
      context.arc(screenPos.x, screenPos.y, dust.size, 0, TWO_PI);
      context.fill();
    }
  }

  function worldToScreen(worldX, worldY) {
    return {
      x: worldX - cameraX + width * 0.5,
      y: worldY - cameraY + height * 0.5
    };
  }

  function screenToWorld(screenX, screenY) {
    return {
      x: screenX - width * 0.5 + cameraX,
      y: screenY - height * 0.5 + cameraY
    };
  }

  function isWorldPositionOnScreen(worldX, worldY) {
    var screenPos = worldToScreen(worldX, worldY);
    return screenPos.x >= -UNIT_ON_SCREEN_MARGIN
      && screenPos.x <= width + UNIT_ON_SCREEN_MARGIN
      && screenPos.y >= -UNIT_ON_SCREEN_MARGIN
      && screenPos.y <= height + UNIT_ON_SCREEN_MARGIN;
  }

  function isUnitOnScreen(unit) {
    if (!unit || unit.dead) {
      return false;
    }
    return isWorldPositionOnScreen(unit.x, unit.y);
  }

  function isUnitVisibleOnScreen(unit) {
    var screenPos;
    if (!unit || unit.dead) {
      return false;
    }
    screenPos = worldToScreen(unit.x, unit.y);
    if (width <= 0 || height <= 0) {
      return false;
    }
    return screenPos.x >= 0
      && screenPos.x <= width
      && screenPos.y >= 0
      && screenPos.y <= height;
  }

  function isWorldPositionOffScreenForDespawn(worldX, worldY) {
    var screenPos = worldToScreen(worldX, worldY);
    return screenPos.x < -UNIT_DESPAWN_SCREEN_MARGIN
      || screenPos.x > width + UNIT_DESPAWN_SCREEN_MARGIN
      || screenPos.y < -UNIT_DESPAWN_SCREEN_MARGIN
      || screenPos.y > height + UNIT_DESPAWN_SCREEN_MARGIN;
  }

  function isUnitOffScreenForDespawn(unit) {
    if (!unit) {
      return false;
    }
    return isWorldPositionOffScreenForDespawn(unit.x, unit.y);
  }

  function getUnitById(unitId) {
    var index;
    for (index = 0; index < units.length; index += 1) {
      if (units[index].id === unitId && !units[index].dead) {
        return units[index];
      }
    }
    return null;
  }

  function getFriendlyUnits() {
    var index;
    cachedFriendlyUnits.length = 0;
    for (index = 0; index < units.length; index += 1) {
      if (!units[index].dead && units[index].team === "friendly") {
        cachedFriendlyUnits.push(units[index]);
      }
    }
    return cachedFriendlyUnits;
  }

  function getEnemyUnits() {
    var index;
    cachedEnemyUnits.length = 0;
    for (index = 0; index < units.length; index += 1) {
      if (!units[index].dead && units[index].team === "enemy") {
        cachedEnemyUnits.push(units[index]);
      }
    }
    return cachedEnemyUnits;
  }

  function getUnitTurretWorldPosition(unit, turret) {
    var cosAngle = Math.cos(unit.angle);
    var sinAngle = Math.sin(unit.angle);
    return {
      x: unit.x + turret.localX * cosAngle - turret.localY * sinAngle,
      y: unit.y + turret.localX * sinAngle + turret.localY * cosAngle
    };
  }

  function getTurretBarrelLength(unit, turret) {
    if (isUnitTruckKind(unit)) {
      return getDrawTruckTurretBarrelLength(turret);
    }
    return getDrawCarTurretBarrelLength(turret);
  }

  function getUnitTurretMuzzleWorldPosition(unit, turret) {
    var mountPosition = getUnitTurretWorldPosition(unit, turret);
    var barrelLength = getTurretBarrelLength(unit, turret);
    var aimAngle = unit.angle + turret.angle;
    return {
      x: mountPosition.x + Math.cos(aimAngle) * barrelLength,
      y: mountPosition.y + Math.sin(aimAngle) * barrelLength
    };
  }

  function getUnitMoveSpeedForHorizontalDirection(unit, dirX) {
    var speed = unit.moveSpeed;
    if (dirX < -0.001) {
      speed *= UNIT_MOVE_SPEED_LEFT_FACTOR;
    } else if (dirX > 0.001) {
      speed *= UNIT_MOVE_SPEED_RIGHT_FACTOR;
    }
    return speed;
  }

  function getTurretTargetPickScore(unit, turret, turretWorldX, turretWorldY, candidate) {
    var distSq;
    var targetAngle;
    var aimAngle;
    var aimTurnAngle;
    var forwardTurnAngle;
    var behindForwardAngle;
    var aimRotationCost;
    var forwardExtraCost;
    var score;
    distSq = distanceSquared(turretWorldX, turretWorldY, candidate.x, candidate.y);
    targetAngle = Math.atan2(candidate.y - turretWorldY, candidate.x - turretWorldX);
    aimAngle = unit.angle + turret.angle;
    aimTurnAngle = Math.abs(angleDifference(aimAngle, targetAngle));
    forwardTurnAngle = Math.abs(angleDifference(unit.angle, targetAngle));
    aimRotationCost = aimTurnAngle * TURRET_TARGET_AIM_ROTATION_COST;
    score = distSq + aimRotationCost * aimRotationCost;
    if (aimTurnAngle > forwardTurnAngle) {
      behindForwardAngle = aimTurnAngle - forwardTurnAngle;
      forwardExtraCost = behindForwardAngle * TURRET_TARGET_FORWARD_ROTATION_EXTRA_COST;
      score += forwardExtraCost * forwardExtraCost;
    }
    return score;
  }

  function findClosestEnemyForTurret(unit, turret, turretWorldX, turretWorldY, maxRange) {
    var enemies = getEnemyUnits();
    var closest = null;
    var fireRange = maxRange != null ? maxRange : TURRET_FIRE_RANGE;
    var maxRangeSq = fireRange * fireRange;
    var bestScore = maxRangeSq + 999999999;
    var index;
    var enemy;
    var distSq;
    var score;
    for (index = 0; index < enemies.length; index += 1) {
      enemy = enemies[index];
      distSq = distanceSquared(turretWorldX, turretWorldY, enemy.x, enemy.y);
      if (distSq > maxRangeSq) {
        continue;
      }
      score = getTurretTargetPickScore(unit, turret, turretWorldX, turretWorldY, enemy);
      if (score < bestScore) {
        bestScore = score;
        closest = enemy;
      }
    }
    return closest;
  }

  function findClosestFriendlyForTurret(unit, turret, turretWorldX, turretWorldY, maxRange) {
    var friendlies = getFriendlyUnits();
    var closest = null;
    var fireRange = maxRange != null ? maxRange : TURRET_FIRE_RANGE;
    var maxRangeSq = fireRange * fireRange;
    var bestScore = maxRangeSq + 999999999;
    var index;
    var friendly;
    var distSq;
    var score;
    for (index = 0; index < friendlies.length; index += 1) {
      friendly = friendlies[index];
      distSq = distanceSquared(turretWorldX, turretWorldY, friendly.x, friendly.y);
      if (distSq > maxRangeSq) {
        continue;
      }
      score = getTurretTargetPickScore(unit, turret, turretWorldX, turretWorldY, friendly);
      if (score < bestScore) {
        bestScore = score;
        closest = friendly;
      }
    }
    return closest;
  }

  function isUnitDamagedForHeal(unit) {
    if (!unit || unit.dead) {
      return false;
    }
    return unit.health < unit.maxHealth - 0.01;
  }

  function isUnitInHealTurretRange(turretWorldX, turretWorldY, unit, maxRange) {
    var fireRange;
    fireRange = maxRange != null ? maxRange : HEAL_TURRET_FIRE_RANGE;
    return distanceSquared(turretWorldX, turretWorldY, unit.x, unit.y) <= fireRange * fireRange;
  }

  function findClosestDamagedFriendlyForHealTurret(unit, turret, turretWorldX, turretWorldY, maxRange, healerUnitId) {
    var friendlies = getFriendlyUnits();
    var selectedUnit;
    var closest = null;
    var fireRange = maxRange != null ? maxRange : HEAL_TURRET_FIRE_RANGE;
    var maxRangeSq = fireRange * fireRange;
    var bestScore = maxRangeSq + 999999999;
    var index;
    var friendly;
    var score;
    if (truckUnit
      && !truckUnit.dead
      && truckUnit.id !== healerUnitId
      && isUnitDamagedForHeal(truckUnit)
      && isUnitInHealTurretRange(turretWorldX, turretWorldY, truckUnit, maxRange)) {
      return truckUnit;
    }
    if (selectedUnitId >= 0) {
      selectedUnit = getUnitById(selectedUnitId);
      if (selectedUnit
        && !selectedUnit.dead
        && selectedUnit.team === "friendly"
        && selectedUnit.id !== healerUnitId
        && (!truckUnit || selectedUnit.id !== truckUnit.id)
        && isUnitDamagedForHeal(selectedUnit)
        && isUnitInHealTurretRange(turretWorldX, turretWorldY, selectedUnit, maxRange)) {
        return selectedUnit;
      }
    }
    for (index = 0; index < friendlies.length; index += 1) {
      friendly = friendlies[index];
      if (friendly.id === healerUnitId) {
        continue;
      }
      if (truckUnit && friendly.id === truckUnit.id) {
        continue;
      }
      if (selectedUnitId >= 0 && friendly.id === selectedUnitId) {
        continue;
      }
      if (!isUnitDamagedForHeal(friendly)) {
        continue;
      }
      if (!isUnitInHealTurretRange(turretWorldX, turretWorldY, friendly, maxRange)) {
        continue;
      }
      score = getTurretTargetPickScore(unit, turret, turretWorldX, turretWorldY, friendly);
      if (score < bestScore) {
        bestScore = score;
        closest = friendly;
      }
    }
    return closest;
  }

  function findClosestDamagedEnemyForHealTurret(unit, turret, turretWorldX, turretWorldY, maxRange, healerUnitId) {
    var bossTruck;
    var closest = null;
    var enemy;
    var enemies;
    var fireRange;
    var index;
    var maxRangeSq;
    var bestScore;
    var score;
    fireRange = maxRange != null ? maxRange : HEAL_TURRET_FIRE_RANGE;
    maxRangeSq = fireRange * fireRange;
    bestScore = maxRangeSq + 999999999;
    bossTruck = getBossTruckOnField();
    if (bossTruck
      && !bossTruck.dead
      && bossTruck.id !== healerUnitId
      && isUnitDamagedForHeal(bossTruck)
      && isUnitInHealTurretRange(turretWorldX, turretWorldY, bossTruck, maxRange)) {
      return bossTruck;
    }
    enemies = getEnemyUnits();
    for (index = 0; index < enemies.length; index += 1) {
      enemy = enemies[index];
      if (enemy.id === healerUnitId) {
        continue;
      }
      if (bossTruck && enemy.id === bossTruck.id) {
        continue;
      }
      if (!isUnitDamagedForHeal(enemy)) {
        continue;
      }
      if (!isUnitInHealTurretRange(turretWorldX, turretWorldY, enemy, maxRange)) {
        continue;
      }
      score = getTurretTargetPickScore(unit, turret, turretWorldX, turretWorldY, enemy);
      if (score < bestScore) {
        bestScore = score;
        closest = enemy;
      }
    }
    return closest;
  }

  function findClosestOnScreenEnemyFrom(worldX, worldY) {
    var enemies = getEnemyUnits();
    var closest = null;
    var closestDistSq = 999999999;
    var index;
    var enemy;
    var distSq;
    for (index = 0; index < enemies.length; index += 1) {
      enemy = enemies[index];
      if (!isUnitVisibleOnScreen(enemy)) {
        continue;
      }
      distSq = distanceSquared(worldX, worldY, enemy.x, enemy.y);
      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closest = enemy;
      }
    }
    return closest;
  }

  function pickRandomFriendlyTarget() {
    var friendlies = getFriendlyUnits();
    var friendlyIndex;
    if (friendlies.length === 0) {
      return null;
    }
    friendlyIndex = Math.floor(Math.random() * friendlies.length);
    return friendlies[friendlyIndex];
  }

  function getTurretFireRange(turret) {
    if (turret.type === TURRET_TYPE_LASER) {
      return LASER_TURRET_FIRE_RANGE;
    }
    if (turret.type === TURRET_TYPE_HEAL) {
      return HEAL_TURRET_FIRE_RANGE;
    }
    return TURRET_FIRE_RANGE;
  }

  function getUnitTurretFireRange(unit, turret) {
    var fireRange;
    fireRange = getTurretFireRange(turret);
    fireRange *= getUnitStarRangeFactor(unit);
    if (unit.id === selectedUnitId && unit.team === "friendly") {
      if (unit.kind === UNIT_ESCORT || unit.kind === UNIT_TRUCK) {
        fireRange *= SELECTED_ESCORT_FIRE_RANGE_FACTOR;
      }
    }
    return fireRange;
  }

  function getUnitTurretTurnSpeed(unit) {
    var turnSpeed;
    turnSpeed = TURRET_TURN_SPEED;
    if (unit.id === selectedUnitId && unit.team === "friendly") {
      if (unit.kind === UNIT_ESCORT || unit.kind === UNIT_TRUCK) {
        turnSpeed *= SELECTED_UNIT_TURRET_TURN_SPEED_FACTOR;
      }
    }
    return turnSpeed;
  }

  function getTurretFireCooldown(turret) {
    if (isBeamTurretType(turret)) {
      return 0;
    }
    return TURRET_FIRE_COOLDOWN;
  }

  function isBeamTurretOnTarget(aimAngle, targetAngle) {
    return Math.abs(angleDifference(aimAngle, targetAngle)) < 0.3;
  }

  function fireProjectile(fromX, fromY, angle, team, sourceUnit) {
    var damage = PROJECTILE_DAMAGE * getUnitDamageDealtFactor(sourceUnit);
    var sourceUnitId = -1;
    if (sourceUnit) {
      sourceUnitId = sourceUnit.id;
    }
    projectiles.push({
      id: nextProjectileId,
      x: fromX,
      y: fromY,
      angle: angle,
      team: team,
      speed: PROJECTILE_SPEED,
      life: 1.4,
      trailTimer: 0,
      damage: damage,
      sourceUnitId: sourceUnitId
    });
    nextProjectileId += 1;
    spawnMuzzleFlash(fromX, fromY, angle, team, false);
    if (getSynth()) {
      getSynth().playGunfire(team, gameTime);
    }
  }

  function spawnHealBeam(fromX, fromY, toX, toY) {
    visualEffects.push({
      kind: "healBeam",
      x: fromX,
      y: fromY,
      toX: toX,
      toY: toY,
      life: LASER_BEAM_LIFE,
      maxLife: LASER_BEAM_LIFE
    });
  }

  function healUnit(unit, amount) {
    var healthBefore;
    var applied;
    healthBefore = unit.health;
    unit.health += amount;
    if (unit.health > unit.maxHealth) {
      unit.health = unit.maxHealth;
    }
    applied = unit.health - healthBefore;
    if (applied < 0) {
      applied = 0;
    }
    return applied;
  }

  function fireHealBeam(fromX, fromY, targetUnit, deltaSeconds, sourceUnit) {
    var targetX = targetUnit.x;
    var targetY = targetUnit.y;
    var healAmount = HEAL_TURRET_HPS * deltaSeconds;
    var appliedHeal;
    if (healAmount < 0.5) {
      healAmount = 0.5;
    }
    healAmount *= getUnitStarHealFactor(sourceUnit);
    appliedHeal = healUnit(targetUnit, healAmount);
    recordUnitHealDone(sourceUnit, appliedHeal);
    spawnHealBeam(fromX, fromY, targetX, targetY);
    if (getSynth()) {
      getSynth().playHealBurst(gameTime);
    }
  }

  function fireLaser(fromX, fromY, targetUnit, team, deltaSeconds, sourceUnit) {
    var targetX = targetUnit.x;
    var targetY = targetUnit.y;
    var damage = LASER_TURRET_DPS * deltaSeconds;
    if (damage < 0.5) {
      damage = 0.5;
    }
    damage *= getUnitDamageDealtFactor(sourceUnit);
    damageUnit(targetUnit, damage, targetX, targetY, sourceUnit);
    spawnLaserBeam(fromX, fromY, targetX, targetY, team);
    spawnMuzzleFlash(fromX, fromY, Math.atan2(targetY - fromY, targetX - fromX), team, true);
    if (getSynth()) {
      getSynth().playLaserBurst(team, gameTime);
    }
  }

  function spawnLaserBeam(fromX, fromY, toX, toY, team) {
    visualEffects.push({
      kind: "laserBeam",
      x: fromX,
      y: fromY,
      toX: toX,
      toY: toY,
      team: team,
      life: LASER_BEAM_LIFE,
      maxLife: LASER_BEAM_LIFE
    });
  }

  function spawnMuzzleFlash(worldX, worldY, angle, team, isLaser) {
    visualEffects.push({
      kind: "muzzle",
      x: worldX,
      y: worldY,
      angle: angle,
      team: team,
      isLaser: isLaser === true,
      life: isLaser ? 0.1 : 0.14,
      maxLife: isLaser ? 0.1 : 0.14,
      size: isLaser ? 12 : 16
    });
  }

  function spawnHitSparks(worldX, worldY) {
    var index;
    var sparkCount = 8;
    for (index = 0; index < sparkCount; index += 1) {
      visualEffects.push({
        kind: "spark",
        x: worldX,
        y: worldY,
        angle: randomRange(0, TWO_PI),
        speed: randomRange(90, 240),
        life: randomRange(0.12, 0.32),
        maxLife: 0.32,
        size: randomRange(2, 5),
        color: "#ffb060"
      });
    }
    visualEffects.push({
      kind: "hitRing",
      x: worldX,
      y: worldY,
      life: 0.22,
      maxLife: 0.22,
      size: 10
    });
  }

  function spawnCollectBurst(worldX, worldY, red, green, blue) {
    visualEffects.push({
      kind: "collectFlash",
      x: worldX,
      y: worldY,
      life: 0.14,
      maxLife: 0.14,
      size: 16
    });
  }

  function spawnCrystalCollectFlyEffect(fromX, fromY, red, green, blue, crystalSize, crystalRarity) {
    visualEffects.push({
      kind: "collectFly",
      x: fromX,
      y: fromY,
      red: red,
      green: green,
      blue: blue,
      size: crystalSize,
      rarity: crystalRarity != null ? crystalRarity : 1,
      speed: COLLECT_FLY_SPEED,
      life: 0.65,
      maxLife: 0.65
    });
  }

  function spawnDeathExplosion(worldX, worldY, large) {
    var index;
    var sparkCount = large ? 28 : 16;
    var smokeCount = large ? 10 : 6;
    for (index = 0; index < sparkCount; index += 1) {
      visualEffects.push({
        kind: "deathSpark",
        x: worldX,
        y: worldY,
        angle: randomRange(0, TWO_PI),
        speed: randomRange(60, large ? 280 : 190),
        life: randomRange(0.25, 0.65),
        maxLife: 0.65,
        size: randomRange(2, large ? 7 : 5),
        color: index % 3 === 0 ? "#ff7040" : "#ffc860"
      });
    }
    for (index = 0; index < smokeCount; index += 1) {
      visualEffects.push({
        kind: "smoke",
        x: worldX + randomRange(-12, 12),
        y: worldY + randomRange(-12, 12),
        angle: randomRange(0, TWO_PI),
        speed: randomRange(18, 55),
        life: randomRange(0.45, 0.9),
        maxLife: 0.9,
        size: randomRange(8, large ? 22 : 14)
      });
    }
    visualEffects.push({
      kind: "deathFlash",
      x: worldX,
      y: worldY,
      life: large ? 0.32 : 0.22,
      maxLife: large ? 0.32 : 0.22,
      size: large ? 72 : 42
    });
  }

  function spawnFriendlyEscortArrival(worldX, worldY) {
    var index;
    var sparkCount = 14;
    var smokeCount = 4;
    for (index = 0; index < sparkCount; index += 1) {
      visualEffects.push({
        kind: "spawnSpark",
        x: worldX,
        y: worldY,
        angle: randomRange(0, TWO_PI),
        speed: randomRange(55, 175),
        life: randomRange(0.18, 0.42),
        maxLife: 0.42,
        size: randomRange(2, 5)
      });
    }
    for (index = 0; index < smokeCount; index += 1) {
      visualEffects.push({
        kind: "smoke",
        x: worldX + randomRange(-10, 10),
        y: worldY + randomRange(-10, 10),
        angle: randomRange(-0.6, 0.6),
        speed: randomRange(22, 48),
        life: randomRange(0.3, 0.55),
        maxLife: 0.55,
        size: randomRange(6, 12)
      });
    }
    visualEffects.push({
      kind: "spawnRing",
      x: worldX,
      y: worldY,
      life: 0.42,
      maxLife: 0.42,
      size: 8
    });
    visualEffects.push({
      kind: "spawnFlash",
      x: worldX,
      y: worldY,
      life: 0.22,
      maxLife: 0.22,
      size: 24
    });
  }

  function spawnProjectileTrail(worldX, worldY, team) {
    visualEffects.push({
      kind: "projectileTrail",
      x: worldX,
      y: worldY,
      team: team,
      life: 0.16,
      maxLife: 0.16,
      size: randomRange(2, 4)
    });
  }

  function updateTurrets(unit, deltaSeconds) {
    var index;
    var turret;
    var worldPos;
    var muzzlePos;
    var target;
    var targetAngle;
    var deltaAngle;
    var aimAngle;
    var fireRange;
    var fireCooldownDuration;
    var turretTurnSpeed;
    turretTurnSpeed = getUnitTurretTurnSpeed(unit);
    for (index = 0; index < unit.turrets.length; index += 1) {
      turret = unit.turrets[index];
      turret.angle += turret.wobbleSpeed * deltaSeconds;
      worldPos = getUnitTurretWorldPosition(unit, turret);
      muzzlePos = getUnitTurretMuzzleWorldPosition(unit, turret);
      fireRange = getUnitTurretFireRange(unit, turret);
      fireCooldownDuration = getTurretFireCooldown(turret);
      target = null;

      if (turret.type === TURRET_TYPE_HEAL) {
        if (unit.team === "friendly") {
          target = findClosestDamagedFriendlyForHealTurret(unit, turret, worldPos.x, worldPos.y, fireRange, unit.id);
        } else {
          target = findClosestDamagedEnemyForHealTurret(unit, turret, worldPos.x, worldPos.y, fireRange, unit.id);
        }
      } else if (unit.team === "friendly") {
        target = findClosestEnemyForTurret(unit, turret, worldPos.x, worldPos.y, fireRange);
      } else {
        target = findClosestFriendlyForTurret(unit, turret, worldPos.x, worldPos.y, fireRange);
      }

      if (target) {
        targetAngle = Math.atan2(target.y - worldPos.y, target.x - worldPos.x);
        aimAngle = unit.angle + turret.angle;
        deltaAngle = angleDifference(aimAngle, targetAngle);
        turret.angle += clamp(deltaAngle, -turretTurnSpeed * deltaSeconds, turretTurnSpeed * deltaSeconds);
        aimAngle = unit.angle + turret.angle;
        if (turret.type === TURRET_TYPE_LASER) {
          if (isBeamTurretOnTarget(aimAngle, targetAngle)) {
            fireLaser(muzzlePos.x, muzzlePos.y, target, unit.team, deltaSeconds, unit);
          }
        } else if (turret.type === TURRET_TYPE_HEAL) {
          if (isBeamTurretOnTarget(aimAngle, targetAngle)) {
            fireHealBeam(muzzlePos.x, muzzlePos.y, target, deltaSeconds, unit);
          }
        } else if (Math.abs(angleDifference(aimAngle, targetAngle)) < 0.22) {
          turret.fireCooldown -= deltaSeconds;
          if (turret.fireCooldown <= 0) {
            turret.fireCooldown = fireCooldownDuration;
            fireProjectile(muzzlePos.x, muzzlePos.y, aimAngle, unit.team, unit);
          }
        }
      } else {
        turret.fireCooldown = Math.min(turret.fireCooldown, fireCooldownDuration * 0.5);
      }
    }
  }

  function usesFriendlyTruckCapsuleCollider(unit) {
    return unit && !unit.dead && unit.kind === UNIT_TRUCK;
  }

  function getFriendlyTruckCapsuleRadius(unit) {
    return unit.width * FRIENDLY_TRUCK_CAPSULE_RADIUS_FACTOR;
  }

  function getFriendlyTruckCapsuleAt(unit, centerX, centerY) {
    var angle;
    var capsuleRadius;
    var cosAngle;
    var halfLine;
    var sinAngle;
    angle = unit.angle;
    capsuleRadius = getFriendlyTruckCapsuleRadius(unit);
    halfLine = unit.length * 0.5 - capsuleRadius;
    if (halfLine < 0) {
      halfLine = 0;
    }
    cosAngle = Math.cos(angle);
    sinAngle = Math.sin(angle);
    return {
      radius: capsuleRadius,
      end1X: centerX - cosAngle * halfLine,
      end1Y: centerY - sinAngle * halfLine,
      end2X: centerX + cosAngle * halfLine,
      end2Y: centerY + sinAngle * halfLine
    };
  }

  function getDistanceSquaredPointToSegment(pointX, pointY, segStartX, segStartY, segEndX, segEndY) {
    var closestX;
    var closestY;
    var segDx;
    var segDy;
    var segLenSq;
    var t;
    segDx = segEndX - segStartX;
    segDy = segEndY - segStartY;
    segLenSq = segDx * segDx + segDy * segDy;
    if (segLenSq < 0.001) {
      return distanceSquared(pointX, pointY, segStartX, segStartY);
    }
    t = ((pointX - segStartX) * segDx + (pointY - segStartY) * segDy) / segLenSq;
    if (t < 0) {
      t = 0;
    } else if (t > 1) {
      t = 1;
    }
    closestX = segStartX + segDx * t;
    closestY = segStartY + segDy * t;
    return distanceSquared(pointX, pointY, closestX, closestY);
  }

  function getCircleCapsuleSeparation(circleX, circleY, circleRadius, capsule) {
    var dist;
    var distSq;
    var minDist;
    minDist = circleRadius + capsule.radius + UNIT_COLLISION_PADDING;
    distSq = getDistanceSquaredPointToSegment(circleX, circleY, capsule.end1X, capsule.end1Y, capsule.end2X, capsule.end2Y);
    if (distSq < 0.001) {
      return -minDist;
    }
    dist = Math.sqrt(distSq);
    return dist - minDist;
  }

  function getCircleCapsuleOverlapAmount(circleX, circleY, circleRadius, capsule) {
    var separation;
    separation = getCircleCapsuleSeparation(circleX, circleY, circleRadius, capsule);
    if (separation >= 0) {
      return 0;
    }
    return -separation;
  }

  function getCapsuleCircleOverlapPush(circleX, circleY, circleRadius, capsule) {
    var closestX;
    var closestY;
    var dist;
    var distSq;
    var minDist;
    var overlap;
    var pushX;
    var pushY;
    var segDx;
    var segDy;
    var segLenSq;
    var t;
    minDist = circleRadius + capsule.radius + UNIT_COLLISION_PADDING;
    segDx = capsule.end2X - capsule.end1X;
    segDy = capsule.end2Y - capsule.end1Y;
    segLenSq = segDx * segDx + segDy * segDy;
    if (segLenSq < 0.001) {
      closestX = capsule.end1X;
      closestY = capsule.end1Y;
      distSq = distanceSquared(circleX, circleY, closestX, closestY);
    } else {
      t = ((circleX - capsule.end1X) * segDx + (circleY - capsule.end1Y) * segDy) / segLenSq;
      if (t < 0) {
        t = 0;
      } else if (t > 1) {
        t = 1;
      }
      closestX = capsule.end1X + segDx * t;
      closestY = capsule.end1Y + segDy * t;
      distSq = distanceSquared(circleX, circleY, closestX, closestY);
    }
    if (distSq < 0.001) {
      return {
        overlap: minDist,
        pushX: minDist,
        pushY: 0
      };
    }
    dist = Math.sqrt(distSq);
    if (dist >= minDist) {
      return {
        overlap: 0,
        pushX: 0,
        pushY: 0
      };
    }
    overlap = minDist - dist;
    pushX = (circleX - closestX) / dist * overlap;
    pushY = (circleY - closestY) / dist * overlap;
    return {
      overlap: overlap,
      pushX: pushX,
      pushY: pushY
    };
  }

  function getUnitCollisionRadius(unit) {
    if (unit.kind === UNIT_TRUCK) {
      return getFriendlyTruckCapsuleRadius(unit);
    }
    if (unit.kind === UNIT_BOSS_TRUCK) {
      return unit.length * 0.36;
    }
    return unit.radius + 1.5;
  }

  function getCircleCircleSeparation(ax, ay, radiusA, bx, by, radiusB) {
    var distSq;
    var minDist;
    minDist = radiusA + radiusB + UNIT_COLLISION_PADDING;
    distSq = distanceSquared(ax, ay, bx, by);
    if (distSq < 0.001) {
      return -minDist;
    }
    return Math.sqrt(distSq) - minDist;
  }

  function getUnitSeparationAt(unit, testX, testY, other) {
    var capsule;
    if (usesFriendlyTruckCapsuleCollider(unit)) {
      capsule = getFriendlyTruckCapsuleAt(unit, testX, testY);
      return getCircleCapsuleSeparation(other.x, other.y, getUnitCollisionRadius(other), capsule);
    }
    if (usesFriendlyTruckCapsuleCollider(other)) {
      capsule = getFriendlyTruckCapsuleAt(other, other.x, other.y);
      return getCircleCapsuleSeparation(testX, testY, getUnitCollisionRadius(unit), capsule);
    }
    return getCircleCircleSeparation(
      testX,
      testY,
      getUnitCollisionRadius(unit),
      other.x,
      other.y,
      getUnitCollisionRadius(other)
    );
  }

  function getUnitOverlapAmountAt(unit, testX, testY, other) {
    var capsule;
    var separation;
    if (usesFriendlyTruckCapsuleCollider(unit)) {
      capsule = getFriendlyTruckCapsuleAt(unit, testX, testY);
      return getCircleCapsuleOverlapAmount(other.x, other.y, getUnitCollisionRadius(other), capsule);
    }
    if (usesFriendlyTruckCapsuleCollider(other)) {
      capsule = getFriendlyTruckCapsuleAt(other, other.x, other.y);
      return getCircleCapsuleOverlapAmount(testX, testY, getUnitCollisionRadius(unit), capsule);
    }
    separation = getUnitSeparationAt(unit, testX, testY, other);
    if (separation >= 0) {
      return 0;
    }
    return -separation;
  }

  function getTotalUnitOverlapAt(unit, testX, testY) {
    var total = 0;
    var index;
    var other;
    for (index = 0; index < units.length; index += 1) {
      other = units[index];
      if (other.dead || other.id === unit.id) {
        continue;
      }
      total += getUnitOverlapAmountAt(unit, testX, testY, other);
    }
    return total;
  }

  function isUnitMoveBlocked(unit, fromX, fromY, toX, toY) {
    var index;
    var other;
    var overlapFrom;
    var overlapTo;
    for (index = 0; index < units.length; index += 1) {
      other = units[index];
      if (other.dead || other.id === unit.id) {
        continue;
      }
      if (shouldSkipUnitPairCarCollision(unit, other)) {
        continue;
      }
      if (unit.kind === UNIT_TRUCK && isUnitPushable(other) && !isUnitTruckKind(other)) {
        continue;
      }
      overlapFrom = getUnitOverlapAmountAt(unit, fromX, fromY, other);
      overlapTo = getUnitOverlapAmountAt(unit, toX, toY, other);
      if (overlapTo > overlapFrom + UNIT_MOVE_OVERLAP_EPSILON) {
        return true;
      }
    }
    return false;
  }

  function isUnitOverlapSeparationAnchor(unit) {
    if (!unit || unit.dead) {
      return false;
    }
    if (isUnitTruckKind(unit)) {
      return true;
    }
    if (isUnitPlayerSelected(unit)) {
      return true;
    }
    return false;
  }

  function shouldUnitPushOthersDuringMove(unit) {
    if (!unit || unit.dead) {
      return false;
    }
    if (isFriendlyTruckPusher(unit)) {
      return true;
    }
    if (unit.team === "friendly" && unit.kind === UNIT_ESCORT) {
      return true;
    }
    return false;
  }

  function isUnitPlayerSelected(unit) {
    return selectedUnitId >= 0 && unit && unit.id === selectedUnitId;
  }

  function isFriendlyTruckPusher(pusher) {
    return pusher && pusher.kind === UNIT_TRUCK && pusher.team === "friendly";
  }

  function getUnitPushStrengthAsPusher(unit) {
    if (isFriendlyTruckPusher(unit)) {
      return TRUCK_PUSH_STRENGTH_FACTOR;
    }
    if (isUnitPlayerSelected(unit)) {
      return SELECTED_UNIT_PUSH_STRENGTH_FACTOR;
    }
    return 1;
  }

  function getUnitPushMaxPerFrame(pusher) {
    if (isFriendlyTruckPusher(pusher)) {
      return TRUCK_PUSH_MAX_PER_FRAME;
    }
    return UNIT_PUSH_MAX_PER_FRAME;
  }

  function applyUnitForcePushFromPusher(other, pushX, pushY, pusher, syncDestination) {
    var nextX;
    var nextY;
    var sepBefore;
    var sepAfter;
    if (Math.abs(pushX) < 0.01 && Math.abs(pushY) < 0.01) {
      return false;
    }
    nextX = other.x + pushX;
    nextY = other.y + pushY;
    sepBefore = getUnitSeparationAt(other, other.x, other.y, pusher);
    sepAfter = getUnitSeparationAt(other, nextX, nextY, pusher);
    if (sepAfter >= sepBefore - UNIT_MOVE_OVERLAP_EPSILON) {
      other.x = nextX;
      other.y = nextY;
      if (syncDestination) {
        other.destinationX += pushX;
        other.destinationY += pushY;
      }
      return true;
    }
    return false;
  }

  function isUnitPushable(unit) {
    return !isUnitOverlapSeparationAnchor(unit);
  }

  function getUnitPushResistance(unit) {
    if (!isUnitPushable(unit)) {
      return 0;
    }
    return 1;
  }

  function capPushVector(pushX, pushY, maxLen) {
    var pushLen = Math.sqrt(pushX * pushX + pushY * pushY);
    if (pushLen <= maxLen || pushLen < 0.001) {
      return { x: pushX, y: pushY };
    }
    var scale = maxLen / pushLen;
    return { x: pushX * scale, y: pushY * scale };
  }

  function applyUnitPushIfImproves(other, pushX, pushY, pusher, syncDestination) {
    var nextX;
    var nextY;
    var overlapBefore;
    var overlapAfter;
    var sepBefore;
    var sepAfter;
    if (Math.abs(pushX) < 0.01 && Math.abs(pushY) < 0.01) {
      return false;
    }
    nextX = other.x + pushX;
    nextY = other.y + pushY;
    overlapBefore = getTotalUnitOverlapAt(other, other.x, other.y);
    overlapAfter = getTotalUnitOverlapAt(other, nextX, nextY);
    if (overlapAfter < overlapBefore - UNIT_MOVE_OVERLAP_EPSILON) {
      other.x = nextX;
      other.y = nextY;
      if (syncDestination) {
        other.destinationX += pushX;
        other.destinationY += pushY;
      }
      return true;
    }
    if (overlapAfter > overlapBefore + UNIT_MOVE_OVERLAP_EPSILON) {
      return false;
    }
    sepBefore = getUnitSeparationAt(other, other.x, other.y, pusher);
    sepAfter = getUnitSeparationAt(other, nextX, nextY, pusher);
    if (sepAfter > sepBefore + UNIT_MOVE_OVERLAP_EPSILON) {
      other.x = nextX;
      other.y = nextY;
      if (syncDestination) {
        other.destinationX += pushX;
        other.destinationY += pushY;
      }
      return true;
    }
    return false;
  }

  function resolvePairUnitSeparation(unit, other, smoothFactor) {
    var capsule;
    var deltaX;
    var deltaY;
    var dist;
    var distSq;
    var fallbackAngle;
    var minDist;
    var otherAnchored;
    var otherRadius;
    var overlap;
    var pairSmoothFactor;
    var push;
    var sepX;
    var sepY;
    var unitAnchored;
    var unitRadius;
    var unitShare;
    var otherShare;
    if (unit.dead || other.dead) {
      return;
    }
    if (shouldSkipUnitPairCarCollision(unit, other)) {
      return;
    }
    unitAnchored = isUnitOverlapSeparationAnchor(unit);
    otherAnchored = isUnitOverlapSeparationAnchor(other);
    if (unitAnchored && otherAnchored) {
      return;
    }
    pairSmoothFactor = smoothFactor;
    unitRadius = getUnitCollisionRadius(unit);
    otherRadius = getUnitCollisionRadius(other);
    if (usesFriendlyTruckCapsuleCollider(unit)) {
      capsule = getFriendlyTruckCapsuleAt(unit, unit.x, unit.y);
      push = getCapsuleCircleOverlapPush(other.x, other.y, otherRadius, capsule);
      if (push.overlap <= 0) {
        return;
      }
      sepX = push.pushX * pairSmoothFactor;
      sepY = push.pushY * pairSmoothFactor;
      if (Math.abs(sepX) + Math.abs(sepY) > UNIT_SEPARATION_MAX_PER_STEP) {
        dist = Math.sqrt(sepX * sepX + sepY * sepY);
        sepX = sepX / dist * UNIT_SEPARATION_MAX_PER_STEP;
        sepY = sepY / dist * UNIT_SEPARATION_MAX_PER_STEP;
      }
      unitShare = 0.5;
      otherShare = 0.5;
      if (unitAnchored) {
        unitShare = 0;
        otherShare = 1;
      } else if (otherAnchored) {
        unitShare = 1;
        otherShare = 0;
      }
      if (unitShare > 0) {
        unit.x -= sepX * unitShare;
        unit.y -= sepY * unitShare;
      }
      if (otherShare > 0) {
        other.x += sepX * otherShare;
        other.y += sepY * otherShare;
      }
      return;
    }
    if (usesFriendlyTruckCapsuleCollider(other)) {
      capsule = getFriendlyTruckCapsuleAt(other, other.x, other.y);
      push = getCapsuleCircleOverlapPush(unit.x, unit.y, unitRadius, capsule);
      if (push.overlap <= 0) {
        return;
      }
      sepX = push.pushX * pairSmoothFactor;
      sepY = push.pushY * pairSmoothFactor;
      if (Math.abs(sepX) + Math.abs(sepY) > UNIT_SEPARATION_MAX_PER_STEP) {
        dist = Math.sqrt(sepX * sepX + sepY * sepY);
        sepX = sepX / dist * UNIT_SEPARATION_MAX_PER_STEP;
        sepY = sepY / dist * UNIT_SEPARATION_MAX_PER_STEP;
      }
      unitShare = 0.5;
      otherShare = 0.5;
      if (otherAnchored) {
        unitShare = 1;
        otherShare = 0;
      } else if (unitAnchored) {
        unitShare = 0;
        otherShare = 1;
      }
      if (unitShare > 0) {
        unit.x -= sepX * unitShare;
        unit.y -= sepY * unitShare;
      }
      if (otherShare > 0) {
        other.x += sepX * otherShare;
        other.y += sepY * otherShare;
      }
      return;
    }
    minDist = unitRadius + otherRadius + UNIT_COLLISION_PADDING;
    deltaX = unit.x - other.x;
    deltaY = unit.y - other.y;
    distSq = deltaX * deltaX + deltaY * deltaY;
    if (distSq >= minDist * minDist) {
      return;
    }
    if (distSq < 0.001) {
      fallbackAngle = ((unit.id * 17 + other.id * 31) % 360) * (TWO_PI / 360);
      deltaX = Math.cos(fallbackAngle);
      deltaY = Math.sin(fallbackAngle);
      dist = 1;
    } else {
      dist = Math.sqrt(distSq);
      deltaX /= dist;
      deltaY /= dist;
    }
    overlap = (minDist - dist) * pairSmoothFactor;
    if (overlap > UNIT_SEPARATION_MAX_PER_STEP) {
      overlap = UNIT_SEPARATION_MAX_PER_STEP;
    }
    sepX = deltaX * overlap;
    sepY = deltaY * overlap;
    unitShare = 0.5;
    otherShare = 0.5;
    if (unitAnchored) {
      unitShare = 0;
      otherShare = 1;
    } else if (otherAnchored) {
      unitShare = 1;
      otherShare = 0;
    }
    if (unitShare > 0) {
      unit.x += sepX * unitShare;
      unit.y += sepY * unitShare;
    }
    if (otherShare > 0) {
      other.x -= sepX * otherShare;
      other.y -= sepY * otherShare;
    }
  }

  function getObstacleDeflectionSign(pusher, other, dirX, dirY) {
    var cross = dirX * (other.y - pusher.y) - dirY * (other.x - pusher.x);
    if (cross >= 0) {
      return 1;
    }
    return -1;
  }

  function tryPushUnitFromPusher(other, pushX, pushY, pusher, syncDestination) {
    var capped;
    var smoothX;
    var smoothY;
    var overlap;
    var deltaX;
    var deltaY;
    var distSq;
    var dist;
    var awayX;
    var awayY;
    var dirX;
    var dirY;
    var perpX;
    var perpY;
    var deflectSign;
    var fallbackPushX;
    var fallbackPushY;
    var pushSmooth;
    if (!other || other.dead || !isUnitPushable(other)) {
      return false;
    }
    capped = capPushVector(pushX, pushY, getUnitPushMaxPerFrame(pusher));
    pushSmooth = isFriendlyTruckPusher(pusher) ? 1 : UNIT_MOVE_PUSH_SMOOTH;
    smoothX = capped.x * pushSmooth;
    smoothY = capped.y * pushSmooth;
    if (isFriendlyTruckPusher(pusher)) {
      if (applyUnitForcePushFromPusher(other, smoothX, smoothY, pusher, syncDestination)) {
        return true;
      }
    } else if (applyUnitPushIfImproves(other, smoothX, smoothY, pusher, syncDestination)) {
      return true;
    }
    overlap = getUnitOverlapAmountAt(pusher, pusher.x, pusher.y, other);
    if (overlap > UNIT_MOVE_OVERLAP_EPSILON) {
      deltaX = other.x - pusher.x;
      deltaY = other.y - pusher.y;
      distSq = deltaX * deltaX + deltaY * deltaY;
      if (distSq > 0.001) {
        dist = Math.sqrt(distSq);
        awayX = deltaX / dist;
        awayY = deltaY / dist;
        if (isFriendlyTruckPusher(pusher)) {
          if (applyUnitForcePushFromPusher(other, awayX * overlap, awayY * overlap, pusher, syncDestination)) {
            return true;
          }
        } else if (applyUnitPushIfImproves(other, awayX * overlap * UNIT_SEPARATION_SMOOTH, awayY * overlap * UNIT_SEPARATION_SMOOTH, pusher, syncDestination)) {
          return true;
        }
      }
    }
    dist = Math.sqrt(smoothX * smoothX + smoothY * smoothY);
    if (dist < 0.001) {
      dist = UNIT_DEFLECTION_PUSH_MIN;
      dirX = 1;
      dirY = 0;
    } else {
      dirX = smoothX / dist;
      dirY = smoothY / dist;
    }
    deflectSign = getObstacleDeflectionSign(pusher, other, dirX, dirY);
    perpX = -dirY * deflectSign;
    perpY = dirX * deflectSign;
    fallbackPushX = perpX * dist * UNIT_DEFLECTION_PUSH_STRENGTH;
    fallbackPushY = perpY * dist * UNIT_DEFLECTION_PUSH_STRENGTH;
    if (isFriendlyTruckPusher(pusher)) {
      if (applyUnitForcePushFromPusher(other, fallbackPushX, fallbackPushY, pusher, syncDestination)) {
        return true;
      }
      if (applyUnitForcePushFromPusher(other, -fallbackPushX, -fallbackPushY, pusher, syncDestination)) {
        return true;
      }
    } else if (applyUnitPushIfImproves(other, fallbackPushX, fallbackPushY, pusher, syncDestination)) {
      return true;
    }
    if (applyUnitPushIfImproves(other, -fallbackPushX, -fallbackPushY, pusher, syncDestination)) {
      return true;
    }
    return false;
  }

  function deflectBlockingObstaclesForMove(unit, dirX, dirY, pushAmount) {
    var index;
    var other;
    var targetX;
    var targetY;
    var overlapFrom;
    var overlapTo;
    var pushX;
    var pushY;
    var deltaX;
    var deltaY;
    var distSq;
    var dist;
    var awayX;
    var awayY;
    var didPush = false;
    var shouldPush;
    if (!shouldUnitPushOthersDuringMove(unit)) {
      return false;
    }
    targetX = unit.x + dirX * pushAmount;
    targetY = unit.y + dirY * pushAmount;
    for (index = 0; index < units.length; index += 1) {
      other = units[index];
      if (other.dead || other.id === unit.id || !isUnitPushable(other)) {
        continue;
      }
      overlapFrom = getUnitOverlapAmountAt(unit, unit.x, unit.y, other);
      overlapTo = getUnitOverlapAmountAt(unit, targetX, targetY, other);
      shouldPush = overlapFrom > UNIT_MOVE_OVERLAP_EPSILON;
      if (!shouldPush) {
        shouldPush = overlapTo > overlapFrom + UNIT_MOVE_OVERLAP_EPSILON;
      }
      if (!shouldPush) {
        shouldPush = getUnitSeparationAt(unit, unit.x, unit.y, other) < pushAmount * 1.5;
      }
      if (!shouldPush) {
        continue;
      }
      deltaX = other.x - unit.x;
      deltaY = other.y - unit.y;
      distSq = deltaX * deltaX + deltaY * deltaY;
      awayX = 0;
      awayY = 0;
      if (distSq > 0.001) {
        dist = Math.sqrt(distSq);
        awayX = deltaX / dist;
        awayY = deltaY / dist;
      }
      pushX = dirX * pushAmount * UNIT_DEFLECTION_PUSH_STRENGTH;
      pushY = dirY * pushAmount * UNIT_DEFLECTION_PUSH_STRENGTH;
      if (overlapFrom > UNIT_MOVE_OVERLAP_EPSILON) {
        pushX += awayX * overlapFrom * 0.65;
        pushY += awayY * overlapFrom * 0.65;
      }
      if (tryPushUnitFromPusher(other, pushX, pushY, unit, true)) {
        didPush = true;
      }
    }
    return didPush;
  }

  function tryPushBlockingUnitsForMove(unit, dirX, dirY, pushAmount) {
    var index;
    var other;
    var targetX;
    var targetY;
    var overlapFrom;
    var overlapTo;
    var pushX;
    var pushY;
    var deltaX;
    var deltaY;
    var distSq;
    var dist;
    var awayX;
    var awayY;
    var resistance;
    var didPush = false;
    var shouldPush;
    var pushStrengthFactor;
    if (!shouldUnitPushOthersDuringMove(unit)) {
      return false;
    }
    targetX = unit.x + dirX * pushAmount;
    targetY = unit.y + dirY * pushAmount;
    pushStrengthFactor = getUnitPushStrengthAsPusher(unit);
    for (index = 0; index < units.length; index += 1) {
      other = units[index];
      if (other.dead || other.id === unit.id) {
        continue;
      }
      overlapFrom = getUnitOverlapAmountAt(unit, unit.x, unit.y, other);
      overlapTo = getUnitOverlapAmountAt(unit, targetX, targetY, other);
      shouldPush = overlapFrom > UNIT_MOVE_OVERLAP_EPSILON;
      if (!shouldPush) {
        shouldPush = overlapTo > overlapFrom + UNIT_MOVE_OVERLAP_EPSILON;
      }
      if (!shouldPush) {
        continue;
      }
      resistance = getUnitPushResistance(other);
      if (resistance <= 0.001) {
        continue;
      }
      pushX = dirX * pushAmount * UNIT_PUSH_TRANSFER_STRENGTH * resistance * pushStrengthFactor;
      pushY = dirY * pushAmount * UNIT_PUSH_TRANSFER_STRENGTH * resistance * pushStrengthFactor;
      deltaX = other.x - unit.x;
      deltaY = other.y - unit.y;
      distSq = deltaX * deltaX + deltaY * deltaY;
      if (distSq > 0.001) {
        dist = Math.sqrt(distSq);
        awayX = deltaX / dist;
        awayY = deltaY / dist;
        pushX += awayX * pushAmount * UNIT_PUSH_RADIAL_STRENGTH * resistance * pushStrengthFactor;
        pushY += awayY * pushAmount * UNIT_PUSH_RADIAL_STRENGTH * resistance * pushStrengthFactor;
      }
      if (overlapFrom > UNIT_MOVE_OVERLAP_EPSILON && distSq > 0.001) {
        pushX += awayX * overlapFrom * 0.55 * resistance * pushStrengthFactor;
        pushY += awayY * overlapFrom * 0.55 * resistance * pushStrengthFactor;
      }
      if (tryPushUnitFromPusher(other, pushX, pushY, unit, true)) {
        didPush = true;
      }
    }
    return didPush;
  }

  function isSpawnPositionBlocked(worldX, worldY, spawnRadius) {
    var capsule;
    var index;
    var other;
    var otherRadius;
    var minDist;
    for (index = 0; index < units.length; index += 1) {
      other = units[index];
      if (other.dead) {
        continue;
      }
      if (usesFriendlyTruckCapsuleCollider(other)) {
        capsule = getFriendlyTruckCapsuleAt(other, other.x, other.y);
        if (getCircleCapsuleOverlapAmount(worldX, worldY, spawnRadius, capsule) > 0) {
          return true;
        }
        continue;
      }
      otherRadius = getUnitCollisionRadius(other);
      minDist = spawnRadius + otherRadius + UNIT_COLLISION_PADDING;
      if (distanceSquared(worldX, worldY, other.x, other.y) < minDist * minDist) {
        return true;
      }
    }
    return false;
  }

  function getEscortSpawnPositionBehindTruck() {
    return {
      x: truckUnit.x - 72 - randomRange(0, 36),
      y: truckUnit.y + randomRange(-80, 80)
    };
  }

  function getRandomEscortDestinationAroundTruck() {
    var attempt;
    var angle;
    var radius;
    var destinationX;
    var destinationY;
    var spawnRadius = CAR_RADIUS + 3;
    for (attempt = 0; attempt < ESCORT_SPAWN_ATTEMPTS; attempt += 1) {
      angle = randomRange(0, TWO_PI);
      radius = randomRange(ESCORT_SPAWN_RADIUS_MIN, ESCORT_SPAWN_RADIUS_MAX);
      destinationX = truckUnit.x + Math.cos(angle) * radius;
      destinationY = truckUnit.y + Math.sin(angle) * radius;
      if (!isSpawnPositionBlocked(destinationX, destinationY, spawnRadius)) {
        return { x: destinationX, y: destinationY };
      }
    }
    angle = randomRange(0, TWO_PI);
    radius = ESCORT_SPAWN_RADIUS_MAX + randomRange(0, 96);
    destinationX = truckUnit.x + Math.cos(angle) * radius;
    destinationY = truckUnit.y + Math.sin(angle) * radius;
    return { x: destinationX, y: destinationY };
  }

  function getMoveCandidateScore(unit, candidateX, candidateY) {
    return distanceSquared(candidateX, candidateY, unit.destinationX, unit.destinationY);
  }

  function buildMoveCandidates(unit, step, dirX, dirY) {
    var candidates = [];
    var lateralStep = step * 0.92;
    var forwardStep = step * 0.75;
    var sideStep = step * 0.85;
    candidates.push({
      x: unit.x + dirX * step,
      y: unit.y + dirY * step
    });
    candidates.push({
      x: unit.x + dirX * lateralStep,
      y: unit.y + dirY * lateralStep
    });
    candidates.push({
      x: unit.x,
      y: unit.y + dirY * step
    });
    candidates.push({
      x: unit.x + dirX * step,
      y: unit.y
    });
    candidates.push({
      x: unit.x + dirX * forwardStep,
      y: unit.y - sideStep
    });
    candidates.push({
      x: unit.x + dirX * forwardStep,
      y: unit.y + sideStep
    });
    candidates.push({
      x: unit.x,
      y: unit.y - sideStep
    });
    candidates.push({
      x: unit.x,
      y: unit.y + sideStep
    });
    candidates.push({
      x: unit.x + dirX * forwardStep * 0.55,
      y: unit.y - sideStep * 1.15
    });
    candidates.push({
      x: unit.x + dirX * forwardStep * 0.55,
      y: unit.y + sideStep * 1.15
    });
    return candidates;
  }

  function moveUnitTowardDestination(unit, deltaSeconds) {
    unit.angle = UNIT_FACE_ANGLE;
    var deltaX = unit.destinationX - unit.x;
    var deltaY = unit.destinationY - unit.y;
    var distSq = deltaX * deltaX + deltaY * deltaY;
    var arriveDist = isUnitTruckKind(unit) ? 8 : 5;
    if (distSq <= arriveDist * arriveDist) {
      return;
    }
    var dist = Math.sqrt(distSq);
    var dirX = deltaX / dist;
    var step = getUnitMoveSpeedForHorizontalDirection(unit, dirX) * deltaSeconds;
    var dirY = deltaY / dist;
    var candidates = buildMoveCandidates(unit, step, dirX, dirY);
    var candidateIndex;
    var candidate;
    var bestCandidate = null;
    var bestScore = 999999999;
    var score;
    var attemptIndex;
    var pushAmount;
    for (attemptIndex = 0; attemptIndex < UNIT_MOVE_PUSH_ATTEMPTS; attemptIndex += 1) {
      pushAmount = step;
      if (attemptIndex > 0) {
        pushAmount = step * (1 + attemptIndex * 0.08);
      }
      if (isFriendlyTruckPusher(unit)) {
        tryPushBlockingUnitsForMove(unit, dirX, dirY, pushAmount);
      } else if (shouldUnitPushOthersDuringMove(unit)) {
        deflectBlockingObstaclesForMove(unit, dirX, dirY, pushAmount);
      }
      bestCandidate = null;
      bestScore = 999999999;
      for (candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
        candidate = candidates[candidateIndex];
        if (!isUnitMoveBlocked(unit, unit.x, unit.y, candidate.x, candidate.y)) {
          score = getMoveCandidateScore(unit, candidate.x, candidate.y);
          if (score < bestScore) {
            bestScore = score;
            bestCandidate = candidate;
          }
        }
      }
      if (bestCandidate) {
        unit.x = bestCandidate.x;
        unit.y = bestCandidate.y;
        return;
      }
    }
    if (shouldUnitPushOthersDuringMove(unit)) {
      deflectBlockingObstaclesForMove(unit, dirX, dirY, step * 1.35);
    }
    if (!isUnitMoveBlocked(unit, unit.x, unit.y, unit.x + dirX * step, unit.y + dirY * step)) {
      unit.x += dirX * step;
      unit.y += dirY * step;
    }
  }

  function resolveUnitOverlaps() {
    var passIndex;
    var unitIndex;
    var otherIndex;
    for (passIndex = 0; passIndex < UNIT_SEPARATION_PASS_COUNT; passIndex += 1) {
      for (unitIndex = 0; unitIndex < units.length; unitIndex += 1) {
        if (units[unitIndex].dead) {
          continue;
        }
        for (otherIndex = unitIndex + 1; otherIndex < units.length; otherIndex += 1) {
          resolvePairUnitSeparation(units[unitIndex], units[otherIndex], UNIT_SEPARATION_SMOOTH);
        }
      }
    }
  }

  function assignEnemyFollowTarget(enemy) {
    var target = pickRandomFriendlyTarget();
    if (target) {
      enemy.chaseTargetId = target.id;
    } else {
      enemy.chaseTargetId = -1;
    }
  }

  function getEnemyFollowTarget(enemy) {
    var target = null;
    if (enemy.chaseTargetId >= 0) {
      target = getUnitById(enemy.chaseTargetId);
    }
    if (!target) {
      assignEnemyFollowTarget(enemy);
      if (enemy.chaseTargetId >= 0) {
        target = getUnitById(enemy.chaseTargetId);
      }
    }
    return target;
  }

  function updateEnemyTargets() {
    var enemies = getEnemyUnits();
    var enemyIndex;
    var enemy;
    var target;
    var followDestination;
    for (enemyIndex = 0; enemyIndex < enemies.length; enemyIndex += 1) {
      enemy = enemies[enemyIndex];
      target = getEnemyFollowTarget(enemy);
      if (!target) {
        continue;
      }
      followDestination = getFollowDestinationNearTarget(enemy, target);
      enemy.destinationX = followDestination.x;
      enemy.destinationY = followDestination.y;
    }
  }

  function updateFriendlyEscortTargets() {
    var index;
    var unit;
    var closestEnemy;
    var followDestination;
    for (index = 0; index < units.length; index += 1) {
      unit = units[index];
      if (unit.dead || unit.team !== "friendly" || unit.kind !== UNIT_ESCORT) {
        continue;
      }
      if (unit.id === selectedUnitId && unit.kind === UNIT_ESCORT) {
        continue;
      }
      if (unit.combatMode === COMBAT_MODE_ATTACK) {
        closestEnemy = findClosestOnScreenEnemyFrom(unit.x, unit.y);
        if (closestEnemy) {
          followDestination = getFollowDestinationNearTarget(unit, closestEnemy);
          unit.destinationX = followDestination.x;
          unit.destinationY = followDestination.y;
          continue;
        }
        applyTruckGuardDestinationToUnit(unit);
        continue;
      }
    }
  }

  function getDistanceSpawnTier() {
    return 1 + Math.floor(distanceTraveled / ENEMY_SPAWN_DISTANCE_KM_STEP);
  }

  function getMinEnemySpawnCount() {
    return getDistanceSpawnTier();
  }

  function getMaxEnemySpawnCount() {
    return getDistanceSpawnTier();
  }

  function getEnemySpawnWaveCount() {
    var minCount = getMinEnemySpawnCount();
    var maxCount = getMaxEnemySpawnCount();
    if (minCount > maxCount) {
      minCount = maxCount;
    }
    if (minCount < 1) {
      minCount = 1;
    }
    return minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
  }

  function getEnemySpawnDirectionVector(directionIndex) {
    var angle;
    if (directionIndex === 0) {
      angle = 0;
    } else if (directionIndex === 1) {
      angle = Math.PI;
    } else if (directionIndex === 2) {
      angle = -Math.PI * 0.5;
    } else if (directionIndex === 3) {
      angle = Math.PI * 0.5;
    } else if (directionIndex === 4) {
      angle = -Math.PI * 0.25;
    } else if (directionIndex === 5) {
      angle = Math.PI * 0.25;
    } else if (directionIndex === 6) {
      angle = -Math.PI * 0.75;
    } else {
      angle = Math.PI * 0.75;
    }
    return {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };
  }

  function clampEnemySpawnScreenPosition(screenX, screenY) {
    var margin = ENEMY_SPAWN_SCREEN_EDGE_MARGIN;
    var clampedX = screenX;
    var clampedY = screenY;
    if (clampedX < margin) {
      clampedX = margin;
    } else if (clampedX > width - margin) {
      clampedX = width - margin;
    }
    if (clampedY < margin) {
      clampedY = margin;
    } else if (clampedY > height - margin) {
      clampedY = height - margin;
    }
    return {
      x: clampedX,
      y: clampedY
    };
  }

  function getEnemySpawnWaveAnchorScreenPosition(directionIndex) {
    var direction;
    var edge;
    var edgeMargin;
    direction = getEnemySpawnDirectionVector(directionIndex);
    edgeMargin = ENEMY_SPAWN_SCREEN_EDGE_MARGIN + randomRange(0, 36);
    edge = getScreenEdgePointFromCenter(direction.x, direction.y, edgeMargin);
    return {
      x: edge.x,
      y: edge.y
    };
  }

  function getEnemySpawnClusterScreenPosition(anchorScreenX, anchorScreenY) {
    var angle;
    var clamped;
    var dist;
    var screenX;
    var screenY;
    angle = randomRange(0, TWO_PI);
    dist = randomRange(0, ENEMY_SPAWN_WAVE_CLUSTER_RADIUS);
    screenX = anchorScreenX + Math.cos(angle) * dist;
    screenY = anchorScreenY + Math.sin(angle) * dist;
    clamped = clampEnemySpawnScreenPosition(screenX, screenY);
    return {
      x: clamped.x,
      y: clamped.y
    };
  }

  function rollEnemySpawnWaveCluster() {
    var anchorScreen;
    var directionIndex;
    var screenPos;
    var spawnCount;
    var spawnIndex;
    var spawns = [];
    directionIndex = Math.floor(Math.random() * ENEMY_SPAWN_DIRECTION_COUNT);
    anchorScreen = getEnemySpawnWaveAnchorScreenPosition(directionIndex);
    spawnCount = getEnemySpawnWaveCount();
    for (spawnIndex = 0; spawnIndex < spawnCount; spawnIndex += 1) {
      screenPos = getEnemySpawnClusterScreenPosition(anchorScreen.x, anchorScreen.y);
      spawns.push({
        screenX: screenPos.x,
        screenY: screenPos.y
      });
    }
    return {
      anchorScreenX: anchorScreen.x,
      anchorScreenY: anchorScreen.y,
      directionIndex: directionIndex,
      spawns: spawns
    };
  }

  function getEnemySpawnPositionFromScreen(screenX, screenY) {
    return screenToWorld(screenX, screenY);
  }

  function getBossTruckOnField() {
    var index;
    var unit;
    for (index = 0; index < units.length; index += 1) {
      unit = units[index];
      if (!unit.dead && unit.kind === UNIT_BOSS_TRUCK) {
        return unit;
      }
    }
    return null;
  }

  function updateTruckDamageVignette() {
    var healthFraction;
    var opacity;
    if (!truckDamageVignette) {
      return;
    }
    if (!truckUnit || truckUnit.dead || !isPlaying()) {
      truckDamageVignette.classList.add("hidden");
      truckDamageVignette.style.opacity = "0";
      return;
    }
    healthFraction = truckUnit.health / truckUnit.maxHealth;
    opacity = (1 - healthFraction) * 0.5;
    if (truckUnit.hitFlash > 0) {
      opacity += truckUnit.hitFlash * 2.2;
    }
    if (opacity > 0.82) {
      opacity = 0.82;
    }
    if (opacity > 0.03) {
      truckDamageVignette.classList.remove("hidden");
      truckDamageVignette.style.opacity = String(opacity);
    } else {
      truckDamageVignette.classList.add("hidden");
      truckDamageVignette.style.opacity = "0";
    }
  }

  function spawnEnemyTruckAtPosition(worldX, worldY) {
    var enemyTruck;
    if (getBossTruckOnField()) {
      return false;
    }
    enemyTruck = createBossTruckUnit(worldX, worldY);
    setUnitSpawnBonusStars(enemyTruck, rollEnemySpawnStarCount());
    enemyTruck.chaseTargetId = truckUnit.id;
    enemyTruck.destinationX = truckUnit.x;
    enemyTruck.destinationY = truckUnit.y;
    units.push(enemyTruck);
    spawnDeathExplosion(worldX, worldY, true);
    if (getSynth()) {
      getSynth().playGameStart();
    }
    return true;
  }

  function spawnEnemyAtPosition(worldX, worldY) {
    var enemies = getEnemyUnits();
    if (enemies.length >= ENEMY_MAX_COUNT) {
      return false;
    }
    if (Math.random() < getEnemyTruckSpawnChance()) {
      if (spawnEnemyTruckAtPosition(worldX, worldY)) {
        return true;
      }
    }
    var enemy = createCarUnit(UNIT_ENEMY, worldX, worldY, "enemy");
    setUnitSpawnBonusStars(enemy, rollEnemySpawnStarCount());
    assignEnemyFollowTarget(enemy);
    units.push(enemy);
    return true;
  }

  function spawnEnemyWaveCluster(cluster) {
    var spawnIndex;
    var spawnPos;
    var spawnScreen;
    for (spawnIndex = 0; spawnIndex < cluster.spawns.length; spawnIndex += 1) {
      spawnScreen = cluster.spawns[spawnIndex];
      spawnPos = getEnemySpawnPositionFromScreen(spawnScreen.screenX, spawnScreen.screenY);
      if (!spawnEnemyAtPosition(spawnPos.x, spawnPos.y)) {
        return false;
      }
    }
    return true;
  }

  function getPendingWarningWorldPosition(warning) {
    return screenToWorld(warning.screenX, warning.screenY);
  }

  function rollPendingSpawnWave() {
    var cluster;
    var spawnIndex;
    var spawnScreen;
    pendingSpawnWarnings.length = 0;
    pendingSpawnWaveAnchor = null;
    cluster = rollEnemySpawnWaveCluster();
    pendingSpawnWaveAnchor = {
      screenX: cluster.anchorScreenX,
      screenY: cluster.anchorScreenY,
      directionIndex: cluster.directionIndex,
      progress: 0
    };
    for (spawnIndex = 0; spawnIndex < cluster.spawns.length; spawnIndex += 1) {
      spawnScreen = cluster.spawns[spawnIndex];
      pendingSpawnWarnings.push({
        screenX: spawnScreen.screenX,
        screenY: spawnScreen.screenY,
        progress: 0
      });
    }
  }

  function updatePendingSpawnWarnings() {
    var progress;
    var index;
    if (enemySpawnTimer > ENEMY_SPAWN_WARNING_DURATION) {
      if (pendingSpawnWarnings.length > 0) {
        pendingSpawnWarnings.length = 0;
      }
      pendingSpawnWaveAnchor = null;
      return;
    }
    if (enemySpawnTimer <= 0) {
      return;
    }
    if (pendingSpawnWarnings.length === 0) {
      rollPendingSpawnWave();
    }
    progress = 1 - (enemySpawnTimer / ENEMY_SPAWN_WARNING_DURATION);
    if (progress < 0) {
      progress = 0;
    }
    if (progress > 1) {
      progress = 1;
    }
    for (index = 0; index < pendingSpawnWarnings.length; index += 1) {
      pendingSpawnWarnings[index].progress = progress;
    }
    if (pendingSpawnWaveAnchor) {
      pendingSpawnWaveAnchor.progress = progress;
    }
  }

  function spawnEnemyWaveFromPending() {
    var index;
    var warning;
    var spawnPos;
    if (pendingSpawnWarnings.length === 0) {
      rollPendingSpawnWave();
    }
    for (index = 0; index < pendingSpawnWarnings.length; index += 1) {
      warning = pendingSpawnWarnings[index];
      spawnPos = getPendingWarningWorldPosition(warning);
      if (!spawnEnemyAtPosition(spawnPos.x, spawnPos.y)) {
        break;
      }
    }
    pendingSpawnWarnings.length = 0;
    pendingSpawnWaveAnchor = null;
  }

  function getRocketStrikeImpactWorldPosition() {
    if (!pendingRocketStrikeWarning || !truckUnit || truckUnit.dead) {
      return { x: 0, y: 0 };
    }
    return {
      x: pendingRocketStrikeWarning.worldX,
      y: pendingRocketStrikeWarning.worldY
    };
  }

  function rollPendingRocketStrikeWarning() {
    var horizontalSpread;
    var verticalSpread;
    if (!truckUnit || truckUnit.dead) {
      pendingRocketStrikeWarning = null;
      return;
    }
    horizontalSpread = width * ROCKET_STRIKE_SCREEN_OFFSET_X_FACTOR;
    verticalSpread = height * ROCKET_STRIKE_SCREEN_OFFSET_Y_FACTOR;
    pendingRocketStrikeWarning = {
      worldX: truckUnit.x + randomRange(-horizontalSpread, horizontalSpread),
      worldY: truckUnit.y + randomRange(-verticalSpread, verticalSpread),
      progress: 0
    };
  }

  function updatePendingRocketStrikeWarning() {
    var progress;
    if (rocketStrikeSpawnTimer > ROCKET_STRIKE_WARNING_DURATION) {
      pendingRocketStrikeWarning = null;
      return;
    }
    if (rocketStrikeSpawnTimer <= 0) {
      return;
    }
    if (!pendingRocketStrikeWarning) {
      rollPendingRocketStrikeWarning();
    }
    if (!pendingRocketStrikeWarning) {
      return;
    }
    progress = 1 - (rocketStrikeSpawnTimer / ROCKET_STRIKE_WARNING_DURATION);
    if (progress < 0) {
      progress = 0;
    }
    if (progress > 1) {
      progress = 1;
    }
    pendingRocketStrikeWarning.progress = progress;
    if (getSynth()) {
      getSynth().playWarningBeep(gameTime);
    }
  }

  function spawnRocketStrikeBlast(worldX, worldY) {
    visualEffects.push({
      kind: "rocketStrike",
      x: worldX,
      y: worldY,
      life: 0.45,
      maxLife: 0.45,
      size: 22
    });
    spawnHitSparks(worldX, worldY);
  }

  function executeRocketStrikeAt(worldX, worldY) {
    var unitIndex;
    var unit;
    var unitRadius;
    var distSq;
    var hitRadius;
    if (getSynth()) {
      getSynth().playExplosion(true);
    }
    for (unitIndex = 0; unitIndex < units.length; unitIndex += 1) {
      unit = units[unitIndex];
      if (unit.dead) {
        continue;
      }
      unitRadius = getUnitCollisionRadius(unit);
      hitRadius = ROCKET_STRIKE_RADIUS + unitRadius;
      distSq = distanceSquared(worldX, worldY, unit.x, unit.y);
      if (distSq <= hitRadius * hitRadius) {
        damageUnit(unit, ROCKET_STRIKE_DAMAGE, worldX, worldY);
      }
    }
    spawnRocketStrikeBlast(worldX, worldY);
  }

  function spawnRocketStrikeFromPending() {
    var worldPos;
    if (!pendingRocketStrikeWarning) {
      rollPendingRocketStrikeWarning();
    }
    if (!pendingRocketStrikeWarning) {
      return;
    }
    worldPos = getRocketStrikeImpactWorldPosition();
    executeRocketStrikeAt(worldPos.x, worldPos.y);
    pendingRocketStrikeWarning = null;
  }

  function getMinefieldDropScreenXThreshold() {
    return width * (1 - MINEFIELD_DROP_SCREEN_INSET_FACTOR);
  }

  function getMinefieldWarningScreenPosition() {
    var screenPos;
    var dropThresholdX;
    if (!pendingMinefieldWarning) {
      return worldToScreen(cameraX, cameraY);
    }
    dropThresholdX = getMinefieldDropScreenXThreshold();
    screenPos = worldToScreen(pendingMinefieldWarning.worldCenterX, pendingMinefieldWarning.worldCenterY);
    if (screenPos.x > dropThresholdX) {
      screenPos.x = dropThresholdX;
    }
    return screenPos;
  }

  function getMinefieldSpawnWorldPosition() {
    return {
      x: pendingMinefieldWarning.worldCenterX,
      y: pendingMinefieldWarning.worldCenterY
    };
  }

  function rollPendingMinefieldWarning() {
    var laneSpread;
    var approachDistance;
    if (!truckUnit || truckUnit.dead) {
      pendingMinefieldWarning = null;
      return;
    }
    laneSpread = height * MINEFIELD_VERTICAL_SPREAD;
    approachDistance = width * 0.5 + scrollSpeed * MINEFIELD_WARNING_DURATION + MINEFIELD_SPAWN_EXTRA_MARGIN;
    pendingMinefieldWarning = {
      worldCenterX: truckUnit.x + approachDistance + randomRange(32, 160),
      worldCenterY: truckUnit.y + randomRange(-laneSpread, laneSpread),
      progress: 0,
      dropStarted: false
    };
  }

  function isMinefieldReadyToDropAtScreenEdge() {
    var screenPos;
    if (!pendingMinefieldWarning || pendingMinefieldWarning.dropStarted) {
      return false;
    }
    screenPos = worldToScreen(pendingMinefieldWarning.worldCenterX, pendingMinefieldWarning.worldCenterY);
    return screenPos.x <= getMinefieldDropScreenXThreshold();
  }

  function dropMinefieldFromPending() {
    var worldPos;
    if (!pendingMinefieldWarning || pendingMinefieldWarning.dropStarted) {
      return;
    }
    worldPos = getMinefieldSpawnWorldPosition();
    spawnMinefieldCluster(worldPos.x, worldPos.y, true);
    pendingMinefieldWarning.dropStarted = true;
  }

  function tryDropMinefieldFromPending() {
    if (!isMinefieldReadyToDropAtScreenEdge()) {
      return;
    }
    dropMinefieldFromPending();
  }

  function updatePendingMinefieldWarning() {
    var progress;
    if (minefieldSpawnTimer > MINEFIELD_WARNING_DURATION) {
      if (!pendingMinefieldWarning || pendingMinefieldWarning.dropStarted) {
        pendingMinefieldWarning = null;
      }
      return;
    }
    if (!pendingMinefieldWarning) {
      rollPendingMinefieldWarning();
    }
    if (!pendingMinefieldWarning) {
      return;
    }
    if (minefieldSpawnTimer > 0) {
      progress = 1 - (minefieldSpawnTimer / MINEFIELD_WARNING_DURATION);
      if (progress < 0) {
        progress = 0;
      }
      if (progress > 1) {
        progress = 1;
      }
      pendingMinefieldWarning.progress = progress;
      if (getSynth()) {
        getSynth().playWarningBeep(gameTime);
      }
    }
    tryDropMinefieldFromPending();
  }

  function createMineAt(worldX, worldY, startFalling) {
    var mine;
    mine = {
      x: worldX,
      y: worldY,
      groundY: worldY,
      active: true,
      falling: false,
      fallProgress: 1
    };
    if (startFalling) {
      mine.falling = true;
      mine.fallProgress = 0;
      mine.y = worldY - MINEFIELD_DROP_FALL_HEIGHT;
    }
    return mine;
  }

  function spawnMinefieldCluster(centerX, centerY, startFalling) {
    var mineCount;
    var mineIndex;
    var angle;
    var dist;
    var mineX;
    var mineY;
    mineCount = MINEFIELD_COUNT_MIN + Math.floor(Math.random() * (MINEFIELD_COUNT_MAX - MINEFIELD_COUNT_MIN + 1));
    for (mineIndex = 0; mineIndex < mineCount; mineIndex += 1) {
      angle = randomRange(0, TWO_PI);
      dist = Math.sqrt(Math.random()) * MINEFIELD_CLUSTER_RADIUS;
      mineX = centerX + Math.cos(angle) * dist;
      mineY = centerY + Math.sin(angle) * dist;
      mines.push(createMineAt(mineX, mineY, startFalling));
    }
  }

  function updateFallingMines(deltaSeconds) {
    var mineIndex;
    var mine;
    var fallStep;
    if (MINEFIELD_DROP_FALL_DURATION <= 0) {
      return;
    }
    fallStep = deltaSeconds / MINEFIELD_DROP_FALL_DURATION;
    for (mineIndex = 0; mineIndex < mines.length; mineIndex += 1) {
      mine = mines[mineIndex];
      if (!mine.active || !mine.falling) {
        continue;
      }
      mine.fallProgress += fallStep;
      if (mine.fallProgress >= 1) {
        mine.fallProgress = 1;
        mine.falling = false;
        mine.y = mine.groundY;
      } else {
        mine.y = mine.groundY - MINEFIELD_DROP_FALL_HEIGHT * (1 - mine.fallProgress);
      }
    }
  }

  function spawnMineDetonation(worldX, worldY) {
    visualEffects.push({
      kind: "mineBlast",
      x: worldX,
      y: worldY,
      life: 0.35,
      maxLife: 0.35,
      size: 18
    });
    spawnHitSparks(worldX, worldY);
    if (getSynth()) {
      getSynth().playExplosion(false);
    }
  }

  function getMineUnitHitRadius(unit) {
    return getUnitCollisionRadius(unit) * 0.5 + MINE_TRIGGER_RADIUS;
  }

  function updateMines() {
    var mineIndex;
    var mine;
    var unitIndex;
    var unit;
    var hitRadius;
    var distSq;
    for (mineIndex = mines.length - 1; mineIndex >= 0; mineIndex -= 1) {
      mine = mines[mineIndex];
      if (!mine.active) {
        mines.splice(mineIndex, 1);
        continue;
      }
      if (mine.falling) {
        continue;
      }
      for (unitIndex = 0; unitIndex < units.length; unitIndex += 1) {
        unit = units[unitIndex];
        if (unit.dead) {
          continue;
        }
        hitRadius = getMineUnitHitRadius(unit);
        distSq = distanceSquared(mine.x, mine.y, unit.x, unit.y);
        if (distSq <= hitRadius * hitRadius) {
          damageUnit(unit, MINE_DAMAGE, mine.x, mine.y);
          spawnMineDetonation(mine.x, mine.y);
          mine.active = false;
          break;
        }
      }
    }
  }

  function spawnEnemyWave() {
    var cluster;
    cluster = rollEnemySpawnWaveCluster();
    spawnEnemyWaveCluster(cluster);
  }

  function spawnEscortBehindTruck() {
    var spawnCost = getEscortSpawnCost();
    if (crystalCount < spawnCost) {
      return;
    }
    crystalCount -= spawnCost;
    var spawnPos = getEscortSpawnPositionBehindTruck();
    var destinationPos = getRandomEscortDestinationAroundTruck();
    var escort = createCarUnit(
      UNIT_ESCORT,
      spawnPos.x,
      spawnPos.y,
      "friendly"
    );
    escort.destinationX = destinationPos.x;
    escort.destinationY = destinationPos.y;
    setEscortGuardOffset(escort, destinationPos.x, destinationPos.y);
    units.push(escort);
    syncPlayingHud();
    spawnFriendlyEscortArrival(spawnPos.x, spawnPos.y);
    spawnEscortModeReveal(escort);
    if (getSynth()) {
      getSynth().playEscortSpawn();
    }
  }

  function dropCrystalsAt(worldX, worldY, amount, minRarity) {
    var index;
    var angle;
    var dist;
    var rarity;
    var dropScreen = worldToScreen(worldX, worldY);
    for (index = 0; index < amount; index += 1) {
      angle = randomRange(0, TWO_PI);
      dist = randomRange(6, 36);
      rarity = null;
      if (minRarity != null && Math.random() < 0.55) {
        rarity = minRarity + Math.floor(Math.random() * (CRYSTAL_RARITY_COUNT - minRarity));
      }
      crystals.push(createCrystalAtScreen(dropScreen.x, dropScreen.y, angle, dist, rarity));
    }
  }

  function killUnit(unit) {
    if (unit.dead) {
      return;
    }
    unit.dead = true;
    unit.isWreck = true;
    unit.wreckFireTime = 0;
    unit.destinationX = unit.x;
    unit.destinationY = unit.y;
    if (unit.id === selectedUnitId) {
      selectDefaultFriendlyUnit();
    }
    var dropCount = 4;
    if (unit.kind === UNIT_TRUCK) {
      dropCount = 8;
    } else if (unit.kind === UNIT_BOSS_TRUCK) {
      dropCount = getBossCrystalDropCount(unit);
    } else if (unit.team === "enemy") {
      dropCount = getEnemyCrystalDropCount(unit);
    }
    dropCrystalsAt(unit.x, unit.y, dropCount, unit.team === "enemy" ? 1 : null);
    spawnDeathExplosion(unit.x, unit.y, isUnitTruckKind(unit));
    if (getSynth()) {
      getSynth().playUnitDeath(isUnitTruckKind(unit), gameTime);
    }

    if (unit.kind === UNIT_TRUCK) {
      var isRecord = saveHighScoreIfNeeded();
      showGameOverScreen(isRecord);
    }
  }

  function damageUnit(unit, amount, hitX, hitY, attackerUnit) {
    amount *= getUnitDamageTakenFactor(unit);
    if (attackerUnit && !attackerUnit.dead && attackerUnit.team !== unit.team) {
      unit.lastAttackerUnitId = attackerUnit.id;
    }
    unit.health -= amount;
    unit.hitFlash = 0.18;
    spawnHitSparks(hitX != null ? hitX : unit.x, hitY != null ? hitY : unit.y);
    if (unit.health <= 0) {
      recordUnitKillFromVictim(unit, attackerUnit);
      killUnit(unit);
    }
  }

  function updateProjectiles(deltaSeconds) {
    var index;
    var projectile;
    var move;
    var unitIndex;
    var unit;
    var distSq;
    for (index = projectiles.length - 1; index >= 0; index -= 1) {
      projectile = projectiles[index];
      move = projectile.speed * deltaSeconds;
      projectile.x += Math.cos(projectile.angle) * move;
      projectile.y += Math.sin(projectile.angle) * move;
      projectile.life -= deltaSeconds;
      projectile.trailTimer -= deltaSeconds;
      if (projectile.trailTimer <= 0) {
        projectile.trailTimer = 0.028;
        spawnProjectileTrail(projectile.x, projectile.y, projectile.team);
      }
      if (projectile.life <= 0) {
        projectiles.splice(index, 1);
        continue;
      }
      for (unitIndex = 0; unitIndex < units.length; unitIndex += 1) {
        unit = units[unitIndex];
        if (unit.dead || unit.team === projectile.team) {
          continue;
        }
        distSq = distanceSquared(projectile.x, projectile.y, unit.x, unit.y);
        if (distSq <= (unit.radius + PROJECTILE_RADIUS) * (unit.radius + PROJECTILE_RADIUS)) {
          damageUnit(unit, projectile.damage, projectile.x, projectile.y, getUnitById(projectile.sourceUnitId));
          if (getSynth()) {
            getSynth().playImpact();
          }
          projectiles.splice(index, 1);
          break;
        }
      }
    }
  }

  function collectCrystalAt(index) {
    var crystal = crystals[index];
    var worldPos = screenToWorld(crystal.screenX, crystal.screenY);
    spawnCollectBurst(worldPos.x, worldPos.y, crystal.red, crystal.green, crystal.blue);
    spawnCrystalCollectFlyEffect(worldPos.x, worldPos.y, crystal.red, crystal.green, crystal.blue, crystal.size, crystal.rarity);
    crystalCount += crystal.value;
    crystals.splice(index, 1);
    tryAutoSpawnEscorts();
    syncPlayingHud();
    queueCrystalCollectSound();
  }

  function getUnitCrystalCollectRadius(unit) {
    return getUnitCollisionRadius(unit) + CRYSTAL_UNIT_COLLECT_PADDING;
  }

  function updateUnitCrystalCollection() {
    var crystalIndex;
    var unitIndex;
    var unit;
    var collectRadius;
    var collectRadiusSq;
    var unitScreen;
    if (!isPlaying()) {
      return;
    }
    for (crystalIndex = crystals.length - 1; crystalIndex >= 0; crystalIndex -= 1) {
      for (unitIndex = 0; unitIndex < units.length; unitIndex += 1) {
        unit = units[unitIndex];
        if (unit.dead || unit.team !== "friendly") {
          continue;
        }
        collectRadius = getUnitCrystalCollectRadius(unit);
        collectRadiusSq = collectRadius * collectRadius;
        unitScreen = worldToScreen(unit.x, unit.y);
        if (distanceSquared(unitScreen.x, unitScreen.y, crystals[crystalIndex].screenX, crystals[crystalIndex].screenY) <= collectRadiusSq) {
          collectCrystalAt(crystalIndex);
          break;
        }
      }
    }
  }

  function tryCollectCrystalsAtScreen(screenX, screenY, radius) {
    var radiusSq = radius * radius;
    var index;
    for (index = crystals.length - 1; index >= 0; index -= 1) {
      if (distanceSquared(screenX, screenY, crystals[index].screenX, crystals[index].screenY) <= radiusSq) {
        collectCrystalAt(index);
      }
    }
  }

  function updateCrystalCollection() {
    tryCollectCrystalsAtScreen(mouseScreenX, mouseScreenY, CRYSTAL_HOVER_RADIUS);
  }

  function updateCrystalAutoCollect(deltaSeconds) {
    var crystal;
    var index;
    if (!isPlaying()) {
      return;
    }
    for (index = crystals.length - 1; index >= 0; index -= 1) {
      crystal = crystals[index];
      if (crystal.layAge == null) {
        crystal.layAge = 0;
      }
      crystal.layAge += deltaSeconds;
      if (crystal.layAge >= CRYSTAL_AUTO_COLLECT_LAY_TIME) {
        collectCrystalAt(index);
      }
    }
  }

  function spawnDecorationBurst(worldX, worldY, decorationKind) {
    var index;
    var particleCount;
    var leafColor;
    var dustColor;
    if (decorationKind === "bush") {
      particleCount = 14;
      leafColor = "#5a8848";
    } else {
      particleCount = 12;
      leafColor = "#8a7868";
    }
    dustColor = "#6a5848";
    for (index = 0; index < particleCount; index += 1) {
      visualEffects.push({
        kind: "decorationParticle",
        x: worldX + randomRange(-8, 8),
        y: worldY + randomRange(-8, 8),
        angle: randomRange(0, TWO_PI),
        speed: randomRange(40, 160),
        life: randomRange(0.18, 0.48),
        maxLife: 0.48,
        size: randomRange(2, decorationKind === "bush" ? 5 : 6),
        color: index % 2 === 0 ? leafColor : dustColor
      });
    }
  }

  function updateObstacleCollisions() {
    var cellIndex;
    var obstacleIndex;
    var unitIndex;
    var cell;
    var obstacle;
    var unit;
    var hitRadiusSq;
    var unitRadius;
    for (cellIndex = 0; cellIndex < terrainCells.length; cellIndex += 1) {
      cell = terrainCells[cellIndex];
      for (obstacleIndex = cell.obstacles.length - 1; obstacleIndex >= 0; obstacleIndex -= 1) {
        obstacle = cell.obstacles[obstacleIndex];
        if (!obstacle.active) {
          continue;
        }
        for (unitIndex = 0; unitIndex < units.length; unitIndex += 1) {
          unit = units[unitIndex];
          if (unit.dead || unit.isWreck) {
            continue;
          }
          unitRadius = getUnitCollisionRadius(unit);
          hitRadiusSq = (unitRadius + obstacle.radius) * (unitRadius + obstacle.radius);
          if (distanceSquared(unit.x, unit.y, obstacle.x, obstacle.y) <= hitRadiusSq) {
            spawnDecorationBurst(obstacle.x, obstacle.y, obstacle.kind);
            cell.obstacles.splice(obstacleIndex, 1);
            break;
          }
        }
      }
    }
  }

  function updateDistanceTraveledFromTruck(truckXBeforeScroll, scrollMove) {
    var truckDeltaX;
    if (truckUnit && !truckUnit.dead) {
      truckDeltaX = truckUnit.x - truckXBeforeScroll;
      if (truckDeltaX > 0) {
        distanceTraveled += truckDeltaX;
      }
      return;
    }
    if (scrollMove > 0) {
      distanceTraveled += scrollMove;
    }
  }

  function updateConvoyScroll(deltaSeconds) {
    scrollSpeed = SCROLL_SPEED_BASE + distanceTraveled * SCROLL_SPEED_GROWTH;
    if (scrollSpeed > SCROLL_SPEED_MAX) {
      scrollSpeed = SCROLL_SPEED_MAX;
    }
    var move = scrollSpeed * deltaSeconds;
    scrollCameraX += move;

    var index;
    for (index = 0; index < units.length; index += 1) {
      if (!units[index].dead) {
        units[index].x += move;
        if (!units[index].hasTruckScreenDestination) {
          units[index].destinationX += move;
        }
      }
    }

    for (index = 0; index < projectiles.length; index += 1) {
      projectiles[index].x += move;
    }

    for (index = 0; index < visualEffects.length; index += 1) {
      visualEffects[index].x += move;
      if (visualEffects[index].kind === "laserBeam" || visualEffects[index].kind === "healBeam") {
        visualEffects[index].toX += move;
      }
    }

    for (index = 0; index < dustParticles.length; index += 1) {
      dustParticles[index].x += move;
    }

    syncTerrainDecorations();
    return move;
  }

  function updateUnits(deltaSeconds) {
    var index;
    var unit;
    updateSelectedUnitKeyboardMove(deltaSeconds);
    updateSelectedEscortHoldPosition();
    updateTruckScreenRelativeDestinations();
    updateTruckAutoEvade(deltaSeconds);
    updateFriendlyEscortTargets();
    enemyPathUpdateTimer -= deltaSeconds;
    if (enemyPathUpdateTimer <= 0) {
      enemyPathUpdateTimer = NPC_PATH_UPDATE_INTERVAL;
      updateEnemyTargets();
    }
    for (index = 0; index < units.length; index += 1) {
      unit = units[index];
      if (unit.dead) {
        continue;
      }
      if (unit.hitFlash > 0) {
        unit.hitFlash -= deltaSeconds;
      }
      moveUnitTowardDestination(unit, deltaSeconds);
      updateTurrets(unit, deltaSeconds);
      spawnUnitWheelDust(unit);
    }
    resolveUnitOverlaps();
    updateObstacleCollisions();
    applyTruckMovementOffsetToSelectedEscort();
    unit = getSelectedEscortUnit();
    if (unit) {
      clampSelectedEscortWorldPosition(unit);
    }
  }

  function updateCollectFlyEffect(effect, deltaSeconds) {
    var deltaX;
    var deltaY;
    var dist;
    var step;
    if (!truckUnit || truckUnit.dead) {
      return false;
    }
    deltaX = truckUnit.x - effect.x;
    deltaY = truckUnit.y - effect.y;
    dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (dist <= COLLECT_FLY_ARRIVE_DISTANCE) {
      visualEffects.push({
        kind: "collectFlash",
        x: truckUnit.x,
        y: truckUnit.y,
        life: 0.12,
        maxLife: 0.12,
        size: 12
      });
      return false;
    }
    step = effect.speed * deltaSeconds;
    if (step > dist) {
      step = dist;
    }
    effect.x += (deltaX / dist) * step;
    effect.y += (deltaY / dist) * step;
    return true;
  }

  function updateVisualEffects(deltaSeconds) {
    var index;
    var effect;
    for (index = visualEffects.length - 1; index >= 0; index -= 1) {
      effect = visualEffects[index];
      if (effect.kind === "collectFly") {
        if (!updateCollectFlyEffect(effect, deltaSeconds)) {
          visualEffects.splice(index, 1);
          continue;
        }
      }
      effect.life -= deltaSeconds;
      if (effect.life <= 0) {
        visualEffects.splice(index, 1);
        continue;
      }
      if (effect.kind === "spark" || effect.kind === "collectSpark" || effect.kind === "deathSpark" || effect.kind === "spawnSpark" || effect.kind === "decorationParticle") {
        effect.x += Math.cos(effect.angle) * effect.speed * deltaSeconds;
        effect.y += Math.sin(effect.angle) * effect.speed * deltaSeconds;
        effect.speed *= 0.92;
      } else if (effect.kind === "modeSymbol") {
        effect.y -= effect.riseSpeed * deltaSeconds;
      } else if (effect.kind === "unitStar") {
        effect.y -= effect.riseSpeed * deltaSeconds;
      } else if (effect.kind === "modeParticle") {
        effect.x += effect.velX * deltaSeconds;
        effect.y += effect.velY * deltaSeconds;
        effect.velY -= 18 * deltaSeconds;
      } else if (effect.kind === "smoke") {
        effect.x += Math.cos(effect.angle) * effect.speed * deltaSeconds;
        effect.y += Math.sin(effect.angle) * effect.speed * deltaSeconds;
        effect.size += 12 * deltaSeconds;
      } else if (effect.kind === "hitRing" || effect.kind === "collectRing" || effect.kind === "deathFlash" || effect.kind === "collectFlash" || effect.kind === "rocketStrike" || effect.kind === "spawnRing" || effect.kind === "spawnFlash") {
        effect.size += 48 * deltaSeconds;
      }
    }
  }

  function getCameraFollowSmoothFactor(smoothSpeed, deltaSeconds) {
    return 1 - Math.exp(-smoothSpeed * deltaSeconds);
  }

  function updateCamera(deltaSeconds) {
    var cameraTarget;
    var clampedTarget;
    var smoothFactorX;
    var smoothFactorY;
    if (!getCameraFollowUnit()) {
      if (isGameOver()) {
        cameraX += scrollSpeed * deltaSeconds;
      }
      return;
    }
    updateTruckCameraVelocity(deltaSeconds);
    cameraTarget = getCameraTargetPosition();
    clampedTarget = clampCameraTargetToKeepTruckOnScreen(cameraTarget.x, cameraTarget.y);
    smoothFactorX = getCameraFollowSmoothFactor(CAMERA_FOLLOW_SMOOTH_SPEED_X, deltaSeconds);
    smoothFactorY = getCameraFollowSmoothFactor(CAMERA_FOLLOW_SMOOTH_SPEED_Y, deltaSeconds);
    cameraX += (clampedTarget.x - cameraX) * smoothFactorX;
    cameraY += (clampedTarget.y - cameraY) * smoothFactorY;
  }

  function getCarWheelOffsets(unit) {
    return [
      { x: -unit.length * 0.28, y: -unit.width * 0.62 },
      { x: -unit.length * 0.28, y: unit.width * 0.62 },
      { x: unit.length * 0.22, y: -unit.width * 0.62 },
      { x: unit.length * 0.22, y: unit.width * 0.62 }
    ];
  }

  function drawCarWheels(unit) {
    var wheels = getCarWheelOffsets(unit);
    var wheelIndex;
    context.fillStyle = "#141210";
    context.strokeStyle = "#0a0806";
    context.lineWidth = 1;
    for (wheelIndex = 0; wheelIndex < wheels.length; wheelIndex += 1) {
      context.beginPath();
      context.arc(wheels[wheelIndex].x, wheels[wheelIndex].y, 4.5, 0, TWO_PI);
      context.fill();
      context.stroke();
    }
  }

  function getTruckWheelOffsets(unit) {
    return [
      { x: -unit.length * 0.34, y: -unit.width * 0.62 },
      { x: -unit.length * 0.34, y: unit.width * 0.62 },
      { x: -unit.length * 0.12, y: -unit.width * 0.62 },
      { x: -unit.length * 0.12, y: unit.width * 0.62 },
      { x: unit.length * 0.28, y: -unit.width * 0.62 },
      { x: unit.length * 0.28, y: unit.width * 0.62 },
      { x: unit.length * 0.42, y: -unit.width * 0.62 },
      { x: unit.length * 0.42, y: unit.width * 0.62 }
    ];
  }

  function drawTruckWheels(unit) {
    var wheels = getTruckWheelOffsets(unit);
    var wheelIndex;
    context.fillStyle = "#141210";
    context.strokeStyle = "#0a0806";
    context.lineWidth = 1;
    for (wheelIndex = 0; wheelIndex < wheels.length; wheelIndex += 1) {
      context.beginPath();
      context.arc(wheels[wheelIndex].x, wheels[wheelIndex].y, 5.5, 0, TWO_PI);
      context.fill();
      context.stroke();
    }
  }

  function shouldDrawUnitHealthBar(unit) {
    return unit.health < unit.maxHealth - 0.01;
  }

  function getEscortSpawnProgressFraction() {
    var spawnCost;
    spawnCost = getEscortSpawnCost();
    if (spawnCost <= 0) {
      return 1;
    }
    if (crystalCount >= spawnCost) {
      return 1;
    }
    return crystalCount / spawnCost;
  }

  function fillRectWithSubtleHazardStripes(rectX, rectY, rectW, rectH) {
    var stripePeriod;
    var stripeWidth;
    var lineIndex;
    var span;
    stripePeriod = 10;
    stripeWidth = 5;
    span = rectW + rectH;
    context.save();
    context.beginPath();
    context.rect(rectX, rectY, rectW, rectH);
    context.clip();
    context.fillStyle = "rgba(255, 128, 0, 0.1)";
    context.fillRect(rectX, rectY, rectW, rectH);
    for (lineIndex = -span; lineIndex < span; lineIndex += stripePeriod) {
      context.fillStyle = "rgba(255, 128, 0, 0.16)";
      context.beginPath();
      context.moveTo(rectX + lineIndex, rectY);
      context.lineTo(rectX + lineIndex + stripeWidth, rectY);
      context.lineTo(rectX + lineIndex + stripeWidth + rectH, rectY + rectH);
      context.lineTo(rectX + lineIndex + rectH, rectY + rectH);
      context.closePath();
      context.fill();
    }
    context.restore();
  }

  function drawTruckEscortSpawnProgressBar(unit) {
    var barX;
    var barY;
    var barWidth;
    var barHeight;
    var spawnCost;
    var progress;
    var fillWidth;
    var label;
    if (!isPlaying() || unit.isWreck || unit.team !== "friendly" || unit.kind !== UNIT_TRUCK) {
      return;
    }
    spawnCost = getEscortSpawnCost();
    progress = getEscortSpawnProgressFraction();
    barWidth = unit.length;
    barHeight = 4;
    barX = -barWidth * 0.5;
    barY = unit.width * 0.5 + 6;
    context.fillStyle = "rgba(0, 0, 0, 0.55)";
    context.fillRect(barX, barY, barWidth, barHeight);
    fillWidth = barWidth * progress;
    if (fillWidth > 0.5) {
      fillRectWithSubtleHazardStripes(barX, barY, fillWidth, barHeight);
    }
    context.strokeStyle = "rgba(255, 128, 0, 0.22)";
    context.lineWidth = 0.8;
    context.strokeRect(barX, barY, barWidth, barHeight);
    label = crystalCount + "/" + spawnCost;
    context.fillStyle = "rgba(255, 236, 200, 0.94)";
    context.font = "bold 6px Courier New, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, 0, barY + barHeight * 0.5);
  }

  function drawUnitStarShape(centerX, centerY, outerRadius) {
    var pointIndex;
    var angle;
    var innerRadius;
    innerRadius = outerRadius * 0.45;
    context.fillStyle = "#ffd830";
    context.strokeStyle = "#c8a010";
    context.lineWidth = 0.8;
    context.beginPath();
    for (pointIndex = 0; pointIndex < 10; pointIndex += 1) {
      angle = -Math.PI * 0.5 + pointIndex * Math.PI / 5;
      if (pointIndex % 2 === 0) {
        context.lineTo(centerX + Math.cos(angle) * outerRadius, centerY + Math.sin(angle) * outerRadius);
      } else {
        context.lineTo(centerX + Math.cos(angle) * innerRadius, centerY + Math.sin(angle) * innerRadius);
      }
    }
    context.closePath();
    context.fill();
    context.stroke();
  }

  function drawUnitStarsAboveHealthBar(unit, barTopY, barWidth) {
    var starIndex;
    var starCount;
    var starSpacing;
    var starRadius;
    var startX;
    var centerY;
    if (!shouldDrawUnitStarBadge(unit)) {
      return;
    }
    starCount = unit.starCount;
    starSpacing = 7;
    starRadius = 3.1;
    centerY = barTopY - 6;
    if (starCount > UNIT_STAR_DISPLAY_MAX_ICONS) {
      drawUnitStarShape(-8, centerY, starRadius);
      context.fillStyle = "#ffd830";
      context.font = "bold 7px Arial";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText("x" + starCount, -2, centerY);
      return;
    }
    if (starCount > 1) {
      if ((starCount - 1) * starSpacing > barWidth - 4) {
        starSpacing = (barWidth - 4) / (starCount - 1);
      }
    }
    startX = -((starCount - 1) * starSpacing) * 0.5;
    for (starIndex = 0; starIndex < starCount; starIndex += 1) {
      drawUnitStarShape(startX + starIndex * starSpacing, centerY, starRadius);
    }
  }

  function updateWrecks(deltaSeconds) {
    var index;
    var unit;
    for (index = 0; index < units.length; index += 1) {
      unit = units[index];
      if (!unit.isWreck) {
        continue;
      }
      unit.wreckFireTime += deltaSeconds;
    }
  }

  function cleanupOffScreenUnits() {
    var index;
    var unit;
    for (index = units.length - 1; index >= 0; index -= 1) {
      unit = units[index];
      if (unit.kind === UNIT_TRUCK) {
        continue;
      }
      if (unit.team === "friendly" && !unit.dead) {
        continue;
      }
      if (!unit.dead && unit.team === "enemy") {
        if (isUnitOffScreenForDespawn(unit)) {
          units.splice(index, 1);
        }
        continue;
      }
      if (unit.isWreck && isUnitOffScreenForDespawn(unit)) {
        if (unit.id === selectedUnitId) {
          selectDefaultFriendlyUnit();
        }
        units.splice(index, 1);
      }
    }
  }

  function cleanupOffScreenProjectiles() {
    var index;
    var projectile;
    for (index = projectiles.length - 1; index >= 0; index -= 1) {
      projectile = projectiles[index];
      if (isWorldPositionOffScreenForDespawn(projectile.x, projectile.y)) {
        projectiles.splice(index, 1);
      }
    }
  }

  function cleanupOffScreenMines() {
    var mineIndex;
    var mine;
    for (mineIndex = mines.length - 1; mineIndex >= 0; mineIndex -= 1) {
      mine = mines[mineIndex];
      if (mine.falling) {
        continue;
      }
      if (isWorldPositionOffScreenForDespawn(mine.x, mine.y)) {
        mines.splice(mineIndex, 1);
      }
    }
  }

  function drawWreckFire(unit) {
    var fireIndex;
    var fireCount;
    var localX;
    var localY;
    var flicker;
    var flameHeight;
    var flameWidth;
    var flameTipY;
    var flameMidY;
    var flameGlowY;
    fireCount = isUnitTruckKind(unit) ? 4 : 2;
    for (fireIndex = 0; fireIndex < fireCount; fireIndex += 1) {
      if (isUnitTruckKind(unit)) {
        localX = unit.length * (-0.08 + fireIndex * 0.18);
        localY = -unit.width * 0.08 + (fireIndex % 2) * unit.width * 0.16;
      } else {
        localX = unit.length * (0.08 + fireIndex * 0.14);
        localY = -unit.width * 0.12 + fireIndex * unit.width * 0.18;
      }
      flicker = Math.sin(unit.wreckFireTime * 9 + fireIndex * 1.9) * 0.5 + 0.5;
      flameHeight = (8 + flicker * 10) * (isUnitTruckKind(unit) ? 1.15 : 1);
      flameWidth = 4 + flicker * 4;
      flameTipY = localY - flameHeight;
      flameMidY = localY - flameHeight * 0.55;
      flameGlowY = localY - flameHeight * 0.42;
      context.fillStyle = "rgba(255, " + Math.floor(70 + flicker * 110) + ", 18, " + (0.45 + flicker * 0.4) + ")";
      context.beginPath();
      context.moveTo(localX, localY);
      context.lineTo(localX - flameWidth * 0.5, flameMidY);
      context.lineTo(localX, flameTipY);
      context.lineTo(localX + flameWidth * 0.5, flameMidY);
      context.closePath();
      context.fill();
      context.fillStyle = "rgba(255, 210, 80, " + (0.25 + flicker * 0.35) + ")";
      context.beginPath();
      context.arc(localX, flameGlowY, flameWidth * 0.35, 0, TWO_PI);
      context.fill();
    }
  }

  function setSelectionRingStyle(unit) {
    selectionRing.classList.remove("is-truck", "is-attack", "is-defense");
    if (unit.kind === UNIT_TRUCK) {
      selectionRing.classList.add("is-truck");
    } else if (unit.kind === UNIT_ESCORT && unit.combatMode === COMBAT_MODE_ATTACK) {
      selectionRing.classList.add("is-attack");
    } else if (unit.kind === UNIT_ESCORT) {
      selectionRing.classList.add("is-defense");
    } else {
      selectionRing.classList.add("is-defense");
    }
  }

  function updateSelectionRing(deltaSeconds) {
    var unit;
    var drawPos;
    var screenPos;
    var ringSize;
    var rotateStep;
    rotateStep = deltaSeconds != null ? deltaSeconds : 0;
    unit = getUnitById(selectedUnitId);
    if (!unit || !isPlaying() || unit.team !== "friendly") {
      selectionRing.classList.remove("is-visible", "is-truck", "is-attack", "is-defense");
      selectionRing.style.transform = "";
      return;
    }
    drawPos = getUnitDrawWorldPosition(unit);
    screenPos = worldToScreen(drawPos.x, drawPos.y);
    selectionRing.style.left = screenPos.x + "px";
    selectionRing.style.top = screenPos.y + "px";
    ringSize = unit.kind === UNIT_TRUCK ? 168 : 52;
    selectionRing.style.width = ringSize + "px";
    selectionRing.style.height = ringSize + "px";
    selectionRing.style.marginLeft = (-ringSize * 0.5) + "px";
    selectionRing.style.marginTop = (-ringSize * 0.5) + "px";
    setSelectionRingStyle(unit);
    selectionRingRotateAngle += rotateStep * 0.55;
    selectionRing.style.transform = "rotate(" + selectionRingRotateAngle + "rad)";
    selectionRing.classList.add("is-visible");
  }

  function update(deltaSeconds) {
    var truckXBeforeScroll;
    var scrollMove;
    if (isGameOver()) {
      gameTime += deltaSeconds;
      truckXBeforeScroll = truckUnit && !truckUnit.dead ? truckUnit.x : 0;
      scrollMove = updateConvoyScroll(deltaSeconds);
      updateWrecks(deltaSeconds);
      updateVisualEffects(deltaSeconds);
      updateDustParticles(deltaSeconds);
      updateCamera(deltaSeconds);
      updateDistanceTraveledFromTruck(truckXBeforeScroll, scrollMove);
      cleanupOffScreenUnits();
      return;
    }
    if (!isPlaying()) {
      return;
    }

    gameTime += deltaSeconds;
    simulationFrameIndex += 1;

    truckXBeforeScroll = truckUnit && !truckUnit.dead ? truckUnit.x : 0;
    scrollMove = updateConvoyScroll(deltaSeconds);
    setTruckPositionAfterScroll();
    updateUnits(deltaSeconds);
    updateFallingMines(deltaSeconds);
    updateMines();
    updateProjectiles(deltaSeconds);
    updateVisualEffects(deltaSeconds);
    updateDustParticles(deltaSeconds);
    updateCrystalAutoCollect(deltaSeconds);
    updateCrystalCollection();
    updateUnitCrystalCollection();
    flushCrystalCollectSounds();
    updateCamera(deltaSeconds);
    updateDistanceTraveledFromTruck(truckXBeforeScroll, scrollMove);
    cleanupOffScreenUnits();
    cleanupOffScreenProjectiles();
    cleanupOffScreenMines();

    if (enemySpawnTimer > 0) {
      updatePendingSpawnWarnings();
    }
    enemySpawnTimer -= deltaSeconds;
    if (enemySpawnTimer <= 0) {
      spawnEnemyWaveFromPending();
      enemySpawnTimer = randomRange(ENEMY_SPAWN_INTERVAL_MIN, ENEMY_SPAWN_INTERVAL_MAX);
    }

    if (minefieldSpawnTimer > MINEFIELD_WARNING_DURATION) {
      if (pendingMinefieldWarning && pendingMinefieldWarning.dropStarted) {
        pendingMinefieldWarning = null;
      }
    } else {
      updatePendingMinefieldWarning();
    }
    minefieldSpawnTimer -= deltaSeconds;
    if (minefieldSpawnTimer <= 0) {
      if (!pendingMinefieldWarning || pendingMinefieldWarning.dropStarted) {
        pendingMinefieldWarning = null;
        minefieldSpawnTimer = getMinefieldSpawnInterval();
      }
    }

    if (rocketStrikeSpawnTimer > 0) {
      updatePendingRocketStrikeWarning();
    }
    rocketStrikeSpawnTimer -= deltaSeconds;
    if (rocketStrikeSpawnTimer <= 0) {
      spawnRocketStrikeFromPending();
      rocketStrikeSpawnTimer = getRocketStrikeSpawnInterval();
    }

    updateWrecks(deltaSeconds);

    syncPlayingHud();
    updateSelectionRing(deltaSeconds);
    updateTruckDamageVignette();
  }

  function hitTestFriendlyTruckCapsule(unit, worldX, worldY) {
    var capsule;
    var capsuleRadius;
    capsule = getFriendlyTruckCapsuleAt(unit, unit.x, unit.y);
    capsuleRadius = capsule.radius + 10;
    return getDistanceSquaredPointToSegment(worldX, worldY, capsule.end1X, capsule.end1Y, capsule.end2X, capsule.end2Y) <= capsuleRadius * capsuleRadius;
  }

  function hitTestEnemyTruck(unit, worldX, worldY) {
    var localX = worldX - unit.x;
    var localY = worldY - unit.y;
    return Math.abs(localX) <= unit.length * 0.52 && Math.abs(localY) <= unit.width * 0.58;
  }

  function hitTestTruck(unit, worldX, worldY) {
    if (unit.kind === UNIT_TRUCK) {
      return hitTestFriendlyTruckCapsule(unit, worldX, worldY);
    }
    return hitTestEnemyTruck(unit, worldX, worldY);
  }

  function hitTestUnit(screenX, screenY) {
    var world = screenToWorld(screenX, screenY);
    var index;
    var unit;
    var best = null;
    var bestDistSq = 999999999;
    for (index = units.length - 1; index >= 0; index -= 1) {
      unit = units[index];
      if (unit.dead || unit.team !== "friendly") {
        continue;
      }
      if (isUnitTruckKind(unit)) {
        if (hitTestTruck(unit, world.x, world.y)) {
          return unit;
        }
        continue;
      }
      var hitRadius = unit.radius + 10;
      var distSq = distanceSquared(world.x, world.y, unit.x, unit.y);
      if (distSq <= hitRadius * hitRadius && distSq < bestDistSq) {
        bestDistSq = distSq;
        best = unit;
      }
    }
    return best;
  }

  function selectDefaultFriendlyUnit() {
    if (truckUnit && !truckUnit.dead) {
      selectUnit(truckUnit);
      return;
    }
    selectedUnitId = -1;
    selectionRing.classList.remove("is-visible");
  }

  function selectUnit(unit) {
    var previousSelectedId;
    var previousUnit;
    previousSelectedId = selectedUnitId;
    previousUnit = getUnitById(previousSelectedId);
    if (previousUnit && previousUnit.kind === UNIT_ESCORT && (!unit || unit.id !== previousUnit.id)) {
      restoreEscortGuardFollow(previousUnit);
    }
    if (!unit) {
      selectDefaultFriendlyUnit();
      return;
    }
    if (unit.kind === UNIT_ESCORT) {
      beginEscortPlayerControl(unit);
    }
    selectedUnitId = unit.id;
    focusGameRoot();
    updateSelectionRing();
  }

  function setDestinationForSelected(screenX, screenY) {
    var unit = getUnitById(selectedUnitId);
    if (!unit) {
      return;
    }
    if (unit.kind === UNIT_ESCORT) {
      setWorldDestinationForUnit(unit, screenX, screenY);
      return;
    }
    setTruckScreenDestinationForUnit(unit, screenX, screenY);
  }

  function onPointerDown(event) {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    focusGameRoot();
    if (getSynth()) {
      getSynth().ensureContext();
    }

    if (isStart() || isGameOver()) {
      startPlaying();
      return;
    }

    if (!isPlaying()) {
      return;
    }

    var point = {
      x: event.clientX - gameRoot.getBoundingClientRect().left,
      y: event.clientY - gameRoot.getBoundingClientRect().top
    };

    var hitUnit = hitTestUnit(point.x, point.y);
    if (hitUnit) {
      if (hitUnit.id === selectedUnitId && hitUnit.kind === UNIT_ESCORT) {
        toggleEscortCombatMode(hitUnit);
        return;
      }
      if (isUnitTruckKind(hitUnit) && hitUnit.id === selectedUnitId) {
        setDestinationForSelected(point.x, point.y);
        return;
      }
      selectUnit(hitUnit);
      return;
    }

    tryCollectCrystalsAtScreen(point.x, point.y, CRYSTAL_PICKUP_RADIUS);

    if (selectedUnitId >= 0) {
      setDestinationForSelected(point.x, point.y);
    }
  }

  function onPointerMove(event) {
    var rect = gameRoot.getBoundingClientRect();
    mouseScreenX = event.clientX - rect.left;
    mouseScreenY = event.clientY - rect.top;
    var world = screenToWorld(mouseScreenX, mouseScreenY);
    mouseWorldX = world.x;
    mouseWorldY = world.y;
  }

  function drawWastelandFloor() {
    var gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#6a5238");
    gradient.addColorStop(0.45, "#584430");
    gradient.addColorStop(1, "#463828");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    var tileOffsetX = cameraX % FLOOR_TILE_SIZE;
    var tileOffsetY = cameraY % FLOOR_TILE_SIZE;
    var startTileX = -tileOffsetX - FLOOR_TILE_SIZE;
    var startTileY = -tileOffsetY - FLOOR_TILE_SIZE;
    var tileX;
    var tileY;
    for (tileY = startTileY; tileY < height + FLOOR_TILE_SIZE; tileY += FLOOR_TILE_SIZE) {
      for (tileX = startTileX; tileX < width + FLOOR_TILE_SIZE; tileX += FLOOR_TILE_SIZE) {
        var shade = 0.14 + ((Math.floor((tileX + cameraX) / FLOOR_TILE_SIZE) * 17 + Math.floor((tileY + cameraY) / FLOOR_TILE_SIZE) * 31) % 7) * 0.018;
        context.fillStyle = "rgba(110, 88, 58, " + shade + ")";
        context.fillRect(tileX, tileY, FLOOR_TILE_SIZE - 2, FLOOR_TILE_SIZE - 2);
        context.strokeStyle = "rgba(70, 52, 34, 0.22)";
        context.lineWidth = 1;
        context.strokeRect(tileX + 4, tileY + 4, FLOOR_TILE_SIZE - 10, FLOOR_TILE_SIZE - 10);
      }
    }
  }

  function drawRockObstacle(obstacle, screenPos) {
    var vertexIndex;
    var vertex;
    context.save();
    context.translate(screenPos.x, screenPos.y);
    context.rotate(obstacle.rotation);
    context.fillStyle = "#6a5848";
    context.strokeStyle = "rgba(42, 34, 28, 0.45)";
    context.lineWidth = 1.2;
    context.beginPath();
    vertex = obstacle.vertices[0];
    context.moveTo(vertex.x, vertex.y);
    for (vertexIndex = 1; vertexIndex < obstacle.vertices.length; vertexIndex += 1) {
      vertex = obstacle.vertices[vertexIndex];
      context.lineTo(vertex.x, vertex.y);
    }
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = "rgba(90, 78, 66, 0.35)";
    context.beginPath();
    context.arc(-obstacle.size * 0.15, -obstacle.size * 0.12, obstacle.size * 0.22, 0, TWO_PI);
    context.fill();
    context.restore();
  }

  function drawBushObstacle(obstacle, screenPos) {
    var blobIndex;
    var blobX;
    var blobY;
    var blobRadius;
    context.save();
    context.translate(screenPos.x, screenPos.y);
    for (blobIndex = 0; blobIndex < 4; blobIndex += 1) {
      blobX = Math.cos(blobIndex * 1.57 + 0.4) * obstacle.size * 0.22;
      blobY = Math.sin(blobIndex * 1.57 + 0.4) * obstacle.size * 0.18 - obstacle.size * 0.05;
      blobRadius = obstacle.size * (0.34 + (blobIndex % 2) * 0.08);
      context.fillStyle = blobIndex % 2 === 0 ? "#4a7040" : "#3a6034";
      context.beginPath();
      context.arc(blobX, blobY, blobRadius, 0, TWO_PI);
      context.fill();
    }
    context.fillStyle = "#5a8848";
    context.beginPath();
    context.arc(0, 0, obstacle.size * 0.38, 0, TWO_PI);
    context.fill();
    context.restore();
  }

  function drawObstacles() {
    var cellIndex;
    var obstacleIndex;
    var cell;
    var obstacle;
    var screenPos;
    for (cellIndex = 0; cellIndex < terrainCells.length; cellIndex += 1) {
      cell = terrainCells[cellIndex];
      for (obstacleIndex = 0; obstacleIndex < cell.obstacles.length; obstacleIndex += 1) {
        obstacle = cell.obstacles[obstacleIndex];
        if (!obstacle.active) {
          continue;
        }
        screenPos = worldToScreen(obstacle.x, obstacle.y);
        if (screenPos.x < -80 || screenPos.x > width + 80) {
          continue;
        }
        if (screenPos.y < -80 || screenPos.y > height + 80) {
          continue;
        }
        if (obstacle.kind === "rock") {
          drawRockObstacle(obstacle, screenPos);
        } else {
          drawBushObstacle(obstacle, screenPos);
        }
      }
    }
  }

  function drawDebris() {
    var cellIndex;
    var debrisIndex;
    var cell;
    var debris;
    var screenPos;
    for (cellIndex = 0; cellIndex < terrainCells.length; cellIndex += 1) {
      cell = terrainCells[cellIndex];
      for (debrisIndex = 0; debrisIndex < cell.debris.length; debrisIndex += 1) {
        debris = cell.debris[debrisIndex];
        screenPos = worldToScreen(debris.x, debris.y);
        if (screenPos.x < -60 || screenPos.x > width + 60) {
          continue;
        }
        if (screenPos.y < -60 || screenPos.y > height + 60) {
          continue;
        }
        context.save();
        context.translate(screenPos.x, screenPos.y);
        context.rotate(debris.rotation);
        if (debris.kind === 0) {
          context.fillStyle = "#6a5848";
          context.fillRect(-debris.size * 0.5, -debris.size * 0.25, debris.size, debris.size * 0.5);
        } else if (debris.kind === 1) {
          context.fillStyle = "#7a6450";
          context.beginPath();
          context.arc(0, 0, debris.size * 0.45, 0, TWO_PI);
          context.fill();
        } else if (debris.kind === 2) {
          context.strokeStyle = "#5a4838";
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(-debris.size * 0.4, 0);
          context.lineTo(debris.size * 0.4, 0);
          context.moveTo(0, -debris.size * 0.35);
          context.lineTo(0, debris.size * 0.35);
          context.stroke();
        } else {
          context.fillStyle = "#8a7060";
          context.fillRect(-debris.size * 0.15, -debris.size * 0.5, debris.size * 0.3, debris.size);
        }
        context.restore();
      }
    }
  }

  function drawMineShape(screenX, screenY, radius, pulse) {
    var spikeIndex;
    var spikeAngle;
    var spikeLength;
    var blinkScale = 0.92 + pulse * 0.08;
    var drawRadius = radius * blinkScale;
    context.fillStyle = "#5a1414";
    context.beginPath();
    context.arc(screenX, screenY, drawRadius, 0, TWO_PI);
    context.fill();
    context.fillStyle = "#d83030";
    context.beginPath();
    context.arc(screenX, screenY, drawRadius * 0.58, 0, TWO_PI);
    context.fill();
    context.fillStyle = "#ff6868";
    context.beginPath();
    context.arc(screenX, screenY, drawRadius * 0.22, 0, TWO_PI);
    context.fill();
    context.strokeStyle = "#3a0808";
    context.lineWidth = 1.2;
    for (spikeIndex = 0; spikeIndex < 8; spikeIndex += 1) {
      spikeAngle = spikeIndex * TWO_PI / 8;
      spikeLength = drawRadius * 1.35;
      context.beginPath();
      context.moveTo(screenX + Math.cos(spikeAngle) * drawRadius * 0.7, screenY + Math.sin(spikeAngle) * drawRadius * 0.7);
      context.lineTo(screenX + Math.cos(spikeAngle) * spikeLength, screenY + Math.sin(spikeAngle) * spikeLength);
      context.stroke();
    }
  }

  function drawMines() {
    var index;
    var mine;
    var screenPos;
    var pulse;
    if (!isPlaying()) {
      return;
    }
    pulse = 0.5 + Math.sin(gameTime * 5) * 0.5;
    for (index = 0; index < mines.length; index += 1) {
      mine = mines[index];
      if (!mine.active) {
        continue;
      }
      screenPos = worldToScreen(mine.x, mine.y);
      if (screenPos.x < -40 || screenPos.x > width + 40 || screenPos.y < -40 || screenPos.y > height + 40) {
        continue;
      }
      drawMineShape(screenPos.x, screenPos.y, MINE_DRAW_RADIUS, pulse);
    }
  }

  function fillRotatedRect(rectWidth, rectHeight) {
    context.fillRect(-rectWidth * 0.5, -rectHeight * 0.5, rectWidth, rectHeight);
  }

  function strokeRotatedRect(rectWidth, rectHeight) {
    context.strokeRect(-rectWidth * 0.5, -rectHeight * 0.5, rectWidth, rectHeight);
  }

  function drawTurretAt(localX, localY, turret, mountRadius, barrelLength) {
    var isLaser = turret.type === TURRET_TYPE_LASER;
    var isHeal = turret.type === TURRET_TYPE_HEAL;
    if (isHeal) {
      context.fillStyle = TURRET_COLOR_HEAL;
    } else if (isLaser) {
      context.fillStyle = TURRET_COLOR_LASER;
    } else {
      context.fillStyle = TURRET_COLOR_BLUE;
    }
    context.beginPath();
    context.arc(localX, localY, mountRadius, 0, TWO_PI);
    context.fill();
    if (isHeal) {
      context.strokeStyle = TURRET_COLOR_HEAL_DARK;
    } else if (isLaser) {
      context.strokeStyle = TURRET_COLOR_LASER_DARK;
    } else {
      context.strokeStyle = TURRET_COLOR_BLUE_DARK;
    }
    context.lineWidth = isLaser || isHeal ? 2 : 1.5;
    context.beginPath();
    context.moveTo(localX, localY);
    context.lineTo(
      localX + Math.cos(turret.angle) * barrelLength,
      localY + Math.sin(turret.angle) * barrelLength
    );
    context.stroke();
  }

  function drawCarUnit(unit) {
    var drawPos = unit.isWreck ? { x: unit.x, y: unit.y } : getUnitDrawWorldPosition(unit);
    var screenPos = worldToScreen(drawPos.x, drawPos.y);
    var drawTilt = unit.isWreck ? 0 : getUnitDrawTilt(unit);
    var isFriendly = unit.team === "friendly";
    var bodyColor = isFriendly ? "#728864" : "#9a5048";
    var cabColor = isFriendly ? "#829874" : "#b06058";
    var strokeColor = isFriendly ? "#3a4834" : "#502820";
    var hitFlashActive = !unit.isWreck && unit.hitFlash > 0;
    var isWreck = unit.isWreck;

    context.save();
    context.translate(screenPos.x, screenPos.y);
    context.rotate(UNIT_FACE_ANGLE + drawTilt);

    if (isWreck) {
      context.filter = "brightness(0.38) saturate(0.32) contrast(1.08)";
    }

    if (hitFlashActive) {
      context.globalAlpha = 0.72 + Math.sin(unit.hitFlash * 40) * 0.28;
    }

    drawCarWheels(unit);

    context.fillStyle = bodyColor;
    context.lineWidth = 1.5;
    fillRotatedRect(unit.length, unit.width);
    if (isFriendly) {
      context.strokeStyle = strokeColor;
      strokeRotatedRect(unit.length, unit.width);
    }

    context.fillStyle = cabColor;
    context.save();
    context.translate(unit.length * 0.25, 0);
    fillRotatedRect(unit.length * 0.34, unit.width * 0.84);
    if (isFriendly) {
      context.strokeStyle = strokeColor;
      context.strokeRect(-unit.length * 0.17, -unit.width * 0.42, unit.length * 0.34, unit.width * 0.84);
    }
    context.restore();

    var turret = unit.turrets[0];
    drawTurretAt(0, 0, turret, 5, getDrawCarTurretBarrelLength(turret));

    if (!isWreck && shouldDrawUnitHealthBar(unit)) {
      var healthFraction = unit.health / unit.maxHealth;
      context.fillStyle = "rgba(0,0,0,0.55)";
      context.fillRect(-unit.length * 0.5, -unit.width * 0.5 - 8, unit.length, 4);
      context.fillStyle = isFriendly ? "#78c878" : "#e85848";
      context.fillRect(-unit.length * 0.5, -unit.width * 0.5 - 8, unit.length * healthFraction, 4);
    }

    if (!isWreck && shouldDrawUnitStarBadge(unit)) {
      drawUnitStarsAboveHealthBar(unit, -unit.width * 0.5 - 8, unit.length);
    }

    if (hitFlashActive) {
      context.globalAlpha = 1;
      context.fillStyle = "rgba(255, 120, 60, 0.35)";
      fillRotatedRect(unit.length + 4, unit.width + 4);
    }

    if (isWreck) {
      context.filter = "none";
      context.fillStyle = "rgba(0, 0, 0, 0.42)";
      fillRotatedRect(unit.length + 2, unit.width + 2);
      drawWreckFire(unit);
    }

    context.restore();
  }

  function drawTruckUnit(unit) {
    var drawPos = unit.isWreck ? { x: unit.x, y: unit.y } : getUnitDrawWorldPosition(unit);
    var screenPos = worldToScreen(drawPos.x, drawPos.y);
    var drawTilt = unit.isWreck ? 0 : getUnitDrawTilt(unit);
    var hitFlashActive = !unit.isWreck && unit.hitFlash > 0;
    var isWreck = unit.isWreck;
    var isEnemy = unit.team === "enemy";
    var bodyColor = isEnemy ? "#6a4038" : "#5a6050";
    var bodyStrokeColor = isEnemy ? "#402018" : "#343830";
    var trailerColor = isEnemy ? "#523028" : "#4a5248";
    var cabColor = isEnemy ? "#7a4840" : "#6a7260";
    var windowColor = isEnemy ? "#c89888" : "#a8c0d0";
    var healthBarColor = isEnemy ? "#e85848" : "#78c878";
    context.save();
    context.translate(screenPos.x, screenPos.y);
    context.rotate(UNIT_FACE_ANGLE + drawTilt);

    if (isWreck) {
      context.filter = "brightness(0.38) saturate(0.32) contrast(1.08)";
    }

    if (hitFlashActive) {
      context.globalAlpha = 0.72 + Math.sin(unit.hitFlash * 40) * 0.28;
    }

    drawTruckWheels(unit);

    context.fillStyle = bodyColor;
    context.lineWidth = 2;
    context.fillRect(-unit.length * 0.5, -unit.width * 0.5, unit.length * 0.62, unit.width);
    if (!isEnemy) {
      context.strokeStyle = bodyStrokeColor;
      context.strokeRect(-unit.length * 0.5, -unit.width * 0.5, unit.length * 0.62, unit.width);
    }

    context.fillStyle = trailerColor;
    context.fillRect(-unit.length * 0.5 + unit.length * 0.62, -unit.width * 0.48, unit.length * 0.38, unit.width * 0.96);
    if (!isEnemy) {
      context.strokeRect(-unit.length * 0.5 + unit.length * 0.62, -unit.width * 0.48, unit.length * 0.38, unit.width * 0.96);
    }

    context.fillStyle = cabColor;
    context.fillRect(unit.length * 0.18, -unit.width * 0.44, unit.length * 0.22, unit.width * 0.88);
    if (!isEnemy) {
      context.strokeRect(unit.length * 0.18, -unit.width * 0.44, unit.length * 0.22, unit.width * 0.88);
    }

    context.fillStyle = windowColor;
    context.fillRect(unit.length * 0.24, -unit.width * 0.28, unit.length * 0.1, unit.width * 0.56);

    var turretIndex;
    var turret;
    var localX;
    var localY;
    for (turretIndex = 0; turretIndex < unit.turrets.length; turretIndex += 1) {
      turret = unit.turrets[turretIndex];
      localX = turret.localX;
      localY = turret.localY;
      drawTurretAt(localX, localY, turret, 6, getDrawTruckTurretBarrelLength(turret));
    }

    if (!isWreck && shouldDrawUnitHealthBar(unit)) {
      var healthFraction = unit.health / unit.maxHealth;
      context.fillStyle = "rgba(0,0,0,0.55)";
      context.fillRect(-unit.length * 0.5, -unit.width * 0.5 - 10, unit.length, 5);
      context.fillStyle = healthBarColor;
      context.fillRect(-unit.length * 0.5, -unit.width * 0.5 - 10, unit.length * healthFraction, 5);
    }

    if (!isWreck && shouldDrawUnitStarBadge(unit)) {
      drawUnitStarsAboveHealthBar(unit, -unit.width * 0.5 - 10, unit.length);
    }

    if (!isWreck && !isEnemy && unit.kind === UNIT_TRUCK) {
      drawTruckEscortSpawnProgressBar(unit);
    }

    if (hitFlashActive) {
      context.globalAlpha = 1;
      context.fillStyle = "rgba(255, 120, 60, 0.32)";
      context.fillRect(-unit.length * 0.52, -unit.width * 0.55, unit.length * 1.04, unit.width * 1.1);
    }

    if (isWreck) {
      context.filter = "none";
      context.fillStyle = "rgba(0, 0, 0, 0.42)";
      context.fillRect(-unit.length * 0.52, -unit.width * 0.55, unit.length * 1.04, unit.width * 1.1);
      drawWreckFire(unit);
    }

    context.restore();
  }

  function drawUnits() {
    var sorted = units.slice();
    var index;
    var unit;
    sorted.sort(function (unitA, unitB) {
      return unitA.y - unitB.y;
    });
    for (index = 0; index < sorted.length; index += 1) {
      unit = sorted[index];
      if (!unit.isWreck) {
        continue;
      }
      if (isUnitTruckKind(unit)) {
        drawTruckUnit(unit);
      } else {
        drawCarUnit(unit);
      }
    }
    for (index = 0; index < sorted.length; index += 1) {
      unit = sorted[index];
      if (unit.isWreck || unit.dead) {
        continue;
      }
      if (isUnitTruckKind(unit)) {
        drawTruckUnit(unit);
      } else {
        drawCarUnit(unit);
      }
    }
  }

  function drawProjectiles() {
    var index;
    var projectile;
    var screenPos;
    var tailX;
    var tailY;
    for (index = 0; index < projectiles.length; index += 1) {
      projectile = projectiles[index];
      screenPos = worldToScreen(projectile.x, projectile.y);
      tailX = screenPos.x - Math.cos(projectile.angle) * 12;
      tailY = screenPos.y - Math.sin(projectile.angle) * 12;

      context.strokeStyle = "rgba(100, 170, 255, 0.55)";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(tailX, tailY);
      context.lineTo(screenPos.x, screenPos.y);
      context.stroke();

      context.fillStyle = "#6ab0ff";
      context.beginPath();
      context.arc(screenPos.x, screenPos.y, PROJECTILE_RADIUS + 1, 0, TWO_PI);
      context.fill();
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.arc(screenPos.x, screenPos.y, PROJECTILE_RADIUS * 0.45, 0, TWO_PI);
      context.fill();
    }
  }

  function drawCrystalShape(size, crystal, glowScale) {
    var rarity = crystal.rarity;
    var red = crystal.red;
    var green = crystal.green;
    var blue = crystal.blue;
    var glowStrength = CRYSTAL_RARITY_GLOW[rarity] || 0.5;
    var outerAlpha = 0.22 * glowScale * glowStrength;
    var midColor = "rgb(" + Math.floor(red * 0.82) + "," + Math.floor(green * 0.82) + "," + Math.floor(blue * 0.82) + ")";
    var coreColor = "rgb(" + Math.min(255, red + 40) + "," + Math.min(255, green + 40) + "," + Math.min(255, blue + 40) + ")";
    context.fillStyle = "rgba(" + red + "," + green + "," + blue + "," + outerAlpha + ")";
    context.beginPath();
    context.moveTo(0, -size * 1.7);
    context.lineTo(size * 1.15, 0);
    context.lineTo(0, size * 1.7);
    context.lineTo(-size * 1.15, 0);
    context.closePath();
    context.fill();
    context.fillStyle = midColor;
    context.beginPath();
    context.moveTo(0, -size);
    context.lineTo(size * 0.75, 0);
    context.lineTo(0, size);
    context.lineTo(-size * 0.75, 0);
    context.closePath();
    context.fill();
    context.fillStyle = coreColor;
    context.beginPath();
    context.moveTo(0, -size * 0.45);
    context.lineTo(size * 0.28, 0);
    context.lineTo(0, size * 0.45);
    context.lineTo(-size * 0.28, 0);
    context.closePath();
    context.fill();
    context.strokeStyle = "rgba(" + Math.min(255, red + 60) + "," + Math.min(255, green + 60) + "," + Math.min(255, blue + 60) + "," + (0.35 * glowScale) + ")";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, -size * 1.05);
    context.lineTo(0, size * 1.05);
    context.stroke();
  }

  function drawCrystals() {
    var index;
    var crystal;
    var screenPos;
    var pulse;
    var sparkleIndex;
    for (index = 0; index < crystals.length; index += 1) {
      crystal = crystals[index];
      crystal.pulse += 0.07;
      crystal.bob += 0.05;
      crystal.spin += 0.02;
      screenPos = {
        x: crystal.screenX,
        y: crystal.screenY + Math.sin(crystal.bob) * 3
      };
      pulse = 0.88 + Math.sin(crystal.pulse) * 0.12;
      var size = crystal.size * pulse;
      var distSq = distanceSquared(mouseScreenX, mouseScreenY, crystal.screenX, crystal.screenY);
      var glow = distSq <= CRYSTAL_HOVER_RADIUS * CRYSTAL_HOVER_RADIUS ? 1.45 : 1;
      var auraRadius = size * (2.8 + glow * 0.5);

      context.save();
      context.translate(screenPos.x, screenPos.y);
      var aura = context.createRadialGradient(0, 0, size * 0.2, 0, 0, auraRadius);
      aura.addColorStop(0, "rgba(" + crystal.red + "," + crystal.green + "," + crystal.blue + "," + (0.28 * glow) + ")");
      aura.addColorStop(0.45, "rgba(" + crystal.red + "," + crystal.green + "," + crystal.blue + "," + (0.12 * glow) + ")");
      aura.addColorStop(1, "rgba(" + crystal.red + "," + crystal.green + "," + crystal.blue + ",0)");
      context.fillStyle = aura;
      context.beginPath();
      context.arc(0, 0, auraRadius, 0, TWO_PI);
      context.fill();

      context.rotate(crystal.spin);
      drawCrystalShape(size, crystal, glow);

      for (sparkleIndex = 0; sparkleIndex < 3; sparkleIndex += 1) {
        var sparkleAngle = crystal.pulse * 1.4 + sparkleIndex * TWO_PI / 3;
        var sparkleDist = size * 1.35;
        context.fillStyle = "rgba(255, 255, 255, " + (0.35 + Math.sin(crystal.pulse + sparkleIndex) * 0.25) + ")";
        context.beginPath();
        context.arc(
          Math.cos(sparkleAngle) * sparkleDist,
          Math.sin(sparkleAngle) * sparkleDist,
          1.5,
          0,
          TWO_PI
        );
        context.fill();
      }
      context.restore();
    }
  }

  function drawCombatModeSwordIcon(centerX, centerY, size, alpha) {
    context.save();
    context.translate(centerX, centerY);
    context.rotate(Math.PI);
    context.globalAlpha = alpha;
    context.strokeStyle = COMBAT_MODE_ATTACK_COLOR;
    context.fillStyle = "rgba(255, 100, 90, " + (alpha * 0.35) + ")";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(0, -size);
    context.lineTo(0, size * 0.35);
    context.stroke();
    context.beginPath();
    context.moveTo(-size * 0.55, size * 0.35);
    context.lineTo(size * 0.55, size * 0.35);
    context.stroke();
    context.beginPath();
    context.moveTo(0, size * 0.35);
    context.lineTo(0, size * 0.75);
    context.stroke();
    context.restore();
  }

  function drawCombatModeShieldIcon(centerX, centerY, size, alpha) {
    context.save();
    context.translate(centerX, centerY);
    context.rotate(Math.PI);
    context.globalAlpha = alpha;
    context.fillStyle = "rgba(90, 160, 255, " + (alpha * 0.35) + ")";
    context.strokeStyle = COMBAT_MODE_DEFENSE_COLOR;
    context.lineWidth = 2.5;
    context.beginPath();
    context.moveTo(0, -size * 0.9);
    context.quadraticCurveTo(size * 0.85, -size * 0.2, size * 0.75, size * 0.55);
    context.quadraticCurveTo(0, size * 0.95, -size * 0.75, size * 0.55);
    context.quadraticCurveTo(-size * 0.85, -size * 0.2, 0, -size * 0.9);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  function drawCombatModeSymbolIcon(centerX, centerY, size, combatMode, alpha) {
    if (combatMode === COMBAT_MODE_ATTACK) {
      drawCombatModeSwordIcon(centerX, centerY, size, alpha);
    } else {
      drawCombatModeShieldIcon(centerX, centerY, size, alpha);
    }
  }

  function getCombatModeParticleFill(combatMode, alpha) {
    if (combatMode === COMBAT_MODE_ATTACK) {
      return "rgba(255, 100, 90, " + alpha + ")";
    }
    return "rgba(100, 170, 255, " + alpha + ")";
  }

  function drawVisualEffects() {
    var index;
    var effect;
    var screenPos;
    var alpha;
    var progress;
    for (index = 0; index < visualEffects.length; index += 1) {
      effect = visualEffects[index];
      screenPos = worldToScreen(effect.x, effect.y);
      alpha = effect.life / effect.maxLife;
      progress = 1 - alpha;

      if (effect.kind === "muzzle") {
        context.save();
        context.translate(screenPos.x, screenPos.y);
        context.rotate(effect.angle);
        if (effect.isLaser) {
          context.fillStyle = "rgba(255, 230, 80, " + (alpha * 0.9) + ")";
        } else {
          context.fillStyle = effect.team === "friendly"
            ? "rgba(120, 180, 255, " + (alpha * 0.85) + ")"
            : "rgba(120, 180, 255, " + (alpha * 0.85) + ")";
        }
        context.beginPath();
        context.moveTo(effect.size * 0.8, 0);
        context.lineTo(-effect.size * 0.35, effect.size * 0.35);
        context.lineTo(-effect.size * 0.35, -effect.size * 0.35);
        context.closePath();
        context.fill();
        context.restore();
      } else if (effect.kind === "laserBeam") {
        var fromScreen = worldToScreen(effect.x, effect.y);
        var toScreen = worldToScreen(effect.toX, effect.toY);
        context.save();
        context.strokeStyle = "rgba(255, 240, 120, " + (alpha * 0.35) + ")";
        context.lineWidth = 6;
        context.beginPath();
        context.moveTo(fromScreen.x, fromScreen.y);
        context.lineTo(toScreen.x, toScreen.y);
        context.stroke();
        context.strokeStyle = "rgba(255, 220, 60, " + (alpha * 0.95) + ")";
        context.lineWidth = 2.5;
        context.beginPath();
        context.moveTo(fromScreen.x, fromScreen.y);
        context.lineTo(toScreen.x, toScreen.y);
        context.stroke();
        context.restore();
      } else if (effect.kind === "healBeam") {
        var healFromScreen = worldToScreen(effect.x, effect.y);
        var healToScreen = worldToScreen(effect.toX, effect.toY);
        context.save();
        context.strokeStyle = "rgba(120, 255, 160, " + (alpha * 0.35) + ")";
        context.lineWidth = 6;
        context.beginPath();
        context.moveTo(healFromScreen.x, healFromScreen.y);
        context.lineTo(healToScreen.x, healToScreen.y);
        context.stroke();
        context.strokeStyle = "rgba(72, 232, 120, " + (alpha * 0.95) + ")";
        context.lineWidth = 2.5;
        context.beginPath();
        context.moveTo(healFromScreen.x, healFromScreen.y);
        context.lineTo(healToScreen.x, healToScreen.y);
        context.stroke();
        context.restore();
      } else if (effect.kind === "modeSymbol") {
        var symbolScale = 0.85 + progress * 0.35;
        drawCombatModeSymbolIcon(
          screenPos.x,
          screenPos.y,
          effect.size * symbolScale,
          effect.combatMode,
          alpha
        );
      } else if (effect.kind === "unitStar") {
        var starRevealScale = 0.8 + progress * 0.45;
        context.globalAlpha = alpha;
        drawUnitStarShape(screenPos.x, screenPos.y, 8 * starRevealScale);
        context.globalAlpha = 1;
      } else if (effect.kind === "modeParticle") {
        context.fillStyle = getCombatModeParticleFill(effect.combatMode, alpha);
        context.globalAlpha = alpha;
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size, 0, TWO_PI);
        context.fill();
        context.globalAlpha = 1;
      } else if (effect.kind === "spark" || effect.kind === "deathSpark" || effect.kind === "spawnSpark" || effect.kind === "decorationParticle") {
        if (effect.kind === "spawnSpark") {
          context.fillStyle = "rgba(90, 230, 130, " + alpha + ")";
        } else {
          context.fillStyle = effect.color || "#ffb060";
        }
        context.globalAlpha = alpha;
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size, 0, TWO_PI);
        context.fill();
        context.globalAlpha = 1;
      } else if (effect.kind === "collectSpark") {
        context.fillStyle = "rgba(" + effect.red + "," + effect.green + "," + effect.blue + "," + alpha + ")";
        context.globalAlpha = alpha;
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size, 0, TWO_PI);
        context.fill();
        context.globalAlpha = 1;
      } else if (effect.kind === "collectFly") {
        context.save();
        context.translate(screenPos.x, screenPos.y);
        context.globalAlpha = alpha;
        drawCrystalShape(effect.size, effect, 1);
        context.restore();
      } else if (effect.kind === "hitRing") {
        context.strokeStyle = "rgba(255, 160, 80, " + (alpha * 0.75) + ")";
        context.lineWidth = 2;
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size + progress * 18, 0, TWO_PI);
        context.stroke();
      } else if (effect.kind === "collectRing") {
        context.strokeStyle = "rgba(100, 240, 255, " + (alpha * 0.8) + ")";
        context.lineWidth = 2.5;
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size + progress * 28, 0, TWO_PI);
        context.stroke();
      } else if (effect.kind === "collectFlash") {
        context.fillStyle = "rgba(140, 250, 255, " + (alpha * 0.35) + ")";
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size + progress * 20, 0, TWO_PI);
        context.fill();
      } else if (effect.kind === "spawnRing") {
        context.strokeStyle = "rgba(90, 230, 140, " + (alpha * 0.85) + ")";
        context.lineWidth = 2.5;
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size + progress * 32, 0, TWO_PI);
        context.stroke();
      } else if (effect.kind === "spawnFlash") {
        context.fillStyle = "rgba(80, 220, 120, " + (alpha * 0.4) + ")";
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size + progress * 24, 0, TWO_PI);
        context.fill();
      } else if (effect.kind === "deathFlash") {
        context.fillStyle = "rgba(255, 140, 60, " + (alpha * 0.45) + ")";
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size + progress * 30, 0, TWO_PI);
        context.fill();
      } else if (effect.kind === "mineBlast") {
        context.fillStyle = "rgba(255, 80, 40, " + (alpha * 0.55) + ")";
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size + progress * 42, 0, TWO_PI);
        context.fill();
        context.strokeStyle = "rgba(255, 200, 120, " + (alpha * 0.75) + ")";
        context.lineWidth = 2;
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size * 0.5 + progress * 24, 0, TWO_PI);
        context.stroke();
      } else if (effect.kind === "rocketStrike") {
        context.fillStyle = "rgba(255, 110, 45, " + (alpha * 0.62) + ")";
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size + progress * 58, 0, TWO_PI);
        context.fill();
        context.strokeStyle = "rgba(255, 230, 150, " + (alpha * 0.82) + ")";
        context.lineWidth = 2.5;
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size * 0.45 + progress * 34, 0, TWO_PI);
        context.stroke();
        context.fillStyle = "rgba(255, 60, 20, " + (alpha * 0.35) + ")";
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size * 0.25 + progress * 18, 0, TWO_PI);
        context.fill();
      } else if (effect.kind === "smoke") {
        context.fillStyle = "rgba(80, 60, 48, " + (alpha * 0.35) + ")";
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size, 0, TWO_PI);
        context.fill();
      } else if (effect.kind === "projectileTrail") {
        context.fillStyle = "rgba(100, 170, 255, " + (alpha * 0.5) + ")";
        context.beginPath();
        context.arc(screenPos.x, screenPos.y, effect.size, 0, TWO_PI);
        context.fill();
      }
    }
  }

  function shouldDrawUnitTrajectory(unit) {
    var arriveDist = isUnitTruckKind(unit) ? 8 : 5;
    return distanceSquared(unit.x, unit.y, unit.destinationX, unit.destinationY) > arriveDist * arriveDist;
  }

  function drawUnitTrajectory(unitScreenX, unitScreenY, destScreenX, destScreenY, lineColor, destColor, lineWidth, destRadius, useDash) {
    if (useDash) {
      context.setLineDash([6, 6]);
    } else {
      context.setLineDash([]);
    }
    context.strokeStyle = lineColor;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.moveTo(unitScreenX, unitScreenY);
    context.lineTo(destScreenX, destScreenY);
    context.stroke();
    context.setLineDash([]);
    context.strokeStyle = destColor;
    context.beginPath();
    context.arc(destScreenX, destScreenY, destRadius, 0, TWO_PI);
    context.stroke();
  }

  function drawBackgroundMoveTrajectories() {
    var index;
    var unit;
    var drawPos;
    var unitScreen;
    var destScreen;
    if (!isPlaying()) {
      return;
    }
    for (index = 0; index < units.length; index += 1) {
      unit = units[index];
      if (unit.dead) {
        continue;
      }
      if (unit.id === selectedUnitId) {
        continue;
      }
      if (unit.team !== "friendly" && unit.team !== "enemy") {
        continue;
      }
      if (!shouldDrawUnitTrajectory(unit)) {
        continue;
      }
      drawPos = getUnitDrawWorldPosition(unit);
      unitScreen = worldToScreen(drawPos.x, drawPos.y);
      destScreen = worldToScreen(unit.destinationX, unit.destinationY);
      if (unit.team === "friendly") {
        drawUnitTrajectory(
          unitScreen.x,
          unitScreen.y,
          destScreen.x,
          destScreen.y,
          TRAJECTORY_FRIENDLY_LINE,
          TRAJECTORY_FRIENDLY_DEST,
          1,
          5,
          true
        );
      } else {
        drawUnitTrajectory(
          unitScreen.x,
          unitScreen.y,
          destScreen.x,
          destScreen.y,
          TRAJECTORY_ENEMY_LINE,
          TRAJECTORY_ENEMY_DEST,
          1,
          5,
          true
        );
      }
    }
  }

  function drawMoveMarker() {
    var unit = getUnitById(selectedUnitId);
    if (!unit || !isPlaying()) {
      return;
    }
    if (isSelectedUnitKeyboardDriving()) {
      return;
    }
    if (!shouldDrawUnitTrajectory(unit)) {
      return;
    }
    var drawPos = getUnitDrawWorldPosition(unit);
    var destScreen = worldToScreen(unit.destinationX, unit.destinationY);
    var unitScreen = worldToScreen(drawPos.x, drawPos.y);
    drawUnitTrajectory(
      unitScreen.x,
      unitScreen.y,
      destScreen.x,
      destScreen.y,
      TRAJECTORY_SELECTED_LINE,
      TRAJECTORY_SELECTED_DEST,
      1.5,
      8,
      true
    );
  }

  function getScreenEdgePointFromCenter(dirX, dirY, margin) {
    var centerX = width * 0.5;
    var centerY = height * 0.5;
    var t = 999999;
    var tCandidate;
    if (dirX > 0.0001) {
      tCandidate = (width - margin - centerX) / dirX;
      if (tCandidate > 0 && tCandidate < t) {
        t = tCandidate;
      }
    } else if (dirX < -0.0001) {
      tCandidate = (margin - centerX) / dirX;
      if (tCandidate > 0 && tCandidate < t) {
        t = tCandidate;
      }
    }
    if (dirY > 0.0001) {
      tCandidate = (height - margin - centerY) / dirY;
      if (tCandidate > 0 && tCandidate < t) {
        t = tCandidate;
      }
    } else if (dirY < -0.0001) {
      tCandidate = (margin - centerY) / dirY;
      if (tCandidate > 0 && tCandidate < t) {
        t = tCandidate;
      }
    }
    if (t === 999999) {
      return { x: centerX, y: centerY };
    }
    return {
      x: centerX + dirX * t,
      y: centerY + dirY * t
    };
  }

  function getSpawnWarningEdgeBrightness(anchorX, anchorY) {
    var distLeft = anchorX;
    var distRight = width - anchorX;
    var distTop = anchorY;
    var distBottom = height - anchorY;
    var edgeDist = distLeft;
    var edgeRange = Math.min(width, height) * SPAWN_WARNING_EDGE_BRIGHTNESS_RANGE;
    var edgeFactor;
    if (distRight < edgeDist) {
      edgeDist = distRight;
    }
    if (distTop < edgeDist) {
      edgeDist = distTop;
    }
    if (distBottom < edgeDist) {
      edgeDist = distBottom;
    }
    if (edgeRange < 1) {
      edgeRange = 1;
    }
    if (edgeDist > edgeRange) {
      edgeDist = edgeRange;
    }
    edgeFactor = 0.42 + 0.58 * (1 - edgeDist / edgeRange);
    return edgeFactor;
  }

  function drawSpawnWarningArrow(anchorX, anchorY, angle, size, alpha, progress) {
    context.save();
    context.translate(anchorX, anchorY);
    context.rotate(angle);
    context.shadowColor = "rgba(255, 80, 60, " + (alpha * 0.85) + ")";
    context.shadowBlur = 6 + progress * 14;
    context.fillStyle = "rgba(255, 45, 38, " + alpha + ")";
    context.beginPath();
    context.moveTo(size, 0);
    context.lineTo(-size * 0.58, size * 0.48);
    context.lineTo(-size * 0.22, 0);
    context.lineTo(-size * 0.58, -size * 0.48);
    context.closePath();
    context.fill();
    context.strokeStyle = "rgba(255, 200, 170, " + (alpha * 0.75) + ")";
    context.lineWidth = 1.2 + progress * 0.8;
    context.stroke();
    context.shadowBlur = 0;
    context.restore();
  }

  function drawSpawnWarnings() {
    var anchorScreen;
    var angle;
    var baseAlpha;
    var centerX = width * 0.5;
    var centerY = height * 0.5;
    var dirLen;
    var dirX;
    var dirY;
    var edgeAnchor;
    var edgeBrightness;
    var progress;
    var size;
    var alpha;
    if (!pendingSpawnWaveAnchor || !isPlaying()) {
      return;
    }
    anchorScreen = {
      x: pendingSpawnWaveAnchor.screenX,
      y: pendingSpawnWaveAnchor.screenY
    };
    dirX = anchorScreen.x - centerX;
    dirY = anchorScreen.y - centerY;
    dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
    if (dirLen < 1) {
      dirX = 1;
      dirY = 0;
      dirLen = 1;
    }
    angle = Math.atan2(dirY / dirLen, dirX / dirLen);
    edgeAnchor = {
      x: anchorScreen.x,
      y: anchorScreen.y
    };
    progress = pendingSpawnWaveAnchor.progress;
    if (progress < 0) {
      progress = 0;
    }
    if (progress > 1) {
      progress = 1;
    }
    size = 10 + progress * 34;
    edgeBrightness = getSpawnWarningEdgeBrightness(edgeAnchor.x, edgeAnchor.y);
    baseAlpha = 0.28 + progress * 0.62;
    alpha = baseAlpha * edgeBrightness;
    drawSpawnWarningArrow(edgeAnchor.x, edgeAnchor.y, angle, size, alpha, progress);
  }

  function drawMineWarningSign(screenX, screenY, size, alpha, blinkOn) {
    var signAlpha = alpha;
    var minePulse;
    if (!blinkOn) {
      signAlpha = alpha * 0.35;
    }
    minePulse = blinkOn ? 1 : 0.3;
    context.save();
    context.translate(screenX, screenY);
    context.fillStyle = "rgba(255, 190, 40, " + signAlpha + ")";
    context.strokeStyle = "rgba(120, 60, 10, " + signAlpha + ")";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, -size);
    context.lineTo(size * 0.92, size * 0.72);
    context.lineTo(-size * 0.92, size * 0.72);
    context.closePath();
    context.fill();
    context.stroke();
    drawMineShape(0, size * 0.12, size * 0.3, minePulse);
    context.restore();
  }

  function drawRocketWarningSign(screenX, screenY, size, alpha) {
    var flameAlpha;
    context.save();
    context.translate(screenX, screenY);
    context.rotate(Math.PI);
    context.fillStyle = "rgba(210, 215, 225, " + alpha + ")";
    context.strokeStyle = "rgba(70, 75, 90, " + alpha + ")";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(0, -size * 1.05);
    context.lineTo(size * 0.22, size * 0.55);
    context.lineTo(0, size * 0.38);
    context.lineTo(-size * 0.22, size * 0.55);
    context.closePath();
    context.fill();
    context.stroke();
    context.beginPath();
    context.moveTo(-size * 0.34, size * 0.42);
    context.lineTo(-size * 0.58, size * 0.72);
    context.lineTo(-size * 0.18, size * 0.58);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(size * 0.34, size * 0.42);
    context.lineTo(size * 0.58, size * 0.72);
    context.lineTo(size * 0.18, size * 0.58);
    context.closePath();
    context.fill();
    flameAlpha = alpha * 0.85;
    context.fillStyle = "rgba(255, 120, 40, " + flameAlpha + ")";
    context.beginPath();
    context.moveTo(-size * 0.14, size * 0.55);
    context.lineTo(0, size * 0.95);
    context.lineTo(size * 0.14, size * 0.55);
    context.closePath();
    context.fill();
    context.fillStyle = "rgba(255, 210, 80, " + (flameAlpha * 0.85) + ")";
    context.beginPath();
    context.moveTo(-size * 0.08, size * 0.55);
    context.lineTo(0, size * 0.78);
    context.lineTo(size * 0.08, size * 0.55);
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawRocketStrikeWarnings() {
    var impactScreen;
    var targetScreenX;
    var targetScreenY;
    var progress;
    var alpha;
    var blinkOn;
    var previewRadius;
    var iconSize;
    var fallDistance;
    var rocketScreenY;
    var innerRadius;
    var innerAlpha;
    if (!pendingRocketStrikeWarning || !isPlaying()) {
      return;
    }
    progress = pendingRocketStrikeWarning.progress;
    if (progress < 0) {
      progress = 0;
    }
    if (progress > 1) {
      progress = 1;
    }
    impactScreen = worldToScreen(pendingRocketStrikeWarning.worldX, pendingRocketStrikeWarning.worldY);
    targetScreenX = impactScreen.x;
    targetScreenY = impactScreen.y;
    fallDistance = targetScreenY + ROCKET_STRIKE_FALL_FROM_TOP;
    rocketScreenY = targetScreenY - (1 - progress) * fallDistance;
    alpha = 0.42 + progress * 0.52;
    blinkOn = Math.sin(gameTime * 9) > 0;
    iconSize = 14 + progress * 10;
    drawRocketWarningSign(targetScreenX, rocketScreenY, iconSize, alpha);
    previewRadius = ROCKET_STRIKE_RADIUS * (0.55 + progress * 0.45);
    context.strokeStyle = "rgba(255, 90, 40, " + (0.2 + progress * 0.32) + ")";
    context.lineWidth = 2;
    context.setLineDash([8, 8]);
    context.beginPath();
    context.arc(targetScreenX, targetScreenY, previewRadius, 0, TWO_PI);
    context.stroke();
    context.setLineDash([]);
    if (blinkOn) {
      context.fillStyle = "rgba(255, 70, 35, " + (0.08 + progress * 0.14) + ")";
      context.beginPath();
      context.arc(targetScreenX, targetScreenY, previewRadius, 0, TWO_PI);
      context.fill();
    }
    innerRadius = lerp(previewRadius * 0.92, 6, progress * progress);
    innerAlpha = 0.16 + progress * 0.42;
    context.strokeStyle = "rgba(255, 150, 60, " + innerAlpha + ")";
    context.lineWidth = 2.5;
    context.setLineDash([]);
    context.beginPath();
    context.arc(targetScreenX, targetScreenY, innerRadius, 0, TWO_PI);
    context.stroke();
    context.fillStyle = "rgba(255, 90, 35, " + (innerAlpha * 0.35) + ")";
    context.beginPath();
    context.arc(targetScreenX, targetScreenY, innerRadius * 0.55, 0, TWO_PI);
    context.fill();
  }

  function drawMinefieldWarnings() {
    var screenPos;
    var progress;
    var alpha;
    var blinkOn;
    var previewRadius;
    var iconSize;
    if (!pendingMinefieldWarning || !isPlaying() || pendingMinefieldWarning.dropStarted) {
      return;
    }
    screenPos = getMinefieldWarningScreenPosition();
    progress = pendingMinefieldWarning.progress;
    if (progress < 0) {
      progress = 0;
    }
    if (progress > 1) {
      progress = 1;
    }
    alpha = 0.42 + progress * 0.52;
    blinkOn = Math.sin(gameTime * 10) > 0;
    iconSize = 16 + progress * 8;
    drawMineWarningSign(screenPos.x, screenPos.y, iconSize, alpha, blinkOn);
    previewRadius = MINEFIELD_CLUSTER_RADIUS * (0.55 + progress * 0.45);
    context.strokeStyle = "rgba(255, 70, 50, " + (0.18 + progress * 0.28) + ")";
    context.lineWidth = 2;
    context.setLineDash([8, 8]);
    context.beginPath();
    context.arc(screenPos.x, screenPos.y, previewRadius, 0, TWO_PI);
    context.stroke();
    context.setLineDash([]);
  }

  function drawVignette() {
    var gradient = context.createRadialGradient(
      width * 0.5, height * 0.5, width * 0.15,
      width * 0.5, height * 0.5, width * 0.65
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.18)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  function render() {
    context.clearRect(0, 0, width, height);
    drawWastelandFloor();
    drawObstacles();
    drawDebris();
    drawMines();
    drawDustParticles();
    drawCrystals();
    drawUnits();
    drawProjectiles();
    drawVisualEffects();
    drawBackgroundMoveTrajectories();
    drawMoveMarker();
    drawSpawnWarnings();
    drawRocketStrikeWarnings();
    drawMinefieldWarnings();
    drawVignette();
  }

  function resizeCanvas() {
    var rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    devicePixelRatioScale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * devicePixelRatioScale);
    canvas.height = Math.floor(height * devicePixelRatioScale);
    context.setTransform(devicePixelRatioScale, 0, 0, devicePixelRatioScale, 0, 0);
  }

  function applyGameLocale() {
    document.title = getGameTitle();
    if (isStart()) {
      screenTitle.textContent = getGameTitle();
    } else if (isGameOver()) {
      screenTitle.textContent = getLocalized(LOCALE_KEY_GAME_OVER, "Game Over");
      syncGameOverScore();
    }
    controlHint.textContent = getLocalized(
      LOCALE_KEY_HINT,
      "Escort the hauler across the wasteland. Select vehicles, click to reposition, collect crystals, reinforce the convoy."
    );
    syncBestHud(gameScreen.classList.contains("is-record"));
    if (isPlaying()) {
      syncPlayingHud();
    }
  }

  function bindLocaleListener() {
    window.addEventListener("web-locale-applied", applyGameLocale);
  }

  var lastFrameTime = 0;
  function gameLoop(timestamp) {
    if (!lastFrameTime) {
      lastFrameTime = timestamp;
    }
    var deltaSeconds = Math.min(0.05, (timestamp - lastFrameTime) / 1000);
    lastFrameTime = timestamp;
    update(deltaSeconds);
    render();
    window.requestAnimationFrame(gameLoop);
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onWindowBlur);
  gameRoot.addEventListener("keydown", onKeyDown);
  gameRoot.addEventListener("keyup", onKeyUp);
  gameRoot.addEventListener("pointerdown", onPointerDown);
  gameRoot.addEventListener("pointermove", onPointerMove);

  bindLocaleListener();
  loadHighScore();
  resizeCanvas();
  showStartScreen();
  applyGameLocale();
  render();
  window.requestAnimationFrame(gameLoop);
})();
