/**
 * SPEC.md: "Structure (v1)" (the page table, nav and footer) and "Language".
 */
import { expect, test } from '@playwright/test';
import { buildOf, open, postsNewestFirst, projectsNewestFirst, siteText } from './site';

export function structureTests() {

test.describe('Structure: every page in the spec table exists', () => {
  for (const path of ['/', '/projects/', '/posts/', '/imprint/', '/privacy/', '/404.html']) {
    test(`${path} is built and served`, async ({ page }) => {
      const res = await open(page, path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
    });
  }

  test('at least one project page exists (/projects/<id>/)', async ({ page }, info) => {
    const projects = projectsNewestFirst(buildOf(info));
    expect(projects.length, 'no published project in src/content/projects/').toBeGreaterThan(0);
    for (const p of projects) {
      const res = await open(page, `/projects/${p.id}/`);
      expect(res?.status(), `/projects/${p.id}/`).toBe(200);
    }
  });

  test('every published post has a page at /posts/<id>/', async ({ page }, info) => {
    for (const p of postsNewestFirst(buildOf(info))) {
      const res = await open(page, `/posts/${p.id}/`);
      expect(res?.status(), `/posts/${p.id}/`).toBe(200);
    }
  });

  test('an unknown URL gets the 404 page: short, on-voice, links home', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist/');
    expect(res?.status()).toBe(404);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('main a[href="/"]')).toBeVisible();
    const words = (await page.locator('main').innerText()).split(/\s+/).filter(Boolean).length;
    expect(words, '404 should be short').toBeLessThan(60);
  });
});

test.describe('Structure: header nav', () => {
  test('nav is the site name (links home), then Projects, plus Posts once a post is published', async ({ page }, info) => {
    await open(page, '/projects/');
    const header = page.locator('header').first();
    const links = header.locator('a');
    const home = siteText('home', buildOf(info));
    const name = links.first();
    await expect(name).toHaveAttribute('href', '/');
    // The name comes from src/content/site/home.md, else the domain from src/config.ts.
    await expect(name).toHaveText(String(home?.data.name ?? 'poppenb.org'));

    const labels = (await links.allInnerTexts()).slice(1).map((t) => t.trim().toLowerCase());
    const hasPosts = postsNewestFirst(buildOf(info)).length > 0;
    expect(labels).toEqual(hasPosts ? ['projects', 'posts'] : ['projects']);
  });
});

test.describe('Structure: footer', () => {
  test('footer repeats the nav and adds Imprint and Privacy, but no RSS link', async ({ page }, info) => {
    await open(page, '/');
    const footer = page.locator('footer').last();
    await expect(footer.locator('a[href="/projects/"]')).toBeVisible();
    await expect(footer.locator('a[href="/imprint/"]')).toBeVisible();
    await expect(footer.locator('a[href="/privacy/"]')).toBeVisible();
    // The feed stays at /rss.xml (announced in <head>), but the footer doesn't link it (Leonard, 2026-11-26).
    await expect(footer.locator('a[href="/rss.xml"]')).toHaveCount(0);
    const hasPosts = postsNewestFirst(buildOf(info)).length > 0;
    await expect(footer.locator('a[href="/posts/"]')).toHaveCount(hasPosts ? 1 : 0);
  });

  test("footer has Leonard's social and email links, taken from content", async ({ page }, info) => {
    const links: { label: string; url: string }[] = siteText('home', buildOf(info))?.data.links ?? [];
    expect(links.length, 'links in src/content/site/home.md').toBeGreaterThan(0);
    expect(
      links.some((l) => l.url.startsWith('mailto:')),
      'an email link (mailto:) in src/content/site/home.md',
    ).toBe(true);
    await open(page, '/');
    const footer = page.locator('footer').last();
    for (const l of links) await expect(footer.locator(`a[href="${l.url}"]`)).toHaveText(new RegExp(l.label, 'i'));
  });
});

test('Language: English only', async ({ page }) => {
  await open(page, '/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
}
