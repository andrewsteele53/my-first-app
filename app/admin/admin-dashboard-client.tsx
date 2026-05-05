"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveTeamApplicationAsSalesAction,
  assignSubscriberAction,
  createManualPayoutAction,
  createTeamApplicationAction,
  deleteTeamApplicationAction,
  makeSalesRepAction,
  markPayoutPaidAction,
  rejectTeamApplicationAction,
  removeSalesRepAction,
  setUserRoleAction,
  syncMissingProfilesAction,
  updateTeamApplicationAction,
  updateSalesRepAction,
  updateUserAction,
  type AdminActionResult,
} from "./actions";
import {
  COMMISSION_PER_ACTIVE_SUBSCRIBER,
  formatMoney,
  isActivePaidSubscription,
} from "@/lib/sales-commission";

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  business_name: string | null;
  owner_name: string | null;
  role: string | null;
  subscription_status: string | null;
  trial_start: string | null;
  trial_end: string | null;
  trial_ends_at: string | null;
  created_at?: string | null;
};

export type SalesRepRow = {
  id: string;
  user_id: string | null;
  display_name: string | null;
  payment_notes: string | null;
  active: boolean | null;
  created_at: string | null;
};

export type SalesAssignmentRow = {
  id: string;
  sales_rep_id: string | null;
  subscriber_user_id: string | null;
  assigned_by: string | null;
  created_at: string | null;
};

export type CommissionPayoutRow = {
  id: string;
  sales_rep_id: string | null;
  amount: number | string;
  status: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string | null;
};

export type TeamApplicationRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  desired_role: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

type EditUserState = {
  profile: ProfileRow;
  displayName: string;
  role: string;
  paymentNotes: string;
};

type EditRepState = {
  rep: SalesRepRow;
  displayName: string;
  paymentNotes: string;
};

type EditApplicationState = {
  application?: TeamApplicationRow;
  name: string;
  email: string;
  phone: string;
  desiredRole: string;
  status: string;
  notes: string;
};

type ConfirmState =
  | {
      title: string;
      message: string;
      confirmLabel: string;
      danger?: boolean;
      onConfirm: () => void;
    }
  | null;

type Props = {
  currentUserId: string;
  profiles: ProfileRow[];
  salesReps: SalesRepRow[];
  assignments: SalesAssignmentRow[];
  payouts: CommissionPayoutRow[];
  teamApplications: TeamApplicationRow[];
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

function getProfileName(profile?: ProfileRow | null) {
  return (
    profile?.display_name ||
    profile?.business_name ||
    profile?.owner_name ||
    profile?.email ||
    "Unnamed user"
  );
}

function statusBadge(status?: string | null) {
  const normalized = status || "inactive";
  const className =
    normalized === "active" || normalized === "paid"
      ? "border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.1)] text-[var(--color-success)]"
      : normalized === "trialing" || normalized === "unpaid"
      ? "border-[rgba(183,121,31,0.24)] bg-[rgba(183,121,31,0.1)] text-[var(--color-warning)]"
      : "border-[var(--color-border-muted)] bg-[var(--color-section)] text-[var(--color-text-secondary)]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${className}`}>
      {normalized}
    </span>
  );
}

