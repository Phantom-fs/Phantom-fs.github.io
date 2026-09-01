import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { loadBuildMetrics } from '../../src/lib/metrics/loader';
import { parseNormalizedMetrics } from '../../src/lib/metrics/contract';

const scholarDocument = {
  schemaVersion: 1,
  generatedAt: '2026-08-30T08:00:00Z',
  stale: false,
  author: {
    totalCitations: {
      value: 56,
      source: 'scholar',
      sourceUrl: 'https://scholar.google.com/citations?user=ZeKCtQQAAAAJ',
      updatedAt: '2026-08-30T08:00:00Z',
      stale: false
    },
    hIndex: {
      value: 4,
      source: 'scholar',
      sourceUrl: 'https://scholar.google.com/citations?user=ZeKCtQQAAAAJ',
      updatedAt: '2026-08-30T08:00:00Z',
      stale: false
    },
    i10Index: {
      value: 3,
      source: 'scholar',
      sourceUrl: 'https://scholar.google.com/citations?user=ZeKCtQQAAAAJ',
      updatedAt: '2026-08-30T08:00:00Z',
      stale: false
    },
    publicationCount: {
      value: 1,
      source: 'scholar',
      sourceUrl: 'https://scholar.google.com/citations?user=ZeKCtQQAAAAJ',
      updatedAt: '2026-08-30T08:00:00Z',
      stale: false
    }
  },
  publications: {
    herald: {
      citationCount: {
        value: 12,
        source: 'scholar',
        sourceUrl: 'https://scholar.google.com/citations?user=ZeKCtQQAAAAJ',
        updatedAt: '2026-08-30T08:00:00Z',
        stale: false
      },
      sourceIdentifier: 'scholar-herald'
    }
  },
  diagnostics: []
} as const;

describe('Scholar-only build metrics', () => {
  it('requires i10-index and rejects non-Scholar metric sources', () => {
    expect(() =>
      parseNormalizedMetrics({
        ...scholarDocument,
        author: { ...scholarDocument.author, i10Index: undefined }
      })
    ).toThrow('schema version 1');
    expect(() =>
      parseNormalizedMetrics({
        ...scholarDocument,
        publications: {
          herald: {
            ...scholarDocument.publications.herald,
            citationCount: {
              ...scholarDocument.publications.herald.citationCount,
              source: 'openalex'
            }
          }
        }
      })
    ).toThrow('schema version 1');
  });

  it('does not load a snapshot when the generated Scholar artifact is invalid', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'metrics-loader-'));
    const generatedPath = join(directory, 'generated.json');
    await writeFile(generatedPath, JSON.stringify({ schemaVersion: 1 }));

    const noSnapshotPaths: Parameters<typeof loadBuildMetrics>[0] = {
      generatedPath,
      // @ts-expect-error Snapshot fallbacks are not an accepted loader path.
      snapshotPath: join(directory, 'snapshot.json')
    };
    void noSnapshotPaths;

    expect(() => loadBuildMetrics({ generatedPath })).toThrow(
      'Generated metrics artifact'
    );
  });

  it('does not start Astro when the deterministic Scholar refresh fails', () => {
    const result = spawnSync(process.execPath, ['scripts/dev.mjs', '--help'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        METRICS_FIXTURE: resolve('tests/fixtures/metrics/scholar-invalid.json')
      },
      encoding: 'utf8'
    });

    expect(result.status).toBe(2);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'Scholar data is unavailable or invalid'
    );
    expect(`${result.stdout}${result.stderr}`).not.toContain('astro dev');
  });
});
