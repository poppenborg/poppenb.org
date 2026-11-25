import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../config';
import { getPosts, getProjects, getSiteText } from '../lib/content';

export async function GET(context: APIContext) {
  const [posts, projects, home] = await Promise.all([getPosts(), getProjects(), getSiteText('home')]);
  const items = [
    ...posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.pubDate,
      link: `/posts/${p.id}/`,
    })),
    ...projects.map((p) => ({
      title: p.data.title,
      description: p.data.summary,
      pubDate: p.data.date ?? new Date(Date.UTC(p.data.year, 0, 1)),
      link: `/projects/${p.id}/`,
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: home?.data.name ?? SITE.domain,
    description: home?.data.description ?? `Projects and posts from ${SITE.domain}`,
    site: context.site!,
    items,
  });
}
