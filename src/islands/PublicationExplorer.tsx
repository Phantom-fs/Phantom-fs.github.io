import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  defaultExplorerState,
  filterPublications,
  parseExplorerState,
  serializeExplorerState,
  type ExplorerPublication,
  type ExplorerState,
  type ExplorerSort
} from '../lib/publications/explorer';

export interface ExplorerResultChange {
  ids: string[];
  state: ExplorerState;
}

interface Props {
  initialState?: ExplorerState;
  onResultsChange?: (change: ExplorerResultChange) => void;
  records: ExplorerPublication[];
}

const cloneState = (state: ExplorerState): ExplorerState => ({
  ...state,
  category: [...state.category],
  rank: [...state.rank],
  year: [...state.year]
});

const activeFilterCount = (state: ExplorerState) =>
  Number(Boolean(state.q)) +
  state.category.length +
  state.year.length +
  state.rank.length +
  Number(state.sort !== 'newest');

const isDefaultState = (state: ExplorerState) => activeFilterCount(state) === 0;

const stateSummary = (state: ExplorerState) => {
  const summary = [
    state.q ? `search “${state.q}”` : '',
    ...state.category,
    ...state.year.map(String),
    ...state.rank,
    state.sort === 'newest' ? '' : `sort ${state.sort}`
  ].filter(Boolean);
  return summary.length > 0 ? summary.join(' · ') : 'None';
};

const toggle = <T,>(values: T[], value: T) =>
  values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];

const optionLists = (records: ExplorerPublication[]) => ({
  categories: [...new Set(records.map(({ category }) => category))],
  ranks: [
    ...new Set(
      records.flatMap(({ rank }) =>
        rank ? [`${rank.system}:${rank.value}`] : []
      )
    )
  ],
  years: [...new Set(records.map(({ year }) => year))].sort((a, b) => b - a)
});

interface FilterFieldsProps {
  lists: ReturnType<typeof optionLists>;
  state: ExplorerState;
  update: (state: ExplorerState) => void;
}

const FilterFields = ({ lists, state, update }: FilterFieldsProps) => (
  <div class="publication-filter-fields">
    <fieldset>
      <legend>Research category</legend>
      {lists.categories.map((category) => (
        <label>
          <input
            checked={state.category.includes(category)}
            onInput={() =>
              update({ ...state, category: toggle(state.category, category) })
            }
            type="checkbox"
          />
          <span>{category}</span>
        </label>
      ))}
    </fieldset>
    <fieldset>
      <legend>Year</legend>
      {lists.years.map((year) => (
        <label>
          <input
            checked={state.year.includes(year)}
            onInput={() => update({ ...state, year: toggle(state.year, year) })}
            type="checkbox"
          />
          <span>{year}</span>
        </label>
      ))}
    </fieldset>
    {lists.ranks.length > 0 && (
      <fieldset>
        <legend>Rank evidence</legend>
        {lists.ranks.map((rank) => (
          <label>
            <input
              checked={state.rank.includes(rank)}
              onInput={() =>
                update({ ...state, rank: toggle(state.rank, rank) })
              }
              type="checkbox"
            />
            <span>{rank}</span>
          </label>
        ))}
      </fieldset>
    )}
  </div>
);

const sortOptions: Array<{ label: string; value: ExplorerSort }> = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Most cited', value: 'citations' },
  { label: 'Title A–Z', value: 'title' }
];

