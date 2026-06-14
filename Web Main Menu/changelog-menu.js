(function () {
  var PRESET_CHANGELOG = "changelog-content";
  var CHANGELOG_LIST_ID = "changelogList";
  var CHANGELOG_DETAIL_ID = "changelogDetail";

  var loadedEntryTable = {};
  var activeEntryId = "";

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function getManifestEntries() {
    var manifest = window.WebChangelogManifest;
    if (!manifest || !manifest.entries) return [];
    return manifest.entries;
  }

  function parseEntryText(text) {
    var lines = (text || "").split("\n");
    var title = "";
    var bodyLines = [];
    var index;
    var line;
    var bodyStarted = false;
    for (index = 0; index < lines.length; index++) {
      line = lines[index];
      if (!bodyStarted) {
        if (line === "") continue;
        title = line;
        bodyStarted = true;
        continue;
      }
      bodyLines.push(line);
    }
    while (bodyLines.length && bodyLines[bodyLines.length - 1] === "") {
      bodyLines.pop();
    }
    return {
      title: title,
      body: bodyLines.join("\n")
    };
  }

  function getEntryTitleFromParsed(parsed, entryId) {
    if (parsed && parsed.title) return parsed.title;
    return entryId || "";
  }

  function fetchEntryText(filePath) {
    return window.fetch(filePath, { cache: "no-cache" }).then(function (response) {
      if (!response.ok) {
        throw new Error("fetch failed");
      }
      return response.text();
    });
  }

  function loadEntry(entry) {
    if (!entry || !entry.id) {
      return Promise.reject(new Error("missing entry"));
    }
    if (loadedEntryTable[entry.id]) {
      return Promise.resolve(loadedEntryTable[entry.id]);
    }
    if (!entry.file) {
      return Promise.reject(new Error("missing file"));
    }
    return fetchEntryText(entry.file).then(function (text) {
      var parsed = parseEntryText(text);
      var record = {
        id: entry.id,
        title: getEntryTitleFromParsed(parsed, entry.id),
        body: parsed.body || ""
      };
      loadedEntryTable[entry.id] = record;
      return record;
    });
  }

  function formatEntryIndex(index) {
    if (index < 10) return "0" + String(index);
    return String(index);
  }

  function getChangelogShell(windowElement) {
    if (!windowElement) return null;
    return windowElement.querySelector(".changelog-shell");
  }

  function wrapScrollViewInClip(panelElement, scrollElement) {
    var clipElement = document.createElement("div");
    clipElement.className = "menu-v-scroll-clip";
    clipElement.appendChild(scrollElement);
    panelElement.appendChild(clipElement);
    return clipElement;
  }

  function ensureScrollClipForPanel(panelElement, scrollElement) {
    if (!panelElement || !scrollElement) return null;
    if (scrollElement.parentElement && scrollElement.parentElement.classList.contains("menu-v-scroll-clip")) {
      return scrollElement.parentElement;
    }
    if (scrollElement.parentElement === panelElement) {
      panelElement.removeChild(scrollElement);
      return wrapScrollViewInClip(panelElement, scrollElement);
    }
    return null;
  }

  function refreshChangelogScrollbars() {
    if (window.WebMenuScrollbar && window.WebMenuScrollbar.refresh) {
      window.WebMenuScrollbar.refresh();
    }
  }

  function ensureChangelogShell(windowElement) {
    var bodyElement;
    var shellElement;
    var listPanelElement;
    var detailPanelElement;
    var listRoot;
    var detailRoot;
    if (!windowElement) return null;
    shellElement = getChangelogShell(windowElement);
    if (shellElement) return shellElement;
    bodyElement = windowElement.querySelector(".changelog-content-body");
    if (!bodyElement) {
      bodyElement = windowElement.querySelector(".os-window-body");
    }
    if (!bodyElement) return null;

    shellElement = document.createElement("div");
    shellElement.className = "changelog-shell";

    listPanelElement = document.createElement("div");
    listPanelElement.className = "changelog-list-panel";

    listRoot = document.createElement("ul");
    listRoot.id = CHANGELOG_LIST_ID;
    listRoot.className = "changelog-list menu-v-scroll-view";
    listRoot.setAttribute("role", "listbox");
    listRoot.setAttribute("aria-label", "Changelog entries");
    wrapScrollViewInClip(listPanelElement, listRoot);

    detailPanelElement = document.createElement("div");
    detailPanelElement.className = "changelog-detail-panel";

    detailRoot = document.createElement("div");
    detailRoot.id = CHANGELOG_DETAIL_ID;
    detailRoot.className = "changelog-detail menu-v-scroll-view";
    detailRoot.setAttribute("role", "region");
    detailRoot.setAttribute("aria-label", "Changelog entry");
    wrapScrollViewInClip(detailPanelElement, detailRoot);

    shellElement.appendChild(listPanelElement);
    shellElement.appendChild(detailPanelElement);
    bodyElement.appendChild(shellElement);
    refreshChangelogScrollbars();
    return shellElement;
  }

  function ensureExistingChangelogScrollClips(windowElement) {
    var listPanelElement;
    var detailPanelElement;
    var listRoot;
    var detailRoot;
    if (!windowElement) return;
    listPanelElement = windowElement.querySelector(".changelog-list-panel");
    detailPanelElement = windowElement.querySelector(".changelog-detail-panel");
    listRoot = getListRoot(windowElement);
    detailRoot = getDetailRoot(windowElement);
    ensureScrollClipForPanel(listPanelElement, listRoot);
    ensureScrollClipForPanel(detailPanelElement, detailRoot);
  }

  function getListRoot(windowElement) {
    if (!windowElement) return null;
    return windowElement.querySelector("#" + CHANGELOG_LIST_ID);
  }

  function getDetailRoot(windowElement) {
    if (!windowElement) return null;
    return windowElement.querySelector("#" + CHANGELOG_DETAIL_ID);
  }

  function setDetailEntry(detailRoot, record) {
    if (!detailRoot || !record) return;
    detailRoot.innerHTML =
      '<h3 class="changelog-detail-title terminal-text">' +
      escapeHtml(record.title) +
      "</h3>" +
      '<pre class="changelog-detail-body terminal-text">' +
      escapeHtml(record.body) +
      "</pre>";
  }

  function clearDetail(detailRoot) {
    if (!detailRoot) return;
    detailRoot.textContent = "";
  }

  function setActiveEntryButton(listRoot, entryId) {
    var buttons;
    var index;
    var button;
    if (!listRoot) return;
    buttons = listRoot.querySelectorAll(".changelog-entry");
    for (index = 0; index < buttons.length; index++) {
      button = buttons[index];
      if (button.getAttribute("data-changelog-id") === entryId) {
        button.classList.add("is-active");
        button.setAttribute("aria-selected", "true");
      } else {
        button.classList.remove("is-active");
        button.setAttribute("aria-selected", "false");
      }
    }
  }

  function showEntryDetail(windowElement, entryId) {
    var detailRoot = getDetailRoot(windowElement);
    var listRoot = getListRoot(windowElement);
    var record;
    if (!detailRoot) return;
    activeEntryId = entryId || "";
    setActiveEntryButton(listRoot, activeEntryId);
    if (!activeEntryId) {
      clearDetail(detailRoot);
      return;
    }
    record = loadedEntryTable[activeEntryId];
    if (!record) {
      clearDetail(detailRoot);
      return;
    }
    setDetailEntry(detailRoot, record);
  }

  function createEntryListItem(record, index) {
    var listItem = document.createElement("li");
    var button = document.createElement("button");
    button.type = "button";
    button.className = "changelog-entry";
    button.setAttribute("data-changelog-id", record.id);
    button.setAttribute("role", "option");

    var indexSpan = document.createElement("span");
    indexSpan.className = "changelog-entry-index terminal-text--dim";
    indexSpan.textContent = formatEntryIndex(index);

    var titleSpan = document.createElement("span");
    titleSpan.className = "changelog-entry-title terminal-text";
    titleSpan.textContent = record.title;

    button.appendChild(indexSpan);
    button.appendChild(titleSpan);
    listItem.appendChild(button);
    return listItem;
  }

  function renderEntryList(windowElement, records) {
    var listRoot = getListRoot(windowElement);
    var index;
    if (!listRoot) return;
    listRoot.textContent = "";
    if (!records.length) {
      showEntryDetail(windowElement, "");
      return;
    }
    for (index = 0; index < records.length; index++) {
      listRoot.appendChild(createEntryListItem(records[index], index + 1));
    }
    if (!activeEntryId || !loadedEntryTable[activeEntryId]) {
      activeEntryId = records[0].id;
    }
    showEntryDetail(windowElement, activeEntryId);
  }

  function sortRecordsByManifestOrder(records, manifestEntries) {
    records.sort(function (left, right) {
      var leftIndex = 0;
      var rightIndex = 0;
      for (leftIndex = 0; leftIndex < manifestEntries.length; leftIndex++) {
        if (manifestEntries[leftIndex].id === left.id) break;
      }
      for (rightIndex = 0; rightIndex < manifestEntries.length; rightIndex++) {
        if (manifestEntries[rightIndex].id === right.id) break;
      }
      return leftIndex - rightIndex;
    });
  }

  function onManifestEntryLoaded(windowElement, manifestEntries, records, pendingCountRef, record) {
    records.push(record);
    pendingCountRef.count -= 1;
    if (pendingCountRef.count > 0) return;
    sortRecordsByManifestOrder(records, manifestEntries);
    renderEntryList(windowElement, records);
    refreshChangelogScrollbars();
  }

  function loadManifestEntry(windowElement, manifestEntry, manifestEntries, records, pendingCountRef) {
    loadEntry(manifestEntry)
      .then(function (record) {
        onManifestEntryLoaded(windowElement, manifestEntries, records, pendingCountRef, record);
      })
      .catch(function () {
        onManifestEntryLoaded(windowElement, manifestEntries, records, pendingCountRef, {
          id: manifestEntry.id,
          title: manifestEntry.id,
          body: ""
        });
      });
  }

  function loadAllEntries(windowElement) {
    var manifestEntries = getManifestEntries();
    var pendingCountRef = { count: 0 };
    var records = [];
    var index;
    if (!manifestEntries.length) {
      renderEntryList(windowElement, []);
      return;
    }
    pendingCountRef.count = manifestEntries.length;
    for (index = 0; index < manifestEntries.length; index++) {
      loadManifestEntry(windowElement, manifestEntries[index], manifestEntries, records, pendingCountRef);
    }
  }

  function onListClick(event) {
    var button = event.target.closest(".changelog-entry");
    var windowElement;
    var entryId;
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    windowElement = button.closest('.os-window[data-wm-preset="' + PRESET_CHANGELOG + '"]');
    if (!windowElement) return;
    entryId = button.getAttribute("data-changelog-id");
    if (!entryId) return;
    showEntryDetail(windowElement, entryId);
  }

  function bindListInteraction(windowElement) {
    var listRoot = getListRoot(windowElement);
    if (!listRoot || listRoot.getAttribute("data-changelog-bound") === "1") return;
    listRoot.addEventListener("click", onListClick);
    listRoot.setAttribute("data-changelog-bound", "1");
  }

  function bindToWindow(windowElement) {
    if (!windowElement) return;
    ensureChangelogShell(windowElement);
    ensureExistingChangelogScrollClips(windowElement);
    bindListInteraction(windowElement);
    loadAllEntries(windowElement);
    refreshChangelogScrollbars();
  }

  function releaseContent(windowElement) {
    var listRoot = getListRoot(windowElement);
    var detailRoot = getDetailRoot(windowElement);
    activeEntryId = "";
    if (listRoot) listRoot.textContent = "";
    if (detailRoot) detailRoot.textContent = "";
  }

  function renderOpenWindows() {
    var openWindows = document.querySelectorAll(
      '.os-window[data-wm-preset="' + PRESET_CHANGELOG + '"]:not(.os-window--closed)'
    );
    var index = 0;
    for (index = 0; index < openWindows.length; index++) {
      bindToWindow(openWindows[index]);
    }
  }

  window.WebChangelog = {
    bindToWindow: bindToWindow,
    releaseContent: releaseContent,
    renderOpenWindows: renderOpenWindows
  };
})();
