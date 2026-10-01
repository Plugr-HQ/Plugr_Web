'use client';

import { useEffect, useState } from 'react';
import { Download, Check } from 'lucide-react';

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
 * Chrome-on-Android only (requires the `related_applications` entry with
 * platform "webapp" in manifest.json, pointing at this manifest's own URL).
 * No support on iOS Safari or desktop — resolves false there, which is the
 * correct fallback (can't tell, so behave as before).
 *
 * NOTE: this checks whether Android's package manager has ANY record for
 * this WebAPK id, including a broken/partial one left over from an
 * interrupted install. It does not distinguish "properly installed" from
 * "stuck half-install" — if install still silently fails after this
 * resolves true, that's the signal to check Settings → Apps → See all apps
 * for a stray Plugr entry to manually uninstall, not a code bug here.
 */
async function checkAlreadyInstalled(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  if (!('getInstalledRelatedApps' in navigator)) return false;
  try {
    const related = await (navigator as any).getInstalledRelatedApps();
    return Array.isArray(related) && related.length > 0;
  } catch {
    return false;
  }
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
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);

  useEffect(() => {
    setEligible(isEligiblePlug());

    setDismissed(
      window.localStorage.getItem(DISMISSED_KEY) === '1',
    );

    checkAlreadyInstalled().then(setAlreadyInstalled);

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
    !alreadyInstalled &&
    (deferredPrompt || isIos() || forceOpen);

  if (!shouldShow) return null;

  // dismiss(permanent): a real decision (installed, explicitly rejected via
  // beforeinstallprompt, or "Not now") writes DISMISSED_KEY and stays gone.
  // Just closing the forceOpen panel (the fallback "Got it") does not.
  const dismiss = (permanent: boolean) => {
    if (permanent) {
      window.localStorage.setItem(DISMISSED_KEY, '1');
      setDismissed(true);
    }
    setForceOpen(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;

      setDeferredPrompt(null);

      if (outcome === 'accepted' || outcome === 'dismissed') {
        dismiss(true);
      }

      return;
    }

    if (isIos()) {
      setShowIosInstructions(true);
      return;
    }

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
            onClick={() => dismiss(false)}
            className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900"
          >
            Got it
          </button>
        )}

        <button
          type="button"
          onClick={() => dismiss(true)}
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
 * When Plugr is already installed (Chrome/Android only — see
 * checkAlreadyInstalled), this switches from "Install app" to an
 * "Installed" state instead of asking InstallPrompt to open. There is no
 * meaningful "Update" action to wire here: PWAs self-update via the
 * service worker in the background, with no user-facing update step —
 * that's a real difference from native APKs, not a gap in this component.
 */
export function InstallButton({
  className = '',
}: {
  className?: string;
}) {
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAlreadyInstalled().then((v) => {
      setAlreadyInstalled(v);
      setChecked(true);
    });
  }, []);

  const handleClick = () => {
    window.dispatchEvent(
      new Event(OPEN_INSTALL_EVENT),
    );
  };

  // Not yet resolved (or unsupported browser, where this just stays false):
  // render the normal Install button. Chrome-on-Android confirming an
  // install flips this without a page reload needed on next mount.
  if (checked && alreadyInstalled) {
    return (
      <button
        type="button"
        disabled
        className={className}
        aria-label="Plugr is already installed on this device"
      >
        <Check className="h-4 w-4" />
        Installed
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      <Download className="h-4 w-4" />
      Install app
    </button>
  );
}