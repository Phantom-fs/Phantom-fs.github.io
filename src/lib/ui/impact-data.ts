import type { NormalizedMetrics } from '../metrics/contract';

export interface ImpactPaper {
  id: string;
  title: string;
  year: number;
  citations: number;
}
export const buildImpactData = (
  publications: { id: string; title: string; year: number }[],
  snapshot: NormalizedMetrics
) => {
  const papers: ImpactPaper[] = publications
    .map((paper) => {
      const metric = snapshot.publications[paper.id];
      if (!metric)
        throw new Error(`Missing Scholar citation data: ${paper.id}`);
      return { ...paper, citations: metric.citationCount.value };
    })
    .sort(
      (a, b) => b.citations - a.citations || a.title.localeCompare(b.title)
    );
  const years = [...new Set(papers.map((paper) => paper.year))].sort(
    (a, b) => b - a
  );
  const byYear = years.map((year) => ({
    label: String(year),
    value: papers.filter((paper) => paper.year === year).length
  }));
  const citationsByYear = years.map((year) => ({
    label: String(year),
    value: papers
      .filter((paper) => paper.year === year)
      .reduce((total, paper) => total + paper.citations, 0)
  }));
  return {
    papers,
    byYear,
    citationsByYear,
    thresholds: [
      {
        label: '10 or more citations',
        value: papers.filter((paper) => paper.citations >= 10).length
      },
      {
        label: 'Fewer than 10 citations',
        value: papers.filter((paper) => paper.citations < 10).length
      }
    ]
  };
};
