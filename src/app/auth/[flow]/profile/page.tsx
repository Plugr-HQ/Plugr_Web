'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import ProfileSetup from '../../../../components/auth/ProfileSetup';
import { UserRole, TradeType } from '../../../../types';

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200"
];

function ProfileSetupContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const flow = params?.flow as string || 'signup';
  const phone = searchParams.get('phone') || '';
  const role = (searchParams.get('role') as UserRole) || 'client';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('Lagos');
  const [trade, setTrade] = useState<TradeType>('electrician');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);

  const handleBack = () => {
    router.push(`/auth/${flow}/otp?phone=${phone}&role=${role}`);
  };

  const handleContinue = () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert("Please enter both your first and last name to proceed.");
      return;
    }

    if (role === 'plug') {
      const query = new URLSearchParams({
        phone,
        role,
        firstName,
        lastName,
        city,
        trade,
        avatar: selectedAvatar
      }).toString();
      router.push(`/auth/${flow}/nin?${query}`);
    } else {
      // Save client profile in localStorage
      localStorage.setItem('clientProfile', JSON.stringify({
        firstName,
        lastName,
        city,
        phone,
        avatarUrl: selectedAvatar
      }));
      router.push('/client/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F6F5F0]">
      <ProfileSetup
        selectedRole={role}
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        city={city}
        setCity={setCity}
        trade={trade}
        setTrade={setTrade}
        selectedAvatar={selectedAvatar}
        setSelectedAvatar={setSelectedAvatar}
        onBack={handleBack}
        onContinue={handleContinue}
      />
    </div>
  );
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F6F5F0] flex items-center justify-center font-mono text-xs text-slate-400">Loading profile setup...</div>}>
      <ProfileSetupContent />
    </Suspense>
  );
}
