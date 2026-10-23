// Pure scoring functions. Formulas are documented in docs/SYSTEM-DESIGN.md.
// A "word" is 5 characters including spaces (https://en.wikipedia.org/wiki/Words_per_minute).

export const CHARS_PER_WORD = 5;

// Character counts for the words typed so far.
// targets: the words to type; typed: what was typed for each word up to `index`;
// index: the word currently being typed (earlier words are committed with a space).
// typed = characters now in the input, incl. spaces; errors = uncorrected errors left in it
// (wrong letters, extra letters, and letters skipped in committed words).
export function countChars(targets, typed, index) {
  const c = { typed: 0, correct: 0, incorrect: 0, extra: 0, missed: 0, errors: 0 };
  for (let i = 0; i <= index && i < targets.length; i++) {
    const target = targets[i];
    const input = typed[i] ?? "";
    const committed = i < index;
    for (let j = 0; j < target.length; j++) {
      if (j < input.length) input[j] === target[j] ? c.correct++ : c.incorrect++;
      else if (committed) c.missed++;
    }
    c.extra += Math.max(0, input.length - target.length);
    c.typed += input.length + (committed ? 1 : 0);
  }
  c.errors = c.incorrect + c.extra + c.missed;
  return c;
}

const minutes = (elapsedMs) => elapsedMs / 60000;

// Gross WPM = (all typed characters / 5) / minutes.
export function grossWpm(typedChars, elapsedMs) {
  if (elapsedMs <= 0) return 0;
  return typedChars / CHARS_PER_WORD / minutes(elapsedMs);
}

// Net WPM = gross WPM - uncorrected errors per minute, never below 0.
export function netWpm(typedChars, uncorrectedErrors, elapsedMs) {
  if (elapsedMs <= 0) return 0;
  return Math.max(0, grossWpm(typedChars, elapsedMs) - uncorrectedErrors / minutes(elapsedMs));
}

// Accuracy = correct keystrokes / all keystrokes, as a percentage. Backspaced mistakes still count.
// With no keystrokes nothing was typed correctly, so it is 0.
export function accuracy(correctKeys, totalKeys) {
  return totalKeys === 0 ? 0 : (correctKeys / totalKeys) * 100;
}

// Where a pacer at `paceWpm` would be after `elapsedMs`: { word, letter } within targets.
export function pacerPosition(targets, paceWpm, elapsedMs) {
  let chars = Math.floor((paceWpm * CHARS_PER_WORD * elapsedMs) / 60000);
  for (let word = 0; word < targets.length; word++) {
    const span = targets[word].length + 1;
    if (chars < span) return { word, letter: chars };
    chars -= span;
  }
  return { word: targets.length - 1, letter: targets[targets.length - 1]?.length ?? 0 };
}
