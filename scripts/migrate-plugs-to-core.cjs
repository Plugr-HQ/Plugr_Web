#!/usr/bin/env node
/**
 * scripts/migrate-plugs-to-core.cjs
 *
 * Copies the Plug catalogue out of the hack_ demo tables into the core product tables so the
 * /app surface has something to browse:
 *
 *   hack_plugs  ->  "User" (role PLUG) + "PlugProfile" (+ "Category" lookup by trade code)
 *
 * Idempotent: keyed on a deterministic placeholder phone per Plug, so re-running updates the
 * same rows instead of creating duplicates.
 *
 * DRY RUN BY DEFAULT — these are production tables. Pass --apply to actually write.
 *
 *   node scripts/migrate-plugs-to-core.cjs            # show what would happen
 *   node scripts/migrate-plugs-to-core.cjs --apply    # do it
 *   node scripts/migrate-plugs-to-core.cjs --all      # include unverified test accounts
 *
 * By default only catalogue-quality Plugs are migrated: ops-verified, with a real rating.
 * hack_plugs also holds throwaway rows left behind by onboarding test runs (rating 0, no
 * jobs, unverified). That is test residue, not catalogue, and putting it in the production
 * "User" table would be pollution. --all overrides if you really want them.
 *
 * DELIBERATELY NOT MIGRATED: hack_jobs and hack_transactions. Those are demo artefacts
 * (simulated payments, 60-second escrow releases). Copying them into "Job"/"transactions"
 * would put fake jobs and fake money movements into the same tables the real product reports
 * on. The catalogue is what /app needs; job history belongs to the demo.
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const APPLY = process.argv.includes('--apply');
const ALL = process.argv.includes('--all');

/** Catalogue-quality = ops-verified and carrying a real trust record. */
function isCatalogue(p) {
  return Boolean(p.verified) && Number(p.rating ?? 0) > 0;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * Seeded Plugs have no phone number (hack_plugs never had the column) but "User"."phone" is
 * NOT NULL UNIQUE. Derive a stable, obviously-synthetic one from the Plug's uuid so the
 * migration is repeatable and the rows are identifiable later.
 *
 * 0800 is not an allocated Nigerian mobile prefix, so these cannot collide with a real user.
 */
function placeholderPhone(uuid) {
  const digits = BigInt('0x' + uuid.replace(/-/g, '').slice(0, 12)) % 10000000n;
  return '0800' + String(digits).padStart(7, '0');
}

function seedEmail(uuid) {
  return `seed.${uuid.slice(0, 8)}@plugr.seed`;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

  const { rows: allPlugs } = await pool.query('select * from hack_plugs order by name');
  const { rows: cats } = await pool.query('select id, code from "Category"');
  const catByCode = new Map(cats.map((c) => [c.code, c.id]));

  const plugs = ALL ? allPlugs : allPlugs.filter(isCatalogue);
  const excluded = allPlugs.length - plugs.length;

  console.log(
    `${APPLY ? 'APPLYING' : 'DRY RUN'} — ${plugs.length} of ${allPlugs.length} plug(s) from hack_plugs` +
      (excluded ? `  (${excluded} test row(s) excluded; --all to include)` : '') +
      '\n'
  );

  let created = 0;
  let updated = 0;
  const skipped = [];

  for (const p of plugs) {
    const categoryId = catByCode.get(p.trade);
    if (!categoryId) {
      skipped.push(`${p.name} — no Category with code '${p.trade}'`);
      continue;
    }

    const phone = placeholderPhone(p.id);
    const email = seedEmail(p.id);

    const { rows: existing } = await pool.query('select id from "User" where phone = $1', [phone]);
    const isNew = existing.length === 0;

    console.log(
      `  ${isNew ? '+' : '~'} ${String(p.name).padEnd(22)} ${String(p.trade).padEnd(12)} ` +
        `phone=${phone} rating=${p.rating} jobs=${p.jobs_completed} verified=${p.verified}`
    );

    if (!APPLY) {
      isNew ? created++ : updated++;
      continue;
    }

    const {
      rows: [user],
    } = await pool.query(
      `insert into "User" (id, phone, email, name, role, status, "createdAt", "updatedAt")
       values (gen_random_uuid(), $1, $2, $3, 'PLUG', 'ACTIVE', now(), now())
       on conflict (phone) do update
         set name = excluded.name, role = 'PLUG', "updatedAt" = now()
       returning id`,
      [phone, email, p.name]
    );

    await pool.query(
      `insert into "PlugProfile"
         (id, "userId", bio, status, "isVerified", "averageRating", "categoryId",
          "jobsCompleted", "walletBalanceAvailable", "walletBalanceLocked",
          "photoUrl", "workPosts", "createdAt", "updatedAt")
       values ($1, $2, $3, 'ACTIVE', $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
       on conflict ("userId") do update
         set bio                      = excluded.bio,
             "isVerified"             = excluded."isVerified",
             "averageRating"          = excluded."averageRating",
             "categoryId"             = excluded."categoryId",
             "jobsCompleted"          = excluded."jobsCompleted",
             "walletBalanceAvailable" = excluded."walletBalanceAvailable",
             "walletBalanceLocked"    = excluded."walletBalanceLocked",
             "photoUrl"               = excluded."photoUrl",
             "workPosts"              = excluded."workPosts",
             "updatedAt"              = now()`,
      [
        p.id, // reuse the hack_ uuid as the PlugProfile id so existing links stay meaningful
        user.id,
        p.bio ?? null,
        p.verified ?? false,
        Number(p.rating ?? 0),
        categoryId,
        Number(p.jobs_completed ?? 0),
        Number(p.wallet_balance_available ?? 0),
        Number(p.wallet_balance_locked ?? 0),
        p.photo_url ?? null,
        JSON.stringify(p.work_posts ?? []),
      ]
    );

    isNew ? created++ : updated++;
  }

  console.log(
    `\n${APPLY ? 'Done' : 'Would'}: ${created} created, ${updated} updated` +
      (skipped.length ? `, ${skipped.length} skipped` : '')
  );
  skipped.forEach((s) => console.log(`  ! skipped ${s}`));
  if (!APPLY) console.log('\nNothing was written. Re-run with --apply to commit.');

  const { rows: after } = await pool.query(
    `select count(*)::int n from "PlugProfile" where "deletedAt" is null`
  );
  console.log(`"PlugProfile" rows now: ${after[0].n}`);
}

main()
  .then(() => pool.end())
  .catch((e) => {
    console.error('FAILED:', e.message);
    pool.end();
    process.exit(1);
  });
