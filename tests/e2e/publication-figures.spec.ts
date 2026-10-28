import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
    await expect(dialog.locator('[data-figure-paper]')).toHaveText(
      await record.locator('[data-publication-title]').innerText()
    );
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
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
