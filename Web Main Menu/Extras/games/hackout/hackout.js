(function () {
  var LOCALE_KEY_ATTEMPTS = "web.game.hackout.attempts";
  var LOCALE_KEY_ATTEMPT_LOG = "web.game.hackout.attempt-log";
  var LOCALE_KEY_MATCH = "web.game.hackout.match";
  var LOCALE_KEY_HINT = "web.game.hackout.hint";
  var LOCALE_KEY_WIN = "web.game.hackout.win";
  var LOCALE_KEY_LOSE = "web.game.hackout.lose";
  var LOCALE_KEY_WIN_SUB = "web.game.hackout.win-sub";
  var LOCALE_KEY_LOSE_SUB = "web.game.hackout.lose-sub";
  var LOCALE_KEY_RETRY = "web.game.prompt.click-retry";
  var LOCALE_KEY_CLICK_START = "web.game.prompt.click-start";
  var LOCALE_KEY_SCORE = "web.game.hackout.score";
  var LOCALE_KEY_BEST = "web.game.hackout.best";

  var HIGH_SCORE_STORAGE_KEY = "cm-hackout-best-streak";
  var MAX_ATTEMPTS = 3;
  var BRACKET_PLACE_ATTEMPTS = 24;
  var MIN_WORDS_OUTSIDE_DUDS = 4;
  var MIN_WORD_LENGTH = 4;
  var MAX_WORD_LENGTH = 14;
  var MIN_FIELD_WORD_COUNT = 14;
  var MAX_FIELD_WORD_COUNT = 28;
  var FONT_SIZE_MIN = 7;
  var FONT_SIZE_MAX = 22;
  var GRID_RIGHT_EDGE_RESERVE_CHARS = 1.5;

  var PHASE_START = "start";
  var PHASE_PLAYING = "playing";

  var SYMBOL_CHARS = "!@#$%^&*+-=|;:.,?/~`";
  var BRACKET_PAIRS = [
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: "{", close: "}" },
    { open: "<", close: ">" }
  ];

  var DOT_CHAR = ".";
  var CELL_SYMBOL = "symbol";
  var CELL_WORD = "word";
  var CELL_BRACKET = "bracket";
  var CELL_DOT = "dot";

  var terminalEl = document.getElementById("hackTerminal");
  var terminalWrap = document.getElementById("terminalWrap");
  var measureProbe = document.getElementById("hackMeasureProbe");
  var matchDisplay = document.getElementById("matchDisplay");
  var hackLives = document.getElementById("hackLives");
  var attemptsLabel = document.getElementById("attemptsLabel");
  var attemptLogTitle = document.getElementById("attemptLogTitle");
  var attemptLogList = document.getElementById("attemptLogList");
  var scoreValue = document.getElementById("scoreValue");
  var bestValue = document.getElementById("bestValue");
  var scoreLabel = document.getElementById("scoreLabel");
  var bestLabel = document.getElementById("bestLabel");
  var hackTitle = document.getElementById("hackTitle");
  var hackOverlay = document.getElementById("hackOverlay");
  var overlayTitle = document.getElementById("overlayTitle");
  var overlaySub = document.getElementById("overlaySub");
  var gameScreen = document.getElementById("gameScreen");
  var screenTitle = document.getElementById("screenTitle");
  var tutorialHint = document.getElementById("tutorialHint");
  var controlHint = document.getElementById("controlHint");

  var localeWordPool = [];
  var localeSignature = "";
  var passwordWord = "";
  var passwordWordId = "";
  var wordEntries = [];
  var gridCells = [];
  var gridCols = 0;
  var gridRows = 0;
  var gridFontSize = 12;
  var attemptsLeft = MAX_ATTEMPTS;
  var gameEnded = false;
  var gamePhase = PHASE_START;
  var nextWordId = 1;
  var nextBracketPairId = 1;
  var attemptLogSerial = 0;
  var winStreakCurrent = 0;
  var winStreakBest = 0;
  var highlightedElements = [];
  var bracketPairIdByCellIndex = null;
  var bracketRangeByPairId = null;
  var wordHighlightElementsByWordId = null;
  var bracketHighlightElementsByPairId = null;
  var protectedOutsideWordIds = {};

  function getSynth() {
    return window.WebExtrasGameSynthAudio;
  }
  var terminalGridEventsBound = false;
  var lastHoverCellIndex = -1;

  function getLocaleApi() {
    if (window.WebLocale) {
      return window.WebLocale;
    }
    return null;
  }

  function getLocalized(key, fallback) {
    var locale = getLocaleApi();
    if (locale) {
      return locale.get(key, fallback);
    }
    if (fallback != null) {
      return fallback;
    }
    return key;
  }

  function stripRichText(value) {
    var result = value;
    var start = result.indexOf("<");
    while (start >= 0) {
      var end = result.indexOf(">", start);
      if (end < 0) {
        break;
      }
      result = result.substring(0, start) + result.substring(end + 1);
      start = result.indexOf("<");
    }
    return result;
  }

  function isLetterChar(character) {
    if (!character || character.length !== 1) {
      return false;
    }
    try {
      return /\p{L}|\p{M}/u.test(character);
    } catch (error) {
      var code = character.charCodeAt(0);
      return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    }
  }

  function normalizeWord(word) {
    var index;
    var result = "";
    for (index = 0; index < word.length; index++) {
      var character = word.charAt(index);
      if (isLetterChar(character)) {
        result += character;
      }
    }
    if (result.length === 0) {
      return result;
    }
    return result.toUpperCase();
  }

  function addWordToMap(wordMap, word) {
    var normalized = normalizeWord(word);
    var length = normalized.length;
    if (length < MIN_WORD_LENGTH || length > MAX_WORD_LENGTH) {
      return;
    }
    if (!wordMap[length]) {
      wordMap[length] = [];
    }
    var bucket = wordMap[length];
    var index;
    for (index = 0; index < bucket.length; index++) {
      if (bucket[index] === normalized) {
        return;
      }
    }
    bucket.push(normalized);
  }

  function buildLocaleSignature(strings) {
    var keys = Object.keys(strings || {});
    var index;
    var signature = "";
    for (index = 0; index < keys.length; index++) {
      signature += keys[index] + ":";
      signature += strings[keys[index]] + "|";
    }
    return signature;
  }

  function getWordsFromLocale(strings) {
    var wordMap = {};
    var keys = Object.keys(strings || {});
    var keyIndex;
    for (keyIndex = 0; keyIndex < keys.length; keyIndex++) {
      var rawValue = strings[keys[keyIndex]];
      if (rawValue == null) {
        continue;
      }
      var cleaned = stripRichText(String(rawValue));
      var parts = cleaned.split(/[^\p{L}\p{M}]+/u);
      var partIndex;
      for (partIndex = 0; partIndex < parts.length; partIndex++) {
        addWordToMap(wordMap, parts[partIndex]);
      }
    }
    return wordMap;
  }

  function flattenWordMap(wordMap) {
    var flat = [];
    var lengths = Object.keys(wordMap);
    var lengthIndex;
    for (lengthIndex = 0; lengthIndex < lengths.length; lengthIndex++) {
      var bucket = wordMap[lengths[lengthIndex]];
      var wordIndex;
      for (wordIndex = 0; wordIndex < bucket.length; wordIndex++) {
        flat.push(bucket[wordIndex]);
      }
    }
    return flat;
  }

  function pickRandomIndex(maxExclusive) {
    return Math.floor(Math.random() * maxExclusive);
  }

  function shuffleArray(items) {
    var index = items.length - 1;
    while (index > 0) {
      var swapIndex = pickRandomIndex(index + 1);
      var temp = items[index];
      items[index] = items[swapIndex];
      items[swapIndex] = temp;
      index -= 1;
    }
    return items;
  }

  function isBracketDisplayChar(character) {
    var pairIndex;
    for (pairIndex = 0; pairIndex < BRACKET_PAIRS.length; pairIndex++) {
      if (BRACKET_PAIRS[pairIndex].open === character || BRACKET_PAIRS[pairIndex].close === character) {
        return true;
      }
    }
    return false;
  }

  function pickRandomSymbolChar() {
    var character;
    var attempt;
    for (attempt = 0; attempt < 16; attempt++) {
      character = SYMBOL_CHARS.charAt(pickRandomIndex(SYMBOL_CHARS.length));
      if (!isBracketDisplayChar(character)) {
        return character;
      }
    }
    return "!";
  }

  function getFallbackWords() {
    return [
      "TERMINAL",
      "PASSWORD",
      "OVERRIDE",
      "SECURITY",
      "PROTOCOL",
      "DATABASE",
      "MAINFRAME",
      "ENCRYPT",
      "INTRUDE",
      "FIREWALL",
      "PLATFORM",
      "NOTEBOOK",
      "KEYBOARD",
      "COMPILER",
      "FUNCTION",
      "OPERATOR",
      "LOCATION",
      "DOCUMENT",
      "GRAPHICS",
      "HARDWARE",
      "SOFTWARE",
      "DOWNLOAD",
      "UPLOADED",
      "CHECKSUM",
      "BACKDOOR",
      "LOCKDOWN",
      "ACCESS",
      "UNLOCK",
      "SYSTEM",
      "NETWORK",
      "BREACH",
      "LOCKOUT",
      "DECRYPT",
      "MALWARE",
      "ROOTKIT",
      "TERMINAL",
      "RESPONSE",
      "SENTINEL",
      "SURVEIL",
      "INTRUSION",
      "OVERRIDE",
      "COMMAND",
      "EXECUTE",
      "PROGRAM",
      "REGISTER",
      "SEGMENT",
      "POINTER",
      "BUFFER",
      "CHANNEL",
      "CIRCUIT",
      "MODULE",
      "KERNEL",
      "THREAD",
      "PROCESS",
      "PACKET",
      "ROUTER",
      "SWITCH",
      "GATEWAY",
      "HOSTILE",
      "DEFENSE",
      "TACTICAL",
      "WEAPON",
      "ARMORY",
      "VAULT",
      "CIPHER",
      "SIGNAL",
      "STATIC",
      "VECTOR",
      "MATRIX",
      "BINARY",
      "DIGITAL",
      "ANALOG",
      "STORAGE",
      "MEMORY",
      "DISK",
      "DRIVE",
      "SERVER",
      "CLIENT",
      "REMOTE",
      "LOCAL",
      "GLOBAL",
      "SECTOR",
      "SECTOR",
      "STATION",
      "OUTPOST",
      "COLONY",
      "SECTOR",
      "BUNKER",
      "SHELTER",
      "CONTAIN",
      "ISOLATE",
      "QUARANT",
      "PURGE",
      "SANITIZE",
      "SCRUB",
      "FILTER",
      "PARSE",
      "RENDER",
      "SHADER",
      "TEXTURE",
      "VERTEX",
      "COLLIDE",
      "PHYSICS",
      "GRAVITY",
      "MOMENT",
      "ENERGY",
      "PLASMA",
      "FUSION",
      "FISSION",
      "REACTOR",
      "TURBINE",
      "GENERATOR",
      "BATTERY",
      "CHARGE",
      "VOLTAGE",
      "CURRENT",
      "CIRCUIT",
      "COPPER",
      "STEEL",
      "TITAN",
      "CARBON",
      "SILICON",
      "CRYSTAL",
      "MINERAL",
      "RESOURCE",
      "SUPPLY",
      "DEMAND",
      "MARKET",
      "TRADE",
      "CREDIT",
      "DEBIT",
      "ACCOUNT",
      "LEDGER",
      "RECORD",
      "ARCHIVE",
      "BACKUP",
      "RESTORE",
      "RECOVER",
      "REPAIR",
      "UPGRADE",
      "INSTALL",
      "DEPLOY",
      "LAUNCH",
      "ORBIT",
      "ROCKET",
      "SHUTTLE",
      "POD",
      "CRAFT",
      "PILOT",
      "CREW",
      "SQUAD",
      "UNIT",
      "FORCE",
      "STRIKE",
      "ASSAULT",
      "RAID",
      "AMBUSH",
      "FLANK",
      "COVER",
      "RELOAD",
      "AIM",
      "SCOPE",
      "BARREL",
      "TRIGGER",
      "SAFETY",
      "MAGAZINE",
      "AMMO",
      "GRENADE",
      "EXPLOSIVE",
      "DETONATE",
      "FUSE",
      "TIMER",
      "DELAY",
      "SYNC",
      "ALIGN",
      "CALIBRATE",
      "MEASURE",
      "SENSOR",
      "RADAR",
      "SONAR",
      "LIDAR",
      "OPTIC",
      "VISION",
      "DISPLAY",
      "SCREEN",
      "PANEL",
      "BUTTON",
      "INPUT",
      "OUTPUT",
      "STREAM",
      "SOCKET",
      "PORT",
      "ADDRESS",
      "DOMAIN",
      "HOST",
      "NODE",
      "CLUSTER",
      "CLOUD",
      "CACHE",
      "QUEUE",
      "STACK",
      "HEAP",
      "LOGIC",
      "BOOLEAN",
      "INTEGER",
      "FLOAT",
      "DOUBLE",
      "STRING",
      "OBJECT",
      "CLASS",
      "METHOD",
      "FIELD",
      "PROPERTY",
      "EVENT",
      "HANDLER",
      "CALLBACK",
      "ASYNC",
      "AWAIT",
      "PROMISE",
      "FUTURE",
      "PAST",
      "PRESENT",
      "MOMENT",
      "INSTANT",
      "PERIOD",
      "CYCLE",
      "PHASE",
      "STAGE",
      "LEVEL",
      "RANK",
      "SCORE",
      "POINT",
      "BONUS",
      "PENALTY",
      "REWARD",
      "PRIZE",
      "TROPHY",
      "MEDAL",
      "BADGE",
      "TOKEN",
      "COIN",
      "CASH",
      "FUNDS",
      "WEALTH",
      "RICH",
      "POOR",
      "DEBT",
      "LOAN",
      "INTEREST",
      "PROFIT",
      "LOSS",
      "GAIN",
      "RISK",
      "CHANCE",
      "LUCK",
      "FATE",
      "DESTINY",
      "LEGEND",
      "MYTH",
      "LORE",
      "TALE",
      "STORY",
      "QUEST",
      "MISSION",
      "OBJECTIVE",
      "TARGET",
      "GOAL",
      "PLAN",
      "SCHEME",
      "TRICK",
      "TRAP",
      "BAIT",
      "LURE",
      "HOOK",
      "LINE",
      "SINKER",
      "NET",
      "WEB",
      "SPIDER",
      "INSECT",
      "BEAST",
      "CREATURE",
      "MONSTER",
      "DRAGON",
      "DEMON",
      "ANGEL",
      "SPIRIT",
      "GHOST",
      "PHANTOM",
      "SHADOW",
      "DARK",
      "LIGHT",
      "BRIGHT",
      "DIM",
      "GLOW",
      "FLARE",
      "BLAST",
      "SHOCK",
      "WAVE",
      "PULSE",
      "BEAT",
      "RHYTHM",
      "TEMPO",
      "PACE",
      "SPEED",
      "SLOW",
      "FAST",
      "QUICK",
      "RAPID",
      "SWIFT",
      "AGILE",
      "NIMBLE",
      "STEADY",
      "STABLE",
      "SOLID",
      "LIQUID",
      "GAS",
      "STEAM",
      "SMOKE",
      "FIRE",
      "WATER",
      "EARTH",
      "WIND",
      "STORM",
      "RAIN",
      "SNOW",
      "ICE",
      "FROST",
      "HEAT",
      "COLD",
      "WARM",
      "COOL",
      "HOT",
      "CHILL",
      "FREEZE",
      "MELT",
      "BOIL",
      "BURN",
      "ASH",
      "SOOT",
      "DUST",
      "SAND",
      "ROCK",
      "STONE",
      "METAL",
      "GOLD",
      "SILVER",
      "BRONZE",
      "IRON",
      "LEAD",
      "TIN",
      "ZINC",
      "NICKEL",
      "COBALT",
      "CHROME",
      "ALLOY",
      "MIX",
      "BLEND",
      "FUSION",
      "MERGE",
      "SPLIT",
      "BREAK",
      "CRACK",
      "SHATTER",
      "SMASH",
      "CRUSH",
      "GRIND",
      "PULVER",
      "SPLINTER",
      "FRAGMENT",
      "PIECE",
      "PART",
      "WHOLE",
      "TOTAL",
      "SUM",
      "COUNT",
      "NUMBER",
      "DIGIT",
      "ZERO",
      "ONE",
      "TWO",
      "THREE",
      "FOUR",
      "FIVE",
      "SIX",
      "SEVEN",
      "EIGHT",
      "NINE",
      "TEN",
      "ELEVEN",
      "TWELVE"
    ];
  }

  function refreshLocaleWordPool() {
    var strings = {};
    var locale = getLocaleApi();
    if (locale && locale.getStrings) {
      strings = locale.getStrings() || {};
    }
    var signature = buildLocaleSignature(strings);
    if (signature === localeSignature && localeWordPool.length > 0) {
      return false;
    }
    localeSignature = signature;
    var wordMap = getWordsFromLocale(strings);
    localeWordPool = flattenWordMap(wordMap);
    if (localeWordPool.length < MIN_WORD_LENGTH) {
      localeWordPool = getFallbackWords().slice();
    }
    return true;
  }

  function countMatchingLetters(guess, answer) {
    var matchCount = 0;
    var index;
    var limit = guess.length;
    if (answer.length < limit) {
      limit = answer.length;
    }
    for (index = 0; index < limit; index++) {
      var guessChar = guess.charAt(index).toUpperCase();
      var answerChar = answer.charAt(index).toUpperCase();
      if (guessChar === answerChar) {
        matchCount += 1;
      }
    }
    return matchCount;
  }

  function getRoundWordCount() {
    if (wordEntries.length > 0) {
      return wordEntries.length;
    }
    return MIN_FIELD_WORD_COUNT;
  }

  function getMaxWordCountForGrid(totalCells, wordLength) {
    if (wordLength <= 0 || totalCells <= 0) {
      return 0;
    }
    return Math.floor((totalCells + 1) / (wordLength + 1));
  }

  function getTargetFieldWordCount(totalCells, wordLength) {
    var maxFit = getMaxWordCountForGrid(totalCells, wordLength);
    var target = maxFit;
    if (target > MAX_FIELD_WORD_COUNT) {
      target = MAX_FIELD_WORD_COUNT;
    }
    if (target < MIN_FIELD_WORD_COUNT) {
      return maxFit;
    }
    return target;
  }

  function getPreferredWordLengths() {
    var lengths = [];
    var length;
    for (length = MAX_WORD_LENGTH; length >= MIN_WORD_LENGTH; length--) {
      lengths.push(length);
    }
    shuffleArray(lengths);
    return lengths;
  }

  function tryPickWordSetWithPreferredLengths(wordMap) {
    var lengths = getPreferredWordLengths();
    var index;
    var targetLength;
    var bucket;
    for (index = 0; index < lengths.length; index++) {
      targetLength = lengths[index];
      bucket = wordMap[targetLength];
      if (!bucket || bucket.length < targetLength) {
        continue;
      }
      if (tryPickWordSetFromBucket(bucket)) {
        return true;
      }
    }
    return false;
  }

  function findWordWithExactMatchCount(bucket, password, exactCount, usedMap) {
    var candidates = [];
    var index;
    var word;
    for (index = 0; index < bucket.length; index++) {
      word = bucket[index];
      if (usedMap[word]) {
        continue;
      }
      if (countMatchingLetters(word, password) === exactCount) {
        candidates.push(word);
      }
    }
    if (candidates.length === 0) {
      return null;
    }
    return candidates[pickRandomIndex(candidates.length)];
  }

  function findWordWithAtLeastMatchCount(bucket, password, minCount, usedMap) {
    var bestMatch = -1;
    var bestCandidates = [];
    var index;
    var word;
    var matchCount;
    for (index = 0; index < bucket.length; index++) {
      word = bucket[index];
      if (usedMap[word]) {
        continue;
      }
      matchCount = countMatchingLetters(word, password);
      if (matchCount < minCount) {
        continue;
      }
      if (bestMatch < 0 || matchCount < bestMatch) {
        bestMatch = matchCount;
        bestCandidates = [word];
      } else if (matchCount === bestMatch) {
        bestCandidates.push(word);
      }
    }
    if (bestCandidates.length === 0) {
      return null;
    }
    return bestCandidates[pickRandomIndex(bestCandidates.length)];
  }

  function findWordForLadderLevel(bucket, password, level, usedMap) {
    var word = findWordWithExactMatchCount(bucket, password, level, usedMap);
    if (word) {
      return word;
    }
    return findWordWithAtLeastMatchCount(bucket, password, level, usedMap);
  }

  function tryBuildLadderWordSet(bucket, password) {
    var wordLength = password.length;
    var level;
    var used = {};
    var decoys = [];
    var word;
    var selected;
    var decoyIndex;
    if (wordLength < MIN_WORD_LENGTH) {
      return null;
    }
    used[password] = true;
    for (level = 1; level < wordLength; level++) {
      word = findWordForLadderLevel(bucket, password, level, used);
      if (!word) {
        return null;
      }
      used[word] = true;
      decoys.push(word);
    }
    selected = [password];
    for (decoyIndex = 0; decoyIndex < decoys.length; decoyIndex++) {
      selected.push(decoys[decoyIndex]);
    }
    return selected;
  }

  function tryPickWordSetFromAllLengths(wordMap) {
    var lengths = Object.keys(wordMap);
    var lengthIndex;
    var bucket;
    shuffleArray(lengths);
    for (lengthIndex = 0; lengthIndex < lengths.length; lengthIndex++) {
      bucket = wordMap[lengths[lengthIndex]];
      if (!bucket || bucket.length < parseInt(lengths[lengthIndex], 10)) {
        continue;
      }
      if (tryPickWordSetFromBucket(bucket)) {
        return true;
      }
    }
    return false;
  }

  function buildWordMapFromWordList(words) {
    var wordMap = {};
    var index;
    for (index = 0; index < words.length; index++) {
      addWordToMap(wordMap, words[index]);
    }
    return wordMap;
  }

  function buildWordEntriesFromSelection(selected, password) {
    var entryIndex;
    passwordWord = password;
    passwordWordId = "";
    wordEntries = [];
    for (entryIndex = 0; entryIndex < selected.length; entryIndex++) {
      var entryId = "w" + String(nextWordId);
      nextWordId += 1;
      var entry = {
        id: entryId,
        text: selected[entryIndex],
        isPassword: selected[entryIndex] === passwordWord,
        isSpent: false,
        gridStartIndex: -1,
        gridEndIndex: -1
      };
      if (entry.isPassword) {
        passwordWordId = entryId;
      }
      wordEntries.push(entry);
    }
    shuffleArray(wordEntries);
  }

  function addExtraFieldWords(selected, bucket, password) {
    var used = {};
    var candidates = [];
    var index;
    var word;
    var pickIndex;
    for (index = 0; index < selected.length; index++) {
      used[selected[index]] = true;
    }
    for (index = 0; index < bucket.length; index++) {
      word = bucket[index];
      if (used[word]) {
        continue;
      }
      if (countMatchingLetters(word, password) < 1) {
        continue;
      }
      candidates.push(word);
    }
    shuffleArray(candidates);
    pickIndex = 0;
    while (selected.length < MAX_FIELD_WORD_COUNT && pickIndex < candidates.length) {
      selected.push(candidates[pickIndex]);
      used[candidates[pickIndex]] = true;
      pickIndex += 1;
    }
    return selected;
  }

  function getUnusedFieldWordTexts() {
    var wordLength = getWordLength();
    var usedTexts = {};
    var candidates = [];
    var poolIndex;
    var fallbackIndex;
    var word;
    var fallbackWords;
    for (poolIndex = 0; poolIndex < wordEntries.length; poolIndex++) {
      usedTexts[wordEntries[poolIndex].text] = true;
    }
    for (poolIndex = 0; poolIndex < localeWordPool.length; poolIndex++) {
      word = normalizeWord(localeWordPool[poolIndex]);
      if (word.length !== wordLength || usedTexts[word]) {
        continue;
      }
      if (countMatchingLetters(word, passwordWord) < 1) {
        continue;
      }
      usedTexts[word] = true;
      candidates.push(word);
    }
    fallbackWords = getFallbackWords();
    for (fallbackIndex = 0; fallbackIndex < fallbackWords.length; fallbackIndex++) {
      word = normalizeWord(fallbackWords[fallbackIndex]);
      if (word.length !== wordLength || usedTexts[word]) {
        continue;
      }
      if (countMatchingLetters(word, passwordWord) < 1) {
        continue;
      }
      usedTexts[word] = true;
      candidates.push(word);
    }
    return candidates;
  }

  function appendFieldWordEntry(wordText) {
    var entryId = "w" + String(nextWordId);
    nextWordId += 1;
    wordEntries.push({
      id: entryId,
      text: wordText,
      isPassword: false,
      isSpent: false,
      gridStartIndex: -1,
      gridEndIndex: -1
    });
  }

  function ensureFieldWordCount() {
    var totalCells = gridCols * gridRows;
    var wordLength = getWordLength();
    var target;
    var candidates;
    var index;
    if (wordLength <= 0 || totalCells <= 0 || passwordWord.length === 0) {
      return;
    }
    target = getTargetFieldWordCount(totalCells, wordLength);
    if (wordEntries.length >= target) {
      return;
    }
    candidates = getUnusedFieldWordTexts();
    shuffleArray(candidates);
    for (index = 0; index < candidates.length; index++) {
      if (wordEntries.length >= target) {
        break;
      }
      appendFieldWordEntry(candidates[index]);
    }
  }

  function tryPickWordSetFromBucket(bucket) {
    var passwordCandidates = bucket.slice();
    var index;
    var password;
    var selected;
    shuffleArray(passwordCandidates);
    for (index = 0; index < passwordCandidates.length; index++) {
      password = passwordCandidates[index];
      selected = tryBuildLadderWordSet(bucket, password);
      if (!selected) {
        continue;
      }
      selected = addExtraFieldWords(selected, bucket, password);
      buildWordEntriesFromSelection(selected, password);
      return true;
    }
    return false;
  }

  function pickWordsForRound() {
    var wordMap = {};
    var poolIndex;
    for (poolIndex = 0; poolIndex < localeWordPool.length; poolIndex++) {
      addWordToMap(wordMap, localeWordPool[poolIndex]);
    }
    if (tryPickWordSetWithPreferredLengths(wordMap)) {
      return;
    }
    if (tryPickWordSetWithPreferredLengths(buildWordMapFromWordList(getFallbackWords()))) {
      return;
    }
    if (tryPickWordSetFromAllLengths(wordMap)) {
      return;
    }
    if (tryPickWordSetFromAllLengths(buildWordMapFromWordList(getFallbackWords()))) {
      return;
    }
  }

  function getWordEntryById(wordId) {
    var index;
    for (index = 0; index < wordEntries.length; index++) {
      if (wordEntries[index].id === wordId) {
        return wordEntries[index];
      }
    }
    return null;
  }

  function getActiveUselessEntries() {
    var result = [];
    var index;
    for (index = 0; index < wordEntries.length; index++) {
      var entry = wordEntries[index];
      if (!entry.isPassword && !entry.isSpent) {
        result.push(entry);
      }
    }
    return result;
  }

  function getWordLength() {
    if (wordEntries.length > 0) {
      return wordEntries[0].text.length;
    }
    return MIN_WORD_LENGTH;
  }

  function setMatchDisplay(guessWord) {
    var matchCount = countMatchingLetters(guessWord, passwordWord);
    var matchLabel = getLocalized(LOCALE_KEY_MATCH, "MATCH");
    var text = matchLabel + " " + String(matchCount) + "/" + String(passwordWord.length);
    matchDisplay.textContent = text;
    matchDisplay.classList.remove("is-active");
    void matchDisplay.offsetWidth;
    matchDisplay.classList.add("is-active");
  }

  function clearAttemptLog() {
    attemptLogSerial = 0;
    if (attemptLogList) {
      attemptLogList.innerHTML = "";
    }
  }

  function appendAttemptLog(entry, matchCount, isCorrect) {
    var row;
    var indexLabel;
    var wordSpan;
    var matchSpan;
    var wordLength;
    if (!attemptLogList || !entry) {
      return;
    }
    attemptLogSerial += 1;
    wordLength = passwordWord.length;
    row = document.createElement("div");
    row.className = "hack-attempt-row";
    if (isCorrect) {
      row.className += " is-win";
    } else {
      row.className += " is-spent";
    }
    indexLabel = document.createElement("span");
    indexLabel.textContent = "#" + String(attemptLogSerial) + " ";
    row.appendChild(indexLabel);
    wordSpan = document.createElement("span");
    wordSpan.className = "hack-attempt-word";
    wordSpan.textContent = entry.text;
    row.appendChild(wordSpan);
    row.appendChild(document.createTextNode(" "));
    matchSpan = document.createElement("span");
    matchSpan.className = "hack-attempt-match";
    matchSpan.textContent = String(matchCount) + "/" + String(wordLength);
    row.appendChild(matchSpan);
    attemptLogList.appendChild(row);
    attemptLogList.scrollTop = attemptLogList.scrollHeight;
  }

  function setAttemptsHud() {
    hackLives.innerHTML = "";
    var index;
    for (index = 0; index < MAX_ATTEMPTS; index++) {
      var life = document.createElement("span");
      life.className = "hack-life";
      if (index >= attemptsLeft) {
        life.className += " is-spent";
      }
      hackLives.appendChild(life);
    }
  }

  function loadBestStreak() {
    try {
      var stored = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
      if (stored) {
        var parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          winStreakBest = parsed;
        }
      }
    } catch (error) {
      winStreakBest = 0;
    }
  }

  function saveBestStreak() {
    try {
      window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(winStreakBest));
    } catch (error) {
    }
  }

  function setScoreHud() {
    scoreValue.textContent = String(winStreakCurrent);
    bestValue.textContent = String(winStreakBest);
  }

  function recordWin() {
    winStreakCurrent += 1;
    if (winStreakCurrent > winStreakBest) {
      winStreakBest = winStreakCurrent;
      saveBestStreak();
    }
    setScoreHud();
  }

  function recordLockout() {
    winStreakCurrent = 0;
    setScoreHud();
  }

  function isPlaying() {
    return gamePhase === PHASE_PLAYING;
  }

  function isStart() {
    return gamePhase === PHASE_START;
  }

  function getTutorialText() {
    return getLocalized(
      LOCALE_KEY_HINT,
      "Select a password. Brackets remove a dud. Symbols are noise."
    );
  }

  function showStartScreen() {
    gamePhase = PHASE_START;
    if (gameScreen) {
      gameScreen.classList.remove("hidden");
    }
    if (screenTitle) {
      screenTitle.textContent = "HACKOUT";
    }
    if (tutorialHint) {
      tutorialHint.textContent = getTutorialText();
    }
    if (controlHint) {
      controlHint.textContent = getLocalized(
        LOCALE_KEY_CLICK_START,
        "CLICK TO START"
      );
    }
    if (terminalEl) {
      terminalEl.innerHTML = "";
    }
    matchDisplay.textContent = "";
    if (window.WebExtrasGameStartMusicNotify && window.WebExtrasGameStartMusicNotify.notifyStartScreenReady) {
      window.WebExtrasGameStartMusicNotify.notifyStartScreenReady();
    }
  }

  function hideGameScreen() {
    if (gameScreen) {
      gameScreen.classList.add("hidden");
    }
  }

  function startPlaying() {
    if (isPlaying()) {
      return;
    }
    gamePhase = PHASE_PLAYING;
    hideGameScreen();
    refreshLocaleWordPool();
    startNewRound();
    if (window.WebExtrasGameStartMusicNotify && window.WebExtrasGameStartMusicNotify.notifyGameplayStarted) {
      window.WebExtrasGameStartMusicNotify.notifyGameplayStarted();
    }
  }

  function onGameScreenClick(event) {
    if (!isStart()) {
      return;
    }
    event.stopPropagation();
    startPlaying();
  }

  function applyStaticLocale() {
    hackTitle.textContent = "HACKOUT";
    attemptsLabel.textContent = getLocalized(LOCALE_KEY_ATTEMPTS, "ATTEMPTS");
    scoreLabel.textContent = getLocalized(LOCALE_KEY_SCORE, "SCORE");
    bestLabel.textContent = getLocalized(LOCALE_KEY_BEST, "BEST");
    attemptLogTitle.textContent = getLocalized(LOCALE_KEY_ATTEMPT_LOG, "ATTEMPT LOG");
    if (tutorialHint) {
      tutorialHint.textContent = getTutorialText();
    }
    if (isStart() && controlHint) {
      controlHint.textContent = getLocalized(
        LOCALE_KEY_CLICK_START,
        "CLICK TO START"
      );
    }
  }

  function showOverlay(isWin) {
    gameEnded = true;
    hackOverlay.classList.remove("hidden");
    hackOverlay.classList.remove("is-win");
    hackOverlay.classList.remove("is-lose");
    if (isWin) {
      hackOverlay.classList.add("is-win");
      recordWin();
      if (getSynth()) {
        getSynth().playSuccess();
      }
      overlayTitle.textContent = getLocalized(LOCALE_KEY_WIN, "ACCESS GRANTED");
      overlaySub.textContent = getLocalized(
        LOCALE_KEY_WIN_SUB,
        getLocalized(LOCALE_KEY_RETRY, "CLICK TO TRY AGAIN")
      );
    } else {
      hackOverlay.classList.add("is-lose");
      recordLockout();
      if (getSynth()) {
        getSynth().playFail();
      }
      overlayTitle.textContent = getLocalized(LOCALE_KEY_LOSE, "LOCKOUT");
      overlaySub.textContent = getLocalized(
        LOCALE_KEY_LOSE_SUB,
        getLocalized(LOCALE_KEY_RETRY, "CLICK TO TRY AGAIN")
      );
    }
  }

  function hideOverlay() {
    hackOverlay.classList.add("hidden");
    gameEnded = false;
  }

  function setCellAsDot(cell) {
    cell.cellType = CELL_DOT;
    cell.displayChar = DOT_CHAR;
    cell.wordId = "";
    cell.wordCharIndex = -1;
    cell.bracketPairId = -1;
    cell.bracketSide = "";
    if (cell.element) {
      cell.element.textContent = DOT_CHAR;
      cell.element.className = "hack-cell hack-cell-dot";
    }
  }

  function dotCellRange(startIndex, endIndex) {
    var index;
    for (index = startIndex; index <= endIndex; index++) {
      if (gridCells[index]) {
        setCellAsDot(gridCells[index]);
      }
    }
  }

  function getWordCellRange(entry) {
    if (entry.gridStartIndex >= 0 && entry.gridEndIndex >= entry.gridStartIndex) {
      return { startIndex: entry.gridStartIndex, endIndex: entry.gridEndIndex };
    }
    var minIndex = -1;
    var maxIndex = -1;
    var index;
    for (index = 0; index < gridCells.length; index++) {
      if (gridCells[index].wordId !== entry.id) {
        continue;
      }
      if (minIndex < 0 || index < minIndex) {
        minIndex = index;
      }
      if (index > maxIndex) {
        maxIndex = index;
      }
    }
    if (minIndex < 0) {
      return null;
    }
    return { startIndex: minIndex, endIndex: maxIndex };
  }

  function isProtectedOutsideWord(entry) {
    if (!entry || !entry.id) {
      return false;
    }
    return protectedOutsideWordIds[entry.id] === true;
  }

  function setProtectedOutsideWords(wordStarts, wordLength, placedRanges) {
    var index;
    var entry;
    var wordStart;
    var wordEnd;
    var rangeIndex;
    var bracketRange;
    var inside;
    protectedOutsideWordIds = {};
    for (index = 0; index < wordEntries.length; index++) {
      entry = wordEntries[index];
      if (!entry) {
        continue;
      }
      wordStart = wordStarts[index];
      wordEnd = wordStart + wordLength - 1;
      inside = false;
      for (rangeIndex = 0; rangeIndex < placedRanges.length; rangeIndex++) {
        bracketRange = placedRanges[rangeIndex];
        if (wordOverlapsBracketRange(wordStart, wordEnd, bracketRange.startIndex, bracketRange.endIndex)) {
          inside = true;
          break;
        }
      }
      if (!inside) {
        protectedOutsideWordIds[entry.id] = true;
      }
    }
  }

  function spendWordsInRange(startIndex, endIndex) {
    var wordIds = getWordIdsInCellRange(startIndex, endIndex);
    var entries = getEntriesFromWordIds(wordIds);
    var index;
    for (index = 0; index < entries.length; index++) {
      if (isProtectedOutsideWord(entries[index])) {
        continue;
      }
      entries[index].isSpent = true;
    }
  }

  function dotWordOnly(entry) {
    var wordRange = getWordCellRange(entry);
    if (!wordRange) {
      return;
    }
    dotCellRange(wordRange.startIndex, wordRange.endIndex);
  }

  function markWordSpent(entry) {
    entry.isSpent = true;
    dotWordOnly(entry);
  }

  function dotBracketScope(pairId) {
    var range = getBracketCellRange(pairId);
    var index;
    var cell;
    var entry;
    if (!range) {
      return;
    }
    spendWordsInRange(range.startIndex, range.endIndex);
    for (index = range.startIndex; index <= range.endIndex; index++) {
      cell = gridCells[index];
      if (!cell) {
        continue;
      }
      if (cell.cellType === CELL_WORD && cell.wordId) {
        entry = getWordEntryById(cell.wordId);
        if (entry && isProtectedOutsideWord(entry)) {
          continue;
        }
      }
      setCellAsDot(cell);
    }
  }

  function checkWinOrLose() {
    if (attemptsLeft <= 0) {
      showOverlay(false);
    }
  }

  function onWordClick(entry) {
    var matchCount;
    if (!isPlaying() || gameEnded || entry.isSpent) {
      return;
    }
    matchCount = countMatchingLetters(entry.text, passwordWord);
    setMatchDisplay(entry.text);
    appendAttemptLog(entry, matchCount, entry.isPassword);
    if (entry.isPassword) {
      markWordSpent(entry);
      showOverlay(true);
      return;
    }
    attemptsLeft -= 1;
    markWordSpent(entry);
    if (getSynth()) {
      getSynth().playError();
    }
    setAttemptsHud();
    checkWinOrLose();
  }

  function getWordIdsInCellRange(startIndex, endIndex) {
    var ids = [];
    var seen = {};
    var index;
    for (index = startIndex; index <= endIndex; index++) {
      var cell = gridCells[index];
      if (!cell || !cell.wordId) {
        continue;
      }
      if (!seen[cell.wordId]) {
        seen[cell.wordId] = true;
        ids.push(cell.wordId);
      }
    }
    return ids;
  }

  function getEntriesFromWordIds(wordIds) {
    var result = [];
    var idIndex;
    for (idIndex = 0; idIndex < wordIds.length; idIndex++) {
      var entry = getWordEntryById(wordIds[idIndex]);
      if (entry) {
        result.push(entry);
      }
    }
    return result;
  }

  function pickEntryNotInList(candidates, excludeList) {
    var filtered = [];
    var index;
    for (index = 0; index < candidates.length; index++) {
      var entry = candidates[index];
      var excluded = false;
      var excludeIndex;
      for (excludeIndex = 0; excludeIndex < excludeList.length; excludeIndex++) {
        if (excludeList[excludeIndex].id === entry.id) {
          excluded = true;
          break;
        }
      }
      if (!excluded) {
        filtered.push(entry);
      }
    }
    if (filtered.length === 0) {
      return null;
    }
    return filtered[pickRandomIndex(filtered.length)];
  }

  function onBracketClick(pairId) {
    var range;
    var startIndex;
    var endIndex;
    var wordIds;
    var entries;
    var index;
    var passwordEntry;
    var uselessInRange;
    var index;
    if (!isPlaying() || gameEnded) {
      return;
    }
    if (getSynth()) {
      getSynth().playTerminalBlip();
    }
    range = getBracketCellRange(pairId);
    if (!range) {
      return;
    }
    startIndex = range.startIndex;
    endIndex = range.endIndex;
    wordIds = getWordIdsInCellRange(startIndex, endIndex);
    entries = getEntriesFromWordIds(wordIds);
    passwordEntry = null;
    uselessInRange = [];
    for (index = 0; index < entries.length; index++) {
      if (entries[index].isPassword) {
        passwordEntry = entries[index];
      } else if (!entries[index].isSpent) {
        uselessInRange.push(entries[index]);
      }
    }
    if (passwordEntry && !passwordEntry.isSpent) {
      passwordEntry.isSpent = true;
      dotBracketScope(pairId);
      showOverlay(true);
      return;
    }
    dotBracketScope(pairId);
    for (index = 0; index < entries.length; index++) {
      if (entries[index].isSpent || isProtectedOutsideWord(entries[index])) {
        continue;
      }
      entries[index].isSpent = true;
    }
  }

  function getBracketCellRange(pairId) {
    var cached;
    var openIndex = -1;
    var closeIndex = -1;
    var index;
    if (bracketRangeByPairId) {
      cached = bracketRangeByPairId[pairId];
      if (cached) {
        return cached;
      }
    }
    for (index = 0; index < gridCells.length; index++) {
      if (gridCells[index].cellType !== CELL_BRACKET || gridCells[index].bracketPairId !== pairId) {
        continue;
      }
      if (gridCells[index].bracketSide === "open") {
        openIndex = index;
      } else if (gridCells[index].bracketSide === "close") {
        closeIndex = index;
      }
    }
    if (openIndex < 0 || closeIndex < 0 || closeIndex <= openIndex) {
      return null;
    }
    return { startIndex: openIndex, endIndex: closeIndex };
  }

  function getBracketPairIdForCellIndex(cellIndex) {
    if (!bracketPairIdByCellIndex || cellIndex < 0 || cellIndex >= bracketPairIdByCellIndex.length) {
      return -1;
    }
    return bracketPairIdByCellIndex[cellIndex];
  }

  function clearHighlights() {
    var index;
    for (index = 0; index < highlightedElements.length; index++) {
      highlightedElements[index].classList.remove("is-highlight");
    }
    highlightedElements.length = 0;
  }

  function highlightCellElement(element) {
    if (!element || element.classList.contains("is-highlight")) {
      return;
    }
    element.classList.add("is-highlight");
    highlightedElements.push(element);
  }

  function highlightWordCells(wordId) {
    var elements = wordHighlightElementsByWordId ? wordHighlightElementsByWordId[wordId] : null;
    var index;
    if (!elements) {
      return;
    }
    for (index = 0; index < elements.length; index++) {
      highlightCellElement(elements[index]);
    }
  }

  function highlightBracketPairCells(pairId) {
    var range = getBracketCellRange(pairId);
    var openCell;
    var closeCell;
    if (!range) {
      return;
    }
    openCell = gridCells[range.startIndex];
    if (openCell && openCell.cellType !== CELL_DOT && openCell.element) {
      highlightCellElement(openCell.element);
    }
    closeCell = gridCells[range.endIndex];
    if (closeCell && closeCell.cellType !== CELL_DOT && closeCell.element) {
      highlightCellElement(closeCell.element);
    }
  }

  function getBracketPairIdContainingWord(wordId) {
    var entry = getWordEntryById(wordId);
    var wordRange;
    if (!entry) {
      return -1;
    }
    wordRange = getWordCellRange(entry);
    if (!wordRange) {
      return -1;
    }
    return getBracketPairIdForCellIndex(wordRange.startIndex);
  }

  function rebuildGridLookups() {
    var index;
    var pairId;
    var range;
    var cell;
    var wordId;
    var openIndex;
    var closeIndex;
    bracketPairIdByCellIndex = [];
    bracketRangeByPairId = {};
    wordHighlightElementsByWordId = {};
    bracketHighlightElementsByPairId = {};
    for (index = 0; index < gridCells.length; index++) {
      bracketPairIdByCellIndex[index] = -1;
    }
    for (pairId = 1; pairId < nextBracketPairId; pairId++) {
      openIndex = -1;
      closeIndex = -1;
      for (index = 0; index < gridCells.length; index++) {
        cell = gridCells[index];
        if (cell.cellType !== CELL_BRACKET || cell.bracketPairId !== pairId) {
          continue;
        }
        if (cell.bracketSide === "open") {
          openIndex = index;
        } else if (cell.bracketSide === "close") {
          closeIndex = index;
        }
      }
      if (openIndex < 0 || closeIndex < 0 || closeIndex <= openIndex) {
        continue;
      }
      range = { startIndex: openIndex, endIndex: closeIndex };
      bracketRangeByPairId[pairId] = range;
      for (index = range.startIndex; index <= range.endIndex; index++) {
        bracketPairIdByCellIndex[index] = pairId;
      }
    }
    for (index = 0; index < gridCells.length; index++) {
      cell = gridCells[index];
      if (!cell || !cell.element) {
        continue;
      }
      if (cell.cellType === CELL_BRACKET) {
        pairId = cell.bracketPairId;
        if (!bracketHighlightElementsByPairId[pairId]) {
          bracketHighlightElementsByPairId[pairId] = [];
        }
        bracketHighlightElementsByPairId[pairId].push(cell.element);
      }
      wordId = cell.wordId;
      if (wordId) {
        if (!wordHighlightElementsByWordId[wordId]) {
          wordHighlightElementsByWordId[wordId] = [];
        }
        wordHighlightElementsByWordId[wordId].push(cell.element);
      }
    }
  }

  function onCellPointerEnter(cell) {
    var bracketPairId;
    clearHighlights();
    if (cell.cellType === CELL_DOT) {
      return;
    }
    if (cell.cellType === CELL_SYMBOL) {
      highlightCellElement(cell.element);
      bracketPairId = getBracketPairIdForCellIndex(cell.cellIndex);
      if (bracketPairId >= 0) {
        highlightBracketPairCells(bracketPairId);
      }
      return;
    }
    if (cell.cellType === CELL_WORD) {
      highlightWordCells(cell.wordId);
      bracketPairId = getBracketPairIdContainingWord(cell.wordId);
      if (bracketPairId >= 0) {
        highlightBracketPairCells(bracketPairId);
      }
      return;
    }
    if (cell.cellType === CELL_BRACKET) {
      highlightBracketPairCells(cell.bracketPairId);
    }
  }

  function onCellPointerLeave() {
    lastHoverCellIndex = -1;
    clearHighlights();
  }

  function onCellClick(cell) {
    var entry;
    if (!isPlaying() || gameEnded) {
      return;
    }
    if (cell.cellType === CELL_DOT) {
      return;
    }
    if (cell.cellType === CELL_WORD) {
      entry = getWordEntryById(cell.wordId);
      if (entry) {
        onWordClick(entry);
      }
      return;
    }
    if (cell.cellType === CELL_BRACKET) {
      onBracketClick(cell.bracketPairId);
    }
  }

  function measureFontMetrics(fontSize) {
    measureProbe.style.fontSize = String(fontSize) + "px";
    var charWidth = measureProbe.offsetWidth;
    if (charWidth < 1) {
      charWidth = fontSize * 0.6;
    }
    return { charWidth: charWidth, lineHeight: fontSize };
  }

  function applyTerminalFontSize(fontSize) {
    if (!terminalEl) {
      return;
    }
    terminalEl.style.fontSize = String(fontSize) + "px";
  }

  function getGridLayoutSize(wrapSize, metrics) {
    var widthReserve = Math.ceil(metrics.charWidth * GRID_RIGHT_EDGE_RESERVE_CHARS);
    return {
      width: Math.max(metrics.charWidth, wrapSize.width - widthReserve),
      height: wrapSize.height
    };
  }

  function expandGridCountsToFillWrap(wrapSize, metrics, fontSize, minCells, cols, rows) {
    var layoutSize = getGridLayoutSize(wrapSize, metrics);
    var maxRows = Math.max(1, Math.floor(layoutSize.height / fontSize));
    var maxCols = Math.max(1, Math.floor(layoutSize.width / metrics.charWidth));
    while ((maxRows + 1) * fontSize <= layoutSize.height) {
      maxRows += 1;
    }
    while ((maxCols + 1) * metrics.charWidth <= layoutSize.width) {
      maxCols += 1;
    }
    if (maxRows > rows) {
      rows = maxRows;
    }
    if (maxCols > cols) {
      cols = maxCols;
    }
    if (cols * rows < minCells) {
      rows = Math.max(rows, Math.ceil(minCells / cols));
    }
    return { cols: cols, rows: rows };
  }

  function getWrapSize() {
    var rect = terminalWrap.getBoundingClientRect();
    return {
      width: Math.max(0, Math.floor(rect.width)),
      height: Math.max(0, Math.floor(rect.height))
    };
  }

  function computeGridDimensions() {
    var wrapSize = getWrapSize();
    var wordLength = getWordLength();
    var fontSize;
    var bestCols = 0;
    var bestRows = 0;
    var bestFontSize = FONT_SIZE_MIN;
    var metrics;
    var layoutSize;
    var cols;
    var rows;
    var totalCells;
    var roundWordCount = getRoundWordCount();
    var minCells = roundWordCount * wordLength + roundWordCount + 8;
    for (fontSize = FONT_SIZE_MAX; fontSize >= FONT_SIZE_MIN; fontSize -= 1) {
      metrics = measureFontMetrics(fontSize);
      layoutSize = getGridLayoutSize(wrapSize, metrics);
      cols = Math.max(1, Math.floor(layoutSize.width / metrics.charWidth));
      rows = Math.max(1, Math.floor(layoutSize.height / metrics.lineHeight));
      totalCells = cols * rows;
      if (totalCells >= minCells) {
        bestCols = cols;
        bestRows = rows;
        bestFontSize = fontSize;
        break;
      }
    }
    if (bestCols === 0) {
      metrics = measureFontMetrics(FONT_SIZE_MIN);
      bestFontSize = FONT_SIZE_MIN;
      layoutSize = getGridLayoutSize(wrapSize, metrics);
      bestCols = Math.max(1, Math.floor(layoutSize.width / metrics.charWidth));
      bestRows = Math.max(1, Math.floor(layoutSize.height / metrics.lineHeight));
    }
    metrics = measureFontMetrics(bestFontSize);
    var expandedGrid = expandGridCountsToFillWrap(
      wrapSize,
      metrics,
      bestFontSize,
      minCells,
      bestCols,
      bestRows
    );
    gridCols = expandedGrid.cols;
    gridRows = expandedGrid.rows;
    gridFontSize = bestFontSize;
    terminalEl.style.gridTemplateColumns = "repeat(" + String(gridCols) + ", 1ch)";
  }

  function buildRandomGaps(slack, gapCount, minEach) {
    var gaps = [];
    var index;
    var minimumTotal = gapCount * minEach;
    if (slack < minimumTotal) {
      minEach = 0;
      minimumTotal = 0;
    }
    var extra = slack - minimumTotal;
    for (index = 0; index < gapCount; index++) {
      gaps[index] = minEach;
    }
    if (extra <= 0) {
      return gaps;
    }
    var endBonusMin = Math.floor(extra * 0.28);
    var endBonusRange = Math.floor(extra * 0.42) - endBonusMin;
    if (endBonusRange < 0) {
      endBonusRange = 0;
    }
    var endBonus = endBonusMin;
    if (endBonusRange > 0) {
      endBonus += pickRandomIndex(endBonusRange + 1);
    }
    if (endBonus > extra) {
      endBonus = extra;
    }
    gaps[gapCount - 1] += endBonus;
    var rest = extra - endBonus;
    for (index = 0; index < rest; index++) {
      gaps[pickRandomIndex(gapCount)] += 1;
    }
    return gaps;
  }

  function getPackedWordStartIndices(totalCells, wordLength, wordCount) {
    var starts = [];
    var previousEnd = -1;
    var freeSpace = totalCells - wordCount * wordLength;
    var index;
    var start;
    if (freeSpace < wordCount) {
      freeSpace = wordCount;
    }
    for (index = 0; index < wordCount; index++) {
      start = Math.floor((index + 1) * freeSpace / (wordCount + 1)) + index * wordLength;
      if (start <= previousEnd) {
        start = previousEnd + 1;
      }
      if (start + wordLength > totalCells) {
        start = Math.max(previousEnd + 1, totalCells - (wordCount - index) * wordLength);
      }
      if (start < 0) {
        start = 0;
      }
      starts.push(start);
      previousEnd = start + wordLength - 1;
    }
    return starts;
  }

  function wordStartsOverlap(starts, wordLength) {
    var index;
    for (index = 1; index < starts.length; index++) {
      if (starts[index] < starts[index - 1] + wordLength) {
        return true;
      }
    }
    return false;
  }

  function getRandomWordStartIndices(totalCells, wordLength, wordCount) {
    var starts = [];
    var gapCount = wordCount + 1;
    var minGap = 1;
    var slack = totalCells - wordCount * wordLength;
    var gaps;
    var cursor;
    var wordIndex;
    var index;
    var minStart;
    if (slack < gapCount * minGap) {
      minGap = 0;
    }
    if (slack < 0) {
      return getPackedWordStartIndices(totalCells, wordLength, wordCount);
    }
    gaps = buildRandomGaps(slack, gapCount, minGap);
    cursor = gaps[0];
    for (wordIndex = 0; wordIndex < wordCount; wordIndex++) {
      if (wordIndex > 0) {
        minStart = starts[wordIndex - 1] + wordLength + minGap;
        if (cursor < minStart) {
          cursor = minStart;
        }
      }
      if (cursor + wordLength > totalCells) {
        return getPackedWordStartIndices(totalCells, wordLength, wordCount);
      }
      starts.push(cursor);
      cursor += wordLength + gaps[wordIndex + 1];
    }
    for (index = 1; index < starts.length; index++) {
      minStart = starts[index - 1] + wordLength + minGap;
      if (starts[index] < minStart) {
        starts[index] = minStart;
      }
    }
    if (starts[starts.length - 1] + wordLength > totalCells || wordStartsOverlap(starts, wordLength)) {
      return getPackedWordStartIndices(totalCells, wordLength, wordCount);
    }
    return starts;
  }

  function createEmptyCell() {
    return {
      cellType: CELL_SYMBOL,
      displayChar: pickRandomSymbolChar(),
      wordId: "",
      wordCharIndex: -1,
      bracketPairId: -1,
      bracketSide: "",
      element: null
    };
  }

  function placeWordAtIndex(cells, startIndex, entry) {
    var charIndex;
    var text = entry.text;
    for (charIndex = 0; charIndex < text.length; charIndex++) {
      var cell = cells[startIndex + charIndex];
      if (!cell) {
        continue;
      }
      if (entry.isSpent) {
        cell.cellType = CELL_DOT;
        cell.displayChar = DOT_CHAR;
        cell.wordId = "";
        cell.wordCharIndex = -1;
        continue;
      }
      cell.cellType = CELL_WORD;
      cell.displayChar = text.charAt(charIndex);
      cell.wordId = entry.id;
      cell.wordCharIndex = charIndex;
    }
  }

  function placeBracketPairAt(cells, openIndex, closeIndex, pair) {
    var pairId = nextBracketPairId;
    nextBracketPairId += 1;
    cells[openIndex].cellType = CELL_BRACKET;
    cells[openIndex].displayChar = pair.open;
    cells[openIndex].bracketPairId = pairId;
    cells[openIndex].bracketSide = "open";
    cells[closeIndex].cellType = CELL_BRACKET;
    cells[closeIndex].displayChar = pair.close;
    cells[closeIndex].bracketPairId = pairId;
    cells[closeIndex].bracketSide = "close";
    return true;
  }

  function wordOverlapsBracketRange(wordStart, wordEnd, bracketStart, bracketEnd) {
    return wordStart <= bracketEnd && wordEnd >= bracketStart;
  }

  function getWordsOutsideDudCount(wordStarts, wordLength, placedRanges) {
    var outsideCount = 0;
    var passwordOutside = false;
    var index;
    var entry;
    var wordStart;
    var wordEnd;
    var rangeIndex;
    var bracketRange;
    var inside;
    for (index = 0; index < wordEntries.length; index++) {
      entry = wordEntries[index];
      if (!entry || entry.isSpent) {
        continue;
      }
      wordStart = wordStarts[index];
      wordEnd = wordStart + wordLength - 1;
      inside = false;
      for (rangeIndex = 0; rangeIndex < placedRanges.length; rangeIndex++) {
        bracketRange = placedRanges[rangeIndex];
        if (wordOverlapsBracketRange(wordStart, wordEnd, bracketRange.startIndex, bracketRange.endIndex)) {
          inside = true;
          break;
        }
      }
      if (!inside) {
        outsideCount += 1;
        if (entry.isPassword) {
          passwordOutside = true;
        }
      }
    }
    if (!passwordOutside) {
      return 0;
    }
    return outsideCount;
  }

  function canPlaceBracketRange(wordStarts, wordLength, placedRanges, openIndex, closeIndex) {
    var trialRanges = placedRanges.slice();
    trialRanges.push({ startIndex: openIndex, endIndex: closeIndex });
    return getWordsOutsideDudCount(wordStarts, wordLength, trialRanges) >= MIN_WORDS_OUTSIDE_DUDS;
  }

  function tryPlaceBracketInFillerForDud(cells, wordIndex, wordStarts, wordLength, pair, placedRanges) {
    var wordStart = wordStarts[wordIndex];
    var wordEnd = wordStart + wordLength - 1;
    var gapStart = 0;
    var gapEnd = cells.length - 1;
    var openCandidates = [];
    var closeCandidates = [];
    var index;
    var attempt;
    var openIndex;
    var closeIndex;
    if (wordIndex > 0) {
      gapStart = wordStarts[wordIndex - 1] + wordLength;
    }
    if (wordIndex < wordStarts.length - 1) {
      gapEnd = wordStarts[wordIndex + 1] - 1;
    }
    for (index = gapStart; index <= gapEnd; index++) {
      if (cells[index].cellType !== CELL_SYMBOL) {
        continue;
      }
      if (index < wordStart) {
        openCandidates.push(index);
      }
      if (index > wordEnd) {
        closeCandidates.push(index);
      }
    }
    if (openCandidates.length === 0 || closeCandidates.length === 0) {
      return false;
    }
    for (attempt = 0; attempt < BRACKET_PLACE_ATTEMPTS; attempt++) {
      openIndex = openCandidates[pickRandomIndex(openCandidates.length)];
      closeIndex = closeCandidates[pickRandomIndex(closeCandidates.length)];
      if (closeIndex <= openIndex) {
        continue;
      }
      if (!canPlaceBracketRange(wordStarts, wordLength, placedRanges, openIndex, closeIndex)) {
        continue;
      }
      placeBracketPairAt(cells, openIndex, closeIndex, pair);
      placedRanges.push({ startIndex: openIndex, endIndex: closeIndex });
      return true;
    }
    return false;
  }

  function insertBracketPairs(cells, wordStarts, wordLength) {
    var dudWordIndices = [];
    var placedRanges = [];
    var index;
    var pairIndex;
    var dudWordIndex;
    var entry;
    var pair;
    var pairTypeIndex;
    for (index = 0; index < wordStarts.length; index++) {
      entry = wordEntries[index];
      if (!entry || entry.isPassword) {
        continue;
      }
      dudWordIndices.push(index);
    }
    if (dudWordIndices.length === 0) {
      return;
    }
    shuffleArray(dudWordIndices);
    pairTypeIndex = 0;
    for (pairIndex = 0; pairIndex < dudWordIndices.length; pairIndex++) {
      dudWordIndex = dudWordIndices[pairIndex];
      entry = wordEntries[dudWordIndex];
      if (!entry || entry.isSpent) {
        continue;
      }
      pair = BRACKET_PAIRS[pairTypeIndex % BRACKET_PAIRS.length];
      pairTypeIndex += 1;
      if (tryPlaceBracketInFillerForDud(cells, dudWordIndex, wordStarts, wordLength, pair, placedRanges)) {
        continue;
      }
      pair = BRACKET_PAIRS[pickRandomIndex(BRACKET_PAIRS.length)];
      tryPlaceBracketInFillerForDud(cells, dudWordIndex, wordStarts, wordLength, pair, placedRanges);
    }
    setProtectedOutsideWords(wordStarts, wordLength, placedRanges);
  }

  function fillTrailingFillerSymbols(cells, wordStarts, wordLength) {
    var contentEnd = 0;
    var tailFillMin;
    var fillStart;
    var index;
    var cell;
    for (index = 0; index < wordStarts.length; index++) {
      var wordEnd = wordStarts[index] + wordLength - 1;
      if (wordEnd + 1 > contentEnd) {
        contentEnd = wordEnd + 1;
      }
    }
    tailFillMin = Math.max(8, Math.floor(cells.length * 0.14));
    fillStart = contentEnd;
    if (cells.length - fillStart < tailFillMin) {
      fillStart = cells.length - tailFillMin;
    }
    if (fillStart < 0) {
      fillStart = 0;
    }
    for (index = fillStart; index < cells.length; index++) {
      cell = cells[index];
      if (!cell || cell.cellType === CELL_WORD) {
        continue;
      }
      cell.cellType = CELL_SYMBOL;
      cell.displayChar = pickRandomSymbolChar();
      cell.wordId = "";
      cell.wordCharIndex = -1;
      cell.bracketPairId = -1;
      cell.bracketSide = "";
    }
  }

  function buildGridCells() {
    var totalCells = gridCols * gridRows;
    var wordLength = getWordLength();
    var cells = [];
    var index;
    var starts;
    var wordIndex;
    for (index = 0; index < totalCells; index++) {
      cells.push(createEmptyCell());
    }
    starts = getRandomWordStartIndices(totalCells, wordLength, wordEntries.length);
    for (wordIndex = 0; wordIndex < wordEntries.length; wordIndex++) {
      wordEntries[wordIndex].gridStartIndex = starts[wordIndex];
      wordEntries[wordIndex].gridEndIndex = starts[wordIndex] + wordLength - 1;
      placeWordAtIndex(cells, starts[wordIndex], wordEntries[wordIndex]);
    }
    fillTrailingFillerSymbols(cells, starts, wordLength);
    insertBracketPairs(cells, starts, wordLength);
    return cells;
  }

  function bindCellElement(cell, cellIndex) {
    var span = document.createElement("span");
    span.className = "hack-cell";
    span.textContent = cell.displayChar;
    if (cell.cellType === CELL_DOT) {
      span.className += " hack-cell-dot";
    } else if (cell.cellType === CELL_WORD) {
      span.className += " hack-cell-word";
    }
    cell.element = span;
    cell.cellIndex = cellIndex;
    span.setAttribute("data-cell-index", String(cellIndex));
    return span;
  }

  function getCellFromEventTarget(target) {
    var indexValue;
    while (target && target !== terminalEl) {
      if (target.getAttribute) {
        indexValue = target.getAttribute("data-cell-index");
        if (indexValue != null) {
          return gridCells[parseInt(indexValue, 10)];
        }
      }
      target = target.parentElement;
    }
    return null;
  }

  function onTerminalMouseOver(event) {
    var cell = getCellFromEventTarget(event.target);
    if (!cell || cell.cellIndex === lastHoverCellIndex) {
      return;
    }
    lastHoverCellIndex = cell.cellIndex;
    onCellPointerEnter(cell);
  }

  function onTerminalMouseOut(event) {
    if (!getCellFromEventTarget(event.relatedTarget)) {
      onCellPointerLeave();
    }
  }

  function onTerminalClick(event) {
    var cell = getCellFromEventTarget(event.target);
    if (!cell) {
      return;
    }
    event.preventDefault();
    onCellClick(cell);
  }

  function bindTerminalGridEvents() {
    if (terminalGridEventsBound || !terminalEl) {
      return;
    }
    terminalGridEventsBound = true;
    terminalEl.addEventListener("mouseover", onTerminalMouseOver);
    terminalEl.addEventListener("mouseout", onTerminalMouseOut);
    terminalEl.addEventListener("click", onTerminalClick);
  }

  function getProtectedOutsideWordCount() {
    var count = 0;
    var wordId;
    for (wordId in protectedOutsideWordIds) {
      if (protectedOutsideWordIds[wordId]) {
        count += 1;
      }
    }
    return count;
  }

  function renderGrid() {
    var index;
    var fragment;
    var beforeCount;
    var retry;
    computeGridDimensions();
    beforeCount = wordEntries.length;
    ensureFieldWordCount();
    if (wordEntries.length !== beforeCount) {
      computeGridDimensions();
    }
    applyTerminalFontSize(gridFontSize);
    clearHighlights();
    for (retry = 0; retry < 8; retry++) {
      nextBracketPairId = 1;
      gridCells = buildGridCells();
      if (getProtectedOutsideWordCount() >= MIN_WORDS_OUTSIDE_DUDS) {
        break;
      }
    }
    fragment = document.createDocumentFragment();
    for (index = 0; index < gridCells.length; index++) {
      fragment.appendChild(bindCellElement(gridCells[index], index));
    }
    terminalEl.innerHTML = "";
    terminalEl.appendChild(fragment);
    rebuildGridLookups();
    bindTerminalGridEvents();
  }

  function rerollLevelKeepLives() {
    hideOverlay();
    matchDisplay.textContent = "";
    clearAttemptLog();
    nextBracketPairId = 1;
    pickWordsForRound();
    renderGrid();
  }

  function startNewRound() {
    if (getSynth()) {
      getSynth().playGameStart();
    }
    attemptsLeft = MAX_ATTEMPTS;
    setAttemptsHud();
    rerollLevelKeepLives();
  }

  function onLocaleApplied() {
    refreshLocaleWordPool();
    applyStaticLocale();
  }

  function onOverlayClick() {
    if (!gameEnded) {
      return;
    }
    startNewRound();
  }

  function bindEvents() {
    window.addEventListener("web-locale-applied", onLocaleApplied);
    hackOverlay.addEventListener("click", onOverlayClick);
    if (gameScreen) {
      gameScreen.addEventListener("click", onGameScreenClick);
    }
  }

  function init() {
    bindEvents();
    loadBestStreak();
    winStreakCurrent = 0;
    applyStaticLocale();
    refreshLocaleWordPool();
    attemptsLeft = MAX_ATTEMPTS;
    setAttemptsHud();
    setScoreHud();
    showStartScreen();
  }

  init();
})();
