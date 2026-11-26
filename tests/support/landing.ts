/**
 * SPEC.md "Landing page". Shared by landing.spec.ts (real content) and
 * landing.fixtures.spec.ts (sample content), so the hook's behaviour is
 * checked even before the real hook line exists.
 */
import { expect, test, type Page } from '@playwright/test';
import { buildOf, open, postsNewestFirst, projectsNewestFirst, sentences, siteText } from './site';

/** Per-character weight and optical size of the hook line (the landing h1). */
async function hookState(page: Page) {
  return page.locator('main h1').first().evaluate((h1) => {
    const leaves = [...h1.querySelectorAll<HTMLElement>('*')].filter(
      (el) => el.children.length === 0 && el.textContent!.trim() && el.getBoundingClientRect().width > 1,
    );
    return leaves.map((el) => {
      const s = getComputedStyle(el);
      const opsz = s.fontVariationSettings.match(/"opsz"\s+([\d.]+)/)?.[1];
      return { weight: Number(s.fontWeight), opsz: opsz ? Number(opsz) : null, color: s.color };
    });
  });
}

const spread = (xs: number[]) => (xs.length ? Math.max(...xs) - Math.min(...xs) : 0);
const changed = (a: number[], b: number[]) => a.some((v, i) => Math.abs(v - b[i]) > 1);

