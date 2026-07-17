// src/components/plug/WalletScreen.tsx
// PLG-03 — Earnings / Wallet. Balance, pending, earnings history, withdrawal history,
// a single linked bank account, and a 4-digit PIN on every withdrawal.
//
// Deliberate per spec:
//  · "Withdraw to Bank" is ALWAYS enterable — during the lock it opens and shows a live
//    countdown rather than being disabled/hidden (manages payment anxiety).
//  · Single active account — no beneficiaries list. Changing it is gated by OTP.
//  · PIN gates withdrawals (not OTP); PIN is set during first bank setup, not before.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Lock, Clock, Check, Landmark, ShieldCheck, X, Wallet as WalletIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card, Divider, Money, Label, TextInput, GoldButton } from '@/src/app/demo/_components/ui';
import {
  getPlugId,
  getPlugBank,
  setPlugBank,
  bankLast4,
  setPlugPin,
  hasPlugPin,
  checkPlugPin,
  maskPlugPhone,
  getPlugPhone,
  type PlugBank,
} from '@/src/app/app/_lib/plugAuth';
import { PlugShell, JobStatusChip, EmptyState } from './PlugChrome';

type Range = 'week' | 'month' | 'total';
type Sheet = null | 'withdraw' | 'bank' | 'changeBank';

