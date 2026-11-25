/**
 * SPEC.md "Done when": Lighthouse on the landing page scores at least 95 for
 * performance and 100 for accessibility. Uses Lighthouse's default (mobile,
 * throttled) settings against the production preview.
 */
import { chromium, expect, test } from '@playwright/test';
import lighthouse from 'lighthouse';

test('Lighthouse on the landing page: performance >= 95, accessibility = 100', async ({}, info) => {
  test.setTimeout(180_000);
  const port = 9300 + info.workerIndex;
  const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] });
  try {
    const result = await lighthouse(`${info.project.use.baseURL}/`, {
      port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility'],
    });
    const { performance, accessibility } = result!.lhr.categories;
    const failed = Object.values(result!.lhr.audits)
      .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode === 'binary')
      .map((a) => a.id);
    await info.attach('lighthouse.json', { body: JSON.stringify(result!.lhr), contentType: 'application/json' });
    expect(Math.round(performance.score! * 100), `performance (failed audits: ${failed.join(', ') || 'none'})`).toBeGreaterThanOrEqual(95);
    expect(Math.round(accessibility.score! * 100), `accessibility (failed audits: ${failed.join(', ') || 'none'})`).toBe(100);
  } finally {
    await browser.close();
  }
});
