create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

alter table if exists public.profiles
  add column if not exists role text not null default 'subscriber',
  add column if not exists display_name text,
  add column if not exists email text,
  add column if not exists subscription_status text default 'inactive',
  add column if not exists created_at timestamptz default now();

insert into public.profiles (id, email, role, display_name, subscription_status, created_at)
select
  users.id,
  users.email,
  'subscriber',
  coalesce(users.raw_user_meta_data->>'display_name', nullif(users.email, ''), 'New user'),
  'inactive',
  coalesce(users.created_at, now())
from auth.users as users
on conflict (id) do update
set
  email = coalesce(public.profiles.email, excluded.email),
  display_name = coalesce(public.profiles.display_name, excluded.display_name),
  subscription_status = coalesce(public.profiles.subscription_status, excluded.subscription_status),
  created_at = coalesce(public.profiles.created_at, excluded.created_at);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, display_name, subscription_status, created_at)
  values (
    new.id,
    new.email,
    'subscriber',
    coalesce(new.raw_user_meta_data->>'display_name', nullif(new.email, ''), 'New user'),
    'inactive',
    now()
  )
  on conflict (id) do update
  set
    email = coalesce(public.profiles.email, excluded.email),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    subscription_status = coalesce(public.profiles.subscription_status, excluded.subscription_status),
    created_at = coalesce(public.profiles.created_at, excluded.created_at);

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
  active boolean not null default true,
  created_at timestamptz default now(),
  unique (user_id)
);

alter table if exists public.sales_reps
  add column if not exists active boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sales_reps_user_id_key'
  ) then
    alter table public.sales_reps
      add constraint sales_reps_user_id_key unique (user_id);
  end if;
end $$;

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

create table if not exists public.team_applications (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  phone text,
  desired_role text default 'sales',
  status text default 'pending',
  notes text,
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

alter table if exists public.team_applications
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists desired_role text default 'sales',
  add column if not exists status text default 'pending',
  add column if not exists notes text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id);

alter table if exists public.team_applications
  alter column email set not null,
  alter column desired_role set default 'sales',
  alter column status set default 'pending',
  alter column created_at set default now();

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

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'team_applications_status_check'
  ) then
    alter table public.team_applications
      add constraint team_applications_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

create index if not exists sales_reps_user_id_idx on public.sales_reps (user_id);
create index if not exists sales_assignments_sales_rep_id_idx on public.sales_assignments (sales_rep_id);
create index if not exists sales_assignments_subscriber_user_id_idx on public.sales_assignments (subscriber_user_id);
create index if not exists commission_payouts_sales_rep_id_idx on public.commission_payouts (sales_rep_id);
create index if not exists commission_payouts_status_idx on public.commission_payouts (status);
create index if not exists team_applications_email_idx on public.team_applications (email);
create index if not exists team_applications_status_idx on public.team_applications (status);

alter table public.profiles enable row level security;
alter table public.sales_reps enable row level security;
alter table public.sales_assignments enable row level security;
alter table public.commission_payouts enable row level security;
alter table public.team_applications enable row level security;

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

drop policy if exists "Admins can manage team applications" on public.team_applications;
create policy "Admins can manage team applications"
  on public.team_applications for all
  to authenticated
  using (app_private.current_user_role() = 'admin')
  with check (app_private.current_user_role() = 'admin');

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.sales_reps to authenticated;
grant select, insert, update, delete on public.sales_assignments to authenticated;
grant select, insert, update, delete on public.commission_payouts to authenticated;
grant select, insert, update, delete on public.team_applications to authenticated;
