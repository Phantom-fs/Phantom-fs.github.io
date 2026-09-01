import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const projectIds = [
  'recruitview-crmf',
  'herald-project',
  'agro-companion',
  'herbify-project'
];

const aboutSections = [
  'biography',
  'experience',
  'education',
  'honors',
  'service',
  'opportunity'
];

test.describe('Projects and About routes', () => {
  test('renders four anchored, evidence-led project case studies in authority order', async ({
    page
  }) => {
    await page.goto('/projects/');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Projects' })
    ).toBeVisible();
    await expect(page.getByRole('main')).toHaveAttribute(
      'data-route',
      'projects'
    );
    await expect(
      page.locator('[data-projects-section="collaboration"]')
    ).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Email Farhan' })).toHaveCount(
      0
    );
    expect(
      await page
        .locator('[data-project-case-study]')
        .evaluateAll((entries) => entries.map((entry) => entry.id))
    ).toEqual(projectIds);

    const firstStudy = page.locator('#recruitview-crmf');
    await expect(
      firstStudy.getByText('2,011 naturalistic video interview clips')
    ).toBeVisible();
    await expect(
      firstStudy.getByText(
        '27,000 pairwise comparative judgements across 12 dimensions'
      )
    ).toBeVisible();
    await expect(
      firstStudy.getByText('Up to 11.4% higher Spearman correlation')
    ).toBeVisible();
    await expect(
      firstStudy.getByRole('link', { name: 'Read paper' })
    ).toHaveAttribute('href', '/publications/recruitview/');
    const readPaper = firstStudy.getByRole('link', { name: 'Read paper' });
    await readPaper.focus();
    expect(
      await readPaper.evaluate((link) => link.matches(':focus-visible'))
    ).toBe(true);
    await expect(
      firstStudy
        .getByRole('navigation', { name: 'Resources for RecruitView & CRMF' })
        .getByRole('link', { name: 'Dataset' })
    ).toHaveAttribute(
      'href',
      'https://huggingface.co/datasets/AI4A-lab/RecruitView'
    );
    await expect(
      page.locator('[data-project-case-study] [data-project-field]')
    ).toHaveCount(32);
    const projectJsonLd = page.locator(
      '[data-route="projects"] script[type="application/ld+json"]'
    );
    await expect(projectJsonLd).toHaveCount(1);
    const projectJson = await projectJsonLd.evaluate(
      (script) => script.textContent
    );
    expect(projectJson).not.toBeNull();
    const structuredData = JSON.parse(projectJson ?? '');
    expect(
      structuredData['@graph'].filter(
        (entry: { '@type': string }) => entry['@type'] === 'BreadcrumbList'
      )
    ).toHaveLength(1);
    expect(
      structuredData['@graph'].filter(
        (entry: { '@type': string }) => entry['@type'] === 'Project'
      )
    ).toHaveLength(projectIds.length);
    await expect(
      page.locator('[data-project-case-study] .action--primary')
    ).toHaveCount(projectIds.length);
  });

  test('keeps Projects responsive, static without JavaScript, and free of serious axe findings', async ({
    browser,
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/projects/');
    const report = await new AxeBuilder({ page }).analyze();
    expect(
      report.violations.filter(
        ({ impact }) => impact === 'serious' || impact === 'critical'
      )
    ).toEqual([]);

    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 }
    ]) {
      await page.setViewportSize(viewport);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
    }

    const noJavaScript = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJavaScript.newPage();
    await staticPage.goto('/projects/#herbify-project');
    await expect(staticPage.locator('#herbify-project')).toBeVisible();
    await noJavaScript.close();

    const projectDetail = await page.goto('/projects/recruitview-crmf/');
    expect(projectDetail?.status()).toBe(404);
  });

  test('renders the approved concise About sequence and factual chronology', async ({
    page
  }) => {
    await page.goto('/about/');

    await expect(
      page.getByRole('heading', { level: 1, name: 'About' })
    ).toBeVisible();
    await expect(page.getByRole('main')).toHaveAttribute('data-route', 'about');
    expect(
      await page
        .locator('[data-about-section]')
        .evaluateAll((sections) =>
          sections.map((section) => section.dataset.aboutSection)
        )
    ).toEqual(aboutSections);
    expect(
      await page
        .locator('[data-experience-entry]')
        .evaluateAll((entries) => entries.map((entry) => entry.id))
    ).toEqual([
      'ntu-research-assistant',
      'ai4a-project-lead',
      'ulster-research-intern',
      'manipal-project-lead',
      'nit-research-intern',
      'ulpgc-research-assistant'
    ]);
    await expect(page.locator('#ntu-research-assistant')).toContainText(
      'Current role'
    );
    const ntuExperience = page.locator('#ntu-research-assistant');
    await expect(
      ntuExperience.getByRole('link', { name: 'Dr. Si Yong Yeo' })
    ).toHaveAttribute(
      'href',
      'https://dr.ntu.edu.sg/entities/person/Yeo-Si-Yong'
    );
    await expect(ntuExperience.locator('[data-advisor]')).toHaveText(
      'Advisor: Dr. Si Yong Yeo'
    );
    await expect(
      ntuExperience.locator('[data-advisor]').getByText('Advisor:', {
        exact: true
      })
    ).not.toHaveAttribute('href');
    await expect(
      ntuExperience.locator('[data-experience-description]')
    ).toBeVisible();
    const manipalExperience = page.locator('#manipal-project-lead');
    await expect(
      manipalExperience.getByRole('link', {
        name: 'Prof. Sandeep Chaurasia'
      })
    ).toHaveAttribute(
      'href',
      'https://jaipur.manipal.edu/fosta/faculty-details.php?url=147/'
    );
    await expect(manipalExperience.locator('[data-advisor]')).toHaveText(
      'Advisor: Prof. Sandeep Chaurasia'
    );
    await expect(
      manipalExperience.locator('[data-experience-description]')
    ).toHaveText(
      /^Led the grant-supported multimodal interview-assessment project/
    );
    const education = page.locator('[data-about-section="education"]');
    await expect(
      education.getByText('CGPA: 8.53/10.0', { exact: true })
    ).toBeVisible();
    await expect(
      education.getByText(/^Coursework: Artificial Intelligence/)
    ).toBeVisible();
    await expect(education).not.toContainText(
      'Bachelor of Technology coursework and academic record.'
    );
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'Teaching and academic service'
      })
    ).toBeVisible();
    await expect(page.locator('[data-about-section="updates"]')).toHaveCount(0);
    await expect(
      page.locator('[data-about-section="service"]')
    ).not.toContainText(/community volunteering/i);
    await expect(page.locator('[data-about-section="service"]')).toContainText(
      'Reviewer, ICASSP 2026'
    );
    await expect(
      page
        .locator('[data-about-section="service"] li')
        .filter({
          has: page.getByRole('heading', { name: 'Reviewer, ICASSP 2026' })
        })
        .locator('p')
    ).toHaveCount(1);
    const opportunity = page.locator('[data-about-section="opportunity"]');
    await expect(opportunity).toContainText(
      'Seeking prospective advisors and funded PhD opportunities for 2026–2027.'
    );
    await expect(
      opportunity.getByRole('link', {
        name: 'Discuss 2026–2027 opportunities'
      })
    ).toHaveAttribute(
      'href',
      'mailto:farhansheth.jb@gmail.com?subject=2026%E2%80%932027%20research%20opportunity'
    );
    await expect(
      page.locator('[data-about-section="acknowledgements"]')
    ).toHaveCount(0);
    await expect(page.locator('[data-about-section="contact"]')).toHaveCount(0);
    await expect(page.getByText(/Contact and CV|Next step/i)).toHaveCount(0);
    await expect(
      page.locator('[data-about-section="honors"]')
    ).not.toContainText('Manipal University Jaipur · 2025');
  });

  test('serves a valid CV and keeps About accessible at 320px', async ({
    page,
    request
  }) => {
    const cv = await request.get('/files/Farhan_Sheth_CV.pdf');
    expect(cv.ok()).toBe(true);
    expect(cv.headers()['content-type']).toContain('application/pdf');
    expect((await cv.body()).subarray(0, 4).toString()).toBe('%PDF');

    await page.setViewportSize({ width: 320, height: 568 });
    await page.emulateMedia({
      reducedMotion: 'reduce',
      forcedColors: 'active'
    });
    await page.goto('/about/');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    const report = await new AxeBuilder({ page }).analyze();
    expect(
      report.violations.filter(
        ({ impact }) => impact === 'serious' || impact === 'critical'
      )
    ).toEqual([]);
  });

  test('keeps the concise About reading axis free of long-copy overflow', async ({
    page
  }) => {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 }
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/about/');
      const layout = await page.evaluate(() => {
        return {
          overflow: document.documentElement.scrollWidth > window.innerWidth
        };
      });
      expect(layout.overflow, `${viewport.width}px About overflow`).toBe(false);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/about/');
    await page.addStyleTag({
      content:
        '* { letter-spacing: 0.12em; word-spacing: 0.16em; line-height: 1.5 !important; }'
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });

  test('reflows About and Projects at the 200% zoom CSS viewport equivalent', async ({
    browser
  }) => {
    // At 200% browser zoom, a 640x1136 physical viewport exposes the 320x568
    // CSS layout viewport below. This checks reflow at the site's supported
    // minimum width; device scale factor is not used because it changes pixels
    // without changing the CSS layout width.
    const zoomed = await browser.newContext({
      viewport: { height: 568, width: 320 }
    });
    const page = await zoomed.newPage();

    await page.goto('/about/');
    const about = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      viewportWidth: window.innerWidth
    }));
    expect(about.viewportWidth).toBe(320);
    expect(about.overflow).toBe(false);

    await page.goto('/projects/');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    await zoomed.close();
  });

  test('reflows both routes at every specified boundary, zoom, and touch preference', async ({
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
      { width: 767, height: 900 },
      { width: 768, height: 1024 },
      { width: 1023, height: 900 },
      { width: 1024, height: 700 },
      { width: 1024, height: 768 },
      { width: 1439, height: 900 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 }
    ]) {
      await page.setViewportSize(viewport);
      for (const route of ['/projects/', '/about/']) {
        await page.goto(route);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          ),
          `${route} at ${viewport.width}×${viewport.height}`
        ).toBe(true);
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects/');
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
});
