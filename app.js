const eventLogsEl = document.getElementById("eventLogs");
const clearLogsBtn = document.getElementById("clearLogsBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const modeSelect = document.getElementById("modeSelect");
const startBtn = document.getElementById("startBtn");
const safeBtn = document.getElementById("safeBtn");

const xEl = document.getElementById("x");
const yEl = document.getElementById("y");
const zEl = document.getElementById("z");

const motionStateEl = document.getElementById("motionState");
const motionBarEl = document.getElementById("motionBar");
const signatureEl = document.getElementById("signature");
const statusEl = document.getElementById("status");
const alertBoxEl = document.getElementById("alertBox");

function updateSample(sample) {
  xEl.innerText = sample.x.toFixed(2);
  yEl.innerText = sample.y.toFixed(2);
  zEl.innerText = sample.z.toFixed(2);

  const percent = Math.min(sample.magnitude * 15, 100);
  motionBarEl.style.width = percent + "%";
}

function showResult(result) {
  const selectedMode = modeSelect.value;

  let modeLabel = "";

  if (selectedMode === "human") {
    modeLabel = "Human Safety Mode";
  }

  if (selectedMode === "road") {
    modeLabel = "Road Intelligence Mode";
  }

  if (selectedMode === "security") {
    modeLabel = "Security / Theft Mode";
  }

  if (selectedMode === "home") {
    modeLabel = "Smart Home Mode";
  }

  if (selectedMode === "research") {
    modeLabel = "Air / Water Research Mode";
  }

  motionStateEl.innerText = result.state;

  signatureEl.innerText =
    "Mode → " + modeLabel +
    " | M: " + result.avg.toFixed(2) +
    " | P: " + result.max.toFixed(2) +
    " | Stability: " + result.stability;

  statusEl.innerText =
    "Analyzed " + result.samples + " samples in 5 seconds";

  const percent = Math.min(result.avg * 20, 100);
  motionBarEl.style.width = percent + "%";
saveLog({
  mode: modeLabel,
  state: result.state,
  avg: result.avg.toFixed(2),
  max: result.max.toFixed(2),
  stability: result.stability,
  samples: result.samples,
  time: new Date().toLocaleString()
});
}

function showEmergencyAlert() {
  alertBoxEl.style.display = "block";

  setTimeout(() => {
    alert("🚑 Emergency services alerted!");
  }, 1000);
}

function resetUI() {
  motionStateEl.innerText = "Analyzing...";
  signatureEl.innerText = "";
  statusEl.innerText = "Collecting sensor data for 5 seconds...";
  alertBoxEl.style.display = "none";
  motionBarEl.style.width = "0%";
}

function getLogs() {
  return JSON.parse(localStorage.getItem("motioncore_logs")) || [];
}

function saveLog(log) {
  const logs = getLogs();
  logs.unshift(log);
  localStorage.setItem("motioncore_logs", JSON.stringify(logs.slice(0, 20)));
  renderLogs();
}

function renderLogs() {
  const logs = getLogs();

  if (logs.length === 0) {
    eventLogsEl.innerText = "No events recorded yet.";
    return;
  }

  eventLogsEl.innerHTML = logs.map((log) => {
    return `
      <div class="log-item">
        <strong>${log.state}</strong><br>
        Mode: ${log.mode}<br>
        M: ${log.avg} | P: ${log.max} | Stability: ${log.stability}<br>
        ${log.time}
      </div>
    `;
  }).join("");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function exportJSON() {
  const logs = getLogs();

  if (logs.length === 0) {
    alert("No logs to export.");
    return;
  }

  downloadFile(
    "motioncore_logs.json",
    JSON.stringify(logs, null, 2),
    "application/json"
  );
}

function exportCSV() {
  const logs = getLogs();

  if (logs.length === 0) {
    alert("No logs to export.");
    return;
  }

  const headers = "mode,state,avg,max,stability,samples,time\n";

  const rows = logs.map((log) => {
    return [
      log.mode,
      log.state,
      log.avg,
      log.max,
      log.stability,
      log.samples,
      log.time
    ].join(",");
  }).join("\n");

  downloadFile(
    "motioncore_logs.csv",
    headers + rows,
    "text/csv"
  );
}


startBtn.addEventListener("click", () => {
  resetUI();

  localStorage.setItem("motioncore_mode", modeSelect.value);

  MotionEngine.start(
    updateSample,
    showEmergencyAlert,
    showResult
  );
});

safeBtn.addEventListener("click", () => {
  MotionEngine.cancelEmergency();
  alertBoxEl.style.display = "none";
  statusEl.innerText = "Emergency alert cancelled by user.";
});
clearLogsBtn.addEventListener("click", () => {
  localStorage.removeItem("motioncore_logs");
  renderLogs();
});

exportJsonBtn.addEventListener("click", exportJSON);
exportCsvBtn.addEventListener("click", exportCSV);

renderLogs();
