# Publication figures

These are faithful figure crops rendered from the user's supplied papers in
the parent workspace's `Paper` directory. No scientific illustration was
generated, redrawn, recolored or inverted for dark mode. Each PNG is the
reviewed source; `manifest.json` records its paper filename and SHA256, physical
PDF page (one-based), normalized crop, rendering scale, dimensions, figure
label, descriptive alternative text and selection rationale.

`scripts/assets/extract-publication-figures.py --papers <folder>` reproduces the
crops with Python, pypdfium2 and Pillow. A changed source hash stops extraction
so a newer paper cannot silently inherit old coordinates. `pnpm assets:build`
creates 320/640px WebP thumbnails and a lossless full-resolution WebP for each
manifest entry. Normal website builds regenerate these derivatives from the
checked-in PNGs and do not require the source PDFs or a Python PDF renderer.

## Adding a future paper

1. Inspect the PDF and choose its most explanatory methodology/overview
   figure. Preserve all diagram labels, arrows and subpanels. Record the
   original figure label and physical page; do not invent a framework when
   the paper has none. The earlier discrete phishing paper uses its
   feature-importance chart because it contains no architecture figure.
2. Save an appropriately cropped high-resolution PNG named `<paper-id>.png`
   here and add the extraction/provenance entry to `manifest.json`. Include
   the caption/selection rationale and an informative, non-promotional alt.
3. Add a `figure` object to the paper's Markdown frontmatter containing `src`
   (`/images/publications/<paper-id>.webp`), `width`, `height`, `alt`, `caption`,
   `label`, and `page`. The schema validates these fields. The metadata
   automatically creates the thumbnail, responsive sources and dialog; no
   component changes are needed. A future record without a figure keeps the
   existing text layout until its source illustration is available.
4. Run `pnpm assets:build`, `pnpm verify` in `METRICS_MODE=push`, then the
   publication-figure browser tests. Inspect full-size crops and mobile/dark
   presentation. Keep figures white-backed and use `object-fit: contain` so
   the original aspect ratio and colors remain intact.

The compact enlarged view shows a centered caption and supports X, Escape,
backdrop dismissal and focus restoration. An enlarge icon in the image's
top-left corner opens the original in a new tab. Thumbnail links also serve no-JavaScript use;
the zoom icon appears on hover/focus, with a subtle persistent cue for touch.
Thumbnails load lazily; opening the dialog fetches only that paper's
full-resolution view. Figure/page provenance remains in the source metadata
without appearing as additional labels in the viewer.
Displayed captions omit trailing periods; the stored source captions remain
unchanged. The enlarge icon matches the close control with a faint border,
transparent background and legible graphite glyph. Hover/focus adds subtle
feedback. Both have accessible labels and reserve space above the diagram.

Publication frontmatter and manifest `caption` fields contain short, contextual
display captions. The manifest retains the preceding figure wording separately
as `sourceCaption`; display captions are editorial paraphrases, not quotations.
