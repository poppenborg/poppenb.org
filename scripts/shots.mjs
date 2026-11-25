// Builds the site, serves it, and screenshots every page at 375 px and 1280 px
// into shots/. Fails if any page scrolls sideways.
// Usage: npm run shots            (real content)
//        npm run shots:fixtures   (adds the samples in src/fixtures/)
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { chromium } from 'playwright';

const PORT = 4329;
const BASE = `http://localhost:${PORT}`;
const WIDTHS = [375, 1280];
const OUT = 'shots';

const build = spawnSync('npx', ['astro', 'build'], { stdio: 'inherit', env: process.env });
if (build.status !== 0) process.exit(build.status ?? 1);

const routes = readdirSync('dist', { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.html'))
  .map((f) => '/' + f.replace(/index\.html$/, '').replace(/\\/g, '/'))
  .sort();

// Own process group, so stopping it also stops the server npx starts.
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT), '--ignore-lock'], {
  stdio: 'ignore',
  detached: true,
});
const stop = () => {
  try {
    process.kill(-server.pid);
  } catch {}
};
process.on('exit', stop);

for (let i = 0; ; i++) {
  try {
    await fetch(BASE);
    break;
  } catch {
    if (i > 100) throw new Error('Preview server did not start');
    await new Promise((r) => setTimeout(r, 100));
  }
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const problems = [];
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  for (const route of routes) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) problems.push(`${route} at ${width}px scrolls sideways by ${overflow}px`);
    const name = (route.replace(/^\/|\/$/g, '').replace(/[/.]/g, '-') || 'home') + `-${width}.png`;
    await page.screenshot({ path: `${OUT}/${name}`, fullPage: true });
    console.log(`shot ${OUT}/${name}`);
  }
  await page.close();
}
await browser.close();
stop();

if (problems.length) {
  console.error('\nLayout problems:\n' + problems.map((p) => '  - ' + p).join('\n'));
  process.exit(1);
}
console.log(`\n${routes.length} pages x ${WIDTHS.length} widths, no sideways scroll.`);
