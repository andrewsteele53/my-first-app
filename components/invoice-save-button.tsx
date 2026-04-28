"use client";

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
  const { status, refresh } = useInvoiceAccessStatus();

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

      if (!currentStatus.hasCoreAccess) {
        setShowUpgradePrompt(true);
        setError("Start your trial or subscribe to save invoices.");
        return;
      }

      const invoice = await Promise.resolve(buildInvoice());

      if (!invoice) {
        return;
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
          {status.hasCoreAccess
            ? status.isTrialing
              ? "Trial access includes unlimited invoice saves."
              : "Unlimited invoices on your active plan."
            : "Invoice saves require trial or active plan access."}
        </p>
      ) : null}

      {showUpgradePrompt ? (
        <div className="us-notice-info text-sm">
          <p className="font-semibold">Upgrade to keep creating invoices</p>
          <p className="mt-1">
            Start your trial or subscribe to unlock invoice saves and the core
            business tools.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
}
