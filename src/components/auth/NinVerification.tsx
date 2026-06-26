'use client';
import React, { useState } from 'react';
import { ChevronLeft, Info, ShieldCheck, RefreshCw } from 'lucide-react';
import { UserRole, TradeType } from '../../types';
import FlowProgress from '../FlowProgress';

interface NinVerificationProps {
  selectedRole: UserRole;
  trade: TradeType;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  nin: string;
  setNin: (v: string) => void;
  ninVerifying: boolean;
  setNinVerifying: (v: boolean) => void;
  ninVerified: boolean;
  setNinVerified: (v: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function NinVerification({
  selectedRole, trade, firstName, setFirstName, lastName, setLastName,
  nin, setNin, ninVerifying, setNinVerifying, ninVerified, setNinVerified,
  onBack, onContinue
}: NinVerificationProps) {
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
      if (!firstName || !lastName) {
        if (trade === 'electrician') { setFirstName('Tunde'); setLastName('Bakare'); }
        else { setFirstName('Haruna'); setLastName('Yusuf'); }
      }
    }, 1500);
  };

  return (
    <div className="w-full max-w-md min-h-screen max-h-[850px] bg-[#F6F5F0] p-6 flex flex-col justify-between overflow-y-auto">
      <div className="shrink-0 space-y-4">
        <div className="flex justify-between items-center pt-3">
          <button type="button" onClick={onBack} className="p-2 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition shadow-xs text-slate-700">
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
            <button type="button" onClick={() => setShowTooltip(!showTooltip)} className="text-slate-400 hover:text-slate-600">
              <Info className="h-4 w-4 text-[#EB9E27]" />
            </button>
          </div>
          {showTooltip && (
            <div className="bg-amber-50 text-amber-900 rounded-xl p-3 border border-amber-100 text-xs leading-normal">
              Enter your 11-digit National Identity Number. We use this to verify match guidelines directly under local regulations.
            </div>
          )}
          <div>
            <label className="text-slate-400 text-xs font-bold block mb-1">National Identity Number</label>
            <input
              type="text"
              maxLength={11}
              placeholder="0000 0000 000"
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 font-mono font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:border-[#EB9E27] tracking-widest text-sm text-center shadow-inner"
            />
          </div>
          {ninVerified ? (
            <div className="bg-emerald-50 text-emerald-800 border-2 border-emerald-100 rounded-2xl p-4 flex items-center justify-center gap-2 text-xs font-bold">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> VETTED matched successfully!
            </div>
          ) : (
            <button onClick={handleVerify} disabled={ninVerifying} className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-bold py-3 px-5 rounded-full transition text-xs flex items-center justify-center gap-1.5">
              {ninVerifying ? <><RefreshCw className="h-4 w-4 animate-spin" /> Matching records...</> : 'Verify NIN'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-2 shrink-0 pb-6 text-center">
        {!ninVerified && <p className="text-[10px] font-mono text-slate-400">Tip: Enter any mock 11 digits and tap "Verify NIN" to auto check match.</p>}
        <button
          onClick={onContinue}
          disabled={!ninVerified}
          className={`w-full font-semibold py-4.5 px-6 rounded-full shadow-lg transition flex items-center justify-center gap-2 ${ninVerified ? 'bg-[#EB9E27] hover:bg-[#D68B1D] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-90'}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
