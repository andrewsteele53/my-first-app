import Link from "next/link";
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
          <p className="text-sm font-extrabold uppercase text-[var(--color-primary)]">
            Request details
          </p>
          <form
            action="mailto:unifiedsteele@gmail.com"
            method="post"
            encType="text/plain"
            className="mt-5 grid gap-4"
          >
            {[
              ["name", "Name"],
              ["business", "Business"],
              ["email", "Email"],
              ["message", "What can we help with?"],
            ].map(([name, label]) => (
              <label key={name} className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
                {label}
                {name === "message" ? (
                  <textarea
                    name={name}
                    className="us-textarea"
                    placeholder="Tell us about your goals, timeline, and services needed."
                  />
                ) : (
                  <input
                    name={name}
                    className="us-input"
                    placeholder={label}
                    type={name === "email" ? "email" : "text"}
                  />
                )}
              </label>
            ))}
            <button type="submit" className="us-btn-primary mt-2">
              Send Request
            </button>
            <p className="text-xs leading-5 text-[var(--color-text-muted)]">
              This opens your email client with the request details so the lead
              can be sent without adding a new backend workflow yet.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
