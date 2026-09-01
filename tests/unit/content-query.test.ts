import { cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ContentValidationError,
  assertComponentFilesAreCopyFree,
  loadContentEntries,
  loadValidatedContent
} from '../../src/lib/content/query';
import { validateBuildInputs } from '../../src/lib/content/build-validation';

const fixturesRoot = join(process.cwd(), 'tests', 'fixtures', 'content');
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  );
});

const seededInvalidEntries = async (fixture: string) => {
  const directory = await mkdtemp(join(tmpdir(), 'modern-academic-invalid-'));
  temporaryDirectories.push(directory);
  await cp(join(fixturesRoot, 'valid'), directory, { recursive: true });
  for (const collection of ['research', 'publications', 'projects']) {
    await cp(
      join(fixturesRoot, 'invalid', fixture, collection),
      join(directory, collection),
      { force: true, recursive: true }
    ).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    });
  }
  return loadContentEntries(directory);
};

describe('content query layer', () => {
  it('makes every valid Markdown collection entry available without component changes', async () => {
    const content = await loadValidatedContent(join(fixturesRoot, 'valid'));

    expect(
      content.publications.map((publication) => publication.data.id)
    ).toEqual(['atlas-study']);
    expect(content.research.map((research) => research.data.category)).toEqual([
      'Healthcare & Clinical AI'
    ]);
    expect(
      content.projects.map((project) => project.data.associatedPublicationIds)
    ).toEqual([['atlas-study']]);
    expect(Object.keys(content)).toEqual([
      'site',
      'research',
      'publications',
      'projects',
      'positions',
      'education',
      'honors',
      'service',
      'updates'
    ]);
  });

  it('includes a newly added valid Markdown fixture through the query layer', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'modern-academic-content-'));
    temporaryDirectories.push(directory);
    await cp(join(fixturesRoot, 'valid'), directory, { recursive: true });
    await writeFile(
      join(directory, 'publications', 'new-study.md'),
      `---\nid: new-study\nslug: new-study\ntitle: New study\nauthors:\n  - name: Example Author\nyear: 2026\nstatus: preprint\ntype: preprint\nvenueAbbreviation: arXiv\nvenue: arXiv preprint\nprimaryCategory: Healthcare & Clinical AI\nhashtags: []\ntldr: A human-reviewed summary.\nopenAccess: true\nartifactAvailable: false\nhomeFeatured: false\ndetailPage: false\ndisplayOrder: 2\n---\n\nVerified longer summary.\n`
    );

    const content = await loadValidatedContent(directory);

    expect(
      content.publications.map((publication) => publication.data.id)
    ).toEqual(['atlas-study', 'new-study']);
  });

  it.each([
    ['duplicate-id', 'id', 'atlas-study'],
    ['duplicate-slug', 'slug', 'atlas-study'],
    ['duplicate-doi', 'doi', '10.1000/atlas'],
    ['duplicate-arxiv', 'arxivId', '2401.00001'],
    ['invalid-link', 'links.paper', 'not a URL'],
    ['missing-tldr', 'tldr', 'Required'],
    ['invalid-status', 'status', 'not-a-status'],
    ['invalid-type', 'type', 'not-a-type'],
    ['invalid-category', 'primaryCategory', 'not-a-category'],
    ['incomplete-rank', 'rank.evidenceUrl', 'Required']
  ])(
    'rejects the %s fixture with a field-level %s error',
    async (fixture, field, detail) => {
      const entries = await seededInvalidEntries(fixture);

      await expect(async () =>
        loadValidatedContent(entries)
      ).rejects.toMatchObject({
        name: ContentValidationError.name,
        issues: expect.arrayContaining([
          expect.objectContaining({ field, detail })
        ])
      });
    }
  );

  it('rejects a component that embeds long biographical or publication prose', async () => {
    const directory = await mkdtemp(
      join(tmpdir(), 'modern-academic-components-')
    );
    temporaryDirectories.push(directory);
    await writeFile(
      join(directory, 'Biography.astro'),
      '<p>Farhan Sheth is an early-career AI researcher whose work explores verified research evidence.</p>'
    );

    await expect(assertComponentFilesAreCopyFree(directory)).rejects.toThrow(
      'Markdown collection'
    );
  });

  it('rejects unknown research publication references from a malformed fixture', async () => {
    const invalidEntries = await seededInvalidEntries('unknown-reference');

    await expect(async () =>
      loadValidatedContent(invalidEntries)
    ).rejects.toMatchObject({
      name: ContentValidationError.name,
      issues: expect.arrayContaining([
        expect.objectContaining({
          field: 'representativePublicationIds',
          detail: 'unknown-publication'
        })
      ])
    });
  });

  it('rejects unknown project publication references from a malformed fixture', async () => {
    const invalidEntries = await seededInvalidEntries('unknown-reference');

    await expect(async () =>
      loadValidatedContent(invalidEntries)
    ).rejects.toMatchObject({
      name: ContentValidationError.name,
      issues: expect.arrayContaining([
        expect.objectContaining({
          field: 'associatedPublicationIds',
          detail: 'unknown-publication'
        })
      ])
    });
  });

  it('fails with an actionable error when a required collection directory is missing', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'modern-academic-missing-'));
    temporaryDirectories.push(directory);

    await expect(loadContentEntries(directory)).rejects.toThrow(
      'Required content collection directory is missing: site'
    );
  });

  it('build validation rejects malformed production content before Astro output', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'modern-academic-build-'));
    temporaryDirectories.push(directory);
    await cp(join(fixturesRoot, 'valid'), directory, { recursive: true });
    await writeFile(
      join(directory, 'publications', 'duplicate.md'),
      `---\nid: atlas-study\nslug: duplicate-study\ntitle: Duplicate study\nauthors: [{ name: Example Author }]\nyear: 2026\nstatus: published\ntype: conference\nvenueAbbreviation: EACL\nvenue: Example Venue\nprimaryCategory: Healthcare & Clinical AI\nhashtags: []\ntldr: A human-reviewed summary.\nopenAccess: true\nartifactAvailable: false\nhomeFeatured: false\ndetailPage: false\ndisplayOrder: 2\n---\n\nVerified summary.\n`
    );

    await expect(
      validateBuildInputs(directory, directory)
    ).rejects.toMatchObject({
      name: ContentValidationError.name,
      issues: expect.arrayContaining([
        expect.objectContaining({ field: 'id', detail: 'atlas-study' })
      ])
    });
  });

  it('rejects interpolated editorial prose in an Astro component', async () => {
    const directory = await mkdtemp(
      join(tmpdir(), 'modern-academic-components-')
    );
    temporaryDirectories.push(directory);
    await writeFile(
      join(directory, 'Biography.astro'),
      `---\nconst biography = 'Farhan Sheth is an early-career AI researcher whose work documents peer-reviewed publication evidence.';\n---\n<p>{biography}</p>`
    );

    await expect(assertComponentFilesAreCopyFree(directory)).rejects.toThrow(
      'Markdown collection'
    );
  });

  it('rejects interpolated editorial prose in a TSX component', async () => {
    const directory = await mkdtemp(
      join(tmpdir(), 'modern-academic-components-')
    );
    temporaryDirectories.push(directory);
    await writeFile(
      join(directory, 'Publication.tsx'),
      `const summary = 'This publication presents a verified contribution with evidence, methods, and scholarly context.';\nexport const Publication = () => <section>{summary}</section>;`
    );

    await expect(assertComponentFilesAreCopyFree(directory)).rejects.toThrow(
      'Markdown collection'
    );
  });

  it('keeps production route components free of editorial prose', async () => {
    await expect(
      assertComponentFilesAreCopyFree(join(process.cwd(), 'src', 'components'))
    ).resolves.toBeUndefined();
  });
});
