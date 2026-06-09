-- Rate limiting: a small counter table + an atomic check function used by the
-- API to throttle abuse-prone endpoints (payment intents, contact form).
-- No external service required - reuses the existing Postgres instance.

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now()
);

-- Only the service-role API (which bypasses RLS) touches this table.
alter table public.rate_limits enable row level security;

-- Atomically record a hit for p_key within a rolling window and report whether
-- the caller is still under p_limit. Returns true if allowed, false if over.
create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_count integer;
begin
  insert into public.rate_limits as rl (key, count, window_start)
  values (p_key, 1, v_now)
  on conflict (key) do update
    set
      count = case
        when rl.window_start < v_now - make_interval(secs => p_window_seconds) then 1
        else rl.count + 1
      end,
      window_start = case
        when rl.window_start < v_now - make_interval(secs => p_window_seconds) then v_now
        else rl.window_start
      end
  returning rl.count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Lock the function down to the service role only (API calls it server-side).
revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
