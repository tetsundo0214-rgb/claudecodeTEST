const STORAGE_KEY = "simple-alarm-list";

const clockEl = document.getElementById("clock");
const inputEl = document.getElementById("alarmInput");
const addBtn = document.getElementById("addBtn");
const listEl = document.getElementById("alarmList");
const ringingEl = document.getElementById("ringing");
const stopBtn = document.getElementById("stopBtn");

let alarms = loadAlarms();
let lastTriggeredKey = null;
let audioCtx = null;
let ringTimer = null;

render();
tick();
setInterval(tick, 1000);

addBtn.addEventListener("click", () => {
  const value = inputEl.value;
  if (!value) return;
  if (alarms.some((a) => a.time === value)) {
    inputEl.value = "";
    return;
  }
  alarms.push({ id: crypto.randomUUID(), time: value, enabled: true });
  alarms.sort((a, b) => a.time.localeCompare(b.time));
  saveAlarms();
  render();
  inputEl.value = "";
});

stopBtn.addEventListener("click", stopRinging);

function tick() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString("ja-JP", { hour12: false });

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const current = `${hh}:${mm}`;
  const key = `${now.toDateString()} ${current}`;

  if (now.getSeconds() === 0 && key !== lastTriggeredKey) {
    const hit = alarms.find((a) => a.enabled && a.time === current);
    if (hit) {
      lastTriggeredKey = key;
      startRinging();
    }
  }
}

function render() {
  listEl.innerHTML = "";
  for (const alarm of alarms) {
    const li = document.createElement("li");
    li.className = "alarm-item" + (alarm.enabled ? "" : " off");

    const time = document.createElement("span");
    time.className = "time";
    time.textContent = alarm.time;

    const actions = document.createElement("div");
    actions.className = "actions";

    const label = document.createElement("label");
    label.className = "switch";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = alarm.enabled;
    checkbox.addEventListener("change", () => {
      alarm.enabled = checkbox.checked;
      saveAlarms();
      render();
    });
    const slider = document.createElement("span");
    slider.className = "slider";
    label.append(checkbox, slider);

    const del = document.createElement("button");
    del.className = "delete";
    del.type = "button";
    del.textContent = "削除";
    del.addEventListener("click", () => {
      alarms = alarms.filter((a) => a.id !== alarm.id);
      saveAlarms();
      render();
    });

    actions.append(label, del);
    li.append(time, actions);
    listEl.appendChild(li);
  }
}

function loadAlarms() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAlarms() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
}

function startRinging() {
  ringingEl.hidden = false;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const beep = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.42);
  };
  beep();
  ringTimer = setInterval(beep, 700);
}

function stopRinging() {
  ringingEl.hidden = true;
  if (ringTimer) {
    clearInterval(ringTimer);
    ringTimer = null;
  }
}
