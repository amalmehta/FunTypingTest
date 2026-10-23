# Fun Typing Test

A calm, genuinely fun solo typing speed test: type, see your WPM, beat your best.

**[Play it →](https://amalmehta.github.io/FunTypingTest/)**

![Typing, with a combo counter and the ghost pacer dot racing your best](docs/screenshots/typing-dark.jpg)

| Results (light) | Results (dark) |
|---|---|
| ![Results screen in light mode](docs/screenshots/results-light.jpg) | ![Results screen in dark mode](docs/screenshots/results-dark.jpg) |

<sub>Screenshots show demo runs typed by a test script, not a real person.</sub>

```mermaid
flowchart LR
  Keys --> App[app.js] --> Engine[engine.js] --> Stats[stats.js]
  App <--> Storage[(localStorage)]
```

- [Play it online](https://amalmehta.github.io/FunTypingTest/)
- [How to run and use it](docs/INSTRUCTIONS.md)
- [System design and how WPM is calculated](docs/SYSTEM-DESIGN.md)
- [What's where](docs/FILE-STRUCTURE.md)
- [Manual review checklist](docs/MANUAL-REVIEW.md)
