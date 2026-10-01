// src/app/app/_lib/entryRouting.ts
// Where should someone arriving from the landing page actually land?
//
// The returning-Plug check already existed, but it lived at the very END of the auth
// funnel (OtpScreen, after phone entry and OTP). So a Plug who had already onboarded
// still got the full landing -> role select -> phone -> OTP march before anything
// noticed they were a known user. The session was never the problem — it persists in
// localStorage across tabs and restarts — nothing was reading it at the entry points.
//
// There is no Supabase Auth in this build: no supabase-js, no cookies, no server
// session. Identity is the client-side record in plugAuth.ts, which is what the client
// flow is built on.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPlugId, isPlugOnboarded } from './plugAuth';

/** A Plug who finished onboarding and has a real row in the database. */
export function isReturningPlug(): boolean {
    return isPlugOnboarded() && Boolean(getPlugId());
}

/**
 * Resolve where an entry point should send someone.
 *
 * Only ONE case redirects now: a fully onboarded Plug goes to their dashboard instead of
 * being shown a signup form again.
 *
 * `strict` is retained for the call sites but no longer changes the outcome. It used to send
 * a partially-onboarded Plug back into /app/onboarding to resume the six-step wizard at its
 * saved step. That wizard is retired (see /app/onboarding/page.tsx) and signup is now a single
 * page with a single submit — there is no half-finished state to resume, and routing anyone to
 * the retired route would just bounce them through its redirect.
 */
export function resolvePlugEntry(base: string, strict: boolean): string | null {
    if (isReturningPlug()) return `${base}/plug`;
    return null;
}

/**
 * Redirect a known user past the entry screens.
 *
 * Returns `checking` — true until the decision is made. Callers should render nothing
 * (or a splash) while it's true, otherwise a returning user sees the role-select screen
 * flash before being bounced, which is exactly the "it sent me through onboarding
 * again" feeling this is meant to remove.
 *
 * localStorage is only readable client-side, so this necessarily runs after mount.
 */
export function usePlugEntryRedirect(base: string, strict: boolean): boolean {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const destination = resolvePlugEntry(base, strict);
        if (destination) {
            // replace, not push — the entry screen shouldn't sit in history for the back button.
            router.replace(destination);
            return;
        }
        setChecking(false);
    }, [base, strict, router]);

    return checking;
}
