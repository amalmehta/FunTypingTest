// UI: wires the keyboard, the DOM and storage to the TypingTest engine.
import { TypingTest } from "./engine.js";
import { pacerPosition } from "./stats.js";
import { SOURCES } from "./words.js";
import { store, modeKey } from "./storage.js";
import { lineChart } from "./chart.js";
import { keySound, confetti } from "./effects.js";

const $ = (id) => document.getElementById(id);
const ui = {
  test: $("test"), results: $("results"), box: $("typing-box"), words: $("words"),
  caret: $("caret"), ghost: $("ghost"), input: $("hidden-input"), timer: $("timer"),
  liveWpm: $("live-wpm"), combo: $("combo"), comboN: $("combo-n"), pbHint: $("pb-hint"),
};

let test = null;
let wordEls = [];
let scrollY = 0;
let lastLiveUpdate = 0;
let lastGhostUpdate = 0;
let frame = 0;
let caretY = -1;
let resultsShownAt = 0;
const RESULTS_KEY_GUARD_MS = 500; // keys still in flight when time runs out must not skip the results

const settings = () => store.settings();
const currentKey = () => modeKey(settings().source, settings().duration);

// ---------- Theme and settings ----------

function applySettings() {
  const s = settings();
  if (s.theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = s.theme;
  ui.caret.classList.toggle("smooth", s.smoothCaret);
  ui.liveWpm.hidden = !s.liveWpm;
  for (const b of document.querySelectorAll("[data-duration]")) b.setAttribute("aria-checked", String(+b.dataset.duration === s.duration));
  for (const b of document.querySelectorAll("[data-source]")) b.setAttribute("aria-checked", String(b.dataset.source === s.source));
  for (const input of document.querySelectorAll("[data-setting]")) {
    const v = s[input.dataset.setting];
    if (input.type === "checkbox") input.checked = v;
    else input.value = v;
  }
}

// ---------- Rendering ----------

function wordEl(i) {
  const el = document.createElement("span");
  el.className = "word";
  paintWord(el, i);
  return el;
}

// Rebuilds one word's letters from the engine state. Only the touched words are repainted per key.
function paintWord(el, i) {
  const target = test.targets[i];
  const typed = test.typed[i] ?? "";
  const committed = i < test.index;
  const frag = document.createDocumentFragment();
  const n = Math.max(target.length, typed.length);
  for (let j = 0; j < n; j++) {
    const l = document.createElement("span");
    l.className = "l";
    if (j < target.length) {
      l.textContent = target[j];
      if (j < typed.length) l.classList.add(typed[j] === target[j] ? "ok" : "bad");
      else if (committed) l.classList.add("missed");
    } else {
      l.textContent = typed[j];
      l.classList.add("extra");
    }
    frag.append(l);
  }
  el.replaceChildren(frag);
  el.classList.toggle("wrong", committed && typed !== target);
}

function appendWords(fromIndex) {
  const frag = document.createDocumentFragment();
  for (let i = fromIndex; i < test.targets.length; i++) {
    const el = wordEl(i);
    wordEls.push(el);
    frag.append(el);
  }
  ui.words.append(frag);
}

// Positions the caret at the next letter and scrolls so the current line is never below line 2.
function placeCaret() {
  const el = wordEls[test.index];
  const letters = el.children;
  const at = test.typed[test.index].length;
  let x = el.offsetLeft;
  if (at < letters.length) x += letters[at].offsetLeft;
  else if (letters.length) x += letters[letters.length - 1].offsetLeft + letters[letters.length - 1].offsetWidth;
  const lineH = el.offsetHeight;
  const y = el.offsetTop;
  const wantScroll = Math.max(0, y - lineH);
  if (wantScroll !== scrollY) {
    scrollY = wantScroll;
    ui.words.style.transform = `translateY(${-scrollY}px)`;
  }
  // Jump, don't glide, onto a new line: gliding would sweep the caret back across the whole line.
  const newLine = y !== caretY;
  caretY = y;
  if (newLine) ui.caret.style.transition = "none";
  ui.caret.style.transform = `translate(${x}px, ${y - scrollY}px)`;
  if (newLine) {
    void ui.caret.offsetWidth; // commit the jump before restoring the transition
    ui.caret.style.transition = "";
  }
}

function placeGhost(now) {
  const best = store.best(currentKey());
  if (!settings().ghost || !best || test.status !== "running") {
    ui.ghost.hidden = true;
    return;
  }
  const pos = pacerPosition(test.targets, best.wpm, test.elapsed(now));
  const el = wordEls[pos.word];
  if (!el) return;
  const letter = el.children[Math.min(pos.letter, el.children.length - 1)];
  const x = el.offsetLeft + (letter?.offsetLeft ?? 0) + (pos.letter >= el.children.length ? letter?.offsetWidth ?? 0 : 0);
  const y = el.offsetTop - scrollY + el.offsetHeight - 6;
  ui.ghost.hidden = y < 0 || y > ui.box.clientHeight;
  ui.ghost.style.transform = `translate(${x}px, ${y}px)`;
}

function showCombo() {
  const on = settings().combo && test.combo >= 10;
  ui.combo.hidden = !on;
  if (!on) return;
  ui.comboN.textContent = test.combo;
  if (test.combo % 25 === 0) {
    ui.combo.classList.remove("pulse");
    void ui.combo.offsetWidth; // restart the animation
    ui.combo.classList.add("pulse");
  }
}

// ---------- Test lifecycle ----------

function newTest() {
  cancelAnimationFrame(frame);
  const s = settings();
  test = new TypingTest({ nextWord: SOURCES[s.source].stream(), durationMs: s.duration * 1000 });
  wordEls = [];
  scrollY = 0;
  caretY = -1;
  ui.words.replaceChildren();
  ui.words.style.transform = "";
  appendWords(0);
  ui.timer.textContent = s.duration;
  ui.liveWpm.textContent = "";
  ui.combo.hidden = true;
  ui.ghost.hidden = true;
  ui.box.classList.remove("running");
  const best = store.best(currentKey());
  ui.pbHint.textContent = best ? `Best ${Math.round(best.wpm)} wpm` : "";
  ui.results.hidden = true;
  ui.test.hidden = false;
  placeCaret();
  focusBox();
}

function focusBox() {
  // The hidden input brings up the on-screen keyboard on phones.
  ui.input.focus({ preventScroll: true });
}

function loop(now) {
  test.tick(now);
  const remaining = Math.ceil((test.durationMs - test.elapsed(now)) / 1000);
  if (ui.timer.textContent !== String(remaining)) ui.timer.textContent = remaining;
  if (settings().liveWpm && now - lastLiveUpdate > 500 && test.elapsed(now) >= 1000) {
    lastLiveUpdate = now;
    ui.liveWpm.textContent = `${Math.round(test.stats(now).wpm)} wpm`;
  }
  if (now - lastGhostUpdate > 250) {
    lastGhostUpdate = now;
    placeGhost(now);
  }
  if (test.status === "done") return showResults();
  frame = requestAnimationFrame(loop);
}

function onType(char) {
  const wasReady = test.status === "ready";
  const before = test.index;
  const known = test.targets.length;
  const result = test.type(char, performance.now());
  if (!result) return;
  if (wasReady && test.status === "running") {
    ui.box.classList.add("running");
    lastLiveUpdate = lastGhostUpdate = 0;
    frame = requestAnimationFrame(loop);
  }
  if (test.targets.length > known) appendWords(known);
  paintWord(wordEls[before], before);
  if (test.index !== before) paintWord(wordEls[test.index], test.index);
  placeCaret();
  if (settings().sounds) keySound(result !== "incorrect");
  showCombo();
}

function onBackspace(wholeWord) {
  const before = test.index;
  if (!test.backspace(wholeWord)) return;
  paintWord(wordEls[before], before);
  if (test.index !== before) paintWord(wordEls[test.index], test.index);
  placeCaret();
}

function showResults() {
  const s = test.stats(performance.now());
  const set = settings();
  const run = {
    ts: Date.now(),
    source: set.source,
    duration: set.duration,
    wpm: s.wpm,
    raw: s.raw,
    accuracy: s.accuracy,
    maxCombo: s.maxCombo,
    chars: s.chars,
  };
  const previous = store.addRun(run);

  $("r-wpm").textContent = Math.round(s.wpm);
  $("r-acc").textContent = `${Math.round(s.accuracy)}%`;
  $("r-raw").textContent = Math.round(s.raw);
  $("r-combo").textContent = s.maxCombo;
  const c = s.chars;
  $("r-chars").textContent = `${c.correct}/${c.incorrect}/${c.extra}/${c.missed}`;

  const badge = $("r-badge");
  badge.hidden = false;
  badge.classList.remove("quiet");
  const isRecord = s.wpm > 0 && (!previous || s.wpm > previous.wpm);
  if (isRecord && previous) badge.textContent = `New best! +${Math.round(s.wpm - previous.wpm)} wpm`;
  else if (isRecord) badge.textContent = "First result for this mode — now beat it";
  else if (!previous) {
    badge.textContent = "No words scored — give it another go";
    badge.classList.add("quiet");
  } else {
    badge.textContent = `${Math.round(previous.wpm - s.wpm)} wpm off your best (${Math.round(previous.wpm)})`;
    badge.classList.add("quiet");
  }

  ui.test.hidden = true;
  ui.results.hidden = false;
  resultsShownAt = performance.now();
  // Charts need the results view laid out to measure their width.
  requestAnimationFrame(() => {
    lineChart($("r-chart"), test.samples.map((p) => ({
      x: p.second,
      y: p.wpm,
      label: `${p.second}s · ${Math.round(p.wpm)} wpm${p.errors ? ` · ${p.errors} error${p.errors > 1 ? "s" : ""}` : ""}`,
    })), { xLabel: "s" });
    const recent = store.runs(currentKey()).slice(-20);
    $("r-history-title").textContent = `Your last ${recent.length} tests (${set.duration}s, ${SOURCES[set.source].label.toLowerCase()})`;
    const first = store.runs(currentKey()).length - recent.length + 1;
    lineChart($("r-history"), recent.map((r, i) => ({
      x: first + i,
      y: r.wpm,
      label: `Test ${first + i} · ${Math.round(r.wpm)} wpm · ${Math.round(r.accuracy)}%`,
    })), { height: 110, xLabel: "" });
  });
  if (isRecord && previous && set.particles) {
    const css = getComputedStyle(document.documentElement);
    confetti(["--accent", "--good", "--error", "--ink-soft"].map((v) => css.getPropertyValue(v).trim()));
  }
  $("again").focus({ preventScroll: true });
}

// ---------- Input ----------

const anyDialogOpen = () => document.querySelector("dialog[open]") !== null;

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === ",") {
    e.preventDefault();
    openDialog("settings");
    return;
  }
  if (anyDialogOpen()) return;
  if (e.key === "Tab" || e.key === "Escape") {
    e.preventDefault();
    if (ui.results.hidden || performance.now() - resultsShownAt > RESULTS_KEY_GUARD_MS) newTest();
    return;
  }
  if (!ui.results.hidden) {
    // Swallow typing so a stray Space can't press the focused "Next test" button.
    if (e.key === "Enter" || e.key.length === 1) e.preventDefault();
    if (e.key === "Enter" && performance.now() - resultsShownAt > RESULTS_KEY_GUARD_MS) newTest();
    return;
  }
  if (e.metaKey || (e.ctrlKey && e.key !== "Backspace")) return;
  if (e.key === "Backspace") {
    e.preventDefault();
    onBackspace(e.altKey || e.ctrlKey);
  } else if (e.key.length === 1) {
    e.preventDefault(); // also stops a focused button from reacting to Space
    onType(e.key);
  }
});

