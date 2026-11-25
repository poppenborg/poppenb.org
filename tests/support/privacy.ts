/** SPEC.md: no request leaves poppenb.org except analytics; no cookies or embeds. */
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { buildOf, builtPages } from './site';

/** The GoatCounter code from src/config.ts ('' while analytics are off). */
export const goatcounter = () => readFileSync('src/config.ts', 'utf8').match(/goatcounter:\s*'([^']*)'/)?.[1] ?? '';

export function privacyTests() {
  test('no request leaves the site except the analytics script; fonts are self-hosted', async ({ page }, info) => {
    const code = goatcounter();
    const allowedHosts = code ? ['gc.zgo.at', `${code}.goatcounter.com`] : [];
    const outside: string[] = [];
    const fonts: string[] = [];
    let origin = '';
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (r.resourceType() === 'font') fonts.push(r.url());
      if (u.protocol === 'data:' || u.origin === origin) return;
      if (!allowedHosts.includes(u.hostname)) outside.push(`${r.resourceType()} ${r.url()}`);
    });
    origin = new URL(info.project.use.baseURL!).origin;
    for (const path of builtPages(buildOf(info))) await page.goto(path, { waitUntil: 'networkidle' });
    expect(outside).toEqual([]);
    expect(fonts.length, 'Literata should load from the site itself').toBeGreaterThan(0);
    for (const f of fonts) expect(new URL(f).origin).toBe(origin);
  });

  test('analytics load only when a GoatCounter code is set, and then on every page', async ({ page }, info) => {
    const code = goatcounter();
    for (const path of builtPages(buildOf(info))) {
      await page.goto(path);
      await expect(page.locator('script[src*="goatcounter"], script[src*="gc.zgo.at"]'), path).toHaveCount(code ? 1 : 0);
    }
  });

  test('no cookies, no third-party embeds', async ({ page, context }, info) => {
    for (const path of builtPages(buildOf(info))) {
      await page.goto(path, { waitUntil: 'networkidle' });
      await expect(page.locator('iframe, embed, object'), path).toHaveCount(0);
    }
    expect(await context.cookies()).toEqual([]);
  });
}
