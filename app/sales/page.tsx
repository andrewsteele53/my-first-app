import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";
import { createServerClient } from "@/lib/supabase/server";
import { requireAccountRole } from "@/lib/roles";
import {
  COMMISSION_PER_ACTIVE_SUBSCRIBER,
  formatMoney,
  isActivePaidSubscription,
} from "@/lib/sales-commission";

type ProfileRow = {
  id: string;
  email: string | null;
  business_name: string | null;
  owner_name: string | null;
  subscription_status: string | null;
};

type SalesRepRow = {
  id: string;
  user_id: string | null;
  display_name: string | null;
  payment_notes: string | null;
  created_at: string | null;
};

type SalesAssignmentRow = {
  id: string;
  sales_rep_id: string | null;
  subscriber_user_id: string | null;
  created_at: string | null;
};

type CommissionPayoutRow = {
  id: string;
  sales_rep_id: string | null;
  amount: number | string;
  status: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

function getProfileName(profile?: ProfileRow | null) {
  return profile?.business_name || profile?.owner_name || profile?.email || "Unnamed subscriber";
}

function statusBadge(status?: string | null) {
  const normalized = status || "inactive";
  const className =
    normalized === "active"
      ? "border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.1)] text-[var(--color-success)]"
      : normalized === "trialing"
      ? "border-[rgba(183,121,31,0.24)] bg-[rgba(183,121,31,0.1)] text-[var(--color-warning)]"
      : normalized === "paid"
      ? "border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.1)] text-[var(--color-success)]"
      : "border-[var(--color-border-muted)] bg-[var(--color-section)] text-[var(--color-text-secondary)]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${className}`}>
      {normalized}
    </span>
  );
}

