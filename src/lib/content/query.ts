import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import matter from 'gray-matter';
import ts from 'typescript';
import type { ZodError } from 'astro/zod';
import { contentSchemas } from './contracts';
import type { ContentCollection, ContentDataByCollection } from './contracts';

export interface ContentEntry {
  body: string;
  collection: ContentCollection;
  data: unknown;
  filePath: string;
}

export interface ContentValidationIssue {
  collection: ContentCollection;
  detail: string;
  field: string;
  filePath: string;
}

export class ContentValidationError extends Error {
  constructor(public readonly issues: ContentValidationIssue[]) {
    super(
      issues
        .map((issue) => `${issue.filePath}:${issue.field}: ${issue.detail}`)
        .join('\n')
    );
    this.name = 'ContentValidationError';
  }
}

type ValidatedEntry<K extends ContentCollection> = {
  body: string;
  collection: K;
  data: ContentDataByCollection[K];
  filePath: string;
};

export type ValidatedContent = {
  [K in ContentCollection]: ValidatedEntry<K>[];
};

const collections = Object.keys(contentSchemas) as ContentCollection[];

const walkFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        return walkFiles(entryPath);
      }
      return [entryPath];
    })
  );

  return files.flat();
};

const walkMarkdownFiles = async (
  directory: string,
  collection: ContentCollection
): Promise<string[]> => {
  try {
    return (await walkFiles(directory)).filter(
      (filePath) => extname(filePath) === '.md'
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `Required content collection directory is missing: ${collection}`
      );
    }
    throw error;
  }
};

export const loadContentEntries = async (
  rootDirectory: string
): Promise<ContentEntry[]> => {
  const entries: ContentEntry[] = [];
  for (const collection of collections) {
    const collectionDirectory = join(rootDirectory, collection);
    const files = await walkMarkdownFiles(collectionDirectory, collection);
    const collectionEntries = await Promise.all(
      files.map(async (filePath) => {
        const source = await readFile(filePath, 'utf8');
        const parsed = matter(source);
        return {
          body: parsed.content.trim(),
          collection,
          data: parsed.data,
          filePath: relative(rootDirectory, filePath)
        };
      })
    );
    entries.push(...collectionEntries);
  }

  return entries.sort((left, right) =>
    left.filePath.localeCompare(right.filePath)
  );
};

const inputDetail = (input: unknown, fallback: string): string => {
  if (input === undefined) {
    return 'Required';
  }
  return typeof input === 'string' ? input : fallback;
};

const inputAtPath = (input: unknown, path: PropertyKey[]): unknown =>
  path.reduce<unknown>((value, key) => {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }
    return (value as Record<PropertyKey, unknown>)[key];
  }, input);

const zodIssues = (
  entry: ContentEntry,
  error: ZodError
): ContentValidationIssue[] =>
  error.issues.map((issue) => ({
    collection: entry.collection,
    detail: inputDetail(inputAtPath(entry.data, issue.path), issue.message),
    field: issue.path.join('.'),
    filePath: entry.filePath
  }));

const duplicateIssues = (entries: ContentEntry[]): ContentValidationIssue[] => {
  const issues: ContentValidationIssue[] = [];
  const uniqueFields = new Map<string, Map<string, ContentEntry>>();

  for (const entry of entries) {
    const data = entry.data as Record<string, unknown>;
    const fields =
      entry.collection === 'publications'
        ? ['id', 'slug', 'doi', 'arxivId']
        : ['id', 'slug'];
    for (const field of fields) {
      const value = data[field];
      if (typeof value !== 'string' || value.length === 0) {
        continue;
      }
      const normalized =
        field === 'doi' || field === 'arxivId' ? value.toLowerCase() : value;
      const values = uniqueFields.get(field) ?? new Map<string, ContentEntry>();
      const first = values.get(normalized);
      if (first) {
        issues.push({
          collection: entry.collection,
          detail: value,
          field,
          filePath: entry.filePath
        });
      } else {
        values.set(normalized, entry);
        uniqueFields.set(field, values);
      }
    }
  }

  return issues;
};

