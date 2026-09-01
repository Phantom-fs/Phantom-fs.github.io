from pathlib import Path
import sys


def test_deterministic_content_fixture_is_available() -> None:
    fixture = Path(__file__).parents[1] / 'fixtures' / 'content' / 'valid' / 'publications' / 'atlas-study.md'
    assert fixture.is_file()


def test_python_test_environment_matches_the_project_contract() -> None:
    assert sys.version_info[:2] == (3, 13)


def test_requirements_lock_contains_hashes_for_every_requirement() -> None:
    lockfile = Path(__file__).parents[2] / 'requirements.lock'
    requirements = [line for line in lockfile.read_text(encoding='utf-8').splitlines() if '==' in line]
    assert requirements
    assert all('--hash=sha256:' in requirement or requirement.endswith(' \\') for requirement in requirements)
