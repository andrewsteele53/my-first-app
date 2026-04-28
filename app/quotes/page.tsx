"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { invoiceUi } from "@/lib/invoice-ui";
import { getSavedQuotes, getTrashedQuotes } from "@/lib/quotes";

const quoteTypes = [
  ["Automotive Mechanic Quote", "/quotes/automotive-mechanic", "Repair, diagnostic, parts, and shop labor estimates."],
  ["Airline Mechanic Quote", "/quotes/airline-mechanic", "Maintenance, inspection, parts, and aviation labor proposals."],
  ["Power Sports Mechanic Quote", "/quotes/power-sports-mechanic", "ATV, UTV, motorcycle, jet ski, and small engine quotes."],
  ["Construction Quote", "/quotes/construction", "Project scope, labor, material, and phase estimates."],
  ["Handyman Quote", "/quotes/handyman", "Repairs, installs, maintenance, and small project proposals."],
  ["Power Washing Quote", "/quotes/powerwashing", "Exterior cleaning, concrete, siding, patio, and deck estimates."],
  ["Gutter Cleaning Quote", "/quotes/gutter-cleaning", "Gutter cleaning, downspout, and repair estimates."],
  ["Cleaning Quote", "/quotes/cleaning", "Residential and commercial cleaning proposals."],
  ["Car Detailing Quote", "/quotes/car-detailing", "Interior, exterior, full detail, and package estimates."],
  ["Lawn Care Quote", "/quotes/lawn-care", "Mowing, edging, cleanup, and recurring service quotes."],
  ["Saved Quotes", "/quotes/saved", "Review quote statuses and convert approved quotes to invoices."],
  ["Quote Trash", "/quotes/trash", "Restore or permanently delete trashed quotes."],
] as const;

export default function QuotesPage() {
  const [savedCount, setSavedCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSavedCount(getSavedQuotes().length);
      setTrashCount(getTrashedQuotes().length);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <main className={invoiceUi.page}>
      <div className={invoiceUi.container}>
        <section className={invoiceUi.heroCard}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                Quotes
              </p>
              <h1 className="mt-2 text-4xl font-bold">Quote Center</h1>
              <p className="mt-3 max-w-2xl text-[var(--color-text-secondary)]">
                Create estimates and proposals before work is approved, then convert
                approved quotes into invoices when the job is ready.
              </p>
            </div>
            <Link href="/" className={invoiceUi.navLink}>
              Back to Dashboard
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className={invoiceUi.card}>
            <p className="text-sm text-[var(--color-text-secondary)]">Saved Quote Count</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{savedCount}</p>
          </div>
          <div className={invoiceUi.card}>
            <p className="text-sm text-[var(--color-text-secondary)]">Trash Count</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{trashCount}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {quoteTypes.map(([title, href, description]) => (
            <div key={href} className={invoiceUi.heroCard}>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="mt-3 text-[var(--color-text-secondary)]">{description}</p>
              <Link href={href} className="us-btn-primary mt-6 w-full text-sm">
                Open Section
              </Link>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
