import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://mapmyvisitors.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'application/javascript' })
  );
});

for (const width of [390, 1440]) {
  test(`scroll hints follow remaining content and restore after navigation at ${width}px`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    for (const name of ['Research areas list', 'Research news']) {
      const region = page.getByRole('region', { name, exact: true });
      const shell = region.locator('..');
      await expect(shell).toHaveAttribute('data-scroll-more', 'true');
      await region.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      await expect(shell).toHaveAttribute('data-scroll-more', 'false');
      await region.focus();
      await page.keyboard.press('Home');
      await expect
        .poll(() => region.evaluate((node) => node.scrollTop))
        .toBe(0);
      await expect(shell).toHaveAttribute('data-scroll-more', 'true');
    }
    await page.goto('/research/');
    await page.goBack();
    await expect(
      page.locator('.content-scroll-shell[data-scroll-more="true"]')
    ).toHaveCount(2);
  });
}

test('theme colors transition only on an explicit toggle and respect reduced motion', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const root = page.locator('html');
  await expect(root).not.toHaveAttribute('data-theme-changing');
  await page.getByRole('button', { name: 'Use dark theme' }).click();
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect(root).toHaveAttribute('data-theme-changing', 'true');
  await expect(page.locator('body')).toHaveCSS('transition-duration', /0\.32s/);
  await expect(root).not.toHaveAttribute('data-theme-changing');
  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect(root).not.toHaveAttribute('data-theme-changing');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Use light theme' }).click();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(root).not.toHaveAttribute('data-theme-changing');
});
