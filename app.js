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
