"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <> {/* <--- Open React Fragment here */}
      <nav className="fixed top-0 w-full z-50 px-6 py-3 flex justify-between items-center bg-bone/85">
        <Link href="/" className="flex items-center relative gap-2 md:w-32 md:h-12 w-24 h-8">

          <Image src="/logo.svg" alt="Plugr Logo" fill className="bg-cover" />
        </Link>
        <div className="flex items-center gap-4 text-sm font-semibold text-pitch-black">
          <Link href="/privacy" className="hover:text-gold transition-colors hidden md:inline">Privacy</Link>
          <Link href="/app" className="bg-gold text-white px-4 py-2 rounded-full hover:text-gold hover:bg-pitch-black/90 transition-colors">Use Plugr</Link>
        </div>
        <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6 text-pitch-black" /> : <Menu className="w-6 h-6 text-pitch-black" />}
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed top-20 right-0 bottom-0 w-[70 z-40 h-fit rounded-3xl bg-white/50 backdrop-blur-md md:hidden flex flex-col p-6 border-l border-gray-100 shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="pt-6 flex flex-col gap-4 items-center">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 text-center border-2 border-pitch-black text-pitch-black rounded-full font-bold text-sm"
            >
              Home
            </Link>
            <Link
              href="/find"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 text-center border-2 border-pitch-black text-pitch-black rounded-full font-bold text-sm"
            >
              Find A Plug
            </Link>
            <Link
              href="/privacy"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 text-center border-2 border-pitch-black text-pitch-black rounded-full font-bold text-sm"
            >
              Privacy Policy
            </Link>
            <Link
              href="/app"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 text-center bg-gold text-white rounded-full font-bold text-sm shadow-md"
            >
              Become a Plug
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;