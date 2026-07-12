// src/app/demo/browse/page.tsx
// Screen 1 — Browse Plugs. Server component reads hack_plugs directly via pg (DATABASE_URL).
// Fails soft to a config notice if the DB isn't reachable, so the page still renders.

import { q } from '@/src/lib/hackDb';
import BrowseClient, { type HackPlug } from './BrowseClient';

export const dynamic = 'force-dynamic';

export default async function BrowsePage() {
  let plugs: HackPlug[] = [];
  let configError = false;

  try {
    plugs = await q<HackPlug>('select * from hack_plugs order by rating desc');
  } catch {
    configError = true;
  }

  return <BrowseClient plugs={plugs} configError={configError} />;
}
