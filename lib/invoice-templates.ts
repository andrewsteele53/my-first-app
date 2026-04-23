import type { InvoiceLineItem } from "@/lib/invoices";

export type InvoiceDescriptionTemplate = {
  id: string;
  name: string;
  serviceType: string;
  text: string;
  createdAt: string;
};

export type InvoiceLineItemTemplate = {
  id: string;
  name: string;
  serviceType: string;
  items: InvoiceLineItem[];
  createdAt: string;
};

export const INVOICE_DESCRIPTION_TEMPLATES_KEY =
  "invoice_description_templates_v1";
export const INVOICE_LINE_ITEM_TEMPLATES_KEY =
  "invoice_line_item_templates_v1";

function readStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeLineItems(raw: unknown): InvoiceLineItem[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const record = item as Record<string, unknown>;

      return {
        description:
          typeof record.description === "string" ? record.description : "",
        quantity: Math.max(Number(record.quantity) || 1, 1),
        price: Math.max(Number(record.price) || 0, 0),
      };
    })
    .filter((item): item is InvoiceLineItem => Boolean(item));
}

export function getInvoiceDescriptionTemplates(serviceType?: string) {
  return readStorage<InvoiceDescriptionTemplate>(
    INVOICE_DESCRIPTION_TEMPLATES_KEY
  )
    .filter((template) => !serviceType || template.serviceType === serviceType)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getInvoiceLineItemTemplates(serviceType?: string) {
  return readStorage<InvoiceLineItemTemplate>(INVOICE_LINE_ITEM_TEMPLATES_KEY)
    .map((template) => ({
      ...template,
      items: normalizeLineItems(template.items),
    }))
    .filter((template) => !serviceType || template.serviceType === serviceType)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveInvoiceDescriptionTemplate(
  template: Omit<InvoiceDescriptionTemplate, "id" | "createdAt">
) {
  const nextTemplate: InvoiceDescriptionTemplate = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...template,
  };

  const existing = getInvoiceDescriptionTemplates();
  writeStorage(INVOICE_DESCRIPTION_TEMPLATES_KEY, [nextTemplate, ...existing]);
  return nextTemplate;
}

export function saveInvoiceLineItemTemplate(
  template: Omit<InvoiceLineItemTemplate, "id" | "createdAt">
) {
  const nextTemplate: InvoiceLineItemTemplate = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...template,
    items: normalizeLineItems(template.items),
  };

  const existing = getInvoiceLineItemTemplates();
  writeStorage(INVOICE_LINE_ITEM_TEMPLATES_KEY, [nextTemplate, ...existing]);
  return nextTemplate;
}
