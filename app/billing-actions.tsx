"use client";

import { useState } from "react";

type Props = {
  isSubscribed: boolean;
  isTrialing?: boolean;
  canManageBilling?: boolean;
  showSetupBilling?: boolean;
  showStartProNow?: boolean;
};

export default function BillingActions({
  isSubscribed,
  isTrialing = false,
  canManageBilling = true,
  showSetupBilling = false,
  showStartProNow = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [proLoading, setProLoading] = useState(false);
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
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(
        message.includes("Stripe customer")
          ? "Set up billing before opening the billing portal."
          : message
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

  async function handleSetupBilling() {
    let didRedirect = false;

    try {
      setSetupLoading(true);
      setError("");

      const customerRes = await fetch("/api/billing/create-customer", {
        method: "POST",
      });

      const customerData = await customerRes.json().catch(() => ({}));

      if (!customerRes.ok) {
        throw new Error(customerData.error || "Could not set up billing.");
      }

      const portalRes = await fetch("/api/billing-portal", {
        method: "POST",
      });

      const portalData = await portalRes.json().catch(() => ({}));

      if (!portalRes.ok) {
        throw new Error(
          portalData.error || "Billing was set up, but the portal could not open."
        );
      }

      if (!portalData.url) {
        throw new Error("Billing portal did not return a redirect URL.");
      }

      didRedirect = true;
      window.location.href = portalData.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      if (!didRedirect) {
        setSetupLoading(false);
      }
    }
  }

  async function handleStartProNow() {
    let didRedirect = false;

    try {
      setProLoading(true);
      setError("");

      const res = await fetch("/api/start-pro-now", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ origin: window.location.origin }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Could not start Pro now.");
      }

      if (!data.url) {
        throw new Error("Start Pro did not return a redirect URL.");
      }

      didRedirect = true;
      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      if (!didRedirect) {
        setProLoading(false);
      }
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {isSubscribed || isTrialing ? (
        <>
          {canManageBilling ? (
            <button
              type="button"
              onClick={handleManageBilling}
              disabled={loading || setupLoading || proLoading}
              className="us-btn-primary min-w-36 text-sm disabled:opacity-50"
            >
              {loading ? "Opening Portal..." : "Manage Billing"}
            </button>
          ) : null}

          {showSetupBilling ? (
            <button
              type="button"
              onClick={handleSetupBilling}
              disabled={loading || setupLoading || proLoading}
              className="us-btn-primary min-w-36 text-sm disabled:opacity-50"
            >
              {setupLoading ? "Setting Up..." : "Set Up Billing"}
            </button>
          ) : null}

          {showStartProNow ? (
            <button
              type="button"
              onClick={handleStartProNow}
              disabled={loading || setupLoading || proLoading}
              className="us-btn-secondary min-w-36 text-sm disabled:opacity-50"
            >
              {proLoading ? "Starting Pro..." : "Start Pro Now"}
            </button>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          onClick={handleStartTrial}
          disabled={loading || setupLoading || proLoading}
          className="us-btn-primary min-w-36 text-sm disabled:opacity-50"
        >
          {loading ? "Starting Trial..." : "Start Free Trial"}
        </button>
      )}

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
    </div>
  );
}
