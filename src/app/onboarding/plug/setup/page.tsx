'use client';
import React, { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import FlowProgress from '@/src/components/FlowProgress';

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  const role = searchParams.get('role') || 'plug';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('Lagos');
  const [trade, setTrade] = useState<'electrician' | 'plumber'>('electrician');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarDataUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleContinue = () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert('Please enter both your first and last name to proceed.');
      return;
    }

    // Build the plug's ID from their phone number (digits only)
    const cleanPhone = phone.replace(/\D/g, '');
    const plugId = `plug_${cleanPhone}`;

    // Save full profile to localStorage — photo stays OUT of the URL
    localStorage.setItem('plugProfile', JSON.stringify({
      id: plugId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      city,
      trade,
      phone,
      photoUrl: avatarDataUrl,
      role,
      ninVerified: false,
      livenessVerified: false,
      rating: 0,
      completedJobs: 0,
    }));

    // Navigate directly to the profile page
    router.push(`/p/${plugId}`);
  };

  return (
    <div className="w-full max-w-md min-h-screen bg-[#F6F5F0] p-6 flex flex-col justify-between overflow-y-auto">
      <div className="shrink-0 space-y-4">
        <div className="flex justify-between items-center pt-3">
          <button type="button" onClick={() => router.back()} className="p-2 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition shadow-xs text-slate-700">
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <span className="font-display font-bold text-sm text-slate-800">Set up your profile</span>
          <div className="w-9" />
        </div>
        <FlowProgress currentStepIndex={0} />
      </div>

      <div className="space-y-5 my-6">
        <div className="bg-white rounded-[24px] p-4 space-y-3 shadow-xs">
          <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase">YOUR NAME</span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">First name</label>
              <input type="text" placeholder="e.g. Tunde" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-[#EB9E27] font-medium transition" />
            </div>
            <div>
              <label className="text-slate-400 font-bold block mb-1">Last name</label>
              <input type="text" placeholder="e.g. Bakare" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-[#EB9E27] font-medium transition" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-4 space-y-3 shadow-xs">
          <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase">LOCATION</span>
          <select value={city} onChange={e => setCity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-[#EB9E27] font-semibold transition text-xs">
            <option value="Lagos">Lagos, Nigeria 🇳🇬</option>
            <option value="Abuja">Abuja, Nigeria 🇳🇬</option>
            <option value="Port Harcourt">Port Harcourt, Nigeria 🇳🇬</option>
            <option value="Ibadan">Ibadan, Nigeria 🇳🇬</option>
          </select>
        </div>

        <div className="bg-white rounded-[24px] p-4 space-y-3 shadow-xs">
          <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase">YOUR TRADE</span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {(['electrician', 'plumber'] as const).map(t => (
              <div key={t} onClick={() => setTrade(t)} className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 transition text-center ${trade === t ? 'border-[#EB9E27] bg-[#EB9E27]/5 text-amber-900' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                <span className="text-lg">{t === 'electrician' ? '⚡' : '💧'}</span>
                <span className="font-bold capitalize">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-4 shadow-xs">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Section header */}
          <p className="text-[11px] font-black text-[#EB9E27] tracking-widest uppercase mb-0.5">YOUR PHOTO</p>
          <p className="text-[12px] text-slate-600 font-medium mb-5">Clients will see this on your profile.</p>

          {/* Upload circle */}
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-[110px] h-[110px] rounded-full border-2 border-dashed border-slate-300 bg-white flex items-center justify-center hover:border-[#EB9E27] transition-colors group overflow-hidden"
              style={{ borderSpacing: '6px' }}
            >
              {avatarDataUrl ? (
                <>
                  <img
                    src={avatarDataUrl}
                    alt="Your photo"
                    className="w-full h-full object-cover rounded-full"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <span className="text-white text-[10px] font-semibold mt-1">Change</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1">
                  {/* Camera icon outline */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              )}
            </button>

            {/* Tap to upload label */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[13px] font-bold text-[#EB9E27] hover:underline transition-colors"
            >
              Tap to upload photo
            </button>

            {/* Helper text */}
            <p className="text-[11px] text-blue-400 font-medium -mt-2">
              Minimum 300x300px. JPG or PNG preferred.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 pb-6">
        <button type="button" onClick={handleContinue} className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-semibold py-4 px-6 rounded-full shadow-lg transition">
          Continue
        </button>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F5F0] flex items-center justify-center font-mono text-xs text-slate-400">Loading...</div>}>
      <div className="flex items-center justify-center min-h-screen bg-[#F6F5F0]">
        <SetupContent />
      </div>
    </Suspense>
  );
}
