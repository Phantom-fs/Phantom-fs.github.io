"""Re-extract approved PDF figure crops using the checked-in provenance manifest.

Requires pypdfium2 and Pillow. Run with the bundled Python runtime or an
environment containing those packages; never needs a host package install.
"""

import argparse
import hashlib
import json
from pathlib import Path

import pypdfium2 as pdfium


def main():
    root = Path(__file__).resolve().parents[2]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--papers", type=Path, default=root.parent / "Paper")
    args = parser.parse_args()
    destination = root / "src/assets/publication-figures"
    manifest = json.loads((destination / "manifest.json").read_text(encoding="utf-8"))
    for entry in manifest:
        source = args.papers / entry["sourceFile"]
        if hashlib.sha256(source.read_bytes()).hexdigest() != entry["sourceSha256"]:
            raise ValueError(f"Source PDF changed: {source.name}; re-review its crop first")
        document = pdfium.PdfDocument(source)
        try:
            page = document[entry["page"] - 1]
            image = page.render(scale=entry["renderScale"]).to_pil().convert("RGB")
            crop = tuple(
                round(value * (image.width if index % 2 == 0 else image.height))
                for index, value in enumerate(entry["cropNormalized"])
            )
            image.crop(crop).save(destination / f"{entry['id']}.png", optimize=True)
        finally:
            document.close()
    print(f"Extracted {len(manifest)} approved figures. Run pnpm assets:build next.")


if __name__ == "__main__":
    main()
