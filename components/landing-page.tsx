import Link from "next/link";
import DashboardMockup from "@/components/dashboard-mockup";
import SiteFooter from "@/components/site-footer";
import SiteNavigation from "@/components/site-navigation";

const painPoints = [
  ["Lost leads", "New calls and messages get buried before you ever quote the job."],
  ["Forgotten follow-ups", "Estimates, callbacks, and reminders depend on memory after a long day."],
  ["Messy invoices", "Payment details end up scattered between apps, screenshots, and notebooks."],
  ["Quotes that never get sent", "Good jobs stall because the quote is still sitting in your head."],
  ["No clear customer history", "It is hard to see past work, notes, addresses, and contact details quickly."],
  ["No website or weak online presence", "Customers cannot easily trust, find, or contact your business online."],
];

const previewHighlights = [
  ["New leads", "See who contacted you and what needs action."],
  ["Open invoices", "Keep money-related work visible instead of buried."],
  ["Upcoming follow-ups", "Know who needs a call, text, reminder, or estimate."],
  ["Saved customers", "Keep customer details and job history in one place."],
  ["AI-suggested next steps", "Get practical prompts for what to do next."],
];

const industries = [
  "Handyman",
  "Remodeling",
  "Landscaping",
  "Junk Removal",
  "Gutter Cleaning",
  "Power Washing",
  "Roofing",
  "Cleaning",
  "Towing",
  "Demolition",
  "Painting",
  "HVAC",
  "Plumbing",
  "Electrical",
];

const features = [
  [
    "Lead Tracking",
    "Track who contacted you, who needs a follow-up, and who became a customer.",
  ],
  [
    "Quotes",
    "Create and manage quotes before turning approved work into invoices.",
  ],
  ["Invoices", "Keep invoices organized, saved, and easy to access."],
  [
    "Customers",
    "Store customer details, job history, and contact info in one place.",
  ],
  ["Follow-Ups", "See who needs a call, text, estimate, or reminder."],
  [
    "Scheduling / Booking",
    "Let customers request jobs and keep upcoming work easier to manage.",
  ],
  [
    "AI Assistant",
    "Get suggested next steps, customer message help, and business support.",
  ],
  [
    "QuickBooks-Ready",
    "Designed with QuickBooks connection in mind for businesses that want accounting flow.",
  ],
];

const softwarePlanFeatures = [
  "Leads",
  "Customers",
  "Quotes",
  "Invoices",
  "Follow-ups",
  "Scheduling / booking tools",
  "AI assistant access based on active subscription",
  "Dashboard insights",
];

const websitePlanFeatures = [
  "Website preview option",
  "Business-specific design",
  "Mobile-friendly layout",
  "Contact form / call buttons",
  "Optional Stripe-ready payment setup",
  "Optional monthly management",
];

