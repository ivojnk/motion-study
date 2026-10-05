# MotionStudy

Learn anatomy and biomechanics with an interactive 3D body and short quiz
lessons. Works in desktop and mobile browsers. The study-book interface uses local CSS,
existing fonts and Tabler icons; see [UI references](docs/ui-design-research.md).

**Previous static version:** https://ivojnk.github.io/motion-study/

## What you can do

- Explore real Z-Anatomy muscles and skeleton, rotate and zoom, select a muscle,
  highlight it and isolate it.
- Tap near a muscle to preview nearby choices with matching colours and symbols.
  Ambiguous taps zoom into the area. Choice buttons hide muscle names; confirm
  with “Deze bedoel ik” or restore the previous view with “Opnieuw kiezen”.
- Study 31 muscle cards and 593 questions across eleven chapters.
- Search all questions and answers by chapter, with a PDF page reference for every question.
  See [COURSE_COVERAGE.md](COURSE_COVERAGE.md) for the source coverage checklist.
- Follow 88 sequential lessons across eleven chapters. Each lesson starts with seven
  questions; the final lesson in a chapter adds earlier questions as review. Wrong
  answers return until corrected, then the next lesson unlocks. The result keeps
  the first-attempt score separate from corrections. Existing completed chapters
  and XP carry over to the new path.
- Each question has several exercise forms, tied to its own review progress. Start
  with multiple choice or highlighted-muscle recognition, then practise pointing
  in 3D and recalling the answer without hints in later reviews. Wrong answers
  bring back assistance, and practising early does not unlock harder forms.
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

Accounts and 30-day sessions are stored on the server in SQLite. Progress,
XP and unfinished lessons stay in your browser, separately for each account.
They do not sync between devices. Clearing site data clears your progress,
but you can still enter your username again. Existing progress from before
accounts is preserved in browser storage and is not automatically assigned
to an account. There is no analytics or live AI request.

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
Milo module 6.6. Question references link to that document. The full PDF and
extracted source passages are not redistributed.

See [ATTRIBUTION.md](ATTRIBUTION.md) for exact credits, immutable model
provenance, modifications and the license breakdown. Original software:
MIT. Anatomy assets and original question-bank contributions: CC BY-SA.
Third-party components retain their own terms.

## Deployment and checks

GitHub Actions runs tests and builds the app. Automatic GitHub Pages deployment
is disabled because a static host cannot run the account server. This account
version has not been deployed. Host it at the root of a domain on a Node server
with a persistent disk and an HTTPS reverse proxy:

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
about questions in an external exam. Questions recall the supplied course rather than providing
personal training or medical advice.

The imported atlas has no animation rig. Exercise animation remains a future
stage requiring a licensed rig and validated muscle deformation. This version
has a functional interactive atlas and quiz, without exercise playback.

## Learning interaction research

The app adapts answer confirmation, feedback and lesson rhythm from official
Duolingo design publications. Research and implementation choices are in
[answer interaction](docs/duolingo-answer-research.md),
[rewards and rhythm](docs/duolingo-rewards-research.md) and
[feedback design](docs/duolingo-feedback-research.md). Native buttons, progress
bars and the existing MIT-licensed Tabler icons keep the flow lightweight.
