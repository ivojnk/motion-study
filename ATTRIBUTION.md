# Sources and licenses

MotionStudy builds its learning interface around existing open anatomy assets.
The original application software is MIT licensed. That license does not
replace any third-party asset license.

## Anatomy models

Required attribution, preserved verbatim:

**BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan**

**Z-Anatomy - The open source atlas of anatomy - CC-BY-SA 4.0**

- BodyParts3D: https://lifesciencedb.jp/bp3d/
- Z-Anatomy: https://www.z-anatomy.com/
- Browser-ready GLB exports: https://github.com/nqwrc/3d-anatomy
- Export revision: `8ca3b7421bcfbe88b85859eb1983d5cf79f21749`.

Only `muscular.glb` and `skeletal.glb` are redistributed. Their geometry
is unchanged. The app changes colors, selection highlights and visibility at
runtime. These model assets and adaptations retain CC BY-SA terms:
https://creativecommons.org/licenses/by-sa/4.0/

`public/models/provenance.json` records their immutable source URLs,
file sizes and SHA-256 hashes. The original model notice is preserved in
`public/models/License.txt`. The exporter repository's complete LICENSE and
NOTICE are preserved in `public/licenses/upstream-LICENSE.txt` and
`public/licenses/upstream-NOTICE.txt`.

The exporter repository's complete distribution includes additional assets
with different terms. Its non-commercial inner-ear and kidney assets are in
the nervous and visceral models, which MotionStudy does not include. No
exporter application code or Wikipedia definitions were copied.

## Learning content

The curriculum follows the supplied **Anatomie-Biomechanica-Cheatsheet**,
Milo PT opleiding, module 6.6. Every question names a source chapter and links
to the supplied study document.

The public repository includes factual muscle profiles and authored quiz
questions. It does not redistribute the PDF, extracted document or long
source passages. Original contributions to the question bank are
CC BY-SA 4.0. This does not relicense the original course document, endorse
the app on behalf of Milo, or assert rights over third-party course prose.

## Software, fonts and icons

| Component | Source | License |
| --- | --- | --- |
| Three.js, including OrbitControls and GLTFLoader | https://github.com/mrdoob/three.js | MIT |
| Three Mesh BVH | https://github.com/gkjohnson/three-mesh-bvh | MIT |
| Draco decoder | https://github.com/google/draco | Apache 2.0 |
| Phosphor Icons, selected Duotone SVGs | https://github.com/phosphor-icons/core | MIT |
| Vite | https://github.com/vitejs/vite | MIT |
| DM Sans and Manrope, via Fontsource | https://github.com/fontsource/fontsource | SIL Open Font License 1.1 |

The complete Phosphor notice is preserved in `public/licenses/phosphor-LICENSE.txt`.
The selected Duotone SVGs are served locally without an icon-library dependency.

Full notices are distributed in `public/licenses/`. Dependencies are pinned
by `package-lock.json`. Fonts and models are served from the app's own
origin. No component-gallery implementation was copied.

## Installation panel

The installation panel uses selected Apple-template SVGs and adapted sheet CSS
from PWA Install 0.7.0 by Gleb Khmyznikov, under the MIT license. Source commit:
`ef1bd3ec440d711e3eaafb796914566817f976a6`. The MotionStudy app icon, learning
copy, native dialog behavior, cream/green brand colors and responsive behavior
are local adaptations. The complete runtime library is not included.
The five system icons are separate from the app's Phosphor Duotone icon set.
Full notice: `public/licenses/pwa-install-LICENSE.txt`. The notice is also included
in `public/licenses/third-party.txt` and exposed in the app's credits.
The app icons render the existing Manrope brand mark; its OFL notice is preserved.

Source: https://github.com/khmyznikov/pwa-install/tree/ef1bd3ec440d711e3eaafb796914566817f976a6
