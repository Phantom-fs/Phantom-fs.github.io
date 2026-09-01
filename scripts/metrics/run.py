"""Build-time runner that never exposes citation data to the browser API layer."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from .adapters import RemoteFetchError, fetch_scholar_author
from .pipeline import MetricsError, MetricsUnavailableError, build_metrics, publication_identifiers


def _remote_fixture(publications: list[dict[str, object]]) -> dict[str, object]:
    try:
        scholar: dict[str, object] = {'author': fetch_scholar_author()}
    except RemoteFetchError:
        scholar = {'error': 'unavailable'}
    return {'scholar': scholar, 'publications': publications}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=('scholar', 'push', 'schedule', 'dev'), required=True)
    parser.add_argument('--identifiers', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--generated-at', required=True)
    arguments = parser.parse_args()
    records = json.loads(arguments.identifiers.read_text(encoding='utf-8'))
    if not isinstance(records, list):
        raise MetricsError('publication identifiers must be a JSON array')
    fixture = (
        json.loads(Path(os.environ['METRICS_FIXTURE']).read_text(encoding='utf-8'))
        if os.environ.get('METRICS_FIXTURE')
        else _remote_fixture(records)
    )
    try:
        document = build_metrics(
            fixture=fixture,
            publications=publication_identifiers(records),
            mode=arguments.mode,
            generated_at=arguments.generated_at,
        )
    except MetricsUnavailableError as error:
        print(error, file=sys.stderr)
        return 2
    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    arguments.output.write_text(json.dumps(document, indent=2) + '\n', encoding='utf-8')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
