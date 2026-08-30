// src/app/page.tsx
// Plugr landing. Premium bone light-mode marketing page with scroll animations (motion),
// gold-fill CTAs, and photography. "Use Plugr" (top-right) -> /app.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Clock,
  BadgeCheck,
  Zap,
  Droplet,
  Hammer,
  ChevronRight,
  ArrowRight,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { PlugrWordmark, PlugrMark } from '@/src/components/Brand';
import { SiteFooter } from '@/src/components/SiteFooter';

const IMG = {
  hero: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1000&h=1200&fit=crop&q=80&auto=format',
  electrician: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=700&h=460&fit=crop&q=80&auto=format',
  plumber: 'https://images.unsplash.com/photo-1676210133055-eab6ef033ce3?w=700&h=460&fit=crop&q=80&auto=format',
  furniture: 'https://images.unsplash.com/photo-1631396326646-c06a935ff3a6?w=700&h=460&fit=crop&q=80&auto=format',
};

const NAV_LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'Why Plugr', href: '#why' },
  { label: 'Trades', href: '#trades' },
  { label: 'FAQ', href: '#faq' },
];

const STEPS = [
  { n: '01', title: 'Book a proven one', body: 'Browse by trade, see their verified identity.' },
  { n: '02', title: 'Pay with certainty', body: 'Job confirmed, money held in escrow.' },
  { n: '03', title: "Your money doesn't move until it's done right", body: 'Release when you’re satisfied, 24hr dispute window.' },
];

const REASONS = [
  { title: 'Your money is protected', body: "Payments are held in escrow until you're happy." },
  { title: 'Vetted experts only', body: 'Every artisan verifies their NIN before they can take a single job.' },
  { title: 'Something goes wrong?', body: '24hr dispute window and dedicated ops support.' },
  { title: 'Guaranteed quality', body: 'Every job comes with a 30-day fault guarantee.' },
  { title: 'Transparent pricing', body: 'Full quote before work starts. Zero surprises.' },
];

const FAQS = [
  { q: 'How do I pay?', a: 'You pay into escrow via bank transfer to a one-time account. Funds are held securely and only released to the Plug once you confirm the job is done.' },
  { q: "What if I'm not satisfied?", a: 'You don’t release payment until you’re happy — it stays safely in escrow. If something’s wrong, you have a 24-hour window to raise a dispute, and our team reviews it directly. Beyond that, every job carries a 30-day guarantee: if a genuine fault shows up later, we make it right.' },
  { q: 'How are Plugs verified?', a: 'Every Plug verifies their National Identification Number (NIN) before they’re eligible to take on jobs — so their real identity is confirmed and on record before they ever knock on your door. We’re adding further checks, like facial verification, over the coming weeks as we grow.' },
];

// Gold = primary. Midnight (solid) = the alternate when two sit side by side.
const btnGold =
  'inline-flex items-center justify-center gap-2 rounded-pill bg-gold text-midnight font-bold px-7 py-4 hover:bg-gold-light active:scale-[0.98] transition-all shadow-[0_14px_32px_-16px_rgba(232,160,32,0.75)]';
const btnAlt =
  'inline-flex items-center justify-center gap-2 rounded-pill bg-midnight text-white font-bold px-7 py-4 hover:bg-deep-blue active:scale-[0.98] transition-all';
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
      <span className="h-px w-6 bg-gold/50" />
      {children}
    </span>
  );
}

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

const heroContainer: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const heroItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] } },
};

