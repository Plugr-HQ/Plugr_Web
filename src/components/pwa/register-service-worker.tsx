'use client';

import { useEffect, useState } from 'react';
import { isEligiblePlug } from '@/src/lib/pwa/get-plug-role';

const DISMISSED_KEY = 'plugr_pwa_install_dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Mount inside app/app/layout.tsx, wherever other Plug-scoped chrome lives
 * (e.g. alongside PlugChrome). Gated on isEligiblePlug() — see
 * lib/pwa/get-plug-role.ts for what that checks and the storage-key TODO.
 */
export function InstallPrompt() {
  const [eligible, setEligible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setEligible(isEligiblePlug());
    setDismissed(window.localStorage.getItem(DISMISSED_KEY) === '1');

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const shouldShow = eligible && !dismissed && !isStandalone() && (deferredPrompt || isIos());

  if (!shouldShow) return null;

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted' || outcome === 'dismissed') dismiss();
      return;
    }
    if (isIos()) setShowIosInstructions(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl bg-neutral-900 p-4 text-white shadow-lg">
      <div className="flex-1">
        <p className="text-sm font-medium">Add Plugr to your home screen</p>
        <p className="mt-1 text-xs text-neutral-300">
          {showIosInstructions
            ? 'Tap the Share icon, then "Add to Home Screen".'
            : 'Install the app for faster access — no browser bar, just Plugr.'}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        {!showIosInstructions && (
          <button
            onClick={handleInstall}
            className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900"
          >
            Install
          </button>
        )}
        <button onClick={dismiss} className="text-xs text-neutral-400 underline">
          Not now
        </button>
      </div>
    </div>
  );
}