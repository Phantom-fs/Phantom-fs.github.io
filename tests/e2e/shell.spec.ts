import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const expectTheme = async (page: Page, theme: 'light' | 'dark') => {
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect(
    page.getByRole('button', {
      name: theme === 'dark' ? 'Use light theme' : 'Use dark theme'
    })
  ).toHaveAttribute('aria-pressed', String(theme === 'dark'));
};

const researchRoute = /\/research\/(?:#healthcare-clinical-ai)?$/;

test.describe('global academic atlas shell', () => {
  test('serves a semantic recovery page with metadata and no serious axe violations @a11y', async ({
    page
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.goto('/404.html');

    await expect(
      page.getByRole('link', { name: 'Skip to content' })
    ).toBeAttached();
    await expect(page.getByRole('main')).toContainText(
      'This page could not be found.'
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://phantom-fs.github.io/404.html'
    );
    expect(
      await page
        .locator('script[type="application/ld+json"]')
        .evaluate((element) => element.textContent)
    ).toContain('ProfilePage');

    const report = await new AxeBuilder({ page }).analyze();
    expect(
      report.violations.filter(
        ({ impact }) => impact === 'serious' || impact === 'critical'
      )
    ).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('opens, dismisses, and restores focus from the mobile menu', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/404.html');
    const menu = page.getByRole('button', { name: 'Menu', exact: true });

    await menu.click();
    await expect(
      page.getByRole('dialog', { name: 'Navigation' })
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeHidden();
    await expect(menu).toBeFocused();
  });

  test('persists an explicit theme choice and does not introduce horizontal overflow', async ({
    page
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/404.html');
    const toggle = page.getByRole('button', { name: /Use (light|dark) theme/ });

    await toggle.click();
    const selectedTheme = await page.locator('html').getAttribute('data-theme');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      selectedTheme ?? 'light'
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });

  test('keeps a manual theme override through client navigation, history, and reload', async ({
    page
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('shell-theme-regression-ready')) {
        localStorage.removeItem('atlas-theme');
        sessionStorage.setItem('shell-theme-regression-ready', 'true');
      }
    });

    await page.goto('/');
    await expectTheme(page, 'light');
    await page.getByRole('button', { name: 'Use dark theme' }).click();
    await expectTheme(page, 'dark');

    await page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'Research', exact: true })
      .click();
    await expect(page).toHaveURL(researchRoute);
    await expectTheme(page, 'dark');

    await page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'Publications', exact: true })
      .click();
    await expect(page).toHaveURL(/\/publications\/$/);
    await expectTheme(page, 'dark');

    await page.goBack();
    await expect(page).toHaveURL(researchRoute);
    await expectTheme(page, 'dark');

    await page.goForward();
    await expect(page).toHaveURL(/\/publications\/$/);
    await expectTheme(page, 'dark');

    await page.reload();
    await expectTheme(page, 'dark');
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('opens the swapped mobile menu on its first click and restores focus', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    const initialDialog = page.getByRole('dialog', { name: 'Navigation' });
    await initialDialog
      .getByRole('link', { name: 'Research', exact: true })
      .click();
    await expect(page).toHaveURL(researchRoute);

    const swappedMenu = page.getByRole('button', { name: 'Menu', exact: true });
    await swappedMenu.click();
    await expect(
      page.getByRole('dialog', { name: 'Navigation' })
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Navigation' })).toBeHidden();
    await expect(swappedMenu).toBeFocused();
  });

  test('keeps route headings at the route scale and exposes visible interactive states in both themes', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/404.html');

    const heading = page.getByRole('heading', {
      level: 1,
      name: 'This page could not be found.'
    });
    await expect(heading).toHaveCSS('font-size', '48px');
    const home = page.locator('.action-group .action--primary');
    await expect(home).toHaveCSS('background-color', 'rgb(169, 87, 56)');

    const restingBackground = await home.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    await home.hover();
    expect(
      await home.evaluate(
        (element) => getComputedStyle(element).backgroundColor
      )
    ).not.toBe(restingBackground);
    await home.focus();
    await expect(home).toHaveCSS('outline-style', 'solid');

    await page.mouse.move(0, 0);
    await page.getByRole('button', { name: 'Use dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(20, 23, 25)'
    );
    await expect(home).toHaveCSS('background-color', 'rgb(208, 138, 104)');
  });

  test('keeps navigation selection and expanded state semantic at the mobile boundary', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/404.html');

    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByRole('dialog', { name: 'Navigation' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close menu' }).click();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  });

  test('maintains reflow through every approved shell breakpoint', async ({
    page
  }) => {
    for (const viewport of [
      { height: 568, width: 320 },
      { height: 844, width: 390 },
      { height: 1024, width: 767 },
      { height: 1024, width: 768 },
      { height: 700, width: 1023 },
      { height: 768, width: 1024 },
      { height: 900, width: 1439 },
      { height: 900, width: 1440 },
      { height: 1080, width: 1920 }
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/404.html');
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
    }
  });

  test('publishes route-neutral metadata endpoints', async ({ page }) => {
    const sitemap = await page.request.get('/sitemap.xml');
    const rss = await page.request.get('/rss.xml');
    const robots = await page.request.get('/robots.txt');

    expect(sitemap.ok()).toBe(true);
    await expect(sitemap).toBeOK();
    expect(await sitemap.text()).toContain('<urlset');
    expect(await rss.text()).toContain('<rss');
    expect(await robots.text()).toContain('Sitemap:');
  });

  test('serves exact static artifacts with MIME types and a plain 404', async ({
    page
  }) => {
    const favicon = await page.request.get('/favicon.svg');
    const missing = await page.request.get('/not-an-artifact');

    await expect(favicon).toBeOK();
    expect(favicon.headers()['content-type']).toContain('image/svg+xml');
    expect(missing.status()).toBe(404);
    expect(await missing.text()).toBe('Not found');
  });
});
