'use client';

import React, { useRef, useState } from 'react';
import './waitlist.css';

const WA_CHANNEL = 'https://whatsapp.com/channel/0029Vb7c8SrLNSZyrvYXE60M';

type UserType = 'client' | 'artisan';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function WaitlistPage() {
  const formRef = useRef<HTMLElement>(null);

  const [userType, setUserType] = useState<UserType | null>(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const canSubmit = userType !== null && email.trim().length > 0 && status !== 'loading';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userType || !EMAIL_RE.test(email.trim())) {
      setStatus('error');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), userType }),
      });

      if (!res.ok) {
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="wl">
      {/* ============ SECTION 1 — HERO ============ */}
      <section className="wl-hero">
        <div className="wl-hero-inner">
          {/* Dev team replaces wordmark with the actual SVG logo later */}
          <p className="wl-wordmark">Plugr</p>
          <p className="wl-tagline">Pledging allegiance to your success.</p>

          <h1 className="wl-hero-h1">The artisan lottery ends here.</h1>

          <p className="wl-hero-sub">
            Lagos&rsquo;s first platform that verifies artisans before they knock on your
            door &mdash; and gives skilled tradespeople a professional identity that opens doors.
          </p>

          <p className="wl-hero-accent">
            Launching in Ikeja &middot; Electricians &amp; Plumbers first &middot; 2026
          </p>

          <button type="button" className="wl-cta" onClick={scrollToForm}>
            Join the waitlist &rarr;
          </button>
        </div>
      </section>

      {/* ============ SECTION 2 — THE PROBLEM ============ */}
      <section className="wl-section wl-problem">
        <div className="wl-inner">
          <p className="wl-label">The Problem</p>
          <h2 className="wl-section-h2">Two sides of the same broken system.</h2>

          <div className="wl-two-col">
            {/* For Clients */}
            <div className="wl-card">
              <p className="wl-card-label">If you&rsquo;ve ever hired an artisan in Lagos&hellip;</p>
              <ul className="wl-pain-list">
                <li>You asked your neighbour. That was the entire vetting process.</li>
                <li>They quoted one price on the phone. A different price at your door.</li>
                <li>They didn&rsquo;t show up. No call. No explanation.</li>
                <li>You let a stranger into your home with no way to know who they were.</li>
                <li>The work was wrong. They didn&rsquo;t answer when you called back.</li>
              </ul>
              <p className="wl-card-close">
                This is not bad luck. It&rsquo;s the absence of infrastructure.
              </p>
            </div>

            {/* For Artisans */}
            <div className="wl-card">
              <p className="wl-card-label">If you&rsquo;re a skilled artisan in Lagos&hellip;</p>
              <ul className="wl-pain-list">
                <li>You have years of experience. No way to prove it to a stranger.</li>
                <li>Your reputation lives in your street. Invisible everywhere else.</li>
                <li>New clients don&rsquo;t trust you until you&rsquo;ve already done the job.</li>
                <li>Some clients disappear after the work is done.</li>
                <li>Banks won&rsquo;t give you credit. You have no financial record.</li>
              </ul>
              <p className="wl-card-close">
                The problem was never your skill. It was that nobody could see it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECTION 3 — THE CONTEXT ============ */}
      <section className="wl-section wl-context">
        <div className="wl-inner">
          <div className="wl-stats">
            <div>
              <p className="wl-stat-num">93%</p>
              <p className="wl-stat-label">of Nigeria&rsquo;s workforce operates informally (NBS, 2024)</p>
            </div>
            <div>
              <p className="wl-stat-num">4M+</p>
              <p className="wl-stat-label">artisans in Nigeria&rsquo;s construction trades alone</p>
            </div>
            <div>
              <p className="wl-stat-num">58%</p>
              <p className="wl-stat-label">of Nigeria&rsquo;s GDP comes from the informal sector</p>
            </div>
          </div>

          <p className="wl-context-foot">
            Millions of skilled hands building this country. Almost none of them visible,
            verified, or financially recognised.
          </p>
        </div>
      </section>

      {/* ============ SECTION 4 — THE SOLUTION ============ */}
      <section className="wl-section wl-solution">
        <div className="wl-inner">
          <p className="wl-label">The Solution</p>
          <h2 className="wl-section-h2">Plugr fixes both sides.</h2>
          <p className="wl-section-sub">
            Not a job board. Not a referral app. A verified identity platform &mdash; built for
            the artisan, trusted by the client.
          </p>

          <div className="wl-two-col">
            {/* For Clients */}
            <div className="wl-card">
              <p className="wl-card-label">For Clients</p>
              <ol className="wl-steps">
                <li>Browse verified Plugs by trade &mdash; electricians, plumbers</li>
                <li>View their verified badge, ratings, and completed job history</li>
                <li>Book directly. Pay safely through escrow.</li>
                <li>Confirm the job is done right before payment releases.</li>
                <li>Rate your Plug. Build the record.</li>
              </ol>
              <p className="wl-card-close wl-muted">
                No more guessing. No more strangers. A Plug you already know before they arrive.
              </p>
            </div>

            {/* For Plugs */}
            <div className="wl-card">
              <p className="wl-card-label">For Plugs</p>
              <ol className="wl-steps">
                <li>Complete identity verification &mdash; NIN, liveness check, guarantor</li>
                <li>Earn your Verified Plug badge</li>
                <li>Get matched with clients in your area</li>
                <li>Complete the job. Payment lands in your Plugr wallet.</li>
                <li>Build a professional record that follows you everywhere.</li>
              </ol>
              <p className="wl-card-close wl-muted">
                Your skill was always there. Now the proof is too.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECTION 5 — WAITLIST FORM ============ */}
      <section className="wl-section wl-form-section" ref={formRef}>
        <div className="wl-form-inner">
          {status !== 'success' ? (
            <>
              <p className="wl-label">Early Access</p>
              <h2 className="wl-section-h2">Get early access.</h2>
              <p className="wl-section-sub">
                Be among the first when we launch in Ikeja. No spam. Real updates only.
              </p>

              <form className="wl-form" onSubmit={handleSubmit} noValidate>
                <div className="wl-type-grid">
                  <button
                    type="button"
                    className={`wl-type-card ${userType === 'client' ? 'selected' : ''}`}
                    aria-pressed={userType === 'client'}
                    onClick={() => setUserType('client')}
                  >
                    <p className="wl-type-card-title">I need a Plug</p>
                    <p className="wl-type-card-desc">I&rsquo;m a client looking for verified artisans</p>
                  </button>

                  <button
                    type="button"
                    className={`wl-type-card ${userType === 'artisan' ? 'selected' : ''}`}
                    aria-pressed={userType === 'artisan'}
                    onClick={() => setUserType('artisan')}
                  >
                    <p className="wl-type-card-title">I am a Plug</p>
                    <p className="wl-type-card-desc">I&rsquo;m an artisan ready to get verified</p>
                  </button>
                </div>

                <input
                  type="email"
                  className="wl-email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  autoComplete="email"
                />

                <button type="submit" className="wl-submit" disabled={!canSubmit}>
                  {status === 'loading' ? 'Joining…' : 'Join the waitlist →'}
                </button>

                {status === 'error' && (
                  <p className="wl-error">Something went wrong. Try again.</p>
                )}
              </form>
            </>
          ) : (
            <div className="wl-success">
              <h2 className="wl-success-h2">You&rsquo;re on the list.</h2>
              <p className="wl-success-body">
                We&rsquo;ll reach out when early access opens in Ikeja. In the meantime, follow
                along as we build.
              </p>
              <a
                className="wl-wa-link"
                href={WA_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Join our WhatsApp channel for live updates &rarr;
              </a>
            </div>
          )}

          {/* Always visible — not part of the success swap */}
          <div className="wl-follow">
            <p className="wl-follow-q">Already want to follow along?</p>
            <a
              className="wl-wa-link"
              href={WA_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join our WhatsApp channel for updates &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* ============ SECTION 6 — FOOTER ============ */}
      <footer className="wl-footer">
        {/* Dev team replaces wordmark with the actual SVG logo later */}
        <p className="wl-wordmark">Plugr</p>
        <p className="wl-tagline">Pledging allegiance to your success.</p>

        {/* Placeholder social links — dev team wires up real URLs + branded icons */}
        <div className="wl-social">
          <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.95c-3.15 0-3.52.01-4.76.07-.92.04-1.42.2-1.75.33-.44.17-.75.37-1.08.7-.33.33-.53.64-.7 1.08-.13.33-.29.83-.33 1.75-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.04.92.2 1.42.33 1.75.17.44.37.75.7 1.08.33.33.64.53 1.08.7.33.13.83.29 1.75.33 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.92-.04 1.42-.2 1.75-.33.44-.17.75-.37 1.08-.7.33-.33.53-.64.7-1.08.13-.33.29-.83.33-1.75.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.04-.92-.2-1.42-.33-1.75a2.9 2.9 0 0 0-.7-1.08 2.9 2.9 0 0 0-1.08-.7c-.33-.13-.83-.29-1.75-.33-1.24-.06-1.61-.07-4.76-.07zm0 3.32a4.57 4.57 0 1 1 0 9.14 4.57 4.57 0 0 1 0-9.14zm0 7.54a2.97 2.97 0 1 0 0-5.94 2.97 2.97 0 0 0 0 5.94zm5.82-7.76a1.07 1.07 0 1 1-2.14 0 1.07 1.07 0 0 1 2.14 0z" />
            </svg>
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.967 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
            </svg>
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.74v20.52C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0z" />
            </svg>
          </a>
        </div>

        <p className="wl-footer-line">
          Plugr Technologies &middot; Under Alhazen &middot; Ikeja, Lagos &middot; getplugr.com
        </p>
        <p className="wl-footer-fine">
          Nigeria&rsquo;s first verified artisan identity platform &middot; &copy; 2026
        </p>
      </footer>
    </main>
  );
}