function formData(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

export default function AdminDashboardClient({
  currentUserId,
  profiles,
  salesReps,
  assignments,
  payouts,
  teamApplications,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<AdminActionResult | null>(null);
  const [editUser, setEditUser] = useState<EditUserState | null>(null);
  const [editRep, setEditRep] = useState<EditRepState | null>(null);
  const [editApplication, setEditApplication] = useState<EditApplicationState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [payoutRepId, setPayoutRepId] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");

  const activeSalesReps = salesReps.filter((rep) => rep.active !== false);
  const profileById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles]);
  const salesRepById = useMemo(() => new Map(salesReps.map((rep) => [rep.id, rep])), [salesReps]);
  const salesRepByUserId = useMemo(
    () => new Map(activeSalesReps.filter((rep) => rep.user_id).map((rep) => [rep.user_id as string, rep])),
    [activeSalesReps]
  );
  const assignmentBySubscriberId = useMemo(
    () =>
      new Map(
        assignments
          .filter((assignment) => assignment.subscriber_user_id)
          .map((assignment) => [assignment.subscriber_user_id as string, assignment])
      ),
    [assignments]
  );
  const subscribers = profiles.filter((profile) => profile.role !== "admin" && profile.role !== "sales");
  const repSummaries = activeSalesReps.map((rep) => {
    const repAssignments = assignments.filter((assignment) => assignment.sales_rep_id === rep.id);
    const assignedProfiles = repAssignments
      .map((assignment) => (assignment.subscriber_user_id ? profileById.get(assignment.subscriber_user_id) : undefined))
      .filter((profile): profile is ProfileRow => Boolean(profile));
    const activeAssigned = assignedProfiles.filter((profile) => isActivePaidSubscription(profile.subscription_status));
    const repPayouts = payouts.filter((payout) => payout.sales_rep_id === rep.id);
    const unpaidPayouts = repPayouts.filter((payout) => payout.status !== "paid");
    const paidPayouts = repPayouts.filter((payout) => payout.status === "paid");

    return {
      rep,
      profile: rep.user_id ? profileById.get(rep.user_id) : undefined,
      assignedCount: assignedProfiles.length,
      activeAssignedCount: activeAssigned.length,
      estimatedOwed: activeAssigned.length * COMMISSION_PER_ACTIVE_SUBSCRIBER,
      unpaidTotal: unpaidPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0),
      paidTotal: paidPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0),
    };
  });

  function runAction(action: () => Promise<AdminActionResult | void>, actionId?: string) {
    startTransition(async () => {
      setMessage(null);
      setPendingActionId(actionId || null);
      try {
        const result = await action();
        setMessage(result || { ok: true, message: "Saved." });
        router.refresh();
      } catch (error) {
        setMessage({
          ok: false,
          message: error instanceof Error ? error.message : "Something went wrong.",
        });
      } finally {
        setPendingActionId(null);
      }
    });
  }

  function changeRole(profile: ProfileRow, role: "admin" | "sales" | "subscriber") {
    const data = formData({
      user_id: profile.id,
      role,
      display_name: getProfileName(profile),
      confirm_self_demote: profile.id === currentUserId && role !== "admin" ? "yes" : "",
    });

    runAction(() => setUserRoleAction(data), `${role}-${profile.id}`);
  }

  function openUserEditor(profile: ProfileRow) {
    const existingRep = salesRepByUserId.get(profile.id);
    setEditUser({
      profile,
      displayName: profile.display_name || "",
      role: profile.role || "subscriber",
      paymentNotes: existingRep?.payment_notes || "",
    });
  }

  function submitEditedUser() {
    if (!editUser) return;
    runAction(() =>
      updateUserAction(
        formData({
          user_id: editUser.profile.id,
          display_name: editUser.displayName,
          role: editUser.role,
          payment_notes: editUser.paymentNotes,
          confirm_self_demote: editUser.profile.id === currentUserId && editUser.role !== "admin" ? "yes" : "",
        })
      )
    , `edit-user-${editUser.profile.id}`);
    setEditUser(null);
  }

  function submitEditedRep() {
    if (!editRep) return;
    runAction(() =>
      updateSalesRepAction(
        formData({
          sales_rep_id: editRep.rep.id,
          display_name: editRep.displayName,
          payment_notes: editRep.paymentNotes,
        })
      )
    , `edit-rep-${editRep.rep.id}`);
    setEditRep(null);
  }

  function submitManualPayout() {
    runAction(() =>
      createManualPayoutAction(
        formData({
          sales_rep_id: payoutRepId,
          amount: payoutAmount,
          notes: payoutNotes,
        })
      )
    , "create-payout");
    setPayoutAmount("");
    setPayoutNotes("");
  }

  function openNewApplication() {
    setEditApplication({
      name: "",
      email: "",
      phone: "",
      desiredRole: "sales",
      status: "pending",
      notes: "",
    });
  }

  function openApplicationEditor(application: TeamApplicationRow) {
    setEditApplication({
      application,
      name: application.name || "",
      email: application.email || "",
      phone: application.phone || "",
      desiredRole: application.desired_role || "sales",
      status: application.status || "pending",
      notes: application.notes || "",
    });
  }

  function submitApplication() {
    if (!editApplication) return;

    const data = formData({
      name: editApplication.name,
      email: editApplication.email,
      phone: editApplication.phone,
      desired_role: editApplication.desiredRole,
      status: editApplication.status,
      notes: editApplication.notes,
    });

    if (editApplication.application) {
      const applicationId = editApplication.application.id;
      data.set("application_id", applicationId);
      runAction(() => updateTeamApplicationAction(data), `edit-application-${applicationId}`);
    } else {
      runAction(() => createTeamApplicationAction(data), "create-application");
    }

    setEditApplication(null);
  }

  return (
    <>
      {message ? (
        <div className={message.ok ? "us-notice-info text-sm" : "us-notice-danger text-sm"}>
          {message.message}
        </div>
      ) : null}

      <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
        <p className="us-kicker">Users</p>
        <h2 className="mt-2 text-2xl font-extrabold">Admin users</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Manage profile roles and turn app users into sales reps.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="us-btn-primary px-4 py-2 text-sm"
            disabled={isPending}
            onClick={() => runAction(syncMissingProfilesAction, "sync-users")}
          >
            {pendingActionId === "sync-users" ? "Syncing..." : "Sync Missing Users"}
          </button>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1020px] text-left text-sm">
            <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
              <tr>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Display Name</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Subscription</th>
                <th className="py-3 pr-4">Created</th>
                <th className="py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => {
                const isCurrentUser = profile.id === currentUserId;
                const existingSalesRep = salesRepByUserId.get(profile.id);
                const isSalesRep = Boolean(existingSalesRep);
                const makeSalesRepId = `make-sales-${profile.id}`;
                const makeAdmin = () =>
                  setConfirm({
                    title: "Make Admin",
                    message: `Give ${profile.email || getProfileName(profile)} owner admin access? Admins can manage users, roles, sales reps, and payouts.`,
                    confirmLabel: "Make Admin",
                    onConfirm: () => changeRole(profile, "admin"),
                  });
                const makeSubscriber = () =>
                  isCurrentUser
                    ? setConfirm({
                        title: "Change Your Own Role",
                        message: "This will remove your own admin access and may lock you out of /admin.",
                        confirmLabel: "Make Subscriber",
                        danger: true,
                        onConfirm: () => changeRole(profile, "subscriber"),
                      })
                    : changeRole(profile, "subscriber");

                return (
                  <tr key={profile.id} className="border-b border-[var(--color-border-muted)] align-top">
                    <td className="py-4 pr-4 break-all font-semibold">{profile.email || profile.id}</td>
                    <td className="py-4 pr-4">{profile.display_name || "-"}</td>
                    <td className="py-4 pr-4">{statusBadge(profile.role || "subscriber")}</td>
                    <td className="py-4 pr-4">{statusBadge(profile.subscription_status)}</td>
                    <td className="py-4 pr-4">{formatDate(profile.created_at)}</td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="us-btn-secondary px-3 py-2 text-xs" onClick={() => openUserEditor(profile)}>
                          Edit User
                        </button>
                        <button
                          type="button"
                          className="us-btn-primary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isPending || isSalesRep || profile.role === "admin"}
                          onClick={() => runAction(() => makeSalesRepAction(profile.id), makeSalesRepId)}
                        >
                          {pendingActionId === makeSalesRepId ? "Making..." : isSalesRep ? "Sales Rep" : profile.role === "sales" ? "Update Sales Rep" : "Make Sales Rep"}
                        </button>
                        <button
                          type="button"
                          className="us-btn-secondary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isPending || profile.role === "subscriber"}
                          onClick={makeSubscriber}
                        >
                          Make Subscriber
                        </button>
                        <button
                          type="button"
                          className="us-btn-secondary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isPending || profile.role === "admin"}
                          onClick={makeAdmin}
                        >
                          Make Admin
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="us-kicker">Team Applications</p>
            <h2 className="mt-2 text-2xl font-extrabold">Pending Team Members</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Track potential Unified Steele employees and sales team members before approval.
            </p>
          </div>
          <button type="button" className="us-btn-primary px-4 py-2 text-sm" onClick={openNewApplication}>
            Add Pending Team Member
          </button>
        </div>

        {teamApplications.length === 0 ? (
          <p className="mt-6 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
            No pending team members yet.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                <tr>
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Phone</th>
                  <th className="py-3 pr-4">Desired Role</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Notes</th>
                  <th className="py-3 pr-4">Applied</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamApplications.map((application) => {
                  const approveId = `approve-application-${application.id}`;
                  const rejectId = `reject-application-${application.id}`;
                  const deleteId = `delete-application-${application.id}`;

                  return (
                    <tr key={application.id} className="border-b border-[var(--color-border-muted)] align-top">
                      <td className="py-4 pr-4 font-semibold">{application.name || "-"}</td>
                      <td className="py-4 pr-4 break-all">{application.email}</td>
                      <td className="py-4 pr-4">{application.phone || "-"}</td>
                      <td className="py-4 pr-4 capitalize">{application.desired_role || "sales"}</td>
                      <td className="py-4 pr-4">{statusBadge(application.status || "pending")}</td>
                      <td className="max-w-72 py-4 pr-4 text-[var(--color-text-secondary)]">{application.notes || "-"}</td>
                      <td className="py-4 pr-4">{formatDate(application.created_at)}</td>
                      <td className="py-4 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="us-btn-secondary px-3 py-2 text-xs" onClick={() => openApplicationEditor(application)}>
                            Edit Application
                          </button>
                          <button
                            type="button"
                            className="us-btn-primary px-3 py-2 text-xs"
                            disabled={isPending || application.status === "approved"}
                            onClick={() =>
                              runAction(
                                () => approveTeamApplicationAsSalesAction(formData({ application_id: application.id })),
                                approveId
                              )
                            }
                          >
                            {pendingActionId === approveId ? "Approving..." : "Approve as Sales Rep"}
                          </button>
                          <button
                            type="button"
                            className="us-btn-secondary px-3 py-2 text-xs"
                            disabled={isPending || application.status === "rejected"}
                            onClick={() =>
                              runAction(
                                () => rejectTeamApplicationAction(formData({ application_id: application.id })),
                                rejectId
                              )
                            }
                          >
                            {pendingActionId === rejectId ? "Rejecting..." : "Reject"}
                          </button>
                          <button
                            type="button"
                            className="us-btn-danger px-3 py-2 text-xs"
                            onClick={() =>
                              setConfirm({
                                title: "Delete Application",
                                message: `Delete the team application for ${application.email}? This cannot be undone.`,
                                confirmLabel: "Delete Application",
                                danger: true,
                                onConfirm: () =>
                                  runAction(
                                    () => deleteTeamApplicationAction(formData({ application_id: application.id })),
                                    deleteId
                                  ),
                              })
                            }
                          >
                            {pendingActionId === deleteId ? "Deleting..." : "Delete"}
                          </button>
                        </div>
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
        <p className="us-kicker">Sales Reps</p>
        <h2 className="mt-2 text-2xl font-extrabold">Sales team members</h2>
        {repSummaries.length === 0 ? (
          <p className="mt-6 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
            No active sales reps yet. Use Make Sales Rep from the users table above.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {repSummaries.map((summary) => (
              <div key={summary.rep.id} className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{summary.rep.display_name || getProfileName(summary.profile)}</h3>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{summary.profile?.email || "No email"}</p>
                    {summary.rep.payment_notes ? (
                      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{summary.rep.payment_notes}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="us-btn-secondary px-3 py-2 text-xs"
                      onClick={() =>
                        setEditRep({
                          rep: summary.rep,
                          displayName: summary.rep.display_name || "",
                          paymentNotes: summary.rep.payment_notes || "",
                        })
                      }
                    >
                      Edit Sales Rep
                    </button>
                    <button
                      type="button"
                      className="us-btn-danger px-3 py-2 text-xs"
                      onClick={() =>
                        setConfirm({
                          title: "Remove Sales Rep",
                          message: `Remove ${summary.rep.display_name || getProfileName(summary.profile)} from the sales team? Assignments will be cleared and payout history will stay visible.`,
                          confirmLabel: "Remove Sales Rep",
                          danger: true,
                          onConfirm: () => runAction(() => removeSalesRepAction(formData({ sales_rep_id: summary.rep.id })), `remove-rep-${summary.rep.id}`),
                        })
                      }
                    >
                      Remove Sales Rep
                    </button>
                  </div>
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
                  const assignedRep = assignment?.sales_rep_id ? salesRepById.get(assignment.sales_rep_id) : undefined;
                  const assignedProfile = assignedRep?.user_id ? profileById.get(assignedRep.user_id) : undefined;
                  const selectId = `assignment-${subscriber.id}`;

                  return (
                    <tr key={subscriber.id} className="border-b border-[var(--color-border-muted)] align-top">
                      <td className="py-4 pr-4">
                        <p className="font-bold">{getProfileName(subscriber)}</p>
                        <p className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">{subscriber.email || subscriber.id}</p>
                      </td>
                      <td className="py-4 pr-4">{statusBadge(subscriber.subscription_status)}</td>
                      <td className="py-4 pr-4">
                        {assignedRep ? (
                          <>
                            <p className="font-semibold">{assignedRep.display_name || getProfileName(assignedProfile)}</p>
                            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Since {formatDate(assignment?.created_at)}</p>
                          </>
                        ) : (
                          <span className="text-[var(--color-text-secondary)]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex min-w-72 flex-wrap gap-2">
                          <select id={selectId} className="us-input min-w-44" defaultValue={assignment?.sales_rep_id || ""}>
                            <option value="">Unassigned</option>
                            {activeSalesReps.map((rep) => {
                              const repProfile = rep.user_id ? profileById.get(rep.user_id) : undefined;
                              return (
                                <option key={rep.id} value={rep.id}>
                                  {rep.display_name || getProfileName(repProfile)}
                                </option>
                              );
                            })}
                          </select>
                          <button
                            type="button"
                            className="us-btn-primary px-3 py-2 text-sm"
                            onClick={() => {
                              const select = document.getElementById(selectId) as HTMLSelectElement | null;
                              runAction(() =>
                                assignSubscriberAction(
                                  formData({
                                    subscriber_user_id: subscriber.id,
                                    sales_rep_id: select?.value || "",
                                  })
                                ),
                                `assign-${subscriber.id}`
                              );
                            }}
                          >
                            {assignment ? "Change" : "Assign"}
                          </button>
                          <button
                            type="button"
                            className="us-btn-secondary px-3 py-2 text-sm"
                            disabled={!assignment}
                            onClick={() =>
                              runAction(() =>
                                assignSubscriberAction(
                                  formData({
                                    subscriber_user_id: subscriber.id,
                                    sales_rep_id: "",
                                  })
                                ),
                                `unassign-${subscriber.id}`
                              )
                            }
                          >
                            Unassign
                          </button>
                        </div>
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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="us-kicker">Payouts</p>
            <h2 className="mt-2 text-2xl font-extrabold">Payout history</h2>
          </div>
          <div className="grid gap-2 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 sm:grid-cols-[1fr_8rem_1fr_auto]">
            <select className="us-input" value={payoutRepId} onChange={(event) => setPayoutRepId(event.target.value)}>
              <option value="">Sales rep</option>
              {activeSalesReps.map((rep) => {
                const profile = rep.user_id ? profileById.get(rep.user_id) : undefined;
                return (
                  <option key={rep.id} value={rep.id}>
                    {rep.display_name || getProfileName(profile)}
                  </option>
                );
              })}
            </select>
            <input className="us-input" type="number" min="0" step="0.01" placeholder="Amount" value={payoutAmount} onChange={(event) => setPayoutAmount(event.target.value)} />
            <input className="us-input" placeholder="Notes" value={payoutNotes} onChange={(event) => setPayoutNotes(event.target.value)} />
            <button type="button" className="us-btn-primary whitespace-nowrap px-3 py-2 text-sm" disabled={isPending} onClick={submitManualPayout}>
              {pendingActionId === "create-payout" ? "Creating..." : "Create Manual Payout"}
            </button>
          </div>
        </div>
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
                          <button
                            type="button"
                            className="us-btn-primary px-3 py-2 text-sm"
                            onClick={() => runAction(() => markPayoutPaidAction(formData({ payout_id: payout.id })), `paid-${payout.id}`)}
                          >
                            {pendingActionId === `paid-${payout.id}` ? "Marking..." : "Mark Paid"}
                          </button>
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

      {editApplication ? (
        <Modal
          title={editApplication.application ? "Edit Application" : "Add Pending Team Member"}
          onCancel={() => setEditApplication(null)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Name
              <input className="us-input" value={editApplication.name} onChange={(event) => setEditApplication({ ...editApplication, name: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Email
              <input className="us-input" type="email" value={editApplication.email} onChange={(event) => setEditApplication({ ...editApplication, email: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Phone
              <input className="us-input" value={editApplication.phone} onChange={(event) => setEditApplication({ ...editApplication, phone: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Desired role
              <input className="us-input" value={editApplication.desiredRole} onChange={(event) => setEditApplication({ ...editApplication, desiredRole: event.target.value })} />
            </label>
          </div>
          {editApplication.application ? (
            <label className="mt-4 grid gap-2 text-sm font-bold">
              Status
              <select className="us-input" value={editApplication.status} onChange={(event) => setEditApplication({ ...editApplication, status: event.target.value })}>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </label>
          ) : null}
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Notes
            <textarea className="us-input min-h-24" value={editApplication.notes} onChange={(event) => setEditApplication({ ...editApplication, notes: event.target.value })} />
          </label>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="us-btn-secondary px-4 py-2" onClick={() => setEditApplication(null)}>
              Cancel
            </button>
            <button type="button" className="us-btn-primary px-4 py-2" disabled={isPending} onClick={submitApplication}>
              {pendingActionId === "create-application" ? "Saving..." : "Save"}
            </button>
          </div>
        </Modal>
      ) : null}

      {editUser ? (
        <Modal title="Edit User" onCancel={() => setEditUser(null)}>
          <label className="grid gap-2 text-sm font-bold">
            Display name
            <input className="us-input" value={editUser.displayName} onChange={(event) => setEditUser({ ...editUser, displayName: event.target.value })} />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Role
            <select className="us-input" value={editUser.role} onChange={(event) => setEditUser({ ...editUser, role: event.target.value })}>
              <option value="subscriber">subscriber</option>
              <option value="sales">sales</option>
              <option value="admin">admin</option>
            </select>
          </label>
          {editUser.role === "sales" ? (
            <label className="mt-4 grid gap-2 text-sm font-bold">
              Payment notes
              <textarea className="us-input min-h-24" value={editUser.paymentNotes} onChange={(event) => setEditUser({ ...editUser, paymentNotes: event.target.value })} />
            </label>
          ) : null}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="us-btn-secondary px-4 py-2" onClick={() => setEditUser(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="us-btn-primary px-4 py-2"
              onClick={() => {
                if (editUser.role === "admin" && editUser.profile.role !== "admin") {
                  setConfirm({
                    title: "Make Admin",
                    message: `Give ${editUser.profile.email || getProfileName(editUser.profile)} owner admin access?`,
                    confirmLabel: "Make Admin",
                    onConfirm: submitEditedUser,
                  });
                } else if (editUser.profile.id === currentUserId && editUser.role !== "admin") {
                  setConfirm({
                    title: "Change Your Own Role",
                    message: "This will remove your own admin access and may lock you out of /admin.",
                    confirmLabel: "Save Role Change",
                    danger: true,
                    onConfirm: submitEditedUser,
                  });
                } else {
                  submitEditedUser();
                }
              }}
            >
              Save
            </button>
          </div>
        </Modal>
      ) : null}

      {editRep ? (
        <Modal title="Edit Sales Rep" onCancel={() => setEditRep(null)}>
          <label className="grid gap-2 text-sm font-bold">
            Display name
            <input className="us-input" value={editRep.displayName} onChange={(event) => setEditRep({ ...editRep, displayName: event.target.value })} />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Payment notes
            <textarea className="us-input min-h-24" value={editRep.paymentNotes} onChange={(event) => setEditRep({ ...editRep, paymentNotes: event.target.value })} />
          </label>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="us-btn-secondary px-4 py-2" onClick={() => setEditRep(null)}>
              Cancel
            </button>
            <button type="button" className="us-btn-primary px-4 py-2" onClick={submitEditedRep}>
              Save
            </button>
          </div>
        </Modal>
      ) : null}

      {confirm ? (
        <Modal title={confirm.title} onCancel={() => setConfirm(null)}>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{confirm.message}</p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="us-btn-secondary px-4 py-2" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={confirm.danger ? "us-btn-danger px-4 py-2" : "us-btn-primary px-4 py-2"}
              onClick={() => {
                confirm.onConfirm();
                setConfirm(null);
              }}
            >
              {confirm.confirmLabel}
            </button>
          </div>
        </Modal>
      ) : null}

      {isPending ? (
        <div className="fixed bottom-4 right-4 z-40 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold shadow-[var(--shadow-card-soft)]">
          Saving...
        </div>
      ) : null}
    </>
  );
}

function Modal({
  title,
  children,
  onCancel,
}: {
  title: string;
  children: ReactNode;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-lg rounded-[1.5rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-extrabold text-[var(--color-text)]">{title}</h2>
          <button type="button" className="us-btn-secondary px-3 py-1 text-sm" onClick={onCancel}>
            Close
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
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
