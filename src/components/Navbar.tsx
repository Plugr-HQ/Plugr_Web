import { Menu, Bell } from 'lucide-react'
import { Button } from './Button'
import { Logo } from './Logo'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-midnight px-4 py-3 flex items-center justify-between border-b border-white/10">
      <Logo variant="light" />
      
      <div className="flex items-center gap-4">
        <button className="text-white md:hidden">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:flex items-center gap-6 text-white text-sm font-medium mr-8">
          <a href="#" className="hover:text-gold transition-colors">Home</a>
          <a href="#" className="hover:text-gold transition-colors">How It Works</a>
          <a href="#" className="hover:text-gold transition-colors">Find a Plug</a>
          <a href="#" className="hover:text-gold transition-colors">Become a Plug</a>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:text-gold min-w-0 px-4">Log In</Button>
          <Button className="min-w-0 px-6 py-2">Sign Up</Button>
        </div>
      </div>
    </nav>
  )
}
