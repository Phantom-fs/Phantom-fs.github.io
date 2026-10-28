import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('mobile paper metadata spans the card below the figure and title', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/publications/');
  for (const width of [320, 390, 640, 767, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const layouts = await page
      .locator('[data-publication-record]')
      .evaluateAll((records) =>
        records.map((record) => {
          const box = (selector: string) =>
            record.querySelector(selector)!.getBoundingClientRect();
          const figure = box('[data-publication-figure]');
          const title = box('.publication-identity__title');
          const tags = box('.publication-record__taxonomy');
          return {
            figure: { right: figure.right, bottom: figure.bottom },
            title: { left: title.left, top: title.top, bottom: title.bottom },
            left: tags.left,
            width: tags.width,
            metadata: [
              '.publication-identity__authors',
              '[data-publication-metadata]',
              '.publication-record__disclosures'
            ].map((selector) => {
              const rect = box(selector);
              return { left: rect.left, top: rect.top, width: rect.width };
            })
          };
        })
      );
    expect(layouts).toHaveLength(18);
    for (const layout of layouts) {
      if (width < 768) {
        for (const row of layout.metadata) {
          expect(row.left).toBeCloseTo(layout.left, 0);
          expect(row.width).toBeCloseTo(layout.width, 0);
          expect(row.top).toBeGreaterThanOrEqual(
            Math.max(layout.figure.bottom, layout.title.bottom)
          );
        }
      } else {
        expect(layout.metadata[0].left).toBeGreaterThan(layout.figure.right);
      }
      if (width < 360)
        expect(layout.title.top).toBeGreaterThanOrEqual(layout.figure.bottom);
      else expect(layout.title.left).toBeGreaterThan(layout.figure.right);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
  }
});

test('every paper exposes its own complete figure, with keyboard close and focus restoration', async ({
  page
}) => {
  await page.goto('/publications/');
  const records = page.locator('[data-publication-record]');
  await expect(records).toHaveCount(18);
  const dialog = page.getByRole('dialog', { name: 'Publication figure' });
  for (const record of await records.all()) {
    const trigger = record.locator('[data-publication-figure]');
    await expect(trigger).toHaveCount(1);
    await expect(trigger.locator('img')).toHaveAttribute('alt', /.+/);
    await trigger.click();
    await expect(dialog).toBeVisible();
    const image = dialog.locator('img');
    await expect
      .poll(() =>
        image.evaluate(
          (node: HTMLImageElement) => node.complete && node.naturalWidth > 0
        )
      )
      .toBe(true);
    await expect(image).toHaveAttribute(
      'src',
      await trigger.evaluate((link: HTMLAnchorElement) => link.href)
    );
    await expect(
      dialog.locator('h2, [data-figure-label], [data-figure-paper]')
    ).toHaveCount(0);
    await expect(dialog.locator('figcaption')).toHaveText(
      (await trigger.getAttribute('data-figure-caption'))!
        .trim()
        .replace(/\.+$/, '')
    );
    await expect(dialog.locator('figcaption')).not.toHaveText(/\.$/);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
});

test('image-only thumbnails show a hover zoom affordance and a compact viewer toolbar', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/publications/');
  const trigger = page.locator('[data-publication-figure]').first();
  await trigger.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(trigger).not.toContainText('View figure');
  const icon = trigger.locator('.publication-figure__zoom');
  await expect(icon).toHaveCSS('opacity', '0');
  await trigger.hover();
  await expect(trigger).toHaveCSS('border-top-width', '0px');
  await expect(icon).toHaveCSS('opacity', '1');
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Publication figure' });
  await expect(dialog).toBeVisible();
  expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(960);
  const fullSize = dialog.getByRole('link', {
    name: 'Open full-size image in a new tab'
  });
  await expect(fullSize).toHaveText('');
  await expect(fullSize.locator('svg')).toHaveCount(1);
  await expect(fullSize).toHaveAttribute(
    'href',
    await trigger.evaluate((node: HTMLAnchorElement) => node.href)
  );
  const imageBox = (await dialog.locator('img').boundingBox())!;
  const enlargeBox = (await fullSize.boundingBox())!;
  expect(enlargeBox.x + enlargeBox.width / 2).toBeCloseTo(
    imageBox.x + imageBox.width / 2,
    0
  );
  expect(enlargeBox.y + enlargeBox.height / 2).toBeCloseTo(
    imageBox.y + imageBox.height / 2,
    0
  );
  await expect(fullSize).toHaveCSS('border-top-width', '0px');
  const [original] = await Promise.all([
    page.waitForEvent('popup'),
    fullSize.click()
  ]);
  await original.waitForLoadState('domcontentloaded');
  await expect(original).toHaveURL((await trigger.getAttribute('href'))!);
  await original.close();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('figcaption')).toHaveCSS('text-align', 'center');
});

test('figure dialog survives filtering and Astro navigation, and works at narrow widths in both themes @a11y', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/publications/?q=herald');
  await expect(page.locator('[data-publication-record]:visible')).toHaveCount(
    1
  );
  const trigger = page.locator(
    '[data-publication-record]:visible [data-publication-figure]'
  );
  const dialog = page.getByRole('dialog', { name: 'Publication figure' });
  for (const theme of ['light', 'dark']) {
    await page.evaluate(
      (value) => (document.documentElement.dataset.theme = value),
      theme
    );
    await trigger.click();
    await expect(dialog).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    const scan = await new AxeBuilder({ page }).analyze();
    expect(
      scan.violations.filter(
        ({ impact }) => impact === 'serious' || impact === 'critical'
      )
    ).toEqual([]);
    await dialog.getByRole('button', { name: 'Close figure' }).click();
    await expect(trigger).toBeFocused();
  }
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Mobile primary navigation' })
    .getByRole('link', { name: 'Research', exact: true })
    .click();
  await expect(page.locator('main')).toHaveAttribute('data-route', 'research');
  await page.goBack();
  await expect(page).toHaveURL('/publications/?q=herald');
  await expect(page.locator('[data-publication-record]:visible')).toHaveCount(
    1
  );
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(2, 2);
  await expect(dialog).not.toBeVisible();
});

test('figure links remain usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/publications/');
  await expect(page.locator('[data-publication-figure]')).toHaveCount(18);
  const trigger = page.locator('[data-publication-figure]').first();
  const href = (await trigger.getAttribute('href'))!;
  const response = await page.request.get(href);
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('image/');
  await trigger.click();
  await expect(page).toHaveURL(href);
  await context.close();
});

test('desktop navigation is centered and its rounded actions follow the requested order', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const navigation = await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .boundingBox();
  expect(navigation).not.toBeNull();
  expect(Math.abs(navigation!.x + navigation!.width / 2 - 720)).toBeLessThan(2);
  const actions = page.locator('.site-header__actions');
  await expect(actions.locator('a')).toHaveText(['Scholar view', 'CV']);
  const positions = await actions
    .locator('a, button[data-theme-toggle]')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().x)
    );
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
  const radius = await actions
    .getByRole('link', { name: 'CV', exact: true })
    .evaluate((node) => parseFloat(getComputedStyle(node).borderRadius));
  expect(radius).toBeGreaterThan(20);
});
