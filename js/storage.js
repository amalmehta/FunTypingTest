// Everything the app remembers, in this browser's localStorage. Swap this module to add sync later.
const KEY = "funTypingTest.v1";
const MAX_RUNS = 500;

export const DEFAULT_SETTINGS = {
  theme: "system", // system | light | dark
  mode: "time", // time | words | quote
  duration: 30, // seconds, for time mode: 15 | 30 | 60 | 120
  wordCount: 25, // word count, for words mode: 10 | 25 | 50 | 100
  source: "words", // text for time and words modes: words | silly
  punctuation: false, // common words only
  numbers: false, // common words only
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
    const base = empty();
    return {
      ...base,
      ...data,
      settings: { ...DEFAULT_SETTINGS, ...data.settings },
      runs: Array.isArray(data.runs) ? data.runs : base.runs,
      bests: data.bests && typeof data.bests === "object" ? data.bests : base.bests,
      feedback: Array.isArray(data.feedback) ? data.feedback : base.feedback,
    };
  } catch (err) {
    console.warn("[storage] could not read saved data, starting fresh", err);
    return empty();
  }
}

let state = load();
let saveTimer = 0;
let saveWarned = false;

// Storage can be missing or full (private windows, blocked site data); the app then keeps
// working from memory for this visit.
function write() {
  clearTimeout(saveTimer);
  saveTimer = 0;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    if (!saveWarned) console.warn("[storage] could not save; keeping results for this visit only", err);
    saveWarned = true;
  }
}

// Setting changes are batched; finished runs are written at once so closing the tab can't lose them.
function save(now = false) {
  if (now) return write();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(write, 300);
}
globalThis.addEventListener?.("pagehide", () => { if (saveTimer) write(); });

// One key per mode, so each has its own personal best. Runs saved before word and quote modes
// existed have no `mode` and are timed, so their keys ("words-30") are unchanged.
export function modeKey({ mode = "time", source, duration, wordCount, punctuation, numbers }) {
  if (mode === "quote") return "quote";
  const flags = source === "words" ? `${punctuation ? "-p" : ""}${numbers ? "-n" : ""}` : "";
  return mode === "words" ? `${source}-${wordCount}w${flags}` : `${source}-${duration}${flags}`;
}


export const store = {
  settings: () => state.settings,
  setSetting(name, value) {
    state.settings[name] = value;
    save();
  },
  best: (key) => state.bests[key] ?? null,
  // Records a run; returns the previous best so the UI can say by how much it was beaten.
  // A run that beats an existing best is flagged `pb` so the history can mark it.
  addRun(run) {
    const key = modeKey(run);
    const previous = state.bests[key] ?? null;
    const isBest = run.wpm > (previous?.wpm ?? 0);
    state.runs.push(previous && isBest ? { ...run, pb: true } : run);
    if (state.runs.length > MAX_RUNS) state.runs.splice(0, state.runs.length - MAX_RUNS);
    if (isBest) state.bests[key] = { wpm: run.wpm, ts: run.ts };
    save(true);
    return previous;
  },
  runs: (key) => state.runs.filter((r) => modeKey(r) === key),
  // The last n runs across every mode, oldest first.
  recent: (n) => state.runs.slice(-n),
  count: () => state.runs.length,
  addFeedback(text) {
    state.feedback.push({ ts: Date.now(), text });
    save();
  },
  clearHistory() {
    state.runs = [];
    state.bests = {};
    save(true);
  },
};
