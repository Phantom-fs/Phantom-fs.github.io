import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Publications catalog and approved detail routes', () => {
  test('keeps every publication category and resource readable without island hydration', async ({
    browser
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/publications/');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Publications' })
    ).toBeVisible();
    await expect(page.locator('[data-publication-category]')).toHaveCount(6);
    await expect(page.locator('[data-publication-record]')).toHaveCount(18);
    await expect(page.locator('[data-publication-record] details')).toHaveCount(
      36
    );
    const catalog = page.locator('[data-publication-catalog]');
    await expect(catalog).not.toContainText('Status:');
    await expect(catalog).not.toContainText('Open access');
    await expect(catalog).not.toContainText('Access may vary');
    await expect(catalog).not.toContainText('Citation data is stale');
    await expect(catalog).not.toContainText(/stale/i);
    await expect(catalog).not.toContainText('Slate Scholar');
    await expect(catalog.locator('[data-year]')).toHaveCount(0);
    await expect(catalog.locator('.citation-metric__source')).toHaveCount(0);
    await expect(
      page.getByRole('link', {
        name: /Selective Token-Level Cryptographic Redaction/
      })
    ).toHaveAttribute('href', '/publications/herald/');
    await expect(
      page.getByRole('link', { name: 'Read paper' }).first()
    ).toBeVisible();
    await context.close();
  });

  test('keeps collapsed publication records compact for catalogue scanning', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/publications/');
    await page.evaluate(() => document.fonts.ready);

    const firstRecord = page.locator('[data-publication-record]').first();
    const title = firstRecord.locator('[data-publication-title]');
    const firstSummary = firstRecord.locator('summary').first();

    expect(
      await title.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize)
      )
    ).toBeLessThanOrEqual(28);
    expect(
      await title.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize)
      )
    ).toBeGreaterThanOrEqual(20);
    await expect(title).toHaveCSS('text-wrap', 'pretty');
    expect(
      await firstSummary.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize)
      )
    ).toBeLessThanOrEqual(12);
    expect(
      await firstSummary.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).minHeight)
      )
    ).toBeGreaterThanOrEqual(44);
    expect(
      await firstRecord.evaluate((element) => element.clientHeight)
    ).toBeLessThanOrEqual(400);
    await expect(title).toHaveCSS('overflow-wrap', 'normal');
    await expect(firstRecord).toHaveCSS('border-top-width', '1px');
    await expect(firstRecord).toHaveCSS('border-radius', '10px');
    await expect(firstRecord).toHaveCSS('padding-top', '16px');
    const restingBorder = await firstRecord.evaluate(
      (element) => getComputedStyle(element).borderTopColor
    );
    await firstRecord.hover();
    expect(
      await firstRecord.evaluate(
        (element) => getComputedStyle(element).borderTopColor
      )
    ).not.toBe(restingBorder);
    expect(
      await firstRecord
        .locator('.publication-record__taxonomy')
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).gap))
    ).toBeGreaterThan(0);
    const secondRecord = page.locator('[data-publication-record]').nth(1);
    expect(
      (await secondRecord.boundingBox())!.y -
        ((await firstRecord.boundingBox())!.y +
          (await firstRecord.boundingBox())!.height)
    ).toBeGreaterThanOrEqual(12);
    const subjectAuthors = page
      .locator('[aria-label="Ordered authors"] li')
      .filter({ hasText: 'Farhan Sheth' });
    expect(await subjectAuthors.count()).toBeGreaterThan(0);
    expect(
      (
        await subjectAuthors.evaluateAll((authors) =>
          authors.map((author) =>
            Number.parseInt(getComputedStyle(author).fontWeight, 10)
          )
        )
      ).every((weight) => weight >= 700)
    ).toBe(true);
  });

  test('places Scholar citation evidence alongside bibliography metadata', async ({
    page
  }) => {
    await page.goto('/publications/');

    const firstRecord = page.locator('[data-publication-record]').first();
    await expect(firstRecord.locator('[data-catalog-citation]')).toHaveText(
      /Cited by \d+/
    );
    await expect(
      firstRecord.locator('[data-publication-metadata]')
    ).toContainText('Cited by');
    expect(
      await page
        .locator('[data-publication-category]')
        .first()
        .locator('h2')
        .evaluate((element) => getComputedStyle(element, '::after').content)
    ).toBe('none');
    await expect(page.getByRole('main')).toContainText(
      'Search my research catalog by title, author, venue, research area, year, or keyword.'
    );
  });

  test('restores a URL-persisted catalog query and announces one settled result state', async ({
    page
  }) => {
    await page.goto('/publications/?q=soil-classification&sort=title');

    await expect(
      page.getByRole('searchbox', { name: 'Search publications' })
    ).toHaveValue('soil-classification');
    await expect(
      page.locator(
        '[data-publication-category]:not([hidden]) [data-publication-record]:not([hidden])'
      )
    ).toHaveCount(1);
    await expect(page.locator('[data-publication-result-count]')).toHaveText(
      'Total publications: 1'
    );
    await expect(page).toHaveURL(/q=soil-classification.*sort=title/);
  });

  test('shows exactly the three 2024 publications selected by the year filter', async ({
    page
  }) => {
    await page.goto('/publications/?year=2024');

    await expect(page.locator('[data-publication-visible-count]')).toHaveText(
      'Total publications: 3'
    );
    await expect(
      page.locator(
        '[data-publication-category]:not([hidden]) [data-publication-record]:not([hidden])'
      )
    ).toHaveCount(3);
    await expect(page.locator('[data-active-filter-summary]')).toHaveText(
      '2024'
    );
  });

  test('does not paint records excluded by the 2024 year filter', async ({
    page
  }) => {
    await page.goto('/publications/?year=2024');

    const hiddenRecords = page.locator('[data-publication-record][hidden]');
    await expect(hiddenRecords).toHaveCount(15);
    expect(
      await hiddenRecords.evaluateAll((records) =>
        records.every((record) => {
          const styles = getComputedStyle(record);
          return (
            styles.display === 'none' &&
            record.getBoundingClientRect().height === 0
          );
        })
      )
    ).toBe(true);
  });

  test('hydrates an incoming search and year state without a reconciliation error', async ({
    page
  }) => {
    const hydrationErrors: string[] = [];
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        message.text().includes("SSR'd HTML containing different DOM-nodes")
      ) {
        hydrationErrors.push(message.text());
      }
    });

    await page.goto('/publications/?q=soil-classification&year=2025');

    await expect(page.locator('[data-publication-visible-count]')).toHaveText(
      'Total publications: 1'
    );
    expect(hydrationErrors).toEqual([]);
  });

  test('uses a draft mobile filter dialog and restores the trigger after cancellation', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/publications/');

    const trigger = page.getByRole('button', { name: /Filters/ });
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const dialog = page.getByRole('dialog', { name: 'Filter publications' });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole('checkbox', { name: 'Healthcare & Clinical AI' })
      .check();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page).toHaveURL('/publications/');
    await expect(trigger).toBeFocused();

    await trigger.click();
    await dialog
      .getByRole('checkbox', { name: 'Healthcare & Clinical AI' })
      .check();
    await dialog.getByRole('checkbox', { name: '2026' }).check();
    await expect(dialog.getByRole('checkbox', { name: '2026' })).toBeChecked();
    await dialog.getByRole('button', { name: 'Apply filters' }).click();
    await expect(page).toHaveURL(/category=Healthcare/);
    await expect(page).toHaveURL(/year=2026/);
    await expect(
      page.locator(
        '[data-publication-category]:not([hidden]) [data-publication-record]:not([hidden])'
      )
    ).toHaveCount(3);
    await expect(page.locator('[data-active-filter-summary]')).toHaveText(
      'Healthcare & Clinical AI · 2026'
    );
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page).toHaveURL('/publications/');
    await expect(page.locator('[data-publication-category]')).toHaveCount(6);
    await expect(page.locator('[data-publication-groups]')).toBeVisible();
  });

  test('combines mobile title search with a year filter in the card catalogue', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/publications/');
    await page
      .getByRole('searchbox', { name: 'Search publications' })
      .fill('soil classification');

    const trigger = page.getByRole('button', { name: /Filters/ });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Filter publications' });
    await dialog.getByRole('checkbox', { name: '2025' }).check();
    await dialog.getByRole('button', { name: 'Apply filters' }).click();

    await expect(page).toHaveURL(/q=soil\+classification/);
    await expect(page).toHaveURL(/year=2025/);
    await expect(
      page.locator(
        '[data-publication-category]:not([hidden]) [data-publication-record]:not([hidden])'
      )
    ).toHaveCount(1);
    await expect(page.locator('[data-publication-result-count]')).toHaveText(
      'Total publications: 1'
    );
  });

  test('keeps filters persistent beside results at the 1024px threshold', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1023, height: 768 });
    await page.goto('/publications/');
    await expect(page.getByRole('button', { name: /Filters/ })).toBeVisible();
    await expect(
      page.locator('.publication-explorer__desktop-filters')
    ).toBeHidden();
    expect(
      await page.evaluate(() =>
        [...document.querySelectorAll('*')]
          .filter(
            (element) =>
              element.getBoundingClientRect().right > window.innerWidth
          )
          .map((element) => ({
            className: element.className,
            right: Math.round(element.getBoundingClientRect().right),
            tagName: element.tagName
          }))
          .slice(0, 10)
      )
    ).toEqual([]);

    await page.setViewportSize({ width: 1024, height: 768 });

    await expect(page.getByRole('button', { name: /Filters/ })).toBeHidden();
    const filters = page.locator('.publication-explorer__desktop-filters');
    await expect(filters).toBeVisible();
    await filters
      .getByRole('checkbox', { name: 'Healthcare & Clinical AI' })
      .check();
    await expect(page).toHaveURL(/category=Healthcare/);
    await expect(
      page.locator(
        '[data-publication-category]:not([hidden]) [data-publication-record]:not([hidden])'
      )
    ).toHaveCount(4);
    await expect(page.getByText('Publication type')).toHaveCount(0);
  });

  test('reflows the catalog at every publication breakpoint under accessibility media', async ({
    browser
  }) => {
    const context = await browser.newContext({ hasTouch: true });
    const page = await context.newPage();
    await page.emulateMedia({
      forcedColors: 'active',
      reducedMotion: 'reduce'
    });

    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1023, height: 768 },
      { width: 1024, height: 700 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 }
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/publications/');
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
    }

    await page.setViewportSize({ width: 320, height: 568 });
    await page.addStyleTag({
      content:
        '* { letter-spacing: 0.12em; word-spacing: 0.16em; line-height: 1.5 !important; }'
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    expect(
      await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
    ).toBe(true);
    await context.close();
  });

  test('restores a research-domain link as a shareable category filter', async ({
    page
  }) => {
    await page.goto('/publications/?research=healthcare-clinical-ai');

    await expect(page).toHaveURL(/category=Healthcare/);
    await expect(
      page.locator(
        '[data-publication-category]:not([hidden]) [data-publication-record]:not([hidden])'
      )
    ).toHaveCount(4);
  });

  test('applies an incoming domain category during ClientRouter navigation', async ({
    page
  }) => {
    await page.addInitScript(() => {
      document.addEventListener('astro:after-swap', () => {
        const state = window as typeof window & {
          atlasPublicationSwapCount?: number;
        };
        state.atlasPublicationSwapCount =
          (state.atlasPublicationSwapCount ?? 0) + 1;
      });
    });
    await page.goto('/');

    const domainLink = page.locator('[data-domain-publications-link]').first();
    await domainLink.click();

    await expect(page).toHaveURL(/\/publications\/\?category=Healthcare/);
    await expect(page.locator('[data-publication-visible-count]')).toHaveText(
      'Total publications: 4'
    );
    await expect(page.locator('[data-active-filter-summary]')).toHaveText(
      'Healthcare & Clinical AI'
    );
    await expect(
      page.locator('[data-publication-category]:not([hidden])')
    ).toHaveCount(1);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as typeof window & { atlasPublicationSwapCount?: number })
              .atlasPublicationSwapCount ?? 0
        )
      )
      .toBeGreaterThan(0);
  });

  test('restores a Research deep link during ClientRouter navigation', async ({
    page
  }) => {
    await page.addInitScript(() => {
      document.addEventListener('astro:after-swap', () => {
        const state = window as typeof window & {
          atlasPublicationSwapCount?: number;
        };
        state.atlasPublicationSwapCount =
          (state.atlasPublicationSwapCount ?? 0) + 1;
      });
    });
    await page.goto('/research/');

    await page
      .getByLabel('Privacy, Trust & Safety')
      .getByRole('link', {
        name: /Selective Token-Level Cryptographic Redaction/
      })
      .click();

    await expect(page).toHaveURL(/\/publications\/\?category=Privacy/);
    await expect(page.locator('[data-publication-visible-count]')).toHaveText(
      'Total publications: 3'
    );
    await expect(page.locator('[data-active-filter-summary]')).toHaveText(
      'Privacy, Trust & Safety'
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as typeof window & { atlasPublicationSwapCount?: number })
              .atlasPublicationSwapCount ?? 0
        )
      )
      .toBeGreaterThan(0);
  });

  test('keeps unpublished catalog labels generic beside citation evidence', async ({
    page
  }) => {
    await page.goto('/publications/');

    const herald = page.locator('[data-publication-id="herald"]');
    await expect(herald.locator('[data-catalog-citation]')).toHaveText(
      /Cited by \d+/
    );
    await expect(herald.locator('.publication-record__status')).toHaveCount(0);
    await expect(herald.locator('[data-publication-metadata]')).toContainText(
      'arXiv preprint'
    );
    await expect(
      herald.locator('[data-publication-metadata]')
    ).not.toContainText(/under review/i);
  });

  test('keeps a combined multi-category result grouped in global sort order', async ({
    page
  }) => {
    const expectedBySort = {
      newest: [
        'data-efficient-neuroimaging',
        'herald',
        'alzheimer-detection',
        'uc-prun',
        'chest-xray-encryption',
        'phishing-llm'
      ],
      oldest: [
        'chest-xray-encryption',
        'phishing-llm',
        'data-efficient-neuroimaging',
        'herald',
        'alzheimer-detection',
        'uc-prun'
      ],
      title: [
        'chest-xray-encryption',
        'data-efficient-neuroimaging',
        'phishing-llm',
        'herald',
        'alzheimer-detection',
        'uc-prun'
      ]
    };
    for (const sort of ['newest', 'oldest', 'title']) {
      await page.goto(
        `/publications/?category=Healthcare%20%26%20Clinical%20AI&category=Privacy%2C%20Trust%20%26%20Safety&year=2025&year=2026&sort=${sort}`
      );
      const expected = expectedBySort[sort as keyof typeof expectedBySort];
      const groups = page.locator('[data-publication-category]:not([hidden])');
      await expect(page.locator('[data-publication-visible-count]')).toHaveText(
        'Total publications: 6'
      );
      await expect(groups).toHaveCount(2);
      const groupedIds = (
        await groups.evaluateAll((sections) =>
          sections.map((section) => ({
            category: section.getAttribute('data-publication-category'),
            ids: [
              ...section.querySelectorAll(
                '[data-publication-record]:not([hidden])'
              )
            ].map((record) => record.getAttribute('data-publication-id'))
          }))
        )
      ).filter(({ ids }) => ids.length > 0);
      const ids = groupedIds.flatMap(({ ids }) => ids);
      expect(groupedIds).toEqual([
        {
          category: 'Privacy, Trust & Safety',
          ids: expected.filter((id) => ['herald', 'phishing-llm'].includes(id))
        },
        {
          category: 'Healthcare & Clinical AI',
          ids: expected.filter((id) =>
            [
              'data-efficient-neuroimaging',
              'alzheimer-detection',
              'uc-prun',
              'chest-xray-encryption'
            ].includes(id)
          )
        }
      ]);
      expect(new Set(ids).size).toBe(ids.length);
      expect(
        await page.locator('[data-publication-category]:not([hidden])').count()
      ).toBe(2);
      expect(
        await page.locator('[data-publication-category][hidden]').count()
      ).toBeGreaterThan(0);
      await expect(
        page.locator('[data-publication-filtered-results]')
      ).toHaveCount(0);
    }

    await page.goto(
      '/publications/?category=Healthcare%20%26%20Clinical%20AI&category=Privacy%2C%20Trust%20%26%20Safety&year=2025&year=2026&sort=citations'
    );
    await expect(page.getByLabel('Sort results')).toHaveValue('citations');
    await expect(page.locator('[data-publication-visible-count]')).toHaveText(
      'Total publications: 6'
    );
    await expect(
      page.locator(
        '[data-publication-category]:not([hidden]) [data-publication-record]:not([hidden])'
      )
    ).toHaveCount(6);
  });

  test('renders evidence, structured data, and an accessible BibTeX action on a featured detail route', async ({
    context,
    page
  }, testInfo) => {
    if (testInfo.project.name === 'chromium') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    }
    await page.goto('/publications/uc-prun/');

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Uc-PrUn: Uncertainty-Calibrated Machine Unlearning using Vision-Language Models for Clinical Decision Support'
      })
    ).toBeVisible();
    await expect(page.locator('[data-citation-metric]')).toContainText(
      /scholar · \d{4}-\d{2}-\d{2}/
    );
    await expect(page.locator('[data-publication-detail]')).toContainText(
      '2026'
    );
    await page.getByRole('button', { name: 'Copy BibTeX' }).click();
    await expect(page.locator('[data-bibtex-status]')).toHaveText(
      /BibTeX copied\.|Copy unavailable; copy manually\./
    );
    expect(
      await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll(
          (scripts) =>
            scripts.filter((script) =>
              script.textContent?.includes('ScholarlyArticle')
            ).length
        )
    ).toBe(1);
    await expect(
      page.getByText('Related papers', { exact: false })
    ).toHaveCount(0);

    const report = await new AxeBuilder({ page }).analyze();
    expect(
      report.violations.filter(
        ({ impact }) => impact === 'serious' || impact === 'critical'
      )
    ).toEqual([]);
  });

  test('keeps detail return navigation distinct and preprint bibliography factual', async ({
    page
  }) => {
    await page.goto('/publications/herald/');

    const back = page.getByRole('link', { name: 'Back to publications' });
    await expect(back).toBeVisible();
    await back.focus();
    await expect(back).toBeFocused();
    await back.press('Enter');
    await expect(page).toHaveURL('/publications/');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Publications' })
    ).toBeVisible();

    await page.goto('/publications/herald/');
    await expect(
      page.getByText('TLDR — verified methodology and contribution summary')
    ).toBeVisible();
    await expect(
      page.getByText(
        'HERALD protects selected sensitive tokens with client-side deterministic ciphertext while preserving context and downstream clinical utility.'
      )
    ).toHaveCount(1);
    await expect(page.locator('[data-publication-detail] details')).toHaveCount(
      2
    );
    const bibtex = await page
      .getByRole('button', { name: 'Copy BibTeX' })
      .getAttribute('data-bibtex-value');
    expect(bibtex).toMatch(/^@misc\{/);
    expect(bibtex).not.toContain('booktitle');
    expect(bibtex).toContain('eprint = {2606.03399}');
  });

  test('preserves an applied catalog query through the visible detail return path', async ({
    page
  }) => {
    await page.goto('/publications/?q=herald&sort=title');

    const detailLink = page.getByRole('link', {
      name: /Selective Token-Level Cryptographic Redaction/
    });
    await expect(detailLink).toHaveAttribute(
      'href',
      /return=q%3Dherald%26sort%3Dtitle/
    );
    await detailLink.click();
    await expect(page).toHaveURL(/return=q%3Dherald%26sort%3Dtitle/);

    await page.getByRole('link', { name: 'Back to publications' }).click();
    await expect(page).toHaveURL('/publications/?q=herald&sort=title');
    await expect(
      page.getByText('Total publications: 1', { exact: true })
    ).toBeVisible();
  });

  test('preserves an incoming category filter through the visible detail return path', async ({
    page
  }) => {
    await page.goto('/publications/?category=Healthcare%20%26%20Clinical%20AI');

    const detailLink = page.getByRole('link', {
      name: /Uc-PrUn: Uncertainty-Calibrated Machine Unlearning/
    });
    await expect(detailLink).toHaveAttribute(
      'href',
      /return=category%3DHealthcare%2B%2526%2BClinical%2BAI/
    );
    await detailLink.click();
    await page.getByRole('link', { name: 'Back to publications' }).click();

    await expect(page).toHaveURL(
      '/publications/?category=Healthcare+%26+Clinical+AI'
    );
    await expect(page.locator('[data-publication-visible-count]')).toHaveText(
      'Total publications: 4'
    );
  });
});
