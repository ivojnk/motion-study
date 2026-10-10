# Server progress, 10 October 2026

Account progress now uses the existing SQLite database / Cloudflare Accounts Durable Object. Authenticated snapshots include answers, XP, review planning, drafts and the current session. Static builds remain local.

Validation:
- 296 tests pass, including 10 sync/API regressions.
- Production build and both static build paths pass.
- Browser: one real answer, 5 XP and feedback survived clearing all local test storage and reloading.
- A separate browser session with the same username restored the lesson and XP.
- Conflict: Escape retains pending local data. Choosing the server downloads an importable recovery file before replacement.
- Dialog: 320/390 px without horizontal overflow, visible keyboard focus, 48 px buttons.
- Real Node and local Worker HTTP transport persist a snapshot larger than 20 kB. Worker rejects an account mismatch.
- Worker dry-run bundles successfully with existing bindings.

Offline writes remain pending. Revision conflicts require a choice. Interrupted local replacement rolls back from a saved snapshot. Updating waits for server acknowledgement. Logout attempts to flush and retains pending local data if unavailable. Storage notice version changed, requiring renewed login acknowledgement without changing account IDs.

No physical iPhone test or recovery of already deleted iPhone data was possible. Production verification is recorded after deployment below.
