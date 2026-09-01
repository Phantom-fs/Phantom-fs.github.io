export interface BibTeXPublication {
  arxivId?: string;
  authors: string[];
  doi?: string;
  id: string;
  title: string;
  type: string;
  venue: string;
  year: number;
}

const entryType = (type: string) => {
  switch (type) {
    case 'journal':
      return 'article';
    case 'conference':
    case 'workshop':
      return 'inproceedings';
    case 'book-chapter':
      return 'incollection';
    case 'preprint':
    case 'thesis':
      return 'misc';
    default:
      throw new Error(`Unsupported BibTeX publication type: ${type}`);
  }
};

const venueFields = ({ arxivId, type, venue }: BibTeXPublication) => {
  switch (type) {
    case 'journal':
      return [`  journal = {${venue}}`];
    case 'conference':
    case 'workshop':
    case 'book-chapter':
      return [`  booktitle = {${venue}}`];
    case 'preprint':
      return [
        ...(arxivId ? [`  eprint = {${arxivId}}`] : []),
        ...(arxivId ? ['  archivePrefix = {arXiv}'] : [])
      ];
    case 'thesis':
      return [];
    default:
      throw new Error(`Unsupported BibTeX publication type: ${type}`);
  }
};

const citationKey = ({ authors, id, year }: BibTeXPublication) => {
  const surname = (authors[0]?.split(/\s+/).at(-1) ?? 'publication')
    .replaceAll(/[^a-z0-9]/gi, '')
    .toLocaleLowerCase();
  const normalizedId = id.replaceAll(/[^a-z0-9]/gi, '');
  return `${surname}${year}${normalizedId}`;
};

export const createBibTeX = (publication: BibTeXPublication): string => {
  const fields = [
    `  author = {${publication.authors.join(' and ')}}`,
    `  title = {${publication.title}}`,
    ...venueFields(publication),
    `  year = {${publication.year}}`,
    ...(publication.doi ? [`  doi = {${publication.doi}}`] : [])
  ];
  return `@${entryType(publication.type)}{${citationKey(publication)},\n${fields.join(',\n')}\n}`;
};
