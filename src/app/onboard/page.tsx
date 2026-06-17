"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft, Search, Wrench, Smartphone, Check, HelpCircle, Info, Lock,
  Camera, UploadCloud, X, Sparkles, ArrowRight, ShieldCheck, Key, RefreshCw, Eye
} from 'lucide-react';
import FlowProgress from '@/src/components/FlowProgress';
import LivenessScanner from '@/src/components/LivenessScanner';
import ClientDashboard from '@/src/components/ClientDashboard';
import PlugDashboard from '@/src/components/PlugDashboard';
import { FlowStep, UserRole, TradeType, PlugProfile } from './types';

// Array of premium professional client and plug predefined mock avatars
const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200"
];

export default function App() {
  const [step, setStep] = useState<FlowStep>('splash');
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');

  // Phone OTP Flow states
  const [phone, setPhone] = useState('');
  const [otpArray, setOtpArray] = useState<string[]>(['', '', '', '', '', '']);
  const [otpDemoCode] = useState('402685');
  const [showOtpHint, setShowOtpHint] = useState(false);
  const [resendCount, setResendCount] = useState(60);
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');

  // Profile setup states (Page 4)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('Lagos');
  const [trade, setTrade] = useState<TradeType>('electrician');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  // NIN Identity states (Page 5)
  const [nin, setNin] = useState('');
  const [ninVerifying, setNinVerifying] = useState(false);
  const [ninVerified, setNinVerified] = useState(false);
  const [showNinTooltip, setShowNinTooltip] = useState(false);

  // Liveness check state (Page 6)
  const [livenessDocVerified, setLivenessDocVerified] = useState(false);

  // Quick simulation drawer
  const [showBypassDrawer, setShowBypassDrawer] = useState(false);

  // Splash timeout
  useEffect(() => {
    if (step === 'splash') {
      const timer = setTimeout(() => {
        setStep('role_selection');
      }, 2500); // 1.0s float animation + 1.5s stay duration = 2.5 seconds total
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (step === 'verification_code' && resendCount > 0) {
      const timer = setInterval(() => {
        setResendCount(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, resendCount]);

  // Handle phone format
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 11) {
      setPhone(val);
      setPhoneError('');
    }
  };

  // OTP Array logic to auto advance active elements
  const handleOtpInput = (val: string, index: number) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpArray];
    newOtp[index] = cleanVal;
    setOtpArray(newOtp);
    setOtpError('');

    // Advance focus naturally
    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const submitPhoneForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 8) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    setStep('verification_code');
    // Display OTP Toast alert instantly to the tester!
    setShowOtpHint(true);
    // Focus first input
    setTimeout(() => {
      document.getElementById('otp-input-0')?.focus();
    }, 100);
  };

  const handleResendOtp = () => {
    setResendCount(60);
    alert(`🔑 Resent! Standard security code: ${otpDemoCode}`);
  };

  const submitOtpForm = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpArray.join('');
    if (entered === otpDemoCode || entered === '123456' || entered === '000000') {
      setStep('profile_setup');
    } else {
      setOtpError('Incorrect verification code. Try "402685" (demo code)');
    }
  };

  // Perform a simulated NIN verification against national databases
  const handleVerifyNin = () => {
    const cleanNin = nin.replace(/\s+/g, '');
    if (cleanNin.length < 11) {
      alert("NIN must consist of exactly 11 digits.");
      return;
    }

    setNinVerifying(true);
    setTimeout(() => {
      setNinVerifying(false);
      setNinVerified(true);
      // Auto fill mock names from NIMC database to delight the user!
      if (!firstName || !lastName) {
        if (selectedRole === 'plug') {
          // If electrician vs plumber
          if (trade === 'electrician') {
            setFirstName("Tunde");
            setLastName("Bakare");
          } else {
            setFirstName("Haruna");
            setLastName("Yusuf");
          }
        } else {
          setFirstName("Kunle");
          setLastName("Adebayo");
        }
      }
    }, 1500);
  };

  // Handle avatar changes
  const handleAvatarSelect = (url: string) => {
    setSelectedAvatar(url);
    setShowPhotoPicker(false);
  };

  // Quick switch direct demo dashboards bypass
  const bypassOnboarding = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'plug') {
      setFirstName("Amechi");
      setLastName("Aduba");
      setCity("Lagos");
      setTrade("electrician");
      setNin("8234 1982 748");
      setNinVerified(true);
      setLivenessDocVerified(true);
    } else {
      setFirstName("Joy");
      setLastName("Chibuzor");
      setCity("Abuja");
    }
    setStep('dashboard');
    setShowBypassDrawer(false);
  };

  const handleLogout = () => {
    // Reset back to roles selection
    setStep('role_selection');
    setPhone('');
    setOtpArray(['', '', '', '', '', '']);
    setFirstName('');
    setLastName('');
    setNin('');
    setNinVerified(false);
    setLivenessDocVerified(false);
  };

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#181C25] flex flex-col items-center justify-center font-sans tracking-normal relative selection:bg-[#EB9E27]/30" id="plugr-parent-container">

      {/* Dynamic Bypass Onboarding Utility Bar */}
      <div className="absolute top-3 right-3 z-30">
        <button
          onClick={() => setShowBypassDrawer(!showBypassDrawer)}
          id="toggle-developer-bypass-panel"
          className="flex items-center gap-1 bg-[#181C25] hover:bg-slate-800 text-white font-mono text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg transition active:scale-95 cursor-pointer border border-[#EB9E27]/30"
          title="Quickly bypass onboarding to inspect visual dashboards"
        >
          <Eye className="h-3 w-3 text-[#EB9E27]" /> Explore Demo Dashboards
        </button>
      </div>

      {/* Developer bypass quick selection drawer sheet */}
      {showBypassDrawer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 flex items-center justify-center p-4 animate-fade-in" id="developer-bypass-overlay-panel">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#EB9E27]/20 flex flex-col gap-4.5 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-150">
              <h2 className="font-display font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-[#EB9E27]" /> Instant Dashboard Access
              </h2>
              <button
                onClick={() => setShowBypassDrawer(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Bypass the identity verification forms to test the interactive client searches or the provider dashboard wallets instantly!
            </p>

            <div className="space-y-2">
              <button
                onClick={() => bypassOnboarding('client')}
                id="bypass-access-client"
                className="w-full bg-[#EB9E27]/10 hover:bg-[#EB9E27]/20 text-[#EB9E27] font-bold py-3 px-4 rounded-xl text-xs transition flex justify-between items-center"
              >
                <span>🔍 Inspect Client Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => bypassOnboarding('plug')}
                id="bypass-access-plug"
                className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-bold py-3 px-4 rounded-xl text-xs transition flex justify-between items-center shadow-md shadow-[#EB9E27]/15"
              >
                <span>🛠️ Inspect Plug Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <span className="text-[9px] font-mono text-center text-slate-400 uppercase tracking-widest block">
              Developed securely under standard specifications
            </span>
          </div>
        </div>
      )}

      {/* RENDER ACTIVE SCREEN ACCORDING TO STATE STEP */}

      {step === 'splash' && (
        <div className="w-full max-w-md h-screen max-h-[850px] bg-[#F6F5F0] flex flex-col items-center justify-center overflow-hidden" id="screen-splash">
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center"
          >
            <img src="/logo.svg" alt="Plugr Logo" width={500} height={500} />
          </motion.div>
        </div>
      )}

      {step === 'role_selection' && (
        <div className="w-full max-w-md min-h-screen max-h-[850px] bg-[#F6F5F0] p-6 flex flex-col justify-between" id="screen-role-selection">
          {/* Logo segment */}
          <div className="flex justify-center pt-6 shrink-0">
            <img src="/logo.svg" alt="Plugr Logo" width={500} height={500} />
          </div>

          {/* Heading intro text layout */}
          <div className="space-y-3.5 text-center px-4 my-auto">
            <h1 className="font-display font-extrabold text-[#181C25] text-4xl leading-tight tracking-tight">
              Pledging allegiance to your success.
            </h1>
            <p className="text-slate-500 font-sans text-sm font-medium leading-relaxed max-w-[280px] mx-auto text-balance">
              Join a community of verified professionals and trusted clients.
            </p>
          </div>

          {/* Dual Options Card selection widget */}
          <div className="space-y-4 my-auto">
            {/* Card 1: Client */}
            <div
              onClick={() => setSelectedRole('client')}
              id="role-card-client"
              className={`bg-white rounded-[28px] p-5 border-2 transition-all cursor-pointer flex gap-4 items-center relative ${selectedRole === 'client'
                ? 'border-[#EB9E27] shadow-md shadow-[#EB9E27]/5'
                : 'border-white hover:border-slate-100 shadow-sm'
                }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-[#EB9E27] shrink-0">
                <Search className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="font-bold text-[#181C25] text-md leading-snug">I'm looking for a Plug</h3>
                <p className="text-slate-400 text-xs mt-1 leading-normal font-medium">Find verified electricians and plumbers.</p>
              </div>
              <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedRole === 'client' ? 'border-[#EB9E27] bg-[#EB9E27] text-white' : 'border-slate-200 bg-white'
                }`}>
                {selectedRole === 'client' && <Check className="h-3 w-3 stroke-[3.5]" />}
              </div>
            </div>

            {/* Card 2: Professional Plug */}
            <div
              onClick={() => setSelectedRole('plug')}
              id="role-card-plug"
              className={`bg-white rounded-[28px] p-5 border-2 transition-all cursor-pointer flex gap-4 items-center relative ${selectedRole === 'plug'
                ? 'border-[#EB9E27] shadow-md shadow-[#EB9E27]/5'
                : 'border-white hover:border-slate-100 shadow-sm'
                }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-800 shrink-0">
                <Wrench className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="font-bold text-[#181C25] text-md leading-snug">I am a Plug</h3>
                <p className="text-slate-400 text-xs mt-1 leading-normal font-medium">Build your professional identity and find work.</p>
              </div>
              <div className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedRole === 'plug' ? 'border-[#EB9E27] bg-[#EB9E27] text-white' : 'border-slate-200 bg-white'
                }`}>
                {selectedRole === 'plug' && <Check className="h-3 w-3 stroke-[3.5]" />}
              </div>
            </div>
          </div>

          {/* Continue button & Already have logged account footer */}
          <div className="space-y-4 pt-4 shrink-0 pb-6 text-center">
            <button
              onClick={() => setStep('phone_entry')}
              id="continue-role-selection"
              className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-semibold py-4.5 px-6 rounded-full shadow-lg shadow-[#EB9E27]/10 active:scale-99 transition flex items-center justify-center gap-2"
            >
              Continue
            </button>
            <p className="text-xs text-slate-400 font-medium">
              Already have an account?{' '}
              <button
                onClick={() => bypassOnboarding(selectedRole)}
                className="text-[#EB9E27] font-bold hover:underline"
              >
                Log In
              </button>
            </p>
          </div>
        </div>
      )}

      {step === 'phone_entry' && (
        <div className="w-full max-w-md min-h-screen max-h-[850px] bg-[#F6F5F0] p-6 flex flex-col justify-between" id="screen-phone-entry">
          {/* Header row details */}
          <div className="flex justify-between items-center pt-3 shrink-0">
            <button
              onClick={() => setStep('role_selection')}
              id="back-phone-entry"
              className="p-2 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition shadow-xs text-slate-700"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="font-mono text-xs font-bold text-slate-500">Authentication</span>
            <div className="w-9" /> {/* Spacer */}
          </div>

          {/* Main title layout */}
          <div className="space-y-2 mt-8 mb-auto">
            <h1 className="font-display font-extrabold text-[#181C25] text-3xl tracking-tight leading-snug">
              What's your number?
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed font-semibold">
              We'll send a 6-digit code to verify your account registration.
            </p>
          </div>

          {/* Interactive Phone Form area */}
          <form onSubmit={submitPhoneForm} className="space-y-6 my-auto">
            <div className="space-y-2">
              <label className="text-[10.5px] font-mono font-extrabold text-slate-500 uppercase tracking-widest block pl-1">
                Phone Number
              </label>

              <div className="flex gap-2">
                {/* Simulated Nigeria +234 Dropdown selector */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl px-4 py-4 text-slate-700 font-mono font-bold text-sm shadow-inner shrink-0 select-none">
                  <span>🇳🇬</span>
                  <span>+234</span>
                </div>

                {/* Actual layout input box */}
                <input
                  type="text"
                  placeholder="803 000 0000"
                  value={phone}
                  onChange={handlePhoneChange}
                  id="phone-number-field"
                  className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 font-mono font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#EB9E27]/30 shadow-inner text-sm"
                  required
                />
              </div>
              {phoneError && <p className="text-xs text-rose-500 font-mono mt-1">{phoneError}</p>}
            </div>
          </form>

          {/* Submit action panel and guidelines agreement footer links */}
          <div className="space-y-5 pt-4 shrink-0 pb-6 text-center">
            {/* Display code clue floating banner for ease of use in visual reviews */}
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 flex items-center justify-between text-left text-xs text-amber-800 font-sans shadow-xs">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-[#EB9E27]" />
                <div>
                  <h4 className="font-bold">Verified Tester Gateway</h4>
                  <p className="text-[10.5px] text-amber-700">Code generates automatically after submit</p>
                </div>
              </div>
            </div>

            <button
              onClick={submitPhoneForm}
              id="submit-phone-number"
              className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-semibold py-4.5 px-6 rounded-full shadow-lg shadow-[#EB9E27]/10 active:scale-99 transition flex items-center justify-center gap-2"
            >
              Send Code
            </button>

            <p className="text-[10.5px] leading-relaxed text-slate-400 font-medium max-w-[280px] mx-auto text-balance">
              By continuing, you agree to our{' '}
              <button
                onClick={() => alert("Terms of Service:\n\n1. Verification matches identity numbers.\n2. Escrow funds hold client securities securely.\n3. Abuse yields automatic system locks.")}
                className="font-bold text-[#EB9E27] underline"
              >
                Terms of Service
              </button>
            </p>
          </div>
        </div>
      )}

      {step === 'verification_code' && (
        <div className="w-full max-w-md min-h-screen max-h-[850px] bg-[#F6F5F0] p-6 flex flex-col justify-between" id="screen-otp-code">
          {/* Header detail menu */}
          <div className="flex justify-between items-center pt-3 shrink-0">
            <button
              onClick={() => setStep('phone_entry')}
              id="back-otp-code"
              className="p-2 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition shadow-xs text-slate-700"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="font-mono text-xs font-bold text-slate-500">Verification</span>
            <div className="w-9" /> {/* Spacer */}
          </div>

          {/* Header main instructions */}
          <div className="space-y-2 mt-8 mb-auto">
            <h1 className="font-display font-extrabold text-[#181C25] text-3xl tracking-tight leading-snug">
              Verify your phone
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed font-semibold">
              Enter the 6-digit code we sent to{' '}
              <span className="font-mono text-[#181C25] font-bold">
                +234 {phone || '803 000 0000'}
              </span>.
            </p>
          </div>

          {/* Digit Inputs grid area */}
          <form onSubmit={submitOtpForm} className="space-y-8 my-auto flex flex-col items-center">

            {/* Visual alert toast providing code clue for the tester */}
            {showOtpHint && (
              <div className="bg-amber-100/50 border border-[#EB9E27]/30 text-amber-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs w-full mb-2.5 animate-bounce">
                <span className="font-medium font-sans">🔑 Simulated verification code is: </span>
                <span className="font-mono font-extrabold tracking-widest text-md bg-white border border-[#EB9E27]/25 px-2.5 py-1 rounded-lg text-[#EB9E27]">
                  {otpDemoCode}
                </span>
              </div>
            )}

            <div className="flex gap-2 justify-between w-full max-w-sm">
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
                  className="w-12 h-12 rounded-full bg-white border border-slate-200 focus:border-[#EB9E27] focus:ring-2 focus:ring-[#EB9E27]/30 text-center font-mono font-extrabold text-lg text-slate-800 focus:outline-none transition shadow-inner"
                />
              ))}
            </div>

            {otpError && <p className="text-xs text-rose-500 font-mono mt-2">{otpError}</p>}

            <p className="text-xs text-slate-400 font-medium">
              Didn't receive the code?{' '}
              {resendCount > 0 ? (
                <span className="font-mono text-[#EB9E27] font-semibold">Resend in {resendCount}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-[#EB9E27] font-bold hover:underline"
                >
                  Resend
                </button>
              )}
            </p>
          </form>

          {/* Submit Action widget */}
          <div className="space-y-4 pt-4 shrink-0 pb-6 text-center">
            <button
              onClick={submitOtpForm}
              id="submit-otp-verification"
              className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-semibold py-4.5 px-6 rounded-full shadow-lg shadow-[#EB9E27]/10 active:scale-99 transition flex items-center justify-center gap-2"
            >
              Verify
            </button>
          </div>
        </div>
      )}

      {step === 'profile_setup' && (
        <div className="w-full max-w-md min-h-screen max-h-[850px] bg-[#F6F5F0] p-6 flex flex-col justify-between overflow-y-auto" id="screen-profile-setup">

          {/* Progress row setup header */}
          <div className="shrink-0 space-y-4">
            <div className="flex justify-between items-center pt-3">
              <button
                onClick={() => setStep('verification_code')}
                className="p-2 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition shadow-xs text-slate-700"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <span className="font-display font-bold text-sm text-slate-800">Set up your profile</span>
              <div className="w-9" />
            </div>

            {/* Step progress bar matching Page 4 */}
            <FlowProgress currentStepIndex={0} />
          </div>

          <div className="space-y-5 my-6">

            {/* Card segment 1: Name Details */}
            <div className="bg-white rounded-[24px] p-4.5 border border-slate-150 space-y-3 shadow-xs">
              <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase">
                YOUR NAME
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">First name</label>
                  <input
                    type="text"
                    placeholder="e.g. Joy"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    id="profile-firstname-field"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-[#EB9E27] font-medium transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Last name</label>
                  <input
                    type="text"
                    placeholder="e.g. Chibuzor"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    id="profile-lastname-field"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-[#EB9E27] font-medium transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Card segment 2: City Location details */}
            <div className="bg-white rounded-[24px] p-4.5 border border-slate-150 space-y-3 shadow-xs">
              <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase">
                LOCATION
              </span>
              <div className="text-xs">
                <label className="text-slate-400 font-bold block mb-1">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  id="profile-city-select"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:bg-white focus:outline-none focus:border-[#EB9E27] font-semibold transition"
                >
                  <option value="Lagos">Lagos, Nigeria 🇳🇬</option>
                  <option value="Abuja">Abuja, Nigeria 🇳🇬</option>
                  <option value="Port Harcourt">Port Harcourt, Nigeria 🇳🇬</option>
                  <option value="Ibadan">Ibadan, Nigeria 🇳🇬</option>
                </select>
              </div>
            </div>

            {/* Card segment 3: Professional selection layout if selected role is plug */}
            {selectedRole === 'plug' && (
              <div className="bg-white rounded-[24px] p-4.5 border border-slate-150 space-y-3 shadow-xs">
                <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase">
                  YOUR TRADE
                </span>
                <p className="text-xs text-slate-500 font-medium pb-1">What is your primary skill?</p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Option Plumber */}
                  <div
                    onClick={() => setTrade('electrician')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 transition text-center ${trade === 'electrician'
                      ? 'border-[#EB9E27] bg-[#EB9E27]/5 text-amber-900'
                      : 'border-slate-100 bg-slate-50 text-slate-500'
                      }`}
                  >
                    <span className="text-lg">⚡</span>
                    <span className="font-bold">Electrician</span>
                  </div>

                  <div
                    onClick={() => setTrade('plumber')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 transition text-center ${trade === 'plumber'
                      ? 'border-[#EB9E27] bg-[#EB9E27]/5 text-amber-900'
                      : 'border-slate-100 bg-slate-50 text-slate-500'
                      }`}
                  >
                    <span className="text-lg">💧</span>
                    <span className="font-bold">Plumber</span>
                  </div>
                </div>
              </div>
            )}

            {/* Card segment 4: User custom headshot matcher */}
            <div className="bg-white rounded-[24px] p-4.5 border border-slate-150 space-y-3.5 shadow-xs">
              <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase">
                YOUR PHOTO
              </span>
              <p className="text-xs text-slate-500 font-medium">Clients will see this on your profile.</p>

              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                  id="trigger-avatar-picker"
                  className="w-24 h-24 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 text-slate-400 hover:border-[#EB9E27] hover:bg-amber-50/10 transition relative overflow-hidden shrink-0 group"
                >
                  {selectedAvatar ? (
                    <>
                      <img
                        src={selectedAvatar}
                        alt="Selected Avatar Profile"
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-[#181C25]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                        <Camera className="h-5 w-5" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center flex flex-col items-center justify-center gap-1">
                      <UploadCloud className="h-5 w-5 text-slate-400" />
                      <span className="text-[10px] font-mono">Tap upload</span>
                    </div>
                  )}
                </button>
                <span className="text-[10px] font-mono text-slate-400">Minimum 300x300px. JPG or PNG preferred.</span>

                {/* Grid of easy click selected photo avatars to custom pick */}
                {showPhotoPicker && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 w-full animate-slide-up">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Vetted Professionals Headshots</p>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_AVATARS.map((url, i) => (
                        <div
                          key={i}
                          onClick={() => handleAvatarSelect(url)}
                          className={`w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-2 transition ${selectedAvatar === url ? 'border-[#EB9E27] scale-105 shadow-md' : 'border-slate-200 opacity-80'
                            }`}
                        >
                          <img src={url} alt="Profile option" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Continue form processor button */}
          <div className="space-y-4 pt-2 shrink-0 pb-6 text-center">
            <button
              onClick={() => {
                if (!firstName || !lastName) {
                  alert("Please enter both your first and last name to proceed.");
                  return;
                }
                if (selectedRole === 'plug') {
                  setStep('nin_verification');
                } else {
                  setStep('dashboard');
                }
              }}
              id="continue-profile-setup"
              className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-semibold py-4.5 px-6 rounded-full shadow-lg shadow-[#EB9E27]/10 active:scale-99 transition flex items-center justify-center gap-2"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'nin_verification' && (
        <div className="w-full max-w-md min-h-screen max-h-[850px] bg-[#F6F5F0] p-6 flex flex-col justify-between overflow-y-auto" id="screen-nin-verify">

          {/* Progress tracking layout menu */}
          <div className="shrink-0 space-y-4">
            <div className="flex justify-between items-center pt-3">
              <button
                onClick={() => setStep('profile_setup')}
                className="p-2 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition shadow-xs text-slate-700"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <span className="font-display font-bold text-sm text-slate-800">Verify your identity</span>

              <button
                onClick={() => alert("Verification is performed against NIN records to secure the database. Only verified applicants can list profiles on Plugr.")}
                className="text-xs font-bold text-[#EB9E27] font-mono hover:underline uppercase"
              >
                Help
              </button>
            </div>

            <FlowProgress currentStepIndex={1} />
          </div>

          {/* NIN Form module layout */}
          <div className="space-y-5 my-auto">
            <div className="bg-white rounded-[28px] p-5.5 border border-slate-150 space-y-4 shadow-sm" id="nin-verification-card">
              <div className="flex justify-between items-center text-[10px] font-mono font-extrabold text-[#EB9E27]">
                <span>NIN ENTRY</span>
                <button
                  onClick={() => setShowNinTooltip(!showNinTooltip)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  type="button"
                >
                  <Info className="h-4 w-4 text-[#EB9E27]" />
                </button>
              </div>

              {showNinTooltip && (
                <div className="bg-amber-50 text-amber-900 rounded-xl p-3 border border-amber-100 text-xs text-left leading-normal animate-slide-up">
                  Enter your 11-digit National Identity Number. We use this to verify match guidelines directly under local regulations.
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-400 text-xs font-bold block mb-1">National Identity Number</label>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="0000 0000 000"
                  value={nin}
                  onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                  id="nin-identity-input"
                  className="w-full bg-slate-50 border border-slate-250 rounded-2xl px-4 py-3.5 font-mono font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:border-[#EB9E27] tracking-widest text-sm text-center shadow-inner"
                />
              </div>

              {ninVerified ? (
                <div className="bg-emerald-50 text-emerald-800 border-2 border-emerald-100 rounded-2xl p-4 flex items-center justify-center gap-2 animate-fade-in text-xs font-sans font-bold">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 fill-emerald-500/10" /> VETTED matched successfully!
                </div>
              ) : (
                <button
                  onClick={handleVerifyNin}
                  id="trigger-nin-verification"
                  className="w-full bg-[#EB9E27] hover:bg-[#D68B1D] text-white font-bold py-3 px-5 rounded-full transition shadow-sm hover:shadow active:scale-98 text-xs flex items-center justify-center gap-1.5"
                  disabled={ninVerifying}
                >
                  {ninVerifying ? (
                    <>
                      <RefreshCw className="h-4.5 w-4.5 animate-spin" /> Matching records...
                    </>
                  ) : (
                    "Verify NIN"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Continue footer actions */}
          <div className="space-y-4 pt-2 shrink-0 pb-6 text-center">
            {/* Tester Gateway Notification block for NIN speed runs */}
            {!ninVerified && (
              <p className="text-[10px] font-mono text-slate-400">
                Tip: Enter any mock 11 digits and tap "Verify NIN" to auto check match.
              </p>
            )}

            <button
              onClick={() => {
                if (!ninVerified) {
                  alert("Please verify your identity with NIMC via National Identity Number to continue.");
                  return;
                }
                setStep('liveness_check');
              }}
              id="continue-nin-verify"
              className={`w-full font-semibold py-4.5 px-6 rounded-full shadow-lg transition flex items-center justify-center gap-2 ${ninVerified
                ? 'bg-[#EB9E27] hover:bg-[#D68B1D] text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-90'
                }`}
              disabled={!ninVerified}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'liveness_check' && (
        <div className="w-full max-w-md min-h-screen max-h-[850px] bg-[#F6F5F0] p-6 flex flex-col justify-between overflow-y-auto" id="screen-biometrics">

          {/* Header row tracking details */}
          <div className="shrink-0 space-y-4">
            <div className="flex justify-between items-center pt-3">
              <button
                onClick={() => setStep('nin_verification')}
                className="p-2 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition shadow-xs text-slate-700"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <span className="font-display font-bold text-sm text-slate-800">Verify your identity</span>

              <button
                onClick={() => alert("Liveness scanners perform high density neural mapping to identify genuine live presence.")}
                className="text-xs font-bold text-[#EB9E27] font-mono hover:underline uppercase"
              >
                Help
              </button>
            </div>

            <FlowProgress currentStepIndex={2} />
          </div>

          <div className="space-y-4 my-auto w-full">
            <div className="bg-white rounded-[28px] p-5.5 border border-slate-150 space-y-4 shadow-sm" id="liveness-scanning-card">
              <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider block uppercase pl-1">
                LIVENESS CHECK
              </span>

              {/* Liveness Scanner Camera Simulator Component */}
              <LivenessScanner onSuccess={() => setLivenessDocVerified(true)} />
            </div>
          </div>

          {/* Settle Onboarding and login to Dashboards */}
          <div className="space-y-4 pt-2 shrink-0 pb-6 text-center">
            <button
              onClick={() => {
                if (!livenessDocVerified) {
                  alert("Please position your face properly, click 'Start Liveness Scan' and complete identity check.");
                  return;
                }
                setStep('dashboard');
              }}
              id="finalize-onboarding-biometrics"
              className={`w-full font-semibold py-4.5 px-6 rounded-full shadow-lg transition flex items-center justify-center gap-2 ${livenessDocVerified
                ? 'bg-[#EB9E27] hover:bg-[#D68B1D] text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-90'
                }`}
              disabled={!livenessDocVerified}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'dashboard' && (
        selectedRole === 'client' ? (
          <ClientDashboard
            clientName={`${firstName || 'Joy'} ${lastName || 'Chibuzor'}`}
            clientCity={city}
            clientPhone={phone || '0803 111 2222'}
            avatarUrl={selectedAvatar}
            onLogout={handleLogout}
          />
        ) : (
          <PlugDashboard
            profile={{
              firstName: firstName || 'Chidi',
              lastName: lastName || 'Okonkwo',
              city: city,
              trade: trade,
              nin: nin || '1234 5678 901',
              ninVerified: ninVerified,
              livenessVerified: livenessDocVerified,
              phone: phone || '+234 812 333 4444',
              rating: 4.9,
              completedJobs: 12,
              photoUrl: selectedAvatar
            }}
            onLogout={handleLogout}
          />
        )
      )}

    </div>
  );
}
