import { z } from 'astro/zod';

const identifier = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Must be a lowercase kebab-case identifier'
  );
const requiredText = z.string().trim().min(1, 'Required');
const httpUrl = z.url({ error: 'not a URL' }).refine((value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, 'not a URL');
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be an ISO date');

export const researchCategories = [
  'Healthcare & Clinical AI',
  'Privacy, Trust & Safety',
  'Speech, Audio & Synthetic Media',
  'Multimodal & Human-Centered AI',
  'Scientific & Applied AI',
  'Earth & Agricultural Intelligence'
] as const;

const commonSchema = z.object({
  id: identifier,
  slug: identifier,
  title: requiredText,
  order: z.number().int().nonnegative()
});

const authorSchema = z.object({
  name: requiredText,
  profileUrl: httpUrl.optional(),
  isSelf: z.boolean().optional(),
  equalContribution: z.boolean().optional()
});

const linksSchema = z
  .object({
    paper: httpUrl.optional(),
    code: httpUrl.optional(),
    dataset: httpUrl.optional(),
    demo: httpUrl.optional(),
    slides: httpUrl.optional(),
    poster: httpUrl.optional()
  })
  .strict();

const rankSchema = z
  .object({
    system: requiredText,
    value: requiredText,
    evidenceYear: z.number().int().min(1900).max(2100),
    evidenceUrl: httpUrl
  })
  .strict();

export const contentSchemas = {
  site: commonSchema.extend({
    summary: requiredText,
    socialLinks: z
      .array(
        z
          .object({
            label: requiredText,
            url: httpUrl
          })
          .strict()
      )
      .optional()
  }),
  research: commonSchema.extend({
    category: z.enum(researchCategories),
    summary: requiredText,
    questions: z.array(requiredText),
    methods: z.array(requiredText),
    representativePublicationIds: z.array(identifier),
    collaborationInterests: z.array(requiredText)
  }),
  publications: commonSchema
    .extend({
      authors: z.array(authorSchema).min(1),
      year: z.number().int().min(1900).max(2100),
      status: z.enum(['published', 'accepted', 'preprint', 'under-review']),
      type: z.enum([
        'journal',
        'conference',
        'workshop',
        'preprint',
        'thesis',
        'book-chapter'
      ]),
      venueAbbreviation: requiredText,
      venue: requiredText,
      primaryCategory: z.enum(researchCategories),
      hashtags: z.array(identifier),
      tldr: requiredText,
      doi: z
        .string()
        .regex(/^10\.\d{4,9}\/.+$/i, 'Must be a DOI')
        .optional(),
      arxivId: z
        .string()
        .regex(/^\d{4}\.\d{4,5}(?:v\d+)?$/i, 'Must be an arXiv ID')
        .optional(),
      scholarPublicationId: requiredText.optional(),
      links: linksSchema.optional(),
      rank: rankSchema.optional(),
      openAccess: z.boolean(),
      artifactAvailable: z.boolean(),
      homeFeatured: z.boolean(),
      detailPage: z.boolean(),
      displayOrder: z.number().int().nonnegative()
    })
    .omit({ order: true })
    .superRefine((publication, context) => {
      if (
        ['preprint', 'under-review'].includes(publication.status) &&
        ![
          ['arXiv', 'arXiv preprint'],
          ['Under review', 'Under review']
        ].some(
          ([abbreviation, venue]) =>
            publication.venueAbbreviation === abbreviation &&
            publication.venue === venue
        )
      ) {
        context.addIssue({
          code: 'custom',
          path: ['venue'],
          message:
            'Unpublished records may expose only “arXiv preprint” or “Under review”, never a named review destination'
        });
      }
      if (
        publication.artifactAvailable &&
        !publication.links?.code &&
        !publication.links?.dataset &&
        !publication.links?.demo &&
        !publication.links?.slides &&
        !publication.links?.poster
      ) {
        context.addIssue({
          code: 'custom',
          path: ['artifactAvailable'],
          message:
            'Artifact-available publications must include a code, dataset, demo, slides, or poster link'
        });
      }
    }),
  projects: commonSchema.extend({
    summary: requiredText,
    problem: requiredText,
    role: requiredText,
    contribution: requiredText,
    datasetScale: z.array(requiredText).min(1),
    methodology: z.array(requiredText).min(1),
    outcomes: z.array(requiredText).min(1),
    technology: z.array(requiredText).min(1),
    associatedPublicationIds: z.array(identifier).min(1),
    links: linksSchema.optional()
  }),
  positions: commonSchema.extend({
    organization: requiredText,
    startDate: date,
    endDate: date.optional(),
    current: z.boolean(),
    advisor: z
      .object({
        name: requiredText,
        url: httpUrl
      })
      .strict()
      .optional()
  }),
  education: commonSchema.extend({
    institution: requiredText,
    startDate: date,
    endDate: date.optional(),
    cgpa: requiredText.optional(),
    coursework: z.array(requiredText).min(1).optional()
  }),
  honors: commonSchema.extend({
    issuer: requiredText,
    year: z.number().int().min(1900).max(2100)
  }),
  service: commonSchema.extend({
    organization: requiredText,
    role: requiredText
  }),
  updates: commonSchema.extend({
    date,
    paper: requiredText,
    summary: requiredText,
    venue: requiredText
  })
} as const;

export type ContentCollection = keyof typeof contentSchemas;

export type ContentDataByCollection = {
  [K in ContentCollection]: z.infer<(typeof contentSchemas)[K]>;
};
