const fs = require("fs");
const path = require("path");

const webUiRoot = path.join(__dirname, "..");
const assetsRoot = path.join(webUiRoot, "..", "..");
const localizationDir = path.join(webUiRoot, "Localization");
const scanRoots = [
  path.join(webUiRoot, "Web Main Menu"),
  path.join(webUiRoot, "Web Game HUD"),
  path.join(assetsRoot, "DreamingSaints"),
  path.join(assetsRoot, "DreamingSaintsV2")
];

const keyPatterns = [
  /data-locale-key=["']([^"']+)["']/g,
  /data-locale-placeholder=["']([^"']+)["']/g,
  /data-locale-aria-label=["']([^"']+)["']/g,
  /LOCALE_KEY_[A-Z0-9_]+\s*=\s*["']([^"']+)["']/g,
  /getLocalized\(\s*["']([^"']+)["']/g,
  /WebLocale\.get\(\s*["']([^"']+)["']/g,
  /labelKey:\s*["']([^"']+)["']/g,
  /titleKey:\s*["']([^"']+)["']/g,
  /SaintLocalizationManager\.Get\(\s*["']([^"']+)["']/g,
  /^\s*["']([^"']+)["'],?\s*$/gm
];

function shouldScanFile(filePath) {
  if (filePath.includes(path.sep + "Localization" + path.sep)) {
    return false;
  }
  if (filePath.endsWith(".json") && filePath.includes("Localization")) {
    return false;
  }
  return (
    filePath.endsWith(".js") ||
    filePath.endsWith(".html") ||
    filePath.endsWith(".cs")
  );
}

function walkFiles(dirPath, output) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  var entries = fs.readdirSync(dirPath, { withFileTypes: true });
  var index = 0;
  for (index = 0; index < entries.length; index += 1) {
    var entry = entries[index];
    var fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "Localization" || entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }
      walkFiles(fullPath, output);
      continue;
    }
    if (shouldScanFile(fullPath)) {
      output.push(fullPath);
    }
  }
}

function collectReferencedKeys(text) {
  var keys = [];
  var patternIndex = 0;
  for (patternIndex = 0; patternIndex < keyPatterns.length; patternIndex += 1) {
    var pattern = keyPatterns[patternIndex];
    var match = pattern.exec(text);
    while (match) {
      keys.push(match[1]);
      match = pattern.exec(text);
    }
    pattern.lastIndex = 0;
  }
  return keys;
}

var sourceFiles = [];
var rootIndex = 0;
for (rootIndex = 0; rootIndex < scanRoots.length; rootIndex += 1) {
  walkFiles(scanRoots[rootIndex], sourceFiles);
}

var referencedKeys = {};
var fileIndex = 0;
for (fileIndex = 0; fileIndex < sourceFiles.length; fileIndex += 1) {
  var filePath = sourceFiles[fileIndex];
  var text = fs.readFileSync(filePath, "utf8");
  var keys = collectReferencedKeys(text);
  var keyIndex = 0;
  for (keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
    referencedKeys[keys[keyIndex]] = true;
  }
}

var englishPath = path.join(localizationDir, "english.json");
var englishMap = JSON.parse(fs.readFileSync(englishPath, "utf8"));
var allKeys = Object.keys(englishMap);
var unusedKeys = [];
var keyIndex = 0;
for (keyIndex = 0; keyIndex < allKeys.length; keyIndex += 1) {
  var localeKey = allKeys[keyIndex];
  if (!referencedKeys[localeKey]) {
    unusedKeys.push(localeKey);
  }
}

var localeFiles = fs.readdirSync(localizationDir).filter(function (name) {
  return name.endsWith(".json") && name !== "languages.json" && !name.startsWith("_");
});

var allowRemovePrefixes = ["web.game.cargo-convoy.spawn-escort", "web.game.cargo-convoy.crystals-label"];
var removeKeys = unusedKeys.filter(function (key) {
  var index = 0;
  for (index = 0; index < allowRemovePrefixes.length; index += 1) {
    if (key === allowRemovePrefixes[index]) {
      return true;
    }
  }
  return false;
});

console.log("Unused keys (sample):");
var sampleIndex = 0;
for (sampleIndex = 0; sampleIndex < unusedKeys.length && sampleIndex < 30; sampleIndex += 1) {
  console.log("  " + unusedKeys[sampleIndex]);
}
if (unusedKeys.length > 30) {
  console.log("  ... and " + (unusedKeys.length - 30) + " more");
}

if (removeKeys.length === 0) {
  console.log("No approved keys to remove.");
  process.exit(0);
}
var removeIndex = 0;
for (removeIndex = 0; removeIndex < localeFiles.length; removeIndex += 1) {
  var localeFileName = localeFiles[removeIndex];
  var localeFilePath = path.join(localizationDir, localeFileName);
  var localeMap = JSON.parse(fs.readFileSync(localeFilePath, "utf8"));
  var removedCount = 0;
  var keyRemoveIndex = 0;
  for (keyRemoveIndex = 0; keyRemoveIndex < removeKeys.length; keyRemoveIndex += 1) {
    var keyToRemove = removeKeys[keyRemoveIndex];
    if (Object.prototype.hasOwnProperty.call(localeMap, keyToRemove)) {
      delete localeMap[keyToRemove];
      removedCount += 1;
    }
  }
  var sortedKeys = Object.keys(localeMap).sort();
  var sortedMap = {};
  var sortIndex = 0;
  for (sortIndex = 0; sortIndex < sortedKeys.length; sortIndex += 1) {
    var sortedKey = sortedKeys[sortIndex];
    sortedMap[sortedKey] = localeMap[sortedKey];
  }
  fs.writeFileSync(localeFilePath, JSON.stringify(sortedMap, null, 2) + "\n", "utf8");
  console.log(localeFileName + ": removed " + removedCount + " keys");
}

console.log("Referenced keys: " + Object.keys(referencedKeys).length);
console.log("Removed unused keys: " + removeKeys.length);
console.log("--- removed ---");
removeKeys.forEach(function (key) {
  console.log(key);
});
