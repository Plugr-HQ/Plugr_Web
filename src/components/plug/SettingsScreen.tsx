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
import { api } from '@/src/lib/api';
import { apiFetch } from '@/src/lib/api-client';
import { SettingsSkeleton } from '@/src/components/Skeleton';
import {
  getPlugId, getPlugPhone, maskPlugPhone, getPlugBank, setPlugBank, signOutPlug, type PlugBank,
} from '@/src/app/app/_lib/plugAuth';
import { withSource } from '@/src/lib/apiSource';
import { PlugShell } from './PlugChrome';
import { BankSelect, BankLogo, type BankOption } from './BankSelect';
// NOTE: adjust this import path to wherever bank-logos.ts actually lives in your repo.
import { useBankList } from '@/src/hooks/useBankList';

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
  // True while the bank-select dropdown (inside PayoutSection) is open. Drives the Logout
  // button pushing down out of the way, then springing back once it closes.
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const phone = typeof window !== 'undefined' ? getPlugPhone() : '';

  useEffect(() => {
    const id = getPlugId();
    if (!id) return;
    jsonFetch(withSource(`/api/plugs/${id}/dashboard`, base))
      .then((d) => setPlug(d.plug))
      .catch(() => { })
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
        <SettingsSkeleton />
      ) : (
        <div className="flex flex-col">
          <div className="space-y-5 pb-2">
            {/* Profile */}
            <div className="rise">
              <SectionLabel>Profile</SectionLabel>
              <Card className="px-4">
                <Field label="Name" value={plug?.name ?? '—'} />
                <div className="h-px bg-midnight/[0.06]" />
                <Field label="Phone" value={phone ? maskPlugPhone(phone) : '—'} />
                <div className="h-px bg-midnight/[0.06]" />
                {/* Optional email — the one identity field a Plug CAN edit here (name/phone/
                    verification are Plugr-managed). Collected optionally at the end of signup. */}
                <EmailRow
                  plugId={plug?.id ?? null}
                  initial={plug?.email ?? null}
                  onSaved={(email) => setPlug((p: any) => (p ? { ...p, email } : p))}
                />
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
          </div>

          {/* Logout — pushes down out of the way while the bank dropdown is open (its list can
             run tall on short screens), then springs back up once it closes. 340px is a rough
             estimate of the open dropdown's height (search bar + list) — nudge it if there's
             still a gap or slight overlap on your device. */}
          <div
            className={cn(
              'sticky bottom-4 z-40 mt-6 rise rise-2 bg-bone/95 backdrop-blur-sm pt-2 transition-transform duration-300 ease-out',
              bankDropdownOpen && 'translate-y-[340px]',
            )}
          >
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-pill border border-red-500/30 bg-white py-3.5 text-sm font-bold text-red-600 shadow-[0_4px_16px_-4px_rgba(15,23,42,0.15)] transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      )}
    </PlugShell>
  );
}

// Built from the known bank-logos manifest — used whenever the live api.verification.getBanks()
// call fails or returns empty, so the picker is never blank. api.verification.validateAccount()
// still does the real verification either way; this list only ever drives the dropdown UI, never
// whether an account is accepted.

// Delete this entirely — moved into useBankList.ts:
// const FALLBACK_BANKS: BankOption[] = Object.values(BANK_LOGOS).map(...)
/**
 * Optional contact email — the "edit it later" half of the field collected at the end of signup.
 * Saves through PATCH /api/plugs/:id/profile (guarded PLUG + ownership on the backend, which
 * writes it to the User row). Clearing the box and saving removes the address, so a Plug who
 * added one can always take it back off.
 */
