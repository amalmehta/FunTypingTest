// Types a 15s test in headless Chrome with real (trusted) key events and reports smoothness:
// frame times, key-to-next-frame latency, caret lag behind its target, long tasks, layout shift.
// Usage: serve the site (python3 -m http.server 5173), then: node scripts/profile.mjs [wpm]
// Env: PORT (default 5173), CHROME (path to Chrome).
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const WPM = Number(process.argv[2] || 120);
const URL = `http://localhost:${process.env.PORT || 5173}/`;
const chrome = spawn(process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--remote-debugging-port=9333", "--window-size=1280,800",
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "ftt-"))}`, "--no-first-run", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 100; i++) {
  try { targets = await (await fetch("http://127.0.0.1:9333/json")).json(); break; } catch { await sleep(200); }
}
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.result.value;

await send("Page.enable");
await send("Page.navigate", { url: URL });
await sleep(1500);

// Per-frame recorder: frame intervals, caret visual lag (px from its target), long tasks, layout shifts.
await evaluate(`(() => {
  window.__m = { frames: [], lag: [], long: [], cls: 0 };
  new PerformanceObserver((l) => l.getEntries().forEach((e) => __m.long.push(e.duration))).observe({ type: "longtask", buffered: true });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) __m.cls += e.value; })).observe({ type: "layout-shift", buffered: true });
  let last = performance.now();
  const caret = document.getElementById("caret");
  const f = (now) => {
    const running = document.getElementById("typing-box").classList.contains("running");
    const testVisible = !document.getElementById("test").hidden;
    if (now - last > 50) (__m.slow ??= []).push({ at: +(now - (__m.t0 ??= now)).toFixed(0), dur: +(now - last).toFixed(0), running, testVisible });
    __m.frames.push(now - last); last = now;
    if (!testVisible) { requestAnimationFrame(f); return; }
    const m = /translate\\(([-\\d.]+)px, ([-\\d.]+)px\\)/.exec(caret.style.transform);
    if (m) { const box = document.getElementById("typing-box").getBoundingClientRect(); const r = caret.getBoundingClientRect();
      __m.lag.push(Math.hypot(r.left - box.left - +m[1], r.top - box.top - +m[2] - parseFloat(getComputedStyle(caret).marginTop))); }
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
  document.querySelector('[data-duration="15"]').click();
  return true;
})()`);
const text = await evaluate(`[...document.querySelectorAll('#words .word')].map(w => w.textContent).join(' ')`);

// Trusted keystrokes at the target speed, with input-to-next-frame latency measured in the page.
await evaluate(`(() => { window.__lat = []; document.addEventListener('keydown', () => { if (!document.getElementById('typing-box').classList.contains('running')) return; const t = performance.now(); requestAnimationFrame(() => __lat.push(performance.now() - t)); }, true); })()`);
const interval = 60000 / (WPM * 5);
const start = Date.now();
let i = 0;
while (Date.now() - start < 15500 && i < text.length) {
  const ch = text[i++];
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: ch, text: ch, code: ch === " " ? "Space" : `Key${ch.toUpperCase()}` });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: ch, code: ch === " " ? "Space" : `Key${ch.toUpperCase()}` });
  const next = start + i * interval;
  if (next > Date.now()) await sleep(next - Date.now());
}
await sleep(800);

const r = await evaluate(`(() => {
  const s = (a) => a.slice().sort((x, y) => x - y);
  const pct = (a, p) => { const b = s(a); return +(b[Math.min(b.length - 1, Math.floor(b.length * p))] || 0).toFixed(1); };
  return {
    resultsShown: !document.getElementById('results').hidden,
    wpm: document.getElementById('r-wpm').textContent, acc: document.getElementById('r-acc').textContent,
    frames: __m.frames.length, frameP50: pct(__m.frames, .5), frameP99: pct(__m.frames, .99), frameMax: +Math.max(...__m.frames).toFixed(1),
    keyToFrameP50: pct(__lat, .5), keyToFrameP99: pct(__lat, .99), keyToFrameMax: +Math.max(...__lat).toFixed(1),
    caretLagP50px: pct(__m.lag, .5), caretLagP95px: pct(__m.lag, .95), caretLagMaxPx: +Math.max(...__m.lag).toFixed(1),
    longTasks: __m.long.map((d) => +d.toFixed(0)), cls: +__m.cls.toFixed(4), slow: __m.slow,
  };
})()`);
console.log(JSON.stringify({ targetWpm: WPM, ...r }, null, 2));
ws.close();
chrome.kill();
process.exit(0);
