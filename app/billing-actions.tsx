"use client";

import { useState } from "react";

type Props = {
  isSubscribed: boolean;
  isTrialing?: boolean;
};

export default function BillingActions({ isSubscribed, isTrialing = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleManageBilling() {
    let didRedirect = false;

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/billing-portal", {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to open billing portal.");
      }

      if (data.url) {
        didRedirect = true;
        window.location.href = data.url;
        return;
      }

      throw new Error("Billing portal did not return a redirect URL.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      if (!didRedirect) {
        setLoading(false);
      }
    }
  }

  async function handleStartTrial() {
    let didRedirect = false;

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ origin: window.location.origin }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to start checkout.");
      }

      if (!data.url) {
        throw new Error("Checkout did not return a redirect URL.");
      }

      didRedirect = true;
      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      if (!didRedirect) {
        setLoading(false);
      }
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {isSubscribed || isTrialing ? (
        <button
          type="button"
          onClick={handleManageBilling}
          disabled={loading}
          className="us-btn-primary min-w-36 text-sm disabled:opacity-50"
        >
          {loading ? "Opening Portal..." : "Manage Billing"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleStartTrial}
          disabled={loading}
          className="us-btn-primary min-w-36 text-sm disabled:opacity-50"
        >
          {loading ? "Starting Trial..." : "Start Free Trial"}
        </button>
      )}

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
}
