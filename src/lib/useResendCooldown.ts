// src/lib/useResendCooldown.ts
// The "you can ask for another code in N seconds" timer, shared by every OTP screen.
//
// This already existed inline in the Plug login (src/app/app/auth/login/page.tsx) as a
// resendIn/setResendIn pair plus a ticking effect. Admin sign-in needed the same thing, so it is
// lifted here rather than copied — two hand-rolled countdowns would eventually disagree on the
// window, or one would forget to restart on the initial send.
//
// It owns the TIMER only, not the button: the Plug login shows "Resend code in 30s" and swaps to a
// link, admin shows a disabled button counting "Resend in 0:30". Both are the same clock.

'use client';

import { useCallback, useEffect, useState } from 'react';

export const DEFAULT_RESEND_COOLDOWN_SECONDS = 30;

export function useResendCooldown(seconds: number = DEFAULT_RESEND_COOLDOWN_SECONDS) {
  // Starts at 0 = "not counting". Callers call start() when a code actually goes out, so the
  // cooldown is tied to a real send rather than to the screen mounting.
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setTimeout(() => setRemaining((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);
  const reset = useCallback(() => setRemaining(0), []);

  return { remaining, active: remaining > 0, start, reset };
}

/** m:ss — "0:30", "0:09". The countdown is short, so minutes are never padded. */
export function formatCooldown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
