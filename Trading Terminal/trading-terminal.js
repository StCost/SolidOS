(function () {
  var KIND_WILDCARD = 0;
  var KIND_SELL = 1;
  var KIND_BUY = 2;
  var CONTRACTS_PER_PAGE = 10;
  var ICON_LOCK_SRC = "icon-lock.svg";
  var ICON_UNLOCK_SRC = "icon-unlock.svg";
  var SUCCESS_OVERLAY_MS = 5000;

  var state = {
    screen: "contracts",
    marks: 0,
    inflationMultiplier: 1,
    activeContractId: -1,
    depositSizeX: 0.9,
    depositSizeY: 0.25,
    depositSizeZ: 0.7,
    contracts: [],
    activeContract: null,
    scanItems: [],
    previewItems: [],
    scanTotalCount: 0,
    scanTotalPrice: 0,
    previewTotalCount: 0,
    previewTotalPrice: 0,
    statusMessage: "",
    successOverlay: "",
    contractPage: 0,
    sortColumn: "",
    sortDirection: 0,
    iconMap: {}
  };

  var crosshairCursorElement = null;
  var crosshairDefaultImage = null;
  var crosshairPointerImage = null;
  var pointerVisible = false;
  var lastPointerX = 0;
  var lastPointerY = 0;
  var successOverlayTimer = 0;

  function t(key, fallback) {
    if (window.WebLocale && window.WebLocale.get) {
      return window.WebLocale.get(key, fallback);
    }
    return fallback;
  }

  function tFormat(key, fallback) {
    var text = t(key, fallback);
    var argIndex;
    for (argIndex = 2; argIndex < arguments.length; argIndex++) {
      text = text.split("{" + (argIndex - 2) + "}").join(String(arguments[argIndex]));
    }
    return text;
  }

  var ENTITY_NAME_KEY_PREFIX = "entity.";
  var ENTITY_NAME_KEY_SUFFIX = ".name";

  function getEntityDisplayName(entityId, fallbackDisplayName) {
    var localeKey;
    var localized;
    if (!entityId) {
      if (fallbackDisplayName) return fallbackDisplayName;
      return "";
    }
    localeKey = ENTITY_NAME_KEY_PREFIX + entityId + ENTITY_NAME_KEY_SUFFIX;
    localized = t(localeKey, "");
    if (localized && localized !== localeKey) return localized;
    if (fallbackDisplayName) return fallbackDisplayName;
    return entityId;
  }

  function applyLocaleDom() {
    if (window.WebLocale && window.WebLocale.applyDom) {
      window.WebLocale.applyDom();
    }
    renderContracts();
    renderHandshake();
    syncTypeColumnWidth();
    var successOverlay = document.getElementById("tradeSuccessOverlay");
    var successMessage = document.getElementById("tradeSuccessMessage");
    if (successOverlay && successMessage && !successOverlay.classList.contains("term-hidden")) {
      successMessage.textContent = t("trading.terminal.trade-complete", "TRADE COMPLETE");
    }
  }

  function syncTypeColumnWidth() {
    var measureKeys = [
      ["trading.terminal.col.type", "TYPE"],
      ["trading.terminal.buy", "BUY"],
      ["trading.terminal.sell", "SELL"],
      ["trading.terminal.all", "ALL"]
    ];

    var probe = document.getElementById("tradeTypeColProbe");
    if (!probe) {
      probe = document.createElement("span");
      probe.id = "tradeTypeColProbe";
      probe.className = "trade-col trade-col-type trade-type-col-probe";
      probe.setAttribute("aria-hidden", "true");
      document.body.appendChild(probe);
    }

    var maxWidth = 0;
    var index;
    for (index = 0; index < measureKeys.length; index++) {
      probe.textContent = t(measureKeys[index][0], measureKeys[index][1]);
      var probeWidth = probe.getBoundingClientRect().width;
      if (probeWidth > maxWidth) maxWidth = probeWidth;
    }

    var typeCells = document.querySelectorAll(".trade-contract-table .trade-col-type, .trade-item-table .trade-col-type");
    for (index = 0; index < typeCells.length; index++) {
      var cell = typeCells[index];
      if (cell.id === "tradeTypeColProbe") continue;
      var cellWidth = cell.scrollWidth;
      if (cellWidth > maxWidth) maxWidth = cellWidth;
    }

    if (maxWidth > 0) {
      document.documentElement.style.setProperty("--term-type-col-width", Math.ceil(maxWidth) + "px");
    }
  }

  function postAction(action, extraPayload) {
    var payload = {
      eventName: "trading-terminal-action",
      action: action
    };
    if (extraPayload) {
      var key;
      for (key in extraPayload) {
        if (Object.prototype.hasOwnProperty.call(extraPayload, key)) {
          payload[key] = extraPayload[key];
        }
      }
    }
    if (window.vuplex && window.vuplex.postMessage) {
      window.vuplex.postMessage(JSON.stringify(payload));
      return;
    }
    if (window.TradingTerminalMock && window.TradingTerminalMock.handleAction) {
      window.TradingTerminalMock.handleAction(payload);
    }
  }

  function setScreen(screenName) {
    state.screen = screenName;
    var contractsScreen = document.getElementById("contractsScreen");
    var handshakeScreen = document.getElementById("handshakeScreen");
    if (contractsScreen) contractsScreen.classList.toggle("term-hidden", screenName !== "contracts");
    if (handshakeScreen) handshakeScreen.classList.toggle("term-hidden", screenName !== "handshake");
  }

  function updateHeader() {
    var marksValue = document.getElementById("marksValue");
    if (marksValue) marksValue.textContent = String(state.marks);
  }

  function getIconUrl(itemOrContract) {
    if (!itemOrContract) return "";
    var assetId = itemOrContract.assetId;
    if (!assetId) return "";
    return state.iconMap[String(assetId)] || state.iconMap[assetId] || "";
  }

  function getContractTypeLabel(contract) {
    if (!contract) return "";
    if (contract.kind === KIND_BUY) return t("trading.terminal.buy", "BUY");
    return t("trading.terminal.sell", "SELL");
  }

  function getContractTypeClass(contract) {
    if (!contract) return "";
    if (contract.kind === KIND_BUY) return "is-buy";
    return "is-sell";
  }

  function formatPrice(value, wildcard) {
    if (wildcard) return "50%";
    return String(value) + " MK";
  }

  function formatAmount(contract) {
    if (!contract) return "—";
    if (contract.kind === KIND_WILDCARD) return t("trading.terminal.all", "ALL");
    if (contract.amount > 0) return String(contract.amount);
    return "—";
  }

  function formatTotal(contract) {
    if (!contract) return "—";
    if (contract.kind === KIND_WILDCARD) return "—";
    return String(contract.totalPrice) + " MK";
  }

  function formatItemAmount(item) {
    var selectedCount = item.selectedCount !== undefined ? item.selectedCount : item.count;
    var maxCount = item.maxCount !== undefined ? item.maxCount : item.count;
    if (maxCount <= 0) maxCount = item.count || 1;
    if (selectedCount >= maxCount) return String(maxCount);
    return String(selectedCount) + "/" + String(maxCount);
  }

  function createTableCell(className, text) {
    var cell = document.createElement("span");
    cell.className = "trade-col " + className;
    cell.textContent = text;
    return cell;
  }

  function createIconCell(itemOrContract, useWildcardPlaceholder) {
    var iconCell = document.createElement("span");
    iconCell.className = "trade-col trade-col-icon";

    var slot = document.createElement("span");
    slot.className = "trade-icon-slot";

    var iconUrl = getIconUrl(itemOrContract);
    if (iconUrl) {
      var icon = document.createElement("img");
      icon.className = itemOrContract && itemOrContract.count !== undefined ? "trade-item-icon" : "trade-contract-icon";
      icon.src = iconUrl;
      slot.appendChild(icon);
    } else if (useWildcardPlaceholder || (itemOrContract && itemOrContract.kind === KIND_WILDCARD)) {
      var placeholder = document.createElement("span");
      placeholder.className = "trade-icon-placeholder";
      placeholder.textContent = t("trading.terminal.all", "ALL");
      slot.appendChild(placeholder);
    }

    iconCell.appendChild(slot);
    return iconCell;
  }

  function createLockCell(contract) {
    var lockCell = document.createElement("span");
    lockCell.className = "trade-col trade-col-lock";

    if (!contract || contract.kind === KIND_WILDCARD) {
      return lockCell;
    }

    var lockButton = document.createElement("button");
    lockButton.type = "button";
    lockButton.className = "term-button trade-lock-button";
    if (contract.pinned) lockButton.classList.add("is-locked");

    var lockIcon = document.createElement("img");
    lockIcon.className = "trade-lock-icon";
    lockIcon.src = contract.pinned ? ICON_LOCK_SRC : ICON_UNLOCK_SRC;
    lockIcon.alt = contract.pinned ? t("trading.terminal.locked", "LOCKED") : t("trading.terminal.unlocked", "UNLOCKED");
    lockButton.appendChild(lockIcon);

    lockButton.addEventListener("click", function (event) {
      event.stopPropagation();
      postAction("lock", { contractId: contract.id });
    });

    lockCell.appendChild(lockButton);
    return lockCell;
  }

  function createQtyButton(label, adjustMode, itemIndex) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "term-button trade-qty-button";
    button.textContent = label;
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      postAction("adjust-amount", { itemIndex: itemIndex, adjustMode: adjustMode });
    });
    return button;
  }

  function createQtyControlsCell(item, itemIndex) {
    var qtyCell = document.createElement("span");
    qtyCell.className = "trade-col trade-col-lock";

    if (!item || (item.unitPrice || 0) <= 0) {
      return qtyCell;
    }

    var controls = document.createElement("span");
    controls.className = "trade-qty-controls";
    controls.appendChild(createQtyButton("0", "zero", itemIndex));
    controls.appendChild(createQtyButton("-10", "minus-ten", itemIndex));
    controls.appendChild(createQtyButton("-1", "minus-one", itemIndex));
    controls.appendChild(createQtyButton("+1", "plus-one", itemIndex));
    controls.appendChild(createQtyButton("+10", "plus-ten", itemIndex));
    controls.appendChild(createQtyButton("MAX", "max", itemIndex));
    qtyCell.appendChild(controls);
    return qtyCell;
  }

  function appendContractRow(list, contract) {
    var row = document.createElement("div");
    row.className = "trade-table-row trade-contract-row " + getContractTypeClass(contract);
    if (contract.pinned) row.classList.add("is-locked");

    row.addEventListener("click", function (contractId) {
      return function () { postAction("handshake", { contractId: contractId }); };
    }(contract.id));

    row.appendChild(createIconCell(contract, contract.kind === KIND_WILDCARD));
    row.appendChild(createTableCell("trade-col-name", getEntityDisplayName(contract.entityId, contract.displayName) || t("trading.terminal.contract-fallback", "CONTRACT")));
    row.appendChild(createLockCell(contract));
    row.appendChild(createTableCell("trade-col-type " + getContractTypeClass(contract), getContractTypeLabel(contract)));
    row.appendChild(createTableCell("trade-col-amount", formatAmount(contract)));
    row.appendChild(createTableCell("trade-col-price", formatPrice(contract.unitPrice, contract.kind === KIND_WILDCARD)));
    row.appendChild(createTableCell("trade-col-total", formatTotal(contract)));
    list.appendChild(row);
  }

  function getSortValue(contract, column) {
    if (!contract) return "";
    if (column === "name") return getEntityDisplayName(contract.entityId, contract.displayName).toLowerCase();
    if (column === "lock") return contract.pinned ? 1 : 0;
    if (column === "type") return contract.kind === KIND_BUY ? 0 : 1;
    if (column === "amount") return contract.kind === KIND_WILDCARD ? -1 : (contract.amount || 0);
    if (column === "price") return contract.unitPrice || 0;
    if (column === "total") return contract.totalPrice || 0;
    return 0;
  }

  function compareContracts(left, right) {
    if (!state.sortColumn || state.sortDirection === 0) return 0;

    var leftValue = getSortValue(left, state.sortColumn);
    var rightValue = getSortValue(right, state.sortColumn);
    var direction = state.sortDirection;

    if (typeof leftValue === "string") {
      if (leftValue < rightValue) return -direction;
      if (leftValue > rightValue) return direction;
      return 0;
    }

    if (leftValue < rightValue) return -direction;
    if (leftValue > rightValue) return direction;
    return 0;
  }

  function getSortedContracts() {
    var contracts = [];
    var contractIndex;
    for (contractIndex = 0; contractIndex < state.contracts.length; contractIndex++) {
      contracts.push(state.contracts[contractIndex]);
    }

    if (state.sortColumn && state.sortDirection !== 0) {
      contracts.sort(compareContracts);
    }

    return contracts;
  }

  function updateSortHeaders() {
    var headers = document.querySelectorAll(".trade-sort-header");
    var headerIndex;
    for (headerIndex = 0; headerIndex < headers.length; headerIndex++) {
      var header = headers[headerIndex];
      var column = header.getAttribute("data-sort") || "";
      header.classList.remove("is-asc", "is-desc");
      if (column === state.sortColumn) {
        if (state.sortDirection === 1) header.classList.add("is-asc");
        if (state.sortDirection === -1) header.classList.add("is-desc");
      }
    }
  }

  function toggleSort(column) {
    if (state.sortColumn === column) {
      if (state.sortDirection === 1) state.sortDirection = -1;
      else if (state.sortDirection === -1) {
        state.sortColumn = "";
        state.sortDirection = 0;
      } else {
        state.sortDirection = 1;
      }
    } else {
      state.sortColumn = column;
      state.sortDirection = 1;
    }

    state.contractPage = 0;
    updateSortHeaders();
    renderContracts();
  }

  function renderPagination(contractCount) {
    var pageLabel = document.getElementById("contractPageLabel");
    var prevButton = document.getElementById("contractPagePrev");
    var nextButton = document.getElementById("contractPageNext");
    var pageCount = Math.max(1, Math.ceil(contractCount / CONTRACTS_PER_PAGE));

    if (state.contractPage >= pageCount) state.contractPage = pageCount - 1;
    if (state.contractPage < 0) state.contractPage = 0;

    if (pageLabel) pageLabel.textContent = String(state.contractPage + 1) + " / " + String(pageCount);
    if (prevButton) prevButton.disabled = state.contractPage <= 0;
    if (nextButton) nextButton.disabled = state.contractPage >= pageCount - 1;
  }

  function renderContracts() {
    var list = document.getElementById("contractList");
    if (!list) return;
    list.innerHTML = "";

    var sorted = getSortedContracts();
    renderPagination(sorted.length);

    var startIndex = state.contractPage * CONTRACTS_PER_PAGE;
    var endIndex = Math.min(startIndex + CONTRACTS_PER_PAGE, sorted.length);
    for (var contractIndex = startIndex; contractIndex < endIndex; contractIndex++) {
      appendContractRow(list, sorted[contractIndex]);
    }
    syncTypeColumnWidth();
  }

  function appendItemRow(list, item, rowKind, itemIndex) {
    var row = document.createElement("div");
    row.className = "trade-table-row trade-item-row " + rowKind;

    var selectedCount = item.selectedCount !== undefined ? item.selectedCount : item.count;
    if (selectedCount <= 0) row.classList.add("is-skipped");
    if ((item.unitPrice || 0) <= 0) row.classList.add("is-no-reward");

    var lineTotal = item.lineTotal !== undefined ? item.lineTotal : (item.unitPrice || 0) * (item.count || 1);

    row.appendChild(createIconCell(item, false));
    row.appendChild(createTableCell("trade-col-name", getEntityDisplayName(item.entityId, item.displayName) || t("trading.terminal.item-fallback", "ITEM")));
    row.appendChild(createQtyControlsCell(item, itemIndex));
    row.appendChild(createTableCell("trade-col-type " + rowKind, rowKind === "is-buy" ? t("trading.terminal.buy", "BUY") : t("trading.terminal.sell", "SELL")));
    row.appendChild(createTableCell("trade-col-amount", formatItemAmount(item)));
    row.appendChild(createTableCell("trade-col-price", formatPrice(item.unitPrice || 0, false)));
    row.appendChild(createTableCell("trade-col-total", formatPrice(lineTotal, false)));
    list.appendChild(row);
  }

  function renderItemList() {
    var list = document.getElementById("tradeItemList");
    var totals = document.getElementById("tradeItemTotals");
    var itemTable = list ? list.closest(".trade-item-table") : null;
    if (!list || !totals) return;

    list.innerHTML = "";
    totals.textContent = "";

    if (state.screen !== "handshake" || !state.activeContract) {
      if (itemTable) itemTable.classList.add("term-hidden");
      totals.classList.add("term-hidden");
      return;
    }

    var contract = state.activeContract;
    var items = [];
    var rowKind = "is-sell";

    if (contract.kind === KIND_BUY) {
      items = state.previewItems || [];
      rowKind = "is-buy";
    } else {
      items = state.scanItems || [];
      rowKind = "is-sell";
    }

    if (items.length === 0) {
      if (itemTable) itemTable.classList.add("term-hidden");
      totals.classList.add("term-hidden");
      return;
    }

    if (itemTable) itemTable.classList.remove("term-hidden");

    for (var itemIndex = 0; itemIndex < items.length; itemIndex++) {
      appendItemRow(list, items[itemIndex], rowKind, itemIndex);
    }

    totals.textContent = "";
    totals.classList.add("term-hidden");
    syncTypeColumnWidth();
  }

  function updateConfirmButton() {
    var confirmButton = document.getElementById("confirmButton");
    if (!confirmButton) return;

    var contract = state.activeContract;
    var canConfirm = true;

    if (contract && (contract.kind === KIND_SELL || contract.kind === KIND_WILDCARD)) {
      canConfirm = state.scanTotalCount > 0;
    } else if (contract && contract.kind === KIND_BUY) {
      canConfirm = state.previewTotalCount > 0;
    }

    confirmButton.disabled = !canConfirm;
  }

  function renderHandshake() {
    var title = document.getElementById("handshakeTitle");
    var detail = document.getElementById("handshakeDetail");
    var scanButton = document.getElementById("scanButton");
    var statusMessage = document.getElementById("statusMessage");
    var contract = state.activeContract;

    if (title) title.textContent = contract ? (getEntityDisplayName(contract.entityId, contract.displayName) || t("trading.terminal.contract-fallback", "CONTRACT")) : "—";
    if (detail) {
      if (!contract) detail.textContent = "—";
      else if (contract.kind === KIND_BUY) {
        detail.textContent = tFormat("trading.terminal.buy-detail", "BUY UP TO {0} FOR {1} MK", contract.amount, contract.totalPrice);
      } else if (contract.kind === KIND_WILDCARD) {
        detail.textContent = t("trading.terminal.sell-wildcard-detail", "SELL ALL TRADEABLE FOR MARKS (50%)");
      } else {
        detail.textContent = tFormat("trading.terminal.sell-detail", "SELL UP TO {0} FOR {1} MK", contract.amount, contract.totalPrice);
      }
    }

    var isSell = contract && (contract.kind === KIND_SELL || contract.kind === KIND_WILDCARD);
    if (scanButton) scanButton.classList.toggle("term-hidden", !isSell);
    if (statusMessage) statusMessage.textContent = state.statusMessage || "";

    updateConfirmButton();
    renderItemList();
  }

  function clearSuccessOverlayTimer() {
    if (successOverlayTimer) {
      window.clearTimeout(successOverlayTimer);
      successOverlayTimer = 0;
    }
  }

  function hideSuccessOverlay(sendDismiss) {
    clearSuccessOverlayTimer();
    var overlay = document.getElementById("tradeSuccessOverlay");
    if (overlay) overlay.classList.add("term-hidden");
    if (sendDismiss) postAction("dismiss-success");
  }

  function showSuccessOverlay(message) {
    var overlay = document.getElementById("tradeSuccessOverlay");
    var messageElement = document.getElementById("tradeSuccessMessage");
    if (!overlay || !messageElement) return;

    messageElement.textContent = t("trading.terminal.trade-complete", "TRADE COMPLETE");
    overlay.classList.remove("term-hidden");
    clearSuccessOverlayTimer();
    successOverlayTimer = window.setTimeout(function () {
      hideSuccessOverlay(true);
    }, SUCCESS_OVERLAY_MS);
  }

  function applyState(nextState) {
    if (!nextState) return;

    var previousSuccessOverlay = state.successOverlay;
    state.marks = nextState.marks || 0;
    state.inflationMultiplier = nextState.inflationMultiplier || 1;
    state.activeContractId = nextState.activeContractId;
    state.depositSizeX = nextState.depositSizeX || state.depositSizeX;
    state.depositSizeY = nextState.depositSizeY || state.depositSizeY;
    state.depositSizeZ = nextState.depositSizeZ || state.depositSizeZ;
    state.contracts = nextState.contracts || [];
    state.activeContract = nextState.activeContract || null;
    state.scanItems = nextState.scanItems || [];
    state.previewItems = nextState.previewItems || [];
    state.scanTotalCount = nextState.scanTotalCount || 0;
    state.scanTotalPrice = nextState.scanTotalPrice || 0;
    state.previewTotalCount = nextState.previewTotalCount || 0;
    state.previewTotalPrice = nextState.previewTotalPrice || 0;
    state.statusMessage = nextState.statusMessage || "";
    state.successOverlay = nextState.successOverlay || "";

    if (nextState.screen === "handshake" || (nextState.activeContractId !== undefined && nextState.activeContractId >= 0)) {
      setScreen("handshake");
    } else {
      setScreen("contracts");
    }

    if (state.successOverlay && state.successOverlay !== previousSuccessOverlay) {
      showSuccessOverlay(state.successOverlay);
    } else if (!state.successOverlay) {
      hideSuccessOverlay(false);
    }

    updateHeader();
    renderContracts();
    renderHandshake();
  }

  function isClickableElement(element) {
    var node = element;
    while (node && node !== document.body) {
      if (node.disabled) return false;
      if (node.tagName === "BUTTON") return !node.disabled;
      if (node.tagName === "A") return true;
      if (node.classList) {
        if (node.classList.contains("trade-contract-row")) return true;
        if (node.classList.contains("trade-sort-header")) return true;
        if (node.classList.contains("trade-lock-button")) return true;
        if (node.classList.contains("trade-qty-button")) return true;
        if (node.classList.contains("term-button")) return !node.disabled;
      }
      node = node.parentElement;
    }
    return false;
  }

  function updateCrosshairCursorStyle() {
    if (!crosshairCursorElement) return;

    var target = document.elementFromPoint(lastPointerX, lastPointerY);
    var clickable = isClickableElement(target);
    crosshairCursorElement.classList.toggle("is-pointer", clickable);
    crosshairCursorElement.classList.toggle("is-default", !clickable);

    if (crosshairDefaultImage && crosshairPointerImage) {
      crosshairDefaultImage.classList.toggle("term-hidden", clickable);
      crosshairPointerImage.classList.toggle("term-hidden", !clickable);
    }
  }

  function positionCrosshairCursor(clientX, clientY) {
    if (!crosshairCursorElement) return;

    lastPointerX = clientX;
    lastPointerY = clientY;
    crosshairCursorElement.style.left = clientX + "px";
    crosshairCursorElement.style.top = clientY + "px";
    updateCrosshairCursorStyle();
  }

  function initCrosshairCursor() {
    crosshairCursorElement = document.getElementById("termCrosshairCursor");
    if (!crosshairCursorElement) return;

    crosshairDefaultImage = crosshairCursorElement.querySelector(".term-crosshair-cursor-img.is-default");
    crosshairPointerImage = crosshairCursorElement.querySelector(".term-crosshair-cursor-img.is-pointer");

    if (window.vuplex) {
      document.documentElement.classList.add("term-unity-cursor");
    }

    document.addEventListener("mousemove", function (event) {
      if (!pointerVisible) return;
      positionCrosshairCursor(event.clientX, event.clientY);
    });

    document.addEventListener("pointermove", function (event) {
      if (!pointerVisible) return;
      positionCrosshairCursor(event.clientX, event.clientY);
    });
  }

  function wireUi() {
    var sortHeaders = document.querySelectorAll(".trade-sort-header");
    var sortIndex;
    for (sortIndex = 0; sortIndex < sortHeaders.length; sortIndex++) {
      sortHeaders[sortIndex].addEventListener("click", function (event) {
        event.stopPropagation();
        var column = event.currentTarget.getAttribute("data-sort");
        if (column) toggleSort(column);
      });
    }

    var prevButton = document.getElementById("contractPagePrev");
    if (prevButton) {
      prevButton.addEventListener("click", function () {
        if (state.contractPage <= 0) return;
        state.contractPage -= 1;
        renderContracts();
      });
    }

    var nextButton = document.getElementById("contractPageNext");
    if (nextButton) {
      nextButton.addEventListener("click", function () {
        var contractCount = getSortedContracts().length;
        var pageCount = Math.max(1, Math.ceil(contractCount / CONTRACTS_PER_PAGE));
        if (state.contractPage >= pageCount - 1) return;
        state.contractPage += 1;
        renderContracts();
      });
    }

    var scanButton = document.getElementById("scanButton");
    if (scanButton) scanButton.addEventListener("click", function () { postAction("scan"); });

    var confirmButton = document.getElementById("confirmButton");
    if (confirmButton) confirmButton.addEventListener("click", function () { postAction("confirm"); });

    var stopHandshakeButton = document.getElementById("stopHandshakeButton");
    if (stopHandshakeButton) stopHandshakeButton.addEventListener("click", function () { postAction("stop-handshake"); });

    var successContinueButton = document.getElementById("tradeSuccessContinue");
    if (successContinueButton) {
      successContinueButton.addEventListener("click", function () {
        hideSuccessOverlay(true);
      });
    }

    if (!window.vuplex && window.TradingTerminalMock) {
      window.TradingTerminalMock.start();
    }
  }

  window.TradingTerminal = {
    setState: function (nextState) {
      applyState(nextState);
    },
    setIcons: function (iconMap) {
      state.iconMap = iconMap || {};
      renderContracts();
      renderHandshake();
    },
    enableUnityCursor: function () {
      document.documentElement.classList.add("term-unity-cursor");
      initCrosshairCursor();
    },
    setPointerVisible: function (visible) {
      pointerVisible = !!visible;
      if (!crosshairCursorElement) {
        initCrosshairCursor();
      }
      if (!crosshairCursorElement) return;
      crosshairCursorElement.classList.toggle("term-hidden", !pointerVisible);
      if (pointerVisible) {
        updateCrosshairCursorStyle();
      }
    },
    setPointer: function (normalizedX, normalizedY) {
      if (!crosshairCursorElement) {
        initCrosshairCursor();
      }
      if (!crosshairCursorElement) return;
      var width = window.innerWidth || document.documentElement.clientWidth;
      var height = window.innerHeight || document.documentElement.clientHeight;
      positionCrosshairCursor(normalizedX * width, normalizedY * height);
    },
    setGameClock: function (hours, minutes, seconds) {
      var clockElement = document.getElementById("termLocalClock");
      if (!clockElement) return;

      function padTimePart(value) {
        return value < 10 ? "0" + value : String(value);
      }

      clockElement.textContent =
        padTimePart(hours) + ":" +
        padTimePart(minutes) + ":" +
        padTimePart(seconds);
    }
  };

  setScreen("contracts");
  initCrosshairCursor();
  updateSortHeaders();
  wireUi();

  window.addEventListener("web-locale-applied", applyLocaleDom);
  applyLocaleDom();

  if (window.vuplex && window.TradingTerminal.enableUnityCursor) {
    window.TradingTerminal.enableUnityCursor();
  }
})();
