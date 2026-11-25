/** SPEC.md "Done when": every page at 375 px and 1280 px, no sideways scroll, nothing clipped. */
import { expect, test } from '@playwright/test';
import { buildOf, builtPages, open } from './site';

export function layoutTests() {
  for (const width of [375, 1280]) {
    test(`every page at ${width} px: no horizontal scroll and nothing clipped`, async ({ browser }, info) => {
      const page = await browser.newPage({
        baseURL: info.project.use.baseURL,
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
      });
      const problems: string[] = [];
      for (const path of builtPages(buildOf(info))) {
        await open(page, path);
        const found = await page.evaluate(() => {
          const out: string[] = [];
          const doc = document.documentElement;
          if (doc.scrollWidth > doc.clientWidth) out.push(`scrolls sideways by ${doc.scrollWidth - doc.clientWidth}px`);
          const vw = doc.clientWidth;
          const inScroller = (el: Element) => {
            for (let p = el.parentElement; p; p = p.parentElement) {
              const o = getComputedStyle(p).overflowX;
              if (o === 'auto' || o === 'scroll') return true;
            }
            return false;
          };
          for (const el of document.querySelectorAll<HTMLElement>('body *')) {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            if (s.display === 'none' || r.width <= 1 || r.height <= 1) continue;
            if (r.top + window.scrollY < 0) continue; // off-screen on purpose (skip link)
            if (inScroller(el)) continue;
            const name = el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '');
            if (r.right > vw + 0.5 || r.left < -0.5) out.push(`${name} sticks out (${Math.round(r.left)}..${Math.round(r.right)} of ${vw})`);
            if (s.display !== 'inline' && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && s.overflowX !== 'visible' && s.overflowX !== 'auto' && s.overflowX !== 'scroll')
              out.push(`${name} clips its content (${el.scrollWidth} > ${el.clientWidth})`);
          }
          return out;
        });
        problems.push(...found.map((f) => `${path}: ${f}`));
      }
      await page.close();
      expect(problems).toEqual([]);
    });
  }
}
