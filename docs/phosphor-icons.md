# Phosphor Duotone icons

The interface uses selected SVGs from [Phosphor Icons core](https://github.com/phosphor-icons/core), in the **Duotone** variant. They replace the earlier Tabler outline icons. Existing local filenames are retained so the UI can keep its current icon references.

The SVGs are served from `public/icons/` without a runtime dependency or external request. Functional symbol controls use the same set. Decorative images have an empty `alt`. Icon-only buttons keep their accessible labels.

Phosphor Icons are MIT licensed. The complete copyright and license notice is included in `public/licenses/phosphor-LICENSE.txt` and the generated `public/licenses/third-party.txt`. The build preserves this notice through `scripts/copy-licenses.mjs`.

Earlier UI research documents describe the icon set used at the time of that research. This document and [ATTRIBUTION.md](../ATTRIBUTION.md) describe the current icon source.

The model overlay uses `bone.svg` (bone, Duotone) for the skeleton and `scan.svg` (scan, Duotone) for muscle isolation. The scan icon frames a single shaded shape, so this control is visually distinct from goal and reward targets. The bone and scan SVGs are copied unchanged from core commit `2b75f3ad12b420c9504ef05df8d2564a28f8500e`, with its source and MIT notice retained in the file. Both are local static assets with no added runtime dependency.
