import { expect, test, type Locator, type Page } from '@playwright/test';

const checkClose = async (page: Page, dialog: Locator, close: Locator) => {
  await expect(dialog).toBeVisible();
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  });
  await page.mouse.move(0, 0);
  await expect(close).toHaveCSS('opacity', '0.6');
  await close.hover();
  await expect(close).toHaveCSS('opacity', '1');
  await page.mouse.move(0, 0);
  await page.keyboard.press('Tab');
  await close.focus();
  await expect(close).toHaveCSS('opacity', '1');
  await close.click();
  await expect(dialog).not.toBeVisible();
};

test('all close controls share interaction feedback and Menu uses the rounded action shape', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('https://mapmyvisitors.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'application/javascript' })
  );
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await expect(menu).toHaveCSS('border-radius', '999px');
  await menu.click();
  const navigation = page.getByRole('dialog', { name: 'Navigation' });
  await checkClose(
    page,
    navigation,
    navigation.getByRole('button', { name: 'Close menu' })
  );
  await page.locator('[data-impact-trigger="citations"]').click();
  const impact = page.locator('[data-impact-dialog]');
  await checkClose(
    page,
    impact,
    impact.getByRole('button', { name: 'Close impact details' })
  );
  await page.goto('/publications/');
  const filters = page.getByRole('button', { name: /Filters/ });
  await expect(filters).toBeEnabled();
  await filters.click();
  const filterDialog = page.getByRole('dialog', {
    name: 'Filter publications'
  });
  await checkClose(
    page,
    filterDialog,
    filterDialog.getByRole('button', { name: 'Close filters' })
  );
  await page.locator('[data-publication-figure]').first().click();
  const figure = page.getByRole('dialog', { name: 'Publication figure' });
  await checkClose(
    page,
    figure,
    figure.getByRole('button', { name: 'Close figure' })
  );
});

test('borderless full-view icon stays hidden until the pointer nears the image center', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/publications/');
  const trigger = page.locator('[data-publication-figure]').first();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Publication figure' });
  const enlarge = dialog.getByRole('link', {
    name: 'Open full-size image in a new tab'
  });
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
  });
  await page.mouse.move(0, 0);
  await expect(enlarge).toHaveCSS('opacity', '0');
  await expect(enlarge).toHaveCSS('border-top-width', '0px');
  await expect(enlarge).toHaveCSS('transition-property', 'none');
  await expect(enlarge).toHaveCSS(
    'background-color',
    'rgba(255, 255, 255, 0.6)'
  );
  await expect(enlarge.locator('svg')).toHaveCSS('opacity', '0.65');
  await expect(enlarge.locator('svg path')).toHaveCount(1);
  expect(
    (await enlarge.locator('svg').boundingBox())!.width
  ).toBeGreaterThanOrEqual(30);
  expect((await enlarge.boundingBox())!.width).toBeGreaterThanOrEqual(60);
  const image = dialog.locator('img');
  const tagFont = await page
    .locator('.publication-hashtag')
    .first()
    .evaluate((node) => getComputedStyle(node).fontFamily);
  await expect(dialog.locator('figcaption')).toHaveCSS('font-family', tagFont);
  await expect
    .poll(() =>
      image.evaluate(
        (node: HTMLImageElement) => node.complete && node.naturalWidth > 0
      )
    )
    .toBe(true);
  const bounds = (await image.boundingBox())!;
  const icon = (await enlarge.boundingBox())!;
  expect(icon.x + icon.width / 2).toBeCloseTo(bounds.x + bounds.width / 2, 0);
  expect(icon.y + icon.height / 2).toBeCloseTo(bounds.y + bounds.height / 2, 0);
  const near = { x: icon.x + icon.width + 40, y: icon.y + icon.height / 2 };
  await page.mouse.move(near.x, near.y);
  await expect(enlarge).toHaveCSS('opacity', '1');
  await expect(enlarge).toHaveCSS(
    'background-color',
    'rgba(255, 255, 255, 0.72)'
  );
  const [original] = await Promise.all([
    page.waitForEvent('popup'),
    page.mouse.click(near.x, near.y)
  ]);
  await original.waitForLoadState('load');
  await expect(original).toHaveURL((await trigger.getAttribute('href'))!);
  await original.close();
  await expect(dialog).toBeVisible();
  await page.mouse.move(0, 0);
  await page.keyboard.press('Tab');
  await enlarge.focus();
  await expect(enlarge).toHaveCSS('opacity', '1');
});
