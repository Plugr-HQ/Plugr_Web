// src/components/plug/PlugProfileScreen.tsx
// PLG-02 — Plug Profile ("LinkedIn for Artisans"), in the Plug's own POV.
//
// Same layout as the client-facing profile clients see (cover, identity, verification,
// stats, about, skills, experience, reviews) — but owned: Edit, Digital ID, Work posts.
//
// Editable: photo + bio only. Name/trade are locked post-verification, and raw NIN/BVN is
// never displayed — the stack confirms verification happened, nothing more.
//
// Tier: Basic at launch for everyone. BVN / Guarantor / Skills are the upgrades that raise
// it, and none ship at launch — so they're shown as locked, non-blocking.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Loader2, Star, Check, Lock, Pencil, Plus, Share2, Quote, X, Camera, Briefcase,
  MapPin, Clock, Zap, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Card, Divider, GoldButton, Label, TextInput } from '@/src/components/ui';
import { jsonFetch } from '@/src/lib/net';
import { apiFetch } from '@/src/lib/api-client';
import { getPlugId } from '@/src/app/app/_lib/plugAuth';
import { tradeLabel } from '@/src/app/app/_lib/plugDisplay';
import { PlugShell, BadgeChip, EmptyState, plugTier } from './PlugChrome';
import { PlugProfileSkeleton } from '@/src/components/Skeleton';
import { DigitalId } from '@/src/app/app/_components/DigitalId';
import { withSource } from '@/src/lib/apiSource';
import { authHeaders } from '@/src/lib/api';

type WorkPost = { id: string; title: string; photos: string[]; createdAt: string };
type ExperienceEntry = { id: string; title: string; org: string; period: string; note: string };

const UPGRADES = [
  { label: 'BVN', why: 'Adds a financial identity check.' },
  { label: 'Guarantor', why: 'Someone accountable for your conduct.' },
  { label: 'Skills Assessment', why: 'Proves the trade claim, not just the badge.' },
];

function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('Could not read that image.'));
    r.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image.'));
      img.onload = () => {
        const max = 480;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.src = String(r.result);
    };
    r.readAsDataURL(file);
  });
}

