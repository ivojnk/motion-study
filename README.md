# MotionStudy

Learn anatomy and biomechanics with an interactive 3D body and short quiz
lessons. Works in desktop and mobile browsers.

**Webapp:** https://ivojnk.github.io/motion-study/

## What you can do

- Explore real Z-Anatomy muscles and skeleton, rotate and zoom, select a muscle,
  highlight it and isolate it.
- Tap near a muscle to preview nearby choices with matching colours and symbols.
  Ambiguous taps zoom into the area. Choice buttons hide muscle names; confirm
  with “Deze bedoel ik” or restore the previous view with “Opnieuw kiezen”.
- Study 31 muscle cards and 593 questions across eleven chapters.
- Search all questions and answers by chapter, with a PDF page reference for every question.
  See [COURSE_COVERAGE.md](COURSE_COVERAGE.md) for the source coverage checklist.
- Follow 33 sequential levels: discover, practise and pass a checkpoint in each chapter.
  Score at least 80% on original questions to unlock the next level. Skips count
  against that score, and retries help learning without inflating it.
- Alternate multiple choice, judging suggested answers, muscle recognition and pointing in 3D.
  Practise matching muscle names to their course-defined functions.
- Read a short lesson introduction and see XP and progress when you finish.
- Earn 5 XP per correct answer and 10 XP per completed lesson with an answer.
  Reach 30 XP per local calendar day to build a streak. Replaying earns XP,
  while spaced mastery remains based on actual review intervals.
- Practise mixed ten-question lessons with feedback and one retry per wrong question.
- Review questions with increasing intervals. Switch between lessons and resume each unfinished lesson.
- Use the keyboard: arrows and +/− control the model, 1–4 answer quiz questions.

Progress stays in your browser. There is no account, analytics, cloud storage
or live AI request. Clearing site data clears your progress.

## Run locally

Requires Node 22.12 or newer.

```sh
npm ci
npm test
npm run dev
```

Open http://127.0.0.1:5173. Use `npm run build` and `npm run preview`
to inspect the production build.

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

GitHub Actions runs the tests and builds the app. Pushes to `main` deploy
to GitHub Pages. The workflow sets `BASE_PATH=/motion-study/`; asset and
license URLs support that project subpath. To host at another subpath, set
`BASE_PATH` when building. Use the same `BASE_PATH` for local preview.

Tests cover question integrity, chapter coverage, real anatomical mesh
mappings, asset provenance, review scheduling and invalid stored progress.
Tests also cover sequential unlocks, XP persistence, calendar streaks and course-grounded matching.
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
