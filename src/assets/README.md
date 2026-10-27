# Selected identity sources

## FS monogram

`favicon-selected.png` is the exact approved
`exec-f75c6819-d120-4533-be8d-aa9094153c33.png`, selected on 2026-10-28.
It is 1254×1254 pixels. SHA-256:
`f4bd54d21546e6606ae2b151cab0374a6d7891da20f9704e6e89ca8952f5665a`.

`fs-ligature.svg` is a native contour trace of the same three-part silhouette,
with uniform graphite ink and a square viewBox. No new generative edit or
manual redesign was applied. `node scripts/assets/trace-selected-mark.mjs`
reproduces it from the approved PNG (threshold 150; contour simplification
distance 1.2 source pixels, gentle quadratic smoothing and preserved hard
corners). The original raster remains the approval reference.

`pnpm assets:build` generates the theme-aware favicon SVG, transparent header
SVG, multi-resolution ICO (16/32/48/64/128/256), PNGs at
16/32/48/64/96/128/180/192/256/512/1024, JPGs at 128/256/512, touch icon and
192/512 manifest icons. Existing `favicon.png`, `favicon-96x96.png` and
`favicon.ico` paths stay current. Browser fallback PNG/JPGs use a warm-white
background; SVG adapts to the browser theme and the header follows the site's
explicit theme.

The same generator composes the approved mark and portrait with exact text
into the 1200×630 sharing card (SVG/JPG/PNG/WebP), a 2400×1260 PNG export and a
1584×396 banner (PNG/JPG). The public title is “AI researcher”; the old internal
“Editorial Research Atlas” label is absent from sharing artwork.

Previous favicon/header/sharing files and the original portrait family are
preserved in `backups/2026-10-28-before-fs-ligature/`, with a checksum manifest
and restoration notes. They are outside `public/` and are not regenerated.

## Portrait

`portrait-selected.png` is the exact user-selected generated portrait
`exec-53691fe7-b82e-4be7-a50d-0651ee9201e8.png`, finalized on 2026-10-27.
It is 1116×1410 pixels. No additional retouching or generative changes were
applied during installation.

SHA-256: `00BAE086354E28E7341E24072EA6DE436207FE3E2668768A663A72DB6C3ED876`.

`scripts/assets/generate-images.mjs` preserves this master and creates the
public JPEG plus 320/487/960px AVIF/WebP and 487/960px JPEG derivatives.
The desktop picture supports a 2× rendition while retaining its 487×617
intrinsic layout. The sharing image uses the same selected portrait.

The original photo remains recoverable in Git through commit `3402d99` and
in the tracked backup folder above. The other portrait previews are not
website source assets. This selected image is AI-retouched with the user's
explicit authorization; its dimensions must not be described as native UHD.
