import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Project = CollectionEntry<'projects'>;

const visible = ({ data }: { data: { draft: boolean } }) => import.meta.env.DEV || !data.draft;

/** Published posts, newest first. Drafts are only included in `astro dev`. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', visible);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Published projects, newest first: by year, then by optional date. */
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection('projects', visible);
  return projects.sort(
    (a, b) =>
      b.data.year - a.data.year ||
      (b.data.date?.valueOf() ?? 0) - (a.data.date?.valueOf() ?? 0),
  );
}

/** One of the site texts in src/content/site/ (`home`, `imprint`, `privacy`). */
export function getSiteText(id: 'home' | 'imprint' | 'privacy') {
  return getEntry('site', id);
}

/** Minutes to read, at 220 words per minute. */
export function readingTime(body: string | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

const long = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const short = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** "27 October 2026" */
export const formatDate = (d: Date) => long.format(d);
/** "13 Oct 2026" */
export const formatShortDate = (d: Date) => short.format(d);
