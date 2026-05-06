"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import {
  createSalesLeadAction,
  deleteSalesLeadAction,
  updateSalesLeadAction,
  updateSalesLeadStatusAction,
  type SalesLeadActionResult,
} from "./actions";

export type SalesLeadRow = {
  id: string;
  sales_rep_id: string | null;
  sales_rep_user_id: string | null;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  industry: string | null;
  status: string | null;
  notes: string | null;
  follow_up_date: string | null;
  subscribed_profile_id: string | null;
  subscribed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type LeadEditorState = {
  lead?: SalesLeadRow;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  industry: string;
  status: string;
  notes: string;
  followUpDate: string;
  subscribedProfileId: string;
};

type ConfirmState =
  | {
      lead: SalesLeadRow;
    }
  | null;

const STATUS_OPTIONS = [
  "new",
  "contacted",
  "follow_up",
  "interested",
  "not_interested",
  "subscribed",
  "lost",
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

function statusLabel(status?: string | null) {
  return (status || "new").replace(/_/g, " ");
}

function statusBadge(status?: string | null) {
  const normalized = status || "new";
  const className =
    normalized === "subscribed" || normalized === "interested"
      ? "border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.1)] text-[var(--color-success)]"
      : normalized === "follow_up" || normalized === "contacted"
      ? "border-[rgba(183,121,31,0.24)] bg-[rgba(183,121,31,0.1)] text-[var(--color-warning)]"
      : normalized === "lost" || normalized === "not_interested"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-[var(--color-border-muted)] bg-[var(--color-section)] text-[var(--color-text-secondary)]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${className}`}>
      {statusLabel(normalized)}
    </span>
  );
}

function formData(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

function leadToEditor(lead?: SalesLeadRow): LeadEditorState {
  return {
    lead,
    businessName: lead?.business_name || "",
    contactName: lead?.contact_name || "",
    phone: lead?.phone || "",
    email: lead?.email || "",
    address: lead?.address || "",
    industry: lead?.industry || "",
    status: lead?.status || "new",
    notes: lead?.notes || "",
    followUpDate: lead?.follow_up_date || "",
    subscribedProfileId: lead?.subscribed_profile_id || "",
  };
}

export default function SalesLeadsClient({ leads }: { leads: SalesLeadRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<SalesLeadActionResult | null>(null);
  const [editor, setEditor] = useState<LeadEditorState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  function runAction(
    action: () => Promise<SalesLeadActionResult>,
    actionId: string,
    onSuccess?: () => void
  ) {
    startTransition(async () => {
      setMessage(null);
      setPendingActionId(actionId);
      try {
        const result = await action();
        setMessage(result);
        if (result.ok) onSuccess?.();
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

  function submitEditor() {
    if (!editor) return;
    const data = formData({
      business_name: editor.businessName,
      contact_name: editor.contactName,
      phone: editor.phone,
      email: editor.email,
      address: editor.address,
      industry: editor.industry,
      status: editor.status,
      notes: editor.notes,
      follow_up_date: editor.followUpDate,
      subscribed_profile_id: editor.subscribedProfileId,
    });

    if (editor.lead) {
      data.set("lead_id", editor.lead.id);
      runAction(() => updateSalesLeadAction(data), `edit-${editor.lead.id}`, () => setEditor(null));
    } else {
      runAction(() => createSalesLeadAction(data), "create-lead", () => setEditor(null));
    }
  }

  function changeStatus(lead: SalesLeadRow, status: string) {
    runAction(
      () =>
        updateSalesLeadStatusAction(
          formData({
            lead_id: lead.id,
            status,
            subscribed_profile_id: lead.subscribed_profile_id || "",
          })
        ),
      `${status}-${lead.id}`
    );
  }

  return (
    <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="us-kicker">My Leads</p>
          <h2 className="mt-2 text-2xl font-extrabold">Lead tracking</h2>
        </div>
        <button type="button" className="us-btn-primary px-4 py-2 text-sm" onClick={() => setEditor(leadToEditor())}>
          Add Lead
        </button>
      </div>

      {message ? (
        <div className={message.ok ? "us-notice-info mt-5 text-sm" : "us-notice-danger mt-5 text-sm"}>
          {message.message}
        </div>
      ) : null}

      {leads.length === 0 ? (
        <p className="mt-5 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm font-semibold text-[var(--color-text-secondary)]">
          No leads yet.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
              <tr>
                <th className="py-3 pr-4">Lead</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Follow-up</th>
                <th className="py-3 pr-4">Notes</th>
                <th className="py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-[var(--color-border-muted)] align-top">
                  <td className="py-4 pr-4">
                    <p className="font-bold">{lead.business_name}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      {lead.contact_name || "No contact"} {lead.industry ? `- ${lead.industry}` : ""}
                    </p>
                    <p className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">
                      {[lead.phone, lead.email].filter(Boolean).join(" | ") || "No phone or email"}
                    </p>
                  </td>
                  <td className="py-4 pr-4">
                    {statusBadge(lead.status)}
                    {lead.subscribed_at ? (
                      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                        Subscribed {formatDate(lead.subscribed_at)}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-4 pr-4">{formatDate(lead.follow_up_date)}</td>
                  <td className="py-4 pr-4 text-[var(--color-text-secondary)]">
                    <div className="max-w-xs whitespace-pre-wrap">{lead.notes || "-"}</div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex min-w-72 flex-wrap gap-2">
                      <button
                        type="button"
                        className="us-btn-secondary px-3 py-2 text-xs"
                        disabled={isPending}
                        onClick={() => setEditor(leadToEditor(lead))}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="us-btn-secondary px-3 py-2 text-xs"
                        disabled={isPending}
                        onClick={() => changeStatus(lead, "contacted")}
                      >
                        {pendingActionId === `contacted-${lead.id}` ? "Saving..." : "Mark Contacted"}
                      </button>
                      <button
                        type="button"
                        className="us-btn-primary px-3 py-2 text-xs"
                        disabled={isPending}
                        onClick={() => changeStatus(lead, "subscribed")}
                      >
                        {pendingActionId === `subscribed-${lead.id}` ? "Saving..." : "Mark Subscribed"}
                      </button>
                      <button
                        type="button"
                        className="us-btn-danger px-3 py-2 text-xs"
                        disabled={isPending}
                        onClick={() => setConfirm({ lead })}
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

      {editor ? (
        <Modal title={editor.lead ? "Edit Lead" : "Add Lead"} onCancel={() => setEditor(null)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              Business name
              <input className="us-input" value={editor.businessName} onChange={(event) => setEditor({ ...editor, businessName: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Contact name
              <input className="us-input" value={editor.contactName} onChange={(event) => setEditor({ ...editor, contactName: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Phone
              <input className="us-input" value={editor.phone} onChange={(event) => setEditor({ ...editor, phone: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Email
              <input className="us-input" type="email" value={editor.email} onChange={(event) => setEditor({ ...editor, email: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Industry
              <input className="us-input" value={editor.industry} onChange={(event) => setEditor({ ...editor, industry: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Follow-up date
              <input className="us-input" type="date" value={editor.followUpDate} onChange={(event) => setEditor({ ...editor, followUpDate: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Status
              <select className="us-input" value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value })}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Subscribed profile id
              <input className="us-input" value={editor.subscribedProfileId} onChange={(event) => setEditor({ ...editor, subscribedProfileId: event.target.value })} />
            </label>
          </div>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Address
            <input className="us-input" value={editor.address} onChange={(event) => setEditor({ ...editor, address: event.target.value })} />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold">
            Notes
            <textarea className="us-textarea" value={editor.notes} onChange={(event) => setEditor({ ...editor, notes: event.target.value })} />
          </label>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="us-btn-secondary px-4 py-2" onClick={() => setEditor(null)}>
              Cancel
            </button>
            <button type="button" className="us-btn-primary px-4 py-2" disabled={isPending} onClick={submitEditor}>
              {isPending ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </Modal>
      ) : null}

      {confirm ? (
        <Modal title="Delete Lead" onCancel={() => setConfirm(null)}>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            Delete {confirm.lead.business_name}? This cannot be undone.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="us-btn-secondary px-4 py-2" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="us-btn-danger px-4 py-2"
              disabled={isPending}
              onClick={() =>
                runAction(
                  () => deleteSalesLeadAction(formData({ lead_id: confirm.lead.id })),
                  `delete-${confirm.lead.id}`,
                  () => setConfirm(null)
                )
              }
            >
              {pendingActionId === `delete-${confirm.lead.id}` ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
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
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
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
