// scripts/create-anchor-master-customer.ts
// ONE-TIME setup: creates the single Plugr-owned "master" Anchor Customer that every per-job
// DepositAccount hangs off (see createJobDepositAccount in src/lib/anchor.ts), then triggers its
// KYC. Run it once per environment (sandbox, then again for production) — not per job.
//
// Run with: npx tsx scripts/create-anchor-master-customer.ts
//
// Needs in .env (or .env.local): ANCHOR_API_KEY, and optionally ANCHOR_ENV=sandbox|production.
//
// BEFORE RUNNING: replace every "__FILL_ME__" value in MASTER_CUSTOMER below with the real
// business / director details. The script refuses to run while any placeholder is left. Anchor
// matches the name AND phone number against the BVN record, so they must be exactly what the BVN
// holder registered with. Each KYC check is billed to the Anchor organisation's balance (sandbox
// included) — an unfunded org gets 400 "Insufficient balance" on the verification step.
//
// When it finishes, set the printed id as ANCHOR_MASTER_CUSTOMER_ID in .env.

import 'dotenv/config';
import {
  createIndividualCustomer,
  verifyIndividualCustomerKyc,
  fetchCustomer,
  AnchorError,
  type CreateIndividualCustomerParams,
} from '../src/lib/anchor';

const PLACEHOLDER = '__FILL_ME__';

// ── FILL THESE IN — real business/director details only. Do not commit the filled-in values. ──
const MASTER_CUSTOMER: CreateIndividualCustomerParams & {
  identificationLevel2: NonNullable<CreateIndividualCustomerParams['identificationLevel2']>;
} = {
  fullName: {
    firstName: PLACEHOLDER, // director's first name, exactly as on the BVN
    lastName: PLACEHOLDER, // director's last name, exactly as on the BVN
    // middleName: PLACEHOLDER, // uncomment if the BVN record has one
  },
  address: {
    addressLine_1: PLACEHOLDER, // registered business address, line 1
    // addressLine_2: PLACEHOLDER,
    city: PLACEHOLDER,
    state: PLACEHOLDER, // e.g. the state name as written on the address
    postalCode: PLACEHOLDER,
    country: 'NG',
  },
  email: PLACEHOLDER, // a monitored Plugr ops/finance inbox
  phoneNumber: PLACEHOLDER, // the phone number registered on the BVN, e.g. 080XXXXXXXX
  identificationLevel2: {
    bvn: PLACEHOLDER, // director's 11-digit BVN
    dateOfBirth: PLACEHOLDER, // YYYY-MM-DD, as on the BVN
    gender: PLACEHOLDER as 'Male' | 'Female', // 'Male' or 'Female', as on the BVN
  },
  metadata: { role: 'plugr-master-collection-customer' },
};
// ─────────────────────────────────────────────────────────────────────────────────────────

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

  const unfilled = findPlaceholders(MASTER_CUSTOMER);
  if (unfilled.length) {
    console.error('Refusing to run — these fields still hold placeholders:');
    for (const p of unfilled) console.error(`  - ${p}`);
    console.error('Edit MASTER_CUSTOMER in scripts/create-anchor-master-customer.ts with the real details first.');
    process.exit(1);
  }

  if (process.env.ANCHOR_MASTER_CUSTOMER_ID) {
    console.error(
      `ANCHOR_MASTER_CUSTOMER_ID is already set (${process.env.ANCHOR_MASTER_CUSTOMER_ID}). ` +
        'There should be exactly one master customer per environment — unset it only if you really mean to create another.'
    );
    process.exit(1);
  }

  console.log(`Creating master customer against: ${process.env.ANCHOR_BASE_URL || (process.env.ANCHOR_ENV === 'production' ? 'https://api.getanchor.co' : 'https://api.sandbox.getanchor.co')}`);

  console.log('\n[1/3] Creating the individual customer...');
  let customerId: string;
  try {
    const customer = await createIndividualCustomer(MASTER_CUSTOMER);
    customerId = customer.id;
    console.log(`  OK — customer id: ${customerId}`);
  } catch (err) {
    reportAnchorError('Create customer', err);
    process.exit(1);
  }

  // Creating the customer only stores the BVN/DOB/gender — KYC has to be triggered separately,
  // and a DepositAccount can't be opened until it's approved.
  console.log('\n[2/3] Triggering KYC verification...');
  try {
    const res = await verifyIndividualCustomerKyc(customerId, MASTER_CUSTOMER.identificationLevel2);
    console.log(`  OK — ${res?.attributes?.message ?? JSON.stringify(res).slice(0, 200)}`);
  } catch (err) {
    reportAnchorError('KYC verification', err);
    console.error(
      `  The customer WAS created (${customerId}). Fix the cause above, then re-trigger KYC for that id ` +
        'instead of creating a second customer.'
    );
  }

  console.log('\n[3/3] Reading back verification status...');
  try {
    await new Promise((r) => setTimeout(r, 5000));
    const latest = await fetchCustomer(customerId);
    console.log(`  verification.status: ${latest?.attributes?.verification?.status ?? 'unknown'}`);
    console.log(
      '  (KYC resolves asynchronously — listen for customer.identification.approved, or check the ' +
        'customer in the Anchor dashboard, before opening any job accounts.)'
    );
  } catch (err) {
    reportAnchorError('Fetch customer', err);
  }

  console.log(`\nDone. Add this to .env:\n\n  ANCHOR_MASTER_CUSTOMER_ID=${customerId}\n`);
}

main();
