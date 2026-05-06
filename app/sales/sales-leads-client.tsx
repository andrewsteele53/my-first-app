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
  business_name: string;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  signed_up: boolean | null;
  signed_up_at: string | null;
  created_at: string | null;
};

type LeadEditorState = {
  lead?: SalesLeadRow;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  status: string;
};

type ConfirmState = { lead: SalesLeadRow } | null;

const STATUS_OPTIONS = ["new", "contacted", "interested", "signed_up"];

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

function statusLabel(status?: string | null) {
  return (status || "new").replace(/_/g, " ");
}

function statusBadge(status?: string | null, signedUp?: boolean | null) {
  const normalized = signedUp ? "signed_up" : status || "new";
  const className =
    normalized === "signed_up" || normalized === "interested"
      ? "border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.1)] text-[var(--color-success)]"
      : normalized === "contacted"
      ? "border-[rgba(183,121,31,0.24)] bg-[rgba(183,121,31,0.1)] text-[var(--color-warning)]"
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
    ownerName: lead?.owner_name || "",
    phone: lead?.phone || "",
    email: lead?.email || "",
    status: lead?.status || "new",
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
      owner_name: editor.ownerName,
      phone: editor.phone,
      email: editor.email,
      status: editor.status,
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
      () => updateSalesLeadStatusAction(formData({ lead_id: lead.id, status })),
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
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
              <tr>
                <th className="py-3 pr-4">Lead</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Created</th>
                <th className="py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-[var(--color-border-muted)] align-top">
                  <td className="py-4 pr-4">
                    <p className="font-bold">{lead.business_name}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      {lead.owner_name || "No owner name"}
                    </p>
                    <p className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">
                      {[lead.phone, lead.email].filter(Boolean).join(" | ") || "No phone or email"}
                    </p>
                  </td>
                  <td className="py-4 pr-4">
                    {statusBadge(lead.status, lead.signed_up)}
                    {lead.signed_up_at ? (
                      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                        Signed up {formatDate(lead.signed_up_at)}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-4 pr-4">{formatDate(lead.created_at)}</td>
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
                        className="us-btn-secondary px-3 py-2 text-xs"
                        disabled={isPending}
                        onClick={() => changeStatus(lead, "interested")}
                      >
                        {pendingActionId === `interested-${lead.id}` ? "Saving..." : "Mark Interested"}
                      </button>
                      <button
                        type="button"
                        className="us-btn-primary px-3 py-2 text-xs"
                        disabled={isPending}
                        onClick={() => changeStatus(lead, "signed_up")}
                      >
                        {pendingActionId === `signed_up-${lead.id}` ? "Saving..." : "Mark Signed Up"}
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
              Owner name
              <input className="us-input" value={editor.ownerName} onChange={(event) => setEditor({ ...editor, ownerName: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Phone
              <input className="us-input" value={editor.phone} onChange={(event) => setEditor({ ...editor, phone: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Email
              <input className="us-input" type="email" value={editor.email} onChange={(event) => setEditor({ ...editor, email: event.target.value })} />
            </label>
            {editor.lead ? (
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
            ) : null}
          </div>
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
