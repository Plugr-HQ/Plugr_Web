'use client';
import React, { useState } from 'react';
import { ChevronLeft, Key } from 'lucide-react';

const COUNTRIES = [
  { name: 'Nigeria', code: '234', flag: '🇳🇬' },
  { name: 'Ghana', code: '233', flag: '🇬🇭' },
  { name: 'Kenya', code: '254', flag: '🇰🇪' },
  { name: 'South Africa', code: '27', flag: '🇿🇦' },
  { name: 'United Kingdom', code: '44', flag: '🇬🇧' },
  { name: 'United States', code: '1', flag: '🇺🇸' },
  { name: 'Canada', code: '1', flag: '🇨🇦' },
  { name: 'France', code: '33', flag: '🇫🇷' },
  { name: 'Germany', code: '49', flag: '🇩🇪' },
  { name: 'Italy', code: '39', flag: '🇮🇹' },
  { name: 'Spain', code: '34', flag: '🇪🇸' },
  { name: 'Brazil', code: '55', flag: '🇧🇷' },
  { name: 'India', code: '91', flag: '🇮🇳' },
  { name: 'China', code: '86', flag: '🇨🇳' },
  { name: 'Japan', code: '81', flag: '🇯🇵' },
  { name: 'Australia', code: '61', flag: '🇦🇺' },
  { name: 'Egypt', code: '20', flag: '🇪🇬' },
  { name: 'Ethiopia', code: '251', flag: '🇪🇹' },
  { name: 'Tanzania', code: '255', flag: '🇹🇿' },
  { name: 'Uganda', code: '256', flag: '🇺🇬' },
  { name: 'Cameroon', code: '237', flag: '🇨🇲' },
  { name: 'Senegal', code: '221', flag: '🇸🇳' },
  { name: "Côte d'Ivoire", code: '225', flag: '🇨🇮' },
  { name: 'Rwanda', code: '250', flag: '🇷🇼' },
  { name: 'Zambia', code: '260', flag: '🇿🇲' },
  { name: 'Zimbabwe', code: '263', flag: '🇿🇼' },
  { name: 'Portugal', code: '351', flag: '🇵🇹' },
  { name: 'Netherlands', code: '31', flag: '🇳🇱' },
  { name: 'Saudi Arabia', code: '966', flag: '🇸🇦' },
  { name: 'UAE', code: '971', flag: '🇦🇪' },
];

// Sort by longest code first so e.g. 234 matches before 23
const SORTED = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);

function detectCountry(dialCode: string) {
  if (!dialCode) return null;
  return SORTED.find(c => dialCode.startsWith(c.code)) ?? null;
}

interface PhoneEntryProps {
  phone: string;
  setPhone: (val: string) => void;
  phoneError: string;
  setPhoneError: (val: string) => void;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PhoneEntry({ phone, setPhone, phoneError, setPhoneError, onBack, onSubmit }: PhoneEntryProps) {
  // dialCode is what the user types in the code field (digits only, no +)
  const [dialCode, setDialCode] = useState('234');

  const detected = detectCountry(dialCode);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setDialCode(val);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 11) {
      setPhone(val);
      setPhoneError('');
    }
  };

  return (
    <div className="w-full max-w-md min-h-screen bg-[#F6F5F0] p-6 flex flex-col justify-between">
      <div className="flex justify-between items-center pt-3 shrink-0">
        <button type="button" onClick={onBack} className="p-2 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition shadow-xs text-slate-700">
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>
        <span className="font-mono text-xs font-bold text-slate-500">Authentication</span>
        <div className="w-9" />
      </div>

      <div className="space-y-2 mt-8 mb-auto">
        <h1 className="font-display font-extrabold text-[#181C25] text-3xl tracking-tight leading-snug">What's your number?</h1>
        <p className="text-slate-400 text-xs leading-relaxed font-semibold">We'll send a 6-digit code to verify your account registration.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 mt-10 mb-auto">
        <div className="space-y-2">
          <label className="text-[10.5px] font-mono font-extrabold text-slate-500 uppercase tracking-widest block pl-1">Phone Number</label>
          <div className="w-full flex items-stretch bg-white border border-slate-200 rounded-xl shadow-inner shrink-0 focus-within:ring-2 focus-within:ring-[#EB9E27]/30 focus-within:border-[#EB9E27] transition">

            {/* Country code input with live flag */}
            <div className="flex items-center gap-1.5 border-r-[2px] border-slate-200 p-3">
              {/* Flag — shows detected flag or globe placeholder */}
              <span className="text-xl flex leading-none select-none bg-transparent font-mono font-bold text-slate-800 text-sm focus:outline-none">
                {detected ? detected.flag : '🌐'}
              </span>
              <span className="font-mono font-bold text-slate-400 text-sm">+</span>
              <input
                type="text"
                value={dialCode}
                onChange={handleCodeChange}
                maxLength={4}
                className="w-10 bg-transparent font-mono font-bold text-slate-800 text-sm focus:outline-none"
                aria-label="Country dial code"
              />
            </div>
            <p className="w-[2px] h-full bg-[#EB9E27]"></p>
            {/* Phone number */}
            <input
              type="text"
              placeholder="803 000 0000"
              value={phone}
              onChange={handlePhoneChange}
              id="phone-number-field"
              className="flex-1 p-3 text-sm outline-none bg-transparent rounded-xl transition"
            />
          </div>

          {/* Detected country name hint */}
          {detected && (
            <p className="text-[10.5px] font-mono text-slate-400 pl-1">
              {detected.flag} {detected.name} (+{dialCode})
            </p>
          )}
          {!detected && dialCode.length > 0 && (
            <p className="text-[10.5px] font-mono text-rose-400 pl-1">Unknown country code</p>
          )}
          {phoneError && <p className="text-xs text-rose-500 font-mono mt-1">{phoneError}</p>}
        </div>
      </form>

      <div className="space-y-5 pt-12 shrink-0 pb-6 text-center">
        <button
          onClick={onSubmit as unknown as React.MouseEventHandler}
          id="submit-phone-number"
          className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-semibold py-4.5 px-6 rounded-full shadow-lg shadow-[#EB9E27]/10 active:scale-99 transition flex items-center justify-center gap-2"
        >
          Send Code
        </button>
        <p className="text-[10.5px] leading-relaxed text-slate-400 font-medium max-w-[280px] mx-auto">
          By continuing, you agree to our{' '}
          <button type="button" onClick={() => alert("Terms of Service:\n\n1. Verification matches identity numbers.\n2. Escrow funds hold client securities securely.\n3. Abuse yields automatic system locks.")} className="font-bold text-[#EB9E27] underline">
            Terms of Service
          </button>
        </p>
      </div>
    </div>
  );
}
