'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

function OtpVerificationContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const flow = params?.flow as string || 'signup';
  const phone = searchParams.get('phone') || '';
  const role = searchParams.get('role') || 'client';

  const [otpArray, setOtpArray] = useState<string[]>(['', '', '', '', '', '']);
  const [otpDemoCode] = useState('402685');
  const [showOtpHint] = useState(true);
  const [resendCount, setResendCount] = useState(60);
  const [otpError, setOtpError] = useState('');

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCount > 0) {
      const timer = setInterval(() => {
        setResendCount(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCount]);

  const handleBack = () => {
    router.push(`/auth/${flow}/phone?phone=${phone}&role=${role}`);
  };

  const handleResendOtp = () => {
    setResendCount(60);
    alert(`🔑 Resent! Standard security code: ${otpDemoCode}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpArray.join('');
    if (entered === otpDemoCode || entered === '123456' || entered === '000000') {
      router.push(`/onboarding/plug/setup?phone=${phone}&role=${role}`);
    } else {
      setOtpError('Incorrect verification code. Try "402685" (demo code)');
    }
  };

  const handleOtpInput = (val: string, index: number) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpArray];
    newOtp[index] = cleanVal;
    setOtpArray(newOtp);
    setOtpError('');
    if (cleanVal && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F6F5F0]">
      <div className="w-full max-w-md min-h-screen max-h-[850px] bg-[#F6F5F0] p-6 flex flex-col justify-between">
        <div className="flex justify-between items-center pt-3 shrink-0">
          <button type="button" onClick={handleBack} className="p-2 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition shadow-xs text-slate-700">
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <span className="font-mono text-xs font-bold text-slate-500">Verification</span>
          <div className="w-9" />
        </div>

        <div className="space-y-2 mt-8 mb-auto">
          <h1 className="font-display font-extrabold text-[#181C25] text-3xl tracking-tight leading-snug">Verify your phone</h1>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            Enter the 6-digit code we sent to{' '}
            <span className="font-mono text-[#181C25] font-bold">+234 {phone || '803 000 0000'}</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 my-auto flex flex-col items-center">
          {showOtpHint && (
            <div className="bg-amber-100/50 border border-[#EB9E27]/30 text-amber-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs w-full mb-2.5 animate-bounce">
              <span className="font-medium font-sans">🔑 Simulated verification code is: </span>
              <span className="font-mono font-extrabold tracking-widest text-md bg-white border border-[#EB9E27]/25 px-2.5 py-1 rounded-lg text-[#EB9E27]">{otpDemoCode}</span>
            </div>
          )}

          <div className="flex gap-2 justify-between w-full mt-8 max-w-sm">
            {otpArray.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                maxLength={1}
                value={digit}
                placeholder="•"
                onChange={(e) => handleOtpInput(e.target.value, idx)}
                onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                className="w-10 h-12 rounded-full bg-white border border-slate-200 focus:border-[#EB9E27] focus:ring-2 focus:ring-[#EB9E27]/30 text-center font-mono font-extrabold text-lg text-slate-800 focus:outline-none transition shadow-inner"
              />
            ))}
          </div>

          {otpError && <p className="text-xs text-rose-500 font-mono mt-2">{otpError}</p>}

          <p className="text-xs text-slate-400 font-medium">
            Didn't receive the code?{' '}
            {resendCount > 0 ? (
              <span className="font-mono text-[#EB9E27] font-semibold">Resend in {resendCount}s</span>
            ) : (
              <button type="button" onClick={handleResendOtp} className="text-[#EB9E27] font-bold hover:underline">Resend</button>
            )}
          </p>
        </form>

        <div className="space-y-4 pt-4 shrink-0 pb-6 text-center">
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-semibold py-4.5 px-6 rounded-full shadow-lg shadow-[#EB9E27]/10 active:scale-99 transition flex items-center justify-center gap-2"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OtpVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F5F0] flex items-center justify-center font-mono text-xs text-slate-400">Loading verification...</div>}>
      <OtpVerificationContent />
    </Suspense>
  );
}
