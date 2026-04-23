import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="us-page">
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-12">
        <section className="w-full rounded-[2rem] border border-[var(--color-border)] bg-white p-10 shadow-[var(--shadow-card)]">
          <div className="text-center">
            <p className="us-kicker">Unified Steele</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--color-text)]">
              Support
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
              If you need help or have questions, reach out anytime.
            </p>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-7 text-center shadow-[var(--shadow-card-soft)]">
            <p className="us-panel-title">Email Support</p>
            <a
              href="mailto:unifiedsteele@gmail.com"
              className="mt-4 inline-block text-2xl font-bold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
            >
              unifiedsteele@gmail.com
            </a>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              We&apos;ll help with billing, account questions, invoices, leads,
              mapping, and anything else you need to get moving.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="us-btn-primary">
              Back to Dashboard
            </Link>
            <Link href="/settings" className="us-btn-secondary">
              Open Settings
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
