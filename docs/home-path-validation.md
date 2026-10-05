# Focused home page

The supplied Duolingo screenshot informed the compact top metrics, chapter banner and bottom navigation. MotionStudy keeps its existing cream/forest palette and grouped lesson path. The homepage places the current chapter first, with earlier chapters available below the path. Atlas, question bank and progress stay in navigation.

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
