create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

alter table if exists public.profiles
  add column if not exists role text not null default 'subscriber',
  add column if not exists display_name text,
  add column if not exists email text,
  add column if not exists subscription_status text default 'inactive',
  add column if not exists created_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_id_auth_users_fkey'
  ) and not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_id_auth_users_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end $$;

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

alter table if exists public.team_applications
  add column if not exists status text default 'pending',
  add column if not exists reviewed_at timestamptz;

alter table if exists public.team_applications
  drop constraint if exists team_applications_status_check;

update public.team_applications
set status = 'approved'
where status = 'converted';

alter table if exists public.team_applications
  add constraint team_applications_status_check
  check (status in ('pending', 'approved', 'invite_sent', 'active', 'rejected'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matching_application_id uuid;
  matching_application_name text;
  matching_application_notes text;
  resolved_display_name text;
begin
  insert into public.profiles (id, email, role, display_name, subscription_status, created_at)
  values (
    new.id,
    new.email,
    'subscriber',
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', nullif(new.email, ''), 'New user'),
    'inactive',
    coalesce(new.created_at, now())
  )
  on conflict (id) do update
  set
    email = coalesce(public.profiles.email, excluded.email),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    subscription_status = coalesce(public.profiles.subscription_status, excluded.subscription_status),
    created_at = coalesce(public.profiles.created_at, excluded.created_at);

  begin
    select id, name, notes
    into matching_application_id, matching_application_name, matching_application_notes
    from public.team_applications
    where lower(email) = lower(new.email)
      and status in ('approved', 'invite_sent')
    order by reviewed_at desc nulls last, created_at desc
    limit 1;

    if matching_application_id is not null then
      resolved_display_name := coalesce(
        nullif(matching_application_name, ''),
        nullif(new.raw_user_meta_data->>'display_name', ''),
        nullif(new.raw_user_meta_data->>'full_name', ''),
        nullif(new.email, ''),
        'Sales Rep'
      );

      update public.profiles
      set
        role = 'sales',
        display_name = coalesce(nullif(public.profiles.display_name, ''), resolved_display_name),
        email = coalesce(public.profiles.email, new.email)
      where id = new.id;

      insert into public.sales_reps (user_id, display_name, payment_notes, active)
      values (
        new.id,
        resolved_display_name,
        nullif(matching_application_notes, ''),
        true
      )
      on conflict (user_id) do update
      set
        display_name = coalesce(nullif(public.sales_reps.display_name, ''), excluded.display_name),
        payment_notes = coalesce(public.sales_reps.payment_notes, excluded.payment_notes),
        active = true;

      update public.team_applications
      set status = 'active'
      where id = matching_application_id;
    end if;
  exception
    when others then
      raise warning 'Team signup conversion skipped for auth user %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

drop trigger if exists auto_create_sales_rep on auth.users;
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
