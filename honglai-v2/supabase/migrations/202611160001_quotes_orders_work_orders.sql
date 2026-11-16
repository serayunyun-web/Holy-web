-- 鴻萊 V2：線上試算、附件、正式報價（版本＋確認連結）、正式訂單與工作單。
-- 只新增資料表、欄位與函式，不刪除既有資料。

-- enum 新值必須在交易外新增（新值要 commit 後才能使用）。
alter type public.manual_inquiry_status add value if not exists 'needs_info' after 'contacted';

begin;

/* ---------- 需求：試算快照、運費 ---------- */

alter table public.manual_inquiries
  add column if not exists estimate jsonb,
  add column if not exists estimate_total integer check (estimate_total is null or estimate_total >= 0),
  add column if not exists price_version text,
  add column if not exists shipping jsonb,
  add column if not exists trial_email_sent_at timestamptz;

alter table public.manual_inquiries drop constraint if exists manual_inquiries_delivery_method_check;
alter table public.manual_inquiries add constraint manual_inquiries_delivery_method_check check (
  delivery_method is null or delivery_method in (
    '自取', '需要配送', '尚未確定',
    '新竹貨運（隔日配）', '全球愛鄉機車配送（隔日配）', '全球愛鄉機車配送（當日配）'
  )
);

/* ---------- 附件 ---------- */

create table public.manual_inquiry_attachments (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.manual_inquiries(id) on delete restrict,
  storage_path text not null unique check (storage_path ~ '^pending/[0-9a-f-]{36}/[0-9]{1,2}\.[a-z]{2,4}$'),
  file_name text not null check (char_length(file_name) between 1 and 255),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  content_type text check (content_type is null or char_length(content_type) <= 120),
  created_at timestamptz not null default now()
);
create index manual_inquiry_attachments_inquiry_idx on public.manual_inquiry_attachments (inquiry_id);

-- 私有 bucket：只能透過 Edge Function 簽發的上傳網址寫入；後台人員以簽名網址下載。
insert into storage.buckets (id, name, public, file_size_limit)
values ('inquiry-files', 'inquiry-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create policy staff_read_inquiry_files on storage.objects
for select to authenticated
using (bucket_id = 'inquiry-files' and private.has_role(array['admin','manager','staff']::public.app_role[]));

/* ---------- 正式報價 ---------- */

create type public.quote_status as enum ('sent', 'accepted', 'superseded', 'revoked');

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.manual_inquiries(id) on delete restrict,
  quote_no text not null unique,
  version integer not null check (version > 0),
  status public.quote_status not null default 'sent',
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  shipping_fee integer not null default 0 check (shipping_fee >= 0),
  subtotal integer not null check (subtotal >= 0),
  total integer not null check (total >= 0),
  delivery_date date not null,
  notes text check (notes is null or char_length(notes) <= 2000),
  valid_until timestamptz not null,
  token_hash text not null unique,
  email_sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (inquiry_id, version)
);
create unique index quotes_one_active_per_inquiry on public.quotes (inquiry_id) where status = 'sent';
create index quotes_inquiry_idx on public.quotes (inquiry_id, version desc);

/* ---------- 正式訂單與工作單 ---------- */

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  inquiry_id uuid not null references public.manual_inquiries(id) on delete restrict,
  quote_id uuid not null unique references public.quotes(id) on delete restrict,
  total integer not null check (total >= 0),
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create type public.work_order_status as enum ('pending_confirmation', 'scheduled', 'in_production', 'completed', 'delivered');

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  work_order_no text not null unique,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  status public.work_order_status not null default 'pending_confirmation',
  snapshot jsonb not null,
  due_date date,
  assignee text check (assignee is null or char_length(assignee) <= 80),
  production_notes text check (production_notes is null or char_length(production_notes) <= 2000),
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index work_orders_status_idx on public.work_orders (status, due_date);

create table public.work_order_status_history (
  id bigint generated always as identity primary key,
  work_order_id uuid not null references public.work_orders(id) on delete restrict,
  from_status public.work_order_status,
  to_status public.work_order_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create trigger work_orders_updated_at before update on public.work_orders
for each row execute function private.set_updated_at();

create or replace function private.log_work_order_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.work_order_status_history (work_order_id, from_status, to_status, changed_by)
    values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status, auth.uid());
  end if;
  return new;
end;
$$;
create trigger work_order_status_changed after insert or update of status on public.work_orders
for each row execute function private.log_work_order_status();

