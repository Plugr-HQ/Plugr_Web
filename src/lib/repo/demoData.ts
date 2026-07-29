// src/lib/repo/demoData.ts
//
// Static fixture data for the /demo surface. After the hack_ tables were dropped in a DB
// reset, /demo no longer touches the database at all — this file is the single source of
// mock data, and demo.ts serves it from in-memory state.
//
// Shapes match the repo row types exactly (PlugRow / JobRow / TxnRow, snake_case), so the API
// routes and screens need no changes.

import type { JobRow, PlugRow, TxnRow } from './index';

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();

// Stable UUIDs so jobs/transactions can reference their plug deterministically.
export const PLUG_IDS = {
  emeka: 'd1000000-0000-4000-8000-000000000001',
  tunde: 'd1000000-0000-4000-8000-000000000002',
  segun: 'd1000000-0000-4000-8000-000000000003',
  chidi: 'd1000000-0000-4000-8000-000000000004',
  halima: 'd1000000-0000-4000-8000-000000000005',
  bisi: 'd1000000-0000-4000-8000-000000000006',
} as const;

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=256&q=80`;

// ---------------------------------------------------------------- plugs

export const SEED_PLUGS: PlugRow[] = [
  {
    id: PLUG_IDS.emeka,
    name: 'Emeka Nwosu',
    trade: 'plumber',
    photo_url: UNSPLASH('1560250097-0b93528c311a'),
    rating: 5.0,
    jobs_completed: 206,
    verified: true,
    wallet_balance_available: 45000,
    wallet_balance_locked: 0,
    bio: 'Fixes what others patch. Burst pipes at 2am to full bathroom re-plumbs — clean work, honest quotes.',
    work_posts: [
      { caption: 'Full bathroom re-plumb, Lekki', image: UNSPLASH('1620626011761-996317b8d101') },
      { caption: 'Emergency leak repair', image: UNSPLASH('1607472586893-edb57bdc0e39') },
    ],
    created_at: daysAgo(420),
  },
  {
    id: PLUG_IDS.tunde,
    name: 'Tunde Adebayo',
    trade: 'electrician',
    photo_url: UNSPLASH('1500648767791-00dcc994a43e'),
    rating: 4.9,
    jobs_completed: 129,
    verified: true,
    wallet_balance_available: 12000,
    wallet_balance_locked: 0,
    bio: 'Licensed electrician, a decade making Lagos homes and shops safe. Turns up on time, quotes before touching a wall.',
    work_posts: [{ caption: 'DB board rewire, Ikeja', image: UNSPLASH('1621905251189-08b45d6a269e') }],
    created_at: daysAgo(300),
  },
  {
    id: PLUG_IDS.segun,
    name: 'Segun Bakare',
    trade: 'furniture',
    photo_url: UNSPLASH('1507003211169-0a1dd7228f2d'),
    rating: 4.9,
    jobs_completed: 114,
    verified: true,
    wallet_balance_available: 0,
    wallet_balance_locked: 0,
    bio: 'Builds furniture that outlives trends. Bespoke wardrobes, dining sets, shop fittings — measured, made, finished by hand.',
    work_posts: [{ caption: 'Bespoke walk-in wardrobe', image: UNSPLASH('1595428774223-ef52624120d2') }],
    created_at: daysAgo(260),
  },
  {
    id: PLUG_IDS.chidi,
    name: 'Chidinma Okeke',
    trade: 'electrician',
    photo_url: null,
    rating: 4.7,
    jobs_completed: 84,
    verified: true,
    wallet_balance_available: 8500,
    wallet_balance_locked: 0,
    bio: 'Residential and small-business electrical work. Known for tidy conduit runs and explaining the fault so you understand it.',
    work_posts: [],
    created_at: daysAgo(210),
  },
  {
    id: PLUG_IDS.halima,
    name: 'Halima Sadiq',
    trade: 'furniture',
    photo_url: UNSPLASH('1544005313-94ddf0286df2'),
    rating: 4.7,
    jobs_completed: 68,
    verified: true,
    wallet_balance_available: 0,
    wallet_balance_locked: 0,
    bio: 'Carpentry and upholstery. Repairs, refinishing, and fittings — measure twice, cut once.',
    work_posts: [],
    created_at: daysAgo(180),
  },
  {
    id: PLUG_IDS.bisi,
    name: 'Bisi Aluko',
    trade: 'plumber',
    photo_url: null,
    rating: 4.6,
    jobs_completed: 61,
    verified: false, // one unverified plug so "Pending Review" states have a fixture too
    wallet_balance_available: 0,
    wallet_balance_locked: 0,
    bio: 'Leak detection, pipe fitting, water heaters and drainage across Lagos mainland.',
    work_posts: [],
    created_at: daysAgo(90),
  },
];

// ---------------------------------------------------------------- jobs
//
// Each plug gets one "waiting" job already paid into escrow (status 'paid_escrow') so a demo
// plug session can accept it and watch it progress accept -> complete -> release -> withdrawn.
// The two featured plugs also carry a 'released' job so wallet/earnings history isn't empty.

const waitingJob = (id: string, plugId: string, client: string, phone: string, desc: string, amount: number, ageDays: number): JobRow => ({
  id,
  plug_id: plugId,
  client_name: client,
  client_phone: phone,
  job_description: desc,
  amount,
  status: 'paid_escrow',
  created_at: daysAgo(ageDays),
  completed_at: null,
  escrow_released_at: null,
});

export const SEED_JOBS: JobRow[] = [
  waitingJob('d2000000-0000-4000-8000-00000000ee01', PLUG_IDS.emeka, 'Amaka Obi', '08031234567', 'Kitchen sink leak + tap replacement', 8500, 0),
  waitingJob('d2000000-0000-4000-8000-00000000ee02', PLUG_IDS.tunde, 'David Umeh', '08037654321', 'Faulty DB board diagnosis and repair', 12000, 0),
  waitingJob('d2000000-0000-4000-8000-00000000ee03', PLUG_IDS.segun, 'Ngozi Eze', '08039998877', 'Fit a fitted wardrobe in master bedroom', 45000, 1),
  waitingJob('d2000000-0000-4000-8000-00000000ee04', PLUG_IDS.chidi, 'Bola Ahmed', '08035556644', 'Rewire two rooms and add sockets', 20000, 1),
  waitingJob('d2000000-0000-4000-8000-00000000ee05', PLUG_IDS.halima, 'Ifeoma N.', '08032223311', 'Reupholster a 3-seater sofa', 30000, 2),
  waitingJob('d2000000-0000-4000-8000-00000000ee06', PLUG_IDS.bisi, 'Kunle A.', '08034445566', 'Bathroom drainage unblock', 6000, 2),
  // Featured history — already released to the plug's wallet.
  {
    id: 'd2000000-0000-4000-8000-00000000aa01',
    plug_id: PLUG_IDS.emeka,
    client_name: 'Chinelo Okafor',
    client_phone: '08030001122',
    job_description: 'Water heater install',
    amount: 45000,
    status: 'released',
    created_at: daysAgo(6),
    completed_at: daysAgo(5),
    escrow_released_at: daysAgo(5),
  },
  {
    id: 'd2000000-0000-4000-8000-00000000aa02',
    plug_id: PLUG_IDS.tunde,
    client_name: 'Yemi Balogun',
    client_phone: '08030003344',
    job_description: 'Inverter setup and wiring',
    amount: 12000,
    status: 'released',
    created_at: daysAgo(9),
    completed_at: daysAgo(8),
    escrow_released_at: daysAgo(8),
  },
];

// ---------------------------------------------------------------- transactions
//
// Payment/wallet history so the wallet + withdraw screens have something to show. Types match
// the escrow lifecycle: 'collection' (client -> escrow), 'release' (escrow -> plug wallet),
// 'withdrawal' (plug wallet -> bank, stays 'pending' — ALATPay has no merchant payout).

export const SEED_TXNS: TxnRow[] = [
  {
    id: 'd3000000-0000-4000-8000-00000000bb01',
    job_id: 'd2000000-0000-4000-8000-00000000aa01',
    alatpay_transaction_id: 'demo_txn_emeka_collection',
    alatpay_virtual_account: '7011234567',
    amount: 45000,
    type: 'collection',
    status: 'successful',
    raw_webhook_payload: null,
    created_at: daysAgo(6),
  },
  {
    id: 'd3000000-0000-4000-8000-00000000bb02',
    job_id: 'd2000000-0000-4000-8000-00000000aa01',
    alatpay_transaction_id: null,
    alatpay_virtual_account: null,
    amount: 45000,
    type: 'release',
    status: 'successful',
    raw_webhook_payload: null,
    created_at: daysAgo(5),
  },
  {
    id: 'd3000000-0000-4000-8000-00000000bb03',
    job_id: null,
    alatpay_transaction_id: null,
    alatpay_virtual_account: null,
    amount: 20000,
    type: 'withdrawal',
    status: 'pending',
    raw_webhook_payload: null,
    created_at: daysAgo(4),
  },
];
