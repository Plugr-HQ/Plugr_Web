// src/components/SiteFooter.tsx
// Canonical site footer, shared by the landing and the legal pages so they stay identical.
// Server-compatible (no client hooks). "How it works" links to /#how so it works from any page,
// not just the landing.
//
// Structure, top to bottom:
//   1. five columns — brand, then the site's own nav categories, then contact
//   2. a rule, with copyright left and labelled socials right
//   3. the signature: an oversized "plugr" centred and deliberately cut off by the bottom edge
//
// Flat colour throughout — no gradients anywhere on this site. The surface is pitch-black; the
// wordmark is #1C3260, one flat step lighter. That tonal step is what makes a mark this large
// readable without it shouting under the real logo in the brand column: it is felt before it is
// read, which is the job.
//
// It is decorative: aria-hidden, pointer-events-none and unselectable, so it never reaches the
// accessibility tree or copied text. The footer clips it, which produces the cut-off.

import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { FaInstagram, FaXTwitter, FaLinkedinIn } from 'react-icons/fa6';
import { PlugrWordmark } from './Brand';

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/getplugr', icon: <FaInstagram className="h-[17px] w-[17px]" /> },
  { label: 'X (Twitter)', href: 'https://x.com/getplugr', icon: <FaXTwitter className="h-4 w-4" /> },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/getplugr', icon: <FaLinkedinIn className="h-4 w-4" /> },
];

// The same categories as the top nav — the footer mirrors the page's own structure rather than
// inventing a second information architecture nobody has seen before.
const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Explore',
    links: [
      { label: 'How it works', href: '/#how' },
      { label: 'Why Plugr', href: '/#why' },
      { label: 'Trades', href: '/#trades' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: 'Book a Plug', href: '/app/browse' },
      { label: 'Become a Plug', href: '/app/signup' },
      { label: 'Use Plugr', href: '/app' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Dispute Policy', href: '/dispute' },
    ],
  },
];

const linkTone =
  'text-steel-blue transition-colors duration-200 hover:text-gold focus-visible:text-gold focus-visible:outline-none';
const columnLink = `inline-block text-sm ${linkTone}`;
const columnTitle = 'mb-5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45';

export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden bg-pitch-black text-white">
      <div className="mx-auto max-w-6xl px-5 pt-16 md:pt-24">
        {/* --- columns --------------------------------------------------------------- */}
        <div className="grid gap-y-9 md:grid-cols-[1.7fr_1fr_1fr_1fr_1.1fr] md:gap-12">
          <div>
            <PlugrWordmark className="h-6 text-white" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-steel-blue">
              A name that precedes them. The verified artisan network in Lagos — every Plug
              identity-checked before they can take work.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className={columnTitle}>{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith('/#') ? (
                      <a href={l.href} className={columnLink}>{l.label}</a>
                    ) : (
                      <Link href={l.href} className={columnLink}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className={columnTitle}>Contact us</p>
            <ul className="space-y-3">
              <li>
                <a href="tel:+2348180147857" className={`flex items-center gap-2 text-sm ${linkTone}`}>
                  <Phone className="h-4 w-4 shrink-0" /> +234 818 014 7857
                </a>
              </li>
              <li>
                <a href="mailto:hello@getplugr.com" className={`flex items-center gap-2 text-sm ${linkTone}`}>
                  <Mail className="h-4 w-4 shrink-0" /> hello@getplugr.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* --- rule: copyright + socials ---------------------------------------------- */}
        <div className="mt-12 flex flex-col items-start gap-5 border-t border-white/10 pt-7 md:mt-16 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
            © 2026 Alhazen. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={`Plugr on ${s.label}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 text-sm ${linkTone}`}
              >
                {s.icon}
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* --- signature wordmark, cut off by the bottom edge -------------------------- */}
      <div
        aria-hidden="true"
        className="pointer-events-none relative mt-14 h-[15vw] min-h-[88px] select-none"
      >
        <span
          className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap font-display leading-[0.74] tracking-[-0.045em]"
          style={{ fontSize: 'clamp(9rem, 38vw, 34rem)', color: '#1C3260' }}
        >
          plugr
        </span>
      </div>
    </footer>
  );
}
