export type InvoiceLineItem = {
  description: string;
  quantity: number;
  price: number;
};

export type PaymentStatus = "Paid" | "Unpaid";
export type InvoiceStatus = PaymentStatus | "Overdue";
export type PaymentMethod = "cash" | "card" | "check" | "other";

export type InvoiceRecord = {
  id: string;
  serviceType: string;
  invoiceNumber: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  projectTitle: string;
  notes: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  deposit: number;
  total: number;
  balanceDue: number;
  status?: InvoiceStatus;
  paymentStatus: PaymentStatus;
  payment_status?: PaymentStatus;
  paid_at?: string;
  paidDate: string;
  paymentMethod: PaymentMethod | "";
  paymentNotes: string;
  createdAt: string;
  quickbooks_invoice_id?: string;
  quickbooks_customer_id?: string;
  quickbooks_sync_status?: string;
  quickbooks_synced_at?: string;
  synced_at?: string;
  convertedFromQuoteId?: string;
  converted_from_quote_id?: string;
  details?: Record<string, string>;
  moveToTrashAfter?: string;
  trashedAt?: string;
  deleteAfter?: string;
};

export const INVOICE_STORAGE_KEY = "all_service_invoices_v1";
export const TRASH_STORAGE_KEY = "trashed_service_invoices_v1";
export const INVOICE_STORAGE_NOTICE =
  "Invoices are not permanently stored. Please download or print for your records.";

const SAVED_RETENTION_DAYS = 45;
const TRASH_RETENTION_DAYS = 30;

const LEGACY_SAVED_KEYS = [
  "savedInvoices",
  "saved_invoices",
  "saved_invoices_v1",
  "invoice_saved_items",
];

const LEGACY_TRASH_KEYS = [
  "trashedInvoices",
  "trashInvoices",
  "invoiceTrash",
  "invoice_trash",
  "invoice_trash_v1",
];

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

function readStorage(key: string): InvoiceRecord[] {
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

function writeStorage(key: string, value: InvoiceRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function clearLegacyStorage(keys: string[]) {
  if (typeof window === "undefined") return;

  for (const key of keys) {
    localStorage.removeItem(key);
  }
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

function normalizeDetails(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;

  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, value == null ? "" : String(value)])
  );
}

function buildInvoiceId(raw: Record<string, unknown>) {
  const existingId = raw.id;
  if (typeof existingId === "string" && existingId.trim()) return existingId;

  const invoiceNumber =
    typeof raw.invoiceNumber === "string" && raw.invoiceNumber.trim()
      ? raw.invoiceNumber.trim()
      : "invoice";

  const createdAt =
    typeof raw.createdAt === "string" && raw.createdAt.trim()
      ? raw.createdAt.trim()
      : new Date().toISOString();

  return `${invoiceNumber}-${createdAt}`;
}

