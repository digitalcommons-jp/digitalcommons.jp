import { execFileSync } from 'node:child_process';

const REPO = 'https://github.com/digitalcommons-jp/digitalcommons.jp';

/** GitHub's edit page for a content file. Visitors without write access get a fork and a pull request from it. */
export const editUrl = (filePath: string): string => `${REPO}/edit/main/${filePath}`;

/** Date (JST, YYYY-MM-DD) of the last commit that touched the file, or undefined when git has no answer (e.g. a shallow clone). */
export function lastUpdated(filePath: string): string | undefined {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', filePath], { encoding: 'utf8' }).trim();
    if (!iso) return undefined;
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date(iso));
  } catch {
    return undefined;
  }
}