/* ---------- 公開提交頻率限制：加入附件上傳 ---------- */

alter table public.public_submission_limits drop constraint public_submission_limits_form_type_check;
alter table public.public_submission_limits add constraint public_submission_limits_form_type_check
  check (form_type in ('business_inquiry', 'sample_request', 'manual_inquiry', 'manual_inquiry_upload'));

create or replace function public.claim_public_submission(
  p_ip_fingerprint text, p_email_fingerprint text, p_form_type text, p_limit integer default 5
)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_cutoff timestamptz := now() - interval '60 minutes';
  v_ip_count integer;
  v_email_count integer;
begin
  if p_ip_fingerprint is null or p_email_fingerprint is null or p_form_type is null or p_limit is null
    or p_form_type not in ('business_inquiry', 'sample_request', 'manual_inquiry', 'manual_inquiry_upload')
    or p_limit < 1 or p_limit > 20
    or p_ip_fingerprint !~ '^[0-9a-fA-F]{64}$' or p_email_fingerprint !~ '^[0-9a-fA-F]{64}$' then
    return false;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('ip:' || p_form_type || ':' || p_ip_fingerprint, 0));
  perform pg_advisory_xact_lock(hashtextextended('email:' || p_form_type || ':' || p_email_fingerprint, 0));
  delete from public.public_submission_limits where occurred_at < now() - interval '24 hours';
  select count(*) into v_ip_count from public.public_submission_limits
  where form_type = p_form_type and fingerprint_type = 'ip' and fingerprint = p_ip_fingerprint and occurred_at > v_cutoff;
  select count(*) into v_email_count from public.public_submission_limits
  where form_type = p_form_type and fingerprint_type = 'email' and fingerprint = p_email_fingerprint and occurred_at > v_cutoff;
  if v_ip_count >= p_limit or v_email_count >= p_limit then return false; end if;
  insert into public.public_submission_limits (fingerprint, fingerprint_type, form_type)
  values (p_ip_fingerprint, 'ip', p_form_type), (p_email_fingerprint, 'email', p_form_type);
  return true;
end;
$$;

/* ---------- 建立需求（含試算快照與附件，同一交易） ---------- */

