import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '~/lib/content';
import { getSetting } from '~/lib/content';

/** RSS: only `social: true` posts (drafts are already excluded by getPosts). Summary + link. */
export async function GET(context: APIContext) {
  const site = await getSetting('site');
  const posts = (await getPosts()).filter((p) => p.data.social);

  return rss({
    title: site.name,
    description: site.tagline,
    site: context.site!,
    trailingSlash: false,
    customData: '<language>ja</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.id}`,
      categories: post.data.tags,
    })),
  });
}
