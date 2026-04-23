import type { AIAssistRequest, AIAction } from "@/lib/ai/schemas";

type PromptDefinition = {
  title: string;
  goal: string;
  guidelines: string[];
  resultHint: string;
};

const PROMPT_DEFINITIONS: Record<AIAction, PromptDefinition> = {
  polish_service_description: {
    title: "Professional Service Description",
    goal: "Turn rough service notes into polished, customer-ready invoice wording.",
    guidelines: [
      "Keep the writing practical and specific to field service work.",
      "Do not invent project facts that were not implied by the input.",
      "Make the tone professional and easy for a customer to understand.",
    ],
    resultHint:
      'Return 2 text results with concise service descriptions that could be inserted into invoice notes or scope wording.',
  },
  suggest_line_items: {
    title: "Suggested Line Items",
    goal: "Suggest common invoice line items based on the service type and rough job notes.",
    guidelines: [
      "Focus on realistic service-based line items.",
      "Use quantity 1 and price 0 unless a price is clearly implied.",
      "Keep the list practical and concise.",
    ],
    resultHint:
      'Return 1 line_items result with 3 to 6 suggested line items and a short explanation in content.',
  },
  customer_notes: {
    title: "Customer-Facing Notes",
    goal: "Write clear, professional notes a customer can read on an invoice.",
    guidelines: [
      "Use a reassuring but businesslike tone.",
      "Keep it easy to understand.",
      "Avoid legal language unless the user asks for it.",
    ],
    resultHint:
      'Return 2 text results suitable for invoice notes or customer-facing summary sections.',
  },
  scope_terms: {
    title: "Scope and Terms Wording",
    goal: "Draft clear scope wording or short service terms for the invoice.",
    guidelines: [
      "Keep it short and service-business friendly.",
      "Avoid sounding like a lawyer unless the request asks for strict terms.",
      "Focus on scope boundaries, approval notes, or service assumptions.",
    ],
    resultHint:
      'Return 2 text results with scope wording or short invoice terms.',
  },
  plain_language_summary: {
    title: "Plain Language Summary",
    goal: "Summarize the invoice work in plain language for a customer.",
    guidelines: [
      "Use simple language.",
      "Make it useful as a customer summary or recap.",
      "Keep it concise and readable.",
    ],
    resultHint:
      'Return 1 bullets result with 3 to 5 bullets and 1 text result with a short paragraph summary.',
  },
  summarize_lead_notes: {
    title: "Lead Summary",
    goal: "Turn rough lead notes into an organized CRM-style summary.",
    guidelines: [
      "Preserve the practical meaning of the notes.",
      "Surface service need, timing, and follow-up clues.",
      "Do not overstate the lead quality.",
    ],
    resultHint:
      'Return 1 bullets result for a clean CRM summary and 1 text result for a concise lead recap.',
  },
  follow_up_sms: {
    title: "Follow-Up SMS",
    goal: "Write a short follow-up text message for the lead.",
    guidelines: [
      "Keep it concise and polite.",
      "Make it sound natural for a local service business.",
      "Include a light call to action.",
    ],
    resultHint: 'Return 2 text results, each written as a short SMS draft.',
  },
  follow_up_email: {
    title: "Follow-Up Email",
    goal: "Write a short follow-up email the business can send to the lead.",
    guidelines: [
      "Use a helpful and professional tone.",
      "Keep the structure simple and readable.",
      "Include a light next-step prompt.",
    ],
    resultHint: 'Return 2 text results, each written as a short email draft.',
  },
  call_script: {
    title: "Call Script",
    goal: "Create a practical phone follow-up script for the lead.",
    guidelines: [
      "Make it conversational, not robotic.",
      "Keep it brief enough to use on a real call.",
      "Include an opening, purpose, and next-step ask.",
    ],
    resultHint:
      'Return 1 bullets result with script beats and 1 text result with a short script.',
  },
  next_best_action: {
    title: "Next Best Action",
    goal: "Recommend the most practical next action based on the lead or business context.",
    guidelines: [
      "Be decisive and specific.",
      "Suggest a realistic timing or follow-up step when useful.",
      "Keep the recommendation grounded in the notes provided.",
    ],
    resultHint:
      'Return 1 bullets result listing recommended next actions and 1 text result summarizing the best move.',
  },
  summarize_territory_notes: {
    title: "Territory Summary",
    goal: "Turn rough territory notes into a concise sales summary.",
    guidelines: [
      "Highlight opportunity, objections, and field patterns.",
      "Keep it practical for a door-to-door rep.",
      "Avoid unsupported conclusions.",
    ],
    resultHint:
      'Return 1 bullets result with territory summary bullets and 1 text result with a short summary paragraph.',
  },
  route_plan: {
    title: "Route Plan",
    goal: "Create an organized route or territory plan from notes and metrics.",
    guidelines: [
      "Prioritize efficiency and likely opportunity.",
      "Keep the plan actionable.",
      "Use practical field language.",
    ],
    resultHint:
      'Return 1 bullets result with an ordered route or territory plan.',
  },
  target_zone_observations: {
    title: "Target-Zone Observations",
    goal: "Identify likely target-zone observations from the territory notes.",
    guidelines: [
      "Focus on visible service indicators and patterns.",
      "Keep observations realistic for exterior service work.",
      "Avoid overclaiming certainty.",
    ],
    resultHint:
      'Return 1 bullets result with likely target-zone observations and what to watch for.',
  },
  door_pitch: {
    title: "Door-to-Door Pitch",
    goal: "Write a short neighborhood-specific door pitch.",
    guidelines: [
      "Keep it short enough to say at the door.",
      "Make it sound natural and local.",
      "Include a simple value statement and question.",
    ],
    resultHint:
      'Return 2 text results with short door-to-door pitch options.',
  },
  next_action_checklist: {
    title: "Next Action Checklist",
    goal: "Turn territory notes into a clear action checklist.",
    guidelines: [
      "Use short action-oriented bullets.",
      "Prioritize the highest-value next steps.",
      "Keep it field-ready.",
    ],
    resultHint:
      'Return 1 bullets result with a concise action checklist.',
  },
  business_next_actions: {
    title: "Business Next Actions",
    goal: "Suggest a short list of useful next business actions.",
    guidelines: [
      "Focus on practical revenue or follow-up moves.",
      "Keep the scope lightweight and not overwhelming.",
      "Use what the user already shared.",
    ],
    resultHint:
      'Return 1 bullets result with 3 to 5 next actions and 1 text result with a short business coach-style summary.',
  },
  recent_work_summary: {
    title: "Recent Work Summary",
    goal: "Summarize recent work context into a concise business snapshot.",
    guidelines: [
      "Be concise and clear.",
      "Surface what seems most important operationally.",
      "Avoid inventing data not present in context.",
    ],
    resultHint:
      'Return 1 text result summarizing the current business context and 1 bullets result with key takeaways.',
  },
  general_business_assist: {
    title: "Business Assistant",
    goal: "Provide light business writing and decision support.",
    guidelines: [
      "Stay practical, concise, and service-business focused.",
      "Be supportive but specific.",
      "Prefer actionable advice over generic motivation.",
    ],
    resultHint:
      'Return 1 text result and optionally 1 bullets result if a checklist is useful.',
  },
};

