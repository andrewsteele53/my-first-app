"use client";

import { useState } from "react";
import type { WebsiteCheckoutItem } from "@/lib/website-stripe";

type CheckoutStatus = "idle" | "loading" | "error";

export function useWebsiteCheckout() {
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [error, setError] = useState("");

  async function startCheckout(item: WebsiteCheckoutItem) {
    let didRedirect = false;

    try {
      setStatus("loading");
      setError("");

      const res = await fetch("/api/website-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item,
          origin: window.location.origin,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Website checkout is not ready yet.");
      }

      if (!data.url) {
        throw new Error("Website checkout did not return a redirect URL.");
      }

      didRedirect = true;
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      if (!didRedirect) {
        setStatus("error");
      }
    }
  }

  return {
    error,
    isLoading: status === "loading",
    startCheckout,
    status,
  };
}
