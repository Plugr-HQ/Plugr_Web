// scripts/test-anchor-sandbox.ts
// Standalone sandbox connectivity check for the ANCHOR_API_KEY in your .env.
// Doesn't touch the DB or any job — just proves the key + permissions actually work
// end to end before anything gets wired into the job flow.
//
// Run with: npx tsx scripts/test-anchor-sandbox.ts
//
// Needs in .env (or .env.local): ANCHOR_API_KEY, and optionally ANCHOR_ENV=sandbox
// (sandbox is the default if unset).

import 'dotenv/config';
import { listBanks, createIndividualCustomer, AnchorError } from '../src/lib/anchor';

async function main() {
  if (!process.env.ANCHOR_API_KEY) {
    console.error('ANCHOR_API_KEY is not set in your environment. Add it to .env or .env.local and re-run.');
    process.exit(1);
  }

  console.log(`Testing against: ${process.env.ANCHOR_BASE_URL || 'https://api.sandbox.getanchor.co'}`);

  // 1. List banks — needs only the Accountnumber/Bank-adjacent read scopes, cheapest possible
  //    call to prove the key itself is valid and reachable.
  console.log('\n[1/2] Listing banks...');
  try {
    const banks = await listBanks();
    console.log(`  OK — got ${Array.isArray(banks) ? banks.length : '?'} banks back.`);
    if (Array.isArray(banks) && banks[0]) {
      console.log(`  First result: ${JSON.stringify(banks[0]).slice(0, 200)}`);
    }
  } catch (err) {
    if (err instanceof AnchorError) {
      console.error(`  FAILED (${err.statusCode}): ${err.message}`);
      if (err.isUnauthorized()) {
        console.error('  -> Key is being rejected. Double-check ANCHOR_API_KEY was copied correctly.');
      } else if (err.isForbidden()) {
        console.error('  -> Key is valid but missing a permission scope for this call.');
      } else if (err.isNotFound()) {
        console.error('  -> Got a 404 — the /api/v1/banks path may not be exactly right. Check Anchor\'s API reference directly.');
      }
      console.error('  Raw context:', JSON.stringify(err.context).slice(0, 500));
    } else {
      console.error('  FAILED (non-Anchor error):', err);
    }
  }

  // 2. Create a test individual customer — needs Customer: Write. This is the first real step
  //    of the actual flow (a Customer must exist before a Deposit Account can be created for
  //    them), so a success here means the key is cleared for that next step too.
  console.log('\n[2/2] Creating a test individual customer...');
  try {
    const customer = await createIndividualCustomer({
      fullName: { firstName: 'Plugr', lastName: 'SandboxTest' },
      address: {
        addressLine_1: 'Quarter 25, Yabatech Staff Quarters',
        city: 'Yaba',
        state: 'Lagos',
        country: 'NG',
      },
      email: `sandbox-test+${Date.now()}@getplugr.com`,
      // Anchor rejects a phone number already used in the organisation, so vary it per run.
      phoneNumber: `080${String(Date.now()).slice(-8)}`,
      metadata: { source: 'anchor-sandbox-connectivity-test' },
    });
    console.log('  OK — customer created:', JSON.stringify(customer).slice(0, 300));
    console.log('\nBoth checks passed. The key and these two scopes are wired correctly.');
  } catch (err) {
    if (err instanceof AnchorError) {
      console.error(`  FAILED (${err.statusCode}): ${err.message}`);
      console.error('  Raw context:', JSON.stringify(err.context).slice(0, 500));
    } else {
      console.error('  FAILED (non-Anchor error):', err);
    }
  }
}

main();
