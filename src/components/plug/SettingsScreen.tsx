// src/components/plug/SettingsScreen.tsx
// Target for the Settings tab. Settings doesn't ship at launch, so this is deliberately
// just the tab's empty state — no invented settings surface.

'use client';

import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { Card } from '@/src/app/demo/_components/ui';
import { getPlugId } from '@/src/app/app/_lib/plugAuth';
import { PlugShell, EmptyState } from './PlugChrome';

export function SettingsScreen({ base }: { base: string }) {
  const [plug, setPlug] = useState<any>(null);

  useEffect(() => {
    const id = getPlugId();
    if (!id) return;
    fetch(`/api/plugs/${id}`)
      .then((r) => r.json())
      .then((d) => setPlug(d.plug))
      .catch(() => {});
  }, []);

  return (
    <PlugShell base={base} plug={plug}>
      <Card className="p-2 demo-rise">
        <EmptyState
          icon={<Settings className="w-6 h-6" />}
          title="Settings aren’t live yet"
          body="Notifications, payout preferences, and account controls land here after launch."
        />
      </Card>
    </PlugShell>
  );
}
