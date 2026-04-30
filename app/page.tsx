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
        <div className="us-shell space-y-8">
          <section className="us-hero">
            <div className="grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="min-w-0">
                <p className="us-kicker">Unified Steele</p>
                <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-[var(--color-text)] sm:text-5xl md:text-6xl">
                  Stop losing money running your service business.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] md:text-lg">
                  Create invoices, send quotes, track leads, map sales
                  opportunities, and stay organized in one simple dashboard &mdash;
                  with AI and QuickBooks built in.
                </p>
                <ul className="mt-5 grid gap-3 text-sm font-semibold text-[var(--color-text)] sm:max-w-2xl">
                  {[
                    "Built for contractors, cleaners, landscapers, and service pros",
                    "Create quotes and invoices faster",
                    "Keep leads, jobs, and business tools in one place",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-success)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex w-full flex-col gap-3 sm:max-w-lg sm:flex-row">
                  <Link href="/auth/signup" className="us-btn-primary w-full sm:flex-1">
                    Start Free Trial
                  </Link>
                  <Link href="#how-it-works" className="us-btn-secondary w-full sm:flex-1">
                    See How It Works
                  </Link>
                </div>
                <p className="mt-4 text-sm font-semibold text-[var(--color-text-secondary)]">
                  30-day trial. Cancel anytime. Built for real service businesses.
                </p>
                <Link href="/login" className="us-link mt-5 inline-flex text-sm">
                  Log In
                </Link>
              </div>

              <div className="w-full min-w-0 rounded-[1.6rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card-soft)] sm:p-5">
                <div className="rounded-[1.2rem] border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                        Dashboard
                      </p>
                      <p className="mt-1 text-lg font-bold text-[var(--color-text)]">
                        Today&apos;s Work
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgba(46,125,90,0.18)] bg-[rgba(46,125,90,0.1)] px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
                      Organized
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Invoices", value: "$4,280" },
                      { label: "Quotes", value: "12 open" },
                      { label: "QuickBooks Sync", value: "Ready" },
                      { label: "AI Assistant", value: "Pro" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[1rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card-soft)]"
                      >
                        <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                          {item.label}
                        </p>
                        <p className="mt-2 text-xl font-bold text-[var(--color-text)]">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[1rem] border border-[var(--color-border)] bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-[var(--color-text)]">
                        Follow-up due
                      </p>
                      <p className="whitespace-nowrap text-sm font-bold text-[var(--color-primary)]">
                        2 jobs
                      </p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-[var(--color-section)]">
                      <div className="h-2 w-2/3 rounded-full bg-[var(--color-primary)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-5 max-w-3xl">
              <p className="us-kicker">The problem</p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
                Still running your business the hard way?
              </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.4rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
                <p className="us-kicker">The hard way</p>
                <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
                  What slows you down
                </h2>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {[
                    "Losing track of leads",
                    "Sending invoices late",
                    "Forgetting follow-ups",
                    "Jumping between too many apps",
                    "Not knowing where your best jobs are coming from",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-danger)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.4rem] border border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.07)] p-6 shadow-[var(--shadow-card-soft)]">
                <p className="us-kicker">Unified Steele</p>
                <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
                  What Unified Steele helps fix
                </h2>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-[var(--color-text)]">
                  {[
                    "Quotes and invoices in one place",
                    "Lead tracking built into your dashboard",
                    "Sales mapping for better targeting",
                    "AI assistance for business tasks",
                    "QuickBooks integration for cleaner bookkeeping",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-success)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section id="integrations" className="scroll-mt-8">
            <div className="mb-5 max-w-3xl">
              <p className="us-kicker">Integrations</p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
                Built to work with the tools your business already uses
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  icon: "QB",
                  title: "QuickBooks Integration",
                  text: "Sync invoices, customers, and payment status with QuickBooks to reduce double entry and keep records organized.",
                },
                {
                  icon: "AI",
                  title: "OpenAI-Powered Assistant",
                  text: "Use AI to draft invoice notes, organize business tasks, improve customer communication, and generate helpful business insights.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-[1.4rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] text-sm font-extrabold text-[var(--color-primary)]">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-[var(--color-text)]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="how-it-works" className="scroll-mt-8">
            <div className="mb-5">
              <p className="us-kicker">Platform</p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
                More than invoices. One operating system for service work.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Invoices and quotes",
                  text: "Build professional quotes and invoices fast, then keep every customer-ready document organized.",
                },
                {
                  title: "QuickBooks sync",
                  text: "Connect accounting workflows so invoices, customer records, and payment status stay easier to manage.",
                },
                {
                  title: "AI business assistant",
                  text: "Use AI-powered help for notes, follow-ups, customer communication, and practical business insights.",
                },
                {
                  title: "Customer and job organization",
                  text: "Track leads, customers, job details, and follow-ups so important opportunities do not get lost.",
                },
                {
                  title: "Service-business workflow tools",
                  text: "Run daily work from one dashboard built for contractors, cleaners, landscapers, mechanics, and service pros.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.4rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]"
                >
                  <h3 className="text-xl font-bold text-[var(--color-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <div className="mb-5 max-w-3xl">
              <p className="us-kicker">Built for service pros</p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
                Built for small service businesses
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Contractors",
                  text: "Keep job details, quotes, invoices, and follow-ups organized from first contact to payment.",
                },
                {
                  title: "Gutter cleaning businesses",
                  text: "Build fast quotes, track seasonal leads, and follow up before jobs slip away.",
                },
                {
                  title: "Lawn care companies",
                  text: "Manage recurring work, customer requests, and invoices without bouncing between apps.",
                },
                {
                  title: "Cleaning businesses",
                  text: "Create polished customer records and send professional quotes and invoices faster.",
                },
                {
                  title: "Handyman services",
                  text: "Turn scattered job notes into organized leads, quotes, invoices, and tasks.",
                },
                {
                  title: "Auto detailing businesses",
                  text: "Track customers, packages, follow-ups, and payments in one simple dashboard.",
                },
                {
                  title: "Pressure washing companies",
                  text: "Map neighborhoods, quote jobs quickly, and keep every follow-up in view.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.4rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]"
                >
                  <h3 className="text-lg font-bold text-[var(--color-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-7 shadow-[var(--shadow-card-soft)]">
            <div className="max-w-3xl">
              <p className="us-kicker">Professional operations</p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
                Simple, professional, and built to help you stay organized.
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">
                Unified Steele gives small business owners the tools they need
                to manage work, follow up faster, and look more professional
                without using five different apps.
              </p>
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-[rgba(47,93,138,0.2)] bg-[var(--color-primary)] p-7 text-white shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                  Start today
                </p>
                <h2 className="mt-3 text-3xl font-extrabold">
                  Ready to run your business smarter?
                </h2>
              </div>
              <Link
                href="/auth/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-bold text-[var(--color-primary)] shadow-[var(--shadow-button)] transition hover:scale-[1.01]"
              >
                Start Free Trial
              </Link>
            </div>
          </section>

          <p className="border-t border-[var(--color-border-muted)] pt-5 text-xs leading-5 text-[var(--color-text-secondary)]">
            QuickBooks and OpenAI are trademarks of their respective owners.
            Unified Steele is not endorsed by or affiliated with Intuit or OpenAI.
          </p>
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
