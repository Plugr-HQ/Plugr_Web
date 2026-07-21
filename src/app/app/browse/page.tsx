// src/app/app/browse/page.tsx
// Production client flow — Browse Plugs. Reads the core product tables ("PlugProfile" joined
// to "User" and "Category"). Cards open the profile.

import { getRepo } from '@/src/lib/repo';
import AppBrowseClient, { type HackPlug } from './AppBrowseClient';

export const dynamic = 'force-dynamic';

export default async function AppBrowsePage() {
  let plugs: HackPlug[] = [];
  let configError = false;
  try {
    plugs = (await getRepo('core').listPlugs()) as unknown as HackPlug[];
  } catch (e) {
    console.error('browse: core plug list failed', e);
    configError = true;
  }
  return <AppBrowseClient plugs={plugs} configError={configError} />;
}
