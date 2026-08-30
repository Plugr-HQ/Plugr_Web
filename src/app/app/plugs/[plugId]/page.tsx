// src/app/app/plugs/[plugId]/page.tsx
// Plug profile — "LinkedIn for the informal economy". Story + verification + stats + a
// shareable Digital ID (QR). "Request this Plug" goes straight to booking (or auth first).

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Star, BadgeCheck, MapPin, Briefcase, ShieldCheck, Loader2, Share2 } from 'lucide-react';
import { Shell } from '@/src/components/Shell';
import { Card } from '@/src/components/ui';
import { jsonFetch } from '@/src/lib/net';
import { tradeLabel, verificationLabel, ratingDisplay } from '../../_lib/plugDisplay';
import { RequestPlugButton } from '../../_components/RequestPlugButton';
import { DigitalId } from '../../_components/DigitalId';

export default function PlugProfilePage() {
  const { plugId } = useParams<{ plugId: string }>();
  const [plug, setPlug] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showId, setShowId] = useState(false);

  useEffect(() => {
    // Public profile read (client viewing a plug) — the unauthenticated /profile route.
    jsonFetch(`/api/plugs/${plugId}/profile`).then((d) => setPlug(d.plug)).catch((e) => setError(e.message));
  }, [plugId]);

  if (error) return <Shell title="Profile" back="/app/browse"><Card className="p-4 border-red-200"><p className="text-sm text-red-600">{error}</p></Card></Shell>;
  if (!plug) return <Shell title="Profile" back="/app/browse"><div className="flex items-center gap-2 text-slate text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div></Shell>;

  const trade = tradeLabel(plug);
  const verifiedLabel = verificationLabel(plug);
  const rating = ratingDisplay(plug);
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${plugId}` : '';

  return (
    <Shell back="/app/browse" mark={false} footer={<RequestPlugButton plugId={plugId} plugName={plug?.name} plugTrade={plug?.trade} />}>
      {/* Cover + identity */}
      <div className="rounded-[24px] overflow-hidden border border-midnight/[0.06] card-shadow bg-white">
        <div className="h-24 bg-gradient-to-br from-midnight to-deep-blue relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #E8A020 0, transparent 40%)' }} />
          <button onClick={() => setShowId(true)} className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-pill bg-white/15 hover:bg-white/25 backdrop-blur text-white text-[12px] font-bold px-3 py-1.5 transition-colors">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
        <div className="px-5 pb-5 -mt-10">
          <div className="relative inline-block">
            {plug.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={plug.photo_url} alt={plug.name} className="h-20 w-20 rounded-3xl object-cover border-4 border-white" />
            ) : (
              <div className="grid place-items-center h-20 w-20 rounded-3xl bg-gold text-midnight font-display text-3xl border-4 border-white">{plug.name?.[0]}</div>
            )}
            {/* The seal was previously unconditional, so every Plug wore a verification tick
                whether or not anything had been verified. It follows the real flag now. */}
            {plug.verified && (
              <span className="absolute -bottom-1 -right-1 grid place-items-center h-7 w-7 rounded-full bg-white"><BadgeCheck className="w-6 h-6 text-gold" /></span>
            )}
          </div>
          <h1 className="mt-3 font-display text-2xl text-midnight">{plug.name}</h1>
          {/* Plain trade, not "Licensed <trade>" — no licence is checked anywhere in this product. */}
          <p className="text-sm text-slate">{trade}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate">
            {/* Service area comes from the Plug's own record. It used to be the literal string
                "Yaba, Lagos" for everyone, which is a claim about where THIS person works. */}
            {plug.service_area && (
              <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {plug.service_area}</span>
            )}
            {rating.kind === 'rating' ? (
              <span className="inline-flex items-center gap-1 text-midnight font-semibold"><Star className="w-3.5 h-3.5 fill-gold text-gold" /> {rating.value}</span>
            ) : (
              <span className="text-slate">{rating.value}</span>
            )}
          </div>
        </div>
      </div>

      {/* Renders ONLY for a Plug who is actually verified. It used to render for everyone: BVN
          and liveness (neither of which exists at launch) and then NIN, unconditionally — so an
          unverified stranger's profile told the client all three checks had passed. */}
      {verifiedLabel && (
        <div className="mt-4">
          <div className="inline-flex items-center gap-2 rounded-pill bg-[#E2F5EC] px-4 py-2 text-[13px] font-bold text-[#0D7A4A]">
            <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />
            {verifiedLabel}
          </div>
        </div>
      )}

      {/* "Avg response 12m" and "98% on time" were hardcoded constants — identical for every
          Plug, computed from nothing. There is no response-time or punctuality data in this
          product, so they are gone rather than zeroed. Jobs done is real and stays. */}
      <div className="mt-3 grid grid-cols-1 gap-2">
        <Stat icon={<Briefcase className="w-4 h-4" />} value={Number(plug.jobs_completed ?? 0).toLocaleString()} label="Jobs done" />
      </div>

      <Card className="mt-4 p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-2">About</p>
        <p className={plug.bio ? 'text-sm text-midnight leading-relaxed' : 'text-sm text-slate leading-relaxed'}>
          {plug.bio || 'This Plug hasn’t written an intro yet.'}
        </p>
      </Card>

      <Card className="mt-4 p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-3">Skills</p>
        <div className="flex flex-wrap gap-2">
          {(plug.skills ?? []).map((s: string) => (
            <span key={s} className="rounded-pill bg-bone border border-midnight/[0.06] px-3 py-1.5 text-[13px] font-medium text-midnight">{s}</span>
          ))}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-4">Experience</p>
        {(plug.experience ?? []).map((h: any, i: number, a: any[]) => (
          <div key={h.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="grid place-items-center h-9 w-9 rounded-xl bg-midnight/[0.06] text-gold shrink-0"><Briefcase className="w-4 h-4" /></span>
              {i < a.length - 1 && <span className="w-0.5 flex-1 bg-midnight/10 my-1" />}
            </div>
            <div className="pb-5">
              <p className="font-bold text-sm text-midnight">{h.title}</p>
              <p className="text-xs text-slate">{h.org} · {h.period}</p>
              <p className="text-xs text-slate mt-1">{h.note}</p>
            </div>
          </div>
        ))}
      </Card>



      {showId && (
        <DigitalId
          plug={{ id: plug.id, name: plug.name, trade: plug.trade, rating: Number(plug.rating) }}
          headline={trade}
          profileUrl={profileUrl}
          onClose={() => setShowId(false)}
        />
      )}
    </Shell>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white border border-midnight/[0.06] p-3 text-center">
      <span className="text-gold flex justify-center mb-1">{icon}</span>
      <div className="font-display text-lg text-midnight tnum leading-none">{value}</div>
      <div className="text-[10.5px] text-slate mt-1">{label}</div>
    </div>
  );
}
