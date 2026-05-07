alter table public.website_preview_requests
  add column if not exists business_profile_url text;