function hhmm(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const naira = (n: number) => '₦' + Number(n || 0).toLocaleString('en-NG');

export function WalletScreen({ base }: { base: string }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'earnings' | 'withdrawals'>('earnings');
  const [range, setRange] = useState<Range>('week');
  const [left, setLeft] = useState<number | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const unlocked = useRef(false);

  const plugId = typeof window !== 'undefined' ? getPlugId() : '';
  const [bank, setBank] = useState<PlugBank | null>(null);

  const load = useCallback(async () => {
    if (!plugId) return;
    try {
      const res = await fetch(`/api/plugs/${plugId}/dashboard`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Could not load your wallet.');
      setData(body);
      setLeft(body.lock?.seconds ?? null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [plugId]);

  useEffect(() => {
    setBank(getPlugBank());
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  // lock countdown -> UI calls /unlock at zero
  useEffect(() => {
    if (left === null || left <= 0) return;
    const t = setTimeout(() => setLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [left]);

  useEffect(() => {
    const jobId = data?.lock?.jobId;
    if (left === 0 && jobId && !unlocked.current) {
      unlocked.current = true;
      fetch(`/api/jobs/${jobId}/unlock`, { method: 'POST' }).finally(load);
    }
  }, [left, data?.lock?.jobId, load]);

  if (!data) {
    return (
      <PlugShell base={base} plug={null}>
        {error ? (
          <Card className="p-4 border-red-200"><p className="text-sm text-red-600">{error}</p></Card>
        ) : (
          <div className="flex items-center gap-2 text-slate text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        )}
      </PlugShell>
    );
  }

  const { plug, earnings, allJobs, withdrawals } = data;
  const available = Number(plug.wallet_balance_available);
  const locked = Number(plug.wallet_balance_locked);
  const counting = left !== null && left > 0;

  const earned = (allJobs ?? []).filter((j: any) =>
    ['released', 'withdrawn', 'paid_escrow', 'accepted', 'completed'].includes(j.status)
  );
  const since = (d: number) => Date.now() - d * 864e5;
  const inRange = (j: any) => {
    const t = new Date(j.escrow_released_at ?? j.created_at).getTime();
    if (range === 'week') return t >= since(7);
    if (range === 'month') return t >= since(30);
    return true;
  };
  const rows = earned.filter(inRange);

  return (
    <PlugShell base={base} plug={plug}>
      {/* Balance */}
      <Card className="relative overflow-hidden p-6 demo-rise">
        <div className="flex items-center gap-2 text-slate mb-3">
          <span className="grid place-items-center h-7 w-7 rounded-full bg-gold/15">
            <WalletIcon className="w-4 h-4 text-gold" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Available</span>
        </div>
        <Money amount={available} size="xl" />

        {locked > 0 && (
          <>
            <Divider className="my-4" />
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[13px] text-slate">
                <Lock className="w-3.5 h-3.5 text-gold" /> Pending
              </span>
              <span className="font-display text-lg text-midnight tnum">{naira(locked)}</span>
            </div>
          </>
        )}
      </Card>

      {/* Withdraw — always enterable, even while locked */}
      <div className="mt-4 demo-rise demo-rise-1">
        <GoldButton onClick={() => setSheet(bank ? 'withdraw' : 'bank')}>Withdraw to Bank</GoldButton>
        {counting && (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] text-slate">
            <Clock className="w-3.5 h-3.5" /> Available in <span className="tnum font-semibold text-midnight">{hhmm(left!)}</span>
          </p>
        )}
      </div>

      {/* Bank account — single active account */}
      <Card className="mt-4 p-4 demo-rise demo-rise-2">
        <div className="flex items-center gap-3">
          <span className="grid place-items-center h-10 w-10 rounded-xl bg-midnight/[0.04] text-midnight shrink-0">
            <Landmark className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            {bank ? (
              <>
                <p className="text-sm font-bold text-midnight truncate">{bank.bankName}</p>
                <p className="text-[11px] text-slate tnum">•••• {bankLast4(bank)} · {bank.accountName}</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-midnight">No bank linked</p>
                <p className="text-[11px] text-slate">Link one account to get paid out.</p>
              </>
            )}
          </div>
          <button
            onClick={() => setSheet(bank ? 'changeBank' : 'bank')}
            className="shrink-0 rounded-pill border border-midnight/10 px-3 py-1.5 text-[11px] font-bold text-midnight hover:border-gold hover:text-gold transition-colors"
          >
            {bank ? 'Change' : 'Link'}
          </button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 demo-rise demo-rise-3">
        {(['earnings', 'withdrawals'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-pill px-4 py-2 text-[13px] font-bold capitalize transition-colors',
              tab === t ? 'bg-midnight text-white' : 'bg-white text-slate border border-midnight/[0.08]'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'earnings' ? (
        <div className="mt-4 demo-rise demo-rise-4">
          {/* Range toggle */}
          <div className="flex gap-1.5 mb-3">
            {([['week', 'This week'], ['month', 'This month'], ['total', 'All time']] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setRange(k)}
                className={cn(
                  'flex-1 rounded-xl py-2 text-[11px] font-bold transition-colors',
                  range === k ? 'bg-gold/15 text-[#8a5a08]' : 'text-slate hover:text-midnight'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <Card className="p-4 mb-3 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate">Earned</span>
            <Money amount={earnings[range]} size="md" />
          </Card>

          {rows.length === 0 ? (
            <Card className="p-2">
              <EmptyState
                icon={<WalletIcon className="w-6 h-6" />}
                title="Nothing here yet"
                body="Earnings from completed jobs show up here the moment escrow releases."
              />
            </Card>
          ) : (
            <div className="space-y-2.5">
              {rows.map((j: any) => (
                <Card key={j.id} className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-midnight truncate">{j.job_description || 'Job'}</p>
                    <p className="text-[11px] text-slate">
                      {new Date(j.escrow_released_at ?? j.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Money amount={j.amount} size="sm" />
                    <JobStatusChip status={j.status === 'released' || j.status === 'withdrawn' ? 'released' : 'paid_escrow'} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-2.5 demo-rise demo-rise-4">
          {(withdrawals ?? []).length === 0 ? (
            <Card className="p-2">
              <EmptyState icon={<Landmark className="w-6 h-6" />} title="No withdrawals yet" body="Money you send to your bank will be listed here." />
            </Card>
          ) : (
            withdrawals.map((w: any) => (
              <Card key={w.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-display text-midnight tnum">{naira(w.amount)}</div>
                  <div className="text-[11px] text-slate">
                    {new Date(w.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    {bank && <> · •••• {bankLast4(bank)}</>}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-gold/15 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#8a5a08]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> {w.status}
                </span>
              </Card>
            ))
          )}
        </div>
      )}

      {sheet && (
        <Sheets
          sheet={sheet}
          close={() => setSheet(null)}
          plugId={plugId}
          available={available}
          locked={locked}
          counting={counting}
          left={left}
          bank={bank}
          onBank={(b) => { setPlugBank(b); setBank(b); }}
          reload={load}
        />
      )}
    </PlugShell>
  );
}

/* --------------------------------------------------------------- bottom sheets */

function Sheets({
  sheet, close, plugId, available, locked, counting, left, bank, onBank, reload,
}: {
  sheet: Exclude<Sheet, null>;
  close: () => void;
  plugId: string;
  available: number;
  locked: number;
  counting: boolean;
  left: number | null;
  bank: PlugBank | null;
  onBank: (b: PlugBank) => void;
  reload: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-midnight/50 backdrop-blur-sm" onClick={close}>
      <div
        className="w-full max-w-[440px] rounded-t-[24px] bg-bone p-5 pb-8 demo-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-pill bg-midnight/15" />
        <button onClick={close} className="absolute right-5 grid place-items-center h-8 w-8 rounded-full bg-midnight/[0.05] text-midnight" aria-label="Close">
          <X className="w-4 h-4" />
        </button>

        {sheet === 'bank' && <BankSetup bank={bank} onDone={(b) => { onBank(b); close(); }} />}
        {sheet === 'changeBank' && <ChangeBank onDone={(b) => { onBank(b); close(); }} />}
        {sheet === 'withdraw' && (
          <Withdraw
            plugId={plugId}
            available={available}
            locked={locked}
            counting={counting}
            left={left}
            bank={bank}
            close={close}
            reload={reload}
          />
        )}
      </div>
    </div>
  );
}

/** First bank setup — this is also where the 4-digit PIN gets set (spec: not before). */
function BankSetup({ bank, onDone }: { bank: PlugBank | null; onDone: (b: PlugBank) => void }) {
  const [bankName, setBankName] = useState(bank?.bankName ?? '');
  const [accountNumber, setAccountNumber] = useState(bank?.accountNumber ?? '');
  const [accountName, setAccountName] = useState(bank?.accountName ?? '');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const needPin = !hasPlugPin();

  function save() {
    setError(null);
    if (!bankName.trim() || accountNumber.length !== 10 || !accountName.trim()) {
      return setError('Enter your bank, a 10-digit account number, and the account name.');
    }
    if (needPin) {
      if (pin.length !== 4) return setError('Set a 4-digit PIN.');
      if (pin !== confirm) return setError('Those PINs don’t match.');
      setPlugPin(pin);
    }
    onDone({ bankName: bankName.trim(), accountNumber, accountName: accountName.trim() });
  }

  return (
    <>
      <h3 className="font-display text-2xl text-midnight">Link your bank</h3>
      <p className="mt-1 text-sm text-slate">One account at a time. This is where your money lands.</p>

      <div className="mt-5 space-y-4">
        <div>
          <Label className="mb-2">Bank</Label>
          <TextInput value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Wema Bank" autoFocus />
        </div>
        <div>
          <Label className="mb-2">Account number</Label>
          <TextInput
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            inputMode="numeric"
            placeholder="0123456789"
            className="tnum"
          />
        </div>
        <div>
          <Label className="mb-2">Account name</Label>
          <TextInput value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Emeka Nwosu" />
        </div>

        {needPin && (
          <>
            <Divider />
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <p className="text-[13px] text-slate">
                <span className="font-bold text-midnight">Set your withdrawal PIN.</span> You’ll enter it every time you
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
        <GoldButton onClick={save}>Save account</GoldButton>
      </div>
    </>
  );
}

/** Changing the linked account is OTP-gated (spec) — withdrawals use the PIN instead. */
function ChangeBank({ onDone }: { onDone: (b: PlugBank) => void }) {
  const [stage, setStage] = useState<'otp' | 'form'>('otp');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const phone = typeof window !== 'undefined' ? getPlugPhone() : '';

  if (stage === 'form') return <BankSetup bank={null} onDone={onDone} />;

  return (
    <>
      <h3 className="font-display text-2xl text-midnight">Confirm it’s you</h3>
      <p className="mt-1 text-sm text-slate">
        Changing your payout account needs a code. Sent to {phone ? maskPlugPhone(phone) : 'your phone'}.
      </p>

      <div className="mt-5">
        <Label className="mb-2">6-digit code</Label>
        <TextInput
          value={code}
          onChange={(e) => { setError(null); setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); }}
          inputMode="numeric"
          placeholder="••••••"
          className="tnum tracking-[0.3em]"
          autoFocus
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <p className="mt-3 text-xs text-slate/70">No SMS provider wired yet — any 6 digits pass.</p>

      <div className="mt-5">
        <GoldButton
          onClick={() => (code.length === 6 ? setStage('form') : setError('Enter the 6-digit code.'))}
          disabled={code.length !== 6}
        >
          Verify
        </GoldButton>
      </div>
    </>
  );
}

/** Withdraw — opens even while locked, and shows the countdown instead of hiding. */
function Withdraw({
  plugId, available, locked, counting, left, bank, close, reload,
}: {
  plugId: string;
  available: number;
  locked: number;
  counting: boolean;
  left: number | null;
  bank: PlugBank | null;
  close: () => void;
  reload: () => void;
}) {
  const [amount, setAmount] = useState(String(available || ''));
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0 || amt > available) return setError('Enter an amount within your available balance.');
    if (!checkPlugPin(pin)) return setError('Wrong PIN. Try again.');
    setBusy(true);
    try {
      const res = await fetch(`/api/plugs/${plugId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Could not start that withdrawal.');
      setDone(true);
      reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-2">
        <span className="mx-auto mb-4 grid place-items-center h-14 w-14 rounded-full bg-gold/15">
          <Clock className="w-7 h-7 text-gold" />
        </span>
        <h3 className="font-display text-2xl text-midnight">Withdrawal processing</h3>
        <p className="mt-2 text-sm text-slate leading-relaxed">
          {naira(Number(amount))} is on its way to •••• {bankLast4(bank)}. Payouts are bank-initiated, so this stays{' '}
          <span className="font-bold text-midnight">pending</span> — we don’t fake a completed transfer.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <Check className="w-4 h-4" strokeWidth={3} /> Deducted from available
        </div>
        <div className="mt-5">
          <GoldButton onClick={close}>Done</GoldButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <h3 className="font-display text-2xl text-midnight">Withdraw to bank</h3>
      <p className="mt-1 text-sm text-slate">
        {bank ? `${bank.bankName} · •••• ${bankLast4(bank)}` : 'No account linked'}
      </p>

      {/* Locked state — entered, not hidden */}
      {counting && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-gold/20 bg-gold/[0.08] p-4">
          <Lock className="w-4 h-4 text-gold shrink-0 mt-0.5" />
          <p className="text-[13px] leading-relaxed text-midnight">
            <span className="font-bold">{naira(locked)} is still in the dispute window.</span> It becomes available in{' '}
            <span className="tnum font-bold">{hhmm(left!)}</span>. Anything already available you can take now.
          </p>
        </div>
      )}

      <div className="mt-5">
        <Label className="mb-2">Amount</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-xl text-gold/90">₦</span>
          <TextInput
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            className="pl-9 font-display text-xl tnum"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-slate">{naira(available)} available</p>
      </div>

      <div className="mt-4">
        <Label className="mb-2">Withdrawal PIN</Label>
        <TextInput
          value={pin}
          onChange={(e) => { setError(null); setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); }}
          inputMode="numeric"
          type="password"
          placeholder="••••"
          className="tnum tracking-[0.4em]"
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5">
        <GoldButton onClick={submit} loading={busy} disabled={available <= 0 || pin.length !== 4}>
          {busy ? 'Processing…' : `Withdraw ${amount ? naira(Number(amount)) : ''}`}
        </GoldButton>
      </div>
    </>
  );
}
