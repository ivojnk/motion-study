# MotionStudy

Learn anatomy and biomechanics with an interactive 3D body and short quiz
lessons. Works in desktop and mobile browsers. The study-book interface uses local CSS,
existing fonts and Phosphor Icons in the Duotone variant. See
[icon sources](docs/phosphor-icons.md) and [UI references](docs/ui-design-research.md).

**Previous static version:** https://ivojnk.github.io/motion-study/

## What you can do

- Explore real Z-Anatomy muscles and skeleton, rotate and zoom, select a muscle,
  highlight it and isolate it.
- Tap near a muscle to preview nearby choices with matching colours and symbols.
  Ambiguous taps zoom into the area. Choice buttons hide muscle names; confirm
  with “Deze bedoel ik” or restore the previous view with “Opnieuw kiezen”.
- Study 39 muscle/structure cards and 1125 questions across thirteen chapters.
- Recognise 118 exercises and variants from highlighted muscles in 3D, covering every one of the 64 exercise-table rows and 52 named variants. A movement hint distinguishes exercises with the same muscle emphasis. Practise these questions in the chapter lessons, then type exercise names in spaced reviews. Feedback names the muscles and explains the course emphasis.
- Practise 41 additional coaching questions about external focus, analogy cues and energy leaks. Each correction includes a cue, an observable check and an exercise adjustment. These original examples are labelled as supplemental, with research references for the learning principles.
- Search all questions, answers and coaching explanations by chapter. The 1084 course questions have PDF page references; coaching examples link to the related course facts and learning research.
  See [COURSE_COVERAGE.md](COURSE_COVERAGE.md) for the source coverage checklist.
- Follow 169 sequential lessons across thirteen chapters. Each lesson starts with seven
  course questions plus up to two earlier mistakes; the final lesson in a chapter adds earlier questions as review. Wrong
  answers return until corrected, then the next lesson unlocks. The result keeps
  the first-attempt score separate from corrections. Existing completed chapters
  and XP carry over to the new path.
- Earlier mistakes return across chapters until answered correctly on the first
  attempt in three distinct later lessons, including one answer without choices.
  Immediate retries do not count; a new mistake resets this recovery. The least
  recently practised mistakes return first. Existing errors carry over, and this
  recovery stays in the account's browser storage. Spaced mastery still requires
  the existing time intervals. Explicit review also includes unresolved mistakes.
- Body-direction and sidedness definitions use text only, without model hints that
  could reveal the answer. Muscle-chain questions can use the 3D atlas.
  All eight muscle chapters introduce relevant recognition from their first lesson,
  with one extra existing recognition question where appropriate. The original seven
  questions, lesson IDs, completed lessons and saved drafts stay intact. Selected
  anatomy, muscle-role and movement-pattern questions also show the discussed
  muscles. These keep their original answers and exercise forms. The atlas shows
  static anatomy; it does not demonstrate exercise technique or stretch positions.
- Each question has several exercise forms, tied to its own review progress. Start
  with multiple choice or highlighted-muscle recognition, then practise pointing
  in 3D and recalling the answer without hints in later reviews. Wrong answers
  bring back assistance, and practising early does not unlock harder forms.
- Early muscle lessons also ask which of four highlighted muscles matches a name.
  Each candidate has a matching number, colour and shape in the model and answer
  button. Candidate names appear after answering; saved lessons keep their order.
- Type short terms and muscle names for automatic checking. Small, unambiguous
  spelling errors are accepted, with the correct spelling shown in feedback. Longer explanations
  reveal the course answer after you write yours. Compare the two and explicitly
  mark whether you knew it. This self-assessment uses no AI grading.
- Multiple-choice answers are checked immediately when clicked or selected with 1–4. Feedback stays visible until you continue. Tab and Enter also work on the answer buttons.
- See clear answer feedback with earned XP and a session-local run of correct answers.
  Wrong answers return until corrected.
- Start each short lesson directly with the question. The result shows your
  first-attempt score, XP, best answer streak and daily goal.
- Earn 5 XP per correct answer and 10 XP per completed lesson with an answer.
  Reach 30 XP per local calendar day to build a streak. Replaying earns XP,
  while spaced mastery remains based on actual review intervals.
- Practise mixed seven-question lessons and seven-question reviews. Small review
  pools repeat due questions to reach seven. Mistakes extend the lesson until corrected.
