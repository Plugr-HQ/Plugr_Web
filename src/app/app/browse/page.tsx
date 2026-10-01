// src/app/app/browse/page.tsx
// Production client flow — Browse Plugs. Fetches from the NestJS backend's GET /plugs
// instead of querying Postgres directly (that direct path lived in src/lib/repo/core.ts —
// see incident notes from 2026-07-24/25; same class of bug as dashboard/register).

import AppBrowseClient, { type HackPlug } from './AppBrowseClient';

/**
 * The listing is cached for 60 seconds rather than re-fetched on every view.
 *
 * Nothing on a browse row moves faster than that. A row changes when ops approve a Plug (which
 * is what makes them ACTIVE and listed at all), when the Plug edits their profile or photo, or
 * when a job completes and the jobs-done count ticks. All are minute-scale-or-slower events, so
 * a stale window of up to a minute cannot show a client anything untrue — the worst case is a
 * newly-approved Plug appearing a minute late.
 *
 * NOTE: this is a sensible default, not a fix for slow responses. It cannot help the first
 * visitor after each window expires, and it does nothing at all when the backend is unavailable.
 */
export const revalidate = 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default async function AppBrowsePage() {
  let plugs: HackPlug[] = [];
  let configError = false;
  try {
    const res = await fetch(`${API_URL}/plugs`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`backend returned ${res.status}`);
    plugs = (await res.json()) as HackPlug[];
  } catch (e) {
    console.error('browse: plug list fetch failed', e);
    configError = true;
  }
  return <AppBrowseClient plugs={plugs} configError={configError} />;
}