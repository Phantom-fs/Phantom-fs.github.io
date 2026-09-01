import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (...parts: string[]) => resolve('src', ...parts);

describe('Scholar overview source contract', () => {
  it('keeps the overview route static and delegates the dossier to a shared component', async () => {
    const route = await readFile(source('pages', 'overview.astro'), 'utf8');

    expect(route).toContain('ScholarOverview');
    expect(route).toContain('loadValidatedContent');
    expect(route).toContain('loadBuildMetrics');
  });

  it('keeps the concise academic overview grouped and free of dossier-only surfaces', async () => {
    const [overview, header, footer] = await Promise.all([
      readFile(
        source('components', 'overview', 'ScholarOverview.astro'),
        'utf8'
      ),
      readFile(source('components', 'global', 'SiteHeader.astro'), 'utf8'),
      readFile(source('components', 'global', 'SiteFooter.astro'), 'utf8')
    ]);

    expect(overview).toContain('i10Index');
    expect(overview).toContain("requiredSiteContent('about-introduction')");
    expect(overview).toContain('Academic overview');
    expect(overview).toContain('.filter(({ data }) => data.detailPage)');
    expect(overview).toContain('overview-publication-groups');
    expect(overview).toContain('data-overview-publication-group');
    expect(overview).toContain('News');
    expect(overview).toContain('data-overview-return');
    expect(overview).toContain('Full site');
    expect(overview).toContain('<h3>{position.organization}</h3>');
    expect(overview).toContain('<h3>{entry.title}</h3>');
    expect(overview).toContain('<span>Advisor:</span>');
    expect(overview).not.toContain('Advisor: {position.advisor.name}');
    expect(overview).not.toContain('SummaryDisclosure');
    expect(overview).not.toContain('ArtifactLinks');
    expect(overview).not.toContain('PublicationMetadata');
    expect(overview).not.toContain('publication.tldr');
    expect(overview).not.toContain('<p>{body}</p>');
    expect(overview).not.toContain('overview-domain-list');
    expect(overview).not.toContain('overview-publication-catalog');
    expect(overview).not.toContain('overview-projects-title');
    expect(overview).not.toContain('Validated author metrics.');
    expect(overview).not.toContain('diagnostics');
    expect(overview).not.toContain('openalex');
    expect(header).toContain("label: 'Scholar view'");
    expect(header).toContain("{ href: '/', label: 'Full site' }");
    expect(header).toContain('data-full-site-return');
    expect(footer).toContain('aria-label="Return to full site"');
    expect(footer).toContain('<svg');
    expect(footer).toContain('site-footer__contact');
    expect(footer).not.toContain(
      '<nav class="site-footer__links type-body-sm" aria-label="Research profiles">\n      {\n        isOverview'
    );
  });
});
