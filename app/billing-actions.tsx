"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  isSubscribed: boolean;
  isTrialing?: boolean;
};

export default function BillingActions({ isSubscribed, isTrialing = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleManageBilling() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/billing-portal", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to open billing portal.");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {isSubscribed || isTrialing ? (
        <button
          onClick={handleManageBilling}
          disabled={loading}
          className="us-btn-primary min-w-36 text-sm disabled:opacity-50"
        >
          {loading ? "Opening Portal..." : "Manage Billing"}
        </button>
      ) : (
        <Link
          href="/subscribe"
          className="us-btn-primary min-w-36 text-sm"
        >
          Start Free Trial
        </Link>
      )}

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
}
