"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AIAssistantPanel from "@/components/ai-assistant-panel";
import { createClient } from "@/lib/supabase/client";
import {
  getFollowUpsDueToday,
  getLeadStatusClasses,
  getSavedLeads,
  type LeadRecord,
  type LeadStatus,
} from "@/lib/leads";
import {
  DEFAULT_LEAD_SERVICE_TYPE,
  isLeadServiceType,
  LEAD_SERVICE_TYPES,
} from "@/lib/service-types";
import {
  CUSTOMER_FINDER_BUSINESS_TYPES,
  CUSTOMER_FINDER_COUNTS,
  CUSTOMER_FINDER_RADII,
  DEFAULT_CUSTOMER_FINDER_BUSINESS_TYPE,
  getDefaultCustomerFinderBusinessType,
  type CustomerFinderBusinessType,
} from "@/lib/customer-finder";

type CustomerOption = {
  id: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  company_name: string | null;
};

type LeadRow = {
  id: string;
  user_id: string;
  customer_id: string | null;
  full_name: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  area: string | null;
  service_type: string;
  service_needed: string | null;
  source: string | null;
  lead_source: string | null;
  status: LeadStatus;
  estimated_value: number;
  probability: number | null;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AreaSummary = {
  area: string;
  totalLeads: number;
  wonLeads: number;
  estimateSent: number;
  scheduledFollowUps: number;
  totalEstimatedValue: number;
};

type MappingArea = {
  id: string;
  name: string;
  homes: number;
  closeRate: number;
  estimatedSales: number;
  avgJobPrice: number;
  estimatedRevenue: number;
  doorsKnocked: number;
  actualSales: number;
  status: "Not Started" | "In Progress" | "Completed";
  notes: string;
  createdAt: string;
};

type CustomerFinderLead = {
  company_name: string;
  customer_type: string;
  recommended_service_need: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  weekday_hours: string;
  lead_source: "AI Customer Finder";
  status: "New";
  follow_up_date: string;
  notes: string;
};

const MAPPING_STORAGE_KEY = "sales_mapping_areas_v3";
const LOCAL_LEADS_IMPORT_KEY = "leads_database_v1_supabase_imported";

function cleanOptional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toLeadRecord(lead: LeadRow): LeadRecord {
  return {
    id: lead.id,
    customerId: lead.customer_id ?? "",
    fullName: lead.full_name,
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    address: lead.address ?? "",
    area: lead.area ?? "",
    serviceType: lead.service_type,
    status: lead.status,
    estimatedValue: Number(lead.estimated_value) || 0,
    followUpDate: lead.follow_up_date ?? "",
    reminderNote: "",
    notes: lead.notes ?? "",
    createdAt: lead.created_at,
  };
}

function formatInputDate(dateValue: string | null) {
  if (!dateValue) return "";
  return dateValue.slice(0, 10);
}

function getCustomerLabel(customer: CustomerOption) {
  return customer.company_name
    ? `${customer.customer_name} (${customer.company_name})`
    : customer.customer_name;
}

function getLeadProbability(status: LeadStatus) {
  switch (status) {
    case "Won":
      return 100;
    case "Lost":
      return 0;
    case "Estimate Sent":
      return 60;
    case "Contacted":
      return 25;
    default:
      return 10;
  }
}

function buildLeadNotes(notes: string, reminderNote: string) {
  const cleanNotes = notes.trim();
  const cleanReminder = reminderNote.trim();

  if (!cleanReminder) return cleanNotes || null;
  return cleanNotes
    ? `${cleanNotes}\n\nReminder: ${cleanReminder}`
    : `Reminder: ${cleanReminder}`;
}

function isPresentAiValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && normalized !== "n/a";
}

function formatCustomerFinderAddress(lead: CustomerFinderLead) {
  return [lead.address, lead.city, lead.state, lead.zip]
    .filter(isPresentAiValue)
    .join(", ");
}

function buildCustomerFinderNotes(
  lead: CustomerFinderLead,
  businessType: CustomerFinderBusinessType
) {
  return [
    `AI Customer Finder business type: ${businessType}`,
    `Customer type: ${lead.customer_type}`,
    `Recommended service need: ${lead.recommended_service_need}`,
    `Weekday hours: ${lead.weekday_hours}`,
    `City: ${lead.city}`,
    `State: ${lead.state}`,
    `Zip: ${lead.zip}`,
    `AI reason this may be a good lead: ${lead.notes}`,
    "AI-generated customer leads should be verified before outreach.",
  ]
    .filter((item) => item.trim().length > 0)
    .join("\n");
}

