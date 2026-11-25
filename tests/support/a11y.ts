/**
 * SPEC.md "Done when": WCAG AA (axe), visible focus styles.
 * Leonard asked for axe in light and dark mode. The site is dark only, so both
 * runs emulate the visitor's system setting and also assert that the page
 * stays dark when the system asks for light.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { buildOf, builtPages, hex, open, TOKENS } from './site';

export function a11yTests() {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`axe finds no WCAG 2 A/AA violations on any page (system set to ${colorScheme})`, async ({ browser }, info) => {
      const context = await browser.newContext({ baseURL: info.project.use.baseURL, colorScheme });
      const page = await context.newPage();
      const problems: string[] = [];
      for (const path of builtPages(buildOf(info))) {
        await open(page, path);
        if (path === '/') await page.waitForTimeout(2500); // let the hook's arrival sweep settle
        expect(await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches)).toBe(colorScheme === 'dark');
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        for (const v of results.violations)
          problems.push(`${path}: [${v.id}] ${v.help} (${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')})`);
      }
      await context.close();
      expect(problems).toEqual([]);
    });

    test(`the site stays dark when the system is set to ${colorScheme}`, async ({ browser }, info) => {
      const context = await browser.newContext({ baseURL: info.project.use.baseURL, colorScheme });
      const page = await context.newPage();
      for (const path of builtPages(buildOf(info))) {
        await open(page, path);
        const c = await page.evaluate(() => ({
          html: getComputedStyle(document.documentElement).backgroundColor,
          body: getComputedStyle(document.body).backgroundColor,
          text: getComputedStyle(document.body).color,
        }));
        expect(hex(c.html), `${path}: page background`).toBe(TOKENS.bg);
        expect(hex(c.body), `${path}: body background`).toBe(TOKENS.bg);
        expect(hex(c.text), `${path}: body text`).toBe(TOKENS.text);
      }
      await context.close();
    });
  }

  test('every interactive element has a visible focus style', async ({ page }, info) => {
    const problems: string[] = [];
    for (const path of builtPages(buildOf(info))) {
      await open(page, path);
      const count = await page.evaluate(
        () => document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').length,
      );
      expect(count, `${path}: focusable elements`).toBeGreaterThan(0);
      const seen = new Set<string>();
      for (let i = 0; i < count + 2; i++) {
        await page.keyboard.press('Tab');
        const f = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return {
            id: el.outerHTML.slice(0, 80),
            outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2,
            outlineColor: s.outlineColor,
            shadow: s.boxShadow !== 'none',
            visible: r.width > 0 && r.height > 0 && r.bottom > 0,
          };
        });
        if (!f) break;
        if (seen.has(f.id)) break;
        seen.add(f.id);
        if (!f.visible) problems.push(`${path}: ${f.id} is focused but not on screen`);
        if (!f.outline && !f.shadow) problems.push(`${path}: ${f.id} has no visible focus style`);
        else if (f.outline && hex(f.outlineColor) !== TOKENS.accent) problems.push(`${path}: ${f.id} focus ring is ${hex(f.outlineColor)}, not --accent`);
      }
    }
    expect(problems).toEqual([]);
  });
}
