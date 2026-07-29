// src/app/app/plugs/[plugId]/page.tsx
// Plug profile — "LinkedIn for the informal economy". Story + verification + stats + a
// shareable Digital ID (QR). "Request this Plug" goes straight to booking (or auth first).

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Star, BadgeCheck, MapPin, Clock, Briefcase, Zap, ShieldCheck, Loader2, Quote, Share2 } from 'lucide-react';
import { Shell } from '@/src/app/demo/_components/Shell';
import { Card, Divider } from '@/src/app/demo/_components/ui';
import { jsonFetch } from '@/src/app/demo/_lib/demo';
import { buildProfile } from '../../_lib/profile';
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

  const p = buildProfile(plug);
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/app/plugs/${plugId}` : '';

  return (
    <Shell back="/app/browse" mark={false} footer={<RequestPlugButton plugId={plugId} />}>
      {/* Cover + identity */}
      <div className="rounded-[24px] overflow-hidden border border-midnight/[0.06] demo-card-shadow bg-white">
        <div className="h-24 bg-gradient-to-br from-midnight to-deep-blue relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #E8A020 0, transparent 40%)' }} />
          <button onClick={() => setShowId(true)} className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-pill bg-white/15 hover:bg-white/25 backdrop-blur text-white text-[12px] font-bold px-3 py-1.5 transition-colors">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
        <div className="px-5 pb-5 -mt-10">
          <div className="relative inline-block">
            <div className="grid place-items-center h-20 w-20 rounded-3xl bg-gold text-midnight font-display text-3xl border-4 border-white">{plug.name?.[0]}</div>
            <span className="absolute -bottom-1 -right-1 grid place-items-center h-7 w-7 rounded-full bg-white"><BadgeCheck className="w-6 h-6 text-gold" /></span>
          </div>
          <h1 className="mt-3 font-display text-2xl text-midnight">{plug.name}</h1>
          <p className="text-sm text-slate">{p.headline}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate">
            <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Ikeja, Lagos</span>
            <span className="inline-flex items-center gap-1 text-midnight font-semibold"><Star className="w-3.5 h-3.5 fill-gold text-gold" /> {p.stats.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {['NIN Verified', 'BVN Verified', 'Liveness'].map((v) => (
          <div key={v} className="rounded-2xl bg-white border border-midnight/[0.06] p-3 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <span className="text-[10.5px] font-bold text-midnight leading-tight block">{v}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat icon={<Briefcase className="w-4 h-4" />} value={p.stats.jobs.toLocaleString()} label="Jobs done" />
        <Stat icon={<Clock className="w-4 h-4" />} value={`${p.stats.responseMins}m`} label="Avg response" />
        <Stat icon={<Zap className="w-4 h-4" />} value={`${p.stats.onTimePct}%`} label="On time" />
      </div>

      <Card className="mt-4 p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-2">About</p>
        <p className="text-sm text-midnight leading-relaxed">{p.story}</p>
      </Card>

      <Card className="mt-4 p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-3">Skills</p>
        <div className="flex flex-wrap gap-2">
          {p.skills.map((s) => (
            <span key={s} className="rounded-pill bg-bone border border-midnight/[0.06] px-3 py-1.5 text-[13px] font-medium text-midnight">{s}</span>
          ))}
        </div>
      </Card>

      <Card className="mt-4 p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-4">Experience</p>
        {p.history.map((h, i, a) => (
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

      <Card className="mt-4 p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-4">Reviews</p>
        <div className="space-y-4">
          {p.reviews.map((r) => (
            <div key={r.by}>
              <Quote className="w-4 h-4 text-gold/60 mb-1" />
              <p className="text-sm text-midnight leading-relaxed">{r.text}</p>
              <p className="mt-1 text-xs text-slate font-semibold">— {r.by}</p>
              {r !== p.reviews[p.reviews.length - 1] && <Divider className="mt-4" />}
            </div>
          ))}
        </div>
      </Card>

      {showId && (
        <DigitalId
          plug={{ id: plug.id, name: plug.name, trade: plug.trade, rating: Number(plug.rating) }}
          headline={p.headline}
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
