import { expect, test } from '@playwright/test';

test.use({ contextOptions: { reducedMotion: 'reduce' } });
test.beforeEach(async ({ page }) => {
  await page.route('https://mapmyvisitors.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'application/javascript' })
  );
});

for (const theme of ['light', 'dark'] as const) {
  test(`link families have distinct hover colors in ${theme}`, async ({
    page
  }) => {
    await page.addInitScript(
      (value) => localStorage.setItem('atlas-theme', value),
      theme
    );
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const hoverColor =
      theme === 'light' ? 'rgb(48, 79, 115)' : 'rgb(200, 216, 235)';
    for (const selector of [
      '.home-hero__venue',
      '.home-hero__profile',
      '.site-footer__links a',
      '.site-footer__contact',
      '.editorial-picks__title',
      '.domain-relationship-index__links a'
    ]) {
      const link = page.locator(selector).first();
      await page.mouse.move(0, 0);
      const resting = await link.evaluate(
        (element) => getComputedStyle(element).color
      );
      await link.hover();
      await expect(link).toHaveCSS('color', hoverColor);
      expect(hoverColor).not.toBe(resting);
    }
    const profiles = page.locator('.home-hero__profiles');
    await expect(profiles.locator('a')).toHaveCount(5);
    await expect(profiles.getByText('DBLP', { exact: true })).toHaveCount(0);
    await expect(
      profiles.getByText('Hugging Face', { exact: true })
    ).toHaveCount(0);
    await expect(
      page.locator('.site-footer').getByText('DBLP', { exact: true })
    ).toBeVisible();
    await expect(
      page.locator('.site-footer').getByText('Hugging Face', { exact: true })
    ).toBeVisible();
    await page.goto('/publications/');
    for (const selector of [
      '.publication-identity__title a',
      '.publication-hashtag'
    ]) {
      const link = page.locator(selector).first();
      const resting = await link.evaluate(
        (element) => getComputedStyle(element).color
      );
      await link.hover();
      await expect(link).toHaveCSS('color', hoverColor);
      expect(hoverColor).not.toBe(resting);
    }
    const headingColor = await page
      .locator('[data-publication-category] > h2')
      .first()
      .evaluate((element) => getComputedStyle(element).color);
    expect(headingColor).not.toBe(
      await page
        .locator('.publication-identity__title a')
        .first()
        .evaluate((element) => getComputedStyle(element).color)
    );
  });
}

for (const width of [390, 1440]) {
  test(`headings and shared closing sections retain hierarchy at ${width}px`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const sizes: number[] = [];
    const closings: string[] = [];
    for (const [route, selector] of [
      ['/research/', '.research-domain:not([hidden]) > h2'],
      ['/projects/', '.project-case-study__header > h2'],
      ['/about/', '.about-section__heading > h2'],
      ['/overview/', '.overview-section__heading > h2']
    ]) {
      await page.goto(route);
      const section = page.locator(selector).first();
      const size = await section.evaluate((element) =>
        parseFloat(getComputedStyle(element).fontSize)
      );
      const pageSize = await page
        .locator('h1')
        .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
      expect(size).toBeGreaterThanOrEqual(28);
      expect(size).toBeLessThanOrEqual(32);
      expect(size).toBeLessThan(pageSize);
      sizes.push(size);
      if (route === '/research/') {
        const navigationHeading = page.locator(
          '.research-chapter .domain-relationship-index__heading > h2'
        );
        const tab = page.getByRole('tab').first();
        const headingSize = await navigationHeading.evaluate((element) =>
          parseFloat(getComputedStyle(element).fontSize)
        );
        const tabSize = await tab.evaluate((element) =>
          parseFloat(getComputedStyle(element).fontSize)
        );
        expect(headingSize).toBe(size);
        expect(tabSize).toBeLessThanOrEqual(18);
        expect(tabSize).toBeLessThan(headingSize);
        await expect(tab).toHaveCSS('min-height', '44px');
      }
      if (route === '/research/' || route === '/projects/') {
        const closing = page.locator('.research-cta');
        closings.push(await closing.innerText());
        const aligned = await closing.evaluate((section) => {
          const inner = section
            .querySelector('.research-cta__inner')!
            .getBoundingClientRect();
          const actions = Array.from(section.querySelectorAll('.action')).map(
            (element) => element.getBoundingClientRect()
          );
          return (
            Math.abs(inner.right - actions[1].right) < 1 &&
            Math.abs(actions[0].top - actions[1].top) < 1 &&
            section.querySelectorAll('h2').length === 0
          );
        });
        expect(aligned).toBe(true);
      }
      if (route === '/about/') {
        expect(
          await page
            .locator('.about-section__heading h2, .about-opportunity h2')
            .evaluateAll((headings) =>
              headings.every(
                (heading) =>
                  parseFloat(getComputedStyle(heading).fontWeight) === 550
              )
            )
        ).toBe(true);
        expect(
          await page
            .locator('.experience-timeline h3, .about-list h3')
            .evaluateAll((headings) =>
              headings.every(
                (heading) =>
                  parseFloat(getComputedStyle(heading).fontSize) <= 22
              )
            )
        ).toBe(true);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
    }
    expect(new Set(sizes).size).toBe(1);
    expect(closings[0]).toBe(closings[1]);
  });
}

