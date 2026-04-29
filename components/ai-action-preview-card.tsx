"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type AIActionDocumentData,
  type AIActionLeadData,
  type AIActionMappingData,
  type AIActionMessageData,
  type AIActionPreview,
} from "@/lib/ai/schemas";
import { type InvoiceRecord, saveInvoiceRecord } from "@/lib/invoices";
import { createInvoiceNumber } from "@/lib/invoice-ui";
import { saveLeadRecord, type LeadStatus } from "@/lib/leads";
import { saveQuoteRecord, type QuoteRecord } from "@/lib/quotes";

type Props = {
  preview: AIActionPreview;
  onCancel: () => void;
  onSaved?: (message: string) => void;
};

const MAPPING_STORAGE_KEY = "sales_mapping_areas_v3";

type MappingAreaRecord = {
  id: string;
  name: string;
  homes: number;
  closeRate: number;
  estimatedSales: number;
  avgJobPrice: number;
  estimatedRevenue: number;
  doorsKnocked: number;
  actualSales: number;
  status: "Not Started" | "In Progress" | "Completed";
  notes: string;
  createdAt: string;
};

function isDocumentData(data: AIActionPreview["data"]): data is AIActionDocumentData {
  return "lineItems" in data;
}

function isLeadData(data: AIActionPreview["data"]): data is AIActionLeadData {
  return "businessName" in data;
}

function isMappingData(data: AIActionPreview["data"]): data is AIActionMappingData {
  return "routeNotes" in data && "outreachNotes" in data;
}

