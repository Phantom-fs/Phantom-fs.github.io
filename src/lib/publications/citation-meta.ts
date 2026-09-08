export interface CitationMetaPublication {
  authors: Array<{ name: string }>;
  doi?: string;
  title: string;
  type:
    | 'journal'
    | 'conference'
    | 'workshop'
    | 'preprint'
    | 'thesis'
    | 'book-chapter';
  venue: string;
  year: number;
}

export interface CitationMetaTag {
  content: string;
  name: string;
}

export const citationMeta = (
  publication: CitationMetaPublication
): CitationMetaTag[] => [
  { content: publication.title, name: 'citation_title' },
  ...publication.authors.map(({ name }) => ({
    content: name,
    name: 'citation_author'
  })),
  { content: String(publication.year), name: 'citation_publication_date' },
  ...(publication.type === 'journal'
    ? [{ content: publication.venue, name: 'citation_journal_title' }]
    : publication.type === 'conference' || publication.type === 'workshop'
      ? [{ content: publication.venue, name: 'citation_conference_title' }]
      : []),
  ...(publication.doi
    ? [{ content: publication.doi, name: 'citation_doi' }]
    : [])
];
