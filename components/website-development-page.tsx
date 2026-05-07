import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import SiteNavigation from "@/components/site-navigation";
import SiteFooter from "@/components/site-footer";
import WebsiteQuoteForm from "@/components/website-quote-form";

const portfolio = [
  {
    title: "Restaurant demo",
    businessName: "Riverstone Grill",
    text: "Menu, local SEO, maps, and reservation-focused calls to action.",
    mockup: "restaurant",
  },
  {
    title: "Medical office demo",
    businessName: "Northpoint Family Clinic",
    text: "Trust-building service pages with mobile appointment prompts.",
    mockup: "clinic",
  },
  {
    title: "Retail demo",
    businessName: "Maple & Main Boutique",
    text: "Product-forward homepage with promotions, gallery, and location details.",
    mockup: "retail",
  },
  {
    title: "Fitness studio demo",
    businessName: "ForgeFit Studio",
    text: "Membership CTAs, class highlights, and mobile-first scheduling.",
    mockup: "fitness",
  },
] as const;

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

const managedMinimumTermText =
  "Includes a 3-month minimum management term. If cancelled before the initial term ends, the remaining management balance may be due. After the initial term, cancel anytime. You still own your website.";

const managedMinimumTermSummary =
  "Managed website plans include a short minimum term to cover setup, support, and launch work. If cancelled before the initial term ends, the remaining management balance may be due. After the initial term, you can cancel anytime and still own your website.";

const websiteFaqs = [
  {
    question: "Can I cancel the website management plan?",
    answer:
      "Yes. The managed website plan includes a 3-month minimum management term. If cancelled before the initial term ends, the remaining management balance may be due. After the initial term, you can cancel anytime. You still own your website.",
  },
  {
    question: "Why is there a minimum term?",
    answer:
      "The managed plan lowers the upfront website cost, so the short minimum term helps cover setup, development, support, updates, and launch work while keeping the starting price affordable.",
  },
  {
    question: "How much would the early cancellation balance be?",
    answer:
      "The managed plan is $59.99/month with a 3-month minimum management term. If cancelled early, the remaining balance would be based on the unpaid months left in the initial term.",
  },
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
    note: managedMinimumTermText,
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

function MiniBrowser({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border-muted)] bg-white shadow-[var(--shadow-card-soft)]">
      <div className="flex items-center gap-1.5 border-b border-[var(--color-border-muted)] bg-white px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#c75050]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#b7791f]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#2e7d5a]" />
        <span className="ml-2 h-2 w-24 rounded-full bg-[var(--color-border-muted)]" />
      </div>
      {children}
    </div>
  );
}

function MiniPhone({ tone = "primary" }: { tone?: "primary" | "warm" | "dark" }) {
  const accent =
    tone === "warm"
      ? "bg-[#9f4f24]"
      : tone === "dark"
      ? "bg-[#111827]"
      : "bg-[var(--color-primary)]";

  return (
    <div className="absolute bottom-4 right-4 w-20 rounded-[1rem] border border-[#0f2233]/15 bg-[#0f2233] p-2 shadow-[var(--shadow-card)]">
      <div className="mx-auto mb-2 h-1 w-6 rounded-full bg-white/40" />
      <div className="h-24 rounded-lg bg-white p-1">
        <div className={`h-5 rounded ${accent}`} />
        <div className="mt-2 h-8 rounded bg-[var(--color-surface-secondary)]" />
        <div className="mt-2 h-2 rounded bg-[var(--color-border)]" />
        <div className="mt-1 h-2 w-2/3 rounded bg-[var(--color-border)]" />
      </div>
    </div>
  );
}

