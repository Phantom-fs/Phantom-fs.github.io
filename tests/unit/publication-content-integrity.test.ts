import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadValidatedContent } from '../../src/lib/content/query';

const contentRoot = join(process.cwd(), 'src', 'content');

const verifiedAuthors: Record<string, string[]> = {
  'alzheimer-detection': [
    'Girish',
    'Mohd Mujtaba Akhtar',
    'Farhan Sheth',
    'Muskaan Singh',
    'Juliana Gerard',
    'Paula McClean',
    'Kongfatt Wong-Lin'
  ],
  'chest-xray-encryption': [
    'Ajit Noonia',
    'Deepti Thakral',
    'Priya Mathur',
    'Farhan Sheth',
    'Hammad Shaikh',
    'Amit Kumar Gupta'
  ],
  'cross-lingual-generator-attribution': [
    'Girish',
    'Mohd Mujtaba Akhtar',
    'Farhan Sheth',
    'Muskaan Singh'
  ],
  'curved-worlds': [
    'Farhan Sheth',
    'Girish',
    'Mohd Mujtaba Akhtar',
    'Muskaan Singh'
  ],
  'data-efficient-neuroimaging': [
    'Priya Mathur',
    'Amit Kumar Gupta',
    'Farhan Sheth'
  ],
  'geological-rock-classification': [
    'Amit Kumar Gupta',
    'Priya Mathur',
    'Farhan Sheth',
    'Carlos M. Travieso-Gonzalez',
    'Sandeep Chaurasia'
  ],
  herald: ['Farhan Sheth', 'Ziyuan Yang', 'Yongying Lan', 'Si Yong Yeo'],
  herbify: [
    'Farhan Sheth',
    'Ishika Chatter',
    'Manvendra Jasra',
    'Gireesh Kumar',
    'Richa Sharma'
  ],
  'learning-heat': [
    'Farhan Sheth',
    'Priya Mathur',
    'Hammad Shaikh',
    'Dheeraj Kumar',
    'Shweta Mishra',
    'Amit Kumar Gupta'
  ],
  'mango-leaf-disease': [
    'Priya Mathur',
    'Farhan Sheth',
    'Dinesh Goyal',
    'Amit Kumar Gupta'
  ],
  'nanofluid-density': [
    'Priya Mathur',
    'Hammad Shaikh',
    'Farhan Sheth',
    'Dheeraj Kumar',
    'Amit Kumar Gupta'
  ],
  'nanofluid-specific-heat': [
    'Priya Mathur',
    'Dheeraj Kumar',
    'Farhan Sheth',
    'Hammad Shaikh',
    'Amit Kumar Gupta'
  ],
  'phishing-discrete-models': [
    'Dinesh Goyal',
    'Farhan Sheth',
    'Priya Mathur',
    'Amit Kumar Gupta'
  ],
  'phishing-llm': [
    'Dinesh Goyal',
    'Anil Kumar',
    'Priya Mathur',
    'Farhan Sheth',
    'Amit Kumar Gupta'
  ],
  recruitview: [
    'Amit Kumar Gupta',
    'Farhan Sheth',
    'Hammad Shaikh',
    'Dheeraj Kumar',
    'Angkul Puniya',
    'Deepak Panwar',
    'Sandeep Chaurasia',
    'Priya Mathur'
  ],
  'signal-eacl-2026': [
    'Mohd Mujtaba Akhtar',
    'Girish',
    'Farhan Sheth',
    'Muskaan Singh'
  ],
  'soil-classification': [
    'Farhan Sheth',
    'Priya Mathur',
    'Amit Kumar Gupta',
    'Sandeep Chaurasia'
  ],
  'uc-prun': [
    'Farhan Sheth',
    'Mohd Mujtaba Akhtar',
    'Girish',
    'Muskaan Singh',
    'Alexander Davey'
  ]
};

describe('production publication metadata', () => {
  it('matches the source-verified author names and order for every paper', async () => {
    const { publications } = await loadValidatedContent(contentRoot);
    const actual = Object.fromEntries(
      publications.map((publication) => [
        publication.data.id,
        publication.data.authors.map((author) => author.name)
      ])
    );

    expect(actual).toEqual(verifiedAuthors);
  });

  it('does not retain OpenAlex identifiers in content or its contract', async () => {
    const publicationDirectory = join(contentRoot, 'publications');
    const publicationSources = await Promise.all(
      (await readdir(publicationDirectory)).map((file) =>
        readFile(join(publicationDirectory, file), 'utf8')
      )
    );
    const contract = await readFile(
      join(process.cwd(), 'src', 'lib', 'content', 'contracts.ts'),
      'utf8'
    );

    expect([contract, ...publicationSources].join('\n')).not.toMatch(
      /openalex/i
    );
  });

  it('labels unpublished papers without naming a review destination', async () => {
    const { publications } = await loadValidatedContent(contentRoot);
    const unpublished = publications.filter(({ data }) =>
      ['preprint', 'under-review'].includes(data.status)
    );

    expect(unpublished.length).toBeGreaterThan(0);
    for (const { data } of unpublished) {
      expect([
        ['arXiv', 'arXiv preprint'],
        ['Under review', 'Under review']
      ]).toContainEqual([data.venueAbbreviation, data.venue]);
    }
  });
});
