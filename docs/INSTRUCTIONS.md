# Instructions

## Run it

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
- **Restart**: `Tab` or `Esc`. From results, `Enter` starts the next test.
- **Fix mistakes**: `Backspace`; you can go back into the previous word only if it has a mistake. `⌥⌫` (Ctrl+Backspace) clears the word.
- **Settings**: the gear, or `⌘,` / `Ctrl+,`. Theme, smooth caret, live WPM, combo counter, ghost pacer, key sounds, confetti, clear history.
- **How the score works**: "How is WPM calculated?" at the bottom.
- **Feedback**: the small tab on the right edge.

## Deploy

Copy the folder to any static host (GitHub Pages, Netlify, an S3 bucket). There is no build step, and nothing to configure.

## Data and privacy

Results, bests, settings and saved feedback live in your browser's `localStorage` under the key `funTypingTest.v1`. Nothing is sent anywhere. Settings > Clear history removes results and bests.
