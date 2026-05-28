(function () {
  var SECTION_ON_FOOT = "onFoot";
  var SECTION_DRIVING = "driving";
  var SECTION_SHARED = "shared";

  function getPreviewBindRows(sectionId) {
    var source = window.WebSettingsControlsPreviewData;
    if (!source) return [];
    if (sectionId === SECTION_DRIVING) return source.driving || [];
    if (sectionId === SECTION_SHARED) return source.shared || [];
    return source.onFoot || [];
  }

  var activeSection = SECTION_ON_FOOT;
  var controlsRows = [];
  var listeningRowId = "";

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function getLocalized(key, fallback) {
    if (window.WebSettings && window.WebSettings.getLocalized) {
      return window.WebSettings.getLocalized(key, fallback);
    }
    if (fallback != null) return fallback;
    return key || "";
  }

  function getSectionLabelKey(sectionId) {
    if (sectionId === SECTION_DRIVING) return "settings.controls.section.driving";
    if (sectionId === SECTION_SHARED) return "settings.controls.section.shared";
    return "settings.controls.section.on-foot";
  }

  function getActionNameFromRowId(rowId) {
    if (!rowId) return "";
    var parts = rowId.split("|");
    if (parts.length >= 2) return parts[1];
    return "";
  }

  function getRowLabel(row) {
    if (row.labelText) return row.labelText;
    if (row.labelKey) return getLocalized(row.labelKey, row.labelKey);
    var actionName = getActionNameFromRowId(row.rowId);
    if (actionName) return actionName;
    return row.rowId || "";
  }

  function getRowDisplay(row) {
    if (listeningRowId && row.rowId === listeningRowId) {
      return getLocalized("settings.controls.press-prompt", "Press any button…");
    }
    if (row.displayText) return row.displayText;
    return getLocalized("settings.controls.empty", "[empty]");
  }

  function setPreviewControlsRows(sectionId) {
    controlsRows = getPreviewBindRows(sectionId);
    listeningRowId = "";
  }

  function ensurePreviewControlsRows() {
    if (isUnityHost()) return;
    if (!controlsRows.length) {
      setPreviewControlsRows(activeSection || SECTION_ON_FOOT);
    }
  }

  function requestControlsSection(sectionId) {
    activeSection = sectionId;
    if (isUnityHost() && window.WebSettingsBridge && window.WebSettingsBridge.setControlsSection) {
      window.WebSettingsBridge.setControlsSection(sectionId);
      return;
    }
    setPreviewControlsRows(sectionId);
    if (window.WebSettings && window.WebSettings.renderControlsOnly) {
      window.WebSettings.renderControlsOnly();
    }
  }

  function onBindRowClicked(rowId) {
    if (!rowId || rowId.indexOf("preview|") === 0) return;
    if (isUnityHost() && window.WebSettingsBridge && window.WebSettingsBridge.startControlsRebind) {
      window.WebSettingsBridge.startControlsRebind(rowId);
      return;
    }
    listeningRowId = rowId;
    if (window.WebSettings && window.WebSettings.renderControlsOnly) {
      window.WebSettings.renderControlsOnly();
    }
    window.setTimeout(function () {
      if (listeningRowId !== rowId) return;
      listeningRowId = "";
      if (window.WebSettings && window.WebSettings.renderControlsOnly) {
        window.WebSettings.renderControlsOnly();
      }
    }, 1800);
  }

  function buildSectionTabs() {
    var nav = document.createElement("div");
    nav.className = "settings-controls-sections";
    nav.setAttribute("role", "tablist");

    var sections = [SECTION_ON_FOOT, SECTION_DRIVING, SECTION_SHARED];
    var index;
    for (index = 0; index < sections.length; index++) {
      var sectionId = sections[index];
      var button = document.createElement("button");
      button.type = "button";
      button.className = "term-row settings-controls-section-tab";
      if (sectionId === activeSection) button.className += " is-active";
      button.setAttribute("role", "tab");
      button.setAttribute("data-controls-section", sectionId);
      button.setAttribute("aria-selected", sectionId === activeSection ? "true" : "false");

      var prefix = document.createElement("span");
      prefix.className = "term-row-prefix terminal-text--dim";
      prefix.textContent = sectionId === activeSection ? ">>" : "[ ]";

      var label = document.createElement("span");
      label.className = "term-row-label terminal-text";
      label.textContent = getLocalized(getSectionLabelKey(sectionId), sectionId);

      button.appendChild(prefix);
      button.appendChild(label);
      button.addEventListener("click", function (event) {
        var targetSection = event.currentTarget.getAttribute("data-controls-section");
        if (!targetSection || targetSection === activeSection) return;
        requestControlsSection(targetSection);
      });
      nav.appendChild(button);
    }

    return nav;
  }

  function buildLookSensitivityRow() {
    if (!window.WebSettings || !window.WebSettings.buildSliderRowForField) return null;

    return window.WebSettings.buildSliderRowForField({
      type: "slider",
      key: "lookSensitivityPercent",
      labelKey: "settings.controls.look-sensitivity",
      helpKey: "settings.help.controls.look-sensitivity",
      min: 25,
      max: 200,
      step: 1,
      format: window.WebSettings.percentFormat
    });
  }

  function buildBindRow(row) {
    var bindRow = document.createElement("div");
    bindRow.className = "settings-row settings-row--bind";
    bindRow.setAttribute("data-bind-row-id", row.rowId);

    var line = document.createElement("div");
    line.className = "settings-field-line";

    var labelBox = document.createElement("div");
    labelBox.className = "settings-field-label-box";
    var labelSpan = document.createElement("span");
    labelSpan.className = "settings-label settings-label-text term-row-label terminal-text";
    labelSpan.textContent = getRowLabel(row);
    labelBox.appendChild(labelSpan);

    var controlBox = document.createElement("div");
    controlBox.className = "settings-field-control-box settings-field-control-box--bind";

    var bindButton = document.createElement("button");
    bindButton.type = "button";
    bindButton.className = "term-row settings-bind-btn";
    if (listeningRowId && row.rowId === listeningRowId) {
      bindButton.className += " is-listening";
    }

    var valueLabel = document.createElement("span");
    valueLabel.className = "term-row-label terminal-text settings-bind-value";
    valueLabel.textContent = getRowDisplay(row);
    bindButton.appendChild(valueLabel);

    bindButton.addEventListener("click", function () {
      onBindRowClicked(row.rowId);
    });

    controlBox.appendChild(bindButton);
    line.appendChild(labelBox);
    line.appendChild(controlBox);
    bindRow.appendChild(line);
    return bindRow;
  }

  function renderControlsInto(contentRoot) {
    if (!contentRoot) return;

    ensurePreviewControlsRows();

    contentRoot.textContent = "";
    contentRoot.classList.remove("is-empty");

    var block = document.createElement("div");
    block.className = "settings-controls-block";

    var lookRow = buildLookSensitivityRow();
    if (lookRow) block.appendChild(lookRow);

    block.appendChild(buildSectionTabs());

    var index;
    for (index = 0; index < controlsRows.length; index++) {
      block.appendChild(buildBindRow(controlsRows[index]));
    }

    contentRoot.appendChild(block);

    if (window.WebSettings) {
      if (window.WebSettings.refreshAllSliderValuePositions) {
        window.WebSettings.refreshAllSliderValuePositions();
      }
      if (window.WebSettings.scheduleSliderValueLayoutRefresh) {
        window.WebSettings.scheduleSliderValueLayoutRefresh();
      }
    }

    if (window.WebScrollbarCursor) {
      window.WebScrollbarCursor.refreshAllScrollbars();
    }
  }

  function applyControlsState(payload) {
    if (!payload) return;
    if (payload.controlsSection) activeSection = payload.controlsSection;
    if (payload.controlsRows && payload.controlsRows.length > 0) {
      controlsRows = payload.controlsRows;
    }
  }

  function setListeningRowId(rowId) {
    listeningRowId = rowId || "";
  }

  function openControlsTab() {
    requestControlsSection(activeSection || SECTION_ON_FOOT);
  }

  window.WebSettingsControls = {
    SECTION_ON_FOOT: SECTION_ON_FOOT,
    SECTION_DRIVING: SECTION_DRIVING,
    SECTION_SHARED: SECTION_SHARED,
    applyControlsState: applyControlsState,
    setListeningRowId: setListeningRowId,
    renderControlsInto: renderControlsInto,
    openControlsTab: openControlsTab,
    getActiveSection: function () {
      return activeSection;
    }
  };
})();
