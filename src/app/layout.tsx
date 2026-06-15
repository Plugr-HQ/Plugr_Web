import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Plugr | Verified Skills Identity for Artisans',
  description: "Nigeria's first verified skills identity platform for artisans.",
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
