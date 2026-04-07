(() => {
  "use strict";

  const STORAGE_KEY = "timeMarimoSave_v1";

  const state = {
    elapsedSeconds: 0,
    marimoSizeMm: 10,
    tapCount: 0,
    timeFormatIndex: 0, // 0:秒, 1:分:秒, 2:時:分:秒, 3:日:時:分:秒
    sizeFormatIndex: 0  // 0:mm, 1:cm, 2:m, 3:km
  };

  const elements = {
    marimo: document.getElementById("marimo"),
    marimoWrap: document.getElementById("marimoWrap"),
    sizeDisplay: document.getElementById("sizeDisplay"),
    timeDisplay: document.getElementById("timeDisplay"),
    tapDisplay: document.getElementById("tapDisplay"),
    timeCard: document.getElementById("timeCard"),
    sizeCard: document.getElementById("sizeCard")
  };

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      elapsedSeconds: state.elapsedSeconds,
      marimoSizeMm: state.marimoSizeMm,
      tapCount: state.tapCount,
      timeFormatIndex: state.timeFormatIndex,
      sizeFormatIndex: state.sizeFormatIndex
    }));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const data = JSON.parse(raw);

      if (typeof data.elapsedSeconds === "number" && data.elapsedSeconds >= 0) {
        state.elapsedSeconds = Math.floor(data.elapsedSeconds);
      }

      if (typeof data.marimoSizeMm === "number" && data.marimoSizeMm >= 10) {
        state.marimoSizeMm = Math.floor(data.marimoSizeMm);
      }

      if (typeof data.tapCount === "number" && data.tapCount >= 0) {
        state.tapCount = Math.floor(data.tapCount);
      }

      if (typeof data.timeFormatIndex === "number") {
        state.timeFormatIndex = data.timeFormatIndex % 4;
      }

      if (typeof data.sizeFormatIndex === "number") {
        state.sizeFormatIndex = data.sizeFormatIndex % 4;
      }
    } catch (error) {
      console.error("保存データの読み込みに失敗しました:", error);
    }
  }

  function pad2(num) {
    return String(num).padStart(2, "0");
  }

  function formatTime(totalSeconds, formatIndex) {
    const sec = Math.floor(totalSeconds);

    if (formatIndex === 0) {
      return `${sec.toLocaleString("ja-JP")} 秒`;
    }

    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;

    if (formatIndex === 1) {
      const totalMinutes = Math.floor(sec / 60);
      return `${totalMinutes}:${pad2(seconds)}`;
    }

    if (formatIndex === 2) {
      const totalHours = Math.floor(sec / 3600);
      const remainMinutes = Math.floor((sec % 3600) / 60);
      return `${totalHours}:${pad2(remainMinutes)}:${pad2(seconds)}`;
    }

    return `${days}:${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  }

  function formatSize(totalMm, formatIndex) {
    const mm = totalMm;

    if (formatIndex === 0) {
      return `${mm.toLocaleString("ja-JP")} mm`;
    }

    if (formatIndex === 1) {
      return `${(mm / 10).toFixed(1)} cm`;
    }

    if (formatIndex === 2) {
      return `${(mm / 1000).toFixed(3)} m`;
    }

    return `${(mm / 1000000).toFixed(6)} km`;
  }

  function calculateDisplayDiameter(mm) {
    const base = 70;
    const growth = Math.sqrt(mm) * 7;
    let size = base + growth;

    if (size > 170) {
      size = 150 + (size - 170) * 0.55;
    }

    if (size > 240) {
      size = 205 + (size - 240) * 0.35;
    }

    if (size > 300) {
      size = 226 + (size - 300) * 0.22;
    }

    return Math.max(70, Math.min(size, 280));
  }

  function updateMarimoVisual() {
    const displayDiameter = calculateDisplayDiameter(state.marimoSizeMm);
    elements.marimo.style.width = `${displayDiameter}px`;
    elements.marimo.style.height = `${displayDiameter}px`;

    const sway = Math.sin(state.elapsedSeconds / 6) * 4;
    elements.marimo.style.transform = `translateX(${sway}px)`;
  }

  function render() {
    elements.sizeDisplay.textContent = formatSize(state.marimoSizeMm, state.sizeFormatIndex);
    elements.timeDisplay.textContent = formatTime(state.elapsedSeconds, state.timeFormatIndex);
    elements.tapDisplay.textContent = `${state.tapCount.toLocaleString("ja-JP")} 回`;
    updateMarimoVisual();
  }

  function growByTime() {
    state.elapsedSeconds += 1;
    state.marimoSizeMm += 1;
    render();
    saveState();
  }

  function growByTap() {
    state.marimoSizeMm += 1;
    state.tapCount += 1;
    render();
    saveState();
  }

  function nextTimeFormat() {
    state.timeFormatIndex = (state.timeFormatIndex + 1) % 4;
    render();
    saveState();
  }

  function nextSizeFormat() {
    state.sizeFormatIndex = (state.sizeFormatIndex + 1) % 4;
    render();
    saveState();
  }

  function handleKeyboardToggle(event, callback) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      callback();
    }
  }

  loadState();
  render();

  elements.marimo.addEventListener("click", growByTap);

  elements.timeCard.addEventListener("click", nextTimeFormat);
  elements.sizeCard.addEventListener("click", nextSizeFormat);

  elements.timeCard.addEventListener("keydown", (event) => {
    handleKeyboardToggle(event, nextTimeFormat);
  });

  elements.sizeCard.addEventListener("keydown", (event) => {
    handleKeyboardToggle(event, nextSizeFormat);
  });

  setInterval(growByTime, 1000);
})();