// src/app/app/browse/page.tsx
// Production client flow — Browse Plugs. Reads hack_plugs via pg. Cards open the profile.

import { q } from '@/src/lib/hackDb';
import AppBrowseClient, { type HackPlug } from './AppBrowseClient';

export const dynamic = 'force-dynamic';

export default async function AppBrowsePage() {
  let plugs: HackPlug[] = [];
  let configError = false;
  try {
    plugs = await q<HackPlug>('select * from hack_plugs order by rating desc');
  } catch {
    configError = true;
  }
  return <AppBrowseClient plugs={plugs} configError={configError} />;
}
