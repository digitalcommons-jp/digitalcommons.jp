import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import ExampleBlock from './ExampleBlock.astro';

/** Components selectable from home.yml (`type: custom`, `component: <name>`). Add new ones here. */
export const customComponents: Record<string, AstroComponentFactory> = { ExampleBlock };
