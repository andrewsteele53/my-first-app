"use client";

import { useState } from "react";
import type { WebsiteCheckoutType } from "@/lib/website-stripe";

type CheckoutStatus = "idle" | "loading" | "error";

export function useWebsiteCheckout() {
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [error, setError] = useState("");

  async function startCheckout(type: WebsiteCheckoutType) {
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
          type,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error ||
            "We could not start checkout right now. Please contact us to start your project."
        );
      }

      if (!data.url) {
        throw new Error(
          "We could not start checkout right now. Please contact us to start your project."
        );
      }

      didRedirect = true;
      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not start checkout right now. Please contact us to start your project."
      );
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
