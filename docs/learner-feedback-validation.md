# Learner feedback fixes — 2026-10-10

- Streak screen is offered when daily XP crosses the goal, including a crossing during answers followed by a resumed lesson. Further lessons above the goal do not trigger it. Existing finish/reload reward protections remain.
- Fresh facts start with multiple choice. Binary-only/older progress without modality evidence needs a correct choice before harder modes and mastery. Practice counters and earned XP are retained.
- Open answers use normal document flow, with a fixed model area on small screens. Saving text does not redraw the question. A background redraw restores focus, selection and scroll position.
- After grading, native “Meer uitleg” expands existing anatomy fields, model hints or related facts from the same course section. Expansion awards no XP. Scrollable feedback preserves access to the next action.

Validation: 293 tests passed. Account/static builds passed (existing chunk-size warnings). Browser checks at 320, 390 and 1280 pixels: no horizontal overflow; expanded explanation preserves the next button. Keyboard focus/Space and emulated touch checked; reduced motion supported without adding animation. Input position/focus/draft checked during character-by-character typing. Physical iPhone keyboard behaviour was not tested.

Screenshot: `output/playwright/learner-feedback-320.png`. No deployment performed.
## Production release

Released 10 October 2026 via PR [#25](https://github.com/ivojnk/motion-study/pull/25), merge `3028c4f`. Current-main verification passed 316 tests and both builds. Worker deployment `b13ba51d-f240-4edb-a8e7-dfddb0328eca` and GitHub Pages static commit `b3df93d` are live; remote HTML and version endpoints match the built output. Live account/security checks and browser lesson flows passed, including the absent repeated streak on the next lesson.
