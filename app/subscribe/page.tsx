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
  let isTrialing = false;
  let subscriptionStatus = "inactive";
  let billingMessage = "Start your 30-day free trial.";
  let hasStripeCustomer = false;

  if (user) {
    const access = await getProfileAccess(supabase, user);
    isSubscribed = access.isSubscribed;
    isTrialing = access.isTrialing;
    subscriptionStatus = access.subscriptionStatus;
    billingMessage = access.isTrialing
      ? access.trialDaysRemaining === null
        ? "Trial active. End date syncing."
        : `You're on a 30-day free trial. ${access.trialDaysRemaining} days remaining.`
      : access.isActive
      ? "Your Pro subscription is active."
      : "Start your 30-day free trial.";

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    hasStripeCustomer =
      typeof profile?.stripe_customer_id === "string" &&
      profile.stripe_customer_id.trim().length > 0;
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
            {billingMessage} AI Assistant unlocks after your paid subscription
            begins.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-5">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Starter</p>
              <p className="mt-2 text-2xl font-bold">30-Day Trial</p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Full core access to invoices, quotes, leads, and mapping.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[rgba(47,93,138,0.2)] bg-[rgba(47,93,138,0.08)] p-5">
              <p className="text-sm font-medium text-[var(--color-primary)]">Pro</p>
              <p className="mt-2 text-2xl font-bold">$14.99 / month</p>
              <p className="mt-2 text-sm text-[var(--color-text)]">
                Full core access plus AI business tools.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6">
            <h2 className="text-xl font-bold">What you unlock</h2>
            <ul className="mt-4 space-y-3 text-sm text-[var(--color-text)]">
              <li>Invoices and quotes across every service type</li>
              <li>Leads database access</li>
              <li>Sales mapping tools</li>
              <li>AI assistant access while your paid subscription is active</li>
              <li>Billing management portal</li>
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
          <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
            {billingMessage}
          </p>

          {isSubscribed || isTrialing ? (
            <div className="mt-8 rounded-[1.25rem] border border-[rgba(46,125,90,0.18)] bg-[rgba(46,125,90,0.1)] px-4 py-3 text-sm font-semibold text-[var(--color-success)]">
              {isSubscribed ? "Pro Active" : "Trial Active"} - Status: {subscriptionStatus}
            </div>
          ) : null}

          <div className="mt-8">
            {isTrialing ? (
              <p className="mb-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                Need AI right away? Start Pro now and unlock the AI Assistant
                immediately.
              </p>
            ) : null}
            <BillingActions
              isSubscribed={isSubscribed}
              isTrialing={isTrialing}
              canManageBilling={!isTrialing || hasStripeCustomer}
              showStartProNow={isTrialing}
            />
          </div>

          <div className="us-notice-warning mt-8 p-5 text-sm">
            Trial users can use core tools, but AI endpoints are available only
            while a paid subscription is active.
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
