import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ contextOptions: { reducedMotion: 'reduce' } });
test.beforeEach(async ({ page }) => {
  await page.route('https://mapmyvisitors.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'application/javascript' })
  );
});

for (const theme of ['light', 'dark']) {
  test(`uses the selected identity and sharing metadata across every main route in ${theme}`, async ({
    page,
    request
  }) => {
    const manifestResponse = await request.get('/site.webmanifest');
    expect(manifestResponse.ok()).toBe(true);
    expect(manifestResponse.headers()['content-type']).toContain(
      'application/manifest+json'
    );
    const manifest = await manifestResponse.json();
    for (const icon of manifest.icons)
      expect((await request.get(icon.src)).ok()).toBe(true);
    await page.addInitScript(
      (value) => localStorage.setItem('atlas-theme', value),
      theme
    );
    for (const path of [
      '/',
      '/research/',
      '/publications/',
      '/projects/',
      '/about/',
      '/overview/'
    ]) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
        'href',
        '/site.webmanifest'
      );
      await expect(
        page.locator('link[rel="icon"][type="image/svg+xml"]')
      ).toHaveAttribute('href', '/favicon.svg');
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        'https://farhansheth.com/images/og-research-atlas.jpg'
      );
      const mark = page.locator('.site-mark img');
      expect(
        await mark.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0
        )
      ).toBe(true);
      expect(
        await mark.evaluate((image) => getComputedStyle(image).filter)
      ).toBe(theme === 'dark' ? 'brightness(0) invert(1)' : 'none');
    }
  });

  test(`keeps the enlarged mobile portrait accessible and contained in ${theme}`, async ({
    page
  }) => {
    await page.addInitScript(
      (value) => localStorage.setItem('atlas-theme', value),
      theme
    );
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('.home-hero img')).toHaveCount(1);
      await expect(page.locator('.home-hero__summary img')).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
      const report = await new AxeBuilder({ page }).analyze();
      expect(
        report.violations.filter(
          ({ impact }) => impact === 'serious' || impact === 'critical'
        )
      ).toEqual([]);
    }
  });
}
