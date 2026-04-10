(() => {
  "use strict";

  const STORAGE_KEY = "timeMarimoSave_v1";
  const EXPORT_PREFIX = "TIME_MARIMO_SAVE_V1:";

  const state = {
    elapsedSeconds: 0,
    marimoSizeMm: 10,
    tapCount: 0,
    timeFormatIndex: 0, // 0:秒, 1:分:秒, 2:時:分:秒, 3:日:時:分:秒
    sizeFormatIndex: 0, // 0:mm, 1:cm, 2:m, 3:km
    isPaused: false
  };

  let timerId = null;

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
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        elapsedSeconds: state.elapsedSeconds,
        marimoSizeMm: state.marimoSizeMm,
        tapCount: state.tapCount,
        timeFormatIndex: state.timeFormatIndex,
        sizeFormatIndex: state.sizeFormatIndex
      })
    );
  }

  function applyLoadedData(data) {
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
      state.timeFormatIndex = ((Math.floor(data.timeFormatIndex) % 4) + 4) % 4;
    }

    if (typeof data.sizeFormatIndex === "number") {
      state.sizeFormatIndex = ((Math.floor(data.sizeFormatIndex) % 4) + 4) % 4;
    }
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      applyLoadedData(data);
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

    if (transferUI && transferUI.codeOutput && state.isPaused) {
      transferUI.codeOutput.value = createExportCode();
    }
  }

  function growByTime() {
    if (state.isPaused) return;

    state.elapsedSeconds += 1;
    state.marimoSizeMm += 1;
    render();
    saveState();
  }

  function growByTap() {
    if (state.isPaused) return;

    state.marimoSizeMm += 1;
    state.tapCount += 1;
    render();
    saveState();
  }

  function nextTimeFormat() {
    if (state.isPaused) return;

    state.timeFormatIndex = (state.timeFormatIndex + 1) % 4;
    render();
    saveState();
  }

  function nextSizeFormat() {
    if (state.isPaused) return;

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

  function startGameLoop() {
    if (timerId !== null) return;
    timerId = setInterval(growByTime, 1000);
  }

  function stopGameLoop() {
    if (timerId === null) return;
    clearInterval(timerId);
    timerId = null;
  }

  function pauseGame() {
    state.isPaused = true;
    stopGameLoop();
    document.body.classList.add("game-paused");
  }

  function resumeGame() {
    state.isPaused = false;
    document.body.classList.remove("game-paused");
    startGameLoop();
  }

  function encodeBase64Utf8(text) {
    return btoa(unescape(encodeURIComponent(text)));
  }

  function decodeBase64Utf8(base64Text) {
    return decodeURIComponent(escape(atob(base64Text)));
  }

  function createExportCode() {
    const payload = {
      version: 1,
      elapsedSeconds: state.elapsedSeconds,
      marimoSizeMm: state.marimoSizeMm,
      tapCount: state.tapCount,
      timeFormatIndex: state.timeFormatIndex,
      sizeFormatIndex: state.sizeFormatIndex
    };

    return EXPORT_PREFIX + encodeBase64Utf8(JSON.stringify(payload));
  }

  function parseImportCode(input) {
    const trimmed = String(input || "").trim();

    if (!trimmed) {
      throw new Error("引き継ぎコードを貼り付けてください。");
    }

    if (!trimmed.startsWith(EXPORT_PREFIX)) {
      throw new Error("引き継ぎコードの形式が正しくありません。");
    }

    const encoded = trimmed.slice(EXPORT_PREFIX.length);

    if (!encoded) {
      throw new Error("引き継ぎコードが空です。");
    }

    let parsed;

    try {
      const jsonText = decodeBase64Utf8(encoded);
      parsed = JSON.parse(jsonText);
    } catch (error) {
      throw new Error("引き継ぎコードの読み込みに失敗しました。");
    }

    if (!parsed || typeof parsed !== "object") {
      throw new Error("引き継ぎコードの内容が正しくありません。");
    }

    if (parsed.version !== 1) {
      throw new Error("この引き継ぎコードのバージョンには対応していません。");
    }

    if (typeof parsed.elapsedSeconds !== "number" || parsed.elapsedSeconds < 0) {
      throw new Error("経過時間データが正しくありません。");
    }

    if (typeof parsed.marimoSizeMm !== "number" || parsed.marimoSizeMm < 10) {
      throw new Error("まりもの大きさデータが正しくありません。");
    }

    if (typeof parsed.tapCount !== "number" || parsed.tapCount < 0) {
      throw new Error("タップ回数データが正しくありません。");
    }

    if (typeof parsed.timeFormatIndex !== "number" || typeof parsed.sizeFormatIndex !== "number") {
      throw new Error("表示形式データが正しくありません。");
    }

    return parsed;
  }

  function createTransferModal() {
    const transferButton = document.createElement("button");
    transferButton.type = "button";
    transferButton.id = "transferButton";
    transferButton.className = "transfer-button";
    transferButton.textContent = "データ引き継ぎはこちら";

    const infoSection = document.querySelector(".info-section");
    if (infoSection) {
      infoSection.appendChild(transferButton);
    }

    const modal = document.createElement("div");
    modal.id = "transferModal";
    modal.className = "transfer-modal";
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
      <div class="transfer-modal-card" role="dialog" aria-modal="true" aria-labelledby="transferTitle">
        <h2 class="transfer-title" id="transferTitle">データ引き継ぎ</h2>

        <div class="transfer-block">
          <label class="transfer-label" for="transferCodeOutput">現在の引き継ぎコード</label>
          <textarea id="transferCodeOutput" class="transfer-code" readonly></textarea>
          <div class="transfer-copy-row">
            <button type="button" id="copyTransferButton" class="modal-button copy-button">コピー</button>
          </div>
        </div>

        <div class="transfer-block">
          <label class="transfer-label" for="transferCodeInput">引き継ぎコードを貼り付け</label>
          <textarea id="transferCodeInput" class="transfer-input" placeholder="ここに引き継ぎコードを貼り付けてください"></textarea>
        </div>

        <div class="transfer-actions">
          <button type="button" id="importButton" class="modal-button">読み込む</button>
          <button type="button" id="closeTransferButton" class="modal-button secondary">閉じる</button>
        </div>

        <div id="transferMessage" class="transfer-message" aria-live="polite"></div>

        <p class="transfer-note">
          コードはメモ帳などに保存してください。機種変更前に保存し、変更後の端末で貼り付けると続きから遊べます。
        </p>
      </div>
    `;

    document.body.appendChild(modal);

    return {
      openButton: transferButton,
      modal,
      codeOutput: document.getElementById("transferCodeOutput"),
      codeInput: document.getElementById("transferCodeInput"),
      copyButton: document.getElementById("copyTransferButton"),
      importButton: document.getElementById("importButton"),
      closeButton: document.getElementById("closeTransferButton"),
      message: document.getElementById("transferMessage")
    };
  }

  function setTransferMessage(text, type) {
    transferUI.message.textContent = text;
    transferUI.message.className = "transfer-message";

    if (type === "success") {
      transferUI.message.classList.add("success");
    }

    if (type === "error") {
      transferUI.message.classList.add("error");
    }
  }

  function openTransferModal() {
    pauseGame();
    transferUI.codeOutput.value = createExportCode();
    transferUI.codeInput.value = "";
    setTransferMessage("", "");
    transferUI.modal.classList.add("is-open");
    transferUI.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    setTimeout(() => {
      transferUI.codeOutput.focus();
      transferUI.codeOutput.select();
    }, 0);
  }

  function closeTransferModal() {
    transferUI.modal.classList.remove("is-open");
    transferUI.modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    transferUI.openButton.focus();
    resumeGame();
  }

  function importStateFromCode() {
    try {
      const importedData = parseImportCode(transferUI.codeInput.value);
      applyLoadedData(importedData);
      saveState();
      render();
      transferUI.codeOutput.value = createExportCode();
      setTransferMessage("読み込みに成功しました。閉じると続きから再開できます。", "success");
    } catch (error) {
      setTransferMessage(error.message || "読み込みに失敗しました。", "error");
    }
  }

  function fallbackCopyText(text) {
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.setAttribute("readonly", "");
    temp.style.position = "fixed";
    temp.style.top = "-9999px";
    temp.style.left = "-9999px";
    document.body.appendChild(temp);
    temp.focus();
    temp.select();

    let copied = false;

    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(temp);
    return copied;
  }

  async function copyTransferCode() {
    const code = transferUI.codeOutput.value;

    if (!code) {
      setTransferMessage("コピーする引き継ぎコードがありません。", "error");
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        const copied = fallbackCopyText(code);
        if (!copied) {
          throw new Error("copy_failed");
        }
      }

      setTransferMessage("コピーしました。", "success");
    } catch (error) {
      setTransferMessage("コピーに失敗しました。手動でコピーしてください。", "error");
      transferUI.codeOutput.focus();
      transferUI.codeOutput.select();
    }
  }

  loadState();
  const transferUI = createTransferModal();
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

  transferUI.openButton.addEventListener("click", openTransferModal);
  transferUI.copyButton.addEventListener("click", copyTransferCode);
  transferUI.closeButton.addEventListener("click", closeTransferModal);
  transferUI.importButton.addEventListener("click", importStateFromCode);

  transferUI.modal.addEventListener("click", (event) => {
    if (event.target === transferUI.modal) {
      closeTransferModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && transferUI.modal.classList.contains("is-open")) {
      closeTransferModal();
    }
  });

  startGameLoop();
})();
