// src/components/plug/SettingsScreen.tsx
// PLG settings: profile (read-only identity + verification), payout account (the bank details a
// Plug needs to receive real payouts), and logout.
//
// Editability: the self-service profile edit endpoint only accepts bio/photo, and verification is
// ADMIN-only — so name, phone and verification status are shown read-only here (bio/photo editing
// stays on the Profile screen). Notification preferences are intentionally omitted: notifications
// are derived from job state with no channel to toggle yet, so there's nothing meaningful to set.
//
// Payout account is stored client-side today (same PlugBank store the wallet/withdraw flow uses).
// Persisting it server-side for real bank payouts needs a PlugProfile field on the backend — see
// the report; not added here to avoid an unplanned prod-schema change inside a UI task.
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Clock, Landmark, LogOut, Pencil, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card } from '@/src/components/ui';
import { jsonFetch } from '@/src/lib/net';
import {
  getPlugId, getPlugPhone, maskPlugPhone, getPlugBank, setPlugBank, signOutPlug, type PlugBank,
} from '@/src/app/app/_lib/plugAuth';
import { withSource } from '@/src/lib/apiSource';
import { PlugShell } from './PlugChrome';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate">{children}</p>;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-sm text-slate">{label}</span>
      <span className="min-w-0 truncate text-sm font-semibold text-midnight">{value}</span>
    </div>
  );
}

export function SettingsScreen({ base }: { base: string }) {
  const router = useRouter();
  const [plug, setPlug] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const phone = typeof window !== 'undefined' ? getPlugPhone() : '';

  useEffect(() => {
    const id = getPlugId();
    if (!id) return;
    jsonFetch(withSource(`/api/plugs/${id}/dashboard`, base))
      .then((d) => setPlug(d.plug))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [base]);

  function logout() {
    signOutPlug(); // clears every plug session key AND the plugr_token JWT
    router.replace('/'); // straight to the homepage, not role-select/onboarding
  }

  const verified = !!plug?.verified;

  return (
    <PlugShell base={base} plug={plug}>
      <h1 className="mb-4 font-display text-2xl text-midnight">Settings</h1>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-5">
          {/* Profile */}
          <div className="rise">
            <SectionLabel>Profile</SectionLabel>
            <Card className="px-4">
              <Field label="Name" value={plug?.name ?? '—'} />
              <div className="h-px bg-midnight/[0.06]" />
              <Field label="Phone" value={phone ? maskPlugPhone(phone) : '—'} />
              <div className="h-px bg-midnight/[0.06]" />
              <div className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm text-slate">Verification</span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-bold',
                    verified ? 'bg-gold/15 text-[#8a5a08]' : 'bg-slate/12 text-slate',
                  )}
                >
                  {verified ? <ShieldCheck className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  {verified ? 'Verified' : 'Under review'}
                </span>
              </div>
            </Card>
            <p className="mt-2 px-1 text-[11px] text-slate/70">
              Name and verification are managed by Plugr and can’t be edited here. Update your bio and photo from the Profile tab.
            </p>
          </div>

          {/* Payout account */}
          <div className="rise rise-1">
            <SectionLabel>Payout account</SectionLabel>
            <PayoutSection />
            <p className="mt-2 px-1 text-[11px] text-slate/70">
              Where your withdrawals are sent. Without this, a payout can’t reach your bank.
            </p>
          </div>

          {/* Logout */}
          <div className="rise rise-2 pt-1">
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-pill border border-red-500/30 py-3.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      )}
    </PlugShell>
  );
}

function PayoutSection() {
  const [bank, setBank] = useState<PlugBank | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PlugBank>({ bankName: '', accountNumber: '', accountName: '' });

  useEffect(() => {
    const b = getPlugBank();
    setBank(b);
    if (b) setForm(b);
  }, []);

  function save() {
    const clean: PlugBank = {
      bankName: form.bankName.trim(),
      accountNumber: form.accountNumber.replace(/\D/g, '').slice(0, 10),
      accountName: form.accountName.trim(),
    };
    if (!clean.bankName || clean.accountNumber.length < 10 || !clean.accountName) return;
    setPlugBank(clean);
    setBank(clean);
    setEditing(false);
  }

  const input =
    'w-full rounded-2xl border border-midnight/10 bg-white px-4 py-3 text-sm text-midnight placeholder:text-slate/50 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/10 transition-shadow';

  if (editing) {
    return (
      <Card className="space-y-3 p-4">
        <input className={input} placeholder="Bank name (e.g. GTBank)" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
        <input className={input} inputMode="numeric" placeholder="Account number (10 digits)" value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
        <input className={input} placeholder="Account name" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} />
        <div className="flex gap-3 pt-1">
          <button onClick={() => setEditing(false)} className="flex-1 rounded-pill px-4 py-2.5 text-sm font-bold text-slate hover:text-midnight">Cancel</button>
          <button onClick={save} className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-midnight py-2.5 text-sm font-bold text-white transition-colors hover:bg-deep-blue">
            <Check className="h-4 w-4" /> Save
          </button>
        </div>
      </Card>
    );
  }

  if (!bank) {
    return (
      <Card className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-midnight/[0.04] text-slate">
            <Landmark className="h-5 w-5" />
          </span>
          <span className="text-sm text-slate">No payout account yet</span>
        </div>
        <button onClick={() => setEditing(true)} className="rounded-pill bg-gold px-4 py-2 text-xs font-bold text-midnight transition-colors hover:bg-gold-light">
          Add
        </button>
      </Card>
    );
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold">
          <Landmark className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-midnight">{bank.bankName}</p>
          <p className="text-xs text-slate">
            •••• {bank.accountNumber.slice(-4)} · <span className="capitalize">{bank.accountName}</span>
          </p>
        </div>
      </div>
      <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-pill border border-midnight/10 px-3.5 py-2 text-xs font-bold text-midnight transition-colors hover:bg-bone">
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
    </Card>
  );
}
