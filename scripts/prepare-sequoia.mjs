// Copies the posts that should go to standard.site (`social: true`, not draft) into
// .publish/content, so `sequoia publish` runs on a throw-away copy (PLAN §8.3, option 1):
// Sequoia's write-back of `atUri` never touches the files editors work on.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const src = 'src/content/posts';
const dest = '.publish/content';

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

let count = 0;
for (const file of fs.readdirSync(src).filter((f) => f.endsWith('.md'))) {
  const text = fs.readFileSync(path.join(src, file), 'utf-8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const data = m ? yaml.load(m[1], { schema: yaml.CORE_SCHEMA }) : {};
  if (data.social === true && data.draft !== true) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
    count++;
  }
}
console.log(`prepare-sequoia: ${count} post(s) -> ${dest}`);
