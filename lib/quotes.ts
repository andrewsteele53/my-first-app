import {
  type InvoiceLineItem,
  type InvoiceRecord,
  formatInvoiceCurrency,
  saveInvoiceRecord,
} from "@/lib/invoices";
import { createInvoiceNumber } from "@/lib/invoice-ui";

export type QuoteStatus = "Draft" | "Sent" | "Approved" | "Rejected" | "Converted";

export type QuoteRecord = {
  id: string;
  quoteNumber: string;
  quoteType: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceAddress: string;
  projectTitle: string;
  notes: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: QuoteStatus;
  convertedInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
  moveToTrashAfter?: string;
  trashedAt?: string;
  deleteAfter?: string;
};

export const QUOTE_STORAGE_KEY = "all_service_quotes_v1";
export const QUOTE_TRASH_STORAGE_KEY = "trashed_service_quotes_v1";

const SAVED_RETENTION_DAYS = 45;
const TRASH_RETENTION_DAYS = 30;

function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function isExpired(dateString?: string): boolean {
  if (!dateString) return false;
  return new Date(dateString).getTime() <= Date.now();
}

function toIsoString(value?: string): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function readStorage(key: string): QuoteRecord[] {
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

function writeStorage(key: string, value: QuoteRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeLineItems(raw: unknown): InvoiceLineItem[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item) => {
    const lineItem = item as Partial<InvoiceLineItem>;

    return {
      description: typeof lineItem.description === "string" ? lineItem.description : "",
      quantity: Number(lineItem.quantity) || 0,
      price: Number(lineItem.price) || 0,
    };
  });
}

function normalizeStatus(status: unknown): QuoteStatus {
  return status === "Sent" ||
    status === "Approved" ||
    status === "Rejected" ||
    status === "Converted"
    ? status
    : "Draft";
}

function normalizeQuote(raw: unknown, kind: "saved" | "trash"): QuoteRecord | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const record = raw as Record<string, unknown>;
  const createdAt = toIsoString(
    typeof record.createdAt === "string" ? record.createdAt : undefined
  );
  const updatedAt = toIsoString(
    typeof record.updatedAt === "string" ? record.updatedAt : createdAt
  );
  const moveToTrashAfter =
    typeof record.moveToTrashAfter === "string"
      ? toIsoString(record.moveToTrashAfter)
      : getFutureDate(SAVED_RETENTION_DAYS);
  const trashedAt =
    typeof record.trashedAt === "string" ? toIsoString(record.trashedAt) : undefined;
  const deleteAfter =
    typeof record.deleteAfter === "string"
      ? toIsoString(record.deleteAfter)
      : kind === "trash"
      ? getFutureDate(TRASH_RETENTION_DAYS)
      : undefined;

  return {
    id: typeof record.id === "string" && record.id ? record.id : crypto.randomUUID(),
    quoteNumber: typeof record.quoteNumber === "string" ? record.quoteNumber : "",
    quoteType: typeof record.quoteType === "string" ? record.quoteType : "Service Quote",
    customerName: typeof record.customerName === "string" ? record.customerName : "",
    customerEmail: typeof record.customerEmail === "string" ? record.customerEmail : "",
    customerPhone: typeof record.customerPhone === "string" ? record.customerPhone : "",
    serviceAddress: typeof record.serviceAddress === "string" ? record.serviceAddress : "",
    projectTitle: typeof record.projectTitle === "string" ? record.projectTitle : "",
    notes: typeof record.notes === "string" ? record.notes : "",
    items: normalizeLineItems(record.items),
    subtotal: Number(record.subtotal) || 0,
    taxRate: Number(record.taxRate) || 0,
    taxAmount: Number(record.taxAmount) || 0,
    total: Number(record.total) || 0,
    status: normalizeStatus(record.status),
    convertedInvoiceId:
      typeof record.convertedInvoiceId === "string" ? record.convertedInvoiceId : undefined,
    createdAt,
    updatedAt,
    moveToTrashAfter: kind === "saved" ? moveToTrashAfter : undefined,
    trashedAt: kind === "trash" ? trashedAt ?? new Date().toISOString() : undefined,
    deleteAfter: kind === "trash" ? deleteAfter : undefined,
  };
}

function dedupeQuotes(quotes: QuoteRecord[]) {
  const seen = new Set<string>();

  return quotes.filter((quote) => {
    if (seen.has(quote.id)) return false;
    seen.add(quote.id);
    return true;
  });
}

function cleanSavedQuotes(quotes: QuoteRecord[]): QuoteRecord[] {
  const now = Date.now();
  const active: QuoteRecord[] = [];
  const toTrash: QuoteRecord[] = [];

  for (const quote of quotes) {
    const moveDate = quote.moveToTrashAfter
      ? new Date(quote.moveToTrashAfter).getTime()
      : null;

    if (moveDate && moveDate <= now) {
      toTrash.push({
        ...quote,
        moveToTrashAfter: undefined,
        trashedAt: new Date().toISOString(),
        deleteAfter: getFutureDate(TRASH_RETENTION_DAYS),
      });
    } else {
      active.push(quote);
    }
  }

  if (toTrash.length > 0 && typeof window !== "undefined") {
    writeStorage(QUOTE_TRASH_STORAGE_KEY, dedupeQuotes([...toTrash, ...getTrashedQuotes()]));
  }

  return active;
}

export function getSavedQuotes(): QuoteRecord[] {
  const quotes = readStorage(QUOTE_STORAGE_KEY)
    .map((quote) => normalizeQuote(quote, "saved"))
    .filter((quote): quote is QuoteRecord => Boolean(quote));
  const cleaned = cleanSavedQuotes(dedupeQuotes(quotes));
  writeStorage(QUOTE_STORAGE_KEY, cleaned);
  return cleaned;
}

