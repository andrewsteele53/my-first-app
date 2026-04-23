"use client";

import { useState } from "react";
import type {
  AIAssistRequest,
  AIAssistResponse,
  AIErrorResponse,
} from "@/lib/ai/schemas";

export function useAIAssistant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<AIAssistResponse | null>(null);

  async function runAssistant(request: AIAssistRequest) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data = (await res.json()) as AIAssistResponse | AIErrorResponse;

      if (!res.ok || !("ok" in data) || data.ok === false) {
        throw new Error(
          "error" in data ? data.error : "Unable to complete AI request."
        );
      }

      setResponse(data);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to complete AI request.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  function clearResponse() {
    setResponse(null);
    setError("");
  }

  return {
    loading,
    error,
    response,
    runAssistant,
    clearResponse,
  };
}
