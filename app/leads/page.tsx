"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AIAssistantPanel from "@/components/ai-assistant-panel";
import {
  deleteLeadRecord,
  getFollowUpsDueToday,
  getLeadStatusClasses,
  getSavedLeads,
  saveLeadRecord,
  updateLeadRecord,
  type LeadRecord,
  type LeadStatus,
} from "@/lib/leads";

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

const MAPPING_STORAGE_KEY = "sales_mapping_areas_v3";
const FORTY_FIVE_DAYS_MS = 45 * 24 * 60 * 60 * 1000;

function isMappingAreaExpired(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return true;
  return Date.now() - createdTime > FORTY_FIVE_DAYS_MS;
}

function getActiveMappingAreas(areaList: MappingArea[]) {
  return areaList.filter((area) => !isMappingAreaExpired(area.createdAt));
}

function formatInputDate(dateValue: string) {
  if (!dateValue) return "";
  return dateValue.slice(0, 10);
}

export default function LeadsPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [serviceType, setServiceType] = useState("Gutter Cleaning");
  const [status, setStatus] = useState<LeadStatus>("New");
  const [estimatedValue, setEstimatedValue] = useState("150");
  const [followUpDate, setFollowUpDate] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [notes, setNotes] = useState("");
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [mappingAreas, setMappingAreas] = useState<MappingArea[]>([]);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLeads(getSavedLeads());

      const rawMappingAreas = localStorage.getItem(MAPPING_STORAGE_KEY);

      if (rawMappingAreas) {
        try {
          const parsedAreas = JSON.parse(rawMappingAreas) as MappingArea[];
          const filteredAreas = getActiveMappingAreas(parsedAreas);
          setMappingAreas(filteredAreas);
          localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(filteredAreas));
        } catch {
          setMappingAreas([]);
          localStorage.removeItem(MAPPING_STORAGE_KEY);
        }
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const estimatedValueNumber = Number(estimatedValue) || 0;

  const areaSuggestions = useMemo(() => {
    const uniqueNames = Array.from(
      new Set(
        mappingAreas.map((mappingArea) => mappingArea.name.trim()).filter(Boolean)
      )
    );

    return uniqueNames.sort((a, b) => a.localeCompare(b));
  }, [mappingAreas]);

  const filteredLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return leads;

    return leads.filter((lead) => {
      return (
        lead.fullName.toLowerCase().includes(term) ||
        lead.phone.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        lead.address.toLowerCase().includes(term) ||
        lead.area.toLowerCase().includes(term) ||
        lead.serviceType.toLowerCase().includes(term) ||
        lead.status.toLowerCase().includes(term) ||
        lead.notes.toLowerCase().includes(term) ||
        lead.reminderNote.toLowerCase().includes(term)
      );
    });
  }, [leads, searchTerm]);

  const totalLeadValue = useMemo(() => {
    return filteredLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
  }, [filteredLeads]);

  const wonLeadsCount = useMemo(() => {
    return filteredLeads.filter((lead) => lead.status === "Won").length;
  }, [filteredLeads]);

  const estimateSentCount = useMemo(() => {
    return filteredLeads.filter((lead) => lead.status === "Estimate Sent").length;
  }, [filteredLeads]);

  const dueTodayCount = useMemo(() => {
    return getFollowUpsDueToday(filteredLeads).length;
  }, [filteredLeads]);

  const areaSummaries = useMemo(() => {
    const grouped = new Map<string, AreaSummary>();

    for (const lead of filteredLeads) {
      const key = lead.area.trim() || "Unassigned Area";

      if (!grouped.has(key)) {
        grouped.set(key, {
          area: key,
          totalLeads: 0,
          wonLeads: 0,
          estimateSent: 0,
          scheduledFollowUps: 0,
          totalEstimatedValue: 0,
        });
      }

      const current = grouped.get(key)!;
      current.totalLeads += 1;
      current.totalEstimatedValue += lead.estimatedValue;

      if (lead.status === "Won") {
        current.wonLeads += 1;
      }

      if (lead.status === "Estimate Sent") {
        current.estimateSent += 1;
      }

      if (lead.followUpDate) {
        current.scheduledFollowUps += 1;
      }
    }

    return Array.from(grouped.values()).sort(
      (a, b) => b.totalEstimatedValue - a.totalEstimatedValue
    );
  }, [filteredLeads]);

  function refreshLeads(messageText?: string) {
    setLeads(getSavedLeads());
    if (messageText) {
      setMessage(messageText);
    }
  }

  function saveLead() {
    if (!fullName.trim()) {
      setMessage("Enter a lead name first.");
      return;
    }

    saveLeadRecord({
      id: crypto.randomUUID(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      area: area.trim(),
      serviceType,
      status,
      estimatedValue: estimatedValueNumber,
      followUpDate: followUpDate ? new Date(followUpDate).toISOString() : "",
      reminderNote: reminderNote.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    });

    refreshLeads("Lead saved.");
    clearForm(false);
  }

  function deleteLead(id: string) {
    setLeads(deleteLeadRecord(id));
    setMessage("Lead deleted.");
  }

  function updateLeadField(id: string, updates: Partial<LeadRecord>) {
    setLeads(updateLeadRecord(id, updates));
    setMessage("Lead updated.");
  }

  function clearForm(clearMessage = true) {
    setFullName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setArea("");
    setServiceType("Gutter Cleaning");
    setStatus("New");
    setEstimatedValue("150");
    setFollowUpDate("");
    setReminderNote("");
    setNotes("");

    if (clearMessage) {
      setMessage("");
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadPdf() {
    window.print();
  }

  function appendAiTextToNotes(text: string) {
    setNotes((current) => (current ? `${current}\n\n${text}` : text));
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
              Store leads, pipeline status, follow-up dates, and notes in one
              contractor-friendly CRM view.
            </p>

            <div className="us-notice-info mt-3 text-sm print-hide">
              Area suggestions below are pulled from your saved Mapping areas.
              Use those same names to keep territory tracking consistent.
            </div>

            <div className="print-hide mt-4 flex flex-wrap gap-3">
              <button onClick={handlePrint} className="us-btn-primary">
                Print Page
              </button>

              <button onClick={handleDownloadPdf} className="us-btn-primary">
                Download PDF
              </button>
            </div>

            <div className="print-hide mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Full Name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Smith"
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Phone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555-555-5555"
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@email.com"
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Address
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Area</label>
                <input
                  list="mapping-area-suggestions"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder={
                    areaSuggestions.length > 0
                      ? "Choose or type an area"
                      : "No mapping areas saved yet"
                  }
                  className="us-input"
                />
                <datalist id="mapping-area-suggestions">
                  {areaSuggestions.map((areaNameOption) => (
                    <option key={areaNameOption} value={areaNameOption} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Service Type
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="us-input"
                >
                  <option>Gutter Cleaning</option>
                  <option>Pressure Washing</option>
                  <option>Lawn Care</option>
                  <option>Handyman</option>
                  <option>Construction</option>
                  <option>Cleaning</option>
                  <option>Car Detailing</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  className="us-input"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Estimate Sent">Estimate Sent</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Estimated Value ($)
                </label>
                <input
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Follow-Up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Reminder Note
                </label>
                <input
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  placeholder="Call after 5 PM, text first, send estimate..."
                  className="us-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Interested, wants quote next week, older gutters, prefers text message..."
                  className="us-textarea min-h-[120px]"
                />
              </div>
            </div>

            <div className="print-hide mt-8">
              <AIAssistantPanel
                title="Lead AI Assistant"
                description="Turn rough lead notes into polished CRM summaries, follow-up messages, and next-step guidance without changing any existing lead data unless you choose to insert it."
                category="lead"
                defaultAction="summarize_lead_notes"
                inputLabel="Lead notes or outreach context"
                inputPlaceholder="Example: No answer, house needs gutters, try again Friday"
                actions={[
                  {
                    value: "summarize_lead_notes",
                    label: "Summarize Notes",
                    description: "Clean up rough notes into a CRM-style summary.",
                  },
                  {
                    value: "follow_up_sms",
                    label: "Follow-Up SMS",
                    description: "Draft a short text follow-up.",
                  },
                  {
                    value: "follow_up_email",
                    label: "Follow-Up Email",
                    description: "Draft a short follow-up email.",
                  },
                  {
                    value: "call_script",
                    label: "Call Script",
                    description: "Generate a short phone script.",
                  },
                  {
                    value: "next_best_action",
                    label: "Next Best Action",
                    description: "Recommend the best practical next step.",
                  },
                ]}
                promptSuggestions={[
                  {
                    label: "Clean up rough notes",
                    prompt: "No answer, house needs gutters, try again Friday",
                    action: "summarize_lead_notes",
                  },
                  {
                    label: "Write a text follow-up",
                    prompt: "Requested quote last week, seemed interested, preferred text",
                    action: "follow_up_sms",
                  },
                  {
                    label: "Recommend next step",
                    prompt: "Estimate sent already, no reply yet, exterior cleaning interest",
                    action: "next_best_action",
                  },
                ]}
                context={{
                  fullName,
                  serviceType,
                  status,
                  area,
                  estimatedValue: estimatedValueNumber,
                  followUpDate,
                  reminderNote,
                  currentNotes: notes,
                }}
                initialInput={notes}
                onInsertText={appendAiTextToNotes}
              />
            </div>

            <div className="print-hide mt-8 flex flex-wrap gap-3">
              <button onClick={saveLead} className="us-btn-primary">
                Save Lead
              </button>

              <button onClick={() => clearForm()} className="us-btn-secondary">
                Clear Form
              </button>
            </div>

            {message ? (
              <p className="mt-4 text-sm font-semibold text-[var(--color-success)] print-hide">
                {message}
              </p>
            ) : null}
          </section>

          <aside className="space-y-6 print-hide">
            <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-bold">Quick Stats</h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total Leads</span>
                  <span className="font-semibold">{filteredLeads.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Won Leads</span>
                  <span className="font-semibold">{wonLeadsCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Estimate Sent</span>
                  <span className="font-semibold">{estimateSentCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Due Today</span>
                  <span className="font-semibold">{dueTodayCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Mapped Areas</span>
                  <span className="font-semibold">{areaSuggestions.length}</span>
                </div>

                <div className="rounded-2xl bg-green-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-green-800">
                      Total Lead Value
                    </span>
                    <span className="text-lg font-bold text-green-800">
                      ${totalLeadValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </aside>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-9 shadow-[var(--shadow-card)] print:mt-6 print:rounded-none print:p-0 print:shadow-none">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-3xl font-bold">Area Performance</h2>

            <div className="text-sm text-[var(--color-text-secondary)]">
              Use the same area name here as your mapping page to keep territory
              tracking consistent.
            </div>
          </div>

          {areaSummaries.length === 0 ? (
            <p className="mt-4 text-[var(--color-text-secondary)]">No area data yet.</p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {areaSummaries.map((summary) => (
                <div
                  key={summary.area}
                  className="print-card rounded-[1.4rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-5"
                >
                  <h3 className="text-xl font-bold">{summary.area}</h3>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Total Leads</span>
                      <span className="font-semibold">{summary.totalLeads}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Won Leads</span>
                      <span className="font-semibold">{summary.wonLeads}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Estimate Sent</span>
                      <span className="font-semibold">{summary.estimateSent}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Follow-Ups</span>
                      <span className="font-semibold">
                        {summary.scheduledFollowUps}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Est. Value</span>
                      <span className="font-semibold">
                        ${summary.totalEstimatedValue.toLocaleString()}
                      </span>
                    </div>
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
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search leads..."
                className="us-input max-w-[220px] px-4 py-2"
              />

              <button onClick={handlePrint} className="us-btn-primary px-4 py-2">
                Print Saved Leads
              </button>

              <button
                onClick={handleDownloadPdf}
                className="us-btn-primary px-4 py-2"
              >
                Download Saved Leads PDF
              </button>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <p className="mt-4 text-[var(--color-text-secondary)]">No saved leads yet.</p>
          ) : (
            <div className="mt-6 grid gap-4">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="print-card rounded-[1.4rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-2xl font-bold">{lead.fullName}</h3>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getLeadStatusClasses(
                            lead.status
                          )}`}
                        >
                          {lead.status}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-800">Phone:</span>{" "}
                          {lead.phone || "-"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">Email:</span>{" "}
                          {lead.email || "-"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">Address:</span>{" "}
                          {lead.address || "-"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">Area:</span>{" "}
                          {lead.area || "-"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">Service:</span>{" "}
                          {lead.serviceType}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-800">Notes:</span>{" "}
                          {lead.notes || "No notes added."}
                        </p>
                        {lead.reminderNote ? (
                          <p>
                            <span className="font-semibold text-slate-800">
                              Reminder:
                            </span>{" "}
                            {lead.reminderNote}
                          </p>
                        ) : null}
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        Saved on{" "}
                        {new Date(lead.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="grid min-w-[280px] gap-3 rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Estimated Value</span>
                        <span className="font-semibold">
                          ${lead.estimatedValue.toLocaleString()}
                        </span>
                      </div>

                      <div className="print-hide">
                        <label className="mb-2 block text-sm font-semibold">
                          Change Status
                        </label>
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            updateLeadField(lead.id, {
                              status: e.target.value as LeadStatus,
                            })
                          }
                          className="us-input"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Estimate Sent">Estimate Sent</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </div>

                      <div className="print-hide">
                        <label className="mb-2 block text-sm font-semibold">
                          Follow-Up Date
                        </label>
                        <input
                          type="date"
                          value={formatInputDate(lead.followUpDate)}
                          onChange={(e) =>
                            updateLeadField(lead.id, {
                              followUpDate: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : "",
                            })
                          }
                          className="us-input"
                        />
                      </div>

                      <div className="print-hide">
                        <label className="mb-2 block text-sm font-semibold">
                          Reminder Note
                        </label>
                        <input
                          value={lead.reminderNote}
                          onChange={(e) =>
                            updateLeadField(lead.id, {
                              reminderNote: e.target.value,
                            })
                          }
                          className="us-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="print-hide mt-4">
                    <button
                      onClick={() => deleteLead(lead.id)}
                      className="us-btn-danger px-4 py-2"
                    >
                      Delete Lead
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
