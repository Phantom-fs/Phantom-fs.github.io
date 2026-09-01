export const metricsSchemaVersion = 1;

export type MetricSource = 'scholar';

export interface CitationMetric {
  value: number;
  source: MetricSource;
  sourceUrl: string;
  updatedAt: string;
  stale: boolean;
}

export interface NormalizedMetrics {
  schemaVersion: typeof metricsSchemaVersion;
  generatedAt: string;
  stale: boolean;
  author: {
    totalCitations: CitationMetric;
    hIndex: CitationMetric;
    i10Index: CitationMetric;
    publicationCount: CitationMetric;
  };
  publications: Record<
    string,
    { citationCount: CitationMetric; sourceIdentifier: string }
  >;
  diagnostics: Array<{ code: string; source: string }>;
}

const isMetric = (value: unknown): value is CitationMetric => {
  if (typeof value !== 'object' || value === null) return false;
  const metric = value as Record<string, unknown>;
  return (
    Number.isInteger(metric.value) &&
    (metric.value as number) >= 0 &&
    metric.source === 'scholar' &&
    isHttpUrl(metric.sourceUrl) &&
    isIsoTimestamp(metric.updatedAt) &&
    typeof metric.stale === 'boolean'
  );
};

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

export const parseNormalizedMetrics = (value: unknown): NormalizedMetrics => {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Metrics document must be an object');
  }
  const document = value as Record<string, unknown>;
  const author = document.author as Record<string, unknown> | undefined;
  if (
    document.schemaVersion !== metricsSchemaVersion ||
    !isIsoTimestamp(document.generatedAt) ||
    typeof document.stale !== 'boolean' ||
    !author ||
    !isMetric(author.totalCitations) ||
    !isMetric(author.hIndex) ||
    !isMetric(author.i10Index) ||
    !isMetric(author.publicationCount) ||
    typeof document.publications !== 'object' ||
    document.publications === null ||
    !Array.isArray(document.diagnostics) ||
    !Object.entries(document.publications).every(
      ([id, publication]) =>
        id.length > 0 &&
        typeof publication === 'object' &&
        publication !== null &&
        isMetric((publication as Record<string, unknown>).citationCount) &&
        typeof (publication as Record<string, unknown>).sourceIdentifier ===
          'string' &&
        (publication as Record<string, unknown>).sourceIdentifier !== ''
    ) ||
    !document.diagnostics.every(
      (diagnostic) =>
        typeof diagnostic === 'object' &&
        diagnostic !== null &&
        typeof (diagnostic as Record<string, unknown>).code === 'string' &&
        (diagnostic as Record<string, unknown>).code !== '' &&
        typeof (diagnostic as Record<string, unknown>).source === 'string' &&
        (diagnostic as Record<string, unknown>).source !== ''
    )
  ) {
    throw new Error('Metrics document does not satisfy schema version 1');
  }
  return document as unknown as NormalizedMetrics;
};
