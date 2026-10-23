import { test } from "node:test";
import assert from "node:assert/strict";
import { countChars, wpm, accuracy, pacerPosition } from "../js/stats.js";

test("a word is five characters per minute", () => {
  assert.equal(wpm(50, 60000), 10);
  assert.equal(wpm(25, 30000), 10);
  assert.equal(wpm(10, 0), 0);
});

test("correct committed words score their letters plus a space", () => {
  const c = countChars(["the", "cat"], ["the", "cat"], 2);
  assert.equal(c.scored, 8);
  assert.equal(c.correct, 6);
  assert.equal(c.typed, 8);
});

test("a wrong word scores nothing but its right letters still count as correct", () => {
  const c = countChars(["the", "cat"], ["tha", ""], 1);
  assert.equal(c.scored, 0);
  assert.equal(c.correct, 2);
  assert.equal(c.incorrect, 1);
});

test("skipped letters are missed and overflow letters are extra", () => {
  const c = countChars(["about", "the"], ["ab", "thee"], 2);
  assert.equal(c.missed, 3);
  assert.equal(c.extra, 1);
  assert.equal(c.scored, 0);
});

test("the word in progress scores only while it is a correct prefix", () => {
  assert.equal(countChars(["people"], ["peo"], 0).scored, 3);
  assert.equal(countChars(["people"], ["pex"], 0).scored, 0);
  assert.equal(countChars(["people"], ["pex"], 0).missed, 0);
});

test("accuracy is correct keystrokes over all keystrokes", () => {
  assert.equal(accuracy(9, 1), 90);
  assert.equal(accuracy(0, 0), 100);
});

test("pacer walks through words at the given pace", () => {
  // 60 wpm = 5 chars per second. After 1 s the pacer is 5 chars in: "the " is 4, so word 1 letter 1.
  assert.deepEqual(pacerPosition(["the", "cat"], 60, 1000), { word: 1, letter: 1 });
  assert.deepEqual(pacerPosition(["the", "cat"], 60, 0), { word: 0, letter: 0 });
  assert.deepEqual(pacerPosition(["a"], 600, 60000), { word: 0, letter: 1 });
});
