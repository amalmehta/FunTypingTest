# Manual Review Checklist

What the unit tests can't check. Do these in a real browser window (not a background tab).

## Feel and smoothness
- [ ] Type a 30s test at your normal speed: every letter colors instantly, no stutter, no flicker.
- [ ] The caret glides and keeps up with you. If it trails, turn off "Smooth caret" and compare.
- [ ] The text scrolls up one line at a time, without jumping, when you reach the third line.
- [ ] Results appear with a short fade; no layout jump when the charts draw.
- [ ] Hover the charts: the crosshair and tooltip follow the pointer smoothly.
- [ ] Red dots on the per-second chart sit on the seconds where you made mistakes.
- [ ] Switching time/words/quote, 15–120 s, 10–100 words, common/silly and the @/# toggles restarts instantly, even mid-test or from the results.
- [ ] Words and quote tests end the moment the last word is right; the results show the time to one decimal, and quotes show who said it.
- [ ] Reload: the last chosen mode and toggles come back.
- [ ] Chrome DevTools > Performance: record a test; no long tasks (>50 ms) while typing.

## Fun
- [ ] Beating your best shows "New PB! +N wpm" with a soft pulse and a few sparks; missing it shows the gap kindly.
- [ ] With Reduce Motion on, a new PB shows the badge only: no pulse, no sparks.
- [ ] History (clock button): last 20 runs newest first, sparkline matches, ★ on PB runs; Clear history asks first and Cancel keeps everything.
- [ ] With Ghost pacer on and a best saved, the grey dot moves at your best pace.
- [ ] Combo counter appears at 10 and pulses at 25, 50, 75…
- [ ] Settings > Key sounds: ticks are quiet and pleasant; mistakes sound different.
- [ ] Settings > Confetti: shows on a new best only; nothing if your OS has Reduce Motion on.
- [ ] Silly sentences are fun to type; punctuation and numbers read naturally; quotes are attributed correctly.

## Looks (check in both light and dark)
- [ ] Main screen, results, Settings, Feedback, "How is WPM calculated?" all readable in light and dark.
- [ ] Error letters (red) clearly differ from untyped (grey) and correct (ink) letters.
- [ ] Equations in the formula dialog are typeset (fractions, subscripts), readable in dark mode and on a phone.
- [ ] Icon shows in the browser tab and when added to a phone home screen.

## Keyboard and devices
- [ ] Tab and Esc restart mid-test. From results, Tab+Enter restarts at once, Enter alone after a beat, Tab alone does nothing.
- [ ] From results, Esc shows the finished text (no caret); Esc again brings the same results back.
- [ ] ⌘, (or Ctrl+,) opens Settings, or the browser takes it; the gear always works.
- [ ] ⌥⌫ clears the current word.
- [ ] iPhone Safari: tapping the text brings up the keyboard and typing works.
- [ ] Android Chrome: try it; known to be unreliable (deferred).
- [ ] Reload the page: settings, bests and history are kept.
