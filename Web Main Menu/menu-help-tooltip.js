(function () {
  var helpTooltip = null;
  var stickyHelpAnchor = null;
  var documentDismissBound = false;

  function init() {
    if (!helpTooltip) {
      helpTooltip = document.getElementById("settingsHelpTooltip");
    }
    if (documentDismissBound) return;
    documentDismissBound = true;
    document.addEventListener("pointerdown", onDocumentPointerDown, true);
    window.addEventListener("scroll", onWindowScroll, true);
  }

  function hideHelpTooltip() {
    if (!helpTooltip) return;
    helpTooltip.hidden = true;
    helpTooltip.classList.remove("is-visible");
    helpTooltip.classList.remove("settings-help-tooltip--left");
    helpTooltip.classList.remove("settings-help-tooltip--right");
    stickyHelpAnchor = null;
  }

  function positionHelpTooltip(anchor) {
    if (!helpTooltip || !anchor) return;
    var gap = 10;
    var viewportPadding = 12;
    var anchorRect = anchor.getBoundingClientRect();
    var tooltipRect = helpTooltip.getBoundingClientRect();
    var placeOnLeft = false;
    var left = anchorRect.right + gap;
    if (left + tooltipRect.width > window.innerWidth - viewportPadding) {
      left = anchorRect.left - gap - tooltipRect.width;
      placeOnLeft = true;
    }
    if (left < viewportPadding) left = viewportPadding;

    var top = anchorRect.top + anchorRect.height * 0.5 - tooltipRect.height * 0.5;
    if (top < viewportPadding) top = viewportPadding;
    if (top + tooltipRect.height > window.innerHeight - viewportPadding) {
      top = window.innerHeight - viewportPadding - tooltipRect.height;
    }

    helpTooltip.style.left = left + "px";
    helpTooltip.style.top = top + "px";
    helpTooltip.classList.toggle("settings-help-tooltip--left", placeOnLeft);
    helpTooltip.classList.toggle("settings-help-tooltip--right", !placeOnLeft);
  }

  function showHelpTooltip(anchor, text) {
    init();
    if (!helpTooltip || !anchor) return;
    helpTooltip.textContent = text;
    helpTooltip.hidden = false;
    helpTooltip.classList.add("is-visible");
    positionHelpTooltip(anchor);
  }

  function canShowHelpForAnchor(anchor) {
    if (!anchor) return false;
    if (anchor.hidden) return false;
    if (anchor.getAttribute("aria-hidden") === "true") return false;
    if (anchor.disabled) return false;
    var text = anchor.getAttribute("data-help-text");
    if (!text) return false;
    return true;
  }

  function onHelpButtonPointerEnter(event) {
    if (event.pointerType === "touch") return;
    var anchor = event.currentTarget;
    if (stickyHelpAnchor === anchor) return;
    if (!canShowHelpForAnchor(anchor)) return;
    var text = anchor.getAttribute("data-help-text");
    showHelpTooltip(anchor, text);
  }

  function onHelpButtonPointerLeave(event) {
    if (stickyHelpAnchor === event.currentTarget) return;
    var related = event.relatedTarget;
    if (related && helpTooltip && helpTooltip.contains(related)) return;
    hideHelpTooltip();
  }

  function onHelpButtonFocus(event) {
    var anchor = event.currentTarget;
    if (stickyHelpAnchor === anchor) return;
    if (!canShowHelpForAnchor(anchor)) return;
    var text = anchor.getAttribute("data-help-text");
    showHelpTooltip(anchor, text);
  }

  function onHelpButtonBlur(event) {
    if (stickyHelpAnchor === event.currentTarget) return;
    hideHelpTooltip();
  }

  function onHelpButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();
    var anchor = event.currentTarget;
    if (!canShowHelpForAnchor(anchor)) return;
    var text = anchor.getAttribute("data-help-text");
    if (stickyHelpAnchor === anchor && helpTooltip && !helpTooltip.hidden) {
      hideHelpTooltip();
      return;
    }
    stickyHelpAnchor = anchor;
    showHelpTooltip(anchor, text);
  }

  function onDocumentPointerDown(event) {
    if (!stickyHelpAnchor) return;
    if (event.target.closest(".settings-help-btn")) return;
    hideHelpTooltip();
  }

  function onWindowScroll() {
    hideHelpTooltip();
  }

  function bindHelpButton(buttonElement, helpText, ariaLabel) {
    init();
    if (!buttonElement || buttonElement.wmHelpBound) return;
    buttonElement.wmHelpBound = true;
    buttonElement.setAttribute("data-help-text", helpText || "");
    if (ariaLabel) {
      buttonElement.setAttribute("aria-label", ariaLabel);
    }
    buttonElement.addEventListener("pointerenter", onHelpButtonPointerEnter);
    buttonElement.addEventListener("pointerleave", onHelpButtonPointerLeave);
    buttonElement.addEventListener("focus", onHelpButtonFocus);
    buttonElement.addEventListener("blur", onHelpButtonBlur);
    buttonElement.addEventListener("click", onHelpButtonClick);
  }

  function setHelpButtonText(buttonElement, helpText) {
    if (!buttonElement) return;
    buttonElement.setAttribute("data-help-text", helpText || "");
  }

  window.WebMenuHelpTooltip = {
    init: init,
    bindHelpButton: bindHelpButton,
    setHelpButtonText: setHelpButtonText,
    hide: hideHelpTooltip,
    show: showHelpTooltip
  };
})();
