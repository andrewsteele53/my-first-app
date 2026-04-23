alter table if exists public.profiles
  add column if not exists free_invoices_used integer not null default 0,
  add column if not exists is_subscribed boolean not null default false,
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create or replace function public.consume_free_invoice(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_used integer;
  current_is_subscribed boolean;
  invoice_limit constant integer := 5;
begin
  insert into public.profiles (id, free_invoices_used, is_subscribed, subscription_status)
  values (p_user_id, 0, false, 'inactive')
  on conflict (id) do nothing;

  select free_invoices_used, is_subscribed
  into current_used, current_is_subscribed
  from public.profiles
  where id = p_user_id
  for update;

  if coalesce(current_is_subscribed, false) then
    return jsonb_build_object(
      'ok', true,
      'used', coalesce(current_used, 0),
      'remaining', null,
      'limit', invoice_limit
    );
  end if;

  if coalesce(current_used, 0) >= invoice_limit then
    return jsonb_build_object(
      'ok', false,
      'reason', 'limit_reached',
      'used', coalesce(current_used, 0),
      'remaining', 0,
      'limit', invoice_limit
    );
  end if;

  update public.profiles
  set free_invoices_used = coalesce(current_used, 0) + 1
  where id = p_user_id;

  current_used := coalesce(current_used, 0) + 1;

  return jsonb_build_object(
    'ok', true,
    'used', current_used,
    'remaining', greatest(invoice_limit - current_used, 0),
    'limit', invoice_limit
  );
end;
$$;

grant execute on function public.consume_free_invoice(uuid) to authenticated;
