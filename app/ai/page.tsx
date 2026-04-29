"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import AIActionPreviewCard from "@/components/ai-action-preview-card";
import { getSavedQuotes } from "@/lib/quotes";
import type { AIActionPreview } from "@/lib/ai/schemas";

type AIUsage = {
  used: number;
  limit: number;
  remaining: number;
  resetDate: string | null;
};

export default function AIAssistantPage() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [actionPreview, setActionPreview] = useState<AIActionPreview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  async function refreshUsage() {
    try {
      const response = await fetch("/api/ai/usage");

      if (!response.ok) return;

      const data = await response.json();
      setUsage(data);
    } catch {
      // Usage display is helpful but should not block the assistant.
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadUsage() {
      try {
        const response = await fetch("/api/ai/usage");

        if (!response.ok) return;

        const data = await response.json();

        if (isMounted) {
          setUsage(data);
        }
      } catch {
        // Usage display is helpful but should not block the assistant.
      }
    }

    void loadUsage();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setAnswer("");
    setActionPreview(null);
    setStatusMessage("");

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Please enter a question or task for the assistant.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "action",
          message: trimmedMessage,
          context: {
            savedQuotes: getSavedQuotes().slice(0, 8).map((quote) => ({
              id: quote.id,
              quoteNumber: quote.quoteNumber,
              customerName: quote.customerName,
              quoteType: quote.quoteType,
              projectTitle: quote.projectTitle,
              items: quote.items,
              subtotal: quote.subtotal,
              taxRate: quote.taxRate,
              taxAmount: quote.taxAmount,
              total: quote.total,
              notes: quote.notes,
              status: quote.status,
            })),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI request failed.");
      }

      if (data.mode === "action" && data.preview) {
        setActionPreview(data.preview);
      } else {
        setAnswer(data.answer || "No answer was returned.");
      }

      await refreshUsage();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to reach the AI assistant."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="us-page">
      <div className="us-shell">
        <section className="rounded-[1.9rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                AI Assistant
              </p>
              <h1 className="mt-2 text-3xl font-extrabold text-[var(--color-text)]">
                Service Business Assistant
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Ask for help creating quotes, invoices, leads, sales mapping
                notes, follow-up messages, or next-step business plans. AI
                previews everything first so you decide what gets saved.
              </p>
            </div>

            <Link href="/" className="us-btn-secondary text-sm">
              Back to Dashboard
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label
                htmlFor="ai-message"
                className="mb-2 block text-sm font-semibold text-[var(--color-text)]"
              >
                What do you want help with?
              </label>
              <textarea
                id="ai-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Example: Create a quote for gutter cleaning: 2-story house, 180 linear feet, 4 downspouts."
                className="us-textarea min-h-[160px]"
              />
              {usage ? (
                <p className="mt-2 text-sm font-semibold text-[var(--color-text-secondary)]">
                  AI requests remaining this month: {usage.remaining} / {usage.limit}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="us-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Thinking..." : "Start Running Your Business Smarter"}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Make an invoice for John Smith for lawn care, $150, due in 7 days.",
              "Add a lead for Mike's Towing in Schaumburg. They use QuickBooks and may need invoicing.",
              "Write a follow-up message for a roofing contractor who hasn't responded.",
              "Create sales mapping notes for towing companies near Schaumburg.",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setMessage(suggestion)}
                className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {error ? (
            <div className="us-notice-danger mt-5 text-sm">{error}</div>
          ) : null}

          {statusMessage ? (
            <div className="us-notice-info mt-5 text-sm">{statusMessage}</div>
          ) : null}

          {actionPreview ? (
            <AIActionPreviewCard
              preview={actionPreview}
              onCancel={() => setActionPreview(null)}
              onSaved={setStatusMessage}
            />
          ) : null}

          {answer ? (
            <section className="mt-6 rounded-[1.4rem] border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-5 shadow-[var(--shadow-card-soft)]">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                Answer
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--color-text)]">
                {answer}
              </p>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}
