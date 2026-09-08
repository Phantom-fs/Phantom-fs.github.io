import { describe, expect, it } from 'vitest';
import { citationMeta } from '../../src/lib/publications/citation-meta';

describe('publication citation metadata', () => {
  it('emits discoverability metadata only for supplied journal fields', () => {
    expect(
      citationMeta({
        authors: [{ name: 'Farhan Sheth' }, { name: 'Example Coauthor' }],
        doi: '10.1145/3820497',
        title: 'A journal article',
        type: 'journal',
        venue: 'Example Journal',
        year: 2026
      })
    ).toEqual([
      { content: 'A journal article', name: 'citation_title' },
      { content: 'Farhan Sheth', name: 'citation_author' },
      { content: 'Example Coauthor', name: 'citation_author' },
      { content: '2026', name: 'citation_publication_date' },
      { content: 'Example Journal', name: 'citation_journal_title' },
      { content: '10.1145/3820497', name: 'citation_doi' }
    ]);
  });

  it('does not invent venue or DOI fields for preprints', () => {
    expect(
      citationMeta({
        authors: [{ name: 'Farhan Sheth' }],
        title: 'A preprint',
        type: 'preprint',
        venue: 'arXiv preprint',
        year: 2025
      })
    ).toEqual([
      { content: 'A preprint', name: 'citation_title' },
      { content: 'Farhan Sheth', name: 'citation_author' },
      { content: '2025', name: 'citation_publication_date' }
    ]);
  });
});
