"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import AIActionPreviewCard from "@/components/ai-action-preview-card";
import AILeadResultsTable from "@/components/ai-lead-results-table";
import {
  CUSTOMER_FINDER_BUSINESS_TYPES,
  getDefaultCustomerFinderBusinessType,
  type CustomerFinderBusinessType,
  type CustomerFinderLead,
} from "@/lib/customer-finder";
import { getSavedQuotes } from "@/lib/quotes";
import type { AIActionPreview } from "@/lib/ai/schemas";

type AIUsage = {
  used: number;
  limit: number;
  remaining: number;
  resetDate: string | null;
};

const BATCH_LEAD_TRIGGERS = [
  /\bgenerate\s+multiple\s+leads?\b/i,
  /\bfind(?:\s+me)?\s+(?:\d+\s+)?leads?\b/i,
  /\bfind(?:\s+me)?\s+(?:\d+\s+)?customers?\b/i,
  /\bgenerate\s+(?:\d+\s+)?leads?\b/i,
  /\bget\s+(?:\d+\s+)?leads?\b/i,
  /\bfind(?:\s+me)?\s+\d+\s+customers?\b/i,
  /\bshow\s+me\s+leads?\b/i,
  /\bget\s+potential\s+customers?\b/i,
];

const SINGLE_LEAD_TRIGGERS = [
  /\bcreate\s+(?:a\s+|one\s+|new\s+)?lead\b/i,
  /\badd\s+(?:a\s+|one\s+|new\s+)?lead\b/i,
  /\bmake\s+(?:a\s+|one\s+|new\s+)?lead\b/i,
];

const BUSINESS_TYPE_ALIASES: Array<{
  pattern: RegExp;
  businessType: CustomerFinderBusinessType;
}> = [
  { pattern: /\broof/i, businessType: "Roofing" },
  { pattern: /\bsiding/i, businessType: "Siding" },
  { pattern: /\bgutters?\b/i, businessType: "Gutters" },
  { pattern: /\blandscap|lawn/i, businessType: "Landscaping / Lawn Care" },
  { pattern: /\bhvac|heating|cooling/i, businessType: "HVAC" },
  { pattern: /\bplumb/i, businessType: "Plumbing" },
  { pattern: /\belectric/i, businessType: "Electrical" },
  { pattern: /\bdetail/i, businessType: "Auto Detailing" },
  { pattern: /\bauto repair|mechanic\b/i, businessType: "Auto Repair" },
  { pattern: /\bpower sports|powersports|atv|utv|motorcycle/i, businessType: "Power Sports Mechanic" },
  { pattern: /\btowing|tow\b/i, businessType: "Towing" },
  { pattern: /\bclean/i, businessType: "Residential / Commercial Cleaning" },
  { pattern: /\bjunk/i, businessType: "Junk Removal" },
  { pattern: /\bhandyman/i, businessType: "Handyman" },
  { pattern: /\bgeneral contractor|contractor|construction/i, businessType: "General Contractor" },
];

function isBatchLeadGenerationRequest(value: string) {
  if (SINGLE_LEAD_TRIGGERS.some((trigger) => trigger.test(value))) {
    return false;
  }

  const hasLeadOrCustomerPhrase = /\b(?:leads?|customers?)\b/i.test(value);
  const hasGenerationVerb = /\b(?:find|generate|get|show\s+me)\b/i.test(value);
  const hasNumber = /\b\d+\b/.test(value);

  return (
    BATCH_LEAD_TRIGGERS.some((trigger) => trigger.test(value)) ||
    (hasNumber && hasGenerationVerb && hasLeadOrCustomerPhrase)
  );
}

function getRequestedLeadCount(value: string) {
  const numericMatch = value.match(/\b(\d+)\b/);
  const wordMatch = value
    .toLowerCase()
    .match(/\b(five|ten|twenty)\b/);
  const wordCounts: Record<string, number> = {
    five: 5,
    ten: 10,
    twenty: 20,
  };
  const count = numericMatch
    ? Number.parseInt(numericMatch[1], 10)
    : wordMatch
    ? wordCounts[wordMatch[1]]
    : 5;

  return Number.isFinite(count) ? Math.min(Math.max(count, 1), 20) : 5;
}

