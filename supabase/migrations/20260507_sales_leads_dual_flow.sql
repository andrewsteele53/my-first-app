alter table public.sales_leads
  alter column sales_rep_id drop not null,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists industry text,
  add column if not exists service_type text,
  add column if not exists lead_type text not null default 'saas',
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists assigned_to uuid references auth.users(id),
  add column if not exists notes text,
  add column if not exists website_url text,
  add column if not exists has_existing_website boolean,
  add column if not exists website_lead_notes text,
  add column if not exists updated_at timestamptz default now();

update public.sales_leads
set
  lead_type = coalesce(lead_type, 'saas'),
  created_by = coalesce(created_by, sales_rep_id),
  assigned_to = coalesce(assigned_to, sales_rep_id),
  updated_at = coalesce(updated_at, created_at, now())
where created_by is null
   or assigned_to is null
   or updated_at is null;

alter table public.sales_leads
  add constraint sales_leads_lead_type_check
  check (lead_type in ('saas', 'website_creation')) not valid;

alter table public.sales_leads
  add constraint sales_leads_status_check
  check (
    status in (
      'new',
      'contacted',
      'follow_up',
      'demo_scheduled',
      'signed_up',
      'not_interested',
      'website_lead_submitted',
      'admin_reviewing',
      'admin_contacted',
      'website_sold'
    )
  ) not valid;

create index if not exists sales_leads_created_by_idx on public.sales_leads (created_by);
create index if not exists sales_leads_assigned_to_idx on public.sales_leads (assigned_to);
create index if not exists sales_leads_lead_type_idx on public.sales_leads (lead_type);

create or replace function public.touch_sales_leads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_sales_leads_updated_at on public.sales_leads;
create trigger touch_sales_leads_updated_at
before update on public.sales_leads
for each row
execute function public.touch_sales_leads_updated_at();

create or replace function public.guard_sales_leads_sales_updates()
returns trigger
language plpgsql
as $$
begin
  if app_private.current_user_role() = 'sales' then
    if old.lead_type = 'website_creation' or new.lead_type = 'website_creation' then
      raise exception 'Website creation leads are admin managed.';
    end if;

    if new.status = 'website_sold' then
      raise exception 'Sales reps cannot mark website leads sold.';
    end if;

    if new.assigned_to is distinct from old.assigned_to
      or new.created_by is distinct from old.created_by
      or new.sales_rep_id is distinct from old.sales_rep_id
      or new.lead_type is distinct from old.lead_type then
      raise exception 'Sales reps cannot change admin-only lead fields.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_sales_leads_sales_updates on public.sales_leads;
create trigger guard_sales_leads_sales_updates
before update on public.sales_leads
for each row
execute function public.guard_sales_leads_sales_updates();

drop policy if exists "Sales reps can view own sales leads" on public.sales_leads;
drop policy if exists "Sales reps can insert own sales leads" on public.sales_leads;
drop policy if exists "Sales reps can update own sales leads" on public.sales_leads;
drop policy if exists "Sales reps can delete own sales leads" on public.sales_leads;
drop policy if exists "Admins can manage all sales leads" on public.sales_leads;
drop policy if exists "Sales reps can view created or assigned sales leads" on public.sales_leads;
drop policy if exists "Sales reps can insert created sales leads" on public.sales_leads;
drop policy if exists "Sales reps can update assigned saas sales leads" on public.sales_leads;
drop policy if exists "Sales reps can delete own unclosed sales leads" on public.sales_leads;

create policy "Admins can manage all sales leads"
  on public.sales_leads for all
  to authenticated
  using (app_private.current_user_role() = 'admin')
  with check (app_private.current_user_role() = 'admin');

create policy "Sales reps can view created or assigned sales leads"
  on public.sales_leads for select
  to authenticated
  using (
    app_private.current_user_role() = 'sales'
    and (
      created_by = auth.uid()
      or assigned_to = auth.uid()
      or sales_rep_id = auth.uid()
    )
  );

create policy "Sales reps can insert created sales leads"
  on public.sales_leads for insert
  to authenticated
  with check (
    app_private.current_user_role() = 'sales'
    and created_by = auth.uid()
    and sales_rep_id = auth.uid()
    and status <> 'website_sold'
  );

create policy "Sales reps can update assigned saas sales leads"
  on public.sales_leads for update
  to authenticated
  using (
    app_private.current_user_role() = 'sales'
    and lead_type = 'saas'
    and (
      created_by = auth.uid()
      or assigned_to = auth.uid()
      or sales_rep_id = auth.uid()
    )
  )
  with check (
    app_private.current_user_role() = 'sales'
    and lead_type = 'saas'
    and (
      created_by = auth.uid()
      or assigned_to = auth.uid()
      or sales_rep_id = auth.uid()
    )
    and status in ('new', 'contacted', 'follow_up', 'demo_scheduled', 'signed_up', 'not_interested')
  );

create policy "Sales reps can delete own unclosed sales leads"
  on public.sales_leads for delete
  to authenticated
  using (
    app_private.current_user_role() = 'sales'
    and created_by = auth.uid()
    and lead_type = 'saas'
    and status <> 'signed_up'
  );

grant select, insert, update, delete on public.sales_leads to authenticated;
