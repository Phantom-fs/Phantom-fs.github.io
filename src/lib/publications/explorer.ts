export type ExplorerSort = 'newest' | 'oldest' | 'citations' | 'title';

export interface ExplorerState {
  category: string[];
  q: string;
  rank: string[];
  sort: ExplorerSort;
  year: number[];
}

export interface ExplorerPublication {
  abstract: string;
  authors: string[];
  category: string;
  citationCount: number | null;
  detailPage: boolean;
  hashtags: string[];
  id: string;
  rank: { system: string; value: string } | null;
  title: string;
  tldr: string;
  venue: string;
  year: number;
}

const validSorts = new Set<ExplorerSort>([
  'newest',
  'oldest',
  'citations',
  'title'
]);

const researchCategoryBySlug: Record<string, string> = {
  'earth-agricultural-intelligence': 'Earth & Agricultural Intelligence',
  'healthcare-clinical-ai': 'Healthcare & Clinical AI',
  'multimodal-human-centered-ai': 'Multimodal & Human-Centered AI',
  'privacy-trust-safety': 'Privacy, Trust & Safety',
  'scientific-applied-ai': 'Scientific & Applied AI',
  'speech-audio-synthetic-media': 'Speech, Audio & Synthetic Media'
};

const valueList = (params: URLSearchParams, key: string) => [
  ...new Set(
    params
      .getAll(key)
      .map((value) => value.trim())
      .filter(Boolean)
  )
];

export const defaultExplorerState = (): ExplorerState => ({
  category: [],
  q: '',
  rank: [],
  sort: 'newest',
  year: []
});

export const parseExplorerState = (params: URLSearchParams): ExplorerState => {
  const sort = params.get('sort');
  const researchCategories = valueList(params, 'research').flatMap((slug) =>
    researchCategoryBySlug[slug] ? [researchCategoryBySlug[slug]] : []
  );
  return {
    category: [
      ...new Set([...valueList(params, 'category'), ...researchCategories])
    ],
    q: (params.get('q') ?? '').trim(),
    rank: valueList(params, 'rank'),
    sort: validSorts.has(sort as ExplorerSort)
      ? (sort as ExplorerSort)
      : 'newest',
    year: valueList(params, 'year').flatMap((value) => {
      const year = Number(value);
      return Number.isInteger(year) ? [year] : [];
    })
  };
};

export const serializeExplorerState = (
  state: ExplorerState
): URLSearchParams => {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  for (const category of state.category) params.append('category', category);
  for (const year of state.year) params.append('year', String(year));
  for (const rank of state.rank) params.append('rank', rank);
  if (state.sort !== 'newest') params.set('sort', state.sort);
  return params;
};

const includesAll = (values: string[], selected: string[]) =>
  selected.length === 0 || selected.some((value) => values.includes(value));

const searchableText = (publication: ExplorerPublication) =>
  [
    publication.title,
    ...publication.authors,
    publication.venue,
    String(publication.year),
    publication.tldr,
    publication.abstract,
    publication.category,
    ...publication.hashtags
  ]
    .join(' ')
    .toLocaleLowerCase();

const rankKey = (publication: ExplorerPublication) =>
  publication.rank
    ? `${publication.rank.system}:${publication.rank.value}`
    : null;

const compareTitles = (left: ExplorerPublication, right: ExplorerPublication) =>
  left.title.localeCompare(right.title, 'en', { sensitivity: 'base' }) ||
  left.id.localeCompare(right.id);

export const filterPublications = (
  publications: ExplorerPublication[],
  state: ExplorerState
): ExplorerPublication[] => {
  const query = state.q.toLocaleLowerCase();
  const filtered = publications.filter((publication) => {
    const matchesQuery = !query || searchableText(publication).includes(query);
    return (
      matchesQuery &&
      includesAll([publication.category], state.category) &&
      includesAll([String(publication.year)], state.year.map(String)) &&
      includesAll(
        rankKey(publication) ? [rankKey(publication)!] : [],
        state.rank
      )
    );
  });

  return [...filtered].sort((left, right) => {
    if (state.sort === 'title') return compareTitles(left, right);
    if (state.sort === 'oldest')
      return left.year - right.year || compareTitles(left, right);
    if (state.sort === 'citations') {
      if (left.citationCount === null && right.citationCount === null)
        return compareTitles(left, right);
      if (left.citationCount === null) return 1;
      if (right.citationCount === null) return -1;
      return (
        right.citationCount - left.citationCount || compareTitles(left, right)
      );
    }
    return right.year - left.year || compareTitles(left, right);
  });
};
