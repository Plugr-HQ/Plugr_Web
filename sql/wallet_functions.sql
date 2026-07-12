-- Run these in Supabase SQL editor after creating the hack_ tables.
-- Kept in-repo for reference — the CTO owns running these against the hack_ schema.

create or replace function increment_wallet_locked(p_plug_id uuid, p_amount numeric)
returns void as $$
begin
  update hack_plugs
  set wallet_balance_locked = wallet_balance_locked + p_amount
  where id = p_plug_id;
end;
$$ language plpgsql;

create or replace function move_locked_to_available(p_plug_id uuid, p_amount numeric)
returns void as $$
begin
  update hack_plugs
  set wallet_balance_locked = wallet_balance_locked - p_amount,
      wallet_balance_available = wallet_balance_available + p_amount,
      jobs_completed = jobs_completed + 1
  where id = p_plug_id;
end;
$$ language plpgsql;
