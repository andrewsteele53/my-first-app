"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { invoiceUi } from "@/lib/invoice-ui";
import {
  type QuoteRecord,
  convertQuoteToInvoice,
  formatInvoiceCurrency,
  getDaysUntilQuoteTrash,
  getSavedQuotes,
  moveQuoteToTrash,
} from "@/lib/quotes";

function getQuoteTitle(quote: QuoteRecord, index: number) {
  return quote.quoteNumber || quote.customerName || quote.projectTitle || `Quote ${index + 1}`;
}

export default function SavedQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setQuotes(getSavedQuotes()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const totalSavedValue = useMemo(
    () => quotes.reduce((sum, quote) => sum + quote.total, 0),
    [quotes]
  );

  function moveToTrashAndRefresh(id: string) {
    const next = moveQuoteToTrash(id);
    setQuotes(next.saved);
  }

  function convertAndRefresh(quote: QuoteRecord) {
    const isAlreadyConverted = quote.status === "Converted" || Boolean(quote.convertedInvoiceId);
    const allowDuplicate =
      !isAlreadyConverted ||
      window.confirm(
        "This quote has already been converted to an invoice. Create another invoice from it?"
      );

    if (!allowDuplicate) return;

    const result = convertQuoteToInvoice(quote.id, { allowDuplicate: isAlreadyConverted });
    if (!result) return;
    setQuotes(getSavedQuotes());
    setMessage(`Converted ${result.quote.quoteNumber} to invoice ${result.invoice.invoiceNumber}.`);
    router.push(`/invoices/saved#${encodeURIComponent(result.invoice.id)}`);
  }

  return (
    <main className={invoiceUi.page}>
      <div className={invoiceUi.container}>
        <section className={invoiceUi.heroCard}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                Quotes
              </p>
              <h1 className="mt-2 text-4xl font-bold">Saved Quotes</h1>
              <p className="mt-3 max-w-2xl text-[var(--color-text-secondary)]">
                Track quote status, move old quotes to trash, and convert approved
                quotes into invoice records.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/quotes" className={invoiceUi.navLink}>
                Back to Quotes
              </Link>
              <Link href="/quotes/trash" className={invoiceUi.navLink}>
                Open Trash
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className={invoiceUi.card}>
            <p className="text-sm text-[var(--color-text-secondary)]">Saved Count</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{quotes.length}</p>
          </div>
          <div className={invoiceUi.card}>
            <p className="text-sm text-[var(--color-text-secondary)]">Saved Value</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {formatInvoiceCurrency(totalSavedValue)}
            </p>
          </div>
        </section>

        {message ? <div className="us-notice-success mt-6 text-sm">{message}</div> : null}

        {quotes.length === 0 ? (
          <section className={`mt-8 text-center ${invoiceUi.heroCard}`}>
            <h2 className="text-2xl font-bold">No saved quotes yet</h2>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              Once quotes are saved, they will appear here.
            </p>
            <Link href="/quotes" className="us-btn-primary mt-6">
              Go to Quote Center
            </Link>
          </section>
        ) : (
          <section className="mt-8 space-y-4">
            {quotes.map((quote, index) => (
              <div key={quote.id} className={invoiceUi.heroCard}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold">{getQuoteTitle(quote, index)}</h2>
                      {quote.status === "Converted" || quote.convertedInvoiceId ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                          Converted to Invoice
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-[var(--color-text-secondary)]">
                      <p>Quote Type: {quote.quoteType}</p>
                      <p>Status: {quote.status}</p>
                      <p>Customer: {quote.customerName || "Not recorded"}</p>
                      <p>Total: {formatInvoiceCurrency(quote.total)}</p>
                      <p>Days Until Trash: {getDaysUntilQuoteTrash(quote.moveToTrashAfter)}</p>
                      {quote.convertedInvoiceId ? (
                        <p>Converted Invoice ID: {quote.convertedInvoiceId}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => convertAndRefresh(quote)}
                      className="us-btn-primary px-4 py-2"
                    >
                      {quote.status === "Converted" || quote.convertedInvoiceId
                        ? "Convert Again"
                        : "Convert to Invoice"}
                    </button>
                    <button
                      type="button"
                      onClick={() => moveToTrashAndRefresh(quote.id)}
                      className="us-btn-danger px-4 py-2"
                    >
                      Move to Trash
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