ui.input.addEventListener("input", () => { ui.input.value = ""; });
ui.box.addEventListener("pointerdown", (e) => { e.preventDefault(); focusBox(); });

for (const b of document.querySelectorAll("[data-duration]")) {
  b.addEventListener("click", () => { store.setSetting("duration", +b.dataset.duration); applySettings(); newTest(); });
}
for (const b of document.querySelectorAll("[data-source]")) {
  b.addEventListener("click", () => { store.setSetting("source", b.dataset.source); applySettings(); newTest(); });
}
$("again").addEventListener("click", newTest);

let resizeTimer = 0;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { if (!ui.test.hidden) placeCaret(); }, 100);
});

// ---------- Dialogs ----------

function openDialog(id) {
  for (const d of document.querySelectorAll("dialog[open]")) d.close();
  $(id).showModal();
}
for (const d of document.querySelectorAll("dialog")) {
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); }); // click the backdrop to close
  d.addEventListener("close", () => { if (!ui.test.hidden) focusBox(); });
}
$("open-settings").addEventListener("click", () => openDialog("settings"));
$("open-math").addEventListener("click", () => openDialog("math"));
$("open-feedback").addEventListener("click", () => openDialog("feedback"));

for (const input of document.querySelectorAll("[data-setting]")) {
  input.addEventListener("change", () => {
    const name = input.dataset.setting;
    store.setSetting(name, input.type === "checkbox" ? input.checked : input.value);
    applySettings();
    if (name === "liveWpm" && !input.checked) ui.liveWpm.textContent = "";
  });
}
$("clear-history").addEventListener("click", () => {
  if (!confirm("Clear every saved result and personal best in this browser?")) return;
  store.clearHistory();
  ui.pbHint.textContent = "";
});

const feedbackStatus = (text) => {
  $("feedback-status").textContent = text;
  setTimeout(() => { $("feedback-status").textContent = ""; }, 2000);
};
$("feedback-save").addEventListener("click", () => {
  const text = $("feedback-text").value.trim();
  if (!text) return feedbackStatus("Write something first.");
  store.addFeedback(text);
  $("feedback-text").value = "";
  feedbackStatus("Saved. Thank you!");
});
$("feedback-copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("feedback-text").value);
    feedbackStatus("Copied.");
  } catch {
    feedbackStatus("Couldn't copy.");
  }
});
$("feedback-email").addEventListener("click", () => {
  const body = encodeURIComponent($("feedback-text").value);
  location.href = `mailto:?subject=${encodeURIComponent("Fun Typing Test feedback")}&body=${body}`;
});

// System theme changes don't need handling: CSS media queries follow them.
applySettings();
newTest();
