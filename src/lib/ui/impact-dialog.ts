let cleanup = () => {};
const initialize = () => {
  cleanup();
  const dialog = document.querySelector<HTMLDialogElement>(
    '[data-impact-dialog]'
  );
  if (!dialog) return;
  const controller = new AbortController();
  let trigger: HTMLElement | null = null;
  document
    .querySelectorAll<HTMLAnchorElement>('[data-impact-trigger]')
    .forEach((link) => {
      link.setAttribute('aria-haspopup', 'dialog');
      link.setAttribute('aria-controls', dialog.id);
      link.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          trigger = link;
          dialog
            .querySelectorAll<HTMLElement>('[data-impact-panel]')
            .forEach(
              (panel) =>
                (panel.hidden =
                  panel.dataset.impactPanel !== link.dataset.impactTrigger)
            );
          const title = dialog.querySelector<HTMLElement>(
            '[data-impact-panel]:not([hidden]) h2'
          );
          if (title) dialog.setAttribute('aria-labelledby', title.id);
          dialog.showModal();
          dialog.scrollTop = 0;
        },
        { signal: controller.signal }
      );
    });
  dialog
    .querySelector('[data-impact-close]')
    ?.addEventListener('click', () => dialog.close(), {
      signal: controller.signal
    });
  dialog.addEventListener(
    'click',
    (event) => {
      if (event.target === dialog) {
        const bounds = dialog.getBoundingClientRect();
        const pointer = event as MouseEvent;
        if (
          pointer.clientX < bounds.left ||
          pointer.clientX > bounds.right ||
          pointer.clientY < bounds.top ||
          pointer.clientY > bounds.bottom
        )
          dialog.close();
      }
    },
    { signal: controller.signal }
  );
  dialog.addEventListener('close', () => trigger?.focus(), {
    signal: controller.signal
  });
  cleanup = () => {
    if (dialog.open) dialog.close();
    controller.abort();
  };
};
document.addEventListener('astro:before-swap', () => cleanup());
document.addEventListener('astro:after-swap', initialize);
initialize();
export {};
