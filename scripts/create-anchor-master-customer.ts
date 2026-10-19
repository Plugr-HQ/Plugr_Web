// scripts/create-anchor-master-customer.ts
// ONE-TIME setup: creates the single Plugr-owned "master" Anchor BusinessCustomer that every per-job
// DepositAccount hangs off (see createJobDepositAccount in src/lib/anchor.ts), then starts its KYB.
// It is a business (not an individual) so payers see the company's name on every job account.
// Run it once per environment (sandbox now, production at go-live) — not per job.
//
// Sandbox, with Anchor's published test values (no real company or personal data):
//   npx tsx scripts/create-anchor-master-customer.ts --sandbox-test-data
// Production, with the real company details filled into MASTER_CUSTOMER below:
//   npx tsx scripts/create-anchor-master-customer.ts
//
// Needs in .env (or .env.local): ANCHOR_API_KEY, and ANCHOR_ENV=sandbox|production.
//
// KYB is not instant. Anchor checks the officers' BVNs straight away, but the customer stays
// "pending" until the company documents it asks for (CAC forms, RC number, certificate of
// incorporation, proof of address — they vary by registration type and date) are uploaded at
// app.getanchor.co/document-upload and reviewed. Job accounts can only be opened once it's approved.
//
// When it finishes, set the printed id as ANCHOR_MASTER_CUSTOMER_ID in .env.

import 'dotenv/config';
import {
  createBusinessCustomer,
  verifyBusinessCustomerKyb,
  fetchCustomer,
  AnchorError,
  type CreateBusinessCustomerParams,
  type BusinessOfficer,
} from '../src/lib/anchor';

const PLACEHOLDER = '__FILL_ME__';

// ── FILL THESE IN at go-live — the real company and its officers. Do not commit the filled-in values. ──
const MASTER_ADDRESS = {
  addressLine_1: PLACEHOLDER, // registered business address, line 1
  city: PLACEHOLDER,
  state: PLACEHOLDER, // upper case, e.g. LAGOS
  postalCode: PLACEHOLDER,
  country: 'NG',
};

const MASTER_CUSTOMER: CreateBusinessCustomerParams = {
  address: { country: 'NG', state: PLACEHOLDER }, // same state as above
  basicDetail: {
    businessName: PLACEHOLDER, // the registered company name — this is what payers see on every job account
    registrationType: PLACEHOLDER, // e.g. Private_Incorporated (see Anchor docs: Create Business Customer)
    industry: PLACEHOLDER, // one of Anchor's industry codes (same docs page)
    dateOfRegistration: PLACEHOLDER, // YYYY-MM-DD, from the CAC certificate
    description: PLACEHOLDER, // one or two sentences on what the business does
    website: 'https://getplugr.com',
    country: 'NG',
  },
  contact: {
    email: { general: PLACEHOLDER, support: PLACEHOLDER, dispute: PLACEHOLDER }, // monitored Plugr inboxes
    address: { main: MASTER_ADDRESS, registered: MASTER_ADDRESS },
    phoneNumber: PLACEHOLDER, // company phone, e.g. 080XXXXXXXX
  },
  // At least one DIRECTOR and the OWNER(s). Name, phone and DOB must match each person's BVN record.
  officers: [
    {
      role: 'DIRECTOR',
      fullName: { firstName: PLACEHOLDER, lastName: PLACEHOLDER },
      nationality: 'NG',
      address: MASTER_ADDRESS,
      dateOfBirth: PLACEHOLDER, // YYYY-MM-DD
      email: PLACEHOLDER,
      phoneNumber: PLACEHOLDER, // the phone registered on this person's BVN
      bvn: PLACEHOLDER, // 11 digits
      title: PLACEHOLDER, // e.g. CEO
      percentageOwned: 0, // their shareholding, 0–100
    },
  ],
  metadata: { role: 'plugr-master-collection-customer' },
};
// ─────────────────────────────────────────────────────────────────────────────────────────

