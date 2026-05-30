(function () {
  var SLOT_COUNT = 12;
  var SLOT_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="];
  var BAR_HEALTH = 25;
  var DEFAULT_HEALTH = 100;
  var DEFAULT_MAX_HEALTH = 100;
  var DEFAULT_HEALTH_FULL_COLOR = "rgba(255, 128, 64, 1)";
  var DEFAULT_HEALTH_EMPTY_COLOR = "rgba(0, 0, 0, 0.55)";
  var DEFAULT_SLOT_SELECTED = "rgba(58, 26, 10, 0.94)";
  var DEFAULT_SLOT_BG = "rgba(6, 8, 11, 0.94)";
  var DEFAULT_SLOT_HOLSTERED = "rgba(255, 128, 64, 0.25)";
  var ICON_FADE_OUT_MS = 300;
  var ICON_POP_MS = 300;
  var STACK_PULSE_MS = 280;

  var pendingInventoryState = null;
  var pendingHealthState = null;
  var pendingIconUpdates = null;
  var hotbarElement = null;
  var healthBarElement = null;
  var slotElements = [];
  var slotIconCache = [];
  var slotIconClearTimers = [];
  var slotPreviousState = [];
  var slotStateTrackingReady = false;

  function clamp01(value) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  function applySlotThemeColors(payload) {
    if (!payload) return;
    if (payload.selectedColor) {
      document.documentElement.style.setProperty("--slot-selected", payload.selectedColor);
    }
    if (payload.unselectedColor) {
      document.documentElement.style.setProperty("--slot-bg", payload.unselectedColor);
    }
    if (payload.holsteredColor) {
      document.documentElement.style.setProperty("--slot-holstered", payload.holsteredColor);
    }
  }

  function getSlotElements() {
    if (slotElements.length === SLOT_COUNT) return slotElements;
    slotElements = [];
    var index = 0;
    for (index = 0; index < SLOT_COUNT; index += 1) {
      slotElements.push(document.querySelector('[data-slot-index="' + String(index) + '"]'));
    }
    return slotElements;
  }

  function buildHotbar() {
    if (!hotbarElement) hotbarElement = document.getElementById("hotbarSlots");
    if (!hotbarElement || hotbarElement.childElementCount === SLOT_COUNT) return;

    hotbarElement.innerHTML = "";
    slotElements = [];

    var index = 0;
    for (index = 0; index < SLOT_COUNT; index += 1) {
      var item = document.createElement("li");
      item.className = "game-hud-slot";
      item.setAttribute("data-slot-index", String(index));

      var label = document.createElement("span");
      label.className = "game-hud-slot-index";
      label.textContent = SLOT_LABELS[index];
      item.appendChild(label);

      var icon = document.createElement("img");
      icon.className = "game-hud-slot-icon";
      icon.alt = "";
      icon.decoding = "async";
      item.appendChild(icon);

      var stack = document.createElement("span");
      stack.className = "game-hud-slot-stack";
      stack.hidden = true;
      item.appendChild(stack);

      hotbarElement.appendChild(item);
      slotElements.push(item);
    }
  }

  function cancelIconClearTimer(slotIndex) {
    if (slotIconClearTimers[slotIndex]) {
      clearTimeout(slotIconClearTimers[slotIndex]);
      slotIconClearTimers[slotIndex] = 0;
    }
  }

  function clearSlotIconVisual(slotIndex) {
    var slots = getSlotElements();
    var slotElement = slots[slotIndex];
    if (!slotElement) return;

    var iconElement = slotElement.querySelector(".game-hud-slot-icon");
    iconElement.removeAttribute("src");
    iconElement.classList.remove("is-visible", "is-fading-out", "is-pop");
    slotIconCache[slotIndex] = "";
    cancelIconClearTimer(slotIndex);
  }

  function beginIconFadeOut(slotIndex) {
    var slots = getSlotElements();
    var slotElement = slots[slotIndex];
    if (!slotElement) return;

    var iconElement = slotElement.querySelector(".game-hud-slot-icon");
    if (!iconElement) return;

    if (!slotIconCache[slotIndex] && !iconElement.getAttribute("src")) {
      clearSlotIconVisual(slotIndex);
      return;
    }

    if (iconElement.classList.contains("is-fading-out")) return;

    cancelIconClearTimer(slotIndex);

    if (!animationsEnabled()) {
      clearSlotIconVisual(slotIndex);
      return;
    }

    if (!iconElement.classList.contains("is-visible")) {
      iconElement.classList.add("is-visible");
    }
    iconElement.classList.remove("is-pop");
    iconElement.classList.add("is-fading-out");

    slotIconClearTimers[slotIndex] = setTimeout(function () {
      slotIconClearTimers[slotIndex] = 0;
      clearSlotIconVisual(slotIndex);
    }, ICON_FADE_OUT_MS);
  }

  function showSlotIcon(slotIndex, iconDataUrl) {
    var slots = getSlotElements();
    var slotElement = slots[slotIndex];
    if (!slotElement) return;

    var iconElement = slotElement.querySelector(".game-hud-slot-icon");
    if (!iconDataUrl) {
      if (slotIconCache[slotIndex] || iconElement.getAttribute("src")) {
        beginIconFadeOut(slotIndex);
        return;
      }
      clearSlotIconVisual(slotIndex);
      return;
    }

    cancelIconClearTimer(slotIndex);
    slotIconCache[slotIndex] = iconDataUrl;
    if (iconElement.getAttribute("src") !== iconDataUrl) {
      iconElement.setAttribute("src", iconDataUrl);
    }
    iconElement.classList.remove("is-fading-out");
    iconElement.classList.add("is-visible");
  }

  function animationsEnabled() {
    if (typeof window.matchMedia !== "function") return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function playOneShotAnimation(element, className, durationMs) {
    if (!element || !animationsEnabled()) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(function () {
      element.classList.remove(className);
    }, durationMs);
  }

  function playIconPop(slotIndex) {
    var slots = getSlotElements();
    var slotElement = slots[slotIndex];
    if (!slotElement) return;
    var iconElement = slotElement.querySelector(".game-hud-slot-icon");
    if (!iconElement || !iconElement.classList.contains("is-visible")) return;
    playOneShotAnimation(iconElement, "is-pop", ICON_POP_MS);
  }

  function playStackPulse(slotIndex) {
    var slots = getSlotElements();
    var slotElement = slots[slotIndex];
    if (!slotElement) return;
    var stackElement = slotElement.querySelector(".game-hud-slot-stack");
    if (!stackElement || stackElement.hidden) return;
    playOneShotAnimation(stackElement, "is-pulse", STACK_PULSE_MS);
  }

  function snapshotSlotState(slotIndex, hasItem, currentStack, maxStack, iconUrl) {
    return {
      hasItem: !!hasItem,
      stack: currentStack,
      maxStack: maxStack,
      iconUrl: iconUrl || ""
    };
  }

  function reactToSlotChanges(slotIndex, hasItem, currentStack, maxStack, stackLabel, iconUrl, iconJustUpdated) {
    if (!slotStateTrackingReady) {
      slotPreviousState[slotIndex] = snapshotSlotState(slotIndex, hasItem, currentStack, maxStack, iconUrl);
      return;
    }

    var previous = slotPreviousState[slotIndex];
    var pickedUp = hasItem && (!previous || !previous.hasItem);
    var iconChanged = !!iconUrl && (!previous || iconUrl !== previous.iconUrl);
    var previousStackLabel = previous ? formatStackLabel(previous.stack, previous.maxStack) : "";
    var stackChanged = !!stackLabel && stackLabel !== previousStackLabel;

    if (iconJustUpdated || pickedUp || (hasItem && iconChanged)) {
      playIconPop(slotIndex);
    }
    if (stackChanged) {
      playStackPulse(slotIndex);
    }

    slotPreviousState[slotIndex] = snapshotSlotState(slotIndex, hasItem, currentStack, maxStack, iconUrl);
  }

  function formatStackLabel(currentStack, maxStack) {
    if (maxStack > 1) {
      return String(currentStack) + "/" + String(maxStack);
    }
    if (currentStack > 1) {
      return String(currentStack);
    }
    return "";
  }

  function setSlotSelectionVisual(slotElement, selectionKind) {
    slotElement.classList.remove("is-selected", "is-holstered");
    if (selectionKind === "selected") slotElement.classList.add("is-selected");
    else if (selectionKind === "holstered") slotElement.classList.add("is-holstered");
  }

  function applySlotState(slotIndex, slotState) {
    var slots = getSlotElements();
    var slotElement = slots[slotIndex];
    if (!slotElement) return;

    var stackElement = slotElement.querySelector(".game-hud-slot-stack");
    var hasItem = slotState && slotState.hasItem;
    var iconDataUrl = slotState && slotState.iconDataUrl ? slotState.iconDataUrl : "";

    if (hasItem && iconDataUrl) {
      showSlotIcon(slotIndex, iconDataUrl);
    } else if (hasItem && slotIconCache[slotIndex]) {
      showSlotIcon(slotIndex, slotIconCache[slotIndex]);
    } else if (!hasItem) {
      if (slotIconCache[slotIndex]) {
        beginIconFadeOut(slotIndex);
      } else {
        clearSlotIconVisual(slotIndex);
      }
    } else {
      clearSlotIconVisual(slotIndex);
    }

    var currentStack = slotState ? slotState.stack : 0;
    var maxStack = slotState ? slotState.maxStack : 0;
    var stackLabel = formatStackLabel(currentStack, maxStack);

    if (!stackLabel) {
      stackElement.hidden = true;
      stackElement.textContent = "";
    } else {
      stackElement.hidden = false;
      stackElement.textContent = stackLabel;
    }

    setSlotSelectionVisual(slotElement, slotState ? slotState.selectionKind : "none");

    reactToSlotChanges(
      slotIndex,
      hasItem,
      currentStack,
      maxStack,
      stackLabel,
      slotIconCache[slotIndex] || iconDataUrl,
      false
    );
  }

  function getSelectionKind(slotIndex, selectedIndex, lastSelectedIndex) {
    if (selectedIndex === slotIndex) return "selected";
    if (selectedIndex === -1 && lastSelectedIndex === slotIndex) return "holstered";
    return "none";
  }

  function applyInventoryState(payload) {
    if (!payload) return;
    pendingInventoryState = payload;
    buildHotbar();

    applySlotThemeColors(payload);

    var selectedIndex = typeof payload.selectedIndex === "number" ? payload.selectedIndex : -1;
    var lastSelectedIndex = typeof payload.lastSelectedIndex === "number" ? payload.lastSelectedIndex : -1;
    var slots = payload.slots;
    var slotIndex = 0;

    for (slotIndex = 0; slotIndex < SLOT_COUNT; slotIndex += 1) {
      var slotState = slots && slots[slotIndex] ? slots[slotIndex] : {};
      slotState.selectionKind = getSelectionKind(slotIndex, selectedIndex, lastSelectedIndex);
      applySlotState(slotIndex, slotState);
    }

    slotStateTrackingReady = true;
  }

  function setSlotIcon(slotIndex, iconDataUrl) {
    buildHotbar();
    var previousIconUrl = slotIconCache[slotIndex] || "";
    showSlotIcon(slotIndex, iconDataUrl || "");
    if (!iconDataUrl) {
      return;
    }
    if (slotStateTrackingReady && iconDataUrl !== previousIconUrl) {
      playIconPop(slotIndex);
    }
  }

  function applyIconUpdates(updates) {
    if (!updates || !updates.length) return;
    var index = 0;
    for (index = 0; index < updates.length; index += 1) {
      var entry = updates[index];
      if (!entry) continue;
      setSlotIcon(entry.slotIndex, entry.iconDataUrl || "");
    }
  }

  function createHealthCell() {
    var cell = document.createElement("div");
    cell.className = "game-hud-health-cell";
    return cell;
  }

  function setPartialFillOnCell(cell, fillAmount) {
    var partial = cell.querySelector(".game-hud-health-partial");
    if (!partial) {
      partial = document.createElement("div");
      partial.className = "game-hud-health-partial";
      cell.appendChild(partial);
    }
    partial.style.width = String(clamp01(fillAmount) * 100) + "%";
  }

  function buildHealthBar(maxHealth, health, healthFullColor, healthEmptyColor) {
    if (!healthBarElement) healthBarElement = document.getElementById("healthBar");
    if (!healthBarElement) return;

    if (healthFullColor) {
      document.documentElement.style.setProperty("--health-full", healthFullColor);
    }
    if (healthEmptyColor) {
      document.documentElement.style.setProperty("--health-empty", healthEmptyColor);
    }

    healthBarElement.innerHTML = "";
    healthBarElement.setAttribute("aria-valuemax", String(maxHealth));
    healthBarElement.setAttribute("aria-valuenow", String(health));

    if (maxHealth <= 0) return;

    var fullBarCount = Math.floor(maxHealth / BAR_HEALTH);
    var leftoverMax = maxHealth % BAR_HEALTH;
    var barIndex = 0;
    var barCount = fullBarCount + (leftoverMax > 0 ? 1 : 0);

    for (barIndex = 0; barIndex < fullBarCount; barIndex += 1) {
      var fullCell = createHealthCell();
      if (health >= (barIndex + 1) * BAR_HEALTH) {
        fullCell.classList.add("is-filled");
      }
      healthBarElement.appendChild(fullCell);
    }

    if (leftoverMax > 0) {
      healthBarElement.appendChild(createHealthCell());
    }

    if (health > 0 && barCount > 0) {
      var activeIndex = Math.min(Math.floor(health / BAR_HEALTH), barCount - 1);
      var activeCell = healthBarElement.children[activeIndex];
      var fillAmount = (health % BAR_HEALTH) / BAR_HEALTH;
      if (health === maxHealth && fillAmount === 0) {
        fillAmount = 1;
      }
      if (activeCell && !activeCell.classList.contains("is-filled")) {
        setPartialFillOnCell(activeCell, fillAmount);
      }
    }
  }

  function applyHealthState(payload) {
    if (!payload) return;
    pendingHealthState = payload;
    buildHotbar();
    var health = typeof payload.health === "number" ? payload.health : 0;
    var maxHealth = typeof payload.maxHealth === "number" ? payload.maxHealth : 0;
    buildHealthBar(maxHealth, health, payload.healthFullColor, payload.healthEmptyColor);
  }

  function applyDefaultSlotTheme() {
    applySlotThemeColors({
      selectedColor: DEFAULT_SLOT_SELECTED,
      unselectedColor: DEFAULT_SLOT_BG,
      holsteredColor: DEFAULT_SLOT_HOLSTERED
    });
  }

  function applyDefaultInventoryState() {
    applyDefaultSlotTheme();
    applyInventoryState({
      selectedIndex: -1,
      lastSelectedIndex: -1,
      selectedColor: DEFAULT_SLOT_SELECTED,
      unselectedColor: DEFAULT_SLOT_BG,
      holsteredColor: DEFAULT_SLOT_HOLSTERED,
      slots: []
    });
  }

  function applyDefaultHealthState() {
    applyHealthState({
      health: DEFAULT_HEALTH,
      maxHealth: DEFAULT_MAX_HEALTH,
      healthFullColor: DEFAULT_HEALTH_FULL_COLOR,
      healthEmptyColor: DEFAULT_HEALTH_EMPTY_COLOR
    });
  }

  function bindDom() {
    buildHotbar();
    healthBarElement = document.getElementById("healthBar");
    applyDefaultSlotTheme();
    if (pendingInventoryState) applyInventoryState(pendingInventoryState);
    else applyDefaultInventoryState();
    if (pendingHealthState) applyHealthState(pendingHealthState);
    else applyDefaultHealthState();
    if (pendingIconUpdates) applyIconUpdates(pendingIconUpdates);
  }

  window.WebGameHud = {
    applySlotTheme: applySlotThemeColors,
    applyInventoryState: applyInventoryState,
    applyHealthState: applyHealthState,
    setSlotIcon: setSlotIcon,
    applyIconUpdates: applyIconUpdates
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindDom);
  } else {
    bindDom();
  }
})();
