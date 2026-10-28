import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadValidatedContent } from '../../src/lib/content/query';
import { loadBuildMetrics } from '../../src/lib/metrics/loader';
import { buildImpactData } from '../../src/lib/ui/impact-data';

describe('impact explorer data', () => {
  it('reconciles all chart views with the saved Scholar author metrics', async () => {
    const content = await loadValidatedContent(resolve('src/content'));
    const snapshot = loadBuildMetrics();
    const data = buildImpactData(
      content.publications.map(({ data }) => data),
      snapshot
    );
    expect(data.papers).toHaveLength(snapshot.author.publicationCount.value);
    expect(data.papers.reduce((sum, paper) => sum + paper.citations, 0)).toBe(
      snapshot.author.totalCitations.value
    );
    expect(
      data.papers.filter((paper, index) => paper.citations >= index + 1)
    ).toHaveLength(snapshot.author.hIndex.value);
    expect(data.thresholds[0].value).toBe(snapshot.author.i10Index.value);
    expect(data.thresholds.reduce((sum, row) => sum + row.value, 0)).toBe(
      data.papers.length
    );
    expect(data.byYear.reduce((sum, row) => sum + row.value, 0)).toBe(
      data.papers.length
    );
    expect(data.byYear.map(({ label }) => label)).toEqual([
      '2026',
      '2025',
      '2024'
    ]);
    expect(data.citationsByYear.map(({ label }) => label)).toEqual([
      '2026',
      '2025',
      '2024'
    ]);
    expect(data.citationsByYear.reduce((sum, row) => sum + row.value, 0)).toBe(
      snapshot.author.totalCitations.value
    );
  });

  it('rejects incomplete paper coverage instead of silently substituting zero citations', () => {
    expect(() =>
      buildImpactData(
        [{ id: 'missing', title: 'Missing', year: 2026 }],
        loadBuildMetrics()
      )
    ).toThrow('Missing Scholar citation data: missing');
  });
});
