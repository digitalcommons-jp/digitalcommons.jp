// Unpublish from standard.site what is no longer publishable. Sequoia (0.5.x) only creates and
// updates documents; a post you delete, set to `draft: true` or `social: false` would stay on the
// PDS forever. This finds the documents recorded in .sequoia-state.json whose post is no longer in
// .publish/content (see prepare-sequoia.mjs) and deletes their `site.standard.document` records.
//
//   node scripts/sequoia-prune.mjs          # list what would be deleted (default, changes nothing)
//   node scripts/sequoia-prune.mjs --yes    # delete those records, then drop them from the state
//
// Run `pnpm prepare:sequoia` first. Credentials are the ones `sequoia auth` saved.
// Overrides (tests): SEQUOIA_STATE, SEQUOIA_CONTENT, SEQUOIA_CONFIG, SEQUOIA_CREDENTIALS.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const statePath = process.env.SEQUOIA_STATE ?? '.sequoia-state.json';
const contentDir = process.env.SEQUOIA_CONTENT ?? '.publish/content';
const configPath = process.env.SEQUOIA_CONFIG ?? 'sequoia.json';
const credentialsPath = process.env.SEQUOIA_CREDENTIALS ?? path.join(os.homedir(), '.config/sequoia/credentials.json');
const apply = process.argv.includes('--yes');

if (!fs.existsSync(statePath)) {
  console.log('sequoia-prune: no state file, nothing was published from here');
  process.exit(0);
}
if (!fs.existsSync(contentDir)) {
  console.error(
    `sequoia-prune: ${contentDir} does not exist -- run "pnpm prepare:sequoia" first (refusing: every post would look deleted)`
  );
  process.exit(1);
}

const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const current = new Set(fs.readdirSync(contentDir));
const publicationDid = config.publicationUri.replace(/^at:\/\//, '').split('/')[0];

const stale = [];
for (const [file, post] of Object.entries(state.posts ?? {})) {
  if (current.has(path.basename(file)) || !post.atUri) continue;
  const m = /^at:\/\/([^/]+)\/([^/]+)\/([^/]+)$/.exec(post.atUri);
  // Only ever delete a standard.site document in our own repo.
  if (!m || m[1] !== publicationDid || m[2] !== 'site.standard.document') {
    console.error(`sequoia-prune: skipping ${file}: ${post.atUri} is not a document in ${publicationDid}`);
    continue;
  }
  stale.push({ file, slug: post.slug, atUri: post.atUri, repo: m[1], collection: m[2], rkey: m[3] });
}

if (!stale.length) {
  console.log('sequoia-prune: nothing to unpublish');
  process.exit(0);
}
for (const s of stale) console.log(`sequoia-prune: ${apply ? 'deleting' : 'would delete'} ${s.atUri}  (${s.slug})`);
if (!apply) {
  console.log('sequoia-prune: nothing deleted. Re-run with --yes (or PRUNE=1 scripts/deploy.sh) to delete.');
  process.exit(0);
}

const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
const entry = Object.values(credentials).find((c) => c.pdsUrl === config.pdsUrl) ?? Object.values(credentials)[0];
if (!entry?.password) {
  console.error('sequoia-prune: no app-password credentials found; run "pnpm exec sequoia-cli auth"');
  process.exit(1);
}
const pds = (entry.pdsUrl ?? config.pdsUrl).replace(/\/$/, '');
const call = async (nsid, body, token) => {
  const res = await fetch(`${pds}/xrpc/${nsid}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${nsid} failed: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json().catch(() => null);
};

const session = await call('com.atproto.server.createSession', {
  identifier: entry.identifier,
  password: entry.password,
});
let failed = 0;
for (const s of stale) {
  try {
    await call(
      'com.atproto.repo.deleteRecord',
      { repo: s.repo, collection: s.collection, rkey: s.rkey },
      session.accessJwt
    );
    delete state.posts[s.file];
    // Save after each delete so a crash cannot leave state claiming a deleted record exists.
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    console.log(`sequoia-prune: deleted ${s.atUri}`);
  } catch (error) {
    failed++;
    console.error(`sequoia-prune: ${s.atUri}: ${error.message}`);
  }
}
process.exit(failed ? 1 : 0);
