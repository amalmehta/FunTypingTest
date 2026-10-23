# Instructions

## Play it online

https://amalmehta.github.io/FunTypingTest/ (GitHub Pages, served from the `main` branch).

## Run it locally

No install needed. Any static file server works (ES modules don't load from `file://`):

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Test it

Needs Node 18 or later:

```bash
npm test
```

## Profile smoothness

With the site served on port 5173 and Google Chrome installed:

```bash
npm run profile -- 120
```

It types a 15-second test at 120 WPM and prints frame times, key latency and caret lag.

## Use it

- **Start**: just type. The clock starts on your first letter.
- **Pick a mode**: 15s / 30s / 60s, and *Words* (the 100 most common English words) or *Silly sentences*. Each combination has its own personal best.
- **Restart**: `Tab` or `Esc` mid-test. When a test is done, `Tab`+`Enter` (or the Restart button, or `Enter` alone) starts the next one.
- **Results**: net WPM, accuracy, raw WPM, character counts, duration, and WPM per second with red dots where you made mistakes. `Esc` flips between the results and your finished text.
- **Fix mistakes**: `Backspace`; you can go back into the previous word only if it has a mistake. `⌥⌫` (Ctrl+Backspace) clears the word.
- **History**: the clock button in the top bar. Your last 20 runs (date, mode, net and raw WPM, accuracy) with a WPM sparkline; ★ marks runs that set a new personal best. "Clear history" asks before deleting.
- **Settings**: the gear, or `⌘,` / `Ctrl+,`. Theme, smooth caret, live WPM, combo counter, ghost pacer, key sounds, confetti.
- **How the score works**: "How is WPM calculated?" at the bottom.
- **Feedback**: the small tab on the right edge.

## Deploy

It's live on GitHub Pages: every push to `main` republishes the site within a minute or two. Any other static host (Netlify, an S3 bucket) works too: copy the folder. There is no build step.

## Data and privacy

Results, bests, settings and saved feedback live in your browser's `localStorage` under the key `funTypingTest.v1`. Nothing is sent anywhere. History > Clear history removes results and bests. If the browser blocks storage (some private windows), the app still works but forgets results when the tab closes.
