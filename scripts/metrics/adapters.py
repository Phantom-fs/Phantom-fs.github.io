"""Bounded remote adapters; callers receive normalized-safe dictionaries only."""

from __future__ import annotations

import multiprocessing
import random
import time
from queue import Empty
from typing import Any, Callable

from .pipeline import SCHOLAR_AUTHOR_ID


class RemoteFetchError(RuntimeError):
    """A remote source did not return a usable response within policy bounds."""


SpawnWorker = Callable[..., None]


def _validate_policy(attempts: int, timeout_seconds: float) -> None:
    if attempts < 1:
        raise ValueError('attempts must be positive')
    if timeout_seconds <= 0:
        raise ValueError('timeout_seconds must be positive')


def _reap_worker(process: Any, timeout_seconds: float) -> None:
    """Terminate, then kill, a child using bounded joins only."""
    if not process.is_alive():
        return
    process.terminate()
    process.join(timeout_seconds)
    if process.is_alive():
        process.kill()
        process.join(timeout_seconds)
    if process.is_alive():
        raise RemoteFetchError('remote source worker did not stop')


def spawn_bounded_call(
    worker: SpawnWorker,
    worker_args: tuple[object, ...],
    *,
    attempts: int = 3,
    timeout_seconds: float = 17,
) -> dict[str, object]:
    """Run a module-level worker under a bounded, reaped spawn-process policy."""
    _validate_policy(attempts, timeout_seconds)
    context = multiprocessing.get_context('spawn')
    failure: Exception | None = None
    for attempt_num in range(attempts):
        # Add randomized backoff between attempts (skip for first attempt)
        if attempt_num > 0:
            backoff_seconds = random.uniform(0.1, 0.5)
            time.sleep(backoff_seconds)
        
        queue = context.Queue()
        process = context.Process(target=worker, args=(queue, *worker_args))
        try:
            process.start()
            process.join(timeout_seconds)
            if process.is_alive():
                _reap_worker(process, timeout_seconds)
                failure = RemoteFetchError('remote source unavailable')
                continue
            try:
                status, payload = queue.get(timeout=timeout_seconds)
            except Empty:
                failure = RemoteFetchError('remote source unavailable')
                continue
            if status == 'ok' and isinstance(payload, dict):
                return payload
            failure = RemoteFetchError('remote source unavailable')
        except Exception:  # Never expose process/bootstrap details to build diagnostics.
            failure = RemoteFetchError('remote source unavailable')
        finally:
            cleanup_failure: RemoteFetchError | None = None
            try:
                _reap_worker(process, timeout_seconds)
            except RemoteFetchError as error:
                cleanup_failure = error
            finally:
                queue.close()
                queue.join_thread()
                try:
                    process.close()
                except ValueError:
                    if cleanup_failure is None:
                        cleanup_failure = RemoteFetchError('remote source worker did not stop')
            if cleanup_failure is not None:
                raise cleanup_failure
    raise RemoteFetchError('remote source unavailable') from failure


def scholarly_lookup(author_id: str = SCHOLAR_AUTHOR_ID) -> dict[str, object]:
    """Request the complete bounded Scholar author record before normalization."""
    from scholarly import scholarly
    from scholarly import ProxyGenerator

    # Setup user-agent with fallback
    user_agent = None
    try:
        from fake_useragent import UserAgent
        ua = UserAgent()
        user_agent = ua.random
    except Exception:
        # If fake_useragent fails, skip it gracefully
        pass

    # Setup proxy with fallback
    pg = None
    try:
        pg = ProxyGenerator()
        pg.FreeProxies()
    except Exception:
        # If proxy setup fails, skip it gracefully
        pg = None

    # Apply user-agent if available
    if user_agent is not None:
        scholarly.headers = {'User-Agent': user_agent}

    # Apply proxy if available
    if pg is not None:
        scholarly.use_proxy(pg)

    author = scholarly.fill(
        scholarly.search_author_id(author_id),
        sections=['basics', 'indices', 'counts', 'publications'],
    )
    if not isinstance(author, dict):
        raise RemoteFetchError('Scholar author response is not an object')
    if 'scholar_author_id' not in author and isinstance(author.get('scholar_id'), str):
        author = {**author, 'scholar_author_id': author['scholar_id']}
    return author


def _scholar_worker(queue: Any, author_id: str) -> None:
    try:
        queue.put(('ok', scholarly_lookup(author_id)))
    except Exception:
        queue.put(('error', 'unavailable'))


def bounded_scholar_lookup(attempts: int = 3, timeout_seconds: float = 17) -> dict[str, object]:
    return spawn_bounded_call(
        _scholar_worker,
        (SCHOLAR_AUTHOR_ID,),
        attempts=attempts,
        timeout_seconds=timeout_seconds,
    )


def fetch_scholar_author() -> dict[str, object]:
    """Fetch Scholar only through the process-isolated production boundary."""
    return bounded_scholar_lookup()
