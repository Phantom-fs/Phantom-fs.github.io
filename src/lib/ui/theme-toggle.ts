const root = document.documentElement;
const storageKey = 'atlas-theme';
let transitionTimer: ReturnType<typeof setTimeout> | undefined;
const finishThemeTransition = () => {
  clearTimeout(transitionTimer);
  delete root.dataset.themeChanging;
};

const updateButton = (button: HTMLButtonElement) => {
  if (!button) return;
  const dark = root.dataset.theme === 'dark';
  button.setAttribute('aria-pressed', String(dark));
  button.setAttribute(
    'aria-label',
    dark ? 'Use light theme' : 'Use dark theme'
  );
};

const initializeThemeToggle = () => {
  const button = document.querySelector<HTMLButtonElement>(
    '[data-theme-toggle]'
  );

  if (!button) return;

  updateButton(button);
  if (button.dataset.themeToggleInitialized === 'true') return;

  button.dataset.themeToggleInitialized = 'true';
  button.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    finishThemeTransition();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.dataset.themeChanging = 'true';
      // Establish the current colors before switching the CSS token values.
      void root.offsetWidth;
      transitionTimer = setTimeout(finishThemeTransition, 360);
    }
    root.dataset.theme = nextTheme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', nextTheme === 'dark' ? '#202325' : '#FAFAF8');
    try {
      localStorage.setItem(storageKey, nextTheme);
    } catch {
      // The selected theme remains available for the current page session.
    }
    updateButton(button);
  });
};

const lifecycleHost = window as typeof window & {
  atlasThemeToggleLifecycle?: AbortController;
};
lifecycleHost.atlasThemeToggleLifecycle?.abort();
const lifecycle = new AbortController();
lifecycleHost.atlasThemeToggleLifecycle = lifecycle;

initializeThemeToggle();
document.addEventListener('astro:before-swap', finishThemeTransition, {
  signal: lifecycle.signal
});
document.addEventListener('astro:after-swap', initializeThemeToggle, {
  signal: lifecycle.signal
});
export {};
