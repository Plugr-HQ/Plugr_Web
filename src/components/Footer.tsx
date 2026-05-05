import Link from 'next/link'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="bg-bone pt-16 pb-8 px-4 border-t border-slate/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <Logo variant="dark" className="mb-4" />
            </Link>
            <p className="text-slate text-sm">
              Nigeria's first verified skills identity platform for artisans.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-midnight mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-slate">
              <li><Link href="/#how-it-works" className="hover:text-gold transition-colors">How It Works</Link></li>
              <li><Link href="/find" className="hover:text-gold transition-colors">Find a Plug</Link></li>
              <li><Link href="/become-a-plug" className="hover:text-gold transition-colors">Become a Plug</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-midnight mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-slate">
              <li><a href="#" className="hover:text-gold transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Safety</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Disputes</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-midnight mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate">
              <li><a href="#" className="hover:text-gold transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate/10 text-center text-slate text-xs">
          &copy; {new Date().getFullYear()} Plugr. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
