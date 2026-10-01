// src/lib/apiSource.ts
// Which storage backend an API call should hit. There is one backend — the real product
// tables (core) — so this always resolves to 'core'. Kept as a thin indirection so the
// `?source=` contract the API routes read stays explicit.

export type ApiSource = 'core';

export function sourceFor(_base?: string): ApiSource {
  return 'core';
}

/** Append the backend selector to an API path, preserving any existing query string. */
export function withSource(path: string, _base?: string): string {
  return `${path}${path.includes('?') ? '&' : '?'}source=core`;
}
