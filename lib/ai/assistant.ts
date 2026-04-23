import OpenAI from "openai";
import { buildAIAssistPrompt } from "@/lib/ai/prompts";
import {
  type AIAssistRequest,
  type AIAssistResponse,
  normalizeAIAssistResults,
} from "@/lib/ai/schemas";

let cachedClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;

  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return cachedClient;
}

function extractJson(text: string) {
  const trimmed = text.trim();

  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
}

function getServiceType(request: AIAssistRequest) {
  const serviceType = request.context?.serviceType;
  return typeof serviceType === "string" && serviceType.trim()
    ? serviceType
    : "service business";
}

function buildFallbackResponse(request: AIAssistRequest): AIAssistResponse {
  const serviceType = getServiceType(request);
  const input = request.input;

  const fallbackMap: Record<AIAssistRequest["action"], unknown[]> = {
    polish_service_description: [
      {
        kind: "text",
        title: "Polished Description",
        content: `Professional ${serviceType} service completed: ${input}. Work was performed carefully and prepared for customer review.`,
        insertText: `Professional ${serviceType} service completed: ${input}. Work was performed carefully and prepared for customer review.`,
      },
      {
        kind: "text",
        title: "Customer-Ready Version",
        content: `Completed ${input} as part of the scheduled ${serviceType.toLowerCase()} service. Area was reviewed and finished for customer approval.`,
        insertText: `Completed ${input} as part of the scheduled ${serviceType.toLowerCase()} service. Area was reviewed and finished for customer approval.`,
      },
    ],
    suggest_line_items: [
      {
        kind: "line_items",
        title: "Suggested Line Items",
        content: `Suggested line items for this ${serviceType.toLowerCase()} job. Review before inserting.`,
        lineItems: [
          { description: `${serviceType} labor`, quantity: 1, price: 0 },
          { description: `Primary service scope: ${input}`, quantity: 1, price: 0 },
          { description: "Site cleanup and final walkthrough", quantity: 1, price: 0 },
        ],
        insertText: `${serviceType} labor\nPrimary service scope: ${input}\nSite cleanup and final walkthrough`,
      },
    ],
    customer_notes: [
      {
        kind: "text",
        title: "Customer Notes",
        content: `Thank you for choosing our ${serviceType.toLowerCase()} service. The completed work included ${input}. Please contact us if you would like any follow-up service.`,
        insertText: `Thank you for choosing our ${serviceType.toLowerCase()} service. The completed work included ${input}. Please contact us if you would like any follow-up service.`,
      },
    ],
    scope_terms: [
      {
        kind: "text",
        title: "Scope Wording",
        content: `This invoice covers the agreed ${serviceType.toLowerCase()} scope described above. Additional work outside the listed scope requires separate approval.`,
        insertText: `This invoice covers the agreed ${serviceType.toLowerCase()} scope described above. Additional work outside the listed scope requires separate approval.`,
      },
    ],
    plain_language_summary: [
      {
        kind: "bullets",
        title: "Plain Summary",
        content: `A simple summary of the completed ${serviceType.toLowerCase()} work.`,
        bullets: [
          `Completed the main work requested: ${input}`,
          "Reviewed the work area after service",
          "Prepared the job for customer review",
        ],
        insertText: `Completed the main work requested: ${input}\nReviewed the work area after service\nPrepared the job for customer review`,
      },
    ],
    summarize_lead_notes: [
      {
        kind: "bullets",
        title: "Lead Summary",
        content: "Organized summary of the lead notes.",
        bullets: [
          `Lead context: ${input}`,
          `Relevant service: ${serviceType}`,
          "Follow-up should focus on timing, interest level, and next contact attempt",
        ],
        insertText: `Lead context: ${input}\nRelevant service: ${serviceType}\nFollow-up should focus on timing, interest level, and next contact attempt`,
      },
    ],
    follow_up_sms: [
      {
        kind: "text",
        title: "Follow-Up SMS",
        content: `Hi, this is Unified Steele following up on your ${serviceType.toLowerCase()} request. I wanted to check in and see if you'd like to set up a time to discuss next steps.`,
        insertText: `Hi, this is Unified Steele following up on your ${serviceType.toLowerCase()} request. I wanted to check in and see if you'd like to set up a time to discuss next steps.`,
      },
    ],
    follow_up_email: [
      {
        kind: "text",
        title: "Follow-Up Email",
        content: `Hi,\n\nI wanted to follow up regarding your ${serviceType.toLowerCase()} needs. Based on our notes, ${input}. Let me know if you would like to discuss next steps or get a quote.\n\nThank you,\nUnified Steele`,
        insertText: `Hi,\n\nI wanted to follow up regarding your ${serviceType.toLowerCase()} needs. Based on our notes, ${input}. Let me know if you would like to discuss next steps or get a quote.\n\nThank you,\nUnified Steele`,
      },
    ],
    call_script: [
      {
        kind: "bullets",
        title: "Call Script",
        content: "Short call outline for follow-up.",
        bullets: [
          "Introduce yourself and reference the prior contact",
          `Mention the service need: ${input}`,
          "Ask whether now is still a good time to talk about the project",
          "Offer a clear next step such as a quote or visit",
        ],
        insertText: `Hi, this is Unified Steele following up on your project. I wanted to check in about ${input}. Is now still a good time to talk about next steps?`,
      },
    ],
    next_best_action: [
      {
        kind: "bullets",
        title: "Next Best Action",
        content: "Recommended next steps based on the notes provided.",
        bullets: [
          "Set a clear follow-up date and channel",
          "Reference the specific service need in the next message",
          "Offer one simple next step such as scheduling or quoting",
        ],
        insertText: `Next action: follow up with a clear date, mention ${input}, and offer a simple next step.`,
      },
    ],
    summarize_territory_notes: [
      {
        kind: "bullets",
        title: "Territory Summary",
        content: "Concise territory summary from the field notes.",
        bullets: [
          `Main territory notes: ${input}`,
          `Best-fit service angle: ${serviceType}`,
          "Focus on visible opportunity indicators and efficient route coverage",
        ],
        insertText: `Main territory notes: ${input}\nBest-fit service angle: ${serviceType}\nFocus on visible opportunity indicators and efficient route coverage`,
      },
    ],
    route_plan: [
      {
        kind: "bullets",
        title: "Route Plan",
        content: "Suggested route plan based on the territory notes.",
        bullets: [
          "Start with the blocks showing the strongest visible need",
          "Group nearby homes to reduce downtime between stops",
          "Leave follow-up or low-opportunity pockets for the second pass",
        ],
        insertText: `Start with the strongest visible need, group nearby homes together, and leave lower-opportunity pockets for a second pass.`,
      },
    ],
    target_zone_observations: [
      {
        kind: "bullets",
        title: "Target-Zone Observations",
        content: "Likely observations to watch for in this territory.",
        bullets: [
          "Look for exterior wear, buildup, staining, or visible maintenance gaps",
          "Watch for clusters of similar home age or tree exposure",
          "Note which homes show the clearest service need first",
        ],
        insertText: `Look for visible maintenance gaps, recurring exterior issues, and clusters of similar home conditions.`,
      },
    ],
    door_pitch: [
      {
        kind: "text",
        title: "Door Pitch",
        content: `Hi, we’re working in the area today helping homeowners with ${serviceType.toLowerCase()} needs. Based on what we’ve seen nearby, I wanted to stop by and see if you’d like a quick look or quote.`,
        insertText: `Hi, we’re working in the area today helping homeowners with ${serviceType.toLowerCase()} needs. Based on what we’ve seen nearby, I wanted to stop by and see if you’d like a quick look or quote.`,
      },
    ],
    next_action_checklist: [
      {
        kind: "bullets",
        title: "Action Checklist",
        content: "Short action checklist for this territory.",
        bullets: [
          "Prioritize the strongest visible opportunity pockets",
          "Use a short service-specific pitch",
          "Track objections and follow-up streets as you go",
        ],
        insertText: `Prioritize strong opportunity pockets, use a short pitch, and track objections plus follow-up streets.`,
      },
    ],
    business_next_actions: [
      {
        kind: "bullets",
        title: "Business Next Actions",
        content: "A short set of next business actions.",
        bullets: [
          "Follow up the warmest open opportunities first",
          "Convert rough notes into clear customer-facing communication",
          "Prioritize tasks most likely to turn into booked work",
        ],
        insertText: `Follow up warm opportunities first, clean up customer communication, and prioritize booked-work tasks.`,
      },
    ],
    recent_work_summary: [
      {
        kind: "text",
        title: "Recent Work Summary",
        content: `Current business context summary: ${input}. Focus next on the tasks most likely to create revenue or move customers forward.`,
        insertText: `Current business context summary: ${input}. Focus next on the tasks most likely to create revenue or move customers forward.`,
      },
    ],
    general_business_assist: [
      {
        kind: "text",
        title: "Business Assist",
        content: `Based on the current context, the best move is to turn rough notes into clear action, follow up quickly, and keep customer communication simple and professional.`,
        insertText: `Based on the current context, the best move is to turn rough notes into clear action, follow up quickly, and keep customer communication simple and professional.`,
      },
    ],
  };

  return {
    ok: true,
    category: request.category,
    action: request.action,
    results: normalizeAIAssistResults(fallbackMap[request.action], "AI Suggestion"),
    provider: "fallback",
  };
}

export async function generateAIAssistance(
  request: AIAssistRequest
): Promise<AIAssistResponse> {
  const client = getOpenAIClient();

  if (!client) {
    return buildFallbackResponse(request);
  }

  const prompt = buildAIAssistPrompt(request);

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: prompt.system }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt.user }],
        },
      ],
      max_output_tokens: 1400,
    });

    const parsed = extractJson(response.output_text || "");

    if (!parsed || typeof parsed !== "object" || !("results" in parsed)) {
      return buildFallbackResponse(request);
    }

    return {
      ok: true,
      category: request.category,
      action: request.action,
      results: normalizeAIAssistResults(parsed.results, prompt.fallbackTitle),
      provider: "openai",
    };
  } catch {
    return buildFallbackResponse(request);
  }
}
