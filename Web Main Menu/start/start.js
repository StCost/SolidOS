(function () {
  var menu = WebMenu;
  var listsSaveTimer = 0;
  var PRESET_WORLDS = "connect-col-0";
  var PRESET_SERVERS = "connect-col-1";
  var PRESET_STEAM = "connect-col-2";
  var LIST_CLASS_SINGLEPLAYER = "worlds-list--singleplayer";
  var LIST_CLASS_IP = "worlds-list--ip";
  var LIST_CLASS_STEAM = "worlds-list--steam";
  var LISTS_STORAGE_KEY = "cm-menu-start-lists";

  var DEFAULT_WORLDS = [
    { name: "Rust Belt", seed: "48291037" },
    { name: "Glass Canyon", seed: "10938472" }
  ];

  var DEFAULT_SERVERS = [
    { name: "Sector 7 Relay", ip: "192.168.1.42" },
    { name: "Collapse DMZ", ip: "10.0.0.8:7777" }
  ];

  var DEFAULT_FRIENDS = [
    { name: "SaintKostya" },
    { name: "VoxelRider" }
  ];

  var savedWorlds = [];
  var savedServers = [];
  var savedFriends = [];

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function isGameMode() {
    if (window.WebMenuMode === "game") return true;
    var device = document.getElementById("device");
    return !!device && device.classList.contains("menu-mode--game");
  }

  function updateConnectGameModeState() {
    var connectDisabled = isGameMode();
    var entries = document.querySelectorAll(".worlds-entry");
    var index;
    for (index = 0; index < entries.length; index++) {
      entries[index].disabled = connectDisabled;
    }
  }

  function postToUnity(payload) {
    if (!isUnityHost()) return;
    window.vuplex.postMessage(JSON.stringify(payload));
  }

  function copyListEntries(source) {
    var copy = [];
    var index;
    if (!source || !source.length) return copy;
    for (index = 0; index < source.length; index++) {
      copy.push(source[index]);
    }
    return copy;
  }

  function readListsFromStorage() {
    try {
      var raw = localStorage.getItem(LISTS_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function writeListsToStorage(payload) {
    try {
      localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
    }
  }

  function getDefaultLists() {
    return {
      worlds: copyListEntries(DEFAULT_WORLDS),
      servers: copyListEntries(DEFAULT_SERVERS),
      friends: copyListEntries(DEFAULT_FRIENDS)
    };
  }

  function loadLocalLists() {
    var stored = readListsFromStorage();
    if (!stored) {
      applyLists(getDefaultLists());
      return;
    }
    applyLists(stored);
  }

  function postWorldDelete(name, seed) {
    postToUnity({ eventName: "web-world-delete", name: name || "", seed: seed || "" });
  }

  function postWorldCreate(name, seed) {
    postToUnity({ eventName: "web-world-create", name: name || "", seed: seed || "" });
  }

  function resetWorldForm(form) {
    if (!form) return;
    form.querySelector('[name="name"]').value = "";
    form.querySelector('[name="seed"]').value = "";
    var addButton = form.querySelector(".worlds-compose-add");
    updateComposeFormState(form, addButton);
  }

  function resetServerForm(form) {
    if (!form) return;
    form.querySelector('[name="name"]').value = "";
    form.querySelector('[name="ip"]').value = "";
    var addButton = form.querySelector(".worlds-compose-add");
    updateComposeFormState(form, addButton);
  }

  function isComposeFormReady(form) {
    var nameInput = form.querySelector('[name="name"]');
    var name = menu.trimValue(nameInput.value);
    if (!name) return false;

    var kind = form.getAttribute("data-compose-kind");
    if (kind === "singleplayer") {
      var seedInput = form.querySelector('[name="seed"]');
      var seed = menu.trimValue(seedInput.value);
      return seed.length > 0;
    }

    var ipInput = form.querySelector('[name="ip"]');
    var ip = menu.trimValue(ipInput.value);
    return ip.length > 0;
  }

  function updateComposeFormState(form, addButton) {
    addButton.disabled = !isComposeFormReady(form);
  }

  function bindComposeForm(form, addButton) {
    var inputs = form.querySelectorAll(".worlds-compose-input");
    var index = 0;
    for (index = 0; index < inputs.length; index++) {
      inputs[index].addEventListener("input", function () {
        updateComposeFormState(form, addButton);
      });
    }
    updateComposeFormState(form, addButton);
  }

  function formatEntryIndex(index) {
    if (index < 10) return "0" + String(index);
    return String(index);
  }

  function createEntryActionButton(className, ariaLabel, actionName, glyphLabel) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className + " os-window-control worlds-entry-action";
    if (actionName) {
      button.setAttribute("data-wm-action", actionName);
    }
    button.setAttribute("aria-label", ariaLabel);
    var glyph = document.createElement("span");
    glyph.className = "os-window-control-glyph";
    glyph.setAttribute("aria-hidden", "true");
    if (glyphLabel) {
      glyph.textContent = glyphLabel;
    }
    button.appendChild(glyph);
    return button;
  }

  function createDismissButton(className, ariaLabel) {
    return createEntryActionButton(className, ariaLabel, "close", "");
  }

  function createDeleteButton() {
    return createDismissButton("worlds-entry-delete", "Delete");
  }

  function createConfirmButton(className, ariaLabel, glyphLabel) {
    return createEntryActionButton(className, ariaLabel, "", glyphLabel);
  }

  function replaceDeleteWithConfirm(listItem, onConfirm) {
    var deleteButton = listItem.querySelector(".worlds-entry-delete");
    if (!deleteButton) return;

    var confirmButton = createConfirmButton("worlds-entry-confirm", "Confirm delete", "✓");
    var cancelButton = createDismissButton("worlds-entry-cancel", "Cancel delete");

    confirmButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      onConfirm();
    });

    cancelButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      listItem.removeChild(confirmButton);
      listItem.removeChild(cancelButton);
      listItem.appendChild(deleteButton);
    });

    listItem.removeChild(deleteButton);
    listItem.appendChild(confirmButton);
    listItem.appendChild(cancelButton);
  }

  function createSingleplayerListItem(seed, name, index) {
    var listItem = document.createElement("li");

    var button = document.createElement("button");
    button.type = "button";
    button.className = "worlds-entry";
    button.setAttribute("data-world-kind", "singleplayer");
    button.setAttribute("data-seed", seed);
    button.setAttribute("data-name", name);

    var indexSpan = document.createElement("span");
    indexSpan.className = "worlds-entry-index terminal-text--dim";
    indexSpan.textContent = formatEntryIndex(index);

    var nameSpan = document.createElement("span");
    nameSpan.className = "worlds-entry-name terminal-text";
    nameSpan.textContent = name;

    var seedSpan = document.createElement("span");
    seedSpan.className = "worlds-entry-seed terminal-text--dim";
    seedSpan.textContent = seed;

    var deleteButton = createDeleteButton();
    deleteButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      replaceDeleteWithConfirm(listItem, function () {
        postWorldDelete(name, seed);
        removeSingleplayerEntry(seed, name);
      });
    });

    button.appendChild(indexSpan);
    button.appendChild(nameSpan);
    button.appendChild(seedSpan);
    listItem.appendChild(button);
    listItem.appendChild(deleteButton);
    return listItem;
  }

  function createSteamListItem(name, index) {
    var listItem = document.createElement("li");

    var button = document.createElement("button");
    button.type = "button";
    button.className = "worlds-entry worlds-entry--name-only";
    button.setAttribute("data-world-kind", "steam-multiplayer");
    button.setAttribute("data-name", name);

    var indexSpan = document.createElement("span");
    indexSpan.className = "worlds-entry-index terminal-text--dim";
    indexSpan.textContent = formatEntryIndex(index);

    var nameSpan = document.createElement("span");
    nameSpan.className = "worlds-entry-name terminal-text";
    nameSpan.textContent = name;

    button.appendChild(indexSpan);
    button.appendChild(nameSpan);
    listItem.appendChild(button);
    return listItem;
  }

  function createIpListItem(ip, name, index) {
    var listItem = document.createElement("li");

    var button = document.createElement("button");
    button.type = "button";
    button.className = "worlds-entry";
    button.setAttribute("data-world-kind", "ip-multiplayer");
    button.setAttribute("data-ip", ip);
    button.setAttribute("data-name", name);

    var indexSpan = document.createElement("span");
    indexSpan.className = "worlds-entry-index terminal-text--dim";
    indexSpan.textContent = formatEntryIndex(index);

    var nameSpan = document.createElement("span");
    nameSpan.className = "worlds-entry-name terminal-text";
    nameSpan.textContent = name;

    var ipSpan = document.createElement("span");
    ipSpan.className = "worlds-entry-ip terminal-text--dim";
    ipSpan.textContent = ip;

    var deleteButton = createDeleteButton();
    deleteButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      replaceDeleteWithConfirm(listItem, function () {
        removeIpServerEntry(ip, name);
      });
    });

    button.appendChild(indexSpan);
    button.appendChild(nameSpan);
    button.appendChild(ipSpan);
    listItem.appendChild(button);
    listItem.appendChild(deleteButton);
    return listItem;
  }

  function removeSingleplayerEntry(seed, name) {
    var nextWorlds = [];
    var index = 0;
    for (index = 0; index < savedWorlds.length; index++) {
      var entry = savedWorlds[index];
      if (entry.seed === seed && entry.name === name) continue;
      nextWorlds.push(entry);
    }
    savedWorlds = nextWorlds;
    renderAllLists();
    scheduleListsSave();
  }

  function removeIpServerEntry(ip, name) {
    var nextServers = [];
    var index = 0;
    for (index = 0; index < savedServers.length; index++) {
      var entry = savedServers[index];
      if (entry.ip === ip && entry.name === name) continue;
      nextServers.push(entry);
    }
    savedServers = nextServers;
    renderAllLists();
    scheduleListsSave();
  }

  function renderListInWindows(presetName, listClassName, buildItem) {
    var windows = document.querySelectorAll(
      '.os-window[data-wm-preset="' + presetName + '"]'
    );
    var windowIndex = 0;
    for (windowIndex = 0; windowIndex < windows.length; windowIndex++) {
      var listRoot = windows[windowIndex].querySelector("." + listClassName);
      if (!listRoot) continue;
      listRoot.textContent = "";
      var index = 0;
      for (index = 0; index < buildItem.count; index++) {
        listRoot.appendChild(buildItem.create(index));
      }
    }
  }

  function renderAllLists() {
    renderListInWindows(PRESET_WORLDS, LIST_CLASS_SINGLEPLAYER, {
      count: savedWorlds.length,
      create: function (index) {
        var world = savedWorlds[index];
        return createSingleplayerListItem(world.seed, world.name, index + 1);
      }
    });
    renderListInWindows(PRESET_SERVERS, LIST_CLASS_IP, {
      count: savedServers.length,
      create: function (index) {
        var server = savedServers[index];
        return createIpListItem(server.ip, server.name, index + 1);
      }
    });
    renderListInWindows(PRESET_STEAM, LIST_CLASS_STEAM, {
      count: savedFriends.length,
      create: function (index) {
        var friendEntry = savedFriends[index];
        return createSteamListItem(friendEntry.name, index + 1);
      }
    });

    if (window.WebScrollbarCursor) {
      var connectWorkspace = document.querySelector(".os-workspace--connect");
      if (window.WebScrollbarCursor.initVerticalScrollViews && connectWorkspace) {
        window.WebScrollbarCursor.initVerticalScrollViews(connectWorkspace);
      }
      window.WebScrollbarCursor.refreshAllScrollbars();
    }
    updateConnectGameModeState();
  }

  function collectListsPayload() {
    return {
      worlds: copyListEntries(savedWorlds),
      servers: copyListEntries(savedServers),
      friends: copyListEntries(savedFriends)
    };
  }

  function postListsSave() {
    var payload = collectListsPayload();
    if (!isUnityHost()) {
      writeListsToStorage(payload);
      return;
    }
    postToUnity({ eventName: "web-start-lists-save", listsJson: JSON.stringify(payload) });
  }

  function scheduleListsSave() {
    if (listsSaveTimer) window.clearTimeout(listsSaveTimer);
    listsSaveTimer = window.setTimeout(function () {
      listsSaveTimer = 0;
      postListsSave();
    }, 120);
  }

  function applyLists(payload) {
    if (!payload) return;
    savedWorlds = copyListEntries(payload.worlds);
    savedServers = copyListEntries(payload.servers);
    savedFriends = copyListEntries(payload.friends);
    renderAllLists();
  }

  function submitCompose(form, addButton) {
    if (!isComposeFormReady(form)) return;

    var kind = form.getAttribute("data-compose-kind");
    var seedInput = form.querySelector('[name="seed"]');
    var ipInput = form.querySelector('[name="ip"]');
    var nameInput = form.querySelector('[name="name"]');
    var name = menu.trimValue(nameInput.value);

    if (kind === "singleplayer") {
      var seed = menu.trimValue(seedInput.value);
      if (isUnityHost()) {
        postWorldCreate(name, seed);
      } else {
        savedWorlds.push({ name: name, seed: seed });
        scheduleListsSave();
      }
      resetWorldForm(form);
    } else {
      var ip = menu.trimValue(ipInput.value);
      savedServers.push({ name: name, ip: ip });
      resetServerForm(form);
      scheduleListsSave();
    }

    renderAllLists();
    updateComposeFormState(form, addButton);
  }

  var worldsBoard = document.getElementById("desktopWorkspace");
  if (worldsBoard) {
    worldsBoard.addEventListener("input", function (event) {
      var input = event.target;
      if (!input || !input.classList || !input.classList.contains("worlds-compose-input")) return;
      var form = input.closest(".worlds-compose-dock");
      if (!form) return;
      var addButton = form.querySelector(".worlds-compose-add");
      updateComposeFormState(form, addButton);
    });

    worldsBoard.addEventListener("submit", function (event) {
      var form = event.target;
      if (!form || !form.classList || !form.classList.contains("worlds-compose-dock")) return;
      event.preventDefault();
      var addButton = form.querySelector(".worlds-compose-add");
      submitCompose(form, addButton);
    });

    worldsBoard.addEventListener("click", function (event) {
    if (event.target.closest(".worlds-compose")) return;
    if (event.target.closest(".worlds-entry-delete")) return;

    var entry = event.target.closest(".worlds-entry");
    if (!entry) return;
    if (isGameMode()) return;
    if (entry.disabled) return;

    var kind = entry.getAttribute("data-world-kind");
    var name = entry.getAttribute("data-name");
    var seed = entry.getAttribute("data-seed");
    var ip = entry.getAttribute("data-ip");
    var detail = { kind: kind, name: name, seed: seed, ip: ip };

    if (kind === "singleplayer") {
      menu.dispatchMenuEvent("web-select-world", detail);
      menu.dispatchMenuEvent("web-start", detail);
    } else if (kind === "ip-multiplayer") {
      menu.dispatchMenuEvent("web-select-server", detail);
      menu.dispatchMenuEvent("web-start", detail);
    } else if (kind === "steam-multiplayer") {
      menu.dispatchMenuEvent("web-select-steam", detail);
    }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (menu.getCurrentPageId() === "start") {
      menu.goToIndexPage();
    }
  });

  window.addEventListener("web-page-changed", function (event) {
    var detail = event.detail;
    if (!detail || detail.pageId !== "start") return;
    window.dispatchEvent(new CustomEvent("web-start-page-open"));
  });

  window.addEventListener("web-menu-mode-changed", updateConnectGameModeState);

  window.WebStartMenu = {
    applyLists: applyLists,
    renderAllLists: renderAllLists,
    updateConnectGameModeState: updateConnectGameModeState
  };

  if (window.__webPendingStartLists) {
    applyLists(window.__webPendingStartLists);
    window.__webPendingStartLists = null;
  } else if (!isUnityHost()) {
    loadLocalLists();
  } else {
    renderAllLists();
  }
})();
