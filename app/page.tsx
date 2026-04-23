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
    {
      label: "Total Leads",
      value: "0",
      note: "Track new opportunities as they come in.",
    },
    {
      label: "Won Leads",
      value: "0",
      note: "Keep an eye on converted jobs and closed work.",
    },
    {
      label: "Follow Ups",
      value: "0",
      note: "Stay on top of callbacks and pending conversations.",
    },
    {
      label: isSubscribed ? "Invoices" : "Free Invoices Left",
      value: isSubscribed ? "Unlimited" : String(freeInvoicesRemaining),
      note: isSubscribed
        ? "Your plan includes full invoice access."
        : `${freeInvoicesRemaining} remaining before upgrade is needed.`,
    },
  ];

  const sections = [
    {
      title: "Invoices",
      description: isSubscribed
        ? "Create, save, and manage customer-ready invoices for every service type."
        : `Create up to ${FREE_INVOICE_LIMIT} free invoices before upgrading.`,
      href: "/invoices",
      cta: "Open Invoices",
      tone: "primary",
    },
    {
      title: "Leads Database",
      description:
        "Organize contacts, lead notes, follow-ups, service types, and estimated job value in one place.",
      href: "/leads",
      cta: "Open Leads",
      tone: "primary",
    },
    {
      title: "Sales Mapping",
      description:
        "Track neighborhoods, route opportunities, and area performance with a cleaner field-sales view.",
      href: "/mapping",
      cta: "Open Mapping",
      tone: "secondary",
    },
    {
      title: "Support",
      description:
        "Reach support quickly if you need help with your account, billing, or day-to-day use of the app.",
      href: "/support",
      cta: "Contact Support",
      tone: "secondary",
    },
  ] as const;

  return (
    <main className="us-page">
      <div className="us-shell space-y-10">
        <section className="us-hero">
          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
            <div>
              <p className="us-kicker">Unified Steele</p>
              <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-[var(--color-text)] md:text-6xl">
                Business Workspace
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
                A cleaner operating view for invoices, leads, mapping, and
                business follow-up. Everything stays organized in a brighter,
                more polished workspace built for service businesses.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <span
                  className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${
                    isSubscribed
                      ? "border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.11)] text-[var(--color-success)]"
                      : "border-[rgba(183,121,31,0.2)] bg-[rgba(183,121,31,0.11)] text-[var(--color-warning)]"
                  }`}
                >
                  {isSubscribed ? "Active Plan" : "Starter Plan"}
                </span>

                <span className="inline-flex rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-card-soft)]">
                  Status: {subscriptionStatus}
                </span>

                {!isSubscribed ? (
                  <span className="inline-flex rounded-full border border-[rgba(47,93,138,0.18)] bg-[rgba(47,93,138,0.08)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)]">
                    {freeInvoicesRemaining} of {FREE_INVOICE_LIMIT} free invoices
                    left
                  </span>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-[#cfdae4] bg-white p-7 shadow-[var(--shadow-card)]">
              <p className="us-panel-title">Account Snapshot</p>
              <p className="mt-4 text-4xl font-extrabold text-[var(--color-text)]">
                {isSubscribed ? "$14.99/month" : "5 Free Invoices"}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                {isSubscribed
                  ? "Unlimited invoices plus premium tools like leads, mapping, and billing controls."
                  : "Use the starter plan to create invoices, then upgrade when you need the full workspace."}
              </p>

              <div className="mt-6 rounded-[1.2rem] border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-4">
                <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  Best Next Step
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text)]">
                  {isSubscribed
                    ? "Jump into invoices, leads, or mapping and keep your pipeline moving."
                    : "Use your remaining free invoices, then upgrade when you need the full contractor toolkit."}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <BillingActions isSubscribed={isSubscribed} />
                <LogoutButton />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="us-stat-card">
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                {item.label}
              </p>
              <p className="mt-3 text-4xl font-extrabold text-[var(--color-text)]">
                {item.value}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
                {item.note}
              </p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="us-card p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="us-panel-title">Core Workspace</p>
                <h2 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
                  Jump into the tools you use most
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
                Clear work areas, stronger actions, and cleaner structure make
                this feel closer to a real business workspace than a generic admin panel.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
              {sections.map((section) => (
                <div
                  key={section.title}
                  className="rounded-[1.45rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]"
                >
                  <p className="us-panel-title">Workspace Tool</p>
                  <h3 className="mt-3 text-2xl font-bold text-[var(--color-text)]">
                    {section.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
                    {section.description}
                  </p>
                  <div className="mt-5">
                    <Link
                      href={section.href}
                      className={
                        section.tone === "primary"
                          ? "us-btn-primary"
                          : "us-btn-secondary"
                      }
                    >
                      {section.cta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="us-card p-8">
              <p className="us-panel-title">Plan Overview</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card-soft)]">
                  <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                    Current Plan
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">
                    {isSubscribed ? "Pro Access" : "Starter Access"}
                  </p>
                </div>

                <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card-soft)]">
                  <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                    Invoice Availability
                  </p>
                  <p className="mt-2 text-xl font-bold text-[var(--color-text)]">
                    {isSubscribed
                      ? "Unlimited invoice access"
                      : `${freeInvoicesRemaining} free invoices remaining`}
                  </p>
                </div>
              </div>
            </div>

            <div className="us-card p-8">
              <p className="us-panel-title">Focus Today</p>
              <div className="mt-5 space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                <div className="rounded-[1.1rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card-soft)]">
                  Build or send invoices quickly from a cleaner workflow.
                </div>
                <div className="rounded-[1.1rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card-soft)]">
                  Keep leads, callbacks, and mapping notes visible in one workspace.
                </div>
                <div className="rounded-[1.1rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card-soft)]">
                  Use the AI assistant below when you need faster writing or next-step support.
                </div>
              </div>
            </div>
          </div>
        </section>

        <DashboardInsights isSubscribed={isSubscribed} />

        <section>
          <DashboardAIWidget
            context={{
              isSubscribed,
              subscriptionStatus,
              freeInvoicesRemaining,
              stats,
              sections,
            }}
          />
        </section>
      </div>
    </main>
  );
}
