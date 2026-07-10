"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <> {/* <--- Open React Fragment here */}
      <nav className="fixed top-0 w-full z-50 px-6 py-3 flex justify-between items-center bg-[#F5F1EC]/85">
        <Link href="/" className="flex items-center relative gap-2 md:w-[120px] md:h-[60px] w-[90px] h-[40px]">

          <Image src="/logo.svg" alt="Plugr Logo" fill className="bg-cover" />
        </Link>
        <div className="flex items-center gap-4 text-sm font-semibold text-[#0A1529]">
          <Link href="/privacy" className="hover:text-[#DBA134] transition-colors hidden md:inline">Privacy</Link>
          <Link href="/onboard" className="bg-[#DBA134] text-white px-4 py-2 rounded-full hover:text-[#DBA134] hover:bg-[#0A1529]/90 transition-colors">Use Plugr</Link>
        </div>
        <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6 text-[#0A1529]" /> : <Menu className="w-6 h-6 text-[#0A1529]" />}
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed top-[80px] right-0 bottom-0 w-[280px] z-40 h-fit rounded-3xl bg-white/50 backdrop-blur-md md:hidden flex flex-col p-6 border-l border-gray-100 shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="pt-6 flex flex-col gap-4 items-center">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 text-center border-2 border-[#0A1529] text-[#0A1529] rounded-full font-bold text-sm"
            >
              Home
            </Link>
            <Link
              href="/find"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 text-center border-2 border-[#0A1529] text-[#0A1529] rounded-full font-bold text-sm"
            >
              Find A Plug
            </Link>
            <Link
              href="/privacy"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 text-center border-2 border-[#0A1529] text-[#0A1529] rounded-full font-bold text-sm"
            >
              Privacy Policy
            </Link>
            <Link
              href="/become-a-plug"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 text-center bg-[#DBA134] text-white rounded-full font-bold text-sm shadow-md"
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