export function landingTests() {
  test.describe('Landing: visual hook', () => {
    test('the hook is a large typographic line whose text comes from content', async ({ page }, info) => {
      const hook = siteText('home', buildOf(info))?.data.hook;
      expect(hook, 'hook in src/content/site/home.md').toBeTruthy();
      await open(page, '/');
      const h1 = page.locator('main h1').first();
      await expect(h1).toHaveAccessibleName(String(hook));
      const size = await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      const body = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
      expect(size, 'hook should be large').toBeGreaterThan(body * 2);
      expect(await h1.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^"?Literata/);
    });

    test('the hook is the first thing in main, before the intro and projects', async ({ page }) => {
      await open(page, '/');
      const firstHeading = await page.locator('main :is(h1,h2,h3)').first().evaluate((el) => el.tagName);
      expect(firstHeading).toBe('H1');
    });

    test('desktop: weight responds to the pointer', async ({ page }, info) => {
      expect(siteText('home', buildOf(info))?.data.hook, 'hook in src/content/site/home.md').toBeTruthy();
      await open(page, '/');
      await page.waitForTimeout(2500); // let the arrival sweep finish
      const before = await hookState(page);
      expect(before.length, 'hook line split into characters').toBeGreaterThan(3);
      const box = (await page.locator('main h1').first().boundingBox())!;
      await page.mouse.move(box.x + 5, box.y + box.height / 2);
      await page.mouse.move(box.x + box.width / 3, box.y + box.height / 2, { steps: 8 });
      await page.waitForTimeout(800);
      const after = await hookState(page);
      expect(spread(after.map((c) => c.weight)), 'weights should vary around the pointer').toBeGreaterThan(50);
      expect(changed(before.map((c) => c.weight), after.map((c) => c.weight))).toBe(true);
    });

    test('desktop: optical size responds to the pointer', async ({ page }, info) => {
      expect(siteText('home', buildOf(info))?.data.hook, 'hook in src/content/site/home.md').toBeTruthy();
      await open(page, '/');
      await page.waitForTimeout(2500);
      const box = (await page.locator('main h1').first().boundingBox())!;
      await page.mouse.move(box.x + box.width / 3, box.y + box.height / 2, { steps: 8 });
      await page.waitForTimeout(800);
      const after = await hookState(page);
      const opsz = after.map((c) => c.opsz);
      expect(opsz.every((v) => v !== null), 'hook characters should set an explicit "opsz" axis').toBe(true);
      expect(spread(opsz as number[]), 'optical size should vary around the pointer').toBeGreaterThan(0);
    });

    test('touch: the hook responds to scroll', async ({ browser }, info) => {
      expect(siteText('home', buildOf(info))?.data.hook, 'hook in src/content/site/home.md').toBeTruthy();
      const context = await browser.newContext({
        baseURL: info.project.use.baseURL,
        viewport: { width: 375, height: 700 },
        hasTouch: true,
        isMobile: true,
      });
      const page = await context.newPage();
      await open(page, '/');
      expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
      await page.waitForTimeout(2500);
      const before = (await hookState(page)).map((c) => c.weight);
      await page.evaluate(() => window.scrollTo(0, 120));
      await page.waitForTimeout(800);
      const after = (await hookState(page)).map((c) => c.weight);
      expect(changed(before, after), 'weights should travel with scrolling').toBe(true);
      await context.close();
    });

    test('prefers-reduced-motion: the hook sits still', async ({ browser }, info) => {
      expect(siteText('home', buildOf(info))?.data.hook, 'hook in src/content/site/home.md').toBeTruthy();
      const context = await browser.newContext({ baseURL: info.project.use.baseURL, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await open(page, '/');
      const first = await hookState(page);
      expect(first.length).toBeGreaterThan(0);
      expect(spread(first.map((c) => c.weight)), 'no character emphasised on load').toBe(0);
      const box = (await page.locator('main h1').first().boundingBox())!;
      await page.mouse.move(box.x + box.width / 3, box.y + box.height / 2, { steps: 8 });
      await page.evaluate(() => window.scrollTo(0, 120));
      await page.waitForTimeout(1000);
      const later = await hookState(page);
      expect(later).toEqual(first);
      await context.close();
    });

    test('the illustration sits behind the hook, decorative, and warms with it', async ({ page }) => {
      await open(page, '/');
      const art = page.locator('main [data-hook-art]');
      await expect(art).toHaveAttribute('aria-hidden', 'true');
      const tiles = art.locator('path');
      expect(await tiles.count(), 'tiles of the corner-grid illustration').toBeGreaterThan(10);
      const [artBox, hookBox] = [(await art.boundingBox())!, (await page.locator('main h1').first().boundingBox())!];
      const overlap =
        Math.min(artBox.x + artBox.width, hookBox.x + hookBox.width) > Math.max(artBox.x, hookBox.x) &&
        Math.min(artBox.y + artBox.height, hookBox.y + hookBox.height) > Math.max(artBox.y, hookBox.y);
      expect(overlap, 'illustration overlaps the hook').toBe(true);
      expect(Math.abs(artBox.width - artBox.height), 'illustration is square').toBeLessThan(2);
      const z = await art.evaluate((el) => Number(getComputedStyle(el).zIndex));
      expect(z, 'illustration is behind the text').toBeLessThan(0);
      const fills = () => tiles.evaluateAll((ps) => ps.map((p) => getComputedStyle(p).fill));
      await page.waitForTimeout(2500);
      const rest = await fills();
      const box = hookBox;
      await page.mouse.move(box.x + 5, box.y + box.height / 2);
      await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2, { steps: 8 });
      await page.waitForTimeout(800);
      expect(await fills(), 'tiles change colour with the hook').not.toEqual(rest);
    });

    test('prefers-reduced-motion: the illustration sits still', async ({ browser }, info) => {
      const context = await browser.newContext({ baseURL: info.project.use.baseURL, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await open(page, '/');
      const tiles = page.locator('main [data-hook-art] path');
      const fills = () => tiles.evaluateAll((ps) => ps.map((p) => getComputedStyle(p).fill));
      const first = await fills();
      expect(new Set(first).size, 'all tiles at rest').toBe(1);
      const box = (await page.locator('main h1').first().boundingBox())!;
      await page.mouse.move(box.x + box.width / 3, box.y + box.height / 2, { steps: 8 });
      await page.waitForTimeout(1000);
      expect(await fills()).toEqual(first);
      await context.close();
    });

    test('no canvas and no animation library: only a little first-party JS', async ({ page }) => {
      const scripts: { url: string; bytes: number }[] = [];
      page.on('response', async (r) => {
        if (r.request().resourceType() === 'script') scripts.push({ url: r.url(), bytes: (await r.body()).length });
      });
      await open(page, '/');
      await expect(page.locator('canvas')).toHaveCount(0);
      const origin = new URL(page.url()).origin;
      for (const s of scripts) expect(new URL(s.url).origin, s.url).toBe(origin);
      const inline = await page.evaluate(() =>
        [...document.scripts].filter((s) => !s.src).reduce((n, s) => n + s.text.length, 0),
      );
      const total = inline + scripts.reduce((n, s) => n + s.bytes, 0);
      expect(total, 'bytes of JS on the landing page (a small plain-JS hook)').toBeLessThan(10_000);
    });
  });

  test.describe('Landing: intro', () => {
    test('a short intro of two or three sentences, from content', async ({ page }, info) => {
      const body = (siteText('home', buildOf(info))?.body ?? '').replace(/[*_`#>\[\]]|\(.*?\)/g, '').trim();
      expect(body, 'intro (body of src/content/site/home.md)').not.toBe('');
      const n = sentences(body);
      expect(n, `intro has ${n} sentences`).toBeGreaterThanOrEqual(2);
      expect(n, `intro has ${n} sentences`).toBeLessThanOrEqual(3);
      await open(page, '/');
      const firstWords = body.split(/\s+/).slice(0, 6).join(' ');
      await expect(page.locator('main')).toContainText(firstWords);
    });
  });

  test.describe('Landing: latest projects', () => {
    test('shows the latest three projects with title, one-line summary, year and status', async ({ page }, info) => {
      const expected = projectsNewestFirst(buildOf(info)).slice(0, 3);
      expect(expected.length, 'published projects in src/content/projects/').toBeGreaterThan(0);
      await open(page, '/');
      const links = page.locator('main a[href^="/projects/"]:not([href="/projects/"])');
      const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      expect(hrefs).toEqual(expected.map((p) => `/projects/${p.id}/`));
      for (const p of expected) {
        const item = page.locator('main li').filter({ has: page.locator(`a[href="/projects/${p.id}/"]`) });
        await expect(item).toContainText(p.data.title);
        await expect(item).toContainText(String(p.data.year));
        // A missing fact must render as a visible TODO (SPEC.md "Content model").
        await expect(item, `${p.file}: summary`).toContainText(p.data.summary ? String(p.data.summary) : /TODO/);
        await expect(item, `${p.file}: status`).toContainText(
          p.data.status ? new RegExp(String(p.data.status), 'i') : /TODO/,
        );
      }
    });

    test('each summary is one line of text', async ({}, info) => {
      for (const p of projectsNewestFirst(buildOf(info))) {
        expect(String(p.data.summary ?? ''), p.file).not.toMatch(/\n/);
        expect(String(p.data.summary ?? '').length, `${p.file}: summary should be one line`).toBeLessThanOrEqual(140);
      }
    });
  });

  test.describe('Landing: latest posts', () => {
    test('a posts section appears only when at least one post is published', async ({ page }, info) => {
      const posts = postsNewestFirst(buildOf(info));
      await open(page, '/');
      const heading = page.getByRole('heading', { name: /latest posts/i });
      if (posts.length === 0) {
        await expect(heading).toHaveCount(0);
        await expect(page.locator('main a[href^="/posts/"]')).toHaveCount(0);
      } else {
        await expect(heading).toBeVisible();
        const hrefs = await page
          .locator('main a[href^="/posts/"]:not([href="/posts/"])')
          .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
        expect(hrefs).toEqual(posts.slice(0, hrefs.length).map((p) => `/posts/${p.id}/`));
        expect(hrefs.length).toBeGreaterThan(0);
      }
    });
  });
}
