begin;

create type public.manual_inquiry_status as enum ('pending_review', 'contacted', 'quoted', 'converted', 'closed');

create table public.manual_inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_no text not null unique,
  idempotency_key uuid not null unique,
  customer_type text not null check (customer_type in ('個人', '公司行號', '學校或行政單位')),
  contact_name text not null check (char_length(contact_name) between 1 and 80),
  phone text not null check (char_length(phone) between 6 and 30),
  email text not null check (char_length(email) between 3 and 254),
  organization text check (organization is null or char_length(organization) <= 120),
  preferred_contact text check (preferred_contact is null or preferred_contact in ('電話', 'Email', 'LINE')),
  line_id text check (line_id is null or char_length(line_id) <= 80),
  delivery_method text check (delivery_method is null or delivery_method in ('自取', '需要配送', '尚未確定')),
  delivery_address text check (delivery_address is null or char_length(delivery_address) <= 500),
  expected_date date,
  file_status text check (file_status is null or char_length(file_status) <= 80),
  special_requirements text check (special_requirements is null or char_length(special_requirements) <= 2000),
  customer_notes text check (customer_notes is null or char_length(customer_notes) <= 2000),
  contact_notes text check (contact_notes is null or char_length(contact_notes) <= 2000),
  status public.manual_inquiry_status not null default 'pending_review',
  assigned_to uuid references auth.users(id) on delete set null,
  internal_notes text,
  source_page text not null default '/order',
  privacy_consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.manual_inquiry_items (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.manual_inquiries(id) on delete restrict,
  product_id text not null check (char_length(product_id) between 1 and 80),
  product_slug text not null check (char_length(product_slug) between 1 and 80),
  product_name text not null check (char_length(product_name) between 1 and 120),
  form_type text not null check (form_type in ('book-binding', 'menu', 'certificate-folder', 'construction-book', 'unsure')),
  quantity integer not null check (quantity > 0),
  specifications jsonb not null default '{}'::jsonb check (jsonb_typeof(specifications) = 'object'),
  created_at timestamptz not null default now()
);

