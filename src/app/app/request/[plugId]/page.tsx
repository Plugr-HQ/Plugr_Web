// src/app/app/request/[plugId]/page.tsx
// The client intake step that sits between "Request this Plug" and the WhatsApp hand-off.
//
// Reached ONLY when the client isn't known yet — RequestPlugButton sends known clients straight
// to WhatsApp without touching this route. Two callers, distinguished by ?after=:
//
//   after=whatsapp (browse/listing)  -> submit hands off to WhatsApp immediately
//   after=profile  (/p/[id] link)    -> submit returns to the Plug's public profile
//
// Someone who lands here already known (a back button, a shared URL, a second tab) is bounced to
// the right destination rather than being asked to fill the form twice.

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ClientIntakeForm, type ClientIntakeResult } from '@/src/components/client/ClientIntakeForm';
import { getClientIdentity } from '@/src/lib/clientIdentity';
import { openRequestPlugWhatsApp } from '@/src/lib/whatsappLink';

export default function ClientIntakePage() {
  const router = useRouter();
  const params = useParams<{ plugId: string }>();
  const search = useSearchParams();

  const plugId = params.plugId;
  const plugName = search.get('name');
  const plugTrade = search.get('trade');
  const after = search.get('after') === 'profile' ? 'profile' : 'whatsapp';

  // localStorage is client-only, so the known-client check necessarily runs after mount. Render
  // nothing until it's resolved, otherwise a known client sees the form flash before the bounce.
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const known = getClientIdentity();
    if (known) {
      handOff({ name: known.name });
      return;
    }
    setChecking(false);
    // handOff is stable for the life of this screen (it only reads route params).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handOff(client: { name: string }) {
    if (after === 'profile') {
      // Back to the profile they were sent. From there, "Book me on Plugr" sees a known client
      // and goes straight to WhatsApp — no second form.
      router.replace(`/p/${encodeURIComponent(plugId)}`);
      return;
    }

    openRequestPlugWhatsApp({ plugId, plugName, plugTrade }, client.name);
    // WhatsApp opens in a new tab; this one shouldn't be left sitting on a submitted form.
    router.replace(`/app/plugs/${encodeURIComponent(plugId)}`);
  }

  if (checking) return null;

  return (
    <ClientIntakeForm
      plugName={plugName}
      submitLabel={after === 'profile' ? 'Continue' : 'Continue to WhatsApp'}
      back={after === 'profile' ? `/p/${plugId}` : `/app/plugs/${plugId}`}
      onDone={(client: ClientIntakeResult) => handOff(client)}
    />
  );
}
