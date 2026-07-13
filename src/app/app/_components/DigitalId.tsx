// src/app/app/_components/DigitalId.tsx
// A shareable "digital ID" for a Plug: ID number, a scannable QR that opens the profile,
// and a share button. Clients share these, creating a visibility chain for the product.

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Share2, Copy, Check, BadgeCheck, Star } from 'lucide-react';
import { PlugrWordmark } from '@/src/components/Brand';

function plugNumber(id: string) {
  const hex = id.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `PLG-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

export function DigitalId({
  plug,
  headline,
  profileUrl,
  onClose,
}: {
  plug: { id: string; name: string; trade: string; rating: number };
  headline: string;
  profileUrl: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const id = plugNumber(plug.id);

  async function share() {
    const data = { title: `${plug.name} · Plugr`, text: `${plug.name} — verified ${plug.trade} on Plugr`, url: profileUrl };
    try {
      if (navigator.share) await navigator.share(data);
      else await copyLink();
    } catch {
      /* user cancelled */
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-midnight/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[340px] rounded-[26px] overflow-hidden bg-white shadow-2xl demo-rise" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative bg-gradient-to-br from-midnight to-deep-blue px-5 pt-5 pb-8">
          <button onClick={onClose} className="absolute top-4 right-4 grid place-items-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <PlugrWordmark className="h-5 text-white" />
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Digital ID · Verified Plug</p>
        </div>

        {/* Identity */}
        <div className="px-5 -mt-5">
          <div className="flex items-end gap-3">
            <div className="relative">
              <div className="grid place-items-center h-16 w-16 rounded-2xl bg-gold text-midnight font-display text-2xl border-4 border-white">{plug.name?.[0]}</div>
              <span className="absolute -bottom-1 -right-1 grid place-items-center h-6 w-6 rounded-full bg-white"><BadgeCheck className="w-5 h-5 text-gold" /></span>
            </div>
            <div className="pb-1">
              <h3 className="font-display text-lg text-midnight leading-tight">{plug.name}</h3>
              <p className="text-xs text-slate">{headline}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate">Plug ID</p>
              <p className="font-mono text-sm font-bold text-midnight tracking-wide">{id}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-midnight"><Star className="w-4 h-4 fill-gold text-gold" /> {Number(plug.rating).toFixed(1)}</span>
          </div>
        </div>

        {/* QR */}
        <div className="mx-5 mt-4 rounded-2xl bg-bone p-4 flex items-center gap-4">
          <div className="rounded-xl bg-white p-2 shrink-0">
            <QRCodeSVG value={profileUrl} size={92} fgColor="#0F1F3D" bgColor="#FFFFFF" level="M" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-1">Scan to view</p>
            <p className="text-sm text-midnight leading-snug">Opens {plug.name.split(' ')[0]}’s verified Plugr profile.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 flex gap-2">
          <button onClick={share} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-pill bg-midnight text-white font-bold py-3 text-sm hover:bg-deep-blue transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button onClick={copyLink} className="inline-flex items-center justify-center gap-1.5 rounded-pill border border-midnight/15 text-midnight font-bold px-4 py-3 text-sm hover:border-gold hover:text-gold transition-colors">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>
    </div>
  );
}
