# Phosphor icon validation

Checked locally on 5 October 2026:

- Official Duotone SVGs retain translucent background layers.
- Full MIT notice is included in generated third-party credits.
- Production build passes.
- Leren, 3D-atlas, Vragen and Voortgang show no broken icons or horizontal overflow at 320, 390 and 1280 pixels.
- Desktop and mobile screenshots inspected in `output/playwright/phosphor-*-leren.png`.
- Lesson close supports keyboard activation, a visible focus outline and a 44px target.
- Credits close supports keyboard activation and a 44px target.
- Atlas reset works with emulated touch and reduced motion.

Physical-device and screen-reader testing was not performed.

## Muscle isolation icon

Replaced the target with the official Phosphor Duotone scan icon on 5 October 2026. The production build and five viewer-selection tests pass. A browser preview with a mocked local session verified icon loading, both toggle states, the 44px target, a 3px keyboard focus outline, Space activation, emulated touch activation, and no horizontal overflow at 320, 390 and 1280px. Preview captures: `output/playwright/isolate-controls.png` and `output/playwright/isolate-icon-on.png`. Protected model loading was not part of this UI check.

## Independent model visibility controls

Isolation stays enabled during every model exercise and retains its setting through feedback, question changes and atlas navigation. It keeps all highlighted candidates, including four coloured choices, while hiding surrounding muscles. Toggling visibility preserves pending picks, colours, markers and camera. Skeleton visibility remains independent. All 237 tests and the production build pass. A real local account and model verified desktop, keyboard and emulated mobile touch toggles, feedback, the next question and layouts at 320/390/1280px. Captures: `output/playwright/four-muscles-isolated.png` and `output/playwright/four-muscles-isolated-mobile.png`.