function normalizeInvoiceRecord(
  raw: unknown,
  kind: "saved" | "trash"
): InvoiceRecord | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const record = raw as Record<string, unknown>;
  const createdAt = toIsoString(
    typeof record.createdAt === "string" ? record.createdAt : undefined
  );

  const moveToTrashAfter =
    typeof record.moveToTrashAfter === "string"
      ? toIsoString(record.moveToTrashAfter)
      : getFutureDate(SAVED_RETENTION_DAYS);

  const trashedAt =
    typeof record.trashedAt === "string"
      ? toIsoString(record.trashedAt)
      : typeof record.deletedAt === "string"
      ? toIsoString(record.deletedAt)
      : undefined;

  const deleteAfter =
    typeof record.deleteAfter === "string"
      ? toIsoString(record.deleteAfter)
      : kind === "trash"
      ? getFutureDate(TRASH_RETENTION_DAYS)
      : undefined;

  return {
    id: buildInvoiceId(record),
    serviceType:
      typeof record.serviceType === "string" ? record.serviceType : "Service Invoice",
    invoiceNumber:
      typeof record.invoiceNumber === "string" ? record.invoiceNumber : "",
    customerName:
      typeof record.customerName === "string"
        ? record.customerName
        : typeof record.clientName === "string"
        ? record.clientName
        : typeof record.companyName === "string"
        ? record.companyName
        : "",
    phone: typeof record.phone === "string" ? record.phone : "",
    email: typeof record.email === "string" ? record.email : "",
    address: typeof record.address === "string" ? record.address : "",
    projectTitle:
      typeof record.projectTitle === "string"
        ? record.projectTitle
        : typeof record.jobTitle === "string"
        ? record.jobTitle
        : "",
    notes: typeof record.notes === "string" ? record.notes : "",
    items: normalizeLineItems(record.items),
    subtotal: Number(record.subtotal) || 0,
    taxRate: Number(record.taxRate) || 0,
    taxAmount: Number(record.taxAmount) || 0,
    deposit: Number(record.deposit) || 0,
    total: Number(record.total ?? record.grandTotal) || 0,
    balanceDue: Number(record.balanceDue ?? record.total ?? record.grandTotal) || 0,
    status:
      record.status === "Paid" || record.status === "Unpaid" || record.status === "Overdue"
        ? record.status
        : record.paymentStatus === "Paid" || record.payment_status === "Paid"
        ? "Paid"
        : "Unpaid",
    paymentStatus: record.paymentStatus === "Paid" ? "Paid" : "Unpaid",
    payment_status:
      record.payment_status === "Paid" || record.payment_status === "Unpaid"
        ? record.payment_status
        : record.paymentStatus === "Paid"
        ? "Paid"
        : "Unpaid",
    paid_at:
      typeof record.paid_at === "string"
        ? record.paid_at
        : typeof record.paidDate === "string"
        ? record.paidDate
        : undefined,
    paidDate:
      typeof record.paidDate === "string" ? record.paidDate : "",
    paymentMethod:
      record.paymentMethod === "cash" ||
      record.paymentMethod === "card" ||
      record.paymentMethod === "check" ||
      record.paymentMethod === "other"
        ? record.paymentMethod
        : "",
    paymentNotes:
      typeof record.paymentNotes === "string" ? record.paymentNotes : "",
    createdAt,
    quickbooks_invoice_id:
      typeof record.quickbooks_invoice_id === "string"
        ? record.quickbooks_invoice_id
        : undefined,
    quickbooks_customer_id:
      typeof record.quickbooks_customer_id === "string"
        ? record.quickbooks_customer_id
        : undefined,
    quickbooks_sync_status:
      typeof record.quickbooks_sync_status === "string"
        ? record.quickbooks_sync_status
        : undefined,
    quickbooks_synced_at:
      typeof record.quickbooks_synced_at === "string"
        ? record.quickbooks_synced_at
        : undefined,
    synced_at:
      typeof record.synced_at === "string"
        ? record.synced_at
        : typeof record.quickbooks_synced_at === "string"
        ? record.quickbooks_synced_at
        : undefined,
    convertedFromQuoteId:
      typeof record.convertedFromQuoteId === "string"
        ? record.convertedFromQuoteId
        : typeof record.converted_from_quote_id === "string"
        ? record.converted_from_quote_id
        : undefined,
    converted_from_quote_id:
      typeof record.converted_from_quote_id === "string"
        ? record.converted_from_quote_id
        : typeof record.convertedFromQuoteId === "string"
        ? record.convertedFromQuoteId
        : undefined,
    details: normalizeDetails(record.details),
    moveToTrashAfter: kind === "saved" ? moveToTrashAfter : undefined,
    trashedAt: kind === "trash" ? trashedAt ?? new Date().toISOString() : undefined,
    deleteAfter: kind === "trash" ? deleteAfter : undefined,
  };
}

