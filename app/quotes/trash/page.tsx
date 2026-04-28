"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { invoiceUi } from "@/lib/invoice-ui";
import {
  type QuoteRecord,
  emptyQuoteTrash,
  formatInvoiceCurrency,
  getDaysUntilQuoteDeletion,
  getTrashedQuotes,
  permanentlyDeleteQuote,
  restoreQuoteFromTrash,
} from "@/lib/quotes";

export default function QuoteTrashPage() {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setQuotes(getTrashedQuotes()), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const trashValue = useMemo(
    () => quotes.reduce((sum, quote) => sum + quote.total, 0),
    [quotes]
  );

  return (
    <main className={invoiceUi.page}>
      <div className={invoiceUi.container}>
        <section className={invoiceUi.heroCard}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                Quotes
              </p>
              <h1 className="mt-2 text-4xl font-bold">Quote Trash</h1>
              <p className="mt-3 max-w-2xl text-[var(--color-text-secondary)]">
                Restore deleted quotes or permanently remove them.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/quotes" className={invoiceUi.navLink}>
                Back to Quotes
              </Link>
              <Link href="/quotes/saved" className={invoiceUi.navLink}>
                Open Saved
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className={invoiceUi.card}>
            <p className="text-sm text-[var(--color-text-secondary)]">Trash Count</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{quotes.length}</p>
          </div>
          <div className={invoiceUi.card}>
            <p className="text-sm text-[var(--color-text-secondary)]">Trash Value</p>
            <p className="mt-2 text-3xl font-bold text-orange-600">
              {formatInvoiceCurrency(trashValue)}
            </p>
          </div>
        </section>

        {quotes.length > 0 ? (
          <section className="mt-6">
            <button type="button" onClick={() => setQuotes(emptyQuoteTrash())} className="us-btn-danger">
              Empty Trash
            </button>
          </section>
        ) : null}

        {quotes.length === 0 ? (
          <section className={`mt-8 text-center ${invoiceUi.heroCard}`}>
            <h2 className="text-2xl font-bold">Quote trash is empty</h2>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              Deleted quotes will appear here until restored or removed.
            </p>
            <Link href="/quotes" className="us-btn-primary mt-6">
              Go to Quote Center
            </Link>
          </section>
        ) : (
          <section className="mt-8 space-y-4">
            {quotes.map((quote) => (
              <div key={quote.id} className={invoiceUi.heroCard}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {quote.quoteNumber || quote.customerName || quote.quoteType}
                    </h2>
                    <div className="mt-3 space-y-1 text-sm text-[var(--color-text-secondary)]">
                      <p>Quote Type: {quote.quoteType}</p>
                      <p>Status: {quote.status}</p>
                      <p>Total: {formatInvoiceCurrency(quote.total)}</p>
                      <p>Days Left: {getDaysUntilQuoteDeletion(quote.deleteAfter)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setQuotes(restoreQuoteFromTrash(quote.id).trash)}
                      className="us-btn-success px-4 py-2"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuotes(permanentlyDeleteQuote(quote.id))}
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
