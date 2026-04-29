"use client";

import { useEffect, useState } from "react";
import type { InvoiceRecord, PaymentStatus } from "@/lib/invoices";

type Props = {
  invoice: InvoiceRecord;
  onInvoiceUpdate: (invoice: InvoiceRecord) => void;
};

export default function QuickBooksInvoiceActions({
  invoice,
  onInvoiceUpdate,
}: Props) {
  const [loading, setLoading] = useState<"sync" | "refresh" | null>(null);
  const [connected, setConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    fetch("/api/quickbooks/status")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setConnected(Boolean(data.connected));
        if (data.error) {
          setMessage(data.error);
        }
      })
      .catch(() => {
        if (mounted) setMessage("Could not load QuickBooks connection status.");
      })
      .finally(() => {
        if (mounted) setCheckingStatus(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function syncInvoice() {
    try {
      setLoading("sync");
      setMessage("");

      const res = await fetch("/api/quickbooks/sync-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoice }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Sync failed.");
      }

      const updated: InvoiceRecord = {
        ...invoice,
        quickbooks_invoice_id:
          data.quickbooks_invoice_id || invoice.quickbooks_invoice_id,
        quickbooks_customer_id:
          data.quickbooks_customer_id || invoice.quickbooks_customer_id,
        quickbooks_sync_status:
          data.quickbooks_sync_status || (data.alreadySynced ? "already_synced" : "synced"),
        quickbooks_synced_at:
          data.quickbooks_synced_at || invoice.quickbooks_synced_at || new Date().toISOString(),
      };

      onInvoiceUpdate(updated);
      setMessage(data.message || "Sync successful.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setLoading(null);
    }
  }

  async function refreshStatus() {
    if (!invoice.quickbooks_invoice_id) {
      setMessage("Sync to QuickBooks before refreshing status.");
      return;
    }

    try {
      setLoading("refresh");
      setMessage("");

      const res = await fetch("/api/quickbooks/refresh-invoice-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          quickbooksInvoiceId: invoice.quickbooks_invoice_id,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Could not refresh QuickBooks status.");
      }

      const paymentStatus = data.paymentStatus as PaymentStatus;
      const updated: InvoiceRecord = {
        ...invoice,
        paymentStatus,
        payment_status: paymentStatus,
        paidDate:
          paymentStatus === "Paid" && !invoice.paidDate
            ? new Date().toISOString()
            : invoice.paidDate,
      };

      onInvoiceUpdate(updated);
      setMessage(data.message || "QuickBooks status refreshed.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not refresh QuickBooks status."
      );
    } finally {
      setLoading(null);
    }
  }

  const synced = Boolean(invoice.quickbooks_invoice_id);
  const disabled = loading !== null || checkingStatus || !connected;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={syncInvoice}
          disabled={disabled || synced}
          className="us-btn-secondary px-4 py-2 disabled:opacity-50"
        >
          {checkingStatus
            ? "Checking QuickBooks..."
            : synced
            ? "Already Synced"
            : loading === "sync"
            ? "Syncing..."
            : "Sync to QuickBooks"}
        </button>
        <button
          type="button"
          onClick={refreshStatus}
          disabled={disabled || !synced}
          className="us-btn-secondary px-4 py-2 disabled:opacity-50"
        >
          {loading === "refresh"
            ? "Refreshing..."
            : "Refresh QuickBooks Status"}
        </button>
      </div>
      {message ? (
        <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
      ) : !checkingStatus && !connected ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Connect QuickBooks in Settings before syncing invoices.
        </p>
      ) : null}
    </div>
  );
}
