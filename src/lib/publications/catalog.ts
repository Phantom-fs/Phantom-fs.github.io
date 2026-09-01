import type { ArtifactLinks } from '../ui/system';

interface Rank {
  evidenceUrl: string;
  evidenceYear: number;
  system: string;
  value: string;
}

interface CatalogPublicationSource {
  arxivId?: string;
  authors: Array<{ equalContribution?: boolean; name: string }>;
  detailPage: boolean;
  displayOrder: number;
  hashtags: string[];
  id: string;
  links?: ArtifactLinks;
  primaryCategory: string;
  rank?: Rank;
  slug: string;
  status: string;
  title: string;
  tldr: string;
  venue: string;
  year: number;
}

export interface CatalogPublication extends CatalogPublicationSource {
  abstract: string;
}

export const toCatalogPublication = ({
  body,
  data
}: {
  body: string;
  data: CatalogPublicationSource;
}): CatalogPublication => ({
  abstract: body,
  ...(data.arxivId ? { arxivId: data.arxivId } : {}),
  authors: data.authors,
  detailPage: data.detailPage,
  displayOrder: data.displayOrder,
  hashtags: data.hashtags,
  id: data.id,
  links: data.links,
  primaryCategory: data.primaryCategory,
  rank: data.rank,
  slug: data.slug,
  status: data.status,
  title: data.title,
  tldr: data.tldr,
  venue: data.venue,
  year: data.year
});
