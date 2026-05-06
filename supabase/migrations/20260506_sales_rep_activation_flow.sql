with ranked_sales_reps as (
  select
    id,
    first_value(id) over (
      partition by user_id
      order by created_at asc nulls last, id asc
    ) as keeper_id,
    row_number() over (
      partition by user_id
      order by created_at asc nulls last, id asc
    ) as duplicate_rank
  from public.sales_reps
  where user_id is not null
),
duplicate_sales_reps as (
  select id, keeper_id
  from ranked_sales_reps
  where duplicate_rank > 1
)
update public.sales_assignments as assignments
set sales_rep_id = duplicates.keeper_id
from duplicate_sales_reps as duplicates
where assignments.sales_rep_id = duplicates.id;

with ranked_sales_reps as (
  select
    id,
    first_value(id) over (
      partition by user_id
      order by created_at asc nulls last, id asc
    ) as keeper_id,
    row_number() over (
      partition by user_id
      order by created_at asc nulls last, id asc
    ) as duplicate_rank
  from public.sales_reps
  where user_id is not null
),
duplicate_sales_reps as (
  select id, keeper_id
  from ranked_sales_reps
  where duplicate_rank > 1
)
update public.commission_payouts as payouts
set sales_rep_id = duplicates.keeper_id
from duplicate_sales_reps as duplicates
where payouts.sales_rep_id = duplicates.id;

with ranked_sales_reps as (
  select
    id,
    row_number() over (
      partition by user_id
      order by created_at asc nulls last, id asc
    ) as duplicate_rank
  from public.sales_reps
  where user_id is not null
)
delete from public.sales_reps as reps
using ranked_sales_reps as ranked
where reps.id = ranked.id
  and ranked.duplicate_rank > 1;

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
  drop constraint if exists team_applications_status_check;

update public.team_applications
set status = lower(trim(status))
where status is not null;

alter table if exists public.team_applications
  add constraint team_applications_status_check
  check (status in ('pending', 'approved', 'invite_sent', 'invited', 'active', 'rejected'));

alter table if exists public.job_applications
  drop constraint if exists job_applications_status_check;

update public.job_applications
set status = lower(trim(status))
where status is not null;

alter table if exists public.job_applications
  add constraint job_applications_status_check
  check (status in ('new', 'reviewing', 'interview', 'approved', 'active', 'rejected'));

update public.profiles as profiles
set
  role = 'sales',
  display_name = coalesce(nullif(profiles.display_name, ''), nullif(team_applications.name, ''), profiles.email)
from public.team_applications as team_applications
where lower(profiles.email) = lower(team_applications.email)
  and lower(team_applications.status) in ('approved', 'invite_sent', 'invited', 'active');

insert into public.sales_reps (user_id, display_name, payment_notes, active)
select
  profiles.id,
  coalesce(nullif(profiles.display_name, ''), profiles.email, 'Sales Rep'),
  nullif(team_applications.notes, ''),
  true
from public.team_applications as team_applications
join public.profiles as profiles
  on lower(profiles.email) = lower(team_applications.email)
where lower(team_applications.status) in ('approved', 'invite_sent', 'invited', 'active')
on conflict (user_id) do update
set
  display_name = coalesce(nullif(public.sales_reps.display_name, ''), excluded.display_name),
  payment_notes = coalesce(public.sales_reps.payment_notes, excluded.payment_notes),
  active = true;

update public.team_applications as team_applications
set status = 'active'
from public.profiles as profiles
where lower(profiles.email) = lower(team_applications.email)
  and lower(team_applications.status) in ('approved', 'invite_sent', 'invited')
  and profiles.role = 'sales';