- Track consecutive correct answers during a lesson and see the best answer streak
  in the result. The answer streak resets on a mistake and survives reloads.
- Review questions with increasing intervals. Switch between lessons and resume each unfinished lesson.
- Use the keyboard: arrows and +/− control the model, 1–4 select a quiz answer
  and Enter confirms it.

Enter a username to use the app. A new name creates an account automatically.
Entering an existing name signs you in. Names are case-insensitive and use
2–24 letters, numbers, dots, hyphens or underscores. There is no password:
anyone who knows a username can use that account.

Accounts and 30-day sessions are stored on the server in SQLite (a Durable Object
on Cloudflare, a local file when running Node). Progress,
XP and unfinished lessons stay in your browser, separately for each account.
They do not sync between devices. Clearing site data clears your progress,
but you can still enter your username again. Existing progress from before
accounts is preserved in browser storage and is not automatically assigned
to an account. Optional usage statistics collect account activity and lesson counts, without answers or scores. There is no live AI request.

## Add to your home screen

Choose **Op je beginscherm** on the sign-in screen or in the account menu.
The panel also appears once after the first completed lesson. Dismissing it
returns to the result, and the choice is remembered on this browser.
Chrome and Edge can offer a native installation prompt. On iPhone/iPad, the
app shows the Safari steps: Share → Zet op beginscherm → Voeg toe.
Installed MotionStudy opens in its own window with the approved Leerblad app icon.
An internet connection is still required; installation does not sync progress
between devices. The manifest, PNG icons and instructions are served locally,
without an extra dependency. Manifest and icon URLs follow Vite's base path.

The Leerblad logo is used across the app, Beheer and Analytics. Browser icons and
the social-share image use the same artwork. See [logo implementation](docs/logo-implementation.md).

