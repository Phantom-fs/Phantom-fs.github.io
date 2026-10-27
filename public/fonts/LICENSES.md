# Bundled font licenses

- `newsreader-latin.woff2` is Newsreader, licensed under the SIL Open Font License 1.1. See `OFL-Newsreader.txt`.
- `manrope-latin.woff2` is Manrope, licensed under the SIL Open Font License 1.1. See `OFL-Manrope.txt`.
- `ibm-plex-mono-latin-400.woff2` and `ibm-plex-mono-latin-500.woff2` are IBM Plex Mono, licensed under the SIL Open Font License 1.1. See `OFL-IBM-Plex.txt`.

The source WOFF2 subsets were retrieved from Google Fonts CSS endpoints on 2026-08-26 and are hosted locally; no runtime font requests are made. The production Manrope file retains its variable weight axis and only the site's used glyphs. These original production subsets were generated with FontTools 4.53.1 and Brotli 1.1.0.

On 2026-10-27, Newsreader was refreshed through the official Google Fonts CSS endpoint (`family=Newsreader:opsz,wght@48,400..700`) to support real bold venue labels in News. The local subset preserves all 104 existing Unicode codepoints and OpenType features, fixes optical size at 48 and retains weights 400–700. It remains self-hosted under the same SIL Open Font License and below the existing 25KB asset budget. About section headings use weight 550.
