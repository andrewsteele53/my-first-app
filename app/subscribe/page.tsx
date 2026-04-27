import Link from "next/link";
import BillingActions from "../billing-actions";
import { getProfileAccess } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

export default async function SubscribePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isSubscribed = false;
  let subscriptionStatus = "inactive";

  if (user) {
    const access = await getProfileAccess(supabase, user);
    isSubscribed = access.isSubscribed;
    subscriptionStatus = access.subscriptionStatus;
  }

  return (
    <main className="us-page px-6 py-12 text-[var(--color-text)]">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-9 shadow-[var(--shadow-card)]">
          <p className="us-kicker">
            Unified Steele
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">Upgrade to Pro</h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--color-text-secondary)]">
            You have reached the free invoice limit or you are ready to unlock the
            full SaaS toolkit. Upgrade for unlimited invoice saves and premium
            business tools.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-5">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Starter</p>
              <p className="mt-2 text-2xl font-bold">5 Free Invoices</p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Best for trying the app before upgrading.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[rgba(47,93,138,0.2)] bg-[rgba(47,93,138,0.08)] p-5">
              <p className="text-sm font-medium text-[var(--color-primary)]">Pro</p>
              <p className="mt-2 text-2xl font-bold">$14.99 / month</p>
              <p className="mt-2 text-sm text-[var(--color-text)]">
                Unlimited invoice saves plus premium business tools.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6">
            <h2 className="text-xl font-bold">What you unlock</h2>
            <ul className="mt-4 space-y-3 text-sm text-[var(--color-text)]">
              <li>Unlimited invoice saves across every invoice type</li>
              <li>Leads database access</li>
              <li>Sales mapping tools</li>
              <li>Billing management portal</li>
              <li>Future premium upgrades and features</li>
            </ul>
          </div>
        </section>

        <aside className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-9 shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Upgrade Path
          </p>
          <p className="mt-3 text-5xl font-bold">$14.99</p>
          <p className="mt-2 text-base text-[var(--color-text-secondary)]">
            per month
          </p>

          {isSubscribed ? (
            <div className="mt-8 rounded-[1.25rem] border border-[rgba(46,125,90,0.18)] bg-[rgba(46,125,90,0.1)] px-4 py-3 text-sm font-semibold text-[var(--color-success)]">
              Pro Active · Status: {subscriptionStatus}
            </div>
          ) : null}

          <div className="mt-8">
            <BillingActions isSubscribed={isSubscribed} />
          </div>

          <div className="us-notice-warning mt-8 p-5 text-sm">
            Invoice saves are limited to 5 total on the free plan. Once you hit
            the cap, new saves are locked until you upgrade.
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/" className="us-link text-sm">
              Back to Dashboard
            </Link>
            <Link href="/invoices" className="us-link text-sm">
              Back to Invoices
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
