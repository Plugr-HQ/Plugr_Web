'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import './waitlist.css';

// Initialize Supabase Client
const supabaseUrl = 'https://rzxajmbgwwcmwxltcgeb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eGFqbWJnd3djbXd4bHRjZ2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTk5NDAsImV4cCI6MjA5MTMzNTk0MH0.l7iJ_585GkaJc7auSlUxzcG2hV85kiG0mmNvQsfnnok';
const supabase = createClient(supabaseUrl, supabaseKey);

const WA_CHANNEL = 'https://whatsapp.com/channel/0029Vb7c8SrLNSZyrvYXE60M';

export default function WaitlistPage() {
  const [currentType, setCurrentType] = useState<'plug' | 'client'>('plug');
  const [liveCount, setLiveCount] = useState<number>(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [trade, setTrade] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  // Fetch live count on mount and subscribe to real-time updates
  useEffect(() => {
    async function updateLiveCount() {
      try {
        const { count, error } = await supabase
          .from('Plugr Waitlist')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('Supabase Error:', error.message);
          return;
        }
        setLiveCount(count || 0);
      } catch (err) {
        console.error('Connection Error:', err);
      }
    }
    updateLiveCount();

    // Subscribe to real-time updates for new sign‑ups
    const channel = supabase
      .channel('public:Plugr Waitlist')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Plugr Waitlist' },
        (payload) => {
          console.log('New waitlist entry', payload);
          // Increment the live count when a new record is inserted
          setLiveCount((prev) => (prev ?? 0) + 1);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // WhatsApp Channel navigation helper
  const handleJoinChannel = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(WA_CHANNEL, '_blank');
  };

  // Submit form data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !phone.trim() || !email.trim() || !location.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (currentType === 'plug' && !trade) {
      setErrorMsg('Please select your trade.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('Plugr Waitlist')
        .insert([{
          'Type': currentType,
          'Full Name': name.trim(),
          'Phone Number': phone.trim(),
          'Email': email.trim(),
          'Location': location.trim(),
          'Skill': currentType === 'plug' ? trade : null,
        }]);

      if (error) {
        console.error('Insert error:', error);
        if (error.code === '23505') {
          setErrorMsg('This email or phone is already on the waitlist.');
        } else {
          setErrorMsg(error.message || 'Something went wrong. Try again.');
        }
        setIsSubmitting(false);
        return;
      }

      // Fetch updated count
      const { count } = await supabase
        .from('Plugr Waitlist')
        .select('*', { count: 'exact', head: true });

      const totalSignups = count || 1;
      setIsSuccess(true);
      
      // Ticking animation for success state
      let currentDisplay = 0;
      setSuccessCount(0);
      const interval = setInterval(() => {
        if (currentDisplay >= totalSignups) {
          clearInterval(interval);
          return;
        }
        currentDisplay++;
        setSuccessCount(currentDisplay);
      }, 100);

    } catch (err) {
      console.error('Signup error:', err);
      setErrorMsg('Could not connect. Check your internet and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="waitlist-body">
      <div className="waitlist-col-divider"></div>
      <div className="waitlist-vert-text">Launching in Ikeja, Lagos &mdash; Nigeria</div>

      <div className="waitlist-page">
        {/* NAV */}
        <nav className="waitlist-nav">
          <div className="waitlist-logo">
            <Image src="/logo.svg" className="waitlist-logo-dot" alt="Plugr Logo" width={145} height={35} priority />
          </div>
          <div className="waitlist-nav-tag">Early Access</div>
        </nav>

        {/* HERO LEFT */}
        <section className="waitlist-hero-left">
          <div className="waitlist-badge">
            <div className="waitlist-badge-dot"></div>
            <span>Now accepting early sign-ups</span>
          </div>

          <h1 className="waitlist-h1">
            Your skill<br />
            <span className="accent">deserves</span> to<br />
            <span className="outline">be seen.</span>
          </h1>

          <p className="waitlist-hero-desc">
            Plugr gives Nigerian artisans a verified professional identity — making them visible, credible, and trusted.
            Clients find reliable tradespeople they can actually trust.
          </p>

          <div className="waitlist-stats">
            <div className="waitlist-stat">
              <div className="waitlist-stat-num">Ikeja<span className="g">,</span></div>
              <div className="waitlist-stat-label">Launch City</div>
            </div>
            <div className="waitlist-stat-divider"></div>
            <div className="waitlist-stat">
              <div className="waitlist-stat-num"><span className="g">2</span></div>
              <div className="waitlist-stat-label">Trades First</div>
            </div>
            <div className="waitlist-stat-divider"></div>
            <div className="waitlist-stat">
              <div className="waitlist-stat-num"><span className="g">0</span> fraud</div>
              <div className="waitlist-stat-label">Our promise</div>
            </div>
          </div>

          <div className="waitlist-proof">
            <div className="waitlist-avatars">
              <div className="waitlist-av waitlist-av1">A</div>
              <div className="waitlist-av waitlist-av2">K</div>
              <div className="waitlist-av waitlist-av3">T</div>
              <div className="waitlist-av waitlist-av4">F</div>
            </div>
            <div className="waitlist-proof-text">
              <strong>{liveCount}</strong>+ people already on the waitlist.<br />
              Artisans &amp; clients both welcome.
            </div>
          </div>
        </section>

        {/* HERO RIGHT */}
        <section className="waitlist-hero-right">
          <div className="waitlist-form-card">
            {!isSuccess ? (
              <div id="form-content">
                <div className="waitlist-form-eyebrow">Join the waitlist</div>
                <div className="waitlist-form-title">Get your edge first.</div>
                <div className="waitlist-form-sub">
                  Be among the first verified on Plugr when we launch.
                  Connecting plugs to clients and clients to plugs
                </div>

                <div className="waitlist-toggle-wrap">
                  <button
                    type="button"
                    className={`waitlist-toggle-btn ${currentType === 'plug' ? 'active' : ''}`}
                    onClick={() => setCurrentType('plug')}
                  >
                    I&rsquo;m a Plug
                  </button>
                  <button
                    type="button"
                    className={`waitlist-toggle-btn ${currentType === 'client' ? 'active' : ''}`}
                    onClick={() => setCurrentType('client')}
                  >
                    I need a Plug
                  </button>
                </div>

                <form id="signup-form" onSubmit={handleSubmit}>
                  <div className="waitlist-field-group">
                    <div className="waitlist-field">
                      <label className="waitlist-label">Full Name</label>
                      <input
                        type="text"
                        className="waitlist-input"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="waitlist-field">
                      <label className="waitlist-label">WhatsApp Number</label>
                      <input
                        type="tel"
                        className="waitlist-input"
                        placeholder="+234 — your active number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="waitlist-field">
                      <label className="waitlist-label">Email Address</label>
                      <input
                        type="email"
                        className="waitlist-input"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="waitlist-field">
                      <label className="waitlist-label">Location in Lagos</label>
                      <input
                        type="text"
                        className="waitlist-input"
                        placeholder="e.g. Ikeja, Surulere, Yaba"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                      />
                    </div>

                    <div className={`waitlist-field waitlist-skill-row ${currentType === 'plug' ? 'visible' : ''}`}>
                      <label className="waitlist-label">Your Trade</label>
                      <select
                        id="trade-select"
                        className="waitlist-select"
                        value={trade}
                        onChange={(e) => setTrade(e.target.value)}
                        required={currentType === 'plug'}
                      >
                        <option value="" disabled>Select your trade</option>
                        <option value="Electrician">Electrician</option>
                        <option value="Plumber">Plumber</option>
                        <option value="Carpenter">Carpenter</option>
                        <option value="Painter">Painter</option>
                        <option value="Tiler">Tiler</option>
                        <option value="Welder">Welder</option>
                        <option value="AC Technician">AC Technician</option>
                        <option value="Generator Technician">Generator Technician</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="waitlist-btn-submit" id="submit-btn" disabled={isSubmitting}>
                    {isSubmitting
                      ? 'Submitting\u2026'
                      : currentType === 'plug'
                        ? 'Join as a Plug \u2192'
                        : 'Join as a Client \u2192'}
                  </button>

                  {errorMsg && (
                    <p
                      id="form-error"
                      style={{
                        fontFamily: 'Satoshi, sans-serif',
                        fontSize: '12px',
                        color: '#E8A020',
                        marginTop: '8px',
                        textAlign: 'center',
                        lineHeight: '1.4',
                      }}
                    >
                      {errorMsg}
                    </p>
                  )}
                </form>

                <a href="#" className="waitlist-btn-wa" onClick={handleJoinChannel} style={{ marginTop: '12px' }}>
                  <svg className="waitlist-wa-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Join our WhatsApp channel for updates
                </a>

                <p className="waitlist-form-note">No spam. No fake promises. Real updates as we build.</p>
              </div>
            ) : (
              /* Success State */
              <div className="waitlist-success-state visible" id="success-state">
                <div className="waitlist-success-icon">&#10003;</div>
                <div className="waitlist-success-title">You&rsquo;re on the list.</div>
                <div className="waitlist-success-sub">
                  We&rsquo;ll reach out before launch day. Join our WhatsApp channel to watch us build in real time.
                </div>
                <div>
                  <div className="waitlist-success-count" id="counter">{successCount}</div>
                  <div className="waitlist-success-count-label">people ahead of the curve</div>
                </div>
                <a href="#" className="waitlist-btn-wa" style={{ marginTop: '8px' }} onClick={handleJoinChannel}>
                  <svg className="waitlist-wa-icon" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Join WhatsApp Channel
                </a>
              </div>
            )}
          </div>
        </section>

        {/* BOTTOM STRIP */}
        <div className="waitlist-bottom-strip">
          <div className="waitlist-features-row">
            <div className="waitlist-feature-pill">
              <div className="dot"></div>NIN-verified profiles
            </div>
            <div className="waitlist-feature-pill">
              <div className="dot"></div>Naira-based payments
            </div>
            <div className="waitlist-feature-pill">
              <div className="dot"></div>Electricians &amp; Plumbers first
            </div>
            <div className="waitlist-feature-pill">
              <div className="dot"></div>Built for Nigeria
            </div>
          </div>
          <div className="waitlist-launch-tag">
            Launching in Ikeja &middot; 2026
          </div>
        </div>
      </div>
    </div>
  );
}
