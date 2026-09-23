'use client';

import { useEffect, useState } from 'react';

import { isEligiblePlug } from '@/src/lib/pwa/get-plug-role';

const DISMISSED_KEY = 'plugr_pwa_install_dismissed';
const OPEN_INSTALL_EVENT = 'plugr:open-install-prompt';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;

  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as any).MSStream
  );
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * The actual PWA install prompt.
 *
 * Mounted once from app/app/layout.tsx so the browser's
 * beforeinstallprompt event has one owner across the Plug app.
 */
export function InstallPrompt() {
  const [eligible, setEligible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    setEligible(isEligiblePlug());

    setDismissed(
      window.localStorage.getItem(DISMISSED_KEY) === '1',
    );

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const openHandler = () => {
      setForceOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener(
      OPEN_INSTALL_EVENT,
      openHandler,
    );

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handler,
      );

      window.removeEventListener(
        OPEN_INSTALL_EVENT,
        openHandler,
      );
    };
  }, []);

  const shouldShow =
    eligible &&
    !dismissed &&
    !isStandalone() &&
    (deferredPrompt || isIos() || forceOpen);

  if (!shouldShow) return null;

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
    setForceOpen(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;

      setDeferredPrompt(null);

      if (outcome === 'accepted' || outcome === 'dismissed') {
        dismiss();
      }

      return;
    }

    if (isIos()) {
      setShowIosInstructions(true);
      return;
    }

    /*
     * Some browsers do not expose beforeinstallprompt.
     * Keep the prompt open so the user can use the browser's
     * own install option instead of silently doing nothing.
     */
    setShowIosInstructions(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl bg-neutral-900 p-4 text-white shadow-lg">
      <div className="flex-1">
        <p className="text-sm font-medium">
          Add Plugr to your home screen
        </p>

        <p className="mt-1 text-xs text-neutral-300">
          {showIosInstructions
            ? 'Tap the Share icon, then "Add to Home Screen".'
            : deferredPrompt
              ? 'Install the app for faster access — no browser bar, just Plugr.'
              : 'Use your browser menu to install Plugr as an app.'}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        {!showIosInstructions && deferredPrompt && (
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900"
          >
            Install
          </button>
        )}

        {!showIosInstructions && !deferredPrompt && !isIos() && (
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900"
          >
            Got it
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          className="text-xs text-neutral-400 underline"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

/**
 * Small inline button for screens such as Settings.
 *
 * The actual installation remains owned by InstallPrompt in
 * app/app/layout.tsx. This simply asks that component to open.
 */
export function InstallButton({
  className = '',
}: {
  className?: string;
}) {
  const handleClick = () => {
    window.localStorage.removeItem(DISMISSED_KEY);
  
    window.dispatchEvent(
      new Event(OPEN_INSTALL_EVENT),
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      Install app
    </button>
  );
}