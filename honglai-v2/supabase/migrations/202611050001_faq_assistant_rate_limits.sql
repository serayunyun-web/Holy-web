create table private.faq_assistant_rate_limits (
  id bigint generated always as identity primary key,
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null default now()
);

create index faq_assistant_rate_limits_lookup_idx
  on private.faq_assistant_rate_limits (fingerprint, occurred_at desc);
create index faq_assistant_rate_limits_cleanup_idx
  on private.faq_assistant_rate_limits (occurred_at);

create or replace function public.claim_faq_assistant_request(
  p_fingerprint text,
  p_short_limit integer default 10,
  p_short_window_seconds integer default 600,
  p_daily_limit integer default 50
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_short_count integer;
  v_daily_count integer;
begin
  if p_fingerprint is null
    or p_fingerprint !~ '^[0-9a-f]{64}$'
    or p_short_limit is null or p_short_limit < 1 or p_short_limit > 100
    or p_short_window_seconds is null or p_short_window_seconds < 60 or p_short_window_seconds > 3600
    or p_daily_limit is null or p_daily_limit < p_short_limit or p_daily_limit > 1000 then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('faq-assistant:' || p_fingerprint, 0));

  delete from private.faq_assistant_rate_limits
  where occurred_at < now() - interval '48 hours';

  select count(*) into v_short_count
  from private.faq_assistant_rate_limits
  where fingerprint = p_fingerprint
    and occurred_at > now() - make_interval(secs => p_short_window_seconds);

  select count(*) into v_daily_count
  from private.faq_assistant_rate_limits
  where fingerprint = p_fingerprint
    and occurred_at > now() - interval '24 hours';

  if v_short_count >= p_short_limit or v_daily_count >= p_daily_limit then
    return false;
  end if;

  insert into private.faq_assistant_rate_limits (fingerprint)
  values (p_fingerprint);
  return true;
end;
$$;

revoke all on table private.faq_assistant_rate_limits from public, anon, authenticated;
revoke all on function public.claim_faq_assistant_request(text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.claim_faq_assistant_request(text, integer, integer, integer)
  to service_role;
