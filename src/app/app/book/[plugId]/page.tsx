// src/app/app/book/[plugId]/page.tsx
// Client books a job, then continues to escrow payment.

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, BadgeCheck, ArrowRight } from 'lucide-react';
import { Shell } from '@/src/app/demo/_components/Shell';
import { Card, Label, TextInput, TextArea, PrimaryButton, Money } from '@/src/app/demo/_components/ui';
import { jsonFetch, getDemoIdentity } from '@/src/app/demo/_lib/demo';

export default function AppBookPage() {
  const { plugId } = useParams<{ plugId: string }>();
  const router = useRouter();
  const [plug, setPlug] = useState<any>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Public profile read (client is not the plug owner) — the unauthenticated /profile route.
    jsonFetch(`/api/plugs/${plugId}/profile`).then((d) => setPlug(d.plug)).catch((e) => setError(e.message));
  }, [plugId]);

  async function book() {
    setError(null);
    const amt = Number(amount);
    if (!description.trim() || !Number.isFinite(amt) || amt <= 0) {
      setError('Add a description and a positive amount.');
      return;
    }
    setSubmitting(true);
    try {
      const { name, phone } = getDemoIdentity();
      const { job } = await jsonFetch('/api/jobs?source=core', {
        method: 'POST',
        body: JSON.stringify({ plugId, clientName: name || 'Client', clientPhone: phone, jobDescription: description.trim(), amount: amt }),
      });
      router.push(`/app/pay/${job.id}`);
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <Shell
      eyebrow="Book a job"
      title="Describe the work"
      back={`/app/plugs/${plugId}`}
      footer={
        <PrimaryButton onClick={book} loading={submitting}>
          {submitting ? 'Creating job…' : 'Continue to payment'} {!submitting && <ArrowRight className="w-4 h-4" />}
        </PrimaryButton>
      }
    >
      {plug && (
        <Card className="p-4 mb-6 flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="grid place-items-center h-12 w-12 rounded-2xl bg-midnight text-white font-display text-lg">{plug.name?.[0]}</div>
            {plug.verified && <span className="absolute -bottom-1 -right-1 grid place-items-center h-5 w-5 rounded-full bg-white"><BadgeCheck className="w-4 h-4 text-gold" /></span>}
          </div>
          <div>
            <h3 className="font-bold text-midnight">{plug.name}</h3>
            <p className="text-sm text-slate capitalize flex items-center gap-2">
              {plug.trade}
              <span className="inline-flex items-center gap-1 text-midnight font-semibold"><Star className="w-3.5 h-3.5 fill-gold text-gold" />{Number(plug.rating).toFixed(1)}</span>
            </p>
          </div>
        </Card>
      )}

      <div className="space-y-5">
        <div>
          <Label className="mb-2">What needs doing?</Label>
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="e.g. Faulty DB board diagnosis and repair" />
        </div>
        <div>
          <Label className="mb-2">Agreed amount</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-xl text-gold/90">₦</span>
            <TextInput value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="2,500" className="pl-9 font-display text-xl tnum" />
          </div>
        </div>
      </div>

      {amount && (
        <div className="mt-6 flex items-baseline justify-between px-1">
          <span className="text-sm text-slate">Held in escrow</span>
          <Money amount={amount} size="md" />
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </Shell>
  );
}