export default async function SalesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  console.info("Sales portal current user id:", user.id);
  const role = await requireAccountRole(supabase, user, ["sales", "admin"]);

  const [salesRepResult, assignmentsResult, payoutsResult] = await Promise.all([
    supabase
      .from("sales_reps")
      .select("id, user_id, display_name, payment_notes, created_at")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: true })
      .limit(1),
    supabase
      .from("sales_assignments")
      .select("id, sales_rep_id, subscriber_user_id, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("commission_payouts")
      .select("id, sales_rep_id, amount, status, paid_at, notes, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const salesRep = ((salesRepResult.data ?? []) as SalesRepRow[])[0] ?? null;
  console.info("Sales portal sales_reps query result:", salesRepResult.data);
  if (salesRepResult.error) {
    console.error("Sales portal sales_reps query error:", salesRepResult.error);
  }
  const assignments = salesRep
    ? ((assignmentsResult.data ?? []) as SalesAssignmentRow[]).filter(
        (assignment) => assignment.sales_rep_id === salesRep.id
      )
    : [];
  const payouts = salesRep
    ? ((payoutsResult.data ?? []) as CommissionPayoutRow[]).filter(
        (payout) => payout.sales_rep_id === salesRep.id
      )
    : [];
  const subscriberIds = assignments
    .map((assignment) => assignment.subscriber_user_id)
    .filter((id): id is string => Boolean(id));
  const { data: subscriberData, error: subscribersError } =
    subscriberIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, email, business_name, owner_name, subscription_status")
          .in("id", subscriberIds)
      : { data: [], error: null };
  const subscribers = (subscriberData ?? []) as ProfileRow[];
  const subscriberById = new Map(subscribers.map((subscriber) => [subscriber.id, subscriber]));
  const activePaidSubscribers = subscribers.filter((subscriber) =>
    isActivePaidSubscription(subscriber.subscription_status)
  );
  const estimatedCommissionOwed =
    activePaidSubscribers.length * COMMISSION_PER_ACTIVE_SUBSCRIBER;
  const paidPayouts = payouts.filter((payout) => payout.status === "paid");
  const unpaidPayouts = payouts.filter((payout) => payout.status !== "paid");
  const paidTotal = paidPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
  const unpaidTotal = unpaidPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
  const errors = [salesRepResult.error, assignmentsResult.error, payoutsResult.error, subscribersError]
    .filter(Boolean)
    .map((error) => error?.message)
    .join(" | ");

  return (
    <main className="us-page">
      <div className="us-shell space-y-8">
        <section className="us-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="us-kicker">Sales Portal</p>
              <h1 className="mt-3 text-4xl font-extrabold text-[var(--color-text)]">
                {salesRep?.display_name || user.email || "Sales Rep"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Track subscribers manually assigned by the admin. No referral links or referral codes are used.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <span className="inline-flex rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold">
                  {user.email}
                </span>
                <span className="inline-flex rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold capitalize">
                  Role: {role}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {role === "admin" ? <Link href="/admin" className="us-btn-secondary">Admin</Link> : null}
              <Link href="/" className="us-btn-secondary">Dashboard</Link>
              <LogoutButton />
            </div>
          </div>
        </section>

        {!salesRep ? (
          <div className="us-notice-info text-sm">
            Your account has the sales role, but no sales rep record exists yet. Ask the admin to use Check / Activate or Approve Sales Rep so your sales dashboard can be connected.
          </div>
        ) : null}
        {errors ? <div className="us-notice-danger text-sm">{errors}</div> : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Assigned Subscribers" value={String(subscribers.length)} />
          <MetricCard label="Active Paid Assigned" value={String(activePaidSubscribers.length)} />
          <MetricCard label="Estimated Commission Owed" value={formatMoney(estimatedCommissionOwed)} />
          <MetricCard label="Paid / Unpaid History" value={`${formatMoney(paidTotal)} / ${formatMoney(unpaidTotal)}`} />
        </section>

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
          <p className="us-kicker">Assigned Accounts</p>
          <h2 className="mt-2 text-2xl font-extrabold">Assigned subscribers</h2>
          {assignments.length === 0 ? (
            <p className="mt-5 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
              No subscribers are assigned to you yet.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                  <tr>
                    <th className="py-3 pr-4">Subscriber</th>
                    <th className="py-3 pr-4">Subscription</th>
                    <th className="py-3 pr-4">Assigned</th>
                    <th className="py-3 pr-4">Commission Counted</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => {
                    const subscriber = assignment.subscriber_user_id
                      ? subscriberById.get(assignment.subscriber_user_id)
                      : undefined;
                    const isActivePaid = isActivePaidSubscription(subscriber?.subscription_status);

                    return (
                      <tr key={assignment.id} className="border-b border-[var(--color-border-muted)]">
                        <td className="py-4 pr-4">
                          <p className="font-bold">{getProfileName(subscriber)}</p>
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                            {subscriber?.email || assignment.subscriber_user_id || "Unknown user"}
                          </p>
                        </td>
                        <td className="py-4 pr-4">{statusBadge(subscriber?.subscription_status)}</td>
                        <td className="py-4 pr-4">{formatDate(assignment.created_at)}</td>
                        <td className="py-4 pr-4">
                          {isActivePaid ? (
                            <span className="font-bold text-[var(--color-success)]">Yes</span>
                          ) : (
                            <span className="text-[var(--color-text-secondary)]">No</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
            <p className="us-kicker">Instructions</p>
            <h2 className="mt-2 text-2xl font-extrabold">Simple sales flow</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              <p>1. Subscribers sign up normally.</p>
              <p>2. The admin assigns subscribers to the correct sales rep.</p>
              <p>3. Only active paid subscribers count toward commission.</p>
              <p>4. Payouts are tracked here and paid manually outside the app.</p>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
            <p className="us-kicker">Payouts</p>
            <h2 className="mt-2 text-2xl font-extrabold">Paid commission history</h2>
            {paidPayouts.length === 0 ? (
              <p className="mt-5 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
                No paid commission history yet.
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="py-3 pr-4">Amount</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Paid</th>
                      <th className="py-3 pr-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidPayouts.map((payout) => (
                      <tr key={payout.id} className="border-b border-[var(--color-border-muted)]">
                        <td className="py-4 pr-4">{formatMoney(Number(payout.amount || 0))}</td>
                        <td className="py-4 pr-4">{statusBadge(payout.status)}</td>
                        <td className="py-4 pr-4">{formatDate(payout.paid_at)}</td>
                        <td className="py-4 pr-4 text-[var(--color-text-secondary)]">{payout.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)]">
      <p className="text-sm font-bold text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
