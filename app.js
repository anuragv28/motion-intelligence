import { SensorSource, getCurrentLocation } from '../core/sensor-source.js';
import { FallDetector, computeMagnitude, computeWindowStats, DEFAULT_CONFIG } from '../core/motion-engine.js';

// ---- State ----
const config = { ...DEFAULT_CONFIG };
const sensor = new SensorSource();
let detector = new FallDetector(config);
let monitoring = false;
let recentSamples = []; // rolling window for readouts + waveform
let events = JSON.parse(localStorage.getItem('motioncore_events') || '[]');
let cancelTimerId = null;
let cancelSecondsLeft = 0;

// ---- DOM refs ----
const appEl = document.querySelector('.app');
const toggleBtn = document.getElementById('toggleBtn');
const statusLabel = document.getElementById('statusLabel');
const permissionNote = document.getElementById('permissionNote');
const readMean = document.getElementById('readMean');
const readPeak = document.getElementById('readPeak');
const readVar = document.getElementById('readVar');
const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');
const impactSlider = document.getElementById('impactSlider');
const stillSlider = document.getElementById('stillSlider');
const impactVal = document.getElementById('impactVal');
const stillVal = document.getElementById('stillVal');
const eventList = document.getElementById('eventList');
const eventCount = document.getElementById('eventCount');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const clearBtn = document.getElementById('clearBtn');
const alertOverlay = document.getElementById('alertOverlay');
const alertTimer = document.getElementById('alertTimer');
const cancelAlertBtn = document.getElementById('cancelAlertBtn');

// ---- Canvas sizing ----
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const WAVEFORM_POINTS = 120;
let waveformBuffer = new Array(WAVEFORM_POINTS).fill(0);

function drawWaveform() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = '#1c2533';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  ctx.strokeStyle = monitoring ? '#3ddc97' : '#3a4456';
  ctx.lineWidth = 2 * devicePixelRatio;
  ctx.beginPath();

  const step = w / (WAVEFORM_POINTS - 1);
  waveformBuffer.forEach((val, i) => {
    const x = i * step;
    const y = h / 2 - Math.min(val, 3) * (h / 2.4);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function pushWaveformPoint(val) {
  waveformBuffer.push(val);
  waveformBuffer.shift();
  drawWaveform();
}

// ---- Settings sliders ----
impactSlider.addEventListener('input', () => {
  config.impactThresholdG = parseFloat(impactSlider.value);
  impactVal.textContent = `${config.impactThresholdG.toFixed(1)}g`;
  detector = new FallDetector(config);
});
stillSlider.addEventListener('input', () => {
  config.stillnessWindowMs = parseFloat(stillSlider.value) * 1000;
  stillVal.textContent = `${parseFloat(stillSlider.value).toFixed(1)}s`;
  detector = new FallDetector(config);
});

// ---- Sensor wiring ----
sensor.onSample((sample) => {
  const magnitude = computeMagnitude(sample.x, sample.y, sample.z);
  recentSamples.push(magnitude);
  if (recentSamples.length > 50) recentSamples.shift();

  const stats = computeWindowStats(recentSamples);
  readMean.innerHTML = `${stats.mean.toFixed(2)}<small>g</small>`;
  readPeak.innerHTML = `${stats.peak.toFixed(2)}<small>g</small>`;
  readVar.innerHTML = `${stats.variance.toFixed(2)}<small>g</small>`;

  pushWaveformPoint(magnitude);

  const result = detector.addSample(sample.x, sample.y, sample.z, sample.t);
  if (result) {
    handleFallCandidate(result);
  }
});

// ---- Monitoring toggle ----
toggleBtn.addEventListener('click', async () => {
  if (monitoring) {
    stopMonitoring();
  } else {
    await startMonitoring();
  }
});

async function startMonitoring() {
  permissionNote.textContent = '';
  try {
    await sensor.requestPermission();
  } catch (err) {
    permissionNote.textContent = err.message;
    return;
  }
  sensor.start();
  monitoring = true;
  appEl.dataset.status = 'monitoring';
  statusLabel.textContent = 'Monitoring';
  toggleBtn.textContent = 'Stop Monitoring';
}

function stopMonitoring() {
  sensor.stop();
  monitoring = false;
  appEl.dataset.status = 'idle';
  statusLabel.textContent = 'Idle';
  toggleBtn.textContent = 'Start Monitoring';
  detector.reset();
}

// ---- Fall candidate -> cancel window -> confirmed event ----
async function handleFallCandidate(result) {
  appEl.dataset.status = 'alert';
  alertOverlay.classList.add('active');
  cancelSecondsLeft = Math.round(config.cancelWindowMs / 1000);
  alertTimer.textContent = cancelSecondsLeft;

  const location = await getCurrentLocation();

  cancelTimerId = setInterval(() => {
    cancelSecondsLeft -= 1;
    alertTimer.textContent = cancelSecondsLeft;
    if (cancelSecondsLeft <= 0) {
      clearInterval(cancelTimerId);
      confirmEvent(result, location);
    }
  }, 1000);
}

cancelAlertBtn.addEventListener('click', () => {
  clearInterval(cancelTimerId);
  alertOverlay.classList.remove('active');
  appEl.dataset.status = monitoring ? 'monitoring' : 'idle';
});

function confirmEvent(result, location) {
  alertOverlay.classList.remove('active');
  appEl.dataset.status = monitoring ? 'monitoring' : 'idle';

  const event = {
    id: crypto.randomUUID(),
    type: 'fall_confirmed',
    magnitude: Number(result.magnitude.toFixed(3)),
    timestamp: result.timestamp,
    isoTime: new Date(result.timestamp).toISOString(),
    location,
  };
  events.unshift(event);
  localStorage.setItem('motioncore_events', JSON.stringify(events));
  renderEvents();

  // Placeholder for real alerting (SMS/push to emergency contact).
  // Wiring a real notification channel is a Phase 2 backend task —
  // see docs/ROADMAP.md.
  console.warn('[MotionCore] Confirmed fall event — no alert channel configured yet:', event);
}

// ---- Event list rendering ----
function renderEvents() {
  eventCount.textContent = events.length;
  if (events.length === 0) {
    eventList.innerHTML = '<p class="empty-state">No events yet. Logged events will appear here.</p>';
    return;
  }
  eventList.innerHTML = events
    .map(
      (e) => `
      <div class="event-item">
        <div class="event-time">${new Date(e.timestamp).toLocaleString()}</div>
        <div>Fall confirmed — peak ${e.magnitude}g${e.location ? ` · ${e.location.lat.toFixed(4)}, ${e.location.lng.toFixed(4)}` : ''}</div>
      </div>`
    )
    .join('');
}

// ---- Export ----
exportJsonBtn.addEventListener('click', () => {
  downloadFile('motioncore-events.json', JSON.stringify(events, null, 2), 'application/json');
});

exportCsvBtn.addEventListener('click', () => {
  const header = 'id,type,magnitude,isoTime,lat,lng\n';
  const rows = events
    .map((e) => `${e.id},${e.type},${e.magnitude},${e.isoTime},${e.location?.lat ?? ''},${e.location?.lng ?? ''}`)
    .join('\n');
  downloadFile('motioncore-events.csv', header + rows, 'text/csv');
});

clearBtn.addEventListener('click', () => {
  if (!confirm('Clear all logged events? This cannot be undone.')) return;
  events = [];
  localStorage.setItem('motioncore_events', JSON.stringify(events));
  renderEvents();
});

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Init ----
renderEvents();
drawWaveform();
