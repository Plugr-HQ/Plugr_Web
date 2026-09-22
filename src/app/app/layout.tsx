import type { Metadata, Viewport } from 'next';
import { RegisterServiceWorker } from '@/src/components/pwa/register-service-worker';
import { InstallPrompt } from '@/src/components/pwa/install-prompt';

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
      <RegisterServiceWorker />
      <InstallPrompt />
      {children}
    </>
  );
}