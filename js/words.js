// Text sources for a test. Each source returns an endless stream of words.

// The 100 most common English words in the Oxford English Corpus, in rank order, then more.
// Source: https://en.wikipedia.org/wiki/Most_common_words_in_English (checked 2026-10-22).
export const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
  // 120 more everyday words, chosen for this app (not ranked).
  "very", "through", "long", "where", "much", "should", "here", "between", "both", "life",
  "being", "under", "never", "home", "same", "last", "while", "might", "great", "old",
  "off", "down", "own", "still", "world", "place", "another", "around", "right", "few",
  "keep", "small", "high", "every", "large", "need", "big", "find", "next", "again",
  "hand", "part", "house", "school", "country", "point", "water", "city", "light", "night",
  "room", "word", "line", "name", "story", "group", "head", "family", "number", "friend",
  "eye", "face", "book", "change", "early", "open", "begin", "end", "turn", "follow",
  "start", "show", "move", "play", "run", "help", "hold", "bring", "write", "read",
  "learn", "feel", "leave", "call", "ask", "try", "tell", "live", "stand", "sit",
  "real", "best", "sure", "free", "hard", "late", "young", "short", "clear", "simple",
  "always", "often", "later", "together", "almost", "enough", "already", "soon", "far", "less",
  "music", "garden", "river", "street", "morning", "table", "window", "paper", "money", "idea",
];

// Original nonsense written for this app. Not quotes, not facts.
export const SILLY_SENTENCES = [
  "the goose filed its taxes early and still felt nervous.",
  "a potato in a tiny hat asked me for directions to the moon.",
  "my left sock has started a podcast about my right sock.",
  "the toaster refuses to work on mondays, and honestly, fair.",
  "seven ducks walked into a bank and nobody asked any questions.",
  "the cat knocked the cup off the table to test gravity again.",
  "our fridge hums the same three notes every night at midnight.",
  "a polite cloud waited for the picnic to end before raining.",
  "the snail won the race because the rabbit stopped for snacks.",
  "my plant leans toward the window like it wants to leave.",
  "the pigeon wore sunglasses and acted like it owned the bench.",
  "a very small dragon sneezed and lit every candle in the room.",
  "the spoon and the fork are no longer speaking to each other.",
  "grandma beat the whole family at video games, twice.",
  "the robot vacuum is scared of the dog and hides under the couch.",
  "a bear opened a bakery and only sells honey buns on tuesdays.",
  "the clock ran fast all week because it was excited for friday.",
  "my umbrella turned inside out and decided to stay that way.",
  "the owl gave a long speech, but everyone fell asleep.",
  "a llama spat at the mirror and then said sorry.",
  "the pancakes stacked themselves into a tower and waved.",
  "the moon forgot to come out, so the stars covered for it.",
  "a frog in a raincoat judged the puddles one by one.",
  "the bus driver sang so well that nobody wanted to get off.",
  "my keyboard sighs a little every time I press the space bar.",
  "the goldfish has three secret plans and no way to share them.",
  "a cloud shaped like a sandwich made everyone hungry.",
  "the penguin brought a scarf to the beach, just in case.",
  "the mailbox ate a letter and asked for dessert.",
  "a bee took a nap in a tulip and missed the meeting.",
];

// Endless random common words, never the same word twice in a row.
export function commonWordStream(random = Math.random) {
  let last = "";
  return () => {
    let word;
    do word = COMMON_WORDS[Math.floor(random() * COMMON_WORDS.length)];
    while (word === last);
    last = word;
    return word;
  };
}

// Endless silly sentences in shuffled order, split into words.
export function sillySentenceStream(random = Math.random) {
  let queue = [];
  return () => {
    if (queue.length === 0) {
      const order = shuffle(SILLY_SENTENCES.slice(), random);
      queue = order.join(" ").split(" ");
    }
    return queue.shift();
  };
}

// Wraps a word stream for the optional toggles: punctuation turns it into capitalized sentences
// with commas, quotes and end marks; numbers swaps in a 1 to 4 digit number about one word in eight.
export function decorate(next, { punctuation = false, numbers = false } = {}, random = Math.random) {
  if (!punctuation && !numbers) return next;
  const pick = (list) => list[Math.floor(random() * list.length)];
  let left = 0; // words until the current sentence ends
  return () => {
    let word = numbers && random() < 0.125 ? String(Math.floor(random() * 10 ** (1 + Math.floor(random() * 4)))) : next();
    if (!punctuation) return word;
    if (left === 0) {
      left = 4 + Math.floor(random() * 9);
      word = word[0].toUpperCase() + word.slice(1);
    }
    left--;
    if (left === 0) return word + pick([".", ".", ".", "?", "!"]);
    const r = random();
    if (r < 0.1) return `${word},`;
    if (r < 0.13) return word + pick([";", ":"]);
    if (r < 0.16) return `"${word}"`;
    if (r < 0.18) return `(${word})`;
    if (r < 0.2) return `${word}-${next()}`;
    return word;
  };
}

export const SOURCES = {
  words: { label: "Common words", stream: commonWordStream },
  silly: { label: "Silly sentences", stream: sillySentenceStream },
};

function shuffle(list, random) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
