// src/components/plug/VerificationItemUnavailable.tsx
// The "This step isn't available yet" card for a Verification Hub item that can't be done yet.
// Shared by the [item] placeholder route and the NIN + face scan screen (which shows it to every Plug
// who isn't in the identity pilot), so an unavailable item looks the same wherever it is opened.

import { Hammer } from 'lucide-react';

export function VerificationItemUnavailable() {
  return (
    <div className="rise rise-1 mt-5 flex flex-col items-center rounded-[22px] border border-pitch-black/[0.08] bg-white px-6 py-10 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-pitch-black/[0.04] text-slate">
        <Hammer className="h-6 w-6" />
      </span>
      <p className="font-bold text-pitch-black">This step isn&rsquo;t available yet</p>
      <p className="mt-1.5 max-w-[280px] text-sm leading-relaxed text-slate">
        We&rsquo;re still building it. Your other items aren&rsquo;t affected — you can do them in any order.
      </p>
    </div>
  );
}
