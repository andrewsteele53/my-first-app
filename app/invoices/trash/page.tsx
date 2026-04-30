"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  InvoiceRecord,
  emptyInvoiceTrash,
  formatInvoiceCurrency,
  getDaysUntilInvoiceDeletion,
  getSavedInvoices,
  getTrashedInvoices,
  permanentlyDeleteInvoice,
  restoreInvoiceFromTrash,
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

export default function TrashInvoicesPage() {
  const [trashInvoices, setTrashInvoices] = useState<InvoiceRecord[]>([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      getSavedInvoices();
      setTrashInvoices(getTrashedInvoices());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const trashValue = useMemo(
    () => trashInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0),
    [trashInvoices]
  );

  function handleRestore(invoiceId: string) {
    const next = restoreInvoiceFromTrash(invoiceId);
    setTrashInvoices(next.trash);
  }

  function handlePermanentDelete(invoiceId: string) {
    setTrashInvoices(permanentlyDeleteInvoice(invoiceId));
  }

  function handleEmptyTrash() {
    setTrashInvoices(emptyInvoiceTrash());
  }

  return (
    <main className={invoiceUi.page}>
      <div className={invoiceUi.container}>
        <section className={invoiceUi.heroCard}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                Invoices
              </p>
              <h1 className="mt-2 text-4xl font-bold">Trash</h1>
              <p className="mt-3 max-w-2xl text-[var(--color-text-secondary)]">
                Restore deleted invoices or permanently remove them. Trash clears
                automatically after 30 days.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/invoices" className={invoiceUi.navLink}>
                Back to Invoices
              </Link>
              <Link href="/invoices/saved" className={invoiceUi.navLink}>
                Open Saved
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className={invoiceUi.card}>
            <p className="text-sm text-[var(--color-text-secondary)]">Trash Count</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{trashInvoices.length}</p>
          </div>

          <div className={invoiceUi.card}>
            <p className="text-sm text-[var(--color-text-secondary)]">Trash Value</p>
            <p className="mt-2 text-3xl font-bold text-orange-600">
              {formatInvoiceCurrency(trashValue)}
            </p>
          </div>
        </section>

        <section className="us-notice-warning mt-6 p-5 text-sm">
          Items in Trash are automatically deleted after 30 days and cannot be
          restored after deletion.
        </section>

        {trashInvoices.length > 0 ? (
          <section className="mt-6">
            <button
              type="button"
              onClick={handleEmptyTrash}
              className="us-btn-danger"
            >
              Empty Trash
            </button>
          </section>
        ) : null}

        {trashInvoices.length === 0 ? (
          <section className={`mt-8 text-center ${invoiceUi.heroCard}`}>
            <h2 className="text-2xl font-bold">Trash is empty</h2>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              Deleted invoices will appear here until they are restored or removed.
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
            {trashInvoices.map((invoice, index) => (
              <div key={invoice.id} className={invoiceUi.heroCard}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{getInvoiceTitle(invoice, index)}</h2>
                    <div className="mt-3 space-y-1 text-sm text-[var(--color-text-secondary)]">
                      <p>Service Type: {invoice.serviceType}</p>
                      <p>
                        Deleted:{" "}
                        {invoice.trashedAt
                          ? new Date(invoice.trashedAt).toLocaleDateString()
                          : "Recently"}
                      </p>
                      <p>Days Left: {getDaysUntilInvoiceDeletion(invoice.deleteAfter)}</p>
                      <p>Total: {formatInvoiceCurrency(invoice.total || 0)}</p>
                      <p>Payment Status: {invoice.paymentStatus}</p>
                      <p>Payment Method: {invoice.paymentMethod || "Not recorded"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleRestore(invoice.id)}
                      className="us-btn-success px-4 py-2"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePermanentDelete(invoice.id)}
                      className="us-btn-danger px-4 py-2"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
