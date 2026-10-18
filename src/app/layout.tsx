import type { Metadata } from 'next'
import './globals.css'

const title = 'Plugr | Verified Skills Identity for Artisans';
const description = "Nigeria's first verified skills identity platform for artisans.";

export const metadata: Metadata = {
  // Resolves the relative og:image / twitter:image URLs into absolute ones, which scrapers require.
  // The www host, not the apex: getplugr.com 308-redirects to www, and a redirect on the image URL
  // is a common reason a preview silently doesn't appear.
  metadataBase: new URL('https://www.getplugr.com'),
  title,
  description,
  icons: {
    icon: '/plugr.svg'
  },
  // No `images` here on purpose: opengraph-image.tsx and twitter-image.tsx (same directory) are
  // picked up by Next's file convention, which adds the image, its size, alt and type itself.
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'Plugr',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
