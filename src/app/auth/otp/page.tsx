'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/src/components/Button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OtpVerificationPage() {
  const [otp, setOtp] = useState(['', '', '', ''])
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const router = useRouter()

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1)

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Move to next input
    if (value !== '' && index < 3) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const isComplete = otp.every(digit => digit !== '')

  const handleVerify = () => {
    if (isComplete) {
      // In a real app, verify OTP here
      // For now, redirect to onboarding based on role (mocked)
      const role = 'plug' // This would be fetched from state or query
      if (role === 'plug') {
        router.push('/onboarding/plug/setup')
      } else {
        router.push('/onboarding/client/setup')
      }
    }
  }

  return (
    <main className="flex flex-col min-h-screen bg-bone px-6 py-8">
      <div className="flex items-center justify-between mb-12">
        <button onClick={() => router.back()} className="text-midnight">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <img src="/logo.svg" alt="Plugr" className='h-11 w-48 bg-white rounded-md' />
        <div className="w-6" />
      </div>

      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-3xl font-display text-midnight mb-2">Verify it's you</h1>
        <p className="text-slate mb-8">Enter the 4-digit code sent to your phone.</p>

        <div className="flex justify-between gap-4 mb-8">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="number"
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-full h-16 bg-white rounded-card border border-bone text-center text-2xl font-display font-bold text-midnight focus:outline-none focus:ring-2 focus:ring-gold"
              autoFocus={i === 0}
            />
          ))}
        </div>

        <Button onClick={handleVerify} fullWidth disabled={!isComplete}>
          Verify
        </Button>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate mb-2">Didn't receive code?</p>
          <button className="text-gold font-bold text-sm">Resend in 0:45</button>
        </div>
      </div>
    </main>
  )
}
