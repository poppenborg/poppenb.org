// @ts-check
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** True when at least one non-draft post exists, so /posts/ may be listed. */
function hasPublishedPosts() {
  const dirs = ['src/content/posts'];
  if (process.env.FIXTURES === '1') dirs.push('src/fixtures/posts');
  return dirs.some(
    (dir) =>
      existsSync(dir) &&
      readdirSync(dir, { recursive: true, encoding: 'utf8' })
        .filter((f) => /\.mdx?$/.test(f))
        .some((f) => !/^draft:\s*true\s*$/m.test(readFileSync(`${dir}/${f}`, 'utf8').split(/^---$/m)[1] ?? '')),
  );
}

const postsVisible = hasPublishedPosts();

export default defineConfig({
  site: 'https://poppenb.org',
  // Plain code blocks: syntax colours would add colours outside DESIGN.md.
  markdown: { syntaxHighlight: false },
  integrations: [
    sitemap({
      filter: (page) => postsVisible || !new URL(page).pathname.startsWith('/posts/'),
    }),
  ],
});
