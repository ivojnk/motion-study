# Browser progress check — 2026-10-05

Initial result: browser-local persistence works, but stale tabs could overwrite lesson drafts and storage errors were silent.

Evidence: four regression tests failed before the fix. All 163 tests initially passed after the fix. After concurrent curriculum edits, the final 57 focused app/account/open-answer tests passed and the production build passed. The final full suite passed 159/163: four failures concern new exercise-combination modes, 89 versus 88 lessons and lesson-group sizes. These changes were outside this patch.

| Verification question | Independent result |
| --- | --- |
| Does feedback survive reload? | Chrome retained answer, 1/7 progress and +5 XP. |
| Does closing/reopening a tab retain progress? | Chrome restored the unfinished lesson and 5 XP. |
| Do two tabs preserve newer answers? | Second Chrome tab reloaded to 2/7 and disabled answered buttons. |
| Does logout/re-entry retain progress? | Chrome retained 10 XP and “Ga verder”. |
| What happens when storage fails? | Regression test verifies warning and recovery of lesson, XP and answer history. |

Delta: stale writes, repeated grading and resurrected drafts now reload before writing. Storage failures show an alert; recovery saves outstanding rewards.

Revised result: checked scenarios preserve progress. The final persistence cross-check found no additional contradictions; the four full-suite curriculum failures remain unresolved. Browser shutdown itself and private-mode shutdown were not tested. Storage remains per browser, account and origin; clearing site data or changing browser/device removes access to local progress. No server backup exists. Unconfirmed pointing previews are not saved answers.

Stop status: verification complete for these scenarios. The focused persistence release was subsequently validated with 152 passing tests on current main, merged as fe75105 and pushed. Concurrent curriculum work in this checkout remains separate.

Screenshot: `../output/playwright/browser-progress-restored.png`.
