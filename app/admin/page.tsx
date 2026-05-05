import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, MONTHLY_SUBSCRIPTION_AMOUNT, isActivePaidSubscription } from "@/lib/sales-commission";
import { requireAdmin } from "@/lib/roles";
import AdminDashboardClient, {
  type CommissionPayoutRow,
  type ProfileRow,
  type SalesAssignmentRow,
  type SalesRepRow,
  type TeamApplicationRow,
} from "./admin-dashboard-client";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requireAdmin(supabase, user);

  const [profilesResult, salesRepsResult, assignmentsResult, payoutsResult, applicationsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, display_name, business_name, owner_name, role, subscription_status, trial_start, trial_end, trial_ends_at, created_at")
      .order("email", { ascending: true }),
    supabase
      .from("sales_reps")
      .select("id, user_id, display_name, payment_notes, active, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("sales_assignments")
      .select("id, sales_rep_id, subscriber_user_id, assigned_by, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("commission_payouts")
      .select("id, sales_rep_id, amount, status, paid_at, notes, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("team_applications")
      .select("id, name, email, phone, desired_role, status, notes, created_at, reviewed_at, reviewed_by")
      .order("created_at", { ascending: false }),
  ]);

  const profiles = ((profilesResult.data ?? []) as ProfileRow[]);
  const salesReps = ((salesRepsResult.data ?? []) as SalesRepRow[]);
  const assignments = ((assignmentsResult.data ?? []) as SalesAssignmentRow[]);
  const payouts = ((payoutsResult.data ?? []) as CommissionPayoutRow[]);
  const teamApplications = ((applicationsResult.data ?? []) as TeamApplicationRow[]);
  const subscribers = profiles.filter((profile) => profile.role !== "admin" && profile.role !== "sales");
  const totalUsers = profiles.length;
  const activePaidSubscribers = subscribers.filter((profile) =>
    isActivePaidSubscription(profile.subscription_status)
  );
  const trialUsers = subscribers.filter((profile) => profile.subscription_status === "trialing");
  const estimatedMrr = activePaidSubscribers.length * MONTHLY_SUBSCRIPTION_AMOUNT;

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

        <AdminDashboardClient
          currentUserId={user.id}
          profiles={profiles}
          salesReps={salesReps}
          assignments={assignments}
          payouts={payouts}
          teamApplications={teamApplications}
          teamApplicationsError={applicationsResult.error?.message || null}
        />
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
