// src/app/page.tsx
// Plugr landing. Premium bone light-mode marketing page with scroll animations (motion),
// gold-fill CTAs, and photography. "Use Plugr" (top-right) -> /app.

'use client';

import { useEffect, useState } from 'react';
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
  ArrowRight,
  ArrowUpRight,
  Check,
  Menu,
  X,
  Plus,
  LifeBuoy,
  ReceiptText,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { PlugrWordmark, PlugrMark } from '@/src/components/Brand';
import { SiteFooter } from '@/src/components/SiteFooter';

// Pexels, licence-free and checked to load. Each is a real photograph of the trade it labels —
// no stock "diverse team in a meeting room", and nothing AI-generated.
const px = (id: number, w = 1000) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

// Every image checked by eye at its final crop, not picked off alt text. The trade is
// overwhelmingly male in Lagos and the page should look like the sector it serves: the hero and
// the feature panel are men, with one woman on the electrician card — real, and not a token
// rewrite of who actually does this work.
const IMG = {
  hero: px(9242289, 1400),         // man in safety glasses working with a hand tool
  panel: px(27928761, 1200),       // electrician at a breaker panel
  electrician: px(34526423, 800),  // technician on an electrical control panel
  plumber: px(32588548, 800),      // hands repairing a pipe with a wrench
  furniture: px(32357250, 800),    // carpenter working at a bench
};

const NAV_LINKS = [
  { label: 'How it works', href: '#how' },
  { label: 'Why Plugr', href: '#why' },
  { label: 'Trades', href: '#trades' },
  { label: 'FAQ', href: '#faq' },
];

// A real sequence in time, so the numbering carries information rather than decorating.
const STEPS = [
  {
    n: '01',
    title: 'Find your Plug',
    body: 'See his name, his verified NIN, and his trade. Not a stranger’s word for it.',
  },
  {
    n: '02',
    title: 'Money sits safe until the job’s done',
    body: 'You pay upfront, but nothing reaches him until you confirm the work is right.',
  },
  {
    n: '03',
    title: 'Confirm, and it’s done',
    body: 'Release payment in one tap, or raise it within 24 hours if something’s off.',
  },
];

const REASONS = [
  { title: 'Your money is protected', body: "Payments are held in escrow until you're happy.", icon: <Lock className="h-4 w-4" /> },
  { title: 'Vetted experts only', body: 'Every artisan verifies their NIN before they can take a single job.', icon: <UserCheck className="h-4 w-4" /> },
  { title: 'Something goes wrong?', body: '24hr dispute window and dedicated ops support.', icon: <LifeBuoy className="h-4 w-4" /> },
  { title: 'Guaranteed quality', body: 'Every job comes with a 30-day fault guarantee.', icon: <BadgeCheck className="h-4 w-4" /> },
  { title: 'Transparent pricing', body: 'Full quote before work starts. Zero surprises.', icon: <ReceiptText className="h-4 w-4" /> },
];

const FAQS = [
  { q: 'How do I pay?', a: 'You pay into escrow via bank transfer to a one-time account. Funds are held securely and only released to the Plug once you confirm the job is done.' },
  { q: "What if I'm not satisfied?", a: 'You don’t release payment until you’re happy — it stays safely in escrow. If something’s wrong, you have a 24-hour window to raise a dispute, and our team reviews it directly. Beyond that, every job carries a 30-day guarantee: if a genuine fault shows up later, we make it right.' },
  { q: 'How are Plugs verified?', a: 'Every Plug verifies their National Identification Number (NIN) before they’re eligible to take on jobs — so their real identity is confirmed and on record before they ever knock on your door. We’re adding further checks, like facial verification, over the coming weeks as we grow.' },
];

// Gold = primary. Pitch Black (solid) = the alternate when two sit side by side.
const btnGold =
  'inline-flex items-center justify-center gap-2 rounded-pill bg-gold text-pitch-black font-bold px-7 py-4 hover:bg-gold-light active:scale-[0.98] transition-all shadow-[0_14px_32px_-16px_rgba(232,160,32,0.75)]';
const btnAlt =
  'inline-flex items-center justify-center gap-2 rounded-pill bg-pitch-black text-white font-bold px-7 py-4 hover:bg-petrol active:scale-[0.98] transition-all';
