import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#F5F1EC]">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="Plugr Logo" width={120} height={60} />
      </Link>
      <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#0A1529]">
        <Link href="#how-it-works" className="hover:text-[#DBA134] transition-colors">How it Works</Link>
        <Link href="#trades" className="hover:text-[#DBA134] transition-colors">Trades</Link>
        <Link href="#faq" className="hover:text-[#DBA134] transition-colors">FAQ</Link>
      </div>
      <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? <X className="w-6 h-6 text-[#0A1529]" /> : <Menu className="w-6 h-6 text-[#0A1529]" />}
      </button>
    </nav>

  ); {
    isMobileMenuOpen && (
      <div className="fixed inset-0 top-[73px] z-40 bg-white md:hidden flex flex-col p-6 space-y-6">
        <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
          <Link href="/auth" className="w-full py-4 text-center border-2 border-[#0A1529] text-[#0A1529] rounded-full font-bold">Log in</Link>
          <Link href="/become-a-plug" className="w-full py-4 text-center bg-[#DBA134] text-white rounded-full font-bold">Become a Plug</Link>
        </div>
      </div>
    )
  }
}

export default Navbar;