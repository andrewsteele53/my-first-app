import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BillingActions from "./billing-actions";
import LogoutButton from "@/components/logout-button";
import DashboardAIWidget from "@/components/dashboard-ai-widget";
import LandingPage from "@/components/landing-page";
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

export const dynamic = "force-dynamic";

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
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
  const leadCta = industryLabel === "Demolition" ? "Find Demolition Leads" : "Add / View Leads";
  const mappingCta =
    industryLabel === "Demolition" ? "Map Demolition Sales Route" : "View Sales Mapping";
  const todayDate = getLocalDateString();
  const tomorrowDate = getLocalDateString(addDays(new Date(), 1));
  const [
    newLeadsResult,
    followUpsDueResult,
    overdueFollowUpsResult,
    upcomingFollowUpsResult,
    openQuotesResult,
    customerResult,
    leadsCreatedResult,
    wonLeadsResult,
    lostLeadsResult,
    scheduledFollowUpsResult,
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
        .gte("follow_up_date", todayDate)
        .lt("follow_up_date", tomorrowDate),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("follow_up_date", "is", null)
        .lt("follow_up_date", todayDate),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("follow_up_date", "is", null)
        .gte("follow_up_date", tomorrowDate),
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
  const dashboardCountErrors = [
    ["New leads", newLeadsResult.error],
    ["Follow-ups due today", followUpsDueResult.error],
    ["Overdue follow-ups", overdueFollowUpsResult.error],
    ["Upcoming follow-ups", upcomingFollowUpsResult.error],
    ["Open quotes", openQuotesResult.error],
    ["Customers", customerResult.error],
    ["Leads created", leadsCreatedResult.error],
    ["Won leads", wonLeadsResult.error],
    ["Lost leads", lostLeadsResult.error],
    ["Scheduled follow-ups", scheduledFollowUpsResult.error],
  ]
    .filter((entry): entry is [string, NonNullable<typeof newLeadsResult.error>] =>
      Boolean(entry[1])
    )
    .map(([label, countError]) => `${label}: ${countError.message}`);
  const newLeadsCount = newLeadsResult.count;
  const followUpsDueCount = followUpsDueResult.count;
  const overdueFollowUpsCount = overdueFollowUpsResult.count;
  const upcomingFollowUpsCount = upcomingFollowUpsResult.count;
  const openQuotesCount = openQuotesResult.count;
  const customerCount = customerResult.count;
  const leadsCreatedCount = leadsCreatedResult.count;
  const wonLeadsCount = wonLeadsResult.count;
  const lostLeadsCount = lostLeadsResult.count;
  const scheduledFollowUpsCount = scheduledFollowUpsResult.count;

  const sections = [
    { title: "Leads", description: "Organize contacts, lead notes, follow-ups, service types, and estimated job value in one place.", href: "/leads", cta: leadCta, tone: "primary" },
    { title: "Customers", description: "Store customer records, follow-up dates, sales status, notes, and quick outreach actions in one CRM view.", href: "/customers", cta: "Add / View Customers", tone: "primary" },
    { title: "Quotes", description: "Create estimates and proposals, manage quote statuses, and convert approved quotes into invoices.", href: defaultQuoteHref, cta: `Create ${quoteLabel} Quote`, tone: "primary" },
    { title: "Invoices", description: "Create, save, and manage customer-ready invoices for every service type.", href: defaultInvoiceHref, cta: `Create ${invoiceLabel} Invoice`, tone: "primary" },
    { title: "Sales Mapping", description: "Track neighborhoods, route opportunities, and area performance with a cleaner field-sales view.", href: "/mapping", cta: mappingCta, tone: "secondary" },
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
    (overdueFollowUpsCount ?? 0) === 0 &&
    (upcomingFollowUpsCount ?? 0) === 0 &&
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
    ...(overdueFollowUpsCount && overdueFollowUpsCount > 0
      ? [
          {
            label: "Overdue Follow Ups",
            value: overdueFollowUpsCount,
            href: "/leads?filter=overdue",
            colorClass: "border-[rgba(199,80,80,0.22)] bg-[rgba(199,80,80,0.1)] text-[var(--color-danger)]",
          },
        ]
      : []),
    {
      label: "Upcoming Follow Ups",
      value: upcomingFollowUpsCount ?? 0,
      href: "/leads?filter=upcoming",
      colorClass: "border-[rgba(47,93,138,0.22)] bg-[rgba(47,93,138,0.08)] text-[var(--color-primary)]",
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
          {dashboardCountErrors.length > 0 ? (
            <div className="us-notice-danger mt-4 text-sm">
              <p className="font-bold">Dashboard count error</p>
              <p className="mt-1">{dashboardCountErrors.join(" | ")}</p>
            </div>
          ) : null}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                  { label: "Overdue Follow Ups", value: String(overdueFollowUpsCount ?? 0) },
                  { label: "Upcoming Follow Ups", value: String(upcomingFollowUpsCount ?? 0) },
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
