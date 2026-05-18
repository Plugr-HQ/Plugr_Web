"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <> {/* <--- Open React Fragment here */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#F5F1EC]">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Plugr Logo" width={120} height={60} />
        </Link>
        <div className="flex flex-row items-center gap-6 text-sm font-semibold text-[#0A1529]">
          <Link href="/auth" className="text-[#DBA134] px-12 py-3 rounded-full hover:text-[#DBA134] hover:bg-[#0A1529]/90 transition-colors">Log in</Link>
          <Link href="/become-a-plug" className="bg-[#DBA134] text-white px-12 py-3 rounded-full hover:text-[#DBA134] hover:bg-[#0A1529]/90 transition-colors">Sign up</Link>
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