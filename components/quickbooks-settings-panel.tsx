"use client";

import { useEffect, useState } from "react";

type QuickBooksStatus = {
  connected: boolean;
  realmId: string | null;
  connectedAt: string | null;
};

type Props = {
  hasProAccess: boolean;
};

export default function QuickBooksSettingsPanel({ hasProAccess }: Props) {
  const [status, setStatus] = useState<QuickBooksStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!hasProAccess) return;

    let mounted = true;
    fetch("/api/quickbooks/status")
      .then((res) => res.json())
      .then((data) => {
        if (mounted && !data.error) {
          setStatus(data);
        }
      })
      .catch(() => {
        if (mounted) setMessage("Could not load QuickBooks status.");
      });

    return () => {
      mounted = false;
    };
  }, [hasProAccess]);

  async function disconnect() {
    try {
      setLoading(true);
      setMessage("");
      const res = await fetch("/api/quickbooks/disconnect", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Could not disconnect QuickBooks.");
      }

      setStatus({ connected: false, realmId: null, connectedAt: null });
      setMessage("QuickBooks disconnected.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not disconnect QuickBooks."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!hasProAccess) {
    return (
      <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          QuickBooks
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">
          QuickBooks Online
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          QuickBooks integration is available with Pro access.
        </p>
      </div>
    );
  }

  const connected = Boolean(status?.connected);

  return (
    <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
        QuickBooks
      </p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--color-text)]">
            QuickBooks Online
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
            {connected
              ? "Connected. You can sync saved invoices and refresh payment status."
              : "Not connected. Connect QuickBooks to sync customers and invoices."}
          </p>
          {status?.realmId ? (
            <p className="mt-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              Company ID: {status.realmId}
            </p>
          ) : null}
        </div>
        <span
          className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${
            connected
              ? "border-[rgba(46,125,90,0.18)] bg-[rgba(46,125,90,0.1)] text-[var(--color-success)]"
              : "border-[rgba(183,121,31,0.18)] bg-[rgba(183,121,31,0.1)] text-[var(--color-warning)]"
          }`}
        >
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {connected ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={loading}
            className="us-btn-secondary disabled:opacity-50"
          >
            {loading ? "Disconnecting..." : "Disconnect"}
          </button>
        ) : (
          <a href="/api/quickbooks/connect" className="us-btn-primary">
            Connect QuickBooks
          </a>
        )}
      </div>

      {message ? (
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
