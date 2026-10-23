import { test } from "node:test";
import assert from "node:assert/strict";
import { countChars, grossWpm, netWpm, accuracy, pacerPosition } from "../js/stats.js";

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≉ ${expected}`);

test("a word is five characters per minute", () => {
  assert.equal(grossWpm(50, 60000), 10);
  assert.equal(grossWpm(25, 30000), 10);
});

test("perfect run: net equals gross and accuracy is 100%", () => {
  // Twelve "abcd " = 60 characters in one minute = 12 words.
  const words = Array(12).fill("abcd");
  const c = countChars(words, [...words, ""], 12);
  assert.equal(c.typed, 60);
  assert.equal(c.errors, 0);
  assert.equal(grossWpm(c.typed, 60000), 12);
  assert.equal(netWpm(c.typed, c.errors, 60000), 12);
  assert.equal(accuracy(60, 60), 100);
});

test("corrected errors: no speed penalty, but accuracy still counts them", () => {
  // Typed a, b, c, x (wrong), Backspace, d, space: the final text is clean.
  const c = countChars(["abcd"], ["abcd", ""], 1);
  assert.equal(c.errors, 0);
  assert.equal(netWpm(c.typed, c.errors, 6000), grossWpm(c.typed, 6000));
  near(accuracy(5, 6), (5 / 6) * 100);
});

test("uncorrected errors: each one costs a word per minute", () => {
  // "hellp world " = 12 characters with 1 wrong letter left in, in 6 s (0.1 min).
  const c = countChars(["hello", "world"], ["hellp", "world", ""], 2);
  assert.equal(c.typed, 12);
  assert.equal(c.errors, 1);
  near(grossWpm(c.typed, 6000), 24);
  near(netWpm(c.typed, c.errors, 6000), 14);
  near(accuracy(11, 12), (11 / 12) * 100);
});

test("uncorrected errors include extra and skipped letters, and net never goes below 0", () => {
  const c = countChars(["about", "the"], ["ab", "thee", ""], 2);
  assert.equal(c.missed, 3);
  assert.equal(c.extra, 1);
  assert.equal(c.errors, 4);
  assert.equal(netWpm(1, 10, 60000), 0);
});

test("zero-length run: everything is 0, not NaN", () => {
  const c = countChars(["the"], [""], 0);
  assert.equal(c.typed, 0);
  assert.equal(c.errors, 0);
  assert.equal(grossWpm(c.typed, 0), 0);
  assert.equal(netWpm(c.typed, c.errors, 0), 0);
  assert.equal(grossWpm(0, 15000), 0);
  assert.equal(accuracy(0, 0), 0);
});

test("very short run: no division by zero, and a second of typing is scored normally", () => {
  // One key at the very first instant: no time has passed yet.
  assert.equal(grossWpm(1, 0), 0);
  assert.equal(netWpm(1, 1, 0), 0);
  // "the c" in 1 s = 5 chars = 1 word in 1/60 min = 60 WPM; one wrong letter costs 60 per minute.
  const c = countChars(["the", "cat"], ["the", "x"], 1);
  assert.equal(c.typed, 5);
  assert.equal(c.errors, 1);
  near(grossWpm(c.typed, 1000), 60);
  assert.equal(netWpm(c.typed, c.errors, 1000), 0);
  near(netWpm(5, 0, 1000), 60);
});

test("the word in progress counts what is typed but not letters still to come", () => {
  const c = countChars(["people"], ["pex"], 0);
  assert.equal(c.typed, 3);
  assert.equal(c.missed, 0);
  assert.equal(c.errors, 1);
});

test("pacer walks through words at the given pace", () => {
  // 60 wpm = 5 chars per second. After 1 s the pacer is 5 chars in: "the " is 4, so word 1 letter 1.
  assert.deepEqual(pacerPosition(["the", "cat"], 60, 1000), { word: 1, letter: 1 });
  assert.deepEqual(pacerPosition(["the", "cat"], 60, 0), { word: 0, letter: 0 });
  assert.deepEqual(pacerPosition(["a"], 600, 60000), { word: 0, letter: 1 });
});
