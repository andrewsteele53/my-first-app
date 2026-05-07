import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import ContactRequestForm from "@/components/contact-request-form";
import SiteFooter from "@/components/site-footer";
import SiteNavigation from "@/components/site-navigation";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Contact | Unified Steele",
  description:
    "Contact Unified Steele about the SaaS platform, website development services, or business support.",
  path: "/contact",
});

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
          <p className="text-sm font-extrabold uppercase text-[var(--color-primary)]">
            Request details
          </p>
          <ContactRequestForm />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
