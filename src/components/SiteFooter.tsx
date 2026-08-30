// src/components/SiteFooter.tsx
// Canonical site footer, shared by the landing and the privacy page so they stay identical.
// Server-compatible (no client hooks). "How it works" links to /#how so it works from any
// page, not just the landing.

import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { FaInstagram, FaXTwitter } from 'react-icons/fa6';
import { PlugrWordmark } from './Brand';

const SOCIALS = [
  { label: 'Plugr on Instagram', href: 'https://www.instagram.com/getplugr', icon: <FaInstagram className="w-[18px] h-[18px]" />, external: true },
  { label: 'Plugr on X', href: 'https://x.com/getplugr', icon: <FaXTwitter className="w-[17px] h-[17px]" />, external: true },
  { label: 'Email Plugr', href: 'mailto:hello@getplugr.com', icon: <Mail className="w-[18px] h-[18px]" />, external: false },
];

export function SiteFooter() {
  return (
    <footer className="bg-midnight text-white px-5 py-14">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[1.4fr_1fr_1fr] gap-10">
        <div>
          <PlugrWordmark className="h-6 text-white" />
          <p className="mt-4 text-sm text-steel-blue max-w-xs leading-relaxed">
            A name that precedes them. The verified artisan network in Lagos.
          </p>
          <div className="mt-5 space-y-2 text-sm text-steel-blue">
            <a href="mailto:hello@getplugr.com" className="flex items-center gap-2 hover:text-gold transition-colors">
              <Mail className="w-4 h-4" /> hello@getplugr.com
            </a>
            <a href="tel:+2348180147857" className="flex items-center gap-2 hover:text-gold transition-colors">
              <Phone className="w-4 h-4" /> +234 818 014 7857
            </a>
          </div>

          <div className="mt-6 flex items-center gap-2.5">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                {...(s.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="grid place-items-center h-10 w-10 rounded-full border border-white/15 text-white/80 hover:text-midnight hover:bg-gold hover:border-gold transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 mb-4">Quick links</p>
          <ul className="space-y-2.5 text-sm text-steel-blue">
            <li><a href="/#how" className="hover:text-gold transition-colors">How it works</a></li>
            <li><Link href="/app/browse" className="hover:text-gold transition-colors">Book a Plug</Link></li>
            <li><Link href="/app/signup" className="hover:text-gold transition-colors">Become a Plug</Link></li>
            <li><Link href="/app/browse" className="hover:text-gold transition-colors">Use Plugr</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 mb-4">Legal</p>
          <ul className="space-y-2.5 text-sm text-steel-blue">
            <li><Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
            <li><a href="/terms" className="hover:text-gold transition-colors">Terms of Service</a></li>
            <li><a href="/dispute" className="hover:text-gold transition-colors">Dispute Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/10 text-[11px] uppercase tracking-[0.14em] text-white/40">
        © 2026 Alhazen. All rights reserved.
      </div>
    </footer>
  );
}