export function getTrashedQuotes(): QuoteRecord[] {
  const quotes = readStorage(QUOTE_TRASH_STORAGE_KEY)
    .map((quote) => normalizeQuote(quote, "trash"))
    .filter((quote): quote is QuoteRecord => Boolean(quote))
    .filter((quote) => !isExpired(quote.deleteAfter));
  writeStorage(QUOTE_TRASH_STORAGE_KEY, quotes);
  return quotes;
}

export function saveQuoteRecord(quote: QuoteRecord) {
  const existing = getSavedQuotes().filter((item) => item.id !== quote.id);
  const record: QuoteRecord = {
    ...quote,
    createdAt: toIsoString(quote.createdAt),
    updatedAt: new Date().toISOString(),
    moveToTrashAfter: getFutureDate(SAVED_RETENTION_DAYS),
    trashedAt: undefined,
    deleteAfter: undefined,
  };

  writeStorage(QUOTE_STORAGE_KEY, dedupeQuotes([record, ...existing]));
  return record;
}

export function moveQuoteToTrash(id: string) {
  const saved = getSavedQuotes();
  const quote = saved.find((item) => item.id === id);
  if (!quote) return { saved, trash: getTrashedQuotes() };

  const updatedSaved = saved.filter((item) => item.id !== id);
  const trashedQuote: QuoteRecord = {
    ...quote,
    moveToTrashAfter: undefined,
    trashedAt: new Date().toISOString(),
    deleteAfter: getFutureDate(TRASH_RETENTION_DAYS),
  };
  const nextTrash = dedupeQuotes([trashedQuote, ...getTrashedQuotes()]);

  writeStorage(QUOTE_STORAGE_KEY, updatedSaved);
  writeStorage(QUOTE_TRASH_STORAGE_KEY, nextTrash);

  return { saved: updatedSaved, trash: nextTrash };
}

export function restoreQuoteFromTrash(id: string) {
  const trash = getTrashedQuotes();
  const quote = trash.find((item) => item.id === id);
  if (!quote) return { saved: getSavedQuotes(), trash };

  const updatedTrash = trash.filter((item) => item.id !== id);
  const restored: QuoteRecord = {
    ...quote,
    moveToTrashAfter: getFutureDate(SAVED_RETENTION_DAYS),
    trashedAt: undefined,
    deleteAfter: undefined,
  };
  const nextSaved = dedupeQuotes([restored, ...getSavedQuotes()]);

  writeStorage(QUOTE_TRASH_STORAGE_KEY, updatedTrash);
  writeStorage(QUOTE_STORAGE_KEY, nextSaved);

  return { saved: nextSaved, trash: updatedTrash };
}

export function permanentlyDeleteQuote(id: string) {
  const updatedTrash = getTrashedQuotes().filter((quote) => quote.id !== id);
  writeStorage(QUOTE_TRASH_STORAGE_KEY, updatedTrash);
  return updatedTrash;
}

export function emptyQuoteTrash() {
  writeStorage(QUOTE_TRASH_STORAGE_KEY, []);
  return [];
}

type ConvertQuoteOptions = {
  allowDuplicate?: boolean;
};

export function convertQuoteToInvoice(quoteId: string, options: ConvertQuoteOptions = {}) {
  const saved = getSavedQuotes();
  const quote = saved.find((item) => item.id === quoteId);
  if (!quote) return null;
  if (quote.status === "Converted" && quote.convertedInvoiceId && !options.allowDuplicate) {
    return null;
  }

  const invoice: InvoiceRecord = {
    id: crypto.randomUUID(),
    serviceType: quote.quoteType,
    invoiceNumber: createInvoiceNumber("INV"),
    customerName: quote.customerName,
    phone: quote.customerPhone,
    email: quote.customerEmail,
    address: quote.serviceAddress,
    projectTitle: quote.projectTitle,
    notes: quote.notes,
    items: quote.items,
    subtotal: quote.subtotal,
    taxRate: quote.taxRate,
    taxAmount: quote.taxAmount,
    deposit: 0,
    total: quote.total,
    balanceDue: quote.total,
    status: "Unpaid",
    paymentStatus: "Unpaid",
    payment_status: "Unpaid",
    quickbooks_sync_status: "Not Synced",
    paidDate: "",
    paymentMethod: "",
    paymentNotes: `Converted from quote ${quote.quoteNumber}`,
    createdAt: new Date().toISOString(),
    convertedFromQuoteId: quote.id,
    converted_from_quote_id: quote.id,
    details: {
      convertedFromQuoteId: quote.id,
      convertedFromQuoteNumber: quote.quoteNumber,
    },
  };
  const savedInvoice = saveInvoiceRecord(invoice);
  const updatedQuote = saveQuoteRecord({
    ...quote,
    status: "Converted",
    convertedInvoiceId: savedInvoice.id,
  });

  return { quote: updatedQuote, invoice: savedInvoice };
}

export { formatInvoiceCurrency };

export function getDaysUntilQuoteTrash(moveToTrashAfter?: string) {
  if (!moveToTrashAfter) return SAVED_RETENTION_DAYS;
  const days = Math.ceil(
    (new Date(moveToTrashAfter).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );
  return days > 0 ? days : 0;
}

export function getDaysUntilQuoteDeletion(deleteAfter?: string) {
  if (!deleteAfter) return TRASH_RETENTION_DAYS;
  const days = Math.ceil(
    (new Date(deleteAfter).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );
  return days > 0 ? days : 0;
}
