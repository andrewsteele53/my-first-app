create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  phone text,
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

alter table public.customers
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists customer_name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists company_name text,
  add column if not exists customer_type text not null default 'Residential',
  add column if not exists service_needed text,
  add column if not exists lead_source text not null default 'Other',
  add column if not exists sales_status text not null default 'New Lead',
  add column if not exists follow_up_date date,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  full_name text not null,
  name text,
  phone text,
  email text,
  address text,
  area text,
  service_type text not null default 'Other',
  service_needed text,
  source text,
  lead_source text,
  status text not null default 'New'
    check (status in ('New', 'Contacted', 'Estimate Sent', 'Won', 'Lost')),
  estimated_value numeric not null default 0,
  probability numeric not null default 10,
  follow_up_date timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists full_name text,
  add column if not exists name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists area text,
  add column if not exists service_type text not null default 'Other',
  add column if not exists service_needed text,
  add column if not exists source text,
  add column if not exists lead_source text,
  add column if not exists status text not null default 'New',
  add column if not exists estimated_value numeric not null default 0,
  add column if not exists probability numeric not null default 10,
  add column if not exists follow_up_date timestamptz,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.sales_mapping_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  name text not null,
  homes integer not null default 0,
  close_rate numeric not null default 0,
  estimated_sales integer not null default 0,
  avg_job_price numeric not null default 0,
  estimated_revenue numeric not null default 0,
  doors_knocked integer not null default 0,
  actual_sales integer not null default 0,
  status text not null default 'Not Started'
    check (status in ('Not Started', 'In Progress', 'Completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sales_mapping_areas
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists lead_id uuid references public.leads(id) on delete set null,
  add column if not exists name text,
  add column if not exists homes integer not null default 0,
  add column if not exists close_rate numeric not null default 0,
  add column if not exists estimated_sales integer not null default 0,
  add column if not exists avg_job_price numeric not null default 0,
  add column if not exists estimated_revenue numeric not null default 0,
  add column if not exists doors_knocked integer not null default 0,
  add column if not exists actual_sales integer not null default 0,
  add column if not exists status text not null default 'Not Started',
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'leads_customer_id_fkey'
  ) then
    alter table public.leads
      add constraint leads_customer_id_fkey
      foreign key (customer_id) references public.customers(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'sales_mapping_areas_lead_id_fkey'
  ) then
    alter table public.sales_mapping_areas
      add constraint sales_mapping_areas_lead_id_fkey
      foreign key (lead_id) references public.leads(id) on delete set null;
  end if;
end;
$$;

create index if not exists customers_user_id_idx on public.customers (user_id);
create index if not exists customers_sales_status_idx on public.customers (sales_status);
create index if not exists customers_customer_type_idx on public.customers (customer_type);
create index if not exists customers_follow_up_date_idx on public.customers (follow_up_date);

create index if not exists leads_user_id_idx on public.leads (user_id);
create index if not exists leads_customer_id_idx on public.leads (customer_id);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_follow_up_date_idx on public.leads (follow_up_date);
create index if not exists leads_area_idx on public.leads (area);

create index if not exists sales_mapping_areas_user_id_idx on public.sales_mapping_areas (user_id);
create index if not exists sales_mapping_areas_lead_id_idx on public.sales_mapping_areas (lead_id);
create index if not exists sales_mapping_areas_status_idx on public.sales_mapping_areas (status);

create or replace function public.set_updated_at()
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
  execute function public.set_updated_at();

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
  before update on public.leads
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_sales_mapping_areas_updated_at on public.sales_mapping_areas;
create trigger set_sales_mapping_areas_updated_at
  before update on public.sales_mapping_areas
  for each row
  execute function public.set_updated_at();

alter table public.customers enable row level security;
alter table public.leads enable row level security;
alter table public.sales_mapping_areas enable row level security;

drop policy if exists "Users can view their own customers" on public.customers;
create policy "Users can view their own customers"
  on public.customers for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own customers" on public.customers;
create policy "Users can insert their own customers"
  on public.customers for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own customers" on public.customers;
create policy "Users can update their own customers"
  on public.customers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own customers" on public.customers;
create policy "Users can delete their own customers"
  on public.customers for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own leads" on public.leads;
create policy "Users can view their own leads"
  on public.leads for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own leads" on public.leads;
create policy "Users can insert their own leads"
  on public.leads for insert
  with check (
    auth.uid() = user_id
    and (
      customer_id is null
      or exists (
        select 1 from public.customers
        where customers.id = leads.customer_id
          and customers.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can update their own leads" on public.leads;
create policy "Users can update their own leads"
  on public.leads for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      customer_id is null
      or exists (
        select 1 from public.customers
        where customers.id = leads.customer_id
          and customers.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can delete their own leads" on public.leads;
create policy "Users can delete their own leads"
  on public.leads for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view their own sales mapping areas" on public.sales_mapping_areas;
create policy "Users can view their own sales mapping areas"
  on public.sales_mapping_areas for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own sales mapping areas" on public.sales_mapping_areas;
create policy "Users can insert their own sales mapping areas"
  on public.sales_mapping_areas for insert
  with check (
    auth.uid() = user_id
    and (
      lead_id is null
      or exists (
        select 1 from public.leads
        where leads.id = sales_mapping_areas.lead_id
          and leads.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can update their own sales mapping areas" on public.sales_mapping_areas;
create policy "Users can update their own sales mapping areas"
  on public.sales_mapping_areas for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      lead_id is null
      or exists (
        select 1 from public.leads
        where leads.id = sales_mapping_areas.lead_id
          and leads.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can delete their own sales mapping areas" on public.sales_mapping_areas;
create policy "Users can delete their own sales mapping areas"
  on public.sales_mapping_areas for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.sales_mapping_areas to authenticated;
