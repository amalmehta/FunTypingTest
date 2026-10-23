// UI: wires the keyboard, the DOM and storage to the TypingTest engine.
import { TypingTest } from "./engine.js";
import { pacerPosition } from "./stats.js";
import { SOURCES } from "./words.js";
import { store, modeKey } from "./storage.js";
import { lineChart, sparkline } from "./chart.js";
import { keySound, confetti } from "./effects.js";

const $ = (id) => document.getElementById(id);
const ui = {
  test: $("test"), results: $("results"), box: $("typing-box"), words: $("words"),
  caret: $("caret"), ghost: $("ghost"), input: $("hidden-input"), timer: $("timer"),
  liveWpm: $("live-wpm"), combo: $("combo"), comboN: $("combo-n"), pbHint: $("pb-hint"), hint: $("hint"),
};
const TEST_HINT = ui.hint.innerHTML;
const REVIEW_HINT = "Your finished run · <kbd>Esc</kbd> back to results · <kbd>Tab</kbd>+<kbd>Enter</kbd> restart";

let test = null;
let wordEls = [];
let scrollY = 0;
let lastLiveUpdate = 0;
let lastGhostUpdate = 0;
let frame = 0;
let caretY = -1;
let resultsShownAt = 0;
const RESULTS_KEY_GUARD_MS = 500; // keys still in flight when time runs out must not skip the results
let tabAt = -Infinity;
const TAB_ENTER_MS = 1000; // Enter this soon after Tab (or while holding it) restarts, skipping the guard

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
  ui.test.classList.remove("reviewing");
  ui.hint.innerHTML = TEST_HINT;
  tabAt = -Infinity;
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
    gross: s.gross,
    accuracy: s.accuracy,
    maxCombo: s.maxCombo,
    chars: s.chars,
  };
  const previous = store.addRun(run);

  $("r-wpm").textContent = Math.round(s.wpm);
  $("r-gross").textContent = Math.round(s.gross);
  $("r-acc").textContent = `${Math.round(s.accuracy)}%`;
  $("r-duration").textContent = `${Math.round(s.elapsed / 1000)}s`;
  $("r-combo").textContent = s.maxCombo;
  const c = s.chars;
  $("r-correct").textContent = c.correct;
  $("r-incorrect").textContent = c.incorrect;
  $("r-extra").textContent = c.extra;
  $("r-missed").textContent = c.missed;

  const badge = $("r-badge");
  badge.hidden = false;
  badge.classList.remove("quiet", "pb");
  const isRecord = s.wpm > 0 && (!previous || s.wpm > previous.wpm);
  if (isRecord && previous) celebrate(badge, s.wpm - previous.wpm);
  else if (isRecord) badge.textContent = "First result for this mode — now beat it";
  else if (!previous) {
    badge.textContent = "Too many mistakes left in to score — give it another go";
    badge.classList.add("quiet");
  } else {
    badge.textContent = `${Math.round(previous.wpm - s.wpm)} wpm off your best (${Math.round(previous.wpm)})`;
    badge.classList.add("quiet");
  }

  ui.box.classList.remove("running");
  showResultsView();
  resultsShownAt = performance.now();
  // Charts need the results view laid out to measure their width.
  requestAnimationFrame(() => {
    lineChart($("r-chart"), test.samples.map((p) => ({
      x: p.second,
      y: p.wpm,
      marks: p.errors,
      label: `${p.second}s · ${Math.round(p.wpm)} net · ${Math.round(p.gross)} raw${p.errors ? ` · ${p.errors} mistake${p.errors > 1 ? "s" : ""}` : ""}`,
    })), { xLabel: "s" });
    modeHistoryChart();
  });
  if (isRecord && previous && set.particles) {
    const css = getComputedStyle(document.documentElement);
    confetti(["--accent", "--good", "--error", "--ink-soft"].map((v) => css.getPropertyValue(v).trim()));
  }
}

// The pulse and sparks are CSS; reduced motion leaves just the badge.
function celebrate(badge, gain) {
  const sparks = Array.from({ length: 10 }, (_, i) => {
    const spark = document.createElement("i");
    spark.className = "spark";
    spark.style.setProperty("--a", `${i * 36 + Math.random() * 20}deg`);
    spark.style.setProperty("--d", `${28 + Math.random() * 18}px`);
    return spark;
  });
  badge.replaceChildren(
    Object.assign(document.createElement("strong"), { textContent: "New PB!" }),
    ` +${Math.round(gain)} wpm`,
    ...sparks,
  );
  void badge.offsetWidth; // restart the animation when two records come in a row
  badge.classList.add("pb");
}

