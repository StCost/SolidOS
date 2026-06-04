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

  var CHAT_EVENT_SUBMIT = "web-hud-chat-submit";
  var CHAT_EVENT_FOCUS = "web-hud-chat-focus";
  var CHAT_EVENT_SLOT_SELECT = "web-hud-slot-select";
  var CHAT_MAX_LINES = 200;
  var CHAT_IDLE_HIDE_MS = 12000;

  var pendingInventoryState = null;
  var pendingHealthState = null;
  var pendingIconUpdates = null;
  var hotbarElement = null;
  var healthBarElement = null;
  var gameHudRootElement = null;
  var chatPanelElement = null;
  var chatLogElement = null;
  var chatLogInnerElement = null;
  var chatInputElement = null;
  var chatInputRowElement = null;
  var chatOpen = false;
  var chatFocused = false;
  var chatInputSession = false;
  var chatOpenEnterSuppressUntil = 0;
  var CHAT_OPEN_ENTER_SUPPRESS_MS = 300;
  var chatIdleHideTimer = null;
  var commandHistory = [];
  var commandHistoryIndex = 0;
  var chatBindingsReady = false;
  var hotbarBindingsReady = false;
  var standaloneWebBindingsReady = false;
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
      var listItem = document.createElement("li");
      var item = document.createElement("button");
      item.type = "button";
      item.className = "game-hud-slot";
      item.setAttribute("data-slot-index", String(index));
      item.setAttribute("aria-label", "Inventory slot " + SLOT_LABELS[index]);

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

      listItem.appendChild(item);
      hotbarElement.appendChild(listItem);
      slotElements.push(item);
    }

    bindHotbarClicks();
  }

  function postSlotSelect(slotIndex) {
    if (!isUnityHost()) return;
    window.vuplex.postMessage(
      JSON.stringify({
        eventName: CHAT_EVENT_SLOT_SELECT,
        slotIndex: slotIndex
      })
    );
  }

  function onHotbarSlotClick(event) {
    if (!event || !event.currentTarget) return;
    var slotIndexValue = event.currentTarget.getAttribute("data-slot-index");
    if (slotIndexValue == null || slotIndexValue === "") return;
    var slotIndex = parseInt(slotIndexValue, 10);
    if (isNaN(slotIndex)) return;
    event.preventDefault();
    postSlotSelect(slotIndex);
  }

  function bindHotbarClicks() {
    if (hotbarBindingsReady) return;
    var slots = getSlotElements();
    var index = 0;
    for (index = 0; index < slots.length; index += 1) {
      if (!slots[index]) continue;
      slots[index].addEventListener("click", onHotbarSlotClick);
    }
    hotbarBindingsReady = true;
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

  function isUnityHost() {
    return !!(window.vuplex && window.vuplex.postMessage);
  }

  function isGameMenuMode() {
    return window.WebMenuMode === "game";
  }

  function isWebFakeConnectHud() {
    return document.documentElement.classList.contains("web-fake-connect-active");
  }

  function setGameplayHudLayerActive(active) {
    var hudRoot = gameHudRootElement || document.getElementById("gameHudRoot");
    var layerActive = active === true && (isGameMenuMode() || isWebFakeConnectHud());
    if (hudRoot) {
      hudRoot.classList.toggle("game-hud--layer-active", layerActive);
      hudRoot.setAttribute("aria-hidden", layerActive ? "false" : "true");
    }
  }

  function onMenuModeChanged() {
    if (!isGameMenuMode()) {
      setGameplayHudLayerActive(false);
      return;
    }
    if (window.WebMenuLayers && window.WebMenuLayers.getActiveLayer) {
      var currentLayer = window.WebMenuLayers.getActiveLayer();
      if (currentLayer === window.WebMenuLayers.LAYER_HUD) {
        setGameplayHudLayerActive(true);
      } else {
        setGameplayHudLayerActive(false);
      }
      return;
    }
    setGameplayHudLayerActive(false);
  }

  function escapeHtml(text) {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var UNITY_RICH_TEXT_TAG_PATTERN = /<(\/?)\s*(color|b|i|u|s|size)\s*(?:=\s*([^>]*?))?\s*>/gi;

  var UNITY_NAMED_COLORS = {
    red: "#ff4444",
    green: "#55dd55",
    blue: "#5599ff",
    yellow: "#ffdd55",
    orange: "#ffaa44",
    cyan: "#55dddd",
    magenta: "#ff55ff",
    white: "#fff2d8",
    black: "#111111",
    grey: "#aaaaaa",
    gray: "#aaaaaa"
  };

  function stripRichTextTagValue(rawValue) {
    var trimmed = rawValue == null ? "" : String(rawValue).trim();
    if (trimmed.length >= 2) {
      var firstChar = trimmed.charAt(0);
      var lastChar = trimmed.charAt(trimmed.length - 1);
      if ((firstChar === '"' && lastChar === '"') || (firstChar === "'" && lastChar === "'")) {
        return trimmed.substring(1, trimmed.length - 1).trim();
      }
    }
    return trimmed;
  }

  function sanitizeChatColor(colorValue) {
    if (!colorValue) return "#ffcc9f";
    var trimmed = stripRichTextTagValue(colorValue);
    var lower = trimmed.toLowerCase();
    if (UNITY_NAMED_COLORS[lower]) return UNITY_NAMED_COLORS[lower];
    if (/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+/.test(trimmed)) return trimmed;
    if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return "#" + trimmed;
    if (/^[0-9a-fA-F]{8}$/.test(trimmed)) return "#" + trimmed.substring(0, 6);
    if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) {
      if (trimmed.length === 4) {
        return (
          "#" +
          trimmed.charAt(1) +
          trimmed.charAt(1) +
          trimmed.charAt(2) +
          trimmed.charAt(2) +
          trimmed.charAt(3) +
          trimmed.charAt(3)
        );
      }
      if (trimmed.length === 9) {
        return trimmed.substring(0, 7);
      }
      return trimmed;
    }
    if (/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(trimmed)) return trimmed;
    return "#ffcc9f";
  }

  function getRichTextCloseMarkup(tagName) {
    if (tagName === "color") return "</span>";
    if (tagName === "b") return "</b>";
    if (tagName === "i") return "</i>";
    if (tagName === "u") return "</u>";
    if (tagName === "s") return "</s>";
    if (tagName === "size") return "</span>";
    return "";
  }

  function getRichTextOpenMarkup(tagName, tagValue) {
    if (tagName === "color") {
      var chatColor = sanitizeChatColor(tagValue);
      return (
        '<span class="game-hud-chat-color" style="color:' +
        chatColor +
        ";-webkit-text-fill-color:" +
        chatColor +
        '">'
      );
    }
    if (tagName === "b") return "<b>";
    if (tagName === "i") return "<i>";
    if (tagName === "u") return "<u>";
    if (tagName === "s") return "<s>";
    if (tagName === "size") {
      var sizeValue = parseInt(tagValue, 10);
      if (!sizeValue || sizeValue < 1) sizeValue = 13;
      if (sizeValue > 48) sizeValue = 48;
      return '<span class="game-hud-chat-size" style="font-size:' + String(sizeValue) + 'px">';
    }
    return "";
  }

  function closeRichTextTag(stack, tagName, htmlParts) {
    var stackIndex = stack.length - 1;
    while (stackIndex >= 0) {
      if (stack[stackIndex] === tagName) {
        htmlParts.push(getRichTextCloseMarkup(tagName));
        stack.splice(stackIndex, 1);
        return;
      }
      stackIndex -= 1;
    }
  }

  function closeAllRichTextTags(stack, htmlParts) {
    while (stack.length > 0) {
      var tagName = stack.pop();
      htmlParts.push(getRichTextCloseMarkup(tagName));
    }
  }

  function formatUnityRichText(message) {
    var source = message == null ? "" : String(message);
    var htmlParts = [];
    var styleStack = [];
    var lastIndex = 0;
    var match;

    UNITY_RICH_TEXT_TAG_PATTERN.lastIndex = 0;
    while ((match = UNITY_RICH_TEXT_TAG_PATTERN.exec(source)) !== null) {
      if (match.index > lastIndex) {
        htmlParts.push(escapeHtml(source.substring(lastIndex, match.index)));
      }

      var isClosing = match[1] === "/";
      var tagName = match[2].toLowerCase();
      var tagValue = match[3] != null ? match[3] : "";

      if (isClosing) {
        closeRichTextTag(styleStack, tagName, htmlParts);
      } else {
        var openMarkup = getRichTextOpenMarkup(tagName, tagValue);
        if (openMarkup) {
          styleStack.push(tagName);
          htmlParts.push(openMarkup);
        } else {
          htmlParts.push(escapeHtml(match[0]));
        }
      }

      lastIndex = UNITY_RICH_TEXT_TAG_PATTERN.lastIndex;
    }

    if (lastIndex < source.length) {
      htmlParts.push(escapeHtml(source.substring(lastIndex)));
    }

    closeAllRichTextTags(styleStack, htmlParts);
    return htmlParts.join("");
  }

  function formatChatMessageHtml(message) {
    return '<span class="game-hud-chat-prefix terminal-text--dim">&gt; </span>' + formatUnityRichText(message);
  }

  function refreshChatScrollbar() {
    if (!window.WebScrollbarCursor) {
      return;
    }
    window.WebScrollbarCursor.scheduleScrollViewScan();
    window.WebScrollbarCursor.refreshAllScrollbars();
  }

  function getChatLogContainer() {
    if (chatLogInnerElement) return chatLogInnerElement;
    return chatLogElement;
  }

  function trimChatLogIfNeeded() {
    var logContainer = getChatLogContainer();
    if (!logContainer) return;
    while (logContainer.childElementCount > CHAT_MAX_LINES) {
      if (logContainer.firstElementChild) {
        logContainer.removeChild(logContainer.firstElementChild);
      } else {
        break;
      }
    }
  }

  function scrollChatLogToEnd() {
    if (!chatLogElement) return;
    chatLogElement.scrollTop = chatLogElement.scrollHeight;
    refreshChatScrollbar();
  }

  function clearChatIdleHideTimer() {
    if (!chatIdleHideTimer) return;
    clearTimeout(chatIdleHideTimer);
    chatIdleHideTimer = null;
  }

  function setChatOpenUnfocusedInWeb() {
    if (!chatOpen) {
      chatOpen = true;
      applyChatOpenState();
    }
    if (chatFocused) {
      setChatFocused(false);
    }
  }

  function scheduleChatIdleHide() {
    if (chatInputSession) return;
    clearChatIdleHideTimer();
    if (!isUnityHost()) {
      setChatOpenUnfocusedInWeb();
      return;
    }
    chatIdleHideTimer = setTimeout(function () {
      chatIdleHideTimer = null;
      if (chatInputSession) return;
      setChatState({ open: false, focused: false });
    }, CHAT_IDLE_HIDE_MS);
  }

  function showChatPanelTransient() {
    setChatState({ open: true, focused: false });
    scheduleChatIdleHide();
  }

  function addChatMessage(message) {
    if (!message) return;
    var logContainer = getChatLogContainer();
    if (!logContainer) return;
    if (!chatInputSession) {
      showChatPanelTransient();
    }
    var lineElement = document.createElement("div");
    lineElement.className = "game-hud-chat-line";
    lineElement.innerHTML = formatChatMessageHtml(message);
    logContainer.appendChild(lineElement);
    trimChatLogIfNeeded();
    scrollChatLogToEnd();
  }

  function clearChatMessages() {
    var logContainer = getChatLogContainer();
    if (!logContainer) return;
    logContainer.innerHTML = "";
  }

  function setCommandHistory(commands) {
    commandHistory = [];
    commandHistoryIndex = 0;
    if (!commands || !commands.length) return;
    var index = 0;
    for (index = 0; index < commands.length; index += 1) {
      var command = commands[index];
      if (command == null || command === "") continue;
      commandHistory.push(String(command));
    }
    commandHistoryIndex = commandHistory.length;
  }

  function resetCommandHistorySession() {
    commandHistoryIndex = commandHistory.length;
  }

  function navigateCommandHistory(direction) {
    if (!chatInputElement || commandHistory.length === 0) return;
    if (direction < 0) {
      commandHistoryIndex = Math.max(0, commandHistoryIndex - 1);
      chatInputElement.value = commandHistory[commandHistoryIndex];
      return;
    }
    commandHistoryIndex = Math.min(commandHistory.length, commandHistoryIndex + 1);
    if (commandHistoryIndex < commandHistory.length) {
      chatInputElement.value = commandHistory[commandHistoryIndex];
      return;
    }
    chatInputElement.value = "";
  }

  function pushLocalCommandHistory(text) {
    if (!text) return;
    var index = 0;
    for (index = 0; index < commandHistory.length; index += 1) {
      if (commandHistory[index] === text && index !== commandHistory.length - 1) {
        commandHistory.splice(index, 1);
        break;
      }
    }
    commandHistory.push(text);
    commandHistoryIndex = commandHistory.length;
  }

  function applyChatOpenState() {
    if (!chatPanelElement || !gameHudRootElement) return;
    if (chatOpen) {
      chatPanelElement.hidden = false;
      chatPanelElement.classList.add("is-open");
      chatPanelElement.setAttribute("aria-hidden", "false");
      refreshChatScrollbar();
    } else {
      chatPanelElement.hidden = true;
      chatPanelElement.classList.remove("is-open");
      chatPanelElement.setAttribute("aria-hidden", "true");
      clearChatIdleHideTimer();
    }
    if (chatFocused || chatInputSession) {
      gameHudRootElement.classList.add("game-hud--chat-focused");
      gameHudRootElement.classList.add("game-hud--chat-interactive");
    } else {
      gameHudRootElement.classList.remove("game-hud--chat-focused");
      gameHudRootElement.classList.remove("game-hud--chat-interactive");
    }
  }

  function suppressOpenEnterKey() {
    chatOpenEnterSuppressUntil = Date.now() + CHAT_OPEN_ENTER_SUPPRESS_MS;
  }

  function shouldSuppressOpenEnterKey() {
    return Date.now() < chatOpenEnterSuppressUntil;
  }

  function setChatInputSession(active) {
    chatInputSession = !!active;
    if (chatInputSession) {
      suppressOpenEnterKey();
      clearChatIdleHideTimer();
      setChatState({ open: true, focused: true });
      syncUnityChatFocus();
      return;
    }
    clearChatIdleHideTimer();
    setChatFocused(false);
    syncUnityChatFocus();
    scheduleChatIdleHide();
  }

  function setChatFocused(focused) {
    chatFocused = !!focused;
    if (!chatInputElement) {
      applyChatOpenState();
      return;
    }
    if (chatFocused) {
      chatInputElement.focus();
      var length = chatInputElement.value.length;
      chatInputElement.setSelectionRange(length, length);
    } else if (!chatInputSession) {
      chatInputElement.blur();
    }
    applyChatOpenState();
    syncUnityChatFocus();
  }

  function refocusChatInputIfSession() {
    if (!chatInputSession || !chatInputElement) return;
    window.setTimeout(function () {
      if (!chatInputSession || !chatInputElement) return;
      chatFocused = true;
      chatInputElement.focus();
      var length = chatInputElement.value.length;
      chatInputElement.setSelectionRange(length, length);
      applyChatOpenState();
      syncUnityChatFocus();
    }, 0);
  }

  function setChatState(payload) {
    if (!payload) return;
    if (payload.session === true || payload.session === false) {
      chatInputSession = !!payload.session;
      if (chatInputSession) {
        suppressOpenEnterKey();
        clearChatIdleHideTimer();
      }
    }
    if (payload.open === true || payload.open === false) {
      chatOpen = !!payload.open;
      if (!chatOpen) {
        clearChatIdleHideTimer();
      }
    }
    if (payload.focused === true) {
      chatFocused = true;
      if (chatInputSession && chatInputElement) {
        chatInputElement.focus();
        var focusLength = chatInputElement.value.length;
        chatInputElement.setSelectionRange(focusLength, focusLength);
      }
      applyChatOpenState();
    } else if (payload.focused === false) {
      chatFocused = false;
      if (chatInputElement && !chatInputSession) {
        chatInputElement.blur();
      }
      applyChatOpenState();
      if (isUnityHost() && !chatInputSession && chatOpen) {
        scheduleChatIdleHide();
      }
    } else {
      applyChatOpenState();
    }
    if (payload.isDevSlash && chatInputElement) {
      if (payload.resetSession) {
        resetCommandHistorySession();
        chatInputElement.value = "/";
      } else if (chatInputElement.value.charAt(0) !== "/") {
        chatInputElement.value = "/" + chatInputElement.value;
      }
    }
    if (payload.resetSession && !payload.isDevSlash) {
      resetCommandHistorySession();
    }
    if (payload.clearInput && chatInputElement) {
      chatInputElement.value = "";
    }
    if (payload.inputText != null && chatInputElement) {
      chatInputElement.value = String(payload.inputText);
    }
    if (payload.flash) {
      showChatPanelTransient();
    }
    if (chatInputSession && chatInputElement && document.activeElement !== chatInputElement) {
      refocusChatInputIfSession();
    }
    syncUnityChatFocus();
  }

  function openChatByDefault() {
    chatInputSession = false;
    setChatState({ open: true, focused: false, defaultOpen: true });
    scheduleChatIdleHide();
  }

  function postChatSubmit(text) {
    if (!isUnityHost()) return;
    window.vuplex.postMessage(
      JSON.stringify({
        eventName: CHAT_EVENT_SUBMIT,
        text: text || ""
      })
    );
  }

  function postChatFocus(focused) {
    if (!isUnityHost()) return;
    window.vuplex.postMessage(
      JSON.stringify({
        eventName: CHAT_EVENT_FOCUS,
        focused: !!focused
      })
    );
  }

  function syncUnityChatFocus() {
    if (!isUnityHost()) return;
    postChatFocus(!!chatInputSession);
  }

  function submitChatInput() {
    if (!chatInputElement) return;
    var text = chatInputElement.value;
    if (isUnityHost()) {
      var trimmedUnity = text.replace(/^\s+|\s+$/g, "");
      if (!trimmedUnity) {
        return;
      }
      postChatSubmit(trimmedUnity);
      chatInputElement.value = "";
      if (chatInputSession) {
        refocusChatInputIfSession();
      }
      return;
    }
    var trimmed = text.replace(/^\s+|\s+$/g, "");
    if (trimmed) {
      pushLocalCommandHistory(trimmed);
      addChatMessage(trimmed);
      chatInputElement.value = "";
    }
    if (chatInputSession) {
      refocusChatInputIfSession();
    } else {
      setChatState({ open: true, focused: false, clearInput: true });
    }
  }

  function onChatInputKeyDown(event) {
    if (!event) return;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      navigateCommandHistory(-1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      navigateCommandHistory(1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (shouldSuppressOpenEnterKey()) {
        return;
      }
      submitChatInput();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (isUnityHost()) {
        postChatSubmit("");
        return;
      }
      setChatInputSession(false);
      setChatState({ open: true, focused: false, clearInput: true });
    }
  }

  function onChatInputMouseDown(event) {
    if (!event) return;
    event.stopPropagation();
    if (chatInputSession) {
      setChatFocused(true);
      return;
    }
    setChatInputSession(true);
  }

  function onChatInputFocused() {
    if (!window.WebGameHudCursorBridge || !window.WebGameHudCursorBridge.notifyChatInputFocused) {
      return;
    }
    window.WebGameHudCursorBridge.notifyChatInputFocused();
  }

  function onStandaloneDocumentKeyDown(event) {
    if (isUnityHost() || !event) return;
    if (event.defaultPrevented || event.repeat) return;
    var targetTag = "";
    if (event.target && event.target.tagName) {
      targetTag = String(event.target.tagName).toLowerCase();
    }
    if (targetTag === "input" || targetTag === "textarea") return;

    if (event.key === "/") {
      event.preventDefault();
      setChatInputSession(true);
      setChatState({ isDevSlash: true, resetSession: true });
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      setChatInputSession(true);
    }
  }

  function bindChatDom() {
    if (chatBindingsReady) return;
    gameHudRootElement = document.getElementById("gameHudRoot");
    chatPanelElement = document.getElementById("gameHudChat");
    chatLogElement = document.getElementById("chatLog");
    chatLogInnerElement = document.getElementById("chatLogInner");
    chatInputElement = document.getElementById("chatInput");
    chatInputRowElement = chatInputElement ? chatInputElement.parentElement : null;
    if (!chatPanelElement || !chatLogElement || !chatInputElement) return;
    chatBindingsReady = true;
    chatInputElement.addEventListener("keydown", onChatInputKeyDown);
    chatInputElement.addEventListener("mousedown", onChatInputMouseDown);
    chatInputElement.addEventListener("focus", onChatInputFocused);
    chatInputElement.addEventListener("blur", refocusChatInputIfSession);
    if (chatInputRowElement) {
      chatInputRowElement.addEventListener("mousedown", onChatInputMouseDown);
    }
    refreshChatScrollbar();
  }

  function initStandaloneWebMode() {
    if (isUnityHost() || standaloneWebBindingsReady) return;
    standaloneWebBindingsReady = true;
    document.documentElement.classList.add("web-standalone");
    document.addEventListener("keydown", onStandaloneDocumentKeyDown);
    openChatByDefault();
    addChatMessage("<color=yellow>[Web preview]</color> Press Enter to type. / for commands.");
  }

  function bindDom() {
    buildHotbar();
    healthBarElement = document.getElementById("healthBar");
    bindChatDom();
    applyDefaultSlotTheme();
    if (pendingInventoryState) applyInventoryState(pendingInventoryState);
    else applyDefaultInventoryState();
    if (pendingHealthState) applyHealthState(pendingHealthState);
    else applyDefaultHealthState();
    if (pendingIconUpdates) applyIconUpdates(pendingIconUpdates);
    initStandaloneWebMode();
  }

  window.WebGameHud = {
    applySlotTheme: applySlotThemeColors,
    applyInventoryState: applyInventoryState,
    applyHealthState: applyHealthState,
    setSlotIcon: setSlotIcon,
    applyIconUpdates: applyIconUpdates,
    addChatMessage: addChatMessage,
    setChatState: setChatState,
    suppressOpenEnterKey: suppressOpenEnterKey,
    openChatByDefault: openChatByDefault,
    clearChatMessages: clearChatMessages,
    setCommandHistory: setCommandHistory,
    setGameplayHudLayerActive: setGameplayHudLayerActive
  };

  window.addEventListener("web-menu-mode-changed", onMenuModeChanged);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindDom);
  } else {
    bindDom();
  }
})();
