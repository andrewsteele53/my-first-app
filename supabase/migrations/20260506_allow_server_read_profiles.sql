alter table public.profiles enable row level security;

drop policy if exists "Allow server read profiles" on public.profiles;
create policy "Allow server read profiles"
  on public.profiles
  for select
  using (true);
