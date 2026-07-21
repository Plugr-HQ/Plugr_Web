// src/app/demo/browse/page.tsx
// Screen 1 — Browse Plugs. Server component reads the hack_ demo tables directly (the /demo
// surface stays on the frozen buildathon data set).
// Fails soft to a config notice if the DB isn't reachable, so the page still renders.

import { getRepo } from '@/src/lib/repo';
import BrowseClient, { type HackPlug } from './BrowseClient';

export const dynamic = 'force-dynamic';

export default async function BrowsePage() {
  let plugs: HackPlug[] = [];
  let configError = false;

  try {
    plugs = (await getRepo('hack').listPlugs()) as unknown as HackPlug[];
  } catch {
    configError = true;
  }

  return <BrowseClient plugs={plugs} configError={configError} />;
}
