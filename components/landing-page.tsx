import Link from "next/link";
import DashboardMockup from "@/components/dashboard-mockup";
import SiteNavigation from "@/components/site-navigation";
import SiteFooter from "@/components/site-footer";

const painPoints = [
  ["Lost leads", "Opportunities disappear when notes, forms, and inboxes are scattered."],
  ["Forgotten follow-ups", "Important callbacks slip through busy days and cost real revenue."],
  ["Disorganized invoices", "Quotes, invoices, and payments become harder to track as work grows."],
  ["No website", "Customers cannot trust or find a business that has no clear online home."],
  ["Poor online presence", "Outdated pages and weak mobile layouts make good companies look behind."],
  ["Too many apps", "Switching between tools slows owners down and hides the full picture."],
];

const features = [
  ["Lead Tracking", "Capture prospects, status, notes, and next actions in one clean pipeline."],
  ["Invoices", "Create customer-ready invoices and keep every payment workflow organized."],
  ["Quotes", "Build professional estimates that can move into invoices when work is approved."],
  ["Follow-Ups", "Stay ahead of callbacks, reminders, and customer communication."],
  ["AI Tools", "Draft notes, messages, and business actions with practical AI assistance."],
  ["Dashboard Analytics", "See daily priorities, pipeline health, and business activity quickly."],
  ["QuickBooks Integration", "Reduce double entry with billing workflows prepared for QuickBooks sync."],
  ["Mobile Friendly", "Manage key workflows from the field, office, or wherever work happens."],
];

export default function LandingPage() {
  return (
    <main className="us-page overflow-hidden">
      <SiteNavigation />

      <section className="relative border-b border-white/70 bg-[linear-gradient(135deg,#f8fbff_0%,#edf4f9_48%,#e8f4ef_100%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-24">
          <div>
            <p className="us-kicker">SaaS platform plus website services</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-tight text-[var(--color-text)] sm:text-6xl lg:text-7xl">
              Run Your Business Smarter.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-secondary)]">
              Unified Steele helps businesses manage leads, invoices, customers,
              follow-ups, and more while also offering professional website
              development services.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup" className="us-btn-primary min-h-14 px-8 text-base">
                Start Free Trial
              </Link>
              <Link href="/website-development" className="us-btn-secondary min-h-14 px-8 text-base">
                Website Services
              </Link>
            </div>
            <p className="mt-5 text-sm font-bold text-[var(--color-text-secondary)]">
              Built for businesses that need sharper operations and a better online presence.
            </p>
          </div>
          <DashboardMockup />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8" id="pain-points">
        <div className="max-w-3xl">
          <p className="us-kicker">Common business friction</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            The problems that quietly drain time, trust, and revenue.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {painPoints.map(([title, text], index) => (
            <article
              key={title}
              className="group rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
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
      </section>

      <section className="border-y border-white/80 bg-white/55 py-16" id="features">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="us-kicker">Platform features</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
                A cleaner operating system for modern businesses.
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

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
        <div className="rounded-[1.6rem] border border-[rgba(47,93,138,0.18)] bg-[var(--color-primary-active)] p-8 text-white shadow-[var(--shadow-card)]">
          <p className="text-sm font-extrabold uppercase text-white/70">
            Website development
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Need a Website for Your Business?
          </h2>
          <p className="mt-4 text-base leading-7 text-white/82">
            We build modern, mobile-friendly websites for businesses across all
            industries.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/website-development" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-extrabold text-[var(--color-primary-active)]">
              View Website Services
            </Link>
            <Link href="/contact?service=website" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-6 text-sm font-extrabold text-white">
              Request a Quote
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {["One-time website builds", "Recurring management", "Stripe-ready payments"].map((item) => (
            <div key={item} className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
              <p className="text-3xl font-extrabold text-[var(--color-primary)]">+</p>
              <p className="mt-4 text-lg font-extrabold text-[var(--color-text)]">
                {item}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                Built to support businesses that want a stronger web presence without adding operational complexity.
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
        <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-7 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="us-kicker">Start today</p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
                Bring your business tools and online presence under one brand.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/signup" className="us-btn-primary min-w-44">
                Start Free Trial
              </Link>
              <Link href="/contact" className="us-btn-secondary min-w-44">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
