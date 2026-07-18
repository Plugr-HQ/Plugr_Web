# Plugr × ALATPay — Build Status

**Repo:** `Plugr-HQ/Plugr_Web` · **Branch:** `main` · **Last commit at time of writing:** `c8aa6d56`
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Postgres (Supabase) via `pg` · Vercel

---

## 1. What this build is

The ALATPay Buildathon submission, built **inside the real Plugr repo** rather than as a standalone
demo. It proves the full booking-to-payment loop: a client books a verified Plug, pays into escrow
via a real ALATPay virtual account, the Plug completes the job, the client confirms, funds move to
the Plug's wallet after a dispute window, and a withdrawal is triggered.

It has since grown past the hackathon scope to include the **Plug-facing MVP** (auth → onboarding →
dashboard → profile → wallet) per `plugr_mvp_screens_spec.md`.

---

## 2. Key architecture decisions

Each of these was a fork in the road — recorded here so nobody has to re-derive the reasoning.

### 2.1 Data layer uses `pg` + `DATABASE_URL`, **not** the Supabase JS client
The original code used `@supabase/supabase-js` with a `SUPABASE_SERVICE_ROLE_KEY`. That key was
**never available** — the provided env files only contained `DATABASE_URL` (Postgres pooler) and an
anon key. Rather than request more secrets, the data layer was rewritten onto `pg` against
`DATABASE_URL`, which:
- matches how the rest of this repo already talks to the DB (the waitlist route),
- connects directly to Postgres, so there's no PostgREST/RLS gate to configure,
- needs no service-role key at all.

Helper: `src/lib/hackDb.ts` (`q()` / `one()`). The old `supabaseAdmin.ts` was removed.

### 2.2 Payment confirmation is **polling**, not the webhook
ALATPay's business account is in *Pending Basic Tier* approval, so the webhook URL cannot be
registered. Confirmation therefore runs through `GET /api/jobs/[jobId]/check-status`, which re-queries
ALATPay directly and performs the **exact same state transition** the webhook would.

The webhook route is **still live and correct** — it verifies the HMAC signature before touching the
DB and returns 401 on a bad/missing signature. Both paths are idempotent, so **when approval clears,
the webhook starts working with zero code changes** and the poll simply becomes redundant.

ALATPay's status endpoint keys on the **`transactionId`** field from the virtual-account response
(querying by `id` returns "Transaction not found"). It returns `404 + "Transaction Pending."` while a
transfer is settling — that is **a state, not an error**, and is surfaced to the UI as
`{ alatpay: "pending" }` so the user sees "Transfer detected — confirming…" instead of a dead spinner.

### 2.3 Escrow lock is UI-driven, compressed to 60s
The real product uses a ~24h dispute window; the demo compresses it to a visible 60 seconds. The
countdown **must** live in the browser and call `/api/jobs/[jobId]/unlock` at zero — Vercel serverless
functions don't persist state between invocations, so a server-side timer would never fire.

### 2.4 Withdrawal stays honestly "pending"
ALATPay's public API exposes **no merchant-triggerable payout endpoint** (Settlements is read-only).
The withdrawal deducts from the available balance and records a `pending` transaction. **We never
fabricate a completed bank transfer.** This is deliberate and should not be "fixed".

### 2.5 `/app` is production, `/demo` is the guided demo — one source of truth
Both namespaces render the **same components** (`src/components/plug/*`, `src/app/demo/_components/*`)
parameterised by a `base` prop. There is no copy-paste duplication. Landing CTAs point at `/app`;
"Try demo" points at `/demo`.

### 2.6 Client and Plug sides are deliberately disconnected
No cross-links between the two. You open the client in one tab and the Plug in another — this is an
intentional MVP-realism decision, not an oversight.

### 2.7 Tier is **Basic at launch for everyone**
Verification (NIN + liveness) makes a Plug *trusted*, not a higher tier. Verified/Pro are earned via
the upgrade stack (BVN → guarantor → skills assessment), **none of which ship at launch**, so nothing
can currently reach Pro. `plugTier()` in `PlugChrome.tsx` reads a `tier_upgrades` array — that's the
seam those flows drop into.

### 2.8 Back navigation uses real browser history
Every screen's Back button calls `router.back()` (shared `Shell`), with the hardcoded path only as a
fallback for direct URL loads. Hardcoded backs previously sent users to pages they'd never visited.

### 2.9 Tables are `hack_`-prefixed and additive
`hack_plugs`, `hack_jobs`, `hack_transactions` live in the **shared production Supabase project**
alongside the real `Plugr Waitlist` table. Nothing pre-existing was touched or migrated.

---

## 3. Data model

