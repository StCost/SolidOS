(function () {
  var menu = WebMenu;
  var singleplayerList = document.getElementById("singleplayerList");
  var ipMultiplayerList = document.getElementById("ipMultiplayerList");
  var steamMultiplayerList = document.getElementById("steamMultiplayerList");
  var formNewWorld = document.getElementById("formNewWorld");
  var formNewServer = document.getElementById("formNewServer");
  var btnAddWorld = document.getElementById("btnAddWorld");
  var btnAddServer = document.getElementById("btnAddServer");
  var listsSaveTimer = 0;
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

  function resetWorldForm() {
    formNewWorld.querySelector('[name="name"]').value = "";
    formNewWorld.querySelector('[name="seed"]').value = "";
    updateComposeFormState(formNewWorld, btnAddWorld);
  }

  function resetServerForm() {
    formNewServer.querySelector('[name="name"]').value = "";
    formNewServer.querySelector('[name="ip"]').value = "";
    updateComposeFormState(formNewServer, btnAddServer);
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

  function createDeleteButton() {
    var deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "worlds-entry-delete terminal-text--dim";
    deleteButton.textContent = "X";
    deleteButton.setAttribute("aria-label", "Delete");
    return deleteButton;
  }

  function createConfirmButton(label, className, ariaLabel) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className + " terminal-text--dim";
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    return button;
  }

  function replaceDeleteWithConfirm(listItem, onConfirm) {
    var deleteButton = listItem.querySelector(".worlds-entry-delete");
    if (!deleteButton) return;

    var confirmButton = createConfirmButton("✓", "worlds-entry-confirm", "Confirm delete");
    var cancelButton = createConfirmButton("✕", "worlds-entry-cancel", "Cancel delete");

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

  function renderAllLists() {
    singleplayerList.textContent = "";
    ipMultiplayerList.textContent = "";
    steamMultiplayerList.textContent = "";

    var index = 0;
    for (index = 0; index < savedWorlds.length; index++) {
      var world = savedWorlds[index];
      singleplayerList.appendChild(
        createSingleplayerListItem(world.seed, world.name, index + 1)
      );
    }

    for (index = 0; index < savedServers.length; index++) {
      var server = savedServers[index];
      ipMultiplayerList.appendChild(
        createIpListItem(server.ip, server.name, index + 1)
      );
    }

    for (index = 0; index < savedFriends.length; index++) {
      var friendEntry = savedFriends[index];
      steamMultiplayerList.appendChild(
        createSteamListItem(friendEntry.name, index + 1)
      );
    }

    if (window.WebScrollbarCursor) {
      window.WebScrollbarCursor.refreshAllScrollbars();
    }
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
      resetWorldForm();
    } else {
      var ip = menu.trimValue(ipInput.value);
      savedServers.push({ name: name, ip: ip });
      resetServerForm();
      scheduleListsSave();
    }

    renderAllLists();
    updateComposeFormState(form, addButton);
  }

  bindComposeForm(formNewWorld, btnAddWorld);
  bindComposeForm(formNewServer, btnAddServer);

  document.getElementById("btnWorldsBack").addEventListener("click", function () {
    menu.goToIndexPage();
  });

  formNewWorld.addEventListener("submit", function (event) {
    event.preventDefault();
    submitCompose(formNewWorld, btnAddWorld);
  });

  formNewServer.addEventListener("submit", function (event) {
    event.preventDefault();
    submitCompose(formNewServer, btnAddServer);
  });

  var worldsBoard = document.querySelector(".worlds-board");
  worldsBoard.addEventListener("click", function (event) {
    if (event.target.closest(".worlds-compose")) return;
    if (event.target.closest(".worlds-entry-delete")) return;

    var entry = event.target.closest(".worlds-entry");
    if (!entry) return;

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

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") menu.goToIndexPage();
  });

  window.addEventListener("web-page-changed", function (event) {
    var detail = event.detail;
    if (!detail || detail.pageId !== "start") return;
    window.dispatchEvent(new CustomEvent("web-start-page-open"));
  });

  window.WebStartMenu = {
    applyLists: applyLists
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
