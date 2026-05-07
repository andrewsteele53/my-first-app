import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import SiteFooter from "@/components/site-footer";
import SiteNavigation from "@/components/site-navigation";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Contact | Unified Steele",
  description:
    "Contact Unified Steele about the SaaS platform, website development services, or business support.",
  path: "/contact",
});

const previewEmailHref =
  "mailto:unifiedsteele@gmail.com?subject=Website%20Preview%20Request";

export default function ContactPage() {
  return (
    <main className="us-page">
      <SiteNavigation />
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.88fr_1.12fr] lg:px-8 lg:py-24">
        <div>
          <BrandLogo size="md" className="mb-6 rounded-2xl bg-white/75 p-2 shadow-[var(--shadow-card-soft)]" />
          <p className="us-kicker">Contact</p>
          <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-[var(--color-text)]">
            Let&apos;s talk about what your business needs next.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-text-secondary)]">
            Reach out for Unified Steele SaaS questions, website development
            quotes, recurring website management, or general support.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/signup" className="us-btn-primary min-h-14 px-8">
              Start Free Trial
            </Link>
            <Link href="/website-development" className="us-btn-secondary min-h-14 px-8">
              Website Services
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-7 shadow-[var(--shadow-card)]">
          <BrandLogo size="sm" className="mb-5" />
          <p className="us-kicker">
            Direct Contact
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
            Request a Free Website Preview
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">
            Tell us about your business and we&apos;ll create a website preview
            mockup for you. If you like it, we&apos;ll send secure Stripe
            payment options to move forward.
          </p>

          <div className="mt-6 rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-5">
            <p className="text-xs font-extrabold uppercase text-[var(--color-primary)]">
              Email
            </p>
            <a
              href={previewEmailHref}
              className="mt-2 inline-flex break-all text-xl font-extrabold text-[var(--color-primary-active)] transition hover:text-[var(--color-primary-hover)]"
            >
              unifiedsteele@gmail.com
            </a>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={previewEmailHref} className="us-btn-primary min-h-12 px-6">
              Email Unified Steele
            </a>
            <Link href="/website-development#packages" className="us-btn-secondary min-h-12 px-6">
              Website Development
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Usually responds within 24 hours",
              "No upfront payment required for previews",
              "Secure Stripe payment after approval",
              "You own your website after purchase",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-[var(--color-border-muted)] bg-white px-4 py-3 text-sm font-bold leading-6 text-[var(--color-text)] shadow-[var(--shadow-card-soft)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
