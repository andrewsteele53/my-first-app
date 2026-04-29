create table if not exists public.quickbooks_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  realm_id text not null,
  access_token text not null,
  refresh_token text not null,
  access_token_expires_at timestamptz not null,
  refresh_token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quickbooks_sync_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id text not null,
  quickbooks_invoice_id text,
  quickbooks_customer_id text,
  sync_status text not null,
  last_error text,
  synced_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, invoice_id)
);

alter table public.quickbooks_connections enable row level security;
alter table public.quickbooks_sync_history enable row level security;

alter table if exists public.invoices
  add column if not exists quickbooks_invoice_id text,
  add column if not exists quickbooks_customer_id text,
  add column if not exists quickbooks_sync_status text,
  add column if not exists quickbooks_synced_at timestamptz,
  add column if not exists payment_status text;

create index if not exists quickbooks_sync_history_user_id_idx
  on public.quickbooks_sync_history (user_id);

create index if not exists quickbooks_sync_history_invoice_id_idx
  on public.quickbooks_sync_history (invoice_id);
