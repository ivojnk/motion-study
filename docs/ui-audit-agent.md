# MotionStudy UI audit

Reviewed the initial `index.html`, `src/main.js`, `src/style.css`, `src/bootstrap.js`, and 3 saved mobile screenshots on 5 October 2026. Screenshots are earlier captures. Application files were not changed by this audit agent. The subsequent implementation review below supersedes recommendations affected by concurrent learning-rule changes.

The current identity reads as a generic learning-app template. Purple appears in the logo, headline emphasis, labels, progress bars, pills, buttons, and lesson nodes. Almost every section has the same pale background, thin border, generous rounding, and padding. These choices hide the actual distinguishing feature: the anatomical model and specific course material.

## Recommended direction

An anatomy study notebook: warm paper background, dark ink typography, fine dividers, a restrained rust or coral accent, and clear lesson numbering. Use the existing DM Sans and Manrope fonts and Tabler icons. A third-party UI library would add little for these screens.

Separate information density by task. The home screen needs a clear next lesson and a compact syllabus. The atlas needs room for the body and factual annotations. Lessons need one question and a stable action area.

| Screen | Current friction | Concrete change |
| --- | --- | --- |
| Sign-in | Large abstract promise beside a standard rounded card | Short factual heading, course/module label, restrained form, compact factual course overview. Avoid invented signup or sync promises. |
| Home | XP and daily-goal explanations precede the actual next lesson. The atlas uses half the workspace. | Put the next lesson first. Compress rewards into one quiet line. Use a smaller anatomical preview or atlas shortcut. Present 11 chapters as compact rows with 3 stage controls. |
| Syllabus | 33 large circular nodes plus status copy create a very tall mobile page | Number chapter rows, show title and stage state, expand the active chapter. Keep locked/done states and all restart controls discoverable. |
| Atlas | 31 chips, a second muscle picker, card details, and the selection card repeat navigation and content | Group muscles by region in a compact index. Let the viewer dominate the atlas screen. Put factual muscle details adjacent on desktop and immediately after the viewer on mobile. |
| Quiz | Generic nested cards and thick button shadows add decoration around an already complex task | Flat question surface, readable heading, consistent answer rows, clearer selected state and short feedback. Keep the current question-first mobile model arrangement. |
| Matching | Narrow columns and tiny type increase reading effort | Preserve pairs and state mechanics. Use 13–14px mobile text, balanced columns, adequate row height, and a concise instruction. |
| Result | Several pastel boxes split score, XP, goal, and next lesson | One result heading, clear first-attempt score, compact reward line, one next action. Keep the 80% pass threshold explicit. |
| Progress | Repeated goal widgets and an unrelated full atlas compete with chapter mastery | Use full-width chapter rows with aligned counts and progress. Place due-review action near the top. Keep mastery definition available in quiet explanatory text. |
| Questions | Nested outlined accordions read as a wall of containers. Atlas remains visible. | Full-width index, horizontal search and chapter filter on desktop, stacked filters on mobile, simple divider rows and clearly visible result count. |
| Credits | Attribution must remain usable despite visual simplification | Keep all existing source and license links, keyboard dismissal, readable body copy, and a reachable close control. |

## Priorities and verification

1. Change route composition before color. Home, progress, and question bank currently call `resetAtlas()` and leave the atlas visible. Its full column is not useful on every screen.
2. Replace repeated promotional headings: “Een level dichter bij begrip”, “Kijk eens hoe ver je komt”, and “Van plaatje naar begrip”. Use “Je leerpad”, “Voortgang”, and “Spieren verkennen”, then state the task beneath.
3. Reduce the radius scale to approximately 6px for inputs and controls, 10–12px for featured panels. Use borders and spacing for chapter and data rows.
4. Raise small labels, metadata, and viewer help from 8–11px to 12–13px where users need to read them. Maintain at least 14px for answer content except unusually long matching definitions.
5. Consolidate duplicated `.bank-filters` and `.question-bank` styles and accumulated mobile overrides when editing. Scope visual changes by route to avoid unintended lesson changes.

Check at 320px, 390px, tablet, and desktop. Verify no horizontal overflow, 44px touch targets, visible keyboard focus, sufficiently contrasting muted text, source/credits access, long Dutch names, reduced motion, and an action area that does not cover the final answer. Existing local drafts, rewards, account behavior, and model selection must remain intact.

## Implementation review

The revised UI now uses a study-book layout, compact chapter disclosures, factual headings, green controls, and separate progress/question-bank layouts. Concurrent learning work replaced the original 33-level structure and 80% rule with 88 lessons, 7 initial questions, and correction of every mistake. The revised UI derives lesson totals from `levelPath`, shows actual per-chapter counts, and removes the old threshold. The initial audit's 80% recommendation above therefore no longer applies.

Two accessibility findings were corrected during review: the navigation now sets `aria-current="page"`, and the mobile logout target remains 44px. The mobile atlas is moved first in the DOM, so keyboard order agrees with its visual position. Purple remains an intentional anatomical selection color described by the question wording.

Independent Chrome layout checks found no horizontal overflow across learning, atlas, progress, and questions at 320px, 390px, 768px, and 1280px. Those checks used an isolated account-session mock against the Vite server and verify layout only.

A separate real sign-in on the production preview at port 52742 verified model loading, progress-to-atlas and bank-to-atlas transitions, correct canvas resizing after hiding, muscle selection, the Back view's pressed state, return to the muscle index, opening and closing a text lesson, and credits dismissal with Escape. No page errors were observed. The production smoke check used a separate local audit account and did not answer questions.