create or replace function public.create_manual_inquiry_v2(p_inquiry jsonb, p_item jsonb, p_attachments jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_no text;
  v_key uuid := (p_inquiry->>'idempotency_key')::uuid;
begin
  select id, inquiry_no into v_id, v_no from public.manual_inquiries where idempotency_key = v_key;
  if v_id is not null then return v_no; end if;

  insert into public.manual_inquiries (
    inquiry_no, idempotency_key, customer_type, contact_name, phone, email, organization,
    preferred_contact, line_id, delivery_method, delivery_address, expected_date,
    customer_notes, privacy_consent_at, estimate, estimate_total, price_version, shipping
  ) values (
    p_inquiry->>'inquiry_no', v_key, p_inquiry->>'customer_type', p_inquiry->>'contact_name',
    p_inquiry->>'phone', lower(p_inquiry->>'email'), nullif(p_inquiry->>'organization', ''),
    nullif(p_inquiry->>'preferred_contact', ''), nullif(p_inquiry->>'line_id', ''),
    nullif(p_inquiry->>'delivery_method', ''), nullif(p_inquiry->>'delivery_address', ''),
    nullif(p_inquiry->>'expected_date', '')::date, nullif(p_inquiry->>'customer_notes', ''), now(),
    p_inquiry->'estimate', nullif(p_inquiry->>'estimate_total', '')::integer,
    p_inquiry->>'price_version', p_inquiry->'shipping'
  ) returning id, inquiry_no into v_id, v_no;

  insert into public.manual_inquiry_items (inquiry_id, product_id, product_slug, product_name, form_type, quantity, specifications)
  values (v_id, p_item->>'product_id', p_item->>'product_slug', p_item->>'product_name', p_item->>'form_type',
    (p_item->>'quantity')::integer, coalesce(p_item->'specifications', '{}'::jsonb));

  insert into public.manual_inquiry_attachments (inquiry_id, storage_path, file_name, size_bytes, content_type)
  select v_id, a->>'path', a->>'name', (a->>'size')::bigint, nullif(a->>'type', '')
  from jsonb_array_elements(coalesce(p_attachments, '[]'::jsonb)) a;

  insert into public.manual_inquiry_status_history (inquiry_id, to_status) values (v_id, 'pending_review');
  return v_no;
exception when unique_violation then
  select inquiry_no into v_no from public.manual_inquiries where idempotency_key = v_key;
  if v_no is null then raise; end if;
  return v_no;
end;
$$;

/* ---------- 後台：送出正式報價（manager 以上） ---------- */

create or replace function public.issue_quote(
  p_inquiry_id uuid, p_items jsonb, p_shipping_fee integer, p_delivery_date date, p_notes text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_inquiry public.manual_inquiries%rowtype;
  v_items jsonb;
  v_subtotal integer;
  v_version integer;
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
  v_quote public.quotes%rowtype;
begin
  if not private.has_role(array['admin','manager']::public.app_role[]) then raise exception 'forbidden'; end if;
  select * into v_inquiry from public.manual_inquiries where id = p_inquiry_id for update;
  if not found then raise exception 'inquiry_not_found'; end if;
  if v_inquiry.status in ('converted', 'closed') then raise exception 'inquiry_closed'; end if;
  if p_delivery_date is null then raise exception 'invalid:delivery_date'; end if;
  if p_shipping_fee is null or p_shipping_fee < 0 then raise exception 'invalid:shipping_fee'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'invalid:items'; end if;

  -- 金額由資料庫依單價 × 數量重新計算，不採用瀏覽器傳來的小計。
  select jsonb_agg(jsonb_build_object(
      'label', left(btrim(i->>'label'), 200),
      'unitPrice', (i->>'unitPrice')::numeric,
      'quantity', (i->>'quantity')::numeric,
      'unit', left(coalesce(i->>'unit', ''), 20),
      'amount', round((i->>'unitPrice')::numeric * (i->>'quantity')::numeric)::integer
    ) order by ord),
    sum(round((i->>'unitPrice')::numeric * (i->>'quantity')::numeric))::integer
  into v_items, v_subtotal
  from jsonb_array_elements(p_items) with ordinality as t(i, ord);
  if exists (select 1 from jsonb_array_elements(v_items) e
    where coalesce(e->>'label', '') = '' or (e->>'unitPrice')::numeric < 0 or (e->>'quantity')::numeric <= 0) then
    raise exception 'invalid:items';
  end if;

  update public.quotes set status = 'superseded' where inquiry_id = p_inquiry_id and status = 'sent';
  select coalesce(max(version), 0) + 1 into v_version from public.quotes where inquiry_id = p_inquiry_id;

  insert into public.quotes (inquiry_id, quote_no, version, items, shipping_fee, subtotal, total, delivery_date, notes, valid_until, token_hash, created_by)
  values (p_inquiry_id, v_inquiry.inquiry_no || '-Q' || v_version, v_version, v_items, p_shipping_fee, v_subtotal,
    v_subtotal + p_shipping_fee, p_delivery_date, nullif(btrim(p_notes), ''), now() + interval '3 days',
    encode(extensions.digest(v_token, 'sha256'), 'hex'), auth.uid())
  returning * into v_quote;

  update public.manual_inquiries set status = 'quoted' where id = p_inquiry_id;
  insert into public.audit_logs (actor_user_id, entity_type, entity_id, action, new_data)
  values (auth.uid(), 'quote', v_quote.id, 'issue', jsonb_build_object('quote_no', v_quote.quote_no, 'total', v_quote.total));

  return jsonb_build_object('quote_id', v_quote.id, 'quote_no', v_quote.quote_no, 'version', v_version,
    'token', v_token, 'valid_until', v_quote.valid_until, 'total', v_quote.total);
end;
$$;

create or replace function public.revoke_quote(p_quote_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_role(array['admin','manager']::public.app_role[]) then raise exception 'forbidden'; end if;
  update public.quotes set status = 'revoked' where id = p_quote_id and status = 'sent';
  if not found then raise exception 'quote_not_active'; end if;
  insert into public.audit_logs (actor_user_id, entity_type, entity_id, action) values (auth.uid(), 'quote', p_quote_id, 'revoke');
end;
$$;

/* ---------- 客戶：以確認連結查看與確認報價 ---------- */

create or replace function public.get_quote_for_customer(p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_quote public.quotes%rowtype;
  v_inquiry public.manual_inquiries%rowtype;
  v_item public.manual_inquiry_items%rowtype;
  v_order_no text;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'not_found'; end if;
  select * into v_quote from public.quotes where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
  if not found then raise exception 'not_found'; end if;
  select * into v_inquiry from public.manual_inquiries where id = v_quote.inquiry_id;
  select * into v_item from public.manual_inquiry_items where inquiry_id = v_quote.inquiry_id order by created_at limit 1;
  select order_no into v_order_no from public.orders where quote_id = v_quote.id;
  return jsonb_build_object(
    'quote_no', v_quote.quote_no,
    'status', case when v_quote.status = 'sent' and now() > v_quote.valid_until then 'expired' else v_quote.status::text end,
    'contact_name', v_inquiry.contact_name, 'organization', v_inquiry.organization,
    'product_name', v_item.product_name, 'product_slug', v_item.product_slug, 'quantity', v_item.quantity, 'specifications', v_item.specifications,
    'items', v_quote.items, 'shipping_fee', v_quote.shipping_fee, 'shipping', v_inquiry.shipping,
    'subtotal', v_quote.subtotal, 'total', v_quote.total, 'delivery_date', v_quote.delivery_date, 'notes', v_quote.notes,
    'valid_until', v_quote.valid_until, 'accepted_at', v_quote.accepted_at, 'order_no', v_order_no
  );
end;
$$;

-- 一次完成：確認報價 → 建立正式訂單 → 建立工作單（待內部確認）。重複呼叫只回傳同一張訂單。
create or replace function public.accept_quote(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_quote public.quotes%rowtype;
  v_inquiry public.manual_inquiries%rowtype;
  v_order public.orders%rowtype;
  v_work_no text;
  v_snapshot jsonb;
  v_suffix text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_day text := to_char(now() at time zone 'Asia/Taipei', 'YYYYMMDD');
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'not_found'; end if;
  select * into v_quote from public.quotes where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') for update;
  if not found then raise exception 'not_found'; end if;

  if v_quote.status = 'accepted' then
    select * into v_order from public.orders where quote_id = v_quote.id;
    select work_order_no into v_work_no from public.work_orders where order_id = v_order.id;
    return jsonb_build_object('order_no', v_order.order_no, 'work_order_no', v_work_no, 'already_accepted', true);
  end if;
  if v_quote.status <> 'sent' then raise exception 'quote_not_active'; end if;
  if now() > v_quote.valid_until then raise exception 'quote_expired'; end if;

  select * into v_inquiry from public.manual_inquiries where id = v_quote.inquiry_id for update;
  v_snapshot := jsonb_build_object(
    'customer', jsonb_build_object('customer_type', v_inquiry.customer_type, 'contact_name', v_inquiry.contact_name,
      'organization', v_inquiry.organization, 'phone', v_inquiry.phone, 'email', v_inquiry.email, 'line_id', v_inquiry.line_id),
    'delivery', jsonb_build_object('method', v_inquiry.delivery_method, 'address', v_inquiry.delivery_address, 'shipping', v_inquiry.shipping),
    'inquiry_no', v_inquiry.inquiry_no, 'customer_notes', v_inquiry.customer_notes, 'expected_date', v_inquiry.expected_date,
    'items', (select coalesce(jsonb_agg(to_jsonb(it) - 'inquiry_id' order by it.created_at), '[]'::jsonb) from public.manual_inquiry_items it where it.inquiry_id = v_inquiry.id),
    'attachments', (select coalesce(jsonb_agg(jsonb_build_object('name', a.file_name, 'size', a.size_bytes, 'path', a.storage_path)), '[]'::jsonb) from public.manual_inquiry_attachments a where a.inquiry_id = v_inquiry.id),
    'quote', jsonb_build_object('quote_no', v_quote.quote_no, 'version', v_quote.version, 'items', v_quote.items,
      'shipping_fee', v_quote.shipping_fee, 'subtotal', v_quote.subtotal, 'total', v_quote.total,
      'delivery_date', v_quote.delivery_date, 'notes', v_quote.notes, 'accepted_at', now())
  );

  insert into public.orders (order_no, inquiry_id, quote_id, total, snapshot)
  values ('HL-' || v_day || '-' || v_suffix, v_inquiry.id, v_quote.id, v_quote.total, v_snapshot)
  returning * into v_order;
  insert into public.work_orders (work_order_no, order_id, snapshot, due_date)
  values ('WO-' || v_day || '-' || v_suffix, v_order.id, v_snapshot, v_quote.delivery_date)
  returning work_order_no into v_work_no;

  update public.quotes set status = 'accepted', accepted_at = now() where id = v_quote.id;
  update public.manual_inquiries set status = 'converted' where id = v_inquiry.id;
  insert into public.audit_logs (entity_type, entity_id, action, new_data)
  values ('quote', v_quote.id, 'customer_accept', jsonb_build_object('order_no', v_order.order_no));

  return jsonb_build_object('order_no', v_order.order_no, 'work_order_no', v_work_no, 'already_accepted', false);
end;
$$;

/* ---------- 後台：工作單確認與進度 ---------- */

create or replace function public.update_work_order(
  p_work_order_id uuid, p_status public.work_order_status, p_assignee text, p_production_notes text
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_current public.work_orders%rowtype;
begin
  if not private.has_role(array['admin','manager','staff']::public.app_role[]) then raise exception 'forbidden'; end if;
  select * into v_current from public.work_orders where id = p_work_order_id for update;
  if not found then raise exception 'not_found'; end if;
  if p_status = 'pending_confirmation' and v_current.status <> 'pending_confirmation' then raise exception 'invalid:status'; end if;
  -- 工作單由公司內部確認：從「待確認」改為其他狀態需 manager 以上。
  if v_current.status = 'pending_confirmation' and p_status <> 'pending_confirmation'
    and not private.has_role(array['admin','manager']::public.app_role[]) then raise exception 'forbidden'; end if;

  update public.work_orders set
    status = p_status,
    assignee = nullif(btrim(p_assignee), ''),
    production_notes = nullif(btrim(p_production_notes), ''),
    confirmed_by = case when v_current.status = 'pending_confirmation' and p_status <> 'pending_confirmation' then auth.uid() else confirmed_by end,
    confirmed_at = case when v_current.status = 'pending_confirmation' and p_status <> 'pending_confirmation' then now() else confirmed_at end
  where id = p_work_order_id;
end;
$$;

/* ---------- 權限 ---------- */

alter table public.manual_inquiry_attachments enable row level security;
alter table public.quotes enable row level security;
alter table public.orders enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_status_history enable row level security;

revoke all on table public.manual_inquiry_attachments, public.quotes, public.orders, public.work_orders, public.work_order_status_history from anon, authenticated;
grant select on public.manual_inquiry_attachments, public.quotes, public.orders, public.work_orders, public.work_order_status_history to authenticated;

create policy staff_read_attachments on public.manual_inquiry_attachments for select to authenticated using (private.has_role(array['admin','manager','staff']::public.app_role[]));
create policy staff_read_quotes on public.quotes for select to authenticated using (private.has_role(array['admin','manager','staff']::public.app_role[]));
create policy staff_read_orders on public.orders for select to authenticated using (private.has_role(array['admin','manager','staff']::public.app_role[]));
create policy staff_read_work_orders on public.work_orders for select to authenticated using (private.has_role(array['admin','manager','staff']::public.app_role[]));
create policy staff_read_work_order_history on public.work_order_status_history for select to authenticated using (private.has_role(array['admin','manager','staff']::public.app_role[]));

revoke all on function public.create_manual_inquiry_v2(jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_manual_inquiry_v2(jsonb, jsonb, jsonb) to service_role;
revoke all on function public.claim_public_submission(text, text, text, integer) from public, anon, authenticated;
grant execute on function public.claim_public_submission(text, text, text, integer) to service_role;

revoke all on function public.issue_quote(uuid, jsonb, integer, date, text) from public, anon;
grant execute on function public.issue_quote(uuid, jsonb, integer, date, text) to authenticated;
revoke all on function public.revoke_quote(uuid) from public, anon;
grant execute on function public.revoke_quote(uuid) to authenticated;
revoke all on function public.update_work_order(uuid, public.work_order_status, text, text) from public, anon;
grant execute on function public.update_work_order(uuid, public.work_order_status, text, text) to authenticated;

-- 確認連結：持有 64 字元隨機 token 才能讀取／確認該筆報價；資料庫只存 SHA-256。
revoke all on function public.get_quote_for_customer(text) from public;
grant execute on function public.get_quote_for_customer(text) to anon, authenticated;
revoke all on function public.accept_quote(text) from public;
grant execute on function public.accept_quote(text) to anon, authenticated;

revoke all on function private.log_work_order_status() from public;

commit;
