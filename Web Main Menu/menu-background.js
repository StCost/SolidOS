(function () {
  var BACKGROUND_FILES = [
    "backgrounds/background-01.png",
    "backgrounds/background-02.png",
    "backgrounds/background-03.png"
  ];

  var STORAGE_KEY = "cm-menu-background-history";
  var backgroundCount = BACKGROUND_FILES.length;

  function readStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { usedIndexes: [], lastIndex: -1 };
      var parsed = JSON.parse(raw);
      var usedIndexes = [];
      var index;
      if (parsed && parsed.usedIndexes && parsed.usedIndexes.length) {
        for (index = 0; index < parsed.usedIndexes.length; index++) {
          var value = parsed.usedIndexes[index];
          if (typeof value !== "number") continue;
          if (value < 0 || value >= backgroundCount) continue;
          if (usedIndexes.indexOf(value) !== -1) continue;
          usedIndexes.push(value);
        }
      }
      var lastIndex = -1;
      if (parsed && typeof parsed.lastIndex === "number") {
        if (parsed.lastIndex >= 0 && parsed.lastIndex < backgroundCount) {
          lastIndex = parsed.lastIndex;
        }
      }
      return { usedIndexes: usedIndexes, lastIndex: lastIndex };
    } catch (error) {
      return { usedIndexes: [], lastIndex: -1 };
    }
  }

  function writeStorage(usedIndexes, lastIndex) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          usedIndexes: usedIndexes,
          lastIndex: lastIndex
        })
      );
    } catch (error) {
    }
  }

  function buildAvailableIndexes(usedIndexes) {
    var available = [];
    var index;
    for (index = 0; index < backgroundCount; index++) {
      if (usedIndexes.indexOf(index) === -1) {
        available.push(index);
      }
    }
    return available;
  }

  function removeLastIndexFromPool(pool, lastIndex) {
    if (lastIndex < 0 || pool.length <= 1) return pool;
    var filtered = [];
    var index;
    for (index = 0; index < pool.length; index++) {
      if (pool[index] !== lastIndex) {
        filtered.push(pool[index]);
      }
    }
    if (filtered.length === 0) return pool;
    return filtered;
  }

  function pickRandomIndex(pool) {
    var pick = Math.floor(Math.random() * pool.length);
    return pool[pick];
  }

  function chooseBackgroundIndex() {
    var storage = readStorage();
    var usedIndexes = storage.usedIndexes;
    var lastIndex = storage.lastIndex;
    var available = buildAvailableIndexes(usedIndexes);
    var cycleReset = false;

    if (available.length === 0) {
      usedIndexes = [];
      available = buildAvailableIndexes(usedIndexes);
      cycleReset = true;
    }

    if (cycleReset) {
      available = removeLastIndexFromPool(available, lastIndex);
    }

    var chosenIndex = pickRandomIndex(available);
    usedIndexes.push(chosenIndex);
    writeStorage(usedIndexes, chosenIndex);
    return chosenIndex;
  }

  var chosenIndex = chooseBackgroundIndex();
  var chosenPath = BACKGROUND_FILES[chosenIndex];
  var backgroundUrl = 'url("' + chosenPath + '")';

  document.documentElement.style.setProperty("--menu-background-image", backgroundUrl);
  window.WebMenuBackgroundPath = chosenPath;
  window.WebMenuBackgroundIndex = chosenIndex;
})();
