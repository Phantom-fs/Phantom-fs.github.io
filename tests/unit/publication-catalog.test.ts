import { describe, expect, it } from 'vitest';
import { toCatalogPublication } from '../../src/lib/publications/catalog';

describe('catalog publication projection', () => {
  it('exposes only the fields rendered by the server-side catalog', () => {
    const rawPublication = {
      artifactAvailable: true,
      authors: [{ equalContribution: true, name: 'Farhan Sheth' }],
      detailPage: true,
      displayOrder: 1,
      hashtags: ['clinical-ai'],
      id: 'uc-prun',
      links: { paper: 'https://example.com/paper' },
      openAccess: false,
      primaryCategory: 'Healthcare & Clinical AI',
      rank: {
        evidenceUrl: 'https://example.com/rank',
        evidenceYear: 2026,
        system: 'CORE',
        value: 'A'
      },
      slug: 'uc-prun',
      status: 'published',
      title: 'Uc-PrUn',
      tldr: 'Calibrated unlearning.',
      type: 'journal',
      venue: 'ACM TCH',
      year: 2026
    };

    expect(
      toCatalogPublication({ body: 'Full abstract.', data: rawPublication })
    ).toEqual({
      abstract: 'Full abstract.',
      authors: [{ equalContribution: true, name: 'Farhan Sheth' }],
      detailPage: true,
      displayOrder: 1,
      hashtags: ['clinical-ai'],
      id: 'uc-prun',
      links: { paper: 'https://example.com/paper' },
      primaryCategory: 'Healthcare & Clinical AI',
      rank: {
        evidenceUrl: 'https://example.com/rank',
        evidenceYear: 2026,
        system: 'CORE',
        value: 'A'
      },
      slug: 'uc-prun',
      status: 'published',
      title: 'Uc-PrUn',
      tldr: 'Calibrated unlearning.',
      venue: 'ACM TCH',
      year: 2026
    });
  });
});
