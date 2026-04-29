alter table if exists public.quotes
  add column if not exists status text not null default 'Draft',
  add column if not exists converted_invoice_id text;

alter table if exists public.invoices
  add column if not exists status text not null default 'Unpaid',
  add column if not exists paid_at timestamptz,
  add column if not exists quickbooks_sync_status text not null default 'Not Synced',
  add column if not exists quickbooks_invoice_id text,
  add column if not exists synced_at timestamptz;

create index if not exists quotes_status_idx
  on public.quotes (status);

create index if not exists quotes_converted_invoice_id_idx
  on public.quotes (converted_invoice_id);

create index if not exists invoices_status_idx
  on public.invoices (status);

create index if not exists invoices_quickbooks_sync_status_idx
  on public.invoices (quickbooks_sync_status);
