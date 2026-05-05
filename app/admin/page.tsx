import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, COMMISSION_PER_ACTIVE_SUBSCRIBER, MONTHLY_SUBSCRIPTION_AMOUNT, isActivePaidSubscription } from "@/lib/sales-commission";
import { requireAdmin } from "@/lib/roles";
import {
  addSalesRepAction,
  assignSubscriberAction,
  markCurrentCommissionPaidAction,
  markPayoutPaidAction,
} from "./actions";

type ProfileRow = {
  id: string;
  email: string | null;
  business_name: string | null;
  owner_name: string | null;
  role: string | null;
  subscription_status: string | null;
  trial_start: string | null;
  trial_end: string | null;
  trial_ends_at: string | null;
  created_at?: string | null;
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
  assigned_by: string | null;
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

function getProfileName(profile?: ProfileRow) {
  return profile?.business_name || profile?.owner_name || profile?.email || "Unnamed user";
}

function statusBadge(status?: string | null) {
  const normalized = status || "inactive";
  const className =
    normalized === "active"
      ? "border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.1)] text-[var(--color-success)]"
      : normalized === "trialing"
      ? "border-[rgba(183,121,31,0.24)] bg-[rgba(183,121,31,0.1)] text-[var(--color-warning)]"
      : "border-[var(--color-border-muted)] bg-[var(--color-section)] text-[var(--color-text-secondary)]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${className}`}>
      {normalized}
    </span>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requireAdmin(supabase, user);

  const [profilesResult, salesRepsResult, assignmentsResult, payoutsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, business_name, owner_name, role, subscription_status, trial_start, trial_end, trial_ends_at")
      .order("email", { ascending: true }),
    supabase
      .from("sales_reps")
      .select("id, user_id, display_name, payment_notes, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("sales_assignments")
      .select("id, sales_rep_id, subscriber_user_id, assigned_by, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("commission_payouts")
      .select("id, sales_rep_id, amount, status, paid_at, notes, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const profiles = ((profilesResult.data ?? []) as ProfileRow[]);
  const salesReps = ((salesRepsResult.data ?? []) as SalesRepRow[]);
  const assignments = ((assignmentsResult.data ?? []) as SalesAssignmentRow[]);
  const payouts = ((payoutsResult.data ?? []) as CommissionPayoutRow[]);
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const assignmentBySubscriberId = new Map(
    assignments
      .filter((assignment) => assignment.subscriber_user_id)
      .map((assignment) => [assignment.subscriber_user_id as string, assignment])
  );
  const salesRepById = new Map(salesReps.map((rep) => [rep.id, rep]));
  const subscribers = profiles.filter((profile) => profile.role !== "admin" && profile.role !== "sales");
  const totalUsers = profiles.length;
  const activePaidSubscribers = subscribers.filter((profile) =>
    isActivePaidSubscription(profile.subscription_status)
  );
  const trialUsers = subscribers.filter((profile) => profile.subscription_status === "trialing");
  const estimatedMrr = activePaidSubscribers.length * MONTHLY_SUBSCRIPTION_AMOUNT;
  const availableRepUsers = profiles.filter((profile) => profile.role !== "admin");

  const repSummaries = salesReps.map((rep) => {
    const repAssignments = assignments.filter((assignment) => assignment.sales_rep_id === rep.id);
    const assignedSubscriberProfiles = repAssignments
      .map((assignment) =>
        assignment.subscriber_user_id ? profileById.get(assignment.subscriber_user_id) : undefined
      )
      .filter((profile): profile is ProfileRow => Boolean(profile));
    const activeAssigned = assignedSubscriberProfiles.filter((profile) =>
      isActivePaidSubscription(profile.subscription_status)
    );
    const repPayouts = payouts.filter((payout) => payout.sales_rep_id === rep.id);
    const unpaidPayouts = repPayouts.filter((payout) => payout.status !== "paid");
    const paidPayouts = repPayouts.filter((payout) => payout.status === "paid");

    return {
      rep,
      profile: rep.user_id ? profileById.get(rep.user_id) : undefined,
      assignedCount: assignedSubscriberProfiles.length,
      activeAssignedCount: activeAssigned.length,
      estimatedOwed: activeAssigned.length * COMMISSION_PER_ACTIVE_SUBSCRIBER,
      unpaidTotal: unpaidPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0),
      paidTotal: paidPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0),
    };
  });

  const errors = [profilesResult.error, salesRepsResult.error, assignmentsResult.error, payoutsResult.error]
    .filter(Boolean)
    .map((error) => error?.message)
    .join(" | ");

  return (
    <main className="us-page">
      <div className="us-shell space-y-8">
        <section className="us-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="us-kicker">Owner Admin</p>
              <h1 className="mt-3 text-4xl font-extrabold text-[var(--color-text)]">Admin Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Manage subscribers, sales reps, manual assignments, and commission payout tracking.
              </p>
              <p className="mt-4 rounded-[1rem] border border-[rgba(183,121,31,0.22)] bg-[rgba(183,121,31,0.1)] px-4 py-3 text-sm font-bold text-[var(--color-warning)]">
                Payouts are tracked here but paid manually outside the app for now.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="us-btn-secondary">Dashboard</Link>
              <Link href="/sales" className="us-btn-secondary">Sales Portal</Link>
              <LogoutButton />
            </div>
          </div>
        </section>

        {errors ? <div className="us-notice-danger text-sm">{errors}</div> : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Users" value={String(totalUsers)} />
          <MetricCard label="Active Paid Subscribers" value={String(activePaidSubscribers.length)} />
          <MetricCard label="Trial Users" value={String(trialUsers.length)} />
          <MetricCard label="Estimated MRR" value={formatMoney(estimatedMrr)} />
        </section>

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="us-kicker">Sales Team</p>
              <h2 className="mt-2 text-2xl font-extrabold">Sales team members</h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Add a user as a sales rep. This sets their profile role to sales.
              </p>
            </div>
            <form action={addSalesRepAction} className="grid w-full gap-3 rounded-[1.2rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 lg:max-w-xl">
              <select name="user_id" className="us-input" defaultValue="">
                <option value="">Choose user</option>
                {availableRepUsers.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.email || profile.id}
                  </option>
                ))}
              </select>
              <input name="display_name" className="us-input" placeholder="Sales rep display name" />
              <input name="payment_notes" className="us-input" placeholder="Payment notes, Venmo, Zelle, etc." />
              <button className="us-btn-primary" type="submit">Add / Update Sales Rep</button>
            </form>
          </div>

          {repSummaries.length === 0 ? (
            <p className="mt-6 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
              No sales reps yet. Add a user above to create the sales portal record.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {repSummaries.map((summary) => (
                <div key={summary.rep.id} className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{summary.rep.display_name || getProfileName(summary.profile)}</h3>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{summary.profile?.email || "No email"}</p>
                      {summary.rep.payment_notes ? (
                        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{summary.rep.payment_notes}</p>
                      ) : null}
                    </div>
                    <form action={markCurrentCommissionPaidAction} className="flex flex-col gap-2 sm:min-w-48">
                      <input type="hidden" name="sales_rep_id" value={summary.rep.id} />
                      <input type="hidden" name="amount" value={summary.estimatedOwed.toFixed(2)} />
                      <input type="hidden" name="notes" value="Current active subscriber commission marked paid." />
                      <button className="us-btn-primary px-3 py-2 text-sm" type="submit" disabled={summary.estimatedOwed <= 0}>
                        Mark Current Paid
                      </button>
                    </form>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MiniStat label="Assigned" value={String(summary.assignedCount)} />
                    <MiniStat label="Active Paid" value={String(summary.activeAssignedCount)} />
                    <MiniStat label="Estimated Owed" value={formatMoney(summary.estimatedOwed)} />
                    <MiniStat label="Paid / Unpaid" value={`${formatMoney(summary.paidTotal)} / ${formatMoney(summary.unpaidTotal)}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
          <p className="us-kicker">Subscribers</p>
          <h2 className="mt-2 text-2xl font-extrabold">All subscribers</h2>
          {subscribers.length === 0 ? (
            <p className="mt-5 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
              No subscribers yet.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                  <tr>
                    <th className="py-3 pr-4">Subscriber</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Assigned Rep</th>
                    <th className="py-3 pr-4">Assign / Change</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => {
                    const assignment = assignmentBySubscriberId.get(subscriber.id);
                    const assignedRep = assignment?.sales_rep_id
                      ? salesRepById.get(assignment.sales_rep_id)
                      : undefined;
                    const assignedProfile = assignedRep?.user_id ? profileById.get(assignedRep.user_id) : undefined;

                    return (
                      <tr key={subscriber.id} className="border-b border-[var(--color-border-muted)] align-top">
                        <td className="py-4 pr-4">
                          <p className="font-bold">{getProfileName(subscriber)}</p>
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{subscriber.email || subscriber.id}</p>
                        </td>
                        <td className="py-4 pr-4">{statusBadge(subscriber.subscription_status)}</td>
                        <td className="py-4 pr-4">
                          {assignedRep ? (
                            <>
                              <p className="font-semibold">{assignedRep.display_name || getProfileName(assignedProfile)}</p>
                              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                                Since {formatDate(assignment?.created_at)}
                              </p>
                            </>
                          ) : (
                            <span className="text-[var(--color-text-secondary)]">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          <form action={assignSubscriberAction} className="flex min-w-64 gap-2">
                            <input type="hidden" name="subscriber_user_id" value={subscriber.id} />
                            <select name="sales_rep_id" className="us-input min-w-44" defaultValue={assignment?.sales_rep_id || ""}>
                              <option value="">Unassigned</option>
                              {salesReps.map((rep) => {
                                const repProfile = rep.user_id ? profileById.get(rep.user_id) : undefined;
                                return (
                                  <option key={rep.id} value={rep.id}>
                                    {rep.display_name || getProfileName(repProfile)}
                                  </option>
                                );
                              })}
                            </select>
                            <button type="submit" className="us-btn-primary px-3 py-2 text-sm">Save</button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
          <p className="us-kicker">Payouts</p>
          <h2 className="mt-2 text-2xl font-extrabold">Payout history</h2>
          {payouts.length === 0 ? (
            <p className="mt-5 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
              No commission payouts recorded yet.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                  <tr>
                    <th className="py-3 pr-4">Sales Rep</th>
                    <th className="py-3 pr-4">Amount</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Created</th>
                    <th className="py-3 pr-4">Paid</th>
                    <th className="py-3 pr-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => {
                    const rep = payout.sales_rep_id ? salesRepById.get(payout.sales_rep_id) : undefined;
                    const repProfile = rep?.user_id ? profileById.get(rep.user_id) : undefined;
                    return (
                      <tr key={payout.id} className="border-b border-[var(--color-border-muted)]">
                        <td className="py-4 pr-4 font-semibold">{rep?.display_name || getProfileName(repProfile)}</td>
                        <td className="py-4 pr-4">{formatMoney(Number(payout.amount || 0))}</td>
                        <td className="py-4 pr-4">{statusBadge(payout.status)}</td>
                        <td className="py-4 pr-4">{formatDate(payout.created_at)}</td>
                        <td className="py-4 pr-4">{formatDate(payout.paid_at)}</td>
                        <td className="py-4 pr-4">
                          {payout.status === "paid" ? (
                            <span className="text-[var(--color-text-secondary)]">Recorded</span>
                          ) : (
                            <form action={markPayoutPaidAction}>
                              <input type="hidden" name="payout_id" value={payout.id} />
                              <button type="submit" className="us-btn-primary px-3 py-2 text-sm">Mark Paid</button>
                            </form>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
    </div>
  );
}
