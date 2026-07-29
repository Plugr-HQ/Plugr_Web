// src/components/plug/NotificationsScreen.tsx
// Target for the Notifications tab in PLG-01's bottom nav. The spec lists the tab but
// doesn't specify a screen, so this is deliberately just the tab's empty state — no
// invented notification system.

'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Card } from '@/src/app/demo/_components/ui';
import { getPlugId } from '@/src/app/app/_lib/plugAuth';
import { PlugShell, EmptyState } from './PlugChrome';
import { withSource } from '@/src/lib/apiSource';
import { authHeaders } from '@/src/lib/api';

export function NotificationsScreen({ base }: { base: string }) {
  const [plug, setPlug] = useState<any>(null);

  useEffect(() => {
    const id = getPlugId();
    if (!id) return;
    fetch(withSource(`/api/plugs/${id}`, base), { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setPlug(d.plug))
      .catch(() => {});
  }, [base]);

  return (
    <PlugShell base={base} plug={plug}>
      <Card className="p-2 demo-rise">
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title="Nothing new"
          body="Job requests, payment releases, and verification updates will land here."
        />
      </Card>
    </PlugShell>
  );
}