function getRequestedBusinessType(value: string) {
  const exactMatch = CUSTOMER_FINDER_BUSINESS_TYPES.find((businessType) =>
    value.toLowerCase().includes(businessType.toLowerCase())
  );

  if (exactMatch) return exactMatch;

  return BUSINESS_TYPE_ALIASES.find((alias) => alias.pattern.test(value))
    ?.businessType;
}

function getRequestedLocation(value: string) {
  const match = value.match(/\b(?:near|in|around)\s+(.+)$/i);
  if (!match) return "Hanover Park, IL";

  const location = match[1]
    .split(/\s+for\s+|\s+within\s+|\s+radius\b|\.|\?/i)[0]
    .trim();

  return location || "Hanover Park, IL";
}

function getRequestedRadius(value: string) {
  const match = value.match(/\b(\d+)\s*(?:mile|mi)\b/i);
  const radius = match ? Number.parseInt(match[1], 10) : 10;

  if (radius <= 5) return 5;
  if (radius <= 10) return 10;
  if (radius <= 15) return 15;
  return 25;
}

export default function AIAssistantPage() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [actionPreview, setActionPreview] = useState<AIActionPreview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [batchLeads, setBatchLeads] = useState<CustomerFinderLead[]>([]);
  const [batchBusinessType, setBatchBusinessType] =
    useState<CustomerFinderBusinessType>("Gutters");
  const [batchGenerationKey, setBatchGenerationKey] = useState(0);
  const [isGeneratingCustomerLeads, setIsGeneratingCustomerLeads] =
    useState(false);

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

  async function getProfileBusinessType(messageValue: string) {
    const profileResponse = await fetch("/api/business-profile");
    const profileData = (await profileResponse.json().catch(() => null)) as
      | { profile?: { industry?: string | null; custom_industry?: string | null } | null }
      | null;
    const profileIndustry =
      profileData?.profile?.industry === "Other"
        ? profileData.profile.custom_industry
        : profileData?.profile?.industry;

    return (
      getRequestedBusinessType(messageValue) ||
      getDefaultCustomerFinderBusinessType(profileIndustry)
    );
  }

  async function generateMultipleLeads(messageValue: string) {
    setActionPreview(null);
    setAnswer("");
    setBatchLeads([]);
    setError("");
    setStatusMessage("Generating customer leads...");
    setIsGeneratingCustomerLeads(true);

    try {
      const businessType = await getProfileBusinessType(messageValue);
      const response = await fetch("/api/ai/customer-finder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessType,
          location: getRequestedLocation(messageValue),
          radius: getRequestedRadius(messageValue),
          count: getRequestedLeadCount(messageValue),
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { leads?: CustomerFinderLead[]; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error || "Could not generate customer leads. Try again.");
      }

      const leads = Array.isArray(data?.leads) ? data.leads : [];
      setBatchBusinessType(businessType);
      setBatchLeads(leads);
      setBatchGenerationKey((current) => current + 1);
      setStatusMessage(
        leads.length > 0
          ? ""
          : "No leads found. Try a different location, radius, or business type."
      );
      await refreshUsage();
    } catch (err) {
      setStatusMessage("");
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate customer leads. Try again."
      );
    } finally {
      setIsGeneratingCustomerLeads(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setAnswer("");
    setActionPreview(null);
    setBatchLeads([]);
    setStatusMessage("");

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Please enter a question or task for the assistant.");
      return;
    }

    try {
      setLoading(true);

      if (isBatchLeadGenerationRequest(trimmedMessage)) {
        await generateMultipleLeads(trimmedMessage);
        return;
      }

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

      const data = (await response.json()) as {
        mode?: string;
        preview?: AIActionPreview;
        answer?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "AI request failed.");
      }

      if (data.mode === "action" && data.preview) {
        if (data.preview.intent === "generate_multiple_leads") {
          await generateMultipleLeads(trimmedMessage);
          return;
        }

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
              {isGeneratingCustomerLeads
                ? "Generating customer leads..."
                : loading
                ? "Thinking..."
                : "Start Running Your Business Smarter"}
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

          {batchLeads.length > 0 ? (
            <AILeadResultsTable
              key={batchGenerationKey}
              leads={batchLeads}
              businessType={batchBusinessType}
              onCancel={() => setBatchLeads([])}
              onGenerateAgain={() =>
                void generateMultipleLeads(message.trim() || "find 5 leads near Hanover Park, IL")
              }
              onImported={setStatusMessage}
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