function dedupeInvoices(invoices: InvoiceRecord[]) {
  const seen = new Set<string>();

  return invoices.filter((invoice) => {
    const key = `${invoice.id}::${invoice.invoiceNumber}::${invoice.createdAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function migrateLegacyStorage() {
  if (typeof window === "undefined") return;

  const legacySaved = LEGACY_SAVED_KEYS.flatMap((key) =>
    readStorage(key)
      .map((invoice) => normalizeInvoiceRecord(invoice, "saved"))
      .filter((invoice): invoice is InvoiceRecord => Boolean(invoice))
  );

  const legacyTrash = LEGACY_TRASH_KEYS.flatMap((key) =>
    readStorage(key)
      .map((invoice) => normalizeInvoiceRecord(invoice, "trash"))
      .filter((invoice): invoice is InvoiceRecord => Boolean(invoice))
  );

  const canonicalSaved = readStorage(INVOICE_STORAGE_KEY)
    .map((invoice) => normalizeInvoiceRecord(invoice, "saved"))
    .filter((invoice): invoice is InvoiceRecord => Boolean(invoice));

  const canonicalTrash = readStorage(TRASH_STORAGE_KEY)
    .map((invoice) => normalizeInvoiceRecord(invoice, "trash"))
    .filter((invoice): invoice is InvoiceRecord => Boolean(invoice));

  const nextSaved = dedupeInvoices([...canonicalSaved, ...legacySaved]);
  const nextTrash = dedupeInvoices([...canonicalTrash, ...legacyTrash]);

  writeStorage(INVOICE_STORAGE_KEY, nextSaved);
  writeStorage(TRASH_STORAGE_KEY, nextTrash);

  clearLegacyStorage(LEGACY_SAVED_KEYS);
  clearLegacyStorage(LEGACY_TRASH_KEYS);
}

function cleanSavedInvoices(invoices: InvoiceRecord[]): InvoiceRecord[] {
  const now = Date.now();
  const active: InvoiceRecord[] = [];
  const toTrash: InvoiceRecord[] = [];

  for (const invoice of invoices) {
    const moveDate = invoice.moveToTrashAfter
      ? new Date(invoice.moveToTrashAfter).getTime()
      : null;

    if (moveDate && moveDate <= now) {
      toTrash.push({
        ...invoice,
        moveToTrashAfter: undefined,
        trashedAt: new Date().toISOString(),
        deleteAfter: getFutureDate(TRASH_RETENTION_DAYS),
      });
    } else {
      active.push(invoice);
    }
  }

  if (toTrash.length > 0 && typeof window !== "undefined") {
    const existingTrash = getTrashedInvoices();
    writeStorage(TRASH_STORAGE_KEY, dedupeInvoices([...toTrash, ...existingTrash]));
  }

  return active;
}

function cleanTrashedInvoices(invoices: InvoiceRecord[]): InvoiceRecord[] {
  return invoices.filter((invoice) => !isExpired(invoice.deleteAfter));
}

function readCanonicalSavedInvoices() {
  migrateLegacyStorage();

  return readStorage(INVOICE_STORAGE_KEY)
    .map((invoice) => normalizeInvoiceRecord(invoice, "saved"))
    .filter((invoice): invoice is InvoiceRecord => Boolean(invoice));
}

function readCanonicalTrashedInvoices() {
  migrateLegacyStorage();

  return readStorage(TRASH_STORAGE_KEY)
    .map((invoice) => normalizeInvoiceRecord(invoice, "trash"))
    .filter((invoice): invoice is InvoiceRecord => Boolean(invoice));
}

export function getSavedInvoices(): InvoiceRecord[] {
  const invoices = readCanonicalSavedInvoices();
  const cleaned = cleanSavedInvoices(dedupeInvoices(invoices));
  writeStorage(INVOICE_STORAGE_KEY, cleaned);
  return cleaned;
}

export function getTrashedInvoices(): InvoiceRecord[] {
  const invoices = readCanonicalTrashedInvoices();
  const cleaned = cleanTrashedInvoices(dedupeInvoices(invoices));
  writeStorage(TRASH_STORAGE_KEY, cleaned);
  return cleaned;
}

export function saveInvoiceRecord(invoice: InvoiceRecord) {
  const existing = getSavedInvoices();

  const record: InvoiceRecord = {
    ...invoice,
    status: invoice.status || invoice.paymentStatus || "Unpaid",
    paymentStatus: invoice.paymentStatus || "Unpaid",
    payment_status: invoice.payment_status || invoice.paymentStatus || "Unpaid",
    quickbooks_sync_status: invoice.quickbooks_sync_status || "Not Synced",
    createdAt: toIsoString(invoice.createdAt),
    moveToTrashAfter: getFutureDate(SAVED_RETENTION_DAYS),
    trashedAt: undefined,
    deleteAfter: undefined,
  };

  writeStorage(INVOICE_STORAGE_KEY, dedupeInvoices([record, ...existing]));
  return record;
}

export function updateSavedInvoiceRecord(
  id: string,
  update: Partial<InvoiceRecord>
) {
  const existing = getSavedInvoices();
  const next = existing.map((invoice) =>
    invoice.id === id ? { ...invoice, ...update } : invoice
  );
  writeStorage(INVOICE_STORAGE_KEY, next);
  return next;
}

export function moveInvoiceToTrash(id: string) {
  const saved = getSavedInvoices();
  const invoice = saved.find((item) => item.id === id);
  if (!invoice) return { saved, trash: getTrashedInvoices() };

  const updatedSaved = saved.filter((item) => item.id !== id);
  const trash = getTrashedInvoices();

  const trashedInvoice: InvoiceRecord = {
    ...invoice,
    moveToTrashAfter: undefined,
    trashedAt: new Date().toISOString(),
    deleteAfter: getFutureDate(TRASH_RETENTION_DAYS),
  };

  const nextTrash = dedupeInvoices([trashedInvoice, ...trash]);

  writeStorage(INVOICE_STORAGE_KEY, updatedSaved);
  writeStorage(TRASH_STORAGE_KEY, nextTrash);

  return { saved: updatedSaved, trash: nextTrash };
}

export function restoreInvoiceFromTrash(id: string) {
  const trash = getTrashedInvoices();
  const invoice = trash.find((item) => item.id === id);
  if (!invoice) return { saved: getSavedInvoices(), trash };

  const updatedTrash = trash.filter((item) => item.id !== id);
  const saved = getSavedInvoices();

  const restoredInvoice: InvoiceRecord = {
    ...invoice,
    moveToTrashAfter: getFutureDate(SAVED_RETENTION_DAYS),
    trashedAt: undefined,
    deleteAfter: undefined,
  };

  const nextSaved = dedupeInvoices([restoredInvoice, ...saved]);

  writeStorage(TRASH_STORAGE_KEY, updatedTrash);
  writeStorage(INVOICE_STORAGE_KEY, nextSaved);

  return { saved: nextSaved, trash: updatedTrash };
}

export function permanentlyDeleteInvoice(id: string) {
  const trash = getTrashedInvoices();
  const updatedTrash = trash.filter((item) => item.id !== id);
  writeStorage(TRASH_STORAGE_KEY, updatedTrash);
  return updatedTrash;
}

export function emptyInvoiceTrash() {
  writeStorage(TRASH_STORAGE_KEY, []);
  return [];
}

export function formatInvoiceCurrency(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getInvoicePaymentLabel(invoice: InvoiceRecord) {
  return invoice.paymentStatus === "Paid" ? "Paid" : "Unpaid";
}

export function getDaysUntilInvoiceTrash(moveToTrashAfter?: string) {
  if (!moveToTrashAfter) return SAVED_RETENTION_DAYS;

  const moveTime = new Date(moveToTrashAfter).getTime();
  if (Number.isNaN(moveTime)) return SAVED_RETENTION_DAYS;

  const msLeft = moveTime - Date.now();
  const days = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  return days > 0 ? days : 0;
}

export function getDaysUntilInvoiceDeletion(deleteAfter?: string) {
  if (!deleteAfter) return TRASH_RETENTION_DAYS;

  const deleteTime = new Date(deleteAfter).getTime();
  if (Number.isNaN(deleteTime)) return TRASH_RETENTION_DAYS;

  const msLeft = deleteTime - Date.now();
  const days = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  return days > 0 ? days : 0;
}
