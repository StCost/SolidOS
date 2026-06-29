(function () {
  var KIND_WILDCARD = 0;
  var KIND_SELL = 1;
  var KIND_BUY = 2;
  var CONTRACTS_PER_PAGE = 10;
  var ICON_LOCK_SRC = "icon-lock.svg";
  var ICON_UNLOCK_SRC = "icon-unlock.svg";
  var ICON_BUY_SRC = "icon-buy.svg";
  var ICON_SELL_SRC = "icon-sell.svg";
  var ICON_MARKS_SRC = "icon-marks.svg";
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
    successMarksChange: 0,
    transit: null,
    contractPage: 0,
    sortColumn: "",
    sortDirection: 0,
    iconMap: {}
  };

  var crosshairCursorElement = null;
  var crosshairDefaultImage = null;
  var crosshairPointerImage = null;
  var crosshairForbiddenImage = null;
  var pointerVisible = false;
  var lastPointerX = 0;
  var lastPointerY = 0;
  var successOverlayTimer = 0;

  var TRANSIT_MODE_SEND = "send";
  var TRANSIT_MODE_RECEIVE = "receive";
  var TRANSIT_AUTO_STEPS = { cargo: true, send: true, receive: true };
  var TRANSIT_RECEIVE_PHASE_TWO_START = "receive";
  var TRANSIT_STEP_LOCALE_PREFIX = "trading.terminal.transit.step.";
  var transitAutoOperate = false;
  var transitAutoOperatePending = false;
  var transitAutoOperateTimer = 0;
  var transitStepListRevealKey = "";
  var transitStepStructureKey = "";
  var transitScrollStepId = "";
  var transitAutoOperateTargetStepId = "";
  var handshakeItemListRevealKey = "";
  var contractListRevealKey = "";

  var TRANSIT_SEND_PHASE_ONE_END = "final-scan";
  var TRANSIT_SEND_PHASE_TWO_START = "handshake";

  var TRANSIT_STEP_ICON_MAP = {
    "cargo": "transit-icon-cargo.svg",
    "seal": "transit-icon-seal.svg",
    "vacuum": "transit-icon-vacuum.svg",
    "handshake": "transit-icon-handshake.svg",
    "he3-fill": "transit-icon-he3-fill.svg",
    "magnetic-trap": "transit-icon-magnetic-trap.svg",
    "optical-trap": "transit-icon-optical-trap.svg",
    "optical-detrap": "transit-icon-optical-trap.svg",
    "final-scan": "transit-icon-final-scan.svg",
    "collapse": "transit-icon-collapse.svg",
    "send": "transit-icon-send.svg",
    "receive": "transit-icon-receive.svg",
    "deflood": "transit-icon-deflood.svg",
    "devacuum": "transit-icon-devacuum.svg",
    "deseal": "transit-icon-deseal.svg"
  };

  function getTransitStepIconSrc(stepId) {
    if (!stepId) return "";
    return TRANSIT_STEP_ICON_MAP[stepId] || "transit-icon-step.svg";
  }

  function getTransitStepLabel(stepId) {
    return t(TRANSIT_STEP_LOCALE_PREFIX + stepId, stepId.toUpperCase().replace(/-/g, " "));
  }

  function getUiSounds() {
    return window.TradingTerminalUiSounds;
  }

  function getTransitStepIndex(transit, stepId) {
    if (!transit || !transit.stepOrder || !stepId) return -1;
    var index;
    for (index = 0; index < transit.stepOrder.length; index++) {
      if (transit.stepOrder[index] === stepId) return index;
    }
    return -1;
  }

  function isTransitStepCompleted(transit, stepId) {
    if (!transit || !stepId) return false;
    if (transit.completedStepIds) {
      var index;
      for (index = 0; index < transit.completedStepIds.length; index++) {
        if (transit.completedStepIds[index] === stepId) return true;
      }
    }
    var activeStepId = transit.activeStepId || "";
    if (!activeStepId) return false;
    var stepIndex = getTransitStepIndex(transit, stepId);
    var activeIndex = getTransitStepIndex(transit, activeStepId);
    return stepIndex >= 0 && activeIndex >= 0 && stepIndex < activeIndex;
  }

  function getTransitStepDelaySeconds(transit, stepId) {
    if (!transit || !transit.stepDelays) return 0;
    var delays = transit.stepDelays;
    if (stepId === "seal") return delays.sealSeconds || 0;
    if (stepId === "vacuum") return delays.vacuumSeconds || 0;
    if (stepId === "handshake") return delays.handshakeSeconds || 0;
    if (stepId === "he3-fill") return delays.he3FillSeconds || 0;
    if (stepId === "magnetic-trap") return delays.magneticTrapSeconds || 0;
    if (stepId === "optical-trap") return delays.opticalTrapSeconds || 0;
    if (stepId === "optical-detrap") return delays.opticalDetrapSeconds || 0;
    if (stepId === "devacuum") return delays.devacuumSeconds || 0;
    if (stepId === "deseal") return delays.desealSeconds || 0;
    if (stepId === "deflood") return delays.defloodSeconds || 0;
    if (stepId === "final-scan" || stepId === "collapse" || stepId === "send" || stepId === "receive") {
      return delays.instantStepSeconds || 0;
    }
    return 0;
  }

  function getTransitPhaseLabel(transit) {
    if (!transit || !transit.active) return "";
    if (transit.mode === TRANSIT_MODE_RECEIVE) {
      if (!isTransitStepCompleted(transit, "handshake")) {
        return t("trading.terminal.transit.phase.prep", "PHASE I: PRE-LAUNCH PREPARATION");
      }
      if (!isTransitStepCompleted(transit, TRANSIT_RECEIVE_PHASE_TWO_START)) {
        return t("trading.terminal.transit.phase.transit", "PHASE II: INCOMING TRANSIT");
      }
      return t("trading.terminal.transit.phase.receive", "PHASE III: RECEPTION");
    }
    var activeStepId = transit.activeStepId || "";
    if (!isTransitStepCompleted(transit, TRANSIT_SEND_PHASE_TWO_START)) {
      return t("trading.terminal.transit.phase.prep", "PHASE I: PRE-LAUNCH PREPARATION");
    }
    if (!isTransitStepCompleted(transit, "send")) {
      return t("trading.terminal.transit.phase.transmit", "PHASE II: OUTGOING TRANSMIT PIPELINE");
    }
    return t("trading.terminal.transit.phase.receive", "PHASE III: RECEPTION AND DESEAL");
  }

  function isTransitStepButtonDisabled(button) {
    if (!button || !button.classList || !button.classList.contains("trade-transit-step-button")) {
      return false;
    }

    if (button.disabled) {
      return true;
    }

    return button.classList.contains("is-complete")
      || button.classList.contains("is-pending")
      || button.classList.contains("is-auto")
      || button.classList.contains("is-running");
  }

  function getTransitStepStructureKey(transit) {
    if (!transit) return "";
    return [
      transit.activeStepId || "",
      transit.activeStepRunning ? "1" : "0",
      (transit.completedStepIds || []).join(","),
      transit.canCancelTransit ? "1" : "0"
    ].join("|");
  }

  function getTransitStepRuntimeState(transit, stepId) {
    var isComplete = isTransitStepCompleted(transit, stepId);
    var isActive = !isComplete && transit.activeStepId === stepId;
    var isRunning = isActive && (transit.activeStepRunning || ((transit.activeStepProgress || 0) > 0 && (transit.activeStepProgress || 0) < 1));
    var isAuto = !!TRANSIT_AUTO_STEPS[stepId];
    var isInteractive = isActive && !isAuto && !isComplete && !isRunning;
    return {
      isComplete: isComplete,
      isActive: isActive,
      isRunning: isRunning,
      isAuto: isAuto,
      isInteractive: isInteractive
    };
  }

  function updateTransitStepProgressDom(stepList, transit) {
    var stepOrder = transit.stepOrder || [];
    var stepIndex;
    for (stepIndex = 0; stepIndex < stepOrder.length; stepIndex++) {
      var stepId = stepOrder[stepIndex];
      var stepWrap = stepList.querySelector('[data-step-id="' + stepId + '"]');
      if (!stepWrap) return false;

      var runtimeState = getTransitStepRuntimeState(transit, stepId);
      var progress = stepWrap.querySelector(".trade-transit-progress");
      var progressFill = stepWrap.querySelector(".trade-transit-progress-fill");
      if (!progress || !progressFill) return false;

      progress.classList.toggle("is-complete", runtimeState.isComplete);
      var progressValue = 0;
      if (runtimeState.isComplete) {
        progressValue = 100;
      } else if (runtimeState.isRunning) {
        progressValue = Math.round((transit.activeStepProgress || 0) * 100);
      }
      progressFill.style.width = String(progressValue) + "%";
    }
    return true;
  }

  function scrollTransitActiveStepIntoView(stepList, transit, smooth) {
    if (!stepList || !transit || !transit.activeStepId) return;
    var activeStep = stepList.querySelector('[data-step-id="' + transit.activeStepId + '"]');
    if (!activeStep) return;
    var containerHeight = stepList.clientHeight;
    if (containerHeight <= 0) return;
    var stepTop = activeStep.offsetTop;
    var stepHeight = activeStep.offsetHeight;
    var targetScrollTop = stepTop - Math.max(0, (containerHeight - stepHeight) * 0.5);
    var maxScrollTop = stepList.scrollHeight - containerHeight;
    if (targetScrollTop < 0) targetScrollTop = 0;
    if (targetScrollTop > maxScrollTop) targetScrollTop = maxScrollTop;
    if (smooth && stepList.scrollTo) {
      stepList.scrollTo({ top: targetScrollTop, behavior: "smooth" });
    } else {
      stepList.scrollTop = targetScrollTop;
    }
  }

  function updateTransitToolbar(transit) {
    var backButton = document.getElementById("transitBackButton");

    if (backButton) {
      var canCancel = !!(transit && transit.canCancelTransit);
      backButton.disabled = !canCancel;
      backButton.textContent = t("trading.terminal.back", "Back");
    }
  }

  function renderTransitScreen() {
    var stepList = document.getElementById("transitStepList");
    var transit = state.transit;

    if (!stepList) return;

    if (!transit || !transit.active || state.screen !== "transit") {
      stepList.innerHTML = "";
      transitStepListRevealKey = "";
      transitStepStructureKey = "";
      transitScrollStepId = "";
      clearTransitAutoOperateTimer();
      updateTransitToolbar(null);
      return;
    }

    updateWindowChrome();
    updateTransitToolbar(transit);

    var structureKey = getTransitStepStructureKey(transit);
    if (structureKey === transitStepStructureKey && stepList.childElementCount > 0) {
      if (updateTransitStepProgressDom(stepList, transit)) {
        scrollTransitActiveStepIntoView(stepList, transit, false);
        maybeAutoOperateTransitStep();
        return;
      }
    }
    transitStepStructureKey = structureKey;

    var revealKey = "transit";
    var animateRows = revealKey !== transitStepListRevealKey;
    if (animateRows) {
      transitStepListRevealKey = revealKey;
    }

    stepList.innerHTML = "";
    var stepOrder = transit.stepOrder || [];
    var stepIndex;
    for (stepIndex = 0; stepIndex < stepOrder.length; stepIndex++) {
      var stepId = stepOrder[stepIndex];
      var runtimeState = getTransitStepRuntimeState(transit, stepId);
      var isComplete = runtimeState.isComplete;
      var isActive = runtimeState.isActive;
      var isRunning = runtimeState.isRunning;
      var isAuto = runtimeState.isAuto;
      var isInteractive = runtimeState.isInteractive;

      var stepWrap = document.createElement("div");
      stepWrap.className = "trade-transit-step";
      stepWrap.setAttribute("data-step-id", stepId);

      var button = document.createElement("button");
      button.type = "button";
      button.className = "term-button trade-transit-step-button";
      if (isComplete) button.classList.add("is-complete");
      else if (isRunning) button.classList.add("is-running");
      else if (isActive && isAuto) button.classList.add("is-auto");
      else if (isActive) button.classList.add("is-active");
      else button.classList.add("is-pending");

      if (!isInteractive) {
        button.disabled = true;
      }

      var label = document.createElement("span");
      label.className = "trade-transit-step-label";
      label.textContent = getTransitStepLabel(stepId);

      var icon = document.createElement("img");
      icon.className = "trade-transit-step-icon";
      icon.alt = "";
      icon.src = getTransitStepIconSrc(stepId);

      button.appendChild(icon);
      button.appendChild(label);

      if (isInteractive) {
        button.addEventListener("click", function (clickedStepId) {
          return function () {
            postAction("transit-step", { stepId: clickedStepId });
          };
        }(stepId));
      }

      stepWrap.appendChild(button);

      var progress = document.createElement("div");
      progress.className = "trade-transit-progress";
      if (isComplete) {
        progress.classList.add("is-complete");
      }
      var progressFill = document.createElement("div");
      progressFill.className = "trade-transit-progress-fill";
      var progressValue = 0;
      if (isComplete) {
        progressValue = 100;
      } else if (isRunning) {
        progressValue = Math.round((transit.activeStepProgress || 0) * 100);
      }
      progressFill.style.width = String(progressValue) + "%";
      progress.appendChild(progressFill);

      stepWrap.appendChild(progress);
      if (animateRows) {
        setRowRevealAnimation(stepWrap, stepIndex);
      }
      stepList.appendChild(stepWrap);
    }

    var scrollStepId = transit.activeStepId || "";
    var stepChanged = scrollStepId !== transitScrollStepId;
    if (stepChanged) {
      transitScrollStepId = scrollStepId;
    }
    scrollTransitActiveStepIntoView(stepList, transit, stepChanged);

    maybeAutoOperateTransitStep();
  }

  function clearTransitAutoOperateTimer() {
    if (transitAutoOperateTimer) {
      window.clearTimeout(transitAutoOperateTimer);
      transitAutoOperateTimer = 0;
    }
    transitAutoOperatePending = false;
    transitAutoOperateTargetStepId = "";
  }

  function maybeAutoOperateTransitStep() {
    if (!transitAutoOperate) return;
    var transit = state.transit;
    if (!transit || !transit.active || transit.activeStepRunning) return;

    var stepId = transit.activeStepId;
    if (!stepId || TRANSIT_AUTO_STEPS[stepId] || isTransitStepCompleted(transit, stepId)) return;
    if (transitAutoOperatePending && transitAutoOperateTargetStepId === stepId) return;

    transitAutoOperateTargetStepId = stepId;
    transitAutoOperatePending = true;
    transitAutoOperateTimer = window.setTimeout(function () {
      transitAutoOperateTimer = 0;
      transitAutoOperatePending = false;
      postAction("transit-step", { stepId: stepId });
    }, 0);
  }

  function isTransitActive() {
    return !!(state.transit && state.transit.active);
  }

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
  var UNKNOWN_ITEM_DISPLAY_SENTINEL = "Unknown";

  function getUnknownItemDisplayName() {
    return t("trading.terminal.unknown-item", "Unknown");
  }

  function getEntityDisplayName(entityId, fallbackDisplayName) {
    var localeKey;
    var localized;
    if (!entityId) {
      if (!fallbackDisplayName || fallbackDisplayName === UNKNOWN_ITEM_DISPLAY_SENTINEL) {
        return getUnknownItemDisplayName();
      }
      return fallbackDisplayName;
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
    updateHeader();
    renderContracts();
    renderHandshake();
    if (state.screen === "success") {
      renderSuccessScreen();
    }
    renderTransitScreen();
    updateWindowChrome();
  }

  function resolveScreen(nextState) {
    if (nextState.transit && nextState.transit.active) return "transit";
    if (nextState.successOverlay) return "success";
    if (nextState.screen === "handshake" || (nextState.activeContractId !== undefined && nextState.activeContractId >= 0)) {
      return "handshake";
    }
    return "contracts";
  }

  function updateWindowChrome() {
    var titleElement = document.getElementById("termWindowTitleText");
    if (!titleElement) return;

    if (state.screen === "transit") {
      var phaseLabel = getTransitPhaseLabel(state.transit);
      titleElement.textContent = phaseLabel || t("trading.terminal.transit.title", "Mass-transit sequence");
      return;
    }
    if (state.screen === "success") {
      titleElement.textContent = t("trading.terminal.success", "SUCCESS");
      return;
    }
    if (state.screen === "handshake" && state.activeContract) {
      titleElement.textContent = getEntityDisplayName(state.activeContract.entityId, state.activeContract.displayName) || t("trading.terminal.contract-fallback", "CONTRACT");
      return;
    }
    titleElement.textContent = t("trading.terminal.title", "TRADING TERMINAL");
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
    var transitScreen = document.getElementById("transitScreen");
    var successScreen = document.getElementById("successScreen");
    var termFrame = document.querySelector(".term-frame");
    if (contractsScreen) contractsScreen.classList.toggle("term-hidden", screenName !== "contracts");
    if (handshakeScreen) handshakeScreen.classList.toggle("term-hidden", screenName !== "handshake");
    if (transitScreen) transitScreen.classList.toggle("term-hidden", screenName !== "transit");
    if (successScreen) successScreen.classList.toggle("term-hidden", screenName !== "success");
    if (termFrame) termFrame.classList.toggle("is-transit-screen", screenName === "transit");
    updateDockFooter();
    updateWindowChrome();
  }

  var ROW_REVEAL_DELAY_MS = 40;

  function setRowRevealAnimation(row, revealIndex) {
    if (!row || revealIndex === undefined || revealIndex < 0) return;
    row.classList.add("is-revealing");
    row.style.animationDelay = String(revealIndex * ROW_REVEAL_DELAY_MS) + "ms";
  }

  function updateDockFooter() {
    var dockFooter = document.getElementById("tradeDockFooter");
    var dockPagination = document.getElementById("tradeDockPagination");
    var showDock = state.screen === "contracts" || state.screen === "handshake";
    if (dockFooter) dockFooter.classList.toggle("term-hidden", !showDock);
    if (dockPagination) dockPagination.classList.toggle("term-hidden", state.screen !== "contracts");
  }

  function updateHeader() {
    var marksValue = document.getElementById("marksValue");
    if (marksValue) setMarksAmountElement(marksValue, state.marks, null, true);
  }

  function createMarksIconElement(className) {
    var icon = document.createElement("img");
    icon.className = className || "trade-marks-icon";
    icon.alt = "";
    icon.src = ICON_MARKS_SRC;
    return icon;
  }

  function setMarksAmountElement(element, amount, prefix, includeMarksLabel) {
    if (!element) return;
    element.textContent = "";
    var wrap = document.createElement("span");
    wrap.className = "trade-marks-inline";
    if (prefix) wrap.appendChild(document.createTextNode(prefix));
    wrap.appendChild(document.createTextNode(String(amount)));
    wrap.appendChild(createMarksIconElement());
    if (includeMarksLabel) {
      var marksLabel = document.createElement("span");
      marksLabel.className = "trade-marks-label";
      marksLabel.setAttribute("data-locale-key", "trading.terminal.marks");
      marksLabel.textContent = t("trading.terminal.marks", "Marks");
      wrap.appendChild(marksLabel);
    }
    element.appendChild(wrap);
  }

  function appendMarksAmountInline(parent, amount, prefix) {
    if (!parent) return;
    var wrap = document.createElement("span");
    wrap.className = "trade-marks-inline";
    if (prefix) wrap.appendChild(document.createTextNode(prefix));
    wrap.appendChild(document.createTextNode(String(amount)));
    wrap.appendChild(createMarksIconElement());
    parent.appendChild(wrap);
  }

  function setTextWithMarksPrice(element, templateKey, fallback, amount, price) {
    if (!element) return;
    element.textContent = "";
    var template = t(templateKey, fallback);
    var priceMarker = "{1}";
    var markerIndex = template.indexOf(priceMarker);
    var beforePart = markerIndex >= 0 ? template.substring(0, markerIndex) : template;
    var afterPart = markerIndex >= 0 ? template.substring(markerIndex + priceMarker.length) : "";
    beforePart = beforePart.split("{0}").join(String(amount));
    afterPart = afterPart.split("{0}").join(String(amount));
    if (beforePart) element.appendChild(document.createTextNode(beforePart));
    appendMarksAmountInline(element, price);
    if (afterPart) element.appendChild(document.createTextNode(afterPart));
  }

  function setTextWithMarksAmount(element, templateKey, fallback, amount) {
    if (!element) return;
    element.textContent = "";
    var template = t(templateKey, fallback);
    var amountMarker = "{0}";
    var markerIndex = template.indexOf(amountMarker);
    var beforePart = markerIndex >= 0 ? template.substring(0, markerIndex) : template;
    var afterPart = markerIndex >= 0 ? template.substring(markerIndex + amountMarker.length) : "";
    if (beforePart) element.appendChild(document.createTextNode(beforePart));
    appendMarksAmountInline(element, amount);
    if (afterPart) element.appendChild(document.createTextNode(afterPart));
  }

  function getIconUrl(itemOrContract) {
    if (!itemOrContract) return "";
    var assetId = itemOrContract.assetId;
    if (!assetId) return "";
    return state.iconMap[String(assetId)] || state.iconMap[assetId] || "";
  }

  function getContractTypeClass(contract) {
    if (!contract) return "";
    if (contract.kind === KIND_BUY) return "is-buy";
    return "is-sell";
  }

  function createMarksAmountCell(className, value, wildcard) {
    var cell = document.createElement("span");
    cell.className = "trade-col " + className;
    if (wildcard) {
      cell.textContent = "50%";
      return cell;
    }
    setMarksAmountElement(cell, value);
    return cell;
  }

  function isContractDisabled(contract) {
    if (!contract || contract.kind === KIND_WILDCARD) return false;
    if (contract.selectable === false) return true;
    return (contract.amount || 0) <= 0;
  }

  function formatAmount(contract) {
    if (!contract) return "—";
    if (contract.kind === KIND_WILDCARD) return t("trading.terminal.all", "ALL");
    if (isContractDisabled(contract)) return "0";
    if (contract.amount > 0) return String(contract.amount);
    return "—";
  }

  function formatItemAmount(item, isBuy) {
    var count = item.count || 0;
    if (!isBuy) return String(count);
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

  function createTypeIconCell(typeClass, isBuy) {
    var cell = document.createElement("span");
    cell.className = "trade-col trade-col-type " + typeClass;

    var icon = document.createElement("img");
    icon.className = "trade-type-icon";
    icon.alt = "";
    icon.src = isBuy ? ICON_BUY_SRC : ICON_SELL_SRC;
    cell.appendChild(icon);
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

  function createQtyControlsCell(item, itemIndex, showControls) {
    var qtyCell = document.createElement("span");
    qtyCell.className = "trade-col trade-col-lock";

    if (!showControls || !item || (item.unitPrice || 0) <= 0) {
      return qtyCell;
    }

    var controls = document.createElement("span");
    controls.className = "trade-qty-controls";

    var decreaseRow = document.createElement("span");
    decreaseRow.className = "trade-qty-row trade-qty-row-decrease";
    decreaseRow.appendChild(createQtyButton("0", "zero", itemIndex));
    decreaseRow.appendChild(createQtyButton("-10", "minus-ten", itemIndex));
    decreaseRow.appendChild(createQtyButton("-1", "minus-one", itemIndex));

    var increaseRow = document.createElement("span");
    increaseRow.className = "trade-qty-row trade-qty-row-increase";
    increaseRow.appendChild(createQtyButton("+1", "plus-one", itemIndex));
    increaseRow.appendChild(createQtyButton("+10", "plus-ten", itemIndex));
    increaseRow.appendChild(createQtyButton("MAX", "max", itemIndex));

    controls.appendChild(decreaseRow);
    controls.appendChild(increaseRow);
    qtyCell.appendChild(controls);
    return qtyCell;
  }

  function appendContractRow(list, contract, revealIndex) {
    var row = document.createElement("div");
    row.className = "trade-table-row trade-contract-row " + getContractTypeClass(contract);
    if (contract.pinned) row.classList.add("is-locked");
    if (isContractDisabled(contract)) row.classList.add("is-disabled");

    if (!isContractDisabled(contract)) {
      row.addEventListener("click", function (contractId) {
        return function () { postAction("handshake", { contractId: contractId }); };
      }(contract.id));
    }

    row.appendChild(createIconCell(contract, contract.kind === KIND_WILDCARD));
    row.appendChild(createTableCell("trade-col-name", getEntityDisplayName(contract.entityId, contract.displayName) || t("trading.terminal.contract-fallback", "CONTRACT")));
    row.appendChild(createLockCell(contract));
    row.appendChild(createTypeIconCell(getContractTypeClass(contract), contract.kind === KIND_BUY));
    row.appendChild(createTableCell("trade-col-amount", formatAmount(contract)));
    row.appendChild(createMarksAmountCell("trade-col-price", contract.unitPrice, contract.kind === KIND_WILDCARD));
    row.appendChild(createMarksAmountCell("trade-col-total", contract.totalPrice, contract.kind === KIND_WILDCARD));
    setRowRevealAnimation(row, revealIndex);
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

  function getContractListStructureKey() {
    var keyParts = [];
    var contracts = state.contracts || [];
    var contractIndex;
    for (contractIndex = 0; contractIndex < contracts.length; contractIndex++) {
      var contract = contracts[contractIndex];
      if (!contract) continue;
      keyParts.push(
        String(contract.id) + ":" +
        String(contract.kind) + ":" +
        String(contract.amount || 0) + ":" +
        String(contract.assetId || contract.entityId || "")
      );
    }
    return keyParts.join("|");
  }

  function renderContracts() {
    var list = document.getElementById("contractList");
    if (!list) return;
    list.innerHTML = "";

    var sorted = getSortedContracts();
    renderPagination(sorted.length);

    var structureKey = getContractListStructureKey();
    var animateRows = structureKey !== contractListRevealKey;
    if (animateRows) {
      contractListRevealKey = structureKey;
    }

    var startIndex = state.contractPage * CONTRACTS_PER_PAGE;
    var endIndex = Math.min(startIndex + CONTRACTS_PER_PAGE, sorted.length);
    for (var contractIndex = startIndex; contractIndex < endIndex; contractIndex++) {
      appendContractRow(list, sorted[contractIndex], animateRows ? (contractIndex - startIndex) : -1);
    }
  }

  function appendItemRow(list, item, rowKind, itemIndex, revealIndex) {
    var row = document.createElement("div");
    row.className = "trade-table-row trade-item-row " + rowKind;
    var isBuy = rowKind === "is-buy";

    var selectedCount = item.selectedCount !== undefined ? item.selectedCount : item.count;
    if (selectedCount <= 0) row.classList.add("is-skipped");
    if ((item.unitPrice || 0) <= 0) row.classList.add("is-no-reward");

    var lineTotal = item.lineTotal !== undefined ? item.lineTotal : (item.unitPrice || 0) * (item.count || 1);

    row.appendChild(createIconCell(item, false));
    row.appendChild(createTableCell("trade-col-name", getEntityDisplayName(item.entityId, item.displayName) || t("trading.terminal.item-fallback", "ITEM")));
    row.appendChild(createQtyControlsCell(item, itemIndex, isBuy));
    row.appendChild(createTypeIconCell(rowKind, isBuy));
    row.appendChild(createTableCell("trade-col-amount", formatItemAmount(item, isBuy)));
    row.appendChild(createMarksAmountCell("trade-col-price", item.unitPrice || 0, false));
    row.appendChild(createMarksAmountCell("trade-col-total", lineTotal, false));
    setRowRevealAnimation(row, revealIndex);
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
      handshakeItemListRevealKey = "";
      return;
    }

    var contract = state.activeContract;
    var items = [];
    var rowKind = "is-sell";
    var contractKind = getContractKind(contract);

    if (contractKind === KIND_BUY) {
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

    var revealKey = String(state.activeContractId) + ":" + String(items.length);
    var animateRows = revealKey !== handshakeItemListRevealKey;
    if (animateRows) {
      handshakeItemListRevealKey = revealKey;
    }

    for (var itemIndex = 0; itemIndex < items.length; itemIndex++) {
      appendItemRow(list, items[itemIndex], rowKind, itemIndex, animateRows ? itemIndex : -1);
    }

    totals.textContent = "";
    totals.classList.add("term-hidden");
  }

  function getContractKind(contract) {
    if (!contract) return -1;
    return Number(contract.kind);
  }

  function getPreviewSelectionTotals() {
    var items = state.previewItems || [];
    var count = 0;
    var price = 0;
    var index;
    for (index = 0; index < items.length; index++) {
      var item = items[index];
      var selectedCount = item.selectedCount !== undefined ? item.selectedCount : (item.count || 0);
      if (selectedCount < 0) selectedCount = 0;
      var lineTotal = item.lineTotal !== undefined ? item.lineTotal : (item.unitPrice || 0) * selectedCount;
      count += selectedCount;
      price += lineTotal;
    }
    return { count: count, price: price };
  }

  function updateConfirmButton() {
    var confirmButton = document.getElementById("confirmButton");
    if (!confirmButton) return;

    if (isTransitActive()) {
      confirmButton.disabled = true;
      return;
    }

    var contract = state.activeContract;
    var canConfirm = true;
    var contractKind = getContractKind(contract);

    if (contractKind === KIND_SELL || contractKind === KIND_WILDCARD) {
      canConfirm = state.scanTotalCount > 0;
    } else if (contractKind === KIND_BUY) {
      var previewTotals = getPreviewSelectionTotals();
      var previewCount = previewTotals.count > 0 ? previewTotals.count : state.previewTotalCount;
      canConfirm = previewCount > 0;
    }

    confirmButton.disabled = !canConfirm;
  }

  function renderHandshake() {
    var title = document.getElementById("handshakeTitle");
    var detail = document.getElementById("handshakeDetail");
    var scanButton = document.getElementById("scanButton");
    var stopHandshakeButton = document.getElementById("stopHandshakeButton");
    var statusMessage = document.getElementById("statusMessage");
    var contract = state.activeContract;

    if (title) title.textContent = contract ? (getEntityDisplayName(contract.entityId, contract.displayName) || t("trading.terminal.contract-fallback", "CONTRACT")) : "—";
    if (detail) {
      if (!contract) detail.textContent = "—";
      else if (getContractKind(contract) === KIND_BUY) {
        setTextWithMarksPrice(detail, "trading.terminal.buy-detail", "BUY UP TO {0} FOR {1}", contract.amount, contract.totalPrice);
      } else if (getContractKind(contract) === KIND_WILDCARD) {
        detail.textContent = t("trading.terminal.sell-wildcard-detail", "SELL ALL TRADEABLE (50%)");
      } else {
        setTextWithMarksPrice(detail, "trading.terminal.sell-detail", "SELL UP TO {0} FOR {1}", contract.amount, contract.totalPrice);
      }
    }

    var contractKind = getContractKind(contract);
    var isSell = contractKind === KIND_SELL || contractKind === KIND_WILDCARD;
    if (scanButton) scanButton.classList.toggle("term-hidden", !isSell);
    if (scanButton && isTransitActive()) scanButton.disabled = true;
    else if (scanButton) scanButton.disabled = false;
    if (stopHandshakeButton && isTransitActive()) stopHandshakeButton.disabled = true;
    else if (stopHandshakeButton) stopHandshakeButton.disabled = false;
    if (statusMessage) {
      statusMessage.textContent = state.statusMessage
        ? t(state.statusMessage, state.statusMessage)
        : "";
    }

    updateConfirmButton();
    renderItemList();
  }

  function clearSuccessOverlayTimer() {
    if (successOverlayTimer) {
      window.clearTimeout(successOverlayTimer);
      successOverlayTimer = 0;
    }
  }

  function resetSuccessProgressBar() {
    var progressFill = document.getElementById("tradeSuccessProgressFill");
    if (!progressFill) return;

    progressFill.classList.remove("is-running");
    progressFill.style.removeProperty("animation-duration");
    void progressFill.offsetWidth;
    progressFill.style.animationDuration = String(SUCCESS_OVERLAY_MS) + "ms";
    progressFill.classList.add("is-running");
  }

  function clearSuccessProgressBar() {
    var progressFill = document.getElementById("tradeSuccessProgressFill");
    if (!progressFill) return;

    progressFill.classList.remove("is-running");
    progressFill.style.removeProperty("animation-duration");
  }

  function renderSuccessScreen() {
    var messageElement = document.getElementById("tradeSuccessMessage");
    var marksChangeElement = document.getElementById("tradeSuccessMarksChange");
    var marksBalanceElement = document.getElementById("tradeSuccessMarksBalance");
    if (!messageElement) return;

    messageElement.textContent = t("trading.terminal.trade-complete", "TRADE COMPLETE");

    if (marksChangeElement) {
      marksChangeElement.textContent = "";
      marksChangeElement.classList.remove("is-added", "is-removed");
      var marksChange = state.successMarksChange || 0;
      if (marksChange > 0) {
        setTextWithMarksAmount(marksChangeElement, "trading.terminal.marks-added", "+{0}", marksChange);
        marksChangeElement.classList.add("is-added");
      } else if (marksChange < 0) {
        setTextWithMarksAmount(marksChangeElement, "trading.terminal.marks-removed", "{0}", marksChange);
        marksChangeElement.classList.add("is-removed");
      }
    }

    if (marksBalanceElement) {
      setTextWithMarksAmount(marksBalanceElement, "trading.terminal.marks-balance", "BALANCE {0}", state.marks);
    }
  }

  function hideSuccessOverlay(sendDismiss) {
    clearSuccessOverlayTimer();
    clearSuccessProgressBar();
    if (sendDismiss) postAction("dismiss-success");
  }

  function showSuccessOverlay() {
    setScreen("success");
    renderSuccessScreen();
    clearSuccessOverlayTimer();
    resetSuccessProgressBar();
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
    state.successMarksChange = nextState.successMarksChange || 0;
    state.transit = nextState.transit || null;

    var previousScreen = state.screen;
    var nextScreen = resolveScreen(nextState);
    if (nextScreen === "handshake" && previousScreen !== "handshake") {
      handshakeItemListRevealKey = "";
    }
    if (nextScreen === "contracts" && previousScreen !== "contracts") {
      contractListRevealKey = "";
    }

    setScreen(nextScreen);

    if (state.successOverlay && state.successOverlay !== previousSuccessOverlay) {
      showSuccessOverlay();
    } else if (state.successOverlay) {
      renderSuccessScreen();
    } else if (previousSuccessOverlay) {
      hideSuccessOverlay(false);
    }

    updateHeader();
    renderContracts();
    renderHandshake();
    renderTransitScreen();
  }

  function isInsideLockButton(element) {
    var node = element;
    while (node && node !== document.body) {
      if (node.classList && node.classList.contains("trade-lock-button")) return true;
      node = node.parentElement;
    }
    return false;
  }

  function isDisabledInteractiveElement(element) {
    if (isInsideLockButton(element)) return false;

    var node = element;
    while (node && node !== document.body) {
      if (node.classList) {
        if (node.classList.contains("trade-contract-row") && node.classList.contains("is-disabled")) return true;
        if (node.classList.contains("trade-transit-step-button") && isTransitStepButtonDisabled(node)) return true;
        if (node.classList.contains("os-window-control") && node.disabled) return true;
      }
      if (node.tagName === "BUTTON" && node.disabled) return true;
      node = node.parentElement;
    }
    return false;
  }

  function setCrosshairCursorMode(mode) {
    if (!crosshairCursorElement) return;

    crosshairCursorElement.classList.toggle("is-default", mode === "default");
    crosshairCursorElement.classList.toggle("is-pointer", mode === "pointer");
    crosshairCursorElement.classList.toggle("is-forbidden", mode === "forbidden");

    if (crosshairDefaultImage && crosshairPointerImage && crosshairForbiddenImage) {
      crosshairDefaultImage.classList.toggle("term-hidden", mode !== "default");
      crosshairPointerImage.classList.toggle("term-hidden", mode !== "pointer");
      crosshairForbiddenImage.classList.toggle("term-hidden", mode !== "forbidden");
    }
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
        if (node.classList.contains("trade-transit-step-button")) return !isTransitStepButtonDisabled(node);
        if (node.classList.contains("settings-switch")) return true;
        if (node.classList.contains("term-button")) return !node.disabled;
      }
      node = node.parentElement;
    }
    return false;
  }

  function updateCrosshairCursorStyle() {
    if (!crosshairCursorElement) return;

    var target = document.elementFromPoint(lastPointerX, lastPointerY);
    var disabled = isDisabledInteractiveElement(target);
    var clickable = !disabled && isClickableElement(target);
    var mode = disabled ? "forbidden" : (clickable ? "pointer" : "default");
    setCrosshairCursorMode(mode);
    var uiSounds = getUiSounds();
    if (uiSounds && uiSounds.playHoverAtPoint) {
      uiSounds.playHoverAtPoint(lastPointerX, lastPointerY, mode);
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
    crosshairForbiddenImage = crosshairCursorElement.querySelector(".term-crosshair-cursor-img.is-forbidden");

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
    document.addEventListener("click", function (event) {
      if (!isClickableElement(event.target)) {
        return;
      }
      var uiSounds = getUiSounds();
      if (uiSounds && uiSounds.playClick) {
        uiSounds.playClick();
      }
    }, true);

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

    var transitBackButton = document.getElementById("transitBackButton");
    if (transitBackButton) {
      transitBackButton.addEventListener("click", function () {
        if (transitBackButton.disabled) return;
        postAction("cancel-transit");
      });
    }

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
        var uiSounds = getUiSounds();
        if (uiSounds && uiSounds.unlock) {
          uiSounds.unlock();
        }
        updateCrosshairCursorStyle();
      } else {
        var uiSounds = getUiSounds();
        if (uiSounds && uiSounds.resetHover) {
          uiSounds.resetHover();
        }
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
    },
    setTransitAutoOperate: function (enabled) {
      transitAutoOperate = !!enabled;
      maybeAutoOperateTransitStep();
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