function modeHistoryChart() {
  const set = settings();
  const all = store.runs(currentKey());
  const recent = all.slice(-20);
  $("r-history-title").textContent = `Your last ${recent.length} tests (${set.duration}s, ${SOURCES[set.source].label.toLowerCase()})`;
  const first = all.length - recent.length + 1;
  lineChart($("r-history"), recent.map((r, i) => ({
    x: first + i,
    y: r.wpm,
    label: `Test ${first + i} · ${Math.round(r.wpm)} wpm · ${Math.round(r.accuracy)}%`,
  })), { height: 110, xLabel: "" });
}

function showResultsView() {
  ui.test.hidden = true;
  ui.test.classList.remove("reviewing");
  ui.results.hidden = false;
  $("again").focus({ preventScroll: true });
}

// Back to the finished text, keeping the results one Esc away.
function showReview() {
  ui.results.hidden = true;
  ui.test.hidden = false;
  ui.test.classList.add("reviewing");
  ui.hint.innerHTML = REVIEW_HINT;
  placeCaret(); // re-measures the scroll now the text is laid out again
}

// ---------- Input ----------

const anyDialogOpen = () => document.querySelector("dialog[open]") !== null;
const finished = () => test.status === "done";

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === ",") {
    e.preventDefault();
    openDialog("settings");
    return;
  }
  if (anyDialogOpen()) return;
  const now = performance.now();
  if (e.key === "Enter" && now - tabAt < TAB_ENTER_MS) {
    e.preventDefault();
    newTest();
    return;
  }
  if (e.key === "Tab") {
    e.preventDefault();
    // Mid-test Tab alone restarts; once finished it waits for Enter, so the results can't be lost by accident.
    if (finished()) tabAt = now;
    else newTest();
    return;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    if (!finished()) newTest();
    else if (ui.results.hidden) showResultsView();
    else showReview();
    return;
  }
  if (!ui.results.hidden) {
    // Swallow typing so a stray Space can't press the focused "Next test" button.
    if (e.key === "Enter" || e.key.length === 1) e.preventDefault();
    if (e.key === "Enter" && now - resultsShownAt > RESULTS_KEY_GUARD_MS) newTest();
    return;
  }
  if (finished()) return; // reviewing a finished run: nothing to type
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
// ---------- History ----------

const HISTORY_SIZE = 20;
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

function when(ts) {
  const d = new Date(ts);
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / 86400000);
  const day = days === 0 ? "Today" : days === 1 ? "Yesterday" : dateFmt.format(d);
  return `${day}, ${timeFmt.format(d)}`;
}

function cell(text, className) {
  const td = document.createElement("td");
  td.textContent = text;
  if (className) td.className = className;
  return td;
}

function renderHistory() {
  const runs = store.recent(HISTORY_SIZE);
  $("h-empty").hidden = runs.length > 0;
  $("h-body").hidden = runs.length === 0;
  showClearConfirm(false);
  if (!runs.length) return;
  const avg = runs.reduce((sum, r) => sum + r.wpm, 0) / runs.length;
  $("h-summary").textContent = `Last ${runs.length} test${runs.length > 1 ? "s" : ""} · average ${Math.round(avg)} net wpm`;
  sparkline($("h-spark"), runs.map((r) => ({ y: r.wpm, hot: r.pb })), { label: "Net WPM trend over your recent tests" });
  // Newest first in the table; the sparkline reads left to right, oldest to newest.
  $("h-rows").replaceChildren(...runs.toReversed().map((r) => {
    const tr = document.createElement("tr");
    const net = cell(Math.round(r.wpm), "num");
    if (r.pb) {
      tr.classList.add("is-pb");
      net.title = "New personal best";
    }
    tr.append(
      cell(when(r.ts)),
      cell(`${r.duration}s · ${r.source === "silly" ? "Silly" : "Words"}`),
      net,
      cell(r.gross == null ? "–" : Math.round(r.gross), "num"),
      cell(`${Math.round(r.accuracy)}%`, "num"),
    );
    return tr;
  }));
}

function openHistory() {
  openDialog("history");
  renderHistory(); // after opening, so the sparkline can measure its width
}

function showClearConfirm(on) {
  $("h-actions").hidden = on;
  $("h-confirm").hidden = !on;
  if (!on) return;
  const n = store.count();
  $("h-confirm-text").textContent = `Delete all ${n} saved run${n === 1 ? "" : "s"} and your personal bests?`;
  $("h-cancel").focus();
}

$("open-history").addEventListener("click", openHistory);
$("results-history").addEventListener("click", openHistory);
$("settings-history").addEventListener("click", openHistory);
$("h-clear").addEventListener("click", () => showClearConfirm(true));
$("h-cancel").addEventListener("click", () => { showClearConfirm(false); $("h-clear").focus(); });
$("h-clear-yes").addEventListener("click", () => {
  store.clearHistory();
  ui.pbHint.textContent = "";
  if (!ui.results.hidden) modeHistoryChart();
  renderHistory();
  $("history").querySelector(".close").focus();
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