export default function LeadsPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [serviceType, setServiceType] = useState(DEFAULT_LEAD_SERVICE_TYPE);
  const [status, setStatus] = useState<LeadStatus>("New");
  const [estimatedValue, setEstimatedValue] = useState("150");
  const [followUpDate, setFollowUpDate] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [autoCreateCustomer, setAutoCreateCustomer] = useState(true);
  const [userId, setUserId] = useState("");
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [mappingAreas, setMappingAreas] = useState<MappingArea[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFinderOpen, setCustomerFinderOpen] = useState(false);
  const [customerFinderLocked, setCustomerFinderLocked] = useState(false);
  const [customerFinderBusinessType, setCustomerFinderBusinessType] =
    useState<CustomerFinderBusinessType>(DEFAULT_CUSTOMER_FINDER_BUSINESS_TYPE);
  const [customerFinderLocation, setCustomerFinderLocation] = useState("");
  const [customerFinderRadius, setCustomerFinderRadius] = useState("10");
  const [customerFinderCount, setCustomerFinderCount] = useState(5);
  const [customerFinderLeads, setCustomerFinderLeads] = useState<CustomerFinderLead[]>([]);
  const [selectedCustomerFinderLeads, setSelectedCustomerFinderLeads] = useState<number[]>([]);
  const [customerFinderMessage, setCustomerFinderMessage] = useState("");
  const [customerFinderError, setCustomerFinderError] = useState("");
  const [isCheckingCustomerFinderAccess, setIsCheckingCustomerFinderAccess] = useState(false);
  const [isGeneratingCustomerFinderLeads, setIsGeneratingCustomerFinderLeads] = useState(false);
  const [isImportingCustomerFinderLeads, setIsImportingCustomerFinderLeads] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const estimatedValueNumber = Number(estimatedValue) || 0;

  const loadData = useCallback(async (successMessage?: string) => {
    setError("");

    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: customersData, error: customersError } = await supabase
      .from("customers")
      .select("id, customer_name, phone, email, address, company_name")
      .order("customer_name", { ascending: true });

    const { data: mappingData } = await supabase
      .from("sales_mapping_areas")
      .select("id, name, homes, close_rate, estimated_sales, avg_job_price, estimated_revenue, doors_knocked, actual_sales, status, notes, created_at")
      .order("created_at", { ascending: false });

    if (leadsError) {
      setError(leadsError.message);
      setLeads([]);
    } else {
      setLeads((leadsData ?? []) as LeadRow[]);
    }

    if (customersError) {
      setError((current) => current || customersError.message);
      setCustomers([]);
    } else {
      setCustomers((customersData ?? []) as CustomerOption[]);
    }

    if (mappingData) {
      setMappingAreas(
        mappingData.map((item) => ({
          id: item.id as string,
          name: (item.name as string) || "",
          homes: Number(item.homes) || 0,
          closeRate: Number(item.close_rate) || 0,
          estimatedSales: Number(item.estimated_sales) || 0,
          avgJobPrice: Number(item.avg_job_price) || 0,
          estimatedRevenue: Number(item.estimated_revenue) || 0,
          doorsKnocked: Number(item.doors_knocked) || 0,
          actualSales: Number(item.actual_sales) || 0,
          status: (item.status as MappingArea["status"]) || "Not Started",
          notes: (item.notes as string) || "",
          createdAt: (item.created_at as string) || new Date().toISOString(),
        }))
      );
    } else {
      const rawMappingAreas = localStorage.getItem(MAPPING_STORAGE_KEY);
      if (rawMappingAreas) {
        try {
          setMappingAreas(JSON.parse(rawMappingAreas) as MappingArea[]);
        } catch {
          setMappingAreas([]);
        }
      }
    }

    if (successMessage) setMessage(successMessage);
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      setIsLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (userError || !user) {
        setError("Log in to view and manage your leads.");
        setIsLoading(false);
        return;
      }

      setUserId(user.id);
      await loadData();

      if (localStorage.getItem(LOCAL_LEADS_IMPORT_KEY) !== "true") {
        const localLeads = getSavedLeads();
        if (localLeads.length > 0) {
          await supabase.from("leads").upsert(
            localLeads.map((lead) => ({
              id: lead.id,
              user_id: user.id,
              full_name: lead.fullName,
              name: lead.fullName,
              phone: cleanOptional(lead.phone),
              email: cleanOptional(lead.email),
              address: cleanOptional(lead.address),
              area: cleanOptional(lead.area),
              service_type: lead.serviceType,
              service_needed: lead.serviceType,
              source: "Other",
              lead_source: "Other",
              status: lead.status,
              estimated_value: lead.estimatedValue,
              probability: getLeadProbability(lead.status),
              follow_up_date: cleanOptional(lead.followUpDate),
              notes: buildLeadNotes(lead.notes, lead.reminderNote),
              created_at: lead.createdAt,
            })),
            { onConflict: "id" }
          );
          await loadData("Existing local leads were linked to your account.");
        }
        localStorage.setItem(LOCAL_LEADS_IMPORT_KEY, "true");
      }

      setIsLoading(false);
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [loadData, supabase]);

  const leadRecords = useMemo(() => leads.map(toLeadRecord), [leads]);

  const areaSuggestions = useMemo(() => {
    const uniqueNames = Array.from(
      new Set(mappingAreas.map((mappingArea) => mappingArea.name.trim()).filter(Boolean))
    );

    return uniqueNames.sort((a, b) => a.localeCompare(b));
  }, [mappingAreas]);

  const filteredLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return leadRecords;

    return leadRecords.filter((lead) =>
      [
        lead.fullName,
        lead.phone,
        lead.email,
        lead.address,
        lead.area,
        lead.serviceType,
        lead.status,
        lead.notes,
        lead.reminderNote,
      ].some((value) => value.toLowerCase().includes(term))
    );
  }, [leadRecords, searchTerm]);

  const totalLeadValue = useMemo(
    () => filteredLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0),
    [filteredLeads]
  );
  const wonLeadsCount = useMemo(
    () => filteredLeads.filter((lead) => lead.status === "Won").length,
    [filteredLeads]
  );
  const estimateSentCount = useMemo(
    () => filteredLeads.filter((lead) => lead.status === "Estimate Sent").length,
    [filteredLeads]
  );
  const dueTodayCount = useMemo(
    () => getFollowUpsDueToday(filteredLeads).length,
    [filteredLeads]
  );

  const areaSummaries = useMemo(() => {
    const grouped = new Map<string, AreaSummary>();

    for (const lead of filteredLeads) {
      const key = lead.area.trim() || "Unassigned Area";
      const current =
        grouped.get(key) ??
        ({
          area: key,
          totalLeads: 0,
          wonLeads: 0,
          estimateSent: 0,
          scheduledFollowUps: 0,
          totalEstimatedValue: 0,
        } satisfies AreaSummary);

      current.totalLeads += 1;
      current.totalEstimatedValue += lead.estimatedValue;
      if (lead.status === "Won") current.wonLeads += 1;
      if (lead.status === "Estimate Sent") current.estimateSent += 1;
      if (lead.followUpDate) current.scheduledFollowUps += 1;
      grouped.set(key, current);
    }

    return Array.from(grouped.values()).sort(
      (a, b) => b.totalEstimatedValue - a.totalEstimatedValue
    );
  }, [filteredLeads]);

  function clearForm(clearMessage = true) {
    setFullName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setArea("");
    setServiceType(DEFAULT_LEAD_SERVICE_TYPE);
    setStatus("New");
    setEstimatedValue("150");
    setFollowUpDate("");
    setReminderNote("");
    setNotes("");
    setSelectedCustomerId("");
    setAutoCreateCustomer(true);

    if (clearMessage) setMessage("");
  }

  async function findOrCreateCustomer() {
    if (selectedCustomerId) return selectedCustomerId;
    if (!autoCreateCustomer) return null;

    const name = fullName.trim();
    if (!name) return null;

    const existing = customers.find(
      (customer) =>
        customer.customer_name.trim().toLowerCase() === name.toLowerCase() &&
        (customer.phone || "") === phone.trim()
    );

    if (existing) return existing.id;

    const { data, error: customerError } = await supabase
      .from("customers")
      .insert({
        user_id: userId,
        customer_name: name,
        phone: cleanOptional(phone),
        email: cleanOptional(email),
        address: cleanOptional(address),
        customer_type: "Residential",
        service_needed: cleanOptional(serviceType),
        lead_source: "Other",
        sales_status: status === "Won" ? "Won" : status === "Lost" ? "Lost" : "New Lead",
        follow_up_date: followUpDate || null,
        notes: cleanOptional(notes),
      })
      .select("id")
      .single();

    if (customerError) throw new Error(customerError.message);
    return data.id as string;
  }

  async function saveLead(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!userId) {
      setError("Log in before saving leads.");
      return;
    }

    if (!fullName.trim()) {
      setMessage("Enter a lead name first.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const customerId = await findOrCreateCustomer();
      const leadSource = "Other";
      const leadProbability = getLeadProbability(status);

      const { error: saveError } = await supabase.from("leads").insert({
        user_id: userId,
        customer_id: customerId,
        full_name: fullName.trim(),
        name: fullName.trim(),
        phone: cleanOptional(phone),
        email: cleanOptional(email),
        address: cleanOptional(address),
        area: cleanOptional(area),
        service_type: serviceType,
        service_needed: serviceType,
        source: leadSource,
        lead_source: leadSource,
        status,
        estimated_value: estimatedValueNumber,
        probability: leadProbability,
        follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : null,
        notes: buildLeadNotes(notes, reminderNote),
      });

      if (saveError) throw new Error(saveError.message);

      await loadData("Lead saved.");
      clearForm(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Lead could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteLead(id: string) {
    const { error: deleteError } = await supabase
      .from("leads")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadData("Lead deleted.");
  }

  async function updateLeadField(id: string, updates: Partial<LeadRow>) {
    const { error: updateError } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadData("Lead updated.");
  }

  function handlePrint() {
    window.print();
  }

  function appendAiTextToNotes(text: string) {
    setNotes((current) => (current ? `${current}\n\n${text}` : text));
  }

  function resetCustomerFinderPreview() {
    setCustomerFinderLeads([]);
    setSelectedCustomerFinderLeads([]);
    setCustomerFinderMessage("");
    setCustomerFinderError("");
  }

  async function openCustomerFinder() {
    setIsCheckingCustomerFinderAccess(true);
    resetCustomerFinderPreview();

    try {
      const accessResponse = await fetch("/api/billing/access");
      const accessData = (await accessResponse.json().catch(() => null)) as
        | { hasAiAccess?: boolean; error?: string }
        | null;

      if (!accessResponse.ok || !accessData?.hasAiAccess) {
        setCustomerFinderLocked(true);
        setCustomerFinderOpen(true);
        return;
      }

      const profileResponse = await fetch("/api/business-profile");
      const profileData = (await profileResponse.json().catch(() => null)) as
        | { profile?: { industry?: string | null; custom_industry?: string | null } | null }
        | null;

      const profileIndustry =
        profileData?.profile?.industry === "Other"
          ? profileData.profile.custom_industry
          : profileData?.profile?.industry;

      setCustomerFinderBusinessType(
        getDefaultCustomerFinderBusinessType(profileIndustry)
      );
      setCustomerFinderLocked(false);
      setCustomerFinderOpen(true);
    } catch (customerFinderAccessError) {
      setCustomerFinderLocked(true);
      setCustomerFinderOpen(true);
      setCustomerFinderError(
        customerFinderAccessError instanceof Error
          ? customerFinderAccessError.message
          : "Could not check AI Customer Finder access."
      );
    } finally {
      setIsCheckingCustomerFinderAccess(false);
    }
  }

  async function generateCustomerFinderLeads() {
    setIsGeneratingCustomerFinderLeads(true);
    setCustomerFinderError("");
    setCustomerFinderMessage("");

    try {
      const response = await fetch("/api/ai/customer-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: customerFinderBusinessType,
          location: customerFinderLocation,
          radius: customerFinderRadius,
          count: customerFinderCount,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { leads?: CustomerFinderLead[]; error?: string }
        | null;

      if (response.status === 403) {
        setCustomerFinderLocked(true);
        throw new Error("AI Customer Finder is available on the Pro plan.");
      }

      if (!response.ok) {
        throw new Error(data?.error || "Could not generate customer leads. Try again.");
      }

      const generatedLeads = Array.isArray(data?.leads) ? data.leads : [];
      setCustomerFinderLeads(generatedLeads);
      setSelectedCustomerFinderLeads(generatedLeads.map((_, index) => index));
      setCustomerFinderMessage(
        generatedLeads.length > 0
          ? "Review and select the customer leads you want to import."
          : "Could not generate customer leads. Try again."
      );
    } catch (customerFinderGenerateError) {
      setCustomerFinderError(
        customerFinderGenerateError instanceof Error
          ? customerFinderGenerateError.message
          : "Could not generate customer leads. Try again."
      );
    } finally {
      setIsGeneratingCustomerFinderLeads(false);
    }
  }

  function toggleCustomerFinderLead(index: number) {
    setSelectedCustomerFinderLeads((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  }

  function toggleAllCustomerFinderLeads() {
    setSelectedCustomerFinderLeads((current) =>
      current.length === customerFinderLeads.length
        ? []
        : customerFinderLeads.map((_, index) => index)
    );
  }

  async function importSelectedCustomerFinderLeads() {
    if (!userId) {
      setCustomerFinderError("Log in before importing customer leads.");
      return;
    }

    const selectedLeads = customerFinderLeads.filter((_, index) =>
      selectedCustomerFinderLeads.includes(index)
    );

    if (selectedLeads.length === 0) {
      setCustomerFinderError("No leads selected.");
      return;
    }

    setIsImportingCustomerFinderLeads(true);
    setCustomerFinderError("");
    setCustomerFinderMessage("");

    const rows = selectedLeads.map((lead) => {
      const customerName = isPresentAiValue(lead.company_name)
        ? lead.company_name
        : isPresentAiValue(lead.contact_name)
        ? lead.contact_name
        : "AI Customer Finder Lead";
      const addressValue = formatCustomerFinderAddress(lead);

      return {
        user_id: userId,
        full_name: customerName,
        name: customerName,
        phone: isPresentAiValue(lead.phone) ? lead.phone : null,
        email: isPresentAiValue(lead.email) ? lead.email : null,
        address: addressValue || null,
        service_type: customerFinderBusinessType,
        service_needed: lead.recommended_service_need,
        lead_source: lead.lead_source,
        status: lead.status as LeadStatus,
        estimated_value: 0,
        probability: getLeadProbability("New"),
        follow_up_date: lead.follow_up_date || null,
        notes: buildCustomerFinderNotes(lead, customerFinderBusinessType),
      };
    });

    const { error: importError } = await supabase.from("leads").insert(rows);

    if (importError) {
      setCustomerFinderError(importError.message);
      setIsImportingCustomerFinderLeads(false);
      return;
    }

    await loadData("Customer leads imported successfully.");
    setCustomerFinderMessage("Customer leads imported successfully.");
    setCustomerFinderLeads([]);
    setSelectedCustomerFinderLeads([]);
    setIsImportingCustomerFinderLeads(false);
  }

  return (
    <main className="us-page px-6 py-10 text-[var(--color-text)] print:bg-white print:px-0 print:py-0">
      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0.5in;
          }

          body {
            background: white !important;
          }

          .print-hide {
            display: none !important;
          }

          .print-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print-stack {
            display: block !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-7xl print:max-w-none">
        <div className="print-hide">
          <Link href="/" className="us-link text-sm">
            Back to Dashboard
          </Link>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] print-stack print:mt-0">
          <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-9 shadow-[var(--shadow-card)] print:rounded-none print:p-0 print:shadow-none">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Leads Database
            </p>

            <h1 className="mt-2 text-3xl font-bold">Lead Tracking</h1>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Store leads, pipeline status, follow-up dates, customer links, and
              notes in one contractor-friendly CRM view.
            </p>

            <div className="us-notice-info mt-3 text-sm print-hide">
              Area suggestions come from Sales Mapping. Customer links stay
              scoped to your logged-in account.
            </div>

            {error ? <div className="us-notice-danger mt-3 text-sm">{error}</div> : null}
            {message ? <p className="mt-4 text-sm font-semibold text-[var(--color-success)] print-hide">{message}</p> : null}

            <div className="print-hide mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openCustomerFinder}
                disabled={isCheckingCustomerFinderAccess}
                className="us-btn-primary"
              >
                {isCheckingCustomerFinderAccess
                  ? "Checking Access..."
                  : "Find Customers with AI"}
              </button>
              <button onClick={handlePrint} className="us-btn-primary">
                Print Page
              </button>
              <button onClick={handlePrint} className="us-btn-primary">
                Download PDF
              </button>
            </div>

            <form onSubmit={saveLead} className="print-hide mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">Link Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                  className="us-input"
                >
                  <option value="">Auto-create or leave unlinked</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {getCustomerLabel(customer)}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={autoCreateCustomer}
                  onChange={(event) => setAutoCreateCustomer(event.target.checked)}
                />
                Create customer automatically when no customer is selected
              </label>

              <div>
                <label className="mb-2 block text-sm font-semibold">Full Name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Smith" className="us-input" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="555-555-5555" className="us-input" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@email.com" className="us-input" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" className="us-input" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Area</label>
                <input list="mapping-area-suggestions" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Choose or type an area" className="us-input" />
                <datalist id="mapping-area-suggestions">
                  {areaSuggestions.map((areaNameOption) => (
                    <option key={areaNameOption} value={areaNameOption} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Service Type</label>
                <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="us-input">
                  {serviceType && !isLeadServiceType(serviceType) ? (
                    <option value={serviceType}>{serviceType}</option>
                  ) : null}
                  {LEAD_SERVICE_TYPES.map((serviceTypeOption) => (
                    <option key={serviceTypeOption} value={serviceTypeOption}>
                      {serviceTypeOption}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className="us-input">
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Estimate Sent">Estimate Sent</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Estimated Value ($)</label>
                <input type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} className="us-input" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Follow-Up Date</label>
                <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="us-input" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Reminder Note</label>
                <input value={reminderNote} onChange={(e) => setReminderNote(e.target.value)} placeholder="Call after 5 PM, text first, send estimate..." className="us-input" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Interested, wants quote next week, older gutters, prefers text message..." className="us-textarea min-h-[120px]" />
              </div>
              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button type="submit" disabled={isSaving || isLoading} className="us-btn-primary">
                  {isSaving ? "Saving..." : "Save Lead"}
                </button>
                <button type="button" onClick={() => clearForm()} className="us-btn-secondary">
                  Clear Form
                </button>
              </div>
            </form>

            <div className="print-hide mt-8">
              <AIAssistantPanel
                title="Lead AI Assistant"
                description="Turn rough lead notes into polished CRM summaries, follow-up messages, and next-step guidance without changing existing lead data unless you choose to insert it."
                category="lead"
                defaultAction="summarize_lead_notes"
                inputLabel="Lead notes or outreach context"
                inputPlaceholder="Example: No answer, house needs gutters, try again Friday"
                actions={[
                  { value: "summarize_lead_notes", label: "Summarize Notes", description: "Clean up rough notes into a CRM-style summary." },
                  { value: "follow_up_sms", label: "Follow-Up SMS", description: "Draft a short text follow-up." },
                  { value: "follow_up_email", label: "Follow-Up Email", description: "Draft a short follow-up email." },
                  { value: "call_script", label: "Call Script", description: "Generate a short phone script." },
                  { value: "next_best_action", label: "Next Best Action", description: "Recommend the best practical next step." },
                ]}
                promptSuggestions={[
                  { label: "Clean up rough notes", prompt: "No answer, house needs gutters, try again Friday", action: "summarize_lead_notes" },
                  { label: "Write a text follow-up", prompt: "Requested quote last week, seemed interested, preferred text", action: "follow_up_sms" },
                  { label: "Recommend next step", prompt: "Estimate sent already, no reply yet, exterior cleaning interest", action: "next_best_action" },
                ]}
                context={{ fullName, serviceType, status, area, estimatedValue: estimatedValueNumber, followUpDate, reminderNote, currentNotes: notes }}
                initialInput={notes}
                onInsertText={appendAiTextToNotes}
              />
            </div>

          </section>

          <aside className="space-y-6 print-hide">
            <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-bold">Quick Stats</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-600">Total Leads</span><span className="font-semibold">{filteredLeads.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-600">Won Leads</span><span className="font-semibold">{wonLeadsCount}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-600">Estimate Sent</span><span className="font-semibold">{estimateSentCount}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-600">Due Today</span><span className="font-semibold">{dueTodayCount}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-600">Customers</span><span className="font-semibold">{customers.length}</span></div>
                <div className="rounded-2xl bg-green-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-green-800">Total Lead Value</span>
                    <span className="text-lg font-bold text-green-800">${totalLeadValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-9 shadow-[var(--shadow-card)] print:mt-6 print:rounded-none print:p-0 print:shadow-none">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-3xl font-bold">Area Performance</h2>
            <div className="text-sm text-[var(--color-text-secondary)]">Use the same area name here as Sales Mapping.</div>
          </div>

          {areaSummaries.length === 0 ? (
            <p className="mt-4 text-[var(--color-text-secondary)]">No area data yet.</p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {areaSummaries.map((summary) => (
                <div key={summary.area} className="print-card rounded-[1.4rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-5">
                  <h3 className="text-xl font-bold">{summary.area}</h3>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-600">Total Leads</span><span className="font-semibold">{summary.totalLeads}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-600">Won Leads</span><span className="font-semibold">{summary.wonLeads}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-600">Estimate Sent</span><span className="font-semibold">{summary.estimateSent}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-600">Follow-Ups</span><span className="font-semibold">{summary.scheduledFollowUps}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-600">Est. Value</span><span className="font-semibold">${summary.totalEstimatedValue.toLocaleString()}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-9 shadow-[var(--shadow-card)] print:mt-6 print:rounded-none print:p-0 print:shadow-none">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-3xl font-bold">Saved Leads</h2>
            <div className="print-hide flex flex-wrap gap-3">
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search leads..." className="us-input max-w-[220px] px-4 py-2" />
              <button onClick={handlePrint} className="us-btn-primary px-4 py-2">Print Saved Leads</button>
              <button onClick={handlePrint} className="us-btn-primary px-4 py-2">Download Saved Leads PDF</button>
            </div>
          </div>

          {isLoading ? (
            <p className="mt-4 text-[var(--color-text-secondary)]">Loading leads...</p>
          ) : filteredLeads.length === 0 ? (
            <p className="mt-4 text-[var(--color-text-secondary)]">No saved leads yet.</p>
          ) : (
            <div className="mt-6 grid gap-4">
              {filteredLeads.map((lead) => {
                const customer = customers.find((item) => item.id === lead.customerId);
                return (
                  <div key={lead.id} className="print-card rounded-[1.4rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-bold">{lead.fullName}</h3>
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getLeadStatusClasses(lead.status)}`}>{lead.status}</span>
                        </div>
                        {customer ? <p className="mt-2 text-sm font-semibold text-[var(--color-primary)]">Linked customer: {getCustomerLabel(customer)}</p> : null}
                        <div className="mt-3 space-y-1 text-sm text-slate-600">
                          <p><span className="font-semibold text-slate-800">Phone:</span> {lead.phone || "-"}</p>
                          <p><span className="font-semibold text-slate-800">Email:</span> {lead.email || "-"}</p>
                          <p><span className="font-semibold text-slate-800">Address:</span> {lead.address || "-"}</p>
                          <p><span className="font-semibold text-slate-800">Area:</span> {lead.area || "-"}</p>
                          <p><span className="font-semibold text-slate-800">Service:</span> {lead.serviceType}</p>
                          <p><span className="font-semibold text-slate-800">Notes:</span> {lead.notes || "No notes added."}</p>
                          {lead.reminderNote ? <p><span className="font-semibold text-slate-800">Reminder:</span> {lead.reminderNote}</p> : null}
                        </div>
                        <p className="mt-3 text-xs text-slate-500">Saved on {new Date(lead.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</p>
                      </div>

                      <div className="grid min-w-[280px] gap-3 rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm">
                        <div className="flex items-center justify-between"><span className="text-slate-600">Estimated Value</span><span className="font-semibold">${lead.estimatedValue.toLocaleString()}</span></div>
                        <div className="print-hide">
                          <label className="mb-2 block text-sm font-semibold">Linked Customer</label>
                          <select value={lead.customerId} onChange={(e) => updateLeadField(lead.id, { customer_id: e.target.value || null })} className="us-input">
                            <option value="">No customer</option>
                            {customers.map((customerOption) => (
                              <option key={customerOption.id} value={customerOption.id}>{getCustomerLabel(customerOption)}</option>
                            ))}
                          </select>
                        </div>
                        <div className="print-hide">
                          <label className="mb-2 block text-sm font-semibold">Change Status</label>
                          <select value={lead.status} onChange={(e) => updateLeadField(lead.id, { status: e.target.value as LeadStatus })} className="us-input">
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Estimate Sent">Estimate Sent</option>
                            <option value="Won">Won</option>
                            <option value="Lost">Lost</option>
                          </select>
                        </div>
                        <div className="print-hide">
                          <label className="mb-2 block text-sm font-semibold">Service Type</label>
                          <select
                            value={lead.serviceType}
                            onChange={(e) =>
                              updateLeadField(lead.id, {
                                service_type: e.target.value,
                                service_needed: e.target.value,
                              })
                            }
                            className="us-input"
                          >
                            {lead.serviceType && !isLeadServiceType(lead.serviceType) ? (
                              <option value={lead.serviceType}>{lead.serviceType}</option>
                            ) : null}
                            {LEAD_SERVICE_TYPES.map((serviceTypeOption) => (
                              <option key={serviceTypeOption} value={serviceTypeOption}>
                                {serviceTypeOption}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="print-hide">
                          <label className="mb-2 block text-sm font-semibold">Follow-Up Date</label>
                          <input type="date" value={formatInputDate(lead.followUpDate)} onChange={(e) => updateLeadField(lead.id, { follow_up_date: e.target.value ? new Date(e.target.value).toISOString() : null })} className="us-input" />
                        </div>
                        <div className="print-hide">
                          <label className="mb-2 block text-sm font-semibold">Reminder Note</label>
                          <input value={lead.reminderNote} onChange={(e) => updateLeadField(lead.id, { notes: buildLeadNotes(lead.notes, e.target.value) })} className="us-input" />
                        </div>
                      </div>
                    </div>

                    <div className="print-hide mt-4">
                      <button onClick={() => deleteLead(lead.id)} className="us-btn-danger px-4 py-2">Delete Lead</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {customerFinderOpen ? (
          <div className="print-hide fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-6 backdrop-blur-sm md:items-center">
            <div className="w-full max-w-6xl rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl md:p-7">
              <div className="flex flex-col gap-4 border-b border-[var(--color-border-muted)] pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                    Find Customers with AI
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">AI Customer Finder</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                    Find potential customers based on your business type and service area.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomerFinderOpen(false)}
                  className="us-btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
              </div>

              {customerFinderLocked ? (
                <div className="mt-6 rounded-[1.4rem] border border-[rgba(47,93,138,0.18)] bg-[rgba(47,93,138,0.08)] p-6">
                  <h3 className="text-xl font-bold">
                    AI Customer Finder is available on the Pro plan.
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    Upgrade to Pro to generate potential customer leads for your service business.
                  </p>
                  {customerFinderError ? (
                    <div className="us-notice-danger mt-4 text-sm">
                      {customerFinderError}
                    </div>
                  ) : null}
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/subscribe" className="us-btn-primary">
                      Upgrade to Pro
                    </Link>
                    <button
                      type="button"
                      onClick={() => setCustomerFinderOpen(false)}
                      className="us-btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-6">
                  {customerFinderError ? (
                    <div className="us-notice-danger text-sm">
                      {customerFinderError}
                    </div>
                  ) : null}
                  {customerFinderMessage ? (
                    <div className="us-notice-info text-sm">
                      {customerFinderMessage}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Business Type
                      </label>
                      <select
                        value={customerFinderBusinessType}
                        onChange={(event) =>
                          setCustomerFinderBusinessType(
                            event.target.value as CustomerFinderBusinessType
                          )
                        }
                        className="us-input"
                      >
                        {CUSTOMER_FINDER_BUSINESS_TYPES.map((businessType) => (
                          <option key={businessType} value={businessType}>
                            {businessType}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Service Area / Location
                      </label>
                      <input
                        value={customerFinderLocation}
                        onChange={(event) =>
                          setCustomerFinderLocation(event.target.value)
                        }
                        placeholder="Hanover Park, IL"
                        className="us-input"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">Radius</label>
                      <select
                        value={customerFinderRadius}
                        onChange={(event) =>
                          setCustomerFinderRadius(event.target.value)
                        }
                        className="us-input"
                      >
                        {CUSTOMER_FINDER_RADII.map((radius) => (
                          <option key={radius} value={radius}>
                            {radius} miles
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Lead Count
                      </label>
                      <select
                        value={customerFinderCount}
                        onChange={(event) =>
                          setCustomerFinderCount(Number(event.target.value))
                        }
                        className="us-input"
                      >
                        {CUSTOMER_FINDER_COUNTS.map((countOption) => (
                          <option key={countOption} value={countOption}>
                            {countOption}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                    AI-generated customer leads should be verified before outreach.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={generateCustomerFinderLeads}
                      disabled={isGeneratingCustomerFinderLeads}
                      className="us-btn-primary"
                    >
                      {isGeneratingCustomerFinderLeads
                        ? `Finding ${customerFinderBusinessType} leads...`
                        : `Find ${customerFinderBusinessType} Leads`}
                    </button>
                    {customerFinderLeads.length > 0 ? (
                      <button
                        type="button"
                        onClick={generateCustomerFinderLeads}
                        disabled={isGeneratingCustomerFinderLeads}
                        className="us-btn-secondary"
                      >
                        Generate Again
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setCustomerFinderOpen(false)}
                      className="us-btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>

                  {customerFinderLeads.length > 0 ? (
                    <div className="overflow-hidden rounded-[1.4rem] border border-[var(--color-border)]">
                      <div className="flex flex-col gap-3 border-b border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 md:flex-row md:items-center md:justify-between">
                        <button
                          type="button"
                          onClick={toggleAllCustomerFinderLeads}
                          className="us-btn-secondary px-4 py-2"
                        >
                          {selectedCustomerFinderLeads.length ===
                          customerFinderLeads.length
                            ? "Clear Selection"
                            : "Select All"}
                        </button>
                        <button
                          type="button"
                          onClick={importSelectedCustomerFinderLeads}
                          disabled={isImportingCustomerFinderLeads}
                          className="us-btn-primary px-4 py-2"
                        >
                          {isImportingCustomerFinderLeads
                            ? "Importing selected leads..."
                            : "Import Selected Leads"}
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-left text-sm">
                          <thead className="bg-white text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                            <tr>
                              <th className="px-4 py-3">Select</th>
                              <th className="px-4 py-3">Company/customer name</th>
                              <th className="px-4 py-3">Customer type</th>
                              <th className="px-4 py-3">Recommended service need</th>
                              <th className="px-4 py-3">Phone</th>
                              <th className="px-4 py-3">Email</th>
                              <th className="px-4 py-3">Address</th>
                              <th className="px-4 py-3">Weekday hours</th>
                              <th className="px-4 py-3">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-border-muted)] bg-white">
                            {customerFinderLeads.map((lead, index) => (
                              <tr key={`${lead.company_name}-${index}`}>
                                <td className="px-4 py-3 align-top">
                                  <input
                                    type="checkbox"
                                    checked={selectedCustomerFinderLeads.includes(index)}
                                    onChange={() => toggleCustomerFinderLead(index)}
                                  />
                                </td>
                                <td className="px-4 py-3 align-top font-semibold text-[var(--color-text)]">
                                  {lead.company_name}
                                </td>
                                <td className="px-4 py-3 align-top">{lead.customer_type}</td>
                                <td className="px-4 py-3 align-top">
                                  {lead.recommended_service_need}
                                </td>
                                <td className="px-4 py-3 align-top">{lead.phone}</td>
                                <td className="px-4 py-3 align-top">{lead.email}</td>
                                <td className="px-4 py-3 align-top">
                                  {formatCustomerFinderAddress(lead) || "n/a"}
                                </td>
                                <td className="px-4 py-3 align-top">
                                  {lead.weekday_hours}
                                </td>
                                <td className="px-4 py-3 align-top">{lead.notes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
