// Short quotes for the quote mode, all old enough to be in the public domain (or US government
// works). Plain ASCII so every character is on the keyboard: straight apostrophes, no dashes.
// Translations are marked "(tr.)".
export const QUOTES = [
  { text: "The only thing we have to fear is fear itself.", by: "Franklin D. Roosevelt, 1933 inaugural address" },
  { text: "To be, or not to be, that is the question.", by: "William Shakespeare, Hamlet" },
  { text: "All that glisters is not gold.", by: "William Shakespeare, The Merchant of Venice" },
  { text: "Brevity is the soul of wit.", by: "William Shakespeare, Hamlet" },
  { text: "There is nothing either good or bad, but thinking makes it so.", by: "William Shakespeare, Hamlet" },
  { text: "If music be the food of love, play on.", by: "William Shakespeare, Twelfth Night" },
  { text: "The course of true love never did run smooth.", by: "William Shakespeare, A Midsummer Night's Dream" },
  { text: "We are such stuff as dreams are made on, and our little life is rounded with a sleep.", by: "William Shakespeare, The Tempest" },
  { text: "Shall I compare thee to a summer's day? Thou art more lovely and more temperate.", by: "William Shakespeare, Sonnet 18" },
  { text: "I think, therefore I am.", by: "René Descartes, Discourse on the Method (tr.)" },
  { text: "The unexamined life is not worth living.", by: "Socrates, in Plato's Apology (tr.)" },
  { text: "Knowledge is power.", by: "Francis Bacon, Meditationes Sacrae (tr.)" },
  { text: "Ask not what your country can do for you; ask what you can do for your country.", by: "John F. Kennedy, 1961 inaugural address" },
  { text: "Four score and seven years ago our fathers brought forth on this continent a new nation, conceived in Liberty.", by: "Abraham Lincoln, Gettysburg Address" },
  { text: "The journey of a thousand miles begins with a single step.", by: "Laozi, Tao Te Ching (tr.)" },
  { text: "It was the best of times, it was the worst of times.", by: "Charles Dickens, A Tale of Two Cities" },
  { text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", by: "Jane Austen, Pride and Prejudice" },
  { text: "Happy families are all alike; every unhappy family is unhappy in its own way.", by: "Leo Tolstoy, Anna Karenina (tr. Constance Garnett)" },
  { text: "That's one small step for man, one giant leap for mankind.", by: "Neil Armstrong, Apollo 11" },
  { text: "Hope is the thing with feathers that perches in the soul.", by: "Emily Dickinson" },
  { text: "Because I could not stop for Death, he kindly stopped for me.", by: "Emily Dickinson" },
  { text: "I took the one less traveled by, and that has made all the difference.", by: "Robert Frost, The Road Not Taken" },
  { text: "The woods are lovely, dark and deep, but I have promises to keep, and miles to go before I sleep.", by: "Robert Frost, Stopping by Woods on a Snowy Evening" },
  { text: "The best way out is always through.", by: "Robert Frost, A Servant to Servants" },
  { text: "Give me liberty, or give me death!", by: "Patrick Henry, 1775" },
  { text: "We hold these truths to be self-evident, that all men are created equal.", by: "Declaration of Independence, 1776" },
  { text: "Fortune favors the bold.", by: "Virgil, Aeneid (tr.)" },
  { text: "Early to bed and early to rise, makes a man healthy, wealthy, and wise.", by: "Benjamin Franklin, Poor Richard's Almanack" },
  { text: "Well done is better than well said.", by: "Benjamin Franklin, Poor Richard's Almanack" },
  { text: "I wandered lonely as a cloud that floats on high o'er vales and hills.", by: "William Wordsworth" },
  { text: "A thing of beauty is a joy for ever: its loveliness increases; it will never pass into nothingness.", by: "John Keats, Endymion" },
  { text: "Beauty is truth, truth beauty, that is all ye know on earth, and all ye need to know.", by: "John Keats, Ode on a Grecian Urn" },
  { text: "Water, water, every where, nor any drop to drink.", by: "Samuel Taylor Coleridge, The Rime of the Ancient Mariner" },
  { text: "Imagination is more important than knowledge.", by: "Albert Einstein, 1929 interview" },
  { text: "Courage is resistance to fear, mastery of fear, not absence of fear.", by: "Mark Twain, Pudd'nhead Wilson" },
  { text: "The report of my death was an exaggeration.", by: "Mark Twain, 1897" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", by: "Thomas Edison" },
  { text: "Hope springs eternal in the human breast.", by: "Alexander Pope, An Essay on Man" },
  { text: "To err is human; to forgive, divine.", by: "Alexander Pope, An Essay on Criticism" },
  { text: "A little learning is a dangerous thing.", by: "Alexander Pope, An Essay on Criticism" },
  { text: "Ask, and it shall be given you; seek, and ye shall find.", by: "Matthew 7:7, King James Bible" },
  { text: "The only way to have a friend is to be one.", by: "Ralph Waldo Emerson, Friendship" },
  { text: "Hitch your wagon to a star.", by: "Ralph Waldo Emerson, Society and Solitude" },
  { text: "Whatever is worth doing at all is worth doing well.", by: "Lord Chesterfield, Letters to His Son" },
  { text: "Speak softly and carry a big stick; you will go far.", by: "Theodore Roosevelt, 1901" },
  { text: "I came, I saw, I conquered.", by: "Julius Caesar (tr.)" },
  { text: "The pen is mightier than the sword.", by: "Edward Bulwer-Lytton, Richelieu" },
  { text: "'Tis better to have loved and lost than never to have loved at all.", by: "Alfred, Lord Tennyson, In Memoriam" },
  { text: "Nature does nothing in vain.", by: "Aristotle, Politics (tr.)" },
  { text: "Heaven is under our feet as well as over our heads.", by: "Henry David Thoreau, Walden" },
  { text: "Our life is frittered away by detail. Simplify, simplify.", by: "Henry David Thoreau, Walden" },
  { text: "Why, sometimes I've believed as many as six impossible things before breakfast.", by: "Lewis Carroll, Through the Looking-Glass" },
  { text: "Second to the right, and straight on till morning.", by: "J. M. Barrie, Peter and Wendy" },
  { text: "There is no place like home.", by: "L. Frank Baum, The Wonderful Wizard of Oz" },
  { text: "Whatever our souls are made of, his and mine are the same.", by: "Emily Brontë, Wuthering Heights" },
  { text: "It is not down in any map; true places never are.", by: "Herman Melville, Moby-Dick" },
];

// A random quote, never the same one twice in a row.
let lastQuote = -1;
export function randomQuote(random = Math.random) {
  let i;
  do i = Math.floor(random() * QUOTES.length);
  while (i === lastQuote && QUOTES.length > 1);
  lastQuote = i;
  return QUOTES[i];
}
