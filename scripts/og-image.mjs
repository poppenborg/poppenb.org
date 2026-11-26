// Renders the default social card (public/og.png, 1200x630) from the
// landing illustration in src/assets/hook-grid.svg, in the site's palette.
// Re-run after changing the illustration: node scripts/og-image.mjs
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const svg = readFileSync('src/assets/hook-grid.svg', 'utf8');
const html = `<!doctype html><html><body style="margin:0;background:#14130f">
<style>
  .card { width: 1200px; height: 630px; display: grid; place-items: center; }
  svg { width: 560px; height: 560px; }
  path { fill: color-mix(in oklab, #e8a25a calc(var(--p) * 25%), #34302a); }
</style>
<div class="card">${svg}</div>
<script>
  // A frozen moment of the hook's glow: tiles warm towards the upper left.
  for (const p of document.querySelectorAll('path')) {
    const r = p.getBoundingClientRect();
    const d = Math.hypot(r.left + r.width / 2 - 420, r.top + r.height / 2 - 180);
    p.style.setProperty('--p', Math.exp(-(d * d) / (2 * 220 * 220)).toFixed(3));
  }
</script></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('wrote public/og.png');