export default function PublicationExplorer({
  initialState,
  onResultsChange,
  records
}: Props) {
  const [state, setState] = useState<ExplorerState>(() =>
    cloneState(initialState ?? defaultExplorerState())
  );
  const [draft, setDraft] = useState<ExplorerState>(state);
  const initialSearchRef = useRef(
    typeof window === 'undefined' ? '' : window.location.search
  );
  const [browserStateRestored, setBrowserStateRestored] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const lists = useMemo(() => optionLists(records), [records]);
  const results = useMemo(
    () => filterPublications(records, state),
    [records, state]
  );
  const count = results.length;
  const countText = `Total publications: ${count}`;

  useEffect(() => {
    const restored = parseExplorerState(
      new URLSearchParams(initialSearchRef.current)
    );
    setState(restored);
    setDraft(cloneState(restored));
    setBrowserStateRestored(true);
  }, []);

  useEffect(() => {
    if (!browserStateRestored) return;
    const change = { ids: results.map(({ id }) => id), state };
    onResultsChange?.(change);
    const params = serializeExplorerState(state);
    const next = `${window.location.pathname}${params.size ? `?${params}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', next);
    window.dispatchEvent(
      new CustomEvent<ExplorerResultChange>('publicationexplorerstatechange', {
        detail: change
      })
    );
  }, [browserStateRestored, onResultsChange, results, state]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setAnnouncement(countText), 300);
    return () => window.clearTimeout(timeout);
  }, [countText]);

  useEffect(() => {
    const selectHashtag = (event: Event) => {
      const hashtag = (event as CustomEvent<{ hashtag?: string }>).detail
        ?.hashtag;
      if (hashtag) setState({ ...defaultExplorerState(), q: hashtag });
    };
    window.addEventListener('publicationexplorerhashtag', selectHashtag);
    return () =>
      window.removeEventListener('publicationexplorerhashtag', selectHashtag);
  }, []);

  const closeFilters = (commit: boolean) => {
    if (commit) setState(cloneState(draft));
    setFilterDialogOpen(false);
    dialogRef.current?.close();
    triggerRef.current?.focus();
  };

  const openFilters = () => {
    setDraft(cloneState(state));
    dialogRef.current?.showModal();
    setFilterDialogOpen(true);
  };

  return (
    <section aria-label="Publication explorer" class="publication-explorer">
      <div class="publication-explorer__controls">
        <div class="publication-explorer__search-sort">
          <label for="publication-search">Search publications</label>
          <input
            id="publication-search"
            name="q"
            onInput={(event) =>
              setState({ ...state, q: event.currentTarget.value })
            }
            placeholder="Title, author, venue, abstract, or hashtag"
            role="searchbox"
            type="search"
            value={state.q}
          />
          <label for="publication-sort">Sort results</label>
          <select
            id="publication-sort"
            onInput={(event) =>
              setState({
                ...state,
                sort: event.currentTarget.value as ExplorerSort
              })
            }
            value={state.sort}
          >
            {sortOptions.map(({ label, value }) => (
              <option value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div class="publication-explorer__mobile-actions">
          <button
            aria-expanded={filterDialogOpen ? 'true' : 'false'}
            aria-describedby="publication-filter-scope"
            class="control"
            onClick={openFilters}
            ref={triggerRef}
            type="button"
          >
            Filters <span data-filter-count>{activeFilterCount(state)}</span>
          </button>
          {!isDefaultState(state) && (
            <button
              class="action action--utility"
              onClick={() => setState(defaultExplorerState())}
              type="button"
            >
              Clear filters
            </button>
          )}
        </div>
        <p
          class="publication-explorer__filter-scope"
          id="publication-filter-scope"
        >
          Research category · Year · Rank evidence
        </p>
      </div>
      <aside
        aria-label="Publication filters"
        class="publication-explorer__desktop-filters"
      >
        <FilterFields lists={lists} state={state} update={setState} />
        {!isDefaultState(state) && (
          <button
            class="action action--utility"
            onClick={() => setState(defaultExplorerState())}
            type="button"
          >
            Clear filters
          </button>
        )}
      </aside>
      <dialog
        aria-labelledby="publication-filter-title"
        class="publication-filter-dialog"
        onCancel={(event) => {
          event.preventDefault();
          closeFilters(false);
        }}
        onClick={(event) => {
          if (event.currentTarget === event.target) closeFilters(false);
        }}
        ref={dialogRef}
      >
        <div class="publication-filter-dialog__content">
          <div class="publication-filter-dialog__heading">
            <h2 id="publication-filter-title">Filter publications</h2>
            <button
              class="control"
              onClick={() => closeFilters(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
          <FilterFields lists={lists} state={draft} update={setDraft} />
          <div class="publication-filter-dialog__actions">
            <button
              class="action action--utility"
              onClick={() => setDraft(defaultExplorerState())}
              type="button"
            >
              Clear
            </button>
            <button
              class="action action--primary"
              onClick={() => closeFilters(true)}
              type="button"
            >
              Apply filters
            </button>
          </div>
        </div>
      </dialog>
      <div class="publication-explorer__state">
        <p data-publication-visible-count>{countText}</p>
        <p
          aria-live="polite"
          class="visually-hidden"
          data-publication-result-count
        >
          {announcement}
        </p>
        <p>
          <strong>Active filters:</strong>{' '}
          <span data-active-filter-summary>{stateSummary(state)}</span>
        </p>
      </div>
    </section>
  );
}
