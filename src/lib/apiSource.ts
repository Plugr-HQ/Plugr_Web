// src/lib/apiSource.ts
// Which storage backend an API call should hit. Shared plug screens are rendered on both
// surfaces and are told which one they are via their `base` prop, so the backend follows
// from that — /demo keeps the frozen hack_ tables, /app talks to the real product tables.

export type ApiSource = 'core' | 'hack';

export function sourceFor(base?: string): ApiSource {
  return (base ?? '').startsWith('/demo') ? 'hack' : 'core';
}

/** Append the backend selector to an API path, preserving any existing query string. */
export function withSource(path: string, base?: string): string {
  return `${path}${path.includes('?') ? '&' : '?'}source=${sourceFor(base)}`;
}