```
hack_plugs (7 rows)
  id, name, trade, photo_url, rating, jobs_completed, verified,
  wallet_balance_available, wallet_balance_locked, alatpay_wallet_id,
  created_at, bio, work_posts (jsonb)

hack_jobs (10 rows)
  id, plug_id, client_name, client_phone, job_description, amount,
  status, created_at, completed_at, escrow_released_at

hack_transactions (25 rows)
  id, job_id, alatpay_transaction_id, alatpay_virtual_account, amount,
  type, status, raw_webhook_payload (jsonb), created_at

functions: increment_wallet_locked(), move_locked_to_available()
```

**Job status lifecycle:** `requested → paid_escrow → accepted → completed → released → withdrawn`

> **Note:** the `/release` guard accepts **`completed` OR `paid_escrow`**. The original dropped code
> required strictly `paid_escrow`, but the screen order puts the Plug's "mark complete" *before* the
> client confirms — so at release time the job is `completed`. Both are post-payment states, so an
> unfunded job still cannot be released.

**Seeded:** 6 Plugs (2 electricians, 2 plumbers, 2 furniture) + 1 real onboarded test Plug.
All wallet balances currently zeroed for a clean demo.

---

## 4. API endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/jobs` | GET, POST | list (optional `?status=`) / create job |
| `/api/jobs/[jobId]` | GET | job + plug + transaction trail |
| `/api/jobs/[jobId]/pay` | POST | **generate real ALATPay virtual account** |
| `/api/jobs/[jobId]/check-status` | GET | **poll ALATPay** → flips to `paid_escrow` (`?simulate=true` bypass) |
| `/api/jobs/[jobId]/accept` | POST | Plug accepts |
| `/api/jobs/[jobId]/complete` | POST | Plug marks complete |
| `/api/jobs/[jobId]/release` | POST | escrow → locked balance |
| `/api/jobs/[jobId]/unlock` | POST | locked → available (called by UI countdown) |
| `/api/plugs/register` | POST | create Plug at end of onboarding |
| `/api/plugs/[plugId]` | GET, PATCH | plug snapshot / edit bio, photo, work posts, `verified` |
| `/api/plugs/[plugId]/dashboard` | GET | earnings, active job, recent jobs, lock state |
| `/api/plugs/[plugId]/withdraw` | POST | records **pending** withdrawal |
| `/api/webhooks/alatpay` | POST | HMAC-verified webhook (dormant until approval) |
| `/api/plugs`, `/api/waitlist` | — | **pre-existing repo routes — untouched** |

---

## 5. What's done

**Landing (`/`)** — rebuilt on the design system: scroll animations (`motion`), gold-fill CTAs with
midnight alternates, real photography, working FAQ accordion, Instagram/X/mail socials, Furniture
trade. Logo hard-reloads home. "Use Plugr" → `/app` role select.

**Client flow (`/app`)** — role select → browse (trade filters) → **LinkedIn-style profile** →
sign-up → book → **pay (real VA)** → confirm (60s countdown) → receipt.

**Plug MVP (`/app/plug`, mirrored at `/demo/plug`)** — per spec:
- `AUTH-01` splash (bone, gold mark, determinate loading bar) + role select
- `AUTH-02` phone (+234 locked, activates at 10 digits)
- `AUTH-03` OTP (6 auto-advancing boxes, auto-submit, 30s resend, shake-on-error, 10min expiry)
- `PLG-ON-01` profile setup (name → trade → photo, progress saved per step)
- `PLG-ON-02` NIN + liveness only (NIN masks after 1s, 3 fails → contact support)
- `PLG-01` dashboard (all states: Pending Review / no jobs / active / done / wallet lock)
- `PLG-02` profile (bio, stats, verification stack, work posts, reviews, **Digital ID**)
- `PLG-03` wallet (available/pending, earnings + withdrawal tabs, single bank account,
  OTP-gated account change, **4-digit PIN on every withdrawal**, lock-enterable withdraw)

**Digital ID** — plug number (`PLG-XXXX-XXXX`), scannable QR to the public profile, share, copy link,
**PNG download** (composed on canvas).

**Privacy policy (`/privacy`)** — redesigned onto the design system, all 13 legal sections verbatim.

**Shared `<SiteFooter/>`** — landing and privacy use one identical footer.

**Verified end-to-end** against the live DB + ALATPay sandbox: real VA generation
(e.g. acct `8880518831`, Wema Bank, `orderId == job.id`), full escrow lifecycle with correct wallet
math, webhook 401s, and all guards (double-accept, over-balance withdraw, bad NIN/trade → 400).

---

## 6. Pending / blocked

