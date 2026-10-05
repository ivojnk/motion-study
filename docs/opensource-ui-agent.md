# Open-source UI research for MotionStudy

Checked 5 October 2026. Research only. No third-party source code imported.

## Shortlist

| Resource | Useful for MotionStudy | License and reuse | Maintenance / cost |
| --- | --- | --- | --- |
| [Tabler](https://github.com/tabler/tabler), especially [lists](https://preview.tabler.io/lists.html) and [segmented controls](https://preview.tabler.io/segmented-control.html) | Topic rows, restrained progress, clear toolbar grouping | [MIT](https://github.com/tabler/tabler/blob/dev/LICENSE). Preserve copyright and license when copying substantial code. | Active, not archived, last push 5 October 2026. Full kit is Bootstrap-based. Use patterns and small local CSS adaptations instead of installing the full kit. |
| [Tabler Icons](https://github.com/tabler/tabler-icons) | Consistent small navigation and anatomical-tool icons | [MIT](https://github.com/tabler/tabler-icons/blob/main/LICENSE). Retain license with copied SVGs. | Active, not archived, last push 5 October 2026. Individual local SVGs require no runtime library. |
| [The Component Gallery](https://component.gallery/), especially [tabs](https://component.gallery/components/tabs/) and [progress bars](https://component.gallery/components/progress-bar/) | Compare real design systems, selection states, wording and accessibility | Reference gallery. Linked systems and screenshots retain their own terms. A gallery listing does not grant code or artwork rights. | Browsing only, no app dependency. Native buttons, progress and details suit the existing app. |
| [BagUI](https://github.com/anelkabag/bag-ui) | Navigation spacing and grouped toolbar inspiration | [MIT](https://github.com/anelkabag/bag-ui/blob/main/LICENCE.md). Preserve notices if code is copied. Registry distinguishes free and pro components. | Active, not archived, last push 28 September 2026. React, Next, Tailwind, Radix and Motion stack differs from this app. Use selected ideas, avoid importing the stack. |
| [Design Resources for Developers](https://github.com/bradtraversy/design-resources-for-developers) and [Awesome Design Systems](https://github.com/alexpate/awesome-design-systems) | Broad idea discovery and links to mature design systems | First index MIT, second Unlicense. Licenses apply to index content, not every linked asset. | Not archived. Last pushes 5 October 2026 and 28 April 2026 respectively. No runtime dependency. |

Maintenance dates were checked through the primary GitHub repository API. Recent activity is evidence of activity, not a warranty of quality.

## Patterns to adapt locally

- Convert the topic catalog into a continuous list with dividers, larger readable titles, clear lesson counts and one selected state. Keep one prominent feature card for the next lesson.
- Use a compact lesson status row: question count, progress and exit action. Avoid several equally prominent progress or reward panels.
- Group 3D view controls using a segmented control with a visible selected state and meaningful labels. Preserve existing keyboard and touch behavior.
- Make the anatomical model the identifying visual. Use whitespace, typography and a controlled accent instead of repeated pastel panels, shadows and decorative badges.
- Keep motion to brief opacity/background changes. Respect reduced motion. Check focus, keyboard use, contrast and touch targets in the final implementation.

## Sources considered but not selected

- [Pico CSS](https://picocss.com/) is lightweight and MIT for code, but its own site now states that it is no longer maintained and GitHub marks the repository archived. Useful reference, unsuitable as a new dependency here.
- [Originkit](https://www.originkit.dev/) has many animated demonstrations, but the MIT license on its CLI/plugin does not establish the license of every component. Its [account policy](https://www.originkit.dev/docs/account-billing) points to separate usage terms and restrictions on redistributing components/templates. Component licensing and actual dependencies were not verified, so no code should be imported from it on this research alone. Particle backgrounds and elaborate text effects also add visual noise to a study interface.

The proposed local changes add no dependencies and copy no external code. Exact bundle cost would need measurement if that decision changes.
