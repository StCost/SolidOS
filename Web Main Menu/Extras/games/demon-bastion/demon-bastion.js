(function () {
  var WORLD_CONFIG = {
    size: 64,
    minimapPixels: 64,
    spawnClearRadius: 4,
    worldEdgeMargin: 2,
    mountainBlobCount: 16,
    mountainBlobRadiusMin: 2,
    mountainBlobRadiusMax: 5,
    mountainWalkBlobCount: 9,
    mountainWalkStepsMin: 4,
    mountainWalkStepsMax: 12,
    mountainBlobSpawnClearExtra: 4,
    mountainWalkSpawnClearExtra: 3
  };

  var WORLD_SIZE = WORLD_CONFIG.size;
  var DEFAULT_CELL_PIXEL_SIZE = 10;
  var ZOOM_MAX_CELL_PIXEL_SIZE = 48;
  var ZOOM_STEP = 2;
  var PHASE_START = "start";
  var PHASE_PLAYING = "playing";
  var PHASE_GAME_OVER = "gameover";

  var TERRAIN_GROUND = 0;
  var TERRAIN_MOUNTAIN = 1;

  var BUILD_NONE = "none";
  var BUILD_WALL = "wall";
  var BUILD_TURRET = "turret";
  var BUILD_LASER = "laser";
  var BUILD_MINE = "mine";
  var BUILD_DOG_HOUSE = "dog_house";
  var BUILD_WORKSHOP = "workshop";
  var BUILD_ROCKET = "rocket";
  var BUILD_MINE_SHAFT = "mine_shaft";
  var BUILD_SELL = "sell";

  var UNIT_WORKER = "worker";
  var UNIT_DOG = "dog";
  var UNIT_DEMON = "demon";

  var DIRECTIONS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  var ESCAPE_DIRECTIONS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1]
  ];

  var BUILD_DEFINITIONS = [
    { id: BUILD_WALL, label: "Wall", cost: 5, color: "#8a7a68", hp: 80 },
    { id: BUILD_TURRET, label: "Turret", cost: 25, color: "#5a8a50", hp: 120, range: 7, fireCooldown: 0.55, damage: 14 },
    { id: BUILD_LASER, label: "Laser", cost: 40, color: "#d8c030", hp: 100, range: 8, fireCooldown: 0.06, damage: 5, laser: true },
    { id: BUILD_MINE, label: "Mine", cost: 15, color: "#aa3030", hp: 1, trapDamage: 55, splash: 2 },
    { id: BUILD_DOG_HOUSE, label: "Dog House", cost: 35, color: "#a07040", hp: 140 },
    { id: BUILD_WORKSHOP, label: "Workshop", cost: 80, color: "#5080c0", hp: 260, spawnsWorker: true, passiveIncome: 0.35, passiveInterval: 5 },
    { id: BUILD_ROCKET, label: "Rocket Sentry", cost: 55, color: "#c06030", hp: 130, range: 11, fireCooldown: 1.4, damage: 42, splash: 2 },
    { id: BUILD_MINE_SHAFT, label: "Mine Shaft", cost: 45, color: "#686868", hp: 160, passiveIncome: 0.35, passiveInterval: 1 }
  ];

  var DEMON_ANGER_MAX = 100;
  var DEMON_ANGER_PER_CREDIT = 0.1;
  var PATHFIND_MAX_NODES = 12000;
  var MARCH_PATHFIND_MAX_NODES = 50000;
  var PATH_CHANGE_NEAR_PATH_PADDING = 3;
  var PATH_RECALC_INTERVAL = 0.45;
  var DEMON_PATH_RECALC_INTERVAL = 0.45;
  var DEMON_OPEN_ROUTE_CHECK_INTERVAL = 0.85;
  var WORKER_ORDER_SCAN_INTERVAL = 0.35;
  var UNIT_SNAP_SEARCH_RADIUS = 16;
  var CAMERA_PAN_SPEED = 420;
  var CAMERA_OVERSCROLL_VIEW_FRACTION = 0.5;
  var WORKER_SPEED = 38;
  var WORKER_MINE_DAMAGE = 1;
  var WORKER_MINE_INTERVAL = 0.35;
  var MOUNTAIN_DIG_HITS = 4;
  var ORE_DIG_HITS = 7;
  var DEMON_SPEED = 8;
  var PROJECTILE_HIT_RADIUS = 1.25;
  var UNIT_POSITION_PULL = 0.2;
  var DEMON_DAMAGE = 18;
  var DEMON_ATTACK_INTERVAL = 0.55;
  var DEMON_HP = 70;
  var DOG_SPEED = 62;
  var DOG_DAMAGE = 16;
  var DOG_SPAWN_INTERVAL = 8;
  var DOG_ATTACK_RANGE = 10;
  var DOG_CHASE_PATH_DRIFT_CELLS = 2;
  var WORKER_ROAM_RADIUS = 6;
  var WORKER_ROAM_SPEED = WORKER_SPEED * 0.32;
  var WORKER_ROAM_ARRIVE_DISTANCE = 0.12;
  var WORKER_STUCK_SECONDS = 0.6;
  var WORKER_IDLE_MINE_ORDER_CHANCE = 0.004;
  var SPAWN_CLEAR_RADIUS = WORLD_CONFIG.spawnClearRadius;
  var ORE_DENSITY = 0.09;
  var ORE_REWARD_MIN = 80;
  var ORE_REWARD_MAX = 180;
  var PASSIVE_INCOME_MULTIPLIER = 40;
  var FLOATING_TEXT_COLOR_REWARD = "#70e890";
  var FLOATING_TEXT_PREFIX_REWARD = "+";
  var LASER_BEAM_DURATION = 0.1;
  var ROCKET_BLAST_DURATION = 0.45;
  var DEATH_EFFECT_DURATION = 0.55;
  var DEATH_EFFECT_PARTICLE_COUNT = 10;
  var DEATH_EFFECT_FLASH_DURATION = 0.28;
  var BUILD_ORDER_BUILD_INTERVAL = 0.27;
  var BUILD_ORDER_HITS = 6;
  var BUILD_ORDER_WALL_HITS = 3;
  var BUILD_SELL_REFUND_FRACTION = 0.6;
  var BUILD_FOOTPRINT_WORKSHOP = 4;
  var BUILD_FOOTPRINT_ROCKET = 3;
  var BUILD_FOOTPRINT_LARGE = 2;
  var SPRITE_ROTATION_HASH_SALT = 1013904223;
  var WORLD_CENTER = WORLD_SIZE >> 1;
  var WORLD_SPAWN_X = WORLD_CENTER >> 1;
  var WORLD_SPAWN_Y = WORLD_SPAWN_X;
  var INITIAL_WORKSHOP_X = WORLD_SPAWN_X;
  var INITIAL_WORKSHOP_Y = WORLD_SPAWN_Y;
  var MOUNTAIN_BLOB_COUNT = WORLD_CONFIG.mountainBlobCount;
  var MOUNTAIN_BLOB_RADIUS_MIN = WORLD_CONFIG.mountainBlobRadiusMin;
  var MOUNTAIN_BLOB_RADIUS_MAX = WORLD_CONFIG.mountainBlobRadiusMax;
  var MOUNTAIN_WALK_BLOB_COUNT = WORLD_CONFIG.mountainWalkBlobCount;
  var MOUNTAIN_WALK_STEPS_MIN = WORLD_CONFIG.mountainWalkStepsMin;
  var MOUNTAIN_WALK_STEPS_MAX = WORLD_CONFIG.mountainWalkStepsMax;
  var MOUNTAIN_BLOB_SPAWN_CLEAR_EXTRA = WORLD_CONFIG.mountainBlobSpawnClearExtra;
  var MOUNTAIN_WALK_SPAWN_CLEAR_EXTRA = WORLD_CONFIG.mountainWalkSpawnClearExtra;
  var WORLD_EDGE_MARGIN = WORLD_CONFIG.worldEdgeMargin;
  var MINIMAP_PIXELS = WORLD_CONFIG.minimapPixels;
  var ENEMY_ARROW_EDGE_MARGIN = 28;
  var ENEMY_ARROW_SIZE = 14;
  var SPAWN_PREVIEW_COARSE_STEP = 2;
  var SPAWN_PREVIEW_REFINE_RADIUS = 8;
  var SPAWN_EDGE_NORTH = 0;
  var SPAWN_EDGE_EAST = 1;
  var SPAWN_EDGE_SOUTH = 2;
  var SPAWN_EDGE_WEST = 3;
  var SPAWN_EDGE_COUNT = 4;
  var SPAWN_EDGE_BAND = 6;
  var SPAWN_EDGE_PICK_SCREEN_MARGIN = 40;
  var SPAWN_CORNER_NW = 0;
  var SPAWN_CORNER_NE = 1;
  var SPAWN_CORNER_SE = 2;
  var SPAWN_CORNER_SW = 3;
  var SPAWN_CORNER_COUNT = 4;
  var SPAWN_CORNER_BAND = 10;
  var SPAWN_CORNER_LABEL_NE = "NE SPAWN";
  var SPAWN_CORNER_LABEL_SE = "SE SPAWN";
  var SPAWN_CORNER_LABEL_SW = "SW SPAWN";
  var SPAWN_CORNER_LABEL_NW = "NW SPAWN";
  var SPAWN_EDGE_LABEL_NORTH = "NORTH SPAWN";
  var SPAWN_EDGE_LABEL_EAST = "EAST SPAWN";
  var SPAWN_EDGE_LABEL_SOUTH = "SOUTH SPAWN";
  var SPAWN_EDGE_LABEL_WEST = "WEST SPAWN";
  var UNIT_PATH_VIEW_MARGIN = 3;
  var UNIT_PATH_LINE_WIDTH_SCALE = 0.06;
  var UNIT_PATH_DASH_SCALE = 0.16;
  var WORLD_SIMPLE_RENDER_MAX_CELLS = 2250;
  var WORLD_SIMPLE_RENDER_CELL_PIXEL = 7;
  var MINIMAP_DISPLAY_SIZE = 160;
  var MINIMAP_COLOR_GROUND = "#3a5038";
  var MINIMAP_COLOR_MOUNTAIN = "#4a4038";
  var MINIMAP_COLOR_ORE = "#7a5830";
  var MINIMAP_COLOR_WALL = "#8a7868";
  var MINIMAP_COLOR_BUILDING = "#5080c0";
  var MINIMAP_COLOR_VIEWPORT = "#ff9030";
  var MINIMAP_COLOR_PREDICTED_PATH = "rgba(255, 70, 50, 0.95)";
  var MINIMAP_COLOR_PREDICTED_PATH_GLOW = "rgba(255, 110, 70, 0.45)";
  var MINIMAP_COLOR_ATTACK_PATH = "rgba(255, 150, 70, 0.9)";
  var MINIMAP_COLOR_ATTACK_PATH_GLOW = "rgba(255, 180, 100, 0.35)";
  var MINIMAP_COLOR_BUILD_ORDER = "rgba(255, 200, 80, 0.95)";
  var MINIMAP_COLOR_BUILD_ORDER_CLAIMED = "rgba(120, 200, 255, 0.95)";
  var MINIMAP_PREDICTED_PATH_WIDTH = 3;
  var MINIMAP_ATTACK_PATH_WIDTH = 2;
  var MINIMAP_RGB_GROUND = [58, 80, 56];
  var MINIMAP_RGB_MOUNTAIN = [74, 64, 56];
  var MINIMAP_RGB_ORE = [122, 88, 48];
  var MINIMAP_RGB_WALL = [138, 120, 104];
  var MINIMAP_RGB_BUILDING = [80, 128, 192];

  var SPRITE_FILE_BY_KEY = {
    ground: "sprites/sprite-ground.png",
    mountain: "sprites/sprite-mountain.png",
    ore: "sprites/sprite-ore.png",
    wall: "sprites/sprite-wall.png",
    turret: "sprites/sprite-turret.png",
    laser: "sprites/sprite-laser.png",
    mine: "sprites/sprite-mine.png",
    dog_house: "sprites/sprite-dog-house.png",
    workshop: "sprites/sprite-workshop.png",
    rocket: "sprites/sprite-rocket.png",
    mine_shaft: "sprites/sprite-mine-shaft.png",
    worker: "sprites/sprite-worker.png",
    dog: "sprites/sprite-dog.png",
    demon: "sprites/sprite-demon.png",
    projectile: "sprites/sprite-projectile.png"
  };

  var gameRoot;
  var canvas;
  var context;
  var minimapPanel;
  var minimapCanvas;
  var minimapContext;
  var minimapImageData;
  var minimapBaseCanvas;
  var minimapBaseContext;
  var minimapDirty = true;
  var livingDemonCount = 0;
  var btnZoomIn;
  var btnZoomOut;
  var hudTop;
  var hudMoney;
  var hudAngerFill;
  var hudWave;
  var buildBar;
  var gameScreen;
  var gameOverLine;
  var controlHint;

  var terrain;
  var oreMask;
  var digProgress;
  var playerWall;
  var wallDigProgress;
  var mineOrders;
  var activeMineOrderCount = 0;
  var buildOrders;
  var buildOrderCellIds;
  var activeBuildOrderCount = 0;
  var nextBuildOrderId = 1;
  var buildings;
  var units;
  var projectiles;
  var laserBeams;
  var rocketBlasts;
  var deathEffects;
  var floatingTexts;

  var phase = PHASE_START;
  var money = 0;
  var demonAnger = 0;
  var waveNumber = 0;
  var pendingWaveSpawns = 0;
  var nextSpawnWorldX = WORLD_SPAWN_X;
  var nextSpawnWorldY = 4;
  var nextSpawnCellX = WORLD_SPAWN_X;
  var nextSpawnCellY = 4;
  var nextSpawnGoalX = -1;
  var nextSpawnGoalY = -1;
  var nextSpawnPath = null;
  var spawnDirectionDirty = true;
  var selectedSpawnCorner = -1;
  var lastSpawnArrowScreenX = -1;
  var lastSpawnArrowScreenY = -1;
  var lastSpawnArrowHitRadius = 0;
  var pathfindingWorldRevision = 1;
  var pathChangeCellX = -1;
  var pathChangeCellY = -1;
  var pathChangeRadius = 0;
  var nextSpawnPreviewWorldRevision = -1;
  var selectedBuildId = BUILD_NONE;
  var spriteImagesByKey = {};
  var spriteLoadCount = 0;
  var spriteLoadTarget = 0;
  var spritesReady = false;
  var cameraX = WORLD_SPAWN_X;
  var cameraY = WORLD_SPAWN_Y;
  var cellPixelSize = DEFAULT_CELL_PIXEL_SIZE;
  var canvasWidth = 0;
  var canvasHeight = 0;
  var viewCellsX = 0;
  var viewCellsY = 0;
  var buildBarBuilt = false;
  var buildButtonsById = null;
  var lastFrameTime = 0;
  var animationHandle = 0;
  var pointerDown = false;
  var pointerDrag = false;
  var minimapPointerDown = false;
  var canvasActivePointerId = -1;
  var pointerStartX = 0;
  var pointerStartY = 0;
  var pointerLastX = 0;
  var pointerLastY = 0;
  var dragCameraStartX = 0;
  var dragCameraStartY = 0;
  var pointerScreenX = 0;
  var pointerScreenY = 0;
  var canvasPointerInside = false;
  var keysDown = {};
  var pathScratchVisited = null;
  var pathScratchParent = null;
  var pathScratchQueueX = null;
  var pathScratchQueueY = null;
  var pathScratchHeap = null;
  var worldSeed = 0;

  function cellIndex(cellX, cellY) {
    return cellY * WORLD_SIZE + cellX;
  }

  function inBounds(cellX, cellY) {
    return cellX >= 0 && cellY >= 0 && cellX < WORLD_SIZE && cellY < WORLD_SIZE;
  }

  function randomFloat() {
    worldSeed = (worldSeed * 1664525 + 1013904223) >>> 0;
    return worldSeed / 4294967296;
  }

  function randomInt(minValue, maxValue) {
    return minValue + Math.floor(randomFloat() * (maxValue - minValue + 1));
  }

  function getBuildDefinition(buildId) {
    if (buildId === BUILD_NONE) {
      return null;
    }
    var index;
    for (index = 0; index < BUILD_DEFINITIONS.length; index++) {
      if (BUILD_DEFINITIONS[index].id === buildId) {
        return BUILD_DEFINITIONS[index];
      }
    }
    return BUILD_DEFINITIONS[0];
  }

  function getBuildFootprintSize(buildType) {
    if (buildType === BUILD_WALL || buildType === BUILD_MINE) {
      return 1;
    }
    if (buildType === BUILD_TURRET || buildType === BUILD_DOG_HOUSE) {
      return 1;
    }
    if (buildType === BUILD_WORKSHOP) {
      return BUILD_FOOTPRINT_WORKSHOP;
    }
    if (buildType === BUILD_ROCKET) {
      return BUILD_FOOTPRINT_ROCKET;
    }
    return BUILD_FOOTPRINT_LARGE;
  }

  function getBuildingSpriteKey(buildType) {
    if (buildType === BUILD_WALL) {
      return "wall";
    }
    if (buildType === BUILD_TURRET) {
      return "turret";
    }
    if (buildType === BUILD_LASER) {
      return "laser";
    }
    if (buildType === BUILD_MINE) {
      return "mine";
    }
    if (buildType === BUILD_DOG_HOUSE) {
      return "dog_house";
    }
    if (buildType === BUILD_WORKSHOP) {
      return "workshop";
    }
    if (buildType === BUILD_ROCKET) {
      return "rocket";
    }
    if (buildType === BUILD_MINE_SHAFT) {
      return "mine_shaft";
    }
    return "ground";
  }

  function getUnitSpriteKey(unitKind) {
    if (unitKind === UNIT_WORKER) {
      return "worker";
    }
    if (unitKind === UNIT_DOG) {
      return "dog";
    }
    return "demon";
  }

  function getSpriteSourceSize(spriteSource) {
    if (!spriteSource) {
      return { width: 0, height: 0 };
    }
    if (spriteSource.naturalWidth > 0) {
      return { width: spriteSource.naturalWidth, height: spriteSource.naturalHeight };
    }
    return { width: spriteSource.width || 0, height: spriteSource.height || 0 };
  }

  function onSpriteLoaded() {
    spriteLoadCount += 1;
    if (spriteLoadCount >= spriteLoadTarget) {
      spritesReady = true;
    }
  }

  function loadSprites() {
    var spriteKey;
    for (spriteKey in SPRITE_FILE_BY_KEY) {
      if (!SPRITE_FILE_BY_KEY.hasOwnProperty(spriteKey)) {
        continue;
      }
      spriteLoadTarget += 1;
      var image = new Image();
      image.onload = function () {
        spriteImagesByKey[spriteKey] = image;
        onSpriteLoaded();
      };
      image.onerror = onSpriteLoaded;
      image.src = SPRITE_FILE_BY_KEY[spriteKey];
      spriteImagesByKey[spriteKey] = image;
    }
  }

  function getCellSpriteRotationTurns(cellX, cellY) {
    return Math.floor(hashNoise(cellX, cellY) * 4) % 4;
  }

  function getCellSpriteRotationRadians(cellX, cellY) {
    return getCellSpriteRotationTurns(cellX, cellY) * (Math.PI * 0.5);
  }

  function drawSprite(spriteKey, screenX, screenY, drawWidth, drawHeight, rotationRadians) {
    var image = spriteImagesByKey[spriteKey];
    var sourceSize = getSpriteSourceSize(image);
    if (!spritesReady || !image || sourceSize.width < 1) {
      return false;
    }
    context.imageSmoothingEnabled = false;
    if (!rotationRadians) {
      context.drawImage(image, screenX, screenY, drawWidth, drawHeight);
      return true;
    }
    context.save();
    context.translate(screenX + drawWidth * 0.5, screenY + drawHeight * 0.5);
    context.rotate(rotationRadians);
    context.drawImage(image, -drawWidth * 0.5, -drawHeight * 0.5, drawWidth, drawHeight);
    context.restore();
    return true;
  }

  function drawSpriteAtCell(cellX, cellY, spriteKey) {
    var screen = worldToScreen(cellX, cellY);
    var rotationRadians = getCellSpriteRotationRadians(cellX, cellY);
    return drawSprite(spriteKey, screen.x, screen.y, cellPixelSize, cellPixelSize, rotationRadians);
  }

  function hashNoise(cellX, cellY) {
    var hash = cellX * 374761393 + cellY * 668265263 + SPRITE_ROTATION_HASH_SALT;
    hash = (hash ^ (hash >>> 13)) >>> 0;
    hash = (hash * 1274126177) >>> 0;
    return (hash & 65535) / 65535;
  }

  function isInsideSpawnClear(cellX, cellY, extraRadius) {
    var radius = SPAWN_CLEAR_RADIUS;
    if (extraRadius) {
      radius += extraRadius;
    }
    return manhattanDistance(cellX, cellY, WORLD_SPAWN_X, WORLD_SPAWN_Y) <= radius;
  }

  function stampMountainBlob(centerX, centerY, radiusX, radiusY) {
    var minX = centerX - radiusX - 3;
    var maxX = centerX + radiusX + 3;
    var minY = centerY - radiusY - 3;
    var maxY = centerY + radiusY + 3;
    if (minX < 0) minX = 0;
    if (minY < 0) minY = 0;
    if (maxX >= WORLD_SIZE) maxX = WORLD_SIZE - 1;
    if (maxY >= WORLD_SIZE) maxY = WORLD_SIZE - 1;
    var cellX;
    var cellY;
    for (cellY = minY; cellY <= maxY; cellY++) {
      for (cellX = minX; cellX <= maxX; cellX++) {
        if (isInsideSpawnClear(cellX, cellY, 8)) {
          continue;
        }
        var offsetX = (cellX - centerX) / radiusX;
        var offsetY = (cellY - centerY) / radiusY;
        var distanceSquared = offsetX * offsetX + offsetY * offsetY;
        var wobble = 0.72 + hashNoise(cellX, cellY) * 0.38;
        if (distanceSquared <= wobble) {
          terrain[cellIndex(cellX, cellY)] = TERRAIN_MOUNTAIN;
        }
      }
    }
  }

  function growMountainWalk(startX, startY, stepCount) {
    var cellX = startX;
    var cellY = startY;
    var stepIndex;
    for (stepIndex = 0; stepIndex < stepCount; stepIndex++) {
      if (inBounds(cellX, cellY) && !isInsideSpawnClear(cellX, cellY, 8)) {
        terrain[cellIndex(cellX, cellY)] = TERRAIN_MOUNTAIN;
        var blobRadius = randomInt(2, 5);
        stampMountainBlob(cellX, cellY, blobRadius, blobRadius);
      }
      var directionIndex = randomInt(0, DIRECTIONS.length - 1);
      cellX += DIRECTIONS[directionIndex][0];
      cellY += DIRECTIONS[directionIndex][1];
      if (cellX < 4) cellX = 4;
      if (cellY < 4) cellY = 4;
      if (cellX >= WORLD_SIZE - 4) cellX = WORLD_SIZE - 5;
      if (cellY >= WORLD_SIZE - 4) cellY = WORLD_SIZE - 5;
    }
  }

  function scatterOreOnMountains() {
    var cellX;
    var cellY;
    for (cellY = 0; cellY < WORLD_SIZE; cellY++) {
      for (cellX = 0; cellX < WORLD_SIZE; cellX++) {
        var index = cellIndex(cellX, cellY);
        if (terrain[index] !== TERRAIN_MOUNTAIN) {
          continue;
        }
        if (randomFloat() < ORE_DENSITY) {
          oreMask[index] = 1;
        }
      }
    }
  }

  function clearSpawnArea() {
    var cellX;
    var cellY;
    for (cellY = WORLD_SPAWN_Y - SPAWN_CLEAR_RADIUS; cellY <= WORLD_SPAWN_Y + SPAWN_CLEAR_RADIUS; cellY++) {
      for (cellX = WORLD_SPAWN_X - SPAWN_CLEAR_RADIUS; cellX <= WORLD_SPAWN_X + SPAWN_CLEAR_RADIUS; cellX++) {
        if (!inBounds(cellX, cellY)) {
          continue;
        }
        var clearIndex = cellIndex(cellX, cellY);
        terrain[clearIndex] = TERRAIN_GROUND;
        oreMask[clearIndex] = 0;
        digProgress[clearIndex] = 0;
        mineOrders[clearIndex] = 0;
      }
    }
  }

  function isMountain(cellX, cellY) {
    if (!inBounds(cellX, cellY) || !terrain) {
      return true;
    }
    return terrain[cellIndex(cellX, cellY)] === TERRAIN_MOUNTAIN;
  }

  function isPlayerWall(cellX, cellY) {
    if (!inBounds(cellX, cellY) || !playerWall) {
      return false;
    }
    return playerWall[cellIndex(cellX, cellY)] === 1;
  }

  function getBuildingAt(cellX, cellY) {
    var index;
    for (index = 0; index < buildings.length; index++) {
      var building = buildings[index];
      var size = building.size || 1;
      if (cellX >= building.x && cellX < building.x + size && cellY >= building.y && cellY < building.y + size) {
        return building;
      }
    }
    return null;
  }

  function isTrapMineBuilding(building) {
    return building && building.type === BUILD_MINE;
  }

  function isTrapMineCell(cellX, cellY) {
    return isTrapMineBuilding(getBuildingAt(cellX, cellY));
  }

  function isCellWalkableForUnit(unit, cellX, cellY) {
    if (unit.kind === UNIT_DEMON && isTrapMineCell(cellX, cellY)) {
      return true;
    }
    return isCellWalkable(cellX, cellY);
  }

  function isCellBlockedForWalk(cellX, cellY, ignoreAttackable, ignoreTrapMines) {
    if (!inBounds(cellX, cellY)) {
      return true;
    }
    if (isMountain(cellX, cellY)) {
      return true;
    }
    if (isPlayerWall(cellX, cellY)) {
      if (ignoreAttackable) {
        return false;
      }
      return true;
    }
    var building = getBuildingAt(cellX, cellY);
    if (building) {
      if (ignoreTrapMines && isTrapMineBuilding(building)) {
        return false;
      }
      if (ignoreAttackable) {
        return false;
      }
      return true;
    }
    return false;
  }

  function markMinimapDirty() {
    minimapDirty = true;
  }

  function markPathfindingWorldDirtyAt(cellX, cellY, radius) {
    pathfindingWorldRevision += 1;
    pathChangeCellX = cellX;
    pathChangeCellY = cellY;
    pathChangeRadius = radius;
    markSpawnDirectionDirty();
  }

  function markPathfindingWorldDirty() {
    markPathfindingWorldDirtyAt(-1, -1, WORLD_SIZE);
  }

  function pathChangeNearUnitPath(unit, changeX, changeY, radius) {
    if (changeX < 0) {
      return true;
    }
    var reach = radius + PATH_CHANGE_NEAR_PATH_PADDING;
    var unitCellX = Math.floor(unit.x);
    var unitCellY = Math.floor(unit.y);
    if (manhattanDistance(unitCellX, unitCellY, changeX, changeY) <= reach) {
      return true;
    }
    if (!unit.path || unit.pathIndex >= unit.path.length) {
      return false;
    }
    var pathIndex;
    for (pathIndex = unit.pathIndex; pathIndex < unit.path.length; pathIndex++) {
      var waypoint = unit.path[pathIndex];
      if (manhattanDistance(waypoint.x, waypoint.y, changeX, changeY) <= reach) {
        return true;
      }
    }
    return false;
  }

  function assignUnitPath(unit, path, goalX, goalY) {
    unit.path = path;
    unit.pathIndex = path && path.length > 1 ? 1 : 0;
    unit.pathGoalX = goalX;
    unit.pathGoalY = goalY;
    unit.pathWorldRevision = pathfindingWorldRevision;
  }

  function getUnitPathStartIndex(unit, path) {
    if (!path || path.length === 0) {
      return 0;
    }
    var unitCellX = Math.floor(unit.x);
    var unitCellY = Math.floor(unit.y);
    var index;
    for (index = 0; index < path.length; index++) {
      var waypoint = path[index];
      if (waypoint.x === unitCellX && waypoint.y === unitCellY) {
        continue;
      }
      return index;
    }
    return path.length;
  }

  function assignDemonPath(unit, path, goalX, goalY) {
    assignUnitPath(unit, path, goalX, goalY);
    if (!path) {
      return;
    }
    unit.pathIndex = getUnitPathStartIndex(unit, path);
  }

  function clearUnitPath(unit) {
    unit.path = null;
    unit.pathIndex = 0;
    unit.pathGoalX = -1;
    unit.pathGoalY = -1;
    unit.pathWorldRevision = -1;
  }

  function unitNeedsPathRecalc(unit, goalX, goalY) {
    if (!unit.path) {
      return true;
    }
    if (unit.pathGoalX !== goalX || unit.pathGoalY !== goalY) {
      return true;
    }
    if (unit.pathWorldRevision !== pathfindingWorldRevision) {
      if (!pathChangeNearUnitPath(unit, pathChangeCellX, pathChangeCellY, pathChangeRadius)) {
        unit.pathWorldRevision = pathfindingWorldRevision;
        return false;
      }
      return true;
    }
    if (unit.pathIndex >= unit.path.length) {
      return false;
    }
    var waypoint = unit.path[unit.pathIndex];
    if (!canUnitEnterCell(unit, waypoint.x, waypoint.y)) {
      return true;
    }
    return false;
  }

  function demonPathWaypointReachable(unit, cellX, cellY) {
    if (isCellWalkableForUnit(unit, cellX, cellY)) {
      return true;
    }
    return isCellBlockedForWalk(cellX, cellY, true, true);
  }

  function demonNeedsPathRecalc(unit, goalX, goalY) {
    if (!unit.path) {
      return true;
    }
    if (unit.pathGoalX !== goalX || unit.pathGoalY !== goalY) {
      return true;
    }
    if (unit.pathWorldRevision !== pathfindingWorldRevision) {
      if (!pathChangeNearUnitPath(unit, pathChangeCellX, pathChangeCellY, pathChangeRadius)) {
        unit.pathWorldRevision = pathfindingWorldRevision;
        return false;
      }
      return true;
    }
    if (unit.pathIndex >= unit.path.length) {
      var unitCellX = Math.floor(unit.x);
      var unitCellY = Math.floor(unit.y);
      if (manhattanDistance(unitCellX, unitCellY, goalX, goalY) <= 1) {
        return false;
      }
      return true;
    }
    var waypoint = unit.path[unit.pathIndex];
    if (!demonPathWaypointReachable(unit, waypoint.x, waypoint.y)) {
      return true;
    }
    return false;
  }

  function dogNeedsPathRecalc(unit, goalCellX, goalCellY) {
    if (!unit.path) {
      return true;
    }
    if (unit.pathWorldRevision !== pathfindingWorldRevision) {
      if (!pathChangeNearUnitPath(unit, pathChangeCellX, pathChangeCellY, pathChangeRadius)) {
        unit.pathWorldRevision = pathfindingWorldRevision;
        return false;
      }
      return true;
    }
    if (unit.pathIndex >= unit.path.length) {
      return true;
    }
    if (manhattanDistance(unit.pathGoalX, unit.pathGoalY, goalCellX, goalCellY) >= DOG_CHASE_PATH_DRIFT_CELLS) {
      return true;
    }
    var waypoint = unit.path[unit.pathIndex];
    if (!canUnitEnterCell(unit, waypoint.x, waypoint.y)) {
      return true;
    }
    return false;
  }

  function clearWallsInFootprint(cellX, cellY, size) {
    var offsetY;
    var offsetX;
    var clearedWall = false;
    for (offsetY = 0; offsetY < size; offsetY++) {
      for (offsetX = 0; offsetX < size; offsetX++) {
        var checkX = cellX + offsetX;
        var checkY = cellY + offsetY;
        if (!inBounds(checkX, checkY)) {
          continue;
        }
        if (!isPlayerWall(checkX, checkY)) {
          continue;
        }
        var wallIndex = cellIndex(checkX, checkY);
        playerWall[wallIndex] = 0;
        wallDigProgress[wallIndex] = 0;
        clearedWall = true;
      }
    }
    if (clearedWall) {
      markPathfindingWorldDirtyAt(cellX, cellY, size + 2);
    }
  }

  function canPlaceBuildingOnCell(cellX, cellY) {
    if (!inBounds(cellX, cellY)) {
      return false;
    }
    if (isMountain(cellX, cellY)) {
      return false;
    }
    if (getBuildingAt(cellX, cellY)) {
      return false;
    }
    if (getBuildOrderAt(cellX, cellY)) {
      return false;
    }
    if (isCellWalkable(cellX, cellY)) {
      return true;
    }
    return isPlayerWall(cellX, cellY);
  }

  function isCellWalkable(cellX, cellY) {
    return !isCellBlockedForWalk(cellX, cellY, false);
  }

  function getBuildingCenter(building) {
    var size = building.size || 1;
    return {
      x: building.x + size * 0.5,
      y: building.y + size * 0.5
    };
  }

  function getBuildingDefenseRange(buildType) {
    var definition = getBuildDefinition(buildType);
    if (definition && definition.range) {
      return definition.range;
    }
    if (buildType === BUILD_DOG_HOUSE) {
      return DOG_ATTACK_RANGE;
    }
    return 0;
  }

  function getBuildingRangeColor(buildType, isHoverPreview) {
    var fillAlpha = isHoverPreview ? 0.1 : 0.14;
    if (buildType === BUILD_LASER) {
      return "rgba(216, 192, 48, " + String(fillAlpha) + ")";
    }
    if (buildType === BUILD_ROCKET) {
      return "rgba(192, 96, 48, " + String(fillAlpha) + ")";
    }
    if (buildType === BUILD_DOG_HOUSE) {
      return "rgba(160, 112, 64, " + String(fillAlpha) + ")";
    }
    return "rgba(90, 138, 80, " + String(fillAlpha) + ")";
  }

  function getBuildingRangeStroke(buildType, isHoverPreview) {
    var strokeAlpha = isHoverPreview ? 0.18 : 0.3;
    if (buildType === BUILD_LASER) {
      return "rgba(255, 230, 90, " + String(strokeAlpha) + ")";
    }
    if (buildType === BUILD_ROCKET) {
      return "rgba(255, 150, 70, " + String(strokeAlpha) + ")";
    }
    if (buildType === BUILD_DOG_HOUSE) {
      return "rgba(210, 160, 90, " + String(strokeAlpha) + ")";
    }
    return "rgba(130, 210, 110, " + String(strokeAlpha) + ")";
  }

  function renderDefenseRangeCircle(centerX, centerY, buildType, isHoverPreview) {
    var defenseRange = getBuildingDefenseRange(buildType);
    if (defenseRange <= 0) {
      return;
    }
    var screen = worldToScreen(centerX, centerY);
    var radiusPixels = defenseRange * cellPixelSize;
    context.beginPath();
    context.arc(screen.x, screen.y, radiusPixels, 0, Math.PI * 2);
    context.fillStyle = getBuildingRangeColor(buildType, isHoverPreview);
    context.fill();
    context.strokeStyle = getBuildingRangeStroke(buildType, isHoverPreview);
    context.lineWidth = isHoverPreview ? 1 : 1.5;
    context.stroke();
  }

  function getBuildingUnderPointer() {
    if (phase !== PHASE_PLAYING || !canvasPointerInside) {
      return null;
    }
    var cell = screenToWorldCell(pointerScreenX, pointerScreenY);
    return getBuildingAt(cell.x, cell.y);
  }

  function isUnitInBuildingRange(building, rangeCells, unit) {
    var center = getBuildingCenter(building);
    var deltaX = unit.x - center.x;
    var deltaY = unit.y - center.y;
    var rangeSquared = rangeCells * rangeCells;
    return deltaX * deltaX + deltaY * deltaY <= rangeSquared;
  }

  function getAdjacentPathBlocker(unit) {
    if (!unit.path || unit.pathIndex >= unit.path.length) {
      return null;
    }
    var waypoint = unit.path[unit.pathIndex];
    var unitCellX = Math.floor(unit.x);
    var unitCellY = Math.floor(unit.y);
    var stepX = waypoint.x - unitCellX;
    if (stepX > 1) {
      stepX = 1;
    }
    if (stepX < -1) {
      stepX = -1;
    }
    var stepY = waypoint.y - unitCellY;
    if (stepY > 1) {
      stepY = 1;
    }
    if (stepY < -1) {
      stepY = -1;
    }
    if (stepX === 0 && stepY === 0) {
      return null;
    }
    var blockX = unitCellX + stepX;
    var blockY = unitCellY + stepY;
    var ignoreTrapMines = unit.kind === UNIT_DEMON;
    if (isCellBlockedForWalk(blockX, blockY, false, ignoreTrapMines)) {
      return { x: blockX, y: blockY };
    }
    return null;
  }

  function resolveUnitWalkablePosition(unit, speed, deltaSeconds) {
    var cellX = Math.floor(unit.x);
    var cellY = Math.floor(unit.y);
    if (!isCellWalkableForUnit(unit, cellX, cellY)) {
      if (!tryEscapeBlockedCell(unit, speed, deltaSeconds)) {
        snapUnitToWalkableCell(unit);
      }
      return;
    }
    var centerX = cellX + 0.5;
    var centerY = cellY + 0.5;
    if (Math.abs(unit.x - centerX) <= 0.35 && Math.abs(unit.y - centerY) <= 0.35) {
      return;
    }
    var pullX = (centerX - unit.x) * UNIT_POSITION_PULL;
    var pullY = (centerY - unit.y) * UNIT_POSITION_PULL;
    var nextX = unit.x + pullX;
    var nextY = unit.y + pullY;
    if (isCellWalkableForUnit(unit, Math.floor(nextX), Math.floor(nextY))) {
      unit.x = nextX;
      unit.y = nextY;
    }
  }

  function findWalkableApproachCell(targetX, targetY, fromX, fromY) {
    return findMineApproachCell(targetX, targetY, fromX, fromY);
  }

  function findBuildingApproachCell(building, fromX, fromY) {
    if (!building) {
      return null;
    }
    var footprintX = building.x;
    var footprintY = building.y;
    var size = building.size || 1;
    var bestX = -1;
    var bestY = -1;
    var bestDistance = 999999;
    var ringOffsetY;
    var ringOffsetX;
    for (ringOffsetY = -1; ringOffsetY <= size; ringOffsetY++) {
      for (ringOffsetX = -1; ringOffsetX <= size; ringOffsetX++) {
        var tryX = footprintX + ringOffsetX;
        var tryY = footprintY + ringOffsetY;
        if (isCellInsideFootprint(tryX, tryY, footprintX, footprintY, size)) {
          continue;
        }
        if (!isCellWalkable(tryX, tryY)) {
          continue;
        }
        var distance = manhattanDistance(fromX, fromY, tryX, tryY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestX = tryX;
          bestY = tryY;
        }
      }
    }
    if (bestX < 0) {
      return null;
    }
    return { x: bestX, y: bestY };
  }

  function findDemonPathToWorkshop(startX, startY, workshop, maxNodes) {
    var goalX = workshop.x;
    var goalY = workshop.y;
    var goalApproach = findBuildingApproachCell(workshop.building, startX, startY);
    var path = null;
    if (goalApproach) {
      path = findPath(startX, startY, goalApproach.x, goalApproach.y, false, maxNodes, true);
    }
    if (!path && goalApproach) {
      path = findPath(startX, startY, goalApproach.x, goalApproach.y, true, maxNodes, true);
    }
    return {
      goalX: goalX,
      goalY: goalY,
      path: path,
      approach: goalApproach
    };
  }

  function demonHasOpenRouteToWorkshop(unit, workshop) {
    var startX = Math.floor(unit.x);
    var startY = Math.floor(unit.y);
    var approach = findBuildingApproachCell(workshop.building, startX, startY);
    if (!approach) {
      return false;
    }
    var path = findPath(startX, startY, approach.x, approach.y, false, null, true);
    return path != null;
  }

  function isCellInsideFootprint(cellX, cellY, footprintX, footprintY, footprintSize) {
    return (
      cellX >= footprintX &&
      cellX < footprintX + footprintSize &&
      cellY >= footprintY &&
      cellY < footprintY + footprintSize
    );
  }

  function collectBuildApproachCells(order, fromX, fromY, unit) {
    var size = order.size || 1;
    var preferred = [];
    var fallback = [];
    var ringOffsetY;
    var ringOffsetX;
    for (ringOffsetY = -1; ringOffsetY <= size; ringOffsetY++) {
      for (ringOffsetX = -1; ringOffsetX <= size; ringOffsetX++) {
        var tryX = order.x + ringOffsetX;
        var tryY = order.y + ringOffsetY;
        if (isCellInsideFootprint(tryX, tryY, order.x, order.y, size)) {
          continue;
        }
        if (!isCellWalkable(tryX, tryY)) {
          continue;
        }
        var entry = {
          x: tryX,
          y: tryY,
          distance: manhattanDistance(fromX, fromY, tryX, tryY)
        };
        if (unit && isCellOccupiedByOtherUnit(tryX, tryY, unit)) {
          fallback.push(entry);
        } else {
          preferred.push(entry);
        }
      }
    }
    var sorted = preferred.length > 0 ? preferred : fallback;
    var sortIndex;
    var swapIndex;
    for (sortIndex = 0; sortIndex < sorted.length; sortIndex++) {
      for (swapIndex = sortIndex + 1; swapIndex < sorted.length; swapIndex++) {
        if (sorted[swapIndex].distance < sorted[sortIndex].distance) {
          var temp = sorted[sortIndex];
          sorted[sortIndex] = sorted[swapIndex];
          sorted[swapIndex] = temp;
        }
      }
    }
    if (sorted.length > 0) {
      return sorted;
    }
    var center = getBuildOrderCenter(order);
    var centerApproach = findWalkableApproachCell(center.x, center.y, fromX, fromY);
    if (centerApproach) {
      return [{
        x: centerApproach.x,
        y: centerApproach.y,
        distance: manhattanDistance(fromX, fromY, centerApproach.x, centerApproach.y)
      }];
    }
    return [];
  }

  function findBuildApproachCell(order, fromX, fromY, unit) {
    var cells = collectBuildApproachCells(order, fromX, fromY, unit);
    if (cells.length > 0) {
      return { x: cells[0].x, y: cells[0].y };
    }
    return null;
  }

  function isUnitAdjacentToBuildingFootprint(unit, building) {
    if (!building) {
      return false;
    }
    var unitCellX = Math.floor(unit.x);
    var unitCellY = Math.floor(unit.y);
    var size = building.size || 1;
    var offsetY;
    var offsetX;
    for (offsetY = 0; offsetY < size; offsetY++) {
      for (offsetX = 0; offsetX < size; offsetX++) {
        var footprintX = building.x + offsetX;
        var footprintY = building.y + offsetY;
        if (manhattanDistance(unitCellX, unitCellY, footprintX, footprintY) <= 1) {
          return true;
        }
      }
    }
    return false;
  }

  function workerIsAdjacentToBuildFootprint(unit, order) {
    var unitCellX = Math.floor(unit.x);
    var unitCellY = Math.floor(unit.y);
    var size = order.size || 1;
    if (isCellInsideFootprint(unitCellX, unitCellY, order.x, order.y, size)) {
      return false;
    }
    var ringOffsetY;
    var ringOffsetX;
    for (ringOffsetY = -1; ringOffsetY <= size; ringOffsetY++) {
      for (ringOffsetX = -1; ringOffsetX <= size; ringOffsetX++) {
        var ringX = order.x + ringOffsetX;
        var ringY = order.y + ringOffsetY;
        if (isCellInsideFootprint(ringX, ringY, order.x, order.y, size)) {
          continue;
        }
        if (manhattanDistance(unitCellX, unitCellY, ringX, ringY) <= 1) {
          return true;
        }
      }
    }
    return false;
  }

  function moveWorkerOffFootprint(unit, footprintX, footprintY, footprintSize) {
    var unitCellX = Math.floor(unit.x);
    var unitCellY = Math.floor(unit.y);
    if (!isCellInsideFootprint(unitCellX, unitCellY, footprintX, footprintY, footprintSize)) {
      return false;
    }
    var bestX = -1;
    var bestY = -1;
    var bestDistance = 999999;
    var searchRadius = footprintSize + 3;
    var offsetY;
    var offsetX;
    for (offsetY = -searchRadius; offsetY <= searchRadius; offsetY++) {
      for (offsetX = -searchRadius; offsetX <= searchRadius; offsetX++) {
        var tryX = unitCellX + offsetX;
        var tryY = unitCellY + offsetY;
        if (isCellInsideFootprint(tryX, tryY, footprintX, footprintY, footprintSize)) {
          continue;
        }
        if (!isCellWalkable(tryX, tryY)) {
          continue;
        }
        if (isCellOccupiedByOtherUnit(tryX, tryY, unit)) {
          continue;
        }
        var distance = manhattanDistance(unitCellX, unitCellY, tryX, tryY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestX = tryX;
          bestY = tryY;
        }
      }
    }
    if (bestX < 0) {
      return snapUnitToWalkableCell(unit);
    }
    unit.x = bestX + 0.5;
    unit.y = bestY + 0.5;
    clearUnitPath(unit);
    return true;
  }

  function damageDemon(unit, amount) {
    if (!unit || unit.kind !== UNIT_DEMON || unit.hp <= 0) {
      return false;
    }
    unit.hp -= amount;
    if (unit.hp < 0) {
      unit.hp = 0;
    }
    return true;
  }

  function damageDemonAtWorldPoint(worldX, worldY, amount, radius) {
    var unitIndex;
    var hitCount = 0;
    for (unitIndex = 0; unitIndex < units.length; unitIndex++) {
      var unit = units[unitIndex];
      if (unit.kind !== UNIT_DEMON || unit.hp <= 0) {
        continue;
      }
      if (getWorldDistance(worldX, worldY, unit.x, unit.y) > radius) {
        continue;
      }
      if (damageDemon(unit, amount)) {
        hitCount += 1;
      }
    }
    return hitCount;
  }

  function snapUnitToWalkableCell(unit) {
    var cellX = Math.floor(unit.x);
    var cellY = Math.floor(unit.y);
    if (isCellWalkable(cellX, cellY)) {
      return false;
    }
    var bestX = -1;
    var bestY = -1;
    var bestDistance = 999999;
    var offsetY;
    var offsetX;
    for (offsetY = -UNIT_SNAP_SEARCH_RADIUS; offsetY <= UNIT_SNAP_SEARCH_RADIUS; offsetY++) {
      for (offsetX = -UNIT_SNAP_SEARCH_RADIUS; offsetX <= UNIT_SNAP_SEARCH_RADIUS; offsetX++) {
        var tryX = cellX + offsetX;
        var tryY = cellY + offsetY;
        if (!isCellWalkable(tryX, tryY)) {
          continue;
        }
        var distance = manhattanDistance(cellX, cellY, tryX, tryY);
        if (unit.targetCellX >= 0) {
          distance += manhattanDistance(tryX, tryY, unit.targetCellX, unit.targetCellY) * 0.05;
        }
        if (distance < bestDistance) {
          bestDistance = distance;
          bestX = tryX;
          bestY = tryY;
        }
      }
    }
    if (bestX < 0) {
      return false;
    }
    unit.x = bestX + 0.5;
    unit.y = bestY + 0.5;
    clearUnitPath(unit);
    return true;
  }

  function isFriendlyUnitKind(unitKind) {
    return unitKind === UNIT_WORKER || unitKind === UNIT_DOG;
  }

  function doFriendlyUnitsIgnoreEachOther(firstKind, secondKind) {
    return isFriendlyUnitKind(firstKind) && isFriendlyUnitKind(secondKind);
  }

  function isCellOccupiedByOtherUnit(cellX, cellY, unit) {
    var unitIndex;
    for (unitIndex = 0; unitIndex < units.length; unitIndex++) {
      var other = units[unitIndex];
      if (other === unit) {
        continue;
      }
      if (other.hp <= 0) {
        continue;
      }
      if (other.kind === UNIT_DOG && unit.kind === UNIT_DEMON) {
        continue;
      }
      if (other.kind === UNIT_DEMON && unit.kind === UNIT_DOG) {
        continue;
      }
      if (doFriendlyUnitsIgnoreEachOther(unit.kind, other.kind)) {
        continue;
      }
      if (Math.floor(other.x) === cellX && Math.floor(other.y) === cellY) {
        return true;
      }
    }
    return false;
  }

  function canUnitEnterCell(unit, cellX, cellY) {
    if (unit.kind === UNIT_DEMON && isTrapMineCell(cellX, cellY)) {
      return true;
    }
    if (unit.kind !== UNIT_DEMON && isCellOccupiedByOtherUnit(cellX, cellY, unit)) {
      return false;
    }
    if (isCellWalkable(cellX, cellY)) {
      return true;
    }
    return cellX === Math.floor(unit.x) && cellY === Math.floor(unit.y);
  }

  function tryEscapeBlockedCell(unit, speed, deltaSeconds) {
    var currentCellX = Math.floor(unit.x);
    var currentCellY = Math.floor(unit.y);
    if (isCellWalkable(currentCellX, currentCellY)) {
      return false;
    }
    var directionIndex;
    var escapeX = -1;
    var escapeY = -1;
    var bestScore = 999999;
    for (directionIndex = 0; directionIndex < ESCAPE_DIRECTIONS.length; directionIndex++) {
      var tryX = currentCellX + ESCAPE_DIRECTIONS[directionIndex][0];
      var tryY = currentCellY + ESCAPE_DIRECTIONS[directionIndex][1];
      if (!isCellWalkable(tryX, tryY)) {
        continue;
      }
      var score = manhattanDistance(tryX, tryY, currentCellX, currentCellY);
      if (unit.targetCellX >= 0) {
        score += manhattanDistance(tryX, tryY, unit.targetCellX, unit.targetCellY) * 0.25;
      }
      if (score < bestScore) {
        bestScore = score;
        escapeX = tryX;
        escapeY = tryY;
      }
    }
    if (escapeX < 0) {
      snapUnitToWalkableCell(unit);
      return true;
    }
    var targetX = escapeX + 0.5;
    var targetY = escapeY + 0.5;
    var deltaX = targetX - unit.x;
    var deltaY = targetY - unit.y;
    var step = speed * deltaSeconds;
    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
      if (Math.abs(deltaX) > 0.0001) {
        var stepX = deltaX > 0 ? 1 : -1;
        stepX *= Math.min(step, Math.abs(deltaX));
        unit.x += stepX;
      } else {
        var stepY = deltaY > 0 ? 1 : -1;
        stepY *= Math.min(step, Math.abs(deltaY));
        unit.y += stepY;
      }
    } else {
      if (Math.abs(deltaY) > 0.0001) {
        var stepYAlt = deltaY > 0 ? 1 : -1;
        stepYAlt *= Math.min(step, Math.abs(deltaY));
        unit.y += stepYAlt;
      } else {
        var stepXAlt = deltaX > 0 ? 1 : -1;
        stepXAlt *= Math.min(step, Math.abs(deltaX));
        unit.x += stepXAlt;
      }
    }
    return true;
  }

  function setUnitPathToAdjacentTarget(unit, targetX, targetY, goalX, goalY) {
    var approach = findWalkableApproachCell(
      targetX,
      targetY,
      Math.floor(unit.x),
      Math.floor(unit.y)
    );
    if (!approach) {
      clearUnitPath(unit);
      return;
    }
    var startX = Math.floor(unit.x);
    var startY = Math.floor(unit.y);
    var ignoreTrapMines = unit.kind === UNIT_DEMON;
    var path = findPath(startX, startY, approach.x, approach.y, false, null, ignoreTrapMines);
    var storedGoalX = goalX != null ? goalX : approach.x;
    var storedGoalY = goalY != null ? goalY : approach.y;
    assignUnitPath(unit, path, storedGoalX, storedGoalY);
  }

  function manhattanDistance(ax, ay, bx, by) {
    var deltaX = ax - bx;
    if (deltaX < 0) deltaX = -deltaX;
    var deltaY = ay - by;
    if (deltaY < 0) deltaY = -deltaY;
    return deltaX + deltaY;
  }

  function getWorldDistance(ax, ay, bx, by) {
    var deltaX = ax - bx;
    var deltaY = ay - by;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  function ensurePathScratch() {
    var totalCells = WORLD_SIZE * WORLD_SIZE;
    if (!pathScratchVisited) {
      pathScratchVisited = new Uint8Array(totalCells);
      pathScratchParent = new Int32Array(totalCells);
      pathScratchQueueX = new Int16Array(PATHFIND_MAX_NODES);
      pathScratchQueueY = new Int16Array(PATHFIND_MAX_NODES);
      pathScratchHeap = [];
    }
  }

  function resetPathScratch() {
    pathScratchVisited.fill(0);
  }

  function findPath(startX, startY, goalX, goalY, allowBlocked, maxNodes, ignoreTrapMines) {
    ensurePathScratch();
    resetPathScratch();
    var nodeLimit = maxNodes || PATHFIND_MAX_NODES;
    var treatTrapMinesOpen = ignoreTrapMines === true;
    var heap = pathScratchHeap;
    heap.length = 0;
    var startIndex = cellIndex(startX, startY);
    var goalIndex = cellIndex(goalX, goalY);
    var nodesExpanded = 0;
    var cameFrom = pathScratchParent;
    var gScoreMap = {};
    var heapPush = function (cellX, cellY, priority) {
      heap.push({ x: cellX, y: cellY, p: priority });
      var childIndex = heap.length - 1;
      while (childIndex > 0) {
        var parentIndex = (childIndex - 1) >> 1;
        if (heap[parentIndex].p <= heap[childIndex].p) {
          break;
        }
        var swap = heap[parentIndex];
        heap[parentIndex] = heap[childIndex];
        heap[childIndex] = swap;
        childIndex = parentIndex;
      }
    };
    var heapPop = function () {
      var top = heap[0];
      var last = heap.pop();
      if (heap.length > 0 && last) {
        heap[0] = last;
        var index = 0;
        while (true) {
          var left = index * 2 + 1;
          var right = left + 1;
          var smallest = index;
          if (left < heap.length && heap[left].p < heap[smallest].p) {
            smallest = left;
          }
          if (right < heap.length && heap[right].p < heap[smallest].p) {
            smallest = right;
          }
          if (smallest === index) {
            break;
          }
          var temp = heap[index];
          heap[index] = heap[smallest];
          heap[smallest] = temp;
          index = smallest;
        }
      }
      return top;
    };
    var keyFor = function (cellX, cellY) {
      return cellY * WORLD_SIZE + cellX;
    };
    gScoreMap[keyFor(startX, startY)] = 0;
    heapPush(startX, startY, manhattanDistance(startX, startY, goalX, goalY));
    pathScratchVisited[startIndex] = 1;
    cameFrom[startIndex] = -1;
    while (heap.length > 0 && nodesExpanded < nodeLimit) {
      var current = heapPop();
      if (!current) {
        break;
      }
      var currentX = current.x;
      var currentY = current.y;
      var currentKey = keyFor(currentX, currentY);
      if (currentX === goalX && currentY === goalY) {
        var path = [];
        var walkX = goalX;
        var walkY = goalY;
        while (true) {
          path.push({ x: walkX, y: walkY });
          var walkIndex = cellIndex(walkX, walkY);
          var parentIndex = cameFrom[walkIndex];
          if (parentIndex < 0) {
            break;
          }
          walkY = Math.floor(parentIndex / WORLD_SIZE);
          walkX = parentIndex - walkY * WORLD_SIZE;
        }
        path.reverse();
        return path;
      }
      nodesExpanded += 1;
      var directionIndex;
      for (directionIndex = 0; directionIndex < DIRECTIONS.length; directionIndex++) {
        var nextX = currentX + DIRECTIONS[directionIndex][0];
        var nextY = currentY + DIRECTIONS[directionIndex][1];
        if (!inBounds(nextX, nextY)) {
          continue;
        }
        var blocked = isCellBlockedForWalk(nextX, nextY, allowBlocked, treatTrapMinesOpen);
        if (blocked && !(allowBlocked && (nextX !== goalX || nextY !== goalY))) {
          continue;
        }
        var nextIndex = cellIndex(nextX, nextY);
        var moveCost = 1;
        if (allowBlocked && isCellBlockedForWalk(nextX, nextY, false, treatTrapMinesOpen)) {
          moveCost = 4;
        }
        var tentative = gScoreMap[currentKey] + moveCost;
        var nextKey = keyFor(nextX, nextY);
        if (gScoreMap[nextKey] == null || tentative < gScoreMap[nextKey]) {
          gScoreMap[nextKey] = tentative;
          cameFrom[nextIndex] = cellIndex(currentX, currentY);
          pathScratchVisited[nextIndex] = 1;
          heapPush(nextX, nextY, tentative + manhattanDistance(nextX, nextY, goalX, goalY));
        }
      }
    }
    return null;
  }

  function findNearestWorkshop(fromX, fromY) {
    var best = null;
    var bestDistance = 999999;
    var index;
    for (index = 0; index < buildings.length; index++) {
      var building = buildings[index];
      if (building.type !== BUILD_WORKSHOP) {
        continue;
      }
      var centerX = building.x + ((building.size || 1) >> 1);
      var centerY = building.y + ((building.size || 1) >> 1);
      var distance = manhattanDistance(fromX, fromY, centerX, centerY);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { x: centerX, y: centerY, building: building };
      }
    }
    return best;
  }

  function findBlockingCellTowardGoal(fromX, fromY, goalX, goalY, ignoreTrapMines) {
    var treatTrapMinesOpen = ignoreTrapMines === true;
    var queueHead = 0;
    var queueTail = 0;
    ensurePathScratch();
    resetPathScratch();
    var queueX = pathScratchQueueX;
    var queueY = pathScratchQueueY;
    if (!inBounds(fromX, fromY)) {
      return null;
    }
    if (treatTrapMinesOpen) {
      if (!isCellWalkableForUnit({ kind: UNIT_DEMON, x: fromX, y: fromY }, fromX, fromY)) {
        return null;
      }
    } else if (!isCellWalkable(fromX, fromY)) {
      return null;
    }
    var startIndex = cellIndex(fromX, fromY);
    pathScratchVisited[startIndex] = 1;
    queueX[queueTail] = fromX;
    queueY[queueTail] = fromY;
    queueTail += 1;
    var bestBlocked = null;
    var bestBlockedScore = 999999;

    function considerBlocker(blockX, blockY) {
      if (!inBounds(blockX, blockY)) {
        return;
      }
      if (!isCellBlockedForWalk(blockX, blockY, false, treatTrapMinesOpen)) {
        return;
      }
      var score = manhattanDistance(blockX, blockY, goalX, goalY);
      if (score < bestBlockedScore) {
        bestBlockedScore = score;
        bestBlocked = { x: blockX, y: blockY };
      }
    }

    while (queueHead < queueTail && queueHead < PATHFIND_MAX_NODES) {
      var currentX = queueX[queueHead];
      var currentY = queueY[queueHead];
      queueHead += 1;
      var directionIndex;
      for (directionIndex = 0; directionIndex < DIRECTIONS.length; directionIndex++) {
        var nextX = currentX + DIRECTIONS[directionIndex][0];
        var nextY = currentY + DIRECTIONS[directionIndex][1];
        if (!inBounds(nextX, nextY)) {
          continue;
        }
        if (isCellBlockedForWalk(nextX, nextY, false, treatTrapMinesOpen)) {
          considerBlocker(nextX, nextY);
          continue;
        }
        var nextIndex = cellIndex(nextX, nextY);
        if (pathScratchVisited[nextIndex]) {
          continue;
        }
        pathScratchVisited[nextIndex] = 1;
        queueX[queueTail] = nextX;
        queueY[queueTail] = nextY;
        queueTail += 1;
      }
    }
    return bestBlocked;
  }

  function findBlockingMountainTowardGoal(fromX, fromY, goalX, goalY) {
    var queueHead = 0;
    var queueTail = 0;
    ensurePathScratch();
    resetPathScratch();
    var queueX = pathScratchQueueX;
    var queueY = pathScratchQueueY;
    if (!inBounds(fromX, fromY)) {
      return null;
    }
    if (!isCellWalkable(fromX, fromY)) {
      return null;
    }
    var startIndex = cellIndex(fromX, fromY);
    pathScratchVisited[startIndex] = 1;
    queueX[queueTail] = fromX;
    queueY[queueTail] = fromY;
    queueTail += 1;
    var bestMountainX = -1;
    var bestMountainY = -1;
    var bestScore = 999999;
    while (queueHead < queueTail && queueHead < PATHFIND_MAX_NODES) {
      var currentX = queueX[queueHead];
      var currentY = queueY[queueHead];
      queueHead += 1;
      var directionIndex;
      for (directionIndex = 0; directionIndex < DIRECTIONS.length; directionIndex++) {
        var nextX = currentX + DIRECTIONS[directionIndex][0];
        var nextY = currentY + DIRECTIONS[directionIndex][1];
        if (!inBounds(nextX, nextY)) {
          continue;
        }
        if (isMountain(nextX, nextY)) {
          var mountainScore = manhattanDistance(nextX, nextY, goalX, goalY);
          if (mountainScore < bestScore) {
            bestScore = mountainScore;
            bestMountainX = nextX;
            bestMountainY = nextY;
          }
          continue;
        }
        if (!isCellWalkable(nextX, nextY)) {
          continue;
        }
        var nextIndex = cellIndex(nextX, nextY);
        if (pathScratchVisited[nextIndex]) {
          continue;
        }
        pathScratchVisited[nextIndex] = 1;
        queueX[queueTail] = nextX;
        queueY[queueTail] = nextY;
        queueTail += 1;
      }
    }
    if (bestMountainX < 0) {
      return null;
    }
    return { x: bestMountainX, y: bestMountainY };
  }

  function generateWorld() {
    var totalCells = WORLD_SIZE * WORLD_SIZE;
    terrain = new Uint8Array(totalCells);
    oreMask = new Uint8Array(totalCells);
    digProgress = new Uint8Array(totalCells);
    playerWall = new Uint8Array(totalCells);
    wallDigProgress = new Uint8Array(totalCells);
    mineOrders = new Uint8Array(totalCells);
    buildOrderCellIds = new Int32Array(totalCells);
    activeMineOrderCount = 0;
    var blobIndex;
    for (blobIndex = 0; blobIndex < MOUNTAIN_BLOB_COUNT; blobIndex++) {
      var centerX = randomInt(WORLD_EDGE_MARGIN, WORLD_SIZE - WORLD_EDGE_MARGIN - 1);
      var centerY = randomInt(WORLD_EDGE_MARGIN, WORLD_SIZE - WORLD_EDGE_MARGIN - 1);
      if (isInsideSpawnClear(centerX, centerY, MOUNTAIN_BLOB_SPAWN_CLEAR_EXTRA)) {
        continue;
      }
      var radiusX = randomInt(MOUNTAIN_BLOB_RADIUS_MIN, MOUNTAIN_BLOB_RADIUS_MAX);
      var radiusY = randomInt(MOUNTAIN_BLOB_RADIUS_MIN, MOUNTAIN_BLOB_RADIUS_MAX);
      stampMountainBlob(centerX, centerY, radiusX, radiusY);
    }
    var walkIndex;
    for (walkIndex = 0; walkIndex < MOUNTAIN_WALK_BLOB_COUNT; walkIndex++) {
      var walkStartX = randomInt(WORLD_EDGE_MARGIN, WORLD_SIZE - WORLD_EDGE_MARGIN - 1);
      var walkStartY = randomInt(WORLD_EDGE_MARGIN, WORLD_SIZE - WORLD_EDGE_MARGIN - 1);
      if (isInsideSpawnClear(walkStartX, walkStartY, MOUNTAIN_WALK_SPAWN_CLEAR_EXTRA)) {
        continue;
      }
      var walkSteps = randomInt(MOUNTAIN_WALK_STEPS_MIN, MOUNTAIN_WALK_STEPS_MAX);
      growMountainWalk(walkStartX, walkStartY, walkSteps);
    }
    clearSpawnArea();
    scatterOreOnMountains();
  }

  function createBuilding(type, cellX, cellY) {
    if (type === BUILD_WALL) {
      if (!inBounds(cellX, cellY)) {
        return null;
      }
      var wallIndex = cellIndex(cellX, cellY);
      playerWall[wallIndex] = 1;
      wallDigProgress[wallIndex] = 0;
      markPathfindingWorldDirtyAt(cellX, cellY, 2);
      markMinimapDirty();
      return null;
    }
    var definition = getBuildDefinition(type);
    var size = getBuildFootprintSize(type);
    clearWallsInFootprint(cellX, cellY, size);
    var building = {
      id: buildings.length + 1,
      type: type,
      x: cellX,
      y: cellY,
      size: size,
      hp: definition.hp,
      maxHp: definition.hp,
      fireTimer: 0,
      passiveTimer: 0,
      dogTimer: 0,
      laserTargetUnit: null,
      turretTargetUnit: null
    };
    buildings.push(building);
    markPathfindingWorldDirtyAt(cellX + ((size - 1) >> 1), cellY + ((size - 1) >> 1), size + 3);
    markMinimapDirty();
    if (definition.spawnsWorker) {
      spawnWorkerNear(cellX + 1, cellY + size + 1);
    }
    if (building.type === BUILD_DOG_HOUSE) {
      spawnDogNear(building);
    }
    return building;
  }

  function getBuildOrderCenter(order) {
    var size = order.size || 1;
    return {
      x: order.x + ((size - 1) >> 1),
      y: order.y + ((size - 1) >> 1)
    };
  }

  function getBuildOrderAt(cellX, cellY) {
    var orderIndex;
    for (orderIndex = 0; orderIndex < buildOrders.length; orderIndex++) {
      var order = buildOrders[orderIndex];
      var size = order.size || 1;
      if (cellX >= order.x && cellX < order.x + size && cellY >= order.y && cellY < order.y + size) {
        return order;
      }
    }
    return null;
  }

  function getBuildOrderById(orderId) {
    var orderIndex;
    for (orderIndex = 0; orderIndex < buildOrders.length; orderIndex++) {
      if (buildOrders[orderIndex].id === orderId) {
        return buildOrders[orderIndex];
      }
    }
    return null;
  }

  function countWorkshops() {
    var count = 0;
    var buildingIndex;
    for (buildingIndex = 0; buildingIndex < buildings.length; buildingIndex++) {
      if (buildings[buildingIndex].type === BUILD_WORKSHOP) {
        count += 1;
      }
    }
    return count;
  }

  function stampBuildOrderCells(order) {
    if (!buildOrderCellIds || !order) {
      return;
    }
    var size = order.size || 1;
    var offsetX;
    var offsetY;
    for (offsetY = 0; offsetY < size; offsetY++) {
      for (offsetX = 0; offsetX < size; offsetX++) {
        buildOrderCellIds[cellIndex(order.x + offsetX, order.y + offsetY)] = order.id;
      }
    }
  }

  function clearBuildOrderCells(order) {
    if (!buildOrderCellIds || !order) {
      return;
    }
    var size = order.size || 1;
    var offsetX;
    var offsetY;
    for (offsetY = 0; offsetY < size; offsetY++) {
      for (offsetX = 0; offsetX < size; offsetX++) {
        var stampIndex = cellIndex(order.x + offsetX, order.y + offsetY);
        if (buildOrderCellIds[stampIndex] === order.id) {
          buildOrderCellIds[stampIndex] = 0;
        }
      }
    }
  }

  function getBuildOrderHitsNeeded(type, size) {
    if (type === BUILD_WALL) {
      return BUILD_ORDER_WALL_HITS;
    }
    return BUILD_ORDER_HITS * size;
  }

  function createBuildOrder(type, cellX, cellY) {
    var size = getBuildFootprintSize(type);
    var order = {
      id: nextBuildOrderId,
      type: type,
      x: cellX,
      y: cellY,
      size: size,
      buildProgress: 0,
      buildHitsNeeded: getBuildOrderHitsNeeded(type, size),
      claimed: false
    };
    nextBuildOrderId += 1;
    buildOrders.push(order);
    stampBuildOrderCells(order);
    activeBuildOrderCount += 1;
    markMinimapDirty();
    assignWorkerToBuildOrderImmediately(order);
    return order;
  }

  function removeBuildOrder(order) {
    var orderIndex = buildOrders.indexOf(order);
    if (orderIndex < 0) {
      return;
    }
    clearBuildOrderCells(order);
    if (!order.claimed) {
      activeBuildOrderCount -= 1;
    }
    buildOrders.splice(orderIndex, 1);
    markMinimapDirty();
  }

  function releaseBuildOrderClaim(orderId) {
    var order = getBuildOrderById(orderId);
    if (!order || !order.claimed) {
      return;
    }
    order.claimed = false;
    activeBuildOrderCount += 1;
    retargetWorkersForBuildOrders();
  }

  function claimBuildOrder(order) {
    if (!order || order.claimed) {
      return false;
    }
    order.claimed = true;
    if (activeBuildOrderCount > 0) {
      activeBuildOrderCount -= 1;
    }
    return true;
  }

  function findClosestUnclaimedBuildOrder(fromX, fromY) {
    var bestOrder = null;
    var bestDistance = 999999;
    var orderIndex;
    for (orderIndex = 0; orderIndex < buildOrders.length; orderIndex++) {
      var order = buildOrders[orderIndex];
      if (order.claimed) {
        continue;
      }
      var center = getBuildOrderCenter(order);
      var distance = manhattanDistance(fromX, fromY, center.x, center.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestOrder = order;
      }
    }
    return bestOrder;
  }

  function workerIsBuildBusy(unit) {
    return unit.buildOrderId >= 0;
  }

  function findClosestWorkerForBuildOrder(order) {
    var center = getBuildOrderCenter(order);
    var bestWorker = null;
    var bestDistance = 999999;
    var unitIndex;
    for (unitIndex = 0; unitIndex < units.length; unitIndex++) {
      var worker = units[unitIndex];
      if (worker.kind !== UNIT_WORKER) {
        continue;
      }
      if (workerIsBuildBusy(worker)) {
        continue;
      }
      var distance = manhattanDistance(
        Math.floor(worker.x),
        Math.floor(worker.y),
        center.x,
        center.y
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        bestWorker = worker;
      }
    }
    return bestWorker;
  }

  function redirectWorkerToBuildOrder(unit, order) {
    clearWorkerOreTarget(unit);
    unit.roamTimer = 0;
    unit.roamTargetX = unit.x;
    unit.roamTargetY = unit.y;
    return assignWorkerToBuildOrder(unit, order);
  }

  function assignWorkerToBuildOrderImmediately(order) {
    if (!order || order.claimed) {
      return false;
    }
    var worker = findClosestWorkerForBuildOrder(order);
    if (!worker) {
      return false;
    }
    return redirectWorkerToBuildOrder(worker, order);
  }

  function assignWorkerToBuildOrder(unit, order) {
    if (!order || order.claimed) {
      return false;
    }
    claimBuildOrder(order);
    unit.buildOrderId = order.id;
    unit.targetCellX = -1;
    unit.targetCellY = -1;
    unit.digCellX = -1;
    unit.digCellY = -1;
    clearUnitPath(unit);
    setWorkerBuildPath(unit, order);
    return true;
  }

  function assignWorkerToClosestBuildOrder(unit) {
    if (workerIsBuildBusy(unit)) {
      return;
    }
    var closestOrder = findClosestUnclaimedBuildOrder(Math.floor(unit.x), Math.floor(unit.y));
    if (!closestOrder) {
      return;
    }
    redirectWorkerToBuildOrder(unit, closestOrder);
  }

  function redirectWorkerToPendingBuildOrder(unit) {
    if (workerIsBuildBusy(unit) || activeBuildOrderCount <= 0) {
      return false;
    }
    var closestOrder = findClosestUnclaimedBuildOrder(Math.floor(unit.x), Math.floor(unit.y));
    if (!closestOrder) {
      return false;
    }
    return redirectWorkerToBuildOrder(unit, closestOrder);
  }

  function retargetWorkersForBuildOrders() {
    var orderIndex;
    for (orderIndex = 0; orderIndex < buildOrders.length; orderIndex++) {
      var order = buildOrders[orderIndex];
      if (order.claimed) {
        continue;
      }
      assignWorkerToBuildOrderImmediately(order);
    }
  }

  function releaseWorkerFromBuildOrder(unit) {
    if (unit.buildOrderId < 0) {
      return;
    }
    var orderId = unit.buildOrderId;
    unit.buildOrderId = -1;
    clearUnitPath(unit);
    releaseBuildOrderClaim(orderId);
  }

  function setWorkerBuildPath(unit, order) {
    var center = getBuildOrderCenter(order);
    var startX = Math.floor(unit.x);
    var startY = Math.floor(unit.y);
    var approachCells = collectBuildApproachCells(order, startX, startY, unit);
    var approachIndex;
    for (approachIndex = 0; approachIndex < approachCells.length; approachIndex++) {
      var approach = approachCells[approachIndex];
      var path = findPath(startX, startY, approach.x, approach.y, false);
      if (path) {
        assignUnitPath(unit, path, center.x, center.y);
        return;
      }
    }
    clearUnitPath(unit);
  }

  function finishBuildOrder(order, unit) {
    var footprintSize = order.size || 1;
    createBuilding(order.type, order.x, order.y);
    removeBuildOrder(order);
    unit.buildOrderId = -1;
    clearUnitPath(unit);
    moveWorkerOffFootprint(unit, order.x, order.y, footprintSize);
    if (activeBuildOrderCount > 0) {
      assignWorkerToClosestBuildOrder(unit);
      if (unit.buildOrderId >= 0) {
        var nextBuildOrder = getBuildOrderById(unit.buildOrderId);
        if (nextBuildOrder && !unit.path) {
          setWorkerBuildPath(unit, nextBuildOrder);
        }
      }
    } else if (activeMineOrderCount > 0) {
      assignWorkerToClosestOrder(unit);
    } else {
      enterWorkerIdleRoam(unit);
    }
  }

  function getBuildRefundAmount(type, buildProgress, buildHitsNeeded) {
    var definition = getBuildDefinition(type);
    var refund = Math.floor(definition.cost * BUILD_SELL_REFUND_FRACTION);
    if (buildHitsNeeded > 0 && buildProgress > 0) {
      var builtRatio = buildProgress / buildHitsNeeded;
      if (builtRatio > 1) {
        builtRatio = 1;
      }
      refund = Math.floor(definition.cost * builtRatio * BUILD_SELL_REFUND_FRACTION);
    }
    return refund;
  }

  function trySellBuildOrder(order) {
    if (!order) {
      return false;
    }
    var unitIndex;
    for (unitIndex = 0; unitIndex < units.length; unitIndex++) {
      var worker = units[unitIndex];
      if (worker.kind === UNIT_WORKER && worker.buildOrderId === order.id) {
        worker.buildOrderId = -1;
        clearUnitPath(worker);
      }
    }
    addMoney(getBuildRefundAmount(order.type, order.buildProgress, order.buildHitsNeeded));
    removeBuildOrder(order);
    return true;
  }

  function trySellBuilding(building) {
    if (!building) {
      return false;
    }
    if (building.type === BUILD_WORKSHOP && countWorkshops() <= 1) {
      return false;
    }
    addMoney(getBuildRefundAmount(building.type, building.maxHp, building.maxHp));
    removeBuilding(building);
    return true;
  }

  function getSellTargetAt(cellX, cellY) {
    if (!inBounds(cellX, cellY) || isMountain(cellX, cellY)) {
      return null;
    }
    if (isPlayerWall(cellX, cellY)) {
      return {
        x: cellX,
        y: cellY,
        size: 1,
        canSell: true
      };
    }
    var building = getBuildingAt(cellX, cellY);
    if (building) {
      if (building.type === BUILD_WORKSHOP && countWorkshops() <= 1) {
        return {
          x: building.x,
          y: building.y,
          size: building.size || 1,
          canSell: false
        };
      }
      return {
        x: building.x,
        y: building.y,
        size: building.size || 1,
        canSell: true
      };
    }
    var order = getBuildOrderAt(cellX, cellY);
    if (order) {
      return {
        x: order.x,
        y: order.y,
        size: order.size || 1,
        canSell: true
      };
    }
    return null;
  }

  function trySellAt(cellX, cellY) {
    if (isMountain(cellX, cellY)) {
      return false;
    }
    if (isPlayerWall(cellX, cellY)) {
      addMoney(Math.floor(getBuildDefinition(BUILD_WALL).cost * BUILD_SELL_REFUND_FRACTION));
      destroyPlayerWall(cellX, cellY);
      return true;
    }
    var building = getBuildingAt(cellX, cellY);
    if (building) {
      return trySellBuilding(building);
    }
    var order = getBuildOrderAt(cellX, cellY);
    if (order) {
      return trySellBuildOrder(order);
    }
    return false;
  }

  function applyRocketSplash(impactX, impactY, damage, splashRadius) {
    var splashIndex;
    for (splashIndex = 0; splashIndex < units.length; splashIndex++) {
      var splashUnit = units[splashIndex];
      if (splashUnit.kind !== UNIT_DEMON || splashUnit.hp <= 0) {
        continue;
      }
      var distance = getWorldDistance(impactX, impactY, splashUnit.x, splashUnit.y);
      if (distance > splashRadius) {
        continue;
      }
      damageDemon(splashUnit, damage);
    }
  }

  function triggerTrapMineExplosion(worldX, worldY, damage, splashRadius) {
    applyRocketSplash(worldX, worldY, damage, splashRadius);
    rocketBlasts.push({
      x: worldX,
      y: worldY,
      radius: splashRadius,
      life: ROCKET_BLAST_DURATION
    });
  }

  function spawnDemonDeathEffect(worldX, worldY) {
    deathEffects.push({
      x: worldX,
      y: worldY,
      vx: 0,
      vy: 0,
      life: DEATH_EFFECT_FLASH_DURATION,
      maxLife: DEATH_EFFECT_FLASH_DURATION,
      flash: true
    });
    var particleIndex;
    for (particleIndex = 0; particleIndex < DEATH_EFFECT_PARTICLE_COUNT; particleIndex++) {
      var angle = (particleIndex / DEATH_EFFECT_PARTICLE_COUNT) * Math.PI * 2 + randomFloat() * 0.5;
      var speed = 1.8 + randomFloat() * 2.8;
      deathEffects.push({
        x: worldX,
        y: worldY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: DEATH_EFFECT_DURATION,
        maxLife: DEATH_EFFECT_DURATION,
        flash: false
      });
    }
  }

  function spawnWorkerNear(cellX, cellY) {
    var offsetIndex;
    for (offsetIndex = 0; offsetIndex < 8; offsetIndex++) {
      var tryX = cellX + DIRECTIONS[offsetIndex % 4][0];
      var tryY = cellY + DIRECTIONS[offsetIndex % 4][1];
      if (isCellWalkable(tryX, tryY)) {
        units.push({
          kind: UNIT_WORKER,
          x: tryX + 0.5,
          y: tryY + 0.5,
          hp: 40,
          path: null,
          pathIndex: 0,
          pathTimer: 0,
          mineTimer: 0,
          targetCellX: -1,
          targetCellY: -1,
          digCellX: -1,
          digCellY: -1,
          roamTargetX: tryX + 0.5,
          roamTargetY: tryY + 0.5,
          roamTimer: 0,
          mineScanTimer: 0,
          buildOrderId: -1
        });
        return;
      }
    }
  }

  function dogHouseHasLivingDog(buildingId) {
    var unitIndex;
    for (unitIndex = 0; unitIndex < units.length; unitIndex++) {
      var unit = units[unitIndex];
      if (unit.kind !== UNIT_DOG) {
        continue;
      }
      if (unit.hp <= 0) {
        continue;
      }
      if (unit.homeBuildingId === buildingId) {
        return true;
      }
    }
    return false;
  }

  function spawnDogNear(building) {
    if (dogHouseHasLivingDog(building.id)) {
      return false;
    }
    var cellX = building.x;
    var cellY = building.y;
    var size = building.size || 1;
    var guardCellX = cellX + ((size - 1) >> 1);
    var guardCellY = cellY + ((size - 1) >> 1);
    var offsetIndex;
    for (offsetIndex = 0; offsetIndex < 12; offsetIndex++) {
      var tryX = guardCellX + randomInt(-2, 2);
      var tryY = guardCellY + randomInt(-2, 2);
      if (!isCellWalkable(tryX, tryY)) {
        continue;
      }
      units.push({
        kind: UNIT_DOG,
        x: tryX + 0.5,
        y: tryY + 0.5,
        hp: 1,
        maxHp: 0,
        path: null,
        pathIndex: 0,
        pathGoalX: -1,
        pathGoalY: -1,
        pathWorldRevision: -1,
        pathTimer: 0,
        attackTimer: 0,
        idleRoamTimer: 0,
        targetUnitIndex: -1,
        guardCellX: guardCellX,
        guardCellY: guardCellY,
        homeBuildingId: building.id
      });
      return true;
    }
    return false;
  }

  function getNearestWorkshopDistance(cellX, cellY) {
    if (buildings.length === 0) {
      return 0;
    }
    var nearestWorkshopDistance = 999999;
    var buildingIndex;
    for (buildingIndex = 0; buildingIndex < buildings.length; buildingIndex++) {
      var building = buildings[buildingIndex];
      if (building.type !== BUILD_WORKSHOP) {
        continue;
      }
      var centerX = building.x + ((building.size || 1) >> 1);
      var centerY = building.y + ((building.size || 1) >> 1);
      var distance = manhattanDistance(cellX, cellY, centerX, centerY);
      if (distance < nearestWorkshopDistance) {
        nearestWorkshopDistance = distance;
      }
    }
    if (nearestWorkshopDistance === 999999) {
      return 0;
    }
    return nearestWorkshopDistance;
  }

  function getNearestBuildingDistance(cellX, cellY) {
    if (buildings.length === 0) {
      return 0;
    }
    var nearestBuildingDistance = 999999;
    var buildingIndex;
    for (buildingIndex = 0; buildingIndex < buildings.length; buildingIndex++) {
      var building = buildings[buildingIndex];
      var centerX = building.x + ((building.size || 1) >> 1);
      var centerY = building.y + ((building.size || 1) >> 1);
      var distance = manhattanDistance(cellX, cellY, centerX, centerY);
      if (distance < nearestBuildingDistance) {
        nearestBuildingDistance = distance;
      }
    }
    return nearestBuildingDistance;
  }

  function tryUpdateBestSpawnCandidate(cellX, cellY, bestCandidate) {
    if (!inBounds(cellX, cellY) || !isCellWalkable(cellX, cellY)) {
      return;
    }
    var score = getNearestWorkshopDistance(cellX, cellY);
    if (score > bestCandidate.score) {
      bestCandidate.score = score;
      bestCandidate.x = cellX;
      bestCandidate.y = cellY;
    }
  }

  function getSpawnSampleMargin() {
    return Math.max(4, WORLD_SIZE >> 4);
  }

  function getPlayerSpawnCorner() {
    var mapCenterX = WORLD_SIZE >> 1;
    var mapCenterY = WORLD_SIZE >> 1;
    var eastHalf = INITIAL_WORKSHOP_X >= mapCenterX;
    var southHalf = INITIAL_WORKSHOP_Y >= mapCenterY;
    if (!eastHalf && !southHalf) {
      return SPAWN_CORNER_NW;
    }
    if (eastHalf && !southHalf) {
      return SPAWN_CORNER_NE;
    }
    if (!eastHalf && southHalf) {
      return SPAWN_CORNER_SW;
    }
    return SPAWN_CORNER_SE;
  }

  function isSpawnCornerAllowed(corner) {
    return corner >= 0 && corner < SPAWN_CORNER_COUNT && corner !== getPlayerSpawnCorner();
  }

  function getSpawnCornerLabel(corner) {
    if (corner === SPAWN_CORNER_NE) {
      return SPAWN_CORNER_LABEL_NE;
    }
    if (corner === SPAWN_CORNER_SE) {
      return SPAWN_CORNER_LABEL_SE;
    }
    if (corner === SPAWN_CORNER_SW) {
      return SPAWN_CORNER_LABEL_SW;
    }
    return SPAWN_CORNER_LABEL_NW;
  }

  function pickRandomAllowedSpawnCorner() {
    var blockedCorner = getPlayerSpawnCorner();
    var corner = randomInt(0, SPAWN_CORNER_COUNT - 1);
    while (corner === blockedCorner) {
      corner = randomInt(0, SPAWN_CORNER_COUNT - 1);
    }
    return corner;
  }

  function getNextAllowedSpawnCorner(currentCorner) {
    var cornerIndex = currentCorner + 1;
    if (cornerIndex >= SPAWN_CORNER_COUNT) {
      cornerIndex = 0;
    }
    var safety = 0;
    while (!isSpawnCornerAllowed(cornerIndex) && safety < SPAWN_CORNER_COUNT) {
      cornerIndex += 1;
      if (cornerIndex >= SPAWN_CORNER_COUNT) {
        cornerIndex = 0;
      }
      safety += 1;
    }
    return cornerIndex;
  }

  function isCellInSpawnCorner(cellX, cellY, corner) {
    var margin = getSpawnSampleMargin();
    var band = SPAWN_CORNER_BAND;
    var maxCellX = WORLD_SIZE - margin - 1;
    var maxCellY = WORLD_SIZE - margin - 1;
    var eastMin = WORLD_SIZE - margin - band;
    var southMin = WORLD_SIZE - margin - band;
    if (corner === SPAWN_CORNER_NW) {
      return cellX >= margin && cellX <= margin + band && cellY >= margin && cellY <= margin + band;
    }
    if (corner === SPAWN_CORNER_NE) {
      return cellX >= eastMin && cellX <= maxCellX && cellY >= margin && cellY <= margin + band;
    }
    if (corner === SPAWN_CORNER_SW) {
      return cellX >= margin && cellX <= margin + band && cellY >= southMin && cellY <= maxCellY;
    }
    if (corner === SPAWN_CORNER_SE) {
      return cellX >= eastMin && cellX <= maxCellX && cellY >= southMin && cellY <= maxCellY;
    }
    return false;
  }

  function getFurthestSpawnInCorner(corner) {
    var bestCandidate = { x: WORLD_SIZE >> 1, y: WORLD_SIZE >> 1, score: -1 };
    var sampleStep = SPAWN_PREVIEW_COARSE_STEP;
    var margin = getSpawnSampleMargin();
    var sampleY;
    var sampleX;
    for (sampleY = margin; sampleY < WORLD_SIZE - margin; sampleY += sampleStep) {
      for (sampleX = margin; sampleX < WORLD_SIZE - margin; sampleX += sampleStep) {
        if (!isCellInSpawnCorner(sampleX, sampleY, corner)) {
          continue;
        }
        tryUpdateBestSpawnCandidate(sampleX, sampleY, bestCandidate);
      }
    }
    var refineOffsetY;
    var refineOffsetX;
    for (refineOffsetY = -SPAWN_PREVIEW_REFINE_RADIUS; refineOffsetY <= SPAWN_PREVIEW_REFINE_RADIUS; refineOffsetY++) {
      for (refineOffsetX = -SPAWN_PREVIEW_REFINE_RADIUS; refineOffsetX <= SPAWN_PREVIEW_REFINE_RADIUS; refineOffsetX++) {
        var refineX = bestCandidate.x + refineOffsetX;
        var refineY = bestCandidate.y + refineOffsetY;
        if (!isCellInSpawnCorner(refineX, refineY, corner)) {
          continue;
        }
        tryUpdateBestSpawnCandidate(refineX, refineY, bestCandidate);
      }
    }
    return { x: bestCandidate.x, y: bestCandidate.y };
  }

  function getDefaultSpawnCorner() {
    var bestCorner = pickRandomAllowedSpawnCorner();
    var bestScore = -1;
    var cornerIndex;
    for (cornerIndex = 0; cornerIndex < SPAWN_CORNER_COUNT; cornerIndex++) {
      if (!isSpawnCornerAllowed(cornerIndex)) {
        continue;
      }
      var spawnCell = getFurthestSpawnInCorner(cornerIndex);
      var score = getNearestWorkshopDistance(spawnCell.x, spawnCell.y);
      if (score > bestScore) {
        bestScore = score;
        bestCorner = cornerIndex;
      }
    }
    return bestCorner;
  }

  function getSpawnEdgeLabel(edge) {
    if (edge === SPAWN_EDGE_EAST) {
      return SPAWN_EDGE_LABEL_EAST;
    }
    if (edge === SPAWN_EDGE_SOUTH) {
      return SPAWN_EDGE_LABEL_SOUTH;
    }
    if (edge === SPAWN_EDGE_WEST) {
      return SPAWN_EDGE_LABEL_WEST;
    }
    return SPAWN_EDGE_LABEL_NORTH;
  }

  function canChooseSpawnEdge() {
    if (phase !== PHASE_PLAYING) {
      return false;
    }
    return livingDemonCount < 1;
  }

  function isCellOnSpawnEdge(cellX, cellY, edge) {
    var margin = getSpawnSampleMargin();
    var band = SPAWN_EDGE_BAND;
    if (edge === SPAWN_EDGE_NORTH) {
      return cellY >= margin && cellY <= margin + band;
    }
    if (edge === SPAWN_EDGE_SOUTH) {
      return cellY >= WORLD_SIZE - margin - band - 1 && cellY <= WORLD_SIZE - margin - 1;
    }
    if (edge === SPAWN_EDGE_WEST) {
      return cellX >= margin && cellX <= margin + band;
    }
    if (edge === SPAWN_EDGE_EAST) {
      return cellX >= WORLD_SIZE - margin - band - 1 && cellX <= WORLD_SIZE - margin - 1;
    }
    return false;
  }

  function getFurthestSpawnOnEdge(edge) {
    var bestCandidate = { x: WORLD_SIZE >> 1, y: WORLD_SIZE >> 1, score: -1 };
    var sampleStep = SPAWN_PREVIEW_COARSE_STEP;
    var margin = getSpawnSampleMargin();
    var sampleY;
    var sampleX;
    if (edge === SPAWN_EDGE_NORTH || edge === SPAWN_EDGE_SOUTH) {
      var minY = margin;
      var maxY = margin + SPAWN_EDGE_BAND;
      if (edge === SPAWN_EDGE_SOUTH) {
        minY = WORLD_SIZE - margin - SPAWN_EDGE_BAND - 1;
        maxY = WORLD_SIZE - margin - 1;
      }
      for (sampleY = minY; sampleY <= maxY; sampleY += sampleStep) {
        for (sampleX = margin; sampleX < WORLD_SIZE - margin; sampleX += sampleStep) {
          tryUpdateBestSpawnCandidate(sampleX, sampleY, bestCandidate);
        }
      }
    } else {
      var minX = margin;
      var maxX = margin + SPAWN_EDGE_BAND;
      if (edge === SPAWN_EDGE_EAST) {
        minX = WORLD_SIZE - margin - SPAWN_EDGE_BAND - 1;
        maxX = WORLD_SIZE - margin - 1;
      }
      for (sampleX = minX; sampleX <= maxX; sampleX += sampleStep) {
        for (sampleY = margin; sampleY < WORLD_SIZE - margin; sampleY += sampleStep) {
          tryUpdateBestSpawnCandidate(sampleX, sampleY, bestCandidate);
        }
      }
    }
    var refineOffsetY;
    var refineOffsetX;
    for (refineOffsetY = -SPAWN_PREVIEW_REFINE_RADIUS; refineOffsetY <= SPAWN_PREVIEW_REFINE_RADIUS; refineOffsetY++) {
      for (refineOffsetX = -SPAWN_PREVIEW_REFINE_RADIUS; refineOffsetX <= SPAWN_PREVIEW_REFINE_RADIUS; refineOffsetX++) {
        var refineX = bestCandidate.x + refineOffsetX;
        var refineY = bestCandidate.y + refineOffsetY;
        if (!isCellOnSpawnEdge(refineX, refineY, edge)) {
          continue;
        }
        tryUpdateBestSpawnCandidate(refineX, refineY, bestCandidate);
      }
    }
    return { x: bestCandidate.x, y: bestCandidate.y };
  }

  function getDefaultSpawnEdge() {
    var bestEdge = SPAWN_EDGE_NORTH;
    var bestScore = -1;
    var edgeIndex;
    for (edgeIndex = 0; edgeIndex < SPAWN_EDGE_COUNT; edgeIndex++) {
      var spawnCell = getFurthestSpawnOnEdge(edgeIndex);
      var score = getNearestWorkshopDistance(spawnCell.x, spawnCell.y);
      if (score > bestScore) {
        bestScore = score;
        bestEdge = edgeIndex;
      }
    }
    return bestEdge;
  }

  function findDemonMarchPath(startX, startY) {
    var workshop = findNearestWorkshop(startX, startY);
    if (!workshop) {
      return null;
    }
    var marchPath = findDemonPathToWorkshop(startX, startY, workshop, MARCH_PATHFIND_MAX_NODES);
    return {
      goalX: marchPath.goalX,
      goalY: marchPath.goalY,
      path: marchPath.path
    };
  }

  function markSpawnDirectionDirty() {
    spawnDirectionDirty = true;
  }

  function setSelectedSpawnCorner(corner) {
    if (!isSpawnCornerAllowed(corner)) {
      return false;
    }
    if (!canChooseSpawnEdge()) {
      return false;
    }
    selectedSpawnCorner = corner;
    markSpawnDirectionDirty();
    refreshNextSpawnPreview();
    addFloatingText(nextSpawnCellX, nextSpawnCellY, getSpawnCornerLabel(corner), "#ffb050");
    markMinimapDirty();
    return true;
  }

  function cycleSelectedSpawnCorner() {
    if (!canChooseSpawnEdge()) {
      return false;
    }
    var nextCorner = getNextAllowedSpawnCorner(selectedSpawnCorner);
    if (selectedSpawnCorner < 0) {
      nextCorner = pickRandomAllowedSpawnCorner();
    }
    return setSelectedSpawnCorner(nextCorner);
  }

  function getSpawnCornerFromScreenPoint(screenX, screenY) {
    var distTop = screenY;
    var distBottom = canvasHeight - screenY;
    var distLeft = screenX;
    var distRight = canvasWidth - screenX;
    var minDist = distTop;
    var corner = SPAWN_CORNER_NE;
    if (distRight < minDist) {
      minDist = distRight;
      corner = SPAWN_CORNER_SE;
    }
    if (distBottom < minDist) {
      minDist = distBottom;
      if (screenX >= canvasWidth * 0.5) {
        corner = SPAWN_CORNER_SE;
      } else {
        corner = SPAWN_CORNER_SW;
      }
    }
    if (distLeft < minDist) {
      corner = SPAWN_CORNER_SW;
    }
    if (minDist > SPAWN_EDGE_PICK_SCREEN_MARGIN) {
      return -1;
    }
    if (!isSpawnCornerAllowed(corner)) {
      corner = pickRandomAllowedSpawnCorner();
    }
    return corner;
  }

  function setSelectedSpawnEdge(edge) {
    var corner = SPAWN_CORNER_NE;
    if (edge === SPAWN_EDGE_EAST) {
      corner = SPAWN_CORNER_SE;
    } else if (edge === SPAWN_EDGE_SOUTH) {
      corner = SPAWN_CORNER_SE;
    } else if (edge === SPAWN_EDGE_WEST) {
      corner = SPAWN_CORNER_SW;
    }
    return setSelectedSpawnCorner(corner);
  }

  function cycleSelectedSpawnEdge() {
    return cycleSelectedSpawnCorner();
  }

  function isScreenPointOnSpawnArrow(screenX, screenY) {
    if (lastSpawnArrowHitRadius <= 0) {
      return false;
    }
    var deltaX = screenX - lastSpawnArrowScreenX;
    var deltaY = screenY - lastSpawnArrowScreenY;
    var hitRadius = lastSpawnArrowHitRadius + 8;
    return deltaX * deltaX + deltaY * deltaY <= hitRadius * hitRadius;
  }

  function tryHandleSpawnEdgeClick(screenX, screenY) {
    if (!canChooseSpawnEdge()) {
      return false;
    }
    if (isScreenPointOnSpawnArrow(screenX, screenY)) {
      cycleSelectedSpawnCorner();
      return true;
    }
    var corner = getSpawnCornerFromScreenPoint(screenX, screenY);
    if (corner < 0) {
      return false;
    }
    if (selectedSpawnCorner === corner) {
      return true;
    }
    setSelectedSpawnCorner(corner);
    return true;
  }

  function refreshNextSpawnPreview() {
    if (selectedSpawnCorner < 0 || !isSpawnCornerAllowed(selectedSpawnCorner)) {
      selectedSpawnCorner = pickRandomAllowedSpawnCorner();
    }
    var spawnCell = getFurthestSpawnInCorner(selectedSpawnCorner);
    nextSpawnCellX = spawnCell.x;
    nextSpawnCellY = spawnCell.y;
    nextSpawnWorldX = spawnCell.x + 0.5;
    nextSpawnWorldY = spawnCell.y + 0.5;
    nextSpawnPath = null;
    nextSpawnGoalX = -1;
    nextSpawnGoalY = -1;
    var marchPath = findDemonMarchPath(spawnCell.x, spawnCell.y);
    if (marchPath) {
      nextSpawnGoalX = marchPath.goalX;
      nextSpawnGoalY = marchPath.goalY;
      nextSpawnPath = marchPath.path;
    }
    spawnDirectionDirty = false;
    nextSpawnPreviewWorldRevision = pathfindingWorldRevision;
  }

  function ensureNextSpawnPreviewFresh() {
    if (spawnDirectionDirty || nextSpawnPreviewWorldRevision !== pathfindingWorldRevision) {
      refreshNextSpawnPreview();
    }
  }

  function getNextSpawnCell() {
    ensureNextSpawnPreviewFresh();
    return { x: nextSpawnCellX, y: nextSpawnCellY };
  }

  function getNextSpawnWorldPoint() {
    ensureNextSpawnPreviewFresh();
    return { x: nextSpawnWorldX, y: nextSpawnWorldY };
  }

  function countLivingDemons() {
    var count = 0;
    var unitIndex;
    for (unitIndex = 0; unitIndex < units.length; unitIndex++) {
      if (units[unitIndex].kind === UNIT_DEMON) {
        count += 1;
      }
    }
    return count;
  }

  function checkPendingWaveSpawn() {
    if (phase !== PHASE_PLAYING) {
      return;
    }
    if (livingDemonCount > 0) {
      return;
    }
    if (pendingWaveSpawns < 1) {
      return;
    }
    pendingWaveSpawns -= 1;
    spawnDemonWave();
  }

  function spawnDemonWave() {
    waveNumber += 1;
    selectedSpawnCorner = pickRandomAllowedSpawnCorner();
    refreshNextSpawnPreview();
    var demonCount = 3 + waveNumber * 2;
    var spawnPoint = getNextSpawnCell();
    var spawnIndex;
    for (spawnIndex = 0; spawnIndex < demonCount; spawnIndex++) {
      var offsetX = randomInt(-2, 2);
      var offsetY = randomInt(-2, 2);
      var spawnX = spawnPoint.x + offsetX;
      var spawnY = spawnPoint.y + offsetY;
      if (!isCellWalkable(spawnX, spawnY)) {
        spawnX = spawnPoint.x;
        spawnY = spawnPoint.y;
      }
      units.push({
        kind: UNIT_DEMON,
        x: spawnX + 0.5,
        y: spawnY + 0.5,
        hp: DEMON_HP + waveNumber * 8,
        maxHp: DEMON_HP + waveNumber * 8,
        path: null,
        pathIndex: 0,
        pathGoalX: -1,
        pathGoalY: -1,
        pathWorldRevision: -1,
        pathTimer: randomFloat() * DEMON_PATH_RECALC_INTERVAL,
        openRouteCheckTimer: randomFloat() * DEMON_OPEN_ROUTE_CHECK_INTERVAL,
        attackTimer: 0,
        attackTargetX: -1,
        attackTargetY: -1
      });
      livingDemonCount += 1;
    }
    addFloatingText(spawnPoint.x, spawnPoint.y, "WAVE " + String(waveNumber), "#ff5050");
    markSpawnDirectionDirty();
  }

  function addMoney(amount) {
    if (amount <= 0) {
      return;
    }
    money += amount;
    demonAnger += amount * DEMON_ANGER_PER_CREDIT;
    while (demonAnger >= DEMON_ANGER_MAX) {
      demonAnger -= DEMON_ANGER_MAX;
      if (livingDemonCount > 0) {
        pendingWaveSpawns += 1;
      } else {
        spawnDemonWave();
      }
    }
    updateHud();
  }

  function spendMoney(amount) {
    if (money < amount) {
      return false;
    }
    money -= amount;
    updateHud();
    return true;
  }

  function addFloatingText(worldCellX, worldCellY, text, color) {
    floatingTexts.push({
      x: worldCellX,
      y: worldCellY,
      text: text,
      color: color || "#ffd070",
      life: 1.2
    });
  }

  function addMoneyWithRewardPopup(worldCellX, worldCellY, amount) {
    if (amount <= 0) {
      return;
    }
    addMoney(amount);
    addFloatingText(
      worldCellX,
      worldCellY,
      FLOATING_TEXT_PREFIX_REWARD + String(amount),
      FLOATING_TEXT_COLOR_REWARD
    );
  }

  function addBuildingPassiveReward(building, amount) {
    var center = getBuildingCenter(building);
    addMoneyWithRewardPopup(center.x - 0.5, center.y - 0.5, amount);
  }

  function damageMountain(cellX, cellY, amount) {
    if (!inBounds(cellX, cellY) || !isMountain(cellX, cellY)) {
      return false;
    }
    var index = cellIndex(cellX, cellY);
    var hitsNeeded = oreMask[index] ? ORE_DIG_HITS : MOUNTAIN_DIG_HITS;
    digProgress[index] += amount;
    if (digProgress[index] < hitsNeeded) {
      return false;
    }
    terrain[index] = TERRAIN_GROUND;
    if (oreMask[index]) {
      oreMask[index] = 0;
      var reward = randomInt(ORE_REWARD_MIN, ORE_REWARD_MAX);
      addMoneyWithRewardPopup(cellX, cellY, reward);
    }
    digProgress[index] = 0;
    if (mineOrders[index]) {
      mineOrders[index] = 0;
      if (activeMineOrderCount > 0) {
        activeMineOrderCount -= 1;
      }
    }
    markPathfindingWorldDirtyAt(cellX, cellY, 2);
    markMinimapDirty();
    return true;
  }

  function destroyPlayerWall(cellX, cellY) {
    if (!inBounds(cellX, cellY)) {
      return;
    }
    var index = cellIndex(cellX, cellY);
    playerWall[index] = 0;
    wallDigProgress[index] = 0;
    markPathfindingWorldDirtyAt(cellX, cellY, 2);
    markMinimapDirty();
  }

  function damagePlayerWallFromDemon(cellX, cellY, amount) {
    if (!isPlayerWall(cellX, cellY)) {
      return false;
    }
    var index = cellIndex(cellX, cellY);
    var hitsNeeded = getBuildDefinition(BUILD_WALL).hp;
    wallDigProgress[index] += amount;
    if (wallDigProgress[index] < hitsNeeded) {
      return false;
    }
    destroyPlayerWall(cellX, cellY);
    markMinimapDirty();
    return true;
  }

  function damageWorkerDigTarget(cellX, cellY, amount) {
    if (isMountain(cellX, cellY)) {
      return damageMountain(cellX, cellY, amount);
    }
    if (isPlayerWall(cellX, cellY)) {
      destroyPlayerWall(cellX, cellY);
      return true;
    }
    return false;
  }

  function damagePlayerWall(cellX, cellY, amount) {
    return damagePlayerWallFromDemon(cellX, cellY, amount);
  }

  function damageBuilding(building, amount) {
    building.hp -= amount;
    if (building.hp <= 0) {
      removeBuilding(building);
      return true;
    }
    return false;
  }

  function removeBuilding(building) {
    var index = buildings.indexOf(building);
    if (index >= 0) {
      var size = building.size || 1;
      var centerX = building.x + ((size - 1) >> 1);
      var centerY = building.y + ((size - 1) >> 1);
      buildings.splice(index, 1);
      markPathfindingWorldDirtyAt(centerX, centerY, size + 3);
      markMinimapDirty();
    }
  }

  function damageCellTarget(cellX, cellY, amount) {
    if (isMountain(cellX, cellY)) {
      return damageMountain(cellX, cellY, amount);
    }
    if (isPlayerWall(cellX, cellY)) {
      return damagePlayerWall(cellX, cellY, amount);
    }
    var building = getBuildingAt(cellX, cellY);
    if (building) {
      return damageBuilding(building, amount);
    }
    return false;
  }

  function findMineApproachCell(mountainX, mountainY, fromX, fromY) {
    var cells = collectMineApproachCells(mountainX, mountainY, fromX, fromY);
    if (cells.length > 0) {
      return { x: cells[0].x, y: cells[0].y };
    }
    return null;
  }

  function collectMineApproachCells(targetX, targetY, fromX, fromY) {
    var cells = [];
    var directionIndex;
    for (directionIndex = 0; directionIndex < DIRECTIONS.length; directionIndex++) {
      var approachX = targetX + DIRECTIONS[directionIndex][0];
      var approachY = targetY + DIRECTIONS[directionIndex][1];
      if (!isCellWalkable(approachX, approachY)) {
        continue;
      }
      cells.push({
        x: approachX,
        y: approachY,
        distance: manhattanDistance(fromX, fromY, approachX, approachY)
      });
    }
    var sortIndex;
    var swapIndex;
    for (sortIndex = 0; sortIndex < cells.length; sortIndex++) {
      for (swapIndex = sortIndex + 1; swapIndex < cells.length; swapIndex++) {
        if (cells[swapIndex].distance < cells[sortIndex].distance) {
          var temp = cells[sortIndex];
          cells[sortIndex] = cells[swapIndex];
          cells[swapIndex] = temp;
        }
      }
    }
    return cells;
  }

  function setWorkerMinePathWithApproaches(unit, mountainX, mountainY, approachCells) {
    var startX = Math.floor(unit.x);
    var startY = Math.floor(unit.y);
    var approachIndex;
    for (approachIndex = 0; approachIndex < approachCells.length; approachIndex++) {
      var approach = approachCells[approachIndex];
      var path = findPath(startX, startY, approach.x, approach.y, false);
      if (path) {
        assignUnitPath(unit, path, mountainX, mountainY);
        return true;
      }
    }
    return false;
  }

  function isOreTargetedByWorker(cellX, cellY, exceptUnit) {
    var unitIndex;
    for (unitIndex = 0; unitIndex < units.length; unitIndex++) {
      var worker = units[unitIndex];
      if (worker.kind !== UNIT_WORKER) {
        continue;
      }
      if (exceptUnit && worker === exceptUnit) {
        continue;
      }
      if (worker.targetCellX === cellX && worker.targetCellY === cellY) {
        return true;
      }
    }
    return false;
  }

  function isOreReservedByWorker(cellX, cellY) {
    return isOreTargetedByWorker(cellX, cellY, null);
  }

  function claimMineOrder(cellX, cellY) {
    if (!inBounds(cellX, cellY)) {
      return false;
    }
    var index = cellIndex(cellX, cellY);
    if (!mineOrders[index]) {
      return false;
    }
    mineOrders[index] = 0;
    if (activeMineOrderCount > 0) {
      activeMineOrderCount -= 1;
    }
    return true;
  }

  function clearWorkerOreTarget(unit) {
    unit.targetCellX = -1;
    unit.targetCellY = -1;
    unit.digCellX = -1;
    unit.digCellY = -1;
    clearUnitPath(unit);
  }

  function cancelWorkerOreTargetsAt(cellX, cellY) {
    var unitIndex;
    var cleared = false;
    for (unitIndex = 0; unitIndex < units.length; unitIndex++) {
      var worker = units[unitIndex];
      if (worker.kind !== UNIT_WORKER) {
        continue;
      }
      if (worker.targetCellX === cellX && worker.targetCellY === cellY) {
        clearWorkerOreTarget(worker);
        cleared = true;
      }
    }
    return cleared;
  }

  function findClosestOreMountain(fromX, fromY) {
    var bestMountainX = -1;
    var bestMountainY = -1;
    var bestDistance = 999999;
    var cellX;
    var cellY;
    for (cellY = 0; cellY < WORLD_SIZE; cellY++) {
      for (cellX = 0; cellX < WORLD_SIZE; cellX++) {
        var index = cellIndex(cellX, cellY);
        if (terrain[index] !== TERRAIN_MOUNTAIN || !oreMask[index]) {
          continue;
        }
        if (mineOrders[index]) {
          continue;
        }
        if (isOreTargetedByWorker(cellX, cellY, null)) {
          continue;
        }
        var distance = manhattanDistance(fromX, fromY, cellX, cellY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMountainX = cellX;
          bestMountainY = cellY;
        }
      }
    }
    if (bestMountainX < 0) {
      return null;
    }
    return { x: bestMountainX, y: bestMountainY };
  }

  function tryWorkerIdleMineOrder(unit) {
    var closestOre = findClosestOreMountain(Math.floor(unit.x), Math.floor(unit.y));
    if (!closestOre) {
      return false;
    }
    var oreIndex = cellIndex(closestOre.x, closestOre.y);
    mineOrders[oreIndex] = 1;
    activeMineOrderCount += 1;
    claimMineOrder(closestOre.x, closestOre.y);
    unit.targetCellX = closestOre.x;
    unit.targetCellY = closestOre.y;
    unit.digCellX = -1;
    unit.digCellY = -1;
    clearUnitPath(unit);
    return true;
  }

  function findClosestMineOrder(fromX, fromY) {
    var bestMountainX = -1;
    var bestMountainY = -1;
    var bestDistance = 999999;
    var cellX;
    var cellY;
    for (cellY = 0; cellY < WORLD_SIZE; cellY++) {
      for (cellX = 0; cellX < WORLD_SIZE; cellX++) {
        var index = cellIndex(cellX, cellY);
        if (!mineOrders[index]) {
          continue;
        }
        var distance = manhattanDistance(fromX, fromY, cellX, cellY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMountainX = cellX;
          bestMountainY = cellY;
        }
      }
    }
    if (bestMountainX < 0) {
      return null;
    }
    return { x: bestMountainX, y: bestMountainY };
  }

  function syncActiveMineOrderCountFromMap() {
    var count = 0;
    var index;
    for (index = 0; index < mineOrders.length; index++) {
      if (mineOrders[index]) {
        count += 1;
      }
    }
    activeMineOrderCount = count;
  }

  function workerHasValidMineTarget(unit) {
    if (unit.targetCellX < 0 || unit.targetCellY < 0) {
      return false;
    }
    if (!inBounds(unit.targetCellX, unit.targetCellY)) {
      return false;
    }
    return isMountain(unit.targetCellX, unit.targetCellY);
  }

  function assignWorkerToClosestOrder(unit) {
    if (workerHasValidMineTarget(unit) || unit.buildOrderId >= 0) {
      return;
    }
    if (activeBuildOrderCount > 0) {
      return;
    }
    var closestOrder = findClosestMineOrder(Math.floor(unit.x), Math.floor(unit.y));
    if (!closestOrder) {
      clearWorkerOreTarget(unit);
      return;
    }
    claimMineOrder(closestOrder.x, closestOrder.y);
    unit.targetCellX = closestOrder.x;
    unit.targetCellY = closestOrder.y;
    unit.digCellX = -1;
    unit.digCellY = -1;
    clearUnitPath(unit);
  }

  function retargetAllWorkersToClosestOrder() {
    if (activeBuildOrderCount > 0) {
      retargetWorkersForBuildOrders();
      return;
    }
    var unitIndex;
    for (unitIndex = 0; unitIndex < units.length; unitIndex++) {
      var unit = units[unitIndex];
      if (unit.kind !== UNIT_WORKER) {
        continue;
      }
      if (workerHasValidMineTarget(unit)) {
        continue;
      }
      assignWorkerToClosestOrder(unit);
    }
  }

  function cancelMineOrder(cellX, cellY) {
    if (!inBounds(cellX, cellY)) {
      return false;
    }
    var index = cellIndex(cellX, cellY);
    if (!mineOrders[index]) {
      return false;
    }
    mineOrders[index] = 0;
    if (activeMineOrderCount > 0) {
      activeMineOrderCount -= 1;
    }
    retargetAllWorkersToClosestOrder();
    return true;
  }

  function setWorkerMinePath(unit, mountainX, mountainY) {
    var startX = Math.floor(unit.x);
    var startY = Math.floor(unit.y);
    var keepDigTarget =
      unit.digCellX >= 0 &&
      unit.digCellY >= 0 &&
      (isMountain(unit.digCellX, unit.digCellY) || isPlayerWall(unit.digCellX, unit.digCellY));
    if (!keepDigTarget) {
      unit.digCellX = -1;
      unit.digCellY = -1;
    }
    if (keepDigTarget) {
      var activeDigApproaches = collectMineApproachCells(unit.digCellX, unit.digCellY, startX, startY);
      if (setWorkerMinePathWithApproaches(unit, mountainX, mountainY, activeDigApproaches)) {
        return;
      }
      unit.digCellX = -1;
      unit.digCellY = -1;
    }
    var approachCells = collectMineApproachCells(mountainX, mountainY, startX, startY);
    if (setWorkerMinePathWithApproaches(unit, mountainX, mountainY, approachCells)) {
      return;
    }
    var blocker = findBlockingCellTowardGoal(startX, startY, mountainX, mountainY);
    if (!blocker) {
      clearUnitPath(unit);
      return;
    }
    unit.digCellX = blocker.x;
    unit.digCellY = blocker.y;
    var digApproachCells = collectMineApproachCells(blocker.x, blocker.y, startX, startY);
    if (!setWorkerMinePathWithApproaches(unit, mountainX, mountainY, digApproachCells)) {
      clearUnitPath(unit);
    }
  }

  function refreshWorkerOrderPath(unit) {
    if (unit.targetCellX < 0 || unit.targetCellY < 0) {
      return;
    }
    unit.digCellX = -1;
    unit.digCellY = -1;
    clearUnitPath(unit);
    setWorkerMinePath(unit, unit.targetCellX, unit.targetCellY);
  }

  function setUnitPath(unit, goalX, goalY, allowBlocked) {
    var startX = Math.floor(unit.x);
    var startY = Math.floor(unit.y);
    var ignoreTrapMines = unit.kind === UNIT_DEMON;
    var path = findPath(startX, startY, goalX, goalY, allowBlocked, null, ignoreTrapMines);
    assignUnitPath(unit, path, goalX, goalY);
  }

  function enterWorkerIdleRoam(unit) {
    unit.targetCellX = -1;
    unit.targetCellY = -1;
    unit.digCellX = -1;
    unit.digCellY = -1;
    clearUnitPath(unit);
    unit.roamTimer = 0;
  }

  function pickWorkerNextRoamPath(unit) {
    if (activeBuildOrderCount <= 0 && randomFloat() < WORKER_IDLE_MINE_ORDER_CHANCE) {
      if (tryWorkerIdleMineOrder(unit)) {
        return true;
      }
    }
    setWorkerRoamPath(unit);
    unit.roamTimer = 1.4 + randomFloat() * 1.2;
    return false;
  }

  function pickWorkerRoamCell(unit) {
    var originCellX = Math.floor(unit.x);
    var originCellY = Math.floor(unit.y);
    var anchorCellX = originCellX;
    var anchorCellY = originCellY;
    var workshop = findNearestWorkshop(originCellX, originCellY);
    if (workshop) {
      anchorCellX = workshop.x;
      anchorCellY = workshop.y;
    }
    var attempt;
    for (attempt = 0; attempt < 20; attempt++) {
      var offsetX = randomInt(-WORKER_ROAM_RADIUS, WORKER_ROAM_RADIUS);
      var offsetY = randomInt(-WORKER_ROAM_RADIUS, WORKER_ROAM_RADIUS);
      var tryCellX = anchorCellX + offsetX;
      var tryCellY = anchorCellY + offsetY;
      if (!isCellWalkable(tryCellX, tryCellY)) {
        continue;
      }
      var path = findPath(originCellX, originCellY, tryCellX, tryCellY, false);
      if (path) {
        return { x: tryCellX, y: tryCellY, path: path };
      }
    }
    return null;
  }

  function setWorkerRoamPath(unit) {
    var roamChoice = pickWorkerRoamCell(unit);
    if (!roamChoice) {
      clearUnitPath(unit);
      return false;
    }
    unit.roamTargetX = roamChoice.x + 0.5;
    unit.roamTargetY = roamChoice.y + 0.5;
    assignUnitPath(unit, roamChoice.path, roamChoice.x, roamChoice.y);
    return true;
  }

  function moveUnitTowardWorldPoint(unit, targetX, targetY, speed, deltaSeconds) {
    if (!isCellWalkable(Math.floor(unit.x), Math.floor(unit.y))) {
      if (tryEscapeBlockedCell(unit, speed, deltaSeconds)) {
        return;
      }
      return;
    }
    var remaining = speed * deltaSeconds;
    while (remaining > 0.0001) {
      var deltaX = targetX - unit.x;
      var deltaY = targetY - unit.y;
      if (Math.abs(deltaX) < WORKER_ROAM_ARRIVE_DISTANCE && Math.abs(deltaY) < WORKER_ROAM_ARRIVE_DISTANCE) {
        unit.x = targetX;
        unit.y = targetY;
        break;
      }
      var stepX = 0;
      var stepY = 0;
      if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        if (Math.abs(deltaX) > 0.0001) {
          stepX = deltaX > 0 ? 1 : -1;
          stepX *= Math.min(remaining, Math.abs(deltaX));
        } else {
          stepY = deltaY > 0 ? 1 : -1;
          stepY *= Math.min(remaining, Math.abs(deltaY));
        }
      } else {
        if (Math.abs(deltaY) > 0.0001) {
          stepY = deltaY > 0 ? 1 : -1;
          stepY *= Math.min(remaining, Math.abs(deltaY));
        } else {
          stepX = deltaX > 0 ? 1 : -1;
          stepX *= Math.min(remaining, Math.abs(deltaX));
        }
      }
      var nextX = unit.x + stepX;
      var nextY = unit.y + stepY;
      var nextCellX = Math.floor(nextX);
      var nextCellY = Math.floor(nextY);
      if (!canUnitEnterCell(unit, nextCellX, nextCellY)) {
        var slid = false;
        if (stepX !== 0) {
          var slideY = targetY - unit.y;
          if (Math.abs(slideY) > 0.05) {
            var slideStepY = slideY > 0 ? 1 : -1;
            slideStepY *= Math.min(remaining, Math.abs(slideY));
            var slideCellY = Math.floor(unit.y + slideStepY);
            if (isCellWalkableForUnit(unit, Math.floor(unit.x), slideCellY)) {
              unit.y += slideStepY;
              remaining -= Math.abs(slideStepY);
              slid = true;
            }
          }
        }
        if (!slid && stepY !== 0) {
          var slideX = targetX - unit.x;
          if (Math.abs(slideX) > 0.05) {
            var slideStepX = slideX > 0 ? 1 : -1;
            slideStepX *= Math.min(remaining, Math.abs(slideX));
            var slideCellX = Math.floor(unit.x + slideStepX);
            if (isCellWalkableForUnit(unit, slideCellX, Math.floor(unit.y))) {
              unit.x += slideStepX;
              remaining -= Math.abs(slideStepX);
              slid = true;
            }
          }
        }
        if (slid) {
          continue;
        }
        break;
      }
      unit.x = nextX;
      unit.y = nextY;
      remaining -= Math.sqrt(stepX * stepX + stepY * stepY);
    }
  }

  function tickWorkerStuckRecovery(unit, deltaSeconds) {
    var isStuck = false;
    if (unit.buildOrderId >= 0) {
      var buildOrder = getBuildOrderById(unit.buildOrderId);
      if (!buildOrder) {
        unit.buildOrderId = -1;
        unit.pathTimer = 0;
        return;
      }
      if (workerIsAdjacentToBuildFootprint(unit, buildOrder)) {
        unit.pathTimer = 0;
        return;
      }
      if (!unit.path || unit.pathIndex >= unit.path.length) {
        isStuck = true;
      }
    } else if (unit.targetCellX >= 0 && activeBuildOrderCount <= 0) {
      var unitCellX = Math.floor(unit.x);
      var unitCellY = Math.floor(unit.y);
      var atMine =
        workerHasValidMineTarget(unit) &&
        manhattanDistance(unitCellX, unitCellY, unit.targetCellX, unit.targetCellY) <= 1;
      var atDig =
        unit.digCellX >= 0 &&
        unit.digCellY >= 0 &&
        manhattanDistance(unitCellX, unitCellY, unit.digCellX, unit.digCellY) <= 1;
      if (atMine || atDig) {
        unit.pathTimer = 0;
        return;
      }
      if (!unit.path || unit.pathIndex >= unit.path.length) {
        isStuck = true;
      }
    } else {
      unit.pathTimer = 0;
      return;
    }
    if (!isStuck) {
      unit.pathTimer = 0;
      return;
    }
    unit.pathTimer += deltaSeconds;
    if (unit.pathTimer < WORKER_STUCK_SECONDS) {
      return;
    }
    unit.pathTimer = 0;
    if (unit.buildOrderId >= 0) {
      releaseWorkerFromBuildOrder(unit);
      assignWorkerToClosestBuildOrder(unit);
      if (unit.buildOrderId < 0) {
        redirectWorkerToPendingBuildOrder(unit);
      }
      return;
    }
    clearWorkerOreTarget(unit);
    if (activeBuildOrderCount > 0) {
      redirectWorkerToPendingBuildOrder(unit);
    } else if (activeMineOrderCount > 0) {
      assignWorkerToClosestOrder(unit);
      if (workerHasValidMineTarget(unit)) {
        refreshWorkerOrderPath(unit);
      }
    } else {
      enterWorkerIdleRoam(unit);
    }
  }

  function updateWorker(unit, deltaSeconds) {
    var isWandering = unit.targetCellX < 0 && unit.buildOrderId < 0;
    if (!isWandering) {
      resolveUnitWalkablePosition(unit, WORKER_SPEED, deltaSeconds);
    } else if (!isCellWalkable(Math.floor(unit.x), Math.floor(unit.y))) {
      if (!tryEscapeBlockedCell(unit, WORKER_SPEED, deltaSeconds)) {
        snapUnitToWalkableCell(unit);
      }
    }
    tickWorkerStuckRecovery(unit, deltaSeconds);
    redirectWorkerToPendingBuildOrder(unit);
    if (unit.buildOrderId >= 0) {
      var buildOrder = getBuildOrderById(unit.buildOrderId);
      if (!buildOrder) {
        unit.buildOrderId = -1;
      } else {
        var buildCenter = getBuildOrderCenter(buildOrder);
        if (unitNeedsPathRecalc(unit, buildCenter.x, buildCenter.y)) {
          setWorkerBuildPath(unit, buildOrder);
        }
        if (workerIsAdjacentToBuildFootprint(unit, buildOrder)) {
          unit.mineTimer -= deltaSeconds;
          if (unit.mineTimer <= 0) {
            unit.mineTimer = BUILD_ORDER_BUILD_INTERVAL;
            buildOrder.buildProgress += 1;
            if (buildOrder.buildProgress >= buildOrder.buildHitsNeeded) {
              finishBuildOrder(buildOrder, unit);
            }
          }
          resolveUnitWalkablePosition(unit, WORKER_SPEED, deltaSeconds);
          return;
        }
        moveUnitAlongPath(unit, WORKER_SPEED, deltaSeconds);
        resolveUnitWalkablePosition(unit, WORKER_SPEED, deltaSeconds);
        return;
      }
    }
    if (activeBuildOrderCount <= 0) {
      if (unit.targetCellX >= 0 && unit.targetCellY >= 0 && !workerHasValidMineTarget(unit)) {
        assignWorkerToClosestOrder(unit);
      } else if (activeMineOrderCount > 0 && unit.targetCellX < 0) {
        assignWorkerToClosestOrder(unit);
      }
    } else if (unit.targetCellX >= 0 || unit.digCellX >= 0) {
      clearWorkerOreTarget(unit);
    }
    if (activeMineOrderCount <= 0 && activeBuildOrderCount <= 0 && !workerHasValidMineTarget(unit)) {
      if (unit.targetCellX >= 0 || unit.digCellX >= 0) {
        enterWorkerIdleRoam(unit);
      }
    }
    if (unit.targetCellX >= 0) {
      if (unit.digCellX >= 0 && unit.digCellY >= 0 && !isMountain(unit.digCellX, unit.digCellY) && !isPlayerWall(unit.digCellX, unit.digCellY)) {
        refreshWorkerOrderPath(unit);
      }
      if (unitNeedsPathRecalc(unit, unit.targetCellX, unit.targetCellY)) {
        setWorkerMinePath(unit, unit.targetCellX, unit.targetCellY);
      }
      if (
        workerHasValidMineTarget(unit) &&
        manhattanDistance(Math.floor(unit.x), Math.floor(unit.y), unit.targetCellX, unit.targetCellY) <= 1
      ) {
        unit.mineTimer -= deltaSeconds;
        if (unit.mineTimer <= 0) {
          unit.mineTimer = WORKER_MINE_INTERVAL;
          if (damageMountain(unit.targetCellX, unit.targetCellY, WORKER_MINE_DAMAGE)) {
            assignWorkerToClosestOrder(unit);
            if (workerHasValidMineTarget(unit)) {
              refreshWorkerOrderPath(unit);
            }
          }
        }
        resolveUnitWalkablePosition(unit, WORKER_SPEED, deltaSeconds);
        return;
      }
      if (unit.digCellX >= 0 && unit.digCellY >= 0) {
        if (manhattanDistance(Math.floor(unit.x), Math.floor(unit.y), unit.digCellX, unit.digCellY) <= 1) {
          unit.mineTimer -= deltaSeconds;
          if (unit.mineTimer <= 0) {
            unit.mineTimer = WORKER_MINE_INTERVAL;
            damageWorkerDigTarget(unit.digCellX, unit.digCellY, WORKER_MINE_DAMAGE);
            if (!isMountain(unit.digCellX, unit.digCellY) && !isPlayerWall(unit.digCellX, unit.digCellY)) {
              refreshWorkerOrderPath(unit);
            }
          }
          resolveUnitWalkablePosition(unit, WORKER_SPEED, deltaSeconds);
          return;
        }
      }
    } else {
      unit.digCellX = -1;
      unit.digCellY = -1;
      unit.roamTimer -= deltaSeconds;
      var roamPathFinished = unit.path && unit.pathIndex >= unit.path.length;
      if (roamPathFinished) {
        if (unit.roamTimer <= 0) {
          pickWorkerNextRoamPath(unit);
        }
      } else if (!unit.path) {
        if (unit.roamTimer <= 0) {
          pickWorkerNextRoamPath(unit);
        }
      } else {
        var roamWaypoint = unit.path[unit.pathIndex];
        if (roamWaypoint && !canUnitEnterCell(unit, roamWaypoint.x, roamWaypoint.y)) {
          setWorkerRoamPath(unit);
          unit.roamTimer = 1.4 + randomFloat() * 1.2;
        }
      }
      moveUnitAlongPath(unit, WORKER_ROAM_SPEED, deltaSeconds);
      return;
    }
    moveUnitAlongPath(unit, WORKER_SPEED, deltaSeconds);
    resolveUnitWalkablePosition(unit, WORKER_SPEED, deltaSeconds);
  }

  function moveUnitAlongPath(unit, speed, deltaSeconds) {
    if (!isCellWalkableForUnit(unit, Math.floor(unit.x), Math.floor(unit.y))) {
      if (tryEscapeBlockedCell(unit, speed, deltaSeconds)) {
        return;
      }
      return;
    }
    if (!unit.path || unit.pathIndex >= unit.path.length) {
      return;
    }
    var remaining = speed * deltaSeconds;
    while (remaining > 0.0001) {
      if (!unit.path || unit.pathIndex >= unit.path.length) {
        break;
      }
      var waypoint = unit.path[unit.pathIndex];
      if (!canUnitEnterCell(unit, waypoint.x, waypoint.y)) {
        if (unit.kind === UNIT_DEMON && isCellBlockedForWalk(waypoint.x, waypoint.y, true, true)) {
          break;
        }
        clearUnitPath(unit);
        if (unit.kind === UNIT_WORKER && unit.targetCellX < 0) {
          unit.roamTimer = 0;
        }
        break;
      }
      var targetX = waypoint.x + 0.5;
      var targetY = waypoint.y + 0.5;
      var deltaX = targetX - unit.x;
      var deltaY = targetY - unit.y;
      if (Math.abs(deltaX) < 0.05 && Math.abs(deltaY) < 0.05) {
        unit.x = targetX;
        unit.y = targetY;
        unit.pathIndex += 1;
        continue;
      }
      var stepX = 0;
      var stepY = 0;
      if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        if (Math.abs(deltaX) > 0.0001) {
          stepX = deltaX > 0 ? 1 : -1;
          stepX *= Math.min(remaining, Math.abs(deltaX));
        } else {
          stepY = deltaY > 0 ? 1 : -1;
          stepY *= Math.min(remaining, Math.abs(deltaY));
        }
      } else {
        if (Math.abs(deltaY) > 0.0001) {
          stepY = deltaY > 0 ? 1 : -1;
          stepY *= Math.min(remaining, Math.abs(deltaY));
        } else {
          stepX = deltaX > 0 ? 1 : -1;
          stepX *= Math.min(remaining, Math.abs(deltaX));
        }
      }
      var nextX = unit.x + stepX;
      var nextY = unit.y + stepY;
      var nextCellX = Math.floor(nextX);
      var nextCellY = Math.floor(nextY);
      if (!canUnitEnterCell(unit, nextCellX, nextCellY)) {
        var slid = false;
        if (stepX !== 0) {
          var slideY = targetY - unit.y;
          if (Math.abs(slideY) > 0.05) {
            var slideStepY = slideY > 0 ? 1 : -1;
            slideStepY *= Math.min(remaining, Math.abs(slideY));
            var slideCellY = Math.floor(unit.y + slideStepY);
            if (isCellWalkableForUnit(unit, Math.floor(unit.x), slideCellY)) {
              unit.y += slideStepY;
              remaining -= Math.abs(slideStepY);
              slid = true;
            }
          }
        }
        if (!slid && stepY !== 0) {
          var slideX = targetX - unit.x;
          if (Math.abs(slideX) > 0.05) {
            var slideStepX = slideX > 0 ? 1 : -1;
            slideStepX *= Math.min(remaining, Math.abs(slideX));
            var slideCellX = Math.floor(unit.x + slideStepX);
            if (isCellWalkableForUnit(unit, slideCellX, Math.floor(unit.y))) {
              unit.x += slideStepX;
              remaining -= Math.abs(slideStepX);
              slid = true;
            }
          }
        }
        if (slid) {
          continue;
        }
        if (unit.kind === UNIT_DEMON && isCellBlockedForWalk(nextCellX, nextCellY, true, true)) {
          break;
        }
        clearUnitPath(unit);
        break;
      }
      unit.x = nextX;
      unit.y = nextY;
      remaining -= Math.sqrt(stepX * stepX + stepY * stepY);
    }
  }

  function moveUnitTowardCell(unit, cellX, cellY, speed, deltaSeconds) {
    var targetX = cellX + 0.5;
    var targetY = cellY + 0.5;
    var deltaX = targetX - unit.x;
    var deltaY = targetY - unit.y;
    if (Math.abs(deltaX) < 0.05 && Math.abs(deltaY) < 0.05) {
      unit.x = targetX;
      unit.y = targetY;
      return;
    }
    var remaining = speed * deltaSeconds;
    var stepX = 0;
    var stepY = 0;
    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
      if (Math.abs(deltaX) > 0.0001) {
        stepX = deltaX > 0 ? 1 : -1;
        stepX *= Math.min(remaining, Math.abs(deltaX));
      } else {
        stepY = deltaY > 0 ? 1 : -1;
        stepY *= Math.min(remaining, Math.abs(deltaY));
      }
    } else {
      if (Math.abs(deltaY) > 0.0001) {
        stepY = deltaY > 0 ? 1 : -1;
        stepY *= Math.min(remaining, Math.abs(deltaY));
      } else {
        stepX = deltaX > 0 ? 1 : -1;
        stepX *= Math.min(remaining, Math.abs(deltaX));
      }
    }
    var nextX = unit.x + stepX;
    var nextY = unit.y + stepY;
    if (canUnitEnterCell(unit, Math.floor(nextX), Math.floor(nextY))) {
      unit.x = nextX;
      unit.y = nextY;
    }
  }

  function findNearestDemonTo(unit) {
    var guardCellX = unit.guardCellX;
    var guardCellY = unit.guardCellY;
    if (guardCellX == null || guardCellY == null) {
      var dogHome = findNearestDogHome(Math.floor(unit.x), Math.floor(unit.y));
      if (!dogHome) {
        return -1;
      }
      guardCellX = dogHome.x;
      guardCellY = dogHome.y;
    }
    return findNearestDemonInGuardRange(unit, guardCellX, guardCellY);
  }

  function findNearestDemonInGuardRange(unit, guardCellX, guardCellY) {
    var guardCenterX = guardCellX + 0.5;
    var guardCenterY = guardCellY + 0.5;
    var rangeSquared = DOG_ATTACK_RANGE * DOG_ATTACK_RANGE;
    var bestIndex = -1;
    var bestDistance = 999999;
    var index;
    for (index = 0; index < units.length; index++) {
      var other = units[index];
      if (other.kind !== UNIT_DEMON || other.hp <= 0) {
        continue;
      }
      var toGuardX = other.x - guardCenterX;
      var toGuardY = other.y - guardCenterY;
      var guardDistanceSquared = toGuardX * toGuardX + toGuardY * toGuardY;
      if (guardDistanceSquared > rangeSquared) {
        continue;
      }
      var deltaX = other.x - unit.x;
      var deltaY = other.y - unit.y;
      var distance = deltaX * deltaX + deltaY * deltaY;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
    return bestIndex;
  }

  function isDemonInDogGuardRange(demon, guardCellX, guardCellY) {
    if (!demon || demon.kind !== UNIT_DEMON || demon.hp <= 0) {
      return false;
    }
    var guardCenterX = guardCellX + 0.5;
    var guardCenterY = guardCellY + 0.5;
    var deltaX = demon.x - guardCenterX;
    var deltaY = demon.y - guardCenterY;
    var rangeSquared = DOG_ATTACK_RANGE * DOG_ATTACK_RANGE;
    return deltaX * deltaX + deltaY * deltaY <= rangeSquared;
  }

  function pickDogIdleRoamCell(unit) {
    var guardCellX = unit.guardCellX;
    var guardCellY = unit.guardCellY;
    if (guardCellX == null || guardCellY == null) {
      return false;
    }
    var startX = Math.floor(unit.x);
    var startY = Math.floor(unit.y);
    var attempt;
    for (attempt = 0; attempt < 14; attempt++) {
      var offsetX = randomInt(-DOG_ATTACK_RANGE, DOG_ATTACK_RANGE);
      var offsetY = randomInt(-DOG_ATTACK_RANGE, DOG_ATTACK_RANGE);
      if (offsetX * offsetX + offsetY * offsetY > DOG_ATTACK_RANGE * DOG_ATTACK_RANGE) {
        continue;
      }
      var tryCellX = guardCellX + offsetX;
      var tryCellY = guardCellY + offsetY;
      if (!isCellWalkable(tryCellX, tryCellY)) {
        continue;
      }
      var path = findPath(startX, startY, tryCellX, tryCellY, false);
      if (path) {
        assignUnitPath(unit, path, tryCellX, tryCellY);
        return true;
      }
    }
    return false;
  }

  function updateDogIdleNearGuard(unit, deltaSeconds) {
    unit.targetUnitIndex = -1;
    if (unit.idleRoamTimer == null) {
      unit.idleRoamTimer = 0;
    }
    var roamPathFinished = !unit.path || unit.pathIndex >= unit.path.length;
    if (roamPathFinished) {
      unit.idleRoamTimer -= deltaSeconds;
      if (unit.idleRoamTimer <= 0) {
        pickDogIdleRoamCell(unit);
        unit.idleRoamTimer = 1.1 + randomFloat() * 1.4;
      }
      return;
    }
    moveUnitAlongPath(unit, DOG_SPEED * 0.38, deltaSeconds);
    resolveUnitWalkablePosition(unit, DOG_SPEED * 0.38, deltaSeconds);
  }

  function findNearestDogHome(fromX, fromY) {
    var bestDogHouse = null;
    var bestDogHouseDistance = 999999;
    var bestWorkshop = null;
    var bestWorkshopDistance = 999999;
    var buildingIndex;
    for (buildingIndex = 0; buildingIndex < buildings.length; buildingIndex++) {
      var building = buildings[buildingIndex];
      var size = building.size || 1;
      var centerX = building.x + ((size - 1) >> 1);
      var centerY = building.y + ((size - 1) >> 1);
      var distance = manhattanDistance(fromX, fromY, centerX, centerY);
      if (building.type === BUILD_DOG_HOUSE) {
        if (distance < bestDogHouseDistance) {
          bestDogHouseDistance = distance;
          bestDogHouse = { x: centerX, y: centerY };
        }
      } else if (building.type === BUILD_WORKSHOP) {
        if (distance < bestWorkshopDistance) {
          bestWorkshopDistance = distance;
          bestWorkshop = { x: centerX, y: centerY };
        }
      }
    }
    if (bestDogHouse) {
      return bestDogHouse;
    }
    return bestWorkshop;
  }

  function updateDog(unit, deltaSeconds) {
    resolveUnitWalkablePosition(unit, DOG_SPEED, deltaSeconds);
    if (unit.guardCellX == null || unit.guardCellY == null) {
      var guardHome = findNearestDogHome(Math.floor(unit.x), Math.floor(unit.y));
      if (guardHome) {
        unit.guardCellX = guardHome.x;
        unit.guardCellY = guardHome.y;
      }
    }
    if (livingDemonCount < 1) {
      updateDogIdleNearGuard(unit, deltaSeconds);
      return;
    }
    var guardCellX = unit.guardCellX;
    var guardCellY = unit.guardCellY;
    var targetDemon = null;
    if (unit.targetUnitIndex >= 0 && units[unit.targetUnitIndex] && units[unit.targetUnitIndex].kind === UNIT_DEMON) {
      targetDemon = units[unit.targetUnitIndex];
      if (targetDemon.hp <= 0 || guardCellX == null || !isDemonInDogGuardRange(targetDemon, guardCellX, guardCellY)) {
        unit.targetUnitIndex = -1;
        targetDemon = null;
      }
    }
    if (!targetDemon) {
      unit.targetUnitIndex = findNearestDemonTo(unit);
      targetDemon = unit.targetUnitIndex >= 0 ? units[unit.targetUnitIndex] : null;
    }
    if (!targetDemon) {
      updateDogIdleNearGuard(unit, deltaSeconds);
      return;
    }
    var targetCellX = Math.floor(targetDemon.x);
    var targetCellY = Math.floor(targetDemon.y);
    if (dogNeedsPathRecalc(unit, targetCellX, targetCellY)) {
      setUnitPath(unit, targetCellX, targetCellY, false);
    }
    var deltaX = targetDemon.x - unit.x;
    var deltaY = targetDemon.y - unit.y;
    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance <= 0.75) {
      unit.attackTimer -= deltaSeconds;
      if (unit.attackTimer <= 0) {
        unit.attackTimer = 0.45;
        targetDemon.hp -= DOG_DAMAGE;
        if (targetDemon.hp < 0) {
          targetDemon.hp = 0;
        }
      }
      return;
    }
    moveUnitAlongPath(unit, DOG_SPEED, deltaSeconds);
    resolveUnitWalkablePosition(unit, DOG_SPEED, deltaSeconds);
  }

  function updateDemon(unit, deltaSeconds) {
    if (!isCellWalkableForUnit(unit, Math.floor(unit.x), Math.floor(unit.y))) {
      if (!tryEscapeBlockedCell(unit, DEMON_SPEED, deltaSeconds)) {
        snapUnitToWalkableCell(unit);
      }
    }
    unit.pathTimer -= deltaSeconds;
    unit.openRouteCheckTimer -= deltaSeconds;
    var workshop = findNearestWorkshop(Math.floor(unit.x), Math.floor(unit.y));
    if (!workshop) {
      return;
    }
    var goalX = workshop.x;
    var goalY = workshop.y;
    if (unit.attackTargetX >= 0) {
      if (isCellWalkable(unit.attackTargetX, unit.attackTargetY) && !isPlayerWall(unit.attackTargetX, unit.attackTargetY) && !getBuildingAt(unit.attackTargetX, unit.attackTargetY)) {
        unit.attackTargetX = -1;
        unit.attackTargetY = -1;
        unit.pathTimer = 0;
      } else if (unit.openRouteCheckTimer <= 0) {
        unit.openRouteCheckTimer = DEMON_OPEN_ROUTE_CHECK_INTERVAL;
        if (demonHasOpenRouteToWorkshop(unit, workshop)) {
          unit.attackTargetX = -1;
          unit.attackTargetY = -1;
          unit.pathTimer = 0;
        } else {
          goalX = unit.attackTargetX;
          goalY = unit.attackTargetY;
        }
      } else {
        goalX = unit.attackTargetX;
        goalY = unit.attackTargetY;
      }
    }
    if (demonNeedsPathRecalc(unit, goalX, goalY) && unit.pathTimer <= 0) {
      unit.pathTimer = DEMON_PATH_RECALC_INTERVAL;
      var startX = Math.floor(unit.x);
      var startY = Math.floor(unit.y);
      var path = null;
      var pathGoalX = workshop.x;
      var pathGoalY = workshop.y;
      if (unit.attackTargetX >= 0) {
        var findGoalX = unit.attackTargetX;
        var findGoalY = unit.attackTargetY;
        var attackApproach = findWalkableApproachCell(findGoalX, findGoalY, startX, startY);
        if (attackApproach) {
          path = findPath(startX, startY, attackApproach.x, attackApproach.y, false, null, true);
        }
        if (!path && attackApproach) {
          path = findPath(startX, startY, attackApproach.x, attackApproach.y, true, null, true);
        }
        pathGoalX = findGoalX;
        pathGoalY = findGoalY;
      } else {
        var workshopPath = findDemonPathToWorkshop(startX, startY, workshop, null);
        path = workshopPath.path;
      }
      if (path) {
        assignDemonPath(unit, path, pathGoalX, pathGoalY);
      } else if (unit.attackTargetX < 0) {
        var blocker = findBlockingCellTowardGoal(startX, startY, workshop.x, workshop.y, true);
        if (blocker) {
          unit.attackTargetX = blocker.x;
          unit.attackTargetY = blocker.y;
          setUnitPathToAdjacentTarget(unit, blocker.x, blocker.y, workshop.x, workshop.y);
          if (unit.path) {
            unit.pathIndex = getUnitPathStartIndex(unit, unit.path);
          }
        } else {
          clearUnitPath(unit);
        }
      } else {
        clearUnitPath(unit);
      }
    }
    if (unit.path && unit.pathIndex < unit.path.length) {
      var nextWaypoint = unit.path[unit.pathIndex];
      if (nextWaypoint && !isCellWalkableForUnit(unit, nextWaypoint.x, nextWaypoint.y)) {
        if (manhattanDistance(Math.floor(unit.x), Math.floor(unit.y), nextWaypoint.x, nextWaypoint.y) <= 1) {
          unit.attackTimer -= deltaSeconds;
          if (unit.attackTimer <= 0) {
            unit.attackTimer = DEMON_ATTACK_INTERVAL;
            var pathTargetDestroyed = damageCellTarget(nextWaypoint.x, nextWaypoint.y, DEMON_DAMAGE);
            if (pathTargetDestroyed) {
              clearUnitPath(unit);
              unit.pathTimer = 0;
            }
          }
          return;
        }
      }
    }
    var adjacentPathBlocker = getAdjacentPathBlocker(unit);
    if (adjacentPathBlocker) {
      unit.attackTimer -= deltaSeconds;
      if (unit.attackTimer <= 0) {
        unit.attackTimer = DEMON_ATTACK_INTERVAL;
        var adjacentDestroyed = damageCellTarget(adjacentPathBlocker.x, adjacentPathBlocker.y, DEMON_DAMAGE);
        if (adjacentDestroyed) {
          clearUnitPath(unit);
          unit.pathTimer = 0;
        }
      }
      return;
    }
    var attackCellX = unit.attackTargetX;
    var attackCellY = unit.attackTargetY;
    if (attackCellX >= 0 && manhattanDistance(Math.floor(unit.x), Math.floor(unit.y), attackCellX, attackCellY) <= 1) {
      unit.attackTimer -= deltaSeconds;
      if (unit.attackTimer <= 0) {
        unit.attackTimer = DEMON_ATTACK_INTERVAL;
        var destroyed = damageCellTarget(attackCellX, attackCellY, DEMON_DAMAGE);
        if (destroyed) {
          unit.attackTargetX = -1;
          unit.attackTargetY = -1;
          clearUnitPath(unit);
          unit.pathTimer = 0;
        }
      }
      return;
    }
    if (isUnitAdjacentToBuildingFootprint(unit, workshop.building)) {
      unit.attackTimer -= deltaSeconds;
      if (unit.attackTimer <= 0) {
        unit.attackTimer = DEMON_ATTACK_INTERVAL;
        damageBuilding(workshop.building, DEMON_DAMAGE);
      }
      return;
    }
    if (unit.path && unit.pathIndex < unit.path.length) {
      moveUnitAlongPath(unit, DEMON_SPEED, deltaSeconds);
    } else if (manhattanDistance(Math.floor(unit.x), Math.floor(unit.y), goalX, goalY) > 1) {
      moveUnitTowardCell(unit, goalX, goalY, DEMON_SPEED, deltaSeconds);
    }
  }

  function findEnemyInRange(building, rangeCells) {
    var best = null;
    var bestDistanceSquared = rangeCells * rangeCells + 1;
    var index;
    for (index = 0; index < units.length; index++) {
      var unit = units[index];
      if (unit.kind !== UNIT_DEMON) {
        continue;
      }
      if (unit.hp <= 0) {
        continue;
      }
      if (!isUnitInBuildingRange(building, rangeCells, unit)) {
        continue;
      }
      var center = getBuildingCenter(building);
      var deltaX = unit.x - center.x;
      var deltaY = unit.y - center.y;
      var distanceSquared = deltaX * deltaX + deltaY * deltaY;
      if (distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        best = unit;
      }
    }
    return best;
  }

  function getBuildingLaserTarget(building, rangeCells) {
    var locked = building.laserTargetUnit;
    if (
      locked &&
      units.indexOf(locked) >= 0 &&
      locked.kind === UNIT_DEMON &&
      locked.hp > 0 &&
      isUnitInBuildingRange(building, rangeCells, locked)
    ) {
      return locked;
    }
    building.laserTargetUnit = null;
    var found = findEnemyInRange(building, rangeCells);
    if (found) {
      building.laserTargetUnit = found;
    }
    return building.laserTargetUnit;
  }

  function getBuildingTurretTarget(building, rangeCells) {
    var locked = building.turretTargetUnit;
    if (
      locked &&
      units.indexOf(locked) >= 0 &&
      locked.kind === UNIT_DEMON &&
      locked.hp > 0 &&
      isUnitInBuildingRange(building, rangeCells, locked)
    ) {
      return locked;
    }
    building.turretTargetUnit = null;
    var found = findEnemyInRange(building, rangeCells);
    if (found) {
      building.turretTargetUnit = found;
    }
    return building.turretTargetUnit;
  }

  function findDemonNearWorldPoint(worldX, worldY, maxRadius) {
    var bestUnit = null;
    var bestDistanceSquared = maxRadius * maxRadius + 1;
    var unitIndex;
    for (unitIndex = 0; unitIndex < units.length; unitIndex++) {
      var unit = units[unitIndex];
      if (unit.kind !== UNIT_DEMON) {
        continue;
      }
      var deltaX = unit.x - worldX;
      var deltaY = unit.y - worldY;
      var distanceSquared = deltaX * deltaX + deltaY * deltaY;
      if (distanceSquared <= maxRadius * maxRadius && distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        bestUnit = unit;
      }
    }
    return bestUnit;
  }

  function updateBuildings(deltaSeconds) {
    var index;
    for (index = 0; index < buildings.length; index++) {
      var building = buildings[index];
      var definition = getBuildDefinition(building.type);
      if (definition.passiveIncome) {
        var passiveInterval = definition.passiveInterval || 1;
        building.passiveTimer += deltaSeconds;
        while (building.passiveTimer >= passiveInterval) {
          building.passiveTimer -= passiveInterval;
          var rewardAmount = Math.floor(definition.passiveIncome * PASSIVE_INCOME_MULTIPLIER);
          addBuildingPassiveReward(building, rewardAmount);
        }
      }
      if (building.type === BUILD_DOG_HOUSE) {
        if (dogHouseHasLivingDog(building.id)) {
          building.dogTimer = 0;
        } else {
          building.dogTimer += deltaSeconds;
          if (building.dogTimer >= DOG_SPAWN_INTERVAL) {
            building.dogTimer = 0;
            spawnDogNear(building);
          }
        }
      }
      if (definition.range && definition.damage) {
        if (definition.laser) {
          building.fireTimer -= deltaSeconds;
          var laserTarget = getBuildingLaserTarget(building, definition.range);
          if (laserTarget) {
            var laserCenter = getBuildingCenter(building);
            laserBeams.push({
              fromX: laserCenter.x,
              fromY: laserCenter.y,
              toX: laserTarget.x,
              toY: laserTarget.y,
              life: LASER_BEAM_DURATION
            });
            if (building.fireTimer <= 0) {
              building.fireTimer = definition.fireCooldown;
              damageDemon(laserTarget, definition.damage);
            }
          } else {
            building.laserTargetUnit = null;
          }
          continue;
        }
        building.fireTimer -= deltaSeconds;
        if (building.fireTimer <= 0) {
          var target = getBuildingTurretTarget(building, definition.range);
          if (target) {
            building.fireTimer = definition.fireCooldown;
            if (definition.splash) {
              var rocketCenter = getBuildingCenter(building);
              projectiles.push({
                x: rocketCenter.x,
                y: rocketCenter.y,
                targetX: target.x,
                targetY: target.y,
                targetUnit: target,
                speed: 12,
                damage: definition.damage,
                splashRadius: definition.splash,
                spriteKey: "rocket"
              });
            } else {
              var buildingSize = building.size || 1;
              var buildingCenter = getBuildingCenter(building);
              projectiles.push({
                x: buildingCenter.x,
                y: buildingCenter.y,
                targetX: target.x,
                targetY: target.y,
                targetUnit: target,
                speed: 18,
                damage: definition.damage,
                spriteKey: "projectile"
              });
            }
          } else if (building.fireTimer < 0) {
            building.fireTimer = 0;
          }
        }
      }
    }
  }

  function damageProjectileLockedTarget(projectile) {
    var targetUnit = projectile.targetUnit;
    if (
      targetUnit &&
      targetUnit.kind === UNIT_DEMON &&
      units.indexOf(targetUnit) >= 0 &&
      targetUnit.hp > 0
    ) {
      damageDemon(targetUnit, projectile.damage);
      return;
    }
    if (projectile.splashRadius && projectile.splashRadius > 0) {
      return;
    }
    damageDemonAtWorldPoint(projectile.x, projectile.y, projectile.damage, PROJECTILE_HIT_RADIUS);
  }

  function updateLaserBeams(deltaSeconds) {
    var index = laserBeams.length - 1;
    while (index >= 0) {
      laserBeams[index].life -= deltaSeconds;
      if (laserBeams[index].life <= 0) {
        laserBeams.splice(index, 1);
      }
      index -= 1;
    }
  }

  function onProjectileHit(projectile) {
    if (projectile.splashRadius && projectile.splashRadius > 0) {
      applyRocketSplash(
        projectile.x,
        projectile.y,
        projectile.damage,
        projectile.splashRadius
      );
      rocketBlasts.push({
        x: projectile.x,
        y: projectile.y,
        radius: projectile.splashRadius,
        life: ROCKET_BLAST_DURATION
      });
      return;
    }
    damageProjectileLockedTarget(projectile);
  }

  function updateProjectiles(deltaSeconds) {
    var index = projectiles.length - 1;
    while (index >= 0) {
      var projectile = projectiles[index];
      var targetUnit = projectile.targetUnit;
      var hasLivingTarget =
        targetUnit &&
        units.indexOf(targetUnit) >= 0 &&
        targetUnit.kind === UNIT_DEMON &&
        targetUnit.hp > 0;
      var step = projectile.speed * deltaSeconds;
      if (hasLivingTarget) {
        var targetDeltaX = targetUnit.x - projectile.x;
        var targetDeltaY = targetUnit.y - projectile.y;
        var targetDistance = Math.sqrt(targetDeltaX * targetDeltaX + targetDeltaY * targetDeltaY);
        if (targetDistance <= PROJECTILE_HIT_RADIUS || step >= targetDistance) {
          projectile.x = targetUnit.x;
          projectile.y = targetUnit.y;
          onProjectileHit(projectile);
          projectiles.splice(index, 1);
          index -= 1;
          continue;
        }
        projectile.x += (targetDeltaX / targetDistance) * step;
        projectile.y += (targetDeltaY / targetDistance) * step;
        index -= 1;
        continue;
      }
      var deltaX = projectile.targetX - projectile.x;
      var deltaY = projectile.targetY - projectile.y;
      var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance < 0.08) {
        onProjectileHit(projectile);
        projectiles.splice(index, 1);
        index -= 1;
        continue;
      }
      if (step >= distance) {
        onProjectileHit(projectile);
        projectiles.splice(index, 1);
        index -= 1;
        continue;
      }
      projectile.x += (deltaX / distance) * step;
      projectile.y += (deltaY / distance) * step;
      index -= 1;
    }
  }

  function updateRocketBlasts(deltaSeconds) {
    var index = rocketBlasts.length - 1;
    while (index >= 0) {
      rocketBlasts[index].life -= deltaSeconds;
      if (rocketBlasts[index].life <= 0) {
        rocketBlasts.splice(index, 1);
      }
      index -= 1;
    }
  }

  function updateDeathEffects(deltaSeconds) {
    var index = deathEffects.length - 1;
    while (index >= 0) {
      var effect = deathEffects[index];
      effect.life -= deltaSeconds;
      if (effect.life <= 0) {
        deathEffects.splice(index, 1);
        index -= 1;
        continue;
      }
      if (!effect.flash) {
        effect.x += effect.vx * deltaSeconds;
        effect.y += effect.vy * deltaSeconds;
        effect.vx *= 1 - deltaSeconds * 2.4;
        effect.vy *= 1 - deltaSeconds * 2.4;
      }
      index -= 1;
    }
  }

  function removeDeadUnits() {
    var index = units.length - 1;
    while (index >= 0) {
      var unit = units[index];
      if (unit.hp > 0) {
        index -= 1;
        continue;
      }
      if (unit.kind === UNIT_DOG) {
        unit.hp = 1;
        index -= 1;
        continue;
      }
      if (unit.kind === UNIT_WORKER && unit.buildOrderId >= 0) {
        releaseBuildOrderClaim(unit.buildOrderId);
      }
      if (unit.kind === UNIT_DEMON) {
        spawnDemonDeathEffect(unit.x, unit.y);
        livingDemonCount -= 1;
        if (livingDemonCount < 0) {
          livingDemonCount = 0;
        }
      }
      units.splice(index, 1);
      index -= 1;
    }
  }

  function updateUnits(deltaSeconds) {
    var index;
    for (index = 0; index < units.length; index++) {
      var unit = units[index];
      if (unit.kind === UNIT_WORKER) {
        updateWorker(unit, deltaSeconds);
      } else if (unit.kind === UNIT_DOG) {
        updateDog(unit, deltaSeconds);
      } else if (unit.kind === UNIT_DEMON) {
        updateDemon(unit, deltaSeconds);
      }
      if (unit.kind === UNIT_DEMON) {
        var cellX = Math.floor(unit.x);
        var cellY = Math.floor(unit.y);
        var trapBuilding = getBuildingAt(cellX, cellY);
        if (trapBuilding && trapBuilding.type === BUILD_MINE) {
          var mineDefinition = getBuildDefinition(BUILD_MINE);
          var splashRadius = mineDefinition.splash || 2;
          triggerTrapMineExplosion(cellX + 0.5, cellY + 0.5, mineDefinition.trapDamage, splashRadius);
          removeBuilding(trapBuilding);
        }
      }
    }
    removeDeadUnits();
    checkPendingWaveSpawn();
  }

  function checkGameOver() {
    var hasWorkshop = false;
    var index;
    for (index = 0; index < buildings.length; index++) {
      if (buildings[index].type === BUILD_WORKSHOP) {
        hasWorkshop = true;
        break;
      }
    }
    if (!hasWorkshop) {
      phase = PHASE_GAME_OVER;
      gameOverLine.textContent = "All workshops destroyed — wave " + String(waveNumber);
      gameOverLine.classList.remove("hidden");
      gameScreen.classList.remove("hidden");
      hudTop.classList.add("hidden");
      buildBar.classList.add("hidden");
      minimapPanel.classList.add("hidden");
    }
  }

  function updateFloatingTexts(deltaSeconds) {
    var index = floatingTexts.length - 1;
    while (index >= 0) {
      floatingTexts[index].life -= deltaSeconds;
      floatingTexts[index].y -= deltaSeconds * 0.4;
      if (floatingTexts[index].life <= 0) {
        floatingTexts.splice(index, 1);
      }
      index -= 1;
    }
  }

  function getMinCellPixelSizeForWorldFit() {
    if (canvasWidth < 1) {
      return DEFAULT_CELL_PIXEL_SIZE;
    }
    if (canvasHeight < 1) {
      return DEFAULT_CELL_PIXEL_SIZE;
    }
    var fitWidth = canvasWidth / WORLD_SIZE;
    var fitHeight = canvasHeight / WORLD_SIZE;
    if (fitWidth < fitHeight) {
      return fitWidth;
    }
    return fitHeight;
  }

  function updateViewCellsFromZoom() {
    if (canvasWidth < 1) {
      canvasWidth = 1;
    }
    if (canvasHeight < 1) {
      canvasHeight = 1;
    }
    viewCellsX = Math.ceil(canvasWidth / cellPixelSize);
    viewCellsY = Math.ceil(canvasHeight / cellPixelSize);
    clampCamera();
  }

  function setZoomAtScreen(newCellPixelSize, screenX, screenY) {
    var minCellPixelSize = getMinCellPixelSizeForWorldFit();
    if (newCellPixelSize < minCellPixelSize) {
      newCellPixelSize = minCellPixelSize;
    }
    if (newCellPixelSize > ZOOM_MAX_CELL_PIXEL_SIZE) {
      newCellPixelSize = ZOOM_MAX_CELL_PIXEL_SIZE;
    }
    if (newCellPixelSize === cellPixelSize) {
      return;
    }
    var worldAnchorX = screenX / cellPixelSize + cameraX;
    var worldAnchorY = screenY / cellPixelSize + cameraY;
    cellPixelSize = newCellPixelSize;
    viewCellsX = Math.ceil(canvasWidth / cellPixelSize);
    viewCellsY = Math.ceil(canvasHeight / cellPixelSize);
    cameraX = worldAnchorX - screenX / cellPixelSize;
    cameraY = worldAnchorY - screenY / cellPixelSize;
    clampCamera();
  }

  function zoomInAtViewCenter() {
    setZoomAtScreen(cellPixelSize + ZOOM_STEP, canvasWidth * 0.5, canvasHeight * 0.5);
  }

  function zoomOutAtViewCenter() {
    var minCellPixelSize = getMinCellPixelSizeForWorldFit();
    var nextCellPixelSize = cellPixelSize - ZOOM_STEP;
    if (nextCellPixelSize < minCellPixelSize) {
      nextCellPixelSize = minCellPixelSize;
    }
    setZoomAtScreen(nextCellPixelSize, canvasWidth * 0.5, canvasHeight * 0.5);
  }

  function centerCameraOnWorldCell(worldCellX, worldCellY) {
    cameraX = worldCellX - viewCellsX * 0.5;
    cameraY = worldCellY - viewCellsY * 0.5;
    clampCamera();
  }

  function clampCamera() {
    var overscrollCellsX = viewCellsX * CAMERA_OVERSCROLL_VIEW_FRACTION;
    var overscrollCellsY = viewCellsY * CAMERA_OVERSCROLL_VIEW_FRACTION;
    var minCameraX = -overscrollCellsX;
    var maxCameraX = WORLD_SIZE - viewCellsX + overscrollCellsX;
    var minCameraY = -overscrollCellsY;
    var maxCameraY = WORLD_SIZE - viewCellsY + overscrollCellsY;
    if (cameraX < minCameraX) {
      cameraX = minCameraX;
    }
    if (cameraX > maxCameraX) {
      cameraX = maxCameraX;
    }
    if (cameraY < minCameraY) {
      cameraY = minCameraY;
    }
    if (cameraY > maxCameraY) {
      cameraY = maxCameraY;
    }
  }

  function setMinimapPixelColor(pixelX, pixelY, rgb) {
    var offset = (pixelY * MINIMAP_PIXELS + pixelX) * 4;
    minimapImageData.data[offset] = rgb[0];
    minimapImageData.data[offset + 1] = rgb[1];
    minimapImageData.data[offset + 2] = rgb[2];
    minimapImageData.data[offset + 3] = 255;
  }

  function getMinimapSampleColor(worldX, worldY) {
    if (!inBounds(worldX, worldY)) {
      return MINIMAP_RGB_GROUND;
    }
    var index = cellIndex(worldX, worldY);
    if (playerWall[index]) {
      return MINIMAP_RGB_WALL;
    }
    if (terrain[index] === TERRAIN_MOUNTAIN) {
      if (oreMask[index]) {
        return MINIMAP_RGB_ORE;
      }
      return MINIMAP_RGB_MOUNTAIN;
    }
    return MINIMAP_RGB_GROUND;
  }

  function worldToMinimapPixel(worldX, worldY) {
    return {
      x: worldX / WORLD_SIZE * MINIMAP_PIXELS,
      y: worldY / WORLD_SIZE * MINIMAP_PIXELS
    };
  }

  function getUnitRemainingPath(unit) {
    if (!unit.path || unit.pathIndex >= unit.path.length) {
      return null;
    }
    var remaining = [];
    var pathIndex;
    for (pathIndex = unit.pathIndex; pathIndex < unit.path.length; pathIndex++) {
      remaining.push(unit.path[pathIndex]);
    }
    return remaining;
  }

  function stampMinimapPathCells(path, fillStyle) {
    if (!path || path.length < 1) {
      return;
    }
    minimapContext.fillStyle = fillStyle;
    var pathIndex;
    for (pathIndex = 0; pathIndex < path.length; pathIndex++) {
      var waypoint = path[pathIndex];
      var waypointPixel = worldToMinimapPixel(waypoint.x + 0.5, waypoint.y + 0.5);
      var stampX = Math.floor(waypointPixel.x);
      var stampY = Math.floor(waypointPixel.y);
      minimapContext.fillRect(stampX, stampY, 2, 2);
    }
  }

  function drawMinimapPathLine(path, startWorldX, startWorldY, strokeStyle, lineWidth) {
    if (!path || path.length < 1) {
      return;
    }
    var startPixel = worldToMinimapPixel(startWorldX, startWorldY);
    minimapContext.strokeStyle = strokeStyle;
    minimapContext.lineWidth = lineWidth;
    minimapContext.lineCap = "round";
    minimapContext.lineJoin = "round";
    minimapContext.beginPath();
    minimapContext.moveTo(startPixel.x, startPixel.y);
    var pathIndex;
    for (pathIndex = 0; pathIndex < path.length; pathIndex++) {
      var waypoint = path[pathIndex];
      var waypointPixel = worldToMinimapPixel(waypoint.x + 0.5, waypoint.y + 0.5);
      minimapContext.lineTo(waypointPixel.x, waypointPixel.y);
    }
    minimapContext.stroke();
  }

  function renderMinimapPredictedPath() {
    ensureNextSpawnPreviewFresh();
    var hasPath = nextSpawnPath && nextSpawnPath.length > 0;
    if (!hasPath && (nextSpawnGoalX < 0 || nextSpawnGoalY < 0)) {
      return;
    }
    if (hasPath) {
      drawMinimapPathLine(
        nextSpawnPath,
        nextSpawnWorldX,
        nextSpawnWorldY,
        MINIMAP_COLOR_PREDICTED_PATH_GLOW,
        MINIMAP_PREDICTED_PATH_WIDTH + 2
      );
      drawMinimapPathLine(
        nextSpawnPath,
        nextSpawnWorldX,
        nextSpawnWorldY,
        MINIMAP_COLOR_PREDICTED_PATH,
        MINIMAP_PREDICTED_PATH_WIDTH
      );
      stampMinimapPathCells(nextSpawnPath, MINIMAP_COLOR_PREDICTED_PATH);
    } else {
      var fallbackPath = [
        { x: nextSpawnGoalX, y: nextSpawnGoalY }
      ];
      drawMinimapPathLine(
        fallbackPath,
        nextSpawnWorldX,
        nextSpawnWorldY,
        MINIMAP_COLOR_PREDICTED_PATH_GLOW,
        MINIMAP_PREDICTED_PATH_WIDTH + 2
      );
      drawMinimapPathLine(
        fallbackPath,
        nextSpawnWorldX,
        nextSpawnWorldY,
        MINIMAP_COLOR_PREDICTED_PATH,
        MINIMAP_PREDICTED_PATH_WIDTH
      );
    }
    var spawnPixel = worldToMinimapPixel(nextSpawnWorldX, nextSpawnWorldY);
    minimapContext.fillStyle = MINIMAP_COLOR_PREDICTED_PATH;
    minimapContext.beginPath();
    minimapContext.arc(spawnPixel.x, spawnPixel.y, 2.2, 0, Math.PI * 2);
    minimapContext.fill();
    if (nextSpawnGoalX >= 0 && nextSpawnGoalY >= 0) {
      var goalPixel = worldToMinimapPixel(nextSpawnGoalX + 0.5, nextSpawnGoalY + 0.5);
      minimapContext.strokeStyle = MINIMAP_COLOR_PREDICTED_PATH;
      minimapContext.lineWidth = 1.5;
      minimapContext.strokeRect(goalPixel.x - 2, goalPixel.y - 2, 4, 4);
    }
  }

  function renderMinimapAttackPaths() {
    if (livingDemonCount < 1) {
      return;
    }
    var unitIndex;
    for (unitIndex = 0; unitIndex < units.length; unitIndex++) {
      var unit = units[unitIndex];
      if (unit.kind !== UNIT_DEMON || unit.hp <= 0) {
        continue;
      }
      var remainingPath = getUnitRemainingPath(unit);
      if (!remainingPath || remainingPath.length < 1) {
        continue;
      }
      drawMinimapPathLine(
        remainingPath,
        unit.x,
        unit.y,
        MINIMAP_COLOR_ATTACK_PATH_GLOW,
        MINIMAP_ATTACK_PATH_WIDTH + 2
      );
      drawMinimapPathLine(
        remainingPath,
        unit.x,
        unit.y,
        MINIMAP_COLOR_ATTACK_PATH,
        MINIMAP_ATTACK_PATH_WIDTH
      );
      stampMinimapPathCells(remainingPath, MINIMAP_COLOR_ATTACK_PATH);
    }
  }

  function clearMinimapDisplay() {
    if (!minimapContext || !minimapCanvas) {
      return;
    }
    minimapContext.setTransform(1, 0, 0, 1, 0, 0);
    minimapContext.globalAlpha = 1;
    minimapContext.globalCompositeOperation = "source-over";
    minimapContext.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  }

  function renderMinimapBuildOrders() {
    var orderIndex;
    for (orderIndex = 0; orderIndex < buildOrders.length; orderIndex++) {
      var order = buildOrders[orderIndex];
      var orderSize = order.size || 1;
      var offsetX;
      var offsetY;
      for (offsetY = 0; offsetY < orderSize; offsetY++) {
        for (offsetX = 0; offsetX < orderSize; offsetX++) {
          var cellPixel = worldToMinimapPixel(order.x + offsetX + 0.5, order.y + offsetY + 0.5);
          var stampX = Math.floor(cellPixel.x);
          var stampY = Math.floor(cellPixel.y);
          minimapContext.fillStyle = order.claimed
            ? MINIMAP_COLOR_BUILD_ORDER_CLAIMED
            : MINIMAP_COLOR_BUILD_ORDER;
          minimapContext.fillRect(stampX, stampY, 2, 2);
        }
      }
    }
  }

  function renderMinimap() {
    if (!minimapContext || !minimapCanvas) {
      return;
    }
    clearMinimapDisplay();
    if (!terrain || !minimapImageData || !minimapBaseContext) {
      return;
    }
    if (minimapDirty) {
      rebuildMinimapBase();
      minimapDirty = false;
    }
    minimapContext.drawImage(minimapBaseCanvas, 0, 0, minimapCanvas.width, minimapCanvas.height);
    if (phase === PHASE_PLAYING) {
      renderMinimapBuildOrders();
      renderMinimapPredictedPath();
      renderMinimapAttackPaths();
    }
    var viewLeft = cameraX / WORLD_SIZE * MINIMAP_PIXELS;
    var viewTop = cameraY / WORLD_SIZE * MINIMAP_PIXELS;
    var viewWidth = viewCellsX / WORLD_SIZE * MINIMAP_PIXELS;
    var viewHeight = viewCellsY / WORLD_SIZE * MINIMAP_PIXELS;
    if (viewWidth < 1) {
      viewWidth = 1;
    }
    if (viewHeight < 1) {
      viewHeight = 1;
    }
    var viewRight = viewLeft + viewWidth;
    var viewBottom = viewTop + viewHeight;
    if (viewLeft < 0) {
      viewLeft = 0;
    }
    if (viewTop < 0) {
      viewTop = 0;
    }
    if (viewRight > MINIMAP_PIXELS) {
      viewRight = MINIMAP_PIXELS;
    }
    if (viewBottom > MINIMAP_PIXELS) {
      viewBottom = MINIMAP_PIXELS;
    }
    viewWidth = viewRight - viewLeft;
    viewHeight = viewBottom - viewTop;
    if (viewWidth > 0 && viewHeight > 0) {
      minimapContext.strokeStyle = MINIMAP_COLOR_VIEWPORT;
      minimapContext.lineWidth = 1;
      minimapContext.strokeRect(viewLeft + 0.5, viewTop + 0.5, viewWidth, viewHeight);
    }
  }

  function rebuildMinimapBase() {
    var pixelX;
    var pixelY;
    var worldScale = WORLD_SIZE / MINIMAP_PIXELS;
    for (pixelY = 0; pixelY < MINIMAP_PIXELS; pixelY++) {
      for (pixelX = 0; pixelX < MINIMAP_PIXELS; pixelX++) {
        var worldX = Math.floor((pixelX + 0.5) * worldScale);
        var worldY = Math.floor((pixelY + 0.5) * worldScale);
        var rgb = getMinimapSampleColor(worldX, worldY);
        setMinimapPixelColor(pixelX, pixelY, rgb);
      }
    }
    minimapBaseContext.putImageData(minimapImageData, 0, 0);
    var buildingIndex;
    var buildingRgb = MINIMAP_RGB_BUILDING;
    for (buildingIndex = 0; buildingIndex < buildings.length; buildingIndex++) {
      var building = buildings[buildingIndex];
      var buildingSize = building.size || 1;
      var buildingOffsetX;
      var buildingOffsetY;
      for (buildingOffsetY = 0; buildingOffsetY < buildingSize; buildingOffsetY++) {
        for (buildingOffsetX = 0; buildingOffsetX < buildingSize; buildingOffsetX++) {
          var mapPixelX = Math.floor((building.x + buildingOffsetX + 0.5) / worldScale);
          var mapPixelY = Math.floor((building.y + buildingOffsetY + 0.5) / worldScale);
          if (mapPixelX >= 0 && mapPixelX < MINIMAP_PIXELS && mapPixelY >= 0 && mapPixelY < MINIMAP_PIXELS) {
            setMinimapPixelColor(mapPixelX, mapPixelY, buildingRgb);
          }
        }
      }
    }
    minimapBaseContext.putImageData(minimapImageData, 0, 0);
  }

  function setCameraFromMinimap(localX, localY) {
    var ratioX = localX / MINIMAP_DISPLAY_SIZE;
    var ratioY = localY / MINIMAP_DISPLAY_SIZE;
    if (ratioX < 0) ratioX = 0;
    if (ratioY < 0) ratioY = 0;
    if (ratioX > 1) ratioX = 1;
    if (ratioY > 1) ratioY = 1;
    cameraX = ratioX * WORLD_SIZE - viewCellsX * 0.5;
    cameraY = ratioY * WORLD_SIZE - viewCellsY * 0.5;
    clampCamera();
  }

  function setCameraFromMinimapEvent(event) {
    var rect = minimapCanvas.getBoundingClientRect();
    var localX = event.clientX - rect.left;
    var localY = event.clientY - rect.top;
    setCameraFromMinimap(localX, localY);
  }

  function endCanvasPointer(triggerClick, event) {
    if (!pointerDown) {
      return;
    }
    if (triggerClick && !pointerDrag && phase === PHASE_PLAYING && event) {
      var rect = canvas.getBoundingClientRect();
      var screenX = event.clientX - rect.left;
      var screenY = event.clientY - rect.top;
      if (!tryHandleSpawnEdgeClick(screenX, screenY)) {
        handleWorldClick(screenX, screenY);
      }
    }
    pointerDown = false;
    pointerDrag = false;
    if (canvas && canvas.releasePointerCapture && canvasActivePointerId >= 0) {
      try {
        canvas.releasePointerCapture(canvasActivePointerId);
      } catch (releaseError) {
      }
    }
    canvasActivePointerId = -1;
  }

  function endMinimapPointer(event) {
    if (!minimapPointerDown) {
      return;
    }
    minimapPointerDown = false;
    if (minimapCanvas && minimapCanvas.releasePointerCapture && event && event.pointerId != null) {
      try {
        minimapCanvas.releasePointerCapture(event.pointerId);
      } catch (releaseError) {
      }
    }
  }

  function updateCamera(deltaSeconds) {
    var panX = 0;
    var panY = 0;
    if (keysDown.w || keysDown.ArrowUp) panY -= 1;
    if (keysDown.s || keysDown.ArrowDown) panY += 1;
    if (keysDown.a || keysDown.ArrowLeft) panX -= 1;
    if (keysDown.d || keysDown.ArrowRight) panX += 1;
    if (panX !== 0 || panY !== 0) {
      var length = Math.sqrt(panX * panX + panY * panY);
      cameraX += (panX / length) * CAMERA_PAN_SPEED * deltaSeconds / cellPixelSize;
      cameraY += (panY / length) * CAMERA_PAN_SPEED * deltaSeconds / cellPixelSize;
    }
    clampCamera();
  }

  function worldToScreen(worldX, worldY) {
    return {
      x: (worldX - cameraX) * cellPixelSize,
      y: (worldY - cameraY) * cellPixelSize
    };
  }

  function screenToWorldCell(screenX, screenY) {
    return {
      x: Math.floor(screenX / cellPixelSize + cameraX),
      y: Math.floor(screenY / cellPixelSize + cameraY)
    };
  }

  function drawCellRect(cellX, cellY, color) {
    var screen = worldToScreen(cellX, cellY);
    context.fillStyle = color;
    context.fillRect(screen.x, screen.y, cellPixelSize, cellPixelSize);
  }

  function shouldUseSimpleWorldRender() {
    return viewCellsX * viewCellsY > WORLD_SIMPLE_RENDER_MAX_CELLS || cellPixelSize <= WORLD_SIMPLE_RENDER_CELL_PIXEL;
  }

  function getWorldCellFillColor(cellX, cellY) {
    if (!inBounds(cellX, cellY) || !terrain) {
      return "#2a3828";
    }
    var index = cellIndex(cellX, cellY);
    if (terrain[index] === TERRAIN_MOUNTAIN) {
      if (oreMask[index]) {
        return "#5a4030";
      }
      return "#4a4038";
    }
    if (playerWall[index]) {
      return "#7a6858";
    }
    return "#3a5038";
  }

  function renderWorldSimple(startCellX, startCellY, endCellX, endCellY) {
    var cellY;
    var cellX;
    for (cellY = startCellY; cellY < endCellY; cellY++) {
      for (cellX = startCellX; cellX < endCellX; cellX++) {
        if (!inBounds(cellX, cellY)) {
          continue;
        }
        var screen = worldToScreen(cellX, cellY);
        context.fillStyle = getWorldCellFillColor(cellX, cellY);
        context.fillRect(screen.x, screen.y, cellPixelSize, cellPixelSize);
      }
    }
  }

  function renderWorld() {
    context.fillStyle = "#2a3828";
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    if (!terrain) {
      return;
    }
    var startCellX = Math.floor(cameraX);
    var startCellY = Math.floor(cameraY);
    var endCellX = startCellX + viewCellsX + 2;
    var endCellY = startCellY + viewCellsY + 2;
    if (shouldUseSimpleWorldRender()) {
      renderWorldSimple(startCellX, startCellY, endCellX, endCellY);
      return;
    }
    var cellX;
    var cellY;
    for (cellY = startCellY; cellY < endCellY; cellY++) {
      for (cellX = startCellX; cellX < endCellX; cellX++) {
        if (!inBounds(cellX, cellY)) {
          continue;
        }
        var index = cellIndex(cellX, cellY);
        if (terrain[index] === TERRAIN_MOUNTAIN) {
          if (oreMask[index]) {
            if (!drawSpriteAtCell(cellX, cellY, "ore")) {
              drawCellRect(cellX, cellY, "#5a4030");
            }
          } else if (!drawSpriteAtCell(cellX, cellY, "mountain")) {
            drawCellRect(cellX, cellY, "#4a4038");
          }
        } else if (playerWall[index]) {
          if (!drawSpriteAtCell(cellX, cellY, "wall")) {
            drawCellRect(cellX, cellY, "#7a6858");
          }
          if (wallDigProgress[index] > 0) {
            var wallHitsNeeded = getBuildDefinition(BUILD_WALL).hp;
            var wallDamageRatio = wallDigProgress[index] / wallHitsNeeded;
            if (wallDamageRatio > 1) {
              wallDamageRatio = 1;
            }
            var wallScreen = worldToScreen(cellX, cellY);
            context.fillStyle = "rgba(40, 20, 20, " + String(0.15 + wallDamageRatio * 0.45) + ")";
            context.fillRect(wallScreen.x, wallScreen.y, cellPixelSize, cellPixelSize);
          }
        } else if (!drawSpriteAtCell(cellX, cellY, "ground")) {
          drawCellRect(cellX, cellY, "#3a5038");
        }
        if (mineOrders[index]) {
          var screen = worldToScreen(cellX, cellY);
          context.strokeStyle = "rgba(255, 180, 60, 0.85)";
          context.strokeRect(screen.x + 1, screen.y + 1, cellPixelSize - 2, cellPixelSize - 2);
        } else if (
          terrain[index] === TERRAIN_MOUNTAIN &&
          oreMask[index] &&
          isOreReservedByWorker(cellX, cellY)
        ) {
          var reservedOreScreen = worldToScreen(cellX, cellY);
          context.strokeStyle = "rgba(120, 200, 255, 0.85)";
          context.lineWidth = 2;
          context.strokeRect(
            reservedOreScreen.x + 1,
            reservedOreScreen.y + 1,
            cellPixelSize - 2,
            cellPixelSize - 2
          );
          context.lineWidth = 1;
        }
      }
    }
  }

  function renderOreGlow(timeSeconds) {
    if (!terrain || shouldUseSimpleWorldRender()) {
      return;
    }
    var pulse = 0.45 + Math.sin(timeSeconds * 4) * 0.25;
    var startCellX = Math.floor(cameraX);
    var startCellY = Math.floor(cameraY);
    var endCellX = startCellX + viewCellsX + 2;
    var endCellY = startCellY + viewCellsY + 2;
    var cellX;
    var cellY;
    for (cellY = startCellY; cellY < endCellY; cellY++) {
      for (cellX = startCellX; cellX < endCellX; cellX++) {
        if (!inBounds(cellX, cellY)) {
          continue;
        }
        var index = cellIndex(cellX, cellY);
        if (terrain[index] !== TERRAIN_MOUNTAIN || !oreMask[index]) {
          continue;
        }
        var screen = worldToScreen(cellX, cellY);
        context.fillStyle = "rgba(255, 180, 60, " + String(pulse) + ")";
        context.fillRect(screen.x + 2, screen.y + 2, cellPixelSize - 4, cellPixelSize - 4);
      }
    }
  }

  function renderHoveredDefenseRange() {
    if (phase !== PHASE_PLAYING || selectedBuildId !== BUILD_NONE) {
      return;
    }
    var building = getBuildingUnderPointer();
    if (!building) {
      return;
    }
    var center = getBuildingCenter(building);
    renderDefenseRangeCircle(center.x, center.y, building.type, true);
  }

  function renderGhostDefenseRange() {
    if (phase !== PHASE_PLAYING || selectedBuildId === BUILD_NONE || selectedBuildId === BUILD_SELL) {
      return;
    }
    if (!getBuildDefinition(selectedBuildId)) {
      return;
    }
    if (getBuildingDefenseRange(selectedBuildId) <= 0) {
      return;
    }
    var ghostCell = screenToWorldCell(pointerScreenX, pointerScreenY);
    var ghostSize = getBuildFootprintSize(selectedBuildId);
    var ghostCenterX = ghostCell.x + ghostSize * 0.5;
    var ghostCenterY = ghostCell.y + ghostSize * 0.5;
    renderDefenseRangeCircle(ghostCenterX, ghostCenterY, selectedBuildId, false);
  }

  function renderReservedOreMarkers(startCellX, startCellY, endCellX, endCellY) {
    if (!terrain || !oreMask) {
      return;
    }
    var cellX;
    var cellY;
    for (cellY = startCellY; cellY < endCellY; cellY++) {
      for (cellX = startCellX; cellX < endCellX; cellX++) {
        if (!inBounds(cellX, cellY)) {
          continue;
        }
        var index = cellIndex(cellX, cellY);
        if (terrain[index] !== TERRAIN_MOUNTAIN || !oreMask[index]) {
          continue;
        }
        if (mineOrders[index]) {
          continue;
        }
        if (!isOreReservedByWorker(cellX, cellY)) {
          continue;
        }
        var reservedScreen = worldToScreen(cellX, cellY);
        context.strokeStyle = "rgba(120, 200, 255, 0.9)";
        context.lineWidth = 2;
        context.strokeRect(
          reservedScreen.x + 1,
          reservedScreen.y + 1,
          cellPixelSize - 2,
          cellPixelSize - 2
        );
        context.lineWidth = 1;
      }
    }
  }

  function renderBuildOrderCellMarkers(startCellX, startCellY, endCellX, endCellY) {
    if (!buildOrderCellIds || buildOrders.length < 1) {
      return;
    }
    var cellX;
    var cellY;
    for (cellY = startCellY; cellY < endCellY; cellY++) {
      for (cellX = startCellX; cellX < endCellX; cellX++) {
        if (!inBounds(cellX, cellY)) {
          continue;
        }
        var stampIndex = cellIndex(cellX, cellY);
        var orderId = buildOrderCellIds[stampIndex];
        if (orderId <= 0) {
          continue;
        }
        var cellOrder = getBuildOrderById(orderId);
        if (!cellOrder) {
          buildOrderCellIds[stampIndex] = 0;
          continue;
        }
        var markerScreen = worldToScreen(cellX, cellY);
        context.fillStyle = cellOrder.claimed
          ? "rgba(70, 150, 220, 0.42)"
          : "rgba(255, 170, 50, 0.38)";
        context.fillRect(
          markerScreen.x + 1,
          markerScreen.y + 1,
          cellPixelSize - 2,
          cellPixelSize - 2
        );
        context.strokeStyle = cellOrder.claimed
          ? "rgba(120, 210, 255, 0.95)"
          : "rgba(255, 210, 80, 0.95)";
        context.lineWidth = cellOrder.claimed ? 2 : 1;
        context.strokeRect(
          markerScreen.x + 0.5,
          markerScreen.y + 0.5,
          cellPixelSize - 1,
          cellPixelSize - 1
        );
      }
    }
  }

  function renderBuildOrders() {
    if (buildOrders.length < 1) {
      return;
    }
    var startCellX = Math.floor(cameraX);
    var startCellY = Math.floor(cameraY);
    var endCellX = startCellX + viewCellsX + 2;
    var endCellY = startCellY + viewCellsY + 2;
    renderBuildOrderCellMarkers(startCellX, startCellY, endCellX, endCellY);
    var orderIndex;
    for (orderIndex = 0; orderIndex < buildOrders.length; orderIndex++) {
      var order = buildOrders[orderIndex];
      var orderCenterX = order.x + ((order.size || 1) - 1) * 0.5;
      var orderCenterY = order.y + ((order.size || 1) - 1) * 0.5;
      if (!isWorldPointInView(orderCenterX, orderCenterY, 1)) {
        continue;
      }
      var orderSize = order.size || 1;
      var orderScreen = worldToScreen(order.x, order.y);
      var orderDrawSize = orderSize * cellPixelSize - 1;
      if (orderDrawSize < 2) {
        orderDrawSize = orderSize * cellPixelSize;
      }
      var orderSpriteKey = getBuildingSpriteKey(order.type);
      var orderDefinition = getBuildDefinition(order.type);
      var ghostAlpha = order.claimed ? 0.72 : 0.58;
      context.save();
      context.globalAlpha = ghostAlpha;
      if (!drawSprite(orderSpriteKey, orderScreen.x, orderScreen.y, orderDrawSize, orderDrawSize)) {
        context.fillStyle = orderDefinition.color;
        context.fillRect(orderScreen.x, orderScreen.y, orderDrawSize, orderDrawSize);
      }
      context.restore();
      context.strokeStyle = order.claimed ? "rgba(120, 200, 255, 0.9)" : "rgba(255, 200, 80, 0.85)";
      context.lineWidth = order.claimed ? 2 : 1;
      context.strokeRect(orderScreen.x, orderScreen.y, orderDrawSize, orderDrawSize);
      var buildRatio = 0;
      if (order.buildHitsNeeded > 0) {
        buildRatio = order.buildProgress / order.buildHitsNeeded;
        if (buildRatio > 1) {
          buildRatio = 1;
        }
      }
      context.fillStyle = "rgba(120, 220, 120, 0.9)";
      context.fillRect(orderScreen.x, orderScreen.y + orderDrawSize + 1, orderDrawSize * buildRatio, 3);
    }
  }

  function renderBuildings() {
    var index;
    for (index = 0; index < buildings.length; index++) {
      var building = buildings[index];
      var definition = getBuildDefinition(building.type);
      var size = building.size || 1;
      var screen = worldToScreen(building.x, building.y);
      var drawSize = size * cellPixelSize - 1;
      var spriteKey = getBuildingSpriteKey(building.type);
      if (!drawSprite(spriteKey, screen.x, screen.y, drawSize, drawSize)) {
        context.fillStyle = definition.color;
        context.fillRect(screen.x, screen.y, drawSize, drawSize);
      }
      if (building.maxHp > 0) {
        var hpRatio = building.hp / building.maxHp;
        if (hpRatio < 1) {
          context.fillStyle = "rgba(255, 60, 60, 0.85)";
          context.fillRect(screen.x, screen.y - 3, drawSize * hpRatio, 2);
        }
      }
    }
  }

  function getUnitPathLineColor(unitKind) {
    if (unitKind === UNIT_WORKER) {
      return "rgba(144, 200, 255, 0.42)";
    }
    if (unitKind === UNIT_DOG) {
      return "rgba(208, 160, 96, 0.42)";
    }
    return "rgba(208, 64, 96, 0.48)";
  }

  function isWorldPointInView(worldX, worldY, marginCells) {
    var margin = marginCells;
    if (margin == null) {
      margin = UNIT_PATH_VIEW_MARGIN;
    }
    return (
      worldX >= cameraX - margin &&
      worldX <= cameraX + viewCellsX + margin &&
      worldY >= cameraY - margin &&
      worldY <= cameraY + viewCellsY + margin
    );
  }

  function isUnitPathVisible(unit) {
    if (isWorldPointInView(unit.x, unit.y, UNIT_PATH_VIEW_MARGIN)) {
      return true;
    }
    if (unit.path && unit.pathIndex < unit.path.length) {
      var waypointIndex;
      for (waypointIndex = unit.pathIndex; waypointIndex < unit.path.length; waypointIndex++) {
        var waypoint = unit.path[waypointIndex];
        if (isWorldPointInView(waypoint.x + 0.5, waypoint.y + 0.5, UNIT_PATH_VIEW_MARGIN)) {
          return true;
        }
      }
    }
    if (unit.roamTargetX != null && unit.roamTargetY != null) {
      if (isWorldPointInView(unit.roamTargetX, unit.roamTargetY, UNIT_PATH_VIEW_MARGIN)) {
        return true;
      }
    }
    return false;
  }

  function renderUnitPathLine(unit) {
    var hasPath = unit.path && unit.pathIndex < unit.path.length;
    var hasRoamTarget = unit.roamTargetX != null && unit.roamTargetY != null && unit.targetCellX < 0;
    if (!hasPath && !hasRoamTarget) {
      return;
    }
    if (!isUnitPathVisible(unit)) {
      return;
    }
    var unitScreen = worldToScreen(unit.x, unit.y);
    var dashSize = Math.max(3, cellPixelSize * UNIT_PATH_DASH_SCALE);
    context.strokeStyle = getUnitPathLineColor(unit.kind);
    context.lineWidth = Math.max(1, cellPixelSize * UNIT_PATH_LINE_WIDTH_SCALE);
    context.setLineDash([dashSize, dashSize]);
    context.beginPath();
    context.moveTo(unitScreen.x, unitScreen.y);
    if (hasPath) {
      var pathIndex;
      for (pathIndex = unit.pathIndex; pathIndex < unit.path.length; pathIndex++) {
        var pathWaypoint = unit.path[pathIndex];
        var waypointScreen = worldToScreen(pathWaypoint.x + 0.5, pathWaypoint.y + 0.5);
        context.lineTo(waypointScreen.x, waypointScreen.y);
      }
    } else {
      var roamScreen = worldToScreen(unit.roamTargetX, unit.roamTargetY);
      context.lineTo(roamScreen.x, roamScreen.y);
    }
    context.stroke();
    context.setLineDash([]);
  }

  function renderUnitPaths() {
    var index;
    for (index = 0; index < units.length; index++) {
      renderUnitPathLine(units[index]);
    }
  }

  function renderUnits() {
    var index;
    for (index = 0; index < units.length; index++) {
      var unit = units[index];
      var drawSize = cellPixelSize * 0.75;
      var screen = worldToScreen(unit.x - 0.375, unit.y - 0.375);
      var spriteKey = getUnitSpriteKey(unit.kind);
      if (!drawSprite(spriteKey, screen.x, screen.y, drawSize, drawSize)) {
        var fallbackSize = cellPixelSize * 0.5;
        var fallbackScreen = worldToScreen(unit.x - 0.25, unit.y - 0.25);
        if (unit.kind === UNIT_WORKER) {
          context.fillStyle = "#90c8ff";
        } else if (unit.kind === UNIT_DOG) {
          context.fillStyle = "#d0a060";
        } else {
          context.fillStyle = "#d04060";
        }
        context.fillRect(fallbackScreen.x, fallbackScreen.y, fallbackSize, fallbackSize);
      }
      if (unit.kind === UNIT_DEMON && unit.maxHp > 0) {
        var hpRatio = unit.hp / unit.maxHp;
        if (hpRatio < 0) {
          hpRatio = 0;
        }
        if (hpRatio > 1) {
          hpRatio = 1;
        }
        var barWidth = drawSize;
        var barX = screen.x;
        var barY = screen.y - 4;
        context.fillStyle = "rgba(12, 8, 8, 0.8)";
        context.fillRect(barX, barY, barWidth, 3);
        context.fillStyle = "#ff4060";
        context.fillRect(barX, barY, barWidth * hpRatio, 3);
      }
    }
  }

  function renderLaserBeams() {
    var index;
    for (index = 0; index < laserBeams.length; index++) {
      var beam = laserBeams[index];
      var lifeRatio = beam.life / LASER_BEAM_DURATION;
      if (lifeRatio < 0) {
        lifeRatio = 0;
      }
      if (lifeRatio > 1) {
        lifeRatio = 1;
      }
      var fromScreen = worldToScreen(beam.fromX, beam.fromY);
      var toScreen = worldToScreen(beam.toX, beam.toY);
      var glowAlpha = 0.25 + lifeRatio * 0.45;
      context.strokeStyle = "rgba(255, 220, 80, " + String(glowAlpha) + ")";
      context.lineWidth = Math.max(2, cellPixelSize * 0.22);
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(fromScreen.x, fromScreen.y);
      context.lineTo(toScreen.x, toScreen.y);
      context.stroke();
      context.strokeStyle = "rgba(255, 255, 240, " + String(0.45 + lifeRatio * 0.55) + ")";
      context.lineWidth = Math.max(1, cellPixelSize * 0.08);
      context.beginPath();
      context.moveTo(fromScreen.x, fromScreen.y);
      context.lineTo(toScreen.x, toScreen.y);
      context.stroke();
    }
  }

  function renderProjectiles() {
    var index;
    for (index = 0; index < projectiles.length; index++) {
      var projectile = projectiles[index];
      var spriteKey = projectile.spriteKey || "projectile";
      var drawSize = spriteKey === "rocket" ? Math.max(6, cellPixelSize * 0.42) : Math.max(4, cellPixelSize * 0.3);
      var screen = worldToScreen(projectile.x - 0.15, projectile.y - 0.15);
      if (!drawSprite(spriteKey, screen.x, screen.y, drawSize, drawSize)) {
        context.fillStyle = spriteKey === "rocket" ? "#ff8040" : "#ffe060";
        context.fillRect(screen.x, screen.y, drawSize, drawSize);
      }
    }
  }

  function renderRocketBlasts() {
    var index;
    for (index = 0; index < rocketBlasts.length; index++) {
      var blast = rocketBlasts[index];
      var lifeRatio = blast.life / ROCKET_BLAST_DURATION;
      if (lifeRatio < 0) {
        lifeRatio = 0;
      }
      if (lifeRatio > 1) {
        lifeRatio = 1;
      }
      var screen = worldToScreen(blast.x, blast.y);
      var radiusPixels = blast.radius * cellPixelSize * (1.15 - lifeRatio * 0.35);
      var fillAlpha = 0.5 * lifeRatio;
      context.beginPath();
      context.arc(screen.x, screen.y, radiusPixels, 0, Math.PI * 2);
      context.fillStyle = "rgba(255, 110, 40, " + String(fillAlpha) + ")";
      context.fill();
      context.strokeStyle = "rgba(255, 210, 90, " + String(0.35 + lifeRatio * 0.55) + ")";
      context.lineWidth = Math.max(2, cellPixelSize * 0.1);
      context.stroke();
    }
  }

  function renderDeathEffects() {
    var index;
    for (index = 0; index < deathEffects.length; index++) {
      var effect = deathEffects[index];
      var lifeRatio = effect.life / effect.maxLife;
      if (lifeRatio < 0) {
        lifeRatio = 0;
      }
      if (lifeRatio > 1) {
        lifeRatio = 1;
      }
      var screen = worldToScreen(effect.x, effect.y);
      if (effect.flash) {
        var flashRadius = cellPixelSize * (0.35 + (1 - lifeRatio) * 0.55);
        var flashAlpha = 0.55 * lifeRatio;
        context.beginPath();
        context.arc(screen.x, screen.y, flashRadius, 0, Math.PI * 2);
        context.fillStyle = "rgba(255, 90, 120, " + String(flashAlpha) + ")";
        context.fill();
        context.strokeStyle = "rgba(255, 180, 210, " + String(flashAlpha * 0.85) + ")";
        context.lineWidth = Math.max(1, cellPixelSize * 0.08);
        context.stroke();
        continue;
      }
      var particleSize = Math.max(2, cellPixelSize * (0.12 + lifeRatio * 0.08));
      context.fillStyle = "rgba(220, 60, 90, " + String(0.35 + lifeRatio * 0.55) + ")";
      context.fillRect(
        screen.x - particleSize * 0.5,
        screen.y - particleSize * 0.5,
        particleSize,
        particleSize
      );
    }
  }

  function renderFloatingTexts() {
    var index;
    for (index = 0; index < floatingTexts.length; index++) {
      var item = floatingTexts[index];
      var screen = worldToScreen(item.x + 0.2, item.y);
      context.fillStyle = item.color;
      context.font = "10px Courier New";
      context.fillText(item.text, screen.x, screen.y);
    }
  }

  function renderGhostSell() {
    if (phase !== PHASE_PLAYING || selectedBuildId !== BUILD_SELL) {
      return;
    }
    var cell = screenToWorldCell(pointerScreenX, pointerScreenY);
    var sellTarget = getSellTargetAt(cell.x, cell.y);
    var outlineX = cell.x;
    var outlineY = cell.y;
    var outlineSize = 1;
    var valid = false;
    if (sellTarget) {
      outlineX = sellTarget.x;
      outlineY = sellTarget.y;
      outlineSize = sellTarget.size;
      valid = sellTarget.canSell;
    }
    var screen = worldToScreen(outlineX, outlineY);
    context.strokeStyle = valid ? "rgba(120, 220, 120, 0.75)" : "rgba(220, 80, 80, 0.75)";
    context.strokeRect(screen.x, screen.y, outlineSize * cellPixelSize, outlineSize * cellPixelSize);
  }

  function renderGhostBuild() {
    if (phase !== PHASE_PLAYING || selectedBuildId === BUILD_NONE || selectedBuildId === BUILD_SELL) {
      return;
    }
    var definition = getBuildDefinition(selectedBuildId);
    var size = getBuildFootprintSize(selectedBuildId);
    var cell = screenToWorldCell(pointerScreenX, pointerScreenY);
    var valid = canPlaceBuilding(selectedBuildId, cell.x, cell.y);
    var screen = worldToScreen(cell.x, cell.y);
    var drawSize = size * cellPixelSize - 1;
    var ghostSpriteKey = getBuildingSpriteKey(selectedBuildId);
    context.save();
    context.globalAlpha = valid ? 0.55 : 0.35;
    if (!drawSprite(ghostSpriteKey, screen.x, screen.y, drawSize, drawSize)) {
      context.fillStyle = definition.color;
      context.fillRect(screen.x, screen.y, drawSize, drawSize);
    }
    context.restore();
    context.strokeStyle = valid ? "rgba(120, 220, 120, 0.75)" : "rgba(220, 80, 80, 0.75)";
    context.strokeRect(screen.x, screen.y, size * cellPixelSize, size * cellPixelSize);
  }

  function getSpawnArrowUrgency() {
    if (livingDemonCount > 0 || pendingWaveSpawns > 0) {
      return 1;
    }
    var angerRatio = demonAnger / DEMON_ANGER_MAX;
    if (angerRatio < 0) {
      angerRatio = 0;
    }
    if (angerRatio > 1) {
      angerRatio = 1;
    }
    return angerRatio;
  }

  function getSpawnPreviewColors(urgency) {
    var red = Math.floor(220 + urgency * 35);
    var green = Math.floor(210 - urgency * 170);
    var blue = Math.floor(90 - urgency * 70);
    return {
      stroke: "rgba(" + String(red) + "," + String(green) + "," + String(blue) + "," + String(0.35 + urgency * 0.45) + ")",
      fill: "rgba(" + String(red) + "," + String(green) + "," + String(blue) + "," + String(0.5 + urgency * 0.4) + ")"
    };
  }

  function renderSpawnThreatPreview() {
    if (phase !== PHASE_PLAYING) {
      return;
    }
    ensureNextSpawnPreviewFresh();
    var spawnPoint = getNextSpawnWorldPoint();
    var urgency = getSpawnArrowUrgency();
    var colors = getSpawnPreviewColors(urgency);
    var spawnScreen = worldToScreen(spawnPoint.x, spawnPoint.y);
    var dashSize = Math.max(3, cellPixelSize * UNIT_PATH_DASH_SCALE);
    context.strokeStyle = colors.stroke;
    context.lineWidth = Math.max(1, cellPixelSize * 0.12);
    context.setLineDash([dashSize, dashSize]);
    context.beginPath();
    context.moveTo(spawnScreen.x, spawnScreen.y);
    if (nextSpawnPath && nextSpawnPath.length > 0) {
      var pathIndex;
      for (pathIndex = 0; pathIndex < nextSpawnPath.length; pathIndex++) {
        var waypoint = nextSpawnPath[pathIndex];
        var waypointScreen = worldToScreen(waypoint.x + 0.5, waypoint.y + 0.5);
        context.lineTo(waypointScreen.x, waypointScreen.y);
      }
    } else if (nextSpawnGoalX >= 0 && nextSpawnGoalY >= 0) {
      var fallbackGoalScreen = worldToScreen(nextSpawnGoalX + 0.5, nextSpawnGoalY + 0.5);
      context.lineTo(fallbackGoalScreen.x, fallbackGoalScreen.y);
    }
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = colors.fill;
    context.beginPath();
    context.arc(spawnScreen.x, spawnScreen.y, Math.max(3, cellPixelSize * 0.14), 0, Math.PI * 2);
    context.fill();
    if (nextSpawnGoalX >= 0 && nextSpawnGoalY >= 0) {
      var goalScreen = worldToScreen(nextSpawnGoalX + 0.5, nextSpawnGoalY + 0.5);
      var goalMarkSize = Math.max(4, cellPixelSize * 0.28);
      context.strokeStyle = colors.stroke;
      context.lineWidth = Math.max(1, cellPixelSize * 0.1);
      context.strokeRect(
        goalScreen.x - goalMarkSize * 0.5,
        goalScreen.y - goalMarkSize * 0.5,
        goalMarkSize,
        goalMarkSize
      );
    }
  }

  function renderSpawnDirectionArrow() {
    lastSpawnArrowHitRadius = 0;
    if (phase !== PHASE_PLAYING) {
      return;
    }
    var spawnPoint = getNextSpawnWorldPoint();
    var spawnScreen = worldToScreen(spawnPoint.x, spawnPoint.y);
    var centerScreenX = canvasWidth * 0.5;
    var centerScreenY = canvasHeight * 0.5;
    var edgePoint = getEdgeClampedScreenPoint(centerScreenX, centerScreenY, spawnScreen.x, spawnScreen.y);
    if (!edgePoint) {
      return;
    }
    var urgency = getSpawnArrowUrgency();
    var arrowSize = ENEMY_ARROW_SIZE * (0.7 + urgency * 0.55);
    var red = Math.floor(220 + urgency * 35);
    var green = Math.floor(210 - urgency * 170);
    var blue = Math.floor(90 - urgency * 70);
    var fillAlpha = 0.28 + urgency * 0.62;
    var strokeAlpha = 0.4 + urgency * 0.55;
    lastSpawnArrowScreenX = edgePoint.x;
    lastSpawnArrowScreenY = edgePoint.y;
    lastSpawnArrowHitRadius = arrowSize + 6;
    if (canChooseSpawnEdge()) {
      fillAlpha += 0.12;
      strokeAlpha += 0.15;
    }
    context.save();
    context.translate(edgePoint.x, edgePoint.y);
    context.rotate(edgePoint.angle);
    context.fillStyle = "rgba(" + String(red) + "," + String(green) + "," + String(blue) + "," + String(fillAlpha) + ")";
    context.strokeStyle = "rgba(" + String(red) + "," + String(Math.floor(green * 0.85)) + "," + String(blue) + "," + String(strokeAlpha) + ")";
    context.lineWidth = 1 + urgency * 1.5;
    context.beginPath();
    context.moveTo(arrowSize, 0);
    context.lineTo(-arrowSize * 0.65, arrowSize * 0.55);
    context.lineTo(-arrowSize * 0.35, 0);
    context.lineTo(-arrowSize * 0.65, -arrowSize * 0.55);
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  function getEdgeClampedScreenPoint(fromScreenX, fromScreenY, toScreenX, toScreenY) {
    var deltaX = toScreenX - fromScreenX;
    var deltaY = toScreenY - fromScreenY;
    var absDeltaX = Math.abs(deltaX);
    var absDeltaY = Math.abs(deltaY);
    if (absDeltaX < 0.001 && absDeltaY < 0.001) {
      return null;
    }
    var halfWidth = canvasWidth * 0.5 - ENEMY_ARROW_EDGE_MARGIN;
    var halfHeight = canvasHeight * 0.5 - ENEMY_ARROW_EDGE_MARGIN;
    if (halfWidth < 8) {
      halfWidth = 8;
    }
    if (halfHeight < 8) {
      halfHeight = 8;
    }
    var scale;
    if (absDeltaX * halfHeight > absDeltaY * halfWidth) {
      scale = halfWidth / absDeltaX;
    } else {
      scale = halfHeight / absDeltaY;
    }
    return {
      x: fromScreenX + deltaX * scale,
      y: fromScreenY + deltaY * scale,
      angle: Math.atan2(deltaY, deltaX)
    };
  }

  function renderFrame(timestamp) {
    if (!lastFrameTime) {
      lastFrameTime = timestamp;
    }
    var deltaSeconds = (timestamp - lastFrameTime) / 1000;
    if (deltaSeconds > 0.05) {
      deltaSeconds = 0.05;
    }
    lastFrameTime = timestamp;
    if (phase === PHASE_PLAYING) {
      updateCamera(deltaSeconds);
      updateBuildings(deltaSeconds);
      removeDeadUnits();
      updateUnits(deltaSeconds);
      updateProjectiles(deltaSeconds);
      removeDeadUnits();
      updateRocketBlasts(deltaSeconds);
      updateDeathEffects(deltaSeconds);
      updateLaserBeams(deltaSeconds);
      updateFloatingTexts(deltaSeconds);
      checkGameOver();
    }
    renderWorld();
    if (phase === PHASE_PLAYING) {
      renderOreGlow(timestamp / 1000);
      renderGhostDefenseRange();
      renderHoveredDefenseRange();
      renderBuildings();
      renderSpawnThreatPreview();
      renderUnitPaths();
      renderUnits();
      var orderViewStartX = Math.floor(cameraX);
      var orderViewStartY = Math.floor(cameraY);
      var orderViewEndX = orderViewStartX + viewCellsX + 2;
      var orderViewEndY = orderViewStartY + viewCellsY + 2;
      renderReservedOreMarkers(orderViewStartX, orderViewStartY, orderViewEndX, orderViewEndY);
      renderBuildOrders();
      renderLaserBeams();
      renderProjectiles();
      renderRocketBlasts();
      renderDeathEffects();
      renderFloatingTexts();
      renderGhostBuild();
      renderGhostSell();
      renderSpawnDirectionArrow();
      renderMinimap();
    }
    animationHandle = window.requestAnimationFrame(renderFrame);
  }

  function canPlaceBuilding(type, cellX, cellY) {
    var size = getBuildFootprintSize(type);
    var offsetX;
    var offsetY;
    for (offsetY = 0; offsetY < size; offsetY++) {
      for (offsetX = 0; offsetX < size; offsetX++) {
        if (!canPlaceBuildingOnCell(cellX + offsetX, cellY + offsetY)) {
          return false;
        }
      }
    }
    return true;
  }

  function tryPlaceBuilding(type, cellX, cellY) {
    var definition = getBuildDefinition(type);
    if (!spendMoney(definition.cost)) {
      return false;
    }
    if (!canPlaceBuilding(type, cellX, cellY)) {
      money += definition.cost;
      updateHud();
      return false;
    }
    createBuildOrder(type, cellX, cellY);
    return true;
  }

  function tryAssignMine(cellX, cellY) {
    if (!inBounds(cellX, cellY)) {
      return;
    }
    var index = cellIndex(cellX, cellY);
    if (terrain[index] !== TERRAIN_MOUNTAIN) {
      return;
    }
    if (mineOrders[index]) {
      cancelMineOrder(cellX, cellY);
      return;
    }
    if (isOreTargetedByWorker(cellX, cellY, null)) {
      cancelWorkerOreTargetsAt(cellX, cellY);
      return;
    }
    mineOrders[index] = 1;
    activeMineOrderCount += 1;
    retargetAllWorkersToClosestOrder();
  }

  function handleWorldClick(screenX, screenY) {
    var cell = screenToWorldCell(screenX, screenY);
    if (selectedBuildId === BUILD_SELL) {
      trySellAt(cell.x, cell.y);
      return;
    }
    if (isMountain(cell.x, cell.y)) {
      tryAssignMine(cell.x, cell.y);
      return;
    }
    if (selectedBuildId === BUILD_NONE) {
      return;
    }
    tryPlaceBuilding(selectedBuildId, cell.x, cell.y);
  }

  function buildBuildBar() {
    if (buildBarBuilt) {
      return;
    }
    buildBarBuilt = true;
    buildButtonsById = {};
    var noneButton = document.createElement("button");
    noneButton.type = "button";
    noneButton.className = "build-btn build-btn-none";
    noneButton.setAttribute("data-build-id", BUILD_NONE);
    noneButton.textContent = "None";
    noneButton.addEventListener("click", function (event) {
      var target = event.currentTarget;
      var buildId = target.getAttribute("data-build-id");
      if (buildId) {
        selectedBuildId = buildId;
        updateBuildBarSelection();
      }
    });
    buildBar.appendChild(noneButton);
    buildButtonsById[BUILD_NONE] = noneButton;
    var index;
    for (index = 0; index < BUILD_DEFINITIONS.length; index++) {
      var definition = BUILD_DEFINITIONS[index];
      var button = document.createElement("button");
      button.type = "button";
      button.className = "build-btn";
      button.setAttribute("data-build-id", definition.id);
      var buildSpriteKey = getBuildingSpriteKey(definition.id);
      var buildSpritePath = SPRITE_FILE_BY_KEY[buildSpriteKey];
      button.innerHTML =
        '<img class="build-btn-icon" src="' +
        buildSpritePath +
        '" alt="" />' +
        '<span class="build-btn-label">' +
        definition.label +
        '</span><span class="build-btn-cost">' +
        String(definition.cost) +
        " cr</span>";
      button.addEventListener("click", function (event) {
        var target = event.currentTarget;
        var buildId = target.getAttribute("data-build-id");
        if (buildId) {
          selectedBuildId = buildId;
          updateBuildBarSelection();
        }
      });
      buildBar.appendChild(button);
      buildButtonsById[definition.id] = button;
    }
    var sellButton = document.createElement("button");
    sellButton.type = "button";
    sellButton.className = "build-btn build-btn-sell";
    sellButton.setAttribute("data-build-id", BUILD_SELL);
    sellButton.innerHTML = '<span class="build-btn-label">Sell</span><span class="build-btn-cost">60% refund</span>';
    sellButton.addEventListener("click", function (event) {
      var target = event.currentTarget;
      var buildId = target.getAttribute("data-build-id");
      if (buildId) {
        selectedBuildId = buildId;
        updateBuildBarSelection();
      }
    });
    buildBar.appendChild(sellButton);
    buildButtonsById[BUILD_SELL] = sellButton;
    updateBuildBarSelection();
  }

  function updateBuildBarSelection() {
    var buildId;
    for (buildId in buildButtonsById) {
      if (!buildButtonsById.hasOwnProperty(buildId)) {
        continue;
      }
      var button = buildButtonsById[buildId];
      if (buildId === BUILD_NONE || buildId === BUILD_SELL) {
        button.classList.toggle("is-selected", buildId === selectedBuildId);
        button.classList.toggle("is-disabled", false);
        continue;
      }
      var definition = getBuildDefinition(buildId);
      var disabled = money < definition.cost;
      button.classList.toggle("is-selected", buildId === selectedBuildId);
      button.classList.toggle("is-disabled", disabled);
    }
  }

  function updateHud() {
    hudMoney.textContent = String(money);
    hudWave.textContent = String(waveNumber);
    var angerRatio = demonAnger / DEMON_ANGER_MAX;
    if (angerRatio < 0) angerRatio = 0;
    if (angerRatio > 1) angerRatio = 1;
    hudAngerFill.style.width = String(angerRatio * 100) + "%";
    updateBuildBarSelection();
  }

  function resizeCanvas() {
    var rect = gameRoot.getBoundingClientRect();
    canvasWidth = Math.floor(rect.width);
    canvasHeight = Math.floor(rect.height);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    var minCellPixelSize = getMinCellPixelSizeForWorldFit();
    if (cellPixelSize < minCellPixelSize) {
      cellPixelSize = minCellPixelSize;
    }
    viewCellsX = Math.ceil(canvasWidth / cellPixelSize);
    viewCellsY = Math.ceil(canvasHeight / cellPixelSize);
    clampCamera();
  }

  function resetGame() {
    worldSeed = Date.now() >>> 0;
    generateWorld();
    buildings = [];
    buildOrders = [];
    activeBuildOrderCount = 0;
    nextBuildOrderId = 1;
    units = [];
    projectiles = [];
    laserBeams = [];
    rocketBlasts = [];
    deathEffects = [];
    floatingTexts = [];
    livingDemonCount = 0;
    money = 0;
    demonAnger = 0;
    waveNumber = 0;
    pendingWaveSpawns = 0;
    spawnDirectionDirty = true;
    selectedSpawnCorner = -1;
    lastSpawnArrowScreenX = -1;
    lastSpawnArrowScreenY = -1;
    lastSpawnArrowHitRadius = 0;
    nextSpawnPreviewWorldRevision = -1;
    selectedBuildId = BUILD_NONE;
    cellPixelSize = DEFAULT_CELL_PIXEL_SIZE;
    updateViewCellsFromZoom();
    createBuilding(BUILD_WORKSHOP, INITIAL_WORKSHOP_X, INITIAL_WORKSHOP_Y);
    refreshNextSpawnPreview();
    centerCameraOnWorldCell(INITIAL_WORKSHOP_X + 1, INITIAL_WORKSHOP_Y + 1);
    markMinimapDirty();
    updateHud();
  }

  function startGame() {
    phase = PHASE_PLAYING;
    gameScreen.classList.add("hidden");
    gameOverLine.classList.add("hidden");
    hudTop.classList.remove("hidden");
    buildBar.classList.remove("hidden");
    minimapPanel.classList.remove("hidden");
    resizeCanvas();
    resetGame();
    gameRoot.focus();
    if (window.WebExtrasGameStartMusicNotify && window.WebExtrasGameStartMusicNotify.notifyGameplayStarted) {
      window.WebExtrasGameStartMusicNotify.notifyGameplayStarted();
    }
  }

  function bindInput() {
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("keydown", function (event) {
      keysDown[event.key] = true;
      if (event.key === " " || event.key === "Enter") {
        if (phase === PHASE_START || phase === PHASE_GAME_OVER) {
          startGame();
        }
      }
    });
    document.addEventListener("keyup", function (event) {
      keysDown[event.key] = false;
    });
    canvas.addEventListener("pointerenter", function (event) {
      canvasPointerInside = true;
      var enterRect = canvas.getBoundingClientRect();
      pointerScreenX = event.clientX - enterRect.left;
      pointerScreenY = event.clientY - enterRect.top;
    });
    canvas.addEventListener("pointerdown", function (event) {
      if (event.pointerType === "touch") {
        event.preventDefault();
      }
      canvasPointerInside = true;
      var rectDown = canvas.getBoundingClientRect();
      pointerScreenX = event.clientX - rectDown.left;
      pointerScreenY = event.clientY - rectDown.top;
      if (phase !== PHASE_PLAYING) {
        return;
      }
      pointerDown = true;
      pointerDrag = false;
      canvasActivePointerId = event.pointerId;
      if (canvas.setPointerCapture) {
        canvas.setPointerCapture(event.pointerId);
      }
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      pointerLastX = event.clientX;
      pointerLastY = event.clientY;
      dragCameraStartX = cameraX;
      dragCameraStartY = cameraY;
    });
    canvas.addEventListener("pointermove", function (event) {
      canvasPointerInside = true;
      var rect = canvas.getBoundingClientRect();
      pointerScreenX = event.clientX - rect.left;
      pointerScreenY = event.clientY - rect.top;
      if (!pointerDown || phase !== PHASE_PLAYING) {
        return;
      }
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        endCanvasPointer(false, null);
        return;
      }
      var deltaX = event.clientX - pointerStartX;
      var deltaY = event.clientY - pointerStartY;
      var dragThreshold = event.pointerType === "touch" ? 8 : 4;
      if (!pointerDrag && (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold)) {
        pointerDrag = true;
      }
      if (pointerDrag) {
        cameraX = dragCameraStartX - deltaX / cellPixelSize;
        cameraY = dragCameraStartY - deltaY / cellPixelSize;
        clampCamera();
      }
      pointerLastX = event.clientX;
      pointerLastY = event.clientY;
    });
    canvas.addEventListener("pointerleave", function () {
      canvasPointerInside = false;
      endCanvasPointer(false, null);
    });
    canvas.addEventListener("pointerup", function (event) {
      if (!pointerDown || phase !== PHASE_PLAYING || event.pointerId !== canvasActivePointerId) {
        pointerDown = false;
        pointerDrag = false;
        canvasActivePointerId = -1;
        return;
      }
      endCanvasPointer(true, event);
    });
    canvas.addEventListener("pointercancel", function () {
      endCanvasPointer(false, null);
    });
    canvas.addEventListener("wheel", function (event) {
      if (phase !== PHASE_PLAYING) {
        return;
      }
      event.preventDefault();
      var wheelRect = canvas.getBoundingClientRect();
      var wheelScreenX = event.clientX - wheelRect.left;
      var wheelScreenY = event.clientY - wheelRect.top;
      var nextCellPixelSize = cellPixelSize;
      if (event.deltaY < 0) {
        nextCellPixelSize += ZOOM_STEP;
      } else if (event.deltaY > 0) {
        nextCellPixelSize -= ZOOM_STEP;
      }
      setZoomAtScreen(nextCellPixelSize, wheelScreenX, wheelScreenY);
    }, { passive: false });
    gameScreen.addEventListener("click", function () {
      if (phase === PHASE_START || phase === PHASE_GAME_OVER) {
        startGame();
      }
    });
    document.addEventListener("selectstart", function (event) {
      event.preventDefault();
    });
    minimapCanvas.addEventListener("pointerdown", function (event) {
      if (phase !== PHASE_PLAYING) {
        return;
      }
      if (event.pointerType === "touch") {
        event.preventDefault();
      }
      minimapPointerDown = true;
      if (minimapCanvas.setPointerCapture) {
        minimapCanvas.setPointerCapture(event.pointerId);
      }
      setCameraFromMinimapEvent(event);
      event.preventDefault();
    });
    minimapCanvas.addEventListener("pointermove", function (event) {
      if (!minimapPointerDown || phase !== PHASE_PLAYING) {
        return;
      }
      setCameraFromMinimapEvent(event);
    });
    minimapCanvas.addEventListener("pointerup", function (event) {
      endMinimapPointer(event);
    });
    minimapCanvas.addEventListener("pointercancel", function (event) {
      endMinimapPointer(event);
    });
    window.addEventListener("pointerup", function (event) {
      endMinimapPointer(event);
      if (pointerDown && event.pointerId === canvasActivePointerId) {
        endCanvasPointer(false, null);
      }
    });
    if (btnZoomIn) {
      btnZoomIn.addEventListener("click", function () {
        if (phase !== PHASE_PLAYING) {
          return;
        }
        zoomInAtViewCenter();
      });
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener("click", function () {
        if (phase !== PHASE_PLAYING) {
          return;
        }
        zoomOutAtViewCenter();
      });
    }
  }

  function init() {
    gameRoot = document.getElementById("gameRoot");
    canvas = document.getElementById("gameCanvas");
    context = canvas.getContext("2d");
    minimapPanel = document.getElementById("minimapPanel");
    minimapCanvas = document.getElementById("minimapCanvas");
    minimapCanvas.width = MINIMAP_PIXELS;
    minimapCanvas.height = MINIMAP_PIXELS;
    minimapContext = minimapCanvas.getContext("2d");
    minimapContext.imageSmoothingEnabled = false;
    minimapImageData = minimapContext.createImageData(MINIMAP_PIXELS, MINIMAP_PIXELS);
    minimapBaseCanvas = document.createElement("canvas");
    minimapBaseCanvas.width = MINIMAP_PIXELS;
    minimapBaseCanvas.height = MINIMAP_PIXELS;
    minimapBaseContext = minimapBaseCanvas.getContext("2d");
    minimapBaseContext.imageSmoothingEnabled = false;
    btnZoomIn = document.getElementById("btnZoomIn");
    btnZoomOut = document.getElementById("btnZoomOut");
    hudTop = document.getElementById("hudTop");
    hudMoney = document.getElementById("hudMoney");
    hudAngerFill = document.getElementById("hudAngerFill");
    hudWave = document.getElementById("hudWave");
    buildBar = document.getElementById("buildBar");
    gameScreen = document.getElementById("gameScreen");
    gameOverLine = document.getElementById("gameOverLine");
    controlHint = document.getElementById("controlHint");
    if (controlHint) {
      controlHint.textContent =
        "Top-down base defense on a " +
        String(WORLD_SIZE) +
        "×" +
        String(WORLD_SIZE) +
        " field. Pan with WASD, drag, or touch. Scroll to zoom. Between waves, click a screen edge or the direction arrow to choose the next demon attack side; the dashed path shows their expected route.";
    }
    buildings = [];
    buildOrders = [];
    activeBuildOrderCount = 0;
    nextBuildOrderId = 1;
    units = [];
    projectiles = [];
    laserBeams = [];
    rocketBlasts = [];
    deathEffects = [];
    floatingTexts = [];
    buildBuildBar();
    loadSprites();
    bindInput();
    resizeCanvas();
    updateHud();
    animationHandle = window.requestAnimationFrame(renderFrame);
    if (window.WebExtrasGameStartMusicNotify && window.WebExtrasGameStartMusicNotify.notifyStartScreenReady) {
      window.WebExtrasGameStartMusicNotify.notifyStartScreenReady();
    }
  }

  init();
})();
