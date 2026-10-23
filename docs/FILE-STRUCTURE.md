# File Structure

```
FunTypingTest/
├── index.html             The page: top bar, typing area, results, dialogs (history, settings, feedback, formulas)
├── manifest.webmanifest   Name and icons for "Add to Home Screen"
├── package.json           `npm test` and `npm start` scripts (no dependencies)
├── css/
│   └── style.css          All styles; light and dark color tokens at the top
├── js/
│   ├── app.js             UI: input, rendering, caret, frame loop, results, dialogs
│   ├── engine.js          TypingTest state machine (no DOM): timed or fixed-text tests
│   ├── stats.js           Pure formulas: WPM, accuracy, character counts, pacer
│   ├── words.js           Common-word list (top 100 cited, plus 120 everyday words), silly sentences (original), punctuation/numbers toggles
│   ├── quotes.js          Short public-domain quotes with attribution, for quote mode
│   ├── storage.js         localStorage: settings, history, bests, feedback (works from memory if storage is blocked)
│   ├── chart.js           SVG line chart with hover tooltip, and the history sparkline
│   └── effects.js         Optional key sounds and confetti
├── assets/
│   ├── icon.svg           App icon (keycap + lightning bolt), also the favicon
│   ├── icon-180.png       Apple touch icon
│   └── icon-512.png       Large icon for the manifest
├── scripts/
│   └── profile.mjs        Smoothness profiler: types a test in headless Chrome, reports frame and caret stats
├── tests/
│   ├── stats.test.js      Formula tests
│   ├── engine.test.js     Engine (timed and fixed texts), word streams, toggles, quotes
│   └── storage.test.js    Personal bests per mode, mode keys, history order, clearing
├── docs/
│   ├── INSTRUCTIONS.md    Setup, run, use
│   ├── SYSTEM-DESIGN.md   Architecture, formulas, decisions, limits
│   ├── FILE-STRUCTURE.md  This file
│   ├── MANUAL-REVIEW.md   What to check by hand
│   └── screenshots/       Images used in the README
└── FunTypingTest.md       The project spec
```
