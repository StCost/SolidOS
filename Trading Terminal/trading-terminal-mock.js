(function () {
  if (window.vuplex) return;

  var HOTBAR_ICON_PREFIX = "../Web Main Menu/hotbar-demo-icons/";
  var ICON_SCRAP = HOTBAR_ICON_PREFIX + "sc.png";
  var ICON_MINERAL = HOTBAR_ICON_PREFIX + "gr.png";
  var ICON_METAL_BOX = HOTBAR_ICON_PREFIX + "bt.png";

  var mockIconMap = {
    "0": ICON_SCRAP,
    "101": ICON_MINERAL,
    "102": ICON_METAL_BOX
  };

  function buildMockContracts() {
    var contracts = [
      { id: 0, kind: 0, assetId: 0, entityId: "", displayName: "ALL", amount: 0, unitPrice: 0, totalPrice: 0, pinned: true, provider: "wildcard" }
    ];

    var contractId = 1;
    var contractIndex;
    for (contractIndex = 0; contractIndex < 89; contractIndex++) {
      var isBuy = contractIndex % 2 === 0;
      var assetId = contractIndex % 3 === 0 ? 101 : 102;
      var displayName = assetId === 101 ? "Raw Mineral" : "Metal Box";
      var amount = (contractIndex % 9) + 1;
      var unitPrice = 10 + (contractIndex % 40);
      contracts.push({
        id: contractId,
        kind: isBuy ? 2 : 1,
        assetId: assetId,
        entityId: assetId === 101 ? "mineral1" : "metal_box",
        displayName: displayName,
        amount: amount,
        unitPrice: unitPrice,
        totalPrice: amount * unitPrice,
        pinned: contractIndex % 11 === 0,
        provider: "daily"
      });
      contractId += 1;
    }

    return contracts;
  }

  var mockState = {
    screen: "contracts",
    marks: 1250,
    inflationMultiplier: 1.042,
    activeContractId: -1,
    depositSizeX: 0.9,
    depositSizeY: 0.25,
    depositSizeZ: 0.7,
    contracts: buildMockContracts(),
    activeContract: null,
    scanItems: [],
    previewItems: [],
    scanTotalCount: 0,
    scanTotalPrice: 0,
    previewTotalCount: 0,
    previewTotalPrice: 0,
    statusMessage: "",
    successOverlay: ""
  };

  function recalculateTotals() {
    var contract = mockState.activeContract;
    if (!contract) return;

    if (contract.kind === 2) {
      mockState.previewTotalCount = 0;
      mockState.previewTotalPrice = 0;
      for (var previewIndex = 0; previewIndex < mockState.previewItems.length; previewIndex++) {
        var previewItem = mockState.previewItems[previewIndex];
        mockState.previewTotalCount += previewItem.selectedCount || 0;
        mockState.previewTotalPrice += previewItem.lineTotal || 0;
      }
      return;
    }

    mockState.scanTotalCount = 0;
    mockState.scanTotalPrice = 0;
    for (var scanIndex = 0; scanIndex < mockState.scanItems.length; scanIndex++) {
      var scanItem = mockState.scanItems[scanIndex];
      mockState.scanTotalCount += scanItem.selectedCount || 0;
      mockState.scanTotalPrice += scanItem.lineTotal || 0;
    }
  }

  function pushState() {
    if (!window.TradingTerminal)
      return;

    window.TradingTerminal.setState(mockState);
    window.TradingTerminal.setIcons(mockIconMap);
  }

  function buildPreviewItems(contract) {
    return [{
      assetId: contract.assetId,
      displayName: contract.displayName,
      entityId: contract.entityId,
      count: contract.amount,
      selectedCount: contract.amount,
      maxCount: contract.amount,
      unitPrice: contract.unitPrice,
      lineTotal: contract.unitPrice * contract.amount
    }];
  }

  function buildScanItems(contract) {
    return [
      {
        assetId: contract.assetId || 102,
        displayName: contract.displayName || "Metal Box",
        entityId: contract.entityId || "metal_box",
        count: contract.amount > 0 ? contract.amount : 4,
        selectedCount: contract.amount > 0 ? contract.amount : 4,
        maxCount: contract.amount > 0 ? contract.amount : 4,
        unitPrice: contract.unitPrice || 55,
        lineTotal: (contract.unitPrice || 55) * (contract.amount > 0 ? contract.amount : 4)
      }
    ];
  }

  function adjustMockItemAmount(itemIndex, adjustMode) {
    var contract = mockState.activeContract;
    if (!contract) return;

    var items = contract.kind === 2 ? mockState.previewItems : mockState.scanItems;
    if (itemIndex < 0 || itemIndex >= items.length) return;

    var item = items[itemIndex];
    var maxCount = item.maxCount || item.count || 1;
    var selected = item.selectedCount !== undefined ? item.selectedCount : item.count;

    if (adjustMode === "zero") selected = 0;
    else if (adjustMode === "minus-ten") selected -= 10;
    else if (adjustMode === "minus-one") selected -= 1;
    else if (adjustMode === "plus-one") selected += 1;
    else if (adjustMode === "plus-ten") selected += 10;
    else if (adjustMode === "max") selected = maxCount;

    if (selected < 0) selected = 0;
    if (selected > maxCount) selected = maxCount;

    item.selectedCount = selected;
    item.lineTotal = (item.unitPrice || 0) * selected;
    items[itemIndex] = item;
    recalculateTotals();
  }

  window.TradingTerminalMock = {
    start: function () {
      pushState();
    },
    handleAction: function (payload) {
      if (!payload) return;
      var action = payload.action;

      if (action === "lock" || action === "pin") {
        for (var i = 0; i < mockState.contracts.length; i++) {
          if (mockState.contracts[i].id === payload.contractId) {
            mockState.contracts[i].pinned = !mockState.contracts[i].pinned;
          }
        }
        pushState();
        return;
      }

      if (action === "handshake") {
        mockState.activeContractId = payload.contractId;
        mockState.scanItems = [];
        mockState.previewItems = [];
        mockState.scanTotalCount = 0;
        mockState.scanTotalPrice = 0;
        mockState.previewTotalCount = 0;
        mockState.previewTotalPrice = 0;
        mockState.statusMessage = "";
        mockState.successOverlay = "";

        for (var j = 0; j < mockState.contracts.length; j++) {
          if (mockState.contracts[j].id === payload.contractId) {
            mockState.activeContract = mockState.contracts[j];
            if (mockState.activeContract.kind === 2) {
              mockState.previewItems = buildPreviewItems(mockState.activeContract);
              recalculateTotals();
            } else if (mockState.activeContract.kind !== 0) {
              mockState.scanItems = buildScanItems(mockState.activeContract);
              recalculateTotals();
            } else {
              mockState.scanItems = buildScanItems({ amount: 6, unitPrice: 40, assetId: 102, displayName: "Metal Box", entityId: "metal_box" });
              recalculateTotals();
            }
          }
        }
        mockState.screen = "handshake";
        pushState();
        return;
      }

      if (action === "stop-handshake") {
        mockState.activeContractId = -1;
        mockState.activeContract = null;
        mockState.scanItems = [];
        mockState.previewItems = [];
        mockState.scanTotalCount = 0;
        mockState.scanTotalPrice = 0;
        mockState.previewTotalCount = 0;
        mockState.previewTotalPrice = 0;
        mockState.screen = "contracts";
        pushState();
        return;
      }

      if (action === "scan") {
        if (mockState.activeContract) {
          mockState.scanItems = buildScanItems(mockState.activeContract);
          recalculateTotals();
        }
        pushState();
        return;
      }

      if (action === "adjust-amount") {
        adjustMockItemAmount(payload.itemIndex, payload.adjustMode);
        pushState();
        return;
      }

      if (action === "dismiss-success") {
        mockState.successOverlay = "";
        pushState();
        return;
      }

      if (action === "confirm") {
        if (mockState.activeContract && mockState.activeContract.kind === 2) {
          mockState.marks -= mockState.previewTotalPrice;
        } else {
          mockState.marks += mockState.scanTotalPrice;
        }
        mockState.activeContractId = -1;
        mockState.activeContract = null;
        mockState.scanItems = [];
        mockState.previewItems = [];
        mockState.scanTotalCount = 0;
        mockState.scanTotalPrice = 0;
        mockState.previewTotalCount = 0;
        mockState.previewTotalPrice = 0;
        mockState.statusMessage = "";
        mockState.successOverlay = "TRADE COMPLETE";
        mockState.screen = "contracts";
        pushState();
      }
    }
  };
})();