function RestaurantMockup() {
  return (
    <div className="relative h-72 overflow-hidden rounded-xl bg-[#fbf1e7] p-4">
      <MiniBrowser>
        <div className="bg-[#fffaf4]">
          <div className="flex items-center justify-between px-4 py-3 text-[10px] font-extrabold text-[#5f2f18]">
            <span>Riverstone Grill</span>
            <span className="rounded-full bg-[#9f4f24] px-3 py-1 text-white">
              Reserve
            </span>
          </div>
          <div className="bg-[linear-gradient(135deg,#3b1f16,#b45d2a)] px-4 py-6 text-white">
            <p className="text-[10px] font-bold uppercase text-white/70">
              Wood-fired dinner and local favorites
            </p>
            <h4 className="mt-2 text-xl font-extrabold">Riverstone Grill</h4>
            <div className="mt-4 flex gap-2">
              {["Menu", "Catering", "Map"].map((item) => (
                <span key={item} className="rounded-full bg-white/14 px-3 py-1 text-[10px] font-bold">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 p-4">
            {["Steaks", "Tacos", "Desserts"].map((item) => (
              <div key={item} className="rounded-lg bg-[#f3dcc7] p-2">
                <div className="h-8 rounded bg-[#c9834b]" />
                <p className="mt-2 text-[10px] font-extrabold text-[#5f2f18]">
                  {item}
                </p>
              </div>
            ))}
          </div>
          <div className="mx-4 mb-4 rounded-lg border border-[#ecd0b7] bg-white px-3 py-2 text-[10px] font-bold text-[#5f2f18]">
            Downtown location open until 10 PM
          </div>
        </div>
      </MiniBrowser>
      <MiniPhone tone="warm" />
    </div>
  );
}

function ClinicMockup() {
  return (
    <div className="relative h-72 overflow-hidden rounded-xl bg-[#eef8fb] p-4">
      <MiniBrowser>
        <div className="bg-[#f8fdff]">
          <div className="flex items-center justify-between px-4 py-3 text-[10px] font-extrabold text-[#145268]">
            <span>Northpoint Family Clinic</span>
            <span className="rounded-full bg-[#1f7a8c] px-3 py-1 text-white">
              Appointment
            </span>
          </div>
          <div className="grid grid-cols-[1.1fr_0.9fr] gap-3 px-4 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase text-[#1f7a8c]">
                Family care close to home
              </p>
              <h4 className="mt-2 text-lg font-extrabold text-[#123744]">
                Care for every stage of life
              </h4>
              <div className="mt-3 flex gap-2">
                {["Same week", "Insured", "Local"].map((item) => (
                  <span key={item} className="rounded-full bg-[#d7eef3] px-2 py-1 text-[9px] font-bold text-[#145268]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-[#d7eef3] p-3">
              <div className="h-12 rounded-lg bg-[#88c7d4]" />
              <p className="mt-2 text-[10px] font-extrabold text-[#145268]">
                Dr. care team
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            {["Primary", "Pediatrics", "Wellness"].map((item) => (
              <div key={item} className="rounded-lg border border-[#c7e5ec] bg-white p-2 text-[10px] font-bold text-[#145268]">
                {item}
              </div>
            ))}
          </div>
          <div className="mx-4 mb-4 rounded-lg bg-[#1f7a8c] px-3 py-2 text-[10px] font-extrabold text-white">
            Book your visit from your phone
          </div>
        </div>
      </MiniBrowser>
      <MiniPhone />
    </div>
  );
}

function RetailMockup() {
  return (
    <div className="relative h-72 overflow-hidden rounded-xl bg-[#f6eef7] p-4">
      <MiniBrowser>
        <div className="bg-[#fffaff]">
          <div className="bg-[#5c2d65] px-4 py-2 text-center text-[10px] font-extrabold text-white">
            Spring sale this weekend
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-[10px] font-extrabold text-[#3d2544]">
            <span>Maple & Main Boutique</span>
            <span>Shop local</span>
          </div>
          <div className="grid grid-cols-[0.95fr_1.05fr] gap-3 px-4 py-4">
            <div className="rounded-xl bg-[#ead5ee] p-3">
              <div className="h-20 rounded-lg bg-[#b67ac0]" />
              <p className="mt-2 text-[10px] font-extrabold text-[#3d2544]">
                Featured collection
              </p>
            </div>
            <div>
              <h4 className="text-lg font-extrabold text-[#3d2544]">
                Fresh arrivals for everyday style
              </h4>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {["Tops", "Gifts", "Home", "Sale"].map((item) => (
                  <div key={item} className="rounded-lg bg-[#f1e3f3] p-2 text-[10px] font-bold text-[#5c2d65]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mx-4 mb-4 rounded-lg border border-[#ead5ee] bg-white px-3 py-2 text-[10px] font-bold text-[#5c2d65]">
            Visit us on Main Street
          </div>
        </div>
      </MiniBrowser>
      <MiniPhone />
    </div>
  );
}

function FitnessMockup() {
  return (
    <div className="relative h-72 overflow-hidden rounded-xl bg-[#111827] p-4">
      <MiniBrowser>
        <div className="bg-[#101827] text-white">
          <div className="flex items-center justify-between px-4 py-3 text-[10px] font-extrabold">
            <span>ForgeFit Studio</span>
            <span className="rounded-full bg-[#f97316] px-3 py-1 text-white">
              Join
            </span>
          </div>
          <div className="px-4 py-5">
            <p className="text-[10px] font-bold uppercase text-[#f97316]">
              Strength classes and coaching
            </p>
            <h4 className="mt-2 text-xl font-extrabold">
              Train hard. Book fast.
            </h4>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["6 AM HIIT", "Noon Lift", "5 PM Burn"].map((item) => (
                <div key={item} className="rounded-lg bg-white/10 p-2 text-[10px] font-bold">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="mx-4 mb-4 grid grid-cols-[0.75fr_1.25fr] gap-3">
            <div className="rounded-lg bg-[#f97316] p-3 text-[10px] font-extrabold">
              Book class
            </div>
            <div className="rounded-lg border border-white/15 bg-white/8 p-3 text-[10px] font-bold text-white/80">
              Trainer spotlight and memberships
            </div>
          </div>
        </div>
      </MiniBrowser>
      <MiniPhone tone="dark" />
    </div>
  );
}

function DemoMockup({ type }: { type: (typeof portfolio)[number]["mockup"] }) {
  switch (type) {
    case "restaurant":
      return <RestaurantMockup />;
    case "clinic":
      return <ClinicMockup />;
    case "retail":
      return <RetailMockup />;
    case "fitness":
      return <FitnessMockup />;
  }
}

function DemoWebsiteCard({
  demo,
}: {
  demo: (typeof portfolio)[number];
}) {
  return (
    <article className="group rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card-soft)] transition hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[var(--shadow-card)]">
      <DemoMockup type={demo.mockup} />
      <div className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[rgba(47,93,138,0.18)] bg-[rgba(47,93,138,0.08)] px-3 py-1 text-xs font-extrabold text-[var(--color-primary)]">
            Demo preview
          </span>
          <span className="text-xs font-bold text-[var(--color-text-muted)]">
            {demo.businessName}
          </span>
        </div>
        <h3 className="mt-4 text-xl font-extrabold text-[var(--color-text)]">
          {demo.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
          {demo.text}
        </p>
      </div>
    </article>
  );
}

export default function WebsiteDevelopmentPage() {
  return (
    <main className="us-page overflow-hidden">
      <SiteNavigation pricingHref="#packages" />

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
              Demo websites built for real local business needs.
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">
              Preview the kinds of websites Unified Steele can create for
              restaurants, clinics, retail shops, gyms, and service businesses.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {portfolio.map((demo) => (
              <DemoWebsiteCard key={demo.title} demo={demo} />
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
                {pkg.featured ? (
                  <p className="rounded-xl border border-[rgba(183,121,31,0.25)] bg-[rgba(183,121,31,0.08)] px-3 py-2 text-center text-xs font-semibold leading-5 text-[var(--color-text-secondary)]">
                    Example: If a customer cancels after the first month, the
                    remaining two months of the initial management term may
                    still be due.
                  </p>
                ) : null}
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
                <p className="mt-4 text-sm font-semibold leading-6 text-white/80">
                  {managedMinimumTermSummary}
                </p>
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

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="us-kicker">Website Management FAQ</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)] sm:text-4xl">
            Clear terms before you move forward.
          </h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {websiteFaqs.map((item) => (
            <article
              key={item.question}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]"
            >
              <h3 className="text-lg font-extrabold text-[var(--color-text)]">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                {item.answer}
              </p>
            </article>
          ))}
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