create table public.manual_inquiry_status_history (
  id bigint generated always as identity primary key,
  inquiry_id uuid not null references public.manual_inquiries(id) on delete restrict,
  from_status public.manual_inquiry_status,
  to_status public.manual_inquiry_status not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index manual_inquiries_status_created_idx on public.manual_inquiries (status, created_at desc);
create index manual_inquiries_email_idx on public.manual_inquiries (lower(email));
create index manual_inquiry_items_inquiry_idx on public.manual_inquiry_items (inquiry_id);
create index manual_inquiry_items_product_idx on public.manual_inquiry_items (product_id, created_at desc);

create trigger manual_inquiries_updated_at before update on public.manual_inquiries
for each row execute function private.set_updated_at();

create or replace function private.log_manual_inquiry_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.status is distinct from new.status then
    insert into public.manual_inquiry_status_history
      (inquiry_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger manual_inquiry_status_changed after update of status on public.manual_inquiries
for each row execute function private.log_manual_inquiry_status();

alter table public.public_submission_limits
  drop constraint public_submission_limits_form_type_check;
alter table public.public_submission_limits
  add constraint public_submission_limits_form_type_check
  check (form_type in ('business_inquiry', 'sample_request', 'manual_inquiry'));

create or replace function public.claim_public_submission(
  p_ip_fingerprint text,
  p_email_fingerprint text,
  p_form_type text,
  p_limit integer default 5
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cutoff timestamptz := now() - interval '60 minutes';
  v_ip_count integer;
  v_email_count integer;
begin
  if p_ip_fingerprint is null
    or p_email_fingerprint is null
    or p_form_type is null
    or p_limit is null
    or p_form_type not in ('business_inquiry', 'sample_request', 'manual_inquiry')
    or p_limit < 1 or p_limit > 20
    or p_ip_fingerprint !~ '^[0-9a-fA-F]{64}$'
    or p_email_fingerprint !~ '^[0-9a-fA-F]{64}$' then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ip:' || p_form_type || ':' || p_ip_fingerprint, 0));
  perform pg_advisory_xact_lock(hashtextextended('email:' || p_form_type || ':' || p_email_fingerprint, 0));
  delete from public.public_submission_limits where occurred_at < now() - interval '24 hours';

  select count(*) into v_ip_count from public.public_submission_limits
  where form_type = p_form_type and fingerprint_type = 'ip'
    and fingerprint = p_ip_fingerprint and occurred_at > v_cutoff;
  select count(*) into v_email_count from public.public_submission_limits
  where form_type = p_form_type and fingerprint_type = 'email'
    and fingerprint = p_email_fingerprint and occurred_at > v_cutoff;

  if v_ip_count >= p_limit or v_email_count >= p_limit then return false; end if;
  insert into public.public_submission_limits (fingerprint, fingerprint_type, form_type)
  values (p_ip_fingerprint, 'ip', p_form_type), (p_email_fingerprint, 'email', p_form_type);
  return true;
end;
$$;

create or replace function public.create_manual_inquiry(
  p_inquiry_no text,
  p_idempotency_key uuid,
  p_customer_type text,
  p_contact_name text,
  p_phone text,
  p_email text,
  p_organization text,
  p_preferred_contact text,
  p_line_id text,
  p_delivery_method text,
  p_delivery_address text,
  p_expected_date date,
  p_file_status text,
  p_special_requirements text,
  p_customer_notes text,
  p_contact_notes text,
  p_product_id text,
  p_product_slug text,
  p_product_name text,
  p_form_type text,
  p_quantity integer,
  p_specifications jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inquiry_id uuid;
  v_inquiry_no text;
begin
  select id, inquiry_no into v_inquiry_id, v_inquiry_no
  from public.manual_inquiries where idempotency_key = p_idempotency_key;
  if v_inquiry_id is not null then return v_inquiry_no; end if;

  insert into public.manual_inquiries (
    inquiry_no, idempotency_key, customer_type, contact_name, phone, email,
    organization, preferred_contact, line_id, delivery_method, delivery_address,
    expected_date, file_status, special_requirements, customer_notes, contact_notes,
    privacy_consent_at
  ) values (
    p_inquiry_no, p_idempotency_key, p_customer_type, p_contact_name, p_phone, lower(p_email),
    p_organization, p_preferred_contact, p_line_id, p_delivery_method, p_delivery_address,
    p_expected_date, p_file_status, p_special_requirements, p_customer_notes, p_contact_notes,
    now()
  )
  returning id, inquiry_no into v_inquiry_id, v_inquiry_no;

  insert into public.manual_inquiry_items (
    inquiry_id, product_id, product_slug, product_name, form_type, quantity, specifications
  ) values (
    v_inquiry_id, p_product_id, p_product_slug, p_product_name, p_form_type, p_quantity, p_specifications
  );
  insert into public.manual_inquiry_status_history (inquiry_id, to_status)
  values (v_inquiry_id, 'pending_review');
  return v_inquiry_no;
exception
  when unique_violation then
    select inquiry_no into v_inquiry_no
    from public.manual_inquiries where idempotency_key = p_idempotency_key;
    if v_inquiry_no is null then raise; end if;
    return v_inquiry_no;
end;
$$;

alter table public.manual_inquiries enable row level security;
alter table public.manual_inquiry_items enable row level security;
alter table public.manual_inquiry_status_history enable row level security;

revoke all on table public.manual_inquiries, public.manual_inquiry_items, public.manual_inquiry_status_history
from anon, authenticated;
revoke all on function public.create_manual_inquiry(
  text, uuid, text, text, text, text, text, text, text, text, text, date,
  text, text, text, text, text, text, text, text, integer, jsonb
) from public, anon, authenticated;
revoke all on function private.log_manual_inquiry_status() from public;
grant execute on function public.create_manual_inquiry(
  text, uuid, text, text, text, text, text, text, text, text, text, date,
  text, text, text, text, text, text, text, text, integer, jsonb
) to service_role;
grant select on public.manual_inquiries, public.manual_inquiry_items, public.manual_inquiry_status_history to authenticated;
grant update (status, assigned_to, internal_notes) on public.manual_inquiries to authenticated;

create policy staff_read_manual_inquiries on public.manual_inquiries
for select to authenticated using (private.has_role(array['admin','manager','staff']::public.app_role[]));
create policy managers_update_manual_inquiries on public.manual_inquiries
for update to authenticated
using (private.has_role(array['admin','manager']::public.app_role[]))
with check (private.has_role(array['admin','manager']::public.app_role[]));
create policy staff_read_manual_inquiry_items on public.manual_inquiry_items
for select to authenticated using (private.has_role(array['admin','manager','staff']::public.app_role[]));
create policy staff_read_manual_inquiry_history on public.manual_inquiry_status_history
for select to authenticated using (private.has_role(array['admin','manager','staff']::public.app_role[]));

commit;
