var WebMenuLayoutCoords = (function () {
  var ANCHOR_CENTER = "center";

  function getContainerCenter(containerElement) {
    var width = containerElement.clientWidth;
    var height = containerElement.clientHeight;
    if (width < 1) width = 1;
    if (height < 1) height = 1;
    return {
      centerX: width * 0.5,
      centerY: height * 0.5
    };
  }

  function isCenterLayoutEntry(entry) {
    if (!entry) return false;
    if (entry.anchor === ANCHOR_CENTER) return true;
    if (entry.centerOffsetX !== undefined) return true;
    if (entry.centerOffsetY !== undefined) return true;
    return false;
  }

  function absoluteToCenterOffset(left, top, containerElement) {
    var center = getContainerCenter(containerElement);
    return {
      anchor: ANCHOR_CENTER,
      centerOffsetX: Math.round(left - center.centerX),
      centerOffsetY: Math.round(top - center.centerY)
    };
  }

  function centerOffsetToAbsolute(entry, containerElement) {
    var center = getContainerCenter(containerElement);
    var offsetX = 0;
    var offsetY = 0;
    if (entry.centerOffsetX !== undefined) {
      offsetX = entry.centerOffsetX;
    }
    if (entry.centerOffsetY !== undefined) {
      offsetY = entry.centerOffsetY;
    }
    return {
      left: Math.round(center.centerX + offsetX),
      top: Math.round(center.centerY + offsetY)
    };
  }

  function resolveAbsolutePosition(entry, containerElement) {
    if (!entry || !containerElement) {
      return { left: 0, top: 0 };
    }
    return centerOffsetToAbsolute(entry, containerElement);
  }

  function normalizeIconStoredLayout(layout, containerElement) {
    if (!layout || !containerElement) return null;
    if (isCenterLayoutEntry(layout)) {
      return {
        anchor: ANCHOR_CENTER,
        centerOffsetX: Math.round(layout.centerOffsetX || 0),
        centerOffsetY: Math.round(layout.centerOffsetY || 0)
      };
    }
    if (layout.left === undefined) return null;
    var top = layout.top;
    if (top === undefined) top = 0;
    return absoluteToCenterOffset(layout.left, top, containerElement);
  }

  function normalizeWindowStoredLayout(layout, containerElement) {
    var stored;
    var centerOffsets;
    var top;
    if (!layout || !containerElement) return null;
    stored = {
      open: layout.open,
      minimized: layout.minimized === true,
      maximized: layout.maximized === true
    };
    if (layout.width !== undefined) stored.width = layout.width;
    if (layout.height !== undefined) stored.height = layout.height;
    if (layout.zIndex !== undefined) stored.zIndex = layout.zIndex;
    if (layout.left !== undefined && layout.top !== undefined) {
      top = layout.top;
      centerOffsets = absoluteToCenterOffset(layout.left, top, containerElement);
      stored.anchor = centerOffsets.anchor;
      stored.centerOffsetX = centerOffsets.centerOffsetX;
      stored.centerOffsetY = centerOffsets.centerOffsetY;
      return stored;
    }
    if (isCenterLayoutEntry(layout)) {
      stored.anchor = ANCHOR_CENTER;
      stored.centerOffsetX = Math.round(layout.centerOffsetX || 0);
      stored.centerOffsetY = Math.round(layout.centerOffsetY || 0);
      return stored;
    }
    if (layout.left === undefined || layout.top === undefined) return null;
    top = layout.top;
    centerOffsets = absoluteToCenterOffset(layout.left, top, containerElement);
    stored.anchor = centerOffsets.anchor;
    stored.centerOffsetX = centerOffsets.centerOffsetX;
    stored.centerOffsetY = centerOffsets.centerOffsetY;
    return stored;
  }

  function resolveWindowRect(storedLayout, containerElement) {
    var absolutePosition = resolveAbsolutePosition(storedLayout, containerElement);
    var rect = {
      left: absolutePosition.left,
      top: absolutePosition.top
    };
    if (storedLayout.width !== undefined) rect.width = storedLayout.width;
    if (storedLayout.height !== undefined) rect.height = storedLayout.height;
    return rect;
  }

  function exportIconPayloadEntry(storedLayout) {
    if (!storedLayout || !isCenterLayoutEntry(storedLayout)) return null;
    return {
      iconId: "",
      anchor: ANCHOR_CENTER,
      centerOffsetX: Math.round(storedLayout.centerOffsetX || 0),
      centerOffsetY: Math.round(storedLayout.centerOffsetY || 0)
    };
  }

  function exportWindowPayloadEntry(storedLayout, presetName) {
    var entry;
    if (!storedLayout || !isCenterLayoutEntry(storedLayout)) return null;
    entry = {
      preset: presetName,
      anchor: ANCHOR_CENTER,
      centerOffsetX: Math.round(storedLayout.centerOffsetX || 0),
      centerOffsetY: Math.round(storedLayout.centerOffsetY || 0),
      open: storedLayout.open
    };
    if (storedLayout.zIndex !== undefined && storedLayout.zIndex > 0) {
      entry.zIndex = storedLayout.zIndex;
    }
    if (storedLayout.minimized === true) entry.minimized = true;
    if (storedLayout.maximized === true) entry.maximized = true;
    if (storedLayout.width !== undefined) entry.width = storedLayout.width;
    if (storedLayout.height !== undefined) entry.height = storedLayout.height;
    return entry;
  }

  function buildCenterCssPosition(entry) {
    var offsetX = 0;
    var offsetY = 0;
    if (entry.centerOffsetX !== undefined) offsetX = Math.round(entry.centerOffsetX);
    if (entry.centerOffsetY !== undefined) offsetY = Math.round(entry.centerOffsetY);
    return (
      "left:calc(50% + " +
      offsetX +
      "px);top:calc(50% + " +
      offsetY +
      "px);"
    );
  }

  function isCenterOffsetDifferent(valueA, valueB) {
    if (valueA === undefined && valueB === undefined) return false;
    if (valueA === undefined || valueB === undefined) return true;
    return Math.abs(valueA - valueB) > 1;
  }

  function getNiceOffsetStep(value) {
    var absoluteValue = Math.abs(Math.round(value));
    if (absoluteValue >= 200) return 10;
    if (absoluteValue >= 40) return 5;
    return 5;
  }

  function roundNiceOffset(value) {
    var rounded;
    var step;
    var snapped;
    if (value === undefined || value === null) return 0;
    rounded = Math.round(value);
    if (rounded === 0) return 0;
    step = getNiceOffsetStep(rounded);
    snapped = Math.round(rounded / step) * step;
    if (Math.abs(rounded - snapped) <= 3) return snapped;
    return rounded;
  }

  function roundNiceSize(value) {
    var rounded;
    var snapped;
    if (value === undefined || value === null) return value;
    rounded = Math.round(value);
    snapped = Math.round(rounded / 10) * 10;
    if (Math.abs(rounded - snapped) <= 5) return snapped;
    return rounded;
  }

  function isMenuLayoutPhoneVertical() {
    return window.innerHeight > window.innerWidth;
  }

  function updateMenuLayoutPhoneMode() {
    if (!document.documentElement) return;
    document.documentElement.classList.toggle(
      "menu-layout-phone-vertical",
      isMenuLayoutPhoneVertical()
    );
  }

  return {
    ANCHOR_CENTER: ANCHOR_CENTER,
    isMenuLayoutPhoneVertical: isMenuLayoutPhoneVertical,
    updateMenuLayoutPhoneMode: updateMenuLayoutPhoneMode,
    isCenterLayoutEntry: isCenterLayoutEntry,
    absoluteToCenterOffset: absoluteToCenterOffset,
    resolveAbsolutePosition: resolveAbsolutePosition,
    normalizeIconStoredLayout: normalizeIconStoredLayout,
    normalizeWindowStoredLayout: normalizeWindowStoredLayout,
    resolveWindowRect: resolveWindowRect,
    exportIconPayloadEntry: exportIconPayloadEntry,
    exportWindowPayloadEntry: exportWindowPayloadEntry,
    buildCenterCssPosition: buildCenterCssPosition,
    isCenterOffsetDifferent: isCenterOffsetDifferent,
    roundNiceOffset: roundNiceOffset,
    roundNiceSize: roundNiceSize
  };
})();

if (window.WebMenuLayoutCoords && window.WebMenuLayoutCoords.updateMenuLayoutPhoneMode) {
  window.WebMenuLayoutCoords.updateMenuLayoutPhoneMode();
}
