"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AIAssistantPanel from "@/components/ai-assistant-panel";
import { getSavedLeads, type LeadRecord } from "@/lib/leads";

type AreaStatus = "Not Started" | "In Progress" | "Completed";

type Area = {
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
const FORTY_FIVE_DAYS_MS = 45 * 24 * 60 * 60 * 1000;

function isAreaExpired(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) return true;
  return Date.now() - createdTime > FORTY_FIVE_DAYS_MS;
}

function getActiveAreas(areaList: Area[]) {
  return areaList.filter((area) => !isAreaExpired(area.createdAt));
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
  const [areas, setAreas] = useState<Area[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const rawAreas = localStorage.getItem(STORAGE_KEY);

      if (rawAreas) {
        try {
          const parsedAreas = JSON.parse(rawAreas) as Area[];
          const filteredAreas = getActiveAreas(parsedAreas);
          setAreas(filteredAreas);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredAreas));
        } catch {
          setAreas([]);
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      setLeads(getSavedLeads());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const homesNumber = Number(homes) || 0;
  const closeRateNumber = Number(closeRate) || 0;
  const avgJobPriceNumber = Number(avgJobPrice) || 0;
  const doorsKnockedNumber = Number(doorsKnocked) || 0;
  const actualSalesNumber = Number(actualSales) || 0;

  const estimatedSales = useMemo(() => {
    return Math.round(homesNumber * (closeRateNumber / 100));
  }, [homesNumber, closeRateNumber]);

  const estimatedRevenue = useMemo(() => {
    return estimatedSales * avgJobPriceNumber;
  }, [estimatedSales, avgJobPriceNumber]);

  const actualRevenue = useMemo(() => {
    return actualSalesNumber * avgJobPriceNumber;
  }, [actualSalesNumber, avgJobPriceNumber]);

  function saveArea() {
    if (!areaName.trim()) {
      setMessage("Enter an area name first.");
      return;
    }

    const newArea: Area = {
      id: crypto.randomUUID(),
      name: areaName.trim(),
      homes: homesNumber,
      closeRate: closeRateNumber,
      estimatedSales,
      avgJobPrice: avgJobPriceNumber,
      estimatedRevenue,
      doorsKnocked: doorsKnockedNumber,
      actualSales: actualSalesNumber,
      status,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newArea, ...getActiveAreas(areas)];

    setAreas(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setMessage("Area saved. Saved areas automatically delete after 45 days.");
    clearForm(false);
  }

  function deleteArea(id: string) {
    const updated = areas.filter((area) => area.id !== id);
    setAreas(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setMessage("Area deleted.");
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

  function getAreaLeadStats(areaNameValue: string) {
    const normalizedArea = areaNameValue.trim().toLowerCase();

    const matchingLeads = leads.filter(
      (lead) => lead.area.trim().toLowerCase() === normalizedArea
    );

    const totalLeads = matchingLeads.length;
    const wonLeads = matchingLeads.filter((lead) => lead.status === "Won").length;
    const estimateSentLeads = matchingLeads.filter(
      (lead) => lead.status === "Estimate Sent"
    ).length;
    const scheduledFollowUps = matchingLeads.filter((lead) =>
      Boolean(lead.followUpDate)
    ).length;
    const totalLeadValue = matchingLeads.reduce(
      (sum, lead) => sum + lead.estimatedValue,
      0
    );

    return {
      totalLeads,
      wonLeads,
      estimateSentLeads,
      scheduledFollowUps,
      totalLeadValue,
    };
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
              Estimate sales and revenue for each neighborhood, then compare
              saved territory plans against real lead activity.
            </p>

            <div className="us-notice-warning mt-4 text-sm">
              Saved areas automatically delete after 45 days. Users should print
              records or save them as a PDF for their own files, since this app
              is not responsible for long-term storage of saved mapping data.
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
                  Area Name
                </label>
                <input
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="Bloomingdale Zone 1"
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Number of Homes
                </label>
                <input
                  type="number"
                  value={homes}
                  onChange={(e) => setHomes(e.target.value)}
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Expected Close Rate %
                </label>
                <input
                  type="number"
                  value={closeRate}
                  onChange={(e) => setCloseRate(e.target.value)}
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Avg Job Price ($)
                </label>
                <input
                  type="number"
                  value={avgJobPrice}
                  onChange={(e) => setAvgJobPrice(e.target.value)}
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Doors Knocked
                </label>
                <input
                  type="number"
                  value={doorsKnocked}
                  onChange={(e) => setDoorsKnocked(e.target.value)}
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Actual Sales
                </label>
                <input
                  type="number"
                  value={actualSales}
                  onChange={(e) => setActualSales(e.target.value)}
                  className="us-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AreaStatus)}
                  className="us-input"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Estimated Sales
                </label>
                <div className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-section)] p-3 text-lg font-bold">
                  {estimatedSales}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Estimated Revenue
                </label>
                <div className="rounded-2xl border border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.12)] p-3 text-lg font-bold text-[var(--color-success)]">
                  ${estimatedRevenue.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Actual Revenue
                </label>
                <div className="rounded-2xl border border-[rgba(47,93,138,0.2)] bg-[rgba(47,93,138,0.1)] p-3 text-lg font-bold text-[var(--color-primary)]">
                  ${actualRevenue.toLocaleString()}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Older homes, lots of trees, visible overflow stains, strong gutter cleaning opportunity..."
                  className="us-textarea min-h-[120px]"
                />
              </div>
            </div>

            <div className="print-hide mt-8">
              <AIAssistantPanel
                title="Mapping AI Assistant"
                description="Use AI to turn rough territory notes into route plans, target-zone observations, pitches, and action checklists while keeping your current mapping math untouched."
                category="mapping"
                defaultAction="summarize_territory_notes"
                inputLabel="Territory notes or route context"
                inputPlaceholder="Example: Older homes, lots of trees, visible overflow stains, strong gutter cleaning opportunity"
                actions={[
                  {
                    value: "summarize_territory_notes",
                    label: "Summarize Notes",
                    description: "Turn territory notes into a concise field summary.",
                  },
                  {
                    value: "route_plan",
                    label: "Route Plan",
                    description: "Organize the route into a practical sales plan.",
                  },
                  {
                    value: "target_zone_observations",
                    label: "Target Zones",
                    description: "Highlight likely target-zone observations.",
                  },
                  {
                    value: "door_pitch",
                    label: "Door Pitch",
                    description: "Write a short area-specific door pitch.",
                  },
                  {
                    value: "next_action_checklist",
                    label: "Action Checklist",
                    description: "Turn rough notes into next actions.",
                  },
                ]}
                promptSuggestions={[
                  {
                    label: "Summarize subdivision",
                    prompt: "Older homes, lots of trees, visible overflow stains, strong gutter cleaning opportunity",
                    action: "summarize_territory_notes",
                  },
                  {
                    label: "Write a pitch",
                    prompt: "Subdivision with exterior wear and likely gutter issues",
                    action: "door_pitch",
                  },
                  {
                    label: "Build a route plan",
                    prompt:
                      "Start on the tree-lined streets first, then cover the newer homes on the east side",
                    action: "route_plan",
                  },
                ]}
                context={{
                  areaName,
                  homes: homesNumber,
                  closeRate: closeRateNumber,
                  avgJobPrice: avgJobPriceNumber,
                  doorsKnocked: doorsKnockedNumber,
                  actualSales: actualSalesNumber,
                  status,
                  notes,
                  leadCount: leads.length,
                }}
                initialInput={notes}
                onInsertText={appendAiTextToNotes}
              />
            </div>

            <div className="print-hide mt-8 flex flex-wrap gap-3">
              <button onClick={saveArea} className="us-btn-primary">
                Save Area
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
              <h2 className="text-2xl font-bold">Quick Math</h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Homes</span>
                  <span className="font-semibold">{homesNumber}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Close Rate</span>
                  <span className="font-semibold">{closeRateNumber}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Avg Job Price</span>
                  <span className="font-semibold">
                    ${avgJobPriceNumber.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Doors Knocked</span>
                  <span className="font-semibold">{doorsKnockedNumber}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Actual Sales</span>
                  <span className="font-semibold">{actualSalesNumber}</span>
                </div>

                <div className="rounded-2xl bg-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Projected Sales</span>
                    <span className="text-lg font-bold">{estimatedSales}</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-green-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-green-800">
                      Projected Revenue
                    </span>
                    <span className="text-lg font-bold text-green-800">
                      ${estimatedRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-blue-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-800">
                      Actual Revenue
                    </span>
                    <span className="text-lg font-bold text-blue-800">
                      ${actualRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      Total Saved Leads
                    </span>
                    <span className="text-lg font-bold text-slate-800">
                      {leads.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-bold">Storage Notice</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Saved mapping entries automatically delete after 45 days.</p>
                <p>Print your records or use Download PDF to save them.</p>
                <p>This app is not responsible for permanent file storage.</p>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-9 shadow-[var(--shadow-card)] print:mt-6 print:rounded-none print:p-0 print:shadow-none">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-3xl font-bold">Saved Areas</h2>

            <div className="print-hide flex flex-wrap gap-3">
              <button onClick={handlePrint} className="us-btn-primary px-4 py-2">
                Print Saved Areas
              </button>

              <button
                onClick={handleDownloadPdf}
                className="us-btn-primary px-4 py-2"
              >
                Download Saved Areas PDF
              </button>
            </div>
          </div>

          {areas.length === 0 ? (
            <p className="mt-4 text-slate-600">No saved areas yet.</p>
          ) : (
            <div className="mt-6 grid gap-4">
              {areas.map((area) => {
                const leadStats = getAreaLeadStats(area.name);

                return (
                  <div
                    key={area.id}
                    className="print-card rounded-[1.4rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-bold">{area.name}</h3>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {area.status}
                          </span>
                        </div>

                        <p className="mt-2 text-slate-600">
                          {area.notes || "No notes added."}
                        </p>

                        <p className="mt-3 text-xs text-slate-500">
                          Saved on{" "}
                          {new Date(area.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="grid min-w-[280px] gap-2 rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Homes</span>
                          <span className="font-semibold">{area.homes}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Close Rate</span>
                          <span className="font-semibold">{area.closeRate}%</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Avg Job Price</span>
                          <span className="font-semibold">
                            ${area.avgJobPrice.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Doors Knocked</span>
                          <span className="font-semibold">{area.doorsKnocked}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Actual Sales</span>
                          <span className="font-semibold">{area.actualSales}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Estimated Sales</span>
                          <span className="text-lg font-bold">
                            {area.estimatedSales}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Est. Revenue</span>
                          <span className="font-semibold">
                            ${area.estimatedRevenue.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Actual Revenue</span>
                          <span className="font-semibold">
                            $
                            {(area.actualSales * area.avgJobPrice).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-600">Area Leads</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {leadStats.totalLeads}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-green-50 p-4">
                        <p className="text-sm text-slate-600">Won Leads</p>
                        <p className="mt-1 text-2xl font-bold text-green-800">
                          {leadStats.wonLeads}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-amber-50 p-4">
                        <p className="text-sm text-slate-600">Estimate Sent</p>
                        <p className="mt-1 text-2xl font-bold text-amber-800">
                          {leadStats.estimateSentLeads}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-blue-50 p-4">
                        <p className="text-sm text-slate-600">Follow-Ups</p>
                        <p className="mt-1 text-2xl font-bold text-blue-800">
                          {leadStats.scheduledFollowUps}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-100 p-4">
                        <p className="text-sm text-slate-600">Lead Value</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          ${leadStats.totalLeadValue.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="print-hide mt-4">
                      <button
                        onClick={() => deleteArea(area.id)}
                        className="us-btn-danger px-4 py-2"
                      >
                        Delete Area
                      </button>
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
