(function () {
  var sharedContext = null;

  function getContext() {
    if (!sharedContext) {
      sharedContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return sharedContext;
  }

  function resumeContext() {
    var context = getContext();
    if (context.state === "suspended") {
      context.resume();
    }
  }

  function clamp01(value) {
    if (value < 0) {
      return 0;
    }
    if (value > 1) {
      return 1;
    }
    return value;
  }

  function decodeAudioArrayBuffer(context, arrayBuffer) {
    var decodePromise = context.decodeAudioData(arrayBuffer);
    if (decodePromise && decodePromise.then) {
      return decodePromise;
    }
    return new Promise(function (resolve, reject) {
      context.decodeAudioData(arrayBuffer, resolve, reject);
    });
  }

  function loadAudioBuffer(context, audioPath) {
    return fetch(audioPath)
      .then(function (response) {
        return response.arrayBuffer();
      })
      .then(function (arrayBuffer) {
        return decodeAudioArrayBuffer(context, arrayBuffer);
      });
  }

  function createSeamlessLoopAudio(audioPath) {
    var context = getContext();
    var gainNode = context.createGain();
    gainNode.connect(context.destination);

    var audioBuffer = null;
    var activeSource = null;
    var startedAt = 0;
    var offsetAtStart = 0;
    var outputVolume = 1;
    var playbackRateValue = 1;
    var isPausedState = true;
    var loadPromise = null;

    function applyGain() {
      gainNode.gain.value = outputVolume;
    }

    function clearSource() {
      if (!activeSource) {
        return;
      }
      try {
        activeSource.stop();
      } catch (error) {
      }
      activeSource.disconnect();
      activeSource = null;
    }

    function getPlaybackOffset() {
      if (!audioBuffer) {
        return offsetAtStart;
      }
      if (isPausedState || !activeSource) {
        return offsetAtStart;
      }
      var elapsed = (context.currentTime - startedAt) * playbackRateValue;
      var duration = audioBuffer.duration;
      if (duration <= 0) {
        return 0;
      }
      return elapsed % duration;
    }

    function startSource(fromOffset) {
      clearSource();
      if (!audioBuffer) {
        return false;
      }
      activeSource = context.createBufferSource();
      activeSource.buffer = audioBuffer;
      activeSource.loop = true;
      activeSource.playbackRate.value = playbackRateValue;
      activeSource.connect(gainNode);
      offsetAtStart = fromOffset;
      if (offsetAtStart < 0) {
        offsetAtStart = 0;
      }
      if (offsetAtStart >= audioBuffer.duration) {
        offsetAtStart = 0;
      }
      startedAt = context.currentTime - offsetAtStart / playbackRateValue;
      activeSource.start(0, offsetAtStart);
      isPausedState = false;
      return true;
    }

    function ensureLoaded() {
      if (audioBuffer) {
        return Promise.resolve(audioBuffer);
      }
      if (loadPromise) {
        return loadPromise;
      }
      loadPromise = loadAudioBuffer(context, audioPath).then(function (buffer) {
        audioBuffer = buffer;
        return buffer;
      });
      return loadPromise;
    }

    ensureLoaded().catch(function () {});

    return {
      preload: "auto",
      preservesPitch: undefined,
      get volume() {
        return outputVolume;
      },
      set volume(value) {
        outputVolume = clamp01(Number(value));
        applyGain();
      },
      get playbackRate() {
        return playbackRateValue;
      },
      set playbackRate(value) {
        var nextRate = Number(value);
        if (isNaN(nextRate) || nextRate <= 0) {
          nextRate = 0.01;
        }
        playbackRateValue = nextRate;
        if (activeSource) {
          activeSource.playbackRate.value = playbackRateValue;
        }
      },
      get paused() {
        return isPausedState;
      },
      get currentTime() {
        return getPlaybackOffset();
      },
      set currentTime(value) {
        var nextOffset = Number(value);
        if (isNaN(nextOffset) || nextOffset < 0) {
          nextOffset = 0;
        }
        offsetAtStart = nextOffset;
        if (!isPausedState && audioBuffer) {
          startSource(offsetAtStart);
        }
      },
      play: function () {
        resumeContext();
        return ensureLoaded().then(function () {
          if (!isPausedState && activeSource) {
            return undefined;
          }
          applyGain();
          if (!startSource(offsetAtStart)) {
            return Promise.reject(new Error("play failed"));
          }
          return undefined;
        });
      },
      pause: function () {
        if (isPausedState) {
          return;
        }
        offsetAtStart = getPlaybackOffset();
        clearSource();
        isPausedState = true;
      }
    };
  }

  function createLoopAudio(audioPath) {
    if (window.AudioContext || window.webkitAudioContext) {
      return createSeamlessLoopAudio(audioPath);
    }
    var fallbackAudio = new Audio(audioPath);
    fallbackAudio.loop = true;
    fallbackAudio.preload = "auto";
    return fallbackAudio;
  }

  window.WebUiSeamlessLoopAudio = {
    create: createLoopAudio,
    resumeContext: resumeContext
  };
})();
