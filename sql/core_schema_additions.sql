-- sql/core_schema_additions.sql
--
-- Additive, idempotent changes to the CORE (Prisma-managed) schema so the /app surface can
-- run the Plugr escrow lifecycle against the real tables instead of the hack_ demo tables.
--
-- IMPORTANT FOR THE CTO — PRISMA DRIFT
-- These objects are created directly in Postgres, but "PlugProfile" is Prisma-managed. Until
-- the two columns below are added to schema.prisma, `prisma migrate dev` will report drift
-- and `prisma migrate reset` would drop them. Fold this into the Prisma schema:
--
--   model PlugProfile {
--     ...
--     photoUrl  String?
--     workPosts Json    @default("[]")
--   }
--
-- Everything here is additive and nullable/defaulted, so it cannot break existing rows or
-- existing product code.

-- ---------------------------------------------------------------------------
-- 1. Categories. Only "Electrician" existed; the Plug catalogue also spans plumbing and
--    furniture. `code` is what the app matches on (lowercase, stable); `name` is display.
--    "updatedAt" is NOT NULL with no default in the Prisma schema, so it is set explicitly.
-- ---------------------------------------------------------------------------
insert into "Category" (id, name, code, description, "isActive", "createdAt", "updatedAt")
values
  (gen_random_uuid(), 'Plumber',   'plumber',   'Pipes, leaks, plumbing installation and repair', true, now(), now()),
  (gen_random_uuid(), 'Furniture', 'furniture', 'Furniture making, fitting and carpentry',        true, now(), now())
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- 2. PlugProfile columns the core schema has nowhere to put today.
--    - photoUrl  : the Plug's profile photo (browse cards, PLG-02 identity block)
--    - workPosts : the portfolio grid on PLG-02, same jsonb shape as hack_plugs.work_posts
-- ---------------------------------------------------------------------------
alter table "PlugProfile" add column if not exists "photoUrl"  text;
alter table "PlugProfile" add column if not exists "workPosts" jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- 3. Wallet movement against PlugProfile, mirroring sql/wallet_functions.sql (hack_plugs).
--    Suffixed _core so both schemas' functions can coexist while /demo stays on hack_.
--    Balances are double precision in the core schema (numeric in hack_), hence the cast.
-- ---------------------------------------------------------------------------
create or replace function increment_wallet_locked_core(p_plug_id uuid, p_amount numeric)
returns void as $$
begin
  update "PlugProfile"
  set "walletBalanceLocked" = "walletBalanceLocked" + p_amount::double precision,
      "updatedAt" = now()
  where id = p_plug_id;
end;
$$ language plpgsql;

create or replace function move_locked_to_available_core(p_plug_id uuid, p_amount numeric)
returns void as $$
begin
  update "PlugProfile"
  set "walletBalanceLocked"    = "walletBalanceLocked"    - p_amount::double precision,
      "walletBalanceAvailable" = "walletBalanceAvailable" + p_amount::double precision,
      "jobsCompleted"          = "jobsCompleted" + 1,
      "updatedAt"              = now()
  where id = p_plug_id;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- 4. Escrow state lives in "Job"."escrowStatus" (free text), which the core schema already
--    indexes (Job_escrowStatus_idx) — no enum change needed. The JobStatus enum has no
--    paid_escrow / released / withdrawn members, so "Job"."status" carries the coarse
--    product state and "escrowStatus" carries the escrow lifecycle:
--
--      escrowStatus   requested -> paid_escrow -> accepted -> completed -> released -> withdrawn
--      status         PENDING   -> PLUG_ASSIGNED -> PLUG_ACCEPTED -> IN_PROGRESS -> COMPLETED
--
--    Nothing to run here — documented so the mapping isn't rediscovered later.
-- ---------------------------------------------------------------------------
