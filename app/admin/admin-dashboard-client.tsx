"use client";

import type { ReactNode } from "react";
import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveJobApplicationAsPendingTeamMemberAction,
  approveJobApplicationAsSalesRepAction,
  approveTeamApplicationAsSalesAction,
  assignSubscriberAction,
  createManualPayoutAction,
  createJobListingAction,
  createTeamApplicationAction,
  deleteJobListingAction,
  deleteTeamApplicationAction,
  getResumeDownloadUrlAction,
  makeSalesRepAction,
  markTeamInviteSentAction,
  markPayoutPaidAction,
  rejectTeamApplicationAction,
  removeSalesRepAction,
  setUserRoleAction,
  setJobListingStatusAction,
  syncMissingProfilesAction,
  updateJobApplicationAction,
  updateJobListingAction,
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

const TEAM_SIGNUP_LINK = "https://unifiedsteele.app/team-signup";

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

export type JobListingRow = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  compensation: string | null;
  description: string | null;
  requirements: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
};

export type JobApplicationRow = {
  id: string;
  job_listing_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  experience_summary: string | null;
  why_interested: string | null;
  availability: string | null;
  preferred_contact_method: string | null;
  resume_link: string | null;
  resume_file_path: string | null;
  notes: string | null;
  status: string | null;
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

type EditJobListingState = {
  job?: JobListingRow;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  compensation: string;
  description: string;
  requirements: string;
  status: string;
};

type EditJobApplicationState = {
  application: JobApplicationRow;
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
  teamApplicationsError: string | null;
  jobListings: JobListingRow[];
  jobListingsError: string | null;
  jobApplications: JobApplicationRow[];
  jobApplicationsError: string | null;
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
  const label = normalized.replace(/_/g, " ");
  const className =
    normalized === "active" || normalized === "paid"
      ? "border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.1)] text-[var(--color-success)]"
      : normalized === "trialing" || normalized === "unpaid" || normalized === "invite_sent" || normalized === "approved"
      ? "border-[rgba(183,121,31,0.24)] bg-[rgba(183,121,31,0.1)] text-[var(--color-warning)]"
      : "border-[var(--color-border-muted)] bg-[var(--color-section)] text-[var(--color-text-secondary)]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${className}`}>
      {label}
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
  teamApplicationsError,
  jobListings,
  jobListingsError,
  jobApplications,
  jobApplicationsError,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<AdminActionResult | null>(null);
  const [editUser, setEditUser] = useState<EditUserState | null>(null);
  const [editRep, setEditRep] = useState<EditRepState | null>(null);
  const [editApplication, setEditApplication] = useState<EditApplicationState | null>(null);
  const [editJobListing, setEditJobListing] = useState<EditJobListingState | null>(null);
  const [editJobApplication, setEditJobApplication] = useState<EditJobApplicationState | null>(null);
  const [jobApplicationStatusFilter, setJobApplicationStatusFilter] = useState("all");
  const [jobApplicationJobFilter, setJobApplicationJobFilter] = useState("all");
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
  const profileByEmail = useMemo(
    () =>
      new Map(
        profiles
          .filter((profile) => profile.email)
          .map((profile) => [(profile.email as string).trim().toLowerCase(), profile])
      ),
    [profiles]
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
  const jobListingById = useMemo(
    () => new Map(jobListings.map((job) => [job.id, job])),
    [jobListings]
  );
  const filteredJobApplications = jobApplications.filter((application) => {
    const statusMatches =
      jobApplicationStatusFilter === "all" || application.status === jobApplicationStatusFilter;
    const jobMatches =
      jobApplicationJobFilter === "all" || application.job_listing_id === jobApplicationJobFilter;
    return statusMatches && jobMatches;
  });

  function runAction(
    action: () => Promise<AdminActionResult | void>,
    actionId?: string,
    onSuccess?: () => void
  ) {
    startTransition(async () => {
      setMessage(null);
      setPendingActionId(actionId || null);
      try {
        const result = await action();
        const actionResult = result || { ok: true, message: "Saved." };
        setMessage(actionResult);
        if (actionResult.ok) {
          onSuccess?.();
          router.refresh();
        }
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

  function viewResume(path: string) {
    startTransition(async () => {
      setMessage(null);
      setPendingActionId(`resume-${path}`);
      try {
        const result = await getResumeDownloadUrlAction(path);
        setMessage(result);
        if (result.ok && result.url) {
          window.open(result.url, "_blank", "noopener,noreferrer");
        }
      } catch (error) {
        setMessage({
          ok: false,
          message: error instanceof Error ? error.message : "Unable to open resume.",
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

  function getTeamApplicationStatus(application: TeamApplicationRow) {
    const rawStatus = application.status || "pending";
    const profile = profileByEmail.get(application.email.trim().toLowerCase());
    const salesRep = profile ? salesRepByUserId.get(profile.id) : undefined;

    if (salesRep && salesRep.active !== false) {
      return "active";
    }

    return rawStatus;
  }

  function getTeamInviteMessage(application: TeamApplicationRow) {
    const name = application.name?.trim() || "there";
    return `Hi ${name}, your Unified Steele sales team application has been approved. Please create your team account using this same email address: ${application.email}.\n\nSign up here:\n${TEAM_SIGNUP_LINK}\n\nOnce your account is created, I’ll activate your sales portal.`;
  }

  function copyText(text: string, successMessage: string) {
    startTransition(async () => {
      try {
        await navigator.clipboard.writeText(text);
        setMessage({ ok: true, message: successMessage });
      } catch {
        setMessage({ ok: false, message: "Unable to copy. Select the text and copy it manually." });
      }
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
      runAction(
        () => updateTeamApplicationAction(data),
        `edit-application-${applicationId}`,
        () => setEditApplication(null)
      );
    } else {
      runAction(
        () => createTeamApplicationAction(data),
        "create-application",
        () => setEditApplication(null)
      );
    }
  }

  function openNewJobListing() {
    setEditJobListing({
      title: "",
      department: "",
      location: "",
      employmentType: "",
      compensation: "",
      description: "",
      requirements: "",
      status: "draft",
    });
  }

  function openJobListingEditor(job: JobListingRow) {
    setEditJobListing({
      job,
      title: job.title || "",
      department: job.department || "",
      location: job.location || "",
      employmentType: job.employment_type || "",
      compensation: job.compensation || "",
      description: job.description || "",
      requirements: job.requirements || "",
      status: job.status || "draft",
    });
  }

  function submitJobListing() {
    if (!editJobListing) return;

    const data = formData({
      title: editJobListing.title,
      department: editJobListing.department,
      location: editJobListing.location,
      employment_type: editJobListing.employmentType,
      compensation: editJobListing.compensation,
      description: editJobListing.description,
      requirements: editJobListing.requirements,
      status: editJobListing.status,
    });

    if (editJobListing.job) {
      const jobId = editJobListing.job.id;
      data.set("job_id", jobId);
      runAction(() => updateJobListingAction(data), `edit-job-${jobId}`, () => setEditJobListing(null));
    } else {
      runAction(() => createJobListingAction(data), "create-job", () => setEditJobListing(null));
    }
  }

  function openJobApplication(application: JobApplicationRow) {
    setEditJobApplication({
      application,
      status: application.status || "new",
      notes: application.notes || "",
    });
  }

  function submitJobApplicationReview() {
    if (!editJobApplication) return;
    runAction(
      () =>
        updateJobApplicationAction(
          formData({
            application_id: editJobApplication.application.id,
            status: editJobApplication.status,
            notes: editJobApplication.notes,
          })
        ),
      `review-job-application-${editJobApplication.application.id}`,
      () => setEditJobApplication(null)
    );
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

        {teamApplicationsError ? (
          <p className="mt-6 rounded-[1rem] border border-[rgba(176,59,59,0.22)] bg-[rgba(176,59,59,0.08)] p-4 text-sm font-semibold text-[var(--color-danger)]">
            Pending team members could not load: {teamApplicationsError}
          </p>
        ) : teamApplications.length === 0 ? (
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
                  const inviteSentId = `invite-sent-${application.id}`;
                  const teamStatus = getTeamApplicationStatus(application);
                  const isActiveApplication = teamStatus === "active";
                  const hasMatchingProfile = Boolean(profileByEmail.get(application.email.trim().toLowerCase()));
                  const showManualInvite =
                    !hasMatchingProfile &&
                    (application.status === "approved" || application.status === "invite_sent");
                  const inviteMessage = getTeamInviteMessage(application);

                  return (
                    <Fragment key={application.id}>
                      <tr className="border-b border-[var(--color-border-muted)] align-top">
                        <td className="py-4 pr-4 font-semibold">{application.name || "-"}</td>
                        <td className="py-4 pr-4 break-all">{application.email}</td>
                        <td className="py-4 pr-4">{application.phone || "-"}</td>
                        <td className="py-4 pr-4 capitalize">{application.desired_role || "sales"}</td>
                        <td className="py-4 pr-4">{statusBadge(teamStatus)}</td>
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
                              disabled={isPending || isActiveApplication}
                              onClick={() =>
                                runAction(
                                  () => approveTeamApplicationAsSalesAction(formData({ application_id: application.id })),
                                  approveId
                                )
                              }
                            >
                              {pendingActionId === approveId
                                ? "Approving..."
                                : isActiveApplication
                                ? "Active"
                                : application.status === "approved" || application.status === "invite_sent"
                                ? "Check / Activate"
                                : "Approve as Sales Rep"}
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
                      {showManualInvite ? (
                        <tr className="border-b border-[var(--color-border-muted)]">
                          <td colSpan={8} className="py-4">
                            <div className="rounded-[1.1rem] border border-[rgba(183,121,31,0.24)] bg-[rgba(183,121,31,0.08)] p-4">
                              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                                <div className="space-y-3 text-sm">
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Manual invite</p>
                                    <p className="mt-1 font-bold">{application.email}</p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Signup link</p>
                                    <p className="mt-1 break-all rounded-[0.8rem] border border-[var(--color-border-muted)] bg-white px-3 py-2 text-[var(--color-text-secondary)]">
                                      {TEAM_SIGNUP_LINK}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-bold">Invite message</p>
                                    <p className="mt-1 whitespace-pre-wrap rounded-[0.8rem] border border-[var(--color-border-muted)] bg-white px-3 py-2 text-[var(--color-text-secondary)]">
                                      {inviteMessage}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 lg:justify-end">
                                  <button type="button" className="us-btn-secondary px-3 py-2 text-xs" onClick={() => copyText(TEAM_SIGNUP_LINK, "Signup link copied.")}>
                                    Copy Signup Link
                                  </button>
                                  <button type="button" className="us-btn-secondary px-3 py-2 text-xs" onClick={() => copyText(inviteMessage, "Invite message copied.")}>
                                    Copy Invite Message
                                  </button>
                                  <button
                                    type="button"
                                    className="us-btn-primary px-3 py-2 text-xs"
                                    disabled={isPending || application.status === "invite_sent"}
                                    onClick={() =>
                                      runAction(
                                        () => markTeamInviteSentAction(formData({ application_id: application.id })),
                                        inviteSentId
                                      )
                                    }
                                  >
                                    {pendingActionId === inviteSentId
                                      ? "Marking..."
                                      : application.status === "invite_sent"
                                      ? "Invite Sent"
                                      : "Mark as Invite Sent"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="us-kicker">Careers</p>
            <h2 className="mt-2 text-2xl font-extrabold">Job Listings</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Create, publish, close, and manage public careers listings.
            </p>
          </div>
          <button type="button" className="us-btn-primary px-4 py-2 text-sm" onClick={openNewJobListing}>
            Create Job Listing
          </button>
        </div>

        {jobListingsError ? (
          <p className="mt-6 rounded-[1rem] border border-[rgba(176,59,59,0.22)] bg-[rgba(176,59,59,0.08)] p-4 text-sm font-semibold text-[var(--color-danger)]">
            Job listings could not load: {jobListingsError}
          </p>
        ) : jobListings.length === 0 ? (
          <p className="mt-6 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
            No job listings yet.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                <tr>
                  <th className="py-3 pr-4">Title</th>
                  <th className="py-3 pr-4">Department</th>
                  <th className="py-3 pr-4">Location</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Compensation</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Updated</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobListings.map((job) => (
                  <tr key={job.id} className="border-b border-[var(--color-border-muted)] align-top">
                    <td className="py-4 pr-4 font-semibold">{job.title}</td>
                    <td className="py-4 pr-4">{job.department || "-"}</td>
                    <td className="py-4 pr-4">{job.location || "-"}</td>
                    <td className="py-4 pr-4">{job.employment_type || "-"}</td>
                    <td className="py-4 pr-4">{job.compensation || "-"}</td>
                    <td className="py-4 pr-4">{statusBadge(job.status || "draft")}</td>
                    <td className="py-4 pr-4">{formatDate(job.updated_at || job.created_at)}</td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="us-btn-secondary px-3 py-2 text-xs" onClick={() => openJobListingEditor(job)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="us-btn-primary px-3 py-2 text-xs"
                          disabled={isPending || job.status === "published"}
                          onClick={() => runAction(() => setJobListingStatusAction(formData({ job_id: job.id, status: "published" })), `publish-${job.id}`)}
                        >
                          {pendingActionId === `publish-${job.id}` ? "Publishing..." : "Publish"}
                        </button>
                        <button
                          type="button"
                          className="us-btn-secondary px-3 py-2 text-xs"
                          disabled={isPending || job.status === "draft"}
                          onClick={() => runAction(() => setJobListingStatusAction(formData({ job_id: job.id, status: "draft" })), `unpublish-${job.id}`)}
                        >
                          Unpublish
                        </button>
                        <button
                          type="button"
                          className="us-btn-secondary px-3 py-2 text-xs"
                          disabled={isPending || job.status === "closed"}
                          onClick={() => runAction(() => setJobListingStatusAction(formData({ job_id: job.id, status: "closed" })), `close-${job.id}`)}
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          className="us-btn-danger px-3 py-2 text-xs"
                          onClick={() =>
                            setConfirm({
                              title: "Delete Job Listing",
                              message: `Delete ${job.title}? Applications will remain, but the listing will be removed.`,
                              confirmLabel: "Delete Listing",
                              danger: true,
                              onConfirm: () => runAction(() => deleteJobListingAction(formData({ job_id: job.id })), `delete-job-${job.id}`),
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="us-kicker">Careers</p>
            <h2 className="mt-2 text-2xl font-extrabold">Job Applications</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Review public careers submissions and move strong applicants forward.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <select className="us-input" value={jobApplicationJobFilter} onChange={(event) => setJobApplicationJobFilter(event.target.value)}>
              <option value="all">All jobs</option>
              {jobListings.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
            <select className="us-input" value={jobApplicationStatusFilter} onChange={(event) => setJobApplicationStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="new">new</option>
              <option value="reviewing">reviewing</option>
              <option value="interview">interview</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </div>
        </div>

        {jobApplicationsError ? (
          <p className="mt-6 rounded-[1rem] border border-[rgba(176,59,59,0.22)] bg-[rgba(176,59,59,0.08)] p-4 text-sm font-semibold text-[var(--color-danger)]">
            Job applications could not load: {jobApplicationsError}
          </p>
        ) : filteredJobApplications.length === 0 ? (
          <p className="mt-6 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
            No job applications match the current filters.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                <tr>
                  <th className="py-3 pr-4">Applicant</th>
                  <th className="py-3 pr-4">Job</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Resume</th>
                  <th className="py-3 pr-4">Location</th>
                  <th className="py-3 pr-4">Availability</th>
                  <th className="py-3 pr-4">Applied</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobApplications.map((application) => {
                  const job = application.job_listing_id ? jobListingById.get(application.job_listing_id) : undefined;

                  return (
                    <tr key={application.id} className="border-b border-[var(--color-border-muted)] align-top">
                      <td className="py-4 pr-4">
                        <p className="font-bold">{application.full_name}</p>
                        <p className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">{application.email}</p>
                      </td>
                      <td className="py-4 pr-4">{job?.title || "Listing removed"}</td>
                      <td className="py-4 pr-4">{statusBadge(application.status || "new")}</td>
                      <td className="py-4 pr-4">
                        {application.resume_file_path ? (
                          <button
                            type="button"
                            className="us-btn-secondary px-3 py-2 text-xs"
                            onClick={() => viewResume(application.resume_file_path as string)}
                          >
                            View Resume
                          </button>
                        ) : (
                          <span className="text-[var(--color-text-secondary)]">No resume</span>
                        )}
                      </td>
                      <td className="py-4 pr-4">{application.location || "-"}</td>
                      <td className="py-4 pr-4">{application.availability || "-"}</td>
                      <td className="py-4 pr-4">{formatDate(application.created_at)}</td>
                      <td className="py-4 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="us-btn-secondary px-3 py-2 text-xs" onClick={() => openJobApplication(application)}>
                            Open Details
                          </button>
                          <button
                            type="button"
                            className="us-btn-primary px-3 py-2 text-xs"
                            onClick={() =>
                              runAction(
                                () => approveJobApplicationAsPendingTeamMemberAction(formData({ application_id: application.id })),
                                `pending-from-job-${application.id}`
                              )
                            }
                          >
                            Pending Team Member
                          </button>
                          <button
                            type="button"
                            className="us-btn-success px-3 py-2 text-xs"
                            onClick={() =>
                              runAction(
                                () => approveJobApplicationAsSalesRepAction(formData({ application_id: application.id })),
                                `sales-from-job-${application.id}`
                              )
                            }
                          >
                            Approve Sales Rep
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

      {editJobListing ? (
        <Modal title={editJobListing.job ? "Edit Job Listing" : "Create Job Listing"} onCancel={() => setEditJobListing(null)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Title
              <input className="us-input" value={editJobListing.title} onChange={(event) => setEditJobListing({ ...editJobListing, title: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Department
              <input className="us-input" value={editJobListing.department} onChange={(event) => setEditJobListing({ ...editJobListing, department: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Location
              <input className="us-input" value={editJobListing.location} onChange={(event) => setEditJobListing({ ...editJobListing, location: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Employment type
              <input className="us-input" value={editJobListing.employmentType} onChange={(event) => setEditJobListing({ ...editJobListing, employmentType: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Compensation
              <input className="us-input" value={editJobListing.compensation} onChange={(event) => setEditJobListing({ ...editJobListing, compensation: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Status
              <select className="us-input" value={editJobListing.status} onChange={(event) => setEditJobListing({ ...editJobListing, status: event.target.value })}>
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="closed">closed</option>
              </select>
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Description
            <textarea className="us-textarea" value={editJobListing.description} onChange={(event) => setEditJobListing({ ...editJobListing, description: event.target.value })} />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Requirements
            <textarea className="us-textarea" value={editJobListing.requirements} onChange={(event) => setEditJobListing({ ...editJobListing, requirements: event.target.value })} />
          </label>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="us-btn-secondary px-4 py-2" onClick={() => setEditJobListing(null)}>
              Cancel
            </button>
            <button type="button" className="us-btn-primary px-4 py-2" disabled={isPending} onClick={submitJobListing}>
              {pendingActionId === "create-job" ? "Saving..." : "Save"}
            </button>
          </div>
        </Modal>
      ) : null}

      {editJobApplication ? (
        <Modal title="Job Application Details" onCancel={() => setEditJobApplication(null)}>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-bold">{editJobApplication.application.full_name}</p>
              <p className="text-[var(--color-text-secondary)]">{editJobApplication.application.email}</p>
              <p className="text-[var(--color-text-secondary)]">{editJobApplication.application.phone || "No phone"}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniStat label="Location" value={editJobApplication.application.location || "-"} />
              <MiniStat label="Availability" value={editJobApplication.application.availability || "-"} />
              <MiniStat label="Contact" value={editJobApplication.application.preferred_contact_method || "-"} />
              <MiniStat label="Applied" value={formatDate(editJobApplication.application.created_at)} />
            </div>
            <div>
              <p className="font-bold">Experience</p>
              <p className="mt-1 whitespace-pre-wrap text-[var(--color-text-secondary)]">{editJobApplication.application.experience_summary || "-"}</p>
            </div>
            <div>
              <p className="font-bold">Why interested</p>
              <p className="mt-1 whitespace-pre-wrap text-[var(--color-text-secondary)]">{editJobApplication.application.why_interested || "-"}</p>
            </div>
            {editJobApplication.application.resume_file_path ? (
              <button
                type="button"
                className="us-btn-secondary px-4 py-2 text-sm"
                onClick={() => viewResume(editJobApplication.application.resume_file_path as string)}
              >
                View Resume
              </button>
            ) : (
              <p className="text-[var(--color-text-secondary)]">No resume uploaded.</p>
            )}
          </div>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Status
            <select className="us-input" value={editJobApplication.status} onChange={(event) => setEditJobApplication({ ...editJobApplication, status: event.target.value })}>
              <option value="new">new</option>
              <option value="reviewing">reviewing</option>
              <option value="interview">interview</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Internal notes
            <textarea className="us-textarea" value={editJobApplication.notes} onChange={(event) => setEditJobApplication({ ...editJobApplication, notes: event.target.value })} />
          </label>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="us-btn-secondary px-4 py-2" onClick={() => setEditJobApplication(null)}>
              Cancel
            </button>
            <button type="button" className="us-btn-primary px-4 py-2" disabled={isPending} onClick={submitJobApplicationReview}>
              Save
            </button>
          </div>
        </Modal>
      ) : null}

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
                <option value="invite_sent">invite_sent</option>
                <option value="active">active</option>
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
