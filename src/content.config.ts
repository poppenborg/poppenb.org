import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Real content lives in src/content/ and belongs to Leonard.
 * With FIXTURES=1 (used by `npm run shots:fixtures`), sample entries from
 * src/fixtures/ are added so every layout can be checked. Never deploy with it.
 */
const withFixtures = process.env.FIXTURES === '1';

function source(name: string) {
  const patterns = [`src/content/${name}/**/*.{md,mdx}`];
  if (withFixtures) patterns.push(`src/fixtures/${name}/**/*.{md,mdx}`);
  return glob({
    pattern: patterns,
    base: '.',
    // The id is the file name, so URLs don't include the folder.
    generateId: ({ entry }) => entry.split('/').pop()!.replace(/\.mdx?$/, ''),
  });
}

const posts = defineCollection({
  loader: source('posts'),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.coerce.date(),
    topics: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: source('projects'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().optional(),
      year: z.number().int(),
      /** Optional finer date, used to order projects within the same year. */
      date: z.coerce.date().optional(),
      status: z.string().optional(),
      stack: z.array(z.string()).default([]),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      links: z
        .object({ code: z.url().optional(), demo: z.url().optional() })
        .default({}),
      draft: z.boolean().default(false),
    }),
});

/**
 * Site texts: `home` (hook line, name, intro body, links), `imprint`, `privacy`.
 */
const site = defineCollection({
  loader: source('site'),
  schema: z.object({
    name: z.string().optional(),
    hook: z.string().optional(),
    description: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
  }),
});

export const collections = { posts, projects, site };
