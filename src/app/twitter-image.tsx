// src/app/twitter-image.tsx
// The same card as opengraph-image.tsx, under Twitter/X's file convention, so twitter:image is
// written into every page's <head> too. `runtime` is declared here rather than re-exported: Next
// reads route segment config from each file statically, so it has to be a literal in this file.
export const runtime = 'edge';

export { default, size, contentType, alt } from './opengraph-image';
