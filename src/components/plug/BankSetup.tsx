// src/components/plug/BankSetup.tsx
// Shared bank-link + PIN-setup form. Used by WalletScreen (first bank link / change bank) and
// SettingsScreen (Payout account). Previously duplicated — WalletScreen had the full version
// (bank + PIN), SettingsScreen had a stripped copy with no PIN step at all, which is why Settings
// had no way to set a withdrawal PIN. One implementation now; fix it once, both screens get it.
'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check, ShieldCheck } from 'lucide-react';
import { Divider, Label, TextInput, GoldButton } from '@/src/components/ui';
import { apiFetch } from '@/src/lib/api-client';
import { withSource } from '@/src/lib/apiSource';
import { api, authHeaders } from '@/src/lib/api';
import type { PlugBank } from '@/src/app/app/_lib/plugAuth';
import { BankSelect } from './BankSelect';
import { useBankList } from '@/src/hooks/useBankList';
import { BANK_LOGOS } from '@/src/lib/bank-logos';

export function BankSetup({
  bank, plugId, base, hasPin, onDone,
}: {
  bank: PlugBank | null;
  plugId: string;
  base: string;
  hasPin: boolean;
  onDone: (b: PlugBank) => void;
}) {
  // Shared, session-cached list — see useBankList.ts.
  const { banks, usingFallback, loading: banksLoading } = useBankList(true);

  const [bankCode, setBankCode] = useState(bank?.bankCode ?? '');
  const [accountNumber, setAccountNumber] = useState(bank?.accountNumber ?? '');

  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState<{ accountName: string; bankName: string; bankLogoUrl: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const needPin = !hasPin;

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
          // Override name/logo from the known manifest — the live provider's own bankName on
          // this endpoint can carry a stale/mislabeled value (e.g. "Opay 3"). accountName is
          // left as-is, it's the real provider-confirmed account holder name.
          const known = BANK_LOGOS[bankCode];
          setValidated({
            accountName: result.accountName,
            bankName: known?.name ?? result.bankName,
            bankLogoUrl: known?.logo ?? result.bankLogoUrl,
          });
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

  async function save() {
    setError(null);
    if (!validated || !bankCode || accountNumber.length !== 10) {
      return setError('Pick your bank and enter a 10-digit account number to verify it.');
    }
    if (needPin) {
      if (pin.length !== 4) return setError('Set a 4-digit PIN.');
      if (pin !== confirm) return setError('Those PINs don’t match.');
    }

    setSaving(true);
    try {
      if (needPin) {
        await apiFetch(withSource(`/api/plugs/${plugId}/pin`, base), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ pin }),
        }, { skipAuthRedirect: false });
      }
      onDone({
        bankName: validated.bankName,
        bankCode,
        accountNumber,
        accountName: validated.accountName, // Monnify-confirmed — never the user's own typed value
        bankLogoUrl: validated.bankLogoUrl,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <h3 className="font-display text-2xl text-pitch-black">Link your bank</h3>
      <p className="mt-1 text-sm text-slate">One account at a time. This is where your money lands.</p>

      <div className="mt-5 space-y-4">
        {usingFallback && (
          <p className="px-1 text-[11px] text-slate/70">
            Showing a standard bank list — live list unavailable right now.
          </p>
        )}

        <div>
          <Label className="mb-2">Bank</Label>
          <BankSelect banks={banks} value={bankCode} onChange={setBankCode} loading={banksLoading} />
        </div>

        <div>
          <Label className="mb-2">Account number</Label>
          <TextInput
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            inputMode="numeric"
            placeholder="0123456789"
            className="tnum"
            autoFocus
          />
        </div>

        {/* Confirmed account name — read-only, never typed by the user */}
        {validating && (
          <div className="flex items-center gap-2 px-1 text-xs text-slate">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying account…
          </div>
        )}
        {!validating && validated && (
          <div className="flex items-center gap-2 rounded-2xl bg-gold/10 px-4 py-2.5 text-sm font-semibold text-pitch-black">
            <Check className="h-4 w-4 text-gold" /> {validated.accountName}
          </div>
        )}
        {!validating && validationError && (
          <p className="px-1 text-xs font-semibold text-red-600">{validationError}</p>
        )}

        {needPin && (
          <>
            <Divider />
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <p className="text-[13px] text-slate">
                <span className="font-bold text-pitch-black">Set your withdrawal PIN.</span> You’ll enter it every time you
                move money out.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-2">4-digit PIN</Label>
                <TextInput
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  type="password"
                  className="tnum tracking-[0.4em]"
                />
              </div>
              <div>
                <Label className="mb-2">Confirm PIN</Label>
                <TextInput
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  type="password"
                  className="tnum tracking-[0.4em]"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-5">
        <GoldButton onClick={save} loading={saving} disabled={!validated}>Save account</GoldButton>
      </div>
    </>
  );
}