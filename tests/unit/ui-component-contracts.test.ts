import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (...parts: string[]) => resolve('src', ...parts);

describe('shared UI primitive contracts', () => {
  it('makes action grouping, publication identity, and resource labels reusable', async () => {
    const [actionGroup, header, metadata, artifacts] = await Promise.all([
      readFile(source('components', 'shared', 'ActionGroup.astro'), 'utf8'),
      readFile(source('components', 'global', 'SiteHeader.astro'), 'utf8'),
      readFile(
        source('components', 'shared', 'PublicationMetadata.astro'),
        'utf8'
      ),
      readFile(source('components', 'shared', 'ArtifactLinks.astro'), 'utf8')
    ]);

    expect(actionGroup).toContain('ctaActions');
    expect(header).toContain(
      "aria-current={isCurrent(href) ? 'page' : undefined}"
    );
    expect(metadata).toContain('aria-label="Ordered authors"');
    expect(metadata).toContain('<h3');
    expect(artifacts).toContain("label = 'Related resources'");
    expect(artifacts).not.toContain('aria-label="Publication resources"');
  });

  it('models caller-safe IDs and meaningful interaction states without fabricated loading', async () => {
    const [emptyState, actionLink, disclosure, bibtex, citation] =
      await Promise.all([
        readFile(source('components', 'shared', 'EmptyState.astro'), 'utf8'),
        readFile(source('components', 'shared', 'ActionLink.astro'), 'utf8'),
        readFile(
          source('components', 'shared', 'SummaryDisclosure.astro'),
          'utf8'
        ),
        readFile(source('components', 'shared', 'BibTeXAction.astro'), 'utf8'),
        readFile(source('components', 'shared', 'CitationMetric.astro'), 'utf8')
      ]);

    expect(emptyState).not.toContain('id="empty-state-title"');
    expect(emptyState).toContain('titleId');
    expect(actionLink).toContain('aria-disabled="true"');
    expect(disclosure).toContain('aria-expanded');
    expect(bibtex).toContain('aria-busy');
    expect(bibtex).toContain('Copying BibTeX');
    expect(citation).toContain('failure');
  });
});