function isMessageData(data: AIActionPreview["data"]): data is AIActionMessageData {
  return "message" in data;
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getTextValue(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return typeof value === "string" ? value : "";
}

function parseEditableJson(value: string) {
  const parsed = JSON.parse(value) as AIActionPreview;
  if (!parsed || typeof parsed !== "object" || !("intent" in parsed)) {
    throw new Error("Preview JSON must include an intent.");
  }
  return parsed;
}

function readMappingAreas(): MappingAreaRecord[] {
  try {
    const raw = localStorage.getItem(MAPPING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapLeadStatus(value?: string): LeadStatus {
  if (value === "Contacted" || value === "Estimate Sent" || value === "Won" || value === "Lost") {
    return value;
  }
  return "New";
}

export default function AIActionPreviewCard({ preview, onCancel, onSaved }: Props) {
  const router = useRouter();
  const [editableJson, setEditableJson] = useState(() =>
    JSON.stringify(preview, null, 2)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(preview);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const intentLabel = useMemo(
    () => currentPreview.intent.replaceAll("_", " "),
    [currentPreview.intent]
  );

  function applyEdits() {
    try {
      const parsed = parseEditableJson(editableJson);
      setCurrentPreview(parsed);
      setIsEditing(false);
      setError("");
      setMessage("Preview updated. Review it before saving.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid preview JSON.");
    }
  }

  function saveQuote() {
    if (!isDocumentData(currentPreview.data)) return;

    const data = currentPreview.data;
    const quote: QuoteRecord = {
      id: crypto.randomUUID(),
      quoteNumber: createInvoiceNumber("QUOTE"),
      quoteType: data.serviceType || "Service Quote",
      customerName: data.customerName || "",
      customerEmail: data.customerEmail || "",
      customerPhone: data.customerPhone || "",
      serviceAddress: data.serviceAddress || "",
      projectTitle: data.projectTitle || currentPreview.title,
      notes: [data.notes, data.terms].filter(Boolean).join("\n\n"),
      items: data.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        price: item.unitPrice,
      })),
      subtotal: data.subtotal,
      taxRate: data.taxRate || 0,
      taxAmount: data.tax,
      total: data.total,
      status: "Draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveQuoteRecord(quote);
    setMessage("Quote saved. Opening saved quotes...");
    onSaved?.("Quote saved.");
    router.push("/quotes/saved");
  }

  function saveInvoice() {
    if (!isDocumentData(currentPreview.data)) return;

    const data = currentPreview.data;
    const invoice: InvoiceRecord = {
      id: crypto.randomUUID(),
      serviceType: data.serviceType || "Service Invoice",
      invoiceNumber: createInvoiceNumber("INV"),
      customerName: data.customerName || "",
      phone: data.customerPhone || "",
      email: data.customerEmail || "",
      address: data.serviceAddress || "",
      projectTitle: data.projectTitle || currentPreview.title,
      notes: [data.notes, data.terms, data.dueTerms].filter(Boolean).join("\n\n"),
      items: data.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        price: item.unitPrice,
      })),
      subtotal: data.subtotal,
      taxRate: data.taxRate || 0,
      taxAmount: data.tax,
      deposit: data.discount || 0,
      total: data.total,
      balanceDue: data.total,
      status: "Unpaid",
      paymentStatus: "Unpaid",
      payment_status: "Unpaid",
      quickbooks_sync_status: "Not Synced",
      paidDate: "",
      paymentMethod: "",
      paymentNotes: data.dueDate
        ? `Due ${new Date(data.dueDate).toLocaleDateString()}`
        : data.dueTerms || "Due upon receipt.",
      createdAt: new Date().toISOString(),
      convertedFromQuoteId: data.sourceQuoteId,
      converted_from_quote_id: data.sourceQuoteId,
      details: {
        dueTerms: data.dueTerms || "Due upon receipt.",
        dueDate: data.dueDate || "",
        sourceQuoteNumber: data.sourceQuoteNumber || "",
      },
    };

    saveInvoiceRecord(invoice);
    setMessage("Invoice saved. Opening saved invoices...");
    onSaved?.("Invoice saved.");
    router.push("/invoices/saved");
  }

  function saveLead() {
    if (!isLeadData(currentPreview.data)) return;

    const data = currentPreview.data;
    saveLeadRecord({
      id: crypto.randomUUID(),
      fullName: data.businessName || data.contactName || "New Lead",
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "",
      area: data.city || "",
      serviceType: data.serviceType || "Other",
      status: mapLeadStatus(data.status),
      estimatedValue: data.estimatedValue || 0,
      followUpDate: data.followUpDate || "",
      reminderNote: data.followUpDate ? "AI suggested follow-up." : "",
      notes: [
        data.contactName ? `Contact: ${data.contactName}` : "",
        data.leadSource ? `Lead source: ${data.leadSource}` : "",
        data.priority ? `Priority: ${data.priority}` : "",
        data.notes || "",
      ]
        .filter(Boolean)
        .join("\n"),
      createdAt: new Date().toISOString(),
    });

    setMessage("Lead saved. Opening leads...");
    onSaved?.("Lead saved.");
    router.push("/leads");
  }

  function saveMappingNote() {
    if (!isMappingData(currentPreview.data)) return;

    const data = currentPreview.data;
    const existing = readMappingAreas();
    const notes = [
      data.targetCustomer ? `Target: ${data.targetCustomer}` : "",
      data.routeNotes ? `Route notes: ${data.routeNotes}` : "",
      data.outreachNotes ? `Outreach notes: ${data.outreachNotes}` : "",
      `Priority: ${data.priority || "medium"}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const area: MappingAreaRecord = {
      id: crypto.randomUUID(),
      name: data.location || data.title || "AI Mapping Note",
      homes: 0,
      closeRate: 0,
      estimatedSales: 0,
      avgJobPrice: 0,
      estimatedRevenue: 0,
      doorsKnocked: 0,
      actualSales: 0,
      status:
        data.status === "completed"
          ? "Completed"
          : data.status === "in_progress"
          ? "In Progress"
          : "Not Started",
      notes,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify([area, ...existing]));
    setMessage("Mapping note saved. Opening sales mapping...");
    onSaved?.("Mapping note saved.");
    router.push("/mapping");
  }

  async function copyMessage() {
    if (!isMessageData(currentPreview.data)) return;

    const value = [currentPreview.data.subject, currentPreview.data.message]
      .filter(Boolean)
      .join("\n\n");
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  const dataAsRecord = currentPreview.data as Record<string, unknown>;

  return (
    <section className="mt-6 rounded-[1.6rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Action Preview
          </p>
          <h2 className="mt-1 text-2xl font-bold capitalize text-[var(--color-text)]">
            {currentPreview.title}
          </h2>
          <p className="mt-2 text-sm capitalize text-[var(--color-text-secondary)]">
            Detected action: {intentLabel}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="us-btn-secondary text-sm">
          Cancel
        </button>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
        {currentPreview.summary}
      </p>

      {isEditing ? (
        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-[var(--color-text)]">
            Edit preview JSON
          </label>
          <textarea
            value={editableJson}
            onChange={(event) => setEditableJson(event.target.value)}
            className="us-textarea min-h-[320px] font-mono text-xs"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={applyEdits} className="us-btn-primary">
              Apply Edits
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="us-btn-secondary"
            >
              Back to Preview
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {isDocumentData(currentPreview.data) ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <PreviewField label="Customer" value={currentPreview.data.customerName || "-"} />
                <PreviewField label="Service" value={currentPreview.data.serviceType} />
                <PreviewField label="Project" value={currentPreview.data.projectTitle || "-"} />
                <PreviewField
                  label="Due"
                  value={
                    currentPreview.data.dueDate
                      ? new Date(currentPreview.data.dueDate).toLocaleDateString()
                      : currentPreview.data.dueTerms || "Due upon receipt."
                  }
                />
              </div>
              <div className="space-y-2">
                {currentPreview.data.lineItems.map((item, index) => (
                  <div
                    key={`${item.description}-${index}`}
                    className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-4 text-sm"
                  >
                    <div className="font-semibold text-[var(--color-text)]">
                      {item.description}
                    </div>
                    <div className="mt-2 grid gap-2 text-[var(--color-text-secondary)] sm:grid-cols-3">
                      <span>Qty {item.quantity}</span>
                      <span>{formatCurrency(item.unitPrice)} each</span>
                      <span className="font-semibold text-[var(--color-text)]">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.1)] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(currentPreview.data.subtotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatCurrency(currentPreview.data.tax)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-lg font-bold text-[var(--color-success)]">
                  <span>Total</span>
                  <span>{formatCurrency(currentPreview.data.total)}</span>
                </div>
              </div>
              {currentPreview.data.notes || currentPreview.data.terms ? (
                <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)]">
                  {[currentPreview.data.notes, currentPreview.data.terms]
                    .filter(Boolean)
                    .join("\n\n")}
                </p>
              ) : null}
            </>
          ) : isLeadData(currentPreview.data) ? (
            <div className="grid gap-3 md:grid-cols-2">
              <PreviewField label="Business / Customer" value={currentPreview.data.businessName} />
              <PreviewField label="Contact" value={currentPreview.data.contactName || "-"} />
              <PreviewField label="Location" value={currentPreview.data.city || "-"} />
              <PreviewField label="Service" value={currentPreview.data.serviceType || "-"} />
              <PreviewField label="Status" value={currentPreview.data.status || "New"} />
              <PreviewField label="Priority" value={currentPreview.data.priority || "medium"} />
              <PreviewField label="Notes" value={currentPreview.data.notes || "-"} wide />
            </div>
          ) : isMappingData(currentPreview.data) ? (
            <div className="grid gap-3 md:grid-cols-2">
              <PreviewField label="Location" value={currentPreview.data.location || "-"} />
              <PreviewField label="Business Type" value={currentPreview.data.businessType} />
              <PreviewField label="Target Customer" value={currentPreview.data.targetCustomer} wide />
              <PreviewField label="Route Notes" value={currentPreview.data.routeNotes} wide />
              <PreviewField label="Outreach Notes" value={currentPreview.data.outreachNotes} wide />
            </div>
          ) : isMessageData(currentPreview.data) ? (
            <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-4">
              {currentPreview.data.subject ? (
                <p className="font-semibold text-[var(--color-text)]">
                  {currentPreview.data.subject}
                </p>
              ) : null}
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
                {currentPreview.data.message}
              </p>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
              {getTextValue(dataAsRecord, "response")}
            </p>
          )}
        </div>
      )}

      {error ? <div className="us-notice-danger mt-4 text-sm">{error}</div> : null}
      {message ? <div className="us-notice-info mt-4 text-sm">{message}</div> : null}

      {!isEditing ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {currentPreview.intent === "create_quote" ? (
            <button type="button" onClick={saveQuote} className="us-btn-primary">
              Save Quote
            </button>
          ) : null}
          {currentPreview.intent === "create_invoice" ? (
            <button type="button" onClick={saveInvoice} className="us-btn-primary">
              Save Invoice
            </button>
          ) : null}
          {currentPreview.intent === "create_lead" ? (
            <button type="button" onClick={saveLead} className="us-btn-primary">
              Save Lead
            </button>
          ) : null}
          {currentPreview.intent === "create_sales_mapping_note" ? (
            <button type="button" onClick={saveMappingNote} className="us-btn-primary">
              Save Mapping Note
            </button>
          ) : null}
          {currentPreview.intent === "write_follow_up_message" ? (
            <button type="button" onClick={copyMessage} className="us-btn-primary">
              {copied ? "Copied" : "Copy Message"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setEditableJson(JSON.stringify(currentPreview, null, 2));
              setIsEditing(true);
            }}
            className="us-btn-secondary"
          >
            Edit Before Saving
          </button>
        </div>
      ) : null}
    </section>
  );
}

function PreviewField({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-4 ${
        wide ? "md:col-span-2" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}
