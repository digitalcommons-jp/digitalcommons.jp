// POSSE to GoToSocial: posts title + link + summary for every `social: true` post that
// has not been posted yet. Idempotent via .social-state.json (slug -> { url, postedAt }).
// Never re-posts on update.
//
//   node scripts/social-post.mjs --dry-run     # show what would be posted
//   GTS_URL=https://digitalcommons.jp GTS_TOKEN=... node scripts/social-post.mjs
//
// Token: a GoToSocial app token with the `write:statuses` scope only.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const SITE = 'https://digitalcommons.jp';
const POSTS = 'src/content/posts';
const STATE = process.env.SOCIAL_STATE ?? '.social-state.json';
const dryRun = process.argv.includes('--dry-run');

const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf-8')) : {};

const posts = fs
  .readdirSync(POSTS)
  .filter((f) => f.endsWith('.md'))
  .map((file) => {
    const text = fs.readFileSync(path.join(POSTS, file), 'utf-8');
    const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    return { slug: file.replace(/\.md$/, ''), data: m ? yaml.load(m[1], { schema: yaml.CORE_SCHEMA }) : {} };
  })
  .filter((p) => p.data.social === true && p.data.draft !== true && !state[p.slug]);

if (!posts.length) {
  console.log('social-post: nothing to post');
  process.exit(0);
}

const base = process.env.GTS_URL;
const token = process.env.GTS_TOKEN;
if (!dryRun && (!base || !token)) {
  console.error('social-post: GTS_URL and GTS_TOKEN are required (or use --dry-run)');
  process.exit(1);
}

for (const { slug, data } of posts) {
  const link = `${SITE}/posts/${slug}`;
  const status = data.socialText ?? `${data.title}\n\n${link}\n\n${data.description}`;
  if (dryRun) {
    console.log(`--- ${slug} ---\n${status}\n`);
    continue;
  }
  let res;
  try {
    res = await fetch(`${base}/api/v1/statuses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `digitalcommons-${slug}`,
      },
      body: JSON.stringify({ status, visibility: 'public', language: 'ja' }),
    });
  } catch (e) {
    console.error(`social-post: ${slug} failed: ${e.message}`);
    process.exitCode = 1;
    continue;
  }
  if (!res.ok) {
    console.error(`social-post: ${slug} failed: ${res.status} ${await res.text()}`);
    process.exitCode = 1;
    continue;
  }
  const json = await res.json();
  // Save after every post so a crash cannot cause a double post.
  state[slug] = { url: json.url, postedAt: new Date().toISOString() };
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
  console.log(`social-post: posted ${slug} -> ${json.url}`);
}
