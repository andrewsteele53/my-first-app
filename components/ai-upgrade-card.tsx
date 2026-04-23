"use client";

import Link from "next/link";

type Props = {
  title?: string;
  description?: string;
};

export default function AIUpgradeCard({
  title = "AI is available on Pro",
  description = "Upgrade your account to unlock AI writing assistance across invoices, leads, mapping, and your dashboard workspace.",
}: Props) {
  return (
    <section className="rounded-[1.9rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
        AI Assistant
      </p>
      <h2 className="mt-2 text-2xl font-bold text-[var(--color-text)]">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
        {description}
      </p>

      <div className="mt-6 rounded-[1.4rem] border border-[rgba(47,93,138,0.18)] bg-[rgba(47,93,138,0.08)] p-5">
        <p className="text-sm font-semibold text-[var(--color-primary)]">
          Premium AI features include:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--color-text)]">
          <li>Professional invoice wording and line-item suggestions</li>
          <li>Lead follow-up messages and call scripts</li>
          <li>Territory summaries, route plans, and pitch suggestions</li>
          <li>Lightweight business guidance from your dashboard</li>
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/subscribe" className="us-btn-primary">
          Upgrade to Pro
        </Link>
        <Link href="/settings" className="us-btn-secondary">
          View Plan Details
        </Link>
      </div>
    </section>
  );
}
