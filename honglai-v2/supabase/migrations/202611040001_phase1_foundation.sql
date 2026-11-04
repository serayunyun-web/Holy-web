begin;

create extension if not exists pgcrypto;
create schema if not exists private;

create type public.app_role as enum ('admin', 'manager', 'staff');
create type public.request_status as enum ('received', 'under_review', 'approved', 'rejected', 'closed');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.business_inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_no text not null unique,
  idempotency_key uuid not null unique,
  company_name text not null check (char_length(company_name) between 1 and 120),
  contact_name text not null check (char_length(contact_name) between 1 and 80),
  phone text not null check (char_length(phone) between 6 and 30),
  email text not null check (char_length(email) between 3 and 254),
  line_id text check (line_id is null or char_length(line_id) <= 80),
  city text not null check (char_length(city) between 1 and 20),
  cooperation_type text not null check (char_length(cooperation_type) between 1 and 80),
  product_interest text check (product_interest is null or char_length(product_interest) <= 200),
  estimated_quantity integer check (estimated_quantity is null or estimated_quantity > 0),
  specifications text check (specifications is null or char_length(specifications) <= 500),
  material_requirements text check (material_requirements is null or char_length(material_requirements) <= 500),
  expected_date date,
  description text not null check (char_length(description) between 1 and 4000),
  status public.request_status not null default 'received',
  assigned_to uuid references auth.users(id) on delete set null,
  internal_notes text,
  source_page text not null default '/business',
  privacy_consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_inquiry_status_history (
  id bigint generated always as identity primary key,
  inquiry_id uuid not null references public.business_inquiries(id) on delete restrict,
  from_status public.request_status,
  to_status public.request_status not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.sample_requests (
  id uuid primary key default gen_random_uuid(),
  request_no text not null unique,
  idempotency_key uuid not null unique,
  company_name text not null check (char_length(company_name) between 1 and 120),
  contact_name text not null check (char_length(contact_name) between 1 and 80),
  phone text not null check (char_length(phone) between 6 and 30),
  email text not null check (char_length(email) between 3 and 254),
  city text not null check (char_length(city) between 1 and 20),
  interest text not null check (char_length(interest) between 1 and 500),
  purpose text not null check (char_length(purpose) between 1 and 2000),
  note text check (note is null or char_length(note) <= 2000),
  status public.request_status not null default 'received',
  assigned_to uuid references auth.users(id) on delete set null,
  internal_notes text,
  source_page text not null default '/business/sample-request',
  privacy_consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sample_request_status_history (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.sample_requests(id) on delete restrict,
  from_status public.request_status,
  to_status public.request_status not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.public_submission_limits (
  fingerprint text not null,
  form_type text not null check (form_type in ('business_inquiry', 'sample_request')),
  window_started_at timestamptz not null,
  attempt_count integer not null default 1 check (attempt_count > 0),
  primary key (fingerprint, form_type, window_started_at)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  request_id uuid,
  created_at timestamptz not null default now()
);

create index business_inquiries_status_created_idx on public.business_inquiries (status, created_at desc);
create index business_inquiries_email_idx on public.business_inquiries (lower(email));
create index sample_requests_status_created_idx on public.sample_requests (status, created_at desc);
create index sample_requests_email_idx on public.sample_requests (lower(email));
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);

create or replace function private.has_role(required_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles ur
    join public.profiles p on p.user_id = ur.user_id
    where ur.user_id = (select auth.uid())
      and ur.role = any(required_roles)
      and p.is_active
  );
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger business_inquiries_updated_at before update on public.business_inquiries
for each row execute function private.set_updated_at();
create trigger sample_requests_updated_at before update on public.sample_requests
for each row execute function private.set_updated_at();

create or replace function private.log_business_inquiry_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status is distinct from new.status then
    insert into public.business_inquiry_status_history
      (inquiry_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create or replace function private.log_sample_request_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status is distinct from new.status then
    insert into public.sample_request_status_history
      (request_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger business_inquiry_status_changed after update of status on public.business_inquiries
for each row execute function private.log_business_inquiry_status();
create trigger sample_request_status_changed after update of status on public.sample_requests
for each row execute function private.log_sample_request_status();

create or replace function private.log_initial_request_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'business_inquiries' then
    insert into public.business_inquiry_status_history (inquiry_id, to_status)
    values (new.id, new.status);
  else
    insert into public.sample_request_status_history (request_id, to_status)
    values (new.id, new.status);
  end if;
  return new;
end;
$$;

create trigger business_inquiry_initial_status after insert on public.business_inquiries
for each row execute function private.log_initial_request_status();
create trigger sample_request_initial_status after insert on public.sample_requests
for each row execute function private.log_initial_request_status();

create or replace function public.claim_public_submission(
  p_fingerprint text,
  p_form_type text,
  p_limit integer default 5,
  p_window_minutes integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := date_trunc('hour', now());
  v_count integer;
begin
  if p_form_type not in ('business_inquiry', 'sample_request')
    or p_limit < 1 or p_window_minutes <> 60 then
    return false;
  end if;

  insert into public.public_submission_limits
    (fingerprint, form_type, window_started_at, attempt_count)
  values (p_fingerprint, p_form_type, v_window, 1)
  on conflict (fingerprint, form_type, window_started_at)
  do update set attempt_count = public.public_submission_limits.attempt_count + 1
  returning attempt_count into v_count;

  return v_count <= p_limit;
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.business_inquiries enable row level security;
alter table public.business_inquiry_status_history enable row level security;
alter table public.sample_requests enable row level security;
alter table public.sample_request_status_history enable row level security;
alter table public.public_submission_limits enable row level security;
alter table public.audit_logs enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on function public.claim_public_submission(text, text, integer, integer) from public, anon, authenticated;
revoke all on function private.has_role(public.app_role[]) from public;
grant execute on function public.claim_public_submission(text, text, integer, integer) to service_role;
grant execute on function private.has_role(public.app_role[]) to authenticated;
grant usage on schema public to authenticated;
grant usage on schema private to authenticated;
grant select on public.profiles, public.user_roles to authenticated;
grant select, update on public.business_inquiries, public.sample_requests to authenticated;
grant select on public.business_inquiry_status_history, public.sample_request_status_history to authenticated;

create policy staff_read_business_inquiries on public.business_inquiries
for select to authenticated using (private.has_role(array['admin','manager','staff']::public.app_role[]));
create policy managers_update_business_inquiries on public.business_inquiries
for update to authenticated
using (private.has_role(array['admin','manager']::public.app_role[]))
with check (private.has_role(array['admin','manager']::public.app_role[]));
create policy staff_read_business_history on public.business_inquiry_status_history
for select to authenticated using (private.has_role(array['admin','manager','staff']::public.app_role[]));

create policy staff_read_sample_requests on public.sample_requests
for select to authenticated using (private.has_role(array['admin','manager','staff']::public.app_role[]));
create policy managers_update_sample_requests on public.sample_requests
for update to authenticated
using (private.has_role(array['admin','manager']::public.app_role[]))
with check (private.has_role(array['admin','manager']::public.app_role[]));
create policy staff_read_sample_history on public.sample_request_status_history
for select to authenticated using (private.has_role(array['admin','manager','staff']::public.app_role[]));

create policy users_read_own_profile on public.profiles
for select to authenticated using (user_id = (select auth.uid()));
create policy admins_read_profiles on public.profiles
for select to authenticated using (private.has_role(array['admin']::public.app_role[]));
create policy users_read_own_roles on public.user_roles
for select to authenticated using (user_id = (select auth.uid()));
create policy admins_read_roles on public.user_roles
for select to authenticated using (private.has_role(array['admin']::public.app_role[]));

commit;
