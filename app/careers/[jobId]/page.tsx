import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JobApplicationForm from "./application-form";

type JobListing = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  compensation: string | null;
  description: string | null;
  requirements: string | null;
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_listings")
    .select("id, title, department, location, employment_type, compensation, description, requirements")
    .eq("id", jobId)
    .eq("status", "published")
    .maybeSingle();
  const job = data as JobListing | null;

  if (!job) notFound();

  return (
    <main className="us-page">
      <div className="us-shell space-y-8">
        <section className="us-hero">
          <Link href="/careers" className="us-link text-sm">
            Back to open positions
          </Link>
          <p className="us-kicker mt-6">Unified Steele Careers</p>
          <h1 className="mt-3 text-4xl font-extrabold">{job.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold text-[var(--color-text-secondary)]">
            {job.department ? <span>{job.department}</span> : null}
            {job.location ? <span>{job.location}</span> : null}
            {job.employment_type ? <span>{job.employment_type}</span> : null}
            {job.compensation ? <span>{job.compensation}</span> : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="us-card space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold">About the role</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)]">
                {job.description || "Details for this role will be shared during the interview process."}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">Requirements</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)]">
                {job.requirements || "Bring relevant experience, clear communication, and a strong customer-first mindset."}
              </p>
            </div>
          </article>
          <JobApplicationForm jobId={job.id} />
        </section>
      </div>
    </main>
  );
}
