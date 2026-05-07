grant select, update on public.website_preview_requests to authenticated;

drop policy if exists "Admins can view website preview requests" on public.website_preview_requests;
create policy "Admins can view website preview requests"
  on public.website_preview_requests
  for select
  to authenticated
  using (app_private.current_user_role() = 'admin');

drop policy if exists "Admins can update website preview requests" on public.website_preview_requests;
create policy "Admins can update website preview requests"
  on public.website_preview_requests
  for update
  to authenticated
  using (app_private.current_user_role() = 'admin')
  with check (app_private.current_user_role() = 'admin');
