/**
 * Shared helpers. Tests read content files directly so they can check that
 * every fact on a page comes from content, and that nothing is invented.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { Page, TestInfo } from '@playwright/test';

export type Build = 'site' | 'fixtures';

export const OUT_DIR: Record<Build, string> = { site: 'dist', fixtures: 'dist-fixtures' };

export const TOKENS = {
  bg: '#14130f',
  surface: '#1c1a16',
  text: '#ece6d9',
  muted: '#a8a091',
  faint: '#7a7366',
  rule: '#34302a',
  accent: '#e8a25a',
} as const;

export const PRODUCTION = 'https://poppenb.org';

/** The build a test runs against, from its Playwright project. */
export const buildOf = (info: TestInfo): Build => (info.project.name === 'fixtures' ? 'fixtures' : 'site');

export interface Entry {
  id: string;
  file: string;
  data: Record<string, any>;
  body: string;
}

/** Entries of a collection, read the way src/content.config.ts reads them. */
export function entries(collection: 'projects' | 'posts' | 'site', build: Build): Entry[] {
  const dirs = [`src/content/${collection}`];
  if (build === 'fixtures') dirs.push(`src/fixtures/${collection}`);
  const out: Entry[] = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir, { recursive: true, encoding: 'utf8' })) {
      if (!/\.mdx?$/.test(f)) continue;
      const raw = readFileSync(join(dir, f), 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
      out.push({
        id: f.split('/').pop()!.replace(/\.mdx?$/, ''),
        file: join(dir, f),
        data: (m ? parse(m[1]) : {}) ?? {},
        body: m ? m[2] : raw,
      });
    }
  }
  return out;
}

/** Non-draft entries: what a production build contains. */
export const published = (collection: 'projects' | 'posts', build: Build) =>
  entries(collection, build).filter((e) => e.data.draft !== true);

/** Projects newest first: by year, then by optional date (as SPEC.md orders them). */
export function projectsNewestFirst(build: Build): Entry[] {
  const t = (e: Entry) => (e.data.date ? new Date(e.data.date).valueOf() : 0);
  return published('projects', build).sort((a, b) => b.data.year - a.data.year || t(b) - t(a));
}

export function postsNewestFirst(build: Build): Entry[] {
  return published('posts', build).sort(
    (a, b) => new Date(b.data.pubDate).valueOf() - new Date(a.data.pubDate).valueOf(),
  );
}

export function siteText(id: 'home' | 'imprint' | 'privacy', build: Build): Entry | undefined {
  return entries('site', build).find((e) => e.id === id);
}

/** Every HTML page in a build, as a URL path ("/", "/projects/", "/404.html"). */
export function builtPages(build: Build): string[] {
  const dir = OUT_DIR[build];
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.html'))
    .map((f) => '/' + f.replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '$1'))
    .sort();
}

/** The HTML of one built page. */
export function builtHtml(build: Build, path: string): string {
  const file = path.endsWith('.html') ? path : join(path, 'index.html');
  return readFileSync(join(OUT_DIR[build], file), 'utf8');
}

/** The pages SPEC.md's structure table names, for the real build. */
export function specPages(build: Build): string[] {
  const projects = projectsNewestFirst(build).map((p) => `/projects/${p.id}/`);
  const posts = postsNewestFirst(build).map((p) => `/posts/${p.id}/`);
  return ['/', '/projects/', ...projects, '/posts/', ...posts, '/imprint/', '/privacy/', '/404.html'];
}

/** Opens a page and waits for fonts, so measurements are final. */
export async function open(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return res;
}

/** Visible TODO markers on the current page. */
export async function visibleTodos(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const el = n.parentElement;
      if (!el || !/\bTODO\b/.test(n.textContent ?? '')) continue;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none')
        out.push(el.textContent!.trim());
    }
    return out;
  });
}

/** Rough sentence count of a text. */
export const sentences = (text: string) =>
  text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“‘(])/)
    .filter((s) => s.trim().length > 0).length;

/** "#rrggbb" for a computed rgb()/rgba() colour, or "transparent". */
export function hex(color: string): string {
  const m = color.match(/rgba?\(([\d.]+),?\s*([\d.]+),?\s*([\d.]+)(?:,?\s*\/?\s*([\d.]+))?/);
  if (!m) return color;
  if (m[4] !== undefined && Number(m[4]) === 0) return 'transparent';
  return '#' + [m[1], m[2], m[3]].map((v) => Math.round(Number(v)).toString(16).padStart(2, '0')).join('');
}
