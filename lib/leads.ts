export const LEADS_STORAGE_KEY = "leads_database_v1";

const FORTY_FIVE_DAYS_MS = 45 * 24 * 60 * 60 * 1000;

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Estimate Sent"
  | "Won"
  | "Lost";

export type LeadRecord = {
  id: string;
  customerId?: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  serviceType: string;
  status: LeadStatus;
  estimatedValue: number;
  followUpDate: string;
  reminderNote: string;
  notes: string;
  createdAt: string;
};

export type UpcomingFollowUp = {
  id: string;
  fullName: string;
  serviceType: string;
  area: string;
  followUpDate: string;
  reminderNote: string;
  status: LeadStatus;
};

function readStorage(): unknown[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(leads: LeadRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
}

function toLeadStatus(value: unknown): LeadStatus {
  if (value === "Won" || value === "Lost" || value === "New") return value;
  if (value === "Estimate Sent" || value === "Quoted") return "Estimate Sent";
  if (value === "Contacted" || value === "Follow Up") return "Contacted";
  return "New";
}

function toIsoDate(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function normalizeLead(raw: unknown): LeadRecord | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const record = raw as Record<string, unknown>;
  const createdAt = toIsoDate(record.createdAt) || new Date().toISOString();

  return {
    id:
      typeof record.id === "string" && record.id.trim()
        ? record.id
        : crypto.randomUUID(),
    customerId:
      typeof record.customerId === "string"
        ? record.customerId.trim()
        : typeof record.customer_id === "string"
        ? record.customer_id.trim()
        : "",
    fullName:
      typeof record.fullName === "string"
        ? record.fullName.trim()
        : typeof record.name === "string"
        ? record.name.trim()
        : "",
    phone: typeof record.phone === "string" ? record.phone.trim() : "",
    email: typeof record.email === "string" ? record.email.trim() : "",
    address: typeof record.address === "string" ? record.address.trim() : "",
    area: typeof record.area === "string" ? record.area.trim() : "",
    serviceType:
      typeof record.serviceType === "string" && record.serviceType.trim()
        ? record.serviceType.trim()
        : "Other",
    status: toLeadStatus(record.status),
    estimatedValue: Math.max(Number(record.estimatedValue) || 0, 0),
    followUpDate: toIsoDate(record.followUpDate),
    reminderNote:
      typeof record.reminderNote === "string" ? record.reminderNote.trim() : "",
    notes: typeof record.notes === "string" ? record.notes.trim() : "",
    createdAt,
  };
}

function isExpired(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return true;
  return Date.now() - createdTime > FORTY_FIVE_DAYS_MS;
}

function sortLeads(leads: LeadRecord[]) {
  return [...leads].sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

export function getSavedLeads(): LeadRecord[] {
  const leads = readStorage()
    .map(normalizeLead)
    .filter((lead): lead is LeadRecord => Boolean(lead))
    .filter((lead) => !isExpired(lead.createdAt));

  const sorted = sortLeads(leads);
  writeStorage(sorted);
  return sorted;
}

export function saveLeadRecord(lead: LeadRecord) {
  const existing = getSavedLeads();
  const next = sortLeads([lead, ...existing]);
  writeStorage(next);
  return lead;
}

export function updateLeadRecord(id: string, updates: Partial<LeadRecord>) {
  const next = getSavedLeads().map((lead) =>
    lead.id === id
      ? {
          ...lead,
          ...updates,
          status: updates.status ? toLeadStatus(updates.status) : lead.status,
          followUpDate:
            updates.followUpDate !== undefined
              ? toIsoDate(updates.followUpDate)
              : lead.followUpDate,
        }
      : lead
  );

  writeStorage(next);
  return next;
}

export function deleteLeadRecord(id: string) {
  const next = getSavedLeads().filter((lead) => lead.id !== id);
  writeStorage(next);
  return next;
}

export function getFollowUpsDueToday(leads: LeadRecord[]) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();

  return leads.filter((lead) => {
    if (!lead.followUpDate) return false;
    const followUp = new Date(lead.followUpDate);
    return (
      followUp.getFullYear() === year &&
      followUp.getMonth() === month &&
      followUp.getDate() === date
    );
  });
}

export function getUpcomingFollowUps(
  leads: LeadRecord[],
  limit = 5
): UpcomingFollowUp[] {
  return leads
    .filter((lead) => Boolean(lead.followUpDate))
    .sort(
      (a, b) =>
        new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime()
    )
    .slice(0, limit)
    .map((lead) => ({
      id: lead.id,
      fullName: lead.fullName,
      serviceType: lead.serviceType,
      area: lead.area,
      followUpDate: lead.followUpDate,
      reminderNote: lead.reminderNote,
      status: lead.status,
    }));
}

export function getLeadStatusClasses(status: LeadStatus) {
  switch (status) {
    case "Won":
      return "border-[rgba(46,125,90,0.18)] bg-[rgba(46,125,90,0.12)] text-[var(--color-success)]";
    case "Lost":
      return "border-[rgba(199,80,80,0.18)] bg-[rgba(199,80,80,0.12)] text-[var(--color-danger)]";
    case "Estimate Sent":
      return "border-[rgba(183,121,31,0.2)] bg-[rgba(183,121,31,0.12)] text-[var(--color-warning)]";
    case "Contacted":
      return "border-[rgba(47,93,138,0.18)] bg-[rgba(47,93,138,0.1)] text-[var(--color-primary)]";
    default:
      return "border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]";
  }
}
