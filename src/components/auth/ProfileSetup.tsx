'use client';
import React, { useState, useRef } from 'react';
import { ChevronLeft, Camera, UploadCloud, X } from 'lucide-react';
import { UserRole, TradeType } from '../../types';
import FlowProgress from '../FlowProgress';

interface ProfileSetupProps {
  selectedRole: UserRole;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  trade: TradeType;
  setTrade: (v: TradeType) => void;
  selectedAvatar: string;
  setSelectedAvatar: (v: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

const MAX_SIZE = 400; // square crop target px

function compressToSquare(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = MAX_SIZE;
      canvas.height = MAX_SIZE;
      const ctx = canvas.getContext('2d')!;
      // Centre-crop
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, MAX_SIZE, MAX_SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ProfileSetup({
  selectedRole, firstName, setFirstName, lastName, setLastName,
  city, setCity, trade, setTrade, selectedAvatar, setSelectedAvatar,
  onBack, onContinue,
}: ProfileSetupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WEBP).');
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await compressToSquare(file);
      setSelectedAvatar(dataUrl);
    } catch {
      alert('Could not process image. Please try another file.');
    } finally {
      setUploading(false);
      // reset so same file can be re-selected
      e.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-md min-h-screen bg-[#F6F5F0] p-6 flex flex-col justify-between overflow-y-auto">
      <div className="shrink-0 space-y-4">
        <div className="flex justify-between items-center pt-3">
          <button type="button" onClick={onBack} className="p-2 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition shadow-xs text-slate-700">
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <span className="font-display font-bold text-sm text-slate-800">Set up your profile</span>
          <div className="w-9" />
        </div>
        <FlowProgress currentStepIndex={0} />
      </div>

      <div className="space-y-5 my-6">
        {/* Name */}
        <div className="bg-white rounded-[24px] p-4.5 space-y-3 shadow-xs">
          <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase">YOUR NAME</span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-400 font-bold block mb-1">First name</label>
              <input type="text" placeholder="e.g. Joy" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-[#EB9E27] font-medium transition" />
            </div>
            <div>
              <label className="text-slate-400 font-bold block mb-1">Last name</label>
              <input type="text" placeholder="e.g. Chibuzor" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-[#EB9E27] font-medium transition" />
            </div>
          </div>
        </div>

        {/* City */}
        <div className="bg-white rounded-[24px] p-4.5 space-y-3 shadow-xs">
          <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase">LOCATION</span>
          <div className="text-xs">
            <label className="text-slate-400 font-bold block mb-1">City</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-[#EB9E27] font-semibold transition">
              <option value="Lagos">Lagos, Nigeria 🇳🇬</option>
              <option value="Abuja">Abuja, Nigeria 🇳🇬</option>
              <option value="Port Harcourt">Port Harcourt, Nigeria 🇳🇬</option>
              <option value="Ibadan">Ibadan, Nigeria 🇳🇬</option>
            </select>
          </div>
        </div>

        {/* Trade (plugs only) */}
        {selectedRole === 'plug' && (
          <div className="bg-white rounded-[24px] p-4.5 space-y-3 shadow-xs">
            <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase">YOUR TRADE</span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div onClick={() => setTrade('electrician')} className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 transition text-center ${trade === 'electrician' ? 'border-[#EB9E27] bg-[#EB9E27]/5 text-amber-900' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                <span className="text-lg">⚡</span>
                <span className="font-bold">Electrician</span>
              </div>
              <div onClick={() => setTrade('plumber')} className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 transition text-center ${trade === 'plumber' ? 'border-[#EB9E27] bg-[#EB9E27]/5 text-amber-900' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                <span className="text-lg">💧</span>
                <span className="font-bold">Plumber</span>
              </div>
            </div>
          </div>
        )}

        {/* Photo upload */}
        <div className="bg-white rounded-[24px] p-4.5 space-y-3.5 shadow-xs">
          <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase">YOUR PHOTO</span>
          <p className="text-xs text-slate-500 font-medium">Upload a clear headshot — it'll be cropped to a square automatically.</p>

          <div className="flex items-center gap-4">
            {/* Square preview */}
            <div className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center group">
              {selectedAvatar ? (
                <>
                  <img src={selectedAvatar} alt="Profile preview" className="w-full h-full object-cover" />
                  {/* remove button */}
                  <button
                    type="button"
                    onClick={() => setSelectedAvatar('')}
                    className="absolute top-1 right-1 w-5 h-5 bg-[#181C25]/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : uploading ? (
                <div className="text-center flex flex-col items-center gap-1">
                  <div className="w-5 h-5 border-2 border-[#EB9E27] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="text-center flex flex-col items-center gap-1 text-slate-400">
                  <UploadCloud className="h-5 w-5" />
                </div>
              )}
            </div>

            {/* Upload button */}
            <div className="flex flex-col gap-2 flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-[#EB9E27]/10 hover:bg-[#EB9E27]/20 text-[#EB9E27] font-bold text-xs px-4 py-2.5 rounded-xl transition w-fit"
              >
                <Camera className="h-4 w-4" />
                {selectedAvatar ? 'Change Photo' : 'Upload Photo'}
              </button>
              <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                JPG, PNG or WEBP · Auto-cropped to square · Max 5 MB
              </p>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="space-y-4 pt-2 shrink-0 pb-6 text-center">
        <button onClick={onContinue} className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-semibold py-4.5 px-6 rounded-full shadow-lg shadow-[#EB9E27]/10 active:scale-99 transition flex items-center justify-center gap-2">
          Continue
        </button>
      </div>
    </div>
  );
}
