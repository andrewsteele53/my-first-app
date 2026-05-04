"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  CustomerFinderBusinessType,
  CustomerFinderLead,
} from "@/lib/customer-finder";

type Props = {
  leads: CustomerFinderLead[];
  businessType: CustomerFinderBusinessType;
  onCancel: () => void;
  onGenerateAgain?: () => void;
  onImported?: (message: string) => void;
};

function isPresentAiValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && normalized !== "n/a";
}

function formatAddress(lead: CustomerFinderLead) {
  return [lead.address, lead.city, lead.state, lead.zip]
    .filter(isPresentAiValue)
    .join(", ");
}

function buildNotes(
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

export default function AILeadResultsTable({
  leads,
  businessType,
  onCancel,
  onGenerateAgain,
  onImported,
}: Props) {
  const [selectedIndexes, setSelectedIndexes] = useState(() =>
    leads.map((_, index) => index)
  );
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function toggleLead(index: number) {
    setSelectedIndexes((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  }

  function toggleAllLeads() {
    setSelectedIndexes((current) =>
      current.length === leads.length ? [] : leads.map((_, index) => index)
    );
  }

  async function importSelectedLeads() {
    const selectedLeads = leads.filter((_, index) =>
      selectedIndexes.includes(index)
    );

    if (selectedLeads.length === 0) {
      setError("No leads selected.");
      return;
    }

    setIsImporting(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Log in before importing customer leads.");
      setIsImporting(false);
      return;
    }

    const rows = selectedLeads.map((lead) => {
      const customerName = isPresentAiValue(lead.company_name)
        ? lead.company_name
        : isPresentAiValue(lead.contact_name)
        ? lead.contact_name
        : "AI Customer Finder Lead";

      return {
        user_id: user.id,
        full_name: customerName,
        name: customerName,
        phone: isPresentAiValue(lead.phone) ? lead.phone : null,
        email: isPresentAiValue(lead.email) ? lead.email : null,
        address: formatAddress(lead) || null,
        service_type: businessType,
        service_needed: lead.recommended_service_need,
        lead_source: lead.lead_source,
        status: lead.status,
        follow_up_date: lead.follow_up_date || null,
        estimated_value: 0,
        probability: 10,
        notes: buildNotes(lead, businessType),
      };
    });

    const { error: importError } = await supabase.from("leads").insert(rows);

    if (importError) {
      setError(importError.message);
      setIsImporting(false);
      return;
    }

    setMessage("Customer leads imported successfully.");
    setSelectedIndexes([]);
    setIsImporting(false);
    onImported?.("Customer leads imported successfully.");
  }

  return (
    <section className="mt-6 rounded-[1.6rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Batch Lead Results
          </p>
          <h2 className="mt-1 text-2xl font-bold text-[var(--color-text)]">
            AI Customer Leads
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            Review and select the customer leads you want to import. Verify AI-generated leads before outreach.
          </p>
        </div>
        <button type="button" onClick={onCancel} className="us-btn-secondary text-sm">
          Cancel
        </button>
      </div>

      {error ? <div className="us-notice-danger mt-4 text-sm">{error}</div> : null}
      {message ? <div className="us-notice-info mt-4 text-sm">{message}</div> : null}

      <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-[var(--color-border)]">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border-muted)] bg-[var(--color-section)] p-4 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={toggleAllLeads}
            className="us-btn-secondary px-4 py-2"
          >
            {selectedIndexes.length === leads.length ? "Clear Selection" : "Select All"}
          </button>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={importSelectedLeads}
              disabled={isImporting}
              className="us-btn-primary px-4 py-2"
            >
              {isImporting ? "Importing selected leads..." : "Import Selected Leads"}
            </button>
            {onGenerateAgain ? (
              <button
                type="button"
                onClick={onGenerateAgain}
                disabled={isImporting}
                className="us-btn-secondary px-4 py-2"
              >
                Generate Again
              </button>
            ) : null}
            <button type="button" onClick={onCancel} className="us-btn-secondary px-4 py-2">
              Cancel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-3">Select</th>
                <th className="px-4 py-3">Company/customer name</th>
                <th className="px-4 py-3">Customer Type</th>
                <th className="px-4 py-3">Recommended Service Need</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Weekday Hours</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-muted)] bg-white">
              {leads.map((lead, index) => (
                <tr key={`${lead.company_name}-${index}`}>
                  <td className="px-4 py-3 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIndexes.includes(index)}
                      onChange={() => toggleLead(index)}
                    />
                  </td>
                  <td className="px-4 py-3 align-top font-semibold text-[var(--color-text)]">
                    {lead.company_name}
                  </td>
                  <td className="px-4 py-3 align-top">{lead.customer_type}</td>
                  <td className="px-4 py-3 align-top">{lead.recommended_service_need}</td>
                  <td className="px-4 py-3 align-top">{lead.phone}</td>
                  <td className="px-4 py-3 align-top">{lead.email}</td>
                  <td className="px-4 py-3 align-top">{formatAddress(lead) || "n/a"}</td>
                  <td className="px-4 py-3 align-top">{lead.weekday_hours}</td>
                  <td className="px-4 py-3 align-top">{lead.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
