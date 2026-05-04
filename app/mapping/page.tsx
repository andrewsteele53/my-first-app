"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AIAssistantPanel from "@/components/ai-assistant-panel";
import { createClient } from "@/lib/supabase/client";

type AreaStatus = "Not Started" | "In Progress" | "Completed";

type LeadOption = {
  id: string;
  full_name: string;
  area: string | null;
  service_type: string;
  status: string;
  estimated_value: number;
  follow_up_date: string | null;
};

type Area = {
  id: string;
  user_id: string;
  lead_id: string | null;
  name: string;
  homes: number;
  close_rate: number;
  estimated_sales: number;
  avg_job_price: number;
  estimated_revenue: number;
  doors_knocked: number;
  actual_sales: number;
  status: AreaStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type LocalArea = {
  id: string;
  name: string;
  homes: number;
  closeRate: number;
  estimatedSales: number;
  avgJobPrice: number;
  estimatedRevenue: number;
  doorsKnocked: number;
  actualSales: number;
  status: AreaStatus;
  notes: string;
  createdAt: string;
};

const STORAGE_KEY = "sales_mapping_areas_v3";
const LOCAL_MAPPING_IMPORT_KEY = "sales_mapping_areas_v3_supabase_imported";

function cleanOptional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getLeadLabel(lead: LeadOption) {
  return `${lead.full_name} - ${lead.service_type}`;
}

export default function MappingPage() {
  const [areaName, setAreaName] = useState("");
  const [homes, setHomes] = useState("100");
  const [closeRate, setCloseRate] = useState("10");
  const [avgJobPrice, setAvgJobPrice] = useState("150");
  const [doorsKnocked, setDoorsKnocked] = useState("0");
  const [actualSales, setActualSales] = useState("0");
  const [status, setStatus] = useState<AreaStatus>("Not Started");
  const [notes, setNotes] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [userId, setUserId] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const homesNumber = Number(homes) || 0;
  const closeRateNumber = Number(closeRate) || 0;
  const avgJobPriceNumber = Number(avgJobPrice) || 0;
  const doorsKnockedNumber = Number(doorsKnocked) || 0;
  const actualSalesNumber = Number(actualSales) || 0;

  const estimatedSales = useMemo(
    () => Math.round(homesNumber * (closeRateNumber / 100)),
    [homesNumber, closeRateNumber]
  );
  const estimatedRevenue = useMemo(
    () => estimatedSales * avgJobPriceNumber,
    [estimatedSales, avgJobPriceNumber]
  );
  const actualRevenue = useMemo(
    () => actualSalesNumber * avgJobPriceNumber,
    [actualSalesNumber, avgJobPriceNumber]
  );

  const loadData = useCallback(async (successMessage?: string) => {
    setError("");

    const { data: areaData, error: areaError } = await supabase
      .from("sales_mapping_areas")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: leadData, error: leadError } = await supabase
      .from("leads")
      .select("id, full_name, area, service_type, status, estimated_value, follow_up_date")
      .order("created_at", { ascending: false });

    if (areaError) {
      setError(areaError.message);
      setAreas([]);
    } else {
      setAreas((areaData ?? []) as Area[]);
    }

    if (leadError) {
      setError((current) => current || leadError.message);
      setLeads([]);
    } else {
      setLeads((leadData ?? []) as LeadOption[]);
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
        setError("Log in to view and manage sales mapping.");
        setIsLoading(false);
        return;
      }

      setUserId(user.id);
      await loadData();

      if (localStorage.getItem(LOCAL_MAPPING_IMPORT_KEY) !== "true") {
        const rawAreas = localStorage.getItem(STORAGE_KEY);
        if (rawAreas) {
          try {
            const parsedAreas = JSON.parse(rawAreas) as LocalArea[];
            if (Array.isArray(parsedAreas) && parsedAreas.length > 0) {
              await supabase.from("sales_mapping_areas").upsert(
                parsedAreas.map((area) => ({
                  id: area.id,
                  user_id: user.id,
                  name: area.name,
                  homes: area.homes,
                  close_rate: area.closeRate,
                  estimated_sales: area.estimatedSales,
                  avg_job_price: area.avgJobPrice,
                  estimated_revenue: area.estimatedRevenue,
                  doors_knocked: area.doorsKnocked,
                  actual_sales: area.actualSales,
                  status: area.status,
                  notes: cleanOptional(area.notes),
                  created_at: area.createdAt,
                })),
                { onConflict: "id" }
              );
              await loadData("Existing local mapping areas were linked to your account.");
            }
          } catch {
            setError("Local mapping areas could not be imported.");
          }
        }
        localStorage.setItem(LOCAL_MAPPING_IMPORT_KEY, "true");
      }

      setIsLoading(false);
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [loadData, supabase]);

  function getAreaLeadStats(areaNameValue: string) {
    const normalizedArea = areaNameValue.trim().toLowerCase();
    const matchingLeads = leads.filter(
      (lead) => (lead.area || "").trim().toLowerCase() === normalizedArea
    );
    const totalLeads = matchingLeads.length;
    const wonLeads = matchingLeads.filter((lead) => lead.status === "Won").length;
    const estimateSentLeads = matchingLeads.filter(
      (lead) => lead.status === "Estimate Sent"
    ).length;
    const scheduledFollowUps = matchingLeads.filter((lead) =>
      Boolean(lead.follow_up_date)
    ).length;
    const totalLeadValue = matchingLeads.reduce(
      (sum, lead) => sum + (Number(lead.estimated_value) || 0),
      0
    );

    return { totalLeads, wonLeads, estimateSentLeads, scheduledFollowUps, totalLeadValue };
  }

  function clearForm(clearMessage = true) {
    setAreaName("");
    setHomes("100");
    setCloseRate("10");
    setAvgJobPrice("150");
    setDoorsKnocked("0");
    setActualSales("0");
    setStatus("Not Started");
    setNotes("");
    setSelectedLeadId("");
    if (clearMessage) setMessage("");
  }

  async function saveArea() {
    if (!userId) {
      setError("Log in before saving sales mapping.");
      return;
    }

    if (!areaName.trim()) {
      setMessage("Enter an area name first.");
      return;
    }

    setIsSaving(true);
    setError("");

    const { error: saveError } = await supabase.from("sales_mapping_areas").insert({
      user_id: userId,
      lead_id: selectedLeadId || null,
      name: areaName.trim(),
      homes: homesNumber,
      close_rate: closeRateNumber,
      estimated_sales: estimatedSales,
      avg_job_price: avgJobPriceNumber,
      estimated_revenue: estimatedRevenue,
      doors_knocked: doorsKnockedNumber,
      actual_sales: actualSalesNumber,
      status,
      notes: cleanOptional(notes),
    });

    if (saveError) {
      setError(saveError.message);
    } else {
      await loadData("Area saved.");
      clearForm(false);
    }

    setIsSaving(false);
  }

  async function updateArea(id: string, updates: Partial<Area>) {
    const { error: updateError } = await supabase
      .from("sales_mapping_areas")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadData("Area updated.");
  }

  async function deleteArea(id: string) {
    const { error: deleteError } = await supabase
      .from("sales_mapping_areas")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadData("Area deleted.");
  }

  function handlePrint() {
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
              Sales Mapping
            </p>
            <h1 className="mt-2 text-3xl font-bold">Door-to-Door Estimator</h1>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Estimate sales and revenue for each neighborhood, then link saved
              territory plans to real leads.
            </p>

            <div className="us-notice-info mt-4 text-sm">
              Mapping records and lead links are scoped to your logged-in
              account.
            </div>

            {error ? <div className="us-notice-danger mt-3 text-sm">{error}</div> : null}
            {message ? <p className="mt-4 text-sm font-semibold text-[var(--color-success)] print-hide">{message}</p> : null}

            <div className="print-hide mt-4 flex flex-wrap gap-3">
              <button onClick={handlePrint} className="us-btn-primary">Print Page</button>
              <button onClick={handlePrint} className="us-btn-primary">Download PDF</button>
            </div>

            <div className="print-hide mt-8 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">Link Lead</label>
                <select value={selectedLeadId} onChange={(e) => setSelectedLeadId(e.target.value)} className="us-input">
                  <option value="">No linked lead</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>{getLeadLabel(lead)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Area Name</label>
                <input value={areaName} onChange={(e) => setAreaName(e.target.value)} placeholder="Bloomingdale Zone 1" className="us-input" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Number of Homes</label>
                <input type="number" value={homes} onChange={(e) => setHomes(e.target.value)} className="us-input" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Expected Close Rate %</label>
                <input type="number" value={closeRate} onChange={(e) => setCloseRate(e.target.value)} className="us-input" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Avg Job Price ($)</label>
                <input type="number" value={avgJobPrice} onChange={(e) => setAvgJobPrice(e.target.value)} className="us-input" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Doors Knocked</label>
                <input type="number" value={doorsKnocked} onChange={(e) => setDoorsKnocked(e.target.value)} className="us-input" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Actual Sales</label>
                <input type="number" value={actualSales} onChange={(e) => setActualSales(e.target.value)} className="us-input" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as AreaStatus)} className="us-input">
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Estimated Sales</label>
                <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-section)] p-3 text-lg font-bold">{estimatedSales}</div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Estimated Revenue</label>
                <div className="rounded-2xl border border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.12)] p-3 text-lg font-bold text-[var(--color-success)]">${estimatedRevenue.toLocaleString()}</div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Actual Revenue</label>
                <div className="rounded-2xl border border-[rgba(47,93,138,0.2)] bg-[rgba(47,93,138,0.1)] p-3 text-lg font-bold text-[var(--color-primary)]">${actualRevenue.toLocaleString()}</div>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Older homes, lots of trees, visible overflow stains..." className="us-textarea min-h-[120px]" />
              </div>
            </div>

            <div className="print-hide mt-8">
              <AIAssistantPanel
                title="Mapping AI Assistant"
                description="Use AI to turn rough territory notes into route plans, target-zone observations, pitches, and action checklists while keeping your current mapping math untouched."
                category="mapping"
                defaultAction="summarize_territory_notes"
                inputLabel="Territory notes or route context"
                inputPlaceholder="Example: Older homes, lots of trees, visible overflow stains"
                actions={[
                  { value: "summarize_territory_notes", label: "Summarize Notes", description: "Turn territory notes into a concise field summary." },
                  { value: "route_plan", label: "Route Plan", description: "Organize the route into a practical sales plan." },
                  { value: "target_zone_observations", label: "Target Zones", description: "Highlight likely target-zone observations." },
                  { value: "door_pitch", label: "Door Pitch", description: "Write a short area-specific door pitch." },
                  { value: "next_action_checklist", label: "Action Checklist", description: "Turn rough notes into next actions." },
                ]}
                promptSuggestions={[
                  { label: "Summarize subdivision", prompt: "Older homes, lots of trees, visible overflow stains, strong gutter cleaning opportunity", action: "summarize_territory_notes" },
                  { label: "Write a pitch", prompt: "Subdivision with exterior wear and likely gutter issues", action: "door_pitch" },
                  { label: "Build a route plan", prompt: "Start on the tree-lined streets first, then cover the newer homes on the east side", action: "route_plan" },
                ]}
                context={{ areaName, homes: homesNumber, closeRate: closeRateNumber, avgJobPrice: avgJobPriceNumber, doorsKnocked: doorsKnockedNumber, actualSales: actualSalesNumber, status, notes, leadCount: leads.length }}
                initialInput={notes}
                onInsertText={appendAiTextToNotes}
              />
            </div>

            <div className="print-hide mt-8 flex flex-wrap gap-3">
              <button onClick={saveArea} disabled={isSaving || isLoading} className="us-btn-primary">{isSaving ? "Saving..." : "Save Area"}</button>
              <button onClick={() => clearForm()} className="us-btn-secondary">Clear Form</button>
            </div>
          </section>

          <aside className="space-y-6 print-hide">
            <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-bold">Quick Math</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-600">Homes</span><span className="font-semibold">{homesNumber}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-600">Close Rate</span><span className="font-semibold">{closeRateNumber}%</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-600">Avg Job Price</span><span className="font-semibold">${avgJobPriceNumber.toLocaleString()}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-600">Doors Knocked</span><span className="font-semibold">{doorsKnockedNumber}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-600">Actual Sales</span><span className="font-semibold">{actualSalesNumber}</span></div>
                <div className="rounded-2xl bg-slate-100 px-4 py-3"><div className="flex items-center justify-between"><span className="font-semibold">Projected Sales</span><span className="text-lg font-bold">{estimatedSales}</span></div></div>
                <div className="rounded-2xl bg-green-100 px-4 py-3"><div className="flex items-center justify-between"><span className="font-semibold text-green-800">Projected Revenue</span><span className="text-lg font-bold text-green-800">${estimatedRevenue.toLocaleString()}</span></div></div>
                <div className="rounded-2xl bg-blue-100 px-4 py-3"><div className="flex items-center justify-between"><span className="font-semibold text-blue-800">Actual Revenue</span><span className="text-lg font-bold text-blue-800">${actualRevenue.toLocaleString()}</span></div></div>
                <div className="rounded-2xl bg-slate-100 px-4 py-3"><div className="flex items-center justify-between"><span className="font-semibold text-slate-800">Total Saved Leads</span><span className="text-lg font-bold text-slate-800">{leads.length}</span></div></div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-9 shadow-[var(--shadow-card)] print:mt-6 print:rounded-none print:p-0 print:shadow-none">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-3xl font-bold">Saved Areas</h2>
            <div className="print-hide flex flex-wrap gap-3">
              <button onClick={handlePrint} className="us-btn-primary px-4 py-2">Print Saved Areas</button>
              <button onClick={handlePrint} className="us-btn-primary px-4 py-2">Download Saved Areas PDF</button>
            </div>
          </div>

          {isLoading ? (
            <p className="mt-4 text-slate-600">Loading saved areas...</p>
          ) : areas.length === 0 ? (
            <p className="mt-4 text-slate-600">No saved areas yet.</p>
          ) : (
            <div className="mt-6 grid gap-4">
              {areas.map((area) => {
                const leadStats = getAreaLeadStats(area.name);
                const linkedLead = leads.find((lead) => lead.id === area.lead_id);

                return (
                  <div key={area.id} className="print-card rounded-[1.4rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-bold">{area.name}</h3>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{area.status}</span>
                        </div>
                        {linkedLead ? <p className="mt-2 text-sm font-semibold text-[var(--color-primary)]">Linked lead: {getLeadLabel(linkedLead)}</p> : null}
                        <p className="mt-2 text-slate-600">{area.notes || "No notes added."}</p>
                        <p className="mt-3 text-xs text-slate-500">Saved on {new Date(area.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</p>
                      </div>

                      <div className="grid min-w-[280px] gap-2 rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm">
                        <div className="print-hide">
                          <label className="mb-2 block text-sm font-semibold">Linked Lead</label>
                          <select value={area.lead_id ?? ""} onChange={(event) => updateArea(area.id, { lead_id: event.target.value || null })} className="us-input">
                            <option value="">No linked lead</option>
                            {leads.map((lead) => (
                              <option key={lead.id} value={lead.id}>{getLeadLabel(lead)}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-between"><span className="text-slate-600">Homes</span><span className="font-semibold">{area.homes}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-600">Close Rate</span><span className="font-semibold">{area.close_rate}%</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-600">Avg Job Price</span><span className="font-semibold">${area.avg_job_price.toLocaleString()}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-600">Doors Knocked</span><span className="font-semibold">{area.doors_knocked}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-600">Actual Sales</span><span className="font-semibold">{area.actual_sales}</span></div>
                        <div className="flex items-center justify-between"><span className="font-semibold">Estimated Sales</span><span className="text-lg font-bold">{area.estimated_sales}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-600">Est. Revenue</span><span className="font-semibold">${area.estimated_revenue.toLocaleString()}</span></div>
                        <div className="flex items-center justify-between"><span className="text-slate-600">Actual Revenue</span><span className="font-semibold">${(area.actual_sales * area.avg_job_price).toLocaleString()}</span></div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-600">Area Leads</p><p className="mt-1 text-2xl font-bold text-slate-900">{leadStats.totalLeads}</p></div>
                      <div className="rounded-2xl bg-green-50 p-4"><p className="text-sm text-slate-600">Won Leads</p><p className="mt-1 text-2xl font-bold text-green-800">{leadStats.wonLeads}</p></div>
                      <div className="rounded-2xl bg-amber-50 p-4"><p className="text-sm text-slate-600">Estimate Sent</p><p className="mt-1 text-2xl font-bold text-amber-800">{leadStats.estimateSentLeads}</p></div>
                      <div className="rounded-2xl bg-blue-50 p-4"><p className="text-sm text-slate-600">Follow-Ups</p><p className="mt-1 text-2xl font-bold text-blue-800">{leadStats.scheduledFollowUps}</p></div>
                      <div className="rounded-2xl bg-slate-100 p-4"><p className="text-sm text-slate-600">Lead Value</p><p className="mt-1 text-2xl font-bold text-slate-900">${leadStats.totalLeadValue.toLocaleString()}</p></div>
                    </div>

                    <div className="print-hide mt-4">
                      <button onClick={() => deleteArea(area.id)} className="us-btn-danger px-4 py-2">Delete Area</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
