create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  service_type text,
  job_address text,
  booking_date date not null,
  start_time time,
  end_time time,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists bookings_user_id_idx
  on public.bookings (user_id);

create index if not exists bookings_booking_date_idx
  on public.bookings (booking_date);

create index if not exists bookings_status_idx
  on public.bookings (status);

create or replace function public.set_bookings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
  before update on public.bookings
  for each row
  execute function public.set_bookings_updated_at();

alter table public.bookings enable row level security;

drop policy if exists "Users can view own bookings" on public.bookings;
create policy "Users can view own bookings"
  on public.bookings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own bookings" on public.bookings;
create policy "Users can insert own bookings"
  on public.bookings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own bookings" on public.bookings;
create policy "Users can update own bookings"
  on public.bookings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own bookings" on public.bookings;
create policy "Users can delete own bookings"
  on public.bookings
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.bookings to authenticated;
