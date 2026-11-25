/**
 * SPEC.md "Posts" and its hidden rule. Shared by posts.spec.ts (real content,
 * where no post is published yet) and posts.fixtures.spec.ts (sample posts
 * added, which shows that one non-draft post makes everything appear).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { buildOf, builtHtml, builtPages, entries, open, OUT_DIR, postsNewestFirst } from './site';

const longDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function postTests() {
  test('/posts/ is always built', async ({ page }) => {
    const res = await open(page, '/posts/');
    expect(res?.status()).toBe(200);
  });

  test('hidden rule: /posts/ is linked from nav, footer and landing exactly when a post is published', async ({}, info) => {
    const build = buildOf(info);
    const published = postsNewestFirst(build).length > 0;
    const linking = builtPages(build).filter((p) => /href="\/posts\//.test(builtHtml(build, p)));
    if (!published) {
      expect(linking, 'pages linking to /posts/ while no post is published').toEqual([]);
    } else {
      for (const p of builtPages(build).filter((p) => p !== '/404.html'))
        expect(builtHtml(build, p).match(/<header[^>]*>([\s\S]*?)<\/header>/)?.[1], `${p}: Posts in the nav`).toContain('href="/posts/"');
      expect(builtHtml(build, '/'), 'landing posts section').toMatch(/Latest posts/i);
    }
  });

  test('hidden rule: the sitemap lists /posts/ exactly when a post is published', async ({ request }, info) => {
    const build = buildOf(info);
    const posts = postsNewestFirst(build);
    const index = await (await request.get('/sitemap-index.xml')).text();
    const maps = [...index.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    const urls = (await Promise.all(maps.map(async (m) => (await request.get(m)).text())))
      .flatMap((x) => [...x.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname));
    const postUrls = urls.filter((u) => u.startsWith('/posts/'));
    if (posts.length === 0) expect(postUrls).toEqual([]);
    else expect(postUrls.sort()).toEqual(['/posts/', ...posts.map((p) => `/posts/${p.id}/`)].sort());
  });

  test('RSS (/rss.xml) has an entry for every published post', async ({ request }, info) => {
    const rss = await (await request.get('/rss.xml')).text();
    for (const p of postsNewestFirst(buildOf(info))) expect(rss, p.file).toContain(`/posts/${p.id}/`);
  });

  test('drafts never appear in a production build', async ({}, info) => {
    const build = buildOf(info);
    const drafts = entries('posts', build).filter((e) => e.data.draft === true);
    const files = [...builtPages(build).map((p) => builtHtml(build, p))];
    for (const f of ['rss.xml', 'sitemap-0.xml']) {
      const path = join(OUT_DIR[build], f);
      if (existsSync(path)) files.push(readFileSync(path, 'utf8'));
    }
    for (const d of drafts) {
      expect(existsSync(join(OUT_DIR[build], 'posts', d.id)), `${d.file} was built`).toBe(false);
      for (const f of files) {
        expect(f).not.toContain(`/posts/${d.id}/`);
        expect(f).not.toContain(d.data.title);
      }
    }
  });

  test('posts index lists every published post, newest first', async ({ page }, info) => {
    const posts = postsNewestFirst(buildOf(info));
    await open(page, '/posts/');
    const hrefs = await page
      .locator('main a[href^="/posts/"]:not([href="/posts/"])')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual(posts.map((p) => `/posts/${p.id}/`));
  });

  test.describe('Post layout (DESIGN.md)', () => {
    test.beforeEach(({}, info) => {
      test.skip(postsNewestFirst(buildOf(info)).length === 0, 'no published post yet; the fixtures project covers this');
    });

    test('a "◂ Posts" back link, then the title', async ({ page }, info) => {
      for (const p of postsNewestFirst(buildOf(info))) {
        await open(page, `/posts/${p.id}/`);
        const back = page.locator('main a[href="/posts/"]').first();
        await expect(back).toHaveText(/^\s*◂\s*Posts\s*$/i);
        await expect(page.locator('main h1')).toHaveText(p.data.title);
      }
    });

    test('a tracked uppercase metadata block: Published, Reading time, Topics', async ({ page }, info) => {
      for (const p of postsNewestFirst(buildOf(info))) {
        await open(page, `/posts/${p.id}/`);
        const labels = ['Published', 'Reading time', ...((p.data.topics ?? []).length ? ['Topics'] : [])];
        for (const label of labels) {
          const el = page.locator('main header').getByText(label, { exact: true });
          await expect(el, `${p.file}: ${label}`).toBeVisible();
          const style = await el.evaluate((e) => {
            const s = getComputedStyle(e);
            return { transform: s.textTransform, tracking: parseFloat(s.letterSpacing) || 0, size: parseFloat(s.fontSize) };
          });
          expect(style.transform).toBe('uppercase');
          expect(style.tracking, 'letter-spacing').toBeGreaterThan(0);
          expect(style.size, 'small label').toBeLessThan(16);
        }
        const header = page.locator('main header').first();
        await expect(header).toContainText(longDate.format(new Date(p.data.pubDate)));
        await expect(header).toContainText(/\d+\s*min/i);
        for (const t of p.data.topics ?? []) await expect(header).toContainText(t);
      }
    });

    test('a centered "— END —" after the text', async ({ page }, info) => {
      for (const p of postsNewestFirst(buildOf(info))) {
        await open(page, `/posts/${p.id}/`);
        const end = page.locator('main').getByText(/^—\s*END\s*—$/i);
        await expect(end).toBeVisible();
        expect((await end.innerText()).trim()).toBe('— END —');
        expect(await end.evaluate((e) => getComputedStyle(e).textAlign)).toBe('center');
      }
    });

    test('then "Latest posts" with "13 Oct 2026" dates and linked titles', async ({ page }, info) => {
      const posts = postsNewestFirst(buildOf(info));
      test.skip(posts.length < 2, 'needs two published posts');
      const [newest, ...others] = posts;
      await open(page, `/posts/${newest.id}/`);
      await expect(page.getByRole('heading', { name: /latest posts/i })).toBeVisible();
      for (const o of others.slice(0, 3)) {
        const link = page.locator(`main a[href="/posts/${o.id}/"]`);
        const inItem = page.locator(`a[href="/posts/${o.id}/"]`);
        await expect(link).toHaveText(o.data.title);
        await expect(page.locator('main li').filter({ has: inItem })).toContainText(
          shortDate.format(new Date(o.data.pubDate)),
          { ignoreCase: true },
        );
      }
      // "Latest posts" comes after the END marker.
      const order = await page.evaluate(() => {
        const all = [...document.querySelectorAll('main *')];
        const end = all.findIndex((e) => /^—\s*end\s*—$/i.test(e.textContent!.trim()) && e.children.length === 0);
        const latest = all.findIndex((e) => /^h[1-6]$/i.test(e.tagName) && /latest posts/i.test(e.textContent!));
        return { end, latest };
      });
      expect(order.end).toBeGreaterThan(-1);
      expect(order.latest).toBeGreaterThan(order.end);
    });
  });
}
