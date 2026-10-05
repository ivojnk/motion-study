# Chapter path reference

Requested: replace the chapter lesson rows with a Duolingo-inspired learning path.

## Sources
- https://blog.duolingo.com/new-duolingo-home-screen-design/
- https://blog.duolingo.com/intermediate-mini-units/
- https://component.gallery/components/progress-bar/

## Implementation
Use colored chapter headers, a winding column of dimensional circular lesson buttons, a Start callout at the current lesson, gray locked nodes and gold completed nodes. Native details and buttons keep keyboard behavior and the current sequential lesson model. Labels, disabled states and accessible names preserve lesson numbers and status without relying on color. No new dependency or copied gallery implementation.

Tabler star (filled), lock and trophy (outline) SVGs are taken from revision `a4ce1404bc6d24d3c365afe7b258d6bf6f48d62d` of https://github.com/tabler/tabler-icons . MIT license already included in public/licenses and ATTRIBUTION.md. Icons are tiny static SVGs with no runtime dependency. Duolingo artwork and mascot are not copied.
