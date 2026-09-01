import { expect, test } from '@playwright/test';

type VisualCase = {
  colorScheme: 'dark' | 'light';
  height: number;
  name: string;
  path: string;
  width: number;
};

const visualCases: VisualCase[] = [
  {
    name: 'home-320-light',
    path: '/',
    width: 320,
    height: 568,
    colorScheme: 'light'
  },
  {
    name: 'home-390-dark',
    path: '/',
    width: 390,
    height: 844,
    colorScheme: 'dark'
  },
  {
    name: 'research-768-light',
    path: '/research/',
    width: 768,
    height: 1024,
    colorScheme: 'light'
  },
  {
    name: 'research-1024x700-dark',
    path: '/research/',
    width: 1024,
    height: 700,
    colorScheme: 'dark'
  },
  {
    name: 'publications-390x844-light',
    path: '/publications/',
    width: 390,
    height: 844,
    colorScheme: 'light'
  },
  {
    name: 'publications-1023x900-light',
    path: '/publications/',
    width: 1023,
    height: 900,
    colorScheme: 'light'
  },
  {
    name: 'publications-1024x900-dark',
    path: '/publications/',
    width: 1024,
    height: 900,
    colorScheme: 'dark'
  },
  {
    name: 'publications-1440x900-light',
    path: '/publications/',
    width: 1440,
    height: 900,
    colorScheme: 'light'
  },
  {
    name: 'publications-1024x768-light',
    path: '/publications/',
    width: 1024,
    height: 768,
    colorScheme: 'light'
  },
  {
    name: 'publications-1920-dark',
    path: '/publications/',
    width: 1920,
    height: 1080,
    colorScheme: 'dark'
  },
  {
    name: 'projects-1440-light',
    path: '/projects/',
    width: 1440,
    height: 900,
    colorScheme: 'light'
  },
  {
    name: 'about-1440-dark',
    path: '/about/',
    width: 1440,
    height: 900,
    colorScheme: 'dark'
  },
  {
    name: 'home-boundary-767-light',
    path: '/',
    width: 767,
    height: 900,
    colorScheme: 'light'
  },
  {
    name: 'research-boundary-768-dark',
    path: '/research/',
    width: 768,
    height: 900,
    colorScheme: 'dark'
  },
  {
    name: 'publications-boundary-1023-light',
    path: '/publications/',
    width: 1023,
    height: 768,
    colorScheme: 'light'
  },
  {
    name: 'publications-boundary-1024-dark',
    path: '/publications/',
    width: 1024,
    height: 768,
    colorScheme: 'dark'
  },
  {
    name: 'projects-boundary-1439-light',
    path: '/projects/',
    width: 1439,
    height: 900,
    colorScheme: 'light'
  },
  {
    name: 'about-boundary-1440-dark',
    path: '/about/',
    width: 1440,
    height: 900,
    colorScheme: 'dark'
  }
];

test.describe('approved responsive visual baselines', () => {
  for (const visualCase of visualCases) {
    test(visualCase.name, async ({ page }) => {
      await page.setViewportSize({
        width: visualCase.width,
        height: visualCase.height
      });
      await page.emulateMedia({
        colorScheme: visualCase.colorScheme,
        reducedMotion: 'reduce'
      });
      await page.addInitScript((theme) => {
        localStorage.setItem('atlas-theme', theme);
      }, visualCase.colorScheme);
      await page.goto(visualCase.path);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('html')).toHaveAttribute(
        'data-theme',
        visualCase.colorScheme
      );

      await expect(page).toHaveScreenshot(`${visualCase.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
        fullPage: false
      });
    });
  }
});
