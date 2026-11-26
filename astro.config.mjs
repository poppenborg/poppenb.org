// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { externalLinksPlugin } from './src/lib/external-links.mjs';

export default defineConfig({
  site: 'https://poppenb.org',
  // The Playwright fixtures build goes to its own folder (see scripts/test-server.mjs).
  outDir: process.env.OUT_DIR ?? './dist',
  // Plain code blocks: syntax colours would add colours outside DESIGN.md.
  // External links in Markdown open in a new tab (see src/lib/external-links.mjs).
  markdown: { syntaxHighlight: false, processor: satteri({ hastPlugins: [externalLinksPlugin] }) },
});
