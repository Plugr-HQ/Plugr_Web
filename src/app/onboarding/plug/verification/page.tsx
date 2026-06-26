'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Info, ShieldCheck, RefreshCw } from 'lucide-react';
import FlowProgress from '@/src/components/FlowProgress';

function VerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const role = searchParams.get('role') || 'plug';
  const firstName = searchParams.get('firstName') || '';
  const lastName = searchParams.get('lastName') || '';
  const city = searchParams.get('city') || 'Lagos';
  const trade = searchParams.get('trade') || 'electrician';
  const avatar = searchParams.get('avatar') || '';

  const [nin, setNin] = useState('');
  const [ninVerifying, setNinVerifying] = useState(false);
  const [ninVerified, setNinVerified] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleVerify = () => {
    if (nin.replace(/\s+/g, '').length < 11) {
      alert('NIN must consist of exactly 11 digits.');
      return;
    }
    setNinVerifying(true);
    setTimeout(() => {
      setNinVerifying(false);
      setNinVerified(true);
    }, 1500);
  };

  const handleContinue = () => {
    if (!ninVerified) {
      alert('Please verify your NIN to continue.');
      return;
    }
    const query = new URLSearchParams({ phone, role, firstName, lastName, city, trade, avatar, nin }).toString();
    router.push(`/onboarding/plug/livenesscheck?${query}`);
  };

  return (
    <div className="w-full max-w-md min-h-screen max-h-[850px] bg-[#F6F5F0] p-6 flex flex-col justify-between overflow-y-auto">
      <div className="shrink-0 space-y-4">
        <div className="flex justify-between items-center pt-3">
          <button type="button" onClick={() => router.back()} className="p-2 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition shadow-xs text-slate-700">
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <span className="font-display font-bold text-sm text-slate-800">Verify your identity</span>
          <button type="button" onClick={() => alert('Verification is performed against NIN records to secure the database.')} className="text-xs font-bold text-[#EB9E27] font-mono hover:underline uppercase">Help</button>
        </div>
        <FlowProgress currentStepIndex={1} />
      </div>

      <div className="space-y-5 my-auto">
        <div className="bg-white rounded-[28px] p-5 border border-slate-150 space-y-4 shadow-sm">
          <div className="flex justify-between items-center text-[10px] font-mono font-extrabold text-[#EB9E27]">
            <span>NIN ENTRY</span>
            <button type="button" onClick={() => setShowTooltip(!showTooltip)}><Info className="h-4 w-4 text-[#EB9E27]" /></button>
          </div>
          {showTooltip && (
            <div className="bg-amber-50 text-amber-900 rounded-xl p-3 border border-amber-100 text-xs leading-normal">
              Enter your 11-digit National Identity Number.
            </div>
          )}
          <div>
            <label className="text-slate-400 text-xs font-bold block mb-1">National Identity Number</label>
            <input
              type="text"
              maxLength={11}
              placeholder="00000000000"
              value={nin}
              onChange={e => setNin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 font-mono font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:border-[#EB9E27] tracking-widest text-sm text-center shadow-inner"
            />
          </div>
          {ninVerified ? (
            <div className="bg-emerald-50 text-emerald-800 border-2 border-emerald-100 rounded-2xl p-4 flex items-center justify-center gap-2 text-xs font-bold">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> VETTED matched successfully!
            </div>
          ) : (
            <button type="button" onClick={handleVerify} disabled={ninVerifying} className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-bold py-3 px-5 rounded-full transition text-xs flex items-center justify-center gap-1.5">
              {ninVerifying ? <><RefreshCw className="h-4 w-4 animate-spin" /> Matching records...</> : 'Verify NIN'}
            </button>
          )}
        </div>
      </div>

      <div className="shrink-0 pb-6 space-y-3">
        {!ninVerified && <p className="text-[10px] font-mono text-slate-400 text-center">Tip: Enter any 11 digits and tap "Verify NIN".</p>}
        <button type="button" onClick={handleContinue} disabled={!ninVerified} className={`w-full font-semibold py-4 px-6 rounded-full shadow-lg transition ${ninVerified ? 'bg-[#EB9E27] hover:bg-[#D68B1D] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F5F0] flex items-center justify-center font-mono text-xs text-slate-400">Loading...</div>}>
      <div className="flex items-center justify-center min-h-screen bg-[#F6F5F0]">
        <VerificationContent />
      </div>
    </Suspense>
  );
}
