const fs = require("fs");
const path = require("path");

const localizationDir = path.join(__dirname, "..", "Localization");

const files = fs.readdirSync(localizationDir).filter(function (name) {
  return name.endsWith(".json") && name !== "languages.json" && !name.startsWith("_");
});

for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
  const fileName = files[fileIndex];
  const filePath = path.join(localizationDir, fileName);
  const map = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const sortedKeys = Object.keys(map).sort();
  const sortedMap = {};
  let keyIndex = 0;
  for (keyIndex = 0; keyIndex < sortedKeys.length; keyIndex++) {
    const sortedKey = sortedKeys[keyIndex];
    sortedMap[sortedKey] = map[sortedKey];
  }
  fs.writeFileSync(filePath, JSON.stringify(sortedMap, null, 2) + "\n", "utf8");
}

console.log("Sorted keys in " + files.length + " locale files.");
