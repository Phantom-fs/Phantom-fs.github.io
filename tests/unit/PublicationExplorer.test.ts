// @vitest-environment jsdom
import { h } from 'preact';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PublicationExplorer from '../../src/islands/PublicationExplorer';
import type { ExplorerPublication } from '../../src/lib/publications/explorer';

const records: ExplorerPublication[] = [
  {
    abstract: 'Clinical decision support.',
    authors: ['Farhan Sheth'],
    category: 'Healthcare & Clinical AI',
    citationCount: 4,
    detailPage: true,
    hashtags: ['clinical-ai'],
    id: 'uc-prun',
    rank: null,
    title: 'Uc-PrUn',
    tldr: 'Clinical unlearning.',
    venue: 'ACM TCH',
    year: 2026
  },
  {
    abstract: 'Speech attribution.',
    authors: ['Farhan Sheth'],
    category: 'Speech, Audio & Synthetic Media',
    citationCount: 0,
    detailPage: true,
    hashtags: ['synthetic-speech'],
    id: 'signal',
    rank: null,
    title: 'SIGNAL',
    tldr: 'Speech attribution.',
    venue: 'EACL',
    year: 2026
  }
];

describe('PublicationExplorer', () => {
  it('publishes a filtered result set from a labeled search control', async () => {
    const user = userEvent.setup();
    const onResultsChange = vi.fn();
    render(h(PublicationExplorer, { records, onResultsChange }));

    await user.type(
      screen.getByRole('searchbox', { name: 'Search publications' }),
      'clinical'
    );

    expect(onResultsChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ ids: ['uc-prun'] })
    );
    expect(screen.getByText('Total publications: 1')).toBeTruthy();
  });

  it('omits metadata-only filter controls from the public explorer', () => {
    render(h(PublicationExplorer, { records }));

    expect(screen.queryByText('Publication type')).toBeNull();
    expect(screen.queryByText('Status')).toBeNull();
    expect(screen.queryByText('Availability')).toBeNull();
    expect(
      screen.queryByRole('combobox', { name: 'Artifact availability' })
    ).toBeNull();
    expect(
      screen.queryByRole('combobox', { name: 'Open-access status' })
    ).toBeNull();
  });
});
