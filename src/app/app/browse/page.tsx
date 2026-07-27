// src/app/app/browse/page.tsx
// Production client flow — Browse Plugs. Fetches from the NestJS backend's GET /plugs
// instead of querying Postgres directly (that direct path lived in src/lib/repo/core.ts —
// see incident notes from 2026-07-24/25; same class of bug as dashboard/register).

import AppBrowseClient, { type HackPlug } from './AppBrowseClient';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default async function AppBrowsePage() {
  let plugs: HackPlug[] = [];
  let configError = false;
  try {
    const res = await fetch(`${API_URL}/plugs`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`backend returned ${res.status}`);
    plugs = (await res.json()) as HackPlug[];
  } catch (e) {
    console.error('browse: plug list fetch failed', e);
    configError = true;
  }
  return <AppBrowseClient plugs={plugs} configError={configError} />;
}