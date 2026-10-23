// Everything the app remembers, in this browser's localStorage. Swap this module to add sync later.
const KEY = "funTypingTest.v1";
const MAX_RUNS = 500;

export const DEFAULT_SETTINGS = {
  theme: "system", // system | light | dark
  duration: 30, // seconds: 15 | 30 | 60
  source: "words", // words | silly
  ghost: true,
  liveWpm: true,
  combo: true,
  smoothCaret: true,
  sounds: false,
  particles: false,
};

function empty() {
  return { settings: { ...DEFAULT_SETTINGS }, runs: [], bests: {}, feedback: [] };
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (!data) return empty();
    return { ...empty(), ...data, settings: { ...DEFAULT_SETTINGS, ...data.settings } };
  } catch (err) {
    console.warn("[storage] could not read saved data, starting fresh", err);
    return empty();
  }
}

let state = load();
let saveTimer = 0;

// Writes are batched and run off the keystroke path.
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("[storage] could not save", err);
    }
  }, 300);
}

export const modeKey = (source, duration) => `${source}-${duration}`;

export const store = {
  settings: () => state.settings,
  setSetting(name, value) {
    state.settings[name] = value;
    save();
  },
  best: (key) => state.bests[key] ?? null,
  // Records a run; returns the previous best so the UI can say by how much it was beaten.
  addRun(run) {
    const key = modeKey(run.source, run.duration);
    const previous = state.bests[key] ?? null;
    state.runs.push(run);
    if (state.runs.length > MAX_RUNS) state.runs.splice(0, state.runs.length - MAX_RUNS);
    if (run.wpm > (previous?.wpm ?? 0)) state.bests[key] = { wpm: run.wpm, ts: run.ts };
    save();
    return previous;
  },
  runs: (key) => state.runs.filter((r) => modeKey(r.source, r.duration) === key),
  addFeedback(text) {
    state.feedback.push({ ts: Date.now(), text });
    save();
  },
  clearHistory() {
    state.runs = [];
    state.bests = {};
    save();
  },
};
