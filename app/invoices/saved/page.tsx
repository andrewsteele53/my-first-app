"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DeleteConfirmationModal from "@/components/delete-confirmation-modal";
import InvoiceStorageNote from "@/components/invoice-storage-note";
import QuickBooksInvoiceActions from "@/components/quickbooks-invoice-actions";
import {
  InvoiceRecord,
  type InvoiceStatus,
  formatInvoiceCurrency,
  getSavedInvoices,
  moveInvoiceToTrash,
  updateSavedInvoiceRecord,
} from "@/lib/invoices";
import { invoiceUi } from "@/lib/invoice-ui";

function getInvoiceTitle(invoice: InvoiceRecord, index: number) {
  return (
    invoice.invoiceNumber ||
    invoice.customerName ||
    invoice.projectTitle ||
    invoice.serviceType ||
    `Invoice ${index + 1}`
  );
}

function getInvoiceStatus(invoice: InvoiceRecord): InvoiceStatus {
  if (invoice.paymentStatus === "Paid" || invoice.status === "Paid") return "Paid";

  const dueDate = invoice.details?.dueDate;
  if (dueDate) {
    const dueTime = new Date(dueDate).getTime();
    if (!Number.isNaN(dueTime) && dueTime < Date.now()) return "Overdue";
  }

  return "Unpaid";
}

function getStatusClasses(status: InvoiceStatus) {
  switch (status) {
    case "Paid":
      return "border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.12)] text-[var(--color-success)]";
    case "Overdue":
      return "border-[rgba(199,80,80,0.2)] bg-[rgba(199,80,80,0.12)] text-[var(--color-danger)]";
    default:
      return "border-[rgba(183,121,31,0.25)] bg-[rgba(183,121,31,0.12)] text-[var(--color-warning)]";
  }
}

function getQuickBooksSyncStatus(invoice: InvoiceRecord) {
  if (invoice.quickbooks_invoice_id) return "Synced";
  if (invoice.quickbooks_sync_status === "Sync Failed") return "Sync Failed";
  if (invoice.quickbooks_sync_status === "Synced") return "Synced";
  return "Not Synced";
}

function getQuickBooksClasses(status: string) {
  if (status === "Synced") {
    return "border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.12)] text-[var(--color-success)]";
  }

  if (status === "Sync Failed") {
    return "border-[rgba(199,80,80,0.2)] bg-[rgba(199,80,80,0.12)] text-[var(--color-danger)]";
  }

  return "border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]";
}

