"""Normalize citation adapters into the public static metrics contract."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any


SCHEMA_VERSION = 1
SCHOLAR_AUTHOR_ID = 'ZeKCtQQAAAAJ'
SCHOLAR_AUTHOR_URL = 'https://scholar.google.com/citations?user=ZeKCtQQAAAAJ'


class MetricsError(ValueError):
    """Raised when upstream data cannot safely satisfy the metrics contract."""


class MetricsUnavailableError(RuntimeError):
    """Raised when a scheduled metrics refresh cannot safely publish."""


def _nonnegative_integer(value: object, field: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise MetricsError(f'{field} must be a nonnegative integer')
    return value


def _identity_matches(value: object) -> bool:
    return isinstance(value, str) and ' '.join(value.lower().split()) == 'farhan sheth'


def _metric(value: int, source: str, source_url: str, updated_at: str) -> dict[str, Any]:
    return {
        'value': value,
        'source': source,
        'sourceUrl': source_url,
        'updatedAt': updated_at,
        'stale': False,
    }


def _as_iso_timestamp(value: object, field: str) -> str:
    if not isinstance(value, str) or not value or 'T' not in value:
        raise MetricsError(f'{field} must be an ISO timestamp')
    timestamp = value if value.endswith('Z') else f'{value}Z'
    try:
        datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    except ValueError as error:
        raise MetricsError(f'{field} must be an ISO timestamp') from error
    return timestamp


@dataclass(frozen=True)
class PublicationIdentifier:
    id: str
    title: str
    scholar_publication_id: str | None


def publication_identifiers(records: list[dict[str, object]]) -> list[PublicationIdentifier]:
    return [
        PublicationIdentifier(
            id=str(record['id']),
            title=str(record['title']),
            scholar_publication_id=(
                str(record['scholarPublicationId'])
                if record.get('scholarPublicationId') is not None
                else None
            ),
        )
        for record in records
    ]


def normalize_scholar(
    author: dict[str, object],
    publications: list[PublicationIdentifier],
    generated_at: str,
) -> dict[str, Any]:
    if author.get('scholar_author_id') != SCHOLAR_AUTHOR_ID:
        raise MetricsError('Scholar author ID does not match the recorded identity')
    if not _identity_matches(author.get('name')):
        raise MetricsError('Scholar author identity does not match Farhan Sheth')

    source = 'scholar'
    citation_count = _nonnegative_integer(author.get('citedby'), 'Scholar total citations')
    h_index = _nonnegative_integer(author.get('hindex'), 'Scholar h-index')
    i10_index = _nonnegative_integer(author.get('i10index'), 'Scholar i10-index')
    raw_publications = author.get('publications')
    if not isinstance(raw_publications, list):
        raise MetricsError('Scholar publications must be a list')

    known_by_scholar_id = {
        publication.scholar_publication_id: publication
        for publication in publications
        if publication.scholar_publication_id is not None
    }
    if len(known_by_scholar_id) != sum(
        publication.scholar_publication_id is not None for publication in publications
    ):
        raise MetricsError('Scholar publication identifiers must be unique')

    publication_metrics: dict[str, dict[str, Any]] = {}
    observed_scholar_ids: set[str] = set()
    for raw_publication in raw_publications:
        if not isinstance(raw_publication, dict):
            raise MetricsError('Scholar publication entry must be an object')
        scholar_id = raw_publication.get('author_pub_id')
        if not isinstance(scholar_id, str) or scholar_id not in known_by_scholar_id:
            raise MetricsError('Scholar publication ID is unknown')
        if scholar_id in observed_scholar_ids:
            raise MetricsError('Scholar publication IDs must not be duplicated')
        observed_scholar_ids.add(scholar_id)
        publication = known_by_scholar_id[scholar_id]
        publication_metrics[publication.id] = {
            'citationCount': _metric(
                _nonnegative_integer(
                    raw_publication.get('num_citations'), 'Scholar publication citations'
                ),
                source,
                SCHOLAR_AUTHOR_URL,
                generated_at,
            ),
            'sourceIdentifier': scholar_id,
        }

    if observed_scholar_ids != set(known_by_scholar_id):
        raise MetricsError('Scholar publication set is incomplete')

    return {
        'schemaVersion': SCHEMA_VERSION,
        'generatedAt': generated_at,
        'stale': False,
        'author': {
            'totalCitations': _metric(citation_count, source, SCHOLAR_AUTHOR_URL, generated_at),
            'hIndex': _metric(h_index, source, SCHOLAR_AUTHOR_URL, generated_at),
            'i10Index': _metric(i10_index, source, SCHOLAR_AUTHOR_URL, generated_at),
            'publicationCount': _metric(
                len(raw_publications), source, SCHOLAR_AUTHOR_URL, generated_at
            ),
        },
        'publications': publication_metrics,
        'diagnostics': [],
    }


def _validate_metric(metric: object, field: str) -> None:
    if not isinstance(metric, dict):
        raise MetricsError(f'{field} must be an object')
    _nonnegative_integer(metric.get('value'), f'{field}.value')
    if metric.get('source') != 'scholar':
        raise MetricsError(f'{field}.source must be scholar')
    for key in ('source', 'sourceUrl', 'updatedAt'):
        if not isinstance(metric.get(key), str) or not metric[key]:
            raise MetricsError(f'{field}.{key} is required')
    if not isinstance(metric.get('stale'), bool):
        raise MetricsError(f'{field}.stale must be a boolean')


def validate_document(document: object) -> dict[str, Any]:
    if not isinstance(document, dict):
        raise MetricsError('metrics document must be an object')
    if document.get('schemaVersion') != SCHEMA_VERSION:
        raise MetricsError(f'schemaVersion must be {SCHEMA_VERSION}')
    _as_iso_timestamp(document.get('generatedAt'), 'generatedAt')
    if not isinstance(document.get('stale'), bool):
        raise MetricsError('top-level stale must be a boolean')
    author = document.get('author')
    if not isinstance(author, dict):
        raise MetricsError('author must be an object')
    for name in ('totalCitations', 'hIndex', 'i10Index', 'publicationCount'):
        _validate_metric(author.get(name), f'author.{name}')
    publications = document.get('publications')
    if not isinstance(publications, dict):
        raise MetricsError('publications must be an object')
    for publication_id, publication in publications.items():
        if not isinstance(publication_id, str) or not isinstance(publication, dict):
            raise MetricsError('publication metrics must be keyed objects')
        _validate_metric(publication.get('citationCount'), f'publications.{publication_id}')
        if not isinstance(publication.get('sourceIdentifier'), str):
            raise MetricsError(f'publications.{publication_id}.sourceIdentifier is required')
    diagnostics = document.get('diagnostics')
    if not isinstance(diagnostics, list):
        raise MetricsError('diagnostics must be a list')
    for diagnostic in diagnostics:
        if (
            not isinstance(diagnostic, dict)
            or not isinstance(diagnostic.get('code'), str)
            or not isinstance(diagnostic.get('source'), str)
        ):
            raise MetricsError('diagnostics must contain safe code/source objects')
    return document


def build_metrics(
    fixture: dict[str, object],
    publications: list[PublicationIdentifier],
    mode: str,
    generated_at: str,
) -> dict[str, Any]:
    if mode not in {'scholar', 'push', 'schedule', 'dev'}:
        raise MetricsError('metrics mode is invalid')
    scholar = fixture.get('scholar')
    if not isinstance(scholar, dict) or not isinstance(scholar.get('author'), dict):
        raise MetricsUnavailableError('Scholar data is unavailable or invalid')
    try:
        return validate_document(normalize_scholar(scholar['author'], publications, generated_at))
    except MetricsError as error:
        raise MetricsUnavailableError('Scholar data is unavailable or invalid') from error
