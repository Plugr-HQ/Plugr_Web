'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#F5F1EC]">
        <Link href="/">
          <Image src="/logo.svg" alt="Plugr Logo" width={120} height={60} />
        </Link>
        <div className="hidden md:flex flex-row items-center gap-12 text-sm font-semibold text-[#0A1529]">
          <Link href="#how-it-works" className="hover:text-[#DBA134] transition-colors">How it Works</Link>
          <Link href="#trades" className="hover:text-[#DBA134] transition-colors">Trades</Link>
          <Link href="#faq" className="hover:text-[#DBA134] transition-colors">FAQ</Link>
          <div className="flex flex-row items-center gap-6 ml-24">
            <Link href="/auth" className="text-[#DBA134] px-6 py-3 rounded-full hover:bg-[#0A1529]/90 hover:text-white transition-colors">Log in</Link>
            <Link href="/auth" className="bg-[#DBA134] text-white px-6 py-3 rounded-full hover:bg-[#0A1529]/90 transition-colors">Sign up</Link>
          </div>
        </div>
        <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6 text-[#0A1529]" /> : <Menu className="w-6 h-6 text-[#0A1529]" />}
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed top-[73px] right-0 w-[280px] z-40 h-fit rounded-3xl bg-white/50 backdrop-blur-md md:hidden flex flex-col p-6 gap-2 border-l border-gray-100 shadow-2xl animate-in slide-in-from-top-10 duration-1000">
          <Link href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#0A1529]">How it Works</Link>
          <Link href="#trades" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#0A1529]">Trades</Link>
          <Link href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#0A1529]">FAQ</Link>
          <Link href="/find" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#0A1529]">Find a Plug</Link>
          <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
            <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-4 text-center border-2 border-[#0A1529] text-[#0A1529] rounded-full font-bold">Log in</Link>
            <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-4 text-center bg-[#DBA134] text-white rounded-full font-bold">Sign up</Link>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;