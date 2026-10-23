import { test } from "node:test";
import assert from "node:assert/strict";
// Node has no localStorage, so this also checks the store keeps working from memory without it.
import { store, modeKey } from "../js/storage.js";

const run = (wpm, source = "words", duration = 30) => ({ ts: Date.now(), source, duration, wpm, gross: wpm + 5, accuracy: 95 });

test("personal bests are per mode, and only a run that beats one is flagged", () => {
  store.clearHistory();
  assert.equal(store.addRun(run(50)), null);
  assert.equal(store.addRun(run(40)).wpm, 50);
  assert.equal(store.addRun(run(60)).wpm, 50);
  assert.equal(store.addRun(run(30, "silly")), null);
  assert.equal(store.best(modeKey("words", 30)).wpm, 60);
  assert.equal(store.best(modeKey("silly", 30)).wpm, 30);
  assert.deepEqual(store.recent(20).map((r) => !!r.pb), [false, false, true, false]);
});

test("recent returns the last n runs across modes, oldest first", () => {
  store.clearHistory();
  for (let i = 1; i <= 25; i++) store.addRun(run(i, i % 2 ? "words" : "silly", 15));
  const recent = store.recent(20);
  assert.equal(recent.length, 20);
  assert.equal(recent[0].wpm, 6);
  assert.equal(recent.at(-1).wpm, 25);
});

test("clearing removes runs and bests", () => {
  store.addRun(run(70));
  store.clearHistory();
  assert.equal(store.count(), 0);
  assert.equal(store.best(modeKey("words", 30)), null);
});
