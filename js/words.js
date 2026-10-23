// Text sources for a test. Each source returns an endless stream of words.

// The 100 most common English words in the Oxford English Corpus, in rank order.
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
