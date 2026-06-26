'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import PhoneEntry from '../../../../components/auth/PhoneEntry';

function PhoneEntryContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const flow = params?.flow as string || 'signup';
  const role = searchParams.get('role') || 'client';

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handleBack = () => router.push('/auth');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 8) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    router.push(`/auth/${flow}/otp?phone=${phone}&role=${role}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F6F5F0]">
      <PhoneEntry
        phone={phone}
        setPhone={setPhone}
        phoneError={phoneError}
        setPhoneError={setPhoneError}
        onBack={handleBack}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default function PhoneEntryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F5F0] flex items-center justify-center font-mono text-xs text-slate-400">Loading auth gateway...</div>}>
      <PhoneEntryContent />
    </Suspense>
  );
}
