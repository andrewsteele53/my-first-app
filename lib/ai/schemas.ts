export const AI_CATEGORIES = ["invoice", "lead", "mapping", "dashboard"] as const;

export const AI_ACTIONS = {
  invoice: [
    "polish_service_description",
    "suggest_line_items",
    "customer_notes",
    "scope_terms",
    "plain_language_summary",
  ],
  lead: [
    "summarize_lead_notes",
    "follow_up_sms",
    "follow_up_email",
    "call_script",
    "next_best_action",
  ],
  mapping: [
    "summarize_territory_notes",
    "route_plan",
    "target_zone_observations",
    "door_pitch",
    "next_action_checklist",
  ],
  dashboard: [
    "business_next_actions",
    "recent_work_summary",
    "general_business_assist",
  ],
} as const;

export type AICategory = (typeof AI_CATEGORIES)[number];
export type AIAction =
  | (typeof AI_ACTIONS.invoice)[number]
  | (typeof AI_ACTIONS.lead)[number]
  | (typeof AI_ACTIONS.mapping)[number]
  | (typeof AI_ACTIONS.dashboard)[number];

export type AIContext = Record<string, unknown>;

export type AILineItem = {
  description: string;
  quantity: number;
  price: number;
};

export type AIResult = {
  id: string;
  kind: "text" | "bullets" | "line_items";
  title: string;
  content: string;
  bullets?: string[];
  lineItems?: AILineItem[];
  insertText: string;
};

export type AIAssistRequest = {
  category: AICategory;
  action: AIAction;
  input: string;
  context?: AIContext;
};

export type AIAssistResponse = {
  ok: true;
  category: AICategory;
  action: AIAction;
  results: AIResult[];
  provider: "openai" | "fallback";
};

export type AIErrorResponse = {
  ok: false;
  error: string;
};

export const AI_ACTION_INTENTS = [
  "create_quote",
  "create_invoice",
  "create_lead",
  "generate_multiple_leads",
  "create_sales_mapping_note",
  "write_follow_up_message",
  "general_assistant",
] as const;

export type AIActionIntent = (typeof AI_ACTION_INTENTS)[number];

export type AIActionLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type AIActionDocumentData = {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceAddress?: string;
  serviceType: string;
  projectTitle?: string;
  lineItems: AIActionLineItem[];
  subtotal: number;
  tax: number;
  taxRate?: number;
  discount?: number;
  total: number;
  dueDate?: string;
  dueTerms?: string;
  notes?: string;
  terms?: string;
  sourceQuoteId?: string;
  sourceQuoteNumber?: string;
};

export type AIActionLeadData = {
  businessName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  serviceType?: string;
  leadSource?: string;
  status?: string;
  priority?: string;
  estimatedValue?: number;
  notes?: string;
  followUpDate?: string;
};

export type AIActionMappingData = {
  title: string;
  location: string;
  businessType: string;
  targetCustomer: string;
  routeNotes: string;
  outreachNotes: string;
  priority: string;
  status: string;
};

export type AIActionMessageData = {
  channel: "sms" | "email";
  message: string;
  subject?: string;
};

export type AIActionData =
  | AIActionDocumentData
  | AIActionLeadData
  | AIActionMappingData
  | AIActionMessageData
  | { response: string };

export type AIActionPreview = {
  intent: AIActionIntent;
  title: string;
  summary: string;
  data: AIActionData;
};

export type AIActionResponse = {
  ok: true;
  mode: "action";
  preview: AIActionPreview;
  provider: "openai" | "fallback";
};

export type AIActionRequest = {
  mode: "action";
  message: string;
  context?: AIContext;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function sanitizeOptionalString(value: unknown, maxLength: number) {
  const sanitized = sanitizeString(value, maxLength);
  return sanitized || undefined;
}

function sanitizeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(numberValue, 0) : fallback;
}

function sanitizeContext(context: unknown): AIContext | undefined {
  if (!isPlainObject(context)) return undefined;

  const entries = Object.entries(context).slice(0, 20).map(([key, value]) => {
    if (Array.isArray(value)) {
      return [key, value.slice(0, 12)];
    }

    if (isPlainObject(value)) {
      return [key, Object.fromEntries(Object.entries(value).slice(0, 12))];
    }

    return [key, value];
  });

  return Object.fromEntries(entries);
}

export function isValidCategory(category: string): category is AICategory {
  return (AI_CATEGORIES as readonly string[]).includes(category);
}

export function isValidActionForCategory(
  category: AICategory,
  action: string
): action is AIAction {
  return (AI_ACTIONS[category] as readonly string[]).includes(action);
}

