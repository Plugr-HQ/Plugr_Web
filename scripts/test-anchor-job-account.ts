// scripts/test-anchor-job-account.ts
// Opens a real per-job DepositAccount under the master customer and prints the account number a
// client would pay into — the live confirmation that createJobDepositAccount reads the right
// fields. Doesn't touch the DB (it does not call setJobAnchorAccount).
//
// Run with: npx tsx scripts/test-anchor-job-account.ts <jobId>
//
// Needs in .env (or .env.local): ANCHOR_API_KEY and ANCHOR_MASTER_CUSTOMER_ID (from
// scripts/create-anchor-master-customer.ts, with KYC approved).

import 'dotenv/config';
import {
  createJobDepositAccount,
  listAccountNumbers,
  AnchorAccountNumberPendingError,
  AnchorError,
} from '../src/lib/anchor';

async function main() {
  const jobId = process.argv[2];
  if (!jobId) {
    console.error('Usage: npx tsx scripts/test-anchor-job-account.ts <jobId>');
    process.exit(1);
  }
  for (const name of ['ANCHOR_API_KEY', 'ANCHOR_MASTER_CUSTOMER_ID']) {
    if (!process.env[name]) {
      console.error(`${name} is not set in your environment. Add it to .env or .env.local and re-run.`);
      process.exit(1);
    }
  }

  console.log(`Opening a DepositAccount for job ${jobId}...`);
  try {
    const result = await createJobDepositAccount(jobId);
    console.log('  OK —', JSON.stringify(result, null, 2));
    // Print the raw resource too, so the field names createJobDepositAccount relies on can be
    // checked by eye against what Anchor actually returned.
    const raw = await listAccountNumbers(result.depositAccountId);
    console.log('\nRaw /account-numbers response:\n', JSON.stringify(raw, null, 2));
  } catch (err) {
    if (err instanceof AnchorAccountNumberPendingError) {
      console.error(`  DepositAccount ${err.depositAccountId} was opened but no usable account number came back.`);
      console.error('  Last /account-numbers response:', JSON.stringify(err.lastResponse, null, 2));
      console.error('  If the number is there under a different field name, fix fetchJobVirtualAccount in src/lib/anchor.ts.');
    } else if (err instanceof AnchorError) {
      console.error(`  FAILED (${err.statusCode}): ${err.message}`);
      console.error('  Raw context:', JSON.stringify(err.context).slice(0, 800));
    } else {
      console.error('  FAILED (non-Anchor error):', err);
    }
    process.exit(1);
  }
}

main();
