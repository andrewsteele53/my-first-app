"use client";

import { useState } from "react";
import type { AIResult } from "@/lib/ai/schemas";
import AIInsertButton from "@/components/ai-insert-button";

type Props = {
  result: AIResult;
  onInsertText?: (text: string) => void;
  onInsertLineItems?: (
    lineItems: { description: string; quantity: number; price: number }[]
  ) => void;
};

export default function AIResultCard({
  result,
  onInsertText,
  onInsertLineItems,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyValue =
    result.kind === "line_items"
      ? (result.lineItems || [])
          .map((lineItem) => `${lineItem.description} | Qty ${lineItem.quantity} | $${lineItem.price}`)
          .join("\n")
      : result.insertText;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <div className="rounded-[1.4rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            AI Suggestion
          </p>
          <h3 className="mt-1 text-lg font-bold text-[var(--color-text)]">
            {result.title}
          </h3>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="us-btn-secondary px-3 py-2 text-sm"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-secondary)]">
        {result.content}
      </p>

      {result.kind === "bullets" && result.bullets ? (
        <ul className="mt-3 space-y-2 text-sm text-[var(--color-text)]">
          {result.bullets.map((bullet, index) => (
            <li key={`${result.id}-bullet-${index}`} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {result.kind === "line_items" && result.lineItems ? (
        <div className="mt-3 space-y-2">
          {result.lineItems.map((lineItem, index) => (
            <div
              key={`${result.id}-line-item-${index}`}
              className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-3 py-3 text-sm"
            >
              <div className="font-semibold text-[var(--color-text)]">
                {lineItem.description}
              </div>
              <div className="mt-1 text-[var(--color-text-secondary)]">
                Qty {lineItem.quantity} • ${lineItem.price.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {result.kind === "line_items" && result.lineItems && onInsertLineItems ? (
          <AIInsertButton
            label="Insert Line Items"
            onClick={() => onInsertLineItems(result.lineItems || [])}
          />
        ) : null}

        {result.kind !== "line_items" && onInsertText ? (
          <AIInsertButton
            label="Insert Result"
            onClick={() => onInsertText(result.insertText)}
          />
        ) : null}
      </div>
    </div>
  );
}