/**
 * Section label. A bordered pill rather than a rule-and-caps line: it reads as a tag on the
 * section, gives every section the same visible starting point, and survives on both the bone
 * and pitch-black surfaces. The gold dot is the only accent it carries.
 */
function Eyebrow({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <span
      className={
        'inline-flex items-center gap-2 rounded-pill border px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] ' +
        (tone === 'dark' ? 'border-white/15 bg-white/[0.05] text-white/75' : 'border-pitch-black/10 bg-white text-pitch-black/70')
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
      {children}
    </span>
  );
}

/**
 * Section-entry motion. One behaviour used everywhere so the page has a single rhythm rather
 * than a collection of effects: a short rise, no scale, no blur. `once` means nothing re-animates
 * on the way back up — re-triggering reads as a gimmick and makes long pages feel restless.
 *
 * useReducedMotion is honoured by rendering the final state directly (initial={false}), so the
 * content is never left invisible for anyone who opts out.
 */
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.16, 0.8, 0.24, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Section header. Heading left, supporting line right on desktop — one shape reused by every
 * light section so the eye finds the start of each one in the same place.
 */
function SectionHead({
  eyebrow,
  title,
  aside,
}: {
  eyebrow: string;
  title: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <Reveal>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
        <div className="max-w-xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-5 font-display text-[2.4rem] leading-[1.04] tracking-[-0.02em] text-pitch-black md:text-[3rem]">
            {title}
          </h2>
        </div>
        {aside && <p className="max-w-sm text-[15px] leading-relaxed text-slate md:pb-2">{aside}</p>}
      </div>
    </Reveal>
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
  const [openReason, setOpenReason] = useState(0);
  // The escrow card overlaps the hero photo from md up and stacks beneath it below that; the
  // float only makes sense in the overlapping state.
  const [floats, setFloats] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setFloats(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return (
    <div className="min-h-screen bg-bone text-pitch-black font-body antialiased overflow-x-hidden">
      {/* ---------------------------------------------------------------- Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-pitch-black/[0.08] bg-bone">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Plain anchor (not next/link) so every click does a full reload of the main page */}
          <a href="/" className="flex items-center">
            <PlugrWordmark className="h-6 text-pitch-black" />
          </a>
          <div className="hidden md:flex items-center gap-9 text-sm font-semibold text-pitch-black/80">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-gold transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/app" className="inline-flex items-center gap-1.5 rounded-pill bg-gold text-pitch-black text-sm font-bold px-4 sm:px-5 py-2.5 hover:bg-gold-light active:scale-95 transition-all">
              Use Plugr <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="md:hidden text-pitch-black" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="fixed right-5 top-18.25 z-40 flex h-fit w-45 flex-col gap-2 rounded-3xl border border-pitch-black/10 bg-white p-6 md:hidden animate-in slide-in-from-top-10 duration-500">
            <Link href="#how" onClick={() => setMenuOpen(false)} className="text-md font-bold text-pitch-black">How it Works</Link>
            <Link href="#why" onClick={() => setMenuOpen(false)} className="text-md font-bold text-pitch-black">Why Plugr</Link>
            <Link href="#trades" onClick={() => setMenuOpen(false)} className="text-md font-bold text-pitch-black">Trades</Link>
            <Link href="#faq" onClick={() => setMenuOpen(false)} className="text-md font-bold text-pitch-black">FAQ</Link>
          </div>
        )}
      </nav>

      {/* --------------------------------------------------------------- Hero */}
      {/* Centred, with the proof image spanning full width beneath it rather than beside the
          copy — the headline gets the whole measure, and the photograph then acts as evidence
          for the claim above it. Flat bone ground, no pattern: the page uses no gradients and
          no background texture anywhere. */}
      <header className="relative overflow-hidden px-5 pb-20 pt-32 md:pt-40">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          variants={heroContainer}
          initial={reduce ? undefined : 'hidden'}
          animate={reduce ? undefined : 'show'}
        >
          {/* No eyebrow pill. A full sentence set inside a pill is a shape nothing on a real
              site uses — it reads as decoration looking for a job. The headline carries the
              opening on its own, the way the reference's does. */}
          <motion.h1
            variants={heroItem}
            className="font-display text-[3.25rem] leading-[0.95] tracking-[-0.03em] text-pitch-black md:text-[4.75rem]"
          >
            Know exactly <span className="text-gold">who&rsquo;s</span> fixing your home.
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-slate md:text-[19px]"
          >
            NIN-verified electricians and plumbers in Yaba. Your money sits in escrow until the
            job&rsquo;s done right — booked on WhatsApp, no app to install.
          </motion.p>

          <motion.div variants={heroItem} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/app/browse" className={btnGold}>
              Book a Plug <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/app/signup" className={btnAlt}>
              Become a Plug
            </Link>
          </motion.div>

          <motion.div variants={heroItem} className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { icon: <UserCheck className="h-4 w-4" />, label: 'NIN Verified' },
              { icon: <Lock className="h-4 w-4" />, label: 'Escrow Protected' },
              { icon: <FaWhatsapp className="h-4 w-4" />, label: 'WhatsApp Native' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-pitch-black">
                <span className="shrink-0 text-gold">{b.icon}</span>
                <span className="text-[13px] font-semibold">{b.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Proof image, full width under the copy, with the escrow card overlapping its edge. */}
        <motion.div
          className="relative mx-auto mt-16 max-w-5xl"
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 0.25 }}
        >
          <div className="overflow-hidden rounded-[28px] border border-pitch-black/10">
            <img
              src={IMG.hero}
              alt="An artisan in safety glasses working with a hand tool"
              className="h-72 w-full object-cover md:h-[26rem]"
              loading="eager"
            />
          </div>

          <motion.div
            className="relative mt-4 w-full rounded-2xl border border-pitch-black/10 bg-white p-5 md:absolute md:-bottom-6 md:left-8 md:mt-0 md:w-64"
            // Only floats on desktop, where it overlaps the photo. Stacked under the image on
            // mobile it would just drift against static copy.
            animate={reduce || !floats ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-pitch-black">
                <PlugrMark className="h-4 w-4" />
                <span className="font-display text-base">Escrow</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-gold/30 px-2.5 py-1 text-10 font-bold uppercase tracking-widest text-[#8a5a08]">
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> Held
              </span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate">Amount held</p>
            <p className="tnum mt-0.5 font-display text-[2.25rem] leading-none text-pitch-black">
              <span className="text-gold/90">₦</span>7,500
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-bone px-3 py-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-gold" />
              <span className="text-[11px] text-pitch-black">Safe until you confirm.</span>
            </div>
          </motion.div>
        </motion.div>
      </header>

      {/* ------------------------------------------------------- The case (post-hero) */}
      {/* Sits between the hero and everything else on purpose: the argument for why Plugr
          should exist has to land before any feature list, or the features read as a
          list of nice-to-haves rather than the answer to a problem the reader recognises. */}
      <section className="px-5 pt-4 pb-28 md:pb-36">
        <Reveal className="mx-auto max-w-3xl">
          {/* One scene, told straight. The last sentence is the thesis of the whole page, so it
              gets its own line and the only colour in the block — everything before it is the
              setup and stays in the reading tone. */}
          <p className="font-display text-[1.75rem] leading-[1.28] tracking-[-0.01em] text-pitch-black md:text-[2.35rem] md:leading-[1.24]">
            It&rsquo;s 9pm and your shower&rsquo;s leaking. You call the number your neighbor gave you
            two years ago — it rings out. You try someone else. A different guy shows up. The
            ₦5,000 quote is ₦15,000 by the time he&rsquo;s done, and he&rsquo;s gone before you notice
            the tile&rsquo;s cracked.
          </p>
          <p className="mt-7 font-display text-[1.75rem] leading-[1.28] tracking-[-0.01em] text-gold md:text-[2.35rem]">
            You still don&rsquo;t know his name.
          </p>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------------ Identity */}
      {/* The thesis. Deliberately ABOVE "How it works" — the mechanics only matter once the
          reader accepts the premise that who shows up is the thing being fixed. */}
      <section className="px-5 pb-20">
        <Reveal className="max-w-5xl mx-auto">
          <div className="rounded-4xl bg-pitch-black text-white p-10 md:p-16">
            <Eyebrow tone="dark">Identity</Eyebrow>
            <p className="mt-7 font-display text-[1.75rem] leading-[1.24] tracking-[-0.01em] text-white md:text-[2.6rem]">
              Every Plug here has a name, a{' '}
              <span className="text-gold">verified NIN</span>, and a job history that follows him
              from client to client.
            </p>
            <p className="mt-7 max-w-2xl text-[17px] leading-relaxed text-bone-muted md:text-[19px]">
              Not a number scrawled on a receipt. A person you&rsquo;d recognize if you saw him twice.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------ How it works */}
      <section id="how" className="border-y border-pitch-black/[0.08] bg-white px-5 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <SectionHead
            eyebrow="How it works"
            title={<>Three steps to a job done right.</>}
            aside="The whole flow runs on WhatsApp. No app to install, no account to remember."
          />
          {/* A stepper, not three equal cards: each step is offset a little lower than the one
              before and separated by a hairline, so the eye travels left-to-right the way the
              flow actually runs. The "Step n" badge sits above each, as in the reference. */}
          <div className="mt-16 grid gap-y-10 md:grid-cols-3 md:gap-y-0">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.12}>
                <div
                  className={
                    'group h-full pl-0 md:pl-8 ' +
                    (i > 0 ? 'md:border-l md:border-pitch-black/[0.09] ' : '') +
                    (i === 1 ? 'md:mt-10 ' : i === 2 ? 'md:mt-20 ' : '')
                  }
                >
                  <span className="inline-flex items-center gap-2 rounded-pill border border-pitch-black/10 bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-pitch-black/70">
                    Step {step.n.replace(/^0/, '')}
                  </span>
                  <h3 className="mt-6 font-display text-[1.45rem] leading-[1.18] text-pitch-black transition-colors duration-300 group-hover:text-gold">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-slate">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Why Plugr */}
      {/* Split panel: the reasons as an expandable list on the left, a photograph on the right.
          Replaces a row of five equal cards — the most generic shape a feature section can take,
          and one that gave every reason the same weight when they are not equally interesting.
          One is open at a time, so the section has a focal point instead of five. */}
      <section id="why" className="px-5 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <SectionHead
            eyebrow="Why Plugr"
            title={<>Built different. <span className="text-slate">WhatsApp layered.</span></>}
            aside="Escrow, identity and dispute cover — the parts that decide whether you trust a stranger in your home."
          />

          <Reveal>
            <div className="mt-14 grid overflow-hidden rounded-[28px] border border-pitch-black/[0.09] bg-white md:grid-cols-2">
              {/* left: the list */}
              <div className="p-6 md:p-8">
                {REASONS.map((r, i) => {
                  const open = openReason === i;
                  return (
                    <div key={r.title} className={i > 0 ? 'border-t border-pitch-black/[0.07]' : ''}>
                      <button
                        onClick={() => setOpenReason(i)}
                        aria-expanded={open}
                        className="group flex w-full items-center gap-3 py-4 text-left"
                      >
                        <span
                          className={
                            'grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors duration-200 ' +
                            (open ? 'border-gold bg-gold text-pitch-black' : 'border-pitch-black/10 text-slate group-hover:border-gold/50 group-hover:text-gold')
                          }
                        >
                          {r.icon}
                        </span>
                        <span className={'text-[15px] font-bold transition-colors ' + (open ? 'text-pitch-black' : 'text-slate group-hover:text-pitch-black')}>
                          {r.title}
                        </span>
                      </button>
                      {open && (
                        <p className="max-w-sm pb-5 pl-12 text-[14.5px] leading-relaxed text-slate">{r.body}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* right: the photograph, bleeding to the panel edge */}
              <div className="relative min-h-64 border-t border-pitch-black/[0.07] md:min-h-0 md:border-l md:border-t-0">
                <img
                  src={IMG.panel}
                  alt="An electrician working on a breaker panel"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-pitch-black/10 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <PlugrMark className="h-4 w-4 text-pitch-black" />
                    <p className="font-display text-[15px] text-pitch-black">
                      Skilled workers deserve a professional identity.
                    </p>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate">
                    Plugr turns artisans from anonymous contacts into trusted professionals — visible
                    identity and verified work history.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ Trades */}
      <section id="trades" className="border-y border-pitch-black/[0.08] bg-white px-5 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <SectionHead
            eyebrow="What we fix"
            title={<>Your trade, covered.</>}
            aside="Electricians and plumbers first, in Yaba. More trades as we verify them."
          />
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { img: IMG.electrician, alt: 'A technician working on an electrical control panel', icon: <Zap className="h-5 w-5" />, title: 'Electrician', body: 'Wiring, sockets, faults, lighting, and general electrical maintenance.', cta: 'Find an electrician' },
              { img: IMG.plumber, alt: 'A plumber repairing a pipe with a wrench', icon: <Droplet className="h-5 w-5" />, title: 'Plumber', body: 'Pipes, leaks, fixtures, water heaters, and drainage solutions.', cta: 'Find a plumber' },
              { img: IMG.furniture, alt: 'A carpenter cutting wood in a workshop', icon: <Hammer className="h-5 w-5" />, title: 'Furniture', body: 'Custom furniture, wardrobes, cabinets, repairs, and finishing.', cta: 'Find a furniture maker' },
            ].map((t, i) => (
              <Reveal key={t.title} delay={i * 0.1}>
                <Link
                  href="/app/browse"
                  aria-label={t.cta}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-pitch-black/[0.09] bg-white transition-colors hover:border-gold/50"
                >
                  {/* The photo sits inset on a tinted ground rather than bleeding to the card
                      edge — the reference's treatment, and it stops three photographs in a row
                      reading as a gallery. */}
                  <div className="bg-bone p-4">
                    <div className="relative h-48 overflow-hidden rounded-2xl">
                      <img
                        src={t.img}
                        alt={t.alt}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <span className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-xl border border-pitch-black/10 bg-white text-gold">
                        {t.icon}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-[1.5rem] text-pitch-black">{t.title}</h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-slate">{t.body}</p>
                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-pitch-black/[0.07] pt-5">
                      <span className="text-[13px] font-bold text-pitch-black">{t.cta}</span>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-pitch-black/10 text-pitch-black transition-colors duration-200 group-hover:border-gold group-hover:bg-gold">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate">More trades coming soon</p>
        </div>
      </section>

      {/* -------------------------------------------------------------------- For Plugs */}
      {/* Elevated above "For clients": the supply side is the harder sell and the more
          distinctive story, so it no longer sits last before the FAQ. */}
      <section className="px-5 py-24 md:py-32">
        <Reveal className="mx-auto max-w-6xl">
          {/* Left-aligned, two columns. This was centred, which forced four lines of narrative
              copy to be read off a ragged centre axis — the hardest possible setting for the
              longest passage on the page. The story reads down the left; the payoff, the
              benefits and the CTA sit together on the right. */}
          <div className="grid gap-12 rounded-4xl bg-pitch-black p-10 text-white md:grid-cols-2 md:gap-16 md:p-14">
            <div>
              <Eyebrow tone="dark">For Plugs</Eyebrow>
              <p className="mt-7 font-display text-[1.5rem] leading-[1.3] text-white md:text-[1.85rem]">
                You show up to a new client&rsquo;s house, and it&rsquo;s the same thing every time — they&rsquo;re
                sizing you up, wondering if you&rsquo;ll overcharge, wondering if you actually know what
                you&rsquo;re doing.
              </p>
              <p className="mt-6 text-[16px] leading-relaxed text-bone-muted">
                Twenty years in the trade, and you&rsquo;re still proving yourself from zero, every single job.
              </p>
            </div>

            <div className="flex flex-col justify-between">
              <h2 className="font-display text-[1.9rem] leading-[1.14] tracking-[-0.01em] text-gold md:text-[2.4rem]">
                Plugr changes that. Your NIN. Your job history. Your name — already known before you
                ring the bell.
              </h2>

              <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7">
                {[
                  { icon: <BadgeCheck className="h-5 w-5" />, label: 'Set your price' },
                  { icon: <UserCheck className="h-5 w-5" />, label: 'Build identity' },
                  { icon: <Clock className="h-5 w-5" />, label: 'Consistent work' },
                  { icon: <ShieldCheck className="h-5 w-5" />, label: 'Get paid safely' },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 text-gold">
                      {b.icon}
                    </span>
                    <span className="text-[13px] font-semibold text-white/90">{b.label}</span>
                  </div>
                ))}
              </div>

              <Link href="/app/signup" className={btnGold + ' mt-10 w-full sm:w-auto sm:self-start'}>
                Become a Plug <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ----------------------------------------------------------------- For clients */}
      <section className="border-y border-pitch-black/[0.08] bg-white px-5 py-24 md:py-32">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <Eyebrow>For clients</Eyebrow>
            <h2 className="mt-5 font-display text-[2.4rem] leading-[1.04] tracking-[-0.02em] text-pitch-black md:text-[3rem]">
              No more random referrals.
            </h2>
            <div className="mt-9 space-y-4">
              {['Hire verified electricians and plumbers', 'Track payments securely', 'Get quote transparency', 'Raise disputes when necessary'].map((t, i) => (
                <div key={t} className="flex items-center gap-3">
                  <span className="grid place-items-center h-7 w-7 rounded-full bg-gold text-pitch-black text-xs font-black shrink-0">{i + 1}</span>
                  <span className="text-pitch-black font-medium">{t}</span>
                </div>
              ))}
            </div>
            <Link href="/app/browse" className={btnGold + ' mt-8'}>
              Book a Plug <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-pitch-black/[0.09] bg-bone p-8">
              <div className="flex items-center gap-2 text-slate mb-6">
                <Clock className="w-4 h-4 text-gold" />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Escrow timeline</span>
              </div>
              {['Client pays into escrow', 'Plug completes the job', 'Client confirms', 'Funds released'].map((t, i, a) => (
                <div key={t} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="grid place-items-center h-5 w-5 rounded-full bg-gold">
                      <span className="h-1.5 w-1.5 rounded-full bg-pitch-black" />
                    </span>
                    {i < a.length - 1 && <span className="w-0.5 flex-1 bg-gold/40 my-1" />}
                  </div>
                  <span className="text-sm text-pitch-black font-medium pb-5">{t}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------------------- FAQ */}
      {/* Two columns: the heading holds the left rail while the answers scroll past it on the
          right. A centred narrow column made this read as an afterthought tacked to the end. */}
      <section id="faq" className="px-5 py-24 md:py-32">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
          <Reveal>
            <div className="md:sticky md:top-28">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="mt-5 font-display text-[2.4rem] leading-[1.04] tracking-[-0.02em] text-pitch-black md:text-[3rem]">
                Common questions.
              </h2>
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-slate">
                How payment, verification and disputes actually work — before you book.
              </p>
            </div>
          </Reveal>

          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.06}>
                <div className="overflow-hidden rounded-2xl border border-pitch-black/[0.09] bg-white transition-colors duration-200 hover:border-gold/50">
                  <button
                    onClick={() => setOpenFaq((o) => (o === i ? null : i))}
                    aria-expanded={openFaq === i}
                    className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors duration-200 hover:bg-bone/60"
                  >
                    <span className="font-bold text-pitch-black">{f.q}</span>
                    <Plus className={'h-5 w-5 shrink-0 text-gold transition-transform duration-300 ' + (openFaq === i ? 'rotate-45' : '')} />
                  </button>
                  {openFaq === i && <p className="-mt-1 px-6 pb-6 text-[15px] leading-relaxed text-slate">{f.a}</p>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- Final CTA */}
      {/* A contained band, not a full-bleed slab: the page keeps its bone ground right up to the
          footer, and the closing ask reads as a panel placed on it. */}
      <section className="px-5 pb-24 pt-8 md:pb-32">
        <Reveal className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[32px] bg-pitch-black px-6 py-20 text-center md:py-24">
            <div className="relative">
              <Eyebrow tone="dark">Launching in Yaba</Eyebrow>
              <h2 className="mx-auto mt-7 max-w-3xl font-display text-[2.6rem] leading-[1.02] tracking-[-0.02em] text-white md:text-[4rem]">
                Know your Plug —<br className="sm:hidden" />{' '}
                <span className="text-gold">starting in Yaba.</span>
              </h2>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/app/browse" className={btnGold}>
                  Book a Plug <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/app/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-pill border border-white/25 bg-transparent px-7 py-4 font-bold text-white transition-all duration-200 hover:border-gold hover:text-gold active:scale-[0.98]"
                >
                  Become a Plug
                </Link>
              </div>

              {/* Honest trust row — the three things that are actually true today, stated as
                  facts rather than as a strip of partner logos we do not have. */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/10 pt-8">
                {['NIN-verified Plugs', 'Escrow-held payments', '30-day fault guarantee'].map((t) => (
                  <span key={t} className="flex items-center gap-2 text-[13px] text-bone-muted">
                    <Check className="h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={3} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ----------------------------------------------------------------- Footer */}
      <SiteFooter />
    </div>
  );
}
