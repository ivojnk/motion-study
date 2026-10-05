# Floating muscle choices and model controls

Checked locally on 5 October 2026, using the production build.

- Mobile 320/390 px, tablet 768 px, desktop 1280 px and landscape 844×390: no horizontal overflow or movement of the canvas, controls or page scroll when choices open.
- Real mesh picking, keyboard selection/confirmation, cancellation, reopening and focus restoration pass.
- Choices retain their preview across fullscreen entry/exit and responsive layout changes. Escape closes the choice first.
- Skeleton and isolation use 44 px icon switches over the canvas. Mouse and Space toggle their original inputs. Disabled lesson controls retain their existing restrictions.
- Emulated touch switches the skeleton and isolation, selects a real mesh and confirms it. Reduced motion disables transitions and fullscreen animation. Physical touch devices and screen readers were not tested.
- All 233 automated tests pass. Screenshots are in `output/playwright/muscle-choice-*.png`.

## Main integration validation

Rechecked in the release worktree on 5 October 2026. All 233 tests, production build and Worker dry run pass. All 653 existing question IDs and answers remain intact. Combination and four-colour model questions have no horizontal overflow at 320, 390, 768 and 1280 px. Keyboard answers and feedback survive reload. Real mesh picking opens the floating chooser; its selected colour survives fullscreen entry. Escape dismisses the chooser before fullscreen. Reduced motion, local icon licensing and 44 px overlay targets were verified.