// Anchor's published sandbox sample values (officer BVNs 22222222226 / 22222222016 pass sandbox KYC).
// Email and phone must be unique per Anchor org, so they're varied per run.
function sandboxTestCustomer(): CreateBusinessCustomerParams {
  const uniq = String(Date.now()).slice(-8);
  const address = { addressLine_1: '1 James street', city: 'Ikeja', state: 'LAGOS', postalCode: '100032', country: 'NG' };
  const officer = (role: BusinessOfficer['role'], firstName: string, lastName: string, bvn: string, percentageOwned: number, title: string): BusinessOfficer => ({
    role, fullName: { firstName, lastName }, nationality: 'NG', address, dateOfBirth: '1994-06-25',
    email: `${role.toLowerCase()}+${uniq}@getplugr.com`, phoneNumber: `070${uniq}`, bvn, title, percentageOwned,
  });
  return {
    address: { country: 'NG', state: 'LAGOS' },
    basicDetail: {
      businessName: 'Plugr Sandbox Test Limited',
      registrationType: 'Private_Incorporated',
      industry: 'Agriculture-AgriculturalCooperatives',
      businessBvn: '12345678901',
      dateOfRegistration: '1999-06-25',
      description: 'Sandbox-only test business for Plugr job collection accounts',
      website: 'https://getplugr.com',
      country: 'NG',
    },
    contact: {
      email: { general: `general+${uniq}@getplugr.com`, support: `support+${uniq}@getplugr.com`, dispute: `dispute+${uniq}@getplugr.com` },
      address: { main: address, registered: address },
      phoneNumber: `070${uniq}`,
    },
    officers: [
      officer('DIRECTOR', 'Josh', 'Steve', '22222222226', 0, 'CEO'),
      officer('OWNER', 'Graham', 'Bell', '22222222016', 100, 'COO'),
    ],
    metadata: { role: 'plugr-master-collection-customer', source: 'sandbox-test-data' },
  };
}

function findPlaceholders(value: unknown, path = ''): string[] {
  if (value === PLACEHOLDER) return [path];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => findPlaceholders(v, path ? `${path}.${k}` : k));
  }
  return [];
}

function reportAnchorError(step: string, err: unknown) {
  if (err instanceof AnchorError) {
    console.error(`  ${step} FAILED (${err.statusCode}): ${err.message}`);
    console.error('  Raw context:', JSON.stringify(err.context).slice(0, 800));
  } else {
    console.error(`  ${step} FAILED (non-Anchor error):`, err);
  }
}

async function main() {
  if (!process.env.ANCHOR_API_KEY) {
    console.error('ANCHOR_API_KEY is not set in your environment. Add it to .env or .env.local and re-run.');
    process.exit(1);
  }

  const useSandboxData = process.argv.includes('--sandbox-test-data');
  if (useSandboxData && process.env.ANCHOR_ENV === 'production') {
    console.error('--sandbox-test-data is for the sandbox only. Fill in MASTER_CUSTOMER for production.');
    process.exit(1);
  }

  const customer = useSandboxData ? sandboxTestCustomer() : MASTER_CUSTOMER;
  if (!useSandboxData) {
    const unfilled = findPlaceholders(customer);
    if (unfilled.length) {
      console.error('Refusing to run — these fields still hold placeholders:');
      for (const p of unfilled) console.error(`  - ${p}`);
      console.error('Fill in MASTER_CUSTOMER in scripts/create-anchor-master-customer.ts, or use --sandbox-test-data in the sandbox.');
      process.exit(1);
    }
  }

  if (process.env.ANCHOR_MASTER_CUSTOMER_ID?.endsWith('-anc_bus_cst')) {
    console.error(
      `ANCHOR_MASTER_CUSTOMER_ID is already a business customer (${process.env.ANCHOR_MASTER_CUSTOMER_ID}). ` +
        'There should be one master per environment — unset it only if you really mean to create another.'
    );
    process.exit(1);
  }

  console.log(`Creating master business customer${useSandboxData ? ' (sandbox test data)' : ''} against: ${process.env.ANCHOR_BASE_URL || (process.env.ANCHOR_ENV === 'production' ? 'https://api.getanchor.co' : 'https://api.sandbox.getanchor.co')}`);

  console.log('\n[1/3] Creating the business customer...');
  let customerId: string;
  try {
    const created = await createBusinessCustomer(customer);
    customerId = created.id;
    console.log(`  OK — customer id: ${customerId}`);
  } catch (err) {
    reportAnchorError('Create customer', err);
    process.exit(1);
  }

  console.log('\n[2/3] Starting KYB...');
  try {
    const res = await verifyBusinessCustomerKyb(customerId);
    console.log(`  OK — ${res?.attributes?.message ?? JSON.stringify(res).slice(0, 200)}`);
  } catch (err) {
    reportAnchorError('KYB', err);
    console.error(`  The customer WAS created (${customerId}). Re-trigger KYB for that id instead of creating another.`);
  }

  console.log('\n[3/3] Reading back verification status...');
  try {
    await new Promise((r) => setTimeout(r, 5000));
    const latest = await fetchCustomer(customerId);
    console.log(`  verification: ${JSON.stringify(latest?.attributes?.verification ?? 'unknown')}`);
  } catch (err) {
    reportAnchorError('Fetch customer', err);
  }

  console.log(`\nAdd this to .env:\n\n  ANCHOR_MASTER_CUSTOMER_ID=${customerId}\n`);
  console.log(
    'Next: upload the documents Anchor asks for at https://app.getanchor.co/document-upload, then wait for\n' +
      'customer.identification.approved (or "approved" on the customer in the dashboard) before opening job accounts.'
  );
}

main();
