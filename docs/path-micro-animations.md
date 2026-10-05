# Chapter path micro animations

New lesson completions animate once on returning: button pop, two gold sparkles and earned ring fill. Completed groups also shimmer. The active Start callout nudges every 4.2 seconds and pauses during interaction. Pressing compresses the icon. Animation state stays in memory.

Validation, 2026-10-05:
- Transition tests cover partial/full completion, replay, reload, later chapters and failed lessons.
- Browser: 320/390/1280px without overflow or callout clipping.
- Keyboard focus/Enter and emulated touch pass. Text contrast: 8.56:1 callout, 5.74:1 caption.
- Reduced motion disables effects and preserves filled rings.
- Screenshots: `output/playwright/path-*.png`.

Local checks only. No deployment.
