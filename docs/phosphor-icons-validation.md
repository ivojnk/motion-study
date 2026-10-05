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
