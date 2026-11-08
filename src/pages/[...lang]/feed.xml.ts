import rss from '@astrojs/rss';
import type { APIContext, GetStaticPaths } from 'astro';
import { getPosts } from '~/lib/content';
import { getSetting } from '~/lib/content';
import { langOf, langPaths, localePath } from '~/i18n';

export const getStaticPaths = (() => langPaths()) satisfies GetStaticPaths;

/** RSS: only `social: true` posts (drafts are already excluded by getPosts). Summary + link. */
export async function GET(context: APIContext) {
  const lang = langOf(context.url.pathname);
  const site = await getSetting('site', lang);
  const posts = (await getPosts(lang)).filter((p) => p.data.social);

  return rss({
    title: site.name,
    description: site.tagline,
    site: context.site!,
    trailingSlash: false,
    customData: `<language>${lang}</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: localePath(`/posts/${post.id}`, lang),
      categories: post.data.tags,
    })),
  });
}
