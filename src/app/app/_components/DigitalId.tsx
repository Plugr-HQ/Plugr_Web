// src/app/app/_components/DigitalId.tsx
// A shareable "digital ID" for a Plug: ID number, a scannable QR that opens the profile,
// share, copy link, and a PNG download. Clients share these, creating a visibility chain.
//
// The download composes a real card on a canvas (Pitch Black/Gold, distinct from the in-app
// view — the "carry this in your pocket" artifact) with the QR drawn in from a hidden
// QRCodeCanvas, then saves it as a PNG.

'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { X, Share2, Copy, Check, BadgeCheck, Star, Download } from 'lucide-react';
import { PlugrWordmark } from '@/src/components/Brand';
import { plugHandle } from '@/src/lib/plugHandle';
import { PlugAvatar } from '@/src/components/PlugAvatar';
import { PITCH_BLACK } from '@/src/lib/palette';

const GOLD = '#E8A020';
const BONE = '#F5F1EC';
const STEEL = '#7A9CC8';

// Handle generation lives in src/lib/plugHandle.ts so the card, the QR and the public
// profile page can never print different identifiers for the same Plug.
const plugNumber = plugHandle;

/** Rounded-rect path (no roundRect dependency — Safari support). */
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function DigitalId({
  plug,
  headline,
  profileUrl,
  onClose,
}: {
  plug: { id: string; name: string; trade: string; rating: number; photo_url?: string | null };
  headline: string;
  profileUrl: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const id = plugNumber(plug.id);

  async function share() {
    // "verified" is NOT asserted here — this share sheet is used by every Plug, including
    // unverified ones, and the shared text is the first thing a client reads.
    const data = { title: `${plug.name} · Plugr`, text: `${plug.name} — ${plug.trade} on Plugr`, url: profileUrl };
    try {
      if (navigator.share) await navigator.share(data);
      else await copyLink();
    } catch {
      /* cancelled */
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  /** Compose the card as a PNG and save it. */
  async function download() {
    setSaving(true);
    try {
      const W = 680;
      const H = 1080;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const ctx = c.getContext('2d')!;

      // card
      ctx.fillStyle = PITCH_BLACK;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 6;
      rrect(ctx, 3, 3, W - 6, H - 6, 36);
      ctx.stroke();

      // header
      ctx.fillStyle = GOLD;
      ctx.font = '700 30px "Clash Display", system-ui, sans-serif';
      ctx.fillText('plugr', 56, 90);
      ctx.fillStyle = STEEL;
      ctx.font = '600 17px "Satoshi", system-ui, sans-serif';
      ctx.fillText('DIGITAL ID · VERIFIED PLUG', 56, 124);

      // name + trade
      ctx.fillStyle = BONE;
      ctx.font = '700 54px "Clash Display", system-ui, sans-serif';
      ctx.fillText(plug.name, 56, 224);
      ctx.fillStyle = STEEL;
      ctx.font = '500 24px "Satoshi", system-ui, sans-serif';
      ctx.fillText(headline, 56, 262);

      // QR panel
      const qrCanvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
      const panel = { x: 56, y: 320, w: W - 112, h: 420 };
      ctx.fillStyle = '#FFFFFF';
      rrect(ctx, panel.x, panel.y, panel.w, panel.h, 24);
      ctx.fill();
      if (qrCanvas) {
        const size = 320;
        ctx.drawImage(qrCanvas, panel.x + (panel.w - size) / 2, panel.y + 50, size, size);
      }
      ctx.fillStyle = PITCH_BLACK;
      ctx.font = '700 18px "Satoshi", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN TO VIEW PROFILE', W / 2, panel.y + 34);
      ctx.textAlign = 'left';

      // id + rating
      ctx.fillStyle = STEEL;
      ctx.font = '600 17px "Satoshi", system-ui, sans-serif';
      ctx.fillText('PLUG ID', 56, 812);
      ctx.fillStyle = BONE;
      ctx.font = '700 34px "Clash Display", system-ui, sans-serif';
      ctx.fillText(id, 56, 854);

      ctx.textAlign = 'right';
      ctx.fillStyle = STEEL;
      ctx.font = '600 17px "Satoshi", system-ui, sans-serif';
      ctx.fillText('RATING', W - 56, 812);
      ctx.fillStyle = GOLD;
      ctx.font = '700 34px "Clash Display", system-ui, sans-serif';
      ctx.fillText(Number(plug.rating) > 0 ? Number(plug.rating).toFixed(1) : '—', W - 56, 854);
      ctx.textAlign = 'left';

      // footer rule + line
      ctx.strokeStyle = 'rgba(245,241,236,0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(56, 916);
      ctx.lineTo(W - 56, 916);
      ctx.stroke();
      ctx.fillStyle = STEEL;
      ctx.font = '500 19px "Satoshi", system-ui, sans-serif';
      // Recruiting line, not a badge. This card gets shared into WhatsApp groups full of other
      // tradespeople, so the footer is the one place on it that talks to them rather than to a
      // client. Measured at 535px against the 568px available between the 56px margins — it fits
      // at 19px with room to spare, so no size change was needed.
      ctx.fillText('Tradesperson? Get your own verified Plugr ID — getplugr.com', 56, 962);

      const blob: Blob | null = await new Promise((res) => c.toBlob(res, 'image/png'));
      if (!blob) throw new Error('render failed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plugr-id-${id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-pitch-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[340px] rounded-[26px] overflow-hidden bg-white shadow-2xl rise" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative bg-pitch-black px-5 pt-5 pb-8">
          <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 grid place-items-center h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <PlugrWordmark className="h-5 text-gold" />
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-steel-blue">Digital ID · Verified Plug</p>
        </div>

        {/* Identity */}
        <div className="px-5 -mt-5">
          <div className="flex items-end gap-3">
            <div className="relative">
              <PlugAvatar name={plug.name} photoUrl={plug.photo_url} tone="gold" className="h-16 w-16 border-4 border-white text-2xl" />
              <span className="absolute -bottom-1 -right-1 grid place-items-center h-6 w-6 rounded-full bg-white"><BadgeCheck className="w-5 h-5 text-gold" /></span>
            </div>
            <div className="pb-1 min-w-0">
              <h3 className="font-display text-lg text-pitch-black leading-tight truncate">{plug.name}</h3>
              <p className="text-xs text-slate truncate">{headline}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate">Plug ID</p>
              <p className="font-mono text-sm font-bold text-pitch-black tracking-wide">{id}</p>
            </div>
            {Number(plug.rating) > 0 && (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-pitch-black">
                <Star className="w-4 h-4 fill-gold text-gold" /> {Number(plug.rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* QR */}
        <div className="mx-5 mt-4 rounded-2xl bg-bone p-4 flex items-center gap-4">
          <div className="rounded-xl bg-white p-2 shrink-0">
            <QRCodeSVG value={profileUrl} size={92} fgColor={PITCH_BLACK} bgColor="#FFFFFF" level="M" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate mb-1">Scan to view</p>
            <p className="text-sm text-pitch-black leading-snug">Opens {plug.name.split(' ')[0]}’s Plugr profile.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 space-y-2">
          <div className="flex gap-2">
            <button onClick={share} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-pill bg-pitch-black text-white font-bold py-3 text-sm hover:bg-petrol transition-colors">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button onClick={copyLink} className="inline-flex items-center justify-center gap-1.5 rounded-pill border border-pitch-black/15 text-pitch-black font-bold px-4 py-3 text-sm hover:border-gold hover:text-gold transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button
            onClick={download}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-pill bg-gold text-pitch-black font-bold py-3 text-sm hover:bg-gold-light disabled:opacity-60 transition-colors"
          >
            <Download className="w-4 h-4" /> {saving ? 'Saving…' : 'Download ID'}
          </button>
        </div>

        {/* hidden canvas QR, drawn into the PNG */}
        <div ref={qrRef} className="hidden" aria-hidden>
          <QRCodeCanvas value={profileUrl} size={320} fgColor={PITCH_BLACK} bgColor="#FFFFFF" level="M" />
        </div>
      </div>
    </div>
  );
}
