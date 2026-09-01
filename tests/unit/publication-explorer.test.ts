import { describe, expect, it } from 'vitest';
import {
  filterPublications,
  parseExplorerState,
  serializeExplorerState,
  type ExplorerPublication
} from '../../src/lib/publications/explorer';

const publications: ExplorerPublication[] = [
  {
    abstract: 'A clinical vision language model for glaucoma decisions.',
    authors: ['Farhan Sheth', 'Ari Example'],
    category: 'Healthcare & Clinical AI',
    citationCount: 4,
    detailPage: true,
    hashtags: ['clinical-ai', 'vision-language-models'],
    id: 'uc-prun',
    rank: null,
    title: 'Uc-PrUn',
    tldr: 'Calibrated unlearning for clinical models.',
    venue: 'ACM Transactions on Computing for Healthcare',
    year: 2026
  },
  {
    abstract: 'Cross-lingual attribution evaluates synthetic speech.',
    authors: ['Farhan Sheth'],
    category: 'Speech, Audio & Synthetic Media',
    citationCount: null,
    detailPage: true,
    hashtags: ['synthetic-speech', 'clinical-ai'],
    id: 'signal',
    rank: { system: 'CORE', value: 'A' },
    title: 'SIGNAL',
    tldr: 'Synthetic-speech attribution across languages.',
    venue: 'EACL',
    year: 2026
  },
  {
    abstract: 'Soil analysis uses visual representations.',
    authors: ['Priya Mathur'],
    category: 'Earth & Agricultural Intelligence',
    citationCount: 12,
    detailPage: true,
    hashtags: ['soil-classification'],
    id: 'soil-classification',
    rank: null,
    title: 'Soil classification',
    tldr: 'Soil classification and crop guidance.',
    venue: 'Engineering Applications of Artificial Intelligence',
    year: 2025
  }
];

describe('publication explorer state', () => {
  it('restores and serializes only the public explorer state', () => {
    const state = parseExplorerState(
      new URLSearchParams(
        'q=clinical&category=Healthcare+%26+Clinical+AI&year=2026&type=journal&status=published&rank=CORE%3AA&artifacts=true&openAccess=false&sort=citations'
      )
    );

    expect(state).toEqual({
      category: ['Healthcare & Clinical AI'],
      q: 'clinical',
      rank: ['CORE:A'],
      sort: 'citations',
      year: [2026]
    });
    expect(serializeExplorerState(state).toString()).toBe(
      'q=clinical&category=Healthcare+%26+Clinical+AI&year=2026&rank=CORE%3AA&sort=citations'
    );
  });

  it('converts a research-domain deep link into its approved category filter', () => {
    const state = parseExplorerState(
      new URLSearchParams('research=healthcare-clinical-ai')
    );

    expect(state.category).toEqual(['Healthcare & Clinical AI']);
  });

  it('searches publication text and lets hashtags cross categories without duplicates', () => {
    const state = parseExplorerState(new URLSearchParams('q=clinical-ai'));

    expect(filterPublications(publications, state).map(({ id }) => id)).toEqual(
      ['signal', 'uc-prun']
    );
  });

  it('keeps absent citation values last when sorting by citations', () => {
    const state = parseExplorerState(new URLSearchParams('sort=citations'));

    expect(filterPublications(publications, state).map(({ id }) => id)).toEqual(
      ['soil-classification', 'uc-prun', 'signal']
    );
  });

  it('matches a selected synthetic rank and excludes an unmatched rank', () => {
    const ranked = filterPublications(publications, {
      ...parseExplorerState(new URLSearchParams()),
      rank: ['CORE:A']
    });
    const unmatched = filterPublications(publications, {
      ...parseExplorerState(new URLSearchParams()),
      rank: ['CORE:B']
    });

    expect(ranked.map(({ id }) => id)).toEqual(['signal']);
    expect(unmatched).toEqual([]);
  });

  it('keeps search, category, year, rank, and every sort deterministic', () => {
    const state = parseExplorerState(
      new URLSearchParams(
        'q=clinical-ai&category=Healthcare+%26+Clinical+AI&year=2026'
      )
    );

    expect(filterPublications(publications, state).map(({ id }) => id)).toEqual(
      ['uc-prun']
    );
    expect(
      filterPublications(publications, { ...state, sort: 'newest' }).map(
        ({ id }) => id
      )
    ).toEqual(['uc-prun']);
    expect(
      filterPublications(publications, { ...state, sort: 'oldest' }).map(
        ({ id }) => id
      )
    ).toEqual(['uc-prun']);
    expect(
      filterPublications(publications, { ...state, sort: 'citations' }).map(
        ({ id }) => id
      )
    ).toEqual(['uc-prun']);
    expect(
      filterPublications(publications, { ...state, sort: 'title' }).map(
        ({ id }) => id
      )
    ).toEqual(['uc-prun']);
  });
});
