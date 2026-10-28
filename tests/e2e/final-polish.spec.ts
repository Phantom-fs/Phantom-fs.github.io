import { expect, test } from '@playwright/test';

test.use({ contextOptions: { reducedMotion: 'reduce' } });

test('mobile reading-mode actions are centered above CV with Home first', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/overview/']) {
    await page.goto(route);
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Navigation' });
    await expect(
      dialog.getByRole('navigation').getByRole('link').first()
    ).toHaveText('Home');
    const mode = dialog.locator('[data-mobile-reading-mode]');
    await expect(mode).toHaveText(route === '/' ? 'Scholar view' : 'Full site');
    await expect(mode).toHaveCSS('text-align', 'center');
    const cv = dialog.getByRole('link', { name: 'CV', exact: true });
    await expect(cv).toHaveCSS('border-radius', '999px');
    await expect(mode).toHaveCSS('border-radius', '999px');
    expect(
      (await cv.boundingBox())!.y -
        (await mode.boundingBox())!.y -
        (await mode.boundingBox())!.height
    ).toBeCloseTo(12, 0);
    await dialog.getByRole('button', { name: 'Close menu' }).click();
  }
});

test('Back to top reaches zero and preserves the selected chapter hash', async ({
  page
}) => {
  await page.goto('/research/#privacy-trust-safety');
  const original = page.url();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const top = page.getByRole('link', { name: 'Back to top', exact: true });
  await expect(top).toBeVisible();
  await top.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page).toHaveURL(original);
  await expect(page.locator('main')).toBeFocused();
});

for (const width of [390, 1440])
  test(`compact theme and footer controls align correctly at ${width}px`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const theme = page.locator('[data-theme-toggle]');
    await expect(theme).toHaveText('');
    await expect(theme).toHaveAccessibleName('Use dark theme');
    const bounds = (await theme.boundingBox())!;
    expect(bounds.width).toBe(44);
    expect(bounds.height).toBe(44);
    await theme.click();
    await expect(theme).toHaveAccessibleName('Use light theme');
    await expect(theme.locator('svg:visible')).toHaveCount(1);
    const footer = page.locator('.site-footer');
    await expect(footer.locator('.site-footer__contact svg')).toHaveCount(0);
    const copyright = footer.locator('.site-footer__copyright');
    const frame = footer.locator('.site-footer__grid');
    expect((await copyright.boundingBox())!.x).toBeCloseTo(
      (await frame.boundingBox())!.x,
      0
    );
    const opportunity = await page
      .locator('.opportunity-strip')
      .evaluate((element) => getComputedStyle(element).borderBottomWidth);
    expect(opportunity).toBe('0px');
    await expect(page.locator('.impact-metrics')).toHaveCSS(
      'border-top-width',
      '1px'
    );
  });
