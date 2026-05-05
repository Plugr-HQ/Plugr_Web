'use client'

import { useState } from 'react'
import { Logo } from '@/src/components/Logo'
import { Button } from '@/src/components/Button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PhoneEntryPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (phoneNumber.length >= 10) {
      router.push('/auth/otp')
    }
  }

  return (
    <main className="flex flex-col min-h-screen bg-bone px-6 py-8">
      <div className="flex items-center justify-between mb-12">
        <button onClick={() => router.back()} className="text-midnight">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Logo variant="dark" iconOnly />
        <div className="w-6" /> {/* Spacer */}
      </div>

      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-3xl font-display text-midnight mb-2">What's your number?</h1>
        <p className="text-slate mb-8">We'll send a 4-digit code to verify your account.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex bg-white rounded-card border border-bone overflow-hidden h-14 items-center px-4 focus-within:ring-2 focus-within:ring-gold">
            <span className="text-midnight font-bold mr-3">+234</span>
            <input 
              type="tel" 
              placeholder="801 234 5678" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-grow h-full bg-white text-midnight font-sans text-lg focus:outline-none"
              autoFocus
            />
          </div>

          <Button type="submit" fullWidth disabled={phoneNumber.length < 10}>
            Send Code
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-slate px-4">
          By continuing, you agree to our <a href="#" className="text-midnight font-bold">Terms</a> and <a href="#" className="text-midnight font-bold">Privacy Policy</a>.
        </p>
      </div>
    </main>
  )
}