export default function LandingPage() {
  return (
    <main className="us-page overflow-hidden">
      <SiteNavigation featuresHref="#features" pricingHref="#pricing" />

      <section className="relative border-b border-white/70 bg-[linear-gradient(135deg,#f8fbff_0%,#edf4f9_48%,#e8f4ef_100%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-22">
          <div>
            <p className="us-kicker">Contractor software for field service businesses</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.04] tracking-tight text-[var(--color-text)] sm:text-6xl lg:text-7xl">
              Contractor software built to keep jobs, leads, and invoices organized.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-secondary)]">
              Unified Steele helps service businesses manage leads, quotes,
              invoices, customers, follow-ups, scheduling, and AI-powered next
              steps from one simple dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup" className="us-btn-primary min-h-14 px-8 text-base">
                Start Free Trial
              </Link>
              <Link href="/website-development#request-preview" className="us-btn-secondary min-h-14 px-8 text-base">
                Request Website Preview
              </Link>
            </div>
            <p className="mt-5 text-sm font-bold text-[var(--color-text-secondary)]">
              Built for contractors, trades, and local service businesses.
            </p>
          </div>
          <DashboardMockup />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8" id="pain-points">
        <div className="max-w-4xl">
          <p className="us-kicker">The daily mess</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Still tracking your business through texts, notebooks, screenshots, and memory?
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {painPoints.map(([title, text], index) => (
            <article
              key={title}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-surface-secondary)] text-sm font-extrabold text-[var(--color-primary)] ring-1 ring-[var(--color-border-muted)]">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-5 text-xl font-extrabold text-[var(--color-text)]">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                {text}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-7 rounded-2xl border border-[rgba(47,93,138,0.18)] bg-[rgba(47,93,138,0.08)] px-5 py-4 text-base font-extrabold text-[var(--color-primary-active)]">
          Unified Steele gives you one place to keep the work moving.
        </p>
      </section>

      <section className="border-y border-white/80 bg-white/55 py-14">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <DashboardMockup />
          <div>
            <p className="us-kicker">Product preview</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
              See what needs attention before it costs you money.
            </h2>
            <div className="mt-7 grid gap-3">
              {previewHighlights.map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)]"
                >
                  <h3 className="text-lg font-extrabold text-[var(--color-text)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="max-w-4xl">
          <p className="us-kicker">Built for contractors and trades</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Built for the businesses doing the work.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">
            Choose your industry during setup and Unified Steele helps organize
            the tools around how your business actually works.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {industries.map((industry) => (
            <span
              key={industry}
              className="rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-extrabold text-[var(--color-text)] shadow-[var(--shadow-card-soft)]"
            >
              {industry}
            </span>
          ))}
        </div>
      </section>

      <section className="border-y border-white/80 bg-white/55 py-14" id="features">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="us-kicker">Platform features</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
                Everything you need to stay organized without overcomplicating the business.
              </h2>
            </div>
            <Link href="/auth/signup" className="us-btn-primary w-full sm:w-auto">
              Start Free Trial
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(([title, text]) => (
              <article
                key={title}
                className="min-h-52 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <div className="h-1.5 w-14 rounded-full bg-[var(--color-primary)]" />
                <h3 className="mt-5 text-lg font-extrabold text-[var(--color-text)]">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-5 rounded-[1.6rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] lg:grid-cols-[0.95fr_1.05fr] lg:p-7">
          <div className="rounded-[1.25rem] bg-[var(--color-primary-active)] p-7 text-white">
            <p className="text-sm font-extrabold uppercase text-white/70">
              Website services add-on
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Need a website too? Unified Steele can help with that.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/82">
              Some contractors need more than software. They need a professional
              place to send customers. Unified Steele can create a simple, clean
              website for your business, then connect that online presence with
              the tools you use to manage leads, quotes, invoices, and
              follow-ups.
            </p>
            <Link
              href="/website-development#request-preview"
              className="mt-7 inline-flex min-h-13 w-full items-center justify-center rounded-xl bg-white px-6 text-sm font-extrabold text-[var(--color-primary-active)] shadow-[0_14px_30px_rgba(255,255,255,0.16)] transition hover:-translate-y-0.5 hover:bg-[var(--color-surface-secondary)] sm:w-auto"
            >
              Request Website Preview
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Website builds are separate from the software subscription.",
              "Website pricing is custom based on scope and business needs.",
              "Website previews can be requested before purchase.",
              "Optional monthly management may be available.",
              "Stripe-ready payment setup can be included if needed.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-5 text-sm font-extrabold leading-6 text-[var(--color-text)] shadow-[var(--shadow-card-soft)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/80 bg-white/55 py-14" id="pricing">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <p className="us-kicker">Pricing</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
              Simple pricing for small businesses.
            </h2>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <article className="rounded-[1.6rem] border border-[rgba(47,93,138,0.3)] bg-white p-7 shadow-[var(--shadow-card)]">
              <p className="us-kicker">Software plan</p>
              <h3 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
                Unified Steele Pro
              </h3>
              <p className="mt-4 text-4xl font-extrabold text-[var(--color-text)]">
                $14.99/month
              </p>
              <ul className="mt-6 grid gap-3 text-sm font-semibold text-[var(--color-text)] sm:grid-cols-2">
                {softwarePlanFeatures.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-success)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="us-btn-primary mt-7 w-full">
                Start Free Trial
              </Link>
            </article>

            <article className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-7 shadow-[var(--shadow-card-soft)]">
              <p className="us-kicker">Website service</p>
              <h3 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
                Custom Website Build
              </h3>
              <p className="mt-4 text-4xl font-extrabold text-[var(--color-text)]">
                Custom quote
              </p>
              <ul className="mt-6 grid gap-3 text-sm font-semibold text-[var(--color-text)] sm:grid-cols-2">
                {websitePlanFeatures.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/website-development#request-preview" className="us-btn-secondary mt-7 w-full">
                Request Website Preview
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-primary-active)] p-7 text-white shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase text-white/70">
                Start today
              </p>
              <h2 className="mt-3 text-3xl font-extrabold">
                Stop letting leads, invoices, and follow-ups slip through the cracks.
              </h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-white/80">
                Unified Steele gives contractors one simple place to manage the
                work, the customers, and the money.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Link
                href="/auth/signup"
                className="inline-flex min-h-13 items-center justify-center rounded-xl bg-white px-6 text-sm font-extrabold text-[var(--color-primary-active)] transition hover:-translate-y-0.5 hover:bg-[var(--color-surface-secondary)]"
              >
                Start Free Trial
              </Link>
              <Link
                href="/website-development#request-preview"
                className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/30 px-6 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Request Website Preview
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