Implementation references: [MDN installation guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
and [Apple's iPhone guide](https://support.apple.com/nl-nl/guide/iphone/iphea86e5236/ios).

## Run locally

Requires Node 22.13 or newer (for built-in SQLite).

```sh
npm ci
npm test
npm run dev
```

Open http://127.0.0.1:5173. Both `dev` and `preview` include the account server.
Use `npm run build` and `npm run preview` to inspect the production build.
The database is created automatically at `.data/accounts.sqlite` and is ignored
by Git. Stop the server with Ctrl+C. Optional `.env` settings: `PORT`, `HOST`,
`APP_ORIGIN` and `ACCOUNTS_DB`.

The public question bank is checked in. A clean clone builds without the
original study PDF or any private file. An optional local
`npm run curriculum:import` rebuilds it from the private files
`sources/course.txt` and `sources/course-pages.json`. These private source files are ignored.

## Sources

The model exports come from
[nqwrc/3d-anatomy](https://github.com/nqwrc/3d-anatomy), based on
[Z-Anatomy](https://www.z-anatomy.com/) and
[BodyParts3D](https://lifesciencedb.jp/bp3d/).
The learning topics follow the supplied Anatomie-Biomechanica-Cheatsheet,
Milo module 6.6. Course-question references link to that document. Supplemental coaching applications cite research on external focus and analogy learning, without claiming that those studies validate every exercise correction. The full PDF and
extracted source passages are not redistributed.

See [ATTRIBUTION.md](ATTRIBUTION.md) for exact credits, immutable model
provenance, modifications and the license breakdown. Original software:
MIT. Anatomy assets and original question-bank contributions: CC BY-SA.
Third-party components retain their own terms.

## Deployment and checks

Every push to `main` in `ivojnk/motion-study` automatically deploys to the existing
`lottequiz-motionstudy` Worker through Cloudflare Workers Builds. Cloudflare
installs the locked dependencies, runs `npm test && npm run build`, then
`npx wrangler deploy`. Failed tests or builds stop deployment. Preview builds
are disabled, so other branches do not publish to production.

Cloudflare uses the repository root and `NODE_VERSION=22`. The checked-in
`.node-version` also selects Node 22 for local version managers and GitHub Actions.
GitHub Actions independently runs tests and builds on pushes and pull requests.
GitHub Pages deployment remains disabled because a static host cannot run the
account server. Build history and logs are available under the Worker's
**Deployments** tab, and the repository connection under **Settings → Builds**.

Cloudflare URL: https://lottequiz-motionstudy.jonkersivo.workers.dev

The Worker serves the production build and uses one SQLite-backed Durable Object
for accounts and sessions. Atlas files require a valid session. Only `dist/` is
uploaded as public assets. `APP_ORIGIN` must match the exact public URL.

```sh
npm run build
npm run cloudflare:dev
# In another terminal:
npm run cloudflare:check
# Publish using your Wrangler login:
npm run deploy
CHECK_ORIGIN=https://lottequiz-motionstudy.jonkersivo.workers.dev npm run cloudflare:check
```

For alternative Node hosting, use a persistent disk and an HTTPS reverse proxy:

```sh
npm ci
npm run build
NODE_ENV=production HOST=0.0.0.0 PORT=3000 APP_ORIGIN=https://your-domain.example ACCOUNTS_DB=/persistent/accounts.sqlite npm start
```

Set `APP_ORIGIN` to the exact public HTTPS origin. The proxy forwards to Node.
No forwarded headers are trusted. Sessions use HTTP-only cookies with
SameSite=Lax and Secure on HTTPS. Requests that create or end a session must
come from the configured origin. Entry attempts are limited per connection IP.
Behind a reverse proxy, clients share that limit. Configure additional limits
at the proxy if needed. Back up the SQLite database and its WAL files together
using a SQLite-aware backup tool. Run one server process for this small deployment.

Tests cover question integrity, chapter coverage, real anatomical mesh
mappings, asset provenance, review scheduling and invalid stored progress.
Account tests cover persistent usernames, sessions, logout, expiry, origin
validation, rate limits and separate browser storage per account.
Tests also cover sequential unlocks, XP persistence, calendar streaks, course-grounded matching,
adaptive difficulty, open-answer grading and restoring unfinished recall attempts.
Browser checks cover desktop and 320/390px mobile layouts, quiz feedback,
reload, keyboard controls and 3D selection. Integration checks run the actual app
transitions with simulated browser boundaries to cover lesson switching, history,
stale tab state and queued reward updates. Browsers supporting Web Locks serialize
reward writes across tabs. Physical touch devices and screen readers have not been
tested.

## Current limits

The question bank covers the teachable content of the supplied 28-page cheatsheet,
including 64 exercise rows and 57 visual length profiles. It is not a guarantee
about questions in an external exam. The original questions recall the supplied course. Additional coaching examples teach how to try a cue and observe its effect. They are not individual training prescriptions.

The imported atlas has no animation rig. Exercise animation remains a future
stage requiring a licensed rig and validated muscle deformation. This version
has a functional interactive atlas and quiz, without exercise playback.

## Learning interaction research

The app adapts answer confirmation, feedback and lesson rhythm from official
Duolingo design publications. Research and implementation choices are in
[answer interaction](docs/duolingo-answer-research.md),
[rewards and rhythm](docs/duolingo-rewards-research.md) and
[feedback design](docs/duolingo-feedback-research.md). Native buttons, progress
bars and locally served MIT-licensed Phosphor Duotone icons keep the flow lightweight.

## Analytics and owner access

Open `/beheer/` to enroll the owner passkey, then `/analytics/` for account,
activity and completed-lesson totals plus a daily table. Use a strong, one-time
`OWNER_SETUP_KEY` Worker secret to enable enrollment. Only the first credential
can enroll. No username account can access the dashboard. After enrollment,
remove the setup secret. Losing the passkey requires an administrator to reset
owner access through Cloudflare.

Account totals include existing registrations. Activity and lessons only include
users who enable statistics in their current session. Measurement starts when
this version first initializes the analytics tables. Past browser-only lessons
are not imported. A repeated lesson counts as a new completion, while retries
and duplicate submissions count once. `deploy-check-*` and the existing
`cloudflare-browser-check` account are reserved test fixtures and excluded.

Existing accounts keep only the last activity date/time and completed-lesson
count. Daily totals are retained for 90 days. Salted completion receipts contain
no usernames, account IDs, question IDs, scores or answers and are retained for
35 days, with cleanup on the next usage event. Reports older than 30 days are rejected. Overall lesson totals remain.
Failed reports retry from a small queue in the account's browser storage. These
are observed usage counts and may miss offline reports or cleared storage.

The dashboard uses Amsterdam calendar days and has 7/30/90-day filters. Owner
sessions expire after one hour. Passkey verification uses the MIT-licensed
SimpleWebAuthn library. Its browser code loads only on the owner login page.
Use `npm run cloudflare:dev` for full local owner/auth testing. Node hosting
continues to serve the learning app but does not provide owner analytics routes.
