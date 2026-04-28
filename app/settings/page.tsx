import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BillingActions from "../billing-actions";
import { getProfileAccess } from "@/lib/billing";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isSubscribed = false;
  let isTrialing = false;
  let subscriptionStatus = "inactive";
  let billingMessage = "Start your 30-day free trial.";
  const userEmail = user?.email || "No email found";

  if (user) {
    const access = await getProfileAccess(supabase, user);
    isSubscribed = access.isSubscribed;
    isTrialing = access.isTrialing;
    subscriptionStatus = access.subscriptionStatus;
    const trialDaysRemaining = access.trialDaysRemaining;
    billingMessage = access.isTrialing
      ? trialDaysRemaining === null
        ? "Trial active. End date syncing."
        : `You're on a 30-day free trial. ${trialDaysRemaining} days remaining.`
      : access.isActive
      ? "Your Pro subscription is active."
      : "Start your 30-day free trial.";
  }

  return (
    <main className="us-page">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="us-hero">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="us-kicker">Unified Steele</p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--color-text)]">
                Settings
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
                Manage your account, subscription, and dashboard preferences.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span
                  className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${
                    isSubscribed || isTrialing
                      ? "border-[rgba(46,125,90,0.18)] bg-[rgba(46,125,90,0.1)] text-[var(--color-success)]"
                      : "border-[rgba(183,121,31,0.18)] bg-[rgba(183,121,31,0.1)] text-[var(--color-warning)]"
                  }`}
                >
                  {isSubscribed ? "Active Plan" : isTrialing ? "Trial Plan" : "No Active Plan"}
                </span>

                <span className="inline-flex rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-card-soft)]">
                  Status: {subscriptionStatus}
                </span>
              </div>
            </div>

            <div className="w-full rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)] lg:max-w-[340px]">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                Billing Access
              </p>
              <p className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
                {isSubscribed ? "$14.99/month" : isTrialing ? "30-Day Trial" : "Not Subscribed"}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                {billingMessage} AI Assistant unlocks after your paid
                subscription begins.
              </p>

              <div className="mt-5">
                <BillingActions isSubscribed={isSubscribed} isTrialing={isTrialing} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)] lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              Account
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">
              User Information
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-[1.3rem] border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-5 shadow-[var(--shadow-card-soft)]">
                <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  Logged In Email
                </p>
                <p className="mt-2 break-all text-lg font-semibold text-[var(--color-text)]">
                  {userEmail}
                </p>
              </div>

              <div className="rounded-[1.3rem] border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-5 shadow-[var(--shadow-card-soft)]">
                <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  Subscription Status
                </p>
                <p className="mt-2 text-lg font-semibold capitalize text-[var(--color-text)]">
                  {subscriptionStatus}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              Quick Links
            </p>
            <div className="mt-4 space-y-3">
              <Link href="/" className="us-btn-primary flex w-full">
                Back to Dashboard
              </Link>
              <Link href="/invoices" className="us-btn-secondary flex w-full">
                Open Invoices
              </Link>
              <Link href="/leads" className="us-btn-secondary flex w-full">
                Open Leads
              </Link>
              <Link href="/mapping" className="us-btn-secondary flex w-full">
                Open Mapping
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              Billing Notes
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              Active subscribers can manage billing directly through the Stripe
              customer portal. You can update payment details, review billing,
              and manage your subscription there.
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
              Data Storage
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              Saved leads and mapping areas automatically delete after 45 days.
              Print or download PDF copies if you want to keep long-term
              records.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
