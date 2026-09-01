export type ThemeName = 'light' | 'dark';

export const deploymentOrigin = 'https://phantom-fs.github.io';

export const selectTheme = (storedTheme: string | null): ThemeName =>
  storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : 'light';

export interface PageMetadataInput {
  description: string;
  pathname: string;
  title: string;
}

export const buildPageMetadata = ({
  description,
  pathname,
  title
}: PageMetadataInput) => {
  const normalizedPath =
    pathname === '/404/'
      ? '/404.html'
      : pathname.startsWith('/')
        ? pathname
        : `/${pathname}`;
  const canonical = new URL(normalizedPath, `${deploymentOrigin}/`).toString();

  return {
    canonical,
    description,
    image: `${deploymentOrigin}/images/og-research-atlas.jpg`,
    title: `${title} | Farhan Sheth`
  };
};

export type ArtifactKey =
  'paper' | 'code' | 'dataset' | 'demo' | 'slides' | 'poster';

export type ArtifactLinks = Partial<Record<ArtifactKey, string>>;

export type ActionKind = 'primary' | 'secondary' | 'utility';

export interface CtaAction {
  disabled?: boolean;
  href: string;
  kind: ActionKind;
  label: string;
  target?: '_blank';
}

const ctaOrder: Record<ActionKind, number> = {
  primary: 0,
  secondary: 1,
  utility: 2
};

/**
 * Keeps the shared call-to-action hierarchy stable while retaining each
 * caller's sequence for actions at the same level.
 */
export const ctaActions = (actions: CtaAction[]): CtaAction[] =>
  actions
    .map((action, index) => ({ action, index }))
    .sort(
      (left, right) =>
        ctaOrder[left.action.kind] - ctaOrder[right.action.kind] ||
        left.index - right.index
    )
    .map(({ action }) => action);

const artifactLabels: Record<ArtifactKey, string> = {
  paper: 'Read paper',
  code: 'Code',
  dataset: 'Dataset',
  demo: 'Demo',
  slides: 'Slides',
  poster: 'Poster'
};

const artifactOrder: ArtifactKey[] = [
  'paper',
  'code',
  'dataset',
  'demo',
  'slides',
  'poster'
];

export const artifactActions = (links: ArtifactLinks) =>
  artifactOrder.flatMap((key) => {
    const href = links[key];
    return href ? [{ href, key, label: artifactLabels[key] }] : [];
  });

export type CitationState =
  | { kind: 'available'; label: string }
  | { kind: 'stale'; label: string }
  | { kind: 'unavailable'; label: string }
  | { kind: 'failure'; label: string };

export const citationState = (
  metric: { stale: boolean; value: number } | null | undefined,
  failed = false
): CitationState => {
  if (failed) return { kind: 'failure', label: 'Citation source failed' };
  if (!metric) return { kind: 'unavailable', label: 'Unavailable' };
  return metric.stale
    ? { kind: 'stale', label: `${metric.value} citations · stale` }
    : { kind: 'available', label: `${metric.value} citations` };
};
