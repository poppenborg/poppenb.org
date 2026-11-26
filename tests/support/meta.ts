/** SPEC.md "Technical": titles, descriptions, Open Graph, RSS, and noindex on every page. */
import { expect, test } from '@playwright/test';
import { buildOf, builtHtml, builtPages, open, postsNewestFirst, PRODUCTION, projectsNewestFirst } from './site';

export function metaTests() {
  test('every page has a title, description, canonical URL and Open Graph tags', async ({ page }, info) => {
    const problems: string[] = [];
    for (const path of builtPages(buildOf(info))) {
      await open(page, path);
      const m = await page.evaluate(() => {
        const attr = (sel: string, a = 'content') => document.querySelector(sel)?.getAttribute(a)?.trim() ?? '';
        return {
          title: document.title.trim(),
          description: attr('meta[name="description"]'),
          canonical: attr('link[rel="canonical"]', 'href'),
          ogTitle: attr('meta[property="og:title"]'),
          ogType: attr('meta[property="og:type"]'),
          ogUrl: attr('meta[property="og:url"]'),
          ogDescription: attr('meta[property="og:description"]'),
        };
      });
      for (const [k, v] of Object.entries(m)) if (!v) problems.push(`${path}: missing ${k}`);
      for (const k of ['canonical', 'ogUrl'] as const)
        if (m[k] && !m[k].startsWith(PRODUCTION + '/')) problems.push(`${path}: ${k} is ${m[k]}, not on ${PRODUCTION}`);
    }
    expect(problems).toEqual([]);
  });

  test('a project cover image is used for its social card', async ({ page }, info) => {
    for (const p of projectsNewestFirst(buildOf(info)).filter((p) => p.data.cover)) {
      await open(page, `/projects/${p.id}/`);
      await expect(page.locator('meta[property="og:image"]'), p.file).toHaveAttribute('content', new RegExp(`^${PRODUCTION}/`));
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    }
  });

  test('pages without a cover use the landing illustration as their social card', async ({ page, request }) => {
    await open(page, '/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${PRODUCTION}/og.png`);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    const res = await request.get('/og.png');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  });

  test('RSS at /rss.xml lists every published project and post', async ({ request }, info) => {
    const res = await request.get('/rss.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();
    expect(xml).toMatch(/<rss[^>]*version="2.0"/);
    expect(xml).toContain(`<link>${PRODUCTION}/</link>`);
    const build = buildOf(info);
    for (const p of projectsNewestFirst(build)) expect(xml, p.file).toContain(`${PRODUCTION}/projects/${p.id}/`);
    for (const p of postsNewestFirst(build)) expect(xml, p.file).toContain(`${PRODUCTION}/posts/${p.id}/`);
  });

  test('every page asks search engines not to index it', async ({}, info) => {
    const build = buildOf(info);
    const missing = builtPages(build).filter(
      (p) => !/<meta name="robots" content="noindex[^"]*"/.test(builtHtml(build, p)),
    );
    expect(missing, 'pages without <meta name="robots" content="noindex">').toEqual([]);
  });

  test('no sitemap is published, and crawlers may still fetch pages to see the noindex', async ({ request }) => {
    for (const path of ['/sitemap-index.xml', '/sitemap-0.xml']) expect((await request.get(path)).status(), path).toBe(404);
    // A robots.txt "Disallow" would hide the noindex tag from crawlers, so linked URLs could still be listed.
    const robots = await request.get('/robots.txt');
    if (robots.status() === 200) expect(await robots.text()).not.toMatch(/^\s*Disallow:\s*\/\s*$/im);
  });
}
