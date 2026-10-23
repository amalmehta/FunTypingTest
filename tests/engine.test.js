import { test } from "node:test";
import assert from "node:assert/strict";
import { TypingTest, MAX_EXTRA_LETTERS } from "../js/engine.js";
import { commonWordStream, sillySentenceStream, COMMON_WORDS } from "../js/words.js";

const fixed = (...words) => {
  let i = 0;
  return () => words[i++ % words.length];
};

const typeAll = (t, text, start = 0, step = 100) => {
  let now = start;
  for (const ch of text) { t.type(ch, now); now += step; }
  return now;
};

test("the clock starts on the first letter, not before", () => {
  const t = new TypingTest({ nextWord: fixed("the"), durationMs: 15000 });
  assert.equal(t.status, "ready");
  assert.equal(t.type(" ", 5), null);
  assert.equal(t.status, "ready");
  t.type("t", 1000);
  assert.equal(t.status, "running");
  assert.equal(t.startedAt, 1000);
});

test("perfect typing for a minute gives the textbook WPM", () => {
  // "abcd " is 5 chars = 1 word. 60 of them in 60 s = 60 WPM.
  const t = new TypingTest({ nextWord: fixed("abcd"), durationMs: 60000 });
  typeAll(t, "abcd ".repeat(60), 0, 60000 / 300);
  t.tick(60000);
  const s = t.stats(60000);
  assert.equal(t.status, "done");
  assert.equal(Math.round(s.wpm), 60);
  assert.equal(s.accuracy, 100);
  assert.equal(t.samples.length, 60);
});

test("the test ends exactly at the duration and ignores later keys", () => {
  const t = new TypingTest({ nextWord: fixed("go"), durationMs: 15000 });
  t.type("g", 0);
  t.tick(15001);
  assert.equal(t.status, "done");
  assert.equal(t.type("o", 15002), null);
  assert.equal(t.stats(99999).elapsed, 15000);
});

test("mistakes reset the combo and lower accuracy", () => {
  const t = new TypingTest({ nextWord: fixed("cat"), durationMs: 15000 });
  typeAll(t, "ca");
  assert.equal(t.combo, 2);
  t.type("x", 500);
  assert.equal(t.combo, 0);
  assert.equal(t.maxCombo, 2);
  assert.equal(Math.round(t.stats(500).accuracy), 67);
});

test("backspace can return to a wrong previous word but not a right one", () => {
  const t = new TypingTest({ nextWord: fixed("cat", "dog"), durationMs: 15000 });
  typeAll(t, "cat ");
  assert.equal(t.backspace(), false);
  typeAll(t, "dig ", 1000);
  assert.equal(t.backspace(), true);
  assert.equal(t.index, 1);
  assert.equal(t.typed[1], "dig");
  t.backspace(true);
  assert.equal(t.typed[1], "");
});

test("extra letters are capped", () => {
  const t = new TypingTest({ nextWord: fixed("a"), durationMs: 15000 });
  typeAll(t, "a" + "z".repeat(MAX_EXTRA_LETTERS + 5));
  assert.equal(t.typed[0].length, 1 + MAX_EXTRA_LETTERS);
});

test("words keep coming so a fast typist never runs out", () => {
  const t = new TypingTest({ nextWord: fixed("a"), durationMs: 60000 });
  typeAll(t, "a ".repeat(200), 0, 10);
  assert.ok(t.targets.length > t.index + 50);
});

test("word streams produce real words with no immediate repeats", () => {
  const next = commonWordStream();
  let prev = "";
  for (let i = 0; i < 500; i++) {
    const w = next();
    assert.ok(COMMON_WORDS.includes(w));
    assert.notEqual(w, prev);
    prev = w;
  }
  const silly = sillySentenceStream();
  for (let i = 0; i < 1000; i++) assert.ok(silly().length > 0);
});