const referenceIssues = (
  content: ValidatedContent
): ContentValidationIssue[] => {
  const publicationIds = new Set(
    content.publications.map((publication) => publication.data.id)
  );
  const issues: ContentValidationIssue[] = [];
  const references = [
    ...content.research.flatMap((entry) =>
      entry.data.representativePublicationIds.map((id) => ({
        entry,
        field: 'representativePublicationIds',
        id
      }))
    ),
    ...content.projects.flatMap((entry) =>
      entry.data.associatedPublicationIds.map((id) => ({
        entry,
        field: 'associatedPublicationIds',
        id
      }))
    )
  ];

  for (const reference of references) {
    if (!publicationIds.has(reference.id)) {
      issues.push({
        collection: reference.entry.collection,
        detail: reference.id,
        field: reference.field,
        filePath: reference.entry.filePath
      });
    }
  }

  return issues;
};

export const validateContentEntries = (
  entries: ContentEntry[]
): ValidatedContent => {
  const issues: ContentValidationIssue[] = [];
  const content = Object.fromEntries(
    collections.map((collection) => [collection, []])
  ) as unknown as ValidatedContent;

  for (const entry of entries) {
    const parsed = contentSchemas[entry.collection].safeParse(entry.data);
    if (!parsed.success) {
      issues.push(...zodIssues(entry, parsed.error));
      continue;
    }
    if (entry.collection === 'publications' && entry.body.length === 0) {
      issues.push({
        collection: entry.collection,
        detail: 'Required',
        field: 'body',
        filePath: entry.filePath
      });
      continue;
    }
    const validated = { ...entry, data: parsed.data } as ValidatedEntry<
      typeof entry.collection
    >;
    (
      content[
        entry.collection
      ] as unknown as ValidatedEntry<ContentCollection>[]
    ).push(validated);
  }

  if (issues.length > 0) {
    throw new ContentValidationError(issues);
  }

  issues.push(...duplicateIssues(entries));
  issues.push(...referenceIssues(content));
  if (issues.length > 0) {
    throw new ContentValidationError(issues);
  }

  return content;
};

export const loadValidatedContent = async (
  source: string | ContentEntry[]
): Promise<ValidatedContent> =>
  validateContentEntries(
    typeof source === 'string' ? await loadContentEntries(source) : source
  );

export const assertComponentFilesAreCopyFree = async (
  componentsDirectory: string
): Promise<void> => {
  const componentFiles = (await walkFiles(componentsDirectory)).filter(
    (filePath) => /\.(astro|tsx|jsx)$/.test(filePath)
  );

  for (const filePath of componentFiles) {
    const source = await readFile(filePath, 'utf8');
    if (hasRenderedEditorialCopy(source, extname(filePath))) {
      throw new Error(
        `${filePath} contains editorial copy; move it to a Markdown collection.`
      );
    }
  }
};

const isEditorialText = (value: string): boolean =>
  value.trim().length >= 50 && value.trim().split(/\s+/).length >= 8;

const sourceSections = (source: string, extension: string) => {
  if (extension !== '.astro') {
    return { markup: source, script: source };
  }
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  return match
    ? { markup: match[2], script: match[1] }
    : { markup: source, script: '' };
};

const stringBindings = (
  source: string,
  fileName: string
): Map<string, string> => {
  const bindings = new Map<string, string>();
  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true
  );
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer
    ) {
      const initializer = node.initializer;
      if (
        ts.isStringLiteral(initializer) ||
        ts.isNoSubstitutionTemplateLiteral(initializer)
      ) {
        bindings.set(node.name.text, initializer.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return bindings;
};

const hasRenderedEditorialCopy = (
  source: string,
  extension: string
): boolean => {
  const { markup, script } = sourceSections(source, extension);
  const textNodes = markup.match(/>([^<{}]+)</g) ?? [];
  if (textNodes.some((node) => isEditorialText(node.slice(1, -1)))) {
    return true;
  }

  const bindings = stringBindings(
    script,
    extension === '.astro' ? 'component.ts' : 'component.tsx'
  );
  const expressions = [...markup.matchAll(/\{\s*([A-Za-z_$][\w$]*)\s*\}/g)];
  return expressions.some((expression) =>
    isEditorialText(bindings.get(expression[1]) ?? '')
  );
};
