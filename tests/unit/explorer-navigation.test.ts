// @vitest-environment jsdom
import { h } from 'preact';
import { act, cleanup, render, waitFor } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';
import PublicationExplorer from '../../src/islands/PublicationExplorer';

it('does not write an outgoing publication query onto the next route', async () => {
  window.history.replaceState({ index: 2 }, '', '/research/?q=herald#clinical');
  const write = vi.spyOn(window.history, 'replaceState');
  const view = render(h(PublicationExplorer, { records: [] }));
  await waitFor(() =>
    expect((view.getByRole('searchbox') as HTMLInputElement).value).toBe(
      'herald'
    )
  );
  await act(() => Promise.resolve());
  expect(write).not.toHaveBeenCalled();
  cleanup();
  write.mockRestore();
});
