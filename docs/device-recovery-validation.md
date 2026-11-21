# Recovery button, 10 October 2026

The login screen and account menu offer **Voortgang herstellen**. The chooser scans known learning keys in this browser: account profiles, legacy root keys, local recovery copies, saved previous server snapshots and interrupted replacements. An authenticated user can also inspect the current server snapshot.

Choices show XP, completed lessons, practiced questions, the last known learning day and an unfinished lesson when present. Identical data is grouped. Unreadable records produce a visible message. Scanning is read-only. A choice before login is staged until authentication, and can be cleared. Applying a choice replaces the target account after fetching its current revision. Existing source profiles and the previous server snapshot remain available. Matching-cache startup no longer overwrites recovery copies.

Validation: 309 tests and production/static builds pass. Real browser checks restored a 65-XP copy from another profile after login and a 45-XP profile while logged in, confirming server persistence and preservation of the original sources. Touch emulation, keyboard focus, Escape and 320/390 px layout checks cover the chooser.

This reads the current app origin's storage. It cannot inspect Safari's separate storage, another website address, another device or already erased data. No physical iPhone test was performed.
