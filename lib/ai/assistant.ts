import OpenAI from "openai";
import { buildAIAssistPrompt } from "@/lib/ai/prompts";
import {
  type AIActionPreview,
  type AIActionRequest,
  type AIActionResponse,
  type AIAssistRequest,
  type AIAssistResponse,
  normalizeAIActionPreview,
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
  if (typeof serviceType === "string" && serviceType.trim()) {
    return serviceType;
  }

  const businessProfile = request.context?.businessProfile;
  if (businessProfile && typeof businessProfile === "object" && !Array.isArray(businessProfile)) {
    const industry = (businessProfile as { industry?: unknown }).industry;
    if (typeof industry === "string" && industry.trim()) {
      return industry;
    }
  }

  return "service business";
}

function buildFallbackResponse(request: AIAssistRequest): AIAssistResponse {
  const serviceType = getServiceType(request);
  const input = request.input;
  const fallbackLineItems =
    serviceType === "Demolition"
      ? [
          { description: "Interior demolition", quantity: 1, price: 0 },
          { description: "Debris removal", quantity: 1, price: 0 },
          { description: "Hauling/disposal", quantity: 1, price: 0 },
          { description: "Labor", quantity: 1, price: 0 },
          { description: "Equipment", quantity: 1, price: 0 },
          { description: "Dump fees", quantity: 1, price: 0 },
          { description: "Site cleanup", quantity: 1, price: 0 },
        ]
      : [
          { description: `${serviceType} labor`, quantity: 1, price: 0 },
          { description: `Primary service scope: ${input}`, quantity: 1, price: 0 },
          { description: "Site cleanup and final walkthrough", quantity: 1, price: 0 },
        ];

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
        lineItems: fallbackLineItems,
        insertText: fallbackLineItems.map((item) => item.description).join("\n"),
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

function getTextContextValue(context: AIActionRequest["context"], key: string) {
  const value = context?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function getDueDateFromInput(input: string) {
  const match = input.toLowerCase().match(/due in (\d{1,3}) days?/);
  if (!match) return undefined;

  const days = Number(match[1]);
  if (!Number.isFinite(days) || days < 0) return undefined;

  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function getFallbackServiceType(input: string, context: AIActionRequest["context"]) {
  const lower = input.toLowerCase();
  const businessProfile = context?.businessProfile;
  const profileIndustry =
    businessProfile && typeof businessProfile === "object" && !Array.isArray(businessProfile)
      ? (businessProfile as { industry?: unknown }).industry
      : null;

  return (
    getTextContextValue(context, "serviceType") ||
    (/\bdemo|demolition|tear\s?out|tear\s?down|remove\s+(?:a\s+)?(?:deck|shed|garage|concrete)/i.test(input)
      ? "Demolition"
      : lower.includes("gutter")
      ? "Gutter Cleaning"
      : lower.includes("lawn")
      ? "Lawn Care"
      : lower.includes("roof")
      ? "Roofing"
      : lower.includes("tow")
      ? "Towing"
      : typeof profileIndustry === "string" && profileIndustry.trim()
      ? profileIndustry
      : "Service")
  );
}

function getFallbackQuoteInvoiceLineItems(serviceType: string, total: number) {
  if (serviceType === "Demolition") {
    return [
      { description: "Interior demolition", quantity: 1, unitPrice: 0, total: 0 },
      { description: "Debris removal", quantity: 1, unitPrice: 0, total: 0 },
      { description: "Hauling/disposal", quantity: 1, unitPrice: 0, total: 0 },
      { description: "Labor", quantity: 1, unitPrice: total, total },
      { description: "Equipment", quantity: 1, unitPrice: 0, total: 0 },
      { description: "Dump fees", quantity: 1, unitPrice: 0, total: 0 },
      { description: "Site cleanup", quantity: 1, unitPrice: 0, total: 0 },
    ];
  }

  return [
    {
      description: `${serviceType} service`,
      quantity: 1,
      unitPrice: total,
      total,
    },
  ];
}

function buildFallbackActionPreview(request: AIActionRequest): AIActionResponse {
  const input = request.message;
  const lower = input.toLowerCase();
  const serviceType = getFallbackServiceType(input, request.context);

  let preview: AIActionPreview;

  if (lower.includes("quote") || lower.includes("estimate")) {
    const subtotal = lower.includes("gutter") ? 240 : 150;
    preview = {
      intent: "create_quote",
      title: `${serviceType} Quote`,
      summary: `Draft quote generated from: ${input}`,
      data: {
        customerName: getTextContextValue(request.context, "customerName"),
        serviceType,
        projectTitle: `${serviceType} Quote`,
        lineItems: getFallbackQuoteInvoiceLineItems(serviceType, subtotal),
        subtotal,
        tax: 0,
        taxRate: 0,
        discount: 0,
        total: subtotal,
        notes: "Review scope and pricing before sending.",
        terms: "Payment due upon completion unless otherwise agreed.",
      },
    };
  } else if (lower.includes("invoice")) {
    const total = Number(input.match(/\$?(\d+(?:\.\d{1,2})?)/)?.[1]) || 150;
    const dueDate = getDueDateFromInput(input);
    preview = {
      intent: "create_invoice",
      title: `${serviceType} Invoice`,
      summary: `Draft invoice generated from: ${input}`,
      data: {
        customerName: getTextContextValue(request.context, "customerName"),
        serviceType,
        projectTitle: `${serviceType} Invoice`,
        lineItems: getFallbackQuoteInvoiceLineItems(serviceType, total),
        subtotal: total,
        tax: 0,
        taxRate: 0,
        discount: 0,
        total,
        dueDate,
        dueTerms: dueDate
          ? `Due ${new Date(dueDate).toLocaleDateString()}`
          : "Due upon receipt.",
        notes: "Review details before sending.",
        terms: "Due upon receipt.",
      },
    };
  } else if (
    /\b(?:find|generate|get|show\s+me)\b/.test(lower) &&
    /\b(?:leads?|customers?)\b/.test(lower)
  ) {
    preview = {
      intent: "generate_multiple_leads",
      title: "Generate Multiple Leads",
      summary:
        "This request should use AI Customer Finder and render a selectable lead results table.",
      data: {
        response:
          "Generating multiple leads is handled by the AI Customer Finder flow.",
      },
    };
  } else if (lower.includes("lead")) {
    preview = {
      intent: "create_lead",
      title: "New Lead",
      summary: `Lead draft generated from: ${input}`,
      data: {
        businessName: input.replace(/^add a lead for/i, "").trim() || "New Lead",
        city: lower.includes("schaumburg") ? "Schaumburg" : "",
        serviceType,
        leadSource: "AI Assistant",
        status: "New",
        priority: lower.includes("quickbooks") ? "high" : "medium",
        notes: input,
      },
    };
  } else if (lower.includes("mapping") || lower.includes("route") || lower.includes("near")) {
    preview = {
      intent: "create_sales_mapping_note",
      title: "Sales Mapping Notes",
      summary: `Mapping notes generated from: ${input}`,
      data: {
        title: "Sales Mapping Notes",
        location: lower.includes("schaumburg") ? "Schaumburg" : "",
        businessType: serviceType,
        targetCustomer: "Service businesses that may need organized invoicing and follow-up.",
        routeNotes: input,
        outreachNotes: "Use a short introduction focused on reducing admin work and keeping records organized.",
        priority: "medium",
        status: "new",
      },
    };
  } else if (lower.includes("follow-up") || lower.includes("follow up") || lower.includes("message")) {
    preview = {
      intent: "write_follow_up_message",
      title: "Follow-Up Message",
      summary: "Short professional follow-up message.",
      data: {
        channel: "sms",
        message:
          "Hi, just following up to see if you had any questions or wanted to discuss next steps. Happy to help when the timing is right.",
      },
    };
  } else {
    preview = {
      intent: "general_assistant",
      title: "Business Assistant",
      summary: "Here is a practical next step based on your request.",
      data: {
        response:
          "Turn this into a specific customer, quote, invoice, lead, mapping note, or follow-up request and I can generate a preview for you to review before saving.",
      },
    };
  }

  return {
    ok: true,
    mode: "action",
    preview,
    provider: "fallback",
  };
}

function buildAIActionPrompt(request: AIActionRequest) {
  return {
    system:
      "You are the Unified Steele AI Action Assistant for a service-business SaaS app. Detect the user's intent and return only valid JSON. Never save records. Generate a preview for the user to review. Supported intents: create_quote, create_invoice, create_lead, generate_multiple_leads, create_sales_mapping_note, write_follow_up_message, general_assistant. If the user asks to find leads, find customers, generate leads, get leads, find X leads, find X customers, generate X leads, show me leads, or get potential customers, set intent to generate_multiple_leads. If the user asks create a lead, add a lead, or make a lead, keep intent create_lead. Avoid legal, tax, accounting, or financial advice. Use professional service-business wording. For quotes/invoices, include customer details if provided, serviceType, projectTitle, lineItems with description/quantity/unitPrice/total, subtotal, tax, taxRate, discount, total, notes, and terms. For demolition quotes and invoices, use demolition language and line items such as interior demolition, shed/garage demolition, deck removal, concrete removal, debris removal, hauling/disposal, labor, equipment, dump fees, and site cleanup. For invoices, include dueDate when a due date is clear, otherwise dueTerms='Due upon receipt.'. For single leads, include businessName, contactName, phone, email, address, city, serviceType, leadSource, status, priority, estimatedValue, notes, followUpDate when clear. For generate_multiple_leads, return data with response only because the frontend must call AI Customer Finder and render a selectable results table. For mapping notes, include title, location, businessType, targetCustomer, routeNotes, outreachNotes, priority, status. For demolition mapping notes, suggest targets such as remodelers, property managers, real estate investors, landlords, homeowners, and contractors. For follow-up messages, include channel, subject if email, and message. If asked to turn a quote into an invoice, use supplied quote context if present and set intent create_invoice.",
    user: JSON.stringify({
      message: request.message,
      currentDate: new Date().toISOString(),
      context: request.context || {},
      outputShape: {
        intent: "create_quote",
        title: "Short preview title",
        summary: "One sentence summary.",
        data: {},
      },
    }),
  };
}

export async function generateAIActionPreview(
  request: AIActionRequest
): Promise<AIActionResponse> {
  const client = getOpenAIClient();

  if (!client) {
    return buildFallbackActionPreview(request);
  }

  const prompt = buildAIActionPrompt(request);

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
      max_output_tokens: 1800,
    });

    const parsed = extractJson(response.output_text || "");
    const preview = normalizeAIActionPreview(parsed);

    if (!preview) {
      return buildFallbackActionPreview(request);
    }

    return {
      ok: true,
      mode: "action",
      preview,
      provider: "openai",
    };
  } catch {
    return buildFallbackActionPreview(request);
  }
}
