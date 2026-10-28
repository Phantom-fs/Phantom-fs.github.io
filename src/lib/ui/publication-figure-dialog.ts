let cleanup = () => {};
const initialize = () => {
  cleanup();
  const dialog = document.querySelector<HTMLDialogElement>(
    '[data-figure-dialog]'
  );
  const catalog = document.querySelector<HTMLElement>(
    '[data-publication-catalog]'
  );
  if (!dialog || !catalog) return;
  const controller = new AbortController();
  const { signal } = controller;
  let trigger: HTMLAnchorElement | null = null;
  catalog.querySelectorAll('[data-publication-figure]').forEach((link) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', dialog.id);
  });
  catalog.addEventListener(
    'click',
    (event) => {
      // Preserve standard modified-click image navigation.
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const target = (event.target as Element).closest<HTMLAnchorElement>(
        '[data-publication-figure]'
      );
      if (!target) return;
      event.preventDefault();
      trigger = target;
      const image = dialog.querySelector<HTMLImageElement>(
        '[data-figure-image]'
      )!;
      image.src = target.href;
      image.alt = target.querySelector('img')?.alt ?? '';
      dialog.querySelector('[data-figure-caption]')!.textContent = (
        target.dataset.figureCaption ?? ''
      )
        .trim()
        .replace(/\.+$/, '');
      dialog.querySelector<HTMLAnchorElement>('[data-figure-original]')!.href =
        target.href;
      dialog.showModal();
      dialog.scrollTop = 0;
      dialog.querySelector<HTMLButtonElement>('[data-figure-close]')?.focus();
    },
    { signal }
  );
  dialog
    .querySelector('[data-figure-close]')
    ?.addEventListener('click', () => dialog.close(), { signal });
  dialog.addEventListener(
    'click',
    (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        dialog.close();
    },
    { signal }
  );
  dialog.addEventListener(
    'close',
    () => {
      if (trigger?.isConnected && !trigger.closest('[hidden]')) trigger.focus();
    },
    { signal }
  );
  cleanup = () => {
    if (dialog.open) dialog.close();
    controller.abort();
  };
};
document.addEventListener('astro:before-swap', () => cleanup());
document.addEventListener('astro:after-swap', initialize);
initialize();
export {};
