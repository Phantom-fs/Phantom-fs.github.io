"""Command-line entry point for deterministic metrics generation."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .pipeline import build_metrics, publication_identifiers


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--fixture', type=Path, required=True)
    parser.add_argument('--mode', choices=('scholar', 'push', 'schedule', 'dev'), required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--generated-at', required=True)
    arguments = parser.parse_args()

    fixture = json.loads(arguments.fixture.read_text(encoding='utf-8'))
    document = build_metrics(
        fixture=fixture,
        publications=publication_identifiers(fixture['publications']),
        mode=arguments.mode,
        generated_at=arguments.generated_at,
    )
    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    arguments.output.write_text(
        json.dumps(document, indent=2, sort_keys=True) + '\n', encoding='utf-8'
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
