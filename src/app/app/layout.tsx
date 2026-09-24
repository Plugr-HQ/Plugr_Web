import type { Metadata, Viewport } from 'next';
import { InstallPrompt } from '@/src/components/pwa/install-prompt';
import { InstallDebugPanel } from '@/src/components/pwa/install-debug-panel';

// Merges with the root layout's metadata (app/layout.tsx) — title/description/
// the SVG favicon there are untouched. This only adds what's specific to the
// installable /app/ product tree: the manifest link and the iOS home-screen
// icon (Safari ignores manifest.json's icons array entirely).
export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Plugr',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

// Next 14 moved theme-color out of `metadata` into its own export. Match
// manifest.json's theme_color once you swap that placeholder for the real
// brand color.
export const viewport: Viewport = {
  themeColor: '#0A0A0A',
};

// No <html>/<body> here — only the root layout owns those. This layout just
// wraps everything under /app/ (auth, browse, book, confirm, pay, receipt,
// wallet, withdraw, plug, plugs, onboarding, jobs).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/*
        Bug fix: registering the SW from a 'use client' + useEffect component
        (the old RegisterServiceWorker) only runs post-hydration. Chrome's
        installability check — which gates whether beforeinstallprompt fires
        at all — can run before that on a cold load, so the event silently
        never fires that visit; a refresh "fixes" it only because the prior
        load's SW is already active. A plain blocking inline script with no
        'use client', no defer/async, executes during HTML parse, before
        hydration, so registration is in flight before the installability
        check runs. Scope stays limited to /app/ — marketing/funnel pages
        (waitlist, find, become-a-plug, demo) must stay untouched by this SW.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js', { scope: '/app/' }).catch(function(err) {
                console.error('SW registration failed:', err);
              });
            }
          `,
        }}
      />
      <InstallPrompt />
      <InstallDebugPanel />
      {children}
    </>
  );
}