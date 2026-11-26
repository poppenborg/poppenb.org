/**
 * SPEC.md "Links": every external link opens in a new tab with
 * rel="noopener noreferrer"; links within the site open in the same tab.
 * Checked on every built page, so links from Markdown content count too.
 */
import { expect, test } from '@playwright/test';
import { buildOf, builtPages } from './site';

const SITE_HOST = 'poppenb.org';

export function linksTests() {
  test('external links open in a new tab, internal links do not', async ({ page }, info) => {
    const problems: string[] = [];
    let external = 0;
    for (const path of builtPages(buildOf(info))) {
      await page.goto(path);
      const links = await page.locator('a[href]').evaluateAll((as) =>
        as.map((a) => ({
          href: a.getAttribute('href') ?? '',
          target: a.getAttribute('target'),
          rel: (a.getAttribute('rel') ?? '').split(/\s+/),
        })),
      );
      for (const l of links) {
        const isExternal =
          /^https?:\/\//i.test(l.href) && new URL(l.href).hostname.replace(/^www\./, '') !== SITE_HOST;
        if (isExternal) {
          external++;
          if (l.target !== '_blank') problems.push(`${path}: ${l.href} has no target="_blank"`);
          for (const r of ['noopener', 'noreferrer'])
            if (!l.rel.includes(r)) problems.push(`${path}: ${l.href} has no rel="${r}"`);
        } else if (l.target === '_blank') {
          problems.push(`${path}: ${l.href} is not external but opens a new tab`);
        }
      }
    }
    expect(problems).toEqual([]);
    expect(external, 'no external link found on any page, so the rule went unchecked').toBeGreaterThan(0);
  });
}
