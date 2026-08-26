// src/components/plug/BankSelect.tsx
// Custom searchable bank picker — replaces the native <select>. A native <select>/<option>
// can't render a logo inline, use a frosted-glass panel, or set a custom highlight color
// (the browser's own OS dropdown chrome always wins), so this is a real component instead.

'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Landmark, Search } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export type BankOption = { code: string; name: string; logoUrl: string };

export function BankLogo({ url }: { url?: string }) {
    const [failed, setFailed] = useState(false);
    if (!url || failed) {
        return (
            <span className="grid h-full w-full place-items-center text-slate">
                <Landmark className="h-4 w-4" />
            </span>
        );
    }
    return (
        <img
            src={url}
            alt=""
            className="h-full w-full object-contain p-1"
            onError={() => setFailed(true)}
        />
    );
}

export function BankSelect({
    banks,
    value,
    onChange,
    loading = false,
    placeholder = 'Select your bank',
    onOpenChange,
}: {
    banks: BankOption[];
    value: string;
    onChange: (code: string) => void;
    loading?: boolean;
    placeholder?: string;
    // Fires whenever the dropdown panel opens or closes — lets a parent (e.g. the sticky
    // Logout button in SettingsScreen) react and get out of the way while it's open.
    onOpenChange?: (open: boolean) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selected = banks.find((b) => b.code === value) ?? null;

    const filtered = query.trim()
        ? banks.filter((b) => b.name.toLowerCase().includes(query.trim().toLowerCase()))
        : banks;

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    useEffect(() => {
        if (open) {
            // let the panel mount before focusing so the caret lands correctly
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [open]);

    // Report open/closed state up to the parent.
    useEffect(() => {
        onOpenChange?.(open);
    }, [open, onOpenChange]);

    // Safety net: if this component unmounts while still open (e.g. the user hits Cancel/Save
    // in the parent form, which unmounts BankSelect entirely), make sure the parent hears
    // "closed" so it doesn't get stuck thinking the dropdown is still up.
    useEffect(() => {
        return () => onOpenChange?.(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function pick(code: string) {
        onChange(code);
        setOpen(false);
        setQuery('');
    }

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                disabled={loading}
                className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border border-midnight/10 bg-white px-4 py-3 text-left text-sm transition-shadow',
                    'focus:outline-none focus:ring-4 focus:ring-gold/10',
                    open && 'ring-4 ring-gold/10 border-gold',
                )}
            >
                {selected ? (
                    <>
                        <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-midnight/[0.04]">
                            <BankLogo url={selected.logoUrl} />
                        </span>
                        <span className="flex-1 truncate font-semibold text-midnight">{selected.name}</span>
                    </>
                ) : (
                    <span className="flex-1 text-slate/60">{loading ? 'Loading banks…' : placeholder}</span>
                )}
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
                <div
                    className={cn(
                        'absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/40',
                        'bg-white/70 backdrop-blur-xl shadow-[0_12px_40px_-8px_rgba(15,23,42,0.25)]',
                    )}
                >
                    <div className="flex items-center gap-2 border-b border-midnight/[0.06] px-4 py-2.5">
                        <Search className="h-3.5 w-3.5 shrink-0 text-slate/60" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search bank…"
                            className="w-full bg-transparent text-sm text-midnight placeholder:text-slate/50 focus:outline-none"
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1.5">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-slate/60">No banks match "{query}".</p>
                        ) : (
                            filtered.map((b) => {
                                const isSelected = b.code === value;
                                return (
                                    <button
                                        key={b.code}
                                        type="button"
                                        onClick={() => pick(b.code)}
                                        className={cn(
                                            'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                                            isSelected ? 'bg-blue-900/90 text-white' : 'text-midnight hover:bg-blue-900/10',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full',
                                                isSelected ? 'bg-white/15' : 'bg-midnight/[0.04]',
                                            )}
                                        >
                                            <BankLogo url={b.logoUrl} />
                                        </span>
                                        <span className="flex-1 truncate font-semibold">{b.name}</span>
                                        {isSelected && <Check className="h-4 w-4 shrink-0" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}