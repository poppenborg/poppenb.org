/** SPEC.md "Projects". Shared by projects.spec.ts and projects.fixtures.spec.ts. */
import { expect, test } from '@playwright/test';
import { buildOf, open, projectsNewestFirst } from './site';

export function projectTests() {
  test('projects index lists all projects, newest first (by year, then by date)', async ({ page }, info) => {
    const expected = projectsNewestFirst(buildOf(info));
    expect(expected.length, 'published projects in src/content/projects/').toBeGreaterThan(0);
    await open(page, '/projects/');
    const hrefs = await page
      .locator('main a[href^="/projects/"]:not([href="/projects/"])')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual(expected.map((p) => `/projects/${p.id}/`));
  });

  test('each project page has the header facts: title, year, status, and stack when given', async ({ page }, info) => {
    const projects = projectsNewestFirst(buildOf(info));
    expect(projects.length, 'published projects in src/content/projects/').toBeGreaterThan(0);
    for (const p of projects) {
      await open(page, `/projects/${p.id}/`);
      await expect(page.locator('main h1'), p.file).toHaveText(p.data.title);
      const header = page.locator('main article header, main header').first();
      await expect(header, `${p.file}: year`).toContainText(String(p.data.year));
      // A missing fact must render as a visible TODO (SPEC.md "Content model").
      await expect(header, `${p.file}: status`).toContainText(
        p.data.status ? new RegExp(String(p.data.status), 'i') : /TODO/,
      );
      for (const s of p.data.stack ?? []) await expect(header, `${p.file}: stack`).toContainText(s);
    }
  });

  test('each project page tells its story as an essay, from the Markdown body', async ({ page }, info) => {
    const projects = projectsNewestFirst(buildOf(info));
    expect(projects.length).toBeGreaterThan(0);
    for (const p of projects) {
      await open(page, `/projects/${p.id}/`);
      if (!p.body.trim()) {
        await expect(page.locator('main'), `${p.file} has no story, so a TODO should show`).toContainText('TODO');
        continue;
      }
      const firstLine = p.body.trim().split('\n')[0].replace(/[*_`#>\[\]]|\(.*?\)/g, '').split(/\s+/).slice(0, 6).join(' ');
      await expect(page.locator('main'), p.file).toContainText(firstLine);
    }
  });

  test('code and demo links appear when given', async ({ page }, info) => {
    for (const p of projectsNewestFirst(buildOf(info))) {
      await open(page, `/projects/${p.id}/`);
      for (const kind of ['code', 'demo'] as const) {
        const url = p.data.links?.[kind];
        if (url) await expect(page.locator(`main header a[href="${url}"]`), `${p.file}: ${kind} link in the header`).toBeVisible();
      }
    }
  });

  test('a cover image shows when given, with alt text', async ({ page }, info) => {
    for (const p of projectsNewestFirst(buildOf(info)).filter((p) => p.data.cover)) {
      await open(page, `/projects/${p.id}/`);
      const img = page.locator('main img').first();
      await expect(img, `${p.file}: cover`).toBeVisible();
      await expect(img, `${p.file}: coverAlt`).toHaveAttribute('alt', /\S/);
    }
  });

  test('each project page links back to the projects index', async ({ page }, info) => {
    for (const p of projectsNewestFirst(buildOf(info))) {
      await open(page, `/projects/${p.id}/`);
      await expect(page.locator('main a[href="/projects/"]').first()).toBeVisible();
    }
  });
}
