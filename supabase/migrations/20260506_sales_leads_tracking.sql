create table if not exists public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  sales_rep_id uuid not null,
  business_name text not null,
  owner_name text,
  phone text,
  email text,
  status text default 'new',
  signed_up boolean default false,
  signed_up_at timestamptz,
  created_at timestamptz default now()
);

alter table if exists public.sales_leads
  add column if not exists owner_name text,
  add column if not exists signed_up boolean default false,
  add column if not exists signed_up_at timestamptz,
  add column if not exists created_at timestamptz default now();

create index if not exists sales_leads_sales_rep_id_idx on public.sales_leads (sales_rep_id);
create index if not exists sales_leads_status_idx on public.sales_leads (status);
create index if not exists sales_leads_signed_up_idx on public.sales_leads (signed_up);

alter table public.sales_leads enable row level security;

drop policy if exists "Sales reps can view own sales leads" on public.sales_leads;
create policy "Sales reps can view own sales leads"
  on public.sales_leads for select
  to authenticated
  using (sales_rep_id = auth.uid());

drop policy if exists "Sales reps can insert own sales leads" on public.sales_leads;
create policy "Sales reps can insert own sales leads"
  on public.sales_leads for insert
  to authenticated
  with check (sales_rep_id = auth.uid());

drop policy if exists "Sales reps can update own sales leads" on public.sales_leads;
create policy "Sales reps can update own sales leads"
  on public.sales_leads for update
  to authenticated
  using (sales_rep_id = auth.uid())
  with check (sales_rep_id = auth.uid());

drop policy if exists "Sales reps can delete own sales leads" on public.sales_leads;
create policy "Sales reps can delete own sales leads"
  on public.sales_leads for delete
  to authenticated
  using (sales_rep_id = auth.uid());

drop policy if exists "Admins can manage all sales leads" on public.sales_leads;
create policy "Admins can manage all sales leads"
  on public.sales_leads for all
  to authenticated
  using (app_private.current_user_role() = 'admin')
  with check (app_private.current_user_role() = 'admin');

grant select, insert, update, delete on public.sales_leads to authenticated;