export function validateAIAssistRequest(body: unknown):
  | { ok: true; data: AIAssistRequest }
  | { ok: false; error: string } {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Invalid request payload." };
  }

  const category = sanitizeString(body.category, 40);
  const action = sanitizeString(body.action, 80);
  const input = sanitizeString(body.input, 2000);
  const context = sanitizeContext(body.context);

  if (!category || !isValidCategory(category)) {
    return { ok: false, error: "Invalid AI category." };
  }

  if (!action || !isValidActionForCategory(category, action)) {
    return { ok: false, error: "Invalid AI action for this category." };
  }

  if (!input) {
    return { ok: false, error: "Please enter something for AI to work with." };
  }

  return {
    ok: true,
    data: {
      category,
      action,
      input,
      context,
    },
  };
}

export function validateAIActionRequest(body: unknown):
  | { ok: true; data: AIActionRequest }
  | { ok: false; error: string } {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Invalid request payload." };
  }

  const mode = sanitizeString(body.mode, 20);
  const message = sanitizeString(body.message, 3000);
  const context = sanitizeContext(body.context);

  if (mode !== "action") {
    return { ok: false, error: "Invalid AI action mode." };
  }

  if (!message) {
    return { ok: false, error: "Please describe what you want AI to create." };
  }

  return { ok: true, data: { mode, message, context } };
}

function isValidAIActionIntent(intent: string): intent is AIActionIntent {
  return (AI_ACTION_INTENTS as readonly string[]).includes(intent);
}

function normalizeActionLineItems(rawLineItems: unknown): AIActionLineItem[] {
  if (!Array.isArray(rawLineItems)) return [];

  return rawLineItems
    .map((rawItem): AIActionLineItem | null => {
      if (!isPlainObject(rawItem)) return null;

      const description = sanitizeString(rawItem.description, 180);
      if (!description) return null;

      const quantity = Math.max(sanitizeNumber(rawItem.quantity, 1), 1);
      const unitPrice = sanitizeNumber(rawItem.unitPrice ?? rawItem.price, 0);
      const total = sanitizeNumber(rawItem.total, quantity * unitPrice);

      return {
        description,
        quantity,
        unitPrice,
        total,
      };
    })
    .filter((item): item is AIActionLineItem => Boolean(item))
    .slice(0, 12);
}

function normalizeIsoDate(value: unknown): string | undefined {
  const dateString = sanitizeString(value, 80);
  if (!dateString) return undefined;

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toISOString();
}

function normalizeDocumentData(rawData: unknown): AIActionDocumentData {
  const data = isPlainObject(rawData) ? rawData : {};
  const lineItems = normalizeActionLineItems(data.lineItems);
  const subtotal =
    sanitizeNumber(data.subtotal, lineItems.reduce((sum, item) => sum + item.total, 0));
  const tax = sanitizeNumber(data.tax ?? data.taxAmount, 0);
  const discount = sanitizeNumber(data.discount, 0);
  const total = sanitizeNumber(data.total, Math.max(subtotal + tax - discount, 0));

  return {
    customerName: sanitizeString(data.customerName, 140),
    customerEmail: sanitizeOptionalString(data.customerEmail ?? data.email, 180),
    customerPhone: sanitizeOptionalString(data.customerPhone ?? data.phone, 80),
    serviceAddress: sanitizeOptionalString(data.serviceAddress ?? data.address, 240),
    serviceType: sanitizeString(data.serviceType, 120) || "Service",
    projectTitle: sanitizeOptionalString(data.projectTitle, 180),
    lineItems,
    subtotal,
    tax,
    taxRate: sanitizeNumber(data.taxRate, 0),
    discount,
    total,
    dueDate: normalizeIsoDate(data.dueDate),
    dueTerms: sanitizeOptionalString(data.dueTerms, 160),
    notes: sanitizeOptionalString(data.notes, 1200),
    terms: sanitizeOptionalString(data.terms, 800),
    sourceQuoteId: sanitizeOptionalString(data.sourceQuoteId, 120),
    sourceQuoteNumber: sanitizeOptionalString(data.sourceQuoteNumber, 120),
  };
}

function normalizeLeadData(rawData: unknown): AIActionLeadData {
  const data = isPlainObject(rawData) ? rawData : {};

  return {
    businessName:
      sanitizeString(data.businessName ?? data.customerName ?? data.name, 160) ||
      "New Lead",
    contactName: sanitizeOptionalString(data.contactName, 140),
    phone: sanitizeOptionalString(data.phone, 80),
    email: sanitizeOptionalString(data.email, 180),
    address: sanitizeOptionalString(data.address, 240),
    city: sanitizeOptionalString(data.city ?? data.location, 140),
    serviceType: sanitizeOptionalString(data.serviceType, 120),
    leadSource: sanitizeOptionalString(data.leadSource, 120),
    status: sanitizeOptionalString(data.status, 80),
    priority: sanitizeOptionalString(data.priority, 80),
    estimatedValue: sanitizeNumber(data.estimatedValue, 0),
    notes: sanitizeOptionalString(data.notes, 1200),
    followUpDate: normalizeIsoDate(data.followUpDate),
  };
}

