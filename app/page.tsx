import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BillingActions from "./billing-actions";
import LogoutButton from "@/components/logout-button";
import DashboardAIWidget from "@/components/dashboard-ai-widget";
import DashboardInsights from "@/components/dashboard-insights";
import { getProfileAccess } from "@/lib/billing";
import { createPageMetadata, siteDescriptionWithTagline, siteTitle } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: siteTitle,
  description: siteDescriptionWithTagline,
  path: "/",
});

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="us-page">
        <div className="us-shell">
          <section className="us-hero">
            <div className="mx-auto flex max-w-3xl flex-col items-center py-8 text-center">
              <p className="us-kicker">Unified Steele</p>
              <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-[var(--color-text)] md:text-6xl">
                Your Business. Unified.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
                Invoices, quotes, leads, and sales mapping built for service pros.
                Start with a 30-day trial. Cancel anytime.
              </p>
              <div className="mt-8 flex w-full max-w-sm flex-col items-center gap-4">
                <Link href="/auth/signup" className="us-btn-primary w-full">
                  Get Started Free
                </Link>
                <Link href="/login" className="us-link text-sm">
                  Log In
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "";
  const displayName = metadataName.trim() || user.email?.split("@")[0] || "Your";
  const access = await getProfileAccess(supabase, user);
  const isSubscribed = access.isSubscribed;
  const hasCoreAccess = access.hasCoreAccess;
  const hasAiAccess = access.hasAiAccess;
  const subscriptionStatus = access.subscriptionStatus;
  const trialDaysRemaining = access.trialDaysRemaining;
  const planLabel = access.isActive
    ? "Active Plan"
    : access.isTrialing
    ? "Trial Plan"
    : "Restricted";
  const billingMessage = access.isTrialing
    ? trialDaysRemaining === null
      ? "Trial active. End date syncing."
      : `You're on a 30-day free trial. ${trialDaysRemaining} days remaining.`
    : access.isActive
    ? "Your Pro subscription is active."
    : "Start your 30-day free trial.";

  const stats = [
    { label: "Total Leads", value: "0", note: "Track new opportunities as they come in." },
    { label: "Won Leads", value: "0", note: "Keep an eye on converted jobs and closed work." },
    { label: "Follow Ups", value: "0", note: "Stay on top of callbacks and pending conversations." },
    {
      label: "Core Access",
      value: hasCoreAccess ? "Unlocked" : "Locked",
      note: hasCoreAccess
        ? "Invoices, quotes, leads, and mapping are available."
        : "Start your trial or subscribe to unlock core tools.",
    },
  ];

  const sections = [
    { title: "Invoices", description: "Create, save, and manage customer-ready invoices for every service type.", href: "/invoices", cta: "Open Invoices", tone: "primary" },
    { title: "Quotes", description: "Create estimates and proposals, manage quote statuses, and convert approved quotes into invoices.", href: "/quotes", cta: "Open Quotes", tone: "primary" },
    { title: "Leads Database", description: "Organize contacts, lead notes, follow-ups, service types, and estimated job value in one place.", href: "/leads", cta: "Open Leads", tone: "primary" },
    { title: "AI Assistant", description: "Get paid-plan help with customer follow-ups, invoice wording, route planning, and daily business priorities.", href: "/ai", cta: "Open AI Assistant", tone: "secondary" },
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
              <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-[var(--color-text)] md:text-6xl">{displayName}&apos;s Business Dashboard</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">A cleaner operating view for invoices, leads, mapping, and business follow-up.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="inline-flex rounded-full border px-4 py-2 text-sm font-semibold">{planLabel}</span>
                <span className="inline-flex rounded-full border px-4 py-2 text-sm font-semibold">Status: {subscriptionStatus}</span>
                {access.isTrialing ? <span className="inline-flex rounded-full border px-4 py-2 text-sm font-semibold">AI Assistant unlocks after your paid subscription begins.</span> : null}
              </div>
            </div>
            <div className="rounded-[1.4rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Account Snapshot</p>
              <p className="mt-3 text-2xl font-bold text-[var(--color-text)]">{access.isTrialing ? "30-Day Trial" : isSubscribed ? "$14.99/month" : "No Active Access"}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{billingMessage}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <BillingActions isSubscribed={isSubscribed} isTrialing={access.isTrialing} />
                <Link href="/settings" className="us-btn-secondary min-w-36 text-sm">
                  Settings
                </Link>
                <LogoutButton />
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
        <DashboardInsights isSubscribed={hasAiAccess} />
        <DashboardAIWidget context={{ isSubscribed, hasCoreAccess, hasAiAccess, subscriptionStatus, trialDaysRemaining, stats, sections }} />
      </div>
    </main>
  );
}
