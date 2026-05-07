import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import SiteNavigation from "@/components/site-navigation";
import SiteFooter from "@/components/site-footer";
import WebsiteQuoteForm from "@/components/website-quote-form";

const portfolio = [
  ["Restaurant demo", "Menu, local SEO, maps, and reservation-focused calls to action"],
  ["Medical office demo", "Trust-building service pages with mobile appointment prompts"],
  ["Retail demo", "Product-forward homepage with promotions, gallery, and location details"],
  ["Fitness studio demo", "Membership CTAs, class highlights, and mobile-first scheduling"],
];

const howItWorks = [
  [
    "Request a Free Preview",
    "Tell us about your business and what kind of website you need.",
  ],
  [
    "We Build a Preview",
    "We create a website mockup and send screenshots by email.",
  ],
  [
    "You Review It",
    "You can request changes or decide if you want to move forward.",
  ],
  [
    "Pay Securely Through Stripe",
    "If you approve the preview, we send a secure Stripe payment link or checkout option.",
  ],
  [
    "Website Gets Finalized",
    "After payment, we finalize your website and prepare it for launch.",
  ],
];

const whyChooseUs = [
  "Built for all businesses, not just one industry",
  "Affordable websites without agency-level pricing",
  "Clean mobile-first layouts that help customers take action",
  "Optional management when you want updates handled for you",
  "Secure Stripe payment options after you approve the preview",
  "Professional online presence connected to a broader business platform",
];

const previewTrustItems = [
  "No upfront payment required for preview",
  "Preview screenshots sent by email",
  "Pay only if you want to move forward",
  "Secure Stripe payment after approval",
  "You own your website after purchase",
  "Optional website management available",
];

const professionalFeatures = [
  "Professional modern design",
  "Mobile optimization",
  "Contact forms",
  "SEO setup",
  "Social links",
  "Google Maps integration",
  "Image gallery",
  "Fast-loading layout",
  "Lead/contact section",
];

const managedFeatures = [
  "Full professional website build",
  "Website edits and updates",
  "Ongoing support",
  "Maintenance",
  "Optimization",
  "Analytics monitoring",
  "Hosting assistance",
  "Mobile-friendly design",
];

const customFeatures = [
  "Ecommerce options",
  "Booking systems",
  "Custom integrations",
  "Larger websites",
  "Advanced forms",
  "Custom workflows",
  "Business-specific features",
];

const websitePackages = [
  {
    title: "Professional Website",
    price: "$499.99",
    cadence: "one-time",
    description:
      "For businesses that want a professional website with full ownership and no required monthly commitment.",
    features: professionalFeatures,
    cta: "Request Free Preview",
    note: "No upfront payment required for preview.",
  },
  {
    title: "Professional Website + Management",
    price: "$249.99 setup + $59.99/month",
    cadence: "setup plus monthly",
    description:
      "For businesses that want a lower upfront cost with ongoing website support and management.",
    features: managedFeatures,
    cta: "Request Free Preview",
    note: "No upfront payment required for preview.",
    featured: true,
  },
  {
    title: "Custom Website",
    price: "Custom Quote",
    cadence: "tailored project",
    description:
      "For advanced businesses that need larger websites, ecommerce, booking systems, integrations, or custom functionality.",
    features: customFeatures,
    cta: "Request Custom Preview",
    note: "Start with a free preview conversation.",
  },
];

