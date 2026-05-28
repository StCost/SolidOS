(function () {
  var MAP_GAME = "GameControls";
  var MAP_VEHICLE = "VehicleControls";
  var MAP_SHARED = "SharedControls";

  function row(mapName, actionName, bindingIndex, labelKey, displayText) {
    var entry = {
      rowId: mapName + "|" + actionName + "|" + String(bindingIndex),
      labelKey: labelKey || "",
      labelText: "",
      displayText: displayText || ""
    };
    return entry;
  }

  var ON_FOOT = [
    row(MAP_GAME, "Jump", -1, "", "Space"),
    row(MAP_GAME, "Crouch", -1, "", "Left Ctrl"),
    row(MAP_GAME, "Sprint", -1, "", "Left Shift"),
    row(MAP_GAME, "Fire", -1, "", "LMB"),
    row(MAP_GAME, "Aim", -1, "", "RMB"),
    row(MAP_GAME, "Grab", -1, "", "F"),
    row(MAP_GAME, "EmptyHands", -1, "settings.controls.action.empty-hands", "R"),
    row(MAP_GAME, "Drop", -1, "", "Q"),
    row(MAP_GAME, "Alt", -1, "", "Left Alt"),
    row(MAP_GAME, "Mark", -1, "", "MMB"),
    row(MAP_GAME, "Inventory 1", -1, "", "1"),
    row(MAP_GAME, "Inventory 2", -1, "", "2"),
    row(MAP_GAME, "Inventory 3", -1, "", "3"),
    row(MAP_GAME, "Inventory 4", -1, "", "4"),
    row(MAP_GAME, "Inventory 5", -1, "", "5"),
    row(MAP_GAME, "Inventory 6", -1, "", "6"),
    row(MAP_GAME, "Inventory 7", -1, "", "7"),
    row(MAP_GAME, "Inventory 8", -1, "", "8"),
    row(MAP_GAME, "Inventory 9", -1, "", "9"),
    row(MAP_GAME, "Inventory 10", -1, "", "0"),
    row(MAP_GAME, "Inventory 11", -1, "", "-"),
    row(MAP_GAME, "Inventory 12", -1, "", "=")
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
