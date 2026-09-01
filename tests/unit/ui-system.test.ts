import { describe, expect, it } from 'vitest';
import {
  artifactActions,
  buildPageMetadata,
  citationState,
  ctaActions,
  selectTheme
} from '../../src/lib/ui/system';

describe('global UI system contracts', () => {
  it('uses light on a first visit even when the system prefers dark', () => {
    expect(selectTheme(null)).toBe('light');
  });

  it('uses a stored theme override', () => {
    expect(selectTheme('dark')).toBe('dark');
    expect(selectTheme('light')).toBe('light');
  });

  it('builds canonical and social metadata from the deployment root', () => {
    expect(
      buildPageMetadata({
        description: 'A research record.',
        pathname: '/research/',
        title: 'Research'
      })
    ).toMatchObject({
      canonical: 'https://phantom-fs.github.io/research/',
      image: 'https://phantom-fs.github.io/images/og-research-atlas.jpg',
      title: 'Research | Farhan Sheth'
    });
  });

  it('orders only available publication artifacts consistently', () => {
    expect(
      artifactActions({
        code: 'https://example.edu/code',
        paper: 'https://example.edu/paper',
        poster: 'https://example.edu/poster'
      })
    ).toEqual([
      { href: 'https://example.edu/paper', label: 'Read paper', key: 'paper' },
      { href: 'https://example.edu/code', label: 'Code', key: 'code' },
      { href: 'https://example.edu/poster', label: 'Poster', key: 'poster' }
    ]);
  });

  it('orders reusable CTA groups by the approved primary, secondary, utility policy', () => {
    expect(
      ctaActions([
        { href: '/cv/', kind: 'utility', label: 'Download CV' },
        { href: '/research/', kind: 'secondary', label: 'Research' },
        { href: '/', kind: 'primary', label: 'Home' },
        {
          href: '/publications/',
          kind: 'secondary',
          label:
            'A deliberately long publication archive label that must remain readable'
        }
      ])
    ).toMatchObject([
      { kind: 'primary', label: 'Home' },
      { kind: 'secondary', label: 'Research' },
      {
        kind: 'secondary',
        label:
          'A deliberately long publication archive label that must remain readable'
      },
      { kind: 'utility', label: 'Download CV' }
    ]);
  });

  it('makes stale and unavailable citations explicit without relying on color', () => {
    expect(citationState(null)).toEqual({
      kind: 'unavailable',
      label: 'Unavailable'
    });
    expect(citationState({ stale: true, value: 8 })).toEqual({
      kind: 'stale',
      label: '8 citations · stale'
    });
    expect(citationState(null, true)).toEqual({
      kind: 'failure',
      label: 'Citation source failed'
    });
  });
});
