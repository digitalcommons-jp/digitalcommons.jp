/**
 * Page bodies written with directives (remark-directive), e.g. the about page:
 *
 *   :::hero{art="about"}      a container: Markdown inside, a name, attributes
 *   # Title
 *   Lead text…
 *   :::
 *
 *   ::member[Name]{email="…"} a leaf (one line, no body): a label and attributes
 *
 * `parseBlocks` splits a body into its top-level containers. The page then hands each block to the component it is
 * for, so the Markdown stays plain and GitHub-readable while the layout stays in Astro components.
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { toString } from 'mdast-util-to-string';
import type { Heading, Root, RootContent, Table } from 'mdast';
import { responsiveTablesRehypePlugin } from './markdown';

export type Node = RootContent;

export interface Block {
  name: string;
  attrs: Record<string, string>;
  nodes: Node[];
}

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkDirective);
const renderer = unified()
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(responsiveTablesRehypePlugin)
  .use(rehypeStringify, { allowDangerousHtml: true });

const attrsOf = (attributes: Record<string, string | null | undefined> | null | undefined) =>
  Object.fromEntries(Object.entries(attributes ?? {}).map(([k, v]) => [k, v ?? '']));

/** The top-level `:::name` containers of a body, in order. Anything outside a container is ignored. */
export function parseBlocks(body: string): Block[] {
  const tree = parser.parse(body) as Root;
  const blocks: Block[] = [];
  for (const node of tree.children) {
    if (node.type === 'containerDirective') {
      blocks.push({ name: node.name, attrs: attrsOf(node.attributes), nodes: node.children });
    } else if (node.type !== 'html') {
      console.warn(`[blocks] ignored a ${node.type} outside any :::block`);
    }
  }
  return blocks;
}

export const findBlock = (blocks: Block[], name: string) => blocks.find((b) => b.name === name);

/** Markdown nodes → HTML. */
export function toHtml(nodes: Node[]): string {
  const root: Root = { type: 'root', children: nodes };
  return String(renderer.stringify(renderer.runSync(root) as never));
}

export const textOf = (nodes: Node[]) => nodes.map((n) => toString(n)).join('');

/** The first heading of `depth` and the nodes after it: `# Title` + body → { title, rest }. */
export function takeHeading(nodes: Node[], depth: number): { title?: string; rest: Node[] } {
  const i = nodes.findIndex((n) => n.type === 'heading' && (n as Heading).depth === depth);
  if (i < 0) return { rest: nodes };
  return { title: toString(nodes[i]), rest: [...nodes.slice(0, i), ...nodes.slice(i + 1)] };
}

/** Splits at headings of `depth`: the nodes before the first one, and one section (title + nodes) per heading. */
export function splitByHeading(nodes: Node[], depth: number) {
  const intro: Node[] = [];
  const sections: { title: string; nodes: Node[] }[] = [];
  for (const n of nodes) {
    if (n.type === 'heading' && (n as Heading).depth === depth) sections.push({ title: toString(n), nodes: [] });
    else (sections.at(-1)?.nodes ?? intro).push(n);
  }
  return { intro, sections };
}

/** Leaf directives of a name, e.g. every `::member[Name]{…}`: label + attributes. */
export function leaves(nodes: Node[], name: string) {
  return nodes.flatMap((n) =>
    n.type === 'leafDirective' && n.name === name
      ? [{ label: toString(n), attrs: attrsOf(n.attributes) }]
      : [],
  );
}

/** The body rows of the first table (the header row is skipped): `| label | value |` → [[label, value]]. */
export function tableRows(nodes: Node[]): string[][] {
  const table = nodes.find((n): n is Table => n.type === 'table');
  return (table?.children ?? []).slice(1).map((row) => row.children.map((cell) => toString(cell)));
}
