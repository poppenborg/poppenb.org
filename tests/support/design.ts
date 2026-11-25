/** SPEC.md "Design" and the DESIGN.md tokens. */
import { readFileSync, readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { buildOf, builtPages, open, OUT_DIR } from './site';

/** The token table in .claude/DESIGN.md is the source of truth. */
function designTokens(): Record<string, string> {
  const md = readFileSync('.claude/DESIGN.md', 'utf8');
  return Object.fromEntries(
    [...md.matchAll(/^\|\s*`(--[\w-]+)`\s*\|\s*`(#[0-9a-fA-F]{6})`/gm)].map((m) => [m[1], m[2].toLowerCase()]),
  );
}

export function designTests() {
  const tokens = designTokens();

  test('DESIGN.md defines the seven colour tokens', () => {
    expect(Object.keys(tokens).sort()).toEqual(['--accent', '--bg', '--faint', '--muted', '--rule', '--surface', '--text']);
  });

  test('the CSS tokens match DESIGN.md', async ({ page }) => {
    await open(page, '/');
    const values = await page.evaluate(
      (names) => names.map((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim().toLowerCase()),
      Object.keys(tokens),
    );
    expect(Object.fromEntries(Object.keys(tokens).map((k, i) => [k, values[i]]))).toEqual(tokens);
  });

  test('dark only: color-scheme is dark and there is no light mode or theme toggle', async ({ page }, info) => {
    await open(page, '/');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
    await expect(page.getByRole('button', { name: /theme|dark|light|mode/i })).toHaveCount(0);
    const dir = `${OUT_DIR[buildOf(info)]}/_astro`;
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.css')))
      expect(readFileSync(`${dir}/${f}`, 'utf8'), f).not.toMatch(/prefers-color-scheme\s*:\s*light/);
  });

  test('VT323 for headings and navigation, Literata for everything else (code may use system monospace)', async ({ browser }, info) => {
    const page = await browser.newPage({ baseURL: info.project.use.baseURL, reducedMotion: 'reduce' });
    const problems: string[] = [];
    for (const path of builtPages(buildOf(info))) {
      await open(page, path);
      const found = await page.evaluate(() => {
        const out = new Set<string>();
        for (const el of document.querySelectorAll<HTMLElement>('body, body *')) {
          const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
          if (!hasText) continue;
          const first = getComputedStyle(el).fontFamily.split(',')[0].trim().replace(/["']/g, '');
          // Code uses the system monospace stack (approved by Leonard, 2026-11-25).
          if (el.closest('code, pre, kbd, samp') && /monospace$/.test(getComputedStyle(el).fontFamily)) continue;
          // VT323 for headings (except the landing hook) and navigation (approved by Leonard, 2026-11-25).
          const display = !!el.closest('h1:not(.hook), h2, h3, header nav, footer nav, header > a[href="/"]') && !el.closest('.todo');
          const want = display ? 'VT323' : 'Literata Variable';
          if (first !== want) out.add(`${el.tagName.toLowerCase()}${el.className ? '.' + el.className : ''}: ${first} (expected ${want})`);
        }
        const faces = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, ''));
        for (const f of new Set(faces)) if (f !== 'Literata Variable' && f !== 'VT323') out.add(`loaded font face: ${f}`);
        return [...out];
      });
      problems.push(...found.map((f) => `${path}: ${f}`));
    }
    expect(problems).toEqual([]);
  });

  test('only DESIGN.md colours are used, and --faint is never used for text', async ({ browser }, info) => {
    const page = await browser.newPage({ baseURL: info.project.use.baseURL, reducedMotion: 'reduce' });
    const allowed = new Set([...Object.values(tokens), 'transparent']);
    const problems = new Set<string>();
    for (const path of builtPages(buildOf(info))) {
      await open(page, path);
      const used = await page.evaluate(() => {
        // Normalise any CSS colour (rgb, oklab, color-mix results) to #rrggbb.
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
        const norm = (v: string) => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = '#000';
          ctx.fillStyle = v;
          ctx.fillRect(0, 0, 1, 1);
          const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
          if (a === 0) return 'transparent';
          const hx = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
          return a < 255 ? `${hx} at ${Math.round((a / 255) * 100)}% opacity` : hx;
        };
        const out: { el: string; prop: string; value: string; text: boolean }[] = [];
        for (const el of document.querySelectorAll<HTMLElement>('html, body, body *')) {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          if (s.display === 'none' || (r.width === 0 && r.height === 0)) continue;
          const name = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '');
          const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
          if (hasText) out.push({ el: name, prop: 'color', value: norm(s.color), text: true });
          out.push({ el: name, prop: 'background-color', value: norm(s.backgroundColor), text: false });
          for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const)
            if (parseFloat(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== 'none')
              out.push({ el: name, prop: `border-${side.toLowerCase()}-color`, value: norm(s[`border${side}Color`]), text: false });
          if (s.textDecorationLine !== 'none')
            out.push({ el: name, prop: 'text-decoration-color', value: norm(s.textDecorationColor), text: false });
        }
        return out;
      });
      for (const u of used) {
        const h = u.value;
        if (!allowed.has(h)) problems.add(`${path} ${u.el} ${u.prop}: ${h}`);
        if (u.text && h === tokens['--faint']) problems.add(`${path} ${u.el}: text in --faint`);
      }
    }
    expect([...problems]).toEqual([]);
  });

  test('one reading column of about 66 characters, with generous line height', async ({ page }, info) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    // The reading layout: project stories, posts, imprint and privacy.
    const pages = builtPages(buildOf(info)).filter((p) => /^\/(projects|posts)\/[^/]+\/$|^\/(imprint|privacy)\/$/.test(p));
    let measured = 0;
    for (const path of pages) {
      await open(page, path);
      const m = await page.evaluate(() => {
        const p = [...document.querySelectorAll<HTMLElement>('main p')].sort(
          (a, b) => b.textContent!.length - a.textContent!.length,
        )[0];
        if (!p || p.textContent!.length < 120) return null;
        const probe = document.createElement('span');
        probe.style.whiteSpace = 'nowrap';
        probe.textContent = p.textContent;
        p.append(probe);
        const perChar = probe.getBoundingClientRect().width / probe.textContent!.length;
        probe.remove();
        const s = getComputedStyle(p);
        return { chars: p.clientWidth / perChar, lineHeight: parseFloat(s.lineHeight) / parseFloat(s.fontSize) };
      });
      if (!m) continue;
      measured++;
      expect(m.chars, `${path}: characters per line`).toBeGreaterThanOrEqual(58);
      expect(m.chars, `${path}: characters per line`).toBeLessThanOrEqual(75);
      expect(m.lineHeight, `${path}: line height`).toBeGreaterThanOrEqual(1.5);
    }
    expect(measured, 'reading pages (project, post, imprint, privacy) with a paragraph long enough to measure').toBeGreaterThan(0);
  });

  test('labels are small, tracked, uppercase Literata', async ({ page }, info) => {
    for (const path of builtPages(buildOf(info))) {
      await open(page, path);
      const labels = await page.evaluate(() => {
        const body = parseFloat(getComputedStyle(document.body).fontSize);
        return [...document.querySelectorAll<HTMLElement>('body *')]
          .filter((el) => getComputedStyle(el).textTransform === 'uppercase' && el.textContent!.trim())
          .map((el) => {
            const s = getComputedStyle(el);
            return { text: el.textContent!.trim().slice(0, 30), small: parseFloat(s.fontSize) < body, tracked: parseFloat(s.letterSpacing) > 0 };
          });
      });
      expect(labels.length, `${path}: labels`).toBeGreaterThan(0);
      for (const l of labels) expect(l, `${path}: "${l.text}"`).toMatchObject({ small: true, tracked: true });
    }
  });
}

