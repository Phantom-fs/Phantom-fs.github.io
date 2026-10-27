import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/research/', '/publications/', '/projects/', '/about/'];

for (const width of [390, 1440]) {
  test(`route introductions share readable spacing at ${width}px`, async ({
    page
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const positions: { x: number; y: number }[] = [];
    for (const route of routes) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const introduction = page.locator('.page-introduction__content');
      const geometry = await introduction.evaluate((element) => {
        const heading = element.querySelector('h1')!.getBoundingClientRect();
        const [summary, supporting] = Array.from(
          element.querySelectorAll('p')
        ).map((paragraph) => paragraph.getBoundingClientRect());
        return {
          x: heading.x,
          y: heading.y + scrollY,
          titleGap: summary.top - heading.bottom,
          summaryGap: supporting.top - summary.bottom
        };
      });
      positions.push({ x: geometry.x, y: geometry.y });
      expect(geometry.titleGap).toBeCloseTo(24, 0);
      expect(geometry.summaryGap).toBeCloseTo(24, 0);
      await expect(
        introduction.locator(':scope > :first-child')
      ).toHaveJSProperty('tagName', 'H1');
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
    }
    expect(new Set(positions.map(({ x, y }) => `${x},${y}`)).size).toBe(1);
    await page.goto('/projects/');
    await expect(
      page.locator('.project-case-study__header > .type-label')
    ).toHaveCount(0);
  });
}

test('Research actions and About opportunities have symmetric section spacing', async ({
  page
}) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/research/');
    await expect(page.locator('.research-domain > .type-metadata')).toHaveCount(
      0
    );
    const actionSpacing = await page
      .locator('.research-cta')
      .evaluate((section) => {
        const actions = section.querySelector('.research-cta__inner')!;
        const bounds = section.getBoundingClientRect();
        const actionBounds = actions.getBoundingClientRect();
        return {
          top: actionBounds.top - bounds.top - 1,
          bottom: bounds.bottom - actionBounds.bottom
        };
      });
    expect(actionSpacing.top).toBeCloseTo(actionSpacing.bottom, 0);

    await page.goto('/about/');
    const opportunity = page.locator('.about-opportunity');
    const padding = await opportunity.evaluate((section) => {
      const style = getComputedStyle(section);
      return {
        top: style.paddingTop,
        bottom: style.paddingBottom,
        border: style.borderTopWidth
      };
    });
    expect(padding.border).toBe('1px');
    expect(padding.top).toBe(padding.bottom);
    const contentGap = await opportunity
      .locator('.about-opportunity__grid > div')
      .last()
      .evaluate((column) => {
        const [copy, action] = Array.from(column.children);
        return (
          action.getBoundingClientRect().top -
          copy.getBoundingClientRect().bottom
        );
      });
    expect(contentGap).toBeCloseTo(8, 0);
  }
});

test('both themes style browser surfaces and keep keyboard focus without decorative arrows', async ({
  page
}) => {
  await page.goto('/research/');
  const toggle = page.locator('[data-theme-toggle]');
  for (const theme of ['light', 'dark'] as const) {
    if (theme === 'dark') await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      theme === 'dark' ? '#202325' : '#FAFAF8'
    );
    const action = page.getByRole('link', {
      name: 'Browse publications',
      exact: true
    });
    await page.keyboard.press('Tab');
    await action.focus();
    await expect(action).toHaveCSS('outline-style', 'solid');
    await expect(action).toHaveCSS('outline-width', '3px');
    expect(
      await action.evaluate((element) => element.matches(':focus-visible'))
    ).toBe(true);
    await expect(page.locator('.action__arrow')).toHaveCount(0);
    expect(await page.locator('.action').allTextContents()).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/[→↗←]/)])
    );
    await expect(
      page.locator('[data-selected="true"][data-domain-relationship]').first()
    ).toHaveCSS('box-shadow', 'none');
  }
});

test('Research tabs retain valid accessibility structure in both themes', async ({
  page
}) => {
  await page.goto('/research/');
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.locator('[data-theme-toggle]').click();
    const report = await new AxeBuilder({ page }).analyze();
    expect(
      report.violations.filter(
        ({ impact }) => impact === 'serious' || impact === 'critical'
      )
    ).toEqual([]);
    await expect(page.getByRole('tab', { selected: true })).toHaveCount(1);
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
  }
});

test('search placeholder remains legible in both themes', async ({ page }) => {
  await page.goto('/publications/');
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.locator('[data-theme-toggle]').click();
    const contrast = await page
      .locator('input[type="search"]')
      .evaluate((input) => {
        const placeholder = getComputedStyle(input, '::placeholder');
        const background = getComputedStyle(input)
          .backgroundColor.match(/[\d.]+/g)!
          .map(Number);
        const foreground = placeholder.color.match(/[\d.]+/g)!.map(Number);
        const opacity = Number(placeholder.opacity) * (foreground[3] ?? 1);
        const composite = foreground
          .slice(0, 3)
          .map(
            (value, index) =>
              value * opacity + background[index] * (1 - opacity)
          );
        const luminance = (channels: number[]) =>
          channels.slice(0, 3).reduce((sum, value, index) => {
            const channel = value / 255;
            const linear =
              channel <= 0.04045
                ? channel / 12.92
                : ((channel + 0.055) / 1.055) ** 2.4;
            return sum + linear * [0.2126, 0.7152, 0.0722][index];
          }, 0);
        const values = [luminance(composite), luminance(background)].sort(
          (a, b) => b - a
        );
        return (values[0] + 0.05) / (values[1] + 0.05);
      });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  }
});
