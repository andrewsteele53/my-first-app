"use client";

import AIAssistantPanel from "@/components/ai-assistant-panel";
import type { InvoiceLineItem } from "@/lib/invoices";

type Props = {
  serviceType: string;
  notes: string;
  items: InvoiceLineItem[];
  onInsertText: (text: string) => void;
  onInsertLineItems: (lineItems: InvoiceLineItem[]) => void;
};

export default function InvoiceAIAssistant({
  serviceType,
  notes,
  items,
  onInsertText,
  onInsertLineItems,
}: Props) {
  return (
    <AIAssistantPanel
      title={`${serviceType} AI Assistant`}
      description="Use AI to polish service wording, suggest line items, write customer-facing notes, and draft scope language without changing your existing invoice math."
      category="invoice"
      defaultAction="polish_service_description"
      inputLabel="Describe the job or what you need help writing"
      inputPlaceholder="Example: cleaned gutters and flushed downspouts on a two-story home"
      actions={[
        {
          value: "polish_service_description",
          label: "Polish Description",
          description: "Turn rough job wording into professional service language.",
        },
        {
          value: "suggest_line_items",
          label: "Suggest Line Items",
          description: "Generate realistic line-item ideas based on service type and job notes.",
        },
        {
          value: "customer_notes",
          label: "Customer Notes",
          description: "Write clean customer-facing notes for the invoice.",
        },
        {
          value: "scope_terms",
          label: "Scope / Terms",
          description: "Draft short scope wording or service terms.",
        },
        {
          value: "plain_language_summary",
          label: "Plain Summary",
          description: "Summarize the work in simple customer-friendly language.",
        },
      ]}
      promptSuggestions={[
        {
          label: "Polish gutter work",
          prompt: "cleaned gutters and flushed downspouts",
          action: "polish_service_description",
        },
        {
          label: "Suggest detailing items",
          prompt: "full interior detail with stain treatment",
          action: "suggest_line_items",
        },
        {
          label: "Write customer note",
          prompt: "completed requested service and reviewed the work area with the customer",
          action: "customer_notes",
        },
        {
          label: "Draft scope wording",
          prompt: "service covers the listed work only and extra items require approval",
          action: "scope_terms",
        },
      ]}
      context={{
        serviceType,
        currentNotes: notes,
        currentLineItems: items.map((item) => item.description).filter(Boolean),
      }}
      onInsertText={onInsertText}
      onInsertLineItems={onInsertLineItems}
    />
  );
}
