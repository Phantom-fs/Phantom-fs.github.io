let cleanup = () => {};

const initializeScrollActivity = () => {
  cleanup();
  const regions = Array.from(
    document.querySelectorAll<HTMLElement>('.content-scroll')
  );
  const controller = new AbortController();
  regions.forEach((region) => {
    const update = (event: PointerEvent) => {
      const bounds = region.getBoundingClientRect();
      const gutter = Math.max(8, region.offsetWidth - region.clientWidth);
      const onScrollbar =
        event.clientX >= bounds.right - gutter && event.clientX <= bounds.right;
      if (onScrollbar) region.dataset.scrollbarHover = 'true';
      else delete region.dataset.scrollbarHover;
    };
    region.addEventListener('pointermove', update, {
      passive: true,
      signal: controller.signal
    });
    region.addEventListener('pointerenter', update, {
      passive: true,
      signal: controller.signal
    });
    region.addEventListener(
      'pointerleave',
      () => delete region.dataset.scrollbarHover,
      { signal: controller.signal }
    );
    region.addEventListener(
      'pointerdown',
      (event) => {
        update(event);
        if (region.dataset.scrollbarHover)
          region.dataset.scrollbarPressed = 'true';
      },
      { passive: true, signal: controller.signal }
    );
    const release = () => delete region.dataset.scrollbarPressed;
    window.addEventListener('pointerup', release, {
      signal: controller.signal
    });
    window.addEventListener('pointercancel', release, {
      signal: controller.signal
    });
  });

  cleanup = () => {
    controller.abort();
    regions.forEach((region) => {
      delete region.dataset.scrollbarHover;
      delete region.dataset.scrollbarPressed;
    });
  };
};

document.addEventListener('astro:before-swap', () => cleanup());
document.addEventListener('astro:after-swap', initializeScrollActivity);
initializeScrollActivity();
export {};
