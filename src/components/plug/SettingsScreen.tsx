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
import {
  getPlugId, getPlugPhone, maskPlugPhone, getPlugBank, setPlugBank, signOutPlug, type PlugBank,
} from '@/src/app/app/_lib/plugAuth';
import { withSource } from '@/src/lib/apiSource';
import { PlugShell } from './PlugChrome';
import { BankSelect, BankLogo, type BankOption } from './BankSelect';
// NOTE: adjust this import path to wherever bank-logos.ts actually lives in your repo.
import { BANK_LOGOS } from '@/src/lib/bank-logos';

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

// Built from the known bank-logos manifest — used whenever the live api.verification.getBanks()
// call fails or returns empty, so the picker is never blank. api.verification.validateAccount()
// still does the real verification either way; this list only ever drives the dropdown UI, never
// whether an account is accepted.
const FALLBACK_BANKS: BankOption[] = Object.values(BANK_LOGOS).map((b) => ({
  code: b.code,
  name: b.name,
  logoUrl: b.logo,
}));

function PayoutSection() {
  const [bank, setBank] = useState<PlugBank | null>(null);
  const [editing, setEditing] = useState(false);

  const [banks, setBanks] = useState<BankOption[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState<{ accountName: string; bankName: string; bankLogoUrl: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const b = getPlugBank();
    setBank(b);
  }, []);

  // Load the bank list once editing starts, not on every render of the settings screen.
  // Falls back to the local BANK_LOGOS manifest if the live list fails or comes back empty —
  // the picker should never be left with nothing selectable.
  useEffect(() => {
    if (!editing || banks.length > 0) return;
    setBanksLoading(true);
    api.verification
      .getBanks()
      .then((list) => {
        if (list && list.length > 0) {
          setBanks(list);
          setUsingFallback(false);
        } else {
          setBanks(FALLBACK_BANKS);
          setUsingFallback(true);
        }
      })
      .catch(() => {
        setBanks(FALLBACK_BANKS);
        setUsingFallback(true);
      })
      .finally(() => setBanksLoading(false));
  }, [editing, banks.length]);

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

        <BankSelect banks={banks} value={bankCode} onChange={setBankCode} loading={banksLoading} />

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