// @vitest-environment jsdom
import { expect, it } from 'vitest';

it('does not normalize an outgoing chapter after history has moved to another route', async () => {
  window.history.replaceState({ index: 1 }, '', '/publications/?q=herald');
  document.body.innerHTML = `<main data-route="research"><section data-chapter="research" data-chapter-path="/research/"><nav data-chapter-index><ol class="domain-relationship-index__domains"><li data-domain-relationship="clinical"><a data-domain-selector="clinical" href="#clinical">Clinical</a></li></ol></nav><article id="clinical" data-chapter-panel></article></section></main>`;
  await import('../../src/lib/ui/chapter-tabs');
  expect(
    window.location.pathname + window.location.search + window.location.hash
  ).toBe('/publications/?q=herald');
  expect(
    document
      .querySelector('[data-chapter]')
      ?.hasAttribute('data-chapter-enhanced')
  ).toBe(false);
  document.dispatchEvent(new Event('astro:before-swap'));
});