| Item | Status | Owner |
|---|---|---|
| **Vercel env vars** | 🔴 **Blocks production** | Ramon / CTO |
| ALATPay webhook approval | 🟡 Pending Basic Tier — poll works meanwhile | ALATPay |
| Real SMS provider (OTP) | 🟡 **Any 6 digits pass** | — |
| Real NIN verification (NIMC) | 🟡 **Any 11 digits pass** | — |
| Real liveness SDK | 🟡 Self-approves | Ramon to pick SDK |
| Real payout endpoint | 🟡 Not offered by ALATPay | ALATPay |
| Digital ID **PDF** export | ⚪ Deferred (PNG done) | — |
| Tier upgrades (BVN/guarantor/skills) | ⚪ Post-launch by design | — |
| Settings screen | ⚪ Post-launch by design | — |

### 6.1 Vercel environment variables — the production blocker
The app **cannot function in production** until these are set in the Vercel project (Settings →
Environment Variables → Production → redeploy). The landing will still render; `/app` and `/demo`
will 500.

```
DATABASE_URL
ALATPAY_BASE_URL            # https://apibox.alatpay.ng
ALATPAY_SECRET_KEY          # Ocp-Apim-Subscription-Key
ALATPAY_BUSINESS_ID
ALATPAY_WEBHOOK_SECRET_KEY  # only used once webhook approval clears
```

Values live in the local (gitignored) `.env` and in `ALATPAY Plugr/Env/`. **They are deliberately not
committed.**

### 6.2 When webhook approval clears
1. Register `https://<domain>/api/webhooks/alatpay` in ALATPay Dashboard → Settings → Business → Edit.
2. Confirm `ALATPAY_WEBHOOK_SECRET_KEY` is set in Vercel.
3. Nothing else. The route already verifies signatures and is idempotent with the poll.

---

## 7. Known issues / must-fix before real launch

1. **🔴 "Simulate Sandbox Payment" bypass is exposed in the UI.** Fine for the stage demo, but on a
   public site it lets anyone mark a job paid without paying. Gate behind an env flag or remove.
   (`check-status?simulate=true` + the button on the pay screen.)
2. **🔴 Auth is flavour only.** No password, no real session, no server-side verification. Identity is
   `localStorage`. Not production-safe.
3. **🟠 Withdrawal PIN and bank details are in `localStorage`.** Deliberate for the demo — a PIN has no
   business in the demo DB — but needs a real backend before launch.
4. **🟠 Runs against the shared production Supabase project.** `hack_` tables are isolated, but demo
   writes land in the same database as the real waitlist.
5. **🟠 Landing photography is hotlinked from Unsplash.** Free to use, but swap for owned artisan
   photography before launch.
6. **🟡 VA response field names are confirmed but narrow.** `virtualBankAccountNumber` +
   `virtualBankCode` are verified against live responses; `BANK_CODES` currently maps only `035` →
   Wema Bank. Unknown codes render as `Bank code {n}` (accurate, not misleading).
7. **🟡 The three context docs are not in the repo.** `CLAUDE.md` and `plugr_concept_document.md` are
   in `Downloads/`; `plugr_mvp_screens_spec.md` is in `ALATPAY Plugr/`. The spec assumes repo root.

### 7.1 Operational gotcha — stale `.next` (bit us twice)
Running `next build` against the same `.next` the dev server uses **poisons it**: `/` keeps working
while **every dynamic route 404s**, and client `fetch` then receives an HTML 404 page, surfacing as
`Unexpected token '<', "<!DOCTYPE"... is not valid JSON`.

**Rule: after any `next build`, delete `.next` before restarting `next dev`.**

```bash
rm -rf .next && npm run dev
```

Screens now route through `jsonFetch`, so a non-JSON response reports a real message instead of a raw
parser error, and a stale session signs out to phone auth rather than stranding the user.

---

## 8. Where things were left off

- `main` @ `c8aa6d56`, working tree clean, fully pushed. Local build green (`tsc` + `next build`).
- Dev server runs clean on `localhost:3000`; all page routes and API endpoints return 200 (last full
  sweep passed).
- DB reset to a clean demo state: 6 seeded Plugs + 1 onboarded test Plug (`Abdul Bash`, still
  `verified: false` so it demonstrates the Pending Review state), all balances ₦0.
- **Next action: set the Vercel env vars and redeploy** — everything else is code-complete for the
  demo.

### Demo walkthrough (2 tabs)
**Tab A — client:** Landing → Use Plugr → Book a Plug → pick a Plug → profile → Request → sign-up →
book → pay (real VA; use *Simulate* on stage) → Track & confirm → 60s countdown → receipt.
**Tab B — plug:** Landing → Become a Plug → phone → OTP → onboarding (name/trade/photo → NIN →
liveness) → dashboard → accept → complete → wallet → withdraw (PIN) → "pending".
