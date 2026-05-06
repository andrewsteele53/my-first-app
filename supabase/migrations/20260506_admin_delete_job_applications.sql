drop policy if exists "Admins can manage job applications" on public.job_applications;

drop policy if exists "Admins can view job applications" on public.job_applications;
create policy "Admins can view job applications"
  on public.job_applications for select
  to authenticated
  using (app_private.current_user_role() = 'admin');

drop policy if exists "Admins can update job applications" on public.job_applications;
create policy "Admins can update job applications"
  on public.job_applications for update
  to authenticated
  using (app_private.current_user_role() = 'admin')
  with check (app_private.current_user_role() = 'admin');

drop policy if exists "Admins can delete job applications" on public.job_applications;
create policy "Admins can delete job applications"
  on public.job_applications for delete
  to authenticated
  using (app_private.current_user_role() = 'admin');

drop policy if exists "Admins can delete resumes" on storage.objects;
create policy "Admins can delete resumes"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'resumes' and app_private.current_user_role() = 'admin');

grant select, update, delete on public.job_applications to authenticated;
