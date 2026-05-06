create table if not exists public.sales_leads (
  id uuid primary key default gen_random_uuid(),
  sales_rep_id uuid references public.sales_reps(id) on delete cascade,
  sales_rep_user_id uuid references public.profiles(id),
  business_name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  industry text,
  status text default 'new',
  notes text,
  follow_up_date date,
  subscribed_profile_id uuid references public.profiles(id),
  subscribed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint sales_leads_status_check check (
    status in ('new', 'contacted', 'follow_up', 'interested', 'not_interested', 'subscribed', 'lost')
  )
);

alter table if exists public.sales_leads
  add column if not exists sales_rep_user_id uuid references public.profiles(id),
  add column if not exists subscribed_profile_id uuid references public.profiles(id),
  add column if not exists subscribed_at timestamptz,
  add column if not exists updated_at timestamptz default now();

create index if not exists sales_leads_sales_rep_id_idx on public.sales_leads (sales_rep_id);
create index if not exists sales_leads_sales_rep_user_id_idx on public.sales_leads (sales_rep_user_id);
create index if not exists sales_leads_status_idx on public.sales_leads (status);
create index if not exists sales_leads_follow_up_date_idx on public.sales_leads (follow_up_date);
create index if not exists sales_leads_subscribed_profile_id_idx on public.sales_leads (subscribed_profile_id);

create or replace function public.set_sales_leads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_sales_leads_updated_at on public.sales_leads;
create trigger set_sales_leads_updated_at
before update on public.sales_leads
for each row
execute function public.set_sales_leads_updated_at();

alter table public.sales_leads enable row level security;

drop policy if exists "Sales reps can view own sales leads" on public.sales_leads;
create policy "Sales reps can view own sales leads"
  on public.sales_leads for select
  to authenticated
  using (sales_rep_user_id = auth.uid());

drop policy if exists "Sales reps can insert own sales leads" on public.sales_leads;
create policy "Sales reps can insert own sales leads"
  on public.sales_leads for insert
  to authenticated
  with check (sales_rep_user_id = auth.uid());

drop policy if exists "Sales reps can update own sales leads" on public.sales_leads;
create policy "Sales reps can update own sales leads"
  on public.sales_leads for update
  to authenticated
  using (sales_rep_user_id = auth.uid())
  with check (sales_rep_user_id = auth.uid());

drop policy if exists "Sales reps can delete own sales leads" on public.sales_leads;
create policy "Sales reps can delete own sales leads"
  on public.sales_leads for delete
  to authenticated
  using (sales_rep_user_id = auth.uid());

drop policy if exists "Admins can manage all sales leads" on public.sales_leads;
create policy "Admins can manage all sales leads"
  on public.sales_leads for all
  to authenticated
  using (app_private.current_user_role() = 'admin')
  with check (app_private.current_user_role() = 'admin');

grant select, insert, update, delete on public.sales_leads to authenticated;
