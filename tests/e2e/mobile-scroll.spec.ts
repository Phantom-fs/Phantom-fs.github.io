import { expect, test } from '@playwright/test';

test.use({ contextOptions: { reducedMotion: 'reduce' } });
test.beforeEach(async ({ page }) => {
  await page.route('https://mapmyvisitors.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'application/javascript' })
  );
});

for (const width of [320, 390, 767, 768, 1440]) {
  test(`opportunities and actions follow the responsive alignment at ${width}px`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/about/', '/research/', '/projects/']) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const sections =
        route === '/'
          ? ['.research-opportunity', '.collaboration-callout']
          : route === '/about/'
            ? ['.research-opportunity']
            : ['.research-cta'];
      for (const selector of sections) {
        const layout = await page.locator(selector).evaluate((section) => {
          const frame = section
            .querySelector('.frame')!
            .getBoundingClientRect();
          const actions = section
            .querySelector('.action-group')!
            .getBoundingClientRect();
          const buttons = Array.from(section.querySelectorAll('.action')).map(
            (button) => button.getBoundingClientRect()
          );
          const contact = section.querySelector('.opportunity-layout__contact');
          const copy = contact?.querySelector('p')?.getBoundingClientRect();
          return {
            frameLeft: frame.left,
            frameRight: frame.right,
            actionsLeft: actions.left,
            actionsRight: actions.right,
            natural: buttons.every((button) => button.width < frame.width - 8),
            copyLeft: copy?.left,
            copyRight: copy?.right,
            textAlign: contact ? getComputedStyle(contact).textAlign : null,
            gap: copy ? actions.top - copy.bottom : null
          };
        });
        if (width < 768) {
          expect(layout.actionsLeft).toBeCloseTo(layout.frameLeft, 0);
          expect(layout.natural).toBe(true);
          if (layout.copyLeft !== undefined) {
            expect(layout.copyLeft).toBeCloseTo(layout.frameLeft, 0);
            expect(layout.textAlign).toBe('left');
          }
        } else {
          expect(layout.actionsRight).toBeCloseTo(layout.frameRight, 0);
          if (layout.copyRight !== undefined)
            expect(layout.textAlign).toBe('right');
        }
        if (layout.gap !== null) expect(layout.gap).toBeCloseTo(8, 0);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
      if (route === '/') {
        const titles = await page
          .locator(
            '.collaboration-callout h2, .opportunity-layout h2, .impact-metrics__heading h2'
          )
          .evaluateAll((elements) =>
            elements.map((element) => {
              const style = getComputedStyle(element);
              return [
                style.fontSize,
                style.fontFamily,
                style.fontWeight,
                style.color
              ];
            })
          );
        expect(titles).toHaveLength(3);
        expect(titles[0]).toEqual(titles[1]);
        expect(titles[1]).toEqual(titles[2]);
        expect(
          (await page.locator('.visitor-map__widget').boundingBox())!.width
        ).toBeLessThanOrEqual(640);
        const frame = (await page
          .locator('.visitor-map__frame')
          .boundingBox())!;
        const heading = (await page
          .locator('.visitor-map__heading')
          .boundingBox())!;
        expect(frame.x).toBeCloseTo(heading.x, 0);
        expect(frame.width).toBeCloseTo(heading.width, 0);
      }
    }
  });
}

for (const theme of ['light', 'dark']) {
  test(`scrollbars reveal only over their gutter in ${theme}`, async ({
    page
  }) => {
    await page.addInitScript(
      (value) => localStorage.setItem('atlas-theme', value),
      theme
    );
    await page.goto('/');
    for (const label of ['Research news', 'Research areas list']) {
      const region = page.getByRole('region', { name: label, exact: true });
      const readColor = () =>
        region.evaluate((element) =>
          CSS.supports('scrollbar-color', 'red transparent')
            ? getComputedStyle(element).scrollbarColor
            : getComputedStyle(element, '::-webkit-scrollbar-thumb')
                .backgroundColor
        );
      await region.hover();
      const idle = await readColor();
      expect(idle).toContain('0.08');
      await page.mouse.wheel(0, 180);
      await expect
        .poll(() => region.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0);
      await expect.poll(readColor).toBe(idle);
      await region.focus();
      await expect.poll(readColor).toBe(idle);
      await region.hover({
        position: { x: (await region.boundingBox())!.width - 3, y: 20 }
      });
      const revealed =
        theme === 'light' ? 'rgb(131, 147, 162)' : 'rgb(154, 169, 182)';
      await expect.poll(readColor).toContain(revealed);
      await region.hover({ position: { x: 20, y: 20 } });
      await expect.poll(readColor).toBe(idle);
      await region.blur();
    }
  });

  test(`Home research list scrolls independently and retains its rules in ${theme}`, async ({
    page
  }) => {
    await page.addInitScript(
      (value) => localStorage.setItem('atlas-theme', value),
      theme
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const region = page.getByRole('region', {
      name: 'Research areas list',
      exact: true
    });
    await expect(region).toHaveAttribute('tabindex', '0');
    await expect(region.locator('[data-domain-relationship]')).toHaveCount(6);
    await expect(
      region.getByText('How the work connects', { exact: true })
    ).toHaveCount(0);
    await expect(
      region.getByRole('heading', { name: 'Research areas', exact: true })
    ).toHaveCount(0);
    await expect(
      region.locator('.domain-relationship-index__domains')
    ).toHaveCSS('border-top-width', '1px');
    await expect(
      region.locator('[data-domain-relationship]').first()
    ).toHaveCSS('border-left-width', '1px');
    await region.hover();
    const intro = page.locator('#home-atlas-title');
    const before = (await intro.boundingBox())!.y;
    await page.mouse.wheel(0, 250);
    await expect
      .poll(() => region.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    expect((await intro.boundingBox())!.y).toBeCloseTo(before, 0);
    await region.evaluate((element) => (element.scrollTop = 0));
    await region.focus();
    await page.keyboard.press('End');
    await expect
      .poll(() => region.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    const color = await region.evaluate((element) =>
      CSS.supports('scrollbar-color', 'red transparent')
        ? getComputedStyle(element).scrollbarColor
        : getComputedStyle(element, '::-webkit-scrollbar-thumb').backgroundColor
    );
    expect(color).toContain('0.08');
  });
}

test('scrollbar pointer activity cleans up and rebinds across client navigation', async ({
  page
}) => {
  await page.goto('/');
  const region = page.getByRole('region', {
    name: 'Research news',
    exact: true
  });
  const old = (await region.elementHandle())!;
  await region.hover({
    position: { x: (await region.boundingBox())!.width - 3, y: 20 }
  });
  await expect(region).toHaveAttribute('data-scrollbar-hover', 'true');
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Research', exact: true })
    .click();
  await expect(page.locator('main')).toHaveAttribute('data-route', 'research');
  expect(
    await old.evaluate(
      (element) => (element as HTMLElement).dataset.scrollbarHover
    )
  ).toBeUndefined();
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Home', exact: true })
    .click();
  await expect(page.locator('main')).toHaveAttribute('data-route', 'home');
  await region.hover({
    position: { x: (await region.boundingBox())!.width - 3, y: 20 }
  });
  await expect(region).toHaveAttribute('data-scrollbar-hover', 'true');
  await region.hover({ position: { x: 20, y: 20 } });
  await expect(region).not.toHaveAttribute('data-scrollbar-hover');
});
