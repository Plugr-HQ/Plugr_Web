// src/hooks/useBankList.ts
// Shared, session-cached bank list for the payout-account picker. Filtered to only banks
// present in BANK_LOGOS (bank-logos.ts), with name/logoUrl always overridden from that
// manifest rather than trusted from the live provider (see the "OPay 3" mislabel this fixes
// in bank-logos.ts's source comments/history).
//
// Both SettingsScreen's PayoutSection and WalletScreen's BankSetup call this — first caller
// in a session triggers api.verification.getBanks(), everyone after reuses the cached result.
// NOTE: adjust the bank-logos import path if it lives somewhere else in your repo.
'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/src/lib/api';
import { BANK_LOGOS } from '@/src/lib/bank-logos';
import type { BankOption } from '@/src/components/plug/BankSelect';

const FALLBACK_BANKS: BankOption[] = Object.values(BANK_LOGOS).map((b) => ({
    code: b.code,
    name: b.name,
    logoUrl: b.logo,
}));

type BankListResult = { list: BankOption[]; usingFallback: boolean };

// Module-level cache — persists across component mounts/unmounts within the same page session
// (cleared on a full reload, which is fine: a stale bank list for one session is harmless).
let cachedBanks: BankListResult | null = null;
let inFlight: Promise<BankListResult> | null = null;

async function fetchBanks(): Promise<BankListResult> {
    const known = new Set(Object.keys(BANK_LOGOS));
    try {
        const list = await api.verification.getBanks();
        const filtered = (list ?? [])
            .filter((b) => known.has(b.code))
            .map((b) => ({
                ...b,
                name: BANK_LOGOS[b.code]?.name ?? b.name,
                logoUrl: BANK_LOGOS[b.code]?.logo ?? b.logoUrl,
            }));
        if (filtered.length > 0) return { list: filtered, usingFallback: false };
        return { list: FALLBACK_BANKS, usingFallback: true };
    } catch {
        return { list: FALLBACK_BANKS, usingFallback: true };
    }
}

/**
 * `enabled` lets a caller defer the fetch until actually needed (e.g. only once the bank
 * editor opens) — same lazy behavior both screens already had individually before this was
 * a shared hook.
 */
export function useBankList(enabled: boolean) {
    const [banks, setBanks] = useState<BankOption[]>(cachedBanks?.list ?? []);
    const [usingFallback, setUsingFallback] = useState(cachedBanks?.usingFallback ?? false);
    const [loading, setLoading] = useState(!cachedBanks && enabled);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useEffect(() => {
        if (!enabled || cachedBanks) return;

        setLoading(true);
        if (!inFlight) {
            inFlight = fetchBanks().finally(() => {
                inFlight = null;
            });
        }
        inFlight.then((result) => {
            cachedBanks = result;
            if (!mounted.current) return;
            setBanks(result.list);
            setUsingFallback(result.usingFallback);
            setLoading(false);
        });
    }, [enabled]);

    return { banks, usingFallback, loading };
}