'use client';
import React, { useState } from 'react';
import { Search, Wrench, Check } from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '../../types';

export default function AuthPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');

  return (
    <div className="w-full max-w-md min-h-screen max-h-[850px] bg-[#F6F5F0] p-6 flex flex-col gap-4 justify-between" id="screen-role-selection">
      {/* Logo segment */}
      <div className="flex justify-center pt-6 shrink-0">
        <img src="/logo.svg" alt="Plugr Logo" width={120} height={60} />
      </div>

      {/* Heading intro text layout */}
      <div className="space-y-3.5 text-center px-4 my-auto">
        <h1 className="font-display font-extrabold text-[#181C25] md:text-4xl text-2xl leading-tight tracking-tight">
          Pledging allegiance to your success.
        </h1>
        <p className="text-slate-500 font-sans text-sm font-medium leading-relaxed max-w-[280px] mx-auto text-balance">
          Join a community of verified professionals and trusted clients.
        </p>
      </div>

      {/* Dual Options Card selection widget */}
      <div className="space-y-4 mt-8 my-auto">
        {/* Card 1: Client */}
        <div
          onClick={() => setSelectedRole('client')}
          id="role-card-client"
          className={`bg-white rounded-[28px] md:p-5 p-3 border-2 transition-all cursor-pointer flex md:gap-4 gap-3 items-center relative ${
            selectedRole === 'client' 
              ? 'border-[#EB9E27] shadow-md shadow-[#EB9E27]/5' 
              : 'border-white hover:border-slate-100 shadow-sm'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-[#EB9E27] shrink-0">
            <Search className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#181C25] text-md leading-snug">I'm looking for a Plug</h3>
            <p className="text-slate-400 text-xs mt-1 leading-normal font-medium">Find verified electricians and plumbers.</p>
          </div>
          <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
            selectedRole === 'client' ? 'border-[#EB9E27] bg-[#EB9E27] text-white' : 'border-slate-200 bg-white'
          }`}>
            {selectedRole === 'client' && <Check className="h-3 w-3 stroke-[3.5]" />}
          </div>
        </div>

        {/* Card 2: Professional Plug */}
        <div
          onClick={() => setSelectedRole('plug')}
          id="role-card-plug"
          className={`bg-white rounded-[28px] md:p-5 p-3 border-2 transition-all cursor-pointer flex md:gap-4 gap-3 items-center relative ${
            selectedRole === 'plug' 
              ? 'border-[#EB9E27] shadow-md shadow-[#EB9E27]/5' 
              : 'border-white hover:border-slate-100 shadow-sm'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-800 shrink-0">
            <Wrench className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#181C25] text-md leading-snug">I am a Plug</h3>
            <p className="text-slate-400 text-xs mt-1 leading-normal font-medium">Build your professional identity and find work.</p>
          </div>
          <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
            selectedRole === 'plug' ? 'border-[#EB9E27] bg-[#EB9E27] text-white' : 'border-slate-200 bg-white'
          }`}>
            {selectedRole === 'plug' && <Check className="h-3 w-3 stroke-[3.5]" />}
          </div>
        </div>
      </div>

      {/* Continue button & Already have logged account footer */}
      <div className="space-y-4 pt-4 shrink-0 pb-6 text-center">
        <Link
          href={`/auth/${selectedRole}/phone?role=${selectedRole}`}
          id="continue-role-selection"
          className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-semibold py-4.5 px-6 rounded-full shadow-lg shadow-[#EB9E27]/10 active:scale-99 transition flex items-center justify-center gap-2"
        >
          Continue
        </Link>
        <p className="text-xs text-slate-400 font-medium">
          Already have an account?{' '}
          <Link
            href={`/auth/login/phone?role=${selectedRole}`}
            className="text-[#EB9E27] font-bold hover:underline"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
