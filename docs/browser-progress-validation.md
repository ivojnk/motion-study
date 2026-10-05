# Browser progress verification — 2026-10-05

Scope: prevent stale tabs from overwriting saved lessons and expose browser storage failures. Account-local storage keys and existing progress remain compatible.

Four regression tests reproduce stale lesson overwrites, duplicate grading, restored completed drafts and storage failure/recovery. Independent browser checks retained answer feedback after reload, 5 XP after closing/reopening the tab, and 10 XP plus the unfinished lesson after logout/re-entry. A second tab reloaded to the new answer with answered buttons disabled.

The release is prepared on current origin/main with only the persistence changes. Concurrent mistake-review and exercise-combination work is excluded.

Storage stays per browser, origin and account. Clearing site data removes local progress. Browser-process shutdown and private-mode shutdown were not directly tested. Unconfirmed pointing previews are not saved answers.

Release validation: all 152 tests pass, production build passes, Wrangler dry run passes, and the isolated local Worker check passes current assets, account identity/session rotation/logout, protected atlas/private files and origin guards. The previously observed curriculum failures are absent from this focused release.
