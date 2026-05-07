import Link from "next/link";
import SiteNavigation from "@/components/site-navigation";
import WebsiteCheckoutButton from "@/components/website-checkout-button";

const industries = [
  "Contractors",
  "Restaurants",
  "Salons",
  "Gyms",
  "Auto Shops",
  "Retail Stores",
  "Real Estate",
  "Medical Offices",
  "Startups",
  "Local Businesses",
];

const packageFeatures = [
  "Responsive design",
  "Contact forms",
  "SEO setup",
  "Social links",
  "Google Maps",
  "Image galleries",
  "Fast loading",
  "Mobile optimization",
];

const websitePackages = [
  {
    title: "Starter Website",
    type: "One-time payment",
    description: "A clean foundation for businesses that need a credible online presence quickly.",
    item: "starter-website" as const,
  },
  {
    title: "Professional Business Website",
    type: "One-time payment",
    description: "A fuller site for businesses that need stronger service pages, lead capture, and polish.",
    item: "professional-website" as const,
    featured: true,
  },
  {
    title: "Custom Website",
    type: "Custom quote",
    description: "A tailored build for advanced layouts, deeper content, integrations, or custom workflows.",
    item: "custom-website" as const,
  },
];

const managementPlans = [
  {
    title: "Website Management",
    item: "website-management-basic" as const,
    text: "Ongoing care for businesses that want edits, support, and routine maintenance handled.",
  },
  {
    title: "Growth Management",
    item: "website-management-growth" as const,
    text: "A recurring support layer for optimization, analytics monitoring, and stronger web operations.",
  },
];

const portfolio = [
  ["Restaurant demo", "Online menu, local SEO, reservation-focused layout"],
  ["Clinic demo", "Trust-building service pages with mobile appointment CTA"],
  ["Retail demo", "Product-forward homepage with promotions and maps"],
  ["Gym demo", "Membership CTA, class highlights, and mobile-first schedule"],
];

function DevicePreview({ title }: { title: string }) {
  return (
    <div className="relative h-56 overflow-hidden rounded-xl border border-[var(--color-border-muted)] bg-[linear-gradient(135deg,#f8fafc,#e8f4ef)] p-4">
      <div className="h-full rounded-lg border border-white/80 bg-white p-3 shadow-[var(--shadow-card-soft)]">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#c75050]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#b7791f]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2e7d5a]" />
        </div>
        <div className="mt-4 h-10 rounded-lg bg-[var(--color-primary-active)]" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="col-span-2 h-20 rounded-lg bg-[rgba(47,93,138,0.12)]" />
          <div className="h-20 rounded-lg bg-[rgba(46,125,90,0.14)]" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-2 rounded-full bg-[var(--color-border)]" />
          <div className="h-2 w-3/4 rounded-full bg-[var(--color-border)]" />
        </div>
      </div>
      <div className="absolute bottom-4 right-4 w-20 rounded-[1rem] border border-[#0f2233]/15 bg-[#0f2233] p-2 shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-2 h-1 w-6 rounded-full bg-white/40" />
        <div className="h-24 rounded-lg bg-white p-1">
          <div className="h-5 rounded bg-[var(--color-primary)]" />
          <div className="mt-2 h-10 rounded bg-[rgba(47,93,138,0.14)]" />
          <div className="mt-2 h-2 rounded bg-[var(--color-border)]" />
          <div className="mt-1 h-2 w-2/3 rounded bg-[var(--color-border)]" />
        </div>
      </div>
      <p className="absolute left-6 top-7 text-xs font-extrabold uppercase text-white">
        {title}
      </p>
    </div>
  );
}

