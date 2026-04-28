alter table public.profiles
  add column if not exists trial_ends_at timestamptz;

update public.profiles
set trial_ends_at = trial_end
where trial_ends_at is null
  and trial_end is not null;
