alter table if exists public.profiles
  add column if not exists role text not null default 'subscriber';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('admin', 'sales', 'subscriber'));
  end if;
end $$;

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_subscription_status_idx on public.profiles (subscription_status);

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create or replace function app_private.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'subscriber'
  );
$$;

revoke all on function app_private.current_user_role() from public;
grant execute on function app_private.current_user_role() to authenticated;

create table if not exists public.sales_reps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  payment_notes text,
  created_at timestamptz default now(),
  unique (user_id)
);

create table if not exists public.sales_assignments (
  id uuid primary key default gen_random_uuid(),
  sales_rep_id uuid references public.sales_reps(id) on delete cascade,
  subscriber_user_id uuid references auth.users(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  unique (subscriber_user_id)
);

create table if not exists public.commission_payouts (
  id uuid primary key default gen_random_uuid(),
  sales_rep_id uuid references public.sales_reps(id) on delete cascade,
  amount numeric not null,
  status text default 'unpaid',
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'commission_payouts_status_check'
  ) then
    alter table public.commission_payouts
      add constraint commission_payouts_status_check
      check (status in ('unpaid', 'paid'));
  end if;
end $$;

create index if not exists sales_reps_user_id_idx on public.sales_reps (user_id);
create index if not exists sales_assignments_sales_rep_id_idx on public.sales_assignments (sales_rep_id);
create index if not exists sales_assignments_subscriber_user_id_idx on public.sales_assignments (subscriber_user_id);
create index if not exists commission_payouts_sales_rep_id_idx on public.commission_payouts (sales_rep_id);
create index if not exists commission_payouts_status_idx on public.commission_payouts (status);

alter table public.profiles enable row level security;
alter table public.sales_reps enable row level security;
alter table public.sales_assignments enable row level security;
alter table public.commission_payouts enable row level security;

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id and role = 'subscriber');

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and role = app_private.current_user_role());

drop policy if exists "Admins can manage all profiles" on public.profiles;
create policy "Admins can manage all profiles"
  on public.profiles for all
  to authenticated
  using (app_private.current_user_role() = 'admin')
  with check (app_private.current_user_role() = 'admin');

drop policy if exists "Sales reps can view assigned subscriber profiles" on public.profiles;
create policy "Sales reps can view assigned subscriber profiles"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.sales_reps sr
      join public.sales_assignments sa on sa.sales_rep_id = sr.id
      where sr.user_id = auth.uid()
        and sa.subscriber_user_id = profiles.id
    )
  );

drop policy if exists "Admins can manage sales reps" on public.sales_reps;
create policy "Admins can manage sales reps"
  on public.sales_reps for all
  to authenticated
  using (app_private.current_user_role() = 'admin')
  with check (app_private.current_user_role() = 'admin');

drop policy if exists "Sales reps can view own sales rep record" on public.sales_reps;
create policy "Sales reps can view own sales rep record"
  on public.sales_reps for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins can manage sales assignments" on public.sales_assignments;
create policy "Admins can manage sales assignments"
  on public.sales_assignments for all
  to authenticated
  using (app_private.current_user_role() = 'admin')
  with check (app_private.current_user_role() = 'admin');

drop policy if exists "Sales reps can view own assignments" on public.sales_assignments;
create policy "Sales reps can view own assignments"
  on public.sales_assignments for select
  to authenticated
  using (
    exists (
      select 1
      from public.sales_reps sr
      where sr.id = sales_assignments.sales_rep_id
        and sr.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can manage commission payouts" on public.commission_payouts;
create policy "Admins can manage commission payouts"
  on public.commission_payouts for all
  to authenticated
  using (app_private.current_user_role() = 'admin')
  with check (app_private.current_user_role() = 'admin');

drop policy if exists "Sales reps can view own payouts" on public.commission_payouts;
create policy "Sales reps can view own payouts"
  on public.commission_payouts for select
  to authenticated
  using (
    exists (
      select 1
      from public.sales_reps sr
      where sr.id = commission_payouts.sales_rep_id
        and sr.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.sales_reps to authenticated;
grant select, insert, update, delete on public.sales_assignments to authenticated;
grant select, insert, update, delete on public.commission_payouts to authenticated;
