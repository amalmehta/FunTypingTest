// The typing test state machine. No DOM: the UI feeds it keys and times, then reads its state.
import { countChars, wpm, accuracy } from "./stats.js";

export const MAX_EXTRA_LETTERS = 10;
const WORD_BUFFER = 60; // keep at least this many words ahead of the cursor

export class TypingTest {
  constructor({ nextWord, durationMs }) {
    this.nextWord = nextWord;
    this.durationMs = durationMs;
    this.targets = [];
    this.typed = [""];
    this.index = 0;
    this.status = "ready"; // ready -> running -> done
    this.startedAt = 0;
    this.endedAt = 0;
    this.correctKeys = 0;
    this.incorrectKeys = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.samples = []; // one per whole second: { second, wpm, raw, errors }
    this.errorsThisSecond = 0;
    this.fill();
  }

  fill() {
    const added = [];
    while (this.targets.length < this.index + WORD_BUFFER) {
      const w = this.nextWord();
      this.targets.push(w);
      added.push(w);
    }
    return added;
  }

  // Returns what happened so the UI can react: "correct", "incorrect", "word", or null if ignored.
  type(char, now) {
    if (this.status === "done") return null;
    const target = this.targets[this.index];
    const input = this.typed[this.index];
    if (char === " ") {
      if (input === "") return null; // a leading space never skips a word
      this.key(input === target, now);
      this.index++;
      this.typed[this.index] = "";
      this.fill();
      return "word";
    }
    if (input.length >= target.length + MAX_EXTRA_LETTERS) return null;
    if (this.status === "ready") this.start(now);
    const ok = input.length < target.length && target[input.length] === char;
    this.typed[this.index] = input + char;
    this.key(ok, now);
    return ok ? "correct" : "incorrect";
  }

  backspace(wholeWord = false) {
    if (this.status !== "running") return false;
    if (this.typed[this.index] === "") {
      // Step back into the previous word only if it has a mistake to fix.
      const prev = this.index - 1;
      if (prev < 0 || this.typed[prev] === this.targets[prev]) return false;
      this.typed.pop();
      this.index = prev;
      if (!wholeWord) return true;
    }
    this.typed[this.index] = wholeWord ? "" : this.typed[this.index].slice(0, -1);
    return true;
  }

  key(ok, now) {
    if (ok) {
      this.correctKeys++;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
    } else {
      this.incorrectKeys++;
      this.errorsThisSecond++;
      this.combo = 0;
    }
    this.tick(now);
  }

  start(now) {
    this.status = "running";
    this.startedAt = now;
  }

  // Call every frame: records per-second samples and ends the test when time is up.
  tick(now) {
    if (this.status !== "running") return;
    const elapsed = Math.min(now - this.startedAt, this.durationMs);
    while ((this.samples.length + 1) * 1000 <= elapsed) {
      const second = this.samples.length + 1;
      const c = countChars(this.targets, this.typed, this.index);
      this.samples.push({
        second,
        wpm: wpm(c.scored, second * 1000),
        raw: wpm(c.typed, second * 1000),
        errors: this.errorsThisSecond,
      });
      this.errorsThisSecond = 0;
    }
    if (now - this.startedAt >= this.durationMs) {
      this.status = "done";
      this.endedAt = this.startedAt + this.durationMs;
    }
  }

  elapsed(now) {
    if (this.status === "ready") return 0;
    if (this.status === "done") return this.durationMs;
    return Math.min(now - this.startedAt, this.durationMs);
  }

  stats(now) {
    const elapsed = this.elapsed(now);
    const c = countChars(this.targets, this.typed, this.index);
    return {
      elapsed,
      wpm: wpm(c.scored, elapsed),
      raw: wpm(c.typed, elapsed),
      accuracy: accuracy(this.correctKeys, this.incorrectKeys),
      chars: c,
      maxCombo: this.maxCombo,
      combo: this.combo,
    };
  }
}
