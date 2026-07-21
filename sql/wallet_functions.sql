create or replace function increment_wallet_locked(p_plug_id uuid, p_amount numeric)
returns void as $$
begin
  update "PlugProfile"
  set "walletBalanceLocked" = "walletBalanceLocked" + p_amount
  where id = p_plug_id;

  if not found then
    raise exception 'increment_wallet_locked: no PlugProfile found for id %', p_plug_id;
  end if;
end;
$$ language plpgsql;

create or replace function move_locked_to_available(p_plug_id uuid, p_amount numeric)
returns void as $$
begin
  update "PlugProfile"
  set "walletBalanceLocked" = "walletBalanceLocked" - p_amount,
      "walletBalanceAvailable" = "walletBalanceAvailable" + p_amount,
      "jobsCompleted" = "jobsCompleted" + 1
  where id = p_plug_id
    and "walletBalanceLocked" >= p_amount;

  if not found then
    raise exception 'move_locked_to_available: insufficient locked balance (or plug % not found) for amount %', p_plug_id, p_amount;
  end if;
end;
$$ language plpgsql;