test('Home alignment and Home/About opportunities share the same rhythm', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const opportunityMeasurements = [];
  for (const route of ['/', '/about/']) {
    await page.goto(route);
    opportunityMeasurements.push(
      await page.locator('.research-opportunity').evaluate((section) => {
        const title = section.querySelector('h2')!.getBoundingClientRect();
        const grid = section
          .querySelector('.opportunity-layout')!
          .getBoundingClientRect();
        const contact = section.querySelector('.opportunity-layout__contact')!;
        const [copy, actions] = Array.from(contact.children).map((element) =>
          element.getBoundingClientRect()
        );
        const style = getComputedStyle(section);
        return {
          top: style.paddingTop,
          bottom: style.paddingBottom,
          titleSize: getComputedStyle(section.querySelector('h2')!).fontSize,
          gap: actions.top - copy.bottom,
          aligned:
            Math.abs(grid.right - copy.right) < 1 &&
            Math.abs(copy.right - actions.right) < 1 &&
            Math.abs(title.y + title.height / 2 - grid.y - grid.height / 2) < 1
        };
      })
    );
  }
  expect(opportunityMeasurements[0]).toEqual(opportunityMeasurements[1]);
  expect(opportunityMeasurements[0].gap).toBeCloseTo(16, 0);
  expect(opportunityMeasurements[0].aligned).toBe(true);
  await page.goto('/');
  const alignment = await page.evaluate(() => {
    const domain = document.querySelector(
      '.home-atlas [data-domain-relationship]'
    )!;
    const title = domain.querySelector('h3')!;
    const link = domain.querySelector('.domain-relationship-index__links a')!;
    const collaboration = document.querySelector(
      '.collaboration-callout__inner'
    )!;
    const copy = collaboration.firstElementChild!.getBoundingClientRect();
    const action = collaboration
      .querySelector('.action')!
      .getBoundingClientRect();
    return {
      domain: Math.abs(
        title.getBoundingClientRect().x - link.getBoundingClientRect().x
      ),
      collaboration: Math.abs(copy.x - action.x),
      below: action.top > copy.bottom,
      newsSize: getComputedStyle(
        document.querySelector('.home-updates__list p')!
      ).fontSize,
      domainSize: getComputedStyle(title).fontSize,
      iconSizes: Array.from(
        document.querySelectorAll<SVGSVGElement>('[data-profile-icon]')
      ).map((icon) => ({
        label: icon.dataset.profileIcon,
        height: icon.getBBox().height,
        canvas: icon.getBoundingClientRect().width
      }))
    };
  });
  expect(alignment.domain).toBeLessThan(1);
  expect(alignment.collaboration).toBeLessThan(1);
  expect(alignment.below).toBe(true);
  expect(alignment.newsSize).toBe(alignment.domainSize);
  const researchGate = alignment.iconSizes.find(
    ({ label }) => label === 'ResearchGate'
  )!;
  const linkedIn = alignment.iconSizes.find(
    ({ label }) => label === 'LinkedIn'
  )!;
  expect(researchGate.canvas).toBe(linkedIn.canvas);
  expect(researchGate.height).toBeLessThanOrEqual(linkedIn.height + 0.5);
  const github = alignment.iconSizes.find(({ label }) => label === 'GitHub')!;
  expect(github.canvas).toBe(linkedIn.canvas);
  expect(github.height).toBeGreaterThanOrEqual(linkedIn.height - 1);
  expect(github.height).toBeLessThanOrEqual(linkedIn.height + 1);
});

