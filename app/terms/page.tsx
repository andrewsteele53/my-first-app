import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <main className="us-page">
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <section className="us-hero">
          <p className="us-kicker">Unified Steele</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--color-text)]">
            Terms of Service
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            These terms describe the basic rules for using UnifiedSteele and
            its business management tools.
          </p>
        </section>

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
          <div className="space-y-5 text-sm leading-7 text-[var(--color-text-secondary)]">
            <p>
              UnifiedSteele provides business tools including invoices, quotes,
              AI assistance, subscriptions, and integrations like QuickBooks.
            </p>
            <p>
              Users are responsible for verifying invoice, tax, accounting, and
              business information before relying on it or sending it to
              customers, accounting systems, or third parties.
            </p>
            <p>
              UnifiedSteele is not legal, tax, accounting, or financial advice.
              Users should consult qualified professionals for those matters.
            </p>
            <p>
              Features and pricing may change over time. Misuse of the platform
              may result in restricted access.
            </p>
            <p>
              For terms questions, contact{" "}
              <a className="us-link" href="mailto:support@unifiedsteele.app">
                support@unifiedsteele.app
              </a>
              .
            </p>
          </div>
        </section>

        <Link href="/" className="us-link inline-flex text-sm">
          Back to Unified Steele
        </Link>
      </div>
    </main>
  );
}
