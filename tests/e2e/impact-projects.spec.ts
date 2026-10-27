import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ contextOptions: { reducedMotion: 'reduce' } });
test.beforeEach(async ({ page }) => {
  await page.route('https://mapmyvisitors.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'application/javascript' })
  );
});

for (const width of [320, 390, 1440]) {
  test(`impact dialogs provide four truthful, accessible chart views at ${width}px`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const views = [
      ['citations', 'Citations by publication year'],
      ['h-index', 'h-index citation profile'],
      ['i10-index', 'Papers by citation threshold'],
      ['publications', 'Publications by year']
    ];
    for (const [key, heading] of views) {
      const trigger = page.locator(`[data-impact-trigger="${key}"]`);
      await trigger.click();
      const dialog = page.locator('[data-impact-dialog]');
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole('heading', { name: heading, exact: true })
      ).toBeVisible();
      await expect(dialog.locator('[data-impact-panel]:visible')).toHaveCount(
        1
      );
      expect(
        await dialog.evaluate(
          (element) => element.scrollWidth <= element.clientWidth
        )
      ).toBe(true);
      await expect(dialog.locator('p, details, table')).toHaveCount(0);
      if (key === 'citations') {
        const counts = await dialog
          .locator('[data-impact-panel="citations"] .impact-bars__label strong')
          .allTextContents();
        const total = Number(
          (
            await trigger
              .locator('..')
              .locator('.citation-metric__value')
              .innerText()
          ).replace(/,/g, '')
        );
        expect(counts).toHaveLength(3);
        expect(counts.reduce((sum, count) => sum + Number(count), 0)).toBe(
          total
        );
      }
      if (key === 'h-index')
        await expect(
          dialog.locator('.impact-rank-bars__bar--core')
        ).toHaveCount(7);
      if (key === 'publications') {
        await expect(
          dialog.locator(
            '[data-impact-panel="publications"] .impact-bars__label strong'
          )
        ).toHaveText(['3', '9', '6']);
      }
      if (key === 'h-index' && width === 390) {
        const report = await new AxeBuilder({ page }).analyze();
        expect(
          report.violations.filter(
            ({ impact }) => impact === 'critical' || impact === 'serious'
          )
        ).toEqual([]);
      }
      await dialog
        .getByRole('button', { name: 'Close impact details' })
        .click();
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    }
    await page.locator('[data-impact-trigger="citations"]').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-impact-dialog]')).toBeHidden();
    await page.locator('[data-impact-trigger="citations"]').click();
    await page.mouse.click(2, 2);
    await expect(page.locator('[data-impact-dialog]')).toBeHidden();
  });
}

test('impact cards show hover feedback, survive client navigation and retain no-JavaScript charts', async ({
  page,
  browser
}) => {
  await page.goto('/');
  const card = page.locator('.impact-metric').first();
  const initial = await card.evaluate((element) => ({
    color: getComputedStyle(element.querySelector('dt')!).color,
    background: getComputedStyle(element).backgroundColor,
    border: getComputedStyle(element).borderColor
  }));
  await card.hover();
  const hovered = await card.evaluate((element) => ({
    color: getComputedStyle(element.querySelector('dt')!).color,
    background: getComputedStyle(element).backgroundColor,
    border: getComputedStyle(element).borderColor
  }));
  for (const key of ['color', 'background', 'border'] as const)
    expect(hovered[key]).not.toBe(initial[key]);
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'About', exact: true })
    .click();
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Home', exact: true })
    .click();
  await page.locator('[data-impact-trigger="citations"]').click();
  await expect(page.locator('[data-impact-dialog]')).toBeVisible();
  await expect(page.locator('[data-impact-dialog] details')).toHaveCount(0);
  await expect(page.locator('[data-impact-dialog] p')).toHaveCount(0);
  const staticContext = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 800 }
  });
  const staticPage = await staticContext.newPage();
  await staticPage.goto('/');
  await expect(staticPage.locator('#impact-data')).toBeVisible();
  await expect(
    staticPage.locator('#impact-data .impact-bar-chart')
  ).toHaveCount(3);
  expect(
    await staticPage.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  await staticContext.close();
});

test('Projects shares Research selection, keyboard, deep-link and browser history behavior', async ({
  page
}) => {
  await page.goto('/projects/');
  await expect(page.locator('[data-project-case-study]:visible')).toHaveCount(
    1
  );
  await expect(page).toHaveURL(/#recruitview-crmf$/);
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await tabs.nth(1).click();
  await expect(page.locator('#herald-project')).toBeVisible();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(1).focus();
  await page.keyboard.press('End');
  await expect(page.locator('#herbify-project')).toBeVisible();
  await expect(tabs.nth(3)).toBeFocused();
  await page.goBack();
  await expect(page.locator('#herald-project')).toBeVisible();
  await page.reload();
  await expect(page.locator('#herald-project')).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Research', exact: true })
    .click();
  await expect(page.getByRole('tab')).toHaveCount(6);
  await page.goBack();
  await expect(page.locator('#herald-project')).toBeVisible();
  await page.getByRole('tab').nth(2).click();
  await expect(page.locator('#agro-companion')).toBeVisible();
});

test('mobile close controls, filter scope and footer expose the intended controls', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(
    await page
      .locator('.home-hero__identity')
      .evaluate(
        (element) =>
          element
            .querySelector('.home-hero__role')!
            .compareDocumentPosition(element.querySelector('h1')!) &
          Node.DOCUMENT_POSITION_FOLLOWING
      )
  ).toBeTruthy();
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Close menu' }).locator('svg')
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close menu' }).click();
  await expect(page.locator('.site-footer')).toContainText(
    '© 2026 Farhan Sheth'
  );
  const footerLinks = page.locator('.site-footer a');
  expect(await footerLinks.locator('svg[aria-hidden="true"]').count()).toBe(
    (await footerLinks.count()) - 1
  );
  await expect(
    page.getByRole('navigation', { name: 'Footer navigation' })
  ).toHaveCount(0);
  await page.goto('/publications/');
  await expect(
    page.locator('.publication-explorer__filter-scope')
  ).not.toContainText('Rank evidence');
  await page.getByRole('button', { name: /^Filters/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Filter publications' });
  await expect(
    dialog.getByRole('button', { name: 'Close filters' }).locator('svg')
  ).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Clear', exact: true })
  ).toHaveCSS('border-top-width', '1px');
});

test('SEO signals prefer the custom domain and the RSS contains real news items', async ({
  page,
  request
}) => {
  for (const path of [
    '/',
    '/about/',
    '/projects/',
    '/research/',
    '/publications/soil-classification/?return=q%3Dcryptography'
  ]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://farhansheth.com${path.split('?')[0]}`
    );
  }
  const response = await request.get('/rss.xml');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('xml');
  const xml = await response.text();
  expect(xml.match(/<item>/g) ?? []).toHaveLength(5);
  expect(xml).toContain('rel="self"');
  expect(xml).not.toContain('About page');
  expect(xml).not.toContain('phantom-fs.github.io');
  await page.goto('/');
  for (const link of xml.matchAll(
    /<link>(https:\/\/farhansheth.com\/#news-[^<]+)<\/link>/g
  )) {
    await expect(
      page.locator(`#${new URL(link[1]).hash.slice(1)}`)
    ).toHaveCount(1);
  }
});
