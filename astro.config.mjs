// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://poppenb.org',
  // The Playwright fixtures build goes to its own folder (see scripts/test-server.mjs).
  outDir: process.env.OUT_DIR ?? './dist',
  // Plain code blocks: syntax colours would add colours outside DESIGN.md.
  markdown: { syntaxHighlight: false },
});