function formatContext(context: AIAssistRequest["context"]) {
  if (!context) return "No additional context provided.";

  try {
    return JSON.stringify(context, null, 2).slice(0, 3000);
  } catch {
    return "Context could not be serialized.";
  }
}

export function getPromptDefinition(action: AIAction) {
  return PROMPT_DEFINITIONS[action];
}

export function buildAIAssistPrompt(request: AIAssistRequest) {
  const definition = getPromptDefinition(request.action);

  const system = [
    "You are an AI assistant for a SaaS app used by service-based businesses.",
    "Your job is to produce useful, realistic, customer-safe suggestions that help operators write better invoice notes, sales notes, follow-ups, and field plans.",
    "Do not promise work that was not described.",
    "Do not mention being an AI.",
    "Return ONLY valid JSON.",
    'Use this JSON shape: {"results":[{"kind":"text"|"bullets"|"line_items","title":"string","content":"string","bullets":["string"],"lineItems":[{"description":"string","quantity":1,"price":0}],"insertText":"string"}]}',
    definition.resultHint,
  ].join("\n");

  const user = [
    `Category: ${request.category}`,
    `Action: ${request.action}`,
    `Goal: ${definition.goal}`,
    `Guidelines:\n- ${definition.guidelines.join("\n- ")}`,
    `User input:\n${request.input}`,
    `Page context:\n${formatContext(request.context)}`,
  ].join("\n\n");

  return {
    system,
    user,
    fallbackTitle: definition.title,
  };
}
