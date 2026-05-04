create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  phone_number text,
  email text,
  address text,
  company_name text,
  customer_type text not null default 'Residential'
    check (customer_type in ('Residential', 'Commercial')),
  service_needed text,
  lead_source text not null default 'Other'
    check (lead_source in ('Facebook', 'Google', 'Referral', 'Door to Door', 'Repeat Customer', 'Other')),
  sales_status text not null default 'New Lead'
    check (sales_status in ('New Lead', 'Contacted', 'Estimate Scheduled', 'Quote Sent', 'Won', 'Lost', 'Follow Up Later')),
  follow_up_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_user_id_idx
  on public.customers (user_id);

create index if not exists customers_sales_status_idx
  on public.customers (sales_status);

create index if not exists customers_customer_type_idx
  on public.customers (customer_type);

create index if not exists customers_follow_up_date_idx
  on public.customers (follow_up_date);

create index if not exists customers_created_at_idx
  on public.customers (created_at);

create or replace function public.set_customers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
  before update on public.customers
  for each row
  execute function public.set_customers_updated_at();

alter table public.customers enable row level security;

drop policy if exists "Users can view their own customers" on public.customers;
create policy "Users can view their own customers"
  on public.customers
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own customers" on public.customers;
create policy "Users can insert their own customers"
  on public.customers
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own customers" on public.customers;
create policy "Users can update their own customers"
  on public.customers
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own customers" on public.customers;
create policy "Users can delete their own customers"
  on public.customers
  for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.customers to authenticated;
