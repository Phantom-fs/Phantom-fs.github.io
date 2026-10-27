type ChapterTabsDocument = Document & {
  chapterTabsAfterSwap?: () => void;
  chapterTabsBeforeSwap?: () => void;
};
type ChapterTabsElement = HTMLElement & {
  chapterTabsCleanup?: () => void;
};

const chapterTabsDocument = document as ChapterTabsDocument;

const cleanupChapterTabs = () => {
  const chapter = document.querySelector<ChapterTabsElement>('[data-chapter]');
  chapter?.chapterTabsCleanup?.();
};

const initializeChapterTabs = () => {
  cleanupChapterTabs();
  const chapter = document.querySelector<ChapterTabsElement>('[data-chapter]');
  if (!chapter) return;
  // History can move before Astro swaps the old DOM or finishes loading a module.
  // The rendered chapter owns its route; the current browser URL may already differ.
  const chapterPathname = chapter.dataset.chapterPath;
  if (!chapterPathname || window.location.pathname !== chapterPathname) return;
  const atlas = chapter.querySelector<HTMLElement>('[data-chapter-index]');
  if (!atlas) return;
  const domains = [
    ...chapter!.querySelectorAll<HTMLElement>('[data-chapter-panel]')
  ];
  const selectors = [
    ...atlas!.querySelectorAll<HTMLAnchorElement>('[data-domain-selector]')
  ];
  const cards = selectors.map(
    (selector) =>
      selector.closest('[data-domain-relationship]') as HTMLElement | null
  );
  const defaultSlug = domains[0]?.id;

  if (
    !chapter ||
    !atlas ||
    !defaultSlug ||
    domains.length === 0 ||
    selectors.length !== domains.length ||
    cards.some((card) => !card) ||
    !domains.every((domain) =>
      selectors.some(
        (selector) => selector.dataset.domainSelector === domain.id
      )
    )
  ) {
    return;
  }

  const controller = new AbortController();
  chapter.chapterTabsCleanup = () => {
    controller.abort();
    delete chapter.chapterTabsCleanup;
  };

  const setSelection = (
    slug: string,
    moveFocus = false,
    scrollToPanel = false
  ) => {
    const selectedDomain = domains.find((domain) => domain.id === slug);
    if (!selectedDomain) return;

    atlas.dataset.currentDomain = slug;
    selectors.forEach((selector) => {
      const selected = selector.dataset.domainSelector === slug;
      selector.setAttribute('aria-selected', String(selected));
      selector.tabIndex = selected ? 0 : -1;
      selector
        .closest<HTMLElement>('[data-domain-relationship]')
        ?.setAttribute('data-selected', String(selected));
      if (selected && moveFocus) selector.focus();
    });
    domains.forEach((domain) => {
      domain.hidden = domain !== selectedDomain;
    });
    if (scrollToPanel) {
      selectedDomain.scrollIntoView({ block: 'start' });
    }
  };

  const normalizeHash = () => {
    // popstate fires before Astro swaps the old Research DOM on route changes.
    if (window.location.pathname !== chapterPathname) return;
    const requestedSlug = window.location.hash.slice(1);
    const slug = domains.some((domain) => domain.id === requestedSlug)
      ? requestedSlug
      : defaultSlug;
    if (window.location.hash !== `#${slug}`) {
      window.history.replaceState(window.history.state, '', `#${slug}`);
    }
    setSelection(slug);
  };

  cards.forEach((card) => {
    card!.setAttribute('role', 'presentation');
    card!.removeAttribute('aria-current');
  });

  selectors.forEach((selector, index) => {
    const slug = selector.dataset.domainSelector;
    if (!slug) return;
    selector.id = `${chapter.dataset.chapter}-domain-tab-${slug}`;
    selector.setAttribute('aria-controls', slug);
    selector.setAttribute('role', 'tab');
    selector.addEventListener(
      'pointerdown',
      (event) => event.preventDefault(),
      { signal: controller.signal }
    );
    cards[index]!.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        setSelection(slug, false, true);
        if (window.location.hash !== `#${slug}`) {
          window.history.pushState(window.history.state, '', `#${slug}`);
        }
      },
      { signal: controller.signal }
    );
    selector.addEventListener(
      'keydown',
      (event) => {
        const nextIndex =
          event.key === 'ArrowRight' || event.key === 'ArrowDown'
            ? (index + 1) % selectors.length
            : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
              ? (index - 1 + selectors.length) % selectors.length
              : event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? selectors.length - 1
                  : null;
        if (nextIndex !== null) {
          event.preventDefault();
          const nextSlug = selectors[nextIndex].dataset.domainSelector;
          if (nextSlug) {
            setSelection(nextSlug, true);
            window.history.pushState(window.history.state, '', `#${nextSlug}`);
          }
        }
        if (event.key === ' ') {
          event.preventDefault();
          setSelection(slug, true);
          if (window.location.hash !== `#${slug}`) {
            window.history.pushState(window.history.state, '', `#${slug}`);
          }
        }
      },
      { signal: controller.signal }
    );
  });
  domains.forEach((domain) => {
    domain.setAttribute('role', 'tabpanel');
    domain.setAttribute(
      'aria-labelledby',
      `${chapter.dataset.chapter}-domain-tab-${domain.id}`
    );
  });
  atlas
    .querySelector<HTMLElement>('.domain-relationship-index__domains')
    ?.setAttribute('role', 'tablist');
  chapter.dataset.chapterEnhanced = 'true';
  if (chapter.dataset.chapter === 'research')
    chapter.dataset.researchEnhanced = 'true';
  window.addEventListener('hashchange', normalizeHash, {
    signal: controller.signal
  });
  window.addEventListener('popstate', normalizeHash, {
    signal: controller.signal
  });
  normalizeHash();
};

const initializeChapterTabsAfterSwap = () => {
  if (document.querySelector('[data-chapter]')) {
    initializeChapterTabs();
  }
};

chapterTabsDocument.chapterTabsBeforeSwap?.();
if (chapterTabsDocument.chapterTabsBeforeSwap) {
  document.removeEventListener(
    'astro:before-swap',
    chapterTabsDocument.chapterTabsBeforeSwap
  );
}
if (chapterTabsDocument.chapterTabsAfterSwap) {
  document.removeEventListener(
    'astro:after-swap',
    chapterTabsDocument.chapterTabsAfterSwap
  );
}
chapterTabsDocument.chapterTabsBeforeSwap = cleanupChapterTabs;
chapterTabsDocument.chapterTabsAfterSwap = initializeChapterTabsAfterSwap;
document.addEventListener('astro:before-swap', cleanupChapterTabs);
document.addEventListener('astro:after-swap', initializeChapterTabsAfterSwap);
initializeChapterTabs();
export {};
