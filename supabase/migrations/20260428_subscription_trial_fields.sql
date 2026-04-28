drop function if exists public.consume_free_invoice(uuid);

alter table public.profiles
  add column if not exists is_subscribed boolean not null default false,
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists trial_start timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists current_period_end timestamptz,
  drop column if exists free_invoices_used;
