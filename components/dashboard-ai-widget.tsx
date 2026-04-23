"use client";

import AIAssistantPanel from "@/components/ai-assistant-panel";

type Props = {
  context: Record<string, unknown>;
};

export default function DashboardAIWidget({ context }: Props) {
  return (
    <AIAssistantPanel
      title="Business Assistant"
      description="Get lightweight next-step guidance, recent work summaries, and quick business-writing help based on your current dashboard context."
      category="dashboard"
      defaultAction="business_next_actions"
      inputLabel="What do you want help thinking through?"
      inputPlaceholder="Example: I want to know what to prioritize this afternoon"
      actions={[
        {
          value: "business_next_actions",
          label: "Next Actions",
          description: "Get a short list of practical next steps.",
        },
        {
          value: "recent_work_summary",
          label: "Summarize Context",
          description: "Turn the dashboard context into a quick business snapshot.",
        },
        {
          value: "general_business_assist",
          label: "Business Help",
          description: "Get lightweight writing or decision support.",
        },
      ]}
      promptSuggestions={[
        {
          label: "What should I do next?",
          prompt: "Based on my current dashboard, what are the best next actions today?",
          action: "business_next_actions",
        },
        {
          label: "Summarize my work",
          prompt: "Summarize my current business context and what it suggests.",
          action: "recent_work_summary",
        },
        {
          label: "Customer response help",
          prompt: "Help me write a short professional customer follow-up based on current work.",
          action: "general_business_assist",
        },
      ]}
      context={context}
    />
  );
}
