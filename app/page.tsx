import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BillingActions from "./billing-actions";
import LogoutButton from "@/components/logout-button";
import DashboardAIWidget from "@/components/dashboard-ai-widget";
import DashboardInsights from "@/components/dashboard-insights";
import { FREE_INVOICE_LIMIT } from "@/lib/free-invoice-limit";
import { getProfileAccess } from "@/lib/billing";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = Boolean(user);
  let isSubscribed = false;
  let subscriptionStatus = "inactive";
  let freeInvoicesUsed = 0;

  if (user) {
    const access = await getProfileAccess(supabase, user);
    isSubscribed = access.isSubscribed;
    subscriptionStatus = access.subscriptionStatus;
    freeInvoicesUsed = access.freeInvoicesUsed;
  }

  const freeInvoicesRemaining = Math.max(
    FREE_INVOICE_LIMIT - freeInvoicesUsed,
    0
  );

  const stats = [
    { label: "Total Leads", value: "0", note: "Track new opportunities as they come in." },
    { label: "Won Leads", value: "0", note: "Keep an eye on converted jobs and closed work." },
    { label: "Follow Ups", value: "0", note: "Stay on top of callbacks and pending conversations." },
    {
      label: isSubscribed ? "Invoices" : "Free Invoices Left",
      value: isSubscribed ? "Unlimited" : String(freeInvoicesRemaining),
      note: isSubscribed
        ? "Your plan includes full invoice access."
        : `${freeInvoicesRemaining} remaining before upgrade is needed.`,
    },
  ];

  const sections = [
    { title: "Invoices", description: isSubscribed ? "Create, save, and manage customer-ready invoices for every service type." : `Create up to ${FREE_INVOICE_LIMIT} free invoices before upgrading.`, href: "/invoices", cta: "Open Invoices", tone: "primary" },
    { title: "Leads Database", description: "Organize contacts, lead notes, follow-ups, service types, and estimated job value in one place.", href: "/leads", cta: "Open Leads", tone: "primary" },
    { title: "Sales Mapping", description: "Track neighborhoods, route opportunities, and area performance with a cleaner field-sales view.", href: "/mapping", cta: "Open Mapping", tone: "secondary" },
    { title: "Support", description: "Reach support quickly if you need help with your account, billing, or day-to-day use of the app.", href: "/support", cta: "Contact Support", tone: "secondary" },
  ] as const;

  return (
    <main className="us-page">
      <div className="us-shell space-y-10">
        <section className="us-hero">
          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
            <div>
              <p className="us-kicker">Unified Steele</p>
              <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-[var(--color-text)] md:text-6xl">Business Workspace</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">A cleaner operating view for invoices, leads, mapping, and business follow-up.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="inline-flex rounded-full border px-4 py-2 text-sm font-semibold">{isSubscribed ? "Active Plan" : "Starter Plan"}</span>
                <span className="inline-flex rounded-full border px-4 py-2 text-sm font-semibold">Status: {subscriptionStatus}</span>
                {!isSubscribed ? <span className="inline-flex rounded-full border px-4 py-2 text-sm font-semibold">{freeInvoicesRemaining} of {FREE_INVOICE_LIMIT} free invoices left</span> : null}
              </div>
            </div>
            <div className="rounded-[1.4rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Account Snapshot</p>
              <p className="mt-3 text-2xl font-bold text-[var(--color-text)]">{isSubscribed ? "$14.99/month" : "5 Free Invoices"}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {isLoggedIn ? (
                  <>
                    <BillingActions isSubscribed={isSubscribed} />
                    <Link href="/settings" className="us-btn-secondary min-w-36 text-sm">
                      Settings
                    </Link>
                    <LogoutButton />
                  </>
                ) : (
                  <>
                    <Link href="/login" className="us-btn-primary min-w-36 text-sm">
                      Login
                    </Link>
                    <Link href="/auth/signup" className="us-btn-secondary min-w-36 text-sm">
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-[1.3rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)]">
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">{item.value}</p>
            </div>
          ))}
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="flex min-h-56 flex-col rounded-[1.4rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
              <h3 className="text-xl font-bold text-[var(--color-text)]">{section.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[var(--color-text-secondary)]">{section.description}</p>
              <Link
                href={section.href}
                className={`${section.tone === "primary" ? "us-btn-primary" : "us-btn-secondary"} mt-6 w-full text-sm`}
              >
                {section.cta}
              </Link>
            </div>
          ))}
        </section>
        <DashboardInsights isSubscribed={isSubscribed} />
        <DashboardAIWidget context={{ isSubscribed, subscriptionStatus, freeInvoicesRemaining, stats, sections }} />
      </div>
    </main>
  );
}
