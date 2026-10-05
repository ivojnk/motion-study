# MotionStudy Leerblad-logo

Implemented locally on 5 October 2026. The approved B / Leerblad artwork is used in the main header, Beheer and Analytics. The narrow mobile learning header shows the symbol. Other headers show the horizontal logo. Each home link has an accessible MotionStudy label and the SVG images are decorative within that labelled link.

Production artwork lives in `public/brand/`. The supplied SVG masters contain outlined lettering and require no external fonts or images. Manrope's Open Font License is preserved at `public/brand/Manrope-OFL.txt`. Existing interface icons retain their own licenses.

Browser and installation assets live in `public/app-icons/`: SVG/ICO and 16/32/48 px PNG favicons, 180 px Apple touch icon, 192/512 px app icons and a 512 px maskable icon. Root `/favicon.ico` and `/favicon.svg` aliases support implicit browser requests. The installation dialog and its preview use the same approved app icon. Icon URLs carry `v=leerblad-1` to refresh cached artwork. The manifest keeps its relative app identity, launch URL and scope.

`public/brand/social-share.png` is the 1200 × 630 share image. Its outlined SVG source is kept beside it. The main page includes Open Graph and Twitter metadata with an absolute HTTPS image URL and alt text. Canonical and share URLs use the origin configured in `wrangler.jsonc` and Vite's base path. Beheer and Analytics retain `noindex,nofollow`.

`tests/brand-assets.test.mjs` checks approved artwork fingerprints, accessible home links, font-independent masters, real production builds at `/` and `/motion-study/`, share dimensions/metadata and anonymous GET/HEAD responses with correct MIME types. `tests/app-install.test.mjs` covers manifest scope and declared icon dimensions. These checks passed locally. Browser layout verification and any publication are recorded separately.
