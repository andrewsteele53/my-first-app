import Link from "next/link";
import { redirect } from "next/navigation";
import AdminWebsiteBuilderClient from "@/components/admin-website-builder-client";
import LogoutButton from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/roles";

export default async function AdminWebsiteBuilderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requireAdmin(supabase, user);

  return (
    <main className="us-page">
      <div className="us-shell space-y-8">
        <section className="us-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="us-kicker">Admin Tools</p>
              <h1 className="mt-3 text-4xl font-extrabold text-[var(--color-text)]">AI Website Builder</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Create professional service-business websites using AI-generated content and reusable templates.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MiniBadge label="Admin only" value="Protected" />
                <MiniBadge label="Output" value="Draft preview" />
                <MiniBadge label="Future-ready" value="Save, publish, Stripe" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin" className="us-btn-secondary">Back to Admin</Link>
              <LogoutButton />
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[rgba(46,125,90,0.18)] bg-[rgba(46,125,90,0.08)] p-5">
          <p className="text-sm font-bold leading-6 text-[var(--color-success)]">
            This builder is restricted to admin users. It is not linked from subscriber navigation and does not publish,
            save, invoice, or charge customers yet.
          </p>
        </section>

        <AdminWebsiteBuilderClient />
      </div>
    </main>
  );
}

function MiniBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border-muted)] bg-white/75 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
