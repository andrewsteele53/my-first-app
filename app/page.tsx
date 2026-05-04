import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BillingActions from "./billing-actions";
import LogoutButton from "@/components/logout-button";
import DashboardAIWidget from "@/components/dashboard-ai-widget";
import { getProfileAccess } from "@/lib/billing";
import {
  getBusinessProfile,
  getProfileDefaultInvoiceSlug,
  getProfileDefaultQuoteSlug,
  getProfileIndustryLabel,
  getProfileInvoiceLabel,
  getProfileQuoteLabel,
} from "@/lib/business-profile";
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
                  Stop losing money from missed invoices and disorganized jobs.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] md:text-lg">
                  Send invoices faster, never lose a lead, and keep your entire
                  business organized &mdash; all in one simple system.
                </p>
                <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-[var(--color-primary)] md:text-base">
                  Built by a service business owner who got tired of losing money
                  from disorganized work.
                </p>
                <div className="mt-7 flex w-full flex-col gap-3 sm:max-w-xs">
                  <Link href="/auth/signup" className="us-btn-primary w-full">
                    Start Free Trial
                  </Link>
                </div>
                <p className="mt-4 text-sm font-semibold text-[var(--color-text-secondary)]">
                  30-day free trial. No risk. Start organizing your business today.
                </p>
                <Link href="/login" className="us-link mt-5 inline-flex text-sm">
                  Log In
                </Link>
              </div>

              <div className="w-full min-w-0 rounded-[1.6rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card-soft)] sm:p-5">
                <p className="mb-3 text-sm font-bold text-[var(--color-primary)]">
                  See exactly what needs your attention &mdash; at a glance
                </p>
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

          <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="us-kicker">Why switch</p>
                <h2 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
                  Why people switch to Unified Steele
                </h2>
              </div>
              <ul className="grid gap-3 text-sm font-semibold text-[var(--color-text)] sm:grid-cols-2">
                {[
                  "Stop forgetting invoices and follow-ups",
                  "Know exactly what jobs need attention today",
                  "Run your entire business without juggling multiple apps",
                  "Built specifically for service businesses",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-success)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <div className="mb-5 max-w-3xl">
              <p className="us-kicker">The problem</p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
                Where you&apos;re losing money right now
              </h2>
              <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
                This is where most small service businesses fall behind.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.4rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
                <p className="us-kicker">The hard way</p>
                <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
                  What slows you down
                </h2>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {[
                    "Lost leads",
                    "Late invoices",
                    "Missed follow-ups",
                    "Too many apps",
                    "No clear system for jobs and customers",
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
                    "Follow-ups stay organized",
                    "Sales mapping for better targeting",
                    "QuickBooks and AI built in",
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

          <section>
            <div className="mb-5 max-w-3xl">
              <p className="us-kicker">The outcome</p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
                What this means for your business
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Get paid faster",
                  text: "Send invoices immediately and stop waiting to get paid.",
                },
                {
                  title: "Stop losing leads",
                  text: "Never forget a customer or job again.",
                },
                {
                  title: "Save hours every week",
                  text: "Stop switching between apps and wasting time.",
                },
                {
                  title: "Look more professional",
                  text: "Give customers clean quotes, invoices, and communication.",
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

          <section id="how-it-works" className="scroll-mt-8">
            <div className="mb-5">
              <p className="us-kicker">Platform</p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
                Everything you need to run the day
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Invoices and quotes",
                  text: "Create professional quotes and invoices fast, then keep every customer-ready document organized.",
                },
                {
                  title: "QuickBooks sync",
                  text: "Reduce double entry and keep invoice, customer, and payment details easier to manage.",
                },
                {
                  title: "AI business assistant",
                  text: "Use AI to help with notes, follow-ups, customer messages, and practical business tasks.",
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
                  Stop losing money and take control of your business.
                </h2>
                <p className="mt-3 text-sm font-semibold text-white/80">
                  30-day free trial. Cancel anytime. No risk.
                </p>
              </div>
              <a
                href="/auth/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "170px",
                  minHeight: "48px",
                  borderRadius: "14px",
                  backgroundColor: "#ffffff",
                  color: "#24588a",
                  fontSize: "14px",
                  fontWeight: 800,
                  lineHeight: "20px",
                  textDecoration: "none",
                  position: "relative",
                  zIndex: 20,
                }}
              >
                Start Free Trial
              </a>
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
  const businessProfile = await getBusinessProfile(supabase, user);

  if (!businessProfile?.onboarding_completed) {
    redirect("/onboarding");
  }

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
  const businessName = businessProfile.business_name || `${displayName}'s Business`;
  const industryLabel = getProfileIndustryLabel(businessProfile);
  const quoteLabel = getProfileQuoteLabel(businessProfile);
  const invoiceLabel = getProfileInvoiceLabel(businessProfile);
  const defaultQuoteHref = `/quotes/${getProfileDefaultQuoteSlug(businessProfile)}`;
  const defaultInvoiceHref = `/invoices/${getProfileDefaultInvoiceSlug(businessProfile)}`;
  const [
    { count: newLeadsCount },
    { count: followUpsDueCount },
    { count: openQuotesCount },
    { count: customerCount },
    { count: leadsCreatedCount },
    { count: wonLeadsCount },
    { count: lostLeadsCount },
    { count: scheduledFollowUpsCount },
  ] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "New"),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("follow_up_date", "is", null)
        .lte("follow_up_date", new Date().toISOString()),
      supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["Draft", "Sent"]),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "Won"),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "Lost"),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("follow_up_date", "is", null),
    ]);

  const sections = [
    { title: "Leads", description: "Organize contacts, lead notes, follow-ups, service types, and estimated job value in one place.", href: "/leads", cta: "Add / View Leads", tone: "primary" },
    { title: "Customers", description: "Store customer records, follow-up dates, sales status, notes, and quick outreach actions in one CRM view.", href: "/customers", cta: "Add / View Customers", tone: "primary" },
    { title: "Quotes", description: "Create estimates and proposals, manage quote statuses, and convert approved quotes into invoices.", href: defaultQuoteHref, cta: `Create ${quoteLabel} Quote`, tone: "primary" },
    { title: "Invoices", description: "Create, save, and manage customer-ready invoices for every service type.", href: defaultInvoiceHref, cta: `Create ${invoiceLabel} Invoice`, tone: "primary" },
    { title: "Sales Mapping", description: "Track neighborhoods, route opportunities, and area performance with a cleaner field-sales view.", href: "/mapping", cta: "View Sales Mapping", tone: "secondary" },
    { title: "AI Assistant", description: "Get paid-plan help with customer follow-ups, invoice wording, route planning, and daily business priorities.", href: "/ai", cta: "Open AI Assistant", tone: "secondary" },
    { title: "Support", description: "Reach support quickly if you need help with your account, billing, or day-to-day use of the app.", href: "/support", cta: "Contact Support", tone: "secondary" },
    { title: "Onboarding", description: "Review your business setup and dashboard defaults when your services or workflow change.", href: "/onboarding", cta: "Review Onboarding", tone: "secondary" },
  ] as const;
  const primarySections = sections.filter((section) => section.tone === "primary");
  const secondarySections = sections.filter((section) => section.tone === "secondary");
  const hasNoSalesRecords = (newLeadsCount ?? 0) === 0 && (customerCount ?? 0) === 0;
  const hasNoFocusActivity =
    (newLeadsCount ?? 0) === 0 &&
    (followUpsDueCount ?? 0) === 0 &&
    (openQuotesCount ?? 0) === 0;
  const hasNoPipelineActivity =
    (leadsCreatedCount ?? 0) === 0 &&
    (wonLeadsCount ?? 0) === 0 &&
    (lostLeadsCount ?? 0) === 0 &&
    (scheduledFollowUpsCount ?? 0) === 0 &&
    (openQuotesCount ?? 0) === 0;
  const nextStepGuidance =
    (leadsCreatedCount ?? 0) === 0
      ? "Start by adding your first lead"
      : (openQuotesCount ?? 0) === 0
        ? "Create a quote for your lead"
        : "Follow up and close the deal";
  const focusCards = [
    {
      label: "New Leads",
      value: newLeadsCount ?? 0,
      href: "/leads",
      colorClass: "border-[rgba(47,93,138,0.22)] bg-[rgba(47,93,138,0.08)] text-[var(--color-primary)]",
    },
    {
      label: "Follow Ups Due",
      value: followUpsDueCount ?? 0,
      href: "/leads?filter=followups",
      colorClass: "border-[rgba(183,121,31,0.25)] bg-[rgba(183,121,31,0.1)] text-[var(--color-warning)]",
    },
    {
      label: "Open Quotes",
      value: openQuotesCount ?? 0,
      href: "/quotes",
      colorClass: "border-[rgba(47,93,138,0.22)] bg-[rgba(47,93,138,0.08)] text-[var(--color-primary)]",
    },
  ];
  const pipelineCards = [
    {
      label: "Leads Created",
      value: leadsCreatedCount ?? 0,
      colorClass: "border-[rgba(47,93,138,0.22)] bg-[rgba(47,93,138,0.08)] text-[var(--color-primary)]",
    },
    {
      label: "Won Leads",
      value: wonLeadsCount ?? 0,
      colorClass: "border-[rgba(46,125,90,0.22)] bg-[rgba(46,125,90,0.1)] text-[var(--color-success)]",
    },
    {
      label: "Lost Leads",
      value: lostLeadsCount ?? 0,
      colorClass: "border-[rgba(199,80,80,0.22)] bg-[rgba(199,80,80,0.1)] text-[var(--color-danger)]",
    },
    {
      label: "Follow-Ups",
      value: scheduledFollowUpsCount ?? 0,
      colorClass: "border-[rgba(183,121,31,0.25)] bg-[rgba(183,121,31,0.1)] text-[var(--color-warning)]",
    },
  ];

  return (
    <main className="us-page">
      <div className="us-shell space-y-10">
        <section className="us-hero">
          <div>
            <p className="us-kicker">Unified Steele</p>
            <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-[var(--color-text)] md:text-6xl">Welcome back, {businessName}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
              A cleaner operating view for your {industryLabel.toLowerCase()} business:
              invoices, quotes, leads, mapping, and business follow-up.
            </p>
            {hasNoSalesRecords ? (
              <p className="mt-5 rounded-[1rem] border border-[rgba(47,93,138,0.18)] bg-white/70 px-4 py-3 text-sm font-bold text-[var(--color-primary-active)]">
                Start by adding your first lead to begin tracking your sales.
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-3">
              <span className="inline-flex rounded-full border px-4 py-2 text-sm font-semibold">{planLabel}</span>
              <span className="inline-flex rounded-full border px-4 py-2 text-sm font-semibold">Industry: {industryLabel}</span>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/leads" className="us-btn-primary min-h-[4.5rem] px-10 text-xl shadow-[0_20px_38px_rgba(47,93,138,0.34)] hover:scale-[1.03] hover:shadow-[0_24px_44px_rgba(47,93,138,0.38)]">
                + Add Lead
              </Link>
              <Link href={defaultQuoteHref} className="us-btn-secondary hover:scale-[1.02] hover:shadow-[var(--shadow-card)]">
                Create {quoteLabel} Quote
              </Link>
              <Link href={defaultInvoiceHref} className="us-btn-secondary hover:scale-[1.02] hover:shadow-[var(--shadow-card)]">
                Create {invoiceLabel} Invoice
              </Link>
            </div>

            <div className="mt-8 rounded-[1.2rem] border border-[var(--color-border)] bg-white/75 p-5">
              <p className="text-sm font-extrabold text-[var(--color-text)]">Getting started:</p>
              <div className="mt-3 grid gap-2 text-sm font-semibold text-[var(--color-text-secondary)] sm:grid-cols-3">
                {["Add first lead", "Create first quote", "Close first job"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-primary)] text-xs font-extrabold text-[var(--color-primary)]">
                      ✓
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {leadsCreatedCount === 1 ? (
              <p className="mt-5 rounded-[1rem] border border-[rgba(46,125,90,0.22)] bg-[rgba(46,125,90,0.12)] px-4 py-3 text-sm font-bold text-[var(--color-success)]">
                🎉 First lead added — you&apos;re officially tracking your business.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
          <p className="us-kicker">Today&apos;s Focus</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">Today&apos;s Focus</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            Stay on top of your leads and follow-ups.
          </p>
          {hasNoFocusActivity ? (
            <p className="mt-4 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)]">
              You don&apos;t have any leads yet. Add your first one to start tracking real jobs.
            </p>
          ) : null}
          <p className="mt-4 text-sm font-extrabold text-[var(--color-primary)]">
            Next step: {nextStepGuidance}
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {focusCards.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-[1.2rem] border p-5 transition hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[var(--shadow-card)] ${item.colorClass}`}
              >
                <p className="text-sm font-bold text-[var(--color-text-secondary)]">{item.label}</p>
                <p className="mt-2 text-3xl font-extrabold">{item.value}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
          <p className="us-kicker">Sales Pipeline</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">Sales Pipeline</h2>
          {hasNoPipelineActivity ? (
            <p className="mt-4 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)]">
              Your pipeline will appear here once you start adding leads and quotes.
            </p>
          ) : null}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pipelineCards.map((item) => (
              <div key={item.label} className={`rounded-[1.2rem] border p-5 ${item.colorClass}`}>
                <p className="text-sm font-bold text-[var(--color-text-secondary)]">{item.label}</p>
                <p className="mt-2 text-3xl font-extrabold">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <p className="us-kicker">Run Your Business</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">Run Your Business</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {primarySections.map((section) => (
              <div key={section.title} className="flex min-h-56 flex-col rounded-[1.4rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
                <h3 className="text-xl font-bold text-[var(--color-text)]">{section.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-[var(--color-text-secondary)]">{section.description}</p>
                <Link href={section.href} className="us-btn-primary mt-6 w-full text-sm hover:scale-[1.02] hover:shadow-[var(--shadow-card)]">
                  {section.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.4rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">Account</p>
              <p className="mt-2 text-xl font-bold text-[var(--color-text)]">{access.isTrialing ? "30-Day Trial" : isSubscribed ? "$14.99/month" : "No Active Access"}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{billingMessage}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <BillingActions isSubscribed={isSubscribed} isTrialing={access.isTrialing} />
              <Link href="/settings" className="us-btn-secondary min-w-36 text-sm">
                Settings
              </Link>
              <LogoutButton />
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <p className="us-kicker">More Tools</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">More Tools</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {secondarySections.map((section) => (
            <div key={section.title} className="flex min-h-44 flex-col rounded-[1.2rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)]">
              <h3 className="text-lg font-bold text-[var(--color-text)]">{section.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[var(--color-text-secondary)]">{section.description}</p>
              <Link href={section.href} className="us-btn-secondary mt-5 w-full text-sm hover:scale-[1.02] hover:shadow-[var(--shadow-card)]">
                {section.cta}
              </Link>
            </div>
          ))}
          </div>
        </section>

        <details className="rounded-[1.2rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)]">
          <summary className="cursor-pointer text-sm font-extrabold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            AI Assistant
          </summary>
          <div className="mt-5">
            <DashboardAIWidget
              context={{
                isSubscribed,
                hasCoreAccess,
                hasAiAccess,
                subscriptionStatus,
                trialDaysRemaining,
                businessProfile: {
                  businessName: businessProfile.business_name,
                  industry: industryLabel,
                  customIndustry: businessProfile.custom_industry,
                  servicesOffered: businessProfile.services_offered,
                  defaultQuoteType: businessProfile.default_quote_type,
                  defaultInvoiceType: businessProfile.default_invoice_type,
                },
                stats: [
                  { label: "New Leads", value: String(newLeadsCount ?? 0) },
                  { label: "Follow Ups Due", value: String(followUpsDueCount ?? 0) },
                  { label: "Open Quotes", value: String(openQuotesCount ?? 0) },
                  { label: "Customers", value: String(customerCount ?? 0) },
                ],
                sections,
              }}
            />
          </div>
        </details>
      </div>
    </main>
  );
}
