(function () {
  var MAP_GAME = "GameControls";
  var MAP_VEHICLE = "VehicleControls";
  var MAP_SHARED = "SharedControls";
  var KEY_PREFIX = "settings.controls.action.";

  function row(mapName, actionName, bindingIndex, labelKey, displayText) {
    var entry = {
      rowId: mapName + "|" + actionName + "|" + String(bindingIndex),
      labelKey: labelKey || "",
      labelText: "",
      displayText: displayText || ""
    };
    return entry;
  }

  function actionKey(actionName) {
    if (actionName.indexOf("Inventory ") === 0) {
      return KEY_PREFIX + "inventory-" + actionName.substring("Inventory ".length);
    }
    var kebab = "";
    var index;
    for (index = 0; index < actionName.length; index++) {
      var character = actionName.charAt(index);
      if (character >= "A" && character <= "Z" && kebab.length > 0) {
        kebab = kebab + "-";
      }
      kebab = kebab + character.toLowerCase();
    }
    return KEY_PREFIX + kebab;
  }

  function gameRow(actionName, displayText) {
    return row(MAP_GAME, actionName, -1, actionKey(actionName), displayText);
  }

  var ON_FOOT = [
    gameRow("Jump", "Space"),
    gameRow("Crouch", "Left Ctrl"),
    gameRow("Sprint", "Left Shift"),
    gameRow("Fire", "LMB"),
    gameRow("Aim", "RMB"),
    gameRow("Grab", "F"),
    gameRow("EmptyHands", "R"),
    gameRow("Drop", "Q"),
    gameRow("Alt", "Left Alt"),
    gameRow("Mark", "MMB"),
    gameRow("Inventory 1", "1"),
    gameRow("Inventory 2", "2"),
    gameRow("Inventory 3", "3"),
    gameRow("Inventory 4", "4"),
    gameRow("Inventory 5", "5"),
    gameRow("Inventory 6", "6"),
    gameRow("Inventory 7", "7"),
    gameRow("Inventory 8", "8"),
    gameRow("Inventory 9", "9"),
    gameRow("Inventory 10", "0"),
    gameRow("Inventory 11", "-"),
    gameRow("Inventory 12", "=")
  ];

  var DRIVING = [
    row(MAP_VEHICLE, "Gas", -1, "settings.controls.action.gas", "RT"),
    row(MAP_VEHICLE, "Brake", -1, "settings.controls.action.brake", "LT"),
    row(MAP_VEHICLE, "Handbrake", -1, "settings.controls.action.handbrake", "Space"),
    row(MAP_VEHICLE, "DriveMove", 0, "settings.controls.action.forward", "W"),
    row(MAP_VEHICLE, "DriveMove", 1, "settings.controls.action.back", "S"),
    row(MAP_VEHICLE, "DriveMove", 2, "settings.controls.action.left", "A"),
    row(MAP_VEHICLE, "DriveMove", 3, "settings.controls.action.right", "D"),
    row(MAP_VEHICLE, "DriveMove", 4, "settings.controls.action.stick-up", "Left Stick Up"),
    row(MAP_VEHICLE, "DriveMove", 5, "settings.controls.action.stick-down", "Left Stick Down"),
    row(MAP_VEHICLE, "DriveMove", 6, "settings.controls.action.stick-left", "Left Stick Left"),
    row(MAP_VEHICLE, "DriveMove", 7, "settings.controls.action.stick-right", "Left Stick Right")
  ];

  var SHARED = [
    row(MAP_SHARED, "Interact", -1, "settings.controls.action.interact", "E"),
    row(MAP_SHARED, "Pause", -1, "settings.controls.action.pause", "Esc"),
    row(MAP_SHARED, "Chat", -1, "settings.controls.action.chat", "Enter"),
    row(MAP_SHARED, "F5", -1, "settings.controls.action.toggle-third-person", "F5"),
    row(MAP_SHARED, "ChatSlash", -1, "settings.controls.dev-chat", "/")
  ];

  window.WebSettingsControlsPreviewData = {
    onFoot: ON_FOOT,
    driving: DRIVING,
    shared: SHARED
  };
})();
