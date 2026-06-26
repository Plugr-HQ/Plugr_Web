'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import NinVerification from '../../../../components/auth/NinVerification';
import { UserRole, TradeType } from '../../../../types';

function NinVerificationContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const flow = params?.flow as string || 'signup';
  const phone = searchParams.get('phone') || '';
  const role = (searchParams.get('role') as UserRole) || 'plug';
  
  // URL params mapping
  const paramFirstName = searchParams.get('firstName') || '';
  const paramLastName = searchParams.get('lastName') || '';
  const city = searchParams.get('city') || 'Lagos';
  const trade = (searchParams.get('trade') as TradeType) || 'electrician';
  const avatar = searchParams.get('avatar') || '';

  const [firstName, setFirstName] = useState(paramFirstName);
  const [lastName, setLastName] = useState(paramLastName);
  const [nin, setNin] = useState('');
  const [ninVerifying, setNinVerifying] = useState(false);
  const [ninVerified, setNinVerified] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    if (!ninVerified) {
      alert("Please enter a valid NIN and verify it.");
      return;
    }
    const query = new URLSearchParams({
      phone,
      role,
      firstName,
      lastName,
      city,
      trade,
      avatar,
      nin
    }).toString();
    router.push(`/auth/${flow}/liveness?${query}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F6F5F0]">
      <NinVerification
        selectedRole={role}
        trade={trade}
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        nin={nin}
        setNin={setNin}
        ninVerifying={ninVerifying}
        setNinVerifying={setNinVerifying}
        ninVerified={ninVerified}
        setNinVerified={setNinVerified}
        onBack={handleBack}
        onContinue={handleContinue}
      />
    </div>
  );
}

export default function NinVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F5F0] flex items-center justify-center font-mono text-xs text-slate-400">Loading identity check...</div>}>
      <NinVerificationContent />
    </Suspense>
  );
}
