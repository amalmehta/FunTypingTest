import { test } from "node:test";
import assert from "node:assert/strict";
import { TypingTest, MAX_EXTRA_LETTERS } from "../js/engine.js";
import { commonWordStream, sillySentenceStream, decorate, COMMON_WORDS } from "../js/words.js";
import { QUOTES, randomQuote } from "../js/quotes.js";

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

test("waiting on the page does not run the clock", () => {
  const t = new TypingTest({ nextWord: fixed("the"), durationMs: 15000 });
  t.tick(60000); // the frame loop may tick long after the page loaded
  assert.equal(t.status, "ready");
  assert.equal(t.elapsed(60000), 0);
  t.type("t", 60000);
  assert.equal(t.elapsed(61000), 1000);
});

test("backspaced mistakes lower accuracy but not net WPM", () => {
  const t = new TypingTest({ nextWord: fixed("abcd"), durationMs: 60000 });
  typeAll(t, "abcx", 0, 1000);
  t.backspace();
  typeAll(t, "d ", 4000, 1000);
  const s = t.stats(6000);
  assert.equal(t.totalKeys, 6);
  assert.equal(Math.round(s.accuracy), 83);
  assert.equal(s.chars.errors, 0);
  assert.equal(s.wpm, s.gross);
  assert.equal(Math.round(s.gross), 10); // 5 chars in 6 s
});

test("mistakes left in the text lower net WPM below gross", () => {
  const t = new TypingTest({ nextWord: fixed("abcd"), durationMs: 60000 });
  typeAll(t, "abcx ", 0, 1000);
  const s = t.stats(6000);
  assert.equal(Math.round(s.gross), 10);
  assert.equal(Math.round(s.wpm), 0); // 10 gross - 1 error / 0.1 min = 0
});

test("perfect typing for a minute gives the textbook WPM", () => {
  // "abcd " is 5 chars = 1 word. 60 of them in 60 s = 60 WPM.
  const t = new TypingTest({ nextWord: fixed("abcd"), durationMs: 60000 });
  typeAll(t, "abcd ".repeat(60), 0, 60000 / 300);
  t.tick(60000);
  const s = t.stats(60000);
  assert.equal(t.status, "done");
  assert.equal(Math.round(s.wpm), 60);
  assert.equal(Math.round(s.gross), 60);
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

test("a fixed text ends when its last word is typed right, and is scored on the time taken", () => {
  const t = new TypingTest({ words: ["abcd", "abcd"] });
  assert.equal(t.targets.length, 2);
  const end = typeAll(t, "abcd abcd", 0, 1000); // last key at 8 s
  assert.equal(t.status, "done");
  assert.equal(t.elapsed(end + 5000), 8000);
  const s = t.stats(end + 5000);
  assert.equal(s.chars.typed, 9);
  assert.equal(Math.round(s.gross * 10), Math.round((9 / 5 / (8 / 60)) * 10));
  assert.equal(s.wpm, s.gross);
  assert.equal(t.samples.length, 8);
  assert.equal(t.type("x", end + 1), null);
});

test("a fixed text with a wrong last word ends on the space, counting what was missed", () => {
  const t = new TypingTest({ words: ["cat", "dog"] });
  typeAll(t, "cat do ", 0, 500);
  assert.equal(t.status, "done");
  const s = t.stats(10000);
  assert.equal(s.chars.missed, 1);
  assert.equal(s.elapsed, 3000);
  assert.equal(t.samples.at(-1).second, 3);
});

test("a fixed text records a sample for the final part-second", () => {
  const t = new TypingTest({ words: ["hi"] });
  t.type("h", 0);
  t.type("i", 2500);
  assert.deepEqual(t.samples.map((p) => p.second), [1, 2, 2.5]);
  assert.equal(t.elapsed(9999), 2500);
});

test("a fixed text has no clock limit and never adds words", () => {
  const t = new TypingTest({ words: ["a", "b"] });
  t.type("a", 0);
  t.tick(10 * 60 * 1000);
  assert.equal(t.status, "running");
  assert.equal(t.targets.length, 2);
});

test("punctuation makes capitalized sentences that end with a mark", () => {
  const next = decorate(commonWordStream(), { punctuation: true });
  const words = Array.from({ length: 400 }, next);
  assert.match(words[0], /^[A-Z0-9"(]/);
  const text = words.join(" ");
  assert.match(text, /[.?!]/);
  assert.match(text, /,/);
  for (const m of text.matchAll(/[.?!] (\S)/g)) assert.match(m[1], /[A-Z0-9"(]/);
});

test("numbers mixes in short numbers, and no toggles leaves words alone", () => {
  const words = Array.from({ length: 400 }, decorate(commonWordStream(), { numbers: true }));
  const nums = words.filter((w) => /^\d+$/.test(w));
  assert.ok(nums.length > 10 && nums.length < 120);
  assert.ok(nums.every((n) => n.length <= 4));
  const plain = decorate(commonWordStream(), {});
  for (let i = 0; i < 100; i++) assert.ok(COMMON_WORDS.includes(plain()));
});

test("the word list and quotes are big enough and typeable", () => {
  assert.ok(new Set(COMMON_WORDS).size >= 200);
  assert.equal(new Set(COMMON_WORDS).size, COMMON_WORDS.length);
  assert.ok(QUOTES.length >= 40);
  for (const q of QUOTES) {
    assert.match(q.text, /^[\x20-\x7e]+$/, q.text); // plain keyboard characters only
    assert.doesNotMatch(q.text, /  |^ | $/);
    assert.ok(q.by.length > 0);
  }
  assert.notEqual(randomQuote(), randomQuote());
});
