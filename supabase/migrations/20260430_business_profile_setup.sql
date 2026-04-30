alter table if exists public.profiles
  add column if not exists business_name text,
  add column if not exists owner_name text,
  add column if not exists industry text,
  add column if not exists services_offered text,
  add column if not exists default_quote_type text,
  add column if not exists default_invoice_type text,
  add column if not exists business_phone text,
  add column if not exists business_email text,
  add column if not exists business_logo_url text,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists updated_at timestamptz;

create index if not exists profiles_onboarding_completed_idx
  on public.profiles (onboarding_completed);

create index if not exists profiles_industry_idx
  on public.profiles (industry);
