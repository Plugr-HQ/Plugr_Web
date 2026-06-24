'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import FlowProgress from '@/src/components/FlowProgress';
import LivenessScanner from '@/src/components/LivenessScanner';

function LivenessCheckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const role = searchParams.get('role') || 'plug';
  const firstName = searchParams.get('firstName') || '';
  const lastName = searchParams.get('lastName') || '';
  const city = searchParams.get('city') || 'Lagos';
  const trade = searchParams.get('trade') || 'electrician';
  const avatar = searchParams.get('avatar') || '';
  const nin = searchParams.get('nin') || '';

  const [livenessVerified, setLivenessVerified] = useState(false);

  const handleContinue = () => {
    if (!livenessVerified) {
      alert("Please complete the liveness scan first.");
      return;
    }
    // Save plug profile — ID is based on the phone number for stable, readable URLs
    const cleanPhone = phone.replace(/\D/g, '');
    const plugId = `plug_${cleanPhone}`;
    localStorage.setItem('plugProfile', JSON.stringify({
      id: plugId,
      firstName,
      lastName,
      city,
      trade,
      nin,
      phone,
      photoUrl: avatar,
      ninVerified: true,
      livenessVerified: true,
      rating: 0,
      completedJobs: 0,
    }));
    router.push(`/p/${plugId}`);
  };

  return (
    <div className="w-full max-w-md min-h-screen max-h-[850px] bg-[#F6F5F0] p-6 flex flex-col justify-between overflow-y-auto">
      <div className="shrink-0 space-y-4">
        <div className="flex justify-between items-center pt-3">
          <button type="button" onClick={() => router.back()} className="p-2 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition shadow-xs text-slate-700">
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <span className="font-display font-bold text-sm text-slate-800">Verify your identity</span>
          <button type="button" onClick={() => alert('Liveness scanners perform high density neural mapping to identify genuine live presence.')} className="text-xs font-bold text-[#EB9E27] font-mono hover:underline uppercase">Help</button>
        </div>
        <FlowProgress currentStepIndex={2} />
      </div>

      <div className="space-y-4 my-auto w-full">
        <div className="bg-white rounded-[28px] p-5 border border-slate-150 space-y-4 shadow-sm">
          <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase">LIVENESS CHECK</span>
          <LivenessScanner onSuccess={() => setLivenessVerified(true)} />
        </div>
      </div>

      <div className="shrink-0 pb-6">
        <button type="button" onClick={handleContinue} disabled={!livenessVerified} className={`w-full font-semibold py-4 px-6 rounded-full shadow-lg transition ${livenessVerified ? 'bg-[#EB9E27] hover:bg-[#D68B1D] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default function LivenessCheckPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F5F0] flex items-center justify-center font-mono text-xs text-slate-400">Loading...</div>}>
      <div className="flex items-center justify-center min-h-screen bg-[#F6F5F0]">
        <LivenessCheckContent />
      </div>
    </Suspense>
  );
}
