import { expect, test } from '@playwright/test';

const normalRoutes = [
  '/',
  '/research/',
  '/publications/',
  '/projects/',
  '/about/',
  '/404.html'
];

test.describe('Scholar overview reading mode', () => {
  test('renders the concise static Academic overview and return paths', async ({
    browser,
    page
  }) => {
    const response = await page.goto('/overview/');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('main')).toHaveAttribute(
      'data-route',
      'overview'
    );
    await expect(
      page.getByRole('heading', { level: 1, name: 'Academic overview' })
    ).toBeVisible();
    await expect(page.locator('[data-back-to-top]')).toHaveAttribute(
      'href',
      '#main-content'
    );
    await expect(page.locator('[data-back-to-top]')).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('[data-back-to-top]')).toBeVisible();

    for (const heading of [
      'About',
      'Google Scholar impact',
      'News',
      'Selected publications',
      'Experience',
      'Education',
      'Honors',
      'Teaching and academic service',
      'Contact'
    ]) {
      await expect(
        page.getByRole('heading', { level: 2, name: heading })
      ).toBeVisible();
    }
    expect(
      await page
        .getByRole('heading', { level: 2, name: 'Google Scholar impact' })
        .evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).fontSize)
        )
    ).toBeGreaterThanOrEqual(34);

    const impact = page.getByLabel('Google Scholar impact');
    for (const label of [
      'Total citations',
      'h-index',
      'i10-index',
      'Publications'
    ]) {
      await expect(impact.getByText(label, { exact: true })).toBeVisible();
    }

    const ntuExperience = page
      .getByRole('heading', {
        level: 3,
        name: 'Nanyang Technological University (NTU), Singapore'
      })
      .locator('..');
    await expect(ntuExperience).toBeVisible();
    const advisor = ntuExperience.getByText('Advisor:', { exact: true });
    await expect(advisor).toBeVisible();
    await expect(advisor).not.toHaveAttribute('href');
    await expect(
      ntuExperience.getByRole('link', { name: 'Dr. Si Yong Yeo' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        level: 3,
        name: 'Bachelor of Technology in Computer Science and Engineering'
      })
    ).toBeVisible();

    await expect(page.locator('[data-overview-return]')).toHaveCount(2);
    await expect(page.locator('[data-overview-return]').last()).toHaveCSS(
      'min-height',
      '44px'
    );
    await expect(
      page.locator('[data-overview-selected-publication]')
    ).toHaveCount(10);
    await expect(page.locator('[data-overview-publication-group]')).toHaveCount(
      6
    );
    await expect(
      page.getByText(
        'HERALD protects selected sensitive tokens with client-side deterministic ciphertext while preserving context and downstream clinical utility.',
        { exact: true }
      )
    ).toHaveCount(0);
    await expect(page.locator('[data-overview-news-item]')).not.toHaveCount(0);
    const overviewNews = page.locator('[data-overview-news-item]');
    await expect(overviewNews).toHaveCount(5);
    await expect(overviewNews.first()).toContainText(
      'Accepted at ACM Transactions on Computing for Healthcare'
    );
    expect(await overviewNews.allTextContents()).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/published/i)])
    );
    await expect(page.locator('details.summary-disclosure')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { level: 2, name: 'Research areas' })
    ).toHaveCount(0);
    await expect(
      page.getByRole('heading', { level: 2, name: 'Projects' })
    ).toHaveCount(0);
    await expect(page.locator('[data-experience-description]')).toHaveCount(0);
    await expect(page.getByText(/diagnostics|OpenAlex/i)).toHaveCount(0);

    const publicationGroup = page
      .locator('[data-overview-publication-group]')
      .first();
    const publicationGroupHeading = publicationGroup.getByRole('heading', {
      level: 3
    });
    const publicationLink = publicationGroup.getByRole('link').first();
    expect(
      await publicationGroupHeading.evaluate(
        (element) => getComputedStyle(element).color
      )
    ).not.toBe(
      await publicationLink.evaluate(
        (element) => getComputedStyle(element).color
      )
    );
    expect(
      await publicationGroupHeading.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize)
      )
    ).toBeLessThan(
      await publicationLink.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize)
      )
    );

    const contactAction = page.locator('[data-overview-contact-email]');
    await expect(contactAction).toHaveCount(1);
    await expect(contactAction.locator('svg')).toHaveCount(1);
    expect(
      await contactAction.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).minHeight)
      )
    ).toBeGreaterThanOrEqual(44);

    const staticContext = await browser.newContext({
      javaScriptEnabled: false
    });
    const staticPage = await staticContext.newPage();
    await staticPage.goto('/overview/');
    await expect(
      staticPage.getByRole('heading', {
        level: 2,
        name: 'Selected publications'
      })
    ).toBeVisible();
    await expect(staticPage.locator('details.summary-disclosure')).toHaveCount(
      0
    );
    await staticContext.close();
  });

  test('exposes Scholar view from every normal route and preserves an aligned overview return action', async ({
    page
  }) => {
    for (const route of normalRoutes) {
      await page.goto(route);
      const scholarView = page.locator('[data-header-scholar-view]');
      await expect(scholarView).toHaveAttribute('href', '/overview/');
      await expect(scholarView).toHaveClass(/\bcontrol\b/);
      await expect(scholarView).toHaveCSS('min-height', '44px');
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('[data-header-scholar-view]')).toBeHidden();
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(
      page
        .getByRole('dialog', { name: 'Navigation' })
        .getByRole('link', { name: 'Scholar view', exact: true })
    ).toHaveAttribute('href', '/overview/');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/overview/');
    await expect(
      page
        .getByRole('navigation', { name: 'Primary navigation' })
        .getByRole('link', { name: 'Full site', exact: true })
    ).toHaveAttribute('href', '/');
    await expect(
      page
        .getByRole('navigation', { name: 'Primary navigation' })
        .getByRole('link', { name: 'Full site', exact: true })
    ).toHaveCSS('min-height', '44px');
    expect(
      await page
        .getByRole('navigation', { name: 'Primary navigation' })
        .locator('a')
        .evaluateAll((links) => links.map((link) => link.textContent?.trim()))
    ).toEqual(['Full site', 'Research', 'Publications', 'Projects', 'About']);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    expect(
      await page
        .getByRole('dialog', { name: 'Navigation' })
        .getByRole('navigation', { name: 'Mobile primary navigation' })
        .locator('a')
        .evaluateAll((links) => links.map((link) => link.textContent?.trim()))
    ).toEqual(['Full site', 'Research', 'Publications', 'Projects', 'About']);
  });

  test('renders a restrained footer identity and contact utility on every route', async ({
    page
  }) => {
    for (const route of [...normalRoutes, '/overview/']) {
      await page.goto(route);
      await page.evaluate(() => window.scrollTo(0, 0));
      const footer = page.locator('.site-footer');
      const contact = footer.locator('.site-footer__contact');
      const backToTop = page.locator('[data-back-to-top]');

      await expect(
        footer.getByText('Farhan Sheth', { exact: true })
      ).toBeVisible();
      await expect(contact).toContainText('Get in touch');
      await expect(contact.locator('svg')).toHaveCount(1);
      await expect(contact).toHaveCSS('min-height', '44px');
      await expect(
        footer
          .getByRole('navigation', { name: 'Research profiles' })
          .locator('a')
      ).toHaveCount(6);
      await expect(backToTop).toHaveAttribute('href', '#main-content');
      await expect(backToTop).toBeHidden();
    }

    await page.goto('/about/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('[data-back-to-top]')).toBeVisible();
  });

  test('keeps the static summary within the 320px and 200% zoom reflow boundary', async ({
    browser
  }) => {
    // A 320px CSS viewport is the effective width of a 640px device at 200% zoom.
    const reflow = await browser.newContext({
      viewport: { width: 320, height: 568 }
    });
    const page = await reflow.newPage();

    await page.goto('/overview/');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Selected publications' })
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);

    await reflow.close();
  });
});
