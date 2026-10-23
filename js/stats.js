// Pure scoring functions. Formulas are documented in docs/SYSTEM-DESIGN.md.
// A "word" is 5 characters including spaces (https://en.wikipedia.org/wiki/Words_per_minute).

export const CHARS_PER_WORD = 5;

// Character counts for the words typed so far.
// targets: the words to type; typed: what was typed for each word up to `index`;
// index: the word currently being typed (earlier words are committed with a space).
export function countChars(targets, typed, index) {
  const c = { scored: 0, typed: 0, correct: 0, incorrect: 0, extra: 0, missed: 0 };
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
    // Only correctly typed words score; the word in progress scores if it is a correct prefix so far.
    if (committed && input === target) c.scored += target.length + 1;
    else if (!committed && target.startsWith(input)) c.scored += input.length;
  }
  return c;
}

export function wpm(chars, elapsedMs) {
  if (elapsedMs <= 0) return 0;
  return chars / CHARS_PER_WORD / (elapsedMs / 60000);
}

export function accuracy(correctKeys, incorrectKeys) {
  const total = correctKeys + incorrectKeys;
  return total === 0 ? 100 : (correctKeys / total) * 100;
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