test('Research summaries track selection and hover in both themes', async ({
  page
}) => {
  for (const theme of ['light', 'dark']) {
    await page.addInitScript(
      (value) => localStorage.setItem('atlas-theme', value),
      theme
    );
    await page.goto('/research/');
    const row = page.locator('[data-domain-relationship]').nth(1);
    const tab = row.getByRole('tab');
    const summary = row.locator('p');
    const resting = await summary.evaluate(
      (element) => getComputedStyle(element).color
    );
    await row.hover();
    await expect(summary).toHaveCSS(
      'color',
      theme === 'light' ? 'rgb(48, 79, 115)' : 'rgb(200, 216, 235)'
    );
    await tab.click();
    await page.mouse.move(0, 0);
    await tab.blur();
    const selected =
      theme === 'light' ? 'rgb(76, 106, 146)' : 'rgb(164, 186, 212)';
    await expect(summary).toHaveCSS('color', selected);
    expect(resting).not.toBe(selected);
  }
});

test('News scrolls by wheel and Overview keeps a concise reading sequence', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const news = page.getByRole('region', { name: 'Research news', exact: true });
  const dimensions = await news.evaluate((element) => ({
    height: element.clientHeight,
    total: element.scrollHeight
  }));
  expect(dimensions.total).toBeGreaterThan(dimensions.height);
  await news.hover();
  await page.mouse.wheel(0, 240);
  await expect
    .poll(() => news.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);
  await expect(news).toHaveAttribute('tabindex', '0');
  expect(
    await page
      .locator('.home-updates__list p')
      .first()
      .evaluate((element) => parseFloat(getComputedStyle(element).fontSize))
  ).toBeLessThanOrEqual(18);
  await page.goto('/overview/');
  const button = page.locator('.overview-opening [data-overview-return]');
  const text = page
    .locator('.overview-opening .page-introduction__content > p')
    .last();
  expect((await button.boundingBox())!.y).toBeGreaterThan(
    (await text.boundingBox())!.y + (await text.boundingBox())!.height
  );
  await expect(
    page.locator('.overview-opening__aside [data-overview-return]')
  ).toHaveCount(0);
  const venues = page.locator('[data-overview-news-item] strong');
  await expect(venues).toHaveCount(5);
  await expect(venues.first()).toHaveCSS('font-weight', '700');
  await expect(
    page.locator('.overview-contact__content > p').first()
  ).toHaveText('Contact for research and collaboration.');
});

test('mobile filters align with sort and Back to top is a circular target', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/publications/');
  for (const width of [320, 390, 768, 1023]) {
    await page.setViewportSize({ width, height: 844 });
    const filter = page.getByRole('button', { name: /^Filters/ });
    const sort = page.getByLabel('Sort results', { exact: true });
    await expect(filter).toBeVisible();
    expect((await filter.boundingBox())!.height).toBeCloseTo(
      (await sort.boundingBox())!.height,
      1
    );
    expect(
      (await filter.boundingBox())!.x + (await filter.boundingBox())!.width
    ).toBeCloseTo(
      (await sort.boundingBox())!.x + (await sort.boundingBox())!.width,
      1
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /^Filters/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Filter publications' });
  const clear = dialog.getByRole('button', { name: 'Clear', exact: true });
  const clearBox = (await clear.boundingBox())!;
  const left = await dialog
    .locator('.publication-filter-dialog__actions')
    .evaluate(
      (element) =>
        element.getBoundingClientRect().x +
        parseFloat(getComputedStyle(element).paddingLeft)
    );
  expect(clearBox.x).toBeCloseTo(left, 0);
  await dialog.screenshot({
    path: `.impeccable/review/refinement/filter-${test.info().project.name}.png`
  });
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  const top = page.locator('[data-back-to-top]');
  await expect(top).toBeVisible();
  await expect(top).toHaveAccessibleName('Back to top');
  await expect(top.locator('svg[aria-hidden="true"]')).toHaveCount(1);
  await expect(top).toHaveText('');
  const shape = await top.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    height: element.getBoundingClientRect().height,
    radius: parseFloat(getComputedStyle(element).borderRadius)
  }));
  expect(shape.height).toBeGreaterThanOrEqual(44);
  expect(shape.width).toBeCloseTo(shape.height, 1);
  expect(shape.radius).toBeGreaterThanOrEqual(shape.height / 2);
});
