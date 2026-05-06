import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type JobListing = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  compensation: string | null;
  description: string | null;
};

function summary(text?: string | null) {
  if (!text) return "Learn more about this role and how it supports Unified Steele customers.";
  return text.length > 180 ? `${text.slice(0, 180).trim()}...` : text;
}

export default async function CareersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_listings")
    .select("id, title, department, location, employment_type, compensation, description")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  const jobs = (data ?? []) as JobListing[];

  return (
    <main className="us-page">
      <div className="us-shell space-y-8">
        <section className="us-hero">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="us-kicker">Unified Steele Careers</p>
              <h1 className="mt-3 text-4xl font-extrabold text-[var(--color-text)]">
                Build useful tools for working businesses.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Explore open roles with Unified Steele and apply for positions that match your experience.
              </p>
            </div>
            <Link href="/login" className="us-btn-secondary">
              Back to Login
            </Link>
          </div>
        </section>

        {error ? (
          <div className="us-notice-danger text-sm">Open positions could not load: {error.message}</div>
        ) : null}

        {jobs.length === 0 && !error ? (
          <section className="us-card">
            <h2 className="text-2xl font-extrabold">No open positions right now.</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Check back soon for new opportunities.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <article key={job.id} className="us-card">
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                  {job.department ? <span>{job.department}</span> : null}
                  {job.location ? <span>{job.location}</span> : null}
                  {job.employment_type ? <span>{job.employment_type}</span> : null}
                </div>
                <h2 className="mt-3 text-2xl font-extrabold">{job.title}</h2>
                {job.compensation ? (
                  <p className="mt-2 text-sm font-bold text-[var(--color-primary)]">{job.compensation}</p>
                ) : null}
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{summary(job.description)}</p>
                <Link href={`/careers/${job.id}`} className="us-btn-primary mt-5 px-4 py-2 text-sm">
                  Apply
                </Link>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
