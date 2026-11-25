/** SPEC.md "Out of scope for v1": none of these may exist. */
import { expect, test } from '@playwright/test';
import { builtPages, open } from './support/site';

test('no About, Work, CV, topic, tag or search pages', () => {
  const pages = builtPages('site');
  for (const p of pages) expect(p, 'out-of-scope page').not.toMatch(/^\/(about|work|cv|topics?|tags?|search)(\/|$)/);
});

test('no pagination', () => {
  for (const p of builtPages('site')) expect(p).not.toMatch(/\/\d+\/$|\/page\//);
});

test('no comments, newsletter or signup forms, and no theme toggle', async ({ page }) => {
  for (const path of builtPages('site')) {
    await open(page, path);
    await expect(page.locator('form, input, textarea'), `${path}: forms`).toHaveCount(0);
    await expect(page.locator('main').getByText(/subscribe|newsletter|reply card|no stamp needed/i), path).toHaveCount(0);
    await expect(page.locator('[class*="giscus"], [class*="comment"], #comments'), path).toHaveCount(0);
    await expect(page.getByRole('button'), `${path}: buttons (theme toggle)`).toHaveCount(0);
  }
});
