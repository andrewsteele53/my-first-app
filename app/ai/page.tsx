"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type AIUsage = {
  used: number;
  limit: number;
  remaining: number;
  resetDate: string | null;
};

export default function AIAssistantPage() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<AIUsage | null>(null);

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
        body: JSON.stringify({ message: trimmedMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI request failed.");
      }

      setAnswer(data.answer || "No answer was returned.");
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
                Ask for help with invoices, lead follow-ups, sales mapping,
                customer messages, or what to prioritize next.
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
                placeholder="Example: Help me write a follow-up text for a pressure washing lead who asked for pricing last week."
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
              {loading ? "Thinking..." : "Ask AI Assistant"}
            </button>
          </form>

          {error ? (
            <div className="us-notice-danger mt-5 text-sm">{error}</div>
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
