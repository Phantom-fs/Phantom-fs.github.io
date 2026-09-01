import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const requiredHomeSections = [
  'identity',
  'opportunity',
  'impact',
  'updates',
  'atlas',
  'publications',
  'collaboration',
  'visitor-map'
];
const mapSource =
  'https://mapmyvisitors.com/map.js?cl=e8e4e4&w=350&t=tt&d=B66x2QoETm-rNLiPfNrv2mAeGKYz5sFIJhRl8zGpbBg&co=2786c9&cmo=d92e2e&cmn=2cad2c';

test.describe('Home and Research routes', () => {
  test('renders the approved Home sequence, hierarchy, and evidence', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route(mapSource, async (route) => {
      await route.fulfill({
        body: `document.currentScript?.parentElement?.insertAdjacentHTML('beforeend', '<a class="mapmyvisitors-map-control" id="mapmyvisitors-widget" href="https://mapmyvisitors.com/web/1c0z7"><span class="mapmyvisitors-visitors">Fixture pageviews</span></a>');`,
        contentType: 'text/javascript',
        status: 200
      });
    });
    await page.goto('/');

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'AI researcher'
      })
    ).toBeVisible();
    expect(
      await page.locator('.home-hero__statement').evaluate((statement) => {
        const styles = getComputedStyle(statement);
        return Math.round(
          statement.getBoundingClientRect().height /
            Number.parseFloat(styles.lineHeight)
        );
      })
    ).toBeLessThanOrEqual(3);
    await expect(page.getByRole('main')).toHaveAttribute('data-route', 'home');
    expect(
      await page
        .locator('[data-home-section]')
        .evaluateAll((sections) =>
          sections.map((section) => section.dataset.homeSection)
        )
    ).toEqual(requiredHomeSections);
    await expect(
      page.getByRole('link', { name: 'Explore publications' })
    ).toHaveAttribute('href', '/publications/');
    await expect(
      page.getByRole('link', { name: 'View research agenda' })
    ).toHaveAttribute('href', '/research/');
    await expect(
      page.getByRole('link', {
        name: 'Discuss 2026–2027 opportunities'
      })
    ).toHaveAttribute('href', /mailto:farhansheth\.jb@gmail\.com/);
    await expect(page.locator('main')).not.toContainText(
      'Nanyang Technological University'
    );
    await expect(page.locator('[data-home-pick]')).toHaveCount(4);
    const venueRail = page.locator('[data-hero-venues]');
    await expect(venueRail.getByText('Published in')).toBeVisible();
    expect(await venueRail.getByRole('link').allTextContents()).toEqual([
      'EACL',
      'Interspeech',
      'IJCNLP-AACL',
      'ACM HEALTH',
      'EAAI',
      'ICHMT'
    ]);
    await expect(venueRail).not.toContainText(/accepted at|acceptance/i);
    await expect(page.locator('[data-home-section="updates"]')).toBeVisible();
    const recruitView = page
      .locator('[data-home-pick]')
      .filter({ hasText: 'RecruitView' });
    await expect(recruitView.locator('[data-home-pick-metadata]')).toHaveText(
      'Under review'
    );
    await expect(
      page.locator('[data-home-section="visitor-map"] iframe')
    ).toHaveCount(0);
    await expect(page.locator('#mapmyvisitors-widget')).toHaveAttribute(
      'tabindex',
      '-1'
    );

    const report = await new AxeBuilder({ page }).analyze();
    expect(
      report.violations.filter(
        ({ impact }) => impact === 'serious' || impact === 'critical'
      )
    ).toEqual([]);
  });

  test('keeps the Home hero as a bounded side-by-side identity and portrait composition', async ({
    page
  }) => {
    await page.route(mapSource, async (route) => {
      await route.fulfill({
        body: `document.currentScript?.parentElement?.insertAdjacentHTML('beforeend', '<a class="mapmyvisitors-map-control" href="https://mapmyvisitors.com/web/1c0z7" style="width: 350px"><span class="mapmyvisitors-map-container" style="display: block; width: 350px"><span class="mapmyvisitors-visitors">Fixture pageviews</span></span></a>');`,
        contentType: 'text/javascript',
        status: 200
      });
    });
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1440, height: 900 }
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const hero = page.locator('[data-home-hero]');
      await expect(hero.locator('.portrait-frame__atlas')).toHaveCount(0);
      await expect(hero.locator('[data-profile-icon]')).toHaveCount(6);
      await expect(
        hero
          .locator('[data-profile-icon]')
          .evaluateAll((icons) =>
            icons.map((icon) => icon.getAttribute('data-profile-icon'))
          )
      ).resolves.toEqual([
        'Google Scholar',
        'ORCID',
        'GitHub',
        'LinkedIn',
        'ResearchGate',
        'DBLP'
      ]);
      await expect(hero.locator('[data-portrait-frame]')).toHaveCSS(
        'border-top-left-radius',
        '10px'
      );
      await expect(hero.locator('[data-portrait-frame]')).toHaveCSS(
        'border-left-width',
        '4px'
      );
      const geometry = await hero.evaluate((element) => {
        const identity = element.querySelector<HTMLElement>(
          '.home-hero__identity'
        );
        const portrait = element.querySelector<HTMLElement>(
          '[data-portrait-frame]'
        );
        const portraitImage = portrait?.querySelector<HTMLImageElement>('img');
        if (!identity || !portrait || !portraitImage) {
          throw new Error('Home identity, portrait, or portrait image missing');
        }
        const identityBox = identity.getBoundingClientRect();
        const portraitBox = portrait.getBoundingClientRect();
        const portraitImageBox = portraitImage.getBoundingClientRect();
        return {
          headingLines: Math.round(
            identity.querySelector('h1')!.getBoundingClientRect().height /
              Number.parseFloat(
                getComputedStyle(identity.querySelector('h1')!).lineHeight
              )
          ),
          identityRight: identityBox.right,
          identityOrder: getComputedStyle(identity).order,
          portraitHeight: portraitBox.height,
          portraitImageHeight: portraitImageBox.height,
          portraitImageWidth: portraitImageBox.width,
          portraitLeft: portraitBox.left,
          portraitOrder: getComputedStyle(portrait).order,
          portraitWidth: portraitBox.width
        };
      });
      expect(
        geometry.identityRight < geometry.portraitLeft,
        `${viewport.width}px opening should remain side-by-side`
      ).toBe(true);
      expect(geometry.identityOrder).toBe('0');
      expect(geometry.portraitOrder).toBe('0');
      expect(geometry.portraitWidth).toBeLessThanOrEqual(
        viewport.width <= 390 ? 132 : 420
      );
      expect(geometry.portraitHeight).toBeGreaterThan(0);
      expect(geometry.portraitHeight / geometry.portraitWidth).toBeGreaterThan(
        1.2
      );
      expect(geometry.portraitHeight / geometry.portraitWidth).toBeLessThan(
        1.4
      );
      expect(
        geometry.portraitImageHeight / geometry.portraitImageWidth
      ).toBeLessThan(1.35);
      if (viewport.width <= 390) {
        expect(geometry.headingLines).toBeLessThanOrEqual(2);
      }
      const dimensions = await page.evaluate(() => {
        const width = window.innerWidth;
        const overflowing = [...document.querySelectorAll<HTMLElement>('*')]
          .filter(
            (element) => element.getBoundingClientRect().right > width + 1
          )
          .slice(0, 3)
          .map((element) => ({
            className: element.className,
            right: Math.round(element.getBoundingClientRect().right),
            tagName: element.tagName
          }));
        return {
          overflowing,
          scrollWidth: document.documentElement.scrollWidth,
          width
        };
      });
      expect(
        dimensions.scrollWidth <= dimensions.width,
        `${viewport.width}×${viewport.height}: ${dimensions.scrollWidth}px > ${dimensions.width}px; ${JSON.stringify(dimensions.overflowing)}`
      ).toBe(true);
    }
  });

  test('keeps portrait motion optional without hiding the semantic opening', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('[data-portrait-frame]')).toHaveCSS(
      'animation-duration',
      '7s'
    );
    await expect(page.locator('[data-portrait-frame] img')).toHaveCSS(
      'animation-name',
      'portrait-image-drift'
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await expect(page.locator('[data-portrait-frame]')).toHaveCSS(
      'animation-name',
      'none'
    );
    await page.emulateMedia({ forcedColors: 'active' });
    await page.reload();
    await expect(page.locator('[data-home-hero]')).toBeVisible();
  });

  test('uses exactly one meaningful Research atlas and only sticks it with space', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/research/');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Research agenda' })
    ).toBeVisible();
    await expect(page.locator('[data-research-domain]')).toHaveCount(6);
    await expect(page.locator('[data-research-atlas]')).toHaveCount(1);
    await expect(page.locator('[data-research-atlas]')).toHaveCSS(
      'position',
      'sticky'
    );
    await expect(page.locator('[data-research-atlas]')).toHaveAttribute(
      'data-current-domain',
      /.+/
    );
    await expect(
      page.locator('[data-research-atlas] [aria-selected="true"]')
    ).toHaveText('Healthcare & Clinical AI');

    await page.setViewportSize({ width: 1024, height: 700 });
    await expect(page.locator('[data-research-atlas]')).toHaveCSS(
      'position',
      'static'
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-research-atlas]')).toHaveCSS(
      'position',
      'static'
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });

  test('loads the reference visitor map immediately without a fallback surface', async ({
    page
  }) => {
    const mapRequests: string[] = [];
    await page.route(mapSource, async (route) => {
      mapRequests.push(route.request().url());
      await route.fulfill({
        body: '',
        contentType: 'text/javascript',
        status: 200
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const map = page.locator('[data-visitor-map]');
    await expect.poll(() => mapRequests).toEqual([mapSource]);
    await expect(map.locator('#mapmyvisitors')).toHaveAttribute(
      'src',
      mapSource
    );
    await expect(map.locator('img')).toHaveCount(0);
    await expect(map.locator('[role="status"]')).toHaveCount(0);
    await expect(map.locator('.visitor-map__frame')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    await expect(map.locator('.visitor-map__frame')).toHaveCSS(
      'min-height',
      '224px'
    );
  });

  test('keeps source-aware metric provenance out of the Home impact strip', async ({
    page
  }) => {
    await page.goto('/');

    const impact = page.locator('[data-home-section="impact"]');
    await expect(impact.locator('[data-citation-metric]')).toHaveCount(4);
    await expect(impact.getByRole('link')).toHaveCount(0);
    await expect(impact).toContainText('Google Scholar metrics');
    await expect(impact).not.toContainText(
      /build-time|updated|stale|openalex/i
    );
    await expect(impact.getByText('Total citations')).toBeVisible();
    await expect(impact.getByText('h-index')).toBeVisible();
    await expect(impact.getByText('i10-index')).toBeVisible();
    await expect(impact.getByText('Publications')).toBeVisible();
    await page.goto('/research/');
    await expect(
      page.getByText(
        'My research asks how learned representations can remain useful, accountable, and resilient when they meet people, sensitive data, and changing environments.'
      )
    ).toBeVisible();
  });

  test('gives the relationship index two useful paths from each validated domain', async ({
    browser,
    page
  }) => {
    await page.goto('/');
    const homeAtlas = page.locator('[data-home-section="atlas"]');
    await expect(
      homeAtlas.locator('[data-domain-relationship-index]')
    ).toHaveCount(1);
    await expect(
      homeAtlas
        .locator('[data-domain-relationship-index]')
        .getByRole('heading', { level: 3, name: 'Research areas' })
    ).toBeVisible();
    await expect(homeAtlas.locator('[data-domain-relationship]')).toHaveCount(
      6
    );
    await expect(homeAtlas.locator('[data-domain-research-link]')).toHaveCount(
      6
    );
    await expect(
      homeAtlas.locator('[data-domain-publications-link]')
    ).toHaveCount(6);
    await expect(homeAtlas.locator('svg')).toHaveCount(0);
    await expect(
      homeAtlas.locator('[data-domain-research-link]').first()
    ).toHaveAttribute('href', /^\/research\/#/);
    await expect(
      homeAtlas.locator('[data-domain-publications-link]').first()
    ).toHaveAttribute('href', /^\/publications\/\?category=/);
    await expect(
      homeAtlas.locator('[data-relationship-explainer]')
    ).toHaveCount(0);
    await expect(homeAtlas).not.toContainText(
      /collaborator country|affiliation request/i
    );

    await page.goto('/research/');
    await expect(
      page
        .locator('[data-research-atlas]')
        .getByRole('heading', { level: 2, name: 'Research areas' })
    ).toBeVisible();

    const noJavaScript = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJavaScript.newPage();
    await staticPage.goto('/');
    await expect(staticPage.locator('[data-domain-relationship]')).toHaveCount(
      6
    );
    await expect(
      staticPage.locator('[data-domain-publications-link]').first()
    ).toHaveAttribute('href', /^\/publications\/\?category=/);
    await noJavaScript.close();
  });

  test('enhances the Home identity group once without hiding its content by default', async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    const hero = page.locator('[data-home-hero]');
    await expect(hero).toHaveAttribute('data-entrance', 'complete');
    await expect(hero.locator('.home-hero__identity')).toBeVisible();
    await expect(hero.locator('.home-hero__statement')).toHaveCSS(
      'animation-name',
      'none'
    );
    await expect(hero.getByRole('heading', { level: 1 })).toHaveCSS(
      'animation-name',
      'home-entrance'
    );
    await expect(hero.locator('[data-portrait-frame]')).toBeVisible();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await expect(hero).not.toHaveAttribute('data-entrance', 'complete');
    await expect(hero.locator('.home-hero__identity')).toBeVisible();
  });

  test('refines Home discovery surfaces without introducing card-heavy evidence', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const hero = page.locator('[data-home-hero]');
    const venues = hero.locator('[data-hero-venues]');
    await expect(venues.getByText('Published in')).toBeVisible();
    await expect(venues.getByRole('link')).toHaveCount(6);
    await expect(venues.getByRole('link').first()).toHaveText('EACL');
    await expect(venues.locator('svg')).toHaveCount(0);
    await expect(page.locator('[data-home-section="venues"]')).toHaveCount(0);

    const opportunity = page.locator('[data-home-section="opportunity"]');
    await expect(
      opportunity.getByText('Research opportunities', { exact: true })
    ).toBeVisible();
    await expect(
      opportunity.getByRole('heading', {
        level: 2,
        name: '2026–2027 research opportunities'
      })
    ).toBeVisible();
    await expect(opportunity).not.toContainText(
      'Nanyang Technological University'
    );

    const news = page.locator('[data-home-section="updates"]');
    await expect(
      news.getByRole('heading', { level: 2, name: 'News' })
    ).toBeVisible();
    await expect(news.locator('li').first()).toContainText('August 2026');
    await expect(news.locator('li h3')).toHaveCount(0);
    await expect(news.locator('li p').first()).toHaveCSS(
      'font-family',
      /Newsreader/
    );
    await expect(news.locator('li strong')).toHaveCount(5);
    await expect(news.locator('li strong').first()).toHaveText(
      'ACM Transactions on Computing for Healthcare'
    );
    await expect(news.locator('li p').first()).toHaveText(
      'Uc-PrUn accepted at ACM Transactions on Computing for Healthcare'
    );
    await expect(news).not.toContainText(/published/i);
    await expect(
      news.locator('[data-home-update-paper]').allTextContents()
    ).resolves.toEqual([
      'Uc-PrUn',
      'Learning heat',
      'SIGNAL',
      'ORBIT',
      'Two synthetic-speech papers'
    ]);
    const newsPaper = news.locator('[data-home-update-paper]').first();
    const newsVenue = news.locator('li strong').first();
    const newsSentence = news.locator('li p').first();
    await expect(newsPaper).toHaveCSS('font-weight', '400');
    await expect(newsSentence).toHaveCSS('font-weight', '400');
    await expect(newsVenue).toHaveCSS('font-weight', '700');
    await expect(newsPaper).toHaveCSS(
      'color',
      await news
        .locator('li p')
        .first()
        .evaluate((element) => getComputedStyle(element).color)
    );

    const impact = page.locator('[data-home-section="impact"]');
    const newsHeading = news.getByRole('heading', { level: 2, name: 'News' });
    const atlasHeading = page.getByRole('heading', {
      level: 2,
      name: 'How the work connects'
    });
    await expect(atlasHeading).toHaveCSS(
      'font-size',
      await impact
        .getByRole('heading', { level: 2, name: 'Academic impact' })
        .evaluate((element) => getComputedStyle(element).fontSize)
    );
    expect(
      await impact
        .getByRole('heading', { level: 2, name: 'Academic impact' })
        .evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).fontSize)
        )
    ).toBeGreaterThanOrEqual(34);
    await expect(newsHeading).toHaveCSS(
      'font-size',
      await impact
        .getByRole('heading', { level: 2, name: 'Academic impact' })
        .evaluate((element) => getComputedStyle(element).fontSize)
    );
    expect(
      await impact
        .locator('[data-citation-metric]')
        .first()
        .evaluate((element) => getComputedStyle(element).backgroundColor)
    ).not.toBe('rgba(0, 0, 0, 0)');
    await expect(impact.locator('[data-citation-metric]').first()).toHaveCSS(
      'border-top-left-radius',
      '10px'
    );
    await expect(impact.locator('[data-citation-metric]').first()).toHaveCSS(
      'background-image',
      /linear-gradient/
    );

    const atlas = page.locator('[data-home-section="atlas"]');
    await expect(atlas).toHaveCSS('border-top-width', '1px');
    await expect(
      atlas.getByRole('heading', { level: 3, name: 'Research areas' })
    ).toBeVisible();
    await expect(
      atlas.getByRole('heading', { level: 3, name: 'Research areas' })
    ).toHaveCSS(
      'font-size',
      await impact
        .getByRole('heading', { level: 2, name: 'Academic impact' })
        .evaluate((element) => getComputedStyle(element).fontSize)
    );
    await expect(atlas.locator('[aria-current="true"]')).toHaveCount(0);
    expect(
      await atlas
        .locator('[data-domain-relationship]')
        .nth(1)
        .evaluate((element) => getComputedStyle(element).backgroundColor)
    ).not.toBe('rgba(0, 0, 0, 0)');

    await expect(
      page.getByRole('heading', { level: 2, name: 'Selected publications' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Selected publications' })
    ).toHaveCSS(
      'font-size',
      await impact
        .getByRole('heading', { level: 2, name: 'Academic impact' })
        .evaluate((element) => getComputedStyle(element).fontSize)
    );
    await expect(page.locator('[data-home-section="publications"]')).toHaveCSS(
      'border-top-width',
      '1px'
    );
    expect(
      await page
        .locator('[data-home-pick] .editorial-picks__title')
        .first()
        .evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).fontSize)
        )
    ).toBeLessThanOrEqual(20);
    await expect(
      page.locator('[data-home-pick]').filter({ hasText: 'Interspeech · 2026' })
    ).toHaveCSS('border-bottom-width', '1px');
    await expect(page.getByText('Selected record')).toHaveCount(0);

    const visitorMap = page.locator('[data-visitor-map]');
    await expect(
      visitorMap.getByRole('heading', {
        level: 2,
        name: 'Visitors around the world'
      })
    ).toBeVisible();
    await expect(
      visitorMap.locator('[data-visitor-map-disclosure]')
    ).toHaveCount(0);
  });

  test('progressively enhances a single selected research domain without losing the static six-domain reading path', async ({
    browser,
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/research/#speech-audio-synthetic-media');

    const chapter = page.locator('[data-research-chapter]');
    await expect(chapter).toHaveAttribute('data-research-enhanced', 'true');
    const tabs = chapter.getByRole('tab');
    await expect(tabs).toHaveCount(6);
    const selectedTab = chapter.getByRole('tab', { selected: true });
    await expect(selectedTab).toHaveText('Speech, Audio & Synthetic Media');
    await expect(
      chapter.locator('[data-research-domain]:not([hidden])')
    ).toHaveCount(1);

    await selectedTab.press('Home');
    await expect(chapter.getByRole('tab', { selected: true })).toHaveText(
      'Healthcare & Clinical AI'
    );
    await expect(page).toHaveURL(/#healthcare-clinical-ai$/);

    const pointerSelected = tabs.nth(2);
    await pointerSelected.click();
    await expect(chapter.getByRole('tab', { selected: true })).toHaveText(
      'Speech, Audio & Synthetic Media'
    );
    await expect(page).toHaveURL(/#speech-audio-synthetic-media$/);

    const noJavaScript = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJavaScript.newPage();
    await staticPage.goto('/research/');
    await expect(staticPage.locator('[data-research-domain]')).toHaveCount(6);
    await expect(
      staticPage.locator('[data-research-domain]:not([hidden])')
    ).toHaveCount(6);
    await noJavaScript.close();
  });

  test('keeps the Research index and selected panel within every required responsive boundary', async ({
    page
  }) => {
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 767, height: 900 },
      { width: 768, height: 1024 },
      { width: 1023, height: 768 },
      { width: 1024, height: 700 },
      { width: 1439, height: 900 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 }
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/research/#privacy-trust-safety');
      const chapter = page.locator('[data-research-chapter]');
      await expect(chapter.getByRole('tab', { selected: true })).toHaveText(
        'Privacy, Trust & Safety'
      );
      await expect(
        chapter.locator('[data-research-domain]:not([hidden])')
      ).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
    }
  });

  test('keeps portrait motion bounded, pauses it offscreen, and rebinds after client navigation', async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    const portrait = page.locator('[data-portrait-frame]');
    await expect(portrait).toHaveAttribute('data-motion-paused', 'false');
    const keyframes = await portrait.evaluate((frame) => {
      const portraitAnimation = (frame.getAnimations() as CSSAnimation[]).find(
        (animation) => animation.animationName === 'portrait-drift'
      );
      const image = frame.querySelector('img');
      const imageAnimation = image
        ? (image.getAnimations() as CSSAnimation[]).find(
            (animation) => animation.animationName === 'portrait-image-drift'
          )
        : undefined;
      return {
        image: (imageAnimation?.effect as KeyframeEffect | null)
          ?.getKeyframes()
          .map((keyframe: Keyframe) => keyframe.transform),
        portrait: (portraitAnimation?.effect as KeyframeEffect | null)
          ?.getKeyframes()
          .map((keyframe: Keyframe) => keyframe.transform)
      };
    });
    expect(keyframes.portrait).toEqual([
      'translateY(-6px) rotate(-0.6deg)',
      'translateY(6px) rotate(0.6deg)'
    ]);
    expect(keyframes.image).toEqual(['scale(1.03)', 'scale(1)']);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(portrait).toHaveAttribute('data-motion-paused', 'true');
    await expect(portrait).toHaveCSS('animation-play-state', 'paused');

    await page.getByRole('link', { name: 'Research', exact: true }).click();
    await expect(page.locator('[data-research-chapter]')).toHaveAttribute(
      'data-research-enhanced',
      'true'
    );
    await page.getByRole('link', { name: 'Home', exact: true }).click();
    await expect(page.locator('[data-home-hero]')).toHaveAttribute(
      'data-entrance',
      'complete'
    );
    await expect(page.locator('[data-portrait-frame]')).toHaveAttribute(
      'data-motion-paused',
      'false'
    );
  });

  test('normalizes research hashes and preserves committed selection across pointer, keyboard, and browser history', async ({
    browser,
    page
  }) => {
    await page.goto('/research/#not-a-domain');
    const chapter = page.locator('[data-research-chapter]');
    const selected = () => chapter.getByRole('tab', { selected: true });
    await expect(selected()).toHaveText('Healthcare & Clinical AI');
    await expect(page).toHaveURL(/#healthcare-clinical-ai$/);

    const tabs = chapter.getByRole('tab');
    await tabs.nth(1).hover();
    await expect(selected()).toHaveText('Healthcare & Clinical AI');

    const privacyCard = chapter.locator('[data-domain-relationship]').nth(1);
    await privacyCard.click({ position: { x: 4, y: 4 } });
    await expect(selected()).toHaveText('Privacy, Trust & Safety');
    expect(
      await privacyCard.evaluate(
        (element) => getComputedStyle(element).backgroundColor
      )
    ).not.toBe('rgba(0, 0, 0, 0)');
    expect(
      (await page.locator('#privacy-trust-safety').boundingBox())!.y
    ).toBeGreaterThanOrEqual(-1);

    await page.getByRole('link', { name: 'Home', exact: true }).focus();
    await tabs.nth(2).click();
    await expect(selected()).toHaveText('Speech, Audio & Synthetic Media');
    await expect(
      page.getByRole('link', { name: 'Home', exact: true })
    ).toBeFocused();

    await selected().press('ArrowRight');
    await expect(selected()).toHaveText('Multimodal & Human-Centered AI');
    await selected().press('ArrowDown');
    await expect(selected()).toHaveText('Scientific & Applied AI');
    await selected().press('End');
    await expect(selected()).toHaveText('Earth & Agricultural Intelligence');
    await selected().press('Home');
    await expect(selected()).toHaveText('Healthcare & Clinical AI');
    await selected().press('ArrowLeft');
    await expect(selected()).toHaveText('Earth & Agricultural Intelligence');
    await selected().press('ArrowUp');
    await expect(selected()).toHaveText('Scientific & Applied AI');
    await tabs.nth(1).focus();
    await tabs.nth(1).press('Enter');
    await expect(selected()).toHaveText('Privacy, Trust & Safety');
    await tabs.nth(2).focus();
    await tabs.nth(2).press('Space');
    await expect(selected()).toHaveText('Speech, Audio & Synthetic Media');

    await page.goBack();
    await expect(selected()).toHaveText('Privacy, Trust & Safety');
    await page.goForward();
    await expect(selected()).toHaveText('Speech, Audio & Synthetic Media');
    await page.goto('/research/');
    await expect(selected()).toHaveText('Healthcare & Clinical AI');
    await expect(page).toHaveURL(/#healthcare-clinical-ai$/);

    const noJavaScript = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJavaScript.newPage();
    await staticPage.goto('/research/');
    await expect(staticPage.locator('[data-domain-selector]')).toHaveCount(6);
    await expect(
      staticPage.locator('[data-domain-selector]').first()
    ).toHaveAttribute('href', '#healthcare-clinical-ai');
    await noJavaScript.close();
  });
});