function EmailRow({
  plugId, initial, onSaved,
}: { plugId: string | null; initial: string | null; onSaved: (email: string | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setValue(initial ?? ''); }, [initial]);

  async function save() {
    if (!plugId || saving) return;
    const email = value.trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr('That doesn’t look like a valid email.');
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await apiFetch(`/api/plugs/${plugId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      onSaved(email || null);
      setEditing(false);
    } catch (e: any) {
      // Surfaces the backend's real message (e.g. the email is already on another account).
      setErr(e?.message ?? 'Could not save your email.');
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 py-3">
        <span className="text-sm text-slate">Email</span>
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('min-w-0 truncate text-sm font-semibold', initial ? 'text-midnight' : 'text-slate/60')}>
            {initial || 'Not added'}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-pill border border-midnight/10 px-3 py-1.5 text-[11px] font-bold text-midnight transition-colors hover:bg-bone"
          >
            {initial ? 'Edit' : 'Add'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-slate">Email</span>
        <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate/70">Optional</span>
      </div>
      <input
        value={value}
        onChange={(e) => { setValue(e.target.value); if (err) setErr(null); }}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        aria-label="Email address"
        className={cn(
          'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-midnight placeholder:text-slate/50 focus:outline-none focus:ring-4 focus:ring-gold/10 transition-shadow',
          err ? 'border-red-400' : 'border-midnight/10 focus:border-gold',
        )}
      />
      {err ? (
        <p className="mt-2 text-[12px] text-red-600">{err}</p>
      ) : (
        <p className="mt-2 text-[11px] text-slate/70">Leave blank and save to remove it.</p>
      )}
      <div className="flex gap-3 pt-3">
        <button
          onClick={() => { setEditing(false); setValue(initial ?? ''); setErr(null); }}
          disabled={saving}
          className="flex-1 rounded-pill px-4 py-2.5 text-sm font-bold text-slate hover:text-midnight disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-midnight py-2.5 text-sm font-bold text-white transition-colors hover:bg-deep-blue disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function PayoutSection() {
  const [bank, setBank] = useState<PlugBank | null>(null);
  const [editing, setEditing] = useState(false);

  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState<{ accountName: string; bankName: string; bankLogoUrl: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Shared, session-cached list — see useBankList.ts. Only fetches while `editing` is true,
  // and only once across every screen that uses it (this one + WalletScreen's BankSetup).
  const { banks, usingFallback, loading: banksLoading } = useBankList(editing);

  useEffect(() => {
    const b = getPlugBank();
    setBank(b);
  }, []);

  // Auto-validate once both a bank and a full 10-digit account number are present.
  useEffect(() => {
    if (!bankCode || accountNumber.length !== 10) {
      setValidated(null);
      setValidationError(null);
      return;
    }

    let cancelled = false;
    setValidating(true);
    setValidationError(null);
    setValidated(null);

    const timer = setTimeout(() => {
      api.verification
        .validateAccount(accountNumber, bankCode)
        .then((result) => {
          if (cancelled) return;
          setValidated({ accountName: result.accountName, bankName: result.bankName, bankLogoUrl: result.bankLogoUrl });
        })
        .catch((err) => {
          if (cancelled) return;
          setValidationError(err?.message || 'Could not verify this account. Double-check the number and bank.');
        })
        .finally(() => {
          if (!cancelled) setValidating(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bankCode, accountNumber]);


  function startEdit() {
    setBankCode(bank?.bankCode ?? '');
    setAccountNumber(bank?.accountNumber ?? '');
    setValidated(null);
    setValidationError(null);
    setEditing(true);
  }

  function save() {
    if (!validated || !bankCode || accountNumber.length !== 10) return;
    const clean: PlugBank = {
      bankName: validated.bankName,
      bankCode,
      accountNumber,
      accountName: validated.accountName, // Monnify-confirmed — never the user's own typed value
      bankLogoUrl: validated.bankLogoUrl,
    };
    setPlugBank(clean);
    setBank(clean);
    setEditing(false);
  }

  const input =
    'w-full rounded-2xl border border-midnight/10 bg-white px-4 py-3 text-sm text-midnight placeholder:text-slate/50 focus:border-gold focus:outline-none focus:ring-4 focus:ring-gold/10 transition-shadow';

  if (editing) {
    return (
      <Card className="space-y-3 p-4">
        {usingFallback && (
          <p className="px-1 text-[11px] text-slate/70">
            Showing a standard bank list — live list unavailable right now.
          </p>
        )}

        <BankSelect
          banks={banks}
          value={bankCode}
          onChange={setBankCode}
          loading={banksLoading}
        />

        <input
          className={input}
          inputMode="numeric"
          placeholder="Account number (10 digits)"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
        />

        {/* Confirmed account name — read-only, never typed by the user */}
        {validating && (
          <div className="flex items-center gap-2 px-1 text-xs text-slate">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying account…
          </div>
        )}
        {!validating && validated && (
          <div className="flex items-center gap-2 rounded-2xl bg-gold/10 px-4 py-2.5 text-sm font-semibold text-midnight">
            <Check className="h-4 w-4 text-gold" /> {validated.accountName}
          </div>
        )}
        {!validating && validationError && (
          <p className="px-1 text-xs font-semibold text-red-600">{validationError}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={() => setEditing(false)} className="flex-1 rounded-pill px-4 py-2.5 text-sm font-bold text-slate hover:text-midnight">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!validated}
            className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-midnight py-2.5 text-sm font-bold text-white transition-colors hover:bg-deep-blue disabled:opacity-40 disabled:hover:bg-midnight"
          >
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
        <button onClick={startEdit} className="rounded-pill bg-gold px-4 py-2 text-xs font-bold text-midnight transition-colors hover:bg-gold-light">
          Add
        </button>
      </Card>
    );
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold overflow-hidden">
          <BankLogo url={bank.bankLogoUrl} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-midnight">{bank.bankName}</p>
          <p className="text-xs text-slate">
            •••• {bank.accountNumber.slice(-4)} · <span className="capitalize">{bank.accountName}</span>
          </p>
        </div>
      </div>
      <button onClick={startEdit} className="flex items-center gap-1.5 rounded-pill border border-midnight/10 px-3.5 py-2 text-xs font-bold text-midnight transition-colors hover:bg-bone">
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
    </Card>
  );
}