export default function SavedInvoicesPage() {
  const [savedInvoices, setSavedInvoices] = useState<InvoiceRecord[]>([]);
  const [pendingTrashInvoiceId, setPendingTrashInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSavedInvoices(getSavedInvoices());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const totalSavedValue = useMemo(
    () => savedInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0),
    [savedInvoices]
  );

  const moveToTrashAndRefresh = (invoiceId: string) => {
    const next = moveInvoiceToTrash(invoiceId);
    setSavedInvoices(next.saved);
    setPendingTrashInvoiceId(null);
  };

  const updateInvoiceAndRefresh = (invoice: InvoiceRecord) => {
    const next = updateSavedInvoiceRecord(invoice.id, invoice);
    setSavedInvoices(next);
  };

  const markAsPaid = (invoice: InvoiceRecord) => {
    const paidAt = new Date().toISOString();
    const next = updateSavedInvoiceRecord(invoice.id, {
      ...invoice,
      status: "Paid",
      paymentStatus: "Paid",
      payment_status: "Paid",
      paid_at: paidAt,
      paidDate: paidAt,
      balanceDue: 0,
    });
    setSavedInvoices(next);
  };

  const printInvoice = (invoice: InvoiceRecord, index: number) => {
    const title = getInvoiceTitle(invoice, index);
    const total = formatInvoiceCurrency(invoice.total || 0);

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #0f172a; }
            h1 { margin-bottom: 8px; }
            .muted { color: #475569; margin-bottom: 24px; }
            .section { margin-bottom: 18px; }
            .label { font-weight: bold; }
            .box { border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="muted">Saved Invoice Record</p>
          <div class="box">
            <div class="section"><span class="label">Invoice Number:</span> ${invoice.invoiceNumber || "N/A"}</div>
            <div class="section"><span class="label">Customer:</span> ${invoice.customerName || "N/A"}</div>
            <div class="section"><span class="label">Service Type:</span> ${invoice.serviceType || "N/A"}</div>
            <div class="section"><span class="label">Created:</span> ${new Date(invoice.createdAt).toLocaleDateString()}</div>
            <div class="section"><span class="label">Total:</span> ${total}</div>
            <div class="section"><span class="label">Payment Status:</span> ${invoice.paymentStatus}</div>
            <div class="section"><span class="label">Payment Method:</span> ${invoice.paymentMethod || "N/A"}</div>
            <div class="section"><span class="label">Notes:</span> ${invoice.notes || "N/A"}</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const downloadInvoicePdf = async (invoice: InvoiceRecord, index: number) => {
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF();
    const title = getInvoiceTitle(invoice, index);

    let y = 20;
    doc.setFontSize(20);
    doc.text("Invoice", 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Title: ${title}`, 14, y);
    y += 8;
    doc.text(`Invoice Number: ${invoice.invoiceNumber || "N/A"}`, 14, y);
    y += 8;
    doc.text(`Customer: ${invoice.customerName || "N/A"}`, 14, y);
    y += 8;
    doc.text(`Service Type: ${invoice.serviceType || "N/A"}`, 14, y);
    y += 8;
    doc.text(`Created: ${new Date(invoice.createdAt).toLocaleDateString()}`, 14, y);
    y += 8;
    doc.text(`Total: ${formatInvoiceCurrency(invoice.total || 0)}`, 14, y);
    y += 8;
    doc.text(`Payment Status: ${invoice.paymentStatus}`, 14, y);
    y += 8;
    doc.text(`Payment Method: ${invoice.paymentMethod || "N/A"}`, 14, y);
    y += 12;
    doc.setFontSize(14);
    doc.text("Notes", 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(invoice.notes || "No notes provided.", 180), 14, y);

    const safeFileName = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    doc.save(`${safeFileName || "invoice"}.pdf`);
  };

  return (
    <main className={invoiceUi.page}>
      <div className={invoiceUi.container}>
        <section className={invoiceUi.heroCard}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                Invoices
              </p>
              <h1 className="mt-2 text-4xl font-bold">Saved Invoices</h1>
              <p className="mt-3 max-w-2xl text-[var(--color-text-secondary)]">
                Track invoice payment status, send records to QuickBooks, and
                keep invoice history organized.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/quotes" className="us-btn-primary">
                Create Quote
              </Link>
              <Link href="/invoices" className="us-btn-secondary">
                Create Invoice
              </Link>
              <Link href="/invoices/trash" className={invoiceUi.navLink}>
                Open Trash
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className={invoiceUi.card}>
            <p className="text-sm text-[var(--color-text-secondary)]">Saved Count</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{savedInvoices.length}</p>
          </div>

          <div className={invoiceUi.card}>
            <p className="text-sm text-[var(--color-text-secondary)]">Saved Value</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {formatInvoiceCurrency(totalSavedValue)}
            </p>
          </div>
        </section>

        <InvoiceStorageNote className="mt-6" />

        {savedInvoices.length === 0 ? (
          <section className={`mt-8 text-center ${invoiceUi.heroCard}`}>
            <h2 className="text-2xl font-bold">No saved invoices yet</h2>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              Once invoices are saved, they will appear here.
            </p>
            <Link
              href="/invoices"
              className="us-btn-primary mt-6"
            >
              Go to Invoice Center
            </Link>
          </section>
        ) : (
          <section className="mt-8 space-y-4">
            {savedInvoices.map((invoice, index) => (
              <div key={invoice.id} id={invoice.id} className={invoiceUi.heroCard}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="min-w-0 text-2xl font-bold">
                        {getInvoiceTitle(invoice, index)}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${getStatusClasses(
                          getInvoiceStatus(invoice)
                        )}`}
                      >
                        {getInvoiceStatus(invoice)}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${getQuickBooksClasses(
                          getQuickBooksSyncStatus(invoice)
                        )}`}
                      >
                        QuickBooks: {getQuickBooksSyncStatus(invoice)}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-[var(--color-text-secondary)]">
                      <p>Service Type: {invoice.serviceType}</p>
                      <p>Created: {new Date(invoice.createdAt).toLocaleDateString()}</p>
                      <p className="whitespace-nowrap font-semibold text-[var(--color-text)]">
                        Total: {formatInvoiceCurrency(invoice.total || 0)}
                      </p>
                      <p>Payment Status: {getInvoiceStatus(invoice)}</p>
                      {invoice.quickbooks_invoice_id ? (
                        <p>QuickBooks Invoice ID: {invoice.quickbooks_invoice_id}</p>
                      ) : null}
                      {invoice.quickbooks_synced_at || invoice.synced_at ? (
                        <p>
                          Synced:{" "}
                          {new Date(
                            invoice.quickbooks_synced_at || invoice.synced_at || ""
                          ).toLocaleDateString()}
                        </p>
                      ) : null}
                      <p>Payment Method: {invoice.paymentMethod || "Not recorded"}</p>
                      {invoice.convertedFromQuoteId || invoice.converted_from_quote_id ? (
                        <p>
                          Converted From Quote ID:{" "}
                          {invoice.convertedFromQuoteId || invoice.converted_from_quote_id}
                        </p>
                      ) : null}
                      {invoice.paidDate ? (
                        <p>
                          Paid Date: {new Date(invoice.paidDate).toLocaleDateString()}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end">
                    {getInvoiceStatus(invoice) !== "Paid" ? (
                      <button
                        type="button"
                        onClick={() => markAsPaid(invoice)}
                        className="us-btn-primary px-4 py-2"
                      >
                        Mark as Paid
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => printInvoice(invoice, index)}
                      className="us-btn-secondary px-4 py-2"
                    >
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadInvoicePdf(invoice, index)}
                      className="us-btn-secondary px-4 py-2 text-[var(--color-primary)]"
                    >
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingTrashInvoiceId(invoice.id)}
                      className="us-btn-danger px-4 py-2"
                    >
                      Move to Trash
                    </button>
                    <QuickBooksInvoiceActions
                      invoice={invoice}
                      onInvoiceUpdate={updateInvoiceAndRefresh}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
        <DeleteConfirmationModal
          open={Boolean(pendingTrashInvoiceId)}
          onCancel={() => setPendingTrashInvoiceId(null)}
          onConfirm={() => {
            if (pendingTrashInvoiceId) {
              moveToTrashAndRefresh(pendingTrashInvoiceId);
            }
          }}
        />
      </div>
    </main>
  );
}
