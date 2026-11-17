# Result motion

Inspired by the [Duolingo lesson recap](https://60fps.design/shots/duolingo-lesson-complete-state-2): staggered spring entrances, icon pops, numeric counters, then XP contributions and a goal flourish. Existing CSS and the local animation controller implement the sequence; no dependency or external artwork was added.

Counters use saved result values. Accessible values stay final throughout. Reduced motion, keyboard focus, navigation and reload show the final values immediately. Tests cover sequencing, contribution totals and cleanup. Browser checks include 320/390/1280px, short screens, keyboard and reduced motion. All 279 tests and both builds pass. Local only.