export function PlugProfileScreen({ base }: { base: string }) {
  const [plug, setPlug] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showId, setShowId] = useState(false);

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  // Skills and experience are the Plug's own now — stored on PlugProfile, not generated from
  // their trade. Held as local draft state while editing and written on Save with everything else.
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState('');
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);

  const [composing, setComposing] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postPhotos, setPostPhotos] = useState<string[]>([]);
  const postRef = useRef<HTMLInputElement>(null);

  const plugId = typeof window !== 'undefined' ? getPlugId() : '';

  const load = useCallback(async () => {
    if (!plugId) return;
    try {
      const body = await apiFetch(withSource(`/api/plugs/${plugId}`, base), {}, { skipAuthRedirect: false });
      setPlug(body.plug);
      setBio(body.plug.bio ?? '');
      setPhoto(body.plug.photo_url ?? null);
      setSkills(Array.isArray(body.plug.skills) ? body.plug.skills : []);
      setExperience(Array.isArray(body.plug.experience) ? body.plug.experience : []);
      setError(null);
    } catch (e: any) {
      setError(/plug not found/i.test(e?.message ?? '') ? 'Your session expired. Sign in again.' : e.message);
    }
  }, [plugId, base]);

  useEffect(() => { load(); }, [load]);

  async function patch(payload: any) {
    // Self-service profile edit -> the split /profile route (PLUG + ownership on the backend).
    const body = await apiFetch(withSource(`/api/plugs/${plugId}/profile`, base), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    }, { skipAuthRedirect: false });
    setPlug(body.plug);
    return body.plug;
  }

  async function saveEdits() {
    setSaving(true); setError(null);
    try {
      // Commit any skill still sitting in the input — losing it because they hit Save instead of
      // Enter is exactly the kind of small betrayal that makes an editor feel unreliable.
      const pending = skillDraft.trim();
      const finalSkills = pending && !skills.some((k) => k.toLowerCase() === pending.toLowerCase())
        ? [...skills, pending]
        : skills;
      await patch({
        bio,
        photoUrl: photo,
        skills: finalSkills,
        // Drop blank rows the Plug added but never filled in.
        experience: experience.filter((e) => e.title.trim()),
      });
      setSkillDraft('');
      setEditing(false);
    }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function addSkill() {
    const v = skillDraft.trim();
    if (!v || skills.length >= 20) return;
    // Case-insensitive de-dupe, matching what the backend does on save.
    if (skills.some((k) => k.toLowerCase() === v.toLowerCase())) { setSkillDraft(''); return; }
    setSkills((prev) => [...prev, v]);
    setSkillDraft('');
  }

  function addExperience() {
    if (experience.length >= 10) return;
    setExperience((prev) => [...prev, { id: crypto.randomUUID(), title: '', org: '', period: '', note: '' }]);
  }

  function updateExperience(id: string, patchFields: Partial<ExperienceEntry>) {
    setExperience((prev) => prev.map((e) => (e.id === id ? { ...e, ...patchFields } : e)));
  }

  async function addPost() {
    if (!postTitle.trim() || !postPhotos.length) return;
    setSaving(true);
    try {
      const posts: WorkPost[] = [
        { id: crypto.randomUUID(), title: postTitle.trim(), photos: postPhotos, createdAt: new Date().toISOString() },
        ...(plug.work_posts ?? []),
      ];
      await patch({ workPosts: posts });
      setComposing(false); setPostTitle(''); setPostPhotos([]);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (!plug) {
    return (
      <PlugShell base={base} plug={null}>
        {error ? (
          <Card className="p-4 border-red-200"><p className="text-sm text-red-600">{error}</p></Card>
        ) : (
          <PlugProfileSkeleton />
        )}
      </PlugShell>
    );
  }

  const tier = plugTier(plug);
  const jobs = Number(plug.jobs_completed);
  const rating = Number(plug.rating);
  const posts: WorkPost[] = Array.isArray(plug.work_posts) ? plug.work_posts : [];
  const trade = tradeLabel(plug);
  // Reviews were three invented testimonials from invented clients, shown to any Plug with at
  // least one job. There is no review data in this product yet, so the list is always empty and
  // the honest empty state below is what renders. Wire this to real Rating rows when they exist.
  const reviews: Array<{ by: string; text: string }> = [];
  const memberSince = new Date(plug.created_at).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${plug.id}` : '';

  return (
    <PlugShell base={base} plug={plug}>
      {/* Cover + identity — the view clients see, owned */}
      <div className="rounded-3xl overflow-hidden border border-midnight/6 card-shadow bg-white rise">
        <div className="relative h-24 bg-linear-to-br from-midnight to-deep-blue">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #E8A020 0, transparent 40%)' }} />
          <div className="absolute top-3 right-3 flex gap-2">
            <button onClick={() => setShowId(true)} className="inline-flex items-center gap-1.5 rounded-pill bg-white/15 hover:bg-white/25 backdrop-blur px-3 py-1.5 text-[12px] font-bold text-white transition-colors">
              <Share2 className="w-3.5 h-3.5" /> Digital ID
            </button>
            <button onClick={() => (editing ? saveEdits() : setEditing(true))} disabled={saving} className="inline-flex items-center gap-1.5 rounded-pill bg-white/15 hover:bg-white/25 backdrop-blur px-3 py-1.5 text-[12px] font-bold text-white transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
              {editing ? 'Save' : 'Edit'}
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 -mt-10">
          <div className="relative inline-block">
            {photo ? (
              <img src={photo} alt="" className="h-20 w-20 rounded-3xl object-cover border-4 border-white" />
            ) : (
              <span className="grid place-items-center h-20 w-20 rounded-3xl bg-gold text-midnight font-display text-3xl border-4 border-white">
                {String(plug.name)[0]}
              </span>
            )}
            {editing ? (
              <button onClick={() => photoRef.current?.click()} className="absolute -bottom-1 -right-1 grid place-items-center h-7 w-7 rounded-full bg-gold text-midnight border-2 border-white" aria-label="Change photo">
                <Camera className="w-3.5 h-3.5" />
              </button>
            ) : (
              plug.verified && (
                <span className="absolute -bottom-1 -right-1 grid place-items-center h-7 w-7 rounded-full bg-white">
                  <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                </span>
              )
            )}
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await shrink(f)); }} />

          <div className="mt-3 flex items-center gap-2">
            <h1 className="font-display text-2xl text-midnight">{plug.name}</h1>
            <BadgeChip tier={tier} />
          </div>
          <p className="text-sm text-slate">{trade}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate">
            {jobs > 0 && (
              <span className="inline-flex items-center gap-1 text-midnight font-semibold">
                <Star className="w-3.5 h-3.5 fill-gold text-gold" /> {rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Verification.
          This used to render "NIN Verified" AND "Liveness Verified" as two hardcoded green
          ticks for everyone — a Plug who had verified nothing still saw both, which is both
          false and actively misleading: it tells them they're done when dispatch is in fact
          refusing them (server-side, see plug-eligibility.ts). It now reflects the real
          `verified` flag, and liveness is gone until an SDK actually verifies something. */}
      <div className="mt-4 rise rise-1">
        {plug.verified ? (
          <div className="rounded-2xl bg-white border border-midnight/6 p-3 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <span className="block text-[10.5px] font-bold text-midnight leading-tight">NIN Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/[0.07] p-3">
            <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-midnight leading-tight">Identity not verified yet</p>
              <p className="text-[11px] text-slate leading-tight mt-0.5">You can&rsquo;t receive jobs until this is done.</p>
            </div>
            <a
              href={`${base}/onboarding/verify`}
              className="shrink-0 rounded-pill bg-gold px-3 py-1.5 text-[11px] font-bold text-midnight hover:bg-gold-light transition-colors"
            >
              Verify
            </a>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 gap-2 rise rise-2">
        <Stat icon={<Briefcase className="w-4 h-4" />} value={String(jobs)} label="Jobs done" />
        <Stat icon={<Star className="w-4 h-4" />} value={jobs > 0 ? rating.toFixed(1) : '—'} label="Avg. rating" />
        <Stat icon={<Clock className="w-4 h-4" />} value={memberSince} label="Member since" />
      </div>

      {/* About */}
      <Card className="mt-4 p-5 rise rise-3">
        <Label className="mb-2">About</Label>
        {editing ? (
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 600))}
            rows={4}
            placeholder="Tell clients what you do and why they should trust you with it."
            className="w-full rounded-2xl border border-midnight/10 bg-bone/40 px-4 py-3 text-sm text-midnight placeholder:text-slate/50 focus:border-gold focus:outline-none"
          />
        ) : (
          <p className={cn('text-sm leading-relaxed', plug.bio ? 'text-midnight' : 'text-slate')}>
            {plug.bio || 'Nothing here yet. Tap Edit to tell clients what you do and why they should trust you with it.'}
          </p>
        )}
      </Card>

      {/* Skills — the Plug's own. Nothing is shown that they didn't type. */}
      <Card className="mt-4 p-5 rise rise-3">
        <Label className="mb-3">Skills</Label>

        <div className="flex flex-wrap gap-2">
          {skills.map((sk) => (
            <span
              key={sk}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[13px] font-medium',
                editing ? 'bg-white border-gold/40 text-midnight' : 'bg-bone border-midnight/6 text-midnight'
              )}
            >
              {sk}
              {editing && (
                <button
                  onClick={() => setSkills((prev) => prev.filter((k) => k !== sk))}
                  aria-label={`Remove ${sk}`}
                  className="grid place-items-center h-4 w-4 rounded-full bg-midnight/10 text-midnight hover:bg-midnight hover:text-white transition-colors"
                >
                  <X className="w-2.5 h-2.5" strokeWidth={3} />
                </button>
              )}
            </span>
          ))}
          {!editing && skills.length === 0 && (
            <p className="text-sm text-slate">
              No skills added yet. Tap Edit to list what you actually do — clients read this before booking.
            </p>
          )}
        </div>

        {editing && (
          <div className="mt-3 flex gap-2">
            <TextInput
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value.slice(0, 40))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="e.g. Fault diagnosis"
              className="flex-1"
            />
            <button
              onClick={addSkill}
              disabled={!skillDraft.trim() || skills.length >= 20}
              className="shrink-0 rounded-2xl bg-midnight px-4 text-[13px] font-bold text-white transition-opacity disabled:opacity-40"
            >
              Add
            </button>
          </div>
        )}
        {editing && <p className="mt-2 text-[11px] text-slate">Up to 20. Press Enter to add.</p>}
      </Card>

      {/* Experience */}
      <Card className="mt-4 p-5 rise rise-4">
        <Label className="mb-4">Experience</Label>

        {experience.length === 0 && !editing && (
          <p className="text-sm text-slate">
            No work history yet. Tap Edit to add where you&rsquo;ve worked — it&rsquo;s the record that makes
            you a known quantity instead of a stranger.
          </p>
        )}

        {experience.map((h, i, a) => (
          <div key={h.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="grid place-items-center h-9 w-9 rounded-xl bg-midnight/6 text-gold shrink-0"><Briefcase className="w-4 h-4" /></span>
              {i < a.length - 1 && <span className="w-0.5 flex-1 bg-midnight/10 my-1" />}
            </div>

            {editing ? (
              <div className="flex-1 pb-5 space-y-2">
                <div className="flex gap-2">
                  <TextInput
                    value={h.title}
                    onChange={(e) => updateExperience(h.id, { title: e.target.value.slice(0, 120) })}
                    placeholder="Role — e.g. Independent Electrician"
                    className="flex-1"
                  />
                  <button
                    onClick={() => setExperience((prev) => prev.filter((x) => x.id !== h.id))}
                    aria-label="Remove this entry"
                    className="shrink-0 grid place-items-center h-11 w-11 rounded-2xl border border-midnight/10 text-slate hover:border-red-300 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TextInput
                    value={h.org}
                    onChange={(e) => updateExperience(h.id, { org: e.target.value.slice(0, 120) })}
                    placeholder="Where"
                  />
                  <TextInput
                    value={h.period}
                    onChange={(e) => updateExperience(h.id, { period: e.target.value.slice(0, 120) })}
                    placeholder="2018 — Present"
                  />
                </div>
                <textarea
                  value={h.note}
                  onChange={(e) => updateExperience(h.id, { note: e.target.value.slice(0, 300) })}
                  rows={2}
                  placeholder="What the work involved"
                  className="w-full rounded-2xl border border-midnight/10 bg-bone/40 px-4 py-3 text-sm text-midnight placeholder:text-slate/50 focus:border-gold focus:outline-none"
                />
              </div>
            ) : (
              <div className="pb-5">
                <p className="font-bold text-sm text-midnight">{h.title}</p>
                {(h.org || h.period) && (
                  <p className="text-xs text-slate">{[h.org, h.period].filter(Boolean).join(' · ')}</p>
                )}
                {h.note && <p className="text-xs text-slate mt-1">{h.note}</p>}
              </div>
            )}
          </div>
        ))}

        {editing && (
          <button
            onClick={addExperience}
            disabled={experience.length >= 10}
            className="mt-1 inline-flex items-center gap-1.5 rounded-pill border border-dashed border-midnight/20 px-4 py-2 text-[13px] font-bold text-midnight hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" /> Add experience
          </button>
        )}
      </Card>

      {/* Raise your tier — locked upgrades, never blocking */}
      <Card className="mt-4 p-5 rise rise-4">
        <div className="flex items-center justify-between mb-1">
          <Label>Raise your tier</Label>
          <BadgeChip tier={tier} />
        </div>
        <p className="text-[11px] text-slate mb-3">Optional, never blocking. Coming after launch.</p>
        <div className="space-y-2.5">
          {UPGRADES.map((u) => (
            <div key={u.label} className="flex items-center gap-3 opacity-70">
              <span className="grid place-items-center h-6 w-6 rounded-full bg-midnight/6 shrink-0"><Lock className="w-3 h-3 text-slate" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-midnight">{u.label}</span>
                <span className="block text-[11px] text-slate">{u.why}</span>
              </span>
              <span className="ml-auto shrink-0 text-[11px] font-bold text-slate">After launch</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Work posts */}
      <div className="mt-6 rise rise-4">
        <div className="flex items-center justify-between mb-2.5">
          <Label>Work</Label>
          <button onClick={() => setComposing((c) => !c)} className="inline-flex items-center gap-1 text-[11px] font-bold text-gold hover:text-midnight transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add work post
          </button>
        </div>

        {composing && (
          <Card className="p-4 mb-3">
            <Label className="mb-2">What did you build or fix?</Label>
            <TextInput value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="Rewired a 3-bedroom flat" autoFocus />
            <div className="mt-3 flex flex-wrap gap-2">
              {postPhotos.map((ph, i) => (
                <span key={i} className="relative">
                  <img src={ph} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  <button onClick={() => setPostPhotos((ps) => ps.filter((_, k) => k !== i))} className="absolute -top-1.5 -right-1.5 grid place-items-center h-5 w-5 rounded-full bg-midnight text-white" aria-label="Remove photo">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {postPhotos.length < 4 && (
                <button onClick={() => postRef.current?.click()} className="grid place-items-center h-16 w-16 rounded-xl border-2 border-dashed border-midnight/15 text-slate hover:border-gold hover:text-gold transition-colors" aria-label="Add photo">
                  <Camera className="w-5 h-5" />
                </button>
              )}
            </div>
            <input
              ref={postRef} type="file" accept="image/*" multiple className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []).slice(0, 4 - postPhotos.length);
                const urls = await Promise.all(files.map(shrink));
                setPostPhotos((ps) => [...ps, ...urls].slice(0, 4));
              }}
            />
            <p className="mt-2 text-[11px] text-slate">Up to 4 photos. A work record — no likes, no comments.</p>
            <div className="mt-4">
              <GoldButton onClick={addPost} disabled={!postTitle.trim() || !postPhotos.length} loading={saving}>Post work</GoldButton>
            </div>
          </Card>
        )}

        {posts.length === 0 && !composing ? (
          <Card className="p-2">
            <EmptyState icon={<Briefcase className="w-6 h-6" />} title="No work posted yet" body="Post photos of jobs you’ve done. This is the portfolio clients scroll before they book you." />
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id} className="p-4">
                <p className="font-semibold text-midnight">{post.title}</p>
                <p className="text-[11px] text-slate mb-3">{new Date(post.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <div className={cn('grid gap-1.5', post.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                  {post.photos.slice(0, 4).map((src, i) => <img key={i} src={src} alt="" className="h-28 w-full rounded-xl object-cover" />)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="mt-6 rise rise-4">
        <Label className="mb-2.5">Reviews</Label>
        {reviews.length === 0 ? (
          <Card className="p-2">
            <EmptyState icon={<Star className="w-6 h-6" />} title="No reviews yet" body="Complete your first job to earn reviews. They compound — the longer you’re here, the harder you are to fake." />
          </Card>
        ) : (
          <Card className="p-5">
            <div className="space-y-4">
              {reviews.map((r: any, i: number) => (
                <div key={r.by}>
                  <div className="flex items-center gap-1 mb-1.5">
                    {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="w-3.5 h-3.5 fill-gold text-gold" />)}
                  </div>
                  <Quote className="w-4 h-4 text-gold/60 mb-1" />
                  <p className="text-sm leading-relaxed text-midnight">{r.text}</p>
                  <p className="mt-1 text-xs font-semibold text-slate">— {r.by}</p>
                  {i < reviews.length - 1 && <Divider className="mt-4" />}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {showId && (
        <DigitalId
          plug={{ id: plug.id, name: plug.name, trade: plug.trade, rating }}
          headline={trade}
          profileUrl={profileUrl}
          onClose={() => setShowId(false)}
        />
      )}
    </PlugShell>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Card className="p-3 text-center">
      <span className="text-gold flex justify-center mb-1">{icon}</span>
      <div className="font-display text-base text-midnight tnum leading-none">{value}</div>
      <div className="text-[10.5px] text-slate mt-1.5">{label}</div>
    </Card>
  );
}
