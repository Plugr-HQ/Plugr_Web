import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "The Plug | Professional Identity for Artisans",
  description: "Turn your skills into a verified professional identity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
      {children}
    </div>
  );
}
