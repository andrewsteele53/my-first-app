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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
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