function normalizeMappingData(rawData: unknown): AIActionMappingData {
  const data = isPlainObject(rawData) ? rawData : {};

  return {
    title: sanitizeString(data.title, 160) || "Sales Mapping Note",
    location: sanitizeString(data.location, 160),
    businessType: sanitizeString(data.businessType, 140) || "Service business",
    targetCustomer: sanitizeString(data.targetCustomer, 280),
    routeNotes: sanitizeString(data.routeNotes, 1200),
    outreachNotes: sanitizeString(data.outreachNotes, 1200),
    priority: sanitizeString(data.priority, 40) || "medium",
    status: sanitizeString(data.status, 40) || "new",
  };
}

function normalizeMessageData(rawData: unknown): AIActionMessageData {
  const data = isPlainObject(rawData) ? rawData : {};
  const channel = sanitizeString(data.channel, 20);

  return {
    channel: channel === "email" ? "email" : "sms",
    subject: sanitizeOptionalString(data.subject, 140),
    message: sanitizeString(data.message, 2000),
  };
}

export function normalizeAIActionPreview(rawPreview: unknown): AIActionPreview | null {
  if (!isPlainObject(rawPreview)) return null;

  const intentValue = sanitizeString(rawPreview.intent, 80);
  const intent: AIActionIntent = isValidAIActionIntent(intentValue)
    ? intentValue
    : "general_assistant";

  const data =
    intent === "create_quote" ||
    intent === "create_invoice"
      ? normalizeDocumentData(rawPreview.data)
      : intent === "create_lead"
      ? normalizeLeadData(rawPreview.data)
      : intent === "create_sales_mapping_note"
      ? normalizeMappingData(rawPreview.data)
      : intent === "write_follow_up_message"
      ? normalizeMessageData(rawPreview.data)
      : {
          response:
            sanitizeString(
              isPlainObject(rawPreview.data) ? rawPreview.data.response : "",
              2000
            ) || sanitizeString(rawPreview.summary, 2000),
        };

  return {
    intent,
    title: sanitizeString(rawPreview.title, 160) || "AI Action Preview",
    summary: sanitizeString(rawPreview.summary, 1200),
    data,
  };
}

function normalizeLineItems(lineItems: unknown): AILineItem[] | undefined {
  if (!Array.isArray(lineItems)) return undefined;

  const normalized = lineItems
    .map((lineItem) => {
      if (!isPlainObject(lineItem)) return null;

      const description = sanitizeString(lineItem.description, 160);
      const quantity = Math.max(Number(lineItem.quantity) || 1, 1);
      const price = Math.max(Number(lineItem.price) || 0, 0);

      if (!description) return null;

      return {
        description,
        quantity,
        price,
      };
    })
    .filter((lineItem): lineItem is AILineItem => Boolean(lineItem))
    .slice(0, 8);

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeBullets(bullets: unknown): string[] | undefined {
  if (!Array.isArray(bullets)) return undefined;

  const normalized = bullets
    .map((bullet) => sanitizeString(bullet, 240))
    .filter(Boolean)
    .slice(0, 8);

  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeAIAssistResults(
  rawResults: unknown,
  fallbackTitle: string
): AIResult[] {
  if (!Array.isArray(rawResults)) {
    return [
      {
        id: crypto.randomUUID(),
        kind: "text",
        title: fallbackTitle,
        content: "No structured AI results were returned.",
        insertText: "No structured AI results were returned.",
      },
    ];
  }

  const results = rawResults
    .map((result): AIResult | null => {
      if (!isPlainObject(result)) return null;

      const lineItems = normalizeLineItems(result.lineItems);
      const bullets = normalizeBullets(result.bullets);
      const title = sanitizeString(result.title, 120) || fallbackTitle;
      const content =
        sanitizeString(result.content, 1200) ||
        (lineItems
          ? "Review these suggested line items before inserting them."
          : bullets
          ? bullets.join(" ")
          : "");

      const requestedKind = sanitizeString(result.kind, 24);
      const kind =
        requestedKind === "line_items" && lineItems
          ? "line_items"
          : requestedKind === "bullets" && bullets
          ? "bullets"
          : "text";

      const insertText =
        sanitizeString(result.insertText, 1200) ||
        (kind === "line_items"
          ? (lineItems || []).map((item) => item.description).join("\n")
          : kind === "bullets"
          ? (bullets || []).join("\n")
          : content);

      if (!content && !lineItems && !bullets) return null;

      return {
        id: crypto.randomUUID(),
        kind,
        title,
        content,
        insertText,
        ...(bullets ? { bullets } : {}),
        ...(lineItems ? { lineItems } : {}),
      };
    })
    .filter((result) => result !== null)
    .slice(0, 4);

  return results.length > 0
    ? results
    : [
        {
          id: crypto.randomUUID(),
          kind: "text",
          title: fallbackTitle,
          content: "No structured AI results were returned.",
          insertText: "No structured AI results were returned.",
        },
      ];
}
