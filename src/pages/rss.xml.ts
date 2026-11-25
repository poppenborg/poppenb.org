import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../posts';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: 'poppenb.org',
    description: 'Writing by Leonard Poppenborg',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.id}/`,
    })),
  });
}
