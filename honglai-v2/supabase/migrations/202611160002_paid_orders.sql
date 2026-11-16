-- 鴻萊 V2：模擬 LINE Pay 付款後自動成立訂單與工作單，後台確認訂單並填交期。
-- 規劃：docs/superpowers/specs/2026-11-16-paid-order-auto-work-order-design.md
-- 只新增欄位與函式；訂單的 quote_id 改為可空（付款成立的訂單沒有正式報價）。

begin;

/* ---------- 付款欄位 ---------- */

alter table public.manual_inquiries
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'failed', 'cancelled')),
  add column if not exists payment_token_hash text unique
    check (payment_token_hash is null or payment_token_hash ~ '^[0-9a-f]{64}$'),
  add column if not exists paid_at timestamptz;

alter table public.orders alter column quote_id drop not null;
alter table public.orders
  add column if not exists payment_method text check (payment_method is null or payment_method in ('linepay-demo')),
  add column if not exists paid_at timestamptz,
  add column if not exists customer_email_sent_at timestamptz;

alter table public.work_orders
  add column if not exists confirmation_email_sent_at timestamptz;

/* ---------- 公開送出頻率限制：加入模擬付款 ---------- */

alter table public.public_submission_limits drop constraint public_submission_limits_form_type_check;
alter table public.public_submission_limits add constraint public_submission_limits_form_type_check
  check (form_type in ('business_inquiry', 'sample_request', 'manual_inquiry', 'manual_inquiry_upload', 'mock_payment'));

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
    or p_form_type not in ('business_inquiry', 'sample_request', 'manual_inquiry', 'manual_inquiry_upload', 'mock_payment')
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

/* ---------- 模擬付款：持有付款憑證才能改付款狀態；付款成功即成立訂單與工作單 ---------- */

create or replace function public.record_mock_payment(p_inquiry_no text, p_token text, p_result text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_inquiry public.manual_inquiries%rowtype;
  v_order public.orders%rowtype;
  v_work_no text;
  v_work_id uuid;
  v_snapshot jsonb;
  v_suffix text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_day text := to_char(now() at time zone 'Asia/Taipei', 'YYYYMMDD');
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'not_found'; end if;
  if p_result not in ('paid', 'failed', 'cancelled') then raise exception 'invalid:result'; end if;
  select * into v_inquiry from public.manual_inquiries
  where inquiry_no = p_inquiry_no and payment_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') for update;
  if not found then raise exception 'not_found'; end if;

  if v_inquiry.payment_status = 'paid' then
    select * into v_order from public.orders where inquiry_id = v_inquiry.id order by created_at limit 1;
    select id, work_order_no into v_work_id, v_work_no from public.work_orders where order_id = v_order.id;
    return jsonb_build_object('status', 'paid', 'already', true, 'order_id', v_order.id, 'order_no', v_order.order_no,
      'work_order_id', v_work_id, 'work_order_no', v_work_no, 'total', v_order.total);
  end if;
  if v_inquiry.status = 'closed' then raise exception 'inquiry_closed'; end if;

  if p_result <> 'paid' then
    update public.manual_inquiries set payment_status = p_result where id = v_inquiry.id;
    return jsonb_build_object('status', p_result, 'already', false);
  end if;

  if v_inquiry.estimate_total is null or v_inquiry.estimate->>'status' <> 'priced' then raise exception 'not_payable'; end if;

  v_snapshot := jsonb_build_object(
    'customer', jsonb_build_object('customer_type', v_inquiry.customer_type, 'contact_name', v_inquiry.contact_name,
      'organization', v_inquiry.organization, 'phone', v_inquiry.phone, 'email', v_inquiry.email, 'line_id', v_inquiry.line_id),
    'delivery', jsonb_build_object('method', v_inquiry.delivery_method, 'address', v_inquiry.delivery_address, 'shipping', v_inquiry.shipping),
    'inquiry_no', v_inquiry.inquiry_no, 'customer_notes', v_inquiry.customer_notes, 'expected_date', v_inquiry.expected_date,
    'items', (select coalesce(jsonb_agg(to_jsonb(it) - 'inquiry_id' order by it.created_at), '[]'::jsonb) from public.manual_inquiry_items it where it.inquiry_id = v_inquiry.id),
    'attachments', (select coalesce(jsonb_agg(jsonb_build_object('name', a.file_name, 'size', a.size_bytes, 'path', a.storage_path)), '[]'::jsonb) from public.manual_inquiry_attachments a where a.inquiry_id = v_inquiry.id),
    -- 付款成立的訂單沒有正式報價，金額沿用送出時後端重新計算的系統試算。
    'quote', jsonb_build_object('quote_no', '', 'version', 0, 'items', coalesce(v_inquiry.estimate->'lines', '[]'::jsonb),
      'shipping_fee', coalesce((v_inquiry.shipping->>'fee')::integer, 0), 'subtotal', (v_inquiry.estimate->>'subtotal')::integer,
      'total', v_inquiry.estimate_total, 'delivery_date', null, 'notes', null, 'accepted_at', now()),
    'payment', jsonb_build_object('method', 'LINE Pay（示範）', 'status', 'paid', 'paid_at', now())
  );

  insert into public.orders (order_no, inquiry_id, quote_id, total, snapshot, payment_method, paid_at)
  values ('HL-' || v_day || '-' || v_suffix, v_inquiry.id, null, v_inquiry.estimate_total, v_snapshot, 'linepay-demo', now())
  returning * into v_order;
  insert into public.work_orders (work_order_no, order_id, snapshot)
  values ('WO-' || v_day || '-' || v_suffix, v_order.id, v_snapshot)
  returning id, work_order_no into v_work_id, v_work_no;

  update public.manual_inquiries set payment_status = 'paid', paid_at = now(), status = 'converted' where id = v_inquiry.id;
  insert into public.audit_logs (entity_type, entity_id, action, new_data)
  values ('manual_inquiry', v_inquiry.id, 'mock_payment_paid', jsonb_build_object('order_no', v_order.order_no));

  return jsonb_build_object('status', 'paid', 'already', false, 'order_id', v_order.id, 'order_no', v_order.order_no,
    'work_order_id', v_work_id, 'work_order_no', v_work_no, 'total', v_order.total);
end;
$$;

/* ---------- 後台：確認訂單並填交期（manager 以上） ---------- */

create or replace function public.confirm_work_order(p_work_order_id uuid, p_due_date date)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_current public.work_orders%rowtype;
begin
  if not private.has_role(array['admin','manager']::public.app_role[]) then raise exception 'forbidden'; end if;
  if p_due_date is null then raise exception 'invalid:due_date'; end if;
  select * into v_current from public.work_orders where id = p_work_order_id for update;
  if not found then raise exception 'not_found'; end if;
  if v_current.status <> 'pending_confirmation' then raise exception 'already_confirmed'; end if;
  update public.work_orders set status = 'scheduled', due_date = p_due_date, confirmed_by = auth.uid(), confirmed_at = now()
  where id = p_work_order_id;
end;
$$;

revoke all on function public.record_mock_payment(text, text, text) from public, anon, authenticated;
grant execute on function public.record_mock_payment(text, text, text) to service_role;
revoke all on function public.confirm_work_order(uuid, date) from public, anon;
grant execute on function public.confirm_work_order(uuid, date) to authenticated;
revoke all on function public.claim_public_submission(text, text, text, integer) from public, anon, authenticated;
grant execute on function public.claim_public_submission(text, text, text, integer) to service_role;

commit;
