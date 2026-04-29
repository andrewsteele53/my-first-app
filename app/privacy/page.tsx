import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="us-page">
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <section className="us-hero">
          <p className="us-kicker">Unified Steele</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--color-text)]">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
            This policy explains how UnifiedSteele handles information used to
            operate the app and provide business management features.
          </p>
        </section>

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
          <div className="space-y-5 text-sm leading-7 text-[var(--color-text-secondary)]">
            <p>
              UnifiedSteele collects basic account information such as name,
              email address, and business data needed to operate the app.
            </p>
            <p>
              Invoices, customers, saved business records, subscription data,
              and related account activity may be stored so users can access and
              manage their work.
            </p>
            <p>
              If a user connects QuickBooks, UnifiedSteele may access
              QuickBooks customer, invoice, payment, and business data only to
              provide syncing, reporting, and AI-powered business features.
            </p>
            <p>
              UnifiedSteele does not sell user data. Users may disconnect
              QuickBooks from Settings at any time.
            </p>
            <p>
              For privacy questions, contact{" "}
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