function DevicePreview({ title }: { title: string }) {
  return (
    <div className="relative h-60 overflow-hidden rounded-xl border border-[var(--color-border-muted)] bg-[linear-gradient(135deg,#f8fafc,#e8f4ef)] p-4">
      <div className="h-full rounded-lg border border-white/80 bg-white p-3 shadow-[var(--shadow-card-soft)]">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#c75050]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#b7791f]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2e7d5a]" />
        </div>
        <div className="mt-4 h-11 rounded-lg bg-[var(--color-primary-active)]" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="col-span-2 h-24 rounded-lg bg-[rgba(47,93,138,0.12)]" />
          <div className="h-24 rounded-lg bg-[rgba(46,125,90,0.14)]" />
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
            <BrandLogo size="md" className="mb-6 rounded-2xl bg-white/75 p-2 shadow-[var(--shadow-card-soft)]" />
            <p className="us-kicker">Website development services</p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight text-[var(--color-text)] sm:text-6xl">
              Professional Websites for Modern Businesses
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-secondary)]">
              We create clean, fast, mobile-friendly websites designed to help
              businesses across all industries build credibility and generate
              customers online.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="#request-preview" className="us-btn-primary min-h-14 px-8">
                Request Free Preview
              </Link>
              <Link href="#portfolio" className="us-btn-secondary min-h-14 px-8">
                View Demo Websites
              </Link>
            </div>
          </div>
          <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <DevicePreview title="Business Website" />
          </div>
        </div>
      </section>

      <section id="portfolio" className="border-y border-white/80 bg-white/55 py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <p className="us-kicker">Portfolio / Demo Websites</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
              Modern layouts for restaurants, clinics, retail, gyms, local services, and more.
            </h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {portfolio.map(([title, text]) => (
              <article
                key={title}
                className="group rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
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
        <div className="max-w-3xl">
          <p className="us-kicker">How It Works</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            A simple path from idea to launch.
          </h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {howItWorks.map(([title, text], index) => (
            <article
              key={title}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary-active)] text-lg font-extrabold text-white">
                {index + 1}
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

      <section className="border-y border-white/80 bg-white/55 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[0.82fr_1.18fr] lg:px-8">
          <div>
            <p className="us-kicker">Why Choose Us</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
              Professional websites without overcomplicated agency pricing.
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">
              Website development is available for all businesses. Whether you
              run a restaurant, salon, medical office, gym, retail shop, startup,
              or local service business, the goal is the same: a credible site
              that helps customers contact you.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {whyChooseUs.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)]"
              >
                <div className="h-1.5 w-12 rounded-full bg-[var(--color-success)]" />
                <p className="mt-4 text-sm font-extrabold leading-6 text-[var(--color-text)]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8" id="packages">
        <div className="max-w-3xl">
          <p className="us-kicker">Website Packages</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Clear website pricing with flexible ownership and management options.
          </h2>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {websitePackages.map((pkg) => (
            <article
              key={pkg.title}
              className={`relative flex min-h-[38rem] flex-col rounded-2xl border p-6 transition hover:-translate-y-1 ${
                pkg.featured
                  ? "border-[rgba(47,93,138,0.62)] bg-white shadow-[0_26px_70px_rgba(47,93,138,0.18)] ring-4 ring-[rgba(47,93,138,0.08)]"
                  : "border-[var(--color-border)] bg-white shadow-[var(--shadow-card-soft)] hover:shadow-[var(--shadow-card)]"
              }`}
            >
              {pkg.featured ? (
                <div className="absolute -top-4 left-6 rounded-full bg-[var(--color-primary-active)] px-4 py-2 text-xs font-extrabold text-white shadow-[var(--shadow-card-soft)]">
                  MOST POPULAR
                </div>
              ) : null}
              <p className="text-sm font-extrabold uppercase text-[var(--color-primary)]">
                {pkg.cadence}
              </p>
              <h3 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
                {pkg.title}
              </h3>
              <p className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--color-text)]">
                {pkg.price}
              </p>
              <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
                {pkg.description}
              </p>
              <ul className="mt-6 grid flex-1 gap-3 text-sm font-semibold text-[var(--color-text)]">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-success)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid gap-3">
                <Link
                  href="#request-preview"
                  className={pkg.featured ? "us-btn-primary w-full text-sm" : "us-btn-secondary w-full text-sm"}
                >
                  {pkg.cta}
                </Link>
                <p className="text-center text-xs font-bold leading-5 text-[var(--color-text-secondary)]">
                  {pkg.note}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/80 bg-white/55 py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-primary-active)] p-8 text-white shadow-[var(--shadow-card)]">
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
              <div>
                <p className="text-sm font-extrabold uppercase text-white/70">
                  Ownership and management
                </p>
                <h2 className="mt-3 text-3xl font-extrabold">
                  Your website should work for your business, not lock you in.
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {previewTrustItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/15 bg-white/10 p-4 text-sm font-bold leading-6 text-white"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="request-preview" className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.78fr_1.22fr] lg:px-8">
        <div>
          <p className="us-kicker">Free Website Preview</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Get a free preview before you pay.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">
            Tell us about your business and we&apos;ll create preview screenshots.
            If you like the direction, we&apos;ll send secure Stripe payment
            options to move forward.
          </p>
          <div className="mt-6 grid gap-3">
            {previewTrustItems.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-bold text-[var(--color-text)] shadow-[var(--shadow-card-soft)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        <WebsiteQuoteForm />
      </section>

      <SiteFooter />
    </main>
  );
}
