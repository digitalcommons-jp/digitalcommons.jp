import config from './config.yml?raw';

/** Sveltia CMS config. It is public to whoever knows the secret CMS path; it holds no secrets. */
export function GET() {
  return new Response(config, { headers: { 'Content-Type': 'text/yaml; charset=utf-8' } });
}
