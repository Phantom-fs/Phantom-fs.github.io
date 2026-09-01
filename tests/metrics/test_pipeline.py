import json
from pathlib import Path

import pytest

from scripts.metrics.pipeline import (
    MetricsUnavailableError,
    build_metrics,
    publication_identifiers,
)


PROJECT_ROOT = Path(__file__).parents[2]
FIXTURES_ROOT = PROJECT_ROOT / 'tests' / 'fixtures' / 'metrics'
GENERATED_AT = '2026-08-30T08:00:00Z'


def load_fixture(name: str) -> dict[str, object]:
    return json.loads((FIXTURES_ROOT / name).read_text(encoding='utf-8'))


def test_complete_scholar_metrics_include_i10_and_scholar_only_provenance() -> None:
    """Catches generated public metrics that omit i10-index or mix providers."""
    fixture = load_fixture('scholar-complete.json')

    document = build_metrics(
        fixture=fixture,
        publications=publication_identifiers(fixture['publications']),
        mode='dev',
        generated_at=GENERATED_AT,
    )

    assert document['author']['i10Index']['value'] == 3
    assert document['author']['publicationCount']['value'] == 1
    assert all(
        metric['source'] == 'scholar'
        for metric in [
            *document['author'].values(),
            *(entry['citationCount'] for entry in document['publications'].values()),
        ]
    )


@pytest.mark.parametrize('mode', ['scholar', 'push', 'schedule', 'dev'])
def test_invalid_scholar_data_fails_every_build_mode(mode: str) -> None:
    """Catches a build mode publishing stale snapshots after Scholar validation fails."""
    fixture = load_fixture('scholar-invalid.json')

    with pytest.raises(MetricsUnavailableError, match='Scholar data is unavailable or invalid'):
        build_metrics(
            fixture=fixture,
            publications=publication_identifiers(fixture['publications']),
            mode=mode,
            generated_at=GENERATED_AT,
        )


def test_unknown_scholar_publication_fails_without_a_secondary_match() -> None:
    """Catches an unrecorded Scholar ID becoming an ambiguous public paper metric."""
    fixture = load_fixture('scholar-complete.json')
    fixture['scholar']['author']['publications'][0]['author_pub_id'] = 'unknown'

    with pytest.raises(MetricsUnavailableError, match='Scholar data is unavailable or invalid'):
        build_metrics(
            fixture=fixture,
            publications=publication_identifiers(fixture['publications']),
            mode='scholar',
            generated_at=GENERATED_AT,
        )


@pytest.mark.parametrize('mode', ['scholar', 'push', 'schedule', 'dev'])
def test_incomplete_scholar_publications_fail_every_build_mode(mode: str) -> None:
    """Catches a partial Scholar response overwriting the complete catalog evidence."""
    fixture = load_fixture('scholar-complete.json')
    fixture['publications'].append(
        {
            'id': 'signal',
            'title': 'SIGNAL',
            'scholarPublicationId': 'scholar-signal',
        }
    )

    with pytest.raises(MetricsUnavailableError, match='Scholar data is unavailable or invalid'):
        build_metrics(
            fixture=fixture,
            publications=publication_identifiers(fixture['publications']),
            mode=mode,
            generated_at=GENERATED_AT,
        )
