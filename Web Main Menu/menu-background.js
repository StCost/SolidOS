(function () {
  var BACKGROUND_FILES = [
    "backgrounds/background-01.png",
    "backgrounds/background-02.png",
    "backgrounds/background-03.png"
  ];

  var STORAGE_KEY = "cm-menu-background-history";
  var SELECTED_STORAGE_KEY = "cm-menu-background-selected";
  var EVENT_MENU_BACKGROUND_SAVE = "web-menu-background-save";
  var backgroundCount = BACKGROUND_FILES.length;

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

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

  function getIndexForPath(path) {
    var index;
    for (index = 0; index < backgroundCount; index++) {
      if (BACKGROUND_FILES[index] === path) return index;
    }
    return -1;
  }

  function readSelectedBackground() {
    try {
      var raw = localStorage.getItem(SELECTED_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function writeSelectedBackground(selection) {
    try {
      localStorage.setItem(SELECTED_STORAGE_KEY, JSON.stringify(selection));
    } catch (error) {
    }
  }

  function postMenuBackgroundSave(path, useRandom) {
    if (!isUnityHost()) return;
    window.vuplex.postMessage(
      JSON.stringify({
        eventName: EVENT_MENU_BACKGROUND_SAVE,
        backgroundPath: path || "",
        backgroundRandom: !!useRandom
      })
    );
  }

  function applyBackgroundPath(path, index, selection) {
    if (!path) return false;
    var backgroundUrl = 'url("' + path + '")';
    document.documentElement.style.setProperty("--menu-background-image", backgroundUrl);
    window.WebMenuBackgroundPath = path;
    if (typeof index === "number" && index >= 0) {
      window.WebMenuBackgroundIndex = index;
    } else {
      window.WebMenuBackgroundIndex = getIndexForPath(path);
    }
    if (selection) {
      writeSelectedBackground(selection);
      postMenuBackgroundSave(selection.random ? "" : selection.path, selection.random);
    }
    return true;
  }

  function initBackground() {
    var selected = readSelectedBackground();
    if (selected && selected.random) {
      var randomIndex = chooseBackgroundIndex();
      applyBackgroundPath(BACKGROUND_FILES[randomIndex], randomIndex);
      return;
    }
    if (selected && selected.path) {
      applyBackgroundPath(selected.path, selected.index);
      return;
    }
    var chosenIndex = chooseBackgroundIndex();
    applyBackgroundPath(BACKGROUND_FILES[chosenIndex], chosenIndex);
  }

  window.WebMenuBackground = {
    getBackgroundFiles: function () {
      return BACKGROUND_FILES.slice();
    },
    getIndexForPath: getIndexForPath,
    getSelectionState: function () {
      var selected = readSelectedBackground();
      if (selected && selected.random) {
        return { random: true, path: "" };
      }
      if (selected && selected.path) {
        return { random: false, path: selected.path };
      }
      if (window.WebMenuBackgroundPath) {
        return { random: false, path: window.WebMenuBackgroundPath };
      }
      return { random: false, path: "" };
    },
    setBackground: function (path) {
      var selection = {
        path: path,
        index: getIndexForPath(path),
        random: false
      };
      return applyBackgroundPath(path, selection.index, selection);
    },
    setRandomBackground: function () {
      var randomIndex = chooseBackgroundIndex();
      var path = BACKGROUND_FILES[randomIndex];
      var selection = {
        path: path,
        index: randomIndex,
        random: true
      };
      return applyBackgroundPath(path, randomIndex, selection);
    },
    applySavedPreference: function (path, useRandom) {
      if (useRandom) {
        var selection = {
          path: "",
          index: -1,
          random: true
        };
        writeSelectedBackground(selection);
        postMenuBackgroundSave("", true);
        var randomIndex = chooseBackgroundIndex();
        applyBackgroundPath(BACKGROUND_FILES[randomIndex], randomIndex);
        return;
      }
      if (path) {
        applyBackgroundPath(path, getIndexForPath(path), {
          path: path,
          index: getIndexForPath(path),
          random: false
        });
        return;
      }
      try {
        localStorage.removeItem(SELECTED_STORAGE_KEY);
      } catch (error) {
      }
      initBackground();
    }
  };

  initBackground();
})();
