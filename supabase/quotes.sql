create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quote_number text not null,
  quote_type text not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  service_address text,
  line_items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  notes text,
  status text not null default 'Draft'
    check (status in ('Draft', 'Sent', 'Approved', 'Rejected', 'Converted')),
  converted_invoice_id uuid,
  moved_to_trash_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_user_id_idx on public.quotes(user_id);
create index if not exists quotes_status_idx on public.quotes(status);
create index if not exists quotes_moved_to_trash_at_idx on public.quotes(moved_to_trash_at);

alter table public.quotes enable row level security;

drop policy if exists "Users can view their own quotes" on public.quotes;
create policy "Users can view their own quotes"
  on public.quotes
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own quotes" on public.quotes;
create policy "Users can insert their own quotes"
  on public.quotes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own quotes" on public.quotes;
create policy "Users can update their own quotes"
  on public.quotes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own quotes" on public.quotes;
create policy "Users can delete their own quotes"
  on public.quotes
  for delete
  using (auth.uid() = user_id);
