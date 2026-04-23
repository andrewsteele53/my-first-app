"use client";

import { useState } from "react";
import AIResultCard from "@/components/ai-result-card";
import AISuggestionChip from "@/components/ai-suggestion-chip";
import AIUpgradeCard from "@/components/ai-upgrade-card";
import { useAIAssistant } from "@/hooks/use-ai-assistant";
import { useInvoiceAccessStatus } from "@/hooks/use-invoice-access-status";
import type {
  AIAssistRequest,
  AICategory,
  AIAction,
  AILineItem,
} from "@/lib/ai/schemas";

type AssistantAction = {
  value: AIAction;
  label: string;
  description: string;
};

type PromptSuggestion = {
  label: string;
  prompt: string;
  action?: AIAction;
};

type Props = {
  title: string;
  description: string;
  category: AICategory;
  actions: AssistantAction[];
  defaultAction: AIAction;
  inputLabel: string;
  inputPlaceholder: string;
  submitLabel?: string;
  promptSuggestions?: PromptSuggestion[];
  context?: AIAssistRequest["context"];
  initialInput?: string;
  onInsertText?: (text: string) => void;
  onInsertLineItems?: (lineItems: AILineItem[]) => void;
};

export default function AIAssistantPanel({
  title,
  description,
  category,
  actions,
  defaultAction,
  inputLabel,
  inputPlaceholder,
  submitLabel = "Generate Suggestions",
  promptSuggestions = [],
  context,
  initialInput = "",
  onInsertText,
  onInsertLineItems,
}: Props) {
  const [selectedAction, setSelectedAction] = useState<AIAction>(defaultAction);
  const [input, setInput] = useState(initialInput);
  const { loading, error, response, runAssistant, clearResponse } = useAIAssistant();
  const {
    status: accessStatus,
    loading: accessLoading,
  } = useInvoiceAccessStatus();

  if (accessLoading) {
    return (
      <section className="rounded-[1.9rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
          AI Assistant
        </p>
        <div className="us-subtle-card mt-5 text-sm text-[var(--color-text-secondary)]">
          Checking AI access...
        </div>
      </section>
    );
  }

  if (!accessStatus) {
    return (
      <section className="rounded-[1.9rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
          AI Assistant
        </p>
        <div className="us-notice-warning mt-5 text-sm">
          We couldn&apos;t verify AI access right now. Refresh the page or sign in
          again to continue.
        </div>
      </section>
    );
  }

  if (!accessStatus.isSubscribed) {
    return <AIUpgradeCard />;
  }

  async function handleSubmit() {
    await runAssistant({
      category,
      action: selectedAction,
      input,
      context,
    });
  }

  return (
    <section className="rounded-[1.9rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
            AI Assistant
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--color-text)]">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
            {description}
          </p>
        </div>

        {response ? (
          <button
            type="button"
            onClick={clearResponse}
            className="us-btn-secondary px-3 py-2 text-sm"
          >
            Clear Results
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => {
          const active = selectedAction === action.value;

          return (
            <button
              key={action.value}
              type="button"
              onClick={() => setSelectedAction(action.value)}
              className={`rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-[var(--color-primary)] bg-[rgba(47,93,138,0.11)] text-[var(--color-primary-active)] shadow-[0_12px_24px_rgba(47,93,138,0.12)]"
                  : "border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-primary)] hover:bg-[#f1f6fa]"
              }`}
            >
              <div className="font-semibold">{action.label}</div>
              <div className="mt-2 text-sm opacity-80">{action.description}</div>
            </button>
          );
        })}
      </div>

      {promptSuggestions.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {promptSuggestions.map((suggestion) => (
            <AISuggestionChip
              key={`${suggestion.label}-${suggestion.action || "same"}`}
              label={suggestion.label}
              onClick={() => {
                setInput(suggestion.prompt);
                if (suggestion.action) {
                  setSelectedAction(suggestion.action);
                }
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-[var(--color-text)]">
          {inputLabel}
        </label>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={inputPlaceholder}
          className="us-textarea min-h-[130px]"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="us-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Thinking..." : submitLabel}
        </button>
      </div>

      {error ? (
        <div className="us-notice-danger mt-4 text-sm">
          {error}
        </div>
      ) : null}

      {response ? (
        <div className="mt-6 space-y-4">
          {response.results.map((result) => (
            <AIResultCard
              key={result.id}
              result={result}
              onInsertText={onInsertText}
              onInsertLineItems={onInsertLineItems}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
