let cleanup = () => {};

const initializeScrollActivity = () => {
  cleanup();
  const regions = Array.from(
    document.querySelectorAll<HTMLElement>('.content-scroll')
  );
  const controller = new AbortController();
  const timers = new Map<HTMLElement, number>();

  regions.forEach((region) => {
    region.addEventListener(
      'scroll',
      () => {
        region.dataset.scrolling = 'true';
        const previous = timers.get(region);
        if (previous !== undefined) window.clearTimeout(previous);
        timers.set(
          region,
          window.setTimeout(() => {
            delete region.dataset.scrolling;
            timers.delete(region);
          }, 800)
        );
      },
      { passive: true, signal: controller.signal }
    );
  });

  cleanup = () => {
    controller.abort();
    timers.forEach((timer) => window.clearTimeout(timer));
    regions.forEach((region) => delete region.dataset.scrolling);
  };
};

document.addEventListener('astro:before-swap', () => cleanup());
document.addEventListener('astro:after-swap', initializeScrollActivity);
initializeScrollActivity();
export {};
