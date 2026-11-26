/**
 * SPEC.md: Imprint and Privacy are legally required, linked from the footer,
 * and their wording comes from Leonard (src/content/site/), never from Claude.
 * GoatCounter must be disclosed on the privacy page.
 */
import { expect, test } from '@playwright/test';
import { open, siteText } from './support/site';

for (const id of ['imprint', 'privacy'] as const) {
  test(`/${id}/ shows Leonard's text from src/content/site/${id}.md`, async ({ page }) => {
    const entry = siteText(id, 'site');
    expect(entry?.body.trim(), `src/content/site/${id}.md`).toBeTruthy();
    await open(page, `/${id}/`);
    const firstWords = entry!.body.trim().replace(/<[^>]*>/g, ' ').replace(/[*_`#>\[\]]|\(.*?\)/g, '').split(/\s+/).slice(0, 6).join(' ');
    await expect(page.locator('main')).toContainText(firstWords);
  });

  test(`/${id}/ is linked from the footer of every page`, async ({ page }) => {
    for (const path of ['/', '/projects/', '/imprint/', '/privacy/', '/404.html']) {
      await open(page, path);
      await expect(page.locator(`footer a[href="/${id}/"]`), path).toBeVisible();
    }
  });
}

test('the privacy page discloses GoatCounter analytics', async ({ page }) => {
  await open(page, '/privacy/');
  await expect(page.locator('main')).toContainText(/GoatCounter/i);
});
