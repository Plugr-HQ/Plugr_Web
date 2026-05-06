import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from './Button'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-midnight px-6 py-3 flex items-center justify-between border-b border-white/10">
      {/* 1. Logo Section */}
      <div className="flex items-center">
        <Link href="/">
          <img src="/logo.svg" alt='Plugr' className='h-11 w-48 bg-white rounded-md' />
        </Link>
      </div>

      {/* 2. Navigation Section */}
      <div className="hidden md:flex items-center gap-8 text-white text-sm font-medium">
        <Link href="/" className="hover:text-gold transition-colors">Home</Link>
        <Link href="/#how-it-works" className="hover:text-gold transition-colors">How It Works</Link>
        <Link href="/find" className="hover:text-gold transition-colors">Find a Plug</Link>
        <Link href="/become-a-plug" className="hover:text-gold transition-colors">Become a Plug</Link>
      </div>

      {/* 3. Auth Buttons Section */}
      <div className="flex items-center gap-4">
        <button className="text-white md:hidden">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" href="/auth" className="text-white hover:text-gold min-w-0 px-4">Log In</Button>
          <Button href="/auth" className="min-w-0 px-6 py-2">Sign Up</Button>
        </div>
      </div>
    </nav>
  )
}
