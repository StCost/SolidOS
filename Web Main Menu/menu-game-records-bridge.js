(function () {
  var STORAGE_KEY_PREFIX = "cm-extras-game-records:";
  var IFRAME_MESSAGE_TYPE = "cm-extras-game-storage";
  var recordsByGameId = {};

  function isUnityHost() {
    return typeof window.vuplex !== "undefined" && window.vuplex.postMessage;
  }

  function getStorageKey(gameId) {
    return STORAGE_KEY_PREFIX + gameId;
  }

  function readRecordsJsonFromBrowserStorage(gameId) {
    try {
      return localStorage.getItem(getStorageKey(gameId));
    } catch (error) {
      return null;
    }
  }

  function writeRecordsJsonToBrowserStorage(gameId, recordsJson) {
    try {
      if (!recordsJson) {
        localStorage.removeItem(getStorageKey(gameId));
        return;
      }
      localStorage.setItem(getStorageKey(gameId), recordsJson);
    } catch (error) {
    }
  }

  function getGameRecordsJson(gameId) {
    var stored;
    if (!gameId) return "";
    if (recordsByGameId[gameId]) {
      return recordsByGameId[gameId];
    }
    stored = readRecordsJsonFromBrowserStorage(gameId);
    if (stored) {
      recordsByGameId[gameId] = stored;
      return stored;
    }
    return "";
  }

  function setGameRecordsJson(gameId, recordsJson) {
    if (!gameId) return;
    if (!recordsJson) {
      recordsJson = "";
    }
    recordsByGameId[gameId] = recordsJson;
    writeRecordsJsonToBrowserStorage(gameId, recordsJson);
  }

  function mergeStorageEntry(gameId, storageKey, storageValue) {
    var recordsObject = {};
    var recordsJson = getGameRecordsJson(gameId);
    if (recordsJson) {
      try {
        recordsObject = JSON.parse(recordsJson);
      } catch (error) {
        recordsObject = {};
      }
    }
    if (!storageKey) return;
    recordsObject[storageKey] = storageValue == null ? "" : String(storageValue);
    setGameRecordsJson(gameId, JSON.stringify(recordsObject));
  }

  function buildIframeBridgeScript(gameId, recordsJson) {
    var safeGameId = JSON.stringify(gameId);
    var safeRecordsJson = JSON.stringify(recordsJson || "");
    return (
      "(function(){var gameId=" +
      safeGameId +
      ";var recordsJson=" +
      safeRecordsJson +
      ";var recordsObject={};var storageKey;var storageValue;" +
      "if(recordsJson){try{recordsObject=JSON.parse(recordsJson);}catch(error){recordsObject={};}}" +
      "for(storageKey in recordsObject){if(!Object.prototype.hasOwnProperty.call(recordsObject,storageKey))continue;" +
      "storageValue=recordsObject[storageKey];try{localStorage.setItem(storageKey,storageValue);}catch(error){}}" +
      "var nativeSetItem=Storage.prototype.setItem;" +
      "Storage.prototype.setItem=function(key,value){nativeSetItem.call(this,key,value);" +
      "if(window.parent&&window.parent!==window){window.parent.postMessage({type:'" +
      IFRAME_MESSAGE_TYPE +
      "',gameId:gameId,key:key,value:value==null?'':String(value)},'*');}};" +
      "})();"
    );
  }

  function injectIframeRecordsBridge(frameElement, gameId) {
    var frameWindow;
    var recordsJson;
    if (!frameElement || !gameId) return;
    try {
      frameWindow = frameElement.contentWindow;
    } catch (error) {
      return;
    }
    if (!frameWindow) return;
    recordsJson = getGameRecordsJson(gameId);
    try {
      frameWindow.eval(buildIframeBridgeScript(gameId, recordsJson));
    } catch (error) {
    }
  }

  function onIframeStorageMessage(event) {
    var data;
    if (!event || !event.data) return;
    data = event.data;
    if (data.type !== IFRAME_MESSAGE_TYPE) return;
    if (!data.gameId || !data.key) return;
    mergeStorageEntry(data.gameId, data.key, data.value);
  }

  function applyRecordsPayload(payload) {
    var records;
    var index;
    var entry;
    var gameId;
    var recordsJson;
    if (!payload) return;
    records = payload.records;
    if (!records || !records.length) return;
    for (index = 0; index < records.length; index++) {
      entry = records[index];
      if (!entry || !entry.gameId) continue;
      gameId = entry.gameId;
      recordsJson = entry.recordsJson || "";
      recordsByGameId[gameId] = recordsJson;
      writeRecordsJsonToBrowserStorage(gameId, recordsJson);
    }
  }

  window.addEventListener("message", onIframeStorageMessage);

  window.WebMenuGameRecords = {
    getGameRecordsJson: getGameRecordsJson,
    setGameRecordsJson: setGameRecordsJson,
    applyRecords: applyRecordsPayload,
    installIframeRecordsBridge: injectIframeRecordsBridge
  };
})();
