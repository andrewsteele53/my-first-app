"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CUSTOMER_TYPES = ["Residential", "Commercial"] as const;
const LEAD_SOURCES = [
  "Facebook",
  "Google",
  "Referral",
  "Door to Door",
  "Repeat Customer",
  "Other",
] as const;
const SALES_STATUSES = [
  "New Lead",
  "Contacted",
  "Estimate Scheduled",
  "Quote Sent",
  "Won",
  "Lost",
  "Follow Up Later",
] as const;
const SORT_OPTIONS = [
  "Newest",
  "Oldest",
  "Follow-up Date",
  "Status",
] as const;

type CustomerType = (typeof CUSTOMER_TYPES)[number];
type LeadSource = (typeof LEAD_SOURCES)[number];
type SalesStatus = (typeof SALES_STATUSES)[number];
type SortOption = (typeof SORT_OPTIONS)[number];

type CustomerRow = {
  id: string;
  user_id: string;
  customer_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  company_name: string | null;
  customer_type: CustomerType;
  service_needed: string | null;
  lead_source: LeadSource;
  sales_status: SalesStatus;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type CustomerFormState = {
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  company_name: string;
  customer_type: CustomerType;
  service_needed: string;
  lead_source: LeadSource;
  sales_status: SalesStatus;
  follow_up_date: string;
  notes: string;
};

const EMPTY_FORM: CustomerFormState = {
  customer_name: "",
  phone: "",
  email: "",
  address: "",
  company_name: "",
  customer_type: "Residential",
  service_needed: "",
  lead_source: "Other",
  sales_status: "New Lead",
  follow_up_date: "",
  notes: "",
};

function toFormState(customer: CustomerRow): CustomerFormState {
  return {
    customer_name: customer.customer_name,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    address: customer.address ?? "",
    company_name: customer.company_name ?? "",
    customer_type: customer.customer_type,
    service_needed: customer.service_needed ?? "",
    lead_source: customer.lead_source,
    sales_status: customer.sales_status,
    follow_up_date: customer.follow_up_date ?? "",
    notes: customer.notes ?? "",
  };
}

function cleanOptional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTodayDateString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function getFollowUpState(customer: CustomerRow) {
  if (!customer.follow_up_date) return "none";
  const today = getTodayDateString();
  if (customer.follow_up_date < today) return "overdue";
  if (customer.follow_up_date === today) return "today";
  return "upcoming";
}

function getStatusClasses(status: SalesStatus) {
  switch (status) {
    case "Won":
      return "border-[rgba(46,125,90,0.18)] bg-[rgba(46,125,90,0.12)] text-[var(--color-success)]";
    case "Lost":
      return "border-[rgba(199,80,80,0.18)] bg-[rgba(199,80,80,0.12)] text-[var(--color-danger)]";
    case "Quote Sent":
    case "Estimate Scheduled":
      return "border-[rgba(183,121,31,0.2)] bg-[rgba(183,121,31,0.12)] text-[var(--color-warning)]";
    case "Contacted":
    case "Follow Up Later":
      return "border-[rgba(47,93,138,0.18)] bg-[rgba(47,93,138,0.1)] text-[var(--color-primary)]";
    default:
      return "border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]";
  }
}

function getContactHref(prefix: "tel" | "sms" | "mailto", value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? `${prefix}:${trimmed}` : undefined;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [leads, setLeads] = useState<
    { id: string; customer_id: string | null; full_name: string; service_type: string; status: string; created_at: string }[]
  >([]);
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [form, setForm] = useState<CustomerFormState>(EMPTY_FORM);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | SalesStatus>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | CustomerType>("All");
  const [sortBy, setSortBy] = useState<SortOption>("Newest");

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      setIsLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (userError || !user) {
        setError("Log in to view and manage your customers.");
        setCustomers([]);
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("id, customer_id, full_name, service_type, status, created_at")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (customersError) {
        setError(customersError.message);
        setCustomers([]);
      } else {
        setCustomers((data ?? []) as CustomerRow[]);
      }

      if (!leadsError) {
        setLeads((leadsData ?? []) as typeof leads);
      }

      setIsLoading(false);
    }

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const filteredCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return customers
      .filter((customer) => {
        if (statusFilter !== "All" && customer.sales_status !== statusFilter) {
          return false;
        }

        if (typeFilter !== "All" && customer.customer_type !== typeFilter) {
          return false;
        }

        if (!term) return true;

        return [
          customer.customer_name,
          customer.phone,
          customer.email,
          customer.address,
          customer.service_needed,
          customer.notes,
        ].some((value) => (value ?? "").toLowerCase().includes(term));
      })
      .sort((a, b) => {
        if (sortBy === "Oldest") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }

        if (sortBy === "Follow-up Date") {
          const aDate = a.follow_up_date || "9999-12-31";
          const bDate = b.follow_up_date || "9999-12-31";
          return aDate.localeCompare(bDate);
        }

        if (sortBy === "Status") {
          return a.sales_status.localeCompare(b.sales_status);
        }

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [customers, searchTerm, sortBy, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    const won = customers.filter((customer) => customer.sales_status === "Won").length;
    const lost = customers.filter((customer) => customer.sales_status === "Lost").length;
    const closed = won + lost;

    return {
      total: customers.length,
      newLeads: customers.filter((customer) => customer.sales_status === "New Lead").length,
      dueToday: customers.filter((customer) => getFollowUpState(customer) === "today").length,
      won,
      lost,
      closeRate: closed > 0 ? Math.round((won / closed) * 100) : null,
      overdue: customers.filter((customer) => getFollowUpState(customer) === "overdue").length,
    };
  }, [customers]);

  function updateForm<K extends keyof CustomerFormState>(
    key: K,
    value: CustomerFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateForm() {
    setEditingCustomer(null);
    setForm(EMPTY_FORM);
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(customer: CustomerRow) {
    setEditingCustomer(customer);
    setForm(toFormState(customer));
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  async function loadAfterChange(successMessage: string) {
    const { data, error: readError } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (readError) {
      setError(readError.message);
      return;
    }

    setCustomers((data ?? []) as CustomerRow[]);
    setMessage(successMessage);
  }

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setError("Log in before saving customers.");
      return;
    }

    if (!form.customer_name.trim()) {
      setError("Customer name is required.");
      return;
    }

    setIsSaving(true);
    setError("");

    const payload = {
      user_id: userId,
      customer_name: form.customer_name.trim(),
      phone: cleanOptional(form.phone),
      email: cleanOptional(form.email),
      address: cleanOptional(form.address),
      company_name: cleanOptional(form.company_name),
      customer_type: form.customer_type,
      service_needed: cleanOptional(form.service_needed),
      lead_source: form.lead_source,
      sales_status: form.sales_status,
      follow_up_date: form.follow_up_date || null,
      notes: cleanOptional(form.notes),
    };

    const result = editingCustomer
      ? await supabase
          .from("customers")
          .update(payload)
          .eq("id", editingCustomer.id)
          .eq("user_id", userId)
      : await supabase.from("customers").insert(payload);

    if (result.error) {
      setError(result.error.message);
    } else {
      setIsFormOpen(false);
      setEditingCustomer(null);
      setForm(EMPTY_FORM);
      await loadAfterChange(editingCustomer ? "Customer updated." : "Customer saved.");
    }

    setIsSaving(false);
  }

  async function updateCustomer(customer: CustomerRow, updates: Partial<CustomerRow>) {
    setError("");
    const { error: updateError } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", customer.id)
      .eq("user_id", userId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadAfterChange("Customer updated.");
  }

  async function addNote(customer: CustomerRow) {
    const nextNote = window.prompt("Add a note for this customer:");
    if (!nextNote?.trim()) return;

    const stampedNote = `${new Date().toLocaleString()}: ${nextNote.trim()}`;
    const notes = customer.notes ? `${customer.notes}\n\n${stampedNote}` : stampedNote;
    await updateCustomer(customer, { notes });
  }

  async function deleteCustomer(customer: CustomerRow) {
    const shouldDelete = window.confirm(`Delete ${customer.customer_name}?`);
    if (!shouldDelete) return;

    setError("");
    const { error: deleteError } = await supabase
      .from("customers")
      .delete()
      .eq("id", customer.id)
      .eq("user_id", userId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadAfterChange("Customer deleted.");
  }

  return (
    <main className="us-page">
      <div className="us-shell space-y-6">
        <div>
          <Link href="/" className="us-link text-sm">
            Back to Dashboard
          </Link>
        </div>

        <section className="us-hero">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="us-kicker">Customers</p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--color-text)]">
                Sales Command Center
              </h1>
              <p className="mt-3 text-base leading-7 text-[var(--color-text-secondary)]">
                Save customer details, track follow-ups, and move every sale from
                first conversation to won work.
              </p>
            </div>

            <button type="button" onClick={openCreateForm} className="us-btn-primary">
              Add Customer
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: "Total Customers", value: summary.total },
            { label: "New Leads", value: summary.newLeads },
            { label: "Due Today", value: summary.dueToday },
            { label: "Won", value: summary.won },
            { label: "Lost", value: summary.lost },
            { label: "Close Rate", value: summary.closeRate === null ? "-" : `${summary.closeRate}%` },
          ].map((item) => (
            <div key={item.label} className="us-stat-card">
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        {summary.overdue > 0 ? (
          <div className="us-notice-danger text-sm font-semibold">
            {summary.overdue} customer follow-up{summary.overdue === 1 ? " is" : "s are"} overdue.
          </div>
        ) : null}

        {summary.dueToday > 0 ? (
          <div className="us-notice-warning text-sm font-semibold">
            {summary.dueToday} follow-up{summary.dueToday === 1 ? " is" : "s are"} due today.
          </div>
        ) : null}

        {message ? <div className="us-notice-success text-sm font-semibold">{message}</div> : null}
        {error ? <div className="us-notice-danger text-sm font-semibold">{error}</div> : null}

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, phone, email, address, service, or notes..."
              className="us-input"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "All" | SalesStatus)}
              className="us-input"
            >
              <option value="All">All Statuses</option>
              {SALES_STATUSES.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "All" | CustomerType)}
              className="us-input"
            >
              <option value="All">All Types</option>
              {CUSTOMER_TYPES.map((typeOption) => (
                <option key={typeOption} value={typeOption}>
                  {typeOption}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="us-input"
            >
              {SORT_OPTIONS.map((sortOption) => (
                <option key={sortOption} value={sortOption}>
                  Sort: {sortOption}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="us-kicker">Pipeline</p>
              <h2 className="mt-2 text-2xl font-extrabold">Customer Records</h2>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
              Showing {filteredCustomers.length} of {customers.length}
            </p>
          </div>

          {isLoading ? (
            <div className="mt-6 us-notice-info text-sm font-semibold">
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="mt-6 rounded-[1.4rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-8 text-center">
              <h3 className="text-xl font-extrabold">No customers yet.</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">
                No customers yet. Add your first customer from a call, ad,
                referral, or door-to-door sale.
              </p>
              <button type="button" onClick={openCreateForm} className="us-btn-primary mt-5">
                Add Customer
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {filteredCustomers.map((customer) => {
                const followUpState = getFollowUpState(customer);
                const callHref = getContactHref("tel", customer.phone);
                const textHref = getContactHref("sms", customer.phone);
                const emailHref = getContactHref("mailto", customer.email);
                const relatedLeads = leads.filter(
                  (lead) => lead.customer_id === customer.id
                );

                return (
                  <article
                    key={customer.id}
                    className="rounded-[1.4rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)]"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-2xl font-extrabold text-[var(--color-text)]">
                            {customer.customer_name}
                          </h3>
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(customer.sales_status)}`}>
                            {customer.sales_status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-[var(--color-text-secondary)]">
                          {customer.company_name || customer.customer_type}
                        </p>
                      </div>

                      {followUpState === "overdue" ? (
                        <span className="rounded-full border border-[rgba(199,80,80,0.22)] bg-[rgba(199,80,80,0.1)] px-3 py-1 text-xs font-extrabold text-[var(--color-danger)]">
                          Overdue
                        </span>
                      ) : followUpState === "today" ? (
                        <span className="rounded-full border border-[rgba(183,121,31,0.25)] bg-[rgba(183,121,31,0.12)] px-3 py-1 text-xs font-extrabold text-[var(--color-warning)]">
                          Today
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-[var(--color-text-secondary)] md:grid-cols-2">
                      <p><span className="font-bold text-[var(--color-text)]">Phone:</span> {customer.phone || "-"}</p>
                      <p><span className="font-bold text-[var(--color-text)]">Email:</span> {customer.email || "-"}</p>
                      <p><span className="font-bold text-[var(--color-text)]">Address:</span> {customer.address || "-"}</p>
                      <p><span className="font-bold text-[var(--color-text)]">Source:</span> {customer.lead_source}</p>
                      <p><span className="font-bold text-[var(--color-text)]">Service:</span> {customer.service_needed || "-"}</p>
                      <p><span className="font-bold text-[var(--color-text)]">Follow-up:</span> {formatDate(customer.follow_up_date)}</p>
                    </div>

                    <div className="mt-4 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-4">
                      <p className="text-sm font-bold text-[var(--color-text)]">Notes</p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--color-text-secondary)]">
                        {customer.notes || "No notes added."}
                      </p>
                    </div>

                    <div className="mt-4 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-4">
                      <p className="text-sm font-bold text-[var(--color-text)]">
                        Related Leads ({relatedLeads.length})
                      </p>
                      {relatedLeads.length === 0 ? (
                        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                          No linked leads yet.
                        </p>
                      ) : (
                        <div className="mt-3 grid gap-2">
                          {relatedLeads.slice(0, 3).map((lead) => (
                            <div
                              key={lead.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-sm"
                            >
                              <span className="font-semibold text-[var(--color-text)]">
                                {lead.full_name}
                              </span>
                              <span className="text-[var(--color-text-secondary)]">
                                {lead.service_type} / {lead.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold">Sales Status</label>
                        <select
                          value={customer.sales_status}
                          onChange={(event) =>
                            updateCustomer(customer, {
                              sales_status: event.target.value as SalesStatus,
                            })
                          }
                          className="us-input"
                        >
                          {SALES_STATUSES.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold">Follow-up Date</label>
                        <input
                          type="date"
                          value={customer.follow_up_date ?? ""}
                          onChange={(event) =>
                            updateCustomer(customer, {
                              follow_up_date: event.target.value || null,
                            })
                          }
                          className="us-input"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {callHref ? <a href={callHref} className="us-btn-secondary px-4 py-2 text-sm">Call</a> : null}
                      {textHref ? <a href={textHref} className="us-btn-secondary px-4 py-2 text-sm">Text</a> : null}
                      {emailHref ? <a href={emailHref} className="us-btn-secondary px-4 py-2 text-sm">Email</a> : null}
                      <Link href="/quotes" className="us-btn-secondary px-4 py-2 text-sm">
                        Create Quote
                      </Link>
                      <button type="button" onClick={() => addNote(customer)} className="us-btn-secondary px-4 py-2 text-sm">
                        Add Note
                      </button>
                      <button type="button" onClick={() => updateCustomer(customer, { sales_status: "Won" })} className="us-btn-success px-4 py-2 text-sm">
                        Mark Won
                      </button>
                      <button type="button" onClick={() => updateCustomer(customer, { sales_status: "Lost" })} className="us-btn-danger px-4 py-2 text-sm">
                        Mark Lost
                      </button>
                      <button type="button" onClick={() => openEditForm(customer)} className="us-btn-secondary px-4 py-2 text-sm">
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteCustomer(customer)} className="us-btn-danger px-4 py-2 text-sm">
                        Delete
                      </button>
                    </div>

                    <p className="mt-4 text-xs text-[var(--color-text-muted)]">
                      Created {formatDateTime(customer.created_at)}. Updated {formatDateTime(customer.updated_at)}.
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-6">
          <div className="mx-auto max-w-3xl rounded-[1.6rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="us-kicker">Customer Record</p>
                <h2 className="mt-2 text-2xl font-extrabold">
                  {editingCustomer ? "Edit Customer" : "Add Customer"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="us-btn-secondary min-h-0 px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <form onSubmit={saveCustomer} className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">Customer Name</label>
                <input
                  value={form.customer_name}
                  onChange={(event) => updateForm("customer_name", event.target.value)}
                  className="us-input"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Business / Company</label>
                <input
                  value={form.company_name}
                  onChange={(event) => updateForm("company_name", event.target.value)}
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Phone Number</label>
                <input
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value)}
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  className="us-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">Address</label>
                <input
                  value={form.address}
                  onChange={(event) => updateForm("address", event.target.value)}
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Customer Type</label>
                <select
                  value={form.customer_type}
                  onChange={(event) => updateForm("customer_type", event.target.value as CustomerType)}
                  className="us-input"
                >
                  {CUSTOMER_TYPES.map((typeOption) => (
                    <option key={typeOption} value={typeOption}>
                      {typeOption}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Lead Source</label>
                <select
                  value={form.lead_source}
                  onChange={(event) => updateForm("lead_source", event.target.value as LeadSource)}
                  className="us-input"
                >
                  {LEAD_SOURCES.map((sourceOption) => (
                    <option key={sourceOption} value={sourceOption}>
                      {sourceOption}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Sales Status</label>
                <select
                  value={form.sales_status}
                  onChange={(event) => updateForm("sales_status", event.target.value as SalesStatus)}
                  className="us-input"
                >
                  {SALES_STATUSES.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Follow-up Date</label>
                <input
                  type="date"
                  value={form.follow_up_date}
                  onChange={(event) => updateForm("follow_up_date", event.target.value)}
                  className="us-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">Service Needed</label>
                <input
                  value={form.service_needed}
                  onChange={(event) => updateForm("service_needed", event.target.value)}
                  className="us-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateForm("notes", event.target.value)}
                  className="us-textarea"
                />
              </div>

              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button type="submit" disabled={isSaving} className="us-btn-primary">
                  {isSaving ? "Saving..." : editingCustomer ? "Save Changes" : "Save Customer"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="us-btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
