/** SPEC.md "Technical" requirements that live in the repo, not the page. */
import { existsSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { PRODUCTION } from './support/site';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

test('Astro 7, static output', () => {
  expect(deps.astro).toMatch(/^\^?7\./);
  const config = readFileSync('astro.config.mjs', 'utf8');
  expect(config).not.toMatch(/output:\s*['"]server['"]|adapter:/);
});

test('TypeScript strict', () => {
  const ts = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
  expect(ts.extends).toMatch(/astro\/tsconfigs\/(strict|strictest)/);
});

test('no client framework', () => {
  for (const d of Object.keys(deps))
    expect(d).not.toMatch(/^(react|react-dom|preact|vue|svelte|solid-js|lit|alpinejs|@astrojs\/(react|preact|vue|svelte|solid-js|alpinejs|lit))$/);
});

test('fonts are self-hosted via Fontsource, with no Google Fonts', () => {
  expect(deps['@fontsource-variable/literata']).toBeTruthy();
  const css = readFileSync('src/styles/global.css', 'utf8');
  expect(css).not.toMatch(/fonts\.googleapis|fonts\.gstatic/);
});

test('site URL is the production domain (sitemap, RSS and canonical links use it)', () => {
  expect(readFileSync('astro.config.mjs', 'utf8')).toContain(`site: '${PRODUCTION}'`);
});

test('GitHub Pages: a workflow builds and deploys on push to main, with poppenb.org as custom domain', () => {
  const wf = readFileSync('.github/workflows/deploy.yml', 'utf8');
  expect(wf).toMatch(/push:\s*\n\s*branches:\s*\[\s*main\s*\]/);
  expect(wf).toContain('actions/deploy-pages');
  expect(wf).toMatch(/upload-pages-artifact[\s\S]*path:\s*dist/);
  expect(readFileSync('public/CNAME', 'utf8').trim()).toBe('poppenb.org');
});

test('npm run shots exists (Playwright screenshots at 375 and 1280 px into shots/)', () => {
  expect(pkg.scripts.shots).toBeTruthy();
  const script = readFileSync('scripts/shots.mjs', 'utf8');
  expect(script).toMatch(/375/);
  expect(script).toMatch(/1280/);
  expect(readFileSync('.gitignore', 'utf8')).toMatch(/^shots\/$/m);
  expect(existsSync('scripts/shots.mjs')).toBe(true);
});

test('the live site is served over HTTPS at https://poppenb.org (run with LIVE=1)', async ({ request }) => {
  test.skip(!process.env.LIVE, 'checks the deployed site; run with LIVE=1');
  const res = await request.get(PRODUCTION + '/');
  expect(res.status()).toBe(200);
  expect(res.url()).toBe(PRODUCTION + '/');
});
