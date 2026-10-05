# Progress export/import — 6 October 2026

Privacy & opslag exports learning-only JSON and imports it after validation and replacement confirmation. Includes answers, review planning, XP, completed lessons and unfinished drafts. Identity and analytics remain excluded.

The original workspace passed 266 tests and both account/static builds. Browser checks verified download/restore, feedback and 5 XP, invalid files, cancellation, keyboard focus, Escape, 320/390/1280px layouts and emulated touch.

This release applies the transfer change to current main. The static-edition source remains separate local work. Current-main release validation is recorded below.

Current-main release: all 265 tests pass and the production build passes. Nine transfer regressions cover roundtrip, old keys, clearing, invalid files, failed-write rollback, account scope, confirmation/cancellation, closing during file reading and blocked storage. The release adds no dependency or external asset.
