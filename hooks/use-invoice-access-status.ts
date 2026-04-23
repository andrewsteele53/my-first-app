"use client";

import { useEffect, useState } from "react";

export type InvoiceAccessStatus = {
  isSubscribed: boolean;
  subscriptionStatus: string;
  used: number;
  limit: number;
  remaining: number | null;
};

export function useInvoiceAccessStatus() {
  const [status, setStatus] = useState<InvoiceAccessStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch("/api/free-invoices/status", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        setLoading(false);
        return null;
      }

      const data = (await res.json()) as InvoiceAccessStatus;
      setStatus(data);
      setLoading(false);
      return data;
    } catch {
      setLoading(false);
      return null;
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return {
    status,
    loading,
    refresh,
    setStatus,
  };
}
