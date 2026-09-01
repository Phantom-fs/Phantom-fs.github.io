const catalogForCurrentRoute = () =>
  document.querySelector('[data-publication-catalog]');

const recordsFor = (catalog) =>
  catalog ? [...catalog.querySelectorAll('[data-publication-record]')] : [];

const groupsFor = (catalog) =>
  catalog ? [...catalog.querySelectorAll('[data-publication-category]')] : [];

const updateDetailReturnLinks = () => {
  const catalog = catalogForCurrentRoute();
  if (!catalog) return;
  const returnQuery = window.location.search.slice(1);
  const detailLinks = [
    ...catalog.querySelectorAll('a[data-publication-title]')
  ].filter((link) => {
    const url = new URL(link.href, window.location.origin);
    return (
      url.origin === window.location.origin &&
      /^\/publications\/[^/]+\/$/.test(url.pathname)
    );
  });
  for (const link of detailLinks) {
    const pathname =
      link.dataset.publicationDetailPath ??
      new URL(link.href, window.location.origin).pathname;
    link.dataset.publicationDetailPath = pathname;
    const destination = new URL(pathname, window.location.origin);
    if (returnQuery) destination.searchParams.set('return', returnQuery);
    link.setAttribute('href', `${destination.pathname}${destination.search}`);
  }
};

const restoreDefaultGroups = (catalog, records, groups, noResults) => {
  for (const record of records) {
    const category = record.dataset.category;
    const destination = catalog.querySelector(
      `[data-publication-category="${CSS.escape(category ?? '')}"] [data-publication-category-records]`
    );
    destination?.append(record);
  }
  for (const group of groups) group.hidden = false;
  noResults?.setAttribute('hidden', '');
};

const applyExplorerState = (event) => {
  const detail = event.detail;
  const catalog = catalogForCurrentRoute();
  if (!detail || !catalog) return;
  const records = recordsFor(catalog);
  const groups = groupsFor(catalog);
  const noResults = catalog.querySelector('[data-publication-no-results]');
  restoreDefaultGroups(catalog, records, groups, noResults);
  const byId = new Map(
    records.map((record) => [record.dataset.publicationId, record])
  );
  for (const record of records) {
    if (!detail.ids.includes(record.dataset.publicationId ?? ''))
      record.setAttribute('hidden', '');
  }
  for (const id of detail.ids) {
    const record = byId.get(id);
    const category = record?.dataset.category;
    const destination = catalog.querySelector(
      `[data-publication-category="${CSS.escape(category ?? '')}"] [data-publication-category-records]`
    );
    if (record && destination) {
      record.removeAttribute('hidden');
      destination.append(record);
    }
  }
  for (const group of groups) {
    group.hidden = !group.querySelector(
      '[data-publication-record]:not([hidden])'
    );
  }
  if (detail.ids.length === 0) noResults?.removeAttribute('hidden');
  else noResults?.setAttribute('hidden', '');
  updateDetailReturnLinks();
};

const selectHashtag = (event) => {
  const target = event.target.closest('[data-publication-hashtag]');
  if (!target) return;
  window.dispatchEvent(
    new CustomEvent('publicationexplorerhashtag', {
      detail: { hashtag: target.dataset.publicationHashtag }
    })
  );
};

if (!document.documentElement.dataset.publicationCatalogLifecycle) {
  document.documentElement.dataset.publicationCatalogLifecycle = 'bound';
  window.addEventListener('publicationexplorerstatechange', applyExplorerState);
  document.addEventListener('click', selectHashtag);
  document.addEventListener('astro:after-swap', updateDetailReturnLinks);
}

updateDetailReturnLinks();
