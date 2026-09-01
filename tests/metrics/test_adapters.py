import multiprocessing
import os
import time

import pytest

from scripts.metrics import adapters
from scripts.metrics.adapters import RemoteFetchError, scholarly_lookup
from scripts.metrics.pipeline import normalize_scholar


def hanging_spawn_worker(queue: object, attempts: object) -> None:
    """Deliberately never returns so the parent must reap this spawned child."""
    assert hasattr(attempts, 'get_lock')
    with attempts.get_lock():
        attempts.value += 1
    assert hasattr(queue, 'put')
    queue.put(('started', os.getpid()))
    while True:
        time.sleep(0.01)


def test_spawn_bounded_call_reaps_hanging_scholar_workers() -> None:
    """Catches a Scholar timeout path that leaks spawned workers or retries forever."""
    context = multiprocessing.get_context('spawn')
    attempts = context.Value('i', 0)
    started_at = time.monotonic()

    with pytest.raises(RemoteFetchError, match='remote source unavailable'):
        adapters.spawn_bounded_call(
            hanging_spawn_worker,
            (attempts,),
            attempts=2,
            timeout_seconds=0.5,
        )

    assert attempts.value == 2
    assert time.monotonic() - started_at < 5
    assert not any(process.is_alive() for process in multiprocessing.active_children())


def test_scholar_lookup_requests_i10_index_before_normalization(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Catches a bounded Scholar refresh that omits the i10-index source field."""
    from scholarly import scholarly

    record = {'scholar_id': 'ZeKCtQQAAAAJ'}
    filled = {
        'scholar_id': 'ZeKCtQQAAAAJ',
        'name': 'Farhan Sheth',
        'citedby': 56,
        'hindex': 4,
        'i10index': 3,
        'publications': [],
    }

    monkeypatch.setattr(scholarly, 'search_author_id', lambda author_id: record)
    monkeypatch.setattr(scholarly, 'fill', lambda author, *, sections: filled)

    author = scholarly_lookup()
    document = normalize_scholar(author, [], '2026-08-30T08:00:00Z')

    assert document['author']['i10Index']['value'] == 3