export default function LandingPage() {
  const reduce = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-bone text-midnight font-body antialiased overflow-x-hidden">
      {/* ---------------------------------------------------------------- Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-bone/80 backdrop-blur border-b border-midnight/6">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Plain anchor (not next/link) so every click does a full reload of the main page */}
          <a href="/" className="flex items-center">
            <PlugrWordmark className="h-6 text-midnight" />
          </a>
          <div className="hidden md:flex items-center gap-9 text-sm font-semibold text-midnight/80">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-gold transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/app" className="inline-flex items-center gap-1.5 rounded-pill bg-gold text-midnight text-sm font-bold px-4 sm:px-5 py-2.5 hover:bg-gold-light active:scale-95 transition-all">
              Use Plugr <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="md:hidden text-midnight" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="fixed top-18.25 right-5 w-45 z-40 h-fit rounded-3xl bg-white/95 backdrop-blur-2xl md:hidden flex flex-col p-6 gap-2 border border-white/20 shadow-2xl animate-in slide-in-from-top-10 duration-1000">
            <Link href="#how" onClick={() => setMenuOpen(false)} className="text-md font-bold text-midnight">How it Works</Link>
            <Link href="#why" onClick={() => setMenuOpen(false)} className="text-md font-bold text-midnight">Why Plugr</Link>
            <Link href="#trades" onClick={() => setMenuOpen(false)} className="text-md font-bold text-midnight">Trades</Link>
            <Link href="#faq" onClick={() => setMenuOpen(false)} className="text-md font-bold text-midnight">FAQ</Link>
          </div>
        )}
      </nav>

      {/* --------------------------------------------------------------- Hero */}
      <header className="pt-28 md:pt-36 pb-16 px-5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-10 items-center">
          <motion.div variants={heroContainer} initial={reduce ? undefined : 'hidden'} animate={reduce ? undefined : 'show'}>
            <motion.div variants={heroItem}>
              <Eyebrow>Verified artisans · Yaba, Lagos</Eyebrow>
            </motion.div>
            <motion.h1 variants={heroItem} className="mt-5 font-display text-[3rem] md:text-[4.25rem] leading-[0.98] text-midnight">
              Know your <span className="text-gold">Plug.</span>
            </motion.h1>
            <motion.p variants={heroItem} className="mt-6 text-[17px] leading-relaxed text-slate max-w-md">
              Verified electricians and plumbers in Yaba — you know who&rsquo;s coming before they knock.
            </motion.p>
            <motion.div variants={heroItem} className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/app/browse" className={btnGold}>
                Book a Plug <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/app/onboarding" className={btnAlt}>
                Become a Plug
              </Link>
            </motion.div>
            <motion.div variants={heroItem} className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
              {[
                { icon: <UserCheck className="w-4 h-4" />, label: 'NIN Verified' },
                { icon: <Lock className="w-4 h-4" />, label: 'Escrow Protected' },
                { icon: <FaWhatsapp className="w-4 h-4" />, label: 'WhatsApp Native' },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-midnight">
                  <span className="text-gold shrink-0">{b.icon}</span>
                  <span className="text-[13px] font-semibold">{b.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero image + floating escrow mockup */}
          <motion.div
            className="relative"
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 0.15 }}
          >
            <div className="absolute -inset-6 bg-gold/10 blur-3xl rounded-full" />
            <div className="relative rounded-[28px] overflow-hidden border border-midnight/6 card-shadow">
              <img src={IMG.hero} alt="Verified artisan at work" className="w-full h-105 md:h-130 object-cover" loading="eager" />
              <div className="absolute inset-0 bg-linear-to-t from-midnight/40 to-transparent" />
            </div>

            <motion.div
              className="absolute left-3 bottom-3 w-62 rounded-2xl bg-white/95 backdrop-blur border border-midnight/6 card-shadow p-5"
              animate={reduce ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5 text-midnight">
                  <PlugrMark className="w-4 h-4" />
                  <span className="font-display text-base">Escrow</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-gold/15 px-2.5 py-1 text-10 font-bold uppercase tracking-widest text-[#8a5a08]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> Held
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate">Amount held</p>
              <p className="mt-0.5 font-display text-[2.25rem] leading-none text-midnight tnum">
                <span className="text-gold/90">₦</span>7,500
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-bone px-3 py-2">
                <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                <span className="text-[11px] text-midnight">Safe until you confirm.</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ------------------------------------------------------- The case (post-hero) */}
      {/* Sits between the hero and everything else on purpose: the argument for why Plugr
          should exist has to land before any feature list, or the features read as a
          list of nice-to-haves rather than the answer to a problem the reader recognises. */}
      <section className="px-5 pt-6 pb-20">
        <Reveal className="max-w-4xl mx-auto">
          <p className="font-display text-[1.9rem] md:text-[2.75rem] leading-[1.12] text-midnight">
            Lagos stopped gambling on everything else. Uber over hailing blind. Bolt Food over
            hoping it shows up. But finding someone to fix your wiring?{' '}
            <span className="text-slate">Still six phone calls and a stranger at your door.</span>{' '}
            <span className="text-gold">Plugr ends that.</span>
          </p>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------------ Identity */}
      {/* The thesis. Deliberately ABOVE "How it works" — the mechanics only matter once the
          reader accepts the premise that who shows up is the thing being fixed. */}
      <section className="px-5 pb-20">
        <Reveal className="max-w-5xl mx-auto">
          <div className="rounded-4xl bg-midnight text-white p-10 md:p-16">
            <Eyebrow>Identity</Eyebrow>
            <p className="mt-6 font-display text-[1.9rem] md:text-[2.9rem] leading-[1.1] text-white">
              Every Plug has a name that precedes them.{' '}
              <span className="text-gold">NIN verified. A record.</span>{' '}
              A reputation that follows them, not a stranger&rsquo;s word.
            </p>
            <p className="mt-6 font-display text-[1.5rem] md:text-[2rem] leading-[1.15] text-steel-blue">
              Before they arrive, you already know who they are.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------ How it works */}
      <section id="how" className="py-20 px-5 bg-white border-y border-midnight/6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 font-display text-[2.5rem] md:text-[3rem] leading-[1.02] text-midnight max-w-md">
              Three steps to a job done right.
            </h2>
          </Reveal>
          <div className="mt-14 grid md:grid-cols-3 gap-10">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="flex gap-4">
                  <span className="font-display text-xl text-gold shrink-0">{s.n}</span>
                  <div>
                    <h3 className="font-bold text-lg text-midnight">{s.title}</h3>
                    <p className="mt-1.5 text-sm text-slate leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Why Plugr */}
      <section id="why" className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <Eyebrow>Why Plugr</Eyebrow>
            <h2 className="mt-4 font-display text-[2.5rem] md:text-[3rem] leading-[1.02] text-midnight">
              Built different. <span className="text-slate">WhatsApp layered.</span>
            </h2>
          </Reveal>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REASONS.map((r, i) => (
              <Reveal key={r.title} delay={(i % 3) * 0.08}>
                <div className="h-full rounded-[22px] bg-white border border-midnight/6 card-shadow p-6 hover:-translate-y-1 transition-transform">
                  <span className="font-display text-sm text-gold">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 font-bold text-midnight">{r.title}</h3>
                  <p className="mt-1.5 text-sm text-slate leading-relaxed">{r.body}</p>
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.16}>
              <div className="h-full rounded-[22px] bg-midnight text-white p-6 flex flex-col justify-between">
                <PlugrMark className="w-6 h-6 text-gold" />
                <div>
                  <h3 className="mt-4 font-display text-2xl leading-tight">Skilled workers deserve a professional identity.</h3>
                  <p className="mt-3 text-sm text-steel-blue leading-relaxed">
                    Plugr turns artisans from anonymous contacts into trusted professionals — visible identity, ratings, and
                    verified work history.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ Trades */}
      <section id="trades" className="py-20 px-5 bg-white border-y border-midnight/6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <Eyebrow>What we fix</Eyebrow>
            <h2 className="mt-4 font-display text-[2.5rem] md:text-[3rem] leading-[1.02] text-midnight">Your trade, covered.</h2>
          </Reveal>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { img: IMG.electrician, icon: <Zap className="w-5 h-5" />, title: 'Electrician', body: 'Wiring, sockets, faults, lighting, and general electrical maintenance.', cta: 'Find an electrician' },
              { img: IMG.plumber, icon: <Droplet className="w-5 h-5" />, title: 'Plumber', body: 'Pipes, leaks, fixtures, water heaters, and drainage solutions.', cta: 'Find a plumber' },
              { img: IMG.furniture, icon: <Hammer className="w-5 h-5" />, title: 'Furniture', body: 'Custom furniture, wardrobes, cabinets, repairs, and finishing.', cta: 'Find a furniture maker' },
            ].map((t, i) => (
              <Reveal key={t.title} delay={i * 0.1}>
                <div className="group rounded-3xl overflow-hidden bg-bone border border-midnight/6 hover:border-gold/40 transition-colors">
                  <div className="relative h-52 overflow-hidden">
                    <img src={t.img} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <span className="absolute top-4 left-4 grid place-items-center h-11 w-11 rounded-2xl bg-white text-gold shadow-lg">{t.icon}</span>
                  </div>
                  <div className="p-7">
                    <h3 className="font-display text-2xl text-midnight">{t.title}</h3>
                    <p className="mt-2 text-sm text-slate leading-relaxed">{t.body}</p>
                    <Link href="/app/browse" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-gold hover:gap-2.5 transition-all">
                      {t.cta} <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate">More trades coming soon</p>
        </div>
      </section>

      {/* -------------------------------------------------------------------- For Plugs */}
      {/* Elevated above "For clients": the supply side is the harder sell and the more
          distinctive story, so it no longer sits last before the FAQ. */}
      <section className="py-20 px-5">
        <Reveal className="max-w-4xl mx-auto">
          <div className="rounded-4xl bg-midnight text-white p-10 md:p-14 text-center">
            <Eyebrow>For Plugs</Eyebrow>
            <h2 className="mt-5 font-display text-[2.6rem] md:text-[3.5rem] leading-[0.98] text-gold">
              You&rsquo;re not just an artisan. You&rsquo;re a Plug.
            </h2>
            <p className="mt-6 mx-auto max-w-2xl text-steel-blue text-lg leading-relaxed">
              You&rsquo;ve been doing this for years. The problem was never your skill — it&rsquo;s that every
              new client treated you like a stranger. Plugr gives you a record. A name that precedes you.
            </p>
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-5">
              {[
                { icon: <BadgeCheck className="w-5 h-5" />, label: 'Set your price' },
                { icon: <UserCheck className="w-5 h-5" />, label: 'Build identity' },
                { icon: <Clock className="w-5 h-5" />, label: 'Consistent work' },
                { icon: <ShieldCheck className="w-5 h-5" />, label: 'Get paid safely' },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center gap-2.5">
                  <span className="grid place-items-center h-11 w-11 rounded-xl bg-white/10 text-gold">{b.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/90">{b.label}</span>
                </div>
              ))}
            </div>
            <Link href="/app/onboarding" className={btnGold + ' mt-10 w-full sm:w-auto'}>
              Become a Plug <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ----------------------------------------------------------------- For clients */}
      <section className="py-20 px-5 bg-white border-y border-midnight/6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <Eyebrow>For clients</Eyebrow>
            <h2 className="mt-4 font-display text-[2.5rem] md:text-[3rem] leading-[1.02] text-midnight">No more random referrals.</h2>
            <div className="mt-8 space-y-4">
              {['Hire verified electricians and plumbers', 'Track payments securely', 'Get quote transparency', 'Raise disputes when necessary'].map((t, i) => (
                <div key={t} className="flex items-center gap-3">
                  <span className="grid place-items-center h-7 w-7 rounded-full bg-gold text-midnight text-xs font-black shrink-0">{i + 1}</span>
                  <span className="text-midnight font-medium">{t}</span>
                </div>
              ))}
            </div>
            <Link href="/app/browse" className={btnGold + ' mt-8'}>
              Book a Plug <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-3xl bg-bone border border-midnight/6 p-8">
              <div className="flex items-center gap-2 text-slate mb-6">
                <Clock className="w-4 h-4 text-gold" />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Escrow timeline</span>
              </div>
              {['Client pays into escrow', 'Plug completes the job', 'Client confirms', 'Funds released'].map((t, i, a) => (
                <div key={t} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="grid place-items-center h-5 w-5 rounded-full bg-gold">
                      <span className="h-1.5 w-1.5 rounded-full bg-midnight" />
                    </span>
                    {i < a.length - 1 && <span className="w-0.5 flex-1 bg-gold/40 my-1" />}
                  </div>
                  <span className="text-sm text-midnight font-medium pb-5">{t}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------------------- FAQ */}
      <section id="faq" className="py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="mt-4 font-display text-[2.5rem] md:text-[3rem] leading-[1.02] text-midnight">Common questions.</h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.06}>
                <div className="rounded-2xl bg-white border border-midnight/6 overflow-hidden">
                  <button onClick={() => setOpenFaq((o) => (o === i ? null : i))} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                    <span className="font-bold text-midnight">{f.q}</span>
                    <Plus className={'w-5 h-5 text-gold shrink-0 transition-transform ' + (openFaq === i ? 'rotate-45' : '')} />
                  </button>
                  {openFaq === i && <p className="px-5 pb-5 -mt-1 text-sm text-slate leading-relaxed">{f.a}</p>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- Final CTA */}
        <section className="py-24 px-5 bg-white border-t border-midnight/6 text-center">
        <Reveal>
          <h2 className="font-display text-[3rem] md:text-[4rem] leading-[0.98] text-midnight">Ready to find your Plug?</h2>
          <p className="mt-3 text-slate font-semibold">Yaba, Lagos.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/app/browse" className={btnGold}>
              Book a Plug <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/app/onboarding" className={btnAlt}>
              Become a Plug
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ----------------------------------------------------------------- Footer */}
      <SiteFooter />
    </div>
  );
}
