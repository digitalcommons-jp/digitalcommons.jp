import type { APIContext } from 'astro';
import sequoia from '../../../sequoia.json';

/** standard.site verification: the publication's AT-URI (written by `sequoia init`). */
export function GET(_context: APIContext) {
  return new Response(sequoia.publicationUri, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
