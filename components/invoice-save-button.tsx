"use client";

import Link from "next/link";
import { useState } from "react";
import { InvoiceRecord, saveInvoiceRecord } from "@/lib/invoices";
import { useInvoiceAccessStatus } from "@/hooks/use-invoice-access-status";

type Props = {
  buildInvoice: () => Promise<InvoiceRecord | null> | InvoiceRecord | null;
  onSaved?: (invoice: InvoiceRecord) => void;
  className?: string;
  idleLabel?: string;
  loadingLabel?: string;
};

export default function InvoiceSaveButton({
  buildInvoice,
  onSaved,
  className = "",
  idleLabel = "Save Invoice",
  loadingLabel = "Saving...",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const { status, refresh, setStatus } = useInvoiceAccessStatus();

  async function handleClick() {
    try {
      setLoading(true);
      setError("");
      setShowUpgradePrompt(false);

      const currentStatus = await refresh();

      if (!currentStatus) {
        setError(
          "We couldn't verify your invoice access right now. Please refresh and try again."
        );
        return;
      }

      if (
        !currentStatus.isSubscribed &&
        typeof currentStatus.remaining === "number" &&
        currentStatus.remaining <= 0
      ) {
        setShowUpgradePrompt(true);
        setError("You have reached the 5-invoice free limit.");
        return;
      }

      const invoice = await Promise.resolve(buildInvoice());

      if (!invoice) {
        return;
      }

      if (!currentStatus.isSubscribed) {
        const useRes = await fetch("/api/free-invoices/use", {
          method: "POST",
        });

        const useData = await useRes.json();

        if (!useRes.ok) {
          if (useRes.status === 402) {
            setStatus({
              isSubscribed: false,
              subscriptionStatus: currentStatus.subscriptionStatus || "inactive",
              used: useData.used ?? currentStatus.used,
              limit: useData.limit ?? currentStatus.limit,
              remaining: 0,
            });
            setShowUpgradePrompt(true);
            setError(useData.error || "You have reached the free invoice limit.");
            return;
          }

          throw new Error(useData.error || "Could not update free invoice usage.");
        }

        setStatus({
          isSubscribed: false,
          subscriptionStatus: currentStatus.subscriptionStatus || "inactive",
          used: useData.used,
          limit: useData.limit,
          remaining: useData.remaining,
        });
      }

      const savedInvoice = saveInvoiceRecord(invoice);
      onSaved?.(savedInvoice);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const remaining =
    status && !status.isSubscribed ? Math.max(status.limit - status.used, 0) : null;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? loadingLabel : idleLabel}
      </button>

      {status ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          {status.isSubscribed
            ? "Unlimited invoices on your active plan."
            : `${remaining} of ${status.limit} free invoices remaining.`}
        </p>
      ) : null}

      {showUpgradePrompt ? (
        <div className="us-notice-info text-sm">
          <p className="font-semibold">Upgrade to keep creating invoices</p>
          <p className="mt-1">
            You have used all 5 free invoices across your account. Upgrade to Pro
            for unlimited invoice saves.
          </p>
          <Link
            href="/subscribe"
            className="us-btn-primary mt-3 px-4 py-2"
          >
            Upgrade Now
          </Link>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
}
