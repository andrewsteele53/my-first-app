create table if not exists public.website_preview_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  business_name text not null,
  email text not null,
  phone text not null,
  industry text,
  current_website_url text,
  business_profile_url text,
  services_offered text,
  preferred_colors_style text,
  websites_they_like text,
  package_interested text not null,
  message text,
  status text not null default 'new',
  admin_notes text
);

create index if not exists website_preview_requests_created_at_idx
  on public.website_preview_requests (created_at desc);

create index if not exists website_preview_requests_status_idx
  on public.website_preview_requests (status);

alter table public.website_preview_requests enable row level security;

revoke all on public.website_preview_requests from anon;
revoke all on public.website_preview_requests from authenticated;

grant insert on public.website_preview_requests to anon;
grant insert on public.website_preview_requests to authenticated;

drop policy if exists "Anyone can request a website preview" on public.website_preview_requests;
create policy "Anyone can request a website preview"
  on public.website_preview_requests
  for insert
  to anon, authenticated
  with check (true);
