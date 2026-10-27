# Identity assets before the selected FS ligature

These are byte-for-byte backups, kept outside `public/` so the obsolete marks
do not become crawlable alternate branding. `manifest.json` records SHA-256
hashes and original paths for every file.
The root `.gitattributes` disables line-ending conversion for this archive, so
SVG checksums also remain stable across Windows and Unix checkouts.

`public/` contains all eight favicon/touch files, the header mark, and the
sharing card as they stood immediately before the 2026-10-28 replacement.
The current selected portrait was already present in that sharing card.
The corresponding generator and layout are recoverable at Git `1be4e43`.

`portraits-before-selection/` additionally preserves the original portrait
family and sharing card from Git revision `3402d99`, before the selected
portrait replaced them. These entries identify that revision in the manifest.

To restore an older visual identity, copy the required files from this folder
to their recorded original paths. Also restore the corresponding asset
generator/source from Git, otherwise the next build will regenerate the newer
identity. Restore portrait and brand groups independently; do not copy the two
different sharing cards over one another blindly. No restore runs automatically.
