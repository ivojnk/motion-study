# Focused home page

Start/Verder callout validation on 2026-10-05:
- One callout follows the recommended or resumed lesson across all chapters, including saved replays. Other unlocked chapters remain startable.
- Fixed 66px row gaps replace active-step margins. All four first-chapter steps kept the same document positions when the callout moved to the second group and changed from Start to Verder.
- Local browser checks passed at 320, 390 and 1280px without horizontal overflow. Keyboard focus retained its 3px outline, and Enter opened the active lesson.
- All 74 focused transition/group tests and both production/static builds passed. The existing large-chunk build warning remains.
- Screenshot: `output/playwright/single-resume-callout-390.png`. No deployment was performed.

The supplied Duolingo screenshot informed the compact top metrics, chapter banner and bottom navigation. MotionStudy keeps its existing cream/forest palette and grouped lesson path. Chapters appear in course order, with completed chapters collapsed and the current chapter open. Opening the homepage positions the current chapter header below the sticky banner. Earlier chapters remain available through their headers. Atlas, question bank and progress stay in navigation.

The existing lesson IDs, progress rings, saved-session selection and grading remain intact. No UI dependency or Duolingo artwork was added. Local icons follow the project's icon library and license notices.

The top strip now shows the daily streak and total collected points. The separate daily-goal icon was removed at the user's request. Existing earned XP supplies the accumulated points value, preserving saved totals. The two-metric layout passed at 320, 390 and 1280 pixels, and all 127 tests passed.

Validation on 2026-10-05:
- 127 tests passed; production build passed with the existing large viewer-chunk warning.
- Homepage had no horizontal overflow at 320, 390 or 1280 pixels. All four routes passed at 320 pixels.
- Chapter header stayed below the top metrics while scrolling.
- Account menu worked with Enter and had a visible 3px focus outline and 44px target.
- Header action resumed the saved lesson; closing the lesson returned to the home path.
- Lesson mode hid the surrounding navigation. Reduced motion disabled animation and transitions.
- Screenshots: output/playwright/focused-home-390.png, focused-home-320.png and focused-home-desktop.png.

Checks used an isolated local test account. Physical touch devices and actual screen readers were not tested. No deployment was performed.

The duplicate mixed-lesson and review links below the path were removed. Sources and licenses now open from the account dropdown, alongside logout. The dropdown uses existing licensed icons, 48px action rows and visible keyboard focus. Local checks passed at 320, 390 and 1280 pixels without horizontal overflow. Enter opens the sources dialog; closing it restores focus to the account trigger. Escape, outside clicks and emulated mobile taps dismiss the menu. Review remains available under Progress. All 127 tests and the production build passed. Screenshot: output/playwright/account-menu-390.png. No deployment was performed.

Earlier lesson scrolling checked on 2026-10-05: the bottom “Eerdere hoofdstukken” disclosure was removed. Earlier chapter lessons remain open above the current chapter. Initial positioning waits until the page becomes visible and uses an instant scroll. All 245 tests and the static production build passed. Browser checks at 320, 390 and 1280 pixels confirmed upward scrolling, current lesson visibility below the banner, no horizontal overflow, visible keyboard focus, Enter and emulated touch replay, closing a lesson and restoring its chapter after reload. The regression check preserves saved progress and the exact unfinished lesson. Screenshots: output/playwright/scroll-current-390.png and output/playwright/scroll-earlier-390.png. No deployment was performed.

Independent chapter choice checked on 2026-10-05: every chapter can start without completing earlier chapters. Lessons unlock sequentially within the chosen chapter. Existing questions, lesson IDs, completed lessons, XP and unfinished drafts remain intact. All 247 tests and both production builds pass. Local browser checks at 320, 390 and 1280 pixels confirm all 13 chapter entries enabled without horizontal overflow; chapter 13 starts with Enter and emulated touch, has a visible focus outline, and resumes after reload. No deployment was performed.

Chapter handoff checked on 2026-10-06: completed chapters now collapse, and the next chapter opens with its header visible. All 13 headers remain available. Regression checks cover every chapter, reloads, the completed course and unfinished replays. Browser checks at 320, 390 and 1280px passed without overflow; Enter reopens completed chapters with visible focus. Saved progress stayed unchanged. All 277 tests and both builds passed. Screenshot: artifacts/chapter-handoff/mobile-390.jpg. No deployment was performed.