export default function WebsiteDevelopmentPage() {
  return (
    <main className="us-page overflow-hidden">
      <SiteNavigation />

      <section className="bg-[linear-gradient(135deg,#f8fbff_0%,#eef5f9_54%,#e7f3ee_100%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 lg:grid-cols-[0.96fr_1.04fr] lg:px-8 lg:py-24">
          <div>
            <p className="us-kicker">Website development services</p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight text-[var(--color-text)] sm:text-6xl">
              Professional Websites for Modern Businesses
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-secondary)]">
              We create clean, fast, mobile-friendly websites designed to help
              businesses build credibility and generate customers online.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact?service=website" className="us-btn-primary min-h-14 px-8">
                Request a Quote
              </Link>
              <Link href="#portfolio" className="us-btn-secondary min-h-14 px-8">
                View Portfolio
              </Link>
            </div>
          </div>
          <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <DevicePreview title="Live Preview" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="us-kicker">Industries</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Websites for businesses across every local market.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {industries.map((industry) => (
            <div key={industry} className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-secondary)] text-xs font-extrabold text-[var(--color-primary)] ring-1 ring-[var(--color-border-muted)]">
                {industry.slice(0, 2).toUpperCase()}
              </div>
              <p className="mt-4 text-base font-extrabold text-[var(--color-text)]">
                {industry}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 rounded-2xl border border-[rgba(47,93,138,0.18)] bg-[rgba(47,93,138,0.08)] px-5 py-4 text-sm font-bold text-[var(--color-primary-active)]">
          Don&apos;t see your industry? We can still help.
        </p>
      </section>

      <section className="border-y border-white/80 bg-white/55 py-16" id="packages">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <p className="us-kicker">Website packages</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
              One-time website builds prepared for future Stripe pricing.
            </h2>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {websitePackages.map((pkg) => (
              <article
                key={pkg.title}
                className={`flex min-h-[32rem] flex-col rounded-2xl border p-6 shadow-[var(--shadow-card-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)] ${
                  pkg.featured
                    ? "border-[rgba(47,93,138,0.3)] bg-[rgba(47,93,138,0.07)]"
                    : "border-[var(--color-border)] bg-white"
                }`}
              >
                <p className="text-sm font-extrabold uppercase text-[var(--color-primary)]">
                  {pkg.type}
                </p>
                <h3 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
                  {pkg.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {pkg.description}
                </p>
                <p className="mt-5 rounded-xl border border-dashed border-[var(--color-border)] bg-white/70 px-4 py-3 text-sm font-bold text-[var(--color-text-secondary)]">
                  Stripe price placeholder
                </p>
                <ul className="mt-5 grid flex-1 gap-3 text-sm font-semibold text-[var(--color-text)]">
                  {packageFeatures.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-success)]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 grid gap-3">
                  <Link href="/contact?service=website" className="us-btn-primary w-full text-sm">
                    Request a Quote
                  </Link>
                  <WebsiteCheckoutButton item={pkg.item}>
                    Future Stripe Checkout
                  </WebsiteCheckoutButton>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <p className="us-kicker">Recurring subscriptions</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
              Optional Website Management
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">
              Add recurring support when you want help keeping your site fresh,
              healthy, and aligned with business changes.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {managementPlans.map((plan) => (
              <article key={plan.title} className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
                <p className="text-sm font-extrabold uppercase text-[var(--color-primary)]">
                  Subscription placeholder
                </p>
                <h3 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
                  {plan.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {plan.text}
                </p>
                <ul className="mt-5 space-y-3 text-sm font-semibold text-[var(--color-text)]">
                  {[
                    "Website edits",
                    "Ongoing support",
                    "Optimization",
                    "Maintenance",
                    "Hosting assistance",
                    "Analytics monitoring",
                  ].map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <WebsiteCheckoutButton item={plan.item}>
                    Future Subscription Checkout
                  </WebsiteCheckoutButton>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="portfolio" className="border-y border-white/80 bg-white/55 py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <p className="us-kicker">Portfolio</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
              Placeholder demo projects with desktop and mobile previews.
            </h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {portfolio.map(([title, text]) => (
              <article key={title} className="group rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
                <DevicePreview title={title} />
                <div className="p-3">
                  <h3 className="text-xl font-extrabold text-[var(--color-text)]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-primary-active)] p-8 text-white shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase text-white/70">
                Ready when you are
              </p>
              <h2 className="mt-3 text-3xl font-extrabold">
                Build a website that makes your business easier to trust.
              </h2>
            </div>
            <Link href="/contact?service=website" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-extrabold text-[var(--color-primary-active)]">
              Request a Quote
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
